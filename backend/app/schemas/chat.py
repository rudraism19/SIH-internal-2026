from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ResponseMode:
    GENERAL_CONVERSATION = "GENERAL_CONVERSATION"
    PRODUCT_DISCOVERY = "PRODUCT_DISCOVERY"
    STANDARD_IDENTIFICATION = "STANDARD_IDENTIFICATION"
    CERTIFICATION_GUIDANCE = "CERTIFICATION_GUIDANCE"
    TESTING_GUIDANCE = "TESTING_GUIDANCE"
    LABORATORY_GUIDANCE = "LABORATORY_GUIDANCE"
    QCO_GUIDANCE = "QCO_GUIDANCE"
    DOCUMENT_GUIDANCE = "DOCUMENT_GUIDANCE"
    FOLLOW_UP = "FOLLOW_UP"


class ActionItem(BaseModel):
    label: str = Field(..., description="Button label for UI, e.g. 'Testing Requirements'")
    query: str = Field(..., description="Fully contextual query string to send when clicked")
    type: Optional[str] = Field(None, description="Action category, e.g. 'standard', 'testing', 'lab', 'document', 'qco'")


class SectionDescriptor(BaseModel):
    type: str = Field(..., description="Section type: 'certification', 'testing', 'laboratory', 'customs', 'renewal', 'batch'")
    title: str = Field(..., description="Human-readable section title")


class TopicStatus:
    CONTINUATION = "continuation"
    NEW_TOPIC = "new_topic"
    AMBIGUOUS = "ambiguous"


class QueryAnalysis(BaseModel):
    intent: Optional[str] = Field(
        None,
        description="Identified intent of the query (e.g. general_bis, certification_process, standard_identification)",
        examples=["certification_process"],
    )
    topic_status: str = Field(
        default="new_topic",
        description="Topic relation: 'continuation', 'new_topic', or 'ambiguous'",
        examples=["new_topic", "continuation", "ambiguous"],
    )
    use_previous_context: bool = Field(
        default=False,
        description="Whether to inherit previous product and standard context (True strictly for continuation)",
        examples=[True, False],
    )
    response_mode: Optional[str] = Field(
        None,
        description="Classified conversation response mode",
        examples=["PRODUCT_DISCOVERY"],
    )
    product: Optional[str] = Field(
        None,
        description="Identified product or service name",
        examples=["toilet soap"],
    )
    standard_number: Optional[str] = Field(
        None,
        description="Identified Indian Standard number if explicitly mentioned, e.g. IS 1460",
        examples=["IS 1460"],
    )
    hsn_code: Optional[str] = Field(
        None,
        description="Identified HSN / ITC-HS tariff code if mentioned, e.g. 7615.10 or 8517",
        examples=["7615.10"],
    )
    production_volume: Optional[int] = Field(
        None,
        description="Identified factory production quantity or units/month if specified by the user, e.g. 50000",
        examples=[50000],
    )
    huid_code: Optional[str] = Field(
        None,
        description="Identified 6-digit alphanumeric Hallmark Unique Identification code if provided, e.g. AB1234",
        examples=["AB1234"],
    )
    needs_rag: bool = Field(
        default=False,
        description="Whether RAG retrieval and vector search are required",
        examples=[False],
    )
    confidence: float = Field(
        default=0.9,
        ge=0.0,
        le=1.0,
        description="Classification confidence score between 0.0 and 1.0",
        examples=[0.95],
    )
    material: Optional[str] = Field(
        None,
        description="Identified material of product",
        examples=["stainless steel"],
    )
    category: Optional[str] = Field(
        None,
        description="Classified product category or industrial sector",
        examples=["consumer product"],
    )
    certification_needed: Optional[str] = Field(
        None,
        description="Whether BIS / ISI certification is needed, e.g. 'yes', 'no', 'mandatory', 'voluntary'",
        examples=["yes"],
    )
    language: str = Field(
        default="en",
        description="Detected or requested language code",
        examples=["en"],
    )


class IdentifiedStandard(BaseModel):
    standard_number: str = Field(..., description="Actual Indian Standard code, e.g. IS 2888:2004")
    title: Optional[str] = Field(None, description="Standard title, e.g. Toilet Soap — Specification")
    pages: Optional[List[int]] = Field(default_factory=list, description="Pages where standard appears in evidence")
    confidence: float = Field(..., description="Confidence that evidence supports this standard (0.0 to 1.0)")
    evidence_supported: bool = Field(default=True, description="Whether the standard is verified by BIS evidence")


