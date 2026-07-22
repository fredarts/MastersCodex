-- Migration: Adicionar colunas de clima/hora do dia à tabela scenes
-- Executar no Supabase Dashboard > SQL Editor

-- 1. Colunas de clima e hora do dia na tabela scenes
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS time_of_day TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS time_of_day_hour REAL DEFAULT 12;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS has_fog BOOLEAN DEFAULT false;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS has_rain BOOLEAN DEFAULT false;

-- 2. Recriar a view de jogadores com as novas colunas
-- (É necessário dar DROP na view antes para evitar erro de reordenamento de colunas no Postgres)
DROP VIEW IF EXISTS public.scenes_player_view CASCADE;

CREATE VIEW public.scenes_player_view AS
SELECT 
  id,
  session_id,
  order_index,
  title,
  scene_type,
  npc_name,
  sensory_text,
  bgm_category,
  image_url,
  npc_audio_url,
  sfx_shortcuts,
  combatants,
  time_of_day,
  time_of_day_hour,
  has_fog,
  has_rain,
  created_at
FROM public.scenes;
