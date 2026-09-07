-- ==============================================================================
-- MASTERS CODEX - CONSOLIDATED DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- Version: 2026.09 (Consolidado & Calibrado)
-- ==============================================================================

-- Habilitar Extensões Essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ==============================================================================
-- 1. ESTRUTURA CORE (PERFIS, MUNDOS, CAMPANHAS & INTEGRANTES)
-- ==============================================================================

-- 1.1 Tabela Profiles (Suporta UUIDs de auth e IDs de demo/convidados)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  active_world_id UUID,
  active_campaign_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.2 Tabela Worlds (Mundos de Campanha)
CREATE TABLE IF NOT EXISTS public.worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT DEFAULT 'Fantasia Medieval',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.3 Tabela Campaigns (Mesas de Jogo)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dm_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  cover_image_url TEXT,
  theme_tone TEXT,
  calendar_config JSONB,
  calendar_state JSONB,
  documents JSONB DEFAULT '[]'::jsonb,
  party_members JSONB DEFAULT '[]'::jsonb,
  active_scene_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Relacionamentos cruzados de Profiles para Worlds e Campaigns
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_world_id_fkey 
  FOREIGN KEY (active_world_id) REFERENCES public.worlds(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_campaign_id_fkey 
  FOREIGN KEY (active_campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- 1.4 Tabela Campaign Members (Elenco de Jogadores da Mesa)
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('dm', 'player')),
  character_name TEXT,
  model_url TEXT,
  token_type TEXT DEFAULT '3d' CHECK (token_type IN ('billboard', '3d')),
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT campaign_members_campaign_id_user_id_key UNIQUE (campaign_id, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_members_on_conflict 
ON public.campaign_members (campaign_id, user_id, character_name);

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON public.campaign_members (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_user_id ON public.campaign_members (user_id);

-- ==============================================================================
-- 2. LORE & ENTIDADES DE MUNDO
-- ==============================================================================

-- 2.1 Tabela World Entities
CREATE TABLE IF NOT EXISTS public.world_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'npc', 'location', 'faction', 'religion', 'lore_event', 'species', 
    'ethnicity', 'tradition', 'profession', 'natural_law', 'spell', 
    'disease', 'item', 'material', 'technology', 'document', 'language', 
    'military_conflict', 'military_unit', 'currency', 'trade_route', 
    'beast', 'flora', 'magic_system', 'plane', 'cosmology', 'monster', 'quest'
  )),
  name TEXT NOT NULL,
  sub_type TEXT,
  status TEXT DEFAULT 'active',
  short_desc TEXT,
  full_content TEXT,
  attributes JSONB DEFAULT '{}'::jsonb,
  connections JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_world_entities_world_id ON public.world_entities (world_id);

-- 2.2 Tabela World Lore Nodes (Grafo de Lore / Nós)
CREATE TABLE IF NOT EXISTS public.world_lore_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES public.worlds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  description TEXT,
  connected_to JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 3. SESSÕES, CENAS E MAPAS DE COMBATE
-- ==============================================================================

-- 3.1 Tabela Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_campaign_id ON public.sessions (campaign_id);

-- 3.2 Tabela Campaign Maps (Mapas Táticos / Grids Pré-fabricados)
CREATE TABLE IF NOT EXISTS public.campaign_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.3 Tabela Scenes (Cenas da Sessão)
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
  bgm_tracks JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  scene_images JSONB DEFAULT '[]'::jsonb,
  active_image_index INT DEFAULT 0,
  npc_audio_url TEXT,
  sfx_shortcuts JSONB DEFAULT '[]'::jsonb,
  combatants JSONB DEFAULT '[]'::jsonb,
  time_of_day TEXT,
  time_of_day_hour REAL DEFAULT 12,
  has_fog BOOLEAN DEFAULT false,
  has_rain BOOLEAN DEFAULT false,
  floor_texture_url TEXT,
  environment_settings JSONB DEFAULT '{}'::jsonb,
  associated_map_id UUID REFERENCES public.campaign_maps(id) ON DELETE SET NULL,
  associated_map_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scenes_session_id ON public.scenes (session_id);

-- Relacionamento de Campaigns com Scenes para active_scene_id
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_active_scene_id_fkey 
  FOREIGN KEY (active_scene_id) REFERENCES public.scenes(id) ON DELETE SET NULL;

-- 3.4 Tabela Scene Maps (Grid de Batalha Específico da Cena)
CREATE TABLE IF NOT EXISTS public.scene_maps (
  scene_id UUID PRIMARY KEY REFERENCES public.scenes(id) ON DELETE CASCADE,
  grid_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================================================
-- 4. FEED DE EVENTOS, FICHAS E ROLAGENS
-- ==============================================================================

-- 4.1 Tabela Campaign Feed Events
CREATE TABLE IF NOT EXISTS public.campaign_feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'battle_summary', 'npc_encounter', 'session_recap', 'milestone', 
    'house_rule', 'chat_message', 'world_lore'
  )),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_feed_events_campaign_id ON public.campaign_feed_events (campaign_id);

