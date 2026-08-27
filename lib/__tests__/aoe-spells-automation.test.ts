import { describe, it, expect } from 'vitest';
import { getSpellAoEDefinition, SPELL_SHAPES_MAPPING } from '../dnd5e-spells-shapes';
import {
  findTokensInAoE,
  isInsideCircle,
  isInsideCone,
  isInsideLine,
  isInsideBox,
  TargetableToken,
} from '../vision/aoeCollision';

describe('dnd5e-spells-shapes', () => {
  it('should return fireball properties with circle shape, DEX save and half on save', () => {
    const fireball = getSpellAoEDefinition('Bola de Fogo');
    expect(fireball.shape).toBe('circle');
    expect(fireball.size).toBe(6);
    expect(fireball.saveAbility).toBe('DEX');
    expect(fireball.saveHalves).toBe(true);
    expect(fireball.damageType).toBe('Fogo');
  });

  it('should return burning hands properties with cone shape', () => {
    const bh = getSpellAoEDefinition('Burning Hands');
    expect(bh.shape).toBe('cone');
    expect(bh.size).toBe(4.5);
    expect(bh.saveAbility).toBe('DEX');
  });

  it('should return lightning bolt properties with line shape', () => {
    const lb = getSpellAoEDefinition('Relâmpago');
    expect(lb.shape).toBe('line');
    expect(lb.size).toBe(30);
    expect(lb.width).toBe(1.5);
    expect(lb.saveAbility).toBe('DEX');
  });

  it('should correctly flag concentration spells', () => {
    const spiritGuardians = getSpellAoEDefinition('Guardiões Espirituais');
    expect(spiritGuardians.requiresConcentration).toBe(true);

    const hypnoticPattern = getSpellAoEDefinition('Hypnotic Pattern');
    expect(hypnoticPattern.requiresConcentration).toBe(true);
    expect(hypnoticPattern.saveAbility).toBe('WIS');
  });
});

describe('aoeCollision Geometry', () => {
  const dummyTokens: TargetableToken[] = [
    { id: 't1', name: 'Goblin 1', position: { x: 0, z: 5 }, sizeUnits: 1.5 },
    { id: 't2', name: 'Goblin 2', position: { x: 2, z: 5 }, sizeUnits: 1.5 },
    { id: 't3', name: 'Orc Leader', position: { x: 0, z: 15 }, sizeUnits: 3 },
    { id: 't4', name: 'Archer Behind', position: { x: 0, z: -5 }, sizeUnits: 1.5 },
    { id: 't5', name: 'Far Away Wizard', position: { x: 50, z: 50 }, sizeUnits: 1.5 },
  ];

  it('detects tokens inside Circle AoE correctly', () => {
    const center = { x: 0, z: 5 };
    const radius = 6; // 20ft Fireball radius

    const hits = findTokensInAoE(
      {
        shape: 'circle',
        origin: center,
        target: center,
        size: radius,
      },
      dummyTokens
    );

    const hitIds = hits.map((t) => t.id);
    expect(hitIds).toContain('t1');
    expect(hitIds).toContain('t2');
    expect(hitIds).not.toContain('t4');
    expect(hitIds).not.toContain('t5');
  });

  it('detects tokens inside Cone AoE correctly', () => {
    // Caster at (0,0) facing towards North (0, 10)
    const origin = { x: 0, z: 0 };
    const target = { x: 0, z: 10 };
    const length = 6;

    const hits = findTokensInAoE(
      {
        shape: 'cone',
        origin,
        target,
        size: length,
        coneAngleDeg: 53.13,
      },
      dummyTokens
    );

    const hitIds = hits.map((t) => t.id);
    expect(hitIds).toContain('t1'); // at (0, 5) directly in front
    expect(hitIds).not.toContain('t4'); // behind caster at (0, -5)
    expect(hitIds).not.toContain('t5');
  });

  it('detects tokens along a Line AoE correctly', () => {
    // Lightning Bolt from (0,0) along Z axis to (0, 30)
    const origin = { x: 0, z: 0 };
    const target = { x: 0, z: 30 };
    const length = 30;

    const hits = findTokensInAoE(
      {
        shape: 'line',
        origin,
        target,
        size: length,
        width: 1.5,
      },
      dummyTokens
    );

    const hitIds = hits.map((t) => t.id);
    expect(hitIds).toContain('t1'); // at (0, 5)
    expect(hitIds).toContain('t3'); // at (0, 15)
    expect(hitIds).not.toContain('t4'); // at (0, -5) behind
    expect(hitIds).not.toContain('t5');
  });

  it('detects tokens inside Box AoE correctly', () => {
    const center = { x: 0, z: 5 };
    const size = 6;

    const hits = findTokensInAoE(
      {
        shape: 'box',
        origin: center,
        target: center,
        size,
      },
      dummyTokens
    );

    const hitIds = hits.map((t) => t.id);
    expect(hitIds).toContain('t1');
    expect(hitIds).toContain('t2');
    expect(hitIds).not.toContain('t5');
  });
});
