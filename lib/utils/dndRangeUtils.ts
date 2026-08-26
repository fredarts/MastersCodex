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

export interface KnownWeaponRange {
  normalRangeFt: number;
  maxRangeFt: number;
  isRanged: boolean;
  isWeaponWithLongRange: boolean;
}

/**
 * Tabela Oficial de Alcance de Armas e Magias D&D 5e / Compêndio
 */
export const KNOWN_WEAPON_RANGES: Record<string, KnownWeaponRange> = {
  // Armas Marciais & Simples — À Distância
  'arco longo': { normalRangeFt: 150, maxRangeFt: 600, isRanged: true, isWeaponWithLongRange: true },
  'longbow': { normalRangeFt: 150, maxRangeFt: 600, isRanged: true, isWeaponWithLongRange: true },
  'arco curto': { normalRangeFt: 80, maxRangeFt: 320, isRanged: true, isWeaponWithLongRange: true },
  'shortbow': { normalRangeFt: 80, maxRangeFt: 320, isRanged: true, isWeaponWithLongRange: true },
  'besta leve': { normalRangeFt: 80, maxRangeFt: 320, isRanged: true, isWeaponWithLongRange: true },
  'light crossbow': { normalRangeFt: 80, maxRangeFt: 320, isRanged: true, isWeaponWithLongRange: true },
  'besta pesada': { normalRangeFt: 100, maxRangeFt: 400, isRanged: true, isWeaponWithLongRange: true },
  'heavy crossbow': { normalRangeFt: 100, maxRangeFt: 400, isRanged: true, isWeaponWithLongRange: true },
  'besta de mão': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'besta de mao': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'hand crossbow': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'funda': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'sling': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'zarabatana': { normalRangeFt: 25, maxRangeFt: 100, isRanged: true, isWeaponWithLongRange: true },
  'blowgun': { normalRangeFt: 25, maxRangeFt: 100, isRanged: true, isWeaponWithLongRange: true },

  // Armas de Arremesso
  'adaga': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'dagger': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'dardo': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'dart': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'azagaia': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'javelin': { normalRangeFt: 30, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: true },
  'machadinha': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'handaxe': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'martelo leve': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'light hammer': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'lança': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'lanca': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'spear': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'tridente': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'trident': { normalRangeFt: 20, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: true },
  'rede': { normalRangeFt: 5, maxRangeFt: 15, isRanged: true, isWeaponWithLongRange: true },
  'net': { normalRangeFt: 5, maxRangeFt: 15, isRanged: true, isWeaponWithLongRange: true },

  // Armas Corpo a Corpo Comuns (5ft / 1.5m)
  'espada longa': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'longsword': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'espada curta': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'shortsword': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'espada grande': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'greatsword': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'machado de batalha': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'battleaxe': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'machado grande': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'greataxe': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'rapieira': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'rapier': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'cimitarra': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'scimitar': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'maça': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'mace': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'maça de guerra': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'martelo de guerra': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'warhammer': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'malho': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'maul': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'clava': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'club': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'clava grande': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'greatclub': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'bordão': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'bordao': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'quarterstaff': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'staff': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'foice curta': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'sickle': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'mangual': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'flail': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'estrela da manhã': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'estrela da manha': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'morningstar': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'picareta de guerra': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'war pick': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'desarmado': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'ataque desarmado': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'unarmed': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'mordida': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'bite': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'garras': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'claws': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'pancada': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },
  'slam': { normalRangeFt: 5, maxRangeFt: 5, isRanged: false, isWeaponWithLongRange: false },

  // Armas de Alcance Melee (Reach 10ft / 3m)
  'chicote': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'whip': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'glaive': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'alabarda': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'halberd': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'pique': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'pike': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'lança longa': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'lanca longa': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },
  'lance': { normalRangeFt: 10, maxRangeFt: 10, isRanged: false, isWeaponWithLongRange: false },

  // Magias e Truques Comuns
  'raio de fogo': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'fire bolt': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'disparo místico': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'disparo mistico': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'eldritch blast': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'raio de gelo': { normalRangeFt: 60, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: false },
  'ray of frost': { normalRangeFt: 60, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: false },
  'chama sagrada': { normalRangeFt: 60, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: false },
  'sacred flame': { normalRangeFt: 60, maxRangeFt: 60, isRanged: true, isWeaponWithLongRange: false },
  'míssil mágico': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'missil magico': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'magic missile': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'flecha ácida': { normalRangeFt: 90, maxRangeFt: 90, isRanged: true, isWeaponWithLongRange: false },
  'flecha acida': { normalRangeFt: 90, maxRangeFt: 90, isRanged: true, isWeaponWithLongRange: false },
  'acid arrow': { normalRangeFt: 90, maxRangeFt: 90, isRanged: true, isWeaponWithLongRange: false },
  'raio ardente': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'scorching ray': { normalRangeFt: 120, maxRangeFt: 120, isRanged: true, isWeaponWithLongRange: false },
  'raio de bruxa': { normalRangeFt: 30, maxRangeFt: 30, isRanged: true, isWeaponWithLongRange: false },
  'witch bolt': { normalRangeFt: 30, maxRangeFt: 30, isRanged: true, isWeaponWithLongRange: false },
  'bola de fogo': { normalRangeFt: 150, maxRangeFt: 150, isRanged: true, isWeaponWithLongRange: false },
  'fireball': { normalRangeFt: 150, maxRangeFt: 150, isRanged: true, isWeaponWithLongRange: false },
};

