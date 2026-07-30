import { NextRequest, NextResponse } from 'next/server';
import { buildCampaignPromptContext, CampaignRAGInput } from '@/lib/ai/campaign-rag';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.userPrompt) {
      return NextResponse.json({ error: 'O prompt do mestre é obrigatório.' }, { status: 400 });
    }

    // 1. Construir prompt com RAG de Campanha
    const fullPrompt = buildCampaignPromptContext(body);

    const userSettings = body.userSettings || {};
    const geminiApiKey = userSettings.geminiApiKey || process.env.GEMINI_API_KEY;
    const openRouterApiKey = userSettings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    const textModelProvider = userSettings.textModelProvider || (geminiApiKey ? 'gemini' : 'openrouter');
    const textModel = userSettings.textModel || (textModelProvider === 'gemini' ? 'gemini-2.5-flash' : 'meta-llama/llama-3.3-70b-instruct:free');

    // 2. Montar cadeia de responsabilidade para os provedores (Chain of Responsibility + Strategy)
    const providers: IAIProvider[] = [];

    if (textModelProvider === 'gemini') {
      if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
        providers.push(new GeminiProvider(geminiApiKey, textModel));
      }
    } else if (textModelProvider === 'openrouter') {
      if (openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
        providers.push(new OpenRouterProvider(openRouterApiKey, textModel));
      }
    }

    // Se o provedor escolhido não estiver disponível (por exemplo, sem chave de API), 
    // tentamos os outros como fallback, respeitando as chaves disponíveis.
    if (providers.length === 0) {
      if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
        providers.push(new GeminiProvider(geminiApiKey, textModelProvider === 'gemini' ? textModel : 'gemini-2.5-flash'));
      }
      if (openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
        providers.push(new OpenRouterProvider(openRouterApiKey, textModelProvider === 'openrouter' ? textModel : 'meta-llama/llama-3.3-70b-instruct:free'));
      }
    }

    // Fallback garantido no final da fila
    providers.push(new DemoFallbackProvider());

    // 3. Tentar os provedores em ordem de prioridade
    for (const provider of providers) {
      try {
        const result = await provider.generateNarrative(fullPrompt);
        return NextResponse.json(result);
      } catch (error: any) {
        console.warn('Falha em um provedor de IA, tentando o próximo na fila...', error?.message || error);
      }
    }

    // Se chegar aqui (teoricamente o fallback nunca falha, mas só por garantia)
    return NextResponse.json({ error: 'Todos os provedores de IA falharam.' }, { status: 500 });

  } catch (error: any) {
    console.error('Erro na API /api/ai/narrate:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a geração de IA.', details: error?.message },
      { status: 500 }
    );
  }
}
