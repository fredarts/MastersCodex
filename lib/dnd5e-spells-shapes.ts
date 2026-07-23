export interface SpellAoEDefinition {
  name: string;
  range: number;        // Alcance máximo em metros (0 para Pessoal/Toque)
  shape: 'circle' | 'cone' | 'line' | 'fan' | 'target' | 'multi-target';
  size: number;         // Raio do círculo, comprimento do cone/linha em metros (0 se não for AoE)
}

const SPELL_SHAPES_MAPPING: Record<string, Omit<SpellAoEDefinition, 'name'>> = {
  // Truques
  'explosao mistica': { range: 36, shape: 'target', size: 0 },
  'eldritch blast': { range: 36, shape: 'target', size: 0 },
  'chama sagrada': { range: 18, shape: 'target', size: 0 },
  'sacred flame': { range: 18, shape: 'target', size: 0 },
  'chicote de espinhos': { range: 9, shape: 'target', size: 0 },
  'thorn whip': { range: 9, shape: 'target', size: 0 },

  // Nível 1
  'missil magico': { range: 36, shape: 'multi-target', size: 0 },
  'magic missile': { range: 36, shape: 'multi-target', size: 0 },
  'maos flamejantes': { range: 0, shape: 'cone', size: 4.5 },
  'burning hands': { range: 0, shape: 'cone', size: 4.5 },
  'leque cromatico': { range: 0, shape: 'fan', size: 4.5 },
  'color spray': { range: 0, shape: 'fan', size: 4.5 },

  // Nível 2
  'raio de ruina': { range: 36, shape: 'target', size: 0 },
  'scorching ray': { range: 36, shape: 'target', size: 0 },

  // Nível 3
  'bola de fogo': { range: 45, shape: 'circle', size: 6 },
  'fireball': { range: 45, shape: 'circle', size: 6 },
  'relampago': { range: 0, shape: 'line', size: 30 },
  'lightning bolt': { range: 0, shape: 'line', size: 30 },
};

/**
 * Retorna a definição de área de efeito e alcance para um nome de magia (faz busca case-insensitive e parcial)
 */
export function getSpellAoEDefinition(spellName: string): SpellAoEDefinition | null {
  if (!spellName) return null;
  const cleanName = spellName.toLowerCase().trim();

  // Busca exata ou substring
  for (const [key, value] of Object.entries(SPELL_SHAPES_MAPPING)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return {
        name: spellName,
        ...value,
      };
    }
  }

  // Fallback padrão se não encontrar mapeamento específico (ex: magia de alvo único com alcance padrão de 18m)
  return {
    name: spellName,
    range: 18,
    shape: 'circle',
    size: 1.5,
  };
}
