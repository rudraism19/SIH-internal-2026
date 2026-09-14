#!/usr/bin/env python
"""Batch Ingestion Pipeline for BIS Knowledge Base

Scans `knowledge_base/raw/` for all downloaded BIS PDFs (Acts, Indian Standards,
QCO Gazettes, Product Manuals), extracts pages, executes clause-aware chunking,
computes vector embeddings, and stores them in Supabase pgvector.

Usage:
    python scripts/batch_ingest_all.py
    python scripts/batch_ingest_all.py --category indian_standards
    python scripts/batch_ingest_all.py --dry-run
"""

import sys
import argparse
import logging
from pathlib import Path
from typing import List

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.ingestion.ingest import ingest_bis_pdf
from app.core.database import get_supabase_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("BatchIngest")


def find_pdfs(kb_root: Path, category_filter: str = None) -> List[Path]:
    """Finds all PDFs in knowledge base, optionally filtered by subdirectory."""
    if not kb_root.exists():
        logger.error(f"Knowledge base directory not found: {kb_root}")
        return []

    if category_filter:
        target_dir = kb_root / category_filter
        if not target_dir.exists():
            logger.error(f"Category directory does not exist: {target_dir}")
            return []
        return sorted(list(target_dir.glob("*.pdf")))

    return sorted(list(kb_root.rglob("*.pdf")))


def main():
    parser = argparse.ArgumentParser(description="Batch Ingestion for BIS Knowledge Base")
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Subdirectory to ingest (e.g., 'indian_standards', 'certification', 'product_manuals')",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only list files that would be processed without ingesting",
    )
    args = parser.parse_args()

    kb_root = backend_dir.parent / "knowledge_base" / "raw"
    if not kb_root.exists():
        kb_root = backend_dir / "knowledge_base" / "raw"

    pdf_files = find_pdfs(kb_root, args.category)

    logger.info("==================================================================")
    logger.info("       BIS ASSISTANT — BATCH RAG VECTOR INGESTION PIPELINE       ")
    logger.info("==================================================================")
    logger.info(f"Target Directory: {kb_root}")
    logger.info(f"Total PDFs found: {len(pdf_files)}")

    if not pdf_files:
        logger.warning("No PDF documents found to ingest.")
        return

    for idx, pdf in enumerate(pdf_files, 1):
        rel_path = pdf.relative_to(kb_root)
        size_mb = pdf.stat().st_size / (1024 * 1024)
        logger.info(f" [{idx:02d}/{len(pdf_files):02d}] {str(rel_path):<55} ({size_mb:.2f} MB)")

    if args.dry_run:
        logger.info("\nDry run mode completed. No database changes were made.")
        return

    # Verify Supabase connection
    client = get_supabase_client()
    if not client:
        logger.error("Supabase client could not be initialized. Check .env credentials.")
        sys.exit(1)

    successful = 0
    failed = 0
    total_chunks = 0

    for idx, pdf in enumerate(pdf_files, 1):
        logger.info(f"\n--- Ingesting ({idx}/{len(pdf_files)}): {pdf.name} ---")
        try:
            result = ingest_bis_pdf(str(pdf))
            successful += 1
            chunks = result.get("chunks_count", 0)
            total_chunks += chunks
            logger.info(f"✓ Success: {result['standard_number']} | Chunks: {chunks}")
        except Exception as e:
            failed += 1
            logger.error(f"✗ Failed to ingest {pdf.name}: {e}")

    logger.info("\n==================================================================")
    logger.info("                  INGESTION SUMMARY REPORT                       ")
    logger.info("==================================================================")
    logger.info(f" Total Processed : {len(pdf_files)}")
    logger.info(f" Successful      : {successful}")
    logger.info(f" Failed          : {failed}")
    logger.info(f" Total Chunks    : {total_chunks}")
    logger.info("==================================================================")


if __name__ == "__main__":
    main()
