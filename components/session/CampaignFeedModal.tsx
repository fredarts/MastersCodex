'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scroll, 
  Swords, 
  MessageSquare, 
  BookOpen, 
  Search, 
  X, 
  HelpCircle,
  Sparkles, 
  Shield, 
  Users, 
  Lock, 
  Eye, 
  Crown, 
  CheckCheck,
  MapPin,
  Flag,
  Gem,
  Flame
} from 'lucide-react';
import { CampaignFeedEvent, CampaignFeedEventType, WorldEntity, WorldEntityCategory } from '@/lib/types';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaignNotifications } from '@/lib/hooks/useCampaignNotifications';
import { worldService } from '@/lib/services/worldService';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';
import { PlayerNPCModal } from '@/components/player-view/PlayerNPCModal';
import { toast } from 'sonner';

interface CampaignFeedModalProps {
  campaignTitle: string;
  feedEvents: CampaignFeedEvent[];
  onClose: () => void;
}

type FeedTabFilter = 'all' | 'session_recap' | 'battle_summary' | 'worldbuilding';

export const CampaignFeedModal: React.FC<CampaignFeedModalProps> = ({
  campaignTitle,
  feedEvents = [],
  onClose,
}) => {
  const { activeCampaign } = useCampaign();
  const { worldEntities } = useWorld();
  const [remoteWorldEntities, setRemoteWorldEntities] = useState<WorldEntity[]>([]);
  const [filter, setFilter] = useState<FeedTabFilter>('all');
  const [worldCategoryFilter, setWorldCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingEntity, setInspectingEntity] = useState<WorldEntity | null>(null);

  const notifications = useCampaignNotifications(
    activeCampaign?.id,
    activeCampaign?.npcDisclosures,
    feedEvents
  );

  // Busca entidades do mundo associado à campanha (para quando for conta de jogador que não é dona do mundo)
  useEffect(() => {
    if (activeCampaign?.worldId) {
      worldService.fetchWorldEntities(activeCampaign.worldId).then((res) => {
        if (res.ok && res.value) {
          setRemoteWorldEntities(res.value);
        }
      });
    }
  }, [activeCampaign?.worldId]);

  // Escuta atualizações de revelação de entidades em tempo real
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window && activeCampaign?.id) {
      const channel = new BroadcastChannel(`campaign-sync-${activeCampaign.id}`);
      const handleMessage = (e: MessageEvent) => {
        if (e.data?.type === 'NPC_DISCLOSURE_UPDATED') {
          toast.info(`📜 Conhecimento atualizado sobre: ${e.data.entityName || 'World Building'}`);
        }
      };
      channel.addEventListener('message', handleMessage);
      return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      };
    }
  }, [activeCampaign?.id]);

  // Filtra apenas eventos marcados como PÚBLICOS para proteger notas do Mestre
  const publicEvents = useMemo(() => {
    return feedEvents.filter((ev) => ev.isPublic);
  }, [feedEvents]);

  // Entidades de World Building compartilhadas para esta campanha (NPCs, Locais, Facções, Itens, Religiões, Feitiços, Lore)
  const sharedWorldEntities = useMemo(() => {
    const disclosures = activeCampaign?.npcDisclosures || {};
    const map = new Map<string, WorldEntity>();

    // 1. Prioridade máxima: Snapshots de entidades embutidos nas disclosures salvas na campanha
    Object.values(disclosures).forEach((disc) => {
      if (disc.isShared && disc.entitySnapshot) {
        map.set(disc.entityId, disc.entitySnapshot);
      }
    });

    // 2. Mescla com entidades carregadas do mundo (locais ou remotas)
    const combinedEntities = [...worldEntities, ...remoteWorldEntities];
    combinedEntities.forEach((e) => {
      const disc = disclosures[e.id];
      if (disc?.isShared) {
        map.set(e.id, e);
      }
    });

    // 3. Fallback inteligente: eventos do feed de encontro de NPC ou Lore revelada
    publicEvents.forEach((ev) => {
      if (ev.eventType === 'npc_encounter' || ev.eventType === 'world_lore') {
        const entId = ev.details?.entityId || `feed-ent-${ev.id}`;
        if (!map.has(entId)) {
          const isNpc = ev.eventType === 'npc_encounter';
          const rawTitle = ev.title.replace(/^(Encontro \/ Contato:|Encontro com:|NPC Revelado:|Lore Revelada:|Worldbuilding Revelado:)\s*/i, '').trim();
          map.set(entId, {
            id: entId,
            worldId: activeCampaign?.worldId || 'world-1',
            category: (ev.details?.category as WorldEntityCategory) || (isNpc ? 'npc' : 'location'),
            name: rawTitle || (isNpc ? 'Personagem Misterioso' : 'Conhecimento do Mundo'),
            subType: ev.details?.origem || (isNpc ? 'Personagem do Mundo' : 'Lore Revelada'),
            shortDesc: ev.summary || '',
            status: 'active',
            images: [],
            attributes: {},
          });
        }
      }
    });

    return Array.from(map.values());
  }, [worldEntities, remoteWorldEntities, activeCampaign?.npcDisclosures, activeCampaign?.worldId, publicEvents]);

  const filteredEvents = useMemo(() => {
    return publicEvents.filter((ev) => {
      if (filter !== 'all') {
        if (filter === 'session_recap' && ev.eventType !== 'session_recap') return false;
        if (filter === 'battle_summary' && ev.eventType !== 'battle_summary') return false;
        if (filter === 'worldbuilding' && ev.eventType !== 'npc_encounter' && ev.eventType !== 'world_lore') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = ev.title?.toLowerCase().includes(q);
        const matchesSummary = ev.summary?.toLowerCase().includes(q);
        const matchesDetails = ev.details && Object.values(ev.details).some((v) => String(v).toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesDetails) return false;
      }
      return true;
    });
  }, [publicEvents, filter, searchQuery]);

  const filteredSharedEntities = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return sharedWorldEntities.filter((ent) => {
      let matchesCat = worldCategoryFilter === 'all';
      if (worldCategoryFilter === 'npc') matchesCat = ent.category === 'npc' || (ent.category as string) === 'person';
      else if (worldCategoryFilter === 'location') matchesCat = ent.category === 'location';
      else if (worldCategoryFilter === 'faction') matchesCat = ent.category === 'faction' || ent.category === 'religion';
      else if (worldCategoryFilter === 'item') matchesCat = ent.category === 'item' || ent.category === 'material';
      else if (worldCategoryFilter === 'spell') matchesCat = ent.category === 'spell' || ent.category === 'magic_system';
      else if (worldCategoryFilter === 'lore') matchesCat = !['npc', 'person', 'location', 'faction', 'religion', 'item', 'material', 'spell', 'magic_system'].includes(ent.category);

      if (!matchesCat) return false;

      if (!q) return true;
      const disc = activeCampaign?.npcDisclosures?.[ent.id];
      const nameMatch = ent.name.toLowerCase().includes(q);
      const aliasMatch = (disc?.alias || '').toLowerCase().includes(q);
      const subTypeMatch = (ent.subType || '').toLowerCase().includes(q);
      const descMatch = (ent.shortDesc || '').toLowerCase().includes(q);
      const tagMatch = (ent.tags || []).some((t) => t.toLowerCase().includes(q));
      return nameMatch || aliasMatch || subTypeMatch || descMatch || tagMatch;
    });
  }, [sharedWorldEntities, searchQuery, worldCategoryFilter, activeCampaign?.npcDisclosures]);

  const getEventIcon = (type: CampaignFeedEventType) => {
    switch (type) {
      case 'battle_summary':
        return <Swords className="w-3.5 h-3.5 text-rose-400" />;
      case 'npc_encounter':
        return <Users className="w-3.5 h-3.5 text-cyan-400" />;
      case 'session_recap':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'world_lore':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Scroll className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getEventBadge = (type: CampaignFeedEventType) => {
    switch (type) {
      case 'battle_summary':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-rose-500/10 text-rose-300 border-rose-500/30">⚔️ Batalha</span>;
      case 'npc_encounter':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-cyan-500/10 text-cyan-300 border-cyan-500/30">👤 NPC</span>;
      case 'session_recap':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/10 text-amber-300 border-amber-500/30">📖 Recap</span>;
      case 'world_lore':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-purple-500/10 text-purple-300 border-purple-500/30">✨ Lore</span>;
      default:
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/10 text-amber-300 border-amber-500/30">📜 Registro</span>;
    }
  };

  const getCategoryIcon = (cat: WorldEntityCategory | string) => {
    if (cat === 'npc' || cat === 'person') return <Users className="w-3.5 h-3.5 text-cyan-400" />;
    if (cat === 'location') return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
    if (cat === 'faction' || cat === 'religion') return <Flag className="w-3.5 h-3.5 text-purple-400" />;
    if (cat === 'item' || cat === 'material') return <Gem className="w-3.5 h-3.5 text-yellow-400" />;
    if (cat === 'spell' || cat === 'magic_system') return <Flame className="w-3.5 h-3.5 text-rose-400" />;
    return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
  };

  const getCategoryBadge = (cat: WorldEntityCategory | string) => {
    if (cat === 'npc' || cat === 'person') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase bg-cyan-500/20 text-cyan-300 border-cyan-500/30">👤 NPC</span>;
    if (cat === 'location') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase bg-emerald-500/20 text-emerald-300 border-emerald-500/30">🏰 Local</span>;
    if (cat === 'faction' || cat === 'religion') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase bg-purple-500/20 text-purple-300 border-purple-500/30">🛡️ Facção</span>;
    if (cat === 'item' || cat === 'material') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase bg-yellow-500/20 text-yellow-300 border-yellow-500/30">✨ Item</span>;
    if (cat === 'spell' || cat === 'magic_system') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase bg-rose-500/20 text-rose-300 border-rose-500/30">🔮 Feitiço</span>;
    return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase bg-amber-500/20 text-amber-300 border-amber-500/30">📜 Lore</span>;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-3 md:p-4 animate-fade-in">
      <div className="bg-[#0c1018] border border-amber-500/30 rounded-2xl w-full h-full max-w-[1440px] max-h-[96vh] md:max-h-[94vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#252f44] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-2 font-serif">
                <span>Crônicas & Diário da Campanha</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                {campaignTitle} • Acompanhe a história, recaps de sessões e conhecimentos revelados
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#161c28] hover:bg-[#1f2738] border border-[#252f44] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Filters & Quick Search */}
        <div className="p-3 sm:p-4 border-b border-[#252f44] bg-[#0c101a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
              }`}
            >
              <Scroll className={`w-3.5 h-3.5 ${filter === 'all' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Todos ({publicEvents.length})</span>
            </button>

            <button
              onClick={() => setFilter('session_recap')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === 'session_recap'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${filter === 'session_recap' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Recaps ({publicEvents.filter((e) => e.eventType === 'session_recap').length})</span>
              {notifications.unreadCounts.recaps > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              )}
            </button>

            <button
              onClick={() => setFilter('battle_summary')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === 'battle_summary'
                  ? 'bg-rose-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
              }`}
            >
              <Swords className={`w-3.5 h-3.5 ${filter === 'battle_summary' ? 'text-slate-950' : 'text-rose-400'}`} />
              <span>Batalhas ({publicEvents.filter((e) => e.eventType === 'battle_summary').length})</span>
              {notifications.unreadCounts.battles > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </button>

            {/* ABA UNIFICADA: WORLD BUILDING */}
            <button
              onClick={() => setFilter('worldbuilding')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === 'worldbuilding'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${filter === 'worldbuilding' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>World Building ({sharedWorldEntities.length})</span>
              {(notifications.unreadCounts.npcs > 0 || notifications.unreadCounts.lore > 0) && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              )}
            </button>

            {/* Mark All as Read Button */}
            {notifications.unreadCounts.total > 0 && (
              <button
                onClick={notifications.markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer whitespace-nowrap shadow-sm ml-1"
                title="Marcar todas as novidades como vistas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Marcar Lido</span>
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={filter === 'worldbuilding' ? 'Buscar no World Building...' : 'Buscar crônicas...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#06080d] border border-[#252f44] focus:border-amber-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Feed Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 md:p-6 bg-[#090d14]">
          {/* World Building Unified Tab View */}
          {filter === 'worldbuilding' ? (
            <div className="w-full max-w-7xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#252f44] gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-serif">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Entidades & Conhecimento de World Building Revelados ({sharedWorldEntities.length})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Clique em qualquer NPC, Local, Facção, Item ou Lore para inspecionar história, segredos e detalhes revelados pelo Mestre.
                  </p>
                </div>

                {/* Sub-Filters by Category */}
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                  <button
                    onClick={() => setWorldCategoryFilter('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      worldCategoryFilter === 'all'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-[#121824] border border-[#252f44]'
                    }`}
                  >
                    Todos ({sharedWorldEntities.length})
                  </button>
                  <button
                    onClick={() => setWorldCategoryFilter('npc')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      worldCategoryFilter === 'npc'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-[#121824] border border-[#252f44]'
                    }`}
                  >
                    NPCs ({sharedWorldEntities.filter(e => e.category === 'npc' || (e.category as string) === 'person').length})
                  </button>
                  <button
                    onClick={() => setWorldCategoryFilter('location')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      worldCategoryFilter === 'location'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-[#121824] border border-[#252f44]'
                    }`}
                  >
                    Locais ({sharedWorldEntities.filter(e => e.category === 'location').length})
                  </button>
                  <button
                    onClick={() => setWorldCategoryFilter('faction')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      worldCategoryFilter === 'faction'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-[#121824] border border-[#252f44]'
                    }`}
                  >
                    Facções ({sharedWorldEntities.filter(e => e.category === 'faction' || e.category === 'religion').length})
                  </button>
                  <button
                    onClick={() => setWorldCategoryFilter('item')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      worldCategoryFilter === 'item'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-[#121824] border border-[#252f44]'
                    }`}
                  >
                    Itens ({sharedWorldEntities.filter(e => e.category === 'item' || e.category === 'material').length})
                  </button>
                  <button
                    onClick={() => setWorldCategoryFilter('spell')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      worldCategoryFilter === 'spell'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-[#121824] border border-[#252f44]'
                    }`}
                  >
                    Feitiços ({sharedWorldEntities.filter(e => e.category === 'spell' || e.category === 'magic_system').length})
                  </button>
                </div>
              </div>

              {filteredSharedEntities.length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-[#0f1420]/40 rounded-2xl border border-dashed border-[#252f44]">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium mb-1 text-slate-400">Nenhum elemento de World Building encontrado.</p>
                  <p className="text-xs text-slate-600">
                    Conforme o grupo for encontrando NPCs, explorando cidades e descobrindo segredos, o Mestre transmitirá as informações aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filteredSharedEntities.map((ent) => {
                    const disc = activeCampaign?.npcDisclosures?.[ent.id];
                    const isImageRevealed = disc ? Boolean(disc.revealedFields?.image) : Boolean(ent.images && ent.images.length > 0);
                    const isNameRevealed = disc ? Boolean(disc.revealedFields?.name) : true;
                    const isUnread = notifications.isNPCUnread(ent.id);
                    const portrait = getEntityPortraitUrl(ent);
                    const displayName = isNameRevealed ? ent.name : (disc?.alias?.trim() || 'Identidade Oculta');
                    const isNpc = ent.category === 'npc' || (ent.category as string) === 'person';

                    return (
                      <div
                        key={ent.id}
                        onClick={() => {
                          notifications.markNPCAsRead(ent.id);
                          setInspectingEntity(ent);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group shadow-md flex flex-col justify-between gap-3 relative ${
                          isUnread
                            ? 'border-amber-500 bg-[#121927] ring-1 ring-amber-500/40 shadow-amber-950/50'
                            : 'border-[#252f44] bg-[#111724] hover:border-amber-500/60 hover:bg-[#161f30]'
                        }`}
                      >
                        {isUnread && (
                          <span className="absolute -top-2 -right-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                            NOVO
                          </span>
                        )}

                        <div className="flex items-center gap-3">
                          {/* Portrait or Silhouette / Icon */}
                          <div className="w-12 h-14 rounded-xl overflow-hidden bg-black/60 border border-[#252f44] group-hover:border-amber-500/40 flex-shrink-0 flex items-center justify-center relative">
                            {isImageRevealed && portrait ? (
                              <img src={portrait} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center w-full h-full bg-gradient-to-b from-[#0e131d] to-black">
                                {isImageRevealed ? getCategoryIcon(ent.category) : <HelpCircle className="w-5 h-5 text-amber-400/80" />}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              {getCategoryBadge(ent.category)}
                            </div>
                            <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate font-serif">
                              {displayName}
                            </h5>
                            <p className="text-[11px] text-slate-400 truncate">
                              {disc?.revealedFields?.raceClass || !disc
                                ? ent.subType || (ent.attributes as any)?.npcRace || (isNpc ? 'Personagem do Mundo' : 'World Building')
                                : 'Origem Desconhecida'}
                            </p>
                            {!isNameRevealed && (
                              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block mt-0.5">
                                [Codinome]
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Badges of discoveries */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#252f44]/60 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {disc?.revealedFields?.secrets ? (
                              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                <Crown className="w-3 h-3" /> Segredo Revelado
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Lock className="w-3 h-3" /> Segredos Ocultos
                              </span>
                            )}
                          </span>

                          <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-0.5">
                            <span>Ver Detalhes</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Standard Timeline Log List */
            <div className="w-full max-w-5xl mx-auto space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#252f44]">
              {filteredEvents.length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-[#0f1420]/40 rounded-2xl border border-dashed border-[#252f44]">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium mb-1 text-slate-400">Nenhuma crônica pública registrada ainda.</p>
                  <p className="text-xs text-slate-600">
                    {searchQuery ? `Nenhum resultado para "${searchQuery}".` : 'Os acontecimentos marcantes da campanha aparecerão aqui conforme forem narrados pelo Mestre.'}
                  </p>
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const linkedEntity = ev.details?.entityId
                    ? sharedWorldEntities.find((e) => e.id === ev.details?.entityId)
                    : sharedWorldEntities.find(
                        (e) =>
                          ev.title.toLowerCase().includes(e.name.toLowerCase()) ||
                          e.name.toLowerCase().includes(ev.title.toLowerCase())
                      );

                  const disclosure = linkedEntity ? activeCampaign?.npcDisclosures?.[linkedEntity.id] : undefined;
                  const isNameRevealed = disclosure ? Boolean(disclosure.revealedFields?.name) : true;
                  const isImageRevealed = disclosure ? Boolean(disclosure.revealedFields?.image) : Boolean(linkedEntity?.images && linkedEntity.images.length > 0);
                  const isRaceClassRevealed = disclosure ? Boolean(disclosure.revealedFields?.raceClass) : true;
                  const isShortDescRevealed = disclosure ? Boolean(disclosure.revealedFields?.shortDesc) : true;

                  const dynamicTitle = isNameRevealed
                    ? ev.title
                    : ev.title.replace(
                        linkedEntity?.name || '',
                        disclosure?.alias?.trim() || 'Identidade Oculta'
                      );

                  const dynamicSummary = disclosure && !isShortDescRevealed
                    ? 'Detalhes e segredos sobre este contato ainda permanecem misteriosos para o grupo...'
                    : ev.summary;

                  const portrait = linkedEntity ? getEntityPortraitUrl(linkedEntity) : undefined;
                  const isUnread = notifications.isEventUnread(ev);

                  return (
                    <div
                      key={ev.id}
                      className={`relative pl-8 sm:pl-10 group transition-all ${
                        isUnread ? 'opacity-100' : 'opacity-95'
                      }`}
                    >
                      {/* Timeline Node Point */}
                      <div className={`absolute left-2.5 top-3.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 bg-[#0c1018] flex items-center justify-center transition-transform group-hover:scale-125 z-10 ${
                        isUnread ? 'border-amber-400 bg-amber-400' : 'border-[#2a3449] group-hover:border-amber-400'
                      }`}>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>
                        )}
                      </div>

                      {/* Card Container */}
                      <div
                        onClick={() => {
                          notifications.markEventAsRead(ev.id);
                          if (linkedEntity) {
                            setInspectingEntity(linkedEntity);
                          }
                        }}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          linkedEntity ? 'cursor-pointer hover:border-amber-500/60 hover:bg-[#151c2a]' : ''
                        } ${
                          isUnread
                            ? 'border-amber-500/50 bg-[#141b27] ring-1 ring-amber-500/30'
                            : 'border-[#252f44] bg-[#0f1420]'
                        }`}
                      >
                        {/* Event Header */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 rounded-lg bg-[#0a0d14] border border-[#252f44] flex-shrink-0">
                              {getEventIcon(ev.eventType)}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate font-serif">
                              {dynamicTitle}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getEventBadge(ev.eventType)}
                            {ev.createdAt && (
                              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                                {new Date(ev.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Event Body */}
                        <div className="flex items-start gap-3">
                          {linkedEntity && (
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/60 border border-[#252f44] flex-shrink-0 flex items-center justify-center">
                              {isImageRevealed && portrait ? (
                                <img src={portrait} alt="Portrait" className="w-full h-full object-cover" />
                              ) : (
                                <HelpCircle className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 font-serif leading-relaxed line-clamp-3">
                              {dynamicSummary}
                            </p>

                            {/* Details Tags */}
                            {ev.details && Object.keys(ev.details).length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                                {Object.entries(ev.details)
                                  .filter(([k]) => k !== 'entityId')
                                  .map(([k, v]) => {
                                    const displayVal = (k.toLowerCase() === 'origem' && disclosure && !isRaceClassRevealed)
                                      ? 'Origem Oculta'
                                      : String(v);
                                    return (
                                      <span key={k} className="px-2 py-0.5 rounded bg-[#0a0d14] border border-[#252f44] text-slate-400 font-mono">
                                        <strong className="text-slate-300 capitalize">{k}:</strong> {displayVal}
                                      </span>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>

                        {linkedEntity && (
                          <div className="mt-2.5 pt-2 border-t border-[#252f44]/60 flex items-center justify-end text-[10px] text-amber-400 font-bold">
                            <span>Clique para abrir ficha completa no World Building →</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Preview da Visão do Jogador (Universal) */}
        {inspectingEntity && activeCampaign && (
          <PlayerNPCModal
            entity={inspectingEntity}
            disclosure={activeCampaign.npcDisclosures?.[inspectingEntity.id]}
            onClose={() => setInspectingEntity(null)}
          />
        )}
      </div>
    </div>
  );
};
