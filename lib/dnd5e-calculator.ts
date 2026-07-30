import { AttributeKey, CharacterSheet, DndSkillKey, SkillProficiencyLevel, ClassFeature, CharacterResource, CharacterClassProgress } from './types';
import { DND_CLASSES, DND_RACES, SKILL_DEFINITIONS, CLASS_FEATURES_DB } from './dnd5e-data';

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
 * Helpers para Multiclasse
 */
export function getCharacterClasses(sheet: CharacterSheet): CharacterClassProgress[] {
  if (sheet.classes && sheet.classes.length > 0) {
    return sheet.classes;
  }
  return [{ name: sheet.className, level: sheet.level, subclass: sheet.subclass, isPrimary: true }];
}

export function hasClass(sheet: CharacterSheet, className: string): boolean {
  return getCharacterClasses(sheet).some(c => c.name === className);
}

export function getClassLevel(sheet: CharacterSheet, className: string): number {
  const found = getCharacterClasses(sheet).find(c => c.name === className);
  return found ? found.level : 0;
}

/**
 * Retorna os recursos de classe baseados no nível e atributos do personagem
 */
export function getClassResourcesForLevel(
  sheet: CharacterSheet,
  totalLevel: number
): Record<string, CharacterResource> {
  const resources: Record<string, CharacterResource> = {};
  
  const classes = getCharacterClasses(sheet);
  
  classes.forEach(c => {
    if (c.name === 'Bárbaro') {
      let furiaMax = 2;
      if (c.level >= 20) furiaMax = 9999;
      else if (c.level >= 17) furiaMax = 6;
      else if (c.level >= 12) furiaMax = 5;
      else if (c.level >= 6) furiaMax = 4;
      else if (c.level >= 3) furiaMax = 3;
      
      resources['furia'] = {
        name: 'furia',
        label: 'Fúrias',
        current: furiaMax,
        max: furiaMax
      };
    } else if (c.name === 'Paladino') {
      const chaMod = Math.floor(((sheet.attributes.cha?.score || 10) - 10) / 2);
      const divinoMax = Math.max(1, 1 + chaMod);
      
      resources['lay_on_hands'] = {
        name: 'lay_on_hands',
        label: 'Mãos Curativas (PVs)',
        current: 5 * c.level,
        max: 5 * c.level
      };
      
      resources['sentido_divino'] = {
        name: 'sentido_divino',
        label: 'Sentido Divino',
        current: divinoMax,
        max: divinoMax
      };
      
      if (c.level >= 3) {
        resources['canalizar_divindade'] = {
          name: 'canalizar_divindade',
          label: 'Canalizar Divindade',
          current: 1,
          max: 1
        };
      }
    }
  });
  
  return resources;
}

/**
 * Aplica autocompletar ao selecionar uma Raça
 */
export function applyRacePreset(sheet: CharacterSheet, raceName: string, subraceName?: string): CharacterSheet {
  const raceData = DND_RACES[raceName];
  if (!raceData) return sheet;

  const subraceData = (subraceName && raceData.subraces) ? raceData.subraces[subraceName] : null;

  const newAttributes = { ...sheet.attributes };
  // Reinicia para base antes de aplicar bônus da raça se necessário
  Object.keys(newAttributes).forEach((key) => {
    const k = key as AttributeKey;
    const baseScore = newAttributes[k].baseScore ?? newAttributes[k].score;
    const raceBonus = raceData.attributes[k] || 0;
    const subraceBonus = subraceData?.attributes[k] || 0;
    // Ajusta o score base + bônus
    newAttributes[k] = { ...newAttributes[k], baseScore, score: Math.max(1, baseScore + raceBonus + subraceBonus) };
  });

  let combinedTraits = raceData.traits;
  if (subraceData?.traits) combinedTraits += `\n${subraceData.traits}`;

  let combinedLanguages = [...raceData.languages];
  if (subraceData?.languages) combinedLanguages = [...new Set([...combinedLanguages, ...subraceData.languages])];

  const finalSpeed = subraceData?.speed || raceData.speed;

  return {
    ...sheet,
    race: raceName,
    subrace: subraceName || '',
    speed: finalSpeed,
    attributes: newAttributes,
    featuresAndTraits: combinedTraits,
    otherProficienciesAndLanguages: `Idiomas: ${combinedLanguages.join(', ')}.`,
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

  // Carrega as habilidades da classe
  const classFeaturesList: ClassFeature[] = [];
  const db = CLASS_FEATURES_DB[className];
  if (db) {
    let idCounter = 1;
    for (let lvl = 1; lvl <= sheet.level; lvl++) {
      if (db[lvl]) {
        db[lvl].forEach(feat => {
          if (!feat.requiresSubclass || feat.requiresSubclass === sheet.subclass) {
            classFeaturesList.push({
              ...feat,
              id: `${className.toLowerCase()}-${lvl}-${idCounter++}`
            });
          }
        });
      }
    }
  }

  // Prepara o objeto temporário da ficha para obter modificadores corretos
  const tempSheet: CharacterSheet = {
    ...sheet,
    className,
    level: sheet.level,
  };
  const classResources = getClassResourcesForLevel(tempSheet, sheet.level);

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
    classFeatures: classFeaturesList,
    classResources,
    activeClassBuffs: [],
  };
}

