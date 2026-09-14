"""Automated Downloader for Official BIS Documents & Indian Standards

Downloads statutory acts, mandatory Indian Standards (IS), QCO gazettes,
and product manuals into the categorized `knowledge_base/raw/` directory.
"""

import os
import sys
import ssl
import json
import urllib.request
import logging
from pathlib import Path
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("BISDownloader")

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
KB_RAW = BASE_DIR / "knowledge_base" / "raw"
if not KB_RAW.exists():
    # If called from backend/, KB is at parent
    KB_RAW = BASE_DIR.parent / "knowledge_base" / "raw"

# Curated High-Value Statutory Documents and Standards Registry
CURATED_DOCUMENTS = [
    # --- 1. STATUTORY ACTS & REGULATIONS ---
    {
        "id": "bis_act_2016",
        "category": "certification",
        "standard_number": "BIS Act, 2016",
        "title": "The Bureau of Indian Standards Act, 2016 (Act No. 11 of 2016)",
        "version": "2016",
        "filename": "BIS_Act_2016_Official.pdf",
        "direct_url": "https://www.bis.gov.in/wp-content/uploads/2020/12/The-BIS-Act-2016.pdf",
        "fallback_url": "https://archive.org/download/in.gov.law.2016.11/in.gov.law.2016.11.pdf",
    },
    {
        "id": "bis_conformity_2018",
        "category": "certification",
        "standard_number": "Conformity Regulations 2018",
        "title": "Bureau of Indian Standards (Conformity Assessment) Regulations, 2018",
        "version": "2018",
        "filename": "BIS_Conformity_Assessment_Regulations_2018.pdf",
        "direct_url": "https://www.bis.gov.in/wp-content/uploads/2018/06/Conformity-Assessment-Regulations-2018.pdf",
        "fallback_url": "https://archive.org/download/bis_regulations_2018/Conformity_Assessment_Regulations_2018.pdf",
    },

    # --- 2. PRIORITY INDIAN STANDARDS (OPEN DIRECT MIRRORS) ---
    {
        "id": "is_2347_cooker",
        "category": "indian_standards",
        "standard_number": "IS 2347:2023",
        "title": "Domestic Pressure Cooker — Specification",
        "version": "2023",
        "filename": "IS_2347_2023_Domestic_Pressure_Cookers.pdf",
        "direct_url": "https://archive.org/download/gov.in.is.2347.2023/gov.in.is.2347.2023.pdf",
        "fallback_url": "https://archive.org/download/gov.in.is.2347.2006/is.2347.2006.pdf",
    },
    {
        "id": "is_4151_helmet",
        "category": "indian_standards",
        "standard_number": "IS 4151:2015",
        "title": "Protective Helmet for Two Wheeler Riders — Specification",
        "version": "2015",
        "filename": "IS_4151_2015_Protective_Helmets.pdf",
        "direct_url": "https://archive.org/download/gov.in.is.4151.2015/gov.in.is.4151.2015.pdf",
        "fallback_url": "https://archive.org/download/gov.in.is.4151.1993/is.4151.1993.pdf",
    },
    {
        "id": "is_1417_gold",
        "category": "indian_standards",
        "standard_number": "IS 1417:2016",
        "title": "Gold and Gold Alloys, Jewellery/Artefacts — Fineness and Marking",
        "version": "2016",
        "filename": "IS_1417_2016_Gold_Hallmarking.pdf",
        "direct_url": "https://archive.org/download/gov.in.is.1417.1999/is.1417.1999.pdf",
        "fallback_url": "https://archive.org/download/gov.in.is.1417.2009/is.1417.2009.pdf",
    },
    {
        "id": "is_2112_silver",
        "category": "indian_standards",
        "standard_number": "IS 2112:2014",
        "title": "Silver and Silver Alloys, Jewellery/Artefacts — Fineness and Marking",
        "version": "2014",
        "filename": "IS_2112_2014_Silver_Hallmarking.pdf",
        "direct_url": "https://archive.org/download/gov.in.is.2112.2014/gov.in.is.2112.2014.pdf",
        "fallback_url": "https://archive.org/download/gov.in.is.2112.2003/is.2112.2003.pdf",
    },
    {
        "id": "is_14543_water",
        "category": "indian_standards",
        "standard_number": "IS 14543:2016",
        "title": "Packaged Drinking Water (Other than Packaged Natural Mineral Water)",
        "version": "2016",
        "filename": "IS_14543_2016_Packaged_Drinking_Water.pdf",
        "direct_url": "https://archive.org/download/gov.in.is.14543.2016/gov.in.is.14543.2016.pdf",
        "fallback_url": "https://archive.org/download/gov.in.is.14543.2004/is.14543.2004.pdf",
    },
    {
        "id": "is_13252_it_safety",
        "category": "indian_standards",
        "standard_number": "IS 13252 (Part 1):2010",
        "title": "Information Technology Equipment — Safety (CRS Scheme-II)",
        "version": "2010",
        "filename": "IS_13252_Part1_2010_IT_Equipment_Safety.pdf",
        "direct_url": "https://archive.org/download/gov.in.is.13252.1.2010/gov.in.is.13252.1.2010.pdf",
        "fallback_url": "https://archive.org/download/gov.in.is.13252.2003/is.13252.2003.pdf",
    },

    # --- 3. QCO NOTIFICATIONS ---
    {
        "id": "qco_footwear_2023",
        "category": "qco_gazette",
        "standard_number": "Footwear QCO 2023",
        "title": "Footwear Made from Leather and Other Materials (Quality Control) Order, 2023",
        "version": "2023",
        "filename": "Footwear_QCO_Gazette_Notification_2023.pdf",
        "direct_url": "https://dpiit.gov.in/sites/default/files/Footwear_QCO_Notification_2023.pdf",
        "fallback_url": "https://archive.org/download/footwear_qco_2023/Footwear_QCO_2023.pdf",
    },
    {
        "id": "qco_toys_2020",
        "category": "qco_gazette",
        "standard_number": "Toys QCO 2020",
        "title": "Toys (Quality Control) Order, 2020",
        "version": "2020",
        "filename": "Toys_Quality_Control_Order_2020.pdf",
        "direct_url": "https://dpiit.gov.in/sites/default/files/Toys_QCO_Order_2020.pdf",
        "fallback_url": "https://archive.org/download/toys_qco_2020/Toys_QCO_2020.pdf",
    },
]


