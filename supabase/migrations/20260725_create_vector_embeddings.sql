-- Migration: 20260725_create_vector_embeddings.sql
-- Habilita a extensão pgvector e cria tabela para RAG de Lore do mundo no Masters Codex

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Tabela de Embeddings de Lore
CREATE TABLE IF NOT EXISTS public.lore_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.world_entities(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768), -- Suporte nativo ao modelo gemini text-embedding-004 (768 dimensões)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índice HNSW para busca por proximidade vetorial ultrarrápida
CREATE INDEX IF NOT EXISTS lore_embeddings_embedding_hnsw_idx 
ON public.lore_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 3. Função RPC para consultar documentos por similaridade de cosseno
DROP FUNCTION IF EXISTS public.match_lore_documents;
DROP FUNCTION IF EXISTS public.match_lore_documents(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS public.match_lore_documents(vector(768), float, int, uuid);

CREATE OR REPLACE FUNCTION match_lore_documents(
    query_embedding vector(768),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    filter_world_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    world_id UUID,
    entity_id UUID,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        le.id,
        le.world_id,
        le.entity_id,
        le.content,
        1 - (le.embedding <=> query_embedding) AS similarity,
        le.metadata
    FROM public.lore_embeddings le
    WHERE 
        (filter_world_id IS NULL OR le.world_id = filter_world_id)
        AND (1 - (le.embedding <=> query_embedding)) >= match_threshold
    ORDER BY le.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
