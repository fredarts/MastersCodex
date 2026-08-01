'use client';

import React from 'react';
import { Eye, Map as MapIcon, Mic, Volume2, Swords, RotateCcw } from 'lucide-react';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useSession } from '@/lib/hooks/useSession';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { toast } from 'sonner';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';
import { LiveCockpitAudioController } from '@/components/live-cockpit/LiveCockpitAudioController';
import { CockpitDungeonMap } from '@/components/live-cockpit/CockpitDungeonMap';
import { GameScene, Combatant } from '@/lib/types';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/imageUtils';

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
  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    setCurrentTurnIndex,
    setRoundCount,
    liveDisplayMode,
    broadcastToPlayerView,
    initializeFromCombatants,
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

  const activeImageIndex = activeScene?.activeImageIndex ?? 0;
  const activeSlideImage = activeScene?.sceneImages?.[activeImageIndex];
  const displayImageUrl = activeSlideImage ? normalizeImageUrl(activeSlideImage.imageUrl) : normalizeImageUrl(activeScene?.imageUrl || '');

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
    
    const confirmReset = window.confirm(
      'Tem certeza que deseja resetar a batalha?\n\nIsso voltará todos os combatentes para suas vidas e posições originais de quando a batalha começou, e retornará para o Turno 1.'
    );
    
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
            <div className="h-full max-w-full w-auto aspect-video bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center">
              {liveDisplayMode === 'combat' ? (
              <ThreeErrorBoundary>
                <BattleGrid3D
                  combatants={combatants}
                  onUpdateCombatants={(updated) => setCombatants(updated)}
                  currentTurnIndex={currentTurnIndex}
                  selectedTargetId={selectedTargetId}
                  onSelectTarget={(target) => {
                    setSelectedTargetId(target?.id);
                    broadcastToPlayerView({ targetId: target?.id });
                  }}
                  onAttackTarget={onAttackFromWidget}
                  interactive={true}
                  isPlacementPhase={isPlacementPhase}
                  setupMode={battleSetupMode}
                  timeOfDayHour={liveTimeOfDayHour}
                  timeOfDayPreset={selectedTimeOfDay}
                  hasFog={liveHasFog}
                  hasRain={liveHasRain}
                  {...(liveEnvironmentSettings || {})}
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
                    
                    const newSettings = { ...(liveEnvironmentSettings || {}), ...env };
                    setLiveEnvironmentSettings(newSettings);

                    broadcastToPlayerView({
                      timeOfDayHour: env.timeOfDayHour,
                      hasFog: env.hasFog,
                      hasRain: env.hasRain,
                      environmentSettings: newSettings
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
                  if (activeScene?.sceneImages && activeScene.sceneImages.length > 0) {
                    return (
                      <MagicShaderSlideshow
                        imageUrl={displayImageUrl}
                        className="w-full h-full"
                      />
                    );
                  }
                  return (
                    <img src={displayImageUrl} alt="Arte ao vivo" className="w-full h-full object-cover animate-fade-in" />
                  );
                })()}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-amber-500/30">
                  <div className="text-xs font-bold text-amber-400 uppercase font-mono">{activeScene?.title}</div>
                  {(() => {
                    const txt = activeSlideImage?.overlayText || activeScene?.sensoryText;
                    return txt ? (
                      <p className="text-xs text-slate-200 mt-1 italic font-serif leading-relaxed line-clamp-2">
                        &ldquo;{txt}&rdquo;
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

          {/* Right Side Panels: Slideshow & NPC Voice */}
          {liveDisplayMode === 'artwork' && (
            <div className="flex flex-row gap-3 shrink-0">
              
              {/* Slideshow DM Controls */}
              {activeScene?.sceneImages && activeScene.sceneImages.length > 1 && (
                <div className="w-[150px] bg-[#121824] border border-[#2a3449] rounded-xl p-3 flex flex-col gap-3 shadow overflow-hidden">
                  <div className="flex flex-col gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono leading-tight">
                      Controle do Slideshow <br/> ({activeImageIndex + 1} de {activeScene.sceneImages.length})
                    </span>
                    <div className="flex gap-1.5 font-sans w-full">
                      <button
                        onClick={async () => {
                          const prevIdx = (activeImageIndex - 1 + activeScene.sceneImages!.length) % activeScene.sceneImages!.length;
                          await onSlideChange(prevIdx);
                        }}
                        className="flex-1 py-1 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[10px] font-bold text-amber-400 cursor-pointer"
                      >
                        Ant
                      </button>
                      <button
                        onClick={async () => {
                          const nextIdx = (activeImageIndex + 1) % activeScene.sceneImages!.length;
                          await onSlideChange(nextIdx);
                        }}
                        className="flex-1 py-1 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[10px] font-bold text-amber-400 cursor-pointer"
                      >
                        Próx
                      </button>
                    </div>
                  </div>

                  {/* Thumbnails list (Vertical) */}
                  <div className="flex flex-col gap-2 overflow-y-auto py-1 custom-scrollbar flex-1 min-h-0 pr-1">
                    {activeScene.sceneImages.map((imgObj, idx) => {
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
                            <img src={getYouTubeThumbnailUrl(imgObj.imageUrl) || ''} className="w-full h-full object-cover" />
                          ) : imgObj.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(imgObj.imageUrl) ? (
                            <video src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] font-bold px-1.5 rounded text-white font-mono backdrop-blur-sm">
                            {idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
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
