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

  const activeAspectRatio = activeSlideImage?.aspectRatio || currentPack?.aspectRatio || activeScene?.defaultAspectRatio || '16:9';

  const getAspectClass = (aspect: string) => {
    switch (aspect) {
      case '4:3': return 'aspect-[4/3]';
      case '1:1': return 'aspect-square';
      case '9:16': return 'aspect-[9/16]';
      case '16:9':
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden border-r border-[#2a3449]">
      <div className="flex-1 p-3 sm:p-4 flex flex-col min-h-0 gap-3 overflow-hidden">
        {/* Main Display Preview Container */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden">
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            className={`h-full max-w-full w-auto ${liveDisplayMode === 'artwork' ? getAspectClass(activeAspectRatio) : 'aspect-video'} bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center`}
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

        {/* Bottom Horizontal Filmstrip Timeline (Artwork Mode) */}
        {liveDisplayMode === 'artwork' && (currentPackImages.length > 0 || slidePacks.length > 1) && (
          <div className="h-16 shrink-0 bg-[#121824]/95 border border-[#2a3449] rounded-2xl px-3 py-1.5 flex items-center gap-3 shadow-xl overflow-hidden select-none">
            
            {/* Pack Selector & Info */}
            <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-[#2a3449]/70">
              {slidePacks.length > 1 ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Pack:
                  </span>
                  <select
                    value={activePackId}
                    onChange={(e) => handlePackChange(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500/40 hover:border-amber-400 focus:border-amber-400 text-amber-300 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    {slidePacks.map((pack) => (
                      <option key={pack.id} value={pack.id} className="bg-[#121824] text-slate-200">
                        {pack.title} ({pack.images?.length || 0})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {currentPack?.title || 'Pack de Slides'}
                  </span>
                  <span className="text-[10.5px] font-bold text-slate-300 font-mono">
                    {currentPackImages.length} {currentPackImages.length === 1 ? 'slide' : 'slides'}
                  </span>
                </div>
              )}

              <div className="flex flex-col items-end pl-1">
                <span className="text-[9px] font-mono text-slate-400">
                  {currentPackImages.length > 0 ? `${activeImageIndex + 1}/${currentPackImages.length}` : '0/0'}
                </span>
                <span className="text-[8px] bg-[#0a0d14] text-amber-400 px-1 py-0.2 rounded font-mono border border-[#2a3449]">
                  {activeAspectRatio}
                </span>
              </div>
            </div>

            {/* Navigation Arrow Left */}
            {currentPackImages.length > 1 && (
              <button
                onClick={async () => {
                  const prevIdx = (activeImageIndex - 1 + currentPackImages.length) % currentPackImages.length;
                  await onSlideChange(prevIdx);
                }}
                className="h-10 w-8 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/40 rounded-xl text-amber-400 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-inner"
                title="Slide Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Horizontal Filmstrip of Slide Thumbnails */}
            <div className="flex-1 flex items-center gap-2 overflow-x-auto custom-scrollbar h-full py-0.5 px-1 min-w-0">
              {currentPackImages.map((imgObj, idx) => {
                const isSelected = idx === activeImageIndex;
                return (
                  <button
                    key={imgObj.id}
                    onClick={async () => await onSlideChange(idx)}
                    className={`relative h-full aspect-video rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-500/40 scale-105 z-10 shadow-lg'
                        : 'border-[#2a3449] hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {isYouTubeUrl(imgObj.imageUrl) ? (
                      <img src={getYouTubeThumbnailUrl(imgObj.imageUrl) || ''} className="w-full h-full object-cover" alt="YT" />
                    ) : imgObj.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(imgObj.imageUrl) ? (
                      <video src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 bg-black/85 text-[8.5px] font-bold px-1 rounded text-white font-mono backdrop-blur-sm">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Arrow Right */}
            {currentPackImages.length > 1 && (
              <button
                onClick={async () => {
                  const nextIdx = (activeImageIndex + 1) % currentPackImages.length;
                  await onSlideChange(nextIdx);
                }}
                className="h-10 w-8 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/40 rounded-xl text-amber-400 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-inner"
                title="Próximo Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
