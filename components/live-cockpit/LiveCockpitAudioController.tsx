'use client';

import React, { useState } from 'react';
import { QuickAudioPanel } from '@/components/live-cockpit/QuickAudioPanel';

interface LiveCockpitAudioControllerProps {
  campaignId?: string;
}

export const LiveCockpitAudioController: React.FC<LiveCockpitAudioControllerProps> = () => {
  const [activeBgmCategory, setActiveBgmCategory] = useState<string>('taverna');
  const [playingNpcVoice, setPlayingNpcVoice] = useState<boolean>(false);

  return (
    <QuickAudioPanel
      activeBgmCategory={activeBgmCategory}
      setActiveBgmCategory={setActiveBgmCategory}
      playingNpcVoice={playingNpcVoice}
      setPlayingNpcVoice={setPlayingNpcVoice}
    />
  );
};
