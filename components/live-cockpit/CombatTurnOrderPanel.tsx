'use client';

import React from 'react';
import { Combatant } from '@/lib/types';
import { Swords, Shield, Heart, ChevronRight, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface CombatTurnOrderPanelProps {
  combatants: Combatant[];
  currentTurnIndex: number;
  roundCount: number;
  onNextTurn: () => void;
  onPreviousTurn: () => void;
  onOpenAddCombatant: () => void;
  onRemoveCombatant: (id: string) => void;
  onUpdateHp: (id: string, delta: number) => void;
  characterSheets?: any[];
}

const getSpeedInMeters = (speedStr?: string): number => {
  if (!speedStr) return 9; // 30 ft = 9m
  const cleaned = speedStr.toLowerCase().replace(/[^0-9\.]/g, '');
  const val = parseFloat(cleaned);
  if (isNaN(val)) return 9;
  if (speedStr.toLowerCase().includes('ft') || speedStr.toLowerCase().includes('pe')) {
    return val * 0.3; // converter pés para metros
  }
  return val;
};

export const CombatTurnOrderPanel: React.FC<CombatTurnOrderPanelProps> = ({
  combatants,
  currentTurnIndex,
  roundCount,
  onNextTurn,
  onPreviousTurn,
  onOpenAddCombatant,
  onRemoveCombatant,
  onUpdateHp,
  characterSheets = [],
}) => {
  const activeCombatant = combatants[currentTurnIndex];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Ordem de Combate (Rodada {roundCount})
          </h3>
        </div>
        <button
          onClick={onOpenAddCombatant}
          className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded border border-rose-500/30 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar
        </button>
      </div>

      {/* Turn Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
        <button
          onClick={onPreviousTurn}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
          title="Turno Anterior"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Vez de Agir:</span>
          <span className="text-xs font-bold text-amber-400">{activeCombatant?.name || 'Ninguém em combate'}</span>
        </div>

        <button
          onClick={onNextTurn}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded flex items-center gap-1 transition-colors"
        >
          Próximo <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Combatant List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {combatants.map((c, idx) => {
          const isActive = idx === currentTurnIndex;
          const isPlayer = c.type === 'player';
          return (
            <div
              key={c.id || `${c.name}-${idx}`}
              className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500 text-slate-100 font-semibold'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-slate-500">{c.initiative ?? '-'}</span>
                  <span className={isPlayer ? 'text-sky-400 font-bold' : 'text-rose-400'}>{c.name}</span>
                </div>
                
                <div className="flex items-center gap-1.5 ml-7 text-[9px] font-mono font-bold">
                  <span className={c.actionUsed ? 'text-slate-600' : 'text-emerald-400'} title="Ação">A</span>
                  <span className={c.bonusActionUsed ? 'text-slate-600' : 'text-cyan-400'} title="Ação Bônus">B</span>
                  <span className={c.reactionUsed ? 'text-slate-600' : 'text-amber-400'} title="Reação">R</span>
                  <span className="text-slate-500 ml-1">
                    {(() => {
                      const sheet = characterSheets.find(s => {
                        const cClean = c.name.split('(')[0].trim().toLowerCase();
                        return s.characterName.toLowerCase() === cClean || 
                               s.characterName.toLowerCase().includes(cClean) || 
                               cClean.includes(s.characterName.toLowerCase());
                      });
                      const maxSpeed = getSpeedInMeters(sheet?.speed || c.notes) * (c.hasDashed ? 2 : 1);
                      const rem = Math.max(0, maxSpeed - (c.movementUsed || 0));
                      return `${rem.toFixed(1)}m`;
                    })()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 font-bold">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                  <span>{c.hp} / {c.maxHp}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    <button
                      onClick={() => onUpdateHp(c.id, -1)}
                      className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => onUpdateHp(c.id, 1)}
                      className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveCombatant(c.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Remover combatente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
