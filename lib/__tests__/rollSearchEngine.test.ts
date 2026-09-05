import { describe, it, expect } from 'vitest';
import { unifyLogEntries, filterLogEntries, parseSearchDSL, normalizeTimestampString } from '../utils/rollSearchEngine';
import { CombatLogEntry, ChatMessage } from '../types';

describe('rollSearchEngine - Unify and Search', () => {
  it('should normalize different timestamp formats gracefully', () => {
    expect(normalizeTimestampString(undefined)).toBe('');
    expect(normalizeTimestampString(null)).toBe('');
    expect(normalizeTimestampString('12:30:00')).toBe('12:30:00');
    expect(typeof normalizeTimestampString(1725574800000)).toBe('string');
    expect(normalizeTimestampString(new Date())).toMatch(/:/);
  });

  it('should unify and sort log entries without errors when timestamps are varied or missing', () => {
    const mockLogs: any[] = [
      { id: '1', timestamp: 1725574800000, description: 'Ataque de espada', actorName: 'Guerreiro', eventType: 'attack' },
      { id: '2', timestamp: undefined, description: 'Cura simples', actorName: 'Clérigo', eventType: 'heal' },
      { id: '3', timestamp: '14:00:00', description: 'Dano de fogo', actorName: 'Mago', eventType: 'damage' },
    ];

    const mockMessages: any[] = [
      { id: 'm1', senderName: 'Bardo', content: '/roll 1d20+5', timestamp: null, rollResult: { formula: '1d20+5', rolls: [15], total: 20 } },
      { id: 'm2', senderName: 'DM', content: 'Iniciando o combate', timestamp: '13:59:00' },
    ];

    const unified = unifyLogEntries(mockLogs, mockMessages);
    expect(unified).toBeDefined();
    expect(unified.length).toBe(5);
    expect(unified.every((u) => typeof u.timestamp === 'string')).toBe(true);
  });

  it('should parse search DSL tokens correctly', () => {
    const query = 'actor:Lilith target:Goblin nat20 min:15 dano';
    const parsed = parseSearchDSL(query);

    expect(parsed.actor).toBe('lilith');
    expect(parsed.target).toBe('goblin');
    expect(parsed.isCrit).toBe(true);
    expect(parsed.minTotal).toBe(15);
    expect(parsed.freeText).toBe('dano');
  });

  it('should filter unified entries based on tags and search queries', () => {
    const logs: CombatLogEntry[] = [
      {
        id: '1',
        timestamp: '10:00:00',
        round: 1,
        actorId: 'a1',
        actorName: 'Aelar',
        eventType: 'attack',
        description: 'Aelar acerta com 1d8+3',
        totalRoll: 18,
        isHit: true,
        isCrit: false,
      },
      {
        id: '2',
        timestamp: '10:01:00',
        round: 1,
        actorId: 'a2',
        actorName: 'Orc Chefe',
        eventType: 'damage',
        description: 'Orc sofre 8 de dano',
        totalRoll: 8,
      },
    ];

    const unified = unifyLogEntries(logs, []);
    const filtered = filterLogEntries(unified, {
      searchQuery: 'Aelar',
      activeTag: 'all',
      selectedActor: 'all',
      isDm: true,
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].actorName).toBe('Aelar');
  });
});
