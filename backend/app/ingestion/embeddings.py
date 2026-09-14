import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def generate_chunk_embeddings(chunks: List[Dict[str, Any]], batch_size: int = 64) -> List[Dict[str, Any]]:
    """Generates vector embeddings for a list of chunk dictionaries.
    
    Attaches the 'embedding' list of floats directly to each chunk record.
    """
    if not chunks:
        return []

    from app.services.embedding_service import embedding_service

    texts = [c["content"] for c in chunks]
    logger.info(f"Generating embeddings for {len(texts)} chunks...")
    vectors = embedding_service.embed_documents(texts, batch_size=batch_size)

    for chunk, vector in zip(chunks, vectors):
        chunk["embedding"] = vector

    return chunks
