import logging
from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.ingestion.metadata import parse_clause_info, extract_standards_from_text

logger = logging.getLogger(__name__)


def create_clause_aware_chunks(
    pages: List[Dict[str, Any]],
    doc_metadata: Dict[str, Any],
    chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> List[Dict[str, Any]]:
    """Creates clause-aware chunks from PDF pages, preserving clause numbers, sections, and pages.
    
    Extracts actual Indian Standard numbers and titles present within each chunk.
    Adheres strictly to BIS document structure without blind arbitrary character slicing.
    """
    # Separators prioritizing BIS clause boundaries
    text_splitter = RecursiveCharacterTextSplitter(
        separators=[
            "\n\n",               # Paragraph / Clause block breaks
            "\n(?=[0-9]+\\.[0-9]+)", # Lookahead for numbered sub-clauses like 4.1, 5.2
            "\n(?=[0-9]+\\s+[A-Z])", # Lookahead for numbered sections like 4 REQUIREMENTS
            "\n",
            ". ",
            " ",
        ],
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=True,
    )

    chunks: List[Dict[str, Any]] = []

    current_section = None
    current_clause = None

    doc_title = doc_metadata.get("document_title") or doc_metadata.get("title")
    doc_std_num = doc_metadata.get("standard_number")
    # Verify doc_std_num is a genuine IS code, not a filename
    if doc_std_num and (not doc_std_num.upper().startswith("IS ") or ".PDF" in doc_std_num.upper()):
        doc_std_num = None

    for page_dict in pages:
        page_num = page_dict["page_number"]
        page_text = page_dict["text"]

        # Split page text into clause-aware chunks
        raw_chunks = text_splitter.split_text(page_text)

        for chunk_text in raw_chunks:
            chunk_content = chunk_text.strip()
            if not chunk_content or len(chunk_content) < 30:
                continue

            # Detect clause and section info for this chunk
            section, clause, sub_clause = parse_clause_info(chunk_content)

            # Update running context if new section or clause is detected
            if section:
                current_section = section
            if clause:
                current_clause = clause

            # Detect actual Indian Standard numbers and titles inside this chunk
            detected_standards = extract_standards_from_text(chunk_content)

            chunk_std_num = None
            chunk_std_title = None
            chunk_version = None

            if detected_standards:
                chunk_std_num = detected_standards[0]["standard_number"]
                chunk_std_title = detected_standards[0]["title"]
                chunk_version = detected_standards[0]["version"]
            elif doc_std_num:
                # If chunk has no specific standard but parent doc is a single dedicated IS standard
                chunk_std_num = doc_std_num
                chunk_std_title = doc_metadata.get("title")
                chunk_version = doc_metadata.get("version")

            # Construct structured chunk record
            chunk_record = {
                "content": chunk_content,
                "page_number": page_num,
                "section": section or current_section,
                "clause": clause or current_clause,
                "sub_clause": sub_clause,
                "standard_number": chunk_std_num,
                "standard_title": chunk_std_title,
                "document_title": doc_title,
                "version": chunk_version,
                "source_url": doc_metadata.get("source_url"),
                "metadata": {
                    "standard_number": chunk_std_num,
                    "standard_title": chunk_std_title,
                    "document_title": doc_title,
                    "version": chunk_version,
                    "page_number": page_num,
                    "section": section or current_section,
                    "clause": clause or current_clause,
                    "sub_clause": sub_clause,
                    "source": "BIS",
                    "source_url": doc_metadata.get("source_url"),
                    "detected_standards": detected_standards,
                },
            }
            chunks.append(chunk_record)

    logger.info(f"Created {len(chunks)} clause-aware chunks across {len(pages)} pages")
    return chunks
