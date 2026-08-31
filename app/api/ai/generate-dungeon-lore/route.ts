import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      dungeonTitle = '',
      challengeRating = 'Nível 4 - 6',
      difficultyTier = 'medium',
      tacticalMetrics,
      userIdeas = '',
      currentDescription = '',
      userSettings
    } = body;

    let metricsContext = '';
    if (tacticalMetrics) {
      metricsContext = `\n- Andares / Níveis: ${tacticalMetrics.levelsCount || 1}
- Paredes de Oclusão Tática: ${tacticalMetrics.wallsCount || 0}
- Fontes de Luz / Tochas: ${tacticalMetrics.lightsCount || 0}`;
    }

    const systemPrompt = `Você é um co-mestre de RPG experiente e escritor de fantasia medieval sombria e épica (estilo D&D 5e, Baldur's Gate 3, Curse of Strahd e Darkest Dungeon).
Sua missão é criar uma DESCRIÇÃO NARRATIVA, LORE E RUMORES IMERSIVOS para uma masmorra tática.

DADOS DA MASMORRA:
- Título da Masmorra: "${dungeonTitle || 'Masmorra Antiga'}"
- Nível de Desafio / CR Recomendado: ${challengeRating} (${difficultyTier})
${metricsContext}
${userIdeas ? `- Ideia / Rascunho do Mestre: "${userIdeas}"` : ''}
${currentDescription ? `- Texto / Lore Atual para Expandir: "${currentDescription}"` : ''}

DIRETRIZES DE ESCRITA:
1. Descrição Narrativa (Leitura do Mestre): Escreva de 2 a 3 parágrafos primorosos, densos em atmosfera, estímulos sensoriais vívidos (o cheiro de pedra úmida e salitre, o som de goteiras no escuro, o ar gélido, o rangido de estruturas antigas) e detalhes visuais para o Mestre ler em voz alta aos jogadores ou usar como base para conduzir a exploração.
2. Rumores & Segredos: Adicione 2 a 3 tópicos breves com rumores populares contados nas tavernas ou segredos antigos sobre os perigos e tesouros que habitam o complexo.
3. Título Sugerido: Caso o título atual seja genérico, forneça um título impactante.
4. Prompt de Capa (slideCoverPrompt): Um prompt em inglês ultra detalhado para gerar uma imagem cinematográfica 16:9 da entrada desta masmorra com IA.

INSTRUÇÕES DE FORMATAÇÃO:
Retorne ESTRITAMENTE um objeto JSON válido (sem markdown, sem \`\`\`json) contendo:
{
  "title": "${dungeonTitle || 'Título da Masmorra'}",
  "description": "Texto completo da descrição narrativa e rumores formatados...",
  "slideCoverPrompt": "Cinematic 16:9 dark fantasy concept art of..."
}

REGRAS:
- Idioma da descrição e título: Português do Brasil fluente e envolvente.
- slideCoverPrompt: Em inglês.`;

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
        let jsonText = result.text.trim();
        if (jsonText.includes('```json')) {
          jsonText = jsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
        } else if (jsonText.includes('```')) {
          jsonText = jsonText.replace(/```/g, '').trim();
        }

        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        const parsedJson = JSON.parse(jsonText);
        const desc = parsedJson.description || parsedJson.lore || parsedJson.sensoryText || parsedJson.narrative || '';
        return NextResponse.json({
          title: parsedJson.title || dungeonTitle || 'Masmorra Antiga',
          description: desc,
          slideCoverPrompt: parsedJson.slideCoverPrompt || parsedJson.coverPrompt || '',
        });
      } catch (error: any) {
        console.warn('Falha em um provedor de IA para generate-dungeon-lore, tentando o próximo...', error?.message || error);
      }
    }

    // Fallback inteligente para demonstração offline
    const fallbackTitle = dungeonTitle || 'Cripta dos Lamentos Esquecidos';
    return NextResponse.json({
      title: fallbackTitle,
      description: `Escavada sob as raízes retorcidas de uma floresta esquecida, esta masmorra exala uma névoa gélida e o cheiro persistente de terra molhada e cinzas arcanas. O eco de passos distantes reverbera pelas paredes de cantaria musgosa, sugerindo que o complexo nunca esteve verdadeiramente abandonado.\n\nRumores & Lendas:\n• Dizem que as profundezas guardam o relicário de uma ordem caída de paladinos que sucumbiu à ganância.\n• Aventureiros que retornaram vivos relatam engrenagens ocultas e portas falsas que se fecham ao cair da noite.`,
      slideCoverPrompt: `Cinematic 16:9 entrance to an ancient dungeon named ${fallbackTitle}, dark fantasy stone ruins, torches glowing in the dark, dense fog, hyper detailed illustration`
    });

  } catch (error: any) {
    console.error('Erro na API /api/ai/generate-dungeon-lore:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar lore da masmorra com IA.', details: error?.message },
      { status: 500 }
    );
  }
}
