-- Fix: Expand event_type CHECK constraint to include 'chat_message' and 'world_lore'
-- These types are used by player wealth rolls, coin spending, and world lore entries.

ALTER TABLE public.campaign_feed_events DROP CONSTRAINT IF EXISTS campaign_feed_events_event_type_check;

ALTER TABLE public.campaign_feed_events ADD CONSTRAINT campaign_feed_events_event_type_check
  CHECK (event_type IN (
    'battle_summary',
    'npc_encounter',
    'session_recap',
    'milestone',
    'house_rule',
    'chat_message',
    'world_lore'
  ));
