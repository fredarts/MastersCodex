import { SRDMonster } from './types';

export const BATCH_4_MONSTERS: SRDMonster[] = [
  {
    id: "barrete-vermelho",
    name: "Barrete Vermelho",
    type: "Fada",
    size: "Pequeno",
    alignment: "Caótico e Mau",
    ac: 13,
    hp: 45,
    speed: "7.5m",
    cr: "3",
    xp: 700,
    str: 18, dex: 13, con: 14, int: 10, wis: 12, cha: 9,
    abilities: [
      { name: "Botas de Ferro", desc: "Embora pequeno, ele ataca com as pesadas botas de ferro dando dano como se fosse maior, e ignorando terreno difícil mágico." },
      { name: "Fúria Sanguinária", desc: "Tem vantagem em ataques contra criaturas que não têm todos os seus PV." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz três ataques com a sua foice cruel ou botas." },
      { name: "Foice", desc: "Ataque Corpo-a-Corpo com Arma: +6 para acertar. Acerto: 9 (2d4 + 4) cortante." },
      { name: "Botas de Ferro", desc: "Ataque Corpo-a-Corpo com Arma: +6 para acertar. Acerto: 11 (2d6 + 4) concussão. Se o alvo for Médio ou menor, testa Força CD 14 ou cai." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Barrete Vermelho.png",
    tokenType: "billboard"
  },
  {
    id: "pixie",
    name: "Pixie",
    type: "Fada",
    size: "Minúsculo",
    alignment: "Neutro e Bom",
    ac: 15,
    hp: 1,
    speed: "3m, voo 9m",
    cr: "1/4",
    xp: 50,
    str: 2, dex: 20, con: 8, int: 10, wis: 14, cha: 15,
    abilities: [
      { name: "Resistência à Magia", desc: "Vantagem em testes de resistência contra magia." },
      { name: "Conjuração Inata", desc: "À vontade: druidismo. 1/dia cada: confusão, dança irresistível, detectar o mal/bem, detectar pensamentos, dissipar magia, emaranhar, força fantasmagórica, luz, polimorfismo, sono, voo." }
    ],
    actions: [
      { name: "Invisibilidade Superior", desc: "A pixie fica invisível magicamente até que sua concentração acabe." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Pixie.png",
    tokenType: "billboard"
  },
  {
    id: "ettercap",
    name: "Ettercap",
    type: "Monstruosidade",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 13,
    hp: 44,
    speed: "9m, escalada 9m",
    cr: "2",
    xp: 450,
    str: 14, dex: 15, con: 13, int: 7, wis: 12, cha: 8,
    abilities: [
      { name: "Andar em Teias", desc: "Ignora restrições de movimento causadas por teias." },
      { name: "Sentir em Teias", desc: "O ettercap sabe a localização de qualquer outra criatura que toque uma teia que ele também toque." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Mordida e garra." },
      { name: "Mordida", desc: "+4 acertar, 6 (1d8 + 2) perfurante mais 4 (1d8) veneno e alvo testa Constituição CD 11 ou fica envenenado por 1 minuto." },
      { name: "Teia (Recarga 5-6)", desc: "Ataque à dist.: +4 acertar, 9/18m. O alvo está restrito por teias. Uma criatura pode usar sua ação para fazer um teste Força CD 11 e se libertar." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Ettercap.png",
    tokenType: "billboard"
  },
  {
    id: "espana-animada",
    name: "Espana Animada",
    type: "Construto",
    size: "Pequeno",
    alignment: "Imparcial",
    ac: 17,
    hp: 17,
    speed: "0m, voo 15m (flutuar)",
    cr: "1/4",
    xp: 50,
    str: 12, dex: 15, con: 11, int: 1, wis: 5, cha: 1,
    damageImmunities: ["Veneno", "Psíquico"],
    conditionImmunities: ["Envenenado", "Enfeitiçado", "Exausto", "Cego", "Surdo", "Amedrontado"],
    abilities: [
      { name: "Falsa Aparência", desc: "Enquanto imobilizada parece uma espada comum." }
    ],
    actions: [
      { name: "Espada Longa", desc: "Ataque Corpo-a-Corpo com Arma: +3 acertar, 5 (1d8 + 1) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Espana Animada.png",
    tokenType: "billboard"
  },
  {
    id: "armadura-animada",
    name: "Armadura Animada",
    type: "Construto",
    size: "Médio",
    alignment: "Imparcial",
    ac: 18,
    hp: 33,
    speed: "7.5m",
    cr: "1",
    xp: 200,
    str: 14, dex: 11, con: 13, int: 1, wis: 3, cha: 1,
    damageImmunities: ["Veneno", "Psíquico"],
    conditionImmunities: ["Envenenado", "Enfeitiçado", "Exausto", "Cego", "Surdo", "Amedrontado", "Paralisado", "Petrificado"],
    abilities: [
      { name: "Falsa Aparência", desc: "Enquanto imóvel, parece uma armadura comum." },
      { name: "Sensibilidade a Antimagia", desc: "Fica incapacitada se alvo de dissipar magia." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques corpo-a-corpo." },
      { name: "Pancada", desc: "Ataque Corpo-a-Corpo com Arma: +4 para acertar. Acerto: 5 (1d6 + 2) de concussão." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Armadura Animada.png",
    tokenType: "billboard"
  },
  {
    id: "yuan-ti",
    name: "Yuan-ti",
    type: "Monstruosidade",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 12,
    hp: 40,
    speed: "9m",
    cr: "1",
    xp: 200,
    str: 11, dex: 12, con: 11, int: 13, wis: 12, cha: 14,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado"],
    abilities: [
      { name: "Resistência à Magia", desc: "Vantagem em testes de resistência contra magia." },
      { name: "Conjuração Inata", desc: "À vontade: amizade animal (apenas cobras), rajada de veneno. 3/dia: sugestão." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Cimitarra e arco." },
      { name: "Cimitarra", desc: "+3 acertar. Acerto: 4 (1d6 + 1) cortante mais 3 (1d6) veneno." },
      { name: "Arco Curto", desc: "+3 acertar, alcance 24/96m. 4 perfurante mais 3 (1d6) veneno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Yuan-ti.png",
    tokenType: "billboard"
  },
  {
    id: "worg",
    name: "Worg",
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Neutro e Mau",
    ac: 13,
    hp: 26,
    speed: "15m",
    cr: "1/2",
    xp: 100,
    str: 16, dex: 13, con: 13, int: 7, wis: 11, cha: 8,
    abilities: [
      { name: "Faro e Audição Aguçados", desc: "Vantagem em testes de Percepção baseados em cheiro e audição." }
    ],
    actions: [
      { name: "Mordida", desc: "+5 para acertar. Acerto: 10 (2d6 + 3) perfurante. O alvo testa Força CD 13 ou cai." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Worg.png",
    tokenType: "billboard"
  },
  {
    id: "fogo-fatuo",
    name: "Fogo Fátuo",
    type: "Morto-Vivo",
    size: "Miúdo",
    alignment: "Caótico e Mau",
    ac: 19,
    hp: 22,
    speed: "0m, voo 15m (flutuar)",
    cr: "2",
    xp: 450,
    str: 1, dex: 28, con: 10, int: 13, wis: 14, cha: 11,
    damageImmunities: ["Elétrico", "Veneno"],
    damageResistances: ["Ácido", "Frio", "Fogo", "Necrótico", "Trovejante", "Armas não-mágicas"],
    conditionImmunities: ["Envenenado", "Exausto", "Agarrado", "Derrubado", "Restrito", "Paralisado", "Inconsciente"],
    abilities: [
      { name: "Invisibilidade", desc: "O fogo fátuo e a sua luz ficam magicamente invisíveis como uma ação bônus." },
      { name: "Iluminação", desc: "Gera luz brilhante em 1.5 a 6m, à sua escolha." }
    ],
    actions: [
      { name: "Choque", desc: "Ataque Corpo-a-Corpo com Magia: +4 acertar. 9 (2d8) elétrico." },
      { name: "Consumir Vida", desc: "Como ação bônus, alveja criatura com 0 PV. Alvo testa Constituição CD 10 ou morre e fátuo cura 10 (3d6) PV." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Fogo Fatuo.png",
    tokenType: "billboard"
  },
  {
    id: "unicornio",
    name: "Unicórnio",
    type: "Celestial",
    size: "Grande",
    alignment: "Leal e Bom",
    ac: 12,
    hp: 67,
    speed: "15m",
    cr: "5",
    xp: 1800,
    str: 18, dex: 14, con: 15, int: 11, wis: 17, cha: 16,
    damageImmunities: ["Veneno"],
    conditionImmunities: ["Envenenado", "Enfeitiçado", "Paralisado"],
    abilities: [
      { name: "Armas Mágicas", desc: "O ataque do unicórnio conta como mágico." },
      { name: "Resistência a Magia", desc: "Vantagem nos salvamentos contra magia." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Cascos e chifre." },
      { name: "Cascos", desc: "+7 acertar. 11 (2d6 + 4) concussão." },
      { name: "Chifre", desc: "+7 acertar. 8 (1d8 + 4) perfurante." },
      { name: "Toque Curativo (3/Dia)", desc: "O unicórnio cura 11 (2d8 + 2) de uma criatura que tocar e remove doenças/veneno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Unicornio.png",
    tokenType: "billboard"
  },
  {
    id: "amontoado-tremulo",
    name: "Amontoado Trêmulo",
    type: "Planta",
    size: "Grande",
    alignment: "Imparcial",
    ac: 15,
    hp: 136,
    speed: "6m, natação 6m",
    cr: "5",
    xp: 1800,
    str: 18, dex: 8, con: 16, int: 5, wis: 10, cha: 5,
    damageResistances: ["Fogo", "Frio"],
    damageImmunities: ["Elétrico"],
    conditionImmunities: ["Cego", "Surdo", "Exausto"],
    abilities: [
      { name: "Absorção de Eletricidade", desc: "Sempre que sofrer dano elétrico, não sofre o dano e recupera PV igual ao dano sofrido." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques de pancada. Se os dois acertarem o mesmo alvo Médio ou menor, ele é agarrado." },
      { name: "Pancada", desc: "+7 acertar. Acerto: 13 (2d8 + 4) concussão." },
      { name: "Engolfar", desc: "Engolfa a criatura agarrada. Ela fica cega e restrita e sofre 13 (2d8+4) de dano concussão no início de cada turno da planta." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Amontoado Trêmulo.png",
    tokenType: "billboard"
  },
  {
    id: "sombra",
    name: "Sombra",
    type: "Morto-Vivo",
    size: "Médio",
    alignment: "Caótico e Mau",
    ac: 12,
    hp: 16,
    speed: "12m",
    cr: "1/2",
    xp: 100,
    str: 6, dex: 14, con: 13, int: 6, wis: 10, cha: 8,
    damageVulnerabilities: ["Radiante"],
    damageResistances: ["Fogo", "Frio", "Ácido", "Elétrico", "Trovejante", "Cortante, perfurante, concussão de armas não-mágicas"],
    damageImmunities: ["Necrótico", "Veneno"],
    conditionImmunities: ["Envenenado", "Agarrado", "Derrubado", "Restrito", "Amedrontado", "Paralisado", "Petrificado"],
    abilities: [
      { name: "Furtividade Umbral", desc: "Na penumbra, ela pode usar ação bônus para se Esconder (+4)." },
      { name: "Fraqueza à Luz", desc: "Enquanto sob luz solar, a sombra tem desvantagem no ataque, em testes de habilidade e em salvamentos." }
    ],
    actions: [
      { name: "Dreno de Força", desc: "+4 acertar. 9 (2d6 + 2) necrótico. O alvo perde 1d4 de Força. Morre instantaneamente se Força chegar a 0. Sombra gerada a partir da criatura após 1d4 horas." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Sombra.png",
    tokenType: "billboard"
  },
  {
    id: "bruxa-do-mar",
    name: "Bruxa do Mar",
    type: "Fada",
    size: "Médio",
    alignment: "Caótico e Mau",
    ac: 14,
    hp: 52,
    speed: "9m, natação 12m",
    cr: "2",
    xp: 450,
    str: 16, dex: 13, con: 16, int: 12, wis: 12, cha: 13,
    abilities: [
      { name: "Anfíbia", desc: "A bruxa pode respirar no ar e na água." },
      { name: "Ilusionista Feérica", desc: "Lança ilusões menores e desfigura a aparência de objetos." },
      { name: "Visão Pavorosa", desc: "Qualquer criatura que não seja hag a até 9m e veja sua verdadeira forma deve testar Sabedoria CD 11 ou Amedrontada por 1 minuto." }
    ],
    actions: [
      { name: "Garras", desc: "Corpo-a-corpo: +5 para acertar. Acerto: 10 (2d6 + 3) cortante." },
      { name: "Olhar Mortal", desc: "Testa na criatura Amedrontada por ela até 9m. Sabedoria CD 11 falha, ela cai a 0 PV (se tiver menos ou igual PV que a hag) ou fica Inconsciente." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Bruxa do Mar.png",
    tokenType: "billboard"
  },
  {
    id: "satiro",
    name: "Sátiro",
    type: "Fada",
    size: "Médio",
    alignment: "Caótico e Neutro",
    ac: 14,
    hp: 31,
    speed: "12m",
    cr: "1/2",
    xp: 100,
    str: 12, dex: 16, con: 11, int: 12, wis: 10, cha: 14,
    abilities: [
      { name: "Resistência à Magia", desc: "Vantagem em testes de resistência contra magias." }
    ],
    actions: [
      { name: "Chifrada", desc: "+3 acertar. 6 (2d4 + 1) concussão." },
      { name: "Espada Curta", desc: "+5 acertar. 6 (1d6 + 3) cortante." },
      { name: "Arco Curto", desc: "+5 acertar. 6 (1d6 + 3) perfurante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Sátiro.png",
    tokenType: "billboard"
  },
  {
    id: "salamandra",
    name: "Salamandra",
    type: "Elemental",
    size: "Grande",
    alignment: "Neutro e Mau",
    ac: 15,
    hp: 90,
    speed: "9m",
    cr: "5",
    xp: 1800,
    str: 18, dex: 14, con: 15, int: 11, wis: 10, cha: 12,
    damageImmunities: ["Fogo"],
    damageVulnerabilities: ["Frio"],
    abilities: [
      { name: "Corpo Aquecido", desc: "Qualquer criatura que tocar a salamandra ou acertá-la corpo-a-corpo a 1.5m sofre 7 (2d6) dano de fogo." },
      { name: "Armas Aquecidas", desc: "Seus ataques com arma adicionam +3 (1d6) fogo." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz dois ataques: lança e cauda." },
      { name: "Lança", desc: "+7 acertar. 11 (1d6+4) perfurante e 3 (1d6) de fogo." },
      { name: "Cauda", desc: "+7 acertar. 11 (2d6+4) concussão mais 7 (2d6) de fogo. O alvo fica agarrado e enquanto estiver agarrado, sofre dano de fogo extra no turno da salamandra." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Salamandra.png",
    tokenType: "billboard"
  },
  {
    id: "remorhaz",
    name: "Remorhaz",
    type: "Monstruosidade",
    size: "Enorme",
    alignment: "Imparcial",
    ac: 17,
    hp: 195,
    speed: "9m, escavação 6m",
    cr: "11",
    xp: 7200,
    str: 24, dex: 13, con: 21, int: 4, wis: 10, cha: 5,
    damageImmunities: ["Fogo", "Frio"],
    abilities: [
      { name: "Corpo Superaquecido", desc: "Criaturas tocando-a ou atacando a 1.5m sofrem 10 (3d6) dano de fogo." }
    ],
    actions: [
      { name: "Mordida", desc: "+11 acertar, 40 (6d10 + 7) perfurante. O alvo fica agarrado. Criatura engolida sofre 21 (6d6) dano de ácido no turno da criatura." },
      { name: "Engolir", desc: "Ataca a criatura agarrada, engole em acerto." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Remorhaz.png",
    tokenType: "billboard"
  },
  {
    id: "pseudo-dragao",
    name: "Pseudo dragão",
    type: "Dragão",
    size: "Miúdo",
    alignment: "Neutro e Bom",
    ac: 13,
    hp: 7,
    speed: "4.5m, voo 18m",
    cr: "1/4",
    xp: 50,
    str: 6, dex: 15, con: 13, int: 10, wis: 12, cha: 10,
    abilities: [
      { name: "Audição e Visão Aguçadas", desc: "Vantagem em Percepção com som/visão." },
      { name: "Telepatia Pessoal", desc: "Transmite emoções telepaticamente a 18m." },
      { name: "Resistência à Magia", desc: "Vantagem em saves vs magia." }
    ],
    actions: [
      { name: "Mordida", desc: "+4 acertar, 4 (1d4 + 2) perfurante." },
      { name: "Ferrão", desc: "+4 acertar. 4 (1d4+2) perfurante. Alvo testa Constituição CD 11 ou envenenado por 1h (fica inconsciente se falhar por 5 ou mais)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Pseudo dragão.png",
    tokenType: "billboard"
  },
  {
    id: "aranha-fasica",
    name: "Aranha Fásica",
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Imparcial",
    ac: 13,
    hp: 32,
    speed: "9m, escalada 9m",
    cr: "3",
    xp: 700,
    str: 15, dex: 15, con: 12, int: 6, wis: 10, cha: 6,
    abilities: [
      { name: "Trânsito Etéreo", desc: "A aranha pode passar magicamente do Plano Material para o Etéreo ou vice-versa como uma ação bônus." },
      { name: "Andar em Teias", desc: "A aranha ignora restrições de movimento das teias." }
    ],
    actions: [
      { name: "Mordida", desc: "+4 acertar. 7 (1d10+2) perfurante e o alvo testar Constituição CD 11 sofrendo 18 (4d8) de veneno." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Aranha Fásica.png",
    tokenType: "billboard"
  },
  {
    id: "geleia-ocre",
    name: "Geleia Ocre",
    type: "Limo",
    size: "Grande",
    alignment: "Imparcial",
    ac: 8,
    hp: 45,
    speed: "3m, escalada 3m",
    cr: "2",
    xp: 450,
    str: 15, dex: 6, con: 14, int: 2, wis: 6, cha: 1,
    damageResistances: ["Ácido"],
    damageImmunities: ["Elétrico", "Cortante"],
    conditionImmunities: ["Cego", "Surdo", "Amedrontado", "Exausto", "Caído", "Enfeitiçado"],
    abilities: [
      { name: "Amorfa", desc: "A geleia pode passar por um espaço tão estreito quanto 2,5 cm sem se espremer." },
      { name: "Divisão", desc: "Ao sofrer dano cortante ou elétrico, a geleia se divide em duas se for de tamanho Médio ou maior, repartindo os PV e diminuindo de tamanho." }
    ],
    actions: [
      { name: "Pseudópode", desc: "+4 acertar, 9 (2d6 + 2) concussão mais 3 (1d6) ácido." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Geleia Ocre.png",
    tokenType: "billboard"
  },
  {
    id: "pudim-negro",
    name: "Pudim Negro",
    type: "Limo",
    size: "Grande",
    alignment: "Imparcial",
    ac: 7,
    hp: 85,
    speed: "6m, escalada 6m",
    cr: "4",
    xp: 1100,
    str: 16, dex: 5, con: 16, int: 1, wis: 6, cha: 1,
    damageImmunities: ["Elétrico", "Cortante", "Ácido", "Frio"],
    conditionImmunities: ["Cego", "Surdo", "Amedrontado", "Exausto", "Caído", "Enfeitiçado"],
    abilities: [
      { name: "Forma Corrosiva", desc: "Uma criatura que toque o pudim sofre 4 (1d8) de dano ácido. Toda arma não-mágica usada p/ acertá-lo sofre corrosão permanente." },
      { name: "Divisão", desc: "Ao receber cortante ou elétrico, se divide em dois puddings menores." }
    ],
    actions: [
      { name: "Pseudópode", desc: "+5 acertar, 6 (1d6 + 3) concussão mais 18 (4d8) de ácido. Armaduras não mágicas atingidas corroem." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Pudim Negro.png",
    tokenType: "billboard"
  },
  {
    id: "mantor",
    name: "Mantor",
    type: "Aberração",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 14,
    hp: 78,
    speed: "3m, voo 12m",
    cr: "8",
    xp: 3900,
    str: 17, dex: 15, con: 12, int: 13, wis: 12, cha: 14,
    abilities: [
      { name: "Falsa Aparência", desc: "Imobilizado no chão, o mantor é indistinguível de couro/capa no escuro." },
      { name: "Cacofonia Inerente", desc: "Lança gemidos subsônicos para amedrontar as criaturas em 18m." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Faz um de mordida e dois ataques com sua cauda." },
      { name: "Mordida", desc: "+6 acertar, 10 (2d6 + 3) perfurante e engolfa a cabeça da criatura." },
      { name: "Cauda", desc: "+6 acertar, 7 (1d8 + 3) cortante." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Mantor.png",
    tokenType: "billboard"
  },
  {
    id: "nothic",
    name: "Nothic",
    type: "Aberração",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 15,
    hp: 45,
    speed: "9m",
    cr: "2",
    xp: 450,
    str: 14, dex: 16, con: 16, int: 13, wis: 10, cha: 8,
    abilities: [
      { name: "Visão Verdadeira", desc: "Pode perceber magia oculta e pensamentos. Teste Contestado de Percepção vs Enganação para extrair conhecimento místico de um alvo." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "Dois ataques de garra." },
      { name: "Garra", desc: "+4 acertar, 6 (1d6 + 3) cortante." },
      { name: "Olhar Apodrecido", desc: "O nothic fita uma criatura a até 9 metros. A criatura faz um teste de Constituição CD 12 e sofre 10 (3d6) de dano necrótico em falha." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Nothic.png",
    tokenType: "billboard"
  },
  {
    id: "bruxa-da-noite",
    name: "Bruxa da Noite",
    type: "Fada",
    size: "Médio",
    alignment: "Neutro e Mau",
    ac: 17,
    hp: 112,
    speed: "9m",
    cr: "5",
    xp: 1800,
    str: 18, dex: 15, con: 16, int: 16, wis: 14, cha: 16,
    damageResistances: ["Frio", "Fogo", "Armas não-mágicas"],
    abilities: [
      { name: "Resistência Mágica Inata", desc: "Vantagem em salvamentos vs magia." },
      { name: "Conjuração Inata", desc: "À vontade: detectar magia, raio ardente, mísseis mágicos. 2/dia cada: curar ferimentos, lentidão, raio do enfraquecimento." }
    ],
    actions: [
      { name: "Garra", desc: "+7 acertar, 13 (2d8 + 4) cortante." },
      { name: "Assombração (1/dia)", desc: "Enquanto a criatura-alvo estiver dormindo, a bruxa entra em seu sonho. O alvo sofre um pesadelo prolongado, não tem benefício no descanso e sofre redução de PV máximo. (Muitas bruxas têm Nightmares montados)." }
    ],
    tokenImageUrl: "/assets/2d/Monstros/Bruxa da Noite.png",
    tokenType: "billboard"
  }
];
