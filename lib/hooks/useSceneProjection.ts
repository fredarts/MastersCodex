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
