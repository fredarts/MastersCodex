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
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS party_members JSONB DEFAULT '[]'::jsonb;

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
  category TEXT NOT NULL CHECK (category IN ('npc', 'location', 'faction', 'religion', 'lore_event', 'species', 'ethnicity', 'tradition', 'profession', 'natural_law', 'spell', 'disease', 'item', 'material', 'technology', 'document', 'language', 'military_conflict', 'military_unit', 'currency', 'trade_route', 'beast', 'flora', 'magic_system', 'plane', 'cosmology')),
  name TEXT NOT NULL,
  sub_type TEXT,
  status TEXT DEFAULT 'active',
  short_desc TEXT,
  full_content TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir adição de colunas para world_entities em bancos existentes
ALTER TABLE public.world_entities ADD COLUMN IF NOT EXISTS sub_type TEXT;
ALTER TABLE public.world_entities ADD COLUMN IF NOT EXISTS short_desc TEXT;
ALTER TABLE public.world_entities ADD COLUMN IF NOT EXISTS full_content TEXT;
ALTER TABLE public.world_entities ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.world_entities ADD COLUMN IF NOT EXISTS connections JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.world_entities ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::text[];

-- Garantir que a constraint de category esteja atualizada para todas as categorias
ALTER TABLE public.world_entities DROP CONSTRAINT IF EXISTS world_entities_category_check;
ALTER TABLE public.world_entities ADD CONSTRAINT world_entities_category_check 
CHECK (category IN ('npc', 'location', 'faction', 'religion', 'lore_event', 'species', 'ethnicity', 'tradition', 'profession', 'natural_law', 'spell', 'disease', 'item', 'material', 'technology', 'document', 'language', 'military_conflict', 'military_unit', 'currency', 'trade_route', 'beast', 'flora', 'magic_system', 'plane', 'cosmology'));

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
  time_of_day TEXT,
  time_of_day_hour REAL DEFAULT 12,
  has_fog BOOLEAN DEFAULT false,
  has_rain BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir adição de colunas caso a tabela scenes já existia anteriormente no Supabase
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS npc_name TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS sensory_text TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS secret_notes TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS bgm_category TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS npc_audio_url TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS sfx_shortcuts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS combatants JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS time_of_day TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS time_of_day_hour REAL DEFAULT 12;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS has_fog BOOLEAN DEFAULT false;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS has_rain BOOLEAN DEFAULT false;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS scene_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS active_image_index INT DEFAULT 0;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS bgm_tracks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS floor_texture_url TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS associated_map_id UUID REFERENCES public.campaign_maps(id) ON DELETE SET NULL;

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

-- Garantir adição de colunas para campaign_feed_events em bancos existentes
ALTER TABLE public.campaign_feed_events ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.campaign_feed_events ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;


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

