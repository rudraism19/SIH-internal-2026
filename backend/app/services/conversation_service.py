import time
import re
import logging
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ConversationState(BaseModel):
    """Structured conversation state tracking entities across multi-turn interactions."""
    conversation_id: str
    current_topic: Optional[str] = None
    current_product: Optional[str] = None
    current_category: Optional[str] = None
    current_standard: Optional[str] = None
    current_intent: Optional[str] = None
    # Synced legacy fields for backwards compatibility
    product: Optional[str] = None
    category: Optional[str] = None
    standard_number: Optional[str] = None
    standard_title: Optional[str] = None
    last_intent: Optional[str] = None
    last_response_mode: Optional[str] = None
    compliance_status: Optional[str] = None
    identified_standards: List[Dict[str, Any]] = Field(default_factory=list)
    history: List[Dict[str, str]] = Field(default_factory=list)
    updated_at: float = Field(default_factory=time.time)

    def reset_for_new_topic(
        self,
        new_product: Optional[str] = None,
        new_topic: Optional[str] = None,
        new_category: Optional[str] = None,
        new_standard: Optional[str] = None,
        new_intent: Optional[str] = None,
    ):
        """Completely purge previous product and standard context when user switches topic."""
        self.current_topic = new_topic or new_product or "new_topic"
        self.current_product = new_product
        self.current_category = new_category
        self.current_standard = new_standard
        self.current_intent = new_intent
        # Purge legacy fields
        self.product = new_product
        self.category = new_category
        self.standard_number = new_standard
        self.standard_title = None
        self.compliance_status = None
        self.identified_standards = []
        self.last_intent = new_intent
        self.updated_at = time.time()

    def record_turn(
        self,
        user_query: str,
        assistant_answer: str,
        response_mode: Optional[str] = None,
        standard_number: Optional[str] = None,
        product: Optional[str] = None,
        category: Optional[str] = None,
        identified_standards: Optional[List[Dict[str, Any]]] = None,
    ):
        """Record user and assistant exchange and update active entities."""
        if product:
            self.product = product
            self.current_product = product
            if not self.current_topic:
                self.current_topic = product
        if category:
            self.category = category
            self.current_category = category
        if standard_number:
            self.standard_number = standard_number
            self.current_standard = standard_number
        if response_mode:
            self.last_response_mode = response_mode
        if identified_standards is not None:
            self.identified_standards = identified_standards

        self.history.append({"role": "user", "text": user_query})
        self.history.append({"role": "assistant", "text": assistant_answer[:500]})
        if len(self.history) > 10:
            self.history = self.history[-10:]
        self.updated_at = time.time()

    def to_context_dict(self) -> Dict[str, Any]:
        """Convert state into a clean dictionary for prompt injection."""
        return {
            "current_topic": self.current_topic or self.current_product or self.product,
            "current_product": self.current_product or self.product,
            "current_category": self.current_category or self.category,
            "current_standard": self.current_standard or self.standard_number,
            "product": self.current_product or self.product,
            "category": self.current_category or self.category,
            "standard_number": self.current_standard or self.standard_number,
            "standard_title": self.standard_title,
            "last_intent": self.last_intent,
            "last_response_mode": self.last_response_mode,
            "compliance_status": self.compliance_status,
            "identified_standards": [s.get("standard_number") for s in self.identified_standards if s.get("standard_number")],
        }


