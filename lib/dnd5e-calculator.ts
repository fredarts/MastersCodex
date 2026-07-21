import { AttributeKey, CharacterSheet, DndSkillKey, SkillProficiencyLevel } from './types';
import { DND_CLASSES, DND_RACES, SKILL_DEFINITIONS } from './dnd5e-data';

/**
 * Retorna o Modificador de Atributo padrão D&D 5e: floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Retorna a string do modificador formatada com sinal ex: "+3", "-1", "+0"
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Bônus de Proficiência por nível D&D 5e:
 * Níveis 1-4: +2
 * Níveis 5-8: +3
 * Níveis 9-12: +4
 * Níveis 13-16: +5
 * Níveis 17-20: +6
 */
export function calculateProficiencyBonus(level: number): number {
  const safeLevel = Math.max(1, Math.min(20, level));
  return Math.ceil(1 + safeLevel / 4);
}

/**
 * Obtém o valor final do modificador do atributo (respeitando override se houver)
 */
export function getAttributeModifier(sheet: CharacterSheet, attrKey: AttributeKey): number {
  const attr = sheet.attributes[attrKey];
  if (attr.overrideMod !== undefined && attr.overrideMod !== null) {
    return attr.overrideMod;
  }
  return calculateModifier(attr.score);
}

/**
 * Calcula o bônus de Teste de Resistência (Salvaguarda) para um atributo
 */
export function calculateSavingThrowTotal(sheet: CharacterSheet, attrKey: AttributeKey): number {
  const attrMod = getAttributeModifier(sheet, attrKey);
  const isProficient = sheet.savingThrows[attrKey];
  const profBonus = calculateProficiencyBonus(sheet.level);
  return attrMod + (isProficient ? profBonus : 0);
}

/**
 * Calcula o valor total da Perícia
 */
export function calculateSkillTotal(sheet: CharacterSheet, skillKey: DndSkillKey): number {
  const def = SKILL_DEFINITIONS[skillKey];
  if (!def) return 0;

  const attrMod = getAttributeModifier(sheet, def.attr);
  const profLevel: SkillProficiencyLevel = sheet.skills[skillKey] || 'none';
  const profBonus = calculateProficiencyBonus(sheet.level);

  if (profLevel === 'expertise') {
    return attrMod + profBonus * 2;
  } else if (profLevel === 'proficient') {
    return attrMod + profBonus;
  }
  return attrMod;
}

/**
 * Sabedoria Passiva (Percepção Passiva): 10 + Mod Sabedoria + Proficiência em Percepção
 */
export function calculatePassivePerception(sheet: CharacterSheet): number {
  const perceptionTotal = calculateSkillTotal(sheet, 'percepcao');
  return 10 + perceptionTotal;
}

/**
 * CD de Resistência das Magias: 8 + Bônus Proficiência + Modificador de Atributo de Conjuração
 */
export function calculateSpellDC(sheet: CharacterSheet): number {
  if (sheet.spellSaveDcOverride) return sheet.spellSaveDcOverride;
  const abilityKey = sheet.spellcastingAbility || 'int';
  const abilityMod = getAttributeModifier(sheet, abilityKey);
  const profBonus = calculateProficiencyBonus(sheet.level);
  return 8 + profBonus + abilityMod;
}

/**
 * Bônus de Ataque de Magia: Bônus Proficiência + Modificador de Atributo de Conjuração
 */
export function calculateSpellAttackBonus(sheet: CharacterSheet): number {
  if (sheet.spellAttackBonusOverride) return sheet.spellAttackBonusOverride;
  const abilityKey = sheet.spellcastingAbility || 'int';
  const abilityMod = getAttributeModifier(sheet, abilityKey);
  const profBonus = calculateProficiencyBonus(sheet.level);
  return profBonus + abilityMod;
}

/**
 * Aplica autocompletar ao selecionar uma Raça
 */
