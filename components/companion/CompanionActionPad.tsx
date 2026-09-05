'use client';

import React, { useState } from 'react';
import { CharacterSheet, CharacterWeaponAttack, CharacterSpell } from '@/lib/types';
import { Swords, Sparkles, Target, Zap, ShieldCheck, Flame, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';

interface CompanionActionPadProps {
  sheet: CharacterSheet;
  onCastSpell?: (spell: CharacterSpell) => void;
}

interface ActionRollResult {
  title: string;
  type: 'attack' | 'damage';
  roll: number;
  total: number;
  isCrit?: boolean;
  damageType?: string;
}

export const CompanionActionPad: React.FC<CompanionActionPadProps> = ({
  sheet,
  onCastSpell,
}) => {
  const [lastActionRoll, setLastActionRoll] = useState<ActionRollResult | null>(null);

  const attacks = sheet.attacks || [];
  const spells = sheet.spells || [];
  const cantrips = spells.filter((s) => s.level === 0);

  const rollAttack = (atk: CharacterWeaponAttack) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const bonusNum = parseInt(atk.atkBonus?.replace('+', '') || '0', 10) || 0;
    const isCrit = d20 === 20;

    if (isCrit) haptic.critSuccess();
    else if (d20 === 1) haptic.critFail();
    else haptic.roll();

    setLastActionRoll({
      title: `${atk.name} (Ataque)`,
      type: 'attack',
      roll: d20,
      total: d20 + bonusNum,
      isCrit,
    });
  };

  const rollDamage = (atk: CharacterWeaponAttack) => {
    haptic.damage();
    const formula = atk.damage || '1d6';
    const match = formula.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    let total = 0;

    if (match) {
      const count = parseInt(match[1], 10) || 1;
      const sides = parseInt(match[2], 10) || 6;
      const sign = match[3] || '+';
      const mod = parseInt(match[4] || '0', 10) || 0;

      for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
      total = sign === '-' ? total - mod : total + mod;
    } else {
      total = Math.floor(Math.random() * 6) + 1;
    }

    setLastActionRoll({
      title: `${atk.name} (Dano)`,
      type: 'damage',
      roll: total,
      total,
      damageType: atk.type || 'Físico',
    });
  };

  return (
    <div className="flex flex-col gap-3.5 pb-20 select-none">
      {/* Last Action Roll Result Banner */}
      {lastActionRoll && (
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
            lastActionRoll.isCrit
              ? 'bg-amber-950/70 border-amber-500 text-amber-200'
              : lastActionRoll.type === 'attack'
              ? 'bg-sky-950/70 border-sky-600 text-sky-200'
              : 'bg-red-950/70 border-red-600 text-red-200'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
              {lastActionRoll.type === 'attack' ? '🎯 Jogada de Ataque' : '💥 Rolagem de Dano'}
            </span>
            <div className="text-xs font-black truncate">{lastActionRoll.title}</div>
            {lastActionRoll.damageType && (
              <span className="text-[10px] text-red-300">Tipo: {lastActionRoll.damageType}</span>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-black font-mono leading-none">{lastActionRoll.total}</div>
            {lastActionRoll.isCrit && (
              <span className="text-[10px] font-black text-amber-400">CRÍTICO!</span>
            )}
          </div>
        </div>
      )}

      {/* Attacks / Weapons Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" /> Armas & Ataques
          </span>
          <span className="text-[10px] text-slate-500 font-medium">{attacks.length} cadastrado(s)</span>
        </div>

        {attacks.length === 0 ? (
          <div className="text-center py-5 text-xs text-slate-500">
            Nenhum ataque configurado na ficha.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {attacks.map((atk, idx) => (
              <div
                key={atk.id || `atk-${idx}`}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate">{atk.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {atk.damage || '1d6'} {atk.type ? `(${atk.type})` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => rollAttack(atk)}
                    className="py-1.5 px-2.5 rounded-lg bg-sky-950/80 hover:bg-sky-900/80 border border-sky-700/80 text-sky-200 text-xs font-bold active:scale-90 transition-transform flex items-center gap-1"
                  >
                    <Target className="w-3 h-3 text-sky-400" />
                    <span>{atk.atkBonus || '+0'}</span>
                  </button>
                  <button
                    onClick={() => rollDamage(atk)}
                    className="py-1.5 px-2.5 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-700/80 text-red-200 text-xs font-bold active:scale-90 transition-transform flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3 text-red-400" />
                    <span>{atk.damage || 'Dano'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cantrips / Truques Section */}
      {cantrips.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Truques (Sem Gasto de Slot)
            </span>
            <span className="text-[10px] text-slate-500 font-medium">{cantrips.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {cantrips.map((c, idx) => (
              <div
                key={c.id || `cantrip-${idx}`}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-200 truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {c.castingTime || '1 Ação'} • {c.range || '18m'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    haptic.tap();
                    if (onCastSpell) onCastSpell(c);
                  }}
                  className="py-1 px-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] font-bold active:scale-95 transition-transform shrink-0"
                >
                  Conjurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
