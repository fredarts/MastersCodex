-- Migration: Enable pgvector and Create Lore Embeddings Table for Vector RAG

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Lore Embeddings Table
CREATE TABLE IF NOT EXISTS public.lore_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.world_entities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- Supports OpenAI text-embedding-3-small or Gemini Embeddings
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HNSW Cosine Index for Fast Similarity Search
CREATE INDEX IF NOT EXISTS idx_lore_embeddings_cosine 
ON public.lore_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 4. RPC Function for Cosine Similarity Matching
CREATE OR REPLACE FUNCTION match_lore_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_world_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lore_embeddings.id,
    lore_embeddings.content,
    lore_embeddings.metadata,
    1 - (lore_embeddings.embedding <=> query_embedding) AS similarity
  FROM lore_embeddings
  WHERE 
    (filter_world_id IS NULL OR lore_embeddings.world_id = filter_world_id)
    AND (1 - (lore_embeddings.embedding <=> query_embedding)) > match_threshold
  ORDER BY lore_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
