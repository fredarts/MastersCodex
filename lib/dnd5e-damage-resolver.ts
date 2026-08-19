/**
 * dnd5e-damage-resolver.ts
 * Motor de resolução de dano D&D 5e do Master's Codex.
 * Suporta normalização de tipos de dano, extração por regex de descrições e
 * cálculo automático de Imunidades (0x), Resistências (0.5x) e Vulnerabilidades (2x).
 */

export type DamageModifierType = 'none' | 'immunity' | 'resistance' | 'vulnerability';

export interface CanonicalDamageType {
  id: string; // chave normalizada sem acento (ex: 'fogo')
  labelPt: string; // Nome exibido em Português (ex: 'Fogo')
  labelEn: string; // Nome em Inglês (ex: 'Fire')
  aliases: string[];
}

export const DND5E_DAMAGE_TYPES: CanonicalDamageType[] = [
  { id: 'acido', labelPt: 'Ácido', labelEn: 'Acid', aliases: ['acido', 'acid', 'dano de acido', 'dano acido'] },
  { id: 'concussao', labelPt: 'Concussão', labelEn: 'Bludgeoning', aliases: ['concussao', 'bludgeoning', 'impacto', 'esmagamento', 'dano de concussao', 'dano de impacto'] },
  { id: 'frio', labelPt: 'Frio', labelEn: 'Cold', aliases: ['frio', 'cold', 'gelo', 'dano de frio', 'dano de gelo'] },
  { id: 'fogo', labelPt: 'Fogo', labelEn: 'Fire', aliases: ['fogo', 'fire', 'chamas', 'dano de fogo', 'dano flamejante'] },
  { id: 'forca', labelPt: 'Força', labelEn: 'Force', aliases: ['forca', 'force', 'dano de forca'] },
  { id: 'eletrico', labelPt: 'Elétrico', labelEn: 'Lightning', aliases: ['eletrico', 'lightning', 'eletricidade', 'raio', 'trovao/eletrico', 'dano eletrico', 'dano de eletricidade'] },
  { id: 'necrotico', labelPt: 'Necrótico', labelEn: 'Necrotic', aliases: ['necrotico', 'necrotic', 'necromancia', 'dano necrotico', 'dano de morte'] },
  { id: 'perfurante', labelPt: 'Perfurante', labelEn: 'Piercing', aliases: ['perfurante', 'piercing', 'perfuracao', 'dano perfurante'] },
  { id: 'veneno', labelPt: 'Veneno', labelEn: 'Poison', aliases: ['veneno', 'poison', 'venenoso', 'dano de veneno', 'dano venenoso', 'toxina'] },
  { id: 'psiquico', labelPt: 'Psíquico', labelEn: 'Psychic', aliases: ['psiquico', 'psychic', 'mental', 'dano psiquico'] },
  { id: 'radiante', labelPt: 'Radiante', labelEn: 'Radiant', aliases: ['radiante', 'radiant', 'sagrado', 'luz', 'dano radiante', 'dano sagrado'] },
  { id: 'cortante', labelPt: 'Cortante', labelEn: 'Slashing', aliases: ['cortante', 'slashing', 'corte', 'dano cortante'] },
  { id: 'trovao', labelPt: 'Trovão', labelEn: 'Thunder', aliases: ['trovao', 'thunder', 'sonico', 'dano de trovao', 'dano sonico'] },
];

/**
 * Remove acentos e caracteres especiais para comparação flexível.
 */
export function sanitizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza qualquer string de tipo de dano (em português, inglês ou com variações)
 * para a definição canônica.
 */
export function normalizeDamageType(typeStr?: string): CanonicalDamageType | null {
  if (!typeStr || !typeStr.trim()) return null;
  const clean = sanitizeString(typeStr);

  for (const dt of DND5E_DAMAGE_TYPES) {
    if (clean === dt.id || clean === sanitizeString(dt.labelPt) || clean === sanitizeString(dt.labelEn)) {
      return dt;
    }
    if (dt.aliases.some((alias) => clean === alias || clean.includes(alias))) {
      return dt;
    }
  }

  return null;
}

/**
 * Extrai a fórmula de dano e o tipo de dano a partir da descrição de uma ação SRD ou arma.
 * Exemplos aceitos:
 * - "Hit: 12 (2d6 + 5) dano de concussão."
 * - "Ataque com Arma: +4 para acertar, alcance 1.5m, 1d8+2 dano cortante."
 * - "1d6 perfurante"
 */
