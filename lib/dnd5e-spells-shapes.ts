/**
 * lib/dnd5e-spells-shapes.ts
 * Definições completas de Área de Efeito (AoE), Alcance, Formas Geométricas,
 * Salvaguardas (Saving Throws), Tipos de Dano e Concentração para magias D&D 5e.
 */

export type SpellShapeType = 'circle' | 'cone' | 'line' | 'fan' | 'box' | 'cylinder' | 'target' | 'multi-target';
export type AbilityKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface SpellAoEDefinition {
  name: string;
  range: number;        // Alcance máximo em metros (0 para Pessoal/Origem no Conjurador)
  shape: SpellShapeType;
  size: number;         // Raio da esfera/círculo, comprimento do cone/linha em metros (0 se alvo único)
  width?: number;       // Largura da linha ou diâmetro do cilindro (opcional, padrão 1.5m para linhas)
  saveAbility?: AbilityKey; // Atributo exigido no Saving Throw
  damageType?: string;      // Tipo de dano principal ('Fogo', 'Elétrico', 'Frio', etc.)
  damageFormula?: string;   // Fórmula de dano padrão no nível base (ex: '8d6')
  saveHalves?: boolean;     // Se sucesso no save reduz o dano pela metade (true por padrão para dano AoE)
  requiresConcentration?: boolean; // Se a magia exige concentração
  colorHex?: string;        // Cor temático para renderização Three.js (ex: '#ef4444' para fogo)
}

