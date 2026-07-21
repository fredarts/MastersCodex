import React, { useState } from 'react';
import { AdvantageMode, AttributeKey, CharacterSheet, CharacterWeaponAttack, DiceRollEvent } from '@/lib/types';
import { formatModifier, getAttributeModifier, recalculateSheetDerivedStats, ARMOR_TABLE, calculateArmorClass } from '@/lib/dnd5e-calculator';
import { executeCheckRoll, executeWeaponAttackRoll } from '@/lib/dnd5e-dice';
import { Shield, Heart, Zap, Crosshair, Plus, Minus, Trash2, Skull, Dices, Lock, Unlock, RotateCcw, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { WeaponCompendiumModal } from '../Modals/WeaponCompendiumModal';

interface CombatSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
  advantageMode?: AdvantageMode;
  onRoll?: (event: DiceRollEvent) => void;
}

const ATTRIBUTE_LABELS: Record<AttributeKey, { title: string; desc: string }> = {
  str: { title: 'Força', desc: 'Atletas, Corpo a Corpo' },
  dex: { title: 'Destreza', desc: 'Agilidade, Esquiva, Furtividade' },
  con: { title: 'Constituição', desc: 'Vitalidade, Vigor, Concentração' },
  int: { title: 'Inteligência', desc: 'Conhecimento, Magia Arcana' },
  wis: { title: 'Sabedoria', desc: 'Percepção, Intuição, Magia Divina' },
  cha: { title: 'Carisma', desc: 'Liderança, Persuasão, Presença' },
};

export interface Roll4d6Result {
  attrKey: AttributeKey;
  title: string;
  dice: number[];
  droppedIndex: number;
  total: number;
}