# Comprehensive product keyword mapping across English, Hindi, and Hinglish
PRODUCT_KEYWORDS_MAP = [
    # Liquor / Alcohol
    (r"\b(daru|daaru|sharab|sharaab|madira|liquor|alcohol|alcoholic|beer|whisky|whiskey|vodka|rum|wine|gin|theka|country\s*liquor)\b", "liquor/alcohol", "beverages"),
    # Packaged Drinking Water
    (r"\b(packaged\s*drinking\s*water|drinking\s*water|mineral\s*water|bottled\s*water|paani|pani)\b", "packaged drinking water", "food and beverages"),
    # Toilet Soap / Detergent
    (r"\b(toilet\s*soap|bathing\s*bar|soap|sabun|detergent|washing\s*powder)\b", "soap", "chemicals and cosmetics"),
    # Cement
    (r"\b(portland\s*cement|opc|ppc|cement)\b", "cement", "civil and construction"),
    # Steel / TMT
    (r"\b(tmt\s*bar|tmt|rebar|structural\s*steel|steel|loha)\b", "steel", "metallurgy"),
    # Pressure Cooker
    (r"\b(pressure\s*cooker|cooker)\b", "pressure cooker", "mechanical"),
    # Helmets
    (r"\b(two\s*wheeler\s*helmet|helmets|helmet)\b", "helmet", "safety"),
    # Pipes
    (r"\b(pvc\s*pipe|upvc\s*pipe|cpvc\s*pipe|hdpe\s*pipe|pipes|pipe)\b", "pipes", "plastics and piping"),
    # Gold / Silver / Jewellery
    (r"\b(gold\s*jewellery|silver\s*jewellery|jewellery|jewelry|gold|sona|silver|chandi|huid|hallmark)\b", "gold jewellery", "jewellery"),
    # LPG Cylinders
    (r"\b(gas\s*cylinder|lpg\s*cylinder|cylinder)\b", "gas cylinder", "mechanical"),
    # Diesel / Fuels
    (r"\b(automotive\s*diesel|diesel|petrol|kerosene|fuel)\b", "diesel", "petroleum"),
    # Cables / Wires
    (r"\b(electric\s*cable|cables|cable|wires|wire)\b", "cables", "electrical"),
    # Toys
    (r"\b(toys|toy|khilone)\b", "toys", "consumer goods"),
    # Batteries
    (r"\b(battery|batteries|inverter|solar\s*panel)\b", "battery", "electronics"),
]


