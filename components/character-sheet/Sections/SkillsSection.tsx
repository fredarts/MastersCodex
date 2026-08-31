import React, { useState } from 'react';
import { AdvantageMode, AttributeKey, CharacterSheet, DiceRollEvent, DndSkillKey, SkillProficiencyLevel } from '@/lib/types';
import { SKILL_DEFINITIONS, DND_CLASSES, DND_RACES } from '@/lib/dnd5e-data';
import {
  calculatePassivePerception,
  calculateProficiencyBonus,
  calculateSavingThrowTotal,
  calculateSkillTotal,
  formatModifier,
  getClassLevel,
} from '@/lib/dnd5e-calculator';
import { executeCheckRoll } from '@/lib/dnd5e-dice';
import { Target, Eye, ShieldAlert, Award, Dices, Lock, Unlock, Sparkles } from 'lucide-react';

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
  const [favoredContext, setFavoredContext] = useState(false);
  const profBonus = calculateProficiencyBonus(sheet.level);
  const passivePerception = calculatePassivePerception(sheet);

  const classData = DND_CLASSES[sheet.className];
  const raceData = DND_RACES[sheet.race];
  
  const classSkillChoices = classData ? classData.skillChoices : 2;
  const raceSkillChoices = raceData?.skillChoices || 0;
  const backgroundSkillChoices = 2; // Padrão D&D 5e
  
  const maxAllowedSkills = classSkillChoices + backgroundSkillChoices + raceSkillChoices + (raceData?.fixedSkills?.length || 0);

  const selectedSkills = (Object.keys(sheet.skills) as DndSkillKey[]).filter(
    (k) => sheet.skills[k] === 'proficient' || sheet.skills[k] === 'expertise'
  );

  const isValidSkillSelection = (proposedSkills: DndSkillKey[]) => {
    if (!classData) return true;
    
    const classOptions = classData.skillOptions;
    const maxClass = classData.skillChoices;
    const maxBackground = 2;
    const maxRace = raceData?.skillChoices || 0;
    const raceFixed = raceData?.fixedSkills || [];
    
    const remainingToValidate = [...proposedSkills];
    
    // 1. Remove race fixed skills
    raceFixed.forEach(fk => {
      const idx = remainingToValidate.indexOf(fk);
      if (idx !== -1) {
        remainingToValidate.splice(idx, 1);
      }
    });
    
    // 2. Count how many can be absorbed by class slots
    let absorbedByClass = 0;
    const notAbsorbedByClass: DndSkillKey[] = [];
    
    for (const sk of remainingToValidate) {
      if (absorbedByClass < maxClass && (classOptions === 'all' || classOptions.includes(sk))) {
        absorbedByClass++;
      } else {
        notAbsorbedByClass.push(sk);
      }
    }
    
    // 3. The rest must be absorbed by background + any-race slots
    const availableAnySlots = maxBackground + maxRace;
    return notAbsorbedByClass.length <= availableAnySlots;
  };

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

  const isLocked = sheet.skillsLocked ?? false;

  const handleSkillCycleLevel = (skillKey: DndSkillKey) => {
    if (isLocked) return;
    
    const current = sheet.skills[skillKey] || 'none';
    let nextLevel: SkillProficiencyLevel = 'none';
    
    if (current === 'none') {
      const proposed = [...selectedSkills, skillKey];
      if (!isValidSkillSelection(proposed)) {
        return; // Excedeu limite ou não pertence à lista da classe
      }
      nextLevel = 'proficient';
    } else if (current === 'proficient') {
      nextLevel = 'expertise';
    } else {
      nextLevel = 'none';
    }

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
    const profLevel = sheet.skills[skillKey] || 'none';
    
    // Talento Confiável (Ladino Nv 11+): piso de 10 no d20 se tiver proficiência ou especialização
    const hasReliableTalent = getClassLevel(sheet, 'Ladino') >= 11 && (profLevel === 'proficient' || profLevel === 'expertise');
    
    // Automação de Patrulheiro: Vantagem contextual em testes de Sabedoria ou Inteligência aplicáveis
    const isRanger = getClassLevel(sheet, 'Patrulheiro') > 0;
    const isApplicableSkill = def && (def.attr === 'wis' || def.attr === 'int');
    const applyRangerAdvantage = isRanger && favoredContext && isApplicableSkill;

    const result = executeCheckRoll({
      sheet,
      label: `Perícia: ${def ? def.name : skillKey}${applyRangerAdvantage ? ' (Inimigo/Terreno Favorito)' : ''}`,
      modifier: total,
      rollType: 'skill',
      advantageMode: applyRangerAdvantage ? 'advantage' : advantageMode,
      reliableTalent: hasReliableTalent,
    });
    if (onRoll) onRoll(result);
  };

  // Calcular detalhes do uso de perícias para exibir na UI
  const classOptions = classData?.skillOptions || [];
  const maxClass = classData?.skillChoices || 2;
  const maxBackground = 2;
  const maxRace = raceData?.skillChoices || 0;
  const raceFixed = raceData?.fixedSkills || [];

  let usedClass = 0;
  let usedWildcard = 0;
  let usedRaceFixed = 0;
  
  selectedSkills.forEach(sk => {
    if (raceFixed.includes(sk)) {
      usedRaceFixed++;
    } else if (usedClass < maxClass && (classOptions === 'all' || classOptions.includes(sk))) {
      usedClass++;
    } else {
      usedWildcard++;
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 flex-1 min-h-0 h-full overflow-hidden animate-fade-in select-none">
      
      {/* COLUNA ESQUERDA: PROFICIÊNCIAS, SALVAGUARDAS & IDIOMAS */}
      <div className="flex flex-col gap-2 h-full overflow-hidden justify-between">
        {/* CABEÇALHO DE BÔNUS DE PROFICIÊNCIA E SABEDORIA PASSIVA */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          {/* BÔNUS DE PROFICIÊNCIA */}
          <div className="bg3-panel rounded-xl p-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block font-serif">Proficiência</span>
              <span className="text-lg font-black text-amber-400 font-mono leading-none">{formatModifier(profBonus)}</span>
            </div>
          </div>

          {/* SABEDORIA PASSIVA */}
          <div className="bg3-panel rounded-xl p-2 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block font-serif">Sabedoria Passiva</span>
              <span className="text-lg font-black text-emerald-400 font-mono leading-none">{passivePerception}</span>
            </div>
          </div>
        </div>

        {/* TESTES DE RESISTÊNCIA (SALVAGUARDAS) */}
        <div className="bg3-panel rounded-xl p-2.5 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between border-b border-amber-500/10 pb-1">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Testes de Resistência (Salvaguardas)
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(Object.keys(ATTR_NAMES) as AttributeKey[]).map((attrKey) => {
              const isProficient = sheet.savingThrows[attrKey];
              const total = calculateSavingThrowTotal(sheet, attrKey);

              return (
                <div
                  key={attrKey}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg border transition-all ${
                    isProficient
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                      : 'bg-[#090c14] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSavingThrowToggle(attrKey)}
                    className="flex items-center gap-1.5 cursor-pointer flex-1 text-left focus:outline-none"
                    title="Alternar Proficiência"
                  >
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        isProficient ? 'bg-amber-400 border-amber-300' : 'border-slate-600 bg-slate-900'
                      }`}
                    />
                    <span className="text-[10px] font-bold text-slate-200 font-serif">{ATTR_NAMES[attrKey]}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleRollSavingThrow(attrKey, e)}
                    className="flex items-center gap-0.5 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded text-[10px] font-black font-mono transition-transform active:scale-95 cursor-pointer"
                    title="Rolar Salvaguarda d20"
                  >
                    <Dices className="w-2.5 h-2.5" />
                    {formatModifier(total)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* IDIOMAS E OUTRAS PROFICIÊNCIAS */}
        <div className="bg3-panel rounded-xl p-2.5 space-y-1 flex-1 flex flex-col min-h-0 justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1 shrink-0">
            🌐 Idiomas & Proficiências Diversas
          </h3>
          <textarea
            value={sheet.otherProficienciesAndLanguages || ''}
            onChange={(e) => onChange({ ...sheet, otherProficienciesAndLanguages: e.target.value })}
            placeholder="Ex: Idiomas: Comum, Élfico. Proficiências: Armaduras Leves, Ferramentas de Ladino."
            className="w-full flex-1 min-h-[60px] bg-[#090c14] border border-slate-700/80 rounded-lg p-2 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 leading-relaxed font-serif resize-none"
          />
        </div>
      </div>

      {/* COLUNA DIREITA: AS 18 PERÍCIAS (2 COLUNAS DE 9 - ZERO SCROLL) */}
      <div className="bg3-panel rounded-xl p-2.5 flex flex-col h-full overflow-hidden justify-between">
        <div className="flex flex-col gap-0.5 border-b border-amber-500/10 pb-1 mb-1 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Perícias ({selectedSkills.length} / {maxAllowedSkills})
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...sheet, skillsLocked: !isLocked })}
                className={`flex items-center justify-center w-5 h-5 rounded transition-colors cursor-pointer ${
                  isLocked ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isLocked ? "Destravar Perícias" : "Travar Perícias"}
              >
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-semibold">
            <span className={usedClass === maxClass ? "text-amber-400" : "text-amber-400/60"}>
              Classe: {usedClass}/{maxClass}
            </span>
            <span className={usedWildcard === (maxBackground + maxRace) ? "text-slate-300" : "text-slate-500"}>
              Livres: {usedWildcard}/{maxBackground + maxRace}
            </span>
            {raceFixed.length > 0 && (
              <span className={usedRaceFixed === raceFixed.length ? "text-cyan-400" : "text-cyan-400/60"}>
                Raça: {usedRaceFixed}/{raceFixed.length}
              </span>
            )}
          </div>
        </div>

        {getClassLevel(sheet, 'Patrulheiro') > 0 && (
          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-1.5 mb-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 font-serif">Inimigo / Terreno Favorito</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={favoredContext}
                onChange={(e) => setFavoredContext(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-7 h-4 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-3 peer-checked:after:bg-white"></div>
            </label>
          </div>
        )}

        {/* GRADE DE 18 PERÍCIAS EM 2 COLUNAS DE 9 */}
        <div className="grid grid-cols-2 gap-1 flex-1 min-h-0">
          {(Object.keys(SKILL_DEFINITIONS) as DndSkillKey[]).map((skillKey) => {
            const def = SKILL_DEFINITIONS[skillKey];
            const level: SkillProficiencyLevel = sheet.skills[skillKey] || 'none';
            const total = calculateSkillTotal(sheet, skillKey);

            return (
              <div
                key={skillKey}
                className={`flex items-center justify-between px-1.5 py-0.5 rounded-lg border transition-all ${
                  level === 'expertise'
                    ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                    : level === 'proficient'
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-[#090c14] border-slate-800/85 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => handleSkillCycleLevel(skillKey)}
                  className={`flex items-center gap-1.5 flex-1 min-w-0 ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                  title={isLocked ? "Perícias Travadas" : "Alternar: Nenhuma / Proficiente / Especialista"}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] font-black transition-all shrink-0 ${
                      level === 'expertise'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-mono'
                        : level === 'proficient'
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-mono'
                        : `border-slate-700 bg-slate-900 ${isLocked ? 'opacity-40' : ''}`
                    }`}
                  >
                    {level === 'expertise' ? 'E' : level === 'proficient' ? 'P' : ''}
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] font-bold text-slate-200 leading-tight block truncate font-serif">
                      {def.name}
                    </span>
                    <span className="text-[7.5px] text-slate-500 uppercase font-semibold block leading-none">
                      ({ATTR_NAMES[def.attr]})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRollSkill(skillKey, e)}
                  className="flex items-center gap-0.5 bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-1.5 py-0.5 rounded text-[10px] font-black font-mono transition-all active:scale-95 cursor-pointer shrink-0 ml-1"
                  title="Rolar Perícia no Chat"
                >
                  <Dices className="w-2.5 h-2.5 text-amber-400" />
                  {formatModifier(total)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
