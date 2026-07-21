-- Migration: Flexible Schema for Masters Codex (Supabase & Cross-Browser Sync)

-- 1.1 Tabela Profiles (Suporta UUIDs de auth e IDs de demo/convidados)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  active_world_id UUID,
  active_campaign_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir adição de colunas para bancos existentes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_world_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_campaign_id UUID;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL;

-- 1.2 Tabela Worlds
CREATE TABLE IF NOT EXISTS public.worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT DEFAULT 'Fantasia Medieval',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Tabela Campaigns (Mesas de Jogo)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_id TEXT NOT NULL,
  world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Tabela Campaign Members (Elenco de Jogadores da Mesa)
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('dm', 'player')),
  character_name TEXT,
  model_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, user_id, character_name)
);

-- Garantir adição da coluna model_url para bancos existentes
ALTER TABLE public.campaign_members ADD COLUMN IF NOT EXISTS model_url TEXT;

-- Garantir Índice Único para ON CONFLICT caso a tabela já existia no Supabase
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_members_on_conflict 
ON public.campaign_members (campaign_id, user_id, character_name);

-- 1.5 Tabela World Entities
CREATE TABLE IF NOT EXISTS public.world_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('npc', 'location', 'faction', 'religion', 'lore_event')),
  name TEXT NOT NULL,
  sub_type TEXT,
  status TEXT DEFAULT 'active',
  short_desc TEXT,
  full_content TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.6 Tabela Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.7 Tabela Scenes
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  scene_type TEXT NOT NULL CHECK (scene_type IN ('combat', 'dialogue', 'social', 'exploration')),
  npc_name TEXT,
  sensory_text TEXT,
  secret_notes TEXT,
  bgm_category TEXT,
  image_url TEXT,
  npc_audio_url TEXT,
  sfx_shortcuts JSONB DEFAULT '[]'::jsonb,
  combatants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.8 Tabela Campaign Feed Events
CREATE TABLE IF NOT EXISTS public.campaign_feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('battle_summary', 'npc_encounter', 'session_recap', 'milestone', 'house_rule')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger automático para novos logins de usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- LIMPEZA DE POLÍTICAS RLS ANTIGAS (PREVINE ERRO: infinite recursion detected)
-- ==============================================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ==============================================================================
-- REHABILITAR RLS COM POLÍTICAS SIMPLES SEM RECURSÃO
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Worlds" ON public.worlds FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Campaign_Members" ON public.campaign_members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.world_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Entities" ON public.world_entities FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Scenes" ON public.scenes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.campaign_feed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_All_Feed" ON public.campaign_feed_events FOR ALL USING (true) WITH CHECK (true);
