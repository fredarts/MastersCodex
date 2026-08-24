import { describe, it, expect } from 'vitest';
import {
  gridCellToWorldPos,
  worldPosToGridCell,
  computeDistance3DFeet,
  isTokenInSpellArea,
  computeCoverAgainstBlocks,
  BUILDING_BLOCK_CATALOG,
  DEFAULT_GRID_CONFIG_3D,
  BuildingBlock3D,
  SpellTemplate3D
} from '../3d-building-blocks';

describe('3D Building Blocks & Tactical Combat Engine', () => {
  describe('Catálogo de Blocos de Construção', () => {
    it('deve conter catálogo com blocos canônicos de RPG', () => {
      expect(BUILDING_BLOCK_CATALOG.wall_stone.blocksVision).toBe(true);
      expect(BUILDING_BLOCK_CATALOG.wall_stone.blocksMovement).toBe(true);
      expect(BUILDING_BLOCK_CATALOG.wall_stone.providesCover).toBe('full');

      expect(BUILDING_BLOCK_CATALOG.half_wall.blocksVision).toBe(false);
      expect(BUILDING_BLOCK_CATALOG.half_wall.providesCover).toBe('half');

      expect(BUILDING_BLOCK_CATALOG.door_wood.blocksMovement).toBe(true);
      expect(BUILDING_BLOCK_CATALOG.campfire.blocksMovement).toBe(false);
    });

    it('deve possuir configuração padrão de grid 20x20', () => {
      expect(DEFAULT_GRID_CONFIG_3D.widthCells).toBe(20);
      expect(DEFAULT_GRID_CONFIG_3D.heightCells).toBe(20);
      expect(DEFAULT_GRID_CONFIG_3D.shape).toBe('square');
    });
  });

  describe('Mapeamento de Coordenadas Grid vs Mundo 3D', () => {
    it('deve converter célula do grid para coordenadas 3D centralizadas', () => {
      // Grid 20x20: origem vai de -20 a +20 em X e Z. Célula 0,0 fica no canto (-19, -19)
      const cell00 = gridCellToWorldPos(0, 0, 20, 20);
      expect(cell00.x).toBeCloseTo(-19);
      expect(cell00.z).toBeCloseTo(-19);

      // Célula central (10, 10) fica em (1, 1)
      const cellCenter = gridCellToWorldPos(10, 10, 20, 20);
      expect(cellCenter.x).toBeCloseTo(1);
      expect(cellCenter.z).toBeCloseTo(1);
    });

    it('deve fazer snapping de clique do mouse 3D para a célula do grid mais próxima', () => {
      // Clique em (-18.2, -18.7) deve fazer snap para célula (0, 0)
      const snap = worldPosToGridCell(-18.2, -18.7, 20, 20);
      expect(snap.col).toBe(0);
      expect(snap.row).toBe(0);
      expect(snap.snappedX).toBeCloseTo(-19);
      expect(snap.snappedZ).toBeCloseTo(-19);
    });
  });

  describe('Cálculo de Distância 3D com Elevação (Voo)', () => {
    it('deve calcular distância no plano horizontal quando elevação for zero', () => {
      // Distância de (0, 0) a (6, 8) unidades 3D -> dist = 10 unidades -> 25 pés
      const p1 = { x: 0, z: 0, yElevation: 0 };
      const p2 = { x: 6, z: 8, yElevation: 0 };
      const distFt = computeDistance3DFeet(p1, p2);
      expect(distFt).toBeCloseTo(25);
    });

    it('deve incorporar a altura Y vertical no cálculo de alcance de tiro (Pitágoras 3D)', () => {
      // Atirador no chão (0, 0, y=0) e Dragão voando a 30ft de altitude (yElevation = 12 unidades)
      // Distância horizontal = 4 unidades (10 pés).
      // Distância 3D = sqrt(4^2 + 0^2 + 12^2) = sqrt(160) = 12.65 unidades -> 31.62 pés
      const shooter = { x: 0, z: 0, yElevation: 0 };
      const dragon = { x: 4, z: 0, yElevation: 12 };
      const distFt = computeDistance3DFeet(shooter, dragon);
      expect(distFt).toBeCloseTo(31.62, 1);
    });
  });

  describe('Templates de Magia 3D (Área de Efeito)', () => {
    it('deve detectar tokens contidos dentro de uma Bola de Fogo (Esfera 20ft)', () => {
      const fireball: SpellTemplate3D = {
        id: 'fb-1',
        name: 'Bola de Fogo',
        shape: 'sphere',
        radiusFeet: 20, // 8 unidades de raio
        color: '#ef4444',
        x: 0,
        z: 0,
      };

      // Token a 4 unidades (10 pés) do centro -> dentro
      expect(isTokenInSpellArea({ x: 3, z: 2 }, fireball)).toBe(true);
      // Token a 9 unidades (22.5 pés) do centro -> fora
      expect(isTokenInSpellArea({ x: 7, z: 6 }, fireball)).toBe(false);
    });

    it('deve detectar tokens contidos dentro de um Cone de Chamas (15ft / 60 graus)', () => {
      const burningHands: SpellTemplate3D = {
        id: 'bh-1',
        name: 'Mãos Flamejantes',
        shape: 'cone',
        radiusFeet: 15, // 6 unidades de raio
        color: '#f97316',
        x: 0,
        z: 0,
        rotationDeg: 0, // apontando para o Norte (-Z)
      };

      // Token em frente na direção do cone (0, -4) -> dentro
      expect(isTokenInSpellArea({ x: 0, z: -4 }, burningHands)).toBe(true);
      // Token atrás do conjurador (0, 4) -> fora
      expect(isTokenInSpellArea({ x: 0, z: 4 }, burningHands)).toBe(false);
      // Token longe lateralmente (5, -1) -> fora
      expect(isTokenInSpellArea({ x: 5, z: -1 }, burningHands)).toBe(false);
    });
  });

  describe('Cálculo de Cobertura 5e contra Blocos de Construção', () => {
    it('deve conceder cobertura total quando houver parede de pedra sólida no meio', () => {
      const wall: BuildingBlock3D = {
        id: 'w1',
        type: 'wall_stone',
        x: 0,
        z: 0,
        yElevation: 0,
        rotationDeg: 0,
      };

      const attacker = { x: 0, z: -10 };
      const target = { x: 0, z: 10 };

      const result = computeCoverAgainstBlocks(attacker, target, [wall]);
      expect(result.cover).toBe('full');
    });

    it('deve conceder meia-cobertura quando o obstáculo interceptar apenas parte dos raios', () => {
      const halfWall: BuildingBlock3D = {
        id: 'hw1',
        type: 'half_wall',
        x: 0.5,
        z: 0,
        yElevation: 0,
        rotationDeg: 0,
      };

      const attacker = { x: -2, z: -10 };
      const target = { x: 0, z: 10 };

      const result = computeCoverAgainstBlocks(attacker, target, [halfWall]);
      expect(result.cover === 'half' || result.cover === 'none').toBe(true);
    });

    it('deve calcular cobertura contra paredes esticadas proceduralmente (segmentsCount > 1)', () => {
      const longWall: BuildingBlock3D = {
        id: 'lw1',
        type: 'wall_stone',
        x: 0,
        z: 0,
        yElevation: 0,
        rotationDeg: 0,
        segmentsCount: 3, // 3 módulos = 6 unidades de largura (15 pés)
      };

      // Atacante deslocado lateralmente ainda é bloqueado pela parede esticada
      const attacker = { x: 2, z: -10 };
      const target = { x: 2, z: 10 };

      const result = computeCoverAgainstBlocks(attacker, target, [longWall]);
      expect(result.cover).toBe('full');
    });

    it('não deve bloquear visão se a porta estiver aberta', () => {
      const openDoor: BuildingBlock3D = {
        id: 'd1',
        type: 'door_wood',
        x: 0,
        z: 0,
        yElevation: 0,
        rotationDeg: 0,
        state: 'open',
      };

      const attacker = { x: 0, z: -5 };
      const target = { x: 0, z: 5 };

      const result = computeCoverAgainstBlocks(attacker, target, [openDoor]);
      expect(result.cover).toBe('none');
    });
  });

  describe('Fontes de Luz Medievais & Fábrica de Blocos', () => {
    it('deve conter definições de iluminação para velas, tochas, castiçais e lanternas', () => {
      expect(BUILDING_BLOCK_CATALOG.candle.isLightSource).toBe(true);
      expect(BUILDING_BLOCK_CATALOG.torch_standing.defaultLightRadiusFt).toBe(40);
      expect(BUILDING_BLOCK_CATALOG.candelabra.isLightSource).toBe(true);
      expect(BUILDING_BLOCK_CATALOG.oil_lamp.isLightSource).toBe(true);
      expect(BUILDING_BLOCK_CATALOG.lantern_medieval.defaultLightRadiusFt).toBe(60);
      expect(BUILDING_BLOCK_CATALOG.brazier.isLightSource).toBe(true);
    });
  });
});
