'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MerchantShop, 
  MerchantType, 
  MerchantWealthTier,
  MerchantStockItem
} from '@/lib/merchant/merchantTypes';
import { 
  generateShopPreset, 
  MERCHANT_TEMPLATES, 
  WEALTH_TIER_CONFIG,
  convertSrdItemToStockItem,
  parseGoldValue
} from '@/lib/merchant/merchantPresets';
import { ALL_SRD_ITEMS } from '@/lib/srd-items-data';
import { merchantService } from '@/lib/merchant/merchantService';
import { useCampaign } from '@/context/CampaignContext';
import { useWorld } from '@/lib/hooks/useWorld';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';
import { ItemCompendiumModal } from '@/components/character-sheet/Modals/ItemCompendiumModal';
import { CharacterEquipmentItem } from '@/lib/types';
import { 
  Store, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  Radio, 
  Coins, 
  Send, 
  Edit3, 
  Check, 
  ShoppingBag,
  Power,
  BookOpen,
  User,
  MapPin,
  Building2,
  UserCheck,
  Link2,
  ExternalLink,
  Minus,
  Infinity
} from 'lucide-react';
import { toast } from 'sonner';

interface MerchantForgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShopToTrade?: (shop: MerchantShop) => void;
}

export const MerchantForgeModal: React.FC<MerchantForgeModalProps> = ({
  isOpen,
  onClose,
  onOpenShopToTrade,
}) => {
  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id || 'default-campaign';
  const { worldEntities } = useWorld();

  const [shops, setShops] = useState<MerchantShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<MerchantShop | null>(null);
  const [isCompendiumOpen, setIsCompendiumOpen] = useState<boolean>(false);

  // World Building Entities
  const npcEntities = React.useMemo(() => {
    return (worldEntities || []).filter(e => e.category === 'npc');
  }, [worldEntities]);

  const locationEntities = React.useMemo(() => {
    return (worldEntities || []).filter(e => e.category === 'location');
  }, [worldEntities]);

  // New Shop Generator Form State
  const [selectedType, setSelectedType] = useState<MerchantType>('blacksmith');
  const [selectedWealth, setSelectedWealth] = useState<MerchantWealthTier>('modest');
  const [customName, setCustomName] = useState<string>('');
  const [customMerchant, setCustomMerchant] = useState<string>('');
  const [selectedNpcId, setSelectedNpcId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    merchantService.fetchShops(campaignId).then((loaded) => {
      setShops(loaded);
      if (loaded.length > 0 && !selectedShop) {
        setSelectedShop(loaded[0]);
      }
    });
  }, [isOpen, campaignId]);

  if (!isOpen || !mounted) return null;

  const handleSelectNpcForNew = (npcId: string) => {
    setSelectedNpcId(npcId);
    if (!npcId) return;
    const npc = npcEntities.find(n => n.id === npcId);
    if (npc) {
      setCustomMerchant(npc.name);
    }
  };

  const handleGeneratePreset = () => {
    const chosenNpc = npcEntities.find(n => n.id === selectedNpcId);
    const chosenLoc = locationEntities.find(l => l.id === selectedLocationId);

    const newShop = generateShopPreset({
      type: selectedType,
      wealthTier: selectedWealth,
      campaignId,
      customName: customName.trim() || undefined,
      customMerchantName: customMerchant.trim() || chosenNpc?.name || undefined,
      merchantAvatarUrl: chosenNpc ? getEntityPortraitUrl(chosenNpc) : undefined,
      npcEntityId: chosenNpc?.id || undefined,
      locationEntityId: chosenLoc?.id || undefined,
      locationName: chosenLoc?.name || undefined,
    });

    merchantService.saveShop(newShop).then(() => {
      const updated = [newShop, ...shops];
      setShops(updated);
      setSelectedShop(newShop);
      setIsCreatingNew(false);
      setCustomName('');
      setCustomMerchant('');
      setSelectedNpcId('');
      setSelectedLocationId('');
      toast.success(`Loja '${newShop.name}' gerada com ${newShop.stock.length} itens do Compêndio!`);
    });
  };

  const handleDeleteShop = (shopId: string) => {
    merchantService.deleteShop(shopId, campaignId).then(() => {
      const updated = shops.filter((s) => s.id !== shopId);
      setShops(updated);
      setSelectedShop(updated.length > 0 ? updated[0] : null);
      toast.info('Loja excluída.');
    });
  };

  const handleToggleShopOpen = (shop: MerchantShop) => {
    const updated: MerchantShop = { ...shop, isOpenToPlayers: !shop.isOpenToPlayers };
    merchantService.saveShop(updated).then(() => {
      setShops(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSelectedShop(updated);
      if (updated.isOpenToPlayers) {
        toast.success(`📢 '${updated.name}' agora está aberta para os jogadores!`);
      } else {
        toast.info(`'${updated.name}' foi fechada.`);
      }
    });
  };

  const handleUpdateShopNpc = (npcId: string) => {
    if (!selectedShop) return;
    const npc = npcEntities.find(n => n.id === npcId);
    const updatedShop: MerchantShop = {
      ...selectedShop,
      npcEntityId: npcId || undefined,
      merchantName: npc ? npc.name : selectedShop.merchantName,
      merchantAvatarUrl: npc ? getEntityPortraitUrl(npc) : undefined,
    };
    merchantService.saveShop(updatedShop).then(() => {
      setSelectedShop(updatedShop);
      setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
      toast.success(npc ? `Mercador associado a "${npc.name}"!` : 'Associação de NPC desfeita.');
    });
  };

  const handleUpdateShopLocation = (locId: string) => {
    if (!selectedShop) return;
    const loc = locationEntities.find(l => l.id === locId);
    const updatedShop: MerchantShop = {
      ...selectedShop,
      locationEntityId: locId || undefined,
      locationName: loc ? loc.name : undefined,
    };
    merchantService.saveShop(updatedShop).then(() => {
      setSelectedShop(updatedShop);
      setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
      toast.success(loc ? `Loja associada ao local "${loc.name}"!` : 'Associação de local desfeita.');
    });
  };

  const handleAddItemFromCompendium = (equipItem: CharacterEquipmentItem) => {
    if (!selectedShop) return;

    const nameLower = equipItem.name.toLowerCase().trim();
    const matchingSrd = ALL_SRD_ITEMS.find(
      (s) => s.name.toLowerCase().trim() === nameLower
    );

    let newStockItem: MerchantStockItem;

    if (matchingSrd) {
      newStockItem = convertSrdItemToStockItem(matchingSrd, equipItem.quantity > 0 ? equipItem.quantity : 1);
    } else {
      let price = 10;
      if (equipItem.notes) {
        const match = equipItem.notes.match(/Custo:\s*([0-9.,]+)\s*([a-zA-Z]+)/i);
        if (match) {
          price = parseGoldValue(`${match[1]} ${match[2]}`);
        }
      }
      if (price === 10 && equipItem.rarity) {
        if (equipItem.rarity === 'Incomum') price = 500;
        else if (equipItem.rarity === 'Raro') price = 5000;
        else if (equipItem.rarity === 'Muito Raro') price = 50000;
        else if (equipItem.rarity === 'Lendário') price = 200000;
      }

      const cat = equipItem.itemType === 'weapon' ? 'weapon'
        : equipItem.itemType === 'armor' ? 'armor'
        : equipItem.itemType === 'potion' ? 'potion'
        : equipItem.itemType === 'scroll' ? 'scroll'
        : equipItem.rarity && equipItem.rarity !== 'Comum' ? 'magic_item'
        : 'adventuring_gear';

      newStockItem = {
        id: `stock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: equipItem.name,
        category: cat,
        basePriceGold: price,
        currentPriceGold: price,
        quantity: equipItem.quantity > 0 ? equipItem.quantity : 1,
        rarity: (equipItem.rarity as any) || 'Comum',
        description: equipItem.notes || '',
        weightLbs: typeof equipItem.weight === 'number' ? equipItem.weight : parseFloat(String(equipItem.weight || 1)),
        attunement: Boolean(equipItem.notes?.includes('Sintonização')),
        isCustom: false,
      };
    }

    const updatedShop: MerchantShop = {
      ...selectedShop,
      stock: [...selectedShop.stock, newStockItem],
    };

    merchantService.saveShop(updatedShop).then(() => {
      setSelectedShop(updatedShop);
      setShops((prev) => prev.map((s) => (s.id === updatedShop.id ? updatedShop : s)));
      toast.success(`"${newStockItem.name}" adicionado ao estoque da loja!`);
    });
  };

  const handleUpdateItemQuantity = (stockItemId: string, newQty: number) => {
    if (!selectedShop) return;
    const qty = Math.max(-1, newQty);
    const updatedShop: MerchantShop = {
      ...selectedShop,
      stock: selectedShop.stock.map(item => 
        item.id === stockItemId ? { ...item, quantity: qty } : item
      ),
    };

    setSelectedShop(updatedShop);
    setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
    merchantService.saveShop(updatedShop);
  };

  const handleUpdateItemPrice = (stockItemId: string, newPrice: number) => {
    if (!selectedShop) return;
    const price = Math.max(0, newPrice);
    const updatedShop: MerchantShop = {
      ...selectedShop,
      stock: selectedShop.stock.map(item => 
        item.id === stockItemId ? { ...item, basePriceGold: price, currentPriceGold: price } : item
      ),
    };

    setSelectedShop(updatedShop);
    setShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
    merchantService.saveShop(updatedShop);
  };

  const handleToggleItemInfinite = (stockItemId: string) => {
    if (!selectedShop) return;
    const currentItem = selectedShop.stock.find(i => i.id === stockItemId);
    if (!currentItem) return;
    const newQty = currentItem.quantity === -1 ? 1 : -1;
    handleUpdateItemQuantity(stockItemId, newQty);
    toast.success(newQty === -1 ? `Estoque de "${currentItem.name}" definido como Infinito (∞)!` : `Estoque de "${currentItem.name}" definido como 1 unidade.`);
  };

  const handleRemoveStockItem = (stockItemId: string) => {
    if (!selectedShop) return;

    const updatedShop: MerchantShop = {
      ...selectedShop,
      stock: selectedShop.stock.filter((i) => i.id !== stockItemId),
    };

    merchantService.saveShop(updatedShop).then(() => {
      setSelectedShop(updatedShop);
      setShops((prev) => prev.map((s) => (s.id === updatedShop.id ? updatedShop : s)));
      toast.info('Item removido do estoque.');
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f141d] border border-amber-500/40 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
                <span>Merchant Forge — Forja de Lojas & Mercadores</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                  D&D 5e Compendium
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Crie e gerencie lojas interativas estilo Baldur&apos;s Gate 3 com 1 clique
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Nova Loja</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Split */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Lado Esquerdo: Lista de Lojas (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-800 p-4 space-y-2.5 overflow-y-auto bg-slate-950/40">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Lojas da Campanha ({shops.length})
            </div>

            {shops.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-2xl p-4">
                Nenhuma loja criada ainda. Clique em &ldquo;Gerar Nova Loja&rdquo; acima.
              </div>
            ) : (
              shops.map((s, idx) => (
                <div
                  key={`merchant-shop-${s.id || idx}-${idx}`}
                  onClick={() => setSelectedShop(s)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedShop?.id === s.id
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                      <span>{s.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1">
                      <span>{s.merchantName}</span>
                      <span>•</span>
                      <span>{s.stock.length} itens</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">{s.goldReserve} PO</span>
                    </div>
                    {s.locationName && (
                      <div className="text-[10px] text-indigo-400 font-sans mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0 text-indigo-400" />
                        <span className="truncate">{s.locationName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.isOpenToPlayers ? 'bg-emerald-500' : 'bg-slate-600'}`} title={s.isOpenToPlayers ? 'Aberta' : 'Fechada'} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Lado Direito: Detalhes da Loja ou Modal de Criação (8 cols) */}
          <div className="md:col-span-8 p-6 overflow-y-auto bg-slate-900/20">
            {isCreatingNew ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Gerador Procedural de Lojas (Compêndio D&D 5e)</span>
                  </h3>
                  <button
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Voltar
                  </button>
                </div>

                {/* Seleção do Tipo de Loja */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    1. Escolha o Tipo de Comércio:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'blacksmith', label: '⚒️ Ferreiro & Armas', desc: 'Armas, Armaduras e Escudos' },
                      { id: 'alchemist', label: '🧪 Alquimista & Poções', desc: 'Poções de Cura, Óleos, Frascos' },
                      { id: 'arcanist', label: '📜 Empório Arcano', desc: 'Pergaminhos, Varinhas, Tintas' },
                      { id: 'black_market', label: '🕵️ Mercado Negro', desc: 'Venenos, Itens Raros, Ladinagem' },
                      { id: 'general_store', label: '🎒 Provisões Gerais', desc: 'Mochilas, Cordas, Tochas' },
                      { id: 'jeweler', label: '💎 Joalheiro & Câmbio', desc: 'Gemas, Anéis, Lingotes' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedType(t.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedType === t.id
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{t.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nível de Riqueza */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    2. Nível de Riqueza & Estoque:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['poor', 'modest', 'wealthy', 'legendary'] as MerchantWealthTier[]).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setSelectedWealth(w)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          selectedWealth === w
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{WEALTH_TIER_CONFIG[w].label.split('(')[0]}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {WEALTH_TIER_CONFIG[w].maxMagicItems} Mágicos
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vínculos com o World Building (Opcional) */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>3. Vínculos com o World Building (Opcional):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Selecionar NPC */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-400" />
                        <span>Vincular a um NPC:</span>
                      </label>
                      <select
                        value={selectedNpcId}
                        onChange={(e) => handleSelectNpcForNew(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Escolha um NPC ou digite abaixo --</option>
                        {npcEntities.map((npc) => (
                          <option key={npc.id} value={npc.id}>
                            👤 {npc.name} {npc.subType ? `(${npc.subType})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selecionar Localização */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span>Vincular a um Local / Cidade:</span>
                      </label>
                      <select
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Sem localização específica --</option>
                        {locationEntities.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            📍 {loc.name} {loc.subType ? `(${loc.subType})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Nomes Customizados Opcionais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Nome da Loja (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder={MERCHANT_TEMPLATES[selectedType].defaultName}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Nome do Mercador NPC (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder={MERCHANT_TEMPLATES[selectedType].defaultMerchant}
                      value={customMerchant}
                      onChange={(e) => setCustomMerchant(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleGeneratePreset}
                    className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-amber-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Store className="w-4 h-4" />
                    <span>Gerar Loja com Itens do Compêndio Oficial</span>
                  </button>
                </div>
              </div>
            ) : selectedShop ? (
              <div className="space-y-5">
                {/* Header da Loja Selecionada */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <span>{selectedShop.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Mercador: <span className="text-amber-300 font-bold">{selectedShop.merchantName}</span></span>
                      <span>•</span>
                      <span>{selectedShop.stock.length} itens no estoque</span>
                      {selectedShop.locationName && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-300 font-sans flex items-center gap-1 font-semibold">
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            {selectedShop.locationName}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleShopOpen(selectedShop)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        selectedShop.isOpenToPlayers
                          ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{selectedShop.isOpenToPlayers ? 'Aberta para Mesa' : 'Fechada'}</span>
                    </button>

                    {onOpenShopToTrade && (
                      <button
                        onClick={() => onOpenShopToTrade(selectedShop)}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Abrir Tela de Troca (BG3)</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteShop(selectedShop.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Excluir Loja"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vínculos com o World Building (NPC & Local) */}
                <div className="p-3.5 bg-slate-950/80 border border-amber-500/20 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Vínculos com o World Building (NPC & Localização)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Sincronização em Tempo Real
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mercador NPC Selector */}
                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>Mercador NPC:</span>
                        </label>
                        {selectedShop.npcEntityId && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5" /> Vinculado
                          </span>
                        )}
                      </div>
                      
                      <select
                        value={selectedShop.npcEntityId || ''}
                        onChange={(e) => handleUpdateShopNpc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">-- Nome Manual ({selectedShop.merchantName}) --</option>
                        {npcEntities.map((npc) => (
                          <option key={npc.id} value={npc.id}>
                            👤 {npc.name} {npc.subType ? `(${npc.subType})` : ''}
                          </option>
                        ))}
                      </select>
                      
                      {selectedShop.npcEntityId && (() => {
                        const linkedNpc = npcEntities.find(n => n.id === selectedShop.npcEntityId);
                        const npcAvatar = linkedNpc ? getEntityPortraitUrl(linkedNpc) : undefined;
                        return linkedNpc ? (
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                            {npcAvatar ? (
                              <img src={npcAvatar} alt={linkedNpc.name} className="w-6 h-6 rounded-full object-cover border border-amber-500/40 shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            <span className="truncate text-slate-300">{linkedNpc.shortDesc || linkedNpc.subType || 'NPC do World Building'}</span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Localização / Estabelecimento Selector */}
                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Localização / Cidade:</span>
                        </label>
                        {selectedShop.locationEntityId && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono flex items-center gap-1">
                            <Building2 className="w-2.5 h-2.5" /> Vinculado
                          </span>
                        )}
                      </div>

                      <select
                        value={selectedShop.locationEntityId || ''}
                        onChange={(e) => handleUpdateShopLocation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">-- Sem Localização Vinculada --</option>
                        {locationEntities.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            📍 {loc.name} {loc.subType ? `(${loc.subType})` : ''}
                          </option>
                        ))}
                      </select>

                      {selectedShop.locationName && (
                        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-indigo-300">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate font-semibold">{selectedShop.locationName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Caixa de Ouro</div>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">{selectedShop.goldReserve} PO</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Atitude Inicial</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">{selectedShop.attitude >= 0 ? `+${selectedShop.attitude}` : selectedShop.attitude}</div>
                  </div>
                  <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">CD de Barganha</div>
                    <div className="text-sm font-bold font-mono text-sky-400 mt-0.5">DC {selectedShop.persuasionDc || 14}</div>
                  </div>
                </div>

                {/* Amostra do Estoque da Loja */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <span>Estoque Atual ({selectedShop.stock.length} Itens):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCompendiumOpen(true)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                      title="Abrir Compêndio Oficial D&D 5e para adicionar itens com 1 clique"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Itens do Compêndio</span>
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {selectedShop.stock.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl p-4">
                        O estoque desta loja está vazio. Clique em &ldquo;Adicionar Itens do Compêndio&rdquo; acima para incluir armas, armaduras, poções e itens mágicos.
                      </div>
                    ) : (
                      selectedShop.stock.map((item, idx) => (
                        <div key={`stock-preview-${item.id || idx}-${idx}`} className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-xl flex items-center justify-between gap-2 text-xs transition-all group">
                          {/* Item Info */}
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-bold text-slate-200 truncate">{item.name}</span>
                            {item.rarity && item.rarity !== 'Comum' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono shrink-0">
                                {item.rarity}
                              </span>
                            )}
                          </div>

                          {/* Controls: Price + Quantity + Delete */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Preço Unitário (PO) */}
                            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 focus-within:border-amber-500/60" title="Preço unitário em Peças de Ouro (PO)">
                              <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.basePriceGold}
                                onChange={(e) => handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-12 bg-transparent text-right font-mono font-bold text-amber-300 text-xs focus:outline-none"
                              />
                              <span className="text-[10px] text-amber-400 font-bold">PO</span>
                            </div>

                            {/* Seletor de Quantidade & Infinito */}
                            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity === -1) handleUpdateItemQuantity(item.id, 1);
                                  else if (item.quantity > 1) handleUpdateItemQuantity(item.id, item.quantity - 1);
                                }}
                                disabled={item.quantity === 1}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                title="Diminuir quantidade"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              {item.quantity === -1 ? (
                                <span className="w-10 text-center font-mono font-bold text-emerald-400 text-xs" title="Estoque Infinito">
                                  ∞
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-10 bg-transparent text-center font-mono font-bold text-slate-100 text-xs focus:outline-none"
                                  title="Quantidade disponível em estoque"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity === -1) handleUpdateItemQuantity(item.id, 2);
                                  else handleUpdateItemQuantity(item.id, item.quantity + 1);
                                }}
                                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                                title="Aumentar quantidade"
                              >
                                <Plus className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleItemInfinite(item.id)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                                  item.quantity === -1
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                                }`}
                                title={item.quantity === -1 ? 'Estoque Ilimitado Ativo (Clique para definir número fixo)' : 'Tornar Estoque Ilimitado (∞)'}
                              >
                                ∞
                              </button>
                            </div>

                            {/* Botão Remover */}
                            <button
                              type="button"
                              onClick={() => handleRemoveStockItem(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                              title="Remover item do estoque"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 font-mono text-xs">
                Selecione uma loja na lista ao lado ou crie uma nova.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Compendium Modal for picking shop items */}
      <ItemCompendiumModal
        isOpen={isCompendiumOpen}
        onClose={() => setIsCompendiumOpen(false)}
        onAddItem={handleAddItemFromCompendium}
        zIndex="z-[1000001]"
      />
    </div>,
    document.body
  );
};
