'use client';

import React, { useState } from 'react';
import { CharacterSheet, AdvantageMode, AttributeKey, DndSkillKey } from '@/lib/types';
import { Dices, Sparkles, ChevronDown, RotateCcw, ShieldAlert, BookOpen } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';
import { getAttributeModifier, calculateSavingThrowTotal, calculateSkillTotal, formatModifier } from '@/lib/dnd5e-calculator';
import { SKILL_DEFINITIONS } from '@/lib/dnd5e-data';

interface CompanionDiceRollerProps {
  sheet: CharacterSheet;
}

interface RollLogItem {
  id: string;
  label: string;
  formula: string;
  rolls: number[];
  modifier: number;
  total: number;
  isCrit20?: boolean;
  isCrit1?: boolean;
  timestamp: string;
}

const DICE_TYPES = [
  { label: 'd20', sides: 20, color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' },
  { label: 'd4', sides: 4, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20' },
  { label: 'd6', sides: 6, color: 'text-sky-400 border-sky-500/40 bg-sky-950/20' },
  { label: 'd8', sides: 8, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20' },
  { label: 'd10', sides: 10, color: 'text-teal-400 border-teal-500/40 bg-teal-950/20' },
  { label: 'd12', sides: 12, color: 'text-orange-400 border-orange-500/40 bg-orange-950/20' },
  { label: 'd100', sides: 100, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20' },
];

const ATTRIBUTES: { key: AttributeKey; label: string }[] = [
  { key: 'str', label: 'FOR' },
  { key: 'dex', label: 'DES' },
  { key: 'con', label: 'CON' },
  { key: 'int', label: 'INT' },
  { key: 'wis', label: 'SAB' },
  { key: 'cha', label: 'CAR' },
];

export const CompanionDiceRoller: React.FC<CompanionDiceRollerProps> = ({ sheet }) => {
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [diceCount, setDiceCount] = useState<number>(1);
  const [customMod, setCustomMod] = useState<number>(0);
  const [history, setHistory] = useState<RollLogItem[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'quick' | 'saves' | 'skills'>('quick');

  const addHistoryItem = (item: RollLogItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 10));
  };

  const rollStandardDice = (sides: number, label: string) => {
    if (sides === 20) {
      const r1 = Math.floor(Math.random() * 20) + 1;
      let selected = r1;
      const rolls = [r1];

      if (advantageMode !== 'normal') {
        const r2 = Math.floor(Math.random() * 20) + 1;
        rolls.push(r2);
        selected = advantageMode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
      }

      const total = selected + customMod;
      const isCrit20 = selected === 20;
      const isCrit1 = selected === 1;

      if (isCrit20) haptic.critSuccess();
      else if (isCrit1) haptic.critFail();
      else haptic.roll();

      addHistoryItem({
        id: Date.now().toString(),
        label: `${label} (${advantageMode === 'advantage' ? 'Vantagem' : advantageMode === 'disadvantage' ? 'Desvantagem' : 'Normal'})`,
        formula: `1d20${customMod !== 0 ? formatModifier(customMod) : ''}`,
        rolls,
        modifier: customMod,
        total,
        isCrit20,
        isCrit1,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      return;
    }

    // Outros dados com contagem
    haptic.roll();
    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < diceCount; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    const total = sum + customMod;

    addHistoryItem({
      id: Date.now().toString(),
      label: `${diceCount}${label}`,
      formula: `${diceCount}${label}${customMod !== 0 ? formatModifier(customMod) : ''}`,
      rolls,
      modifier: customMod,
      total,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  const rollSave = (attrKey: AttributeKey, attrLabel: string) => {
    const mod = calculateSavingThrowTotal(sheet, attrKey);
    const r1 = Math.floor(Math.random() * 20) + 1;
    let selected = r1;
    const rolls = [r1];

    if (advantageMode !== 'normal') {
      const r2 = Math.floor(Math.random() * 20) + 1;
      rolls.push(r2);
      selected = advantageMode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
    }

    const total = selected + mod + customMod;
    const isCrit20 = selected === 20;
    const isCrit1 = selected === 1;

    if (isCrit20) haptic.critSuccess();
    else if (isCrit1) haptic.critFail();
    else haptic.roll();

    addHistoryItem({
      id: Date.now().toString(),
      label: `Salvaguarda: ${attrLabel}`,
      formula: `1d20 ${formatModifier(mod + customMod)}`,
      rolls,
      modifier: mod + customMod,
      total,
      isCrit20,
      isCrit1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  const rollSkill = (skillKey: DndSkillKey) => {
    const skillDef = SKILL_DEFINITIONS[skillKey];
    const mod = calculateSkillTotal(sheet, skillKey);
    const r1 = Math.floor(Math.random() * 20) + 1;
    let selected = r1;
    const rolls = [r1];

    if (advantageMode !== 'normal') {
      const r2 = Math.floor(Math.random() * 20) + 1;
      rolls.push(r2);
      selected = advantageMode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
    }

    const total = selected + mod + customMod;
    const isCrit20 = selected === 20;
    const isCrit1 = selected === 1;

    if (isCrit20) haptic.critSuccess();
    else if (isCrit1) haptic.critFail();
    else haptic.roll();

    addHistoryItem({
      id: Date.now().toString(),
      label: `Perícia: ${skillDef?.name || skillKey}`,
      formula: `1d20 ${formatModifier(mod + customMod)}`,
      rolls,
      modifier: mod + customMod,
      total,
      isCrit20,
      isCrit1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  return (
    <div className="flex flex-col gap-3.5 pb-20 select-none">
      {/* Mode Selectors (Advantage & Subtabs) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-md">
        {/* Advantage / Normal / Disadvantage */}
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          <button
            onClick={() => {
              haptic.tap();
              setAdvantageMode('advantage');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              advantageMode === 'advantage'
                ? 'bg-emerald-600 text-slate-950 shadow-md'
                : 'bg-slate-950/80 border border-slate-800 text-emerald-400 hover:bg-slate-800'
            }`}
          >
            ▲ Vantagem
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setAdvantageMode('normal');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              advantageMode === 'normal'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950/80 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setAdvantageMode('disadvantage');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              advantageMode === 'disadvantage'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-950/80 border border-slate-800 text-red-400 hover:bg-slate-800'
            }`}
          >
            ▼ Desvantagem
          </button>
        </div>

        {/* Roller Category Switcher */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              haptic.tap();
              setActiveSubTab('quick');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'quick' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400'
            }`}
          >
            🎲 Dados
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setActiveSubTab('saves');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'saves' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400'
            }`}
          >
            🛡️ Salvaguardas
          </button>
          <button
            onClick={() => {
              haptic.tap();
              setActiveSubTab('skills');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'skills' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400'
            }`}
          >
            📜 Perícias
          </button>
        </div>
      </div>

      {/* Subtab Content: QUICK DICE */}
      {activeSubTab === 'quick' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col gap-3">
          {/* Dice Multiplier & Mod */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-400">Quantidade:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => {
                      haptic.tap();
                      setDiceCount(cnt);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold ${
                      diceCount === cnt
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {cnt}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400">Mod:</span>
              <button
                onClick={() => setCustomMod((m) => m - 1)}
                className="w-6 h-6 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                -
              </button>
              <span className="text-xs font-bold text-slate-100 font-mono w-6 text-center">
                {customMod >= 0 ? `+${customMod}` : customMod}
              </span>
              <button
                onClick={() => setCustomMod((m) => m + 1)}
                className="w-6 h-6 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Dice Grid */}
          <div className="grid grid-cols-4 gap-2">
            {DICE_TYPES.map((dice) => (
              <button
                key={dice.label}
                onClick={() => rollStandardDice(dice.sides, dice.label)}
                className={`py-3 rounded-xl border flex flex-col items-center justify-center font-bold transition-all active:scale-90 shadow-sm ${dice.color}`}
              >
                <span className="text-sm font-black tracking-tight">{dice.label}</span>
                <span className="text-[10px] opacity-70 mt-0.5">Rolar</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subtab Content: SAVES */}
      {activeSubTab === 'saves' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md grid grid-cols-3 gap-2">
          {ATTRIBUTES.map((attr) => {
            const mod = calculateSavingThrowTotal(sheet, attr.key);
            const isProf = sheet.savingThrows?.[attr.key] || false;
            return (
              <button
                key={attr.key}
                onClick={() => rollSave(attr.key, attr.label)}
                className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-all shadow-sm"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-300">{attr.label}</span>
                  {isProf && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
                <span className="text-base font-black text-amber-400 mt-0.5">{formatModifier(mod)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Subtab Content: SKILLS */}
      {activeSubTab === 'skills' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 shadow-md flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {(Object.keys(SKILL_DEFINITIONS) as DndSkillKey[]).map((skillKey) => {
            const def = SKILL_DEFINITIONS[skillKey];
            const mod = calculateSkillTotal(sheet, skillKey);
            const prof = sheet.skills?.[skillKey] || 'none';
            return (
              <button
                key={skillKey}
                onClick={() => rollSkill(skillKey)}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      prof === 'expertise'
                        ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                        : prof === 'proficient'
                        ? 'bg-emerald-400'
                        : 'bg-slate-700'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-200">{def.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{def.attr}</span>
                </div>
                <span className="text-xs font-bold font-mono text-amber-400">{formatModifier(mod)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Roll History Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Dices className="w-3.5 h-3.5 text-amber-400" /> Histórico de Rolagens
          </span>
          {history.length > 0 && (
            <button
              onClick={() => {
                haptic.tap();
                setHistory([]);
              }}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Limpar
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-600">Nenhum dado rolado ainda</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                  item.isCrit20
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                    : item.isCrit1
                    ? 'bg-red-950/40 border-red-500/80 text-red-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    [{item.rolls.join(', ')}] {item.formula}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black font-mono leading-none">{item.total}</div>
                  <div className="text-[9px] text-slate-500">{item.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
