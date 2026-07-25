'use client';

import React from 'react';
import { GameScene } from '@/lib/types';
import { useAudio } from '@/context/AudioContext';
import { Music, Volume2 } from 'lucide-react';

interface LiveCockpitAudioControllerProps {
  activeScene: GameScene | null;
  allBgmTracks: any[];
  allSfxTracks: any[];
}

export const LiveCockpitAudioController: React.FC<LiveCockpitAudioControllerProps> = ({
  activeScene,
  allBgmTracks,
  allSfxTracks,
}) => {
  const { playBgm, pauseBgm, activeBgm, isPlayingBgm, playSfx } = useAudio();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* BGM Active Scene Playlist */}
      <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl space-y-2">
        <div className="text-[10px] font-bold text-pink-400 uppercase font-mono flex items-center gap-1">
          <Music className="w-3.5 h-3.5" /> BGM da Cena Ativa
        </div>
        
        {(!activeScene?.bgmTracks || activeScene.bgmTracks.length === 0) ? (
          <div className="text-[10px] text-slate-500 italic">Nenhuma música configurada.</div>
        ) : (
          <div className="flex flex-col gap-1">
            {activeScene.bgmTracks.map(trackId => {
              const track = allBgmTracks.find(t => t.id === trackId);
              if (!track) return null;
              const isActive = activeBgm?.id === track.id;
              return (
                <button
                  key={trackId}
                  onClick={() => {
                    if (isActive && isPlayingBgm) {
                      pauseBgm();
                    } else {
                      playBgm(track);
                    }
                  }}
                  className={`w-full py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isActive && isPlayingBgm
                      ? 'bg-pink-600 text-slate-950 font-bold shadow-md animate-pulse'
                      : 'bg-[#0a0d14] hover:bg-[#1a2233] text-slate-300 border border-[#2a3449]'
                  }`}
                >
                  <span className="truncate mr-2">{track.name}</span>
                  <span className="shrink-0 text-[10px] font-bold">{isActive && isPlayingBgm ? 'PAUSAR' : 'TOCAR'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Soundboard SFX da Cena */}
      <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl space-y-2">
        <div className="text-[10px] font-bold text-amber-400 uppercase font-mono flex items-center gap-1">
          <Volume2 className="w-3.5 h-3.5" /> SFX Rápidos da Cena
        </div>
        
        {(!activeScene?.sfxShortcuts || activeScene.sfxShortcuts.length === 0) ? (
          <div className="text-[10px] text-slate-500 italic">Nenhum efeito configurado.</div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {activeScene.sfxShortcuts.map(sfxId => {
              const sfx = allSfxTracks.find(s => s.id === sfxId);
              if (!sfx) return null;
              return (
                <button
                  key={sfxId}
                  onClick={() => playSfx(sfx.url)}
                  className="py-1 px-2 rounded-lg text-[10px] font-bold bg-[#0a0d14] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-[#2a3449] transition-all truncate text-center cursor-pointer"
                  title={`Disparar Efeito: ${sfx.name}`}
                >
                  {sfx.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
