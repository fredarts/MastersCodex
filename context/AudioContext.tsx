'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BGMTrack } from '@/lib/types';

interface AudioContextType {
  activeBgm: BGMTrack | null;
  isPlayingBgm: boolean;
  volume: number;
  isMuted: boolean;
  setVolume: (vol: number) => void;
  setIsMuted: (muted: boolean) => void;
  playBgm: (track: BGMTrack) => void;
  pauseBgm: () => void;
  stopBgm: () => void;
  playSfx: (sfxUrl: string, volumeScale?: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBgm, setActiveBgm] = useState<BGMTrack | null>(null);
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Efeito para ajustar o volume instantaneamente quando o volume geral ou mute muda
  useEffect(() => {
    if (audioRef.current && !fadeIntervalRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Cleanup de intervalos e áudio ao desmontar
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Função interna para realizar o fade-out e iniciar a nova música com fade-in
  const transitionToTrack = (newTrack: BGMTrack) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const currentAudio = audioRef.current;
    const fadeDuration = 1000; // 1 segundo
    const steps = 20;
    const stepTime = fadeDuration / steps;
    const targetVol = isMuted ? 0 : volume;

    if (currentAudio && isPlayingBgm) {
      // 1. Iniciar Fade-out
      let currentVol = currentAudio.volume;
      const volStep = currentVol / steps;

      fadeIntervalRef.current = setInterval(() => {
        currentVol = Math.max(0, currentVol - volStep);
        currentAudio.volume = currentVol;

        if (currentVol <= 0) {
          clearInterval(fadeIntervalRef.current!);
          fadeIntervalRef.current = null;
          currentAudio.pause();
          
          // 2. Trocar trilha e iniciar Fade-in
          startNewTrack(newTrack, targetVol);
        }
      }, stepTime);
    } else {
      // Sem áudio tocando anteriormente, inicia direto
      startNewTrack(newTrack, targetVol);
    }
  };

  const startNewTrack = (track: BGMTrack, targetVol: number) => {
    const audio = new Audio(track.url);
    audio.loop = track.isLoop !== false;
    audio.volume = 0; // Inicia em silêncio
    audioRef.current = audio;
    setActiveBgm(track);
    setIsPlayingBgm(true);

    audio.play().then(() => {
      // Executar Fade-in
      let currentVol = 0;
      const volStep = targetVol / 20;
      
      fadeIntervalRef.current = setInterval(() => {
        currentVol = Math.min(targetVol, currentVol + volStep);
        audio.volume = currentVol;

        if (currentVol >= targetVol) {
          clearInterval(fadeIntervalRef.current!);
          fadeIntervalRef.current = null;
        }
      }, 50);
    }).catch(() => {
      setIsPlayingBgm(false);
    });
  };

  const playBgm = (track: BGMTrack) => {
    if (activeBgm?.id === track.id) {
      if (!isPlayingBgm) {
        audioRef.current?.play().catch(() => {});
        setIsPlayingBgm(true);
      }
    } else {
      transitionToTrack(track);
    }
  };

  const pauseBgm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingBgm(false);
    }
  };

  const stopBgm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setActiveBgm(null);
      setIsPlayingBgm(false);
    }
  };

  const playSfx = (sfxUrl: string, volumeScale = 1.0) => {
    const sound = new Audio(sfxUrl);
    sound.volume = (isMuted ? 0 : volume) * volumeScale;
    sound.play().catch(() => {});
  };

  return (
    <AudioContext.Provider value={{
      activeBgm,
      isPlayingBgm,
      volume,
      isMuted,
      setVolume,
      setIsMuted,
      playBgm,
      pauseBgm,
      stopBgm,
      playSfx
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
