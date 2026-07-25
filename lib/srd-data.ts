import { SRDMonster, SRDSpell, SRDItem, Encounter, LoreNode, BGMTrack, SFXButton, ConditionType } from './types';

export const CONDITIONS: ConditionType[] = [
  'Cego',
  'Encantado',
  'Surdo',
  'Atemorizado',
  'Agarrado',
  'Incapacitado',
  'Invisível',
  'Paralisado',
  'Petrificado',
  'Envenenado',
  'Caído',
  'Restrito',
  'Inconsciente',
  'Concentração',
];

export const INITIAL_MONSTERS: SRDMonster[] = [
  {
    id: 'goblin',
    name: 'Goblin',
    type: 'Humanóide (Goblinóide)',
    size: 'Pequeno',
    alignment: 'Neutro e Mau',
    ac: 15,
    hp: 7,
    speed: '9m (30ft)',
    cr: '1/4',
    xp: 50,
    str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
    abilities: [
      { name: 'Fuga Ágil', desc: 'O goblin pode usar a ação de Desengajar ou Esconder-se como uma ação bônus em cada um dos seus turnos.' }
    ],
    actions: [
      { name: 'Cimitarra', desc: 'Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano cortante.' },
      { name: 'Arco Curto', desc: 'Ataque à Distância com Arma: +4 para acertar, distância 24/96m, um alvo. Acerto: 5 (1d6 + 2) de dano Perfurante.' }
    ]
  },
  {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    type: 'Humanóide (Goblinóide)',
    size: 'Médio',
    alignment: 'Leal e Mau',
    ac: 18,
    hp: 11,
    speed: '9m (30ft)',
    cr: '1/2',
    xp: 100,
    str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9,
    abilities: [
      { name: 'Vantagem Marcial', desc: 'Uma vez por turno, o hobgoblin pode causar 7 (2d6) de dano extra a uma criatura que acertar se essa criatura estiver a 1,5m de um aliado do hobgoblin.' }
    ],
    actions: [
      { name: 'Espada Longa', desc: 'Ataque Corpo-a-Corpo: +3 para acertar, dano 5 (1d8+1) cortante.' },
      { name: 'Arco Longo', desc: 'Ataque à Distância: +3 para acertar, alcance 45/180m, dano 5 (1d8+1) perfurante.' }
    ]
  },
  {
    id: 'red-dragon-young',
    name: 'Dragão Vermelho Jovem',
    type: 'Dragão',
    size: 'Grande',
    alignment: 'Caótico e Mau',
    ac: 18,
    hp: 178,
    speed: '12m, voo 24m',
    cr: '10',
    xp: 5900,
    str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19,
    abilities: [
      { name: 'Resistência Lendária (1/Dia)', desc: 'Se o dragão falhar em um teste de resistência, ele pode optar por passar.' }
    ],
    actions: [
      { name: 'Ataque Múltiplo', desc: 'O dragão faz três ataques: um com a mordida e dois com as garras.' },
      { name: 'Sopro de Fogo (Recarga 5-6)', desc: 'O dragão exala fogo em um cone de 9 metros. Cada criatura na área deve fazer um teste de resistência de Destreza CD 17, sofrendo 56 (16d6) de dano de fogo se falhar.' }
    ]
  },
  {
    id: 'beholder',
    name: 'Observador (Beholder)',
    type: 'Aberração',
    size: 'Grande',
    alignment: 'Caótico e Mau',
    ac: 18,
    hp: 180,
    speed: '0m, voo 6m (flutuar)',
    cr: '13',
    xp: 10000,
    str: 10, dex: 14, con: 18, int: 17, wis: 15, cha: 17,
    abilities: [
      { name: 'Cone Antimagia', desc: 'O olho central do observador cria um cone de antimagia de 45 metros.' }
    ],
    actions: [
      { name: 'Raios Oculares', desc: 'O observador dispara aleatoriamente 3 raios oculares em alvos que ele possa ver a até 36 metros (Raio do Charme, Paralisia, Desintegração, Morte).' }
    ]
  },
  {
    id: 'skeleton',
    name: 'Esqueleto',
    type: 'Morto-Vivo',
    size: 'Médio',
    alignment: 'Leal e Mau',
    ac: 13,
    hp: 13,
    speed: '9m (30ft)',
    cr: '1/4',
    xp: 50,
    str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5,
    abilities: [
      { name: 'Vulnerabilidade a Concussão', desc: 'Esqueletos sofrem dano dobrado de armas de concussão.' }
    ],
    actions: [
      { name: 'Cimitarra', desc: '+4 para acertar, dano 5 (1d6+2) cortante.' }
    ]
  },
  {
    id: 'orc',
    name: 'Orc Guerreiro',
    type: 'Humanóide (Orc)',
    size: 'Médio',
    alignment: 'Caótico e Mau',
    ac: 13,
    hp: 15,
    speed: '9m (30ft)',
    cr: '1/2',
    xp: 100,
    str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10,
    abilities: [
      { name: 'Agressivo', desc: 'Como ação bônus, o orc pode se mover até o seu deslocamento em direção a uma criatura inimiga.' }
    ],
    actions: [
      { name: 'Machado Grande', desc: '+5 para acertar, dano 9 (1d12+3) cortante.' }
    ]
  },
  {
    id: 'zombie',
    name: 'Zumbi',
    type: 'Morto-Vivo',
    size: 'Médio',
    alignment: 'Neutro e Mau',
    ac: 8,
    hp: 22,
    speed: '6m (20ft)',
    cr: '1/4',
    xp: 50,
    str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5,
    abilities: [
      { name: 'Fortitude Inumana', desc: 'Se o dano reduzir o zumbi a 0 PV, ele faz um teste de CON (CD 5 + dano sofrido). Se passar, fica com 1 PV.' }
    ],
    actions: [
      { name: 'Pancada', desc: '+3 para acertar, dano 4 (1d6+1) de concussão.' }
    ]
  },
  {
    id: 'dire-wolf',
    name: 'Lobo Atroz',
    type: 'Besta',
    size: 'Grande',
    alignment: 'Sem Alinhamento',
    ac: 14,
    hp: 37,
    speed: '15m (50ft)',
    cr: '1',
    xp: 200,
    str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7,
    abilities: [
      { name: 'Táticas de Matilha', desc: 'Vantagem em jogadas de ataque se um aliado estiver a 1.5m da criatura.' }
    ],
    actions: [
      { name: 'Mordida', desc: '+5 para acertar, dano 10 (2d6+3) perfurante. Teste de FOR CD 13 ou cai caído.' }
    ]
  },
  {
    id: 'bandit',
    name: 'Bandido do Caminho',
    type: 'Humanóide',
    size: 'Médio',
    alignment: 'Qualquer Não Leal',
    ac: 12,
    hp: 11,
    speed: '9m (30ft)',
    cr: '1/8',
    xp: 25,
    str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10,
    abilities: [],
    actions: [
      { name: 'Cimitarra', desc: '+3 para acertar, dano 4 (1d6+1) cortante.' }
    ]
  },
  {
    id: 'ogre',
    name: 'Ogro das Colinas',
    type: 'Gigante',
    size: 'Grande',
    alignment: 'Caótico e Mau',
    ac: 11,
    hp: 59,
    speed: '12m (40ft)',
    cr: '2',
    xp: 450,
    str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7,
    abilities: [],
    actions: [
      { name: 'Grande Clava', desc: '+6 para acertar, dano 13 (2d8+4) de concussão.' }
    ]
  },
  {
    id: 'lich',
    name: 'Lich',
    type: 'Morto-Vivo',
    size: 'Médio',
    alignment: 'Qualquer Mau',
    ac: 17,
    hp: 135,
    speed: '9m (30ft)',
    cr: '21',
    xp: 33000,
    str: 11, dex: 16, con: 16, int: 20, wis: 14, cha: 16,
    abilities: [
      { name: 'Resistência Lendária (3/Dia)', desc: 'Se o lich falhar em um teste de resistência, ele pode optar por passar.' },
      { name: 'Rejuvenescimento', desc: 'Se tiver um filactério, o lich ganha um novo corpo em 1d10 dias após ser destruído.' }
    ],
    actions: [
      { name: 'Toque Paralisante', desc: '+12 para acertar, dano 10 (3d6) necrótico. Teste de CON CD 18 ou paralisado por 1 minuto.' }
    ]
  },
  {
    id: 'mimic',
    name: 'Mímico (Mimic)',
    type: 'Monstruosidade (Metamorfo)',
    size: 'Médio',
    alignment: 'Neutro',
    ac: 12,
    hp: 58,
    speed: '4.5m (15ft)',
    cr: '2',
    xp: 450,
    str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8,
    abilities: [
      { name: 'Adesivo', desc: 'Aderência a criaturas e objetos. Qualquer criatura que o tocar fica Agarrada (CD 13 para escapar).' },
      { name: 'Aparência Falsa', desc: 'Enquanto o mímico permanecer imóvel, é indistinguível de um objeto comum (baú, porta).' }
    ],
    actions: [
      { name: 'Pseudópode', desc: '+5 para acertar, dano 7 (1d8+3) de concussão + grudado.' }
    ]
  },
  {
    id: 'minotaur',
    name: 'Minotauro',
    type: 'Monstruosidade',
    size: 'Grande',
    alignment: 'Caótico e Mau',
    ac: 14,
    hp: 76,
    speed: '12m (40ft)',
    cr: '3',
    xp: 700,
    str: 18, dex: 11, con: 16, int: 6, wis: 16, cha: 9,
    abilities: [
      { name: 'Investida com Chifres', desc: 'Se se mover 3m em linha reta e acertar com os chifres, causa +9 (2d8) de dano perfurante extra.' }
    ],
    actions: [
      { name: 'Machado Grande', desc: '+6 para acertar, dano 17 (2d12+4) cortante.' },
      { name: 'Chifres', desc: '+6 para acertar, dano 13 (2d8+4) perfurante.' }
    ]
  },
  {
    id: 'fire-elemental',
    name: 'Elemental do Fogo',
    type: 'Elemental',
    size: 'Grande',
    alignment: 'Neutro',
    ac: 13,
    hp: 102,
    speed: '15m (50ft)',
    cr: '5',
    xp: 1800,
    str: 10, dex: 17, con: 16, int: 6, wis: 10, cha: 7,
    abilities: [
      { name: 'Forma de Fogo', desc: 'Entra no espaço de criaturas e incendeia alvos. Sofre dano ao entrar na água.' }
    ],
    actions: [
      { name: 'Toque Flamejante', desc: '+6 para acertar, dano 10 (2d6+3) de fogo.' }
    ]
  },
  {
    id: 'kobold',
    name: 'Kobold',
    type: 'Humanóide (Dragonado)',
    size: 'Pequeno',
    alignment: 'Leal e Mau',
    ac: 12,
    hp: 5,
    speed: '9m (30ft)',
    cr: '1/8',
    xp: 25,
    str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8,
    abilities: [
      { name: 'Táticas de Matilha', desc: 'Vantagem se um aliado estiver a 1.5m do alvo.' }
    ],
    actions: [
      { name: 'Adaga', desc: '+4 para acertar, dano 4 (1d4+2) perfurante.' }
    ]
  }
];

