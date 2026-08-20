import { GameSession, GameScene, CampaignMap } from '@/lib/types';
import { ISessionRepository } from '../contracts/ISessionRepository';

export class LocalStorageSessionRepository implements ISessionRepository {
  async fetchSessions(campaignId: string): Promise<GameSession[]> {
    try {
      const saved = localStorage.getItem('codex_sessions');
      const all: GameSession[] = saved ? JSON.parse(saved) : [];
      return all.filter((s) => s.campaignId === campaignId);
    } catch (_e) {
      return [];
    }
  }

  async createSession(title: string, campaignId = 'camp-demo-1', sessionNumber = 1, notes = ''): Promise<GameSession> {
    const newSession: GameSession = {
      id: `sess-${Date.now()}`,
      campaignId,
      sessionNumber,
      title,
      notes,
    };

    try {
      const saved = localStorage.getItem('codex_sessions');
      const all: GameSession[] = saved ? JSON.parse(saved) : [];
      all.push(newSession);
      localStorage.setItem('codex_sessions', JSON.stringify(all));
    } catch (_e) {}

    return newSession;
  }

  async updateSession(session: GameSession): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_sessions');
      const sessions: GameSession[] = saved ? JSON.parse(saved) : [];
      const idx = sessions.findIndex((s) => s.id === session.id);
      if (idx !== -1) {
        sessions[idx] = session;
        localStorage.setItem('codex_sessions', JSON.stringify(sessions));
      }
    } catch (_e) {}
  }

  async fetchScenes(sessionId: string): Promise<GameScene[]> {
    try {
      const saved = localStorage.getItem('codex_scenes');
      const all: GameScene[] = saved ? JSON.parse(saved) : [];
      return all.filter((s) => s.sessionId === sessionId);
    } catch (_e) {
      return [];
    }
  }

  async createScene(sceneData: Omit<GameScene, 'id'>): Promise<GameScene> {
    const newScene: GameScene = {
      ...sceneData,
      id: `sc-${Date.now()}`,
    };

    try {
      const saved = localStorage.getItem('codex_scenes');
      const all: GameScene[] = saved ? JSON.parse(saved) : [];
      all.push(newScene);
      localStorage.setItem('codex_scenes', JSON.stringify(all));
    } catch (_e) {}

    return newScene;
  }

  async updateScene(scene: GameScene): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_scenes');
      const all: GameScene[] = saved ? JSON.parse(saved) : [];
      const idx = all.findIndex((s) => s.id === scene.id);
      if (idx !== -1) {
        all[idx] = scene;
        localStorage.setItem('codex_scenes', JSON.stringify(all));
      }
    } catch (_e) {}
  }

  async deleteScene(id: string): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_scenes');
      const all: GameScene[] = saved ? JSON.parse(saved) : [];
      const filtered = all.filter((s) => s.id !== id);
      localStorage.setItem('codex_scenes', JSON.stringify(filtered));
    } catch (_e) {}
  }

  async fetchSceneMap(sceneId: string): Promise<any | null> {
    try {
      const saved = localStorage.getItem('codex_scene_maps');
      if (!saved) return null;
      const maps = JSON.parse(saved);
      return maps[sceneId] || null;
    } catch (_e) {
      return null;
    }
  }

  async saveSceneMap(sceneId: string, gridData: any): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_scene_maps');
      const maps = saved ? JSON.parse(saved) : {};
      maps[sceneId] = gridData;
      localStorage.setItem('codex_scene_maps', JSON.stringify(maps));
    } catch (_e) {}
  }

  async fetchCampaignMaps(campaignId: string): Promise<CampaignMap[]> {
    try {
      const saved = localStorage.getItem('codex_campaign_maps');
      const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
      return all.filter(m => m.campaignId === campaignId);
    } catch (_e) {
      return [];
    }
  }

  async createCampaignMap(campaignId: string, title: string, gridData: any): Promise<CampaignMap> {
    const newMap: CampaignMap = {
      id: `map-${Date.now()}`,
      campaignId,
      title,
      gridData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    try {
      const saved = localStorage.getItem('codex_campaign_maps');
      const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
      all.push(newMap);
      localStorage.setItem('codex_campaign_maps', JSON.stringify(all));
    } catch (_e) {}
    return newMap;
  }

  async updateCampaignMap(mapId: string, title: string, gridData: any): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_campaign_maps');
      const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
      const idx = all.findIndex(m => m.id === mapId);
      if (idx !== -1) {
        all[idx] = {
          ...all[idx],
          title,
          gridData,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('codex_campaign_maps', JSON.stringify(all));
      }
    } catch (_e) {}
  }

  async deleteCampaignMap(mapId: string): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_campaign_maps');
      const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
      const filtered = all.filter(m => m.id !== mapId);
      localStorage.setItem('codex_campaign_maps', JSON.stringify(filtered));
    } catch (_e) {}
  }
}
