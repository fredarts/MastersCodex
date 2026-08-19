'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ScrollText,
  Swords,
  Heart,
  Sparkles,
  Dices,
  MessageSquare,
  Filter,
  Search,
  Lock,
  Download,
  Copy,
  Trash2,
  Check,
  ChevronDown,
  X,
  Flame,
  Skull,
  Star,
  Wand2,
} from 'lucide-react';
import { CombatLogEntry, ChatMessage } from '@/lib/types';
import {
  QuickTag,
  UnifiedLogEntry,
  unifyLogEntries,
  filterLogEntries,
} from '@/lib/utils/rollSearchEngine';
import { rollHistoryService } from '@/lib/services/rollHistoryService';
import { toast } from 'sonner';

interface SharedGameLogProps {
  combatLogs: CombatLogEntry[];
  chatMessages: ChatMessage[];
  campaignName?: string;
  campaignId?: string;
  currentUserId?: string;
  isDm?: boolean;
  onClearLogs?: () => void;
}

function getEntryIcon(entry: UnifiedLogEntry) {
  if (entry.isSecret) return <Lock className="w-3.5 h-3.5 text-purple-400" />;
  if (entry.type === 'chat') return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
  if (entry.eventType === 'attack') return <Swords className="w-3.5 h-3.5 text-rose-400" />;
  if (entry.eventType === 'heal') return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
  if (entry.eventType === 'damage') return <Flame className="w-3.5 h-3.5 text-amber-400" />;
  if (entry.eventType === 'death') return <Skull className="w-3.5 h-3.5 text-red-500" />;
  return <Dices className="w-3.5 h-3.5 text-indigo-400" />;
}

