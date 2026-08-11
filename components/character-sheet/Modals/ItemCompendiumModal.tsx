import React, { useState, useMemo } from 'react';
import { CharacterSheet, CharacterEquipmentItem, ItemType } from '@/lib/types';
import { SRD_EQUIPMENT, SRDItem } from '@/lib/srd-compendium';
import {
  Search,
  Package,
  Plus,
  Minus,
  Check,
  X,
  Shield,
  Wrench,
  Coins,
  Weight,
  Trash2,
  ShoppingCart,
  ArrowLeftRight
} from 'lucide-react';
import { toast } from 'sonner';

interface ItemCompendiumModalProps {
  sheet?: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onChange?: (updatedSheet: CharacterSheet) => void;
  onAddItem?: (item: CharacterEquipmentItem) => void;
}

interface CartItem {
  srdItem: SRDItem;
  quantity: number;
}

export const ItemCompendiumModal: React.FC<ItemCompendiumModalProps> = ({
  sheet,
  isOpen,
  onClose,
  onChange,
  onAddItem,
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addedItemNames, setAddedItemNames] = useState<Set<string>>(new Set());

  const isBrowseOnly = !sheet || !onChange;

  const coins = useMemo(() => {
    if (isBrowseOnly) return { pl: 0, po: 0, pe: 0, pp: 0, pc: 0 };
    return {
      pl: sheet.currency?.pl || 0,
      po: sheet.currency?.po || 0,
      pe: sheet.currency?.pe || 0,
      pp: sheet.currency?.pp || 0,
      pc: sheet.currency?.pc || 0,
    };
  }, [sheet?.currency, isBrowseOnly]);

  if (!isOpen) return null;

  const categories = ['all', 'Arma', 'Armadura', 'Equipamento', 'Poção', 'Ferramenta', 'Tesouro'];

  // --- PARSE E FORMATAÇÃO DE CUSTO ---
  const parseCostInCopper = (costStr: string): number => {
    const clean = costStr.replace(/\./g, '').trim().toLowerCase();
    const match = clean.match(/^([\d,]+)\s*(po|pr|pc|pe|pl)/);
    if (!match) return 0;
    const val = parseInt(match[1].replace(/,/g, ''));
    const unit = match[2];
    switch (unit) {
      case 'pl': return val * 1000;
      case 'po': return val * 100;
      case 'pe': return val * 50;
      case 'pr':
      case 'pp': return val * 10;
      case 'pc': return val * 1;
      default: return 0;
    }
  };

  const formatCopperToCoins = (copper: number): string => {
    if (copper <= 0) return '0 pc';
    const parts: string[] = [];
    let rem = copper;
    const pl = Math.floor(rem / 1000);
    rem %= 1000;
    const po = Math.floor(rem / 100);
    rem %= 100;
    const pe = Math.floor(rem / 50);
    rem %= 50;
    const pp = Math.floor(rem / 10);
    const pc = rem % 10;

    if (pl > 0) parts.push(`${pl} pl`);
    if (po > 0) parts.push(`${po} po`);
    if (pe > 0) parts.push(`${pe} pe`);
    if (pp > 0) parts.push(`${pp} pp`);
    if (pc > 0) parts.push(`${pc} pc`);

    return parts.join(', ');
  };

  // --- FILTRAGEM ---
  const filteredBuyItems = SRD_EQUIPMENT.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const playerItems = sheet?.equipment || [];
  const filteredSellItems = playerItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // --- OPERAÇÕES DO CARRINHO E IMPORTAÇÃO ---
  const handleAddToCart = (srdItem: SRDItem) => {
    const itemType: ItemType =
      srdItem.category === 'Poção' ? 'potion' :
      srdItem.category === 'Arma' ? 'weapon' :
      srdItem.category === 'Armadura' ? 'armor' : 'equipment';

    let potionProps;
    if (itemType === 'potion') {
      let healingDice = '2d4+2';
      const nameLower = srdItem.name.toLowerCase();
      if (nameLower.includes('maior')) {
        healingDice = '4d4+4';
      } else if (nameLower.includes('superior')) {
        healingDice = '8d4+8';
      } else if (nameLower.includes('suprema')) {
        healingDice = '10d4+20';
      }
      potionProps = {
        healingDice,
        effectDesc: srdItem.description,
      };
    }

    const newItem: CharacterEquipmentItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: srdItem.name,
      quantity: 1,
      weight: `${srdItem.weight} kg`,
      notes: `${srdItem.description} (Custo: ${srdItem.cost})`,
      itemType,
      potionProps,
    };

    if (isBrowseOnly) {
      if (onAddItem) {
        onAddItem(newItem);
        setAddedItemNames((prev) => new Set(prev).add(srdItem.name));
        toast.success(`"${srdItem.name}" adicionado!`);
      }
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.srdItem.name === srdItem.name);
      if (existing) {
        return prev.map((i) =>
          i.srdItem.name === srdItem.name ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { srdItem, quantity: 1 }];
    });
    toast.success(`"${srdItem.name}" adicionado ao carrinho!`);
  };

  const handleUpdateCartQuantity = (name: string, amt: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.srdItem.name === name ? { ...i, quantity: Math.max(1, i.quantity + amt) } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (name: string) => {
    setCart((prev) => prev.filter((i) => i.srdItem.name !== name));
    toast.info('Item removido do carrinho.');
  };

  // --- CÁLCULO DE TOTAIS DO CARRINHO ---
  const cartTotalCopper = cart.reduce((sum, i) => {
    return sum + parseCostInCopper(i.srdItem.cost) * i.quantity;
  }, 0);

  const cartTotalWeight = cart.reduce((sum, i) => {
    return sum + i.srdItem.weight * i.quantity;
  }, 0);

  // --- DEDUÇÃO INTELIGENTE DE MOEDAS ---
  const tryDeductCoins = (
    currentCoins: { pl: number; po: number; pe: number; pp: number; pc: number },
    costInCopper: number
  ) => {
    const temp = {
      pl: currentCoins.pl || 0,
      po: currentCoins.po || 0,
      pe: currentCoins.pe || 0,
      pp: currentCoins.pp || 0,
      pc: currentCoins.pc || 0,
    };

    const totalCopper = temp.pl * 1000 + temp.po * 100 + temp.pe * 50 + temp.pp * 10 + temp.pc;
    if (totalCopper < costInCopper) return null;

    let needed = costInCopper;

    if (temp.pc >= needed) {
      temp.pc -= needed;
      return temp;
    } else {
      needed -= temp.pc;
      temp.pc = 0;
    }

    const ppInCopper = temp.pp * 10;
    if (ppInCopper >= needed) {
      const ppNeeded = Math.ceil(needed / 10);
      temp.pp -= ppNeeded;
      temp.pc = (ppNeeded * 10) - needed;
      return temp;
    } else {
      needed -= ppInCopper;
      temp.pp = 0;
    }

    const peInCopper = temp.pe * 50;
    if (peInCopper >= needed) {
      const peNeeded = Math.ceil(needed / 50);
      temp.pe -= peNeeded;
      needed -= peNeeded * 50;
      let change = -needed;
      const ppChange = Math.floor(change / 10);
      temp.pp += ppChange;
      temp.pc += (change % 10);
      return temp;
    } else {
      needed -= peInCopper;
      temp.pe = 0;
    }

    const poInCopper = temp.po * 100;
    if (poInCopper >= needed) {
      const poNeeded = Math.ceil(needed / 100);
      temp.po -= poNeeded;
      needed -= poNeeded * 100;
      let change = -needed;
      const ppChange = Math.floor(change / 10);
      temp.pp += ppChange;
      temp.pc += (change % 10);
      return temp;
    } else {
      needed -= poInCopper;
      temp.po = 0;
    }

    const plInCopper = temp.pl * 1000;
    if (plInCopper >= needed) {
      const plNeeded = Math.ceil(needed / 1000);
      temp.pl -= plNeeded;
      needed -= plNeeded * 1000;
      let change = -needed;
      const poChange = Math.floor(change / 100);
      change %= 100;
      const ppChange = Math.floor(change / 10);
      temp.pc += (change % 10);
      temp.po += poChange;
      temp.pp += ppChange;
      return temp;
    }

    return null;
  };

  const addCopperToCoins = (
    currentCoins: { pl: number; po: number; pe: number; pp: number; pc: number },
    copperAmount: number
  ) => {
    const coinsCopy = { ...currentCoins };
    let rem = copperAmount;
    
    const poToAdd = Math.floor(rem / 100);
    rem %= 100;
    const ppToAdd = Math.floor(rem / 10);
    const pcToAdd = rem % 10;

    coinsCopy.po = (coinsCopy.po || 0) + poToAdd;
    coinsCopy.pp = (coinsCopy.pp || 0) + ppToAdd;
    coinsCopy.pc = (coinsCopy.pc || 0) + pcToAdd;

    return coinsCopy;
  };

  // --- FINALIZAR COMPRA ---
  const handleCheckout = () => {
    if (isBrowseOnly || !onChange) return;
    if (cart.length === 0) {
      toast.warning('O carrinho está vazio!');
      return;
    }

    const newCoins = tryDeductCoins(coins, cartTotalCopper);
    if (!newCoins) {
      toast.error(`Saldo insuficiente! Custo total: ${formatCopperToCoins(cartTotalCopper)}`);
      return;
    }

    const updatedEquipment = [...playerItems];

    cart.forEach(({ srdItem, quantity }) => {
      const existingIndex = updatedEquipment.findIndex(
        (eq) => eq.name.toLowerCase() === srdItem.name.toLowerCase()
      );

      const itemType: ItemType =
        srdItem.category === 'Poção' ? 'potion' :
        srdItem.category === 'Arma' ? 'weapon' :
        srdItem.category === 'Armadura' ? 'armor' : 'equipment';

      let potionProps;
      if (itemType === 'potion') {
        let healingDice = '2d4+2';
        const nameLower = srdItem.name.toLowerCase();
        if (nameLower.includes('maior')) {
          healingDice = '4d4+4';
        } else if (nameLower.includes('superior')) {
          healingDice = '8d4+8';
        } else if (nameLower.includes('suprema')) {
          healingDice = '10d4+20';
        }
        potionProps = {
          healingDice,
          effectDesc: srdItem.description,
        };
      }

      if (existingIndex !== -1) {
        updatedEquipment[existingIndex] = {
          ...updatedEquipment[existingIndex],
          quantity: (updatedEquipment[existingIndex].quantity || 1) + quantity,
        };
      } else {
        updatedEquipment.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
          name: srdItem.name,
          quantity,
          weight: `${srdItem.weight} kg`,
          notes: `${srdItem.description} (Custo: ${srdItem.cost})`,
          itemType,
          potionProps,
        });
      }
    });

    onChange({
      ...sheet,
      currency: newCoins,
      equipment: updatedEquipment,
    });

    setCart([]);
    toast.success('Compra realizada com sucesso!');
  };

  // --- VENDER ITEM (50% DO VALOR) ---
  const handleSellItem = (item: CharacterEquipmentItem) => {
    if (isBrowseOnly || !onChange) return;

    const matchedSrd = SRD_EQUIPMENT.find(
      (eq) => eq.name.toLowerCase() === item.name.toLowerCase()
    );

    const costStr = matchedSrd ? matchedSrd.cost : '1 po';
    const baseValueCopper = parseCostInCopper(costStr);
    const sellValueCopper = Math.floor(baseValueCopper * 0.5);

    if (sellValueCopper <= 0) {
      toast.error('Este item não possui valor de venda.');
      return;
    }

    const updatedEquipment = playerItems
      .map((eq) => {
        if (eq.id === item.id) {
          return { ...eq, quantity: (eq.quantity || 1) - 1 };
        }
        return eq;
      })
      .filter((eq) => eq.quantity > 0);

    const newCoins = addCopperToCoins(coins, sellValueCopper);

    onChange({
      ...sheet,
      currency: newCoins,
      equipment: updatedEquipment,
    });

    toast.success(
      `Vendido: "${item.name}" por ${formatCopperToCoins(sellValueCopper)} (50% do valor)!`
    );
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-[#0f141d] border border-amber-500/40 rounded-2xl shadow-2xl w-full ${isBrowseOnly ? 'max-w-3xl' : 'max-w-5xl'} h-[85vh] flex flex-col overflow-hidden`}>
        
        {/* CABEÇALHO */}
        <div className="bg-[#161c28] border-b border-[#2a3449]/80 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-100 font-serif">
                {isBrowseOnly
                  ? 'Compêndio de Equipamentos D&D 5e'
                  : activeTab === 'buy'
                  ? 'Mercado de Equipamentos (Comprar)'
                  : 'Comerciante - Venda Seus Itens'}
              </h2>
              {!isBrowseOnly && <span className="text-[11px] text-slate-400">Ficha: {sheet?.characterName}</span>}
            </div>
          </div>

          {/* Seletor de Compra / Venda (Apenas se tiver ficha vinculada) */}
          {!isBrowseOnly && (
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('buy');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'buy'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Comprar</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('sell');
                  setSearchTerm('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'sell'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Vender</span>
              </button>
            </div>
          )}

          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#2a3449]/40 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ÁREA PRINCIPAL */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUNA ESQUERDA: CATÁLOGO DE COMPRA OU INVENTÁRIO DE VENDA */}
          <div className={`${isBrowseOnly ? 'w-full' : 'w-3/5'} flex flex-col border-r border-[#2a3449] bg-[#0a0d14]/30 overflow-hidden`}>
            
            {/* Campo de Busca e Filtros */}
            <div className="p-4 bg-[#111827]/40 border-b border-[#2a3449]/40 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    isBrowseOnly
                      ? 'Buscar item, poção ou ferramenta no compêndio...'
                      : activeTab === 'buy'
                      ? 'Buscar item, arma ou ferramenta na loja...'
                      : 'Buscar item para vender no seu inventário...'
                  }
                  className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {activeTab === 'buy' && (
                <div className="flex gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all uppercase cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow'
                          : 'bg-[#161c28]/60 text-slate-400 hover:text-white border border-[#2a3449]/50'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listagem */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2.5 custom-scrollbar">
              {activeTab === 'buy' ? (
                filteredBuyItems.length > 0 ? (
                  filteredBuyItems.map((item) => {
                    const isAdded = isBrowseOnly && addedItemNames.has(item.name);
                    return (
                      <div
                        key={item.name}
                        className="bg-[#161c28]/60 border border-[#2a3449]/60 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{item.name}</span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold shrink-0">
                              {item.weight} kg
                            </span>
                            <span className="text-[10px] text-amber-300 font-mono font-bold">({item.cost})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{item.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          disabled={isAdded}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-extrabold rounded-xl shadow transition-all shrink-0 cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Adicionado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isBrowseOnly ? 'Adicionar' : 'Comprar'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">Nenhum item disponível com esses filtros.</div>
                )
              ) : (
                !isBrowseOnly && (
                  filteredSellItems.length > 0 ? (
                    filteredSellItems.map((item) => {
                      const matchedSrd = SRD_EQUIPMENT.find(
                        (eq) => eq.name.toLowerCase() === item.name.toLowerCase()
                      );
                      const costStr = matchedSrd ? matchedSrd.cost : '1 po';
                      const baseVal = parseCostInCopper(costStr);
                      const sellVal = Math.floor(baseVal * 0.5);

                      return (
                        <div
                          key={item.id}
                          className="bg-[#161c28]/60 border border-[#2a3449]/60 hover:border-rose-500/30 rounded-xl p-3 flex items-center justify-between gap-3 transition-all"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{item.name}</span>
                              <span className="text-[10px] font-mono text-slate-300 bg-[#2a3449]/60 px-1.5 py-0.5 rounded shrink-0">
                                Qtd: {item.quantity || 1}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                                Venda por: {formatCopperToCoins(sellVal)}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-[11px] text-slate-500 leading-tight italic truncate max-w-md">{item.notes}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSellItem(item)}
                            className="flex items-center gap-1 px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 active:scale-95 font-bold text-xs rounded-xl shadow transition-all shrink-0 cursor-pointer"
                          >
                            <span>Vender 1x</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-slate-500 text-xs">Seu inventário de equipamentos está vazio ou não possui correspondências.</div>
                  )
                )
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: CARRINHO (COMPRA) OU BOLSA DE MOEDAS */}
          {!isBrowseOnly && (
            <div className="w-2/5 flex flex-col bg-[#161c28]/20 overflow-hidden">
              
              {/* CARTEIRA ATUAL DO PERSONAGEM */}
              <div className="p-4 bg-[#161c28]/60 border-b border-[#2a3449]/70 space-y-2 shrink-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Sua Bolsa de Moedas</span>
                </h3>
                
                <div className="grid grid-cols-5 gap-1.5 text-center mt-2">
                  <div className="bg-[#0b0f19] border border-[#2a3449]/40 rounded-xl py-1.5 px-1">
                    <span className="text-[9px] font-black text-amber-600 block leading-none">PC</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">{coins.pc}</span>
                  </div>
                  <div className="bg-[#0b0f19] border border-[#2a3449]/40 rounded-xl py-1.5 px-1">
                    <span className="text-[9px] font-black text-slate-400 block leading-none">PP</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">{coins.pp}</span>
                  </div>
                  <div className="bg-[#0b0f19] border border-[#2a3449]/40 rounded-xl py-1.5 px-1">
                    <span className="text-[9px] font-black text-indigo-400 block leading-none">PE</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">{coins.pe}</span>
                  </div>
                  <div className="bg-[#0b0f19] border border-[#2a3449]/40 rounded-xl py-1.5 px-1">
                    <span className="text-[9px] font-black text-amber-400 block leading-none">PO</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">{coins.po}</span>
                  </div>
                  <div className="bg-[#0b0f19] border border-[#2a3449]/40 rounded-xl py-1.5 px-1">
                    <span className="text-[9px] font-black text-cyan-400 block leading-none">PL</span>
                    <span className="text-xs font-mono font-bold text-slate-200 mt-1 block">{coins.pl}</span>
                  </div>
                </div>
              </div>

              {/* LISTAGEM DO CARRINHO */}
              {activeTab === 'buy' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 bg-[#0a0d14]/40 border-b border-[#2a3449]/30 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-black uppercase text-slate-400 flex items-center gap-1">
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-500" />
                      Carrinho ({cart.length} itens)
                    </span>
                    {cart.length > 0 && (
                      <button
                        onClick={() => setCart([])}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                      >
                        Limpar tudo
                      </button>
                    )}
                  </div>

                  <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                    {cart.length > 0 ? (
                      cart.map(({ srdItem, quantity }) => {
                        const itemTotalCopper = parseCostInCopper(srdItem.cost) * quantity;
                        return (
                          <div
                            key={srdItem.name}
                            className="bg-[#0b0f19] border border-[#2a3449]/60 rounded-xl p-2.5 flex items-center justify-between gap-2.5"
                          >
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <span className="text-xs font-bold text-white truncate block">{srdItem.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                Peso: {(srdItem.weight * quantity).toFixed(1)} kg | Total: {formatCopperToCoins(itemTotalCopper)}
                              </span>
                            </div>

                            {/* Seletor de Quantidade do Carrinho */}
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                              <button
                                onClick={() => handleUpdateCartQuantity(srdItem.name, -1)}
                                className="p-1 hover:bg-[#2a3449]/40 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-bold text-slate-200 px-1 w-6 text-center">
                                {quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateCartQuantity(srdItem.name, 1)}
                                className="p-1 hover:bg-[#2a3449]/40 text-slate-400 hover:text-white rounded transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveFromCart(srdItem.name)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-1 py-12">
                        <ShoppingCart className="w-8 h-8 opacity-25 text-amber-500" />
                        <span className="text-xs">O carrinho está vazio.</span>
                        <span className="text-[10px] text-slate-600">Adicione itens na coluna da esquerda.</span>
                      </div>
                    )}
                  </div>

                  {/* TOTALIZADOR E BOTÃO DE FINALIZAR */}
                  <div className="p-4 bg-[#161c28]/80 border-t border-[#2a3449]/70 space-y-3 shrink-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Weight className="w-3.5 h-3.5" /> Peso Total:
                        </span>
                        <span className="font-mono font-bold text-slate-200">{cartTotalWeight.toFixed(2)} kg</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400 flex items-center gap-1 font-bold">
                          <Coins className="w-3.5 h-3.5 text-amber-400" /> Custo Total:
                        </span>
                        <span className="font-mono font-black text-amber-300 text-sm">
                          {formatCopperToCoins(cartTotalCopper)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className={`w-full py-2.5 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase transition-all shadow-lg cursor-pointer ${
                        cart.length === 0
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 active:scale-98'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Finalizar Compra</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-slate-500 space-y-2">
                  <ArrowLeftRight className="w-10 h-10 opacity-30 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase">Comerciante de Campanha</h4>
                  <p className="text-[11px] text-slate-500 max-w-[240px] leading-relaxed">
                    Para vender qualquer um de seus itens, basta clicar em **"Vender 1x"** na prateleira da esquerda. A venda renderá **50%** do custo padrão e as moedas serão adicionadas automaticamente na sua bolsa.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
