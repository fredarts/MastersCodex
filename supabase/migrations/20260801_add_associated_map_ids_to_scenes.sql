-- Add associated_map_ids column to scenes table
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS associated_map_ids UUID[] DEFAULT '{}'::uuid[];
