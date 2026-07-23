'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  BookOpen, 
  Users, 
  Scroll, 
  Sparkles, 
  Download, 
  Eye, 
  EyeOff, 
  Plus, 
  Swords, 
  MessageSquare, 
  Trophy, 
  Copy, 
  Check, 
  Trash2,
  Crown,
  Play,
  UserCheck,
  Shield,
  UserPlus,
  RefreshCw,
  Pencil
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { CampaignFeedEventType, CampaignMember } from '@/lib/types';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { useLiveCockpit } from '@/context/LiveCockpitContext';

export const CampaignSettingsStudio: React.FC = () => {
  const { user, loadDemoEverything } = useAuth();
  const { userWorlds, activeWorld } = useWorld();
  const { 
    userCampaigns,
    activeCampaign, 
    setActiveCampaign,
    campaignMembers,
    fetchCampaignMembers,
    addCampaignMember,
    removeCampaignMember,
    feedEvents, 
    createFeedEvent, 
    toggleFeedEventVisibility, 
    deleteFeedEvent,
    updateCampaign
  } = useCampaign();

  const { openSheet } = useLiveCockpit();

  const worldCampaigns = userCampaigns.filter((c) => {
    if (!activeWorld) return true;
    const effectiveWorldId = c.worldId || (userWorlds.length > 0 ? userWorlds[0].id : null);
    return effectiveWorldId === activeWorld.id;
  });

  const [activeTab, setActiveTab] = useState<'feed' | 'roster' | 'houserules' | 'ai' | 'export'>('feed');

  useEffect(() => {
    if (activeCampaign) {
      fetchCampaignMembers(activeCampaign.id);
    }
  }, [activeCampaign?.id, activeTab]);
  const [feedFilter, setFeedFilter] = useState<CampaignFeedEventType | 'all'>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  // Campaign Header Edit State
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // New Feed Event Form state
  const [showAddFeedModal, setShowAddFeedModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [newFeedTitle, setNewFeedTitle] = useState('');
  const [newFeedType, setNewFeedType] = useState<CampaignFeedEventType>('session_recap');
  const [newFeedSummary, setNewFeedSummary] = useState('');
  const [newFeedIsPublic, setNewFeedIsPublic] = useState(true);

  // Add Manual Player State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [manualPlayerName, setManualPlayerName] = useState('');

  // House Rules State
  const [houseRules, setHouseRules] = useState<string[]>([
    '🍺 Beber Poção de Cura custa Ação Bônus (Dar a outro jogador custa Ação).',
    '⚔️ Acerto Crítico causa Dano Máximo do 1º dado + rolagem do 2º dado.',
    '🌙 Descanso Curto dura 8 horas; Descanso Longo dura 24 horas em local seguro.',
  ]);
  const [newHouseRule, setNewHouseRule] = useState('');

  // AI Tone State
  const [aiTone, setAiTone] = useState<'heroic' | 'dark' | 'gritty' | 'funny'>('heroic');

  // Empty State: Allow selecting or creating campaigns directly from here!
  if (!activeCampaign) {
    return (
      <div className="flex-1 bg-[#0a0d14] flex flex-col p-6 overflow-y-auto select-none">
        <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border border-amber-500/30 p-6 rounded-2xl mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                {activeWorld ? `Campanhas do Mundo: ${activeWorld.title}` : 'Selecione uma Campanha / Mesa de Jogo'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
                Escolha uma das suas campanhas ativas abaixo para acessar o Diário da Jornada, Feed, Jogadores e Regras da Mesa.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateCampaignModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Iniciar Nova Campanha</span>
          </button>
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Campanhas Deste Mundo ({worldCampaigns.length}):
        </h3>

        {worldCampaigns.length === 0 ? (
          <div className="border-2 border-dashed border-[#2a3449] rounded-2xl p-8 text-center text-slate-500 bg-[#0f141d]/40 max-w-xl mx-auto my-4">
            <Settings className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300 text-sm mb-1">Nenhuma campanha cadastrada para este mundo.</p>
            <p className="text-xs text-slate-500 mb-4">
              Você pode iniciar uma nova campanha de RPG alimentada por este universo agora mesmo.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowCreateCampaignModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                + Iniciar Campanha
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {worldCampaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => setActiveCampaign(camp)}
                className="p-5 rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold bg-[#0a0d14] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                      CÓDIGO: {camp.inviteCode}
                    </span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <h4 className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition-colors">{camp.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-serif">{camp.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#2a3449] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">Mesa de RPG D&D 5e</span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <span>Entrar na Campanha</span>
                    <Play className="w-3.5 h-3.5 fill-amber-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateCampaignModal
          isOpen={showCreateCampaignModal}
          onClose={() => setShowCreateCampaignModal(false)}
        />
      </div>
    );
  }

  // Ensure DM is always present in roster calculation
  const rosterMembers: CampaignMember[] = [...campaignMembers];
  if (!rosterMembers.some((m) => m.role === 'dm')) {
    rosterMembers.unshift({
      id: `mem-dm-default`,
      campaignId: activeCampaign.id,
      userId: activeCampaign.dmId,
      role: 'dm',
      displayName: user?.displayName || 'Frederico Monteiro (Game Dev)',
    });
  }

  const filteredFeed = feedEvents.filter((ev) => {
    if (feedFilter !== 'all' && ev.eventType !== feedFilter) return false;
    return true;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCampaign.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedTitle.trim()) return;
    await createFeedEvent({
      campaignId: activeCampaign.id,
      eventType: newFeedType,
      title: newFeedTitle,
      summary: newFeedSummary,
      isPublic: newFeedIsPublic,
    });
    setNewFeedTitle('');
    setNewFeedSummary('');
    setShowAddFeedModal(false);
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPlayerName.trim()) return;
    await addCampaignMember(activeCampaign.id, manualPlayerName);
    setManualPlayerName('');
    setShowAddMemberModal(false);
  };

  const handleAddHouseRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseRule.trim()) return;
    setHouseRules((prev) => [...prev, newHouseRule.trim()]);
    setNewHouseRule('');
  };

  const handleExportMarkdown = () => {
    const text = `# DIÁRIO DA JORNADA: ${activeCampaign.title}\n\n` +
      `Código de Convite: ${activeCampaign.inviteCode}\n\n` +
      `## HISTÓRICO DA CAMPANHA\n\n` +
      feedEvents
        .filter((e) => e.isPublic)
        .map((e) => `### ${e.title}\n*Tipo: ${e.eventType}*\n\n${e.summary}\n\n---\n`)
        .join('\n');

    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario-${activeCampaign.inviteCode}.md`;
    a.click();
  };

  const getEventIcon = (type: CampaignFeedEventType) => {
    switch (type) {
      case 'battle_summary': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'npc_encounter': return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'session_recap': return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'milestone': return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'house_rule': return <Scroll className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border-b border-[#2a3449] p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                PAINEL DA CAMPANHA
              </span>

              {/* Campaign Switcher Dropdown */}
              <select
                value={activeCampaign.id}
                onChange={(e) => {
                  const selected = worldCampaigns.find((c) => c.id === e.target.value);
                  if (selected) setActiveCampaign(selected);
                }}
                className="bg-[#0a0d14] border border-[#2a3449] rounded px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              >
                {worldCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.inviteCode})
                  </option>
                ))}
              </select>
            </div>
            {isEditingHeader ? (
              <div className="mt-2 space-y-2 max-w-md animate-fade-in">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Nome da Campanha"
                  className="w-full text-base font-bold bg-[#0a0d14] border border-amber-500/60 focus:border-amber-400 text-slate-100 px-3 py-1 rounded-xl outline-none shadow-inner"
                  autoFocus
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descrição da Campanha (opcional)"
                  className="w-full text-xs bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500/50 text-slate-300 px-3 py-1 rounded-xl outline-none"
                />
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={async () => {
                      if (editTitle.trim()) {
                        await updateCampaign({
                          ...activeCampaign,
                          title: editTitle.trim(),
                          description: editDescription.trim(),
                        });
                      }
                      setIsEditingHeader(false);
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow flex items-center gap-1 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Salvar
                  </button>
                  <button
                    onClick={() => setIsEditingHeader(false)}
                    className="px-3 py-1 bg-[#161c28] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 text-xs rounded-lg border border-[#2a3449] transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mt-0.5 group">
                  <h2 className="text-xl font-bold text-slate-100">{activeCampaign.title}</h2>
                  <button
                    onClick={() => {
                      setEditTitle(activeCampaign.title);
                      setEditDescription(activeCampaign.description || '');
                      setIsEditingHeader(true);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#161c28] rounded-lg transition-all border border-transparent hover:border-[#2a3449]"
                    title="Editar Nome e Descrição da Campanha"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 max-w-xl truncate">{activeCampaign.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Invite Code Quick Badge & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateCampaignModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Outra Campanha</span>
          </button>

          <div className="bg-[#0a0d14] border border-amber-500/30 p-2.5 rounded-xl flex items-center gap-3 shadow-md">
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">CÓDIGO DE CONVITE:</div>
              <div className="text-xs font-mono font-bold text-amber-400">{activeCampaign.inviteCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-[10px] font-bold">{copiedCode ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center border-b border-[#2a3449] bg-[#0f141d] px-4 space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'feed'
              ? 'border-amber-400 text-amber-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Feed Chronológico ({feedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'roster'
              ? 'border-amber-400 text-amber-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Elenco & Jogadores ({rosterMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('houserules')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'houserules'
              ? 'border-amber-400 text-amber-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scroll className="w-3.5 h-3.5 text-purple-400" />
          <span>Regras da Casa ({houseRules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'ai'
              ? 'border-amber-400 text-amber-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Preferências da IA</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'export'
              ? 'border-amber-400 text-amber-300 bg-[#161c28]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Exportar Diário</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'feed' && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Feed Filter & Add Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono mr-1">Filtrar:</span>
                <button
                  onClick={() => setFeedFilter('all')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    feedFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({feedEvents.length})
                </button>
                <button
                  onClick={() => setFeedFilter('battle_summary')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    feedFilter === 'battle_summary' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚔️ Batalhas
                </button>
                <button
                  onClick={() => setFeedFilter('npc_encounter')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    feedFilter === 'npc_encounter' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🗣️ NPCs
                </button>
                <button
                  onClick={() => setFeedFilter('session_recap')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    feedFilter === 'session_recap' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📖 Recaps
                </button>
              </div>

              <button
                onClick={() => setShowAddFeedModal(true)}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar ao Feed</span>
              </button>
            </div>

            {/* Chronicle Timeline Log List */}
            <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a3449]">
              {filteredFeed.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#0f141d]/40 rounded-2xl border border-dashed border-[#2a3449]">
                  Nenhum registro encontrado no Feed da Jornada.
                </div>
              ) : (
                filteredFeed.map((ev) => (
                  <div
                    key={ev.id}
                    className="relative pl-10 group"
                  >
                    <div className="absolute left-2 top-3 -translate-x-1/2 w-5 h-5 rounded-full bg-[#161c28] border-2 border-amber-500 flex items-center justify-center shadow">
                      {getEventIcon(ev.eventType)}
                    </div>

                    <div className={`p-4 rounded-2xl border transition-all ${
                      ev.isPublic 
                        ? 'bg-[#161c28] border-[#2a3449] hover:border-slate-500' 
                        : 'bg-amber-950/20 border-amber-500/40'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-100">{ev.title}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                            ev.isPublic 
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {ev.isPublic ? '👁️ PÚBLICO' : '🔒 PRIVADO DM'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFeedEventVisibility(ev.id)}
                            className="p-1 text-slate-400 hover:text-amber-400 rounded text-xs flex items-center gap-1"
                            title={ev.isPublic ? 'Tornar Privado do DM' : 'Tornar Público para os Jogadores'}
                          >
                            {ev.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteFeedEvent(ev.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-serif leading-relaxed">{ev.summary}</p>

                      {ev.details && Object.keys(ev.details).length > 0 && (
                        <div className="mt-2 p-2 bg-[#0a0d14] rounded-lg border border-[#2a3449] text-[11px] text-amber-300 font-mono">
                          {Object.entries(ev.details).map(([k, v]) => (
                            <div key={k}>
                              <strong className="capitalize">{k}:</strong> {String(v)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="p-5 bg-[#161c28] border border-amber-500/30 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" /> Elenco de Jogadores & Personagens Conectados ({rosterMembers.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Compartilhe o código de convite para os jogadores ou adicione novos membros manualmente:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activeCampaign && fetchCampaignMembers(activeCampaign.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl transition-all"
                    title="Atualizar lista de jogadores"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Atualizar Lista</span>
                  </button>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Jogador Manual</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[#0a0d14] border border-[#2a3449] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">CÓDIGO DE CONVITE DA MESA:</span>
                  <span className="text-lg font-mono font-bold text-amber-400">{activeCampaign.inviteCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                >
                  {copiedCode ? 'Copiado!' : 'Copiar Convite'}
                </button>
              </div>

              {/* Joined Members Dynamic List */}
              <div className="space-y-2">
                {rosterMembers.map((mem) => {
                  const isDM = mem.role === 'dm';
                  return (
                    <div key={mem.id} className="p-3 bg-[#0a0d14] border border-[#2a3449] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                          isDM ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        }`}>
                          {isDM ? 'DM' : 'PL'}
                        </div>
                        <div>
                          <div 
                            className="text-xs font-bold text-slate-100 cursor-pointer hover:text-amber-400 hover:underline transition-colors"
                            onClick={() => {
                              const pName = mem.characterName || mem.displayName || 'Aventureiro';
                              openSheet(mem.id, 'pc', pName, mem);
                            }}
                          >
                            {mem.characterName ? `${mem.characterName} (${mem.displayName})` : mem.displayName}
                          </div>
                          <div className={`text-[10px] ${isDM ? 'text-amber-400 font-semibold' : 'text-cyan-400 font-semibold'}`}>
                            {isDM ? 'Dungeon Master (Organizador)' : `Personagem de RPG: ${mem.characterName || 'Aventureiro'}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-400" /> CONECTADO
                        </span>
                        {!isDM && (
                          <button
                            type="button"
                            onClick={() => {
                              const pName = mem.characterName || mem.displayName || 'Jogador';
                              if (confirm(`Tem certeza que deseja remover o jogador "${pName}" desta campanha?`)) {
                                removeCampaignMember(mem.id);
                              }
                            }}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                            title="Excluir jogador da campanha"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-[10px]">Excluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'houserules' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="p-5 bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Scroll className="w-4 h-4 text-purple-400" /> Regras da Casa (House Rules)
              </h3>
              <p className="text-xs text-slate-400">
                Defina as modificações de regras válidas para esta mesa de RPG:
              </p>

              <form onSubmit={handleAddHouseRule} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newHouseRule}
                  onChange={(e) => setNewHouseRule(e.target.value)}
                  placeholder="Ex: Poção de Cura no início da rodada cura o dobro..."
                  className="flex-1 bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  + Adicionar Regra
                </button>
              </form>

              <div className="space-y-2 pt-2">
                {houseRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-[#0a0d14] border border-[#2a3449] rounded-xl text-xs text-slate-200 font-serif leading-relaxed flex items-center justify-between">
                    <span>{rule}</span>
                    <button
                      onClick={() => setHouseRules((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="p-5 bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-xl space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" /> Tom da Narração do Co-Mestre IA
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAiTone('heroic')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    aiTone === 'heroic' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#0a0d14] border-[#2a3449] text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-100">🐉 Épico & Heroico</div>
                  <div className="text-[10px] text-slate-400 mt-1">Descrições grandiosas de triunfo e coragem.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAiTone('dark')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    aiTone === 'dark' ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold' : 'bg-[#0a0d14] border-[#2a3449] text-slate-400'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-100">💀 Dark Fantasy & Cru</div>
                  <div className="text-[10px] text-slate-400 mt-1">Foco no perigo constante, névoas e combates viscerais.</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="max-w-md mx-auto text-center space-y-4 p-8 bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-xl">
            <Download className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-slate-100 text-base">Exportar Diário da Jornada</h3>
            <p className="text-xs text-slate-400">
              Baixe todo o histórico da campanha em um documento Markdown formatado para guardar de recordação!
            </p>
            <button
              onClick={handleExportMarkdown}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              📥 Baixar Diário (.md)
            </button>
          </div>
        )}
      </div>

      {/* Modal Add Feed Event */}
      {showAddFeedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> Adicionar Evento ao Feed da Jornada
            </h3>

            <form onSubmit={handleAddFeedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Evento:</label>
                <select
                  value={newFeedType}
                  onChange={(e) => setNewFeedType(e.target.value as any)}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="session_recap">📖 Resumo da Sessão (Recap)</option>
                  <option value="battle_summary">⚔️ Resumo de Batalha & Loot</option>
                  <option value="npc_encounter">🗣️ Encontro com NPC & Acordo</option>
                  <option value="milestone">🏆 Marco / Elevação de Nível</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título do Evento:</label>
                <input
                  type="text"
                  required
                  value={newFeedTitle}
                  onChange={(e) => setNewFeedTitle(e.target.value)}
                  placeholder="Ex: Derrota do Dragão Vermelho"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Resumo Narrativo:</label>
                <textarea
                  rows={3}
                  required
                  value={newFeedSummary}
                  onChange={(e) => setNewFeedSummary(e.target.value)}
                  placeholder="Descreva o que aconteceu na sessão..."
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-serif"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublicCheck"
                  checked={newFeedIsPublic}
                  onChange={(e) => setNewFeedIsPublic(e.target.checked)}
                  className="rounded bg-[#0a0d14] border-[#2a3449]"
                />
                <label htmlFor="isPublicCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  👁️ Visível para os Jogadores (Público)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFeedModal(false)}
                  className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Publicar no Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Manual Member */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161c28] border border-cyan-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" /> Adicionar Jogador ao Elenco
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Digite o nome do personagem do jogador para adicioná-lo manualmente ao elenco desta mesa:
            </p>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Personagem:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={manualPlayerName}
                  onChange={(e) => setManualPlayerName(e.target.value)}
                  placeholder="Ex: Trark (Bárbaro Nível 3)"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Adicionar ao Elenco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Campaign */}
      <CreateCampaignModal
        isOpen={showCreateCampaignModal}
        onClose={() => setShowCreateCampaignModal(false)}
      />
    </div>
  );
};
