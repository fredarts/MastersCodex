import { AttributeKey, CharacterSheet, DndSkillKey, ClassFeature, ActiveClassBuff } from './types';
import { getModelUrlByNameOrPath } from './3d-models';

export interface RacePreset {
  name: string;
  speed: string;
  attributes: Partial<Record<AttributeKey, number>>;
  traits: string;
  languages: string[];
  subraces?: Record<string, RacePreset>;
  skillChoices?: number;
  fixedSkills?: DndSkillKey[];
}

export interface ClassPreset {
  name: string;
  hitDie: string;
  savingThrows: AttributeKey[];
  spellcastingAbility?: AttributeKey;
  armorProficiencies: string;
  weaponProficiencies: string;
  toolProficiencies?: string;
  skillChoices: number;
  skillOptions: DndSkillKey[] | 'all';
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
    fixedSkills: ['percepcao'],
    subraces: {
      'Alto Elfo': {
        name: 'Alto Elfo',
        speed: '9m (30ft)',
        attributes: { int: 1 },
        traits: 'Treinamento Élfico com Armas, Truque de Mago.',
        languages: ['Um idioma adicional à escolha']
      },
      'Elfo da Floresta': {
        name: 'Elfo da Floresta',
        speed: '10.5m (35ft)',
        attributes: { wis: 1 },
        traits: 'Treinamento Élfico com Armas, Frota de Pés (+1.5m deslocamento), Máscara da Natureza.',
        languages: []
      },
      'Drow': {
        name: 'Drow',
        speed: '9m (30ft)',
        attributes: { cha: 1 },
        traits: 'Visão no Escuro Superior (36m), Sensibilidade à Luz Solar, Magia Drow, Treinamento Drow com Armas.',
        languages: []
      }
    }
  },
  Anão: {
    name: 'Anão',
    speed: '7.5m (25ft)',
    attributes: { con: 2 },
    traits: 'Visão no Escuro (18m), Resiliência Anã (Vantagem vs Veneno), Treinamento de Combate Anão, Conhecimento de Pedra.',
    languages: ['Comum', 'Anão'],
    subraces: {
      'Anão da Colina': {
        name: 'Anão da Colina',
        speed: '7.5m (25ft)',
        attributes: { wis: 1 },
        traits: 'Tenacidade Anã (+1 PV máximo por nível).',
        languages: []
      },
      'Anão da Montanha': {
        name: 'Anão da Montanha',
        speed: '7.5m (25ft)',
        attributes: { str: 2 },
        traits: 'Treinamento com Armaduras Anãs (Proficiência em armaduras leves e médias).',
        languages: []
      }
    }
  },
  Halfling: {
    name: 'Halfling',
    speed: '7.5m (25ft)',
    attributes: { dex: 2 },
    traits: 'Sortudo (Rerrola 1 em d20), Corajoso (Vantagem vs Medo), Agilidade Halfling.',
    languages: ['Comum', 'Halfling'],
    subraces: {
      'Pés-Leves': {
        name: 'Pés-Leves',
        speed: '7.5m (25ft)',
        attributes: { cha: 1 },
        traits: 'Furtividade Natural (Pode se esconder atrás de criaturas maiores).',
        languages: []
      },
      'Robusto': {
        name: 'Robusto',
        speed: '7.5m (25ft)',
        attributes: { con: 1 },
        traits: 'Resiliência Robusta (Vantagem e resistência contra veneno).',
        languages: []
      }
    }
  },
  Draconato: {
    name: 'Draconato',
    speed: '9m (30ft)',
    attributes: { str: 2, cha: 1 },
    traits: 'Ancestral Dragão (Arma de Sopro & Resistência Elemental).',
    languages: ['Comum', 'Dracônico'],
    subraces: {
      'Fogo': { name: 'Fogo', speed: '9m (30ft)', attributes: {}, traits: 'Arma de Sopro (Fogo), Resistência a Fogo.', languages: [] },
      'Frio': { name: 'Frio', speed: '9m (30ft)', attributes: {}, traits: 'Arma de Sopro (Frio), Resistência a Frio.', languages: [] },
      'Ácido': { name: 'Ácido', speed: '9m (30ft)', attributes: {}, traits: 'Arma de Sopro (Ácido), Resistência a Ácido.', languages: [] },
      'Elétrico': { name: 'Elétrico', speed: '9m (30ft)', attributes: {}, traits: 'Arma de Sopro (Elétrico), Resistência a Eletricidade.', languages: [] },
      'Veneno': { name: 'Veneno', speed: '9m (30ft)', attributes: {}, traits: 'Arma de Sopro (Veneno), Resistência a Veneno.', languages: [] }
    }
  },
  Gnomo: {
    name: 'Gnomo',
    speed: '7.5m (25ft)',
    attributes: { int: 2 },
    traits: 'Visão no Escuro (18m), Esperteza Gnomos (Vantagem em TR de INT/SAB/CAR contra Magia).',
    languages: ['Comum', 'Gnomo'],
    subraces: {
      'Gnomo da Floresta': {
        name: 'Gnomo da Floresta',
        speed: '7.5m (25ft)',
        attributes: { dex: 1 },
        traits: 'Ilusionista Nato (Truque Ilusão Menor), Falar com Bestas Pequenas.',
        languages: []
      },
      'Gnomo das Rochas': {
        name: 'Gnomo das Rochas',
        speed: '7.5m (25ft)',
        attributes: { con: 1 },
        traits: 'Conhecimento de Artífice, Engenhoqueiro.',
        languages: []
      }
    }
  },
  'Meio-Elfo': {
    name: 'Meio-Elfo',
    speed: '9m (30ft)',
    attributes: { cha: 2 },
    traits: 'Visão no Escuro (18m), Ancestralidade Feérica, Versatilidade em Perícias (+2 Perícias à escolha). (Lembre-se de adicionar +1 em dois outros atributos livres).',
    languages: ['Comum', 'Élfico', 'Um idioma adicional'],
    skillChoices: 2,
  },
  'Meio-Orc': {
    name: 'Meio-Orc',
    speed: '9m (30ft)',
    attributes: { str: 2, con: 1 },
    traits: 'Visão no Escuro (18m), Ameaçador (Proficiência em Intimidação), Resistência Implacável (Volta com 1 PV), Ataques Ferozes.',
    languages: ['Comum', 'Orc'],
    fixedSkills: ['intimidacao'],
  },
  Tiefling: {
    name: 'Tiefling',
    speed: '9m (30ft)',
    attributes: { cha: 2, int: 1 },
    traits: 'Visão no Escuro (18m), Resistência Infernal (Resistência a Fogo), Legado Infernal (Truque Taumaturgia).',
    languages: ['Comum', 'Infernal'],
  },
};

export const MULTICLASS_REQUIREMENTS: Record<string, Partial<Record<AttributeKey, number>>> = {
  'Bárbaro': { str: 13 },
  'Paladino': { str: 13, cha: 13 },
  'Mago': { int: 13 },
  'Bardo': { cha: 13 },
  'Ladino': { dex: 13 },
  'Patrulheiro': { dex: 13, wis: 13 },
  'Feiticeiro': { cha: 13 },
  'Artífice': { int: 13 }
};

