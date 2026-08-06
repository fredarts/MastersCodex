import { describe, it, expect } from 'vitest';
import { parseDiceCommand, isDiceCommand, interpolateMacroVariables } from '../chat-dice-parser';
import { CharacterSheet } from '../types';

describe('chat-dice-parser', () => {
  describe('isDiceCommand', () => {
    it('should detect /roll, /r, /gmroll and /blindroll commands', () => {
      expect(isDiceCommand('/roll 1d20')).toBe(true);
      expect(isDiceCommand('/r 2d6+3')).toBe(true);
      expect(isDiceCommand('/gmroll 1d20+5')).toBe(true);
      expect(isDiceCommand('/blindroll 2d6')).toBe(true);
      expect(isDiceCommand('hello /roll 1d20')).toBe(false);
    });
  });

  describe('parseDiceCommand', () => {
    it('should parse single dice commands', () => {
      const result = parseDiceCommand('/roll 1d20');
      expect(result).not.toBeNull();
      expect(result!.formula).toBe('1d20');
      expect(result!.rolls.length).toBe(1);
      expect(result!.total).toBeGreaterThanOrEqual(1);
      expect(result!.total).toBeLessThanOrEqual(20);
      expect(result!.visibility).toBe('public');
      expect(result!.isSecret).toBe(false);
    });

    it('should parse GM secret rolls (/gmroll)', () => {
      const result = parseDiceCommand('/gmroll 1d20+5');
      expect(result).not.toBeNull();
      expect(result!.visibility).toBe('gm');
      expect(result!.isSecret).toBe(true);
    });

    it('should parse Blind secret rolls (/blindroll)', () => {
      const result = parseDiceCommand('/blindroll 2d6+3');
      expect(result).not.toBeNull();
      expect(result!.visibility).toBe('blind');
      expect(result!.isSecret).toBe(true);
    });

    it('should parse Keep Highest (kh) and Drop Lowest (dl)', () => {
      const khResult = parseDiceCommand('/roll 2d20kh1+4');
      expect(khResult).not.toBeNull();
      expect(khResult!.rolls.length).toBe(1); // kept 1

      const dlResult = parseDiceCommand('/roll 4d6dl1+2');
      expect(dlResult).not.toBeNull();
      expect(dlResult!.rolls.length).toBe(3); // kept 3 out of 4
    });

    it('should handle negative modifiers', () => {
      const result = parseDiceCommand('/roll 1d10 - 2');
      expect(result).not.toBeNull();
      expect(result!.rolls.length).toBe(1);
      expect(result!.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('interpolateMacroVariables', () => {
    it('should substitute attribute variables from character sheet', () => {
      const mockSheet: Partial<CharacterSheet> = {
        level: 5,
        attributes: {
          str: { score: 18 }, // mod +4
          dex: { score: 14 }, // mod +2
          con: { score: 12 },
          int: { score: 10 },
          wis: { score: 8 },
          cha: { score: 16 },
        },
      };

      const result = interpolateMacroVariables('/r 1d20+@str+@pb', mockSheet as CharacterSheet);
      expect(result).toBe('/r 1d20+4+3');
    });
  });
});
