#!/usr/bin/env python
"""CLI script to run the vector ingestion pipeline for catalogued BIS documents.

Usage:
    python scripts/ingest_catalogue.py --id <document-uuid>
    python scripts/ingest_catalogue.py --all-pending
    python scripts/ingest_catalogue.py --standard "IS 1460:2017"
"""
import sys
import argparse
import logging
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.services.catalogue_service import catalogue_service
from app.services.ingestion_service import ingestion_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("ingest_catalogue")


def main():
    parser = argparse.ArgumentParser(description="Ingest catalogued BIS documents into Supabase pgvector")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--id", type=str, help="UUID of catalogued document to ingest")
    group.add_argument("--standard", type=str, help="BIS Indian Standard code to look up and ingest")
    group.add_argument("--all-pending", action="store_true", help="Ingest all pending documents in catalogue")

    args = parser.parse_args()

    if args.all_pending:
        logger.info("Starting batch ingestion for all pending catalogue documents...")
        summary = ingestion_service.ingest_all_pending()
        logger.info("=" * 60)
        logger.info("BATCH INGESTION SUMMARY:")
        logger.info(f"  Total Processed : {summary['total_processed']}")
        logger.info(f"  Indexed         : {summary['indexed_count']}")
        logger.info(f"  Failed          : {summary['failed_count']}")
        logger.info("=" * 60)
        for res in summary["results"]:
            status_symbol = "✓" if res["status"] == "indexed" else "✗"
            logger.info(f"  [{status_symbol}] {res['standard_number'] or res['title']} -> {res['status']} ({res.get('chunks_count') or 0} chunks)")
            if res.get("error"):
                logger.warning(f"      Error: {res['error']}")
        sys.exit(0 if summary["failed_count"] == 0 else 1)

    target_id = args.id
    if args.standard:
        matches = catalogue_service.find_document_by_standard_number(args.standard)
        if not matches:
            logger.error(f"No catalogued document found matching standard number '{args.standard}'")
            sys.exit(1)
        target_id = matches[0].id
        logger.info(f"Found document for standard '{args.standard}': ID {target_id}")

    try:
        res = ingestion_service.ingest_document(target_id)
        logger.info("=" * 60)
        logger.info("INGESTION COMPLETED SUCCESSFULLY:")
        logger.info(f"  Document ID     : {res['document_id']}")
        logger.info(f"  Standard Number : {res.get('standard_number') or 'None'}")
        logger.info(f"  Title           : {res.get('title')}")
        logger.info(f"  Pages Extracted : {res['pages_count']}")
        logger.info(f"  Chunks Stored   : {res['chunks_count']}")
        logger.info(f"  Final Status    : {res['status']}")
        logger.info("=" * 60)
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
