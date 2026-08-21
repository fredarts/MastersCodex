import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageCampaignRepository } from '../repositories/offline/LocalStorageCampaignRepository';
import { UserCampaign } from '../types';

describe('LocalStorageCampaignRepository', () => {
  let repo: LocalStorageCampaignRepository;

  // Mock global localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      clear: () => { store = {}; },
      removeItem: (key: string) => { delete store[key]; }
    };
  })();
  Object.defineProperty(global, 'localStorage', { value: localStorageMock });

  beforeEach(() => {
    repo = new LocalStorageCampaignRepository();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve retornar campanhas vazias se não houver no localstorage', async () => {
    const list = await repo.fetchUserCampaigns('u-1');
    expect(list).toEqual([]);
  });

  it('deve salvar e retornar a campanha corretamente', async () => {
    const saved = await repo.createCampaign('Campanha Local', 'w-1', 'Teste', 'dm-1');
    expect(saved.title).toBe('Campanha Local');
    expect(saved.dmId).toBe('dm-1');
    expect(saved.worldId).toBe('w-1');

    const list = await repo.fetchUserCampaigns('dm-1');
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(saved.id);
    expect(list[0].role).toBe('dm');
  });

  it('deve retornar campanha com role player ao entrar via código', async () => {
    const created = await repo.createCampaign('Mesa Épica', 'w-1', 'Desc', 'dm-1');
    
    // Jogador entra com o código de convite
    const joinResult = await repo.joinCampaignByCode(created.inviteCode!, 'player-1', 'Valeros');
    expect(joinResult).not.toBeNull();
    expect(joinResult?.campaign.role).toBe('player');
    expect(joinResult?.campaign.characterName).toBe('Valeros');

    // Busca de campanhas para o jogador deve retornar apenas a campanha com role player
    const playerCamps = await repo.fetchUserCampaigns('player-1');
    expect(playerCamps.length).toBe(1);
    expect(playerCamps[0].id).toBe(created.id);
    expect(playerCamps[0].role).toBe('player');
    expect(playerCamps[0].characterName).toBe('Valeros');

    // Para o DM que não entrou com código como jogador, deve retornar apenas com role dm
    const dmCamps = await repo.fetchUserCampaigns('dm-1');
    expect(dmCamps.length).toBe(1);
    expect(dmCamps[0].id).toBe(created.id);
    expect(dmCamps[0].role).toBe('dm');
  });
});
