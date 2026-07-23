-- Migração para ajustar restrições e índices de conflito da tabela campaign_members

ALTER TABLE public.campaign_members ADD COLUMN IF NOT EXISTS model_url TEXT;

-- Índice para evitar duplicatas por campanha e usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_members_campaign_user 
ON public.campaign_members (campaign_id, user_id);

-- Índice para evitar duplicatas por campanha, usuário e nome de personagem
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_members_on_conflict 
ON public.campaign_members (campaign_id, user_id, character_name);
