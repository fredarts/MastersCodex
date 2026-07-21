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
  }
];

export const INITIAL_SPELLS: SRDSpell[] = [
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
  { id: 'bgm-taverna', name: 'Taverna Rústica & Cerveja', category: 'taverna', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=medieval-tavern-113540.mp3', isLoop: true },
  { id: 'bgm-combate', name: 'Combate Épico dos Dragões', category: 'combate', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8724778.mp3?filename=epic-cinematic-trailer-110035.mp3', isLoop: true },
  { id: 'bgm-masmorra', name: 'Masmorra Sombria & Ecos', category: 'masmorra', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=dark-ambient-10903.mp3', isLoop: true },
  { id: 'bgm-tensao', name: 'Tensão & Perigo Iminente', category: 'tensao', url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_8835848e02.mp3?filename=tension-suspense-movie-trailer-8610.mp3', isLoop: true }
];

export const SFX_BUTTONS: SFXButton[] = [
  { id: 'sfx-espada', name: 'Espada', iconName: 'Swords', category: 'combat', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c31f47a469.mp3?filename=sword-slash-101188.mp3' },
  { id: 'sfx-dragao', name: 'Rugido', iconName: 'Flame', category: 'combat', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_b4860a5e8f.mp3?filename=monster-roar-6984.mp3' },
  { id: 'sfx-magia', name: 'Magia', iconName: 'Sparkles', category: 'magic', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c1c110398f.mp3?filename=magic-spell-6005.mp3' },
  { id: 'sfx-moedas', name: 'Moedas', iconName: 'Coins', category: 'environment', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_a340798150.mp3?filename=coins-handling-4-88480.mp3' },
  { id: 'sfx-porta', name: 'Porta', iconName: 'DoorOpen', category: 'environment', url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_348425d576.mp3?filename=wooden-door-open-98835.mp3' },
  { id: 'sfx-risada', name: 'Risada Maligna', iconName: 'Skull', category: 'magic', url: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_51744d0ec3.mp3?filename=evil-laugh-124040.mp3' }
];