export const INITIAL_SPELLS: SRDSpell[] = [
  {
    id: 'magic-missile',
    name: 'Mísseis Mágicos (Magic Missile)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: '36 metros',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Você cria três dardos brilhantes de força mágica. Cada dardo atinge uma criatura à sua escolha e causa 1d4 + 1 de dano de força automaticamente (sem teste de ataque).',
    classes: ['Mago', 'Feiticeiro']
  },
  {
    id: 'fireball',
    name: 'Bola de Fogo (Fireball)',
    level: 3,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: '45 metros (150 pés)',
    components: 'V, S, M (uma bolinha de guano de morcego e enxofre)',
    duration: 'Instantânea',
    description: 'Um raio brilhante lampeja do seu dedo indicador para um ponto que você escolher e explode com um rugido baixo em uma explosão de chamas. Cada criatura em uma esfera de 6m de raio deve fazer um teste de Destreza. Falha: 8d6 de dano de fogo.',
    classes: ['Mago', 'Feiticeiro']
  },
  {
    id: 'cure-wounds',
    name: 'Curar Ferimentos (Cure Wounds)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: 'Toque',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Uma criatura que você tocar recupera um número de pontos de vida igual a 1d8 + seu modificador de habilidade de conjuração.',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladino', 'Ranger']
  },
  {
    id: 'shield',
    name: 'Escudo Mágico (Shield)',
    level: 1,
    school: 'Abjuração',
    castingTime: '1 Reação',
    range: 'Pessoal',
    components: 'V, S',
    duration: '1 Rodada',
    description: 'Uma barreira invisível de força mágica surge e o protege. Até o início do seu próximo turno, você ganha +5 de bônus na CA.',
    classes: ['Mago', 'Feiticeiro']
  },
  {
    id: 'misty-step',
    name: 'Passo Nebuloso (Misty Step)',
    level: 2,
    school: 'Conjuração',
    castingTime: '1 Ação Bônus',
    range: 'Pessoal',
    components: 'V',
    duration: 'Instantânea',
    description: 'Brevemente cercado por uma névoa prateada, você se teleporta até 9 metros para um espaço desocupado que possa ver.',
    classes: ['Mago', 'Feiticeiro', 'Bruxo']
  },
  {
    id: 'hold-person',
    name: 'Imobilizar Pessoa (Hold Person)',
    level: 2,
    school: 'Encantamento',
    castingTime: '1 Ação',
    range: '18 metros',
    components: 'V, S, M (uma pequena peça de ferro reto)',
    duration: 'Concentração, até 1 minuto',
    description: 'Escolha um humanoide. Ele deve passar num teste de resistência de Sabedoria ou ficará Paralisado pela duração da magia.',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Mago', 'Feiticeiro', 'Bruxo']
  },
  {
    id: 'invisibility',
    name: 'Invisibilidade (Invisibility)',
    level: 2,
    school: 'Ilusão',
    castingTime: '1 Ação',
    range: 'Toque',
    components: 'V, S, M (uma pestana envolta em goma)',
    duration: 'Concentração, até 1 hora',
    description: 'Uma criatura que você tocar fica invisível até que a magia termine. A magia termina se o alvo atacar ou conjurar uma magia.',
    classes: ['Bardo', 'Mago', 'Feiticeiro', 'Bruxo']
  },
  {
    id: 'eldritch-blast',
    name: 'Disparo Místico (Eldritch Blast)',
    level: 0,
    school: 'Evocação',
    castingTime: '1 Ação',
    range: '36 metros',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Um feixe de energia crepitante dispara em direção a uma criatura ao alcance. Faça um ataque à distância com magia. Acerto: 1d10 de dano de força.',
    classes: ['Bruxo']
  }
];

