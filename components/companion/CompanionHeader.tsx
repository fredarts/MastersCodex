'use client';

import React, { useState } from 'react';
import { CharacterSheet, ConditionType } from '@/lib/types';
import { Shield, Zap, Eye, Footprints, Heart, Plus, X, AlertCircle } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';
import { calculatePassivePerception, getAttributeModifier } from '@/lib/dnd5e-calculator';

interface CompanionHeaderProps {
  sheet: CharacterSheet;
  onUpdateHp: (currentHp: number, tempHp: number) => void;
  onToggleCondition: (condition: ConditionType) => void;
}

const ALL_CONDITIONS: { id: ConditionType; label: string; icon: string; desc: string }[] = [
  { id: 'Cego', label: 'Cego', icon: '👁️❌', desc: 'Falha em testes de visão. Ataques contra têm vantagem, seus têm desvantagem.' },
  { id: 'Encantado', label: 'Encantado', icon: '💖', desc: 'Não pode ferir o encantador. Encantador tem vantagem em testes sociais.' },
  { id: 'Surdo', label: 'Surdo', icon: '👂❌', desc: 'Falha automática em testes que exigem audição.' },
  { id: 'Atemorizado', label: 'Atemorizado', icon: '😱', desc: 'Desvantagem em testes de habilidade e ataques enquanto fonte do medo estiver visível.' },
  { id: 'Agarrado', label: 'Agarrado', icon: '🤼', desc: 'Deslocamento reduzido a 0.' },
  { id: 'Incapacitado', label: 'Incapacitado', icon: '💫', desc: 'Não pode realizar ações nem reações.' },
  { id: 'Invisível', label: 'Invisível', icon: '👻', desc: 'Impossível de ver sem sentidos especiais. Seus ataques têm vantagem, contra têm desvantagem.' },
  { id: 'Paralisado', label: 'Paralisado', icon: '⚡', desc: 'Incapacitado e não pode se mover. Falha em FOR/DES. Ataques a 1.5m são críticos.' },
  { id: 'Petrificado', label: 'Petrificado', icon: '🗿', desc: 'Transformado em pedra. Resistência a todo dano, imune a veneno.' },
  { id: 'Envenenado', label: 'Envenenado', icon: '🧪', desc: 'Desvantagem em jogadas de ataque e testes de habilidade.' },
  { id: 'Caído', label: 'Caído', icon: '🧎', desc: 'Apenas pode rastejar. Desvantagem em ataques. Ataques corpo-a-corpo contra têm vantagem.' },
  { id: 'Restrito', label: 'Restrito', icon: '⛓️', desc: 'Deslocamento 0. Desvantagem em ataques e salvaguardas de DES.' },
  { id: 'Inconsciente', label: 'Inconsciente', icon: '💤', desc: 'Incapacitado, larga tudo, falha em salvaguardas. Ataques a 1.5m são críticos.' },
  { id: 'Concentração', label: 'Concentração', icon: '🔮', desc: 'Mantendo uma magia que requer concentração ativa.' },
];

