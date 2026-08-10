import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Dicionário de tradução estática
const TRANSLATION_MAPS = {
  sizes: {
    "Tiny": "Miúdo",
    "Small": "Pequeno",
    "Medium": "Médio",
    "Large": "Grande",
    "Huge": "Enorme",
    "Gargantuan": "Imenso"
  } as Record<string, string>,
  alignments: {
    "lawful good": "Leal e Bom",
    "neutral good": "Neutro e Bom",
    "chaotic good": "Caótico e Bom",
    "lawful neutral": "Leal e Neutro",
    "neutral": "Neutro",
    "chaotic neutral": "Caótico e Neutro",
    "lawful evil": "Leal e Mau",
    "neutral evil": "Neutro e Mau",
    "chaotic evil": "Caótico e Mau",
    "unaligned": "Sem Alinhamento",
    "any alignment": "Qualquer Alinhamento"
  } as Record<string, string>,
  types: {
    "aberration": "Aberração",
    "beast": "Besta",
    "celestial": "Celestial",
    "construct": "Construto",
    "dragon": "Dragão",
    "elemental": "Elemental",
    "fey": "Fada",
    "fiend": "Ínfero",
    "giant": "Gigante",
    "humanoid": "Humanóide",
    "monstrosity": "Monstruosidade",
    "ooze": "Limo",
    "plant": "Planta",
    "undead": "Morto-Vivo"
  } as Record<string, string>
};

// Traduz termos de D&D de forma genérica
function translateText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\bMelee Weapon Attack\b/gi, 'Ataque Corpo-a-Corpo com Arma')
    .replace(/\bRanged Weapon Attack\b/gi, 'Ataque à Distância com Arma')
    .replace(/\bMelee or Ranged Weapon Attack\b/gi, 'Ataque Corpo-a-Corpo ou à Distância com Arma')
    .replace(/\bto hit\b/gi, 'para acertar')
    .replace(/\breach\b/gi, 'alcance')
    .replace(/\brange\b/gi, 'alcance')
    .replace(/\bone target\b/gi, 'um alvo')
    .replace(/\bHit:\b/gi, 'Acerto:')
    .replace(/\bslashing damage\b/gi, 'dano cortante')
    .replace(/\bpiercing damage\b/gi, 'dano perfurante')
    .replace(/\bbludgeoning damage\b/gi, 'dano de concussão')
    .replace(/\bfire damage\b/gi, 'dano de fogo')
    .replace(/\bcold damage\b/gi, 'dano de frio')
    .replace(/\bacid damage\b/gi, 'dano de ácido')
    .replace(/\bpoison damage\b/gi, 'dano de veneno')
    .replace(/\bnecrotic damage\b/gi, 'dano necrótico')
    .replace(/\bpsychic damage\b/gi, 'dano psíquico')
    .replace(/\bforce damage\b/gi, 'dano de força')
    .replace(/\blightning damage\b/gi, 'dano elétrico')
    .replace(/\bthunder damage\b/gi, 'dano trovejante')
    .replace(/\bsaving throw\b/gi, 'teste de resistência')
    .replace(/\bStrength saving throw\b/gi, 'teste de resistência de Força')
    .replace(/\bDexterity saving throw\b/gi, 'teste de resistência de Destreza')
    .replace(/\bConstitution saving throw\b/gi, 'teste de resistência de Constituição')
    .replace(/\bIntelligence saving throw\b/gi, 'teste de resistência de Inteligência')
    .replace(/\bWisdom saving throw\b/gi, 'teste de resistência de Sabedoria')
    .replace(/\bCharisma saving throw\b/gi, 'teste de resistência de Carisma')
    .replace(/\bDC\b/g, 'CD')
    .replace(/\bMultiattack\b/g, 'Ataque Múltiplo')
    .replace(/\bThe monster makes\b/gi, 'A criatura faz')
    .replace(/\bft\./gi, 'metros')
    .replace(/\bplus\b/gi, 'mais');
}

