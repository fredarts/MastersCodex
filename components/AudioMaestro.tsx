'use client';

import React, { useState } from 'react';
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
  Radio,
  Heart,
  Shield,
  Zap,
  XCircle,
  Smile,
  Sun,
  Hand,
  Wind,
  Moon,
  EyeOff,
  ShieldAlert,
  Hammer,
  Sword,
  Target,
  Gem,
  Footprints,
  Users,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import { BGMTrack, SFXButton } from '@/lib/types';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';
import { useAudio } from '@/context/AudioContext';

export const AudioMaestro: React.FC = () => {
  const { 
    activeBgm, 
    isPlayingBgm, 
    volume, 
    isMuted, 
    setVolume, 
    setIsMuted, 
    playBgm, 
    pauseBgm, 
    playSfx 
  } = useAudio();

  const [activeSfxId, setActiveSfxId] = useState<string | null>(null);

  const togglePlayBgm = (track: BGMTrack) => {
    if (activeBgm?.id === track.id && isPlayingBgm) {
      pauseBgm();
    } else {
      playBgm(track);
    }
  };

  const handlePlaySfx = (sfx: SFXButton) => {
    setActiveSfxId(sfx.id);
    playSfx(sfx.url);
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
      case 'Heart': return <Heart className="w-4 h-4 text-rose-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'XCircle': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Smile': return <Smile className="w-4 h-4 text-amber-400" />;
      case 'Sun': return <Sun className="w-4 h-4 text-yellow-300" />;
      case 'Hand': return <Hand className="w-4 h-4 text-purple-300" />;
      case 'Wind': return <Wind className="w-4 h-4 text-sky-400" />;
      case 'Moon': return <Moon className="w-4 h-4 text-indigo-300" />;
      case 'EyeOff': return <EyeOff className="w-4 h-4 text-slate-400" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-orange-400" />;
      case 'Hammer': return <Hammer className="w-4 h-4 text-slate-400" />;
      case 'Sword': return <Sword className="w-4 h-4 text-slate-300" />;
      case 'Target': return <Target className="w-4 h-4 text-red-400" />;
      case 'Gem': return <Gem className="w-4 h-4 text-teal-400" />;
      case 'Footprints': return <Footprints className="w-4 h-4 text-amber-600" />;
      case 'Users': return <Users className="w-4 h-4 text-sky-300" />;
      case 'Megaphone': return <Megaphone className="w-4 h-4 text-orange-500" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4 text-slate-400" />;
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
        {SFX_BUTTONS.slice(0, 6).map((sfx) => {
          const isTriggered = activeSfxId === sfx.id;
          return (
            <button
              key={sfx.id}
              onClick={() => handlePlaySfx(sfx)}
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
