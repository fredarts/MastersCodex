import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export interface SessionChronicleInput {
  campaignTitle?: string;
  sessionTitle?: string;
  sessionNumber?: number;
  scenes?: {
    title: string;
    sensoryText?: string;
    sceneType?: string;
    combatants?: { name: string; type: string; hp: number; maxHp?: number }[];
  }[];
  combatEvents?: string[];
  partyMembers?: string[];
  tone?: 'epic' | 'dark' | 'poetic' | 'historic';
  userSettings?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SessionChronicleInput;

    const {
      campaignTitle = 'Campanha Sem Nome',
      sessionTitle = 'Sessão de Aventura',
      sessionNumber = 1,
      scenes = [],
      combatEvents = [],
      partyMembers = [],
      tone = 'epic',
    } = body;

    let toneDescription = 'Épico e Inspirador (Fantasia Clássica Heroica com prosa rica e momentos de glória)';
    if (tone === 'dark') {
      toneDescription = 'Grimdark / Dark Fantasy (Sombrio, cru, focando na dor, sangue, horror e custos de cada vitória)';
    } else if (tone === 'poetic') {
      toneDescription = 'Poético e Bardico (Canção de gesta, metáforas mitológicas, rimas ocasionais e tom de lenda antiga)';
    } else if (tone === 'historic') {
      toneDescription = 'Crônica Histórica / Manuscrito de Erudito (Registro sóbrio, detalhado e acadêmico dos feitos do grupo)';
    }

    const prompt = `
Você é o mais prestigiado Escriba Real e Cronista Épico de Dungeons & Dragons 5e.
Sua missão é transformar os eventos brutos, cenas narradas e combates de uma sessão de RPG em uma **Crônica Épica da Sessão (Session Scribe)** digna de figurar nos livros de história do multiverso.

---
### 🏰 METADADOS DA SESSÃO:
- **Campanha**: ${campaignTitle}
- **Sessão #${sessionNumber}**: ${sessionTitle}
- **Heróis da Comitiva**: ${partyMembers.length > 0 ? partyMembers.join(', ') : 'Os Aventureiros da Guilda'}
- **Tom Narrativo**: ${toneDescription}

---
### 📜 CENAS & LOCAIS VIVENCIADOS:
${scenes.map((s, i) => `  ${i + 1}. **${s.title}** (${s.sceneType || 'Exploração'}): ${s.sensoryText || 'Cena vivenciada pelo grupo'}`).join('\n')}

---
### ⚔️ EVENTOS MARCANTES, COMBATES & REGISTROS:
${combatEvents.length > 0 ? combatEvents.map((ev, i) => `  - ${ev}`).join('\n') : '  - Os heróis exploraram masmorras sombrias e enfrentaram ameaças mortais.'}

---
### 🎯 REQUISITO DE SAÍDA:
Retorne ESTRITAMENTE um objeto JSON válido com os seguintes campos:
{
  "chapterTitle": "Título épico e memorável para o capítulo desta sessão",
  "summary": "Resumo executivo da sessão em 2 parágrafos concisos",
  "proseStory": "A história completa em prosa literária rica, dividida com subtítulos em Markdown (Ex: ### Ato I: A Chegada nas Sombras, ### Ato II: O Choque de Aço, ### Ato III: O Rescaldo)",
  "mvpMoments": [
    { "character": "Nome do Personagem", "moment": "Descrição do feito memorável ou momento decisivo" }
  ],
  "rewardsAndConsequences": "Resumo das conquistas, cicatrizes, tesouros ou sementes plantadas para o futuro da campanha"
}
`;

    const userSettings = body.userSettings || {};
    const geminiApiKey = userSettings.geminiApiKey || process.env.GEMINI_API_KEY;
    const openRouterApiKey = userSettings.openRouterApiKey || process.env.OPENROUTER_API_KEY;
    const textModelProvider = userSettings.textModelProvider || (geminiApiKey ? 'gemini' : 'openrouter');
    const textModel = userSettings.textModel || (textModelProvider === 'gemini' ? 'gemini-2.5-flash' : 'meta-llama/llama-3.3-70b-instruct:free');

    const providers: IAIProvider[] = [];
    if (textModelProvider === 'gemini' && geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      providers.push(new GeminiProvider(geminiApiKey, textModel));
    } else if (textModelProvider === 'openrouter' && openRouterApiKey && openRouterApiKey !== 'your-openrouter-api-key-here') {
      providers.push(new OpenRouterProvider(openRouterApiKey, textModel));
    }

    if (providers.length === 0 && geminiApiKey && geminiApiKey !== 'your-gemini-api-key-here') {
      providers.push(new GeminiProvider(geminiApiKey, 'gemini-2.5-flash'));
    }

    for (const provider of providers) {
      try {
        const rawResponse = await provider.generateNarrative(prompt);
        let parsed = null;
        try {
          const textContent = typeof rawResponse === 'string' ? rawResponse : rawResponse.text;
          const cleaned = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {}

        if (parsed && parsed.chapterTitle && parsed.proseStory) {
          return NextResponse.json({ success: true, chronicle: parsed });
        }
      } catch (err: any) {
        console.warn('Falha no provedor de IA para crônica de sessão:', err?.message || err);
      }
    }

    // Fallback Estruturado
    const fallbackChronicle = {
      chapterTitle: `Capítulo ${sessionNumber}: O Eco das Profundezas de ${sessionTitle}`,
      summary: `Nesta jornada épica em ${campaignTitle}, os bravos aventureiros desbravaram territórios repletos de perigos e provaram seu valor perante a escuridão. Cada passo ecoou o peso do destino enquanto enfrentavam forças formidáveis.`,
      proseStory: `### Ato I: Sob a Sombra da Aventura
A penumbra envolvia o grupo enquanto adentravam os domínios de ${sessionTitle}. O ar pesado anunciava que nada seria conquistado sem o sacrifício e a coragem dos valorosos heróis.

### Ato II: O Rugido da Batalha
O aço colidiu contra as presas do perigo. Em meio ao caos da luta, a comitiva manteve-se firme, combinando feitiços antigos e golpes certeiros para subjugar seus algozes.

### Ato III: O Alvorecer de Novas Promessas
Com a poeira baixando sobre o campo de confronto, os aventureiros respiraram aliviados, sabendo que embora esta batalha tenha sido vencida, as engrenagens do mundo continuam a girar.`,
      mvpMoments: partyMembers.map((m) => ({
        character: m,
        moment: 'Demonstrou determinação inabalável e liderança no momento mais crucial da empreitada.',
      })),
      rewardsAndConsequences: 'A comitiva garantiu a segurança da região e conquistou o respeito dos povos locais, embora rumores de perigos maiores já comecem a se espalhar.',
    };

    return NextResponse.json({ success: true, chronicle: fallbackChronicle, isFallback: true });
  } catch (error: any) {
    console.error('Erro ao gerar crônica da sessão:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
