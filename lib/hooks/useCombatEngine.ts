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

    // 💀 Automação de Death Save para Jogador Caído a 0 HP
    if (incomingCombatant && incomingCombatant.type === 'player' && incomingCombatant.hp <= 0) {
      const isStabilized = incomingCombatant.deathSaves?.isStabilized || (incomingCombatant.deathSaves?.successes || 0) >= 3;
      const isDead = (incomingCombatant.deathSaves?.failures || 0) >= 3 || incomingCombatant.conditions?.includes('Morto');

      if (!isStabilized && !isDead && typeof window !== 'undefined') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('masters_codex_trigger_death_save', {
            detail: {
              combatantId: incomingCombatant.id,
              combatantName: incomingCombatant.name,
              combatant: incomingCombatant,
              deathSaves: incomingCombatant.deathSaves || { successes: 0, failures: 0 }
            }
          }));
        }, 150);
      }
    }

    // Checagem de cruzamento da contagem de Iniciativa 20 (Lair Action)
    const currentCombatant = combatants[currentTurnIndex];
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

        // Se estava a 0 HP (caído ou morto) e recuperou vida (> 0), ressuscita e se ergue
        if (c.hp <= 0 && newHp > 0) {
          const cleanedConditions = (c.conditions || []).filter(
            (cond) => !['Morto', 'Inconsciente', 'Incapacitado', 'Caído'].includes(cond)
          );
          return {
            ...c,
            hp: newHp,
            conditions: cleanedConditions,
            deathSaves: { successes: 0, failures: 0, isStabilized: false },
          };
        }

        return { ...c, hp: newHp };
      })
    );
  }, [setCombatants]);

  const handleDeathSaveRoll = useCallback((id: string, roll: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const currentSaves = c.deathSaves || { successes: 0, failures: 0 };
        let newSuccesses = currentSaves.successes || 0;
        let newFailures = currentSaves.failures || 0;
        let newHp = c.hp;
        let newConditions = [...(c.conditions || [])];
        let isStabilized = !!currentSaves.isStabilized;

        if (roll === 20) {
          // Nat 20: Cura 1 HP, acorda de pé e reseta death saves
          newHp = 1;
          newSuccesses = 0;
          newFailures = 0;
          isStabilized = false;
          newConditions = newConditions.filter(
            (cond) => !['Inconsciente', 'Incapacitado', 'Caído', 'Morto'].includes(cond)
          );

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('masters_codex_combat_text', {
                detail: { combatantId: c.id, type: 'heal', amount: `🌟 Nat 20! +1 PV!` },
              })
            );
            window.dispatchEvent(
              new CustomEvent('masters_codex_log_entry', {
                detail: {
                  message: `🌟 ${c.name} rolou um Nat 20 no Teste de Morte! Recuperou a consciência com 1 PV e se ergueu!`,
                  description: `Regra Oficial D&D 5e: Um 20 natural em salvaguarda contra a morte recupera imediatamente 1 ponto de vida.`,
                  type: 'death_save_crit',
                  actorId: c.id,
                },
              })
            );
          }
        } else if (roll === 1) {
          // Nat 1: 2 Falhas
          newFailures = Math.min(3, newFailures + 2);
          if (newFailures >= 3) {
            if (!newConditions.includes('Morto')) newConditions.push('Morto');
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('masters_codex_combat_text', {
                detail: { combatantId: c.id, type: 'damage', amount: `💀 Nat 1! +2 Falhas!` },
              })
            );
            window.dispatchEvent(
              new CustomEvent('masters_codex_log_entry', {
                detail: {
                  message: `💀 FALHA CRÍTICA! ${c.name} rolou Nat 1 (+2 Falhas de Morte: ${newFailures}/3).`,
                  description:
                    newFailures >= 3
                      ? `${c.name} sucumbiu aos ferimentos e faleceu.`
                      : `${c.name} sofre 2 falhas no teste contra a morte.`,
                  type: 'death_save_fail',
                  actorId: c.id,
                },
              })
            );
          }
        } else if (roll >= 10) {
          // Sucesso (10-19)
          newSuccesses = Math.min(3, newSuccesses + 1);
          if (newSuccesses >= 3) {
            isStabilized = true;
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('masters_codex_combat_text', {
                detail: {
                  combatantId: c.id,
                  type: 'heal',
                  amount: isStabilized ? `🛡️ Estabilizou!` : `✨ Sucesso (${newSuccesses}/3)`,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('masters_codex_log_entry', {
                detail: {
                  message: isStabilized
                    ? `🛡️ ${c.name} obteve 3 sucessos e estabilizou! Não precisa mais rolar testes contra a morte.`
                    : `✨ ${c.name} obteve Sucesso no Teste de Morte (${newSuccesses}/3).`,
                  description: isStabilized
                    ? `O personagem está estável a 0 PV.`
                    : `Resultado: ${roll} (CD 10).`,
                  type: 'death_save_success',
                  actorId: c.id,
                },
              })
            );
          }
        } else {
          // Falha (2-9)
          newFailures = Math.min(3, newFailures + 1);
          if (newFailures >= 3) {
            if (!newConditions.includes('Morto')) newConditions.push('Morto');
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('masters_codex_combat_text', {
                detail: {
                  combatantId: c.id,
                  type: 'damage',
                  amount: newFailures >= 3 ? `💀 Morto!` : `⚠️ Falha (${newFailures}/3)`,
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('masters_codex_log_entry', {
                detail: {
                  message:
                    newFailures >= 3
                      ? `💀 ${c.name} acumulou 3 falhas e morreu.`
                      : `⚠️ ${c.name} Falhou no Teste de Morte (${newFailures}/3).`,
                  description: `Resultado: ${roll} (CD 10).`,
                  type: 'death_save_fail',
                  actorId: c.id,
                },
              })
            );
          }
        }

        return {
          ...c,
          hp: newHp,
          conditions: newConditions,
          deathSaves: {
            successes: newSuccesses,
            failures: newFailures,
            isStabilized,
          },
        };
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
        const initModifier = c.initiativeBonus !== undefined
          ? c.initiativeBonus
          : Math.floor(((c.dex || 10) - 10) / 2);
        return {
          ...c,
          initiative: d20 + initModifier,
          initiativeRoll: d20,
          initiativeBonus: initModifier,
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
    handleDeathSaveRoll,
    handleToggleCondition,
    handleRollInitiativeAll,
    handleAddCombatant,
    handleRemoveCombatant,
    startCombat,
    endCombat,
  };
}
