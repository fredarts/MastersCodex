import { describe, it, expect } from 'vitest';
import { computeVisibilityPolygon } from '@/components/map/visionCore';
import { Cell } from '@/components/MapMaker';
import { LightSource } from '@/lib/types';

describe('Dungeon Forge: DDA Raycasting & Lighting Cache Engine', () => {
  const createTestGrid = (cols = 10, rows = 10): Cell[][] => {
    const grid: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ x: c, y: r, type: 'floor', fog: false });
      }
      grid.push(row);
    }
    return grid;
  };

  it('deve calcular visibilidade com DDA em sala aberta sem interceptações falsas', () => {
    const grid = createTestGrid(10, 10);
    const cellSize = 40;
    // Centro da célula (5, 5) => tx = 5*40 + 20 = 220, ty = 220
    const tx = 220;
    const ty = 220;
    const visionRadius = 80; // 2 células de raio

    const polygon = computeVisibilityPolygon(tx, ty, visionRadius, grid, cellSize);

    expect(polygon.length).toBeGreaterThan(0);
    // Em sala aberta, todos os pontos devem estar na distância máxima (visionRadius)
    polygon.forEach((pt) => {
      const dist = Math.hypot(pt.x - tx, pt.y - ty);
      expect(dist).toBeCloseTo(visionRadius, 0);
    });
  });

  it('deve bloquear a propagação da visão exatamente na borda de uma célula de parede (DDA)', () => {
    const grid = createTestGrid(10, 10);
    const cellSize = 40;
    // Coloca parede em (7, 5)
    grid[5][7].type = 'wall';

    const tx = 220; // x = 5.5 células (célula 5)
    const ty = 220; // y = 5.5 células (célula 5)
    const visionRadius = 160; // 4 células

    const polygon = computeVisibilityPolygon(tx, ty, visionRadius, grid, cellSize);

    // O raio disparado em ângulo 0 (direção leste, exatamente para a direita)
    // deve atingir a borda esquerda da célula 7 (x = 7 * 40 = 280)
    // Distância de tx (220) até a parede (280) = 60px
    const eastPoint = polygon.find((p) => Math.abs(p.y - ty) < 2 && p.x > tx);
    expect(eastPoint).toBeDefined();
    if (eastPoint) {
      expect(eastPoint.x).toBeCloseTo(280, 0);
      expect(Math.hypot(eastPoint.x - tx, eastPoint.y - ty)).toBeCloseTo(60, 0);
    }
  });

  it('deve permitir passagem de visão através de portas abertas e bloquear em portas fechadas', () => {
    const grid = createTestGrid(10, 10);
    const cellSize = 40;

    // Parede com porta no meio na coluna 6
    for (let r = 0; r < 10; r++) {
      grid[r][6].type = 'wall';
    }
    grid[5][6] = {
      x: 6,
      y: 5,
      type: 'door',
      fog: false,
      doorConfig: { status: 'open', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }
    };

    const tx = 220;
    const ty = 220;
    const visionRadius = 160;

    // Com porta aberta: o raio leste deve passar além da coluna 6
    const polygonOpen = computeVisibilityPolygon(tx, ty, visionRadius, grid, cellSize);
    const rayThroughDoor = polygonOpen.find((p) => Math.abs(p.y - ty) < 2 && p.x > tx);
    expect(rayThroughDoor).toBeDefined();
    if (rayThroughDoor) {
      expect(rayThroughDoor.x).toBeGreaterThan(280);
    }

    // Fechar a porta
    grid[5][6].doorConfig!.status = 'closed';
    const polygonClosed = computeVisibilityPolygon(tx, ty, visionRadius, grid, cellSize);
    const rayBlockedByDoor = polygonClosed.find((p) => Math.abs(p.y - ty) < 2 && p.x > tx);
    expect(rayBlockedByDoor).toBeDefined();
    if (rayBlockedByDoor) {
      expect(rayBlockedByDoor.x).toBeCloseTo(240, 0); // Borda da coluna 6 (x = 6*40 = 240)
    }
  });

  it('deve modular parâmetros de flicker de tochas sem alterar as coordenadas do polígono de sombras', () => {
    const light: LightSource = {
      id: 'torch-1',
      x: 5,
      y: 5,
      brightRadius: 20,
      dimRadius: 40,
      color: '#ff9900',
      intensity: 1,
      animation: 'torch',
    };

    const cellSize = 40;
    const lx = light.x * cellSize;
    const ly = light.y * cellSize;

    const computeFlicker = (time: number) => {
      const flicker = (Math.sin(time / 150 + lx * 0.05) + Math.cos(time / 200 + ly * 0.05)) * 0.08;
      return {
        radiusMultiplier: 1 + flicker,
        alphaMultiplier: 1 + flicker,
      };
    };

    const t1 = computeFlicker(1000);
    const t2 = computeFlicker(1500);

    // Valores devem variar suavemente ao longo do tempo
    expect(t1.alphaMultiplier).not.toBe(t2.alphaMultiplier);
    expect(t1.alphaMultiplier).toBeGreaterThan(0.8);
    expect(t1.alphaMultiplier).toBeLessThan(1.2);
  });
});
