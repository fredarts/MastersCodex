-- Migration to add token customization fields to campaign_members
ALTER TABLE public.campaign_members ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT '3d' CHECK (token_type IN ('billboard', '3d'));
ALTER TABLE public.campaign_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;
