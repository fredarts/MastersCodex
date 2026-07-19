'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Swords, 
  Flame, 
  Sparkles, 
  Coins, 
  DoorOpen, 
  Skull,
  Music,
  Radio
} from 'lucide-react';
import { BGMTrack, SFXButton } from '@/lib/types';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';

export const AudioMaestro: React.FC = () => {
  const [activeBgm, setActiveBgm] = useState<BGMTrack | null>(null);
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSfxId, setActiveSfxId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeBgm) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(activeBgm.url);
      audio.loop = activeBgm.isLoop;
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;
      if (isPlayingBgm) {
        audio.play().catch(() => setIsPlayingBgm(false));
      }
    }
  }, [activeBgm]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayBgm = (track: BGMTrack) => {
    if (activeBgm?.id === track.id) {
      if (isPlayingBgm) {
        audioRef.current?.pause();
        setIsPlayingBgm(false);
      } else {
        audioRef.current?.play().catch(() => {});
        setIsPlayingBgm(true);
      }
    } else {
      setActiveBgm(track);
      setIsPlayingBgm(true);
    }
  };

  const playSfx = (sfx: SFXButton) => {
    setActiveSfxId(sfx.id);
    const sound = new Audio(sfx.url);
    sound.volume = isMuted ? 0 : volume;
    sound.play().catch(() => {});
    setTimeout(() => setActiveSfxId(null), 1000);
  };

  const getSfxIcon = (iconName: string) => {
    switch (iconName) {
      case 'Swords': return <Swords className="w-4 h-4 text-amber-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Coins': return <Coins className="w-4 h-4 text-amber-300" />;
      case 'DoorOpen': return <DoorOpen className="w-4 h-4 text-cyan-400" />;
      case 'Skull': return <Skull className="w-4 h-4 text-emerald-400" />;
      default: return <Music className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <footer className="h-16 bg-[#0f141d] border-t border-[#2a3449] px-4 flex items-center justify-between gap-4 z-20 shadow-2xl select-none">
      {/* BGM Player Controls */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
          <Radio className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
            Trilha BGM Ativa:
          </div>
          <div className="text-xs font-bold text-slate-100 truncate max-w-[160px]">
            {activeBgm ? activeBgm.name : 'Nenhuma selecionada'}
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5 ml-2">
          <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-slate-200">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-16 accent-amber-500 bg-[#161c28] h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* BGM Quick Loop Buttons */}
      <div className="hidden md:flex items-center gap-1.5">
        {BGM_TRACKS.map((track) => {
          const isActive = activeBgm?.id === track.id;
          return (
            <button
              key={track.id}
              onClick={() => togglePlayBgm(track)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive && isPlayingBgm
                  ? 'bg-pink-600 text-slate-950 font-bold shadow-md animate-pulse'
                  : 'bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449]'
              }`}
            >
              {isActive && isPlayingBgm ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
              <span>{track.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Instant SFX Soundboard Matrix */}
      <div className="flex items-center gap-1.5 bg-[#161c28] border border-[#2a3449] p-1 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase px-2 hidden lg:inline">Soundboard SFX:</span>
        {SFX_BUTTONS.map((sfx) => {
          const isTriggered = activeSfxId === sfx.id;
          return (
            <button
              key={sfx.id}
              onClick={() => playSfx(sfx)}
              className={`p-1.5 md:px-2.5 md:py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                isTriggered
                  ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg'
                  : 'bg-[#0f141d] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-[#2a3449]'
              }`}
              title={`Efeito Sonoro: ${sfx.name}`}
            >
              {getSfxIcon(sfx.iconName)}
              <span className="hidden xl:inline">{sfx.name}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};
