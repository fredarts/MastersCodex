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
  CheckCheck
} from 'lucide-react';
import { CampaignFeedEvent, CampaignFeedEventType, WorldEntity } from '@/lib/types';
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

export const CampaignFeedModal: React.FC<CampaignFeedModalProps> = ({
  campaignTitle,
  feedEvents = [],
  onClose,
}) => {
  const { activeCampaign } = useCampaign();
  const { worldEntities } = useWorld();
  const [remoteWorldEntities, setRemoteWorldEntities] = useState<WorldEntity[]>([]);
  const [filter, setFilter] = useState<CampaignFeedEventType | 'all'>('all');
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

  // Escuta atualizações de revelação de NPCs em tempo real
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window && activeCampaign?.id) {
      const channel = new BroadcastChannel(`campaign-sync-${activeCampaign.id}`);
      const handleMessage = (e: MessageEvent) => {
        if (e.data?.type === 'NPC_DISCLOSURE_UPDATED') {
          toast.info(`📜 Conhecimento atualizado sobre: ${e.data.entityName || 'Personagem'}`);
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

  // NPCs compartilhados para esta campanha (resolvidos a partir de snapshot salvo, entidades remotas, locais ou feed)
  const sharedNpcs = useMemo(() => {
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
      const isNpc = e.category === 'npc' || (e.category as string) === 'person';
      if (isNpc) {
        const disc = disclosures[e.id];
        if (disc?.isShared) {
          map.set(e.id, e);
        }
      }
    });

    // 3. Fallback inteligente: se houver eventos do feed de encontro de NPC, assegura que o jogador possa inspecionar
    publicEvents.forEach((ev) => {
      if (ev.eventType === 'npc_encounter') {
        const entId = ev.details?.entityId || `feed-npc-${ev.id}`;
        if (!map.has(entId)) {
          const rawTitle = ev.title.replace(/^(Encontro \/ Contato:|Encontro com:|NPC Revelado:)\s*/i, '').trim();
          map.set(entId, {
            id: entId,
            worldId: activeCampaign?.worldId || 'world-1',
            category: 'npc',
            name: rawTitle || 'Personagem Misterioso',
            subType: ev.details?.origem || 'Personagem do Mundo',
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
      if (filter !== 'all' && ev.eventType !== filter) return false;
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

  const filteredSharedNpcs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return sharedNpcs;
    return sharedNpcs.filter((npc) => {
      const disc = activeCampaign?.npcDisclosures?.[npc.id];
      const nameMatch = npc.name.toLowerCase().includes(q);
      const aliasMatch = (disc?.alias || '').toLowerCase().includes(q);
      const subTypeMatch = (npc.subType || '').toLowerCase().includes(q);
      const descMatch = (npc.shortDesc || '').toLowerCase().includes(q);
      return nameMatch || aliasMatch || subTypeMatch || descMatch;
    });
  }, [sharedNpcs, searchQuery, activeCampaign?.npcDisclosures]);

  const getEventIcon = (type: CampaignFeedEventType) => {
    switch (type) {
      case 'battle_summary':
        return <Swords className="w-3.5 h-3.5 text-rose-400" />;
      case 'npc_encounter':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'session_recap':
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case 'world_lore':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Scroll className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getEventBadge = (type: CampaignFeedEventType) => {
    switch (type) {
      case 'battle_summary':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-rose-500/10 text-rose-300 border-rose-500/30">⚔️ Batalha</span>;
      case 'npc_encounter':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-cyan-500/10 text-cyan-300 border-cyan-500/30">💬 NPC</span>;
      case 'session_recap':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/10 text-amber-300 border-amber-500/30">📖 Recap</span>;
      case 'world_lore':
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-purple-500/10 text-purple-300 border-purple-500/30">🔮 Lore</span>;
      default:
        return <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/10 text-amber-300 border-amber-500/30">📜 Registro</span>;
    }
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

            <button
              onClick={() => setFilter('npc_encounter')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === 'npc_encounter'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
              }`}
            >
              <MessageSquare className={`w-3.5 h-3.5 ${filter === 'npc_encounter' ? 'text-slate-950' : 'text-cyan-400'}`} />
              <span>NPCs ({sharedNpcs.length})</span>
              {notifications.unreadCounts.npcs > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              )}
            </button>

            <button
              onClick={() => setFilter('world_lore')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filter === 'world_lore'
                  ? 'bg-amber-600 text-slate-950 shadow-md font-black'
                  : 'bg-[#141a27] text-slate-400 hover:text-slate-200 hover:bg-[#1a2234] border border-[#252f44]'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${filter === 'world_lore' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Lore ({publicEvents.filter((e) => e.eventType === 'world_lore').length})</span>
              {notifications.unreadCounts.lore > 0 && (
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
              placeholder={filter === 'npc_encounter' ? 'Buscar NPCs descobertos...' : 'Buscar crônicas...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#06080d] border border-[#252f44] focus:border-amber-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Feed Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 md:p-6 bg-[#090d14]">
          {/* NPC Encounter Tab View */}
          {filter === 'npc_encounter' ? (
            <div className="w-full max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#252f44]">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Personagens & NPCs Conhecidos pelo Grupo ({sharedNpcs.length})</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Clique em um personagem para inspecionar sua história, segredos e conexões reveladas pelo Mestre.
                  </p>
                </div>
              </div>

              {filteredSharedNpcs.length === 0 ? (
                <div className="p-10 text-center text-slate-500 bg-[#0f1420]/40 rounded-2xl border border-dashed border-[#252f44]">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium mb-1 text-slate-400">Nenhum NPC transmitido para o grupo ainda.</p>
                  <p className="text-xs text-slate-600">
                    Conforme o grupo for encontrando novos personagens e interagindo no mundo, o Mestre revelará as fichas aqui.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {filteredSharedNpcs.map((npc) => {
                    const disc = activeCampaign?.npcDisclosures?.[npc.id];
                    const isImageRevealed = disc ? Boolean(disc.revealedFields?.image) : Boolean(npc.images && npc.images.length > 0);
                    const isNameRevealed = disc ? Boolean(disc.revealedFields?.name) : true;
                    const isUnread = notifications.isNPCUnread(npc.id);
                    const portrait = getEntityPortraitUrl(npc);
                    const displayName = isNameRevealed ? npc.name : (disc?.alias?.trim() || 'Identidade Oculta');

                    return (
                      <div
                        key={npc.id}
                        onClick={() => {
                          notifications.markNPCAsRead(npc.id);
                          setInspectingEntity(npc);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer group shadow-md flex flex-col justify-between gap-3 relative ${
                          isUnread
                            ? 'border-cyan-500 bg-[#121927] ring-1 ring-cyan-500/40 shadow-cyan-950/50'
                            : 'border-[#252f44] bg-[#111724] hover:border-amber-500/60 hover:bg-[#161f30]'
                        }`}
                      >
                        {isUnread && (
                          <span className="absolute -top-2 -right-1.5 px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-cyan-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                            NOVO
                          </span>
                        )}

                        <div className="flex items-center gap-3">
                          {/* Portrait or Silhouette */}
                          <div className="w-12 h-14 rounded-xl overflow-hidden bg-black/60 border border-[#252f44] group-hover:border-amber-500/40 flex-shrink-0 flex items-center justify-center relative">
                            {isImageRevealed && portrait ? (
                              <img src={portrait} alt={displayName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center w-full h-full bg-gradient-to-b from-[#0e131d] to-black">
                                <HelpCircle className="w-5 h-5 text-amber-400/80" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate font-serif">
                              {displayName}
                            </h5>
                            <p className="text-[11px] text-slate-400 truncate">
                              {disc?.revealedFields?.raceClass || !disc
                                ? npc.subType || (npc.attributes as any)?.npcRace || 'NPC do Mundo'
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
                  const linkedNpc = ev.details?.entityId
                    ? sharedNpcs.find((e) => e.id === ev.details?.entityId)
                    : sharedNpcs.find((e) => ev.title?.toLowerCase().includes(e.name.toLowerCase()));

                  const effectiveNpc = linkedNpc || (ev.eventType === 'npc_encounter' ? {
                    id: ev.details?.entityId || `feed-npc-${ev.id}`,
                    worldId: activeCampaign?.worldId || 'world-1',
                    category: 'npc' as const,
                    name: ev.title.replace(/^(Encontro \/ Contato:|Encontro com:|NPC Revelado:)\s*/i, '').trim(),
                    subType: ev.details?.origem || 'Personagem do Mundo',
                    shortDesc: ev.summary || '',
                    status: 'active' as const,
                    images: [],
                    attributes: {},
                  } : undefined);

                  const disc = effectiveNpc ? activeCampaign?.npcDisclosures?.[effectiveNpc.id] : undefined;

                  // Se a transmissão foi revogada pelo Mestre (isShared === false), oculta do feed do jogador
                  if (disc && disc.isShared === false && ev.eventType === 'npc_encounter') {
                    return null;
                  }

                  const isUnread = notifications.isEventUnread(ev);
                  const isNameRevealed = disc ? Boolean(disc.revealedFields?.name) : true;
                  const isShortDescRevealed = disc ? Boolean(disc.revealedFields?.shortDesc) : true;
                  const isRaceClassRevealed = disc ? Boolean(disc.revealedFields?.raceClass) : true;

                  const dynamicTitle = disc
                    ? `Encontro / Contato: ${isNameRevealed ? (disc.entitySnapshot?.name || effectiveNpc?.name) : (disc.alias?.trim() || 'Indivíduo Misterioso')}`
                    : ev.title;

                  const dynamicSummary = disc
                    ? (isShortDescRevealed
                        ? (disc.entitySnapshot?.shortDesc || effectiveNpc?.shortDesc || ev.summary)
                        : 'Identidade e histórico velados pelo mistério. Detalhes ainda não revelados ao grupo.')
                    : ev.summary;

                  return (
                    <div key={ev.id} className="relative pl-10 group animate-fade-in">
                      <div className="absolute left-2 top-3 -translate-x-1/2 w-5 h-5 rounded-full bg-[#161c28] border-2 border-amber-500 flex items-center justify-center shadow">
                        {getEventIcon(ev.eventType)}
                      </div>

                      <div className={`p-4 rounded-2xl border transition-all shadow-md relative ${
                        isUnread
                          ? 'border-amber-500/80 bg-[#182030] ring-1 ring-amber-500/30'
                          : effectiveNpc 
                            ? 'border-[#252f44] bg-[#141a27] hover:border-amber-500/60' 
                            : 'border-[#252f44] bg-[#141a27] hover:border-amber-500/40'
                      }`}>
                        {isUnread && (
                          <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                            NOVO
                          </span>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <h4 
                            className={`font-bold text-sm font-serif ${effectiveNpc ? 'text-amber-300 hover:underline cursor-pointer' : 'text-slate-100'}`}
                            onClick={() => {
                              notifications.markEventAsRead(ev.id);
                              if (effectiveNpc) {
                                notifications.markNPCAsRead(effectiveNpc.id);
                                setInspectingEntity(effectiveNpc);
                              }
                            }}
                          >
                            {dynamicTitle}
                          </h4>
                          {getEventBadge(ev.eventType)}
                        </div>

                        <p className={`text-xs font-serif leading-relaxed whitespace-pre-line ${
                          disc && !isShortDescRevealed ? 'text-slate-500 italic' : 'text-slate-300'
                        }`}>
                          {dynamicSummary}
                        </p>

                        {ev.details && Object.keys(ev.details).length > 0 && (
                          <div className="mt-2.5 p-2.5 bg-[#0a0d14] rounded-xl border border-[#252f44] text-[11px] text-amber-300 font-mono flex flex-wrap gap-x-4 gap-y-1">
                            {Object.entries(ev.details)
                              .filter(([k]) => k !== 'entityId')
                              .map(([k, v]) => {
                                const displayVal = (k.toLowerCase() === 'origem' && disc && !isRaceClassRevealed)
                                  ? 'Origem Oculta'
                                  : String(v);
                                return (
                                  <div key={k} className="flex gap-1.5">
                                    <span className="capitalize font-bold text-slate-400">{k}:</span>
                                    <span className="text-amber-200">{displayVal}</span>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {effectiveNpc && (
                          <div className="mt-3 pt-2.5 border-t border-[#252f44]/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Personagem registrado na história da campanha
                            </span>
                            <button
                              onClick={() => {
                                notifications.markEventAsRead(ev.id);
                                notifications.markNPCAsRead(effectiveNpc.id);
                                setInspectingEntity(effectiveNpc);
                              }}
                              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Inspecionar Ficha & Lore</span>
                            </button>
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
      </div>

      {/* Modal de Inspeção de NPC para Jogador */}
      {inspectingEntity && (
        <PlayerNPCModal
          entity={inspectingEntity}
          disclosure={activeCampaign?.npcDisclosures?.[inspectingEntity.id]}
          onClose={() => setInspectingEntity(null)}
        />
      )}
    </div>
  );
};
