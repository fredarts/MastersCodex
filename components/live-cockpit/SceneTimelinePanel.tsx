'use client';

import React from 'react';
import {
  Film,
  Play,
  Plus,
  ChevronRight,
  ChevronLeft,
  Swords,
  MessageSquare,
  Compass,
  Beer,
  Edit3,
  Check,
} from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { GameScene, SceneType } from '@/lib/types';

interface SceneTimelinePanelProps {
  onFireSceneLive: (scene: GameScene) => void;
}

const getSceneIcon = (type: SceneType) => {
  switch (type) {
    case 'social':
      return <Beer className="w-3.5 h-3.5 text-amber-400" />;
    case 'dialogue':
      return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
    case 'combat':
      return <Swords className="w-3.5 h-3.5 text-rose-400" />;
    case 'exploration':
      return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
    default:
      return <Film className="w-3.5 h-3.5 text-purple-400" />;
  }
};

export const SceneTimelinePanel: React.FC<SceneTimelinePanelProps> = ({
  onFireSceneLive,
}) => {
  const { scenes, activeScene, updateScene } = useSession();
  const {
    isTimelineCollapsed,
    toggleTimeline,
    setShowCreateSceneModal,
    editingSceneId,
    setEditingSceneId,
    editedSceneTitle,
    setEditedSceneTitle,
  } = useLiveCockpitStudioStore();

  return (
    <div
      className={`${isTimelineCollapsed ? 'w-16' : 'w-72'} bg-[#0c0f17] border-r border-[#2a3449] flex flex-col justify-between overflow-hidden transition-all duration-300 flex-shrink-0 relative z-10 tablet-landscape-sidebar`}
    >
      <div
        className={`p-3 border-b border-[#2a3449] flex items-center ${isTimelineCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} bg-[#121824]/50`}
      >
        {!isTimelineCollapsed && (
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5 truncate">
            <Film className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="truncate">Timeline ({scenes.length})</span>
          </span>
        )}
        <div className={`flex items-center gap-1 ${isTimelineCollapsed ? 'flex-col' : ''}`}>
          <button
            onClick={() => setShowCreateSceneModal(true)}
            className="p-1 text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors cursor-pointer"
            title="Nova Cena"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTimeline}
            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors cursor-pointer"
            title={isTimelineCollapsed ? 'Expandir Timeline de Cenas' : 'Retrair Timeline de Cenas'}
          >
            {isTimelineCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${isTimelineCollapsed ? 'p-2 space-y-3' : 'p-3 space-y-2'}`}>
        {scenes.length === 0 ? (
          <div
            className={`p-4 text-center text-slate-500 text-xs border border-dashed border-[#2a3449] rounded-xl ${isTimelineCollapsed ? 'text-[10px] p-2' : ''}`}
          >
            {isTimelineCollapsed
              ? 'Vazio'
              : 'Nenhuma cena criada nesta sessão. Crie uma cena para disparar recursos visuais.'}
          </div>
        ) : (
          scenes.map((sc, idx) => {
            const isActive = activeScene?.id === sc.id;
            const isEditingThis = editingSceneId === sc.id;

            if (isTimelineCollapsed) {
              return (
                <div
                  key={`collapsed-${sc.id}-${idx}`}
                  onClick={() => onFireSceneLive(sc)}
                  title={`Cena #${idx + 1}: ${sc.title} (${sc.sceneType})${isActive ? ' [AO VIVO]' : ''}`}
                  className={`w-11 h-13 mx-auto p-1.5 rounded-xl border transition-all flex flex-col items-center justify-between cursor-pointer group relative ${
                    isActive
                      ? 'bg-gradient-to-b from-purple-950 via-[#161c28] to-[#121824] border-emerald-400 shadow-md ring-2 ring-emerald-500/50'
                      : 'bg-[#161c28] border-[#2a3449] hover:bg-[#1f2738] hover:border-purple-500/40'
                  }`}
                >
                  <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    #{idx + 1}
                  </span>
                  <div className="my-0.5">{getSceneIcon(sc.sceneType)}</div>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-amber-400 transition-colors"></span>
                  )}
                </div>
              );
            }

            return (
              <div
                key={`${sc.id}-${idx}`}
                className={`p-3 rounded-xl border transition-all space-y-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-950/60 via-[#161c28] to-[#121824] border-purple-500 shadow-lg ring-1 ring-purple-500/40'
                    : 'bg-[#161c28] border-[#2a3449] hover:bg-[#1f2738]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate flex-1 pr-2">
                    <span className="text-[10px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                    {getSceneIcon(sc.sceneType)}
                    {isEditingThis ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="text"
                          autoFocus
                          value={editedSceneTitle}
                          onChange={(e) => setEditedSceneTitle(e.target.value)}
                          className="bg-[#0a0d14] border border-purple-500 rounded px-1.5 py-0.5 text-xs text-slate-100 font-bold focus:outline-none w-full"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (editedSceneTitle.trim()) await updateScene({ ...sc, title: editedSceneTitle.trim() });
                              setEditingSceneId(null);
                            }
                            if (e.key === 'Escape') setEditingSceneId(null);
                          }}
                        />
                        <button
                          onClick={async () => {
                            if (editedSceneTitle.trim()) await updateScene({ ...sc, title: editedSceneTitle.trim() });
                            setEditingSceneId(null);
                          }}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 truncate group flex-1">
                        <span className="text-xs font-bold text-slate-100 truncate">{sc.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSceneId(sc.id);
                            setEditedSceneTitle(sc.title);
                          }}
                          className="p-0.5 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                          title="Editar Nome da Cena"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isActive && !isEditingThis && (
                    <span className="text-[9px] font-black uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded animate-pulse">
                      AO VIVO
                    </span>
                  )}
                </div>

                {/* Scene Media Capabilities Indicators */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  {sc.imageUrl && <span className="text-purple-300 flex items-center gap-0.5">🖼️ Imagem</span>}
                  {sc.npcAudioUrl && <span className="text-cyan-300 flex items-center gap-0.5">🎙️ Voz NPC</span>}
                  {sc.combatants && sc.combatants.length > 0 && (
                    <span className="text-rose-300 flex items-center gap-0.5">⚔️ {sc.combatants.length} Inimigos</span>
                  )}
                </div>

                {/* Trigger Live Button */}
                <button
                  onClick={() => onFireSceneLive(sc)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400'
                      : 'bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-200'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? 'CENA TRANSMITINDO' : 'DISPARAR AO VIVO'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
