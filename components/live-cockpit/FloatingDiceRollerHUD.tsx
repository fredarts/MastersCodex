'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Dice3DCanvas, DieType } from '@/components/Dice3DCanvas';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';

export const FloatingDiceRollerHUD: React.FC = () => {
  const {
    diceResult,
    setDiceResult,
    bg3DiceOverlay,
    setBg3DiceOverlay,
    animatedRollNumber,
  } = useLiveCockpitStudioStore();

  return (
    <>
      {/* Floating Dice Result (top-right) */}
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

      {/* Baldur's Gate 3 Style Floating HUD Dice Roller */}
      {bg3DiceOverlay && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in slide-in-from-top-6 fade-in duration-300">
          <div
            className={`pointer-events-auto min-w-[340px] max-w-md p-5 rounded-3xl backdrop-blur-2xl border-2 text-center transition-all duration-300 shadow-2xl flex flex-col items-center gap-4 ${
              bg3DiceOverlay.isRolling
                ? 'bg-[#0f141d]/95 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                : bg3DiceOverlay.isCrit
                ? 'bg-[#181308]/98 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.7)] animate-bg3-crit'
                : bg3DiceOverlay.isFail
                ? 'bg-[#1c080e]/98 border-rose-600 shadow-[0_0_60px_rgba(244,63,94,0.7)] animate-bg3-shake'
                : bg3DiceOverlay.isHit
                ? 'bg-[#181308]/98 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]'
                : 'bg-[#1a0b10]/98 border-rose-600/80 shadow-[0_0_50px_rgba(244,63,94,0.4)]'
            }`}
          >
            {/* Top Action Title Banner */}
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                {bg3DiceOverlay.actorName ? `${bg3DiceOverlay.actorName} • ` : ''}
                {bg3DiceOverlay.title}
              </div>
              {bg3DiceOverlay.targetName && (
                <div className="text-xs text-slate-200 font-sans">
                  Alvo: <span className="font-bold text-rose-400">{bg3DiceOverlay.targetName}</span>
                  {bg3DiceOverlay.targetAc !== undefined && (
                    <span className="font-mono text-slate-400"> (CA {bg3DiceOverlay.targetAc})</span>
                  )}
                </div>
              )}
            </div>

            {/* 3D WebGL Polyhedral Dice Display */}
            {bg3DiceOverlay.phase === 'd20' ? (
              <div className="relative flex items-center justify-center my-1">
                <Dice3DCanvas
                  dieType="d20"
                  isRolling={bg3DiceOverlay.isRolling}
                  isHit={bg3DiceOverlay.isHit}
                  isFail={bg3DiceOverlay.isFail}
                  isCrit={bg3DiceOverlay.isCrit}
                  number={bg3DiceOverlay.isRolling ? animatedRollNumber : bg3DiceOverlay.d20Roll}
                  modifier={bg3DiceOverlay.modifier}
                />
              </div>
            ) : (
              /* Phase 2: Damage Dice Visual (3D Polyhedra) */
              <div className="relative flex items-center justify-center my-1 animate-in zoom-in-95 duration-200">
                {(() => {
                  const formula = (bg3DiceOverlay.damageDiceFormula || '').toLowerCase();
                  let damageDieType: DieType = 'd8';
                  if (formula.includes('d20')) damageDieType = 'd20';
                  else if (formula.includes('d12')) damageDieType = 'd12';
                  else if (formula.includes('d10')) damageDieType = 'd10';
                  else if (formula.includes('d6')) damageDieType = 'd6';
                  else if (formula.includes('d4')) damageDieType = 'd4';

                  return (
                    <Dice3DCanvas
                      dieType={damageDieType}
                      isRolling={bg3DiceOverlay.isRolling}
                      isHit={true}
                      number={bg3DiceOverlay.isRolling ? animatedRollNumber : (bg3DiceOverlay.damageAmount || 0)}
                    />
                  );
                })()}
              </div>
            )}

            {/* Outcome Result Text */}
            {!bg3DiceOverlay.isRolling && (
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {bg3DiceOverlay.phase === 'd20' ? (
                  <>
                    <div className="text-2xl font-black text-slate-100 font-mono">
                      TOTAL: <span className="text-amber-400">{bg3DiceOverlay.totalRoll}</span>
                    </div>

                    <div className="text-xs font-black uppercase tracking-wider">
                      {bg3DiceOverlay.isCrit ? (
                        <span className="text-amber-400 font-extrabold flex items-center justify-center gap-1">
                          💥 ACERTO CRÍTICO! (20 NATURAL)
                        </span>
                      ) : bg3DiceOverlay.isFail ? (
                        <span className="text-rose-500 font-extrabold flex items-center justify-center gap-1">
                          💀 ERRO CRÍTICO! (1 NATURAL)
                        </span>
                      ) : bg3DiceOverlay.isHit ? (
                        <span className="text-amber-400 font-bold">✓ ACERTOU O ALVO!</span>
                      ) : (
                        <span className="text-rose-400 font-bold">✕ ERROU O ALVO!</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xl font-black text-rose-400 font-mono">
                    💥 {bg3DiceOverlay.damageAmount} PONTOS DE DANO!
                  </div>
                )}
              </div>
            )}

            {/* Quick Dismiss Button */}
            {!bg3DiceOverlay.isRolling && (
              <button
                onClick={() => setBg3DiceOverlay(null)}
                className="px-6 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-xl shadow-lg transition-all active:scale-95 border border-amber-300"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