export function applyRacePreset(sheet: CharacterSheet, raceName: string): CharacterSheet {
  const raceData = DND_RACES[raceName];
  if (!raceData) return sheet;

  const newAttributes = { ...sheet.attributes };
  // Reinicia para base antes de aplicar bônus da raça se necessário
  Object.keys(newAttributes).forEach((key) => {
    const k = key as AttributeKey;
    const bonus = raceData.attributes[k] || 0;
    // Ajusta o score base + bônus
    newAttributes[k] = { ...newAttributes[k], score: Math.max(8, newAttributes[k].score + bonus) };
  });

  return {
    ...sheet,
    race: raceName,
    speed: raceData.speed,
    featuresAndTraits: `${raceData.traits}\n\n${sheet.featuresAndTraits || ''}`.trim(),
    otherProficienciesAndLanguages: `Idiomas: ${raceData.languages.join(', ')}.\n${sheet.otherProficienciesAndLanguages || ''}`.trim(),
  };
}

/**
 * Aplica autocompletar ao selecionar uma Classe
 */
export function applyClassPreset(sheet: CharacterSheet, className: string): CharacterSheet {
  const classData = DND_CLASSES[className];
  if (!classData) return sheet;

  // Atualiza Salvaguardas
  const newSavingThrows = {
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
  };

  classData.savingThrows.forEach((attr) => {
    newSavingThrows[attr] = true;
  });

  // Estima HP inicial
  const conMod = getAttributeModifier(sheet, 'con');
  const hitDieVal = parseInt(classData.hitDie.replace('1d', ''), 10) || 8;
  const estimatedMaxHp = hitDieVal + conMod + Math.max(0, sheet.level - 1) * (Math.floor(hitDieVal / 2) + 1 + conMod);

  return {
    ...sheet,
    className,
    savingThrows: newSavingThrows,
    hitDiceTotal: `${sheet.level}${classData.hitDie}`,
    hitDiceUsed: `0${classData.hitDie}`,
    maxHp: Math.max(1, estimatedMaxHp),
    currentHp: Math.max(1, estimatedMaxHp),
    spellcastingAbility: classData.spellcastingAbility || sheet.spellcastingAbility,
    spellcastingClass: classData.spellcastingAbility ? className : sheet.spellcastingClass,
    otherProficienciesAndLanguages: `Proficiências de Armadura: ${classData.armorProficiencies}.\nProficiências de Armas: ${classData.weaponProficiencies}.\n${sheet.otherProficienciesAndLanguages || ''}`.trim(),
  };
}

/**
 * Recalcula a ficha quando o Nível muda
 */
