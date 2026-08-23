import { describe, it, expect } from 'vitest';
import {
  isItemReadable,
  detectReadableType,
  getOrCreateReadableContent,
} from '@/lib/utils/readableLoreUtils';
import { CharacterEquipmentItem, PartyLootItem, PartyLootSession } from '@/lib/types';

describe('Sistema de Itens Legíveis e Lore (BG3 Style)', () => {
  it('deve identificar itens legíveis por nome ou flag', () => {
    expect(isItemReadable({ name: 'Pequeno diário empoeirado' })).toBe(true);
    expect(isItemReadable({ name: 'Carta Selada em Cera Escarlate' })).toBe(true);
    expect(isItemReadable({ name: 'Bilhete Rascunhado' })).toBe(true);
    expect(isItemReadable({ name: 'Tomo dos Segredos Arcanos' })).toBe(true);
    expect(isItemReadable({ name: 'Espada Longa +1' })).toBe(false);
    expect(isItemReadable({ name: 'Poção de Cura' })).toBe(false);

    // Item customizado com flag explicita
    expect(
      isItemReadable({
        name: 'Relíquia Antiga',
        readableContent: { isReadable: true, content: 'Inscrições em relevo...' },
      })
    ).toBe(true);
  });

  it('deve detectar o tipo correto de suporte de leitura (livro vs carta vs diário)', () => {
    expect(detectReadableType('Pequeno diário empoeirado')).toBe('diary');
    expect(detectReadableType('Carta da Duquesa')).toBe('letter');
    expect(detectReadableType('Bilhete de Resgate')).toBe('note');
    expect(detectReadableType('Tomo de Magias Esquecidas')).toBe('tome');
    expect(detectReadableType('Pergaminho Histórico')).toBe('scroll');
    expect(detectReadableType('Livro de Contos')).toBe('book');
  });

  it('deve gerar páginas e conteúdo rico para o Pequeno Diário Empoeirado', () => {
    const diaryContent = getOrCreateReadableContent({
      name: 'Pequeno diário empoeirado',
    });

    expect(diaryContent.isReadable).toBe(true);
    expect(diaryContent.readableType).toBe('diary');
    expect(diaryContent.author).toContain('Escriba');
    expect(diaryContent.pages).toBeDefined();
    expect(diaryContent.pages!.length).toBeGreaterThanOrEqual(3);
    expect(diaryContent.pages![0]).toContain('Página 1');
    expect(diaryContent.pages![1]).toContain('Grade de Ferro');
  });

  it('deve gerar selo de cera e formatação para cartas e bilhetes', () => {
    const letterContent = getOrCreateReadableContent({
      name: 'Carta Misteriosa',
      notes: 'Um aviso sombrio deixado na mesa.',
    });

    expect(letterContent.isReadable).toBe(true);
    expect(letterContent.readableType).toBe('letter');
    expect(letterContent.isSealed).toBe(true);
    expect(letterContent.pages![0]).toContain('Um aviso sombrio');
  });

  it('deve acumular moedas e itens em sessões ativas de party loot sem descartar itens anteriores', () => {
    const existingSession: PartyLootSession = {
      id: 'session-1',
      campaignId: 'camp-1',
      title: 'Saque de Esconderijo',
      distributionMode: 'free_for_all',
      currency: { po: 50, pp: 0, pe: 0, pc: 0, pl: 0 },
      items: [
        {
          id: 'item-diary',
          name: 'Pequeno diário empoeirado',
          quantity: 1,
          claimedBy: null,
          itemType: 'readable',
        },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const newLoot = {
      currency: { po: 25, pp: 10, pe: 0, pc: 0, pl: 0 },
      items: [
        {
          id: 'item-ruby',
          name: 'Gema de Rubi',
          quantity: 1,
          claimedBy: null,
          itemType: 'equipment' as const,
        },
      ],
    };

    // Simulação do merge realizado no partyLootService
    const mergedCurrency = {
      po: existingSession.currency.po + newLoot.currency.po,
      pp: existingSession.currency.pp + newLoot.currency.pp,
      pe: existingSession.currency.pe + newLoot.currency.pe,
      pc: existingSession.currency.pc + newLoot.currency.pc,
      pl: existingSession.currency.pl + newLoot.currency.pl,
    };

    const mergedItems = [...existingSession.items, ...newLoot.items];

    expect(mergedCurrency.po).toBe(75);
    expect(mergedCurrency.pp).toBe(10);
    expect(mergedItems).toHaveLength(2);
    expect(mergedItems[0].name).toBe('Pequeno diário empoeirado');
    expect(mergedItems[1].name).toBe('Gema de Rubi');
  });

  it('deve remover/descartar item do baú da party sem afetar outros itens ou moedas', () => {
    const session: PartyLootSession = {
      id: 'session-1',
      campaignId: 'camp-1',
      title: 'Baú da Party',
      distributionMode: 'free_for_all',
      currency: { po: 50, pp: 10, pe: 0, pc: 0, pl: 0 },
      items: [
        { id: 'item-1', name: 'Espada Enferrujada', quantity: 1, claimedBy: null },
        { id: 'item-2', name: 'Pequeno diário empoeirado', quantity: 1, claimedBy: null },
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const itemIdToDiscard = 'item-1';
    const remainingItems = session.items.filter((i) => i.id !== itemIdToDiscard);

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].name).toBe('Pequeno diário empoeirado');
    expect(session.currency.po).toBe(50);
  });
});