export const INITIAL_ITEMS: SRDItem[] = [
  {
    id: 'bag-of-holding',
    name: 'Mochila de Carga (Bag of Holding)',
    type: 'Item Mágico (Maravilhoso)',
    rarity: 'Incomum',
    description: 'Esta mochila tem um espaço interior consideravelmente maior que suas dimensões externas. Ela pode conter até 250 kg.'
  },
  {
    id: 'flame-tongue',
    name: 'Língua de Fogo (Flame Tongue)',
    type: 'Arma Mágica (Espada)',
    rarity: 'Rara',
    description: 'Você pode usar uma ação bônus para falar a palavra de comando, fazendo com que chamas brotem da lâmina. Causa 2d6 de dano de fogo adicional.'
  },
  {
    id: 'potion-of-healing',
    name: 'Poção de Cura',
    type: 'Consumível',
    rarity: 'Comum',
    description: 'Você recupera 2d4 + 2 pontos de vida ao beber esta poção vermelha borbulhante.',
    value: '50 PO'
  },
  {
    id: 'ring-of-protection',
    name: 'Anel de Proteção',
    type: 'Anel Mágico',
    rarity: 'Raro',
    description: 'Você ganha +1 de bônus na Classe de Armadura e nos testes de resistência enquanto usar este anel.'
  },
  {
    id: 'wand-of-magic-missiles',
    name: 'Varinha de Mísseis Mágicos',
    type: 'Varinha Mágica',
    rarity: 'Incomum',
    description: 'Esta varinha tem 7 cargas. Enquanto a segurar, você pode usar uma ação para gastar 1 ou mais cargas para conjurar Mísseis Mágicos.'
  },
  {
    id: 'cloak-of-displacement',
    name: 'Capa do Deslocamento',
    type: 'Item Mágico (Vestuário)',
    rarity: 'Rara',
    description: 'Enquanto usar esta capa, ela projeta uma ilusão de você ao seu lado, fazendo com que ataques contra você tenham Desvantagem.'
  }
];

