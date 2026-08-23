'use client';

import React, { useState } from 'react';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useCampaign } from '@/context/CampaignContext';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PartyLootModal: React.FC<{ currentCharacterName?: string; currentUserId?: string }> = ({
  currentCharacterName,
  currentUserId,
}) => {
  const [readingItem, setReadingItem] = useState<{ title: string; readableContent: ReadableContent } | null>(null);
  const [itemToDiscard, setItemToDiscard] = useState<PartyLootItem | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const {
    activeLootSession,
    isPartyLootModalOpen,
    setIsPartyLootModalOpen,
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
  const availableItems = activeLootSession?.items.filter((i) => !i.claimedBy) || [];
  const claimedHistory = activeLootSession?.items.filter((i) => i.claimedBy !== null) || [];
  const claimedItemsCount = claimedHistory.length;

  const totalCurrencySum =
    (activeLootSession?.currency.po || 0) +
    (activeLootSession?.currency.pl || 0) +
    (activeLootSession?.currency.pp || 0) +
    (activeLootSession?.currency.pc || 0) +
    (activeLootSession?.currency.pe || 0);

  const isChestEmpty = !activeLootSession || (totalItemsCount === 0 && totalCurrencySum === 0);

  const handleClaim = async (itemId: string) => {
    await claimItem(itemId, activeCharName, currentUserId);
  };

  const handleDistribute = async (itemId: string) => {
    const target = selectedTargets[itemId] || partyMembers[0]?.name || playerMembers[0]?.characterName || activeCharName;
    const partyMatch = partyMembers.find((pm) => pm.name === target);
    const memberMatch = playerMembers.find((m) => m.characterName === target);
    await distributeItem(itemId, target, partyMatch?.userId || memberMatch?.userId);
  };

  const handleSplitMoney = async () => {
    const names = partyMembers.length > 0
      ? partyMembers.map((pm) => pm.name)
      : playerMembers.map((m) => m.characterName || m.displayName || 'Jogador');
    await splitCurrencyEqually(names.length > 0 ? names : [activeCharName]);
  };

  const rarityColors: Record<string, string> = {
    Comum: 'border-slate-600 text-slate-300 bg-slate-800/50',
    Incomum: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
    Raro: 'border-cyan-500/50 text-cyan-300 bg-cyan-950/40',
    'Muito Raro': 'border-purple-500/50 text-purple-300 bg-purple-950/40',
    Lendário: 'border-amber-500/60 text-amber-300 bg-amber-950/40 shadow-amber-500/10',
    Artefato: 'border-rose-500/60 text-rose-300 bg-rose-950/40 shadow-rose-500/10',
  };

  return (
    <AnimatePresence>
      {isPartyLootModalOpen && (
        <div key="party-loot-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <Gift className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-wide text-amber-200">
                      {activeLootSession?.title || 'Baú da Party'}
                    </h2>
                    {activeLootSession && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                          activeLootSession.distributionMode === 'leader_assigned'
                            ? 'border-amber-500/50 text-amber-300 bg-amber-950/50'
                            : 'border-cyan-500/50 text-cyan-300 bg-cyan-950/50'
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
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeLootSession?.description || 'Cofre e tesouros compartilhados do grupo de aventureiros'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPartyLootModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Abas: Itens Disponíveis vs Histórico de Resgates */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('available')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeTab === 'available'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Itens no Baú</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'available' ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {availableItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Resgates</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'history' ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {claimedHistory.length}
                </span>
              </button>
            </div>

            {/* Banner do Líder (caso esteja em modo Líder) */}
            {activeLootSession && activeLootSession.distributionMode === 'leader_assigned' && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isLeader
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>
                    {isLeader ? (
                      <strong className="text-amber-200">Você é o Líder da Party! Selecione o destinatário de cada item.</strong>
                    ) : (
                      <>
                        Líder da Party:{' '}
                        <strong className="text-slate-200">
                          {activeLootSession.leaderCharacterName || 'Líder'}
                        </strong>{' '}
                        (Aguardando distribuição)
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba: Itens Disponíveis */}
            {activeTab === 'available' && (
              <>
                {isChestEmpty ? (
                  <div className="py-12 px-4 text-center space-y-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                      <Package className="w-7 h-7 opacity-70" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-200">O Baú da Party está vazio</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Nenhum item ou moeda restante para resgate no momento. Novos saques enviados pelo mestre ou encontrados em baús aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Moedas */}
                    {totalCurrencySum > 0 && activeLootSession && (
                      <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                            <Coins className="w-4 h-4" />
                            <span>Moedas Disponíveis no Cofre</span>
                          </div>
                          <button
                            onClick={handleSplitMoney}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Dividir Dinheiro Igualmente ({partyMembers.length || playerMembers.length || 1} Membros)
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold pt-1">
                          {activeLootSession.currency.po > 0 && (
                            <span className="text-amber-300">{activeLootSession.currency.po} PO</span>
                          )}
                          {activeLootSession.currency.pl > 0 && (
                            <span className="text-slate-200">{activeLootSession.currency.pl} PL</span>
                          )}
                          {activeLootSession.currency.pp > 0 && (
                            <span className="text-slate-400">{activeLootSession.currency.pp} PP</span>
                          )}
                          {activeLootSession.currency.pc > 0 && (
                            <span className="text-orange-400">{activeLootSession.currency.pc} PC</span>
                          )}
                          {activeLootSession.currency.pe > 0 && (
                            <span className="text-cyan-300">{activeLootSession.currency.pe} PE</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lista de Itens Disponíveis (Some ao pegar) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>Itens Disponíveis para Resgate</span>
                        <span className="text-slate-400 text-[11px]">
                          {availableItems.length} {availableItems.length === 1 ? 'item restante' : 'itens restantes'}
                        </span>
                      </div>

                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {availableItems.length === 0 ? (
                          <div className="py-8 px-4 text-center space-y-2 bg-slate-950/40 border border-slate-800 rounded-xl">
                            <Sparkles className="w-6 h-6 text-emerald-400 mx-auto animate-pulse" />
                            <p className="text-xs font-bold text-slate-200">
                              Todos os itens deste baú já foram resgatados!
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Confira a aba{' '}
                              <button
                                type="button"
                                onClick={() => setActiveTab('history')}
                                className="text-amber-300 underline font-bold hover:text-amber-200"
                              >
                                Histórico de Resgates
                              </button>{' '}
                              para ver quem pegou cada tesouro.
                            </p>
                          </div>
                        ) : (
                          availableItems.map((item) => {
                            const rarityClass = rarityColors[item.rarity || 'Comum'];

                            return (
                              <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-slate-800/80 border-slate-700/80 hover:border-slate-600 transition"
                              >
                                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                  <span className="text-xs font-bold text-amber-400">{item.quantity}x</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-100">{item.name}</span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded border ${rarityClass}`}>
                                        {item.rarity || 'Comum'}
                                      </span>
                                    </div>
                                    {item.notes && <p className="text-[10px] text-slate-400">{item.notes}</p>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isItemReadable(item) && (
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
                                      className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/50 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Ler Conteúdo (Estilo Baldur's Gate 3)"
                                    >
                                      📖 Ler
                                    </button>
                                  )}

                                  {activeLootSession && activeLootSession.distributionMode === 'free_for_all' ? (
                                    <button
                                      onClick={() => handleClaim(item.id)}
                                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
                                      title={`Pegar "${item.name}" para ${activeCharName}`}
                                    >
                                      <Hand className="w-3.5 h-3.5" />
                                      Pegar para Mim
                                    </button>
                                  ) : isLeader ? (
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={selectedTargets[item.id] || playerMembers[0]?.characterName || ''}
                                        onChange={(e) =>
                                          setSelectedTargets({ ...selectedTargets, [item.id]: e.target.value })
                                        }
                                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
                                      >
                                        {playerMembers.map((m) => (
                                          <option key={m.userId} value={m.characterName || m.displayName}>
                                            {m.characterName || m.displayName}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => handleDistribute(item.id)}
                                        className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        Entregar
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-slate-500 text-xs italic">
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Aguardando Líder</span>
                                    </div>
                                  )}

                                  {/* Botão de Excluir / Jogar Fora com Confirmação */}
                                  <button
                                    type="button"
                                    onClick={() => setItemToDiscard(item)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 rounded-lg transition cursor-pointer"
                                    title={`Jogar fora / Excluir "${item.name}" do Baú`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Conteúdo da Aba: Histórico de Resgates */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-400" /> Registro de Itens Resgatados
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {claimedHistory.length} {claimedHistory.length === 1 ? 'item resgatado' : 'itens resgatados'}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {claimedHistory.length === 0 ? (
                    <div className="py-10 px-4 text-center space-y-2 bg-slate-950/40 border border-slate-800 rounded-xl">
                      <Clock className="w-7 h-7 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-300">Nenhum item foi resgatado ainda.</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Assim que alguém pegar um item ou o líder fizer a distribuição, o nome de quem pegou e o horário ficarão registrados aqui.
                      </p>
                    </div>
                  ) : (
                    claimedHistory.map((item) => {
                      const rarityClass = rarityColors[item.rarity || 'Comum'];

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-slate-950/60 border-slate-800/80 transition hover:border-slate-700"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400">{item.quantity}x</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-200">{item.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border ${rarityClass}`}>
                                  {item.rarity || 'Comum'}
                                </span>
                              </div>
                              {item.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2 sm:mt-0">
                            {isItemReadable(item) && (
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
                                className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/50 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Ler Conteúdo"
                              >
                                📖 Ler
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>
                                Pego por: <strong className="text-slate-100">{item.claimedBy?.characterName}</strong>
                              </span>
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

          {/* Rodapé */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-[11px] text-slate-500">
              {isChestEmpty
                ? 'Você pode fechar esta janela a qualquer momento.'
                : 'O baú é atualizado em tempo real para todos os membros da campanha.'}
            </span>
            <button
              onClick={() => setIsPartyLootModalOpen(false)}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </div>
      )}

      {/* Modal de Confirmação de Descarte / Jogar Fora */}
      {itemToDiscard && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-100">Descartar Item do Baú?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza de que deseja jogar fora permanentemente o item <strong className="text-amber-300">{itemToDiscard.name}</strong> ({itemToDiscard.quantity}x) do Baú da Party? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDiscard(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
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
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition shadow-md shadow-rose-900/30 cursor-pointer"
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
