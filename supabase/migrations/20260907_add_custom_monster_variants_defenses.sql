-- MIGRATION: 20260907_add_custom_monster_variants_defenses.sql
-- Adiciona suporte a variantes de monstros, tags de linhagem e defesas elementais D&D 5e na tabela custom_monsters

ALTER TABLE public.custom_monsters 
  ADD COLUMN IF NOT EXISTS base_monster_id TEXT,
  ADD COLUMN IF NOT EXISTS base_monster_name TEXT,
  ADD COLUMN IF NOT EXISTS is_custom_variant BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS variant_tag TEXT,
  ADD COLUMN IF NOT EXISTS damage_resistances JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS damage_immunities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS damage_vulnerabilities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS condition_immunities JSONB DEFAULT '[]'::jsonb;

-- Índice para busca rápida de variantes por monstro base
CREATE INDEX IF NOT EXISTS idx_custom_monsters_base_monster_name 
  ON public.custom_monsters (base_monster_name text_pattern_ops);

-- Índice para filtragem de variantes ativas
CREATE INDEX IF NOT EXISTS idx_custom_monsters_is_variant 
  ON public.custom_monsters (is_custom_variant) 
  WHERE is_custom_variant = true;
