import { describe, it, expect } from 'vitest';
import {
  normalizeDamageType,
  parseDamageInfo,
  calculateEffectiveDamage,
  DND5E_DAMAGE_TYPES,
} from '../dnd5e-damage-resolver';

describe('dnd5e-damage-resolver', () => {
  describe('normalizeDamageType', () => {
    it('deve normalizar tipos em português com acentos e variações', () => {
      expect(normalizeDamageType('Ácido')?.id).toBe('acido');
      expect(normalizeDamageType('dano de fogo')?.id).toBe('fogo');
      expect(normalizeDamageType('cortante')?.id).toBe('cortante');
      expect(normalizeDamageType('trovão')?.id).toBe('trovao');
      expect(normalizeDamageType('necrótico')?.id).toBe('necrotico');
    });

    it('deve normalizar tipos em inglês', () => {
      expect(normalizeDamageType('Fire')?.id).toBe('fogo');
      expect(normalizeDamageType('Slashing')?.id).toBe('cortante');
      expect(normalizeDamageType('Bludgeoning')?.id).toBe('concussao');
      expect(normalizeDamageType('Lightning')?.id).toBe('eletrico');
      expect(normalizeDamageType('Psychic')?.id).toBe('psiquico');
    });

    it('deve retornar null para valores inválidos', () => {
      expect(normalizeDamageType('')).toBeNull();
      expect(normalizeDamageType(undefined)).toBeNull();
      expect(normalizeDamageType('madeira_invalida')).toBeNull();
    });
  });

  describe('parseDamageInfo', () => {
    it('deve extrair fórmula e tipo a partir da descrição da ação SRD', () => {
      const parsed1 = parseDamageInfo('Hit: 12 (2d6 + 5) dano de concussão.');
      expect(parsed1.formula).toBe('2d6+5');
      expect(parsed1.damageType).toBe('Concussão');

      const parsed2 = parseDamageInfo('Ataque com Arma: +6 para acertar, alcance 1.5m. Acerto: 8 (1d8 + 4) dano cortante.');
      expect(parsed2.formula).toBe('1d8+4');
      expect(parsed2.damageType).toBe('Cortante');

      const parsed3 = parseDamageInfo('1d6 + 2 dano de fogo');
      expect(parsed3.formula).toBe('1d6+2');
      expect(parsed3.damageType).toBe('Fogo');
    });

    it('deve usar fallback se não houver na descrição', () => {
      const parsed = parseDamageInfo('Ataque simples', 'Perfurante', '1d6');
      expect(parsed.formula).toBe('1d6');
      expect(parsed.damageType).toBe('Perfurante');
    });
  });

  describe('calculateEffectiveDamage', () => {
    it('deve aplicar dano normal quando o alvo não tem defesas', () => {
      const result = calculateEffectiveDamage({
        rawDamage: 14,
        damageType: 'Cortante',
        target: { damageResistances: [], damageImmunities: [], damageVulnerabilities: [] },
      });

      expect(result.effectiveDamage).toBe(14);
      expect(result.modifierType).toBe('none');
      expect(result.multiplier).toBe(1);
    });

    it('deve calcular Imunidade (dano reduzido a 0)', () => {
      const result = calculateEffectiveDamage({
        rawDamage: 25,
        damageType: 'Veneno',
        target: {
          damageImmunities: ['veneno', 'acido'],
          damageResistances: [],
          damageVulnerabilities: [],
        },
      });

      expect(result.effectiveDamage).toBe(0);
      expect(result.modifierType).toBe('immunity');
      expect(result.multiplier).toBe(0);
      expect(result.badgeLabel).toContain('Imune');
    });

    it('deve calcular Resistência (dano pela metade)', () => {
      const result = calculateEffectiveDamage({
        rawDamage: 15,
        damageType: 'Fogo',
        target: {
          damageResistances: ['fogo'],
          damageImmunities: [],
          damageVulnerabilities: [],
        },
      });

      expect(result.effectiveDamage).toBe(7); // Math.floor(15 / 2) = 7
      expect(result.modifierType).toBe('resistance');
      expect(result.multiplier).toBe(0.5);
      expect(result.badgeLabel).toContain('Resistência');
    });

    it('deve calcular Vulnerabilidade (dano dobrado)', () => {
      const result = calculateEffectiveDamage({
        rawDamage: 12,
        damageType: 'Radiante',
        target: {
          damageResistances: [],
          damageImmunities: [],
          damageVulnerabilities: ['radiante'],
        },
      });

      expect(result.effectiveDamage).toBe(24);
      expect(result.modifierType).toBe('vulnerability');
      expect(result.multiplier).toBe(2);
      expect(result.badgeLabel).toContain('Vulnerável');
    });

    it('deve priorizar Imunidade sobre Vulnerabilidade ou Resistência se ambos existirem', () => {
      const result = calculateEffectiveDamage({
        rawDamage: 20,
        damageType: 'Necrótico',
        target: {
          damageImmunities: ['necrotico'],
          damageVulnerabilities: ['necrotico'],
          damageResistances: ['necrotico'],
        },
      });

      expect(result.effectiveDamage).toBe(0);
      expect(result.modifierType).toBe('immunity');
    });
  });
});
