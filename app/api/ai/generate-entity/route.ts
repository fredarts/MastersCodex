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
      categoryTitle,
      namePlaceholder,
      attr1Label,
      attr2Label,
      userSettings
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'O prompt do mestre é obrigatório.' }, { status: 400 });
    }

    const systemPrompt = `Você é um assistente especialista em criação de mundos (worldbuilding) para campanhas de RPG de mesa.
O usuário está preenchendo um formulário para criar a seguinte entidade: **${categoryTitle}**.
A entidade tem as seguintes instruções de preenchimento de nome: ${namePlaceholder}.

Aqui está a descrição livre do que o usuário quer criar:
"${prompt}"

Sua tarefa é extrair e expandir criativamente essa ideia para preencher o formulário estruturado. Responda ESTRITAMENTE em formato JSON, com as seguintes chaves exatas:
{
  "name": "Nome impactante e criativo para a entidade",
  "subType": "Um subtipo, rótulo ou título curto (Ex: Lendário, Antigo, Guilda Mercantil, Rei, etc)",
  "shortDesc": "Um resumo rápido de 1 a 2 frases para consulta rápida.",
  "fullContent": "Aprofundamento de história, lore detalhada, aparência física (se aplicável), segredos e potenciais ganchos para o mestre de RPG.",
  "extraAttr1": "Valor para o campo '${attr1Label}' baseado na ideia",
  "extraAttr2": "Valor para o campo '${attr2Label}' baseado na ideia"
}

REGRAS VITAIS:
- Não use Markdown (sem \`\`\`json).
- Retorne APENAS o JSON e nada mais.
- O JSON deve ser perfeitamente parseável.
- Use a criatividade para preencher lacunas e criar algo profundo e interessante.
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
