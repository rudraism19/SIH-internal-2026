import logging
from pathlib import Path
from typing import Dict, Any, Optional

from app.ingestion.pdf_loader import load_pdf_pages
from app.ingestion.metadata import extract_document_metadata
from app.ingestion.chunker import create_clause_aware_chunks
from app.ingestion.embeddings import generate_chunk_embeddings
from app.core.database import insert_document, insert_document_chunks

logger = logging.getLogger(__name__)


def ingest_bis_pdf(
    pdf_path: str,
    standard_number_override: Optional[str] = None,
    title_override: Optional[str] = None,
    source_url: Optional[str] = None,
) -> Dict[str, Any]:
    """Ingests a BIS PDF into Supabase pgvector with full clause-aware chunking and embeddings.
    
    Returns a summary dictionary of ingestion results.
    """
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    logger.info(f"=== Starting Ingestion for: {path.name} ===")

    # Step 1: Load and extract text pages
    pages = load_pdf_pages(str(path))
    if not pages:
        raise ValueError(f"No readable text could be extracted from PDF: {path.name}")

    # Step 2: Extract or override document metadata
    first_pages_text = "\n".join([p["text"] for p in pages[:3]])
    doc_metadata = extract_document_metadata(first_pages_text, path.name)

    if standard_number_override:
        doc_metadata["standard_number"] = standard_number_override
    if title_override:
        doc_metadata["title"] = title_override
    if source_url:
        doc_metadata["source_url"] = source_url

    # CRITICAL: Never fallback standard_number to filename.
    # If the document is a compendium or general document, standard_number remains None.
    logger.info(
        f"Metadata resolved: Standard Number='{doc_metadata['standard_number']}', "
        f"Title='{doc_metadata['title']}', Version='{doc_metadata['version']}'"
    )

    # Step 3: Create clause-aware chunks
    chunks = create_clause_aware_chunks(pages, doc_metadata)
    if not chunks:
        raise ValueError(f"Failed to generate chunks from PDF: {path.name}")

    # Step 4: Generate vector embeddings
    chunks_with_vectors = generate_chunk_embeddings(chunks)

    # Step 5: Insert document into Supabase 'documents' table
    master_doc_payload = {
        "title": doc_metadata["title"],
        "standard_number": doc_metadata["standard_number"] or "COMPENDIUM",
        "document_type": doc_metadata.get("document_type", "Indian Standard"),
        "version": doc_metadata.get("version"),
        "source_url": doc_metadata.get("source_url"),
        "storage_path": str(path.resolve()),
        "metadata": {
            "page_count": len(pages),
            "chunk_count": len(chunks),
            "filename": path.name,
        },
    }
    doc_id = insert_document(master_doc_payload)

    # Step 6: Link document_id to each chunk and insert into 'document_chunks' table
    for c in chunks_with_vectors:
        c["document_id"] = doc_id

    inserted_count = insert_document_chunks(chunks_with_vectors)

    logger.info(
        f"=== Ingestion Complete: {doc_metadata['standard_number']} | "
        f"Doc ID: {doc_id} | {len(pages)} pages | {inserted_count} chunks stored ==="
    )

    return {
        "document_id": doc_id,
        "standard_number": doc_metadata["standard_number"],
        "title": doc_metadata["title"],
        "version": doc_metadata["version"],
        "pages_count": len(pages),
        "chunks_count": inserted_count,
        "status": "success",
    }
