import { describe, it, expect } from 'vitest';
import { parseDiceCommand, isDiceCommand } from '../chat-dice-parser';

describe('chat-dice-parser', () => {
  describe('isDiceCommand', () => {
    it('should detect /roll and /r commands', () => {
      expect(isDiceCommand('/roll 1d20')).toBe(true);
      expect(isDiceCommand('/r 2d6+3')).toBe(true);
      expect(isDiceCommand('/roll')).toBe(false);
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
    });

    it('should parse multiple dice groups and modifiers', () => {
      const result = parseDiceCommand('/r 2d6 + 1d4 + 5');
      expect(result).not.toBeNull();
      expect(result!.formula).toBe('2d6 + 1d4 + 5');
      expect(result!.rolls.length).toBe(3); // 2 + 1
      expect(result!.total).toBeGreaterThanOrEqual(8); // min: 2 + 1 + 5
      expect(result!.total).toBeLessThanOrEqual(21); // max: 12 + 4 + 5
    });

    it('should handle negative modifiers', () => {
      const result = parseDiceCommand('/roll 1d10 - 2');
      expect(result).not.toBeNull();
      expect(result!.formula).toBe('1d10 - 2');
      expect(result!.rolls.length).toBe(1);
      // Min limit of total is 0 in parseDiceCommand implementation
      expect(result!.total).toBeGreaterThanOrEqual(0);
    });

    it('should return null for invalid commands', () => {
      expect(parseDiceCommand('/roll hello')).toBeNull();
      expect(parseDiceCommand('/r +5')).toBeNull();
    });
  });
});
