import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { DemoFallbackProvider } from '@/lib/ai/providers/DemoFallbackProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      worldTitle,
      worldGenre,
      worldDesc,
      tone,
      userIdeas,
      entitiesContext,
      userSettings
    } = body;

    let loreSection = '';
    if (worldDesc) {
      loreSection += `\n- Lore Geral do Mundo: ${worldDesc}`;
    }

    if (entitiesContext && entitiesContext.length > 0) {
      loreSection += `\n\nENTIDADES E ELEMENTOS DO MUNDO SELECIONADOS PARA INTEGRAR À NARRATIVA:\n${entitiesContext}\n`;
    }

    const systemPrompt = `Você é um mestre experiente de RPG e criador de campanhas narrativas memoráveis.
Sua tarefa é criar uma sinopse épica e altamente coerente para uma nova campanha de RPG de mesa (Call to Adventure / Pitch de Campanha), integrando profundamente a LORE e as ENTIDADES fornecidas do mundo de Worldbuilding.

DADOS DA CAMPANHA:
- Título da Campanha: ${title || 'Uma Nova Aventura'}
- Mundo Base: ${worldTitle || 'Mundo Desconhecido'} (Gênero: ${worldGenre || 'Alta Fantasia'})
${loreSection}
- Tom Narrativo Desejado: ${tone || 'Épico e Heroico'}
${userIdeas ? `- Ideias e Rascunho do Mestre: "${userIdeas}"` : ''}

DIRETRIZES DE CRIAÇÃO:
1. Conecte de forma orgânica os personagens, locais, facções e itens informados na seção de entidades. Faça os nomes das entidades soarem vitais para o enredo (ex: o vilão articulando planos em tal fortaleza, ou a guilda contratando os heróis na cidade inicial).
2. Se nenhuma entidade for fornecida, utilize a lore do mundo base para criar referências autênticas.
3. Gere uma sinopse empolgante que dê aos jogadores um forte senso de propósito e perigo iminente.

INSTRUÇÕES DE FORMATAÇÃO:
Retorne ESTRITAMENTE um objeto JSON válido (sem markdown, sem \`\`\`json) contendo:
{
  "suggestedTitle": "Título impactante, épico e memorável para a campanha (Ex: A Queda dos Reis Dragões, Sombras de Valíria, O Despertar do Trono de Cinzas)",
  "synopsis": "Uma sinopse envolvente de 2 a 4 parágrafos curtos, pronta para empolgar os jogadores. Destaque o conflito principal, o mistério inicial, as facções/locais chave e a atmosfera.",
  "hook": "Um gancho inicial direto para a Sessão 0 / primeira cena da aventura (onde os heróis começam e o que os força a agir imediatamente).",
  "suggestedTone": "O tom consolidado da campanha (ex: Alta Fantasia Épica, Dark Fantasy Sombrio, Investigação Misteriosa)",
  "coverPrompt": "Um prompt em inglês de alta qualidade para gerar a arte de capa panorâmica (16:9 widescreen) da campanha em um gerador de imagem (como Imagen 3), incorporando o clima, os elementos visuais do mundo e o conflito principal."
}

REGRAS:
- Responda apenas com o JSON puro.
- Idioma da sinopse e hook: Português do Brasil.
- coverPrompt: Em inglês para melhor compatibilidade com modelos de imagem.`;

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
        console.warn('Falha em um provedor de IA para campaign-pitch, tentando o próximo...', error?.message || error);
      }
    }

    // Fallback manual se tudo falhar
    return NextResponse.json({
      suggestedTitle: title || `Crônicas de ${worldTitle || 'Valíria'}: A Sombra Ancestral`,
      synopsis: `Nas terras de ${worldTitle || 'um reino esquecido'}, uma nova sombra desponta no horizonte. Enquanto antigas lendas despertam, aventureiros de origens distintas são convocados pelo destino para desvendar segredos há muito enterrados e forjar seu próprio legado em meio ao caos iminente.`,
      hook: `O grupo se encontra reunido em uma estalagem nos limites do reino quando um mensageiro ferido irrompe pelas portas trazendo um artefato enigmático.`,
      suggestedTone: tone || 'Alta Fantasia Épica',
      coverPrompt: `An epic fantasy landscape depicting adventures in ${worldTitle || 'a mystical kingdom'}, dramatic atmospheric lighting, cinematic 16:9 banner concept art, high detail, fantasy masterpiece`
    });

  } catch (error: any) {
    console.error('Erro na API /api/ai/generate-campaign-pitch:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a sinopse com IA.', details: error?.message },
      { status: 500 }
    );
  }
}
