import {
  CharacterSheet,
  CharacterAttributes,
  SavingThrows,
  DndSkillKey,
  SkillProficiencyLevel,
  CharacterWeaponAttack,
  CharacterEquipmentItem,
  CharacterSpell,
  CharacterCurrency,
  CharacterClassProgress,
  AttributeKey,
} from '@/lib/types';
import { DdbCharacterData, DdbModifier, DdbSpell } from './dndBeyondTypes';
import {
  DDB_STAT_ID_MAP,
  DDB_ALIGNMENT_MAP,
  DDB_SKILL_SUBTYPE_MAP,
  DDB_SAVE_SUBTYPE_MAP,
  DDB_CLASS_SAVES_DEFAULT,
  DDB_SPELL_SCHOOL_MAP,
} from './dndBeyondMappings';
import { calculateModifier } from '@/lib/dnd5e-calculator';

/**
 * Extracts and calculates the 6 core D&D 5e attributes considering base, overrides, and modifiers.
 */
export function calculateDdbAttributes(data: DdbCharacterData): CharacterAttributes {
  const scores: Record<AttributeKey, number> = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  };

  // 1. Base Stats
  data.stats?.forEach((st) => {
    const key = DDB_STAT_ID_MAP[st.id];
    if (key && typeof st.value === 'number') {
      scores[key] = st.value;
    }
  });

  // 2. Overrides
  data.overrideStats?.forEach((st) => {
    const key = DDB_STAT_ID_MAP[st.id];
    if (key && typeof st.value === 'number' && st.value > 0) {
      scores[key] = st.value;
    }
  });

  // 3. Modifiers (bonus to ability scores from race, feat, class, items)
  const allModifiers: DdbModifier[] = [
    ...(data.modifiers?.race || []),
    ...(data.modifiers?.class || []),
    ...(data.modifiers?.background || []),
    ...(data.modifiers?.feat || []),
    ...(data.modifiers?.item || []),
  ];

  const statSubtypeMap: Record<string, AttributeKey> = {
    'strength-score': 'str',
    'dexterity-score': 'dex',
    'constitution-score': 'con',
    'intelligence-score': 'int',
    'wisdom-score': 'wis',
    'charisma-score': 'cha',
  };

  allModifiers.forEach((mod) => {
    if (mod.type === 'bonus' && typeof mod.value === 'number') {
      const key = statSubtypeMap[mod.subType];
      if (key) {
        scores[key] += mod.value;
      }
    }
  });

  // 4. Bonus Stats from character sheet
  data.bonusStats?.forEach((st) => {
    const key = DDB_STAT_ID_MAP[st.id];
    if (key && typeof st.value === 'number') {
      scores[key] += st.value;
    }
  });

  return {
    str: { score: scores.str, baseScore: scores.str },
    dex: { score: scores.dex, baseScore: scores.dex },
    con: { score: scores.con, baseScore: scores.con },
    int: { score: scores.int, baseScore: scores.int },
    wis: { score: scores.wis, baseScore: scores.wis },
    cha: { score: scores.cha, baseScore: scores.cha },
  };
}

/**
 * Calculates Skill proficiencies (none, proficient, expertise).
 */
export function calculateDdbSkills(data: DdbCharacterData): Record<DndSkillKey, SkillProficiencyLevel> {
  const skills: Record<DndSkillKey, SkillProficiencyLevel> = {
    acrobacia: 'none',
    arcanismo: 'none',
    atletismo: 'none',
    atuacao: 'none',
    blefar: 'none',
    furtividade: 'none',
    historia: 'none',
    intimidacao: 'none',
    intuicao: 'none',
    investigacao: 'none',
    lidarComAnimais: 'none',
    medicina: 'none',
    natureza: 'none',
    percepcao: 'none',
    persuasao: 'none',
    religiao: 'none',
    prestidigitacao: 'none',
    sobrevivencia: 'none',
  };

  const allModifiers: DdbModifier[] = [
    ...(data.modifiers?.race || []),
    ...(data.modifiers?.class || []),
    ...(data.modifiers?.background || []),
    ...(data.modifiers?.feat || []),
    ...(data.modifiers?.item || []),
  ];

  allModifiers.forEach((mod) => {
    const skillKey = DDB_SKILL_SUBTYPE_MAP[mod.subType];
    if (!skillKey) return;

    if (mod.type === 'expertise') {
      skills[skillKey] = 'expertise';
    } else if (mod.type === 'proficiency' && skills[skillKey] !== 'expertise') {
      skills[skillKey] = 'proficient';
    }
  });

  return skills;
}

/**
 * Calculates Saving Throws proficiencies.
 */