export const INITIAL_ENCOUNTERS: Encounter[] = [
  {
    id: 'emboscada-floresta',
    name: 'Emboscada na Estrada da Floresta',
    description: 'Bando de goblins atacando a carroça dos aventureiros na curva da estrada.',
    combatants: [
      { name: 'Goblin Espião #1', type: 'monster', hp: 7, maxHp: 7, ac: 15, conditions: [], cr: '1/4' },
      { name: 'Goblin Arqueiro #2', type: 'monster', hp: 7, maxHp: 7, ac: 15, conditions: [], cr: '1/4' },
      { name: 'Goblin Arqueiro #3', type: 'monster', hp: 7, maxHp: 7, ac: 15, conditions: [], cr: '1/4' },
      { name: 'Líder Hobgoblin Kraag', type: 'monster', hp: 11, maxHp: 11, ac: 18, conditions: [], cr: '1/2' }
    ]
  },
  {
    id: 'tumba-dos-esqueletos',
    name: 'Guardiões da Tumba Sombria',
    description: 'Esqueletos antigos despertando assim que o sarcófago é aberto.',
    combatants: [
      { name: 'Esqueleto Guerreiro #1', type: 'monster', hp: 13, maxHp: 13, ac: 13, conditions: [], cr: '1/4' },
      { name: 'Esqueleto Arqueiro #2', type: 'monster', hp: 13, maxHp: 13, ac: 13, conditions: [], cr: '1/4' },
      { name: 'Esqueleto Arqueiro #3', type: 'monster', hp: 13, maxHp: 13, ac: 13, conditions: [], cr: '1/4' }
    ]
  }
];

