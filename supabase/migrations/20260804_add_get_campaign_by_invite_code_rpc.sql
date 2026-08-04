-- Migration: Add RPC to get campaign by invite code
-- This bypasses RLS securely so players can join campaigns they have the code for

CREATE OR REPLACE FUNCTION public.get_campaign_by_invite_code(p_invite_code TEXT)
RETURNS SETOF public.campaigns AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.campaigns
  WHERE invite_code = p_invite_code
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