export function calculateDdbSavingThrows(data: DdbCharacterData, primaryClass?: string): SavingThrows {
  const savingThrows: SavingThrows = {
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
  };

  // Class default saves
  if (primaryClass && DDB_CLASS_SAVES_DEFAULT[primaryClass]) {
    DDB_CLASS_SAVES_DEFAULT[primaryClass].forEach((k) => {
      savingThrows[k] = true;
    });
  }

  // Modifiers saves
  const allModifiers: DdbModifier[] = [
    ...(data.modifiers?.race || []),
    ...(data.modifiers?.class || []),
    ...(data.modifiers?.background || []),
    ...(data.modifiers?.feat || []),
    ...(data.modifiers?.item || []),
  ];

  allModifiers.forEach((mod) => {
    if (mod.type === 'proficiency') {
      const saveKey = DDB_SAVE_SUBTYPE_MAP[mod.subType];
      if (saveKey) {
        savingThrows[saveKey] = true;
      }
    }
  });

  return savingThrows;
}

/**
 * Main parser function: Converts D&D Beyond API data into a valid Masters Codex CharacterSheet.
 */
export function parseDdbCharacter(raw: DdbCharacterData | any, userId = 'imported-user'): CharacterSheet {
  const data: DdbCharacterData = raw.data ? raw.data : raw;

  if (!data || !data.name) {
    throw new Error('Formato de dados inválido: o JSON não possui a estrutura esperada do D&D Beyond.');
  }

  // Class & Level
  const classesList: CharacterClassProgress[] = (data.classes || []).map((c, idx) => ({
    name: c.definition?.name || 'Aventureiro',
    level: c.level || 1,
    subclass: c.subclassDefinition?.name,
    isPrimary: idx === 0 || c.isStartingClass,
  }));

  const primaryClass = classesList[0]?.name || 'Guerreiro';
  const primarySubclass = classesList[0]?.subclass || '';
  const totalLevel = classesList.reduce((acc, c) => acc + (c.level || 0), 0) || 1;

  // Attributes
  const attributes = calculateDdbAttributes(data);
  const conMod = calculateModifier(attributes.con.score);
  const dexMod = calculateModifier(attributes.dex.score);

  // HP Calculation
  let maxHp = data.overrideHitPoints || 0;
  if (!maxHp) {
    const baseHp = data.baseHitPoints || 10;
    const bonusHp = data.bonusHitPoints || 0;
    maxHp = baseHp + (conMod * totalLevel) + bonusHp;
  }
  if (maxHp <= 0) maxHp = 10;

  const removedHp = data.removedHitPoints || 0;
  const currentHp = Math.max(0, maxHp - removedHp);
  const tempHp = data.temporaryHitPoints || 0;

  // Armor Class & Shield calculation
  let armorClass = 10 + dexMod;
  let equippedArmor = 'Nenhuma';
  let hasShield = false;

  const inventory: CharacterEquipmentItem[] = [];
  const attacks: CharacterWeaponAttack[] = [];

  (data.inventory || []).forEach((item, idx) => {
    const def = item.definition || {};
    const name = def.name || 'Item';
    const quantity = item.quantity || 1;
    const weight = def.weight ? `${def.weight} lb` : '0 lb';
    const isEquipped = item.equipped || false;

    const itemType =
      def.filterType === 'Armor'
        ? 'armor'
        : def.filterType === 'Weapon'
        ? 'weapon'
        : def.filterType === 'Potion'
        ? 'potion'
        : def.filterType === 'Scroll'
        ? 'scroll'
        : 'equipment';

    inventory.push({
      id: `ddb-item-${item.id || idx}`,
      name,
      quantity,
      weight,
      notes: def.description || '',
      equipped: isEquipped,
      itemType: itemType as any,
    });

    // Check armor / shield
    if (isEquipped && def.filterType === 'Armor') {
      if (def.armorTypeId === 4) {
        hasShield = true;
      } else if (def.armorClass) {
        equippedArmor = name;
        armorClass = def.armorClass + (def.armorTypeId === 1 ? dexMod : def.armorTypeId === 2 ? Math.min(2, dexMod) : 0);
      }
    }

    // Check weapons for attacks list
    if (def.filterType === 'Weapon') {
      const damageDice = def.damage?.diceString || '1d6';
      const damageType = def.damageType || 'Cortante';
      const profBonus = Math.floor((totalLevel - 1) / 4) + 2;
      const atkBonus = profBonus + (def.type?.includes('Ranged') ? dexMod : Math.max(dexMod, calculateModifier(attributes.str.score)));

      attacks.push({
        id: `ddb-atk-${item.id || idx}`,
        name,
        atkBonus: `+${atkBonus}`,
        damage: damageDice,
        type: damageType,
      });
    }
  });

  if (hasShield) {
    armorClass += 2;
  }

  // Spells
  const spells: CharacterSpell[] = [];
  const allDdbSpells: DdbSpell[] = [
    ...(data.spells?.race || []),
    ...(data.spells?.class || []),
    ...(data.spells?.feat || []),
    ...(data.spells?.item || []),
  ];

  data.classSpells?.forEach((cs) => {
    if (cs.spells) allDdbSpells.push(...cs.spells);
  });

  allDdbSpells.forEach((sp, idx) => {
    const def = sp.definition;
    if (!def) return;

    spells.push({
      id: `ddb-spell-${idx}`,
      name: def.name,
      level: def.level || 0,
      school: DDB_SPELL_SCHOOL_MAP[def.school] || def.school || 'Evocação',
      castingTime: def.activation?.activationType === 3 ? '1 Ação Bônus' : def.activation?.activationType === 4 ? '1 Reação' : '1 Ação',
      range: def.range?.rangeValue ? `${def.range.rangeValue} pés` : def.range?.origin || 'Pessoal',
      components: def.componentsDescription || (def.components?.includes(1) ? 'V, S' : 'V'),
      description: def.description || '',
      prepared: sp.prepared ?? true,
    });
  });

  // Spell slots
  const spellSlots: Record<number, { total: number; used: number }> = {
    1: { total: 0, used: 0 },
    2: { total: 0, used: 0 },
    3: { total: 0, used: 0 },
    4: { total: 0, used: 0 },
    5: { total: 0, used: 0 },
    6: { total: 0, used: 0 },
    7: { total: 0, used: 0 },
    8: { total: 0, used: 0 },
    9: { total: 0, used: 0 },
  };

  data.spellSlots?.forEach((slot) => {
    if (slot.level >= 1 && slot.level <= 9) {
      spellSlots[slot.level] = {
        total: (slot.available || 0) + (slot.used || 0),
        used: slot.used || 0,
      };
    }
  });

  // Currencies (pc: cobre, pp: prata, pe: electrum, po: ouro, pl: platina)
  const currency: CharacterCurrency = {
    pc: data.currencies?.cp || 0,
    pp: data.currencies?.sp || 0,
    pe: data.currencies?.ep || 0,
    po: data.currencies?.gp || 0,
    pl: data.currencies?.pp || 0,
  };

  // Speed
  const walkSpeed = data.race?.weightSpeeds?.normal?.walk || 30;
  const speed = `${walkSpeed} ft (${(walkSpeed * 0.3).toFixed(1)} m)`;

  // Alignment
  const alignment = data.alignmentId ? DDB_ALIGNMENT_MAP[data.alignmentId] || 'Neutro' : 'Neutro';

  // Primary hit die
  const startingHitDie = data.classes?.[0]?.definition?.hitDice || 8;
  const hitDiceTotal = `${totalLevel}d${startingHitDie}`;

  return {
    id: `char-ddb-${data.id || Date.now()}`,
    userId,
    isPublic: true,
    characterName: data.name || 'Personagem Sem Nome',
    className: primaryClass,
    level: totalLevel,
    classes: classesList,
    subclass: primarySubclass,
    race: data.race?.fullName || data.race?.baseRaceName || 'Humano',
    subrace: data.race?.subRaceShortName,
    background: data.background?.definition?.name || data.background?.customBackground?.name || 'Aventureiro',
    alignment,
    playerName: '',
    xp: data.currentXp || 0,
    avatarUrl: data.decorations?.avatarUrl || data.decorations?.frameAvatarUrl,
    inspiration: false,
    attributes,
    savingThrows: calculateDdbSavingThrows(data, primaryClass),
    armorClass,
    equippedArmor,
    hasShield,
    initiativeBonus: 0,
    speed,
    maxHp,
    currentHp,
    tempHp,
    hitDiceTotal,
    hitDiceUsed: '0',
    deathSaves: {
      successes: 0,
      failures: 0,
    },
    attacks,
    skills: calculateDdbSkills(data),
    otherProficienciesAndLanguages: '',
    personalityTraits: data.traits?.personalityTraits || '',
    ideals: data.traits?.ideals || '',
    bonds: data.traits?.bonds || '',
    flaws: data.traits?.flaws || '',
    featuresAndTraits: '',
    age: data.age ? String(data.age) : undefined,
    height: data.height || undefined,
    weight: data.weight ? `${data.weight} lb` : undefined,
    eyes: data.eyes || undefined,
    skin: data.skin || undefined,
    hair: data.hair || undefined,
    backstory: data.notes?.backstory || '',
    alliesAndOrganizations: data.notes?.allies || data.notes?.organizations || '',
    equipment: inventory,
    currency,
    spellcastingClass: primaryClass,
    spellSlots,
    spells,
    journalEntries: [],
  };
}
