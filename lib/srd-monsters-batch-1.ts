import { SRDMonster } from './types';

export const BATCH_1_MONSTERS: SRDMonster[] = [
  {
    id: "dragao-vermelho",
    name: "Dragão Vermelho",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 19,
    hp: 256,
    speed: "12m, escalada 12m, voo 24m",
    cr: "17",
    xp: 18000,
    str: 27, dex: 10, con: 25, int: 16, wis: 13, cha: 21,
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão pode usar sua Presença Aterradora. Em seguida, ele faz três ataques: um com sua mordida e dois com suas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 3m, um alvo. Acerto: 19 (2d10 + 8) de dano perfurante mais 7 (2d6) de dano de fogo." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 1.5m, um alvo. Acerto: 15 (2d6 + 8) de dano cortante." },
      { name: "Cauda", desc: "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 4.5m, um alvo. Acerto: 17 (2d8 + 8) de dano de concussão." },
      { name: "Presença Aterradora", desc: "Cada criatura à escolha do dragão que esteja a até 36 metros do dragão e ciente dele deve ser bem-sucedida em um teste de resistência de Sabedoria CD 19 ou ficará Amedrontada por 1 minuto. Uma criatura pode repetir o teste de resistência no final de cada um de seus turnos, terminando o efeito sobre si em um sucesso." },
      { name: "Sopro de Fogo (Recarga 5-6)", desc: "O dragão exala fogo num cone de 18 metros. Cada criatura na área deve fazer um teste de resistência de Destreza CD 21, sofrendo 63 (18d6) de dano de fogo em uma falha, ou metade desse dano em um sucesso." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Vermelho.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-verde",
    name: "Dragão Verde",
    type: "Dragão",
    size: "Enorme",
    alignment: "Leal e Mau",
    ac: 19,
    hp: 207,
    speed: "12m, natação 12m, voo 24m",
    cr: "15",
    xp: 13000,
    str: 23, dex: 12, con: 21, int: 18, wis: 15, cha: 17,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." },
      { name: "Anfíbio", desc: "O dragão pode respirar ar e água." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão pode usar sua Presença Aterradora. Em seguida, ele faz três ataques: um com sua mordida e dois com suas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m, um alvo. Acerto: 17 (2d10 + 6) de dano perfurante mais 7 (2d6) de dano de veneno." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 1.5m, um alvo. Acerto: 13 (2d6 + 6) de dano cortante." },
      { name: "Cauda", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 4.5m, um alvo. Acerto: 15 (2d8 + 6) de dano de concussão." },
      { name: "Presença Aterradora", desc: "Cada criatura à escolha do dragão que esteja a até 36 metros do dragão deve ser bem-sucedida em um teste de resistência de Sabedoria CD 16 ou ficará Amedrontada por 1 minuto." },
      { name: "Sopro Venenoso (Recarga 5-6)", desc: "O dragão exala gás venenoso em um cone de 18 metros. Cada criatura na área deve fazer um teste de resistência de Constituição CD 18, sofrendo 56 (16d6) de dano de veneno em uma falha, ou metade desse dano em um sucesso." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Verde.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-vampirico",
    name: "Dragão Vampírico",
    type: "Morto-Vivo (Dragão)",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 19,
    hp: 225,
    speed: "12m, voo 24m",
    cr: "16",
    xp: 15000,
    str: 24, dex: 14, con: 22, int: 16, wis: 15, cha: 19,
    damageResistances: ["Necrótico"],
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado", "Enfeitiçado", "Exausto"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." },
      { name: "Regeneração", desc: "O dragão recupera 20 pontos de vida no início de seu turno se não sofreu dano radiante ou dano de água benta no turno anterior." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão faz três ataques: um com sua mordida drenante e dois com suas garras." },
      { name: "Mordida Drenante", desc: "Ataque Corpo-a-Corpo com Arma: +12 para acertar, alcance 3m, um alvo. Acerto: 18 (2d10 + 7) de dano perfurante mais 14 (4d6) de dano necrótico. O máximo de pontos de vida do alvo é reduzido numa quantidade igual ao dano necrótico sofrido, e o dragão recupera essa mesma quantidade de pontos de vida." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +12 para acertar, alcance 1.5m, um alvo. Acerto: 14 (2d6 + 7) de dano cortante." },
      { name: "Sopro de Sombras Drenantes (Recarga 5-6)", desc: "O dragão exala uma energia negra em um cone de 18 metros. Cada criatura deve fazer um teste de resistência de Constituição CD 19, sofrendo 49 (14d6) de dano necrótico em uma falha, ou metade desse dano em um sucesso. Uma criatura morta por esse dano ergue-se como uma sombra sob controle do dragão no turno seguinte." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Vampirico.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-radiante",
    name: "Dragão Radiante",
    type: "Celestial (Dragão)",
    size: "Enorme",
    alignment: "Leal e Bom",
    ac: 20,
    hp: 243,
    speed: "15m, voo 27m",
    cr: "18",
    xp: 20000,
    str: 25, dex: 14, con: 23, int: 18, wis: 19, cha: 23,
    damageImmunities: ["Radiante", "Fogo"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." },
      { name: "Iluminação Majestosa", desc: "O dragão emite luz plena em um raio de 18 metros e penumbra por mais 18 metros. Inimigos dentro da luz plena têm desvantagem em testes de resistência contra as habilidades do dragão." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão faz três ataques: um com sua mordida e dois com suas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +13 para acertar, alcance 3m, um alvo. Acerto: 18 (2d10 + 7) de dano perfurante mais 11 (2d10) de dano radiante." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +13 para acertar, alcance 1.5m, um alvo. Acerto: 14 (2d6 + 7) de dano cortante." },
      { name: "Sopro Prismático (Recarga 5-6)", desc: "O dragão exala luz radiante e multicolorida em um cone de 27 metros. Cada criatura na área deve fazer um teste de resistência de Constituição CD 20, sofrendo 71 (13d10) de dano radiante e ficando cega por 1 minuto em uma falha. Em um sucesso, sofre metade do dano e não fica cega." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Radiante.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-negro",
    name: "Dragão Negro",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 19,
    hp: 195,
    speed: "12m, natação 12m, voo 24m",
    cr: "14",
    xp: 11500,
    str: 23, dex: 14, con: 21, int: 14, wis: 13, cha: 15,
    damageImmunities: ["Ácido"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." },
      { name: "Anfíbio", desc: "O dragão pode respirar ar e água." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão pode usar sua Presença Aterradora. Em seguida, faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m, um alvo. Acerto: 17 (2d10 + 6) de dano perfurante mais 4 (1d8) de dano de ácido." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 1.5m, um alvo. Acerto: 13 (2d6 + 6) de dano cortante." },
      { name: "Presença Aterradora", desc: "Cada criatura a até 36 metros que o dragão escolher deve ser bem-sucedida em um teste de resistência de Sabedoria CD 16 ou ficará Amedrontada por 1 minuto." },
      { name: "Sopro de Ácido (Recarga 5-6)", desc: "O dragão exala ácido em uma linha de 18 metros de comprimento e 1.5m de largura. Cada criatura nessa linha deve fazer um teste de resistência de Destreza CD 18, sofrendo 54 (12d8) de dano de ácido em uma falha, ou metade desse dano em um sucesso." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Negro.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-fantasma",
    name: "Dragão Fantasma",
    type: "Morto-Vivo (Dragão)",
    size: "Enorme",
    alignment: "Neutro e Mau",
    ac: 15,
    hp: 172,
    speed: "0m, voo 24m (flutuar)",
    cr: "14",
    xp: 11500,
    str: 7, dex: 16, con: 18, int: 14, wis: 14, cha: 18,
    damageResistances: ["Ácido", "Fogo", "Elétrico", "Trovejante", "Cortante, perfurante e concussão de armas não-mágicas"],
    damageImmunities: ["Frio", "Necrótico", "Veneno"],
    conditionImmunities: ["Enfeitiçado", "Exausto", "Amedrontado", "Agarrado", "Paralisado", "Petrificado", "Envenenado", "Caído", "Impedido"],
    abilities: [
      { name: "Movimento Incorpóreo", desc: "O dragão pode se mover através de outras criaturas e objetos como se eles fossem terreno difícil. Sofre 5 (1d10) de dano de força se terminar seu turno dentro de um objeto." },
      { name: "Visão no Escuro", desc: "36 metros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão faz dois ataques de Mordida Espectral." },
      { name: "Mordida Espectral", desc: "Ataque Corpo-a-Corpo com Magia: +9 para acertar, alcance 3m, um alvo. Acerto: 26 (4d10 + 4) de dano necrótico." },
      { name: "Sopro de Desespero (Recarga 5-6)", desc: "O dragão exala um vento congelante do submundo num cone de 18 metros. Cada criatura deve fazer um teste de resistência de Sabedoria CD 17. Em falha, sofre 45 (10d8) de dano psíquico e fica Amedrontada por 1 minuto. Em sucesso, sofre metade e não fica amedrontada." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Fantasma.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-etereo",
    name: "Dragão Etéreo",
    type: "Dragão",
    size: "Enorme",
    alignment: "Neutro",
    ac: 18,
    hp: 195,
    speed: "12m, voo 24m",
    cr: "14",
    xp: 11500,
    str: 20, dex: 20, con: 19, int: 16, wis: 16, cha: 17,
    damageResistances: ["Concussão, perfurante e cortante de ataques não-mágicos"],
    abilities: [
      { name: "Fase Etérea", desc: "Como uma ação bônus, o dragão pode transitar do Plano Material para o Plano Etéreo, e vice-versa." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 3m, um alvo. Acerto: 16 (2d10 + 5) de dano perfurante." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 1.5m, um alvo. Acerto: 12 (2d6 + 5) de dano cortante mais 4 (1d8) de dano de força." },
      { name: "Sopro de Força (Recarga 5-6)", desc: "O dragão exala energia pura num cone de 18 metros. Cada criatura deve fazer um teste de resistência de Destreza CD 17, sofrendo 54 (12d8) de dano de força em falha, ou metade em sucesso." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Etéreo.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-topazio",
    name: "Dragão de Topázio",
    type: "Dragão (Gema)",
    size: "Enorme",
    alignment: "Caótico e Neutro",
    ac: 18,
    hp: 212,
    speed: "12m, natação 12m, voo 24m",
    cr: "14",
    xp: 11500,
    str: 21, dex: 12, con: 21, int: 18, wis: 17, cha: 18,
    damageResistances: ["Frio", "Fogo"],
    damageImmunities: ["Necrótico"],
    abilities: [
      { name: "Anfíbio", desc: "O dragão pode respirar ar e água." },
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 3m, um alvo. Acerto: 16 (2d10 + 5) de dano perfurante mais 5 (1d10) de dano necrótico." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 1.5m, um alvo. Acerto: 12 (2d6 + 5) de dano cortante." },
      { name: "Sopro Desidratante (Recarga 5-6)", desc: "O dragão exala um feixe de energia necrótica amarela em uma linha de 27m de comprimento por 1.5m de largura. Cada criatura nessa linha faz teste de Constituição CD 18, sofrendo 55 (10d10) de dano necrótico e ficando enfraquecida (Força tem desvantagem) por 1 minuto em falha. Em sucesso, metade do dano." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Topazio.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-safira",
    name: "Dragão de Safira",
    type: "Dragão (Gema)",
    size: "Enorme",
    alignment: "Leal e Neutro",
    ac: 19,
    hp: 225,
    speed: "12m, escavação 12m, voo 24m",
    cr: "15",
    xp: 13000,
    str: 23, dex: 14, con: 21, int: 18, wis: 19, cha: 18,
    damageResistances: ["Elétrico"],
    damageImmunities: ["Trovejante"],
    abilities: [
      { name: "Andar de Aranha", desc: "O dragão pode escalar superfícies difíceis, incluindo andar no teto de ponta cabeça, sem teste de habilidade." },
      { name: "Resistência Lendária (3/Dia)", desc: "Se falhar num teste de resistência, pode escolher obter sucesso." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m, um alvo. Acerto: 17 (2d10 + 6) de dano perfurante mais 5 (1d10) de dano trovejante." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 1.5m, um alvo. Acerto: 13 (2d6 + 6) de dano cortante." },
      { name: "Sopro Ressonante (Recarga 5-6)", desc: "O dragão exala um cone de 18 metros de vibração sônica intensa. Teste de resistência de Constituição CD 18. Falha: 55 (10d10) de dano trovejante e a criatura fica incapacitada por 1 turno. Sucesso: Metade do dano." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Safira.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-prata",
    name: "Dragão de Prata",
    type: "Dragão",
    size: "Enorme",
    alignment: "Leal e Bom",
    ac: 19,
    hp: 243,
    speed: "12m, voo 24m",
    cr: "16",
    xp: 15000,
    str: 27, dex: 10, con: 25, int: 16, wis: 13, cha: 21,
    damageImmunities: ["Frio"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Pode escolher transformar uma falha num teste de resistência em um sucesso." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão pode usar sua Presença Aterradora. Em seguida, faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +13 para acertar, alcance 3m, um alvo. Acerto: 19 (2d10 + 8) de dano perfurante." },
      { name: "Sopros (Recarga 5-6)", desc: "O dragão usa uma das seguintes armas de sopro:\n1. Sopro de Frio: Cone de 27 metros, teste de Constituição CD 20, 58 (13d8) dano de frio em falha (metade em sucesso).\n2. Sopro Paralisante: Cone de 27 metros. Criaturas falhando no teste de CON CD 20 ficam Paralisadas por 1 minuto (salvam no final de seus turnos)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Prata.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-ouro",
    name: "Dragão de Ouro",
    type: "Dragão",
    size: "Enorme",
    alignment: "Leal e Bom",
    ac: 19,
    hp: 256,
    speed: "12m, voo 24m, natação 12m",
    cr: "17",
    xp: 18000,
    str: 27, dex: 14, con: 25, int: 16, wis: 15, cha: 24,
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Pode escolher transformar falha em sucesso num teste de resistência." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Presença Aterradora (CD 21), e faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +14 para acertar, alcance 3m. Acerto: 19 (2d10 + 8) de dano perfurante." },
      { name: "Sopros (Recarga 5-6)", desc: "Escolha um:\n1. Sopro de Fogo: Cone de 27m, Destreza CD 21. Falha sofre 66 (12d10) dano de fogo (metade em sucesso).\n2. Sopro de Enfraquecimento: Cone de 27m, Força CD 21. Falha dá desvantagem em todos os ataques, testes e saves baseados em Força por 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Ouro.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-ossos",
    name: "Dragão de Ossos",
    type: "Morto-Vivo (Dragão)",
    size: "Enorme",
    alignment: "Neutro e Mau",
    ac: 16,
    hp: 189,
    speed: "12m",
    cr: "11",
    xp: 7200,
    str: 21, dex: 10, con: 19, int: 5, wis: 11, cha: 5,
    damageVulnerabilities: ["Concussão"],
    damageImmunities: ["Veneno", "Necrótico"],
    conditionImmunities: ["Exausto", "Envenenado"],
    abilities: [
      { name: "Natureza Morta-Viva", desc: "Não precisa respirar, comer, beber ou dormir." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +9 para acertar, alcance 3m. Acerto: 16 (2d10 + 5) perfurante." },
      { name: "Sopro de Estilhaços (Recarga 5-6)", desc: "Cospe lascas de osso afiadas num cone de 18 metros. Destreza CD 16. Falha: 45 (10d8) dano perfurante. Sucesso: Metade." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Ossos.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-obsidiana",
    name: "Dragão de Obsidiana",
    type: "Dragão (Gema)",
    size: "Enorme",
    alignment: "Neutro e Mau",
    ac: 20,
    hp: 212,
    speed: "12m, voo 24m, escavação 12m",
    cr: "14",
    xp: 11500,
    str: 24, dex: 10, con: 22, int: 15, wis: 14, cha: 17,
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Armadura de Vidro Vulcânico", desc: "Qualquer criatura que acertar o dragão com um ataque corpo-a-corpo sem alcance sofre 4 (1d8) de dano cortante devido às bordas afiadas de suas escamas." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques (uma mordida e duas garras)." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m. Acerto: 17 (2d10 + 6) perfurante mais 7 (2d6) dano de fogo." },
      { name: "Sopro Magmático (Recarga 5-6)", desc: "Exala um rio de lava de 18m por 1.5m. Destreza CD 18. Falha: 54 (12d8) de dano de fogo. A lava adere ao chão por 1 rodada transformando a área em terreno difícil e causando dano caso passem." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Obsidiana.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-mercurio",
    name: "Dragão de Mercúrio",
    type: "Dragão (Metálico)",
    size: "Enorme",
    alignment: "Caótico e Bom",
    ac: 19,
    hp: 195,
    speed: "18m, voo 30m",
    cr: "14",
    xp: 11500,
    str: 22, dex: 22, con: 18, int: 17, wis: 15, cha: 16,
    damageImmunities: ["Fogo", "Veneno"],
    abilities: [
      { name: "Aceleração Imprevisível", desc: "O dragão pode realizar a ação de Disparar ou Desengajar como uma ação bônus em cada um dos seus turnos." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m. Acerto: 17 (2d10 + 6) perfurante." },
      { name: "Sopros (Recarga 5-6)", desc: "O dragão escolhe um:\n1. Raio Solar Congelado: Linha de 18m, Destreza CD 17, 54 (12d8) de dano de calor e frio combinados.\n2. Névoa Desorientadora: Cone de 18m. Criaturas na área testam Constituição CD 17 ou ficam Cegas por 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Mercúrio.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-latao",
    name: "Dragão de Latão",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Bom",
    ac: 18,
    hp: 172,
    speed: "12m, escavação 9m, voo 24m",
    cr: "13",
    xp: 10000,
    str: 23, dex: 10, con: 21, int: 14, wis: 13, cha: 17,
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Opcionalmente obtém sucesso num teste falho." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques (1 mordida, 2 garras)." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo: +11 para acertar. Acerto: 17 (2d10 + 6) perfurante." },
      { name: "Sopros (Recarga 5-6)", desc: "1. Fogo: Linha de 18m. CD 18 de Destreza, 45 (13d6) dano de fogo.\n2. Gás do Sono: Cone de 18m. CD 18 Constituição ou fica Inconsciente por 10 minutos (acorda se receber dano)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Latão.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-ferro",
    name: "Dragão de Ferro",
    type: "Dragão (Metálico)",
    size: "Enorme",
    alignment: "Leal e Neutro",
    ac: 21,
    hp: 225,
    speed: "9m, voo 18m",
    cr: "15",
    xp: 13000,
    str: 26, dex: 10, con: 23, int: 16, wis: 15, cha: 16,
    damageResistances: ["Cortante, perfurante e concussão de magias ou armas não adamantinas"],
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Carapaça Pesada", desc: "O dragão não pode sofrer acertos críticos de armas não-adamantinas." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo: +13 para acertar. Acerto: 19 (2d10 + 8) perfurante." },
      { name: "Sopros (Recarga 5-6)", desc: "1. Centelhas: Cone de 18m, Destreza CD 19, 55 (10d10) dano elétrico e de fogo divididos.\n2. Gás Sonífero Pesado: Cone de 18m, Constituição CD 19, ficam Lentos (como a magia lentidão) e Exaustos." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Ferro.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-esmeralda",
    name: "Dragão de Esmeralda",
    type: "Dragão (Gema)",
    size: "Enorme",
    alignment: "Leal e Neutro",
    ac: 18,
    hp: 195,
    speed: "12m, voo 24m",
    cr: "14",
    xp: 11500,
    str: 21, dex: 14, con: 21, int: 18, wis: 17, cha: 18,
    damageResistances: ["Fogo"],
    damageImmunities: ["Psíquico"],
    abilities: [
      { name: "Passo Distorcido", desc: "O dragão pode se teletransportar até 18 metros como uma ação bônus antes ou depois de realizar seu Sopro." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Três ataques." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo: +10 para acertar. Acerto: 16 (2d10 + 5) perfurante mais 7 (2d6) psíquico." },
      { name: "Sopro de Distorção Sensorial (Recarga 5-6)", desc: "Cone de 18 metros. Teste de Inteligência CD 18. Falha: 42 (12d6) dano psíquico e fica desorientada, sem poder realizar reações até o fim de seu próximo turno. Sucesso: Metade." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Esmeralda.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-cristal",
    name: "Dragão de Cristal",
    type: "Dragão (Gema)",
    size: "Enorme",
    alignment: "Caótico e Bom",
    ac: 16,
    hp: 172,
    speed: "12m, voo 24m, natação 12m, escalada 12m",
    cr: "12",
    xp: 8400,
    str: 21, dex: 14, con: 19, int: 18, wis: 15, cha: 19,
    damageResistances: ["Radiante", "Frio"],
    abilities: [
      { name: "Fração Estelar", desc: "Emite luz plena de 9m." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Três ataques." },
      { name: "Mordida", desc: "+9 acertar, 16 (2d10 + 5) perfurante + 5 radiante." },
      { name: "Sopro Refulgente (Recarga 5-6)", desc: "Cone de 18 metros. Destreza CD 16. Falha: 45 (10d8) dano radiante e o dragão absorve energia, ganhando PV temporário igual a metade do dano total causado." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Cristal.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-bronze",
    name: "Dragão de Bronze",
    type: "Dragão",
    size: "Enorme",
    alignment: "Leal e Bom",
    ac: 19,
    hp: 212,
    speed: "12m, natação 12m, voo 24m",
    cr: "15",
    xp: 13000,
    str: 25, dex: 10, con: 23, int: 16, wis: 15, cha: 19,
    damageImmunities: ["Elétrico"],
    abilities: [
      { name: "Anfíbio", desc: "Pode respirar na água." }
    ],
    actions: [
      { name: "Sopros (Recarga 5-6)", desc: "1. Relâmpago: Linha de 27m, Destreza CD 19, 66 (12d10) dano elétrico.\n2. Gás de Repulsão: Cone de 18m, Força CD 19, alvo empurrado 18 metros e jogado caído." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Bronze.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-aco",
    name: "Dragão de Aço",
    type: "Dragão (Metálico)",
    size: "Enorme",
    alignment: "Leal e Neutro",
    ac: 18,
    hp: 195,
    speed: "12m, voo 24m",
    cr: "13",
    xp: 10000,
    str: 23, dex: 14, con: 21, int: 16, wis: 16, cha: 17,
    damageResistances: ["Veneno", "Ácido"],
    abilities: [
      { name: "Metamorfose Superior", desc: "O dragão frequentemente assume forma humana por anos. Suas estatísticas permanecem as mesmas." }
    ],
    actions: [
      { name: "Sopros (Recarga 5-6)", desc: "1. Cubo de Tóxico Ácido: Cone de 18m, Constituição CD 18, 49 (11d8) dano de veneno.\n2. Esfera Enlaçante: Lança uma rede magnética até 27m que explode, enraizando alvos num raio de 6m." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Aço.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-ametista",
    name: "Dragão de Ametista",
    type: "Dragão (Gema)",
    size: "Enorme",
    alignment: "Neutro",
    ac: 19,
    hp: 229,
    speed: "12m, voo 24m (flutuar), natação 12m",
    cr: "16",
    xp: 15000,
    str: 21, dex: 14, con: 21, int: 20, wis: 17, cha: 20,
    damageResistances: ["Psíquico", "Força"],
    abilities: [
      { name: "Gravidade Pessoal", desc: "O dragão flutua independentemente da gravidade local." }
    ],
    actions: [
      { name: "Sopro de Singularidade (Recarga 5-6)", desc: "O dragão cospe um orbe esmagador de gravidade. Raio de 18 metros a partir de um ponto escolhido. Força CD 19, 60 (11d10) dano de força, a criatura é puxada para o centro e fica Caída." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Ametista.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-de-adamante",
    name: "Dragão de Adamante",
    type: "Dragão (Metálico)",
    size: "Enorme",
    alignment: "Neutro e Bom",
    ac: 22,
    hp: 250,
    speed: "12m, voo 24m",
    cr: "17",
    xp: 18000,
    str: 28, dex: 10, con: 24, int: 14, wis: 15, cha: 16,
    damageImmunities: ["Concussão, cortante e perfurante de ataques não mágicos", "Fogo"],
    abilities: [
      { name: "Indestrutível", desc: "Sempre que o dragão recebe 15 ou menos de dano antes de calcular resistências, o dano é reduzido a 0." }
    ],
    actions: [
      { name: "Mordida", desc: "+15 acertar, 20 (2d10 + 9) perfurante." },
      { name: "Sopro Sísmico (Recarga 5-6)", desc: "Um rosnado poderoso cria um cone de estrondo de 27 metros. Constituição CD 21. Falha: 66 (12d10) dano trovejante, Surdo por 1 hora, Caído. Sucesso: Metade." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão de Adamante.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-das-sombras",
    name: "Dragão das Sombras",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 19,
    hp: 256,
    speed: "12m, voo 24m",
    cr: "17",
    xp: 18000,
    str: 27, dex: 10, con: 25, int: 16, wis: 13, cha: 21,
    damageResistances: ["Necrótico"],
    abilities: [
      { name: "Esconder-se nas Sombras", desc: "Enquanto sob penumbra ou escuridão, o dragão pode fazer ação Esconder-se como ação bônus." },
      { name: "Furtividade Umbral", desc: "Resistência a todo dano exceto força, radiante ou psíquico, se estiver em escuridão." }
    ],
    actions: [
      { name: "Sopro Umbral (Recarga 5-6)", desc: "Cone de 18m. Constituição CD 21, falha 63 (18d6) de dano necrótico. Criaturas mortas se levantam como Sombras vivas no turno seguinte sob controle do dragão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão das Sombras.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-das-profundezas",
    name: "Dragão das Profundezas",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 17,
    hp: 207,
    speed: "12m, escavação 9m, voo 24m",
    cr: "14",
    xp: 11500,
    str: 23, dex: 14, con: 21, int: 16, wis: 14, cha: 17,
    damageResistances: ["Veneno"],
    abilities: [
      { name: "Visão no Escuro Superior", desc: "O dragão enxerga a 36 metros de forma perfeita na mais profunda escuridão." }
    ],
    actions: [
      { name: "Sopro de Esporos Alucinógenos (Recarga 5-6)", desc: "Cone de 18m. Sabedoria CD 18, sofrendo 45 (10d8) psíquico e ficando enfeitiçada, obrigada a usar seu turno para atacar o alvo mais próximo escolhido pelo dragão (se falhar). Dura 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão das Profundezas.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-da-pedra-da-lua",
    name: "Dragão da Pedra da Lua",
    type: "Dragão",
    size: "Enorme",
    alignment: "Neutro",
    ac: 18,
    hp: 195,
    speed: "12m, voo 24m",
    cr: "15",
    xp: 13000,
    str: 20, dex: 18, con: 19, int: 18, wis: 19, cha: 21,
    damageResistances: ["Radiante"],
    abilities: [
      { name: "Brilho Lunar", desc: "A luz de fadas irradia constantemente." }
    ],
    actions: [
      { name: "Sopro Feérico (Recarga 5-6)", desc: "Cone de 18m de luz lunar cintilante. Sabedoria CD 19. 55 (10d10) dano radiante e todos afetados ficam banidos para a Agrestia das Fadas em estado de transe até o fim do próximo turno do dragão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão da Pedra da Lua.png",
    tokenType: "billboard"
  }
];
