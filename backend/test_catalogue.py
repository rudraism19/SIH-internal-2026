"""Comprehensive test suite for BIS Document Catalogue.

Tests:
1. Create document (IS 1460:2017).
2. Retrieve document by ID.
3. List documents.
4. Update ingestion status (pending -> downloaded).
5. Find document by standard number.
6. Prevent duplicate creation (via checksum and standard number).
7. Handle missing standard number (standard_number = None).
8. Delete test document.

Usage:
    python test_catalogue.py
"""
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.document import DocumentCreate
from app.services.catalogue_service import catalogue_service


def run_tests():
    print("=" * 70)
    print("BIS DOCUMENT CATALOGUE TEST SUITE")
    print("=" * 70)

    created_ids = []

    try:
        # -------------------------------------------------------------
        # 1. Create Document (IS 1460:2017)
        # -------------------------------------------------------------
        print("\n[TEST 1] Create Document (IS 1460:2017)...")
        doc1_payload = DocumentCreate(
            standard_number="IS 1460:2017",
            title="Automotive Diesel Fuel — Specification",
            product="Automotive Diesel",
            document_type="Indian Standard",
            version="2017",
            status="Published",
            source_url="https://official-bis-source/is-1460-2017",
            file_path="knowledge_base/raw/IS-1460-2017.pdf",
            file_checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852test1",
            ingestion_status="pending",
            metadata={"test_run": True, "edition": 5},
        )
        doc1 = catalogue_service.create_document(doc1_payload)
        created_ids.append(doc1.id)

        assert doc1.id is not None, "Document ID must not be None"
        assert doc1.standard_number == "IS 1460:2017", f"Expected 'IS 1460:2017', got '{doc1.standard_number}'"
        assert doc1.ingestion_status == "pending", f"Expected 'pending', got '{doc1.ingestion_status}'"
        print(f"  PASSED -> Created document ID: {doc1.id}")
        print(f"            Standard: {doc1.standard_number} | Title: {doc1.title}")

        # -------------------------------------------------------------
        # 2. Retrieve Document by ID
        # -------------------------------------------------------------
        print("\n[TEST 2] Retrieve Document by ID...")
        retrieved_doc1 = catalogue_service.get_document(doc1.id)
        assert retrieved_doc1 is not None, "Failed to retrieve document by ID"
        assert retrieved_doc1.id == doc1.id, "Retrieved ID does not match"
        assert retrieved_doc1.standard_number == "IS 1460:2017", "Standard number does not match"
        print(f"  PASSED -> Retrieved document: {retrieved_doc1.standard_number} (ID: {retrieved_doc1.id})")

        # -------------------------------------------------------------
        # 3. List Documents
        # -------------------------------------------------------------
        print("\n[TEST 3] List Documents...")
        docs, total = catalogue_service.list_documents(limit=10, offset=0)
        assert len(docs) >= 1, "Expected at least 1 document in list"
        assert total >= 1, "Expected total count >= 1"
        found_in_list = any(d.id == doc1.id for d in docs)
        assert found_in_list, "Created document not found in list response"
        print(f"  PASSED -> Listed {len(docs)} documents (Total count: {total})")

        # -------------------------------------------------------------
        # 4. Update Ingestion Status
        # -------------------------------------------------------------
        print("\n[TEST 4] Update Ingestion Status (pending -> downloaded)...")
        updated_doc = catalogue_service.update_document_status(doc1.id, "downloaded")
        assert updated_doc is not None, "Failed to update document status"
        assert updated_doc.ingestion_status == "downloaded", f"Expected 'downloaded', got '{updated_doc.ingestion_status}'"
        print(f"  PASSED -> Status updated successfully to '{updated_doc.ingestion_status}'")

        # -------------------------------------------------------------
        # 5. Find by Standard Number
        # -------------------------------------------------------------
        print("\n[TEST 5] Find by Standard Number ('IS 1460')...")
        found_docs = catalogue_service.find_document_by_standard_number("IS 1460")
        assert len(found_docs) >= 1, "Expected to find document by standard number substring"
        assert any(d.id == doc1.id for d in found_docs), "Created document not in search results"
        print(f"  PASSED -> Found {len(found_docs)} matching document(s) for 'IS 1460'")

        # -------------------------------------------------------------
        # 6. Prevent Duplicate Creation
        # -------------------------------------------------------------
        print("\n[TEST 6] Prevent Duplicate Creation...")
        # Attempt to insert same document with identical checksum
        duplicate_attempt = catalogue_service.create_document(doc1_payload)
        assert duplicate_attempt.id == doc1.id, (
            f"Duplicate was created! Original ID: {doc1.id}, Duplicate ID: {duplicate_attempt.id}"
        )
        print(f"  PASSED -> Duplicate correctly prevented. Returned existing ID: {duplicate_attempt.id}")

        # -------------------------------------------------------------
        # 7. Handle Missing Standard Number (Compendium/Unidentified)
        # -------------------------------------------------------------
        print("\n[TEST 7] Handle Missing Standard Number (standard_number = None)...")
        compendium_payload = DocumentCreate(
            standard_number=None,
            title="Indian Standards For Petroleum Products",
            product="Petroleum Products",
            document_type="Indian Standard",
            version=None,
            status="Published",
            source_url="https://official-bis-source/petroleum-compendium",
            file_path="knowledge_base/raw/INDIANSTANDARDSFORPETROLEUMPRODUCTS.pdf",
            file_checksum="f6a1b2c3d4e5f6test2_petroleum_compendium_checksum",
            ingestion_status="pending",
            metadata={"notes": "Compendium of standards without single master IS code"},
        )
        compendium_doc = catalogue_service.create_document(compendium_payload)
        created_ids.append(compendium_doc.id)

        assert compendium_doc.id is not None, "Compendium document ID must not be None"
        assert compendium_doc.standard_number is None, (
            f"Expected standard_number to be None, got '{compendium_doc.standard_number}'"
        )
        assert compendium_doc.title == "Indian Standards For Petroleum Products", "Title mismatch"
        print(f"  PASSED -> Compendium created with standard_number=None (ID: {compendium_doc.id})")

        # -------------------------------------------------------------
        # 8. Delete Document / Clean Up
        # -------------------------------------------------------------
        print("\n[TEST 8] Delete Test Documents / Clean Up...")
        for doc_id in created_ids:
            deleted = catalogue_service.delete_document(doc_id)
            assert deleted is True, f"Failed to delete document {doc_id}"
            # Verify it's gone
            check = catalogue_service.get_document(doc_id)
            assert check is None, f"Document {doc_id} still exists after deletion"
            print(f"  PASSED -> Deleted test document {doc_id}")

        print("\n" + "=" * 70)
        print("ALL 8 CATALOGUE TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n[FAIL] Test encountered an error: {e}")
        import traceback
        traceback.print_exc()
        # Clean up any leftover test docs
        for doc_id in created_ids:
            try:
                catalogue_service.delete_document(doc_id)
            except Exception:
                pass
        return False


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
