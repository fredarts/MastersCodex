import { describe, it, expect } from 'vitest';
import { merchantService } from '../merchant/merchantService';
import { generateShopPreset } from '../merchant/merchantPresets';
import { CharacterCurrency, CharacterEquipmentItem } from '../types';

describe('Merchant Economy & BG3 Barter Engine', () => {
  it('calculates attitude pricing curves correctly', () => {
    // Attitude +100 (Devoto/Aliado): 20% discount on buy (80% base), 65% base on sell
    const allyCurve = merchantService.calculateAttitudeCurve(100);
    expect(allyCurve.buyMultiplier).toBe(0.8);
    expect(allyCurve.sellMultiplier).toBe(0.65);
    expect(allyCurve.discountPercent).toBe(20);

    // Attitude 0 (Neutro): 100% on buy, 50% on sell
    const neutralCurve = merchantService.calculateAttitudeCurve(0);
    expect(neutralCurve.buyMultiplier).toBe(1.0);
    expect(neutralCurve.sellMultiplier).toBe(0.5);

    // Attitude -50 (Desconfiado): 20% markup on buy (120% base), 40% on sell
    const suspiciousCurve = merchantService.calculateAttitudeCurve(-50);
    expect(suspiciousCurve.buyMultiplier).toBe(1.2);
    expect(suspiciousCurve.sellMultiplier).toBe(0.4);

    // Item de 100 PO:
    const buyPriceAlly = merchantService.getItemEffectivePrice(100, 100, true);
    expect(buyPriceAlly).toBe(80);

    const sellPriceAlly = merchantService.getItemEffectivePrice(100, 100, false);
    expect(sellPriceAlly).toBe(65);
  });

  it('calculates total gold value across all coin denominations (PO, PL, PE, PP, PC)', () => {
    const wallet: CharacterCurrency = {
      po: 50, // 50
      pl: 2,  // 20
      pe: 4,  // 2
      pp: 30, // 3
      pc: 50, // 0.5
    };

    const total = merchantService.getTotalGoldValue(wallet);
    expect(total).toBe(75.5);
  });

  it('deducts gold accurately with change making when exact PO is available', () => {
    const wallet: CharacterCurrency = { po: 100, pl: 0, pe: 0, pp: 0, pc: 0 };
    const res = merchantService.deductGold(wallet, 45);

    expect(res.success).toBe(true);
    expect(res.newCurrency.po).toBe(55);
  });

  it('deducts gold from higher denominations (Platina) and returns change in PO', () => {
    const wallet: CharacterCurrency = { po: 5, pl: 2, pe: 0, pp: 0, pc: 0 }; // 5 PO + 20 PO = 25 PO
    const res = merchantService.deductGold(wallet, 15);

    expect(res.success).toBe(true);
    // Gastou 5 PO direto + 1 PL (10 PO) = 15 PO -> Sobra 1 PL e 0 PO
    expect(res.newCurrency.pl).toBe(1);
    expect(res.newCurrency.po).toBe(0);
  });

  it('blocks transactions when player has insufficient total gold', () => {
    const wallet: CharacterCurrency = { po: 10, pl: 0, pe: 0, pp: 0, pc: 0 };
    const res = merchantService.deductGold(wallet, 50);

    expect(res.success).toBe(false);
    expect(res.newCurrency.po).toBe(10);
  });

  it('executes a complete BG3 barter transaction atomically', () => {
    const shop = generateShopPreset({
      type: 'blacksmith',
      wealthTier: 'modest',
      campaignId: 'camp-123',
    });

    const initialCurrency: CharacterCurrency = { po: 100, pl: 0, pe: 0, pp: 0, pc: 0 };
    const initialInventory: CharacterEquipmentItem[] = [
      { id: 'item-ruby', name: 'Rubi Bruto', quantity: 1, weight: 0.1, equipped: false },
    ];

    // Jogador quer comprar 1 item da loja no valor de 30 PO
    const merchantSlot = {
      item: { id: 'stock-sword', name: 'Espada Longa', basePriceGold: 30, currentPriceGold: 30, category: 'weapon' as const, quantity: 1 },
      quantity: 1,
      unitPriceGold: 30,
      totalPriceGold: 30,
      source: 'merchant' as const,
    };

    // Jogador oferece o Rubi Bruto que vale 20 PO na venda
    const playerSlot = {
      item: initialInventory[0],
      quantity: 1,
      unitPriceGold: 20,
      totalPriceGold: 20,
      source: 'player' as const,
    };

    // Diferença líquida: 30 PO - 20 PO = 10 PO que o jogador deve pagar
    const res = merchantService.executeBarterTransaction({
      shop,
      characterId: 'char-1',
      characterName: 'Alden',
      characterCurrency: initialCurrency,
      characterInventory: initialInventory,
      merchantSlots: [merchantSlot],
      playerSlots: [playerSlot],
      goldBalanceCharacter: 0,
    });

    expect(res.success).toBe(true);
    // 100 PO - 10 PO = 90 PO
    expect(res.updatedCurrency.po).toBe(90);
    // Inventário do jogador: Rubi removido, Espada Longa adicionada
    expect(res.updatedInventory.some(i => i.name === 'Espada Longa')).toBe(true);
    expect(res.updatedInventory.some(i => i.name === 'Rubi Bruto')).toBe(false);
    // Saldo do mercador aumentou em 10 PO
    expect(res.updatedShop.goldReserve).toBe(shop.goldReserve + 10);
    // Extrato gerado
    expect(res.transactionLog.amount).toBe(10);
  });
});
