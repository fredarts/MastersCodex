import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      prompt,
      race,
      className,
      userSettings
    } = body;

    const systemPrompt = `Você é um assistente especialista em Dungeons & Dragons e criação de personagens para RPG de mesa.
O usuário está criando um personagem da Raça: **${race || 'Desconhecida'}** e Classe: **${className || 'Aventureiro'}**.

Aqui está a descrição livre (ou nula) que o usuário deu sobre a aparência ou história desejada:
"${prompt || 'Gere algo incrivelmente criativo, heroico e detalhado que combine muito bem com a raça e a classe do personagem.'}"

Sua tarefa é expandir criativamente essa ideia para preencher a ficha de interpretação (Roleplay) do personagem. Responda ESTRITAMENTE em formato JSON, com as seguintes chaves exatas:
{
  "age": "Ex: 24 anos, 150 anos...",
  "height": "Ex: 1.80m",
  "weight": "Ex: 80kg",
  "eyes": "Cor e formato",
  "skin": "Cor e textura da pele/escamas",
  "hair": "Cor, estilo, tamanho",
  "personalityTraits": "Traços de Personalidade: O que define o jeito do personagem?",
  "ideals": "Ideais: O que move ou motiva o personagem?",
  "bonds": "Ligações: A quem ou ao que o personagem é leal?",
  "flaws": "Defeitos: Quais são as fraquezas, vícios ou medos?",
  "backstory": "História do Personagem (Lore): Origem, eventos marcantes, por que virou aventureiro. Pelo menos 2 a 3 parágrafos.",
  "alliesAndOrganizations": "Aliados & Organizações: Pessoas, guildas ou divindades com as quais o personagem tem ligações."
}

REGRAS VITAIS:
- Não use Markdown (sem \`\`\`json).
- Retorne APENAS o JSON e nada mais.
- O JSON deve ser perfeitamente parseável.
- Use a criatividade para preencher lacunas de forma profunda e interessante, combinando a descrição fornecida com lore canônica ou criativa de RPG de mesa.
- A língua deve ser Português do Brasil.`;

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
        providers.push(new GeminiProvider(geminiApiKey, textModelProvider === 'gemini' ? textModel : 'gemini-2.5-flash'));
      }
      if (openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
        providers.push(new OpenRouterProvider(openRouterApiKey, textModelProvider === 'openrouter' ? textModel : 'meta-llama/llama-3.3-70b-instruct:free'));
      }
    }

    providers.push(new DemoFallbackProvider());

    for (const provider of providers) {
      try {
        const result = await provider.generateNarrative(systemPrompt);
        
        let jsonText = result.text;
        // Limpar markdown de bloco de código JSON caso a IA tenha ignorado a instrução
        if (jsonText.includes('```json')) {
          jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.replace(/```/g, '').trim();
        }
        
        const parsedJson = JSON.parse(jsonText);

        return NextResponse.json(parsedJson);
      } catch (error: any) {
        console.warn('Falha em um provedor de IA ou parse do JSON, tentando o próximo na fila...', error?.message || error);
      }
    }

    return NextResponse.json({ error: 'Todos os provedores de IA falharam ou falha ao interpretar o JSON.' }, { status: 500 });

  } catch (error: any) {
    console.error('Erro na API /api/ai/generate-entity:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a geração da entidade com IA.', details: error?.message },
      { status: 500 }
    );
  }
}
