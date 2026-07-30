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
  'Mago': { int: 13 }
};

export const MULTICLASS_PROFICIENCIES: Record<string, { armor: string; weapons: string }> = {
  'Bárbaro': { armor: 'Escudos', weapons: 'Armas simples, armas marciais' },
  'Paladino': { armor: 'Armaduras leves, armaduras médias, escudos', weapons: 'Armas simples, armas marciais' },
  'Mago': { armor: 'Nenhuma', weapons: 'Adagas, dardos, fundas, cajados, bestas leves' }
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
        description: 'Você escolhe um caminho que molda a natureza de sua fúria. Essa escolha lhe concede características no 3º nível e novamente no 6º, 10º e 14º níveis.',
        activation: 'none',
        choices: ['Caminho do Berserker', 'Caminho do Guerreiro Totêmico']
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
  }
};
