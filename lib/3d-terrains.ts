/**
 * Masters Codex - 3D Terrain & Tactical Surface Engine (BG3 Style)
 * Modelos de dados, catálogo de superfícies, cálculo de custo de movimento e reações elementais.
 */

export type TerrainSurfaceType = 
  | 'normal'         // Piso padrão (1x)
  | 'difficult_rock' // Pedregoso / Detritos (2x)
  | 'mud_swamp'      // Lama / Pântano (2x)
  | 'shallow_water'  // Água Rasa (2x, dissipa fogo)
  | 'deep_water'     // Água Profunda (3x)
  | 'ice_sheet'      // Gelo Liso (2x, DC 12 DES ou Prone)
  | 'oil_slick'      // Poça de Óleo (2x, DC 10 DES ou Prone, Inflamável)
  | 'burning_fire'   // Fogo / Chamas (1x, 1d4 dano de fogo)
  | 'acid_pool'      // Poça de Ácido (1x, 2d4 dano ácido)
  | 'web_entangle'   // Teias de Aranha (2x, DC 12 FOR ou Restrained, Inflamável)
  | 'holy_ground'    // Solo Sagrado (1x, +1d4 cura a aliados)
  | 'cursed_mist';   // Névoa Amaldiçoada (1x, desvantagem em testes)

export interface TerrainSurfaceDefinition {
  type: TerrainSurfaceType;
  label: string;
  icon: string;
  color: string;
  borderColor: string;
  glowColor?: string;
  opacity: number;
  movementMultiplier: number;
  isDifficultTerrain: boolean;
  isHazard: boolean;
  hazardDamageDice?: string;
  hazardDamageType?: 'fire' | 'acid' | 'radiant' | 'necrotic' | 'cold';
  requiresSave?: boolean;
  saveAbility?: 'dex' | 'str' | 'con' | 'wis';
  saveDC?: number;
  failCondition?: 'prone' | 'restrained';
  description: string;
}

