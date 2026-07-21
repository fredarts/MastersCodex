'use client';

import React from 'react';
import { 
  Swords, 
  RotateCcw, 
  ChevronRight, 
  Plus, 
  Heart, 
  Shield, 
  Skull, 
  Coins 
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
  onGenerateLoot: () => void;
}

export const CombatInitiativeTracker: React.FC<CombatInitiativeTrackerProps> = ({
  combatants,
  setCombatants,
  currentTurnIndex,
  setCurrentTurnIndex,
  roundCount,
  setRoundCount,
  onOpenAddModal,
  onGenerateLoot,
}) => {
  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex >= combatants.length - 1) {
      setCurrentTurnIndex(0);
      setRoundCount((prev) => prev + 1);
    } else {
      setCurrentTurnIndex((prev) => prev + 1);
    }
  };

  const handlePrevTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex === 0) {
      setCurrentTurnIndex(combatants.length - 1);
      setRoundCount((prev) => Math.max(1, prev - 1));
    } else {
      setCurrentTurnIndex((prev) => prev - 1);
    }
  };

  const handleUpdateHp = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => (c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) } : c))
    );
  };

  const handleRemoveCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggleCondition = (combatantId: string, condition: ConditionType) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === combatantId) {
          const has = c.conditions.includes(condition);
          const next = has ? c.conditions.filter((cond) => cond !== condition) : [...c.conditions, condition];
          return { ...c, conditions: next };
        }
        return c;
      })
    );
  };

  return (
    <div className="w-80 bg-[#0f141d] border-l border-[#2a3449] flex flex-col h-full select-none">
      {/* Tracker Header */}
      <div className="p-3 border-b border-[#2a3449] bg-[#161c28] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-rose-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Rastreador de Combate</h3>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
          Rodada {roundCount}
        </span>
      </div>

      {/* Action Controls */}
      <div className="p-2 border-b border-[#2a3449] bg-[#090d16] flex items-center gap-2">
        <button
          onClick={handlePrevTurn}
          className="p-1.5 rounded bg-[#161c28] text-slate-300 hover:text-slate-100 border border-[#2a3449]"
          title="Turno Anterior"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleNextTurn}
          className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded flex items-center justify-center gap-1 shadow-md transition-all"
        >
          Próximo Turno
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenAddModal}
          className="p-1.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/40"
          title="Adicionar Combatente"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Combatants List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {combatants.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhum combatente ativo. Clique em "+" para adicionar monstros ou personagens!
          </div>
        ) : (
          combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const isDead = c.hp === 0;

            return (
              <div
                key={c.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isTurn
                    ? 'bg-[#1e2638] border-amber-500/70 shadow-lg ring-1 ring-amber-500/30'
                    : isDead
                    ? 'bg-[#11141c]/60 border-[#2a3449]/40 opacity-60'
                    : 'bg-[#141923] border-[#2a3449] hover:border-slate-600'
                }`}
              >
                {/* Top Row: Name, Type, Initiative & Delete */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        c.type === 'player' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {c.initiative}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 truncate">{c.name}</h4>
                  </div>
                  <button
                    onClick={() => handleRemoveCombatant(c.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Remover Combatente"
                  >
                    <Skull className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* HP & AC Controls */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-[#0a0d14] px-2 py-1 rounded border border-[#2a3449]">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span className="font-mono text-[11px] font-bold text-slate-200">
                      {c.hp}/{c.maxHp}
                    </span>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleUpdateHp(c.id, -1)}
                        className="w-4 h-4 rounded bg-rose-950/80 hover:bg-rose-800 text-rose-300 font-bold flex items-center justify-center text-[10px]"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleUpdateHp(c.id, 1)}
                        className="w-4 h-4 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 font-bold flex items-center justify-center text-[10px]"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-[#0a0d14] px-2 py-1 rounded border border-[#2a3449]">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono text-[11px] font-bold text-slate-200">CA {c.ac}</span>
                  </div>
                </div>

                {/* Conditions Tags */}
                {c.conditions && c.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.conditions.map((cond) => (
                      <span
                        key={cond}
                        onClick={() => handleToggleCondition(c.id, cond as ConditionType)}
                        className="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 cursor-pointer hover:bg-rose-500/30"
                      >
                        {cond} ✕
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Generate Loot Footer */}
      <div className="p-2 border-t border-[#2a3449] bg-[#111622]">
        <button
          onClick={onGenerateLoot}
          className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Coins className="w-4 h-4 text-amber-400" />
          Gerar Loot do Combate
        </button>
      </div>
    </div>
  );
};
