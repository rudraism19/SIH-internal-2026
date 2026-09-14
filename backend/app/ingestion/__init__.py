"""BIS Document Ingestion Pipeline Package."""
from app.ingestion.pdf_loader import load_pdf_pages
from app.ingestion.metadata import extract_document_metadata, parse_clause_info
from app.ingestion.chunker import create_clause_aware_chunks
from app.ingestion.embeddings import generate_chunk_embeddings
from app.ingestion.ingest import ingest_bis_pdf

__all__ = [
    "load_pdf_pages",
    "extract_document_metadata",
    "parse_clause_info",
    "create_clause_aware_chunks",
    "generate_chunk_embeddings",
    "ingest_bis_pdf",
]
