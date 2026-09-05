'use client';

import React, { useState } from 'react';
import { CharacterSheet, SpellSlotsPerLevel, CharacterSpell } from '@/lib/types';
import { Sparkles, Moon, Sun, Wand2 } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';
import { applyLongRest, applyShortRest } from '@/lib/dnd5e-calculator';

interface CompanionSpellsSlotsProps {
  sheet: CharacterSheet;
  onUpdateSheet: (updated: CharacterSheet) => void;
}

export const CompanionSpellsSlots: React.FC<CompanionSpellsSlotsProps> = ({
  sheet,
  onUpdateSheet,
}) => {
  const [selectedCircle, setSelectedCircle] = useState<number>(1);

  const spellSlots = sheet.spellSlots || {};
  const spells = sheet.spells || [];

  // Obter níveis de magia que o personagem possui slots
  const activeCircles = Object.keys(spellSlots)
    .map(Number)
    .filter((lvl) => spellSlots[lvl] && spellSlots[lvl].total > 0);

  const toggleSlotPip = (level: number, pipIndex: number) => {
    haptic.slot();
    const current = spellSlots[level] || { total: 0, used: 0 };
    const maxVal = current.total;
    const availableVal = maxVal - current.used;

    // Se o pipIndex clicado está entre os disponíveis, usamos mais um (used aumenta)
    let newUsed = current.used;
    if (pipIndex < availableVal) {
      newUsed = maxVal - pipIndex;
    } else {
      newUsed = maxVal - (pipIndex + 1);
    }

    newUsed = Math.max(0, Math.min(maxVal, newUsed));

    const updatedSlots: Record<number, SpellSlotsPerLevel> = {
      ...spellSlots,
      [level]: {
        total: maxVal,
        used: newUsed,
      },
    };

    onUpdateSheet({
      ...sheet,
      spellSlots: updatedSlots,
    });
  };

  const handleLongRest = () => {
    haptic.rest();
    const restored = applyLongRest(sheet);
    onUpdateSheet(restored);
  };

  const handleShortRest = () => {
    haptic.rest();
    const { updatedSheet } = applyShortRest(sheet, 1);
    onUpdateSheet(updatedSheet);
  };

  const filteredSpells = spells.filter(
    (s) => s.level === selectedCircle && s.level !== 0
  );

  return (
    <div className="flex flex-col gap-3.5 pb-20 select-none">
      {/* Rest Controls Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between gap-2">
        <button
          onClick={handleShortRest}
          className="flex-1 py-2.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Moon className="w-3.5 h-3.5 text-amber-400" /> Descanso Curto
        </button>
        <button
          onClick={handleLongRest}
          className="flex-1 py-2.5 px-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-700/80 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-sm"
        >
          <Sun className="w-3.5 h-3.5 text-amber-400" /> Descanso Longo
        </button>
      </div>

      {/* Spell Slots Grid */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-col gap-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Espaços de Magia (Slots)
          </span>
          <span className="text-[10px] text-slate-500">Toque para gastar/recuperar</span>
        </div>

        {activeCircles.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-500">
            Nenhum slot de magia configurado.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {activeCircles.map((circle) => {
              const slot = spellSlots[circle];
              const max = slot?.total ?? 0;
              const used = slot?.used ?? 0;
              const available = Math.max(0, max - used);

              return (
                <div
                  key={`circle-${circle}`}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{circle}º Círculo</span>
                    <span className="text-[10px] text-slate-400">
                      ({available}/{max})
                    </span>
                  </div>

                  {/* Interactive Pips */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: max }).map((_, pipIdx) => {
                      const isAvailable = pipIdx < available;
                      return (
                        <button
                          key={`pip-${circle}-${pipIdx}`}
                          onClick={() => toggleSlotPip(circle, pipIdx)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black transition-all active:scale-90 ${
                            isAvailable
                              ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                              : 'bg-slate-900 border-slate-700 text-slate-600'
                          }`}
                        >
                          {isAvailable ? '✦' : '✧'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spells by Circle Selector */}
      {spells.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-amber-400" /> Grimório Rápido
            </span>
          </div>

          {/* Circle Selector Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <button
                key={`lvl-tab-${lvl}`}
                onClick={() => {
                  haptic.tap();
                  setSelectedCircle(lvl);
                }}
                className={`py-1 px-2.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  selectedCircle === lvl
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}º
              </button>
            ))}
          </div>

          {/* Spells List */}
          <div className="flex flex-col gap-1.5">
            {filteredSpells.length === 0 ? (
              <div className="text-center py-3 text-xs text-slate-500">
                Nenhuma magia de {selectedCircle}º círculo encontrada.
              </div>
            ) : (
              filteredSpells.map((s, idx) => (
                <div
                  key={s.id || `sp-${idx}`}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {s.castingTime || '1 Ação'} • {s.range || '18m'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      haptic.slot();
                      const current = spellSlots[selectedCircle] || { total: 0, used: 0 };
                      const available = Math.max(0, current.total - current.used);
                      if (available > 0) {
                        toggleSlotPip(selectedCircle, available - 1);
                      }
                    }}
                    className="py-1 px-2.5 rounded-lg bg-sky-950/60 border border-sky-800 text-sky-300 text-[11px] font-bold active:scale-95 transition-transform shrink-0"
                  >
                    Gastar Slot
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
