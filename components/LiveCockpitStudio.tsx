'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useSession } from '@/lib/hooks/useSession';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useAuth } from '@/context/AuthContext';
import { useCharacterSync } from '@/lib/hooks/useCharacterSync';
import { useAudio } from '@/context/AudioContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

import { LiveCockpitHeader } from '@/components/live-cockpit/LiveCockpitHeader';
import { SceneTimelinePanel } from '@/components/live-cockpit/SceneTimelinePanel';
import { LiveVisualMirror } from '@/components/live-cockpit/LiveVisualMirror';
import { CombatInitiativePanel } from '@/components/live-cockpit/CombatInitiativePanel';
import { FloatingDiceRollerHUD } from '@/components/live-cockpit/FloatingDiceRollerHUD';
import { LiveCockpitModalManager } from '@/components/live-cockpit/LiveCockpitModalManager';
import { DMNotebookDrawer } from '@/components/live-cockpit/DMNotebookDrawer';
import { AudioMaestro } from '@/components/AudioMaestro';
import { XCardAlertBanner } from '@/components/safety/XCardAlertBanner';

import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useCombatEngine } from '@/lib/hooks/useCombatEngine';
import { useSceneProjection } from '@/lib/hooks/useSceneProjection';
import { getAttributeModifier } from '@/lib/dnd5e-calculator';
import { getSpellAoEDefinition } from '@/lib/dnd5e-spells-shapes';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { Combatant, CharacterSheet, CharacterSpell, CombatLogEntry, ConditionType } from '@/lib/types';
import { BattleSetupMode } from '@/components/live-cockpit/BattleSetupModal';

interface LiveCockpitStudioProps {
  onGenerateLoot: () => void;
  onOpenPlayerView: () => void;
  onOpenAudioPanel: () => void;
}

