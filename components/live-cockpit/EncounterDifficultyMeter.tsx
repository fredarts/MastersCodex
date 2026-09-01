'use client';

import React, { useState } from 'react';
import {
  Skull,
  Flame,
  Swords,
  Shield,
  Sparkles,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Zap,
  X,
} from 'lucide-react';
import {
  EncounterDifficultyResult,
  calculateEncounterDifficulty,
} from '@/lib/dnd5e-encounter-calculator';

interface EncounterDifficultyMeterProps {
  party: { level?: number }[];
  monsters: { id?: string; cr?: string | number; xp?: number; name?: string }[];
  onPartyOverrideChange?: (customParty: { level: number }[]) => void;
  onRemoveMonster?: (id: string) => void;
}

export const EncounterDifficultyMeter: React.FC<EncounterDifficultyMeterProps> = ({
  party,
  monsters,
  onPartyOverrideChange,
  onRemoveMonster,
}) => {
  const [isPartyConfigOpen, setIsPartyConfigOpen] = useState(false);
  const [isMonsterListOpen, setIsMonsterListOpen] = useState(false);
  const [customPartySize, setCustomPartySize] = useState<number | null>(null);
  const [customAvgLevel, setCustomAvgLevel] = useState<number | null>(null);

  // Computa a party ativa (real ou com override do mestre)
  const activeParty = React.useMemo(() => {
    if (customPartySize !== null && customAvgLevel !== null) {
      return Array.from({ length: Math.max(1, customPartySize) }, () => ({
        level: Math.max(1, Math.min(20, customAvgLevel)),
      }));
    }
    return party.length > 0 ? party : [{ level: 1 }, { level: 1 }, { level: 1 }, { level: 1 }];
  }, [party, customPartySize, customAvgLevel]);

  const result: EncounterDifficultyResult = React.useMemo(() => {
    return calculateEncounterDifficulty(activeParty, monsters);
  }, [activeParty, monsters]);

  const getDifficultyIcon = () => {
    switch (result.difficulty) {
      case 'deadly':
        return <Skull className="w-4 h-4 text-rose-400 animate-pulse" />;
      case 'hard':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'medium':
        return <Swords className="w-4 h-4 text-amber-400" />;
      case 'easy':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'trivial':
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getDifficultyBadgeStyle = () => {
    switch (result.difficulty) {
      case 'deadly':
        return 'bg-rose-950/80 border-rose-600/70 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.3)]';
      case 'hard':
        return 'bg-orange-950/80 border-orange-600/70 text-orange-300 shadow-[0_0_15px_rgba(234,88,12,0.3)]';
      case 'medium':
        return 'bg-amber-950/80 border-amber-600/70 text-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.3)]';
      case 'easy':
        return 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
      case 'trivial':
      default:
        return 'bg-slate-900/80 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-xl text-slate-200 space-y-2 select-none flex-shrink-0">
      
      {/* Top Header: Difficulty Badge + Party/Monster Info */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        
        {/* Difficulty Pill */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-black uppercase tracking-wider font-serif border ${getDifficultyBadgeStyle()}`}
          >
            {getDifficultyIcon()}
            <span>Encontro {result.difficultyLabel}</span>
          </div>

          {result.monsterCount > 0 && (
            <button
              type="button"
              onClick={() => setIsMonsterListOpen(!isMonsterListOpen)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                isMonsterListOpen
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700 shadow-sm'
                  : 'text-slate-300 bg-slate-900/80 hover:bg-slate-800 border-slate-700'
              }`}
              title="Clique para ver ou remover monstros do campo de batalha"
            >
              <span>👹 {result.monsterCount} {result.monsterCount === 1 ? 'Monstro' : 'Monstros'} ({result.multiplier}x)</span>
              {isMonsterListOpen ? <ChevronUp className="w-2.5 h-2.5 text-rose-400" /> : <ChevronDown className="w-2.5 h-2.5 text-slate-400" />}
            </button>
          )}
        </div>

        {/* Party Info & Override Trigger */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPartyConfigOpen(!isPartyConfigOpen)}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 rounded-xl text-[10px] font-mono text-slate-300 transition-all cursor-pointer"
            title="Ajustar tamanho e nível do grupo para simulação"
          >
            <Users className="w-3 h-3 text-indigo-400" />
            <span>
              {result.partySize} PCs (Nv {result.avgPartyLevel})
            </span>
            {isPartyConfigOpen ? <ChevronUp className="w-2.5 h-2.5 text-slate-500" /> : <ChevronDown className="w-2.5 h-2.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Monsters List Dropdown (Collapsible) */}
      {isMonsterListOpen && monsters.length > 0 && (
        <div className="p-2 bg-[#121829] border border-rose-500/30 rounded-xl space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-rose-300 flex items-center gap-1">
              <Swords className="w-3 h-3 text-rose-400" /> Monstros no Encontro ({monsters.length}):
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              Total XP: {monsters.reduce((acc, m) => acc + (m.xp || 0), 0).toLocaleString()} XP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {monsters.map((m, idx) => (
              <div
                key={m.id || `${m.name}-${idx}`}
                className="flex items-center justify-between gap-1.5 px-2 py-0.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-semibold text-slate-200 truncate max-w-[110px] text-[11px]" title={m.name}>
                    {m.name || `Monstro #${idx + 1}`}
                  </span>
                  <span className="text-[9px] font-mono text-rose-400 bg-rose-950/40 px-1 py-0.2 rounded border border-rose-900/50 shrink-0">
                    CR {m.cr || '?'}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] font-mono text-slate-400">
                    {(m.xp || 0).toLocaleString()} XP
                  </span>
                  {onRemoveMonster && m.id && (
                    <button
                      type="button"
                      onClick={() => onRemoveMonster(m.id!)}
                      className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors cursor-pointer"
                      title="Remover do campo de batalha"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Party Config Overrides (Collapsible) */}
      {isPartyConfigOpen && (
        <div className="p-2 bg-[#121829] border border-indigo-500/30 rounded-xl space-y-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-indigo-300 flex items-center gap-1">
              <Zap className="w-3 h-3 text-indigo-400" /> Simular Grupo (Party):
            </span>
            {(customPartySize !== null || customAvgLevel !== null) && (
              <button
                type="button"
                onClick={() => {
                  setCustomPartySize(null);
                  setCustomAvgLevel(null);
                }}
                className="text-[9px] text-amber-400 hover:underline cursor-pointer"
              >
                Resetar para Grupo Real
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Nº de Jogadores:</label>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCustomPartySize(Math.max(1, (customPartySize ?? result.partySize) - 1))}
                  className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-white flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono font-bold text-[11px] text-white">
                  {customPartySize ?? result.partySize}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomPartySize(Math.min(10, (customPartySize ?? result.partySize) + 1))}
                  className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-white flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Nível Médio:</label>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setCustomAvgLevel(Math.max(1, (customAvgLevel ?? result.avgPartyLevel) - 1))}
                  className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-white flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono font-bold text-[11px] text-white">
                  Nv {customAvgLevel ?? result.avgPartyLevel}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomAvgLevel(Math.min(20, (customAvgLevel ?? result.avgPartyLevel) + 1))}
                  className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-bold text-white flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Difficulty Gauge / Progress Bar */}
      <div className="space-y-1">
        <div className="relative h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden flex shadow-inner">
          {/* Segment 1: Trivial (0-25%) */}
          <div className="w-1/4 h-full bg-cyan-950/60 border-r border-cyan-800/40" title="Trivial" />
          {/* Segment 2: Fácil (25-50%) */}
          <div className="w-1/4 h-full bg-emerald-950/60 border-r border-emerald-800/40" title="Fácil" />
          {/* Segment 3: Médio (50-75%) */}
          <div className="w-1/4 h-full bg-amber-950/60 border-r border-amber-800/40" title="Médio" />
          {/* Segment 4: Difícil / Mortal (75-100%) */}
          <div className="w-1/4 h-full bg-rose-950/60" title="Difícil / Mortal" />

          {/* Active Progress Fill */}
          <div
            className={`absolute top-0 left-0 bottom-0 transition-all duration-500 rounded-full ${
              result.difficulty === 'deadly'
                ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]'
                : result.difficulty === 'hard'
                ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                : result.difficulty === 'medium'
                ? 'bg-gradient-to-r from-emerald-500 to-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                : result.difficulty === 'easy'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                : 'bg-cyan-500/80 shadow-[0_0_4px_rgba(6,182,212,0.6)]'
            }`}
            style={{ width: `${Math.max(3, result.gaugePercentage)}%` }}
          />
        </div>

        {/* Threshold Labels under the bar */}
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 px-0.5">
          <span className="text-cyan-400 font-semibold">Trivial (0)</span>
          <span className="text-emerald-400 font-semibold">Fácil ({result.partyThresholds.easy.toLocaleString()})</span>
          <span className="text-amber-400 font-semibold">Médio ({result.partyThresholds.medium.toLocaleString()})</span>
          <span className="text-orange-400 font-semibold">Difícil ({result.partyThresholds.hard.toLocaleString()})</span>
          <span className="text-rose-400 font-semibold">Mortal ({result.partyThresholds.deadly.toLocaleString()})</span>
        </div>
      </div>

      {/* Metrics Row: XP Ajustado vs XP Recompensa */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
        <div className="bg-[#121726] p-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1 text-[9.5px]">
            <Zap className="w-3 h-3 text-amber-400" /> Ajustado:
          </span>
          <strong className="text-white text-[11px] font-bold">
            {result.totalAdjustedXp.toLocaleString()} XP
          </strong>
        </div>

        <div className="bg-[#121726] p-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1 text-[9.5px]">
            <Award className="w-3 h-3 text-emerald-400" /> Recompensa:
          </span>
          <strong className="text-emerald-300 text-[11px] font-bold" title={`${result.xpPerPlayer.toLocaleString()} XP por jogador`}>
            {result.totalRawXp.toLocaleString()} XP <span className="text-[8px] text-slate-400 font-normal">({result.xpPerPlayer.toLocaleString()}/PC)</span>
          </strong>
        </div>
      </div>

    </div>
  );
};
