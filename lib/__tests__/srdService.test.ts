/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { srdService } from '../services/srdService';
import * as supabaseModule from '../supabase';

// Mock Supabase
vi.mock('../supabase', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: vi.fn(),
  };

  // Allow promise-like chaining
  (mockQuery as any).then = (onfulfilled: any) => {
    return Promise.resolve({ data: [], error: null }).then(onfulfilled);
  };

  return {
    supabase: {
      from: vi.fn(() => mockQuery),
    },
    isSupabaseConfigured: vi.fn(() => false),
  };
});

describe('SRD Compendium Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Offline Fallback Mode', () => {
    beforeEach(() => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);
    });

    it('deve buscar monstros locais com busca textual de nome', async () => {
      const results = await srdService.fetchMonsters({ searchQuery: 'Goblin' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('Goblin');
    });

    it('deve filtrar monstros por nível de desafio (CR)', async () => {
      const results = await srdService.fetchMonsters({ cr: '1/4' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((m) => {
        expect(m.cr).toBe('1/4');
      });
    });

    it('deve buscar magias locais por nível e escola', async () => {
      const results = await srdService.fetchSpells({ level: 1, school: 'Abjuração' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((s) => {
        expect(s.level).toBe(1);
        expect(s.school).toBe('Abjuração');
      });
    });

    it('deve filtrar itens locais por raridade', async () => {
      const results = await srdService.fetchItems({ rarity: 'Rara' });
      expect(results.length).toBeGreaterThan(0);
      results.forEach((i) => {
        expect(i.rarity.toLowerCase()).toBe('rara');
      });
    });
  });

  describe('Online Supabase Mode', () => {
    beforeEach(() => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
    });

    it('deve chamar query correta no banco para monstros', async () => {
      const mockMonsters = [
        { id: 'm-1', name: 'Beholder', cr: '13', hp: 180, type: 'Aberration' }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled) => Promise.resolve({ data: mockMonsters, error: null }).then(onfulfilled)),
      };

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockQuery as any);

      const results = await srdService.fetchMonsters({ searchQuery: 'Beholder', cr: '13', page: 2, limit: 10 });
      
      expect(supabaseModule.supabase.from).toHaveBeenCalledWith('srd_monsters');
      expect(mockQuery.textSearch).toHaveBeenCalledWith('fts', 'Beholder');
      expect(mockQuery.eq).toHaveBeenCalledWith('cr', '13');
      // page 2 com limit 10 -> range(10, 19)
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Beholder');
    });

    it('deve chamar query correta no banco para magias', async () => {
      const mockSpells = [
        { id: 's-1', name: 'Fireball', level: 3, school: 'Evocation' }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        textSearch: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled) => Promise.resolve({ data: mockSpells, error: null }).then(onfulfilled)),
      };

      vi.spyOn(supabaseModule.supabase, 'from').mockReturnValue(mockQuery as any);

      const results = await srdService.fetchSpells({ searchQuery: 'Fireball', level: 3, school: 'Evocation', page: 1, limit: 5 });
      
      expect(supabaseModule.supabase.from).toHaveBeenCalledWith('srd_spells');
      expect(mockQuery.textSearch).toHaveBeenCalledWith('fts', 'Fireball');
      expect(mockQuery.eq).toHaveBeenCalledWith('level', 3);
      expect(mockQuery.eq).toHaveBeenCalledWith('school', 'Evocation');
      expect(mockQuery.range).toHaveBeenCalledWith(0, 4);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Fireball');
    });
  });
});
