-- Migration: 20260810_add_monster_category_and_stat_sheets.sql
-- Adiciona a categoria 'monster' e cria a tabela para fichas de atributos de combate de NPCs/monstros

-- 1. Atualizar a constraint de category em world_entities
ALTER TABLE public.world_entities DROP CONSTRAINT IF EXISTS world_entities_category_check;
ALTER TABLE public.world_entities ADD CONSTRAINT world_entities_category_check 
CHECK (category IN ('npc', 'location', 'faction', 'religion', 'lore_event', 'species', 'ethnicity', 'tradition', 'profession', 'natural_law', 'spell', 'disease', 'item', 'material', 'technology', 'document', 'language', 'military_conflict', 'military_unit', 'currency', 'trade_route', 'beast', 'flora', 'magic_system', 'plane', 'cosmology', 'monster'));

-- 2. Criar a tabela entity_stat_sheets
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

-- 3. Habilitar RLS na tabela entity_stat_sheets
ALTER TABLE public.entity_stat_sheets ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança para entity_stat_sheets (qualquer usuário autenticado pode ler/escrever)
DROP POLICY IF EXISTS "Entity_Stat_Sheets_Select" ON public.entity_stat_sheets;
CREATE POLICY "Entity_Stat_Sheets_Select" ON public.entity_stat_sheets
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Entity_Stat_Sheets_Insert" ON public.entity_stat_sheets;
CREATE POLICY "Entity_Stat_Sheets_Insert" ON public.entity_stat_sheets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Entity_Stat_Sheets_Update" ON public.entity_stat_sheets;
CREATE POLICY "Entity_Stat_Sheets_Update" ON public.entity_stat_sheets
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Entity_Stat_Sheets_Delete" ON public.entity_stat_sheets;
CREATE POLICY "Entity_Stat_Sheets_Delete" ON public.entity_stat_sheets
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Adicionar a tabela entity_stat_sheets ao realtime publication (comentado pois já foi adicionado)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.entity_stat_sheets;
