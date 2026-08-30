'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MerchantShop, 
  MerchantStockItem, 
  BarterItemSlot, 
  ItemCategory 
} from '@/lib/merchant/merchantTypes';
import { merchantService } from '@/lib/merchant/merchantService';
import { ALL_SRD_ITEMS } from '@/lib/srd-items-data';
import { parseGoldValue } from '@/lib/merchant/merchantPresets';
import { getEffectiveAttributeScore, calculateModifier, calculateProficiencyBonus } from '@/lib/dnd5e-calculator';
import { CharacterSheet, CharacterEquipmentItem, WorldEntity } from '@/lib/types';
import { useWorld } from '@/lib/hooks/useWorld';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';

function getPlayerItemBasePrice(item: CharacterEquipmentItem): number {
  const match = ALL_SRD_ITEMS.find(s => s.name.toLowerCase() === item.name.toLowerCase());
  if (match) {
    return parseGoldValue(match.value);
  }
  if (item.notes) {
    const goldMatch = item.notes.match(/(\d+(?:\.\d+)?)\s*(?:po|gp|ouro)/i);
    if (goldMatch) return parseFloat(goldMatch[1]);
  }
  return 10;
}
import { 
  Coins, 
  Scale, 
  Sparkles, 
  Dices, 
  Search, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Flame, 
  Heart, 
  Package, 
  RefreshCw,
  Plus,
  Minus,
  Check,
  MapPin,
  Store
} from 'lucide-react';
import { toast } from 'sonner';

interface BG3MerchantModalProps {
  shop: MerchantShop | null;
  characterSheet: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCharacterSheet: (updatedSheet: CharacterSheet) => void;
  onUpdateShop?: (updatedShop: MerchantShop) => void;
  availableShops?: MerchantShop[];
  onSelectShop?: (shop: MerchantShop) => void;
}

