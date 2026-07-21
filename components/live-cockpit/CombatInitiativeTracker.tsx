'use client';

import React, { useState } from 'react';
import { 
  Swords, 
  RotateCcw, 
  ChevronRight, 
  Plus, 
  Shield, 
  Heart, 
  Skull, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';
import { Combatant, ConditionType } from '@/lib/types';
import { CONDITIONS } from '@/lib/srd-data';

interface CombatInitiativeTrackerProps {
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  currentTurnIndex: number;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  roundCount: number;
  setRoundCount: React.Dispatch<React.SetStateAction<number>>;
  onOpenAddModal: () => void;
}

export const CombatInitiativeTracker: React.FC<CombatInitiativeTrackerProps> = ({
  combatants,
  setCombatants,
  currentTurnIndex,
  setCurrentTurnIndex,
  roundCount,
  setRoundCount,
  onOpenAddModal,
}) => {
  const [hpInput, setHpInput] = useState<Record<string, string>>({});
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  const nextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex + 1 >= combatants.length) {
      setCurrentTurnIndex(0);
      setRoundCount((r) => r + 1);
    } else {
      setCurrentTurnIndex((prev) => prev + 1);
    }
  };

  const handleRollAllInitiatives = () => {
    setCombatants((prev) =>
      prev
        .map((c) => ({
          ...c,
          initiative: Math.floor(Math.random() * 20) + 1,
        }))
        .sort((a, b) => b.initiative - a.initiative)
    );
    setCurrentTurnIndex(0);
  };

  const handleApplyHpDelta = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
          return { ...c, hp: newHp };
        }
        return c;
      })
    );
  };

  const handleCustomHpSubmit = (id: string, isDamage: boolean) => {
    const val = parseInt(hpInput[id] || '0', 10);
    if (isNaN(val) || val <= 0) return;
    handleApplyHpDelta(id, isDamage ? -val : val);
    setHpInput((prev) => ({ ...prev, [id]: '' }));
  };

  const toggleCondition = (combatantId: string, cond: ConditionType) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          const exists = c.conditions?.includes(cond);
          const nextConds = exists
            ? (c.conditions || []).filter((x) => x !== cond)
            : [...(c.conditions || []), cond];
          return { ...c, conditions: nextConds };
        }
        return c;
      })
    );
  };

  const activeCombatant = combatants[currentTurnIndex];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-4 shadow-xl backdrop-blur-md">
      {/* Header Combate */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-sm text-zinc-100">Roda de Iniciativa</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Rodada {roundCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRollAllInitiatives}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            title="Rolar iniciativa para todos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors shadow-md shadow-rose-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> Combatente
          </button>
        </div>
      </div>

      {/* Rotação de Turno */}
      {combatants.length > 0 && (
        <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Vez do Personagem</div>
              <div className="font-bold text-sm text-amber-300">{activeCombatant?.name}</div>
            </div>
          </div>

          <button
            onClick={nextTurn}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
          >
            Próximo Turno <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lista de Combatentes */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {combatants.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs italic">
            Nenhum combatente ativo. Clique em "+ Combatente" para iniciar a batalha!
          </div>
        ) : (
          combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const hpPct = Math.max(0, Math.min(100, Math.round((c.hp / c.maxHp) * 100)));

            return (
              <div
                key={c.id}
                className={`p-3 rounded-xl border transition-all ${
                  isTurn
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                    : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                        isTurn ? 'bg-amber-500 text-zinc-950 font-extrabold' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {c.initiative}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-100 truncate">{c.name}</span>
                        {c.type === 'player' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 font-semibold">
                            PC
                          </span>
                        )}
                        {c.hp <= 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-bold">
                            <Skull className="w-3 h-3" /> Caído
                          </span>
                        )}
                      </div>

                      {/* Barra de PV */}
                      <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full transition-all duration-300 ${
                            hpPct > 50 ? 'bg-emerald-500' : hpPct > 20 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Controles de Dano / Cura Rápida */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApplyHpDelta(c.id, -5)}
                      className="px-1.5 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-mono rounded font-bold"
                      title="-5 PV"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleApplyHpDelta(c.id, 5)}
                      className="px-1.5 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono rounded font-bold"
                      title="+5 PV"
                    >
                      +5
                    </button>
                    <span className="text-xs font-mono text-zinc-300 ml-1">
                      {c.hp}/{c.maxHp}
                    </span>
                  </div>
                </div>

                {/* Condições de Status */}
                {c.conditions && c.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-zinc-800/40">
                    {c.conditions.map((cond) => (
                      <span
                        key={cond}
                        onClick={() => toggleCondition(c.id, cond)}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                      >
                        {cond} ×
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