export const TERRAIN_SURFACE_CATALOG: Record<TerrainSurfaceType, TerrainSurfaceDefinition> = {
  normal: {
    type: 'normal',
    label: 'Normal',
    icon: '⬛',
    color: '#334155',
    borderColor: '#475569',
    opacity: 0.0,
    movementMultiplier: 1.0,
    isDifficultTerrain: false,
    isHazard: false,
    description: 'Chão plano e firme. Movimento padrão.',
  },
  difficult_rock: {
    type: 'difficult_rock',
    label: 'Pedregoso / Escombros',
    icon: '🪨',
    color: '#78716c',
    borderColor: '#a8a29e',
    glowColor: '#d6d3d1',
    opacity: 0.40,
    movementMultiplier: 2.0,
    isDifficultTerrain: true,
    isHazard: false,
    description: 'Rochas pontiagudas e cascalho. Dobro de custo de movimento (10ft/quadrado).',
  },
  mud_swamp: {
    type: 'mud_swamp',
    label: 'Lama / Pântano',
    icon: '🟤',
    color: '#713f12',
    borderColor: '#854d0e',
    glowColor: '#a16207',
    opacity: 0.45,
    movementMultiplier: 2.0,
    isDifficultTerrain: true,
    isHazard: false,
    description: 'Lodo espesso. Dobro de custo de movimento e desvantagem em acrobacias.',
  },
  shallow_water: {
    type: 'shallow_water',
    label: 'Água Rasa',
    icon: '💧',
    color: '#0284c7',
    borderColor: '#38bdf8',
    glowColor: '#7dd3fc',
    opacity: 0.45,
    movementMultiplier: 2.0,
    isDifficultTerrain: true,
    isHazard: false,
    description: 'Lâmina de água. Dobro de custo de movimento, apaga chamas e conduz eletricidade.',
  },
  deep_water: {
    type: 'deep_water',
    label: 'Água Profunda',
    icon: '🌊',
    color: '#1e3a8a',
    borderColor: '#2563eb',
    glowColor: '#60a5fa',
    opacity: 0.55,
    movementMultiplier: 3.0,
    isDifficultTerrain: true,
    isHazard: false,
    description: 'Água até a cintura/peito. Triplo de custo de movimento sem deslocamento de natação.',
  },
  ice_sheet: {
    type: 'ice_sheet',
    label: 'Gelo Liso',
    icon: '❄️',
    color: '#38bdf8',
    borderColor: '#e0f2fe',
    glowColor: '#bae6fd',
    opacity: 0.45,
    movementMultiplier: 2.0,
    isDifficultTerrain: true,
    isHazard: true,
    requiresSave: true,
    saveAbility: 'dex',
    saveDC: 12,
    failCondition: 'prone',
    description: 'Pista de gelo escorregadio. Teste de DES CD 12 ao entrar ou cai Caído (Prone). Derrete com fogo.',
  },
  oil_slick: {
    type: 'oil_slick',
    label: 'Poça de Óleo',
    icon: '🛢️',
    color: '#1e1b4b',
    borderColor: '#6366f1',
    glowColor: '#a855f7',
    opacity: 0.50,
    movementMultiplier: 2.0,
    isDifficultTerrain: true,
    isHazard: true,
    requiresSave: true,
    saveAbility: 'dex',
    saveDC: 10,
    failCondition: 'prone',
    description: 'Líquido negro viscoso. Teste de DES CD 10 ou cai Caído. Altamente inflamável!',
  },
  burning_fire: {
    type: 'burning_fire',
    label: 'Superfície em Chamas',
    icon: '🔥',
    color: '#ea580c',
    borderColor: '#f97316',
    glowColor: '#fdba74',
    opacity: 0.50,
    movementMultiplier: 1.0,
    isDifficultTerrain: false,
    isHazard: true,
    hazardDamageDice: '1d4',
    hazardDamageType: 'fire',
    description: 'Solo em chamas ardentes. Causa 1d4 de dano de fogo ao entrar ou iniciar o turno.',
  },
  acid_pool: {
    type: 'acid_pool',
    label: 'Poça de Ácido',
    icon: '🧪',
    color: '#15803d',
    borderColor: '#22c55e',
    glowColor: '#86efac',
    opacity: 0.50,
    movementMultiplier: 1.0,
    isDifficultTerrain: false,
    isHazard: true,
    hazardDamageDice: '2d4',
    hazardDamageType: 'acid',
    description: 'Ácido cáustico borbulhante. Causa 2d4 de dano ácido corrosivo.',
  },
  web_entangle: {
    type: 'web_entangle',
    label: 'Teias de Aranha / Raízes',
    icon: '🕸️',
    color: '#cbd5e1',
    borderColor: '#f8fafc',
    glowColor: '#ffffff',
    opacity: 0.45,
    movementMultiplier: 2.0,
    isDifficultTerrain: true,
    isHazard: true,
    requiresSave: true,
    saveAbility: 'str',
    saveDC: 12,
    failCondition: 'restrained',
    description: 'Fios grudentos. Dobro de custo de movimento e teste de FOR CD 12 ou fica Contido. Inflamável.',
  },
  holy_ground: {
    type: 'holy_ground',
    label: 'Solo Sagrado',
    icon: '✨',
    color: '#eab308',
    borderColor: '#fef08a',
    glowColor: '#fef9c3',
    opacity: 0.35,
    movementMultiplier: 1.0,
    isDifficultTerrain: false,
    isHazard: false,
    description: 'Bênção divina. Cura 1d4 de PV a aliados ou causa 1d4 radiante a mortos-vivos.',
  },
  cursed_mist: {
    type: 'cursed_mist',
    label: 'Névoa Amaldiçoada',
    icon: '💜',
    color: '#3b0764',
    borderColor: '#7e22ce',
    glowColor: '#c084fc',
    opacity: 0.45,
    movementMultiplier: 1.0,
    isDifficultTerrain: false,
    isHazard: true,
    description: 'Energia necrótica opressiva. Desvantagem em testes de resistência.',
  },
};

