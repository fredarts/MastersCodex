'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Film, 
  Play, 
  Swords, 
  Shield, 
  Heart, 
  Music, 
  Mic, 
  BookOpen, 
  Plus, 
  RotateCcw, 
  ChevronRight, 
  Skull, 
  Volume2, 
  Map as MapIcon, 
  Sparkles, 
  Radio, 
  Eye, 
  CheckCircle2, 
  MessageSquare,
  Compass,
  Beer,
  Search,
  Users,
  User,
  UserPlus,
  X,
  Dices,
  Edit3,
  Check,
  ScrollText
} from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useSession } from '@/lib/hooks/useSession';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useAuth } from '@/context/AuthContext';
import { useCharacterSync } from '@/lib/hooks/useCharacterSync';
import { getSpellAoEDefinition } from '@/lib/dnd5e-spells-shapes';
import { GameScene, SceneType, Combatant, ConditionType, CampaignMember, WorldEntity } from '@/lib/types';
import { INITIAL_MONSTERS, SFX_BUTTONS, CONDITIONS, BGM_TRACKS } from '@/lib/srd-data';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { useAudio } from '@/context/AudioContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { BattleLog } from '@/components/BattleLog';
import { Dice3DCanvas, DieType } from '@/components/Dice3DCanvas';
import { CombatLogEntry } from '@/lib/types';
import { CreateSceneModal } from '@/components/CreateSceneModal';
import { LiveCockpitHeader } from '@/components/live-cockpit/LiveCockpitHeader';
import { SceneProjectionSelector } from '@/components/live-cockpit/SceneProjectionSelector';
import { CombatTurnOrderPanel } from '@/components/live-cockpit/CombatTurnOrderPanel';
import { QuickAudioPanel } from '@/components/live-cockpit/QuickAudioPanel';
import { CombatInitiativeTracker } from '@/components/live-cockpit/CombatInitiativeTracker';
import { AddCombatantModal } from '@/components/live-cockpit/AddCombatantModal';
import { BattleSetupModal, BattleSetupMode } from '@/components/live-cockpit/BattleSetupModal';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';


interface LiveCockpitStudioProps {
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  currentTurnIndex: number;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  roundCount: number;
  setRoundCount: React.Dispatch<React.SetStateAction<number>>;
  onGenerateLoot: () => void;
  onOpenPlayerView: () => void;
}

