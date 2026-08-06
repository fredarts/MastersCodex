-- Migration: Create dice_roll_logs table for persistent and search roll history
CREATE TABLE IF NOT EXISTS public.dice_roll_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  character_name TEXT NOT NULL,
  avatar_url TEXT,
  roll_type TEXT NOT NULL,
  label TEXT NOT NULL,
  formula TEXT NOT NULL,
  total INT NOT NULL,
  is_crit BOOLEAN DEFAULT false,
  is_fail BOOLEAN DEFAULT false,
  is_secret BOOLEAN DEFAULT false,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'gm', 'blind', 'self')),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast campaign roll history lookup and filtering
CREATE INDEX IF NOT EXISTS idx_dice_roll_logs_campaign ON public.dice_roll_logs(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dice_roll_logs_user ON public.dice_roll_logs(user_id);

-- Enable RLS
ALTER TABLE public.dice_roll_logs ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "DM can view all campaign dice rolls" ON public.dice_roll_logs;
DROP POLICY IF EXISTS "Players can view public campaign dice rolls" ON public.dice_roll_logs;
DROP POLICY IF EXISTS "Campaign members can insert dice rolls" ON public.dice_roll_logs;

-- RLS Policies:
-- DM pode visualizar todas as rolagens da campanha (públicas e secretas)
CREATE POLICY "DM can view all campaign dice rolls" ON public.dice_roll_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND public.is_campaign_dm(campaign_id, auth.uid()::text)
  );

-- Jogadores podem visualizar rolagens públicas da campanha ou suas próprias rolagens
CREATE POLICY "Players can view public campaign dice rolls" ON public.dice_roll_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      public.is_campaign_member(campaign_id, auth.uid()::text) AND (
        visibility = 'public' OR user_id = auth.uid()::text
      )
    )
  );

-- Membros e DMs podem registrar rolagens de dados
CREATE POLICY "Campaign members can insert dice rolls" ON public.dice_roll_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      public.is_campaign_dm_or_member(campaign_id, auth.uid()::text) OR
      user_id = auth.uid()::text
    )
  );
