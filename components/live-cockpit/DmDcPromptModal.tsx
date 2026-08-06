'use client';

import React, { useState } from 'react';
import { Shield, Sparkles, X, Check } from 'lucide-react';

interface DmDcPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDc: (dc: number) => void;
  playerCharacterName?: string;
  checkTitle?: string;
  defaultDc?: number;
}

const PRESET_DCS = [
  { dc: 5, label: 'Muito Fácil (5)', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
  { dc: 10, label: 'Fácil (10)', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10' },
  { dc: 15, label: 'Médio (15)', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
  { dc: 18, label: 'Desafiador (18)', color: 'border-orange-500/40 text-orange-400 bg-orange-500/10' },
  { dc: 20, label: 'Muito Difícil (20)', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
  { dc: 25, label: 'Quase Impossível (25)', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
  { dc: 30, label: 'Lendário (30)', color: 'border-fuchsia-500/40 text-fuchsia-400 bg-fuchsia-500/10' },
  { dc: 99, label: 'Impossível (99)', color: 'border-red-600 text-red-500 bg-red-950/40 font-black' },
];

export const DmDcPromptModal: React.FC<DmDcPromptModalProps> = ({
  isOpen,
  onClose,
  onConfirmDc,
  playerCharacterName = 'Jogador',
  checkTitle = 'Teste de Atributo',
  defaultDc = 15,
}) => {
  const [selectedDc, setSelectedDc] = useState<number>(defaultDc);
  const [customDc, setCustomDc] = useState<string>(defaultDc.toString());

  if (!isOpen) return null;

  const handleSelectPreset = (dc: number) => {
    setSelectedDc(dc);
    setCustomDc(dc.toString());
  };

  const handleCustomChange = (val: string) => {
    setCustomDc(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedDc(num);
    }
  };

  const handleConfirm = () => {
    const finalDc = parseInt(customDc, 10) || selectedDc || 10;
    onConfirmDc(finalDc);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f141d] border-2 border-amber-500/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Header filigree styling */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#171f2e] via-[#202b3f] to-[#171f2e] border-b border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 font-serif">
            <Shield className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Definir Classe de Dificuldade (CD/DC)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-center">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400/80 uppercase tracking-widest block">
              {playerCharacterName} está realizando:
            </span>
            <h2 className="text-xl font-serif font-black text-slate-100 mt-0.5">{checkTitle}</h2>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Escolha uma Dificuldade Padrão:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_DCS.map((item) => (
                <button
                  key={item.dc}
                  type="button"
                  onClick={() => handleSelectPreset(item.dc)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                    selectedDc === item.dc
                      ? 'border-amber-400 bg-amber-500/25 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02]'
                      : item.color
                  }`}
                >
                  <span>{item.label}</span>
                  {selectedDc === item.dc && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Custom DC Input */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase">Ou digite o valor exato:</span>
            <input
              type="number"
              min="1"
              max="999"
              value={customDc}
              onChange={(e) => handleCustomChange(e.target.value)}
              className="w-20 bg-[#172030] border-2 border-amber-500/50 rounded-xl px-3 py-1.5 text-center text-lg font-black text-amber-300 font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Confirm Action Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-serif font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all active:scale-98 flex items-center justify-center gap-2 border border-amber-200"
            >
              <Sparkles className="w-4 h-4" />
              Confirmar DC {selectedDc} e Rolar Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
