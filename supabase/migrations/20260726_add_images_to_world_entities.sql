-- Adicionar a coluna 'images' à tabela 'world_entities'
ALTER TABLE public.world_entities
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
