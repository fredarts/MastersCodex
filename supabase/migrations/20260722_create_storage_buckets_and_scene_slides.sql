-- Migration: Criar bucket campaign-assets no Supabase Storage se não existir
-- Executar no Supabase Dashboard > SQL Editor ou rodando no CLI

-- 1. Criar o bucket campaign-assets no Supabase Storage se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('campaign-assets', 'campaign-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Recriar políticas RLS para o bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-assets');
CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'campaign-assets');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'campaign-assets') WITH CHECK (bucket_id = 'campaign-assets');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'campaign-assets');

-- 3. Alterar a tabela public.scenes para suportar slideshow
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS scene_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS active_image_index INT DEFAULT 0;

-- 4. Recriar a view de jogador com as novas colunas
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
  scene_images,
  active_image_index,
  created_at
FROM public.scenes;