export const CompanionHeader: React.FC<CompanionHeaderProps> = ({
  sheet,
  onToggleCondition,
}) => {
  const [isConditionPickerOpen, setIsConditionPickerOpen] = useState(false);

  const hp = sheet.currentHp ?? sheet.maxHp ?? 10;
  const maxHp = sheet.maxHp || 10;
  const tempHp = sheet.tempHp || 0;
  const hpPercent = Math.min(100, Math.max(0, Math.round((hp / maxHp) * 100)));

  // Cores dinâmicas de HP (Evitando violeta/roxo)
  const getHpColorClass = () => {
    if (hp <= 0) return 'from-red-900 to-rose-950 text-red-400 border-red-800/80';
    if (hpPercent <= 25) return 'from-red-900/60 to-amber-950/60 text-red-400 border-red-700/60';
    if (hpPercent <= 50) return 'from-amber-950/60 to-yellow-950/40 text-amber-400 border-amber-600/60';
    return 'from-emerald-950/50 to-teal-950/30 text-emerald-400 border-emerald-600/50';
  };

  const getHpBarFillClass = () => {
    if (hp <= 0) return 'bg-red-600';
    if (hpPercent <= 25) return 'bg-gradient-to-r from-red-600 to-rose-500';
    if (hpPercent <= 50) return 'bg-gradient-to-r from-amber-600 to-yellow-500';
    return 'bg-gradient-to-r from-emerald-600 to-teal-500';
  };

  const initiativeMod = sheet.initiativeBonus ?? getAttributeModifier(sheet, 'dex');

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-3.5 pt-3 pb-3 select-none">
      {/* Top Row: Character Info & Avatar */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md shrink-0 flex items-center justify-center">
            {sheet.avatarUrl || sheet.portraitUrl ? (
              <img
                src={sheet.avatarUrl || sheet.portraitUrl}
                alt={sheet.characterName}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <span className="text-base font-bold text-amber-500">
                {sheet.characterName?.charAt(0) || 'A'}
              </span>
            )}
            {sheet.inspiration && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] text-slate-950 shadow-md"
                title="Inspiração Ativa"
              >
                ★
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-100 truncate leading-tight tracking-wide">
              {sheet.characterName || 'Personagem'}
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              Nív. {sheet.level || 1} • {sheet.race || ''} {sheet.className || ''}
              {sheet.subclass ? ` (${sheet.subclass})` : ''}
            </p>
          </div>
        </div>

        {/* Quick Vitals Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 min-w-[38px] shadow-sm">
            <div className="flex items-center gap-0.5 text-[9px] font-semibold text-sky-400">
              <Shield className="w-2.5 h-2.5" /> CA
            </div>
            <span className="text-xs font-bold text-slate-100">{sheet.armorClass || 10}</span>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 min-w-[38px] shadow-sm">
            <div className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-400">
              <Zap className="w-2.5 h-2.5" /> INIC
            </div>
            <span className="text-xs font-bold text-slate-100">
              {initiativeMod >= 0 ? `+${initiativeMod}` : initiativeMod}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 min-w-[38px] shadow-sm">
            <div className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400">
              <Footprints className="w-2.5 h-2.5" /> DESL
            </div>
            <span className="text-xs font-bold text-slate-100">{sheet.speed || '9m'}</span>
          </div>
        </div>
      </div>

      {/* Giant HP Bar Card */}
      <div className={`relative overflow-hidden rounded-xl border p-2.5 bg-gradient-to-b transition-all duration-300 shadow-inner ${getHpColorClass()}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-current animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase">Pontos de Vida</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black tracking-tight text-white">{hp}</span>
            <span className="text-xs font-medium text-slate-400">/ {maxHp}</span>
            {tempHp > 0 && (
              <span className="ml-1 text-[11px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800 px-1.5 py-0.2 rounded-md">
                +{tempHp} Temp
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80 flex">
          <div
            className={`h-full transition-all duration-300 ${getHpBarFillClass()}`}
            style={{ width: `${hpPercent}%` }}
          />
          {tempHp > 0 && (
            <div
              className="h-full bg-sky-400 transition-all duration-300"
              style={{ width: `${Math.min(100 - hpPercent, (tempHp / maxHp) * 100)}%` }}
            />
          )}
        </div>
      </div>

      {/* Conditions Ribbon */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => {
            haptic.tap();
            setIsConditionPickerOpen(true);
          }}
          className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
        >
          <Plus className="w-3 h-3 text-amber-400" />
          <span>Condição</span>
        </button>

        {sheet.conditions && sheet.conditions.length > 0 ? (
          sheet.conditions.map((cond) => {
            const def = ALL_CONDITIONS.find((c) => c.id === cond);
            return (
              <button
                key={cond}
                onClick={() => {
                  haptic.tap();
                  onToggleCondition(cond);
                }}
                className="flex items-center gap-1 bg-amber-950/60 border border-amber-700/80 text-amber-200 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0 active:scale-95 transition-transform"
              >
                <span>{def?.icon || '⚠️'}</span>
                <span>{def?.label || cond}</span>
                <X className="w-3 h-3 text-amber-400 ml-0.5" />
              </button>
            );
          })
        ) : (
          <span className="text-[10px] text-slate-500 italic pl-1">Sem condições ativas</span>
        )}
      </div>

      {/* Condition Selector Modal */}
      {isConditionPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end p-3 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Alternar Condições D&D 5e
              </h3>
              <button
                onClick={() => setIsConditionPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-2 grid grid-cols-1 gap-1.5 mt-2">
              {ALL_CONDITIONS.map((cond) => {
                const isActive = sheet.conditions?.includes(cond.id);
                return (
                  <button
                    key={cond.id}
                    onClick={() => {
                      haptic.tap();
                      onToggleCondition(cond.id);
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-amber-950/70 border-amber-600 text-amber-100 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{cond.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold">{cond.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{cond.desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-amber-500 text-slate-950' : 'border border-slate-700'
                      }`}
                    >
                      {isActive ? '✓' : ''}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsConditionPickerOpen(false)}
              className="mt-3 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
