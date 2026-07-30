import React, { useState, useEffect } from 'react';
import { CharacterSheet, AttributeKey } from '@/lib/types';
import { DND_CLASSES, CLASS_FEATURES_DB, MULTICLASS_REQUIREMENTS, MULTICLASS_PROFICIENCIES } from '@/lib/dnd5e-data';
import { getAttributeModifier, applyLevelChange, getCharacterClasses, getClassLevel } from '@/lib/dnd5e-calculator';
import { Sparkles, Dices, Shield, Zap, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

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

  const classData = DND_CLASSES[selectedClass];
  const hitDieVal = classData ? parseInt(classData.hitDie.replace('1d', ''), 10) || 8 : 8;
  const conMod = getAttributeModifier(sheet, 'con');
  const averageHp = Math.floor(hitDieVal / 2) + 1;

  const targetClassLevel = getClassLevel(sheet, selectedClass) + 1;
  const newFeatures = (CLASS_FEATURES_DB[selectedClass] || {})[targetClassLevel] || [];
  const subclassFeature = newFeatures.find(f => f.choices && f.choices.length > 0);
  const isAsiLevel = [4, 8, 12, 16, 19].includes(targetClassLevel);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setSelectedClass(sheet.className);
      setHpGained(null);
      setHpMethod(null);
      setPendingSubclass(sheet.subclass || '');
      setAsiPoints(2);
      setAsiAllocated({});
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
      // Check if trying to add a new class, reset pending subclass just in case
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
        // Se for a primária, atualiza tbm na raiz
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
      finalSheet.currentHp = finalSheet.currentHp + hpGained; // Cura o valor ganho
    }

    // 2. Aplica ASI
    if (isAsiLevel) {
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

    // 4. Executa a lógica padrão de nível (que agora usa a array classes atualizada)
    finalSheet = applyLevelChange(finalSheet, targetLevel, selectedClass);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-[#0d1117] border border-cyan-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
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
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 min-h-[300px]">
          
          {/* PASSO 0: ESCOLHA DE CLASSE */}
          {step === 0 && (
            <div className="animate-fade-in space-y-4">
              <h3 className="text-sm font-bold text-slate-300">Escolha a Classe para Evoluir</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(DND_CLASSES).map(c => {
                  const currentClassObj = getCharacterClasses(sheet).find(cc => cc.name === c.name);
                  const isCurrent = !!currentClassObj;
                  const currentLevel = currentClassObj ? currentClassObj.level : 0;
                  
                  // Verificar Requisitos de Multiclasse se for classe nova
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
                      // Se requer subclasse e não é a que o jogador escolheu, pula
                      if (feat.requiresSubclass && feat.requiresSubclass !== pendingSubclass && feat.requiresSubclass !== sheet.subclass) {
                        return null;
                      }
                      if (feat.choices) return null; // Já renderizamos no painel especial acima

                      return (
                        <div key={feat.name} className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg">
                          <span className="font-bold text-cyan-300 text-sm block mb-1">{feat.name}</span>
                          <p className="text-xs text-slate-400">{feat.description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASSO 3: ASI (ATRIBUTOS) */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl">
                <h3 className="font-bold text-amber-400 mb-1">Incremento no Valor de Habilidade</h3>
                <p className="text-xs text-slate-300">Distribua os pontos abaixo entre seus atributos para aumentá-los.</p>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-sm font-bold text-slate-300">Pontos Disponíveis:</span>
                <span className="text-xl font-black text-amber-400">{asiPoints}</span>
              </div>

              <div className="space-y-2">
                {Object.entries(sheet.attributes).map(([key, attr]) => {
                  const alloc = asiAllocated[key as AttributeKey] || 0;
                  const total = attr.score + alloc;
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-sm font-bold text-white uppercase w-12">{key}</span>
                      
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-mono font-black ${alloc > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                          {total}
                        </span>
                        
                        <div className="flex bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => allocateAsi(key as AttributeKey, -1)}
                            disabled={alloc === 0}
                            className="px-3 py-1 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 font-bold"
                          >
                            -
                          </button>
                          <div className="w-px bg-slate-700" />
                          <button
                            type="button"
                            onClick={() => allocateAsi(key as AttributeKey, 1)}
                            disabled={asiPoints === 0}
                            className="px-3 py-1 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 font-bold"
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
              disabled={(step === 1 && hpGained === null) || (step === 2 && subclassFeature && !pendingSubclass) || (step === 3 && asiPoints > 0)}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-slate-950 rounded-xl text-sm font-black transition-all flex items-center gap-1.5"
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
