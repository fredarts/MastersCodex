-- Migration: 20260810_add_srd_monsters_token_fields.sql
-- Adiciona colunas de token e modelo à tabela public.srd_monsters

ALTER TABLE public.srd_monsters ADD COLUMN IF NOT EXISTS token_image_url TEXT;
ALTER TABLE public.srd_monsters ADD COLUMN IF NOT EXISTS model_url TEXT;
ALTER TABLE public.srd_monsters ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'billboard';