export const BG3MerchantModal: React.FC<BG3MerchantModalProps> = ({
  shop: initialShop,
  characterSheet,
  isOpen,
  onClose,
  onUpdateCharacterSheet,
  onUpdateShop,
  availableShops,
  onSelectShop,
}) => {
  const [shop, setShop] = useState<MerchantShop | null>(initialShop);
  const [mode, setMode] = useState<'trade' | 'barter'>('barter');
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Barter Table Slots
  const [merchantOffer, setMerchantOffer] = useState<BarterItemSlot[]>([]);
  const [playerOffer, setPlayerOffer] = useState<BarterItemSlot[]>([]);

  // Persuasion Bargain Roll State
  const [isBargaining, setIsBargaining] = useState(false);
  const [bargainRolled, setBargainRolled] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [internalAvailableShops, setInternalAvailableShops] = useState<MerchantShop[]>([]);

  const { worldEntities } = useWorld();

  const allAvailableEntities: WorldEntity[] = React.useMemo(() => {
    const list: WorldEntity[] = [...worldEntities];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('codex_entities');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((e: WorldEntity) => {
              const existingIdx = list.findIndex((existing) => existing.id === e.id);
              if (existingIdx !== -1) {
                // Prioritiza a entidade com mais imagens/recente
                if ((e.images?.length || 0) > (list[existingIdx].images?.length || 0) || e.attributes?.portraitUrl) {
                  list[existingIdx] = e;
                }
              } else {
                list.push(e);
              }
            });
          }
        }
      } catch {}
    }
    return list;
  }, [worldEntities, isOpen, shop]);

  const linkedNpc = shop ? (
    (shop.npcEntityId ? allAvailableEntities.find(n => n.id === shop.npcEntityId) : null) ||
    allAvailableEntities.find(n => n.category === 'npc' && (
      n.name.toLowerCase().trim() === (shop.merchantName || '').toLowerCase().trim() ||
      (shop.merchantName || '').toLowerCase().includes(n.name.toLowerCase().trim()) ||
      n.name.toLowerCase().includes((shop.merchantName || '').toLowerCase().trim())
    ))
  ) : null;

  const resolvedAvatar = (linkedNpc ? getEntityPortraitUrl(linkedNpc) : undefined) || shop?.merchantAvatarUrl;

  const getShopScore = (s: MerchantShop): number => {
    let score = 0;
    if (s.npcEntityId) score += 500;
    if (s.locationEntityId || s.locationName) score += 500;
    if (s.merchantAvatarUrl) score += 300;
    if (s.stock && s.stock.length > 2) score += s.stock.length * 10;
    if (s.name !== 'Forja & Armaria do Martelo Rubro') score += 200;
    return score;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial shop
  useEffect(() => {
    if (initialShop) {
      setShop(initialShop);
    }
  }, [initialShop]);

  useEffect(() => {
    if (isOpen) {
      merchantService.fetchShops(initialShop?.campaignId).then((loaded) => {
        if (loaded.length > 0) {
          setInternalAvailableShops(loaded);
          const matchCurrent = initialShop?.id ? loaded.find(s => s.id === initialShop.id) : null;
          setShop(matchCurrent || loaded[0]);
        }
      });
    }
  }, [isOpen, initialShop?.id]);

  const allShopsList = (internalAvailableShops.length > 0) ? internalAvailableShops : (availableShops || []);

  if (!isOpen || !shop || !mounted) return null;

  const attitudeInfo = merchantService.calculateAttitudeCurve(shop.attitude);
  const playerTotalGold = merchantService.getTotalGoldValue(characterSheet.currency || { po: 0, pl: 0, pe: 0, pp: 0, pc: 0 });

  // Categorias de filtro
  const CATEGORIES: { id: ItemCategory; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'weapon', label: 'Armas' },
    { id: 'armor', label: 'Armaduras' },
    { id: 'potion', label: 'Poções' },
    { id: 'scroll', label: 'Pergaminhos' },
    { id: 'magic_item', label: 'Mágicos' },
    { id: 'adventuring_gear', label: 'Equipamento' },
  ];

  // Filtragem do estoque do mercador
  const filteredStock = (shop.stock || []).filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Inventário do jogador
  const playerInventory: CharacterEquipmentItem[] = characterSheet.equipment || [];

  // 1. Ações no Modo Trade (Direto)
  const handleQuickBuy = (stockItem: MerchantStockItem) => {
    const buyPrice = merchantService.getItemEffectivePrice(stockItem.basePriceGold, shop.attitude, true);
    
    const slot: BarterItemSlot = {
      item: stockItem,
      quantity: 1,
      unitPriceGold: buyPrice,
      totalPriceGold: buyPrice,
      source: 'merchant',
    };

    const res = merchantService.executeBarterTransaction({
      shop,
      characterId: characterSheet.id || 'char',
      characterName: characterSheet.characterName,
      characterCurrency: characterSheet.currency || { po: 0, pl: 0, pe: 0, pp: 0, pc: 0 },
      characterInventory: characterSheet.equipment || [],
      merchantSlots: [slot],
      playerSlots: [],
      goldBalanceCharacter: 0,
    });

    if (!res.success) {
      toast.error(res.error || 'Erro na compra.');
      return;
    }

    const updatedSheet: CharacterSheet = {
      ...characterSheet,
      currency: res.updatedCurrency,
      equipment: res.updatedInventory,
      transactionHistory: [res.transactionLog, ...(characterSheet.transactionHistory || [])],
    };

    setShop(res.updatedShop);
    if (onUpdateShop) onUpdateShop(res.updatedShop);
    onUpdateCharacterSheet(updatedSheet);
    toast.success(`Comprou ${stockItem.name} por ${buyPrice} PO!`);
  };

  const handleQuickSell = (equipItem: CharacterEquipmentItem) => {
    const basePrice = getPlayerItemBasePrice(equipItem);
    const sellPrice = merchantService.getItemEffectivePrice(basePrice, shop.attitude, false);

    const slot: BarterItemSlot = {
      item: equipItem,
      quantity: 1,
      unitPriceGold: sellPrice,
      totalPriceGold: sellPrice,
      source: 'player',
    };

    const res = merchantService.executeBarterTransaction({
      shop,
      characterId: characterSheet.id || 'char',
      characterName: characterSheet.characterName,
      characterCurrency: characterSheet.currency || { po: 0, pl: 0, pe: 0, pp: 0, pc: 0 },
      characterInventory: characterSheet.equipment || [],
      merchantSlots: [],
      playerSlots: [slot],
      goldBalanceCharacter: 0,
    });

    if (!res.success) {
      toast.error(res.error || 'Erro na venda.');
      return;
    }

    const updatedSheet: CharacterSheet = {
      ...characterSheet,
      currency: res.updatedCurrency,
      equipment: res.updatedInventory,
      transactionHistory: [res.transactionLog, ...(characterSheet.transactionHistory || [])],
    };

    setShop(res.updatedShop);
    if (onUpdateShop) onUpdateShop(res.updatedShop);
    onUpdateCharacterSheet(updatedSheet);
    toast.success(`Vendeu ${equipItem.name} por ${sellPrice} PO!`);
  };

  // 2. Ações no Modo Barter (Balança)
  const handleAddToBarterFromShop = (stockItem: MerchantStockItem) => {
    const unitPrice = merchantService.getItemEffectivePrice(stockItem.basePriceGold, shop.attitude, true);
    setMerchantOffer((prev) => {
      const exists = prev.find(s => s.item.id === stockItem.id);
      if (exists) {
        if (stockItem.quantity !== -1 && exists.quantity >= stockItem.quantity) {
          toast.warning(`Limite de estoque da loja atingido (${stockItem.quantity} un).`);
          return prev;
        }
        return prev.map(s => s.item.id === stockItem.id ? {
          ...s,
          quantity: s.quantity + 1,
          totalPriceGold: Number(((s.quantity + 1) * s.unitPriceGold).toFixed(1)),
        } : s);
      }
      return [...prev, {
        item: stockItem,
        quantity: 1,
        unitPriceGold: unitPrice,
        totalPriceGold: unitPrice,
        source: 'merchant',
      }];
    });
  };

  const handleAddToBarterFromPlayer = (equipItem: CharacterEquipmentItem) => {
    const basePrice = getPlayerItemBasePrice(equipItem);
    const unitPrice = merchantService.getItemEffectivePrice(basePrice, shop.attitude, false);
    setPlayerOffer((prev) => {
      const exists = prev.find(s => s.item.id === equipItem.id);
      if (exists) {
        return prev.map(s => s.item.id === equipItem.id ? {
          ...s,
          quantity: s.quantity + 1,
          totalPriceGold: Number(((s.quantity + 1) * s.unitPriceGold).toFixed(1)),
        } : s);
      }
      return [...prev, {
        item: equipItem,
        quantity: 1,
        unitPriceGold: unitPrice,
        totalPriceGold: unitPrice,
        source: 'player',
      }];
    });
  };

  const totalMerchantOfferGold = Number(merchantOffer.reduce((acc, s) => acc + s.totalPriceGold, 0).toFixed(1));
  const totalPlayerOfferGold = Number(playerOffer.reduce((acc, s) => acc + s.totalPriceGold, 0).toFixed(1));
  const goldBalanceRequired = Number((totalMerchantOfferGold - totalPlayerOfferGold).toFixed(1));

  const handleConfirmBarter = () => {
    if (merchantOffer.length === 0 && playerOffer.length === 0) {
      toast.info('Adicione itens na balança de troca.');
      return;
    }

    const res = merchantService.executeBarterTransaction({
      shop,
      characterId: characterSheet.id || 'char',
      characterName: characterSheet.characterName,
      characterCurrency: characterSheet.currency || { po: 0, pl: 0, pe: 0, pp: 0, pc: 0 },
      characterInventory: characterSheet.equipment || [],
      merchantSlots: merchantOffer,
      playerSlots: playerOffer,
      goldBalanceCharacter: 0,
    });

    if (!res.success) {
      toast.error(res.error || 'Erro ao realizar a troca.');
      return;
    }

    const updatedSheet: CharacterSheet = {
      ...characterSheet,
      currency: res.updatedCurrency,
      equipment: res.updatedInventory,
      transactionHistory: [res.transactionLog, ...(characterSheet.transactionHistory || [])],
    };

    setShop(res.updatedShop);
    if (onUpdateShop) onUpdateShop(res.updatedShop);
    onUpdateCharacterSheet(updatedSheet);

    setMerchantOffer([]);
    setPlayerOffer([]);
    toast.success('Troca concluída com sucesso!');
  };

  // 3. Teste de Barganha com Persuasão (BG3 Persuasion Check)
  const handlePerformBargainCheck = () => {
    const chaScore = getEffectiveAttributeScore(characterSheet, 'cha');
    const chaMod = calculateModifier(chaScore);
    
    // Verificar proficiência em persuasão
    const persuasionSkill = characterSheet.skills?.persuasao;
    const isProficient = persuasionSkill === 'proficient';
    const isExpertise = persuasionSkill === 'expertise';
    const profBonus = calculateProficiencyBonus(characterSheet.level || 1);
    const totalMod = chaMod + (isExpertise ? profBonus * 2 : isProficient ? profBonus : 0);

    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + totalMod;
    const dc = shop.persuasionDc || 14;

    setIsBargaining(true);
    setTimeout(() => {
      setIsBargaining(false);
      setBargainRolled(true);

      if (d20 === 1) {
        const newAttitude = Math.max(-100, shop.attitude - 15);
        const updatedShop = { ...shop, attitude: newAttitude };
        setShop(updatedShop);
        if (onUpdateShop) onUpdateShop(updatedShop);
        toast.error(`💥 Falha Crítica no d20 (1)! O mercador se ofendeu com a sua audácia (-15 Atitude).`);
      } else if (total >= dc || d20 === 20) {
        const newAttitude = Math.min(100, shop.attitude + 25);
        const updatedShop = { ...shop, attitude: newAttitude };
        setShop(updatedShop);
        if (onUpdateShop) onUpdateShop(updatedShop);
        toast.success(`🎲 Sucesso na Barganha (${total} vs CD ${dc})! O mercador gostou da conversa (+25 Atitude).`);
      } else {
        toast.warning(`🎲 Teste de Persuasão falhou (${total} vs CD ${dc}). O mercador manteve os preços firmes.`);
      }
    }, 600);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#0b0f17] border border-amber-500/40 rounded-3xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header BG3 Style */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl bg-slate-950 border-2 border-amber-500/60 flex items-center justify-center text-amber-400 font-extrabold shadow-2xl overflow-hidden shrink-0 ring-2 ring-amber-500/20 relative group">
              {resolvedAvatar ? (
                <img src={resolvedAvatar} alt={shop.merchantName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <Coins className="w-12 h-12 text-amber-400/70" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-wide font-serif">
                  {shop.name}
                </h2>
                <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold border border-slate-700">
                  {shop.merchantName}
                </span>
                {shop.locationName && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-sans border border-indigo-500/30 flex items-center gap-1 font-semibold">
                    <MapPin className="w-3 h-3 text-indigo-400" />
                    {shop.locationName}
                  </span>
                )}
                {allShopsList.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-amber-500/40 shadow-inner">
                    <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <select
                      value={shop.id}
                      onChange={(e) => {
                        const found = allShopsList.find((s) => s.id === e.target.value);
                        if (found) {
                          setShop(found);
                          setMerchantOffer([]);
                          setPlayerOffer([]);
                          if (onSelectShop) onSelectShop(found);
                        }
                      }}
                      className="bg-transparent text-[11px] text-amber-300 font-bold focus:outline-none cursor-pointer pr-1"
                      title="Alternar para outra loja configurada pelo Mestre"
                    >
                      {allShopsList.map((s) => (
                        <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100 font-sans">
                          {s.name} ({s.merchantName}) {s.locationName ? `• 📍 ${s.locationName}` : ''} [{s.stock?.length || 0} itens]
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 italic mt-0.5">
                &ldquo;{shop.dialogueGreeting}&rdquo;
              </p>
            </div>
          </div>

          {/* Mode Switcher & Close */}
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setMode('trade')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'trade' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Comércio Rápido
              </button>
              <button
                onClick={() => setMode('barter')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'barter' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Balança de Barter (BG3)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Atitude & Caixa do Mercador */}
        <div className="px-6 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Atitude do Mercador:</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${((shop.attitude + 100) / 200) * 100}%`,
                    backgroundColor: attitudeInfo.colorHex
                  }}
                />
              </div>
              <span className="font-bold font-mono" style={{ color: attitudeInfo.colorHex }}>
                {shop.attitude >= 0 ? `+${shop.attitude}` : shop.attitude} ({attitudeInfo.label})
              </span>
            </div>

            {attitudeInfo.discountPercent !== 0 && (
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                attitudeInfo.discountPercent > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {attitudeInfo.discountPercent > 0 ? `-${attitudeInfo.discountPercent}% Preços` : `+${Math.abs(attitudeInfo.discountPercent)}% Sobretaxa`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!bargainRolled && (
              <button
                onClick={handlePerformBargainCheck}
                disabled={isBargaining}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow disabled:opacity-50"
              >
                <Dices className="w-3.5 h-3.5 text-amber-300" />
                <span>{isBargaining ? 'Rolando Persuasão...' : `Barganhar (CD ${shop.persuasionDc || 14})`}</span>
              </button>
            )}

            <div className="font-mono text-amber-400 font-bold flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              <span>Caixa do Mercador:</span>
              <span className="text-slate-100">{shop.goldReserve} PO</span>
            </div>
          </div>
        </div>

        {/* Corpo Principal Split-Screen */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* PAINEL DA ESQUERDA: Estoque do Mercador (5 cols) */}
          <div className="md:col-span-4 border-r border-slate-800/80 flex flex-col bg-slate-950/40 overflow-hidden">
            {/* Top Filtros & Busca */}
            <div className="p-3 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar no estoque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activeCategory === cat.id ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista do Estoque */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredStock.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  Nenhum item encontrado no estoque.
                </div>
              ) : (
                filteredStock.map((item, idx) => {
                  const buyPrice = merchantService.getItemEffectivePrice(item.basePriceGold, shop.attitude, true);

                  return (
                    <div
                      key={`stock-${item.id || idx}-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 truncate">{item.name}</span>
                          {item.rarity && item.rarity !== 'Comum' && (
                            <span className="text-[9px] px-1.5 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {item.rarity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description || item.category}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2.5">
                        <div className="flex flex-col items-end">
                          <div className="font-mono text-xs font-black text-amber-300">
                            {buyPrice} PO
                          </div>
                          <div className="text-[10px] font-mono font-bold">
                            {item.quantity === -1 ? (
                              <span className="text-emerald-400 font-bold" title="Estoque Ilimitado">
                                ∞ un
                              </span>
                            ) : (
                              <span className={item.quantity <= 2 ? 'text-amber-400 font-bold' : 'text-slate-400'} title={`${item.quantity} unidades disponíveis no estoque`}>
                                {item.quantity} un
                              </span>
                            )}
                          </div>
                        </div>

                        {mode === 'trade' ? (
                          <button
                            onClick={() => handleQuickBuy(item)}
                            className="p-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg font-bold transition-all cursor-pointer shadow"
                            title="Comprar Imediatamente"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToBarterFromShop(item)}
                            className="p-1.5 bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-slate-950 rounded-lg font-bold transition-all cursor-pointer shadow"
                            title="Adicionar à Balança de Troca"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PAINEL CENTRAL: Balança de Barter (4 cols) se modo Barter */}
          {mode === 'barter' ? (
            <div className="md:col-span-4 border-r border-slate-800/80 flex flex-col bg-slate-900/30 overflow-hidden">
              <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-amber-400 tracking-wider">
                  <Scale className="w-4 h-4" />
                  <span>Balança de Troca & Barter</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Lado do Mercador */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                    <span>Você Recebe (Loja)</span>
                    <span className="font-mono">{totalMerchantOfferGold} PO</span>
                  </div>
                  {merchantOffer.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-slate-500 italic">
                      Selecione itens da loja para comprar.
                    </div>
                  ) : (
                    merchantOffer.map((slot, idx) => (
                      <div key={`barter-m-${slot.item.id || idx}-${idx}`} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-lg">
                        <span className="text-slate-200 truncate">{slot.quantity}x {slot.item.name}</span>
                        <div className="flex items-center gap-2 font-mono text-amber-300">
                          <span>{slot.totalPriceGold} PO</span>
                          <button
                            onClick={() => setMerchantOffer(prev => prev.filter(s => s.item.id !== slot.item.id))}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Lado do Jogador */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-sky-400">
                    <span>Você Oferece (Mochila)</span>
                    <span className="font-mono">{totalPlayerOfferGold} PO</span>
                  </div>
                  {playerOffer.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-slate-500 italic">
                      Selecione itens da sua mochila para oferecer.
                    </div>
                  ) : (
                    playerOffer.map((slot, idx) => (
                      <div key={`barter-p-${slot.item.id || idx}-${idx}`} className="flex justify-between items-center text-xs bg-slate-900 p-2 rounded-lg">
                        <span className="text-slate-200 truncate">{slot.quantity}x {slot.item.name}</span>
                        <div className="flex items-center gap-2 font-mono text-sky-300">
                          <span>{slot.totalPriceGold} PO</span>
                          <button
                            onClick={() => setPlayerOffer(prev => prev.filter(s => s.item.id !== slot.item.id))}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Resumo da Balança */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-2">
                  <div className="text-xs text-slate-400">Diferença a Equilibrar:</div>
                  <div className="text-lg font-black font-mono">
                    {goldBalanceRequired > 0 ? (
                      <span className="text-rose-400">Você Paga: {goldBalanceRequired} PO</span>
                    ) : goldBalanceRequired < 0 ? (
                      <span className="text-emerald-400">Você Recebe: {Math.abs(goldBalanceRequired)} PO</span>
                    ) : (
                      <span className="text-amber-300">⚖️ Troca Equilibrada (0 PO)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botão de Concluir Troca */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => { setMerchantOffer([]); setPlayerOffer([]); }}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  onClick={handleConfirmBarter}
                  disabled={merchantOffer.length === 0 && playerOffer.length === 0}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-950/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  <span>Concluir Barter</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="md:col-span-4 border-r border-slate-800/80 flex flex-col bg-slate-950/30 items-center justify-center p-6 text-center text-slate-400">
              <Package className="w-12 h-12 text-amber-500/40 mb-3" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">Modo Comércio Direto Ativo</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Clique nas setas dos itens para comprar ou vender itens instantaneamente com 1 clique.
              </p>
            </div>
          )}

          {/* PAINEL DA DIREITA: Mochila & Carteira do Jogador (4 cols) */}
          <div className="md:col-span-4 flex flex-col bg-slate-950/40 overflow-hidden">
            {/* Topo Carteira */}
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">{characterSheet.characterName}</span>
                <div className="text-[10px] text-slate-500 font-mono">Inventário do Jogador</div>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs font-black text-amber-400">
                  {characterSheet.currency?.po || 0} PO
                </div>
                <div className="text-[10px] text-slate-400 flex gap-1.5">
                  <span>{characterSheet.currency?.pl || 0} PL</span>
                  <span>{characterSheet.currency?.pp || 0} PP</span>
                  <span>{characterSheet.currency?.pc || 0} PC</span>
                </div>
              </div>
            </div>

            {/* Lista da Mochila do Jogador */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
              {playerInventory.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  Mochila vazia.
                </div>
              ) : (
                playerInventory.map((item, idx) => {
                  const basePrice = getPlayerItemBasePrice(item);
                  const sellPrice = merchantService.getItemEffectivePrice(basePrice, shop.attitude, false);

                  return (
                    <div
                      key={`player-inv-${item.id || idx}-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100 truncate">{item.name}</span>
                          {(item.quantity || 1) > 1 && (
                            <span className="text-[9px] px-1.5 rounded font-mono bg-slate-800 text-slate-300">
                              x{item.quantity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.notes || 'Equipamento'}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div className="font-mono text-xs font-bold text-sky-300">
                          {sellPrice} PO
                        </div>

                        {mode === 'trade' ? (
                          <button
                            onClick={() => handleQuickSell(item)}
                            className="p-1.5 bg-sky-600 hover:bg-sky-500 text-slate-950 rounded-lg font-bold transition-all cursor-pointer"
                            title="Vender Imediatamente"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddToBarterFromPlayer(item)}
                            className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-slate-950 rounded-lg font-bold transition-all cursor-pointer"
                            title="Adicionar à Balança de Troca"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>💡 Modo Barter permite combinar itens da mochila para pagar compras caras.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar Loja
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
