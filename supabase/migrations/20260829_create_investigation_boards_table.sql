-- Migration: Create Investigation Boards Table for Masters Codex Realtime Multi-User Sync

CREATE TABLE IF NOT EXISTS public.investigation_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('party', 'personal')),
  owner_user_id TEXT,
  title TEXT NOT NULL DEFAULT 'Mural de Investigação',
  items JSONB DEFAULT '[]'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir índice único para upsert de party e personal boards
CREATE UNIQUE INDEX IF NOT EXISTS idx_investigation_boards_party 
ON public.investigation_boards(campaign_id, scope) 
WHERE scope = 'party';

CREATE UNIQUE INDEX IF NOT EXISTS idx_investigation_boards_personal 
ON public.investigation_boards(campaign_id, scope, owner_user_id) 
WHERE scope = 'personal';

-- Habilitar RLS
ALTER TABLE public.investigation_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on investigation_boards" ON public.investigation_boards;
CREATE POLICY "Allow all on investigation_boards" 
ON public.investigation_boards FOR ALL 
USING (true);

-- Publicar no Supabase Realtime se a publicação existir
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.investigation_boards;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
