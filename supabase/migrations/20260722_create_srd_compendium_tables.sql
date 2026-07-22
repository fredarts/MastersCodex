-- Migration: Create SRD Compendium Tables (Monsters, Spells, Items) with Full-Text Search

-- 1. Table SRD Monsters
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table SRD Spells
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table SRD Items
CREATE TABLE IF NOT EXISTS public.srd_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  rarity TEXT NOT NULL,
  description TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for Fast Filtering and Search
CREATE INDEX IF NOT EXISTS idx_srd_monsters_cr ON public.srd_monsters (cr);
CREATE INDEX IF NOT EXISTS idx_srd_monsters_name ON public.srd_monsters (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_srd_spells_level ON public.srd_spells (level);
CREATE INDEX IF NOT EXISTS idx_srd_spells_school ON public.srd_spells (school);
CREATE INDEX IF NOT EXISTS idx_srd_spells_name ON public.srd_spells (name text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_srd_items_rarity ON public.srd_items (rarity);
CREATE INDEX IF NOT EXISTS idx_srd_items_type ON public.srd_items (type);
