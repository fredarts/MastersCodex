import { AttributeKey, DndSkillKey } from '@/lib/types';

export const DDB_STAT_ID_MAP: Record<number, AttributeKey> = {
  1: 'str',
  2: 'dex',
  3: 'con',
  4: 'int',
  5: 'wis',
  6: 'cha',
};

export const DDB_ALIGNMENT_MAP: Record<number, string> = {
  1: 'Leal e Bom',
  2: 'Neutro e Bom',
  3: 'Caótico e Bom',
  4: 'Leal e Neutro',
  5: 'Neutro',
  6: 'Caótico e Neutro',
  7: 'Leal e Mau',
  8: 'Neutro e Mau',
  9: 'Caótico e Mau',
};

export const DDB_SKILL_SUBTYPE_MAP: Record<string, DndSkillKey> = {
  acrobatics: 'acrobacia',
  'animal-handling': 'lidarComAnimais',
  arcana: 'arcanismo',
  athletics: 'atletismo',
  deception: 'blefar',
  history: 'historia',
  insight: 'intuicao',
  intimidation: 'intimidacao',
  investigation: 'investigacao',
  medicine: 'medicina',
  nature: 'natureza',
  perception: 'percepcao',
  performance: 'atuacao',
  persuasion: 'persuasao',
  religion: 'religiao',
  'sleight-of-hand': 'prestidigitacao',
  stealth: 'furtividade',
  survival: 'sobrevivencia',
};

export const DDB_SAVE_SUBTYPE_MAP: Record<string, AttributeKey> = {
  'strength-saving-throws': 'str',
  'dexterity-saving-throws': 'dex',
  'constitution-saving-throws': 'con',
  'intelligence-saving-throws': 'int',
  'wisdom-saving-throws': 'wis',
  'charisma-saving-throws': 'cha',
};

export const DDB_CLASS_SAVES_DEFAULT: Record<string, AttributeKey[]> = {
  Barbarian: ['str', 'con'],
  Bárbaro: ['str', 'con'],
  Barbaro: ['str', 'con'],
  Bardo: ['dex', 'cha'],
  Bard: ['dex', 'cha'],
  Clérigo: ['wis', 'cha'],
  Cleric: ['wis', 'cha'],
  Druida: ['int', 'wis'],
  Druid: ['int', 'wis'],
  Guerreiro: ['str', 'con'],
  Fighter: ['str', 'con'],
  Monge: ['str', 'dex'],
  Monk: ['str', 'dex'],
  Paladino: ['wis', 'cha'],
  Paladin: ['wis', 'cha'],
  Patrulheiro: ['str', 'dex'],
  Ranger: ['str', 'dex'],
  Ladino: ['dex', 'int'],
  Rogue: ['dex', 'int'],
  Feiticeiro: ['con', 'cha'],
  Sorcerer: ['con', 'cha'],
  Bruxo: ['wis', 'cha'],
  Warlock: ['wis', 'cha'],
  Mago: ['int', 'wis'],
  Wizard: ['int', 'wis'],
  Artífice: ['con', 'int'],
  Artificer: ['con', 'int'],
};

export const DDB_SPELL_SCHOOL_MAP: Record<string, string> = {
  Abjuration: 'Abjuração',
  Conjuration: 'Conjuração',
  Divination: 'Adivinhação',
  Enchantment: 'Encantamento',
  Evocation: 'Evocação',
  Illusion: 'Ilusão',
  Necromancy: 'Necromancia',
  Transmutation: 'Transmutação',
};
