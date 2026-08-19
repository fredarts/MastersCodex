import { CharacterWeaponAttack } from './types';

export interface WildShapeBeast {
  id: string;
  name: string;
  cr: string;
  crNumber: number;
  type: 'beast' | 'elemental';
  size: 'Miúdo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme';
  ac: number;
  hp: number;
  speed: string;
  hasSwim: boolean;
  hasFly: boolean;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  tokenImageUrl?: string;
  modelUrl?: string;
  abilities: { name: string; desc: string }[];
  actions: {
    name: string;
    atkBonus: number;
    reachOrRange: string;
    damage: string;
    damageType: string;
    desc: string;
  }[];
}

export const WILD_SHAPE_BEASTS: WildShapeBeast[] = [
  // ==========================================
  // ND 0 a 1/8 (Utilidade / Furtividade / Exploração)
  // ==========================================
  {
    id: 'gato',
    name: 'Gato',
    cr: '0',
    crNumber: 0,
    type: 'beast',
    size: 'Miúdo',
    ac: 12,
    hp: 2,
    speed: '12m, escalada 9m',
    hasSwim: false,
    hasFly: false,
    str: 3,
    dex: 15,
    con: 10,
    int: 3,
    wis: 12,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/Cat.png',
    abilities: [
      { name: 'Faro e Audição Aguçados', desc: 'Vantagem em testes de Percepção baseados em cheiro ou som.' },
    ],
    actions: [
      { name: 'Garras', atkBonus: 0, reachOrRange: '1.5m', damage: '1', damageType: 'cortante', desc: 'Ataque corpo-a-corpo: 1 de dano cortante.' },
    ],
  },
  {
    id: 'coruja',
    name: 'Coruja',
    cr: '0',
    crNumber: 0,
    type: 'beast',
    size: 'Miúdo',
    ac: 11,
    hp: 1,
    speed: '1.5m, voo 18m',
    hasSwim: false,
    hasFly: true,
    str: 3,
    dex: 13,
    con: 8,
    int: 2,
    wis: 12,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/Owl.png',
    abilities: [
      { name: 'Visão Noturna Aguçada', desc: 'Vantagem em testes de Percepção baseados na visão.' },
      { name: 'Voo Evasivo (Flyby)', desc: 'Não provoca ataques de oportunidade ao voar para fora do alcance de um inimigo.' },
    ],
    actions: [
      { name: 'Garras', atkBonus: 3, reachOrRange: '1.5m', damage: '1', damageType: 'cortante', desc: 'Ataque corpo-a-corpo: 1 de dano cortante.' },
    ],
  },
  {
    id: 'rato',
    name: 'Rato',
    cr: '0',
    crNumber: 0,
    type: 'beast',
    size: 'Miúdo',
    ac: 10,
    hp: 1,
    speed: '6m, escalada 6m',
    hasSwim: false,
    hasFly: false,
    str: 2,
    dex: 11,
    con: 9,
    int: 2,
    wis: 10,
    cha: 4,
    tokenImageUrl: '/assets/2d/Monstros/Rat.png',
    abilities: [
      { name: 'Faro Aguçado', desc: 'Vantagem em testes de Percepção baseados no olfato.' },
    ],
    actions: [
      { name: 'Mordida', atkBonus: 0, reachOrRange: '1.5m', damage: '1', damageType: 'perfurante', desc: 'Ataque corpo-a-corpo: 1 de dano perfurante.' },
    ],
  },
  {
    id: 'aranha',
    name: 'Aranha',
    cr: '0',
    crNumber: 0,
    type: 'beast',
    size: 'Miúdo',
    ac: 12,
    hp: 1,
    speed: '6m, escalada 6m',
    hasSwim: false,
    hasFly: false,
    str: 2,
    dex: 14,
    con: 8,
    int: 1,
    wis: 10,
    cha: 2,
    abilities: [
      { name: 'Escalada Aracnídea', desc: 'Pode escalar superfícies difíceis, incluindo tetos, sem precisar de testes.' },
      { name: 'Sentido na Teia', desc: 'Sabe a localização exata de qualquer criatura em contato com a mesma teia.' },
    ],
    actions: [
      { name: 'Mordida', atkBonus: 4, reachOrRange: '1.5m', damage: '1', damageType: 'perfurante', desc: '1 de dano perfurante + teste de CON CD 9 ou sofre 1d4 de veneno.' },
    ],
  },

  // ==========================================
  // ND 1/4 (Nível 2 Druida Base)
  // ==========================================
  {
    id: 'lobo',
    name: 'Lobo',
    cr: '1/4',
    crNumber: 0.25,
    type: 'beast',
    size: 'Médio',
    ac: 13,
    hp: 11,
    speed: '12m',
    hasSwim: false,
    hasFly: false,
    str: 12,
    dex: 15,
    con: 12,
    int: 3,
    wis: 12,
    cha: 6,
    tokenImageUrl: '/assets/2d/Monstros/Wolf.png',
    abilities: [
      { name: 'Audição e Faro Aguçados', desc: 'Vantagem em testes de Percepção baseados em cheiro ou som.' },
      { name: 'Táticas de Matilha (Pack Tactics)', desc: 'Vantagem em jogadas de ataque se pelo menos um aliado estiver a 1.5m do alvo.' },
    ],
    actions: [
      {
        name: 'Mordida',
        atkBonus: 4,
        reachOrRange: '1.5m',
        damage: '2d4+2',
        damageType: 'perfurante',
        desc: 'Ataque corpo-a-corpo: +4 para acertar, dano 2d4+2 perfurante. O alvo deve passar num teste de Força CD 11 ou cair Caído (Prone).',
      },
    ],
  },
  {
    id: 'pantera',
    name: 'Pantera',
    cr: '1/4',
    crNumber: 0.25,
    type: 'beast',
    size: 'Médio',
    ac: 12,
    hp: 13,
    speed: '15m, escalada 12m',
    hasSwim: false,
    hasFly: false,
    str: 14,
    dex: 15,
    con: 10,
    int: 3,
    wis: 14,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/Panther.png',
    abilities: [
      { name: 'Faro Aguçado', desc: 'Vantagem em testes de Sabedoria (Percepção) baseados em olfato.' },
      { name: 'Bote (Pounce)', desc: 'Se mover pelo menos 6m em linha reta e acertar uma Garra, o alvo deve passar em CD 12 Força ou cair Caído. Se cair, pode fazer 1 Mordida como Ação Bônus.' },
    ],
    actions: [
      { name: 'Garras', atkBonus: 4, reachOrRange: '1.5m', damage: '1d4+2', damageType: 'cortante', desc: 'Ataque corpo-a-corpo: +4 para acertar, dano 1d4+2 cortante.' },
      { name: 'Mordida', atkBonus: 4, reachOrRange: '1.5m', damage: '1d6+2', damageType: 'perfurante', desc: 'Ataque corpo-a-corpo: +4 para acertar, dano 1d6+2 perfurante.' },
    ],
  },
  {
    id: 'aranha-gigante',
    name: 'Aranha Gigante',
    cr: '1/4',
    crNumber: 0.25,
    type: 'beast',
    size: 'Grande',
    ac: 14,
    hp: 26,
    speed: '9m, escalada 9m',
    hasSwim: false,
    hasFly: false,
    str: 14,
    dex: 16,
    con: 12,
    int: 2,
    wis: 11,
    cha: 4,
    tokenImageUrl: '/assets/2d/Monstros/GiantSpider.png',
    abilities: [
      { name: 'Escalada Aracnídea', desc: 'Pode escalar tetos e superfícies sem testes.' },
      { name: 'Sentido na Teia', desc: 'Detecta a localização exata de criaturas na sua teia.' },
    ],
    actions: [
      { name: 'Mordida Venenosa', atkBonus: 5, reachOrRange: '1.5m', damage: '1d8+3', damageType: 'perfurante', desc: '1d8+3 perfurante + teste CON CD 11 ou sofre 2d8 de dano de veneno (metade se passar).' },
      { name: 'Teia (Recarga 5-6)', atkBonus: 5, reachOrRange: '9m/18m', damage: '0', damageType: 'especial', desc: 'Ataque à distância: alvo fica Preso (Restrained). CD 12 Força para escapar.' },
    ],
  },
  {
    id: 'texugo-gigante',
    name: 'Texugo Gigante',
    cr: '1/4',
    crNumber: 0.25,
    type: 'beast',
    size: 'Médio',
    ac: 10,
    hp: 13,
    speed: '9m, escavação 3m',
    hasSwim: false,
    hasFly: false,
    str: 13,
    dex: 10,
    con: 15,
    int: 2,
    wis: 12,
    cha: 5,
    abilities: [
      { name: 'Faro Aguçado', desc: 'Vantagem em testes de Percepção baseados no olfato.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 3, reachOrRange: '1.5m', damage: '1d6+1 e 2d4+1', damageType: 'cortante', desc: 'Faz dois ataques: uma Mordida (1d6+1) e uma Garra (2d4+1).' },
    ],
  },

  // ==========================================
  // ND 1/2 (Nível 4 Druida Base - Nado permitido)
  // ==========================================
  {
    id: 'crocodilo',
    name: 'Crocodilo',
    cr: '1/2',
    crNumber: 0.5,
    type: 'beast',
    size: 'Grande',
    ac: 12,
    hp: 19,
    speed: '6m, natação 9m',
    hasSwim: true,
    hasFly: false,
    str: 15,
    dex: 10,
    con: 13,
    int: 2,
    wis: 10,
    cha: 5,
    tokenImageUrl: '/assets/2d/Monstros/Crocodile.png',
    abilities: [
      { name: 'Prender a Respiração', desc: 'Pode prender a respiração por até 15 minutos.' },
    ],
    actions: [
      { name: 'Mordida', atkBonus: 4, reachOrRange: '1.5m', damage: '1d10+2', damageType: 'perfurante', desc: 'Ataque corpo-a-corpo: +4 para acertar, dano 1d10+2 perfurante. O alvo fica Agarrado (CD 12 para escapar).' },
    ],
  },
  {
    id: 'urso-preto',
    name: 'Urso Preto',
    cr: '1/2',
    crNumber: 0.5,
    type: 'beast',
    size: 'Médio',
    ac: 11,
    hp: 19,
    speed: '12m, escalada 9m',
    hasSwim: false,
    hasFly: false,
    str: 15,
    dex: 10,
    con: 14,
    int: 2,
    wis: 12,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/BlackBear.png',
    abilities: [
      { name: 'Faro Aguçado', desc: 'Vantagem em testes de Percepção baseados no olfato.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 3, reachOrRange: '1.5m', damage: '1d6+2 e 2d4+2', damageType: 'cortante', desc: 'Faz 2 ataques: uma Mordida (1d6+2) e uma Garra (2d4+2).' },
    ],
  },

  // ==========================================
  // ND 1 (Nível 8 Druida Base / Nível 2 Círculo da Lua - Voo permitido)
  // ==========================================
  {
    id: 'urso-marrom',
    name: 'Urso Marrom',
    cr: '1',
    crNumber: 1,
    type: 'beast',
    size: 'Grande',
    ac: 11,
    hp: 34,
    speed: '12m, escalada 9m',
    hasSwim: false,
    hasFly: false,
    str: 19,
    dex: 10,
    con: 16,
    int: 2,
    wis: 13,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/BrownBear.png',
    abilities: [
      { name: 'Faro Aguçado', desc: 'Vantagem em testes de Percepção baseados no olfato.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 5, reachOrRange: '1.5m', damage: '1d8+4 e 2d6+4', damageType: 'cortante', desc: 'Faz dois ataques: uma Mordida (1d8+4) e uma Garra (2d6+4).' },
    ],
  },
  {
    id: 'lobo-terrivel',
    name: 'Lobo Terrível (Dire Wolf)',
    cr: '1',
    crNumber: 1,
    type: 'beast',
    size: 'Grande',
    ac: 14,
    hp: 37,
    speed: '15m',
    hasSwim: false,
    hasFly: false,
    str: 17,
    dex: 15,
    con: 15,
    int: 3,
    wis: 12,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/DireWolf.png',
    abilities: [
      { name: 'Faro e Audição Aguçados', desc: 'Vantagem em testes de Percepção baseados em cheiro ou som.' },
      { name: 'Táticas de Matilha', desc: 'Vantagem em jogadas de ataque com aliados próximos.' },
    ],
    actions: [
      { name: 'Mordida Terrível', atkBonus: 5, reachOrRange: '1.5m', damage: '2d6+3', damageType: 'perfurante', desc: '+5 para acertar, dano 2d6+3. O alvo deve passar em teste de Força CD 13 ou cair Caído.' },
    ],
  },
  {
    id: 'aguia-gigante',
    name: 'Águia Gigante',
    cr: '1',
    crNumber: 1,
    type: 'beast',
    size: 'Grande',
    ac: 13,
    hp: 26,
    speed: '3m, voo 24m',
    hasSwim: false,
    hasFly: true,
    str: 16,
    dex: 17,
    con: 13,
    int: 8,
    wis: 14,
    cha: 10,
    tokenImageUrl: '/assets/2d/Monstros/GiantEagle.png',
    abilities: [
      { name: 'Visão Aguçada', desc: 'Vantagem em testes de Sabedoria (Percepção) baseados na visão.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 5, reachOrRange: '1.5m', damage: '1d6+3 e 2d6+3', damageType: 'cortante', desc: 'Faz 2 ataques: um Bico (1d6+3) e Garras (2d6+3).' },
    ],
  },

  // ==========================================
  // ND 2 (Círculo da Lua Nível 6+)
  // ==========================================
  {
    id: 'urso-polar',
    name: 'Urso Polar',
    cr: '2',
    crNumber: 2,
    type: 'beast',
    size: 'Grande',
    ac: 12,
    hp: 42,
    speed: '12m, natação 9m',
    hasSwim: true,
    hasFly: false,
    str: 20,
    dex: 10,
    con: 16,
    int: 2,
    wis: 13,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/PolarBear.png',
    abilities: [
      { name: 'Faro Aguçado', desc: 'Vantagem em testes de Percepção baseados no olfato.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 7, reachOrRange: '1.5m', damage: '1d8+5 e 2d6+5', damageType: 'cortante', desc: 'Faz dois ataques: Mordida (+7, 1d8+5) e Garras (+7, 2d6+5).' },
    ],
  },
  {
    id: 'alossauro',
    name: 'Alossauro',
    cr: '2',
    crNumber: 2,
    type: 'beast',
    size: 'Grande',
    ac: 13,
    hp: 51,
    speed: '18m',
    hasSwim: false,
    hasFly: false,
    str: 19,
    dex: 13,
    con: 17,
    int: 2,
    wis: 12,
    cha: 5,
    tokenImageUrl: '/assets/2d/Monstros/Allosaurus.png',
    abilities: [
      { name: 'Bote (Pounce)', desc: 'Se mover pelo menos 9m em linha reta e acertar uma Garra, o alvo deve passar em Força CD 13 ou cair Caído e sofrer uma Mordida como Ação Bônus.' },
    ],
    actions: [
      { name: 'Garras', atkBonus: 6, reachOrRange: '1.5m', damage: '1d8+4', damageType: 'cortante', desc: 'Ataque corpo-a-corpo: +6 para acertar, dano 1d8+4 cortante.' },
      { name: 'Mordida', atkBonus: 6, reachOrRange: '1.5m', damage: '2d10+4', damageType: 'perfurante', desc: 'Ataque corpo-a-corpo: +6 para acertar, dano 2d10+4 perfurante.' },
    ],
  },

  // ==========================================
  // ELEMENTAIS (Círculo da Lua Nível 10+ / 2 Usos de Forma Selvagem)
  // ==========================================
  {
    id: 'elemental-fogo',
    name: 'Elemental do Fogo',
    cr: '5',
    crNumber: 5,
    type: 'elemental',
    size: 'Grande',
    ac: 13,
    hp: 102,
    speed: '15m',
    hasSwim: false,
    hasFly: false,
    str: 10,
    dex: 17,
    con: 16,
    int: 6,
    wis: 10,
    cha: 7,
    tokenImageUrl: '/assets/2d/Monstros/FireElemental.png',
    abilities: [
      { name: 'Forma de Fogo', desc: 'Pode se mover através de espaços de até 2.5cm. Ao entrar no espaço de uma criatura, causa 1d10 de dano de fogo e a incendeia.' },
      { name: 'Iluminação', desc: 'Emite luz brilhante num raio de 9m e penumbra por mais 9m.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 6, reachOrRange: '1.5m', damage: '2x 2d6+3 fogo', damageType: 'fogo', desc: 'Faz 2 ataques de Toque (+6, 2d6+3 de dano de fogo).' },
    ],
  },
  {
    id: 'elemental-terra',
    name: 'Elemental da Terra',
    cr: '5',
    crNumber: 5,
    type: 'elemental',
    size: 'Grande',
    ac: 17,
    hp: 126,
    speed: '9m, escavação 9m',
    hasSwim: false,
    hasFly: false,
    str: 20,
    dex: 8,
    con: 20,
    int: 5,
    wis: 10,
    cha: 5,
    tokenImageUrl: '/assets/2d/Monstros/EarthElemental.png',
    abilities: [
      { name: 'Deslizar pela Terra', desc: 'Pode escavar através de terra e pedra não-trabalhada sem perturbar o material.' },
      { name: 'Cabeça de Cerco', desc: 'Causa dano duplo a objetos e estruturas.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 8, reachOrRange: '3m', damage: '2x 2d8+5 concussão', damageType: 'concussão', desc: 'Faz 2 ataques de Pancada (+8, 2d8+5 de dano de concussão).' },
    ],
  },
  {
    id: 'elemental-agua',
    name: 'Elemental da Água',
    cr: '5',
    crNumber: 5,
    type: 'elemental',
    size: 'Grande',
    ac: 14,
    hp: 114,
    speed: '9m, natação 27m',
    hasSwim: true,
    hasFly: false,
    str: 18,
    dex: 14,
    con: 18,
    int: 5,
    wis: 10,
    cha: 5,
    tokenImageUrl: '/assets/2d/Monstros/WaterElemental.png',
    abilities: [
      { name: 'Forma Líquida', desc: 'Pode se mover através de qualquer abertura estreita. Pode parar no espaço de criaturas hostis.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 7, reachOrRange: '1.5m', damage: '2x 2d8+4 concussão', damageType: 'concussão', desc: 'Faz 2 ataques de Pancada (+7, 2d8+4 concussão).' },
      { name: 'Aríete de Água (Recarga 4-6)', atkBonus: 7, reachOrRange: '1.5m', damage: '4d8+4', damageType: 'concussão', desc: 'Cada criatura no espaço do elemental sofre 4d8+4 e deve passar em Força CD 15 ou é Agarrada e começa a se afogar.' },
    ],
  },
  {
    id: 'elemental-ar',
    name: 'Elemental do Ar',
    cr: '5',
    crNumber: 5,
    type: 'elemental',
    size: 'Grande',
    ac: 15,
    hp: 90,
    speed: 'voo 27m (pairar)',
    hasSwim: false,
    hasFly: true,
    str: 14,
    dex: 20,
    con: 14,
    int: 6,
    wis: 10,
    cha: 6,
    tokenImageUrl: '/assets/2d/Monstros/AirElemental.png',
    abilities: [
      { name: 'Forma Gasosa', desc: 'Pode entrar e ocupar o espaço de outra criatura e passar por pequenas frestas sem penalidade.' },
    ],
    actions: [
      { name: 'Ataque Múltiplo', atkBonus: 8, reachOrRange: '1.5m', damage: '2x 2d8+5 concussão', damageType: 'concussão', desc: 'Faz 2 ataques de Pancada de Vento (+8, 2d8+5 concussão).' },
      { name: 'Redemoinho (Recarga 4-6)', atkBonus: 8, reachOrRange: '1.5m', damage: '3d8+5', damageType: 'concussão', desc: 'Criaturas no espaço devem passar em CD 13 Força ou sofrem 3d8+5 e são arremessadas a 6m de distância.' },
    ],
  },
];
