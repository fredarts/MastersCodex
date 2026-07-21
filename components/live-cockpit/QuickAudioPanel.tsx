'use client';

import React, { useState } from 'react';
import { Volume2, Swords, Flame, Sparkles, Coins, DoorOpen, Skull, Music } from 'lucide-react';
import { SFX_BUTTONS } from '@/lib/srd-data';
import { SFXButton } from '@/lib/types';

export const QuickAudioPanel: React.FC = () => {
  const [activeSfxId, setActiveSfxId] = useState<string | null>(null);

  const playSfx = (sfx: SFXButton) => {
    setActiveSfxId(sfx.id);
    try {
      const sound = new Audio(sfx.url);
      sound.volume = 0.7;
      sound.play().catch(() => {});
    } catch (e) {}
    setTimeout(() => setActiveSfxId(null), 1000);
  };

  const getSfxIcon = (iconName: string) => {
    switch (iconName) {
      case 'Swords': return <Swords className="w-3.5 h-3.5 text-amber-400" />;
      case 'Flame': return <Flame className="w-3.5 h-3.5 text-rose-500" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'Coins': return <Coins className="w-3.5 h-3.5 text-amber-300" />;
      case 'DoorOpen': return <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Skull': return <Skull className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <Music className="w-3.5 h-3.5 text-slate-300" />;
    }
  };

  return (
    <div className="p-3 bg-[#111622] border-t border-[#2a3449] select-none flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
        <Volume2 className="w-4 h-4 text-pink-400" />
        <span>Efeitos Sonoros Rápidos:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {SFX_BUTTONS.map((sfx) => (
          <button
            key={sfx.id}
            onClick={() => playSfx(sfx)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeSfxId === sfx.id
                ? 'bg-pink-500 text-white border-pink-400 scale-105 shadow-md'
                : 'bg-[#182030] text-slate-200 border-[#2a3449] hover:bg-[#202b40] hover:border-slate-500'
            }`}
          >
            {getSfxIcon(sfx.iconName)}
            {sfx.name}
          </button>
        ))}
      </div>
    </div>
  );
};
