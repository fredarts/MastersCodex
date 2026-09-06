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

          // Resolve avatar image
          const sheet = characterSheets.find(s => {
            const cClean = c.name.split('(')[0].trim().toLowerCase();
            return s.characterName.toLowerCase() === cClean || 
                   s.characterName.toLowerCase().includes(cClean) || 
                   cClean.includes(s.characterName.toLowerCase());
          });
          const avatarUrl = c.avatarUrl || c.tokenImageUrl || c.portraitUrl || sheet?.avatarUrl;

          return (
            <CombatTurnOrderItem
              key={c.id || `${c.name}-${idx}`}
              c={c}
              idx={idx}
              isActive={isActive}
              isPlayer={isPlayer}
              avatarUrl={avatarUrl}
              sheet={sheet}
              getSpeedInMeters={getSpeedInMeters}
              onUpdateHp={onUpdateHp}
              onRemoveCombatant={onRemoveCombatant}
            />
          );
        })}
      </div>
    </div>
  );
};

interface CombatTurnOrderItemProps {
  c: Combatant;
  idx: number;
  isActive: boolean;
  isPlayer: boolean;
  avatarUrl?: string;
  sheet?: any;
  getSpeedInMeters: (speedStr?: string) => number;
  onUpdateHp: (id: string, delta: number) => void;
  onRemoveCombatant: (id: string) => void;
}

const CombatTurnOrderItem: React.FC<CombatTurnOrderItemProps> = ({
  c,
  isActive,
  isPlayer,
  avatarUrl,
  sheet,
  getSpeedInMeters,
  onUpdateHp,
  onRemoveCombatant,
}) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const [imgErr, setImgErr] = React.useState(false);

  React.useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActive]);

  const maxSpeed = getSpeedInMeters(sheet?.speed || c.notes) * (c.hasDashed ? 2 : 1);
  const rem = Math.max(0, maxSpeed - (c.movementUsed || 0));

  return (
    <div
      ref={itemRef}
      className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-all ${
        isActive
          ? 'bg-amber-500/15 border-amber-500 text-slate-100 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-1 ring-amber-500/50'
          : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
          {avatarUrl && !imgErr ? (
            <img
              src={avatarUrl}
              alt={c.name}
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[9px] font-bold text-slate-400">
              {c.name.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {(() => {
              const baseMod = c.initiativeBonus !== undefined
                ? c.initiativeBonus
                : c.dex !== undefined
                ? Math.floor((c.dex - 10) / 2)
                : 0;
              const baseModStr = baseMod >= 0 ? `+${baseMod}` : `${baseMod}`;
              const rawD20 = c.initiativeRoll !== undefined ? c.initiativeRoll : Math.max(1, Math.min(20, (c.initiative || 0) - baseMod));
              return (
                <span
                  className="text-[10px] font-mono font-bold text-amber-400 shrink-0 bg-black/40 px-1 py-0.2 rounded border border-amber-500/30"
                  title={`Iniciativa Total: ${c.initiative ?? '-'} (Dado: ${rawD20} | Base: ${baseModStr})`}
                >
                  #{c.initiative ?? '-'}{' '}
                  <span className="text-[8px] text-amber-300/70 font-normal">({baseModStr})</span>
                </span>
              );
            })()}
            <span className={`truncate ${isPlayer ? 'text-sky-400 font-bold' : 'text-rose-400'}`}>{c.name}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
            <span className={c.actionUsed ? 'text-slate-600' : 'text-emerald-400'} title="Ação">A</span>
            <span className={c.bonusActionUsed ? 'text-slate-600' : 'text-cyan-400'} title="Ação Bônus">B</span>
            <span className={c.reactionUsed ? 'text-slate-600' : 'text-amber-400'} title="Reação">R</span>
            <span className="text-slate-500 ml-1">{rem.toFixed(1)}m</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 font-bold font-mono">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
          <span>{c.hp}/{c.maxHp}</span>
          <div className="flex items-center gap-0.5 ml-1">
            <button
              onClick={() => onUpdateHp(c.id, -1)}
              className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded flex items-center justify-center font-bold cursor-pointer"
            >
              -
            </button>
            <button
              onClick={() => onUpdateHp(c.id, 1)}
              className="w-4 h-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded flex items-center justify-center font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() => onRemoveCombatant(c.id)}
          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
          title="Remover combatente"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

