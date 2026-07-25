'use client';

import { useState, useEffect } from 'react';
import { useAudio } from '@/context/AudioContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';

export function useLiveCockpitAudio(campaignId?: string) {
  const { playBgm, pauseBgm, activeBgm, isPlayingBgm, playSfx } = useAudio();
  const [customAudios, setCustomAudios] = useState<any[]>([]);
  const [activeBgmCategory, setActiveBgmCategory] = useState<string>('taverna');

  useEffect(() => {
    if (campaignId && isSupabaseConfigured()) {
      supabase
        .from('campaign_audio_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .then(({ data, error }) => {
          if (!error && data) {
            setCustomAudios(data);
          }
        });
    }
  }, [campaignId]);

  const srdBgms = BGM_TRACKS.map((t) => ({ ...t, isCustom: false }));
  const customBgms = customAudios
    .filter((a) => a.type === 'bgm')
    .map((a) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      category: a.category,
      isLoop: a.is_loop,
      isCustom: true,
    }));
  const allBgmTracks = [...srdBgms, ...customBgms];

  const srdSfxs = SFX_BUTTONS.map((s) => ({ ...s, isLoop: false, isCustom: false }));
  const customSfxs = customAudios
    .filter((a) => a.type === 'sfx')
    .map((a) => ({
      id: a.id,
      name: a.name,
      iconName: a.icon_name || 'Music',
      url: a.url,
      category: a.category,
      isCustom: true,
    }));
  const allSfxTracks = [...srdSfxs, ...customSfxs];

  return {
    allBgmTracks,
    allSfxTracks,
    activeBgmCategory,
    setActiveBgmCategory,
    playBgm,
    pauseBgm,
    activeBgm,
    isPlayingBgm,
    playSfx,
  };
}
