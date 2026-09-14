#!/usr/bin/env python
"""Development CLI script to ingest a BIS PDF document into Supabase pgvector.

Usage:
    python scripts/ingest_bis_document.py path/to/document.pdf [--standard "IS 17803:2022"] [--title "..."]
"""
import sys
import argparse
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.ingestion.pdf_loader import load_pdf_pages
from app.ingestion.metadata import extract_document_metadata
from app.ingestion.chunker import create_clause_aware_chunks
from app.ingestion.embeddings import generate_chunk_embeddings
from app.core.database import insert_document, insert_document_chunks, get_supabase_client


def main():
    parser = argparse.ArgumentParser(description="Ingest a BIS PDF standard into Supabase pgvector")
    parser.add_argument("pdf_path", type=str, help="Path to the BIS PDF document")
    parser.add_argument("--standard", type=str, default=None, help="Standard number override, e.g. 'IS 17803:2022'")
    parser.add_argument("--title", type=str, default=None, help="Standard title override")
    parser.add_argument("--url", type=str, default=None, help="Official BIS URL for standard")

    args = parser.parse_args()
    pdf_path = Path(args.pdf_path)

    if not pdf_path.exists():
        print(f"Error: File '{args.pdf_path}' not found.")
        sys.exit(1)

    print(f"Loading document: {pdf_path.name}...")

    # 1. Verify Supabase connection
    client = get_supabase_client()
    if not client:
        print("Error: Supabase client could not be initialized.")
        print("Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.")
        sys.exit(1)

    try:
        # 2. Extract pages
        pages = load_pdf_pages(str(pdf_path))
        print(f"Pages extracted: {len(pages)}")

        # 3. Extract metadata
        first_pages_text = "\n".join([p["text"] for p in pages[:3]])
        doc_metadata = extract_document_metadata(first_pages_text, pdf_path.name)
        if args.standard:
            doc_metadata["standard_number"] = args.standard
        if args.title:
            doc_metadata["title"] = args.title
        if args.url:
            doc_metadata["source_url"] = args.url

        # CRITICAL: Never fallback standard_number to filename
        print(f"Standard Identified: {doc_metadata['standard_number'] or 'None (Compendium/General)'} - {doc_metadata['title']}")

        # 4. Chunk text (clause-aware)
        chunks = create_clause_aware_chunks(pages, doc_metadata)
        print(f"Chunks created: {len(chunks)}")

        # 5. Generate embeddings
        print("Generating embeddings...")
        chunks_with_vectors = generate_chunk_embeddings(chunks)

        # 6. Insert master document
        print("Uploading to Supabase...")
        master_doc = {
            "title": doc_metadata["title"],
            "standard_number": doc_metadata["standard_number"] or "COMPENDIUM",
            "document_type": doc_metadata.get("document_type", "Indian Standard"),
            "version": doc_metadata.get("version"),
            "source_url": doc_metadata.get("source_url"),
            "storage_path": str(pdf_path.resolve()),
            "metadata": {
                "page_count": len(pages),
                "chunk_count": len(chunks),
                "filename": pdf_path.name,
            },
        }
        doc_id = insert_document(master_doc)

        # 7. Insert chunks
        for c in chunks_with_vectors:
            c["document_id"] = doc_id
        inserted_count = insert_document_chunks(chunks_with_vectors)

        print(f"Uploaded {inserted_count} chunks linked to Document ID: {doc_id}")
        print("Ingestion completed successfully.")

    except Exception as e:
        print(f"Ingestion failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
