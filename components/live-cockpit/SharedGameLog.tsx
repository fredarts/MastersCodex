'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ScrollText, Swords, Heart, Sparkles, Dices, MessageSquare, Filter } from 'lucide-react';
import { CombatLogEntry, ChatMessage } from '@/lib/types';

type LogFilter = 'all' | 'combat' | 'rolls' | 'chat';

interface SharedGameLogProps {
  combatLogs: CombatLogEntry[];
  chatMessages: ChatMessage[];
  currentUserId?: string;
}

interface UnifiedEntry {
  id: string;
  type: 'combat' | 'roll' | 'chat';
  timestamp: string;
  actorName: string;
  content: string;
  isCrit?: boolean;
  isFail?: boolean;
  d20Roll?: number;
  totalRoll?: number;
  eventType?: string;
  chatMessage?: ChatMessage;
}

function unifyEntries(combatLogs: CombatLogEntry[], chatMessages: ChatMessage[]): UnifiedEntry[] {
  const entries: UnifiedEntry[] = [];

  for (const log of combatLogs) {
    const type: UnifiedEntry['type'] = (log.eventType === 'attack' || log.eventType === 'damage' || log.eventType === 'heal' || log.eventType === 'death')
      ? 'combat'
      : 'roll';
    entries.push({
      id: log.id,
      type,
      timestamp: log.timestamp,
      actorName: log.actorName,
      content: log.description,
      isCrit: log.isCrit,
      isFail: log.isFail,
      d20Roll: log.d20Roll,
      totalRoll: log.totalRoll,
      eventType: log.eventType,
    });
  }

  for (const msg of chatMessages) {
    entries.push({
      id: msg.id,
      type: 'chat',
      timestamp: msg.timestamp,
      actorName: msg.senderName,
      content: msg.content,
      isCrit: msg.rollResult?.isCrit,
      isFail: msg.rollResult?.isFail,
      chatMessage: msg,
    });
  }

  entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return entries;
}

function getEntryIcon(entry: UnifiedEntry) {
  if (entry.type === 'chat') return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
  if (entry.eventType === 'attack') return <Swords className="w-3.5 h-3.5 text-rose-400" />;
  if (entry.eventType === 'heal') return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
  if (entry.eventType === 'damage') return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
  if (entry.eventType === 'death') return <Sparkles className="w-3.5 h-3.5 text-red-500" />;
  return <Dices className="w-3.5 h-3.5 text-indigo-400" />;
}

export const SharedGameLog: React.FC<SharedGameLogProps> = ({ combatLogs, chatMessages, currentUserId }) => {
  const [filter, setFilter] = useState<LogFilter>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const entries = unifyEntries(combatLogs, chatMessages);
  const filtered = entries.filter((e) => {
    if (filter === 'combat') return e.type === 'combat';
    if (filter === 'rolls') return e.type === 'roll';
    if (filter === 'chat') return e.type === 'chat';
    return true;
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filtered.length]);

  const filterButtons: { key: LogFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Todos', icon: <ScrollText className="w-3 h-3" /> },
    { key: 'combat', label: 'Combate', icon: <Swords className="w-3 h-3" /> },
    { key: 'rolls', label: 'Rolagens', icon: <Dices className="w-3 h-3" /> },
    { key: 'chat', label: 'Chat', icon: <MessageSquare className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-xl border border-[#1e293b] overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1e293b] bg-[#0d1220]">
        <Filter className="w-3 h-3 text-slate-500 mr-1" />
        {filterButtons.map((fb) => (
          <button
            key={fb.key}
            onClick={() => setFilter(fb.key)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
              filter === fb.key
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {fb.icon}
            {fb.label}
          </button>
        ))}
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs">
            Nenhum evento ainda...
          </div>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
              entry.isCrit
                ? 'bg-amber-500/10 border border-amber-500/20'
                : entry.isFail
                ? 'bg-rose-500/10 border border-rose-500/20'
                : entry.type === 'chat'
                ? 'bg-cyan-500/5 border border-transparent hover:border-cyan-500/10'
                : 'bg-transparent border border-transparent hover:bg-[#111827]'
            }`}
          >
            <div className="mt-0.5 shrink-0">{getEntryIcon(entry)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-200 truncate">{entry.actorName}</span>
                <span className="text-[9px] text-slate-600 font-mono shrink-0">{entry.timestamp}</span>
                {entry.isCrit && (
                  <span className="text-[9px] font-black text-amber-400 bg-amber-500/20 px-1 rounded">CRIT!</span>
                )}
                {entry.isFail && (
                  <span className="text-[9px] font-black text-rose-400 bg-rose-500/20 px-1 rounded">FAIL!</span>
                )}
              </div>
              <p className="text-slate-400 leading-snug mt-0.5 break-words">
                {entry.chatMessage?.rollResult ? (
                  <span>
                    <span className="text-slate-300">{entry.content}</span>
                    <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px]">
                      🎲 {entry.chatMessage.rollResult.formula} = [{entry.chatMessage.rollResult.rolls.join(', ')}] → <strong>{entry.chatMessage.rollResult.total}</strong>
                    </span>
                  </span>
                ) : (
                  entry.content
                )}
              </p>
              {entry.d20Roll !== undefined && entry.totalRoll !== undefined && !entry.chatMessage && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-slate-500">
                    d20({entry.d20Roll}) → Total: <strong className="text-slate-300">{entry.totalRoll}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </div>
  );
};
