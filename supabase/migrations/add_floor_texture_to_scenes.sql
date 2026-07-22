-- Migration: Adicionar coluna floor_texture_url à tabela scenes e scenes_player_view
-- Executar no Supabase Dashboard > SQL Editor ou localmente

-- 1. Coluna de textura do chão na tabela scenes
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS floor_texture_url TEXT;

-- 2. Recriar a view de jogadores com a nova coluna
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
  floor_texture_url,
  created_at
FROM public.scenes;
