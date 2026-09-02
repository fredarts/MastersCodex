'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Shield, 
  Sparkles, 
  BookOpen, 
  Tv, 
  LogIn, 
  CheckCircle2, 
  UserCheck, 
  Plus, 
  ArrowLeft, 
  X, 
  ChevronRight, 
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  ScrollText, 
  Users,
  Compass,
  LogOut,
  FileText,
  Heart,
  Swords,
  Activity,
  Lock,
  Eye,
  EyeOff,
  Ghost,
  Copy,
  Map as MapIcon,
  MessageSquare,
  ListOrdered,
  Dices,
  Check,
  Wand2,
  Image as ImageIcon,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useSession } from '@/context/SessionContext';
import { useVoiceCall } from '@/context/VoiceCallContext';
import { UserCampaign, CharacterSheet, MacroBarDisplayMode, SecretRollNotificationMode, TransactionEntry } from '@/lib/types';
import { CharacterSheetModal } from './character-sheet/CharacterSheetModal';
import { CharacterManagerModal } from './character-sheet/CharacterManagerModal';
import { createEmptyCharacterSheet, generateUuid } from '@/lib/dnd5e-data';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { useAuth } from '@/context/AuthContext';
import { parseRangeString } from '@/lib/utils/dndRangeUtils';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { toast } from 'sonner';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';

import { FloatingDiceRollerHUD } from './live-cockpit/FloatingDiceRollerHUD';
import { PlayerCombatTrackerHUD } from './player-view/PlayerCombatTrackerHUD';
import { PlayerTokenActionDock } from './player-view/PlayerTokenActionDock';
import { PresenceIndicator } from './live-cockpit/PresenceIndicator';
import { SharedGameLog } from './live-cockpit/SharedGameLog';
import { LiveChatPanel } from './live-cockpit/LiveChatPanel';
import { LiveCalendarWidget } from './live-cockpit/LiveCalendarWidget';
import { BattleGrid3D } from './BattleGrid3D';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';
import { XCardButton } from './safety/XCardButton';
import { DysonCanvas } from './map/DysonCanvas';
import { MagicShaderSlideshow } from './MagicShaderSlideshow';
import { SlideTextOverlayRenderer } from '@/components/session/SlideTextOverlayRenderer';
import { normalizeImageUrl, getYouTubeEmbedUrl, resolveCurrentSceneImage } from '@/lib/imageUtils';
import { revealVisionWithLOS, getTokenVisionRadius } from '@/components/map/visionCore';