export const LiveCockpitStudio: React.FC<LiveCockpitStudioProps> = ({
  combatants,
  setCombatants,
  currentTurnIndex,
  setCurrentTurnIndex,
  roundCount,
  setRoundCount,
  onGenerateLoot,
  onOpenPlayerView,
}) => {
  const { activeWorld, worldEntities } = useWorld();
  const { activeCampaign, campaignMembers, createFeedEvent } = useCampaign();
  const { 
    activeSession, 
    sessions, 
    setActiveSession, 
    scenes, 
    activeScene, 
    setActiveScene, 
    updateScene 
  } = useSession();
  const { 
    liveDisplayMode, 
    setLiveDisplayMode, 
    broadcastToPlayerView,
    projectedScene,
    tokenPositions3D,
    tokenRotations3D,
    initializeFromCombatants,
    activeSpellTargeting,
    setActiveSpellTargeting,
    casterTokenKey,
    setCasterTokenKey,
    spellTargetPosition,
    setSpellTargetPosition,
    openSheet,
  } = useLiveCockpit();

  const { user } = useAuth();
  const { characterSheets, saveSheet } = useCharacterSync({
    userId: user?.id || '',
    campaignId: activeCampaign?.id,
  });

  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [playingNpcVoice, setPlayingNpcVoice] = useState(false);
  const [activeBgmCategory, setActiveBgmCategory] = useState<string>('taverna');

  // Refs para save debounced de posições/rotações de tokens
  const savePositionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSceneRef = useRef(activeScene);
  const combatantsRef = useRef(combatants);
  useEffect(() => { activeSceneRef.current = activeScene; }, [activeScene]);
  useEffect(() => { combatantsRef.current = combatants; }, [combatants]);

  const { playBgm, pauseBgm, activeBgm, isPlayingBgm, playSfx } = useAudio();
  const [customAudios, setCustomAudios] = useState<any[]>([]);

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
  }, [activeCampaign?.id]);

  const srdBgms = BGM_TRACKS.map(t => ({ ...t, isCustom: false }));
  const customBgms = customAudios
    .filter(a => a.type === 'bgm')
    .map(a => ({ id: a.id, name: a.name, url: a.url, category: a.category, isLoop: a.is_loop, isCustom: true }));
  const allBgmTracks = [...srdBgms, ...customBgms];

  const srdSfxs = SFX_BUTTONS.map(s => ({ ...s, isLoop: false, isCustom: false }));
  const customSfxs = customAudios
    .filter(a => a.type === 'sfx')
    .map(a => ({ id: a.id, name: a.name, iconName: a.icon_name || 'Music', url: a.url, category: a.category, isCustom: true }));
  const allSfxTracks = [...srdSfxs, ...customSfxs];

  // Scene inline editing state
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editedSceneTitle, setEditedSceneTitle] = useState('');
  const lastSyncedSceneVersionRef = useRef<string | null>(null);

  // Combat State & Search Modal
  const [isCombatActive, setIsCombatActive] = useState<boolean>(false);
  const [openSpellDropdownId, setOpenSpellDropdownId] = useState<string | null>(null);
  const [showAddCombatantModal, setShowAddCombatantModal] = useState<boolean>(false);
  const [activeAddTab, setActiveAddTab] = useState<'monsters' | 'players' | 'custom' | 'npcs'>('monsters');
  const [combatantSearchQuery, setCombatantSearchQuery] = useState<string>('');

  // Battle Setup & 3D Placement Phase State
  const [showBattleSetupModal, setShowBattleSetupModal] = useState<boolean>(false);
  const [isPlacementPhase, setIsPlacementPhase] = useState<boolean>(false);
  const [battleSetupMode, setBattleSetupMode] = useState<BattleSetupMode>('normal');
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<'day' | 'sunset' | 'night' | 'fog' | 'storm'>('day');

  // Live Environment Override State (syncs from scene, can be modified live by DM)
  const [liveTimeOfDayHour, setLiveTimeOfDayHour] = useState<number>(12);
  const [liveHasFog, setLiveHasFog] = useState<boolean>(false);
  const [liveHasRain, setLiveHasRain] = useState<boolean>(false);
  const [liveFloorTextureUrl, setLiveFloorTextureUrl] = useState<string | undefined>(undefined);

  // Custom Combatant Form
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState(15);
  const [customAc, setCustomAc] = useState(13);
  const [customInit, setCustomInit] = useState(10);
  const [customType, setCustomType] = useState<'player' | 'monster' | 'npc'>('monster');

  
  const [autoInit, setAutoInit] = useState(false);
  const [hpInput, setHpInput] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<{title: string; roll: number; total: number; isCrit: boolean; isFail: boolean} | null>(null);

  useEffect(() => {
    if (diceResult) {
      const t = setTimeout(() => setDiceResult(null), 5000);
      return () => clearTimeout(t);
    }
  }, [diceResult]);

  const [pendingAttack, setPendingAttack] = useState<{ title: string; mod: number; actorCombatant?: Combatant; actionDesc?: string } | null>(null);
  
  const [bg3DiceOverlay, setBg3DiceOverlay] = useState<{
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
  } | null>(null);

  const [animatedRollNumber, setAnimatedRollNumber] = useState<number>(1);

  useEffect(() => {
    if (!bg3DiceOverlay || !bg3DiceOverlay.isRolling) return;

    const maxVal = bg3DiceOverlay.phase === 'd20' ? 20 : 8;
    const interval = setInterval(() => {
      setAnimatedRollNumber(Math.floor(Math.random() * maxVal) + 1);
    }, 45);

    return () => clearInterval(interval);
  }, [bg3DiceOverlay?.isRolling, bg3DiceOverlay?.phase]);

  const rollDice = (title: string, mod: number, actorCombatant?: Combatant, actionDesc?: string, forceNoTarget: boolean = false) => {
    const currentActor = actorCombatant || combatants[currentTurnIndex];
    const target = combatants.find(c => c.id === selectedTargetId);

    // Validate target for Attack rolls unless forced (AoE)
    if (title.startsWith('Ataque') && !target && !forceNoTarget) {
      setPendingAttack({ title, mod, actorCombatant: currentActor, actionDesc });
      return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + mod;
    const isCrit = roll === 20;
    const isFail = roll === 1;

    setDiceResult({
      title,
      roll,
      total,
      isCrit,
      isFail
    });

    const isAttack = title.startsWith('Ataque');
    const isHit = isAttack && target ? (isCrit || total >= target.ac) : undefined;
    let dmgAmount: number | undefined = undefined;

    if (isAttack && target && isHit) {
      dmgAmount = parseAndRollDamage(actionDesc, mod);
    }

    // Trigger BG3 Dice Overlay
    setBg3DiceOverlay({
      title,
      actorName: currentActor?.name,
      targetName: target?.name,
      d20Roll: roll,
      modifier: mod,
      totalRoll: total,
      targetAc: target?.ac,
      isHit,
      isCrit,
      isFail,
      damageDiceFormula: actionDesc || '1d8',
      damageAmount: dmgAmount,
      isRolling: true,
      phase: 'd20'
    });

    // Animate rolling numbers then reveal final result
    setTimeout(() => {
      setBg3DiceOverlay(prev => prev ? { ...prev, isRolling: false } : null);

      if (isHit && dmgAmount !== undefined) {
        setTimeout(() => {
          setBg3DiceOverlay(prev => prev ? { ...prev, phase: 'damage', isRolling: true } : null);
          setTimeout(() => {
            setBg3DiceOverlay(prev => prev ? { ...prev, isRolling: false } : null);
          }, 600);
        }, 1500);
      }
    }, 700);

    if (title.startsWith('Ataque') && currentActor) {
      if (target) {
        const isHit = isCrit || total >= target.ac;
        const resultText = isCrit ? '💥 ACERTO CRÍTICO!' : isHit ? '✓ ACERTOU!' : '✕ ERROU!';
        const desc = `${currentActor.name} executou ${title} contra ${target.name} (d20: ${roll} + ${mod} = ${total} vs CA ${target.ac}) → ${resultText}`;
        
        addLogEntry({
          actorId: currentActor.id,
          actorName: currentActor.name,
          targetId: target.id,
          targetName: target.name,
          eventType: 'attack',
          actionName: title,
          d20Roll: roll,
          totalRoll: total,
          targetAc: target.ac,
          isHit,
          isCrit,
          isFail,
          description: desc
        });

        // Automatic damage roll on Hit!
        if (isHit) {
          const dmg = parseAndRollDamage(actionDesc, mod);
          const prevHp = target.hp;
          handleHpChange(target.id, -dmg);
          const newHp = Math.max(0, target.hp - dmg);
          
          addLogEntry({
            actorId: currentActor.id,
            actorName: currentActor.name,
            targetId: target.id,
            targetName: target.name,
            eventType: 'damage',
            amount: dmg,
            description: `💥 ${currentActor.name} causou ${dmg} de dano em ${target.name} (HP: ${prevHp} → ${newHp})`
          });

          if (newHp === 0) {
            addLogEntry({
              actorId: target.id,
              actorName: target.name,
              eventType: 'death',
              description: `💀 ${target.name} foi derrotado em combate!`
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
          totalRoll: total,
          isCrit,
          isFail,
          description: `${currentActor.name} rolou ${title}: ${roll} + ${mod} = ${total}`
        });
      }
    } else if (currentActor) {
      addLogEntry({
        actorId: currentActor.id,
        actorName: currentActor.name,
        eventType: 'save',
        d20Roll: roll,
        totalRoll: total,
        description: `${currentActor.name} fez teste de ${title}: ${roll} + ${mod} = ${total}`
      });
    }
  };

  const getMod = (stat?: number) => stat ? Math.floor((stat - 10) / 2) : 0;

  
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(undefined);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<'init' | 'log' | 'teleprompter'>('init');
  const [teleprompterFontSize, setTeleprompterFontSize] = useState<number>(18);

  const addLogEntry = async (entry: Omit<CombatLogEntry, 'id' | 'timestamp' | 'round'>) => {
    const newLog: CombatLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      round: roundCount
    };

    setCombatLogs(prev => {
      const next = [...prev, newLog];
      broadcastToPlayerView({ combatLogs: next });
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

  const parseAndRollDamage = (desc?: string, defaultMod: number = 0): number => {
    if (!desc) return Math.floor(Math.random() * 8) + 1 + defaultMod;
    
    // Match patterns like 2d6+3, 1d8+2, 1d6
    const match = desc.match(/([0-9]+)d([0-9]+)(?:\s*[\+\-]\s*([0-9]+))?/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const sides = parseInt(match[2], 10);
      const bonus = match[3] ? parseInt(match[3], 10) : 0;
      
      let total = 0;
      for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
      return Math.max(1, total + bonus);
    }
    return Math.max(1, Math.floor(Math.random() * 8) + 1 + defaultMod);
  };

  const handleCastSpellFromCard = (c: Combatant, sheet: CharacterSheet, spell: CharacterSpell) => {
    const aoe = getSpellAoEDefinition(spell.name);
    
    if (aoe && aoe.shape && aoe.size > 0) {
      // Ativa o modo de mira
      setActiveSpellTargeting(aoe);
      setCasterTokenKey(c.id);
      // Posição inicial no próprio conjurador
      setSpellTargetPosition({ x: c.x ?? 1, z: c.z ?? 1 });
      toast.info(`Modo de mira de área ativado para ${spell.name} (${aoe.shape}). Mova o mouse no grid e clique para confirmar.`);
    } else {
      // Magias sem AoE (alvo único, self, toque, etc.)
      executeSpellCastRoll(c, sheet, spell);
    }
  };

  const executeSpellCastRoll = async (c: Combatant, sheet: CharacterSheet, spell: CharacterSpell) => {
    // Gastar 1 slot se for nível 1+
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
        await saveSheet(updatedSheet);
        toast.success(`Magia ${spell.name} lançada! Slot de Nível ${spell.level} consumido.`);
      } else {
        toast.error(`Sem slots disponíveis para o Nível ${spell.level}!`);
        return;
      }
    }

    const profBonus = Math.floor((sheet.level - 1) / 4) + 2;
    const ability = sheet.spellcastingAbility || 'int';
    const modValue = getMod(sheet.attributes?.[ability]);
    const spellAttackBonus = sheet.spellAttackBonusOverride ?? (profBonus + modValue);
    const spellSaveDc = sheet.spellSaveDcOverride ?? (8 + profBonus + modValue);

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

  // Salva posições e rotações dos tokens no banco com debounce de 600ms
  // Só persiste se houver alterações reais em relação ao que já está salvo nos combatants
  useEffect(() => {
    const scene = activeSceneRef.current;
    if (!scene || Object.keys(tokenPositions3D).length === 0) return;

    if (savePositionsTimerRef.current) clearTimeout(savePositionsTimerRef.current);

    savePositionsTimerRef.current = setTimeout(async () => {
      const currentScene = activeSceneRef.current;
      const currentCombatants = combatantsRef.current;
      if (!currentScene || !currentCombatants.length) return;

      let hasChanges = false;
      const updatedCombatants = currentCombatants.map((c) => {
        const key = c.id || c.name;
        const pos = tokenPositions3D[key];
        const rot = tokenRotations3D[key];

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenPositions3D, tokenRotations3D]);

  // Event listener para confirmação de conjurações do Grid 3D
  useEffect(() => {
    const handleConfirmSpell = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        const { casterTokenKey, spell } = customEvt.detail;
        const caster = combatants.find(x => x.id === casterTokenKey);
        if (!caster) return;

        const matchingSheet = characterSheets.find(s => {
          const cClean = caster.name.split('(')[0].trim().toLowerCase();
          return s.characterName.toLowerCase() === cClean || 
                 s.characterName.toLowerCase().includes(cClean) || 
                 cClean.includes(s.characterName.toLowerCase());
        });

        const characterSpell = matchingSheet?.spells?.find(s => s.name === spell.name);

        if (matchingSheet && characterSpell) {
          executeSpellCastRoll(caster, matchingSheet, characterSpell);
        }

        setActiveSpellTargeting(null);
        setCasterTokenKey(null);
        setSpellTargetPosition(null);
      }
    };

    window.addEventListener('masters_codex_confirm_spell_cast', handleConfirmSpell);
    return () => window.removeEventListener('masters_codex_confirm_spell_cast', handleConfirmSpell);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combatants, characterSheets]);

  // Sync Combat Active status with current scene or combatants array
  useEffect(() => {
    if (activeScene?.sceneType === 'combat' || combatants.length > 0) {
      setIsCombatActive(true);
    } else {
      setIsCombatActive(false);
    }
  }, [activeScene?.id, activeScene?.sceneType, combatants.length]);

  useEffect(() => {
    if (!activeScene) return;

    if (activeScene.bgmCategory) {
      setActiveBgmCategory(activeScene.bgmCategory);
    }

    const targetHour = activeScene.timeOfDayHour ?? (activeScene.timeOfDay === 'night' ? 24 : activeScene.timeOfDay === 'sunset' ? 18 : 12);
    const targetFog = activeScene.hasFog ?? (activeScene.timeOfDay === 'fog');
    const targetRain = activeScene.hasRain ?? (activeScene.timeOfDay === 'storm');

    setLiveTimeOfDayHour(targetHour);
    setLiveHasFog(targetFog);
    setLiveHasRain(targetRain);
    setLiveFloorTextureUrl(activeScene.floorTextureUrl || undefined);

    if (activeScene.timeOfDay) {
      setSelectedTimeOfDay(activeScene.timeOfDay);
    }

    const sceneVersionKey = `${activeScene.id}_${activeScene.updatedAt || ''}_${JSON.stringify(
      activeScene.combatants || []
    )}`;

    if (lastSyncedSceneVersionRef.current !== sceneVersionKey) {
      lastSyncedSceneVersionRef.current = sceneVersionKey;

      if (activeScene.combatants && activeScene.combatants.length > 0) {
        const sorted = [...activeScene.combatants].sort((a, b) => b.initiative - a.initiative);
        setCombatants(sorted);
        setCurrentTurnIndex(0);
        setRoundCount(1);
        setIsCombatActive(true);
        broadcastToPlayerView({ combatants: sorted });
        // Restaura posições/rotações salvas no banco
        initializeFromCombatants(sorted);
      }
    }
  }, [activeScene, setCombatants, initializeFromCombatants]);

  // Escuta atualizações instantâneas de modelo 3D do personagem (local e cross-tab)
  useEffect(() => {
    const handleModelUpdate = (sheet: any) => {
      if (!sheet || !sheet.characterName) return;

      const updatedModelUrl = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className || sheet.characterName);

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
            if (c.modelUrl !== updatedModelUrl) {
              hasChanges = true;
              return { ...c, modelUrl: updatedModelUrl };
            }
          }
          return c;
        });

        if (hasChanges) {
          broadcastToPlayerView({ combatants: next });
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
  }, [setCombatants]);

  const handleFireSceneLive = (scene: GameScene) => {
    setActiveScene(scene);

    const targetHour = scene.timeOfDayHour ?? (scene.timeOfDay === 'night' ? 24 : scene.timeOfDay === 'sunset' ? 18 : 12);
    const targetFog = scene.hasFog ?? (scene.timeOfDay === 'fog');
    const targetRain = scene.hasRain ?? (scene.timeOfDay === 'storm');

    setLiveTimeOfDayHour(targetHour);
    setLiveHasFog(targetFog);
    setLiveHasRain(targetRain);
    setLiveFloorTextureUrl(scene.floorTextureUrl || undefined);

    if (scene.timeOfDay) {
      setSelectedTimeOfDay(scene.timeOfDay);
    }

    // Auto-load scene's pre-programmed combatants
    if (scene.combatants && scene.combatants.length > 0) {
      const existingPlayers = combatantsRef.current.filter((c) => c.type === 'player');
      const nonPlayerMonsters = scene.combatants.filter(
        (sc) => !existingPlayers.some((p) => p.name.toLowerCase() === sc.name.toLowerCase())
      );
      const merged = [...existingPlayers, ...nonPlayerMonsters].sort((a, b) => b.initiative - a.initiative);

      setCombatants(merged);
      broadcastToPlayerView({ combatants: merged });
      setCurrentTurnIndex(0);
      setRoundCount(1);
      setIsCombatActive(true);

      // Restaura posições/rotações predefinidas salvas no banco
      initializeFromCombatants(merged);
    }

    if (scene.sceneType === 'combat') {
      setLiveDisplayMode('combat');
      setIsCombatActive(true);
    } else {
      setLiveDisplayMode('artwork');
    }

    const activeIdx = scene.activeImageIndex ?? 0;
    const activeSlide = scene.sceneImages?.[activeIdx];
    const targetImageUrl = activeSlide ? activeSlide.imageUrl : scene.imageUrl;
    const targetSensoryText = activeSlide ? (activeSlide.overlayText || scene.sensoryText) : scene.sensoryText;

    broadcastToPlayerView({
      sceneId: scene.id,
      title: scene.title,
      imageUrl: targetImageUrl ? normalizeImageUrl(targetImageUrl) : undefined,
      sensoryText: targetSensoryText,
      sceneImages: scene.sceneImages || [],
      activeImageIndex: activeIdx,
      mode: scene.sceneType === 'combat' ? 'combat' : 'artwork',
      timeOfDay: scene.timeOfDay || 'day',
      timeOfDayHour: targetHour,
      hasFog: targetFog,
      hasRain: targetRain,
      floorTextureUrl: scene.floorTextureUrl,
    });

    // Iniciar a primeira música associada à cena em loop
    if (scene.bgmTracks && scene.bgmTracks.length > 0) {
      const firstTrackId = scene.bgmTracks[0];
      const track = allBgmTracks.find(t => t.id === firstTrackId);
      if (track) {
        playBgm(track);
      }
    } else if (scene.bgmCategory) {
      const track = allBgmTracks.find(t => t.id === `bgm-${scene.bgmCategory}`);
      if (track) {
        playBgm(track);
      }
    }
  };

  const handleSlideChange = async (index: number) => {
    if (!activeScene || !activeScene.sceneImages) return;
    const updatedScene = {
      ...activeScene,
      activeImageIndex: index,
    };
    await updateScene(updatedScene);
    
    // Broadcast updated slide to player view
    const slide = activeScene.sceneImages[index];
    broadcastToPlayerView({
      sceneId: activeScene.id,
      title: activeScene.title,
      imageUrl: slide ? normalizeImageUrl(slide.imageUrl) : undefined,
      sensoryText: slide ? (slide.overlayText || activeScene.sensoryText) : activeScene.sensoryText,
      sceneImages: activeScene.sceneImages,
      activeImageIndex: index,
      mode: liveDisplayMode,
    });
  };

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    const nextIdx = (currentTurnIndex + 1) % combatants.length;
    let nextRoundCount = roundCount;
    if (nextIdx === 0) {
      nextRoundCount += 1;
      setRoundCount(nextRoundCount);
      
      if (autoInit) {
        setCombatants(prev => {
          const rolled = prev.map(c => {
             const dexMod = c.dex ? Math.floor((c.dex - 10) / 2) : 0;
             return { ...c, initiative: Math.floor(Math.random() * 20) + 1 + dexMod };
          });
          const sorted = rolled.sort((a,b) => b.initiative - a.initiative);
          broadcastToPlayerView({ combatants: sorted });
          return sorted;
        });
      }
    }
    setCurrentTurnIndex(nextIdx);
    setSelectedTargetId(undefined);
    broadcastToPlayerView({
      currentTurnIndex: nextIdx,
      roundCount: nextRoundCount,
      targetId: null,
    });
  };

  const handleHpChange = (id: string, delta: number) => {
    if (delta !== 0) {
      window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
        detail: { combatantId: id, type: delta < 0 ? 'damage' : 'heal', amount: Math.abs(delta) }
      }));
    }

    setCombatants((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
          return { ...c, hp: newHp };
        }
        return c;
      });
      broadcastToPlayerView({ combatants: next });
      return next;
    });
  };

  const handlePreciseHp = (id: string, isDamage: boolean) => {
    const val = parseInt(hpInput[id] || '0', 10);
    if (isNaN(val) || val <= 0) return;
    handleHpChange(id, isDamage ? -val : val);
    setHpInput(prev => ({...prev, [id]: ''}));
  };

  const handleToggleCondition = (id: string, cond: ConditionType) => {
    setCombatants((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const exists = c.conditions.includes(cond);
          const newConds = exists ? c.conditions.filter((x) => x !== cond) : [...c.conditions, cond];
          return { ...c, conditions: newConds };
        }
        return c;
      });
      broadcastToPlayerView({ combatants: next });
      return next;
    });
  };

  const handleAddPresetMonster = (m: typeof INITIAL_MONSTERS[0], count: number = 1) => {
    setCombatants((prev) => {
      const next = [...prev];
      const existingCount = prev.filter((c) => c.name.toLowerCase().startsWith(m.name.toLowerCase())).length;

      for (let i = 0; i < count; i++) {
        const num = existingCount + i + 1;
        const name = count > 1 || existingCount > 0 ? `${m.name} #${num}` : m.name;
        next.push({
          id: `c-sc-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          name,
          type: 'monster',
          hp: m.hp,
          maxHp: m.hp,
          ac: m.ac,
          initiative: Math.floor(Math.random() * 20) + 1,
          conditions: [],
          cr: m.cr,
        });
      }

      next.sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setIsCombatActive(true);
  };

  const handleAddNpcToCombat = (npc: WorldEntity) => {
    setCombatants((prev) => {
      const hp = Number(npc.attributes?.hp || npc.attributes?.pv || npc.attributes?.PV || 20);
      const ac = Number(npc.attributes?.ac || npc.attributes?.ca || npc.attributes?.CA || 12);

      const newC: Combatant = {
        id: `c-npc-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        name: npc.name,
        type: 'npc',
        hp: hp,
        maxHp: hp,
        ac: ac,
        initiative: Math.floor(Math.random() * 20) + 1,
        conditions: [],
        modelUrl: getModelUrlByNameOrPath(npc.name),
      };

      const next = [...prev, newC];
      next.sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setIsCombatActive(true);
  };

  const handleAddPlayerMember = (member: CampaignMember) => {
    const charName = member.characterName || member.displayName || 'Jogador';
    const alreadyIn = combatants.some((c) => c.name.toLowerCase() === charName.toLowerCase());
    if (alreadyIn) return;

    // 1. Usa o modelUrl vindo do cadastro do membro no Supabase (fonte de verdade cross-account)
    let resolvedModelUrl: string | undefined = member.modelUrl;

    // 2. Se não estiver no cadastro do membro, busca na ficha salva no localStorage (fallback local)
    if (!resolvedModelUrl) {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
        if (saved) {
          const sheets: any[] = JSON.parse(saved);
          const cClean = charName.split('(')[0].trim().toLowerCase();
          const found = sheets.find(
            (s) =>
              (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
              (s.characterName && charName.toLowerCase().includes(s.characterName.toLowerCase())) ||
              (s.characterName && s.characterName.toLowerCase().includes(charName.toLowerCase()))
          );
          if (found) {
            if (found.modelUrl) resolvedModelUrl = found.modelUrl;
            else if (found.className) resolvedModelUrl = getModelUrlByNameOrPath(found.className);
          }
        }
      } catch (e) {}
    }

    // 3. Fallback por nome
    if (!resolvedModelUrl) {
      resolvedModelUrl = getModelUrlByNameOrPath(charName);
    }

    const newC: Combatant = {
      id: `p-${member.id || Date.now()}`,
      name: charName,
      type: 'player',
      hp: 25,
      maxHp: 25,
      ac: 15,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      modelUrl: resolvedModelUrl,
    };

    setCombatants((prev) => {
      const next = [...prev, newC].sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setIsCombatActive(true);
  };

  const handleAddCustomCombatant = () => {
    if (!customName.trim()) return;
    const newC: Combatant = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      type: customType,
      hp: customHp,
      maxHp: customHp,
      ac: customAc,
      initiative: customInit,
      conditions: [],
    };
    setCombatants((prev) => {
      const next = [...prev, newC].sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setCustomName('');
    setIsCombatActive(true);
  };

  const handleDeleteCombatant = (id: string) => {
    setCombatants((prev) => {
      const next = prev.filter((c) => c.id !== id);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
  };

  const handleStartImpromptuCombat = () => {
    setShowBattleSetupModal(true);
  };

  const handleConfirmBattleSetup = (mode: BattleSetupMode, timeOfDay: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => {
    setBattleSetupMode(mode);
    setSelectedTimeOfDay(timeOfDay);

    const presetHours: Record<string, number> = { day: 12, sunset: 18, night: 24, fog: 6, storm: 2 };
    const hour = presetHours[timeOfDay] ?? 12;
    setLiveTimeOfDayHour(hour);
    if (timeOfDay === 'fog') setLiveHasFog(true);
    if (timeOfDay === 'storm') setLiveHasRain(true);

    setIsPlacementPhase(true);
    setIsCombatActive(true);
    setLiveDisplayMode('combat');
    setShowBattleSetupModal(false);
    setShowAddCombatantModal(true);

    broadcastToPlayerView({
      mode: 'combat',
      isPlacementPhase: true,
      setupMode: mode,
      timeOfDay,
      timeOfDayHour: hour,
      hasFog: timeOfDay === 'fog',
      hasRain: timeOfDay === 'storm',
    });
  };

  const handleEndCombat = async () => {
    onGenerateLoot();
    if (activeCampaign) {
      const monstersDefeated = combatants.filter((c) => c.type === 'monster').length;
      await createFeedEvent({
        campaignId: activeCampaign.id,
        sessionId: activeSession?.id,
        eventType: 'battle_summary',
        title: `⚔️ Vitória em Combate (Rodada ${roundCount})`,
        summary: `O grupo venceu os inimigos em ${roundCount} rodadas de combate intenso.`,
        details: {
          inimigos_derrotados: monstersDefeated || 1,
          tesouro: '24 Moedas de Prata, 12 Ouro, 1x Poção de Cura',
        },
        isPublic: true,
      });
    }

    setCombatants([]);
    setCurrentTurnIndex(0);
    setRoundCount(1);
    setIsCombatActive(false);
    setLiveDisplayMode('artwork');
    broadcastToPlayerView({ combatants: [] });
  };

  const getSceneIcon = (type: SceneType) => {
    switch (type) {
      case 'social':
        return <Beer className="w-3.5 h-3.5 text-amber-400" />;
      case 'dialogue':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'combat':
        return <Swords className="w-3.5 h-3.5 text-rose-400" />;
      case 'exploration':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const activeImageIndex = activeScene?.activeImageIndex ?? 0;
  const activeSlideImage = activeScene?.sceneImages?.[activeImageIndex];
  const displayImageUrl = activeSlideImage?.imageUrl 
    ? normalizeImageUrl(activeSlideImage.imageUrl) 
    : (activeScene?.imageUrl ? normalizeImageUrl(activeScene.imageUrl) : null);

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col h-full overflow-hidden select-none relative">
      {statusMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setStatusMenuOpen(null)} />}
      
      {/* Top Cockpit Header Bar */}
      <div className="bg-[#121824] border-b border-[#2a3449] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-mono">
                Estúdio Cockpit Ao Vivo
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> TRANSMITINDO
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <span>{activeWorld?.title || 'Mundo'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">{activeCampaign?.title || 'Campanha Sem Título'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">{activeSession?.title || 'Sessão Ativa'}</span>
            </div>
          </div>
        </div>

        {/* Live Mode Controls & Player View Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0a0d14] border border-[#2a3449] rounded-xl p-1 gap-1">
            <button
              onClick={() => {
                setLiveDisplayMode('artwork');
                broadcastToPlayerView({ mode: 'artwork' });
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                liveDisplayMode === 'artwork'
                  ? 'bg-purple-600 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Modo Arte</span>
            </button>

            <button
              onClick={() => {
                setLiveDisplayMode('combat');
                broadcastToPlayerView({ mode: 'combat' });
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                liveDisplayMode === 'combat'
                  ? 'bg-rose-600 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3 h-3" />
              <span>Modo Combate</span>
            </button>
          </div>

          <button
            onClick={onOpenPlayerView}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Tela do Jogador</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Cockpit Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Timeline de Cenas da Sessão (Left - 300px) */}
        <div className="w-72 bg-[#0c0f17] border-r border-[#2a3449] flex flex-col justify-between overflow-hidden">
          <div className="p-3 border-b border-[#2a3449] flex items-center justify-between bg-[#121824]/50">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              Timeline da Sessão ({scenes.length})
            </span>
            <button
              onClick={() => setShowCreateSceneModal(true)}
              className="p-1 text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors"
              title="Nova Cena"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {scenes.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#2a3449] rounded-xl">
                Nenhuma cena criada nesta sessão. Crie uma cena para disparar recursos visuais.
              </div>
            ) : (
              scenes.map((sc, idx) => {
                const isActive = activeScene?.id === sc.id;
                const isEditingThis = editingSceneId === sc.id;
                return (
                  <div
                    key={`${sc.id}-${idx}`}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-950/60 via-[#161c28] to-[#121824] border-purple-500 shadow-lg ring-1 ring-purple-500/40'
                        : 'bg-[#161c28] border-[#2a3449] hover:bg-[#1f2738]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate flex-1 pr-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                        {getSceneIcon(sc.sceneType)}
                        {isEditingThis ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              autoFocus
                              value={editedSceneTitle}
                              onChange={(e) => setEditedSceneTitle(e.target.value)}
                              className="bg-[#0a0d14] border border-purple-500 rounded px-1.5 py-0.5 text-xs text-slate-100 font-bold focus:outline-none w-full"
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  if (editedSceneTitle.trim()) await updateScene({ ...sc, title: editedSceneTitle.trim() });
                                  setEditingSceneId(null);
                                }
                                if (e.key === 'Escape') setEditingSceneId(null);
                              }}
                            />
                            <button
                              onClick={async () => {
                                if (editedSceneTitle.trim()) await updateScene({ ...sc, title: editedSceneTitle.trim() });
                                setEditingSceneId(null);
                              }}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 truncate group flex-1">
                            <span className="text-xs font-bold text-slate-100 truncate">{sc.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSceneId(sc.id);
                                setEditedSceneTitle(sc.title);
                              }}
                              className="p-0.5 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                              title="Editar Nome da Cena"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isActive && !isEditingThis && (
                        <span className="text-[9px] font-black uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded animate-pulse">
                          AO VIVO
                        </span>
                      )}
                    </div>

                    {/* Scene Media Capabilities Indicators */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      {sc.imageUrl && (
                        <span className="text-purple-300 flex items-center gap-0.5">🖼️ Imagem</span>
                      )}
                      {sc.npcAudioUrl && (
                        <span className="text-cyan-300 flex items-center gap-0.5">🎙️ Voz NPC</span>
                      )}
                      {sc.combatants && sc.combatants.length > 0 && (
                        <span className="text-rose-300 flex items-center gap-0.5">⚔️ {sc.combatants.length} Inimigos</span>
                      )}
                    </div>

                    {/* Trigger Live Button */}
                    <button
                      onClick={() => handleFireSceneLive(sc)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400'
                          : 'bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-200'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isActive ? 'CENA TRANSMITINDO' : 'DISPARAR AO VIVO'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Espelho de Projeção & Tabuleiro (Center - Flex 1) */}
        <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden border-r border-[#2a3449]">
          <div className="bg-[#121824]/80 p-3 border-b border-[#2a3449] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Projeção dos Jogadores (Espelho ao Vivo)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Modo Atual: <strong className="text-amber-400 uppercase">{liveDisplayMode}</strong>
            </span>
          </div>

          <div className="flex-1 p-4 flex flex-col min-h-0 space-y-4 overflow-hidden">
            {/* Live Visual Mirror Display Container */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <div className="h-full w-full max-h-full max-w-full aspect-square bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center">
                {liveDisplayMode === 'combat' ? (
                  <ThreeErrorBoundary>
                    <BattleGrid3D
                      combatants={combatants}
                      onUpdateCombatants={(updated) => setCombatants(updated)}
                      currentTurnIndex={currentTurnIndex}
                      selectedTargetId={selectedTargetId}
                      onSelectTarget={(target) => {
                        setSelectedTargetId(target.id);
                        broadcastToPlayerView({ targetId: target.id });
                      }}
                      interactive={true}
                      isPlacementPhase={isPlacementPhase}
                      setupMode={battleSetupMode}
                      timeOfDayHour={liveTimeOfDayHour}
                      timeOfDayPreset={selectedTimeOfDay}
                      hasFog={liveHasFog}
                      hasRain={liveHasRain}
                      onTimeOfDayChange={(preset) => {
                        setSelectedTimeOfDay(preset);
                        broadcastToPlayerView({
                          timeOfDay: preset,
                        });
                      }}
                      onEnvironmentChange={(env) => {
                        setLiveTimeOfDayHour(env.timeOfDayHour);
                        setLiveHasFog(env.hasFog);
                        setLiveHasRain(env.hasRain);
                        broadcastToPlayerView({
                          timeOfDayHour: env.timeOfDayHour,
                          hasFog: env.hasFog,
                          hasRain: env.hasRain,
                        });
                      }}
                      floorTextureUrl={liveFloorTextureUrl}
                      onFloorTextureChange={(url) => {
                        setLiveFloorTextureUrl(url);
                        broadcastToPlayerView({ floorTextureUrl: url });
                      }}
                      onConfirmPlacement={() => {
                        setIsPlacementPhase(false);
                        broadcastToPlayerView({ isPlacementPhase: false });
                      }}
                      userRole="dm"
                    />
                  </ThreeErrorBoundary>
                ) : displayImageUrl ? (
                  <div className="w-full h-full relative">
                    {activeScene?.sceneImages && activeScene.sceneImages.length > 0 ? (
                      <MagicShaderSlideshow
                        imageUrl={displayImageUrl}
                        className="w-full h-full"
                      />
                    ) : (
                      <img src={displayImageUrl} alt="Arte ao vivo" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-amber-500/30">
                      <div className="text-xs font-bold text-amber-400 uppercase font-mono">{activeScene?.title}</div>
                      {(() => {
                        const txt = activeSlideImage?.overlayText || activeScene?.sensoryText;
                        return txt ? (
                          <p className="text-xs text-slate-200 mt-1 italic font-serif leading-relaxed line-clamp-2">
                            "{txt}"
                          </p>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <MapIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Nenhuma arte ou mapa transmitido no momento.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Slideshow DM Controls */}
            {activeScene?.sceneImages && activeScene.sceneImages.length > 1 && (
              <div className="bg-[#121824] border border-[#2a3449] rounded-xl p-2.5 flex flex-col gap-2 shadow mx-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    Controle do Slideshow ({activeImageIndex + 1} de {activeScene.sceneImages.length})
                  </span>
                  <div className="flex gap-1.5 font-sans">
                    <button
                      onClick={async () => {
                        const prevIdx = (activeImageIndex - 1 + activeScene.sceneImages!.length) % activeScene.sceneImages!.length;
                        await handleSlideChange(prevIdx);
                      }}
                      className="px-2 py-0.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[10px] font-bold text-amber-400 cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={async () => {
                        const nextIdx = (activeImageIndex + 1) % activeScene.sceneImages!.length;
                        await handleSlideChange(nextIdx);
                      }}
                      className="px-2 py-0.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[10px] font-bold text-amber-400 cursor-pointer"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
                
                {/* Thumbnails strip */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                  {activeScene.sceneImages.map((imgObj, idx) => {
                    const isSelected = idx === activeImageIndex;
                    return (
                      <button
                        key={imgObj.id}
                        onClick={async () => await handleSlideChange(idx)}
                        className={`relative w-10 h-10 rounded border overflow-hidden shrink-0 transition-all cursor-pointer ${
                          isSelected ? 'border-amber-400 ring-1 ring-amber-500/40 scale-105' : 'border-[#2a3449] hover:border-slate-500'
                        }`}
                      >
                        <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[8px] font-bold px-1 rounded text-white font-mono">
                          {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick DM Media & Soundboard Toolbar */}
            <div className="grid grid-cols-2 gap-3">
              {/* NPC Voice Trigger Box */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voz de NPC (IA)
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                    {activeScene?.npcName || 'Nenhum NPC vinculado'}
                  </div>
                </div>
                <button
                  disabled={!activeScene?.npcAudioUrl}
                  onClick={() => setPlayingNpcVoice(!playingNpcVoice)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeScene?.npcAudioUrl
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                      : 'bg-[#1a2234] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{playingNpcVoice ? 'Pausar Voz' : 'Tocar Voz'}</span>
                </button>
              </div>

              {/* BGM Active Scene Playlist */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl space-y-2">
                <div className="text-[10px] font-bold text-pink-400 uppercase font-mono flex items-center gap-1">
                  <Music className="w-3.5 h-3.5" /> BGM da Cena Ativa
                </div>
                
                {(!activeScene?.bgmTracks || activeScene.bgmTracks.length === 0) ? (
                  <div className="text-[10px] text-slate-500 italic">Nenhuma música configurada.</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {activeScene.bgmTracks.map(trackId => {
                      const track = allBgmTracks.find(t => t.id === trackId);
                      if (!track) return null;
                      const isActive = activeBgm?.id === track.id;
                      return (
                        <button
                          key={trackId}
                          onClick={() => {
                            if (isActive && isPlayingBgm) {
                              pauseBgm();
                            } else {
                              playBgm(track);
                            }
                          }}
                          className={`w-full py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isActive && isPlayingBgm
                              ? 'bg-pink-600 text-slate-950 font-bold shadow-md animate-pulse'
                              : 'bg-[#0a0d14] hover:bg-[#1a2233] text-slate-300 border border-[#2a3449]'
                          }`}
                        >
                          <span className="truncate mr-2">{track.name}</span>
                          <span className="shrink-0 text-[10px] font-bold">{isActive && isPlayingBgm ? 'PAUSAR' : 'TOCAR'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Soundboard SFX da Cena */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl space-y-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> SFX Rápidos da Cena
                </div>
                
                {(!activeScene?.sfxShortcuts || activeScene.sfxShortcuts.length === 0) ? (
                  <div className="text-[10px] text-slate-500 italic">Nenhum efeito configurado.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {activeScene.sfxShortcuts.map(sfxId => {
                      const sfx = allSfxTracks.find(s => s.id === sfxId);
                      if (!sfx) return null;
                      return (
                        <button
                          key={sfxId}
                          onClick={() => playSfx(sfx.url)}
                          className="py-1 px-2 rounded-lg text-[10px] font-bold bg-[#0a0d14] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-[#2a3449] transition-all truncate text-center cursor-pointer"
                          title={`Disparar Efeito: ${sfx.name}`}
                        >
                          {sfx.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Painel de Iniciativa & Combate Ao Vivo (Right - 380px) */}
        <div className="w-[380px] bg-[#0c0f17] flex flex-col justify-between overflow-hidden border-l border-[#2a3449] relative">
          
          {/* Floating Dice Result */}
          {diceResult && (
            <div className="absolute top-16 right-4 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
              <div className={`bg-[#0f141d]/95 backdrop-blur-xl border-2 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[250px]
                ${diceResult.isCrit ? 'border-amber-500 shadow-amber-500/20' : diceResult.isFail ? 'border-rose-600 shadow-rose-900/20' : 'border-slate-600'}
              `}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-inner
                  ${diceResult.isCrit ? 'bg-amber-500 text-slate-950' : diceResult.isFail ? 'bg-rose-600 text-slate-950' : 'bg-[#1e293b] text-slate-100'}
                `}>
                  {diceResult.roll}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{diceResult.title}</div>
                  <div className="text-2xl font-black text-slate-100">Total: {diceResult.total}</div>
                </div>
                <button onClick={() => setDiceResult(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-600 flex items-center justify-center text-xs">×</button>
              </div>
            </div>
          )}

          {/* Header with Sub-tabs */}
          <div className="p-2 border-b border-[#2a3449] bg-[#121824]/50 flex items-center justify-between gap-1">
            <div className="flex bg-[#0a0d14] border border-[#2a3449] rounded-xl p-0.5 w-full gap-0.5">
              <button
                onClick={() => setRightPanelTab('init')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  rightPanelTab === 'init' ? 'bg-rose-600 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Swords className="w-3 h-3" />
                <span>Iniciativa ({combatants.length})</span>
              </button>
              
              <button
                onClick={() => setRightPanelTab('teleprompter')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  rightPanelTab === 'teleprompter' ? 'bg-purple-600 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Teleprompter</span>
              </button>

              <button
                onClick={() => setRightPanelTab('log')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  rightPanelTab === 'log' ? 'bg-amber-500 text-slate-950 shadow font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ScrollText className="w-3 h-3" />
                <span>Logs ({combatLogs.length})</span>
              </button>
            </div>
          </div>

          {rightPanelTab === 'teleprompter' ? (
            <div className="flex-1 flex flex-col justify-between p-4 overflow-hidden bg-[#0c0f17]">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Teleprompter do Narrador
                  </span>
                  
                  {/* Font Size controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTeleprompterFontSize(prev => Math.max(12, prev - 2))}
                      className="w-6 h-6 rounded bg-[#161c28] border border-[#2a3449] hover:border-slate-500 text-xs font-bold text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                      title="Diminuir Fonte"
                    >
                      A-
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">{teleprompterFontSize}px</span>
                    <button
                      onClick={() => setTeleprompterFontSize(prev => Math.min(32, prev + 2))}
                      className="w-6 h-6 rounded bg-[#161c28] border border-[#2a3449] hover:border-slate-500 text-xs font-bold text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                      title="Aumentar Fonte"
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Teleprompter text content */}
                {activeScene ? (
                  <div 
                    className="font-serif leading-relaxed italic text-amber-200 select-text p-3 rounded-xl bg-[#121824]/40 border border-[#2a3449]/40 min-h-[120px] whitespace-pre-wrap"
                    style={{ fontSize: `${teleprompterFontSize}px` }}
                  >
                    {(() => {
                      const slideObj = activeScene.sceneImages?.[activeImageIndex];
                      const targetText = slideObj ? (slideObj.secretNotes || slideObj.overlayText || activeScene.sensoryText) : activeScene.sensoryText;
                      return targetText ? `"${targetText}"` : "Nenhum texto sensorial ou nota de teleprompter configurada para este slide.";
                    })()}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500 text-xs">
                    Nenhuma cena ativa para exibir no teleprompter.
                  </div>
                )}
                
                {/* Notes visible only to DM */}
                {activeScene?.secretNotes && (
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                    <div className="text-[9px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                      🔑 Notas Secretas da Cena (Apenas Narrador)
                    </div>
                    <p className="text-xs text-purple-200 leading-relaxed font-serif">
                      {activeScene.secretNotes}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Bottom Quick slide switcher inside teleprompter */}
              {activeScene?.sceneImages && activeScene.sceneImages.length > 1 && (
                <div className="pt-3 border-t border-[#2a3449] flex items-center justify-between">
                  <button
                    onClick={async () => {
                      const prevIdx = (activeImageIndex - 1 + activeScene.sceneImages!.length) % activeScene.sceneImages!.length;
                      await handleSlideChange(prevIdx);
                    }}
                    className="flex-1 py-1.5 mr-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-xs font-bold text-slate-200 rounded-lg text-center cursor-pointer"
                  >
                    ◀ Anterior
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono px-3 font-semibold">
                    {activeImageIndex + 1} / {activeScene.sceneImages.length}
                  </span>
                  <button
                    onClick={async () => {
                      const nextIdx = (activeImageIndex + 1) % activeScene.sceneImages!.length;
                      await handleSlideChange(nextIdx);
                    }}
                    className="flex-1 py-1.5 ml-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-xs font-bold text-slate-200 rounded-lg text-center cursor-pointer"
                  >
                    Próximo ▶
                  </button>
                </div>
              )}
            </div>
          ) : rightPanelTab === 'log' ? (
            <BattleLog 
              logs={combatLogs}
              activeAttacker={combatants[currentTurnIndex]}
              activeTarget={combatants.find(c => c.id === selectedTargetId)}
              onClearLogs={() => setCombatLogs([])}
              onSelectTarget={(target) => {
                setSelectedTargetId(target.id);
                broadcastToPlayerView({ targetId: target.id });
              }}
            />
          ) : !isCombatActive && combatants.length === 0 ? (
            /* Clean Empty State when no combat active */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#121824] border border-[#2a3449] flex items-center justify-center shadow-inner">
                <Swords className="w-7 h-7 text-rose-400 opacity-60" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Sem Combate Ativo</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                  Esta cena está em modo narrativo / exploração. Nenhum combate ativo no momento.
                </p>
              </div>
              <button
                onClick={handleStartImpromptuCombat}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>INICIAR COMBATE NESTA CENA</span>
              </button>
            </div>
          ) : (
            /* Active Combat Interface */
            <>
              {/* Turn & Add Combatants Toolbar */}
              <div className="p-2 border-b border-[#2a3449] bg-[#161c28]/40 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleNextTurn}
                    disabled={combatants.length === 0}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-[#1f2738] disabled:text-slate-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>AVANÇAR TURNO</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 mt-1 pl-1">
                  <label className="flex items-center gap-1.5 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoInit ? 'bg-amber-500 border-amber-500' : 'bg-[#0a0d14] border-[#2a3449] group-hover:border-amber-500/50'}`}>
                      {autoInit && <Check className="w-3 h-3 text-slate-900" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={autoInit} onChange={(e) => setAutoInit(e.target.checked)} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-300">
                      Rolar Iniciativa todo turno
                    </span>
                  </label>
                </div>

                <button
                  onClick={() => setShowAddCombatantModal(true)}
                  className="w-full py-1.5 mt-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Adicionar Combatentes</span>
                </button>
              </div>

              {/* Live Combatants List */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {combatants.map((c, idx) => {
                  const isTurn = idx === currentTurnIndex;
                  const isTarget = c.id === selectedTargetId;
                  const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
                  const isExpanded = expandedId === c.id;
                  const isStatusOpen = statusMenuOpen === c.id;

                  // Busca ficha associada
                  const matchingSheet = characterSheets.find(s => {
                    const cClean = c.name.split('(')[0].trim().toLowerCase();
                    return s.characterName.toLowerCase() === cClean || 
                           s.characterName.toLowerCase().includes(cClean) || 
                           cClean.includes(s.characterName.toLowerCase());
                  });

                  const groupedSpells = matchingSheet ? (() => {
                    const groups: Record<number, CharacterSpell[]> = {};
                    matchingSheet.spells?.forEach(spell => {
                      const lvl = spell.level ?? 0;
                      if (!groups[lvl]) groups[lvl] = [];
                      groups[lvl].push(spell);
                    });
                    return groups;
                  })() : {};

                  return (
                    <div
                      key={`${c.id}-${idx}`}
                      onClick={() => {
                        setSelectedTargetId(c.id);
                        broadcastToPlayerView({ targetId: c.id });
                      }}
                      className={`p-3 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                        isTarget
                          ? 'ring-2 ring-rose-500 border-rose-500 shadow-rose-900/30'
                          : ''
                      } ${
                        isTurn
                          ? 'bg-gradient-to-r from-rose-950/40 via-[#161c28] to-[#121824] border-rose-500/80 shadow-xl'
                          : 'bg-[#121824] border-[#2a3449] opacity-90 hover:opacity-100'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        {/* Left Info */}
                        <div className="flex items-start gap-3 min-w-[200px]">
                          <div className="w-9 h-9 rounded-xl bg-[#0a0d14] border border-[#2a3449] flex flex-col items-center justify-center font-mono font-bold text-amber-400 shadow-inner">
                            <span className="text-[8px] text-slate-500 font-sans">INIT</span>
                            <span className="text-xs leading-none">{c.initiative}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 
                                onClick={(e) => {
                                  e.stopPropagation(); // Evita selecionar o alvo ao abrir a ficha
                                  openSheet(c.id || c.name, c.type, c.name, c);
                                }}
                                className="font-bold text-slate-100 text-xs flex items-center gap-1 cursor-pointer hover:text-amber-400 hover:underline transition-colors"
                              >
                                {c.name}
                                {isTarget && <span className="text-[9px] text-rose-400 font-mono font-bold">(ALVO)</span>}
                              </h4>
                              {isTurn && (
                                <span className="text-[8px] font-black uppercase bg-rose-500 text-slate-950 px-1.5 py-0.5 rounded animate-pulse">ATUAL</span>
                              )}
                            </div>

                            {/* Condition Badges */}
                            <div className="flex flex-wrap gap-1 mt-1 relative">
                              {c.conditions.map((cond) => (
                                <span key={cond} onClick={(e) => { e.stopPropagation(); handleToggleCondition(c.id, cond); }} className="text-[8px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-rose-500/40">
                                  {cond} ×
                                </span>
                              ))}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setStatusMenuOpen(isStatusOpen ? null : c.id); }}
                                className="text-[8px] font-bold text-slate-400 bg-[#0f141d] hover:bg-[#1e293b] border border-[#2a3449] px-1.5 py-0.5 rounded-full transition-colors flex items-center gap-1"
                              >
                                + Status
                              </button>
                              
                              {/* Status Popover */}
                              {isStatusOpen && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f141d] border border-slate-700 rounded-xl shadow-2xl p-2 z-20 grid grid-cols-2 gap-1">
                                  {CONDITIONS.map(cond => {
                                    const active = c.conditions.includes(cond);
                                    return (
                                      <button
                                        key={cond}
                                        onClick={(e) => { e.stopPropagation(); handleToggleCondition(c.id, cond); }}
                                        className={`text-[9px] text-left px-2 py-1 rounded ${active ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:bg-[#1e293b]'}`}
                                      >
                                        {active ? '✓ ' : ''}{cond}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className={`p-1.5 rounded-lg border transition-colors ${isExpanded ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#0f141d] border-[#2a3449] text-slate-400 hover:text-slate-200'}`} title="Ações e Rolagens">
                            <Dices className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteCombatant(c.id)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Precise HP System */}
                      <div className="flex flex-wrap items-center justify-between gap-3 mt-1 bg-[#0a0d14]/50 p-2 rounded-xl border border-[#2a3449]/50" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                           <div className="bg-[#0a0d14] px-2 py-1 rounded-lg border border-cyan-900/50 shadow-inner">
                             <div className="text-[8px] font-bold text-cyan-500/70 uppercase leading-none">CA</div>
                             <div className="text-xs font-mono font-black text-cyan-300 leading-none">{c.ac}</div>
                           </div>
                           
                           <div className="w-24">
                              <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
                                <span className="text-rose-400 flex items-center gap-1">HP</span>
                                <span className="text-slate-200">{c.hp}/{c.maxHp}</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                                <div className={`h-full transition-all duration-300 ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'}`} style={{ width: `${hpPercent}%` }}></div>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center bg-[#0a0d14] rounded-lg border border-[#2a3449] overflow-hidden focus-within:border-amber-500/50">
                          <input 
                            type="number" 
                            value={hpInput[c.id] || ''} 
                            onChange={(e) => setHpInput(prev => ({...prev, [c.id]: e.target.value}))}
                            placeholder="Val" 
                            className="w-10 bg-transparent text-xs font-mono font-bold text-center text-slate-200 outline-none p-1 appearance-none"
                          />
                          <button onClick={() => handlePreciseHp(c.id, true)} className="px-2 py-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border-l border-[#2a3449] transition-colors" title="Causar Dano">
                            <Swords className="w-3 h-3" />
                          </button>
                          <button onClick={() => handlePreciseHp(c.id, false)} className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 border-l border-[#2a3449] transition-colors" title="Curar Vida">
                            <Heart className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Prominent Quick Attack Actions */}
                      <div className="mt-2 pt-2 border-t border-[#2a3449]/60 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[9px] font-bold text-rose-400/80 uppercase font-mono tracking-wider mr-1">Ataques:</span>
                        {c.actions && c.actions.length > 0 ? (
                          c.actions.map(act => {
                            const match = act.desc.match(/\+([0-9]+)/);
                            const bonus = match ? parseInt(match[1]) : getMod(c.str);
                            return (
                              <button
                                key={act.name}
                                onClick={() => rollDice(`Ataque: ${act.name}`, bonus, c, act.desc)}
                                className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border border-rose-400/40"
                                title={act.desc}
                              >
                                <Swords className="w-3 h-3 text-slate-950" />
                                <span>{act.name} (+{bonus})</span>
                              </button>
                            );
                          })
                        ) : (
                          <button
                            onClick={() => rollDice(`Ataque: Corpo a Corpo`, getMod(c.str), c, '1d8')}
                            className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border border-rose-400/40"
                          >
                            <Swords className="w-3 h-3 text-slate-950" />
                            <span>Atacar (+{getMod(c.str) >= 0 ? '+' : ''}{getMod(c.str)})</span>
                          </button>
                        )}

                        {/* Botão e Menu Dropdown de Magias (Se houver ficha e magias atreladas) */}
                        {matchingSheet && matchingSheet.spells && matchingSheet.spells.length > 0 && (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setOpenSpellDropdownId(openSpellDropdownId === c.id ? null : c.id)}
                              className="px-2.5 py-1 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-slate-950 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border border-sky-400/40"
                            >
                              <Sparkles className="w-3 h-3 text-slate-950" />
                              <span>Magias</span>
                            </button>

                            {openSpellDropdownId === c.id && (
                              <div className="absolute left-0 top-full mt-2 w-64 bg-[#0f141d]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2.5 z-40 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="flex justify-between items-center pb-1.5 mb-2 border-b border-slate-800">
                                  <span className="text-[10px] font-bold text-amber-400 font-mono">Grimório de {matchingSheet.characterName}</span>
                                  <button onClick={() => setOpenSpellDropdownId(null)} className="text-slate-500 hover:text-slate-200">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {Object.keys(groupedSpells).length === 0 ? (
                                  <div className="text-[10px] text-slate-500 italic p-2 text-center">Nenhuma magia adicionada na ficha.</div>
                                ) : (
                                  Object.keys(groupedSpells)
                                    .map(Number)
                                    .sort((a, b) => a - b)
                                    .map(level => {
                                      const levelSpells = groupedSpells[level] || [];
                                      const slots = matchingSheet.spellSlots?.[level] || { total: 0, used: 0 };
                                      const hasSlots = level === 0 || slots.used < slots.total;

                                      return (
                                        <div key={level} className="mb-3 last:mb-0">
                                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-800/40 pb-0.5">
                                            <span>{level === 0 ? 'Truques' : `${level}º Círculo`}</span>
                                            {level > 0 && (
                                              <span className={hasSlots ? 'text-emerald-400' : 'text-rose-500'}>
                                                Slots: {slots.total - slots.used} / {slots.total}
                                              </span>
                                            )}
                                          </div>
                                          <div className="space-y-1">
                                            {levelSpells.map(spell => (
                                              <button
                                                key={spell.id}
                                                disabled={!hasSlots}
                                                onClick={() => {
                                                  handleCastSpellFromCard(c, matchingSheet, spell);
                                                  setOpenSpellDropdownId(null);
                                                }}
                                                className={`w-full text-left px-2 py-1.5 rounded-lg border text-[10px] transition-all flex justify-between items-center ${
                                                  hasSlots
                                                    ? 'bg-[#161c28] border-[#2a3449] hover:bg-[#1e293b] hover:border-slate-500 text-slate-200 cursor-pointer active:scale-95'
                                                    : 'bg-[#121620]/40 border-[#2a3449]/40 text-slate-500 cursor-not-allowed'
                                                }`}
                                              >
                                                <span className="font-semibold truncate max-w-[130px]">{spell.name}</span>
                                                <span className="text-[8px] font-mono text-slate-400 uppercase">{spell.school || 'Magia'}</span>
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expanded Action Panel */}
                      {isExpanded && (
                        <div className="mt-1 pt-2 border-t border-[#2a3449] animate-in slide-in-from-top-2 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Saves & Skills */}
                          <div className="mb-2">
                            <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rolagens (Salva-Guardas & Skills)</h5>
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => rollDice(`${c.name} - Percepção`, getMod(c.wis), c)} className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300">
                                Percepção ({getMod(c.wis) >= 0 ? '+' : ''}{getMod(c.wis)})
                              </button>
                              <button onClick={() => rollDice(`${c.name} - Salva STR`, getMod(c.str), c)} className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300">
                                STR ({getMod(c.str) >= 0 ? '+' : ''}{getMod(c.str)})
                              </button>
                              <button onClick={() => rollDice(`${c.name} - Salva DEX`, getMod(c.dex), c)} className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300">
                                DEX ({getMod(c.dex) >= 0 ? '+' : ''}{getMod(c.dex)})
                              </button>
                              <button onClick={() => rollDice(`${c.name} - Salva CON`, getMod(c.con), c)} className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300">
                                CON ({getMod(c.con) >= 0 ? '+' : ''}{getMod(c.con)})
                              </button>
                              <button onClick={() => rollDice(`${c.name} - Salva WIS`, getMod(c.wis), c)} className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300">
                                WIS ({getMod(c.wis) >= 0 ? '+' : ''}{getMod(c.wis)})
                              </button>
                            </div>
                          </div>

                          {/* Attacks */}
                          <div>
                             <h5 className="text-[9px] font-bold text-rose-500/70 uppercase tracking-wider mb-1.5">Ações Ofensivas</h5>
                             {c.actions && c.actions.length > 0 ? (
                               <div className="space-y-1">
                                 {c.actions.map(act => (
                                   <div key={act.name} className="p-1.5 bg-[#0a0d14] border border-[#2a3449] rounded-lg">
                                     <div className="flex justify-between items-start mb-1">
                                       <strong className="text-[10px] text-amber-300">{act.name}</strong>
                                       {(() => {
                                          const match = act.desc.match(/\+([0-9]+)/);
                                          if (match) {
                                            const bonus = parseInt(match[1]);
                                            return (
                                              <button onClick={() => rollDice(`Ataque: ${act.name}`, bonus, c, act.desc)} className="text-[8px] px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold">
                                                Atq +{bonus}
                                              </button>
                                            );
                                          }
                                          return null;
                                       })()}
                                     </div>
                                     <p className="text-[9px] text-slate-400 leading-snug">{act.desc}</p>
                                   </div>
                                 ))}
                               </div>
                             ) : (
                               <div className="text-[10px] text-slate-500 italic">Nenhuma ação listada.</div>
                             )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* End Combat Footer */}
              <div className="p-3 border-t border-[#2a3449] bg-[#121824]/60">
                <button
                  onClick={handleEndCombat}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Encerrar Combate & Gerar Loot</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Combatants Search Modal */}


      {showAddCombatantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0f17] border border-[#2a3449] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2a3449] bg-[#121824]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Adicionar Combatentes à Batalha
                </h3>
              </div>
              <button
                onClick={() => setShowAddCombatantModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1f2738] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-[#2a3449] bg-[#0a0d14] p-1 gap-1">
              <button
                onClick={() => setActiveAddTab('monsters')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'monsters'
                    ? 'bg-[#1e293b] text-rose-400 border border-rose-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Monstros (Compêndio SRD)</span>
              </button>

              <button
                onClick={() => setActiveAddTab('players')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'players'
                    ? 'bg-[#1e293b] text-cyan-400 border border-cyan-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Jogadores da Campanha</span>
              </button>

              <button
                onClick={() => setActiveAddTab('npcs')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'npcs'
                    ? 'bg-[#1e293b] text-amber-400 border border-amber-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>NPCs do Mundo</span>
              </button>

              <button
                onClick={() => setActiveAddTab('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'custom'
                    ? 'bg-[#1e293b] text-[#c084fc] border border-purple-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Personalizado</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Tab 1: Monstros & NPCs (Com Busca) */}
              {activeAddTab === 'monsters' && (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={combatantSearchQuery}
                      onChange={(e) => setCombatantSearchQuery(e.target.value)}
                      placeholder="Buscar monstro ou NPC por nome (ex: Goblin, Dragão, Orc, Esqueleto)..."
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                    />
                    {combatantSearchQuery && (
                      <button
                        onClick={() => setCombatantSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Filtered Monster List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                    {INITIAL_MONSTERS.filter(
                      (m) =>
                        m.name.toLowerCase().includes(combatantSearchQuery.toLowerCase()) ||
                        m.type.toLowerCase().includes(combatantSearchQuery.toLowerCase())
                    ).map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-[#121824] border border-[#2a3449] hover:border-slate-600 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Skull className="w-3.5 h-3.5 text-rose-400" />
                            <span>{m.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>CA {m.ac}</span>
                            <span>•</span>
                            <span>{m.hp} HP</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">ND {m.cr}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAddPresetMonster(m, 1)}
                            className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded-lg text-xs font-bold transition-all"
                            title="Adicionar 1 criatura"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleAddPresetMonster(m, 3)}
                            className="px-2 py-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 rounded-lg text-xs font-bold transition-all"
                            title="Adicionar 3 criaturas de uma vez"
                          >
                            +3
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Jogadores da Campanha */}
              {activeAddTab === 'players' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-mono block mb-2">
                    Integrantes cadastrados na campanha ativa:
                  </span>
                  {campaignMembers.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#2a3449] rounded-xl">
                      Nenhum integrante cadastrado nesta campanha.
                    </div>
                  ) : (
                    campaignMembers.map((mem) => {
                      const name = mem.characterName || mem.displayName || 'Jogador';
                      const isAlreadyIn = combatants.some((c) => c.name.toLowerCase() === name.toLowerCase());
                      return (
                        <div
                          key={mem.id}
                          className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-cyan-400" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">{name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Role: {mem.role.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <button
                            disabled={isAlreadyIn}
                            onClick={() => handleAddPlayerMember(mem)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isAlreadyIn
                                ? 'bg-[#161c28] text-slate-500 border border-[#2a3449] cursor-not-allowed'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                            }`}
                          >
                            {isAlreadyIn ? 'Já na Batalha' : '+ Adicionar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 4: NPCs do Mundo */}
              {activeAddTab === 'npcs' && (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={combatantSearchQuery}
                      onChange={(e) => setCombatantSearchQuery(e.target.value)}
                      placeholder="Buscar NPC por nome ou subtipo (ex: Gandalf, Estalajadeiro)..."
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                    />
                    {combatantSearchQuery && (
                      <button
                        onClick={() => setCombatantSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Filtered NPC List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                    {worldEntities
                      .filter((e) => e.category === 'npc')
                      .filter(
                        (npc) =>
                          npc.name.toLowerCase().includes(combatantSearchQuery.toLowerCase()) ||
                          (npc.subType && npc.subType.toLowerCase().includes(combatantSearchQuery.toLowerCase()))
                      )
                      .map((npc) => {
                        const hp = Number(npc.attributes?.hp || npc.attributes?.pv || npc.attributes?.PV || 20);
                        const ac = Number(npc.attributes?.ac || npc.attributes?.ca || npc.attributes?.CA || 12);
                        const isAlreadyIn = combatants.some((c) => c.name.toLowerCase() === npc.name.toLowerCase());
                        
                        return (
                          <div
                            key={npc.id}
                            className="p-3 bg-[#121824] border border-[#2a3449] hover:border-slate-600 rounded-xl flex items-center justify-between transition-all"
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-amber-400" />
                                <span>{npc.name}</span>
                                {npc.subType && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                                    {npc.subType}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                <span>CA {ac}</span>
                                <span>•</span>
                                <span>{hp} HP</span>
                                {npc.status && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize text-slate-500">{npc.status}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <button
                              disabled={isAlreadyIn}
                              onClick={() => handleAddNpcToCombat(npc)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                isAlreadyIn
                                  ? 'bg-[#161c28] text-slate-500 border border-[#2a3449] cursor-not-allowed'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                              }`}
                            >
                              {isAlreadyIn ? 'Já na Batalha' : '+ Adicionar'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Tab 3: Combatente Personalizado */}
              {activeAddTab === 'custom' && (
                <div className="space-y-3 bg-[#121824] p-4 border border-[#2a3449] rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Nome do Combatente / NPC:
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ex: Guarda da Cidade, Chefe Orc..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Tipo:
                      </label>
                      <select
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value as any)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200"
                      >
                        <option value="monster">Inimigo / Monstro</option>
                        <option value="player">Jogador</option>
                        <option value="npc">NPC Aliado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Iniciativa:
                      </label>
                      <input
                        type="number"
                        value={customInit}
                        onChange={(e) => setCustomInit(Number(e.target.value))}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Pontos de Vida (HP):
                      </label>
                      <input
                        type="number"
                        value={customHp}
                        onChange={(e) => setCustomHp(Number(e.target.value))}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Classe de Armadura (CA):
                      </label>
                      <input
                        type="number"
                        value={customAc}
                        onChange={(e) => setCustomAc(Number(e.target.value))}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <button
                    disabled={!customName.trim()}
                    onClick={handleAddCustomCombatant}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-[#161c28] disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all mt-2"
                  >
                    + Adicionar Combatente Personalizado
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#2a3449] bg-[#121824]/80 flex justify-end">
              <button
                onClick={() => setShowAddCombatantModal(false)}
                className="px-4 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Required Warning Modal */}
      {pendingAttack && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141d] border-2 border-rose-500/50 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-black text-lg">🎯</div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Selecione um Alvo no Grid</h4>
                <p className="text-xs text-slate-400">Para realizar {pendingAttack.title}, você precisa definir o alvo primeiro.</p>
              </div>
            </div>

            <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl text-xs text-slate-300 leading-relaxed">
              💡 <strong>Como selecionar:</strong> Clique sobre qualquer criatura no <strong>Grid 3D</strong> ou na lista de combate. Um círculo de mira vermelho aparecerá sobre o alvo!
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => setPendingAttack(null)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow"
              >
                🎯 Entendi, vou selecionar no Grid!
              </button>

              <button
                onClick={() => {
                  const att = pendingAttack;
                  setPendingAttack(null);
                  rollDice(att.title, att.mod, att.actorCombatant, att.actionDesc, true);
                }}
                className="w-full py-2 bg-[#161c28] hover:bg-[#232d40] border border-[#2a3449] text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                💥 Rolar como Ataque em Área / Sem Alvo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Baldur's Gate 3 Style Floating HUD Dice Roller (NO Dark Overlay!) */}
      {bg3DiceOverlay && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in slide-in-from-top-6 fade-in duration-300">
          <div 
            className={`pointer-events-auto min-w-[340px] max-w-md p-5 rounded-3xl backdrop-blur-2xl border-2 text-center transition-all duration-300 shadow-2xl flex flex-col items-center gap-4 ${
              bg3DiceOverlay.isRolling
                ? 'bg-[#0f141d]/95 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.2)]'
                : bg3DiceOverlay.isCrit
                ? 'bg-[#181308]/98 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.7)] animate-bg3-crit'
                : bg3DiceOverlay.isFail
                ? 'bg-[#1c080e]/98 border-rose-600 shadow-[0_0_60px_rgba(244,63,94,0.7)] animate-bg3-shake'
                : bg3DiceOverlay.isHit
                ? 'bg-[#181308]/98 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.5)]'
                : 'bg-[#1a0b10]/98 border-rose-600/80 shadow-[0_0_50px_rgba(244,63,94,0.4)]'
            }`}
          >
            {/* Top Action Title Banner */}
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
                {bg3DiceOverlay.actorName ? `${bg3DiceOverlay.actorName} • ` : ''}{bg3DiceOverlay.title}
              </div>
              {bg3DiceOverlay.targetName && (
                <div className="text-xs text-slate-200 font-sans">
                  Alvo: <span className="font-bold text-rose-400">{bg3DiceOverlay.targetName}</span> 
                  {bg3DiceOverlay.targetAc !== undefined && <span className="font-mono text-slate-400"> (CA {bg3DiceOverlay.targetAc})</span>}
                </div>
              )}
            </div>

            {/* 3D WebGL Polyhedral Dice Display */}
            {bg3DiceOverlay.phase === 'd20' ? (
              <div className="relative flex items-center justify-center my-1">
                <Dice3DCanvas
                  dieType="d20"
                  isRolling={bg3DiceOverlay.isRolling}
                  isHit={bg3DiceOverlay.isHit}
                  isFail={bg3DiceOverlay.isFail}
                  isCrit={bg3DiceOverlay.isCrit}
                  number={bg3DiceOverlay.isRolling ? animatedRollNumber : bg3DiceOverlay.d20Roll}
                  modifier={bg3DiceOverlay.modifier}
                />
              </div>
            ) : (
              /* Phase 2: Damage Dice Visual (3D Polyhedra) */
              <div className="relative flex items-center justify-center my-1 animate-in zoom-in-95 duration-200">
                {(() => {
                  const formula = (bg3DiceOverlay.damageDiceFormula || '').toLowerCase();
                  let damageDieType: DieType = 'd8';
                  if (formula.includes('d20')) damageDieType = 'd20';
                  else if (formula.includes('d12')) damageDieType = 'd12';
                  else if (formula.includes('d10')) damageDieType = 'd10';
                  else if (formula.includes('d6')) damageDieType = 'd6';
                  else if (formula.includes('d4')) damageDieType = 'd4';

                  return (
                    <Dice3DCanvas
                      dieType={damageDieType}
                      isRolling={bg3DiceOverlay.isRolling}
                      isHit={true}
                      number={bg3DiceOverlay.isRolling ? animatedRollNumber : (bg3DiceOverlay.damageAmount || 0)}
                    />
                  );
                })()}
              </div>
            )}

            {/* Outcome Result Text */}
            {!bg3DiceOverlay.isRolling && (
              <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {bg3DiceOverlay.phase === 'd20' ? (
                  <>
                    <div className="text-2xl font-black text-slate-100 font-mono">
                      TOTAL: <span className="text-amber-400">{bg3DiceOverlay.totalRoll}</span>
                    </div>

                    <div className="text-xs font-black uppercase tracking-wider">
                      {bg3DiceOverlay.isCrit ? (
                        <span className="text-amber-400 font-extrabold flex items-center justify-center gap-1">
                          💥 ACERTO CRÍTICO! (20 NATURAL)
                        </span>
                      ) : bg3DiceOverlay.isFail ? (
                        <span className="text-rose-500 font-extrabold flex items-center justify-center gap-1">
                          💀 ERRO CRÍTICO! (1 NATURAL)
                        </span>
                      ) : bg3DiceOverlay.isHit ? (
                        <span className="text-amber-400 font-bold">✓ ACERTOU O ALVO!</span>
                      ) : (
                        <span className="text-rose-400 font-bold">✕ ERROU O ALVO!</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xl font-black text-rose-400 font-mono">
                    💥 {bg3DiceOverlay.damageAmount} PONTOS DE DANO!
                  </div>
                )}
              </div>
            )}

            {/* Quick Dismiss Button */}
            {!bg3DiceOverlay.isRolling && (
              <button
                onClick={() => setBg3DiceOverlay(null)}
                className="px-6 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-xl shadow-lg transition-all active:scale-95 border border-amber-300"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}

      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />

      <BattleSetupModal
        isOpen={showBattleSetupModal}
        onClose={() => setShowBattleSetupModal(false)}
        onConfirmSetup={handleConfirmBattleSetup}
      />
    </div>
  );
};