export interface TerrainCellData {
  id: string; // `${col}_${row}`
  col: number;
  row: number;
  x: number;   // Coordenada snapped X em unidades 3D (Three.js)
  z: number;   // Coordenada snapped Z em unidades 3D (Three.js)
  type: TerrainSurfaceType;
  roundsRemaining?: number; // Duração em rodadas para efeitos temporários (opcional)
}

/**
 * Avalia reação elemental BG3 entre uma superfície existente e um elemento disparado.
 */
export function evaluateSurfaceReaction(
  currentType: TerrainSurfaceType,
  element: 'fire' | 'cold' | 'lightning' | 'water'
): { nextType: TerrainSurfaceType; triggeredEventText?: string } | null {
  if (element === 'fire') {
    if (currentType === 'oil_slick') {
      return { nextType: 'burning_fire', triggeredEventText: '🔥 O óleo inflamou violentamente em uma explosão de chamas!' };
    }
    if (currentType === 'web_entangle') {
      return { nextType: 'burning_fire', triggeredEventText: '🔥 As teias pegaram fogo e estão queimando em brasas!' };
    }
    if (currentType === 'ice_sheet') {
      return { nextType: 'shallow_water', triggeredEventText: '💧 O calor intenso derreteu o gelo em uma poça de água rasa!' };
    }
  }

  if (element === 'cold') {
    if (currentType === 'shallow_water' || currentType === 'deep_water') {
      return { nextType: 'ice_sheet', triggeredEventText: '❄️ A água congelou instantaneamente em uma espessa lâmina de gelo!' };
    }
    if (currentType === 'burning_fire') {
      return { nextType: 'normal', triggeredEventText: '💨 O frio extinguiu as chamas, deixando fumaça no chão!' };
    }
  }

  if (element === 'water') {
    if (currentType === 'burning_fire') {
      return { nextType: 'shallow_water', triggeredEventText: '💨 A água extinguiu as chamas, gerando uma poça e vapor!' };
    }
    if (currentType === 'acid_pool') {
      return { nextType: 'shallow_water', triggeredEventText: '🧪 A água diluiu o ácido com segurança.' };
    }
  }

  return null;
}

/**
 * Calcula o custo em metros de uma sequência de pontos de rastro (trail)
 * levando em conta os tipos de terreno em cada célula percorrida.
 */
export function calculateTrailTerrainCost(
  trail: { x: number; z: number }[],
  surfacesMap: Map<string, TerrainSurfaceType>
): {
  totalCostMeters: number;
  normalSquares: number;
  difficultSquares: number;
  encounteredHazards: TerrainSurfaceDefinition[];
} {
  if (trail.length <= 1) {
    return {
      totalCostMeters: 0,
      normalSquares: 0,
      difficultSquares: 0,
      encounteredHazards: [],
    };
  }

  let totalCostMeters = 0;
  let normalSquares = 0;
  let difficultSquares = 0;
  const hazardSet = new Map<TerrainSurfaceType, TerrainSurfaceDefinition>();

  for (let i = 1; i < trail.length; i++) {
    const pt = trail[i];
    const snapKey = `${Math.round(pt.x)}_${Math.round(pt.z)}`;
    const surfaceType = surfacesMap.get(snapKey) || 'normal';
    const def = TERRAIN_SURFACE_CATALOG[surfaceType] || TERRAIN_SURFACE_CATALOG.normal;

    const stepCostMeters = 1.5 * def.movementMultiplier;
    totalCostMeters += stepCostMeters;

    if (def.isDifficultTerrain) {
      difficultSquares++;
    } else {
      normalSquares++;
    }

    if (def.isHazard) {
      hazardSet.set(def.type, def);
    }
  }

  return {
    totalCostMeters,
    normalSquares,
    difficultSquares,
    encounteredHazards: Array.from(hazardSet.values()),
  };
}
