import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { applyShortRest, applyLongRest, getAttributeModifier } from '@/lib/dnd5e-calculator';
import { DND_CLASSES } from '@/lib/dnd5e-data';
import { Moon, Sun, Dices, Heart, X, Sparkles, Shield } from 'lucide-react';

interface RestModalProps {
  sheet: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onApply: (updatedSheet: CharacterSheet) => void;
}

export const RestModal: React.FC<RestModalProps> = ({ sheet, isOpen, onClose, onApply }) => {
  const [restType, setRestType] = useState<'short' | 'long'>('short');
  const [diceToSpend, setDiceToSpend] = useState(1);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const classData = DND_CLASSES[sheet.className];
  const hitDie = classData ? classData.hitDie : '1d8';
  const hitDieVal = parseInt(hitDie.replace('1d', ''), 10) || 8;
  const conMod = getAttributeModifier(sheet, 'con');

  const hitDiceUsedMatch = sheet.hitDiceUsed.match(/^(\d+)/);
  const usedCount = hitDiceUsedMatch ? parseInt(hitDiceUsedMatch[1], 10) : 0;
  const totalDice = sheet.level;
  const availableDice = Math.max(0, totalDice - usedCount);

  const handleShortRest = () => {
    const { updatedSheet, hpRecovered } = applyShortRest(sheet, diceToSpend);
    setResultMessage(
      hpRecovered > 0
        ? `🩹 Descanso Curto! Gastou ${Math.min(diceToSpend, availableDice)} dado(s) de vida e recuperou ${hpRecovered} HP. (${updatedSheet.currentHp}/${updatedSheet.maxHp})`
        : '⚠️ Sem dados de vida disponíveis para gastar.',
    );
    onApply(updatedSheet);
  };

  const handleLongRest = () => {
    const updatedSheet = applyLongRest(sheet);
    setResultMessage(
      `🌙 Descanso Longo completo! HP restaurado para ${updatedSheet.maxHp}/${updatedSheet.maxHp}. Slots de magia resetados. Dados de vida parcialmente recuperados.`,
    );
    onApply(updatedSheet);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* HEADER */}
        <div className="bg-[#141b2d] border-b border-amber-500/20 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-amber-400 flex items-center gap-2">
            {restType === 'short' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
            Sistema de Descanso
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex border-b border-slate-800">
          <button
            type="button"
            onClick={() => { setRestType('short'); setResultMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase transition-all ${
              restType === 'short'
                ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun className="w-4 h-4" />
            Descanso Curto
          </button>
          <button
            type="button"
            onClick={() => { setRestType('long'); setResultMessage(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase transition-all ${
              restType === 'long'
                ? 'bg-indigo-500/10 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" />
            Descanso Longo
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-5 space-y-4">
          {/* STATUS RESUMIDO DO PERSONAGEM */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0b0f19] border border-rose-500/30 rounded-xl p-2.5 text-center">
              <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">HP Atual</span>
              <span className="text-sm font-black text-rose-300 font-mono">{sheet.currentHp}/{sheet.maxHp}</span>
            </div>
            <div className="bg-[#0b0f19] border border-amber-500/30 rounded-xl p-2.5 text-center">
              <Dices className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Dados de Vida</span>
              <span className="text-sm font-black text-amber-300 font-mono">{availableDice}/{totalDice}</span>
            </div>
            <div className="bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-center">
              <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-400 block">Recupera/Dado</span>
              <span className="text-sm font-black text-indigo-300 font-mono">{hitDie}+{conMod >= 0 ? conMod : `(${conMod})`}</span>
            </div>
          </div>

          {restType === 'short' ? (
            <>
              <div className="bg-[#141b2d] border border-amber-500/20 rounded-xl p-4 space-y-3">
                <p className="text-xs text-slate-300">
                  Gaste <strong className="text-amber-400">Dados de Vida</strong> para recuperar HP.
                  Cada dado rola <strong className="text-amber-300">{hitDie} + {conMod >= 0 ? '+' : ''}{conMod} (CON)</strong>.
                </p>

                <div className="flex items-center justify-between bg-[#0b0f19] border border-slate-800 rounded-xl p-3">
                  <span className="text-xs font-bold text-slate-300">Dados a gastar:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDiceToSpend(Math.max(1, diceToSpend - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-lg font-black text-amber-400 font-mono w-8 text-center">{diceToSpend}</span>
                    <button
                      type="button"
                      onClick={() => setDiceToSpend(Math.min(availableDice, diceToSpend + 1))}
                      className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShortRest}
                  disabled={availableDice <= 0}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-all active:scale-95 shadow-lg"
                >
                  <Sun className="w-4 h-4" />
                  {availableDice > 0 ? 'Descansar (Curto)' : 'Sem Dados Disponíveis'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-[#141b2d] border border-indigo-500/20 rounded-xl p-4 space-y-3">
              <p className="text-xs text-slate-300">
                <strong className="text-indigo-400">Descanso Longo (8 horas)</strong>: Restaura <strong className="text-emerald-400">100% HP</strong>,
                recupera <strong className="text-amber-400">metade dos dados de vida</strong>,
                reseta <strong className="text-sky-400">todos os slots de magia</strong> e limpa os <strong className="text-rose-400">testes contra a morte</strong>.
              </p>

              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">HP Recuperado:</span>
                  <span className="font-bold text-emerald-400">{sheet.maxHp - sheet.currentHp} HP</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Dados de Vida Recuperados:</span>
                  <span className="font-bold text-amber-400">{Math.max(1, Math.floor(totalDice / 2))} dados</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Slots de Magia:</span>
                  <span className="font-bold text-sky-400">Todos resetados</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLongRest}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-black py-3 rounded-xl text-xs transition-all active:scale-95 shadow-lg"
              >
                <Moon className="w-4 h-4" />
                Descansar (Longo - 8h)
              </button>
            </div>
          )}

          {/* RESULTADO DO DESCANSO */}
          {resultMessage && (
            <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 font-bold animate-fade-in">
              {resultMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
