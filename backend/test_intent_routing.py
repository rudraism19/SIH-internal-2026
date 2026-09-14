#!/usr/bin/env python
"""Comprehensive Test Suite for BIS Assistant Intent Router & Backend Latency.

Verifies:
1. Fast-path intent routing for generic queries (needs_rag=False):
   - 'How do I get certification for products?' (certification_process)
   - 'What is Bureau of Indian Standards?' (general_bis)
   - 'Where can I find BIS approved laboratories?' (laboratory)
   - 'What is a Quality Control Order?' (qco_requirement)
   - 'What is the capital of France?' (unsupported)
2. Slow-path RAG execution for product queries (needs_rag=True):
   - 'What BIS standard applies to toilet soap?' (IS 2888:2004)
   - 'What BIS standard applies to automotive diesel?' (IS 1460:2017)
3. Latency timing instrumentation:
   - groq_ms, embedding_ms, retrieval_ms, validation_ms, gemini_ms, total_ms
   - embedding_ms == 0, retrieval_ms == 0, gemini_ms == 0 when needs_rag=False
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


async def run_intent_routing_tests():
    print("=" * 80)
    print("BIS ASSISTANT INTENT ROUTER & LATENCY VERIFICATION")
    print("=" * 80)

    test_cases = [
        # --- NON-RAG FAST-PATH INTENTS ---
        {
            "id": 1,
            "query": "How do I get certification for products?",
            "expected_intent": "certification_process",
            "expected_needs_rag": False,
            "expect_grounded": False,
            "must_contain": ["Manakonline", "Application", "Testing"],
        },
        {
            "id": 2,
            "query": "What is Bureau of Indian Standards?",
            "expected_intent": "general_bis",
            "expected_needs_rag": False,
            "expect_grounded": False,
            "must_contain": ["National Standards Body", "BIS Act"],
        },
        {
            "id": 3,
            "query": "Where can I find BIS approved laboratories?",
            "expected_intent": "laboratory",
            "expected_needs_rag": False,
            "expect_grounded": False,
            "must_contain": ["Central Laboratory", "LRS"],
        },
        {
            "id": 4,
            "query": "What is a Quality Control Order?",
            "expected_intent": "qco_requirement",
            "expected_needs_rag": False,
            "expect_grounded": False,
            "must_contain": ["Mandatory", "Section 16"],
        },
        {
            "id": 5,
            "query": "What is the capital of France?",
            "expected_intent": "unsupported",
            "expected_needs_rag": False,
            "expect_grounded": False,
            "must_contain": ["Assistant", "Indian Standards"],
        },
        # --- RAG SLOW-PATH PRODUCT INTENTS ---
        {
            "id": 6,
            "query": "What BIS standard applies to toilet soap?",
            "expected_intent": "standard_identification",
            "expected_needs_rag": True,
            "expect_grounded": True,
            "expected_is": "IS 2888:2004",
            "must_contain": ["2888"],
        },
        {
            "id": 7,
            "query": "What BIS standard applies to automotive diesel?",
            "expected_intent": "standard_identification",
            "expected_needs_rag": True,
            "expect_grounded": True,
            "expected_is": "IS 1460:2017",
            "must_contain": ["1460"],
        },
    ]

    all_passed = True

    for tc in test_cases:
        print(f"\n[TEST CASE {tc['id']}] Query: '{tc['query']}'")
        print("-" * 70)

        req = ChatRequest(message=tc["query"])
        res = await chat_service.generate_response(req)

        # 1. Check Intent
        actual_intent = res.query_analysis.intent if res.query_analysis else None
        if actual_intent != tc["expected_intent"]:
            print(f"  FAILED: expected intent '{tc['expected_intent']}', got '{actual_intent}'")
            all_passed = False
        else:
            print(f"  [OK] Intent: '{actual_intent}' (confidence: {res.query_analysis.confidence})")

        # 2. Check needs_rag
        actual_needs_rag = res.query_analysis.needs_rag if res.query_analysis else None
        if actual_needs_rag != tc["expected_needs_rag"]:
            print(f"  FAILED: expected needs_rag={tc['expected_needs_rag']}, got {actual_needs_rag}")
            all_passed = False
        else:
            print(f"  [OK] needs_rag: {actual_needs_rag}")

        # 3. Check Timings
        timings = res.timings or {}
        print(
            f"  [OK] Latency Timings -> Total: {timings.get('total_ms')}ms | "
            f"Groq: {timings.get('groq_ms')}ms | Embedding: {timings.get('embedding_ms')}ms | "
            f"Retrieval: {timings.get('retrieval_ms')}ms | Validation: {timings.get('validation_ms')}ms | "
            f"Gemini: {timings.get('gemini_ms')}ms"
        )

        if not tc["expected_needs_rag"]:
            if timings.get("embedding_ms", 0.0) > 0.0:
                print("  FAILED: embedding_ms must be 0.0 for non-RAG intent")
                all_passed = False
            if timings.get("retrieval_ms", 0.0) > 0.0:
                print("  FAILED: retrieval_ms must be 0.0 for non-RAG intent")
                all_passed = False
            if timings.get("gemini_ms", 0.0) > 0.0:
                print("  FAILED: gemini_ms must be 0.0 for non-RAG intent")
                all_passed = False
        else:
            if timings.get("embedding_ms", 0.0) == 0.0:
                print("  WARNING: embedding_ms was 0.0 for RAG intent")
            if timings.get("retrieval_ms", 0.0) == 0.0:
                print("  WARNING: retrieval_ms was 0.0 for RAG intent")

        # 4. Check Standard Identification (for RAG queries)
        if tc.get("expected_is"):
            if not res.identified_standards:
                print(f"  FAILED: expected standard {tc['expected_is']}, got none")
                all_passed = False
            else:
                top_std = res.identified_standards[0]
                if tc["expected_is"] not in top_std.standard_number:
                    print(f"  FAILED: expected {tc['expected_is']}, got {top_std.standard_number}")
                    all_passed = False
                else:
                    print(f"  [OK] Standard: {top_std.standard_number} ({top_std.title})")

        # 5. Check Grounded Status
        if res.grounded != tc["expect_grounded"]:
            print(f"  FAILED: expected grounded={tc['expect_grounded']}, got {res.grounded}")
            all_passed = False
        else:
            print(f"  [OK] Grounded: {res.grounded}")

        # 6. Check Next Steps
        print(f"  [OK] Next Steps ({len(res.next_steps)} items):")
        for step in res.next_steps[:2]:
            print(f"       • {step}")

        # 7. Check Content Keywords
        for phrase in tc.get("must_contain", []):
            if phrase.lower() not in res.answer.lower():
                print(f"  WARNING: expected keyword '{phrase}' in answer")

        print(f"  Answer preview: {res.answer[:140]}...")

    print("\n" + "=" * 80)
    if all_passed:
        print("ALL INTENT ROUTING & LATENCY TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED. CHECK LOGS ABOVE.")
    print("=" * 80)
    return all_passed


if __name__ == "__main__":
    success = asyncio.run(run_intent_routing_tests())
    sys.exit(0 if success else 1)
