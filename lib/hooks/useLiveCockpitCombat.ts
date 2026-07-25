'use client';

import { useState, useEffect } from 'react';
import { Combatant } from '@/lib/types';

export interface Bg3DiceOverlayState {
  title: string;
  actorName?: string;
  targetName?: string;
  d20Roll: number;
  modifier: number;
  totalRoll: number;
  targetAc?: number;
  isHit?: boolean;
  isCrit?: boolean;
  isFail?: boolean;
  damageDiceFormula?: string;
  damageAmount?: number;
  isRolling: boolean;
  phase: 'd20' | 'damage';
}

export function useLiveCockpitCombat(
  combatants: Combatant[],
  currentTurnIndex: number,
  selectedTargetId: string | null
) {
  const [isCombatActive, setIsCombatActive] = useState<boolean>(false);
  const [openSpellDropdownId, setOpenSpellDropdownId] = useState<string | null>(null);
  const [showAddCombatantModal, setShowAddCombatantModal] = useState<boolean>(false);
  const [activeAddTab, setActiveAddTab] = useState<'monsters' | 'players' | 'custom' | 'npcs'>('monsters');
  const [combatantSearchQuery, setCombatantSearchQuery] = useState<string>('');

  const [pendingAttack, setPendingAttack] = useState<{
    title: string;
    mod: number;
    actorCombatant?: Combatant;
    actionDesc?: string;
  } | null>(null);

  const [bg3DiceOverlay, setBg3DiceOverlay] = useState<Bg3DiceOverlayState | null>(null);
  const [animatedRollNumber, setAnimatedRollNumber] = useState<number>(1);
  const [diceResult, setDiceResult] = useState<{
    title: string;
    roll: number;
    total: number;
    isCrit: boolean;
    isFail: boolean;
  } | null>(null);

  useEffect(() => {
    if (diceResult) {
      const t = setTimeout(() => setDiceResult(null), 5000);
      return () => clearTimeout(t);
    }
  }, [diceResult]);

  useEffect(() => {
    if (!bg3DiceOverlay || !bg3DiceOverlay.isRolling) return;

    const maxVal = bg3DiceOverlay.phase === 'd20' ? 20 : 8;
    const interval = setInterval(() => {
      setAnimatedRollNumber(Math.floor(Math.random() * maxVal) + 1);
    }, 45);

    return () => clearInterval(interval);
  }, [bg3DiceOverlay?.isRolling, bg3DiceOverlay?.phase]);

  const rollDice = (
    title: string,
    mod: number,
    actorCombatant?: Combatant,
    actionDesc?: string,
    forceNoTarget: boolean = false
  ): boolean => {
    const currentActor = actorCombatant || combatants[currentTurnIndex];
    const target = combatants.find((c) => c.id === selectedTargetId);

    if (title.startsWith('Ataque') && !target && !forceNoTarget) {
      setPendingAttack({ title, mod, actorCombatant: currentActor, actionDesc });
      return false;
    }

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 === 20;
    const isFail = d20 === 1;
    const total = d20 + mod;

    let targetAc = target?.ac;
    let isHit: boolean | undefined = undefined;

    if (title.startsWith('Ataque') && targetAc !== undefined) {
      isHit = isCrit || (!isFail && total >= targetAc);
    }

    let damageFormula: string | undefined = undefined;
    if (actionDesc) {
      const dmgMatch = actionDesc.match(/(\d+d\d+(?:\s*[\+\-]\s*\d+)?)/i);
      if (dmgMatch) {
        damageFormula = dmgMatch[1];
      }
    }

    setAnimatedRollNumber(d20);
    setBg3DiceOverlay({
      title,
      actorName: currentActor?.name || 'Combatente',
      targetName: target?.name,
      d20Roll: d20,
      modifier: mod,
      totalRoll: total,
      targetAc,
      isHit,
      isCrit,
      isFail,
      damageDiceFormula: damageFormula,
      isRolling: true,
      phase: 'd20',
    });

    setTimeout(() => {
      setBg3DiceOverlay((prev) => (prev ? { ...prev, isRolling: false } : null));
    }, 1200);

    setDiceResult({
      title: `${currentActor?.name || ''} - ${title}`,
      roll: d20,
      total,
      isCrit,
      isFail,
    });

    return true;
  };

  return {
    isCombatActive,
    setIsCombatActive,
    openSpellDropdownId,
    setOpenSpellDropdownId,
    showAddCombatantModal,
    setShowAddCombatantModal,
    activeAddTab,
    setActiveAddTab,
    combatantSearchQuery,
    setCombatantSearchQuery,
    pendingAttack,
    setPendingAttack,
    bg3DiceOverlay,
    setBg3DiceOverlay,
    animatedRollNumber,
    diceResult,
    rollDice,
  };
}
