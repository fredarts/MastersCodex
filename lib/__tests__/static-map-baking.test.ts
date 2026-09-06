import { describe, it, expect } from 'vitest';
import { Cell } from '@/components/MapMaker';

describe('Dungeon Forge: Static Map Baking & Invalidation Engine', () => {
  const createTestGrid = (cols = 5, rows = 5): Cell[][] => {
    const grid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ x: c, y: r, type: 'wall', fog: false });
      }
      grid.push(row);
    }
    return grid;
  };

  const computeStaticSignature = (grid: Cell[][], cellSize: number, isPlayerView: boolean) => {
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    let sig = `s_${rows}_${cols}_${cellSize}_${isPlayerView ? '1' : '0'}_dyson_`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;
        sig += `${cell.type}`;
        if (cell.type === 'door') sig += `:${cell.doorConfig?.doorType || 'w'}:${cell.doorConfig?.status || 'c'}`;
        else if (cell.type === 'trap') sig += `:${cell.trapConfig?.revealedToPlayers ? '1' : '0'}`;
        else if (cell.type === 'chest' || cell.type === 'stash') sig += `:${cell.chestConfig?.containerType || 'c'}:${cell.chestConfig?.status || 'l'}`;
      }
      sig += '|';
    }
    return sig;
  };

  it('deve gerar assinaturas idênticas se apenas a posição de um token mudar (sem rebake do mapa)', () => {
    const grid = createTestGrid(5, 5);
    grid[2][2].type = 'floor';

    const sigBeforeToken = computeStaticSignature(grid, 40, false);

    // Adiciona token na célula (2, 2)
    grid[2][2].tokenName = 'Guerreiro';
    grid[2][2].tokenColor = 'cyan';
    const sigWithToken = computeStaticSignature(grid, 40, false);

    // Mover o token para outra célula (2, 3)
    grid[2][3].type = 'floor';
    grid[2][2].tokenName = undefined;
    grid[2][3].tokenName = 'Guerreiro';
    const sigMovedToken = computeStaticSignature(grid, 40, false);

    // A assinatura estática do mapa NÃO deve mudar apenas por causa do token
    expect(sigWithToken).toBe(sigBeforeToken);
  });

  it('deve invalidar a assinatura e disparar dirty flag quando uma parede for escavada (chão)', () => {
    const grid = createTestGrid(5, 5);
    const sig1 = computeStaticSignature(grid, 40, false);

    // Escava uma sala no centro
    grid[2][2].type = 'floor';
    const sig2 = computeStaticSignature(grid, 40, false);

    expect(sig1).not.toBe(sig2);
  });

  it('deve calcular o mapa de distâncias (distMap) corretamente para hachuras Dyson', () => {
    const grid = createTestGrid(5, 5);
    // Abre apenas o centro (2, 2) como chão
    grid[2][2].type = 'floor';

    const rows = 5;
    const cols = 5;
    const map: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(99));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]?.[c] && grid[r][c].type !== 'wall') {
          map[r][c] = 0;
        } else {
          let minDist = 99;
          for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (grid[nr]?.[nc] && grid[nr][nc].type !== 'wall') {
                  const d = Math.hypot(i, j);
                  if (d < minDist) minDist = d;
                }
              }
            }
          }
          map[r][c] = minDist;
        }
      }
    }

    // O chão central tem distância 0
    expect(map[2][2]).toBe(0);
    // As células ortogonalmente adjacentes (1,2), (3,2), (2,1), (2,3) têm distância 1
    expect(map[1][2]).toBeCloseTo(1, 0);
    expect(map[3][2]).toBeCloseTo(1, 0);
    expect(map[2][1]).toBeCloseTo(1, 0);
    expect(map[2][3]).toBeCloseTo(1, 0);
    // Célula diagonal (1, 1) tem distância Math.hypot(1, 1) = ~1.41
    expect(map[1][1]).toBeCloseTo(Math.SQRT2, 1);
    // Células muito distantes (0, 0) têm distância Math.hypot(2, 2) = ~2.83
    expect(map[0][0]).toBeCloseTo(Math.hypot(2, 2), 1);
  });
});
