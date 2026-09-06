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
  PhoneOff,
  Package,
  Crown,
  Play,
  Download
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useSession } from '@/context/SessionContext';
import { useVoiceCall } from '@/context/VoiceCallContext';
import { UserCampaign, CharacterSheet, CharacterEquipmentItem, MacroBarDisplayMode, SecretRollNotificationMode, TransactionEntry, WorldEntity } from '@/lib/types';
import { mapWorldEntityRowToDomain } from '@/lib/mappers';
import { CharacterSheetModal } from './character-sheet/CharacterSheetModal';
import { CharacterManagerModal } from './character-sheet/CharacterManagerModal';
import { ImportCharacterModal } from './character-sheet/ImportCharacterModal';
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
import { CampaignFeedModal } from './session/CampaignFeedModal';
import { useCampaignNotifications } from '@/lib/hooks/useCampaignNotifications';
import { MemberContextMenu, ContextMenuMember } from './player-view/MemberContextMenu';
import { ItemTransferModal } from './player-view/ItemTransferModal';
import { ReceivedItemsModal } from './player-view/ReceivedItemsModal';
import { executeItemTransfer, TransferItemPayload } from '@/lib/services/itemTransferService';
import { DirectTransferPayload } from '@/lib/types';

interface PlayerLobbyProps {
  onOpenPlayerView: () => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({ onOpenPlayerView }) => {
  const { 
    userCampaigns, 
    activeCampaign, 
    setActiveCampaign, 
    joinCampaignByCode, 
    leaveCampaign,
    feedEvents,
    updateCampaignMemberModelUrl
  } = useCampaign();
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
    broadcastCombatLogEntry,
    broadcastChatMessage,
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
  const { worldEntities } = useWorld();
  const { user } = useAuth();
  const { showAlert, showConfirm } = useCustomDialog();
  const { 
    setIsOnPlayerCampaignView, 
    pendingReceivedTransfer, 
    setPendingReceivedTransfer, 
    sendDirectTransfer 
  } = usePartyLoot();
  const { isInCall, isConnecting, isMuted, isSpeaking, joinCall, toggleMute, setIsWidgetOpen, participants } = useVoiceCall();
  
  // Navigation & Modal States
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    activeCampaign?.role === 'player' ? activeCampaign?.id || null : null
  );
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoinImportModalOpen, setIsJoinImportModalOpen] = useState(false);
  const [showCampaignFeedModal, setShowCampaignFeedModal] = useState(false);

  const chronicleNotifications = useCampaignNotifications(
    activeCampaign?.id,
    activeCampaign?.npcDisclosures,
    feedEvents
  );

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
          if (typedMap) {
            const finalGrid = gridData.grid.map((row: any[]) => row.map((cell: any) => ({ ...cell })));
            if ((typedMap as any).tokens && Array.isArray((typedMap as any).tokens)) {
              for (let r = 0; r < finalGrid.length; r++) {
                for (let c = 0; c < finalGrid[r].length; c++) {
                  finalGrid[r][c].tokenName = undefined;
                  finalGrid[r][c].tokenColor = undefined;
                }
              }
              for (const tk of (typedMap as any).tokens) {
                if (finalGrid[tk.r]?.[tk.c]) {
                  finalGrid[tk.r][tk.c].tokenName = tk.name;
                  finalGrid[tk.r][tk.c].tokenColor = tk.color;
                }
              }
            }
            if ((typedMap as any).fogMatrix && typeof (typedMap as any).fogMatrix === 'string') {
              let idx = 0;
              for (let r = 0; r < finalGrid.length; r++) {
                for (let c = 0; c < finalGrid[r].length; c++) {
                  const char = (typedMap as any).fogMatrix[idx++];
                  if (char === '0') finalGrid[r][c].fog = false;
                  else if (char === '1') finalGrid[r][c].fog = true;
                }
              }
            }
            gridData.grid = finalGrid;
          }

          console.log('[PlayerLobby] Map loaded successfully. Grid size:', gridData.grid.length, 'x', gridData.grid[0]?.length);
          const isExplStarted = 
            savedData?.isExplorationStarted === true || 
            (activeId && savedData?.maps?.[activeId]?.isExplorationStarted === true) || 
            currentScene.isDungeonExplorationStarted === true ||
            (mapData as any)?.dungeonExplorationStarted === true;

          setMapData((prev: any) => {
            let finalGrid = gridData.grid || [];
            // If prev already has real-time tokens or fog from live broadcast, merge them on top of DB template!
            if (prev && finalGrid.length > 0) {
              const clone = finalGrid.map((row: any[]) => row.map((cell: any) => ({ ...cell })));
              if (prev.tokens && Array.isArray(prev.tokens)) {
                for (let r = 0; r < clone.length; r++) {
                  for (let c = 0; c < clone[r].length; c++) {
                    clone[r][c].tokenName = undefined;
                    clone[r][c].tokenColor = undefined;
                  }
                }
                for (const tk of prev.tokens) {
                  if (clone[tk.r]?.[tk.c]) {
                    clone[tk.r][tk.c].tokenName = tk.name;
                    clone[tk.r][tk.c].tokenColor = tk.color;
                  }
                }
              } else if (prev.grid && Array.isArray(prev.grid) && prev.grid.length === clone.length) {
                for (let r = 0; r < clone.length; r++) {
                  for (let c = 0; c < clone[r].length; c++) {
                    if (prev.grid[r]?.[c]?.tokenName) {
                      clone[r][c].tokenName = prev.grid[r][c].tokenName;
                      clone[r][c].tokenColor = prev.grid[r][c].tokenColor;
                    }
                  }
                }
              }

              if (prev.fogMatrix && typeof prev.fogMatrix === 'string') {
                let idx = 0;
                for (let r = 0; r < clone.length; r++) {
                  for (let c = 0; c < clone[r].length; c++) {
                    if (idx < prev.fogMatrix.length) {
                      const char = prev.fogMatrix[idx++];
                      if (char === '0') clone[r][c].fog = false;
                      else if (char === '1') clone[r][c].fog = true;
                    }
                  }
                }
              }
              finalGrid = clone;
            }

            return {
              ...(prev || {}),
              grid: finalGrid,
              bgImageUrl: gridData.bgImageUrl || null,
              gridScale: gridData.gridScale || 40,
              gridOffsetX: gridData.gridOffsetX || 0,
              gridOffsetY: gridData.gridOffsetY || 0,
              vectorWalls: gridData.vectorWalls || [],
              lightSources: gridData.lightSources || [],
              activeMapId: activeId,
              sceneId: currentScene.id,
              dungeonExplorationStarted: isExplStarted,
            };
          });
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
  const [sidebarTab, setSidebarTab] = useState<'init' | 'log' | 'chat'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [macroDisplayMode, setMacroDisplayMode] = useState<MacroBarDisplayMode>('both');
  const [secretRollMode, setSecretRollMode] = useState<SecretRollNotificationMode>('subtle_notice');
  const [pendingAttackPayload, setPendingAttackPayload] = useState<any>(null);

  // Context Menu & Item Trading States
  const [memberContextMenu, setMemberContextMenu] = useState<{
    x: number;
    y: number;
    member: ContextMenuMember;
  } | null>(null);

  const [tradeModalState, setTradeModalState] = useState<{
    isOpen: boolean;
    receiverMember: ContextMenuMember | null;
  }>({ isOpen: false, receiverMember: null });

  const handleMemberContextMenu = (e: React.MouseEvent, member: { id: string; userId: string; characterName?: string; avatarUrl?: string; role: string }) => {
    e.preventDefault();
    setMemberContextMenu({
      x: e.clientX,
      y: e.clientY,
      member: {
        id: member.id,
        userId: member.userId,
        characterName: member.characterName,
        avatarUrl: member.avatarUrl,
        role: member.role,
      },
    });
  };

  const handleStartItemTransfer = (member: ContextMenuMember) => {
    setTradeModalState({
      isOpen: true,
      receiverMember: member,
    });
  };

  const handleConfirmItemTransfer = async (itemsToTransfer: TransferItemPayload[]) => {
    if (!tradeModalState.receiverMember || !activeSheet) return;
    const targetMember = tradeModalState.receiverMember;
    const targetCharName = (targetMember.characterName || '').trim();

    // 1. Localiza a ficha do destinatário com máxima abrangência (Supabase + localStorage)
    let receiverSheet: CharacterSheet | null = null;
    let receiverRowId: string | null = null;
    let receiverUserId: string | null = (targetMember.userId && isValidUuid(targetMember.userId)) ? targetMember.userId : null;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('character_sheets').select('*');
        if (currentCampaign?.id && isValidUuid(currentCampaign.id)) {
          query = query.or(`campaign_id.eq.${currentCampaign.id},campaign_id.is.null`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const normTarget = targetCharName.toLowerCase();
          const match = data.find((row) => {
            const rowCharName = (row.character_name || row.data?.characterName || '').trim().toLowerCase();
            return (
              (targetMember.userId && isValidUuid(targetMember.userId) && row.user_id === targetMember.userId) ||
              (normTarget && rowCharName === normTarget) ||
              (normTarget && (rowCharName.includes(normTarget) || normTarget.includes(rowCharName)))
            );
          });

          if (match) {
            receiverRowId = match.id;
            if (match.user_id && isValidUuid(match.user_id)) {
              receiverUserId = match.user_id;
            }
            receiverSheet = {
              ...match.data,
              id: match.id,
              userId: match.user_id || receiverUserId || 'unknown',
              campaignId: match.campaign_id || currentCampaign?.id,
              characterName: match.character_name || match.data?.characterName || targetCharName,
            };
          }
        }
      } catch (err) {
        console.error('Erro ao buscar ficha do destinatário no Supabase:', err);
      }
    }

    // Fallback: busca em localStorage
    if (!receiverSheet && targetCharName) {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        const sheets: CharacterSheet[] = saved ? JSON.parse(saved) : [];
        const normTarget = targetCharName.toLowerCase();
        const match = sheets.find(
          (s) => s.characterName && s.characterName.trim().toLowerCase() === normTarget
        );
        if (match) {
          receiverSheet = { ...match };
          if (match.id && isValidUuid(match.id)) {
            receiverRowId = match.id;
          }
          if (match.userId && isValidUuid(match.userId)) {
            receiverUserId = match.userId;
          }
        }
      } catch (_) {}
    }

    // Se ainda não existir nenhuma ficha para este membro, cria uma nova ficha com UUID válido garantido
    if (!receiverSheet) {
      receiverSheet = createEmptyCharacterSheet(
        (receiverUserId && isValidUuid(receiverUserId)) ? receiverUserId : (user?.id || 'player-1'),
        currentCampaign?.id
      );
      receiverSheet.characterName = targetCharName || 'Aventureiro';
      receiverSheet.playerName = targetMember.characterName || 'Jogador';
      receiverRowId = receiverSheet.id;
    }

    // 2. Executa a transferência pura mantendo a integridade total do modelo de dados D&D 5e
    const result = executeItemTransfer(activeSheet, receiverSheet, itemsToTransfer);
    const updatedSender = result.updatedSenderSheet;
    const updatedReceiver = result.updatedReceiverSheet;
    const summaryText = result.transferredItemsSummary.join(', ');

    // 3. Persiste a ficha do remetente
    setActiveSheet(updatedSender);
    setCharacterSheets((prev) => prev.map((s) => (s.id === updatedSender.id ? updatedSender : s)));
    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1');
      const sheets: CharacterSheet[] = saved ? JSON.parse(saved) : [];
      const newSheets = sheets.map((s) => (s.id === updatedSender.id ? updatedSender : s));
      localStorage.setItem('masters_codex_character_sheets_v1', JSON.stringify(newSheets));
    } catch (_) {}

    if (isSupabaseConfigured() && isValidUuid(updatedSender.id)) {
      try {
        await supabase.from('character_sheets').upsert({
          id: updatedSender.id,
          user_id: (updatedSender.userId && isValidUuid(updatedSender.userId)) ? updatedSender.userId : (user?.id && isValidUuid(user.id) ? user.id : null),
          campaign_id: (currentCampaign?.id && isValidUuid(currentCampaign.id)) ? currentCampaign.id : null,
          character_name: updatedSender.characterName,
          data: updatedSender,
          updated_at: updatedSender.updatedAt,
        });
      } catch (err) {
        console.error('Erro ao atualizar ficha do remetente no Supabase:', err);
      }
    }

    // 4. Persiste a ficha do destinatário
    const finalReceiverId = (receiverRowId && isValidUuid(receiverRowId))
      ? receiverRowId
      : (updatedReceiver.id && isValidUuid(updatedReceiver.id))
      ? updatedReceiver.id
      : generateUuid();

    updatedReceiver.id = finalReceiverId;

    setCharacterSheets((prev) => {
      const normRec = (updatedReceiver.characterName || '').toLowerCase();
      const exists = prev.some((s) => s.id === finalReceiverId || (s.characterName && s.characterName.toLowerCase() === normRec));
      if (exists) {
        return prev.map((s) => (s.id === finalReceiverId || (s.characterName && s.characterName.toLowerCase() === normRec) ? updatedReceiver : s));
      }
      return [...prev, updatedReceiver];
    });

    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1');
      const sheets: CharacterSheet[] = saved ? JSON.parse(saved) : [];
      const normRec = (updatedReceiver.characterName || '').toLowerCase();
      const exists = sheets.some((s) => s.id === finalReceiverId || (s.characterName && s.characterName.toLowerCase() === normRec));
      const newSheets = exists 
        ? sheets.map((s) => (s.id === finalReceiverId || (s.characterName && s.characterName.toLowerCase() === normRec) ? updatedReceiver : s))
        : [...sheets, updatedReceiver];
      localStorage.setItem('masters_codex_character_sheets_v1', JSON.stringify(newSheets));

      // Dispara storage event para atualizar outras abas no mesmo navegador
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'masters_codex_character_sheets_v1',
          newValue: JSON.stringify(newSheets),
        })
      );
    } catch (_) {}

    const isDm = activeCampaign?.role === 'dm' || activeCampaign?.dmId === user?.id;
    if (isDm && isSupabaseConfigured() && isValidUuid(finalReceiverId)) {
      try {
        await supabase.from('character_sheets').upsert({
          id: finalReceiverId,
          user_id: (receiverUserId && isValidUuid(receiverUserId)) ? receiverUserId : null,
          campaign_id: (currentCampaign?.id && isValidUuid(currentCampaign.id)) ? currentCampaign.id : null,
          character_name: updatedReceiver.characterName,
          data: updatedReceiver,
          updated_at: updatedReceiver.updatedAt,
        });
      } catch (err) {
        console.warn('Aviso ao salvar ficha do destinatário como DM:', err);
      }
    }

    // 5. Transmite o pacote em tempo real para abrir o modal no cliente do destinatário
    if (sendDirectTransfer) {
      try {
        await sendDirectTransfer({
          campaignId: currentCampaign?.id || activeCampaign?.id || '',
          fromUserId: user?.id,
          fromCharacterName: activeSheet.characterName || 'Jogador',
          toUserId: receiverUserId || undefined,
          toCharacterName: targetCharName,
          items: itemsToTransfer.map((t) => ({ ...t.item, quantity: t.quantityToSend })),
        });
      } catch (err) {
        console.warn('Erro no broadcast de transferência direta:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('masters_codex_loot_received', {
          detail: {
            characterName: updatedReceiver.characterName,
            userId: receiverUserId,
            items: itemsToTransfer.map((t) => t.item),
            sourceName: activeSheet.characterName,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('masters_codex_sheets_updated', {
          detail: {
            characterName: updatedReceiver.characterName,
            userId: receiverUserId,
          },
        })
      );
    }

    // 6. Envia mensagem para o Chat e para o Registro de Jogo (Log) - SEM POPUP DE ROLAGEM!
    if (broadcastChatMessage) {
      broadcastChatMessage({
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        campaignId: currentCampaign?.id || '',
        senderId: user?.id || 'player',
        senderName: activeSheet.characterName || 'Jogador',
        senderRole: 'player',
        content: `📦 Transferiu ${summaryText} para ${targetCharName}.`,
        timestamp: new Date().toISOString(),
        type: 'system',
      });
    }

    if (broadcastCombatLogEntry) {
      broadcastCombatLogEntry({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        round: roundCount || 0,
        actorId: activeSheet.id,
        actorName: activeSheet.characterName || 'Jogador',
        targetId: updatedReceiver.id,
        targetName: updatedReceiver.characterName,
        eventType: 'system',
        actionName: 'Transferência de Itens',
        description: `📦 ${activeSheet.characterName} transferiu ${summaryText} para ${targetCharName}`,
      });
    }

    // Fecha o modal de envio com sucesso
    setTradeModalState({ isOpen: false, receiverMember: null });
    toast.success(`Itens enviados com sucesso para ${targetCharName}: ${summaryText}!`);
  };

  // Coleta atômica de itens recebidos no ReceivedItemsModal (gravada com as credenciais do próprio destinatário)
  const [isCollectingReceivedItems, setIsCollectingReceivedItems] = useState(false);

  const handleCollectReceivedTransfer = async (transfer: DirectTransferPayload) => {
    if (!activeSheet) {
      toast.error('Nenhuma ficha ativa selecionada para receber os itens.');
      return;
    }

    setIsCollectingReceivedItems(true);
    try {
      const incomingList: CharacterEquipmentItem[] = [];
      if (Array.isArray(transfer.items) && transfer.items.length > 0) {
        incomingList.push(...transfer.items);
      } else if (transfer.item) {
        incomingList.push(transfer.item);
      }

      if (incomingList.length === 0) {
        setPendingReceivedTransfer(null);
        return;
      }

      const updated = { ...activeSheet };
      const currentEq = [...(updated.equipment || updated.items || [])];

      for (const inc of incomingList) {
        const existingIds = new Set(currentEq.map((e) => e.id));
        let safeId = inc.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        if (existingIds.has(safeId)) {
          safeId = `${safeId}_recv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        }
        currentEq.push({ ...inc, id: safeId, equipped: false });

        // Se for arma, sincroniza com a lista de ataques caso ainda não conste
        if (inc.itemType === 'weapon' || inc.weaponProps) {
          const currentAttacks = updated.attacks || [];
          if (!currentAttacks.some((atk) => (atk.name || '').trim().toLowerCase() === (inc.name || '').trim().toLowerCase())) {
            updated.attacks = [
              ...currentAttacks,
              {
                id: `atk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: inc.name,
                atkBonus: inc.weaponProps?.atkBonus ? `+${inc.weaponProps.atkBonus}` : '+2',
                damage: inc.weaponProps?.damage || '1d6',
                type: inc.weaponProps?.damageType || 'Cortante',
              },
            ];
          }
        }
      }

      updated.equipment = currentEq;
      updated.items = currentEq;
      updated.updatedAt = new Date().toISOString();

      // Salva na ficha do destinatário com credenciais próprias do usuário autenticado (100% RLS compliance)
      setActiveSheet(updated);
      setCharacterSheets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        const sheets: CharacterSheet[] = saved ? JSON.parse(saved) : [];
        const newSheets = sheets.map((s) => (s.id === updated.id ? updated : s));
        localStorage.setItem('masters_codex_character_sheets_v1', JSON.stringify(newSheets));
      } catch (_) {}

      if (isSupabaseConfigured() && user?.id && isValidUuid(user.id)) {
        const sheetId = (updated.id && isValidUuid(updated.id)) ? updated.id : generateUuid();
        updated.id = sheetId;
        const cId = (updated.campaignId && isValidUuid(updated.campaignId))
          ? updated.campaignId
          : (activeCampaign?.id && isValidUuid(activeCampaign.id) ? activeCampaign.id : null);

        await supabase.from('character_sheets').upsert({
          id: sheetId,
          user_id: user.id,
          campaign_id: cId,
          character_name: updated.characterName || 'Sem Nome',
          data: updated,
          updated_at: updated.updatedAt,
        });
      }

      setPendingReceivedTransfer(null);
      toast.success(`🎁 Itens de ${transfer.fromCharacterName} coletados com sucesso para a sua ficha!`);
    } catch (err: any) {
      console.error('Erro ao coletar itens recebidos:', err);
      toast.error('Erro ao salvar os itens na ficha.');
    } finally {
      setIsCollectingReceivedItems(false);
    }
  };

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
  const [allPartySheets, setAllPartySheets] = useState<CharacterSheet[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });
  const [allWorldEntities, setAllWorldEntities] = useState<WorldEntity[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('codex_entities');
        if (saved) return JSON.parse(saved);
      } catch (_) {}
    }
    return [];
  });
  const [viewingSheet, setViewingSheet] = useState<CharacterSheet | null>(null);
  const [isViewingSheetOpen, setIsViewingSheetOpen] = useState(false);
  const [loadingMemberSheet, setLoadingMemberSheet] = useState<string | null>(null);

  // Carrega todas as entidades do mundo (incluindo NPCs e seus retratos) do Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const fetchEntities = async () => {
      try {
        const { data, error } = await supabase.from('world_entities').select('*');
        if (!error && data && data.length > 0) {
          const domainEntities = data.map(mapWorldEntityRowToDomain);
          setAllWorldEntities((prev) => {
            const map = new Map<string, WorldEntity>();
            prev.forEach((e) => map.set(e.id, e));
            (worldEntities || []).forEach((e) => map.set(e.id, e));
            domainEntities.forEach((e) => map.set(e.id, e));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Erro ao buscar world_entities no PlayerLobby:', err);
      }
    };

    fetchEntities();
  }, [worldEntities]);

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

  // Carrega as fichas do Supabase (do próprio jogador e de todas as campanhas autorizadas pelo RLS), mesclando com o localStorage
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    
    const fetchSheetsFromDb = async () => {
      const uId = user?.id;
      
      try {
        // Busca todas as fichas acessíveis via RLS (fichas do usuário e das mesas de jogo que ele participa)
        const { data, error } = await supabase
          .from('character_sheets')
          .select('*');
          
        if (!error && data && data.length > 0) {
          const dbSheets: CharacterSheet[] = data.map((row) => ({
            ...row.data,
            id: row.id,
            userId: row.user_id,
            campaignId: row.campaign_id,
            characterName: row.character_name || row.data?.characterName,
            updatedAt: row.updated_at,
          }));

          // Atualiza repositório compartilhado de fichas de toda a party
          setAllPartySheets((prev) => {
            const map = new Map<string, CharacterSheet>();
            prev.forEach((s) => map.set(s.id, s));
            dbSheets.forEach((s) => map.set(s.id, s));
            return Array.from(map.values());
          });

          if (uId && isValidUuid(uId)) {
            const myDbSheets = dbSheets.filter((s) => s.userId === uId);
            const myDbSheetIds = new Set(myDbSheets.map((s) => s.id));
            
            setCharacterSheets((prev) => {
              const validLocalSheets = prev.filter(
                (s) => (!isValidUuid(s.id) || myDbSheetIds.has(s.id)) && (!s.userId || s.userId === uId)
              );

              const merged = [...validLocalSheets];
              myDbSheets.forEach((dbS) => {
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
                const isDefaultMock = s.characterName === 'Novo Aventureiro' && !myDbSheets.some((dbS) => dbS.id === s.id);
                return !isDefaultMock;
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

  const handleImportNewSheet = (importedSheet: CharacterSheet) => {
    const finalSheet: CharacterSheet = {
      ...importedSheet,
      userId: user?.id || importedSheet.userId || 'player-1',
      campaignId: selectedCampaignId || activeCampaign?.id || importedSheet.campaignId,
      updatedAt: new Date().toISOString(),
    };
    setCharacterSheets((prev) => [finalSheet, ...prev.filter((s) => s.id !== finalSheet.id)]);
    setActiveSheet(finalSheet);
    setCharacterNameInput(finalSheet.characterName);
    setIsManagerModalOpen(false);
    setIsJoinImportModalOpen(false);
    toast.success(`Ficha de "${finalSheet.characterName}" importada e pronta para o jogo!`);
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

    const combatPinUrl = updatedWithTimestamp.combatImageUrl || (updatedWithTimestamp.modelUrl && !updatedWithTimestamp.modelUrl.endsWith('.glb') ? updatedWithTimestamp.modelUrl : undefined);
    const targetModelUrl = updatedWithTimestamp.modelUrl || getModelUrlByNameOrPath(updatedWithTimestamp.className || updatedWithTimestamp.characterName);
    const targetTokenType = updatedWithTimestamp.tokenType || (combatPinUrl ? 'billboard' : '3d');
    const targetAvatarUrl = updatedWithTimestamp.faceImageUrl || updatedWithTimestamp.avatarUrl;
    const targetCombatImg = combatPinUrl || (targetTokenType === 'billboard' ? targetModelUrl : undefined);

    // Atualiza combatentes locais imediatamente para refletir no grid 3D
    let hasCombatantChanges = false;
    const nextCombatants = combatants.map((c) => {
      const cClean = c.name.split('(')[0].trim().toLowerCase();
      const sheetClean = (updatedWithTimestamp.characterName || '').split('(')[0].trim().toLowerCase();
      const isMatch =
        cClean === sheetClean ||
        c.name.toLowerCase().includes(sheetClean) ||
        (updatedWithTimestamp.id && c.id.includes(updatedWithTimestamp.id));

      if (isMatch) {
        hasCombatantChanges = true;
        return {
          ...c,
          name: updatedWithTimestamp.characterName || c.name,
          modelUrl: targetModelUrl,
          tokenType: targetTokenType,
          tokenImageUrl: targetTokenType === 'billboard' ? targetCombatImg : undefined,
          combatImageUrl: targetCombatImg,
          avatarUrl: targetAvatarUrl,
        };
      }
      return c;
    });

    if (hasCombatantChanges) {
      setCombatants(nextCombatants);
      if (broadcastCombatUpdate) {
        broadcastCombatUpdate({ combatants: nextCombatants });
      }
      if (initializeFromCombatants) {
        initializeFromCombatants(nextCombatants);
      }
    }

    // Sincroniza a ficha com o banco de dados Supabase para acesso do Mestre e de outros usuários
    if (isSupabaseConfigured() && user?.id && isValidUuid(user.id)) {
      const isOwner = !updatedWithTimestamp.userId || updatedWithTimestamp.userId === user.id;
      const isDm = activeCampaign?.role === 'dm' || activeCampaign?.dmId === user.id;

      if (isOwner || isDm) {
        const uId = isOwner 
          ? user.id 
          : (updatedWithTimestamp.userId && isValidUuid(updatedWithTimestamp.userId) ? updatedWithTimestamp.userId : user.id);
        const cId = (updatedWithTimestamp.campaignId && isValidUuid(updatedWithTimestamp.campaignId)) 
          ? updatedWithTimestamp.campaignId 
          : (activeCampaign?.id && isValidUuid(activeCampaign.id) ? activeCampaign.id : null);
        const sheetId = (updatedWithTimestamp.id && isValidUuid(updatedWithTimestamp.id)) 
          ? updatedWithTimestamp.id 
          : generateUuid();
        updatedWithTimestamp.id = sheetId;
        
        supabase.from('character_sheets').upsert({
          id: sheetId,
          user_id: uId,
          campaign_id: cId,
          character_name: updatedWithTimestamp.characterName || 'Sem Nome',
          data: updatedWithTimestamp,
          updated_at: updatedWithTimestamp.updatedAt,
        }).then(({ error }) => {
          if (error) {
            console.warn('Aviso na sincronização de ficha com Supabase:', error.message || error);
          } else {
            console.log('Ficha sincronizada com o Supabase.');
          }
        });

        if (cId) {
           supabase.from('campaign_members').update({
             character_name: updatedWithTimestamp.characterName || 'Sem Nome',
             avatar_url: targetAvatarUrl || null,
             model_url: targetCombatImg || targetModelUrl || null,
             token_type: targetTokenType,
           })
           .eq('campaign_id', cId)
           .ilike('character_name', updatedWithTimestamp.characterName || 'Sem Nome')
           .then(({ error }) => {
             if (error) {
               console.warn('Aviso na sincronização com campaign_members:', error.message || error);
             } else {
               console.log('Preferência de token salva com sucesso em campaign_members.');
             }
           });
        }
      }
    }

    // Sincroniza modelUrl no Supabase e no codex_members para que o DM veja o modelo correto
    try {
      const targetCampId = updatedWithTimestamp.campaignId || activeCampaign?.id || '';
      updateCampaignMemberModelUrl(targetCampId, updatedWithTimestamp.characterName, targetCombatImg || targetModelUrl);

      const memsStr = localStorage.getItem('codex_members');
      if (memsStr) {
        const mems: any[] = JSON.parse(memsStr);
        let changed = false;
        const updatedMems = mems.map((m) => {
          if (
            m.characterName &&
            m.characterName.toLowerCase() === updatedWithTimestamp.characterName.toLowerCase()
          ) {
            if (m.modelUrl !== (targetCombatImg || targetModelUrl) || m.tokenType !== targetTokenType || m.avatarUrl !== targetAvatarUrl) {
              changed = true;
              return { 
                ...m, 
                modelUrl: targetCombatImg || targetModelUrl,
                tokenType: targetTokenType,
                avatarUrl: targetAvatarUrl,
                combatImageUrl: targetCombatImg,
              };
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
      const { characterName, item, items, currency } = customEvent.detail || {};
      if (!characterName) return;
      
      const normCharName = characterName.trim().toLowerCase();
      const sheet = characterSheetsRef.current.find(
        (s) => s.characterName && s.characterName.trim().toLowerCase() === normCharName
      );
      
      if (sheet) {
        const updated = { ...sheet };
        const incomingList: any[] = [];
        if (Array.isArray(items) && items.length > 0) {
          incomingList.push(...items);
        } else if (item) {
          incomingList.push(item);
        }

        if (incomingList.length > 0) {
          const currentEq = [...(updated.equipment || updated.items || [])];
          for (const inc of incomingList) {
            const existingIds = new Set(currentEq.map((e) => e.id));
            let safeId = inc.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            if (existingIds.has(safeId)) {
              safeId = `${safeId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            }
            const itemWithUniqueId = { ...inc, id: safeId, equipped: false };
            currentEq.push(itemWithUniqueId);

            // Se for arma, adiciona à lista de ataques caso ainda não conste
            if (inc.itemType === 'weapon' || inc.weaponProps) {
              const currentAttacks = updated.attacks || [];
              if (!currentAttacks.some((atk) => (atk.name || '').trim().toLowerCase() === (inc.name || '').trim().toLowerCase())) {
                updated.attacks = [
                  ...currentAttacks,
                  {
                    id: `atk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    name: inc.name,
                    atkBonus: inc.weaponProps?.atkBonus ? `+${inc.weaponProps.atkBonus}` : '+2',
                    damage: inc.weaponProps?.damage || '1d6',
                    type: inc.weaponProps?.damageType || 'Cortante',
                  },
                ];
              }
            }
          }
          updated.equipment = currentEq;
          updated.items = currentEq;
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
          (['po', 'pp', 'pc', 'pe', 'pl'] as const).forEach((type) => {
            const amount = currency[type];
            if (amount && amount > 0) {
              newEntries.push({
                id: `${Date.now()}-${type}`,
                type: 'loot',
                amount,
                coinType: type,
                reason: 'Recompensa de Loot / Transferência',
                date: nowStr,
              });
            }
          });
          if (newEntries.length > 0) {
            updated.transactionHistory = [...newEntries, ...(updated.transactionHistory || [])];
          }
        }
        updated.updatedAt = new Date().toISOString();
        handleSaveSheetRef.current(updated);
      }
    };

    window.addEventListener('masters_codex_loot_received', handleLootReceived);
    window.addEventListener('masters_codex_sheets_updated', handleLootReceived);
    return () => {
      window.removeEventListener('masters_codex_loot_received', handleLootReceived);
      window.removeEventListener('masters_codex_sheets_updated', handleLootReceived);
    };
  }, []);

  // Escuta atualizações de modelo/pino de combate de personagens para sincronizar o grid 3D e a ficha ativa imediatamente
  useEffect(() => {
    const handleModelUpdate = (sheet: any) => {
      if (!sheet || !sheet.characterName) return;

      const combatPinUrl = sheet.combatImageUrl || (sheet.modelUrl && !sheet.modelUrl.endsWith('.glb') ? sheet.modelUrl : undefined);
      const updatedModelUrl = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className || sheet.characterName);
      const updatedTokenType: 'billboard' | '3d' = sheet.tokenType || (combatPinUrl ? 'billboard' : '3d');
      const updatedAvatarUrl: string | undefined = sheet.faceImageUrl || sheet.avatarUrl;
      const updatedCombatImg: string | undefined = combatPinUrl || (updatedTokenType === 'billboard' ? updatedModelUrl : undefined);

      let hasChanges = false;
      const nextCombatants = combatants.map((c) => {
        const cClean = c.name.split('(')[0].trim().toLowerCase();
        const sheetClean = (sheet.characterName || '').split('(')[0].trim().toLowerCase();
        const isMatch =
          cClean === sheetClean ||
          c.name.toLowerCase().includes(sheetClean) ||
          sheet.characterName?.toLowerCase().includes(cClean) ||
          (sheet.id && c.id.includes(sheet.id));

        if (isMatch) {
          if (
            c.modelUrl !== updatedModelUrl ||
            c.tokenType !== updatedTokenType ||
            c.tokenImageUrl !== updatedCombatImg ||
            c.combatImageUrl !== combatPinUrl ||
            c.avatarUrl !== updatedAvatarUrl
          ) {
            hasChanges = true;
            return {
              ...c,
              modelUrl: updatedModelUrl,
              tokenType: updatedTokenType,
              tokenImageUrl: updatedTokenType === 'billboard' ? updatedCombatImg : undefined,
              combatImageUrl: combatPinUrl || updatedCombatImg,
              avatarUrl: updatedAvatarUrl,
            };
          }
        }
        return c;
      });

      if (hasChanges) {
        setCombatants(nextCombatants);
        if (initializeFromCombatants) {
          initializeFromCombatants(nextCombatants);
        }
      }

      // Atualiza activeSheet se corresponder
      setActiveSheet((prev) => {
        if (!prev) return prev;
        if (
          prev.id === sheet.id ||
          prev.characterName.toLowerCase() === sheet.characterName.toLowerCase()
        ) {
          return {
            ...prev,
            ...sheet,
            faceImageUrl: updatedAvatarUrl,
            combatImageUrl: combatPinUrl,
            avatarUrl: updatedAvatarUrl,
            modelUrl: updatedModelUrl,
            tokenType: updatedTokenType,
          };
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
  }, [setCombatants, initializeFromCombatants, setActiveSheet]);

  // Sincronização direta com Supabase Realtime para manter as fichas atualizadas ao vivo quando o Mestre ou outro jogador alterar dados no banco
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channelId = `player_lobby_sheets_all_${user?.id || 'anon'}_${Math.random().toString(36).substring(2, 7)}`;
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
            const remoteData = {
              ...row.data,
              id: row.id,
              userId: row.user_id,
              campaignId: row.campaign_id,
              characterName: row.character_name || row.data?.characterName,
              updatedAt: row.updated_at,
            } as CharacterSheet;

            if (remoteData) {
              setAllPartySheets((prev) => {
                const idx = prev.findIndex((s) => s.id === remoteData.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = { ...prev[idx], ...remoteData };
                  return next;
                }
                return [remoteData, ...prev];
              });

              if (user?.id && remoteData.userId === user.id) {
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
  const [copiedCampaignCode, setCopiedCampaignCode] = useState<string | null>(null);

  const handleOpenJoinModal = () => {
    setInviteCodeInput('');
    setJoinSuccessMsg(null);
    setJoinErrorMsg(null);
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

  // Helper para extrair o retrato com máxima prioridade (portraitUrl -> faceImageUrl -> avatarUrl -> images[0] -> combatImageUrl)
  const extractCharacterFaceImage = (sheet?: CharacterSheet | null, fallbackAvatar?: string | null): string | null => {
    if (!sheet) return fallbackAvatar || null;
    if (sheet.portraitUrl) return sheet.portraitUrl;
    if (sheet.faceImageUrl) return sheet.faceImageUrl;
    if (sheet.avatarUrl) return sheet.avatarUrl;
    if (Array.isArray(sheet.images) && sheet.images.length > 0) return sheet.images[0];
    if (sheet.combatImageUrl) return sheet.combatImageUrl;
    return fallbackAvatar || null;
  };

  // Helper para resolver os dados visuais completos do card da campanha (Mestre Google, Personagens, Rostos e Classes)
  const resolveCampaignCardData = (camp: UserCampaign) => {
    // 1. Resolve o nome do Mestre (obtido do perfil Google ou da campanha)
    let dmName = 'Mestre da Mesa';
    let dmAvatarUrl: string | null = null;

    if (camp.role === 'dm' || camp.dmId === user?.id) {
      dmName = user?.displayName || user?.email?.split('@')[0] || 'Mestre';
      dmAvatarUrl = user?.avatarUrl || null;
    } else if ((camp as any).dmName) {
      dmName = (camp as any).dmName;
      dmAvatarUrl = (camp as any).dmAvatarUrl || null;
    } else {
      const dmMember = campaignMembers.find((m: any) => m.campaignId === camp.id && m.role === 'dm') as any;
      if (dmMember?.displayName || dmMember?.characterName) {
        dmName = dmMember.displayName || dmMember.characterName;
        dmAvatarUrl = dmMember.avatarUrl || null;
      } else if (user?.displayName) {
        dmName = user.displayName;
        dmAvatarUrl = user.avatarUrl || null;
      } else {
        dmName = 'Mestre da Mesa';
      }
    }

    // 2. Resolve a lista de Aventureiros com Ficha, Rosto e Nome do Jogador
    const adventurers: Array<{
      id: string;
      playerName: string;
      characterName: string;
      className: string;
      level: number;
      faceImageUrl: string | null;
      isCurrentUser: boolean;
    }> = [];

    // 2.1 Personagem do próprio jogador ativo
    const linkedSheet = camp.id ? (characterSheets.find((s) => s.campaignId === camp.id) || allPartySheets.find((s) => s.campaignId === camp.id && s.userId === user?.id)) : null;
    const mySheet =
      linkedSheet ||
      (camp.characterName
        ? (characterSheets.find((s) => s.characterName && s.characterName.toLowerCase() === camp.characterName?.toLowerCase()) ||
           allPartySheets.find((s) => s.characterName && s.characterName.toLowerCase() === camp.characterName?.toLowerCase() && s.userId === user?.id))
        : null) ||
      (camp.partyMembers && camp.partyMembers.length > 0
        ? (characterSheets.find((s) => camp.partyMembers?.some((p) => p.name && s.characterName && p.name.toLowerCase() === s.characterName.toLowerCase())) ||
           allPartySheets.find((s) => camp.partyMembers?.some((p) => p.name && s.characterName && p.name.toLowerCase() === s.characterName.toLowerCase() && s.userId === user?.id)))
        : null) ||
      (characterSheets.length > 0
        ? characterSheets.find((s) => s.characterName && s.characterName !== 'Novo Aventureiro' && !s.characterName.startsWith('Aventureiro ')) || characterSheets[0]
        : null);

    const myCharName = mySheet?.characterName || camp.characterName || resolveCharName(camp);
    const myPlayerName = mySheet?.playerName || user?.displayName?.split(' ')[0] || user?.displayName || 'Você';
    const myClass = mySheet?.className || 'Aventureiro';
    const myLevel = mySheet?.level || 1;
    const myFace = extractCharacterFaceImage(mySheet, null);

    adventurers.push({
      id: mySheet?.id || `my-char-${camp.id}`,
      playerName: myPlayerName,
      characterName: myCharName,
      className: myClass,
      level: myLevel,
      faceImageUrl: myFace,
      isCurrentUser: true,
    });

    // 2.2 Outros membros da party registrados na campanha
    if (camp.partyMembers && camp.partyMembers.length > 0) {
      camp.partyMembers.forEach((pm, idx) => {
        if (pm.name && pm.name.toLowerCase() === myCharName.toLowerCase()) return;

        // Tenta encontrar entidade correspondente em allWorldEntities ou worldEntities (para NPCs com retrato selecionado)
        const combinedEntities = [...allWorldEntities, ...(worldEntities || [])];
        const normPm = (pm.name || '').trim().toLowerCase();
        const basePm = normPm.split('"')[0].split('(')[0].trim();

        const matchingNpcEntity =
          combinedEntities.find((e) => e.id === pm.id) ||
          combinedEntities.find((e) => {
            const eName = (e.name || '').trim().toLowerCase();
            const baseEName = eName.split('"')[0].split('(')[0].trim();
            return (
              eName === normPm ||
              (basePm && baseEName && (basePm === baseEName || basePm.includes(baseEName) || baseEName.includes(basePm))) ||
              (normPm && eName && (normPm.includes(eName) || eName.includes(normPm)))
            );
          });

        // Tenta encontrar ficha correspondente em allPartySheets ou characterSheets
        const matchingSavedSheet =
          allPartySheets.find((s) => s.id === pm.id) ||
          allPartySheets.find(
            (s) =>
              s.campaignId === camp.id &&
              s.characterName &&
              pm.name &&
              s.characterName.trim().toLowerCase() === pm.name.trim().toLowerCase()
          ) ||
          allPartySheets.find(
            (s) =>
              s.characterName &&
              pm.name &&
              s.characterName.trim().toLowerCase() === pm.name.trim().toLowerCase()
          ) ||
          characterSheets.find(
            (s) =>
              s.characterName &&
              pm.name &&
              s.characterName.trim().toLowerCase() === pm.name.trim().toLowerCase()
          );

        const npcPortrait = matchingNpcEntity ? getEntityPortraitUrl(matchingNpcEntity) : null;
        const pmFace = npcPortrait || extractCharacterFaceImage(matchingSavedSheet, pm.avatarUrl);

        const pmPlayerName =
          matchingSavedSheet?.playerName ||
          (pm as any).playerName ||
          (pm.type === 'npc' || matchingNpcEntity ? pm.name.split(' ')[0] : pm.name.split(' ')[0]) ||
          `Aliado ${idx + 1}`;

        const pmCharName = matchingNpcEntity?.name || matchingSavedSheet?.characterName || pm.name || 'Aventureiro';
        const pmClass =
          matchingSavedSheet?.className ||
          (pm as any).className ||
          matchingNpcEntity?.subType ||
          (matchingNpcEntity?.attributes as any)?.dndClass ||
          (pm.type === 'npc' ? 'Guerreira' : 'Aventureiro');
        const pmLevel =
          matchingSavedSheet?.level ||
          (pm as any).level ||
          (matchingNpcEntity?.attributes as any)?.level ||
          1;

        adventurers.push({
          id: pm.id || `pm-${idx}`,
          playerName: pmPlayerName,
          characterName: pmCharName,
          className: pmClass,
          level: pmLevel,
          faceImageUrl: pmFace,
          isCurrentUser: false,
        });
      });
    }

    return {
      dmName,
      dmAvatarUrl,
      adventurers,
      myAdventurer: adventurers[0],
    };
  };

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
      selectedCampaignId ? 'p-2 sm:p-3 overflow-hidden h-full min-h-0' : 'p-3 sm:p-5 lg:p-6 h-full min-h-0 overflow-y-auto custom-scrollbar'
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Selecione o Personagem para esta Mesa:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsJoinImportModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/40 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                    title="Importar ficha pronta do D&D Beyond"
                  >
                    <Download className="w-3 h-3 text-cyan-400" />
                    <span>Importar D&D Beyond</span>
                  </button>
                </div>

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
        <div className="flex flex-col space-y-2.5 sm:space-y-3 pb-4">
          {/* Header Banner with Fantasy Art - Compact Height for Tablet Visibility */}
          <div className="relative overflow-hidden rounded-2xl shadow-xl border border-amber-500/30 px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3 group shrink-0">
            {/* Background Image & Atmospheric Gradients */}
            <div className="absolute inset-0 z-0">
              <img
                src="/assets/player-hub-banner.jpg"
                alt="Mesa de RPG e Aventureiros"
                className="w-full h-full object-cover object-[center_35%] scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07090e] via-[#0a0d14]/90 via-40% to-[#0a0d14]/40 to-90%" />
              <div className="absolute inset-0 ring-1 ring-inset ring-amber-500/25 rounded-2xl pointer-events-none" />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 flex items-center gap-3 max-w-xl">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 backdrop-blur-md shrink-0">
                <Shield className="w-5 h-5 drop-shadow-md" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.2 rounded shadow-sm backdrop-blur-sm">
                    MODO JOGADOR
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
                    D&D 5e • Diário & Cockpit
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight drop-shadow-md leading-tight mt-0.5">
                  Minhas Campanhas & Mesas de Jogo
                </h2>
                <p className="text-[11px] text-slate-300/90 font-medium drop-shadow leading-tight hidden md:block">
                  Selecione um card para acessar o Diário de Bordo e o Feed da Aventura, ou conecte-se via código.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsManagerModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#101522]/90 hover:bg-[#182032] border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-black/40 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Minhas Fichas ({characterSheets.length})</span>
              </button>

              <button
                onClick={handleOpenJoinModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-1.5 rounded-lg text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Entrar em Mesa</span>
              </button>
            </div>
          </div>

          {/* Cards Grid Header */}
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-amber-400" /> Suas Campanhas Ativas ({playerCampaigns.length})
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
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeira Campanha</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {playerCampaigns.map((camp) => {
                const isActive = activeCampaign?.id === camp.id;
                const cardData = resolveCampaignCardData(camp);
                const coverUrl = camp.coverImageUrl ? normalizeImageUrl(camp.coverImageUrl) : null;
                const isCopied = copiedCampaignCode === camp.id;

                return (
                  <div
                    key={camp.id}
                    onClick={() => handleSelectCampaign(camp)}
                    className={`group relative rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden shadow-lg hover:-translate-y-0.5 ${
                      isActive
                        ? 'bg-gradient-to-b from-[#1c2438] to-[#10141f] border-amber-500/70 shadow-amber-500/10 ring-1 ring-amber-500/30'
                        : 'bg-[#141a27] border-[#253046] hover:border-amber-500/50 hover:bg-[#182030]'
                    }`}
                  >
                    {/* 1. Capa / Banner da Campanha */}
                    <div className="w-full h-24 sm:h-28 relative overflow-hidden bg-[#0a0d14] border-b border-[#253046]/80 shrink-0">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={camp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#162032] via-[#0d131f] to-[#080b12] flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
                          <Compass className="w-10 h-10 text-amber-500/30 group-hover:text-amber-500/50 group-hover:scale-110 transition-all duration-500" />
                        </div>
                      )}

                      {/* Gradiente escuro inferior para transição suave com o corpo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141a27] via-transparent to-black/40" />

                      {/* Badges superiores na capa */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1 pointer-events-auto">
                          <span className="text-[8px] font-mono font-bold text-amber-300 uppercase tracking-wider bg-black/70 backdrop-blur-md border border-amber-500/40 px-1.5 py-0.2 rounded shadow">
                            MESA DE JOGO
                          </span>
                          {camp.themeTone && (
                            <span className="text-[8px] font-mono font-medium text-slate-300 bg-black/60 backdrop-blur-md border border-slate-600/40 px-1 py-0.2 rounded">
                              {camp.themeTone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 pointer-events-auto">
                          {isActive && (
                            <span className="text-[8px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-mono shadow-md flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 inline-block animate-ping" />
                              ATIVA
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLeaveCampaign(camp);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 bg-black/60 hover:bg-rose-950/60 border border-slate-700/50 hover:border-rose-500/50 rounded-lg backdrop-blur-md transition-all cursor-pointer"
                            title="Sair desta Campanha"
                          >
                            <LogOut className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Código da mesa na capa (canto inferior direito) */}
                      <div className="absolute bottom-1.5 right-2 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(camp.inviteCode);
                            setCopiedCampaignCode(camp.id);
                            setTimeout(() => setCopiedCampaignCode(null), 2000);
                            toast.success(`Código ${camp.inviteCode} copiado!`);
                          }}
                          className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-black/80 hover:bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded shadow backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                          title="Copiar Código de Convite da Mesa"
                        >
                          <span>{camp.inviteCode}</span>
                          {isCopied ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400 hover:text-amber-300" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 2. Conteúdo do Card */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div className="space-y-1">
                        {/* Título da Campanha */}
                        <h4 className="text-sm sm:text-base font-black text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1 leading-tight">
                          {camp.title}
                        </h4>

                        {/* Sinopse da Campanha */}
                        {camp.description ? (
                          <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                            {camp.description}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            Sem sinopse fornecida pelo Mestre.
                          </p>
                        )}
                      </div>

                      {/* 3. Seção de Informações da Mesa: Mestre & Aventureiros */}
                      <div className="pt-2 border-t border-[#253046] space-y-2">
                        {/* Mestre da Mesa (Google Account Name) */}
                        <div className="flex items-center justify-between bg-[#0a0d14]/80 border border-amber-500/20 px-2.5 py-1.5 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0">
                              <Crown className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Dungeon Master:</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {cardData.dmAvatarUrl && (
                              <img
                                src={normalizeImageUrl(cardData.dmAvatarUrl)}
                                alt={cardData.dmName}
                                className="w-4 h-4 rounded-full object-cover border border-amber-400/60 shadow-sm shrink-0"
                              />
                            )}
                            <span className="font-bold text-amber-300 text-[11px]">
                              {cardData.dmName}
                            </span>
                          </div>
                        </div>

                        {/* Aventureiros da Mesa (Galeria Compacta com Rosto, Nome do Jogador, Personagem e Classe) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 font-mono">
                              <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>Aventureiros Conectados ({cardData.adventurers.length}):</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            {cardData.adventurers.map((adv) => (
                              <div
                                key={adv.id}
                                className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all duration-200 ${
                                  adv.isCurrentUser
                                    ? 'bg-gradient-to-r from-cyan-950/40 to-[#0a0d14] border-cyan-500/50 shadow-sm'
                                    : 'bg-[#0a0d14]/70 border-[#253046] hover:border-slate-500'
                                }`}
                              >
                                {/* Imagem do Rosto do Personagem */}
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-cyan-400/60 shadow-sm flex items-center justify-center shrink-0 relative">
                                  {adv.faceImageUrl ? (
                                    <img
                                      src={normalizeImageUrl(adv.faceImageUrl)}
                                      alt={adv.characterName}
                                      className="w-full h-full object-cover object-[center_18%]"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#162032] to-[#0d131f] flex items-center justify-center text-xs font-black text-cyan-300">
                                      {adv.characterName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {adv.isCurrentUser && (
                                    <span className="absolute bottom-0 inset-x-0 bg-cyan-600/90 text-slate-950 text-[7px] font-black uppercase py-0.2 text-center tracking-tighter shadow">
                                      VOCÊ
                                    </span>
                                  )}
                                </div>

                                {/* Coluna com Informações do Jogador / Personagem */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                  {/* Nome do Jogador */}
                                  <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider truncate leading-none">
                                    {adv.playerName}
                                  </span>

                                  {/* Nome do Personagem */}
                                  <strong className="text-[11px] font-bold text-slate-100 truncate leading-tight mt-0.5">
                                    {adv.characterName}
                                  </strong>

                                  {/* Classe e Nível */}
                                  <span className="text-[8px] font-mono text-cyan-300 truncate leading-none mt-0.5">
                                    {adv.className} {adv.level ? `Nvl ${adv.level}` : ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4. Ação Principal */}
                      <div className="pt-2 pb-0.5 border-t border-[#253046] flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                          {isActive ? 'Mesa Ativa Conectada' : 'Acessar Central'}
                        </span>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          <span className="text-[11px]">Acessar Feed & Diário</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                        </div>
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
          {/* TOP HEADER UNIFICADO (BARRA SUPERIOR ERGONÔMICA 48px) */}
          <div className="h-12 min-h-[48px] flex items-center justify-between gap-2 sm:gap-3 bg-[#0f141f]/95 backdrop-blur-md border border-[#2a3449] px-2.5 sm:px-3 rounded-xl sm:rounded-2xl shadow-lg shrink-0 select-none">
            {/* ESQUERDA: NAVEGAÇÃO, CONTEXTO DA MESA & CALENDÁRIO */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                onClick={handleBackToHub}
                className="flex items-center justify-center bg-[#0a0d14] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 text-slate-300 hover:text-amber-400 font-bold p-1.5 rounded-lg transition-all shadow-sm cursor-pointer shrink-0"
                title="Voltar para Minhas Campanhas"
                aria-label="Voltar para Minhas Campanhas"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="h-5 w-[1px] bg-[#2a3449]/70 shrink-0" />

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="hidden xl:inline-block text-[8px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded shrink-0">
                  COCKPIT
                </span>
                <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[110px] sm:max-w-[180px] lg:max-w-[240px] leading-tight" title={currentCampaign?.title}>
                  {currentCampaign?.title || 'Campanha Ativa'}
                </h2>
                {currentCampaign?.inviteCode && (
                  <button
                    onClick={() => handleCopyInviteCode(currentCampaign.inviteCode)}
                    className="hidden sm:flex items-center gap-1 text-[10px] font-mono font-bold text-slate-300 bg-[#0a0d14] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 px-1.5 py-0.5 rounded transition-all shrink-0 cursor-pointer"
                    title="Clique para copiar código de convite da mesa"
                  >
                    <span className="text-amber-400">{currentCampaign.inviteCode}</span>
                    {copiedInvite ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-400" />}
                  </button>
                )}
              </div>

              {/* Campaign In-Game Calendar Widget (Compact Player Perspective) */}
              <div className="hidden lg:flex items-center pl-1 border-l border-[#2a3449]/60 shrink-0">
                <LiveCalendarWidget />
              </div>
            </div>

            {/* CENTRO: CONTROLES DE PROJEÇÃO / VISUALIZAÇÃO EM SEGMENTED CONTROL */}
            {(() => {
              const resolvedView = playerCanvasView === 'auto' ? (liveDisplayMode === 'artwork' ? 'art' : liveDisplayMode) : playerCanvasView;
              const isArt = resolvedView === 'art';
              const isMap = resolvedView === 'map';
              const isGrid = resolvedView === 'grid' || resolvedView === 'combat';
              return (
                <div className="flex items-center gap-1 bg-[#090d14] p-1 rounded-xl border border-[#2a3449] shadow-inner shrink-0">
                  {/* Botão Auto (Seguir Mestre) */}
                  <button
                    onClick={() => setPlayerCanvasView('auto')}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'auto'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-cyan-400/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Seguir visualização projetada pelo Mestre automaticamente"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${playerCanvasView === 'auto' ? 'animate-pulse text-amber-300' : ''}`} />
                    <span className="hidden sm:inline">Auto</span>
                  </button>

                  <div className="h-3.5 w-[1px] bg-[#2a3449]/60" />

                  {/* Botão Ilustração */}
                  <button
                    onClick={() => setPlayerCanvasView('art')}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'art'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : isArt && playerCanvasView === 'auto'
                        ? 'border border-amber-500/50 text-amber-400 bg-amber-950/40 hover:bg-[#161f30]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Modo Ilustração / Arte da Cena"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Ilustração</span>
                  </button>

                  {/* Botão Dungeon Map */}
                  <button
                    onClick={() => setPlayerCanvasView('map')}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'map'
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20 font-black'
                        : isMap && playerCanvasView === 'auto'
                        ? 'border border-indigo-500/50 text-indigo-400 bg-indigo-950/40 hover:bg-[#161f30]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Modo Dungeon Map 2D"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Mapa</span>
                  </button>

                  {/* Botão Grid 3D / Combate */}
                  <button
                    onClick={() => setPlayerCanvasView('grid')}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${
                      playerCanvasView === 'grid'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black'
                        : isGrid && playerCanvasView === 'auto'
                        ? 'border border-rose-500/50 text-rose-400 bg-rose-950/40 hover:bg-[#161f30]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#161f30]'
                    }`}
                    title="Modo Grid 3D / Combate"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Grid 3D</span>
                  </button>
                </div>
              );
            })()}

            {/* DIREITA: FERRAMENTAS DO JOGADOR, PRESENÇA & AÇÕES */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden sm:block">
                <PresenceIndicator users={onlineUsers} className="border-r border-[#2a3449] pr-2" />
              </div>

              {/* Chamada de Voz (Voice Call) no Player Lobby */}
              {isInCall ? (
                <div className="flex items-center gap-1 bg-[#121824] border border-emerald-500/40 rounded-lg p-0.5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsWidgetOpen((prev: boolean) => !prev)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/10 transition-all cursor-pointer"
                    title="Abrir Painel da Chamada de Voz"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="hidden md:inline">Na Call</span>
                    <span className="font-mono text-[9px] text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded">
                      {participants.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`p-1 rounded-md text-xs transition-all ${
                      isMuted
                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                        : isSpeaking
                        ? 'bg-emerald-500/20 text-emerald-300 animate-pulse'
                        : 'text-slate-300 hover:text-white hover:bg-[#1f2738]'
                    }`}
                    title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
                  >
                    {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => joinCall()}
                  disabled={isConnecting}
                  className="flex items-center gap-1.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-emerald-400 border border-[#2a3449] hover:border-emerald-500/50 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  title="Conectar à Chamada de Voz da Mesa"
                >
                  <PhoneCall className={`w-3.5 h-3.5 text-emerald-400 ${isConnecting ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">{isConnecting ? 'Conectando...' : 'Call'}</span>
                </button>
              )}

              {/* Safety Tools (X-Card) */}
              <XCardButton
                campaignId={currentCampaign?.id}
                playerName={resolveCharName(currentCampaign)}
                safetySettings={currentCampaign?.safetySettings}
                onSendAlert={(alert) => broadcastXCardAlert({ alert })}
              />

              {/* Crônicas da Campanha */}
              <button
                onClick={() => setShowCampaignFeedModal(true)}
                className="relative flex items-center gap-1 bg-[#141a27] hover:bg-[#1e2638] border border-amber-500/40 text-amber-300 font-bold px-2 sm:px-2.5 py-1 rounded-lg text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Abrir Crônicas e Feed da Campanha"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Crônicas</span>

                {/* Ping Cromático de Notificação */}
                {chronicleNotifications.hasUnread && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      chronicleNotifications.latestUnreadType === 'npc' ? 'bg-cyan-400' :
                      chronicleNotifications.latestUnreadType === 'battle' ? 'bg-rose-500' :
                      chronicleNotifications.latestUnreadType === 'lore' ? 'bg-purple-500' : 'bg-amber-400'
                    }`}></span>
                    <span className={`relative inline-flex items-center justify-center rounded-full h-3 w-3 border-2 border-[#0f1420] text-[7px] font-black text-slate-950 ${
                      chronicleNotifications.latestUnreadType === 'npc' ? 'bg-cyan-400 shadow-sm shadow-cyan-500/50' :
                      chronicleNotifications.latestUnreadType === 'battle' ? 'bg-rose-500 shadow-sm shadow-rose-500/50' :
                      chronicleNotifications.latestUnreadType === 'lore' ? 'bg-purple-400 shadow-sm shadow-purple-500/50' : 'bg-amber-400 shadow-sm shadow-amber-500/50'
                    }`}>
                      {chronicleNotifications.unreadCounts.total > 1 ? chronicleNotifications.unreadCounts.total : ''}
                    </span>
                  </span>
                )}
              </button>

              {/* Modo TV Projeção */}
              <button
                onClick={onOpenPlayerView}
                className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-bold px-2 sm:px-2.5 py-1 rounded-lg text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Abrir Modo TV / Projeção Secundária"
              >
                <Tv className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Modo TV</span>
              </button>

              {/* Sair da Campanha */}
              {currentCampaign && (
                <button
                  onClick={() => handleLeaveCampaign(currentCampaign)}
                  className="p-1 sm:p-1.5 bg-[#0a0d14] hover:bg-rose-950/40 border border-[#2a3449] hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                  title="Sair desta Campanha"
                >
                  <LogOut className="w-3.5 h-3.5" />
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
                          videoGridConfig={currentScene?.videoGridConfig || currentScene?.environmentSettings?.video_grid_config}
                          initialBuildingBlocks={currentScene?.buildingBlocks || currentScene?.environmentSettings?.building_blocks_3d || []}
                          initialGridConfig={currentScene?.gridConfig3D || currentScene?.environmentSettings?.grid_config_3d}
                          initialTokenElevations={currentScene?.tokenElevations || currentScene?.environmentSettings?.token_elevations}
                          interactive={true}
                          userRole="player"
                          isPaused={activeView !== 'grid' && activeView !== 'combat'}
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
                            triggerKey={`${rawUrl}-${resolved?.activeImageIndex ?? 0}`}
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
                  className="absolute top-3 right-3 z-30 flex items-center gap-2 px-3.5 py-2 bg-[#0d121f]/95 hover:bg-[#161f30] border border-amber-500/50 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-xl shadow-2xl backdrop-blur-md transition-all active:scale-95 animate-fade-in cursor-pointer group ring-1 ring-amber-500/30"
                  title="Expandir Painel do Herói & Chat"
                >
                  <PanelRightOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-slate-100">Herói & Chat</span>
                  {chatMessages.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/30 text-cyan-300 text-[10px] font-mono border border-cyan-500/40">
                      {chatMessages.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* RIGHT SIDEBAR INTEGRADA (INICIATIVA / LOG / CHAT + DOCK DE AÇÕES) */}
            {!isSidebarCollapsed && (
              <div className="w-80 lg:w-96 bg-[#141a26] border border-[#2a3449] rounded-xl sm:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl shrink-0 transition-all duration-300 animate-fade-in">
                {/* 1. TOP PRIORITY: PLAYER TOKEN ACTION DOCK (Hero Controls & Actions) */}
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

                {/* 2. MIDDLE HEADER: TABS NAVIGATION (Chat, Log, Grupo) & Collapse Button */}
                <div className="flex items-center justify-between border-b border-[#2a3449] bg-[#0c1018] p-1.5 gap-1 shrink-0">
                  <div className="flex items-center gap-1 flex-1">
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
                      onClick={() => setSidebarTab('init')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                        sidebarTab === 'init'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Grupo ({campaignMembers.length})</span>
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

                {/* 3. SCROLLABLE LOWER SECTION: TAB CONTENT (Live Chat / Combat Logs / Party Members) */}
                <div className="flex-1 overflow-y-auto">
                  {sidebarTab === 'init' ? (
                    <div className="p-3 space-y-4">
                      {/* Widget: Integrantes do Grupo */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-[#2a3449]">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" /> Integrantes do Grupo
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Botão Direito p/ Ações
                          </span>
                        </div>

                        {campaignMembers.map((member) => {
                          const isMe = member.characterName?.toLowerCase() === currentCampaign?.characterName?.toLowerCase();
                          const initials = (member.characterName || '?').slice(0, 2).toUpperCase();
                          const isDM = member.role === 'dm';
                          return (
                            <div
                              key={member.id}
                              onContextMenu={(e) => handleMemberContextMenu(e, member)}
                              className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all select-none cursor-pointer group ${
                                isMe 
                                  ? 'bg-cyan-950/30 border-cyan-500/40' 
                                  : isDM 
                                  ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50' 
                                  : 'bg-[#0a0d14] border-[#2a3449] hover:border-amber-500/40 hover:bg-[#0f1422]'
                              }`}
                              title={isMe ? 'Seu personagem' : 'Clique com o botão direito para Enviar Item ou Ver Ficha'}
                            >
                              <div className="flex items-center gap-2">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.characterName} className="w-7 h-7 rounded-lg object-cover border border-[#2a3449] group-hover:border-amber-500/40 transition-colors" />
                                ) : (
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border ${isDM ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                                    {initials}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-bold text-slate-200 leading-tight group-hover:text-amber-300 transition-colors">
                                    {member.characterName || 'Aventureiro'}
                                    {isMe && <span className="ml-1 text-[8px] bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 px-1 rounded font-mono">VOCÊ</span>}
                                  </p>
                                  <p className="text-[8px] font-mono text-slate-500 uppercase">
                                    {isDM ? '🎲 Dungeon Master' : '⚔️ Jogador'}
                                  </p>
                                </div>
                              </div>

                              {!isMe && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartItemTransfer({
                                        id: member.id,
                                        userId: member.userId,
                                        characterName: member.characterName,
                                        avatarUrl: member.avatarUrl,
                                        role: member.role,
                                      });
                                    }}
                                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                    title="Enviar Item para este jogador"
                                  >
                                    <Package className="w-3 h-3 text-amber-400" />
                                    <span>Enviar</span>
                                  </button>

                                  {!isDM && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewMemberSheet(member);
                                      }}
                                      disabled={loadingMemberSheet === member.id}
                                      className="px-2 py-1 bg-[#161c28] hover:bg-cyan-950/40 border border-[#2a3449] hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 rounded-lg text-[9px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                                      title="Ver Ficha deste Jogador"
                                    >
                                      {loadingMemberSheet === member.id ? '...' : 'Ficha'}
                                    </button>
                                  )}
                                </div>
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
        onImportSheet={handleImportNewSheet}
        onDuplicateSheet={handleDuplicateSheet}
        onDeleteSheet={handleDeleteSheet}
      />

      {/* ==================== MODAL DE IMPORTAÇÃO RÁPIDA D&D BEYOND (ENTRADA EM MESA) ==================== */}
      <ImportCharacterModal
        isOpen={isJoinImportModalOpen}
        onClose={() => setIsJoinImportModalOpen(false)}
        onImport={handleImportNewSheet}
      />

      {/* ==================== MODAL DA FICHA DE PERSONAGEM D&D 5E ==================== */}
      <CharacterSheetModal
        sheet={activeSheet}
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onSave={handleSaveSheet}
        broadcastRoll={broadcastPlayerRoll}
        playerName={user?.user_metadata?.display_name || user?.email || characterNameInput}
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

      {/* ==================== MODAL DE CRÔNICAS DA CAMPANHA (PLAYER VIEW) ==================== */}
      {showCampaignFeedModal && (
        <CampaignFeedModal
          campaignTitle={currentCampaign?.title || 'Campanha'}
          feedEvents={feedEvents}
          onClose={() => setShowCampaignFeedModal(false)}
        />
      )}

      {/* 3D BG3 Dice Roller Modal & HUD */}
      <FloatingDiceRollerHUD />

      {/* ==================== MENU DE CONTEXTO DO MEMBRO (BOTÃO DIREITO) ==================== */}
      {memberContextMenu && (
        <MemberContextMenu
          x={memberContextMenu.x}
          y={memberContextMenu.y}
          member={memberContextMenu.member}
          onClose={() => setMemberContextMenu(null)}
          onSendItem={(member) => handleStartItemTransfer(member)}
          onViewSheet={memberContextMenu.member.role !== 'dm' ? (member) => handleViewMemberSheet(member as any) : undefined}
          onWhisper={(member) => {
            setSidebarTab('chat');
            toast.info(`Você pode enviar mensagem para ${member.characterName} no Chat.`);
          }}
        />
      )}

      {/* ==================== MODAL DE TRANSFERÊNCIA DE ITENS ==================== */}
      {tradeModalState.isOpen && tradeModalState.receiverMember && activeSheet && (
        <ItemTransferModal
          isOpen={tradeModalState.isOpen}
          onClose={() => setTradeModalState({ isOpen: false, receiverMember: null })}
          senderSheet={activeSheet}
          receiverMember={tradeModalState.receiverMember}
          onConfirmTransfer={handleConfirmItemTransfer}
        />
      )}

      {/* ==================== MODAL DE ITENS RECEBIDOS (DESTINATÁRIO) ==================== */}
      {pendingReceivedTransfer && (
        <ReceivedItemsModal
          isOpen={Boolean(
            pendingReceivedTransfer && (
              !activeSheet ||
              (pendingReceivedTransfer.toUserId && user?.id && pendingReceivedTransfer.toUserId === user.id) ||
              (pendingReceivedTransfer.toCharacterName && activeSheet?.characterName &&
                pendingReceivedTransfer.toCharacterName.trim().toLowerCase() === activeSheet.characterName.trim().toLowerCase())
            )
          )}
          onClose={() => setPendingReceivedTransfer(null)}
          transferPayload={pendingReceivedTransfer}
          onCollectItems={handleCollectReceivedTransfer}
          isCollecting={isCollectingReceivedItems}
        />
      )}
    </div>
  );
};

