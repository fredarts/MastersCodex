import { describe, it, expect } from 'vitest';
import { evaluateOmnibarQuery, matchesQuery, normalizeText } from '../omnibar-engine';
import { Combatant } from '../types';

describe('Omnibar Engine & Query Evaluator', () => {
  const mockCombatants: Combatant[] = [
    {
      id: 'c-1',
      name: 'Kirion Paladino',
      maxHp: 24,
      currentHp: 18,
      tempHp: 0,
      ac: 18,
      initiative: 15,
      isPlayer: true,
      conditions: ['Concentração'],
    },
    {
      id: 'c-2',
      name: 'Goblin Arqueiro',
      maxHp: 7,
      currentHp: 7,
      tempHp: 0,
      ac: 13,
      initiative: 12,
      isPlayer: false,
      conditions: [],
    },
  ];

  it('normalizes accents and text correctly', () => {
    expect(normalizeText('Magia: Bola de Fogo!')).toBe('magia: bola de fogo!');
    expect(normalizeText('Concentração e Salvaguarda')).toBe('concentracao e salvaguarda');
  });

  it('evaluates dice rolling commands accurately', () => {
    const results = evaluateOmnibarQuery('1d20+5', { combatants: mockCombatants });
    expect(results.length).toBeGreaterThan(0);
    const diceItem = results.find((r) => r.category === 'dice');
    expect(diceItem).toBeDefined();
    expect(diceItem?.payload?.formula).toBe('1d20+5');
  });

  it('recognizes secret GM roll commands (/gmr)', () => {
    const results = evaluateOmnibarQuery('/gmr 2d6+3', { combatants: mockCombatants });
    const secretRoll = results.find((r) => r.payload?.isSecret === true);
    expect(secretRoll).toBeDefined();
    expect(secretRoll?.badge).toBe('SECRETO');
  });

  it('filters combatants and suggests condition application (@goblin)', () => {
    const results = evaluateOmnibarQuery('@goblin', { combatants: mockCombatants });
    const targetItem = results.find((r) => r.category === 'combatant');
    expect(targetItem).toBeDefined();
    expect(targetItem?.title).toContain('Goblin Arqueiro');
  });

  it('searches for SRD spells with prefix !m or name', () => {
    const results = evaluateOmnibarQuery('!m missil magico', { combatants: mockCombatants });
    const spellItem = results.find((r) => r.category === 'spell');
    expect(spellItem).toBeDefined();
    expect(spellItem?.title).toContain('Míssil Mágico');
  });

  it('searches for official 5e rules with !regra', () => {
    const results = evaluateOmnibarQuery('!regra concentracao', { combatants: mockCombatants });
    const ruleItem = results.find((r) => r.category === 'rule');
    expect(ruleItem).toBeDefined();
    expect(ruleItem?.title).toContain('Concentração');
  });

  it('provides audio control actions', () => {
    const results = evaluateOmnibarQuery('musica pausar', {
      combatants: mockCombatants,
      isPlayingBgm: true,
      activeBgmTitle: 'Batalha Épica',
    });
    const audioItem = results.find((r) => r.category === 'audio');
    expect(audioItem).toBeDefined();
    expect(audioItem?.payload?.action).toBe('pause');
  });
});
