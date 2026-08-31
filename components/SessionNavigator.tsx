'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ChevronRight, 
  Edit3,
  Check,
  Crown,
  Calendar
} from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useSession } from '@/lib/hooks/useSession';
import { GameScene } from '@/lib/types';

interface SessionNavigatorProps {
  onEquipScene?: (scene: GameScene) => void;
}

export const SessionNavigator: React.FC<SessionNavigatorProps> = () => {
  const { activeWorld, updateWorld } = useWorld();
  const { userCampaigns, activeCampaign, setActiveCampaign, updateCampaign, createCampaign } = useCampaign();
  const {
    sessions, 
    activeSession, 
    setActiveSession, 
    createSession,
    updateSession,
  } = useSession();

  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  const [showNewCampaignInput, setShowNewCampaignInput] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');

  // Editing states for World, Campaign, and Session
  const [editingWorldId, setEditingWorldId] = useState<string | null>(null);
  const [editedWorldTitle, setEditedWorldTitle] = useState('');

  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [editedCampaignTitle, setEditedCampaignTitle] = useState('');

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedSessionTitle, setEditedSessionTitle] = useState('');

  if (!activeCampaign || (activeWorld && activeCampaign.worldId !== activeWorld.id)) return null;

  const worldCampaigns = userCampaigns.filter((c) => {
    if (c.role !== 'dm') return false;
    if (!activeWorld) return true;
    return c.worldId === activeWorld.id;
  });

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle.trim()) return;
    await createCampaign(newCampaignTitle.trim(), activeWorld?.id);
    setNewCampaignTitle('');
    setShowNewCampaignInput(false);
  };

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

  const handleSaveCampaignTitle = async () => {
    if (activeCampaign && editedCampaignTitle.trim()) {
      await updateCampaign({ ...activeCampaign, title: editedCampaignTitle.trim() });
    }
    setEditingCampaignId(null);
  };

  const handleSaveSessionTitle = async () => {
    if (activeSession && editedSessionTitle.trim()) {
      await updateSession({ ...activeSession, title: editedSessionTitle.trim() });
    }
    setEditingSessionId(null);
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

        {/* Breadcrumb: Active Campaign Selector */}
        {editingCampaignId && activeCampaign ? (
          <div className="flex items-center gap-1 bg-[#161c28] border border-amber-500 rounded-lg px-2 py-0.5">
            <input
              type="text"
              autoFocus
              value={editedCampaignTitle}
              onChange={(e) => setEditedCampaignTitle(e.target.value)}
              className="bg-[#0a0d14] border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-36"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCampaignTitle();
                if (e.key === 'Escape') setEditingCampaignId(null);
              }}
            />
            <button onClick={handleSaveCampaignTitle} className="p-0.5 text-emerald-400 hover:text-emerald-300" title="Salvar Nome da Campanha">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#161c28] border border-amber-500/30 rounded-lg px-2 py-0.5 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <select
              value={activeCampaign?.id || ''}
              onChange={(e) => {
                const selected = userCampaigns.find((c) => c.id === e.target.value);
                if (selected) setActiveCampaign(selected);
              }}
              className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none max-w-[150px] truncate cursor-pointer"
              title="Alternar Campanha"
            >
              {worldCampaigns.length === 0 ? (
                <option value={activeCampaign.id} className="bg-[#161c28] text-slate-300">{activeCampaign.title}</option>
              ) : (
                worldCampaigns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#161c28] text-slate-200">
                    {c.title}
                  </option>
                ))
              )}
            </select>

            {activeCampaign && (
              <button
                onClick={() => {
                  setEditingCampaignId(activeCampaign.id);
                  setEditedCampaignTitle(activeCampaign.title);
                }}
                className="p-0.5 hover:bg-[#1f2738] rounded text-slate-400 hover:text-amber-400 transition-colors"
                title="Editar Nome da Campanha Ativa"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => setShowNewCampaignInput(true)}
              className="p-0.5 hover:bg-[#1f2738] rounded text-slate-300 transition-colors"
              title="Criar Nova Campanha neste Mundo"
            >
              <Plus className="w-3 h-3 text-amber-400" />
            </button>
          </div>
        )}
        <ChevronRight className="w-3 h-3 text-slate-600" />

        {/* Modal / Form Inline to Create Campaign */}
        {showNewCampaignInput && (
          <form onSubmit={handleCreateCampaignSubmit} className="flex items-center gap-1 animate-fade-in">
            <input
              type="text"
              required
              autoFocus
              value={newCampaignTitle}
              onChange={(e) => setNewCampaignTitle(e.target.value)}
              placeholder="Ex: Campanha 2: A Queda"
              className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-0.5 text-xs text-slate-100 font-bold focus:outline-none w-36"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-xs rounded"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setShowNewCampaignInput(false)}
              className="px-1.5 py-0.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </form>
        )}

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
                const selected = sessions.find((s: any) => s.id === e.target.value);
                if (selected) setActiveSession(selected);
              }}
              className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none max-w-[180px] truncate"
            >
              {sessions.length === 0 ? (
                <option value="" className="bg-[#161c28] text-slate-300">Nenhuma Sessão Criada</option>
              ) : (
                sessions.map((s: any) => (
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

    </div>
  );
};
