import { CombatLogEntry, ChatMessage } from '@/lib/types';

export type QuickTag =
  | 'all'
  | 'combat'
  | 'rolls'
  | 'chat'
  | 'secret'
  | 'crit'
  | 'fail'
  | 'hit'
  | 'miss'
  | 'damage'
  | 'heal'
  | 'spell';

export interface UnifiedLogEntry {
  id: string;
  type: 'combat' | 'roll' | 'chat';
  timestamp: string;
  actorName: string;
  targetName?: string;
  content: string;
  isCrit?: boolean;
  isFail?: boolean;
  d20Roll?: number;
  totalRoll?: number;
  eventType?: string;
  isSecret?: boolean;
  isSubtleNotice?: boolean;
  formula?: string;
  round?: number;
  chatMessage?: ChatMessage;
}

export interface ParsedSearchQuery {
  freeText: string;
  actor?: string;
  target?: string;
  formula?: string;
  minTotal?: number;
  maxTotal?: number;
  isCrit?: boolean;
  isFail?: boolean;
  eventType?: string;
  round?: number;
}

/**
 * Converte entradas de log de combate e mensagens de chat em um modelo unificado
 */
export function unifyLogEntries(
  combatLogs: CombatLogEntry[],
  chatMessages: ChatMessage[]
): UnifiedLogEntry[] {
  const entries: UnifiedLogEntry[] = [];

  for (const log of combatLogs) {
    const isCombatType =
      log.eventType === 'attack' ||
      log.eventType === 'damage' ||
      log.eventType === 'heal' ||
      log.eventType === 'death';

    entries.push({
      id: log.id,
      type: isCombatType ? 'combat' : 'roll',
      timestamp: log.timestamp,
      actorName: log.actorName || 'Sistema',
      targetName: log.targetName,
      content: log.description,
      isCrit: log.isCrit,
      isFail: log.isFail,
      d20Roll: log.d20Roll,
      totalRoll: log.totalRoll,
      eventType: log.eventType,
      formula: log.actionName,
      round: log.round,
    });
  }

  for (const msg of chatMessages) {
    entries.push({
      id: msg.id,
      type: msg.rollResult ? 'roll' : 'chat',
      timestamp: msg.timestamp,
      actorName: msg.senderName,
      content: msg.content,
      isCrit: msg.rollResult?.isCrit,
      isFail: msg.rollResult?.isFail,
      isSecret: msg.isSecret || msg.rollResult?.isSecret,
      isSubtleNotice: msg.isSubtleNotice,
      formula: msg.rollResult?.formula,
      totalRoll: msg.rollResult?.total,
      chatMessage: msg,
    });
  }

  entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return entries;
}

/**
 * Faz o parsing da string de busca identificando tokens avançados (ex: actor:Lilith nat20 min:15)
 */
export function parseSearchDSL(query: string): ParsedSearchQuery {
  const parsed: ParsedSearchQuery = {
    freeText: '',
  };

  const tokens = query.trim().split(/\s+/);
  const remainingWords: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();

    if (lower.startsWith('actor:') || lower.startsWith('from:') || lower.startsWith('ator:')) {
      parsed.actor = token.split(':')[1]?.toLowerCase();
    } else if (lower.startsWith('target:') || lower.startsWith('to:') || lower.startsWith('alvo:')) {
      parsed.target = token.split(':')[1]?.toLowerCase();
    } else if (lower.startsWith('formula:') || lower.startsWith('dice:') || lower.startsWith('dado:')) {
      parsed.formula = token.split(':')[1]?.toLowerCase();
    } else if (lower.startsWith('min:')) {
      const val = parseInt(token.split(':')[1], 10);
      if (!isNaN(val)) parsed.minTotal = val;
    } else if (lower.startsWith('max:')) {
      const val = parseInt(token.split(':')[1], 10);
      if (!isNaN(val)) parsed.maxTotal = val;
    } else if (lower.startsWith('type:') || lower.startsWith('tipo:')) {
      parsed.eventType = token.split(':')[1]?.toLowerCase();
    } else if (lower.startsWith('round:') || lower.startsWith('r:')) {
      const val = parseInt(token.split(':')[1], 10);
      if (!isNaN(val)) parsed.round = val;
    } else if (lower === 'nat20' || lower === 'crit' || lower === 'critico' || lower === 'crit:true') {
      parsed.isCrit = true;
    } else if (lower === 'nat1' || lower === 'fail' || lower === 'falha' || lower === 'fail:true') {
      parsed.isFail = true;
    } else {
      remainingWords.push(token);
    }
  }

  parsed.freeText = remainingWords.join(' ').toLowerCase();
  return parsed;
}

