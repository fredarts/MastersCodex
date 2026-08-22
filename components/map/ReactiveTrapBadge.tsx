'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, Flame, Skull, Zap, ShieldAlert } from 'lucide-react';
import { ReactiveTrapEffect } from '@/lib/reactive/reactiveTypes';

interface ReactiveTrapBadgeProps {
  trap: ReactiveTrapEffect;
  isDm?: boolean;
  onClick?: () => void;
}

export const ReactiveTrapBadge: React.FC<ReactiveTrapBadgeProps> = ({
  trap,
  isDm = false,
  onClick,
}) => {
  // Hide completely from players if hidden and not DM
  if (!isDm && !trap.revealedToPlayers) {
    return null;
  }

  const getIcon = () => {
    if (!trap.isArmed) return <CheckCircle className="w-3 h-3 text-emerald-400" />;
    if (trap.damageType === 'Fogo') return <Flame className="w-3 h-3 text-amber-500 animate-pulse" />;
    if (trap.damageType === 'Veneno') return <Skull className="w-3 h-3 text-emerald-400" />;
    if (trap.type === 'pressure_plate') return <Zap className="w-3 h-3 text-cyan-400" />;
    return <AlertTriangle className="w-3 h-3 text-rose-500" />;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
        trap.isArmed
          ? trap.revealedToPlayers
            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 hover:bg-rose-900/80 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
            : 'bg-amber-950/60 text-amber-300 border-amber-500/40 border-dashed opacity-75 hover:opacity-100'
          : 'bg-slate-900/80 text-slate-400 border-slate-700'
      }`}
      title={
        isDm
          ? `${trap.name} (${trap.isArmed ? 'Armada' : 'Desarmada'}) - Clique para configurar`
          : trap.name
      }
    >
      {getIcon()}
      <span className="truncate max-w-[80px]">{trap.name}</span>
      {isDm && !trap.revealedToPlayers && (
        <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded font-mono">
          Oculta
        </span>
      )}
    </button>
  );
};
