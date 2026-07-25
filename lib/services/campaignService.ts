import { RepositoryFactory } from '@/lib/repositories/RepositoryFactory';
import { UserCampaign, CampaignMember, CampaignFeedEvent, Result } from '@/lib/types';

export const campaignService = {
  async fetchUserCampaigns(userId?: string): Promise<Result<UserCampaign[]>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const data = await repo.fetchUserCampaigns(userId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar campanhas.'),
      };
    }
  },

  async createCampaign(title: string, worldId?: string, description = '', userId?: string): Promise<Result<UserCampaign>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const data = await repo.createCampaign(title, worldId, description, userId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar campanha.'),
      };
    }
  },

  async fetchCampaignMembers(campaignId: string, userId?: string): Promise<Result<CampaignMember[]>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const data = await repo.fetchCampaignMembers(campaignId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar membros da campanha.'),
      };
    }
  },

  async fetchFeedEvents(campaignId: string, userId?: string): Promise<Result<CampaignFeedEvent[]>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const data = await repo.fetchFeedEvents(campaignId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar eventos do feed.'),
      };
    }
  },

  async createFeedEvent(eventData: Omit<CampaignFeedEvent, 'id'>, userId?: string): Promise<Result<CampaignFeedEvent>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const data = await repo.createFeedEvent(eventData);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao registrar evento no feed.'),
      };
    }
  },

  async removeCampaignMember(memberId: string, userId?: string): Promise<Result<boolean>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const success = await repo.removeCampaignMember(memberId);
      return { ok: true, value: success };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao remover membro da campanha.'),
      };
    }
  },

  async joinCampaignByCode(code: string, userId: string, characterName?: string): Promise<Result<{ campaign: UserCampaign; member?: CampaignMember } | null>> {
    try {
      const repo = RepositoryFactory.getCampaignRepository(userId);
      const result = await repo.joinCampaignByCode(code, userId, characterName);
      return { ok: true, value: result };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao tentar entrar na campanha.'),
      };
    }
  },
};
