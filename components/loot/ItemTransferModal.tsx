'use client';

import React, { useState } from 'react';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useCampaign } from '@/context/CampaignContext';
import { Send, ArrowRightLeft, X, Package, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ItemTransferModal: React.FC<{ currentCharacterName?: string }> = ({
  currentCharacterName,
}) => {
  const { isTransferModalOpen, setIsTransferModalOpen, transferTargetItem, sendDirectTransfer } =
    usePartyLoot();
  const { campaignMembers } = useCampaign();

  const otherPlayers = campaignMembers.filter(
    (m) => m.role === 'player' && m.characterName !== currentCharacterName
  );

  const [targetCharacterName, setTargetCharacterName] = useState<string>(
    otherPlayers[0]?.characterName || ''
  );
  const [transferQty, setTransferQty] = useState<number>(1);

  if (!isTransferModalOpen || !transferTargetItem) return null;

  const handleSend = async () => {
    if (!targetCharacterName) return;

    await sendDirectTransfer({
      campaignId: '',
      fromCharacterName: currentCharacterName || 'Jogador',
      toCharacterName: targetCharacterName,
      item: {
        ...transferTargetItem,
        quantity: transferQty > 0 ? transferQty : 1,
      },
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-5"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-300">
              <ArrowRightLeft className="w-5 h-5" />
              <h3 className="text-base font-bold">Transferir Item para Parceiro</h3>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Item selecionado */}
          <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100">{transferTargetItem.name}</span>
              <p className="text-[10px] text-slate-400">
                Quantidade disponível na ficha: {transferTargetItem.quantity}
              </p>
            </div>
          </div>

          {/* Form de envio */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destinatário da Party
              </label>
              <select
                value={targetCharacterName}
                onChange={(e) => setTargetCharacterName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-200 focus:outline-none focus:border-amber-500"
              >
                {otherPlayers.length === 0 ? (
                  <option value="">Nenhum outro jogador presente</option>
                ) : (
                  otherPlayers.map((m) => (
                    <option key={m.id} value={m.characterName}>
                      {m.characterName || m.displayName}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantidade a Transferir
              </label>
              <input
                type="number"
                min="1"
                max={transferTargetItem.quantity}
                value={transferQty}
                onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              onClick={() => setIsTransferModalOpen(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Confirmar Transferência
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
