/**
 * lib/merchant/merchantService.ts
 * Motor Econômico e Serviço de Persistência do Merchant Forge & BG3 Trade System.
 */

import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { 
  MerchantShop, 
  MerchantStockItem,
  BarterTransactionParams, 
  BarterTransactionResult 
} from './merchantTypes';
import { CharacterCurrency, CharacterEquipmentItem, TransactionEntry } from '../types';

const LOCAL_STORAGE_SHOPS_PREFIX = 'codex_merchant_shops_';

export const merchantService = {
  /**
   * Calcula multiplicadores de compra e venda com base na atitude do mercador (-100 a +100).
   * Segue a curva de afinidade de Baldur's Gate 3.
   */
  calculateAttitudeCurve(attitude: number): { 
    buyMultiplier: number; 
    sellMultiplier: number; 
    discountPercent: number;
    label: string; 
    colorHex: string;
  } {
    const clamped = Math.max(-100, Math.min(100, attitude));

    if (clamped >= 80) {
      return {
        buyMultiplier: 0.80, // 20% de Desconto
        sellMultiplier: 0.65, // Vende itens por 65% do valor
        discountPercent: 20,
        label: 'Devoto / Aliado Lendário',
        colorHex: '#10b981', // Emerald
      };
    }
    if (clamped >= 40) {
      return {
        buyMultiplier: 0.90, // 10% de Desconto
        sellMultiplier: 0.58,
        discountPercent: 10,
        label: 'Amigável / Bem-Visto',
        colorHex: '#06b6d4', // Cyan
      };
    }
    if (clamped >= -20) {
      return {
        buyMultiplier: 1.00, // Preço Normal
        sellMultiplier: 0.50, // Padrão Livro D&D 5e: 50%
        discountPercent: 0,
        label: 'Neutro / Comerciante Pragmatista',
        colorHex: '#94a3b8', // Slate
      };
    }
    if (clamped >= -60) {
      return {
        buyMultiplier: 1.20, // +20% Sobretaxa
        sellMultiplier: 0.40,
        discountPercent: -20,
        label: 'Desconfiado / Ranzinza',
        colorHex: '#f59e0b', // Amber
      };
    }
    return {
      buyMultiplier: 1.35, // +35% Sobretaxa
      sellMultiplier: 0.30,
      discountPercent: -35,
      label: 'Hostil / Extorquista',
      colorHex: '#ef4444', // Rose
    };
  },

  /**
   * Retorna o preço unitário efetivo em PO considerando a atitude.
   */
  getItemEffectivePrice(basePrice: number, attitude: number, isBuyingFromShop: boolean): number {
    const curve = this.calculateAttitudeCurve(attitude);
    if (isBuyingFromShop) {
      return Math.max(0.1, Number((basePrice * curve.buyMultiplier).toFixed(1)));
    } else {
      return Math.max(0.1, Number((basePrice * curve.sellMultiplier).toFixed(1)));
    }
  },

  /**
   * Converte a carteira inteira do personagem em Peças de Ouro (PO) equivalentes.
   */
  getTotalGoldValue(currency: CharacterCurrency): number {
    const po = currency.po || 0;
    const pl = (currency.pl || 0) * 10;
    const pe = (currency.pe || 0) * 0.5;
    const pp = (currency.pp || 0) * 0.1;
    const pc = (currency.pc || 0) * 0.01;
    return Number((po + pl + pe + pp + pc).toFixed(2));
  },

  /**
   * Deduz um valor em PO da carteira do personagem com câmbio inteligente.
   */
  deductGold(currency: CharacterCurrency, goldToDeduct: number): { success: boolean; newCurrency: CharacterCurrency } {
    const totalAvailable = this.getTotalGoldValue(currency);
    if (totalAvailable < goldToDeduct) {
      return { success: false, newCurrency: currency };
    }

    const cur = { ...currency };
    let remaining = goldToDeduct;

    // 1. Tentar pagar com PO direto
    if ((cur.po || 0) >= remaining) {
      cur.po = Number(((cur.po || 0) - remaining).toFixed(2));
      return { success: true, newCurrency: cur };
    } else {
      remaining -= (cur.po || 0);
      cur.po = 0;
    }

    // 2. Tentar pagar com Platina (PL = 10 PO)
    const plAvailable = cur.pl || 0;
    const plNeeded = Math.ceil(remaining / 10);
    if (plAvailable >= plNeeded) {
      cur.pl = plAvailable - plNeeded;
      const changeGold = (plNeeded * 10) - remaining;
      cur.po = Number(((cur.po || 0) + changeGold).toFixed(2));
      return { success: true, newCurrency: cur };
    } else {
      remaining -= (plAvailable * 10);
      cur.pl = 0;
    }

    // 3. Tentar pagar com Prata (PP = 0.1 PO)
    const ppAvailable = cur.pp || 0;
    const ppNeeded = Math.ceil(remaining * 10);
    if (ppAvailable >= ppNeeded) {
      cur.pp = ppAvailable - ppNeeded;
      return { success: true, newCurrency: cur };
    } else {
      remaining -= (ppAvailable * 0.1);
      cur.pp = 0;
    }

    // 4. Fallback Cobre (PC = 0.01 PO)
    const pcAvailable = cur.pc || 0;
    const pcNeeded = Math.ceil(remaining * 100);
    cur.pc = Math.max(0, pcAvailable - pcNeeded);

    return { success: true, newCurrency: cur };
  },

  /**
   * Adiciona um valor em PO na carteira do personagem.
   */
  addGold(currency: CharacterCurrency, goldToAdd: number): CharacterCurrency {
    return {
      ...currency,
      po: Number(((currency.po || 0) + goldToAdd).toFixed(2)),
    };
  },

  /**
   * Executa a transação atômica de Barter / Comércio estilo Baldur's Gate 3.
   */
  executeBarterTransaction(params: BarterTransactionParams): BarterTransactionResult {
    const {
      shop,
      characterName,
      characterCurrency,
      characterInventory,
      merchantSlots,
      playerSlots,
      goldBalanceCharacter,
    } = params;

    // 1. Calcular valor total dos itens comprados e vendidos
    const totalBuyValue = merchantSlots.reduce((acc, slot) => acc + slot.totalPriceGold, 0);
    const totalSellValue = playerSlots.reduce((acc, slot) => acc + slot.totalPriceGold, 0);

    // Saldo líquido exigido do jogador (se positivo, o jogador precisa pagar; se negativo, o mercador paga)
    const netGoldOwedByPlayer = Number((totalBuyValue - totalSellValue + goldBalanceCharacter).toFixed(2));

    let updatedCurrency = { ...characterCurrency };

    // Se o jogador precisa pagar ouro
    if (netGoldOwedByPlayer > 0) {
      const deduction = this.deductGold(updatedCurrency, netGoldOwedByPlayer);
      if (!deduction.success) {
        return {
          success: false,
          error: `Ouro insuficiente. Você precisa de mais ${netGoldOwedByPlayer} PO para equilibrar a troca.`,
          updatedShop: shop,
          updatedCurrency: characterCurrency,
          updatedInventory: characterInventory,
          transactionLog: {} as any,
        };
      }
      updatedCurrency = deduction.newCurrency;
    } 
    // Se o mercador precisa pagar ouro ao jogador
    else if (netGoldOwedByPlayer < 0) {
      const goldToReceive = Math.abs(netGoldOwedByPlayer);
      if (shop.goldReserve < goldToReceive) {
        return {
          success: false,
          error: `O mercador só possui ${shop.goldReserve} PO em caixa e não consegue pagar os ${goldToReceive} PO exigidos.`,
          updatedShop: shop,
          updatedCurrency: characterCurrency,
          updatedInventory: characterInventory,
          transactionLog: {} as any,
        };
      }
      updatedCurrency = this.addGold(updatedCurrency, goldToReceive);
    }

    // 2. Atualizar Estoque da Loja & Reserva de Ouro do Mercador
    const updatedStock = [...shop.stock];

    // Subtrair itens comprados do estoque da loja
    merchantSlots.forEach((slot) => {
      const stockIdx = updatedStock.findIndex(s => s.id === slot.item.id || (s.srdItemId && s.srdItemId === (slot.item as MerchantStockItem).srdItemId));
      if (stockIdx !== -1) {
        const item = updatedStock[stockIdx];
        if (item.quantity !== -1) {
          const newQty = Math.max(0, item.quantity - slot.quantity);
          if (newQty === 0) {
            updatedStock.splice(stockIdx, 1);
          } else {
            updatedStock[stockIdx] = { ...item, quantity: newQty };
          }
        }
      }
    });

    // Adicionar itens vendidos pelo jogador no estoque da loja
    playerSlots.forEach((slot) => {
      const pItem = slot.item as CharacterEquipmentItem;
      updatedStock.push({
        id: `sold-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: pItem.name,
        category: 'adventuring_gear',
        basePriceGold: slot.unitPriceGold * 2, // Preço base original
        currentPriceGold: slot.unitPriceGold * 2,
        quantity: slot.quantity,
        description: pItem.notes || 'Vendido por um aventureiro.',
        weightLbs: typeof pItem.weight === 'number' ? pItem.weight : pItem.weight ? parseFloat(String(pItem.weight).replace(/[^0-9.]/g, '')) || 1 : 1,
        isCustom: true,
      });
    });

    const updatedShop: MerchantShop = {
      ...shop,
      goldReserve: Number((shop.goldReserve + netGoldOwedByPlayer).toFixed(2)),
      stock: updatedStock,
      updatedAt: new Date().toISOString(),
    };

    // 3. Atualizar Inventário do Personagem
    let updatedInventory = [...characterInventory];

    // Remover itens vendidos
    playerSlots.forEach((slot) => {
      const invIdx = updatedInventory.findIndex(i => i.id === slot.item.id);
      if (invIdx !== -1) {
        const invItem = updatedInventory[invIdx];
        const newQty = (invItem.quantity || 1) - slot.quantity;
        if (newQty <= 0) {
          updatedInventory.splice(invIdx, 1);
        } else {
          updatedInventory[invIdx] = { ...invItem, quantity: newQty };
        }
      }
    });

    // Inserir itens comprados no inventário
    merchantSlots.forEach((slot) => {
      const mItem = slot.item as MerchantStockItem;
      const existingIdx = updatedInventory.findIndex(i => i.name.toLowerCase() === mItem.name.toLowerCase() && !mItem.attunement);
      
      if (existingIdx !== -1) {
        updatedInventory[existingIdx] = {
          ...updatedInventory[existingIdx],
          quantity: (updatedInventory[existingIdx].quantity || 1) + slot.quantity,
        };
      } else {
        const newEquipment: CharacterEquipmentItem = {
          id: `equip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: mItem.name,
          quantity: slot.quantity,
          weight: mItem.weightLbs ? `${mItem.weightLbs} lb` : '1 lb',
          equipped: false,
          notes: mItem.description,
          rarity: (mItem.rarity as any) || 'Comum',
          itemType: mItem.category === 'weapon' ? 'weapon' : mItem.category === 'armor' ? 'armor' : mItem.category === 'potion' ? 'potion' : 'equipment',
        };
        updatedInventory.push(newEquipment);
      }
    });

    // 4. Criar Extrato Financeiro (Ledger Entry)
    const summaryParts: string[] = [];
    if (merchantSlots.length > 0) {
      summaryParts.push(`Comprou: ${merchantSlots.map(s => `${s.quantity}x ${s.item.name}`).join(', ')}`);
    }
    if (playerSlots.length > 0) {
      summaryParts.push(`Vendeu: ${playerSlots.map(s => `${s.quantity}x ${s.item.name}`).join(', ')}`);
    }

    const transactionLog: TransactionEntry = {
      id: `tx-${Date.now()}`,
      type: netGoldOwedByPlayer >= 0 ? 'spend' : 'loot',
      amount: Math.abs(netGoldOwedByPlayer),
      coinType: 'po',
      reason: `[Comércio: ${shop.name}] ${summaryParts.join(' | ')}`,
      date: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    return {
      success: true,
      updatedShop,
      updatedCurrency,
      updatedInventory,
      transactionLog,
    };
  },

  /**
   * Busca todas as lojas de uma campanha.
   */
  async fetchShops(campaignId: string): Promise<MerchantShop[]> {
    try {
      if (isSupabaseConfigured() && isValidUuid(campaignId)) {
        const { data, error } = await supabase
          .from('campaign_shops')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            campaignId: d.campaign_id,
            name: d.name,
            merchantName: d.merchant_name,
            merchantType: d.merchant_type,
            dialogueGreeting: d.dialogue_greeting,
            wealthTier: d.wealth_tier,
            goldReserve: d.gold_reserve,
            attitude: d.attitude,
            persuasionDc: d.persuasion_dc || 14,
            stock: d.stock || [],
            isOpenToPlayers: d.is_open_to_players ?? true,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      }

      // Fallback LocalStorage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_SHOPS_PREFIX}${campaignId}`);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar lojas, retornando vazio:', e);
    }
    return [];
  },

  /**
   * Salva ou atualiza uma loja.
   */
  async saveShop(shop: MerchantShop): Promise<void> {
    if (typeof window !== 'undefined') {
      const current = await this.fetchShops(shop.campaignId);
      const updated = [...current.filter(s => s.id !== shop.id), shop];
      localStorage.setItem(`${LOCAL_STORAGE_SHOPS_PREFIX}${shop.campaignId}`, JSON.stringify(updated));
    }

    if (isSupabaseConfigured() && isValidUuid(shop.campaignId)) {
      try {
        await supabase
          .from('campaign_shops')
          .upsert({
            id: isValidUuid(shop.id) ? shop.id : undefined,
            campaign_id: shop.campaignId,
            name: shop.name,
            merchant_name: shop.merchantName,
            merchant_type: shop.merchantType,
            dialogue_greeting: shop.dialogueGreeting,
            wealth_tier: shop.wealthTier,
            gold_reserve: shop.goldReserve,
            attitude: shop.attitude,
            persuasion_dc: shop.persuasionDc,
            stock: shop.stock,
            is_open_to_players: shop.isOpenToPlayers,
            updated_at: new Date().toISOString(),
          });
      } catch (e) {
        console.warn('Erro ao salvar loja no Supabase:', e);
      }
    }
  },

  /**
   * Deleta uma loja.
   */
  async deleteShop(shopId: string, campaignId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      const current = await this.fetchShops(campaignId);
      const updated = current.filter(s => s.id !== shopId);
      localStorage.setItem(`${LOCAL_STORAGE_SHOPS_PREFIX}${campaignId}`, JSON.stringify(updated));
    }

    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      try {
        await supabase.from('campaign_shops').delete().eq('id', shopId);
      } catch (e) {
        console.warn('Erro ao deletar loja no Supabase:', e);
      }
    }
  }
};
