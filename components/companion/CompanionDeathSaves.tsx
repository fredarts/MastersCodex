'use client';

import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { Skull, Heart, RefreshCw, CheckCircle2, XCircle, Sparkles, AlertOctagon } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';

interface CompanionDeathSavesProps {
  sheet: CharacterSheet;
  onUpdateDeathSaves: (successes: number, failures: number) => void;
  onRevive: (hp: number) => void;
}

export const CompanionDeathSaves: React.FC<CompanionDeathSavesProps> = ({
  sheet,
  onUpdateDeathSaves,
  onRevive,
}) => {
  const [lastRoll, setLastRoll] = useState<{ value: number; message: string; type: 'crit' | 'fail' | 'crit_fail' | 'success' } | null>(null);

  const successes = sheet.deathSaves?.successes || 0;
  const failures = sheet.deathSaves?.failures || 0;

  const isDead = failures >= 3;
  const isStabilized = successes >= 3;

  const handleRollDeathSave = () => {
    if (isDead || isStabilized) return;

    const roll = Math.floor(Math.random() * 20) + 1;

    if (roll === 20) {
      // 20 Natural: Recupera 1 HP e acorda imediatamente!
      haptic.critSuccess();
      setLastRoll({ value: 20, message: '🎉 CRÍTICO 20! Você recupera 1 PV e acorda!', type: 'crit' });
      onUpdateDeathSaves(0, 0);
      onRevive(1);
      return;
    }

    if (roll === 1) {
      // 1 Natural: 2 Falhas automáticas!
      haptic.critFail();
      const newFailures = Math.min(3, failures + 2);
      setLastRoll({ value: 1, message: '💀 FALHA CRÍTICA 1! 2 falhas marcadas!', type: 'crit_fail' });
      onUpdateDeathSaves(successes, newFailures);
      return;
    }

    if (roll >= 10) {
      // Sucesso
      haptic.roll();
      const newSuccesses = Math.min(3, successes + 1);
      setLastRoll({ value: roll, message: `Sucesso (${roll} >= 10)`, type: 'success' });
      onUpdateDeathSaves(newSuccesses, failures);
    } else {
      // Falha
      haptic.damage();
      const newFailures = Math.min(3, failures + 1);
      setLastRoll({ value: roll, message: `Falha (${roll} < 10)`, type: 'fail' });
      onUpdateDeathSaves(successes, newFailures);
    }
  };

  const handleToggleSlot = (type: 'success' | 'failure', index: number) => {
    haptic.tap();
    if (type === 'success') {
      const newSuccess = successes === index + 1 ? index : index + 1;
      onUpdateDeathSaves(newSuccess, failures);
    } else {
      const newFail = failures === index + 1 ? index : index + 1;
      onUpdateDeathSaves(successes, newFail);
    }
  };

  const handleReset = () => {
    haptic.tap();
    setLastRoll(null);
    onUpdateDeathSaves(0, 0);
  };

  return (
    <div className="bg-gradient-to-b from-red-950/70 to-slate-950 border border-red-800/80 rounded-2xl p-4 shadow-xl select-none flex flex-col gap-3">
      {/* Header Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skull className="w-5 h-5 text-red-400 animate-pulse" />
          <h2 className="text-sm font-black text-red-200 tracking-wide uppercase">
            Testes contra a Morte
          </h2>
        </div>
        <button
          onClick={handleReset}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          title="Resetar Testes"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outcome Alerts */}
      {isDead && (
        <div className="bg-red-950/90 border border-red-700 rounded-xl p-3 text-center animate-bounce">
          <AlertOctagon className="w-6 h-6 text-red-500 mx-auto mb-1" />
          <div className="text-xs font-black text-red-300 uppercase tracking-wider">
            Personagem Morto (3 Falhas)
          </div>
          <div className="text-[11px] text-red-400/80">Necessita magia de ressurreição.</div>
        </div>
      )}

      {isStabilized && !isDead && (
        <div className="bg-emerald-950/90 border border-emerald-700 rounded-xl p-3 text-center">
          <Sparkles className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <div className="text-xs font-black text-emerald-300 uppercase tracking-wider">
            Estabilizado! (3 Sucessos)
          </div>
          <div className="text-[11px] text-emerald-400/80">Inconsciente mas sem risco imediato de morte.</div>
        </div>
      )}

      {/* Interactive Pips */}
      <div className="grid grid-cols-2 gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
        {/* Sucessos */}
        <div>
          <span className="text-[11px] font-bold text-emerald-400 block mb-1.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sucessos
          </span>
          <div className="flex gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={`succ-${idx}`}
                onClick={() => handleToggleSlot('success', idx)}
                className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center active:scale-90 ${
                  idx < successes
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                    : 'bg-slate-900 border-slate-700 text-transparent'
                }`}
              >
                ✓
              </button>
            ))}
          </div>
        </div>

        {/* Falhas */}
        <div>
          <span className="text-[11px] font-bold text-red-400 block mb-1.5 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Falhas
          </span>
          <div className="flex gap-2">
            {[0, 1, 2].map((idx) => (
              <button
                key={`fail-${idx}`}
                onClick={() => handleToggleSlot('failure', idx)}
                className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center active:scale-90 ${
                  idx < failures
                    ? 'bg-red-600 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                    : 'bg-slate-900 border-slate-700 text-transparent'
                }`}
              >
                ✕
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Last Roll Display */}
      {lastRoll && (
        <div
          className={`py-2 px-3 rounded-xl border text-center font-mono text-xs font-bold ${
            lastRoll.type === 'crit'
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : lastRoll.type === 'crit_fail'
              ? 'bg-red-950/90 border-red-500 text-red-200'
              : lastRoll.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
              : 'bg-rose-950/60 border-rose-700 text-rose-300'
          }`}
        >
          {lastRoll.message}
        </div>
      )}

      {/* Big Tactical Roll Button */}
      <button
        onClick={handleRollDeathSave}
        disabled={isDead || isStabilized}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-700 hover:to-rose-600 disabled:opacity-40 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        <Skull className="w-4 h-4" /> Rolar Teste (d20)
      </button>

      {/* Quick Revive / Stabilize Shortcut */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => {
            haptic.heal();
            onRevive(1);
          }}
          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Heart className="w-3.5 h-3.5 text-emerald-400" /> Curar (+1 HP)
        </button>
      </div>
    </div>
  );
};
