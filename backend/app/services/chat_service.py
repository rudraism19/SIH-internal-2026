import time
import re
import logging
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ResponseMode,
    ActionItem,
    SectionDescriptor,
    IdentifiedStandard,
)
from app.services.conversation_service import conversation_service
from app.services.groq_service import groq_service
from app.services.rag_service import rag_service
from app.services.standard_identifier import identify_standards_from_evidence
from app.services.evidence_service import evidence_service
from app.services.gemini_service import gemini_service
from app.services.predefined_responses import get_predefined_response
from app.services.compliance_graph import compliance_graph_service
from app.services.laboratory_service import laboratory_service
from app.services.hsn_customs_service import hsn_customs_service
from app.services.license_lifecycle_service import license_lifecycle_service
from app.services.batch_calculator_service import batch_calculator_service
from app.services.hallmarking_service import hallmarking_service
from app.services.sarvam_service import sarvam_service, normalize_language_code
from app.services.translation_service import translation_service

logger = logging.getLogger(__name__)


class ChatService:
    """Core chat orchestration service for BIS Assistant.
    
    Coordinates:
    Groq Intent Router (fast classification across 10 intents)
    -> [needs_rag == False]: Instant predefined domain response (0ms vector/Gemini)
    -> [needs_rag == True]: LangChain RAG vector retrieval in Supabase pgvector
       -> Standard Identification
       -> BIS Evidence & Citation Validation Layer
       -> Gemini Grounded Answer Generation
       -> Backend-Owned Citations & Verification
    """

    async def generate_response(self, request: ChatRequest) -> ChatResponse:
        """Process user query through Groq intent classification, conditional RAG retrieval,
        candidate standard identification, strict evidence validation, and Gemini grounded answer.
        """
        t0 = time.perf_counter()
        conv_state = conversation_service.get_or_create(request.conversation_id)
        conversation_id = conv_state.conversation_id

        # Handle empty message when image is provided
        raw_message = (request.message or "").strip()
        if not raw_message and request.image_data:
            raw_message = "Please inspect this product or mark image for BIS Indian Standards, ISI mark authenticity, and compliance."
            request.message = raw_message

        logger.info(
            f"Processing chat query: '{request.message}' "
            f"(conversation_id: {conversation_id}, language: {request.language}, voice: {request.enable_voice}, image: {bool(request.image_data)})"
        )

        # 0. Multilingual Indian Language Bridge (Sarvam AI + Groq Fallback)
        norm_requested_lang = normalize_language_code(request.language)
        detected_script_lang = sarvam_service.detect_language(request.message)
        effective_lang = norm_requested_lang if norm_requested_lang != "en-IN" else detected_script_lang

        # Only translate Indic script input to English for vector search and standard identification
        internal_query = request.message
        if detected_script_lang != "en-IN":
            try:
                translated_en = await translation_service.translate(
                    text=request.message,
                    source_language_code=detected_script_lang,
                    target_language_code="en-IN",
                )
                if translated_en and translated_en.strip():
                    internal_query = translated_en
                    logger.info(f"Translated query from {detected_script_lang} to English for RAG: '{internal_query}'")
            except Exception as te:
                logger.warning(f"Could not translate query to English: {te}")

        # 1. Multi-turn Topic Change & Context Resolution (Entity Override Rule)
        topic_info = conversation_service.detect_topic_change(internal_query, conv_state)
        is_new_topic = (topic_info["topic_status"] == "new_topic")

        if is_new_topic:
            detected_new_prod = topic_info.get("detected_product")
            logger.info(
                f"Topic switch detected in query '{request.message}'. "
                f"Previous product was '{conv_state.current_product or conv_state.product}', "
                f"New detected product is '{detected_new_prod}'. Resetting session context."
            )
            conv_state.reset_for_new_topic(
                new_product=detected_new_prod,
                new_category=topic_info.get("detected_category"),
            )
            groq_context = None
            resolved_query = internal_query
        else:
            groq_context = conv_state.to_context_dict() if (conv_state.product or conv_state.current_product) else None
            # Multi-turn Context Resolution (Anaphoric & follow-up expansion)
            resolved_query = conversation_service.resolve_context(internal_query, conv_state)

        if resolved_query != internal_query:
            logger.info(f"Resolved multi-turn contextual query: '{internal_query}' -> '{resolved_query}'")

        # 2. Analyze query using Groq Intent Router with session context
        t_groq_start = time.perf_counter()
        query_analysis = await groq_service.analyze_query(
            message=resolved_query,
            language="en",
            conversation_context=groq_context,
        )
        groq_ms = (time.perf_counter() - t_groq_start) * 1000

        # Post-Groq validation of topic status & context inheritance
        if query_analysis.topic_status == "new_topic" or not query_analysis.use_previous_context:
            if not is_new_topic:
                conv_state.reset_for_new_topic(
                    new_product=query_analysis.product or topic_info.get("detected_product"),
                    new_category=query_analysis.category or topic_info.get("detected_category"),
                )
            active_product = query_analysis.product or topic_info.get("detected_product")
            active_standard = query_analysis.standard_number
            active_category = query_analysis.category or topic_info.get("detected_category")
        else:
            active_product = query_analysis.product or conv_state.current_product or conv_state.product
            active_standard = query_analysis.standard_number or conv_state.current_standard or conv_state.standard_number
            active_category = query_analysis.category or conv_state.current_category or conv_state.category

        # Fast-Path Optimization: If query matches an authoritative institutional topic (Standards Clubs, NITS, Startup Benefits, etc.), bypass RAG
        if query_analysis.needs_rag and not active_standard and (not active_product or active_product.lower() in ["general", "none", "club", "training", "startup", "msme"]):
            from app.services.predefined_responses import UNSUPPORTED_RESPONSE
            cand = get_predefined_response(
                intent=query_analysis.intent,
                query=resolved_query,
                language=query_analysis.language or request.language or "en",
            )
            if cand != UNSUPPORTED_RESPONSE:
                query_analysis.needs_rag = False

        # FAST PATH: Generic queries bypass embeddings, pgvector, validation, and Gemini (unless image attached)
        if not query_analysis.needs_rag and not request.image_data:
            embedding_ms = 0.0
            retrieval_ms = 0.0
            validation_ms = 0.0
            gemini_ms = 0.0
            total_ms = (time.perf_counter() - t0) * 1000

            logger.info(
                f"[PERF TIMINGS] Query: '{request.message[:40]}' | Intent: {query_analysis.intent} | RAG: False | "
                f"Total: {total_ms:.1f}ms | Groq: {groq_ms:.1f}ms | Embedding: {embedding_ms:.1f}ms | "
                f"Retrieval: {retrieval_ms:.1f}ms | Validation: {validation_ms:.1f}ms | Gemini: {gemini_ms:.1f}ms"
            )

            predefined = get_predefined_response(
                intent=query_analysis.intent,
                query=resolved_query,
                language=query_analysis.language or request.language or "en",
            )

            # Selective Domain Card Resolution: Only compute and attach cards if relevant to intent/query
            user_q_lower = f"{request.message} {resolved_query}".lower()
            is_general_or_greeting = query_analysis.intent in ("greeting", "general_bis", "unsupported") and not active_product

            customs_info = None
            if not is_general_or_greeting and (query_analysis.hsn_code or any(w in user_q_lower for w in ["customs", "import", "hsn", "port", "clearance", "icegate", "dgft"])):
                customs_info = hsn_customs_service.resolve_customs_info(
                    query=resolved_query,
                    standard_number=active_standard,
                    product=active_product,
                    hsn_code=query_analysis.hsn_code,
                )

            hallmarking_info = None
            if not is_general_or_greeting and (query_analysis.intent == "hallmarking" or any(w in user_q_lower for w in ["hallmark", "huid", "gold", "silver", "jewel", "karat", "carat", "purity", "22k", "18k", "14k", "916"])):
                hallmarking_info = hallmarking_service.resolve_hallmarking_info(
                    query=resolved_query,
                    standard_number=active_standard,
                    product=active_product,
                )

            renewal_info = None
            if not is_general_or_greeting and any(w in user_q_lower for w in ["renew", "expiry", "expire", "validity", "form-vi", "form 6", "marking fee", "stop-marking", "grace"]):
                renewal_info = license_lifecycle_service.resolve_renewal_info(
                    query=resolved_query,
                    standard_number=active_standard,
                    product=active_product,
                )

            batch_info = None
            if not is_general_or_greeting and any(w in user_q_lower for w in ["batch", "sit", "routine test", "frequency", "control unit", "production", "manufacture"]):
                batch_info = batch_calculator_service.resolve_batch_info(
                    query=resolved_query,
                    standard_number=active_standard,
                    product=active_product,
                    production_volume=query_analysis.production_volume,
                )

            compliance_info = None
            if not is_general_or_greeting and (query_analysis.intent in ("qco_requirement", "certification_requirement") or any(w in user_q_lower for w in ["qco", "mandatory", "compulsory"])):
                compliance_info = compliance_graph_service.resolve_compliance(
                    query=resolved_query,
                    standard_number=active_standard,
                    product=active_product,
                )

            testing_info = None
            if not is_general_or_greeting and (query_analysis.intent in ("testing_requirement", "laboratory") or any(w in user_q_lower for w in ["test", "lab", "laboratory", "parameter"])):
                testing_info = laboratory_service.resolve_testing_info(
                    query=resolved_query,
                    standard_number=active_standard,
                    product=active_product,
                )

            answer_text = predefined["answer"]
            if customs_info and (query_analysis.hsn_code or any(w in user_q_lower for w in ["customs", "import", "hsn", "port", "clearance", "icegate"])):
                answer_text = (
                    f"### Customs & Port Clearance Summary (HSN {customs_info.hsn_code})\n"
                    f"• **Commodity**: {customs_info.commodity_title}\n"
                    f"• **Applicable Standard**: {customs_info.standard_number} ({customs_info.product_name})\n"
                    f"• **DGFT Import Policy**: {customs_info.import_policy}\n"
                    f"• **ICEGATE Status**: {'Automated Customs Hold (BIS verification mandatory)' if customs_info.icegate_mandatory_check else 'Free clearance under OGL'}\n\n"
                    f"{customs_info.port_clearance_advisory}\n\n"
                    f"---\n\n"
                    f"{predefined['answer']}"
                )
            elif hallmarking_info or query_analysis.intent == "hallmarking":
                h_info = hallmarking_info or hallmarking_service.resolve_hallmarking_info(query="gold hallmarking")
                hallmarking_info = h_info
                grades_str = ", ".join([f"{g.karat} ({g.fineness})" for g in h_info.recognized_purity_grades[:4]])
                marks_str = "\n".join([f"• {m}" for m in h_info.mandatory_marks_description])
                steps_str = "\n".join([f"• {s}" for s in h_info.huid_verification_steps[:3]])
                answer_text = (
                    f"### BIS Gold & Silver Hallmarking & HUID Summary ({h_info.standard_number})\n"
                    f"• **Precious Metal**: {h_info.metal} | **Mandatory Districts**: {h_info.mandatory_districts_count}+ Districts across India\n"
                    f"• **Recognized Purity Grades**: {grades_str}\n\n"
                    f"**The {h_info.mandatory_marks_count} Mandatory Marks on Hallmarked Articles:**\n"
                    f"{marks_str}\n\n"
                    f"**How to Verify on BIS Care App:**\n"
                    f"{steps_str}\n\n"
                    f"• **Jeweller Registration**: {h_info.jeweller_registration}\n"
                    f"• **Consumer Redressal**: {h_info.consumer_remedy}"
                )
                predefined["next_steps"] = [
                    "Download the official BIS Care App from Google Play Store or Apple App Store.",
                    "Use the 'Verify HUID' feature to verify the 6-digit code on your jewellery invoice.",
                    "Ensure your sales invoice states the HUID code, gross weight, net weight, and precious metal purity.",
                ]
            elif renewal_info and any(w in user_q_lower for w in ["renew", "expiry", "expire", "validity", "form-vi", "form 6", "marking fee", "stop-marking", "grace"]):
                answer_text = (
                    f"### BIS Licence Lifecycle & Form-VI Renewal Summary\n"
                    f"• **Standard**: {renewal_info.standard_number} ({renewal_info.product_name}) | **Scheme**: {renewal_info.scheme}\n"
                    f"• **Initial Validity**: {renewal_info.initial_validity_years} Year(s) | **Allowed Renewals**: {', '.join(renewal_info.renewal_duration_options)}\n"
                    f"• **Renewal Window**: {renewal_info.renewal_window}\n"
                    f"• **Marking Fee**: {renewal_info.minimum_marking_fee_inr}\n"
                    f"• **Grace Period**: {renewal_info.grace_period} (Late Surcharge: {renewal_info.late_fee_penalty})\n\n"
                    f"{renewal_info.stop_marking_notice}\n\n"
                    f"---\n\n"
                    f"{predefined['answer']}"
                )
            elif batch_info and any(w in user_q_lower for w in ["batch", "sit", "routine test", "frequency", "control unit", "production", "manufacture"]):
                vol_line = f"• **Monthly Volume**: {batch_info.input_production_volume:,} units ➔ **Calculated Batches**: {batch_info.calculated_batches_count:,}\n" if batch_info.input_production_volume else ""
                answer_text = (
                    f"### Factory Batch & SIT Routine Testing Summary\n"
                    f"• **Standard**: {batch_info.standard_number} ({batch_info.product_name})\n"
                    f"• **Control Unit (Batch)**: {batch_info.control_unit_definition}\n"
                    f"{vol_line}"
                    f"• **Key In-Line Safety Routine**: {batch_info.routine_tests[0].parameter_name} ({batch_info.routine_tests[0].frequency})\n"
                    f"• **Acceptance Criteria**: {batch_info.acceptance_criteria}\n\n"
                    f"---\n\n"
                    f"{predefined['answer']}"
                )

            # If user queried in Indic language, translate answer_text to user's language
            if effective_lang != "en-IN":
                try:
                    answer_text = await translation_service.translate(
                        text=answer_text,
                        source_language_code="en-IN",
                        target_language_code=effective_lang,
                    )
                except Exception as te:
                    logger.warning(f"Failed to translate fast path answer to {effective_lang}: {te}")

            # Synthesize voice audio if requested
            audio_b64 = None
            if request.enable_voice:
                try:
                    audio_b64 = await sarvam_service.text_to_speech(
                        text=answer_text,
                        target_language_code=effective_lang,
                        speaker=request.voice_speaker or "priya",
                    )
                except Exception as ve:
                    logger.warning(f"Voice synthesis failed in fast path: {ve}")

            timings = {
                "groq_ms": round(groq_ms, 2),
                "embedding_ms": round(embedding_ms, 2),
                "retrieval_ms": round(retrieval_ms, 2),
                "validation_ms": round(validation_ms, 2),
                "gemini_ms": round(gemini_ms, 2),
                "total_ms": round(total_ms, 2),
            }

            fast_standards = []
            fast_citations = []
            fast_verified = False
            fast_grounded = False

            if hallmarking_info:
                fast_standards = [
                    IdentifiedStandard(
                        standard_number=hallmarking_info.standard_number,
                        title=f"Precious Metals — {hallmarking_info.metal} Jewellery / Artefacts — Fineness and Marking",
                        confidence=0.99,
                        evidence_supported=True,
                    )
                ]
                fast_citations = [
                    {
                        "standard_number": hallmarking_info.standard_number,
                        "title": f"BIS Hallmarking Regulations ({hallmarking_info.metal})",
                        "clause": "Regulation 3 & 4",
                        "source": "Official Gazette of India / BIS Scheme",
                        "content": f"Mandatory hallmarking of {hallmarking_info.metal} jewellery bearing the BIS Standard Mark, Karatage/Fineness, and 6-digit alphanumeric HUID.",
                        "page": 1,
                    }
                ]
                fast_verified = True
                fast_grounded = True

            # Determine response mode
            res_mode = predefined.get("response_mode") or query_analysis.response_mode or ResponseMode.GENERAL_CONVERSATION
            res_mode_str = res_mode.value if isinstance(res_mode, ResponseMode) else str(res_mode)

            # Structured next question
            fast_next_q = predefined.get("next_question")
            if not fast_next_q:
                if active_product:
                    fast_next_q = f"Would you like to know the exact Indian Standard (IS code) or mandatory testing parameters for {active_product}?"
                else:
                    fast_next_q = "Which specific product or industrial sector are you planning to certify?"

            # Structured actions
            fast_actions_raw = predefined.get("actions", [])
            fast_actions = [
                ActionItem(**a) if isinstance(a, dict) else a
                for a in fast_actions_raw
            ]
            if not fast_actions:
                target_item = f"{active_product} ({active_standard})" if (active_product and active_standard) else (active_product or active_standard or "this product")
                fast_actions = [
                    ActionItem(label="Certification Process", query=f"How does BIS certification work for {target_item}?", type="certification"),
                    ActionItem(label="Testing Requirements", query=f"What testing requirements apply to {target_item}?", type="testing"),
                    ActionItem(label="Mandatory Products", query="What products are covered under mandatory BIS certification in India?", type="general"),
                ]

            # Structured sections
            fast_sections = []
            if hallmarking_info:
                fast_sections.append(SectionDescriptor(type="hallmarking", title="Hallmarking & HUID"))
            if customs_info:
                fast_sections.append(SectionDescriptor(type="customs", title="Customs & Port Clearance"))
            if renewal_info:
                fast_sections.append(SectionDescriptor(type="renewal", title="Licence Renewal & Validity"))
            if batch_info:
                fast_sections.append(SectionDescriptor(type="batch", title="Factory Batch & SIT Testing"))

            standards_formatted = [
                {
                    "standard_number": s.standard_number,
                    "title": s.title,
                    "confidence": s.confidence,
                    "evidence_supported": s.evidence_supported,
                }
                for s in fast_standards
            ]

            # Record turn in conversation session
            conv_state.record_turn(
                user_query=request.message,
                assistant_answer=answer_text,
                response_mode=res_mode_str,
                standard_number=hallmarking_info.standard_number if hallmarking_info else active_standard,
                product=active_product,
                category=active_category,
            )

            return ChatResponse(
                success=True,
                query_analysis=query_analysis,
                identified_standards=fast_standards,
                retrieved_evidence=[],
                citations=fast_citations,
                claims_validation=[],
                certification=None,
                compliance_info=compliance_info,
                testing_info=testing_info,
                customs_info=customs_info,
                renewal_info=renewal_info,
                batch_info=batch_info,
                hallmarking_info=hallmarking_info,
                verified=fast_verified,
                grounded=fast_grounded,
                next_steps=predefined.get("next_steps", []),
                answer=answer_text,
                message=answer_text,
                language=effective_lang,
                conversation_id=conversation_id,
                timings=timings,
                audio_base64=audio_b64,
                audio_format="audio/wav" if audio_b64 else None,
                detected_language=effective_lang,
                response_mode=res_mode_str,
                product=active_product,
                standards=standards_formatted,
                sections=fast_sections,
                next_question=fast_next_q,
                actions=fast_actions,
                thinking_process=None,
            )

        # SLOW PATH (RAG): Query requires document retrieval & evidence verification
        # 2. Retrieve relevant BIS document chunks via RAG & Supabase pgvector with timing
        retrieved_evidence, embedding_ms, retrieval_ms = await rag_service.retrieve_evidence_with_timing(
            user_query=resolved_query,
            analysis=query_analysis,
        )

        # 3. Identify and rank candidate Indian Standards from evidence & catalogue
        candidate_standards = identify_standards_from_evidence(
            retrieved_evidence=retrieved_evidence,
            query_analysis=query_analysis,
        )

        # 4. Filter retrieved evidence for strict on-topic relevance
        relevant_evidence = []
        GENERIC_STOPWORDS = {
            "product", "products", "item", "items", "good", "goods", "material", "materials",
            "standard", "standards", "specification", "specifications", "manual", "manuals",
            "database", "tell", "what", "which", "about", "india", "indian", "need", "require",
        }
        if query_analysis:
            raw_terms = set()
            if query_analysis.product:
                raw_terms.update(w.lower() for w in re.findall(r"\w+", query_analysis.product) if len(w) > 2)
            if query_analysis.material:
                raw_terms.update(w.lower() for w in re.findall(r"\w+", query_analysis.material) if len(w) > 2)

            filtered = {w for w in raw_terms if w not in GENERIC_STOPWORDS}
            user_terms = filtered if filtered else raw_terms

        for ev in retrieved_evidence:
            content_lower = (ev.content or "").lower()
            title_lower = (ev.title or ev.standard_title or ev.document_title or "").lower()

            if user_terms:
                # If a specific product or material was asked, chunk MUST be on-topic
                if any(t in content_lower or t in title_lower for t in user_terms):
                    relevant_evidence.append(ev)
            else:
                # For general queries without a specific product, high semantic similarity is required
                if ev.similarity >= 0.70:
                    relevant_evidence.append(ev)

        # 5. BIS Evidence and Citation Validation Layer
        t_val_start = time.perf_counter()
        val_result = evidence_service.validate_evidence(
            identified_standards=candidate_standards,
            retrieved_evidence=relevant_evidence,
            query_analysis=query_analysis,
            user_query=resolved_query,
        )
        validation_ms = (time.perf_counter() - t_val_start) * 1000

        # 6. Candidate Standards Filtering (Eliminate cross-product noise)
        if val_result.verified and val_result.identified_standards:
            top_cand = val_result.identified_standards[0]
            clean_standards = [top_cand]

            def _get_standard_family(std_no: str) -> str:
                m = re.match(r"(IS\s*\d+)", std_no or "", re.I)
                return m.group(1).upper().replace(" ", "") if m else (std_no or "").upper().strip()

            top_base = _get_standard_family(top_cand.standard_number)

            # Common stop words to exclude from query words matching
            stop_words = {
                "the", "a", "an", "is", "in", "of", "and", "or", "for", "to", "with",
                "ka", "ki", "ke", "hai", "mujhe", "karna", "krna", "start", "business",
                "bechana", "bechna", "how", "what", "requirements", "standard", "standards", "under"
            }
            words_to_scan = [request.message, internal_query, resolved_query]
            if query_analysis and query_analysis.product:
                words_to_scan.append(query_analysis.product)

            query_words = set()
            for text in words_to_scan:
                if text:
                    query_words.update(w for w in re.findall(r"\w+", text.lower()) if len(w) > 2 and w not in stop_words)

            # Calculate match overlap for top candidate to know how strong query overlap should be
            top_title_words = {w for w in re.findall(r"\w+", (top_cand.title or "").lower()) if len(w) > 2 and w not in stop_words}
            top_match_count = len(query_words & top_title_words)
            min_overlap = min(2, top_match_count) if top_match_count >= 2 else 1

            for std in val_result.identified_standards[1:]:
                std_base = _get_standard_family(std.standard_number)
                std_title_words = {w for w in re.findall(r"\w+", (std.title or "").lower()) if len(w) > 2 and w not in stop_words}

                is_same_family = bool(top_base and top_base == std_base)
                matched_words = query_words & std_title_words
                has_topic_match = len(matched_words) >= min_overlap
                has_strong_conf = std.confidence >= (top_cand.confidence * 0.88)

                if is_same_family or (has_topic_match and has_strong_conf):
                    clean_standards.append(std)

            val_result.identified_standards = clean_standards
            kept_numbers = {s.standard_number for s in clean_standards}
            val_result.citations = [c for c in val_result.citations if c.standard_number in kept_numbers]

        # 7. Grounded Answer Generation & Multimodal Vision Inspection
        has_image = bool(request.image_data and request.image_data.strip())
        if (val_result.verified and val_result.identified_standards) or has_image:
            final_evidence = [
                ev for ev in relevant_evidence
                if any(
                    ev.standard_number == s.standard_number or (s.standard_number and s.standard_number in (ev.content or ""))
                    for s in val_result.identified_standards
                )
            ]

            # Resolve compliance status for the verified standard
            top_std = val_result.identified_standards[0].standard_number if val_result.identified_standards else None
            active_product = active_product or query_analysis.product or (conv_state.product if query_analysis.use_previous_context else None)

            compliance_info = compliance_graph_service.resolve_compliance(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
            )

            # Resolve testing parameters and accredited laboratories
            testing_info = laboratory_service.resolve_testing_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
            )

            # Resolve HSN & Customs Port Clearance info
            customs_info = hsn_customs_service.resolve_customs_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
                hsn_code=query_analysis.hsn_code,
            )

            # Resolve Licence Lifecycle & Renewal rules
            renewal_info = license_lifecycle_service.resolve_renewal_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
            )

            # Resolve Factory Batch Calculator & SIT Routine Testing
            batch_info = batch_calculator_service.resolve_batch_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
                production_volume=query_analysis.production_volume,
            )

            # Resolve Gold & Silver Hallmarking & HUID Intelligence
            hallmarking_info = hallmarking_service.resolve_hallmarking_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
            )

            # Call Gemini to generate natural-language explanation conditioned strictly on verified evidence and image
            t_gem_start = time.perf_counter()
            try:
                gemini_payload = await gemini_service.generate_grounded_answer(
                    user_query=resolved_query,
                    query_analysis=query_analysis,
                    identified_standards=val_result.identified_standards,
                    verified_evidence=final_evidence,
                    citations=val_result.citations,
                    certification=val_result.certification,
                    compliance_info=compliance_info,
                    testing_info=testing_info,
                    customs_info=customs_info,
                    renewal_info=renewal_info,
                    batch_info=batch_info,
                    hallmarking_info=hallmarking_info,
                    image_data=request.image_data,
                )
            except Exception as ge:
                logger.error(f"Unexpected error in gemini_service: {ge}. Using fallback.", exc_info=True)
                gemini_payload = gemini_service._build_fallback_answer(
                    user_query=resolved_query,
                    identified_standards=val_result.identified_standards,
                    verified_evidence=final_evidence,
                    citations=val_result.citations,
                    certification=val_result.certification,
                    compliance_info=compliance_info,
                    testing_info=testing_info,
                    customs_info=customs_info,
                    renewal_info=renewal_info,
                    batch_info=batch_info,
                    hallmarking_info=hallmarking_info,
                )
            gemini_ms = (time.perf_counter() - t_gem_start) * 1000

            answer_text = gemini_payload.answer
            next_steps = gemini_payload.next_steps
            grounded = gemini_payload.grounded if not has_image else True

            if not val_result.identified_standards and gemini_payload.identified_standards:
                identified_stds = [
                    IdentifiedStandard(
                        standard_number=s.get("standard_number", "IS Standard"),
                        title=s.get("title", "Indian Standard"),
                        confidence=0.92,
                        evidence_supported=True,
                    )
                    for s in gemini_payload.identified_standards
                    if s.get("standard_number")
                ]
            else:
                identified_stds = val_result.identified_standards

            backend_citations = val_result.citations
            res_mode = query_analysis.response_mode or ResponseMode.STANDARD_IDENTIFICATION

            # Structured next_question & actions from Gemini
            next_question = gemini_payload.next_question
            actions = [
                ActionItem(**a) if isinstance(a, dict) else a
                for a in gemini_payload.actions
            ]
            sections = [
                SectionDescriptor(**s) if isinstance(s, dict) else s
                for s in gemini_payload.sections
            ]

            # Selective Card Filtering: Only retain rich cards relevant to query/intent to avoid clutter
            user_q_lower = f"{request.message} {resolved_query}".lower()

            final_compliance_info = compliance_info if (
                compliance_info and (
                    compliance_info.is_mandatory
                    or compliance_info.qco_name
                    or res_mode in (ResponseMode.QCO_GUIDANCE, ResponseMode.CERTIFICATION_GUIDANCE, ResponseMode.STANDARD_IDENTIFICATION)
                    or any(w in user_q_lower for w in ["mandatory", "qco", "compulsory", "scheme", "order", "legal", "act"])
                )
            ) else None

            final_testing_info = testing_info if (
                testing_info and (
                    res_mode in (ResponseMode.TESTING_GUIDANCE, ResponseMode.LABORATORY_GUIDANCE, ResponseMode.STANDARD_IDENTIFICATION)
                    or any(w in user_q_lower for w in ["test", "testing", "lab", "laboratory", "parameter", "microbiol", "sample"])
                ) and (len(testing_info.critical_parameters) > 0 or len(testing_info.recognized_laboratories) > 0)
            ) else None

            final_customs_info = customs_info if (
                customs_info and (
                    query_analysis.hsn_code
                    or any(w in user_q_lower for w in ["customs", "import", "hsn", "port", "clearance", "icegate", "dgft"])
                )
            ) else None

            final_renewal_info = renewal_info if (
                renewal_info and any(w in user_q_lower for w in ["renew", "expiry", "expire", "validity", "form-vi", "form 6", "marking fee", "stop-marking", "grace"])
            ) else None

            final_batch_info = batch_info if (
                batch_info and any(w in user_q_lower for w in ["batch", "sit", "routine test", "frequency", "control unit", "production", "manufacture"])
            ) else None

            final_hallmarking_info = hallmarking_info if (
                hallmarking_info and (
                    query_analysis.intent == "hallmarking"
                    or any(w in user_q_lower for w in ["hallmark", "huid", "gold", "silver", "jewel", "karat", "carat", "purity", "22k", "18k", "14k", "916"])
                )
            ) else None

            if not sections:
                if final_compliance_info:
                    sections.append(SectionDescriptor(type="certification", title="Certification & QCO Status"))
                if final_testing_info:
                    sections.append(SectionDescriptor(type="testing", title="Mandatory Testing & Labs"))
                if final_customs_info:
                    sections.append(SectionDescriptor(type="customs", title="Customs & Port Clearance"))
                if final_batch_info:
                    sections.append(SectionDescriptor(type="batch", title="Factory Batch & SIT Testing"))
                if final_renewal_info:
                    sections.append(SectionDescriptor(type="renewal", title="Licence Renewal & Validity"))
                if final_hallmarking_info:
                    sections.append(SectionDescriptor(type="hallmarking", title="Hallmarking & HUID"))
        else:
            # STRICT NO-EVIDENCE RULE: Never call Gemini to guess an answer when no verified evidence exists
            final_compliance_info = None
            final_testing_info = None
            gemini_ms = 0.0
            target_prod = f"'{query_analysis.product}'" if (query_analysis and query_analysis.product) else f"'{request.message.strip()}'"

            # Check if an HSN customs record exists for this product or HSN query
            customs_info = hsn_customs_service.resolve_customs_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
                hsn_code=query_analysis.hsn_code,
            )

            # Check if renewal info, batch info, or hallmarking info exists
            renewal_info = license_lifecycle_service.resolve_renewal_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
            )
            batch_info = batch_calculator_service.resolve_batch_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
                production_volume=query_analysis.production_volume,
            )
            hallmarking_info = hallmarking_service.resolve_hallmarking_info(
                query=resolved_query,
                standard_number=active_standard,
                product=active_product,
            )

            user_q_lower = f"{request.message} {resolved_query}".lower()
            final_customs_info = customs_info if (customs_info and (query_analysis.hsn_code or any(w in user_q_lower for w in ["customs", "import", "hsn", "port", "clearance", "icegate", "dgft"]))) else None
            final_renewal_info = renewal_info if (renewal_info and any(w in user_q_lower for w in ["renew", "expiry", "expire", "validity", "form-vi", "form 6", "marking fee", "stop-marking", "grace"])) else None
            final_batch_info = batch_info if (batch_info and any(w in user_q_lower for w in ["batch", "sit", "routine test", "frequency", "control unit", "production", "manufacture"])) else None
            final_hallmarking_info = hallmarking_info if (hallmarking_info and any(w in user_q_lower for w in ["hallmark", "huid", "gold", "silver", "jewel", "karat", "carat", "purity", "22k", "18k", "14k", "916"])) else None

            if final_customs_info:
                icegate_desc = "Automated Clearance Hold (FMCS/CRS registration required)" if final_customs_info.icegate_mandatory_check else "Free under Open General Licence (OGL)"
                answer_text = (
                    f"While indexed technical standard clauses are not in the local database for {target_prod}, "
                    f"here is the official DGFT / ICEGATE Customs Port Clearance data for HSN {final_customs_info.hsn_code}:\n\n"
                    f"• **Commodity**: {final_customs_info.commodity_title}\n"
                    f"• **Applicable Standard**: {final_customs_info.standard_number} ({final_customs_info.product_name})\n"
                    f"• **DGFT Import Policy**: {final_customs_info.import_policy}\n"
                    f"• **ICEGATE Status**: {icegate_desc}\n\n"
                    f"{final_customs_info.port_clearance_advisory}"
                )
                next_steps = [
                    f"Ensure Bill of Entry documents are prepared: {', '.join(final_customs_info.required_documents[:2])}.",
                    f"Verify foreign supplier certification under {final_customs_info.standard_number} before dispatch.",
                    "Check port customs clearance advisories with your authorized customs broker.",
                ]
            elif final_renewal_info:
                answer_text = (
                    f"### BIS Licence Lifecycle & Form-VI Renewal Summary\n"
                    f"• **Standard**: {final_renewal_info.standard_number} ({final_renewal_info.product_name}) | **Scheme**: {final_renewal_info.scheme}\n"
                    f"• **Initial Validity**: {final_renewal_info.initial_validity_years} Year(s) | **Allowed Renewals**: {', '.join(final_renewal_info.renewal_duration_options)}\n"
                    f"• **Renewal Window**: {final_renewal_info.renewal_window}\n"
                    f"• **Marking Fee**: {final_renewal_info.minimum_marking_fee_inr}\n"
                    f"• **Grace Period**: {final_renewal_info.grace_period} (Late Surcharge: {final_renewal_info.late_fee_penalty})\n\n"
                    f"{final_renewal_info.stop_marking_notice}"
                )
                next_steps = [
                    "Submit Form-VI on manakonline.in at least 90 days before licence expiry.",
                    f"Calculate total unit production rate against minimum marking fee ({final_renewal_info.minimum_marking_fee_inr}).",
                    "Ensure routine testing logs under factory SIT are up-to-date for BIS verification inspection.",
                ]
            elif final_batch_info:
                vol_line = f"• **Monthly Volume**: {final_batch_info.input_production_volume:,} units ➔ **Calculated Batches**: {final_batch_info.calculated_batches_count:,}\n" if final_batch_info.input_production_volume else ""
                answer_text = (
                    f"### Factory Batch & SIT Routine Testing Summary\n"
                    f"• **Standard**: {final_batch_info.standard_number} ({final_batch_info.product_name})\n"
                    f"• **Control Unit (Batch)**: {final_batch_info.control_unit_definition}\n"
                    f"{vol_line}"
                    f"• **Key In-Line Safety Routine**: {final_batch_info.routine_tests[0].parameter_name} ({final_batch_info.routine_tests[0].frequency})\n"
                    f"• **Acceptance Criteria**: {final_batch_info.acceptance_criteria}"
                )
                next_steps = [
                    f"Maintain factory QA registers according to: {', '.join(final_batch_info.qa_record_keeping[:2])}.",
                    "Ensure in-line test benches are calibrated with NABL traceability.",
                    "Verify non-conforming units are segregated immediately as per SIT guidelines.",
                ]
            elif final_hallmarking_info:
                purity_list = ", ".join([f"{p.karat} ({p.fineness})" for p in final_hallmarking_info.recognized_purity_grades[:4]])
                answer_text = (
                    f"### BIS Gold & Silver Hallmarking Intelligence ({final_hallmarking_info.standard_number})\n\n"
                    f"• **Applicable Standard**: {final_hallmarking_info.standard_number} ({final_hallmarking_info.metal} Jewellery)\n"
                    f"• **The {final_hallmarking_info.mandatory_marks_count} Mandatory Marks**: {', '.join(final_hallmarking_info.mandatory_marks_description)}\n"
                    f"• **HUID Code Format**: {final_hallmarking_info.huid_format}\n"
                    f"• **Recognized Purity Grades**: {purity_list}\n"
                    f"• **Mandatory Coverage**: {final_hallmarking_info.mandatory_status} ({final_hallmarking_info.mandatory_districts_count})\n"
                    f"• **Jeweller Registration**: {final_hallmarking_info.jeweller_registration}\n\n"
                    f"**How to Verify HUID on BIS Care App**:\n"
                    + "\n".join([f"{i+1}. {step}" for i, step in enumerate(final_hallmarking_info.huid_verification_steps[:3])]) + "\n\n"
                    f"**Statutory Redressal (Section 19 BIS Act)**: {final_hallmarking_info.consumer_remedy}"
                )
                next_steps = [
                    "Download the official BIS Care App from Google Play Store or Apple App Store.",
                    "Use the 'Verify HUID' feature by entering the 6-character alphanumeric code marked on the jewellery.",
                    "Ensure your invoice mentions the HUID code, gross weight, net metal weight, and purity grade.",
                ]
            elif (active_product and any(w in active_product.lower() for w in ["liquor", "alcohol", "daru", "sharab", "beer", "whisky", "vodka", "rum"])) or any(w in user_q_lower for w in ["daru", "daaru", "sharab", "liquor", "alcohol"]):
                is_licence_q = any(w in user_q_lower for w in ["licence", "license", "kaise", "milega", "apply", "process", "procedure"])
                if is_licence_q:
                    answer_text = (
                        "### Liquor / Alcohol Licensing & Regulatory Process in India\n\n"
                        "To obtain a licence for selling or distributing liquor in India, you must go through the respective State Government's regulatory framework:\n\n"
                        "1. **State Excise Licence (Mandatory & Primary Authority)**:\n"
                        "   • Liquor is a **State subject** under the Seventh Schedule of the Constitution of India. All commercial sales, retail vends, wholesale distribution, and bars/pubs require an official licence issued by your **State Excise Department**.\n"
                        "   • Common licence categories include **L-1 / L-2** (wholesale supply), **Retail Vend licence** (via state auction/allotment), and **L-4 / L-5** (hotels, clubs, and restaurants).\n\n"
                        "2. **FSSAI Food Safety Licence**:\n"
                        "   • You must obtain a Food Safety and Standards Authority of India (FSSAI) State or Central License under the **Food Safety and Standards (Alcoholic Beverages) Regulations, 2018**.\n\n"
                        "3. **Bureau of Indian Standards (BIS) Technical Standards**:\n"
                        "   • For manufacturing, blending, or bottling, beverages must comply with the relevant Indian Standards formulated by the BIS Food and Agriculture Division (FAD):\n"
                        "     - **IS 4449**: Whiskies — Specification\n"
                        "     - **IS 3811**: Rum — Specification\n"
                        "     - **IS 4450**: Brandies — Specification\n"
                        "     - **IS 5287**: Vodka — Specification\n"
                        "     - **IS 3865**: Beer — Specification\n"
                        "     - **IS 7058**: Gin — Specification\n\n"
                        "4. **Essential Documents Required**:\n"
                        "   • Commercial premises ownership deed or registered lease agreement\n"
                        "   • Police clearance / character certificate of applicant\n"
                        "   • PAN, Aadhaar, and GST registration\n"
                        "   • Solvency certificate / bank guarantee as prescribed by the State Excise Commissioner\n"
                        "   • Site layout / blueprint complying with statutory distance limits from schools, hospitals, and places of worship."
                    )
                    next_steps = [
                        "Visit your State Excise Department portal to review the current annual excise policy, quota tenders, and eligibility.",
                        "Apply for an FSSAI Food Business Operator (FBO) License via the FoSCoS portal (foscos.fssai.gov.in).",
                        "Ensure the commercial shop location adheres to statutory distance requirements specified under State Excise Rules.",
                    ]
                    next_question = "Aap kis State (e.g., Uttar Pradesh, Maharashtra, Delhi, Karnataka) mein licence apply karna chahte hain aur retail vend open karni hai ya bar/restaurant?"
                    actions = [
                        ActionItem(label="State Excise Rules", query="What are the State Excise licensing requirements for liquor sale?", type="certification"),
                        ActionItem(label="FSSAI Regulations", query="What are the FSSAI safety regulations for alcoholic beverages?", type="general"),
                        ActionItem(label="BIS Alcohol Standards", query="What Indian Standards apply to alcoholic beverages under BIS?", type="standard"),
                    ]
                    res_mode = ResponseMode.CERTIFICATION_GUIDANCE
                else:
                    answer_text = (
                        "### Liquor / Alcohol Business & Regulatory Framework in India\n\n"
                        "In India, the sale, distribution, and manufacturing of liquor (alcohol) is strictly governed by state jurisdiction and food safety statutory authorities:\n\n"
                        "1. **State Excise Department (Primary Regulatory Authority)**:\n"
                        "   • Under the Constitution of India, liquor is a **State subject** (Seventh Schedule, State List).\n"
                        "   • To sell, distribute, or vend liquor, obtaining a valid **State Excise Licence** from your State Government's Excise Department is strictly mandatory.\n"
                        "   • Every state has its own Excise Act, licensing categories, annual quotas, and taxation structure.\n\n"
                        "2. **FSSAI Regulations (Food Safety & Quality)**:\n"
                        "   • Alcoholic beverages must comply with the **Food Safety and Standards (Alcoholic Beverages) Regulations, 2018**.\n"
                        "   • FSSAI Central/State registration is mandatory for quality control, permissible additives, and alcoholic strength labeling.\n\n"
                        "3. **Bureau of Indian Standards (BIS) Standards**:\n"
                        "   • The Food and Agriculture Division (FAD) of BIS has formulated national quality specifications for potable spirits:\n"
                        "     - **IS 4449**: Whiskies — Specification\n"
                        "     - **IS 3811**: Rum — Specification\n"
                        "     - **IS 4450**: Brandies — Specification\n"
                        "     - **IS 5287**: Vodka — Specification\n"
                        "     - **IS 3865**: Beer — Specification\n"
                        "     - **IS 7058**: Gin — Specification"
                    )
                    next_steps = [
                        "Check your State Excise Department website for licensing categories, annual tender notices, and application procedures.",
                        "Verify whether you intend to set up a retail wine/liquor shop, a wholesale distribution entity, or a manufacturing distillery/brewery.",
                        "Register on the FSSAI FoSCoS portal (foscos.fssai.gov.in) for mandatory food and beverage safety compliance.",
                    ]
                    next_question = "Aap kis State (e.g., Delhi, Maharashtra, UP, Karnataka) mein liquor business start karna chahte hain, aur kya aap retail shop kholna chahte hain ya manufacturing/distillery?"
                    actions = [
                        ActionItem(label="Licensing Process", query="Liquor licence kaise milega aur kya process hai?", type="certification"),
                        ActionItem(label="FSSAI Safety Standards", query="What are the FSSAI safety regulations for alcoholic beverages?", type="general"),
                        ActionItem(label="BIS Alcohol Standards", query="What Indian Standards apply to alcoholic beverages under BIS?", type="standard"),
                    ]
                    res_mode = ResponseMode.PRODUCT_DISCOVERY

                final_evidence = []
                identified_stds = []
                backend_citations = []
                grounded = False
                sections = []
            else:
                answer_text = (
                    f"### Bureau of Indian Standards (BIS) Technical Advisory\n\n"
                    f"I could not locate indexed technical standard clauses or verified Quality Control Orders for {target_prod} in the local knowledge base.\n\n"
                    f"**Statutory Recommendations:**\n"
                    f"• **Manakonline Portal**: Search the complete master standards catalogue on **`manakonline.in`** under *'Know Your Standards'*.\n"
                    f"• **Quality Control Orders (QCO)**: Check whether the concerned Line Ministry (DPIIT, Ministry of Steel, MeitY, MoPNG) has notified a mandatory certification order for this category.\n"
                    f"• **Division Council**: Inquire directly with the relevant BIS Division Council (Mechanical, Chemical, Electrotechnical, Food & Agriculture, Civil)."
                )
                next_steps = [
                    "Search the official BIS Manakonline portal (manakonline.in) under 'Know Your Standards'.",
                    "Verify whether a mandatory Quality Control Order (QCO) has been published by the concerned Ministry.",
                    "Review applicable standard specifications in the relevant BIS Division Council.",
                ]

                final_evidence = []
                identified_stds = []
                backend_citations = []
                grounded = False
                res_mode = ResponseMode.GENERAL_CONVERSATION
                target_item = active_product or active_standard or "products"
                next_question = "Which product or Indian Standard would you like to explore next?"
                actions = [
                    ActionItem(label="Search Standards", query=f"How do I search Indian Standards on Manakonline for {target_item}?", type="standard"),
                    ActionItem(label="Mandatory Products", query="What are the major product categories covered under mandatory BIS certification in India?", type="general"),
                    ActionItem(label="Certification Process", query="How does the BIS product certification process work?", type="certification"),
                ]
                sections = []

        total_ms = (time.perf_counter() - t0) * 1000

        logger.info(
            f"[PERF TIMINGS] Query: '{request.message[:40]}' | Intent: {query_analysis.intent} | RAG: True | "
            f"Total: {total_ms:.1f}ms | Groq: {groq_ms:.1f}ms | Embedding: {embedding_ms:.1f}ms | "
            f"Retrieval: {retrieval_ms:.1f}ms | Validation: {validation_ms:.1f}ms | Gemini: {gemini_ms:.1f}ms"
        )

        # If user queried in Indic language, translate answer_text to user's language
        if effective_lang != "en-IN":
            try:
                answer_text = await translation_service.translate(
                    text=answer_text,
                    source_language_code="en-IN",
                    target_language_code=effective_lang,
                )
            except Exception as te:
                logger.warning(f"Failed to translate slow path answer to {effective_lang}: {te}")

            if next_question:
                try:
                    next_question = await translation_service.translate(
                        text=next_question,
                        source_language_code="en-IN",
                        target_language_code=effective_lang,
                    )
                except Exception as nqe:
                    logger.warning(f"Failed to translate next_question: {nqe}")

        # Synthesize voice audio if requested
        audio_b64 = None
        if request.enable_voice:
            try:
                audio_b64 = await sarvam_service.text_to_speech(
                    text=answer_text,
                    target_language_code=effective_lang,
                    speaker=request.voice_speaker or "priya",
                )
            except Exception as ve:
                logger.warning(f"Voice synthesis failed in slow path: {ve}")

        timings = {
            "groq_ms": round(groq_ms, 2),
            "embedding_ms": round(embedding_ms, 2),
            "retrieval_ms": round(retrieval_ms, 2),
            "validation_ms": round(validation_ms, 2),
            "gemini_ms": round(gemini_ms, 2),
            "total_ms": round(total_ms, 2),
        }

        res_mode_str = res_mode.value if isinstance(res_mode, ResponseMode) else str(res_mode)
        conv_state.record_turn(
            user_query=request.message,
            assistant_answer=answer_text,
            response_mode=res_mode_str,
            standard_number=active_standard,
            product=active_product,
            category=active_category,
        )

        standards_formatted = [
            {
                "standard_number": s.standard_number,
                "title": s.title,
                "confidence": s.confidence,
                "evidence_supported": s.evidence_supported,
            }
            for s in identified_stds
        ]

        strict_verified = bool(
            val_result.verified
            and len(backend_citations) > 0
            and grounded
            and res_mode_str not in ("GENERAL_CONVERSATION", "GREETING")
            and (active_product or active_standard)
        )
        strict_grounded = bool(
            grounded
            and len(backend_citations) > 0
            and res_mode_str not in ("GENERAL_CONVERSATION", "GREETING")
        )

        gem_thinking = gemini_payload.thinking_process if ('gemini_payload' in locals() and gemini_payload) else None

        return ChatResponse(
            success=True,
            query_analysis=query_analysis,
            identified_standards=identified_stds,
            retrieved_evidence=final_evidence,
            citations=backend_citations,
            claims_validation=val_result.claims_validation,
            certification=val_result.certification,
            compliance_info=final_compliance_info,
            testing_info=final_testing_info,
            customs_info=final_customs_info,
            renewal_info=final_renewal_info,
            batch_info=final_batch_info,
            hallmarking_info=final_hallmarking_info,
            verified=strict_verified,
            grounded=strict_grounded,
            next_steps=next_steps,
            answer=answer_text,
            message=answer_text,
            language=effective_lang,
            conversation_id=conversation_id,
            timings=timings,
            audio_base64=audio_b64,
            audio_format="audio/wav" if audio_b64 else None,
            detected_language=effective_lang,
            response_mode=res_mode_str,
            product=active_product,
            standards=standards_formatted,
            sections=sections,
            next_question=next_question,
            actions=actions,
            thinking_process=gem_thinking,
        )


# Global service instance
chat_service = ChatService()
