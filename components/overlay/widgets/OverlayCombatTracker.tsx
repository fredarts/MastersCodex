'use client';

import React from 'react';
import { OverlayCombatState } from '@/lib/overlay/overlayStateReducer';
import { Swords, Shield, Heart } from 'lucide-react';

interface OverlayCombatTrackerProps {
  combat: OverlayCombatState;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showHp?: boolean;
  theme?: string;
}

export const OverlayCombatTracker: React.FC<OverlayCombatTrackerProps> = ({
  combat,
  layout = 'horizontal',
  showHp = false,
  theme = 'obsidian',
}) => {
  if (!combat.isActive || !combat.combatants || combat.combatants.length === 0) {
    return null;
  }

  const { combatants, currentTurnIndex, roundCount } = combat;
  const activeCombatant = combatants[currentTurnIndex % combatants.length];

  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-amber-500/30 shadow-[0_0_20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Swords className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Rodada {roundCount}</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-800" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Turno de:</span>
          <span className="text-sm font-bold text-amber-300 drop-shadow-sm">
            {activeCombatant?.name}
          </span>
          {showHp && activeCombatant?.hp !== undefined && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/50">
              <Heart className="w-3 h-3 text-emerald-400" />
              {activeCombatant.hp} / {activeCombatant.maxHp || activeCombatant.hp}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'vertical') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-[0_0_25px_rgba(0,0,0,0.8)] max-w-xs w-full">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 px-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Swords className="w-4 h-4" />
            <span>Combate • Rodada {roundCount}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {combatants.length} Combatentes
          </span>
        </div>

        <div className="flex flex-col gap-1.5 mt-1">
          {combatants.map((c, idx) => {
            const isActive = idx === currentTurnIndex % combatants.length;
            return (
              <div
                key={c.id}
                className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-500/20 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                    : 'bg-slate-900/60 border border-slate-800/50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {c.initiative}
                  </div>
                  <span
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-amber-200' : 'text-slate-200'
                    }`}
                  >
                    {c.name}
                  </span>
                </div>

                {showHp && c.hp !== undefined && (
                  <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-slate-300">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>{c.hp}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: Horizontal Ticker
  return (
    <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800/90 shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-x-auto max-w-full">
      {/* Round Pill */}
      <div className="flex flex-col items-center justify-center px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
        <span className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Rodada</span>
        <span className="text-sm font-black text-amber-300 leading-none">{roundCount}</span>
      </div>

      <div className="h-7 w-[1px] bg-slate-800 mx-1" />

      {/* Combatant Cards */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {combatants.map((c, idx) => {
          const isActive = idx === currentTurnIndex % combatants.length;
          return (
            <div
              key={c.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-amber-950/90 to-slate-900/90 border border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50'
                  : 'bg-slate-900/50 border border-slate-800/60 opacity-60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  isActive ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {c.initiative}
              </div>
              <span
                className={`text-xs font-bold ${
                  isActive ? 'text-amber-300 drop-shadow' : 'text-slate-300'
                }`}
              >
                {c.name}
              </span>
              {showHp && c.hp !== undefined && (
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-1 py-0.5 rounded">
                  {c.hp} HP
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
