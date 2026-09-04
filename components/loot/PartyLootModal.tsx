'use client';

import React, { useState, useMemo } from 'react';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useCampaign } from '@/context/CampaignContext';
import { useAuth } from '@/context/AuthContext';
import { PartyLootItem, ReadableContent } from '@/lib/types';
import { isItemReadable, getOrCreateReadableContent } from '@/lib/utils/readableLoreUtils';
import { BG3ReadableModal } from '@/components/loot/BG3ReadableModal';
import {
  Coins,
  Crown,
  Gift,
  Hand,
  CheckCircle2,
  X,
  Sparkles,
  Users,
  Send,
  Lock,
  Trash2,
  AlertTriangle,
  Package,
  Clock,
  History,
  Plus,
  Search,
  Swords,
  Shield,
  FlaskConical,
  Scroll,
  Gem,
  Check,
  BookOpen,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const PartyLootModal: React.FC<{ currentCharacterName?: string; currentUserId?: string }> = ({
  currentCharacterName,
  currentUserId,
}) => {
  const [readingItem, setReadingItem] = useState<{ title: string; readableContent: ReadableContent } | null>(null);
  const [itemToDiscard, setItemToDiscard] = useState<PartyLootItem | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'weapons' | 'armors' | 'potions' | 'scrolls' | 'misc'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClaimingAll, setIsClaimingAll] = useState(false);

  const { roleMode } = useAuth();

  const {
    activeLootSession,
    isPartyLootModalOpen,
    setIsPartyLootModalOpen,
    setIsDmLootModalOpen,
    claimItem,
    distributeItem,
    deleteItemFromPartyLoot,
    splitCurrencyEqually,
    closeLootSession,
  } = usePartyLoot();

  const { campaignMembers, activeCampaign } = useCampaign();
  const playerMembers = campaignMembers.filter((m) => m.role === 'player');
  const partyMembers = activeCampaign?.partyMembers || [];

  // Estado local para seleção do destinatário pelo líder em cada item
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});

  const isLeader =
    activeLootSession?.distributionMode === 'leader_assigned' &&
    (activeLootSession?.leaderId === currentUserId ||
      activeLootSession?.leaderCharacterName === currentCharacterName);

  const [activeCharName, setActiveCharName] = useState(currentCharacterName || 'Seu Personagem');

  // Resolve the active character name from local storage if not provided
  React.useEffect(() => {
    if (currentCharacterName) return;
    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1');
      if (saved) {
        const sheets = JSON.parse(saved);
        const campSheet = sheets.find((s: any) => s.campaignId === activeCampaign?.id) || sheets[0];
        if (campSheet && campSheet.characterName && campSheet.characterName !== 'Novo Aventureiro') {
          setActiveCharName(campSheet.characterName);
        }
      }
    } catch (e) {}
  }, [currentCharacterName, activeCampaign?.id]);

  const totalItemsCount = activeLootSession?.items.length || 0;
  const availableItems = useMemo(() => activeLootSession?.items.filter((i) => !i.claimedBy) || [], [activeLootSession?.items]);
  const claimedHistory = useMemo(() => activeLootSession?.items.filter((i) => i.claimedBy !== null) || [], [activeLootSession?.items]);
  const claimedItemsCount = claimedHistory.length;

  const totalCurrencySum =
    (activeLootSession?.currency.po || 0) +
    (activeLootSession?.currency.pl || 0) +
    (activeLootSession?.currency.pp || 0) +
    (activeLootSession?.currency.pc || 0) +
    (activeLootSession?.currency.pe || 0);

  const isChestEmpty = !activeLootSession || (totalItemsCount === 0 && totalCurrencySum === 0);

  // Helper para categorizar itens
  const getItemCategory = (item: PartyLootItem): 'weapons' | 'armors' | 'potions' | 'scrolls' | 'misc' => {
    const name = item.name.toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    if (/espada|adaga|arco|machado|martelo|lança|flecha|cajado|arma|aríete|clava|besta|cimitarra|rapieira|foice/i.test(name + notes)) return 'weapons';
    if (/armadura|escudo|cota|elmo|manto|gibão|couro|peitoral|placas|grevas|bracelete|traje/i.test(name + notes)) return 'armors';
    if (/poção|elixir|frasco|óleo|antídoto|unguento|cura/i.test(name + notes)) return 'potions';
    if (/livro|carta|pergaminho|diário|tomo|mapa|manuscrito|anotação/i.test(name + notes) || isItemReadable(item)) return 'scrolls';
    return 'misc';
  };

  // Filtragem de itens
  const filteredAvailableItems = useMemo(() => {
    return availableItems.filter((item) => {
      const matchCategory = categoryFilter === 'all' || getItemCategory(item) === categoryFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = !query || item.name.toLowerCase().includes(query) || (item.notes && item.notes.toLowerCase().includes(query));
      return matchCategory && matchQuery;
    });
  }, [availableItems, categoryFilter, searchQuery]);

  const splitTargets = React.useMemo(() => {
    const list: { characterName: string; userId?: string }[] = [];
    const seenNames = new Set<string>();

    const normalize = (s?: string) =>
      (s || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const realPlayers = campaignMembers.filter((m) => m.role === 'player');

    if (realPlayers.length > 0) {
      realPlayers.forEach((m) => {
        const charName =
          m.characterName && m.characterName !== 'Novo Aventureiro' && m.characterName !== 'undefined'
            ? m.characterName
            : m.displayName && m.displayName !== 'undefined'
            ? m.displayName
            : 'Jogador';

        const norm = normalize(charName);
        if (norm && !seenNames.has(norm)) {
          seenNames.add(norm);
          list.push({ characterName: charName, userId: m.userId });
        }
      });
    } else if (activeCampaign?.partyMembers && activeCampaign.partyMembers.length > 0) {
      activeCampaign.partyMembers.forEach((pm) => {
        const charName = pm.name;
        const norm = normalize(charName);
        if (norm && !seenNames.has(norm)) {
          seenNames.add(norm);
          list.push({ characterName: charName, userId: pm.userId });
        }
      });
    } else if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        if (saved) {
          const sheets: any[] = JSON.parse(saved);
          sheets.forEach((s) => {
            if (activeCampaign?.id && s.campaignId === activeCampaign.id && s.characterName && s.characterName !== 'Novo Aventureiro') {
              const norm = normalize(s.characterName);
              if (norm && !seenNames.has(norm)) {
                seenNames.add(norm);
                list.push({ characterName: s.characterName, userId: s.userId });
              }
            }
          });
        }
      } catch (e) {}
    }

    if (list.length > 0) return list;
    return [{ characterName: activeCharName, userId: currentUserId }];
  }, [campaignMembers, activeCampaign, activeCharName, currentUserId]);

  const handleClaim = async (itemId: string) => {
    await claimItem(itemId, activeCharName, currentUserId);
  };

  const handleClaimAll = async () => {
    if (filteredAvailableItems.length === 0) return;
    setIsClaimingAll(true);
    try {
      for (const item of filteredAvailableItems) {
        await claimItem(item.id, activeCharName, currentUserId);
      }
      toast.success(`Todos os ${filteredAvailableItems.length} itens foram resgatados para ${activeCharName}!`);
    } catch (e) {
      toast.error('Erro ao resgatar todos os itens.');
    } finally {
      setIsClaimingAll(false);
    }
  };

  const handleDistribute = async (itemId: string) => {
    const target = selectedTargets[itemId] || partyMembers[0]?.name || playerMembers[0]?.characterName || activeCharName;
    const partyMatch = partyMembers.find((pm) => pm.name === target);
    const memberMatch = playerMembers.find((m) => m.characterName === target);
    await distributeItem(itemId, target, partyMatch?.userId || memberMatch?.userId);
  };

  const handleSplitMoney = async () => {
    await splitCurrencyEqually(splitTargets);
  };

  // Cores e auras dos itens inspiradas em Baldur's Gate 3
  const rarityConfig: Record<string, { badge: string; border: string; glow: string; text: string }> = {
    Comum: {
      badge: 'border-slate-600/70 text-slate-300 bg-slate-800/80',
      border: 'border-slate-700/60 hover:border-slate-500',
      glow: '',
      text: 'text-slate-200'
    },
    Incomum: {
      badge: 'border-emerald-500/60 text-emerald-300 bg-emerald-950/70',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
      text: 'text-emerald-300'
    },
    Raro: {
      badge: 'border-cyan-500/60 text-cyan-300 bg-cyan-950/70',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      glow: 'shadow-[0_0_14px_rgba(34,211,238,0.2)]',
      text: 'text-cyan-300'
    },
    'Muito Raro': {
      badge: 'border-purple-500/60 text-purple-300 bg-purple-950/70',
      border: 'border-purple-500/40 hover:border-purple-400',
      glow: 'shadow-[0_0_16px_rgba(168,85,247,0.25)]',
      text: 'text-purple-300'
    },
    Lendário: {
      badge: 'border-amber-500/80 text-amber-300 bg-amber-950/80',
      border: 'border-amber-500/50 hover:border-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      text: 'text-amber-300'
    },
    Artefato: {
      badge: 'border-rose-500/80 text-rose-300 bg-rose-950/80',
      border: 'border-rose-500/60 hover:border-rose-400',
      glow: 'shadow-[0_0_22px_rgba(244,63,94,0.35)]',
      text: 'text-rose-300'
    },
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weapons': return <Swords className="w-4 h-4 text-amber-400" />;
      case 'armors': return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'potions': return <FlaskConical className="w-4 h-4 text-emerald-400" />;
      case 'scrolls': return <Scroll className="w-4 h-4 text-purple-400" />;
      default: return <Gem className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      {isPartyLootModalOpen && (
        <div key="party-loot-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-[96vw] max-w-6xl h-[92vh] max-h-[92vh] bg-[#0c1017]/98 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 text-slate-100 flex flex-col overflow-hidden"
          >
            {/* ==================== 1. TOP HEADER ORNAMENTAL BG3 ==================== */}
            <div className="h-16 shrink-0 bg-gradient-to-r from-[#141a27] via-[#101522] to-[#141a27] border-b border-amber-500/30 px-4 sm:px-6 flex items-center justify-between shadow-md relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                {/* Glowing Baú Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-wide text-amber-200 truncate font-serif leading-tight">
                      {activeLootSession?.title || 'Baú & Tesouro da Party'}
                    </h2>
                    {activeLootSession && (
                      <span
                        className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 shadow-sm ${
                          activeLootSession.distributionMode === 'leader_assigned'
                            ? 'border-amber-500/50 text-amber-300 bg-amber-950/60 ring-1 ring-amber-500/30'
                            : 'border-cyan-500/50 text-cyan-300 bg-cyan-950/60 ring-1 ring-cyan-500/30'
                        }`}
                      >
                        {activeLootSession.distributionMode === 'leader_assigned' ? (
                          <>
                            <Crown className="w-3 h-3 text-amber-400" /> Modo Líder
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3 text-cyan-400" /> Modo Livre
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                    {activeLootSession?.description || 'Distribuição de saques, moedas e itens mágicos em tempo real'}
                  </p>
                </div>
              </div>

              {/* Right Header Navigation & Actions */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Abas Superiores */}
                <div className="flex items-center bg-[#070a10] p-1 rounded-xl border border-[#2a3449]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('available')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      activeTab === 'available'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Baú</span>
                    <span className="text-[10px] px-1.5 rounded-full font-mono bg-black/40 text-amber-200">
                      {availableItems.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                      activeTab === 'history'
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Histórico</span>
                    <span className="text-[10px] px-1.5 rounded-full font-mono bg-black/40 text-amber-200">
                      {claimedHistory.length}
                    </span>
                  </button>
                </div>

                {roleMode === 'dm' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPartyLootModalOpen(false);
                      setIsDmLootModalOpen(true);
                    }}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                    title="Adicionar mais itens e tesouros ao baú"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enviar Loot</span>
                  </button>
                )}

                <button
                  onClick={() => setIsPartyLootModalOpen(false)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl border border-transparent hover:border-[#2a3449] transition cursor-pointer"
                  title="Fechar Baú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ==================== 2. MAIN WORKSPACE BODY (DUAL COLUMN) ==================== */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              
              {/* ===== COLUNA PRINCIPAL ESQUERDA: LISTA/GRID DE ITENS (65-70%) ===== */}
              <div className="flex-1 min-h-0 flex flex-col bg-[#070a10] border-b lg:border-b-0 lg:border-r border-[#232d40] overflow-hidden">
                
                {activeTab === 'available' ? (
                  <>
                    {/* Filtros & Barra de Pesquisa de Itens */}
                    <div className="p-3 sm:p-4 bg-[#0a0e17] border-b border-[#232d40] flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none">
                      {/* Category Pills */}
                      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                        {[
                          { key: 'all', label: 'Todos', icon: Layers },
                          { key: 'weapons', label: 'Armas', icon: Swords },
                          { key: 'armors', label: 'Armaduras', icon: Shield },
                          { key: 'potions', label: 'Poções', icon: FlaskConical },
                          { key: 'scrolls', label: 'Pergaminhos & Livros', icon: Scroll },
                          { key: 'misc', label: 'Valiosos', icon: Gem },
                        ].map((cat) => {
                          const Icon = cat.icon;
                          const isActive = categoryFilter === cat.key;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => setCategoryFilter(cat.key as any)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                isActive
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141c2c] border border-transparent'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Search Bar & Auto-Loot All Button */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-48">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar itens..."
                            className="w-full bg-[#121824] border border-[#2a3449] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                          />
                        </div>

                        {activeLootSession?.distributionMode === 'free_for_all' && filteredAvailableItems.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClaimAll}
                            disabled={isClaimingAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
                            title="Pegar todos os itens listados para o seu personagem de uma vez"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Pegar Todos</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Grid de Itens Disponíveis */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 custom-scrollbar">
                      {isChestEmpty || filteredAvailableItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                            <Package className="w-8 h-8 opacity-60 animate-bounce" />
                          </div>
                          <h3 className="text-base font-bold text-slate-200 font-serif">
                            {searchQuery || categoryFilter !== 'all' ? 'Nenhum item encontrado no filtro' : 'O Baú da Party está vazio'}
                          </h3>
                          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                            {searchQuery || categoryFilter !== 'all'
                              ? 'Tente limpar os filtros de busca para ver os outros tesouros disponíveis.'
                              : 'Todos os itens foram resgatados ou ainda não foram enviados pelo Mestre.'}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                          {filteredAvailableItems.map((item) => {
                            const rarity = rarityConfig[item.rarity || 'Comum'] || rarityConfig['Comum'];
                            const category = getItemCategory(item);
                            const isReadable = isItemReadable(item);

                            return (
                              <div
                                key={item.id}
                                className={`p-3 rounded-2xl border bg-[#0f1422] ${rarity.border} ${rarity.glow} transition-all duration-200 flex flex-col justify-between gap-3 group relative overflow-hidden`}
                              >
                                {/* Top info */}
                                <div className="flex items-start gap-3">
                                  {/* Item Icon Box */}
                                  <div className="w-10 h-10 rounded-xl bg-[#070a12] border border-[#2a3449] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                                    {getCategoryIcon(category)}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded">
                                        {item.quantity}x
                                      </span>
                                      <h4 className={`text-xs sm:text-sm font-bold truncate ${rarity.text}`} title={item.name}>
                                        {item.name}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold uppercase tracking-wider ${rarity.badge}`}>
                                        {item.rarity || 'Comum'}
                                      </span>
                                      {item.notes && (
                                        <span className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
                                          {item.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom action buttons */}
                                <div className="flex items-center justify-between pt-2 border-t border-[#1f2738]/80 gap-2">
                                  {isReadable ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const lore = getOrCreateReadableContent({
                                          name: item.name,
                                          notes: item.notes,
                                          readableContent: item.readableContent,
                                        });
                                        setReadingItem({ title: item.name, readableContent: lore });
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Ler Conteúdo (Estilo Baldur's Gate 3)"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      <span>Ler</span>
                                    </button>
                                  ) : (
                                    <div />
                                  )}

                                  <div className="flex items-center gap-1.5">
                                    {activeLootSession && activeLootSession.distributionMode === 'free_for_all' ? (
                                      <button
                                        onClick={() => handleClaim(item.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                                        title={`Pegar "${item.name}" para ${activeCharName}`}
                                      >
                                        <Hand className="w-3.5 h-3.5" />
                                        <span>Pegar</span>
                                      </button>
                                    ) : isLeader ? (
                                      <div className="flex items-center gap-1.5">
                                        <select
                                          value={selectedTargets[item.id] || playerMembers[0]?.characterName || ''}
                                          onChange={(e) =>
                                            setSelectedTargets({ ...selectedTargets, [item.id]: e.target.value })
                                          }
                                          className="bg-[#0a0d14] border border-[#2a3449] rounded-xl px-2 py-1 text-xs text-slate-200 outline-none max-w-[120px]"
                                        >
                                          {playerMembers.map((m) => (
                                            <option key={m.userId} value={m.characterName || m.displayName}>
                                              {m.characterName || m.displayName}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          onClick={() => handleDistribute(item.id)}
                                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Dar</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-slate-500 text-xs italic">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span>Aguardando Líder</span>
                                      </div>
                                    )}

                                    {/* Botão de Excluir / Descartar */}
                                    <button
                                      type="button"
                                      onClick={() => setItemToDiscard(item)}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 rounded-xl transition cursor-pointer"
                                      title={`Jogar fora "${item.name}" do Baú`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Aba de Histórico de Resgates */
                  <div className="flex-1 min-h-0 flex flex-col p-4 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between pb-3 border-b border-[#232d40] text-xs font-semibold text-slate-300 shrink-0">
                      <span className="flex items-center gap-1.5 font-bold text-slate-100">
                        <History className="w-4 h-4 text-amber-400" /> Registro de Resgates em Tempo Real
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {claimedHistory.length} {claimedHistory.length === 1 ? 'item resgatado' : 'itens resgatados'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-3">
                      {claimedHistory.length === 0 ? (
                        <div className="py-12 text-center space-y-2 text-slate-500">
                          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs font-bold text-slate-300">Nenhum item foi resgatado ainda.</p>
                        </div>
                      ) : (
                        claimedHistory.map((item) => {
                          const rarity = rarityConfig[item.rarity || 'Comum'] || rarityConfig['Comum'];
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-xl border bg-[#0f1422] border-[#232d40]"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-slate-400">{item.quantity}x</span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-200">{item.name}</span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${rarity.badge}`}>
                                      {item.rarity || 'Comum'}
                                    </span>
                                  </div>
                                  {item.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</p>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{item.claimedBy?.characterName}</span>
                                  {item.claimedBy?.claimedAt && (
                                    <span className="text-[10px] text-slate-400 font-mono">({item.claimedBy.claimedAt})</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ===== COLUNA LATERAL DIREITA: COFRE DE MOEDAS & ROSTER DA PARTY (30-35%) ===== */}
              <div className="w-full lg:w-80 xl:w-96 bg-[#0a0e17] p-4 flex flex-col justify-between gap-4 overflow-y-auto custom-scrollbar shrink-0 select-none">
                
                {/* 1. Cofre de Moedas Interativo */}
                <div className="bg-[#0f1422] border-2 border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#232d40] pb-2.5">
                    <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
                      <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>Cofre de Moedas</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      {totalCurrencySum > 0 ? 'Disponível' : 'Vazio'}
                    </span>
                  </div>

                  {/* Grid de Moedas D&D 5e */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono font-black">
                    <div className="p-2 bg-[#070a12] rounded-xl border border-amber-500/30 flex items-center justify-between">
                      <span className="text-amber-400 flex items-center gap-1">🪙 PO</span>
                      <span className="text-slate-100">{activeLootSession?.currency.po || 0}</span>
                    </div>
                    <div className="p-2 bg-[#070a12] rounded-xl border border-slate-700 flex items-center justify-between">
                      <span className="text-slate-200 flex items-center gap-1">⚪ PL</span>
                      <span className="text-slate-100">{activeLootSession?.currency.pl || 0}</span>
                    </div>
                    <div className="p-2 bg-[#070a12] rounded-xl border border-slate-700 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">🥈 PP</span>
                      <span className="text-slate-100">{activeLootSession?.currency.pp || 0}</span>
                    </div>
                    <div className="p-2 bg-[#070a12] rounded-xl border border-orange-500/30 flex items-center justify-between">
                      <span className="text-orange-400 flex items-center gap-1">🥉 PC</span>
                      <span className="text-slate-100">{activeLootSession?.currency.pc || 0}</span>
                    </div>
                  </div>

                  {/* Botão de Divisão Igualitária */}
                  {totalCurrencySum > 0 && (
                    <button
                      type="button"
                      onClick={handleSplitMoney}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Dividir Igualmente ({splitTargets.length} Membros)</span>
                    </button>
                  )}
                </div>

                {/* 2. Roster da Party / Destinatários */}
                <div className="bg-[#0f1422] border border-[#232d40] rounded-2xl p-4 space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-[#232d40]">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" /> Aventureiros do Grupo
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {splitTargets.length} presentes
                    </span>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar pr-1 flex-1">
                    {splitTargets.map((target, idx) => {
                      const isMe = target.characterName.toLowerCase() === activeCharName.toLowerCase();
                      return (
                        <div
                          key={`${target.characterName}-${idx}`}
                          className={`flex items-center justify-between p-2 rounded-xl border text-xs transition ${
                            isMe
                              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                              : 'bg-[#070a12] border-[#232d40] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border ${isMe ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                              {target.characterName.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold truncate max-w-[130px] sm:max-w-[160px]">
                              {target.characterName}
                            </span>
                          </div>
                          {isMe && (
                            <span className="text-[9px] font-mono font-bold bg-cyan-900/80 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-400/40">
                              VOCÊ
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Rodapé do Painel */}
                <div className="pt-2 border-t border-[#232d40] flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Sincronização em tempo real
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPartyLootModalOpen(false)}
                    className="px-4 py-2 bg-[#172030] hover:bg-[#223049] border border-[#2a3449] hover:border-amber-500/40 text-slate-200 hover:text-amber-300 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Fechar Baú
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Confirmação de Descarte / Jogar Fora */}
      {itemToDiscard && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-[#0e131d] border-2 border-rose-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0 animate-pulse" />
              <h3 className="font-bold text-base text-slate-100 font-serif">Descartar Item do Baú?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza de que deseja jogar fora permanentemente o item <strong className="text-amber-300">{itemToDiscard.name}</strong> ({itemToDiscard.quantity}x) do Baú da Party? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#232d40]">
              <button
                type="button"
                onClick={() => setItemToDiscard(null)}
                className="px-3.5 py-1.5 bg-[#172030] hover:bg-[#202c42] text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = itemToDiscard.id;
                  setItemToDiscard(null);
                  await deleteItemFromPartyLoot(id);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition shadow-md shadow-rose-900/40 cursor-pointer"
              >
                Sim, Jogar Fora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Leitura BG3 */}
      {readingItem && (
        <BG3ReadableModal
          isOpen={Boolean(readingItem)}
          onClose={() => setReadingItem(null)}
          title={readingItem.title}
          readableContent={readingItem.readableContent}
        />
      )}
    </AnimatePresence>
  );
};
