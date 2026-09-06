import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveTokenAvatar, normalizeTokenName } from '../utils/tokenAvatarResolver';
import { Combatant, WorldEntity } from '../types';

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

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(global, 'window', { value: { localStorage: localStorageMock }, writable: true });

describe('tokenAvatarResolver', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('normalizeTokenName', () => {
    it('normalizes names by removing tags, numbers, and trim/lowercasing', () => {
      expect(normalizeTokenName('Karynna (PC)')).toBe('karynna');
      expect(normalizeTokenName('Karynna #1')).toBe('karynna');
      expect(normalizeTokenName('  Goblin (Monstro)  ')).toBe('goblin');
      expect(normalizeTokenName('Eldrin the Mage')).toBe('eldrin the mage');
    });
  });

  describe('resolveTokenAvatar', () => {
    it('returns direct combatant avatarUrl/tokenImageUrl if present', () => {
      const combatant: Combatant = {
        id: 'c-1',
        name: 'Karynna',
        type: 'player',
        hp: 20,
        maxHp: 20,
        ac: 15,
        initiative: 12,
        conditions: [],
        avatarUrl: 'https://images.example.com/karynna-face.jpg',
      };

      const result = resolveTokenAvatar('Karynna', combatant);
      expect(result).toBe('https://images.example.com/karynna-face.jpg');
    });

    it('resolves avatar from customSheets array or options', () => {
      const customSheets = [
        {
          characterName: 'Karynna',
          faceImageUrl: 'https://images.example.com/karynna-portrait.png',
        },
      ];

      const result = resolveTokenAvatar('Karynna', null, { customSheets });
      expect(result).toBe('https://images.example.com/karynna-portrait.png');
    });

    it('resolves avatar from localStorage character sheets (masters_codex_character_sheets_v1)', () => {
      const sheets = [
        {
          characterName: 'Karynna',
          avatarUrl: 'https://images.example.com/karynna-local.webp',
        },
      ];
      localStorage.setItem('masters_codex_character_sheets_v1', JSON.stringify(sheets));

      const result = resolveTokenAvatar('Karynna', null);
      expect(result).toBe('https://images.example.com/karynna-local.webp');
    });

    it('resolves avatar from active campaign partyMembers in localStorage', () => {
      const activeCampaign = {
        id: 'camp-1',
        title: 'Campaign 1',
        partyMembers: [
          {
            id: 'pm-1',
            name: 'Karynna',
            avatarUrl: 'https://images.example.com/karynna-party.png',
          },
        ],
      };
      localStorage.setItem('masters_codex_active_campaign', JSON.stringify(activeCampaign));

      const result = resolveTokenAvatar('Karynna', null);
      expect(result).toBe('https://images.example.com/karynna-party.png');
    });

    it('resolves avatar from world entities / NPCs', () => {
      const worldEntities: WorldEntity[] = [
        {
          id: 'ent-1',
          name: 'Balasar',
          type: 'character',
          worldId: 'world-1',
          category: 'npc',
          images: ['https://images.example.com/balasar-face.png'],
          attributes: {},
        } as any,
      ];
      localStorage.setItem('codex_world_entities', JSON.stringify(worldEntities));

      const result = resolveTokenAvatar('Balasar', null);
      expect(result).toBe('https://images.example.com/balasar-face.png');
    });

    it('resolves avatar from SRD monsters if not found elsewhere', () => {
      const result = resolveTokenAvatar('Aboleth', null);
      expect(result).toBe('/assets/2d/Monstros/Aboleth.png');
    });

    it('returns null if token cannot be found in any source', () => {
      const result = resolveTokenAvatar('Unknown Creature XYZ', null);
      expect(result).toBeNull();
    });
  });
});
