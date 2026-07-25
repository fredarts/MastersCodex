'use client';

import React from 'react';
import { QuickAudioPanel } from './QuickAudioPanel';
import { useAudio } from '@/context/AudioContext';

interface LiveCockpitAudioControllerProps {
  campaignId?: string;
  activeBgmCategory: string;
  setActiveBgmCategory: (cat: string) => void;
  playingNpcVoice: boolean;
  setPlayingNpcVoice: (playing: boolean) => void;
}

export const LiveCockpitAudioController: React.FC<LiveCockpitAudioControllerProps> = ({
  activeBgmCategory,
  setActiveBgmCategory,
  playingNpcVoice,
  setPlayingNpcVoice,
}) => {
  return (
    <QuickAudioPanel
      activeBgmCategory={activeBgmCategory}
      setActiveBgmCategory={setActiveBgmCategory}
      playingNpcVoice={playingNpcVoice}
      setPlayingNpcVoice={setPlayingNpcVoice}
    />
  );
};
