import { describe, it, expect } from 'vitest';
import {
  checkPassivePerceptionDetection,
  calculateTrapDamage,
  evaluateTokenStep,
  attemptDisarmTrap,
} from '@/lib/reactive/reactiveSceneEngine';
import { ReactiveTrapEffect } from '@/lib/reactive/reactiveTypes';
import { TRAP_PRESETS } from '@/lib/reactive/trapPresets';

describe('Reactive Scenes & Traps Engine (BG3 Style)', () => {
  describe('Passive Perception Detection', () => {
    const spikeTrap: ReactiveTrapEffect = {
      ...TRAP_PRESETS.spike_pit,
      detectDC: 13,
      revealedToPlayers: false,
    };

    it('should detect hidden trap if passive perception is greater than or equal to detectDC', () => {
      expect(checkPassivePerceptionDetection(14, spikeTrap)).toBe(true);
      expect(checkPassivePerceptionDetection(13, spikeTrap)).toBe(true);
    });

    it('should NOT detect hidden trap if passive perception is below detectDC', () => {
      expect(checkPassivePerceptionDetection(12, spikeTrap)).toBe(false);
      expect(checkPassivePerceptionDetection(9, spikeTrap)).toBe(false);
    });

    it('should always be detected if trap is already revealed', () => {
      const revealedTrap = { ...spikeTrap, revealedToPlayers: true };
      expect(checkPassivePerceptionDetection(5, revealedTrap)).toBe(true);
    });
  });

  describe('Damage Calculations', () => {
    it('should return 0 damage for utility or 0-damage hazards', () => {
      expect(calculateTrapDamage('0')).toBe(0);
      expect(calculateTrapDamage('')).toBe(0);
    });

    it('should calculate damage within bounds for standard dice notations', () => {
      const dmg = calculateTrapDamage('2d10');
      expect(dmg).toBeGreaterThanOrEqual(2);
      expect(dmg).toBeLessThanOrEqual(20);
    });

    it('should respect fixed roll overrides', () => {
      expect(calculateTrapDamage('5d8', 25)).toBe(25);
    });
  });

  describe('Token Step Evaluation', () => {
    it('should detect early and pause token without triggering if passive perception passes', () => {
      const trap = { ...TRAP_PRESETS.poison_dart, detectDC: 14, isArmed: true, revealedToPlayers: false };

      const result = evaluateTokenStep({
        tokenName: 'Ladino Sagaz',
        passivePerception: 15, // >= 14
        trap,
      });

      expect(result.triggered).toBe(false);
      expect(result.detectedEarly).toBe(true);
      expect(result.updatedTrap.revealedToPlayers).toBe(true);
      expect(result.updatedTrap.isArmed).toBe(true); // Still armed
      expect(result.message).toContain('notou');
    });

    it('should trigger and apply full damage on failed saving throw', () => {
      const trap = {
        ...TRAP_PRESETS.spike_pit,
        saveStat: 'dex' as const,
        saveDC: 13,
        damageDice: '2d10',
        conditionApplied: 'Caído',
        isArmed: true,
      };

      const result = evaluateTokenStep({
        tokenName: 'Bárbaro Distraído',
        passivePerception: 10, // < 13
        trap,
        saveRollOverride: 8, // Fail vs DC 13
        damageRollOverride: 14,
      });

      expect(result.triggered).toBe(true);
      expect(result.saveSuccess).toBe(false);
      expect(result.damageDealt).toBe(14);
      expect(result.conditionApplied).toBe('Caído');
      expect(result.updatedTrap.isArmed).toBe(false); // One-shot triggered
    });

    it('should halve damage on successful saving throw', () => {
      const trap = {
        ...TRAP_PRESETS.fire_glyph,
        saveStat: 'dex' as const,
        saveDC: 15,
        damageDice: '5d8',
        isArmed: true,
      };

      const result = evaluateTokenStep({
        tokenName: 'Monge Ágil',
        passivePerception: 10,
        trap,
        saveRollOverride: 18, // Pass vs DC 15
        damageRollOverride: 20,
      });

      expect(result.triggered).toBe(true);
      expect(result.saveSuccess).toBe(true);
      expect(result.damageDealt).toBe(10); // 20 / 2 = 10
    });

    it('should execute linked pressure plate trigger without damage', () => {
      const plate = { ...TRAP_PRESETS.portcullis_plate, targetId: 'grade_principal', isArmed: true };

      const result = evaluateTokenStep({
        tokenName: 'Paladino',
        passivePerception: 9,
        trap: plate,
      });

      expect(result.triggered).toBe(true);
      expect(result.damageDealt).toBe(0);
      expect(result.linkedTriggerExecuted).toBe(true);
      expect(result.linkedTargetId).toBe('grade_principal');
    });

    it('should not trigger if trap is already disarmed', () => {
      const disarmedTrap = { ...TRAP_PRESETS.spike_pit, isArmed: false };

      const result = evaluateTokenStep({
        tokenName: 'Guerreiro',
        passivePerception: 10,
        trap: disarmedTrap,
      });

      expect(result.triggered).toBe(false);
      expect(result.damageDealt).toBe(0);
      expect(result.message).toContain('desarmado');
    });
  });

  describe('Trap Disarming Attempts', () => {
    const dartTrap = { ...TRAP_PRESETS.poison_dart, disarmDC: 15, isArmed: true };

    it('should successfully disarm when roll + mod >= disarmDC', () => {
      const { result, updatedTrap } = attemptDisarmTrap({
        characterName: 'Ladino Especialista',
        trap: dartTrap,
        roll: 12,
        modifier: 5, // Total 17 >= 15
      });

      expect(result.success).toBe(true);
      expect(result.critFail).toBe(false);
      expect(updatedTrap.isArmed).toBe(false);
      expect(result.message).toContain('desarmou o mecanismo');
    });

    it('should fail safely when roll is close to DC', () => {
      const { result, updatedTrap } = attemptDisarmTrap({
        characterName: 'Guerreiro',
        trap: dartTrap,
        roll: 11,
        modifier: 1, // Total 12 < 15, but >= 10
      });

      expect(result.success).toBe(false);
      expect(result.critFail).toBe(false);
      expect(result.accidentallyTriggered).toBe(false);
      expect(updatedTrap.isArmed).toBe(true);
    });

    it('should trigger accidental activation on critical failure (nat 1 or fail by 5+)', () => {
      const { result } = attemptDisarmTrap({
        characterName: 'Bárbaro Impaciente',
        trap: dartTrap,
        roll: 1, // Natural 1
        modifier: 0,
      });

      expect(result.success).toBe(false);
      expect(result.critFail).toBe(true);
      expect(result.accidentallyTriggered).toBe(true);
      expect(result.message).toContain('FALHA CRÍTICA');
    });
  });
});
