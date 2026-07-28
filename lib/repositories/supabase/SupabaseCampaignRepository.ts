import { supabase, isValidUuid } from '@/lib/supabase';
import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';
import { CampaignRow, CampaignMemberRow, CampaignFeedEventRow } from '@/lib/database.types';
import { mapCampaignRowToDomain, mapCampaignMemberRowToDomain, mapFeedEventRowToDomain } from '@/lib/mappers';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { ICampaignRepository } from '../contracts/ICampaignRepository';

export class SupabaseCampaignRepository implements ICampaignRepository {
  async fetchUserCampaigns(userId?: string): Promise<UserCampaign[]> {
    if (!userId || !isValidUuid(userId)) return [];

    const { data: dmCamps, error: dmErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('dm_id', userId);

    const { data: memCamps, error: memErr } = await supabase
      .from('campaign_members')
      .select('campaign_id, role, character_name, campaigns(*)')
      .eq('user_id', userId);

    if (dmErr) throw dmErr;
    if (memErr) throw memErr;

    let allCamps: UserCampaign[] = [];
    if (dmCamps) {
      allCamps = (dmCamps as CampaignRow[]).map((c) => mapCampaignRowToDomain(c, 'dm'));
    }

    if (memCamps) {
      memCamps.forEach((m: Record<string, any>) => {
        if (m.campaigns && !allCamps.some((c) => c.id === m.campaigns.id)) {
          allCamps.push(mapCampaignRowToDomain(m.campaigns as CampaignRow, m.role || 'player', m.character_name));
        }
      });
    }

    return allCamps;
  }

  async createCampaign(title: string, worldId?: string, description = '', userId?: string): Promise<UserCampaign> {
    if (!userId || !isValidUuid(userId)) {
      throw new Error('User ID inválido para persistência no Supabase.');
    }

    const code = `${title.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const insertPayload: Record<string, any> = { dm_id: userId, title, description, invite_code: code };
    if (worldId && isValidUuid(worldId)) insertPayload.world_id = worldId;

    const { data, error } = await supabase
      .from('campaigns')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return mapCampaignRowToDomain(data as CampaignRow, 'dm');
  }

  async fetchCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    if (!isValidUuid(campaignId)) return [];

    const { data, error } = await supabase
      .from('campaign_members')
      .select('*')
      .eq('campaign_id', campaignId);

    if (error) throw error;
    return (data as CampaignMemberRow[]).map(mapCampaignMemberRowToDomain);
  }

  async fetchFeedEvents(campaignId: string): Promise<CampaignFeedEvent[]> {
    if (!isValidUuid(campaignId)) return [];

    const { data, error } = await supabase
      .from('campaign_feed_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as CampaignFeedEventRow[]).map(mapFeedEventRowToDomain);
  }

  async createFeedEvent(eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent> {
    const { data, error } = await supabase
      .from('campaign_feed_events')
      .insert({
        campaign_id: eventData.campaignId,
        session_id: isValidUuid(eventData.sessionId) ? eventData.sessionId : null,
        event_type: eventData.eventType,
        title: eventData.title,
        summary: eventData.summary,
        details: eventData.details,
        is_public: eventData.isPublic ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return mapFeedEventRowToDomain(data as CampaignFeedEventRow);
  }

  async removeCampaignMember(memberId: string): Promise<boolean> {
    if (!isValidUuid(memberId)) return false;

    const { error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    return true;
  }

  async joinCampaignByCode(code: string, userId: string, characterName?: string): Promise<{ campaign: UserCampaign; member?: CampaignMember } | null> {
    if (!isValidUuid(userId)) return null;

    const { data: campData, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('invite_code', code.trim().toUpperCase())
      .single();

    if (campErr || !campData) return null;

    const campaign = mapCampaignRowToDomain(campData as CampaignRow, 'player', characterName);

    let member: CampaignMember | undefined;
    if (characterName) {
      const { data: existingMembers } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('user_id', userId);

      const existingMember = existingMembers && existingMembers.length > 0 ? existingMembers[0] : null;

      if (existingMember) {
        const { data: memData, error: memErr } = await supabase
          .from('campaign_members')
          .update({
            character_name: characterName,
            role: 'player',
          })
          .eq('id', existingMember.id)
          .select()
          .single();

        if (memErr) throw memErr;
        member = mapCampaignMemberRowToDomain(memData as CampaignMemberRow);
      } else {
        const { data: memData, error: memErr } = await supabase
          .from('campaign_members')
          .insert({
            campaign_id: campaign.id,
            user_id: userId,
            character_name: characterName,
            role: 'player',
          })
          .select()
          .single();

        if (memErr) {
          const { data: fallbackMem } = await supabase
            .from('campaign_members')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('user_id', userId)
            .maybeSingle();

          if (fallbackMem) {
            member = mapCampaignMemberRowToDomain(fallbackMem as CampaignMemberRow);
          } else {
            throw memErr;
          }
        } else {
          member = mapCampaignMemberRowToDomain(memData as CampaignMemberRow);
        }
      }
    }

    return { campaign, member };
  }

  async updateCampaign(campaign: UserCampaign): Promise<UserCampaign> {
    if (!isValidUuid(campaign.id)) {
      throw new Error('ID de campanha inválido.');
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        title: campaign.title,
        description: campaign.description,
        world_id: isValidUuid(campaign.worldId) ? campaign.worldId : null,
      })
      .eq('id', campaign.id)
      .select()
      .single();

    if (error) throw error;
    return mapCampaignRowToDomain(data as CampaignRow, campaign.role || 'dm');
  }

  async addCampaignMember(
    campaignId: string,
    characterName: string,
    role: 'dm' | 'player' = 'player',
    userId?: string
  ): Promise<CampaignMember> {
    if (!isValidUuid(campaignId)) {
      throw new Error('ID de campanha inválido.');
    }

    const targetUserId = userId || (role === 'player' ? `manual-player-${Date.now()}` : 'demo-dm-user-123');

    const { data: existing } = await supabase
      .from('campaign_members')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('character_name', characterName)
      .maybeSingle();

    if (existing) {
      const { data: updated, error: updateErr } = await supabase
        .from('campaign_members')
        .update({ role, model_url: getModelUrlByNameOrPath(characterName) })
        .eq('id', existing.id)
        .select()
        .single();
      if (!updateErr && updated) {
        return mapCampaignMemberRowToDomain(updated as CampaignMemberRow);
      }
      return mapCampaignMemberRowToDomain(existing as CampaignMemberRow);
    }

    const { data, error } = await supabase
      .from('campaign_members')
      .insert({
        campaign_id: campaignId,
        user_id: targetUserId,
        character_name: characterName,
        role,
      })
      .select()
      .single();

    if (error) throw error;
    return mapCampaignMemberRowToDomain(data as CampaignMemberRow);
  }

  async updateCampaignMemberModelUrl(
    campaignId: string,
    characterName: string,
    modelUrl: string,
    userId?: string
  ): Promise<boolean> {
    if (!isValidUuid(campaignId)) return false;

    let query = supabase
      .from('campaign_members')
      .update({ model_url: modelUrl })
      .eq('campaign_id', campaignId)
      .ilike('character_name', characterName);

    if (userId && isValidUuid(userId)) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }

  async leaveCampaign(campaignId: string, userId: string): Promise<boolean> {
    if (!isValidUuid(campaignId) || !isValidUuid(userId)) return false;

    const { error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  async toggleFeedEventVisibility(id: string): Promise<boolean> {
    if (!isValidUuid(id)) return false;

    const { data: current, error: fetchErr } = await supabase
      .from('campaign_feed_events')
      .select('is_public')
      .eq('id', id)
      .single();

    if (fetchErr || !current) throw fetchErr || new Error('Evento não encontrado');

    const { error } = await supabase
      .from('campaign_feed_events')
      .update({ is_public: !current.is_public })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async deleteFeedEvent(id: string): Promise<boolean> {
    if (!isValidUuid(id)) return false;

    const { error } = await supabase
      .from('campaign_feed_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