export function applyLevelChange(sheet: CharacterSheet, level: number): CharacterSheet {
  const safeLevel = Math.max(1, Math.min(20, level));
  const classData = DND_CLASSES[sheet.className];
  const hitDie = classData ? classData.hitDie : '1d8';

  const conMod = getAttributeModifier(sheet, 'con');
  const hitDieVal = parseInt(hitDie.replace('1d', ''), 10) || 8;
  const estimatedMaxHp = hitDieVal + conMod + Math.max(0, safeLevel - 1) * (Math.floor(hitDieVal / 2) + 1 + conMod);

  // Ajusta Slots de Magia básicos por nível se for classe conjuradora
  const newSlots = { ...sheet.spellSlots };
  if (sheet.spellcastingAbility) {
    for (let l = 1; l <= 9; l++) {
      if (l === 1) newSlots[l] = { total: safeLevel >= 1 ? Math.min(4, safeLevel + 1) : 0, used: 0 };
      else if (l === 2) newSlots[l] = { total: safeLevel >= 3 ? (safeLevel >= 4 ? 3 : 2) : 0, used: 0 };
      else if (l === 3) newSlots[l] = { total: safeLevel >= 5 ? (safeLevel >= 6 ? 3 : 2) : 0, used: 0 };
      else if (l === 4) newSlots[l] = { total: safeLevel >= 7 ? (safeLevel >= 8 ? 3 : 2) : 0, used: 0 };
      else if (l === 5) newSlots[l] = { total: safeLevel >= 9 ? (safeLevel >= 10 ? 3 : 2) : 0, used: 0 };
      else if (l === 6) newSlots[l] = { total: safeLevel >= 11 ? 1 : 0, used: 0 };
      else if (l === 7) newSlots[l] = { total: safeLevel >= 13 ? 1 : 0, used: 0 };
      else if (l === 8) newSlots[l] = { total: safeLevel >= 15 ? 1 : 0, used: 0 };
      else if (l === 9) newSlots[l] = { total: safeLevel >= 17 ? 1 : 0, used: 0 };
    }
  }

  // Concede +2 pontos de atributo (ASI D&D 5e) nos níveis 4, 8, 12, 16 e 19 se o nível tiver subido
  const asiLevels = [4, 8, 12, 16, 19];
  let extraPoints = sheet.attributePointsAvailable || 0;
  let isUnlocked = sheet.attributesLocked ?? true;

  if (safeLevel > sheet.level && asiLevels.includes(safeLevel)) {
    extraPoints += 2;
    isUnlocked = false;
  }

  return {
    ...sheet,
    level: safeLevel,
    attributePointsAvailable: extraPoints,
    attributesLocked: isUnlocked,
    hitDiceTotal: `${safeLevel}${hitDie}`,
    maxHp: Math.max(1, estimatedMaxHp),
    currentHp: Math.max(1, estimatedMaxHp),
    spellSlots: newSlots,
  };
}

// ==========================================
// FASE 2: AUTO-CÁLCULOS DE CA, ARMAS E DESCANSO
// ==========================================

export type ArmorCategory = 'none' | 'light' | 'medium' | 'heavy';

export interface ArmorInfo {
  name: string;
  category: ArmorCategory;
  baseAC: number;
  stealthDisadvantage?: boolean;
  minStrength?: number;
}

export const ARMOR_TABLE: Record<string, ArmorInfo> = {
  'Nenhuma': { name: 'Nenhuma', category: 'none', baseAC: 10 },
  'Acolchoada': { name: 'Acolchoada', category: 'light', baseAC: 11, stealthDisadvantage: true },
  'Couro': { name: 'Couro', category: 'light', baseAC: 11 },
  'Couro Batido': { name: 'Couro Batido', category: 'light', baseAC: 12 },
  'Gibão de Peles': { name: 'Gibão de Peles', category: 'medium', baseAC: 12 },
  'Cota de Malha': { name: 'Cota de Malha', category: 'medium', baseAC: 13 },
  'Peitoral': { name: 'Peitoral', category: 'medium', baseAC: 14 },
  'Meia-Armadura': { name: 'Meia-Armadura', category: 'medium', baseAC: 15, stealthDisadvantage: true },
  'Cota de Anéis': { name: 'Cota de Anéis', category: 'heavy', baseAC: 14, stealthDisadvantage: true },
  'Brunea': { name: 'Brunea', category: 'heavy', baseAC: 16, stealthDisadvantage: true, minStrength: 13 },
  'Cota de Talas': { name: 'Cota de Talas', category: 'heavy', baseAC: 17, stealthDisadvantage: true, minStrength: 15 },
  'Placas': { name: 'Placas', category: 'heavy', baseAC: 18, stealthDisadvantage: true, minStrength: 15 },
};

/**
 * Calcula a Classe de Armadura (CA) baseada na armadura equipada, escudo e habilidades de classe
 */
