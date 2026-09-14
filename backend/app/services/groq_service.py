import re
import json
import logging
from typing import Optional
from groq import AsyncGroq

from app.core.config import settings
from app.schemas.chat import QueryAnalysis

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert query understanding and intent classification router for the Bureau of Indian Standards (BIS) Assistant.
Analyze the user's message and categorize it into exactly ONE of the following 10 intents:

1. "general_bis": General questions about what BIS is, BIS organization, mandate, BIS Act 2016, national standards body role, portals.
2. "certification_process": General questions about the step-by-step process or procedure to get BIS certification, apply for ISI mark, licensing steps, audits, application on Manakonline without specifying a product.
3. "certification_requirement": Inquiries about certification schemes (e.g. Scheme I ISI Mark vs Scheme II CRS), voluntary vs mandatory status, or certification requirements for a specific product.
4. "standard_identification": Queries asking which Indian Standard (IS) code or specification applies to a product or material (e.g. "soap", "what is standard for diesel", "IS code for helmet").
5. "testing_requirement": Questions asking about laboratory test parameters, test methods, limits, chemical/physical requirements.
6. "laboratory": General questions about BIS laboratories, Central/Regional labs, testing facilities, Laboratory Recognition Scheme (LRS), sample testing.
7. "qco_requirement": Questions about Quality Control Orders (QCOs), mandatory certification lists, government notifications, Ministry orders.
8. "product_specific": Queries asking for specifications, composition, clauses, or details about a specific named product.
9. "document_search": Direct search or query mentioning a specific Indian Standard number (e.g. "IS 1460", "IS 2888:2004", "find IS 4984").
10. "hallmarking": Questions about gold or silver hallmarking, 6-digit HUID verification, purity grades (24K, 22K, 916, 18K, 750, 14K), 3 mandatory marks, IS 1417 (gold jewellery), IS 2112 (silver), BIS Care app hallmark check, jeweller registration, or mandatory hallmarking districts.
11. "unsupported": General chit-chat, greetings without substance, or questions completely unrelated to Indian Standards, products, or BIS certification (e.g. "What is the capital of France?", "tell me a joke").

CRITICAL ROUTING RULES FOR "needs_rag":
- "needs_rag" MUST be false for generic informational queries that do NOT ask for a specific product's standard, clauses, or test parameters:
  * "certification_process" without a specific product (e.g. "How do I get certification for products?", "How to apply for ISI mark?") -> needs_rag = false
  * "general_bis" (e.g. "What is BIS?", "What does Bureau of Indian Standards do?") -> needs_rag = false
  * "laboratory" when general (e.g. "Where can I find BIS approved laboratories?") -> needs_rag = false
  * "qco_requirement" when general (e.g. "What is a Quality Control Order?") -> needs_rag = false
  * "hallmarking" (e.g. "How to check HUID?", "What are the 3 marks on gold?", "What is 22K916?", "What are mandatory marks under IS 1417?") -> needs_rag = false
  * "unsupported" -> needs_rag = false
- "needs_rag" MUST be true whenever:
  * A specific industrial product or material is asked about (e.g. "pressure cooker", "soap", "water bottle", "cement", "diesel")
  * An Indian Standard code is mentioned for products other than hallmarking (e.g. "IS 1460", "IS 2888")
  * Intent is "standard_identification", "product_specific", or "document_search"
  * Intent is "testing_requirement" or "certification_requirement" AND a specific product or standard is mentioned.

TOPIC STATUS & ENTITY OVERRIDE RULES:
- "topic_status":
  * "continuation": The user query is directly continuing the inquiry about the active product/topic from the previous conversation turn (e.g. asking for its testing parameters, laboratories, mandatory status, licensing steps, documents, fees) WITHOUT introducing a new product or domain.
  * "new_topic": The user introduces a new product, category, industry, or starts a different subject (e.g. switching from packaged drinking water to alcohol/daru, soap, cement, steel, etc., or starting any new business inquiry).
  * "ambiguous": Unclear if continuing or switching topics.
