import { describe, it, expect } from 'vitest';
import { 
  DND5E_LIGHT_PRESETS, 
  createLightFromPreset, 
  computeEffectiveVisionRangeCells 
} from '../vision/lightPresets';
import { 
  isCellBlockingVision, 
  isWallSegmentBlockingVision, 
  raySegmentIntersection, 
  hasLineOfSight, 
  getTokenVisionRadius, 
  getCombatantVisionType, 
  isPointInPolygon, 
  isLightVisibleToPlayer 
} from '@/components/map/visionCore';
import { Cell } from '@/components/MapMaker';
import { Combatant, WallSegment, LightSource } from '@/lib/types';

describe('Dynamic Lighting & Fog of War System (D&D 5e)', () => {
  describe('D&D 5e Light Presets', () => {
    it('deve possuir presets canônicos de D&D 5e configurados corretamente', () => {
      const torch = DND5E_LIGHT_PRESETS.torch;
      expect(torch.brightRadiusFeet).toBe(20);
      expect(torch.dimRadiusFeet).toBe(40);
      expect(torch.animation).toBe('torch');

      const hooded = DND5E_LIGHT_PRESETS.hooded_lantern;
      expect(hooded.brightRadiusFeet).toBe(30);
      expect(hooded.dimRadiusFeet).toBe(60);

      const bullseye = DND5E_LIGHT_PRESETS.bullseye_lantern;
      expect(bullseye.brightRadiusFeet).toBe(60);
      expect(bullseye.dimRadiusFeet).toBe(120);
      expect(bullseye.angleDeg).toBe(60);

      const daylight = DND5E_LIGHT_PRESETS.spell_daylight;
      expect(daylight.brightRadiusFeet).toBe(60);
      expect(daylight.dimRadiusFeet).toBe(120);
    });

    it('deve instanciar um LightSource customizado a partir de um preset', () => {
      const light = createLightFromPreset('torch', {
        x: 10,
        y: 15,
        attachedToTokenId: 'token-gandalf',
      });

      expect(light.x).toBe(10);
      expect(light.y).toBe(15);
      expect(light.brightRadius).toBe(20);
      expect(light.dimRadius).toBe(40);
      expect(light.attachedToTokenId).toBe('token-gandalf');
      expect(light.animation).toBe('torch');
    });

    it('deve calcular o alcance de visão em células para diferentes sentidos', () => {
      // Visão Normal (30 pés -> 6 células)
      expect(computeEffectiveVisionRangeCells('normal', 30)).toBe(6);

      // Darkvision (60 pés -> 12 células)
      expect(computeEffectiveVisionRangeCells('darkvision', 30, 60)).toBe(12);

      // Darkvision Superior / Drow (120 pés -> 24 células)
      expect(computeEffectiveVisionRangeCells('darkvision', 30, 120)).toBe(24);

      // Blindsight (30 pés -> 6 células)
      expect(computeEffectiveVisionRangeCells('blindsight', 30)).toBe(6);

      // Truesight (120 pés -> 24 células)
      expect(computeEffectiveVisionRangeCells('truesight', 120)).toBe(24);
    });
  });

  describe('Bloqueio de Visão por Paredes e Portas (Line of Sight)', () => {
    it('deve identificar se uma célula bloqueia a linha de visão', () => {
      const emptyCell: Cell = { type: 'floor', fog: false };
      const wallCell: Cell = { type: 'wall', fog: false };
      const closedDoorCell: Cell = { 
        type: 'door', 
        fog: false, 
        doorConfig: { status: 'closed', secret: false, locked: false } 
      };
      const openDoorCell: Cell = { 
        type: 'door', 
        fog: false, 
        doorConfig: { status: 'open', secret: false, locked: false } 
      };

      expect(isCellBlockingVision(emptyCell)).toBe(false);
      expect(isCellBlockingVision(wallCell)).toBe(true);
      expect(isCellBlockingVision(closedDoorCell)).toBe(true);
      expect(isCellBlockingVision(openDoorCell)).toBe(false);
      expect(isCellBlockingVision(undefined)).toBe(true);
    });

    it('deve checar se WallSegment vetorial bloqueia visão', () => {
      const solidWall: WallSegment = {
        id: 'w1',
        x1: 0,
        y1: 0,
        x2: 10,
        y2: 0,
        type: 'wall',
        blocksLight: true,
        blocksVision: true,
        blocksMovement: true,
      };

      const openDoor: WallSegment = {
        id: 'd1',
        x1: 0,
        y1: 0,
        x2: 5,
        y2: 0,
        type: 'door',
        doorState: 'open',
        blocksLight: true,
        blocksVision: true,
        blocksMovement: false,
      };

      expect(isWallSegmentBlockingVision(solidWall)).toBe(true);
      expect(isWallSegmentBlockingVision(openDoor)).toBe(false);
    });

    it('deve calcular interseção raio-segmento corretamente', () => {
      // Raio da origem (0, 0) apontando para o eixo X positivo (1, 0)
      // Segmento vertical em X=5 de Y=-2 a Y=2
      const t = raySegmentIntersection(0, 0, 1, 0, 5, -2, 5, 2);
      expect(t).toBeCloseTo(5);

      // Raio apontando na direção oposta (-1, 0) não deve interceptar
      const tOpposite = raySegmentIntersection(0, 0, -1, 0, 5, -2, 5, 2);
      expect(tOpposite).toBeNull();
    });

    it('deve testar hasLineOfSight em grid desobstruído e com parede', () => {
      const grid: Cell[][] = [
        [{ type: 'floor', fog: false }, { type: 'floor', fog: false }, { type: 'floor', fog: false }],
        [{ type: 'floor', fog: false }, { type: 'wall', fog: false }, { type: 'floor', fog: false }],
        [{ type: 'floor', fog: false }, { type: 'floor', fog: false }, { type: 'floor', fog: false }],
      ];

      // Linha desobstruída em linha reta horizontal no topo (col 0 para col 2 na linha 0)
      expect(hasLineOfSight(0, 0, 2, 0, grid)).toBe(true);

      // Linha bloqueada pela parede central (col 0, linha 1 para col 2, linha 1)
      expect(hasLineOfSight(0, 1, 2, 1, grid)).toBe(false);

      // Blindsight deve ignorar paredes
      expect(hasLineOfSight(0, 1, 2, 1, grid, [], 60, 'blindsight')).toBe(true);
    });
  });

  describe('Visão do Token e Raio de Iluminação', () => {
    const combatants: Combatant[] = [
      {
        id: 'c1',
        name: 'Elfo Arqueiro',
        type: 'player',
        hp: 30,
        maxHp: 30,
        ac: 15,
        initiative: 18,
        conditions: [],
        visionType: 'darkvision',
        darkvisionRange: 60,
      },
      {
        id: 'c2',
        name: 'Humano Guerreiro',
        type: 'player',
        hp: 40,
        maxHp: 40,
        ac: 18,
        initiative: 12,
        conditions: [],
        visionType: 'normal',
        hasTorch: true,
      },
      {
        id: 'c3',
        name: 'Goblin Ladino',
        type: 'monster',
        hp: 12,
        maxHp: 12,
        ac: 13,
        initiative: 15,
        conditions: [],
        visionType: 'darkvision',
        darkvisionRange: 60,
      }
    ];

    it('deve extrair o raio de visão correto para combatente com Darkvision', () => {
      // 60 pés / 5 = 12 células
      const radius = getTokenVisionRadius('Elfo Arqueiro', combatants);
      expect(radius).toBe(12);
    });

    it('deve expandir o raio de visão quando o combatente estiver com Tocha Acesa', () => {
      // Tocha: 40 pés / 5 = 8 células (20ft bright + 20ft dim)
      const radius = getTokenVisionRadius('Humano Guerreiro', combatants);
      expect(radius).toBe(8);
    });

    it('deve identificar o tipo de visão canônico do combatente', () => {
      expect(getCombatantVisionType('Elfo Arqueiro', combatants)).toBe('darkvision');
      expect(getCombatantVisionType('Humano Guerreiro', combatants)).toBe('normal');
      expect(getCombatantVisionType('Desconhecido', combatants)).toBe('normal');
    });
  });

  describe('Polígono de Visibilidade & Visibilidade de Luzes', () => {
    it('deve detectar se um ponto está dentro do polígono de visibilidade', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];

      expect(isPointInPolygon(50, 50, polygon)).toBe(true);
      expect(isPointInPolygon(150, 50, polygon)).toBe(false);
      expect(isPointInPolygon(-10, 50, polygon)).toBe(false);
    });

    it('deve ocultar fontes de luz situadas em salas sob névoa de guerra inexplorada', () => {
      const grid: Cell[][] = [
        [{ type: 'floor', fog: true }, { type: 'floor', fog: true }],
        [{ type: 'floor', fog: false }, { type: 'floor', fog: false }],
      ];

      const lightInDarkRoom: LightSource = {
        id: 'l1',
        x: 0,
        y: 0,
        brightRadius: 20,
        dimRadius: 40,
        color: '#ff9900',
        intensity: 1,
      };

      const lightInExploredRoom: LightSource = {
        id: 'l2',
        x: 1,
        y: 1,
        brightRadius: 20,
        dimRadius: 40,
        color: '#ff9900',
        intensity: 1,
      };

      const playerTokens = [{ r: 1, c: 0, radius: 6 }];

      expect(isLightVisibleToPlayer(lightInDarkRoom, playerTokens, grid, [], 40)).toBe(false);
      expect(isLightVisibleToPlayer(lightInExploredRoom, playerTokens, grid, [], 40)).toBe(true);
    });
  });

  describe('Iluminação 3D & Visibilidade no Escuro (BattleGrid3D)', () => {
    it('deve calcular níveis de iluminação realistas para Dia, Pôr do Sol e Noite', async () => {
      const { calculateEnvironmentSettings } = await import('@/components/battle-3d/BattleEnvironment');

      const dayEnv = calculateEnvironmentSettings(12, 'day');
      expect(dayEnv.ambientIntensity).toBeGreaterThan(0.5);
      expect(dayEnv.sunIntensity).toBeGreaterThan(0.8);
      expect(dayEnv.isNight).toBe(false);

      const sunsetEnv = calculateEnvironmentSettings(18, 'sunset');
      expect(sunsetEnv.isSunset).toBe(true);
      expect(sunsetEnv.sunColor).toBe('#f97316');

      const nightEnv = calculateEnvironmentSettings(24, 'night');
      expect(nightEnv.isNight).toBe(true);
      // À noite, ambient deve ser muito baixo para tochas e darkvision contrastarem
      expect(nightEnv.ambientIntensity).toBeLessThan(0.2);
      expect(nightEnv.sunIntensity).toBeLessThan(0.3);
      expect(nightEnv.sunColor).toBe('#38bdf8');
    });

    it('deve determinar se monstro é avistado por jogador com tocha ou Darkvision na escuridão', () => {
      // Jogador 1 (Elfo) com Darkvision 60ft (raio de 24 unidades) na posição (0, 0)
      const p1 = { pos: { x: 0, z: 0 }, radiusUnits: 24, hasTorch: false };
      // Jogador 2 (Humano) com Tocha 40ft (raio de 16 unidades) na posição (10, 10)
      const p2 = { pos: { x: 10, z: 10 }, radiusUnits: 16, hasTorch: true };
      const sources = [p1, p2];

      // Monstro A a 10 unidades de P1 -> dentro do Darkvision (24)
      const monsterA = { x: 8, z: 6 }; // dist = 10
      const distAtoP1 = Math.sqrt(monsterA.x ** 2 + monsterA.z ** 2);
      const isSeenA = sources.some(s => {
        const d = Math.sqrt((monsterA.x - s.pos.x) ** 2 + (monsterA.z - s.pos.z) ** 2);
        return d <= s.radiusUnits;
      });
      expect(isSeenA).toBe(true);

      // Monstro B a 35 unidades de ambos -> fora de todo alcance de visão
      const monsterB = { x: 35, z: 35 };
      const isSeenB = sources.some(s => {
        const d = Math.sqrt((monsterB.x - s.pos.x) ** 2 + (monsterB.z - s.pos.z) ** 2);
        return d <= s.radiusUnits;
      });
      expect(isSeenB).toBe(false);
    });
  });
});
