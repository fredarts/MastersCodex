import { SRDMonster } from './types';

export const BATCH_2_MONSTERS: SRDMonster[] = [
  {
    id: "dragao-cobre",
    name: "Dragão Cobre",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Bom",
    ac: 18,
    hp: 184,
    speed: "12m, escalada 12m, voo 24m",
    cr: "14",
    xp: 11500,
    str: 23, dex: 12, con: 21, int: 18, wis: 15, cha: 17,
    damageImmunities: ["Ácido"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Se o dragão falhar em um teste de resistência, ele pode escolher obter sucesso." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão pode usar Presença Aterradora. Em seguida, ele faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m, um alvo. Acerto: 17 (2d10 + 6) perfurante." },
      { name: "Sopros (Recarga 5-6)", desc: "1. Sopro de Ácido: Linha de 18m, Destreza CD 18, 54 (12d8) dano de ácido.\n2. Gás de Lentidão: Cone de 18m, Constituição CD 18. Falha: não pode usar reações e só faz uma ação ou ação bônus no turno por 1 minuto (salva no fim do turno)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Cobre.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-branco",
    name: "Dragão Branco",
    type: "Dragão",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 18,
    hp: 200,
    speed: "12m, escavação 9m, natação 12m, voo 24m",
    cr: "13",
    xp: 10000,
    str: 22, dex: 10, con: 22, int: 8, wis: 11, cha: 12,
    damageImmunities: ["Frio"],
    abilities: [
      { name: "Andar no Gelo", desc: "O dragão pode se mover através de gelo e neve sem que isso conte como terreno difícil. Ele pode escalar paredes congeladas de cabeça para baixo." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +11 para acertar, alcance 3m, um alvo. Acerto: 17 (2d10 + 6) perfurante mais 4 (1d8) frio." },
      { name: "Sopro Congelante (Recarga 5-6)", desc: "Cone de 18m. Constituição CD 19, 54 (12d8) de dano de frio em falha (metade em sucesso)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Branco.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-azul",
    name: "Dragão Azul",
    type: "Dragão",
    size: "Enorme",
    alignment: "Leal e Mau",
    ac: 19,
    hp: 225,
    speed: "12m, escavação 9m, voo 24m",
    cr: "16",
    xp: 15000,
    str: 25, dex: 10, con: 23, int: 16, wis: 15, cha: 19,
    damageImmunities: ["Elétrico"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "O dragão pode escolher passar num teste de resistência que falhou." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +12 para acertar, alcance 3m, um alvo. Acerto: 18 (2d10 + 7) perfurante mais 5 (1d10) elétrico." },
      { name: "Sopro Elétrico (Recarga 5-6)", desc: "Linha de 27 metros e 1.5m de largura. Destreza CD 19, 66 (12d10) de dano elétrico em falha (metade em sucesso)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Azul.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-astral",
    name: "Dragão Astral",
    type: "Celestial (Dragão)",
    size: "Enorme",
    alignment: "Neutro",
    ac: 19,
    hp: 243,
    speed: "18m, voo 36m",
    cr: "17",
    xp: 18000,
    str: 22, dex: 20, con: 23, int: 18, wis: 19, cha: 21,
    damageResistances: ["Radiante", "Força"],
    abilities: [
      { name: "Corpo Estelar", desc: "Magias que tentam banir o dragão para outro plano têm desvantagem no teste de ataque, e o dragão tem vantagem no teste de resistência." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "+12 para acertar, alcance 3m. Acerto: 18 (2d10 + 7) perfurante mais 9 (2d8) de dano radiante." },
      { name: "Sopro Estelar (Recarga 5-6)", desc: "O dragão exala pó de estrelas numa nuvem cone de 27 metros. Teste de Destreza CD 20. Falha: 66 (12d10) dano de força e as criaturas não podem conjurar magias até o fim do seu próximo turno. Sucesso: Metade do dano." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Astral.png",
    tokenType: "billboard"
  },
  {
    id: "dracolich",
    name: "Dracolich",
    type: "Morto-Vivo (Dragão)",
    size: "Enorme",
    alignment: "Neutro e Mau",
    ac: 19,
    hp: 225,
    speed: "12m, voo 24m",
    cr: "17",
    xp: 18000,
    str: 25, dex: 10, con: 23, int: 16, wis: 15, cha: 19,
    damageResistances: ["Necrótico"],
    damageImmunities: ["Veneno", "Elétrico"],
    conditionImmunities: ["Enfeitiçado", "Exausto", "Amedrontado", "Paralisado", "Envenenado"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Pode escolher passar num save falho." },
      { name: "Resistência à Magia", desc: "Tem vantagem em testes de resistência contra magias e outros efeitos mágicos." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Presença Aterradora. Em seguida, três ataques." },
      { name: "Mordida", desc: "+12 acertar, alcance 3m. Acerto: 18 (2d10 + 7) perfurante mais 5 (1d10) necrótico." },
      { name: "Sopro de Eletricidade Necrótica (Recarga 5-6)", desc: "Linha de 27 metros. Destreza CD 20. Falha: 66 (12d10) de dano que conta como necrótico e elétrico ao mesmo tempo." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dracolich.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-tartaruga",
    name: "Dragão Tartaruga",
    type: "Dragão",
    size: "Gargântua",
    alignment: "Neutro",
    ac: 20,
    hp: 341,
    speed: "6m, natação 12m",
    cr: "17",
    xp: 18000,
    str: 25, dex: 10, con: 20, int: 10, wis: 12, cha: 12,
    damageResistances: ["Fogo"],
    abilities: [
      { name: "Anfíbio", desc: "O dragão tartaruga pode respirar ar e água." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O dragão faz três ataques: uma mordida e duas garras." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo: +13 para acertar, alcance 4.5m. Acerto: 26 (3d12 + 7) perfurante." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo: +13 para acertar, alcance 3m. Acerto: 16 (2d8 + 7) cortante." },
      { name: "Sopro de Vapor (Recarga 5-6)", desc: "Cone de 18 metros de vapor fervente. Constituição CD 18, 52 (15d6) dano de fogo (metade em sucesso). Sendo debaixo d'água não reduz a eficácia do sopro." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Tartaruga.png",
    tokenType: "billboard"
  },
  {
    id: "dragao-fada",
    name: "Dragão Fada",
    type: "Dragão",
    size: "Miúdo",
    alignment: "Caótico e Bom",
    ac: 15,
    hp: 14,
    speed: "3m, voo 18m",
    cr: "1",
    xp: 200,
    str: 3, dex: 20, con: 13, int: 14, wis: 12, cha: 16,
    abilities: [
      { name: "Magia Inata", desc: "Conjura sem componentes: À vontade: luz, ilusão menor, prestidigitação. 1/dia cada: invisibilidade, enfeitiçar pessoa, globos de luz." }
    ],
    actions: [
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo: +7 para acertar. Acerto: 1 perfurante." },
      { name: "Sopro de Euforia (Recarga 5-6)", desc: "Cone de 1.5 metros. Teste de Sabedoria CD 11. Falha: Fica eufórico por 1 minuto, rodando 1d6 no começo de seu turno (1-4: não age; 5-6 age normalmente)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dragão Fada.png",
    tokenType: "billboard"
  },
  {
    id: "diabo-de-ossos",
    name: "Diabo de Ossos",
    type: "Ínfero (Diabo)",
    size: "Grande",
    alignment: "Leal e Mau",
    ac: 19,
    hp: 142,
    speed: "12m, voo 12m",
    cr: "9",
    xp: 5000,
    str: 18, dex: 16, con: 18, int: 13, wis: 14, cha: 16,
    damageResistances: ["Frio", "Concussão, perfurante e cortante de não mágicos"],
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Visão Diabólica", desc: "A escuridão mágica não impede a visão no escuro do diabo." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O diabo faz três ataques: dois com suas garras e um com seu ferrão." },
      { name: "Garra", desc: "+8 para acertar, alcance 3m. Acerto: 8 (1d8 + 4) cortante." },
      { name: "Ferrão", desc: "+8 para acertar, alcance 3m. Acerto: 13 (2d8 + 4) perfurante mais 17 (5d6) de veneno. Constituição CD 14 reduz veneno à metade." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Diabo de Ossos.png",
    tokenType: "billboard"
  },
  {
    id: "diabo-barbudo",
    name: "Diabo Barbudo",
    type: "Ínfero (Diabo)",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 13,
    hp: 52,
    speed: "9m",
    cr: "3",
    xp: 700,
    str: 16, dex: 15, con: 15, int: 9, wis: 11, cha: 11,
    damageResistances: ["Frio", "Armas não-mágicas não-prateadas"],
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Vantagem Infernal", desc: "O diabo tem vantagem em testes de resistência contra magia." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques: um com a barba e um com a glaive." },
      { name: "Glaive", desc: "+5 para acertar, alcance 3m. Acerto: 8 (1d10 + 3) cortante e a criatura sangra (1d10 no início de seus turnos) até ser curada por magia ou testar Medicina CD 12." },
      { name: "Barba", desc: "+5 para acertar, alcance 1.5m. Acerto: 6 (1d8 + 2) perfurante e deve testar Constituição CD 12 ou ficar envenenado por 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Diabo Barbudo.png",
    tokenType: "billboard"
  },
  {
    id: "diabo-espinhoso",
    name: "Diabo Espinhoso",
    type: "Ínfero (Diabo)",
    size: "Pequeno",
    alignment: "Leal e Mau",
    ac: 15,
    hp: 22,
    speed: "6m, voo 12m",
    cr: "2",
    xp: 450,
    str: 10, dex: 17, con: 12, int: 11, wis: 14, cha: 8,
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Evasão Diabólica", desc: "O diabo tem vantagem em testes de resistência de Sabedoria contra feitiços de Encantamento." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O diabo faz dois ataques com garras ou duas labaredas arremessadas." },
      { name: "Garra", desc: "+5 para acertar, alcance 1.5m. Acerto: 5 (1d4 + 3) cortante." },
      { name: "Arremessar Chama", desc: "Ataque à Distância com Magia: +5 para acertar, distância 18m, um alvo. Acerto: 10 (3d6) de dano de fogo." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Diabo Espinhoso.png",
    tokenType: "billboard"
  },
  {
    id: "diabo-do-gelo",
    name: "Diabo do Gelo",
    type: "Ínfero (Diabo)",
    size: "Grande",
    alignment: "Leal e Mau",
    ac: 18,
    hp: 180,
    speed: "12m",
    cr: "14",
    xp: 11500,
    str: 21, dex: 14, con: 22, int: 18, wis: 15, cha: 18,
    damageResistances: ["Armas não mágicas"],
    damageImmunities: ["Frio", "Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Aura Gélida", desc: "Qualquer criatura que comece o turno a até 3m do diabo deve testar Constituição CD 18 ou sofrerá 10 (3d6) de dano de frio." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O diabo faz um ataque com sua mordida, garras e cauda, ou três com sua lança de gelo." },
      { name: "Lança Congelada", desc: "Ataque Corpo-a-Corpo com Arma: +10 para acertar, alcance 3m. Acerto: 14 (2d8 + 5) perfurante mais 10 (3d6) frio. O alvo tem a velocidade reduzida a 0 até o final de seu próximo turno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Diabo do Gelo.png",
    tokenType: "billboard"
  },
  {
    id: "diabo-das-correntes",
    name: "Diabo das Correntes",
    type: "Ínfero (Diabo)",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 16,
    hp: 85,
    speed: "9m",
    cr: "8",
    xp: 3900,
    str: 18, dex: 15, con: 18, int: 11, wis: 12, cha: 14,
    damageResistances: ["Frio"],
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Máscara Enervante", desc: "Quando o diabo sofre dano, as criaturas a 9m devem testar Sabedoria CD 14 ou ficarão Amedrontadas por 1 turno." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O diabo faz dois ataques com correntes." },
      { name: "Corrente", desc: "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 3m, um alvo. Acerto: 11 (2d6 + 4) cortante. O alvo é agarrado (fuga CD 14)." },
      { name: "Animar Correntes (Recarga 4-6)", desc: "O diabo pode animar 1 a 4 correntes inanimadas a até 18 metros." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Diabo das Correntes.png",
    tokenType: "billboard"
  },
  {
    id: "demonio-das-sombras",
    name: "Demônio das Sombras",
    type: "Ínfero (Demônio)",
    size: "Médio",
    alignment: "Caótico e Mau",
    ac: 13,
    hp: 71,
    speed: "9m, voo 9m (flutuar)",
    cr: "4",
    xp: 1100,
    str: 1, dex: 17, con: 12, int: 14, wis: 13, cha: 14,
    damageVulnerabilities: ["Radiante"],
    damageResistances: ["Fogo", "Frio", "Ácido", "Elétrico", "Trovejante"],
    damageImmunities: ["Necrótico", "Veneno"],
    conditionImmunities: ["Envenenado", "Agarrado", "Derrubado", "Restrito", "Amedrontado"],
    abilities: [
      { name: "Movimento Incorpóreo", desc: "Pode se mover através de criaturas e objetos como terreno difícil." }
    ],
    actions: [
      { name: "Garra de Sombras", desc: "Ataque Corpo-a-Corpo com Magia: +5 para acertar, alcance 1.5m. Acerto: 10 (2d6 + 3) psíquico (ou 17 / 4d6+3 se houver vantagem no ataque)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Demônio das Sombras.png",
    tokenType: "billboard"
  },
  {
    id: "demilich",
    name: "Demilich",
    type: "Morto-Vivo",
    size: "Miúdo",
    alignment: "Neutro e Mau",
    ac: 20,
    hp: 80,
    speed: "0m, voo 9m (flutuar)",
    cr: "18",
    xp: 20000,
    str: 1, dex: 20, con: 10, int: 20, wis: 17, cha: 20,
    damageImmunities: ["Necrótico", "Veneno", "Psíquico", "Concussão/perfurante/cortante de armas mágicas e não-mágicas"],
    conditionImmunities: ["Enfeitiçado", "Exausto", "Amedrontado", "Agarrado", "Surdo", "Cego", "Paralisado"],
    abilities: [
      { name: "Evasão", desc: "Toma meio dano em falha de resistência de DEX e nenhum dano em sucesso." }
    ],
    actions: [
      { name: "Uivo Mortal", desc: "Criaturas num raio de 9 metros devem testar Constituição CD 15. Em falha, os pontos de vida caem a 0 imediatamente. Em sucesso, ficam Amedrontadas." },
      { name: "Drenar Vida", desc: "3 criaturas a 3 metros devem testar Constituição CD 19 ou sofrer 21 (6d6) dano necrótico. O demilich recupera PV igual ao total." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Demilich.png",
    tokenType: "billboard"
  },
  {
    id: "devorador-de-almas",
    name: "Devorador de Almas",
    type: "Aberrações",
    size: "Médio",
    alignment: "Caótico e Mau",
    ac: 15,
    hp: 104,
    speed: "9m, voo 18m",
    cr: "7",
    xp: 2900,
    str: 12, dex: 16, con: 14, int: 10, wis: 16, cha: 10,
    damageImmunities: ["Necrótico"],
    abilities: [
      { name: "Faro Psíquico", desc: "O devorador sabe a localização exata de criaturas feridas (abaixo do PV máximo) em um raio de 90 metros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques com suas garras umbrais." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 1.5m. Acerto: 10 (2d6 + 3) cortante mais 14 (4d6) necrótico." },
      { name: "Grito Drenante (Recarga 6)", desc: "Raio de 9 metros, Constituição CD 14. 28 (8d6) necrótico." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Devorador de Almas.png",
    tokenType: "billboard"
  },
  {
    id: "cao-infernal",
    name: "Cão Infernal",
    type: "Ínfero",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 15,
    hp: 45,
    speed: "15m",
    cr: "3",
    xp: 700,
    str: 17, dex: 12, con: 14, int: 6, wis: 13, cha: 6,
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Audição e Faro Aguçados", desc: "Vantagem em Percepção que usa olfato/audição." },
      { name: "Táticas de Matilha", desc: "Vantagem em ataque se um aliado estiver a 1.5m do alvo." }
    ],
    actions: [
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo: +5 para acertar. Acerto: 7 (1d8 + 3) perfurante mais 7 (2d6) fogo." },
      { name: "Sopro de Fogo (Recarga 5-6)", desc: "Cone de 4.5m. Destreza CD 12. Falha: 21 (6d6) dano de fogo. Sucesso: Metade." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Cão Infernal.png",
    tokenType: "billboard"
  },
  {
    id: "dao",
    name: "Dao",
    type: "Elemental",
    size: "Grande",
    alignment: "Neutro e Mau",
    ac: 18,
    hp: 187,
    speed: "9m, escavação 9m, voo 9m",
    cr: "11",
    xp: 7200,
    str: 23, dex: 12, con: 24, int: 12, wis: 13, cha: 14,
    damageImmunities: ["Veneno"],
    abilities: [
      { name: "Andar na Terra", desc: "O dao pode escavar através de pedra não trabalhada." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques com o Punho ou o Martelo." },
      { name: "Maça Grande", desc: "Ataque Corpo-a-Corpo: +10 para acertar. Acerto: 20 (4d6 + 6) concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Dao.png",
    tokenType: "billboard"
  },
  {
    id: "couatl",
    name: "Couatl",
    type: "Celestial",
    size: "Médio",
    alignment: "Leal e Bom",
    ac: 19,
    hp: 97,
    speed: "9m, voo 27m",
    cr: "4",
    xp: 1100,
    str: 16, dex: 20, con: 17, int: 18, wis: 20, cha: 18,
    damageResistances: ["Magia"],
    damageImmunities: ["Radiante", "Armas não-mágicas"],
    abilities: [
      { name: "Conjuração Inata", desc: "À vontade: detectar o mal/bem, detectar magia. 3/dia: restauração menor, bênção." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Mordida e Constrição." },
      { name: "Mordida", desc: "+8 acertar, 8 perfurante. O alvo deve testar Constituição CD 13 ou ficará inconsciente por 24 horas." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Couatl.png",
    tokenType: "billboard"
  },
  {
    id: "automato-de-batalha",
    name: "Autômato de Batalha",
    type: "Construto",
    size: "Grande",
    alignment: "Imparcial",
    ac: 18,
    hp: 126,
    speed: "9m",
    cr: "8",
    xp: 3900,
    str: 20, dex: 10, con: 18, int: 3, wis: 11, cha: 1,
    damageImmunities: ["Veneno", "Psíquico"],
    conditionImmunities: ["Envenenado", "Enfeitiçado", "Exausto", "Amedrontado"],
    abilities: [
      { name: "Armas Integradas", desc: "Os ataques do autômato contam como mágicos. Ele não pode ser desarmado." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques com lâminas longas." },
      { name: "Lâmina", desc: "Ataque Corpo-a-Corpo: +8 para acertar, alcance 3m. Acerto: 18 (2d12 + 5) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Autômato de Batalha.png",
    tokenType: "billboard"
  },
  {
    id: "chuul",
    name: "Chuul",
    type: "Aberração",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 16,
    hp: 93,
    speed: "9m, natação 9m",
    cr: "4",
    xp: 1100,
    str: 19, dex: 10, con: 16, int: 5, wis: 11, cha: 5,
    damageImmunities: ["Veneno"],
    abilities: [
      { name: "Anfíbio", desc: "Pode respirar ar e água." },
      { name: "Sentir Magia", desc: "Sabe a localização exata de qualquer criatura que conjurou magias ou carrega itens mágicos a 36 metros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques com pinças. Se pegar o mesmo alvo com as duas, usa os tentáculos." },
      { name: "Pinça", desc: "+6 para acertar. Acerto: 11 (2d6 + 4) concussão. O alvo está agarrado." },
      { name: "Tentáculos Paralisantes", desc: "Uma criatura agarrada deve fazer save de Constituição CD 13 ou ficar envenenada e paralisada." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Chuul.png",
    tokenType: "billboard"
  },
  {
    id: "deva",
    name: "Deva",
    type: "Celestial",
    size: "Médio",
    alignment: "Leal e Bom",
    ac: 17,
    hp: 136,
    speed: "9m, voo 27m",
    cr: "10",
    xp: 5900,
    str: 18, dex: 18, con: 18, int: 17, wis: 20, cha: 20,
    damageResistances: ["Radiante", "Armas não-mágicas"],
    conditionImmunities: ["Amedrontado", "Enfeitiçado", "Exausto"],
    abilities: [
      { name: "Armas Angelicais", desc: "Ataques com armas dão dano extra de 4d8 radiante (incluso)." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques de maça." },
      { name: "Maça Celestial", desc: "+8 para acertar. Acerto: 7 (1d6 + 4) concussão mais 18 (4d8) radiante." },
      { name: "Toque Curativo (3/dia)", desc: "Toca uma criatura, curando 20 (4d8+2) PV." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Deva.png",
    tokenType: "billboard"
  },
  {
    id: "planetar",
    name: "Planetar",
    type: "Celestial",
    size: "Grande",
    alignment: "Leal e Bom",
    ac: 19,
    hp: 200,
    speed: "12m, voo 36m",
    cr: "16",
    xp: 15000,
    str: 24, dex: 20, con: 24, int: 19, wis: 22, cha: 25,
    damageResistances: ["Radiante", "Armas não-mágicas"],
    conditionImmunities: ["Amedrontado", "Enfeitiçado", "Exausto"],
    abilities: [
      { name: "Armas Angelicais", desc: "Ataques com armas dão dano extra de 5d8 radiante." },
      { name: "Consciência Divina", desc: "O Planetar sempre sabe quando ouve uma mentira." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques com espada larga." },
      { name: "Espada Larga", desc: "+12 para acertar. Acerto: 21 (4d6 + 7) cortante mais 22 (5d8) radiante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Planetar.png",
    tokenType: "billboard"
  },
  {
    id: "solar",
    name: "Solar",
    type: "Celestial",
    size: "Grande",
    alignment: "Leal e Bom",
    ac: 21,
    hp: 243,
    speed: "15m, voo 45m",
    cr: "21",
    xp: 33000,
    str: 26, dex: 22, con: 26, int: 25, wis: 25, cha: 30,
    damageResistances: ["Radiante", "Armas não-mágicas"],
    damageImmunities: ["Necrótico", "Veneno"],
    conditionImmunities: ["Amedrontado", "Enfeitiçado", "Exausto", "Envenenado"],
    abilities: [
      { name: "Armas Angelicais", desc: "Ataques com armas dão 6d8 radiante." }
    ],
    actions: [
      { name: "Espada Grande Voadora", desc: "O solar solta a espada, que pode voar até 15 metros e atacar por conta própria." },
      { name: "Arco Matador", desc: "Arco Longo: +13 acertar, distância 45/180m. 15 (2d8+6) perfurante mais 27 (6d8) radiante. Alvo sofre teste de Constituição CD 15 ou morre instantaneamente se tiver 100 PV ou menos." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Solar.png",
    tokenType: "billboard"
  },
  {
    id: "guardiao-do-escudo",
    name: "Guardião do Escudo",
    type: "Construto",
    size: "Grande",
    alignment: "Imparcial",
    ac: 17,
    hp: 142,
    speed: "9m",
    cr: "7",
    xp: 2900,
    str: 18, dex: 8, con: 18, int: 7, wis: 10, cha: 3,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Enfeitiçado", "Envenenado", "Amedrontado", "Paralisado", "Exausto"],
    abilities: [
      { name: "Armazenar Magia", desc: "Um conjurador pode guardar 1 magia de até nível 4 no guardião." },
      { name: "Defesa Vinculada", desc: "Ganha +2 na CA do portador do amuleto se ele estiver a até 1.5 metros." },
      { name: "Absorver Dano", desc: "O guardião absorve metade do dano sofrido pelo mestre se ele estiver a até 18 metros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques de punho." },
      { name: "Punho", desc: "+7 para acertar. Acerto: 11 (2d6 + 4) concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Guardião do Escudo.png",
    tokenType: "billboard"
  },
  {
    id: "azer",
    name: "Azer",
    type: "Elemental",
    size: "Médio",
    alignment: "Leal e Neutro",
    ac: 17,
    hp: 39,
    speed: "9m",
    cr: "2",
    xp: 450,
    str: 17, dex: 12, con: 15, int: 12, wis: 13, cha: 10,
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Corpo Aquecido", desc: "Uma criatura que tocar no azer ou acertá-lo com ataque corpo-a-corpo sofre 5 (1d10) dano de fogo." }
    ],
    actions: [
      { name: "Martelo de Guerra", desc: "+5 para acertar. Acerto: 7 (1d8 + 3) concussão mais 3 (1d6) fogo." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Azer.png",
    tokenType: "billboard"
  }
];
