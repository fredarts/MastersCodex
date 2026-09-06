import { describe, it, expect } from 'vitest';
import { generateDirectGridPath } from '@/components/BattleGrid3D';

describe('BattleGrid3D - Tactical Grid Movement & Pathfinding', () => {
  it('deve manter o ponto inicial quando destino for igual ao início', () => {
    const path = generateDirectGridPath({ x: 1, z: 1 }, { x: 1, z: 1 });
    expect(path).toEqual([{ x: 1, z: 1 }]);
  });

  it('deve gerar passos ortogonais retos de 2 unidades em X e Z', () => {
    const pathX = generateDirectGridPath({ x: 1, z: 1 }, { x: 5, z: 1 });
    expect(pathX).toEqual([
      { x: 1, z: 1 },
      { x: 3, z: 1 },
      { x: 5, z: 1 },
    ]);

    const pathZ = generateDirectGridPath({ x: 1, z: 1 }, { x: 1, z: -3 });
    expect(pathZ).toEqual([
      { x: 1, z: 1 },
      { x: 1, z: -1 },
      { x: 1, z: -3 },
    ]);
  });

  it('deve gerar passos diagonais táticos e depois retos', () => {
    const pathDiag = generateDirectGridPath({ x: 1, z: 1 }, { x: 5, z: 3 });
    expect(pathDiag).toEqual([
      { x: 1, z: 1 },
      { x: 3, z: 3 },
      { x: 5, z: 3 },
    ]);
  });
});
