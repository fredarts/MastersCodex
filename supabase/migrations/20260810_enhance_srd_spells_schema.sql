-- Migration: Enhance SRD Spells Schema with Detailed Components, Areas, Concentration, Rituals & Damage
-- Date: 2026-08-10

ALTER TABLE public.srd_spells
  ADD COLUMN IF NOT EXISTS english_name TEXT,
  ADD COLUMN IF NOT EXISTS concentration BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ritual BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS components_detail JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS target_area JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS damage_save JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS higher_levels TEXT;

-- Indexes for Fast Filtering and Search
CREATE INDEX IF NOT EXISTS idx_srd_spells_concentration ON public.srd_spells (concentration);
CREATE INDEX IF NOT EXISTS idx_srd_spells_ritual ON public.srd_spells (ritual);
