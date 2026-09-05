'use client';

import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { Shield, Heart, Plus, Minus, Flame, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';

interface CompanionHpControllerProps {
  sheet: CharacterSheet;
  onUpdateHp: (currentHp: number, tempHp: number) => void;
}

export const CompanionHpController: React.FC<CompanionHpControllerProps> = ({
  sheet,
  onUpdateHp,
}) => {
  const [inputValue, setInputValue] = useState<string>('');

  const currentHp = sheet.currentHp ?? sheet.maxHp ?? 10;
  const maxHp = sheet.maxHp || 10;
  const tempHp = sheet.tempHp || 0;

  const applyDamage = (amount: number) => {
    if (amount <= 0) return;
    let remainingDamage = amount;
    let newTempHp = tempHp;
    let newHp = currentHp;

    // Primeiro absorve pelo HP Temporário
    if (newTempHp > 0) {
      if (newTempHp >= remainingDamage) {
        newTempHp -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= newTempHp;
        newTempHp = 0;
      }
    }

    if (remainingDamage > 0) {
      newHp = Math.max(0, newHp - remainingDamage);
    }

    if (newHp === 0 && currentHp > 0) {
      haptic.zeroHp();
    } else {
      haptic.damage();
    }

    onUpdateHp(newHp, newTempHp);
    setInputValue('');
  };

  const applyHealing = (amount: number) => {
    if (amount <= 0) return;
    const newHp = Math.min(maxHp, currentHp + amount);
    haptic.heal();
    onUpdateHp(newHp, tempHp);
    setInputValue('');
  };

  const setTemporaryHp = (amount: number) => {
    haptic.tap();
    onUpdateHp(currentHp, amount);
    setInputValue('');
  };

  const handleCustomAction = (type: 'damage' | 'heal' | 'temp') => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || val <= 0) return;

    if (type === 'damage') applyDamage(val);
    if (type === 'heal') applyHealing(val);
    if (type === 'temp') setTemporaryHp(val);
  };

  const appendNumber = (num: string) => {
    haptic.tap();
    if (inputValue.length >= 4) return;
    setInputValue((prev) => prev + num);
  };

  const clearNumber = () => {
    haptic.tap();
    setInputValue('');
  };

  return (
    <div className="flex flex-col gap-3.5 pb-20 select-none">
      {/* Quick Adjustment Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Ajuste Rápido de Dano</span>
          <Flame className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, 20].map((val) => (
            <button
              key={`dmg-${val}`}
              onClick={() => applyDamage(val)}
              className="py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/80 text-red-300 font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
            >
              <Minus className="w-3.5 h-3.5" /> {val}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-3 mb-2 flex items-center justify-between">
          <span>Ajuste Rápido de Cura</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, 20].map((val) => (
            <button
              key={`heal-${val}`}
              onClick={() => applyHealing(val)}
              className="py-2.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> {val}
            </button>
          ))}
        </div>
      </div>

      {/* Numeric Calculator Pad */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-md">
        <div className="text-center mb-2.5">
          <div className="h-11 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-center px-4 font-mono text-xl font-bold text-slate-100 tracking-wider">
            {inputValue || <span className="text-slate-600 font-normal">Digite um valor...</span>}
          </div>
        </div>

        {/* 3x4 Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '00'].map((key) => (
            <button
              key={key}
              onClick={() => {
                if (key === 'C') clearNumber();
                else appendNumber(key);
              }}
              className={`h-11 rounded-xl font-bold text-base transition-all active:scale-90 flex items-center justify-center ${
                key === 'C'
                  ? 'bg-slate-800 text-red-400 hover:bg-slate-700'
                  : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Action Triggers for Input */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCustomAction('damage')}
            disabled={!inputValue}
            className="py-3 rounded-xl bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 disabled:opacity-40 text-white font-bold text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Flame className="w-4 h-4" /> Dano
          </button>
          <button
            onClick={() => handleCustomAction('heal')}
            disabled={!inputValue}
            className="py-3 rounded-xl bg-gradient-to-r from-emerald-900 to-emerald-700 hover:from-emerald-800 hover:to-emerald-600 disabled:opacity-40 text-white font-bold text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Heart className="w-4 h-4" /> Cura
          </button>
          <button
            onClick={() => handleCustomAction('temp')}
            disabled={!inputValue}
            className="py-3 rounded-xl bg-gradient-to-r from-sky-950 to-sky-800 hover:from-sky-900 hover:to-sky-700 disabled:opacity-40 text-sky-200 border border-sky-700 font-bold text-xs active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Shield className="w-4 h-4" /> HP Temp
          </button>
        </div>
      </div>

      {/* Emergency & Reset Tools */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            haptic.heal();
            onUpdateHp(maxHp, 0);
          }}
          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Curar ao Máximo
        </button>
        <button
          onClick={() => {
            haptic.zeroHp();
            onUpdateHp(0, 0);
          }}
          className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-red-300 font-medium text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Reduzir a 0 HP
        </button>
      </div>
    </div>
  );
};