class Citation(BaseModel):
    standard_number: str = Field(..., description="Actual Indian Standard code, e.g. IS 2888:2004")
    title: Optional[str] = Field(None, description="Standard title, e.g. Toilet Soap — Specification")
    page: Optional[int] = Field(None, description="Page number in original BIS PDF, or null if unavailable")
    clause: Optional[str] = Field(None, description="Clause number and title, e.g. 4.2 Material, or null")
    source: str = Field(default="BIS", description="Source document or organization, e.g. BIS")
    document_id: Optional[str] = Field(None, description="Catalogue document UUID, or null")
    content: Optional[str] = Field(None, description="Supporting evidence clause content excerpt, or null")


class ClaimValidationResult(BaseModel):
    claim: str = Field(..., description="Claim statement being validated")
    supported: bool = Field(..., description="Whether evidence supports the claim")
    citations: List[Citation] = Field(default_factory=list, description="Supporting citations if verified")


class CertificationValidation(BaseModel):
    scheme: Optional[str] = Field(None, description="Certification scheme, e.g. Scheme I (ISI Mark)")
    supported: bool = Field(default=False, description="Whether certification scheme is supported by evidence")
    citations: List[Citation] = Field(default_factory=list, description="Citations supporting certification scheme")
    message: Optional[str] = Field(None, description="Validation note or reason if unsupported")


class ComplianceStatus(BaseModel):
    """Regulatory compliance status determined from the BIS Compliance Graph."""
    is_mandatory: bool = Field(default=False, description="Whether certification is legally mandatory under a QCO or Act")
    status: str = Field(default="Voluntary", description="'Mandatory' or 'Voluntary'")
    scheme: str = Field(default="Scheme I (ISI Mark)", description="Applicable scheme (e.g. Scheme I ISI Mark, Scheme II CRS, Hallmarking)")
    qco_name: Optional[str] = Field(None, description="Official name of the Quality Control Order")
    ministry: Optional[str] = Field(None, description="Line Ministry or Regulatory Body that issued the order")
    enforcement_date: Optional[str] = Field(None, description="Date QCO came into force or transition timeline")
    legal_basis: str = Field(default="Section 16 of the Bureau of Indian Standards Act, 2016", description="Statutory authority")
    penalties_applicable: bool = Field(default=True, description="Whether Section 29 penalty provisions apply for non-compliance")
    exemptions: List[str] = Field(default_factory=list, description="Statutory exemptions (e.g. 100% export-oriented manufacture)")
    standard_number: Optional[str] = Field(None, description="Applicable Indian Standard code")
    product_name: Optional[str] = Field(None, description="Regulated product name")


class TestParameter(BaseModel):
    parameter_name: str = Field(..., description="Name of test parameter (e.g. Total Fatty Matter)")
    test_method: Optional[str] = Field(None, description="Test method, standard reference, or clause (e.g. Clause 4.2 / Annex A)")
    specification_limit: str = Field(..., description="Prescribed specification limit or pass criteria")
    criticality: str = Field(default="Mandatory", description="Criticality: Mandatory, Key Quality, or Safety")


class LabFacility(BaseModel):
    lab_name: str = Field(..., description="Name of accredited testing laboratory")
    location: str = Field(..., description="City and State of facility")
    lab_type: str = Field(default="BIS Recognized", description="Facility type: BIS Central Lab, BIS Regional Lab, or NABL Accredited (LRS)")
    accreditation: Optional[str] = Field(None, description="Accreditation status, e.g. NABL / BIS LRS Recognized")
    contact_info: Optional[str] = Field(None, description="City/region or contact detail")


class TestingAndLabInfo(BaseModel):
    standard_number: str = Field(..., description="Indian Standard code")
    product_name: str = Field(..., description="Product name")
    sample_requirements: Optional[str] = Field(None, description="Sample quantity and packaging requirements for testing")
    estimated_turnaround: Optional[str] = Field(None, description="Estimated testing turnaround time")
    critical_parameters: List[TestParameter] = Field(default_factory=list, description="Mandatory physical/chemical/safety test parameters")
    recognized_laboratories: List[LabFacility] = Field(default_factory=list, description="Accredited testing laboratories capable of testing this standard")