// Mapeamento dos monstros com imagens em português para slugs do dnd5eapi
const PORTUGUESE_TO_ENGLISH_MAP: Record<string, string> = {
  "Aboleth": "aboleth",
  "Alma Penada": "wraith",
  "Androesfinge": "androsphinx",
  "Aparição": "specter",
  "Aranha Gigante": "giant-spider",
  "Arqueiro Goblin": "goblin", // Usará base do goblin mas com arco adaptado no código
  "Balor": "balor",
  "Banshee": "banshee",
  "Basilisco": "basilisk",
  "Beholder": "beholder",
  "Bruxa Verde": "green-hag",
  "Bugbear": "bugbear",
  "Bulette": "bulette",
  "Carniçal": "ghoul",
  "Catoblepas": "catoblepas", // Fallback customizado
  "Cavaleiro da Morta": "death-knight",
  "Caveira Flamejante": "flameskull",
  "Centauro": "centaur",
  "Ciclope": "cyclops",
  "Cocatriz": "cockatrice",
  "Cubo Gelatinoso": "gelatinous-cube",
  "Devorador de Mentes": "mind-flayer", // Fallback customizado
  "Diabo de Chifres": "horned-devil",
  "Diabo do Abismo": "pit-fiend",
  "Djinni": "djinni",
  "Dopel": "doppelganger",
  "Driade": "dryad",
  "Drider": "drider",
  "Efreeti": "efreeti",
  "Elemental da Agua": "water-elemental",
  "Elemental da Pedra": "earth-elemental",
  "Elemental do Fogo": "fire-elemental",
  "Elemental do Vento": "air-elemental",
  "Elfo Drow": "drow",
  "Enforcador": "choker", // Fallback customizado
  "Ent": "treant",
  "Esfinge": "gynosphinx",
  "Esqueleto": "skeleton",
  "Fantasma": "ghost",
  "Gargula": "gargoyle",
  "Gigante da Colina": "hill-giant",
  "Gigante da Tempestade": "storm-giant",
  "Gigante das Núvens": "cloud-giant",
  "Gigante de Pedra": "stone-giant",
  "Gigante do Fogo": "fire-giant",
  "Gigante do Gelo": "frost-giant",
  "Githyanki": "githyanki-warrior",
  "Githzerai": "githzerai-monk",
  "Gnoll": "gnoll",
  "Golem de Barro": "clay-golem",
  "Golem de Carne": "flesh-golem",
  "Golem de Ferro": "iron-golem",
  "Golem de Pedra": "stone-golem",
  "Gorgona": "gorgon",
  "Grifo": "griffon",
  "Guerreiro Goblin": "goblin",
  "Harpia": "harpy",
  "Hidra": "hydra",
  "Hipogrifo": "hippogriff",
  "Hobgoblin": "hobgoblin",
  "Homúnculo": "homunculus",
  "Horror de Gancho": "hook-horror",
  "Imp": "imp",
  "Incubus": "incubus",
  "Kobold": "kobold",
  "Kua Tao": "kuo-toa",
  "Lich": "lich",
  "Lívido": "ghast",
  "Manticora": "manticore",
  "Marilith": "marilith",
  "Medusa": "medusa",
  "Merrow": "merrow",
  "Mimico": "mimic",
  "Minotauro": "minotaur",
  "Mostro da Ferrugem": "rust-monster",
  "Mumia": "mummy",
  "Naga": "spirit-naga",
  "Ogro": "ogre",
  "Orc": "orc",
  "Pantera Deslocadora": "displacer-beast", // Fallback customizado
  "Pegasus": "pegasus",
  "Peryton": "peryton",
  "Povo Lagarto": "lizardfolk",
  "Prole Vampirica": "vampire-spawn",
  "Quasit": "quasit",
  "Quimera": "chimera",
  "Rato Gigante": "giant-rat",
  "Sereia": "merfolk",
  "Sprite": "sprite",
  "Sucubus": "succubus",
  "Tritão": "triton",
  "Troll": "troll",
  "Umber Hulk": "umber-hulk", // Fallback customizado
  "Urso-Coruja": "owlbear",
  "Vampiro": "vampire",
  "Verme Purpura": "purple-worm",
  "Verme da Carniça": "carrion-crawler", // Fallback customizado
  "Vingador": "revenant",
  "Wyvern": "wyvern",
  "Zumbi": "zombie"
};

