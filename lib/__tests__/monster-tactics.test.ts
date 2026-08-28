import { describe, it, expect } from 'vitest';

describe('AI Monster Tactics - Heuristics & Rules Engine', () => {
  const getArchetype = (int: number) => {
    if (int <= 4) return 'beast';
    if (int <= 8) return 'cunning_predator';
    if (int <= 14) return 'tactical_soldier';
    if (int <= 18) return 'tactical_master';
    return 'arcane_genius';
  };

  it('classifies monsters into correct intelligence tiers', () => {
    expect(getArchetype(2)).toBe('beast'); // Lobo / Rato gigante
    expect(getArchetype(7)).toBe('cunning_predator'); // Ogre / Orc comum
    expect(getArchetype(12)).toBe('tactical_soldier'); // Capitão da guarda
    expect(getArchetype(17)).toBe('tactical_master'); // Mago / Dragão jovem
    expect(getArchetype(20)).toBe('arcane_genius'); // Lich / Dragão Ancião
  });

  it('prioritizes concentrating casters and low HP targets', () => {
    const opponents = [
      { name: 'Bárbaro Thorin', hp: 65, isConcentrating: false },
      { name: 'Clérigo Elion', hp: 30, isConcentrating: true },
      { name: 'Ladino Varis', hp: 12, isConcentrating: false },
    ];

    const pickPriorityTarget = (ops: typeof opponents, archetype: string) => {
      if (archetype === 'arcane_genius' || archetype === 'tactical_master') {
        return ops.find((o) => o.isConcentrating) || ops[0];
      }
      if (archetype === 'cunning_predator') {
        return [...ops].sort((a, b) => a.hp - b.hp)[0];
      }
      return ops[0]; // Beast attacks first/closest
    };

    // Genius targets the concentrating Cleric
    expect(pickPriorityTarget(opponents, 'arcane_genius')?.name).toBe('Clérigo Elion');

    // Predator targets the lowest HP rogue (12 HP)
    expect(pickPriorityTarget(opponents, 'cunning_predator')?.name).toBe('Ladino Varis');
  });

  it('validates complete structure of fallback tactics payload', () => {
    const fallback = {
      primaryAction: 'Conjurar Raio Desintegrador no Clérigo',
      targetName: 'Clérigo Elion',
      movementAdvice: 'Levitar 6 metros acima do solo',
      bonusOrReaction: 'Guardar Counterspell para curas',
      roleplayQuote: 'Sua divindade não tem poder aqui!',
      tacticalReasoning: 'Quebra de concentração e eliminação do suporte.',
    };

    expect(fallback.primaryAction).toBeDefined();
    expect(fallback.targetName).toBe('Clérigo Elion');
    expect(fallback.movementAdvice).toBeDefined();
    expect(fallback.bonusOrReaction).toBeDefined();
    expect(fallback.roleplayQuote).toBeDefined();
  });
});
