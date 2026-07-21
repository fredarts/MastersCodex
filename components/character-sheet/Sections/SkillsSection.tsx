import React from 'react';
import { AdvantageMode, AttributeKey, CharacterSheet, DiceRollEvent, DndSkillKey, SkillProficiencyLevel } from '@/lib/types';
import { SKILL_DEFINITIONS } from '@/lib/dnd5e-data';
import {
  calculatePassivePerception,
  calculateProficiencyBonus,
  calculateSavingThrowTotal,
  calculateSkillTotal,
  formatModifier,
} from '@/lib/dnd5e-calculator';
import { executeCheckRoll } from '@/lib/dnd5e-dice';
import { Target, Eye, ShieldAlert, Award, Dices } from 'lucide-react';

interface SkillsSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
  advantageMode?: AdvantageMode;
  onRoll?: (event: DiceRollEvent) => void;
}

const ATTR_NAMES: Record<AttributeKey, string> = {
  str: 'FOR',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  sheet,
  onChange,
  advantageMode = 'normal',
  onRoll,
}) => {
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

  const handleRollSavingThrow = (attrKey: AttributeKey, e: React.MouseEvent) => {
    e.stopPropagation();
    const total = calculateSavingThrowTotal(sheet, attrKey);
    const result = executeCheckRoll({
      sheet,
      label: `Salvaguarda: ${ATTR_NAMES[attrKey]}`,
      modifier: total,
      rollType: 'saving_throw',
      advantageMode,
    });
    if (onRoll) onRoll(result);
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

  const handleRollSkill = (skillKey: DndSkillKey, e: React.MouseEvent) => {
    e.stopPropagation();
    const def = SKILL_DEFINITIONS[skillKey];
    const total = calculateSkillTotal(sheet, skillKey);
    const result = executeCheckRoll({
      sheet,
      label: `Perícia: ${def ? def.name : skillKey}`,
      modifier: total,
      rollType: 'skill',
      advantageMode,
    });
    if (onRoll) onRoll(result);
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Testes de Resistência (Salvaguardas)
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Toque no mod para rolar d20</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(ATTR_NAMES) as AttributeKey[]).map((attrKey) => {
            const isProficient = sheet.savingThrows[attrKey];
            const total = calculateSavingThrowTotal(sheet, attrKey);

            return (
              <div
                key={attrKey}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  isProficient
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                    : 'bg-[#0b0f19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSavingThrowToggle(attrKey)}
                  className="flex items-center gap-2 cursor-pointer flex-1 text-left"
                  title="Alternar Proficiência"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border ${
                      isProficient ? 'bg-amber-400 border-amber-300' : 'border-slate-600 bg-slate-900'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-200">{ATTR_NAMES[attrKey]}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleRollSavingThrow(attrKey, e)}
                  className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-xs font-black font-mono transition-transform active:scale-95 cursor-pointer"
                  title="Rolar Salvaguarda d20"
                >
                  <Dices className="w-3 h-3" />
                  {formatModifier(total)}
                </button>
              </div>
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
          <span className="text-[10px] text-slate-400">Toque na bolinha p/ nivel, valor p/ rolar</span>
        </div>

        <div className="space-y-1.5">
          {(Object.keys(SKILL_DEFINITIONS) as DndSkillKey[]).map((skillKey) => {
            const def = SKILL_DEFINITIONS[skillKey];
            const level: SkillProficiencyLevel = sheet.skills[skillKey] || 'none';
            const total = calculateSkillTotal(sheet, skillKey);

            return (
              <div
                key={skillKey}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  level === 'expertise'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                    : level === 'proficient'
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-[#0b0f19] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => handleSkillCycleLevel(skillKey)}
                  className="flex items-center gap-2.5 flex-1 cursor-pointer"
                  title="Clique para alternar: Nenhuma / Proficiente / Especialista"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-black transition-all ${
                      level === 'expertise'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-mono'
                        : level === 'proficient'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-mono'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {level === 'expertise' ? 'E' : level === 'proficient' ? 'P' : ''}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block leading-tight">{def.name}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-semibold">
                      ({ATTR_NAMES[def.attr]})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRollSkill(skillKey, e)}
                  className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-2.5 py-1 rounded-xl text-xs font-black font-mono transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Rolar Perícia no Chat"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400" />
                  {formatModifier(total)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDIOMAS E OUTRAS PROFICIÊNCIAS */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          🌐 Idiomas e Outras Proficiências
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
