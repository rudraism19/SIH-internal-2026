#!/usr/bin/env python
"""BIS Assistant - Local PDF Document Catalogue Script.

Scans `knowledge_base/raw/` for Bureau of Indian Standards (BIS) PDF files,
computes memory-efficient SHA-256 checksums, extracts confirmed standard numbers
(strictly avoiding treating filenames as standard numbers), and registers records
in the Supabase `bis_documents` catalogue with duplicate prevention.

Usage:
    python scripts/catalogue_local_documents.py [--folder /path/to/knowledge_base/raw]
"""
import os
import sys
import re
import hashlib
import argparse
import logging
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.document import DocumentCreate
from app.services.catalogue_service import catalogue_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("catalogue_local")

# Regex pattern strictly matching valid Indian Standard codes (e.g. IS 1460:2017, IS 17803:2022)
IS_STANDARD_PATTERN = re.compile(
    r"\b(IS\s+\d+(?:\s*(?:Part\s*\d+|Pt\s*\d+|Sec\s*\d+))?(?:\s*[:\-]\s*\d{4})?)\b",
    re.IGNORECASE,
)

# Regex pattern to match filename starting explicitly with IS number (e.g. IS-1460-2017.pdf)
IS_FILENAME_PATTERN = re.compile(
    r"^IS[\s\-_]+(\d+(?:[\s\-_]+(?:Part|Pt)[\s\-_]*\d+)?)(?:[\s\-_]+(\d{4}))?",
    re.IGNORECASE,
)


def compute_file_sha256(file_path: Path, chunk_size: int = 65536) -> str:
    """Computes SHA-256 checksum of a file streaming in 64KB chunks to minimize memory usage."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(chunk_size):
            hasher.update(chunk)
    return hasher.hexdigest()


def extract_page_one_text(file_path: Path) -> str:
    """Extracts text from the first page of a PDF using pypdf if available."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        if len(reader.pages) > 0:
            return reader.pages[0].extract_text() or ""
    except Exception as e:
        logger.debug(f"Could not extract text from {file_path.name}: {e}")
    return ""


def identify_standard_metadata(file_path: Path) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """Attempts to identify an official Indian Standard code, version, title, and product.
    
    CRITICAL GUARDRAIL:
    Never assumes filename = standard_number.
    E.g. 'INDIANSTANDARDSFORPETROLEUMPRODUCTS.pdf' will NEVER produce a standard number.
    If multiple standards appear on page 1 (compendium/index), standard_number is kept null.
    
    Returns:
        (standard_number, version, title, product)
    """
    standard_number: Optional[str] = None
    version: Optional[str] = None
    title: Optional[str] = None
    product: Optional[str] = None

    stem = file_path.stem

    # 1. Inspect Filename: ONLY if filename starts with strict IS code
    fname_match = IS_FILENAME_PATTERN.search(stem)
    if fname_match:
        num_part = fname_match.group(1).replace("-", " ").replace("_", " ")
        year_part = fname_match.group(2)
        standard_number = f"IS {num_part}" + (f":{year_part}" if year_part else "")
        if year_part:
            version = year_part

    # 2. Inspect First Page Content
    page_text = extract_page_one_text(file_path)
    if page_text:
        matches = IS_STANDARD_PATTERN.findall(page_text)
        # Normalize matches (e.g. 'IS 1460 : 2017' -> 'IS 1460:2017')
        normalized_matches = list(set([
            re.sub(r"\s*:\s*", ":", re.sub(r"\s+", " ", m)).upper()
            for m in matches
            if re.search(r"\d+", m)
        ]))

        # If exactly ONE unique standard is prominently identified on page 1, adopt it
        if len(normalized_matches) == 1:
            standard_number = normalized_matches[0]
            v_match = re.search(r":(\d{4})", standard_number)
            if v_match:
                version = v_match.group(1)
        elif len(normalized_matches) > 1 and not standard_number:
            # Compendium or compendium index with multiple standards -> DO NOT GUESS
            standard_number = None

        # Title extraction heuristic from first page
        lines = [l.strip() for l in page_text.split("\n") if l.strip()]
        for line in lines[:25]:
            upper_l = line.upper()
            if (
                len(line) > 8
                and "BUREAU OF INDIAN STANDARDS" not in upper_l
                and "MANAK BHAVAN" not in upper_l
                and "ICS" not in upper_l
                and not upper_l.startswith("IS ")
                and not upper_l.startswith("IS:")
            ):
                title = line.title()
                break

    # 3. Fallback Title from Filename (Title ONLY, never standard_number)
    if not title:
        # Turn "INDIANSTANDARDSFORPETROLEUMPRODUCTS" or "IS-1460-2017" into clean readable title
        clean_title = re.sub(r"[\-_]+", " ", stem).strip()
        # Add spaces before capital letters if CamelCase
        clean_title = re.sub(r"([a-z])([A-Z])", r"\1 \2", clean_title)
        title = clean_title.title()

    # Heuristic for product
    if title:
        # e.g., "Automotive Diesel Fuel - Specification" -> "Automotive Diesel"
        prod_candidate = re.split(r"[\-—:]|Specification", title, flags=re.IGNORECASE)[0].strip()
        if len(prod_candidate) > 2 and len(prod_candidate) < 50:
            product = prod_candidate

    return standard_number, version, title, product


