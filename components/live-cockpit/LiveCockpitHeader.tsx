'use client';

import React from 'react';
import { Tv, Play, Swords, Map as MapIcon, Image as ImageIcon, Sparkles, Radio } from 'lucide-react';
import { GameScene } from '@/lib/types';

interface LiveCockpitHeaderProps {
  activeScene: GameScene | null;
  liveDisplayMode: 'artwork' | 'map' | 'combat';
  setLiveDisplayMode: (mode: 'artwork' | 'map' | 'combat') => void;
  onOpenPlayerView: () => void;
  onOpenCreateScene: () => void;
}

export const LiveCockpitHeader: React.FC<LiveCockpitHeaderProps> = ({
  activeScene,
  liveDisplayMode,
  setLiveDisplayMode,
  onOpenPlayerView,
  onOpenCreateScene,
}) => {
  return (
    <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-lg shadow-amber-500/5">
          <Tv className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-zinc-100 tracking-wide">Studio Live Cockpit</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> Ao Vivo
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {activeScene ? `Cena Ativa: ${activeScene.title}` : 'Nenhuma cena equipada'}
          </p>
        </div>
      </div>

      {/* Controles de Projeção */}
      <div className="flex items-center gap-2 bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800">
        <button
          onClick={() => setLiveDisplayMode('artwork')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            liveDisplayMode === 'artwork'
              ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Ilustração
        </button>

        <button
          onClick={() => setLiveDisplayMode('map')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            liveDisplayMode === 'map'
              ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" /> Mapa Tático
        </button>

        <button
          onClick={() => setLiveDisplayMode('combat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            liveDisplayMode === 'combat'
              ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Swords className="w-3.5 h-3.5" /> Grid 3D / Combate
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCreateScene}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nova Cena
        </button>

        <button
          onClick={onOpenPlayerView}
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105 active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Tela dos Jogadores
        </button>
      </div>
    </div>
  );
};