export const SPELL_SHAPES_MAPPING: Record<string, Omit<SpellAoEDefinition, 'name'>> = {
  // === TRUQUES (CANTRIPS) ===
  'explosao mistica': { range: 36, shape: 'target', size: 0, damageType: 'Força', damageFormula: '1d10', colorHex: '#a855f7' },
  'eldritch blast': { range: 36, shape: 'target', size: 0, damageType: 'Força', damageFormula: '1d10', colorHex: '#a855f7' },
  'chama sagrada': { range: 18, shape: 'target', size: 0, saveAbility: 'DEX', damageType: 'Radiante', damageFormula: '1d8', saveHalves: false, colorHex: '#fbbf24' },
  'sacred flame': { range: 18, shape: 'target', size: 0, saveAbility: 'DEX', damageType: 'Radiante', damageFormula: '1d8', saveHalves: false, colorHex: '#fbbf24' },
  'borrifada acida': { range: 18, shape: 'circle', size: 1.5, saveAbility: 'DEX', damageType: 'Ácido', damageFormula: '1d6', saveHalves: false, colorHex: '#84cc16' },
  'acid splash': { range: 18, shape: 'circle', size: 1.5, saveAbility: 'DEX', damageType: 'Ácido', damageFormula: '1d6', saveHalves: false, colorHex: '#84cc16' },
  'raio de gelo': { range: 18, shape: 'target', size: 0, damageType: 'Frio', damageFormula: '1d8', colorHex: '#38bdf8' },
  'ray of frost': { range: 18, shape: 'target', size: 0, damageType: 'Frio', damageFormula: '1d8', colorHex: '#38bdf8' },
  'toque chocante': { range: 1.5, shape: 'target', size: 0, damageType: 'Elétrico', damageFormula: '1d8', colorHex: '#60a5fa' },
  'shocking grasp': { range: 1.5, shape: 'target', size: 0, damageType: 'Elétrico', damageFormula: '1d8', colorHex: '#60a5fa' },
  'chicote de espinhos': { range: 9, shape: 'target', size: 0, damageType: 'Perfurante', damageFormula: '1d6', colorHex: '#22c55e' },
  'thorn whip': { range: 9, shape: 'target', size: 0, damageType: 'Perfurante', damageFormula: '1d6', colorHex: '#22c55e' },
  'rajada de veneno': { range: 3, shape: 'target', size: 0, saveAbility: 'CON', damageType: 'Veneno', damageFormula: '1d12', saveHalves: false, colorHex: '#10b981' },
  'poison spray': { range: 3, shape: 'target', size: 0, saveAbility: 'CON', damageType: 'Veneno', damageFormula: '1d12', saveHalves: false, colorHex: '#10b981' },

  // === NÍVEL 1 ===
  'maos flamejantes': { range: 0, shape: 'cone', size: 4.5, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '3d6', saveHalves: true, colorHex: '#f97316' },
  'burning hands': { range: 0, shape: 'cone', size: 4.5, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '3d6', saveHalves: true, colorHex: '#f97316' },
  'onda trovejante': { range: 0, shape: 'box', size: 4.5, saveAbility: 'CON', damageType: 'Trovão', damageFormula: '2d8', saveHalves: true, colorHex: '#38bdf8' },
  'thunderwave': { range: 0, shape: 'box', size: 4.5, saveAbility: 'CON', damageType: 'Trovão', damageFormula: '2d8', saveHalves: true, colorHex: '#38bdf8' },
  'fogo das fadas': { range: 18, shape: 'box', size: 6, saveAbility: 'DEX', requiresConcentration: true, colorHex: '#ec4899' },
  'faerie fire': { range: 18, shape: 'box', size: 6, saveAbility: 'DEX', requiresConcentration: true, colorHex: '#ec4899' },
  'leque cromatico': { range: 0, shape: 'cone', size: 4.5, colorHex: '#e879f9' },
  'color spray': { range: 0, shape: 'cone', size: 4.5, colorHex: '#e879f9' },
  'orbe cromatica': { range: 27, shape: 'target', size: 0, damageFormula: '3d8', colorHex: '#fbbf24' },
  'chromatic orb': { range: 27, shape: 'target', size: 0, damageFormula: '3d8', colorHex: '#fbbf24' },
  'missil magico': { range: 36, shape: 'multi-target', size: 0, damageType: 'Força', damageFormula: '1d4+1', colorHex: '#818cf8' },
  'magic missile': { range: 36, shape: 'multi-target', size: 0, damageType: 'Força', damageFormula: '1d4+1', colorHex: '#818cf8' },
  'sono': { range: 27, shape: 'circle', size: 6, colorHex: '#c084fc' },
  'sleep': { range: 27, shape: 'circle', size: 6, colorHex: '#c084fc' },
  'bencao': { range: 9, shape: 'multi-target', size: 0, requiresConcentration: true, colorHex: '#fef08a' },
  'bless': { range: 9, shape: 'multi-target', size: 0, requiresConcentration: true, colorHex: '#fef08a' },
  'perdio': { range: 9, shape: 'multi-target', size: 0, saveAbility: 'CHA', requiresConcentration: true, colorHex: '#9333ea' },
  'bane': { range: 9, shape: 'multi-target', size: 0, saveAbility: 'CHA', requiresConcentration: true, colorHex: '#9333ea' },

  // === NÍVEL 2 ===
  'despedacar': { range: 18, shape: 'circle', size: 3, saveAbility: 'CON', damageType: 'Trovão', damageFormula: '3d8', saveHalves: true, colorHex: '#06b6d4' },
  'shatter': { range: 18, shape: 'circle', size: 3, saveAbility: 'CON', damageType: 'Trovão', damageFormula: '3d8', saveHalves: true, colorHex: '#06b6d4' },
  'teia': { range: 18, shape: 'box', size: 6, saveAbility: 'DEX', requiresConcentration: true, colorHex: '#cbd5e1' },
  'web': { range: 18, shape: 'box', size: 6, saveAbility: 'DEX', requiresConcentration: true, colorHex: '#cbd5e1' },
  'raio lunar': { range: 36, shape: 'cylinder', size: 1.5, saveAbility: 'CON', damageType: 'Radiante', damageFormula: '2d10', saveHalves: true, requiresConcentration: true, colorHex: '#e0e7ff' },
  'moonbeam': { range: 36, shape: 'cylinder', size: 1.5, saveAbility: 'CON', damageType: 'Radiante', damageFormula: '2d10', saveHalves: true, requiresConcentration: true, colorHex: '#e0e7ff' },
  'esferas flamejantes': { range: 18, shape: 'circle', size: 1.5, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '2d6', saveHalves: true, requiresConcentration: true, colorHex: '#ea580c' },
  'flaming sphere': { range: 18, shape: 'circle', size: 1.5, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '2d6', saveHalves: true, requiresConcentration: true, colorHex: '#ea580c' },
  'escuridao': { range: 18, shape: 'circle', size: 4.5, requiresConcentration: true, colorHex: '#1e1b4b' },
  'darkness': { range: 18, shape: 'circle', size: 4.5, requiresConcentration: true, colorHex: '#1e1b4b' },
  'soprador de dragao': { range: 0, shape: 'cone', size: 4.5, saveAbility: 'DEX', damageFormula: '3d6', saveHalves: true, requiresConcentration: true, colorHex: '#f59e0b' },
  'dragon\'s breath': { range: 0, shape: 'cone', size: 4.5, saveAbility: 'DEX', damageFormula: '3d6', saveHalves: true, requiresConcentration: true, colorHex: '#f59e0b' },
  'lufada de vento': { range: 0, shape: 'line', size: 18, width: 3, saveAbility: 'STR', requiresConcentration: true, colorHex: '#93c5fd' },
  'gust of wind': { range: 0, shape: 'line', size: 18, width: 3, saveAbility: 'STR', requiresConcentration: true, colorHex: '#93c5fd' },
  'raio ardente': { range: 36, shape: 'multi-target', size: 0, damageType: 'Fogo', damageFormula: '2d6', colorHex: '#f97316' },
  'scorching ray': { range: 36, shape: 'multi-target', size: 0, damageType: 'Fogo', damageFormula: '2d6', colorHex: '#f97316' },

  // === NÍVEL 3 ===
  'bola de fogo': { range: 45, shape: 'circle', size: 6, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '8d6', saveHalves: true, colorHex: '#ef4444' },
  'fireball': { range: 45, shape: 'circle', size: 6, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '8d6', saveHalves: true, colorHex: '#ef4444' },
  'relampago': { range: 0, shape: 'line', size: 30, width: 1.5, saveAbility: 'DEX', damageType: 'Elétrico', damageFormula: '8d6', saveHalves: true, colorHex: '#3b82f6' },
  'lightning bolt': { range: 0, shape: 'line', size: 30, width: 1.5, saveAbility: 'DEX', damageType: 'Elétrico', damageFormula: '8d6', saveHalves: true, colorHex: '#3b82f6' },
  'padrao hipnotico': { range: 36, shape: 'box', size: 9, saveAbility: 'WIS', requiresConcentration: true, colorHex: '#d946ef' },
  'hypnotic pattern': { range: 36, shape: 'box', size: 9, saveAbility: 'WIS', requiresConcentration: true, colorHex: '#d946ef' },
  'guardioes espirituais': { range: 0, shape: 'circle', size: 4.5, saveAbility: 'WIS', damageType: 'Radiante', damageFormula: '3d8', saveHalves: true, requiresConcentration: true, colorHex: '#fef08a' },
  'spirit guardians': { range: 0, shape: 'circle', size: 4.5, saveAbility: 'WIS', damageType: 'Radiante', damageFormula: '3d8', saveHalves: true, requiresConcentration: true, colorHex: '#fef08a' },
  'convocar relampagos': { range: 36, shape: 'cylinder', size: 1.5, saveAbility: 'DEX', damageType: 'Elétrico', damageFormula: '3d10', saveHalves: true, requiresConcentration: true, colorHex: '#0284c7' },
  'call lightning': { range: 36, shape: 'cylinder', size: 1.5, saveAbility: 'DEX', damageType: 'Elétrico', damageFormula: '3d10', saveHalves: true, requiresConcentration: true, colorHex: '#0284c7' },
  'nevoa fetida': { range: 27, shape: 'circle', size: 6, saveAbility: 'CON', requiresConcentration: true, colorHex: '#84cc16' },
  'stinking cloud': { range: 27, shape: 'circle', size: 6, saveAbility: 'CON', requiresConcentration: true, colorHex: '#84cc16' },
  'fome de hadar': { range: 45, shape: 'circle', size: 6, saveAbility: 'DEX', damageType: 'Frio', damageFormula: '2d6', requiresConcentration: true, colorHex: '#312e81' },
  'hunger of hadar': { range: 45, shape: 'circle', size: 6, saveAbility: 'DEX', damageType: 'Frio', damageFormula: '2d6', requiresConcentration: true, colorHex: '#312e81' },
  'lentidao': { range: 36, shape: 'box', size: 12, saveAbility: 'WIS', requiresConcentration: true, colorHex: '#64748b' },
  'slow': { range: 36, shape: 'box', size: 12, saveAbility: 'WIS', requiresConcentration: true, colorHex: '#64748b' },

  // === NÍVEL 4 ===
  'tempestade de gelo': { range: 90, shape: 'cylinder', size: 6, saveAbility: 'DEX', damageType: 'Frio', damageFormula: '2d8', saveHalves: true, colorHex: '#7dd3fc' },
  'ice storm': { range: 90, shape: 'cylinder', size: 6, saveAbility: 'DEX', damageType: 'Frio', damageFormula: '2d8', saveHalves: true, colorHex: '#7dd3fc' },
  'muralha de fogo': { range: 36, shape: 'line', size: 18, width: 1.5, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '5d8', saveHalves: true, requiresConcentration: true, colorHex: '#ea580c' },
  'wall of fire': { range: 36, shape: 'line', size: 18, width: 1.5, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '5d8', saveHalves: true, requiresConcentration: true, colorHex: '#ea580c' },
  'assolamento': { range: 9, shape: 'target', size: 0, saveAbility: 'CON', damageType: 'Necrótico', damageFormula: '8d8', saveHalves: true, colorHex: '#4c1d95' },
  'blight': { range: 9, shape: 'target', size: 0, saveAbility: 'CON', damageType: 'Necrótico', damageFormula: '8d8', saveHalves: true, colorHex: '#4c1d95' },

  // === NÍVEL 5 ===
  'cone de frio': { range: 0, shape: 'cone', size: 18, saveAbility: 'CON', damageType: 'Frio', damageFormula: '8d8', saveHalves: true, colorHex: '#bae6fd' },
  'cone of cold': { range: 0, shape: 'cone', size: 18, saveAbility: 'CON', damageType: 'Frio', damageFormula: '8d8', saveHalves: true, colorHex: '#bae6fd' },
  'nuvem assassina': { range: 36, shape: 'circle', size: 6, saveAbility: 'CON', damageType: 'Veneno', damageFormula: '5d8', saveHalves: true, requiresConcentration: true, colorHex: '#15803d' },
  'cloudkill': { range: 36, shape: 'circle', size: 6, saveAbility: 'CON', damageType: 'Veneno', damageFormula: '5d8', saveHalves: true, requiresConcentration: true, colorHex: '#15803d' },
  'coluna de chamas': { range: 18, shape: 'cylinder', size: 3, saveAbility: 'DEX', damageType: 'Radiante', damageFormula: '4d6', saveHalves: true, colorHex: '#f59e0b' },
  'flame strike': { range: 18, shape: 'cylinder', size: 3, saveAbility: 'DEX', damageType: 'Radiante', damageFormula: '4d6', saveHalves: true, colorHex: '#f59e0b' },
  'sinagoga': { range: 18, shape: 'circle', size: 9, saveAbility: 'WIS', damageType: 'Radiante', damageFormula: '4d10', saveHalves: true, requiresConcentration: true, colorHex: '#facc15' },
  'synaptic static': { range: 36, shape: 'circle', size: 6, saveAbility: 'INT', damageType: 'Psíquico', damageFormula: '8d6', saveHalves: true, colorHex: '#f43f5e' },

  // === NÍVEL 6+ ===
  'desintegrar': { range: 18, shape: 'target', size: 0, saveAbility: 'DEX', damageType: 'Força', damageFormula: '10d6+40', saveHalves: false, colorHex: '#10b981' },
  'disintegrate': { range: 18, shape: 'target', size: 0, saveAbility: 'DEX', damageType: 'Força', damageFormula: '10d6+40', saveHalves: false, colorHex: '#10b981' },
  'raio solar': { range: 0, shape: 'line', size: 18, width: 1.5, saveAbility: 'CON', damageType: 'Radiante', damageFormula: '6d8', saveHalves: true, requiresConcentration: true, colorHex: '#fef08a' },
  'sunbeam': { range: 0, shape: 'line', size: 18, width: 1.5, saveAbility: 'CON', damageType: 'Radiante', damageFormula: '6d8', saveHalves: true, requiresConcentration: true, colorHex: '#fef08a' },
  'tempestade de fogo': { range: 45, shape: 'box', size: 18, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '7d10', saveHalves: true, colorHex: '#b91c1c' },
  'fire storm': { range: 45, shape: 'box', size: 18, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '7d10', saveHalves: true, colorHex: '#b91c1c' },
  'dedo da morte': { range: 18, shape: 'target', size: 0, saveAbility: 'CON', damageType: 'Necrótico', damageFormula: '7d8+30', saveHalves: true, colorHex: '#581c87' },
  'finger of death': { range: 18, shape: 'target', size: 0, saveAbility: 'CON', damageType: 'Necrótico', damageFormula: '7d8+30', saveHalves: true, colorHex: '#581c87' },
  'explosao solar': { range: 45, shape: 'circle', size: 18, saveAbility: 'CON', damageType: 'Radiante', damageFormula: '12d6', saveHalves: true, colorHex: '#fde047' },
  'sunburst': { range: 45, shape: 'circle', size: 18, saveAbility: 'CON', damageType: 'Radiante', damageFormula: '12d6', saveHalves: true, colorHex: '#fde047' },
  'enxame de meteoros': { range: 150, shape: 'circle', size: 12, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '20d6', saveHalves: true, colorHex: '#7f1d1d' },
  'meteor swarm': { range: 150, shape: 'circle', size: 12, saveAbility: 'DEX', damageType: 'Fogo', damageFormula: '20d6', saveHalves: true, colorHex: '#7f1d1d' },
};

