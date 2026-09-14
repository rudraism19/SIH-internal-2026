import re
import logging
from typing import List, Optional
from app.schemas.chat import QueryAnalysis, RetrievedEvidence
from app.services.embedding_service import embedding_service
from app.core.database import search_similar_chunks
from app.core.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    """RAG orchestration service for BIS document retrieval using LangChain patterns and Supabase pgvector."""

    def __init__(self, top_k: int = 5):
        self.top_k = top_k

    def build_retrieval_query(self, user_query: str, analysis: QueryAnalysis) -> str:
        """Constructs an enhanced semantic search query using Groq-extracted entities.
        
        CRITICAL: Never hallucinates standard numbers (e.g. 'IS 17803').
        Builds query strictly from extracted user entities + relevant domain keywords.
        """
        query_parts = []

        if analysis.material:
            query_parts.append(analysis.material)
        if analysis.product:
            query_parts.append(analysis.product)
        if analysis.category and analysis.category.lower() not in ["general", "consumer product"]:
            query_parts.append(analysis.category)

        # Append domain retrieval keywords
        query_parts.append("applicable Indian Standard BIS certification requirements specification")

        retrieval_query = " ".join(query_parts)
        logger.info(f"Built enhanced retrieval query: '{retrieval_query}' (from user query: '{user_query}')")
        return retrieval_query

    async def retrieve_evidence_with_timing(
        self,
        user_query: str,
        analysis: QueryAnalysis,
        top_k: Optional[int] = None,
        filter_standard: Optional[str] = None,
    ) -> tuple[List[RetrievedEvidence], float, float]:
        """Executes semantic similarity search over Supabase pgvector using the query embedding.
        
        Returns (evidence_list, embedding_ms, retrieval_ms).
        """
        import time
        k = top_k or self.top_k

        # 1. Build optimized retrieval query
        search_query = self.build_retrieval_query(user_query, analysis)

        # 2. Generate embedding for query (MUST use the exact same embedding model as ingestion)
        t_emb_start = time.perf_counter()
        try:
            query_vector = embedding_service.embed_text(search_query)
            embedding_ms = (time.perf_counter() - t_emb_start) * 1000
        except Exception as e:
            embedding_ms = (time.perf_counter() - t_emb_start) * 1000
            logger.error(f"Failed to generate query embedding: {e}")
            return [], embedding_ms, 0.0

        # 3. Query Supabase pgvector RPC
        t_ret_start = time.perf_counter()
        try:
            raw_results = search_similar_chunks(
                query_embedding=query_vector,
                top_k=k,
                filter_standard=filter_standard,
            )
            retrieval_ms = (time.perf_counter() - t_ret_start) * 1000
        except Exception as e:
            retrieval_ms = (time.perf_counter() - t_ret_start) * 1000
            logger.error(f"Error querying Supabase vector database: {e}")
            return [], embedding_ms, retrieval_ms

        if not raw_results:
            logger.info("No matching BIS document chunks found in Supabase.")
            return [], embedding_ms, retrieval_ms

        # 4. Map results to RetrievedEvidence schema
        evidence_list: List[RetrievedEvidence] = []
        for row in raw_results:
            meta = row.get("metadata") or {}
            if not isinstance(meta, dict):
                meta = {}

            # Standard number resolution - strictly reject filenames or invalid codes
            raw_std = row.get("standard_number") or meta.get("standard_number")
            if raw_std:
                std_upper = str(raw_std).strip().upper()
                if not std_upper.startswith("IS ") or ".PDF" in std_upper or re.search(r"\(\d+\)", std_upper):
                    raw_std = None

            std_title = row.get("standard_title") or row.get("title") or meta.get("standard_title") or meta.get("title")
            doc_title = row.get("document_title") or meta.get("document_title") or meta.get("title") or "Indian Standards"

            evidence_list.append(
                RetrievedEvidence(
                    content=row.get("content", ""),
                    standard_number=raw_std,
                    title=std_title,
                    standard_title=std_title,
                    document_title=doc_title,
                    version=row.get("version") or meta.get("version"),
                    page_number=row.get("page_number") if row.get("page_number") is not None else meta.get("page_number"),
                    section=row.get("section") or meta.get("section"),
                    clause=row.get("clause") or meta.get("clause"),
                    sub_clause=row.get("sub_clause") or meta.get("sub_clause"),
                    source_url=row.get("source_url") or meta.get("source_url"),
                    source=doc_title,
                    similarity=round(float(row.get("similarity", 0.0)), 4),
                )
            )

        logger.info(
            f"Retrieved {len(evidence_list)} evidence chunks with top similarity: "
            f"{evidence_list[0].similarity if evidence_list else 'N/A'} "
            f"(Embedding: {embedding_ms:.1f}ms, Retrieval: {retrieval_ms:.1f}ms)"
        )
        return evidence_list, embedding_ms, retrieval_ms

    async def retrieve_evidence(
        self,
        user_query: str,
        analysis: QueryAnalysis,
        top_k: Optional[int] = None,
        filter_standard: Optional[str] = None,
    ) -> List[RetrievedEvidence]:
        """Backwards-compatible convenience method returning just the evidence list."""
        evidence_list, _, _ = await self.retrieve_evidence_with_timing(
            user_query=user_query,
            analysis=analysis,
            top_k=top_k,
            filter_standard=filter_standard,
        )
        return evidence_list


# Global service instance
rag_service = RAGService(top_k=5)