export function calculateArmorClass(
  sheet: CharacterSheet,
  armorName: string = 'Nenhuma',
  hasShield: boolean = false,
): number {
  const dexMod = getAttributeModifier(sheet, 'dex');
  const armor = ARMOR_TABLE[armorName] || ARMOR_TABLE['Nenhuma'];
  let ac: number;

  switch (armor.category) {
    case 'light':
      ac = armor.baseAC + dexMod;
      break;
    case 'medium':
      ac = armor.baseAC + Math.min(dexMod, 2);
      break;
    case 'heavy':
      ac = armor.baseAC;
      break;
    case 'none':
    default:
      // Defesa sem Armadura — Bárbaro: 10 + DES + CON
      if (sheet.className === 'Bárbaro') {
        const conMod = getAttributeModifier(sheet, 'con');
        ac = 10 + dexMod + conMod;
      }
      // Defesa sem Armadura — Monge: 10 + DES + SAB
      else if (sheet.className === 'Monge') {
        const wisMod = getAttributeModifier(sheet, 'wis');
        ac = 10 + dexMod + wisMod;
      }
      // Padrão: 10 + DES
      else {
        ac = 10 + dexMod;
      }
      break;
  }

  if (hasShield) ac += 2;

  return ac;
}

export interface WeaponInfo {
  name: string;
  damage: string;
  damageType: string;
  isFinesse?: boolean;
  isRanged?: boolean;
  isMartial?: boolean;
  isMagical?: boolean;
  magicBonus?: number;
  range?: string;
  properties: string[];
  weight: number;
  cost: string;
  category: 'Corpo a Corpo Simples' | 'Corpo a Corpo Marcial' | 'À Distância Simples' | 'À Distância Marcial' | 'Mágica';
}

