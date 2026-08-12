-- Fix: Allow campaign members (players) to INSERT feed events (e.g. wealth rolls, spending logs)
-- Previously only DMs could modify, causing 403 when players rolled starting wealth.

DROP POLICY IF EXISTS "Feed_Modify" ON public.campaign_feed_events;
DROP POLICY IF EXISTS "Feed_Insert" ON public.campaign_feed_events;
DROP POLICY IF EXISTS "Feed_Update" ON public.campaign_feed_events;
DROP POLICY IF EXISTS "Feed_Delete" ON public.campaign_feed_events;

-- Any campaign member or DM can INSERT feed events
CREATE POLICY "Feed_Insert" ON public.campaign_feed_events
  FOR INSERT WITH CHECK (
    public.is_campaign_dm_or_member(campaign_id, auth.uid()::text)
  );

-- Only DM can UPDATE feed events
CREATE POLICY "Feed_Update" ON public.campaign_feed_events
  FOR UPDATE USING (
    public.is_campaign_dm(campaign_id, auth.uid()::text)
  );

-- Only DM can DELETE feed events
CREATE POLICY "Feed_Delete" ON public.campaign_feed_events
  FOR DELETE USING (
    public.is_campaign_dm(campaign_id, auth.uid()::text)
  );