export const INITIAL_LORE_NODES: LoreNode[] = [
  {
    id: 'valiria',
    name: 'Cidade Real de Valíria',
    type: 'location',
    status: 'active',
    description: 'Capital majestosa cercada por muralhas brancas de mármore e torres de conjuração.',
    connectedTo: ['rei-aris', 'guilda-sombras']
  },
  {
    id: 'rei-aris',
    name: 'Rei Aris III',
    type: 'npc',
    status: 'alive',
    description: 'Monarca idoso e precavido que tenta manter a paz na região a qualquer custo.',
    connectedTo: ['valiria']
  },
  {
    id: 'guilda-sombras',
    name: 'Guilda das Sombras',
    type: 'faction',
    status: 'hostile',
    description: 'Sindicato de ladrões e assassinos operando nos subterrâneos da cidade.',
    connectedTo: ['valiria', 'kraag-npc']
  },
  {
    id: 'kraag-npc',
    name: 'Kraag, o Devastador',
    type: 'npc',
    status: 'alive',
    description: 'Chefe hobgoblin mercenário contratado secretamente pela Guilda das Sombras.',
    connectedTo: ['guilda-sombras']
  }
];

export const BGM_TRACKS: BGMTrack[] = [
  // Taverna & Social
  { id: 'bgm-taverna', name: 'Taverna Rústica', category: 'taverna', url: '/audio/bgm/Taverna.mp3', isLoop: true },
  { id: 'bgm-taverna-2', name: 'Taverna Festiva', category: 'taverna', url: '/audio/bgm/Taverna 2.mp3', isLoop: true },
  { id: 'bgm-mercado', name: 'Mercado & Comércio', category: 'taverna', url: '/audio/bgm/Mercado.mp3', isLoop: true },

  // Exploração & Ambientação
  { id: 'bgm-cidade', name: 'Cidade Vibrante', category: 'exploracao', url: '/audio/bgm/Cidade.mp3', isLoop: true },
  { id: 'bgm-cidade-deserto', name: 'Cidade do Deserto', category: 'exploracao', url: '/audio/bgm/Cidade do Deserto.mp3', isLoop: true },
  { id: 'bgm-deserto', name: 'Deserto de Areias Quentes', category: 'exploracao', url: '/audio/bgm/Deserto.mp3', isLoop: true },
  { id: 'bgm-castelo', name: 'Castelo Real & Realeza', category: 'exploracao', url: '/audio/bgm/Castelo.mp3', isLoop: true },
  { id: 'bgm-sala-trono', name: 'Sala do Trono', category: 'exploracao', url: '/audio/bgm/Sala do Trono.mp3', isLoop: true },

  // Masmorra & Tensão
  { id: 'bgm-catacumbas', name: 'Catacumbas Sombrias', category: 'masmorra', url: '/audio/bgm/Catacumbas.mp3', isLoop: true },
  { id: 'bgm-cemiterio', name: 'Cemitério Assombrado', category: 'tensao', url: '/audio/bgm/Cemitério.mp3', isLoop: true },

  // Combate (4 trilhas de batalha)
  { id: 'bgm-batalha-1', name: 'Batalha Épica I', category: 'combate', url: '/audio/bgm/Batalha 1.mp3', isLoop: true },
  { id: 'bgm-batalha-2', name: 'Batalha Épica II', category: 'combate', url: '/audio/bgm/Batalha 2.mp3', isLoop: true },
  { id: 'bgm-batalha-3', name: 'Batalha Épica III', category: 'combate', url: '/audio/bgm/Batalha 3.mp3', isLoop: true },
  { id: 'bgm-batalha-4', name: 'Batalha Épica IV', category: 'combate', url: '/audio/bgm/Batalha 4.mp3', isLoop: true }
];