// Fallbacks de estatísticas ricas para monstros fora da SRD ou com 404
const CUSTOM_FALLBACKS: Record<string, any> = {
  "mind-flayer": {
    type: "Aberração",
    size: "Médio",
    alignment: "Leal e Mau",
    ac: 15,
    hp: 71,
    speed: "9m (30ft)",
    cr: "7",
    xp: 2900,
    str: 11, dex: 12, con: 12, int: 19, wis: 17, cha: 17,
    abilities: [
      { name: "Resistência à Magia", desc: "O devorador de mentes tem vantagem em testes de resistência contra magias e outros efeitos mágicos." },
      { name: "Conjunção Inata (Psiquismo)", desc: "A habilidade de conjuração inata do devorador de mentes é Inteligência (salvamento de magia CD 15). Ele pode conjurar de forma inata as seguintes magias sem necessidade de componentes materiais: À Vontade: detectar pensamentos, levitação. 1/dia cada: dominar monstro, viagem planar (apenas em si mesmo)." }
    ],
    actions: [
      { name: "Tentáculos", desc: "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 1.5m, uma criatura. Acerto: 15 (2d10 + 4) de dano psíquico. Se o alvo for de tamanho Médio ou menor, ele fica agarrado (CD 15 para escapar) e deve passar em um teste de resistência de Inteligência CD 15 ou ficará atordoado até o agarrão terminar." },
      { name: "Extrair Cérebro", desc: "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 1.5m, um humanóide incapacitado agarrado pelo devorador de mentes. Acerto: 55 (10d10) de dano perfurante. Se este dano reduzir o alvo a 0 pontos de vida, o devorador de mentes mata o alvo ao extrair e devorar seu cérebro." },
      { name: "Rajada Psíquica (Recarga 5-6)", desc: "O devorador de mentes emite magicamente energia psíquica em um cone de 18 metros. Cada criatura na área deve ser bem-sucedida em um teste de resistência de Inteligência CD 15 ou sofrerá 22 (4d8 + 4) de dano psíquico e ficará atordoada por 1 minuto. A criatura pode repetir o teste de resistência no final de cada um dos seus turnos, terminando o efeito sobre si mesma em caso de sucesso." }
    ]
  },
  "beholder": {
    type: "Aberração",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 18,
    hp: 180,
    speed: "0m, voo 6m (flutuar)",
    cr: "13",
    xp: 10000,
    str: 10, dex: 14, con: 18, int: 17, wis: 15, cha: 17,
    abilities: [
      { name: "Cone Antimagia", desc: "O olho central do observador cria uma área de antimagia em um cone de 45 metros. No início de cada um de seus turnos, o observador decide para onde o cone está voltado e se ele está ativo." }
    ],
    actions: [
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 1.5m, um alvo. Acerto: 14 (4d6) de dano perfurante." },
      { name: "Raios Oculares", desc: "O observador dispara aleatoriamente 3 raios oculares em alvos que ele possa ver a até 36 metros (Raio de Charme, Raio de Paralisia, Raio de Medo, Raio de Desaceleração, Raio de Telecinesia, Raio de Sono, Raio de Petrificação, Raio de Desintegração, Raio da Morte)." }
    ]
  },
  "displacer-beast": {
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Leal e Mau",
    ac: 13,
    hp: 85,
    speed: "12m (40ft)",
    cr: "3",
    xp: 700,
    str: 18, dex: 15, con: 16, int: 6, wis: 12, cha: 8,
    abilities: [
      { name: "Deslocamento", desc: "A pantera projeta uma ilusão mágica que faz com que ela pareça estar a alguns metros de sua localização real. Ataques contra ela têm desvantagem. Se for atingida por um ataque, esta característica é desativada até o início de seu próximo turno." },
      { name: "Esquiva Sobrenatural", desc: "Quando a pantera for submetida a um efeito que permite um teste de resistência de Destreza para sofrer apenas metade do dano, ela não sofrerá dano se passar, e apenas metade se falhar." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "A pantera faz dois ataques com seus tentáculos." },
      { name: "Tentáculo", desc: "Ataque Corpo-a-Corpo com Arma: +6 para acertar, alcance 3m, um alvo. Acerto: 7 (1d6 + 4) de dano cortante mais 3 (1d6) de dano de força." }
    ]
  },
  "umber-hulk": {
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Caótico e Mau",
    ac: 18,
    hp: 93,
    speed: "9m (30ft), escavação 6m",
    cr: "5",
    xp: 1800,
    str: 20, dex: 13, con: 16, int: 9, wis: 10, cha: 10,
    abilities: [
      { name: "Olhar Confuso", desc: "Quando uma criatura inicia seu turno a até 9 metros do umber hulk e os dois podem se ver, o umber hulk pode forçar a criatura a fazer um teste de resistência de Carisma CD 15. Em caso de falha, a criatura fica Confusa até o início do seu próximo turno." },
      { name: "Tuneladora", desc: "O umber hulk pode escavar através de rocha sólida, deixando um túnel de 1.5 metros de diâmetro atrás de si." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O umber hulk faz três ataques: dois com suas garras e um com sua mordida." },
      { name: "Garra", desc: "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 1.5m, um alvo. Acerto: 9 (1d8 + 5) de dano cortante." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 1.5m, um alvo. Acerto: 14 (2d8 + 5) de dano perfurante." }
    ]
  },
  "carrion-crawler": {
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Neutro",
    ac: 13,
    hp: 51,
    speed: "9m (30ft), escalada 9m",
    cr: "2",
    xp: 450,
    str: 14, dex: 13, con: 16, int: 1, wis: 12, cha: 5,
    abilities: [
      { name: "Faro Aguçado", desc: "O verme da carniça tem vantagem em testes de Sabedoria (Percepção) que dependam do olfato." },
      { name: "Escalada de Aranha", desc: "O verme da carniça pode escalar superfícies difíceis, incluindo de cabeça para baixo em tetos, sem a necessidade de um teste de habilidade." }
    ],
    actions: [
      { name: "Ataque Múltiplo", desc: "O verme faz dois ataques: um com seus tentáculos e um com sua mordida." },
      { name: "Tentáculos", desc: "Ataque Corpo-a-Corpo com Arma: +8 para acertar, alcance 3m, um alvo. Acerto: 4 (1d4 + 2) de dano de concussão, e o alvo deve passar em um teste de resistência de Constituição CD 13 ou ficará envenenado por 1 minuto. Enquanto envenenado desta forma, o alvo também fica paralisado." },
      { name: "Mordida", desc: "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 1.5m, um alvo. Acerto: 7 (2d4 + 2) de dano perfurante." }
    ]
  },
  "choker": {
    type: "Aberração",
    size: "Pequeno",
    alignment: "Caótico e Mau",
    ac: 16,
    hp: 13,
    speed: "9m (30ft), escalada 9m",
    cr: "1",
    xp: 200,
    str: 16, dex: 14, con: 13, int: 4, wis: 12, cha: 7,
    abilities: [
      { name: "Membros Elásticos", desc: "Os tentáculos e braços do enforcador dão a ele um alcance adicional de 1.5m em ataques corpo-a-corpo." }
    ],
    actions: [
      { name: "Tentáculo", desc: "Ataque Corpo-a-Corpo com Arma: +5 para acertar, alcance 3m, um alvo. Acerto: 6 (1d6 + 3) de dano de concussão e o alvo fica agarrado (CD 13 para escapar)." }
    ]
  },
  "catoblepas": {
    type: "Monstruosidade",
    size: "Grande",
    alignment: "Neutro",
    ac: 13,
    hp: 84,
    speed: "9m (30ft)",
    cr: "5",
    xp: 1800,
    str: 19, dex: 12, con: 21, int: 3, wis: 12, cha: 8,
    abilities: [
      { name: "Fedor", desc: "Qualquer criatura que iniciar seu turno a até 3 metros do catoblepas deve passar em um teste de resistência de Constituição CD 16 ou ficará Envenenada." }
    ],
    actions: [
      { name: "Pancada com Cauda", desc: "Ataque Corpo-a-Corpo com Arma: +7 para acertar, alcance 3m, um alvo. Acerto: 15 (2d10 + 4) de dano de concussão e o alvo deve passar em teste de resistência de CON CD 16 ou fica atordoado." },
      { name: "Olhar da Morte (Recarga 5-6)", desc: "O catoblepas mira seu olhar mortífero em uma criatura a até 9 metros. Teste de resistência de Constituição CD 16. Em caso de falha, sofre 36 (8d8) de dano necrótico." }
    ]
  }
};

// Função para buscar dados da API D&D 5e
async function fetchMonsterFromAPI(slug: string): Promise<any> {
  const url = `https://www.dnd5eapi.co/api/monsters/${slug}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch monster: ${slug} (${response.status})`);
  }
  return await response.json();
}

