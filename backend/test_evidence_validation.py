#!/usr/bin/env python
"""Comprehensive Test Suite for BIS Evidence and Citation Validation Layer.

Tests 6 required scenarios:
1. 'soap'
2. 'toilet soap'
3. 'What BIS standard applies to toilet soap?'
4. 'diesel'
5. 'What BIS standard applies to automotive diesel?'
6. 'flying saucer hoverboard' (Unindexed / no-evidence product)
"""
import sys
import asyncio
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.chat import ChatRequest
from app.services.chat_service import chat_service
from app.services.standard_identifier import is_valid_is_code


async def run_test_suite():
    print("=" * 80)
    print("BIS EVIDENCE AND CITATION VALIDATION LAYER - TEST SUITE")
    print("=" * 80)

    test_cases = [
        {
            "id": 1,
            "query": "soap",
            "expected_is": "IS 2888:2004",
            "expected_title_part": "Toilet Soap",
            "expect_verified": True,
            "expect_evidence": True,
        },
        {
            "id": 2,
            "query": "toilet soap",
            "expected_is": "IS 2888:2004",
            "expected_title_part": "Toilet Soap",
            "expect_verified": True,
            "expect_evidence": True,
        },
        {
            "id": 3,
            "query": "What BIS standard applies to toilet soap?",
            "expected_is": "IS 2888:2004",
            "expected_title_part": "Toilet Soap",
            "expect_verified": True,
            "expect_evidence": True,
        },
        {
            "id": 4,
            "query": "diesel",
            "expected_is": "IS 1460:2017",
            "expected_title_part": "Diesel",
            "expect_verified": True,
            "expect_evidence": True,
        },
        {
            "id": 5,
            "query": "What BIS standard applies to automotive diesel?",
            "expected_is": "IS 1460:2017",
            "expected_title_part": "Diesel",
            "expect_verified": True,
            "expect_evidence": True,
        },
        {
            "id": 6,
            "query": "flying saucer hoverboard",
            "expected_is": None,
            "expected_title_part": None,
            "expect_verified": False,
            "expect_evidence": False,
        },
    ]

    all_passed = True

    for tc in test_cases:
        print(f"\n[TEST CASE {tc['id']}] Query: '{tc['query']}'")
        print("-" * 60)

        req = ChatRequest(message=tc["query"])
        res = await chat_service.generate_response(req)

        # Check 1: Verification status
        if res.verified != tc["expect_verified"]:
            print(f"  FAILED: expected verified={tc['expect_verified']}, got {res.verified}")
            all_passed = False
        else:
            print(f"  [OK] verified: {res.verified}")

        # Check 2: Standard Identification
        if tc["expected_is"]:
            if not res.identified_standards:
                print(f"  FAILED: expected standard {tc['expected_is']}, got empty list")
                all_passed = False
            else:
                top_std = res.identified_standards[0]
                std_num = top_std.standard_number
                print(f"  [OK] standard_number: {std_num}")

                # Check IS code validity (never a filename)
                if not is_valid_is_code(std_num) or ".pdf" in std_num.lower():
                    print(f"  FAILED: standard_number '{std_num}' is invalid or contains filename")
                    all_passed = False
                else:
                    print("  [OK] is_valid_is_code: True (not a filename)")

                # Check expected number match
                if tc["expected_is"] not in std_num:
                    print(f"  FAILED: expected {tc['expected_is']}, got {std_num}")
                    all_passed = False

                # Check Title
                title = top_std.title or ""
                if tc["expected_title_part"].lower() not in title.lower():
                    print(f"  FAILED: expected title containing '{tc['expected_title_part']}', got '{title}'")
                    all_passed = False
                else:
                    print(f"  [OK] title: '{title}'")

                # Check Confidence (distinct from retrieval similarity)
                print(f"  [OK] confidence: {top_std.confidence} (evidence_supported: {top_std.evidence_supported})")
                if top_std.confidence <= 0 or top_std.confidence > 1.0:
                    print("  FAILED: confidence out of bounds [0, 1]")
                    all_passed = False
        else:
            # Must strictly not identify standards for unindexed products
            if res.identified_standards:
                print(f"  FAILED: expected NO standards, got: {[s.standard_number for s in res.identified_standards]}")
                all_passed = False
            else:
                print("  [OK] identified_standards: [] (Strict No-Evidence Rule enforced)")

        # Check 3: Citations
        if tc["expect_evidence"]:
            if not res.citations:
                print("  FAILED: expected citations, got none")
                all_passed = False
            else:
                top_cit = res.citations[0]
                print(f"  [OK] citations count: {len(res.citations)}")
                print(f"       top citation -> page: {top_cit.page}, clause: {top_cit.clause}, source: {top_cit.source}")

                # Check page & clause integrity: page must be int or None (never fabricated string)
                if top_cit.page is not None and not isinstance(top_cit.page, int):
                    print(f"  FAILED: page should be int or None, got {type(top_cit.page)}")
                    all_passed = False
        else:
            if res.citations:
                print(f"  FAILED: expected NO citations for unindexed query, got {len(res.citations)}")
                all_passed = False
            else:
                print("  [OK] citations: []")

        # Check 4: Claims Validation
        print(f"  [OK] claims_validation count: {len(res.claims_validation)}")
        for cv in res.claims_validation:
            print(f"       claim: '{cv.claim}' -> supported={cv.supported}")

        # Check 5: Formatted Output Structure
        print("\n  Response Answer Text:")
        print("  " + "\n  ".join(res.answer.split("\n")))

    print("\n" + "=" * 80)
    if all_passed:
        print("ALL 6 TEST SCENARIOS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED. CHECK OUTPUT ABOVE.")
    print("=" * 80)
    return all_passed


if __name__ == "__main__":
    success = asyncio.run(run_test_suite())
    sys.exit(0 if success else 1)
