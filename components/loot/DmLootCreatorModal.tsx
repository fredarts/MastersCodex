'use client';

import React, { useState } from 'react';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useCampaign } from '@/context/CampaignContext';
import { LootDistributionMode, PartyLootItem, CharacterCurrency, CharacterEquipmentItem } from '@/lib/types';
import {
  Coins,
  Crown,
  Gift,
  Plus,
  Trash2,
  X,
  Sparkles,
  Users,
  ShieldCheck,
  Package,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ItemCompendiumModal } from '@/components/character-sheet/Modals/ItemCompendiumModal';

export const DmLootCreatorModal: React.FC = () => {
  const { isDmLootModalOpen, setIsDmLootModalOpen, createLootSession, sendDirectTransfer } = usePartyLoot();
  const { campaignMembers, activeCampaign } = useCampaign();

  const playerMembers = campaignMembers.filter((m) => m.role === 'player');

  const [title, setTitle] = useState('Tesouro da Aventura');
  const [description, setDescription] = useState('');
  const [distributionMode, setDistributionMode] = useState<LootDistributionMode>('free_for_all');
  const [leaderId, setLeaderId] = useState<string>(playerMembers[0]?.userId || '');
  const [recipientMode, setRecipientMode] = useState<'party' | 'specific'>('party');
  const [specificRecipientId, setSpecificRecipientId] = useState<string>('');

  // Moedas
  const [currency, setCurrency] = useState<CharacterCurrency>({
    po: 0,
    pl: 0,
    pp: 0,
    pc: 0,
    pe: 0,
  });

  // Lista de Itens
  const [items, setItems] = useState<Omit<PartyLootItem, 'claimedBy'>[]>([]);

  // Form de novo item
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemRarity, setNewItemRarity] = useState<PartyLootItem['rarity']>('Comum');
  const [newItemNotes, setNewItemNotes] = useState('');

  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);


  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: Omit<PartyLootItem, 'claimedBy'> = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newItemName.trim(),
      quantity: newItemQty > 0 ? newItemQty : 1,
      rarity: newItemRarity,
      notes: newItemNotes.trim(),
    };

    setItems([...items, item]);
    setNewItemName('');
    setNewItemQty(1);
    setNewItemNotes('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleAddItemFromCompendium = (equipItem: CharacterEquipmentItem) => {
    const item: Omit<PartyLootItem, 'claimedBy'> = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: equipItem.name,
      quantity: equipItem.quantity > 0 ? equipItem.quantity : 1,
      weight: equipItem.weight,
      rarity: 'Comum',
      notes: equipItem.notes || '',
      itemType: equipItem.itemType,
      potionProps: equipItem.potionProps,
      weaponProps: equipItem.weaponProps,
      armorProps: equipItem.armorProps,
      scrollProps: equipItem.scrollProps,
    };
    setItems((prev) => [...prev, item]);
    toast.success(`"${item.name}" adicionado ao baú!`);
  };

  const handleSubmit = async () => {
    if (recipientMode === 'specific' && specificRecipientId) {
      const partyMembers = activeCampaign?.partyMembers || [];
      const target = partyMembers.find((m) => m.id === specificRecipientId);
      if (!target) {
        toast.error('Membro da party não encontrado.');
        return;
      }

      // Send currency via direct transfer
      const hasCurrency = (currency.po || 0) + (currency.pl || 0) + (currency.pp || 0) + (currency.pc || 0) + (currency.pe || 0) > 0;
      if (hasCurrency) {
        await sendDirectTransfer({
          campaignId: activeCampaign?.id || '',
          fromCharacterName: 'Mestre',
          toCharacterName: target.name,
          toUserId: target.userId,
          currency,
        });
      }

      // Send each item via direct transfer
      for (const item of items) {
        await sendDirectTransfer({
          campaignId: activeCampaign?.id || '',
          fromCharacterName: 'Mestre',
          toCharacterName: target.name,
          toUserId: target.userId,
          item: { 
            id: item.id, 
            name: item.name, 
            quantity: item.quantity, 
            weight: item.weight,
            notes: item.notes,
            itemType: item.itemType,
            potionProps: item.potionProps,
            weaponProps: item.weaponProps,
            armorProps: item.armorProps,
            scrollProps: item.scrollProps,
            rarity: item.rarity,
          },
        });
      }

      setIsDmLootModalOpen(false);
      return;
    }

    const leaderMember = playerMembers.find((m) => m.userId === leaderId || m.id === leaderId);
    await createLootSession({
      title,
      description,
      distributionMode,
      leaderId: leaderMember?.userId || leaderId,
      leaderCharacterName: leaderMember?.characterName || 'Líder',
      currency,
      items,
    });
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
    <>
      <AnimatePresence>
        {isDmLootModalOpen && (
          <div key="dm-loot-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide text-amber-200">
                  Criar Recompensa & Loot da Party
                </h2>
                <p className="text-xs text-slate-400">
                  Defina o conteúdo do baú e envie em tempo real para os jogadores
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDmLootModalOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Destinatário */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <Users className="w-4 h-4" />
              <span>Destinatário do Loot</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecipientMode('party')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                  recipientMode === 'party'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Party Inteira
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('specific')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                  recipientMode === 'specific'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Membro Específico
              </button>
            </div>

            {recipientMode === 'specific' && (
              <div className="mt-2">
                <select
                  value={specificRecipientId}
                  onChange={(e) => setSpecificRecipientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione um membro da party...</option>
                  {(activeCampaign?.partyMembers || []).map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name} ({pm.type === 'player' ? 'Jogador' : 'NPC'})
                    </option>
                  ))}
                </select>
                {(activeCampaign?.partyMembers || []).length === 0 && (
                  <p className="text-[10px] text-amber-400 mt-1">
                    ⚠️ Nenhum membro na party. Defina a party na aba &quot;Party&quot; das configurações da campanha.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título do Baú de Loot
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Recompensa da Masmorra"
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {recipientMode === 'party' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modo de Distribuição
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDistributionMode('free_for_all')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                      distributionMode === 'free_for_all'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Livre (Todos Pegam)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDistributionMode('leader_assigned')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                      distributionMode === 'leader_assigned'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    Líder da Party
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Seleção do Líder (se modo líder ativado) */}
          {recipientMode === 'party' && distributionMode === 'leader_assigned' && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Escolha o Líder responsável por dividir os itens:</span>
              </div>
              <select
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-200 focus:outline-none focus:border-amber-500"
              >
                {playerMembers.length === 0 ? (
                  <option value="">Nenhum jogador na campanha</option>
                ) : (
                  playerMembers.map((m) => (
                    <option key={m.id} value={m.userId || m.id}>
                      {m.characterName || m.displayName || 'Jogador'}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          {/* Moedas */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Coins className="w-4 h-4" />
              <span>Moedas / Tesouro em Dinheiro</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div>
                <label className="block text-[10px] text-amber-300 font-semibold mb-1">PO (Ouro)</label>
                <input
                  type="number"
                  min="0"
                  value={currency.po}
                  onChange={(e) => setCurrency({ ...currency, po: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-300 font-semibold mb-1">PL (Platina)</label>
                <input
                  type="number"
                  min="0"
                  value={currency.pl}
                  onChange={(e) => setCurrency({ ...currency, pl: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">PP (Prata)</label>
                <input
                  type="number"
                  min="0"
                  value={currency.pp}
                  onChange={(e) => setCurrency({ ...currency, pp: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-orange-400 font-semibold mb-1">PC (Cobre)</label>
                <input
                  type="number"
                  min="0"
                  value={currency.pc}
                  onChange={(e) => setCurrency({ ...currency, pc: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-cyan-300 font-semibold mb-1">PE (Electrum)</label>
                <input
                  type="number"
                  min="0"
                  value={currency.pe}
                  onChange={(e) => setCurrency({ ...currency, pe: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Adicionar Itens ao Baú */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Itens no Baú ({items.length})</span>
              </div>
            </div>

            {/* Form de Adição */}
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <input
                type="text"
                placeholder="Nome do Item (Ex: Espada Longa +1)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="md:col-span-5 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                min="1"
                placeholder="Qtd"
                value={newItemQty}
                onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                className="md:col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center focus:outline-none focus:border-amber-500"
              />
              <select
                value={newItemRarity}
                onChange={(e) => setNewItemRarity(e.target.value as any)}
                className="md:col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="Comum">Comum</option>
                <option value="Incomum">Incomum</option>
                <option value="Raro">Raro</option>
                <option value="Muito Raro">Muito Raro</option>
                <option value="Lendário">Lendário</option>
                <option value="Artefato">Artefato</option>
              </select>
              <div className="md:col-span-2 flex gap-1">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold px-2 py-1.5 rounded text-xs transition"
                  title="Adicionar Item"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline">Adicionar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompendiumOpen(true)}
                  className="flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-amber-400 px-2 py-1.5 rounded transition"
                  title="Abrir Compêndio"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Lista de Itens Adicionados */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {items.length === 0 ? (
                <p className="text-xs text-center py-6 text-slate-500 italic">
                  Nenhum item adicionado ao baú ainda.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-amber-400">{item.quantity}x</span>
                      <div>
                        <span className="text-xs font-medium text-slate-200">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              rarityColors[item.rarity || 'Comum']
                            }`}
                          >
                            {item.rarity || 'Comum'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Ações */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={() => setIsDmLootModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              {recipientMode === 'specific'
                ? 'Enviar Diretamente ao Membro'
                : 'Enviar Loot para a Party em Tempo Real'}
            </button>
          </div>
        </motion.div>
      </div>
        )}
      </AnimatePresence>

      <ItemCompendiumModal
        isOpen={isCompendiumOpen}
        onClose={() => setIsCompendiumOpen(false)}
        onAddItem={handleAddItemFromCompendium}
      />
    </>
  );
};