async function run() {
  console.log('--- Iniciando Carregamento de Monstros ---');
  
  // 1. Obter lista de arquivos locais na pasta public/assets/2d/Monstros
  const monstersDir = path.join(__dirname, '../public/assets/2d/Monstros');
  if (!fs.existsSync(monstersDir)) {
    console.error(`Diretório não encontrado: ${monstersDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(monstersDir).filter(f => f.toLowerCase().endsWith('.png'));
  console.log(`Encontrados ${files.length} arquivos de imagem de monstros.`);

  const importedMonsters: any[] = [];

  // 2. Loop sobre os arquivos de monstros
  for (const file of files) {
    const displayName = path.basename(file, '.png');
    const slug = PORTUGUESE_TO_ENGLISH_MAP[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
    const id = displayName.toLowerCase().replace(/\s+/g, '-').replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/[ç]/g, 'c');
    
    console.log(`Processando: "${displayName}" (ID: ${id}, API Slug: ${slug})...`);

    let rawMonster: any = null;

    // A. Verificar se tem fallback customizado
    if (CUSTOM_FALLBACKS[slug]) {
      console.log(`   -> Usando fallback local para "${displayName}"`);
      rawMonster = CUSTOM_FALLBACKS[slug];
    } else {
      // B. Buscar da API
      try {
        const apiData = await fetchMonsterFromAPI(slug);
        
        // Mapear dados da API para o nosso formato
        const translatedType = TRANSLATION_MAPS.types[apiData.type] || translateText(apiData.type) || "Monstro";
        const translatedSize = TRANSLATION_MAPS.sizes[apiData.size] || apiData.size || "Médio";
        const translatedAlignment = TRANSLATION_MAPS.alignments[apiData.alignment] || translateText(apiData.alignment) || "Neutro";

        const speedText = Object.entries(apiData.speed || {})
          .map(([k, v]) => {
            const val = String(v);
            if (k === 'walk') return `${val.replace('ft.', 'm').replace(/\d+/, (m) => String(Math.round(parseInt(m) * 0.3)))}`;
            return `${k}: ${val.replace('ft.', 'm').replace(/\d+/, (m) => String(Math.round(parseInt(m) * 0.3)))}`;
          })
          .join(', ');

        const abilities = (apiData.special_abilities || []).map((sa: any) => ({
          name: translateText(sa.name),
          desc: translateText(sa.desc)
        }));

        const actions = (apiData.actions || []).map((act: any) => ({
          name: translateText(act.name),
          desc: translateText(act.desc)
        }));

        rawMonster = {
          name: displayName,
          type: translatedType,
          size: translatedSize,
          alignment: translatedAlignment,
          ac: typeof apiData.armor_class === 'object' && Array.isArray(apiData.armor_class) ? (apiData.armor_class[0]?.value || 10) : (apiData.armor_class || 10),
          hp: apiData.hit_points,
          speed: speedText || '9m (30ft)',
          cr: String(apiData.challenge_rating),
          xp: apiData.xp || 100,
          str: apiData.strength,
          dex: apiData.dexterity,
          con: apiData.constitution,
          int: apiData.intelligence,
          wis: apiData.wisdom,
          cha: apiData.charisma,
          abilities,
          actions
        };
      } catch (error) {
        console.warn(`   -> Falha na API para "${displayName}" (Slug: ${slug}). Usando valores padrões.`);
        
        // Default Fallback
        rawMonster = {
          name: displayName,
          type: "Monstruosidade",
          size: "Médio",
          alignment: "Neutro",
          ac: 12,
          hp: 30,
          speed: "9m (30ft)",
          cr: "1",
          xp: 200,
          str: 12, dex: 12, con: 12, int: 10, wis: 10, cha: 10,
          abilities: [],
          actions: [
            { name: "Ataque Pancada", desc: "Ataque Corpo-a-Corpo com Arma: +3 para acertar, alcance 1.5m, um alvo. Acerto: 5 (1d6 + 2) de dano de concussão." }
          ]
        };
      }
    }

    // Se for o Arqueiro Goblin, vamos fazer alguns ajustes customizados em cima do goblin comum
    if (displayName === "Arqueiro Goblin") {
      rawMonster.name = "Arqueiro Goblin";
      rawMonster.ac = 15;
      rawMonster.hp = 7;
      rawMonster.cr = "1/4";
      rawMonster.xp = 50;
      rawMonster.actions = [
        { name: "Adaga", desc: "Ataque Corpo-a-Corpo com Arma: +4 para acertar, alcance 1.5m, um alvo. Acerto: 4 (1d4 + 2) de dano perfurante." },
        { name: "Arco Curto", desc: "Ataque à Distância com Arma: +4 para acertar, distância 24/96m, um alvo. Acerto: 5 (1d6 + 2) de dano perfurante." }
      ];
    }

    // Adicionar os atributos específicos de pino e modelo
    rawMonster.id = id;
    rawMonster.tokenImageUrl = `/assets/2d/Monstros/${file}`;
    rawMonster.tokenType = 'billboard';
    rawMonster.modelUrl = null;

    importedMonsters.push(rawMonster);
  }

  // 3. Upsert no banco de dados Supabase
  console.log(`Gravando ${importedMonsters.length} monstros no Supabase...`);
  const payload = importedMonsters.map(m => ({
    id: m.id,
    name: m.name,
    type: m.type,
    size: m.size,
    alignment: m.alignment,
    ac: m.ac,
    hp: m.hp,
    speed: m.speed,
    cr: m.cr,
    xp: m.xp,
    str: m.str,
    dex: m.dex,
    con: m.con,
    int: m.int,
    wis: m.wis,
    cha: m.cha,
    abilities: m.abilities,
    actions: m.actions,
    token_image_url: m.tokenImageUrl,
    token_type: m.tokenType,
    model_url: m.modelUrl
  }));

  const { error } = await supabase
    .from('srd_monsters')
    .upsert(payload);

  if (error) {
    console.error('Erro ao salvar no banco Supabase:', error.message);
  } else {
    console.log('Salvo com sucesso no banco de dados!');
  }

  // 4. Reescrever lib/srd-data.ts mantendo as outras listas intactas
  const srdDataPath = path.join(__dirname, '../lib/srd-data.ts');
  console.log(`Atualizando arquivo estático local: ${srdDataPath}`);
  
  const existingContent = fs.readFileSync(srdDataPath, 'utf8');

  // Localizar e extrair arrays que não sejam o INITIAL_MONSTERS
  const startMonstersIndex = existingContent.indexOf('export const INITIAL_MONSTERS: SRDMonster[] = [');
  const startSpellsIndex = existingContent.indexOf('export const INITIAL_SPELLS: SRDSpell[] = [');

  if (startMonstersIndex === -1 || startSpellsIndex === -1) {
    console.error('Não foi possível fazer o parsing do arquivo lib/srd-data.ts existente');
    process.exit(1);
  }

  // Pegar cabeçalho (imports e CONDITIONS)
  const header = existingContent.substring(0, startMonstersIndex);
  
  // Pegar corpo restante (de INITIAL_SPELLS até o fim)
  const rest = existingContent.substring(startSpellsIndex);

  // Serializar os novos monstros
  const monstersSerialized = JSON.stringify(importedMonsters, null, 2);
  
  const newContent = `${header}export const INITIAL_MONSTERS: SRDMonster[] = ${monstersSerialized};\n\n${rest}`;

  fs.writeFileSync(srdDataPath, newContent, 'utf8');
  console.log('Arquivo lib/srd-data.ts atualizado com sucesso!');
  console.log('--- Carregamento de Monstros Concluído! ---');
}

run();
