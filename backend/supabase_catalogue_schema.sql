-- ============================================================
-- BIS Assistant - Document Catalogue Schema Migration
-- Table: bis_documents
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Create bis_documents table
CREATE TABLE IF NOT EXISTS bis_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard_number TEXT,
    title TEXT,
    product TEXT,
    document_type TEXT DEFAULT 'Indian Standard',
    version TEXT,
    status TEXT DEFAULT 'Published',
    source_url TEXT,
    file_path TEXT,
    file_checksum TEXT,
    ingestion_status TEXT DEFAULT 'pending' CHECK (ingestion_status IN (
        'pending',
        'downloading',
        'downloaded',
        'processing',
        'chunked',
        'embedded',
        'indexed',
        'failed'
    )),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- 2. Indexes for fast lookup and duplicate prevention
CREATE INDEX IF NOT EXISTS idx_bis_documents_standard_number ON bis_documents (standard_number);
CREATE INDEX IF NOT EXISTS idx_bis_documents_product ON bis_documents (product);
CREATE INDEX IF NOT EXISTS idx_bis_documents_document_type ON bis_documents (document_type);
CREATE INDEX IF NOT EXISTS idx_bis_documents_ingestion_status ON bis_documents (ingestion_status);
CREATE INDEX IF NOT EXISTS idx_bis_documents_file_checksum ON bis_documents (file_checksum);
CREATE INDEX IF NOT EXISTS idx_bis_documents_file_path ON bis_documents (file_path);

-- Composite index for natural document uniqueness when standard_number is known
CREATE INDEX IF NOT EXISTS idx_bis_documents_lookup ON bis_documents (standard_number, document_type, version);

-- 3. Trigger to automatically keep updated_at current
CREATE OR REPLACE FUNCTION update_bis_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bis_documents_updated_at ON bis_documents;
CREATE TRIGGER trigger_update_bis_documents_updated_at
BEFORE UPDATE ON bis_documents
FOR EACH ROW
EXECUTE FUNCTION update_bis_documents_updated_at();

-- 4. Row-Level Security (RLS)
ALTER TABLE bis_documents ENABLE ROW LEVEL SECURITY;

-- Allow service_role full CRUD access (used by FastAPI server-side)
DROP POLICY IF EXISTS "Allow service_role full access to bis_documents" ON bis_documents;
CREATE POLICY "Allow service_role full access to bis_documents"
ON bis_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow read access to authenticated and anon users
DROP POLICY IF EXISTS "Allow read access to bis_documents" ON bis_documents;
CREATE POLICY "Allow read access to bis_documents"
ON bis_documents
FOR SELECT
TO anon, authenticated
USING (true);
