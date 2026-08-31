import React, { useState } from 'react';
import { AdvantageMode, CharacterSheet } from '@/lib/types';
import { calculatePassivePerception, formatModifier, getAttributeModifier } from '@/lib/dnd5e-calculator';
import { Shield, Eye, Dices, Heart, X, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import { RestModal } from './Modals/RestModal';
import { useAudio } from '@/context/AudioContext';

interface QuickCombatBarProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
  advantageMode?: AdvantageMode;
  onAdvantageModeChange?: (mode: AdvantageMode) => void;
}

export const QuickCombatBar: React.FC<QuickCombatBarProps> = ({
  sheet,
  onChange,
  advantageMode = 'normal',
  onAdvantageModeChange,
}) => {
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ d20: number; mod: number; total: number; label: string } | null>(null);

  const passivePerception = calculatePassivePerception(sheet);

  const handleAdjustHp = (delta: number) => {
    const newHp = Math.max(0, Math.min(sheet.maxHp, sheet.currentHp + delta));
    onChange({ ...sheet, currentHp: newHp });
  };

  const { playDiceSound } = useAudio();

  const handleRollDice = (label: string, mod: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + mod;
    playDiceSound(1);
    setLastRoll({ d20, mod, total, label });
  };

  return (
    <>
      {/* BARRA DE COMBATE BG3 (RODAPÉ INTEGRADO) */}
      <footer className="w-full shrink-0 z-40 bg-[#090c14]/95 backdrop-blur-md border-t border-amber-500/30 px-3 py-1.5 flex items-center justify-between gap-2 shadow-2xl select-none relative">
        {/* GRUPO ESQUERDA: CA & HP & PASSIVA */}
        <div className="flex items-center gap-2">
          {/* BADGE CA - MEDALHÃO DOURADO */}
          <div className="flex items-center gap-1.5 bg-[#121624] border border-amber-500/40 px-2.5 py-1 rounded-xl shadow-inner shrink-0">
            <Shield className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[7.5px] font-black text-amber-400/80 uppercase leading-none font-serif">CA</span>
              <span className="text-xs font-black text-amber-300 font-mono leading-tight">{sheet.armorClass}</span>
            </div>
          </div>

          {/* CONTROLE RÁPIDO DE HP */}
          <div className="flex items-center gap-1 bg-[#121624] border border-rose-500/30 px-2 py-0.5 rounded-xl shadow-inner">
            <button
              type="button"
              onClick={() => handleAdjustHp(-1)}
              className="w-5 h-5 rounded-md bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-black flex items-center justify-center text-[10px] active:scale-95 transition-transform"
              title="Reduzir 1 PV"
            >
              -1
            </button>
            <div className="flex items-center gap-1 px-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30" />
              <span className="text-xs font-black text-white font-mono leading-none">
                {sheet.currentHp}
                <span className="text-slate-400 text-[10px] font-normal">/{sheet.maxHp}</span>
              </span>
              {sheet.tempHp !== undefined && sheet.tempHp > 0 && (
                <span className="text-[9px] font-black text-cyan-300 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-500/40 font-mono">
                  +{sheet.tempHp}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleAdjustHp(1)}
              className="w-5 h-5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 font-black flex items-center justify-center text-[10px] active:scale-95 transition-transform"
              title="Aumentar 1 PV"
            >
              +1
            </button>
          </div>

          {/* BADGE SABEDORIA PASSIVA */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#121624] border border-emerald-500/30 px-2 py-1 rounded-xl shadow-inner shrink-0">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[7.5px] font-bold text-emerald-400/80 uppercase leading-none font-serif">Passiva</span>
              <span className="text-xs font-black text-emerald-400 font-mono leading-tight">{passivePerception}</span>
            </div>
          </div>
        </div>

        {/* GRUPO CENTRO: SELETOR DE MODO D20 (BALDUR'S GATE 3 RUNIC STONES) */}
        {onAdvantageModeChange && (
          <div className="flex items-center bg-[#0d111d] p-0.5 rounded-xl border border-amber-500/30 shadow-inner gap-0.5">
            <button
              type="button"
              onClick={() => onAdvantageModeChange('disadvantage')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-serif tracking-wider transition-all cursor-pointer ${
                advantageMode === 'disadvantage'
                  ? 'bg-rose-900/90 text-rose-200 border border-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'text-slate-400 hover:text-rose-300 border border-transparent'
              }`}
              title="Rolar com Desvantagem (Menor de 2d20)"
            >
              <TrendingDown className="w-3 h-3 text-rose-400" />
              <span>Desvantagem</span>
            </button>

            <button
              type="button"
              onClick={() => onAdvantageModeChange('normal')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-black uppercase font-serif tracking-wider transition-all cursor-pointer ${
                advantageMode === 'normal'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-amber-300 border border-transparent'
              }`}
              title="Rolar Teste Normal (1d20)"
            >
              <span>Normal</span>
            </button>

            <button
              type="button"
              onClick={() => onAdvantageModeChange('advantage')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-serif tracking-wider transition-all cursor-pointer ${
                advantageMode === 'advantage'
                  ? 'bg-emerald-900/90 text-emerald-200 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-emerald-300 border border-transparent'
              }`}
              title="Rolar com Vantagem (Maior de 2d20)"
            >
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Vantagem</span>
            </button>
          </div>
        )}

        {/* GRUPO DIREITA: REST & DADO D20 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRestModalOpen(true)}
            className="flex items-center gap-1 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 font-extrabold px-2.5 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform shrink-0 text-[10px] uppercase font-serif cursor-pointer"
            title="Realizar Descanso Curto ou Longo"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Descanso</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDiceModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(245,158,11,0.3)] active:scale-95 transition-transform shrink-0 text-xs font-serif cursor-pointer"
            title="Abrir Rolador Rápido de Atributos d20"
          >
            <Dices className="w-4 h-4" />
            <span>d20</span>
          </button>
        </div>
      </footer>

      {/* REST MODAL */}
      <RestModal
        sheet={sheet}
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        onApply={(updated) => {
          onChange(updated);
        }}
      />

      {/* MODAL ROLADOR DE DADOS D20 */}
      {isDiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#101422] border border-amber-500/40 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsDiceModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400">
              <Dices className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-serif">Rolador de Teste d20</h3>
            </div>

            {/* RESULTADO DA ROLAGEM */}
            {lastRoll ? (
              <div className="bg-[#0b0f19] border border-amber-500/40 rounded-xl p-4 text-center space-y-1 animate-bounce-subtle">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{lastRoll.label}</span>
                <div className="text-4xl font-black text-amber-400 font-mono">
                  {lastRoll.total}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  d20 ({lastRoll.d20}) {formatModifier(lastRoll.mod)}
                </div>
              </div>
            ) : (
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                Escolha um atributo abaixo para rolar um teste d20.
              </div>
            )}

            {/* ATALHOS DE ROLAGEM DOS 6 ATRIBUTOS */}
            <div className="grid grid-cols-3 gap-2">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((attrKey) => {
                const mod = getAttributeModifier(sheet, attrKey);
                return (
                  <button
                    key={attrKey}
                    type="button"
                    onClick={() => handleRollDice(attrKey.toUpperCase(), mod)}
                    className="bg-[#0b0f19] hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 rounded-xl p-2 text-center transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] font-black text-slate-300 block uppercase font-serif">{attrKey}</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">{formatModifier(mod)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


