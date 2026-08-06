'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, Shield, Check, X, Plus, Minus, ArrowUpRight, Award, Zap } from 'lucide-react';
import { Dice3DCanvas, DieType } from '@/components/Dice3DCanvas';
import { Bg3DiceOverlayState } from '@/lib/stores/useLiveCockpitStudioStore';
import { Bg3RollModifierCard } from '@/lib/types';
import { useAudio } from '@/context/AudioContext';

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

  // Initialize cards when state changes
  useEffect(() => {
    if (state?.modifierCards) {
      setModifierCards(state.modifierCards.map((c) => ({ ...c, isEnabled: c.isEnabled !== false })));
    } else if (state) {
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
    setActualD1(state?.d20Roll || 1);
    setActualD2(state?.secondD20Roll || 1);
    setDc(state?.difficultyClass ?? 10);
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

  // Trigger Phase 2 3D Damage Roll
  const handleStartDamageRoll = React.useCallback(() => {
    if (isDamageRolling || hasDamageRolled) return;

    playDiceSound(dmgInfo.count);
    setIsDamageRolling(true);

    const interval = setInterval(() => {
      setAnimatedDamageDie(Math.floor(Math.random() * dmgInfo.sides) + 1);
    }, 60);

    let rawTotal = 0;
    for (let i = 0; i < dmgInfo.count; i++) {
      rawTotal += Math.floor(Math.random() * dmgInfo.sides) + 1;
    }
    if (isCrit) {
      for (let i = 0; i < dmgInfo.count; i++) {
        rawTotal += Math.floor(Math.random() * dmgInfo.sides) + 1;
      }
    }
    const finalDamage = Math.max(1, rawTotal + dmgInfo.bonus);

    setTimeout(() => {
      clearInterval(interval);
      setIsDamageRolling(false);
      setHasDamageRolled(true);
      setDamageRollResult(finalDamage);
    }, 1600);
  }, [isDamageRolling, hasDamageRolled, dmgInfo, playDiceSound, isCrit]);

  // Auto-start damage roll as soon as modal transitions to 'damage' phase
  useEffect(() => {
    if (modalPhase === 'damage' && !hasDamageRolled && !isDamageRolling) {
      handleStartDamageRoll();
    }
  }, [modalPhase, hasDamageRolled, isDamageRolling, handleStartDamageRoll]);

  // Trigger 3D d20 roll action
  const handleStartRoll = () => {
    if (isRolling || hasRolled) return;

    // Play dice sound ONLY when roll action starts
    playDiceSound(isDualDice ? 2 : 1);

    // Generate fresh d20 rolls upon clicking "Clique para Rolar"
    const newD1 = Math.floor(Math.random() * 20) + 1;
    const newD2 = Math.floor(Math.random() * 20) + 1;
    setActualD1(newD1);
    setActualD2(newD2);

    let newWinning = newD1;
    if (isDualDice) {
      if (isAdvantage) newWinning = Math.max(newD1, newD2);
      if (isDisadvantage) newWinning = Math.min(newD1, newD2);
    }
    const newFinalTotal = newWinning + totalEnabledModifier;
    const newIsCrit = newWinning === 20;
    const newIsFail = newWinning === 1;
    const newIsSuccess = newIsCrit || (!newIsFail && newFinalTotal >= dc);

    setIsRolling(true);

    // Random dice flicker animation while rolling
    const interval = setInterval(() => {
      setAnimatedDice1(Math.floor(Math.random() * 20) + 1);
      setAnimatedDice2(Math.floor(Math.random() * 20) + 1);
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      setIsRolling(false);
      setHasRolled(true);
      setCurrentDisplayTotal(newWinning);

      // Sequential bonus tally animation
      const enabledCount = modifierCards.filter((c) => c.isEnabled !== false).length;
      if (enabledCount > 0) {
        let step = 0;
        const bonusInterval = setInterval(() => {
          if (step < enabledCount) {
            setActiveBonusIndex(step);
            step++;
          } else {
            clearInterval(bonusInterval);
            setCurrentDisplayTotal(newFinalTotal);
            if (onRollComplete) onRollComplete(newFinalTotal, newIsSuccess);
            if (state.onRollComplete) state.onRollComplete(newFinalTotal, newIsSuccess, newWinning);
          }
        }, 500);
      } else {
        if (onRollComplete) onRollComplete(newFinalTotal, newIsSuccess);
        if (state.onRollComplete) state.onRollComplete(newFinalTotal, newIsSuccess, newWinning);
      }
    }, 1800);
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
              number={isDamageRolling ? animatedDamageDie : damageRollResult}
              isCrit={isCrit}
              showNumber={hasDamageRolled}
            />
          ) : isDualDice ? (
            /* Dual 3D D20 Canvases for Advantage / Disadvantage */
            <>
              <div
                className={`transition-all duration-300 ${
                  hasRolled && d1 !== winningD20 ? 'opacity-30 scale-90 grayscale' : 'scale-105'
                }`}
              >
                <Dice3DCanvas
                  dieType="d20"
                  isRolling={isRolling}
                  number={isRolling ? animatedDice1 : d1}
                  isCrit={d1 === 20}
                  isFail={d1 === 1}
                  showNumber={hasRolled}
                />
              </div>

              <div
                className={`transition-all duration-300 ${
                  hasRolled && d2 !== winningD20 ? 'opacity-30 scale-90 grayscale' : 'scale-105'
                }`}
              >
                <Dice3DCanvas
                  dieType="d20"
                  isRolling={isRolling}
                  number={isRolling ? animatedDice2 : d2}
                  isCrit={d2 === 20}
                  isFail={d2 === 1}
                  showNumber={hasRolled}
                />
              </div>
            </>
          ) : (
            /* Single D20 Canvas */
            <Dice3DCanvas
              dieType="d20"
              isRolling={isRolling}
              number={isRolling ? animatedDice1 : d1}
              isCrit={winningD20 === 20}
              isFail={winningD20 === 1}
              showNumber={hasRolled}
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
          <div className="mt-3 text-center space-y-1 animate-in zoom-in-95 duration-300">
            <div className="text-2xl font-serif font-black text-amber-400 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-bounce">
              💥 {damageRollResult} DANO CAUSADO!
            </div>
            <div className="text-xs font-mono text-slate-300">
              Fórmula de Dano: <strong className="text-amber-300">{state.damageDiceFormula}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Modifier Cards Array (Cartas de Bônus estilo BG3) */}
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

      {/* Bottom Dismiss / Continue Action */}
      <div className="z-10 mt-6">
        {hasRolled ? (
          <button
            onClick={onClose}
            className="px-10 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-serif font-black text-sm uppercase tracking-wider rounded-xl shadow-xl transition-all active:scale-95 border border-amber-200"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 uppercase tracking-widest font-mono underline"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
};
