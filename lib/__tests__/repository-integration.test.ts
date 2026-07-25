import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageCampaignRepository } from '../repositories/offline/LocalStorageCampaignRepository';
import { LocalStorageSessionRepository } from '../repositories/offline/LocalStorageSessionRepository';
import { LocalStorageWorldRepository } from '../repositories/offline/LocalStorageWorldRepository';
import { campaignService } from '../services/campaignService';
import { sessionService } from '../services/sessionService';

describe('Repository & Service Integration Suite (Offline / Fallback Layer)', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Campaign Repository & Service Integration', () => {
    it('should create and fetch a campaign correctly', async () => {
      const repo = new LocalStorageCampaignRepository();
      const newCamp = await repo.createCampaign('Vale do Dragão', 'world-1', 'Campanha de teste', 'user-test-1');

      expect(newCamp.title).toBe('Vale do Dragão');
      expect(newCamp.dmId).toBe('user-test-1');
      expect(newCamp.inviteCode).toBeDefined();

      const fetched = await repo.fetchUserCampaigns('user-test-1');
      expect(fetched.length).toBe(1);
      expect(fetched[0].id).toBe(newCamp.id);
    });

    it('should manage campaign members through campaignService', async () => {
      const addRes = await campaignService.addCampaignMember('camp-1', 'Garrick', 'player', 'user-2');
      expect(addRes.ok).toBe(true);
      if (addRes.ok) {
        expect(addRes.value.characterName).toBe('Garrick');
        expect(addRes.value.role).toBe('player');
      }

      const fetchRes = await campaignService.fetchCampaignMembers('camp-1');
      expect(fetchRes.ok).toBe(true);
      if (fetchRes.ok) {
        expect(fetchRes.value.length).toBe(1);
      }

      const removeRes = await campaignService.removeCampaignMember(addRes.ok ? addRes.value.id : '');
      expect(removeRes.ok).toBe(true);
    });

    it('should update campaign details correctly', async () => {
      const createRes = await campaignService.createCampaign('Campanha Antiga', undefined, 'Desc', 'user-1');
      expect(createRes.ok).toBe(true);
      if (createRes.ok) {
        const updated = { ...createRes.value, title: 'Campanha Nova' };
        const updateRes = await campaignService.updateCampaign(updated);
        expect(updateRes.ok).toBe(true);
        if (updateRes.ok) {
          expect(updateRes.value.title).toBe('Campanha Nova');
        }
      }
    });
  });

  describe('Session & Scene Repository Integration', () => {
    it('should create and fetch sessions and scenes correctly', async () => {
      const repo = new LocalStorageSessionRepository();
      const session = await repo.createSession('Sessão 1: O Começo', 'camp-1', 1, 'Notas iniciais');

      expect(session.title).toBe('Sessão 1: O Começo');
      expect(session.sessionNumber).toBe(1);

      const fetchedSessions = await repo.fetchSessions('camp-1');
      expect(fetchedSessions.length).toBe(1);

      const scene = await repo.createScene({
        sessionId: session.id,
        title: 'Cena da Taverna',
        type: 'exploration',
        orderIndex: 1,
      });

      expect(scene.title).toBe('Cena da Taverna');

      const fetchedScenes = await repo.fetchScenes(session.id);
      expect(fetchedScenes.length).toBe(1);
    });
  });

  describe('World Repository Integration', () => {
    it('should create and fetch worlds and lore entities', async () => {
      const repo = new LocalStorageWorldRepository();
      const world = await repo.createWorld('Faerûn Reduzida', 'Fantasia Medieval', 'Mundo de alta magia', 'user-1');

      expect(world.title).toBe('Faerûn Reduzida');

      const entity = await repo.createWorldEntity({
        worldId: world.id,
        name: 'Torre do Mago',
        category: 'location',
        summary: 'Uma antiga torre de pedra',
      });

      expect(entity.name).toBe('Torre do Mago');

      const entities = await repo.fetchWorldEntities(world.id);
      expect(entities.length).toBe(1);
    });
  });
});
