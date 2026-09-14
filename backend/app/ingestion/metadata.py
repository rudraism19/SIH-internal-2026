import re
from typing import List, Dict, Any, Optional, Tuple


# Regex patterns tailored for Bureau of Indian Standards document headers
# Strictly matches valid Indian Standard numbers such as:
# IS 1460:2017, IS 1459:2018, IS 1234, IS 1234:2024, IS/ISO 16861:2015, IS/IEC 60079-0:2017, IS 16061 [P:1]:2013
STANDARD_NUMBER_PATTERN = re.compile(
    r"\b(IS(?:/(?:ISO|IEC))?\s+\d+(?:\s*(?:\[P:\s*\d+\]|Part\s*\d+|Pt\s*\d+|Sec\s*\d+))?(?:\s*[:\-]\s*\d{4})?(?:/(?:ISO|IEC)\s+\d+(?::\d{4})?)?)\b",
    re.IGNORECASE,
)

# Detect clause numbering, e.g. "4.2", "4.2.1", "Clause 5", "SECTION 3"
CLAUSE_PATTERN = re.compile(
    r"^(?:Clause\s+)?(\d+(?:\.\d+)+)\s+([A-Za-z0-9\s,\-\(\)]+)",
    re.MULTILINE,
)

MAJOR_SECTION_PATTERN = re.compile(
    r"^(\d+)\s+([A-Z\s]{3,50})$",
    re.MULTILINE,
)


def extract_standards_from_text(text: str) -> List[Dict[str, Any]]:
    """Extracts actual Indian Standard numbers and titles from a block of text.
    
    Returns a list of dictionaries with:
      - standard_number: e.g. 'IS 1460:2017'
      - title: e.g. 'Automotive Diesel Fuel - Specification'
      - version: e.g. '2017'
    
    Never fabricates values: if no valid IS standard is present, returns [].
    """
    results: List[Dict[str, Any]] = []
    lines = text.split("\n")
    
    for line in lines:
        cleaned_line = line.strip().lstrip("•*- ――\t")
        match = STANDARD_NUMBER_PATTERN.search(cleaned_line)
        if not match:
            continue

        raw_std = match.group(1).strip()
        # Normalize whitespace and colons: 'IS 16861 : 2018' -> 'IS 16861:2018'
        std_num = re.sub(r"\s*:\s*", ":", re.sub(r"\s+", " ", raw_std)).upper()
        
        # Verify it has digits following IS (prevent false matches like 'IS' alone)
        if not re.search(r"\d+", std_num):
            continue

        # Extract version year if present (e.g. :2017)
        version = None
        v_match = re.search(r":(\d{4})", std_num)
        if v_match:
            version = v_match.group(1)

        # Extract title from the line following the standard number
        title = None
        after_std = cleaned_line[match.end():].strip().lstrip("-–: /")
        if after_std:
            # Strip trailing parenthetical notes like '(Sixth Revision)'
            title_clean = re.sub(
                r"\s*\((?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Reaffirmed|[^\)]*Revision)[^\)]*\)",
                "",
                after_std,
                flags=re.IGNORECASE,
            ).strip()
            # Standardize dashes before specification
            title_clean = re.sub(r"\s*[–—]\s*", " - ", title_clean)
            if title_clean and len(title_clean) > 2:
                title = title_clean

        results.append({
            "standard_number": std_num,
            "title": title,
            "version": version,
        })

    return results


def extract_document_metadata(first_few_pages_text: str, filename: str) -> Dict[str, Any]:
    """Extracts document-level metadata from initial pages of a BIS PDF.
    
    Distinguishes document title from standard number.
    CRITICAL: Never sets standard_number to the filename!
    If the document does not have a single master IS code on the cover, standard_number = None.
    """
    metadata: Dict[str, Any] = {
        "standard_number": None,
        "title": None,
        "document_title": None,
        "version": None,
        "document_type": "Indian Standard",
        "source_url": None,
        "filename": filename,
    }

    # 1. Look for IS standard number on cover/title page
    # Only assign document-wide standard_number if it is prominently displayed on page 1
    first_page_text = first_few_pages_text.split("\n\n")[0] if "\n\n" in first_few_pages_text else first_few_pages_text
    match = STANDARD_NUMBER_PATTERN.search(first_page_text)
    if match:
        std_num = re.sub(r"\s*:\s*", ":", re.sub(r"\s+", " ", match.group(1))).strip().upper()
        metadata["standard_number"] = std_num
        year_match = re.search(r":(\d{4})", std_num)
        if year_match:
            metadata["version"] = year_match.group(1)

    # 2. Extract title candidate (e.g. "Indian Standards For Petroleum Products")
    lines = [line.strip().lstrip("1234567890. \t") for line in first_few_pages_text.split("\n") if line.strip()]
    for line in lines[:20]:
        if (
            len(line) > 8
            and "BUREAU OF INDIAN STANDARDS" not in line.upper()
            and "MANAK BHAVAN" not in line.upper()
            and "ICS" not in line.upper()
            and not line.upper().startswith("IS ")
        ):
            metadata["title"] = line.title()
            metadata["document_title"] = line.title()
            break

    if not metadata["title"]:
        cleaned_fname = filename.replace(".pdf", "").replace("_", " ").replace("-", " ").title()
        metadata["title"] = cleaned_fname
        metadata["document_title"] = cleaned_fname

    return metadata


def parse_clause_info(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """Identifies clause, sub-clause, and section heading from a text block if present.
    
    Returns (section, clause, sub_clause).
    """
    section = None
    clause = None
    sub_clause = None

    # Check for major numbered section, e.g. "4 REQUIREMENTS"
    major_match = MAJOR_SECTION_PATTERN.search(text)
    if major_match:
        section = f"{major_match.group(1)} {major_match.group(2).strip().title()}"

    # Check for sub-clauses, e.g. "4.2", "4.2.1"
    clause_match = CLAUSE_PATTERN.search(text)
    if clause_match:
        number = clause_match.group(1)
        heading = clause_match.group(2).strip()
        parts = number.split(".")
        if len(parts) == 2:
            clause = f"{number} {heading}"
        elif len(parts) >= 3:
            clause = f"{parts[0]}.{parts[1]}"
            sub_clause = f"{number} {heading}"
        else:
            clause = f"{number} {heading}"

    return section, clause, sub_clause
