-- Migration: Create Audio Maestro & Soundboard Tables
-- Executar no Supabase Dashboard > SQL Editor ou rodando no CLI

-- 1. Criar tabela para registrar áudios customizados por campanha/mestre
CREATE TABLE IF NOT EXISTS public.campaign_audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bgm', 'sfx')),
  category TEXT NOT NULL DEFAULT 'custom',
  is_loop BOOLEAN DEFAULT false,
  icon_name TEXT DEFAULT 'Music', -- Usado para diferenciar ícones de SFX customizados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar tabela para registrar favoritos da campanha (padrão SRD e customizados)
CREATE TABLE IF NOT EXISTS public.campaign_audio_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  audio_id TEXT NOT NULL, -- Pode ser ID do SRD ('bgm-taverna') ou UUID do customizado
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, audio_id)
);

-- 3. Alterar a tabela public.scenes para suportar múltiplas trilhas BGM
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS bgm_tracks JSONB DEFAULT '[]'::jsonb;

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE public.campaign_audio_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Audio_Assets" ON public.campaign_audio_assets;
CREATE POLICY "Allow_All_Audio_Assets" ON public.campaign_audio_assets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.campaign_audio_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow_All_Audio_Favorites" ON public.campaign_audio_favorites;
CREATE POLICY "Allow_All_Audio_Favorites" ON public.campaign_audio_favorites FOR ALL USING (true) WITH CHECK (true);

-- 5. Recriar a view de jogador com a nova coluna de músicas
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
  bgm_tracks, -- Nova lista de trilhas
  image_url,
  npc_audio_url,
  sfx_shortcuts,
  combatants,
  time_of_day,
  time_of_day_hour,
  has_fog,
  has_rain,
  scene_images,
  active_image_index,
  created_at
FROM public.scenes;
