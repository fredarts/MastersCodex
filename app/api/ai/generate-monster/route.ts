import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, userSettings } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'O prompt de descrição do monstro é obrigatório.' }, { status: 400 });
    }

    const systemPrompt = `Você é um mestre de RPG especialista em D&D 5e e criação de criaturas incríveis para campanhas.
O usuário quer criar um monstro customizado a partir deste prompt:
"${prompt}"

Sua missão é gerar uma ficha de monstro completa, extremamente rica em detalhes, balanceada e criativa.
Responda ESTRITAMENTE em formato JSON (sem markdown, sem \`\`\`json), com as seguintes chaves exatas:

{
  "name": "Nome temático e marcante do monstro",
  "type": "Tipo da criatura (ex: Dragão, Morto-vivo, Besta, Abutre, Monstruosidade, Demônio, Humanoide, etc)",
  "size": "Tamanho de D&D 5e: escolha estritamente um destes -> 'Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Imenso'",
  "alignment": "Alinhamento (ex: Caótico e Mau, Leal e Neutro, Neutro Verdadeiro, etc)",
  "cr": "Nível de Desafio (ex: '1/4', '1', '3', '7', '15', '20')",
  "xp": 1800,
  "hp": 95,
  "ac": 16,
  "speed": "9m, voo 18m",
  "str": 18,
  "dex": 12,
  "con": 16,
  "int": 10,
  "wis": 12,
  "cha": 8,
  "abilities": [
    { "name": "Nome da Habilidade Passiva", "desc": "Descrição clara dos efeitos D&D 5e" }
  ],
  "actions": [
    { "name": "Nome do Ataque/Ação", "attackBonus": 7, "damage": "2d8 + 4 de dano cortante", "desc": "Descrição detalhada do alcance, alvo e efeito." }
  ],
  "spells": [
    { "name": "Nome da Magia", "level": 1, "school": "Evocação", "desc": "Efeito da magia caso conjurador" }
  ],
  "description": "Aparência física detalhada e marcante da criatura.",
  "lore": "História de origem, hábitos, habitat e ganchos para o Mestre usar em sessão.",
  "imagePrompt": "Full body character illustration of [NOME DO MONSTRO em inglês], isolated on a pure plain transparent white background, D&D 5e fantasy creature concept art, highly detailed, dramatic lighting"
}

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS o JSON válido em Português do Brasil (exceto o 'imagePrompt' que deve estar em Inglês para a IA de imagem).
2. Não adicione nenhum texto introdutório nem marcação markdown (\`\`\`json).
3. Preencha pelo menos 2 Habilidades Passivas e 2 Ações de Ataque.`;

    const settings = userSettings || {};
    const geminiApiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY;
    const openRouterApiKey = settings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    const textModelProvider = settings.textModelProvider || (geminiApiKey ? 'gemini' : 'openrouter');
    const textModel = settings.textModel || (textModelProvider === 'gemini' ? 'gemini-2.5-flash' : 'meta-llama/llama-3.3-70b-instruct:free');

    const providers: IAIProvider[] = [];

    if (textModelProvider === 'gemini' && geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      providers.push(new GeminiProvider(geminiApiKey, textModel));
    } else if (textModelProvider === 'openrouter' && openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
      providers.push(new OpenRouterProvider(openRouterApiKey, textModel));
    }

    if (providers.length === 0) {
      if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
        providers.push(new GeminiProvider(geminiApiKey, 'gemini-2.5-flash'));
      }
      if (openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
        providers.push(new OpenRouterProvider(openRouterApiKey, 'meta-llama/llama-3.3-70b-instruct:free'));
      }
    }

    providers.push(new DemoFallbackProvider());

    for (const provider of providers) {
      try {
        const result = await provider.generateNarrative(systemPrompt);
        let jsonText = result.text;

        if (jsonText.includes('```json')) {
          jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(jsonText);
        return NextResponse.json(parsed);
      } catch (err: any) {
        console.warn('Falha no provedor de IA ao gerar monstro, tentando próximo...', err?.message || err);
      }
    }

    return NextResponse.json({ error: 'Todos os provedores de IA falharam.' }, { status: 500 });
  } catch (error: any) {
    console.error('Erro na API /api/ai/generate-monster:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar ficha de monstro.', details: error?.message }, { status: 500 });
  }
}
