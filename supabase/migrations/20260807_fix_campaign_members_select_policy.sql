-- Migration to allow all campaign members and DM to select campaign_members rows
DROP POLICY IF EXISTS "Members_Select" ON public.campaign_members;

CREATE POLICY "Members_Select" ON public.campaign_members FOR SELECT USING (
  public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
);