class HsnCustomsInfo(BaseModel):
    """Customs, HSN/ITC-HS code, and import port clearance intelligence."""
    hsn_code: str = Field(..., description="Harmonized System 4, 6, or 8-digit tariff code")
    commodity_title: str = Field(..., description="Official Customs Tariff commodity description")
    standard_number: Optional[str] = Field(None, description="Mapped Indian Standard (IS Code)")
    product_name: str = Field(..., description="Product name")
    import_policy: str = Field(default="Restricted under QCO", description="Free, Restricted under QCO, or CRS Mandatory")
    icegate_mandatory_check: bool = Field(default=True, description="Whether ICEGATE automatically holds consignment without BIS registration")
    required_documents: List[str] = Field(default_factory=list, description="Documents required on Bill of Entry (e.g. CML No., R-No., MTC)")
    port_clearance_advisory: str = Field(..., description="Clearance warning or advisory for importers/CHAs")
    statutory_exemptions: List[str] = Field(default_factory=list, description="Import exemptions under customs circulars (e.g. 100% EOU, R&D)")


class LicenseRenewalInfo(BaseModel):
    """BIS CML / CRS licence lifecycle, renewal timeline, marking fee rules, and stop-marking conditions."""
    standard_number: str = Field(..., description="Indian Standard number (e.g. IS 2347:2017)")
    product_name: str = Field(..., description="Product commodity name")
    scheme: str = Field(default="Scheme-I (ISI Mark)", description="Scheme I (ISI Mark), Scheme II (CRS), or FMCS")
    initial_validity_years: int = Field(default=1, description="Initial grant duration (1 or 2 years)")
    renewal_duration_options: List[str] = Field(default_factory=list, description="Allowed renewal periods, e.g. 1 to 5 years")
    renewal_window: str = Field(..., description="Form-VI submission window, e.g. 90 to 30 days prior to expiry")
    statutory_form: str = Field(default="Form-VI via Manakonline e-BIS", description="Statutory application form")
    minimum_marking_fee_inr: str = Field(..., description="Annual minimum marking fee or unit production rate")
    production_return_requirement: str = Field(..., description="Production return declaration (Form-VII)")
    grace_period: str = Field(..., description="Late renewal grace period (typically 90 days)")
    late_fee_penalty: str = Field(..., description="Statutory late penalty fee for filing during grace period")
    stop_marking_notice: str = Field(..., description="Regulatory stop-marking consequences under Regulation 7")
    renewal_checklist: List[str] = Field(default_factory=list, description="Required audit checklist and documents")


class RoutineTestRequirement(BaseModel):
    """Routine in-house quality control testing requirement under BIS SIT."""
    parameter_name: str = Field(..., description="Test parameter name, e.g. Hydraulic Proof Pressure")
    clause: Optional[str] = Field(None, description="Standard clause or SIT clause reference")
    frequency: str = Field(..., description="Prescribed testing frequency, e.g. 100% routine, 1 in 500, or 1 per batch")
    testing_stage: str = Field(default="In-Line Routine", description="In-Line Routine, Per Batch, Weekly Destructive, or Raw Material")
    tests_required_for_volume: Optional[int] = Field(None, description="Calculated tests required based on production volume")


class BatchCalculationInfo(BaseModel):
    """Factory production control unit and Scheme of Inspection and Testing (SIT) calculator."""
    standard_number: str = Field(..., description="Indian Standard code")
    product_name: str = Field(..., description="Product name")
    control_unit_definition: str = Field(..., description="Definition of 1 control unit/batch under the BIS SIT")
    nominal_batch_size: int = Field(..., description="Nominal units in 1 control batch")
    input_production_volume: Optional[int] = Field(None, description="User provided production volume, e.g. 50,000 units")
    calculated_batches_count: Optional[int] = Field(None, description="Total batches calculated = production volume / nominal batch size")
    routine_tests: List[RoutineTestRequirement] = Field(default_factory=list, description="Mandatory routine testing schedule")
    acceptance_criteria: str = Field(..., description="Pass/fail criteria, e.g. Zero defectives permitted")
    qa_record_keeping: List[str] = Field(default_factory=list, description="Required factory logbooks and test ledgers")


class PurityGrade(BaseModel):
    """Recognized precious metal purity grade under IS 1417 (Gold) or IS 2112 (Silver)."""
    karat: str = Field(..., description="Karat rating, e.g. 22K, 18K, 14K (or 'Silver' for silver)")
    fineness: str = Field(..., description="Millesimal fineness, e.g. 916, 750, 585, 925")
    percentage: str = Field(..., description="Pure precious metal percentage, e.g. 91.6%")
    description: str = Field(..., description="Grade description and fineness details")
    common_use: str = Field(..., description="Typical application, e.g. Traditional wedding jewellery, diamond studded")


