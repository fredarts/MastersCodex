export interface SRDSpell {
  name: string;
  level: number; // 0 = Truque
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes: string[];
  damage?: string;
  save?: string;
}

export interface SRDItem {
  name: string;
  category: 'Arma' | 'Armadura' | 'Equipamento' | 'Pção' | 'Ferramenta' | 'Tesouro';
  weight: number; // em lb (libras)
  cost: string;
  description: string;
}

export const SRD_SPELLS: SRDSpell[] = [
  // TRUQUES (NÍVEL 0)
  {
    name: 'Explosão Mística (Eldritch Blast)',
    level: 0,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '36m (120ft)',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Um raio de energia crepitante dispara em direção a uma criatura. Faça um ataque à distância com magia. Se atingir, o alvo sofre 1d10 de dano de força.',
    classes: ['Bruxo'],
    damage: '1d10',
  },
  {
    name: 'Mão dos Magos (Mage Hand)',
    level: 0,
    school: 'Conjuração',
    castingTime: '1 ação',
    range: '9m (30ft)',
    components: 'V, S',
    duration: '1 minuto',
    description: 'Uma mão espectral e flutuante aparece no ponto escolhido. Você pode usar a mão para manipular um objeto, abrir uma porta não trancada ou carregar até 4.5kg.',
    classes: ['Bardo', 'Feiticeiro', 'Bruxo', 'Mago'],
  },
  {
    name: 'Prestidigitação (Prestidigitation)',
    level: 0,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: '3m (10ft)',
    components: 'V, S',
    duration: 'Até 1 hora',
    description: 'Você cria um efeito mágico menor: faíscas, brisa suave, limpa ou suja um objeto, esquenta ou resfria comida.',
    classes: ['Bardo', 'Feiticeiro', 'Bruxo', 'Mago'],
  },
  {
    name: 'Chama Sagrada (Sacred Flame)',
    level: 0,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '18m (60ft)',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Radiação que lembra fogo desce sobre uma criatura. O alvo deve passar num teste de resistência de Destreza ou sofrer 1d8 de dano radiante.',
    classes: ['Clérigo'],
    damage: '1d8',
    save: 'DEX',
  },
  {
    name: 'Chicote de Espinhos (Thorn Whip)',
    level: 0,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: '9m (30ft)',
    components: 'V, S, M',
    duration: 'Instantânea',
    description: 'Você cria um chicote de trepadeiras com espinhos. Faça um ataque mágico à distância. Em um acerto, causa 1d6 de dano perfurante e puxa o alvo até 3m em sua direção.',
    classes: ['Druida'],
    damage: '1d6',
  },

  // NÍVEL 1
  {
    name: 'Míssil Mágico (Magic Missile)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '36m (120ft)',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Você cria três dardos brilhantes de força mágica. Cada dardo atinge uma criatura à sua escolha automaticamente, causando 1d4 + 1 de dano de força.',
    classes: ['Feiticeiro', 'Mago'],
    damage: '3d4+3',
  },
  {
    name: 'Curar Ferimentos (Cure Wounds)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 ação',
    range: 'Toque',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Uma criatura que você tocar recupera pontos de vida iguais a 1d8 + o modificador de habilidade de conjuração.',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladino', 'Patrulheiro'],
    damage: '1d8',
  },
  {
    name: 'Escudo Mágico (Shield)',
    level: 1,
    school: 'Abjuração',
    castingTime: '1 reação',
    range: 'Pessoal',
    components: 'V, S',
    duration: '1 rodada',
    description: 'Uma barreira invisível de força surge. Você ganha um bônus de +5 na CA até o início do seu próximo turno e não sofre dano de Míssil Mágico.',
    classes: ['Feiticeiro', 'Mago'],
  },
  {
    name: 'Mãos Flamejantes (Burning Hands)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 ação',
    range: 'Cone de 4.5m (15ft)',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Uma fogueira em formato de leque dispara dos seus dedos. Cada criatura no cone deve fazer um TR de Destreza, sofrendo 3d6 de dano de fogo ou metade.',
    classes: ['Feiticeiro', 'Mago'],
    damage: '3d6',
    save: 'DEX',
  },
  {
    name: 'Palavra Curativa (Healing Word)',
    level: 1,
    school: 'Evocação',
    castingTime: '1 ação bônus',
    range: '18m (60ft)',
    components: 'V',
    duration: 'Instantânea',
    description: 'Uma criatura à sua escolha recupera PV iguais a 1d4 + mod de conjuração. Não afeta mortos-vivos ou constructos.',
    classes: ['Bardo', 'Clérigo', 'Druida'],
    damage: '1d4',
  },

  // NÍVEL 2
  {
    name: 'Passo Nebuloso (Misty Step)',
    level: 2,
    school: 'Conjuração',
    castingTime: '1 ação bônus',
    range: 'Pessoal',
    components: 'V',
    duration: 'Instantânea',
    description: 'Envolvido por uma névoa prateada, você se teleporta até 9 metros para um espaço desocupado que você possa ver.',
    classes: ['Feiticeiro', 'Bruxo', 'Mago'],
  },
  {
    name: 'Raio de Ruína (Scorching Ray)',
    level: 2,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '36m (120ft)',
    components: 'V, S',
    duration: 'Instantânea',
    description: 'Você cria três raios de fogo e os arremessa em alvos dentro do alcance. Faça um ataque à distância para cada raio. Cada acerto causa 2d6 de dano de fogo.',
    classes: ['Feiticeiro', 'Mago'],
    damage: '2d6 per ray',
  },
  {
    name: 'Imobilizar Pessoa (Hold Person)',
    level: 2,
    school: 'Encantamento',
    castingTime: '1 ação',
    range: '18m (60ft)',
    components: 'V, S, M',
    duration: 'Concentração, até 1 minuto',
    description: 'Escolha um humanoide que possa ver. Ele deve passar num teste de resistência de Sabedoria ou ficar Paralisado.',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Feiticeiro', 'Bruxo', 'Mago'],
    save: 'WIS',
  },

  // NÍVEL 3
  {
    name: 'Bola de Fogo (Fireball)',
    level: 3,
    school: 'Evocação',
    castingTime: '1 ação',
    range: '45m (150ft)',
    components: 'V, S, M',
    duration: 'Instantânea',
    description: 'Uma esfera de fogo explode numa área de 6m de raio. Criaturas na área devem fazer TR de Destreza, sofrendo 8d6 de dano de fogo (metade num sucesso).',
    classes: ['Feiticeiro', 'Mago'],
    damage: '8d6',
    save: 'DEX',
  },
  {
    name: 'Relâmpago (Lightning Bolt)',
    level: 3,
    school: 'Evocação',
    castingTime: '1 ação',
    range: 'Linha de 30m (100ft)',
    components: 'V, S, M',
    duration: 'Instantânea',
    description: 'Um traço de eletricidade de 30m de comprimento e 1.5m de largura dispara de você. Criaturas sofrem 8d6 de dano elétrico (TR de Destreza para metade).',
    classes: ['Feiticeiro', 'Mago'],
    damage: '8d6',
    save: 'DEX',
  },
  {
    name: 'Voo (Fly)',
    level: 3,
    school: 'Transmutação',
    castingTime: '1 ação',
    range: 'Toque',
    components: 'V, S, M',
    duration: 'Concentração, até 10 minutos',
    description: 'Você toca uma criatura voluntária. Ela ganha um deslocamento de voo de 18m.',
    classes: ['Feiticeiro', 'Bruxo', 'Mago'],
  },
];

