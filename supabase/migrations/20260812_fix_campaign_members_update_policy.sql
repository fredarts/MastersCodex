-- Recreate campaign_members policies to ensure players have full access to select, insert, and update their own membership details (including token_type and avatar_url)
DROP POLICY IF EXISTS "Members_Select" ON public.campaign_members;
DROP POLICY IF EXISTS "Members_Insert" ON public.campaign_members;
DROP POLICY IF EXISTS "Members_UpdateDelete" ON public.campaign_members;
DROP POLICY IF EXISTS "Members_Update" ON public.campaign_members;
DROP POLICY IF EXISTS "Members_Delete" ON public.campaign_members;

-- 1. Everyone in campaign can select
CREATE POLICY "Members_Select" ON public.campaign_members
  FOR SELECT USING (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
  );

-- 2. Authenticated users can insert their own membership
CREATE POLICY "Members_Insert" ON public.campaign_members
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

-- 3. Owners or DMs can update
CREATE POLICY "Members_Update" ON public.campaign_members
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR 
    public.is_campaign_dm(campaign_id, auth.uid()::text)
  )
  WITH CHECK (
    auth.uid()::text = user_id::text OR 
    public.is_campaign_dm(campaign_id, auth.uid()::text)
  );

-- 4. Owners or DMs can delete
CREATE POLICY "Members_Delete" ON public.campaign_members
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR 
    public.is_campaign_dm(campaign_id, auth.uid()::text)
  );
