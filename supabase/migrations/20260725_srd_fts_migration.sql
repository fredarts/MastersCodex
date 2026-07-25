-- Migration: Add Full-Text Search (FTS) columns and GIN indexes to SRD tables

-- 1. Add searchable columns
ALTER TABLE public.srd_monsters ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(type, '')), 'B')
) STORED;

ALTER TABLE public.srd_spells ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(school, '')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce(description, '')), 'C')
) STORED;

ALTER TABLE public.srd_items ADD COLUMN fts tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(description, '')), 'C')
) STORED;

-- 2. Add GIN indexes for fast full-text search
CREATE INDEX idx_srd_monsters_fts ON public.srd_monsters USING GIN (fts);
CREATE INDEX idx_srd_spells_fts ON public.srd_spells USING GIN (fts);
CREATE INDEX idx_srd_items_fts ON public.srd_items USING GIN (fts);