-- 1.9 Tabela Character Sheets (Fichas de Personagens em Tempo Real)
CREATE TABLE IF NOT EXISTS public.character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garantir colunas e índices
ALTER TABLE public.character_sheets ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_character_sheets_user_campaign ON public.character_sheets(user_id, campaign_id);

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
-- FUNÇÕES DE AJUDA COM SECURITY DEFINER (EVITAM RECURSÃO INFINITA NO RLS)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_campaign_member(_campaign_id UUID, _user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_members 
    WHERE campaign_id = _campaign_id AND user_id::text = _user_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_campaign_dm(_campaign_id UUID, _user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = _campaign_id AND dm_id::text = _user_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_campaign_dm_or_member(_campaign_id UUID, _user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = _campaign_id AND dm_id::text = _user_id::text
  ) OR EXISTS (
    SELECT 1 FROM public.campaign_members 
    WHERE campaign_id = _campaign_id AND user_id::text = _user_id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_campaign_by_invite_code(p_invite_code TEXT)
RETURNS SETOF public.campaigns AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.campaigns
  WHERE invite_code = p_invite_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- RLS - POLÍTICAS SEGURAS POR USUÁRIO E PAPEL
-- ==============================================================================

-- PROFILES: Todos autenticados leem, mas apenas o próprio usuário edita.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles_Select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Profiles_Modify" ON public.profiles FOR ALL USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

-- WORLDS: Apenas o DM criador pode visualizar e modificar seus mundos.
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Worlds_Select" ON public.worlds FOR SELECT USING (auth.uid()::text = dm_id::text);
CREATE POLICY "Worlds_Modify" ON public.worlds FOR ALL USING (auth.uid()::text = dm_id::text) WITH CHECK (auth.uid()::text = dm_id::text);

-- CAMPAIGNS: DM criador ou membros inscritos na mesa podem visualizar, apenas DM edita.
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns_Select" ON public.campaigns FOR SELECT USING (
  auth.uid()::text = dm_id::text OR 
  public.is_campaign_member(id, auth.uid()::text)
);
CREATE POLICY "Campaigns_Modify" ON public.campaigns FOR ALL USING (auth.uid()::text = dm_id::text) WITH CHECK (auth.uid()::text = dm_id::text);

-- CAMPAIGN_MEMBERS: Integrantes e DM da mesa leem, usuários inserem a si mesmos, DM ou usuário deleta.
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members_Select" ON public.campaign_members FOR SELECT USING (
  auth.uid()::text = user_id::text OR 
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);
CREATE POLICY "Members_Insert" ON public.campaign_members FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Members_UpdateDelete" ON public.campaign_members FOR ALL USING (
  auth.uid()::text = user_id::text OR 
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- WORLD_ENTITIES: Apenas o DM dono do mundo lê e edita.
ALTER TABLE public.world_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entities_Select" ON public.world_entities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);
CREATE POLICY "Entities_Modify" ON public.world_entities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);

-- SESSIONS: DM da campanha ou membros da mesa leem, apenas DM edita.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions_Select" ON public.sessions FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "Sessions_Modify" ON public.sessions FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- SCENES: DM da campanha ou membros da mesa leem, apenas DM edita.
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenes_Select" ON public.scenes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessions s 
    WHERE s.id = session_id 
    AND public.is_campaign_dm_or_member(s.campaign_id, auth.uid()::text)
  )
);
CREATE POLICY "Scenes_Modify" ON public.scenes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.sessions s 
    WHERE s.id = session_id 
    AND public.is_campaign_dm(s.campaign_id, auth.uid()::text)
  )
);

-- CAMPAIGN_FEED_EVENTS: DM ou membros leem, apenas DM edita.
ALTER TABLE public.campaign_feed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed_Select" ON public.campaign_feed_events FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "Feed_Modify" ON public.campaign_feed_events FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- CHARACTER_SHEETS: DM ou integrantes leem, Dono da ficha ou DM edita.
ALTER TABLE public.character_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Characters_Select" ON public.character_sheets FOR SELECT USING (
  auth.uid()::text = user_id::text OR
  (campaign_id IS NOT NULL AND public.is_campaign_dm_or_member(campaign_id, auth.uid()::text))
);
CREATE POLICY "Characters_Modify" ON public.character_sheets FOR ALL USING (
  auth.uid()::text = user_id::text OR 
  (campaign_id IS NOT NULL AND public.is_campaign_dm(campaign_id, auth.uid()::text))
);


-- ==============================================================================
-- VIEW SEGURA DE CENAS PARA JOGADORES (OMITE NOTAS SECRETAS DO MESTRE)
-- ==============================================================================

DROP VIEW IF EXISTS public.scenes_player_view CASCADE;

CREATE OR REPLACE VIEW public.scenes_player_view AS
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
  bgm_tracks,
  floor_texture_url,
  created_at
FROM public.scenes;

-- ==============================================================================
-- PUBLICAÇÃO SUPABASE REALTIME (HABILITA WEBSOCKETS NAS TABELAS)
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_feed_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.world_entities;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.character_sheets;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignorar erro caso a tabela já pertença à publicação
    NULL;
END $$;

-- ==============================================================================
-- NOVAS TABELAS: LORE, AUDIO, SRD & MAPS
-- ==============================================================================

