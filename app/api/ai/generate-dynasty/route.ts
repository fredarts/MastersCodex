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
      theme = 'Nobreza Medieval Fantástica',
      generationsCount = 3,
      intrigueLevel = 'high',
      userSettings,
      contextText,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'O prompt da família ou casa nobre é obrigatório.' }, { status: 400 });
    }

    let contextPart = '';
    if (contextText) {
      contextPart = `\nContexto adicional do mundo/reino:\n${contextText}\n`;
    }

    const systemPrompt = `Você é um mestre arquiteto de worldbuilding de RPG especializado em intrigas políticas, casas nobres, linhagens reais e árvores genealógicas.
O usuário quer forjar uma linhagem dinástica / árvore genealógica completa baseada na seguinte ideia:
"${prompt}"

Parâmetros:
- Tema / Estilo Cultural: ${theme}
- Número de Gerações: ${generationsCount} gerações (Geração 0 = Fundadores/Patriarcas, 1 = Filhos, 2 = Netos, etc.)
- Nível de Intriga: ${intrigueLevel} (inclua bastardos, segredos obscuros de sucessão, herdeiros rivais se alto)
${contextPart}

Sua resposta DEVE ser ESTRITAMENTE um objeto JSON válido (sem tags markdown, sem \`\`\`json) contendo a seguinte estrutura exata:
{
  "houseName": "Nome da Casa ou Dinastia (Ex: Casa Valerius, Clã Garra de Ferro)",
  "houseMotto": "Lema heráldico da família (Ex: 'Na Honra, a Vitória')",
  "description": "Resumo histórico da ascensão, poder e status atual desta família na campanha.",
  "members": [
    {
      "id": "mem_1",
      "name": "Nome Completo",
      "title": "Título Nobre (Ex: Grão-Duque, Príncipe Herdeiro, Cavaleiro)",
      "race": "Raça/Espécie (Ex: Humano, Alto Elfo, Anão)",
      "houseOrDynasty": "Nome da Casa",
      "generation": 0,
      "gender": "male",
      "birthEra": "Ano 102 da 3ª Era",
      "deathEra": "Ano 168 da 3ª Era",
      "isAlive": false,
      "successionStatus": "deceased",
      "notes": "Breve biografia de suas conquistas.",
      "secrets": "Segredo oculto para o mestre (se houver).",
      "customBadge": "👑 Patriarca Fundador"
    }
  ],
  "relationships": [
    {
      "id": "rel_1",
      "fromId": "mem_1",
      "toId": "mem_2",
      "type": "spouse",
      "details": "Casamento de união de reinos"
    },
    {
      "id": "rel_2",
      "fromId": "mem_1",
      "toId": "mem_3",
      "type": "parent",
      "details": "Primogênito legítimo"
    }
  ]
}

REGRAS:
1. Certifique-se de que TODOS os membros a partir da Geração 1 tenham relacionamento "parent" (ou "bastard" ou "adopted") conectando o progenitor a ele (fromId: pai/mãe, toId: filho).
2. Membros que formam casais, uniões ou divórcios históricos devem ter relacionamento "spouse", "ex_spouse" ou "betrothed".
3. Certifique-se de que os IDs dos relacionamentos ("fromId" e "toId") correspondam exatamente aos "id" dos membros da lista.
4. Apenas um membro vivo deve ter "successionStatus": "ruling", e os demais herdeiros podem ser "heir_apparent", "heir_presumptive" ou "claimant".
5. Use Português do Brasil.`;

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
        if (parsedJson.members && Array.isArray(parsedJson.members)) {
          return NextResponse.json(parsedJson);
        }
      } catch (err: any) {
        console.warn(`[DynastyGenerator] Provedor ${provider.constructor.name} falhou:`, err?.message || err);
      }
    }

    return NextResponse.json({ error: 'Todos os provedores de IA falharam ao gerar a dinastia.' }, { status: 500 });
  } catch (error: any) {
    console.error('[DynastyGenerator] Erro na rota de geração de dinastia:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao processar requisição.' }, { status: 500 });
  }
}
