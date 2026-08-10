import { describe, it, expect } from 'vitest';
import { Combatant } from '../types';
import {
  calculateGridDistance,
  getCombatantSizeReachOffset,
  isReachAttack,
  validateMeleeAttackRange,
} from '../utils/combat-range';

describe('Validação de Alcance de Combate (Combat Reach)', () => {
  describe('calculateGridDistance (Distância Chebyshev de 2x2 unidades por célula)', () => {
    it('deve calcular a distância ortogonal corretamente', () => {
      const c1 = { x: 10, z: 10 };
      const c2 = { x: 16, z: 10 }; // 3 células à direita (deltaX = 6 unidades)
      expect(calculateGridDistance(c1, c2)).toBe(3);
    });

    it('deve calcular a distância diagonal corretamente como 1 por quadrado', () => {
      const c1 = { x: 10, z: 10 };
      const c2 = { x: 12, z: 12 }; // 1 célula na diagonal (deltaX, deltaZ = 2 unidades)
      expect(calculateGridDistance(c1, c2)).toBe(1);

      const c3 = { x: 16, z: 16 }; // 3 células na diagonal (deltaX, deltaZ = 6 unidades)
      expect(calculateGridDistance(c1, c3)).toBe(3);
    });

    it('deve lidar com distâncias mistas (diagonal + ortogonal)', () => {
      const c1 = { x: 10, z: 10 };
      const c2 = { x: 14, z: 18 }; // deltaX: 4 (2 células), deltaZ: 8 (4 células)
      expect(calculateGridDistance(c1, c2)).toBe(4);
    });
  });

  describe('getCombatantSizeReachOffset (Offsets de Tamanho)', () => {
    it('deve retornar 0 para tamanhos Médio, Pequeno ou indefinidos', () => {
      expect(getCombatantSizeReachOffset()).toBe(0);
      expect(getCombatantSizeReachOffset('Médio')).toBe(0);
      expect(getCombatantSizeReachOffset('Medium')).toBe(0);
      expect(getCombatantSizeReachOffset('Small')).toBe(0);
    });

    it('deve retornar 1 para tamanho Grande / Large', () => {
      expect(getCombatantSizeReachOffset('Grande')).toBe(1);
      expect(getCombatantSizeReachOffset('Large')).toBe(1);
    });

    it('deve retornar 2 para tamanho Enorme / Huge', () => {
      expect(getCombatantSizeReachOffset('Enorme')).toBe(2);
      expect(getCombatantSizeReachOffset('Huge')).toBe(2);
    });

    it('deve retornar 3 para tamanho Imenso / Gargantuan', () => {
      expect(getCombatantSizeReachOffset('Imenso')).toBe(3);
      expect(getCombatantSizeReachOffset('Gargantuan')).toBe(3);
    });
  });

  describe('isReachAttack (Detecção de Propriedade Alcance)', () => {
    it('deve identificar armas de alcance a partir da WEAPON_TABLE', () => {
      expect(isReachAttack('Glaive')).toBe(true);
      expect(isReachAttack('Ataque: Alabarda')).toBe(true);
      expect(isReachAttack('Chicote')).toBe(true);
      expect(isReachAttack('Adaga')).toBe(false);
      expect(isReachAttack('Espada Longa')).toBe(false);
    });

    it('deve identificar alcance a partir de palavras-chave na descrição', () => {
      expect(isReachAttack('Ataque de Garra', 'alcance 3m, dano 1d8')).toBe(true);
      expect(isReachAttack('Mordida de Lobo', '+5 to hit, reach 10 ft')).toBe(true);
      expect(isReachAttack('Tentáculo', 'alcance: 4.5m')).toBe(true);
      expect(isReachAttack('Mordida de Dragão', 'reach 15 ft')).toBe(true);
      expect(isReachAttack('Pancada', 'dano de concussão 2d6')).toBe(false);
    });
  });

  describe('validateMeleeAttackRange', () => {
    const cMediumAttacker: Combatant = {
      id: 'atk-med',
      name: 'Guerreiro',
      type: 'player',
      hp: 10,
      maxHp: 10,
      ac: 15,
      initiative: 10,
      size: 'Médio',
      x: 10,
      z: 10,
    };

    const cMediumTarget: Combatant = {
      id: 'tgt-med',
      name: 'Goblin',
      type: 'monster',
      hp: 10,
      maxHp: 10,
      ac: 15,
      initiative: 10,
      size: 'Médio',
      x: 12,
      z: 12, // Adjacente (diagonal, deltaX=2, deltaZ=2 -> dist 1 célula)
    };

    it('deve permitir ataques corpo a corpo normais se adjacentes', () => {
      const result = validateMeleeAttackRange(cMediumAttacker, cMediumTarget, 'Espada Longa');
      expect(result.isValid).toBe(true);
      expect(result.isMelee).toBe(true);
      expect(result.actualDistance).toBe(1);
      expect(result.maxAllowedDistance).toBe(1);
    });

    it('deve bloquear ataques corpo a corpo normais se fora de alcance (2+ células)', () => {
      const targetFar = { ...cMediumTarget, x: 14, z: 10 }; // Distância 2 células (deltaX = 4 unidades)
      const result = validateMeleeAttackRange(cMediumAttacker, targetFar, 'Espada Longa');
      expect(result.isValid).toBe(false);
      expect(result.actualDistance).toBe(2);
      expect(result.maxAllowedDistance).toBe(1);
    });

    it('deve permitir ataques com armas de alcance (Reach) a até 2 quadrados', () => {
      const targetFar = { ...cMediumTarget, x: 14, z: 10 }; // Distância 2 células (deltaX = 4 unidades)
      const result = validateMeleeAttackRange(cMediumAttacker, targetFar, 'Glaive');
      expect(result.isValid).toBe(true);
      expect(result.actualDistance).toBe(2);
      expect(result.maxAllowedDistance).toBe(2);
    });

    it('deve permitir ataques corporizados por monstros Grandes a 2 quadrados', () => {
      const largeAttacker = { ...cMediumAttacker, size: 'Grande' };
      const targetFar = { ...cMediumTarget, x: 14, z: 10 }; // Distância 2 células (deltaX = 4 unidades)
      const result = validateMeleeAttackRange(largeAttacker, targetFar, 'Pancada');
      expect(result.isValid).toBe(true);
      expect(result.actualDistance).toBe(2);
      expect(result.maxAllowedDistance).toBe(2); // baseReach (1) + sizeOffset (1) = 2
    });

    it('deve ignorar validação de alcance corpo a corpo para ataques à distância', () => {
      const targetFar = { ...cMediumTarget, x: 30, z: 10 }; // Distância 10 células (deltaX = 20 unidades)
      const result = validateMeleeAttackRange(cMediumAttacker, targetFar, 'Arco Curto');
      expect(result.isMelee).toBe(false);
      expect(result.isValid).toBe(true); // Ataques à distância sempre retornam válido na regra de melee
    });
  });
});
