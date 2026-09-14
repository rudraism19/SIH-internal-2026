-- ============================================================
-- BIS Assistant - Supabase pgvector Knowledge Base Schema
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Documents table: Stores master metadata for each BIS Indian Standard PDF
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    standard_number TEXT NOT NULL,
    document_type TEXT DEFAULT 'Indian Standard',
    version TEXT,
    effective_date DATE,
    source_url TEXT,
    storage_path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 3. Document chunks table: Stores clause-aware text chunks and their vector embeddings
-- Embedding dimension = 384 (matches BAAI/bge-small-en-v1.5 and all-MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384) NOT NULL,
    standard_number TEXT,
    standard_title TEXT,
    document_title TEXT,
    version TEXT,
    page_number INTEGER,
    section TEXT,
    clause TEXT,
    sub_clause TEXT,
    source_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 4. Create indexes for fast lookup and filtering
CREATE INDEX IF NOT EXISTS idx_documents_standard_number ON documents (standard_number);
CREATE INDEX IF NOT EXISTS idx_documents_version ON documents (version);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_std_num ON document_chunks (standard_number);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_title ON document_chunks (document_title);
CREATE INDEX IF NOT EXISTS idx_document_chunks_clause ON document_chunks (clause);
CREATE INDEX IF NOT EXISTS idx_document_chunks_page ON document_chunks (page_number);

-- 5. Create HNSW vector similarity search index for cosine distance
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. RPC Function: match_document_chunks
-- Used by Supabase Python client via supabase.rpc('match_document_chunks', {...})
DROP FUNCTION IF EXISTS match_document_chunks(vector(384), integer, text);

CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding vector(384),
    match_count INTEGER DEFAULT 5,
    filter_standard TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    content TEXT,
    standard_number TEXT,
    standard_title TEXT,
    document_title TEXT,
    version TEXT,
    page_number INTEGER,
    section TEXT,
    clause TEXT,
    sub_clause TEXT,
    source_url TEXT,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.content,
        COALESCE(c.standard_number, CASE WHEN d.standard_number NOT ILIKE '%.pdf%' AND d.standard_number NOT ILIKE '%(%)%' AND d.standard_number ILIKE 'IS %' THEN d.standard_number ELSE NULL END) AS standard_number,
        COALESCE(c.standard_title, d.title) AS standard_title,
        COALESCE(c.document_title, d.title) AS document_title,
        COALESCE(c.version, d.version) AS version,
        c.page_number,
        c.section,
        c.clause,
        c.sub_clause,
        COALESCE(c.source_url, d.source_url) AS source_url,
        (1 - (c.embedding <=> query_embedding))::DOUBLE PRECISION AS similarity
    FROM document_chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE (filter_standard IS NULL OR c.standard_number ILIKE '%' || filter_standard || '%' OR d.standard_number ILIKE '%' || filter_standard || '%')
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
