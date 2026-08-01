import { RepositoryFactory } from '@/lib/repositories/RepositoryFactory';
import { GameSession, GameScene, CampaignMap, Result } from '@/lib/types';

export const sessionService = {
  async fetchSessions(campaignId: string): Promise<Result<GameSession[]>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId);
      const data = await repo.fetchSessions(campaignId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar sessões.'),
      };
    }
  },

  async createSession(title: string, campaignId = 'camp-demo-1', sessionNumber = 1, notes = ''): Promise<Result<GameSession>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId);
      const data = await repo.createSession(title, campaignId, sessionNumber, notes);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar sessão.'),
      };
    }
  },

  async updateSession(session: GameSession, campaignId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId || session.campaignId);
      await repo.updateSession(session);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao atualizar sessão.'),
      };
    }
  },

  async fetchScenes(sessionId: string, campaignIdOrUserId?: string): Promise<Result<GameScene[]>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignIdOrUserId);
      const data = await repo.fetchScenes(sessionId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar cenas.'),
      };
    }
  },

  async createScene(sceneData: Omit<GameScene, 'id'>, campaignIdOrUserId?: string): Promise<Result<GameScene>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignIdOrUserId);
      const data = await repo.createScene(sceneData);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar cena.'),
      };
    }
  },

  async updateScene(scene: GameScene, campaignIdOrUserId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignIdOrUserId);
      await repo.updateScene(scene);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao atualizar cena.'),
      };
    }
  },

  async deleteScene(id: string, campaignIdOrUserId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignIdOrUserId);
      await repo.deleteScene(id);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao remover cena.'),
      };
    }
  },

  async fetchSceneMap(sceneId: string, campaignIdOrUserId?: string): Promise<Result<any | null>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignIdOrUserId);
      const data = await repo.fetchSceneMap(sceneId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar mapa da cena.'),
      };
    }
  },

  async saveSceneMap(sceneId: string, gridData: any, campaignIdOrUserId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignIdOrUserId);
      await repo.saveSceneMap(sceneId, gridData);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao salvar mapa da cena.'),
      };
    }
  },

  async fetchCampaignMaps(campaignId: string): Promise<Result<CampaignMap[]>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId);
      const data = await repo.fetchCampaignMaps(campaignId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao buscar mapas da campanha.'),
      };
    }
  },

  async createCampaignMap(campaignId: string, title: string, gridData: any): Promise<Result<CampaignMap>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId);
      const data = await repo.createCampaignMap(campaignId, title, gridData);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar mapa da campanha.'),
      };
    }
  },

  async updateCampaignMap(mapId: string, title: string, gridData: any, campaignId: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId);
      await repo.updateCampaignMap(mapId, title, gridData);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao atualizar mapa da campanha.'),
      };
    }
  },

  async deleteCampaignMap(mapId: string, campaignId: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getSessionRepository(campaignId);
      await repo.deleteCampaignMap(mapId);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao deletar mapa da campanha.'),
      };
    }
  },
};