- "use_previous_context": boolean
  * MUST be true STRICTLY when "topic_status" is "continuation".
  * MUST be false when "topic_status" is "new_topic" or "ambiguous".
- ENTITY OVERRIDE RULE:
  * If the user query introduces a new product or commodity (e.g. "daru", "liquor", "alcohol", "soap", "sabun", "cement", "pressure cooker"), "topic_status" MUST be "new_topic", "use_previous_context" MUST be false, and previous product context MUST NOT be inherited or mentioned under any circumstances!

Extract structured metadata into a JSON object with:
- "intent": One of the 11 intents listed above.
- "topic_status": "continuation", "new_topic", or "ambiguous".
- "use_previous_context": boolean (true strictly for continuation, false for new topic).
- "product": Name of the product or item (e.g. "toilet soap", "diesel", "gold jewellery"), or null if generic or none.
- "standard_number": Specific IS code mentioned by user (e.g. "IS 1460:2017", "IS 1417"), or null if none.
- "hsn_code": Specific HSN or ITC-HS code mentioned (e.g. "7615.10", "8517", "7113"), or null if none.
- "production_volume": Extracted factory production quantity or monthly units as an integer (e.g. 50000, 200000), or null if not specified.
- "huid_code": 6-digit alphanumeric Hallmark Unique Identification code if provided (e.g. "AB1234"), or null if none.
- "needs_rag": boolean (true if retrieval from BIS vector database is needed, false if general/predefined response is sufficient).
- "confidence": Float between 0.0 and 1.0 indicating classification confidence.
- "category": Industry category (e.g. "jewellery", "consumer product", "petroleum"), or null if none.
- "certification_needed": "yes", "no", "mandatory", "voluntary", or null.
- "response_mode": One of: "GENERAL_CONVERSATION", "PRODUCT_DISCOVERY", "STANDARD_IDENTIFICATION", "CERTIFICATION_GUIDANCE", "TESTING_GUIDANCE", "LABORATORY_GUIDANCE", "QCO_GUIDANCE", "DOCUMENT_GUIDANCE", "FOLLOW_UP".
- "language": Language code (e.g. "en", "hi").