export const LiveCockpitStudio: React.FC<LiveCockpitStudioProps> = ({
  onGenerateLoot,
  onOpenPlayerView,
  onOpenAudioPanel,
}) => {
  const { worldEntities } = useWorld();
  const { activeCampaign, campaignMembers, createFeedEvent } = useCampaign();
  const {
    activeSession,
    scenes,
    activeScene,
    setActiveSession,
    setActiveScene,
    updateScene,
  } = useSession();

  const combatEngine = useCombatEngine();
  const sceneProjection = useSceneProjection();

  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    setCurrentTurnIndex,
    roundCount,
    setRoundCount,
    liveDisplayMode,
    setLiveDisplayMode,
    broadcastToPlayerView,
    tokenPositions3D,
    tokenRotations3D,
    initializeFromCombatants,
    setActiveSpellTargeting,
    setCasterTokenKey,
    setSpellTargetPosition,
    broadcastCombatLogEntry,
    setCombatLogs,
    broadcastCombatUpdate,
    activeXCardAlert,
    setActiveXCardAlert,
  } = useLiveCockpit();

  const { user } = useAuth();
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const { characterSheets } = useCharacterSync({
    userId: user?.id || '',
    campaignId: activeCampaign?.id,
  });

  const { playSfx, playDiceSound } = useAudio();

  // Zustand Store states & actions
  const {
    isTimelineCollapsed,
    setIsTimelineCollapsed,
    rightPanelTab,
    setRightPanelTab,
    isCombatActive,
    setIsCombatActive,
    autoInit,
    setAutoInit,
    customAudios,
    setCustomAudios,
    diceResult,
    setDiceResult,
    bg3DiceOverlay,
    setBg3DiceOverlay,
    animatedRollNumber,
    setAnimatedRollNumber,
    selectedTargetId,
    setSelectedTargetId,
    setConfirmDeleteCombatant,
    pendingAttack,
    setPendingAttack,
    magicMissileModalState,
    setMagicMissileModalState,
    isPlacementPhase,
    setIsPlacementPhase,
    battleSetupMode,
    setBattleSetupMode,
    selectedTimeOfDay,
    setSelectedTimeOfDay,
    liveTimeOfDayHour,
    setLiveTimeOfDayHour,
    liveHasFog,
    setLiveHasFog,
    liveHasRain,
    setLiveHasRain,
    liveFloorTextureUrl,
    setLiveFloorTextureUrl,
    setLiveEnvironmentSettings,
    playingNpcVoice,
    activeBgmCategory,
    setActiveBgmCategory,
    setPlayingNpcVoice,
    setShowCreateSceneModal,
    setShowAddCombatantModal,
    setShowBattleSetupModal,
    isBattleStarted,
    setIsBattleStarted,
  } = useLiveCockpitStudioStore();

  const savePositionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSceneRef = useRef(activeScene);
  const combatantsRef = useRef(combatants);
  const lastInitializedSceneIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeSceneRef.current = activeScene;
  }, [activeScene]);

  useEffect(() => {
    combatantsRef.current = combatants;
  }, [combatants]);

  // Load custom audio assets
  useEffect(() => {
    if (activeCampaign?.id && isSupabaseConfigured()) {
      supabase
        .from('campaign_audio_assets')
        .select('*')
        .eq('campaign_id', activeCampaign.id)
        .then(({ data }) => {
          if (data) setCustomAudios(data);
        });
    }
  }, [activeCampaign?.id, setCustomAudios]);

  // Load initial timeline collapse state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('masters_codex_timeline_collapsed');
      if (saved !== null) {
        setIsTimelineCollapsed(saved === 'true');
      }
    }
  }, [setIsTimelineCollapsed]);

  // Sync Combat Active status with current scene or combatants array
  useEffect(() => {
    if (activeScene?.sceneType === 'combat' || combatants.length > 0) {
      setIsCombatActive(true);
    } else {
      setIsCombatActive(false);
    }
  }, [activeScene?.id, activeScene?.sceneType, combatants.length, setIsCombatActive]);

  // Handle dice overlay timer dismiss
  useEffect(() => {
    if (diceResult) {
      const t = setTimeout(() => setDiceResult(null), 5000);
      return () => clearTimeout(t);
    }
  }, [diceResult, setDiceResult]);

  // Animate BG3 rolling dice numbers
  useEffect(() => {
    if (!bg3DiceOverlay || !bg3DiceOverlay.isRolling) return;
    const maxVal = bg3DiceOverlay.phase === 'd20' ? 20 : 8;
    const interval = setInterval(() => {
      setAnimatedRollNumber(Math.floor(Math.random() * maxVal) + 1);
    }, 45);
    return () => clearInterval(interval);
  }, [bg3DiceOverlay?.isRolling, bg3DiceOverlay?.phase, setAnimatedRollNumber]);

  // Debounced token positions & rotations save
  useEffect(() => {
    const scene = activeSceneRef.current;
    if (!scene || Object.keys(tokenPositions3D).length === 0) return;

    if (savePositionsTimerRef.current) clearTimeout(savePositionsTimerRef.current);

    savePositionsTimerRef.current = setTimeout(async () => {
      const currentScene = activeSceneRef.current;
      const currentCombatants = combatantsRef.current;
      if (!currentScene || !currentCombatants.length) return;

      let hasChanges = false;
      const updatedCombatants = currentCombatants.map((c, idx) => {
        // Use same unique key strategy as BattleGrid3D: id preferred, fall back to name+idx
        const key = c.id ? c.id : `${c.name}__${idx}`;
        const pos = tokenPositions3D[key] ?? tokenPositions3D[c.id || c.name];
        const rot = tokenRotations3D[key] ?? tokenRotations3D[c.id || c.name];

        const newX = pos !== undefined ? pos.x : c.x;
        const newZ = pos !== undefined ? pos.z : c.z;
        const newRot = rot !== undefined ? rot : c.rotation;

        if (newX !== c.x || newZ !== c.z || newRot !== c.rotation) {
          hasChanges = true;
        }

        return { ...c, x: newX, z: newZ, rotation: newRot };
      });

      if (hasChanges) {
        await updateScene({ ...currentScene, combatants: updatedCombatants });
      }
    }, 600);

    return () => {
      if (savePositionsTimerRef.current) clearTimeout(savePositionsTimerRef.current);
    };
  }, [tokenPositions3D, tokenRotations3D, updateScene]);

  // Sync active scene properties to live environment states
  // IMPORTANT: Depends on activeScene?.id (not full object) to prevent infinite loop.
  // The cycle was: updateScene → new activeScene ref → effect re-fires →
  // setCombatants → initializeFromCombatants → tokenPositions3D change →
  // save effect → updateScene → loop. Using the ref for reads breaks this cycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const scene = activeScene;
    if (!scene) return;

    if (scene.bgmCategory) {
      setActiveBgmCategory(scene.bgmCategory);
    }

    const targetHour =
      scene.timeOfDayHour ??
      (scene.timeOfDay === 'night'
        ? 24
        : scene.timeOfDay === 'sunset'
        ? 18
        : 12);
    const targetFog = scene.hasFog ?? scene.timeOfDay === 'fog';
    const targetRain = scene.hasRain ?? scene.timeOfDay === 'storm';

    setLiveTimeOfDayHour(targetHour);
    setLiveHasFog(targetFog);
    setLiveHasRain(targetRain);
    setLiveFloorTextureUrl(scene.floorTextureUrl || undefined);
    setLiveEnvironmentSettings(scene.environmentSettings || null);

    if (scene.timeOfDay) {
      setSelectedTimeOfDay(scene.timeOfDay);
    }

    if (scene.isBattleStarted !== undefined) {
      setIsBattleStarted(scene.isBattleStarted);
    }

    if (scene.id) {
      if (scene.combatants && scene.combatants.length > 0) {
        const sorted = [...scene.combatants].sort(
          (a, b) => (b.initiative || 0) - (a.initiative || 0)
        );

        const isNewScene = lastInitializedSceneIdRef.current !== scene.id;

        if (isNewScene) {
          // Only reset turn index and round on initial scene load
          lastInitializedSceneIdRef.current = scene.id;
          setCombatants(sorted);
          setCurrentTurnIndex(0);
          setRoundCount(1);
          setIsCombatActive(true);
          broadcastToPlayerView({ 
            payload: scene,
            combatants: sorted 
          });
          initializeFromCombatants(sorted);
        } else {
          // Same scene: sync token positions/models but DO NOT reset turn order
          initializeFromCombatants(sorted);
        }
      }
    }
  }, [activeScene?.id, activeScene?.combatants, activeScene?.isBattleStarted, setCombatants, initializeFromCombatants, setCurrentTurnIndex, setRoundCount, setIsCombatActive, setActiveBgmCategory, setLiveTimeOfDayHour, setLiveHasFog, setLiveHasRain, setLiveFloorTextureUrl, setLiveEnvironmentSettings, setSelectedTimeOfDay, setIsBattleStarted, broadcastToPlayerView]);




  // Listen to Character Model cross-tab broadcasts
  useEffect(() => {
    const handleModelUpdate = (sheet: any) => {
      if (!sheet || !sheet.characterName) return;

      const updatedModelUrl =
        sheet.modelUrl || getModelUrlByNameOrPath(sheet.className || sheet.characterName);
      const updatedTokenType: 'billboard' | '3d' = sheet.tokenType || '3d';
      const updatedAvatarUrl: string | undefined = sheet.avatarUrl;

      setCombatants((prev) => {
        let hasChanges = false;
        const next = prev.map((c) => {
          const cClean = c.name.split('(')[0].trim().toLowerCase();
          const sheetClean = (sheet.characterName || '').split('(')[0].trim().toLowerCase();
          const isMatch =
            cClean === sheetClean ||
            c.name.toLowerCase().includes(sheetClean) ||
            sheet.characterName?.toLowerCase().includes(cClean) ||
            (sheet.id && c.id.includes(sheet.id));

          if (isMatch) {
            if (c.modelUrl !== updatedModelUrl || c.tokenType !== updatedTokenType || c.avatarUrl !== updatedAvatarUrl) {
              hasChanges = true;
              return {
                ...c,
                modelUrl: updatedModelUrl,
                tokenType: updatedTokenType,
                tokenImageUrl: updatedTokenType === 'billboard' ? updatedAvatarUrl : undefined,
                avatarUrl: updatedAvatarUrl,
              };
            }
          }
          return c;
        });

        if (hasChanges) {
          if (broadcastCombatUpdate) {
            broadcastCombatUpdate({
              combatants: next,
              currentTurnIndex,
              roundCount,
            });
          }
          if (activeScene && updateScene) {
            updateScene({
              ...activeScene,
              combatants: next,
            });
          }
          return next;
        }
        return prev;
      });
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('masters_codex_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'CHARACTER_MODEL_UPDATED' && event.data?.sheet) {
          handleModelUpdate(event.data.sheet);
        }
      };
    } catch (e) {}

    const handleLocalEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        handleModelUpdate(customEvt.detail);
      }
    };

    window.addEventListener('masters_codex_character_model_updated', handleLocalEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('masters_codex_character_model_updated', handleLocalEvent);
    };
  }, [setCombatants, broadcastCombatUpdate, activeScene, updateScene, currentTurnIndex, roundCount]);

  // Listen to 3D Grid spell confirms
  useEffect(() => {
    const handleConfirmSpell = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (!customEvt.detail) return;

      const { casterTokenKey, spell, targetCombatantId, targetedCombatantIds } = customEvt.detail;
      const caster = combatants.find(
        (x) =>
          (x.id || x.name) === casterTokenKey ||
          x.id === casterTokenKey ||
          x.name === casterTokenKey
      );
      if (!caster) return;

      const matchingSheet = characterSheets.find((s) => {
        const cClean = caster.name.split('(')[0].trim().toLowerCase();
        return (
          s.characterName.toLowerCase() === cClean ||
          s.characterName.toLowerCase().includes(cClean) ||
          cClean.includes(s.characterName.toLowerCase())
        );
      });

      const characterSpell: CharacterSpell = matchingSheet?.spells?.find(
        (s) => s.name === spell.name
      ) || {
        id: spell.name,
        name: spell.name,
        level: spell.level || 0,
        school: 'evocation',
        castingTime: '1 ação',
        range: `${spell.range || 18}m`,
        components: 'V, S',
        description: spell.name,
        prepared: true,
      };

      const shape = spell.shape || 'circle';

      if (shape === 'multi-target') {
        const numDarts = 3 + Math.max(0, (characterSpell.level || 1) - 1);
        setMagicMissileModalState({
          isOpen: true,
          caster,
          spell: characterSpell,
          availableDarts: numDarts,
          dartAllocations: {},
        });
      } else if (shape === 'target') {
        const target = combatants.find((x) => x.id === targetCombatantId);
        executeSingleTargetSpell(caster, matchingSheet, characterSpell, target);
      } else {
        const validTargets = combatants.filter(
          (c) => targetedCombatantIds && targetedCombatantIds.includes(c.id) && c.id !== caster.id
        );
        executeAoESpellCast(caster, matchingSheet, characterSpell, validTargets);
      }

      setActiveSpellTargeting(null);
      setCasterTokenKey(null);
      setSpellTargetPosition(null);
    };

    window.addEventListener('masters_codex_confirm_spell_cast', handleConfirmSpell);
    return () => window.removeEventListener('masters_codex_confirm_spell_cast', handleConfirmSpell);
  }, [combatants, characterSheets, setActiveSpellTargeting, setCasterTokenKey, setSpellTargetPosition, setMagicMissileModalState]);

  // Helper functions
  const getMod = (stat?: number) => (stat ? Math.floor((stat - 10) / 2) : 0);

  const getSpeedInMeters = (speedStr?: string): number => {
    if (!speedStr) return 9;
    const cleaned = speedStr.toLowerCase().replace(/[^0-9\.]/g, '');
    const val = parseFloat(cleaned);
    if (isNaN(val)) return 9;
    if (speedStr.toLowerCase().includes('ft') || speedStr.toLowerCase().includes('pe')) {
      return val * 0.3;
    }
    return val;
  };

  const deductAction = (combatantId: string, actionType: 'action' | 'bonus' | 'reaction') => {
    setCombatants((prev) => {
      const next = prev.map((c) => {
        if (c.id === combatantId) {
          if (actionType === 'action') return { ...c, actionUsed: true };
          if (actionType === 'bonus') return { ...c, bonusActionUsed: true };
          if (actionType === 'reaction') return { ...c, reactionUsed: true };
        }
        return c;
      });
      if (activeScene) {
        updateScene({ ...activeScene, combatants: next });
      }
      return next;
    });
  };

  const handleHpChange = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
        return { ...c, hp: newHp };
      })
    );
  };

  const handleToggleCondition = (id: string, condition: ConditionType) => {
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
  };

  const addLogEntry = async (entry: Omit<CombatLogEntry, 'id' | 'timestamp' | 'round'>) => {
    const newLog: CombatLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      round: roundCount,
    };

    setCombatLogs((prev) => {
      const next = [...prev, newLog];
      broadcastCombatLogEntry(newLog);
      return next;
    });

    if (activeCampaign) {
      await createFeedEvent({
        campaignId: activeCampaign.id,
        sessionId: activeSession?.id,
        eventType: 'battle_summary',
        title: entry.description,
        summary: entry.description,
        isPublic: true,
      });
    }
  };

  // Listen to custom log entries (e.g. from hooks or other components)
  useEffect(() => {
    const handleLogEntry = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        addLogEntry(customEvt.detail);
      }
    };
    window.addEventListener('masters_codex_log_entry', handleLogEntry);
    return () => {
      window.removeEventListener('masters_codex_log_entry', handleLogEntry);
    };
  }, [addLogEntry]);

  const parseAndRollDamage = (desc?: string, defaultMod: number = 0, playSound: boolean = true): number => {
    if (!desc) {
      if (playSound) playDiceSound(1);
      return Math.floor(Math.random() * 8) + 1 + defaultMod;
    }
    const match = desc.match(/([0-9]+)d([0-9]+)(?:\s*[\+\-]\s*([0-9]+))?/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      const bonus = match[3] ? parseInt(match[3], 10) : 0;

      if (playSound) playDiceSound(count);

      let total = 0;
      for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
      return Math.max(1, total + bonus);
    }
    
    if (playSound) playDiceSound(1);
    return Math.max(1, Math.floor(Math.random() * 8) + 1 + defaultMod);
  };

  const rollDice = (
    title: string,
    mod: number,
    actorCombatant?: Combatant,
    actionDesc?: string,
    forceNoTarget: boolean = false,
    explicitTarget?: Combatant
  ): boolean => {
    const currentActor = actorCombatant || combatants[currentTurnIndex];
    const target = explicitTarget || combatants.find((c) => c.id === selectedTargetId);

    if (title.startsWith('Ataque') && !target && !forceNoTarget) {
      setPendingAttack({ title, mod, actorCombatant: currentActor, actionDesc });
      toast.info(`Mirando ${title}: Selecione o alvo no Grid 3D.`);
      return false;
    }

    const isAttack = title.startsWith('Ataque');

    // Open BG3 Overlay in unrolled state, passing onRollComplete callback
    setBg3DiceOverlay({
      title,
      actorName: currentActor?.name,
      targetName: target?.name,
      modifier: mod,
      targetAc: target?.ac,
      difficultyClass: target?.ac,
      damageDiceFormula: actionDesc || '1d8',
      isRolling: false,
      phase: 'd20',
      onRollComplete: (finalTotal: number, isHitResult: boolean, roll: number) => {
        const isCrit = roll === 20;
        const isFail = roll === 1;

        setDiceResult({
          title,
          roll,
          total: finalTotal,
          isCrit,
          isFail,
        });

        if (isAttack && currentActor) {
          if (target) {
            const isHit = isCrit || (!isFail && finalTotal >= target.ac);
            const resultText = isCrit ? '💥 ACERTO CRÍTICO!' : isHit ? '✓ ACERTOU!' : '✕ ERROU!';
            const desc = `${currentActor.name} executou ${title} contra ${target.name} (d20: ${roll} + mod = ${finalTotal} vs CA ${target.ac}) → ${resultText}`;

            addLogEntry({
              actorId: currentActor.id,
              actorName: currentActor.name,
              targetId: target.id,
              targetName: target.name,
              eventType: 'attack',
              actionName: title,
              d20Roll: roll,
              totalRoll: finalTotal,
              targetAc: target.ac,
              isHit,
              isCrit,
              isFail,
              description: desc,
            });

            if (isHit) {
              const dmg = parseAndRollDamage(actionDesc, mod, false);
              const prevHp = target.hp;
              handleHpChange(target.id, -dmg);
              const newHp = Math.max(0, target.hp - dmg);
              setBg3DiceOverlay((prev) => (prev ? { ...prev, damageAmount: dmg } : null));

              addLogEntry({
                actorId: currentActor.id,
                actorName: currentActor.name,
                targetId: target.id,
                targetName: target.name,
                eventType: 'damage',
                amount: dmg,
                description: `💥 ${currentActor.name} causou ${dmg} de dano em ${target.name} (HP: ${prevHp} → ${newHp})`,
              });

              if (newHp === 0) {
                addLogEntry({
                  actorId: target.id,
                  actorName: target.name,
                  eventType: 'death',
                  description: `💀 ${target.name} foi derrotado em combate!`,
                });
              }
            }
          } else {
            addLogEntry({
              actorId: currentActor.id,
              actorName: currentActor.name,
              eventType: 'attack',
              actionName: title,
              d20Roll: roll,
              totalRoll: finalTotal,
              isCrit,
              isFail,
              description: `${currentActor.name} rolou ${title}: d20(${roll}) = ${finalTotal}`,
            });
          }
        } else if (currentActor) {
          addLogEntry({
            actorId: currentActor.id,
            actorName: currentActor.name,
            eventType: 'save',
            d20Roll: roll,
            totalRoll: finalTotal,
            description: `${currentActor.name} fez teste de ${title}: d20(${roll}) = ${finalTotal}`,
          });
        }

        // Limpa o alvo selecionado e a mira após a finalização do ataque
        setSelectedTargetId(undefined);
        setPendingAttack(null);
        broadcastToPlayerView({ targetId: null });
      },
    });

    return true;
  };

  const handleCastSpellFromCard = (c: Combatant, sheet: CharacterSheet, spell: CharacterSpell) => {
    const aoe = getSpellAoEDefinition(spell.name);

    if (aoe) {
      setActiveSpellTargeting(aoe);
      const casterKey = c.id || c.name;
      setCasterTokenKey(casterKey);

      const pos =
        tokenPositions3D[casterKey] ||
        (c.id ? tokenPositions3D[c.id] : null) ||
        (c.name ? tokenPositions3D[c.name] : null) ||
        (c.x !== undefined && c.z !== undefined ? { x: c.x, z: c.z } : null);
      const casterIdx = combatants.findIndex(
        (x) =>
          (x.id || x.name) === casterKey ||
          x.id === c.id ||
          x.name === c.name
      );
      const fallbackX = casterIdx !== -1 ? (casterIdx % 5) * 2 - 5 : 0;
      const fallbackZ = casterIdx !== -1 ? Math.floor(casterIdx / 5) * 2 - 5 : 0;

      const casterX = pos ? pos.x : fallbackX;
      const casterZ = pos ? pos.z : fallbackZ;

      setSpellTargetPosition({ x: casterX, z: casterZ });
      if (aoe.shape === 'multi-target') {
        toast.info(`Magia ${spell.name}: Clique no grid para alocar os mísseis nos alvos.`);
      } else if (aoe.shape === 'target') {
        toast.info(`Magia ${spell.name}: Clique no alvo dentro do raio de ${aoe.range}m no grid.`);
      } else {
        toast.info(
          `Modo de mira de área ativado para ${spell.name} (${aoe.shape}). Mova o mouse no grid e clique para confirmar.`
        );
      }
    } else {
      executeSpellCastRoll(c, sheet, spell);
    }
  };

  const executeSingleTargetSpell = async (
    caster: Combatant,
    sheet: CharacterSheet | undefined,
    spell: CharacterSpell,
    target?: Combatant
  ) => {
    if (sheet && spell.level > 0 && sheet.spellSlots?.[spell.level]) {
      const currentSlots = sheet.spellSlots[spell.level];
      if (currentSlots.used < currentSlots.total) {
        const updatedSheet = {
          ...sheet,
          spellSlots: {
            ...sheet.spellSlots,
            [spell.level]: { ...currentSlots, used: currentSlots.used + 1 },
          },
        };
        const { saveSheet } = useCharacterSync({ userId: user?.id || '' });
        await saveSheet(updatedSheet);
      } else {
        toast.error(`Sem slots disponíveis para o Nível ${spell.level}!`);
        return;
      }
    }

    const cleanTime = (spell.castingTime || '').toLowerCase();
    const isBonusAction = cleanTime.includes('bônus') || cleanTime.includes('bonus');
    const isReaction = cleanTime.includes('reação') || cleanTime.includes('reaction');
    const actionType = isBonusAction ? 'bonus' : isReaction ? 'reaction' : 'action';
    deductAction(caster.id, actionType);

    const profBonus = sheet ? Math.floor((sheet.level - 1) / 4) + 2 : 2;
    const ability = sheet?.spellcastingAbility || 'int';
    const modValue = sheet ? getAttributeModifier(sheet, ability) : 3;
    const spellAttackBonus = sheet?.spellAttackBonusOverride ?? profBonus + modValue;

    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + spellAttackBonus;
    const isCrit = roll === 20;
    const isFail = roll === 1;

    let isHit = false;
    let damage = 0;

    if (target) {
      isHit = isCrit || (!isFail && total >= target.ac);
      if (isHit) {
        const cleanName = spell.name.toLowerCase();
        const diceSides =
          cleanName.includes('eldritch') || cleanName.includes('explosao') ? 10 : 8;
        damage = Math.floor(Math.random() * diceSides) + 1;
        if (isCrit) damage += Math.floor(Math.random() * diceSides) + 1;

        const newHp = Math.max(0, target.hp - damage);
        setCombatants((prev) => {
          const next = prev.map((c) => (c.id === target.id ? { ...c, hp: newHp } : c));
          if (activeScene) updateScene({ ...activeScene, combatants: next });
          return next;
        });
      }
    }

    setDiceResult({
      title: `${spell.name} -> ${target ? target.name : 'Alvo'}`,
      roll,
      total,
      isCrit,
      isFail,
    });

    const desc = target
      ? `${caster.name} disparou ${spell.name} em ${target.name} (d20: ${roll} + ${spellAttackBonus} = ${total} vs CA ${target.ac}). ${
          isHit
            ? `💥 ACERTOU! Caused ${damage} de dano! (HP restante: ${Math.max(0, target.hp - damage)})`
            : '✕ ERROU!'
        }`
      : `${caster.name} conjurou ${spell.name} (d20: ${roll} + ${spellAttackBonus} = ${total})`;

    toast(
      isHit
        ? `Ataque acertou ${target?.name}! Dano: ${damage}`
        : target
        ? `Ataque errou ${target.name}`
        : `Conjuração executada!`
    );

    addLogEntry({
      actorId: caster.id,
      actorName: caster.name,
      targetId: target?.id,
      targetName: target?.name,
      eventType: 'attack',
      description: desc,
    });
  };

  const executeAoESpellCast = async (
    caster: Combatant,
    sheet: CharacterSheet | undefined,
    spell: CharacterSpell,
    targets: Combatant[]
  ) => {
    if (sheet && spell.level > 0 && sheet.spellSlots?.[spell.level]) {
      const currentSlots = sheet.spellSlots[spell.level];
      if (currentSlots.used < currentSlots.total) {
        const updatedSheet = {
          ...sheet,
          spellSlots: {
            ...sheet.spellSlots,
            [spell.level]: { ...currentSlots, used: currentSlots.used + 1 },
          },
        };
        const { saveSheet } = useCharacterSync({ userId: user?.id || '' });
        await saveSheet(updatedSheet);
      } else {
        toast.error(`Sem slots disponíveis para o Nível ${spell.level}!`);
        return;
      }
    }

    const cleanTime = (spell.castingTime || '').toLowerCase();
    const isBonusAction = cleanTime.includes('bônus') || cleanTime.includes('bonus');
    const isReaction = cleanTime.includes('reação') || cleanTime.includes('reaction');
    const actionType = isBonusAction ? 'bonus' : isReaction ? 'reaction' : 'action';
    deductAction(caster.id, actionType);

    const profBonus = sheet ? Math.floor((sheet.level - 1) / 4) + 2 : 2;
    const ability = sheet?.spellcastingAbility || 'int';
    const modValue = sheet ? getAttributeModifier(sheet, ability) : 3;
    const spellSaveDc = sheet?.spellSaveDcOverride ?? 8 + profBonus + modValue;

    const cleanName = spell.name.toLowerCase();
    let diceCount = 3;
    let diceSides = 6;
    if (cleanName.includes('bola de fogo') || cleanName.includes('fireball')) {
      diceCount = 8;
      diceSides = 6;
    }

    let rawDamage = 0;
    for (let i = 0; i < diceCount; i++) {
      rawDamage += Math.floor(Math.random() * diceSides) + 1;
    }

    const damageMap: Record<string, number> = {};
    const logDetails: string[] = [];

    targets.forEach((t) => {
      const dexMod = t.dex !== undefined ? Math.floor((t.dex - 10) / 2) : 0;
      const dexSaveRoll = Math.floor(Math.random() * 20) + 1;
      const dexSaveTotal = dexSaveRoll + dexMod;
      const passed = dexSaveTotal >= spellSaveDc;
      const finalDmg = passed ? Math.floor(rawDamage / 2) : rawDamage;

      damageMap[t.id] = finalDmg;
      logDetails.push(
        `${t.name}: TR ${dexSaveRoll}+${dexMod}=${dexSaveTotal} vs CD ${spellSaveDc} (${
          passed ? 'PASSOU -> ' + finalDmg + ' dano' : 'FALHOU -> ' + finalDmg + ' dano'
        })`
      );
    });

    if (targets.length > 0) {
      setCombatants((prev) => {
        const next = prev.map((c) => {
          if (damageMap[c.id] !== undefined) {
            return { ...c, hp: Math.max(0, c.hp - damageMap[c.id]) };
          }
          return c;
        });
        if (activeScene) updateScene({ ...activeScene, combatants: next });
        return next;
      });
    }

    const desc =
      `${caster.name} conjurou ${spell.name} (Área)! Dano Base: ${rawDamage}. ` +
      (logDetails.length > 0 ? logDetails.join(' | ') : 'Nenhum alvo na área.');

    toast.info(
      `Área de ${spell.name}: ${targets.length} alvo(s) atingido(s)! Dano base: ${rawDamage}`
    );

    addLogEntry({
      actorId: caster.id,
      actorName: caster.name,
      eventType: 'damage',
      description: desc,
    });
  };

  const handleConfirmMagicMissiles = async () => {
    if (!magicMissileModalState) return;

    const { caster, spell, dartAllocations } = magicMissileModalState;
    const matchingSheet = characterSheets.find((s) => {
      const cClean = caster.name.split('(')[0].trim().toLowerCase();
      return (
        s.characterName.toLowerCase() === cClean ||
        s.characterName.toLowerCase().includes(cClean) ||
        cClean.includes(s.characterName.toLowerCase())
      );
    });

    if (matchingSheet && spell.level > 0 && matchingSheet.spellSlots?.[spell.level]) {
      const currentSlots = matchingSheet.spellSlots[spell.level];
      if (currentSlots.used < currentSlots.total) {
        const updatedSheet = {
          ...matchingSheet,
          spellSlots: {
            ...matchingSheet.spellSlots,
            [spell.level]: { ...currentSlots, used: currentSlots.used + 1 },
          },
        };
        const { saveSheet } = useCharacterSync({ userId: user?.id || '' });
        await saveSheet(updatedSheet);
      }
    }

    const cleanTime = (spell.castingTime || '').toLowerCase();
    const isBonusAction = cleanTime.includes('bônus') || cleanTime.includes('bonus');
    const isReaction = cleanTime.includes('reação') || cleanTime.includes('reaction');
    const actionType = isBonusAction ? 'bonus' : isReaction ? 'reaction' : 'action';
    deductAction(caster.id, actionType);

    const damageMap: Record<string, number> = {};
    const logDetails: string[] = [];
    let totalDartsToRoll = 0;

    Object.entries(dartAllocations).forEach(([targetId, count]) => {
      if (count <= 0) return;
      const targetC = combatants.find((c) => c.id === targetId);
      if (!targetC) return;

      totalDartsToRoll += count;

      let totalDmg = 0;
      for (let i = 0; i < count; i++) {
        totalDmg += Math.floor(Math.random() * 4) + 1 + 1;
      }
      damageMap[targetId] = totalDmg;
      logDetails.push(`${count} dardo(s) em ${targetC.name} (${totalDmg} dano)`);
    });

    if (totalDartsToRoll > 0) {
      playDiceSound(totalDartsToRoll);
    }

    if (Object.keys(damageMap).length > 0) {
      setCombatants((prev) => {
        const next = prev.map((c) => {
          if (damageMap[c.id] !== undefined) {
            return { ...c, hp: Math.max(0, c.hp - damageMap[c.id]) };
          }
          return c;
        });
        if (activeScene) {
          updateScene({ ...activeScene, combatants: next });
        }
        return next;
      });
    }

    const desc =
      `${caster.name} disparou ${spell.name}! ` +
      (logDetails.join(', ') || 'Nenhum dardo alocado.');
    toast.success(`Mísseis Mágicos disparados! ${logDetails.join(', ')}`);

    addLogEntry({
      actorId: caster.id,
      actorName: caster.name,
      eventType: 'damage',
      description: desc,
    });

    setMagicMissileModalState(null);
  };

  const executeSpellCastRoll = async (
    c: Combatant,
    sheet: CharacterSheet,
    spell: CharacterSpell
  ) => {
    if (spell.level > 0 && sheet.spellSlots?.[spell.level]) {
      const currentSlots = sheet.spellSlots[spell.level];
      if (currentSlots.used < currentSlots.total) {
        const updatedSheet = {
          ...sheet,
          spellSlots: {
            ...sheet.spellSlots,
            [spell.level]: {
              ...currentSlots,
              used: currentSlots.used + 1,
            },
          },
        };
        const { saveSheet } = useCharacterSync({ userId: user?.id || '' });
        await saveSheet(updatedSheet);
        toast.success(`Magia ${spell.name} lançada! Slot de Nível ${spell.level} consumido.`);
      } else {
        toast.error(`Sem slots disponíveis para o Nível ${spell.level}!`);
        return;
      }
    }

    const cleanTime = (spell.castingTime || '').toLowerCase();
    const isBonusAction = cleanTime.includes('bônus') || cleanTime.includes('bonus');
    const isReaction = cleanTime.includes('reação') || cleanTime.includes('reaction');
    const actionType = isBonusAction ? 'bonus' : isReaction ? 'reaction' : 'action';
    deductAction(c.id, actionType);

    const profBonus = Math.floor((sheet.level - 1) / 4) + 2;
    const ability = sheet.spellcastingAbility || 'int';
    const modValue = getAttributeModifier(sheet, ability);
    const spellAttackBonus = sheet.spellAttackBonusOverride ?? profBonus + modValue;
    const spellSaveDc = sheet.spellSaveDcOverride ?? 8 + profBonus + modValue;

    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + spellAttackBonus;
    const isCrit = roll === 20;
    const isFail = roll === 1;

    setDiceResult({
      title: `Conjurar: ${spell.name}`,
      roll,
      total,
      isCrit,
      isFail,
    });

    const target = combatants.find((x) => x.id === selectedTargetId);
    let desc = `${c.name} conjurou ${spell.name} (Nív. ${spell.level}) (CD TR: ${spellSaveDc})`;
    if (target) {
      desc = `${c.name} conjurou ${spell.name} contra ${target.name} (d20: ${roll} + ${spellAttackBonus} = ${total} vs CA ${target.ac}) (CD TR: ${spellSaveDc})`;
    }

    addLogEntry({
      actorId: c.id,
      actorName: c.name,
      targetId: target?.id,
      targetName: target?.name,
      eventType: 'attack',
      description: desc,
    });
  };

  const handleAttackFromWidget = (target: Combatant) => {
    setSelectedTargetId(target.id);
    broadcastToPlayerView({ targetId: target.id });

    const currentActor = combatants[currentTurnIndex];
    if (!currentActor) {
      toast.error('Nenhum combatente ativo no turno!');
      return;
    }

    const matchingSheet = characterSheets.find((s) => {
      const cClean = currentActor.name.split('(')[0].trim().toLowerCase();
      return (
        s.characterName.toLowerCase() === cClean ||
        s.characterName.toLowerCase().includes(cClean) ||
        cClean.includes(s.characterName.toLowerCase())
      );
    });

    let atkName = 'Ataque';
    let bonus = getMod(currentActor.str);
    let dmgDesc = '1d8';

    if (matchingSheet?.attacks && matchingSheet.attacks.length > 0) {
      const atk = matchingSheet.attacks[0];
      atkName = atk.name;
      bonus = parseInt(atk.atkBonus.replace('+', '').trim()) || 0;
      dmgDesc = atk.damage || '1d8';
    } else if (currentActor.actions && currentActor.actions.length > 0) {
      const act = currentActor.actions[0];
      atkName = act.name;
      const match = act.desc.match(/\+([0-9]+)/);
      bonus = match ? parseInt(match[1]) : getMod(currentActor.str);
      dmgDesc = act.desc;
    }

    const rolled = rollDice(`Ataque: ${atkName}`, bonus, currentActor, dmgDesc, false, target);
    if (rolled) {
      deductAction(currentActor.id, 'action');
      setPendingAttack(null);
      setSelectedTargetId(undefined);
      broadcastToPlayerView({ targetId: undefined });
    }
  };

  const handleConfirmBattleSetup = (
    mode: BattleSetupMode,
    timeOfDay: 'day' | 'sunset' | 'night' | 'fog' | 'storm'
  ) => {
    setBattleSetupMode(mode);
    setSelectedTimeOfDay(timeOfDay);
    setIsPlacementPhase(true);
    broadcastToPlayerView({
      isPlacementPhase: true,
      timeOfDay,
    });

    combatEngine.startCombat();
    combatEngine.handleRollInitiativeAll();
    setShowBattleSetupModal(false);
  };

  const handleStartImpromptuCombat = () => {
    setShowBattleSetupModal(true);
  };

  const handleEndCombat = () => {
    lastInitializedSceneIdRef.current = null;
    combatEngine.endCombat();
    onGenerateLoot();
  };

  const handleSlideChange = async (index: number) => {
    if (!activeScene) return;
    const updated = { ...activeScene, activeImageIndex: index };
    await updateScene(updated);
    sceneProjection.projectSceneToPlayerView(updated);
  };

  const handleFireSceneLive = (scene: any) => {
    lastInitializedSceneIdRef.current = null;
    setActiveScene(scene);
    sceneProjection.projectSceneToPlayerView(scene);
  };

  return (
    <div className="flex h-full w-full bg-[#0a0d14] overflow-hidden text-slate-100 font-sans">
      {/* 1. Left Sidebar: Cenas/Timeline */}
      <SceneTimelinePanel onFireSceneLive={handleFireSceneLive} />

      {/* 2. Main Middle: Projeção Visual / BattleGrid3D */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
        <LiveCockpitHeader
          activeScene={activeScene}
          liveDisplayMode={liveDisplayMode}
          setLiveDisplayMode={setLiveDisplayMode}
          onOpenCreateScene={() => setShowCreateSceneModal(true)}
          onOpenPlayerView={onOpenPlayerView}
          onToggleNotebook={() => setIsNotebookOpen((prev: boolean) => !prev)}
        />

        <div className="flex-1 flex min-h-0 relative">
          <div className="flex-1 flex flex-col min-w-0">
            <LiveVisualMirror
              onSlideChange={handleSlideChange}
              onAttackFromWidget={handleAttackFromWidget}
            />
            <AudioMaestro onOpenAudioPanel={onOpenAudioPanel} />
          </div>

          {/* 3. Right Sidebar: Iniciativa/Combate */}
          <CombatInitiativePanel
            characterSheets={characterSheets}
            getSpeedInMeters={getSpeedInMeters}
            rollDice={rollDice}
            deductAction={deductAction}
            handleHpChange={handleHpChange}
            handleToggleCondition={handleToggleCondition}
            handleCastSpellFromCard={handleCastSpellFromCard}
            handleNextTurn={combatEngine.handleNextTurn}
            handlePrevTurn={combatEngine.handlePrevTurn}
            handleEndCombat={handleEndCombat}
            handleStartImpromptuCombat={handleStartImpromptuCombat}
            onSlideChange={handleSlideChange}
          />
        </div>
      </div>

      {/* 4. Overlay: Floating d20 Results / BG3 roller canvas */}
      <FloatingDiceRollerHUD />

      {/* Safety Tools: X-Card / Pause Alert for DM */}
      <XCardAlertBanner
        alert={activeXCardAlert}
        onDismiss={() => setActiveXCardAlert(null)}
        onPauseSession={() => {
          toast.info('⏸️ Sessão pausada por 2 minutos. Respirem!');
          setActiveXCardAlert(null);
        }}
        onFadeToBlack={() => {
          toast.info('🌑 Cena esmaecida (Fade to Black). Encerrando a descrição.');
          setActiveXCardAlert(null);
        }}
      />

      {/* DM Notebook Persistent Drawer */}
      <DMNotebookDrawer
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        campaignId={activeCampaign?.id}
      />

      {/* 5. Modals Controller */}
      <LiveCockpitModalManager
        campaignMembers={campaignMembers || []}
        handleConfirmBattleSetup={(options) =>
          handleConfirmBattleSetup(options.setupMode, options.timeOfDay)
        }
        handleConfirmMagicMissiles={handleConfirmMagicMissiles}
        handleAttackFromWidget={handleAttackFromWidget}
      />
    </div>
  );
};
