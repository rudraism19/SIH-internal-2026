import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client = None


def get_supabase_client():
    """Initializes and returns the singleton Supabase client using service role key.
    
    SECURITY: The service-role key is used solely server-side in FastAPI to bypass RLS
    for document ingestion and vector similarity search. It is NEVER sent to the client.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    supabase_url = settings.SUPABASE_URL
    service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY

    if not supabase_url or not service_role_key:
        logger.warning(
            "Supabase credentials not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env."
        )
        return None

    try:
        from supabase import create_client, ClientOptions
        _supabase_client = create_client(
            supabase_url,
            service_role_key,
            options=ClientOptions(postgrest_client_timeout=30),
        )
        logger.info(f"Supabase client initialized successfully for {supabase_url}")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}", exc_info=True)
        return None


def insert_document(doc_data: Dict[str, Any]) -> str:
    """Inserts a master BIS document record into the 'documents' table.
    
    Returns the generated UUID document ID.
    """
    client = get_supabase_client()
    if not client:
        raise RuntimeError("Supabase client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")

    try:
        response = client.table("documents").insert(doc_data).execute()
        if response.data and len(response.data) > 0:
            doc_id = response.data[0]["id"]
            logger.info(f"Inserted master document: {doc_data.get('standard_number')} (ID: {doc_id})")
            return doc_id
        raise RuntimeError(f"Failed to insert document: No data returned from Supabase. {response}")
    except Exception as e:
        logger.error(f"Error inserting document: {e}", exc_info=True)
        raise


def ensure_master_document(doc_id: str, master_data: Dict[str, Any]) -> str:
    """Ensures a corresponding master row exists in 'documents' table with the given ID.
    
    Provides dual-compatibility for existing foreign key constraints on 'document_chunks'
    referencing 'documents(id)' while operating with the new 'bis_documents' catalogue.
    """
    client = get_supabase_client()
    if not client:
        return doc_id

    try:
        check = client.table("documents").select("id").eq("id", doc_id).limit(1).execute()
        if check.data and len(check.data) > 0:
            return doc_id

        record = {
            "id": doc_id,
            "title": master_data.get("title") or "Indian Standard",
            "standard_number": master_data.get("standard_number") or "COMPENDIUM",
            "document_type": master_data.get("document_type", "Indian Standard"),
            "version": master_data.get("version"),
            "source_url": master_data.get("source_url"),
            "storage_path": master_data.get("file_path") or master_data.get("storage_path"),
            "metadata": master_data.get("metadata", {}),
        }
        client.table("documents").upsert(record).execute()
        logger.info(f"Ensured master document in 'documents' table: ID {doc_id}")
    except Exception as e:
        logger.debug(f"Note on syncing to 'documents' table: {e}")

    return doc_id


def insert_document_chunks(chunks_data: List[Dict[str, Any]], batch_size: int = 50) -> int:
    """Inserts clause-aware text chunks and their embeddings into 'document_chunks'.
    
    Supports chunk-level standard_number, standard_title, document_title, version, source_url.
    Gracefully falls back if columns are only in metadata JSONB.
    """
    client = get_supabase_client()
    if not client:
        raise RuntimeError("Supabase client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")

    if not chunks_data:
        return 0

    total_inserted = 0
    for i in range(0, len(chunks_data), batch_size):
        batch = chunks_data[i : i + batch_size]
        try:
            response = client.table("document_chunks").insert(batch).execute()
            count = len(response.data) if response.data else len(batch)
            total_inserted += count
            logger.info(f"Inserted chunk batch {i // batch_size + 1}: {count} chunks")
        except Exception as e:
            err_msg = str(e)
            # If new columns are not yet added to SQL schema, strip them from top-level and keep in metadata
            if "column" in err_msg.lower() or "schema cache" in err_msg.lower():
                logger.warning(f"Columns missing in document_chunks table, falling back to basic columns with metadata: {e}")
                stripped_batch = []
                allowed_cols = {"id", "document_id", "content", "embedding", "page_number", "section", "clause", "sub_clause", "metadata", "created_at"}
                for item in batch:
                    stripped_item = {k: v for k, v in item.items() if k in allowed_cols}
                    stripped_batch.append(stripped_item)
                response = client.table("document_chunks").insert(stripped_batch).execute()
                count = len(response.data) if response.data else len(stripped_batch)
                total_inserted += count
            else:
                logger.error(f"Error inserting chunk batch starting at index {i}: {e}", exc_info=True)
                raise

    return total_inserted


def search_similar_chunks(
    query_embedding: List[float],
    top_k: int = 5,
    filter_standard: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Performs semantic vector search across BIS document chunks via Supabase RPC.
    
    Calls the PostgreSQL function `match_document_chunks`.
    Returns list of matching chunks with similarity scores.
    """
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase client not available. Cannot perform vector search.")
        return []

    try:
        rpc_params = {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "filter_standard": filter_standard,
        }
        response = client.rpc("match_document_chunks", rpc_params).execute()
        results = response.data or []
        logger.info(f"Vector search returned {len(results)} chunks (top_k={top_k})")
        return results
    except Exception as e:
        logger.error(f"Error executing vector search RPC 'match_document_chunks': {e}", exc_info=True)
        return []
