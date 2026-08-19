'use client';

import { useState, useCallback } from 'react';
import { Combatant, ConditionType } from '@/lib/types';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';

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

    // Limpar alvo selecionado e mira de ataque ao trocar de turno
    setSelectedTargetId(null);
    useLiveCockpitStudioStore.getState().setSelectedTargetId(undefined);
    useLiveCockpitStudioStore.getState().setPendingAttack(null);

    let nextIndex = currentTurnIndex + 1;
    let nextRound = roundCount;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      setRoundCount(nextRound);
    }

    setCurrentTurnIndex(nextIndex);

    // Checagem de cruzamento da contagem de Iniciativa 20 (Lair Action)
    const currentCombatant = combatants[currentTurnIndex];
    const incomingCombatant = combatants[nextIndex];
    const crossedInit20 = (currentCombatant && incomingCombatant && currentCombatant.initiative >= 20 && incomingCombatant.initiative < 20) ||
      (nextRound > roundCount && combatants.some((x) => (x.initiative || 0) < 20) && !combatants.some((x) => (x.initiative || 0) >= 20));

    if (crossedInit20 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('masters_codex_lair_action_alert', {
        detail: { initiative: 20, round: nextRound }
      }));
      window.dispatchEvent(new CustomEvent('masters_codex_log_entry', {
        detail: {
          message: `🏰 Contagem de Iniciativa 20 alcançada! Momento de Ação de Covil.`,
          description: `Monstros lendários com covil podem ativar um efeito de covil na contagem de iniciativa 20.`,
          type: 'lair_action',
        }
      }));
    }

    setCombatants((prev) => prev.map((c, idx) => {
      if (idx === nextIndex) {
        // Decrement status durations
        let updatedDurations = c.statusDurations ? c.statusDurations.map(d => ({
          ...d,
          remainingRounds: d.remainingRounds - 1
        })) : [];

        const expired = updatedDurations.filter(d => d.remainingRounds <= 0);
        const active = updatedDurations.filter(d => d.remainingRounds > 0);

        let updatedConditions = c.conditions || [];
        expired.forEach(exp => {
          updatedConditions = updatedConditions.filter(cond => cond !== exp.name);
          // Dispatch events for floating combat text and logs
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
              detail: { combatantId: c.id, type: 'damage', amount: `${exp.name} Expirou!` }
            }));
            window.dispatchEvent(new CustomEvent('masters_codex_log_entry', {
              detail: {
                message: `O efeito '${exp.name}' expirou em ${c.name}.`,
                description: `O efeito '${exp.name}' expirou em ${c.name}.`,
                type: 'status_expired',
                actorId: c.id
              }
            }));
          }
        });

        const hasImmobilizingCondition = updatedConditions.some(cond => 
          ['Agarrado', 'Paralisado', 'Petrificado', 'Restrito', 'Inconsciente', 'Incapacitado'].includes(cond)
        );

        // Renovação de Ações Lendárias no início do turno da criatura
        const maxLegendary = c.maxLegendaryActions ?? (c.isLegendary || c.legendaryActions !== undefined ? 3 : undefined);
        const shouldRenewLegendary = maxLegendary !== undefined;
        const newLegendaryActions = shouldRenewLegendary ? maxLegendary : c.legendaryActions;

        if (shouldRenewLegendary && c.legendaryActions !== undefined && c.legendaryActions < maxLegendary && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('masters_codex_log_entry', {
            detail: {
              message: `⚡ ${c.name} renovou suas Ações Lendárias (${maxLegendary}/${maxLegendary})!`,
              description: `${c.name} recuperou todos os pontos de Ações Lendárias no início do seu turno.`,
              type: 'legendary_renew',
              actorId: c.id,
            }
          }));
          window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
            detail: { combatantId: c.id, type: 'status', amount: `⚡ 3 Ações Lendárias` }
          }));
        }

        return {
          ...c,
          conditions: updatedConditions,
          statusDurations: active.length > 0 ? active : undefined,
          actionUsed: false,
          bonusActionUsed: false,
          reactionUsed: false,
          legendaryActions: newLegendaryActions,
          hasDashed: false,
          movementUsed: hasImmobilizingCondition ? c.movementUsed : 0,
          turnStartX: c.x,
          turnStartZ: c.z
        };
      }
      return c;
    }));
  }, [combatants, currentTurnIndex, roundCount, setCurrentTurnIndex, setRoundCount, setCombatants]);

  const handlePrevTurn = useCallback(() => {
    if (combatants.length === 0) return;

    setSelectedTargetId(null);
    useLiveCockpitStudioStore.getState().setSelectedTargetId(undefined);
    useLiveCockpitStudioStore.getState().setPendingAttack(null);

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
        
        let updatedConditions = [];
        let updatedDurations = c.statusDurations || [];

        if (hasCondition) {
          updatedConditions = currentConditions.filter((cond) => cond !== condition);
          updatedDurations = updatedDurations.filter(d => d.name !== condition);
        } else {
          updatedConditions = [...currentConditions, condition];
          let duration = 0;
          if (typeof window !== 'undefined') {
            const rawDuration = window.prompt(`Definir duração de '${condition}' em rodadas (vazio ou 0 para infinito):`, '0');
            duration = parseInt(rawDuration || '0', 10);
          }
          if (duration > 0) {
            updatedDurations = [...updatedDurations, { name: condition, remainingRounds: duration }];
          }
        }

        return {
          ...c,
          conditions: updatedConditions,
          statusDurations: updatedDurations.length > 0 ? updatedDurations : undefined
        };
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
