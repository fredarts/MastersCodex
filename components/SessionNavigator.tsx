'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Plus, 
  Calendar, 
  Film, 
  Swords, 
  MessageSquare, 
  Beer, 
  Compass, 
  ChevronRight, 
  Sparkles,
  Layers,
  Edit3,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GameScene, Combatant } from '@/lib/types';
import { CreateSceneModal } from '@/components/CreateSceneModal';

interface SessionNavigatorProps {
  onEquipScene: (scene: GameScene) => void;
}

export const SessionNavigator: React.FC<SessionNavigatorProps> = ({ onEquipScene }) => {
  const { 
    activeWorld,
    updateWorld,
    activeCampaign, 
    sessions, 
    activeSession, 
    setActiveSession, 
    createSession,
    updateSession,
    scenes, 
    activeScene, 
    setActiveScene,
    updateScene
  } = useAuth();

  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Editing states for World, Session, and Scene
  const [editingWorldId, setEditingWorldId] = useState<string | null>(null);
  const [editedWorldTitle, setEditedWorldTitle] = useState('');

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedSessionTitle, setEditedSessionTitle] = useState('');

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editedSceneTitle, setEditedSceneTitle] = useState('');

  if (!activeCampaign) return null;

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;
    await createSession(newSessionTitle);
    setNewSessionTitle('');
    setShowNewSessionInput(false);
  };

  const handleSaveWorldTitle = async () => {
    if (activeWorld && editedWorldTitle.trim()) {
      await updateWorld({ ...activeWorld, title: editedWorldTitle.trim() });
    }
    setEditingWorldId(null);
  };

  const handleSaveSessionTitle = async () => {
    if (activeSession && editedSessionTitle.trim()) {
      await updateSession({ ...activeSession, title: editedSessionTitle.trim() });
    }
    setEditingSessionId(null);
  };

  const handleSaveSceneTitle = async (sc: GameScene) => {
    if (editedSceneTitle.trim()) {
      await updateScene({ ...sc, title: editedSceneTitle.trim() });
    }
    setEditingSceneId(null);
  };

  const getSceneIcon = (type: string) => {
    switch (type) {
      case 'combat':
        return <Swords className="w-3.5 h-3.5 text-rose-400" />;
      case 'dialogue': return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'social':
        return <Beer className="w-3.5 h-3.5 text-amber-400" />;
      case 'exploration':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="bg-[#0c0f17] border-b border-[#2a3449] px-4 py-2 flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Context Breadcrumbs & Session Selector */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        {/* Breadcrumb: Active World */}
        {activeWorld && (
          <div className="flex items-center gap-1.5 text-amber-400/80 font-medium font-mono text-[11px]">
            {editingWorldId === activeWorld.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={editedWorldTitle}
                  onChange={(e) => setEditedWorldTitle(e.target.value)}
                  className="bg-[#0a0d14] border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveWorldTitle();
                    if (e.key === 'Escape') setEditingWorldId(null);
                  }}
                />
                <button onClick={handleSaveWorldTitle} className="p-0.5 text-emerald-400 hover:text-emerald-300" title="Salvar">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <span className="truncate max-w-[110px]">{activeWorld.title}</span>
                <button
                  onClick={() => {
                    setEditingWorldId(activeWorld.id);
                    setEditedWorldTitle(activeWorld.title);
                  }}
                  className="p-0.5 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                  title="Editar Nome do Mundo"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
            <ChevronRight className="w-3 h-3 text-slate-600" />
          </div>
        )}

        {/* Breadcrumb: Active Campaign */}
        <div className="flex items-center gap-1 text-slate-300 font-bold font-mono text-[11px]">
          <span className="truncate max-w-[120px] text-amber-300">{activeCampaign.title}</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
        </div>

        {/* Active Session Dropdown & Edit */}
        {editingSessionId && activeSession ? (
          <div className="flex items-center gap-1 bg-[#161c28] border border-amber-500 rounded-lg px-2 py-0.5">
            <input
              type="text"
              autoFocus
              value={editedSessionTitle}
              onChange={(e) => setEditedSessionTitle(e.target.value)}
              className="bg-[#0a0d14] border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-36"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveSessionTitle();
                if (e.key === 'Escape') setEditingSessionId(null);
              }}
            />
            <button onClick={handleSaveSessionTitle} className="p-0.5 text-emerald-400 hover:text-emerald-300" title="Salvar Nome da Sessão">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#161c28] border border-amber-500/30 rounded-lg px-2 py-0.5 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={activeSession?.id || ''}
              onChange={(e) => {
                const selected = sessions.find((s) => s.id === e.target.value);
                if (selected) setActiveSession(selected);
              }}
              className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none max-w-[180px] truncate"
            >
              {sessions.length === 0 ? (
                <option value="" className="bg-[#161c28] text-slate-300">Nenhuma Sessão Criada</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#161c28] text-slate-200">
                    Sessão {s.sessionNumber}: {s.title}
                  </option>
                ))
              )}
            </select>

            {activeSession && (
              <button
                onClick={() => {
                  setEditingSessionId(activeSession.id);
                  setEditedSessionTitle(activeSession.title);
                }}
                className="p-0.5 hover:bg-[#1f2738] rounded text-slate-400 hover:text-amber-400 transition-colors"
                title="Editar Nome da Sessão Ativa"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => setShowNewSessionInput(true)}
              className="p-0.5 hover:bg-[#1f2738] rounded text-slate-300 transition-colors"
              title="Criar Nova Sessão de Jogo"
            >
              <Plus className="w-3 h-3 text-amber-400" />
            </button>
          </div>
        )}

        {/* Modal / Form Inline to Create Session */}
        {showNewSessionInput && (
          <form onSubmit={handleCreateSessionSubmit} className="flex items-center gap-1 animate-fade-in">
            <input
              type="text"
              required
              autoFocus
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Ex: Sessão 2: A Fuga"
              className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-0.5 text-xs text-slate-100 font-bold focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-xs rounded"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setShowNewSessionInput(false)}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </form>
        )}
      </div>

      {/* Scenes Timeline Carousel */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-0.5 px-2">
        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1 font-mono">
          <Film className="w-3 h-3 text-slate-400" /> CENAS DA SESSÃO:
        </span>

        {scenes.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Nenhuma cena criada para esta sessão.</span>
        ) : (
          scenes.map((sc) => {
            const isActive = activeScene?.id === sc.id;
            const isEditingThisScene = editingSceneId === sc.id;

            if (isEditingThisScene) {
              return (
                <div key={sc.id} className="flex items-center gap-1 bg-[#161c28] border border-amber-500 rounded-xl px-2 py-1 text-xs">
                  <input
                    type="text"
                    autoFocus
                    value={editedSceneTitle}
                    onChange={(e) => setEditedSceneTitle(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-28"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveSceneTitle(sc);
                      if (e.key === 'Escape') setEditingSceneId(null);
                    }}
                  />
                  <button onClick={() => handleSaveSceneTitle(sc)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={sc.id}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs transition-all flex-shrink-0 group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-amber-700/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:bg-[#1f2738]'
                }`}
              >
                <button
                  onClick={() => {
                    setActiveScene(sc);
                    onEquipScene(sc);
                  }}
                  className="flex items-center gap-1.5"
                >
                  {getSceneIcon(sc.sceneType)}
                  <span className="truncate max-w-[140px]">{sc.title}</span>
                </button>

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

                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Scene Button */}
      {activeSession && (
        <button
          onClick={() => setShowCreateSceneModal(true)}
          className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs shadow transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Adicionar Cena</span>
        </button>
      )}

      {/* Modal for Creating Scenes */}
      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />
    </div>
  );
};
