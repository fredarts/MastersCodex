import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      sessionTitle,
      sceneType = 'social',
      userIdeas,
      entitiesContext,
      worldTitle,
      worldGenre,
      worldDesc,
      userSettings
    } = body;

    let loreSection = '';
    if (worldTitle) {
      loreSection += `\n- Cenário / Mundo Base: ${worldTitle} (${worldGenre || 'Fantasia Medieval'})`;
    }
    if (worldDesc) {
      loreSection += `\n- Lore Geral do Mundo: ${worldDesc}`;
    }
    if (entitiesContext && entitiesContext.length > 0) {
      loreSection += `\n\nENTIDADES E PERSONAGENS PRESENTES NESTA CENA:\n${entitiesContext}\n`;
    }

    const systemPrompt = `Você é um co-mestre especialista em criação de cenas imersivas e memoráveis para RPG de mesa (D&D 5e / Fantasia).
Sua missão é estruturar uma CENA dramática e sensorial completa para a sessão "${sessionTitle || 'Aventura em Andamento'}".

TIPO DE CENA: ${sceneType.toUpperCase()} (social, dialogue, combat ou exploration)
${loreSection}
${userIdeas ? `- Ideia / Rascunho do Mestre: "${userIdeas}"` : ''}

DIRETRIZES DE CRIAÇÃO:
1. Título: Dê um título direto e impactante (sem prefixo de emoji, ex: "O Encontro nas Ruínas de Obsidiana", "Emboscada no Desfiladeiro da Serpente", "Conspiração na Taverna do Javali").
2. Texto Sensorial (Read Aloud): Escreva 2 a 3 parágrafos curtos e evocativos para o Mestre ler em voz alta para os jogadores. Descreva estímulos sensoriais vívidos (o cheiro de fumaça e pinho, o eco de passos, a luz tênue) e integre organicamente os personagens/entidades presentes na cena.
3. Notas Secretas do Mestre: 2 a 3 tópicos com segredos de bastidores, intenções ocultas de NPCs, táticas de combate ou pistas/plot twists que os jogadores podem descobrir.
4. Trilha Sonora e Clima: Recomende a categoria de BGM e iluminação/clima adequados.
5. Prompt de Imagem (slideCoverPrompt): Um prompt em inglês ultra detalhado para gerar uma imagem cinematográfica 16:9 widescreen da cena (fantasy concept art, atmospheric lighting, masterpiece).

INSTRUÇÕES DE FORMATAÇÃO:
Retorne ESTRITAMENTE um objeto JSON válido (sem markdown, sem \`\`\`json) contendo:
{
  "title": "Título da Cena",
  "sensoryText": "Texto sensorial descritivo para ler em voz alta aos jogadores...",
  "secretNotes": "Notas secretas do Mestre, segredos e pistas...",
  "suggestedBgm": "taverna | combate | masmorra | tensao | exploracao",
  "timeOfDay": "day | sunset | night | storm | fog",
  "hasFog": true/false,
  "hasRain": true/false,
  "slideCoverPrompt": "Cinematic 16:9 fantasy concept art of..."
}

REGRAS:
- Responda apenas com o JSON puro.
- Idioma do sensoryText, title e secretNotes: Português do Brasil.
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
        return NextResponse.json(parsedJson);
      } catch (error: any) {
        console.warn('Falha em um provedor de IA para generate-scene, tentando o próximo...', error?.message || error);
      }
    }

    // Fallback inteligente
    return NextResponse.json({
      title: userIdeas ? `Cena: ${userIdeas.slice(0, 30)}` : 'Encontro nas Terras Ermas',
      sensoryText: `O ar fica pesado enquanto vocês avançam pelo local. Sombras alongadas se projetam sobre o chão irregular e o silêncio é quebrado apenas pela respiração tensa do grupo. No centro da cena, a presença dos personagens e os ecos do ambiente denunciam que algo decisivo está prestes a acontecer.`,
      secretNotes: `• Um dos indivíduos na cena esconde uma carta selada em seu manto.\n• Teste de Percepção Passiva (DC 13) revela marcas de garras recentes nas vigas de madeira.`,
      suggestedBgm: sceneType === 'combat' ? 'combate' : sceneType === 'dialogue' ? 'tensao' : 'taverna',
      timeOfDay: 'night',
      hasFog: true,
      hasRain: false,
      slideCoverPrompt: `Cinematic 16:9 fantasy landscape illustration depicting a dramatic ${sceneType} scene in ${worldTitle || 'a fantasy world'}, atmospheric lighting, highly detailed concept art`
    });

  } catch (error: any) {
    console.error('Erro na API /api/ai/generate-scene:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a cena com IA.', details: error?.message },
      { status: 500 }
    );
  }
}
