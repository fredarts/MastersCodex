import { describe, it, expect } from 'vitest';
import { ChestLoot } from '@/components/MapMaker';

describe('Container Loot & Party Box Resolution', () => {
  it('deve permitir coletar item individualmente para um personagem', () => {
    const initialLoot: ChestLoot = {
      gp: 50,
      sp: 20,
      items: ['Poção de Cura (2d4+2)', 'Pergaminho de Mísseis Mágicos'],
    };

    const claimedIndex = 0;
    const claimedItem = initialLoot.items![claimedIndex];
    const remainingItems = initialLoot.items!.filter((_, idx) => idx !== claimedIndex);

    const updatedLoot: ChestLoot = {
      ...initialLoot,
      items: remainingItems,
    };

    expect(claimedItem).toBe('Poção de Cura (2d4+2)');
    expect(updatedLoot.items).toEqual(['Pergaminho de Mísseis Mágicos']);
    expect(updatedLoot.gp).toBe(50);
  });

  it('deve marcar o recipiente como saqueado (looted) quando todo o ouro e itens forem esvaziados', () => {
    const loot: ChestLoot = {
      gp: 0,
      sp: 0,
      cp: 0,
      pp: 0,
      items: [],
    };

    const isFullyLooted =
      (loot.gp || 0) === 0 &&
      (loot.sp || 0) === 0 &&
      (loot.cp || 0) === 0 &&
      (loot.pp || 0) === 0 &&
      (!loot.items || loot.items.length === 0);

    expect(isFullyLooted).toBe(true);
  });

  it('deve gerar carga de sessão de grupo correta para enviar todo o saque ao baú da party', () => {
    const containerLoot: ChestLoot = {
      gp: 150,
      sp: 80,
      pp: 5,
      cp: 0,
      items: ['Espada Longa +1', 'Poção de Invisibilidade'],
    };

    const partyItems = containerLoot.items!.map((name, idx) => ({
      id: `party-item-${idx}`,
      name,
      quantity: 1,
      weight: '1 lb',
      itemType: 'equipment' as const,
      rarity: 'Incomum' as const,
    }));

    const sessionPayload = {
      title: 'Saque de Baú de Madeira',
      currency: {
        po: containerLoot.gp || 0,
        pp: containerLoot.sp || 0,
        pe: 0,
        pc: containerLoot.cp || 0,
        pl: containerLoot.pp || 0,
      },
      items: partyItems,
    };

    expect(sessionPayload.currency.po).toBe(150);
    expect(sessionPayload.currency.pp).toBe(80);
    expect(sessionPayload.currency.pl).toBe(5);
    expect(partyItems).toHaveLength(2);
    expect(partyItems[0].name).toBe('Espada Longa +1');
    expect(partyItems[1].name).toBe('Poção de Invisibilidade');
  });

  it('deve normalizar strings de baú em objetos consistentes com o Compêndio para a ficha de personagem', async () => {
    const { normalizeChestItem } = await import('@/lib/utils/lootItemUtils');

    const sword = normalizeChestItem('Espada Longa');
    expect(sword.name).toBe('Espada Longa');
    expect(sword.itemType).toBe('weapon');
    expect(sword.quantity).toBe(1);

    const potion = normalizeChestItem('Poção de Cura');
    expect(potion.name).toBe('Poção de Cura');
    expect(potion.itemType).toBe('potion');
    expect(potion.potionProps?.healingDice).toBe('2d4+2');

    const arrows = normalizeChestItem('20 Flechas');
    expect(arrows.quantity).toBe(20);
    expect(arrows.itemType).toBe('weapon');

    const armor = normalizeChestItem('Armadura de Couro');
    expect(armor.itemType).toBe('armor');
  });
});
