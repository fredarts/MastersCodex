'use client';

import React, { useRef, useCallback } from 'react';
import { Eye, Map as MapIcon, Mic, Volume2, Swords, RotateCcw, Layers, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useSession } from '@/lib/hooks/useSession';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { toast } from 'sonner';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';
import { SlideTextOverlayRenderer } from '@/components/session/SlideTextOverlayRenderer';
import { LiveCockpitAudioController } from '@/components/live-cockpit/LiveCockpitAudioController';
import { CockpitDungeonMap } from '@/components/live-cockpit/CockpitDungeonMap';
import { GameScene, Combatant, SlidePack } from '@/lib/types';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/imageUtils';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface LiveVisualMirrorProps {
  onSlideChange: (index: number) => Promise<void>;
  onAttackFromWidget: (target: Combatant) => void;
}

export const LiveVisualMirror: React.FC<LiveVisualMirrorProps> = ({
  onSlideChange,
  onAttackFromWidget,
}) => {
  const { activeCampaign } = useCampaign();
  const { activeScene, updateScene } = useSession();
  const { showConfirm } = useCustomDialog();
  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    setCurrentTurnIndex,
    setRoundCount,
    liveDisplayMode,
    broadcastToPlayerView,
    initializeFromCombatants,
    broadcastDmCursor,
    broadcastPingLocation,
  } = useLiveCockpit();

  const {
    isPlacementPhase,
    battleSetupMode,
    liveTimeOfDayHour,
    selectedTimeOfDay,
    liveHasFog,
    liveHasRain,
    liveFloorTextureUrl,
    liveEnvironmentSettings,
    playingNpcVoice,
    activeBgmCategory,
    selectedTargetId,
    setSelectedTargetId,
    setSelectedTimeOfDay,
    setLiveTimeOfDayHour,
    setLiveHasFog,
    setLiveHasRain,
    setLiveFloorTextureUrl,
    setLiveEnvironmentSettings,
    setIsPlacementPhase,
    setPlayingNpcVoice,
    setActiveBgmCategory,
    isBattleStarted,
    setIsBattleStarted,
  } = useLiveCockpitStudioStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const lastCursorSentRef = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastCursorSentRef.current < 80) return; // 80ms throttle
    lastCursorSentRef.current = now;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    broadcastDmCursor({
      x,
      y,
      context: liveDisplayMode === 'combat' ? 'battle3d' : 'map',
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (e.ctrlKey) {
      if (liveDisplayMode === 'combat') return; // BattleGrid3D trata pings 3D nativamente no chão
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      broadcastPingLocation({
        x,
        y,
        context: 'map',
        senderName: 'Mestre',
        color: '#f59e0b',
      });
      toast.info('Sinalizador de localização enviado!');
    }
  };

  const slidePacks: SlidePack[] = (activeScene?.slidePacks && activeScene.slidePacks.length > 0)
    ? activeScene.slidePacks
    : (activeScene?.environmentSettings?.slide_packs && activeScene.environmentSettings.slide_packs.length > 0)
    ? activeScene.environmentSettings.slide_packs
    : (activeScene?.sceneImages && activeScene.sceneImages.length > 0)
    ? [
        {
          id: 'pack-main',
          title: '🌟 Cena Principal',
          category: 'principal' as const,
          transitionType: activeScene.defaultTransition || 'magical_dissolve',
          aspectRatio: activeScene.defaultAspectRatio || '16:9',
          images: activeScene.sceneImages,
          activeImageIndex: activeScene.activeImageIndex || 0,
        }
      ]
    : [];

  const activePackId = activeScene?.activeSlidePackId || activeScene?.environmentSettings?.active_slide_pack_id || slidePacks[0]?.id || 'pack-main';
  const currentPack = slidePacks.find((p) => p.id === activePackId) || slidePacks[0];
  const currentPackImages = (currentPack?.images && currentPack.images.length > 0)
    ? currentPack.images
    : (activeScene?.sceneImages || []);

  const activeImageIndex = Math.min(
    Math.max(0, activeScene?.activeImageIndex ?? 0),
    Math.max(0, currentPackImages.length - 1)
  );
  const activeSlideImage = currentPackImages[activeImageIndex];
  const displayImageUrl = activeSlideImage ? normalizeImageUrl(activeSlideImage.imageUrl) : normalizeImageUrl(activeScene?.imageUrl || '');

  const handlePackChange = async (packId: string) => {
    if (!activeScene) return;
    const targetPack = slidePacks.find((p) => p.id === packId);
    if (!targetPack) return;

    const targetImages = targetPack.images || [];
    const updatedScene: GameScene = {
      ...activeScene,
      activeSlidePackId: packId,
      sceneImages: targetImages,
      activeImageIndex: 0,
      defaultTransition: targetPack.transitionType || activeScene.defaultTransition || 'magical_dissolve',
      defaultAspectRatio: targetPack.aspectRatio || activeScene.defaultAspectRatio || '16:9',
      environmentSettings: {
        ...(activeScene.environmentSettings || {}),
        active_slide_pack_id: packId,
        slide_packs: slidePacks,
      }
    };

    await updateScene(updatedScene);
    broadcastToPlayerView({
      payload: updatedScene,
      activeImageIndex: 0,
    });
    toast.success(`Pack de Slides alterado: ${targetPack.title}`);
  };

  const handleStartBattle = async () => {
    if (!activeScene) return;
    
    // Captura o estado atual dos combatentes (vida e posição) no início da batalha
    const snapshot = JSON.parse(JSON.stringify(combatants)) as Combatant[];

    const resetCombatants = combatants.map((c, i) => ({
      ...c,
      actionUsed: false,
      bonusActionUsed: false,
      reactionUsed: false,
      movementUsed: 0,
      hasDashed: false,
      turnStartX: c.x,
      turnStartZ: c.z,
      isCurrentTurn: i === 0, // O primeiro combatente é o que ganha o turno atual
    }));
    
    const updatedScene = {
      ...activeScene,
      isBattleStarted: true,
      battleStartSnapshot: snapshot,
      combatants: resetCombatants
    };
    
    setCombatants(resetCombatants);
    broadcastToPlayerView({ combatants: resetCombatants });
    
    setIsBattleStarted(true);
    setCurrentTurnIndex(0);
    setRoundCount(1);
    await updateScene(updatedScene);
    toast.success('Batalha iniciada! Estado inicial capturado.');
  };

  const handleResetBattle = async () => {
    if (!activeScene) return;
    
    const confirmReset = await showConfirm({
      title: 'Resetar Batalha',
      message: 'Tem certeza que deseja resetar a batalha?\n\nIsso voltará todos os combatentes para suas vidas e posições originais de quando a batalha começou, e retornará para o Turno 1.',
      confirmText: 'Resetar Batalha',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    
    if (!confirmReset) return;
    
    let restoredCombatants = combatants;
    
    if (activeScene.battleStartSnapshot && activeScene.battleStartSnapshot.length > 0) {
      restoredCombatants = activeScene.battleStartSnapshot;
      setCombatants(restoredCombatants);
      initializeFromCombatants(restoredCombatants);
      broadcastToPlayerView({ combatants: restoredCombatants });
    }
    
    const updatedScene = {
      ...activeScene,
      combatants: restoredCombatants,
      isBattleStarted: false
    };
    
    setIsBattleStarted(false);
    setCurrentTurnIndex(0);
    setRoundCount(1);
    await updateScene(updatedScene);
    toast.info('Batalha resetada para as configurações iniciais.');
  };

  const handleSelectTarget = useCallback((target: any) => {
    setSelectedTargetId(target?.id);
    broadcastToPlayerView({ targetId: target?.id });
  }, [broadcastToPlayerView, setSelectedTargetId]);

  const handleBuildingBlocksChange = useCallback((blocks: any) => {
    const newSettings = { ...(liveEnvironmentSettings || {}), building_blocks_3d: blocks };
    setLiveEnvironmentSettings(newSettings);
    if (activeScene && updateScene) {
      updateScene({
        ...activeScene,
        buildingBlocks: blocks,
        environmentSettings: newSettings,
      });
    }
    broadcastToPlayerView({
      building_blocks_3d: blocks,
      environmentSettings: newSettings,
    });
  }, [activeScene, broadcastToPlayerView, liveEnvironmentSettings, setLiveEnvironmentSettings, updateScene]);

  const handleTerrainSurfacesChange = useCallback((surfaces: any) => {
    const newSettings = { ...(liveEnvironmentSettings || {}), terrain_surfaces_3d: surfaces };
    setLiveEnvironmentSettings(newSettings);
    if (activeScene && updateScene) {
      updateScene({
        ...activeScene,
        terrainSurfaces: surfaces,
        environmentSettings: newSettings,
      });
    }
    broadcastToPlayerView({
      terrain_surfaces_3d: surfaces,
      environmentSettings: newSettings,
    });
  }, [activeScene, broadcastToPlayerView, liveEnvironmentSettings, setLiveEnvironmentSettings, updateScene]);

  const handleGridConfigChange = useCallback((gridCfg: any) => {
    const newSettings = { ...(liveEnvironmentSettings || {}), grid_config_3d: gridCfg };
    setLiveEnvironmentSettings(newSettings);
    if (activeScene && updateScene) {
      updateScene({
        ...activeScene,
        gridConfig3D: gridCfg,
        environmentSettings: newSettings,
      });
    }
    broadcastToPlayerView({
      grid_config_3d: gridCfg,
      environmentSettings: newSettings,
    });
  }, [activeScene, broadcastToPlayerView, liveEnvironmentSettings, setLiveEnvironmentSettings, updateScene]);

  const handleTokenElevationsChange = useCallback((elevs: any) => {
    const newSettings = { ...(liveEnvironmentSettings || {}), token_elevations: elevs };
    setLiveEnvironmentSettings(newSettings);
    if (activeScene && updateScene) {
      updateScene({
        ...activeScene,
        tokenElevations: elevs,
        environmentSettings: newSettings,
      });
    }
    broadcastToPlayerView({
      token_elevations: elevs,
      environmentSettings: newSettings,
    });
  }, [activeScene, broadcastToPlayerView, liveEnvironmentSettings, setLiveEnvironmentSettings, updateScene]);

  const handleTimeOfDayChange = useCallback((preset: any) => {
    setSelectedTimeOfDay(preset);
    broadcastToPlayerView({
      timeOfDay: preset,
    });
  }, [broadcastToPlayerView, setSelectedTimeOfDay]);

  const handleEnvironmentChange = useCallback((env: any) => {
    if (env.timeOfDayPreset) {
      setSelectedTimeOfDay(env.timeOfDayPreset);
    }
    setLiveTimeOfDayHour(env.timeOfDayHour);
    setLiveHasFog(env.hasFog);
    setLiveHasRain(env.hasRain);
    
    const newSettings = { ...(liveEnvironmentSettings || {}), ...env };
    setLiveEnvironmentSettings(newSettings);

    broadcastToPlayerView({
      timeOfDay: env.timeOfDayPreset || selectedTimeOfDay,
      timeOfDayHour: env.timeOfDayHour,
      hasFog: env.hasFog,
      hasRain: env.hasRain,
      environmentSettings: newSettings
    });
  }, [broadcastToPlayerView, liveEnvironmentSettings, selectedTimeOfDay, setLiveEnvironmentSettings, setLiveHasFog, setLiveHasRain, setLiveTimeOfDayHour, setSelectedTimeOfDay]);

  const handleFloorTextureChange = useCallback((url: string) => {
    setLiveFloorTextureUrl(url);
    broadcastToPlayerView({ floorTextureUrl: url });
  }, [broadcastToPlayerView, setLiveFloorTextureUrl]);

  const handleConfirmPlacement = useCallback(() => {
    setIsPlacementPhase(false);
    broadcastToPlayerView({ isPlacementPhase: false });
  }, [broadcastToPlayerView, setIsPlacementPhase]);

  const sceneBlocks = activeScene?.buildingBlocks || liveEnvironmentSettings?.building_blocks_3d;
  const sceneTerrains = activeScene?.terrainSurfaces || liveEnvironmentSettings?.terrain_surfaces_3d;
  const sceneGridConfig = activeScene?.gridConfig3D || liveEnvironmentSettings?.grid_config_3d;
  const sceneElevations = activeScene?.tokenElevations || liveEnvironmentSettings?.token_elevations;

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden border-r border-[#2a3449]">
      <div className="bg-[#121824]/80 p-3 border-b border-[#2a3449] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Projeção dos Jogadores (Espelho ao Vivo)
          </span>
          
          {/* Battle Controls inserted near the Live Display Mode */}
          {liveDisplayMode === 'combat' && (
            <div className="flex items-center gap-2 pl-4 border-l border-[#2a3449]">
              {!isBattleStarted ? (
                <button
                  onClick={handleStartBattle}
                  className="px-3 py-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-slate-950 font-black text-[10px] rounded shadow-lg transition-all flex items-center gap-1.5 uppercase"
                >
                  <Swords className="w-3 h-3" />
                  Iniciar Batalha
                </button>
              ) : (
                <button
                  onClick={handleResetBattle}
                  className="px-3 py-1 bg-[#1a2234] hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 font-bold text-[10px] rounded transition-all flex items-center gap-1.5 uppercase"
                  title="Restaurar HP e posições de quando a batalha iniciou"
                >
                  <RotateCcw className="w-3 h-3" />
                  Resetar Batalha
                </button>
              )}
            </div>
          )}
        </div>
        
        <span className="text-[10px] text-slate-400 font-mono">
          Modo Atual: <strong className="text-amber-400 uppercase">{liveDisplayMode}</strong>
        </span>
      </div>

      <div className="flex-1 p-4 flex flex-col min-h-0 space-y-4 overflow-hidden">
        {/* Top Section: Display & Slideshow Controls */}
        <div className="flex flex-row gap-4 items-stretch justify-center w-full flex-1 min-h-0 max-h-[65vh]">
          
          {/* Live Visual Mirror Display Container */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div
              ref={containerRef}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              className="h-full max-w-full w-auto aspect-video bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center"
            >
              {liveDisplayMode === 'combat' ? (
              <ThreeErrorBoundary>
                <BattleGrid3D
                  combatants={combatants}
                  onUpdateCombatants={(updated) => setCombatants(updated)}
                  currentTurnIndex={currentTurnIndex}
                  selectedTargetId={selectedTargetId}
                  isBattleStarted={isBattleStarted}
                  onSelectTarget={handleSelectTarget}
                  onAttackTarget={onAttackFromWidget}
                  interactive={true}
                  isPlacementPhase={isPlacementPhase}
                  setupMode={battleSetupMode}
                  {...(liveEnvironmentSettings || {})}
                  timeOfDayHour={liveTimeOfDayHour}
                  timeOfDayPreset={selectedTimeOfDay}
                  isIndoor={selectedTimeOfDay === 'indoors'}
                  hasFog={liveHasFog}
                  hasRain={liveHasRain}
                  initialBuildingBlocks={sceneBlocks}
                  onBuildingBlocksChange={handleBuildingBlocksChange}
                  initialTerrainSurfaces={sceneTerrains}
                  onTerrainSurfacesChange={handleTerrainSurfacesChange}
                  initialGridConfig={sceneGridConfig}
                  onGridConfigChange={handleGridConfigChange}
                  initialTokenElevations={sceneElevations}
                  onTokenElevationsChange={handleTokenElevationsChange}
                  onTimeOfDayChange={handleTimeOfDayChange}
                  onEnvironmentChange={handleEnvironmentChange}
                  floorTextureUrl={liveFloorTextureUrl}
                  onFloorTextureChange={handleFloorTextureChange}
                  onConfirmPlacement={handleConfirmPlacement}
                  userRole="dm"
                />
              </ThreeErrorBoundary>
            ) : liveDisplayMode === 'map' ? (
              <CockpitDungeonMap />
            ) : displayImageUrl ? (
              <div className="w-full h-full relative">
                {(() => {
                  const ytEmbed = getYouTubeEmbedUrl(displayImageUrl);
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
                  const isVideo = activeSlideImage?.mediaType === 'video' ||
                    (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(displayImageUrl));
                  if (isVideo) {
                    return (
                      <video
                        src={displayImageUrl}
                        className="w-full h-full object-contain bg-black"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls={false}
                      />
                    );
                  }
                  if (currentPackImages && currentPackImages.length > 0) {
                    return (
                      <MagicShaderSlideshow
                        imageUrl={displayImageUrl}
                        transitionType={currentPack?.transitionType || activeScene?.defaultTransition || 'magical_dissolve'}
                        aspectRatio={activeSlideImage?.aspectRatio || currentPack?.aspectRatio || activeScene?.defaultAspectRatio || '16:9'}
                        className="w-full h-full"
                      />
                    );
                  }
                  return (
                    <img src={displayImageUrl} alt="Arte ao vivo" className="w-full h-full object-cover animate-fade-in" />
                  );
                })()}
                <SlideTextOverlayRenderer
                  overlays={activeSlideImage?.textOverlays}
                  fallbackOverlayText={activeSlideImage?.overlayText || activeScene?.sensoryText}
                  fallbackTitle={currentPack?.title || activeScene?.title}
                  triggerKey={`${displayImageUrl}-${activeImageIndex}`}
                />
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500">
                <MapIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Nenhuma arte ou mapa transmitido no momento.</p>
              </div>
            )}
            </div>
          </div>

          {/* Right Side Panels: Slideshow & NPC Voice */}
          {liveDisplayMode === 'artwork' && (
            <div className="flex flex-row gap-3 shrink-0">
              
              {/* Slideshow DM Controls com Dropdown de Packs */}
              {(currentPackImages.length > 0 || slidePacks.length > 1) && (
                <div className="w-[175px] bg-[#121824] border border-[#2a3449] rounded-xl p-3 flex flex-col gap-3 shadow overflow-hidden">
                  {/* Seletor Dropdown de Packs de Slides */}
                  {slidePacks.length > 1 && (
                    <div className="flex flex-col gap-1 shrink-0 pb-2 border-b border-[#2a3449]/60">
                      <label className="text-[9px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Pack de Slides:
                      </label>
                      <select
                        value={activePackId}
                        onChange={(e) => handlePackChange(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-amber-500/40 hover:border-amber-400 focus:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer transition-colors shadow-inner"
                      >
                        {slidePacks.map((pack) => (
                          <option key={pack.id} value={pack.id} className="bg-[#121824] text-slate-200">
                            {pack.title} ({pack.images?.length || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Header do Slide e Botões de Navegação */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-tight">
                        Slide {currentPackImages.length > 0 ? `${activeImageIndex + 1} de ${currentPackImages.length}` : '0 de 0'}
                      </span>
                      {currentPack?.transitionType && (
                        <span className="text-[8px] bg-[#0a0d14] text-amber-400 px-1.5 py-0.5 rounded font-mono border border-[#2a3449]">
                          {currentPack.aspectRatio || '16:9'}
                        </span>
                      )}
                    </div>
                    {currentPackImages.length > 1 && (
                      <div className="flex gap-1.5 font-sans w-full">
                        <button
                          onClick={async () => {
                            const prevIdx = (activeImageIndex - 1 + currentPackImages.length) % currentPackImages.length;
                            await onSlideChange(prevIdx);
                          }}
                          className="flex-1 py-1.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[11px] font-bold text-amber-400 cursor-pointer flex items-center justify-center gap-0.5 transition-all"
                        >
                          <ChevronLeft className="w-3 h-3" />
                          <span>Ant</span>
                        </button>
                        <button
                          onClick={async () => {
                            const nextIdx = (activeImageIndex + 1) % currentPackImages.length;
                            await onSlideChange(nextIdx);
                          }}
                          className="flex-1 py-1.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[11px] font-bold text-amber-400 cursor-pointer flex items-center justify-center gap-0.5 transition-all"
                        >
                          <span>Próx</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails list (Vertical) */}
                  {currentPackImages.length > 0 ? (
                    <div className="flex flex-col gap-2 overflow-y-auto py-1 custom-scrollbar flex-1 min-h-0 pr-1">
                      {currentPackImages.map((imgObj, idx) => {
                        const isSelected = idx === activeImageIndex;
                        return (
                          <button
                            key={imgObj.id}
                            onClick={async () => await onSlideChange(idx)}
                            className={`relative w-full aspect-video rounded border overflow-hidden shrink-0 transition-all cursor-pointer ${
                              isSelected ? 'border-amber-400 ring-1 ring-amber-500/40 scale-[1.02]' : 'border-[#2a3449] hover:border-slate-500'
                            }`}
                          >
                            {isYouTubeUrl(imgObj.imageUrl) ? (
                              <img src={getYouTubeThumbnailUrl(imgObj.imageUrl) || ''} className="w-full h-full object-cover" alt="YT" />
                            ) : imgObj.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(imgObj.imageUrl) ? (
                              <video src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" muted playsInline />
                            ) : (
                              <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                            )}
                            <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1.5 rounded text-white font-mono backdrop-blur-sm">
                              {idx + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-[#0a0d14] rounded-lg border border-dashed border-[#2a3449] text-center">
                      <p className="text-[10px] text-slate-500 italic">Pack sem slides.</p>
                    </div>
                  )}
                </div>
              )}

              {/* NPC Voice Trigger Box */}
              <div className="w-[140px] bg-[#121824] border border-[#2a3449] rounded-xl p-3 flex flex-col gap-2 shadow h-fit shrink-0">
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voz de NPC
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate" title={activeScene?.npcName || 'Nenhum NPC'}>
                    {activeScene?.npcName || 'Nenhum NPC'}
                  </div>
                </div>
                <button
                  disabled={!activeScene?.npcAudioUrl}
                  onClick={() => setPlayingNpcVoice(!playingNpcVoice)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeScene?.npcAudioUrl
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                      : 'bg-[#1a2234] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{playingNpcVoice ? 'Pausar' : 'Tocar'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
