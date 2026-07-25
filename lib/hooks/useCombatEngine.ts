'use client';

import { useState, useCallback } from 'react';
import { Combatant, ConditionType } from '@/lib/types';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';

export interface UseCombatEngineProps {
  initialCombatants?: Combatant[];
}

export function useCombatEngine() {
  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    setCurrentTurnIndex,
    roundCount,
    setRoundCount,
  } = useLiveCockpit();

  const [isCombatActive, setIsCombatActive] = useState<boolean>(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const activeCombatant = combatants.length > 0 && currentTurnIndex >= 0 && currentTurnIndex < combatants.length
    ? combatants[currentTurnIndex]
    : null;

  const handleNextTurn = useCallback(() => {
    if (combatants.length === 0) return;
    let nextIndex = currentTurnIndex + 1;
    let nextRound = roundCount;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      setRoundCount(nextRound);
    }

    setCurrentTurnIndex(nextIndex);
  }, [combatants.length, currentTurnIndex, roundCount, setCurrentTurnIndex, setRoundCount]);

  const handlePrevTurn = useCallback(() => {
    if (combatants.length === 0) return;
    let prevIndex = currentTurnIndex - 1;
    let prevRound = roundCount;

    if (prevIndex < 0) {
      prevIndex = Math.max(0, combatants.length - 1);
      if (prevRound > 1) {
        prevRound -= 1;
        setRoundCount(prevRound);
      }
    }

    setCurrentTurnIndex(prevIndex);
  }, [combatants.length, currentTurnIndex, roundCount, setCurrentTurnIndex, setRoundCount]);

  const handleHpChange = useCallback((id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
        return { ...c, hp: newHp };
      })
    );
  }, [setCombatants]);

  const handleToggleCondition = useCallback((id: string, condition: ConditionType) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const currentConditions = c.conditions || [];
        const hasCondition = currentConditions.includes(condition);
        const updatedConditions = hasCondition
          ? currentConditions.filter((cond) => cond !== condition)
          : [...currentConditions, condition];
        return { ...c, conditions: updatedConditions };
      })
    );
  }, [setCombatants]);

  const handleRollInitiativeAll = useCallback(() => {
    setCombatants((prev) => {
      const rolled = prev.map((c) => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const initModifier = Math.floor(((c.dex || 10) - 10) / 2);
        return {
          ...c,
          initiative: d20 + initModifier,
        };
      });
      return rolled.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    });
    setCurrentTurnIndex(0);
    setRoundCount(1);
    setIsCombatActive(true);
  }, [setCombatants, setCurrentTurnIndex, setRoundCount]);

  const handleAddCombatant = useCallback((newCombatant: Combatant) => {
    setCombatants((prev) => {
      const next = [...prev, newCombatant];
      return next.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
    });
  }, [setCombatants]);

  const handleRemoveCombatant = useCallback((id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
    if (selectedTargetId === id) {
      setSelectedTargetId(null);
    }
  }, [selectedTargetId, setCombatants]);

  const startCombat = useCallback(() => {
    setIsCombatActive(true);
    if (roundCount === 0) setRoundCount(1);
  }, [roundCount, setRoundCount]);

  const endCombat = useCallback(() => {
    setIsCombatActive(false);
    setCurrentTurnIndex(0);
    setRoundCount(1);
  }, [setCurrentTurnIndex, setRoundCount]);

  return {
    combatants,
    setCombatants,
    currentTurnIndex,
    setCurrentTurnIndex,
    roundCount,
    setRoundCount,
    activeCombatant,
    isCombatActive,
    setIsCombatActive,
    selectedTargetId,
    setSelectedTargetId,
    handleNextTurn,
    handlePrevTurn,
    handleHpChange,
    handleToggleCondition,
    handleRollInitiativeAll,
    handleAddCombatant,
    handleRemoveCombatant,
    startCombat,
    endCombat,
  };
}
