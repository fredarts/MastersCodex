-- Migration: Adiciona active_scene_id e live_state à tabela campaigns
-- Propósito: Sincronização em tempo real de telas (Arte / Dungeon / Grid 3D) e Masmorra entre Mestre e Jogadores de contas diferentes
-- Execute este script no Supabase Dashboard > SQL Editor

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS active_scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS live_state JSONB DEFAULT '{"displayMode": "artwork"}'::jsonb;

-- Habilita replicação Realtime para a tabela campaigns se ainda não estiver na publicação
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'campaigns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
  END IF;
END $$;