export const MULTICLASS_PROFICIENCIES: Record<string, { armor: string; weapons: string; tools?: string; skillChoices?: number }> = {
  'Bárbaro': { armor: 'Escudos', weapons: 'Armas simples, armas marciais' },
  'Paladino': { armor: 'Armaduras leves, armaduras médias, escudos', weapons: 'Armas simples, armas marciais' },
  'Mago': { armor: 'Nenhuma', weapons: 'Adagas, dardos, fundas, cajados, bestas leves' },
  'Bardo': { armor: 'Armaduras leves', weapons: 'Nenhuma', skillChoices: 1, tools: 'Um instrumento musical' },
  'Patrulheiro': { armor: 'Armaduras leves, armaduras médias, escudos', weapons: 'Armas simples, armas marciais', skillChoices: 1 },
  'Ladino': { armor: 'Armaduras leves', weapons: 'Nenhuma', skillChoices: 1, tools: 'Ferramentas de Ladino' },
  'Feiticeiro': { armor: 'Nenhuma', weapons: 'Nenhuma' },
  'Artífice': { armor: 'Armaduras leves, armaduras médias, escudos', weapons: 'Nenhuma', tools: 'Ferramentas de Ladrão, ferramentas de funileiro' }
};
export const DND_CLASSES: Record<string, ClassPreset> = {
  Bárbaro: {
    name: 'Bárbaro',
    hitDie: '1d12',
    savingThrows: ['str', 'con'],
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
    skillChoices: 2,
    skillOptions: ['lidarComAnimais', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia']
  },
  Bardo: {
    name: 'Bardo',
    hitDie: '1d8',
    savingThrows: ['dex', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples, ballestras de mão, espadas curtas, espadas longas, rapieiras',
    skillChoices: 3,
    skillOptions: 'all'
  },
  Clérigo: {
    name: 'Clérigo',
    hitDie: '1d8',
    savingThrows: ['wis', 'cha'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples',
    skillChoices: 2,
    skillOptions: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao']
  },
  Druida: {
    name: 'Druida',
    hitDie: '1d8',
    savingThrows: ['int', 'wis'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Armaduras leves, armaduras médias (não metálicas), escudos (não metálicos)',
    weaponProficiencies: 'Adagas, dardos, bordões, cimitarras, foices, fundas, lança-dardos, lanças',
    skillChoices: 2,
    skillOptions: ['arcanismo', 'lidarComAnimais', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia']
  },
  Guerreiro: {
    name: 'Guerreiro',
    hitDie: '1d10',
    savingThrows: ['str', 'con'],
    armorProficiencies: 'Todas as armaduras, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
    skillChoices: 2,
    skillOptions: ['acrobacia', 'lidarComAnimais', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'percepcao', 'sobrevivencia']
  },
  Monge: {
    name: 'Monge',
    hitDie: '1d8',
    savingThrows: ['str', 'dex'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Armas simples, espadas curtas',
    skillChoices: 2,
    skillOptions: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade']
  },
  Paladino: {
    name: 'Paladino',
    hitDie: '1d10',
    savingThrows: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Todas as armaduras, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
    skillChoices: 2,
    skillOptions: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao']
  },
  Patrulheiro: {
    name: 'Patrulheiro',
    hitDie: '1d10',
    savingThrows: ['str', 'dex'],
    spellcastingAbility: 'wis',
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples, armas marciais',
    skillChoices: 3,
    skillOptions: ['lidarComAnimais', 'atletismo', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia']
  },
  Ladino: {
    name: 'Ladino',
    hitDie: '1d8',
    savingThrows: ['dex', 'int'],
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples, ballestras de mão, espadas curtas, espadas longas, rapieiras',
    toolProficiencies: 'Ferramentas de Ladino',
    skillChoices: 4,
    skillOptions: ['acrobacia', 'atletismo', 'blefar', 'intuicao', 'intimidacao', 'investigacao', 'percepcao', 'atuacao', 'persuasao', 'prestidigitacao', 'furtividade']
  },
  Feiticeiro: {
    name: 'Feiticeiro',
    hitDie: '1d6',
    savingThrows: ['con', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Adagas, dardos, fundas, bordões, ballestras leves',
    skillChoices: 2,
    skillOptions: ['arcanismo', 'blefar', 'intuicao', 'intimidacao', 'persuasao', 'religiao']
  },
  Bruxo: {
    name: 'Bruxo',
    hitDie: '1d8',
    savingThrows: ['wis', 'cha'],
    spellcastingAbility: 'cha',
    armorProficiencies: 'Armaduras leves',
    weaponProficiencies: 'Armas simples',
    skillChoices: 2,
    skillOptions: ['arcanismo', 'blefar', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao']
  },
  Mago: {
    name: 'Mago',
    hitDie: '1d6',
    savingThrows: ['int', 'wis'],
    spellcastingAbility: 'int',
    armorProficiencies: 'Nenhuma',
    weaponProficiencies: 'Adagas, dardos, fundas, bordões, ballestras leves',
    skillChoices: 2,
    skillOptions: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'religiao']
  },
  Artífice: {
    name: 'Artífice',
    hitDie: '1d8',
    savingThrows: ['con', 'int'],
    spellcastingAbility: 'int',
    armorProficiencies: 'Armaduras leves, armaduras médias, escudos',
    weaponProficiencies: 'Armas simples, ferramentas de ladrão, ferramentas de artesão (uma à escolha)',
    skillChoices: 2,
    skillOptions: ['arcanismo', 'historia', 'investigacao', 'medicina', 'natureza', 'percepcao', 'prestidigitacao']
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

export function generateUuid(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
    id: generateUuid(),
    userId,
    campaignId,
    isPublic: true,
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
    modelUrl: getModelUrlByNameOrPath('Guerreiro'),

    inspiration: false,
    attributePointsAvailable: 27,
    attributesLocked: false,
    attributes: {
      str: { score: 8, baseScore: 8 },
      dex: { score: 8, baseScore: 8 },
      con: { score: 8, baseScore: 8 },
      int: { score: 8, baseScore: 8 },
      wis: { score: 8, baseScore: 8 },
      cha: { score: 8, baseScore: 8 },
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

    attacks: [],

    skills: initialSkills,
    otherProficienciesAndLanguages: '',

    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    featuresAndTraits: '',

    age: '',
    height: '',
    weight: '',
    eyes: '',
    skin: '',
    hair: '',
    appearanceDesc: '',
    backstory: '',
    alliesAndOrganizations: '',
    factionSymbolName: '',
    factionSymbolUrl: '',
    otherFeatures: '',
    treasure: '',
    equipment: [],
    currency: { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 },

    spellcastingClass: '',
    spellcastingAbility: 'int',
    spellSlots: initialSpellSlots,
    spells: [],

    updatedAt: new Date().toISOString(),
  };
}

export const CLASS_FEATURES_DB: Record<string, Record<number, Omit<ClassFeature, 'id'>[]>> = {
  Bárbaro: {
    1: [
      {
        name: 'Fúria',
        level: 1,
        description: 'Você pode entrar em fúria como uma ação bônus. Em fúria, você ganha vantagem em testes de Força e salvaguardas de Força, bônus de dano em ataques corpo a corpo com Força (+2 inicial), e resistência a dano de concussão, cortante e perfurante.',
        activation: 'bonus_action',
        resourceCost: { type: 'class_resource', name: 'furia', amount: 1 }
      },
      {
        name: 'Defesa sem Armadura (Bárbaro)',
        level: 1,
        description: 'Enquanto não estiver usando nenhuma armadura, sua Classe de Armadura é igual a 10 + mod de Destreza + mod de Constituição. Você pode usar um escudo e obter esse benefício.',
        activation: 'none'
      }
    ],
    2: [
      {
        name: 'Ataque Descuidado',
        level: 2,
        description: 'Ao fazer seu primeiro ataque no seu turno, você pode decidir atacar de forma descuidada. Fazer isso lhe dá vantagem em jogadas de ataque corpo a corpo usando Força durante esse turno, mas jogadas de ataque contra você têm vantagem até o início do seu próximo turno.',
        activation: 'none'
      },
      {
        name: 'Sentido de Perigo',
        level: 2,
        description: 'Você tem vantagem em salvaguardas de Destreza contra efeitos que possa ver, como armadilhas e magias, desde que não esteja cego, surdo ou incapacitado.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Caminho Primitivo',
        level: 3,
        description: 'Você escolhe um caminho que molda a natureza de sua fúria.',
        activation: 'none',
        choices: ['Caminho do Berserker', 'Caminho do Guerreiro Totêmico'],
        isSubclassChoice: true
      },
      {
        name: 'Fúria Frenética',
        level: 3,
        description: 'Você pode entrar em frenesi quando estiver em fúria. Se fizer isso, pela duração da fúria você pode fazer um ataque corpo a corpo como ação bônus em cada um de seus turnos. Quando a fúria acaba, você sofre um nível de exaustão.',
        activation: 'none',
        requiresSubclass: 'Caminho do Berserker'
      },
      {
        name: 'Buscador Espiritual',
        level: 3,
        description: 'Você ganha a habilidade de conjurar as magias Sentido da Besta e Falar com Animais como rituais (sem gastar espaço de magia).',
        activation: 'none',
        requiresSubclass: 'Caminho do Guerreiro Totêmico'
      },
      {
        name: 'Espírito Totêmico (Ex: Urso)',
        level: 3,
        description: 'Enquanto estiver em fúria, você ganha resistência a todos os danos, exceto dano psíquico.',
        activation: 'none',
        requiresSubclass: 'Caminho do Guerreiro Totêmico'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Ataque Extra',
        level: 5,
        description: 'Você pode atacar duas vezes, ao invés de uma, sempre que usar a ação de Ataque no seu turno.',
        activation: 'none'
      },
      {
        name: 'Movimento Rápido',
        level: 5,
        description: 'Seu deslocamento aumenta em 3 metros (10 ft) enquanto você não estiver usando armadura pesada.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Presença Aterradora',
        level: 6,
        description: 'Você não pode ser enfeitiçado nem amedrontado enquanto estiver em fúria. Se você já estava sob esse efeito quando entrou em fúria, o efeito é suspenso enquanto durar a fúria.',
        activation: 'none',
        requiresSubclass: 'Caminho do Berserker'
      },
      {
        name: 'Aspecto da Fera (Ex: Águia)',
        level: 6,
        description: 'Você ganha a visão aguçada de uma águia. Você pode enxergar até 1,5 km com perfeição sem desvantagem por luz fraca.',
        activation: 'none',
        requiresSubclass: 'Caminho do Guerreiro Totêmico'
      }
    ],
    7: [
      {
        name: 'Instinto Feral',
        level: 7,
        description: 'Sua iniciativa tem vantagem. Se estiver surpreso no início do combate e não estiver incapacitado, você pode agir normalmente no seu primeiro turno se entrar em fúria antes de fazer qualquer outra coisa.',
        activation: 'none'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Crítico Brutal (1 dado)',
        level: 9,
        description: 'Você pode rolar um dado de dano de arma adicional ao determinar o dano extra de um acerto crítico com um ataque corpo a corpo.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Presença Intimidadora',
        level: 10,
        description: 'Você pode usar sua ação para assustar uma criatura (CD = 8 + prof + CAR). Se falhar, fica assustada até o fim do seu próximo turno. Pode estender usando ação.',
        activation: 'action',
        requiresSubclass: 'Caminho do Berserker'
      },
      {
        name: 'Andarilho Espiritual',
        level: 10,
        description: 'Você pode conjurar Comunhão com a Natureza como ritual.',
        activation: 'none',
        requiresSubclass: 'Caminho do Guerreiro Totêmico'
      }
    ],
    11: [
      {
        name: 'Fúria Implacável',
        level: 11,
        description: 'Se você cair para 0 pontos de vida enquanto estiver em fúria e não morrer imediatamente, você pode fazer uma salvaguarda de Constituição CD 10. Se passar, você volta para 1 ponto de vida. A CD aumenta em 5 a cada uso até você terminar um descanso curto ou longo.',
        activation: 'special'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Retaliação',
        level: 14,
        description: 'Quando você sofre dano de uma criatura adjacente, pode usar sua reação para fazer um ataque corpo a corpo contra ela.',
        activation: 'reaction',
        requiresSubclass: 'Caminho do Berserker'
      },
      {
        name: 'Sintonia Totêmica',
        level: 14,
        description: 'Você se sintoniza melhor com o totem. Ganha benefício poderoso enquanto em fúria (ex: Derrubar criatura, voar, etc).',
        activation: 'none',
        requiresSubclass: 'Caminho do Guerreiro Totêmico'
      }
    ],
    15: [
      {
        name: 'Fúria Persistente',
        level: 15,
        description: 'Sua fúria se torna tão feroz que ela só termina prematuramente se você cair inconsciente ou se você decidir encerrá-la.',
        activation: 'none'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Poder Indomável',
        level: 18,
        description: 'Se o resultado de um teste de Força for menor que o seu valor de Força, você pode usar o valor do atributo no lugar do resultado total do dado.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Campeão Primitivo',
        level: 20,
        description: 'Seus valores de Força e Constituição aumentam em 4 pontos. Seu máximo para esses atributos passa a ser 24.',
        activation: 'none'
      }
    ]
  },
  Paladino: {
    1: [
      {
        name: 'Sentido Divino',
        level: 1,
        description: 'Com uma ação, até o final do seu próximo turno, você sabe a localização de qualquer celestial, corruptor ou morto-vivo dentro de 18 metros que não esteja sob cobertura total.',
        activation: 'action',
        resourceCost: { type: 'class_resource', name: 'sentido_divino', amount: 1 }
      },
      {
        name: 'Mãos Curativas (Lay on Hands)',
        level: 1,
        description: 'Você possui uma reserva de poder curativo. Com uma ação, você pode tocar uma criatura e gastar pontos dessa reserva para restaurar pontos de vida ou curar doenças/venenos (custa 5 pontos).',
        activation: 'action',
        resourceCost: { type: 'class_resource', name: 'lay_on_hands', amount: 1 }
      }
    ],
    2: [
      {
        name: 'Destruição Divina (Divine Smite)',
        level: 2,
        description: 'Quando você acertar uma criatura com um ataque corpo a corpo com arma, você pode gastar um espaço de magia de paladino para causar dano radiante extra de 2d8 para um espaço de 1º nível, mais 1d8 para cada nível de magia superior a 1º (máximo de 5d8), mais 1d8 se o alvo for um corruptor ou morto-vivo.',
        activation: 'special',
        resourceCost: { type: 'spell_slot', amount: 1 }
      },
      {
        name: 'Estilo de Luta',
        level: 2,
        description: 'Você adota um estilo de luta particular como sua especialidade (ex: Defesa, Duelismo, Combate com Duas Armas, etc).',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Saúde Divina',
        level: 3,
        description: 'A magia divina fluindo em você o torna imune a doenças.',
        activation: 'none'
      },
      {
        name: 'Canalizar Divindade (Juramento)',
        level: 3,
        description: 'Você ganha a habilidade de canalizar energia divina para alimentar efeitos mágicos fornecidos pelo seu Juramento Sagrado.',
        activation: 'action',
        resourceCost: { type: 'class_resource', name: 'canalizar_divindade', amount: 1 },
        choices: ['Juramento da Devoção', 'Juramento dos Anciões', 'Juramento da Vingança']
      },
      {
        name: 'Arma Sagrada / Expulsar o Profano',
        level: 3,
        description: 'Você pode imbuir sua arma com energia positiva (emitindo luz e adicionando mod. CAR às jogadas de ataque por 1 minuto) ou usar uma ação para tentar expulsar demônios e mortos-vivos.',
        activation: 'action',
        requiresSubclass: 'Juramento da Devoção'
      },
      {
        name: 'Ira da Natureza / Expulsar os Infiéis',
        level: 3,
        description: 'Você pode conjurar vinhas espectrais para prender um inimigo (teste Força/Destreza) ou apresentar seu símbolo sagrado para expulsar fadas e corruptores.',
        activation: 'action',
        requiresSubclass: 'Juramento dos Anciões'
      },
      {
        name: 'Abjurar Inimigo / Voto de Inimizade',
        level: 3,
        description: 'Você pode assustar uma criatura, reduzindo seu deslocamento a 0, ou fazer um Voto de Inimizade contra uma criatura, ganhando vantagem nas jogadas de ataque contra ela por 1 minuto.',
        activation: 'action',
        requiresSubclass: 'Juramento da Vingança'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Ataque Extra',
        level: 5,
        description: 'Você pode atacar duas vezes, ao invés de uma, sempre que usar a ação de Ataque no seu turno.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Aura de Proteção',
        level: 6,
        description: 'Você e criaturas amigáveis dentro de 3 metros ganham bônus em salvaguardas igual ao seu modificador de Carisma (mínimo de +1) enquanto você estiver consciente.',
        activation: 'none'
      }
    ],
    7: [
      {
        name: 'Aura de Devoção',
        level: 7,
        description: 'Você e criaturas amigáveis a até 3 metros de você não podem ser enfeitiçados enquanto você estiver consciente.',
        activation: 'none',
        requiresSubclass: 'Juramento da Devoção'
      },
      {
        name: 'Aura de Proteção contra Magia',
        level: 7,
        description: 'A magia antiga reside tão profundamente em você que forma um escudo. Você e aliados a até 3 metros têm resistência a dano de magias.',
        activation: 'none',
        requiresSubclass: 'Juramento dos Anciões'
      },
      {
        name: 'Vingador Implacável',
        level: 7,
        description: 'Quando você atinge uma criatura com um ataque de oportunidade, pode mover-se até metade do seu deslocamento imediatamente após o ataque sem provocar ataques de oportunidade.',
        activation: 'none',
        requiresSubclass: 'Juramento da Vingança'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Aura de Coragem',
        level: 10,
        description: 'Você e criaturas amigáveis dentro de 3 metros não podem ser amedrontados enquanto você estiver consciente.',
        activation: 'none'
      }
    ],
    11: [
      {
        name: 'Destruição Divina Aprimorada',
        level: 11,
        description: 'Todos os seus golpes corpo a corpo são imbuídos de poder divino. Sempre que você acertar uma criatura com um ataque corpo a corpo, ela sofre 1d8 de dano radiante extra.',
        activation: 'none'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Toque Purificador',
        level: 14,
        description: 'Você pode usar sua ação para encerrar uma magia ativa em si mesmo ou em uma criatura voluntária que você tocar.',
        activation: 'action',
        resourceCost: { type: 'class_resource', name: 'toque_purificador', amount: 1 }
      }
    ],
    15: [
      {
        name: 'Pureza de Espírito',
        level: 15,
        description: 'Você está permanentemente sob o efeito da magia Proteção contra o Mal e o Bem.',
        activation: 'none',
        requiresSubclass: 'Juramento da Devoção'
      },
      {
        name: 'Sentinela Imortal',
        level: 15,
        description: 'Quando cair para 0 pontos de vida, mas não morrer de imediato, pode escolher cair para 1 PV. Você também não sofre mais efeitos da velhice.',
        activation: 'none',
        requiresSubclass: 'Juramento dos Anciões'
      },
      {
        name: 'Alma da Vingança',
        level: 15,
        description: 'Quando a criatura sob o seu Voto de Inimizade faz um ataque, você pode usar sua reação para realizar um ataque corpo a corpo contra ela.',
        activation: 'reaction',
        requiresSubclass: 'Juramento da Vingança'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Melhoria nas Auras',
        level: 18,
        description: 'O alcance de suas auras (Proteção e Coragem) aumenta para 9 metros (30 ft).',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Nimbo Sagrado',
        level: 20,
        description: 'Você emite luz do sol. Durante 1 minuto, criaturas a 9m têm desvantagem em testes de resistência e demônios/mortos-vivos sofrem 10 de dano radiante no turno deles.',
        activation: 'action',
        requiresSubclass: 'Juramento da Devoção'
      },
      {
        name: 'Campeão Ancião',
        level: 20,
        description: 'Por 1 minuto você assume a forma de uma força da natureza. Recupera 10 PV por turno, conjura magias de paladino com ação bônus, e inimigos a 3m têm desvantagem contra suas magias.',
        activation: 'action',
        requiresSubclass: 'Juramento dos Anciões'
      },
      {
        name: 'Anjo Vingador',
        level: 20,
        description: 'Por 1 hora você ganha asas de anjo. Deslocamento de voo 18m, e emite uma aura ameaçadora a 9m. Inimigos que começarem o turno lá devem passar em Sabedoria ou ficarão assustados.',
        activation: 'action',
        requiresSubclass: 'Juramento da Vingança'
      }
    ]
  },
  Mago: {
    1: [
      {
        name: 'Recuperação Arcana',
        level: 1,
        description: 'Você aprendeu a recuperar parte da sua energia mágica lendo seu grimório. Uma vez por dia, ao terminar um descanso curto, você pode escolher espaços de magia gastos para recuperá-los. O nível combinado dos espaços não pode exceder metade do seu nível de mago (arredondado para cima).',
        activation: 'none',
        resourceCost: { type: 'class_resource', name: 'recuperacao_arcana', amount: 1 }
      }
    ],
    2: [
      {
        name: 'Tradição Arcana',
        level: 2,
        description: 'Você escolhe uma Tradição Arcana (como Abjuração ou Evocação). A sua escolha lhe concede características no 2º nível e novamente no 6º, 10º e 14º níveis.',
        activation: 'none',
        choices: ['Escola de Abjuração', 'Escola de Adivinhação', 'Escola de Conjuração', 'Escola de Encantamento', 'Escola de Evocação', 'Escola de Ilusão', 'Escola de Necromancia', 'Escola de Transmutação']
      },
      {
        name: 'Sabedoria da Abjuração',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Abjuração em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Abjuração'
      },
      {
        name: 'Proteção Arcana',
        level: 2,
        description: 'Sempre que você conjurar uma magia de Abjuração de 1º nível ou superior, você cria uma barreira mágica em si mesmo que dura até você terminar um descanso longo. A barreira tem PV iguais a duas vezes seu nível de Mago + Mod. Int.',
        activation: 'none',
        requiresSubclass: 'Escola de Abjuração'
      },
      {
        name: 'Sabedoria da Evocação',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Evocação em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Evocação'
      },
      {
        name: 'Esculpir Magias',
        level: 2,
        description: 'Você pode criar bolsões de segurança relativa no meio de suas magias de Evocação. Você escolhe um número de criaturas igual a 1 + nível da magia para passarem automaticamente na salvaguarda contra a magia e não sofrerem nenhum dano se normalmente sofreriam metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Evocação'
      },
      {
        name: 'Sabedoria da Conjuração',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Conjuração em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Conjuração'
      },
      {
        name: 'Conjuração Menor',
        level: 2,
        description: 'Você pode usar sua ação para conjurar um objeto inanimado em sua mão ou no chão a até 3 metros de você. O objeto não pode ter mais de 1 metro de lado ou pesar mais que 5 kg, durando 1 hora.',
        activation: 'action',
        requiresSubclass: 'Escola de Conjuração'
      },
      {
        name: 'Sabedoria da Adivinhação',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Adivinhação em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Adivinhação'
      },
      {
        name: 'Portento',
        level: 2,
        description: 'Você rola 2d20 ao terminar um descanso longo e guarda os resultados. Você pode substituir qualquer jogada de ataque, salvaguarda ou teste de habilidade feito por você ou por uma criatura que possa ver por um desses valores preditos antes do dado ser rolado.',
        activation: 'none',
        requiresSubclass: 'Escola de Adivinhação'
      },
      {
        name: 'Sabedoria do Encantamento',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Encantamento em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Encantamento'
      },
      {
        name: 'Olhar Hipnótico',
        level: 2,
        description: 'Com uma ação, escolha uma criatura a 1,5m de você. Se ela falhar numa salvaguarda de Sabedoria (contra CD de Magia), ela fica enfeitiçada por você até o fim do seu próximo turno, tendo seu deslocamento reduzido a 0 e ficando incapacitada. Você pode usar sua ação em turnos subsequentes para estender o efeito.',
        activation: 'action',
        requiresSubclass: 'Escola de Encantamento'
      },
      {
        name: 'Sabedoria da Ilusão',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Ilusão em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Ilusão'
      },
      {
        name: 'Ilusão Menor Aprimorada',
        level: 2,
        description: 'Você aprende o truque Ilusão Menor (ou outro de Mago se já o tiver). Quando você o conjura, pode criar tanto um som quanto uma imagem com uma única conjuração do truque.',
        activation: 'none',
        requiresSubclass: 'Escola de Ilusão'
      },
      {
        name: 'Sabedoria da Necromancia',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Necromancia em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Necromancia'
      },
      {
        name: 'Colheita Sombria',
        level: 2,
        description: 'Uma vez por turno quando você matar uma ou mais criaturas com uma magia de 1º nível ou superior, você recupera PV iguais a duas vezes o nível da magia (ou três vezes se for uma magia de necromancia). Não funciona em construtos ou mortos-vivos.',
        activation: 'none',
        requiresSubclass: 'Escola de Necromancia'
      },
      {
        name: 'Sabedoria da Transmutação',
        level: 2,
        description: 'O tempo e ouro que você gasta para copiar uma magia de Transmutação em seu grimório é reduzido à metade.',
        activation: 'none',
        requiresSubclass: 'Escola de Transmutação'
      },
      {
        name: 'Alquimia Menor',
        level: 2,
        description: 'Você pode alterar as propriedades físicas de um objeto não mágico, transformando-o temporariamente (1 hora para cada 10 minutos gastos). Você pode transformar madeira, pedra, ferro, cobre ou prata uns nos outros (máximo 0,028 metros cúbicos).',
        activation: 'action',
        requiresSubclass: 'Escola de Transmutação'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Proteção Projetada',
        level: 6,
        description: 'Quando uma criatura que você possa ver a até 9 metros sofrer dano, você pode usar sua reação para que sua Proteção Arcana absorva aquele dano. Se a proteção for reduzida a 0, a criatura protegida sofre o restante.',
        activation: 'reaction',
        requiresSubclass: 'Escola de Abjuração'
      },
      {
        name: 'Truque Potente',
        level: 6,
        description: 'Suas magias de dano que causam dano através de truques afetam até criaturas que evitariam seus efeitos. Se um alvo passar na salvaguarda contra seu truque, ele ainda sofre metade do dano (mas nenhum efeito adicional).',
        activation: 'none',
        requiresSubclass: 'Escola de Evocação'
      },
      {
        name: 'Transposição Benigna',
        level: 6,
        description: 'Você pode usar sua ação para se teletransportar até 9 metros. Você também pode trocar de lugar com uma criatura voluntária Pequena ou Média no mesmo alcance. O uso recarrega num descanso longo ou ao conjurar uma magia de Conjuração.',
        activation: 'action',
        requiresSubclass: 'Escola de Conjuração'
      },
      {
        name: 'Adivinhação Especializada',
        level: 6,
        description: 'Conjurar magias de adivinhação exige menos esforço. Ao conjurar uma magia de adivinhação de 2º nível ou superior com espaço de magia, você recupera um espaço de magia gasto (nível menor que a magia usada, máx 5º nível).',
        activation: 'none',
        requiresSubclass: 'Escola de Adivinhação'
      },
      {
        name: 'Charme Instintivo',
        level: 6,
        description: 'Quando uma criatura a até 9 metros fizer uma rolagem de ataque contra você (e houver outra criatura ao seu alcance), você pode usar sua reação para forçá-la a atacar a outra criatura se ela falhar numa salvaguarda de Sabedoria.',
        activation: 'reaction',
        requiresSubclass: 'Escola de Encantamento'
      },
      {
        name: 'Ilusões Maleáveis',
        level: 6,
        description: 'Ao conjurar uma magia de Ilusão que dure 1 minuto ou mais, você pode usar sua ação para alterar a natureza da ilusão (desde que ainda esteja dentro dos parâmetros normais da magia) se puder ver a ilusão.',
        activation: 'action',
        requiresSubclass: 'Escola de Ilusão'
      },
      {
        name: 'Servos Mortos-Vivos',
        level: 6,
        description: 'Você aprende Animar Mortos. Ao conjurar, alvo um cadáver extra, os mortos-vivos ganham PV extra (igual nível de Mago) e dano extra (igual bônus proficiência).',
        activation: 'none',
        requiresSubclass: 'Escola de Necromancia'
      },
      {
        name: 'Pedra do Transmutador',
        level: 6,
        description: 'Você pode criar uma Pedra do Transmutador em 8 horas, concedendo um benefício como: Visão no escuro (18m), Deslocamento +3m, Proficiência em Resistência CON, ou Resistência a um tipo de dano elemental.',
        activation: 'none',
        requiresSubclass: 'Escola de Transmutação'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Abjuração Aprimorada',
        level: 10,
        description: 'Sempre que você conjurar uma magia de Abjuração que requeira um teste de habilidade como parte de sua conjuração (como Contramágica), você adiciona seu bônus de proficiência ao teste de habilidade.',
        activation: 'none',
        requiresSubclass: 'Escola de Abjuração'
      },
      {
        name: 'Evocação Potencializada',
        level: 10,
        description: 'Você adiciona seu modificador de Inteligência a uma jogada de dano de qualquer magia de Evocação que você conjurar.',
        activation: 'none',
        requiresSubclass: 'Escola de Evocação'
      },
      {
        name: 'Conjuração Focada',
        level: 10,
        description: 'Enquanto estiver concentrado em uma magia de Conjuração, sua concentração não pode ser quebrada devido à tomada de dano.',
        activation: 'none',
        requiresSubclass: 'Escola de Conjuração'
      },
      {
        name: 'O Terceiro Olho',
        level: 10,
        description: 'Você pode usar uma ação para aumentar sua percepção (dura até descansar). Escolha um: Visão no Escuro 18m, Ver o Invisível 18m, Ler qualquer idioma, ou Ver no Plano Etéreo 18m.',
        activation: 'action',
        requiresSubclass: 'Escola de Adivinhação'
      },
      {
        name: 'Encantamento Dividido',
        level: 10,
        description: 'Quando conjurar uma magia de Encantamento de 1º nível ou maior visando 1 criatura, você pode escolher uma segunda criatura como alvo para afetar ambas.',
        activation: 'none',
        requiresSubclass: 'Escola de Encantamento'
      },
      {
        name: 'Eu Ilusório',
        level: 10,
        description: 'Você pode criar um duplicata de si em resposta a um ataque como reação. O duplicata leva o ataque no seu lugar, dissipando. Recarrega com descanso curto/longo.',
        activation: 'reaction',
        requiresSubclass: 'Escola de Ilusão'
      },
      {
        name: 'Acostumado à Morte-Viva',
        level: 10,
        description: 'Você ganha resistência a dano necrótico e seu máximo de pontos de vida não pode ser reduzido por nenhum efeito.',
        activation: 'none',
        requiresSubclass: 'Escola de Necromancia'
      },
      {
        name: 'Metamorfo',
        level: 10,
        description: 'Você adiciona a magia Polimorfismo ao seu grimório. Você pode conjurá-la sem gastar espaço de magia mirando em si mesmo transformando-se apenas em uma besta com nível de desafio 1 ou menor.',
        activation: 'action',
        requiresSubclass: 'Escola de Transmutação'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Resistência a Magia',
        level: 14,
        description: 'Você tem vantagem em salvaguardas contra magias, e você tem resistência contra o dano de magias.',
        activation: 'none',
        requiresSubclass: 'Escola de Abjuração'
      },
      {
        name: 'Sobrecarga',
        level: 14,
        description: 'Ao conjurar uma magia de Mago de 1º a 5º nível que causa dano, você pode causar o dano máximo. Na primeira vez, não há efeito colateral. Na segunda, você sofre 2d12 de dano necrótico por nível da magia. Cada uso extra no mesmo dia adiciona +1d12.',
        activation: 'none',
        requiresSubclass: 'Escola de Evocação'
      },
      {
        name: 'Invocações Duráveis',
        level: 14,
        description: 'Qualquer criatura que você evocar com uma magia de Conjuração ganha 30 PV temporários ao surgir.',
        activation: 'none',
        requiresSubclass: 'Escola de Conjuração'
      },
      {
        name: 'Portento Maior',
        level: 14,
        description: 'Você agora rola 3d20 e guarda 3 resultados no lugar de 2 com o seu Portento ao concluir um descanso longo.',
        activation: 'none',
        requiresSubclass: 'Escola de Adivinhação'
      },
      {
        name: 'Alterar Memórias',
        level: 14,
        description: 'Ao enfeitiçar criaturas com magia de encantamento, você pode deixá-las desatentas do encanto. Antes da magia terminar, você pode usar uma ação para apagar até 1 hora de memória da criatura.',
        activation: 'action',
        requiresSubclass: 'Escola de Encantamento'
      },
      {
        name: 'Realidade Ilusória',
        level: 14,
        description: 'Você pode transformar parte da sua ilusão num objeto real. Ao conjurar magia de Ilusão nível 1+, com ação bônus, um objeto não mágico na ilusão torna-se real por 1 minuto (exemplo: ponte).',
        activation: 'bonus_action',
        requiresSubclass: 'Escola de Ilusão'
      },
      {
        name: 'Comandar Mortos-Vivos',
        level: 14,
        description: 'Com uma ação, pode tentar controlar um morto-vivo dentro de 18m. Ele deve testar Sabedoria, se falhar ficará amigável a você e obedecerá comandos. Inteligência alta ou imunidade a charme dificultam o controle.',
        activation: 'action',
        requiresSubclass: 'Escola de Necromancia'
      },
      {
        name: 'Mestre Transmutador',
        level: 14,
        description: 'Você pode consumir sua Pedra do Transmutador com uma ação para obter efeitos massivos: Transformação Maior, Panaceia, Restauração de Vida, ou Restaurar Juventude. A pedra é destruída.',
        activation: 'action',
        requiresSubclass: 'Escola de Transmutação'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Maestria em Magia',
        level: 18,
        description: 'Escolha uma magia de 1º nível e uma de 2º nível do Mago. Você pode conjurá-las no seu nível básico de conjuração sem gastar espaços de magia (quando preparadas).',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois valores de habilidade em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Magia Assinatura',
        level: 20,
        description: 'Escolha duas magias de 3º nível. Você as tem sempre preparadas (não contam no limite) e pode conjurar cada uma delas uma vez por descanso curto/longo sem gastar espaços de magia.',
        activation: 'none'
      }
    ]
  },
  Bardo: {
    1: [
      {
        name: 'Inspiração Bárdica (d6)',
        level: 1,
        description: 'Com uma ação bônus, você escolhe uma criatura (além de você) a até 18 metros. Ela ganha um dado de Inspiração Bárdica (d6).',
        activation: 'bonus_action',
        resourceCost: { type: 'class_resource', name: 'inspiracao_bardica', amount: 1 }
      }
    ],
    2: [
      {
        name: 'Faz-Tudo',
        level: 2,
        description: 'Adiciona metade do bônus de proficiência (arredondado para baixo) a testes de habilidade sem proficiência.',
        activation: 'none'
      },
      {
        name: 'Canção de Descanso (d6)',
        level: 2,
        description: 'Aliados que gastarem Dados de Vida num descanso curto recuperam 1d6 PV extras.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Colégio Bárdico',
        level: 3,
        description: 'Escolha um colégio bárdico (Ex: Colégio do Conhecimento).',
        activation: 'none',
        choices: ['Colégio do Conhecimento', 'Colégio da Bravura'],
        isSubclassChoice: true
      },
      {
        name: 'Especialização',
        level: 3,
        description: 'Escolha 2 perícias com proficiência; seu bônus de proficiência é dobrado para elas.',
        activation: 'none'
      },
      {
        name: 'Proficiências Adicionais',
        level: 3,
        description: 'Você ganha proficiência em 3 perícias à escolha.',
        activation: 'none',
        requiresSubclass: 'Colégio do Conhecimento'
      },
      {
        name: 'Palavras Cortantes',
        level: 3,
        description: 'Gaste um uso de Inspiração como reação para subtrair o dado de uma rolagem de inimigo.',
        activation: 'reaction',
        resourceCost: { type: 'class_resource', name: 'inspiracao_bardica', amount: 1 },
        requiresSubclass: 'Colégio do Conhecimento'
      },
      {
        name: 'Proficiências Extras (Bravura)',
        level: 3,
        description: 'Você ganha proficiência com armaduras médias, escudos e armas marciais.',
        activation: 'none',
        requiresSubclass: 'Colégio da Bravura'
      },
      {
        name: 'Inspiração de Combate',
        level: 3,
        description: 'Uma criatura que tenha um dado de Inspiração Bárdica seu pode rolar esse dado e adicionar o resultado à jogada de dano da arma que acabou de realizar. Alternativamente, quando uma jogada de ataque for feita contra a criatura, ela pode usar sua reação para rolar o dado e adicionar o resultado à sua CA contra aquele ataque.',
        activation: 'none',
        requiresSubclass: 'Colégio da Bravura'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Você pode aumentar um valor de habilidade à sua escolha em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Inspiração Bárdica (d8)',
        level: 5,
        description: 'O dado de Inspiração Bárdica aumenta para d8.',
        activation: 'none'
      },
      {
        name: 'Fonte de Inspiração',
        level: 5,
        description: 'Você recupera Inspiração Bárdica com descansos curtos ou longos.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Segredos Mágicos Adicionais',
        level: 6,
        description: 'Aprenda 2 magias de qualquer classe.',
        activation: 'none',
        requiresSubclass: 'Colégio do Conhecimento'
      },
      {
        name: 'Ataque Extra (Bravura)',
        level: 6,
        description: 'Você pode atacar duas vezes, ao invés de uma, sempre que usar a ação de Ataque no seu turno.',
        activation: 'none',
        requiresSubclass: 'Colégio da Bravura'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Canção de Descanso (d8)',
        level: 9,
        description: 'A cura extra da Canção de Descanso aumenta para d8.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Inspiração Bárdica (d10)',
        level: 10,
        description: 'O dado de Inspiração Bárdica aumenta para d10.',
        activation: 'none'
      },
      {
        name: 'Especialização',
        level: 10,
        description: 'Escolha mais 2 proficiências em perícia para obter o dobro do bônus.',
        activation: 'none'
      },
      {
        name: 'Segredos Mágicos',
        level: 10,
        description: 'Aprenda 2 magias de qualquer classe.',
        activation: 'none'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    13: [
      {
        name: 'Canção de Descanso (d10)',
        level: 13,
        description: 'A cura extra da Canção de Descanso aumenta para d10.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Segredos Mágicos',
        level: 14,
        description: 'Aprenda 2 magias adicionais de qualquer classe.',
        activation: 'none'
      },
      {
        name: 'Habilidade Inigualável',
        level: 14,
        description: 'Gaste um uso de Inspiração Bárdica para adicionar ao seu próprio teste de habilidade.',
        activation: 'none',
        requiresSubclass: 'Colégio do Conhecimento'
      },
      {
        name: 'Magia de Combate (Bravura)',
        level: 14,
        description: 'Quando você usa sua ação para conjurar uma magia de bardo, você pode fazer um ataque com arma como uma ação bônus.',
        activation: 'bonus_action',
        requiresSubclass: 'Colégio da Bravura'
      }
    ],
    15: [
      {
        name: 'Inspiração Bárdica (d12)',
        level: 15,
        description: 'O dado de Inspiração Bárdica aumenta para d12.',
        activation: 'none'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Canção de Descanso (d12)',
        level: 17,
        description: 'A cura extra da Canção de Descanso aumenta para d12.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Segredos Mágicos',
        level: 18,
        description: 'Aprenda 2 magias adicionais de qualquer classe.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Inspiração Superior',
        level: 20,
        description: 'Ao rolar iniciativa sem Inspiração Bárdica, recupera 1 uso.',
        activation: 'none'
      }
    ]
  },
  Guerreiro: {
    1: [
      {
        name: 'Estilo de Luta',
        level: 1,
        description: 'Você adota um estilo de combate particular que será sua especialidade.',
        activation: 'none',
        choices: ['Arquearia', 'Defesa', 'Duelo', 'Combate com Armas Grandes', 'Proteção', 'Combate com Duas Armas']
      },
      {
        name: 'Retomar o Fôlego',
        level: 1,
        description: 'No seu turno, pode usar uma ação bônus para recuperar PV igual a 1d10 + seu nível de Guerreiro.',
        activation: 'bonus_action'
      }
    ],
    2: [
      {
        name: 'Surto de Ação',
        level: 2,
        description: 'Você pode realizar uma ação adicional no seu turno. 1 uso por descanso.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Arquétipo Marcial',
        level: 3,
        description: 'Escolha um arquétipo marcial que se esforçará para emular (ex: Campeão, Mestre de Batalha, Cavaleiro Arcano, Guerreiro Rúnico).',
        activation: 'none',
        choices: ['Campeão', 'Mestre de Batalha', 'Cavaleiro Arcano', 'Guerreiro Rúnico'],
        isSubclassChoice: true
      },
      {
        name: 'Crítico Aprimorado',
        level: 3,
        description: 'Seus ataques com armas atingem um acerto crítico num valor de 19 ou 20.',
        activation: 'none',
        requiresSubclass: 'Campeão'
      },
      {
        name: 'Superioridade Marcial',
        level: 3,
        description: 'Você ganha 4 dados de Superioridade (d8) e 3 manobras marciais (Desarmar, Rasteira, Empurrão) para aprimorar seus ataques e controle tático.',
        activation: 'none',
        requiresSubclass: 'Mestre de Batalha'
      },
      {
        name: 'Conjuração Arcana & Vínculo com Arma',
        level: 3,
        description: 'Você aprende Truques e Magias de Mago (Abjuração/Evocação). Além disso, pode sintonizar com 1 arma e convocá-la à sua mão como Ação Bônus.',
        activation: 'bonus_action',
        requiresSubclass: 'Cavaleiro Arcano'
      },
      {
        name: 'Poder do Gigante & Magia Rúnica',
        level: 3,
        description: 'Você ganha a habilidade de crescer para o tamanho Grande (Large) por 1 minuto (+1d6 dano, vantagem em Força) e gravar runas mágicas em seu equipamento.',
        activation: 'bonus_action',
        requiresSubclass: 'Guerreiro Rúnico'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Ataque Extra',
        level: 5,
        description: 'Você pode atacar duas vezes ao invés de uma, quando usar a ação de Ataque no seu turno.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 6,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    7: [
      {
        name: 'Atleta Notável',
        level: 7,
        description: 'Adicione metade do seu bônus de proficiência a testes de Força, Destreza ou Constituição que não usem a proficiência.',
        activation: 'none',
        requiresSubclass: 'Campeão'
      },
      {
        name: 'Conheça seu Inimigo',
        level: 7,
        description: 'Observando uma criatura por 1 minuto fora de combate, você descobre se ela é superior/igual/inferior a você em estatísticas chave.',
        activation: 'none',
        requiresSubclass: 'Mestre de Batalha'
      },
      {
        name: 'Magia de Guerra',
        level: 7,
        description: 'Quando você usar sua ação para conjurar um Truque, pode fazer um ataque com arma como Ação Bônus.',
        activation: 'bonus_action',
        requiresSubclass: 'Cavaleiro Arcano'
      },
      {
        name: 'Escudo Rúnico',
        level: 7,
        description: 'Quando uma criatura que você possa ver a 18m acertar um ataque em um aliado, use sua Reação para forçá-la a rerolar a jogada.',
        activation: 'reaction',
        requiresSubclass: 'Guerreiro Rúnico'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Indomável (1 uso)',
        level: 9,
        description: 'Você pode rolar novamente um teste de resistência que falhou. 1 uso por descanso longo.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Estilo de Luta Adicional',
        level: 10,
        description: 'Você pode escolher um segundo estilo de luta.',
        activation: 'none',
        requiresSubclass: 'Campeão'
      },
      {
        name: 'Superioridade Aprimorada (d10)',
        level: 10,
        description: 'Seus dados de Superioridade tornam-se d10.',
        activation: 'none',
        requiresSubclass: 'Mestre de Batalha'
      },
      {
        name: 'Golpe Arcano',
        level: 10,
        description: 'Quando você acertar uma criatura com um ataque com arma, ela terá desvantagem na próxima salvaguarda contra uma magia que você conjurar antes do fim do seu próximo turno.',
        activation: 'none',
        requiresSubclass: 'Cavaleiro Arcano'
      }
    ],
    11: [
      {
        name: 'Ataque Extra (2)',
        level: 11,
        description: 'Você pode atacar três vezes ao invés de duas.',
        activation: 'none'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    13: [
      {
        name: 'Indomável (2 usos)',
        level: 13,
        description: 'Você ganha um uso adicional de Indomável (Total: 2).',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 14,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    15: [
      {
        name: 'Crítico Superior',
        level: 15,
        description: 'Seus ataques com armas atingem um acerto crítico num valor 18, 19 ou 20.',
        activation: 'none',
        requiresSubclass: 'Campeão'
      },
      {
        name: 'Implacável',
        level: 15,
        description: 'Se você rolar iniciativa e não tiver dados de superioridade restantes, você recupera 1 dado de superioridade.',
        activation: 'none',
        requiresSubclass: 'Mestre de Batalha'
      },
      {
        name: 'Investida Arcana',
        level: 15,
        description: 'Ao usar Surto de Ação, você pode se teleportar magicamente até 9 metros (30ft) para um espaço desocupado antes ou depois da ação adicional.',
        activation: 'none',
        requiresSubclass: 'Cavaleiro Arcano'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Surto de Ação (2 usos)',
        level: 17,
        description: 'Você ganha um uso adicional de Surto de Ação (Total: 2).',
        activation: 'none'
      },
      {
        name: 'Indomável (3 usos)',
        level: 17,
        description: 'Você ganha um uso adicional de Indomável (Total: 3).',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Sobrevivente',
        level: 18,
        description: 'No início de cada um de seus turnos (se tiver até metade de seus PV), recupera 5 + Modificador de Constituição.',
        activation: 'none',
        requiresSubclass: 'Campeão'
      },
      {
        name: 'Superioridade Suprema (d12)',
        level: 18,
        description: 'Seus dados de Superioridade tornam-se d12.',
        activation: 'none',
        requiresSubclass: 'Mestre de Batalha'
      },
      {
        name: 'Magia de Guerra Aprimorada',
        level: 18,
        description: 'Quando você usar sua ação para conjurar uma Magia, pode fazer um ataque com arma como Ação Bônus.',
        activation: 'bonus_action',
        requiresSubclass: 'Cavaleiro Arcano'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Ataque Extra (3)',
        level: 20,
        description: 'Você pode atacar quatro vezes ao invés de três.',
        activation: 'none'
      }
    ]
  },
  Clérigo: {
    1: [
      {
        name: 'Conjuração (Clérigo)',
        level: 1,
        description: 'Você pode conjurar magias de clérigo usando Sabedoria como sua habilidade de conjuração. Você prepara a lista de magias que estão disponíveis para você conjurar.',
        activation: 'none'
      },
      {
        name: 'Domínio Divino',
        level: 1,
        description: 'Escolha um domínio divino relacionado à sua divindade.',
        activation: 'none',
        choices: ['Domínio da Vida'],
        isSubclassChoice: true
      },
      {
        name: 'Proficiência Bônus (Domínio da Vida)',
        level: 1,
        description: 'Você ganha proficiência com armaduras pesadas.',
        activation: 'none',
        requiresSubclass: 'Domínio da Vida'
      },
      {
        name: 'Discípulo da Vida',
        level: 1,
        description: 'Sempre que você usar uma magia de 1º nível ou superior para restaurar pontos de vida a uma criatura, a criatura recupera pontos de vida adicionais iguais a 2 + o nível da magia.',
        activation: 'special',
        requiresSubclass: 'Domínio da Vida'
      }
    ],
    2: [
      {
        name: 'Canalizar Divindade',
        level: 2,
        description: 'Você ganha a habilidade de canalizar energia divina diretamente de sua divindade para alimentar efeitos mágicos. Começa com dois efeitos: Expulsar Mortos-Vivos e um do seu domínio.',
        activation: 'none',
        resourceCost: { type: 'class_resource', name: 'canalizar_divindade', amount: 1 }
      },
      {
        name: 'Canalizar Divindade: Expulsar Mortos-Vivos',
        level: 2,
        description: 'Como uma ação, você apresenta seu símbolo sagrado. Cada morto-vivo até 9m deve fazer salvaguarda de Sabedoria ou será expulso por 1 minuto.',
        activation: 'action'
      },
      {
        name: 'Canalizar Divindade: Preservar a Vida',
        level: 2,
        description: 'Como uma ação, restaura PV igual a 5x nível de clérigo distribuído até 9m, sem curar além da metade dos PVs máximos.',
        activation: 'action',
        requiresSubclass: 'Domínio da Vida'
      }
    ],
    3: [],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Destruir Mortos-Vivos (ND 1/2)',
        level: 5,
        description: 'Quando um morto-vivo falhar no seu Expulsar Mortos-Vivos, ele é destruído se seu ND for 1/2 ou menor.',
        activation: 'special'
      }
    ],
    6: [
      {
        name: 'Canalizar Divindade (2 usos)',
        level: 6,
        description: 'Você pode usar Canalizar Divindade duas vezes entre descansos.',
        activation: 'none'
      },
      {
        name: 'Curador Abençoado',
        level: 6,
        description: 'Quando conjura magia que restaura PV para outra criatura, você recupera 2 + nível da magia em PV.',
        activation: 'special',
        requiresSubclass: 'Domínio da Vida'
      }
    ],
    7: [],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      },
      {
        name: 'Destruir Mortos-Vivos (ND 1)',
        level: 8,
        description: 'Mortos-Vivos de ND 1 ou menor são destruídos no seu Expulsar Mortos-Vivos.',
        activation: 'special'
      },
      {
        name: 'Golpe Divino (1d8)',
        level: 8,
        description: 'Uma vez por turno ao acertar ataque com arma, causa 1d8 de dano radiante extra.',
        activation: 'special',
        requiresSubclass: 'Domínio da Vida'
      }
    ],
    9: [],
    10: [
      {
        name: 'Intervenção Divina',
        level: 10,
        description: 'Role 1d100. Se o resultado for menor ou igual ao seu nível, sua divindade intervém. Requer 7 dias para usar novamente caso tenha sucesso.',
        activation: 'action'
      }
    ],
    11: [
      {
        name: 'Destruir Mortos-Vivos (ND 2)',
        level: 11,
        description: 'Mortos-Vivos de ND 2 ou menor são destruídos no seu Expulsar Mortos-Vivos.',
        activation: 'special'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    13: [],
    14: [
      {
        name: 'Destruir Mortos-Vivos (ND 3)',
        level: 14,
        description: 'Mortos-Vivos de ND 3 ou menor são destruídos no seu Expulsar Mortos-Vivos.',
        activation: 'special'
      },
      {
        name: 'Golpe Divino (2d8)',
        level: 14,
        description: 'Dano extra de Golpe Divino aumenta para 2d8.',
        activation: 'special',
        requiresSubclass: 'Domínio da Vida'
      }
    ],
    15: [],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Destruir Mortos-Vivos (ND 4)',
        level: 17,
        description: 'Mortos-Vivos de ND 4 ou menor são destruídos no seu Expulsar Mortos-Vivos.',
        activation: 'special'
      },
      {
        name: 'Cura Suprema',
        level: 17,
        description: 'Sempre que rolar dados para restaurar PV com magia, use o maior valor possível do dado.',
        activation: 'special',
        requiresSubclass: 'Domínio da Vida'
      }
    ],
    18: [
      {
        name: 'Canalizar Divindade (3 usos)',
        level: 18,
        description: 'Você pode usar Canalizar Divindade três vezes entre descansos.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Intervenção Divina Aprimorada',
        level: 20,
        description: 'Seu chamado por Intervenção Divina tem sucesso automático, sem rolar dados.',
        activation: 'action'
      }
    ]
  },
  Druida: {
    1: [
      {
        name: 'Idioma Druídico',
        level: 1,
        description: 'Você conhece o idioma druídico, uma língua secreta dos druidas. Você pode falar essa língua e deixar mensagens ocultas nela.',
        activation: 'none'
      },
      {
        name: 'Conjuração (Druida)',
        level: 1,
        description: 'Você pode conjurar magias de druida usando Sabedoria como sua habilidade de conjuração. Você prepara a lista de magias que estão disponíveis para você conjurar.',
        activation: 'none'
      }
    ],
    2: [
      {
        name: 'Forma Selvagem',
        level: 2,
        description: 'Como uma ação, você pode usar sua Forma Selvagem para assumir a forma de uma besta que você já tenha visto.',
        activation: 'action',
        resourceCost: { type: 'class_resource', name: 'forma_selvagem', amount: 1 }
      },
      {
        name: 'Círculo Druídico',
        level: 2,
        description: 'Escolha um círculo druídico que guiará sua conexão espiritual.',
        activation: 'none',
        choices: ['Círculo da Lua', 'Círculo da Terra'],
        isSubclassChoice: true
      },
      {
        name: 'Forma Selvagem de Combate',
        level: 2,
        description: 'Você ganha a habilidade de usar Forma Selvagem como uma ação bônus no seu turno, em vez de uma ação. Além disso, enquanto estiver transformado, você pode gastar um espaço de magia como ação bônus para recuperar 1d8 pontos de vida por nível do espaço de magia gasto.',
        activation: 'bonus_action',
        requiresSubclass: 'Círculo da Lua'
      },
      {
        name: 'Formas do Círculo',
        level: 2,
        description: 'As restrições de ND da sua Forma Selvagem aumentam. Você pode se transformar em uma besta com ND de até 1 (ignorando restrições de voo ou nado temporariamente se aplicar). A partir do 6º nível, você pode se transformar em uma besta com ND igual a seu nível de druida dividido por 3 (arredondado para baixo).',
        activation: 'none',
        requiresSubclass: 'Círculo da Lua'
      },
      {
        name: 'Truque Adicional (Círculo da Terra)',
        level: 2,
        description: 'Você aprende um truque de druida adicional à sua escolha.',
        activation: 'none',
        requiresSubclass: 'Círculo da Terra'
      },
      {
        name: 'Recuperação Natural',
        level: 2,
        description: 'Durante um descanso curto, você pode escolher recuperar espaços de magia gastos. O nível total somado dos espaços não pode ser maior que metade do seu nível de druida (arredondado para cima) e nenhum espaço pode ser de 6º nível ou superior. Requer um descanso longo para usar novamente.',
        activation: 'special',
        requiresSubclass: 'Círculo da Terra',
        resourceCost: { type: 'class_resource', name: 'recuperacao_natural', amount: 1 }
      }
    ],
    3: [],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      },
      {
        name: 'Forma Selvagem Melhorada (Nado)',
        level: 4,
        description: 'Você agora pode se transformar em criaturas com deslocamento de nado. O ND limite de criatura aumenta para 1/2.',
        activation: 'none'
      }
    ],
    5: [],
    6: [
      {
        name: 'Ataque Primitivo',
        level: 6,
        description: 'Seus ataques na forma de besta contam como mágicos com o propósito de ultrapassar resistência e imunidade a ataques não-mágicos.',
        activation: 'special',
        requiresSubclass: 'Círculo da Lua'
      },
      {
        name: 'Travessia da Terra',
        level: 6,
        description: 'Mover-se através de terreno difícil não-mágico não custa movimento extra. Você também passa por plantas não-mágicas sem sofrer dano ou ficar impedido, e tem vantagem em salvaguardas contra plantas criadas magicamente.',
        activation: 'none',
        requiresSubclass: 'Círculo da Terra'
      }
    ],
    7: [],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      },
      {
        name: 'Forma Selvagem Melhorada (Voo)',
        level: 8,
        description: 'Você agora pode se transformar em criaturas com deslocamento de voo. O ND limite de criatura aumenta para 1.',
        activation: 'none'
      }
    ],
    9: [],
    10: [
      {
        name: 'Forma Elemental',
        level: 10,
        description: 'Você pode gastar dois usos de Forma Selvagem ao mesmo tempo para se transformar em um Elemental da Água, do Ar, do Fogo ou da Terra.',
        activation: 'action',
        requiresSubclass: 'Círculo da Lua'
      },
      {
        name: 'Salvaguarda da Natureza',
        level: 10,
        description: 'Você não pode ser envenenado ou contrair doenças, e ganha imunidade a efeitos de medo e charme causados por fadas e elementais.',
        activation: 'none',
        requiresSubclass: 'Círculo da Terra'
      }
    ],
    11: [],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    13: [],
    14: [
      {
        name: 'Mil Formas',
        level: 14,
        description: 'Você pode conjurar a magia Alterar-se à vontade sem gastar espaços de magia.',
        activation: 'action',
        requiresSubclass: 'Círculo da Lua'
      },
      {
        name: 'Santuário da Natureza',
        level: 14,
        description: 'Criaturas do tipo besta ou planta devem realizar uma salvaguarda de Sabedoria contra a CD de suas magias se tentarem atacar você. Se falharem, devem escolher outro alvo ou perder o ataque.',
        activation: 'special',
        requiresSubclass: 'Círculo da Terra'
      }
    ],
    15: [],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [],
    18: [
      {
        name: 'Corpo Atemporal',
        level: 18,
        description: 'Para cada 10 anos que passarem, seu corpo envelhece apenas 1 ano fisicamente.',
        activation: 'none'
      },
      {
        name: 'Magia Bestial',
        level: 18,
        description: 'Você pode realizar os componentes somáticos e verbais de suas magias enquanto estiver em Forma Selvagem, mas ainda não pode prover componentes materiais.',
        activation: 'special'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Arquidruida',
        level: 20,
        description: 'Você pode usar sua Forma Selvagem um número ilimitado de vezes. Além disso, você ignora os componentes verbais e somáticos das suas magias, e os componentes materiais que não possuam custo em ouro e não sejam consumidos.',
        activation: 'special'
      }
    ]
  },
  Monge: {
    1: [
      {
        name: 'Defesa sem Armadura',
        level: 1,
        description: 'Enquanto não estiver usando nenhuma armadura e nem empunhando um escudo, sua Classe de Armadura será igual a 10 + modificador de Destreza + modificador de Sabedoria.',
        activation: 'none'
      },
      {
        name: 'Artes Marciais (d4)',
        level: 1,
        description: 'Você pode usar Destreza em vez de Força para ataques e dano de golpes desarmados e armas de monge. Seus golpes desarmados causam 1d4 de dano. Quando usa a ação de ataque com um golpe desarmado ou arma de monge, pode realizar um golpe desarmado como ação bônus.',
        activation: 'none'
      }
    ],
    2: [
      {
        name: 'Ki',
        level: 2,
        description: 'Seu treinamento permite que você controle a energia mística do ki. Você pode gastar pontos de ki para alimentar várias características (Rajada de Golpes, Defesa Paciente, Passo do Vento).',
        activation: 'none'
      },
      {
        name: 'Movimento sem Armadura (+3m)',
        level: 2,
        description: 'Seu deslocamento aumenta em 3 metros enquanto você não estiver usando armadura ou escudo.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Defletir Projéteis',
        level: 3,
        description: 'Você pode usar sua reação para defletir ou apanhar o projétil quando você é atingido por um ataque de arma à distância. O dano que você sofre do ataque é reduzido em 1d10 + seu modificador de Destreza + seu nível de monge. Se o dano for reduzido a 0, você pode apanhar o projétil e arremessá-lo gastando 1 ponto de Ki.',
        activation: 'reaction'
      },
      {
        name: 'Tradição Monástica',
        level: 3,
        description: 'Escolha uma tradição monástica que guiará seu treinamento.',
        activation: 'none',
        choices: ['Caminho da Mão Aberta', 'Caminho das Sombras', 'Caminho dos Quatro Elementos'],
        isSubclassChoice: true
      },
      {
        name: 'Técnica da Mão Aberta',
        level: 3,
        description: 'Ao atingir uma criatura com um dos ataques da sua Rajada de Golpes, você pode impose um dos seguintes efeitos no alvo: teste de salvaguarda de Destreza ou é derrubado; teste de salvaguarda de Força ou é empurrado até 4,5 metros de você; ou não pode realizar reações até o fim do seu próximo turno.',
        activation: 'special',
        requiresSubclass: 'Caminho da Mão Aberta'
      },
      {
        name: 'Artes das Sombras',
        level: 3,
        description: 'Você pode gastar 2 pontos de ki para conjurar Escuridão, Visão no Escuro, Passo Sem Pegadas ou Silêncio sem componentes materiais. Você também ganha o truque Ilusão Menor.',
        activation: 'action',
        requiresSubclass: 'Caminho das Sombras'
      },
      {
        name: 'Discípulo dos Elementos',
        level: 3,
        description: 'Você aprende disciplinas que canalizam seu ki. Você aprende a Sintonização Elemental e outra disciplina elemental de sua escolha. Pode gastar ki para simular magias como Mãos Queimadoras ou Onda Trovejante.',
        activation: 'special',
        requiresSubclass: 'Caminho dos Quatro Elementos'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      },
      {
        name: 'Queda Suave',
        level: 4,
        description: 'Você pode usar sua reação quando cair para reduzir o dano de queda sofrido por um valor igual a cinco vezes o seu nível de monge.',
        activation: 'reaction'
      }
    ],
    5: [
      {
        name: 'Ataque Extra',
        level: 5,
        description: 'Você pode atacar duas vezes, em vez de uma, sempre que realizar a ação de Ataque no seu turno.',
        activation: 'none'
      },
      {
        name: 'Ataque Atordoante',
        level: 5,
        description: 'Quando atingir outra criatura com um ataque de arma corpo-a-corpo, você pode gastar 1 ponto de ki para tentar um Ataque Atordoante. O alvo deve passar em uma salvaguarda de Constituição ou ficará atordoado até o fim do seu próximo turno.',
        activation: 'special'
      },
      {
        name: 'Artes Marciais (d6)',
        level: 5,
        description: 'O dado de dano das suas Artes Marciais aumenta para 1d6.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Golpes Empoderados por Ki',
        level: 6,
        description: 'Seus ataques desarmados contam como mágicos com o propósito de ultrapassar resistências e imunidades a ataques e danos não-mágicos.',
        activation: 'none'
      },
      {
        name: 'Integridade Corporal',
        level: 6,
        description: 'Como uma ação, você pode recuperar pontos de vida iguais a três vezes seu nível de monge. Você deve terminar um descanso longo antes de usar essa característica novamente.',
        activation: 'action',
        requiresSubclass: 'Caminho da Mão Aberta',
        resourceCost: { type: 'class_resource', name: 'integridade_corporal', amount: 1 }
      },
      {
        name: 'Passo das Sombras',
        level: 6,
        description: 'Quando estiver na penumbra ou escuridão, você pode se teleportar como ação bônus até 18m para outro ponto na penumbra/escuridão. Ganha vantagem no primeiro ataque corpo-a-corpo do turno.',
        activation: 'bonus_action',
        requiresSubclass: 'Caminho das Sombras'
      },
      {
        name: 'Disciplinas Elementais (6º Nível)',
        level: 6,
        description: 'Você aprende uma nova disciplina elemental de sua escolha (ex: Gongar da Cúpula ou Chicotada de Água).',
        activation: 'special',
        requiresSubclass: 'Caminho dos Quatro Elementos'
      },
      {
        name: 'Movimento sem Armadura (+4.5m)',
        level: 6,
        description: 'Seu bônus de deslocamento sem armadura aumenta para +4,5 metros.',
        activation: 'none'
      }
    ],
    7: [
      {
        name: 'Evasão',
        level: 7,
        description: 'Quando for alvo de um efeito que exija uma salvaguarda de Destreza para sofrer apenas metade do dano, você não sofre dano se passar, e apenas metade se falhar.',
        activation: 'none'
      },
      {
        name: 'Mente Serena',
        level: 7,
        description: 'Você pode usar sua ação para encerrar um efeito em si mesmo que esteja lhe causando enfeitiçado ou amedrontado.',
        activation: 'action'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Movimento sem Armadura Melhorado',
        level: 9,
        description: 'Você ganha a habilidade de mover-se ao longo de superfícies verticais e sobre líquidos no seu turno sem cair durante o movimento.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Pureza Corporal',
        level: 10,
        description: 'Sua maestria com o ki flutuante em seu corpo torna-o imune a doenças e venenos.',
        activation: 'none'
      },
      {
        name: 'Movimento sem Armadura (+6m)',
        level: 10,
        description: 'Seu bônus de deslocamento sem armadura aumenta para +6 metros.',
        activation: 'none'
      }
    ],
    11: [
      {
        name: 'Tranquilidade',
        level: 11,
        description: 'Ao terminar um descanso longo, você ganha o efeito da magia Santuário que dura até o início do seu próximo descanso longo (CD baseada em Sabedoria). O efeito se encerra se você atacar ou conjurar magia.',
        activation: 'special',
        requiresSubclass: 'Caminho da Mão Aberta'
      },
      {
        name: 'Manto de Sombras',
        level: 11,
        description: 'Quando estiver em penumbra ou escuridão, pode usar sua ação para ficar invisível até atacar, conjurar magia ou entrar em luz plena.',
        activation: 'action',
        requiresSubclass: 'Caminho das Sombras'
      },
      {
        name: 'Disciplinas Elementais (11º Nível)',
        level: 11,
        description: 'Você aprende uma nova disciplina elemental de sua escolha (ex: Chamas da Fênix ou Cavalgada do Vento).',
        activation: 'special',
        requiresSubclass: 'Caminho dos Quatro Elementos'
      },
      {
        name: 'Artes Marciais (d8)',
        level: 11,
        description: 'O dado de dano das suas Artes Marciais aumenta para 1d8.',
        activation: 'none'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    13: [
      {
        name: 'Língua do Sol e da Lua',
        level: 13,
        description: 'Você aprende a tocar o ki de outras mentes para que você compreenda todos os idiomas falados. Além disso, qualquer criatura que seja capaz de entender um idioma pode entender o que você fala.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Alma de Diamante',
        level: 14,
        description: 'Sua maestria com o ki concede a você proficiência em todas as salvaguardas. Adicionalmente, quando falhar em uma salvaguarda, você pode gastar 1 ponto de ki para rolar novamente e usar o novo resultado.',
        activation: 'special'
      },
      {
        name: 'Movimento sem Armadura (+7.5m)',
        level: 14,
        description: 'Seu bônus de deslocamento sem armadura aumenta para +7,5 metros.',
        activation: 'none'
      }
    ],
    15: [
      {
        name: 'Corpo Atemporal',
        level: 15,
        description: 'Seu ki sustenta você para que você não sofro os efeitos da velhice. Você não pode envelhecer magicamente. Além disso, você não precisa de comida ou água.',
        activation: 'none'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Palma Vibrante',
        level: 17,
        description: 'Quando atinge uma criatura com golpe desarmado, pode gastar 3 Ki para criar vibrações letais. Você pode forçar o teste como uma ação: salvaguarda de Constituição. Falha: reduz a 0 PV; Sucesso: sofre 10d10 de dano vibrante.',
        activation: 'special',
        requiresSubclass: 'Caminho da Mão Aberta'
      },
      {
        name: 'Oportunista',
        level: 17,
        description: 'Quando uma criatura a até 1,5m for atingida por ataque de outra criatura, você pode usar reação para atacar corpo-a-corpo o alvo.',
        activation: 'reaction',
        requiresSubclass: 'Caminho das Sombras'
      },
      {
        name: 'Disciplinas Elementais (17º Nível)',
        level: 17,
        description: 'Você aprende uma nova disciplina elemental de sua escolha (ex: Sopro de Inverno ou Rio de Famintos).',
        activation: 'special',
        requiresSubclass: 'Caminho dos Quatro Elementos'
      },
      {
        name: 'Artes Marciais (d10)',
        level: 17,
        description: 'O dado de dano das suas Artes Marciais aumenta para 1d10.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Corpo Vazio',
        level: 18,
        description: 'Você pode usar sua ação e gastar 4 pontos de ki para ficar invisível por 1 minuto, ganhando resistência a todos os danos exceto de força. Você também pode projetar-se astralmente gastando 8 pontos de ki.',
        activation: 'action'
      },
      {
        name: 'Movimento sem Armadura (+9m)',
        level: 18,
        description: 'Seu bônus de deslocamento sem armadura aumenta para +9 metros.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Auto-Perfeição',
        level: 20,
        description: 'Quando rolar a iniciativa e não possuir nenhum ponto de ki restante, você recupera 4 pontos de ki.',
        activation: 'special'
      }
    ]
  },
  Patrulheiro: {
    1: [
      {
        name: 'Inimigo Favorito',
        level: 1,
        description: 'Você escolhe um tipo de inimigo favorito: aberrantes, bestas, celestiais, construtos, dragões, elementais, feéricos, gigantes, corruptores, monstros, lodos, plantas ou mortos-vivos. Você ganha vantagem em testes de Sobrevivência para rastreá-los, inteligência para recordar informações sobre eles, e aprende um idioma falado por eles.',
        activation: 'none'
      },
      {
        name: 'Explorador Natural',
        level: 1,
        description: 'Você escolhe um tipo de terreno favorito: floresta, pântano, planície, montanha, deserto, colina, ártico ou subterrâneo. Dobra seu bônus de proficiência em testes de Inteligência e Sabedoria relacionados a esse terreno. Também ganha benefícios de viagem como não se perder, mover-se furtivamente no ritmo normal e encontrar o dobro de comida.',
        activation: 'none'
      }
    ],
    2: [
      {
        name: 'Estilo de Luta',
        level: 2,
        description: 'Você adota um estilo de combate particular como sua especialidade.',
        activation: 'none',
        choices: ['Arquearia', 'Defesa', 'Duelismo', 'Combate com Duas Armas']
      },
      {
        name: 'Conjuração (Patrulheiro)',
        level: 2,
        description: 'Você pode conjurar magias de patrulheiro usando Sabedoria como sua habilidade de conjuração. Você conhece um número limitado de magias da lista de patrulheiro.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Arquétipo de Patrulheiro',
        level: 3,
        description: 'Escolha um arquétipo de patrulheiro que definirá suas táticas de caça.',
        activation: 'none',
        choices: ['Caçador', 'Mestre das Feras'],
        isSubclassChoice: true
      },
      {
        name: 'Prontidão Primal',
        level: 3,
        description: 'Você pode usar sua ação e gastar um espaço de magia de patrulheiro para focar seus sentidos. Por 1 minuto por nível do espaço gasto, você detecta se há aberrações, celestiais, dragões, elementais, feéricos, corruptores ou mortos-vivos a até 1,5 km de você (ou 9 km no seu terreno favorito).',
        activation: 'action',
        resourceCost: { type: 'spell_slot', amount: 1 }
      },
      {
        name: 'Presa do Caçador',
        level: 3,
        description: 'Você ganha uma das seguintes características à sua escolha: Matador de Colossos (causa +1d8 de dano uma vez por turno em criatura ferida), Matador de Gigantes (usa reação para atacar criatura Grande ou maior que te ataque e erre), ou Quebrador de Hordas (faz outro ataque com a mesma arma contra criatura diferente a até 1,5m do alvo inicial).',
        activation: 'none',
        requiresSubclass: 'Caçador'
      },
      {
        name: 'Companheiro do Patrulheiro',
        level: 3,
        description: 'Você ganha um companheiro animal de tamanho Médio ou menor (ND 1/4 ou menor, como lobo, pantera, falcão). Ele obedece a seus comandos e age na sua iniciativa.',
        activation: 'none',
        requiresSubclass: 'Mestre das Feras'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Ataque Extra',
        level: 5,
        description: 'Você pode atacar duas vezes, ao invés de uma, sempre que usar a ação de Ataque no seu turno.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Inimigo Favorito Melhorado',
        level: 6,
        description: 'Você escolhe um tipo de inimigo favorito adicional e aprende outro idioma correspondente.',
        activation: 'none'
      },
      {
        name: 'Explorador Natural Melhorado',
        level: 6,
        description: 'Você escolhe um segundo tipo de terreno favorito.',
        activation: 'none'
      }
    ],
    7: [
      {
        name: 'Táticas Defensivas',
        level: 7,
        description: 'Você ganha uma das seguintes características à sua escolha: Escapar da Horda (ataques de oportunidade contra você têm desvantagem), Defesa Contra Ataques Múltiplos (+4 na CA contra ataques subsequentes da mesma criatura), ou Vontade de Aço (vantagem em testes de resistência contra ficar amedrontado).',
        activation: 'none',
        requiresSubclass: 'Caçador'
      },
      {
        name: 'Treinamento Excepcional',
        level: 7,
        description: 'No seu turno, se o seu companheiro animal não atacar, você pode usar uma ação bônus para ordenar que ele use Correr, Desengajar ou Ajudar. Os ataques da besta contam como mágicos.',
        activation: 'bonus_action',
        requiresSubclass: 'Mestre das Feras'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      },
      {
        name: 'Caminho da Terra',
        level: 8,
        description: 'Mover-se através de terreno difícil não-mágico não custa movimento extra. Você também passa por plantas não-mágicas sem sofrer dano ou ficar impedido, e tem vantagem em salvaguardas contra plantas criadas magicamente.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Mimetismo na Natureza',
        level: 10,
        description: 'Você pode passar 1 minuto criando camuflagem em si mesmo. Ganha +10 em testes de Furtividade enquanto permanecer imóvel contra uma parede ou árvore.',
        activation: 'special'
      },
      {
        name: 'Explorador Natural Adicional',
        level: 10,
        description: 'Você escolhe um terceiro tipo de terreno favorito.',
        activation: 'none'
      }
    ],
    11: [
      {
        name: 'Ataque Múltiplo',
        level: 11,
        description: 'Você ganha uma das seguintes características à sua escolha: Salva de Flechas (faz ataques à distância contra qualquer número de criaturas a até 3m de um ponto) ou Ataque em Turbilhão (faz ataques corpo-a-corpo contra qualquer número de criaturas a até 1,5m).',
        activation: 'action',
        requiresSubclass: 'Caçador'
      },
      {
        name: 'Fúria Bestial',
        level: 11,
        description: 'Quando você ordena que seu companheiro animal use a ação de Ataque, ele pode fazer dois ataques.',
        activation: 'none',
        requiresSubclass: 'Mestre das Feras'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Desaparecer',
        level: 14,
        description: 'Você pode usar la ação de Esconder-se como uma ação bônus no seu turno. Além disso, não pode ser rastreado por meios não-mágicos, a menos que decida deixar rastros.',
        activation: 'bonus_action'
      },
      {
        name: 'Inimigo Favorito Adicional',
        level: 14,
        description: 'Você escolhe um terceiro tipo de inimigo favorito e aprende outro idioma correspondente.',
        activation: 'none'
      }
    ],
    15: [
      {
        name: 'Defesa de Caçador Superior',
        level: 15,
        description: 'Você ganha uma das seguintes características à sua escolha: Evasão (não sofre dano ao passar em testes de Destreza), Esquiva Sobrenatural (usa reação para reduzir dano de um ataque pela metade), ou Ficar de Pé contra a Maré (quando ataque corpo-a-corpo te erra, usa reação para fazer o atacante atingir criatura adjacente à sua escolha).',
        activation: 'none',
        requiresSubclass: 'Caçador'
      },
      {
        name: 'Conjurar Compartilhado',
        level: 15,
        description: 'Sempre que você conjurar uma magia com alvo em você mesmo, ela também afeta seu companheiro animal se ele estiver a até 9 metros de você.',
        activation: 'special',
        requiresSubclass: 'Mestre das Feras'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Sentidos Ferais',
        level: 18,
        description: 'Quando ataca criatura que não pode ver, você não tem desvantagem na jogada. Você sabe a localização de qualquer criatura invisível a até 9 metros de você.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Matador de Inimigos',
        level: 20,
        description: 'Uma vez em cada um de seus turnos, você pode adicionar seu modificador de Sabedoria na jogada de ataque ou de dano contra um de seus inimigos favoritos.',
        activation: 'special'
      }
    ]
  },
  Ladino: {
    1: [
      {
        name: 'Ataque Furtivo (1d6)',
        level: 1,
        description: 'Uma vez por turno, você pode causar 1d6 de dano extra a uma criatura que atingir com um ataque se tiver vantagem na jogada. O ataque deve usar uma arma de acuidade (finesse) ou à distância. Você não precisa de vantagem se outro inimigo do alvo estiver a até 1,5m dele, o inimigo não estiver incapacitado e você não tiver desvantagem na jogada.',
        activation: 'special'
      },
      {
        name: 'Especialização',
        level: 1,
        description: 'Escolha duas de suas perícias proficientes, ou uma perícia e sua proficiência com ferramentas de ladrão. Seu bônus de proficiência é duplicado para qualquer teste de habilidade que você fizer usando qualquer uma das proficiências escolhidas.',
        activation: 'none'
      },
      {
        name: 'Gíria de Ladrão',
        level: 1,
        description: 'Você aprendeu a gíria de ladrão, uma mistura secreta de dialetos, jargões e códigos que permite ocultar mensagens em conversas aparentemente normais.',
        activation: 'none'
      }
    ],
    2: [
      {
        name: 'Ação Astuta',
        level: 2,
        description: 'Você pode realizar uma ação bônus em cada um de seus turnos em combate. Esta ação pode ser usada apenas para Correr, Desengajar ou Esconder-se.',
        activation: 'bonus_action'
      }
    ],
    3: [
      {
        name: 'Arquétipo de Ladino',
        level: 3,
        description: 'Você escolhe um arquétipo que se assemelha ao seu estilo de ladinagem.',
        activation: 'none',
        choices: ['Ladrão', 'Assassino', 'Trapaceiro Arcano'],
        isSubclassChoice: true
      },
      {
        name: 'Ataque Furtivo (2d6)',
        level: 3,
        description: 'Seu dano de Ataque Furtivo aumenta para 2d6.',
        activation: 'special'
      },
      {
        name: 'Mãos Rápidas',
        level: 3,
        description: 'Você pode usar a ação bônus concedida pela sua Ação Astuta para fazer um teste de Destreza (Prestidigitação), usar suas ferramentas de ladrão para desarmar uma armadilha ou abrir uma fechadura, ou realizar a ação de Usar um Objeto.',
        activation: 'none',
        requiresSubclass: 'Ladrão'
      },
      {
        name: 'Trabalho no Segundo Andar',
        level: 3,
        description: 'Escalar não custa mais movimento extra. Além disso, quando você fizer um salto em distância correndo, a distância que você pode saltar aumenta em um número de metros igual a 30cm vezes o seu modificador de Destreza.',
        activation: 'none',
        requiresSubclass: 'Ladrão'
      },
      {
        name: 'Proficiências Bônus (Assassino)',
        level: 3,
        description: 'Você ganha proficiência com o kit de disfarce e o kit de venenos.',
        activation: 'none',
        requiresSubclass: 'Assassino'
      },
      {
        name: 'Assassinar',
        level: 3,
        description: 'Você tem vantagem em jogadas de ataque contra qualquer criatura que ainda não tenha realizado um turno no combate. Além disso, qualquer ataque que você atingir em uma criatura surpresa é um acerto crítico.',
        activation: 'special',
        requiresSubclass: 'Assassino'
      },
      {
        name: 'Mãos Mágicas Trapaceiras',
        level: 3,
        description: 'Quando conjura Mãos Mágicas, você pode tornar a mão espectral invisível e realizar tarefas adicionais (guardar/retirar item de outro personagem, usar ferramentas de ladrão à distância).',
        activation: 'special',
        requiresSubclass: 'Trapaceiro Arcano'
      },
      {
        name: 'Conjuração (Trapaceiro Arcano)',
        level: 3,
        description: 'Você ganha a habilidade de conjurar magias baseadas em Inteligência de Mago.',
        activation: 'none',
        requiresSubclass: 'Trapaceiro Arcano'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Ataque Furtivo (3d6)',
        level: 5,
        description: 'Seu dano de Ataque Furtivo aumenta para 3d6.',
        activation: 'special'
      },
      {
        name: 'Esquiva Sobrenatural',
        level: 5,
        description: 'Quando um atacante que você pode ver atinge você com um ataque, você pode usar sua reação para reduzir o dano do ataque pela metade.',
        activation: 'reaction'
      }
    ],
    6: [
      {
        name: 'Especialização Adicional',
        level: 6,
        description: 'Escolha mais duas de suas proficiências (perícias ou ferramentas de ladrão) para ganhar Especialização.',
        activation: 'none'
      }
    ],
    7: [
      {
        name: 'Ataque Furtivo (4d6)',
        level: 7,
        description: 'Seu dano de Ataque Furtivo aumenta para 4d6.',
        activation: 'special'
      },
      {
        name: 'Evasão',
        level: 7,
        description: 'Quando você for alvo de um efeito que exige uma salvaguarda de Destreza para sofrer apenas metade do dano, você não sofre dano se passar, e apenas metade se falhar.',
        activation: 'none'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Ataque Furtivo (5d6)',
        level: 9,
        description: 'Seu dano de Ataque Furtivo aumenta para 5d6.',
        activation: 'special'
      },
      {
        name: 'Furtividade Suprema',
        level: 9,
        description: 'Você tem vantagem em testes de Destreza (Furtividade) se não se mover mais do que a metade do seu deslocamento em seu turno.',
        activation: 'none',
        requiresSubclass: 'Ladrão'
      },
      {
        name: 'Especialista em Infiltração',
        level: 9,
        description: 'Você pode criar falsas identidades para si mesmo. Você deve gastar 7 dias e 25 po para estabelecer a história, roupas e disfarces da identidade.',
        activation: 'special',
        requiresSubclass: 'Assassino'
      },
      {
        name: 'Emboscada Mágica',
        level: 9,
        description: 'Se você estiver escondido de uma criatura ao conjurar uma magia nela, a criatura tem desvantagem em qualquer salvaguarda contra essa magia neste turno.',
        activation: 'special',
        requiresSubclass: 'Trapaceiro Arcano'
      }
    ],
    10: [
      {
        name: 'Incremento no Valor de Habilidade Extra',
        level: 10,
        description: 'Como ladino, você ganha um incremento no valor de habilidade extra no 10º nível (Aumente um atributo em 2, ou dois atributos em 1).',
        activation: 'none'
      }
    ],
    11: [
      {
        name: 'Ataque Furtivo (6d6)',
        level: 11,
        description: 'Seu dano de Ataque Furtivo aumenta para 6d6.',
        activation: 'special'
      },
      {
        name: 'Talento Confiável',
        level: 11,
        description: 'Sempre que fizer um teste de habilidade que permita adicionar seu bônus de proficiência (incluindo perícias com Especialização), trate qualquer resultado de d20 menor que 10 como um 10.',
        activation: 'none'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    13: [
      {
        name: 'Ataque Furtivo (7d6)',
        level: 13,
        description: 'Seu dano de Ataque Furtivo aumenta para 7d6.',
        activation: 'special'
      },
      {
        name: 'Usar Dispositivo Mágico',
        level: 13,
        description: 'Você ignora todas as exigências de classe, raça e nível para o uso de itens mágicos.',
        activation: 'none',
        requiresSubclass: 'Ladrão'
      },
      {
        name: 'Impostor',
        level: 13,
        description: 'Você ganha a habilidade de mimetizar a escrita, voz e comportamento de outra pessoa após observá-la por 3 horas.',
        activation: 'special',
        requiresSubclass: 'Assassino'
      },
      {
        name: 'Trapaça Versátil',
        level: 13,
        description: 'Você ganha a habilidade de usar sua Ação Astuta para distrair alvos usando sua Mão Mágica, ganhando vantagem em jogadas de ataque contra o alvo distraído.',
        activation: 'bonus_action',
        requiresSubclass: 'Trapaceiro Arcano'
      }
    ],
    14: [
      {
        name: 'Sensibilidade Cega',
        level: 14,
        description: 'Se você puder ouvir, você sabe a localização de qualquer criatura oculta ou invisível a até 3 metros de você.',
        activation: 'none'
      }
    ],
    15: [
      {
        name: 'Ataque Furtivo (8d6)',
        level: 15,
        description: 'Seu dano de Ataque Furtivo aumenta para 8d6.',
        activation: 'special'
      },
      {
        name: 'Mente Escorregadia',
        level: 15,
        description: 'Você ganha proficiência em testes de resistência de Sabedoria.',
        activation: 'none'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Ataque Furtivo (9d6)',
        level: 17,
        description: 'Seu dano de Ataque Furtivo aumenta para 9d6.',
        activation: 'special'
      },
      {
        name: 'Reflexos de Ladrão',
        level: 17,
        description: 'Você pode realizar dois turnos no primeiro ciclo de qualquer combate. Você faz seu primeiro turno com sua iniciativa normal e seu segundo turno com sua iniciativa -10. Você não ganha esse benefício se estiver surpreso.',
        activation: 'none',
        requiresSubclass: 'Ladrão'
      },
      {
        name: 'Golpe da Morte',
        level: 17,
        description: 'Quando você atinge e causa dano a uma criatura que está surpresa, ela deve passar em um teste de resistência de Constituição (CD 8 + mod de DES + Prof). Se falhar, o dano do ataque é dobrado.',
        activation: 'special',
        requiresSubclass: 'Assassino'
      },
      {
        name: 'Ladrão de Magia',
        level: 17,
        description: 'Ao ser alvo de uma magia, você pode usar sua reação para forçar o conjurador a fazer um teste de salvaguarda. Se falhar, você anula o efeito e rouba o conhecimento da magia por 8 horas.',
        activation: 'reaction',
        requiresSubclass: 'Trapaceiro Arcano'
      }
    ],
    18: [
      {
        name: 'Elusivo',
        level: 18,
        description: 'Você se torna tão evasivo que nenhuma jogada de ataque tem vantagem contra você enquanto você não estiver incapacitado.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Ataque Furtivo (10d6)',
        level: 19,
        description: 'Seu dano de Ataque Furtivo aumenta para 10d6.',
        activation: 'special'
      },
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Golpe de Sorte',
        level: 20,
        description: 'Se você errar um ataque no seu turno, ou falhar em um teste de habilidade, você pode transformar o erro em acerto ou a falha em sucesso automático. Você recupera o uso desta habilidade após um descanso curto ou longo.',
        activation: 'special'
      }
    ]
  },
  Feiticeiro: {
    1: [
      {
        name: 'Origem Feiticeira',
        level: 1,
        description: 'Sua origem feiticeira descreve a fonte do seu poder mágico inato. Ela concede características no 1º nível, e novamente no 6º, 14º e 18º níveis.',
        activation: 'none',
        choices: ['Linhagem Dracônica', 'Magia Selvagem'],
        isSubclassChoice: true
      },
      {
        name: 'Conjuração (Feiticeiro)',
        level: 1,
        description: 'Você pode conjurar magias de feiticeiro. Seu atributo de conjuração é Carisma.',
        activation: 'none'
      },
      {
        name: 'Ancestral Dragão',
        level: 1,
        description: 'Você escolhe um tipo de dragão como seu ancestral. O tipo de dano associado a ele é usado por outras características de classe.',
        activation: 'none',
        requiresSubclass: 'Linhagem Dracônica'
      },
      {
        name: 'Resiliência Dracônica',
        level: 1,
        description: 'Seus pontos de vida máximos aumentam em 1 no 1º nível e em 1 para cada nível de feiticeiro subsequente. Além disso, quando não estiver usando armadura, sua CA é igual a 13 + seu modificador de Destreza.',
        activation: 'none',
        requiresSubclass: 'Linhagem Dracônica'
      },
      {
        name: 'Surto de Magia Selvagem',
        level: 1,
        description: 'Suas magias podem liberar surtos caóticos de magia selvagem. Imediatamente após conjurar uma magia de feiticeiro de 1º nível ou superior, o Mestre pode exigir que você role um d20. Se rolar um 1, role na tabela de Surtos de Magia Selvagem.',
        activation: 'none',
        requiresSubclass: 'Magia Selvagem'
      },
      {
        name: 'Marés do Caos',
        level: 1,
        description: 'Você pode manipular as forças do acaso para ganhar vantagem em uma jogada de ataque, teste de atributo ou salvaguarda. Você deve terminar um descanso longo para usar essa característica novamente.',
        activation: 'special',
        resourceCost: { type: 'class_resource', name: 'mares_do_caos', amount: 1 },
        requiresSubclass: 'Magia Selvagem'
      }
    ],
    2: [
      {
        name: 'Fonte de Magia',
        level: 2,
        description: 'Você ganha acesso a uma fonte de energia mágica representada por Pontos de Feitiçaria. Você pode usá-los para criar espaços de magia ou converter espaços de magia em Pontos de Feitiçaria.',
        activation: 'none',
        resourceCost: { type: 'class_resource', name: 'pontos_feiticaria', amount: 0 }
      }
    ],
    3: [
      {
        name: 'Metamagia',
        level: 3,
        description: 'Você adquire a habilidade de moldar suas magias de acordo com suas necessidades. Você escolhe duas opções de Metamagia (ex: Magia Acelerada, Magia Duplicada, Magia Sutil). Você ganha opções adicionais nos níveis 10 e 17.',
        activation: 'none'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Afinidade Elemental',
        level: 6,
        description: 'Quando você conjura uma magia que causa o tipo de dano associado ao seu ancestral dragão, você adiciona seu modificador de Carisma ao dano. Além disso, você pode gastar 1 ponto de feitiçaria para ganhar resistência a esse tipo de dano por 1 hora.',
        activation: 'special',
        requiresSubclass: 'Linhagem Dracônica'
      },
      {
        name: 'Dobrar a Sorte',
        level: 6,
        description: 'Você ganha a habilidade de torcer o destino. Quando outra criatura fizer uma jogada de ataque, teste de habilidade ou salvaguarda, você pode gastar 2 pontos de feitiçaria como reação para rolar 1d4 e aplicar o resultado como bônus ou penalidade na jogada.',
        activation: 'reaction',
        requiresSubclass: 'Magia Selvagem'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Metamagia Adicional',
        level: 10,
        description: 'Você escolhe uma opção adicional de Metamagia.',
        activation: 'none'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Asas Dracônicas',
        level: 14,
        description: 'Você ganha a habilidade de manifestar um par de asas de dragão em suas costas, ganhando velocidade de voo igual ao seu deslocamento terrestre.',
        activation: 'none',
        requiresSubclass: 'Linhagem Dracônica'
      },
      {
        name: 'Caos Controlado',
        level: 14,
        description: 'Você ganha um controle parcial sobre seus surtos de magia selvagem. Sempre que você rolar na tabela de Surtos de Magia Selvagem, você pode rolar duas vezes e usar qualquer um dos resultados.',
        activation: 'none',
        requiresSubclass: 'Magia Selvagem'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Metamagia Adicional',
        level: 17,
        description: 'Você escolhe uma opção adicional de Metamagia.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Presença Dracônica',
        level: 18,
        description: 'Você pode gastar 5 pontos de feitiçaria como uma ação para canalizar a presença do seu ancestral dragão, forçando criaturas a até 18 metros a ficarem amedrontadas ou enfeitadas (CD salvaguarda de Carisma).',
        activation: 'action',
        requiresSubclass: 'Linhagem Dracônica'
      },
      {
        name: 'Bombardeio de Magias',
        level: 18,
        description: 'Quando você rola o dano de uma magia e obtém o valor máximo em um dos dados, você pode rolar aquele dado novamente e adicioná-lo ao dano total (limite de um dado adicional por magia).',
        activation: 'special',
        requiresSubclass: 'Magia Selvagem'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Restauração de Feiticeiro',
        level: 20,
        description: 'Você recupera 4 pontos de feitiçaria gastos sempre que terminar um descanso curto.',
        activation: 'none'
      }
    ]
  },
  Bruxo: {
    1: [
      {
        name: 'Patrono Transcendental',
        level: 1,
        description: 'Você escolhe um patrono transcendental que define a natureza do seu pacto: O Corruptor, O Arquifada ou O Grande Antigo.',
        activation: 'none',
        choices: ['O Corruptor', 'O Arquifada', 'O Grande Antigo'],
        isSubclassChoice: true
      },
      {
        name: 'Magia do Pacto',
        level: 1,
        description: 'Sua pesquisa arcana e magia concedida por seu patrono dão a você a habilidade de conjurar magias. Suas magias usam Carisma como habilidade de conjuração. Seus espaços de magia são recuperados com um descanso curto e são sempre conjurados no maior nível de círculo possível para seu nível.',
        activation: 'none'
      },
      {
        name: 'Bênção do Submundo',
        level: 1,
        description: 'Ao reduzir uma criatura hostil a 0 pontos de vida, você ganha pontos de vida temporários iguais ao seu modificador de Carisma + seu nível de bruxo (mínimo de 1).',
        activation: 'none',
        requiresSubclass: 'O Corruptor'
      },
      {
        name: 'Presença Feérica',
        level: 1,
        description: 'Como uma ação, você pode forçar cada criatura em um cubo de 3 metros a partir de você a realizar uma salvaguarda de Sabedoria contra a CD da sua magia. Se falharem, ficam encantadas ou amedrontadas por você até o final do seu próximo turno. Recuperável com descanso curto ou longo.',
        activation: 'action',
        requiresSubclass: 'O Arquifada'
      },
      {
        name: 'Despertar da Mente',
        level: 1,
        description: 'Você pode se comunicar telepaticamente com qualquer criatura que possa ver a até 9 metros de você. Você não precisa compartilhar um idioma, mas a criatura deve ser capaz de compreender pelo menos um idioma.',
        activation: 'none',
        requiresSubclass: 'O Grande Antigo'
      }
    ],
    2: [
      {
        name: 'Invocações Místicas',
        level: 2,
        description: 'Você descobre invocações místicas, fragmentos de conhecimento proibido que concedem a você capacidades mágicas permanentes. Você conhece duas invocações místicas à sua escolha.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Dádiva do Pacto',
        level: 3,
        description: 'Seu patrono concede a você um prêmio por seus serviços leais. Escolha uma das dádivas: Pacto da Corrente (invocar familiar especial), Pacto da Lâmina (criar arma de pacto mágica) ou Pacto do Tomo (livro de sombras com 3 truques adicionais).',
        activation: 'none',
        choices: ['Pacto da Corrente', 'Pacto da Lâmina', 'Pacto do Tomo']
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Invocação Mística Adicional',
        level: 5,
        description: 'Você aprende uma nova invocação mística (3 no total).',
        activation: 'none'
      }
    ],
    6: [
      {
        name: 'Resiliência do Submundo',
        level: 6,
        description: 'Você pode escolher um tipo de dano ao finalizar um descanso curto ou longo. Você ganha resistência a esse tipo de dano até escolher outro com esta habilidade.',
        activation: 'none',
        requiresSubclass: 'O Corruptor'
      },
      {
        name: 'Defesa Feérica',
        level: 6,
        description: 'Quando você sofrer dano, você pode usar sua reação para ficar invisível e se teleportar até 18 metros para um espaço desocupado que possa ver. Fica invisível até o início do seu próximo turno. 1 uso por descanso curto/longo.',
        activation: 'reaction',
        requiresSubclass: 'O Arquifada'
      },
      {
        name: 'Salvaguarda Entrópica',
        level: 6,
        description: 'Quando uma criatura fizer uma jogada de ataque contra você, você pode usar sua reação para impor desvantagem nessa jogada. Se o ataque errar, sua próxima jogada de ataque contra essa criatura tem vantagem. 1 uso por descanso curto/longo.',
        activation: 'reaction',
        requiresSubclass: 'O Grande Antigo'
      }
    ],
    7: [
      {
        name: 'Invocação Mística Adicional',
        level: 7,
        description: 'Você aprende uma nova invocação mística (4 no total).',
        activation: 'none'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Invocação Mística Adicional',
        level: 9,
        description: 'Você aprende uma nova invocação mística (5 no total).',
        activation: 'none'
      }
    ],
    10: [
      {
        name: 'Fortuna do Submundo',
        level: 10,
        description: 'Ao fazer um teste de habilidade ou salvaguarda, você pode adicionar 1d10 ao resultado. Você pode usar esta característica depois de ver a rolagem inicial, mas antes de saber se passou ou falhou. 1 uso por descanso curto ou longo.',
        activation: 'special',
        requiresSubclass: 'O Corruptor',
        resourceCost: { type: 'class_resource', name: 'fortuna_submundo', amount: 1 }
      },
      {
        name: 'Mente Feérica',
        level: 10,
        description: 'Você é imune a ser encantado, e quando outra criatura tenta encantar você, você pode usar sua reação para tentar voltar o efeito contra ela.',
        activation: 'reaction',
        requiresSubclass: 'O Arquifada'
      },
      {
        name: 'Escudo de Pensamentos',
        level: 10,
        description: 'Sua mente não pode ser lida por meios mágicos a menos que você permita. Você ganha resistência a dano psíquico, e quando sofrer dano psíquico, quem causou o dano sofre a mesma quantidade.',
        activation: 'none',
        requiresSubclass: 'O Grande Antigo'
      }
    ],
    11: [
      {
        name: 'Arcanum Místico (6º Nível)',
        level: 11,
        description: 'Seu patrono concede a você um segredo mágico chamado arcanum. Escolha uma magia de 6º nível da lista de bruxo. Você pode conjurar essa magia uma vez sem gastar espaços de magia. Recuperável com descanso longo.',
        activation: 'special',
        resourceCost: { type: 'class_resource', name: 'arcanum_6', amount: 1 }
      }
    ],
    12: [
      {
        name: 'Invocação Mística Adicional',
        level: 12,
        description: 'Você aprende uma nova invocação mística (6 no total).',
        activation: 'none'
      },
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    13: [
      {
        name: 'Arcanum Místico (7º Nível)',
        level: 13,
        description: 'Escolha uma magia de 7º nível da lista de bruxo como arcanum. Você pode conjurar essa magia uma vez sem gastar espaços de magia. Recuperável com descanso longo.',
        activation: 'special',
        resourceCost: { type: 'class_resource', name: 'arcanum_7', amount: 1 }
      }
    ],
    14: [
      {
        name: 'Lançar no Inferno',
        level: 14,
        description: 'Ao acertar uma criatura com um ataque, você pode transportar instantaneamente o alvo através dos planos inferiores. O alvo desaparece até o final do seu próximo turno. Quando ele retorna, sofre 10d10 de dano psíquico (a menos que seja um corruptor). 1 uso por descanso longo.',
        activation: 'special',
        requiresSubclass: 'O Corruptor',
        resourceCost: { type: 'class_resource', name: 'lancar_inferno', amount: 1 }
      },
      {
        name: 'Espiral Nebulosa',
        level: 14,
        description: 'Você ganha a habilidade de entrar no plano feérico temporariamente. Como uma ação, você pode conjurar a magia Passo Nebuloso à vontade, sem gastar espaços de magia, e sempre que fizer isso você pode desferir um efeito de enfeitiçar/amedrontar nos inimigos ao redor.',
        activation: 'action',
        requiresSubclass: 'O Arquifada'
      },
      {
        name: 'Criar Cria',
        level: 14,
        description: 'Você pode usar sua ação para tocar um humanoide incapacitado. Essa criatura fica encantada por você até ser alvo de uma magia Remover Maldição, ou até você usar essa habilidade de novo. Você pode se comunicar telepaticamente com ela.',
        activation: 'action',
        requiresSubclass: 'O Grande Antigo'
      }
    ],
    15: [
      {
        name: 'Invocação Mística Adicional',
        level: 15,
        description: 'Você aprende uma nova invocação mística (7 no total).',
        activation: 'none'
      },
      {
        name: 'Arcanum Místico (8º Nível)',
        level: 15,
        description: 'Escolha uma magia de 8º nível da lista de bruxo como arcanum. Você pode conjurar essa magia uma vez sem gastar espaços de magia. Recuperável com descanso longo.',
        activation: 'special',
        resourceCost: { type: 'class_resource', name: 'arcanum_8', amount: 1 }
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    17: [
      {
        name: 'Arcanum Místico (9º Nível)',
        level: 17,
        description: 'Escolha uma magia de 9º nível da lista de bruxo como arcanum. Você pode conjurar essa magia uma vez sem gastar espaços de magia. Recuperável com descanso longo.',
        activation: 'special',
        resourceCost: { type: 'class_resource', name: 'arcanum_9', amount: 1 }
      }
    ],
    18: [
      {
        name: 'Invocação Mística Adicional',
        level: 18,
        description: 'Você aprende uma nova invocação mística (8 no total).',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Senhor Místico',
        level: 20,
        description: 'Você pode gastar 1 minuto implorando ao seu patrono para recuperar todos os seus espaços de magia gastos da sua característica Magia do Pacto. 1 uso por descanso longo.',
        activation: 'special',
        resourceCost: { type: 'class_resource', name: 'senhor_mistico', amount: 1 }
      }
    ]
  },
  Artífice: {
    1: [
      {
        name: 'Conjuração (Artífice)',
        level: 1,
        description: 'Você sabe como conjurar magias usando ferramentas como foco de conjuração. Seu atributo de conjuração é Inteligência.',
        activation: 'none'
      },
      {
        name: 'Engenhoqueiro',
        level: 1,
        description: 'Você pode imbuir uma propriedade mágica em um objeto miúdo não mágico tocando-o (emitir luz, tocar som gravado, emitir odor ou exibir efeito visual).',
        activation: 'action'
      }
    ],
    2: [
      {
        name: 'Infundir Itens',
        level: 2,
        description: 'Você ganha a habilidade de transformar itens mundanos em itens mágicos. Você conhece 4 infusões e pode infundir até 2 itens por dia.',
        activation: 'none'
      }
    ],
    3: [
      {
        name: 'Especialista em Artilharia',
        level: 3,
        description: 'Escolha uma especialidade de artífice: Alquimista ou Armeiro.',
        activation: 'none',
        choices: ['Alquimista', 'Armeiro'],
        isSubclassChoice: true
      },
      {
        name: 'Especialista em Ferramentas',
        level: 3,
        description: 'Seu bônus de proficiência é dobrado para qualquer teste de habilidade usando ferramentas com as quais possua proficiência.',
        activation: 'none'
      },
      {
        name: 'Elixir Experimental',
        level: 3,
        description: 'Ao fim de um descanso longo, você pode criar elixires experimentais em frascos vazios. 1 elixir gratuito por dia (gaste espaço de magia para criar adicionais). Cada elixir concede um efeito benéfico aleatório ou escolhido (Cura, Rapidez, Resiliência, etc).',
        activation: 'action',
        requiresSubclass: 'Alquimista',
        resourceCost: { type: 'class_resource', name: 'elixir_experimental', amount: 1 }
      },
      {
        name: 'Armadura Arcana',
        level: 3,
        description: 'Você pode transformar um conjunto de armadura pesada ou média em uma Armadura Arcana, que se acopla a você, ignora requisitos de Força, serve como foco de conjuração e não pode ser removida contra sua vontade.',
        activation: 'action',
        requiresSubclass: 'Armeiro'
      },
      {
        name: 'Modelo de Armadura',
        level: 3,
        description: 'Escolha um modelo para sua Armadura Arcana: Guardião (foco em combate corpo-a-corpo e defesa) ou Infiltrador (foco em velocidade e ataques à distância). Pode mudar o modelo ao fim de descansos.',
        activation: 'none',
        requiresSubclass: 'Armeiro'
      }
    ],
    4: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 4,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    5: [
      {
        name: 'Sábio Alquímico',
        level: 5,
        description: 'Adicione seu modificador de Inteligência a rolagens de cura ou rolagens de dano de fogo, ácido, necrótico ou veneno de suas magias.',
        activation: 'special',
        requiresSubclass: 'Alquimista'
      },
      {
        name: 'Ataque Extra (Armeiro)',
        level: 5,
        description: 'Você pode atacar duas vezes, ao invés de uma, sempre que usar a ação de Ataque no seu turno.',
        activation: 'none',
        requiresSubclass: 'Armeiro'
      }
    ],
    6: [
      {
        name: 'Ferramentas de Qualquer Coisa',
        level: 6,
        description: 'Você pode criar magicamente um conjunto de ferramentas de artesão necessárias em um espaço desocupado a até 1,5m. Requer 1 hora de trabalho.',
        activation: 'special'
      },
      {
        name: 'Infundir Itens Adicional (6/3)',
        level: 6,
        description: 'Você agora conhece 6 infusões e pode manter até 3 itens infundidos ativos simultaneamente.',
        activation: 'none'
      }
    ],
    7: [
      {
        name: 'Lampejo de Genialidade',
        level: 7,
        description: 'Quando você ou outra criatura que você possa ver a até 9 metros fizer um teste de habilidade ou salvaguarda, você pode usar sua reação para adicionar seu modificador de Inteligência ao teste.',
        activation: 'reaction'
      }
    ],
    8: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 8,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    9: [
      {
        name: 'Restaurativo Corretivo',
        level: 9,
        description: 'Criaturas que beberem seu Elixir Experimental ganham PV temporários igual a 2d6 + mod. INT. Você também pode conjurar Restauração Menor sem gastar slots de magia.',
        activation: 'special',
        requiresSubclass: 'Alquimista'
      },
      {
        name: 'Modificações de Armadura',
        level: 9,
        description: 'Sua Armadura Arcana agora conta como peças separadas para infusão (peitoral, botas, elmo, arma especial). Seu limite de itens infundidos aumenta em +2 (apenas na Armadura).',
        activation: 'none',
        requiresSubclass: 'Armeiro'
      }
    ],
    10: [
      {
        name: 'Adepto em Itens Mágicos',
        level: 10,
        description: 'Você pode sintonizar até 4 itens mágicos ao mesmo tempo. Fabricar itens mágicos comuns ou incomuns custa 1/4 do tempo e metade do ouro.',
        activation: 'none'
      },
      {
        name: 'Infundir Itens Adicional (8/4)',
        level: 10,
        description: 'Você agora conhece 8 infusões e pode manter até 4 itens infundidos ativos simultaneamente.',
        activation: 'none'
      }
    ],
    11: [
      {
        name: 'Item Estocado com Magia',
        level: 11,
        description: 'Você pode armazenar uma magia de 1º ou 2º nível (tempo de conjuração 1 ação) em uma arma ou foco de conjuração. Uma criatura pode usar uma ação para conjurar essa magia usando sua Inteligência. Usos = 2x mod. INT.',
        activation: 'special'
      }
    ],
    12: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 12,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    14: [
      {
        name: 'Sábio em Itens Mágicos',
        level: 14,
        description: 'Você pode sintonizar até 5 itens mágicos. Você ignora todos os requisitos de classe, raça, tendência e nível para usar e sintonizar itens mágicos.',
        activation: 'none'
      },
      {
        name: 'Infundir Itens Adicional (10/5)',
        level: 14,
        description: 'Você agora conhece 10 infusões e pode manter até 5 itens infundidos ativos simultaneamente.',
        activation: 'none'
      }
    ],
    15: [
      {
        name: 'Maestria Química',
        level: 15,
        description: 'Você ganha resistência a dano de ácido e veneno, e imunidade à condição envenenado. Você pode conjurar Restauração Maior e curar doenças 1 vez por descanso longo sem gastar slots.',
        activation: 'special',
        requiresSubclass: 'Alquimista'
      },
      {
        name: 'Segurança Perfeita',
        level: 15,
        description: 'Sua Armadura Arcana ganha melhorias massivas: Guardião causa desvantagem em ataques do inimigo e permite puxar criatura; Infiltrador causa dano elétrico extra e concede vantagem contra o alvo.',
        activation: 'special',
        requiresSubclass: 'Armeiro'
      }
    ],
    16: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 16,
        description: 'Aumente um atributo em 2, ou dois em 1.',
        activation: 'none'
      }
    ],
    18: [
      {
        name: 'Mestre em Itens Mágicos',
        level: 18,
        description: 'Você pode sintonizar até 6 itens mágicos ao mesmo tempo.',
        activation: 'none'
      },
      {
        name: 'Infundir Itens Adicional (12/6)',
        level: 18,
        description: 'Você agora conhece 12 infusões e pode manter até 6 itens infundidos ativos simultaneamente.',
        activation: 'none'
      }
    ],
    19: [
      {
        name: 'Incremento no Valor de Habilidade',
        level: 19,
        description: 'Aumente um atributo em 2, ou dois atributos em 1.',
        activation: 'none'
      }
    ],
    20: [
      {
        name: 'Alma do Artifício',
        level: 20,
        description: 'Você recebe +1 em todos os testes de salvaguarda para cada item mágico que possuir sintonizado (máx +6). Se cair a 0 PV mas não morrer, pode usar sua reação para encerrar uma infusão e voltar a 1 PV.',
        activation: 'reaction'
      }
    ]
  }
};

