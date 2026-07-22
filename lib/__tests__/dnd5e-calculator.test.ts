import { describe, it, expect } from 'vitest';
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  calculateSpellDC,
  applyLongRest,
} from '../dnd5e-calculator';
import { CharacterSheet } from '../types';

describe('D&D 5e Rules Calculator Unit Tests', () => {
  describe('calculateModifier', () => {
    it('deve retornar 0 para atributo 10 ou 11', () => {
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(11)).toBe(0);
    });

    it('deve retornar modificadores positivos corretos', () => {
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(18)).toBe(4);
      expect(calculateModifier(20)).toBe(5);
    });

    it('deve retornar modificadores negativos corretos', () => {
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(6)).toBe(-2);
      expect(calculateModifier(1)).toBe(-5);
    });
  });

  describe('formatModifier', () => {
    it('deve formatar sinal de positivo para valores >= 0', () => {
      expect(formatModifier(3)).toBe('+3');
      expect(formatModifier(0)).toBe('+0');
    });

    it('deve formatar sinal de negativo para valores < 0', () => {
      expect(formatModifier(-2)).toBe('-2');
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('deve retornar +2 para níveis 1 a 4', () => {
      expect(calculateProficiencyBonus(1)).toBe(2);
      expect(calculateProficiencyBonus(4)).toBe(2);
    });

    it('deve retornar +3 para níveis 5 a 8', () => {
      expect(calculateProficiencyBonus(5)).toBe(3);
      expect(calculateProficiencyBonus(8)).toBe(3);
    });

    it('deve retornar +6 para nível 20', () => {
      expect(calculateProficiencyBonus(20)).toBe(6);
    });
  });

  describe('calculateSpellDC', () => {
    it('deve calcular CD de magia corretamente (8 + Bônus Proficiência + Modificador)', () => {
      const mockSheet: Partial<CharacterSheet> = {
        level: 5, // Prof = +3
        spellcastingAbility: 'int',
        attributes: {
          int: { score: 16 }, // Mod = +3
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 },
        } as any,
        savingThrows: {} as any,
        skills: {} as any,
      };

      expect(calculateSpellDC(mockSheet as CharacterSheet)).toBe(14); // 8 + 3 + 3 = 14
    });
  });

  describe('applyLongRest', () => {
    it('deve restaurar PV total e resgatar slots de magia no descanso longo', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Guerreiro',
        level: 4,
        currentHp: 5,
        maxHp: 25,
        tempHp: 0,
        hitDiceUsed: '21d8',
        deathSaves: { successes: 2, failures: 1 },
        spellSlots: {
          1: { max: 4, used: 3 },
          2: { max: 2, used: 2 },
        } as any,
      };

      const restored = applyLongRest(mockSheet as CharacterSheet);

      expect(restored.currentHp).toBe(25);
      expect(restored.deathSaves.successes).toBe(0);
      expect(restored.deathSaves.failures).toBe(0);
      expect(restored.spellSlots[1].used).toBe(0);
      expect(restored.spellSlots[2].used).toBe(0);
    });
  });
});
