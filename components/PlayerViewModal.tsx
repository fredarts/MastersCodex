'use client';

import React, { useState, useEffect } from 'react';
import { X, Tv, Swords, Shield, Heart, Sparkles, Map, ScrollText, ListOrdered, FileText, MessageSquare, Layers, Mic, MicOff, PhoneCall, BookOpen } from 'lucide-react';
import { Combatant, CharacterSheet } from '@/lib/types';
import { useSession } from '@/context/SessionContext';
import { useCampaign } from '@/context/CampaignContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useVoiceCall } from '@/context/VoiceCallContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeEmbedUrl, resolveCurrentSceneImage } from '@/lib/imageUtils';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';
import { SlideTextOverlayRenderer } from '@/components/session/SlideTextOverlayRenderer';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { PlayerTurnBanner } from '@/components/player-view/PlayerTurnBanner';
import { PlayerCombatTrackerHUD } from '@/components/player-view/PlayerCombatTrackerHUD';
import { PlayerTokenActionDock } from '@/components/player-view/PlayerTokenActionDock';
import { SharedGameLog } from '@/components/live-cockpit/SharedGameLog';
import { LiveChatPanel } from '@/components/live-cockpit/LiveChatPanel';
import { MacroBarDisplayMode, SecretRollNotificationMode } from '@/lib/types';
import { PresenceIndicator } from '@/components/live-cockpit/PresenceIndicator';
import { CharacterSheetModal } from '@/components/character-sheet/CharacterSheetModal';
import { createEmptyCharacterSheet } from '@/lib/dnd5e-data';
import { DysonCanvas } from '@/components/map/DysonCanvas';
import { revealVisionWithLOS, getTokenVisionRadius } from '@/components/map/visionCore';
import { Cell } from '@/components/MapMaker';
import { DmCursorOverlay } from '@/components/live-cockpit/DmCursorOverlay';
import { PingEffect } from '@/components/live-cockpit/PingEffect';
import { XCardButton } from '@/components/safety/XCardButton';
import { LiveCalendarWidget } from '@/components/live-cockpit/LiveCalendarWidget';

interface PlayerViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatants: Combatant[];
  currentTurnIndex: number;
  roundCount: number;
}

