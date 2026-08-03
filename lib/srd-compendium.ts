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
  category: 'Arma' | 'Armadura' | 'Equipamento' | 'Poção' | 'Ferramenta' | 'Tesouro';
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
  // Armas Simples Corpo a Corpo
  { name: 'Adaga', category: 'Arma', weight: 1, cost: '2 po', description: 'Dano: 1d4 perfurante. Propriedades: Acuidade, leve, arremesso (distância 6/18).' },
  { name: 'Azagaia', category: 'Arma', weight: 2, cost: '5 pr', description: 'Dano: 1d6 perfurante. Propriedades: Arremesso (distância 9/36).' },
  { name: 'Bordão', category: 'Arma', weight: 4, cost: '2 pr', description: 'Dano: 1d6 concussão. Propriedades: Versátil (1d8).' },
  { name: 'Clava', category: 'Arma', weight: 2, cost: '1 pr', description: 'Dano: 1d4 concussão. Propriedades: Leve.' },
  { name: 'Clava Grande', category: 'Arma', weight: 10, cost: '2 pr', description: 'Dano: 1d8 concussão. Propriedades: Duas mãos.' },
  { name: 'Foice Curta', category: 'Arma', weight: 2, cost: '1 po', description: 'Dano: 1d4 cortante. Propriedades: Leve.' },
  { name: 'Lança', category: 'Arma', weight: 3, cost: '1 po', description: 'Dano: 1d6 perfurante. Propriedades: Arremesso (distância 6/18), versátil (1d8).' },
  { name: 'Maça', category: 'Arma', weight: 4, cost: '5 po', description: 'Dano: 1d6 concussão. Propriedades: Nenhuma.' },
  { name: 'Machadinha', category: 'Arma', weight: 2, cost: '5 po', description: 'Dano: 1d6 cortante. Propriedades: Leve, arremesso (distância 6/18).' },
  { name: 'Martelo Leve', category: 'Arma', weight: 2, cost: '2 po', description: 'Dano: 1d4 concussão. Propriedades: Leve, arremesso (distância 6/18).' },

  // Armas Simples à Distância
  { name: 'Arco Curto', category: 'Arma', weight: 2, cost: '25 po', description: 'Dano: 1d6 perfurante. Propriedades: Munição (distância 24/96), duas mãos.' },
  { name: 'Besta Leve', category: 'Arma', weight: 5, cost: '25 po', description: 'Dano: 1d8 perfurante. Propriedades: Munição (distância 24/96), recarga, duas mãos.' },
  { name: 'Dardo', category: 'Arma', weight: 0.25, cost: '5 pc', description: 'Dano: 1d4 perfurante. Propriedades: Acuidade, arremesso (distância 6/18).' },
  { name: 'Funda', category: 'Arma', weight: 0, cost: '1 pr', description: 'Dano: 1d4 concussão. Propriedades: Munição (distância 9/36).' },

  // Armas Marciais Corpo a Corpo
  { name: 'Alabarda', category: 'Arma', weight: 6, cost: '20 po', description: 'Dano: 1d10 cortante. Propriedades: Pesada, alcance, duas mãos.' },
  { name: 'Chicote', category: 'Arma', weight: 3, cost: '2 po', description: 'Dano: 1d4 cortante. Propriedades: Acuidade, alcance.' },
  { name: 'Cimitarra', category: 'Arma', weight: 3, cost: '25 po', description: 'Dano: 1d6 cortante. Propriedades: Acuidade, leve.' },
  { name: 'Espada Curta', category: 'Arma', weight: 2, cost: '10 po', description: 'Dano: 1d6 perfurante. Propriedades: Acuidade, leve.' },
  { name: 'Espada Grande', category: 'Arma', weight: 6, cost: '50 po', description: 'Dano: 2d6 cortante. Propriedades: Pesada, duas mãos.' },
  { name: 'Espada Longa', category: 'Arma', weight: 3, cost: '15 po', description: 'Dano: 1d8 cortante. Propriedades: Versátil (1d10).' },
  { name: 'Glaive', category: 'Arma', weight: 6, cost: '20 po', description: 'Dano: 1d10 cortante. Propriedades: Pesada, alcance, duas mãos.' },
  { name: 'Lança de Montaria', category: 'Arma', weight: 6, cost: '10 po', description: 'Dano: 1d12 perfurante. Propriedades: Alcance, especial.' },
  { name: 'Lança Longa', category: 'Arma', weight: 18, cost: '5 po', description: 'Dano: 1d10 perfurante. Propriedades: Pesada, alcance, duas mãos.' },
  { name: 'Machado de Batalha', category: 'Arma', weight: 4, cost: '10 po', description: 'Dano: 1d8 cortante. Propriedades: Versátil (1d10).' },
  { name: 'Machado Grande', category: 'Arma', weight: 7, cost: '30 po', description: 'Dano: 1d12 cortante. Propriedades: Pesada, duas mãos.' },
  { name: 'Malho', category: 'Arma', weight: 10, cost: '10 po', description: 'Dano: 2d6 concussão. Propriedades: Pesada, duas mãos.' },
  { name: 'Mangual', category: 'Arma', weight: 2, cost: '10 po', description: 'Dano: 1d8 concussão. Propriedades: Nenhuma.' },
  { name: 'Martelo de Guerra', category: 'Arma', weight: 2, cost: '15 po', description: 'Dano: 1d8 concussão. Propriedades: Versátil (1d10).' },
  { name: 'Maça Estrela', category: 'Arma', weight: 4, cost: '15 po', description: 'Dano: 1d8 perfurante. Propriedades: Nenhuma.' },
  { name: 'Picareta de Guerra', category: 'Arma', weight: 2, cost: '5 po', description: 'Dano: 1d8 perfurante. Propriedades: Nenhuma.' },
  { name: 'Rapieira', category: 'Arma', weight: 2, cost: '25 po', description: 'Dano: 1d8 perfurante. Propriedades: Acuidade.' },
  { name: 'Tridente', category: 'Arma', weight: 4, cost: '5 po', description: 'Dano: 1d6 perfurante. Propriedades: Arremesso (distância 6/18), versátil (1d8).' },

  // Armas Marciais à Distância
  { name: 'Arco Longo', category: 'Arma', weight: 2, cost: '50 po', description: 'Dano: 1d8 perfurante. Propriedades: Munição (distância 45/180), pesada, duas mãos.' },
  { name: 'Besta de Mão', category: 'Arma', weight: 3, cost: '75 po', description: 'Dano: 1d6 perfurante. Propriedades: Munição (distância 9/36), leve, recarga.' },
  { name: 'Besta Pesada', category: 'Arma', weight: 18, cost: '50 po', description: 'Dano: 1d10 perfurante. Propriedades: Munição (distância 30/120), pesada, recarga, duas mãos.' },
  { name: 'Zarabatana', category: 'Arma', weight: 1, cost: '10 po', description: 'Dano: 1 perfurante. Propriedades: Munição (distância 7,5/30), recarga.' },
  { name: 'Rede', category: 'Arma', weight: 3, cost: '1 po', description: 'Dano: Nenhum. Propriedades: Especial, arremesso (distância 1,5/4,5).' },

  // Armaduras Leves
  { name: 'Armadura Acolchoada', category: 'Armadura', weight: 8, cost: '5 po', description: 'CA: 11 + mod. Destreza. Furtividade: Desvantagem.' },
  { name: 'Armadura de Couro', category: 'Armadura', weight: 10, cost: '10 po', description: 'CA: 11 + mod. Destreza.' },
  { name: 'Armadura de Couro Batido', category: 'Armadura', weight: 13, cost: '45 po', description: 'CA: 12 + mod. Destreza.' },

  // Armaduras Médias
  { name: 'Gibão de Peles', category: 'Armadura', weight: 12, cost: '10 po', description: 'CA: 12 + mod. Destreza (máx +2).' },
  { name: 'Camisão de Cota de Malha', category: 'Armadura', weight: 20, cost: '50 po', description: 'CA: 13 + mod. Destreza (máx +2).' },
  { name: 'Brunea', category: 'Armadura', weight: 45, cost: '50 po', description: 'CA: 14 + mod. Destreza (máx +2). Furtividade: Desvantagem.' },
  { name: 'Peitoral', category: 'Armadura', weight: 20, cost: '400 po', description: 'CA: 14 + mod. Destreza (máx +2).' },
  { name: 'Meia Armadura', category: 'Armadura', weight: 40, cost: '750 po', description: 'CA: 15 + mod. Destreza (máx +2). Furtividade: Desvantagem.' },

  // Armaduras Pesadas
  { name: 'Cota de Anéis', category: 'Armadura', weight: 40, cost: '30 po', description: 'CA: 14. Furtividade: Desvantagem.' },
  { name: 'Cota de Malha', category: 'Armadura', weight: 55, cost: '75 po', description: 'CA: 16. Força mínima: 13. Furtividade: Desvantagem.' },
  { name: 'Cota de Talas', category: 'Armadura', weight: 60, cost: '200 po', description: 'CA: 17. Força mínima: 15. Furtividade: Desvantagem.' },
  { name: 'Armadura de Placas', category: 'Armadura', weight: 65, cost: '1500 po', description: 'CA: 18. Força mínima: 15. Furtividade: Desvantagem.' },

  // Escudo
  { name: 'Escudo', category: 'Armadura', weight: 6, cost: '10 po', description: 'CA: +2. Empunhar um escudo aumenta sua Classe de Armadura em 2.' },

  // Equipamentos de Aventura
  { name: 'Algemas', category: 'Equipamento', weight: 6, cost: '2 po', description: 'Possuem restrições para escapar (CD 20 Destreza/Força).' },
  { name: 'Ampulheta', category: 'Equipamento', weight: 1, cost: '25 po', description: 'Mede o tempo com precisão (areia).' },
  { name: 'Aríete Portátil', category: 'Equipamento', weight: 35, cost: '4 po', description: 'Concede +4 de bônus em testes de Força para arrombar portas.' },
  { name: 'Balança de Mercador', category: 'Equipamento', weight: 3, cost: '5 po', description: 'Para pesar moedas e materiais precisos.' },
  { name: 'Barril', category: 'Equipamento', weight: 70, cost: '2 po', description: 'Pode conter até 150 litros de líquido ou equivalente.' },
  { name: 'Baú', category: 'Equipamento', weight: 25, cost: '5 po', description: 'Armazena até 150 kg.' },
  { name: 'Cobertor de Inverno', category: 'Equipamento', weight: 3, cost: '5 pr', description: 'Para descanso em clima frio.' },
  { name: 'Corda de Cânhamo (15m)', category: 'Equipamento', weight: 10, cost: '1 po', description: 'Possui 2 PV e pode ser arrebentada com um teste de Força CD 17.' },
  { name: 'Corda de Seda (15m)', category: 'Equipamento', weight: 5, cost: '10 po', description: 'Possui 2 PV e pode ser arrebentada com um teste de Força CD 17.' },
  { name: 'Equipamento de Alpinista', category: 'Equipamento', weight: 12, cost: '25 po', description: 'Inclui pítons, botas cravejadas, luvas e arnês.' },
  { name: 'Esferas (bolsa com 1.000)', category: 'Equipamento', weight: 2, cost: '1 po', description: 'Pode ser espalhada numa área (quadrado 3m) para criar terreno difícil.' },
  { name: 'Estrepes (bolsa com 20)', category: 'Equipamento', weight: 2, cost: '1 po', description: 'Espalhados no chão, quem passar sofre 1 de dano perfurante e perde 3m de deslocamento (CD 15).' },
  { name: 'Fogo Alquímico (frasco)', category: 'Equipamento', weight: 1, cost: '50 po', description: 'Arremessado (ataque à distância). Alvo sofre 1d4 de dano de fogo no início de seus turnos até apagar (ação).' },
  { name: 'Frasco ou Ampola', category: 'Equipamento', weight: 0, cost: '1 po', description: 'Recipiente pequeno de vidro ou metal.' },
  { name: 'Garrafa de Vidro', category: 'Equipamento', weight: 2, cost: '2 po', description: 'Capacidade 750 ml.' },
  { name: 'Kit de Primeiros Socorros', category: 'Equipamento', weight: 3, cost: '5 po', description: 'Possui 10 usos para estabilizar criaturas com 0 PV sem teste de Medicina.' },
  { name: 'Lanterna Coberta', category: 'Equipamento', weight: 2, cost: '5 po', description: 'Raio de 9m de luz plena e +9m de luz penumbra. Dura 6h/frasco.' },
  { name: 'Lanterna Furta-Fogo', category: 'Equipamento', weight: 2, cost: '10 po', description: 'Cone de luz plena 18m e +18m penumbra. Direcional.' },
  { name: 'Lente de Aumento', category: 'Equipamento', weight: 0, cost: '100 po', description: 'Concede vantagem em testes de Investigação para itens pequenos.' },
  { name: 'Livro', category: 'Equipamento', weight: 5, cost: '25 po', description: 'Um livro comum de anotações ou contos.' },
  { name: 'Livro de Magias (Grimório)', category: 'Equipamento', weight: 3, cost: '50 po', description: 'Livro contendo magias arcanas, essencial para magos.' },
  { name: 'Luneta', category: 'Equipamento', weight: 1, cost: '1000 po', description: 'Aumenta a visão à distância, coisas parecem 2x maiores.' },
  { name: 'Mochila de Aventureiro', category: 'Equipamento', weight: 5, cost: '2 po', description: 'Pode carregar até 30 lb (15 kg) de suprimentos.' },
  { name: 'Munição - Flechas (20)', category: 'Equipamento', weight: 1, cost: '1 po', description: 'Munição para arcos.' },
  { name: 'Munição - Virotes de Besta (20)', category: 'Equipamento', weight: 1.5, cost: '1 po', description: 'Munição para bestas.' },
  { name: 'Munição - Balas de Funda (20)', category: 'Equipamento', weight: 1.5, cost: '4 pc', description: 'Munição para fundas.' },
  { name: 'Munição - Agulhas de Zarabatana (50)', category: 'Equipamento', weight: 1, cost: '1 po', description: 'Munição para zarabatanas.' },
  { name: 'Odre de Água', category: 'Equipamento', weight: 5, cost: '2 pr', description: 'Contém cerca de 2 litros de líquido.' },
  { name: 'Óleo (frasco)', category: 'Equipamento', weight: 1, cost: '1 pr', description: 'Usado para lanternas ou arremessado (pode ser incendiado para 5 de dano de fogo).' },
  { name: 'Pé de Cabra', category: 'Equipamento', weight: 5, cost: '2 po', description: 'Concede vantagem em testes de Força onde a alavanca puder ser aplicada.' },
  { name: 'Pedra de Amolar', category: 'Equipamento', weight: 1, cost: '1 pc', description: 'Usada para afiar armas cortantes/perfurantes.' },
  { name: 'Pergaminho (folha)', category: 'Equipamento', weight: 0, cost: '1 pr', description: 'Folha para escrita.' },
  { name: 'Píton', category: 'Equipamento', weight: 0.25, cost: '5 pc', description: 'Estaca de metal usada em alpinismo.' },
  { name: 'Porta-Mapas ou Pergaminhos', category: 'Equipamento', weight: 1, cost: '1 po', description: 'Tubo protetor.' },
  { name: 'Rações de Viagem (1 dia)', category: 'Equipamento', weight: 2, cost: '5 pr', description: 'Alimento desidratado e nutritivo para um dia.' },
  { name: 'Roldana e Polia', category: 'Equipamento', weight: 5, cost: '1 po', description: 'Permite erguer 4x o peso normal.' },
  { name: 'Saco de Dormir', category: 'Equipamento', weight: 7, cost: '1 po', description: 'Conforto básico para repouso.' },
  { name: 'Tenda de Duas Pessoas', category: 'Equipamento', weight: 20, cost: '2 po', description: 'Abrigo de lona simples.' },
  { name: 'Tocha', category: 'Equipamento', weight: 1, cost: '1 pc', description: 'Queima por 1 hora, fornecendo luz brilhante em um raio de 6m.' },
  { name: 'Vara (3 metros)', category: 'Equipamento', weight: 7, cost: '5 pc', description: 'Vara de madeira útil para tatear chão ou armadilhas.' },
  { name: 'Veneno Básico (frasco)', category: 'Equipamento', weight: 0, cost: '100 po', description: 'Aplicado em arma cortante/perfurante ou munição. CD 10 Constituição ou alvo sofre 1d4 de dano de veneno.' },
  { name: 'Água Benta (frasco)', category: 'Equipamento', weight: 1, cost: '25 po', description: 'Arma improvisada corpo a corpo ou distância. 2d6 dano radiante em corruptores/mortos-vivos.' },

  // Pacotes de Equipamento
  { name: 'Pacote de Assaltante', category: 'Equipamento', weight: 42, cost: '16 po', description: 'Mochila, 1000 esferas, 3m de linha, sino, 5 velas, pé de cabra, martelo, 10 pítons, lanterna coberta, 2 frascos de óleo, 5 dias de rações, odre e 15m de corda.' },
  { name: 'Pacote de Aventureiro', category: 'Equipamento', weight: 59, cost: '12 po', description: 'Mochila, pé de cabra, martelo, 10 pítons, 10 tochas, isqueiro, 10 dias de rações e odre. 15m corda amarrada.' },
  { name: 'Pacote de Diplomata', category: 'Equipamento', weight: 36, cost: '39 po', description: 'Baú, 2 caixas para mapas, roupas finas, tinta, caneta, lâmpada, 2 frascos de óleo, 5 folhas papel, perfume, cera, sabão.' },
  { name: 'Pacote de Erudito', category: 'Equipamento', weight: 11, cost: '40 po', description: 'Mochila, livro erudito, tinta, caneta, 10 folhas pergaminho, saquinho de areia, faca pequena.' },
  { name: 'Pacote de Explorador', category: 'Equipamento', weight: 59, cost: '10 po', description: 'Mochila, saco de dormir, kit de fogo, tochas, rações, odre, corda.' },
  { name: 'Pacote de Sacerdote', category: 'Equipamento', weight: 25, cost: '19 po', description: 'Mochila, cobertor, 10 velas, caixa de fogo, caixa de esmolas, incensário, vestes, rações (2), odre.' },

  // Poções
  { name: 'Poção de Cura', category: 'Poção', weight: 0.5, cost: '50 po', description: 'Restaura 2d4 + 2 pontos de vida quando bebida.' },
  { name: 'Poção de Cura Maior', category: 'Poção', weight: 0.5, cost: '150 po', description: 'Restaura 4d4 + 4 pontos de vida quando bebida.' },
  { name: 'Poção de Cura Superior', category: 'Poção', weight: 0.5, cost: '450 po', description: 'Restaura 8d4 + 8 pontos de vida quando bebida.' },
  { name: 'Poção de Cura Suprema', category: 'Poção', weight: 0.5, cost: '1350 po', description: 'Restaura 10d4 + 20 pontos de vida quando bebida.' },
  { name: 'Poção de Voo', category: 'Poção', weight: 0.5, cost: 'Incomum', description: 'Concede deslocamento de voo de 18m por 1 hora.' },
  { name: 'Poção de Invisibilidade', category: 'Poção', weight: 0.5, cost: 'Incomum', description: 'Torna o usuário invisível por 1 hora, ou até atacar ou conjurar uma magia.' },
  { name: 'Poção de Força do Gigante (Colina)', category: 'Poção', weight: 0.5, cost: 'Incomum', description: 'A Força muda para 21 por 1 hora.' },
  { name: 'Poção de Escalar', category: 'Poção', weight: 0.5, cost: 'Comum', description: 'Concede deslocamento de escalada igual ao caminhada por 1 hora.' },

  // Ferramentas
  { name: 'Ferramentas de Ladino', category: 'Ferramenta', weight: 1, cost: '25 po', description: 'Permite desarmar armadilhas e abrir fechaduras com proficiência.' },
  { name: 'Kit de Falsificação', category: 'Ferramenta', weight: 5, cost: '15 po', description: 'Inclui pequenos pergaminhos, tintas, selos para forjar documentos.' },
  { name: 'Kit de Disfarce', category: 'Ferramenta', weight: 3, cost: '25 po', description: 'Cosméticos, tintas para cabelo e adereços para disfarces.' },
  { name: 'Kit de Ervanarismo', category: 'Ferramenta', weight: 3, cost: '5 po', description: 'Para encontrar e preparar ervas e poções curativas básicas.' },
  { name: 'Kit de Navegador', category: 'Ferramenta', weight: 2, cost: '25 po', description: 'Garante proficiência para determinar posição ao navegar.' },
  { name: 'Ferramentas de Ferreiro', category: 'Ferramenta', weight: 8, cost: '20 po', description: 'Kit de artesão focado em metais.' },
  { name: 'Ferramentas de Carpinteiro', category: 'Ferramenta', weight: 6, cost: '8 po', description: 'Kit de artesão focado em madeira.' },
  { name: 'Ferramentas de Cervejeiro', category: 'Ferramenta', weight: 9, cost: '20 po', description: 'Kit de artesão focado em bebidas.' },
  { name: 'Instrumento Musical (Alaúde)', category: 'Ferramenta', weight: 2, cost: '35 po', description: 'Instrumento musical.' },
  { name: 'Instrumento Musical (Flauta)', category: 'Ferramenta', weight: 1, cost: '2 po', description: 'Instrumento musical leve.' },
  { name: 'Instrumento Musical (Lira)', category: 'Ferramenta', weight: 2, cost: '30 po', description: 'Instrumento musical sofisticado.' },

  // Tesouro
  { name: 'Gema Bruta', category: 'Tesouro', weight: 0.1, cost: '10 po', description: 'Uma pedra preciosa de valor modesto.' },
  { name: 'Joia Fina', category: 'Tesouro', weight: 0.2, cost: '100 po', description: 'Uma joia lapidada com esmero.' },
  { name: 'Anel de Ouro', category: 'Tesouro', weight: 0.1, cost: '25 po', description: 'Anel simples de ouro puro.' },
  { name: 'Estatueta de Prata', category: 'Tesouro', weight: 1, cost: '50 po', description: 'Uma pequena peça de arte.' }
];
