'use client';

import React from 'react';
import { 
  Swords, 
  Shield, 
  Heart, 
  Sparkles, 
  Flame, 
  ChevronRight, 
  ChevronLeft, 
  UserCheck, 
  Clock, 
  Activity 
} from 'lucide-react';
import { Combatant } from '@/lib/types';

interface PlayerCombatTrackerHUDProps {
  combatants: Combatant[];
  currentTurnIndex: number;
  roundCount: number;
  playerCharName: string;
  isCombatActive: boolean;
}

export const PlayerCombatTrackerHUD: React.FC<PlayerCombatTrackerHUDProps> = ({
  combatants,
  currentTurnIndex,
  roundCount,
  playerCharName,
  isCombatActive,
}) => {
  if (!isCombatActive || combatants.length === 0) return null;

  const currentCombatant = combatants[currentTurnIndex];
  const isMyTurn = currentCombatant && (
    currentCombatant.name.toLowerCase().includes(playerCharName.toLowerCase()) ||
    playerCharName.toLowerCase().includes(currentCombatant.name.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0a0d14]/90 backdrop-blur-md border-b border-[#2a3449] p-2.5 shadow-xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Combat Status & Round Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shadow-inner">
            <Swords className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded">
                COMBATE ATIVO
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                RODADA #{roundCount}
              </span>
            </div>
            {currentCombatant && (
              <p className="text-xs font-bold text-slate-100 mt-0.5 flex items-center gap-1.5">
                <span>Vez de:</span>
                <strong className={`font-mono ${isMyTurn ? 'text-amber-300 animate-pulse' : 'text-cyan-300'}`}>
                  {currentCombatant.name}
                </strong>
                {isMyTurn && (
                  <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                    SUA VEZ!
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Center: Turn Order Carousel */}
        <div className="flex-1 max-w-2xl overflow-x-auto flex items-center gap-2 py-1 px-2 no-scrollbar">
          {combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const isMe = c.name.toLowerCase().includes(playerCharName.toLowerCase()) || playerCharName.toLowerCase().includes(c.name.toLowerCase());
            const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));

            return (
              <div
                key={`${c.id}-${idx}`}
                className={`shrink-0 min-w-[140px] p-2 rounded-xl border transition-all duration-300 ${
                  isTurn
                    ? 'bg-amber-950/60 border-amber-500 text-slate-100 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40 scale-105'
                    : isMe
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                    : 'bg-[#141a26] border-[#2a3449] text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-[9px] font-mono text-amber-400 font-bold bg-[#0a0d14] px-1 py-0.2 rounded">
                      #{c.initiative}
                    </span>
                    <span className="text-xs font-bold truncate max-w-[85px]">{c.name}</span>
                  </div>
                  {isMe && (
                    <span className="text-[8px] bg-cyan-500 text-slate-950 font-bold px-1 rounded font-mono shrink-0">
                      VOCÊ
                    </span>
                  )}
                </div>

                {/* HP Progress Bar */}
                <div className="w-full h-1 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                  <div
                    className={`h-full transition-all duration-300 ${
                      hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Turn Callout */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 animate-pulse flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>FAÇA SUA JOGADA!</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[#141a26] border border-[#2a3449] text-slate-400 text-xs font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Aguardando Turno...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
