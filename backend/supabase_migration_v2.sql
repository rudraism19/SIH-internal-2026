-- ============================================================
-- BIS Assistant - Supabase Migration v2
-- Adds chunk-level standard metadata & updates vector RPC
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow standard_number in documents table to be NULL for compendiums/presentations
ALTER TABLE documents ALTER COLUMN standard_number DROP NOT NULL;

-- 2. Add chunk-level standard and document metadata columns to document_chunks
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS standard_number TEXT;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS standard_title TEXT;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS document_title TEXT;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS version TEXT;
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 2. Create indexes for chunk-level standard lookup
CREATE INDEX IF NOT EXISTS idx_document_chunks_std_num ON document_chunks (standard_number);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_title ON document_chunks (document_title);

-- 3. Drop existing match_document_chunks function to allow updating return signature
DROP FUNCTION IF EXISTS match_document_chunks(vector(384), integer, text);

-- 4. Recreate match_document_chunks function with enhanced metadata return
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
        -- Chunk-level standard number takes precedence; fallback to document standard_number ONLY if it is not a filename
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
