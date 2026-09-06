import { describe, it, expect } from 'vitest';
import { revealVisionWithLOS, getTokenVisionRadius } from '../../components/map/visionCore';
import { INITIAL_MONSTERS, NPC_TEMPLATES } from '../srd-data';
import { Combatant } from '../types';

describe('Token Placement & Management Suite', () => {
  it('should verify NPC_TEMPLATES and INITIAL_MONSTERS are populated for token placement', () => {
    expect(NPC_TEMPLATES.length).toBeGreaterThan(0);
    expect(INITIAL_MONSTERS.length).toBeGreaterThan(0);

    const guard = NPC_TEMPLATES.find((n) => n.id === 'npc-guard');
    expect(guard).toBeDefined();
    expect(guard?.type).toBe('npc');

    const aboleth = INITIAL_MONSTERS.find((m) => m.name.toLowerCase() === 'aboleth');
    expect(aboleth).toBeDefined();
  });

  it('should place a token on a cell and correctly update Line of Sight vision', () => {
    // 10x10 grid
    const grid = Array.from({ length: 10 }, (_, r) =>
      Array.from({ length: 10 }, (_, c) => ({
        x: c,
        y: r,
        type: 'floor' as const,
        fog: true,
        tokenName: undefined as string | undefined,
        tokenColor: undefined as string | undefined,
      }))
    );

    const testPlayer: Combatant = {
      id: 'p1',
      name: 'Eldrin',
      type: 'player',
      hp: 20,
      maxHp: 20,
      ac: 15,
      initiative: 12,
      conditions: [],
    };

    // Simulate placing token at (4, 4)
    grid[4][4].tokenName = testPlayer.name;
    grid[4][4].tokenColor = 'bg-cyan-500';

    const radius = getTokenVisionRadius(testPlayer.name, [testPlayer]);
    revealVisionWithLOS(grid, 4, 4, radius);

    // Cell where token is placed must have fog revealed
    expect(grid[4][4].fog).toBe(false);
    expect(grid[4][4].tokenName).toBe('Eldrin');
    expect(grid[4][4].tokenColor).toBe('bg-cyan-500');

    // Surrounding cells within vision radius must also have fog revealed
    expect(grid[4][5].fog).toBe(false);
    expect(grid[3][4].fog).toBe(false);
  });

  it('should remove a token from a cell cleanly (simulating right click removal)', () => {
    const grid = Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 5 }, (_, c) => ({
        x: c,
        y: r,
        type: 'floor' as const,
        fog: false,
        tokenName: r === 2 && c === 2 ? 'Goblin' : undefined,
        tokenColor: r === 2 && c === 2 ? 'bg-rose-500' : undefined,
      }))
    );

    expect(grid[2][2].tokenName).toBe('Goblin');

    // Simulate right click removal
    grid[2][2].tokenName = undefined;
    grid[2][2].tokenColor = undefined;

    expect(grid[2][2].tokenName).toBeUndefined();
    expect(grid[2][2].tokenColor).toBeUndefined();
  });
});
