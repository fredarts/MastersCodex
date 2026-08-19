'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, Shield, Check, X, Plus, Minus, ArrowUpRight, Award, Zap, Flame, ShieldAlert, HeartCrack } from 'lucide-react';
import { Dice3DCanvas, DieType } from '@/components/Dice3DCanvas';
import { Bg3DiceOverlayState } from '@/lib/stores/useLiveCockpitStudioStore';
import { Bg3RollModifierCard } from '@/lib/types';
import { useAudio } from '@/context/AudioContext';
import { calculateEffectiveDamage } from '@/lib/dnd5e-damage-resolver';
import { toast } from 'sonner';

interface BG3DiceRollModalProps {
  state: Bg3DiceOverlayState | null;
  onClose: () => void;
  onRollComplete?: (finalTotal: number, isHit: boolean) => void;
}

export const BG3DiceRollModal: React.FC<BG3DiceRollModalProps> = ({
  state,
  onClose,
  onRollComplete,
}) => {
  const { playDiceSound } = useAudio();
  const [modifierCards, setModifierCards] = useState<Bg3RollModifierCard[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [activeBonusIndex, setActiveBonusIndex] = useState<number>(-1);
  const [currentDisplayTotal, setCurrentDisplayTotal] = useState<number>(0);
  const [animatedDice1, setAnimatedDice1] = useState<number>(1);
  const [animatedDice2, setAnimatedDice2] = useState<number>(1);

  // Dynamic DC (Defaults to 10 if not provided)
  const [dc, setDc] = useState<number>(state?.difficultyClass ?? 10);
  const [isEditingDc, setIsEditingDc] = useState<boolean>(false);

  // Dynamic d20 rolls state
  const [actualD1, setActualD1] = useState<number>(state?.d20Roll || 1);
  const [actualD2, setActualD2] = useState<number>(state?.secondD20Roll || 1);

  const lastStateRef = React.useRef<{ title: string; actorName?: string; targetName?: string; modifier: number } | null>(null);

  // Initialize cards when state changes
  useEffect(() => {
    if (!state) return;

    // Guard against resetting state when updating secondary fields (like damageAmount)
    const isSameRoll = lastStateRef.current &&
      lastStateRef.current.title === state.title &&
      lastStateRef.current.actorName === state.actorName &&
      lastStateRef.current.targetName === state.targetName &&
      lastStateRef.current.modifier === state.modifier;

    if (isSameRoll) return;

    lastStateRef.current = {
      title: state.title,
      actorName: state.actorName,
      targetName: state.targetName,
      modifier: state.modifier,
    };

    if (state.modifierCards) {
      setModifierCards(state.modifierCards.map((c) => ({ ...c, isEnabled: c.isEnabled !== false })));
    } else {
      // Default cards fallback
      const defaultCards: Bg3RollModifierCard[] = [];
      if (state.modifier !== 0) {
        defaultCards.push({
          id: 'mod-main',
          label: state.subtitle || 'Modificador',
          value: state.modifier >= 0 ? `+${state.modifier}` : `${state.modifier}`,
          numericValue: state.modifier,
          iconType: 'attribute',
          isEnabled: true,
        });
      }
      setModifierCards(defaultCards);
    }
    setActualD1(state.d20Roll || 1);
    setActualD2(state.secondD20Roll || 1);
    setDc(state.difficultyClass ?? 10);
    setHasRolled(false);
    setIsRolling(false);
    setActiveBonusIndex(-1);
  }, [state]);

  if (!state) return null;

  const isAdvantage = state.advantageMode === 'advantage';
  const isDisadvantage = state.advantageMode === 'disadvantage';
  const isDualDice = (isAdvantage || isDisadvantage);

  // Calculate sum of currently enabled modifier cards
  const totalEnabledModifier = modifierCards
    .filter((c) => c.isEnabled !== false)
    .reduce((sum, card) => {
      if (card.numericValue !== undefined) return sum + card.numericValue;
      const parsed = parseInt(card.value.toString().replace('+', ''), 10);
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);

  // Determine winning D20 roll
  const d1 = actualD1;
  const d2 = actualD2;
  let winningD20 = d1;
  if (isDualDice) {
    if (isAdvantage) winningD20 = Math.max(d1, d2);
    if (isDisadvantage) winningD20 = Math.min(d1, d2);
  }

  const finalComputedTotal = winningD20 + totalEnabledModifier;

  // Phase 2 Damage Roll state
  const [modalPhase, setModalPhase] = useState<'d20' | 'damage'>('d20');
  const [isDamageRolling, setIsDamageRolling] = useState<boolean>(false);
  const [hasDamageRolled, setHasDamageRolled] = useState<boolean>(false);
  const [damageRollResult, setDamageRollResult] = useState<number>(0);
  const [animatedDamageDie, setAnimatedDamageDie] = useState<number>(1);
  const [manualDamageModifierRatio, setManualDamageModifierRatio] = useState<number | null>(null);

  // Helper: Parse formula like "1d8+3"
  const dmgInfo = React.useMemo(() => {
    const formula = state?.damageDiceFormula;
    const defaultVal = { dieType: 'd8' as DieType, count: 1, sides: 8, bonus: 0 };
    if (!formula) return defaultVal;
    const match = formula.match(/(\d+)d(\d+)(?:\s*[\+\-]\s*(\d+))?/i);
    if (!match) return defaultVal;
    const count = parseInt(match[1], 10) || 1;
    const sides = parseInt(match[2], 10) || 8;
    const bonus = match[3] ? parseInt(match[3], 10) : 0;

    let dieType: DieType = 'd8';
    if (sides === 20) dieType = 'd20';
    else if (sides === 12) dieType = 'd12';
    else if (sides === 10) dieType = 'd10';
    else if (sides === 8) dieType = 'd8';
    else if (sides === 6) dieType = 'd6';
    else if (sides === 4) dieType = 'd4';

    return { dieType, count, sides, bonus };
  }, [state?.damageDiceFormula]);

  // Cálculo de Dano Efetivo considerando defesas (Resistências, Imunidades, Vulnerabilidades)
  const effectiveDamageData = React.useMemo(() => {
    const baseResult = calculateEffectiveDamage({
      rawDamage: damageRollResult,
      damageType: state?.damageType,
      target: state?.targetCombatant,
    });

    if (manualDamageModifierRatio !== null) {
      const overrideVal = Math.floor(damageRollResult * manualDamageModifierRatio);
      return {
        ...baseResult,
        effectiveDamage: overrideVal,
        multiplier: manualDamageModifierRatio,
        badgeLabel:
          manualDamageModifierRatio === 0
            ? `🛡️ Imunidade (0%)`
            : manualDamageModifierRatio === 0.5
            ? `🛡️ Resistência (50%)`
            : manualDamageModifierRatio === 2
            ? `⚠️ Vulnerabilidade (200%)`
            : `Integral (100%)`,
        explanation: `Multiplicador manual (${manualDamageModifierRatio * 100}%) aplicado pelo Mestre: ${damageRollResult} ➔ ${overrideVal}.`,
      };
    }

    return baseResult;
  }, [damageRollResult, state?.damageType, state?.targetCombatant, manualDamageModifierRatio]);

  const isCrit = winningD20 === 20;
  const isFail = winningD20 === 1;
  const isSuccess = isCrit || (!isFail && finalComputedTotal >= dc);

  // Toggle optional modifier card
  const handleToggleCard = (cardId: string) => {
    if (hasRolled || isRolling) return;
    setModifierCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isEnabled: !c.isEnabled } : c))
    );
  };

  const diceRollsRef = React.useRef({ d1: state?.d20Roll || 1, d2: state?.secondD20Roll || 1 });

  // Handler para quando o dado de dano 3D para fisicamente
  const handleDamageDieSettled = React.useCallback((result: { value: number }) => {
    setIsDamageRolling(false);
    setHasDamageRolled(true);

    const baseVal = result.value;
    const finalDamage = state?.damageAmount !== undefined
      ? state.damageAmount
      : Math.max(1, baseVal + dmgInfo.bonus);

    setDamageRollResult(finalDamage);
  }, [state, dmgInfo]);

  // Trigger Phase 2 3D Damage Roll
  const handleStartDamageRoll = React.useCallback(() => {
    if (isDamageRolling || hasDamageRolled) return;

    playDiceSound(dmgInfo.count);
    setIsDamageRolling(true);
  }, [isDamageRolling, hasDamageRolled, dmgInfo, playDiceSound]);

  // Auto-start damage roll as soon as modal transitions to 'damage' phase
  useEffect(() => {
    if (modalPhase === 'damage' && !hasDamageRolled && !isDamageRolling) {
      handleStartDamageRoll();
    }
  }, [modalPhase, hasDamageRolled, isDamageRolling, handleStartDamageRoll]);

  // Aplicar dano ao alvo
  const handleApplyDamage = () => {
    const targetId = state?.targetCombatant?.id;
    const targetName = state?.targetCombatant?.name || state?.targetName || 'o alvo';
    const effectiveVal = effectiveDamageData.effectiveDamage;

    if (state?.onApplyDamage && targetId) {
      state.onApplyDamage(targetId, effectiveVal, effectiveDamageData.explanation);
    } else if (targetId) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
          detail: { combatantId: targetId, type: 'damage', amount: effectiveVal }
        }));
        window.dispatchEvent(new CustomEvent('masters_codex_apply_damage', {
          detail: { targetId, amount: effectiveVal, damageType: effectiveDamageData.damageType }
        }));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('masters_codex_clear_target_selection'));
    }

    toast.success(`💥 ${effectiveVal} de dano (${effectiveDamageData.damageType}) aplicado em ${targetName}!`);
    onClose();
  };

  // Handler para quando o dado D20 para fisicamente na face superior
  const handleD20Settled = React.useCallback((dieIndex: 1 | 2, result: { value: number; isCrit: boolean; isFail: boolean }) => {
    if (dieIndex === 1) {
      diceRollsRef.current.d1 = result.value;
      setActualD1(result.value);
    }
    if (dieIndex === 2) {
      diceRollsRef.current.d2 = result.value;
      setActualD2(result.value);
    }

    const d1Val = dieIndex === 1 ? result.value : diceRollsRef.current.d1;
    const d2Val = dieIndex === 2 ? result.value : diceRollsRef.current.d2;

    let winning = d1Val;
    if (isDualDice) {
      if (isAdvantage) winning = Math.max(d1Val, d2Val);
      if (isDisadvantage) winning = Math.min(d1Val, d2Val);
    }

    setIsRolling(false);
    setHasRolled(true);
    setCurrentDisplayTotal(winning);

    const computedFinalTotal = winning + totalEnabledModifier;
    const isWinCrit = winning === 20;
    const isWinFail = winning === 1;
    const isWinSuccess = isWinCrit || (!isWinFail && computedFinalTotal >= dc);

    // Animação sequencial dos bônus estilo BG3
    const enabledCount = modifierCards.filter((c) => c.isEnabled !== false).length;
    if (enabledCount > 0) {
      let step = 0;
      const bonusInterval = setInterval(() => {
        if (step < enabledCount) {
          setActiveBonusIndex(step);
          step++;
        } else {
          clearInterval(bonusInterval);
          setCurrentDisplayTotal(computedFinalTotal);
          if (onRollComplete) onRollComplete(computedFinalTotal, isWinSuccess);
          if (state?.onRollComplete) state.onRollComplete(computedFinalTotal, isWinSuccess, winning);
        }
      }, 350);
    } else {
      setCurrentDisplayTotal(computedFinalTotal);
      if (onRollComplete) onRollComplete(computedFinalTotal, isWinSuccess);
      if (state?.onRollComplete) state.onRollComplete(computedFinalTotal, isWinSuccess, winning);
    }
  }, [isDualDice, isAdvantage, isDisadvantage, totalEnabledModifier, dc, modifierCards, onRollComplete, state]);

  // Trigger 3D d20 roll action
  const handleStartRoll = () => {
    if (isRolling || hasRolled) return;

    // Play dice sound ONLY when roll action starts
    playDiceSound(isDualDice ? 2 : 1);
    setIsRolling(true);
    setHasRolled(false);
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Top Narrative Context Header */}
      <div className="z-10 text-center mb-4 space-y-1 animate-in slide-in-from-top-4 duration-300">
        {state.contextNarrative && (
          <p className="text-xs font-serif italic text-amber-200/90 max-w-lg mx-auto drop-shadow">
            "{state.contextNarrative}"
          </p>
        )}
        <h1 className="text-2xl md:text-3xl font-serif font-black tracking-wide text-slate-100 uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {modalPhase === 'damage' ? `ROLAGEM DE DANO: ${state.title}` : state.title}
        </h1>
        {state.subtitle && (
          <span className="text-xs font-mono font-bold text-amber-400/90 uppercase tracking-widest block">
            {modalPhase === 'damage' ? `FÓRMULA: ${state.damageDiceFormula || '1d8'}` : state.subtitle}
          </span>
        )}
      </div>

      {/* Central Ornate BG3 Card Frame */}
      <div
        className={`relative z-10 w-full max-w-md bg-[#0d111d]/95 border-2 rounded-[36px] p-6 shadow-2xl flex flex-col items-center transition-all duration-500 ${
          hasRolled
            ? isCrit || isSuccess
              ? 'border-amber-400 shadow-[0_0_70px_rgba(245,158,11,0.4)]'
              : 'border-rose-600 shadow-[0_0_70px_rgba(225,29,72,0.4)]'
            : 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.2)]'
        }`}
      >
        {/* Filigree corner accents */}
        <div className="absolute top-2 left-2 text-amber-500/40 pointer-events-none font-serif text-xs">◆</div>
        <div className="absolute top-2 right-2 text-amber-500/40 pointer-events-none font-serif text-xs">◆</div>
        <div className="absolute bottom-2 left-2 text-amber-500/40 pointer-events-none font-serif text-xs">◆</div>
        <div className="absolute bottom-2 right-2 text-amber-500/40 pointer-events-none font-serif text-xs">◆</div>

        {/* Top DC (Difficulty Class) Header with Editable DM DC support */}
        <div className="text-center mb-3">
          <span className="text-[10px] font-mono font-bold text-amber-400/80 uppercase tracking-widest block">
            {modalPhase === 'damage' ? 'FÓRMULA DE DANO' : 'DIFFICULTY CLASS'}
          </span>
          {modalPhase === 'damage' ? (
            <div className="text-3xl md:text-4xl font-serif font-black text-amber-300 tracking-tight drop-shadow-md">
              {state.damageDiceFormula || '1d8'}
            </div>
          ) : !hasRolled && !isRolling ? (
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {isEditingDc ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={dc}
                    onChange={(e) => setDc(Math.max(1, parseInt(e.target.value, 10) || 10))}
                    className="w-16 bg-slate-900 border border-amber-400 text-amber-300 font-serif font-black text-2xl text-center rounded px-1 outline-none"
                    autoFocus
                    onBlur={() => setIsEditingDc(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingDc(false)}
                  />
                  <button
                    onClick={() => setIsEditingDc(false)}
                    className="p-1 bg-amber-500/20 text-amber-300 rounded hover:bg-amber-500/40"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDc(true)}
                  className="group cursor-pointer relative inline-flex items-center justify-center px-4 py-1 rounded-xl hover:bg-amber-500/10 transition-colors"
                  title="Clique para ajustar a DC"
                >
                  <span className="text-3xl md:text-4xl font-serif font-black text-slate-100 tracking-tight drop-shadow-md">
                    {dc}
                  </span>
                  <span className="absolute left-full ml-1 text-[10px] text-amber-400/60 opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap">
                    (Editar)
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-3xl md:text-4xl font-serif font-black text-slate-100 tracking-tight drop-shadow-md">
              {dc}
            </div>
          )}
        </div>

        {/* Decorative Gold Separator */}
        <div className="w-full flex items-center justify-center gap-2 mb-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-amber-400/60 bg-amber-500/20" />
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
        </div>

        {/* 3D Polyhedral Dice Container (Single or Dual for Adv/Dis OR Damage Die) */}
        <div className="relative flex items-center justify-center my-2 gap-4">
          {modalPhase === 'damage' ? (
            /* Phase 2: 3D Damage Die Canvas (d8, d6, d10, d12, d4, etc.) */
            <Dice3DCanvas
              dieType={dmgInfo.dieType}
              isRolling={isDamageRolling}
              number={damageRollResult}
              isCrit={isCrit}
              showNumber={hasDamageRolled}
              onSettled={handleDamageDieSettled}
            />
          ) : isDualDice ? (
            /* Dual 3D D20 Canvases for Advantage / Disadvantage */
            <>
              <div
                className={`transition-all duration-300 ${
                  hasRolled && actualD1 !== winningD20 ? 'opacity-30 scale-90 grayscale' : 'scale-105'
                }`}
              >
                <Dice3DCanvas
                  dieType="d20"
                  isRolling={isRolling}
                  number={actualD1}
                  isCrit={actualD1 === 20}
                  isFail={actualD1 === 1}
                  showNumber={hasRolled}
                  onSettled={(res) => handleD20Settled(1, res)}
                />
              </div>

              <div
                className={`transition-all duration-300 ${
                  hasRolled && actualD2 !== winningD20 ? 'opacity-30 scale-90 grayscale' : 'scale-105'
                }`}
              >
                <Dice3DCanvas
                  dieType="d20"
                  isRolling={isRolling}
                  number={actualD2}
                  isCrit={actualD2 === 20}
                  isFail={actualD2 === 1}
                  showNumber={hasRolled}
                  onSettled={(res) => handleD20Settled(2, res)}
                />
              </div>
            </>
          ) : (
            /* Single D20 Canvas */
            <Dice3DCanvas
              dieType="d20"
              isRolling={isRolling}
              number={actualD1}
              isCrit={actualD1 === 20}
              isFail={actualD1 === 1}
              showNumber={hasRolled}
              onSettled={(res) => handleD20Settled(1, res)}
            />
          )}
        </div>

        {/* Advantage / Disadvantage Label */}
        {modalPhase === 'd20' && (isAdvantage || isDisadvantage) && (
          <div className="mt-1 mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-sm ${
                isAdvantage
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              <Zap className="w-3 h-3" />
              {isAdvantage ? 'Vantagem (Advantage)' : 'Desvantagem (Disadvantage)'}
            </span>
          </div>
        )}

        {/* Phase 1 Action: Click to Roll D20 */}
        {modalPhase === 'd20' && !hasRolled && !isRolling && (
          <button
            onClick={handleStartRoll}
            className="mt-3 px-8 py-2.5 bg-gradient-to-r from-amber-500/20 via-amber-500/40 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 border border-amber-400/60 hover:border-amber-300 rounded-full text-xs font-serif font-black text-amber-200 uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            Clique para Rolar o Dado
          </button>
        )}

        {(isRolling || isDamageRolling) && (
          <div className="mt-3 text-xs font-serif italic text-amber-300/80 animate-pulse">
            Rolando os dados 3D em tempo real...
          </div>
        )}

        {/* Phase 1 Post-Roll Result Display Banner */}
        {modalPhase === 'd20' && hasRolled && (
          <div className="mt-3 text-center space-y-2 animate-in zoom-in-95 duration-300">
            {isCrit ? (
              <div className="space-y-0.5">
                <div className="text-2xl font-serif font-black text-amber-400 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-bounce">
                  ✨ CRITICAL SUCCESS ✨
                </div>
                <div className="text-xs font-bold text-amber-200">SUCESSO CRÍTICO (20 NATURAL)!</div>
              </div>
            ) : isFail ? (
              <div className="space-y-0.5">
                <div className="text-2xl font-serif font-black text-rose-500 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] animate-pulse">
                  💀 CRITICAL FAILURE 💀
                </div>
                <div className="text-xs font-bold text-rose-300">ERRO CRÍTICO (1 NATURAL)!</div>
              </div>
            ) : isSuccess ? (
              <div className="space-y-0.5">
                <div className="text-2xl font-serif font-black text-amber-300 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                  ✓ SUCESSO!
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Total: <strong className="text-amber-300 text-sm">{currentDisplayTotal}</strong> {dc ? `≥ DC ${dc}` : ''}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="text-2xl font-serif font-black text-rose-400 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                  ✕ FRACASSO!
                </div>
                <div className="text-xs font-mono text-slate-300">
                  Total: <strong className="text-rose-400 text-sm">{currentDisplayTotal}</strong> {dc ? `< DC ${dc}` : ''}
                </div>
              </div>
            )}

            {/* Transition to Phase 2 Damage Roll button if attack hit */}
            {isSuccess && state.damageDiceFormula && (
              <button
                onClick={() => setModalPhase('damage')}
                className="mt-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                💥 Ir para Rolagem de Dano ({state.damageDiceFormula})
              </button>
            )}
          </div>
        )}

        {/* Phase 2 Post-Roll Damage Result Display */}
        {modalPhase === 'damage' && hasDamageRolled && (
          <div className="mt-3 text-center space-y-2.5 animate-in zoom-in-95 duration-300 w-full">
            {/* Dano Efetivo Final */}
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-serif font-black text-amber-300 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                💥 {effectiveDamageData.effectiveDamage} DANO
              </div>
              <div className="text-xs font-mono text-slate-300">
                Fórmula: <strong className="text-amber-300">{state.damageDiceFormula}</strong> • Tipo: <strong className="text-amber-200">{effectiveDamageData.damageType}</strong>
                {effectiveDamageData.rawDamage !== effectiveDamageData.effectiveDamage && (
                  <span className="text-slate-400 ml-1 font-mono">
                    (Rolado: {effectiveDamageData.rawDamage})
                  </span>
                )}
              </div>
            </div>

            {/* Badge de Resistência / Imunidade / Vulnerabilidade */}
            {effectiveDamageData.modifierType !== 'none' && (
              <div className={`mx-auto max-w-sm px-3 py-1.5 rounded-xl border text-xs font-sans flex items-center justify-center gap-1.5 shadow-md ${
                effectiveDamageData.modifierType === 'immunity'
                  ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
                  : effectiveDamageData.modifierType === 'resistance'
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-200'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              }`}>
                {effectiveDamageData.modifierType === 'immunity' && <Shield className="w-4 h-4 text-indigo-400 shrink-0" />}
                {effectiveDamageData.modifierType === 'resistance' && <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />}
                {effectiveDamageData.modifierType === 'vulnerability' && <HeartCrack className="w-4 h-4 text-rose-400 shrink-0" />}
                <span className="font-bold">{effectiveDamageData.badgeLabel}</span>
                <span className="text-[10px] opacity-80 ml-1">({effectiveDamageData.explanation})</span>
              </div>
            )}

            {/* Ajuste Rápido do Mestre (Multiplicadores Manuais) */}
            <div className="pt-1 border-t border-slate-800/80">
              <div className="text-[9px] font-mono uppercase text-slate-400 mb-1">Ajuste de Dano (Mestre):</div>
              <div className="flex items-center justify-center gap-1">
                {[
                  { label: 'Auto', ratio: null },
                  { label: '100%', ratio: 1 },
                  { label: 'Metade (50%)', ratio: 0.5 },
                  { label: 'Dobro (200%)', ratio: 2 },
                  { label: 'Imune (0%)', ratio: 0 },
                ].map((item) => {
                  const isActive = manualDamageModifierRatio === item.ratio;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setManualDamageModifierRatio(item.ratio)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Modifier Cards Array (Cartas de Bônus estilo BG3) - Apenas na fase d20 */}
      {modalPhase === 'd20' && (
        <div className="z-10 mt-6 w-full max-w-xl space-y-2 animate-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
              Bônus & Modificadores Ativos
            </span>
            <span className="text-xs font-serif font-bold text-amber-300">
              Total Bônus: {totalEnabledModifier >= 0 ? `+${totalEnabledModifier}` : totalEnabledModifier}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {modifierCards.map((card, idx) => {
              const isEnabled = card.isEnabled !== false;
              const isHighlighted = activeBonusIndex === idx;

              return (
                <div
                  key={card.id}
                  className={`relative group min-w-[100px] max-w-[130px] p-2.5 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${
                    isHighlighted
                      ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105'
                      : isEnabled
                      ? 'bg-[#121826]/90 border-amber-500/40 text-slate-200'
                      : 'bg-slate-900/50 border-slate-800 text-slate-600 opacity-60'
                  }`}
                >
                  {/* Optional Toggle (- / +) Button */}
                  {card.isOptional && !hasRolled && !isRolling && (
                    <button
                      type="button"
                      onClick={() => handleToggleCard(card.id)}
                      className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                        isEnabled
                          ? 'bg-rose-900/80 border-rose-500 text-rose-200 hover:bg-rose-700'
                          : 'bg-emerald-900/80 border-emerald-500 text-emerald-200 hover:bg-emerald-700'
                      }`}
                      title={isEnabled ? 'Remover bônus' : 'Ativar bônus'}
                    >
                      {isEnabled ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    </button>
                  )}

                  {/* Card Numeric Value */}
                  <div className={`text-base font-serif font-black ${isEnabled ? 'text-amber-300' : 'text-slate-500'}`}>
                    {card.value}
                  </div>

                  {/* Icon */}
                  <div className="my-1 text-amber-400/80">
                    {card.iconType === 'attribute' && <Award className="w-4 h-4" />}
                    {card.iconType === 'proficiency' && <Award className="w-4 h-4 text-emerald-400" />}
                    {card.iconType === 'spell' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                    {card.iconType === 'item' && <Zap className="w-4 h-4 text-orange-400" />}
                    {card.iconType === 'advantage' && <Zap className="w-4 h-4 text-purple-400" />}
                    {card.iconType === 'condition' && <Shield className="w-4 h-4 text-rose-400" />}
                  </div>

                  {/* Label & Source */}
                  <div className="text-[10px] font-bold truncate max-w-full leading-tight">{card.label}</div>
                  {card.sourceName && (
                    <div className="text-[8px] text-slate-400 truncate max-w-full italic mt-0.5">
                      {card.sourceName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Dismiss / Apply Damage Action Buttons */}
      <div className="z-10 mt-6 flex flex-col items-center gap-2">
        {modalPhase === 'damage' && hasDamageRolled ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleApplyDamage}
              className="px-10 py-3 bg-gradient-to-r from-rose-500 via-amber-500 to-amber-600 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-serif font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl transition-all transform hover:scale-105 active:scale-95 border border-amber-200 cursor-pointer flex items-center gap-2"
            >
              <span>💥 Aplicar Dano no Alvo</span>
              <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-mono">
                -{effectiveDamageData.effectiveDamage} PV
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('masters_codex_clear_target_selection'));
                }
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-slate-200 uppercase tracking-widest font-mono underline cursor-pointer"
            >
              Fechar sem aplicar dano
            </button>
          </div>
        ) : hasRolled ? (
          <>
            {!(modalPhase === 'd20' && isSuccess && state.damageDiceFormula) && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('masters_codex_clear_target_selection'));
                  }
                  onClose();
                }}
                className="px-10 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-95 border border-amber-200 cursor-pointer"
              >
                Continuar
              </button>
            )}
            {modalPhase === 'd20' && isSuccess && state.damageDiceFormula && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('masters_codex_clear_target_selection'));
                  }
                  onClose();
                }}
                className="text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest font-mono underline cursor-pointer mt-1"
              >
                Fechar sem rolar dano
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('masters_codex_clear_target_selection'));
              }
              onClose();
            }}
            className="text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest font-mono underline cursor-pointer"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