def resolve_knowledge_base_dir(custom_path: Optional[str] = None) -> Path:
    """Finds the knowledge_base/raw directory across potential working directories."""
    if custom_path:
        p = Path(custom_path).resolve()
        if p.exists():
            return p
        raise FileNotFoundError(f"Specified directory '{custom_path}' does not exist.")

    candidates = [
        Path.cwd() / "knowledge_base" / "raw",
        backend_dir.parent / "knowledge_base" / "raw",
        backend_dir / "knowledge_base" / "raw",
    ]

    for c in candidates:
        if c.exists():
            return c.resolve()

    # Default fallback
    target = backend_dir.parent / "knowledge_base" / "raw"
    target.mkdir(parents=True, exist_ok=True)
    return target.resolve()


def catalogue_documents(raw_dir: Path) -> Dict[str, Any]:
    """Scans raw_dir for PDF files and registers them into the catalogue."""
    pdf_files = list(raw_dir.glob("*.pdf")) + list(raw_dir.glob("*.PDF"))
    # Remove duplicates from case-insensitive Windows filesystems
    unique_files = list({f.resolve(): f for f in pdf_files}.values())

    logger.info(f"Scanning directory: {raw_dir}")
    logger.info(f"Found {len(unique_files)} PDF document(s).")

    stats = {
        "scanned": len(unique_files),
        "catalogued": 0,
        "existing": 0,
        "failed": 0,
        "standards_identified": 0,
        "unidentified_standards": 0,
    }

    if not unique_files:
        logger.warning(
            f"No PDF files found in {raw_dir}. Place BIS Indian Standard PDF documents in this folder."
        )
        return stats

    for pdf_path in unique_files:
        try:
            logger.info("-" * 60)
            logger.info(f"Processing: {pdf_path.name}")

            # 1. Calculate SHA-256 Checksum
            checksum = compute_file_sha256(pdf_path)
            logger.info(f"  Checksum SHA-256 : {checksum[:16]}...")

            # 2. Identify Standard Number, Version, Title, Product
            std_num, version, title, product = identify_standard_metadata(pdf_path)
            if std_num:
                stats["standards_identified"] += 1
                logger.info(f"  Identified Standard: {std_num}")
            else:
                stats["unidentified_standards"] += 1
                logger.info("  Standard Number    : None (Unidentified or Compendium)")

            logger.info(f"  Title              : {title}")
            logger.info(f"  Product            : {product or 'N/A'}")

            # 3. Form relative file path from project root
            try:
                rel_path = pdf_path.relative_to(backend_dir.parent)
                file_path_str = str(rel_path).replace("\\", "/")
            except ValueError:
                file_path_str = str(pdf_path).replace("\\", "/")

            # 4. Build Catalogue Payload
            payload = DocumentCreate(
                standard_number=std_num,
                title=title,
                product=product,
                document_type="Indian Standard",
                version=version,
                status="Published",
                source_url=None,
                file_path=file_path_str,
                file_checksum=checksum,
                ingestion_status="pending",
                metadata={
                    "file_size_bytes": pdf_path.stat().st_size,
                    "original_filename": pdf_path.name,
                },
            )

            # 5. Insert with duplicate prevention
            doc_record = catalogue_service.create_document(payload)
            logger.info(f"  Catalogue Record ID: {doc_record.id} [Status: {doc_record.ingestion_status}]")
            stats["catalogued"] += 1

        except Exception as e:
            stats["failed"] += 1
            logger.error(f"Failed to catalogue {pdf_path.name}: {e}", exc_info=True)

    logger.info("=" * 60)
    logger.info("CATALOGUE SUMMARY:")
    logger.info(f"  Total Scanned           : {stats['scanned']}")
    logger.info(f"  Successfully Processed : {stats['catalogued']}")
    logger.info(f"  Standards Identified   : {stats['standards_identified']}")
    logger.info(f"  Unconfirmed Standards  : {stats['unidentified_standards']}")
    logger.info(f"  Errors / Failures      : {stats['failed']}")
    logger.info("=" * 60)

    return stats


def main():
    parser = argparse.ArgumentParser(description="Scan and catalogue local BIS PDF files into Supabase")
    parser.add_argument(
        "--folder",
        type=str,
        default=None,
        help="Path to folder containing BIS PDFs (defaults to knowledge_base/raw/)",
    )
    args = parser.parse_args()

    raw_dir = resolve_knowledge_base_dir(args.folder)
    catalogue_documents(raw_dir)


if __name__ == "__main__":
    main()
