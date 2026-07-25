import { World, GameScene, WorldEntity, Combatant } from '@/lib/types';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';

export interface CampaignRAGInput {
  world?: World | null;
  scene?: GameScene | null;
  entities?: WorldEntity[];
  combatants?: Combatant[];
  actionType: 'narrate' | 'loot' | 'copilot' | 'npc_dialogue';
  userPrompt: string;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
}

/**
  * Gera um vetor de embedding de 768 dimensões para o texto fornecido (usando API ou fallback determinístico)
  */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: { parts: [{ text }] },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        if (json.embedding?.values) {
          return json.embedding.values;
        }
      }
    } catch (_e) {}
  }

  // Fallback determinístico (768 dimensões)
  const embedding = new Array(768).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  for (let i = 0; i < 768; i++) {
    embedding[i] = Math.sin(hash + i) * 0.5 + 0.5;
  }
  return embedding;
}

/**
 * Salva um documento de lore com vetor de embedding na tabela `lore_embeddings` do Supabase
 */
export async function indexLoreDocument(
  worldId: string,
  content: string,
  entityId?: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUuid(worldId)) return false;

  try {
    const embedding = await generateTextEmbedding(content);
    const { error } = await supabase.from('lore_embeddings').insert({
      world_id: worldId,
      entity_id: isValidUuid(entityId) ? entityId : null,
      content,
      embedding,
      metadata,
    });

    if (error) {
      console.warn('Erro ao indexar embedding de lore no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Consulta a busca por similaridade de cosseno vetorial no Supabase Postgres via pgvector (RPC match_lore_documents)
 */
export async function fetchVectorLoreSimilarity(
  queryEmbedding: number[],
  worldId?: string,
  matchThreshold = 0.5,
  matchCount = 5
): Promise<VectorSearchResult[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase.rpc('match_lore_documents', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_world_id: isValidUuid(worldId) ? worldId : null,
    });

    if (error) {
      console.warn('Busca vetorial pgvector não disponível ou sem suporte no Postgres:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      similarity: row.similarity,
    }));
  } catch (e) {
    return [];
  }
}

export function buildCampaignPromptContext(input: CampaignRAGInput, vectorContext: VectorSearchResult[] = []): string {
  const { world, scene, entities = [], combatants = [], actionType, userPrompt } = input;

  let ragContext = `=== CONTEXTO RAG DA MESA DE RPG (MASTERS CODEX) ===\n`;

  // 1. Contexto do Mundo
  if (world) {
    ragContext += `MUNDO: ${world.title} (${world.genre || 'Fantasia Medieval'})\n`;
    if (world.description) {
      ragContext += `Descrição do Mundo: ${world.description}\n`;
    }
  } else {
    ragContext += `MUNDO: Fantasia Medieval Padrão D&D 5e\n`;
  }

  // 2. Contexto da Cena Ativa
  if (scene) {
    ragContext += `\nCENA ATIVA: "${scene.title}" [Tipo: ${scene.sceneType.toUpperCase()}]\n`;
    if (scene.npcName) ragContext += `NPC Principal em Destaque: ${scene.npcName}\n`;
    if (scene.sensoryText) ragContext += `Descrição Sensorial Existente: ${scene.sensoryText}\n`;
    if (scene.secretNotes) ragContext += `Notas Secretas do Mestre: ${scene.secretNotes}\n`;
    if (scene.bgmCategory) ragContext += `Clima Sonoro/Trilha: ${scene.bgmCategory}\n`;
  }

  // 3. Resultados de Busca Vetorial pgvector (Se Houver)
  if (vectorContext.length > 0) {
    ragContext += `\nCONTEXTO DE LORE RECUPERADO VIA VETORES (pgvector):\n`;
    vectorContext.forEach((doc, idx) => {
      ragContext += `[Doc #${idx + 1} - Relevância: ${(doc.similarity * 100).toFixed(0)}%]: ${doc.content}\n`;
    });
  }

  // 4. Entidades de Lore Relevantes
  if (entities.length > 0) {
    ragContext += `\nENTIDADES DE LORE DO MUNDO:\n`;
    entities.slice(0, 5).forEach((e) => {
      ragContext += `- [${e.category.toUpperCase()}] ${e.name} (${e.status}): ${e.shortDesc}\n`;
    });
  }

  // 5. Combatentes / Personagens em Mesa
  if (combatants.length > 0) {
    ragContext += `\nPERSONAGENS E CRIATURAS NO COMBATE AVALIADO:\n`;
    combatants.forEach((c) => {
      ragContext += `- ${c.name} (${c.type === 'player' ? 'Jogador' : 'Inimigo/NPC'}): HP ${c.hp}/${c.maxHp}, CA ${c.ac}, Inic: ${c.initiative}\n`;
    });
  }

  ragContext += `===================================================\n\n`;

  let systemInstruction = '';
  switch (actionType) {
    case 'narrate':
      systemInstruction = `Você é um Narrador e Mestre de RPG veterano de D&D 5e. Sua função é escrever uma narração sensorial imersiva, evocativa e atmosférica em PORTUGUÊS DO BRASIL. Use frases curtas, descrições dos 5 sentidos (sons, cheiros, iluminação, frio/calor) e dê ganchos de ação para os jogadores.`;
      break;
    case 'loot':
      systemInstruction = `Você é um Gerador de Tesouro e Loot para D&D 5e. Com base na cena, criaturas enfrentadas e nível do grupo, gere uma lista de recompensas e tesouros formatada e detalhada em PORTUGUÊS DO BRASIL. Inclua moedas (PL, PO, PP, PC), itens consumíveis (poções, pergaminhos) e itens mágicos com breves efeitos mecânicos.`;
      break;
    case 'npc_dialogue':
      systemInstruction = `Você é um Ator e Mestre interpretando um NPC na cena. Responda em primeira pessoa com sotaque, maneirismos e tom condizentes com a personalidade e intenções do NPC em PORTUGUÊS DO BRASIL.`;
      break;
    case 'copilot':
    default:
      systemInstruction = `Você é o AICoPilot, o assistente inteligente oficial do Mestre de RPG na plataforma Masters Codex. Sua tarefa é fornecer ideias de enredo, reviravoltas na trama, táticas de combate para monstros ou regras de D&D 5e de forma clara, direta e envolvente em PORTUGUÊS DO BRASIL.`;
      break;
  }

  return `${systemInstruction}\n\n${ragContext}REQUISIÇÃO DO MESTRE:\n"${userPrompt}"`;
}