/**
 * Filtra as entradas unificadas combinando busca textual, tokens DSL e tags rápidas
 */
export function filterLogEntries(
  entries: UnifiedLogEntry[],
  options: {
    searchQuery: string;
    activeTag: QuickTag;
    selectedActor?: string;
    isDm?: boolean;
    currentUserId?: string;
  }
): UnifiedLogEntry[] {
  const { searchQuery, activeTag, selectedActor, isDm, currentUserId } = options;
  const parsedDSL = parseSearchDSL(searchQuery);

  return entries.filter((e) => {
    // 1. Verificações de segurança e visibilidade de DM / Sussurros
    if (e.isSecret && !isDm && !e.isSubtleNotice && e.chatMessage?.senderId !== currentUserId) {
      return false;
    }

    if (e.chatMessage?.channel === 'whisper') {
      if (
        e.chatMessage.senderId !== currentUserId &&
        e.chatMessage.whisperTo !== currentUserId &&
        !isDm
      ) {
        return false;
      }
    }

    // 2. Filtro por Ator específico (Dropdown)
    if (selectedActor && selectedActor !== 'all') {
      if (e.actorName.toLowerCase() !== selectedActor.toLowerCase()) {
        return false;
      }
    }

    // 3. Filtro por Pílula de Tag Rápida
    if (activeTag === 'combat' && e.type !== 'combat') return false;
    if (activeTag === 'rolls' && e.type !== 'roll') return false;
    if (activeTag === 'chat' && e.type !== 'chat') return false;
    if (activeTag === 'secret' && !e.isSecret) return false;
    if (activeTag === 'crit' && !e.isCrit) return false;
    if (activeTag === 'fail' && !e.isFail) return false;
    if (activeTag === 'hit' && (!e.content.includes('ACERTO') || e.content.includes('ERRO'))) return false;
    if (activeTag === 'miss' && !e.content.includes('ERRO') && !e.content.includes('FRACASSO')) return false;
    if (activeTag === 'damage' && e.eventType !== 'damage' && !e.content.includes('dano')) return false;
    if (activeTag === 'heal' && e.eventType !== 'heal' && !e.content.includes('cura')) return false;
    if (activeTag === 'spell' && !e.content.includes('conjurou') && !e.content.includes('Magia')) return false;

    // 4. Filtros dos Tokens DSL
    if (parsedDSL.actor && !e.actorName.toLowerCase().includes(parsedDSL.actor)) {
      return false;
    }
    if (parsedDSL.target && (!e.targetName || !e.targetName.toLowerCase().includes(parsedDSL.target))) {
      return false;
    }
    if (parsedDSL.formula && (!e.formula || !e.formula.toLowerCase().includes(parsedDSL.formula))) {
      return false;
    }
    if (parsedDSL.isCrit && !e.isCrit) {
      return false;
    }
    if (parsedDSL.isFail && !e.isFail) {
      return false;
    }
    if (parsedDSL.minTotal !== undefined && (e.totalRoll === undefined || e.totalRoll < parsedDSL.minTotal)) {
      return false;
    }
    if (parsedDSL.maxTotal !== undefined && (e.totalRoll === undefined || e.totalRoll > parsedDSL.maxTotal)) {
      return false;
    }
    if (parsedDSL.eventType && (!e.eventType || !e.eventType.toLowerCase().includes(parsedDSL.eventType))) {
      return false;
    }
    if (parsedDSL.round !== undefined && e.round !== parsedDSL.round) {
      return false;
    }

    // 5. Busca por Texto Livre
    if (parsedDSL.freeText) {
      const q = parsedDSL.freeText;
      const matchActor = e.actorName.toLowerCase().includes(q);
      const matchTarget = e.targetName?.toLowerCase().includes(q);
      const matchContent = e.content.toLowerCase().includes(q);
      const matchFormula = e.formula?.toLowerCase().includes(q);
      const matchRoll = e.totalRoll !== undefined && String(e.totalRoll) === q;

      if (!matchActor && !matchTarget && !matchContent && !matchFormula && !matchRoll) {
        return false;
      }
    }

    return true;
  });
}