/**
 * Analisa uma string de alcance de arma ou magia D&D 5e ou identifica a arma por nome.
 * Exemplos aceitos:
 * - "Espada Longa" / "Ataque: Espada Longa" -> normal: 5ft (1.5m), max: 5ft (1.5m) [corpo a corpo]
 * - "Arco Longo" / "Ataque: Arco Longo" -> normal: 150ft (45m), max: 600ft (180m)
 * - "80/320 ft" / "80/320" -> normal: 80ft (24m), max: 320ft (96m)
 * - "Munição (45/180m)" / "distância 45/180" -> normal: 150ft (45m), max: 600ft (180m)
 * - "120 ft" / "120 pés" / "36m" -> normal: 120ft (36m), max: 120ft (36m)
 * - "Touch" / "Toque" / "5 ft" -> normal: 5ft (1.5m), max: 5ft (1.5m) [corpo a corpo]
 */
export function parseRangeString(rangeText?: string, weaponOrSpellName?: string): RangeInfo {
  const rawText = (rangeText || '').trim();
  const searchCombined = `${rawText} ${weaponOrSpellName || ''}`.toLowerCase();

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

  // 1. Verificar correspondência direta com o Compêndio de Armas e Magias conhecidas
  for (const [key, info] of Object.entries(KNOWN_WEAPON_RANGES)) {
    if (searchCombined.includes(key)) {
      return {
        normalRangeFt: info.normalRangeFt,
        maxRangeFt: info.maxRangeFt,
        normalRangeM: feetToMeters(info.normalRangeFt),
        maxRangeM: feetToMeters(info.maxRangeFt),
        isRanged: info.isRanged,
        isWeaponWithLongRange: info.isWeaponWithLongRange,
        rawText: rawText || key,
      };
    }
  }

  if (!rawText) return defaultMelee;

  // 2. Se contiver fórmula de dados de dano (ex: 1d8, 2d6, 1d10, 1d4+2) sem palavras de alcance, IGNORAR para não pegar o número do dado como alcance!
  if (/\b\d+d\d+\b/i.test(rawText) && !/alcance|distância|distancia|range|munição|municao|arremesso|toque|touch|ft|feet|pés|pes|\b\d+m\b/i.test(rawText)) {
    return defaultMelee;
  }

  // 3. Se for "Touch" / "Toque" / "Self" / "Pessoal"
  if (/touch|toque|self|pessoal/i.test(rawText)) {
    return defaultMelee;
  }

  // 4. Procurar por formato com alcance duplo: ex "80/320", "80/320 ft", "45/180m", "45/180"
  const dualRangeMatch = rawText.match(/(\d+(?:\.\d+)?)\s*[\/\\|]\s*(\d+(?:\.\d+)?)\s*(ft|feet|pés|pes|m|meters|metros)?/i);
  if (dualRangeMatch) {
    let num1 = parseFloat(dualRangeMatch[1]);
    let num2 = parseFloat(dualRangeMatch[2]);
    const unit = (dualRangeMatch[3] || '').toLowerCase();

    // Detecção de Metros (explícita por unidade 'm' ou pelo padrão métrico do D&D 5e PT-BR onde números são 45/180, 24/96, 30/120, 9/36, 6/18)
    const isExplicitMeters = unit === 'm' || unit === 'meters' || unit === 'metros';
    const isStandardMetricDnd = !unit && ((num1 === 45 && num2 === 180) || (num1 === 24 && num2 === 96) || (num1 === 9 && num2 === 36) || (num1 === 6 && num2 === 18) || (num1 === 7.5 && num2 === 30) || (num1 === 1.5 && num2 === 4.5));

    if (isExplicitMeters || isStandardMetricDnd) {
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

  // 5. Procurar por alcance único COM unidade explícita (ex: "120 ft", "60 pés", "36m")
  const singleRangeMatch = rawText.match(/(?:alcance|distância|distancia|range)?\s*(\d+(?:\.\d+)?)\s*(ft|feet|pés|pes|m|meters|metros)\b/i);
  if (singleRangeMatch) {
    let num = parseFloat(singleRangeMatch[1]);
    const unit = (singleRangeMatch[2] || '').toLowerCase();

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

  // 6. Fallback padrão se contiver padrão numérico de arremesso/distância simples ex "alcance 6/18"
  const fallbackDual = rawText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (fallbackDual) {
    let n1 = parseFloat(fallbackDual[1]);
    let n2 = parseFloat(fallbackDual[2]);
    if (n1 <= 50 && n2 <= 200) {
      n1 = Math.round(n1 / FEET_TO_METERS);
      n2 = Math.round(n2 / FEET_TO_METERS);
    }
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
    // Para armas corpo a corpo com alcance estendido (Reach 10ft / 3m ex: Glaive, Chicote, Alabarda)
    const maxMeleeFt = (rangeInfo.normalRangeFt || 5) + 2.5;
    return distanceFt <= maxMeleeFt ? 'NORMAL' : 'OUT_OF_RANGE';
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
