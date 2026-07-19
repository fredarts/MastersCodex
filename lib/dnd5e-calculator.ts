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

  return {
    ...sheet,
    level: safeLevel,
    hitDiceTotal: `${safeLevel}${hitDie}`,
    maxHp: Math.max(1, estimatedMaxHp),
    currentHp: Math.max(1, estimatedMaxHp),
    spellSlots: newSlots,
  };
}
