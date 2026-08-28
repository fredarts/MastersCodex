import { describe, it, expect } from 'vitest';
import { 
  feetToUnits, 
  isTokenInsideAura, 
  evaluateAuraTriggersOnMove, 
  calculateAuraBuffsForCombatant,
  isTargetEligibleForAura
} from '../auras/auraEngine';
import { createAuraFromPreset } from '../auras/auraPresets';
import { Combatant } from '../types';

describe('Aura Engine - Spatial Mathematics & Triggers', () => {
  const paladin: Combatant = {
    id: 'paladin-1',
    name: 'Alden the Paladin',
    type: 'player',
    hp: 45,
    maxHp: 45,
    ac: 18,
    initiative: 12,
    conditions: [],
    cha: 18, // +4 Mod
    auras: [
      createAuraFromPreset('spirit_guardians', 'paladin-1', 'Alden the Paladin'),
      createAuraFromPreset('aura_of_protection', 'paladin-1', 'Alden the Paladin'),
    ],
  };

  const rogue: Combatant = {
    id: 'rogue-1',
    name: 'Vax the Rogue',
    type: 'player',
    hp: 30,
    maxHp: 30,
    ac: 15,
    initiative: 18,
    conditions: [],
  };

  const goblin: Combatant = {
    id: 'goblin-1',
    name: 'Goblin Sneak',
    type: 'monster',
    hp: 7,
    maxHp: 7,
    ac: 13,
    initiative: 14,
    conditions: [],
  };

  it('converts feet to metric grid units correctly (5ft = 1.5m)', () => {
    expect(feetToUnits(5)).toBe(1.5);
    expect(feetToUnits(10)).toBe(3.0);
    expect(feetToUnits(15)).toBe(4.5);
    expect(feetToUnits(30)).toBe(9.0);
  });

  it('identifies targets eligible based on aura faction filter', () => {
    const enemyAura = createAuraFromPreset('spirit_guardians', paladin.id, paladin.name);
    const allyAura = createAuraFromPreset('aura_of_protection', paladin.id, paladin.name);

    expect(isTargetEligibleForAura(paladin, goblin, enemyAura.affects)).toBe(true);
    expect(isTargetEligibleForAura(paladin, rogue, enemyAura.affects)).toBe(false);

    expect(isTargetEligibleForAura(paladin, rogue, allyAura.affects)).toBe(true);
    expect(isTargetEligibleForAura(paladin, goblin, allyAura.affects)).toBe(false);
  });

  it('detects when an enemy enters Spirit Guardians aura on movement', () => {
    const spiritGuardians = paladin.auras![0];

    // Paladin está na origem (0, 0)
    const tokenPositions = {
      'paladin-1': { x: 0, z: 0 },
      'goblin-1': { x: 10, z: 0 }, // Fora dos 15ft (4.5m)
    };

    // Goblin se move de (10, 0) para (3, 0) -> dentro dos 4.5m
    const triggers = evaluateAuraTriggersOnMove({
      movedCombatant: goblin,
      previousPos: { x: 10, z: 0 },
      newPos: { x: 3, z: 0 },
      allCombatants: [paladin, goblin],
      tokenPositions,
    });

    expect(triggers.length).toBe(1);
    expect(triggers[0].aura.name).toContain('Guardiões Espirituais');
    expect(triggers[0].targetCombatantId).toBe('goblin-1');
    expect(triggers[0].triggerType).toBe('ENTER');
  });

  it('does NOT trigger if enemy stays outside the aura', () => {
    const tokenPositions = {
      'paladin-1': { x: 0, z: 0 },
      'goblin-1': { x: 10, z: 0 },
    };

    const triggers = evaluateAuraTriggersOnMove({
      movedCombatant: goblin,
      previousPos: { x: 10, z: 0 },
      newPos: { x: 8, z: 0 }, // Ainda fora (> 4.5m + raio)
      allCombatants: [paladin, goblin],
      tokenPositions,
    });

    expect(triggers.length).toBe(0);
  });

  it('calculates passive aura buffs for allies within Aura of Protection (10ft)', () => {
    const tokenPositions = {
      'paladin-1': { x: 0, z: 0 },
      'rogue-1': { x: 2, z: 0 }, // 2m <= 3m (10ft) -> dentro!
    };

    const buffs = calculateAuraBuffsForCombatant({
      targetCombatant: rogue,
      allCombatants: [paladin, rogue, goblin],
      tokenPositions,
    });

    expect(buffs.length).toBe(1);
    expect(buffs[0].auraName).toContain('Aura de Proteção');
    // Paladin tem CHA 18 -> Modificador +4
    expect(buffs[0].statModifier?.savingThrowsBonus).toBe(4);
  });

  it('removes aura buff when ally is outside the 10ft radius', () => {
    const tokenPositions = {
      'paladin-1': { x: 0, z: 0 },
      'rogue-1': { x: 5, z: 0 }, // 5m > 3m (10ft) -> fora!
    };

    const buffs = calculateAuraBuffsForCombatant({
      targetCombatant: rogue,
      allCombatants: [paladin, rogue, goblin],
      tokenPositions,
    });

    expect(buffs.length).toBe(0);
  });
});