-- 4.2 Tabela Character Sheets (Fichas de Jogadores)
CREATE TABLE IF NOT EXISTS public.character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_character_sheets_campaign_id ON public.character_sheets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_character_sheets_user_id ON public.character_sheets(user_id);
CREATE INDEX IF NOT EXISTS idx_character_sheets_user_campaign ON public.character_sheets(user_id, campaign_id);

-- 4.3 Tabela Dice Roll Logs (Auditoria de Rolagens 3D)
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

CREATE INDEX IF NOT EXISTS idx_dice_roll_logs_campaign ON public.dice_roll_logs(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dice_roll_logs_user ON public.dice_roll_logs(user_id);

-- ==============================================================================
-- 5. LOOT, MURAIS, LOJAS & CALENDÁRIO
-- ==============================================================================

-- 5.1 Tabela Party Loot Sessions (Divisão de Tesouros)
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

-- 5.2 Tabela Investigation Boards (Mural de Pistas & Conspirações)
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_investigation_boards_party 
ON public.investigation_boards(campaign_id, scope) WHERE (scope = 'party');

CREATE UNIQUE INDEX IF NOT EXISTS idx_investigation_boards_personal 
ON public.investigation_boards(campaign_id, scope, owner_user_id) WHERE (scope = 'personal');

-- 5.3 Tabela Campaign Shops (Comércio Estilo BG3)
CREATE TABLE IF NOT EXISTS public.campaign_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  merchant_type TEXT NOT NULL,
  merchant_avatar_url TEXT,
  npc_entity_id UUID REFERENCES public.world_entities(id) ON DELETE SET NULL,
  location_entity_id UUID REFERENCES public.world_entities(id) ON DELETE SET NULL,
  location_name TEXT,
  dialogue_greeting TEXT,
  wealth_tier TEXT DEFAULT 'modest',
  gold_reserve INT DEFAULT 500,
  attitude INT DEFAULT 0,
  persuasion_dc INT DEFAULT 14,
  stock JSONB DEFAULT '[]'::jsonb,
  is_open_to_players BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_shops_campaign_id ON public.campaign_shops(campaign_id);

-- 5.4 Tabela Campaign Calendar Notes (Notas e Eventos no Calendário)
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
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==============================================================================
-- 6. ÁUDIO, IA & LORE EMBEDDINGS (RAG)
-- ==============================================================================

-- 6.1 Tabela Campaign Audio Assets (Faixas Musicais e Efeitos)
CREATE TABLE IF NOT EXISTS public.campaign_audio_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bgm', 'sfx', 'narration')),
  category TEXT DEFAULT 'custom',
  is_loop BOOLEAN DEFAULT false,
  icon_name TEXT DEFAULT 'Music',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaign_audio_assets_campaign_id ON public.campaign_audio_assets (campaign_id);

-- 6.2 Tabela Campaign Audio Favorites
CREATE TABLE IF NOT EXISTS public.campaign_audio_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  audio_id TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, audio_id)
);

