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
      documentType = 'letter',
      title,
      author,
      theme,
      tone,
      userSettings,
      campaignContext,
    } = body;

    if (!prompt && !title && !theme) {
      return NextResponse.json(
        { error: 'Por favor, forneça ao menos uma ideia, título ou tema para a IA escrever o documento.' },
        { status: 400 }
      );
    }

    let campaignContextPart = '';
    if (campaignContext) {
      campaignContextPart = `\nContexto da Campanha de RPG:\n${campaignContext}\n`;
    }

    const docTypeNames: Record<string, string> = {
      letter: 'Carta Antiga (com remetente, tom pessoal, segredos ou instruções)',
      note: 'Bilhete Rápido ou Recado Clandestino (curto, urgente, pistas ou ameaças)',
      diary: 'Páginas de Diário Pessoal (emocional, revelador, fragmentado, dividido em dias/páginas)',
      book: 'Capítulo de Livro ou Crônica Histórica (erudito, contos de lendas, lore do mundo)',
      tome: 'Tomo Arcano ou Tratado Místico (linguagem esotérica, runas, rituais, encantamentos)',
      scroll: 'Pergaminho com Édito ou Profecia (formal, sagrado, decretos ou visões místicas)',
    };

    const targetTypeDesc = docTypeNames[documentType] || 'Documento Manuscrito de Fantasia Medieval';

    const systemPrompt = `Você é um mestre de literatura de fantasia medieval e roteirista sênior de RPG (estilo Baldur's Gate 3, D&D 5e e The Witcher).
Sua missão é redigir um documento imersivo para ser encontrado pelos jogadores em um baú, biblioteca ou esconderijo.

TIPO DO DOCUMENTO: **${targetTypeDesc}** (tipo: ${documentType})
TÍTULO SUGERIDO: "${title || 'A definir'}"
AUTOR SUGERIDO: "${author || 'A definir'}"
TEMA/GÊNERO: "${theme || 'Pista e Mistério'}"
TOM NARRATIVO: "${tone || 'Imersivo e Evocativo'}"
${campaignContextPart}

IDEIA / INSTRUÇÃO DO MESTRE:
"${prompt || title || theme}"

Sua tarefa é escrever o documento completo com rica ambientação de fantasia.
Se for um "diary" (diário) ou "book" (livro), divida o texto em um array de 2 a 3 páginas coerentes (campo "pages").
Se for carta ou bilhete, pode ser 1 página ou texto único.

Responda ESTRITAMENTE em formato JSON com as chaves:
{
  "name": "Título evocativo e memorável para o documento",
  "documentType": "${documentType}",
  "author": "Nome do autor ou remetente ficcional do documento",
  "dateOrHeader": "Data ficcional, cabeçalho de carta ou localização (ex: '24 de Alturiak, no Forte das Sombras' ou 'Ao Meu Querido Irmão')",
  "language": "Idioma em que está escrito (ex: 'Comum', 'Élfico Arcaico', 'Dracônico', 'Anão')",
  "notes": "Um resumo rápido de 1 frase para o Mestre sobre o que este documento revela",
  "pages": [
    "Texto da página 1...",
    "Texto da página 2 (se aplicável)..."
  ],
  "content": "Texto completo unificado do documento"
}

REGRAS:
- Não inclua markdown \`\`\`json no corpo.
- Retorne APENAS o JSON puro.
- Português do Brasil de alto padrão estilístico e de fantasia medieval.`;

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

    let rawText = '';

    for (const provider of providers) {
      try {
        const result = await provider.generateNarrative(systemPrompt);
        if (result && result.text && result.text.trim().length > 0) {
          rawText = result.text.trim();
          break;
        }
      } catch (err) {
        console.warn(`[AI Lore Document] Provider falhou:`, err);
      }
    }

    if (!rawText || rawText.trim().length === 0) {
      // Fallback gracioso local estruturado
      const fallbackResult = {
        name: title || (documentType === 'letter' ? 'Carta Misteriosa' : 'Diário Antigo'),
        documentType,
        author: author || 'Autor Desconhecido',
        dateOrHeader: 'Ao vigésimo ciclo das luas',
        language: 'Comum',
        notes: 'Documento contendo pistas vitais para a aventura.',
        pages: [
          `As sombras se alongam além das muralhas. O selo que guardava a câmara subterrânea enfraqueceu. Se você estiver lendo isto, não confie no regente.`,
        ],
        content: `As sombras se alongam além das muralhas. O selo que guardava a câmara subterrânea enfraqueceu. Se você estiver lendo isto, não confie no regente.`,
      };
      return NextResponse.json(fallbackResult);
    }

    // Limpeza de blocos Markdown se a IA retornou
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned);
      const extractedContent = (
        parsed.content ||
        parsed.fullContent ||
        parsed.text ||
        parsed.body ||
        (Array.isArray(parsed.pages) ? parsed.pages.join('\n\n') : '') ||
        parsed.shortDesc ||
        'Documento com texto misterioso registrado.'
      ).trim();

      const pages = Array.isArray(parsed.pages) && parsed.pages.length > 0
        ? parsed.pages
        : [extractedContent];

      const content = extractedContent || pages.join('\n\n');

      return NextResponse.json({
        name: parsed.name || title || 'Documento Sem Nome',
        documentType: parsed.documentType || documentType,
        author: parsed.author || author || 'Anônimo',
        dateOrHeader: parsed.dateOrHeader || '',
        language: parsed.language || 'Comum',
        notes: parsed.notes || '',
        pages,
        content,
      });
    } catch (parseErr) {
      console.error('[AI Lore Document] Erro ao parsear JSON:', parseErr, 'Raw:', rawText);
      const cleanRaw = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      return NextResponse.json({
        name: title || 'Documento Manuscrito',
        documentType,
        author: author || 'Anônimo',
        dateOrHeader: 'Data Ilegível',
        language: 'Comum',
        notes: 'Documento gerado pela IA.',
        pages: [cleanRaw || 'Texto do manuscrito.'],
        content: cleanRaw || 'Texto do manuscrito.',
      });
    }
  } catch (err: any) {
    console.error('[AI Lore Document] Erro interno:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno ao gerar documento de lore.' }, { status: 500 });
  }
}
