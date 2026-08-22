export interface DdbStat {
  id: number; // 1: STR, 2: DEX, 3: CON, 4: INT, 5: WIS, 6: CHA
  value: number;
}

export interface DdbModifier {
  id: string;
  type: string; // 'bonus', 'set', 'proficiency', 'expertise', 'half-proficiency'
  subType: string;
  value?: number;
  statId?: number;
  friendlySubtypeName?: string;
  friendlyTypeName?: string;
  isGranted?: boolean;
}

export interface DdbClass {
  id: number;
  level: number;
  isStartingClass: boolean;
  definition: {
    name: string;
    hitDice: number;
    spellCastingAbilityId?: number;
  };
  subclassDefinition?: {
    name: string;
  };
}

export interface DdbSpell {
  overrideSaveDc?: number;
  prepared?: boolean;
  countsAsKnownSpell?: boolean;
  usesSpellSlot?: boolean;
  definition: {
    name: string;
    level: number;
    school: string;
    range: {
      origin: string;
      rangeValue?: number;
    };
    activation: {
      activationType: number; // 1: Action, 3: Bonus Action, 4: Reaction, etc.
      activationTime?: number;
    };
    duration?: {
      durationInterval?: number;
      durationUnit?: string;
      durationType?: string;
    };
    components: number[];
    componentsDescription?: string;
    description: string;
    concentration?: boolean;
    ritual?: boolean;
    atHigherLevels?: {
      higherLevelDefinitions?: Array<{ dice?: { diceString?: string } }>;
    };
  };
}

export interface DdbInventoryItem {
  id: number;
  quantity: number;
  equipped: boolean;
  isAttuned?: boolean;
  definition: {
    name: string;
    description?: string;
    filterType?: string; // 'Armor', 'Weapon', 'Staff', 'Wand', 'Ring', 'Potion', 'Scroll', etc.
    type?: string;
    armorClass?: number;
    armorTypeId?: number; // 1: Light, 2: Medium, 3: Heavy, 4: Shield
    damage?: {
      diceString?: string;
    };
    damageType?: string;
    weight?: number;
    cost?: number;
    isConsumable?: boolean;
  };
}

export interface DdbCharacterData {
  id: number;
  name: string;
  gender?: string;
  age?: number | string;
  height?: string;
  weight?: number | string;
  eyes?: string;
  skin?: string;
  hair?: string;
  alignmentId?: number;
  baseHitPoints: number;
  bonusHitPoints?: number;
  overrideHitPoints?: number;
  removedHitPoints?: number;
  temporaryHitPoints?: number;
  currentXp?: number;
  stats: DdbStat[];
  bonusStats: DdbStat[];
  overrideStats: DdbStat[];
  classes: DdbClass[];
  race: {
    fullName: string;
    baseRaceName?: string;
    subRaceShortName?: string;
    weightSpeeds?: {
      normal?: {
        walk?: number;
        fly?: number;
        burrow?: number;
        swim?: number;
        climb?: number;
      };
    };
  };
  background?: {
    definition?: {
      name?: string;
    };
    customBackground?: {
      name?: string;
    };
  };
  traits?: {
    personalityTraits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
    appearance?: string;
  };
  notes?: {
    backstory?: string;
    allies?: string;
    organizations?: string;
    otherNotes?: string;
  };
  decorations?: {
    avatarUrl?: string;
    frameAvatarUrl?: string;
    backdropAvatarUrl?: string;
  };
  currencies?: {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
  };
  inventory?: DdbInventoryItem[];
  classSpells?: Array<{
    characterClassId: number;
    spells: DdbSpell[];
  }>;
  spells?: {
    race?: DdbSpell[];
    class?: DdbSpell[];
    feat?: DdbSpell[];
    item?: DdbSpell[];
  };
  modifiers?: {
    race?: DdbModifier[];
    class?: DdbModifier[];
    background?: DdbModifier[];
    feat?: DdbModifier[];
    item?: DdbModifier[];
    condition?: DdbModifier[];
  };
  spellSlots?: Array<{
    level: number;
    used: number;
    available: number;
  }>;
}

export interface DdbApiResponse {
  success: boolean;
  message?: string;
  data: DdbCharacterData;
}