export function parseDamageInfo(
  actionDesc?: string,
  fallbackType?: string,
  fallbackFormula?: string
): {
  formula: string;
  damageType: string;
  canonicalType: CanonicalDamageType | null;
} {
  let foundFormula = fallbackFormula || '1d8';
  let foundTypeStr = fallbackType || '';

  if (actionDesc) {
    // 1. Tentar extrair fórmula de dados (ex: 2d6+3, 1d8 - 1, 3d10)
    const formulaMatch = actionDesc.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/i);
    if (formulaMatch) {
      foundFormula = formulaMatch[1].replace(/\s+/g, '');
    }

    const cleanDesc = sanitizeString(actionDesc);

    // 2. Tentar encontrar menção a tipo de dano (ex: "dano de fogo", "dano cortante", "slashing damage")
    for (const dt of DND5E_DAMAGE_TYPES) {
      for (const alias of dt.aliases) {
        const cleanAlias = sanitizeString(alias);
        const regex = new RegExp(`\\b${cleanAlias}\\b`, 'i');
        if (regex.test(cleanDesc)) {
          foundTypeStr = dt.labelPt;
          break;
        }
      }
      if (foundTypeStr && foundTypeStr === dt.labelPt) break;
    }
  }

  const canonical = normalizeDamageType(foundTypeStr) || normalizeDamageType(fallbackType);

  return {
    formula: foundFormula,
    damageType: canonical ? canonical.labelPt : (fallbackType || 'Físico'),
    canonicalType: canonical,
  };
}

export interface DamageTargetDefense {
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
}

export interface EffectiveDamageResult {
  rawDamage: number;
  effectiveDamage: number;
  damageType: string;
  modifierType: DamageModifierType;
  multiplier: number; // 0 (imune), 0.5 (resistência), 1 (normal), 2 (vulnerabilidade)
  badgeLabel: string;
  explanation: string;
}

/**
 * Calcula o dano efetivo contra um alvo considerando suas resistências, imunidades e vulnerabilidades.
 */
export function calculateEffectiveDamage({
  rawDamage,
  damageType,
  target,
}: {
  rawDamage: number;
  damageType?: string;
  target?: DamageTargetDefense | null;
}): EffectiveDamageResult {
  const canonical = normalizeDamageType(damageType);
  const displayType = canonical ? canonical.labelPt : (damageType || 'Físico');
  const typeKey = canonical ? canonical.id : sanitizeString(displayType);

  // Helper para verificar se a lista de defesas contém o tipo especificado
  const hasDefenseMatch = (list?: string[]): boolean => {
    if (!list || !Array.isArray(list) || list.length === 0) return false;
    return list.some((item) => {
      if (!item) return false;
      const cleanItem = sanitizeString(item);
      if (cleanItem === typeKey) return true;
      if (canonical && (cleanItem === sanitizeString(canonical.labelPt) || cleanItem === sanitizeString(canonical.labelEn))) {
        return true;
      }
      if (canonical && canonical.aliases.some((alias) => cleanItem.includes(alias) || alias.includes(cleanItem))) {
        return true;
      }
      return false;
    });
  };

  // 1. Imunidade (Dano = 0)
  if (target && hasDefenseMatch(target.damageImmunities)) {
    return {
      rawDamage,
      effectiveDamage: 0,
      damageType: displayType,
      modifierType: 'immunity',
      multiplier: 0,
      badgeLabel: `🛡️ Imune a ${displayType}`,
      explanation: `O alvo é Imune a dano ${displayType}. Dano reduzido de ${rawDamage} para 0.`,
    };
  }

  // 2. Vulnerabilidade (Dano = rawDamage * 2)
  if (target && hasDefenseMatch(target.damageVulnerabilities)) {
    const vulnDamage = rawDamage * 2;
    return {
      rawDamage,
      effectiveDamage: vulnDamage,
      damageType: displayType,
      modifierType: 'vulnerability',
      multiplier: 2,
      badgeLabel: `⚠️ Vulnerável a ${displayType} (200%)`,
      explanation: `O alvo é Vulnerável a dano ${displayType}. Dano dobrado de ${rawDamage} para ${vulnDamage}.`,
    };
  }

  // 3. Resistência (Dano = floor(rawDamage / 2))
  if (target && hasDefenseMatch(target.damageResistances)) {
    const resDamage = Math.floor(rawDamage / 2);
    return {
      rawDamage,
      effectiveDamage: resDamage,
      damageType: displayType,
      modifierType: 'resistance',
      multiplier: 0.5,
      badgeLabel: `🛡️ Resistência a ${displayType} (50%)`,
      explanation: `O alvo possui Resistência a dano ${displayType}. Dano reduzido pela metade de ${rawDamage} para ${resDamage}.`,
    };
  }

  // 4. Dano Normal (100%)
  return {
    rawDamage,
    effectiveDamage: rawDamage,
    damageType: displayType,
    modifierType: 'none',
    multiplier: 1,
    badgeLabel: `${displayType}`,
    explanation: `Dano integral de ${rawDamage} (${displayType}) aplicado.`,
  };
}
