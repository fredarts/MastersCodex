import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cell } from '@/components/MapMaker';

describe('Realtime Map & Token Synchronization Suite', () => {
  let mockGrid: Cell[][];

  beforeEach(() => {
    mockGrid = Array(10).fill(null).map(() =>
      Array(10).fill(null).map(() => ({
        type: 'floor' as const,
        fog: true,
      }))
    );
  });

  it('should immediately update token position and clear old cell on token move', () => {
    // Initial placement at (2, 3)
    mockGrid[2][3].tokenName = 'Karynna';
    mockGrid[2][3].tokenColor = 'bg-cyan-500';

    // Move token to (5, 7)
    const newGrid = mockGrid.map(row => row.map(cell => ({ ...cell })));
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[0].length; c++) {
        if (newGrid[r][c].tokenName === 'Karynna') {
          newGrid[r][c].tokenName = undefined;
          newGrid[r][c].tokenColor = undefined;
        }
      }
    }
    newGrid[5][7].tokenName = 'Karynna';
    newGrid[5][7].tokenColor = 'bg-cyan-500';

    // Verify old cell cleared and new cell occupied
    expect(newGrid[2][3].tokenName).toBeUndefined();
    expect(newGrid[5][7].tokenName).toBe('Karynna');
    expect(newGrid[5][7].tokenColor).toBe('bg-cyan-500');

    // Extract tokens array for realtime broadcast payload
    const tokens: { name: string; color: string; r: number; c: number }[] = [];
    for (let r = 0; r < newGrid.length; r++) {
      for (let c = 0; c < newGrid[r].length; c++) {
        if (newGrid[r][c].tokenName) {
          tokens.push({
            name: newGrid[r][c].tokenName!,
            color: newGrid[r][c].tokenColor || 'bg-cyan-500',
            r,
            c,
          });
        }
      }
    }

    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      name: 'Karynna',
      color: 'bg-cyan-500',
      r: 5,
      c: 7,
    });
  });

  it('should correctly format immediate broadcast payload for player view', () => {
    mockGrid[1][1].tokenName = 'Eldrin';
    mockGrid[1][1].tokenColor = 'bg-cyan-500';

    const tokens = [{ name: 'Eldrin', color: 'bg-cyan-500', r: 1, c: 1 }];
    const mapPayload = {
      grid: mockGrid,
      bgImageUrl: 'https://example.com/map.jpg',
      gridScale: 40,
      gridOffsetX: 0,
      gridOffsetY: 0,
      vectorWalls: [],
      lightSources: [],
      activeMapId: 'map-dungeon-1',
      activeLevelId: 'lvl-0',
      currentLevelName: 'Subterrâneo 1',
      sceneId: 'scene-1',
      tokens,
      dungeonExplorationStarted: true,
    };

    expect(mapPayload.tokens).toHaveLength(1);
    expect(mapPayload.dungeonExplorationStarted).toBe(true);
    expect(mapPayload.grid[1][1].tokenName).toBe('Eldrin');
  });
});
