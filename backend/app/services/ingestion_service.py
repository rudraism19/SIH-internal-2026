import os
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.services.catalogue_service import catalogue_service
from app.ingestion.pdf_loader import load_pdf_pages
from app.ingestion.chunker import create_clause_aware_chunks
from app.ingestion.embeddings import generate_chunk_embeddings
from app.core.database import insert_document_chunks, ensure_master_document

logger = logging.getLogger(__name__)


class IngestionService:
    """Orchestrates the conversion of catalogued BIS PDF documents into vector chunks in Supabase.
    
    Automates document lifecycle transitions:
    'pending' -> 'processing' -> 'chunked' -> 'embedded' -> 'indexed' (or 'failed').
    """

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def resolve_pdf_path(self, relative_or_abs_path: str) -> Path:
        """Resolves a file_path against workspace and backend directory structures."""
        p = Path(relative_or_abs_path)
        if p.is_absolute() and p.exists():
            return p

        # Check candidate locations relative to backend directory
        backend_dir = Path(__file__).resolve().parent.parent.parent
        candidates = [
            backend_dir.parent / p,
            backend_dir / p,
            Path.cwd() / p,
            backend_dir.parent / "knowledge_base" / "raw" / p.name,
            backend_dir / "knowledge_base" / "raw" / p.name,
        ]

        for cand in candidates:
            if cand.exists():
                return cand.resolve()

        # If not found, return best guess path for clean error reporting
        return (backend_dir.parent / p).resolve()

    def ingest_document(self, document_id: str) -> Dict[str, Any]:
        """Runs the complete ingestion pipeline for a single catalogued document.
        
        Transitions:
          1. Validates document exists in catalogue
          2. Validates PDF file exists on disk
          3. Sets status: 'processing'
          4. Extracts pages from PDF
          5. Sets status: 'chunked'
          6. Generates vector embeddings -> status: 'embedded'
          7. Stores clause chunks in Supabase document_chunks -> status: 'indexed'
        """
        doc = catalogue_service.get_document(document_id)
        if not doc:
            raise ValueError(f"Document with ID '{document_id}' not found in catalogue.")

        logger.info(f"=== Starting Ingestion Pipeline for Document: {doc.standard_number or doc.title} (ID: {document_id}) ===")

        # 1. Validate File Path
        if not doc.file_path:
            catalogue_service.update_document_status(document_id, "failed")
            catalogue_service.update_document_metadata(
                document_id,
                {"error": "No file_path specified in document catalogue record.", "failed_at": self._now_iso()},
            )
            raise ValueError(f"Document {document_id} has no file_path specified.")

        resolved_path = self.resolve_pdf_path(doc.file_path)
        if not resolved_path.exists():
            catalogue_service.update_document_status(document_id, "failed")
            catalogue_service.update_document_metadata(
                document_id,
                {"error": f"PDF file not found on disk at: {resolved_path}", "failed_at": self._now_iso()},
            )
            raise FileNotFoundError(f"PDF file not found on disk at: {resolved_path}")

        try:
            # 2. Status -> processing
            catalogue_service.update_document_status(document_id, "processing")

            # 3. Load PDF Pages
            logger.info(f"Loading PDF pages from: {resolved_path.name}")
            pages = load_pdf_pages(str(resolved_path))
            if not pages:
                raise ValueError(f"No readable text could be extracted from PDF: {resolved_path.name}")

            # 4. Clause-Aware Chunking -> status: chunked
            doc_metadata = {
                "title": doc.title,
                "document_title": doc.title,
                "standard_number": doc.standard_number,
                "document_type": doc.document_type,
                "version": doc.version,
                "source_url": doc.source_url,
                "product": doc.product,
            }
            chunks = create_clause_aware_chunks(pages, doc_metadata)
            if not chunks:
                raise ValueError(f"No valid clause chunks could be extracted from PDF: {resolved_path.name}")

            catalogue_service.update_document_status(document_id, "chunked")
            catalogue_service.update_document_metadata(
                document_id,
                {
                    "pages_count": len(pages),
                    "chunks_count": len(chunks),
                },
            )

            # 5. Generate Vector Embeddings -> status: embedded
            catalogue_service.update_document_status(document_id, "embedded")
            chunks_with_vectors = generate_chunk_embeddings(chunks)

            # 6. Ensure Master Document Record in Supabase
            master_record = {
                "title": doc.title or "Indian Standard",
                "standard_number": doc.standard_number or "COMPENDIUM",
                "document_type": doc.document_type,
                "version": doc.version,
                "source_url": doc.source_url,
                "file_path": str(resolved_path),
                "metadata": {
                    "catalogue_id": document_id,
                    "pages_count": len(pages),
                    "chunks_count": len(chunks),
                },
            }
            ensure_master_document(document_id, master_record)

            # 7. Insert Chunks into 'document_chunks' table
            for chunk in chunks_with_vectors:
                chunk["document_id"] = document_id

            inserted_chunks = insert_document_chunks(chunks_with_vectors)

            # 8. Status -> indexed
            now = self._now_iso()
            catalogue_service.update_document_status(document_id, "indexed")
            catalogue_service.update_document_metadata(
                document_id,
                {
                    "indexed_at": now,
                    "stored_chunks": inserted_chunks,
                    "pages_count": len(pages),
                },
            )

            logger.info(
                f"=== Ingestion Pipeline Complete for: {doc.standard_number or doc.title} | "
                f"ID: {document_id} | Pages: {len(pages)} | Chunks: {inserted_chunks} ==="
            )

            return {
                "document_id": document_id,
                "standard_number": doc.standard_number,
                "title": doc.title,
                "status": "indexed",
                "pages_count": len(pages),
                "chunks_count": inserted_chunks,
                "indexed_at": now,
            }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Ingestion failed for document {document_id}: {error_msg}", exc_info=True)
            catalogue_service.update_document_status(document_id, "failed")
            catalogue_service.update_document_metadata(
                document_id,
                {"error": error_msg, "failed_at": self._now_iso()},
            )
            raise

    def ingest_all_pending(self) -> Dict[str, Any]:
        """Batch ingests all documents currently in 'pending' status in the catalogue."""
        pending_docs = catalogue_service.list_pending_documents()
        logger.info(f"Starting batch ingestion for {len(pending_docs)} pending document(s)...")

        results = []
        indexed_count = 0
        failed_count = 0

        for doc in pending_docs:
            try:
                res = self.ingest_document(doc.id)
                indexed_count += 1
                results.append({
                    "document_id": doc.id,
                    "standard_number": doc.standard_number,
                    "title": doc.title,
                    "status": "indexed",
                    "pages_count": res.get("pages_count"),
                    "chunks_count": res.get("chunks_count"),
                    "error": None,
                })
            except Exception as e:
                failed_count += 1
                results.append({
                    "document_id": doc.id,
                    "standard_number": doc.standard_number,
                    "title": doc.title,
                    "status": "failed",
                    "pages_count": None,
                    "chunks_count": None,
                    "error": str(e),
                })

        return {
            "total_processed": len(pending_docs),
            "indexed_count": indexed_count,
            "failed_count": failed_count,
            "results": results,
        }


# Global singleton instance
ingestion_service = IngestionService()
