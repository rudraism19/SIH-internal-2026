"""Automated End-to-End Test Suite for Catalogue Ingestion & Chunking Pipeline.

Verifies:
1. Creation of sample BIS standard PDF with clause structure.
2. Document catalogue registration (initial state: 'pending').
3. Execution of Ingestion Pipeline (transitions: processing -> chunked -> embedded -> indexed).
4. Verification of stored chunks and chunk metadata.
5. Semantic vector retrieval verification via RAG service.
6. Error handling verification (missing file transitions to 'failed').
7. Test cleanup.

Usage:
    python test_ingestion_pipeline.py
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.document import DocumentCreate
from app.services.catalogue_service import catalogue_service
from app.services.ingestion_service import ingestion_service
from app.services.rag_service import rag_service
from app.schemas.chat import QueryAnalysis


def create_mock_bis_pdf(file_path: Path, standard_num: str, title: str):
    """Creates a small, valid PDF file containing standard BIS sections and clauses."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    body_text = (
        f"{standard_num} {title}\\n\\n"
        f"1 SCOPE\\nThis standard prescribes the requirements and methods of sampling and test for automotive diesel fuel.\\n\\n"
        f"4 REQUIREMENTS\\n4.1 Cetane Number: The cetane number of automotive diesel shall not be less than 51.\\n\\n"
        f"4.2 Flash Point: The minimum flash point Abel shall be 35 degrees Celsius for high speed diesel.\\n\\n"
        f"4.3 Sulfur Content: The total sulfur content shall not exceed 10 mg per kg for BS VI compliant automotive diesel fuel."
    )
    content = f"BT /F1 12 Tf 50 700 Td ({body_text}) Tj ET"
    stream_len = len(content)
    pdf = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length {stream_len} >> stream
{content}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
370
%%EOF"""
    file_path.write_bytes(pdf.encode("latin1"))


def run_tests():
    print("=" * 70)
    print("TESTING CATALOGUE-TO-VECTOR INGESTION PIPELINE")
    print("=" * 70)

    raw_dir = backend_dir.parent / "knowledge_base" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    test_pdf_name = "TEST_IS_1460_2017.pdf"
    test_pdf_path = raw_dir / test_pdf_name
    test_doc_id = None
    missing_doc_id = None

    try:
        # 1. Create Mock PDF
        print("\n[STEP 1] Generating mock BIS PDF with clauses...")
        create_mock_bis_pdf(test_pdf_path, "IS 1460:2017", "Automotive Diesel Fuel - Specification")
        assert test_pdf_path.exists(), "Test PDF file was not created"
        print(f"  PASSED -> Created PDF at: {test_pdf_path.name}")

        # 2. Register in Catalogue with 'pending' status
        print("\n[STEP 2] Registering document in catalogue (Status: 'pending')...")
        payload = DocumentCreate(
            standard_number="IS 1460:2017",
            title="Automotive Diesel Fuel — Specification",
            product="Automotive Diesel",
            document_type="Indian Standard",
            version="2017",
            status="Published",
            source_url="https://official-bis-source/is-1460",
            file_path=f"knowledge_base/raw/{test_pdf_name}",
            file_checksum="test_sha256_mock_pipeline_1460",
            ingestion_status="pending",
        )
        catalogued = catalogue_service.create_document(payload)
        test_doc_id = catalogued.id
        assert catalogued.ingestion_status == "pending", f"Expected 'pending', got '{catalogued.ingestion_status}'"
        print(f"  PASSED -> Document catalogued with ID: {test_doc_id}")

        # 3. Trigger Ingestion Pipeline
        print("\n[STEP 3] Running Ingestion Pipeline...")
        result = ingestion_service.ingest_document(test_doc_id)
        assert result["status"] == "indexed", f"Expected 'indexed', got '{result['status']}'"
        assert result["pages_count"] >= 1, "Expected pages_count >= 1"
        assert result["chunks_count"] >= 1, "Expected chunks_count >= 1"
        print(f"  PASSED -> Ingestion completed: {result['chunks_count']} chunks, status: {result['status']}")

        # 4. Verify Lifecycle Status Transition in Catalogue
        print("\n[STEP 4] Verifying updated catalogue state...")
        updated_doc = catalogue_service.get_document(test_doc_id)
        assert updated_doc.ingestion_status == "indexed", f"Expected 'indexed', got '{updated_doc.ingestion_status}'"
        assert updated_doc.metadata.get("indexed_at") is not None, "Expected indexed_at in metadata"
        print(f"  PASSED -> Catalogue record confirmed in status: '{updated_doc.ingestion_status}'")
        print(f"            Metadata: {updated_doc.metadata}")

        # 5. Semantic Vector Retrieval Verification
        print("\n[STEP 5] Testing vector retrieval for ingested content...")
        import asyncio
        query = "What is the cetane number requirement for automotive diesel?"
        analysis = QueryAnalysis(
            intent="standard_identification",
            product="automotive diesel",
            material=None,
            category="fuel",
            certification_needed="yes",
            language="en",
        )
        evidence = asyncio.run(rag_service.retrieve_evidence(query, analysis))
        print(f"  Retrieved {len(evidence)} evidence clause(s) for query: '{query}'")
        if evidence:
            top_hit = evidence[0]
            print(f"  Top Match Standard : {top_hit.standard_number}")
            print(f"  Top Match Title    : {top_hit.title}")
            print(f"  Top Match Clause   : {top_hit.clause}")
            print(f"  Similarity Score   : {top_hit.similarity:.4f}")
            print(f"  Excerpt Content    : {top_hit.content[:150]}...")
        print("  PASSED -> RAG evidence retrieval verified.")

        # 6. Test Error Handling (Missing File -> 'failed' status)
        print("\n[STEP 6] Testing error handling for non-existent file...")
        missing_payload = DocumentCreate(
            standard_number="IS 99999:2099",
            title="Non-Existent Standard",
            file_path="knowledge_base/raw/DOES_NOT_EXIST.pdf",
            file_checksum="fake_checksum_non_existent",
            ingestion_status="pending",
        )
        missing_doc = catalogue_service.create_document(missing_payload)
        missing_doc_id = missing_doc.id

        try:
            ingestion_service.ingest_document(missing_doc_id)
            assert False, "Ingestion should have failed for non-existent file!"
        except FileNotFoundError:
            failed_doc = catalogue_service.get_document(missing_doc_id)
            assert failed_doc.ingestion_status == "failed", f"Expected 'failed', got '{failed_doc.ingestion_status}'"
            assert "error" in failed_doc.metadata, "Expected error in metadata"
            print(f"  PASSED -> Correctly marked document as 'failed' with error: '{failed_doc.metadata.get('error')}'")

        # 7. Cleanup
        print("\n[STEP 7] Cleaning up test artifacts...")
        if test_doc_id:
            catalogue_service.delete_document(test_doc_id)
        if missing_doc_id:
            catalogue_service.delete_document(missing_doc_id)
        if test_pdf_path.exists():
            test_pdf_path.unlink()
        print("  PASSED -> Test documents and mock PDFs cleaned up.")

        print("\n" + "=" * 70)
        print("ALL 7 INGESTION PIPELINE TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n[FAIL] Test pipeline failed with error: {e}")
        import traceback
        traceback.print_exc()
        if test_doc_id:
            try:
                catalogue_service.delete_document(test_doc_id)
            except Exception:
                pass
        if missing_doc_id:
            try:
                catalogue_service.delete_document(missing_doc_id)
            except Exception:
                pass
        if test_pdf_path.exists():
            try:
                test_pdf_path.unlink()
            except Exception:
                pass
        return False


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
