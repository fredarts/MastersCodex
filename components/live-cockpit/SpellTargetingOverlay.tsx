'use client';

import React from 'react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { Sparkles, X } from 'lucide-react';

export const SpellTargetingOverlay: React.FC = () => {
  const { 
    activeSpellTargeting, 
    setActiveSpellTargeting, 
    setCasterTokenKey, 
    setSpellTargetPosition 
  } = useLiveCockpit();

  if (!activeSpellTargeting) return null;

  const handleCancel = () => {
    setActiveSpellTargeting(null);
    setCasterTokenKey(null);
    setSpellTargetPosition(null);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#0f141d]/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-md w-full animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Mira de Magia Ativa</div>
        <div className="text-xs font-bold text-slate-100 mt-0.5 truncate">{activeSpellTargeting.name || 'Magia de Área'}</div>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
          Forma: {activeSpellTargeting.shape} | Alcance: {activeSpellTargeting.range}m | Tam: {activeSpellTargeting.size}m
        </p>
      </div>
      <button 
        onClick={handleCancel}
        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
        <span>Cancelar</span>
      </button>
    </div>
  );
};
