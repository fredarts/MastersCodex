/**
 * Motor de Cálculo de Dificuldade de Encontros D&D 5e (DMG p. 81-84)
 * Calcula patamares de XP por nível da Party, multiplicadores de quantidade de monstros e classificação de perigo.
 */

// 1. Limiares de XP por Nível de Personagem (D&D 5e DMG Tabela p. 82)
export const XP_THRESHOLDS_BY_LEVEL: Record<number, { easy: number; medium: number; hard: number; deadly: number; daily: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100, daily: 300 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200, daily: 600 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400, daily: 1200 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500, daily: 1700 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100, daily: 3500 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400, daily: 4000 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700, daily: 5000 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100, daily: 6000 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400, daily: 7500 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800, daily: 9000 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600, daily: 10500 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500, daily: 11500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100, daily: 13500 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700, daily: 15000 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400, daily: 18000 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200, daily: 20000 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800, daily: 25000 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500, daily: 27000 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900, daily: 30000 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700, daily: 40000 },
};

// 2. Tabela de XP por Desafio (CR / ND) (D&D 5e MM / DMG)
export const CR_TO_XP_TABLE: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '0.125': 25,
  '1/4': 50,
  '0.25': 50,
  '1/2': 100,
  '0.5': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
};

/**
 * Converte qualquer formato de CR (string ou número) para o valor exato de XP oficial
 */
export function crToXp(cr: string | number | undefined): number {
  if (cr === undefined || cr === null || cr === '') return 10;
  const crStr = String(cr).trim().toLowerCase();
  
  if (CR_TO_XP_TABLE[crStr] !== undefined) {
    return CR_TO_XP_TABLE[crStr];
  }

  // Tenta parsear frações como "1/4", "1/2" ou números
  if (crStr.includes('/')) {
    const parts = crStr.split('/');
    const val = parseFloat(parts[0]) / parseFloat(parts[1]);
    const matchedKey = Object.keys(CR_TO_XP_TABLE).find(k => Math.abs(parseFloat(k) - val) < 0.01);
    if (matchedKey) return CR_TO_XP_TABLE[matchedKey];
  }

  const num = parseFloat(crStr);
  if (!isNaN(num) && CR_TO_XP_TABLE[String(num)]) {
    return CR_TO_XP_TABLE[String(num)];
  }

  return 10;
}

export type EncounterDifficultyTier = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';

export interface EncounterDifficultyResult {
  difficulty: EncounterDifficultyTier;
  difficultyLabel: 'Trivial' | 'Fácil' | 'Médio' | 'Difícil' | 'Mortal';
  difficultyColor: string;
  totalRawXp: number;
  xpPerPlayer: number;
  totalAdjustedXp: number;
  multiplier: number;
  partyThresholds: {
    easy: number;
    medium: number;
    hard: number;
    deadly: number;
    daily: number;
  };
  monsterCount: number;
  partySize: number;
  avgPartyLevel: number;
  gaugePercentage: number;
}

/**
 * Obtém o multiplicador oficial de encontro com base no número de monstros e tamanho da party
 */
export function getEncounterMultiplier(monsterCount: number, partySize: number): number {
  if (monsterCount === 0) return 1;

  // Base Multiplier Steps: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5]
  const baseSteps = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

  let stepIndex = 1; // 1 monstro = 1.0x (index 1)
  if (monsterCount === 1) stepIndex = 1;
  else if (monsterCount === 2) stepIndex = 2; // 1.5x
  else if (monsterCount >= 3 && monsterCount <= 6) stepIndex = 3; // 2.0x
  else if (monsterCount >= 7 && monsterCount <= 10) stepIndex = 4; // 2.5x
  else if (monsterCount >= 11 && monsterCount <= 14) stepIndex = 5; // 3.0x
  else if (monsterCount >= 15) stepIndex = 6; // 4.0x

  // Ajuste por tamanho da party (DMG p. 83):
  // Se < 3 jogadores, sobe 1 degrau
  // Se >= 6 jogadores, desce 1 degrau
  if (partySize < 3) {
    stepIndex = Math.min(baseSteps.length - 1, stepIndex + 1);
  } else if (partySize >= 6) {
    stepIndex = Math.max(0, stepIndex - 1);
  }

  return baseSteps[stepIndex];
}

/**
 * Calcula a dificuldade completa do encontro segundo as regras de D&D 5e
 */
