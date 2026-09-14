import asyncio
import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.schemas.chat import ChatRequest
from app.services.chat_service import chat_service


async def run_tests():
    queries = [
        "What BIS standard applies to automotive diesel?",
        "What BIS standard applies to stainless steel water bottles?",
        "What certification is required for my product?",
        "diesel",
    ]

    print("=" * 80)
    print("RUNNING BIS RAG VERIFICATION TESTS")
    print("=" * 80)

    for idx, query in enumerate(queries, 1):
        print(f"\n{'-' * 80}")
        print(f"TEST {idx}: \"{query}\"")
        print(f"{'-' * 80}")

        request = ChatRequest(message=query, language="en")
        response = await chat_service.generate_response(request)

        print(f"Success: {response.success}")
        print(f"Query Analysis:\n{json.dumps(response.query_analysis.model_dump() if response.query_analysis else {}, indent=2)}")
        
        print("\nIdentified Standards:")
        if response.identified_standards:
            for s in response.identified_standards[:3]:
                print(f"  - Standard: {s.standard_number} | Title: {s.title} | Confidence: {s.confidence} | Pages: {s.pages}")
        else:
            print("  - None (No fabricated standards)")

        print(f"\nRetrieved Evidence Count: {len(response.retrieved_evidence)}")
        if response.retrieved_evidence:
            top_ev = response.retrieved_evidence[0]
            print(f"  - Top Evidence: Page {top_ev.page_number} | Std: {top_ev.standard_number} | Similarity: {top_ev.similarity}")

        print("\nFormatted Chat Answer:\n")
        print(response.answer)

        # Assertions
        # 1. Filename is not treated as standard number
        for s in response.identified_standards:
            assert ".pdf" not in s.standard_number.lower(), f"Filename found in standard_number: {s.standard_number}"
            assert "indianstandardsforpetroleumproducts" not in s.standard_number.lower(), f"Filename found in standard_number: {s.standard_number}"
            assert s.standard_number.upper().startswith("IS "), f"Invalid standard_number: {s.standard_number}"

        for ev in response.retrieved_evidence:
            if ev.standard_number:
                assert ".pdf" not in ev.standard_number.lower(), f"Filename found in evidence standard_number: {ev.standard_number}"
                assert "indianstandardsforpetroleumproducts" not in ev.standard_number.lower(), f"Filename found in evidence standard_number: {ev.standard_number}"

        print(f"\n>>> TEST {idx} PASSED ALL CONSTRAINTS")

    print("\n" + "=" * 80)
    print("ALL 4 TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    # Ensure UTF-8 output on Windows
    sys.stdout.reconfigure(encoding="utf-8")
    asyncio.run(run_tests())
