import { AttributeKey, CharacterSheet, DndSkillKey } from './types';

export interface RacePreset {
  name: string;
  speed: string;
  attributes: Partial<Record<AttributeKey, number>>;
  traits: string;
  languages: string[];
}

export interface ClassPreset {
  name: string;
  hitDie: string;
  savingThrows: AttributeKey[];
  spellcastingAbility?: AttributeKey;
  armorProficiencies: string;
  weaponProficiencies: string;
  toolProficiencies?: string;
}

export const SKILL_DEFINITIONS: Record<DndSkillKey, { name: string; attr: AttributeKey }> = {
  acrobacia: { name: 'Acrobacia', attr: 'dex' },
  arcanismo: { name: 'Arcanismo', attr: 'int' },
  atletismo: { name: 'Atletismo', attr: 'str' },
  atuacao: { name: 'Atuação', attr: 'cha' },
  blefar: { name: 'Blefar', attr: 'cha' },
  furtividade: { name: 'Furtividade', attr: 'dex' },
  historia: { name: 'História', attr: 'int' },
  intimidacao: { name: 'Intimidação', attr: 'cha' },
  intuicao: { name: 'Intuição', attr: 'wis' },
  investigacao: { name: 'Investigação', attr: 'int' },
  lidarComAnimais: { name: 'Lidar com Animais', attr: 'wis' },
  medicina: { name: 'Medicina', attr: 'wis' },
  natureza: { name: 'Natureza', attr: 'int' },
  percepcao: { name: 'Percepção', attr: 'wis' },
  persuasao: { name: 'Persuasão', attr: 'cha' },
  prestidigitacao: { name: 'Prestidigitação', attr: 'dex' },
  religiao: { name: 'Religião', attr: 'int' },
  sobrevivencia: { name: 'Sobrevivência', attr: 'wis' },
};

export const DND_RACES: Record<string, RacePreset> = {
  Humano: {
    name: 'Humano',
    speed: '9m (30ft)',
    attributes: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: 'Versatilidade Humana (+1 em todos os atributos).',
    languages: ['Comum', 'Um idioma adicional à escolha'],
  },
  Elfo: {
    name: 'Elfo',
    speed: '9m (30ft)',
    attributes: { dex: 2 },
    traits: 'Visão no Escuro (18m), Sentidos Aguçados (Proficiência em Percepção), Ancestralidade Feérica, Transe.',
    languages: ['Comum', 'Élfico'],
  },
  Anão: {
    name: 'Anão',
    speed: '7.5m (25ft)',
    attributes: { con: 2 },
    traits: 'Visão no Escuro (18m), Resiliência Anã (Vantagem vs Veneno), Treinamento de Combate Anão, Conhecimento de Pedra.',
    languages: ['Comum', 'Anão'],
  },
  Halfling: {
    name: 'Halfling',
    speed: '7.5m (25ft)',
    attributes: { dex: 2 },
    traits: 'Sortudo (Rerrola 1 em d20), Corajoso (Vantagem vs Medo), Agilidade Halfling.',
    languages: ['Comum', 'Halfling'],
  },
  Draconato: {
    name: 'Draconato',
    speed: '9m (30ft)',
    attributes: { str: 2, cha: 1 },
    traits: 'Ancestral Dragão (Arma de Sopro & Resistência Elemental).',
    languages: ['Comum', 'Dracônico'],
  },
  Gnomo: {
    name: 'Gnomo',
    speed: '7.5m (25ft)',
    attributes: { int: 2 },
    traits: 'Visão no Escuro (18m), Esperteza Gnomos (Vantagem em TR de INT/SAB/CAR contra Magia).',
    languages: ['Comum', 'Gnomo'],
  },
  'Meio-Elfo': {
    name: 'Meio-Elfo',
    speed: '9m (30ft)',
    attributes: { cha: 2 },
    traits: 'Visão no Escuro (18m), Ancestralidade Feérica, Versatilidade em Perícias (+2 Perícias à escolha).',
    languages: ['Comum', 'Élfico', 'Um idioma adicional'],
  },
  'Meio-Orc': {
    name: 'Meio-Orc',
    speed: '9m (30ft)',
    attributes: { str: 2, con: 1 },
    traits: 'Visão no Escuro (18m), Ameaçador (Proficiência em Intimidação), Resistência Implacável (Volta com 1 PV), Ataques Ferozes.',
    languages: ['Comum', 'Orc'],
  },
  Tiefling: {
    name: 'Tiefling',
    speed: '9m (30ft)',
    attributes: { cha: 2, int: 1 },
    traits: 'Visão no Escuro (18m), Resistência Infernal (Resistência a Fogo), Legado Infernal (Truque Taumaturgia).',
    languages: ['Comum', 'Infernal'],
  },
};

