/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rollD20, executeCheckRoll, executeWeaponAttackRoll } from '../dnd5e-dice';
import { CharacterSheet } from '../types';

describe('D&D 5e Dice Rules Unit Tests', () => {
  let mathRandomSpy: any;

  beforeEach(() => {
    // Spy on Math.random to make rolls predictable
    mathRandomSpy = vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  describe('rollD20', () => {
    it('deve rolar d20 normal e retornar o valor correspondente', () => {
      // 0.49 * 20 = 9.8 -> Math.floor + 1 = 10
      mathRandomSpy.mockReturnValue(0.49);
      const roll = rollD20('normal');
      expect(roll.d20Roll1).toBe(10);
      expect(roll.d20Roll2).toBeUndefined();
      expect(roll.selectedD20).toBe(10);
    });

    it('deve rolar com vantagem e selecionar o maior valor', () => {
      // Primeiro rola 5 (0.2), depois rola 15 (0.7)
      mathRandomSpy
        .mockReturnValueOnce(0.2) // (0.2 * 20) + 1 = 5
        .mockReturnValueOnce(0.7); // (0.7 * 20) + 1 = 15

      const roll = rollD20('advantage');
      expect(roll.d20Roll1).toBe(5);
      expect(roll.d20Roll2).toBe(15);
      expect(roll.selectedD20).toBe(15);
    });

    it('deve rolar com desvantagem e selecionar o menor valor', () => {
      // Primeiro rola 18 (0.85), depois rola 8 (0.35)
      mathRandomSpy
        .mockReturnValueOnce(0.85) // (0.85 * 20) + 1 = 18
        .mockReturnValueOnce(0.35); // (0.35 * 20) + 1 = 8

      const roll = rollD20('disadvantage');
      expect(roll.d20Roll1).toBe(18);
      expect(roll.d20Roll2).toBe(8);
      expect(roll.selectedD20).toBe(8);
    });
  });

  describe('executeCheckRoll', () => {
    const mockSheet = {
      id: 'char-123',
      characterName: 'Melf',
      avatarUrl: 'https://avatar.url',
    } as unknown as CharacterSheet;

    it('deve calcular o total correto somando o modificador', () => {
      mathRandomSpy.mockReturnValue(0.49); // d20 = 10
      const event = executeCheckRoll({
        sheet: mockSheet,
        label: 'Atletismo',
        modifier: 4,
        rollType: 'skill',
      });

      expect(event.characterId).toBe('char-123');
      expect(event.characterName).toBe('Melf');
      expect(event.label).toBe('Atletismo');
      expect(event.modifier).toBe(4);
      expect(event.selectedD20).toBe(10);
      expect(event.total).toBe(14);
      expect(event.isCrit).toBe(false);
      expect(event.isFail).toBe(false);
    });

    it('deve marcar acerto crítico se rolar 20 natural', () => {
      mathRandomSpy.mockReturnValue(0.999); // d20 = 20
      const event = executeCheckRoll({
        sheet: mockSheet,
        label: 'Ataque Espada',
        modifier: 2,
        rollType: 'attack',
      });

      expect(event.selectedD20).toBe(20);
      expect(event.total).toBe(22);
      expect(event.isCrit).toBe(true);
      expect(event.isFail).toBe(false);
    });

    it('deve marcar falha crítica se rolar 1 natural', () => {
      mathRandomSpy.mockReturnValue(0.0); // d20 = 1
      const event = executeCheckRoll({
        sheet: mockSheet,
        label: 'Ataque Espada',
        modifier: 5,
        rollType: 'attack',
      });

      expect(event.selectedD20).toBe(1);
      expect(event.total).toBe(6);
      expect(event.isCrit).toBe(false);
      expect(event.isFail).toBe(true);
    });

    it('deve marcar acerto crítico com 19 se for Campeão nv3+', () => {
      const champSheet = { ...mockSheet, className: 'Guerreiro', subclass: 'Campeão', level: 5 };
      mathRandomSpy.mockReturnValue(0.94); // 0.94 * 20 = 18.8 -> 19

      const event = executeCheckRoll({
        sheet: champSheet as any,
        label: 'Ataque Espada',
        modifier: 2,
        rollType: 'attack',
      });

      expect(event.selectedD20).toBe(19);
      expect(event.isCrit).toBe(true);
    });

    it('deve marcar acerto crítico com 18 se for Campeão nv15+', () => {
      const champSheet = { ...mockSheet, className: 'Guerreiro', subclass: 'Campeão', level: 16 };
      mathRandomSpy.mockReturnValue(0.89); // 0.89 * 20 = 17.8 -> 18

      const event = executeCheckRoll({
        sheet: champSheet as any,
        label: 'Ataque Espada',
        modifier: 2,
        rollType: 'attack',
      });

      expect(event.selectedD20).toBe(18);
      expect(event.isCrit).toBe(true);
    });
  });

  describe('executeWeaponAttackRoll', () => {
    const mockSheet = {
      id: 'char-456',
      characterName: 'Drizzt',
      avatarUrl: 'https://avatar.url',
    } as unknown as CharacterSheet;

    it('deve rolar ataque e dano com a fórmula corretamente', () => {
      // Math.random para ataque (0.7 -> 15) e depois para o dano de 2d6 (0.5 -> 4 e 0.83 -> 6)
      mathRandomSpy
        .mockReturnValueOnce(0.7)  // ataque: (0.7 * 20) + 1 = 15
        .mockReturnValueOnce(0.5)  // dano 1: (0.5 * 6) + 1 = 4
        .mockReturnValueOnce(0.9); // dano 2: (0.9 * 6) + 1 = 6

      const result = executeWeaponAttackRoll({
        sheet: mockSheet,
        weaponName: 'Cimitarra',
        atkBonusStr: '+7',
        damageStr: '2d6 + 3',
        damageType: 'Cortante',
      });

      expect(result.attackRoll.total).toBe(22); // 15 + 7
      expect(result.attackRoll.label).toBe('Ataque: Cimitarra');

      expect(result.damageRoll.damageDice).toBe('2d6 + 3');
      expect(result.damageRoll.damageType).toBe('Cortante');
      // 4 + 6 + 3 = 13
      expect(result.damageRoll.total).toBe(13);
    });

    it('deve usar valor estático se a fórmula do dano for apenas um número', () => {
      mathRandomSpy.mockReturnValueOnce(0.5); // ataque: (0.5 * 20) + 1 = 11

      const result = executeWeaponAttackRoll({
        sheet: mockSheet,
        weaponName: 'Dardo',
        atkBonusStr: '+4',
        damageStr: '5',
        damageType: 'Perfurante',
      });

      expect(result.attackRoll.total).toBe(15); // 11 + 4
      expect(result.damageRoll.damageDice).toBe('5');
      expect(result.damageRoll.total).toBe(5);
    });

    it('deve garantir que o dano mínimo seja sempre pelo menos 1', () => {
      mathRandomSpy
        .mockReturnValueOnce(0.5) // ataque d20
        .mockReturnValueOnce(0.0); // dano d4: 1

      const result = executeWeaponAttackRoll({
        sheet: mockSheet,
        weaponName: 'Adaga',
        atkBonusStr: '+2',
        damageStr: '1d4 - 5',
      });

      // 1 - 5 = -4, mas deve ter um fallback para Math.max(1, total)
      expect(result.damageRoll.total).toBe(1);
    });
  });
});
