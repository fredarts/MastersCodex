'use client';

import React, { useState } from 'react';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useCampaign } from '@/context/CampaignContext';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PartyLootModal: React.FC<{ currentCharacterName?: string; currentUserId?: string }> = ({
  currentCharacterName,
  currentUserId,
}) => {
  const {
    activeLootSession,
    isPartyLootModalOpen,
    setIsPartyLootModalOpen,
    claimItem,
    distributeItem,
    splitCurrencyEqually,
    closeLootSession,
  } = usePartyLoot();

  const { campaignMembers } = useCampaign();
  const playerMembers = campaignMembers.filter((m) => m.role === 'player');

  // Estado local para seleção do destinatário pelo líder em cada item
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});

  if (!isPartyLootModalOpen || !activeLootSession) return null;

  const isLeader =
    activeLootSession.distributionMode === 'leader_assigned' &&
    (activeLootSession.leaderId === currentUserId ||
      activeLootSession.leaderCharacterName === currentCharacterName);

  const activeCharName = currentCharacterName || 'Seu Personagem';

  const totalItemsCount = activeLootSession.items.length;
  const claimedItemsCount = activeLootSession.items.filter((i) => i.claimedBy !== null).length;

  const totalCurrencySum =
    (activeLootSession.currency.po || 0) +
    (activeLootSession.currency.pl || 0) +
    (activeLootSession.currency.pp || 0) +
    (activeLootSession.currency.pc || 0) +
    (activeLootSession.currency.pe || 0);

  const handleClaim = async (itemId: string) => {
    await claimItem(itemId, activeCharName, currentUserId);
  };

  const handleDistribute = async (itemId: string) => {
    const target = selectedTargets[itemId] || playerMembers[0]?.characterName || activeCharName;
    const targetMember = playerMembers.find((m) => m.characterName === target);
    await distributeItem(itemId, target, targetMember?.userId);
  };

  const handleSplitMoney = async () => {
    const names = playerMembers.map((m) => m.characterName || m.displayName || 'Jogador');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-6"
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
                    {activeLootSession.title || 'Baú de Loot da Party'}
                  </h2>
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
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeLootSession.description || 'Recompensas enviadas para o grupo de aventureiros'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPartyLootModalOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Banner do Líder (caso esteja em modo Líder) */}
          {activeLootSession.distributionMode === 'leader_assigned' && (
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

          {/* Moedas */}
          {totalCurrencySum > 0 && (
            <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Coins className="w-4 h-4" />
                  <span>Moedas Disponíveis no Cofre</span>
                </div>
                <button
                  onClick={handleSplitMoney}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Dividir Dinheiro Igualmente ({playerMembers.length || 1} Players)
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

          {/* Lista de Itens do Baú */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Itens no Baú</span>
              <span className="text-slate-400 text-[11px]">
                {claimedItemsCount} de {totalItemsCount} resgatados
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {activeLootSession.items.length === 0 ? (
                <p className="text-xs text-center py-6 text-slate-500 italic">
                  Nenhum item restando neste baú.
                </p>
              ) : (
                activeLootSession.items.map((item) => {
                  const isClaimed = item.claimedBy !== null;
                  const rarityClass = rarityColors[item.rarity || 'Comum'];

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition ${
                        isClaimed
                          ? 'bg-slate-900/60 border-slate-800 opacity-75'
                          : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                      }`}
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

                      {/* Ação ou Badge de quem pegou */}
                      <div>
                        {isClaimed ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Pego por: {item.claimedBy?.characterName}</span>
                          </div>
                        ) : activeLootSession.distributionMode === 'free_for_all' ? (
                          <button
                            onClick={() => handleClaim(item.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-sm"
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
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                            >
                              {playerMembers.map((m) => (
                                <option key={m.id} value={m.characterName}>
                                  {m.characterName || m.displayName}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleDistribute(item.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded text-xs transition"
                            >
                              <Send className="w-3 h-3" />
                              Entregar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 italic">
                            <Lock className="w-3 h-3" />
                            Aguardando Líder
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Encerramento manual se necessário */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <span className="text-[11px] text-slate-500">
              O modal fechará automaticamente quando todos os itens forem distribuídos.
            </span>
            <button
              onClick={closeLootSession}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs transition"
            >
              Fechar Modal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