export const DND_CLASSES: Record<string, ClassPreset> = {
  Bárbaro: {
    name: 'Bárbaro',
    hitDie: '1d12',
    savingThrows: ['str', 'con'],
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
  },
  Bardo: {
    name: 'Bardo',
    hitDie: '1d8',
    savingThrows: ['dex', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples, ballestras de mão, espadas curtas, espadas longas, rapieiras',
  },
  Clérigo: {
    name: 'Clérigo',
    hitDie: '1d8',
    savingThrows: ['wis', 'cha'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples',
  },
  Druida: {
    name: 'Druida',
    hitDie: '1d8',
    savingThrows: ['int', 'wis'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Armaduras leves, armaduras médias (não metálicas), escudos (não metálicos)',
    weaponProficiencies: 'Adagas, dardos, bordões, cimitarras, foices, fundas, lança-dardos, lanças',
  },
  Guerreiro: {
    name: 'Guerreiro',
    hitDie: '1d10',
    savingThrows: ['str', 'con'],
    armorProficiencies: 'Todas as armaduras, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
  },
  Monge: {
    name: 'Monge',
    hitDie: '1d8',
    savingThrows: ['str', 'dex'],
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Armas simples, espadas curtas',
  },
  Paladino: {
    name: 'Paladino',
    hitDie: '1d10',
    savingThrows: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Todas as armaduras, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
  },
  Patrulheiro: {
    name: 'Patrulheiro',
    hitDie: '1d10',
    savingThrows: ['str', 'dex'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
  },
  Ladino: {
    name: 'Ladino',
    hitDie: '1d8',
    savingThrows: ['dex', 'int'],
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples, ballestras de mão, espadas curtas, espadas longas, rapieiras',
  },
  Feiticeiro: {
    name: 'Feiticeiro',
    hitDie: '1d6',
    savingThrows: ['con', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Adagas, dardos, fundas, bordões, ballestras leves',
  },
  Bruxo: {
    name: 'Bruxo',
    hitDie: '1d8',
    savingThrows: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples',
  },
  Mago: {
    name: 'Mago',
    hitDie: '1d6',
    savingThrows: ['int', 'wis'],
    spellcastingAbility: 'int',
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Adagas, dardos, fundas, bordões, ballestras leves',
  },
};

export const DND_ALIGNMENTS = [
  'Leal e Bom',
  'Neutro e Bom',
  'Caótico e Bom',
  'Leal e Neutro',
  'Neutro Puro',
  'Caótico e Neutro',
  'Leal e Mau',
  'Neutro e Mau',
  'Caótico e Mau',
];

export const DND_BACKGROUNDS = [
  'Acólito',
  'Artesão de Guilda',
  'Charlatão',
  'Criminoso / Bandido',
  'Eremita',
  'Forasteiro',
  'Herói do Povo',
  'Marinheiro',
  'Nobre',
  'Órfão',
  'Sábio',
  'Soldado',
];

export function createEmptyCharacterSheet(userId: string, campaignId?: string): CharacterSheet {
  const initialSkills: Record<DndSkillKey, 'none'> = {
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
    prestidigitacao: 'none',
    religiao: 'none',
    sobrevivencia: 'none',
  };

  const initialSpellSlots: CharacterSheet['spellSlots'] = {};
  for (let l = 1; l <= 9; l++) {
    initialSpellSlots[l] = { total: 0, used: 0 };
  }

  return {
    id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    campaignId,
    characterName: 'Novo Aventureiro',
    className: 'Guerreiro',
    level: 1,
    subclass: '',
    race: 'Humano',
    subrace: '',
    background: 'Herói do Povo',
    alignment: 'Neutro e Bom',
    playerName: '',
    xp: 0,
    avatarUrl: '',

    inspiration: false,
    attributes: {
      str: { score: 10 },
      dex: { score: 10 },
      con: { score: 10 },
      int: { score: 10 },
      wis: { score: 10 },
      cha: { score: 10 },
    },
    savingThrows: {
      str: true,
      dex: false,
      con: true,
      int: false,
      wis: false,
      cha: false,
    },

    armorClass: 10,
    initiativeBonus: 0,
    speed: '9m (30ft)',
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDiceTotal: '1d10',
    hitDiceUsed: '0d10',
    deathSaves: { successes: 0, failures: 0 },

    attacks: [
      { id: '1', name: 'Espada Longa', atkBonus: '+4', damage: '1d8 + 2', type: 'Cortante' },
      { id: '2', name: 'Arco Curto', atkBonus: '+2', damage: '1d6', type: 'Perfurante' },
    ],

    skills: initialSkills,
    otherProficienciesAndLanguages: 'Idiomas: Comum. Proficiências: Armas Simples, Armas Marciais, Todas as Armaduras.',

    personalityTraits: 'Gosto de ajudar aqueles que não podem se defender.',
    ideals: 'Justiça. Todos merecem um julgamento justo.',
    bonds: 'Luto para proteger a vila onde cresci.',
    flaws: 'Às vezes ajo por impulso sem pensar nos riscos.',
    featuresAndTraits: 'Retomada de Fôlego (1d10 + Nível), Estilo de Luta.',

    age: '22',
    height: '1.75m',
    weight: '75kg',
    eyes: 'Castanhos',
    skin: 'Clara',
    hair: 'Castanho',
    appearanceDesc: 'Um jovem forte e determinado com trajes práticos de viagem.',
    backstory: 'Cresceu em uma vila de fazendeiros até defender o local de bandidos.',
    alliesAndOrganizations: 'Guilda de Aventureiros Local',
    factionSymbolName: 'Escudo Prateado',
    factionSymbolUrl: '',
    otherFeatures: '',
    treasure: '50 peças de ouro, um amuleto antigo de família.',

    spellcastingClass: '',
    spellcastingAbility: 'int',
    spellSlots: initialSpellSlots,
    spells: [],

    updatedAt: new Date().toISOString(),
  };
}
