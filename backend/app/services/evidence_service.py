import re
import logging
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field

from app.schemas.chat import (
    IdentifiedStandard,
    RetrievedEvidence,
    QueryAnalysis,
    Citation,
    ClaimValidationResult,
    CertificationValidation,
)
from app.services.standard_identifier import is_valid_is_code
from app.services.catalogue_service import catalogue_service

logger = logging.getLogger(__name__)


class EvidenceValidationResult(BaseModel):
    """Container holding the results of evidence and citation validation."""
    verified: bool = Field(default=False, description="Whether the response is verified by reliable BIS evidence")
    identified_standards: List[IdentifiedStandard] = Field(default_factory=list)
    citations: List[Citation] = Field(default_factory=list)
    claims_validation: List[ClaimValidationResult] = Field(default_factory=list)
    certification: Optional[CertificationValidation] = None
    message: Optional[str] = None


class EvidenceService:
    """Service layer responsible for validating that every claim in the response
    is strictly grounded in and traceable to verified BIS evidence.
    """

    def validate_evidence(
        self,
        identified_standards: List[IdentifiedStandard],
        retrieved_evidence: List[RetrievedEvidence],
        query_analysis: Optional[QueryAnalysis] = None,
        user_query: str = "",
    ) -> EvidenceValidationResult:
        """Validates identified standards, extracts traceable citations, validates claims,
        checks certification grounding, and enforces the strict no-evidence rule.
        """
        logger.info(
            f"Validating evidence for {len(identified_standards)} candidate standard(s) "
            f"against {len(retrieved_evidence)} retrieved chunk(s)"
        )

        verified_standards: List[IdentifiedStandard] = []
        all_citations: List[Citation] = []
        claims: List[ClaimValidationResult] = []
        cert_validation: Optional[CertificationValidation] = None

        user_product = (query_analysis.product.strip() if query_analysis and query_analysis.product else "").lower()
        user_material = (query_analysis.material.strip() if query_analysis and query_analysis.material else "").lower()

        # -----------------------------------------------------------------
        # 1. Inspect and Validate Each Candidate Standard
        # -----------------------------------------------------------------
        for cand in identified_standards:
            std_num = cand.standard_number.strip().upper()

            # Rule: Reject invalid codes or filenames (never use filename as standard code)
            if not is_valid_is_code(std_num):
                logger.warning(f"Rejected non-standard code: '{std_num}'")
                continue

            # Check for supporting vector evidence chunks
            supporting_chunks: List[RetrievedEvidence] = []
            for ev in retrieved_evidence:
                chunk_std = (ev.standard_number or "").strip().upper()
                chunk_content = ev.content or ""
                # Chunk directly references the standard or is tagged with it
                if chunk_std == std_num or std_num in chunk_content.upper():
                    supporting_chunks.append(ev)

            # Check for supporting catalogue record in BIS Document Catalogue
            cat_matches = catalogue_service.find_document_by_standard_number(std_num)
            cat_doc = cat_matches[0] if cat_matches else None
            cat_meta = cat_doc.metadata if cat_doc and cat_doc.metadata else {}

            # Verify standard title
            title = cand.title
            if not title and cat_doc and cat_doc.title:
                title = cat_doc.title
            elif not title and supporting_chunks:
                for sc in supporting_chunks:
                    if sc.standard_title:
                        title = sc.standard_title
                        break

            # Verify product relevance
            product_relevance_supported = False
            GENERIC_STOPWORDS = {
                "product", "products", "item", "items", "good", "goods", "material", "materials",
                "standard", "standards", "specification", "specifications", "manual", "manuals",
                "database", "tell", "what", "which", "about", "india", "indian", "need", "require",
            }
            if user_product or user_material:
                raw_terms = []
                for p_word in re.findall(r"\w+", f"{user_product} {user_material}".lower()):
                    if len(p_word) > 2 and p_word not in raw_terms:
                        raw_terms.append(p_word)

                # Strip generic stopwords so 'product' doesn't match 'Product Manual'
                filtered_terms = [t for t in raw_terms if t not in GENERIC_STOPWORDS]
                target_terms = filtered_terms if filtered_terms else raw_terms

                # Check title
                title_lower = (title or "").lower()
                if any(len(term) >= 3 and term in title_lower for term in target_terms):
                    product_relevance_supported = True

                # Check catalogue metadata / product
                if cat_doc:
                    cat_prod = (cat_doc.product or "").lower().strip()
                    cat_keywords = [str(k).lower().strip() for k in (cat_meta.get("keywords") or []) if k]
                    if cat_prod and any(len(term) >= 3 and (term in cat_prod or (len(cat_prod) >= 3 and cat_prod in term)) for term in target_terms):
                        product_relevance_supported = True
                    if any(len(term) >= 3 and (term in kw or (len(kw) >= 3 and kw in term)) for term in target_terms for kw in cat_keywords):
                        product_relevance_supported = True

                # Check chunk titles or section headings
                for sc in supporting_chunks:
                    sc_title = (sc.standard_title or sc.title or sc.document_title or "").lower()
                    if any(len(term) >= 3 and term in sc_title for term in target_terms):
                        product_relevance_supported = True
            else:
                # General query (e.g. asking directly about IS 1460)
                product_relevance_supported = True

            # If evidence supports this standard (via chunks or verified catalogue record)
            has_evidence = len(supporting_chunks) > 0 or (cat_doc is not None and product_relevance_supported)

            if has_evidence and product_relevance_supported:
                # Build verified standard object
                cand.title = title
                cand.evidence_supported = True
                verified_standards.append(cand)

                # Extract citations from supporting chunks
                standard_citations: List[Citation] = []
                for sc in supporting_chunks:
                    clean_source = sc.document_title or sc.source or "BIS"
                    if clean_source in ["Indian Standards For", "Indian Standards", "COMPENDIUM"]:
                        clean_source = f"Indian Standard {std_num}"

                    cit = Citation(
                        standard_number=std_num,
                        title=title,
                        page=sc.page_number if sc.page_number is not None else None,
                        clause=sc.clause.strip() if sc.clause else None,
                        source=clean_source,
                        document_id=sc.source_url or (str(cat_doc.id) if cat_doc else None),
                        content=sc.content.strip() if sc.content else None,
                    )
                    standard_citations.append(cit)

                # If no vector chunks exist for this standard, cite the Master Catalogue record
                if not standard_citations and cat_doc:
                    cit = Citation(
                        standard_number=std_num,
                        title=title,
                        page=None,
                        clause=None,
                        source="BIS",
                        document_id=str(cat_doc.id) if cat_doc else None,
                        content=f"Official BIS Catalogue Entry for {cat_doc.product} under {std_num}.",
                    )
                    standard_citations.append(cit)

                all_citations.extend(standard_citations)

                # Build Claim Validation
                claim_text = f"{std_num} applies to {user_product or 'the queried product'}"
                claims.append(
                    ClaimValidationResult(
                        claim=claim_text,
                        supported=True,
                        citations=standard_citations,
                    )
                )

                # Validate Certification Scheme against evidence
                scheme = cat_meta.get("certification_scheme")
                if scheme:
                    cert_validation = CertificationValidation(
                        scheme=scheme,
                        supported=True,
                        citations=standard_citations,
                        message=cat_meta.get("qco_order"),
                    )
                else:
                    cert_validation = CertificationValidation(
                        scheme=None,
                        supported=False,
                        citations=[],
                        message="Certification information was not found in the indexed BIS evidence.",
                    )
            else:
                # Claim not supported by evidence
                cand.evidence_supported = False
                claim_text = f"{std_num} applies to {user_product or 'the queried product'}"
                claims.append(
                    ClaimValidationResult(
                        claim=claim_text,
                        supported=False,
                        citations=[],
                    )
                )

        # -----------------------------------------------------------------
        # 2. Enforce the Strict No-Evidence Rule
        # -----------------------------------------------------------------
        if not verified_standards:
            logger.info("No reliable BIS evidence was found. Rejecting identification.")
            return EvidenceValidationResult(
                verified=False,
                identified_standards=[],
                citations=[],
                claims_validation=claims if claims else [
                    ClaimValidationResult(
                        claim=f"Indian Standard applies to {user_product or user_query}",
                        supported=False,
                        citations=[],
                    )
                ],
                certification=CertificationValidation(
                    scheme=None,
                    supported=False,
                    message="Certification information was not found in the indexed BIS evidence.",
                ),
                message="No reliable BIS evidence was found in the indexed knowledge base.",
            )

        return EvidenceValidationResult(
            verified=True,
            identified_standards=verified_standards,
            citations=all_citations,
            claims_validation=claims,
            certification=cert_validation,
            message=None,
        )


# Global service instance
evidence_service = EvidenceService()
