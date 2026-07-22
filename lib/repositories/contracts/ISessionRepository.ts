import { GameSession, GameScene } from '@/lib/types';

export interface ISessionRepository {
  fetchSessions(campaignId: string): Promise<GameSession[]>;
  createSession(title: string, campaignId?: string, sessionNumber?: number, notes?: string): Promise<GameSession>;
  updateSession(session: GameSession): Promise<void>;
  fetchScenes(sessionId: string): Promise<GameScene[]>;
  createScene(scene: Omit<GameScene, 'id'>): Promise<GameScene>;
  updateScene(scene: GameScene): Promise<void>;
  deleteScene(id: string): Promise<void>;
}
