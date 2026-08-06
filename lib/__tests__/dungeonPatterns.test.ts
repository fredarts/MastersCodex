import { describe, it, expect } from 'vitest';
import { getAllDungeonPatterns, getPatternPromptInstructions, DYSON_LOGOS_MASTER_PATTERN } from '../ai/dungeon-patterns';

describe('Dungeon Patterns Engine', () => {
  it('deve incluir o padrão mestre do Dyson Logos por padrão', () => {
    const patterns = getAllDungeonPatterns();
    expect(patterns.length).toBeGreaterThanOrEqual(2);
    
    const dysonMaster = patterns.find(p => p.id === DYSON_LOGOS_MASTER_PATTERN.id);
    expect(dysonMaster).toBeDefined();
    expect(dysonMaster?.architecturalRules.hasPillaredChambers).toBe(true);
    expect(dysonMaster?.architecturalRules.hasSecretPassageLoops).toBe(true);
  });

  it('deve gerar instruções de prompt contendo as regras arquitetônicas do Dyson Logos', () => {
    const instructions = getPatternPromptInstructions(DYSON_LOGOS_MASTER_PATTERN.id);
    expect(instructions).toContain('ESTILO DE ARQUITETURA DE ELITE APLICADO');
    expect(instructions).toContain('Salão Central com Pilares');
    expect(instructions).toContain('Passagens Secretas em Loop (S)');
  });
});
