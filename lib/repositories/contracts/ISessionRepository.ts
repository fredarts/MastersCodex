import { GameSession, GameScene, CampaignMap } from '@/lib/types';

export interface ISessionRepository {
  fetchSessions(campaignId: string): Promise<GameSession[]>;
  createSession(title: string, campaignId?: string, sessionNumber?: number, notes?: string): Promise<GameSession>;
  updateSession(session: GameSession): Promise<void>;
  fetchScenes(sessionId: string): Promise<GameScene[]>;
  createScene(scene: Omit<GameScene, 'id'>): Promise<GameScene>;
  updateScene(scene: GameScene): Promise<void>;
  deleteScene(id: string): Promise<void>;
  fetchSceneMap(sceneId: string): Promise<any | null>;
  saveSceneMap(sceneId: string, gridData: any): Promise<void>;
  fetchCampaignMaps(campaignId: string): Promise<CampaignMap[]>;
  createCampaignMap(campaignId: string, title: string, gridData: any): Promise<CampaignMap>;
  updateCampaignMap(mapId: string, title: string, gridData: any): Promise<void>;
  deleteCampaignMap(mapId: string): Promise<void>;
}