class ConversationMemoryService:
    """Manages active conversation sessions, multi-turn entity binding,
    topic change detection, and contextual follow-up resolution.
    """

    def __init__(self, ttl_seconds: int = 86400):
        self._sessions: Dict[str, ConversationState] = {}
        self._ttl_seconds = ttl_seconds

    def _cleanup_expired(self):
        """Purge sessions older than TTL."""
        now = time.time()
        expired = [cid for cid, s in self._sessions.items() if now - s.updated_at > self._ttl_seconds]
        for cid in expired:
            self._sessions.pop(cid, None)

    def get_state(self, conversation_id: Optional[str]) -> Optional[ConversationState]:
        """Retrieve conversation state by ID."""
        if not conversation_id:
            return None
        self._cleanup_expired()
        return self._sessions.get(conversation_id)

    def get_or_create(self, conversation_id: Optional[str]) -> ConversationState:
        """Retrieve existing or initialize fresh conversation state."""
        return self.get_or_create_state(conversation_id)

    def get_or_create_state(self, conversation_id: Optional[str]) -> ConversationState:
        """Retrieve existing or initialize fresh conversation state."""
        self._cleanup_expired()
        cid = conversation_id or f"conv_{int(time.time() * 1000)}"
        if cid not in self._sessions:
            self._sessions[cid] = ConversationState(conversation_id=cid)
        return self._sessions[cid]

    def detect_topic_change(
        self,
        user_message: str,
        state: Optional[ConversationState],
    ) -> Dict[str, Any]:
        """Classify message as 'continuation', 'new_topic', or 'ambiguous'.
        
        Strict Entity Override Rule:
        If the message mentions a product, material, or business type that differs
        from the active state, topic_status is ALWAYS 'new_topic' and use_previous_context is False.
        """
        msg_lower = user_message.strip().lower()

        # Check for explicit product/commodity keywords in message
        detected_product = None
        detected_category = None
        for pattern, prod_label, cat_label in PRODUCT_KEYWORDS_MAP:
            if re.search(pattern, msg_lower, re.I):
                detected_product = prod_label
                detected_category = cat_label
                break

        current_prod = (state.current_product or state.product or "").lower() if state else ""

        # Case 1: An explicit product was found in message
        if detected_product:
            # If there was a previous product, check if it's different
            if current_prod:
                # Same product family?
                if detected_product.lower() in current_prod or current_prod in detected_product.lower():
                    # Same product being discussed
                    return {
                        "topic_status": "continuation",
                        "use_previous_context": True,
                        "detected_product": state.current_product or state.product,
                        "detected_category": state.current_category or state.category,
                        "is_new_topic": False,
                    }
                else:
                    # Explicit new product -> NEW_TOPIC! Old product MUST be completely replaced!
                    logger.info(
                        f"Detected topic switch from '{current_prod}' to new product '{detected_product}' "
                        f"in query '{user_message}'"
                    )
                    return {
                        "topic_status": "new_topic",
                        "use_previous_context": False,
                        "detected_product": detected_product,
                        "detected_category": detected_category,
                        "is_new_topic": True,
                    }
            else:
                # No previous product was active -> NEW_TOPIC
                return {
                    "topic_status": "new_topic",
                    "use_previous_context": False,
                    "detected_product": detected_product,
                    "detected_category": detected_category,
                    "is_new_topic": True,
                }

        # Case 2: No product explicitly mentioned in the message
        # Check if user asked a clear continuation follow-up question
        continuation_patterns = [
            r"\b(test|tests|testing|parameter|parameters|lab|laboratory|laboratories)\b",
            r"\b(document|documents|paperwork|form|checklist)\b",
            r"\b(mandatory|compulsory|qco|voluntary|law)\b",
            r"\b(licence|license|certification|process|procedure|steps|apply)\b",
            r"\b(validity|renew|renewal|fee|fees|cost|charge)\b",
            r"\b(batao|kaise|kya|kahan|kaunsi|milega|chahiye|hoga|hote|hain|karna)\b",
        ]

        has_continuation_intent = any(re.search(p, msg_lower, re.I) for p in continuation_patterns)

        # Check for explicit anaphoric references referring to active entity
        has_anaphora = bool(re.search(r"\b(iska|iski|iske|ispe|inhe|inper|it|its|this|these|that)\b", msg_lower, re.I))

        # Check for explicit topic change intro phrases ("switch to", "instead of", "chhodkar")
        topic_shift_intro = any(phrase in msg_lower for phrase in ["switch to", "instead of", "chhodkar", "chhor kar"])

        if current_prod and (has_continuation_intent or has_anaphora) and not topic_shift_intro:
            return {
                "topic_status": "continuation",
                "use_previous_context": True,
                "detected_product": state.current_product or state.product,
                "detected_category": state.current_category or state.category,
                "is_new_topic": False,
            }

        # Case 3: If message has explicit topic switch phrasing but unrecognized product, mark as new_topic
        if topic_shift_intro:
            return {
                "topic_status": "new_topic",
                "use_previous_context": False,
                "detected_product": None,
                "detected_category": None,
                "is_new_topic": True,
            }

        if current_prod and (has_continuation_intent or has_anaphora):
            return {
                "topic_status": "continuation",
                "use_previous_context": True,
                "detected_product": state.current_product or state.product,
                "detected_category": state.current_category or state.category,
                "is_new_topic": False,
            }

        return {
            "topic_status": "ambiguous" if current_prod else "new_topic",
            "use_previous_context": False,
            "detected_product": None,
            "detected_category": None,
            "is_new_topic": True,
        }

    def resolve_context(
        self,
        user_message: str,
        state: Optional[ConversationState],
    ) -> str:
        """Examine user message for contextual follow-up patterns and return expanded message string."""
        details = self.resolve_context_details(user_message, state)
        return details.get("resolved_message", user_message)

    def resolve_context_details(
        self,
        user_message: str,
        state: Optional[ConversationState],
    ) -> Dict[str, Any]:
        """Examine user message for contextual follow-up patterns.
        
        Strict Topic Isolation Rule:
        If topic_status is 'new_topic', previous product/standard is NEVER injected.
        """
        topic_info = self.detect_topic_change(user_message, state)

        result = {
            "resolved_message": user_message,
            "contextual_product": topic_info["detected_product"],
            "contextual_standard": None,
            "is_contextual_follow_up": False,
            "topic_status": topic_info["topic_status"],
            "use_previous_context": topic_info["use_previous_context"],
            "inferred_mode": None,
        }

        # If it's a NEW_TOPIC or previous context should not be used, DO NOT inject old context!
        if topic_info["topic_status"] == "new_topic" or not topic_info["use_previous_context"]:
            logger.info(
                f"Topic changed or new topic detected ('{topic_info.get('detected_product')}'). "
                f"Purging old context from query expansion."
            )
            return result

        if not state or (not state.current_product and not state.product):
            return result

        msg_lower = user_message.strip().lower()
        active_prod = state.current_product or state.product or ""
        active_std = state.current_standard or state.standard_number or ""
        full_entity = f"{active_prod} ({active_std})".strip(" ()") if (active_prod and active_std) else (active_prod or active_std)

        # Pattern 1: Testing follow-up
        is_testing_q = any(
            phrase in msg_lower for phrase in [
                "what test", "which test", "testing requirement", "tests required",
                "test parameter", "test method", "mandatory test", "test pass", "testing",
                "testing batao", "iske test"
            ]
        )

        # Pattern 2: QCO / Mandatory follow-up
        is_qco_q = any(
            phrase in msg_lower for phrase in [
                "is it mandatory", "is this mandatory", "is certification mandatory",
                "mandatory or voluntary", "qco order", "qco applicable", "compulsory",
                "ye mandatory hai", "mandatory hai kya"
            ]
        )

        # Pattern 3: Laboratory follow-up
        is_lab_q = any(
            phrase in msg_lower for phrase in [
                "which lab", "where can i test", "find laboratory", "accredited lab",
                "nabl lab", "testing facility", "nearest lab", "recognized lab", "who can test",
                "kaunsi lab", "kahan test"
            ]
        )

        # Pattern 4: Document follow-up
        is_doc_q = any(
            phrase in msg_lower for phrase in [
                "what document", "which document", "documents required", "documents needed",
                "document checklist", "paperwork", "form-v", "form 5", "required document",
                "documents?", "aur documents", "kya document", "documents kya"
            ]
        )

        # Pattern 5: Standard identification follow-up
        is_std_q = any(
            phrase in msg_lower for phrase in [
                "what standard", "which standard", "is code", "standard applies",
                "which is code", "applicable standard", "kaun sa standard", "standard kya"
            ]
        )

        # Pattern 6: Process / Certification follow-up
        is_proc_q = any(
            phrase in msg_lower for phrase in [
                "how to get licence", "how to apply", "application process",
                "licensing steps", "how does certification work", "certification process",
                "licence kaise milega", "license kaise", "certification kaise"
            ]
        )

        if is_testing_q:
            result["is_contextual_follow_up"] = True
            result["contextual_product"] = active_prod
            result["contextual_standard"] = active_std
            result["inferred_mode"] = "TESTING_GUIDANCE"
            result["resolved_message"] = f"What laboratory test parameters and requirements are required for {full_entity}?"
        elif is_qco_q:
            result["is_contextual_follow_up"] = True
            result["contextual_product"] = active_prod
            result["contextual_standard"] = active_std
            result["inferred_mode"] = "QCO_GUIDANCE"
            result["resolved_message"] = f"Is BIS certification mandatory under a Quality Control Order (QCO) for {full_entity}?"
        elif is_lab_q:
            result["is_contextual_follow_up"] = True
            result["contextual_product"] = active_prod
            result["contextual_standard"] = active_std
            result["inferred_mode"] = "LABORATORY_GUIDANCE"
            result["resolved_message"] = f"Which accredited BIS recognized laboratories can test {full_entity}?"
        elif is_doc_q:
            result["is_contextual_follow_up"] = True
            result["contextual_product"] = active_prod
            result["contextual_standard"] = active_std
            result["inferred_mode"] = "DOCUMENT_GUIDANCE"
            result["resolved_message"] = f"What documents are required to apply for BIS certification for {full_entity}?"
        elif is_std_q:
            result["is_contextual_follow_up"] = True
            result["contextual_product"] = active_prod
            result["contextual_standard"] = active_std
            result["inferred_mode"] = "STANDARD_IDENTIFICATION"
            result["resolved_message"] = f"What Indian Standard (IS code) applies to {active_prod}?"
        elif is_proc_q:
            result["is_contextual_follow_up"] = True
            result["contextual_product"] = active_prod
            result["contextual_standard"] = active_std
            result["inferred_mode"] = "CERTIFICATION_GUIDANCE"
            result["resolved_message"] = f"What is the step-by-step BIS certification process for {full_entity}?"

        return result

    def clear_state(self, conversation_id: str):
        """Clear conversation context."""
        self._sessions.pop(conversation_id, None)


conversation_service = ConversationMemoryService()

