import { NextRequest, NextResponse } from 'next/server';
import { buildCampaignPromptContext, CampaignRAGInput } from '@/lib/ai/campaign-rag';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body: CampaignRAGInput = await req.json();

    if (!body.userPrompt) {
      return NextResponse.json({ error: 'O prompt do mestre é obrigatório.' }, { status: 400 });
    }

    // 1. Construir prompt com RAG de Campanha
    const fullPrompt = buildCampaignPromptContext(body);

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    // 2. Montar cadeia de responsabilidade para os provedores (Chain of Responsibility + Strategy)
    const providers: IAIProvider[] = [];

    if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      providers.push(new GeminiProvider(geminiApiKey));
    }

    if (openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
      const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
      providers.push(new OpenRouterProvider(openRouterApiKey, model));
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