export const SRD_EQUIPMENT: SRDItem[] = [
  { name: 'Poção de Cura', category: 'Pção', weight: 0.5, cost: '50 po', description: 'Restaura 2d4 + 2 pontos de vida quando bebida.' },
  { name: 'Poção de Cura Maior', category: 'Pção', weight: 0.5, cost: '150 po', description: 'Restaura 4d4 + 4 pontos de vida quando bebida.' },
  { name: 'Corda de Cânhamo (15m)', category: 'Equipamento', weight: 10, cost: '1 po', description: 'Possui 2 PV e pode ser arrebentada com um teste de Força CD 17.' },
  { name: 'Mochila de Aventureiro', category: 'Equipamento', weight: 5, cost: '2 po', description: 'Pode carregar até 30 lb (15 kg) de suprimentos.' },
  { name: 'Tocha', category: 'Equipamento', weight: 1, cost: '1 pc', description: 'Queima por 1 hora, fornecendo luz brilhante em um raio de 6m.' },
  { name: 'Rações de Viagem (1 dia)', category: 'Equipamento', weight: 2, cost: '5 pr', description: 'Alimento desidratado e nutritivo para um dia.' },
  { name: 'Kit de Primeiros Socorros', category: 'Equipamento', weight: 3, cost: '5 po', description: 'Possui 10 usos para estabilizar criaturas com 0 PV sem teste de Medicina.' },
  { name: 'Ferramentas de Ladino', category: 'Ferramenta', weight: 1, cost: '25 po', description: 'Permite desarmar armadilhas e abrir fechaduras com proficiência.' },
  { name: 'Odre de Água', category: 'Equipamento', weight: 5, cost: '2 pr', description: 'Contém cerca de 2 litros de líquido.' },
];
