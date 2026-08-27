'use client';

import React, { useEffect } from 'react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { Sparkles, X, RotateCcw, RotateCw, Dices, ShieldAlert, Target } from 'lucide-react';
import { getSpellAoEDefinition } from '@/lib/dnd5e-spells-shapes';

export const SpellTargetingOverlay: React.FC = () => {
  const { 
    activeSpellTargeting, 
    setActiveSpellTargeting, 
    setCasterTokenKey, 
    setSpellTargetPosition,
    aoeRotation,
    setAoeRotation,
    detectedAoETargets,
    setIsAoESaveModalOpen,
  } = useLiveCockpit();

  // Atalhos de teclado Q/E para girar cone/linha
  useEffect(() => {
    if (!activeSpellTargeting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        setAoeRotation((prev) => (prev - 15 + 360) % 360);
      } else if (e.key === 'e' || e.key === 'E') {
        setAoeRotation((prev) => (prev + 15) % 360);
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSpellTargeting, setAoeRotation]);

  if (!activeSpellTargeting) return null;

  const spellInfo = getSpellAoEDefinition(activeSpellTargeting.name || '');
  const hasRotation = activeSpellTargeting.shape === 'cone' || activeSpellTargeting.shape === 'line' || activeSpellTargeting.shape === 'fan';

  const handleCancel = () => {
    setActiveSpellTargeting(null);
    setCasterTokenKey(null);
    setSpellTargetPosition(null);
  };

  const handleConfirmCasting = () => {
    setIsAoESaveModalOpen(true);
  };

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-[#0c1017]/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center gap-4 max-w-xl w-[92vw] animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto ring-1 ring-amber-500/20">
      {/* Ícone de Magia / Conjurador */}
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
        <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
      </div>

      {/* Detalhes da Magia & Alvos */}
      <div className="flex-1 min-w-0 text-left w-full sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
            MIRA DE ÁREA DE EFEITO (AoE)
          </span>
          {spellInfo.saveAbility && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Save: {spellInfo.saveAbility}
            </span>
          )}
          {spellInfo.requiresConcentration && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Concentração
            </span>
          )}
        </div>

        <div className="text-sm font-bold text-slate-100 mt-0.5 truncate flex items-center gap-2">
          <span>{activeSpellTargeting.name || 'Magia de Área'}</span>
          <span className="text-xs font-normal text-slate-400">
            ({spellInfo.damageFormula || 'Dano Varia'} {spellInfo.damageType || ''})
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
          <span>Forma: <strong className="text-slate-200 uppercase">{activeSpellTargeting.shape}</strong></span>
          <span>Tam: <strong className="text-slate-200">{activeSpellTargeting.size}m</strong></span>
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Target className="w-3.5 h-3.5" />
            {detectedAoETargets.length} {detectedAoETargets.length === 1 ? 'alvo pego' : 'alvos pegos'}
          </span>
        </div>
      </div>

      {/* Controles de Rotação (para Cones e Linhas) */}
      {hasRotation && (
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setAoeRotation((prev) => (prev - 15 + 360) % 360)}
            title="Girar Esquerda (Q)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-300 px-1 min-w-[32px] text-center font-bold">
            {Math.round(aoeRotation)}°
          </span>
          <button
            onClick={() => setAoeRotation((prev) => (prev + 15) % 360)}
            title="Girar Direita (E)"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        <button 
          onClick={handleConfirmCasting}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-amber-900/30 cursor-pointer active:scale-95"
        >
          <Dices className="w-4 h-4" />
          <span>Rolar Saves ({detectedAoETargets.length})</span>
        </button>

        <button 
          onClick={handleCancel}
          title="Cancelar Conjuração (Esc)"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
