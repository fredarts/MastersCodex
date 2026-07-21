import { World, GameScene, WorldEntity, Combatant } from '@/lib/types';

export interface CampaignRAGInput {
  world?: World | null;
  scene?: GameScene | null;
  entities?: WorldEntity[];
  combatants?: Combatant[];
  actionType: 'narrate' | 'loot' | 'copilot' | 'npc_dialogue';
  userPrompt: string;
}

export function buildCampaignPromptContext(input: CampaignRAGInput): string {
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

  // 3. Entidades de Lore Relevantes (NPCs, Locais, Facções)
  if (entities.length > 0) {
    ragContext += `\nENTIDADES DE LORE DO MUNDO:\n`;
    entities.slice(0, 5).forEach((e) => {
      ragContext += `- [${e.category.toUpperCase()}] ${e.name} (${e.status}): ${e.shortDesc}\n`;
    });
  }

  // 4. Combatentes / Personagens em Mesa
  if (combatants.length > 0) {
    ragContext += `\nPERSONAGENS E CRIATURAS NO COMBATE AVALIADO:\n`;
    combatants.forEach((c) => {
      ragContext += `- ${c.name} (${c.type === 'player' ? 'Jogador' : 'Inimigo/NPC'}): HP ${c.hp}/${c.maxHp}, CA ${c.ac}, Inic: ${c.initiative}\n`;
    });
  }

  ragContext += `===================================================\n\n`;

  // Instruções específicas dependendo do tipo de requisição
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