-- 6.3 Tabela Lore Embeddings (Busca Semântica / RAG)
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

CREATE INDEX IF NOT EXISTS idx_lore_embeddings_world_id ON public.lore_embeddings (world_id);
CREATE INDEX IF NOT EXISTS idx_lore_embeddings_vector ON public.lore_embeddings USING hnsw (embedding vector_cosine_ops);

-- ==============================================================================
-- 7. STAT SHEETS & MONSTROS CUSTOMIZADOS
-- ==============================================================================

-- 7.1 Tabela Entity Stat Sheets (Fichas D&D 5e de NPCs/Criaturas de Mundo)
CREATE TABLE IF NOT EXISTS public.entity_stat_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL UNIQUE REFERENCES public.world_entities(id) ON DELETE CASCADE,
  ac INT NOT NULL DEFAULT 10,
  hp INT NOT NULL DEFAULT 10,
  max_hp INT NOT NULL DEFAULT 10,
  speed TEXT DEFAULT '9m (30ft)',
  cr TEXT DEFAULT '0',
  xp INT DEFAULT 0,
  str INT DEFAULT 10,
  dex INT DEFAULT 10,
  con INT DEFAULT 10,
  int INT DEFAULT 10,
  wis INT DEFAULT 10,
  cha INT DEFAULT 10,
  abilities JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.2 Tabela Custom Monsters (Bestiário Customizado do Mestre / Tokens 2D e 3D)
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
  token_type TEXT NOT NULL DEFAULT 'billboard',
  description TEXT,
  lore TEXT,
  abilities JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  spells JSONB DEFAULT '[]'::jsonb,
  damage_resistances JSONB DEFAULT '[]'::jsonb,
  damage_immunities JSONB DEFAULT '[]'::jsonb,
  damage_vulnerabilities JSONB DEFAULT '[]'::jsonb,
  condition_immunities JSONB DEFAULT '[]'::jsonb,
  base_monster_id TEXT,
  base_monster_name TEXT,
  is_custom_variant BOOLEAN DEFAULT false,
  variant_tag TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_monsters_user_id ON public.custom_monsters (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_campaign_id ON public.custom_monsters (campaign_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_name ON public.custom_monsters USING btree (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_base_monster_name ON public.custom_monsters (base_monster_name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_is_variant ON public.custom_monsters (is_custom_variant) WHERE is_custom_variant = true;

-- ==============================================================================
-- 8. COMPÊNDIO SRD 5.1 (MONSTROS, MAGIAS, ITENS)
-- ==============================================================================

-- 8.1 Tabela SRD Monsters
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
  fts tsvector,
  token_image_url TEXT,
  model_url TEXT,
  token_type TEXT DEFAULT 'billboard'
);

CREATE INDEX IF NOT EXISTS idx_srd_monsters_cr ON public.srd_monsters (cr);
CREATE INDEX IF NOT EXISTS idx_srd_monsters_name ON public.srd_monsters (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_srd_monsters_fts ON public.srd_monsters USING gin (fts);

-- 8.2 Tabela SRD Spells
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
  fts tsvector,
  english_name TEXT,
  concentration BOOLEAN DEFAULT false,
  ritual BOOLEAN DEFAULT false,
  components_detail JSONB DEFAULT '{}'::jsonb,
  target_area JSONB DEFAULT '{}'::jsonb,
  damage_save JSONB DEFAULT '{}'::jsonb,
  higher_levels TEXT
);

CREATE INDEX IF NOT EXISTS idx_srd_spells_level ON public.srd_spells (level);
CREATE INDEX IF NOT EXISTS idx_srd_spells_school ON public.srd_spells (school);
CREATE INDEX IF NOT EXISTS idx_srd_spells_name ON public.srd_spells (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_srd_spells_concentration ON public.srd_spells (concentration);
CREATE INDEX IF NOT EXISTS idx_srd_spells_ritual ON public.srd_spells (ritual);
CREATE INDEX IF NOT EXISTS idx_srd_spells_fts ON public.srd_spells USING gin (fts);

-- 8.3 Tabela SRD Items
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

CREATE INDEX IF NOT EXISTS idx_srd_items_rarity ON public.srd_items (rarity);
CREATE INDEX IF NOT EXISTS idx_srd_items_type ON public.srd_items (type);
CREATE INDEX IF NOT EXISTS idx_srd_items_fts ON public.srd_items USING gin (fts);

-- ==============================================================================
-- 9. FUNÇÕES DE SUPORTE & SEGURANÇA (SECURITY DEFINER)
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

-- Trigger para novos logins via Supabase Auth
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
-- 10. ROW LEVEL SECURITY (RLS) - POLÍTICAS COMPLETAS
-- ==============================================================================

-- 10.1 Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles_Select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Profiles_Modify" ON public.profiles FOR ALL USING (auth.uid()::text = id::text) WITH CHECK (auth.uid()::text = id::text);

-- 10.2 Worlds
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Worlds_Select" ON public.worlds FOR SELECT USING (auth.uid()::text = dm_id::text);
CREATE POLICY "Worlds_Modify" ON public.worlds FOR ALL USING (auth.uid()::text = dm_id::text) WITH CHECK (auth.uid()::text = dm_id::text);

-- 10.3 World Entities & Lore Nodes
ALTER TABLE public.world_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entities_Select" ON public.world_entities FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);
CREATE POLICY "Entities_Modify" ON public.world_entities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);

ALTER TABLE public.world_lore_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "WorldLoreNodes_Select" ON public.world_lore_nodes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);
CREATE POLICY "WorldLoreNodes_Modify" ON public.world_lore_nodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.worlds w WHERE w.id = world_id AND w.dm_id::text = auth.uid()::text)
);

