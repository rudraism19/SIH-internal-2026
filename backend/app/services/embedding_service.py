import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Standard embedding model dimension registry
KNOWN_DIMENSIONS = {
    "BAAI/bge-small-en-v1.5": 384,
    "sentence-transformers/all-MiniLM-L6-v2": 384,
    "BAAI/bge-base-en-v1.5": 768,
    "BAAI/bge-large-en-v1.5": 1024,
    "text-embedding-3-small": 1536,
}


class EmbeddingService:
    """Dedicated embedding service for BIS Assistant.
    
    CRITICAL ARCHITECTURAL REQUIREMENT:
    The exact same embedding model (and dimension) MUST be used for:
    1. Document Ingestion (converting PDF chunks into vectors in Supabase)
    2. Query Retrieval (converting user queries into search vectors)
    
    Using different models for ingestion and retrieval causes vector space mismatch
    and will return irrelevant or garbage results.
    """

    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL or "BAAI/bge-small-en-v1.5"
        self._dimension = KNOWN_DIMENSIONS.get(self.model_name, 384)
        self._model = None

    @property
    def dimension(self) -> int:
        """Vector dimension for the configured model (default: 384)."""
        return self._dimension

    @property
    def model(self):
        """Lazy initialization of FastEmbed ONNX embedding model."""
        if self._model is None:
            try:
                from fastembed import TextEmbedding
                logger.info(f"Loading embedding model '{self.model_name}' (dimension: {self.dimension})...")
                self._model = TextEmbedding(model_name=self.model_name)
            except Exception as e:
                logger.error(f"Failed to load embedding model '{self.model_name}': {e}", exc_info=True)
                raise
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Generate a single vector embedding for a query or text string."""
        if not text or not text.strip():
            return [0.0] * self.dimension

        try:
            embeddings_generator = self.model.embed([text])
            vector = list(next(embeddings_generator))
            return [float(x) for x in vector]
        except Exception as e:
            logger.error(f"Error generating embedding for text: {e}", exc_info=True)
            raise

    def embed_documents(self, texts: List[str], batch_size: int = 64) -> List[List[float]]:
        """Generate vector embeddings for a list of document text chunks in batches."""
        if not texts:
            return []

        try:
            results = []
            logger.info(f"Generating embeddings for {len(texts)} chunks using '{self.model_name}'...")
            embeddings_generator = self.model.embed(texts, batch_size=batch_size)
            for vector in embeddings_generator:
                results.append([float(x) for x in vector])
            return results
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}", exc_info=True)
            raise


# Global singleton instance
embedding_service = EmbeddingService()