export const SFX_BUTTONS: SFXButton[] = [
  // ── Combate Corpo-a-Corpo ──
  { id: 'sfx-sword-slash', name: 'Golpe de Espada', iconName: 'Sword', category: 'combat', url: '/audio/sfx/sword-slash.mp3' },
  { id: 'sfx-attack-1', name: 'Ataque Corpo-a-Corpo I', iconName: 'Swords', category: 'combat', url: '/audio/sfx/attack-1.mp3' },
  { id: 'sfx-attack-2', name: 'Ataque Corpo-a-Corpo II', iconName: 'Swords', category: 'combat', url: '/audio/sfx/attack-2.mp3' },
  { id: 'sfx-attack-3', name: 'Ataque Corpo-a-Corpo III', iconName: 'Hammer', category: 'combat', url: '/audio/sfx/attack-3.mp3' },

  // ── Combate à Distância ──
  { id: 'sfx-arrow-shot', name: 'Tiro de Flecha', iconName: 'Target', category: 'combat', url: '/audio/sfx/arrow-shot.mp3' },
  { id: 'sfx-bow-loading', name: 'Carregando Arco', iconName: 'Target', category: 'combat', url: '/audio/sfx/bow-loading.mp3' },

  // ── Combate Especial ──
  { id: 'sfx-ambush', name: 'Emboscada!', iconName: 'ShieldAlert', category: 'combat', url: '/audio/sfx/ambush.mp3' },
  { id: 'sfx-leopard-attack', name: 'Ataque de Leopardo', iconName: 'Footprints', category: 'combat', url: '/audio/sfx/leopard-attack.mp3' },
  { id: 'sfx-tiger-attack', name: 'Ataque de Tigre', iconName: 'Footprints', category: 'combat', url: '/audio/sfx/tiger-attack.mp3' },

  // ── Magias de Fogo ──
  { id: 'sfx-fireball', name: 'Bola de Fogo (Fireball)', iconName: 'Flame', category: 'magic', url: '/audio/sfx/fireball.mp3' },
  { id: 'sfx-fireball-explosion', name: 'Explosão de Bola de Fogo', iconName: 'Flame', category: 'magic', url: '/audio/sfx/bola-de-fogo-explosão.mp3' },
  { id: 'sfx-lanca-fogo', name: 'Lança de Fogo', iconName: 'Flame', category: 'magic', url: '/audio/sfx/lança-de-fogo.mp3' },
  { id: 'sfx-raio-fogo', name: 'Raio de Fogo', iconName: 'Zap', category: 'magic', url: '/audio/sfx/raio-de-fogo.mp3' },

  // ── Magias Arcanas & Divinas ──
  { id: 'sfx-magic-missile', name: 'Mísseis Mágicos', iconName: 'Sparkles', category: 'magic', url: '/audio/sfx/magic-missile.mp3' },
  { id: 'sfx-bless', name: 'Bênção (Bless)', iconName: 'Sparkles', category: 'magic', url: '/audio/sfx/bless.mp3' },
  { id: 'sfx-cure-wounds', name: 'Curar Ferimentos', iconName: 'Heart', category: 'magic', url: '/audio/sfx/cure-wounds.mp3' },
  { id: 'sfx-cure-wounds-2', name: 'Curar Ferimentos (Alt)', iconName: 'Heart', category: 'magic', url: '/audio/sfx/cure-wounds 2.mp3' },
  { id: 'sfx-mage-hand', name: 'Mão Arcana', iconName: 'Hand', category: 'magic', url: '/audio/sfx/mage-hand.mp3' },
  { id: 'sfx-teleport', name: 'Teletransporte', iconName: 'Zap', category: 'magic', url: '/audio/sfx/teleport.mp3' },
  { id: 'sfx-invisibility', name: 'Invisibilidade', iconName: 'EyeOff', category: 'magic', url: '/audio/sfx/invisibility.mp3' },
  { id: 'sfx-aparecer-magico', name: 'Aparição Mágica', iconName: 'Sparkles', category: 'magic', url: '/audio/sfx/aparecer-magico.mp3' },

  // ── Monstros & Criaturas ──
  { id: 'sfx-monster-roar', name: 'Rugido de Monstro', iconName: 'Skull', category: 'combat', url: '/audio/sfx/monster-roar.mp3' },
  { id: 'sfx-monster-roar-2', name: 'Rugido de Monstro II', iconName: 'Skull', category: 'combat', url: '/audio/sfx/monster-roar-2.mp3' },
  { id: 'sfx-colossal-roar', name: 'Rugido Colossal', iconName: 'Skull', category: 'combat', url: '/audio/sfx/colossal-monster-roar.mp3' },
  { id: 'sfx-monster-dying', name: 'Monstro Morrendo', iconName: 'Skull', category: 'combat', url: '/audio/sfx/monster-dying.mp3' },
  { id: 'sfx-urro-demonio', name: 'Urro do Demônio', iconName: 'Skull', category: 'combat', url: '/audio/sfx/urro-do-demonio.mp3' },
  { id: 'sfx-bees', name: 'Enxame de Abelhas', iconName: 'Wind', category: 'environment', url: '/audio/sfx/bees.mp3' },

  // ── Ambiente & Narrativa ──
  { id: 'sfx-coin', name: 'Moedas', iconName: 'Coins', category: 'environment', url: '/audio/sfx/coin.mp3' },
  { id: 'sfx-sinos', name: 'Sinos', iconName: 'Sun', category: 'environment', url: '/audio/sfx/Sinos.mp3' },
  { id: 'sfx-acampamento', name: 'Acampamento', iconName: 'Flame', category: 'environment', url: '/audio/sfx/acampamento.mp3' },
  { id: 'sfx-level-up', name: 'Level Up!', iconName: 'Zap', category: 'environment', url: '/audio/sfx/level-up.mp3' }
];

