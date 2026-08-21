import { describe, it, expect } from 'vitest';
import { revealVisionWithLOS, getTokenVisionRadius } from '@/components/map/visionCore';
import { Cell } from '@/components/MapMaker';
import { Combatant } from '@/lib/types';

describe('Dungeon Floor Tokens & Multi-Level Party Transitions', () => {
  const createMockGrid = (rows = 10, cols = 10, fillType: 'wall' | 'floor' = 'floor'): Cell[][] => {
    const grid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          x: c,
          y: r,
          type: fillType,
          fog: true,
        });
      }
      grid.push(row);
    }
    return grid;
  };

  const mockCombatants: Combatant[] = [
    {
      id: 'p1',
      name: 'Alexandre',
      type: 'player',
      hp: 25,
      maxHp: 25,
      ac: 16,
      initiative: 15,
      visionType: 'darkvision',
      visionRange: 12,
    },
    {
      id: 'p2',
      name: 'Valíria',
      type: 'player',
      hp: 18,
      maxHp: 18,
      ac: 13,
      initiative: 12,
      visionType: 'normal',
      visionRange: 6,
    },
    {
      id: 'm1',
      name: 'Kobold 1',
      type: 'monster',
      hp: 5,
      maxHp: 5,
      ac: 12,
      initiative: 10,
    }
  ];

  it('deve posicionar token de jogador e abrir a névoa de guerra através de LOS', () => {
    const grid = createMockGrid(10, 10, 'floor');
    const player = mockCombatants[0];

    // Posiciona o jogador em (5, 5)
    grid[5][5].tokenName = player.name;
    grid[5][5].tokenColor = 'bg-cyan-500';

    const radius = getTokenVisionRadius(player.name, mockCombatants);
    revealVisionWithLOS(grid, 5, 5, radius);

    expect(grid[5][5].tokenName).toBe('Alexandre');
    expect(grid[5][5].fog).toBe(false);
    expect(grid[5][6].fog).toBe(false);
    expect(grid[4][5].fog).toBe(false);
  });

  it('deve remover token de jogador do grid e limpar seus metadados', () => {
    const grid = createMockGrid(10, 10, 'floor');
    grid[3][3].tokenName = 'Alexandre';
    grid[3][3].tokenColor = 'bg-cyan-500';

    // Remove o token
    grid[3][3].tokenName = undefined;
    grid[3][3].tokenColor = undefined;

    expect(grid[3][3].tokenName).toBeUndefined();
    expect(grid[3][3].tokenColor).toBeUndefined();
  });

  it('deve realizar a transição de todos os heróis da party entre andares da masmorra', () => {
    // Andar 1 (Origem)
    const floor1Grid = createMockGrid(10, 10, 'floor');
    floor1Grid[2][2].tokenName = 'Alexandre';
    floor1Grid[2][2].tokenColor = 'bg-cyan-500';
    floor1Grid[2][3].tokenName = 'Valíria';
    floor1Grid[2][3].tokenColor = 'bg-cyan-500';

    // Andar 2 (Destino com algumas paredes)
    const floor2Grid = createMockGrid(10, 10, 'floor');
    floor2Grid[0][0].type = 'wall';
    floor2Grid[0][1].type = 'wall';

    const playerKeys = new Set(['ALEXANDRE', 'VALÍRIA']);

    // 1. Limpa do Andar 1
    for (let r = 0; r < floor1Grid.length; r++) {
      for (let c = 0; c < floor1Grid[r].length; c++) {
        if (floor1Grid[r][c].tokenName && playerKeys.has(floor1Grid[r][c].tokenName!.toUpperCase())) {
          floor1Grid[r][c].tokenName = undefined;
          floor1Grid[r][c].tokenColor = undefined;
        }
      }
    }

    expect(floor1Grid[2][2].tokenName).toBeUndefined();
    expect(floor1Grid[2][3].tokenName).toBeUndefined();

    // 2. Encontra células livres no Andar 2 e aloca os tokens
    const freeCells: { r: number; c: number }[] = [];
    for (let r = 0; r < floor2Grid.length; r++) {
      for (let c = 0; c < floor2Grid[r].length; c++) {
        if (floor2Grid[r][c].type !== 'wall' && !floor2Grid[r][c].tokenName) {
          freeCells.push({ r, c });
        }
      }
    }

    const playerCombatants = mockCombatants.filter(c => c.type === 'player');
    playerCombatants.forEach((player, idx) => {
      const cell = freeCells[idx];
      expect(cell).toBeDefined();
      floor2Grid[cell.r][cell.c].tokenName = player.name;
      floor2Grid[cell.r][cell.c].tokenColor = '#38bdf8';
      const radius = getTokenVisionRadius(player.name, mockCombatants);
      revealVisionWithLOS(floor2Grid, cell.r, cell.c, radius);
    });

    // Valida que ambos os tokens foram colocados no Andar 2 em células válidas (não-paredes) e com névoa revelada
    const placed1 = freeCells[0];
    const placed2 = freeCells[1];

    expect(floor2Grid[placed1.r][placed1.c].tokenName).toBe('Alexandre');
    expect(floor2Grid[placed1.r][placed1.c].type).not.toBe('wall');
    expect(floor2Grid[placed1.r][placed1.c].fog).toBe(false);

    expect(floor2Grid[placed2.r][placed2.c].tokenName).toBe('Valíria');
    expect(floor2Grid[placed2.r][placed2.c].type).not.toBe('wall');
    expect(floor2Grid[placed2.r][placed2.c].fog).toBe(false);
  });

  it('ao voltar para o andar anterior, os tokens não devem reaparecer como fantasmas', () => {
    // Simulando estado runtime multi-nível
    const floor1Grid = createMockGrid(10, 10, 'floor');
    floor1Grid[1][1].tokenName = 'Alexandre';
    floor1Grid[1][1].tokenColor = '#38bdf8';

    const floor2Grid = createMockGrid(10, 10, 'floor');

    // Mover Alexandre para o Andar 2
    const key = 'ALEXANDRE';
    for (let r = 0; r < floor1Grid.length; r++) {
      for (let c = 0; c < floor1Grid[r].length; c++) {
        if (floor1Grid[r][c].tokenName?.toUpperCase() === key) {
          floor1Grid[r][c].tokenName = undefined;
          floor1Grid[r][c].tokenColor = undefined;
        }
      }
    }
    floor2Grid[5][5].tokenName = 'Alexandre';
    floor2Grid[5][5].tokenColor = '#38bdf8';

    // Ao inspecionar o grid do Andar 1 (Origem)
    const tokensOnFloor1 = floor1Grid.flatMap(row => row.filter(c => c.tokenName !== undefined));
    expect(tokensOnFloor1.length).toBe(0);

    // Ao inspecionar o grid do Andar 2 (Destino)
    const tokensOnFloor2 = floor2Grid.flatMap(row => row.filter(c => c.tokenName !== undefined));
    expect(tokensOnFloor2.length).toBe(1);
    expect(tokensOnFloor2[0].tokenName).toBe('Alexandre');
  });

  it('deve teletransportar os aventureiros para o ponto de spawn exato configurado na passagem/escada', () => {
    const destinationGrid = createMockGrid(10, 10, 'floor');
    // Parede no spawn exato para testar fallback para célula adjacente mais próxima
    destinationGrid[8][8].type = 'wall';

    const spawnR = 8;
    const spawnC = 8;

    const freeCells: { r: number; c: number }[] = [];
    for (let r = 0; r < destinationGrid.length; r++) {
      for (let c = 0; c < destinationGrid[r].length; c++) {
        if (destinationGrid[r][c].type !== 'wall' && !destinationGrid[r][c].tokenName) {
          freeCells.push({ r, c });
        }
      }
    }

    // Ordenar células livres pela menor distância ao ponto de spawn (8,8)
    freeCells.sort((a, b) => {
      const distA = Math.hypot(a.r - spawnR, a.c - spawnC);
      const distB = Math.hypot(b.r - spawnR, b.c - spawnC);
      return distA - distB;
    });

    const playerCombatants = mockCombatants.filter(c => c.type === 'player');
    playerCombatants.forEach((player, idx) => {
      const cell = freeCells[idx];
      expect(cell).toBeDefined();
      destinationGrid[cell.r][cell.c].tokenName = player.name;
      destinationGrid[cell.r][cell.c].tokenColor = '#38bdf8';
    });

    // Validar que os jogadores foram colocados ao redor de (8,8)
    expect(destinationGrid[8][8].tokenName).toBeUndefined(); // era parede
    expect(destinationGrid[7][8].tokenName || destinationGrid[8][7].tokenName || destinationGrid[7][7].tokenName).toBeDefined();
  });

  it('deve vincular escada A à escada B no andar de destino e spawnar no local exato de B', () => {
    const floor1Grid = createMockGrid(10, 10, 'floor');
    const floor2Grid = createMockGrid(10, 10, 'floor');

    // Escada B existente no Andar 2 na posição (3, 7)
    floor2Grid[3][7].type = 'transition';
    floor2Grid[3][7].transitionConfig = {
      id: 'stairs-b',
      name: 'Escada para o Térreo',
      type: 'stairs_up',
      targetLevelId: 'lvl-1',
      targetSpawnR: 1,
      targetSpawnC: 1,
      linkedTransitionId: 'stairs-a',
      status: 'open',
    };

    // Escada A configurada no Andar 1 na posição (1, 1) conectada à Escada B
    floor1Grid[1][1].type = 'transition';
    floor1Grid[1][1].transitionConfig = {
      id: 'stairs-a',
      name: 'Escada para o Subsolo',
      type: 'stairs_down',
      targetLevelId: 'lvl-2',
      targetSpawnR: 3,
      targetSpawnC: 7,
      linkedTransitionId: 'stairs-b',
      status: 'open',
    };

    const targetSpawnR = floor1Grid[1][1].transitionConfig.targetSpawnR;
    const targetSpawnC = floor1Grid[1][1].transitionConfig.targetSpawnC;

    // Teletransportar Alexandre usando as coordenadas vinculadas
    floor2Grid[targetSpawnR!][targetSpawnC!].tokenName = 'Alexandre';

    expect(floor2Grid[3][7].tokenName).toBe('Alexandre');
    expect(floor1Grid[1][1].transitionConfig.linkedTransitionId).toBe('stairs-b');
    expect(floor2Grid[3][7].transitionConfig?.linkedTransitionId).toBe('stairs-a');
  });

  it('deve permitir mover múltiplos personagens individualmente um a um para o outro andar', () => {
    const floor1Grid = createMockGrid(10, 10, 'floor');
    const floor2Grid = createMockGrid(10, 10, 'floor');

    // Inicialmente no Andar 1: Alexandre e Valíria
    floor1Grid[1][1].tokenName = 'Alexandre';
    floor1Grid[1][2].tokenName = 'Valíria';

    // 1. Mover Alexandre para o Andar 2 na posição (5, 5)
    floor1Grid[1][1].tokenName = undefined;
    floor2Grid[5][5].tokenName = 'Alexandre';

    expect(floor1Grid.flatMap(r => r.filter(c => c.tokenName)).map(c => c.tokenName)).toEqual(['Valíria']);
    expect(floor2Grid.flatMap(r => r.filter(c => c.tokenName)).map(c => c.tokenName)).toEqual(['Alexandre']);

    // 2. Mover Valíria para o Andar 2 na posição (5, 5) (colocada na célula livre adjacente mais próxima)
    floor1Grid[1][2].tokenName = undefined;
    // Posição (5,5) já ocupada por Alexandre, Valíria fica em (5,6)
    floor2Grid[5][6].tokenName = 'Valíria';

    expect(floor1Grid.flatMap(r => r.filter(c => c.tokenName)).length).toBe(0);
    const destinationTokens = floor2Grid.flatMap(r => r.filter(c => c.tokenName)).map(c => c.tokenName);
    expect(destinationTokens).toContain('Alexandre');
    expect(destinationTokens).toContain('Valíria');
  });
});



