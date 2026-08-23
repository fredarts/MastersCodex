-- ==============================================================================
-- Migration Completa de Correção de Tabelas e Políticas RLS (Masters Codex)
-- Execute este script completo no SQL Editor do seu Dashboard Supabase (supabase.com)
-- ==============================================================================

-- 1. Adicionar coluna 'documents' (JSONB) na tabela campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- 2. Garantir criação da tabela campaign_maps se não existir
CREATE TABLE IF NOT EXISTS public.campaign_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela campaign_calendar_notes para anotações de calendário e eventos
CREATE TABLE IF NOT EXISTS public.campaign_calendar_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month_index INT NOT NULL,
    day INT NOT NULL,
    hour INT,
    minute INT,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'note',
    author_role TEXT DEFAULT 'dm',
    session_id UUID,
    scene_id UUID,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar RLS nas tabelas
ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_calendar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_loot_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Garantir Políticas RLS permissivas para anon e authenticated
DROP POLICY IF EXISTS "Allow all operations for authenticated users on campaign_maps" ON public.campaign_maps;
DROP POLICY IF EXISTS "Allow all on campaign_maps" ON public.campaign_maps;
CREATE POLICY "Allow all on campaign_maps" 
ON public.campaign_maps FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on campaign_calendar_notes" ON public.campaign_calendar_notes;
CREATE POLICY "Allow all on campaign_calendar_notes" 
ON public.campaign_calendar_notes FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on party_loot_sessions" ON public.party_loot_sessions;
CREATE POLICY "Allow all on party_loot_sessions" 
ON public.party_loot_sessions FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);

-- 6. Recarregar o cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
