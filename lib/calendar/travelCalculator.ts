import {
  TravelCalculationParams,
  TravelCalculationResult,
  TravelMode,
  TravelPace,
  TravelTerrain,
} from '@/lib/types/calendar';

const TERRAIN_DIFFICULTY: Record<TravelTerrain, { multiplier: number; label: string }> = {
  road: { multiplier: 1.0, label: 'Estrada Pavimentada / Caminho Limpo' },
  plains: { multiplier: 1.0, label: 'Planície / Campo Aberto' },
  forest: { multiplier: 1.5, label: 'Floresta Densa / Bosque' },
  hills: { multiplier: 1.5, label: 'Colinas e Terreno Acidentado' },
  mountains: { multiplier: 2.0, label: 'Montanhas Escarpadas' },
  swamp: { multiplier: 2.0, label: 'Pântano / Terreno Enlameado' },
  desert: { multiplier: 2.0, label: 'Deserto / Dunas Escaldantes' },
  underdark: { multiplier: 2.5, label: 'Subterrâneo / Underdark' },
  sea: { multiplier: 1.0, label: 'Mar Aberto / Navegação Fluvial' },
};

const BASE_SPEED_MILES_PER_DAY: Record<TravelMode, number> = {
  foot: 24,           // 3 milhas/hora x 8h
  horseback: 32,      // Montado
  cart: 24,           // Carroça com tração animal
  carriage: 28,       // Carruagem veloz em estrada
  sailing_ship: 48,   // Navio a vela (24h de vento constante)
  flying: 64,         // Montaria alada / Voo mágico direto
};

const PACE_MULTIPLIERS: Record<TravelPace, { speedMult: number; label: string; effect: string }> = {
  slow: {
    speedMult: 0.75, // 18 milhas/dia
    label: 'Ritmo Lento / Cauteloso',
    effect: 'Permite deslocamento furtivo e vantagem em Percepção e Sobrevivência.',
  },
  normal: {
    speedMult: 1.0,  // 24 milhas/dia
    label: 'Ritmo Normal / Constante',
    effect: 'Ritmo padrão sem vantagens ou desvantagens adicionais.',
  },
  fast: {
    speedMult: 1.25, // 30 milhas/dia
    label: 'Ritmo Rápido / Apressado',
    effect: '-5 na Percepção Passiva do grupo; não permite furtividade.',
  },
};

export function calculateTravel(params: TravelCalculationParams): TravelCalculationResult {
  const {
    distanceMiles,
    pace,
    terrain,
    mode,
    hoursPerDay = 8,
    partyMembersCount = 4,
  } = params;

  const validDistance = Math.max(0.1, distanceMiles);
  const terrainInfo = TERRAIN_DIFFICULTY[terrain] || TERRAIN_DIFFICULTY.road;
  const paceInfo = PACE_MULTIPLIERS[pace] || PACE_MULTIPLIERS.normal;
  const baseModeSpeed = BASE_SPEED_MILES_PER_DAY[mode] || 24;

  // Se voar ou navegar em alto mar, o terreno não impõe penalidade de relevo terrestre
  const effectiveTerrainMult = mode === 'flying' || mode === 'sailing_ship' ? 1.0 : terrainInfo.multiplier;

  // Velocidade efetiva em milhas por dia de marcha padrão (8h)
  const effectiveMilesPerDay = (baseModeSpeed * paceInfo.speedMult) / effectiveTerrainMult;
  const milesPerHour = effectiveMilesPerDay / 8;

  // Horas totais necessárias de marcha
  const totalHours = Math.ceil(validDistance / milesPerHour);

  // Dias necessários
  const effectiveHoursPerDay = Math.max(1, Math.min(24, hoursPerDay));
  const daysRequired = Math.max(1, Math.ceil(totalHours / effectiveHoursPerDay));

  // Marcha Forçada: se marchar mais de 8 horas por dia
  const forcedMarchHours = Math.max(0, effectiveHoursPerDay - 8);
  const forcedMarchConSaveDC = forcedMarchHours > 0 ? 10 + forcedMarchHours : undefined;

  // Consumo de Suprimentos
  const isDesert = terrain === 'desert';
  const rationsConsumed = daysRequired * Math.max(1, partyMembersCount);
  const waterGallonsConsumed = daysRequired * Math.max(1, partyMembersCount) * (isDesert ? 2 : 1);

  const summaryText = `Viagem de ${validDistance} milhas (${(validDistance * 1.609).toFixed(1)} km) em terreno de ${terrainInfo.label} (${paceInfo.label}). Duração estimada: ${daysRequired} ${daysRequired === 1 ? 'dia' : 'dias'} (${totalHours}h de marcha).`;

  return {
    daysRequired,
    totalHours,
    rationsConsumed,
    waterGallonsConsumed,
    forcedMarchHours,
    forcedMarchConSaveDC,
    summaryText,
  };
}
