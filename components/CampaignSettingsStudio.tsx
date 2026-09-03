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
  UserPlus,
  RefreshCw,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Globe,
  Compass,
  Flame,
  LayoutDashboard,
  Image as ImageIcon,
  Wand2,
  ArrowRight,
  Search,
  X,
  Share2,
} from 'lucide-react';
import { LinesAndVeilsPanel } from '@/components/safety/LinesAndVeilsPanel';
import { PushNotificationToggle } from '@/components/push/PushNotificationToggle';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { CampaignFeedEventType, CampaignMember, WorldEntity } from '@/lib/types';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';
import { worldService } from '@/lib/services/worldService';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { EditCampaignDetailsModal } from '@/components/modals/EditCampaignDetailsModal';
import { CampaignDocumentsStudio } from '@/components/campaign/CampaignDocumentsStudio';
import { CampaignNPCSharingModal } from '@/components/campaign/CampaignNPCSharingModal';
import { PlayerNPCModal } from '@/components/player-view/PlayerNPCModal';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { toast } from 'sonner';

interface CampaignSettingsStudioProps {
  onEquipScene?: (scene: any) => void;
}

export const CampaignSettingsStudio: React.FC<CampaignSettingsStudioProps> = ({ onEquipScene }) => {
  const { user } = useAuth();
  const { showConfirm } = useCustomDialog();
  const { userWorlds, activeWorld, worldEntities } = useWorld();
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

  const worldCampaigns = React.useMemo(() => {
    const seen = new Set<string>();
    return userCampaigns.filter((c: any) => {
      if (c.role !== 'dm') return false;
      if (activeWorld && c.worldId !== activeWorld.id) return false;
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [userCampaigns, activeWorld]);

  const [activeTab, setActiveTab] = useState<'overview' | 'feed' | 'documents' | 'roster' | 'party' | 'houserules' | 'safety' | 'ai' | 'export'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('masters_codex_campaign_settings_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masters_codex_campaign_settings_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (activeCampaign) {
      fetchCampaignMembers(activeCampaign.id);
    }
  }, [activeCampaign, activeTab, fetchCampaignMembers]);
  const [feedFilter, setFeedFilter] = useState<CampaignFeedEventType | 'all'>('all');
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Campaign Edit Modal State
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showNPCSharingModal, setShowNPCSharingModal] = useState(false);
  const [selectedNPCForSharingId, setSelectedNPCForSharingId] = useState<string | undefined>(undefined);
  const [previewNPCForPlayer, setPreviewNPCForPlayer] = useState<WorldEntity | null>(null);

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

  // World NPCs & Party Add States
  const [campaignWorldEntities, setCampaignWorldEntities] = useState<WorldEntity[]>([]);
  const [partyAddSubTab, setPartyAddSubTab] = useState<'players' | 'npcs'>('players');
  const [npcSearchQuery, setNpcSearchQuery] = useState('');

  useEffect(() => {
    if (activeCampaign?.worldId) {
      if (activeWorld && activeWorld.id === activeCampaign.worldId && worldEntities && worldEntities.length > 0) {
        setCampaignWorldEntities(worldEntities);
      } else {
        worldService.fetchWorldEntities(activeCampaign.worldId, user?.id).then((res) => {
          if (res.ok) setCampaignWorldEntities(res.value);
        });
      }
    } else if (worldEntities && worldEntities.length > 0) {
      setCampaignWorldEntities(worldEntities);
    }
  }, [activeCampaign?.worldId, activeWorld?.id, worldEntities, user?.id]);

  // Ensure DM is always present in roster calculation
  const rosterMembers: CampaignMember[] = React.useMemo(() => {
    const list = [...campaignMembers];
    if (activeCampaign && !list.some((m) => m.role === 'dm')) {
      list.unshift({
        id: `mem-dm-default`,
        campaignId: activeCampaign.id,
        userId: activeCampaign.dmId,
        role: 'dm',
        displayName: user?.displayName || 'Frederico Monteiro (Game Dev)',
      });
    }
    return list;
  }, [campaignMembers, activeCampaign, user?.displayName]);

  const availablePlayers = React.useMemo(() => {
    return rosterMembers.filter(
      (m) => m.role === 'player' && !(activeCampaign?.partyMembers || []).some((pm) => pm.id === m.id)
    );
  }, [rosterMembers, activeCampaign?.partyMembers]);

  const worldNpcs = React.useMemo(() => {
    return campaignWorldEntities.filter(
      (e) => e.category === 'npc' || (e.category as string) === 'person'
    );
  }, [campaignWorldEntities]);

  const availableNpcs = React.useMemo(() => {
    return worldNpcs.filter(
      (npc) => !(activeCampaign?.partyMembers || []).some((pm) => pm.id === npc.id)
    );
  }, [worldNpcs, activeCampaign?.partyMembers]);

  const filteredAvailableNpcs = React.useMemo(() => {
    const q = npcSearchQuery.toLowerCase().trim();
    if (!q) return availableNpcs;
    return availableNpcs.filter(
      (npc) =>
        npc.name.toLowerCase().includes(q) ||
        (npc.subType || '').toLowerCase().includes(q) ||
        (npc.shortDesc || '').toLowerCase().includes(q)
    );
  }, [availableNpcs, npcSearchQuery]);

  const filteredFeed = React.useMemo(() => {
    return feedEvents.filter((ev) => {
      if (feedFilter !== 'all' && ev.eventType !== feedFilter) return false;
      if (feedSearchQuery.trim()) {
        const q = feedSearchQuery.toLowerCase().trim();
        const matchesTitle = ev.title?.toLowerCase().includes(q);
        const matchesSummary = ev.summary?.toLowerCase().includes(q);
        const matchesDetails = ev.details && Object.values(ev.details).some((v) => String(v).toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesDetails) return false;
      }
      return true;
    });
  }, [feedEvents, feedFilter, feedSearchQuery]);

  // Empty State: Allow selecting or creating campaigns directly from here!
  if (!activeCampaign || activeCampaign.role !== 'dm' || (activeWorld && activeCampaign.worldId !== activeWorld.id)) {
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
                className="rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden shadow-lg"
              >
                {camp.coverImageUrl && (
                  <div className="w-full aspect-video relative overflow-hidden bg-black/40 border-b border-[#2a3449]">
                    <img 
                      src={camp.coverImageUrl} 
                      alt={camp.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161c28] via-transparent to-transparent"></div>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
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
      <div className="relative bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border-b border-[#2a3449] p-3 sm:p-3.5 shadow-lg flex flex-wrap items-center justify-between gap-3 overflow-hidden flex-shrink-0">
        {activeCampaign.coverImageUrl && (
          <div 
            className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none filter blur-[1px]" 
            style={{ backgroundImage: `url(${activeCampaign.coverImageUrl})` }}
          />
        )}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
                PAINEL DA CAMPANHA
              </span>

              {/* Campaign Switcher Dropdown */}
              <select
                value={activeCampaign.id}
                onChange={(e) => {
                  const selected = worldCampaigns.find((c) => c.id === e.target.value);
                  if (selected) setActiveCampaign(selected);
                }}
                className="bg-[#0a0d14] border border-[#2a3449] rounded px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {worldCampaigns.map((c, idx) => (
                  <option key={`${c.id}-${idx}`} value={c.id}>
                    {c.title} ({c.inviteCode})
                  </option>
                ))}
              </select>
            </div>
              <div>
                <div className="flex items-center gap-1.5 mt-0.5 group">
                  <h2 className="text-base sm:text-lg font-bold text-slate-100">{activeCampaign.title}</h2>
                  <button
                    onClick={() => setShowEditDetailsModal(true)}
                    className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#161c28] rounded-lg transition-all border border-transparent hover:border-[#2a3449] cursor-pointer"
                    title="Editar Detalhes e Gerar Imagem/Texto com IA"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 max-w-xl truncate">{activeCampaign.description}</p>
              </div>
          </div>
        </div>

        {/* Invite Code Quick Badge & Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCreateCampaignModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Outra Campanha</span>
          </button>

          <div className="bg-[#0a0d14] border border-amber-500/30 px-2.5 py-1.5 rounded-xl flex items-center gap-2.5 shadow-md">
            <div>
              <div className="text-[8.5px] font-bold text-slate-500 uppercase">CÓDIGO DE CONVITE:</div>
              <div className="text-xs font-mono font-bold text-amber-400">{activeCampaign.inviteCode}</div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
              <span className="text-[9.5px] font-bold">{copiedCode ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Collapsible Sub-Tabs & Editor Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sub-Tabs Sidebar (Sandwich Menu Style) */}
        <aside className={`bg-[#0f141d] border-r border-[#2a3449] flex flex-col justify-between transition-all duration-300 z-10 flex-shrink-0 ${
          isSidebarCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'
        }`}>
          <div>
            <div className={`p-3 border-b border-[#2a3449]/60 flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'} bg-[#121824]/50`}>
              {!isSidebarCollapsed && (
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Menu Painel
                </span>
              )}
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg bg-[#161c28] text-slate-400 hover:text-amber-400 hover:bg-[#1f2738] transition-colors mx-auto"
                title={isSidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Vertical Menu Buttons */}
            <div className="p-2 space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Visão Geral da Campanha"
              >
                <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${activeTab === 'overview' ? 'text-slate-950' : 'text-amber-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Visão Geral & Capa</span>}
              </button>

              <button
                onClick={() => setActiveTab('feed')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'feed'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title={`Feed Chronológico (${feedEvents.length})`}
              >
                <BookOpen className={`w-4 h-4 flex-shrink-0 ${activeTab === 'feed' ? 'text-slate-950' : 'text-amber-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Feed Chronológico ({feedEvents.length})</span>}
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'documents'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title={`Documentos & Lore (${activeCampaign.documents?.length || 0})`}
              >
                <Scroll className={`w-4 h-4 flex-shrink-0 ${activeTab === 'documents' ? 'text-slate-950' : 'text-amber-400'}`} />
                {!isSidebarCollapsed && (
                  <span className="truncate flex items-center justify-between w-full">
                    <span>Documentos & Lore</span>
                    {(activeCampaign.documents?.length || 0) > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-900 text-amber-300 font-bold border border-slate-700">
                        {activeCampaign.documents?.length}
                      </span>
                    )}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('roster')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'roster'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title={`Elenco & Jogadores (${rosterMembers.length})`}
              >
                <Users className={`w-4 h-4 flex-shrink-0 ${activeTab === 'roster' ? 'text-slate-950' : 'text-cyan-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Elenco & Jogadores ({rosterMembers.length})</span>}
              </button>

              <button
                onClick={() => setActiveTab('party')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'party'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title={`Membros da Party (${activeCampaign?.partyMembers?.length || 0})`}
              >
                <Swords className={`w-4 h-4 flex-shrink-0 ${activeTab === 'party' ? 'text-slate-950' : 'text-rose-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Party ({activeCampaign?.partyMembers?.length || 0})</span>}
              </button>

              <button
                onClick={() => setActiveTab('houserules')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'houserules'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title={`Regras da Casa (${houseRules.length})`}
              >
                <Scroll className={`w-4 h-4 flex-shrink-0 ${activeTab === 'houserules' ? 'text-slate-950' : 'text-purple-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Regras da Casa ({houseRules.length})</span>}
              </button>

              <button
                onClick={() => setActiveTab('safety')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'safety'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Limites & Segurança (Safety Tools)"
              >
                <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${activeTab === 'safety' ? 'text-slate-950' : 'text-rose-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Limites & Segurança</span>}
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ai'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Preferências da IA"
              >
                <Sparkles className={`w-4 h-4 flex-shrink-0 ${activeTab === 'ai' ? 'text-slate-950' : 'text-pink-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Preferências da IA</span>}
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'export'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Exportar Diário"
              >
                <Download className={`w-4 h-4 flex-shrink-0 ${activeTab === 'export' ? 'text-slate-950' : 'text-emerald-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">Exportar Diário</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Tab Content */}
        {activeTab === 'overview' && (() => {
          const rawDesc = activeCampaign.description || '';
          let synopsisText = rawDesc;
          let hookText = '';
          if (rawDesc.includes('**Gancho Inicial:**')) {
            const parts = rawDesc.split('**Gancho Inicial:**');
            synopsisText = parts[0].trim();
            hookText = parts[1].trim();
          } else if (rawDesc.includes('Gancho Inicial:')) {
            const parts = rawDesc.split('Gancho Inicial:');
            synopsisText = parts[0].trim();
            hookText = parts[1].trim();
          }

          return (
            <div className="flex-1 overflow-hidden p-3 md:p-3.5 flex flex-col gap-2.5 bg-[#0a0d14] h-full min-h-0">
              
              {/* Hero Panoramic Cover Banner (Compact) */}
              <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/40 bg-[#111622] shadow-xl group flex-shrink-0">
                {activeCampaign.coverImageUrl ? (
                  <div className="relative w-full aspect-[21/6] max-h-[140px] overflow-hidden bg-black/60">
                    <img 
                      src={activeCampaign.coverImageUrl} 
                      alt={activeCampaign.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/80 via-transparent to-transparent"></div>

                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold rounded-lg uppercase tracking-wider backdrop-blur-md flex items-center gap-1 shadow-sm">
                            <Globe className="w-3 h-3 text-amber-400" />
                            <span>{activeWorld ? activeWorld.title : 'Mundo Avulso'}</span>
                          </span>

                          {activeCampaign.themeTone && (
                            <span className="px-2 py-0.5 bg-slate-900/70 border border-slate-700 text-slate-200 text-[10px] font-medium rounded-lg backdrop-blur-md flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>{activeCampaign.themeTone}</span>
                            </span>
                          )}

                          <span className="px-2 py-0.5 bg-slate-900/70 border border-slate-700 text-cyan-300 text-[10px] font-medium rounded-lg backdrop-blur-md flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{rosterMembers.length} no Elenco</span>
                          </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-lg font-serif">
                          {activeCampaign.title}
                        </h1>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setShowEditDetailsModal(true)}
                          className="px-3 py-1.5 bg-[#161c28]/90 hover:bg-[#1f2738] border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all shadow-md backdrop-blur-md flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar Detalhes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 sm:p-4 flex items-center justify-between gap-4 bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                          {activeWorld ? activeWorld.title : 'Campanha de RPG'}
                        </span>
                        {activeCampaign.themeTone && (
                          <span className="text-[11px] text-slate-400 font-medium">— {activeCampaign.themeTone}</span>
                        )}
                      </div>
                      <h1 className="text-lg sm:text-xl font-extrabold text-slate-100 font-serif">
                        {activeCampaign.title}
                      </h1>
                      <p className="text-[11px] text-slate-400 max-w-xl truncate">
                        Nenhuma capa panorâmica configurada para esta mesa. Você pode forjar uma arte 16:9 personalizada com IA.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShowEditDetailsModal(true)}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Detalhes</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content Grid: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
                
                {/* Left Column (lg:col-span-7): Synopsis & Adventure Hook */}
                <div className="lg:col-span-7 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
                  
                  {/* Synopsis Panel */}
                  <div className="bg-[#141a27] border border-[#252f44] rounded-2xl p-3 sm:p-3.5 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#252f44] pb-2 mb-2 flex-shrink-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Scroll className="w-4 h-4 text-amber-400" />
                        <span>Sinopse & Diário de Abertura da Mesa</span>
                      </h3>
                      <button
                        onClick={() => setShowEditDetailsModal(true)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#1b2336] rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                        title="Editar Sinopse"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>
                    </div>

                    {synopsisText ? (
                      <div className="text-xs text-slate-200 font-serif leading-relaxed whitespace-pre-line bg-[#0d121c] p-3 rounded-xl border border-[#252f44]/80 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        {synopsisText}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 my-auto">
                        <p className="text-xs italic mb-2">Nenhuma sinopse cadastrada para esta campanha ainda.</p>
                        <button
                          onClick={() => setShowEditDetailsModal(true)}
                          className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                        >
                          + Adicionar Sinopse
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Adventure Hook Card (Call to Action / Session 0) - if exists */}
                  {hookText && (
                    <div className="bg-[#141a27] border border-amber-500/30 rounded-2xl p-3 sm:p-3.5 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-2 flex-shrink-0">
                        <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2 font-serif">
                          <Compass className="w-4 h-4 text-amber-400" />
                          <span>Gancho Inicial de Aventura (Sessão 0 / Call to Action)</span>
                        </h4>
                        <button
                          onClick={() => setShowEditDetailsModal(true)}
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-[#1b2336] rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                          title="Editar Gancho Inicial"
                        >
                          <Pencil className="w-3 h-3" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                      </div>
                      <div className="text-xs text-slate-200 font-sans italic bg-[#0a0e17]/90 p-3 rounded-xl border border-amber-500/20 leading-relaxed flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        "{hookText}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column (lg:col-span-5): Connected Players (Elenco da Mesa) + Push Notification */}
                <div className="lg:col-span-5 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
                  
                  {/* Connected Players Widget */}
                  <div className="bg-[#141a27] border border-[#252f44] rounded-2xl p-3 sm:p-3.5 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
                    <div className="flex items-center justify-between border-b border-[#252f44] pb-2 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span>Elenco da Mesa ({rosterMembers.length})</span>
                      </span>
                      <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        + Convidar
                      </button>
                    </div>

                    <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                      {rosterMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#0a0d14] border border-[#252f44]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              member.role === 'dm' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                            }`}>
                              {member.displayName ? member.displayName.charAt(0).toUpperCase() : 'J'}
                            </div>
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-200 truncate">
                                {member.displayName || member.characterName || 'Jogador Anônimo'}
                              </div>
                              <div className="text-[9.5px] text-slate-400 font-mono truncate">
                                {member.role === 'dm' ? '👑 Mestre de RPG' : `⚔️ ${member.characterName || 'Personagem não definido'}`}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border shrink-0 ${
                            member.role === 'dm' ? 'text-amber-300 bg-amber-500/10 border-amber-500/30 font-bold' : 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30'
                          }`}>
                            {member.role === 'dm' ? 'DM' : 'Jogador'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Push Notification Integration */}
                  <div className="flex-shrink-0">
                    <PushNotificationToggle campaignId={activeCampaign?.id} userId={user?.id} />
                  </div>

                </div>

              </div>

            </div>
          );
        })()}

        {/* Feed Tab Content */}
        {activeTab === 'feed' && (
          <div className="flex-1 flex flex-col h-full min-h-0 bg-[#0a0d14] overflow-hidden">
            {/* Top Toolbar: Horizontal Filter Chips + Quick Search + Action Button */}
            <div className="p-3 sm:p-4 border-b border-[#252f44] bg-[#0f141d]/90 backdrop-blur-md flex-shrink-0 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Horizontal Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
                <button
                  onClick={() => setFeedFilter('all')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    feedFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
                  }`}
                >
                  <Scroll className={`w-3.5 h-3.5 ${feedFilter === 'all' ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>Todos ({feedEvents.length})</span>
                </button>

                <button
                  onClick={() => setFeedFilter('battle_summary')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    feedFilter === 'battle_summary'
                      ? 'bg-rose-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
                  }`}
                >
                  <Swords className={`w-3.5 h-3.5 ${feedFilter === 'battle_summary' ? 'text-slate-950' : 'text-rose-400'}`} />
                  <span>Batalhas ({feedEvents.filter((e) => e.eventType === 'battle_summary').length})</span>
                </button>

                <button
                  onClick={() => setFeedFilter('npc_encounter')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    feedFilter === 'npc_encounter'
                      ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
                  }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${feedFilter === 'npc_encounter' ? 'text-slate-950' : 'text-cyan-400'}`} />
                  <span>NPCs ({feedEvents.filter((e) => e.eventType === 'npc_encounter').length})</span>
                </button>

                <button
                  onClick={() => setFeedFilter('session_recap')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    feedFilter === 'session_recap'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 ${feedFilter === 'session_recap' ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>Recaps ({feedEvents.filter((e) => e.eventType === 'session_recap').length})</span>
                </button>

                <button
                  onClick={() => setFeedFilter('world_lore')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    feedFilter === 'world_lore'
                      ? 'bg-purple-500 text-slate-950 shadow-md font-black'
                      : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
                  }`}
                >
                  <BookOpen className={`w-3.5 h-3.5 ${feedFilter === 'world_lore' ? 'text-slate-950' : 'text-purple-400'}`} />
                  <span>Lore ({feedEvents.filter((e) => e.eventType === 'world_lore').length})</span>
                </button>
              </div>

              {/* Search Box & New Event Action Button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar no feed..."
                    value={feedSearchQuery}
                    onChange={(e) => setFeedSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-[#0a0d14] border border-[#252f44] focus:border-amber-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-all"
                  />
                  {feedSearchQuery && (
                    <button
                      onClick={() => setFeedSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowNPCSharingModal(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                  title="Transmitir e Revelar NPCs do World Building para a Campanha"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Transmitir NPCs ({Object.values(activeCampaign?.npcDisclosures || {}).filter((d) => d.isShared).length})</span>
                </button>

                <button
                  onClick={() => setShowAddFeedModal(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Evento</span>
                </button>
              </div>
            </div>

            {/* Main Feed Content with Smooth Scrolling */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6">
              <div className="max-w-4xl mx-auto space-y-3.5 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a3449]">
                {filteredFeed.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-[#0f141d]/40 rounded-2xl border border-dashed border-[#2a3449]">
                    <p className="text-sm font-medium mb-1">Nenhum registro encontrado no Feed da Jornada.</p>
                    {feedSearchQuery && (
                      <p className="text-xs text-slate-600">Nenhum resultado para "{feedSearchQuery}". Tente outro termo ou categoria.</p>
                    )}
                  </div>
                ) : (
                  filteredFeed.map((ev) => {
                  const linkedNpc = ev.details?.entityId
                    ? worldEntities.find((e) => e.id === ev.details?.entityId)
                    : worldEntities.find(
                        (e) =>
                          (e.category === 'npc' || (e.category as string) === 'person') &&
                          ev.title?.toLowerCase().includes(e.name.toLowerCase())
                      );

                  const disclosure = linkedNpc ? activeCampaign?.npcDisclosures?.[linkedNpc.id] : undefined;

                  const isNameRevealed = disclosure ? Boolean(disclosure.revealedFields?.name) : true;
                  const isShortDescRevealed = disclosure ? Boolean(disclosure.revealedFields?.shortDesc) : true;
                  const isRaceClassRevealed = disclosure ? Boolean(disclosure.revealedFields?.raceClass) : true;

                  const dynamicTitle = disclosure
                    ? `Encontro / Contato: ${isNameRevealed ? (disclosure.entitySnapshot?.name || linkedNpc?.name) : (disclosure.alias?.trim() || 'Indivíduo Misterioso')}`
                    : ev.title;

                  const dynamicSummary = disclosure
                    ? (isShortDescRevealed
                        ? (disclosure.entitySnapshot?.shortDesc || linkedNpc?.shortDesc || ev.summary)
                        : 'Identidade e histórico velados pelo mistério. O resumo está oculto para os jogadores.')
                    : ev.summary;

                  return (
                    <div
                      key={ev.id}
                      className="relative pl-10 group"
                    >
                      <div className="absolute left-2 top-3 -translate-x-1/2 w-5 h-5 rounded-full bg-[#161c28] border-2 border-amber-500 flex items-center justify-center shadow">
                        {getEventIcon(ev.eventType)}
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all ${
                        ev.isPublic 
                          ? 'bg-[#161c28] border-[#2a3449] hover:border-slate-500 shadow-md' 
                          : 'bg-amber-950/20 border-amber-500/40 shadow-md'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 
                              className={`font-bold text-sm ${linkedNpc ? 'text-amber-300 hover:underline cursor-pointer' : 'text-slate-100'}`}
                              onClick={() => {
                                if (linkedNpc) {
                                  setPreviewNPCForPlayer(linkedNpc);
                                }
                              }}
                              title={linkedNpc ? 'Clique para ver a Ficha do NPC (Visão do Jogador)' : undefined}
                            >
                              {dynamicTitle}
                            </h4>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                              ev.isPublic 
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {ev.isPublic ? '👁️ PÚBLICO' : '🔒 PRIVADO DM'}
                            </span>
                            {disclosure && !isNameRevealed && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/20 text-amber-300 border-amber-500/40">
                                Codinome Ativo
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Botão para Gerenciar Revelações deste NPC específico */}
                            {linkedNpc && (
                              <button
                                onClick={() => {
                                  setSelectedNPCForSharingId(linkedNpc.id);
                                  setShowNPCSharingModal(true);
                                }}
                                className="px-2.5 py-1 bg-gradient-to-r from-cyan-600/30 to-cyan-700/40 hover:from-cyan-600/60 hover:to-cyan-700/70 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                                title="Editar permissões e revelar mais informações deste NPC aos jogadores"
                              >
                                <Share2 className="w-3 h-3 text-cyan-400" />
                                <span>Gerenciar Revelações</span>
                              </button>
                            )}

                            {linkedNpc && (
                              <button
                                onClick={() => setPreviewNPCForPlayer(linkedNpc)}
                                className="p-1 text-slate-400 hover:text-amber-300 rounded text-xs flex items-center gap-1 cursor-pointer"
                                title="Inspecionar ficha como o jogador vê"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => toggleFeedEventVisibility(ev.id)}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded text-xs flex items-center gap-1 cursor-pointer"
                              title={ev.isPublic ? 'Tornar Privado do DM' : 'Tornar Público para os Jogadores'}
                            >
                              {ev.isPublic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => deleteFeedEvent(ev.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                              title="Excluir Evento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className={`text-xs font-serif leading-relaxed ${
                          disclosure && !isShortDescRevealed ? 'text-slate-400 italic' : 'text-slate-300'
                        }`}>
                          {dynamicSummary}
                        </p>

                        {ev.details && Object.keys(ev.details).length > 0 && (
                          <div className="mt-2.5 p-2 bg-[#0a0d14] rounded-lg border border-[#2a3449] text-[11px] text-amber-300 font-mono flex flex-wrap gap-x-4 gap-y-1">
                            {Object.entries(ev.details)
                              .filter(([k]) => k !== 'entityId')
                              .map(([k, v]) => {
                                const displayVal = (k.toLowerCase() === 'origem' && disclosure && !isRaceClassRevealed)
                                  ? 'Origem Oculta'
                                  : String(v);
                                return (
                                  <div key={k}>
                                    <strong className="capitalize text-slate-400">{k}:</strong> {displayVal}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents & Lore Tab Content */}
        {activeTab === 'documents' && (
          <div className="p-6 w-full max-w-6xl mx-auto">
            <CampaignDocumentsStudio />
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="max-w-2xl mx-auto space-y-4 p-6">
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowNPCSharingModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow transition-all cursor-pointer"
                    title="Transmitir e Revelar NPCs do World Building para os Jogadores"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Transmitir NPCs ({Object.values(activeCampaign?.npcDisclosures || {}).filter(d => d.isShared).length})</span>
                  </button>
                  <button
                    onClick={() => activeCampaign && fetchCampaignMembers(activeCampaign.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] text-amber-400 hover:text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    title="Atualizar lista de jogadores"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Atualizar Lista</span>
                  </button>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
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
                              const pName = (mem.characterName && mem.characterName !== 'undefined' ? mem.characterName : '') ||
                                            (mem.displayName && mem.displayName !== 'undefined' ? mem.displayName : '') ||
                                            'Aventureiro';
                              openSheet(mem.id, 'pc', pName, mem);
                            }}
                          >
                            {(() => {
                              const cName = mem.characterName && mem.characterName !== 'undefined' && mem.characterName.trim();
                              const dName = mem.displayName && mem.displayName !== 'undefined' && mem.displayName.trim();
                              if (cName) {
                                if (dName && dName.toLowerCase() !== cName.toLowerCase()) {
                                  return `${cName} (${dName})`;
                                }
                                return cName;
                              }
                              return dName || 'Jogador';
                            })()}
                          </div>
                          <div className={`text-[10px] ${isDM ? 'text-amber-400 font-semibold' : 'text-cyan-400 font-semibold'}`}>
                            {isDM ? 'Dungeon Master (Organizador)' : `Personagem de RPG: ${mem.characterName && mem.characterName !== 'undefined' ? mem.characterName : 'Aventureiro'}`}
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
                            onClick={async () => {
                              const pName = mem.characterName || mem.displayName || 'Jogador';
                              const confirmed = await showConfirm({
                                title: 'Remover Jogador',
                                message: `Tem certeza que deseja remover o jogador "${pName}" desta campanha?`,
                                confirmText: 'Remover Jogador',
                                cancelText: 'Cancelar',
                                variant: 'danger',
                              });
                              if (confirmed) {
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

        {activeTab === 'party' && (
          <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden p-3 md:p-3.5 gap-2.5 bg-[#0a0d14]">
            
            {/* Compact Top Header */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border border-[#2a3449] rounded-2xl flex items-center justify-between gap-3 shrink-0 shadow-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100 font-serif">
                      Membros da Party Oficial
                    </h3>
                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      {activeCampaign.partyMembers?.length || 0} Integrantes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Grupo oficial de heróis e NPCs aliados para divisão de tesouro, loots e XP.
                  </p>
                </div>
              </div>

              {activeCampaign.worldId && (
                <span className="hidden sm:flex text-[10px] text-amber-400 bg-[#0a0d14] px-2.5 py-1 rounded-lg border border-amber-500/30 items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Mundo: {activeWorld?.title || 'Mundo Ativo'}</span>
                </span>
              )}
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
              
              {/* Left Column (lg:col-span-6): Membros Atuais da Party */}
              <div className="lg:col-span-6 flex flex-col gap-2 h-full min-h-0 overflow-hidden bg-[#141a27] border border-[#252f44] rounded-2xl p-3 sm:p-3.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#252f44] pb-2 shrink-0">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-400" />
                    <span>Membros Ativos no Grupo</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeCampaign.partyMembers?.length || 0} integrantes
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {activeCampaign?.partyMembers && activeCampaign.partyMembers.length > 0 ? (
                    activeCampaign.partyMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className="p-2 bg-[#0a0d14] border border-[#252f44] hover:border-[#354360] rounded-xl flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border ${
                            member.type === 'player'
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}>
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{member.type === 'player' ? 'PC' : 'NPC'}</span>
                            )}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-100 truncate">{member.name}</div>
                            <div className="text-[9.5px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                              <span className={member.type === 'player' ? 'text-cyan-400' : 'text-amber-400'}>
                                {member.type === 'player' ? '🎮 Personagem de Jogador' : '🧙‍♂️ NPC Aliado do Mestre'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            const newParty = (activeCampaign.partyMembers || []).filter(m => m.id !== member.id);
                            await updateCampaign({ ...activeCampaign, partyMembers: newParty });
                            toast.success(`${member.name} removido da party.`);
                          }}
                          className="p-1.5 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 rounded-lg transition-colors border border-rose-900/50 shrink-0 cursor-pointer"
                          title="Remover da Party"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 bg-[#0a0d14]/40 rounded-xl border border-dashed border-[#252f44] my-auto">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                      <p className="text-xs font-semibold text-slate-300">Nenhum membro na party oficial ainda.</p>
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        Adicione jogadores do elenco ou NPCs do mundo usando a coluna ao lado.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (lg:col-span-6): Adicionar Jogadores e NPCs do Mundo */}
              <div className="lg:col-span-6 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden bg-[#141a27] border border-[#252f44] rounded-2xl p-3 sm:p-3.5 shadow-xl">
                
                {/* Sub-Tabs Switcher for Add Party (Players vs World NPCs) */}
                <div className="flex items-center justify-between border-b border-[#252f44] pb-2 shrink-0">
                  <span className="text-xs font-bold text-slate-200">
                    Adicionar ao Grupo
                  </span>
                  <div className="flex items-center gap-1 bg-[#0a0d14] p-0.5 rounded-lg border border-[#2a3449]">
                    <button
                      onClick={() => setPartyAddSubTab('players')}
                      className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                        partyAddSubTab === 'players'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Jogadores ({availablePlayers.length})
                    </button>
                    <button
                      onClick={() => setPartyAddSubTab('npcs')}
                      className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                        partyAddSubTab === 'npcs'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      NPCs do Mundo ({availableNpcs.length})
                    </button>
                  </div>
                </div>

                {/* Sub-Tab: Available Players */}
                {partyAddSubTab === 'players' && (
                  <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
                    <div className="text-[11px] text-slate-400 shrink-0">
                      Jogadores conectados ao elenco da campanha:
                    </div>
                    
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {availablePlayers.length > 0 ? (
                        availablePlayers.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#0a0d14] border border-[#252f44] hover:border-[#354360] transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-xs shrink-0">
                                {m.displayName ? m.displayName.charAt(0).toUpperCase() : 'J'}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-200 truncate">
                                  {m.characterName || m.displayName}
                                </div>
                                <div className="text-[9.5px] text-slate-400 font-mono truncate">
                                  {m.displayName}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={async () => {
                                const newParty = [
                                  ...(activeCampaign?.partyMembers || []),
                                  {
                                    id: m.id,
                                    name: m.characterName || m.displayName || 'Jogador',
                                    type: 'player' as const,
                                    userId: m.userId,
                                    avatarUrl: m.avatarUrl,
                                  },
                                ];
                                await updateCampaign({ ...activeCampaign, partyMembers: newParty });
                                toast.success(`${m.characterName || m.displayName} adicionado à party!`);
                              }}
                              className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 rounded-lg text-xs font-bold border border-emerald-500/40 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-5 text-center text-slate-500 bg-[#0a0d14]/40 rounded-xl border border-dashed border-[#252f44] my-auto">
                          <p className="text-xs font-semibold text-slate-400">Todos os jogadores do elenco já estão na party.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-Tab: Available World NPCs */}
                {partyAddSubTab === 'npcs' && (
                  <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
                    {/* Search filter for NPCs */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={npcSearchQuery}
                          onChange={(e) => setNpcSearchQuery(e.target.value)}
                          placeholder="Buscar NPC por nome ou papel..."
                          className="w-full text-xs bg-[#0a0d14] border border-[#252f44] focus:border-amber-500 text-slate-200 pl-8 pr-2.5 py-1.5 rounded-lg outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                      {filteredAvailableNpcs.length > 0 ? (
                        filteredAvailableNpcs.map((npc) => (
                          <div
                            key={npc.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-[#0a0d14] border border-[#252f44] hover:border-amber-500/40 transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                {getEntityPortraitUrl(npc) ? (
                                  <img src={getEntityPortraitUrl(npc)} alt={npc.name} className="w-full h-full object-cover object-[center_18%]" />
                                ) : (
                                  <span>{npc.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                                  {npc.name}
                                </div>
                                <div className="text-[9.5px] text-slate-400 truncate flex items-center gap-1.5">
                                  <span className="text-amber-400 font-medium">{npc.subType || 'NPC'}</span>
                                  {npc.shortDesc && (
                                    <span className="text-slate-500 truncate">• {npc.shortDesc}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={async () => {
                                const npcPortrait = getEntityPortraitUrl(npc);
                                const newParty = [
                                  ...(activeCampaign?.partyMembers || []),
                                  {
                                    id: npc.id,
                                    name: npc.name,
                                    type: 'npc' as const,
                                    avatarUrl: npcPortrait || undefined,
                                  },
                                ];
                                await updateCampaign({ ...activeCampaign, partyMembers: newParty });
                                toast.success(`${npc.name} recrutado para a party!`);
                              }}
                              className="px-2.5 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 rounded-lg text-xs font-bold border border-amber-500/40 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Adicionar</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-5 text-center text-slate-500 bg-[#0a0d14]/40 rounded-xl border border-dashed border-[#252f44] my-auto space-y-1">
                          <p className="text-xs font-semibold text-slate-400">
                            {npcSearchQuery ? 'Nenhum NPC encontrado com esse termo.' : 'Nenhum NPC disponível para adicionar.'}
                          </p>
                          <p className="text-[10.5px] text-slate-500">
                            Crie NPCs no menu de Worldbuilding para integrá-los como aliados na campanha.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {activeTab === 'houserules' && (
          <div className="max-w-2xl mx-auto space-y-4 p-6">
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

        {activeTab === 'safety' && (
          <div className="max-w-4xl mx-auto p-6">
            <LinesAndVeilsPanel
              campaign={activeCampaign}
              onSave={async (newSettings) => {
                await updateCampaign({
                  ...activeCampaign,
                  safetySettings: newSettings,
                });
              }}
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="max-w-2xl mx-auto space-y-4 p-6">
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
          <div className="p-6">
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
                  onChange={(e) => setNewFeedType(e.target.value as CampaignFeedEventType)}
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

      {/* Modal Edit Campaign Details & AI Visual Forge */}
      {activeCampaign && (
        <EditCampaignDetailsModal
          isOpen={showEditDetailsModal}
          onClose={() => setShowEditDetailsModal(false)}
          campaign={activeCampaign}
        />
      )}

      {/* Modal Transmitir NPCs do World Building & Revelação Progressiva */}
      {showNPCSharingModal && activeCampaign && (
        <CampaignNPCSharingModal
          campaign={activeCampaign}
          worldEntities={worldEntities}
          initialEntityId={selectedNPCForSharingId}
          onClose={() => {
            setShowNPCSharingModal(false);
            setSelectedNPCForSharingId(undefined);
          }}
        />
      )}

      {/* Modal Preview da Visão do Jogador */}
      {previewNPCForPlayer && activeCampaign && (
        <PlayerNPCModal
          entity={previewNPCForPlayer}
          disclosure={activeCampaign.npcDisclosures?.[previewNPCForPlayer.id]}
          onClose={() => setPreviewNPCForPlayer(null)}
        />
      )}
    </div>
  );
};