/**
 * Recalcula a ficha quando o Nível muda
 */
export function applyLevelChange(sheet: CharacterSheet, level: number, leveledClassName?: string): CharacterSheet {
  const safeLevel = Math.max(1, Math.min(20, level));
  
  // Se não informar qual classe subiu, assume que foi a primária (ou a única)
  const targetClass = leveledClassName || sheet.className;
  const classData = DND_CLASSES[sheet.className]; // mantem primária pra hitDie inicial se necessário
  
  // Calcula array atualizado de classes
  let classes = getCharacterClasses(sheet);
  
  // Atualiza ou adiciona a classe no array
  const classIndex = classes.findIndex(c => c.name === targetClass);
  if (classIndex >= 0) {
    // Para simplificar a lógica do Modal, o LevelUpModal passa o nivel TOTAL.
    // Precisamos saber quantos níveis a classe subiu? Não necessariamente, podemos apenas usar a soma.
    // Mas para manter a conta exata, deixaremos o Modal cuidar da array `classes` diretamente.
    // Portanto, applyLevelChange apenas LÊ o array classes para formatar os HitDice e Slots.
  }
  
  // Para evitar bugs no `LevelUpModal` que passa a ficha já com as classes atualizadas ou não, 
  // vamos usar getCharacterClasses para ler o estado atual:
  const currentClasses = getCharacterClasses(sheet);
  
  // Backward compatibility: Se a ficha só tem 1 classe e a soma dos níveis não bate com o safeLevel passado
  // (ex: GeneralSection, testes ou CharacterBuilder alterando o nível diretamente), atualizamos o nível da classe.
  const totalClassesLevel = currentClasses.reduce((acc, c) => acc + c.level, 0);
  if (currentClasses.length === 1 && totalClassesLevel !== safeLevel) {
    currentClasses[0].level = safeLevel;
  }

  // Calcula Hit Dice Total e Usado
  const hitDiceTotal = currentClasses.map(c => `${c.level}${DND_CLASSES[c.name]?.hitDie || '1d8'}`).join(', ');
  // Preserva os dados usados anteriores se possível, ou formata zerado
  const hitDiceUsed = currentClasses.map(c => `0${DND_CLASSES[c.name]?.hitDie || '1d8'}`).join(', ');

  // HP: Apenas calculamos estimated se a ficha não tiver HP ou for nível 1 (Criação)
  // Caso contrário, respeitamos o maxHp existente (que o Modal atualizou com a rolagem)
  let newMaxHp = sheet.maxHp;
  if (!newMaxHp || safeLevel === 1) {
    const conMod = getAttributeModifier(sheet, 'con');
    const hitDieVal = parseInt((DND_CLASSES[sheet.className]?.hitDie || '1d8').replace('1d', ''), 10);
    newMaxHp = Math.max(1, hitDieVal + conMod + Math.max(0, safeLevel - 1) * (Math.floor(hitDieVal / 2) + 1 + conMod));
  }

  // Ajusta Slots de Magia (Lógica de Multiclasse)
  const newSlots = { ...sheet.spellSlots };
  let casterLevel = 0;
  let spellcastingClassCount = 0;
  let singleCasterClass = '';

  currentClasses.forEach(c => {
    if (c.name === 'Mago' || c.name === 'Clérigo' || c.name === 'Bardo' || c.name === 'Druida' || c.name === 'Feiticeiro') {
      casterLevel += c.level;
      spellcastingClassCount++;
      singleCasterClass = c.name;
    } else if (c.name === 'Paladino' || c.name === 'Patrulheiro') {
      casterLevel += Math.floor(c.level / 2);
      spellcastingClassCount++;
      singleCasterClass = c.name;
    } else if (c.name === 'Artífice') {
      casterLevel += Math.ceil(c.level / 2);
      spellcastingClassCount++;
      singleCasterClass = c.name;
    }
  });

  if (spellcastingClassCount === 1) {
    // Se só tem 1 classe conjuradora, usa a tabela oficial daquela classe
    const cLevel = currentClasses.find(c => c.name === singleCasterClass)?.level || 0;
    if (singleCasterClass === 'Paladino' || singleCasterClass === 'Patrulheiro') {
      for (let l = 1; l <= 9; l++) {
        if (l === 1) newSlots[l] = { total: cLevel >= 2 ? (cLevel >= 5 ? 4 : (cLevel >= 3 ? 3 : 2)) : 0, used: 0 };
        else if (l === 2) newSlots[l] = { total: cLevel >= 5 ? (cLevel >= 9 ? 3 : 2) : 0, used: 0 };
        else if (l === 3) newSlots[l] = { total: cLevel >= 9 ? (cLevel >= 13 ? 3 : 2) : 0, used: 0 };
        else if (l === 4) newSlots[l] = { total: cLevel >= 13 ? (cLevel >= 17 ? 3 : 2) : 0, used: 0 };
        else if (l === 5) newSlots[l] = { total: cLevel >= 17 ? (cLevel >= 19 ? 2 : 1) : 0, used: 0 };
        else newSlots[l] = { total: 0, used: 0 };
      }
    } else {
      // Conjurador total
      casterLevel = cLevel;
    }
  }

  // Tabela Única de Conjurador (Multiclasse ou Conjurador Total Único)
  if (spellcastingClassCount > 1 || (spellcastingClassCount === 1 && casterLevel === currentClasses.find(c => c.name === singleCasterClass)?.level)) {
    for (let l = 1; l <= 9; l++) {
      if (l === 1) newSlots[l] = { total: casterLevel >= 1 ? (casterLevel >= 3 ? 4 : (casterLevel >= 2 ? 3 : 2)) : 0, used: 0 };
      else if (l === 2) newSlots[l] = { total: casterLevel >= 3 ? (casterLevel >= 4 ? 3 : 2) : 0, used: 0 };
      else if (l === 3) newSlots[l] = { total: casterLevel >= 5 ? (casterLevel >= 6 ? 3 : 2) : 0, used: 0 };
      else if (l === 4) newSlots[l] = { total: casterLevel >= 7 ? (casterLevel >= 8 ? 3 : 2) : 0, used: 0 };
      else if (l === 5) newSlots[l] = { total: casterLevel >= 9 ? (casterLevel >= 10 ? 3 : 2) : 0, used: 0 };
      else if (l === 6) newSlots[l] = { total: casterLevel >= 11 ? (casterLevel >= 19 ? 2 : 1) : 0, used: 0 };
      else if (l === 7) newSlots[l] = { total: casterLevel >= 13 ? (casterLevel >= 20 ? 2 : 1) : 0, used: 0 };
      else if (l === 8) newSlots[l] = { total: casterLevel >= 15 ? 1 : 0, used: 0 };
      else if (l === 9) newSlots[l] = { total: casterLevel >= 17 ? 1 : 0, used: 0 };
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

  // Carrega as habilidades da classe para o novo nível
  const classFeaturesList: ClassFeature[] = [];
  let idCounter = 1;
  currentClasses.forEach(c => {
    const db = CLASS_FEATURES_DB[c.name];
    if (db) {
      for (let lvl = 1; lvl <= c.level; lvl++) {
        if (db[lvl]) {
          db[lvl].forEach(feat => {
            if (!feat.requiresSubclass || feat.requiresSubclass === c.subclass) {
              classFeaturesList.push({
                ...feat,
                id: `${c.name.toLowerCase()}-${lvl}-${idCounter++}`
              });
            }
          });
        }
      }
    }
  });

  // Atualiza os recursos de classe
  const baseResources = getClassResourcesForLevel({ ...sheet, level: safeLevel }, safeLevel);
  const updatedResources = { ...sheet.classResources };
  for (const key in baseResources) {
    if (updatedResources[key]) {
      const diff = baseResources[key].max - updatedResources[key].max;
      updatedResources[key] = {
        ...updatedResources[key],
        max: baseResources[key].max,
        current: Math.min(baseResources[key].max, Math.max(0, updatedResources[key].current + diff))
      };
    } else {
      updatedResources[key] = baseResources[key];
    }
  }
  for (const key in updatedResources) {
    if (!baseResources[key]) {
      delete updatedResources[key];
    }
  }

  return {
    ...sheet,
    level: safeLevel,
    attributePointsAvailable: extraPoints,
    attributesLocked: isUnlocked,
    hitDiceTotal,
    maxHp: newMaxHp,
    currentHp: sheet.currentHp > newMaxHp ? newMaxHp : (safeLevel === 1 ? newMaxHp : sheet.currentHp),
    spellSlots: newSlots,
    classFeatures: classFeaturesList,
    classResources: updatedResources,
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
  const usedCountStr = sheet.hitDiceUsed.replace(hitDie, '');
  let usedCount = parseInt(usedCountStr, 10) || 0;
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

  // Recupera recursos que restauram em descanso curto (ex: Canalizar Divindade)
  const newResources = { ...sheet.classResources };
  if (newResources['canalizar_divindade']) {
    newResources['canalizar_divindade'] = {
      ...newResources['canalizar_divindade'],
      current: newResources['canalizar_divindade'].max
    };
  }

  return {
    updatedSheet: {
      ...sheet,
      currentHp: newCurrentHp,
      hitDiceUsed: `${usedCount}${hitDie}`,
      classResources: newResources,
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
  const usedCountStr = sheet.hitDiceUsed.replace(hitDie, '');
  let usedCount = parseInt(usedCountStr, 10) || 0;
  const recovered = Math.max(1, Math.floor(totalDice / 2));
  usedCount = Math.max(0, usedCount - recovered);

  // Reseta todos os slots de magia
  const newSlots = { ...sheet.spellSlots };
  for (const level in newSlots) {
    newSlots[parseInt(level, 10)] = { ...newSlots[parseInt(level, 10)], used: 0 };
  }

  // Reseta recursos de classe
  const newResources = { ...sheet.classResources };
  for (const key in newResources) {
    newResources[key] = { ...newResources[key], current: newResources[key].max };
  }

  return {
    ...sheet,
    currentHp: sheet.maxHp,
    tempHp: 0,
    hitDiceUsed: `${usedCount}${hitDie}`,
    deathSaves: { successes: 0, failures: 0 },
    spellSlots: newSlots,
    classResources: newResources,
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

  // Recalcula habilidades da classe dinamicamente para garantir integridade
  const classFeaturesList: ClassFeature[] = [];
  const db = CLASS_FEATURES_DB[sheet.className];
  if (db) {
    let idCounter = 1;
    for (let lvl = 1; lvl <= sheet.level; lvl++) {
      if (db[lvl]) {
        db[lvl].forEach(feat => {
          classFeaturesList.push({
            ...feat,
            id: `${sheet.className.toLowerCase()}-${lvl}-${idCounter++}`
          });
        });
      }
    }
  }

  // Recalcula recursos baseado no nível e nos atributos recalculados
  const baseResources = getClassResourcesForLevel(sheet, sheet.level);
  const updatedResources = { ...sheet.classResources };
  for (const key in baseResources) {
    if (updatedResources[key]) {
      const diff = baseResources[key].max - updatedResources[key].max;
      updatedResources[key] = {
        ...updatedResources[key],
        max: baseResources[key].max,
        current: Math.min(baseResources[key].max, Math.max(0, updatedResources[key].current + diff))
      };
    } else {
      updatedResources[key] = baseResources[key];
    }
  }
  for (const key in updatedResources) {
    if (!baseResources[key]) {
      delete updatedResources[key];
    }
  }

  return {
    ...sheet,
    armorClass: newAC,
    maxHp: newMaxHp,
    currentHp: Math.max(1, newCurrentHp),
    attacks: updatedAttacks,
    classFeatures: classFeaturesList,
    classResources: updatedResources,
  };
}