-- LORE EMBEDDINGS (RAG)
CREATE TABLE IF NOT EXISTS public.lore_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.world_entities(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lore_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lore_Select" ON public.lore_embeddings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id 
    AND (c.dm_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM public.campaign_members cm WHERE cm.campaign_id = c.id AND cm.user_id::text = auth.uid()::text))
  )
  OR EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);
CREATE POLICY "Lore_Modify" ON public.lore_embeddings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.dm_id::text = auth.uid()::text)
  OR EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);

-- CAMPAIGN AUDIO ASSETS
CREATE TABLE IF NOT EXISTS public.campaign_audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT DEFAULT 'custom',
  is_loop BOOLEAN DEFAULT false,
  icon_name TEXT DEFAULT 'Music',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.campaign_audio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AudioAssets_Select" ON public.campaign_audio_assets FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "AudioAssets_Modify" ON public.campaign_audio_assets FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- CAMPAIGN AUDIO FAVORITES
CREATE TABLE IF NOT EXISTS public.campaign_audio_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  audio_id TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.campaign_audio_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AudioFav_Select" ON public.campaign_audio_favorites FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "AudioFav_Modify" ON public.campaign_audio_favorites FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- SCENE MAPS
CREATE TABLE IF NOT EXISTS public.scene_maps (
  scene_id UUID PRIMARY KEY REFERENCES public.scenes(id) ON DELETE CASCADE,
  grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scene_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SceneMaps_Select" ON public.scene_maps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.scenes sc 
    JOIN public.sessions s ON s.id = sc.session_id
    WHERE sc.id = scene_maps.scene_id 
    AND public.is_campaign_dm_or_member(s.campaign_id, auth.uid()::text)
  )
);
CREATE POLICY "SceneMaps_Modify" ON public.scene_maps FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.scenes sc 
    JOIN public.sessions s ON s.id = sc.session_id
    WHERE sc.id = scene_maps.scene_id 
    AND public.is_campaign_dm(s.campaign_id, auth.uid()::text)
  )
);

-- CAMPAIGN MAPS (SAVED MAPS TEMPLATES)
CREATE TABLE IF NOT EXISTS public.campaign_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CampaignMaps_Select" ON public.campaign_maps FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "CampaignMaps_Modify" ON public.campaign_maps FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- SRD ITEMS
CREATE TABLE IF NOT EXISTS public.srd_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  description TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fts tsvector
);

ALTER TABLE public.srd_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SRD_Items_Select" ON public.srd_items FOR SELECT USING (auth.role() = 'authenticated');

-- SRD MONSTERS
CREATE TABLE IF NOT EXISTS public.srd_monsters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size TEXT NOT NULL,
  alignment TEXT,
  ac INT NOT NULL,
  hp INT NOT NULL,
  speed TEXT,
  cr TEXT NOT NULL,
  xp INT,
  str INT DEFAULT 10,
  dex INT DEFAULT 10,
  con INT DEFAULT 10,
  int INT DEFAULT 10,
  wis INT DEFAULT 10,
  cha INT DEFAULT 10,
  abilities JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fts tsvector
);

ALTER TABLE public.srd_monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SRD_Monsters_Select" ON public.srd_monsters FOR SELECT USING (auth.role() = 'authenticated');

-- SRD SPELLS
CREATE TABLE IF NOT EXISTS public.srd_spells (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INT NOT NULL,
  school TEXT NOT NULL,
  casting_time TEXT NOT NULL,
  range TEXT NOT NULL,
  components TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT NOT NULL,
  classes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  fts tsvector
);

ALTER TABLE public.srd_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SRD_Spells_Select" ON public.srd_spells FOR SELECT USING (auth.role() = 'authenticated');

-- 1.10 Tabela Party Loot Sessions (Loot do Grupo de Jogadores)
CREATE TABLE IF NOT EXISTS public.party_loot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  distribution_mode TEXT NOT NULL DEFAULT 'free_for_all' CHECK (distribution_mode IN ('leader_assigned', 'free_for_all')),
  leader_id TEXT,
  leader_character_name TEXT,
  currency JSONB DEFAULT '{"po": 0, "pl": 0, "pp": 0, "pc": 0, "pe": 0}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.party_loot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PartyLootSessions_Select" ON public.party_loot_sessions 
  FOR SELECT USING (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
  );

