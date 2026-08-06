import { describe, it, expect } from 'vitest';
import { parseAIDungeonToMapData } from '../parsers/dungeonParser';
import { AIDungeonOutput } from '../ai/dungeon-generator';

describe('parseAIDungeonToMapData', () => {
  it('deve escavar os cômodos e corredores corretamente a partir dos bounds do JSON da IA', () => {
    const mockOutput: AIDungeonOutput = {
      metadata: {
        title: 'Masmorra de Teste',
        description: 'Masmorra para testes de unidade',
        recommendedLevel: 3,
        theme: 'gothic',
        floorIndex: 1,
        totalFloors: 1,
      },
      gridSize: { cols: 40, rows: 40 },
      rooms: [
        {
          id: 'room_1',
          name: 'Salão Principal',
          type: 'hall',
          bounds: { startCol: 5, startRow: 5, width: 10, height: 8 },
          floorTileType: 'stone',
        },
        {
          id: 'corridor_1',
          name: 'Corredor Leste',
          type: 'corridor',
          bounds: { startCol: 15, startRow: 8, width: 8, height: 2 },
          floorTileType: 'floor',
        },
      ],
      elements: [
        {
          type: 'door',
          col: 15,
          row: 8,
          config: { status: 'closed', dc: 12 },
        },
        {
          type: 'chest',
          col: 8,
          row: 8,
          config: { status: 'locked', dc: 15, lootItems: ['50 po'] },
        },
      ],
      lightSources: [
        { col: 7, row: 7, preset: 'torch', color: '#ff9900', radius: 4 },
      ],
    };

    const parsed = parseAIDungeonToMapData(mockOutput);

    // Verify grid dimensions
    expect(parsed.cols).toBe(40);
    expect(parsed.rows).toBe(40);

    // Verify room 1 floor carving
    expect(parsed.grid[5][5].type).toBe('stone');
    expect(parsed.grid[8][8].type).toBe('chest'); // Chest element placed on top

    // Verify corridor carving
    expect(parsed.grid[8][16].type).toBe('floor');

    // Verify uncarved area outside rooms remains solid wall
    expect(parsed.grid[0][0].type).toBe('wall');
    expect(parsed.grid[2][2].type).toBe('wall');

    // Verify vector walls generated around room perimeters
    expect(parsed.vectorWalls.length).toBeGreaterThan(0);

    // Verify light source created
    expect(parsed.lightSources.length).toBe(1);
    expect(parsed.lightSources[0].animation).toBe('torch');
  });

  it('deve extrair coordenadas flexíveis (x, y, w, h ou col, row) se a IA alterar a nomenclatura', () => {
    const mockOutputAny: any = {
      metadata: { title: 'Masmorra Flexível' },
      gridSize: { cols: 30, rows: 30 },
      rooms: [
        {
          id: 'room_alt',
          x: 4,
          y: 4,
          w: 6,
          h: 6,
          floorTileType: 'wood',
        },
      ],
      elements: [],
      lightSources: [],
    };

    const parsed = parseAIDungeonToMapData(mockOutputAny);
    expect(parsed.grid[4][4].type).toBe('wood');
    expect(parsed.grid[6][6].type).toBe('wood');
  });
});