export const CombatSection: React.FC<CombatSectionProps> = ({
  sheet,
  onChange,
  advantageMode = 'normal',
  onRoll,
}) => {
  const [showWeaponCompendium, setShowWeaponCompendium] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [show4d6Modal, setShow4d6Modal] = useState(false);
  const [rolled4d6Set, setRolled4d6Set] = useState<Record<AttributeKey, Roll4d6Result> | null>(null);

  // Estado da sessão baseline para possibilitar o botão de Resetar
  const [sessionBaseline, setSessionBaseline] = useState<{
    attributes: Record<AttributeKey, number>;
    pointsAvailable: number;
  } | null>(null);

  const isLocked = sheet.attributesLocked ?? (sheet.attributePointsAvailable !== undefined ? sheet.attributePointsAvailable === 0 : true);
  const pointsAvailable = sheet.attributePointsAvailable ?? 0;

  // Garante que capturamos o snapshot inicial para resetar se arrepender
  const ensureSessionBaseline = () => {
    if (!sessionBaseline) {
      const scores: Record<AttributeKey, number> = {
        str: sheet.attributes.str.score,
        dex: sheet.attributes.dex.score,
        con: sheet.attributes.con.score,
        int: sheet.attributes.int.score,
        wis: sheet.attributes.wis.score,
        cha: sheet.attributes.cha.score,
      };
      setSessionBaseline({
        attributes: scores,
        pointsAvailable,
      });
    }
  };

  // Função para gerar rolagem de 4d6 descartando o menor
  const roll4d6AttributeSet = (): Record<AttributeKey, Roll4d6Result> => {
    const keys: AttributeKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const res: Record<string, Roll4d6Result> = {};

    keys.forEach((key) => {
      const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      let lowestIdx = 0;
      for (let i = 1; i < 4; i++) {
        if (dice[i] < dice[lowestIdx]) {
          lowestIdx = i;
        }
      }
      const sum = dice.reduce((acc, d, idx) => (idx === lowestIdx ? acc : acc + d), 0);
      res[key] = {
        attrKey: key,
        title: ATTRIBUTE_LABELS[key].title,
        dice,
        droppedIndex: lowestIdx,
        total: sum,
      };
    });

    return res as Record<AttributeKey, Roll4d6Result>;
  };

  const handleOpen4d6Modal = () => {
    setRolled4d6Set(roll4d6AttributeSet());
    setShow4d6Modal(true);
  };

  const handleReroll4d6All = () => {
    setRolled4d6Set(roll4d6AttributeSet());
  };

  const handleApply4d6Results = () => {
    if (!rolled4d6Set) return;
    ensureSessionBaseline();

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: 0,
      attributesLocked: true,
      attributes: {
        str: { ...sheet.attributes.str, score: rolled4d6Set.str.total },
        dex: { ...sheet.attributes.dex, score: rolled4d6Set.dex.total },
        con: { ...sheet.attributes.con, score: rolled4d6Set.con.total },
        int: { ...sheet.attributes.int, score: rolled4d6Set.int.total },
        wis: { ...sheet.attributes.wis, score: rolled4d6Set.wis.total },
        cha: { ...sheet.attributes.cha, score: rolled4d6Set.cha.total },
      },
    };

    onChange(recalculateSheetDerivedStats(updatedSheet));
    setShow4d6Modal(false);
    setSessionBaseline(null);
  };

  const handleStartPointBuy27 = () => {
    ensureSessionBaseline();
    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: 27,
      attributesLocked: false,
      attributes: {
        str: { ...sheet.attributes.str, score: 8 },
        dex: { ...sheet.attributes.dex, score: 8 },
        con: { ...sheet.attributes.con, score: 8 },
        int: { ...sheet.attributes.int, score: 8 },
        wis: { ...sheet.attributes.wis, score: 8 },
        cha: { ...sheet.attributes.cha, score: 8 },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleIncrementAttribute = (attrKey: AttributeKey) => {
    if (pointsAvailable <= 0) return;
    ensureSessionBaseline();

    const currentScore = sheet.attributes[attrKey].score;
    if (currentScore >= 30) return;

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: pointsAvailable - 1,
      attributesLocked: false,
      attributes: {
        ...sheet.attributes,
        [attrKey]: { ...sheet.attributes[attrKey], score: currentScore + 1 },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleDecrementAttribute = (attrKey: AttributeKey) => {
    const currentScore = sheet.attributes[attrKey].score;
    const baselineScore = sessionBaseline?.attributes[attrKey] ?? currentScore;

    // Só permite decrementar se for maior que o baseline da sessão ou se tiver pontos
    if (currentScore <= Math.min(baselineScore, 1)) return;

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: pointsAvailable + 1,
      attributesLocked: false,
      attributes: {
        ...sheet.attributes,
        [attrKey]: { ...sheet.attributes[attrKey], score: currentScore - 1 },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleScoreDirectChange = (attrKey: AttributeKey, newScore: number) => {
    ensureSessionBaseline();
    const safeScore = Math.max(1, Math.min(30, newScore));
    const updatedSheet = {
      ...sheet,
      attributes: {
        ...sheet.attributes,
        [attrKey]: { ...sheet.attributes[attrKey], score: safeScore },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleAvailablePointsChange = (newPoints: number) => {
    ensureSessionBaseline();
    const safePoints = Math.max(0, newPoints);
    onChange({
      ...sheet,
      attributePointsAvailable: safePoints,
      attributesLocked: safePoints === 0 ? isLocked : false,
    });
  };

  const handleGrantGmPoints = (amount: number) => {
    ensureSessionBaseline();
    onChange({
      ...sheet,
      attributePointsAvailable: (pointsAvailable || 0) + amount,
      attributesLocked: false,
    });
  };

  const handleResetDistribution = () => {
    if (!sessionBaseline) return;
    const resetAttributes = { ...sheet.attributes };
    (Object.keys(sessionBaseline.attributes) as AttributeKey[]).forEach((key) => {
      resetAttributes[key] = {
        ...resetAttributes[key],
        score: sessionBaseline.attributes[key],
      };
    });

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: sessionBaseline.pointsAvailable,
      attributesLocked: false,
      attributes: resetAttributes,
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
    setSessionBaseline(null);
  };

  const handleConfirmCompletion = () => {
    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributesLocked: true,
      attributePointsAvailable: Math.max(0, pointsAvailable),
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
    setSessionBaseline(null);
    setShowConfirmModal(false);
  };

  const handleUnlockByGm = () => {
    ensureSessionBaseline();
    onChange({
      ...sheet,
      attributesLocked: false,
    });
  };

  const handleRollAttribute = (attrKey: AttributeKey) => {
    const mod = getAttributeModifier(sheet, attrKey);
    const label = `Teste de ${ATTRIBUTE_LABELS[attrKey].title}`;
    const result = executeCheckRoll({
      sheet,
      label,
      modifier: mod,
      rollType: 'attribute',
      advantageMode,
    });
    if (onRoll) onRoll(result);
  };

  const handleRollWeapon = (atk: CharacterWeaponAttack) => {
    const { attackRoll, damageRoll } = executeWeaponAttackRoll({
      sheet,
      weaponName: atk.name,
      atkBonusStr: atk.atkBonus,
      damageStr: atk.damage,
      damageType: atk.type,
      advantageMode,
    });
    if (onRoll) {
      onRoll(attackRoll);
      setTimeout(() => onRoll(damageRoll), 500);
    }
  };

  const handleAddAttack = () => {
    setShowWeaponCompendium(true);
  };

  const handleAddWeaponFromCompendium = (attack: CharacterWeaponAttack) => {
    onChange(recalculateSheetDerivedStats({ ...sheet, attacks: [...sheet.attacks, attack] }));
  };

  const handleRemoveAttack = (id: string) => {
    onChange({ ...sheet, attacks: sheet.attacks.filter((a) => a.id !== id) });
  };

  const handleUpdateAttack = (id: string, updated: Partial<CharacterWeaponAttack>) => {
    onChange({
      ...sheet,
      attacks: sheet.attacks.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    });
  };

  const dexMod = getAttributeModifier(sheet, 'dex');
  const hasChangesToReset = sessionBaseline !== null;

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* 6 ATRIBUTOS PRINCIPAIS GRID + PAINEL DE PONTOS E TRAVA */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">

        {/* HEADER DE ATRIBUTOS COM PONTOS DISPONÍVEIS E BOTÕES DE AÇÃO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Atributos Principais</h3>
            {isLocked ? (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3 text-amber-500" />
                Travado (Nível 4/8/12/16/19 ou Mestre)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                <Unlock className="w-3 h-3 text-emerald-400" />
                Modo Distribuição
              </span>
            )}
          </div>

          {/* BARRA DE AÇÕES: CONTADOR DE PONTOS, 4d6, RESET E CONCLUIR */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BOTÃO ROLAR 4d6 (DESCARTAR MENOR) */}
            <button
              type="button"
              onClick={handleOpen4d6Modal}
              className="text-[10px] font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Simular rolagem de 4d6 descartando o menor dado para os 6 atributos"
            >
              <Dices className="w-3.5 h-3.5 text-cyan-400" />
              Rolar 4d6 (Descartar Menor)
            </button>

            {/* BOTÃO INICIAR POINT BUY 27 PTS (Se estiver travado ou sem pontos) */}
            {(isLocked || pointsAvailable === 0) && (
              <button
                type="button"
                onClick={handleStartPointBuy27}
                className="text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Iniciar distribuição com 27 pontos base D&D 5e"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                Point Buy (27 Pts)
              </button>
            )}

            {/* TEXT BOX DE PONTOS DISPONÍVEIS */}
            {!isLocked && (
              <div className="flex items-center gap-1.5 bg-[#0b0f19] border border-amber-500/30 rounded-xl px-2.5 py-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Pontos para Investir:</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={pointsAvailable}
                  onChange={(e) => handleAvailablePointsChange(parseInt(e.target.value, 10) || 0)}
                  className="w-10 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                  title="Pontos livres para investir nos atributos"
                />
              </div>
            )}

            {/* BOTÃO CONCEDER PONTOS (MESTRE / ASI) */}
            <button
              type="button"
              onClick={() => handleGrantGmPoints(2)}
              className="text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              title="Adicionar +2 Pontos de Atributo (Evolução de Nível ou Concessão do Mestre)"
            >
              <Plus className="w-3 h-3" />
              +2 Pts (Mestre)
            </button>

            {/* BOTÃO RESETAR (Só ativo durante a distribuição e se tiver alterações) */}
            {!isLocked && (
              <button
                type="button"
                onClick={handleResetDistribution}
                disabled={!hasChangesToReset}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                  hasChangesToReset
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed'
                }`}
                title="Desfaz todas as alterações feitas nesta sessão de pontos"
              >
                <RotateCcw className="w-3 h-3" />
                Resetar
              </button>
            )}

            {/* BOTÃO CONCLUIR / CONFIRMAR E TRAVAR */}
            {!isLocked ? (
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluir
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUnlockByGm}
                className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                title="Desbloquear atributos para edição do Mestre"
              >
                <Unlock className="w-3 h-3 text-amber-400" />
                Editar (Mestre)
              </button>
            )}
          </div>
        </div>

        {/* GRID DOS 6 ATRIBUTOS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((attrKey) => {
            const info = ATTRIBUTE_LABELS[attrKey];
            const score = sheet.attributes[attrKey].score;
            const mod = getAttributeModifier(sheet, attrKey);
            const baselineScore = sessionBaseline?.attributes[attrKey] ?? score;
            const canDecrease = !isLocked && score > Math.min(baselineScore, 1);
            const canIncrease = !isLocked && pointsAvailable > 0 && score < 30;

            return (
              <div
                key={attrKey}
                className={`bg-[#0b0f19] border rounded-xl p-3 flex flex-col items-center justify-between text-center shadow-inner relative transition-all ${
                  !isLocked && pointsAvailable > 0
                    ? 'border-amber-500/50 hover:border-amber-400 shadow-amber-500/5'
                    : 'border-slate-800'
                }`}
              >
                <span className="text-[11px] font-extrabold uppercase text-slate-300">{info.title}</span>
                <span className="text-[9px] text-slate-500 line-clamp-1">{info.desc}</span>

                {/* MODIFICADOR EM DESTAQUE (CLICÁVEL PARA ROLAGEM D20) */}
                <button
                  type="button"
                  onClick={() => handleRollAttribute(attrKey)}
                  className="my-2 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 rounded-xl px-3 py-1 w-full flex items-center justify-center gap-1 group active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Clique para rolar o teste d20"
                >
                  <Dices className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                  <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    {formatModifier(mod)}
                  </span>
                </button>

                {/* PAINEL DE CONTROLE DE VALOR BRUTO DO ATRIBUTO */}
                {isLocked ? (
                  /* ATRIBUTO TRAVADO */
                  <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-0.5">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-400 font-semibold">Valor:</span>
                    <span className="text-xs font-black text-white font-mono">{score}</span>
                  </div>
                ) : (
                  /* CONTROLES + / - DURANTE A DISTRIBUIÇÃO */
                  <div className="flex items-center justify-between w-full bg-slate-900 border border-amber-500/30 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleDecrementAttribute(attrKey)}
                      disabled={!canDecrease}
                      className="w-7 h-7 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 font-bold text-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      title="Diminuir ponto de atributo"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={score}
                      onChange={(e) => handleScoreDirectChange(attrKey, parseInt(e.target.value, 10) || 10)}
                      className="w-10 text-center bg-transparent font-black text-sm text-white focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleIncrementAttribute(attrKey)}
                      disabled={!canIncrease}
                      className="w-7 h-7 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 font-bold text-sm flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      title="Adicionar ponto de atributo"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE CONCLUSÃO DE DISTRIBUIÇÃO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#0d1117] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-amber-400">Confirmar Distribuição de Atributos</h3>
                <p className="text-[11px] text-slate-400">Travar alterações e concluir investimento</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#141b2d] border border-slate-800 rounded-xl p-3">
              Tem certeza que deseja concluir a distribuição? Os atributos serão <strong className="text-amber-400">travados</strong> e o botão de Resetar deixará de ficar ativo até a próxima evolução de nível (4, 8, 12, 16, 19) ou concessão do Mestre.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar & Travar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAINEL DE COMBATE (CA, INICIATIVA, DESLOCAMENTO, DADOS DE VIDA) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CA (CLASSE DE ARMADURA DINÂMICA) */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-between text-center shadow-lg space-y-1">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">CA Total</span>
          </div>
          <span className="text-2xl font-black text-amber-300 font-mono my-0.5">
            {sheet.armorClass}
          </span>
          <div className="w-full space-y-1">
            <select
              value={sheet.equippedArmor || 'Nenhuma'}
              onChange={(e) => {
                const updated = { ...sheet, equippedArmor: e.target.value };
                onChange(recalculateSheetDerivedStats(updated));
              }}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 py-0.5 px-1 focus:outline-none"
            >
              {Object.keys(ARMOR_TABLE).map((armorName) => (
                <option key={armorName} value={armorName}>{armorName}</option>
              ))}
            </select>
            <label className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={sheet.hasShield || false}
                onChange={(e) => {
                  const updated = { ...sheet, hasShield: e.target.checked };
                  onChange(recalculateSheetDerivedStats(updated));
                }}
                className="rounded border-slate-700 bg-slate-900 text-amber-500"
              />
              Escudo (+2 CA)
            </label>
          </div>
        </div>

        {/* INICIATIVA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Zap className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Iniciativa</span>
          <button
            type="button"
            onClick={() => {
              const res = executeCheckRoll({
                sheet,
                label: 'Rolagem de Iniciativa',
                modifier: dexMod + sheet.initiativeBonus,
                rollType: 'attribute',
                advantageMode,
              });
              if (onRoll) onRoll(res);
            }}
            className="text-xl font-black text-amber-300 mt-1 font-mono hover:text-amber-200 cursor-pointer flex items-center gap-1"
          >
            <Dices className="w-3.5 h-3.5" />
            {formatModifier(dexMod + sheet.initiativeBonus)}
          </button>
          <span className="text-[9px] text-slate-500">(DES {formatModifier(dexMod)})</span>
        </div>

        {/* DESLOCAMENTO */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Crosshair className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Deslocamento</span>
          <input
            type="text"
            value={sheet.speed}
            onChange={(e) => onChange({ ...sheet, speed: e.target.value })}
            className="w-full text-center bg-[#0b0f19] border border-slate-700 rounded-xl py-1 mt-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* DADOS DE VIDA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Heart className="w-5 h-5 text-rose-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Dados de Vida</span>
          <span className="text-sm font-black text-rose-300 mt-1 font-mono">{sheet.hitDiceTotal}</span>
          <span className="text-[9px] text-slate-500">Usados: {sheet.hitDiceUsed}</span>
        </div>
      </div>

      {/* VITALIDADE & DANO (PONTOS DE VIDA) */}
      <div className="bg-[#141b2d] border border-rose-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            Pontos de Vida (PV)
          </h3>
          <span className="text-xs font-extrabold text-slate-300">
            {sheet.currentHp} / {sheet.maxHp} HP
          </span>
        </div>

        {/* BARRA DE PROGRESSO DE HP */}
        <div className="w-full bg-[#0b0f19] h-3 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              sheet.currentHp <= sheet.maxHp * 0.25
                ? 'bg-rose-600 animate-pulse'
                : sheet.currentHp <= sheet.maxHp * 0.5
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (sheet.currentHp / (sheet.maxHp || 1)) * 100))}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">PV Atual</label>
            <input
              type="number"
              value={sheet.currentHp}
              onChange={(e) => onChange({ ...sheet, currentHp: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#0b0f19] border border-rose-500/40 rounded-xl py-2 text-center text-sm font-bold text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">PV Máximo</label>
            <input
              type="number"
              value={sheet.maxHp}
              onChange={(e) => onChange({ ...sheet, maxHp: parseInt(e.target.value, 10) || 1 })}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 text-center text-sm font-bold text-slate-300 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">PV Temporário</label>
            <input
              type="number"
              value={sheet.tempHp}
              onChange={(e) => onChange({ ...sheet, tempHp: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#0b0f19] border border-amber-500/40 rounded-xl py-2 text-center text-sm font-bold text-amber-300 focus:outline-none"
            />
          </div>
        </div>

        {/* TESTES CONTRA A MORTE */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              Testes Contra a Morte (Death Saves)
            </span>
            <button
              type="button"
              onClick={() => {
                const res = executeCheckRoll({
                  sheet,
                  label: 'Teste Contra a Morte (Death Save)',
                  modifier: 0,
                  rollType: 'saving_throw',
                  advantageMode,
                });
                if (onRoll) onRoll(res);

                // Auto atualiza falha/sucesso
                if ((res.selectedD20 ?? 10) >= 10) {
                  onChange({
                    ...sheet,
                    deathSaves: {
                      ...sheet.deathSaves,
                      successes: Math.min(3, sheet.deathSaves.successes + (res.isCrit ? 2 : 1)),
                    },
                  });
                } else {
                  onChange({
                    ...sheet,
                    deathSaves: {
                      ...sheet.deathSaves,
                      failures: Math.min(3, sheet.deathSaves.failures + (res.isFail ? 2 : 1)),
                    },
                  });
                }
              }}
              className="flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer"
            >
              <Dices className="w-3 h-3" />
              Rolar Morte
            </button>
          </span>

          <div className="grid grid-cols-2 gap-4">
            {/* SUCESSOS */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold">Sucessos:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...sheet,
                        deathSaves: {
                          ...sheet.deathSaves,
                          successes: sheet.deathSaves.successes === num ? num - 1 : num,
                        },
                      })
                    }
                    className={`w-5 h-5 rounded-full border transition-all ${
                      sheet.deathSaves.successes >= num
                        ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* FRACASSOS */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-rose-400 font-semibold">Fracassos:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...sheet,
                        deathSaves: {
                          ...sheet.deathSaves,
                          failures: sheet.deathSaves.failures === num ? num - 1 : num,
                        },
                      })
                    }
                    className={`w-5 h-5 rounded-full border transition-all ${
                      sheet.deathSaves.failures >= num
                        ? 'bg-rose-600 border-rose-500 shadow-sm shadow-rose-600/50'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ATAQUES E MAGIAS DA FICHA (PÁGINA 1) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-amber-400" />
            Ataques & Armas Rápidas
          </h3>
          <button
            type="button"
            onClick={handleAddAttack}
            className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        <div className="space-y-2">
          {sheet.attacks.map((atk) => (
            <div
              key={atk.id}
              className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={atk.name}
                onChange={(e) => handleUpdateAttack(atk.id, { name: e.target.value })}
                placeholder="Nome da Arma"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={atk.atkBonus}
                  onChange={(e) => handleUpdateAttack(atk.id, { atkBonus: e.target.value })}
                  placeholder="Bônus (+4)"
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono text-center font-bold"
                />
                <input
                  type="text"
                  value={atk.damage}
                  onChange={(e) => handleUpdateAttack(atk.id, { damage: e.target.value })}
                  placeholder="Dano (1d8+2)"
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-300 font-mono text-center"
                />

                {/* BOTÃO ROLAR ATAQUE + DANO */}
                <button
                  type="button"
                  onClick={() => handleRollWeapon(atk)}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-xs font-black transition-transform active:scale-95 shadow-sm shrink-0 cursor-pointer"
                  title="Rolar Ataque e Dano no Chat"
                >
                  <Dices className="w-3.5 h-3.5" />
                  Rolar
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveAttack(atk.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WeaponCompendiumModal
        isOpen={showWeaponCompendium}
        onClose={() => setShowWeaponCompendium(false)}
        sheet={sheet}
        onAddWeapon={handleAddWeaponFromCompendium}
      />

      {/* MODAL SIMULADOR 4d6 (DESCARTAR MENOR DADO) */}
      {show4d6Modal && rolled4d6Set && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-[#0d1117] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl shadow-cyan-500/10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black uppercase text-cyan-400">Rolagem de Atributos 4d6</h3>
                  <p className="text-[10px] text-slate-400">Rola 4d6 para cada atributo e descarta o menor dado</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Soma Total:</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {Object.values(rolled4d6Set).reduce((sum, item) => sum + item.total, 0)} pts
                </span>
              </div>
            </div>

            {/* GRID DE DADOS 4d6 PARA CADA ATRIBUTO */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(rolled4d6Set) as AttributeKey[]).map((attrKey) => {
                const item = rolled4d6Set[attrKey];
                const mod = Math.floor((item.total - 10) / 2);

                return (
                  <div key={attrKey} className="bg-[#141b2d] border border-slate-800 rounded-xl p-2.5 text-center space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-cyan-400">{item.title}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400">{formatModifier(mod)}</span>
                    </div>

                    {/* DADOS INDIVIDUALMENTE ROLADOS */}
                    <div className="flex items-center justify-center gap-1 my-1">
                      {item.dice.map((val, idx) => {
                        const isDropped = idx === item.droppedIndex;
                        return (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                              isDropped
                                ? 'bg-rose-950/60 border border-rose-800/80 text-rose-500 line-through opacity-60'
                                : 'bg-slate-900 border border-slate-700 text-white shadow-sm'
                            }`}
                            title={isDropped ? 'Dado menor descartado' : 'Dado somado'}
                          >
                            {val}
                          </span>
                        );
                      })}
                    </div>

                    <div className="text-xs font-black text-white font-mono bg-slate-900/60 py-0.5 rounded border border-slate-800">
                      Total: <span className="text-cyan-300 text-sm font-bold">{item.total}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BOTÕES DE AÇÃO DO MODAL 4d6 */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShow4d6Modal(false)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReroll4d6All}
                  className="px-3.5 py-2 text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rolar Novamente
                </button>

                <button
                  type="button"
                  onClick={handleApply4d6Results}
                  className="px-4 py-2 text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Aplicar à Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

