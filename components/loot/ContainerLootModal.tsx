'use client';

import React, { useState } from 'react';
import {
  Package,
  Coins,
  Sparkles,
  Users,
  User,
  Check,
  X,
  ArrowRight,
  Shield,
  Gem,
  Award,
  Lock,
  Unlock,
} from 'lucide-react';
import { Combatant, CharacterCurrency, CharacterEquipmentItem, ReadableContent } from '@/lib/types';
import { ChestConfig, ChestLoot } from '@/components/MapMaker';
import { usePartyLoot } from '@/context/PartyLootContext';
import { isItemReadable, getOrCreateReadableContent } from '@/lib/utils/readableLoreUtils';
import { normalizeChestItem, getItemTypeBadgeInfo } from '@/lib/utils/lootItemUtils';
import { BG3ReadableModal } from '@/components/loot/BG3ReadableModal';
import { toast } from 'sonner';

interface ContainerLootModalProps {
  isOpen: boolean;
  onClose: () => void;
  containerName: string;
  containerType?: string;
  loot: ChestLoot;
  combatants: Combatant[];
  onUpdateLoot: (updatedLoot: ChestLoot, isFullyLooted: boolean) => void;
}

export const ContainerLootModal: React.FC<ContainerLootModalProps> = ({
  isOpen,
  onClose,
  containerName,
  containerType = 'wooden_chest',
  loot: initialLoot,
  combatants,
  onUpdateLoot,
}) => {
  const { createLootSession } = usePartyLoot();
  const [readingItem, setReadingItem] = useState<{ title: string; readableContent: ReadableContent } | null>(null);

  const [currentLoot, setCurrentLoot] = useState<ChestLoot>({
    gp: initialLoot.gp || 0,
    sp: initialLoot.sp || 0,
    cp: initialLoot.cp || 0,
    pp: initialLoot.pp || 0,
    items: [...(initialLoot.items || [])],
    notes: initialLoot.notes,
  });

  // Filter player characters from combatants
  const playerCharacters = combatants.filter((c) => c.type === 'player');
  const [selectedCharacterName, setSelectedCharacterName] = useState<string>(
    playerCharacters[0]?.name || combatants[0]?.name || 'Personagem'
  );

  if (!isOpen) return null;

  const hasAnyLootLeft =
    (currentLoot.gp || 0) > 0 ||
    (currentLoot.sp || 0) > 0 ||
    (currentLoot.cp || 0) > 0 ||
    (currentLoot.pp || 0) > 0 ||
    (currentLoot.items && currentLoot.items.length > 0);

  // 1. Claim a specific item for the selected character
  const handleClaimItemForCharacter = (itemIndex: number) => {
    const itemToClaim = currentLoot.items?.[itemIndex];
    if (!itemToClaim) return;

    const remainingItems = currentLoot.items!.filter((_, idx) => idx !== itemIndex);
    const updated = { ...currentLoot, items: remainingItems };
    setCurrentLoot(updated);

    const isDone =
      (updated.gp || 0) === 0 &&
      (updated.sp || 0) === 0 &&
      (updated.cp || 0) === 0 &&
      (updated.pp || 0) === 0 &&
      remainingItems.length === 0;

    onUpdateLoot(updated, isDone);

    // Converte e preserva todas as propriedades do Compêndio
    const fullItem = normalizeChestItem(itemToClaim, currentLoot.notes);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('masters_codex_loot_received', {
          detail: { characterName: selectedCharacterName, item: fullItem },
        })
      );
    }

    toast.success(`"${fullItem.name}" foi coletado por ${selectedCharacterName}!`);
  };

  // 2. Send a specific item to the Party Loot Box
  const handleSendItemToPartyLoot = async (itemIndex: number) => {
    const itemToSend = currentLoot.items?.[itemIndex];
    if (!itemToSend) return;

    const remainingItems = currentLoot.items!.filter((_, idx) => idx !== itemIndex);
    const updated = { ...currentLoot, items: remainingItems };
    setCurrentLoot(updated);

    const isDone =
      (updated.gp || 0) === 0 &&
      (updated.sp || 0) === 0 &&
      (updated.cp || 0) === 0 &&
      (updated.pp || 0) === 0 &&
      remainingItems.length === 0;

    onUpdateLoot(updated, isDone);

    const normalized = normalizeChestItem(itemToSend, currentLoot.notes);
    await createLootSession({
      title: `Saque de ${containerName}`,
      description: `Item transferido do recipiente no mapa.`,
      distributionMode: 'free_for_all',
      currency: { po: 0, pp: 0, pe: 0, pc: 0, pl: 0 },
      items: [normalized],
    });

    toast.success(`"${normalized.name}" foi enviado para o Baú da Party!`);
  };

  // 3. Claim coins for selected character
  const handleClaimCoinsForCharacter = () => {
    const { gp = 0, sp = 0, cp = 0, pp = 0 } = currentLoot;
    if (gp === 0 && sp === 0 && cp === 0 && pp === 0) return;

    const updated = { ...currentLoot, gp: 0, sp: 0, cp: 0, pp: 0 };
    setCurrentLoot(updated);

    const isDone = (updated.items || []).length === 0;
    onUpdateLoot(updated, isDone);

    toast.success(
      `💰 Moedas (${gp} PO, ${sp} PP, ${cp} PC, ${pp} PL) coletadas por ${selectedCharacterName}!`
    );
  };

  // 4. Send all coins to Party Loot Box
  const handleSendCoinsToPartyLoot = async () => {
    const { gp = 0, sp = 0, cp = 0, pp = 0 } = currentLoot;
    if (gp === 0 && sp === 0 && cp === 0 && pp === 0) return;

    const updated = { ...currentLoot, gp: 0, sp: 0, cp: 0, pp: 0 };
    setCurrentLoot(updated);

    const isDone = (updated.items || []).length === 0;
    onUpdateLoot(updated, isDone);

    await createLootSession({
      title: `Tesouro em Moedas (${containerName})`,
      description: `Moedas encontradas no recipiente.`,
      distributionMode: 'free_for_all',
      currency: { po: gp, pp: sp, pe: 0, pc: cp, pl: pp },
      items: [],
    });

    toast.success(`💰 Moedas enviadas para o Baú do Grupo!`);
  };

  // 5. Send ALL remaining loot to Party Loot Box at once
  const handleSendAllToPartyLoot = async () => {
    const { gp = 0, sp = 0, cp = 0, pp = 0, items = [] } = currentLoot;

    const partyItems = items.map((item) => normalizeChestItem(item, currentLoot.notes));

    await createLootSession({
      title: `Saque Completo de ${containerName}`,
      description: `Todo o conteúdo foi enviado para distribuição do grupo.`,
      distributionMode: 'free_for_all',
      currency: { po: gp, pp: sp, pe: 0, pc: cp, pl: pp },
      items: partyItems,
    });

    const emptyLoot = { gp: 0, sp: 0, cp: 0, pp: 0, items: [] };
    setCurrentLoot(emptyLoot);
    onUpdateLoot(emptyLoot, true);

    toast.success(`✨ Todo o saque foi enviado com sucesso para o Baú da Party!`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
        <div className="relative w-full max-w-lg bg-slate-950 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {containerType === 'hidden_stash' || containerType === 'stash' ? '💎' : '🧰'}
              </div>
              <div>
                <h2 className="text-base font-black text-amber-300 flex items-center gap-2">
                  {containerName}
                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {containerType === 'hidden_stash' ? 'Esconderijo' : 'Baú de Tesouro'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Colete os itens para seu personagem ou envie para o Baú da Party.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 overflow-y-auto text-xs">
            {/* Character Selector */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Personagem que está Coletando:
              </label>
              <select
                value={selectedCharacterName}
                onChange={(e) => setSelectedCharacterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-bold outline-none focus:border-amber-500"
              >
                {playerCharacters.length > 0 ? (
                  playerCharacters.map((c) => (
                    <option key={c.id} value={c.name}>
                      👤 {c.name} (Jogador)
                    </option>
                  ))
                ) : (
                  combatants.map((c) => (
                    <option key={c.id} value={c.name}>
                      👤 {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {hasAnyLootLeft ? (
              <>
                {/* Coins Section */}
                {((currentLoot.gp || 0) > 0 ||
                  (currentLoot.sp || 0) > 0 ||
                  (currentLoot.cp || 0) > 0 ||
                  (currentLoot.pp || 0) > 0) && (
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Coins className="w-4 h-4" /> Moedas Encontradas
                      </span>
                      <div className="flex items-center gap-2 text-xs font-mono font-black text-slate-200">
                        {currentLoot.gp ? <span className="text-amber-400">{currentLoot.gp} PO</span> : null}
                        {currentLoot.sp ? <span className="text-slate-300">{currentLoot.sp} PP</span> : null}
                        {currentLoot.cp ? <span className="text-amber-600">{currentLoot.cp} PC</span> : null}
                        {currentLoot.pp ? <span className="text-cyan-400">{currentLoot.pp} PL</span> : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleClaimCoinsForCharacter}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Pegar Moedas para {selectedCharacterName}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSendCoinsToPartyLoot}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                        title="Enviar somente as moedas para o Baú da Party"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Enviar Moedas para o Baú da Party</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Items List */}
                {currentLoot.items && currentLoot.items.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-cyan-400" /> Itens e Tesouros do Compêndio:
                    </span>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {currentLoot.items.map((rawItem, idx) => {
                        const item = normalizeChestItem(rawItem, currentLoot.notes);
                        const badge = getItemTypeBadgeInfo(item);
                        const readable = item.itemType === 'readable';

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-center gap-2 max-w-[200px] truncate">
                              <span className="font-semibold text-slate-100 text-xs truncate">
                                {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${badge.badgeClass}`}>
                                <span>{badge.icon}</span>
                                <span>{badge.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {readable && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const lore = item.readableContent || getOrCreateReadableContent({ name: item.name, notes: currentLoot.notes });
                                    setReadingItem({ title: item.name, readableContent: lore });
                                  }}
                                  className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/50 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Ler Conteúdo (BG3 Style)"
                                >
                                  📖 Ler
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleClaimItemForCharacter(idx)}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title={`Coletar para ${selectedCharacterName}`}
                              >
                                Pegar para Mim
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendItemToPartyLoot(idx)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                title="Enviar para Baú da Party"
                              >
                                Baú da Party
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center space-y-2 text-slate-400">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto animate-pulse" />
                <p className="font-bold text-slate-200 text-sm">Este recipiente foi totalmente saqueado!</p>
                <p className="text-xs">Todos os tesouros e moedas foram distribuídos com sucesso.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/80 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {hasAnyLootLeft && (
              <button
                onClick={handleSendAllToPartyLoot}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Pegar Tudo para o Baú do Grupo (Moedas & Itens)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BG3 Readable Modal Preview */}
      {readingItem && (
        <BG3ReadableModal
          isOpen={Boolean(readingItem)}
          onClose={() => setReadingItem(null)}
          title={readingItem.title}
          readableContent={readingItem.readableContent}
        />
      )}
    </>
  );
};

