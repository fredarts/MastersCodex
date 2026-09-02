'use client';

import { useCallback } from 'react';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { GameScene } from '@/lib/types';

import { resolveCurrentSceneImage } from '@/lib/imageUtils';

export function useSceneProjection() {
  const {
    liveDisplayMode,
    setLiveDisplayMode,
    broadcastToPlayerView,
    projectedScene,
  } = useLiveCockpit();

  const setProjectionMode = useCallback((mode: 'map' | 'artwork' | 'combat') => {
    setLiveDisplayMode(mode);
    try {
      localStorage.setItem('codex_live_display_mode', mode);
    } catch (_e) {}
  }, [setLiveDisplayMode]);

  const toggleProjectionMode = useCallback(() => {
    const modes: Array<'map' | 'artwork' | 'combat'> = ['map', 'artwork', 'combat'];
    const currentIndex = modes.indexOf(liveDisplayMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setProjectionMode(nextMode);
  }, [liveDisplayMode, setProjectionMode]);

  const projectSceneToPlayerView = useCallback((scene: GameScene) => {
    const targetMode: 'artwork' | 'map' | 'combat' = scene.isBattleStarted ? 'combat' : (liveDisplayMode || 'artwork');
    setLiveDisplayMode(targetMode);

    const resolved = resolveCurrentSceneImage(scene);
    const rawImageUrl = resolved?.imageUrl || scene.imageUrl || '';

    broadcastToPlayerView({
      type: 'SET_ACTIVE_SCENE',
      mode: targetMode,
      sceneId: scene.id,
      title: scene.title,
      imageUrl: rawImageUrl,
      currentImageUrl: rawImageUrl,
      sensoryText: scene.sensoryText,
      sceneImages: scene.sceneImages,
      slidePacks: scene.slidePacks || scene.environmentSettings?.slide_packs,
      activeSlidePackId: scene.activeSlidePackId || scene.environmentSettings?.active_slide_pack_id,
      activeImageIndex: scene.activeImageIndex ?? 0,
      timeOfDay: scene.timeOfDay,
      timeOfDayHour: scene.timeOfDayHour,
      hasFog: scene.hasFog,
      hasRain: scene.hasRain,
      floorTextureUrl: scene.floorTextureUrl,
      associatedMapId: scene.associatedMapId,
      associatedMapIds: scene.associatedMapIds,
      environmentSettings: scene.environmentSettings,
      isBattleStarted: Boolean(scene.isBattleStarted),
      dungeonExplorationStarted: Boolean(scene.isDungeonExplorationStarted),
      payload: {
        ...scene,
        imageUrl: rawImageUrl,
        currentImageUrl: rawImageUrl,
      },
    });
  }, [broadcastToPlayerView, setLiveDisplayMode, liveDisplayMode]);

  return {
    liveDisplayMode,
    setLiveDisplayMode,
    setProjectionMode,
    toggleProjectionMode,
    projectSceneToPlayerView,
    projectedScene,
  };
}
