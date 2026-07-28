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
  MessageSquare,
  Repeat,
  Plus
} from 'lucide-react';
import { BGMTrack, SFXButton } from '@/lib/types';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';
import { useAudio } from '@/context/AudioContext';
import { useSession } from '@/context/SessionContext';

interface AudioMaestroProps {
  onOpenAudioPanel?: () => void;
}

export const AudioMaestro: React.FC<AudioMaestroProps> = ({ onOpenAudioPanel }) => {
  const { activeScene } = useSession();
  const { 
    activeBgm, 
    isPlayingBgm, 
    volume, 
    isMuted, 
    setVolume, 
    setIsMuted, 
    playBgm, 
    pauseBgm, 
    playSfx,
    toggleBgmLoop,
    isLooping,
    currentTime,
    duration,
    seekBgm,
    resumeBgm
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-16 bg-[#0f141d] border-t border-[#2a3449] px-4 flex items-center justify-between gap-4 z-20 shadow-2xl select-none">
      {/* BGM Player Controls */}
      <div className="flex items-center gap-3 min-w-[280px]">
        {activeBgm ? (
          <button
            onClick={() => isPlayingBgm ? pauseBgm() : resumeBgm()}
            className="w-10 h-10 rounded-xl bg-pink-600 hover:bg-pink-500 text-slate-950 flex items-center justify-center shadow-lg transition-all"
            title={isPlayingBgm ? 'Pausar Trilha Atual' : 'Tocar Trilha Atual'}
          >
            {isPlayingBgm ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-[#161c28] border border-[#2a3449] flex items-center justify-center text-slate-500">
            <Radio className="w-5 h-5" />
          </div>
        )}

        <div className="flex flex-col min-w-[150px] max-w-[200px]">
          <div className="text-[9px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
            Trilha BGM Ativa:
          </div>
          <div className="text-xs font-bold text-slate-100 truncate">
            {activeBgm ? activeBgm.name : 'Nenhuma selecionada'}
          </div>
          {activeBgm && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-mono text-slate-500">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekBgm(parseFloat(e.target.value))}
                className="flex-1 h-1 bg-[#161c28] rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="text-[9px] font-mono text-slate-500">{formatTime(duration)}</span>
            </div>
          )}
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
        {BGM_TRACKS.filter(track => activeScene?.bgmTracks?.includes(track.id)).map((track) => {
          const isActive = activeBgm?.id === track.id;
          const looping = isLooping(track.id);
          return (
            <div key={track.id} className="flex items-center gap-0.5">
              <button
                onClick={() => togglePlayBgm(track)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg text-xs font-semibold transition-all ${
                  isActive && isPlayingBgm
                    ? 'bg-pink-600 text-slate-950 font-bold shadow-md animate-pulse'
                    : 'bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] border-r-0'
                }`}
              >
                {isActive && isPlayingBgm ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                <span>{track.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBgmLoop(track.id);
                }}
                className={`px-1.5 py-1.5 rounded-r-lg text-xs transition-all border ${
                  isActive && isPlayingBgm
                    ? looping
                      ? 'bg-pink-700 text-pink-100 border-pink-800 hover:bg-pink-800'
                      : 'bg-pink-900/60 text-pink-300/50 border-pink-800 hover:bg-pink-800/80'
                    : looping
                      ? 'bg-[#1f2738] text-amber-400 border-[#2a3449] hover:bg-amber-500/20'
                      : 'bg-[#161c28] text-slate-500 border-[#2a3449] hover:bg-[#1f2738] hover:text-slate-400'
                }`}
                title={looping ? 'Loop Ativo — Clique para desativar' : 'Loop Desativado — Clique para ativar'}
              >
                <Repeat className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {onOpenAudioPanel && (
          <button
            onClick={onOpenAudioPanel}
            className="flex items-center justify-center w-8 h-8 ml-1 rounded-lg border border-dashed border-[#2a3449] hover:border-pink-500/50 text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 transition-all"
            title="Adicionar mais Músicas ou SFX no painel"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Instant SFX Soundboard Matrix */}
      <div className="flex items-center gap-1.5 bg-[#161c28] border border-[#2a3449] p-1 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase px-2 hidden lg:inline">Soundboard SFX:</span>
        {SFX_BUTTONS.filter(sfx => activeScene?.sfxShortcuts?.includes(sfx.id)).map((sfx) => {
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