/**
 * Remove acentuação e padroniza string para buscas flexíveis
 */
function normalizeSpellQuery(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Retorna a definição de área de efeito, alcance, dano e save para o nome de uma magia.
 */
export function getSpellAoEDefinition(spellName: string): SpellAoEDefinition {
  if (!spellName) {
    return {
      name: 'Magia Desconhecida',
      range: 18,
      shape: 'target',
      size: 0,
      saveHalves: false,
    };
  }

  const cleanQuery = normalizeSpellQuery(spellName);

  // 1. Busca exata ou por substring no banco
  for (const [key, value] of Object.entries(SPELL_SHAPES_MAPPING)) {
    const cleanKey = normalizeSpellQuery(key);
    if (cleanQuery === cleanKey || cleanQuery.includes(cleanKey) || cleanKey.includes(cleanQuery)) {
      return {
        name: spellName,
        saveHalves: value.saveHalves !== undefined ? value.saveHalves : true,
        ...value,
      };
    }
  }

  // 2. Heurística padrão baseada no nome se não encontrada explicitamente
  const isCone = cleanQuery.includes('cone') || cleanQuery.includes('sopro') || cleanQuery.includes('breath');
  const isLine = cleanQuery.includes('linha') || cleanQuery.includes('line') || cleanQuery.includes('raio') || cleanQuery.includes('ray');
  const isSphere = cleanQuery.includes('bola') || cleanQuery.includes('esfera') || cleanQuery.includes('nuvem') || cleanQuery.includes('cloud') || cleanQuery.includes('tempestade');

  if (isCone) {
    return {
      name: spellName,
      range: 0,
      shape: 'cone',
      size: 9,
      saveAbility: 'DEX',
      saveHalves: true,
      colorHex: '#f59e0b',
    };
  }

  if (isLine) {
    return {
      name: spellName,
      range: 0,
      shape: 'line',
      size: 18,
      width: 1.5,
      saveAbility: 'DEX',
      saveHalves: true,
      colorHex: '#38bdf8',
    };
  }

  if (isSphere) {
    return {
      name: spellName,
      range: 36,
      shape: 'circle',
      size: 6,
      saveAbility: 'DEX',
      saveHalves: true,
      colorHex: '#ef4444',
    };
  }

  // Fallback padrão: Alvo único alcance 18m
  return {
    name: spellName,
    range: 18,
    shape: 'target',
    size: 0,
    saveHalves: false,
  };
}