export const WEAPON_TABLE: Record<string, WeaponInfo> = {
  // ============================================
  // ARMAS SIMPLES — CORPO A CORPO
  // ============================================
  'Bordão': { name: 'Bordão', damage: '1d6', damageType: 'Concussão', category: 'Corpo a Corpo Simples', properties: ['Versátil (1d8)'], weight: 4, cost: '2 pr' },
  'Adaga': { name: 'Adaga', damage: '1d4', damageType: 'Perfurante', isFinesse: true, category: 'Corpo a Corpo Simples', properties: ['Acuidade', 'Leve', 'Arremesso (6/18m)'], weight: 1, cost: '2 po' },
  'Clava Grande': { name: 'Clava Grande', damage: '1d8', damageType: 'Concussão', category: 'Corpo a Corpo Simples', properties: ['Duas Mãos'], weight: 10, cost: '2 pr' },
  'Machadinha': { name: 'Machadinha', damage: '1d6', damageType: 'Cortante', category: 'Corpo a Corpo Simples', properties: ['Leve', 'Arremesso (6/18m)'], weight: 2, cost: '5 po' },
  'Dardo': { name: 'Dardo', damage: '1d4', damageType: 'Perfurante', category: 'Corpo a Corpo Simples', properties: ['Arremesso (6/18m)'], weight: 0.25, cost: '5 pc' },
  'Foice Leve': { name: 'Foice Leve', damage: '1d4', damageType: 'Cortante', category: 'Corpo a Corpo Simples', properties: ['Leve'], weight: 2, cost: '1 po' },
  'Lança': { name: 'Lança', damage: '1d6', damageType: 'Perfurante', category: 'Corpo a Corpo Simples', properties: ['Arremesso (6/18m)', 'Versátil (1d8)'], weight: 3, cost: '1 po' },
  'Maça': { name: 'Maça', damage: '1d6', damageType: 'Concussão', category: 'Corpo a Corpo Simples', properties: [], weight: 4, cost: '5 po' },
  'Porrete': { name: 'Porrete', damage: '1d4', damageType: 'Concussão', category: 'Corpo a Corpo Simples', properties: ['Leve'], weight: 2, cost: '1 pr' },
  'Lança Longa': { name: 'Lança Longa', damage: '1d12', damageType: 'Perfurante', category: 'Corpo a Corpo Simples', properties: ['Alcance', 'Pesada', 'Duas Mãos'], weight: 18, cost: '5 po' },
  'Martelo Leve': { name: 'Martelo Leve', damage: '1d4', damageType: 'Concussão', category: 'Corpo a Corpo Simples', properties: ['Leve', 'Arremesso (6/18m)'], weight: 2, cost: '2 po' },

  // ============================================
  // ARMAS SIMPLES — À DISTÂNCIA
  // ============================================
  'Besta Leve': { name: 'Besta Leve', damage: '1d8', damageType: 'Perfurante', isRanged: true, category: 'À Distância Simples', properties: ['Munição (24/96m)', 'Carregamento', 'Duas Mãos'], weight: 5, cost: '25 po' },
  'Arco Curto': { name: 'Arco Curto', damage: '1d6', damageType: 'Perfurante', isRanged: true, category: 'À Distância Simples', properties: ['Munição (24/96m)', 'Duas Mãos'], weight: 2, cost: '25 po' },
  'Funda': { name: 'Funda', damage: '1d4', damageType: 'Concussão', isRanged: true, category: 'À Distância Simples', properties: ['Munição (9/36m)'], weight: 0, cost: '1 pr' },

  // ============================================
  // ARMAS MARCIAIS — CORPO A CORPO
  // ============================================
  'Machado de Batalha': { name: 'Machado de Batalha', damage: '1d8', damageType: 'Cortante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Versátil (1d10)'], weight: 4, cost: '10 po' },
  'Mangual': { name: 'Mangual', damage: '1d8', damageType: 'Concussão', isMartial: true, category: 'Corpo a Corpo Marcial', properties: [], weight: 2, cost: '10 po' },
  'Glaive': { name: 'Glaive', damage: '1d10', damageType: 'Cortante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Pesada', 'Alcance', 'Duas Mãos'], weight: 6, cost: '20 po' },
  'Machado Grande': { name: 'Machado Grande', damage: '1d12', damageType: 'Cortante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Pesada', 'Duas Mãos'], weight: 7, cost: '30 po' },
  'Espada Grande': { name: 'Espada Grande', damage: '2d6', damageType: 'Cortante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Pesada', 'Duas Mãos'], weight: 6, cost: '50 po' },
  'Alabarda': { name: 'Alabarda', damage: '1d10', damageType: 'Cortante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Pesada', 'Alcance', 'Duas Mãos'], weight: 6, cost: '20 po' },
  'Espada Longa': { name: 'Espada Longa', damage: '1d8', damageType: 'Cortante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Versátil (1d10)'], weight: 3, cost: '15 po' },
  'Maça de Guerra': { name: 'Maça de Guerra', damage: '1d8', damageType: 'Perfurante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: [], weight: 4, cost: '15 po' },
  'Estrela da Manhã': { name: 'Estrela da Manhã', damage: '1d8', damageType: 'Perfurante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: [], weight: 4, cost: '15 po' },
  'Picareta de Guerra': { name: 'Picareta de Guerra', damage: '1d8', damageType: 'Perfurante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: [], weight: 2, cost: '5 po' },
  'Rapieira': { name: 'Rapieira', damage: '1d8', damageType: 'Perfurante', isFinesse: true, isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Acuidade'], weight: 2, cost: '25 po' },
  'Cimitarra': { name: 'Cimitarra', damage: '1d6', damageType: 'Cortante', isFinesse: true, isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Acuidade', 'Leve'], weight: 3, cost: '25 po' },
  'Espada Curta': { name: 'Espada Curta', damage: '1d6', damageType: 'Perfurante', isFinesse: true, isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Acuidade', 'Leve'], weight: 2, cost: '10 po' },
  'Tridente': { name: 'Tridente', damage: '1d6', damageType: 'Perfurante', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Arremesso (6/18m)', 'Versátil (1d8)'], weight: 4, cost: '5 po' },
  'Chicote': { name: 'Chicote', damage: '1d4', damageType: 'Cortante', isFinesse: true, isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Acuidade', 'Alcance'], weight: 3, cost: '2 po' },
  'Martelo de Guerra': { name: 'Martelo de Guerra', damage: '1d8', damageType: 'Concussão', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Versátil (1d10)'], weight: 2, cost: '15 po' },
  'Malho': { name: 'Malho', damage: '2d6', damageType: 'Concussão', isMartial: true, category: 'Corpo a Corpo Marcial', properties: ['Pesada', 'Duas Mãos'], weight: 10, cost: '10 po' },

  // ============================================
  // ARMAS MARCIAIS — À DISTÂNCIA
  // ============================================
  'Zarabatana': { name: 'Zarabatana', damage: '1', damageType: 'Perfurante', isRanged: true, isMartial: true, category: 'À Distância Marcial', properties: ['Munição (7.5/30m)', 'Carregamento'], weight: 1, cost: '10 po' },
  'Besta de Mão': { name: 'Besta de Mão', damage: '1d6', damageType: 'Perfurante', isRanged: true, isMartial: true, category: 'À Distância Marcial', properties: ['Munição (9/36m)', 'Leve', 'Carregamento'], weight: 3, cost: '75 po' },
  'Besta Pesada': { name: 'Besta Pesada', damage: '1d10', damageType: 'Perfurante', isRanged: true, isMartial: true, category: 'À Distância Marcial', properties: ['Munição (30/120m)', 'Pesada', 'Carregamento', 'Duas Mãos'], weight: 18, cost: '50 po' },
  'Arco Longo': { name: 'Arco Longo', damage: '1d8', damageType: 'Perfurante', isRanged: true, isMartial: true, category: 'À Distância Marcial', properties: ['Munição (45/180m)', 'Pesada', 'Duas Mãos'], weight: 2, cost: '50 po' },
  'Rede': { name: 'Rede', damage: '0', damageType: '—', isRanged: true, isMartial: true, category: 'À Distância Marcial', properties: ['Especial', 'Arremesso (1.5/4.5m)'], weight: 3, cost: '1 po' },

  // ============================================
  // ARMAS MÁGICAS (EXEMPLOS CLÁSSICOS)
  // ============================================
  'Espada Longa +1': { name: 'Espada Longa +1', damage: '1d8', damageType: 'Cortante', isMartial: true, isMagical: true, magicBonus: 1, category: 'Mágica', properties: ['Versátil (1d10)', 'Mágica +1'], weight: 3, cost: 'Rara' },
  'Espada Longa +2': { name: 'Espada Longa +2', damage: '1d8', damageType: 'Cortante', isMartial: true, isMagical: true, magicBonus: 2, category: 'Mágica', properties: ['Versátil (1d10)', 'Mágica +2'], weight: 3, cost: 'Muito Rara' },
  'Espada Longa +3': { name: 'Espada Longa +3', damage: '1d8', damageType: 'Cortante', isMartial: true, isMagical: true, magicBonus: 3, category: 'Mágica', properties: ['Versátil (1d10)', 'Mágica +3'], weight: 3, cost: 'Lendária' },
  'Adaga +1': { name: 'Adaga +1', damage: '1d4', damageType: 'Perfurante', isFinesse: true, isMagical: true, magicBonus: 1, category: 'Mágica', properties: ['Acuidade', 'Leve', 'Arremesso (6/18m)', 'Mágica +1'], weight: 1, cost: 'Incomum' },
  'Arco Longo +1': { name: 'Arco Longo +1', damage: '1d8', damageType: 'Perfurante', isRanged: true, isMartial: true, isMagical: true, magicBonus: 1, category: 'Mágica', properties: ['Munição (45/180m)', 'Pesada', 'Duas Mãos', 'Mágica +1'], weight: 2, cost: 'Incomum' },
  'Espada Curta do Fogo': { name: 'Espada Curta do Fogo', damage: '1d6 + 1d6 🔥', damageType: 'Perfurante + Fogo', isFinesse: true, isMartial: true, isMagical: true, magicBonus: 0, category: 'Mágica', properties: ['Acuidade', 'Leve', 'Mágica', 'Dano Extra de Fogo (1d6)'], weight: 2, cost: 'Rara' },
  'Machado Grande do Berserker': { name: 'Machado Grande do Berserker', damage: '1d12', damageType: 'Cortante', isMartial: true, isMagical: true, magicBonus: 1, category: 'Mágica', properties: ['Pesada', 'Duas Mãos', 'Mágica +1', 'Amaldiçoado: Fúria Implacável'], weight: 7, cost: 'Rara' },
};

/**
 * Calcula o bônus de ataque e dano de uma arma automaticamente
 */
export function calculateWeaponAttack(
  sheet: CharacterSheet,
  weaponName: string,
): { atkBonus: string; damage: string; damageType: string } {
  const weapon = WEAPON_TABLE[weaponName];
  if (!weapon) {
    return { atkBonus: '+0', damage: '1d4', damageType: 'Físico' };
  }

  const profBonus = calculateProficiencyBonus(sheet.level);
  const strMod = getAttributeModifier(sheet, 'str');
  const dexMod = getAttributeModifier(sheet, 'dex');
  const magic = weapon.magicBonus || 0;

  let abilityMod: number;
  if (weapon.isRanged) {
    abilityMod = dexMod;
  } else if (weapon.isFinesse) {
    abilityMod = Math.max(strMod, dexMod);
  } else {
    abilityMod = strMod;
  }

  const totalAtk = abilityMod + profBonus + magic;
  const totalDamageMod = abilityMod + magic;
  const damageStr = `${weapon.damage} ${totalDamageMod >= 0 ? '+' : ''}${totalDamageMod}`;

  return {
    atkBonus: totalAtk >= 0 ? `+${totalAtk}` : `${totalAtk}`,
    damage: damageStr,
    damageType: weapon.damageType,
  };
}

/**
 * Aplica Descanso Curto (Short Rest):
 * - Gasta N dados de vida, rola cada um e recupera HP
 * - Retorna a ficha atualizada e o total de HP recuperados
 */
export function applyShortRest(
  sheet: CharacterSheet,
  diceToSpend: number,
): { updatedSheet: CharacterSheet; hpRecovered: number } {
  const classData = DND_CLASSES[sheet.className];
  const hitDie = classData ? classData.hitDie : '1d8';
  const hitDieVal = parseInt(hitDie.replace('1d', ''), 10) || 8;
  const conMod = getAttributeModifier(sheet, 'con');

  // Dados de vida já usados e totais
  const hitDiceUsedMatch = sheet.hitDiceUsed.match(/^(\d+)/);
  let usedCount = hitDiceUsedMatch ? parseInt(hitDiceUsedMatch[1], 10) : 0;
  const totalDice = sheet.level;
  const availableDice = Math.max(0, totalDice - usedCount);

  const actualSpend = Math.min(diceToSpend, availableDice);
  if (actualSpend <= 0) {
    return { updatedSheet: sheet, hpRecovered: 0 };
  }

  let hpRecovered = 0;
  for (let i = 0; i < actualSpend; i++) {
    const roll = Math.floor(Math.random() * hitDieVal) + 1;
    hpRecovered += Math.max(1, roll + conMod);
  }

  usedCount += actualSpend;
  const newCurrentHp = Math.min(sheet.maxHp, sheet.currentHp + hpRecovered);

  return {
    updatedSheet: {
      ...sheet,
      currentHp: newCurrentHp,
      hitDiceUsed: `${usedCount}${hitDie}`,
    },
    hpRecovered,
  };
}

/**
 * Aplica Descanso Longo (Long Rest):
 * - Restaura 100% do HP
 * - Recupera metade dos dados de vida totais (mínimo 1)
 * - Reseta todos os slots de magia
 * - Zera death saves
 */
export function applyLongRest(sheet: CharacterSheet): CharacterSheet {
  const classData = DND_CLASSES[sheet.className];
  const hitDie = classData ? classData.hitDie : '1d8';
  const totalDice = sheet.level;

  // Recupera metade dos dados de vida (mínimo 1)
  const hitDiceUsedMatch = sheet.hitDiceUsed.match(/^(\d+)/);
  let usedCount = hitDiceUsedMatch ? parseInt(hitDiceUsedMatch[1], 10) : 0;
  const recovered = Math.max(1, Math.floor(totalDice / 2));
  usedCount = Math.max(0, usedCount - recovered);

  // Reseta todos os slots de magia
  const newSlots = { ...sheet.spellSlots };
  for (const level in newSlots) {
    newSlots[parseInt(level, 10)] = { ...newSlots[parseInt(level, 10)], used: 0 };
  }

  return {
    ...sheet,
    currentHp: sheet.maxHp,
    tempHp: 0,
    hitDiceUsed: `${usedCount}${hitDie}`,
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: newSlots,
  };
}

/**
 * Recalcula AUTOMATICAMENTE todos os valores derivados da ficha D&D 5e:
 * 1. CA (Classe de Armadura) = Armadura equipada + Mod DES (respeitando limites) + Escudo + Defesa Sem Armadura
 * 2. HP Máximo = Dado de Vida + Mod CON * Nível
 * 3. Ataques = Atualiza os bônus de acerto (Proficiência + Força/Destreza) de todas as armas
 */
export function recalculateSheetDerivedStats(sheet: CharacterSheet): CharacterSheet {
  const conMod = getAttributeModifier(sheet, 'con');
  const strMod = getAttributeModifier(sheet, 'str');
  const dexMod = getAttributeModifier(sheet, 'dex');
  const profBonus = calculateProficiencyBonus(sheet.level);

  // 1. Recalcula Classe de Armadura (CA)
  const newAC = calculateArmorClass(sheet, sheet.equippedArmor || 'Nenhuma', sheet.hasShield || false);

  // 2. Recalcula Pontos de Vida Máximos (Max HP)
  const classData = DND_CLASSES[sheet.className];
  const hitDie = classData ? classData.hitDie : '1d8';
  const hitDieVal = parseInt(hitDie.replace('1d', ''), 10) || 8;
  const newMaxHp = Math.max(
    1,
    hitDieVal + conMod + Math.max(0, sheet.level - 1) * (Math.floor(hitDieVal / 2) + 1 + conMod)
  );

  // Ajusta o HP Atual para manter a mesma proporção ou respeitar o novo teto
  const hpDiff = newMaxHp - sheet.maxHp;
  const newCurrentHp = hpDiff > 0 ? sheet.currentHp + hpDiff : Math.min(sheet.currentHp, newMaxHp);

  // 3. Recalcula Ataques de Armas com Proficiência e Força/Destreza
  const updatedAttacks = sheet.attacks.map((atk) => {
    if (WEAPON_TABLE[atk.name]) {
      const calc = calculateWeaponAttack(sheet, atk.name);
      return {
        ...atk,
        atkBonus: calc.atkBonus,
        damage: calc.damage,
        type: calc.damageType,
      };
    }

    // Se for uma arma personalizada, recalcula o bônus de acerto com base em Força ou Destreza + Proficiência
    const isRangedOrFinesse =
      atk.type?.toLowerCase().includes('distância') ||
      atk.type?.toLowerCase().includes('perfurante') ||
      atk.name.toLowerCase().includes('arco') ||
      atk.name.toLowerCase().includes('adaga') ||
      atk.name.toLowerCase().includes('rapieira');

    const modToUse = isRangedOrFinesse ? Math.max(strMod, dexMod) : strMod;
    const totalAtk = modToUse + profBonus;

    return {
      ...atk,
      atkBonus: formatModifier(totalAtk),
    };
  });

  return {
    ...sheet,
    armorClass: newAC,
    maxHp: newMaxHp,
    currentHp: Math.max(1, newCurrentHp),
    attacks: updatedAttacks,
  };
}
