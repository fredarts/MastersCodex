'use client';

import React, { useState, useEffect } from 'react';
import { X, Tv, Swords, Shield, Heart, Sparkles, Map, ScrollText, ListOrdered, FileText, MessageSquare, Layers } from 'lucide-react';
import { Combatant, CharacterSheet } from '@/lib/types';
import { useSession } from '@/context/SessionContext';
import { useCampaign } from '@/context/CampaignContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useAuth } from '@/context/AuthContext';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/imageUtils';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { PlayerTurnBanner } from '@/components/player-view/PlayerTurnBanner';
import { PlayerCombatTrackerHUD } from '@/components/player-view/PlayerCombatTrackerHUD';
import { PlayerTokenActionDock } from '@/components/player-view/PlayerTokenActionDock';
import { SharedGameLog } from '@/components/live-cockpit/SharedGameLog';
import { LiveChatPanel } from '@/components/live-cockpit/LiveChatPanel';
import { MacroBarHUD } from '@/components/live-cockpit/MacroBarHUD';
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
    }
  };

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
        
        const associatedIds = (currentScene.associatedMapIds || (currentScene.associatedMapId ? [currentScene.associatedMapId] : []))
          .filter((id: string) => campaignMaps.some(m => m.id === id));
        if (!activeId || !associatedIds.includes(activeId)) {
          activeId = associatedIds[0] || null;
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
          setMapData({
            grid: gridData.grid || [],
            bgImageUrl: gridData.bgImageUrl || null,
            gridScale: gridData.gridScale || 40,
            gridOffsetX: gridData.gridOffsetX || 0,
            gridOffsetY: gridData.gridOffsetY || 0,
            vectorWalls: gridData.vectorWalls || [],
            lightSources: gridData.lightSources || [],
            activeMapId: activeId,
            sceneId: currentScene.id
          });
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

  const currentTurnCombatant = combatants[currentTurnIndex];
  const isMyTurn =
    isCombatMode &&
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

        <div className="flex items-center gap-3">
          <PresenceIndicator users={onlineUsers} className="border-r border-[#2a3449] pr-3 mr-1" />

          <XCardButton
            campaignId={activeCampaign?.id}
            playerName={playerCharName}
            safetySettings={activeCampaign?.safetySettings}
            onSendAlert={(alert) => broadcastXCardAlert({ alert })}
          />

          <button
            onClick={() => setIsSheetModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Ficha de Personagem</span>
          </button>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#161c28] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Banner de Turno Animado com Alerta sonoro + Vibração */}
      {isCombatMode && (
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
                initialBuildingBlocks={currentScene?.buildingBlocks || currentScene?.environmentSettings?.building_blocks_3d || []}
                initialTerrainSurfaces={currentScene?.terrainSurfaces || currentScene?.environmentSettings?.terrain_surfaces_3d || []}
                initialGridConfig={currentScene?.gridConfig3D || currentScene?.environmentSettings?.grid_config_3d}
                initialTokenElevations={currentScene?.tokenElevations || currentScene?.environmentSettings?.token_elevations}
                interactive={true}
                userRole="player"
              />
            </ThreeErrorBoundary>
          ) : liveDisplayMode === 'map' ? (
            typedMapData && typedMapData.grid && typedMapData.grid.length > 0 ? (
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
                  selectedTool="pan" // Jogador só move a visualização do canvas
                  selectedTileType="floor"
                  selectedTokenCombatant={null}
                  onGridChange={() => {}} // Sem alteração de grid para jogador
                  isPlayerView={true}
                  drawings={drawings}
                />
              </div>
            ) : isMapLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 font-mono animate-pulse">
                <Map className="w-10 h-10 text-amber-500/60 animate-bounce" />
                <p className="text-xs uppercase tracking-widest text-amber-400">Sincronizando Mapa da Dungeon...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-500 font-mono">
                <Map className="w-10 h-10 text-slate-600" />
                <p className="text-xs">Nenhum mapa tático associado a esta cena no momento.</p>
              </div>
            )
          ) : (currentScene?.sceneImages && currentScene.sceneImages.length > 0) || currentScene?.imageUrl ? (
            <div className="w-full h-full relative flex items-center justify-center">
              {currentScene.sceneImages && currentScene.sceneImages.length > 0 ? (
                (() => {
                  const currentSlide = currentScene.sceneImages[currentScene.activeImageIndex ?? 0];
                  const rawUrl = currentSlide?.imageUrl || '';
                  const ytEmbed = getYouTubeEmbedUrl(rawUrl);
                  
                  if (ytEmbed) {
                    return (
                      <iframe
                        src={ytEmbed}
                        className="w-full h-full border-0 bg-black"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  
                  const isVideo = currentSlide?.mediaType === 'video' ||
                    (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(rawUrl));
                  
                  if (isVideo) {
                    return (
                      <video
                        src={normalizeImageUrl(rawUrl)}
                        className="w-full h-full object-contain bg-black"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                      />
                    );
                  }
                  return (
                    <MagicShaderSlideshow
                      imageUrl={normalizeImageUrl(rawUrl)}
                      className="w-full h-full"
                    />
                  );
                })()
              ) : (
                (() => {
                  const rawUrl = currentScene.imageUrl || '';
                  const ytEmbed = getYouTubeEmbedUrl(rawUrl);
                  
                  if (ytEmbed) {
                    return (
                      <iframe
                        src={ytEmbed}
                        className="w-full h-full border-0 bg-black"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  }
                  
                  const isVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(rawUrl);
                  if (isVideo) {
                    return (
                      <video
                        src={normalizeImageUrl(rawUrl)}
                        className="w-full h-full object-contain bg-black"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                      />
                    );
                  }
                  return (
                    <img
                      src={normalizeImageUrl(rawUrl)}
                      alt="Arte da cena"
                      className="w-full h-full object-cover animate-fade-in"
                    />
                  );
                })()
              )}
              {/* Legenda cinemática para jogadores */}
              {(() => {
                const activeImgObj = currentScene.sceneImages?.[currentScene.activeImageIndex ?? 0];
                const captionText = activeImgObj ? activeImgObj.overlayText : currentScene.sensoryText;
                const captionTitle = currentScene.title;
                if (!captionText && !captionTitle) return null;
                return (
                  <div className="absolute bottom-8 left-12 right-12 p-5 rounded-2xl bg-[#0a0d14]/90 backdrop-blur-xl border border-amber-500/25 shadow-2xl max-w-4xl mx-auto text-center transition-all animate-fade-in">
                    {captionTitle && (
                      <div className="text-[10px] tracking-widest font-black text-amber-400 uppercase font-mono mb-1.5">
                        — {captionTitle} —
                      </div>
                    )}
                    {captionText && (
                      <p className="text-sm text-slate-100 font-serif leading-relaxed italic px-4 select-text">
                        "{captionText}"
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center p-8 text-slate-600">
              <Map className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <h3 className="text-slate-400 font-bold text-base">Aguardando Transmissão de Imagem pelo Mestre...</h3>
            </div>
          )}

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
                  isCombatActive={isCombatMode}
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

      {/* Floating Macro Bar HUD */}
      <MacroBarHUD
        onExecuteMacro={(command) => {
          const message = {
            id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderId: user?.id || 'anonymous',
            senderName: playerCharName,
            channel: 'general' as const,
            content: command,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          };
          if (broadcastChatMessage) broadcastChatMessage(message);
        }}
        activeSheet={activeSheet}
        displayMode={macroDisplayMode}
        onUpdateDisplayMode={setMacroDisplayMode}
        secretMode={secretRollMode}
        onUpdateSecretMode={setSecretRollMode}
      />

      {/* Modal da Ficha Completa do Personagem */}
      <CharacterSheetModal
        sheet={activeSheet}
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onSave={handleSaveSheet}
        broadcastRoll={broadcastPlayerRoll}
        lockBaseAttributes={isCombatMode}
      />
    </div>
  );
};
