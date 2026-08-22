import { SRDMonster } from './types';

export const BATCH_5_MONSTERS: SRDMonster[] = [
  {
    id: "formian",
    name: "Formian",
    type: "Monstruosidade",
    size: "Médio",
    alignment: "Leal e Neutro",
    ac: 14,
    hp: 39,
    speed: "12m",
    cr: "1/2",
    xp: 100,
    str: 14, dex: 15, con: 14, int: 11, wis: 10, cha: 9,
    damageResistances: ["Sônico", "Trovejante"],
    abilities: [
      { name: "Mente da Colmeia", desc: "Formians a até 15 km de sua rainha comunicam-se telepaticamente entre si." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Ataque com garras e ferrão." },
      { name: "Garra", desc: "+4 acertar, 5 (1d6 + 2) cortante." },
      { name: "Ferrão", desc: "+4 acertar. 5 (1d6 + 2) perfurante mais 3 (1d6) veneno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Formian.png",
    tokenType: "billboard"
  },
  {
    id: "glabrezu",
    name: "Glabrezu",
    type: "Ínfero (Demônio)",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 17,
    hp: 157,
    speed: "12m",
    cr: "9",
    xp: 5000,
    str: 20, dex: 15, con: 21, int: 19, wis: 17, cha: 16,
    damageResistances: ["Frio", "Fogo", "Elétrico", "Armas não-mágicas"],
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Resistência à Magia", desc: "Vantagem em saves contra magias." },
      { name: "Conjuração Inata", desc: "À vontade: detectar magia, dissipar magia. 1/dia cada: confusão, palavra de poder atordoar." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz quatro ataques: dois com pinças, dois com punhos." },
      { name: "Pinça", desc: "+9 para acertar. 16 (2d10 + 5) concussão. O alvo é agarrado." },
      { name: "Punho", desc: "+9 para acertar. 7 (1d4 + 5) concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Glabrezu.png",
    tokenType: "billboard"
  },
  {
    id: "grell",
    name: "Grell",
    type: "Aberração",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 12,
    hp: 55,
    speed: "3m, voo 9m (flutuar)",
    cr: "3",
    xp: 700,
    str: 15, dex: 14, con: 14, int: 12, wis: 11, cha: 9,
    damageImmunities: ["Elétrico"],
    conditionImmunities: ["Cego", "Derrubado"],
    abilities: [
      { name: "Visão Cega", desc: "18 metros." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques: tentáculos e bico." },
      { name: "Tentáculos", desc: "+4 acertar, 7 (1d10 + 2) perfurante. O alvo testa Constituição CD 11 ou fica envenenado por 1 minuto e paralisado." },
      { name: "Bico", desc: "+4 acertar, 7 (2d4 + 2) perfurante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Grell.png",
    tokenType: "billboard"
  },
  {
    id: "hezrou",
    name: "Hezrou",
    type: "Ínfero (Demônio)",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 16,
    hp: 136,
    speed: "9m",
    cr: "8",
    xp: 3900,
    str: 19, dex: 17, con: 20, int: 5, wis: 12, cha: 13,
    damageResistances: ["Frio", "Fogo", "Elétrico", "Armas não-mágicas"],
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Fedor", desc: "Qualquer criatura que iniciar o turno a 3m do hezrou testa Constituição CD 14 ou fica envenenada." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques (1 mordida, 2 garras)." },
      { name: "Mordida", desc: "+7 acertar. 15 (2d10 + 4) perfurante." },
      { name: "Garra", desc: "+7 acertar. 11 (2d6 + 4) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Hezrou.png",
    tokenType: "billboard"
  },
  {
    id: "miconideo",
    name: "Miconídeo",
    type: "Planta",
    size: "Médio",
    alignment: "Leal e Neutro",
    ac: 12,
    hp: 22,
    speed: "6m",
    cr: "1/2",
    xp: 100,
    str: 10, dex: 10, con: 12, int: 10, wis: 13, cha: 7,
    abilities: [
      { name: "Esporos de Comunicação", desc: "Os esporos permitem comunicação telepática a 9m." },
      { name: "Fobia de Sol", desc: "Desvantagem em ataques se exposto ao sol." }
    ],
    actions: [
      { name: "Pancada", desc: "+2 para acertar. Acerto: 4 (1d4 + 2) concussão mais 5 (2d4) veneno." },
      { name: "Esporos Pacificadores", desc: "Cone de 4.5m. Constituição CD 11 ou fica atordoado 1 minuto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Miconídeo.png",
    tokenType: "billboard"
  },
  {
    id: "nalfeshnee",
    name: "Nalfeshnee",
    type: "Ínfero (Demônio)",
    size: "Enorme",
    alignment: "Caótico e Mau",
    ac: 18,
    hp: 120,
    speed: "6m, voo 9m",
    cr: "13",
    xp: 10000,
    str: 21, dex: 10, con: 22, int: 19, wis: 12, cha: 15,
    damageResistances: ["Frio", "Fogo", "Elétrico", "Armas não-mágicas"],
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Resistência Mágica", desc: "Vantagem contra magia." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques: mordida, duas garras." },
      { name: "Nimbus de Horror (Recarga 5-6)", desc: "Luz colorida emite do demônio a 4.5m. Sabedoria CD 15 ou ficam amedrontados por 1 minuto, sentindo que seus piores medos estão ali." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Nalfeshnee.png",
    tokenType: "billboard"
  },
  {
    id: "vrock",
    name: "Vrock",
    type: "Ínfero (Demônio)",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 15,
    hp: 104,
    speed: "12m, voo 18m",
    cr: "6",
    xp: 2300,
    str: 17, dex: 15, con: 18, int: 8, wis: 13, cha: 8,
    damageResistances: ["Frio", "Fogo", "Elétrico", "Armas não-mágicas"],
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Resistência à Magia", desc: "Vantagem contra magia." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Bico e garras." },
      { name: "Bico", desc: "+6 acertar. 10 (2d6 + 3) perfurante." },
      { name: "Garras", desc: "+6 acertar. 14 (2d10 + 3) cortante." },
      { name: "Esporos Tóxicos (Recarga 5-6)", desc: "Esporos em 4.5m. Constituição CD 14. 3 (1d6) veneno no início do turno por 1 minuto." },
      { name: "Grito Atordoante (1/Dia)", desc: "Som em 6m. Constituição CD 14 ou ficam Atordoados até o fim do próximo turno do vrock." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Vrock.png",
    tokenType: "billboard"
  },
  {
    id: "mephit",
    name: "Mephit",
    type: "Elemental",
    size: "Pequeno",
    alignment: "Neutro e Mau",
    ac: 11,
    hp: 21,
    speed: "9m, voo 9m",
    cr: "1/2",
    xp: 100,
    str: 7, dex: 12, con: 12, int: 9, wis: 11, cha: 12,
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Estouro da Morte", desc: "Ao morrer, explode. Criaturas a 1.5m fazem Destreza CD 10 ou sofrem 7 (2d6) dano do elemento correspondente (ex: fogo)." }
    ],
    actions: [
      { name: "Garras", desc: "+3 acertar, 3 (1d4 + 1) cortante mais 2 (1d4) fogo." },
      { name: "Sopro Elementar", desc: "Cone de 4.5m, Destreza CD 10. 5 (2d4) fogo." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Mephit.png",
    tokenType: "billboard"
  },
  {
    id: "magmin",
    name: "Magmin",
    type: "Elemental",
    size: "Pequeno",
    alignment: "Caótico e Neutro",
    ac: 14,
    hp: 9,
    speed: "9m",
    cr: "1/2",
    xp: 100,
    str: 7, dex: 15, con: 12, int: 8, wis: 11, cha: 10,
    damageResistances: ["Armas não-mágicas"],
    damageImmunities: ["Fogo"],
    abilities: [
      { name: "Estouro da Morte", desc: "Gera explosão quando morre, quem estiver a 3m sofre 7 (2d6) fogo (DEX CD 11 p/ metade)." },
      { name: "Toque Ígneo", desc: "Coloca fogo em objetos inflamáveis." }
    ],
    actions: [
      { name: "Toque Fervente", desc: "+4 acertar, 7 (2d6) fogo." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Magmin.png",
    tokenType: "billboard"
  },
  {
    id: "lamia",
    name: "Lamia",
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 13,
    hp: 97,
    speed: "9m",
    cr: "4",
    xp: 1100,
    str: 16, dex: 13, con: 15, int: 14, wis: 15, cha: 16,
    abilities: [
      { name: "Conjuração Inata", desc: "À vontade: ilusão menor. 3/dia: enfeitiçar pessoa, imagem maior. 1/dia: sugestão." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Duas vezes: garra e punhal." },
      { name: "Garra", desc: "+5 acertar. 14 (2d10 + 3) cortante." },
      { name: "Toque Intoxicante", desc: "Corpo-a-corpo: +5 acertar. Alvo tem desvantagem em testes de Sabedoria e salvamentos de Sab por 1 hora." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Lamia.png",
    tokenType: "billboard"
  },
  {
    id: "kraken",
    name: "Kraken",
    type: "Monstruosidade",
    size: "Gargântua",
    alignment: "Caótico e Mau",
    ac: 18,
    hp: 472,
    speed: "6m, natação 18m",
    cr: "23",
    xp: 50000,
    str: 30, dex: 11, con: 25, int: 22, wis: 18, cha: 20,
    damageImmunities: ["Elétrico", "Armas não-mágicas"],
    conditionImmunities: ["Amedrontado", "Paralisado"],
    abilities: [
      { name: "Resistência Lendária (3/Dia)", desc: "Pode ignorar a falha em saves." },
      { name: "Anfíbio e Resiliente", desc: "Respira em água e ar. Ignora terrenos difíceis não mágicos." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques de tentáculos, e pode trocar um por mordida ou engolir." },
      { name: "Mordida", desc: "+17 acertar, 23 (3d8 + 10) perfurante. Se engolir, sofre 42 de dano ácido por turno." },
      { name: "Tentáculo", desc: "+17 acertar, 20 (3d6 + 10) concussão. Agarra (CD 18 fuga)." },
      { name: "Tempestade de Raios", desc: "Três relâmpagos (CD 23 Destreza). 22 (4d10) elétrico cada." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Kraken.png",
    tokenType: "billboard"
  },
  {
    id: "kenku",
    name: "Kenku",
    type: "Humanóide",
    size: "Médio",
    alignment: "Caótico e Neutro",
    ac: 13,
    hp: 13,
    speed: "9m",
    cr: "1/4",
    xp: 50,
    str: 10, dex: 15, con: 10, int: 11, wis: 10, cha: 10,
    abilities: [
      { name: "Mímico Perfeito", desc: "O kenku pode imitar perfeitamente sons que ouviu, incluindo vozes. Teste de Sabedoria oposto contra Enganação para identificar que é falso." }
    ],
    actions: [
      { name: "Espada Curta", desc: "+4 acertar, 5 (1d6 + 2) cortante." },
      { name: "Arco Curto", desc: "+4 acertar, 5 (1d6 + 2) perfurante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Kenku.png",
    tokenType: "billboard"
  },
  {
    id: "horror-de-elmo",
    name: "Horror de Elmo",
    type: "Construto",
    size: "Médio",
    alignment: "Neutro",
    ac: 20,
    hp: 60,
    speed: "9m, voo 9m",
    cr: "4",
    xp: 1100,
    str: 18, dex: 13, con: 16, int: 10, wis: 14, cha: 10,
    damageResistances: ["Armas não-mágicas não-adamantinas"],
    damageImmunities: ["Força", "Necrótico", "Veneno"],
    conditionImmunities: ["Cego", "Enfeitiçado", "Surdo", "Amedrontado", "Paralisado", "Petrificado", "Envenenado", "Exausto"],
    abilities: [
      { name: "Visão no Escuro", desc: "18 metros." },
      { name: "Imunidade a Magia Específica", desc: "O construto é imune a 3 magias específicas (geralmente Bola de Fogo, Mísseis Mágicos e Raio Ardente)." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques com espada longa." },
      { name: "Espada Longa", desc: "+6 para acertar, alcance 1.5m. Acerto: 8 (1d8 + 4) cortante, ou 9 (1d10 + 4) cortante se usar duas mãos." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Horror de Elmo.png",
    tokenType: "billboard"
  },
  {
    id: "ettin",
    name: "Ettin",
    type: "Gigante",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 12,
    hp: 85,
    speed: "12m",
    cr: "4",
    xp: 1100,
    str: 21, dex: 8, con: 17, int: 6, wis: 10, cha: 8,
    abilities: [
      { name: "Duas Cabeças", desc: "Vantagem em Percepção, salvamentos contra ser cego, surdo, amedrontado, atordoado e enfeitiçado." },
      { name: "Acordar", desc: "Se uma cabeça dorme, a outra fica acordada." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques (um com cada braço/arma)." },
      { name: "Maça", desc: "+7 acertar. 14 (2d8 + 5) concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Ettin.png",
    tokenType: "billboard"
  },
  {
    id: "duergar",
    name: "Duergar",
    type: "Humanóide (Anão)",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 16,
    hp: 26,
    speed: "7.5m",
    cr: "1",
    xp: 200,
    str: 14, dex: 11, con: 14, int: 11, wis: 10, cha: 9,
    damageResistances: ["Veneno"],
    abilities: [
      { name: "Resiliência Duergar", desc: "Vantagem contra magias, ilusões, feitiços e paralisia." },
      { name: "Sensibilidade à Luz", desc: "Desvantagem em ataques e percepção no sol." }
    ],
    actions: [
      { name: "Aumentar (Recarrega descanso)", desc: "O duergar magicamente aumenta de tamanho, ganhando +1d8 em danos de força por 1 minuto." },
      { name: "Martelo", desc: "+4 acertar. 6 (1d8 + 2) concussão, 10 (2d8 + 2) se aumentado." },
      { name: "Invisibilidade (Recarrega descanso)", desc: "Fica invisível até atacar ou até 1 hora." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Duergar.png",
    tokenType: "billboard"
  },
  {
    id: "bullywug",
    name: "Bullywug",
    type: "Humanóide",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 15,
    hp: 11,
    speed: "6m, natação 12m",
    cr: "1/4",
    xp: 50,
    str: 12, dex: 12, con: 13, int: 7, wis: 10, cha: 7,
    abilities: [
      { name: "Anfíbio", desc: "Respira na água." },
      { name: "Salto de Sapo", desc: "O salto em distância é de até 6m e o salto em altura é até 3m, com ou sem corrida prévia." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques: mordida e lança." },
      { name: "Lança", desc: "+3 acertar, 4 (1d6 + 1) perfurante." },
      { name: "Mordida", desc: "+3 acertar, 3 (1d4 + 1) concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Bullywug.png",
    tokenType: "billboard"
  },
  {
    id: "cao-pisca",
    name: "Cão Pisca",
    type: "Fada",
    size: "Médio",
    alignment: "Leal e Bom",
    ac: 13,
    hp: 22,
    speed: "12m",
    cr: "1/4",
    xp: 50,
    str: 12, dex: 17, con: 12, int: 10, wis: 13, cha: 11,
    abilities: [
      { name: "Audição e Faro", desc: "Vantagem em Percepção com som e cheiro." }
    ],
    actions: [
      { name: "Mordida", desc: "+3 acertar. 4 (1d6 + 1) perfurante." },
      { name: "Teletransporte (Ação Bônus)", desc: "Se teletransporta magicamente junto com qualquer equipamento a até 12 metros para um espaço desocupado que possa ver." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Cão Pisca.png",
    tokenType: "billboard"
  },
  {
    id: "marid",
    name: "Marid",
    type: "Elemental",
    size: "Grande",
    alignment: "Caótico e Neutro",
    ac: 17,
    hp: 229,
    speed: "9m, voo 18m, natação 27m",
    cr: "11",
    xp: 7200,
    str: 22, dex: 12, con: 24, int: 18, wis: 17, cha: 18,
    damageResistances: ["Ácido", "Frio", "Elétrico"],
    abilities: [
      { name: "Anfíbio", desc: "Respira na água." },
      { name: "Conjuração Inata", desc: "Criação de Água, Controlar Água, Nevasca, Visão da Verdade." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques de tridente." },
      { name: "Tridente", desc: "+10 acertar. 13 (2d6 + 6) perfurante." },
      { name: "Jato de Água", desc: "Linha de 18m. Força CD 16. 21 (6d6) concussão, empurrado 6m e fica caído." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Marid.png",
    tokenType: "billboard"
  },
  {
    id: "sahuagin",
    name: "Sahuagin",
    type: "Humanóide",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 12,
    hp: 22,
    speed: "9m, natação 12m",
    cr: "1/2",
    xp: 100,
    str: 13, dex: 11, con: 12, int: 12, wis: 13, cha: 9,
    abilities: [
      { name: "Frenesi de Sangue", desc: "Vantagem em ataques corpo-a-corpo contra qualquer criatura que não tiver com todos os seus PV." },
      { name: "Anfíbio Limitado", desc: "Respira ar e água, mas precisa ser submerso 1 vez a cada 4 horas." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Mordida e garra." },
      { name: "Mordida", desc: "+3 acertar, 3 (1d4 + 1) perfurante." },
      { name: "Garra", desc: "+3 acertar, 4 (1d6 + 1) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Sahuagin.png",
    tokenType: "billboard"
  },
  {
    id: "erinyes",
    name: "Erinyes",
    type: "Ínfero (Diabo)",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 18,
    hp: 153,
    speed: "9m, voo 18m",
    cr: "12",
    xp: 8400,
    str: 18, dex: 16, con: 18, int: 14, wis: 14, cha: 18,
    damageResistances: ["Frio", "Armas não mágicas não prateadas"],
    damageImmunities: ["Fogo", "Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Resistência à Magia", desc: "Vantagem em saves contra magia." },
      { name: "Armas Angelicais Invertidas", desc: "Seus ataques de arma dão +3d8 de dano de veneno (incluso)." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Três ataques." },
      { name: "Espada Longa", desc: "+8 acertar, 8 (1d8 + 4) cortante mais 13 (3d8) veneno." },
      { name: "Arco Longo", desc: "+7 acertar, 7 (1d8 + 3) perfurante mais 13 (3d8) veneno. O alvo testa Constituição CD 14 ou fica envenenado." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Erinyes.png",
    tokenType: "billboard"
  },
  {
    id: "elemental-do-raio",
    name: "Elemental do Raio",
    type: "Elemental",
    size: "Grande",
    alignment: "Neutro",
    ac: 15,
    hp: 90,
    speed: "0m, voo 27m (flutuar)",
    cr: "5",
    xp: 1800,
    str: 14, dex: 20, con: 14, int: 6, wis: 10, cha: 6,
    damageResistances: ["Armas não mágicas"],
    damageImmunities: ["Elétrico", "Veneno"],
    conditionImmunities: ["Exausto", "Agarrado", "Envenenado", "Restrito", "Derrubado", "Paralisado", "Inconsciente"],
    abilities: [
      { name: "Forma de Raio", desc: "O elemental pode mover-se pelo espaço de criaturas aliadas. Qualquer espaço no qual se mova pela primeira vez num turno força a criatura a testar Destreza CD 13 ou sofrer 5 (1d10) elétrico." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques de toque." },
      { name: "Toque Elétrico", desc: "+8 acertar. 14 (2d8 + 5) elétrico." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Elemental do Raio.png",
    tokenType: "billboard"
  }
];
