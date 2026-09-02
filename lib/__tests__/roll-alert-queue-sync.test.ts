import { describe, it, expect } from 'vitest';
import { PlayerRollEvent, CombatLogEntry } from '../types';

describe('Player Rolls & Master Alert Queue Sync', () => {
  it('should correctly format attribute check log entry with player prefix and DC result', () => {
    const roll: PlayerRollEvent = {
      id: 'roll-str-1',
      characterName: 'Kirion',
      playerName: 'Fred',
      rollType: 'attribute',
      label: 'Teste de Força',
      d20Roll: 16,
      modifier: 3,
      total: 19,
      dc: 15,
      isSuccess: true,
      timestamp: '18:00',
    };

    const playerPrefix = roll.playerName ? `[${roll.playerName}] ` : '';
    const d20Val = roll.d20Roll1 ?? roll.d20Roll;
    const entry: CombatLogEntry = {
      id: roll.id,
      timestamp: roll.timestamp,
      round: 1,
      actorId: roll.characterName,
      actorName: roll.characterName,
      eventType: 'system',
      d20Roll: d20Val,
      totalRoll: roll.total,
      description: `${playerPrefix}${roll.characterName} rolou ${roll.label}${d20Val !== undefined ? `: d20(${d20Val}) ${roll.modifier >= 0 ? '+' : ''}${roll.modifier} = Total ${roll.total}` : ''}${roll.dc !== undefined ? ` (CD ${roll.dc}: ${roll.total >= roll.dc ? 'Passou' : 'Falhou'})` : ''}`,
    };

    expect(entry.description).toBe('[Fred] Kirion rolou Teste de Força: d20(16) +3 = Total 19 (CD 15: Passou)');
    expect(entry.totalRoll).toBe(19);
    expect(entry.d20Roll).toBe(16);
  });

  it('should handle alert queueing and progressive dismissal in FIFO order', () => {
    let queue: PlayerRollEvent[] = [];

    const roll1: PlayerRollEvent = {
      id: 'roll-1',
      characterName: 'Kirion',
      playerName: 'Fred',
      rollType: 'attribute',
      label: 'Teste de Força',
      d20Roll: 18,
      modifier: 3,
      total: 21,
      timestamp: '18:00',
    };

    const roll2: PlayerRollEvent = {
      id: 'roll-2',
      characterName: 'Lyra',
      playerName: 'Ana',
      rollType: 'skill',
      label: 'Perícia: Furtividade',
      d20Roll: 12,
      modifier: 5,
      total: 17,
      dc: 15,
      timestamp: '18:00',
    };

    // Queue both rolls
    queue = [...queue, roll1, roll2];
    expect(queue.length).toBe(2);
    expect(queue[0].characterName).toBe('Kirion');

    // Dismiss first alert
    queue = queue.slice(1);
    expect(queue.length).toBe(1);
    expect(queue[0].characterName).toBe('Lyra');
    expect(queue[0].label).toBe('Perícia: Furtividade');

    // Dismiss second alert
    queue = queue.slice(1);
    expect(queue.length).toBe(0);
  });
});