class HallmarkingInfo(BaseModel):
    """Gold and Silver Hallmarking Scheme, HUID verification, and purity intelligence."""
    metal: str = Field(default="Gold", description="'Gold' or 'Silver'")
    standard_number: str = Field(default="IS 1417:2016", description="Applicable Indian Standard, e.g. IS 1417:2016 or IS 2112:2014")
    mandatory_marks_count: int = Field(default=3, description="Number of mandatory marks on hallmarked gold (3 mandatory marks post-July 2021)")
    mandatory_marks_description: List[str] = Field(default_factory=list, description="Descriptions of the 3 mandatory hallmark symbols")
    huid_format: str = Field(..., description="Format and structure of 6-digit alphanumeric HUID code")
    huid_verification_steps: List[str] = Field(default_factory=list, description="Step-by-step consumer verification procedure via BIS Care App")
    recognized_purity_grades: List[PurityGrade] = Field(default_factory=list, description="Statutory recognized purity grades and fineness")
    mandatory_status: str = Field(..., description="Mandatory hallmarking rollout coverage and notification details")
    mandatory_districts_count: int = Field(default=343, description="Number of notified districts where hallmarking is legally mandatory")
    exemptions: List[str] = Field(default_factory=list, description="Statutory exemptions from mandatory hallmarking")
    jeweller_registration: str = Field(..., description="Jeweller registration rules (zero fee, lifetime validity via Manakonline)")
    assaying_centres_standard: str = Field(default="IS 15820:2009", description="Standard governing Assaying & Hallmarking Centres (AHCs)")
    consumer_remedy: str = Field(..., description="Statutory redressal and 2x compensation rules under Section 19 of BIS Act")


class RetrievedEvidence(BaseModel):
    content: str = Field(..., description="Text content excerpt of the BIS document clause")
    standard_number: Optional[str] = Field(None, description="Actual Indian Standard code, e.g. IS 1460:2017, or null")
    title: Optional[str] = Field(None, description="Title of standard")
    standard_title: Optional[str] = Field(None, description="Title of standard")
    document_title: Optional[str] = Field(None, description="Parent document or publication title")
    version: Optional[str] = Field(None, description="Version or year of standard")
    page_number: Optional[int] = Field(None, description="Page number in original BIS PDF")
    section: Optional[str] = Field(None, description="Section heading")
    clause: Optional[str] = Field(None, description="Clause number and title, e.g. 4.2 Material")
    sub_clause: Optional[str] = Field(None, description="Sub-clause details")
    source_url: Optional[str] = Field(None, description="Link to official standard")
    source: str = Field(default="BIS", description="Source document or organization")
    similarity: float = Field(..., description="Cosine similarity score (0.0 to 1.0)")


class ChatRequest(BaseModel):
    message: str = Field(
        default="",
        description="User question or query about Indian Standards / BIS services",
        examples=["What BIS standard applies to my stainless steel water bottle?"],
    )
    language: str = Field(
        default="en",
        description="Language code for the conversation",
        examples=["en"],
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional unique conversation identifier",
        examples=[None],
    )
    enable_voice: Optional[bool] = Field(
        default=False,
        description="Whether to generate and return synthesized audio voice using Sarvam AI TTS",
        examples=[True],
    )
    voice_speaker: Optional[str] = Field(
        default="priya",
        description="Target Sarvam AI voice speaker (e.g. 'priya', 'aditya', 'neha', 'rahul')",
        examples=["priya"],
    )
    image_data: Optional[str] = Field(
        default=None,
        description="Base64 encoded data URI or image bytes for multimodal analysis (e.g. ISI mark, label, BIS certificate)",
        examples=[None],
    )