Return ONLY a valid JSON object without any additional text.
"""

VALID_INTENTS = {
    "general_bis",
    "certification_process",
    "certification_requirement",
    "standard_identification",
    "testing_requirement",
    "laboratory",
    "qco_requirement",
    "product_specific",
    "document_search",
    "hallmarking",
    "unsupported",
}


class GroqService:
    """Service for query understanding and intent routing using Groq LLM API."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL
        self._client: Optional[AsyncGroq] = None

    @property
    def client(self) -> Optional[AsyncGroq]:
        """Lazy initialization of AsyncGroq client."""
        if self._client is None and self.api_key:
            try:
                self._client = AsyncGroq(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize AsyncGroq client: {e}")
        return self._client

    async def analyze_query(
        self,
        message: str,
        language: str = "en",
        conversation_context: Optional[Dict[str, Any]] = None,
    ) -> QueryAnalysis:
        """Analyze user message with Groq to classify intent, response mode, and extract structured metadata.
        Seamlessly incorporates prior conversation context for anaphoric follow-up queries.
        """
        if not self.api_key:
            logger.warning("GROQ_API_KEY not configured. Using rule-based fallback analysis.")
            return self._rule_based_fallback(message, language, conversation_context)

        try:
            client = self.client
            if not client:
                raise RuntimeError("Groq client not available")

            system_instruction = SYSTEM_PROMPT
            if conversation_context and (conversation_context.get("product") or conversation_context.get("standard_number")):
                system_instruction += (
                    f"\n\nACTIVE CONVERSATION CONTEXT:\n"
                    f"- Current Product: {conversation_context.get('product')}\n"
                    f"- Current Standard: {conversation_context.get('standard_number')}\n"
                    f"- Current Category: {conversation_context.get('category')}\n"
                    f"If the user query is a follow-up without explicitly naming a product (e.g. 'What tests are required?', "
                    f"'Is it mandatory?', 'Which lab can do this?', 'What documents do I need?'), infer the product and standard "
                    f"from this context, bind them in the JSON output, and set needs_rag=True."
                )

            logger.info(f"Sending query to Groq ({self.model}) for intent routing: '{message}'")
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": message},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )

            content = response.choices[0].message.content
            logger.debug(f"Groq raw response: {content}")

            data = json.loads(content)
            intent = data.get("intent", "general_bis")
            if intent not in VALID_INTENTS:
                intent = "general_bis"

            product = data.get("product")
            if product and str(product).strip().lower() in ("null", "none", ""):
                product = None
            elif product:
                product = str(product).strip()

            standard_number = data.get("standard_number")
            if standard_number and str(standard_number).strip().lower() in ("null", "none", ""):
                standard_number = None
            elif standard_number:
                standard_number = str(standard_number).strip()

            category = data.get("category")
            if category and str(category).strip().lower() in ("null", "none", ""):
                category = None
            elif category:
                category = str(category).strip()

            raw_topic_status = str(data.get("topic_status", "")).strip().lower()
            if raw_topic_status not in ("continuation", "new_topic", "ambiguous"):
                raw_topic_status = "continuation" if conversation_context and conversation_context.get("product") else "new_topic"

            raw_use_prev = data.get("use_previous_context")
            if raw_use_prev is None:
                use_prev_ctx = (raw_topic_status == "continuation")
            else:
                use_prev_ctx = bool(raw_use_prev) and (raw_topic_status == "continuation")

            # Deterministic rule guardrail: if message explicitly mentions a new product/domain
            from app.services.conversation_service import conversation_service, ConversationState
            temp_st = ConversationState(conversation_id="groq_guard")
            if conversation_context:
                temp_st.current_product = conversation_context.get("product")
                temp_st.product = conversation_context.get("product")
                temp_st.current_standard = conversation_context.get("standard_number")
                temp_st.standard_number = conversation_context.get("standard_number")
                temp_st.current_category = conversation_context.get("category")
                temp_st.category = conversation_context.get("category")

            rule_det = conversation_service.detect_topic_change(message, temp_st if conversation_context else None)
            if rule_det["topic_status"] == "new_topic":
                raw_topic_status = "new_topic"
                use_prev_ctx = False
                if rule_det.get("detected_product"):
                    product = rule_det["detected_product"]
            elif rule_det["topic_status"] == "continuation":
                raw_topic_status = "continuation"
                use_prev_ctx = True

            # Merge context ONLY if this is a validated continuation (use_prev_ctx is True)
            if use_prev_ctx:
                if not product and conversation_context and conversation_context.get("product"):
                    product = conversation_context.get("product")
                if not standard_number and conversation_context and conversation_context.get("standard_number"):
                    standard_number = conversation_context.get("standard_number")
                if not category and conversation_context and conversation_context.get("category"):
                    category = conversation_context.get("category")
            else:
                # Discard any old standard number or old product inherited from previous context
                if conversation_context:
                    old_std = conversation_context.get("standard_number")
                    if old_std and standard_number and (old_std.lower() in standard_number.lower() or standard_number.lower() in old_std.lower()):
                        standard_number = None
                    old_p = conversation_context.get("product")
                    if old_p and product and (old_p.lower() in product.lower() or product.lower() in old_p.lower()) and rule_det.get("detected_product"):
                        product = rule_det.get("detected_product")

            # Direct regex check for IS numbers in user message
            is_match = re.search(r"\bIS\s*(\d{2,6}(?::\d{4})?)\b", message, re.IGNORECASE)
            if is_match and not standard_number:
                standard_number = f"IS {is_match.group(1).upper()}"

            prod_vol = data.get("production_volume")
            if prod_vol is not None:
                try:
                    prod_vol = int(prod_vol)
                except (ValueError, TypeError):
                    prod_vol = None

            needs_rag = bool(data.get("needs_rag", False))
            confidence = float(data.get("confidence", 0.9))

            # Infer / validate response_mode
            raw_mode = data.get("response_mode")
            response_mode = raw_mode
            msg_lower = message.lower()
            if any(w in msg_lower for w in ["start", "bechana", "bechna", "business", "manufacture", "factory", "setup"]):
                response_mode = "PRODUCT_DISCOVERY"
            elif intent == "testing_requirement" or any(w in msg_lower for w in ["test", "testing", "parameter"]):
                response_mode = "TESTING_GUIDANCE"
            elif intent == "laboratory" or any(w in msg_lower for w in ["lab", "laboratory", "nabl"]):
                response_mode = "LABORATORY_GUIDANCE"
            elif intent == "qco_requirement" or any(w in msg_lower for w in ["mandatory", "qco", "compulsory"]):
                response_mode = "QCO_GUIDANCE"
            elif any(w in msg_lower for w in ["document", "paperwork", "form-v", "form 5"]):
                response_mode = "DOCUMENT_GUIDANCE"
            elif intent in ("standard_identification", "document_search"):
                response_mode = "STANDARD_IDENTIFICATION"
            elif intent in ("certification_process", "certification_requirement"):
                response_mode = "CERTIFICATION_GUIDANCE"
            elif not response_mode:
                response_mode = "GENERAL_CONVERSATION"

            # Deterministic post-processing rules for needs_rag
            if intent == "hallmarking":
                needs_rag = False
            elif product or standard_number:
                needs_rag = True
            elif intent in ("standard_identification", "product_specific", "document_search"):
                needs_rag = True
            elif intent in ("certification_process", "general_bis", "laboratory", "qco_requirement", "hallmarking", "unsupported") and not product and not standard_number:
                needs_rag = False

            return QueryAnalysis(
                intent=intent,
                topic_status=raw_topic_status,
                use_previous_context=use_prev_ctx,
                response_mode=response_mode,
                product=product,
                standard_number=standard_number,
                hsn_code=data.get("hsn_code"),
                production_volume=prod_vol,
                huid_code=data.get("huid_code"),
                needs_rag=needs_rag,
                confidence=confidence,
                material=data.get("material"),
                category=category if 'category' in locals() and category else data.get("category"),
                certification_needed=data.get("certification_needed"),
                language=data.get("language") or language,
            )

        except Exception as e:
            logger.error(f"Error during Groq query analysis: {e}", exc_info=True)
            return self._rule_based_fallback(message, language, conversation_context)

    def _rule_based_fallback(
        self,
        message: str,
        language: str = "en",
        conversation_context: Optional[Dict[str, Any]] = None,
    ) -> QueryAnalysis:
        """Deterministic rule-based fallback if Groq API is unavailable."""
        from app.services.conversation_service import conversation_service, ConversationState
        temp_state = ConversationState(conversation_id="fallback_temp")
        if conversation_context:
            temp_state.current_product = conversation_context.get("product")
            temp_state.product = conversation_context.get("product")
            temp_state.current_standard = conversation_context.get("standard_number")
            temp_state.standard_number = conversation_context.get("standard_number")
            temp_state.current_category = conversation_context.get("category")
            temp_state.category = conversation_context.get("category")

        topic_info = conversation_service.detect_topic_change(message, temp_state if conversation_context else None)
        topic_status = topic_info["topic_status"]
        use_prev_ctx = topic_info["use_previous_context"]

        msg_lower = message.lower().strip()
        context_prod = temp_state.product if use_prev_ctx else None
        context_std = temp_state.standard_number if use_prev_ctx else None
        detected_prod = topic_info.get("detected_product") or context_prod

        # Check for IS number
        is_match = re.search(r"\bIS\s*(\d{2,6}(?::\d{4})?)\b", message, re.IGNORECASE)
        if is_match:
            return QueryAnalysis(
                intent="document_search",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="STANDARD_IDENTIFICATION",
                product=context_prod,
                standard_number=f"IS {is_match.group(1).upper()}",
                needs_rag=True,
                confidence=0.85,
                language=language,
            )

        # Hallmarking & HUID query
        if any(w in msg_lower for w in ["hallmark", "huid", "916", "22k", "18k", "gold purity", "silver hallmark", "jeweller registration"]):
            return QueryAnalysis(
                intent="hallmarking",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                product="gold jewellery" if "silver" not in msg_lower else "silver",
                standard_number="IS 1417" if "silver" not in msg_lower else "IS 2112",
                needs_rag=False,
                confidence=0.9,
                language=language,
            )

        # Contextual testing follow-up
        if any(w in msg_lower for w in ["test", "testing", "parameter"]) and (context_prod or context_std):
            return QueryAnalysis(
                intent="testing_requirement",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="TESTING_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=True,
                confidence=0.9,
                language=language,
            )

        # Contextual mandatory / QCO follow-up
        if any(w in msg_lower for w in ["mandatory", "qco", "compulsory"]) and (context_prod or context_std):
            return QueryAnalysis(
                intent="qco_requirement",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="QCO_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=True,
                confidence=0.9,
                language=language,
            )

        # Contextual lab follow-up
        if any(w in msg_lower for w in ["lab", "laboratory"]) and (context_prod or context_std):
            return QueryAnalysis(
                intent="laboratory",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="LABORATORY_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=True,
                confidence=0.9,
                language=language,
            )

        # Contextual document follow-up
        if any(w in msg_lower for w in ["document", "paperwork", "form-v"]) and (context_prod or context_std):
            return QueryAnalysis(
                intent="certification_process",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="DOCUMENT_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=True,
                confidence=0.9,
                language=language,
            )

        # Business setup / product discovery query
        if any(w in msg_lower for w in ["start", "bechana", "bechna", "business", "manufacture"]):
            return QueryAnalysis(
                intent="standard_identification",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="PRODUCT_DISCOVERY",
                product=detected_prod or message.strip(),
                standard_number=context_std,
                needs_rag=True,
                confidence=0.85,
                language=language,
            )

        # Generic certification process query
        if any(w in msg_lower for w in ["how to get cert", "how do i get cert", "how to apply", "certification process", "procedure for isi", "get bis cert", "how does bis"]):
            return QueryAnalysis(
                intent="certification_process",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="CERTIFICATION_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=bool(context_prod or context_std),
                confidence=0.9,
                language=language,
            )

        # General BIS
        if any(w in msg_lower for w in ["what is bis", "about bis", "bureau of indian standards", "who is bis"]):
            return QueryAnalysis(
                intent="general_bis",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="GENERAL_CONVERSATION",
                product=None,
                standard_number=None,
                needs_rag=False,
                confidence=0.9,
                language=language,
            )

        # Lab query
        if any(w in msg_lower for w in ["laboratory", "laboratories", "lab recognition", "testing facility", "where to test"]):
            return QueryAnalysis(
                intent="laboratory",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="LABORATORY_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=bool(context_prod or context_std),
                confidence=0.85,
                language=language,
            )

        # QCO query
        if any(w in msg_lower for w in ["qco", "quality control order"]):
            return QueryAnalysis(
                intent="qco_requirement",
                topic_status=topic_status,
                use_previous_context=use_prev_ctx,
                response_mode="QCO_GUIDANCE",
                product=context_prod,
                standard_number=context_std,
                needs_rag=bool(context_prod or context_std),
                confidence=0.85,
                language=language,
            )

        # Default fallback: assume standard identification with RAG
        return QueryAnalysis(
            intent="standard_identification",
            topic_status=topic_status,
            use_previous_context=use_prev_ctx,
            response_mode="STANDARD_IDENTIFICATION",
            product=detected_prod or message.strip(),
            standard_number=context_std,
            needs_rag=True,
            confidence=0.5,
            language=language,
        )


# Global service instance
groq_service = GroqService()
