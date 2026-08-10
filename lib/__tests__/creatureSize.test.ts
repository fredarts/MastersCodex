import { describe, it, expect } from 'vitest';
import { getCreatureGridSize } from '../utils/creatureSize';

describe('getCreatureGridSize', () => {
  it('deve retornar Médio (1x1, 5ft) por padrão quando o tamanho for undefined ou nulo', () => {
    const info = getCreatureGridSize(undefined);
    expect(info.sizeLabel).toBe('Médio');
    expect(info.gridSquares).toBe(1);
    expect(info.scaleFactor).toBe(1.0);
    expect(info.dimensionFeet).toBe(5);
  });

  it('deve identificar criaturas Miúdas / Tiny (1x1 com escala 0.65x, 2.5ft)', () => {
    const info1 = getCreatureGridSize('Miúdo');
    expect(info1.gridSquares).toBe(1);
    expect(info1.dimensionFeet).toBe(2.5);

    const info2 = getCreatureGridSize('Tiny');
    expect(info2.gridSquares).toBe(1);
    expect(info2.dimensionFeet).toBe(2.5);
  });

  it('deve identificar criaturas Pequenas / Small (1x1, 5ft)', () => {
    const info1 = getCreatureGridSize('Pequeno');
    expect(info1.gridSquares).toBe(1);
    expect(info1.dimensionFeet).toBe(5);

    const info2 = getCreatureGridSize('Small');
    expect(info2.gridSquares).toBe(1);
  });

  it('deve identificar criaturas Grandes / Large (2x2, 10ft)', () => {
    const info1 = getCreatureGridSize('Grande');
    expect(info1.gridSquares).toBe(2);
    expect(info1.scaleFactor).toBe(2.0);
    expect(info1.dimensionFeet).toBe(10);

    const info2 = getCreatureGridSize('Large');
    expect(info2.gridSquares).toBe(2);
  });

  it('deve identificar criaturas Enormes / Huge (3x3, 15ft)', () => {
    const info1 = getCreatureGridSize('Enorme');
    expect(info1.gridSquares).toBe(3);
    expect(info1.scaleFactor).toBe(3.0);
    expect(info1.dimensionFeet).toBe(15);

    const info2 = getCreatureGridSize('Huge');
    expect(info2.gridSquares).toBe(3);
  });

  it('deve identificar criaturas Imensas / Gargântua / Gargantuan (4x4, 20ft)', () => {
    const info1 = getCreatureGridSize('Imenso');
    expect(info1.gridSquares).toBe(4);

    const info2 = getCreatureGridSize('Gargantuan');
    expect(info2.gridSquares).toBe(4);

    const info3 = getCreatureGridSize('Gigante das Colinas');
    expect(info3.gridSquares).toBe(4);
  });

  it('deve identificar criaturas Colossais (6x6, 30ft)', () => {
    const info = getCreatureGridSize('Colossal');
    expect(info.gridSquares).toBe(6);
    expect(info.dimensionFeet).toBe(30);
  });
});
