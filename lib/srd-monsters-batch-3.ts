import { SRDMonster } from './types';

export const BATCH_3_MONSTERS: SRDMonster[] = [
  {
    id: "urso-homem",
    name: "Urso-Homem",
    type: "Humanóide (Metamorfo)",
    size: "Médio",
    alignment: "Neutro e Bom",
    ac: 10,
    hp: 135,
    speed: "9m (12m em forma de urso)",
    cr: "5",
    xp: 1800,
    str: 19, dex: 10, con: 17, int: 11, wis: 12, cha: 12,
    damageImmunities: ["Concussão, perfurante e cortante de ataques não-mágicos que não sejam de prata"],
    abilities: [
      { name: "Metamorfo", desc: "O urso-homem pode usar sua ação para se metamorfosear em um urso Grande, em um híbrido urso-humanóide, ou de volta para sua forma verdadeira." },
      { name: "Faro Aguçado", desc: "O urso-homem tem vantagem em testes de Percepção que dependem de olfato." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Em forma de urso, faz dois ataques de garra. Em forma humanóide, faz dois ataques com machado grande. Em híbrido, faz dois: uma mordida e um garra ou machado." },
      { name: "Mordida", desc: "+7 para acertar. Acerto: 15 (2d10 + 4) perfurante. Se o alvo for um humanóide, deve testar Constituição CD 14 ou será amaldiçoado com a licantropia." },
      { name: "Garra", desc: "+7 para acertar. Acerto: 13 (2d8 + 4) cortante." },
      { name: "Machado Grande", desc: "+7 para acertar. Acerto: 10 (1d12 + 4) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Urso-Homem.png",
    tokenType: "billboard"
  },
  {
    id: "tigre-homem",
    name: "Tigre-Homem",
    type: "Humanóide (Metamorfo)",
    size: "Médio",
    alignment: "Neutro",
    ac: 12,
    hp: 120,
    speed: "9m (12m em forma de tigre)",
    cr: "4",
    xp: 1100,
    str: 17, dex: 15, con: 16, int: 10, wis: 13, cha: 11,
    damageImmunities: ["Concussão, perfurante e cortante de ataques não-mágicos que não sejam de prata"],
    abilities: [
      { name: "Metamorfo", desc: "O tigre-homem pode usar sua ação para se metamorfosear em um tigre, em um híbrido, ou voltar à sua forma verdadeira." },
      { name: "Bote", desc: "Se o tigre-homem se mover pelo menos 4,5m em linha reta em direção a um alvo antes de atacar com garras, o alvo deve testar Força CD 14 ou ficará Caído. Se cair, o tigre pode fazer um ataque de mordida contra ele." },
      { name: "Audição e Faro Aguçados", desc: "Vantagem em Percepção que dependem de audição ou olfato." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques, um com a cimitarra ou garra e um com mordida." },
      { name: "Mordida", desc: "+5 para acertar. Acerto: 8 (1d10 + 3) perfurante. Se for humanóide, CD 13 Constituição ou contrai licantropia." },
      { name: "Garra", desc: "+5 para acertar. Acerto: 7 (1d8 + 3) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Tigre-Homem.png",
    tokenType: "billboard"
  },
  {
    id: "javali-homem",
    name: "Javali-Homem",
    type: "Humanóide (Metamorfo)",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 10,
    hp: 78,
    speed: "9m (12m em forma de javali)",
    cr: "4",
    xp: 1100,
    str: 17, dex: 10, con: 15, int: 10, wis: 11, cha: 8,
    damageImmunities: ["Concussão, perfurante e cortante de ataques não-mágicos que não sejam de prata"],
    abilities: [
      { name: "Metamorfo", desc: "O javali-homem pode usar sua ação para se metamorfosear." },
      { name: "Investida", desc: "Se mover 4.5m e acertar ataque com presas, dá 7 (2d6) dano cortante adicional e Força CD 13 ou cai." },
      { name: "Implacável (Recarrega após descanso curto/longo)", desc: "Se sofrer dano (14 ou menos) que o reduziria a 0 PV, fica com 1 PV." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques, apenas um de presas." },
      { name: "Presas", desc: "+5 acertar, 10 (2d6 + 3) cortante. CD 12 Constituição p/ licantropia." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Javali-Homem.png",
    tokenType: "billboard"
  },
  {
    id: "rato-homem",
    name: "Rato-Homem",
    type: "Humanóide (Metamorfo)",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 12,
    hp: 33,
    speed: "9m",
    cr: "2",
    xp: 450,
    str: 10, dex: 15, con: 12, int: 11, wis: 10, cha: 8,
    damageImmunities: ["Concussão, perfurante e cortante de ataques não-mágicos que não sejam de prata"],
    abilities: [
      { name: "Metamorfo", desc: "Pode assumir forma de rato gigante, híbrido ou humana." },
      { name: "Faro Aguçado", desc: "Vantagem em Percepção com olfato." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques, apenas um pode ser mordida." },
      { name: "Mordida", desc: "+4 acertar, 4 (1d4 + 2) perfurante. CD 11 Constituição ou licantropia." },
      { name: "Besta de Mão", desc: "Ataque à Distância: +4 acertar. 5 (1d6 + 2) perfurante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Rato-Homem.png",
    tokenType: "billboard"
  },
  {
    id: "lobisomem",
    name: "Lobisomem",
    type: "Humanóide (Metamorfo)",
    size: "Médio",
    alignment: "Caótico e Mau",
    ac: 11,
    hp: 58,
    speed: "9m (12m forma de lobo)",
    cr: "3",
    xp: 700,
    str: 15, dex: 13, con: 14, int: 10, wis: 11, cha: 10,
    damageImmunities: ["Concussão, perfurante e cortante de ataques não-mágicos que não sejam de prata"],
    abilities: [
      { name: "Audição e Faro Aguçados", desc: "Vantagem em testes de Percepção (Audição/Olfato)." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Lança e mordida, ou mordida e garras." },
      { name: "Mordida", desc: "+4 acertar. 6 (1d8 + 2) perfurante. CD 12 Constituição para licantropia." },
      { name: "Garras", desc: "+4 acertar. 7 (2d4 + 2) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Lobisomem.png",
    tokenType: "billboard"
  },
  {
    id: "tarrasque",
    name: "Tarrasque",
    type: "Monstruosidade",
    size: "Gargântua",
    alignment: "Imparcial",
    ac: 25,
    hp: 676,
    speed: "12m",
    cr: "30",
    xp: 155000,
    str: 30, dex: 11, con: 30, int: 3, wis: 11, cha: 11,
    damageImmunities: ["Fogo", "Veneno", "Concussão, perfurante e cortante de não-mágicos"],
    conditionImmunities: ["Enfeitiçado", "Amedrontado", "Paralisado", "Envenenado"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Transforma falha em sucesso." },
      { name: "Resistência à Magia", desc: "Vantagem em saving throws contra magias." },
      { name: "Carapaça Refletora", desc: "Qualquer magia de raio, projétil mágico ou linha que acertar a carapaça sofre 1d6 (1-5 falha na magia, 6 reflete no conjurador)." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Pode usar Presença Aterradora. Faz cinco ataques: uma mordida, dois com garras, um chifre, um com a cauda." },
      { name: "Mordida", desc: "+19 para acertar. Acerto: 36 (4d12 + 10) perfurante. O alvo está agarrado." },
      { name: "Garras", desc: "+19 para acertar. Acerto: 28 (4d8 + 10) cortante." },
      { name: "Engolir", desc: "O Tarrasque faz ataque de mordida contra a criatura agarrada. Se acertar, engole e a criatura sofre 56 (16d6) dano de ácido no turno do Tarrasque." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Tarrasque.png",
    tokenType: "billboard"
  },
  {
    id: "simio-gigante",
    name: "Símio Gigante",
    type: "Besta",
    size: "Enorme",
    alignment: "Imparcial",
    ac: 12,
    hp: 157,
    speed: "12m, escalada 12m",
    cr: "7",
    xp: 2900,
    str: 23, dex: 14, con: 18, int: 7, wis: 12, cha: 7,
    abilities: [],
    actions: [
      { name: "Ataque Múltiplo", desc: "O símio faz dois ataques de punho." },
      { name: "Punho", desc: "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 3m, um alvo. Acerto: 22 (3d10 + 6) de dano de concussão." },
      { name: "Arremessar Rocha", desc: "Ataque à Distância: +9 acertar, distância 15/30m. 30 (7d6 + 6) concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Símio Gigante.png",
    tokenType: "billboard"
  },
  {
    id: "passaro-roca",
    name: "Pássaro Roca",
    type: "Monstruosidade",
    size: "Gargântua",
    alignment: "Imparcial",
    ac: 15,
    hp: 248,
    speed: "6m, voo 36m",
    cr: "11",
    xp: 7200,
    str: 28, dex: 10, con: 20, int: 3, wis: 10, cha: 9,
    abilities: [
      { name: "Visão Aguçada", desc: "O Roca tem vantagem em Percepção (visão)." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques: bico e garras." },
      { name: "Bico", desc: "+13 acertar, alcance 3m. 27 (4d8 + 9) perfurante." },
      { name: "Garras", desc: "+13 acertar, alcance 1.5m. 23 (4d6 + 9) cortante e o alvo está agarrado (CD 19 escapar)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Pássaro Roca.png",
    tokenType: "billboard"
  },
  {
    id: "morcego-gigante",
    name: "Morcego Gigante",
    type: "Besta",
    size: "Grande",
    alignment: "Imparcial",
    ac: 13,
    hp: 22,
    speed: "3m, voo 18m",
    cr: "1/4",
    xp: 50,
    str: 15, dex: 16, con: 11, int: 2, wis: 12, cha: 6,
    abilities: [
      { name: "Ecolocalização", desc: "Morcego gigante tem visão cega de 18m se não estiver surdo." },
      { name: "Audição Aguçada", desc: "Vantagem em Percepção (audição)." }
    ],
    actions: [
      { name: "Mordida", desc: "+4 acertar. Acerto: 5 (1d6 + 2) perfurante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Morcego Gigante.png",
    tokenType: "billboard"
  },
  {
    id: "escorpiao-gigante",
    name: "Escorpião Gigante",
    type: "Besta",
    size: "Grande",
    alignment: "Imparcial",
    ac: 15,
    hp: 52,
    speed: "12m",
    cr: "3",
    xp: 700,
    str: 15, dex: 13, con: 15, int: 1, wis: 9, cha: 3,
    abilities: [
      { name: "Visão Cega", desc: "18 metros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques de pinça e um com o ferrão." },
      { name: "Pinça", desc: "+4 acertar, alcance 1.5m. 6 (1d8 + 2) concussão. Alvo é agarrado (fuga CD 12). Só pode agarrar até 2 ao mesmo tempo." },
      { name: "Ferrão", desc: "+4 acertar. 7 (1d10 + 2) perfurante. Teste de Constituição CD 12 ou 22 (4d10) veneno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Escorpião Gigante.png",
    tokenType: "billboard"
  },
  {
    id: "lobo-do-inverno",
    name: "Lobo do Inverno",
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Neutro e Mau",
    ac: 13,
    hp: 75,
    speed: "15m",
    cr: "3",
    xp: 700,
    str: 18, dex: 13, con: 14, int: 7, wis: 12, cha: 8,
    damageImmunities: ["Frio"],
    abilities: [
      { name: "Camuflagem na Neve", desc: "Vantagem em Furtividade quando há neve." },
      { name: "Audição e Faro Aguçados", desc: "Vantagem em Percepção com som/cheiro." },
      { name: "Táticas de Matilha", desc: "Vantagem no ataque corpo-a-corpo se aliado estiver adjacente." }
    ],
    actions: [
      { name: "Mordida", desc: "+6 acertar, 11 (2d6 + 4) perfurante. Se for criatura grande ou menor, deve testar Força CD 14 ou ficará Caída." },
      { name: "Sopro de Frio (Recarga 5-6)", desc: "Cone de 4.5m. Destreza CD 12. Falha: 18 (4d8) de dano de frio." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Lobo do Inverno.png",
    tokenType: "billboard"
  },
  {
    id: "yeti",
    name: "Yeti",
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 12,
    hp: 51,
    speed: "12m, escalada 12m",
    cr: "3",
    xp: 700,
    str: 18, dex: 13, con: 16, int: 8, wis: 12, cha: 7,
    damageImmunities: ["Frio"],
    damageVulnerabilities: ["Fogo"],
    abilities: [
      { name: "Faro Aguçado", desc: "Vantagem em Percepção." },
      { name: "Camuflagem na Neve", desc: "Vantagem em Furtividade na neve." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Pode usar Olhar Chilling e dois ataques de garras." },
      { name: "Garras", desc: "+6 acertar, 7 (1d6 + 4) cortante mais 3 (1d6) frio." },
      { name: "Olhar Gélido", desc: "Criatura a até 9m faz teste de Constituição CD 13. Falha: 10 (3d6) dano de frio e fica paralisada por 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Yeti.png",
    tokenType: "billboard"
  },
  {
    id: "troglodita",
    name: "Troglodita",
    type: "Humanóide",
    size: "Médio",
    alignment: "Caótico e Mau",
    ac: 11,
    hp: 13,
    speed: "9m",
    cr: "1/4",
    xp: 50,
    str: 14, dex: 10, con: 14, int: 6, wis: 10, cha: 6,
    abilities: [
      { name: "Fedor", desc: "Qualquer criatura que não seja troglodita a 1.5m, deve testar Constituição CD 12 ou fica Envenenada (tem desvantagem em ataques)." },
      { name: "Camaleão (Subterrâneo)", desc: "Vantagem em furtividade se esconder em rochas." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Três ataques: mordida, duas garras." },
      { name: "Mordida", desc: "+4 acertar, 4 (1d4 + 2) perfurante." },
      { name: "Garra", desc: "+4 acertar, 4 (1d4 + 2) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Troglodita.png",
    tokenType: "billboard"
  },
  {
    id: "naga-de-ossos",
    name: "Naga de Ossos",
    type: "Morto-Vivo",
    size: "Grande",
    alignment: "Leal e Mau",
    ac: 15,
    hp: 58,
    speed: "9m",
    cr: "4",
    xp: 1100,
    str: 15, dex: 16, con: 12, int: 15, wis: 15, cha: 16,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Enfeitiçado", "Exausto", "Paralisado", "Envenenado"],
    abilities: [
      { name: "Conjuração Inata", desc: "Ela lança magias de mago (CD 12, +4 acertar)." }
    ],
    actions: [
      { name: "Mordida", desc: "+5 acertar, 10 (2d6 + 3) perfurante mais 10 (3d6) veneno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Naga de Ossos.png",
    tokenType: "billboard"
  },
  {
    id: "beholder-zumbi",
    name: "Beholder Zumbi",
    type: "Morto-Vivo",
    size: "Grande",
    alignment: "Neutro e Mau",
    ac: 15,
    hp: 93,
    speed: "0m, voo 6m (flutuar)",
    cr: "5",
    xp: 1800,
    str: 10, dex: 8, con: 16, int: 3, wis: 8, cha: 5,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado", "Enfeitiçado", "Paralisado", "Exausto", "Amedrontado", "Derrubado"],
    abilities: [
      { name: "Fortitude Zumbi", desc: "Se o dano reduzi-lo a 0 PV, exceto se for radiante ou acerto crítico, rola Constituição com CD de 5 + Dano recebido. Se passar, cai para 1 PV em vez disso." }
    ],
    actions: [
      { name: "Mordida", desc: "+3 acertar, 14 (4d6) perfurante." },
      { name: "Raios Oculares (1 raio aleatório)", desc: "1: Medo, 2: Paralisia, 3: Enervação (36 dano necrótico), 4: Desintegração (45 dano de força). Testa CD 14 p/ evitar." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Beholder Zumbi.png",
    tokenType: "billboard"
  },
  {
    id: "thri-kreen",
    name: "Thri-kreen",
    type: "Humanóide",
    size: "Médio",
    alignment: "Caótico e Neutro",
    ac: 15,
    hp: 33,
    speed: "12m",
    cr: "1",
    xp: 200,
    str: 12, dex: 15, con: 13, int: 8, wis: 12, cha: 7,
    abilities: [
      { name: "Carapaça de Camuflagem", desc: "O thri-kreen tem vantagem em Furtividade para se esconder no deserto." },
      { name: "Não precisa dormir", desc: "Ele não dorme e a magia não pode colocá-lo pra dormir." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques: garras e mordida, ou machado giatki." },
      { name: "Mordida", desc: "+3 acertar, 4 (1d6 + 1) perfurante, o alvo deve fazer teste Constituição CD 11 ou fica Envenenado e paralisado por 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Thri-kreen.png",
    tokenType: "billboard"
  },
  {
    id: "svirfneblin",
    name: "Svirfneblin - Gnomo das Profundezas",
    type: "Humanóide",
    size: "Pequeno",
    alignment: "Neutro e Bom",
    ac: 15,
    hp: 16,
    speed: "6m",
    cr: "1/2",
    xp: 100,
    str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 9,
    abilities: [
      { name: "Resistência Mágica dos Gnomos", desc: "Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma contra magia." },
      { name: "Furtividade em Pedra", desc: "Vantagem para se esconder em rochas." }
    ],
    actions: [
      { name: "Dardo Envenenado", desc: "Ataque à dist.: +4 acertar. 4 (1d4 + 2) perfurante e alvo testar Constituição CD 12 ou ser envenenado." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Svirfneblin - Gnomo das Profundezas.png",
    tokenType: "billboard"
  },
  {
    id: "neotelideo",
    name: "Neotelídeo",
    type: "Aberração",
    size: "Gargântua",
    alignment: "Caótico e Mau",
    ac: 16,
    hp: 237,
    speed: "9m, escavação 12m",
    cr: "13",
    xp: 10000,
    str: 27, dex: 7, con: 21, int: 16, wis: 16, cha: 15,
    damageImmunities: ["Veneno", "Psíquico"],
    abilities: [
      { name: "Sentir Criaturas", desc: "Sabe a localização de qualquer criatura com int > 3 a 36 metros." },
      { name: "Telepatia Ilithid", desc: "Ele se comunica diretamente na mente dos outros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Quatro ataques de tentáculos. Pode usar Engolir ou Extrato de Cérebro no lugar de um." },
      { name: "Tentáculos", desc: "+13 acertar, 21 (3d8 + 8) concussão. O alvo é agarrado e puxado." },
      { name: "Engolir", desc: "Ataque com tentáculos. Se acertar, engole uma criatura Grande ou menor, 10d6 de ácido por turno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Neotelídeo.png",
    tokenType: "billboard"
  },
  {
    id: "garra-rastejante",
    name: "Garra Rastejante",
    type: "Morto-Vivo",
    size: "Miúdo",
    alignment: "Neutro e Mau",
    ac: 12,
    hp: 2,
    speed: "6m, escalada 6m",
    cr: "0",
    xp: 10,
    str: 13, dex: 14, con: 11, int: 5, wis: 10, cha: 4,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado", "Amedrontado", "Enfeitiçado"],
    abilities: [
      { name: "Visão Cega", desc: "9 metros." }
    ],
    actions: [
      { name: "Arranhão", desc: "+3 acertar, 3 (1d4 + 1) cortante ou concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Garra Rastejante.png",
    tokenType: "billboard"
  },
  {
    id: "verme-da-morte",
    name: "Verme da Morte",
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Neutro",
    ac: 15,
    hp: 95,
    speed: "9m, escavação 9m",
    cr: "6",
    xp: 2300,
    str: 18, dex: 14, con: 18, int: 3, wis: 10, cha: 3,
    damageImmunities: ["Elétrico", "Ácido"],
    abilities: [
      { name: "Choque Subterrâneo", desc: "Enquanto escava no solo, pode enviar um tremor de energia. Teste de Destreza CD 15 ou sofre 18 (4d8) elétrico e fica Lento." }
    ],
    actions: [
      { name: "Mordida Ácida", desc: "+7 para acertar. Acerto: 13 (2d8 + 4) perfurante mais 14 (4d6) de ácido." },
      { name: "Choque Estático (Recarga 5-6)", desc: "Cone 9m. Destreza CD 15, 36 (8d8) elétrico." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Verme da Morte.png",
    tokenType: "billboard"
  }
];
