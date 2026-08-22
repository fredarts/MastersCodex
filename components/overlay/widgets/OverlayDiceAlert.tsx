'use client';

import React from 'react';
import { OverlayRollItem } from '@/lib/overlay/overlayStateReducer';
import { Sparkles, Skull, Dices, ShieldAlert } from 'lucide-react';

interface OverlayDiceAlertProps {
  rolls: OverlayRollItem[];
  theme?: string;
}

export const OverlayDiceAlert: React.FC<OverlayDiceAlertProps> = ({ rolls, theme = 'obsidian' }) => {
  if (!rolls || rolls.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {rolls.map((roll) => {
        const isCrit = roll.isCrit;
        const isFail = roll.isFail;

        // Visual theme cards (Purple Ban strictly respected: Amber/Gold, Emerald, Ruby, Cyan, Obsidian)
        let borderClass = 'border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]';
        let bgClass = 'bg-slate-950/90 backdrop-blur-md';
        let badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
        let resultColor = 'text-amber-400';

        if (isCrit) {
          borderClass = 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] ring-1 ring-amber-400/50 animate-pulse';
          bgClass = 'bg-gradient-to-br from-amber-950/95 via-slate-950/95 to-slate-950/95 backdrop-blur-lg';
          badgeColor = 'bg-amber-400/30 text-amber-200 border-amber-300 font-bold';
          resultColor = 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]';
        } else if (isFail) {
          borderClass = 'border-rose-600/80 shadow-[0_0_25px_rgba(225,29,72,0.4)] ring-1 ring-rose-500/30';
          bgClass = 'bg-gradient-to-br from-rose-950/90 via-slate-950/95 to-slate-950/95 backdrop-blur-lg';
          badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
          resultColor = 'text-rose-400 drop-shadow-[0_0_10px_rgba(225,29,72,0.6)]';
        }

        return (
          <div
            key={roll.id}
            className={`flex items-center gap-3 p-3.5 rounded-xl border ${borderClass} ${bgClass} transition-all duration-300 animate-in fade-in slide-in-from-bottom-4`}
          >
            {/* Big Dice Result Badge */}
            <div className={`relative flex flex-col items-center justify-center min-w-[58px] h-[58px] rounded-lg border ${badgeColor}`}>
              {isCrit && <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-spin" style={{ animationDuration: '4s' }} />}
              {isFail && <Skull className="w-3.5 h-3.5 text-rose-400 absolute -top-1.5 -right-1.5" />}
              {!isCrit && !isFail && <Dices className="w-3 h-3 text-slate-400 absolute top-1 right-1" />}
              
              <span className={`text-2xl font-black tracking-tight leading-none ${resultColor}`}>
                {roll.result}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 mt-0.5">
                {roll.rollType || 'd20'}
              </span>
            </div>

            {/* Roll details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold text-slate-100 truncate">
                  {roll.rollerName}
                </span>
                {isCrit && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 rounded shadow-sm">
                    NAT 20
                  </span>
                )}
                {isFail && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white rounded shadow-sm">
                    NAT 1
                  </span>
                )}
              </div>

              {roll.title && (
                <p className="text-xs text-slate-300 truncate mt-0.5 font-medium">
                  {roll.title}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.2 rounded border border-slate-800">
                  {roll.diceFormula}
                </span>
                {roll.isHit !== undefined && (
                  <span className={`text-[10px] font-bold ${roll.isHit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {roll.isHit ? '✓ Acerto' : '✗ Erro'}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
