import logging
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def load_pdf_pages(file_path: str) -> List[Dict[str, Any]]:
    """Loads a PDF file and extracts text page-by-page preserving 1-indexed page numbers.
    
    Returns a list of dictionaries: [{"page_number": int, "text": str}]
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found at: {file_path}")

    if path.suffix.lower() != ".pdf":
        raise ValueError(f"File must be a PDF. Given: {path.name}")

    logger.info(f"Reading PDF from: {path.resolve()}")
    reader = PdfReader(str(path))
    total_pages = len(reader.pages)

    if total_pages == 0:
        raise ValueError(f"PDF is empty: {path.name}")

    extracted_pages = []
    for idx, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        # Basic normalization while preserving line-break structure for clause detection
        cleaned_text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
        if cleaned_text:
            extracted_pages.append({
                "page_number": idx,
                "text": cleaned_text,
            })

    logger.info(f"Extracted text from {len(extracted_pages)} / {total_pages} pages")
    return extracted_pages
