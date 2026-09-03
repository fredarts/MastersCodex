'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Package, 
  ArrowRight, 
  Swords, 
  Shield, 
  FlaskConical, 
  Scroll, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CharacterSheet, CharacterEquipmentItem } from '@/lib/types';
import { 
  extractTransferableItems, 
  TransferItemPayload 
} from '@/lib/services/itemTransferService';
import { ContextMenuMember } from './MemberContextMenu';

interface ItemTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderSheet: CharacterSheet;
  receiverMember: ContextMenuMember;
  onConfirmTransfer: (itemsToTransfer: TransferItemPayload[]) => Promise<void> | void;
}

export const ItemTransferModal: React.FC<ItemTransferModalProps> = ({
  isOpen,
  onClose,
  senderSheet,
  receiverMember,
  onConfirmTransfer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'weapon' | 'armor' | 'potion' | 'other'>('all');
  const [basket, setBasket] = useState<Map<string, { item: CharacterEquipmentItem; quantityToSend: number }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extrair todos os itens transferíveis da ficha
  const transferableItems = useMemo(() => {
    return extractTransferableItems(senderSheet);
  }, [senderSheet]);

  // Filtragem de itens do inventário
  const filteredInventory = useMemo(() => {
    return transferableItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'weapon') return item.itemType === 'weapon' || Boolean(item.weaponProps);
      if (selectedCategory === 'armor') return item.itemType === 'armor' || Boolean(item.armorProps);
      if (selectedCategory === 'potion') return item.itemType === 'potion' || Boolean(item.potionProps);
      if (selectedCategory === 'other') return item.itemType !== 'weapon' && item.itemType !== 'armor' && item.itemType !== 'potion' && !item.weaponProps && !item.potionProps && !item.armorProps;
      return true;
    });
  }, [transferableItems, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Adicionar item à cesta
  const handleAddToBasket = (item: CharacterEquipmentItem) => {
    const existing = basket.get(item.id);
    const maxQty = item.quantity || 1;

    if (existing) {
      if (existing.quantityToSend < maxQty) {
        setBasket(new Map(basket.set(item.id, { item, quantityToSend: existing.quantityToSend + 1 })));
      }
    } else {
      setBasket(new Map(basket.set(item.id, { item, quantityToSend: 1 })));
    }
  };

  // Alterar quantidade na cesta
  const handleUpdateBasketQty = (itemId: string, newQty: number, maxQty: number) => {
    if (newQty <= 0) {
      const newMap = new Map(basket);
      newMap.delete(itemId);
      setBasket(newMap);
    } else {
      const current = basket.get(itemId);
      if (current) {
        const clampedQty = Math.min(newQty, maxQty);
        setBasket(new Map(basket.set(itemId, { ...current, quantityToSend: clampedQty })));
      }
    }
  };

  // Remover item da cesta
  const handleRemoveFromBasket = (itemId: string) => {
    const newMap = new Map(basket);
    newMap.delete(itemId);
    setBasket(newMap);
  };

  // Confirmar envio
  const handleConfirm = async () => {
    if (basket.size === 0) return;
    setIsSubmitting(true);
    try {
      const payloadList: TransferItemPayload[] = Array.from(basket.values());
      await onConfirmTransfer(payloadList);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const basketItems = Array.from(basket.values());
  const totalItemsCount = basketItems.reduce((acc, curr) => acc + curr.quantityToSend, 0);

  // Helper de ícone por tipo de item
  const getItemIcon = (item: CharacterEquipmentItem) => {
    if (item.itemType === 'potion' || item.potionProps) {
      return <FlaskConical className="w-4 h-4 text-emerald-400" />;
    }
    if (item.itemType === 'weapon' || item.weaponProps) {
      return <Swords className="w-4 h-4 text-amber-400" />;
    }
    if (item.itemType === 'armor' || item.armorProps) {
      return <Shield className="w-4 h-4 text-cyan-400" />;
    }
    if (item.readableContent) {
      return <Scroll className="w-4 h-4 text-amber-300" />;
    }
    return <Package className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-[#0c1018] border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#141b29] via-[#101724] to-[#0d131f] border-b border-[#232d40] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black font-serif text-slate-100 flex items-center gap-2">
                <span>Transferência de Itens</span>
                <span className="text-xs font-mono font-normal text-amber-400/80 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  D&D 5e Trade
                </span>
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-200">{senderSheet.characterName || 'Você'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-amber-300">{receiverMember.characterName || 'Destinatário'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1a2334] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Dual Column Vault */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-1 overflow-hidden min-h-[380px]">
          
          {/* LEFT COLUMN: Seu Inventário */}
          <div className="flex flex-col bg-[#090d14] rounded-xl border border-[#232d40] p-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#232d40] mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" /> Seu Inventário ({transferableItems.length})
              </span>
            </div>

            {/* Search & Category Filter */}
            <div className="space-y-2 mb-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar arma, poção, armadura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121826] border border-[#232d40] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px] font-mono">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'weapon', label: 'Armas' },
                  { id: 'armor', label: 'Armaduras' },
                  { id: 'potion', label: 'Poções' },
                  { id: 'other', label: 'Geral' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2 py-1 rounded-md shrink-0 transition-all font-bold ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#121826] text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Nenhum item encontrado no inventário.
                </div>
              ) : (
                filteredInventory.map((item, idx) => {
                  const inBasket = basket.get(item.id);
                  const maxQty = item.quantity || 1;
                  const remainingQty = maxQty - (inBasket?.quantityToSend || 0);

                  return (
                    <div
                      key={`inv_${item.id}_${idx}`}
                      className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 group ${
                        remainingQty <= 0
                          ? 'bg-[#0f141e]/50 border-slate-800 opacity-50'
                          : 'bg-[#111723] hover:bg-[#151d2c] border-[#232d40] hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-[#0a0d14] border border-[#232d40] flex items-center justify-center shrink-0">
                          {getItemIcon(item)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-300 transition-colors">
                              {item.name}
                            </h5>
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 rounded">
                              x{remainingQty}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                            {item.weaponProps && (
                              <span className="text-amber-400">Dano: {item.weaponProps.damage}</span>
                            )}
                            {item.potionProps && (
                              <span className="text-emerald-400">Cura: {item.potionProps.healingDice || 'Efeito'}</span>
                            )}
                            {item.armorProps && (
                              <span className="text-cyan-400">CA: +{item.armorProps.acBonus}</span>
                            )}
                            {item.weight && <span>{item.weight}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToBasket(item)}
                        disabled={remainingQty <= 0}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Adicionar à cesta de envio"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Cesta de Envio */}
          <div className="flex flex-col bg-[#090d14] rounded-xl border border-amber-500/30 p-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#232d40] mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Cesta para {receiverMember.characterName || 'Membro'} ({totalItemsCount})
              </span>
              {basketItems.length > 0 && (
                <button
                  onClick={() => setBasket(new Map())}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Basket Items List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {basketItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 border border-dashed border-[#232d40] rounded-xl">
                  <Package className="w-8 h-8 text-slate-600 mb-2 stroke-1" />
                  <p className="text-xs font-medium text-slate-400">Cesta de envio vazia</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                    Clique em (+) nos itens do seu inventário à esquerda para adicioná-los.
                  </p>
                </div>
              ) : (
                basketItems.map(({ item, quantityToSend }, idx) => {
                  const maxQty = item.quantity || 1;

                  return (
                    <div
                      key={`basket_${item.id}_${idx}`}
                      className="p-2.5 rounded-xl bg-[#131b29] border border-amber-500/30 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-[#0a0d14] border border-amber-500/40 flex items-center justify-center shrink-0">
                          {getItemIcon(item)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-amber-200 truncate font-serif">
                            {item.name}
                          </h5>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            Disponível na ficha: {maxQty}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-[#090d14] rounded-lg border border-[#232d40] p-0.5">
                          <button
                            onClick={() => handleUpdateBasketQty(item.id, quantityToSend - 1, maxQty)}
                            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#1a2334] transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-amber-300 min-w-[20px] text-center">
                            {quantityToSend}
                          </span>
                          <button
                            onClick={() => handleUpdateBasketQty(item.id, quantityToSend + 1, maxQty)}
                            disabled={quantityToSend >= maxQty}
                            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-[#1a2334] disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveFromBasket(item.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Remover da cesta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom summary info */}
            {basketItems.length > 0 && (
              <div className="mt-2.5 p-2 bg-[#101622] rounded-lg border border-[#232d40] text-[10px] text-slate-300 font-mono flex items-center justify-between">
                <span>Total de Itens: <strong className="text-amber-300">{totalItemsCount}</strong></span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pronto para enviar
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0a0d14] border-t border-[#232d40] flex items-center justify-between">
          <p className="text-[11px] text-slate-400 hidden sm:block">
            * Os itens serão removidos da sua ficha e transferidos com todos os seus atributos para {receiverMember.characterName}.
          </p>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-[#161f2e] rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={basketItems.length === 0 || isSubmitting}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transferindo...' : `Confirmar Envio (${totalItemsCount})`}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
