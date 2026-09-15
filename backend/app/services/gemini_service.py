import json
import logging
from typing import List, Optional, Dict, Any
import httpx

from app.core.config import settings
from app.schemas.chat import (
    IdentifiedStandard,
    RetrievedEvidence,
    QueryAnalysis,
    Citation,
    CertificationValidation,
    ComplianceStatus,
    TestingAndLabInfo,
    HsnCustomsInfo,
    LicenseRenewalInfo,
    BatchCalculationInfo,
    HallmarkingInfo,
    GeminiAnswerPayload,
)

logger = logging.getLogger(__name__)

GEMINI_SYSTEM_PROMPT = """You are BIS Assistant (BIS Saarthi), an expert, conversational Bureau of Indian Standards compliance consultant.
Your goal is to guide manufacturers, importers, consumers, and businesses naturally, clearly, and authoritatively through Indian Standards and regulatory compliance.

CORE CONVERSATIONAL PRINCIPLES:
1. QUESTION COMPLEXITY CALIBRATION (DO NOT OVERANSWER):
   - FOR NORMAL, SIMPLE, OR GENERAL QUESTIONS (e.g. "What is BIS?", "What is an ISI Mark?", "Who can apply for certification?", "What does BIS do?"):
     * Provide a direct, crisp, natural answer in 1 to 2 focused paragraphs.
     * DO NOT generate unnecessary 5-step checklists, large tables, or lengthy legal penalty warnings.
     * Keep citations and identified_standards empty [] unless answering about a specific product standard.
   - FOR PRODUCT-SPECIFIC OR TECHNICAL COMPLIANCE INQUIRIES (e.g. "IS 1460 automotive diesel", "How to set up packaged drinking water plant", "Mandatory tests for helmets"):
     * Provide thorough, structured guidance: applicable Indian Standard (IS code), mandatory QCO status, key laboratory test parameters, and actionable next steps.
   - Clarity over Verbosity: Answer the user's actual question directly first. Never dump unrelated information.

2. VERIFIED EVIDENCE CONDITIONING (ONLY ATTACH EVIDENCE WHEN REQUIRED):
   - Only cite standards, clauses, and regulations when answering a technical product inquiry that has verified supporting evidence in the context.
   - For general, conversational, greeting, or introductory queries, leave "identified_standards": [] and "citations": [].
   - NEVER invent or hallucinate:
     * Indian Standard (IS) codes or numbers
     * Clauses or page numbers
     * Laboratory testing limits or chemical/physical parameters
     * Mandatory vs Voluntary status
     * Conformity assessment schemes or line ministries.
   - If verified evidence is not available for a specific point, explicitly state: "I do not currently have verified BIS evidence for that specific parameter in the indexed database."

3. STEP-BY-STEP REASONING & THINKING PROCESS:
   - Before formulating your final answer, you MUST articulate your step-by-step cognitive analysis inside the "thinking_process" JSON field:
     1. Analyze user intent and question complexity (conversational/general vs technical/product inquiry).
     2. Identify if a specific product, commodity, or IS standard code is queried.
     3. Check available verified context (standards, QCOs, lab parameters, customs HSN, hallmarking).
     4. Decide calibration: concise 1-2 paragraph response vs structured compliance breakdown.
     5. Synthesize grounded answer, ensuring zero hallucination.

4. KEEP OFFICIAL TECHNICAL NAMES UNCHANGED:
   - IS codes (e.g. `IS 14543:2016`, `IS 1460`), `Scheme I (ISI Mark)`, `Scheme II (CRS)`, `FMCS`, `QCO`, `HUID`, `Manakonline`.

5. LANGUAGE & ACCESSIBILITY:
   - Respond in the user's language. If the user asks in Hindi/Hinglish, reply in clear, natural Hindi/Hinglish while preserving official IS codes and portal names.

6. STRICT TOPIC FOCUS & CONTEXT ISOLATION:
   - Focus SOLELY on the product/commodity specified in the user's current query.
   - NEVER mention or carry over previous products or discussions if the user has switched topics.

7. MULTIMODAL COMPUTER VISION CAPABILITY:
   - When an image is attached, thoroughly inspect it (ISI mark, CRS mark, hallmark, product label, certificate) and report visual compliance observations.

DYNAMIC RESPONSE MODES:

- GENERAL_CONVERSATION / BROAD INQUIRIES (e.g. "What is BIS?", "How does BIS certification work?"):
  * Answer directly and conversationally in 1-2 concise paragraphs explaining the core role or general pathway.
  * Conclude with an intelligent question asking for their specific product.

- PRODUCT_DISCOVERY / BUSINESS QUESTIONS (e.g. "I want to start a packaged drinking water business", "requirements for cement"):
  * Conversational introduction acknowledging their business goal.
  * APPLICABLE STANDARDS: Bullet citing the exact standard number and title.
  * CERTIFICATION STATUS: Whether certification is MANDATORY under a QCO or VOLUNTARY.
  * COMPLIANCE JOURNEY: Concise step-by-step path (Factory setup -> Lab -> Manakonline application).
  * TESTING & LABORATORIES: Key tests and accredited labs from evidence.
  * NEXT QUESTION: A single intelligent follow-up question.

- TESTING_GUIDANCE:
  * Direct answer detailing the mandatory laboratory test parameters, specified limits, test methods/clauses, and sample requirements from evidence.

- QCO_GUIDANCE:
  * Direct clear statement: whether certification is MANDATORY under a Quality Control Order or VOLUNTARY under Scheme I, citing the issuing Ministry.

You must respond in valid JSON matching this schema:
{
  "thinking_process": "<Transparent step-by-step cognitive analysis: intent classification, calibration choice (concise vs technical), verified evidence evaluation, and compliance synthesis>",
  "answer": "<Conversational explanation with natural phrasing, level-3 headings (###) when useful, and clean bullet points>",
  "identified_standards": [
    {
      "standard_number": "<IS code from evidence or omit if none>",
      "title": "<Standard title from evidence or omit if none>"
    }
  ],
  "citations": [
    {
      "standard_number": "<IS code>",
      "page": <integer or null>,
      "clause": "<clause or null>",
      "source": "<source or BIS>"
    }
  ],
  "sections": [
    {
      "type": "certification",
      "title": "Certification Status"
    }
  ],
  "next_question": "<Intelligent follow-up question asking only what changes the answer>",
  "actions": [
    {
      "label": "Testing Requirements",
      "query": "What testing requirements apply to [product/standard]?",
      "type": "testing"
    }
  ],
  "next_steps": [
    "<Actionable step 1>"
  ],
  "grounded": true
}
"""


