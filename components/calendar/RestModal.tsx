'use client';

import React, { useState } from 'react';
import { 
  X, 
  Coffee, 
  Bed, 
  Moon, 
  Sun, 
  ShieldAlert, 
  Utensils, 
  Sparkles, 
  Clock, 
  Check, 
  Flame,
  Heart
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { useCampaign } from '@/lib/hooks/useCampaign';

export const RestModal: React.FC = () => {
  const { 
    isRestModalOpen, 
    setIsRestModalOpen, 
    currentDateTime, 
    performRest 
  } = useCampaignCalendar();
  const { activeCampaign } = useCampaign();

  const [restType, setRestType] = useState<'short' | 'long'>('long');
  const [customHours, setCustomHours] = useState<number>(8);
  const [consumeRations, setConsumeRations] = useState<boolean>(true);
  const [campSafety, setCampSafety] = useState<'safe' | 'wilderness' | 'dungeon'>('safe');
  const [encounterRolled, setEncounterRolled] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isRestModalOpen) return null;

  const partyCount = activeCampaign?.partyMembers?.length || 4;

  const handleRestTypeChange = (type: 'short' | 'long') => {
    setRestType(type);
    setCustomHours(type === 'short' ? 1 : 8);
  };

  const handleRollNightEncounter = () => {
    // 1d20 check: em masmorras, 16+ é encontro. Em ermos, 18+.
    const roll = Math.floor(Math.random() * 20) + 1;
    const threshold = campSafety === 'dungeon' ? 15 : campSafety === 'wilderness' ? 18 : 99;
    setEncounterRolled(roll >= threshold);
  };

  const handleConfirmRest = async () => {
    setIsProcessing(true);
    try {
      await performRest(restType, customHours, consumeRations);
      setIsRestModalOpen(false);
      setEncounterRolled(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f141d] border border-[#2a3449] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3449] bg-[#121824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Descanso & Acampamento da Party
              </h2>
              <p className="text-xs text-slate-400">
                Data Atual In-Game: <span className="text-amber-300 font-medium">{currentDateTime.formattedFull}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRestModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Rest Type Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleRestTypeChange('short')}
              className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all text-left ${
                restType === 'short'
                  ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 shadow-md'
                  : 'bg-[#161d2a] border-[#2a3449] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Coffee className={`w-5 h-5 ${restType === 'short' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  1 Hora
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Descanso Curto</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gasto de Dados de Vida (Hit Dice), recuperação de magias de Bruxo, Ação Evasiva e fôlego.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRestTypeChange('long')}
              className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all text-left ${
                restType === 'long'
                  ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 shadow-md'
                  : 'bg-[#161d2a] border-[#2a3449] text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <Bed className={`w-5 h-5 ${restType === 'long' ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  8 Horas
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Descanso Longo</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Restauração total de Pontos de Vida, slots de magia e metade dos Dados de Vida máximos.
                </p>
              </div>
            </button>
          </div>

          {/* Rest Duration & Rations */}
          <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Duração do Descanso (Horas)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={customHours}
                  onChange={(e) => setCustomHours(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1 text-center font-mono font-bold text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                />
                <span className="text-xs text-slate-400">horas</span>
              </div>
            </div>

            {restType === 'long' && (
              <div className="pt-2 border-t border-[#2a3449] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Consumo de Rações da Party</p>
                    <p className="text-[11px] text-slate-400">
                      Deduz 1 ração diária por membro ({partyCount} membros)
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={consumeRations}
                  onChange={(e) => setConsumeRations(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Camp Safety & Ambush Checker */}
          <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-xl space-y-3">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Ambiente do Acampamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setCampSafety('safe'); setEncounterRolled(null); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  campSafety === 'safe'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ Taverna / Seguro
              </button>
              <button
                onClick={() => { setCampSafety('wilderness'); setEncounterRolled(null); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  campSafety === 'wilderness'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                🌲 Ermos / Floresta
              </button>
              <button
                onClick={() => { setCampSafety('dungeon'); setEncounterRolled(null); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  campSafety === 'dungeon'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                    : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                💀 Masmorra / Inimigo
              </button>
            </div>

            {campSafety !== 'safe' && (
              <div className="pt-2 border-t border-[#2a3449] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRollNightEncounter}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition-colors"
                >
                  🎲 Testar Encontro Noturno (d20)
                </button>
                {encounterRolled !== null && (
                  <span className={`text-xs font-bold ${encounterRolled ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {encounterRolled ? '⚠️ Emboscada Inimiga!' : '✅ Noite Tranquila'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a3449] bg-[#121824]">
          <button
            onClick={() => setIsRestModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmRest}
            disabled={isProcessing}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'Processando...' : `Concluir ${restType === 'short' ? 'Descanso Curto' : 'Descanso Longo'}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
