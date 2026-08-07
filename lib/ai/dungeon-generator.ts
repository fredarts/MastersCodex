import { GoogleGenAI } from '@google/genai';
import { getPatternPromptInstructions } from './dungeon-patterns';

export interface AIDungeonRequestParams {
  prompt: string;
  theme: string;
  level: number;
  floors: number;
  hasPuzzles: boolean;
  hasSecretPassages: boolean;
  cols: number;
  rows: number;
  patternId?: string;
  apiKey?: string;
}

export interface AIDungeonRoom {
  id: string;
  name: string;
  type: 'entrance' | 'hall' | 'crypt' | 'boss_room' | 'treasury' | 'corridor' | 'secret_chamber';
  bounds: { startCol: number; startRow: number; width: number; height: number };
  floorTileType: 'floor' | 'stone' | 'wood' | 'carpet' | 'water' | 'lava' | 'dirt';
  hasPillars?: boolean;
}

export interface AIDungeonElement {
  type: 'door' | 'portcullis' | 'trap' | 'chest' | 'stash' | 'trigger' | 'illusion_wall' | 'stairs';
  col: number;
  row: number;
  config: {
    status?: 'open' | 'closed' | 'locked';
    dc?: number;
    triggerId?: string;
    targetId?: string;
    description?: string;
    lootItems?: string[];
    notesForDM?: string;
  };
}

export interface AIDungeonLight {
  col: number;
  row: number;
  preset: 'torch' | 'candle' | 'lantern' | 'brazier' | 'spell' | 'dragon';
  color?: string;
  radius?: number;
  animation?: 'torch' | 'pulse' | 'candle' | 'none';
}

export interface AIDungeonOutput {
  metadata: {
    title: string;
    description: string;
    recommendedLevel: number;
    theme: string;
    floorIndex: number;
    totalFloors: number;
  };
  gridSize: { cols: number; rows: number };
  rooms: AIDungeonRoom[];
  corridors?: Array<{ startCol: number; startRow: number; width: number; height: number; floorTileType?: string }>;
  elements: AIDungeonElement[];
  lightSources: AIDungeonLight[];
}