-- 10.4 Campaigns & Members
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Campaigns_Select" ON public.campaigns FOR SELECT USING (
  auth.uid()::text = dm_id::text OR 
  public.is_campaign_member(id, auth.uid()::text)
);
CREATE POLICY "Campaigns_Modify" ON public.campaigns FOR ALL USING (auth.uid()::text = dm_id::text) WITH CHECK (auth.uid()::text = dm_id::text);

ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members_Select" ON public.campaign_members FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "Members_Insert" ON public.campaign_members FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Members_Update" ON public.campaign_members FOR UPDATE USING (
  auth.uid()::text = user_id::text OR public.is_campaign_dm(campaign_id, auth.uid()::text)
);
CREATE POLICY "Members_Delete" ON public.campaign_members FOR DELETE USING (
  auth.uid()::text = user_id::text OR public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- 10.5 Sessions & Scenes
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions_Select" ON public.sessions FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "Sessions_Modify" ON public.sessions FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

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

-- 10.6 Maps (Scene Maps & Campaign Maps)
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

ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CampaignMaps_Select" ON public.campaign_maps FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "CampaignMaps_Modify" ON public.campaign_maps FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

-- 10.7 Feed Events, Character Sheets & Dice Rolls
ALTER TABLE public.campaign_feed_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed_Select" ON public.campaign_feed_events FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "Feed_Insert" ON public.campaign_feed_events FOR INSERT WITH CHECK (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "Feed_Update" ON public.campaign_feed_events FOR UPDATE USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);
CREATE POLICY "Feed_Delete" ON public.campaign_feed_events FOR DELETE USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

ALTER TABLE public.character_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Characters_Select" ON public.character_sheets FOR SELECT USING (
  auth.uid()::text = user_id::text OR
  (campaign_id IS NOT NULL AND public.is_campaign_dm_or_member(campaign_id, auth.uid()::text))
);
CREATE POLICY "Characters_Modify" ON public.character_sheets FOR ALL USING (
  auth.uid()::text = user_id::text OR 
  (campaign_id IS NOT NULL AND public.is_campaign_dm(campaign_id, auth.uid()::text))
);

