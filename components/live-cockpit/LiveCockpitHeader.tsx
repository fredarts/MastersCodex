'use client';

import React from 'react';
import { Tv, Film, Map as MapIcon, Swords, Eye, Radio, Sparkles, Mic } from 'lucide-react';
import { GameScene } from '@/lib/types';

interface LiveCockpitHeaderProps {
  activeScene: GameScene | null;
  liveDisplayMode: 'artwork' | 'map' | 'combat';
  setLiveDisplayMode: (mode: 'artwork' | 'map' | 'combat') => void;
  broadcastToPlayerView: (payload: any) => void;
  onOpenPlayerView: () => void;
  playingNpcVoice: boolean;
  setPlayingNpcVoice: (playing: boolean) => void;
}

export const LiveCockpitHeader: React.FC<LiveCockpitHeaderProps> = ({
  activeScene,
  liveDisplayMode,
  setLiveDisplayMode,
  broadcastToPlayerView,
  onOpenPlayerView,
  playingNpcVoice,
  setPlayingNpcVoice,
}) => {
  return (
    <div className="p-3 bg-[#111622] border-b border-[#2a3449] flex items-center justify-between flex-wrap gap-2 select-none shadow-md">
      {/* Active Scene Title & Type */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100">
              {activeScene ? activeScene.title : 'Nenhuma cena selecionada'}
            </h2>
            {activeScene?.sceneType && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeScene.sceneType}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Cockpit em Tempo Real do Mestre</p>
        </div>
      </div>

      {/* Projection Mode Selectors */}
      <div className="flex items-center gap-1.5 bg-[#090d16] p-1 rounded-xl border border-[#2a3449]">
        <button
          onClick={() => {
            setLiveDisplayMode('artwork');
            broadcastToPlayerView({ mode: 'artwork', scene: activeScene });
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            liveDisplayMode === 'artwork'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          Arte da Cena
        </button>

        <button
          onClick={() => {
            setLiveDisplayMode('map');
            broadcastToPlayerView({ mode: 'map', scene: activeScene });
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            liveDisplayMode === 'map'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          Mapa 2D
        </button>

        <button
          onClick={() => {
            setLiveDisplayMode('combat');
            broadcastToPlayerView({ mode: 'combat', scene: activeScene });
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            liveDisplayMode === 'combat'
              ? 'bg-rose-500 text-slate-950 font-bold shadow-lg'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          BattleGrid 3D
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* NPC Voice Audio Trigger */}
        <button
          onClick={() => {
            setPlayingNpcVoice(!playingNpcVoice);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            playingNpcVoice
              ? 'bg-purple-600 text-white border-purple-400 animate-pulse'
              : 'bg-[#182030] text-purple-300 border-purple-500/30 hover:bg-purple-950/40'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          {playingNpcVoice ? 'Voz NPC Tocando...' : 'Voz NPC Narrativa'}
        </button>

        {/* Player View projection button */}
        <button
          onClick={onOpenPlayerView}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          Tela dos Jogadores
        </button>
      </div>
    </div>
  );
};
