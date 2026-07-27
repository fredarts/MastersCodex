'use client';

import React, { useEffect, useRef } from 'react';
import { Swords, Clock, FileText, Bell } from 'lucide-react';

interface PlayerTurnBannerProps {
  isMyTurn: boolean;
  characterName: string;
  currentActorName?: string;
  onOpenSheet: () => void;
}

export const PlayerTurnBanner: React.FC<PlayerTurnBannerProps> = ({
  isMyTurn,
  characterName,
  currentActorName,
  onOpenSheet,
}) => {
  const prevIsMyTurnRef = useRef<boolean>(false);

  // Som de notificação via Web Audio API (Sino Medieval sintetizado)
  const playTurnChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.85);
    } catch (e) {
      console.warn('AudioContext chime failed:', e);
    }
  };

  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      // Toca o sino de notificação
      playTurnChime();

      // Vibração no dispositivo mobile (se suportado)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch (e) {}
      }
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  if (isMyTurn) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 border-b-2 border-amber-300 px-4 py-2.5 shadow-2xl flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-950/40 border border-amber-300/60 flex items-center justify-center text-amber-200 shrink-0">
            <Swords className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-slate-950/80 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-400/40">
                SUA VEZ NO COMBATE
              </span>
              <Bell className="w-3.5 h-3.5 text-slate-950 animate-ping" />
            </div>
            <h3 className="text-sm font-black text-slate-950 leading-tight">
              🗡️ {characterName.toUpperCase()}, É O SEU TURNO DE AGIR!
            </h3>
          </div>
        </div>

        <button
          onClick={onOpenSheet}
          className="flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-amber-300 font-extrabold px-4 py-2 rounded-xl text-xs shadow-xl border border-amber-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Abrir Ficha & Executar Ação</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#121722]/90 border-b border-[#2a3449] px-4 py-1.5 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
        <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        <span>Turno Atual:</span>
        <strong className="text-cyan-300 font-bold">{currentActorName || 'Outro Combatente'}</strong>
      </div>

      <button
        onClick={onOpenSheet}
        className="flex items-center gap-1.5 text-slate-400 hover:text-amber-300 bg-[#0a0d14] border border-[#2a3449] hover:border-amber-500/40 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
      >
        <FileText className="w-3 h-3 text-amber-400" />
        <span>Ver Minha Ficha</span>
      </button>
    </div>
  );
};
