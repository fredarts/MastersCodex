-- MIGRATION: 20260804_create_custom_monsters_table.sql
-- Tabela para armazenamento de monstros customizados criados pelos usuários (GMs e Jogadores)

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
  token_type TEXT NOT NULL DEFAULT 'billboard', -- 'billboard' ou '3d'
  description TEXT,
  lore TEXT,
  abilities JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  spells JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de busca e ordenação
CREATE INDEX IF NOT EXISTS idx_custom_monsters_user_id ON public.custom_monsters (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_campaign_id ON public.custom_monsters (campaign_id);
CREATE INDEX IF NOT EXISTS idx_custom_monsters_name ON public.custom_monsters (name text_pattern_ops);

-- RLS (Row Level Security)
ALTER TABLE public.custom_monsters ENABLE ROW LEVEL SECURITY;

-- Política de leitura: usuários autenticados podem ver os próprios monstros e os monstros das suas campanhas
CREATE POLICY "Custom_Monsters_Select" ON public.custom_monsters
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR 
      campaign_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.campaign_members cm
        WHERE cm.campaign_id = custom_monsters.campaign_id AND cm.user_id = auth.uid()
      )
    )
  );

-- Política de inserção: usuários autenticados podem criar monstros atribuídos ao seu user_id
CREATE POLICY "Custom_Monsters_Insert" ON public.custom_monsters
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- Política de atualização: o criador pode atualizar seu monstro
CREATE POLICY "Custom_Monsters_Update" ON public.custom_monsters
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );

-- Política de exclusão: o criador pode deletar seu monstro
CREATE POLICY "Custom_Monsters_Delete" ON public.custom_monsters
  FOR DELETE USING (
    auth.role() = 'authenticated' AND user_id = auth.uid()
  );
