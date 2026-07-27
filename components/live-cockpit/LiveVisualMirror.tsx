'use client';

import React from 'react';
import { Eye, Map as MapIcon, Mic, Volume2 } from 'lucide-react';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useSession } from '@/lib/hooks/useSession';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';
import { LiveCockpitAudioController } from '@/components/live-cockpit/LiveCockpitAudioController';
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
  const { activeScene } = useSession();
  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    liveDisplayMode,
    broadcastToPlayerView,
  } = useLiveCockpit();

  const {
    isPlacementPhase,
    battleSetupMode,
    liveTimeOfDayHour,
    selectedTimeOfDay,
    liveHasFog,
    liveHasRain,
    liveFloorTextureUrl,
    playingNpcVoice,
    activeBgmCategory,
    selectedTargetId,
    setSelectedTargetId,
    setSelectedTimeOfDay,
    setLiveTimeOfDayHour,
    setLiveHasFog,
    setLiveHasRain,
    setLiveFloorTextureUrl,
    setIsPlacementPhase,
    setPlayingNpcVoice,
    setActiveBgmCategory,
  } = useLiveCockpitStudioStore();

  const activeImageIndex = activeScene?.activeImageIndex ?? 0;
  const activeSlideImage = activeScene?.sceneImages?.[activeImageIndex];
  const displayImageUrl = activeSlideImage ? normalizeImageUrl(activeSlideImage.imageUrl) : normalizeImageUrl(activeScene?.imageUrl || '');

  return (
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
                  onAttackTarget={onAttackFromWidget}
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
                    await onSlideChange(prevIdx);
                  }}
                  className="px-2 py-0.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] rounded text-[10px] font-bold text-amber-400 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  onClick={async () => {
                    const nextIdx = (activeImageIndex + 1) % activeScene.sceneImages!.length;
                    await onSlideChange(nextIdx);
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
                    onClick={async () => await onSlideChange(idx)}
                    className={`relative w-10 h-10 rounded border overflow-hidden shrink-0 transition-all cursor-pointer ${
                      isSelected ? 'border-amber-400 ring-1 ring-amber-500/40 scale-105' : 'border-[#2a3449] hover:border-slate-500'
                    }`}
                  >
                    {isYouTubeUrl(imgObj.imageUrl) ? (
                      <img src={getYouTubeThumbnailUrl(imgObj.imageUrl) || ''} className="w-full h-full object-cover" />
                    ) : imgObj.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(imgObj.imageUrl) ? (
                      <video src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" />
                    )}
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

          {/* Media & Soundboard Panel (Modular Component) */}
          <LiveCockpitAudioController
            campaignId={activeCampaign?.id}
            activeBgmCategory={activeBgmCategory}
            setActiveBgmCategory={setActiveBgmCategory}
            playingNpcVoice={playingNpcVoice}
            setPlayingNpcVoice={setPlayingNpcVoice}
          />
        </div>
      </div>
    </div>
  );
};
