'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ScrollText, 
  Swords, 
  Heart, 
  ShieldAlert, 
  Sparkles, 
  Skull, 
  Target, 
  Trash2, 
  Download, 
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Zap,
  Activity
} from 'lucide-react';
import { Combatant, CombatLogEntry } from '@/lib/types';

interface BattleLogProps {
  logs: CombatLogEntry[];
  activeAttacker?: Combatant;
  activeTarget?: Combatant;
  onClearLogs?: () => void;
  onSelectTarget?: (combatant: Combatant) => void;
}

export const BattleLog: React.FC<BattleLogProps> = ({
  logs,
  activeAttacker,
  activeTarget,
  onClearLogs,
  onSelectTarget
}) => {
  const [filter, setFilter] = useState<'all' | 'attack' | 'damage' | 'status'>('all');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'attack') return log.eventType === 'attack';
    if (filter === 'damage') return log.eventType === 'damage' || log.eventType === 'heal';
    if (filter === 'status') return log.eventType === 'status' || log.eventType === 'save' || log.eventType === 'death';
    return true;
  });

  const exportLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] (Rodada ${l.round}) ${l.description}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log-combate-${Date.now()}.txt`;
    a.click();
  };

  const getEventIcon = (type: CombatLogEntry['eventType']) => {
    switch (type) {
      case 'attack':
        return <Swords className="w-3.5 h-3.5 text-amber-400" />;
      case 'damage':
        return <Zap className="w-3.5 h-3.5 text-rose-400" />;
      case 'heal':
        return <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" />;
      case 'save':
        return <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />;
      case 'status':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'death':
        return <Skull className="w-3.5 h-3.5 text-rose-500" />;
      case 'turn':
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <ScrollText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex-1 bg-[#0c0f17] flex flex-col h-full overflow-hidden select-none border-l border-[#2a3449]">
      {/* Header */}
      <div className="p-3 border-b border-[#2a3449] bg-[#121824]/60 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider">Log da Partida</h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded">
                {logs.length} Eventos
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Histórico de ações e rolagens ao vivo</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {onClearLogs && logs.length > 0 && (
            <button onClick={onClearLogs} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-[#161c28] transition-colors" title="Limpar Log">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {logs.length > 0 && (
            <button onClick={exportLogs} className="p-1.5 text-slate-500 hover:text-amber-300 rounded-lg hover:bg-[#161c28] transition-colors" title="Exportar Log (.txt)">
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Target Status Banner */}
      <div className="p-2.5 bg-[#0a0d14] border-b border-[#2a3449] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-200 truncate max-w-[90px]">{activeAttacker ? activeAttacker.name : 'Nenhum'}</span>
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <Target className="w-3.5 h-3.5 text-rose-500 animate-pulse flex-shrink-0" />
          </div>
          
          {activeTarget ? (
            <div className="flex items-center gap-1.5 bg-rose-950/40 border border-rose-500/50 px-2 py-0.5 rounded-lg truncate">
              <span className="text-[10px] font-bold text-rose-300 truncate">{activeTarget.name}</span>
              <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-1 rounded">CA {activeTarget.ac}</span>
            </div>
          ) : (
            <span className="text-[10px] italic text-slate-500 truncate">Nenhum alvo (clique na mini 3D)</span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#2a3449] bg-[#121824]/30 p-1 gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
            filter === 'all' ? 'bg-[#1e293b] text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({logs.length})
        </button>
        <button
          onClick={() => setFilter('attack')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
            filter === 'attack' ? 'bg-[#1e293b] text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚔️ Ataques
        </button>
        <button
          onClick={() => setFilter('damage')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
            filter === 'damage' ? 'bg-[#1e293b] text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          💥 Dano/Cura
        </button>
        <button
          onClick={() => setFilter('status')}
          className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
            filter === 'status' ? 'bg-[#1e293b] text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✨ Status
        </button>
      </div>

      {/* Log History Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-sans">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-[#2a3449] rounded-2xl my-4">
            <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhuma ação registrada ainda.</p>
            <p className="text-[10px] text-slate-600 mt-1">Selecione um alvo e role ataques para gerar o histórico.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isTurnEvent = log.eventType === 'turn';
            const isDeathEvent = log.eventType === 'death';

            if (isTurnEvent) {
              return (
                <div key={log.id} className="my-2 text-center relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#2a3449]"></div></div>
                  <span className="relative px-3 py-0.5 bg-[#121824] border border-[#2a3449] rounded-full text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest shadow">
                    {log.description}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border transition-all flex flex-col gap-1 text-xs ${
                  isDeathEvent
                    ? 'bg-rose-950/30 border-rose-600/50 text-rose-200'
                    : log.eventType === 'attack'
                    ? log.isHit
                      ? 'bg-[#161c28] border-amber-500/40 text-slate-200'
                      : 'bg-[#121824] border-[#2a3449] text-slate-400'
                    : log.eventType === 'damage'
                    ? 'bg-rose-950/20 border-rose-900/40 text-slate-200'
                    : log.eventType === 'heal'
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
                    : 'bg-[#121824] border-[#2a3449] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {getEventIcon(log.eventType)}
                    <span className="font-bold text-[11px] text-slate-100 truncate">{log.actorName}</span>
                    {log.targetName && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        → <span className="font-bold text-slate-300">{log.targetName}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{log.timestamp}</span>
                </div>

                <p className="text-[11px] leading-snug text-slate-300">{log.description}</p>

                {/* Attack Badge / Breakdown details */}
                {log.eventType === 'attack' && log.d20Roll !== undefined && (
                  <div className="flex items-center gap-2 mt-0.5 pt-1 border-t border-[#2a3449]/40 text-[10px] font-mono">
                    <span className="bg-[#0a0d14] px-1.5 py-0.5 rounded border border-[#2a3449] text-slate-300">
                      d20: <strong className="text-amber-400">{log.d20Roll}</strong> (Total {log.totalRoll})
                    </span>
                    {log.targetAc !== undefined && (
                      <span className="text-slate-400">vs CA {log.targetAc}</span>
                    )}
                    {log.isCrit ? (
                      <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black text-[9px] uppercase">💥 CRÍTICO!</span>
                    ) : log.isHit ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold text-[9px]">✓ ACERTOU</span>
                    ) : (
                      <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold text-[9px]">✕ ERROU</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
