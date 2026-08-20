-- Migration: Adicionar colunas de Capa (16:9) e Tom Narrativo na tabela campaigns
-- Execute este script no SQL Editor do seu Dashboard do Supabase.

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS theme_tone TEXT;

-- Opcional: Adicionar colunas de calendário se não existirem
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS calendar_config JSONB,
ADD COLUMN IF NOT EXISTS calendar_state JSONB;

-- Atualizar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
