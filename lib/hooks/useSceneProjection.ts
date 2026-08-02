'use client';

import { useCallback } from 'react';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { GameScene } from '@/lib/types';

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
    broadcastToPlayerView({
      type: 'SET_ACTIVE_SCENE',
      sceneId: scene.id,
      title: scene.title,
      imageUrl: scene.imageUrl,
      sensoryText: scene.sensoryText,
      sceneImages: scene.sceneImages,
      activeImageIndex: scene.activeImageIndex,
      timeOfDay: scene.timeOfDay,
      timeOfDayHour: scene.timeOfDayHour,
      hasFog: scene.hasFog,
      hasRain: scene.hasRain,
      floorTextureUrl: scene.floorTextureUrl,
      associatedMapId: scene.associatedMapId,
      associatedMapIds: scene.associatedMapIds,
      payload: scene,
    });
  }, [broadcastToPlayerView]);

  return {
    liveDisplayMode,
    setLiveDisplayMode,
    setProjectionMode,
    toggleProjectionMode,
    projectSceneToPlayerView,
    projectedScene,
  };
}
