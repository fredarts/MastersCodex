'use client';

import React from 'react';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { BG3DiceRollModal } from '@/components/live-cockpit/BG3DiceRollModal';

export const FloatingDiceRollerHUD: React.FC = () => {
  const {
    diceResult,
    setDiceResult,
    bg3DiceOverlay,
    setBg3DiceOverlay,
  } = useLiveCockpitStudioStore();

  return (
    <>
      {/* Floating Dice Result (top-right fallback notification) */}
      {diceResult && (
        <div className="absolute top-16 right-4 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div
            className={`bg-[#0f141d]/95 backdrop-blur-xl border-2 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[250px]
              ${diceResult.isCrit ? 'border-amber-500 shadow-amber-500/20' : diceResult.isFail ? 'border-rose-600 shadow-rose-900/20' : 'border-slate-600'}
            `}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-inner
                ${diceResult.isCrit ? 'bg-amber-500 text-slate-950' : diceResult.isFail ? 'bg-rose-600 text-slate-950' : 'bg-[#1e293b] text-slate-100'}
              `}
            >
              {diceResult.roll}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{diceResult.title}</div>
              <div className="text-2xl font-black text-slate-100">Total: {diceResult.total}</div>
            </div>
            <button
              onClick={() => setDiceResult(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-600 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Baldur's Gate 3 Full Modal Dice Roller */}
      {bg3DiceOverlay && (
        <BG3DiceRollModal
          state={bg3DiceOverlay}
          onClose={() => {
            setBg3DiceOverlay(null);
            useLiveCockpitStudioStore.getState().setSelectedTargetId(undefined);
            useLiveCockpitStudioStore.getState().setPendingAttack(null);
          }}
        />
      )}
    </>
  );
};
