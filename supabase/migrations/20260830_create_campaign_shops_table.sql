-- Migration: Create campaign_shops table for Merchant Forge & BG3 Trade System

CREATE TABLE IF NOT EXISTS public.campaign_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  merchant_type TEXT NOT NULL,
  merchant_avatar_url TEXT,
  npc_entity_id UUID REFERENCES public.world_entities(id) ON DELETE SET NULL,
  location_entity_id UUID REFERENCES public.world_entities(id) ON DELETE SET NULL,
  location_name TEXT,
  dialogue_greeting TEXT,
  wealth_tier TEXT DEFAULT 'modest',
  gold_reserve INTEGER DEFAULT 500,
  attitude INTEGER DEFAULT 0,
  persuasion_dc INTEGER DEFAULT 14,
  stock JSONB DEFAULT '[]'::jsonb,
  is_open_to_players BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast campaign query
CREATE INDEX IF NOT EXISTS idx_campaign_shops_campaign_id ON public.campaign_shops(campaign_id);

-- Enable RLS
ALTER TABLE public.campaign_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on campaign_shops" ON public.campaign_shops;
CREATE POLICY "Allow all on campaign_shops" 
ON public.campaign_shops FOR ALL 
USING (true);

-- Enable Supabase Realtime for instant synchronization between DM and Players
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_shops;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
