import React, { useState, useEffect } from 'react';
import { CharacterSheet, AttributeKey, CharacterFeat } from '@/lib/types';
import { DND_CLASSES, CLASS_FEATURES_DB, MULTICLASS_REQUIREMENTS, MULTICLASS_PROFICIENCIES } from '@/lib/dnd5e-data';
import { DND5E_FEATS_DB, checkFeatPrerequisites } from '@/lib/dnd5e-feats-db';
import { getAttributeModifier, applyLevelChange, getCharacterClasses, getClassLevel, recalculateSheetDerivedStats } from '@/lib/dnd5e-calculator';
import { Sparkles, Dices, Shield, Zap, CheckCircle2, ChevronRight, ChevronLeft, Award, Search, AlertCircle } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: CharacterSheet;
  targetLevel: number;
  onConfirm: (updatedSheet: CharacterSheet) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  sheet,
  targetLevel,
  onConfirm
}) => {
  const [step, setStep] = useState(0); // 0 is class selection
  const [selectedClass, setSelectedClass] = useState<string>(sheet.className);
  const [hpGained, setHpGained] = useState<number | null>(null);
  const [hpMethod, setHpMethod] = useState<'rolled' | 'average' | null>(null);
  const [pendingSubclass, setPendingSubclass] = useState<string>(sheet.subclass || '');
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiAllocated, setAsiAllocated] = useState<Partial<Record<AttributeKey, number>>>({});

  // Feats State
  const [asiChoiceMode, setAsiChoiceMode] = useState<'attributes' | 'feat'>('attributes');
  const [selectedFeat, setSelectedFeat] = useState<Omit<CharacterFeat, 'id'> | null>(null);
  const [halfFeatAttr, setHalfFeatAttr] = useState<AttributeKey>('str');
  const [featSearch, setFeatSearch] = useState('');

  const classData = DND_CLASSES[selectedClass];
  const hitDieVal = classData ? parseInt(classData.hitDie.replace('1d', ''), 10) || 8 : 8;
  const conMod = getAttributeModifier(sheet, 'con');
  const averageHp = Math.floor(hitDieVal / 2) + 1;

  const targetClassLevel = getClassLevel(sheet, selectedClass) + 1;
  const newFeatures = (CLASS_FEATURES_DB[selectedClass] || {})[targetClassLevel] || [];
  const subclassFeature = newFeatures.find(f => f.isSubclassChoice);
  
  // Classe-específica de ASI (Guerreiro ganha em 4, 6, 8, 12, 14, 16, 19 | Ladino 4, 8, 10, 12, 16, 19)
  const isAsiLevel = (() => {
    if (selectedClass === 'Guerreiro') return [4, 6, 8, 12, 14, 16, 19].includes(targetClassLevel);
    if (selectedClass === 'Ladino') return [4, 8, 10, 12, 16, 19].includes(targetClassLevel);
    return [4, 8, 12, 16, 19].includes(targetClassLevel);
  })();

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSelectedClass(sheet.className);
      setHpGained(null);
      setHpMethod(null);
      setPendingSubclass(sheet.subclass || '');
      setAsiPoints(2);
      setAsiAllocated({});
      setAsiChoiceMode('attributes');
      setSelectedFeat(null);
      setHalfFeatAttr('str');
      setFeatSearch('');
    }
  }, [isOpen, targetLevel, sheet.className, sheet.subclass]);

  if (!isOpen || !classData) return null;

  const handleRollHp = () => {
    const roll = Math.floor(Math.random() * hitDieVal) + 1;
    setHpGained(roll + conMod);
    setHpMethod('rolled');
  };

  const handleAverageHp = () => {
    setHpGained(averageHp + conMod);
    setHpMethod('average');
  };

  const handleNextStep = () => {
    if (step === 0) {
      if (selectedClass !== sheet.className) setPendingSubclass('');
      setStep(1);
    }
    else if (step === 1) setStep(2);
    else if (step === 2 && isAsiLevel) setStep(3);
    else finishLevelUp();
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const finishLevelUp = () => {
    let finalSheet = { ...sheet };

    // 0. Atualiza o array de classes do Multiclasse
    const currentClasses = getCharacterClasses(finalSheet);
    const existingClassIndex = currentClasses.findIndex(c => c.name === selectedClass);
    let isNewClass = false;
    
    if (existingClassIndex >= 0) {
      currentClasses[existingClassIndex].level += 1;
      if (pendingSubclass && currentClasses[existingClassIndex].name === selectedClass) {
        currentClasses[existingClassIndex].subclass = pendingSubclass;
        if (currentClasses[existingClassIndex].isPrimary) finalSheet.subclass = pendingSubclass;
      }
    } else {
      isNewClass = true;
      currentClasses.push({
        name: selectedClass,
        level: 1,
        subclass: pendingSubclass || undefined,
        isPrimary: false
      });
    }
    finalSheet.classes = currentClasses;

    // 1. Aplica HP
    if (hpGained !== null) {
      finalSheet.maxHp = finalSheet.maxHp + hpGained;
      finalSheet.currentHp = finalSheet.currentHp + hpGained;
    }

    // 2. Aplica ASI ou Talento (Feat)
    if (isAsiLevel) {
      if (asiChoiceMode === 'attributes') {
        finalSheet.attributes = { ...finalSheet.attributes };
        for (const [key, val] of Object.entries(asiAllocated)) {
          if (val) {
            const attr = key as AttributeKey;
            finalSheet.attributes[attr] = {
              ...finalSheet.attributes[attr],
              score: finalSheet.attributes[attr].score + val
            };
          }
        }
      } else if (asiChoiceMode === 'feat' && selectedFeat) {
        const isHalfFeat = !!selectedFeat.benefits?.attributeBonus || selectedFeat.namePt.includes('Resiliente');
        const newFeat: CharacterFeat = {
          ...selectedFeat,
          id: `feat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          chosenAttribute: isHalfFeat ? halfFeatAttr : undefined
        };

        // Aplica o +1 do Half-Feat no atributo se selecionado
        if (isHalfFeat && halfFeatAttr) {
          finalSheet.attributes = { ...finalSheet.attributes };
          finalSheet.attributes[halfFeatAttr] = {
            ...finalSheet.attributes[halfFeatAttr],
            score: finalSheet.attributes[halfFeatAttr].score + 1
          };
        }

        finalSheet.feats = [...(finalSheet.feats || []), newFeat];
        finalSheet.featuresAndTraits = `${finalSheet.featuresAndTraits || ''}\n\n[Talento] ${newFeat.namePt} (${newFeat.name}): ${newFeat.description}`.trim();
      }
      finalSheet.attributesLocked = false;
    }

    // 3. Aplica Proficiências Bônus se for Multiclasse Nova
    if (isNewClass) {
      const extraProfs = MULTICLASS_PROFICIENCIES[selectedClass];
      if (extraProfs) {
        let profStr = `Proficiências Multiclasse (${selectedClass}):\n`;
        if (extraProfs.armor && extraProfs.armor !== 'Nenhuma') profStr += `- Armadura: ${extraProfs.armor}\n`;
        if (extraProfs.weapons && extraProfs.weapons !== 'Nenhuma') profStr += `- Armas: ${extraProfs.weapons}\n`;
        finalSheet.otherProficienciesAndLanguages = `${finalSheet.otherProficienciesAndLanguages}\n\n${profStr.trim()}`.trim();
      }
    }

    // 4. Executa a lógica padrão de nível
    finalSheet = applyLevelChange(finalSheet, targetLevel, selectedClass);
    finalSheet = recalculateSheetDerivedStats(finalSheet);

    finalSheet.attributePointsAvailable = sheet.attributePointsAvailable || 0;

    onConfirm(finalSheet);
  };

  const allocateAsi = (attr: AttributeKey, amount: number) => {
    const currentAlloc = asiAllocated[attr] || 0;
    if (amount > 0 && asiPoints > 0) {
      setAsiAllocated({ ...asiAllocated, [attr]: currentAlloc + 1 });
      setAsiPoints(p => p - 1);
    } else if (amount < 0 && currentAlloc > 0) {
      setAsiAllocated({ ...asiAllocated, [attr]: currentAlloc - 1 });
      setAsiPoints(p => p + 1);
    }
  };

  const isNextDisabled = () => {
    if (step === 1 && hpGained === null) return true;
    if (step === 2 && subclassFeature && !pendingSubclass) return true;
    if (step === 3) {
      if (asiChoiceMode === 'attributes') return asiPoints > 0;
      if (asiChoiceMode === 'feat') return !selectedFeat;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#0d1117] border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Evolução de Nível
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              {sheet.className} (Nível {sheet.level} → <span className="text-cyan-300">{targetLevel}</span>)
            </p>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, isAsiLevel ? 3 : null].filter(s => s !== null).map(s => (
              <div 
                key={s} 
                className={`w-2.5 h-2.5 rounded-full transition-colors ${step === s ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : step > (s as number) ? 'bg-cyan-900' : 'bg-slate-800'}`} 
              />
            ))}
          </div>
        </div>

        {/* Corpo (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 min-h-[320px]">
          
          {/* PASSO 0: ESCOLHA DE CLASSE */}
          {step === 0 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-sm font-bold text-slate-300">Escolha a Classe para Evoluir</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(DND_CLASSES).map(c => {
                  const currentClassObj = getCharacterClasses(sheet).find(cc => cc.name === c.name);
                  const isCurrent = !!currentClassObj;
                  const currentLevel = currentClassObj ? currentClassObj.level : 0;
                  
                  let isEligible = true;
                  let reqText = '';
                  if (!isCurrent) {
                    const reqs = MULTICLASS_REQUIREMENTS[c.name];
                    if (reqs) {
                      for (const [attr, minScore] of Object.entries(reqs)) {
                        const score = sheet.attributes[attr as AttributeKey]?.score || 10;
                        if (score < minScore) {
                          isEligible = false;
                          reqText += `${attr.toUpperCase()} >= ${minScore} `;
                        }
                      }
                    }
                  }

                  return (
                    <button
                      key={c.name}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => setSelectedClass(c.name)}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-full ${
                        selectedClass === c.name
                          ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
                          : isEligible 
                            ? 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/50'
                            : 'bg-slate-900/40 border-slate-800/50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white mb-1 flex items-center justify-between">
                          {c.name}
                          {selectedClass === c.name && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="text-xs text-slate-400">
                          {isCurrent ? `Nível ${currentLevel} → ${currentLevel + 1}` : 'Nova Classe (Nível 1)'}
                        </div>
                      </div>
                      {!isEligible && (
                        <div className="text-[10px] text-rose-400/80 mt-3 bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20">
                          Req. min: {reqText}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 1: VIDA */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Dado de Vida</span>
                  <span className="text-xl font-black text-white">{classData.hitDie}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">Mod. Constituição</span>
                  <span className="text-xl font-black text-emerald-400">{conMod >= 0 ? `+${conMod}` : conMod}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleRollHp}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2
                    ${hpMethod === 'rolled' ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-slate-900/80 border-slate-700 hover:border-amber-500/50'}`}
                >
                  <Dices className={`w-8 h-8 ${hpMethod === 'rolled' ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-sm font-bold text-white">Rolar HP</span>
                </button>

                <button
                  type="button"
                  onClick={handleAverageHp}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2
                    ${hpMethod === 'average' ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20' : 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/50'}`}
                >
                  <Shield className={`w-8 h-8 ${hpMethod === 'average' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="text-sm font-bold text-white">Valor Médio</span>
                  <span className="text-xs text-slate-400">({averageHp})</span>
                </button>
              </div>

              {hpGained !== null && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-center animate-fade-in mt-4">
                  <span className="text-sm text-emerald-400/80 font-bold block mb-1">PVs Ganhos neste Nível</span>
                  <div className="text-3xl font-black text-emerald-400">+{hpGained}</div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 2: HABILIDADES & SUBCLASSE */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              {subclassFeature && (
                <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Zap className="w-5 h-5" />
                    <h3 className="font-bold">{subclassFeature.name}</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{subclassFeature.description}</p>
                  
                  <div className="pt-2">
                    <label className="text-xs font-bold text-indigo-300 uppercase mb-2 block">Escolha sua Tradição / Arquétipo:</label>
                    <select
                      value={pendingSubclass}
                      onChange={(e) => setPendingSubclass(e.target.value)}
                      className="w-full bg-slate-900 border border-indigo-500/50 text-white text-sm rounded-lg p-2.5 outline-none focus:border-indigo-400"
                    >
                      <option value="" disabled>-- Selecione --</option>
                      {subclassFeature.choices?.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Novas Habilidades (Nível {targetLevel})</h3>
                {newFeatures.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Nenhuma habilidade nova além de PVs neste nível.</p>
                ) : (
                  <div className="space-y-3">
                    {newFeatures.map((feat) => {
                      if (feat.requiresSubclass && feat.requiresSubclass !== pendingSubclass && feat.requiresSubclass !== sheet.subclass) {
                        return null;
                      }
                      if (feat.isSubclassChoice) return null;

                      return (
                        <div key={feat.name} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
                          <span className="font-bold text-cyan-300 text-sm block mb-1">{feat.name}</span>
                          <p className="text-xs text-slate-400">{feat.description}</p>
                          {feat.choices && (
                            <div className="mt-2 text-xs text-slate-500">
                              <span className="font-semibold text-slate-400">Opções: </span>
                              {feat.choices.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSO 3: ASI vs TALENTOS (FEATS) */}
          {step === 3 && (
            <div className="animate-fade-in space-y-5">
              
              {/* Seletor de Modo: Atributos ou Talento */}
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAsiChoiceMode('attributes')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    asiChoiceMode === 'attributes' 
                      ? 'bg-amber-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Atributos (+2)
                </button>
                <button
                  type="button"
                  onClick={() => setAsiChoiceMode('feat')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    asiChoiceMode === 'feat' 
                      ? 'bg-cyan-500 text-slate-950 shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Selecionar Talento (Feat)
                </button>
              </div>

              {/* MODO ATRIBUTOS (ASI PADRÃO) */}
              {asiChoiceMode === 'attributes' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-xl">
                    <h3 className="font-bold text-amber-400 text-xs mb-0.5">Incremento no Valor de Habilidade</h3>
                    <p className="text-[11px] text-slate-300">Distribua 2 pontos entre seus atributos (+2 em um ou +1 em dois).</p>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-300">Pontos Disponíveis:</span>
                    <span className="text-lg font-black text-amber-400">{asiPoints}</span>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(sheet.attributes).map(([key, attr]) => {
                      const alloc = asiAllocated[key as AttributeKey] || 0;
                      const total = attr.score + alloc;
                      
                      return (
                        <div key={key} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <span className="text-xs font-bold text-white uppercase w-12">{key}</span>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-base font-mono font-black ${alloc > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                              {total}
                            </span>
                            
                            <div className="flex bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => allocateAsi(key as AttributeKey, -1)}
                                disabled={alloc === 0}
                                className="px-2.5 py-0.5 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs"
                              >
                                -
                              </button>
                              <div className="w-px bg-slate-700" />
                              <button
                                type="button"
                                onClick={() => allocateAsi(key as AttributeKey, 1)}
                                disabled={asiPoints === 0}
                                className="px-2.5 py-0.5 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODO TALENTO (FEAT) */}
              {asiChoiceMode === 'feat' && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Busca */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar talento (ex: Alerta, Sharpshooter, Tough)..."
                      value={featSearch}
                      onChange={(e) => setFeatSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Lista de Feats */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {DND5E_FEATS_DB.filter(f => 
                      f.namePt.toLowerCase().includes(featSearch.toLowerCase()) || 
                      f.name.toLowerCase().includes(featSearch.toLowerCase())
                    ).map(feat => {
                      const isSelected = selectedFeat?.name === feat.name;
                      const prereqCheck = checkFeatPrerequisites(sheet, feat);

                      return (
                        <div
                          key={feat.name}
                          onClick={() => {
                            if (prereqCheck.met) setSelectedFeat(feat);
                          }}
                          className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-500/20 border-cyan-500 shadow-md shadow-cyan-500/20' 
                              : prereqCheck.met 
                                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700' 
                                : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-white text-xs flex items-center gap-1.5">
                              {feat.namePt} <span className="text-[10px] text-slate-500 font-normal">({feat.name})</span>
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{feat.description}</p>

                          {feat.prerequisite && (
                            <div className="mt-2 text-[10px] font-mono flex items-center gap-1 text-amber-400/90">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Pré-requisito: {feat.prerequisite}</span>
                            </div>
                          )}

                          {!prereqCheck.met && prereqCheck.reason && (
                            <div className="mt-1.5 text-[10px] text-rose-400 font-semibold">
                              ❌ {prereqCheck.reason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Seletor de Atributo para Half-Feat */}
                  {selectedFeat && (selectedFeat.benefits?.attributeBonus || selectedFeat.namePt.includes('Resiliente')) && (
                    <div className="bg-cyan-950/40 border border-cyan-500/40 p-3 rounded-xl space-y-2 animate-fade-in">
                      <span className="text-xs font-bold text-cyan-300 block">
                        Este talento concede +1 em um Atributo. Escolha o atributo:
                      </span>
                      <div className="grid grid-cols-6 gap-1">
                        {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AttributeKey[]).map(attr => (
                          <button
                            key={attr}
                            type="button"
                            onClick={() => setHalfFeatAttr(attr)}
                            className={`py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all ${
                              halfFeatAttr === attr 
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400' 
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {attr}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

        {/* Rodapé (Ações) */}
        <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>

          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isNextDisabled()}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-slate-950 rounded-xl text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {step === (isAsiLevel ? 3 : 2) ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Aplicar Nível
                </>
              ) : (
                <>
                  Avançar
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

