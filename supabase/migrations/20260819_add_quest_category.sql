-- Migration: 20260819_add_quest_category.sql
-- Atualiza a constraint de categoria em world_entities para incluir 'quest'

ALTER TABLE public.world_entities DROP CONSTRAINT IF EXISTS world_entities_category_check;
ALTER TABLE public.world_entities ADD CONSTRAINT world_entities_category_check 
CHECK (category IN (
  'npc', 'location', 'faction', 'religion', 'lore_event', 
  'species', 'ethnicity', 'tradition', 'profession', 'natural_law', 
  'spell', 'disease', 'item', 'material', 'technology', 
  'document', 'language', 'military_conflict', 'military_unit', 
  'currency', 'trade_route', 'beast', 'flora', 'magic_system', 
  'plane', 'cosmology', 'monster', 'quest'
));
