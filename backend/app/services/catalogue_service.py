import os
import re
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from app.core.database import get_supabase_client
from app.schemas.document import (
    DocumentCreate,
    DocumentRecord,
    VALID_INGESTION_STATUSES,
)

logger = logging.getLogger(__name__)


class CatalogueService:
    """Service layer managing the BIS Document Catalogue.
    
    Responsible for tracking 'What BIS documents do we have?' in the `bis_documents` table,
    enforcing duplicate prevention (via checksum, standard_number, or file_path), and
    tracking document ingestion lifecycle states.
    """

    TABLE_NAME = "bis_documents"

    def __init__(self):
        self._memory_store: Dict[str, Dict[str, Any]] = {}
        self._std_cache: Dict[str, List[DocumentRecord]] = {}
        self._manifest_path = self._resolve_manifest_path()
        self._load_local_manifest()

    def _resolve_manifest_path(self) -> Path:
        """Locates knowledge_base/catalogue_manifest.json for resilient local caching."""
        backend_dir = Path(__file__).resolve().parent.parent.parent
        possible_dirs = [
            backend_dir.parent / "knowledge_base",
            backend_dir / "knowledge_base",
            Path.cwd() / "knowledge_base",
        ]
        for d in possible_dirs:
            if d.exists():
                return d / "catalogue_manifest.json"
        target_dir = backend_dir.parent / "knowledge_base"
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir / "catalogue_manifest.json"

    def _load_local_manifest(self):
        """Loads local manifest cache if available."""
        if self._manifest_path.exists():
            try:
                with open(self._manifest_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self._memory_store = data
            except Exception as e:
                logger.debug(f"Could not load local manifest cache: {e}")

    def _save_local_manifest(self):
        """Persists local manifest cache to disk."""
        try:
            self._manifest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._manifest_path, "w", encoding="utf-8") as f:
                json.dump(self._memory_store, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.debug(f"Could not save local manifest cache: {e}")

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _is_table_not_found(self, err: Exception) -> bool:
        err_str = str(err)
        return "PGRST205" in err_str or "schema cache" in err_str or "does not exist" in err_str

    def create_document(self, doc_data: DocumentCreate) -> DocumentRecord:
        """Creates a new document catalogue entry with duplicate protection.
        
        Duplicate Strategy:
        1. If file_checksum is provided, check if a document with that SHA-256 already exists.
        2. If standard_number is provided, check if (standard_number, document_type, version) matches.
        3. If file_path is provided, check if file_path matches an existing record.
        
        If an existing record matches, returns it without creating a duplicate.
        """
        client = get_supabase_client()

        # 1. Check for duplicates via Checksum
        if doc_data.file_checksum:
            existing = self._find_by_checksum(doc_data.file_checksum)
            if existing:
                logger.info(f"Duplicate document detected by checksum: {doc_data.file_checksum} (ID: {existing.id})")
                return existing

        # 2. Check for duplicates via Standard Number + Type + Version
        if doc_data.standard_number:
            existing = self._find_by_standard_and_version(
                doc_data.standard_number, doc_data.document_type, doc_data.version
            )
            if existing:
                logger.info(
                    f"Duplicate document detected by standard_number: {doc_data.standard_number} (ID: {existing.id})"
                )
                return existing

        # 3. Check for duplicates via File Path (for documents without standard numbers)
        if doc_data.file_path:
            existing = self._find_by_file_path(doc_data.file_path)
            if existing:
                logger.info(f"Duplicate document detected by file_path: {doc_data.file_path} (ID: {existing.id})")
                return existing

        # 4. Prepare record payload
        doc_id = str(uuid.uuid4())
        now = self._now_iso()
        record_dict = {
            "id": doc_id,
            "standard_number": doc_data.standard_number,
            "title": doc_data.title,
            "product": doc_data.product,
            "document_type": doc_data.document_type,
            "version": doc_data.version,
            "status": doc_data.status,
            "source_url": doc_data.source_url,
            "file_path": doc_data.file_path,
            "file_checksum": doc_data.file_checksum,
            "ingestion_status": doc_data.ingestion_status,
            "metadata": doc_data.metadata or {},
            "created_at": now,
            "updated_at": now,
        }

        # 5. Insert into Supabase
        if client:
            try:
                response = client.table(self.TABLE_NAME).insert(record_dict).execute()
                if response.data and len(response.data) > 0:
                    inserted = response.data[0]
                    logger.info(
                        f"Catalogued BIS document in Supabase: {inserted.get('standard_number') or inserted.get('title')} (ID: {inserted.get('id')})"
                    )
                    # Cache locally as well
                    self._memory_store[inserted["id"]] = inserted
                    self._save_local_manifest()
                    return DocumentRecord(**inserted)
            except Exception as e:
                if self._is_table_not_found(e):
                    logger.warning(
                        f"Supabase table '{self.TABLE_NAME}' not found. Run backend/supabase_catalogue_schema.sql in Supabase SQL editor. Using persistent local manifest."
                    )
                else:
                    logger.error(f"Error inserting document into Supabase: {e}", exc_info=True)
                    raise

        # Fallback to local store
        self._memory_store[doc_id] = record_dict
        self._save_local_manifest()
        logger.info(
            f"Catalogued BIS document in local manifest: {record_dict.get('standard_number') or record_dict.get('title')} (ID: {doc_id})"
        )
        return DocumentRecord(**record_dict)

    def get_document(self, doc_id: str) -> Optional[DocumentRecord]:
        """Retrieves a single document record by UUID."""
        client = get_supabase_client()
        if client:
            try:
                response = client.table(self.TABLE_NAME).select("*").eq("id", doc_id).execute()
                if response.data and len(response.data) > 0:
                    return DocumentRecord(**response.data[0])
                return None
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error fetching document {doc_id} from Supabase: {e}")
                    raise

        # Local store lookup
        if doc_id in self._memory_store:
            return DocumentRecord(**self._memory_store[doc_id])
        return None

    def list_documents(
        self,
        limit: int = 50,
        offset: int = 0,
        document_type: Optional[str] = None,
        ingestion_status: Optional[str] = None,
    ) -> Tuple[List[DocumentRecord], int]:
        """Lists document records with pagination and optional filtering."""
        client = get_supabase_client()
        if client:
            try:
                query = client.table(self.TABLE_NAME).select("*", count="exact")
                if document_type:
                    query = query.eq("document_type", document_type)
                if ingestion_status:
                    query = query.eq("ingestion_status", ingestion_status)

                query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
                response = query.execute()

                items = [DocumentRecord(**item) for item in (response.data or [])]
                total = response.count if response.count is not None else len(items)
                return items, total
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error listing documents from Supabase: {e}")
                    raise

        # Local store lookup
        all_items = list(self._memory_store.values())
        filtered = []
        for item in all_items:
            if document_type and item.get("document_type") != document_type:
                continue
            if ingestion_status and item.get("ingestion_status") != ingestion_status:
                continue
            filtered.append(item)

        total = len(filtered)
        paginated = filtered[offset : offset + limit]
        return [DocumentRecord(**item) for item in paginated], total

    def update_document_status(self, doc_id: str, new_status: str) -> Optional[DocumentRecord]:
        """Updates the ingestion_status of a document record."""
        if new_status not in VALID_INGESTION_STATUSES:
            raise ValueError(
                f"Invalid status '{new_status}'. Allowed: {', '.join(sorted(VALID_INGESTION_STATUSES))}"
            )

        client = get_supabase_client()
        now = self._now_iso()

        if client:
            try:
                response = (
                    client.table(self.TABLE_NAME)
                    .update({"ingestion_status": new_status, "updated_at": now})
                    .eq("id", doc_id)
                    .execute()
                )
                if response.data and len(response.data) > 0:
                    logger.info(f"Updated document {doc_id} status to '{new_status}' in Supabase")
                    updated_rec = response.data[0]
                    self._memory_store[doc_id] = updated_rec
                    self._save_local_manifest()
                    return DocumentRecord(**updated_rec)
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error updating document status in Supabase: {e}")
                    raise

        # Local store update
        if doc_id in self._memory_store:
            self._memory_store[doc_id]["ingestion_status"] = new_status
            self._memory_store[doc_id]["updated_at"] = now
            self._save_local_manifest()
            logger.info(f"Updated document {doc_id} status to '{new_status}' in local store")
            return DocumentRecord(**self._memory_store[doc_id])

        return None

    def update_document_metadata(self, doc_id: str, metadata_patch: Dict[str, Any]) -> Optional[DocumentRecord]:
        """Merges additional key-value metadata into a document's metadata JSON field."""
        doc = self.get_document(doc_id)
        if not doc:
            return None

        client = get_supabase_client()
        now = self._now_iso()
        updated_meta = {**(doc.metadata or {}), **metadata_patch}

        if client:
            try:
                response = (
                    client.table(self.TABLE_NAME)
                    .update({"metadata": updated_meta, "updated_at": now})
                    .eq("id", doc_id)
                    .execute()
                )
                if response.data and len(response.data) > 0:
                    updated_rec = response.data[0]
                    self._memory_store[doc_id] = updated_rec
                    self._save_local_manifest()
                    return DocumentRecord(**updated_rec)
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error updating metadata in Supabase for document {doc_id}: {e}")
                    raise

        if doc_id in self._memory_store:
            self._memory_store[doc_id]["metadata"] = updated_meta
            self._memory_store[doc_id]["updated_at"] = now
            self._save_local_manifest()
            return DocumentRecord(**self._memory_store[doc_id])

        return None

    def list_pending_documents(self) -> List[DocumentRecord]:
        """Returns all catalogue documents currently in 'pending' ingestion status."""
        docs, _ = self.list_documents(limit=500, ingestion_status="pending")
        return docs


    def find_document_by_standard_number(self, standard_number: str) -> List[DocumentRecord]:
        """Finds documents matching a given standard number pattern (case-insensitive)."""
        clean_num = standard_number.strip()
        cache_key = clean_num.upper()
        if hasattr(self, "_std_cache") and cache_key in self._std_cache:
            return self._std_cache[cache_key]

        client = get_supabase_client()
        results: List[DocumentRecord] = []
        found_ids = set()

        if client:
            try:
                response = (
                    client.table(self.TABLE_NAME)
                    .select("*")
                    .ilike("standard_number", f"%{clean_num}%")
                    .execute()
                )
                for item in (response.data or []):
                    rec = DocumentRecord(**item)
                    results.append(rec)
                    found_ids.add(str(rec.id))
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error finding document by standard in Supabase: {e}")

        # Local store search / merge
        for item in self._memory_store.values():
            if str(item.get("id")) not in found_ids:
                std = item.get("standard_number")
                if std and clean_num.lower() in std.lower():
                    results.append(DocumentRecord(**item))

        if hasattr(self, "_std_cache"):
            self._std_cache[cache_key] = results

        return results

    def search_documents_by_product(self, product_query: str) -> List[DocumentRecord]:
        """Finds catalogue documents matching a product name, synonym, or keyword (case-insensitive)."""
        clean_q = product_query.strip().lower()
        if not clean_q:
            return []

        q_words = [w for w in re.findall(r"\w+", clean_q) if len(w) > 2]

        candidate_records: Dict[str, Dict[str, Any]] = {}

        # 1. Gather candidates from Supabase if available
        client = get_supabase_client()
        if client:
            try:
                response = client.table(self.TABLE_NAME).select("*").limit(200).execute()
                for item in (response.data or []):
                    doc_id = item.get("id") or item.get("standard_number")
                    if doc_id:
                        candidate_records[str(doc_id)] = item
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.debug(f"Supabase product candidate fetch note: {e}")

        # 2. Merge with local memory store (guarantees seeded standards are available)
        for doc_id, item in self._memory_store.items():
            if str(doc_id) not in candidate_records:
                candidate_records[str(doc_id)] = item

        # 3. Score candidates with weighted multi-factor relevance
        matched_scores = []
        for item in candidate_records.values():
            prod = (item.get("product") or "").lower()
            title = (item.get("title") or "").lower()
            std_num = (item.get("standard_number") or "").lower()
            meta = item.get("metadata") or {}
            keywords = [str(k).lower() for k in (meta.get("keywords") or [])]

            score = 0

            # Exact keyword match gets top priority
            if clean_q in keywords:
                score += 25
            elif any(clean_q in kw or kw in clean_q for kw in keywords):
                score += 10

            # Direct product name matches
            if clean_q == prod:
                score += 25
            elif clean_q in prod or prod in clean_q:
                score += 12

            # Token overlap scoring with stemming awareness
            prod_words = [p for p in re.findall(r"\w+", prod) if len(p) > 2]
            for w in q_words:
                w_stem = w.rstrip("s")
                if w.endswith("ies"):
                    w_stem = w[:-3] + "y"
                elif w.endswith("y"):
                    w_stem = w[:-1]

                if any(w in kw or w_stem in kw for kw in keywords):
                    score += 5
                if any(w in p or w_stem in p or p.startswith(w_stem) for p in prod_words):
                    score += 5
                if w in title or w_stem in title:
                    score += 2

            # Title substring match
            if clean_q in title:
                score += 6

            if score > 0:
                try:
                    matched_scores.append((score, DocumentRecord(**item)))
                except Exception:
                    pass

        matched_scores.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in matched_scores[:10]]


    def delete_document(self, doc_id: str) -> bool:
        """Deletes a document record from the catalogue."""
        client = get_supabase_client()
        if client:
            try:
                response = client.table(self.TABLE_NAME).delete().eq("id", doc_id).execute()
                if response.data and len(response.data) > 0:
                    logger.info(f"Deleted document {doc_id} from Supabase")
                    if doc_id in self._memory_store:
                        del self._memory_store[doc_id]
                        self._save_local_manifest()
                    return True
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error deleting document from Supabase: {e}")
                    raise

        if doc_id in self._memory_store:
            del self._memory_store[doc_id]
            self._save_local_manifest()
            logger.info(f"Deleted document {doc_id} from local store")
            return True

        return False

    # -------------------------------------------------------------
    # Internal duplicate lookup helpers
    # -------------------------------------------------------------

    def _find_by_checksum(self, checksum: str) -> Optional[DocumentRecord]:
        client = get_supabase_client()
        if client:
            try:
                response = client.table(self.TABLE_NAME).select("*").eq("file_checksum", checksum).limit(1).execute()
                if response.data and len(response.data) > 0:
                    return DocumentRecord(**response.data[0])
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error searching checksum in Supabase: {e}")

        for item in self._memory_store.values():
            if item.get("file_checksum") == checksum:
                return DocumentRecord(**item)
        return None

    def _find_by_standard_and_version(
        self, standard_number: str, document_type: str, version: Optional[str]
    ) -> Optional[DocumentRecord]:
        client = get_supabase_client()
        if client:
            try:
                query = (
                    client.table(self.TABLE_NAME)
                    .select("*")
                    .eq("standard_number", standard_number)
                    .eq("document_type", document_type)
                )
                if version:
                    query = query.eq("version", version)
                response = query.limit(1).execute()
                if response.data and len(response.data) > 0:
                    return DocumentRecord(**response.data[0])
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error searching standard in Supabase: {e}")

        for item in self._memory_store.values():
            if (
                item.get("standard_number") == standard_number
                and item.get("document_type") == document_type
                and (version is None or item.get("version") == version)
            ):
                return DocumentRecord(**item)
        return None

    def _find_by_file_path(self, file_path: str) -> Optional[DocumentRecord]:
        client = get_supabase_client()
        if client:
            try:
                response = client.table(self.TABLE_NAME).select("*").eq("file_path", file_path).limit(1).execute()
                if response.data and len(response.data) > 0:
                    return DocumentRecord(**response.data[0])
            except Exception as e:
                if not self._is_table_not_found(e):
                    logger.error(f"Error searching file_path in Supabase: {e}")

        for item in self._memory_store.values():
            if item.get("file_path") == file_path:
                return DocumentRecord(**item)
        return None


# Global singleton instance
catalogue_service = CatalogueService()
