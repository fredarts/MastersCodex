'use client';

import React from 'react';
import { GameScene } from '@/lib/types';
import { Sparkles, Image as ImageIcon, Volume2, ShieldAlert } from 'lucide-react';

interface SceneProjectionSelectorProps {
  scenes: GameScene[];
  activeScene: GameScene | null;
  onSelectScene: (scene: GameScene) => void;
  onOpenCreateScene: () => void;
}

export const SceneProjectionSelector: React.FC<SceneProjectionSelectorProps> = ({
  scenes,
  activeScene,
  onSelectScene,
  onOpenCreateScene,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-400" /> Cenas da Sessão ({scenes.length})
        </h3>
        <button
          onClick={onOpenCreateScene}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" /> + Criar Cena
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
        {scenes.map((scene) => {
          const isActive = activeScene?.id === scene.id;
          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene)}
              className={`p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500 text-slate-100 shadow-md shadow-amber-500/10'
                  : 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold truncate">{scene.title}</div>
              <div className="text-[10px] text-slate-400 capitalize mt-0.5 flex items-center justify-between">
                <span>{scene.sceneType}</span>
                {scene.bgmCategory && (
                  <span className="flex items-center gap-0.5 text-amber-400/80">
                    <Volume2 className="w-2.5 h-2.5" /> {scene.bgmCategory}
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
