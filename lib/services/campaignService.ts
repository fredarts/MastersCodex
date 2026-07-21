import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';

export const campaignService = {
  async fetchUserCampaigns(userId?: string): Promise<UserCampaign[]> {
    if (isSupabaseConfigured() && userId) {
      const { data: dmCamps } = await supabase.from('campaigns').select('*').eq('dm_id', userId);
      const { data: memCamps } = await supabase
        .from('campaign_members')
        .select('campaign_id, role, campaigns(*)')
        .eq('user_id', userId);

      let allCamps: UserCampaign[] = [];
      if (dmCamps) {
        allCamps = dmCamps.map((c: any) => ({
          id: c.id,
          dmId: c.dm_id,
          worldId: c.world_id,
          title: c.title,
          description: c.description,
          inviteCode: c.invite_code,
          role: 'dm',
        }));
      }

      if (memCamps) {
        memCamps.forEach((m: any) => {
          if (m.campaigns && !allCamps.some((c) => c.id === m.campaigns.id)) {
            allCamps.push({
              id: m.campaigns.id,
              dmId: m.campaigns.dm_id,
              worldId: m.campaigns.world_id,
              title: m.campaigns.title,
              description: m.campaigns.description,
              inviteCode: m.campaigns.invite_code,
              role: m.role || 'player',
            });
          }
        });
      }

      return allCamps;
    }

    try {
      const saved = localStorage.getItem('codex_campaigns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async createCampaign(title: string, worldId?: string, description = '', userId?: string): Promise<UserCampaign> {
    const code = `${title.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCamp: UserCampaign = {
      id: `camp-${Date.now()}`,
      dmId: userId || 'demo-dm-user-123',
      worldId,
      title,
      description,
      inviteCode: code,
      role: 'dm',
    };

    if (isSupabaseConfigured() && userId) {
      const insertPayload: any = { dm_id: userId, title, description, invite_code: code };
      if (worldId && !worldId.startsWith('world-')) insertPayload.world_id = worldId;

      const { data } = await supabase.from('campaigns').insert(insertPayload).select().single();
      if (data) newCamp.id = data.id;
    }

    return newCamp;
  },

  async fetchCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    if (isSupabaseConfigured() && !campaignId.startsWith('camp-')) {
      const { data, error } = await supabase.from('campaign_members').select('*').eq('campaign_id', campaignId);
      if (!error && data) {
        return data.map((m: any) => ({
          id: m.id,
          campaignId: m.campaign_id,
          userId: m.user_id,
          characterName: m.character_name,
          role: m.role,
          joinedAt: m.joined_at,
          modelUrl: m.model_url,
        }));
      }
    }
    try {
      const saved = localStorage.getItem('codex_members');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async fetchFeedEvents(campaignId: string): Promise<CampaignFeedEvent[]> {
    if (isSupabaseConfigured() && !campaignId.startsWith('camp-')) {
      const { data, error } = await supabase
        .from('campaign_feed_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((e: any) => ({
          id: e.id,
          campaignId: e.campaign_id,
          sessionId: e.session_id,
          eventType: e.event_type,
          title: e.title,
          summary: e.summary,
          details: e.details,
          isPublic: e.is_public,
          createdAt: e.created_at,
        }));
      }
    }
    try {
      const saved = localStorage.getItem('codex_feed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async createFeedEvent(eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent> {
    const newEvent: CampaignFeedEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };

    if (isSupabaseConfigured() && newEvent.campaignId && !newEvent.campaignId.startsWith('camp-')) {
      const { data } = await supabase.from('campaign_feed_events').insert({
        campaign_id: newEvent.campaignId,
        session_id: newEvent.sessionId,
        event_type: newEvent.eventType,
        title: newEvent.title,
        summary: newEvent.summary,
        details: newEvent.details,
        is_public: newEvent.isPublic ?? true,
      }).select().single();

      if (data) newEvent.id = data.id;
    }

    return newEvent;
  },
};
