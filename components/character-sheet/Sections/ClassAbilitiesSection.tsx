import React, { useState } from 'react';
import { CharacterSheet, ClassFeature, CharacterResource, ActiveClassBuff } from '@/lib/types';
import { getAttributeModifier, recalculateSheetDerivedStats, hasClass } from '@/lib/dnd5e-calculator';
import { executeCheckRoll, broadcastDiceRoll } from '@/lib/dnd5e-dice';
import { Zap, Flame, Shield, Plus, Minus, Heart, Swords, ShieldAlert, Sparkles, Wand2, Award } from 'lucide-react';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface ClassAbilitiesSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const ClassAbilitiesSection: React.FC<ClassAbilitiesSectionProps> = ({
  sheet,
  onChange,
}) => {
  const { showAlert } = useCustomDialog();
  const [smiteSlotLevel, setSmiteSlotLevel] = useState<number>(1);
  const [layOnHandsAmount, setLayOnHandsAmount] = useState<number>(5);
  const [showSmiteModal, setShowSmiteModal] = useState<boolean>(false);
  const [showHandsModal, setShowHandsModal] = useState<boolean>(false);

  const resources = sheet.classResources || {};
  const activeBuffs = sheet.activeClassBuffs || [];
  const features = sheet.classFeatures || [];

  // Barbarian Rage Modifier based on level
  const getRageDamageBonus = (level: number): number => {
    if (level >= 16) return 4;
    if (level >= 9) return 3;
    return 2;
  };

  // Check if Rage is active
  const isRageActive = activeBuffs.some((b) => b.type === 'rage');

  // Toggle Rage
  const handleToggleRage = () => {
    if (isRageActive) {
      // Deactivate Rage
      const updatedBuffs = activeBuffs.filter((b) => b.type !== 'rage');
      onChange({
        ...sheet,
        activeClassBuffs: updatedBuffs,
      });
    } else {
      // Activate Rage
      const rageResource = resources['furia'];
      if (rageResource && rageResource.current <= 0 && rageResource.max !== 9999) {
        showAlert({
          title: 'Fúria Esgotada',
          message: 'Você não tem usos de Fúria restantes!',
          variant: 'warning',
        });
        return;
      }

      const updatedResources = { ...resources };
      if (rageResource && rageResource.max !== 9999) {
        updatedResources['furia'] = {
          ...rageResource,
          current: Math.max(0, rageResource.current - 1),
        };
      }

      const rageBuff: ActiveClassBuff = {
        id: 'rage-buff-' + Date.now(),
        name: 'Fúria Ativa',
        type: 'rage',
        description: `Vantagem em testes/salvaguardas de Força. +${getRageDamageBonus(sheet.level)} de dano em ataques corpo a corpo com Força. Resistência a concussão, cortante e perfurante.`,
        damageBonus: `+${getRageDamageBonus(sheet.level)}`,
      };

      // Log/broadcast rage activation
      try {
        const bc = new BroadcastChannel('masters_codex_sync');
        bc.postMessage({
          type: 'SYSTEM_MESSAGE',
          content: `${sheet.characterName} ENTRA EM FÚRIA! ⚔️🔥`,
        });
        bc.close();
      } catch (e) {}

      onChange({
        ...sheet,
        classResources: updatedResources,
        activeClassBuffs: [...activeBuffs, rageBuff],
      });
    }
  };

  // Handle Lay on Hands healing
  const handleLayOnHands = () => {
    const lohResource = resources['lay_on_hands'];
    if (!lohResource || lohResource.current < layOnHandsAmount) {
      showAlert({
        title: 'Pontos Insuficientes',
        message: 'Você não tem pontos suficientes de Mãos Curativas!',
        variant: 'warning',
      });
      return;
    }

    const updatedResources = { ...resources };
    updatedResources['lay_on_hands'] = {
      ...lohResource,
      current: Math.max(0, lohResource.current - layOnHandsAmount),
    };

    const newHp = Math.min(sheet.maxHp, sheet.currentHp + layOnHandsAmount);

    // Broadcast healing
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'SYSTEM_MESSAGE',
        content: `${sheet.characterName} usa Mãos Curativas e recupera ${layOnHandsAmount} PVs! ✨💚`,
      });
      bc.close();
    } catch (e) {}

    onChange({
      ...sheet,
      currentHp: newHp,
      classResources: updatedResources,
    });
    setShowHandsModal(false);
  };

  // Prepare Divine Smite
  const handlePrepareSmite = () => {
    const slot = sheet.spellSlots[smiteSlotLevel];
    if (!slot || slot.total === 0) {
      showAlert({
        title: 'Espaços Indisponíveis',
        message: `Você não possui espaços de magia de nível ${smiteSlotLevel}!`,
        variant: 'warning',
      });
      return;
    }
    if (slot.used >= slot.total) {
      showAlert({
        title: 'Espaços Esgotados',
        message: `Você já gastou todos os espaços de magia de nível ${smiteSlotLevel}!`,
        variant: 'warning',
      });
      return;
    }

    // Deduct spell slot
    const updatedSlots = { ...sheet.spellSlots };
    updatedSlots[smiteSlotLevel] = {
      ...slot,
      used: slot.used + 1,
    };

    // Calculate Smite damage: 2d8 for 1st level, +1d8 per level above 1st
    const diceCount = 1 + smiteSlotLevel; // e.g. level 1 = 2d8, level 2 = 3d8
    const smiteDamage = `${diceCount}d8`;

    const smiteBuff: ActiveClassBuff = {
      id: 'smite-buff-' + Date.now(),
      name: `Destruição Divina (Nível ${smiteSlotLevel})`,
      type: 'smite',
      description: `O próximo ataque bem-sucedido causará ${smiteDamage} de dano radiante extra.`,
      damageBonus: smiteDamage,
      spellSlotLevelUsed: smiteSlotLevel,
    };

    // Broadcast Smite prepared
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'SYSTEM_MESSAGE',
        content: `${sheet.characterName} canaliza poder divino! Destruição Divina preparada (Nível ${smiteSlotLevel}). ⚡🛡️`,
      });
      bc.close();
    } catch (e) {}

    onChange({
      ...sheet,
      spellSlots: updatedSlots,
      activeClassBuffs: [...activeBuffs.filter(b => b.type !== 'smite'), smiteBuff], // replace existing smite if any
    });
    setShowSmiteModal(false);
  };

  const handleUsePactSlot = () => {
    const pactSlots = resources['pact_slots'];
    if (!pactSlots || pactSlots.current <= 0) {
      showAlert({
        title: 'Sem Slots Disponíveis',
        message: 'Você não possui espaços do pacto restantes!',
        variant: 'warning',
      });
      return;
    }

    const pactSlotLevel = resources['pact_slot_level']?.current || 1;

    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'SYSTEM_MESSAGE',
        content: `${sheet.characterName} gasta um espaço de magia do pacto de nível ${pactSlotLevel}! 🔮⚡`,
      });
      bc.close();
    } catch (e) {}

    onChange({
      ...sheet,
      classResources: {
        ...resources,
        pact_slots: {
          ...pactSlots,
          current: pactSlots.current - 1
        }
      }
    });
  };

  const handleFortunaSubmundo = () => {
    const fortunaRes = resources['fortuna_submundo'];
    if (!fortunaRes || fortunaRes.current <= 0) {
      showAlert({
        title: 'Recurso Esgotado',
        message: 'Você já usou Fortuna do Submundo! Requer descanso curto ou longo para recarregar.',
        variant: 'warning',
      });
      return;
    }

    // Roll 1d10
    const roll = Math.floor(Math.random() * 10) + 1;

    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'SYSTEM_MESSAGE',
        content: `🍀 ${sheet.characterName} usa Fortuna do Submundo e adiciona +${roll} em um teste ou salvaguarda!`,
      });
      bc.close();
    } catch (e) {}

    onChange({
      ...sheet,
      classResources: {
        ...resources,
        fortuna_submundo: {
          ...fortunaRes,
          current: 0
        }
      }
    });
  };

  const handleLancarInferno = () => {
    const lancarRes = resources['lancar_inferno'];
    if (!lancarRes || lancarRes.current <= 0) {
      showAlert({
        title: 'Recurso Esgotado',
        message: 'Você já usou Lançar no Inferno! Requer descanso longo para recarregar.',
        variant: 'warning',
      });
      return;
    }

    // Roll 10d10
    let damage = 0;
    for (let i = 0; i < 10; i++) {
      damage += Math.floor(Math.random() * 10) + 1;
    }

    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'SYSTEM_MESSAGE',
        content: `🔥 ${sheet.characterName} LANÇA o alvo NO INFERNO! Causa ${damage} de dano psíquico extra e o alvo desaparece até o final do próximo turno!`,
      });
      bc.close();
    } catch (e) {}

    onChange({
      ...sheet,
      classResources: {
        ...resources,
        lancar_inferno: {
          ...lancarRes,
          current: 0
        }
      }
    });
  };

  // Adjust resource values manually
  const adjustResource = (key: string, amount: number) => {
    const res = resources[key];
    if (!res) return;
    const newCurrent = Math.max(0, Math.min(res.max, res.current + amount));
    onChange({
      ...sheet,
      classResources: {
        ...resources,
        [key]: { ...res, current: newCurrent },
      },
    });
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-in select-none lg:grid lg:grid-cols-2 lg:gap-4 lg:h-full lg:overflow-hidden lg:min-h-0">
      
      {/* COLUNA ESQUERDA: RECURSOS ATIVOS E TRIGERERS */}
      <div className="space-y-4 lg:overflow-y-auto lg:h-full lg:pr-2 bg3-scrollbar lg:pb-6">
        
        {/* SEÇÃO 1: RECURSOS ATIVOS DA CLASSE */}
        {Object.keys(resources).length > 0 && (
          <div className="bg3-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">Recursos de Classe</h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {Object.keys(resources).map((key) => {
                const res = resources[key];
                return (
                  <div key={key} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
                    <div>
                      <span className="text-xs font-extrabold text-slate-350 block font-serif">{res.label}</span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {res.max === 9999 ? 'Uso Ilimitado' : `Máximo: ${res.max}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {res.max !== 9999 && (
                        <button
                          type="button"
                          onClick={() => adjustResource(key, -1)}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="text-sm font-black text-amber-400 font-mono w-10 text-center">
                        {res.max === 9999 ? '∞' : `${res.current} / ${res.max}`}
                      </span>

                      {res.max !== 9999 && (
                        <button
                          type="button"
                          onClick={() => adjustResource(key, 1)}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEÇÃO 2: HABILIDADES ATIVAS */}
        <div className="bg3-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-rose-500/15 pb-2">
            <Swords className="w-4 h-4 text-rose-450" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-450 font-serif">Habilidades Ativas</h3>
          </div>

          <div className="space-y-2.5">
            {/* Bárbaro - Fúria */}
            {hasClass(sheet, 'Bárbaro') && (
              <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 shadow-inner">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Flame className={`w-4 h-4 ${isRageActive ? 'text-orange-500 animate-pulse' : 'text-slate-500'}`} />
                    <span className="text-xs font-black text-white font-serif">Fúria (Rage)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-serif">
                    Vantagem em Força, dano corpo a corpo (+{getRageDamageBonus(sheet.level)}) e resistências a danos físicos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleRage}
                  className={`w-full py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isRageActive
                      ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      : 'bg-orange-500 hover:bg-orange-400 text-slate-950'
                  }`}
                >
                  {isRageActive ? 'Encerrar Fúria' : 'Entrar em Fúria'}
                </button>
              </div>
            )}

            {/* Paladino - Divine Smite / Lay on Hands */}
            {hasClass(sheet, 'Paladino') && (
              <>
                <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 shadow-inner">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black text-white font-serif">Destruição Divina</span>
                      {activeBuffs.some(b => b.type === 'smite') && (
                        <span className="text-[8px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                          PREPARADO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-serif">
                      Imbui seu próximo ataque com dano radiante extra de 2d8 (+1d8 por nível de slot superior).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSmiteModal(true)}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Preparar Smite
                  </button>
                </div>

                <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 shadow-inner">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white font-serif">Mãos Curativas (Lay on Hands)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal font-serif">
                      Gaste pontos de sua reserva de cura para restaurar PVs ou neutralizar doenças.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHandsModal(true)}
                    className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer"
                  >
                    Curar Criatura
                  </button>
                </div>
              </>
            )}

            {/* Bruxo - Habilidades Ativas */}
            {hasClass(sheet, 'Bruxo') && (
              <>
                {resources['pact_slots'] && (
                  <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-black text-white font-serif">Gastar Slot do Pacto</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-serif">
                        Gaste um espaço de magia do pacto de {resources['pact_slot_level']?.current || 1}º círculo.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUsePactSlot}
                      disabled={(resources['pact_slots']?.current || 0) <= 0}
                      className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-650 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                    >
                      Gastar Slot do Pacto
                    </button>
                  </div>
                )}

                {resources['fortuna_submundo'] && (
                  <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span className="text-xs font-black text-white font-serif">Fortuna do Submundo</span>
                        {resources['fortuna_submundo']?.current === 0 && (
                          <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full border border-red-900 font-serif">
                            USADO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-serif">
                        Adicione 1d10 a um teste ou salvaguarda após rolar (recarrega em descanso curto/longo).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleFortunaSubmundo}
                      disabled={(resources['fortuna_submundo']?.current || 0) <= 0}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-650 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                    >
                      Invocar Fortuna do Submundo
                    </button>
                  </div>
                )}

                {resources['lancar_inferno'] && (
                  <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-3 shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-black text-white font-serif">Lançar no Inferno</span>
                        {resources['lancar_inferno']?.current === 0 && (
                          <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full border border-red-900 font-serif">
                            USADO
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal font-serif">
                        Transporte o alvo pelos planos inferiores ao acertar um ataque. Causa 10d10 psíquico.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLancarInferno}
                      disabled={(resources['lancar_inferno']?.current || 0) <= 0}
                      className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-650 text-white font-black rounded-xl text-xs cursor-pointer"
                    >
                      Lançar no Inferno (10d10)
                    </button>
                  </div>
                )}
              </>
            )}

            {!hasClass(sheet, 'Bárbaro') && !hasClass(sheet, 'Paladino') && !hasClass(sheet, 'Bruxo') && (
              <div className="text-center py-6 text-xs text-slate-500 italic font-serif">
                Esta classe não possui habilidades de combate ativas integradas.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* COLUNA DIREITA: PASSIVAS E FEATS */}
      <div className="space-y-4 lg:overflow-y-auto lg:h-full lg:pr-2 bg3-scrollbar lg:pb-6">
        
        {/* SEÇÃO 3: CARACTERÍSTICAS DA CLASSE */}
        <div className="bg3-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-serif">Características da Classe</h3>
          </div>

          <div className="space-y-2.5">
            {features.length > 0 ? (
              features.map((feat) => (
                <div key={feat.id} className="bg-[#0b0f19]/60 border border-slate-800/80 rounded-xl p-3 space-y-1 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-300 font-serif">{feat.name}</span>
                    <span className="text-[8px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      Nível {feat.level}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-serif">{feat.description}</p>
                  {feat.activation && feat.activation !== 'none' && (
                    <span className="inline-block text-[8px] font-bold text-cyan-400 mt-1 font-serif">
                      Ativação: {feat.activation === 'action' ? 'Ação' : feat.activation === 'bonus_action' ? 'Ação Bônus' : feat.activation === 'reaction' ? 'Reação' : 'Especial'}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-500 italic font-serif">
                Nenhuma característica cadastrada.
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO 4: TALENTOS ADQUIRIDOS (FEATS) */}
        {sheet.feats && sheet.feats.length > 0 && (
          <div className="bg3-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-cyan-500/15 pb-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-serif">Talentos (Feats) Adquiridos</h3>
            </div>

            <div className="space-y-2.5">
              {sheet.feats.map((feat) => (
                <div key={feat.id} className="bg-[#0b0f19]/80 border border-slate-800 rounded-xl p-3 shadow-inner space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5 font-serif">
                      {feat.namePt} <span className="text-[9px] text-slate-500 font-normal">({feat.name})</span>
                    </span>
                    <span className="text-[8px] font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800 uppercase font-serif">
                      {feat.category || 'Talento'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-350 leading-relaxed font-serif">{feat.description}</p>
                  {feat.chosenAttribute && (
                    <span className="inline-block text-[9px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20 font-serif uppercase">
                      Bônus: {feat.chosenAttribute.toUpperCase()} +1
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MODALS DE PALADINO FORA DO GRID LAYOUT
          ========================================== */}

      {/* MODAL DE SELEÇÃO DE SLOTS DO SMITE */}
      {showSmiteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0f0e0d] border border-amber-500/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 font-serif">
                <Sparkles className="w-4 h-4" />
                Destruição Divina
              </span>
              <button type="button" onClick={() => setShowSmiteModal(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">Fechar</button>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] text-slate-400 font-serif">Escolha o nível do Espaço de Magia:</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const slot = sheet.spellSlots[lvl];
                  const hasSlot = slot && slot.total > 0;
                  const available = slot ? slot.total - slot.used : 0;
                  const isSelected = smiteSlotLevel === lvl;

                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={!hasSlot || available <= 0}
                      onClick={() => setSmiteSlotLevel(lvl)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        !hasSlot || available <= 0
                          ? 'opacity-40 border-slate-800 bg-slate-900/40 cursor-not-allowed text-slate-650'
                          : isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-extrabold'
                          : 'border-slate-850 bg-[#141b2d] text-slate-350 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-black font-mono">{lvl}º Lvl</span>
                      <span className="text-[9px]">{hasSlot ? `${available} rest.` : 'N/A'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSmiteModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePrepareSmite}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Swords className="w-3.5 h-3.5" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE MÃOS CURATIVAS */}
      {showHandsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-[#0f0e0d] border border-emerald-500/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5 font-serif">
                <Heart className="w-4 h-4" />
                Mãos Curativas
              </span>
              <button type="button" onClick={() => setShowHandsModal(false)} className="text-slate-400 hover:text-white text-xs cursor-pointer">Fechar</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-serif">
                <span className="text-slate-450">Reserva Restante:</span>
                <span className="font-extrabold text-emerald-400 font-mono">
                  {resources['lay_on_hands']?.current || 0} / {resources['lay_on_hands']?.max || 0} PVs
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-serif">Quantidade de cura a aplicar:</label>
                <div className="flex items-center justify-between bg-[#141b2d] border border-slate-800 rounded-xl p-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => setLayOnHandsAmount(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-200 cursor-pointer"
                  >
                    -1
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={resources['lay_on_hands']?.current || 5}
                    value={layOnHandsAmount}
                    onChange={(e) => setLayOnHandsAmount(Math.max(1, Math.min(resources['lay_on_hands']?.current || 5, parseInt(e.target.value, 10) || 5)))}
                    className="w-16 text-center bg-transparent font-black text-xs text-white focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setLayOnHandsAmount(prev => Math.min(resources['lay_on_hands']?.current || 5, prev + 1))}
                    className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-200 cursor-pointer"
                  >
                    +1
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowHandsModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLayOnHands}
                className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5" />
                Aplicar Cura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
