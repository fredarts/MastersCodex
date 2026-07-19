import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { calculatePassivePerception, formatModifier, getAttributeModifier } from '@/lib/dnd5e-calculator';
import { Shield, Eye, Dices, Heart, Plus, Minus, X } from 'lucide-react';

interface QuickCombatBarProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const QuickCombatBar: React.FC<QuickCombatBarProps> = ({ sheet, onChange }) => {
  const [isDiceModalOpen, setIsDiceModalOpen] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ d20: number; mod: number; total: number; label: string } | null>(null);

  const passivePerception = calculatePassivePerception(sheet);

  const handleAdjustHp = (delta: number) => {
    const newHp = Math.max(0, Math.min(sheet.maxHp, sheet.currentHp + delta));
    onChange({ ...sheet, currentHp: newHp });
  };

  const handleRollDice = (label: string, mod: number) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + mod;
    setLastRoll({ d20, mod, total, label });
  };

  return (
    <>
      {/* BARRA FIXA DE COMBATE (RODAPÉ MOBILE) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d121f]/95 backdrop-blur-md border-t border-amber-500/30 px-3 py-2 flex items-center justify-between shadow-2xl">
        {/* BADGE CA */}
        <div className="flex items-center gap-1.5 bg-[#141b2d] border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-inner shrink-0">
          <Shield className="w-4 h-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">CA</span>
            <span className="text-sm font-black text-amber-300 font-mono leading-none">{sheet.armorClass}</span>
          </div>
        </div>

        {/* CONTROLE RÁPIDO DE HP */}
        <div className="flex items-center gap-1 bg-[#141b2d] border border-rose-500/30 px-2 py-1 rounded-xl shadow-inner">
          <button
            type="button"
            onClick={() => handleAdjustHp(-1)}
            className="w-6 h-6 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 font-bold flex items-center justify-center text-xs active:scale-95 transition-transform"
          >
            -1
          </button>
          <div className="flex items-center gap-1 px-1">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-xs font-black text-white font-mono">
              {sheet.currentHp}/{sheet.maxHp}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleAdjustHp(1)}
            className="w-6 h-6 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 font-bold flex items-center justify-center text-xs active:scale-95 transition-transform"
          >
            +1
          </button>
        </div>

        {/* BADGE SABEDORIA PASSIVA */}
        <div className="flex items-center gap-1.5 bg-[#141b2d] border border-emerald-500/30 px-2.5 py-1 rounded-xl shadow-inner shrink-0 hidden sm:flex">
          <Eye className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Passiva</span>
            <span className="text-sm font-black text-emerald-400 font-mono leading-none">{passivePerception}</span>
          </div>
        </div>

        {/* BOTÃO ROLADOR DE DADOS */}
        <button
          type="button"
          onClick={() => setIsDiceModalOpen(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-transform shrink-0 text-xs"
        >
          <Dices className="w-4 h-4" />
          Rolador d20
        </button>
      </div>

      {/* MODAL ROLADOR DE DADOS D20 */}
      {isDiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-[#141b2d] border border-amber-500/40 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => setIsDiceModalOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-400">
              <Dices className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Rolador de Teste d20</h3>
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
                    className="bg-[#0b0f19] hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 rounded-xl p-2 text-center transition-colors"
                  >
                    <span className="text-[10px] font-black text-slate-300 block uppercase">{attrKey}</span>
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
