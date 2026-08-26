import { describe, it, expect } from 'vitest';
import {
  parseRangeString,
  calculateGridDistanceFeet,
  evaluateRangeStatus,
  formatDistanceDisplay,
  feetToMeters,
} from '../utils/dndRangeUtils';

describe('dndRangeUtils', () => {
  describe('feetToMeters', () => {
    it('converte 5ft para 1.5m', () => {
      expect(feetToMeters(5)).toBe(1.5);
    });

    it('converte 60ft para 18m', () => {
      expect(feetToMeters(60)).toBe(18);
    });

    it('converte 120ft para 36m', () => {
      expect(feetToMeters(120)).toBe(36);
    });

    it('converte 80ft para 24m', () => {
      expect(feetToMeters(80)).toBe(24);
    });

    it('converte 320ft para 96m', () => {
      expect(feetToMeters(320)).toBe(96);
    });
  });

  describe('parseRangeString', () => {
    it('analisa arma pelo nome exato (ex: Arco Longo -> 150/600 ft / 45/180m)', () => {
      const res = parseRangeString('Arco Longo');
      expect(res.normalRangeFt).toBe(150);
      expect(res.maxRangeFt).toBe(600);
      expect(res.normalRangeM).toBe(45);
      expect(res.maxRangeM).toBe(180);
      expect(res.isRanged).toBe(true);
      expect(res.isWeaponWithLongRange).toBe(true);
    });

    it('analisa ataque pelo título de ação (ex: Ataque: Arco Longo +1)', () => {
      const res = parseRangeString('Ataque: Arco Longo +1');
      expect(res.normalRangeFt).toBe(150);
      expect(res.maxRangeFt).toBe(600);
      expect(res.normalRangeM).toBe(45);
      expect(res.maxRangeM).toBe(180);
    });

    it('analisa propriedade de munição métrica PT-BR (ex: Munição (45/180m) e distância 45/180)', () => {
      const res1 = parseRangeString('Munição (45/180m)');
      expect(res1.normalRangeFt).toBe(150);
      expect(res1.maxRangeFt).toBe(600);

      const res2 = parseRangeString('distância 45/180');
      expect(res2.normalRangeFt).toBe(150);
      expect(res2.maxRangeFt).toBe(600);
    });

    it('analisa alcance duplo de arma (ex: Arco Curto 80/320 ft)', () => {
      const res = parseRangeString('80/320 ft');
      expect(res.normalRangeFt).toBe(80);
      expect(res.maxRangeFt).toBe(320);
      expect(res.normalRangeM).toBe(24);
      expect(res.maxRangeM).toBe(96);
      expect(res.isRanged).toBe(true);
      expect(res.isWeaponWithLongRange).toBe(true);
    });

    it('analisa alcance duplo de arma sem unidade (ex: 150/600)', () => {
      const res = parseRangeString('150/600');
      expect(res.normalRangeFt).toBe(150);
      expect(res.maxRangeFt).toBe(600);
      expect(res.normalRangeM).toBe(45);
      expect(res.maxRangeM).toBe(180);
      expect(res.isRanged).toBe(true);
      expect(res.isWeaponWithLongRange).toBe(true);
    });

    it('analisa magia com alcance único (ex: Raio de Fogo 120 ft)', () => {
      const res = parseRangeString('120 ft');
      expect(res.normalRangeFt).toBe(120);
      expect(res.maxRangeFt).toBe(120);
      expect(res.normalRangeM).toBe(36);
      expect(res.maxRangeM).toBe(36);
      expect(res.isRanged).toBe(true);
      expect(res.isWeaponWithLongRange).toBe(false);
    });

    it('analisa magia de toque (Touch)', () => {
      const res = parseRangeString('Touch');
      expect(res.normalRangeFt).toBe(5);
      expect(res.maxRangeFt).toBe(5);
      expect(res.isRanged).toBe(false);
    });

    it('analisa arma de haste / chicote (Reach 10ft)', () => {
      const res = parseRangeString('Chicote');
      expect(res.normalRangeFt).toBe(10);
      expect(res.isRanged).toBe(false);
    });

    it('analisa armas corpo a corpo padrão (Espada Longa, Machado, etc. -> 5ft / 1.5m)', () => {
      const res1 = parseRangeString('Espada Longa');
      expect(res1.normalRangeFt).toBe(5);
      expect(res1.maxRangeFt).toBe(5);
      expect(res1.normalRangeM).toBe(1.5);
      expect(res1.maxRangeM).toBe(1.5);
      expect(res1.isRanged).toBe(false);

      const res2 = parseRangeString('Ataque: Espada Curta');
      expect(res2.normalRangeFt).toBe(5);
      expect(res2.maxRangeFt).toBe(5);
      expect(res2.normalRangeM).toBe(1.5);
      expect(res2.maxRangeM).toBe(1.5);
      expect(res2.isRanged).toBe(false);
    });

    it('ignora fórmulas de dados de dano (ex: 1d8+3, 2d6) sem unidade, retornando 5ft / 1.5m', () => {
      const res1 = parseRangeString('1d8 + 3');
      expect(res1.normalRangeFt).toBe(5);
      expect(res1.normalRangeM).toBe(1.5);
      expect(res1.isRanged).toBe(false);

      const res2 = parseRangeString('2d6');
      expect(res2.normalRangeFt).toBe(5);
      expect(res2.normalRangeM).toBe(1.5);
      expect(res2.isRanged).toBe(false);
    });
  });

  describe('calculateGridDistanceFeet', () => {
    it('calcula distância em pés no grid 3D', () => {
      const pos1 = { x: 0, z: 0 };
      const pos2 = { x: 4, z: 0 }; // 2 unidades = 1 quadrado (5ft). 4 unidades = 2 quadrados (10ft)
      expect(calculateGridDistanceFeet(pos1, pos2)).toBe(10);
    });

    it('calcula distância diagonal no grid 3D', () => {
      const pos1 = { x: 0, z: 0 };
      const pos2 = { x: 6, z: 8 }; // Math.sqrt(3^2 + 4^2) = 5 quadrados = 25 pés
      expect(calculateGridDistanceFeet(pos1, pos2)).toBe(25);
    });
  });

  describe('evaluateRangeStatus', () => {
    const bowRange = parseRangeString('80/320 ft');
    const spellRange = parseRangeString('120 ft');

    it('retorna NORMAL para alvos dentro do alcance normal', () => {
      expect(evaluateRangeStatus(50, bowRange)).toBe('NORMAL');
      expect(evaluateRangeStatus(80, bowRange)).toBe('NORMAL');
      expect(evaluateRangeStatus(100, spellRange)).toBe('NORMAL');
    });

    it('retorna LONG_RANGE para armas entre o alcance normal e máximo', () => {
      expect(evaluateRangeStatus(120, bowRange)).toBe('LONG_RANGE');
      expect(evaluateRangeStatus(320, bowRange)).toBe('LONG_RANGE');
    });

    it('retorna OUT_OF_RANGE para armas além do alcance máximo', () => {
      expect(evaluateRangeStatus(350, bowRange)).toBe('OUT_OF_RANGE');
    });

    it('retorna OUT_OF_RANGE para magias além do alcance único', () => {
      expect(evaluateRangeStatus(130, spellRange)).toBe('OUT_OF_RANGE');
    });
  });

  describe('formatDistanceDisplay', () => {
    it('formata 60ft em metros e pés', () => {
      const formatted = formatDistanceDisplay(60);
      expect(formatted.meters).toBe('18.0m');
      expect(formatted.feet).toBe('60ft');
    });
  });
});
