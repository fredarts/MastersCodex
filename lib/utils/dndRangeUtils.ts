/**
 * dndRangeUtils.ts
 * Utilitários para parsing de alcance de armas/magias D&D 5e,
 * cálculo de distâncias no grid de batalha e avaliação de regras de alcance (Normal, Longo com Desvantagem, Fora de Alcance).
 */

export interface RangeInfo {
  normalRangeFt: number;
  maxRangeFt: number;
  normalRangeM: number;
  maxRangeM: number;
  isRanged: boolean;
  isWeaponWithLongRange: boolean;
  rawText: string;
}

export type RangeStatus = 'NORMAL' | 'LONG_RANGE' | 'OUT_OF_RANGE';

const FEET_TO_METERS = 0.3; // 5 ft = 1.5 m

/**
 * Converte pés para metros arredondado para 1 casa decimal.
 */
export function feetToMeters(feet: number): number {
  return Math.round(feet * FEET_TO_METERS * 10) / 10;
}

/**
 * Analisa uma string de alcance de arma ou magia D&D 5e.
 * Exemplos aceitos:
 * - "80/320 ft" / "80/320" -> normal: 80ft (24m), max: 320ft (96m)
 * - "150/600 ft" -> normal: 150ft (45m), max: 600ft (180m)
 * - "120 ft" / "120 pés" / "36m" -> normal: 120ft (36m), max: 120ft (36m)
 * - "Touch" / "Toque" / "5 ft" -> normal: 5ft (1.5m), max: 5ft (1.5m) [corpo a corpo]
 */
export function parseRangeString(rangeText?: string): RangeInfo {
  const rawText = (rangeText || '').trim();

  // Valores padrão de corpo a corpo (5ft / 1.5m)
  const defaultMelee: RangeInfo = {
    normalRangeFt: 5,
    maxRangeFt: 5,
    normalRangeM: 1.5,
    maxRangeM: 1.5,
    isRanged: false,
    isWeaponWithLongRange: false,
    rawText: rawText || '5 ft',
  };

  if (!rawText) return defaultMelee;

  // 1. Procurar por formato com alcance duplo: ex "80/320", "80/320 ft", "24m/96m"
  const dualRangeMatch = rawText.match(/(\d+(?:\.\d+)?)\s*[\/\\|]\s*(\d+(?:\.\d+)?)\s*(ft|feet|pés|pes|m|meters|metros)?/i);
  if (dualRangeMatch) {
    let num1 = parseFloat(dualRangeMatch[1]);
    let num2 = parseFloat(dualRangeMatch[2]);
    const unit = (dualRangeMatch[3] || 'ft').toLowerCase();

    // Se for em metros ex "24m/96m", converte para pés
    if (unit === 'm' || unit === 'meters' || unit === 'metros') {
      num1 = Math.round(num1 / FEET_TO_METERS);
      num2 = Math.round(num2 / FEET_TO_METERS);
    }

    const normalFt = Math.min(num1, num2);
    const maxFt = Math.max(num1, num2);

    return {
      normalRangeFt: normalFt,
      maxRangeFt: maxFt,
      normalRangeM: feetToMeters(normalFt),
      maxRangeM: feetToMeters(maxFt),
      isRanged: maxFt > 5,
      isWeaponWithLongRange: normalFt < maxFt,
      rawText,
    };
  }

  // 2. Procurar por alcance único: ex "120 ft", "60 pés", "36m"
  const singleRangeMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(ft|feet|pés|pes|m|meters|metros)?/i);
  if (singleRangeMatch) {
    let num = parseFloat(singleRangeMatch[1]);
    const unit = (singleRangeMatch[2] || 'ft').toLowerCase();

    if (unit === 'm' || unit === 'meters' || unit === 'metros') {
      num = Math.round(num / FEET_TO_METERS);
    }

    return {
      normalRangeFt: num,
      maxRangeFt: num,
      normalRangeM: feetToMeters(num),
      maxRangeM: feetToMeters(num),
      isRanged: num > 5,
      isWeaponWithLongRange: false,
      rawText,
    };
  }

  // Se for "Touch" / "Toque" / "Self" / "Pessoal"
  if (/touch|toque|self|pessoal/i.test(rawText)) {
    return defaultMelee;
  }

  // Fallback padrão se contiver padrão de longo alcance ex "arremesso (alcance 6/18m)"
  const fallbackDual = rawText.match(/(\d+)\s*\/\s*(\d+)/);
  if (fallbackDual) {
    const n1 = parseInt(fallbackDual[1]);
    const n2 = parseInt(fallbackDual[2]);
    return {
      normalRangeFt: n1,
      maxRangeFt: n2,
      normalRangeM: feetToMeters(n1),
      maxRangeM: feetToMeters(n2),
      isRanged: n2 > 5,
      isWeaponWithLongRange: n1 < n2,
      rawText,
    };
  }

  return defaultMelee;
}

/**
 * Calcula a distância em pés entre dois pontos no grid de batalha (x, z).
 * Cada unidade de coordenada no 3D equivale a meio quadrado (ou 1 unidade = 5ft se scale = 5).
 * No Masters Codex, as posições dos tokens no BattleGrid3D usam coordenadas x, z onde 2 unidades = 1 quadrado (5ft / 1.5m).
 */
export function calculateGridDistanceFeet(
  pos1: { x: number; z: number },
  pos2: { x: number; z: number },
  unitsPerSquare: number = 2
): number {
  const dx = (pos2.x - pos1.x) / unitsPerSquare;
  const dz = (pos2.z - pos1.z) / unitsPerSquare;
  // Distância Euclidiana em quadrados do grid
  const distanceSquares = Math.sqrt(dx * dx + dz * dz);
  // Converte para pés (1 quadrado = 5 pés)
  const distanceFeet = Math.round(distanceSquares * 5 * 10) / 10;
  return distanceFeet;
}

/**
 * Avalia o status de alcance com base nas regras D&D 5.0:
 * - Normal: distance <= normalRangeFt
 * - Long Range: normalRangeFt < distance <= maxRangeFt (apenas se maxRangeFt > normalRangeFt)
 * - Out of Range: distance > maxRangeFt
 */
export function evaluateRangeStatus(distanceFt: number, rangeInfo: RangeInfo): RangeStatus {
  if (!rangeInfo.isRanged) {
    // Para ataques corpo a corpo (5ft / 1.5m), além de 7.5ft (1.5 quadrados) já está fora de alcance
    return distanceFt <= 7.5 ? 'NORMAL' : 'OUT_OF_RANGE';
  }

  if (distanceFt <= rangeInfo.normalRangeFt) {
    return 'NORMAL';
  }

  if (rangeInfo.isWeaponWithLongRange && distanceFt <= rangeInfo.maxRangeFt) {
    return 'LONG_RANGE';
  }

  return 'OUT_OF_RANGE';
}

/**
 * Formata os valores de distância para exibição no HUD em metros e pés.
 */
export function formatDistanceDisplay(distanceFt: number): { meters: string; feet: string } {
  const meters = feetToMeters(distanceFt);
  return {
    meters: `${meters.toFixed(1)}m`,
    feet: `${Math.round(distanceFt)}ft`,
  };
}
