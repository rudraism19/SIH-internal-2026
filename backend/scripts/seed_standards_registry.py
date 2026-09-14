#!/usr/bin/env python
"""Seeder script to populate the Master BIS Product-to-Standard Registry into the catalogue.

Covers major Indian Standards across all 15 Division Councils and key mandatory schemes
(Scheme I - ISI Mark, Scheme II - CRS, Gold Hallmarking, Quality Control Orders).

Usage:
    python scripts/seed_standards_registry.py
"""
import sys
import logging
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.standards_data import MASTER_BIS_STANDARDS
from app.schemas.document import DocumentCreate
from app.services.catalogue_service import catalogue_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("seed_standards")


def seed_registry():
    logger.info("=" * 70)
    logger.info("SEEDING MASTER BIS PRODUCT-TO-STANDARD REGISTRY")
    logger.info("=" * 70)

    total_standards = len(MASTER_BIS_STANDARDS)
    logger.info(f"Loaded {total_standards} curated Indian Standards across 15 sectors.")

    created_count = 0
    existing_count = 0
    errors = 0

    for item in MASTER_BIS_STANDARDS:
        std_num = item["standard_number"]
        title = item["title"]
        product = item["product"]

        try:
            payload = DocumentCreate(
                standard_number=std_num,
                title=title,
                product=product,
                document_type=item.get("document_type", "Indian Standard"),
                version=item.get("version"),
                status=item.get("status", "Published"),
                source_url=item.get("source_url"),
                file_path=item.get("file_path"),
                file_checksum=item.get("file_checksum"),
                ingestion_status="pending",
                metadata=item.get("metadata", {}),
            )

            doc = catalogue_service.create_document(payload)
            if item.get("metadata"):
                catalogue_service.update_document_metadata(doc.id, item["metadata"])
            scheme = item.get("metadata", {}).get("certification_scheme", "Standard")
            division = item.get("metadata", {}).get("division", "BIS")

            logger.info(f"  [✓] {std_num:<18} | {product:<35} | {scheme}")
            created_count += 1

        except Exception as e:
            errors += 1
            logger.error(f"  [✗] Failed to seed {std_num}: {e}")

    logger.info("=" * 70)
    logger.info("SEEDING COMPLETED:")
    logger.info(f"  Total Processed : {total_standards}")
    logger.info(f"  Catalogued      : {created_count}")
    logger.info(f"  Errors          : {errors}")
    logger.info("=" * 70)
    return errors == 0


if __name__ == "__main__":
    success = seed_registry()
    sys.exit(0 if success else 1)
