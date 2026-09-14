import asyncio
import json
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

if sys.stdout:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.services.groq_service import groq_service
from app.services.rag_service import rag_service


async def main():
    test_query = "What BIS standard applies to my stainless steel water bottle?"

    print("=" * 60)
    print("QUERY")
    print("-" * 60)
    print(test_query)

    print("\n" + "=" * 60)
    print("GROQ ANALYSIS")
    print("-" * 60)
    analysis = await groq_service.analyze_query(test_query, language="en")
    print(json.dumps(analysis.model_dump(), indent=2))

    print("\n" + "=" * 60)
    print("RETRIEVED BIS EVIDENCE")
    print("-" * 60)

    evidence_list = await rag_service.retrieve_evidence(test_query, analysis)

    if not evidence_list:
        print("No BIS documents are currently indexed.")
        print("(Ingest official BIS PDFs using: python scripts/ingest_bis_document.py <path-to-pdf>)")
    else:
        for idx, item in enumerate(evidence_list, start=1):
            print(f"\n{idx}.")
            print(f"Standard  : {item.standard_number or 'N/A'}")
            print(f"Title     : {item.title or 'N/A'}")
            print(f"Clause    : {item.clause or 'N/A'}")
            print(f"Page      : {item.page_number or 'N/A'}")
            print(f"Similarity: {item.similarity}")
            print(f"Content   :\n{item.content[:300]}...")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
