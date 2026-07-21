'use client';

import React from 'react';
import { Music, Volume2, Mic, Play, Pause } from 'lucide-react';

interface QuickAudioPanelProps {
  activeBgmCategory: string;
  setActiveBgmCategory: (cat: string) => void;
  playingNpcVoice: boolean;
  setPlayingNpcVoice: (playing: boolean) => void;
}

const BGM_CATEGORIES = [
  { id: 'taverna', label: '🍺 Taverna' },
  { id: 'combate', label: '⚔️ Combate' },
  { id: 'masmorra', label: '🏰 Masmorra' },
  { id: 'tensao', label: '👁️ Tensão' },
  { id: 'exploracao', label: '🌲 Exploração' },
];

export const QuickAudioPanel: React.FC<QuickAudioPanelProps> = ({
  activeBgmCategory,
  setActiveBgmCategory,
  playingNpcVoice,
  setPlayingNpcVoice,
}) => {
  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 space-y-3 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
          <Music className="w-4 h-4 text-indigo-400" />
          <span>Áudio Maestro Rápido</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">BGM Player</span>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {BGM_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveBgmCategory(cat.id)}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeBgmCategory === cat.id
                ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20 scale-105'
                : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Mic className="w-3.5 h-3.5 text-amber-400" />
          <span>Voz Narração NPC:</span>
        </div>

        <button
          onClick={() => setPlayingNpcVoice(!playingNpcVoice)}
          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            playingNpcVoice
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {playingNpcVoice ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {playingNpcVoice ? 'Pausar Voz' : 'Tocar Voz NPC'}
        </button>
      </div>
    </div>
  );
};