ALTER TABLE public.dice_roll_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DM can view all campaign dice rolls" ON public.dice_roll_logs FOR SELECT USING (
  auth.uid() IS NOT NULL AND public.is_campaign_dm(campaign_id, auth.uid()::text)
);
CREATE POLICY "Players can view public campaign dice rolls" ON public.dice_roll_logs FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    public.is_campaign_member(campaign_id, auth.uid()::text) AND (
      visibility = 'public' OR user_id = auth.uid()::text
    )
  )
);
CREATE POLICY "Campaign members can insert dice rolls" ON public.dice_roll_logs FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text) OR user_id = auth.uid()::text
  )
);

-- 10.8 Loot, Investigation Boards, Shops, Calendar
ALTER TABLE public.party_loot_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PartyLootSessions_Select" ON public.party_loot_sessions FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "PartyLootSessions_Insert" ON public.party_loot_sessions FOR INSERT WITH CHECK (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "PartyLootSessions_Update" ON public.party_loot_sessions FOR UPDATE USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "PartyLootSessions_Delete" ON public.party_loot_sessions FOR DELETE USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

ALTER TABLE public.investigation_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on investigation_boards" ON public.investigation_boards FOR ALL USING (true);

ALTER TABLE public.campaign_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on campaign_shops" ON public.campaign_shops FOR ALL USING (true);

ALTER TABLE public.campaign_calendar_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on campaign_calendar_notes" ON public.campaign_calendar_notes FOR ALL USING (true);

-- 10.9 Áudio, Lore Embeddings & Stat Sheets
ALTER TABLE public.campaign_audio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AudioAssets_Select" ON public.campaign_audio_assets FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "AudioAssets_Modify" ON public.campaign_audio_assets FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
);

ALTER TABLE public.campaign_audio_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AudioFav_Select" ON public.campaign_audio_favorites FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
CREATE POLICY "AudioFav_Modify" ON public.campaign_audio_favorites FOR ALL USING (
  public.is_campaign_dm(campaign_id, auth.uid()::text)
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

ALTER TABLE public.entity_stat_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entity_Stat_Sheets_Select" ON public.entity_stat_sheets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Entity_Stat_Sheets_Insert" ON public.entity_stat_sheets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Entity_Stat_Sheets_Update" ON public.entity_stat_sheets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Entity_Stat_Sheets_Delete" ON public.entity_stat_sheets FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE public.custom_monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Custom_Monsters_Select" ON public.custom_monsters FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    user_id = auth.uid() OR 
    campaign_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.campaign_members cm
      WHERE cm.campaign_id = custom_monsters.campaign_id AND cm.user_id = auth.uid()
    )
  )
);
CREATE POLICY "Custom_Monsters_Insert" ON public.custom_monsters FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (user_id = auth.uid() OR user_id IS NULL)
);
CREATE POLICY "Custom_Monsters_Update" ON public.custom_monsters FOR UPDATE USING (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);
CREATE POLICY "Custom_Monsters_Delete" ON public.custom_monsters FOR DELETE USING (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);

-- 10.10 SRD Tables (Compêndio)
ALTER TABLE public.srd_monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SRD_Monsters_Select" ON public.srd_monsters FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.srd_spells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SRD_Spells_Select" ON public.srd_spells FOR SELECT USING (auth.role() = 'authenticated');

ALTER TABLE public.srd_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SRD_Items_Select" ON public.srd_items FOR SELECT USING (auth.role() = 'authenticated');

-- ==============================================================================
-- 11. VIEW SEGURA DE CENAS PARA JOGADORES (SEM NOTAS SECRETAS)
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
-- 12. PUBLICAÇÃO SUPABASE REALTIME (TODAS AS TABELAS SINCRONIZADAS)
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaigns;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scenes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_feed_events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.world_entities;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.character_sheets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.party_loot_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.investigation_boards;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_shops;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dice_roll_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_monsters;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_stat_sheets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_calendar_notes;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