export const SharedGameLog: React.FC<SharedGameLogProps> = ({
  combatLogs,
  chatMessages,
  campaignName = 'Campanha Principal',
  campaignId,
  currentUserId,
  isDm = false,
  onClearLogs,
}) => {
  const [activeTag, setActiveTag] = useState<QuickTag>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActor, setSelectedActor] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Unifica logs de combate e mensagens de chat
  const allEntries = useMemo(
    () => unifyLogEntries(combatLogs, chatMessages),
    [combatLogs, chatMessages]
  );

  // Lista de atores únicos para o dropdown
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    allEntries.forEach((e) => {
      if (e.actorName && e.actorName !== 'Sistema') {
        set.add(e.actorName);
      }
    });
    return Array.from(set).sort();
  }, [allEntries]);

  // Aplica motor de busca avançado e filtros
  const filtered = useMemo(
    () =>
      filterLogEntries(allEntries, {
        searchQuery,
        activeTag,
        selectedActor,
        isDm,
        currentUserId,
      }),
    [allEntries, searchQuery, activeTag, selectedActor, isDm, currentUserId]
  );

  // Auto-scroll para a última entrada adicionada
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filtered.length]);

  // Fechar menu de exportação ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyEntry = (entry: UnifiedLogEntry) => {
    const text = `[${entry.timestamp}] ${entry.actorName}: ${entry.content}`;
    navigator.clipboard.writeText(text);
    setCopiedEntryId(entry.id);
    toast.success('Registro copiado para a área de transferência!');
    setTimeout(() => setCopiedEntryId(null), 2000);
  };

  const handleExport = (format: 'txt' | 'json' | 'csv') => {
    const exportContent = rollHistoryService.exportRollHistory(
      campaignName,
      combatLogs,
      format
    );
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
    const mime =
      format === 'json'
        ? 'application/json'
        : format === 'csv'
        ? 'text/csv'
        : 'text/plain';

    rollHistoryService.downloadExportedFile(
      exportContent,
      `historico_rolagens_${campaignName.replace(/\s+/g, '_').toLowerCase()}.${ext}`,
      mime
    );
    setShowExportMenu(false);
    toast.success(`Histórico exportado em .${ext.toUpperCase()} com sucesso!`);
  };

  const handleCopyAllToClipboard = () => {
    const exportContent = rollHistoryService.exportRollHistory(
      campaignName,
      combatLogs,
      'txt'
    );
    navigator.clipboard.writeText(exportContent);
    setShowExportMenu(false);
    toast.success('Todo o histórico de rolagens foi copiado!');
  };

  const handleClearHistory = () => {
    if (campaignId) {
      rollHistoryService.clearRollHistory(campaignId);
    }
    if (onClearLogs) {
      onClearLogs();
    }
    setIsConfirmingClear(false);
    toast.info('Histórico de rolagens da sessão foi limpo.');
  };

  const tagPills: { key: QuickTag; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'all', label: 'Todos', icon: <ScrollText className="w-3 h-3" />, color: 'hover:text-slate-200' },
    { key: 'combat', label: 'Combate', icon: <Swords className="w-3 h-3" />, color: 'hover:text-rose-400' },
    { key: 'rolls', label: 'Rolagens', icon: <Dices className="w-3 h-3" />, color: 'hover:text-indigo-400' },
    { key: 'crit', label: 'Críticos', icon: <Star className="w-3 h-3 text-amber-400" />, color: 'hover:text-amber-300' },
    { key: 'fail', label: 'Falhas', icon: <Skull className="w-3 h-3 text-rose-500" />, color: 'hover:text-rose-300' },
    { key: 'damage', label: 'Dano', icon: <Flame className="w-3 h-3 text-amber-500" />, color: 'hover:text-amber-300' },
    { key: 'heal', label: 'Cura', icon: <Heart className="w-3 h-3 text-emerald-400" />, color: 'hover:text-emerald-300' },
    { key: 'spell', label: 'Magias', icon: <Wand2 className="w-3 h-3 text-purple-400" />, color: 'hover:text-purple-300' },
    { key: 'chat', label: 'Chat', icon: <MessageSquare className="w-3 h-3" />, color: 'hover:text-cyan-400' },
    ...(isDm
      ? [{ key: 'secret' as QuickTag, label: 'Secretos', icon: <Lock className="w-3 h-3 text-purple-400" />, color: 'hover:text-purple-300' }]
      : []),
  ];

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-xl border border-[#1e293b] overflow-hidden text-xs">
      {/* Top Header: Search DSL + Tag Pills + Export / Clear Toolbar */}
      <div className="flex flex-col gap-1.5 p-2 border-b border-[#1e293b] bg-[#0d1220]/95 backdrop-blur-md">
        {/* Main Search Input & Actions */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1 flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar (ex: Lilith, nat20, min:15, 1d8)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141b2d] border border-[#2a3449] focus:border-amber-500/60 rounded-lg pl-7 pr-7 py-1 text-[11px] text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-500 hover:text-slate-300 p-0.5"
                title="Limpar busca"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Actor Dropdown Selector */}
          {uniqueActors.length > 0 && (
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="bg-[#141b2d] border border-[#2a3449] text-slate-300 text-[10px] rounded-lg px-2 py-1 outline-none max-w-[110px] truncate cursor-pointer hover:border-slate-600 transition-colors"
            >
              <option value="all">Todos Atores</option>
              {uniqueActors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          )}

          {/* Export Menu Trigger */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1.5 bg-[#141b2d] hover:bg-[#1e293b] border border-[#2a3449] text-slate-300 rounded-lg transition-colors flex items-center gap-1"
              title="Exportar Histórico de Rolagens"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#0f1422] border border-amber-500/30 rounded-xl shadow-2xl p-1 text-[11px] animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-500/10 rounded-lg text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Baixar como .TXT</span>
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-500/10 rounded-lg text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Dices className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Baixar como .JSON</span>
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-500/10 rounded-lg text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baixar como .CSV</span>
                </button>
                <div className="h-[1px] bg-slate-800 my-1" />
                <button
                  onClick={handleCopyAllToClipboard}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-500/10 rounded-lg text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copiar Tudo</span>
                </button>
              </div>
            )}
          </div>

          {/* Clear Logs Button (DM only or session clear) */}
          {isDm && (
            <div className="relative">
              {isConfirmingClear ? (
                <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600 rounded-lg p-0.5 animate-in fade-in duration-150">
                  <button
                    onClick={handleClearHistory}
                    className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded hover:bg-rose-500"
                    title="Confirmar Limpeza"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Cancelar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="p-1.5 bg-[#141b2d] hover:bg-rose-950/50 border border-[#2a3449] hover:border-rose-700/50 text-slate-400 hover:text-rose-300 rounded-lg transition-colors"
                  title="Limpar Histórico de Rolagens"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Tag Pills Array */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <Filter className="w-3 h-3 text-slate-500 shrink-0 mr-0.5" />
          {tagPills.map((tag) => {
            const isSelected = activeTag === tag.key;
            return (
              <button
                key={tag.key}
                onClick={() => setActiveTag(tag.key)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm'
                    : `bg-slate-900/60 text-slate-400 border border-slate-800/80 ${tag.color}`
                }`}
              >
                {tag.icon}
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>

        {/* Counter and Active Filters Status */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
          <span>
            Exibindo <strong className="text-amber-400">{filtered.length}</strong> de {allEntries.length} registros
          </span>
          {(searchQuery || activeTag !== 'all' || selectedActor !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTag('all');
                setSelectedActor('all');
              }}
              className="text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Log Entries List */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs italic py-8 space-y-1">
            <ScrollText className="w-6 h-6 text-slate-600 mb-1 opacity-50" />
            <p>Nenhuma rolagem corresponde aos filtros aplicados.</p>
            {(searchQuery || activeTag !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTag('all');
                  setSelectedActor('all');
                }}
                className="text-amber-400 hover:text-amber-300 text-[10px] underline cursor-pointer mt-1"
              >
                Limpar filtros de busca
              </button>
            )}
          </div>
        )}

        {filtered.map((entry) => {
          // Rolagem secreta do Mestre com aviso sutil aos jogadores
          if (entry.isSubtleNotice && !isDm && entry.chatMessage?.senderId !== currentUserId) {
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs bg-purple-950/40 border border-purple-800/40 text-purple-300 animate-in fade-in duration-200"
              >
                <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-semibold italic text-[11px]">
                  🎲 O Mestre realizou uma rolagem em segredo...
                </span>
                <span className="text-[9px] text-purple-400/60 font-mono ml-auto">{entry.timestamp}</span>
              </div>
            );
          }

          const isCopied = copiedEntryId === entry.id;

          return (
            <div
              key={entry.id}
              className={`group relative flex items-start gap-2 px-2.5 py-2 rounded-xl text-xs transition-all ${
                entry.isSecret
                  ? 'bg-purple-950/30 border border-purple-500/30 shadow-inner'
                  : entry.isCrit
                  ? 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                  : entry.isFail
                  ? 'bg-rose-500/10 border border-rose-500/30'
                  : entry.type === 'chat'
                  ? 'bg-cyan-500/5 border border-cyan-500/10 hover:border-cyan-500/25'
                  : 'bg-[#111622]/60 border border-slate-800/60 hover:bg-[#141b2b] hover:border-slate-700/60'
              }`}
            >
              <div className="mt-0.5 shrink-0">{getEntryIcon(entry)}</div>

              <div className="flex-1 min-w-0">
                {/* Header: Actor Name + Round Badge + Timestamp + Status Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-100 truncate">{entry.actorName}</span>
                  {entry.targetName && (
                    <span className="text-[10px] text-slate-400">
                      → <strong className="text-slate-300">{entry.targetName}</strong>
                    </span>
                  )}
                  {entry.round !== undefined && entry.round > 0 && (
                    <span className="text-[8px] font-mono bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700">
                      R{entry.round}
                    </span>
                  )}
                  <span className="text-[9px] text-slate-500 font-mono ml-auto shrink-0">{entry.timestamp}</span>

                  {entry.isSecret && (
                    <span className="text-[8px] font-black text-purple-300 bg-purple-500/30 border border-purple-400/40 px-1 rounded uppercase tracking-wider">
                      SECRETO DM
                    </span>
                  )}
                  {entry.isCrit && (
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded shadow-sm">
                      ✨ CRÍTICO!
                    </span>
                  )}
                  {entry.isFail && (
                    <span className="text-[9px] font-black text-rose-400 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.2 rounded">
                      💀 FALHA!
                    </span>
                  )}
                </div>

                {/* Content description / Roll formula details */}
                <p className="text-slate-300 leading-relaxed mt-0.5 break-words text-[11px]">
                  {entry.chatMessage?.rollResult ? (
                    <span>
                      <span className="text-slate-200">{entry.content}</span>
                      <span className="inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-[10px]">
                        🎲 {entry.chatMessage.rollResult.formula} = [{entry.chatMessage.rollResult.rolls.join(', ')}] →{' '}
                        <strong className="text-amber-400 text-xs">{entry.chatMessage.rollResult.total}</strong>
                      </span>
                    </span>
                  ) : (
                    entry.content
                  )}
                </p>

                {/* D20 and total calculation breakout */}
                {entry.d20Roll !== undefined && entry.totalRoll !== undefined && !entry.chatMessage && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
                      <span>d20: <strong className="text-slate-200">{entry.d20Roll}</strong></span>
                      <span>→</span>
                      <span>Total: <strong className="text-amber-300 font-bold">{entry.totalRoll}</strong></span>
                    </span>
                  </div>
                )}
              </div>

              {/* Copy Single Entry Action on Hover */}
              <button
                onClick={() => handleCopyEntry(entry)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-all shrink-0 cursor-pointer"
                title="Copiar resultado"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>
    </div>
  );
};
