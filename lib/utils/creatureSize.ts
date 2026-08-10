/**
 * Utilitário para mapeamento de tamanhos de criaturas no grid de batalha (2D e 3D)
 * Suporta nomenclatura em Português e Inglês (D&D 5e, Tormenta20, Pathfinder, SRD).
 */

export interface CreatureSizeInfo {
  sizeLabel: string;
  gridSquares: number;      // Número de células de largura/comprimento ocupadas no grid (ex: Grande = 2)
  scaleFactor: number;      // Multiplicador de escala tridimensional/bilboard
  dimensionFeet: number;   // Dimensão em pés (5ft, 10ft, 15ft, 20ft, 30ft)
}

export function getCreatureGridSize(sizeStr?: string): CreatureSizeInfo {
  if (!sizeStr) {
    return {
      sizeLabel: 'Médio',
      gridSquares: 1,
      scaleFactor: 1.0,
      dimensionFeet: 5,
    };
  }

  const s = sizeStr.toLowerCase().trim();

  // Miúdo / Tiny (2.5 pés - ocupa 1 quadrado com escala reduzida de 0.65x)
  if (s.includes('miú') || s.includes('tiny')) {
    return {
      sizeLabel: 'Miúdo',
      gridSquares: 1,
      scaleFactor: 0.65,
      dimensionFeet: 2.5,
    };
  }

  // Pequeno / Small (5 pés - 1x1 quadrado)
  if (s.includes('pequen') || s.includes('small')) {
    return {
      sizeLabel: 'Pequeno',
      gridSquares: 1,
      scaleFactor: 0.85,
      dimensionFeet: 5,
    };
  }

  // Grande / Large (10 pés - 2x2 quadrados)
  if (s.includes('grand') || s.includes('large')) {
    return {
      sizeLabel: 'Grande',
      gridSquares: 2,
      scaleFactor: 2.0,
      dimensionFeet: 10,
    };
  }

  // Enorme / Huge (15 pés - 3x3 quadrados)
  if (s.includes('enorm') || s.includes('huge')) {
    return {
      sizeLabel: 'Enorme',
      gridSquares: 3,
      scaleFactor: 3.0,
      dimensionFeet: 15,
    };
  }

  // Imenso / Gigante / Gargântua / Gargantuan (20+ pés - 4x4 quadrados)
  if (
    s.includes('imenso') || 
    s.includes('imensa') || 
    s.includes('gargân') || 
    s.includes('gargan') || 
    s.includes('gargantuan') ||
    s.includes('giga')
  ) {
    return {
      sizeLabel: 'Imenso',
      gridSquares: 4,
      scaleFactor: 4.0,
      dimensionFeet: 20,
    };
  }

  // Colossal (30+ pés - 6x6 quadrados)
  if (s.includes('coloss')) {
    return {
      sizeLabel: 'Colossal',
      gridSquares: 6,
      scaleFactor: 6.0,
      dimensionFeet: 30,
    };
  }

  // Padrão: Médio / Medium (5 pés - 1x1 quadrado)
  return {
    sizeLabel: 'Médio',
    gridSquares: 1,
    scaleFactor: 1.0,
    dimensionFeet: 5,
  };
}