CREATE POLICY "PartyLootSessions_Insert" ON public.party_loot_sessions 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "PartyLootSessions_Update" ON public.party_loot_sessions 
  FOR UPDATE USING (true);

CREATE POLICY "PartyLootSessions_Delete" ON public.party_loot_sessions 
  FOR DELETE USING (true);

-- Publicar no Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.party_loot_sessions;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 1.11 TABELA CUSTOM MONSTERS (Monstros Customizados / Pinos Billboard 2D e 3D)
CREATE TABLE IF NOT EXISTS public.custom_monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Monstro',
  size TEXT NOT NULL DEFAULT 'Médio',
  alignment TEXT DEFAULT 'Neutro',
  ac INT NOT NULL DEFAULT 10,
  hp INT NOT NULL DEFAULT 10,
  speed TEXT DEFAULT '9m',
  cr TEXT DEFAULT '1',
  xp INT DEFAULT 200,
  str INT DEFAULT 10,
  dex INT DEFAULT 10,
  con INT DEFAULT 10,
  int INT DEFAULT 10,
  wis INT DEFAULT 10,
  cha INT DEFAULT 10,
  token_image_url TEXT,
  model_url TEXT,
  token_type TEXT NOT NULL DEFAULT 'billboard', -- 'billboard' ou '3d'
  description TEXT,
  lore TEXT,
  abilities JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  spells JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_custom_monsters_user_id ON public.custom_monsters (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_campaign_id ON public.custom_monsters (campaign_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_name ON public.custom_monsters (name text_pattern_ops);

-- RLS (Row Level Security)
ALTER TABLE public.custom_monsters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom_Monsters_Select" ON public.custom_monsters
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR 
      campaign_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.campaign_members cm
        WHERE cm.campaign_id = custom_monsters.campaign_id AND cm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Custom_Monsters_Insert" ON public.custom_monsters
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Custom_Monsters_Update" ON public.custom_monsters
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

CREATE POLICY "Custom_Monsters_Delete" ON public.custom_monsters
  FOR DELETE USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- Publicar no Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_monsters;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ==============================================================================
-- 1.12 TABELA DICE ROLL LOGS (Histórico e Auditoria de Rolagens)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dice_roll_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  character_name TEXT NOT NULL,
  avatar_url TEXT,
  roll_type TEXT NOT NULL,
  label TEXT NOT NULL,
  formula TEXT NOT NULL,
  total INT NOT NULL,
  is_crit BOOLEAN DEFAULT false,
  is_fail BOOLEAN DEFAULT false,
  is_secret BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'gm', 'blind', 'self')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast campaign roll history lookup and filtering
CREATE INDEX IF NOT EXISTS idx_dice_roll_logs_campaign ON public.dice_roll_logs(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dice_roll_logs_user ON public.dice_roll_logs(user_id);

-- Enable RLS
ALTER TABLE public.dice_roll_logs ENABLE ROW LEVEL SECURITY;

-- DM pode visualizar todas as rolagens da campanha (públicas e secretas)
CREATE POLICY "DM can view all campaign dice rolls" ON public.dice_roll_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND public.is_campaign_dm(campaign_id, auth.uid()::text)
  );

-- Jogadores podem visualizar rolagens públicas da campanha ou suas próprias rolagens
CREATE POLICY "Players can view public campaign dice rolls" ON public.dice_roll_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_campaign_member(campaign_id, auth.uid()::text) AND (
        visibility = 'public' OR user_id = auth.uid()::text
      )
    )
  );

-- Membros e DMs podem registrar rolagens de dados
CREATE POLICY "Campaign members can insert dice rolls" ON public.dice_roll_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      public.is_campaign_dm_or_member(campaign_id, auth.uid()::text) OR
      user_id = auth.uid()::text
    )
  );
