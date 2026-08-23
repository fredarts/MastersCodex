-- Migration: Adicionar coluna documents (JSONB) na tabela campaigns para salvar livros, cartas, diários e bilhetes da campanha no Supabase
-- Execute este script no SQL Editor do seu Dashboard do Supabase (supabase.com).

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Atualizar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
