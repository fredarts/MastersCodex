import { describe, it, expect } from 'vitest';
import { 
  calculateModifier, 
  formatModifier, 
  calculateProficiencyBonus,
  applyLongRest,
  recalculateSheetDerivedStats
} from '../dnd5e-calculator';
import { createEmptyCharacterSheet } from '../dnd5e-data';

describe('D&D 5e Calculator Engine', () => {
  describe('calculateModifier', () => {
    it('deve calcular corretamente os modificadores de atributo D&D 5e', () => {
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(11)).toBe(0);
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(18)).toBe(4);
      expect(calculateModifier(20)).toBe(5);
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(6)).toBe(-2);
    });
  });

  describe('formatModifier', () => {
    it('deve formatar o modificador com sinal positivo ou negativo', () => {
      expect(formatModifier(3)).toBe('+3');
      expect(formatModifier(0)).toBe('+0');
      expect(formatModifier(-1)).toBe('-1');
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('deve retornar o bônus de proficiência correto de acordo com o nível', () => {
      expect(calculateProficiencyBonus(1)).toBe(2);
      expect(calculateProficiencyBonus(4)).toBe(2);
      expect(calculateProficiencyBonus(5)).toBe(3);
      expect(calculateProficiencyBonus(8)).toBe(3);
      expect(calculateProficiencyBonus(9)).toBe(4);
      expect(calculateProficiencyBonus(13)).toBe(5);
      expect(calculateProficiencyBonus(17)).toBe(6);
      expect(calculateProficiencyBonus(20)).toBe(6);
    });
  });

  describe('applyLongRest', () => {
    it('deve restaurar PV ao máximo, recuperar slots de magia e zerar mortes', () => {
      const sheet = createEmptyCharacterSheet('test-1');
      sheet.currentHp = 2;
      sheet.maxHp = 30;
      sheet.deathSaves = { successes: 2, failures: 1 };
      sheet.spellSlots = {
        1: { total: 4, used: 2 },
        2: { total: 2, used: 1 },
      };

      const updated = applyLongRest(sheet);

      expect(updated.currentHp).toBe(30);
      expect(updated.deathSaves.successes).toBe(0);
      expect(updated.deathSaves.failures).toBe(0);
      expect(updated.spellSlots[1].used).toBe(0);
      expect(updated.spellSlots[2].used).toBe(0);
    });
  });

  describe('recalculateSheetDerivedStats', () => {
    it('deve recalcular CA e HP Max baseado na classe e atributos', () => {
      const sheet = createEmptyCharacterSheet('test-2');
      sheet.className = 'Guerreiro';
      sheet.level = 1;
      sheet.attributes.con.score = 14; // Mod CON +2

      const updated = recalculateSheetDerivedStats(sheet);

      expect(updated.maxHp).toBe(12); // 10 (Hit Die d10) + 2 (CON)
      expect(updated.currentHp).toBeGreaterThan(0);
    });
  });
});
