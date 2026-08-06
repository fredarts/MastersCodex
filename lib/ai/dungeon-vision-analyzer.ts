import { GoogleGenAI } from '@google/genai';
import { AIDungeonRoom, AIDungeonElement, AIDungeonLight } from './dungeon-generator';

export interface DungeonPatternBlueprint {
  id: string;
  name: string;
  description: string;
  styleTag: string; // e.g., 'dyson_logos', 'catacombs', 'temple', 'cavern'
  gridRatio: { cols: number; rows: number };
  architecturalRules: {
    hasCentralGrandHall: boolean;
    hasPillaredChambers: boolean;
    hasSecretPassageLoops: boolean;
    hasSymmetricEntry: boolean;
    hasAlcoves: boolean;
  };
  sampleRooms: Array<{
    name: string;
    type: string;
    relativeBounds: { startColPct: number; startRowPct: number; widthPct: number; heightPct: number };
    hasPillars?: boolean;
    floorTileType: string;
  }>;
  sampleElements: Array<{
    type: string;
    colPct: number;
    rowPct: number;
    isSecret?: boolean;
  }>;
}

export async function analyzeDungeonMapImage(
  imageDataUrlOrBase64: string,
  apiKey?: string
): Promise<DungeonPatternBlueprint> {
  const key =
    apiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('codex_gemini_api_key') : undefined) ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!key) {
    throw new Error('Chave de API do Gemini não encontrada para análise por visão.');
  }

  const ai = new GoogleGenAI({ apiKey: key });

  // Clean base64 string and extract mimeType
  let base64Data = imageDataUrlOrBase64;
  let mimeType = 'image/png';

  if (imageDataUrlOrBase64.startsWith('data:')) {
    const parts = imageDataUrlOrBase64.split(',');
    const match = parts[0].match(/data:(.*?);base64/);
    if (match) mimeType = match[1];
    base64Data = parts[1];
  }

  const systemPrompt = `Você é um arquiteto especialista em mapas de D&D 5e e análise de visão computacional de mapas no estilo Dyson Logos.
Analise a imagem deste mapa de masmorra e extraia seu blueprint arquitetônico em JSON estritamente válido.

RETORNE APENAS O JSON (sem markdown adicional):
{
  "id": "pattern_${Date.now()}",
  "name": "Nome descritivo do estilo do mapa analisado",
  "description": "Análise da topologia, salas, pilares e conexões observadas no mapa",
  "styleTag": "dyson_logos",
  "gridRatio": { "cols": 80, "rows": 80 },
  "architecturalRules": {
    "hasCentralGrandHall": true,
    "hasPillaredChambers": true,
    "hasSecretPassageLoops": true,
    "hasSymmetricEntry": true,
    "hasAlcoves": true
  },
  "sampleRooms": [
    {
      "name": "Salão de Entrada Semicircular",
      "type": "entrance",
      "relativeBounds": { "startColPct": 0.4, "startRowPct": 0.8, "widthPct": 0.2, "heightPct": 0.15 },
      "hasPillars": false,
      "floorTileType": "stone"
    },
    {
      "name": "Salão Central com Pilares",
      "type": "boss_room",
      "relativeBounds": { "startColPct": 0.35, "startRowPct": 0.25, "widthPct": 0.3, "heightPct": 0.2 },
      "hasPillars": true,
      "floorTileType": "floor"
    }
  ],
  "sampleElements": [
    { "type": "door", "colPct": 0.5, "rowPct": 0.78, "isSecret": false },
    { "type": "illusion_wall", "colPct": 0.5, "rowPct": 0.45, "isSecret": true }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        systemPrompt,
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    if (!text) throw new Error('A IA não retornou nenhum dado de análise de visão.');

    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    const blueprint: DungeonPatternBlueprint = JSON.parse(cleaned);

    return blueprint;
  } catch (error: any) {
    console.error('Erro ao analisar imagem do mapa com Visão Gemini:', error);
    throw new Error(error?.message || 'Falha ao analisar imagem do mapa.');
  }
}
