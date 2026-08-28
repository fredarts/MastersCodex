'use client';

import React from 'react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { AuraTriggerEvent } from '@/lib/auras/auraTypes';
import { 
  ShieldAlert, 
  Flame, 
  Dices, 
  X, 
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';

interface AuraTriggerModalProps {
  event: AuraTriggerEvent | null;
  onClose: () => void;
  onResolveWithAoEModal: (event: AuraTriggerEvent) => void;
}

export const AuraTriggerModal: React.FC<AuraTriggerModalProps> = ({
  event,
  onClose,
  onResolveWithAoEModal,
}) => {
  if (!event) return null;

  const { aura, targetCombatantName, triggerType } = event;
  const isHostile = aura.action.type === 'saving_throw' || aura.action.type === 'apply_damage';

  return (
    <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-[#0f141d]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl w-96 text-slate-100 overflow-hidden relative">
        {/* Glow de fundo */}
        <div 
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20"
          style={{ backgroundColor: aura.visual.colorHex || '#f59e0b' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-400 border border-amber-500/30"
              style={{ backgroundColor: `${aura.visual.colorHex}20` }}
            >
              {isHostile ? <Flame className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Gatilho de Aura Reativa</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 truncate max-w-[200px]">
                {aura.name}
              </h4>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Fechar Notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Descrição do Evento */}
        <div className="py-3 text-xs text-slate-300 space-y-1.5">
          <p>
            <span className="font-bold text-amber-300">{targetCombatantName}</span>{' '}
            {triggerType === 'ENTER' ? 'entrou no raio de' : 'iniciou o turno na aura de'}{' '}
            <span className="font-bold text-slate-100">{aura.sourceCombatantName}</span>{' '}
            ({aura.radiusFt} ft).
          </p>

          {aura.action.type === 'saving_throw' && (
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-400">Exige Salvaguarda:</span>
              <span className="text-amber-400 font-bold">
                {aura.action.saveAbility} Save ({aura.action.damageFormula} {aura.action.damageType})
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Ignorar
          </button>

          {isHostile ? (
            <button
              onClick={() => onResolveWithAoEModal(event)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Rolar Save</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Aplicar Buff</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