export async function generateDungeonFloorWithAI(
  params: AIDungeonRequestParams,
  floorIndex: number = 1
): Promise<AIDungeonOutput> {
  const apiKey =
    params.apiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('codex_gemini_api_key') : undefined) ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não encontrada. Configure a sua chave de API nas configurações ou no .env.local (GEMINI_API_KEY).');
  }

  const ai = new GoogleGenAI({ apiKey });

  const patternRules = getPatternPromptInstructions(params.patternId);

  const systemInstruction = `Você é um mestre arquiteto de masmorras de D&D 5e e especialista em procedural dungeon generation no estilo Dyson Logos.
Sua missão é gerar um JSON completo e estritamente válido representando o layout tático 2D de um andar de masmorra rica e detalhada.

${patternRules}

REGRA ABSOLUTA DE TAMANHO DO GRID:
- O grid possui ${params.cols} colunas (largura) por ${params.rows} linhas (altura).
- Todas as coordenadas (col: 0 a ${params.cols - 1}, row: 0 a ${params.rows - 1}) DEVEM ESTAR DENTRO DOS LIMITES.
- Deixe uma margem de no mínimo 3 células ao redor das bordas externas como paredes.

REGRAS DE LAYOUT E CÔMODOS (MUITO IMPORTANTE):
- Defina entre 5 e 10 salas/cômodos de tamanhos variados (ex: largura 6 a 14, altura 6 a 12).
- Crie um salão principal ("hasPillars": true) para o chefe ou altar com pilares internos de sustentação.
- CONECTIVIDADE TOTAL OBRIGATÓRIA: Crie corredores ('type': 'corridor') interligando fisicamente todas as salas. NENHUMA sala pode ficar isolada/ilhada no mapa.
- Todo corredor deve ter suas coordenadas ('bounds') sobrepostas ou encostadas em pelo menos uma sala ou outro corredor para garantir o tráfego contínuo dos jogadores.
- CADA SALA E CORREDOR DEVE TER UM OBJETO 'bounds' COM: {"startCol": número, "startRow": número, "width": número, "height": número}.
- Utilize uma VARIEDADE RICA de pisos/terrenos ('floorTileType'): 'floor', 'stone', 'wood', 'carpet', 'water' (poços/esgotos), 'lava', 'dirt', 'grass' (pátios/entradas).

REGRAS DE ELEMENTOS E INTERATIVIDADE (OBRIGATÓRIO USAR TODOS OS TIPOS DA BARRA DE FERRAMENTAS):
- 'door': Portas de madeira nas entradas de salas.
- 'portcullis': Grades de ferro em corredores e salas de tesouro.
- 'trigger': Mecanismos / Alavancas presas à parede para abrir grades ou desativar armadilhas.
- 'trap': Armadilhas ocultas (estacas, veneno, fosso) com CD de detecção/desarme.
- 'chest': Baús trancados ou abertos contendo tesouros, moedas e itens mágicos em 'lootItems'.
- 'stash': Esconderijos secretos (Stash Oculto) escondidos sob lajotas ou fundos falsos.
- 'illusion_wall': Parede Falsa para esconder passagens secretas e câmaras ocultas.
- Se Puzzles estiver ativado (${params.hasPuzzles}): Crie obrigatoriamente 1 alavanca ('type': 'trigger') em uma sala e 1 grade ('type': 'portcullis') bloqueando o tesouro ou chefão, usando o mesmo 'triggerId'.
- Se Passagens Secretas estiver ativado (${params.hasSecretPassages}): Crie 1 a 3 'illusion_wall' (Parede Falsa) escondendo salas 'secret_chamber'.

REGRAS DE ILUMINAÇÃO RICA E DIVERSICADA (OBRIGATÓRIO POSICIONAR ENTRE 10 E 25 FONTES DE LUZ):
- Use uma combinação diversificada dos seguintes tipos de luzes ('preset'):
  * 'torch': Tochas de parede (#ff9900) em corredores e entradas.
  * 'candle': Velas alaranjadas (#ffaa33) em altares e sarcófagos.
  * 'lantern': Lampiões quentes (#ffee77) em salas de guarda e arsenais.
  * 'brazier': Braseiros de fogo (#ff4400) em salões centrais e grandes câmaras.
  * 'spell': Cristais mágicos / luz mística azul (#00ccff) em salas de rituais e tesouros.

ESTRUTURA JSON EXATA OBRIGATÓRIA (Siga estritamente esta nomenclatura de chaves):
{
  "metadata": {
    "title": "Nome da Masmorra",
    "description": "Descrição do local",
    "recommendedLevel": ${params.level},
    "theme": "${params.theme}",
    "floorIndex": ${floorIndex},
    "totalFloors": ${params.floors}
  },
  "gridSize": { "cols": ${params.cols}, "rows": ${params.rows} },
  "rooms": [
    {
      "id": "room_1",
      "name": "Salão de Entrada",
      "type": "entrance",
      "bounds": { "startCol": 10, "startRow": 10, "width": 12, "height": 10 },
      "floorTileType": "stone"
    },
    {
      "id": "corridor_1",
      "name": "Corredor Norte",
      "type": "corridor",
      "bounds": { "startCol": 22, "startRow": 14, "width": 16, "height": 2 },
      "floorTileType": "floor"
    }
  ],
  "elements": [
    {
      "type": "door",
      "col": 22,
      "row": 14,
      "config": { "status": "closed", "dc": 12 }
    },
    {
      "type": "chest",
      "col": 14,
      "row": 14,
      "config": { "status": "locked", "dc": 15, "lootItems": ["Anel de Proteção", "100 po"] }
    }
  ],
  "lightSources": [
    {
      "col": 12,
      "row": 12,
      "preset": "torch",
      "color": "#ff9900",
      "radius": 4,
      "animation": "torch"
    }
  ]
}`;

  const userPrompt = `Gere o andar ${floorIndex} de ${params.floors} de uma masmorra tática no grid ${params.cols}x${params.rows}:
- Tema: ${params.theme}
- Nível recomendado do grupo: ${params.level}
- Incluir Puzzles/Alavancas: ${params.hasPuzzles ? 'SIM' : 'NÃO'}
- Incluir Passagens Secretas: ${params.hasSecretPassages ? 'SIM' : 'NÃO'}
- Orientação do Mestre: "${params.prompt || 'Masmorra detalhada com salas grandes, corredores conectados, armadilhas e baús.'}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemInstruction}\n\n${userPrompt}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    if (!text) {
      throw new Error('A IA respondeu com um conteúdo vazio.');
    }

    const dungeonOutput: AIDungeonOutput = cleanAndParseJSON(text);
    return dungeonOutput;
  } catch (error: any) {
    console.error('Erro ao gerar masmorra por IA:', error);
    throw new Error(error?.message || 'Falha ao conectar com o serviço de IA para gerar a masmorra.');
  }
}

function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();

  // 1. Remove markdown code fences if present
  cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '');

  // 2. Locate the first '{' and the last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // 3. Remove single-line JS comments (// ...) and multi-line comments (/* ... */)
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  cleaned = cleaned.replace(/(^|[^:])\/\/.*/g, '$1');

  // 4. Remove trailing commas in objects and arrays
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    try {
      // Fix control characters/newlines inside string values
      const repaired = cleaned.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
      return JSON.parse(repaired);
    } catch (err2) {
      console.error('Falha ao sanitizar JSON da IA. Texto bruto:', rawText);
      throw new Error('O formato retornado pela IA continha um erro de sintaxe JSON. Por favor, tente gerar novamente.');
    }
  }
}