export function calculateEncounterDifficulty(
  party: { level?: number }[],
  monsters: { cr?: string | number; xp?: number }[]
): EncounterDifficultyResult {
  const safeParty = party.length > 0 ? party : [{ level: 1 }];
  const partySize = safeParty.length;

  let totalLevel = 0;
  const partyThresholds = { easy: 0, medium: 0, hard: 0, deadly: 0, daily: 0 };

  safeParty.forEach((p) => {
    const lvl = Math.max(1, Math.min(20, p.level || 1));
    totalLevel += lvl;
    const t = XP_THRESHOLDS_BY_LEVEL[lvl] || XP_THRESHOLDS_BY_LEVEL[1];
    partyThresholds.easy += t.easy;
    partyThresholds.medium += t.medium;
    partyThresholds.hard += t.hard;
    partyThresholds.deadly += t.deadly;
    partyThresholds.daily += t.daily;
  });

  const avgPartyLevel = Math.max(1, Math.round(totalLevel / partySize));

  // Soma de XP dos monstros
  const monsterCount = monsters.length;
  let totalRawXp = 0;
  monsters.forEach((m) => {
    if (m.xp !== undefined && m.xp > 0) {
      totalRawXp += m.xp;
    } else {
      totalRawXp += crToXp(m.cr);
    }
  });

  const multiplier = getEncounterMultiplier(monsterCount, partySize);
  const totalAdjustedXp = Math.round(totalRawXp * multiplier);
  const xpPerPlayer = partySize > 0 ? Math.round(totalRawXp / partySize) : totalRawXp;

  // Determinação do Patamar
  let difficulty: EncounterDifficultyTier = 'trivial';
  let difficultyLabel: 'Trivial' | 'Fácil' | 'Médio' | 'Difícil' | 'Mortal' = 'Trivial';
  let difficultyColor = 'text-slate-400 bg-slate-800/80 border-slate-700';

  if (totalAdjustedXp >= partyThresholds.deadly) {
    difficulty = 'deadly';
    difficultyLabel = 'Mortal';
    difficultyColor = 'text-rose-400 bg-rose-950/80 border-rose-600/60';
  } else if (totalAdjustedXp >= partyThresholds.hard) {
    difficulty = 'hard';
    difficultyLabel = 'Difícil';
    difficultyColor = 'text-orange-400 bg-orange-950/80 border-orange-600/60';
  } else if (totalAdjustedXp >= partyThresholds.medium) {
    difficulty = 'medium';
    difficultyLabel = 'Médio';
    difficultyColor = 'text-amber-400 bg-amber-950/80 border-amber-600/60';
  } else if (totalAdjustedXp >= partyThresholds.easy) {
    difficulty = 'easy';
    difficultyLabel = 'Fácil';
    difficultyColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-600/60';
  } else {
    difficulty = 'trivial';
    difficultyLabel = 'Trivial';
    difficultyColor = 'text-cyan-400 bg-cyan-950/80 border-cyan-700/60';
  }

  // Cálculo da porcentagem para o Medidor Visual (Gauge)
  // 0% a 25% = Trivial -> Fácil
  // 25% a 50% = Fácil -> Médio
  // 50% a 75% = Médio -> Difícil
  // 75% a 100% = Difícil -> Mortal (ou além)
  let gaugePercentage = 0;
  if (totalAdjustedXp <= 0) {
    gaugePercentage = 0;
  } else if (totalAdjustedXp < partyThresholds.easy) {
    gaugePercentage = Math.min(25, (totalAdjustedXp / partyThresholds.easy) * 25);
  } else if (totalAdjustedXp < partyThresholds.medium) {
    const range = partyThresholds.medium - partyThresholds.easy;
    const progress = totalAdjustedXp - partyThresholds.easy;
    gaugePercentage = 25 + (range > 0 ? (progress / range) * 25 : 0);
  } else if (totalAdjustedXp < partyThresholds.hard) {
    const range = partyThresholds.hard - partyThresholds.medium;
    const progress = totalAdjustedXp - partyThresholds.medium;
    gaugePercentage = 50 + (range > 0 ? (progress / range) * 25 : 0);
  } else if (totalAdjustedXp < partyThresholds.deadly) {
    const range = partyThresholds.deadly - partyThresholds.hard;
    const progress = totalAdjustedXp - partyThresholds.hard;
    gaugePercentage = 75 + (range > 0 ? (progress / range) * 25 : 0);
  } else {
    // Ultrapassou Mortal
    const overflow = totalAdjustedXp - partyThresholds.deadly;
    gaugePercentage = Math.min(100, 100 + (overflow / partyThresholds.deadly) * 10);
  }

  return {
    difficulty,
    difficultyLabel,
    difficultyColor,
    totalRawXp,
    xpPerPlayer,
    totalAdjustedXp,
    multiplier,
    partyThresholds,
    monsterCount,
    partySize,
    avgPartyLevel,
    gaugePercentage: Math.min(100, Math.max(0, gaugePercentage)),
  };
}

/**
 * Simula a adição de um novo monstro e retorna o resultado da dificuldade resultante
 */
export function previewEncounterWithNewMonster(
  party: { level?: number }[],
  currentMonsters: { cr?: string | number; xp?: number }[],
  newMonster: { cr?: string | number; xp?: number }
): EncounterDifficultyResult {
  return calculateEncounterDifficulty(party, [...currentMonsters, newMonster]);
}
