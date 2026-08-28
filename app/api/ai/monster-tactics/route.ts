import { NextRequest, NextResponse } from 'next/server';
import { GeminiProvider } from '@/lib/ai/providers/GeminiProvider';
import { OpenRouterProvider } from '@/lib/ai/providers/OpenRouterProvider';
import { IAIProvider } from '@/lib/ai/providers/IAIProvider';

export interface MonsterTacticsInput {
  monster: {
    name: string;
    type?: string;
    cr?: string;
    hp: number;
    maxHp?: number;
    ac: number;
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    actions?: { name: string; desc: string }[];
    spells?: { name: string; level: number; desc?: string }[];
    description?: string;
  };
  opponents: {
    name: string;
    hp: number;
    maxHp?: number;
    ac?: number;
    conditions?: string[];
    isConcentrating?: boolean;
    classOrRole?: string;
  }[];
  roundCount?: number;
  environment?: string;
  userSettings?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MonsterTacticsInput;

    if (!body.monster || !body.monster.name) {
      return NextResponse.json({ error: 'Os dados do monstro são obrigatórios.' }, { status: 400 });
    }

    const { monster, opponents = [], roundCount = 1, environment = 'Masmorra' } = body;
    const int = monster.int ?? 10;
    const wis = monster.wis ?? 10;

    // Determinar arquétipo de inteligência D&D 5e
    let intelligenceArchetype = 'Inteligência Média (Humanóide comum / Soldado)';
    if (int <= 4) {
      intelligenceArchetype = 'Besta / Instinto Selvagem (Ataca quem está mais perto ou quem causou dano por último. Foge se HP < 25%)';
    } else if (int <= 8) {
      intelligenceArchetype = 'Predador Astuto / Truculento (Foca em alvos já feridos ou derrubados, usa vantagem numérica)';
    } else if (int <= 14) {
      intelligenceArchetype = 'Tático Experiente (Identifica conjuradores, quebra concentração, usa cobertura)';
    } else if (int <= 18) {
      intelligenceArchetype = 'Mestre Tático (Lança magias em área sem atingir aliados, guarda reações como Counterspell/Shield, explora atributos fracos dos alvos)';
    } else {
      intelligenceArchetype = 'Gênio Arcano / Mente Implacável (Lich / Mind Flayer / Dragão Ancião - Jogo psicológico, controle total do campo de batalha, anulação de magias)';
    }

    const prompt = `
Você é o mais refinado Estrategista de Combate de D&D 5e (inspirado no livro "The Monsters Know What They're Doing").
O Mestre de RPG precisa saber: **O que esta criatura deve fazer no seu turno atual de combate?**

---
### 🐲 CRIATURA ATIVA:
- **Nome**: ${monster.name} (${monster.type || 'Monstro'}, ND ${monster.cr || '1'})
- **Pontos de Vida**: ${monster.hp} / ${monster.maxHp || monster.hp} PV
- **Classe de Armadura (CA)**: ${monster.ac}
- **Atributos**: FOR ${monster.str || 10} | DES ${monster.dex || 10} | CON ${monster.con || 10} | INT ${int} | SAB ${wis} | CAR ${monster.cha || 10}
- **Arquétipo de Inteligência**: ${intelligenceArchetype}
- **Ações Conhecidas**: ${JSON.stringify(monster.actions || [])}
- **Magias Conhecidas**: ${JSON.stringify(monster.spells || [])}

---
### ⚔️ OPONENTES / JOGADORES NA ARENA (Rodada ${roundCount}, Ambiente: ${environment}):
${opponents.map((op, idx) => `  ${idx + 1}. **${op.name}** [${op.classOrRole || 'Aventureiro'}]: ~${op.hp}/${op.maxHp || op.hp} PV, CA ${op.ac || 15}${op.isConcentrating ? ' ⚡ (CONCENTRANDO MAGIA!)' : ''}${op.conditions && op.conditions.length > 0 ? ` [Condições: ${op.conditions.join(', ')}]` : ''}`).join('\n')}

---
### 🎯 REQUISITO DE SAÍDA:
Retorne ESTRITAMENTE um objeto JSON válido (sem texto antes ou depois) com a seguinte estrutura:
{
  "primaryAction": "Nome da Ação / Ataque / Magia recomendada com alvo exato e justificativa tática clara",
  "targetName": "Nome do Jogador/Alvo prioritário",
  "movementAdvice": "Instrução de movimentação (ex: recuar 4.5m para manter distância, flanquear o clérigo, buscar meia cobertura atrás da coluna)",
  "bonusOrReaction": "Recomendação de Ação Bônus ou Reação guardada (ex: guardar Shield caso o ladino ataque, usar Misty Step)",
  "roleplayQuote": "Uma fala marcante, sussurro arcano ou descrição sensorial intimidatória que o monstro diz ou faz ao agir",
  "tacticalReasoning": "Resumo de 1-2 frases explicando por que esta é a jogada ideal baseada na inteligência da criatura"
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
        } catch {
          // Fallback if parsing string directly
        }

        if (parsed && parsed.primaryAction) {
          return NextResponse.json({ success: true, tactics: parsed });
        }
      } catch (err: any) {
        console.warn('Falha no provedor de IA para táticas de monstros:', err?.message || err);
      }
    }

    // Resilient Local Fallback se nenhuma chave de IA estiver disponível
    const priorityOpponent = opponents.find((o) => o.isConcentrating) || opponents.find((o) => o.hp <= 15) || opponents[0];
    const target = priorityOpponent ? priorityOpponent.name : 'o aventureiro mais próximo';

    const fallbackTactics = {
      primaryAction: int >= 12 && monster.spells && monster.spells.length > 0
        ? `Conjurar ${monster.spells[0].name} focando em ${target} para desestabilizar a linha de frente.`
        : `Executar Ataque Multiplo com ${monster.actions?.[0]?.name || 'Garras / Mordida'} em ${target}.`,
      targetName: target,
      movementAdvice: int >= 12
        ? 'Recuar 4.5 metros e posicionar-se atrás de cobertura leve para forçar desvantagem em ataques à distância.'
        : 'Avançar implacavelmente em linha reta para travar o alvo em combate corpo a corpo.',
      bonusOrReaction: 'Guardar Reação para Ataque de Oportunidade ou esquiva reflexa.',
      roleplayQuote: int >= 14
        ? `"Sua carne e suas preces são insignificantes perante o poder que comando!"`
        : `*A criatura ruge ferozmente, cravando os olhos sedentos de sangue em ${target}!*`,
      tacticalReasoning: `Baseado no arquétipo [${intelligenceArchetype}], a criatura foca no alvo mais vulnerável (${target}) para reduzir o dano recebido pelo grupo.`,
    };

    return NextResponse.json({ success: true, tactics: fallbackTactics, isFallback: true });
  } catch (error: any) {
    console.error('Erro ao gerar táticas de monstros:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}