export const PlayerViewModal: React.FC<PlayerViewModalProps> = ({
  isOpen,
  onClose,
  combatants: propCombatants,
  currentTurnIndex: propCurrentTurnIndex,
  roundCount: propRoundCount,
}) => {
  const { activeScene, fetchSceneMap, campaignMaps } = useSession();
  const { activeCampaign } = useCampaign();
  const {
    liveDisplayMode,
    projectedScene,
    combatLogs,
    broadcastPlayerRoll,
    mapData,
    setMapData,
    chatMessages,
    onlineUsers,
    dmCursor,
    pings,
    combatants: liveCombatants,
    currentTurnIndex: liveCurrentTurnIndex,
    roundCount: liveRoundCount,
    broadcastStateRequest,
    drawings,
    updateCombatantState,
    broadcastXCardAlert,
    broadcastChatMessage,
  } = useLiveCockpit();
  const { user } = useAuth();
  const { isInCall, isConnecting, isMuted, isSpeaking, joinCall, toggleMute, setIsWidgetOpen, participants } = useVoiceCall();

  const combatants = (propCombatants && propCombatants.length > 0) ? propCombatants : liveCombatants;
  const currentTurnIndex = propCurrentTurnIndex ?? liveCurrentTurnIndex;
  const roundCount = propRoundCount ?? liveRoundCount;

  // Solicita snapshot de estado ao Mestre ao abrir a tela do jogador
  useEffect(() => {
    if (isOpen) {
      broadcastStateRequest();
    }
  }, [isOpen, broadcastStateRequest]);

  const [rightPanelTab, setRightPanelTab] = useState<'init' | 'log' | 'chat'>('init');
  const [macroDisplayMode, setMacroDisplayMode] = useState<MacroBarDisplayMode>('both');
  const [secretRollMode, setSecretRollMode] = useState<SecretRollNotificationMode>('subtle_notice');
  const [isSheetModalOpen, setIsSheetModalOpen] = useState<boolean>(false);
  const [isMapLoading, setIsMapLoading] = useState<boolean>(false);
  const [lastLoadedSceneMapKey, setLastLoadedSceneMapKey] = useState<string | null>(null);

  const playerCharName = (() => {
    if (activeCampaign?.characterName) return activeCampaign.characterName;
    // Fallback: try to find character name from localStorage sheets linked to this campaign
    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1');
      if (saved && activeCampaign?.id) {
        const sheets: CharacterSheet[] = JSON.parse(saved);
        const linked = sheets.find((s) => s.campaignId === activeCampaign.id);
        if (linked?.characterName && linked.characterName !== 'Novo Aventureiro') return linked.characterName;
      }
    } catch (_) {}
    return 'Aventureiro';
  })();

  // Carrega a ficha correspondente ao personagem do jogador no localStorage
  const [activeSheet, setActiveSheet] = useState<CharacterSheet>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1');
      if (saved) {
        try {
          const parsed: CharacterSheet[] = JSON.parse(saved);
          const found = parsed.find(
            (s) =>
              (activeCampaign?.id && s.campaignId === activeCampaign.id) ||
              s.characterName.toLowerCase() === playerCharName.toLowerCase()
          );
          if (found) return found;
        } catch (err) {}
      }
    }
    const empty = createEmptyCharacterSheet('player-1', activeCampaign?.id);
    empty.characterName = playerCharName;
    return empty;
  });

  // Atualiza activeSheet sempre que o modal for aberto ou a campanha mude
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1');
      if (saved) {
        try {
          const parsed: CharacterSheet[] = JSON.parse(saved);
          const found = parsed.find(
            (s) =>
              (activeCampaign?.id && s.campaignId === activeCampaign.id) ||
              s.characterName.toLowerCase() === playerCharName.toLowerCase()
          );
          if (found) setActiveSheet(found);
        } catch (err) {}
      }
    }
  }, [isOpen, activeCampaign?.id, playerCharName]);

  const handleSaveSheet = (updatedSheet: CharacterSheet) => {
    setActiveSheet(updatedSheet);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        let parsed: CharacterSheet[] = saved ? JSON.parse(saved) : [];
        const idx = parsed.findIndex((s) => s.id === updatedSheet.id);
        if (idx >= 0) {
          parsed[idx] = updatedSheet;
        } else {
          parsed.push(updatedSheet);
        }
        localStorage.setItem('masters_codex_character_sheets_v1', JSON.stringify(parsed));
      } catch (err) {}

      try {
        const bc = new BroadcastChannel('masters_codex_sync');
        bc.postMessage({
          type: 'CHARACTER_MODEL_UPDATED',
          sheet: updatedSheet,
        });
        bc.close();
      } catch (e) {}

      window.dispatchEvent(
        new CustomEvent('masters_codex_character_model_updated', {
          detail: updatedSheet,
        })
      );
      window.dispatchEvent(
        new CustomEvent('character_sheet_updated', {
          detail: updatedSheet,
        })
      );
    }
  };

  // Escuta atualizações de loot recebido em tempo real (moedas, itens, baú)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLootReceived = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { characterName, userId: targetUserId, item, currency, sourceName } = customEvent.detail || {};

      const normalize = (s?: string) =>
        (s || '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

      const targetNorm = normalize(characterName);
      const currentNorm = normalize(playerCharName);
      const activeSheetNorm = normalize(activeSheet.characterName);

      const isForMe =
        (targetUserId && (targetUserId === user?.id || targetUserId === activeSheet.userId)) ||
        (targetNorm && (targetNorm === currentNorm || targetNorm === activeSheetNorm || currentNorm.includes(targetNorm) || targetNorm.includes(currentNorm))) ||
        (!characterName && !targetUserId && currency);

      if (isForMe) {
        setActiveSheet((prev) => {
          const updated = { ...prev };
          if (currency) {
            const cur = updated.currency || { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 };
            updated.currency = {
              po: (cur.po || 0) + (currency.po || 0),
              pp: (cur.pp || 0) + (currency.pp || 0),
              pc: (cur.pc || 0) + (currency.pc || 0),
              pe: (cur.pe || 0) + (currency.pe || 0),
              pl: (cur.pl || 0) + (currency.pl || 0),
            };

            const newEntries: any[] = [];
            const nowStr = new Date().toLocaleString('pt-BR');
            (['po', 'pp', 'pc', 'pe', 'pl'] as const).forEach((type) => {
              const amount = currency[type];
              if (amount && amount > 0) {
                newEntries.push({
                  id: `${Date.now()}-${type}`,
                  type: 'loot',
                  amount,
                  coinType: type,
                  reason: sourceName || 'Recompensa de Loot (Mestre)',
                  date: nowStr,
                });
              }
            });
            if (newEntries.length > 0) {
              updated.transactionHistory = [...newEntries, ...(updated.transactionHistory || [])];
            }
          }

          if (item) {
            const currentEq = updated.equipment || [];
            const safeId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            updated.equipment = [...currentEq, { ...item, id: safeId }];
          }

          updated.updatedAt = new Date().toISOString();
          handleSaveSheet(updated);
          return updated;
        });

        if (currency) {
          const coinsArr = (['po', 'pp', 'pc', 'pe', 'pl'] as const)
            .filter((c) => currency[c] && currency[c] > 0)
            .map((c) => `${currency[c]} ${c.toUpperCase()}`);
          if (coinsArr.length > 0) {
            toast.success(`💰 Você recebeu ${coinsArr.join(', ')} do Baú da Party!`);
          }
        }
        if (item) {
          toast.success(`🎁 Você recebeu "${item.name}" do Baú da Party!`);
        }
      }
    };

    window.addEventListener('masters_codex_loot_received', handleLootReceived);
    window.addEventListener('masters_codex_sheets_updated', handleLootReceived);
    return () => {
      window.removeEventListener('masters_codex_loot_received', handleLootReceived);
      window.removeEventListener('masters_codex_sheets_updated', handleLootReceived);
    };
  }, [playerCharName, activeSheet.characterName]);

  // Sincronização direta com Supabase Realtime para activeSheet no PlayerViewModal
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured()) return;

    const normalize = (s?: string) =>
      (s || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const channelId = `player_view_sheet_${activeSheet.id || activeSheet.characterName}_${Math.random().toString(36).substring(2, 7)}`;
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
            const rowCharName = normalize(row.character_name || remoteData.characterName);
            const myCharName = normalize(activeSheet.characterName || playerCharName);

            const isMySheet =
              (row.id && activeSheet.id && row.id === activeSheet.id) ||
              (row.user_id && user?.id && row.user_id === user.id) ||
              (rowCharName && myCharName && (rowCharName === myCharName || rowCharName.includes(myCharName) || myCharName.includes(rowCharName)));

            if (isMySheet && remoteData) {
              setActiveSheet((prev) => ({
                ...prev,
                ...remoteData,
                currency: remoteData.currency || prev.currency,
                equipment: remoteData.equipment || prev.equipment,
                transactionHistory: remoteData.transactionHistory || prev.transactionHistory,
                attributes: remoteData.attributes || prev.attributes,
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, activeSheet.id, activeSheet.characterName, playerCharName, user?.id]);

  // Auto-fetch scene map from Supabase when in 'map' mode if mapData is missing or scene/map changed
  useEffect(() => {
    const currentScene = projectedScene || activeScene;
    if (!isOpen || liveDisplayMode !== 'map' || !currentScene?.id) return;

    const typedMap = mapData as { activeMapId?: string; sceneId?: string; grid?: any[] } | null;
    const currentMapId = typedMap?.activeMapId || null;
    const sceneAssociatedIds = (currentScene.associatedMapIds || (currentScene.associatedMapId ? [currentScene.associatedMapId] : []))
      .filter((id: string) => campaignMaps.some(m => m.id === id));

    const needsFetch = !typedMap || 
                       !typedMap.grid ||
                       typedMap.grid.length === 0 ||
                       typedMap.sceneId !== currentScene.id || 
                       (currentMapId && !sceneAssociatedIds.includes(currentMapId));

    const fetchKey = `${currentScene.id}_${campaignMaps.length}`;

    if (needsFetch && lastLoadedSceneMapKey !== fetchKey) {
      setIsMapLoading(true);
      fetchSceneMap(currentScene.id).then((savedData) => {
        let activeId = savedData?.activeMapId;
        let gridData = null;
        const associatedIds = currentScene.associatedMapIds || (currentScene.associatedMapId ? [currentScene.associatedMapId] : []);
        if (!activeId) {
          activeId = (associatedIds.length > 0 ? (campaignMaps.find(m => associatedIds.includes(m.id))?.id || associatedIds[0]) : null);
        }
        const templateMap = campaignMaps.find(m => m.id === activeId);

        if (savedData) {
          if (savedData.maps) {
            gridData = activeId ? savedData.maps[activeId] : null;
          } else if (savedData.grid) {
            gridData = savedData;
            activeId = currentScene.associatedMapId || 'legacy';
          }
        }

        if (gridData && templateMap && templateMap.gridData) {
          // Merge template terrain with explored fog and tokens
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

          // Deduplicate tokens by name to prevent ghost/cloned tokens
          const seenTokens = new Set<string>();
          for (let r = 0; r < mergedGrid.length; r++) {
            for (let c = 0; c < mergedGrid[r].length; c++) {
              const tName = mergedGrid[r][c].tokenName;
              if (tName) {
                const key = tName.trim().toUpperCase();
                if (seenTokens.has(key)) {
                  mergedGrid[r][c].tokenName = undefined;
                  mergedGrid[r][c].tokenColor = undefined;
                } else {
                  seenTokens.add(key);
                }
              }
            }
          }

          // Ensure active player combatants have tokens on the grid
          if (combatants && combatants.length > 0) {
            const playerCombatants = combatants.filter((comb: any) => comb.type === 'player');
            for (const player of playerCombatants) {
              const playerKey = player.name.trim().toUpperCase();
              if (!seenTokens.has(playerKey)) {
                let placed = false;
                for (let r = 0; r < mergedGrid.length; r++) {
                  for (let c = 0; c < mergedGrid[r].length; c++) {
                    if (mergedGrid[r][c].type !== 'wall' && !mergedGrid[r][c].tokenName) {
                      mergedGrid[r][c].tokenName = player.name;
                      mergedGrid[r][c].tokenColor = '#38bdf8';
                      seenTokens.add(playerKey);
                      placed = true;
                      break;
                    }
                  }
                  if (placed) break;
                }
              }
            }
          }
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
        } else if (!gridData && templateMap && templateMap.gridData) {
          const tempGrid = templateMap.gridData.grid || [];
          
          // Clone and cover in fog
          const coveredGrid = tempGrid.map((row: any[]) => 
            row.map((cell: any) => ({
              ...cell,
              fog: true
            }))
          );

          // Reveal where tokens are respecting Line of Sight
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

          gridData = {
            ...templateMap.gridData,
            grid: coveredGrid
          };
        }

        if (gridData) {
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
          setLastLoadedSceneMapKey(fetchKey);
        }
        setIsMapLoading(false);
      }).catch((err) => {
        console.error('Erro ao sincronizar mapa da cena no PlayerView:', err);
        setIsMapLoading(false);
      });
    }
  }, [isOpen, liveDisplayMode, projectedScene, activeScene, mapData, lastLoadedSceneMapKey, fetchSceneMap, setMapData, campaignMaps, combatants]);

  if (!isOpen) return null;

  const isCombatMode = liveDisplayMode === 'combat';
  const currentScene = projectedScene || activeScene;
  const isBattleActive = Boolean(currentScene?.isBattleStarted) && isCombatMode;

  const currentTurnCombatant = combatants[currentTurnIndex];
  const isMyTurn =
    isBattleActive &&
    Boolean(
      currentTurnCombatant &&
        (currentTurnCombatant.name.toLowerCase().includes(playerCharName.toLowerCase()) ||
          playerCharName.toLowerCase().includes(currentTurnCombatant.name.toLowerCase()))
    );

  const typedMapData = mapData as {
    grid?: Cell[][];
    bgImageUrl?: string | null;
    gridScale?: number;
    gridOffsetX?: number;
    gridOffsetY?: number;
    vectorWalls?: import('@/lib/types').WallSegment[];
    lightSources?: import('@/lib/types').LightSource[];
    activeMapId?: string;
    activeLevelId?: string;
    currentLevelName?: string;
  } | null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex flex-col overflow-hidden select-none animate-fade-in">
      {/* Top Header */}
      <div className="bg-[#0f141d]/80 border-b border-[#2a3449] p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-inner">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono">
                TELA DO JOGADOR (DISCORD / TV)
              </span>
              <span className="text-[10px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                {playerCharName}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100">{activeCampaign?.title || 'Mesa de Jogo Ao Vivo'}</h2>
          </div>
        </div>

        {/* Campaign Calendar & Astral Orrery Widget */}
        <LiveCalendarWidget />

        <div className="flex items-center gap-3">
          <PresenceIndicator users={onlineUsers} className="border-r border-[#2a3449] pr-3 mr-1" />

          {/* Chamada de Voz (Voice Call) no Player View */}
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
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
              >
                {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => joinCall()}
              disabled={isConnecting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-slate-300 hover:text-emerald-300 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Entrar na Chamada de Voz da Sessão"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isConnecting ? 'Conectando...' : 'Entrar na Call'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSheetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 transition-all shadow-sm cursor-pointer"
            title="Abrir Ficha de Personagem Completa"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ficha do Herói</span>
          </button>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-750 p-2 rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Banner de Turno Animado com Alerta sonoro + Vibração (Apenas se batalha estiver ativa) */}
      {isBattleActive && (
        <PlayerTurnBanner
          isMyTurn={isMyTurn}
          characterName={playerCharName}
          currentActorName={currentTurnCombatant?.name}
          onOpenSheet={() => setIsSheetModalOpen(true)}
        />
      )}

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: 3D Battle Grid OR Scene Artwork */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          <DmCursorOverlay cursorData={dmCursor} />
          <PingEffect pings={pings} />

          {isCombatMode ? (
            <ThreeErrorBoundary>
              <BattleGrid3D
                combatants={combatants}
                currentTurnIndex={currentTurnIndex}
                isBattleStarted={currentScene?.isBattleStarted}
                {...(currentScene?.environmentSettings || {})}
                timeOfDayHour={currentScene?.timeOfDayHour}
                timeOfDayPreset={currentScene?.timeOfDay}
                isIndoor={currentScene?.timeOfDay === 'indoors'}
                hasFog={currentScene?.hasFog}
                hasRain={currentScene?.hasRain}
                floorTextureUrl={currentScene?.floorTextureUrl}
                videoGridConfig={currentScene?.videoGridConfig || currentScene?.environmentSettings?.video_grid_config}
                initialBuildingBlocks={currentScene?.buildingBlocks || currentScene?.environmentSettings?.building_blocks_3d || []}
                initialTerrainSurfaces={currentScene?.terrainSurfaces || currentScene?.environmentSettings?.terrain_surfaces_3d || []}
                initialGridConfig={currentScene?.gridConfig3D || currentScene?.environmentSettings?.grid_config_3d}
                initialTokenElevations={currentScene?.tokenElevations || currentScene?.environmentSettings?.token_elevations}
                interactive={true}
                userRole="player"
              />
            </ThreeErrorBoundary>
          ) : liveDisplayMode === 'map' ? (
            (() => {
              const typedMapData = mapData as any;
              const sceneAssocIds = currentScene?.associatedMapIds || (currentScene?.associatedMapId ? [currentScene.associatedMapId] : []);
              const currentMapId = 
                typedMapData?.activeMapId || 
                (sceneAssocIds.length > 0 ? (campaignMaps.find(m => sceneAssocIds.includes(m.id))?.id || sceneAssocIds[0]) : null) ||
                (campaignMaps.length > 0 ? campaignMaps[0]?.id : null);

              let activeCampaignMap = currentMapId ? (campaignMaps.find((m) => m.id === currentMapId) || null) : null;
              if (!activeCampaignMap && typedMapData && (typedMapData.mapTitle || typedMapData.title || typedMapData.coverImageUrl || typedMapData.bgImageUrl)) {
                activeCampaignMap = {
                  id: currentMapId || 'active-synced-map',
                  campaignId: activeCampaign?.id || '',
                  title: typedMapData.mapTitle || typedMapData.title || currentScene?.title || 'Masmorra Ativa',
                  gridData: {
                    description: typedMapData.description || typedMapData.dungeonLore || '',
                    challengeRating: typedMapData.challengeRating || typedMapData.dungeonCR || 'Nível Recomendado',
                    coverImageUrl: typedMapData.coverImageUrl || typedMapData.bgImageUrl,
                    bgImageUrl: typedMapData.bgImageUrl,
                    gridScale: typedMapData.gridScale || 40,
                    grid: typedMapData.grid || [],
                  }
                };
              }
              if (!activeCampaignMap && sceneAssocIds.length === 0) {
                activeCampaignMap = campaignMaps[0] || null;
              }

              const dungeonCover = typedMapData?.coverImageUrl || activeCampaignMap?.gridData?.coverImageUrl || activeCampaignMap?.gridData?.levels?.[0]?.bgImageUrl || activeCampaignMap?.gridData?.bgImageUrl || typedMapData?.bgImageUrl;
              const dungeonLore = typedMapData?.description || activeCampaignMap?.gridData?.description;
              const dungeonCR = typedMapData?.challengeRating || activeCampaignMap?.gridData?.challengeRating || 'Recomendado';
              const dungeonTitle = typedMapData?.mapTitle || typedMapData?.title || activeCampaignMap?.title || currentScene?.title || 'Exploração de Masmorra';
              const isExplorationStarted = 
                typedMapData?.dungeonExplorationStarted === true || 
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
                    <div className="relative z-10 max-w-lg w-full max-h-full bg-[#0d121c]/95 border-2 border-amber-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black flex flex-col gap-2 text-center items-center overflow-hidden">
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

              if (typedMapData && typedMapData.grid && typedMapData.grid.length > 0) {
                return (
                  <div className="w-full h-full relative">
                    {typedMapData.currentLevelName && (
                      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md border border-amber-500/30 rounded-2xl flex items-center gap-1.5 text-xs font-bold text-amber-400 shadow-2xl animate-in fade-in duration-200">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Andar: {typedMapData.currentLevelName}</span>
                      </div>
                    )}
                    <DysonCanvas
                      key={`${currentScene?.id}_${typedMapData.activeMapId || 'default'}_${typedMapData.activeLevelId || 'floor0'}`}
                      grid={typedMapData.grid || []}
                      bgImageUrl={typedMapData.bgImageUrl || null}
                      gridScale={typedMapData.gridScale || 40}
                      gridOffsetX={typedMapData.gridOffsetX || 0}
                      gridOffsetY={typedMapData.gridOffsetY || 0}
                      combatants={combatants}
                      vectorWalls={typedMapData.vectorWalls || []}
                      lightSources={typedMapData.lightSources || []}
                      selectedTool="pan"
                      selectedTileType="floor"
                      selectedTokenCombatant={null}
                      onGridChange={() => {}}
                      isPlayerView={true}
                      drawings={drawings}
                    />
                  </div>
                );
              }

              if (isMapLoading) {
                return (
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400 font-mono animate-pulse">
                    <Map className="w-10 h-10 text-amber-500/60 animate-bounce" />
                    <p className="text-xs uppercase tracking-widest text-amber-400">Sincronizando Mapa da Dungeon...</p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500 font-mono">
                  <Map className="w-10 h-10 text-slate-600" />
                  <p className="text-xs">Nenhum mapa tático associado a esta cena no momento.</p>
                </div>
              );
            })()
          ) : (() => {
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

              const resolved = resolveCurrentSceneImage(currentScene);
              const rawUrl = resolved?.imageUrl || (projectedScene as any)?.currentImageUrl || (currentScene as any)?.currentImageUrl || currentScene?.imageUrl;
              const activeAspectRatio = resolved?.aspectRatio || currentScene?.defaultAspectRatio || '16:9';

              if (!rawUrl) {
                return (
                  <div className="text-center p-8 text-slate-600">
                    <Map className="w-16 h-16 mx-auto mb-3 opacity-40" />
                    <h3 className="text-slate-400 font-bold text-base">Aguardando Transmissão de Imagem pelo Mestre...</h3>
                  </div>
                );
              }

              const ytEmbed = getYouTubeEmbedUrl(rawUrl);
              const isVid = resolved?.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(rawUrl);

              return (
                <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
                  <div className={`h-full max-w-full w-auto ${getAspectClass(activeAspectRatio)} bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center`}>
                    {ytEmbed ? (
                      <iframe
                        src={ytEmbed}
                        className="w-full h-full border-0 bg-black"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : isVid ? (
                      <video
                        src={normalizeImageUrl(rawUrl)}
                        className="w-full h-full object-contain bg-black"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                      />
                    ) : (
                      <MagicShaderSlideshow
                        imageUrl={normalizeImageUrl(rawUrl)}
                        transitionType={resolved?.transitionType || currentScene?.defaultTransition || 'magical_dissolve'}
                        aspectRatio={activeAspectRatio as any}
                        className="w-full h-full"
                      />
                    )}

                    {/* Legenda e Overlays Cinemáticos para Jogadores */}
                    <SlideTextOverlayRenderer
                      overlays={resolved?.textOverlays}
                      fallbackOverlayText={resolved?.overlayText || currentScene?.sensoryText}
                      fallbackTitle={resolved?.title || currentScene?.title}
                      triggerKey={`${rawUrl}-${resolved?.activeImageIndex ?? 0}`}
                    />
                  </div>
                </div>
              );
            })()}

          {/* Overlay de Ações Rápidas do Jogador */}
          {(() => {
            const meCombatant = combatants.find(
              (c) => c.name.toLowerCase().includes(playerCharName.toLowerCase()) || playerCharName.toLowerCase().includes(c.name.toLowerCase())
            );
            return (
              <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-auto">
                <PlayerTokenActionDock
                  activeSheet={activeSheet}
                  playerCombatant={meCombatant}
                  isMyTurn={isMyTurn}
                  isCombatActive={isBattleActive}
                  layout="dock"
                  onExecuteRoll={(rollEvent) => {
                    const fullRoll = {
                      id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      characterId: activeSheet.id,
                      characterName: activeSheet.characterName || playerCharName,
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
                  onOpenFullSheet={() => setIsSheetModalOpen(true)}
                />
              </div>
            );
          })()}
        </div>

        {/* Right Tabbed Panel for Players (Iniciativa & Battle Log) */}
        <div className="w-80 bg-[#0c0f17] border-l border-[#2a3449] flex flex-col justify-between overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex border-b border-[#2a3449] bg-[#121824]/60 p-1.5 gap-1.5 shrink-0">
            <button
              onClick={() => setRightPanelTab('init')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'init'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Iniciativa</span>
            </button>
            <button
              onClick={() => setRightPanelTab('log')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'log'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Log ({combatLogs.length})</span>
            </button>
            <button
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                rightPanelTab === 'chat'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat ({chatMessages.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          {rightPanelTab === 'init' ? (
            <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2a3449]">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    FILA DE INICIATIVA
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                    RODADA {roundCount}
                  </span>
                </div>

                <div className="space-y-2">
                  {combatants.map((c, idx) => {
                    const isTurn = idx === currentTurnIndex;
                    const isMe = c.name.toLowerCase().includes(playerCharName.toLowerCase()) || playerCharName.toLowerCase().includes(c.name.toLowerCase());
                    const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
                    return (
                      <div
                        key={`${c.id}-${idx}`}
                        className={`p-3 rounded-xl border transition-all ${
                          isMe
                            ? 'bg-amber-950/40 border-amber-500/60 text-slate-100 shadow-lg ring-1 ring-amber-500/30'
                            : isTurn
                            ? 'bg-rose-950/50 border-rose-500 text-rose-300 font-bold shadow-lg ring-1 ring-rose-500/40'
                            : 'bg-[#161c28] border-[#2a3449] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-[#0a0d14] px-1.5 py-0.5 rounded border border-[#2a3449]">
                              #{c.initiative}
                            </span>
                            <span className="text-xs font-bold truncate max-w-[120px]">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isMe && (
                              <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                                VOCÊ
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" /> {c.ac}
                            </span>
                            {isTurn && (
                              <span className="text-[9px] bg-rose-500 text-slate-950 font-black px-1.5 py-0.5 rounded animate-pulse">
                                TURNO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Live Health Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> HP:
                            </span>
                            <span className="font-bold text-slate-200">{c.hp} / {c.maxHp}</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                            <div
                              className={`h-full transition-all duration-300 ${
                                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
                              }`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Conditions */}
                        {c.conditions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {c.conditions.map((cond) => (
                              <span key={cond} className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full font-mono">
                                {cond}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#2a3449] text-center">
                <span className="text-[10px] text-slate-500 font-mono">MASTER'S CODEX • PLAYER DISPLAY</span>
              </div>
            </div>
          ) : rightPanelTab === 'log' ? (
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

      {/* Modal da Ficha Completa do Personagem */}
      <CharacterSheetModal
        sheet={activeSheet}
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onSave={handleSaveSheet}
        broadcastRoll={broadcastPlayerRoll}
        playerName={user?.user_metadata?.display_name || user?.email || activeSheet.characterName}
        lockBaseAttributes={isCombatMode}
      />
    </div>
  );
};
