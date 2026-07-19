import React from 'react';
import { AttributeKey, CharacterSheet, DndSkillKey, SkillProficiencyLevel } from '@/lib/types';
import { SKILL_DEFINITIONS } from '@/lib/dnd5e-data';
import {
  calculatePassivePerception,
  calculateProficiencyBonus,
  calculateSavingThrowTotal,
  calculateSkillTotal,
  formatModifier,
  getAttributeModifier,
} from '@/lib/dnd5e-calculator';
import { Target, Eye, Globe, ShieldAlert, Award } from 'lucide-react';

interface SkillsSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

const ATTR_NAMES: Record<AttributeKey, string> = {
  str: 'FOR',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

export const SkillsSection: React.FC<SkillsSectionProps> = ({ sheet, onChange }) => {
  const profBonus = calculateProficiencyBonus(sheet.level);
  const passivePerception = calculatePassivePerception(sheet);

  const handleSavingThrowToggle = (attrKey: AttributeKey) => {
    onChange({
      ...sheet,
      savingThrows: {
        ...sheet.savingThrows,
        [attrKey]: !sheet.savingThrows[attrKey],
      },
    });
  };

  const handleSkillCycleLevel = (skillKey: DndSkillKey) => {
    const current = sheet.skills[skillKey] || 'none';
    let nextLevel: SkillProficiencyLevel = 'none';
    if (current === 'none') nextLevel = 'proficient';
    else if (current === 'proficient') nextLevel = 'expertise';
    else nextLevel = 'none';

    onChange({
      ...sheet,
      skills: {
        ...sheet.skills,
        [skillKey]: nextLevel,
      },
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* CABEÇALHO DE BÔNUS DE PROFICIÊNCIA E SABEDORIA PASSIVA */}
      <div className="grid grid-cols-2 gap-3">
        {/* BÔNUS DE PROFICIÊNCIA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Proficiência</span>
            <span className="text-xl font-black text-amber-400 font-mono">{formatModifier(profBonus)}</span>
          </div>
        </div>

        {/* SABEDORIA PASSIVA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Sabedoria Passiva</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{passivePerception}</span>
          </div>
        </div>
      </div>

      {/* TESTES DE RESISTÊNCIA (SALVAGUARDAS) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Testes de Resistência (Salvaguardas)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(ATTR_NAMES) as AttributeKey[]).map((attrKey) => {
            const isProficient = sheet.savingThrows[attrKey];
            const total = calculateSavingThrowTotal(sheet, attrKey);

            return (
              <button
                key={attrKey}
                type="button"
                onClick={() => handleSavingThrowToggle(attrKey)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isProficient
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                    : 'bg-[#0b0f19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-full border ${
                      isProficient ? 'bg-amber-400 border-amber-300' : 'border-slate-600 bg-slate-900'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-200">{ATTR_NAMES[attrKey]}</span>
                </div>
                <span className="text-xs font-black font-mono text-amber-400">{formatModifier(total)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 18 PERÍCIAS D&D 5E */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            Perícias (18 Oficial 5e)
          </h3>
          <span className="text-[10px] text-slate-400">Toque para alternar Proficiência</span>
        </div>

        <div className="space-y-1.5">
          {(Object.keys(SKILL_DEFINITIONS) as DndSkillKey[]).map((skillKey) => {
            const def = SKILL_DEFINITIONS[skillKey];
            const level: SkillProficiencyLevel = sheet.skills[skillKey] || 'none';
            const total = calculateSkillTotal(sheet, skillKey);

            return (
              <div
                key={skillKey}
                onClick={() => handleSkillCycleLevel(skillKey)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all active:scale-[0.99] ${
                  level === 'expertise'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                    : level === 'proficient'
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-[#0b0f19] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* ICONE DE STATUS (NENHUM, PROFICIENTE, ESPECIALIZAÇÃO) */}
                  <div className="flex items-center justify-center shrink-0">
                    {level === 'expertise' ? (
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/40">
                        x2
                      </span>
                    ) : level === 'proficient' ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-300 shadow-sm shadow-amber-400/50" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-900" />
                    )}
                  </div>

                  <span className="text-xs font-bold text-slate-200">{def.name}</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                    ({ATTR_NAMES[def.attr]})
                  </span>
                </div>

                <span
                  className={`text-sm font-black font-mono ${
                    level === 'expertise'
                      ? 'text-emerald-400'
                      : level === 'proficient'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {formatModifier(total)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDIOMAS E OUTRAS PROFICIÊNCIAS */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-400" />
          Idiomas e Outras Proficiências
        </h3>
        <textarea
          rows={4}
          value={sheet.otherProficienciesAndLanguages || ''}
          onChange={(e) => onChange({ ...sheet, otherProficienciesAndLanguages: e.target.value })}
          placeholder="Ex: Idiomas: Comum, Élfico. Proficiências: Armaduras Leves, Ferramentas de Ladino."
          className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
        />
      </div>
    </div>
  );
};
