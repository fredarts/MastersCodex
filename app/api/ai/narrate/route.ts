import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildCampaignPromptContext, CampaignRAGInput } from '@/lib/ai/campaign-rag';

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

    // 2. Opção A: Tentar Google Gemini API oficial
    if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
        });

        const text = response.text || 'Não foi possível gerar a resposta.';
        return NextResponse.json({ text, provider: 'gemini' });
      } catch (geminiError: any) {
        console.warn('Erro na chamada da API Gemini, tentando fallback:', geminiError?.message || geminiError);
      }
    }

    // 3. Opção B: Tentar OpenRouter API (modelos gratuitos como Llama 3)
    if (openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
      try {
        const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://masterscodex.app',
            'X-Title': 'Masters Codex RPG',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'user', content: fullPrompt }
            ],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || 'Sem resposta do OpenRouter.';
          return NextResponse.json({ text, provider: `openrouter (${model})` });
        } else {
          const errText = await res.text();
          console.warn('Erro OpenRouter HTTP:', res.status, errText);
        }
      } catch (openRouterError: any) {
        console.warn('Erro na chamada OpenRouter API:', openRouterError?.message || openRouterError);
      }
    }

    // 4. Fallback Simulado (caso nenhuma API Key válida esteja configurada)
    return NextResponse.json({
      text: `[MODO DEMO - NENHUMA CHAVE DE IA CONFIGURADA]\n\nPara ativar a inteligência artificial real do Gemini ou OpenRouter, adicione a chave no arquivo .env.local:\n\nGEMINI_API_KEY=sua_chave_aqui\nOU\nOPENROUTER_API_KEY=sua_chave_aqui\n\n--- Narração Gerada Simulada ---\n${body.userPrompt}`,
      provider: 'demo-fallback',
    });
  } catch (error: any) {
    console.error('Erro na API /api/ai/narrate:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a geração de IA.', details: error?.message },
      { status: 500 }
    );
  }
}
