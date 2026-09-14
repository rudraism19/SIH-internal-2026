import re
import logging
from typing import List, Dict, Any, Optional
from app.schemas.chat import RetrievedEvidence, IdentifiedStandard, QueryAnalysis
from app.ingestion.metadata import extract_standards_from_text

logger = logging.getLogger(__name__)


def is_valid_is_code(code: Optional[str]) -> bool:
    """Verifies that a string is a genuine Indian Standard code, not a filename or compendium title."""
    if not code:
        return False
    c = code.strip().upper()
    # Must start with IS, IS/ISO, or IS/IEC
    if not (c.startswith("IS ") or c.startswith("IS/") or c.startswith("IS :")):
        return False
    # Must contain numeric standard digits
    if not re.search(r"\d+", c):
        return False
    # Must not be a filename or contain duplicate artifact markers like '(1)'
    if ".PDF" in c or re.search(r"\(\d+\)", c):
        return False
    return True


def identify_standards_from_evidence(
    retrieved_evidence: List[RetrievedEvidence],
    query_analysis: Optional[QueryAnalysis] = None,
) -> List[IdentifiedStandard]:
    """Identifies and ranks actual Indian Standards from retrieved evidence chunks.
    
    Ranks standards based on:
      1. Semantic similarity of the chunk(s) referencing the standard
      2. Presence of a verified IS number (rejects filenames, compendium titles)
      3. Keyword match between user query/product/material and standard title
      4. Repeated appearance across retrieved chunks
      5. Evidence quality (presence of formal title, specification)
    
    CRITICAL: Never fabricates standard numbers. If no genuine IS standard is found, returns [].
    """
    if not retrieved_evidence:
        # Consult Master Catalogue Registry before giving up
        if query_analysis and (query_analysis.product or query_analysis.material):
            from app.services.catalogue_service import catalogue_service
            search_term = query_analysis.product or query_analysis.material
            registry_matches = catalogue_service.search_documents_by_product(search_term)
            return [
                IdentifiedStandard(
                    standard_number=doc.standard_number,
                    title=doc.title,
                    pages=[],
                    confidence=0.95,
                )
                for doc in registry_matches
                if doc.standard_number
            ]
        return []

    # Extract query terms for title relevance matching
    query_terms = set()
    if query_analysis:
        if query_analysis.product:
            query_terms.update(re.findall(r"\w+", query_analysis.product.lower()))
        if query_analysis.material:
            query_terms.update(re.findall(r"\w+", query_analysis.material.lower()))
        if query_analysis.category and query_analysis.category.lower() not in ["general", "consumer product"]:
            query_terms.update(re.findall(r"\w+", query_analysis.category.lower()))

    # Track standard candidate statistics
    candidates: Dict[str, Dict[str, Any]] = {}

    for ev in retrieved_evidence:
        found_in_chunk: List[Dict[str, Any]] = []

        # 1. Check if chunk has a validated standard_number
        if is_valid_is_code(ev.standard_number):
            found_in_chunk.append({
                "standard_number": ev.standard_number.strip().upper(),
                "title": ev.standard_title or ev.title,
                "version": ev.version,
            })

        # 2. Inspect chunk content for embedded standard declarations
        content_standards = extract_standards_from_text(ev.content)
        for s in content_standards:
            std_code = s["standard_number"].strip().upper()
            if is_valid_is_code(std_code):
                if not any(f["standard_number"] == std_code for f in found_in_chunk):
                    found_in_chunk.append(s)

        # 3. Aggregate each detected standard
        for item in found_in_chunk:
            code = item["standard_number"]
            title = item.get("title")

            if code not in candidates:
                candidates[code] = {
                    "standard_number": code,
                    "title": title,
                    "pages": set(),
                    "similarities": [],
                    "mentions": 0,
                }

            if ev.page_number is not None:
                candidates[code]["pages"].add(ev.page_number)
            candidates[code]["similarities"].append(ev.similarity)
            candidates[code]["mentions"] += 1

            # Update title if this chunk has a more complete/specific title
            existing_title = candidates[code]["title"]
            if not existing_title or (title and len(title) > len(existing_title)):
                candidates[code]["title"] = title

    ranked: List[IdentifiedStandard] = []

    if candidates:
        # Consolidate unversioned standards (e.g. 'IS 1460') into versioned ones ('IS 1460:2017')
        all_codes = list(candidates.keys())
        for code in all_codes:
            if ":" not in code and code in candidates:
                # Look for a versioned counterpart e.g. 'IS 1460:2017'
                counterparts = [c for c in candidates if c.startswith(code + ":") and c != code]
                if counterparts:
                    best_counterpart = counterparts[0]
                    candidates[best_counterpart]["pages"].update(candidates[code]["pages"])
                    candidates[best_counterpart]["similarities"].extend(candidates[code]["similarities"])
                    candidates[best_counterpart]["mentions"] += candidates[code]["mentions"]
                    del candidates[code]

        # Score and rank candidates from vector chunks
        for code, data in candidates.items():
            base_sim = max(data["similarities"]) if data["similarities"] else 0.5
            title = data["title"] or ""

            # Filter out bad title artifacts like 'and is suitable for' or 'specification no.'
            if title.lower().startswith(("and ", "is ", "the ", "for ", "to ", "under ", "meeting ")):
                title = ""

            # Factor 1: Title & Query Keyword Match
            title_lower = title.lower()
            match_count = sum(1 for term in query_terms if term in title_lower and len(term) > 2)
            match_bonus = min(0.15 * match_count, 0.25)

            # Factor 2: Frequency of mentions across chunks
            freq_bonus = min(0.03 * (data["mentions"] - 1), 0.08)

            # Factor 3: Specification keyword quality bonus
            spec_bonus = 0.03 if "specification" in title_lower else 0.0

            confidence = round(min(base_sim + match_bonus + freq_bonus + spec_bonus, 0.98), 4)

            ranked.append(
                IdentifiedStandard(
                    standard_number=code,
                    title=title if title else None,
                    pages=sorted(list(data["pages"])) if data["pages"] else [],
                    confidence=confidence,
                )
            )

        ranked.sort(key=lambda s: s.confidence, reverse=True)

        # CRITICAL: Prevent fabricating standards when user specifically asked for a product/material
        # If the user queried for a specific product (e.g. 'water bottle') and none of the standards match,
        # do not falsely attribute an unrelated standard (e.g. 'Motor Gasoline') to that product.
        if query_analysis and (query_analysis.product or query_analysis.material):
            product_kw = set()
            if query_analysis.product:
                product_kw.update(w for w in re.findall(r"\w+", query_analysis.product.lower()) if len(w) > 2)
            if query_analysis.material:
                product_kw.update(w for w in re.findall(r"\w+", query_analysis.material.lower()) if len(w) > 2)
            
            if product_kw:
                matching_standards = []
                for s in ranked:
                    title_lower = (s.title or "").lower()
                    num_lower = s.standard_number.lower()
                    if any(kw in title_lower or kw in num_lower for kw in product_kw):
                        matching_standards.append(s)
                ranked = matching_standards

    # Consult Master Catalogue Registry for guaranteed product coverage across all 15 sectors
    if query_analysis and (query_analysis.product or query_analysis.material):
        from app.services.catalogue_service import catalogue_service
        search_terms = []
        if query_analysis.product:
            search_terms.append(query_analysis.product)
        if query_analysis.material and query_analysis.material != query_analysis.product:
            search_terms.append(query_analysis.material)
        if query_analysis.product and query_analysis.material:
            search_terms.append(f"{query_analysis.material} {query_analysis.product}")

        registry_matches = []
        seen_reg_stds = set()
        for st in search_terms:
            for reg_doc in catalogue_service.search_documents_by_product(st):
                if reg_doc.standard_number and reg_doc.standard_number not in seen_reg_stds:
                    seen_reg_stds.add(reg_doc.standard_number)
                    registry_matches.append(reg_doc)

        for reg_doc in registry_matches:
            if not reg_doc.standard_number:
                continue

            existing = next((s for s in ranked if s.standard_number == reg_doc.standard_number), None)
            if existing:
                existing.confidence = max(existing.confidence, 0.98)
                if not existing.title and reg_doc.title:
                    existing.title = reg_doc.title
            else:
                ranked.append(
                    IdentifiedStandard(
                        standard_number=reg_doc.standard_number,
                        title=reg_doc.title,
                        pages=[],
                        confidence=0.95,
                    )
                )

    # Filter out cross-domain false positives (e.g. hand sanitizer for potable alcohol/liquor/daru)
    if query_analysis and any(w in (query_analysis.product or "").lower() for w in ["liquor", "alcohol", "daru", "sharab", "beer", "whisky"]):
        ranked = [
            s for s in ranked
            if not any(w in (s.title or "").lower() for w in ["sanitizer", "hand rub", "disinfectant", "handrub"])
        ]

    ranked.sort(key=lambda s: s.confidence, reverse=True)

    if not ranked:
        logger.info("No genuine Indian Standard numbers identified in retrieved evidence or Master Registry.")
        return []

    logger.info(f"Identified {len(ranked)} standards from evidence/registry: {[s.standard_number for s in ranked]}")
    return ranked
