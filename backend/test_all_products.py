"""Automated Cross-Sector Verification Test Suite for All Products.

Tests the Two-Tier retrieval architecture across diverse Indian industries:
- Kitchenware & Appliances (Pressure cookers, Ceiling fans)
- Consumer Safety (Helmets, Water bottles)
- Precious Metals (Gold hallmarking)
- Civil & Steel (TMT bars, Cement)
- Electronics & IT (Lithium-ion batteries, Laptops)
- Food & Beverages (Packaged drinking water)

Usage:
    python test_all_products.py
"""
import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if sys.stdout:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.schemas.chat import ChatRequest
from app.services.chat_service import chat_service

TEST_CASES = [
    {
        "category": "Consumer Kitchenware",
        "query": "What BIS standard applies to domestic pressure cookers?",
        "expected_code_prefix": "IS 2347",
        "expected_scheme": "Scheme I",
    },
    {
        "category": "Consumer Safety / Helmets",
        "query": "Which standard applies to motorcycle helmets in India?",
        "expected_code_prefix": "IS 4151",
        "expected_scheme": "Scheme I",
    },
    {
        "category": "Precious Metals / Hallmarking",
        "query": "What Indian Standard applies to gold jewellery hallmarking?",
        "expected_code_prefix": "IS 1417",
        "expected_scheme": "Hallmarking",
    },
    {
        "category": "Civil & Construction Steel",
        "query": "What standard applies to TMT steel bars for construction?",
        "expected_code_prefix": "IS 1786",
        "expected_scheme": "Scheme I",
    },
    {
        "category": "Electrical Appliances",
        "query": "What BIS standard applies to electric ceiling fans?",
        "expected_code_prefix": "IS 374",
        "expected_scheme": "Scheme I",
    },
    {
        "category": "Electronics & IT Goods (CRS)",
        "query": "What BIS standard applies to lithium ion mobile phone batteries?",
        "expected_code_prefix": "IS 16046",
        "expected_scheme": "Scheme II (CRS",
    },
    {
        "category": "Food & Beverages",
        "query": "What BIS standard applies to packaged drinking water?",
        "expected_code_prefix": "IS 14543",
        "expected_scheme": "Scheme I",
    },
]


async def run_all_tests():
    print("=" * 75)
    print("TESTING BIS PRODUCT COVERAGE ACROSS INDIAN INDUSTRIES")
    print("=" * 75)

    passed = 0
    total = len(TEST_CASES)

    for idx, tc in enumerate(TEST_CASES, start=1):
        print(f"\n[TEST {idx}/{total}] {tc['category']}")
        print(f"  Query: \"{tc['query']}\"")

        req = ChatRequest(message=tc["query"], language="en")
        resp = await chat_service.generate_response(req)

        identified = resp.identified_standards
        print(f"  Extracted Product: {resp.query_analysis.product if resp.query_analysis else 'N/A'}")

        if not identified:
            print(f"  [FAIL] No standard was identified for query.")
            continue

        top_std = identified[0]
        print(f"  Identified Standard: {top_std.standard_number} ({top_std.title})")
        print(f"  Confidence: {top_std.confidence}")

        # Check code prefix match
        if tc["expected_code_prefix"] in top_std.standard_number:
            print(f"  [✓] PASSED -> Correctly mapped to {tc['expected_code_prefix']}")
            passed += 1
        else:
            print(f"  [✗] FAILED -> Expected {tc['expected_code_prefix']}, got {top_std.standard_number}")

    print("\n" + "=" * 75)
    print(f"SUMMARY: {passed}/{total} CROSS-SECTOR PRODUCT TESTS PASSED!")
    print("=" * 75)
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