interface PlayerLobbyProps {
  onOpenPlayerView: () => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ onOpenPlayerView }) => {
  const { activeCampaign, setActiveCampaign, userCampaigns, joinCampaignByCode, leaveCampaign, feedEvents, updateCampaignMemberModelUrl } = useCampaign();
  const { 
    tokenPositions3D, 
    updateTokenPosition3D, 
    combatants, 
    setCombatants,
    initializeFromCombatants,
    currentTurnIndex, 
    setCurrentTurnIndex,
    roundCount, 
    setRoundCount,
    liveDisplayMode,
    combatLogs,
    chatMessages,
    onlineUsers,
    broadcastPlayerRoll,
    broadcastToPlayerView,
    broadcastCombatUpdate,
    updateCombatantState,
    mapData,
    setMapData,
    projectedScene,
    drawings,
    broadcastStateRequest,
    selectedTargetId,
    broadcastXCardAlert,
  } = useLiveCockpit();
  const { activeScene, fetchSceneMap, campaignMaps } = useSession();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useCustomDialog();
  const { setIsOnPlayerCampaignView } = usePartyLoot();
  const { isInCall, isConnecting, isMuted, isSpeaking, joinCall, toggleMute, setIsWidgetOpen, participants } = useVoiceCall();
  
  // Navigation & Modal States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    activeCampaign?.role === 'player' ? activeCampaign?.id || null : null
  );
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Garante que o CampaignContext tenha a campanha ativa sincronizada para conectar ao WebSocket Supabase
  useEffect(() => {
    if (userCampaigns && userCampaigns.length > 0) {
      const target = (selectedCampaignId ? userCampaigns.find(c => c.id === selectedCampaignId) : null) ||
        userCampaigns.find(c => c.role === 'player') ||
        userCampaigns[0];
      if (target && target.id !== activeCampaign?.id) {
        setSelectedCampaignId(target.id);
        setActiveCampaign(target);
      }
    }
  }, [userCampaigns, selectedCampaignId, activeCampaign?.id, setActiveCampaign]);

  // Solicita o snapshot atual do Mestre ao carregar o lobby com retentativas automáticas
  useEffect(() => {
    if (broadcastStateRequest) {
      broadcastStateRequest();
      const t1 = setTimeout(() => broadcastStateRequest(), 600);
      const t2 = setTimeout(() => broadcastStateRequest(), 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [broadcastStateRequest, activeCampaign?.id, selectedCampaignId]);

  // Se a cena ativa possui combatentes e o estado local está vazio, inicializa os tokens
  useEffect(() => {
    if (activeScene?.combatants && activeScene.combatants.length > 0 && combatants.length === 0) {
      if (setCombatants) setCombatants(activeScene.combatants);
      if (initializeFromCombatants) initializeFromCombatants(activeScene.combatants);
    }
  }, [activeScene?.combatants, combatants.length, setCombatants, initializeFromCombatants]);

  // Auto-fetch dungeon map data from Supabase when the player is in 'map' view
  const [playerCanvasView, setPlayerCanvasView] = useState<'auto' | 'grid' | 'map' | 'art'>('auto');
  const [lastLoadedSceneMapKey, setLastLoadedSceneMapKey] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  useEffect(() => {
    const activeView = playerCanvasView === 'auto' ? liveDisplayMode : playerCanvasView;
    const currentScene = projectedScene || activeScene;
    if (activeView !== 'map' || !currentScene?.id) return;

    const typedMap = mapData as { activeMapId?: string; sceneId?: string; grid?: any[] } | null;
    const needsFetch = !typedMap || !typedMap.grid || typedMap.grid.length === 0 || typedMap.sceneId !== currentScene.id;
    const fetchKey = `${currentScene.id}_${campaignMaps.length}`;

    if (needsFetch && lastLoadedSceneMapKey !== fetchKey && !isMapLoading) {
      console.log('[PlayerLobby] Fetching dungeon map for scene:', currentScene.id, 'campaignMaps:', campaignMaps.length);
      setIsMapLoading(true);
      fetchSceneMap(currentScene.id).then((savedData) => {
        let activeId = savedData?.activeMapId;
        let gridData = null;

        const associatedIds = currentScene.associatedMapIds || (currentScene.associatedMapId ? [currentScene.associatedMapId] : []);
        if (!activeId) {
          activeId = (associatedIds.length > 0 ? (campaignMaps.find(m => associatedIds.includes(m.id))?.id || associatedIds[0]) : null);
        }
        const templateMap = campaignMaps.find(m => m.id === activeId);
        console.log('[PlayerLobby] savedData:', !!savedData, 'activeId:', activeId, 'templateMap:', !!templateMap, 'associatedIds:', associatedIds);

        if (savedData) {
          if (savedData.maps) {
            gridData = activeId ? savedData.maps[activeId] : null;
          } else if (savedData.grid) {
            gridData = savedData;
            activeId = currentScene.associatedMapId || 'legacy';
          }
        }

        if (gridData && templateMap && templateMap.gridData) {
          const tGrid = templateMap.gridData.grid || [];
          const sGrid = gridData.grid || [];
          const mergedGrid = tGrid.map((row: any[], r: number) =>
            row.map((cell: any, c: number) => {
              const sCell = sGrid[r]?.[c];
              return {
                ...cell,
                fog: sCell !== undefined ? sCell.fog : true,
                tokenName: (sCell && sCell.tokenName) ? sCell.tokenName : cell.tokenName,
                tokenColor: (sCell && sCell.tokenName) ? sCell.tokenColor : cell.tokenColor,
              };
            })
          );

          // Reveal vision around tokens with LOS
          for (let r = 0; r < mergedGrid.length; r++) {
            for (let c = 0; c < mergedGrid[r].length; c++) {
              if (mergedGrid[r][c].tokenName) {
                const radius = getTokenVisionRadius(mergedGrid[r][c].tokenName, combatants);
                revealVisionWithLOS(mergedGrid, r, c, radius);
              }
            }
          }

          gridData = {
            grid: mergedGrid,
            bgImageUrl: templateMap.gridData.bgImageUrl ?? gridData.bgImageUrl ?? null,
            gridScale: templateMap.gridData.gridScale ?? gridData.gridScale ?? 40,
            gridOffsetX: templateMap.gridData.gridOffsetX ?? gridData.gridOffsetX ?? 0,
            gridOffsetY: templateMap.gridData.gridOffsetY ?? gridData.gridOffsetY ?? 0,
            vectorWalls: templateMap.gridData.vectorWalls ?? gridData.vectorWalls ?? [],
            lightSources: templateMap.gridData.lightSources ?? gridData.lightSources ?? [],
          };
        } else if (gridData && gridData.grid && gridData.grid.length > 0) {
          // Grid data from saved scene map but no template (use as-is)
          console.log('[PlayerLobby] Using raw savedData grid (no templateMap match)');
        } else if (!gridData && templateMap && templateMap.gridData) {
          const tempGrid = templateMap.gridData.grid || [];
          const coveredGrid = tempGrid.map((row: any[]) =>
            row.map((cell: any) => ({ ...cell, fog: true }))
          );
          for (let r = 0; r < coveredGrid.length; r++) {
            for (let c = 0; c < coveredGrid[r].length; c++) {
              if (tempGrid[r]?.[c]?.tokenName) {
                coveredGrid[r][c].tokenName = tempGrid[r][c].tokenName;
                coveredGrid[r][c].tokenColor = tempGrid[r][c].tokenColor;
                const radius = getTokenVisionRadius(tempGrid[r][c].tokenName, combatants);
                revealVisionWithLOS(coveredGrid, r, c, radius);
              }
            }
          }
          gridData = { ...templateMap.gridData, grid: coveredGrid };
        }

        if (gridData && gridData.grid && gridData.grid.length > 0) {
          console.log('[PlayerLobby] Map loaded successfully. Grid size:', gridData.grid.length, 'x', gridData.grid[0]?.length);
          const isExplStarted = 
            savedData?.isExplorationStarted === true || 
            (activeId && savedData?.maps?.[activeId]?.isExplorationStarted === true) || 
            currentScene.isDungeonExplorationStarted === true ||
            (mapData as any)?.dungeonExplorationStarted === true;

          setMapData((prev: any) => ({
            ...(prev || {}),
            grid: gridData.grid || [],
            bgImageUrl: gridData.bgImageUrl || null,
            gridScale: gridData.gridScale || 40,
            gridOffsetX: gridData.gridOffsetX || 0,
            gridOffsetY: gridData.gridOffsetY || 0,
            vectorWalls: gridData.vectorWalls || [],
            lightSources: gridData.lightSources || [],
            activeMapId: activeId,
            sceneId: currentScene.id,
            dungeonExplorationStarted: isExplStarted,
          }));
        } else {
          console.warn('[PlayerLobby] No grid data found for scene:', currentScene.id);
        }
        setLastLoadedSceneMapKey(fetchKey);
        setIsMapLoading(false);
      }).catch((err) => {
        console.error('Erro ao sincronizar mapa no PlayerLobby:', err);
        setLastLoadedSceneMapKey(fetchKey);
        setIsMapLoading(false);
      });
    }
  }, [playerCanvasView, liveDisplayMode, projectedScene, activeScene, mapData, lastLoadedSceneMapKey, fetchSceneMap, setMapData, campaignMaps, combatants, isMapLoading]);

  // VTT Player Cockpit UI States
  const [sidebarTab, setSidebarTab] = useState<'init' | 'log' | 'chat'>('init');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [macroDisplayMode, setMacroDisplayMode] = useState<MacroBarDisplayMode>('both');
  const [secretRollMode, setSecretRollMode] = useState<SecretRollNotificationMode>('subtle_notice');
  const [pendingAttackPayload, setPendingAttackPayload] = useState<any>(null);

  const setPendingAttack = useLiveCockpitStudioStore((state) => state.setPendingAttack);
  const pendingAttackStore = useLiveCockpitStudioStore((state) => state.pendingAttack);
  const setBg3DiceOverlay = useLiveCockpitStudioStore((state) => state.setBg3DiceOverlay);
  const setDiceResult = useLiveCockpitStudioStore((state) => state.setDiceResult);

  const handlePlayerAttackTarget = (target: any) => {
    if (pendingAttackStore && pendingAttackPayload) {
      const attack = pendingAttackPayload;
      const cleanBonus = pendingAttackStore.mod;
      const title = pendingAttackStore.title;
      
      const charName = activeSheet.characterName || 'Jogador';
      const currentActor = combatants.find(
        (c) => c.name.toLowerCase().includes(charName.toLowerCase()) || charName.toLowerCase().includes(c.name.toLowerCase())
      );
      
      setBg3DiceOverlay({
        title,
        actorName: currentActor?.name || activeSheet.characterName,
        targetName: target?.name,
        modifier: cleanBonus,
        targetAc: target?.ac || 10,
        difficultyClass: target?.ac || 10,
        damageDiceFormula: attack.damage || '1d8',
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

          const fullRoll = {
            id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            characterId: activeSheet.id,
            characterName: activeSheet.characterName || charName,
            avatarUrl: activeSheet.avatarUrl,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            rollType: 'attack',
            label: `Ataque: ${attack.name} em ${target.name}`,
            d20Roll: roll,
            d20Roll1: roll,
            modifier: cleanBonus,
            total: finalTotal,
            isCrit,
            isFail,
            damageDice: attack.damage,
            damageType: attack.type,
          };
          
          broadcastPlayerRoll(fullRoll as any);

          if (currentActor && updateCombatantState && liveDisplayMode === 'combat') {
            const isMyTurn = combatants[currentTurnIndex]?.name.toLowerCase().includes(charName.toLowerCase());
            if (isMyTurn && !currentActor.actionUsed) {
              updateCombatantState(currentActor.id, { actionUsed: true });
            }
          }
        }
      });
      
      setPendingAttack(null);
      setPendingAttackPayload(null);
    }
  };

  const handlePlayerNextTurn = () => {
    if (!combatants || combatants.length === 0) return;
    let nextIndex = currentTurnIndex + 1;
    let nextRound = roundCount;

    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      setRoundCount(nextRound);
    }

    setCurrentTurnIndex(nextIndex);

    // Reseta recursos de ações do combatente cujo turno acabou de encerrar
    const currentActor = combatants[currentTurnIndex];
    if (currentActor && updateCombatantState) {
      updateCombatantState(currentActor.id, {
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
        movementUsed: 0,
      });
    }

    // Transmite a nova ordem de turno para o Mestre e demais jogadores
    if (broadcastCombatUpdate) {
      broadcastCombatUpdate({
        combatants,
        currentTurnIndex: nextIndex,
        roundCount: nextRound,
      });
    }

    if (broadcastToPlayerView) {
      broadcastToPlayerView({
        combatants,
        currentTurnIndex: nextIndex,
        roundCount: nextRound,
      });
    }

    const nextActor = combatants[nextIndex];
    toast.success(`Turno encerrado! Próximo a jogar: ${nextActor?.name || 'Próximo combatente'}`);
  };

  const handleCopyInviteCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedInvite(true);
    toast.success('Código de convite copiado para a área de transferência!');
    setTimeout(() => setCopiedInvite(false), 2000);
  };
  
  // D&D 5e Character Sheets Multi-State
  const STORAGE_KEY = 'masters_codex_character_sheets_v1';
  const [characterSheets, setCharacterSheets] = useState<CharacterSheet[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed: CharacterSheet[] = JSON.parse(saved);
          return parsed.map((s) => {
            // Migra ID antigo não-UUID para UUIDv4 válido se necessário
            let currentId = s.id;
            if (!currentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentId)) {
              currentId = generateUuid();
            }
            // Se modelUrl ainda não foi definido pelo jogador, ou está com valor genérico antigo, corrige
            let targetModelUrl = s.modelUrl;
            if (!targetModelUrl || targetModelUrl === '/assets/3d/characters/Duida/Druida.glb') {
              if (s.className && !s.className.toLowerCase().includes('druid')) {
                targetModelUrl = getModelUrlByNameOrPath(s.className);
              }
            }
            return { ...s, id: currentId, modelUrl: targetModelUrl };
          });
        } catch (err) {
          console.error('Erro ao carregar fichas salvas:', err);
        }
      }
    }
    const defaultSheet = createEmptyCharacterSheet('player-1', activeCampaign?.id);
    return [defaultSheet];
  });

  const [activeSheet, setActiveSheet] = useState<CharacterSheet>(() => characterSheets[0] || createEmptyCharacterSheet('player-1'));
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // Group members state
  const [campaignMembers, setCampaignMembers] = useState<{id: string; userId: string; characterName?: string; avatarUrl?: string; role: string}[]>([]);
  const [viewingSheet, setViewingSheet] = useState<CharacterSheet | null>(null);
  const [isViewingSheetOpen, setIsViewingSheetOpen] = useState(false);
  const [loadingMemberSheet, setLoadingMemberSheet] = useState<string | null>(null);

  // Solicita snapshot de estado ao Mestre ao entrar no Lobby da Campanha
  useEffect(() => {
    if (activeCampaign) {
      broadcastStateRequest();
    }
  }, [activeCampaign, broadcastStateRequest]);

  // Efeito para salvar fichas no localStorage sempre que houver alteração
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characterSheets));
    }
  }, [characterSheets]);

  // We track currentCampaignId for the member fetch effect
  const currentCampaignIdForMembers = selectedCampaignId || activeCampaign?.id || null;

  // Carrega as fichas do Supabase vinculadas ao usuário conectado, mesclando com o localStorage
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    const fetchSheetsFromDb = async () => {
      const uId = user?.id;
      if (!uId || !isValidUuid(uId)) return;
      
      try {
        const { data, error } = await supabase
          .from('character_sheets')
          .select('*')
          .eq('user_id', uId);
          
        if (!error && data) {
          const dbSheets = data.map((row) => ({
            ...row.data,
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            characterName: row.character_name || row.data?.characterName,
            updatedAt: row.updated_at,
          }));

          const dbSheetIds = new Set(dbSheets.map((s) => s.id));
          
          setCharacterSheets((prev) => {
            // Remove local sheets that have a UUID ID but were deleted in Supabase,
            // and filter out any sheets that belong to other users to prevent leaks.
            const validLocalSheets = prev.filter(
              (s) => (!isValidUuid(s.id) || dbSheetIds.has(s.id)) && (!s.userId || s.userId === uId)
            );

            const merged = [...validLocalSheets];
            dbSheets.forEach((dbS) => {
              const idx = merged.findIndex((s) => s.id === dbS.id);
              if (idx >= 0) {
                const localTime = new Date(merged[idx].updatedAt || 0).getTime();
                const dbTime = new Date(dbS.updatedAt || 0).getTime();
                if (dbTime > localTime) {
                  merged[idx] = dbS;
                }
              } else {
                merged.push(dbS);
              }
            });
            
            const filtered = merged.filter((s) => {
              const isDefaultMock = s.characterName === 'Novo Aventureiro' && !dbSheets.some((dbS) => dbS.id === s.id);
              const isOtherUser = s.userId && s.userId !== uId;
              return !isDefaultMock && !isOtherUser;
            });
            const finalSheets = filtered.length > 0 ? filtered : (merged.length > 0 ? merged : []);
            
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSheets));
            } catch (e) {}

            const targetActive = finalSheets.find((s) => s.userId === uId && s.characterName !== 'Novo Aventureiro') || finalSheets.find((s) => s.userId === uId) || finalSheets[0] || createEmptyCharacterSheet('player-1');
            if (targetActive) {
              setActiveSheet(targetActive);
            }

            return finalSheets;
          });
        }
      } catch (err) {
        console.warn('Erro ao buscar fichas do Supabase:', err);
      }
    };
    
    fetchSheetsFromDb();
  }, [user?.id]);

  // Fetch campaign members when campaign changes

  // Fetch campaign members when campaign changes
  useEffect(() => {
    if (!currentCampaignIdForMembers) { setCampaignMembers([]); return; }
    const loadMembers = async () => {
      // Try Supabase first
      if (isSupabaseConfigured() && isValidUuid(currentCampaignIdForMembers)) {
        try {
          const { data, error } = await supabase
            .from('campaign_members')
            .select('*')
            .eq('campaign_id', currentCampaignIdForMembers);
          if (!error && data) {
            setCampaignMembers(data.map((m: any) => ({
              id: m.id, userId: m.user_id, characterName: m.character_name, avatarUrl: m.avatar_url, role: m.role || 'player',
            })));
            return;
          }
        } catch (_) {}
      }
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem('codex_members');
        const all: any[] = saved ? JSON.parse(saved) : [];
        setCampaignMembers(all.filter((m) => m.campaignId === currentCampaignIdForMembers).map((m) => ({
          id: m.id, userId: m.userId || '', characterName: m.characterName, role: m.role || 'player',
        })));
      } catch (_) { setCampaignMembers([]); }
    };
    loadMembers();
  }, [currentCampaignIdForMembers]);

  const handleViewMemberSheet = async (member: {id: string; userId: string; characterName?: string; role: string}) => {
    setLoadingMemberSheet(member.id);
    let foundSheet: CharacterSheet | null = null;
    if (isSupabaseConfigured() && isValidUuid(member.userId)) {
      try {
        const { data } = await supabase.from('character_sheets').select('*').eq('user_id', member.userId).limit(1);
        if (data && data.length > 0) {
          foundSheet = { ...data[0].data, id: data[0].id, userId: data[0].user_id, campaignId: data[0].campaign_id, characterName: data[0].character_name || data[0].data?.characterName };
        }
      } catch (_) {}
    }
    if (!foundSheet && member.characterName) {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        const sheets: CharacterSheet[] = saved ? JSON.parse(saved) : [];
        foundSheet = sheets.find((s) => s.characterName?.toLowerCase() === member.characterName!.toLowerCase()) || null;
      } catch (_) {}
    }
    setLoadingMemberSheet(null);
    if (!foundSheet) {
      showAlert({
        title: 'Ficha Não Encontrada',
        message: `Nenhuma ficha encontrada para ${member.characterName || 'este jogador'}.`,
        variant: 'warning'
      });
      return;
    }
    if (foundSheet.isPublic === false) {
      showAlert({
        title: 'Ficha Privada',
        message: `🔒 ${member.characterName || 'Este jogador'} bloqueou a visualização da sua ficha.`,
        variant: 'info'
      });
      return;
    }
    setViewingSheet(foundSheet);
    setIsViewingSheetOpen(true);
  };

  const handleOpenSheetForCampaign = (camp?: UserCampaign) => {
    const charName = resolveCharName(camp);
    
    // 1. Procura ficha vinculada à campanha
    let foundSheet = characterSheets.find((s) => camp?.id && s.campaignId === camp.id);
    
    // 2. Se não achar, procura pelo nome do personagem
    if (!foundSheet && charName && charName !== 'Aventureiro') {
      foundSheet = characterSheets.find(
        (s) => s.characterName.toLowerCase() === charName.toLowerCase()
      );
    }

    // 3. Se não achar por nome, mas o usuário tiver apenas uma ficha, vamos sugerir usar essa única ficha
    if (!foundSheet && characterSheets.length === 1 && characterSheets[0].characterName !== 'Novo Aventureiro') {
      foundSheet = characterSheets[0];
      if (camp?.id) {
        foundSheet.campaignId = camp.id;
        handleSaveSheet(foundSheet);
      }
    }

    if (foundSheet) {
      setActiveSheet(foundSheet);
      setIsSheetModalOpen(true);
    } else {
      if (characterSheets.length > 0) {
        setIsManagerModalOpen(true);
        toast.info('Selecione uma ficha de personagem existente ou crie uma nova para esta campanha.');
      } else {
        const newSheet = createEmptyCharacterSheet(user?.id || 'player-1', camp?.id);
        newSheet.characterName = charName !== 'Aventureiro' ? charName : `Aventureiro ${characterSheets.length + 1}`;
        setCharacterSheets((prev) => [newSheet, ...prev]);
        setActiveSheet(newSheet);
        setIsSheetModalOpen(true);
      }
    }
  };

  const handleCreateNewSheet = () => {
    const newSheet = createEmptyCharacterSheet('player-1');
    newSheet.characterName = `Aventureiro ${characterSheets.length + 1}`;
    setCharacterSheets((prev) => [newSheet, ...prev]);
    setActiveSheet(newSheet);
    setIsManagerModalOpen(false);
    setIsSheetModalOpen(true);
  };

  const handleSelectSheetToEdit = (sheet: CharacterSheet) => {
    setActiveSheet(sheet);
    setIsManagerModalOpen(false);
    setIsSheetModalOpen(true);
  };

  const handleDuplicateSheet = (sheetId: string) => {
    const target = characterSheets.find((s) => s.id === sheetId);
    if (!target) return;

    const cloned: CharacterSheet = {
      ...JSON.parse(JSON.stringify(target)),
      id: `char-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      characterName: `${target.characterName} (Cópia)`,
      updatedAt: new Date().toISOString(),
    };

    setCharacterSheets((prev) => [cloned, ...prev]);
  };

  const handleDeleteSheet = async (sheetId: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Ficha de Personagem',
      message: 'Tem certeza que deseja excluir esta ficha de personagem? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir Ficha',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    const sheetToDelete = characterSheets.find((s) => s.id === sheetId);

      // 1. Excluir ficha do Supabase
      if (isSupabaseConfigured()) {
        try {
          if (isValidUuid(sheetId)) {
            const { error: delErr } = await supabase.from('character_sheets').delete().eq('id', sheetId);
            if (delErr) {
              console.error('Erro ao excluir ficha no Supabase:', delErr);
            } else {
              console.log('Ficha excluída com sucesso do Supabase.');
            }
          }

          // Se a ficha estava vinculada a uma campanha, remover a inscrição em campaign_members
          const uId = user?.id || sheetToDelete?.userId;
          if (sheetToDelete?.campaignId && uId) {
            await supabase
              .from('campaign_members')
              .delete()
              .eq('campaign_id', sheetToDelete.campaignId)
              .eq('user_id', uId);
          }
        } catch (err) {
          console.error('Erro ao excluir ficha do Supabase:', err);
        }
      }

      // 2. Atualizar estado local
      setCharacterSheets((prev) => {
        const next = prev.filter((s) => s.id !== sheetId);
        if (activeSheet?.id === sheetId) {
          const fallback = next[0] || createEmptyCharacterSheet('player-1');
          setActiveSheet(fallback);
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
  };

  const handleSaveSheet = (updatedSheet: CharacterSheet) => {
    const updatedWithTimestamp: CharacterSheet = {
      ...updatedSheet,
      updatedAt: new Date().toISOString(),
    };
    setActiveSheet(updatedWithTimestamp);
    setCharacterSheets((prev) => {
      const exists = prev.some((s) => s.id === updatedSheet.id);
      const next = exists
        ? prev.map((s) => (s.id === updatedSheet.id ? updatedWithTimestamp : s))
        : [updatedWithTimestamp, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Transmite evento instantâneo de atualização do modelo de personagem (local e cross-tab)
    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'CHARACTER_MODEL_UPDATED',
        sheet: updatedWithTimestamp,
      });
      bc.close();
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('masters_codex_character_model_updated', {
        detail: updatedWithTimestamp,
      })
    );

    // Transmite via canal em tempo real do Supabase para o DM e outros integrantes
    if (broadcastToPlayerView) {
      broadcastToPlayerView({
        type: 'CHARACTER_MODEL_UPDATED',
        characterModelUpdated: updatedWithTimestamp,
      });
    }

    // Sincroniza a ficha com o banco de dados Supabase para acesso do Mestre e de outros usuários
    if (isSupabaseConfigured()) {
      const uId = user?.id || updatedWithTimestamp.userId || 'player-1';
      const cId = updatedWithTimestamp.campaignId || activeCampaign?.id || null;
      
      if (isValidUuid(uId)) {
        supabase.from('character_sheets').upsert({
          id: updatedWithTimestamp.id,
          user_id: uId,
          campaign_id: (cId && isValidUuid(cId)) ? cId : null,
          character_name: updatedWithTimestamp.characterName || 'Sem Nome',
          data: updatedWithTimestamp,
          updated_at: updatedWithTimestamp.updatedAt,
        }).then(({ error }) => {
          if (error) {
            console.error('Erro ao sincronizar ficha com Supabase:', error);
          } else {
            console.log('Ficha sincronizada com o Supabase.');
          }
        });

        if (cId && isValidUuid(cId)) {
           supabase.from('campaign_members').update({
             character_name: updatedWithTimestamp.characterName || 'Sem Nome',
             avatar_url: updatedWithTimestamp.avatarUrl || null,
             token_type: updatedWithTimestamp.tokenType || '3d',
           })
           .eq('campaign_id', cId)
           .ilike('character_name', updatedWithTimestamp.characterName || 'Sem Nome')
           .then(({ error }) => {
             if (error) {
               console.error('Erro ao sincronizar token com campaign_members:', error);
               toast.error(`Não foi possível salvar a preferência de token no servidor: ${error.message}`);
             } else {
               console.log('Preferência de token salva com sucesso em campaign_members.');
             }
           });
        }
      }
    }

    // Sincroniza modelUrl no Supabase e no codex_members para que o DM veja o modelo correto
    try {
      const targetModelUrl = updatedWithTimestamp.modelUrl || getModelUrlByNameOrPath(updatedWithTimestamp.className || updatedWithTimestamp.characterName);
      const targetCampId = updatedWithTimestamp.campaignId || activeCampaign?.id || '';
      updateCampaignMemberModelUrl(targetCampId, updatedWithTimestamp.characterName, targetModelUrl);

      const memsStr = localStorage.getItem('codex_members');
      if (memsStr) {
        const mems: any[] = JSON.parse(memsStr);
        let changed = false;
        const updatedMems = mems.map((m) => {
          if (
            m.characterName &&
            m.characterName.toLowerCase() === updatedWithTimestamp.characterName.toLowerCase()
          ) {
            if (m.modelUrl !== targetModelUrl) {
              changed = true;
              return { ...m, modelUrl: targetModelUrl };
            }
          }
          return m;
        });
        if (changed) {
          localStorage.setItem('codex_members', JSON.stringify(updatedMems));
        }
      }
    } catch (e) {}
  };

  const handleSaveSheetRef = useRef(handleSaveSheet);
  const characterSheetsRef = useRef(characterSheets);

  useEffect(() => {
    handleSaveSheetRef.current = handleSaveSheet;
    characterSheetsRef.current = characterSheets;
  });

  // Listen for loot received events (claims/direct transfers) and update active sheets in player lobby
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLootReceived = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { characterName, item, currency } = customEvent.detail;
      
      const sheet = characterSheetsRef.current.find(
        (s) => s.characterName.toLowerCase() === characterName.toLowerCase()
      );
      
      if (sheet) {
        const updated = { ...sheet };
        if (item) {
          const currentEq = updated.equipment || [];
          const existingIds = new Set(currentEq.map((e) => e.id));
          let safeId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          if (existingIds.has(safeId)) {
            safeId = `${safeId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          }
          const itemWithUniqueId = { ...item, id: safeId };
          updated.equipment = [...currentEq, itemWithUniqueId];
        }
        if (currency) {
          const cur = updated.currency || { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 };
          updated.currency = {
            po: cur.po + (currency.po || 0),
            pp: cur.pp + (currency.pp || 0),
            pc: cur.pc + (currency.pc || 0),
            pe: cur.pe + (currency.pe || 0),
            pl: cur.pl + (currency.pl || 0),
          };

          // Registra a transação de loot recebido no histórico da ficha
          const newEntries: TransactionEntry[] = [];
          const nowStr = new Date().toLocaleString('pt-BR');
          (['po', 'pp', 'pc', 'pe', 'pl'] as const).forEach(type => {
            const amount = currency[type];
            if (amount && amount > 0) {
              newEntries.push({
                id: `${Date.now()}-${type}`,
                type: 'loot',
                amount,
                coinType: type,
                reason: 'Recompensa de Loot (Mestre)',
                date: nowStr
              });
            }
          });
          if (newEntries.length > 0) {
            updated.transactionHistory = [...newEntries, ...(updated.transactionHistory || [])];
          }
        }
        handleSaveSheetRef.current(updated);
      }
    };

    window.addEventListener('masters_codex_loot_received', handleLootReceived);
    return () => window.removeEventListener('masters_codex_loot_received', handleLootReceived);
  }, []);

  // Sincronização direta com Supabase Realtime para manter as fichas atualizadas ao vivo quando o Mestre ou outro jogador alterar dados no banco
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channelId = `player_lobby_sheets_${user?.id || 'anon'}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_sheets',
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            const row = payload.new as any;
            const remoteData = row.data as CharacterSheet;
            if (remoteData) {
              setCharacterSheets((prev) => {
                const idx = prev.findIndex(
                  (s) =>
                    s.id === remoteData.id ||
                    (s.characterName &&
                      remoteData.characterName &&
                      s.characterName.toLowerCase() === remoteData.characterName.toLowerCase())
                );
                let next;
                if (idx >= 0) {
                  next = [...prev];
                  next[idx] = { ...prev[idx], ...remoteData };
                } else {
                  next = [remoteData, ...prev];
                }
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch (e) {}
                return next;
              });

              setActiveSheet((prev) => {
                if (
                  prev &&
                  (prev.id === remoteData.id ||
                    (prev.characterName &&
                      remoteData.characterName &&
                      prev.characterName.toLowerCase() === remoteData.characterName.toLowerCase()))
                ) {
                  return { ...prev, ...remoteData };
                }
                return prev;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
  
  // Form States
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [characterNameInput, setCharacterNameInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);
  const [joinErrorMsg, setJoinErrorMsg] = useState<string | null>(null);

  const handleOpenJoinModal = () => {
    if (characterSheets.length > 0 && !characterNameInput) {
      setCharacterNameInput(characterSheets[0].characterName);
    }
    setIsJoinModalOpen(true);
  };

  // Filtra as campanhas do jogador (e inclui campanhas onde o usuário é DM para permitir teste/jogo de fichas no Modo Jogador)
  const playerCampaigns = useMemo(() => {
    const directPlayerCamps = userCampaigns.filter((c) => c.role === 'player');
    const dmCampsAsPlayer = userCampaigns
      .filter((c) => c.role === 'dm' && !directPlayerCamps.some((p) => p.id === c.id))
      .map((c) => ({ ...c, role: 'player' as const }));

    return [...directPlayerCamps, ...dmCampsAsPlayer];
  }, [userCampaigns]);

  // Find currently selected campaign (only among player campaigns)
  const currentCampaign =
    playerCampaigns.find((c) => c.id === selectedCampaignId) ||
    playerCampaigns.find((c) => c.id === activeCampaign?.id) ||
    playerCampaigns[0] ||
    null;

  // Resolve character name from multiple sources (campaign → sheets → members → party → fallback)
  const resolveCharName = (camp?: UserCampaign | null): string => {
    if (camp?.characterName) return camp.characterName;
    // 1. Procura ficha vinculada à campanha
    const linkedSheet = camp?.id
      ? characterSheets.find((s) => s.campaignId === camp.id)
      : null;
    if (linkedSheet?.characterName && linkedSheet.characterName !== 'Novo Aventureiro') {
      return linkedSheet.characterName;
    }
    // 2. Procura membro registrado no Supabase / codex_members
    if (camp?.id) {
      const myMember = campaignMembers.find((m) => m.userId === user?.id && m.characterName);
      if (myMember?.characterName) return myMember.characterName;
    }
    // 3. Procura correspondência entre as fichas salvas e os membros da party da campanha
    if (camp?.partyMembers && camp.partyMembers.length > 0) {
      const pmNames = camp.partyMembers.map((p) => p.name?.toLowerCase());
      const match = characterSheets.find((s) => s.characterName && pmNames.includes(s.characterName.toLowerCase()));
      if (match?.characterName) return match.characterName;
      // Se não achou ficha correspondente, retorna o nome do membro da party se houver
      if (camp.partyMembers[0]?.name) return camp.partyMembers[0].name;
    }
    // 4. Se tiver apenas uma ficha criada pelo usuário, usa o nome dela
    if (characterSheets.length > 0) {
      const validSheet = characterSheets.find((s) => s.characterName && s.characterName !== 'Novo Aventureiro' && !s.characterName.startsWith('Aventureiro '));
      if (validSheet?.characterName) return validSheet.characterName;
    }
    return 'Aventureiro';
  };

  // Filter feed for current active campaign (or public feed)
  const campaignFeed = feedEvents.filter((e) => e.isPublic && (!currentCampaign || e.campaignId === currentCampaign.id || !e.campaignId));

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    const charName = characterNameInput.trim() || 'Seu Personagem';
    const selectedSheet = characterSheets.find(
      (s) => s.characterName.toLowerCase() === charName.toLowerCase()
    );
    const modelUrl =
      selectedSheet?.modelUrl ||
      (selectedSheet ? getModelUrlByNameOrPath(selectedSheet.className) : getModelUrlByNameOrPath(charName));

    const success = await joinCampaignByCode(inviteCodeInput, characterNameInput, modelUrl);
    setIsJoining(false);

    if (success) {
      const charName = characterNameInput.trim() || 'Seu Personagem';
      
      // Vincula o campaign_id à ficha do jogador e força o salvamento e upsert no Supabase
      const selectedSheet = characterSheets.find(
        (s) => s.characterName.toLowerCase() === charName.toLowerCase()
      );
      if (selectedSheet) {
        const updated = { 
          ...selectedSheet, 
          campaignId: activeCampaign?.id || selectedCampaignId || undefined 
        };
        handleSaveSheet(updated);
      }
      
      setJoinSuccessMsg(`✓ Conectado com sucesso à mesa! Personagem: ${charName}`);
      setInviteCodeInput('');
      setCharacterNameInput('');
      
      // Auto close modal after brief feedback
      setTimeout(() => {
        setJoinSuccessMsg(null);
        setIsJoinModalOpen(false);
      }, 1500);
    } else {
      setJoinErrorMsg('Código de convite inválido ou mesa não encontrada.');
    }
  };

  const handleLeaveCampaign = async (camp: UserCampaign) => {
    const confirmed = await showConfirm({
      title: 'Sair da Campanha',
      message: `Tem certeza que deseja sair da mesa de jogo "${camp.title}"?`,
      confirmText: 'Sair da Campanha',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    await leaveCampaign(camp.id);
    if (selectedCampaignId === camp.id) {
      setSelectedCampaignId(null);
    }
  };

  const handleSelectCampaign = (camp: UserCampaign) => {
    setActiveCampaign(camp);
    setSelectedCampaignId(camp.id);
  };

  // Sinaliza ao PartyLootContext se o jogador está na view de campanha (para controlar o modal de loot)
  useEffect(() => {
    const isOnView = !!selectedCampaignId;
    setIsOnPlayerCampaignView(isOnView);
    // Limpa a flag ao desmontar
    return () => {
      setIsOnPlayerCampaignView(false);
    };
  }, [selectedCampaignId, setIsOnPlayerCampaignView]);

  const handleBackToHub = () => {
    setSelectedCampaignId(null);
  };

  return (
    <div className={`flex-1 bg-[#0a0d14] flex flex-col select-none relative ${
      selectedCampaignId ? 'p-2 sm:p-3 overflow-hidden h-full min-h-0' : 'p-4 sm:p-6 overflow-y-auto'
    }`}>

      {/* ==================== 1. MODAL: ADICIONAR CAMPANHA VIA CÓDIGO ==================== */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Entrar em uma Mesa de Jogo</h3>
                <p className="text-xs text-slate-400">Digite o código enviado pelo seu Dungeon Master</p>
              </div>
            </div>

            {joinSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{joinSuccessMsg}</span>
              </div>
            )}

            {joinErrorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400" />
                <span>{joinErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Código de Convite da Campanha:
                </label>
                <input
                  type="text"
                  required
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder="Ex: O RE-172 ou VALIRIA-89X"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono font-bold uppercase tracking-wider focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Selecione o Personagem para esta Mesa:</span>
                  <span className="text-[10px] text-amber-400 font-mono">({characterSheets.length} ficha(s) salvas)</span>
                </label>

                {characterSheets.length > 0 ? (
                  <select
                    value={characterNameInput}
                    onChange={(e) => setCharacterNameInput(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-bold focus:outline-none transition-all"
                  >
                    <option value="" disabled>
                      -- Selecione um Personagem Salvo --
                    </option>
                    {characterSheets.map((sheet) => (
                      <option key={sheet.id} value={sheet.characterName}>
                        {sheet.characterName} ({sheet.race} {sheet.className} Lvl {sheet.level})
                      </option>
                    ))}
                    <option value="__custom__">✍️ Digitar outro nome de personagem...</option>
                  </select>
                ) : null}

                {/* Input de texto livre caso selecione digitar outro nome ou não tenha fichas salvas */}
                {(characterSheets.length === 0 || characterNameInput === '__custom__') && (
                  <input
                    type="text"
                    required
                    value={characterNameInput === '__custom__' ? '' : characterNameInput}
                    onChange={(e) => setCharacterNameInput(e.target.value)}
                    placeholder="Ex: Kaelen, o Destemido"
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-bold focus:outline-none transition-all mt-2"
                  />
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#2a3449] text-slate-400 hover:text-slate-200 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isJoining ? 'Conectando...' : 'Conectar à Mesa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== 2. VISÃO 1: HUB DE CAMPANHAS DO JOGADOR ==================== */}
      {!selectedCampaignId ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded">
                    MODO JOGADOR
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-100 mt-1">Minhas Campanhas & Mesas de Jogo</h2>
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                  Selecione um card para acessar o Diário de Bordo e o Feed da Aventura, ou adicione uma nova mesa via código.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsManagerModalOpen(true)}
                className="flex items-center gap-2 bg-[#141b2d] border border-amber-500/50 hover:border-amber-400 text-amber-400 hover:text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/10 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Minhas Fichas ({characterSheets.length})</span>
              </button>

              <button
                onClick={handleOpenJoinModal}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Entrar em Mesa (Código)</span>
              </button>
            </div>
          </div>

          {/* Cards Grid Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" /> Suas Campanhas Ativas ({playerCampaigns.length})
            </h3>
          </div>

          {/* Player Campaigns Cards Grid */}
          {playerCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-[#161c28]/60 border border-dashed border-[#2a3449] rounded-2xl space-y-4 max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <ScrollText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-200">Você ainda não ingressou em nenhuma campanha</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Solicite o código de convite ao seu Dungeon Master e clique no botão abaixo para conectar seu personagem à mesa.
                </p>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeira Campanha</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playerCampaigns.map((camp) => {
                const isActive = activeCampaign?.id === camp.id;
                return (
                  <div
                    key={camp.id}
                    onClick={() => handleSelectCampaign(camp)}
                    className={`group relative rounded-2xl p-5 border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-xl hover:-translate-y-1 ${
                      isActive
                        ? 'bg-gradient-to-b from-[#1c2436] to-[#121722] border-amber-500/60 shadow-amber-500/10'
                        : 'bg-[#161c28] border-[#2a3449] hover:border-slate-400 hover:bg-[#1a2233]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                            MESA DE JOGO
                          </span>
                          <h4 className="text-lg font-bold text-slate-100 mt-1.5 group-hover:text-amber-300 transition-colors">
                            {camp.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isActive && (
                            <span className="text-[9px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-mono shadow-md">
                              ATIVA
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveCampaign(camp);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded-lg transition-all"
                            title="Sair desta Campanha"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {camp.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#2a3449] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Personagem:</span>
                        </span>
                        <strong className="text-cyan-300 font-semibold">{resolveCharName(camp)}</strong>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-slate-500" />
                          <span>Código da Mesa:</span>
                        </span>
                        <span className="font-mono text-amber-400 font-bold bg-[#0a0d14] px-2 py-0.5 rounded border border-[#2a3449]">
                          {camp.inviteCode}
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform gap-1">
                        <span>Acessar Feed da Campanha</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ==================== 3. VISÃO 2: COCKPIT DO JOGADOR (CENTRAL DE JOGO) ==================== */
        <div className="flex-1 min-h-0 flex flex-col h-full space-y-2 sm:space-y-3 overflow-hidden animate-fade-in">
          {/* TOP HEADER UNIFICADO (BARRA SUPERIOR) */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-[#141a26] border border-[#2a3449] p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBackToHub}
                className="flex items-center gap-1.5 bg-[#0a0d14] hover:bg-[#2a3449] border border-[#2a3449] text-slate-300 hover:text-amber-400 font-bold px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Minhas Campanhas</span>
              </button>

              <div className="h-6 w-[1px] bg-[#2a3449]" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                    COCKPIT DO JOGADOR
                  </span>
                  {currentCampaign?.inviteCode && (
                    <button
                      onClick={() => handleCopyInviteCode(currentCampaign.inviteCode)}
                      className="text-[10px] font-mono font-bold text-slate-300 bg-[#0a0d14] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                      title="Clique para copiar código de convite da mesa"
                    >
                      <span>Convite: <strong className="text-amber-400">{currentCampaign.inviteCode}</strong></span>
                      {copiedInvite ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    </button>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-100 leading-tight mt-0.5">
                  {currentCampaign?.title || 'Campanha Ativa'}
                </h2>
              </div>
            </div>

            {/* Campaign In-Game Calendar & Celestial Orrery Widget (Player Perspective) */}
            <LiveCalendarWidget />

            {/* Controles de Visualização / Projeção do Jogador (Estilo Cockpit DM) */}
            {(() => {
              const resolvedView = playerCanvasView === 'auto' ? (liveDisplayMode === 'artwork' ? 'art' : liveDisplayMode) : playerCanvasView;
              const isArt = resolvedView === 'art';
              const isMap = resolvedView === 'map';
              const isGrid = resolvedView === 'grid' || resolvedView === 'combat';
              return (
                <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-[#2a3449]">
                  {/* Botão Auto (Seguir Mestre) */}
                  <button
                    onClick={() => setPlayerCanvasView('auto')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'auto'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-cyan-400/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Seguir visualização projetada pelo Mestre automaticamente"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${playerCanvasView === 'auto' ? 'animate-pulse text-amber-300' : ''}`} />
                    <span>Auto</span>
                  </button>

                  <div className="h-4 w-[1px] bg-[#2a3449]/60" />

                  {/* Botão Ilustração */}
                  <button
                    onClick={() => setPlayerCanvasView('art')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'art'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : isArt && playerCanvasView === 'auto'
                        ? 'border border-amber-500/50 text-amber-400 bg-amber-950/40 hover:bg-[#161f30]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Modo Ilustração / Arte da Cena"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Ilustração</span>
                  </button>

                  {/* Botão Dungeon Map */}
                  <button
                    onClick={() => setPlayerCanvasView('map')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'map'
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : isMap && playerCanvasView === 'auto'
                        ? 'border border-indigo-500/50 text-indigo-400 bg-indigo-950/40 hover:bg-[#161f30]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Modo Dungeon Map 2D"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Dungeon Map</span>
                  </button>

                  {/* Botão Grid 3D / Combate */}
                  <button
                    onClick={() => setPlayerCanvasView('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'grid'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : isGrid && playerCanvasView === 'auto'
                        ? 'border border-rose-500/50 text-rose-400 bg-rose-950/40 hover:bg-[#161f30]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Modo Grid 3D / Combate"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Grid 3D</span>
                  </button>
                </div>
              );
            })()}

            {/* Right Header Actions & Online Avatars */}
            <div className="flex items-center gap-2 sm:gap-3">
              <PresenceIndicator users={onlineUsers} className="border-r border-[#2a3449] pr-2 sm:pr-3" />

              {/* Chamada de Voz (Voice Call) no Player Lobby */}
              {isInCall ? (
                <div className="flex items-center gap-1 bg-[#121824] border border-emerald-500/40 rounded-xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsWidgetOpen((prev: boolean) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 transition-all cursor-pointer"
                    title="Abrir Painel da Chamada de Voz"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden sm:inline">Na Call</span>
                    <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      {participants.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        : isSpeaking
                        ? 'bg-emerald-500/20 text-emerald-300 animate-pulse'
                        : 'text-slate-300 hover:text-white hover:bg-[#1f2738]'
                    }`}
                    title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => joinCall()}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-emerald-400 border border-[#2a3449] hover:border-emerald-500/50 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  title="Conectar à Chamada de Voz da Mesa"
                >
                  <PhoneCall className={`w-3.5 h-3.5 text-emerald-400 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isConnecting ? 'Conectando...' : 'Entrar na Call'}</span>
                </button>
              )}

              <XCardButton
                campaignId={currentCampaign?.id}
                playerName={resolveCharName(currentCampaign)}
                safetySettings={currentCampaign?.safetySettings}
                onSendAlert={(alert) => broadcastXCardAlert({ alert })}
              />

              <button
                onClick={() => handleOpenSheetForCampaign(currentCampaign || undefined)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Ficha: <strong className="font-extrabold">{resolveCharName(currentCampaign)}</strong></span>
              </button>

              <button
                onClick={onOpenPlayerView}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
              >
                <Tv className="w-4 h-4" />
                <span>Modo TV</span>
              </button>

              {currentCampaign && (
                <button
                  onClick={() => handleLeaveCampaign(currentCampaign)}
                  className="p-1.5 bg-[#0a0d14] hover:bg-rose-950/40 border border-[#2a3449] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-all"
                  title="Sair desta Campanha"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* MAIN WORKSPACE BODY (CANVAS + SIDEBAR) */}
          <div className="flex-1 min-h-0 flex gap-2 sm:gap-3 overflow-hidden">
            {/* CENTER CANVAS (80% da tela: Grid 3D, Mapa 2D ou Arte da Cena) */}
            <div className="flex-1 min-h-0 bg-[#05070a] border border-[#2a3449] rounded-xl sm:rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-2xl">
              {/* TOP BAR: COMBAT INITIATIVE HUD (Apenas exibido quando uma batalha foi de fato iniciada no Grid) */}
              {(() => {
                const currentScene = projectedScene || activeScene;
                const activeView = playerCanvasView === 'auto' ? (liveDisplayMode === 'artwork' ? 'art' : liveDisplayMode) : playerCanvasView;
                const isBattleActive = Boolean(currentScene?.isBattleStarted) && (activeView === 'grid' || activeView === 'combat');

                if (!isBattleActive) return null;

                return (
                  <div className="w-full shrink-0 z-20">
                    <PlayerCombatTrackerHUD
                      combatants={combatants}
                      currentTurnIndex={currentTurnIndex}
                      roundCount={roundCount}
                      playerCharName={resolveCharName(currentCampaign)}
                      isCombatActive={isBattleActive}
                      characterSheets={characterSheets}
                      activeSheet={activeSheet}
                      campaignMembers={campaignMembers}
                      onEndTurn={handlePlayerNextTurn}
                    />
                  </div>
                );
              })()}

              {/* CANVAS CONTENT AREA */}
              <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
                {(() => {
                  const activeView = playerCanvasView === 'auto' ? (liveDisplayMode === 'artwork' ? 'art' : liveDisplayMode) : playerCanvasView;
                  const currentScene = projectedScene || activeScene;

                  if (activeView === 'grid' || activeView === 'combat') {
                    return (
                      <ThreeErrorBoundary>
                        <BattleGrid3D
                          combatants={combatants}
                          currentTurnIndex={currentTurnIndex}
                          selectedTargetId={selectedTargetId || undefined}
                          isBattleStarted={currentScene?.isBattleStarted}
                          onAttackTarget={handlePlayerAttackTarget}
                          {...(currentScene?.environmentSettings || {})}
                          timeOfDayHour={currentScene?.timeOfDayHour}
                          timeOfDayPreset={currentScene?.timeOfDay}
                          isIndoor={currentScene?.timeOfDay === 'indoors'}
                          hasFog={currentScene?.hasFog}
                          hasRain={currentScene?.hasRain}
                          floorTextureUrl={currentScene?.floorTextureUrl}
                          initialBuildingBlocks={currentScene?.buildingBlocks || currentScene?.environmentSettings?.building_blocks_3d || []}
                          initialGridConfig={currentScene?.gridConfig3D || currentScene?.environmentSettings?.grid_config_3d}
                          initialTokenElevations={currentScene?.tokenElevations || currentScene?.environmentSettings?.token_elevations}
                          interactive={true}
                          userRole="player"
                        />
                      </ThreeErrorBoundary>
                    );
                  }

                  if (activeView === 'map') {
                    const typedMap = mapData as any;
                    const sceneAssocIds = currentScene?.associatedMapIds || (currentScene?.associatedMapId ? [currentScene.associatedMapId] : []);
                    const currentMapId = 
                      typedMap?.activeMapId || 
                      (sceneAssocIds.length > 0 ? (campaignMaps.find(m => sceneAssocIds.includes(m.id))?.id || sceneAssocIds[0]) : null) ||
                      (campaignMaps.length > 0 ? campaignMaps[0]?.id : null);

                    let activeCampaignMap = currentMapId ? (campaignMaps.find((m) => m.id === currentMapId) || null) : null;
                    if (!activeCampaignMap && typedMap && (typedMap.mapTitle || typedMap.title || typedMap.coverImageUrl || typedMap.bgImageUrl)) {
                      activeCampaignMap = {
                        id: currentMapId || 'active-synced-map',
                        campaignId: activeCampaign?.id || '',
                        title: typedMap.mapTitle || typedMap.title || currentScene?.title || 'Masmorra Ativa',
                        gridData: {
                          description: typedMap.description || typedMap.dungeonLore || '',
                          challengeRating: typedMap.challengeRating || typedMap.dungeonCR || 'Nível Recomendado',
                          coverImageUrl: typedMap.coverImageUrl || typedMap.bgImageUrl,
                          bgImageUrl: typedMap.bgImageUrl,
                          gridScale: typedMap.gridScale || 40,
                          grid: typedMap.grid || [],
                        }
                      };
                    }
                    if (!activeCampaignMap && sceneAssocIds.length === 0) {
                      activeCampaignMap = campaignMaps[0] || null;
                    }

                    const dungeonCover = typedMap?.coverImageUrl || activeCampaignMap?.gridData?.coverImageUrl || activeCampaignMap?.gridData?.levels?.[0]?.bgImageUrl || activeCampaignMap?.gridData?.bgImageUrl || typedMap?.bgImageUrl;
                    const dungeonLore = typedMap?.description || activeCampaignMap?.gridData?.description;
                    const dungeonCR = typedMap?.challengeRating || activeCampaignMap?.gridData?.challengeRating || 'Nível Recomendado';
                    const dungeonTitle = typedMap?.mapTitle || typedMap?.title || activeCampaignMap?.title || currentScene?.title || 'Exploração de Masmorra';
                    const isExplorationStarted = 
                      typedMap?.dungeonExplorationStarted === true || 
                      (mapData as any)?.dungeonExplorationStarted === true ||
                      currentScene?.isDungeonExplorationStarted === true;

                    // Se a exploração ainda não foi iniciada pelo Mestre, mostra a Capa Cinemática
                    if (!isExplorationStarted && (dungeonCover || dungeonLore || activeCampaignMap)) {
                      return (
                        <div className="w-full h-full relative flex items-center justify-center p-3 sm:p-4 pb-20 sm:pb-24 bg-[#06080e] overflow-hidden select-none animate-fade-in">
                          {dungeonCover && (
                            <div
                              className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 filter blur-sm pointer-events-none"
                              style={{ backgroundImage: `url(${normalizeImageUrl(dungeonCover)})` }}
                            />
                          )}
                          <div className="relative z-10 max-w-md sm:max-w-lg w-full max-h-full bg-[#0d121c]/95 border-2 border-amber-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black flex flex-col gap-2 text-center items-center overflow-hidden">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/40 rounded-full text-amber-300 text-[10.5px] font-mono font-bold uppercase shrink-0">
                              <span>🏰 {dungeonCR}</span>
                            </div>

                            {dungeonCover && (
                              <div className="w-full max-h-36 sm:max-h-40 aspect-[16/9] rounded-xl overflow-hidden border border-amber-500/40 shadow-xl bg-black shrink-0">
                                <img
                                  src={normalizeImageUrl(dungeonCover)}
                                  alt="Capa da Masmorra"
                                  className="w-full h-full object-cover animate-fade-in"
                                />
                              </div>
                            )}

                            <div className="space-y-0.5 shrink-0">
                              <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide font-serif drop-shadow">
                                {dungeonTitle}
                              </h2>
                              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-0.5" />
                            </div>

                            {dungeonLore && (
                              <div className="w-full max-h-24 sm:max-h-28 overflow-y-auto custom-scrollbar p-2 bg-[#080b12] rounded-xl border border-amber-500/20 text-left flex-1 min-h-0">
                                <p className="text-[11px] text-amber-100 font-serif leading-relaxed italic">
                                  "{dungeonLore}"
                                </p>
                              </div>
                            )}

                            <p className="text-[10px] text-amber-400/80 font-mono animate-pulse tracking-wider shrink-0">
                              ⚔️ Aguardando o Mestre iniciar a exploração...
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (typedMap && typedMap.grid && typedMap.grid.length > 0) {
                      return (
                        <DysonCanvas
                          grid={typedMap.grid || []}
                          bgImageUrl={typedMap.bgImageUrl || null}
                          gridScale={typedMap.gridScale || 40}
                          gridOffsetX={typedMap.gridOffsetX || 0}
                          gridOffsetY={typedMap.gridOffsetY || 0}
                          combatants={combatants}
                          vectorWalls={typedMap.vectorWalls || []}
                          lightSources={typedMap.lightSources || []}
                          selectedTool="pan"
                          selectedTileType="floor"
                          selectedTokenCombatant={null}
                          onGridChange={() => {}}
                          isPlayerView={true}
                          drawings={drawings}
                        />
                      );
                    }
                    // Map view is active but data hasn't loaded yet
                    return (
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-400 font-mono animate-pulse">
                        <MapIcon className="w-10 h-10 text-indigo-500/60 animate-bounce" />
                        <p className="text-xs uppercase tracking-widest text-indigo-400">Carregando Mapa da Dungeon...</p>
                      </div>
                    );
                  }

                  // Helper to resolve Tailwind aspect ratio class
                  const getAspectClass = (aspect?: string) => {
                    switch (aspect) {
                      case '4:3': return 'aspect-[4/3]';
                      case '1:1': return 'aspect-square';
                      case '9:16': return 'aspect-[9/16]';
                      case '16:9':
                      default:
                        return 'aspect-video';
                    }
                  };

                  // Default Scene Artwork View
                  const resolved = resolveCurrentSceneImage(currentScene);
                  const rawUrl = resolved?.imageUrl || (projectedScene as any)?.currentImageUrl || (currentScene as any)?.currentImageUrl || currentScene?.imageUrl;
                  const activeAspectRatio = resolved?.aspectRatio || currentScene?.defaultAspectRatio || '16:9';

                  if (rawUrl) {
                    const ytEmbed = getYouTubeEmbedUrl(rawUrl);
                    if (ytEmbed) {
                      return (
                        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
                          <div className={`h-full max-w-full w-auto ${getAspectClass(activeAspectRatio)} bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center`}>
                            <iframe
                              src={ytEmbed}
                              className="w-full h-full border-0 bg-black"
                              allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      );
                    }
                    const isVid = resolved?.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(rawUrl);
                    if (isVid) {
                      return (
                        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
                          <div className={`h-full max-w-full w-auto ${getAspectClass(activeAspectRatio)} bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center`}>
                            <video
                              src={normalizeImageUrl(rawUrl)}
                              className="w-full h-full object-contain bg-black"
                              autoPlay
                              loop
                              muted
                              playsInline
                              controls={false}
                            />
                            <SlideTextOverlayRenderer
                              overlays={resolved?.textOverlays}
                              fallbackOverlayText={resolved?.overlayText || currentScene?.sensoryText}
                              fallbackTitle={resolved?.title || currentScene?.title}
                              triggerKey={`${rawUrl}-${resolved?.activeImageIndex ?? 0}`}
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
                        <div className={`h-full max-w-full w-auto ${getAspectClass(activeAspectRatio)} bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center`}>
                          <MagicShaderSlideshow
                            imageUrl={normalizeImageUrl(rawUrl)}
                            transitionType={resolved?.transitionType || currentScene?.defaultTransition || 'magical_dissolve'}
                            aspectRatio={activeAspectRatio as any}
                            className="w-full h-full"
                          />
                          <SlideTextOverlayRenderer
                            overlays={resolved?.textOverlays}
                            fallbackOverlayText={resolved?.overlayText || currentScene?.sensoryText}
                            fallbackTitle={resolved?.title || currentScene?.title}
                            triggerKey={`${rawUrl}-${resolved?.activeImageIndex ?? 0}`}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500 font-mono">
                      <ImageIcon className="w-12 h-12 text-slate-600 opacity-40 animate-pulse" />
                      <p className="text-xs text-slate-400">Aguardando Transmissão de Imagem pelo Dungeon Master...</p>
                    </div>
                  );
                })()}
              </div>

              {/* FLOATING TOGGLE BUTTON TO RE-OPEN SIDEBAR WHEN COLLAPSED */}
              {isSidebarCollapsed && (
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-[#141a26]/90 hover:bg-[#1a2334] border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl shadow-2xl backdrop-blur-md transition-all active:scale-95 animate-fade-in cursor-pointer"
                  title="Expandir Painel Lateral & Ações"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Painel Lateral & Ações</span>
                </button>
              )}
            </div>

            {/* RIGHT SIDEBAR INTEGRADA (INICIATIVA / LOG / CHAT + DOCK DE AÇÕES) */}
            {!isSidebarCollapsed && (
              <div className="w-80 lg:w-96 bg-[#141a26] border border-[#2a3449] rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl shrink-0 transition-all duration-300 animate-fade-in">
                {/* Tab Navigation + Collapse Toggle */}
                <div className="flex items-center justify-between border-b border-[#2a3449] bg-[#0c1018] p-1.5 gap-1 shrink-0">
                  <div className="flex items-center gap-1 flex-1">
                    <button
                      onClick={() => setSidebarTab('init')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        sidebarTab === 'init'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Membros ({campaignMembers.length})</span>
                    </button>
                    <button
                      onClick={() => setSidebarTab('log')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        sidebarTab === 'log'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ScrollText className="w-3.5 h-3.5" />
                      <span>Log ({combatLogs.length})</span>
                    </button>
                    <button
                      onClick={() => setSidebarTab('chat')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        sidebarTab === 'chat'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat ({chatMessages.length})</span>
                    </button>
                  </div>

                  {/* Collapse Button */}
                  <button
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-[#1a2334] border border-transparent hover:border-amber-500/30 rounded-lg transition-all ml-1 cursor-pointer"
                    title="Recolher Painel Lateral (Foco Total na Cena/Dungeon)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* TAB CONTENT (Scrollable Upper Section) */}
                <div className="flex-1 overflow-y-auto">
                  {sidebarTab === 'init' ? (
                    <div className="p-3 space-y-4">
                      {/* Widget: Membros do Grupo */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-[#2a3449]">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" /> Membros Conectados
                          </span>
                        </div>

                        {campaignMembers.map((member) => {
                          const isMe = member.characterName?.toLowerCase() === currentCampaign?.characterName?.toLowerCase();
                          const initials = (member.characterName || '?').slice(0, 2).toUpperCase();
                          const isDM = member.role === 'dm';
                          return (
                            <div
                              key={member.id}
                              className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                                isMe ? 'bg-cyan-950/30 border-cyan-500/40' : isDM ? 'bg-amber-950/20 border-amber-500/30' : 'bg-[#0a0d14] border-[#2a3449]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.characterName} className="w-7 h-7 rounded-lg object-cover border border-[#2a3449]" />
                                ) : (
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border ${isDM ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-slate-200 leading-tight">
                                    {member.characterName || 'Aventureiro'}
                                    {isMe && <span className="ml-1 text-[8px] bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 px-1 rounded font-mono">VOCÊ</span>}
                                  </p>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase">
                                    {isDM ? '🎲 Dungeon Master' : '⚔️ Jogador'}
                                  </p>
                                </div>
                              </div>

                              {!isMe && !isDM && (
                                <button
                                  onClick={() => handleViewMemberSheet(member)}
                                  disabled={loadingMemberSheet === member.id}
                                  className="px-2 py-1 bg-[#161c28] hover:bg-cyan-950/40 border border-[#2a3449] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                                  title="Ver Ficha deste Jogador"
                                >
                                  {loadingMemberSheet === member.id ? '...' : 'Ficha'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : sidebarTab === 'log' ? (
                    <SharedGameLog
                      combatLogs={combatLogs}
                      chatMessages={chatMessages}
                      currentUserId={user?.id}
                      isDm={activeCampaign?.dmId === user?.id}
                    />
                  ) : (
                    <LiveChatPanel
                      activeSheet={activeSheet}
                      displayMode={macroDisplayMode}
                      secretMode={secretRollMode}
                    />
                  )}
                </div>

                {/* FIXED BOTTOM: PLAYER TOKEN ACTION DOCK */}
                {(() => {
                  const charName = resolveCharName(currentCampaign);
                  const meCombatant = combatants.find(
                    (c) => c.name.toLowerCase().includes(charName.toLowerCase()) || charName.toLowerCase().includes(c.name.toLowerCase())
                  );
                  const currentScene = projectedScene || activeScene;
                  const activeView = playerCanvasView === 'auto' ? (liveDisplayMode === 'artwork' ? 'art' : liveDisplayMode) : playerCanvasView;
                  const isCombat = Boolean(currentScene?.isBattleStarted) && (activeView === 'grid' || activeView === 'combat');
                  const isMyTurn = isCombat && combatants[currentTurnIndex]?.name.toLowerCase().includes(charName.toLowerCase());

                  return (
                    <div className="shrink-0">
                      <PlayerTokenActionDock
                        activeSheet={activeSheet}
                        playerCombatant={meCombatant}
                        isMyTurn={isMyTurn}
                        isCombatActive={isCombat}
                        layout="sidebar"
                        onStartAttackTargeting={(attack) => {
                          const cleanBonus = parseInt(attack.atkBonus.replace(/[^0-9-]/g, '')) || 0;
                          const rangeText = attack.rangeText || attack.range || attack.name;
                          const rangeInfo = parseRangeString(rangeText, attack.name);
                          setPendingAttack({
                            title: `Ataque: ${attack.name}`,
                            mod: cleanBonus,
                            actorCombatant: meCombatant,
                            actionDesc: attack.damage,
                            rangeText,
                            rangeInfo,
                          });
                          setPendingAttackPayload(attack);
                          toast.info(`Mirando Ataque: ${attack.name}. Clique na criatura alvo no Grid 3D!`);
                        }}
                        onExecuteRoll={(rollEvent) => {
                          const fullRoll = {
                            id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                            characterId: activeSheet.id,
                            characterName: activeSheet.characterName || charName,
                            avatarUrl: activeSheet.avatarUrl,
                            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                            ...rollEvent
                          };
                          broadcastPlayerRoll(fullRoll as any);
                        }}
                        onUpdateCombatantActionState={(update) => {
                          if (meCombatant && updateCombatantState) {
                            updateCombatantState(meCombatant.id, update);
                          }
                        }}
                        onOpenFullSheet={() => handleOpenSheetForCampaign(currentCampaign || undefined)}
                        onEndTurn={handlePlayerNextTurn}
                      />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== GERENCIADOR DE MÚLTIPLAS FICHAS ==================== */}
      <CharacterManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        characterSheets={characterSheets}
        onSelectSheetToEdit={handleSelectSheetToEdit}
        onCreateNewSheet={handleCreateNewSheet}
        onDuplicateSheet={handleDuplicateSheet}
        onDeleteSheet={handleDeleteSheet}
      />

      {/* ==================== MODAL DA FICHA DE PERSONAGEM D&D 5E ==================== */}
      <CharacterSheetModal
        sheet={activeSheet}
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onSave={handleSaveSheet}
      />

      {/* ==================== VIEWER MODAL: FICHA DE OUTRO JOGADOR (SOMENTE LEITURA) ==================== */}
      {isViewingSheetOpen && viewingSheet && (
        <CharacterSheetModal
          sheet={viewingSheet}
          isOpen={isViewingSheetOpen}
          onClose={() => {
            setIsViewingSheetOpen(false);
            setViewingSheet(null);
          }}
          onSave={() => {}}
          readOnly={true}
        />
      )}

      {/* 3D BG3 Dice Roller Modal & HUD */}
      <FloatingDiceRollerHUD />
    </div>
  );
};

