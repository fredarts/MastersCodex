-- Migration: Adicionar coluna environment_settings à tabela scenes
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Adicionar coluna JSONB
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS environment_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Recriar a view scenes_player_view
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
  environment_settings,
  created_at
FROM public.scenes;