def download_file(url: str, dest_path: Path, timeout: int = 30) -> bool:
    """Downloads a file using urllib with SSL bypass and realistic headers."""
    ctx = ssl._create_unverified_context()
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/pdf,*/*",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as response:
            if response.status == 200:
                content = response.read()
                if len(content) < 1024:
                    logger.warning(f"File too small ({len(content)} bytes), may be HTML error block: {url}")
                    return False
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                with open(dest_path, "wb") as f:
                    f.write(content)
                logger.info(f"Downloaded {len(content):,} bytes -> {dest_path.name}")
                return True
            logger.warning(f"HTTP Status {response.status} from {url}")
            return False
    except Exception as e:
        logger.warning(f"Download failed from {url}: {e}")
        return False


def run_downloader():
    logger.info("==================================================================")
    logger.info("   BUREAU OF INDIAN STANDARDS — STATUTORY REPOSITORY DOWNLOADER   ")
    logger.info("==================================================================")
    logger.info(f"Target Knowledge Base directory: {KB_RAW.resolve()}")

    results = []

    for item in CURATED_DOCUMENTS:
        target_dir = KB_RAW / item["category"]
        dest_file = target_dir / item["filename"]

        logger.info(f"\n[+] Checking: {item['standard_number']} — {item['title']}")

        if dest_file.exists() and dest_file.stat().st_size > 5000:
            logger.info(f"   -> Already exists on disk ({dest_file.stat().st_size:,} bytes). Skipping download.")
            results.append({"id": item["id"], "status": "exists", "path": str(dest_file)})
            continue

        success = False
        # Try direct URL
        if item.get("direct_url"):
            logger.info(f"   -> Trying primary source: {item['direct_url']}")
            success = download_file(item["direct_url"], dest_file)

        # Try fallback URL if needed
        if not success and item.get("fallback_url"):
            logger.info(f"   -> Trying open mirror fallback: {item['fallback_url']}")
            success = download_file(item["fallback_url"], dest_file)

        if success:
            results.append({"id": item["id"], "status": "downloaded", "path": str(dest_file)})
        else:
            logger.error(f"   -> Could not download {item['standard_number']}. Please download manually.")
            results.append({"id": item["id"], "status": "failed", "path": None})

    logger.info("\n==================================================================")
    logger.info("                     DOWNLOAD SUMMARY REPORT                      ")
    logger.info("==================================================================")
    for r in results:
        status_symbol = "✓" if r["status"] in ("downloaded", "exists") else "✗"
        logger.info(f" [{status_symbol}] {r['id']:<20} | Status: {r['status']:<12} | Path: {r['path']}")


if __name__ == "__main__":
    run_downloader()
