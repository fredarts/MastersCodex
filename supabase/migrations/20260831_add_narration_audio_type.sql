-- Migration: Permitir tipo 'narration' na tabela campaign_audio_assets
-- Executar no Supabase Dashboard > SQL Editor

ALTER TABLE public.campaign_audio_assets 
  DROP CONSTRAINT IF EXISTS campaign_audio_assets_type_check;

ALTER TABLE public.campaign_audio_assets 
  ADD CONSTRAINT campaign_audio_assets_type_check 
  CHECK (type IN ('bgm', 'sfx', 'narration'));