class ChatResponse(BaseModel):
    success: bool = Field(
        default=True,
        description="Success flag for API response",
    )
    query_analysis: Optional[QueryAnalysis] = Field(
        default=None,
        description="Structured query understanding extracted by Groq",
    )
    identified_standards: List[IdentifiedStandard] = Field(
        default_factory=list,
        description="Ranked actual BIS standards identified and verified from evidence",
    )
    citations: List[Citation] = Field(
        default_factory=list,
        description="Traceable citations to verified BIS pages, clauses, and documents",
    )
    claims_validation: List[ClaimValidationResult] = Field(
        default_factory=list,
        description="Validation results for every claim made in the response",
    )
    certification: Optional[CertificationValidation] = Field(
        default=None,
        description="Evidence-backed certification requirements validation",
    )
    compliance_info: Optional[ComplianceStatus] = Field(
        default=None,
        description="Statutory compliance status, QCO mandate, and Ministry details from Compliance Graph",
    )
    testing_info: Optional[TestingAndLabInfo] = Field(
        default=None,
        description="Accredited laboratory network, sample size, and mandatory test parameters",
    )
    customs_info: Optional[HsnCustomsInfo] = Field(
        default=None,
        description="Customs, HSN code, and import port clearance intelligence",
    )
    renewal_info: Optional[LicenseRenewalInfo] = Field(
        default=None,
        description="BIS License lifecycle, Form-VI renewal timeline, marking fee rules, and stop-marking conditions",
    )
    batch_info: Optional[BatchCalculationInfo] = Field(
        default=None,
        description="Factory Scheme of Inspection and Testing (SIT) batch size and routine testing frequency calculator",
    )
    hallmarking_info: Optional[HallmarkingInfo] = Field(
        default=None,
        description="Gold and Silver Hallmarking Scheme, HUID verification, and purity intelligence",
    )
    verified: bool = Field(
        default=False,
        description="True if identified standards and claims are backed by verified evidence",
    )
    retrieved_evidence: List[RetrievedEvidence] = Field(
        default_factory=list,
        description="Relevant BIS document clauses retrieved from Supabase pgvector",
    )
    next_steps: List[str] = Field(
        default_factory=list,
        description="Actionable next steps for the user",
    )
    grounded: bool = Field(
        default=False,
        description="Whether the response is strictly grounded in verified BIS evidence",
    )
    # 'answer' kept for backwards compatibility with Vite frontend
    answer: str = Field(
        default="No reliable BIS evidence was found in the indexed knowledge base.",
        description="Assistant reply answering the user query",
    )
    message: Optional[str] = Field(
        default=None,
        description="Status message or summary",
    )
    language: str = Field(
        default="en",
        description="Language code of the response",
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Active conversation identifier",
    )
    timings: Optional[Dict[str, float]] = Field(
        default=None,
        description="Latency breakdown in milliseconds (groq_ms, embedding_ms, retrieval_ms, validation_ms, gemini_ms, total_ms)",
    )
    audio_base64: Optional[str] = Field(
        default=None,
        description="Base64-encoded audio WAV synthesized by Sarvam AI TTS if enable_voice was True",
    )
    audio_format: Optional[str] = Field(
        default=None,
        description="MIME format of audio output, e.g. 'audio/wav'",
    )
    detected_language: Optional[str] = Field(
        default=None,
        description="Detected user language code, e.g. 'hi-IN', 'ta-IN', 'gu-IN', 'en-IN'",
    )
    # Conversational BIS Assistant Contract
    response_mode: str = Field(
        default=ResponseMode.GENERAL_CONVERSATION,
        description="Active conversation response mode",
    )
    product: Optional[str] = Field(
        default=None,
        description="Product or service name under discussion",
    )
    standards: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Standards identified formatted for conversational client",
    )
    sections: List[SectionDescriptor] = Field(
        default_factory=list,
        description="List of active structured section descriptors in the answer",
    )
    next_question: Optional[str] = Field(
        default=None,
        description="Single most useful next question to guide the user's compliance journey",
    )
    actions: List[ActionItem] = Field(
        default_factory=list,
        description="Contextual next action buttons with pre-bound queries",
    )


class VoiceTranscribeResponse(BaseModel):
    transcript: str
    language_code: str
    language_probability: Optional[float] = None
    success: bool = True


class VoiceSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to convert into speech")
    language_code: str = Field(default="hi-IN", description="Target Indic language code")
    speaker: str = Field(default="priya", description="Speaker name (e.g. priya, aditya, ritu, rahul)")
    model: str = Field(default="bulbul:v3", description="Sarvam TTS model name")


class VoiceSynthesizeResponse(BaseModel):
    audio_base64: str = Field(..., description="Base64-encoded WAV audio")
    audio_format: str = Field(default="audio/wav", description="Audio MIME type")
    success: bool = Field(default=True, description="Success status")


class GeminiAnswerPayload(BaseModel):
    """Structured response contract expected from Gemini model."""
    answer: str = Field(..., description="Grounded natural-language explanation generated by Gemini")
    identified_standards: List[dict] = Field(default_factory=list)
    citations: List[dict] = Field(default_factory=list)
    next_steps: List[str] = Field(default_factory=list, description="Actionable next steps for user")
    next_question: Optional[str] = Field(default=None, description="Intelligent follow-up question")
    actions: List[dict] = Field(default_factory=list, description="Contextual quick action items")
    sections: List[dict] = Field(default_factory=list, description="Section descriptors")
    grounded: bool = Field(default=True, description="Whether answer is grounded in provided evidence")

