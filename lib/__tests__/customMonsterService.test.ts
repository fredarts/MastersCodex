import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customMonsterService } from '../services/customMonsterService';
import * as supabaseModule from '../supabase';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock }, writable: true });

vi.mock('../supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-123' } } }),
      },
    },
    isSupabaseConfigured: vi.fn(() => false),
  };
});

describe('customMonsterService Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deve salvar e carregar monstros via localStorage quando Supabase não estiver configurado', async () => {
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

    const created = await customMonsterService.saveCustomMonster({
      name: 'Dragão de Cristal Customizado',
      type: 'Dragão',
      size: 'Grande',
      alignment: 'Caótico e Bom',
      ac: 17,
      hp: 120,
      speed: '12m, voo 18m',
      cr: '8',
      xp: 3900,
      str: 18,
      dex: 14,
      con: 16,
      int: 12,
      wis: 14,
      cha: 16,
      tokenImageUrl: 'https://example.com/crystal-dragon.png',
      tokenType: 'billboard',
      description: 'Um dragão reluzente feito de cristais prismáticos.',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Dragão de Cristal Customizado');
    expect(created.tokenType).toBe('billboard');
    expect(created.tokenImageUrl).toBe('https://example.com/crystal-dragon.png');

    const loadedMonsters = await customMonsterService.fetchCustomMonsters();
    expect(loadedMonsters).toHaveLength(1);
    expect(loadedMonsters[0].name).toBe('Dragão de Cristal Customizado');
  });

  it('deve deletar monstro customizado', async () => {
    vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);

    const created = await customMonsterService.saveCustomMonster({
      name: 'Goblin Xamã Custom',
      type: 'Humanoide',
      size: 'Pequeno',
      alignment: 'Neutro e Mau',
      ac: 12,
      hp: 18,
      speed: '9m',
      cr: '1/2',
      xp: 100,
      str: 8,
      dex: 14,
      con: 10,
      int: 10,
      wis: 12,
      cha: 8,
      tokenType: '3d',
    });

    let monsters = await customMonsterService.fetchCustomMonsters();
    expect(monsters).toHaveLength(1);

    await customMonsterService.deleteCustomMonster(created.id);
    monsters = await customMonsterService.fetchCustomMonsters();
    expect(monsters).toHaveLength(0);
  });
});
