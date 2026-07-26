-- Remover a restrição CHECK antiga da coluna 'category' que bloqueava as novas 19 categorias do Worldbuilding
ALTER TABLE public.world_entities 
DROP CONSTRAINT IF EXISTS world_entities_category_check;

-- Remover restrição de status se existir, permitindo qualquer status personalizado
ALTER TABLE public.world_entities 
DROP CONSTRAINT IF EXISTS world_entities_status_check;

-- Adicionar a coluna 'images' se ainda não foi adicionada
ALTER TABLE public.world_entities
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