class GeminiService:
    """Service layer responsible for generating grounded, natural-language explanations
    using Google Gemini, strictly conditioned on verified BIS evidence.
    """

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-3.5-flash"

    def is_configured(self) -> bool:
        """Returns True if a valid Gemini API key is configured."""
        return bool(self.api_key and self.api_key.strip())

    async def generate_grounded_answer(
        self,
        user_query: str,
        query_analysis: Optional[QueryAnalysis],
        identified_standards: List[IdentifiedStandard],
        verified_evidence: List[RetrievedEvidence],
        citations: List[Citation],
        certification: Optional[CertificationValidation] = None,
        compliance_info: Optional[ComplianceStatus] = None,
        testing_info: Optional[TestingAndLabInfo] = None,
        customs_info: Optional[HsnCustomsInfo] = None,
        renewal_info: Optional[LicenseRenewalInfo] = None,
        batch_info: Optional[BatchCalculationInfo] = None,
        hallmarking_info: Optional[HallmarkingInfo] = None,
        image_data: Optional[str] = None,
    ) -> GeminiAnswerPayload:
        """Generates a natural-language grounded answer using Gemini.
        
        If Gemini is unconfigured, times out, or fails, returns a robust fallback
        answer synthesized strictly from the verified evidence.
        """
        if not self.is_configured():
            logger.warning("GEMINI_API_KEY is not configured. Using verified evidence fallback.")
            return self._build_fallback_answer(
                user_query=user_query,
                identified_standards=identified_standards,
                verified_evidence=verified_evidence,
                citations=citations,
                certification=certification,
                compliance_info=compliance_info,
                testing_info=testing_info,
                customs_info=customs_info,
                renewal_info=renewal_info,
                batch_info=batch_info,
                hallmarking_info=hallmarking_info,
            )

        # 1. Format Structured Input Context
        prompt_context = self._format_input_context(
            user_query=user_query,
            query_analysis=query_analysis,
            identified_standards=identified_standards,
            verified_evidence=verified_evidence,
            citations=citations,
            certification=certification,
            compliance_info=compliance_info,
            testing_info=testing_info,
            customs_info=customs_info,
            renewal_info=renewal_info,
            batch_info=batch_info,
            hallmarking_info=hallmarking_info,
        )

        content_parts = []
        if image_data and image_data.strip():
            raw_b64 = image_data.strip()
            mime_type = "image/jpeg"
            if ";base64," in raw_b64:
                header, raw_b64 = raw_b64.split(";base64,", 1)
                if "image/" in header:
                    mime_type = "image/" + header.split("image/", 1)[1].split(";")[0]
            elif raw_b64.startswith("data:"):
                parts = raw_b64.split(",", 1)
                if len(parts) == 2:
                    raw_b64 = parts[1]

            content_parts.append({
                "inlineData": {
                    "mimeType": mime_type,
                    "data": raw_b64.strip()
                }
            })
            prompt_context += (
                "\n\n### VISUAL INSPECTION DIRECTIVE (IMAGE ATTACHED BY USER):\n"
                "The user has uploaded a product image, label, ISI mark, Hallmark stamp, or certificate. "
                "Thoroughly analyze the image:\n"
                "1. Identify any Indian Standard code (e.g. IS 1460, IS 14543, IS 1293), product model, brand, or technical specs shown.\n"
                "2. Check ISI Mark or CRS Mark authenticity: verify if standard number is above the mark, and CM/L licence number or R-number is below.\n"
                "3. For gold/silver hallmarking: inspect the 3 mandatory hallmark components (BIS logo, karatage/fineness e.g. 22K916, and 6-digit HUID code).\n"
                "4. Assess statutory labelling compliance and provide actionable verification guidance via BIS Care App or Manakonline.\n"
            )

        content_parts.append({"text": prompt_context})

        candidate_models = []
        if self.model and self.model.strip():
            candidate_models.append(self.model.strip())
        for preferred_m in ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash"]:
            if preferred_m not in candidate_models and f"models/{preferred_m}" not in candidate_models:
                candidate_models.append(preferred_m)

        payload = {
            "system_instruction": {
                "parts": [{"text": GEMINI_SYSTEM_PROMPT}]
            },
            "contents": [
                {"parts": content_parts}
            ],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.15,
                "maxOutputTokens": 2048,
            },
        }

        try:
            response = None
            async with httpx.AsyncClient(timeout=35.0) as client:
                for cur_model in candidate_models:
                    model_path = cur_model if cur_model.startswith("models/") else f"models/{cur_model}"
                    url = f"{self.BASE_URL}/{model_path}:generateContent?key={self.api_key}"
                    logger.info(f"Calling Gemini API model '{cur_model}' for grounded answer generation...")
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        response = resp
                        break
                    else:
                        logger.warning(f"Model '{cur_model}' returned {resp.status_code}: {resp.text[:120]}. Trying next model...")
                        continue

            if response is None or response.status_code != 200:
                err_text = response.text[:300] if response else "All candidate models failed"
                logger.error(f"Gemini API generation failed: {err_text}. Using fallback.")
                return self._build_fallback_answer(
                    user_query=user_query,
                    identified_standards=identified_standards,
                    verified_evidence=verified_evidence,
                    citations=citations,
                    certification=certification,
                    compliance_info=compliance_info,
                    testing_info=testing_info,
                    customs_info=customs_info,
                    renewal_info=renewal_info,
                    batch_info=batch_info,
                )

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                logger.warning("Gemini returned empty candidates. Using fallback.")
                return self._build_fallback_answer(
                    user_query=user_query,
                    identified_standards=identified_standards,
                    verified_evidence=verified_evidence,
                    citations=citations,
                    certification=certification,
                    compliance_info=compliance_info,
                    testing_info=testing_info,
                    customs_info=customs_info,
                    renewal_info=renewal_info,
                    batch_info=batch_info,
                )

            raw_text = ""
            extracted_thought = None
            candidate_parts = candidates[0].get("content", {}).get("parts", [])
            for part in candidate_parts:
                if part.get("thought"):
                    extracted_thought = part.get("text", "")
                elif "text" in part:
                    raw_text += part.get("text", "")

            if not raw_text and candidate_parts:
                raw_text = candidate_parts[0].get("text", "")

            if not raw_text:
                logger.warning("Gemini candidate had empty text part. Using fallback.")
                return self._build_fallback_answer(
                    user_query=user_query,
                    identified_standards=identified_standards,
                    verified_evidence=verified_evidence,
                    citations=citations,
                    certification=certification,
                    compliance_info=compliance_info,
                    testing_info=testing_info,
                    customs_info=customs_info,
                    renewal_info=renewal_info,
                    batch_info=batch_info,
                )

            # Parse Structured JSON with tolerant control characters
            parsed_json = json.loads(raw_text, strict=False)

            # Extract thought/reasoning process
            thinking_process = parsed_json.get("thinking_process") or extracted_thought

            # Validate next_steps
            next_steps = parsed_json.get("next_steps", [])
            if not isinstance(next_steps, list) or not next_steps:
                next_steps = self._default_next_steps(
                    identified_standards, certification, compliance_info, testing_info, customs_info, renewal_info, batch_info, hallmarking_info
                )

            next_question = parsed_json.get("next_question")
            if not next_question or not str(next_question).strip():
                next_question = self._default_next_question(query_analysis, identified_standards, compliance_info, testing_info)

            raw_actions = parsed_json.get("actions", [])
            if isinstance(raw_actions, list) and len(raw_actions) >= 2:
                actions = raw_actions
            else:
                actions = self._default_actions(user_query, query_analysis, identified_standards)

            raw_sections = parsed_json.get("sections", [])
            sections = raw_sections if isinstance(raw_sections, list) else []

            return GeminiAnswerPayload(
                answer=parsed_json.get("answer", "").strip(),
                thinking_process=thinking_process.strip() if thinking_process else None,
                identified_standards=parsed_json.get("identified_standards", []),
                citations=parsed_json.get("citations", []),
                next_steps=[str(step) for step in next_steps],
                next_question=next_question,
                actions=actions,
                sections=sections,
                grounded=True,
            )

        except json.JSONDecodeError as jde:
            logger.error(f"Failed to decode Gemini JSON response: {jde}. Raw text: {raw_text[:200]}")
            return self._build_fallback_answer(
                user_query=user_query,
                identified_standards=identified_standards,
                verified_evidence=verified_evidence,
                citations=citations,
                certification=certification,
                compliance_info=compliance_info,
                testing_info=testing_info,
                customs_info=customs_info,
                renewal_info=renewal_info,
                batch_info=batch_info,
            )
        except Exception as e:
            logger.error(f"Error communicating with Gemini API: {e}", exc_info=True)
            return self._build_fallback_answer(
                user_query=user_query,
                identified_standards=identified_standards,
                verified_evidence=verified_evidence,
                citations=citations,
                certification=certification,
                compliance_info=compliance_info,
                testing_info=testing_info,
                customs_info=customs_info,
                renewal_info=renewal_info,
                batch_info=batch_info,
            )

    def _format_input_context(
        self,
        user_query: str,
        query_analysis: Optional[QueryAnalysis],
        identified_standards: List[IdentifiedStandard],
        verified_evidence: List[RetrievedEvidence],
        citations: List[Citation],
        certification: Optional[CertificationValidation] = None,
        compliance_info: Optional[ComplianceStatus] = None,
        testing_info: Optional[TestingAndLabInfo] = None,
        customs_info: Optional[HsnCustomsInfo] = None,
        renewal_info: Optional[LicenseRenewalInfo] = None,
        batch_info: Optional[BatchCalculationInfo] = None,
        hallmarking_info: Optional[HallmarkingInfo] = None,
    ) -> str:
        """Formats verified context, compliance graph, laboratory testing, customs, factory SIT batch, renewal, and hallmarking data into grounding prompt."""
        analysis_data = query_analysis.model_dump() if query_analysis else {}
        standards_data = [
            {
                "standard_number": s.standard_number,
                "title": s.title,
                "confidence": s.confidence,
            }
            for s in identified_standards
        ]

        evidence_items = []
        if verified_evidence:
            for idx, ev in enumerate(verified_evidence, 1):
                evidence_items.append(
                    f"Evidence Chunk {idx}:\n"
                    f"Standard: {ev.standard_number or 'N/A'}\n"
                    f"Title: {ev.title or ev.standard_title or 'N/A'}\n"
                    f"Page: {ev.page_number if ev.page_number is not None else 'N/A'}\n"
                    f"Clause: {ev.clause or 'N/A'}\n"
                    f"Source: {ev.source}\n"
                    f"Content Excerpt:\n{ev.content}\n\n"
                )
        elif citations:
            for idx, cit in enumerate(citations, 1):
                evidence_items.append(
                    f"Evidence Record {idx}:\n"
                    f"Standard: {cit.standard_number}\n"
                    f"Title: {cit.title or 'N/A'}\n"
                    f"Page: {cit.page if cit.page is not None else 'N/A'}\n"
                    f"Clause: {cit.clause or 'N/A'}\n"
                    f"Source: {cit.source}\n"
                    f"Content Excerpt:\n{cit.content or 'Official BIS Registry Entry'}\n"
                )

        compliance_section = ""
        if compliance_info:
            compliance_section = (
                f"\nCOMPLIANCE & REGULATORY GRAPH DATA:\n"
                f"- Compliance Status: {compliance_info.status} (Is Mandatory: {compliance_info.is_mandatory})\n"
                f"- Certification Scheme: {compliance_info.scheme}\n"
                f"- Quality Control Order (QCO): {compliance_info.qco_name or 'None (Voluntary Standard)'}\n"
                f"- Line Ministry: {compliance_info.ministry or 'Bureau of Indian Standards'}\n"
                f"- Enforcement Date: {compliance_info.enforcement_date or 'Active'}\n"
                f"- Legal Authority: {compliance_info.legal_basis}\n"
                f"- Exemptions: {', '.join(compliance_info.exemptions) if compliance_info.exemptions else 'None'}\n"
            )
        elif certification:
            compliance_section = f"\nCERTIFICATION STATUS:\nScheme: {certification.scheme or 'N/A'}\nMandatory/Order: {certification.message or 'N/A'}\n"

        testing_section = ""
        if testing_info:
            params_str = "\n".join(
                f"- {p.parameter_name} ({p.criticality}): {p.specification_limit} [{p.test_method or 'Clause reference'}]"
                for p in testing_info.critical_parameters[:5]
            )
            labs_str = ", ".join(f"{l.lab_name} ({l.location})" for l in testing_info.recognized_laboratories[:4])
            testing_section = (
                f"\nMANDATORY LABORATORY TESTING & ACCREDITED FACILITIES:\n"
                f"- Sample Requirements: {testing_info.sample_requirements or 'Standard sample batch'}\n"
                f"- Estimated Turnaround Time (TAT): {testing_info.estimated_turnaround or 'Standard timeline'}\n"
                f"- Critical Test Parameters:\n{params_str}\n"
                f"- Accredited Testing Facilities: {labs_str}\n"
            )

        customs_section = ""
        if customs_info:
            docs_str = "\n".join(f"- {d}" for d in customs_info.required_documents)
            exempt_str = ", ".join(customs_info.statutory_exemptions) if customs_info.statutory_exemptions else "None"
            customs_section = (
                f"\nCUSTOMS & HSN CODE REGULATORY DATA:\n"
                f"- HSN Code: {customs_info.hsn_code} ({customs_info.commodity_title})\n"
                f"- DGFT Import Policy: {customs_info.import_policy}\n"
                f"- ICEGATE Mandatory Check: {customs_info.icegate_mandatory_check}\n"
                f"- Port Clearance Advisory: {customs_info.port_clearance_advisory}\n"
                f"- Required Bill of Entry Documents:\n{docs_str}\n"
                f"- Statutory Import Exemptions: {exempt_str}\n"
            )

        batch_section = ""
        if batch_info:
            tests_summary = "\n".join(
                f"- {rt.parameter_name} [{rt.clause or 'SIT'}]: {rt.frequency} ({rt.testing_stage})" +
                (f" -> {rt.tests_required_for_volume:,} tests required" if rt.tests_required_for_volume else "")
                for rt in batch_info.routine_tests[:5]
            )
            vol_str = f"Monthly Production Volume: {batch_info.input_production_volume:,} units | Calculated Batches: {batch_info.calculated_batches_count:,}\n" if batch_info.input_production_volume else ""
            batch_section = (
                f"\nFACTORY BATCH & SIT ROUTINE TESTING DATA:\n"
                f"- Control Unit Definition: {batch_info.control_unit_definition}\n"
                f"- Nominal Batch Size: {batch_info.nominal_batch_size:,} units\n"
                f"{vol_str}"
                f"- Routine Testing Requirements:\n{tests_summary}\n"
                f"- Acceptance Criteria: {batch_info.acceptance_criteria}\n"
            )

        renewal_section = ""
        if renewal_info:
            renewal_section = (
                f"\nLICENCE LIFECYCLE, FORM-VI RENEWAL & FEES:\n"
                f"- Licence Scheme: {renewal_info.scheme}\n"
                f"- Validity Duration: {renewal_info.initial_validity_years} year(s) initially | Allowed renewals: {', '.join(renewal_info.renewal_duration_options)}\n"
                f"- Form-VI Submission Window: {renewal_info.renewal_window}\n"
                f"- Statutory Application Form: {renewal_info.statutory_form}\n"
                f"- Marking Fee: {renewal_info.minimum_marking_fee_inr}\n"
                f"- Production Return: {renewal_info.production_return_requirement}\n"
                f"- Grace Period & Late Penalty: {renewal_info.grace_period} ({renewal_info.late_fee_penalty})\n"
                f"- Stop-Marking Warning: {renewal_info.stop_marking_notice}\n"
            )

        hallmarking_section = ""
        if hallmarking_info:
            grades_str = ", ".join([f"{g.karat} ({g.fineness} / {g.percentage})" for g in hallmarking_info.recognized_purity_grades[:4]])
            marks_str = "\n".join([f"    {m}" for m in hallmarking_info.mandatory_marks_description])
            steps_str = "\n".join([f"    {s}" for s in hallmarking_info.huid_verification_steps[:3]])
            exempt_str = "; ".join(hallmarking_info.exemptions[:3])
            hallmarking_section = (
                f"\nGOLD & SILVER HALLMARKING & HUID DATA:\n"
                f"- Metal & Standard: {hallmarking_info.metal} under {hallmarking_info.standard_number}\n"
                f"- Mandatory Marks ({hallmarking_info.mandatory_marks_count} Marks):\n{marks_str}\n"
                f"- HUID Format: {hallmarking_info.huid_format}\n"
                f"- BIS Care App Verification Steps:\n{steps_str}\n"
                f"- Recognized Purity Grades: {grades_str}\n"
                f"- Mandatory Rollout: {hallmarking_info.mandatory_status}\n"
                f"- Statutory Exemptions: {exempt_str}\n"
                f"- Jeweller Registration: {hallmarking_info.jeweller_registration}\n"
                f"- Customer Redressal: {hallmarking_info.consumer_remedy}\n"
            )

        return (
            f"USER QUERY:\n{user_query}\n\n"
            f"QUERY ANALYSIS:\n{json.dumps(analysis_data, indent=2)}\n\n"
            f"IDENTIFIED STANDARDS:\n{json.dumps(standards_data, indent=2)}\n\n"
            f"{compliance_section}\n"
            f"{testing_section}\n"
            f"{customs_section}\n"
            f"{batch_section}\n"
            f"{renewal_section}\n"
            f"{hallmarking_section}\n"
            f"VERIFIED BIS EVIDENCE:\n"
            f"{''.join(evidence_items) if evidence_items else 'Official BIS Master Standards Directory Entry.'}\n"
        )

    def _default_next_steps(
        self,
        identified_standards: List[IdentifiedStandard],
        certification: Optional[CertificationValidation] = None,
        compliance_info: Optional[ComplianceStatus] = None,
        testing_info: Optional[TestingAndLabInfo] = None,
        customs_info: Optional[HsnCustomsInfo] = None,
        renewal_info: Optional[LicenseRenewalInfo] = None,
        batch_info: Optional[BatchCalculationInfo] = None,
        hallmarking_info: Optional[HallmarkingInfo] = None,
    ) -> List[str]:
        steps = []
        if hallmarking_info:
            steps.append(f"Verify the 6-digit HUID code using the 'Verify HUID' feature on the official BIS Care App.")
            steps.append(f"Ensure the jewellery piece bears all {hallmarking_info.mandatory_marks_count} mandatory marks: BIS Logo, Karat/Fineness, and 6-digit HUID.")
            steps.append("Verify that the retail invoice clearly specifies the HUID code, precious metal weight, and purity grade.")
            return steps

        if identified_standards:
            std = identified_standards[0]
            steps.append(f"Review the full technical specification for {std.standard_number} on the official BIS portal (manakonline.in).")
            if compliance_info and compliance_info.is_mandatory:
                steps.append(f"Ensure mandatory compliance with {compliance_info.qco_name} issued by {compliance_info.ministry} under {compliance_info.scheme}.")
            elif compliance_info:
                steps.append(f"Consider applying for voluntary certification under {compliance_info.scheme} to enhance market trust.")
            elif certification and certification.scheme:
                steps.append(f"Verify conformity requirements under {certification.scheme}.")
            else:
                steps.append("Check applicable Quality Control Orders (QCO) issued by the relevant Ministry.")

            if batch_info:
                steps.append(f"Implement the Scheme of Inspection and Testing (SIT) control unit of {batch_info.nominal_batch_size:,} units with mandatory 100% in-line safety checks.")

            if renewal_info:
                steps.append(f"Schedule Form-VI renewal submission {renewal_info.renewal_window.lower()} on Manakonline to avoid Regulation 7 stop-marking.")

            if testing_info and testing_info.recognized_laboratories:
                top_lab = testing_info.recognized_laboratories[0].lab_name
                steps.append(f"Prepare sample batch ({testing_info.sample_requirements or 'as prescribed'}) for testing at recognized laboratories such as {top_lab}.")
            if customs_info and customs_info.icegate_mandatory_check:
                steps.append(f"Verify that foreign manufacturing unit holds valid FMCS/CRS registration before filing ICEGATE Bill of Entry for HSN {customs_info.hsn_code}.")
        else:
            steps.append("Search the official BIS Manakonline directory under 'Know Your Standards'.")
            steps.append("Verify requirements under the relevant BIS Division Council.")
            if renewal_info:
                steps.append(f"Submit Form-VI online renewal at least 30 days prior to expiry on e-BIS.")
            if customs_info and customs_info.icegate_mandatory_check:
                steps.append(f"Verify customs clearance documents for HSN {customs_info.hsn_code} with port customs broker.")
        return steps

    def _default_next_question(
        self,
        query_analysis: Optional[QueryAnalysis],
        identified_standards: List[IdentifiedStandard],
        compliance_info: Optional[ComplianceStatus] = None,
        testing_info: Optional[TestingAndLabInfo] = None,
    ) -> str:
        product = query_analysis.product if query_analysis and query_analysis.product else None
        top_std = identified_standards[0].standard_number if identified_standards else None

        if query_analysis and query_analysis.intent == "testing_requirement":
            return f"Would you like me to locate accredited BIS recognized laboratories capable of testing under {top_std or 'this standard'}?"
        elif query_analysis and query_analysis.intent == "laboratory":
            return f"Would you like to review sample size requirements and turn-around times for {product or top_std or 'this product'}?"
        elif query_analysis and query_analysis.intent in ("qco_requirement", "certification_requirement"):
            return f"Would you like me to outline the mandatory testing benchmarks or the Form-V application steps?"
        elif top_std:
            return f"Would you like to explore the mandatory laboratory testing parameters or the factory inspection requirements for {top_std}?"
        elif product:
            return f"Would you like me to identify the specific Indian Standard (IS code) and Quality Control Order for {product}?"
        else:
            return "Which specific product or industrial sector are you planning to manufacture or certify?"

    def _default_actions(
        self,
        user_query: str,
        query_analysis: Optional[QueryAnalysis],
        identified_standards: List[IdentifiedStandard],
    ) -> List[dict]:
        product = query_analysis.product if query_analysis and query_analysis.product else None
        top_std = identified_standards[0].standard_number if identified_standards else None

        prod_label = product or "this product"
        target_clause = f"{prod_label} ({top_std})" if (product and top_std) else (top_std or prod_label)

        actions = []
        if top_std:
            actions.append({
                "label": "View Standard",
                "query": f"What are the specifications and scope of {top_std}?",
                "type": "standard",
            })
        actions.append({
            "label": "Certification Process",
            "query": f"What is the step-by-step BIS certification process for {target_clause}?",
            "type": "certification",
        })
        actions.append({
            "label": "Testing Requirements",
            "query": f"What testing requirements apply to {target_clause}?",
            "type": "testing",
        })
        actions.append({
            "label": "Find Laboratory",
            "query": f"Which accredited laboratories can test {target_clause}?",
            "type": "laboratory",
        })
        actions.append({
            "label": "Required Documents",
            "query": f"What documents are required to apply for BIS certification for {target_clause}?",
            "type": "document",
        })
        return actions

    def _build_fallback_answer(
        self,
        user_query: str,
        identified_standards: List[IdentifiedStandard],
        verified_evidence: List[RetrievedEvidence],
        citations: List[Citation],
        certification: Optional[CertificationValidation] = None,
        compliance_info: Optional[ComplianceStatus] = None,
        testing_info: Optional[TestingAndLabInfo] = None,
        customs_info: Optional[HsnCustomsInfo] = None,
        renewal_info: Optional[LicenseRenewalInfo] = None,
        batch_info: Optional[BatchCalculationInfo] = None,
        hallmarking_info: Optional[HallmarkingInfo] = None,
    ) -> GeminiAnswerPayload:
        """Constructs a deterministic, strictly grounded explanation when Gemini API is unavailable."""
        if hallmarking_info:
            grades_summary = ", ".join([f"{g.karat} ({g.fineness})" for g in hallmarking_info.recognized_purity_grades[:4]])
            marks_summary = "\n".join([f"• {m}" for m in hallmarking_info.mandatory_marks_description])
            steps_summary = "\n".join([f"• {s}" for s in hallmarking_info.huid_verification_steps[:3]])
            exemptions_summary = "; ".join(hallmarking_info.exemptions[:3]) if hallmarking_info.exemptions else "None"
            answer = (
                f"### 1. BIS Gold & Silver Hallmarking Intelligence ({hallmarking_info.standard_number})\n"
                f"• **Governing Standard**: **{hallmarking_info.standard_number}** for {hallmarking_info.metal} Jewellery / Artefacts.\n"
                f"• **Mandatory Coverage**: Legally enforced across **{hallmarking_info.mandatory_districts_count}+ notified districts** in India.\n"
                f"• **Recognized Purity Grades**: {grades_summary}.\n\n"
                f"### 2. The {hallmarking_info.mandatory_marks_count} Mandatory Marks on Hallmarked Articles\n"
                f"{marks_summary}\n\n"
                f"### 3. Verification via Official BIS Care App\n"
                f"{steps_summary}\n\n"
                f"### 4. Statutory Jeweller Terms & Consumer Remedies\n"
                f"• **Jeweller Registration**: {hallmarking_info.jeweller_registration}\n"
                f"• **Consumer Redressal (Section 19 BIS Act)**: {hallmarking_info.consumer_remedy}\n"
                f"• **Statutory Exemptions**: {exemptions_summary}."
            )
            return GeminiAnswerPayload(
                answer=answer,
                identified_standards=[{"standard_number": hallmarking_info.standard_number, "title": f"BIS Hallmarking Specification for {hallmarking_info.metal}"}],
                citations=[{"standard_number": hallmarking_info.standard_number, "page": 1, "clause": "Clause 4 & 5", "source": "BIS Hallmarking Regulations"}],
                next_steps=self._default_next_steps(
                    identified_standards, certification, compliance_info, testing_info, customs_info, renewal_info, batch_info, hallmarking_info
                ),
                next_question="Would you like to verify a specific 6-digit HUID code or review the list of notified mandatory hallmarking districts?",
                actions=[
                    {"label": "Verify HUID", "query": "How do I verify a 6-digit HUID code on BIS Care App?", "type": "hallmark"},
                    {"label": "Mandatory Districts", "query": "Which districts in India have mandatory gold hallmarking?", "type": "hallmark"},
                    {"label": "Purity Grades", "query": f"What are the recognized purity grades for {hallmarking_info.metal} hallmarking?", "type": "hallmark"},
                ],
                sections=[{"type": "hallmarking", "title": "Hallmarking & HUID"}],
                grounded=True,
            )

        if not identified_standards:
            return GeminiAnswerPayload(
                answer="I don't currently have verified BIS evidence for that specific requirement in the indexed knowledge base. If you tell me your specific product or Indian Standard code, I can guide you through the exact compliance requirements.",
                identified_standards=[],
                citations=[],
                next_steps=["Try a more specific product description.", "Search the official BIS Manakonline portal."],
                next_question="Which product or Indian Standard would you like to explore next?",
                actions=[
                    {"label": "Search Standards", "query": "How do I search Indian Standards on Manakonline?", "type": "standard"},
                    {"label": "Mandatory Products", "query": "What are the major product categories covered under mandatory BIS certification?", "type": "general"},
                    {"label": "Certification Process", "query": "How does the BIS certification process work?", "type": "certification"},
                ],
                sections=[],
                grounded=False,
            )

        top_std = identified_standards[0]
        title_str = f" (*{top_std.title}*)" if top_std.title else ""
        sections = []

        # Section 1: Statutory Mandate & Applicable Standards
        sec1 = [f"### 1. Applicable Indian Standard & Statutory Mandate\n• **Standard**: **{top_std.standard_number}**{title_str}"]
        if compliance_info:
            if compliance_info.is_mandatory:
                sec1.append(
                    f"• **Regulatory Status**: **MANDATORY** under the *{compliance_info.qco_name}* promulgated by the {compliance_info.ministry}.\n"
                    f"• **Conformity Scheme**: {compliance_info.scheme} in accordance with {compliance_info.legal_basis}.\n"
                    f"• **Enforcement**: {compliance_info.enforcement_date or 'Active & Enforced'}."
                )
            else:
                sec1.append(
                    f"• **Regulatory Status**: **VOLUNTARY** under {compliance_info.scheme}. "
                    "Manufacturers may choose to obtain the Standard Mark to certify product quality."
                )
        elif certification and certification.scheme:
            sec1.append(f"• **Certification Scheme**: {certification.scheme}.")
            if certification.message:
                sec1.append(f"• **Compliance Order**: {certification.message}.")
        sections.append("\n".join(sec1))

        # Section 2: Laboratory Testing Benchmarks
        if testing_info and testing_info.critical_parameters:
            params_bullets = "\n".join(
                f"• **{p.parameter_name}** ({p.criticality}): {p.specification_limit} [{p.test_method or 'Clause reference'}]"
                for p in testing_info.critical_parameters[:4]
            )
            labs_list = ", ".join(l.lab_name for l in testing_info.recognized_laboratories[:3]) if testing_info.recognized_laboratories else "accredited BIS laboratories and NABL LRS facilities"
            sections.append(
                f"### 2. Critical Laboratory Testing Benchmarks\n"
                f"• **Sample Requirements**: {testing_info.sample_requirements or 'Standard sample batch'}\n"
                f"• **Testing Parameters**:\n{params_bullets}\n"
                f"• **Accredited Facilities**: {labs_list}."
            )

        # Section 3: Factory Quality Control & SIT Routine
        if batch_info:
            vol_note = f" For monthly volume of {batch_info.input_production_volume:,} units, approximately {batch_info.calculated_batches_count:,} control batches must be formed." if batch_info.input_production_volume else ""
            routine_bullets = "\n".join(
                f"• **{rt.parameter_name}**: {rt.frequency} [{rt.testing_stage}]"
                for rt in batch_info.routine_tests[:3]
            )
            sections.append(
                f"### 3. Factory Scheme of Inspection and Testing (SIT)\n"
                f"• **Control Unit**: {batch_info.control_unit_definition}.{vol_note}\n"
                f"• **In-Line Quality Routines**:\n{routine_bullets}\n"
                f"• **Acceptance Criteria**: {batch_info.acceptance_criteria}."
            )

        # Section 4: Customs & Port Clearance
        if customs_info:
            icegate_note = "Automated Customs Clearance Hold is enforced (FMCS/CRS verification required)." if customs_info.icegate_mandatory_check else "No automated BIS customs hold."
            docs_list = ", ".join(customs_info.required_documents[:3]) if customs_info.required_documents else "Valid BIS Licence, Bill of Entry, and Test Certificate"
            sections.append(
                f"### 4. Customs & Port Clearance (HSN {customs_info.hsn_code})\n"
                f"• **Commodity**: {customs_info.commodity_title}\n"
                f"• **DGFT Import Policy**: {customs_info.import_policy}.\n"
                f"• **ICEGATE Status**: {icegate_note}\n"
                f"• **Required Port Documents**: {docs_list}."
            )

        # Section 5: Licence Lifecycle & Legal Enforcement
        if renewal_info:
            sections.append(
                f"### 5. Licence Validity & Form-VI Renewal\n"
                f"• **Validity**: Initial grant for {renewal_info.initial_validity_years} year(s) (renewable up to 5 years).\n"
                f"• **Filing Window**: {renewal_info.renewal_window} via e-BIS on Manakonline.\n"
                f"• **Minimum Marking Fee**: {renewal_info.minimum_marking_fee_inr}.\n"
                f"• **Grace Period & Warning**: {renewal_info.grace_period} ({renewal_info.late_fee_penalty}). {renewal_info.stop_marking_notice}"
            )

        # Section 6: Verified Evidence Note
        if verified_evidence:
            ev = verified_evidence[0]
            clause_str = f" clause {ev.clause}" if ev.clause else ""
            page_str = f" on page {ev.page_number}" if ev.page_number is not None else ""
            sections.append(f"### 6. Regulatory Note\nAccording to BIS documentation{page_str}{clause_str}, manufacturing and marketing must adhere strictly to statutory quality norms.")

        answer = "\n\n".join(sections)

        active_sections = [{"type": "standard", "title": "Applicable Standards"}]
        if compliance_info:
            active_sections.append({"type": "certification", "title": "Statutory Mandate"})
        if testing_info:
            active_sections.append({"type": "testing", "title": "Testing Requirements"})
        if batch_info:
            active_sections.append({"type": "batch", "title": "Factory Quality Control"})
        if customs_info:
            active_sections.append({"type": "customs", "title": "Customs Clearance"})
        if renewal_info:
            active_sections.append({"type": "renewal", "title": "Licence Validity & Renewal"})

        return GeminiAnswerPayload(
            answer=answer,
            thinking_process="Deterministic regulatory verification: Synthesized directly from indexed BIS standard specifications and gazette notifications.",
            identified_standards=[{"standard_number": top_std.standard_number, "title": top_std.title}],
            citations=[
                {
                    "standard_number": c.standard_number,
                    "page": c.page,
                    "clause": c.clause,
                    "source": c.source,
                }
                for c in citations
            ],
            next_steps=self._default_next_steps(
                identified_standards, certification, compliance_info, testing_info, customs_info, renewal_info, batch_info, hallmarking_info
            ),
            next_question=self._default_next_question(None, identified_standards, compliance_info, testing_info),
            actions=self._default_actions(user_query, None, identified_standards),
            sections=active_sections,
            grounded=True,
        )


# Global service instance
gemini_service = GeminiService()

