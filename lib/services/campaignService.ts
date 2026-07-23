import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';
import { CampaignRow, CampaignMemberRow, CampaignFeedEventRow } from '@/lib/database.types';
import { mapCampaignRowToDomain, mapCampaignMemberRowToDomain, mapFeedEventRowToDomain } from '@/lib/mappers';
import { toast } from 'sonner';

export const campaignService = {
  async fetchUserCampaigns(userId?: string): Promise<UserCampaign[]> {
    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      const { data: dmCamps, error: dmErr } = await supabase.from('campaigns').select('*').eq('dm_id', userId);
      const { data: memCamps, error: memErr } = await supabase
        .from('campaign_members')
        .select('campaign_id, role, campaigns(*)')
        .eq('user_id', userId);

      if (dmErr || memErr) {
        toast.error(`Erro ao carregar campanhas: ${dmErr?.message || memErr?.message}`);
      }

      let allCamps: UserCampaign[] = [];
      if (dmCamps) {
        allCamps = (dmCamps as CampaignRow[]).map((c) => mapCampaignRowToDomain(c, 'dm'));
      }

      if (memCamps) {
        memCamps.forEach((m: Record<string, any>) => {
          if (m.campaigns && !allCamps.some((c) => c.id === m.campaigns.id)) {
            allCamps.push(mapCampaignRowToDomain(m.campaigns as CampaignRow, m.role || 'player'));
          }
        });
      }

      return allCamps;
    }

    try {
      const saved = localStorage.getItem('codex_campaigns');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao ler campanhas salvas localmente.');
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

    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      const insertPayload: Record<string, any> = { dm_id: userId, title, description, invite_code: code };
      if (worldId && isValidUuid(worldId)) insertPayload.world_id = worldId;

      const { data, error } = await supabase.from('campaigns').insert(insertPayload).select().single();
      if (error) {
        toast.error(`Erro ao criar campanha: ${error.message}`);
      } else if (data) {
        return mapCampaignRowToDomain(data as CampaignRow, 'dm');
      }
    }

    return newCamp;
  },

  async fetchCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      const { data, error } = await supabase.from('campaign_members').select('*').eq('campaign_id', campaignId);
      if (error) {
        toast.error(`Erro ao buscar membros da campanha: ${error.message}`);
      } else if (data) {
        return (data as CampaignMemberRow[]).map(mapCampaignMemberRowToDomain);
      }
    }
    try {
      const saved = localStorage.getItem('codex_members');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao ler membros salvos localmente.');
      return [];
    }
  },

  async fetchFeedEvents(campaignId: string): Promise<CampaignFeedEvent[]> {
    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      const { data, error } = await supabase
        .from('campaign_feed_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });
      if (error) {
        toast.error(`Erro ao buscar eventos do feed: ${error.message}`);
      } else if (data) {
        return (data as CampaignFeedEventRow[]).map(mapFeedEventRowToDomain);
      }
    }
    try {
      const saved = localStorage.getItem('codex_feed');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao ler feed salvo localmente.');
      return [];
    }
  },

  async createFeedEvent(eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent> {
    const newEvent: CampaignFeedEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };

    if (isSupabaseConfigured() && isValidUuid(newEvent.campaignId)) {
      const { data, error } = await supabase.from('campaign_feed_events').insert({
        campaign_id: newEvent.campaignId,
        session_id: isValidUuid(newEvent.sessionId) ? newEvent.sessionId : null,
        event_type: newEvent.eventType,
        title: newEvent.title,
        summary: newEvent.summary,
        details: newEvent.details,
        is_public: newEvent.isPublic ?? true,
      }).select().single();

      if (error) {
        toast.error(`Erro ao registrar evento no feed: ${error.message}`);
      } else if (data) {
        return mapFeedEventRowToDomain(data as CampaignFeedEventRow);
      }
    }

    return newEvent;
  },

  async removeCampaignMember(memberId: string): Promise<boolean> {
    if (isSupabaseConfigured() && isValidUuid(memberId)) {
      const { error } = await supabase.from('campaign_members').delete().eq('id', memberId);
      if (error) {
        toast.error(`Erro ao remover membro: ${error.message}`);
        return false;
      }
      return true;
    }
    return true;
  },

  async joinCampaignByCode(code: string, userId: string, characterName?: string): Promise<{ campaign: UserCampaign; member?: CampaignMember } | null> {
    if (isSupabaseConfigured() && isValidUuid(userId)) {
      // 1. Busca a campanha pelo código de convite no banco
      const { data: campData, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', code.trim().toUpperCase())
        .single();
        
      if (campErr || !campData) {
        return null;
      }
      
      const campaign = mapCampaignRowToDomain(campData as CampaignRow, 'player');
      
      // 2. Adiciona ou atualiza o membro na campanha se characterName for fornecido
      let member: CampaignMember | undefined;
      if (characterName) {
        // Tenta buscar se o usuário já é membro desta campanha para evitar erros 409 (Conflict)
        const { data: existingMembers } = await supabase
          .from('campaign_members')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('user_id', userId);

        const existingMember = existingMembers && existingMembers.length > 0 ? existingMembers[0] : null;

        if (existingMember) {
          // Se já existe registro, faz UPDATE sem violar restrição única
          const { data: memData, error: memErr } = await supabase
            .from('campaign_members')
            .update({
              character_name: characterName,
              role: 'player',
            })
            .eq('id', existingMember.id)
            .select()
            .single();

          if (!memErr && memData) {
            member = mapCampaignMemberRowToDomain(memData as CampaignMemberRow);
          } else {
            member = mapCampaignMemberRowToDomain(existingMember as CampaignMemberRow);
          }
        } else {
          // Se não existe registro prévio, faz INSERT
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

          if (!memErr && memData) {
            member = mapCampaignMemberRowToDomain(memData as CampaignMemberRow);
          } else if (memErr) {
            // Se houver conflito de concorrência, recupera o membro cadastrado como fallback
            const { data: fallbackMem } = await supabase
              .from('campaign_members')
              .select('*')
              .eq('campaign_id', campaign.id)
              .eq('user_id', userId)
              .maybeSingle();

            if (fallbackMem) {
              member = mapCampaignMemberRowToDomain(fallbackMem as CampaignMemberRow);
            } else {
              toast.error(`Erro ao registrar membro: ${memErr.message}`);
            }
          }
        }
      }
      
      return { campaign, member };
    }
    return null;
  },
};
