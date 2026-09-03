import { describe, it, expect } from 'vitest';
import { 
  executeItemTransfer, 
  extractTransferableItems, 
  convertAttackToEquipmentItem 
} from '../services/itemTransferService';
import { CharacterSheet, CharacterEquipmentItem } from '../types';

const createBaseSheet = (name: string, id: string): CharacterSheet => ({
  id,
  userId: `user-${id}`,
  characterName: name,
  className: 'Guerreiro',
  level: 3,
  race: 'Humano',
  background: 'Soldado',
  alignment: 'Leal e Neutro',
  playerName: 'Player 1',
  xp: 900,
  inspiration: false,
  attributes: {
    str: { score: 16, modifier: 3, savingThrow: 5 },
    dex: { score: 14, modifier: 2, savingThrow: 2 },
    con: { score: 14, modifier: 2, savingThrow: 4 },
    int: { score: 10, modifier: 0, savingThrow: 0 },
    wis: { score: 12, modifier: 1, savingThrow: 1 },
    cha: { score: 8, modifier: -1, savingThrow: -1 },
  },
  savingThrows: {
    str: true,
    dex: false,
    con: true,
    int: false,
    wis: false,
    cha: false,
  },
  armorClass: 16,
  speed: '30 ft',
  maxHp: 28,
  currentHp: 28,
  tempHp: 0,
  hitDiceTotal: '3d10',
  hitDiceUsed: '0',
  deathSaves: { successes: 0, failures: 0 },
  attacks: [
    { id: 'atk-1', name: 'Espada Longa', atkBonus: '+5', damage: '1d8+3', type: 'Cortante' },
  ],
  skills: {} as any,
  otherProficienciesAndLanguages: '',
  equipment: [
    {
      id: 'pot-1',
      name: 'Poção de Cura',
      quantity: 3,
      rarity: 'Comum',
      itemType: 'potion',
      potionProps: {
        healingDice: '2d4+2',
        effectDesc: 'Recupera 2d4+2 pontos de vida.',
      },
    },
    {
      id: 'weap-1',
      name: 'Espada Longa',
      quantity: 1,
      rarity: 'Comum',
      itemType: 'weapon',
      weaponProps: {
        damage: '1d8+3',
        damageType: 'Cortante',
        atkBonus: 5,
      },
    },
    {
      id: 'letter-1',
      name: 'Carta Misteriosa do Arquimago',
      quantity: 1,
      rarity: 'Incomum',
      itemType: 'other',
      readableContent: {
        title: 'Carta ao Guardião',
        author: 'Mestre Elminster',
        pages: ['Encontre o artefato sob as ruínas antigas antes da lua de sangue.'],
      },
    },
  ],
  items: [],
  currency: { pc: 10, pp: 5, pe: 0, po: 50, pl: 0 },
});

describe('itemTransferService', () => {
  it('deve transferir poções preservando potionProps e sincronizando equipment e items', () => {
    const sender = createBaseSheet('Kirion', 's-1');
    const receiver = createBaseSheet('Lilith', 'r-1');
    receiver.equipment = [];
    receiver.items = [];

    const potionItem = sender.equipment!.find((it) => it.name === 'Poção de Cura')!;

    const result = executeItemTransfer(sender, receiver, [
      { item: potionItem, quantityToSend: 2 },
    ]);

    // Remetente deve ficar com 1 poção em equipment e items
    const senderRemainingPot = result.updatedSenderSheet.equipment?.find((it) => it.name === 'Poção de Cura');
    expect(senderRemainingPot).toBeDefined();
    expect(senderRemainingPot?.quantity).toBe(1);
    expect(result.updatedSenderSheet.items?.find((it) => it.name === 'Poção de Cura')?.quantity).toBe(1);

    // Destinatário deve receber 2 poções com potionProps intacto
    const receiverReceivedPot = result.updatedReceiverSheet.equipment?.find((it) => it.name === 'Poção de Cura');
    expect(receiverReceivedPot).toBeDefined();
    expect(receiverReceivedPot?.quantity).toBe(2);
    expect(receiverReceivedPot?.potionProps?.healingDice).toBe('2d4+2');
    expect(receiverReceivedPot?.potionProps?.effectDesc).toBe('Recupera 2d4+2 pontos de vida.');
    expect(result.transferredItemsSummary).toContain('2x Poção de Cura');
  });

  it('deve transferir bilhetes e cartas legíveis preservando todo o readableContent', () => {
    const sender = createBaseSheet('Kirion', 's-1');
    const receiver = createBaseSheet('Lilith', 'r-1');
    receiver.equipment = [];
    receiver.items = [];

    const letterItem = sender.equipment!.find((it) => it.name === 'Carta Misteriosa do Arquimago')!;

    const result = executeItemTransfer(sender, receiver, [
      { item: letterItem, quantityToSend: 1 },
    ]);

    // Remetente não deve mais ter a carta
    expect(result.updatedSenderSheet.equipment?.find((it) => it.name === 'Carta Misteriosa do Arquimago')).toBeUndefined();

    // Destinatário deve ter recebido a carta com o conteúdo integral preservado
    const receiverLetter = result.updatedReceiverSheet.equipment?.find((it) => it.name === 'Carta Misteriosa do Arquimago');
    expect(receiverLetter).toBeDefined();
    expect(receiverLetter?.readableContent?.title).toBe('Carta ao Guardião');
    expect(receiverLetter?.readableContent?.author).toBe('Mestre Elminster');
    expect(receiverLetter?.readableContent?.pages?.[0]).toContain('ruínas antigas');
  });

  it('deve transferir arma, remover do remetente e adicionar à lista de ataques do destinatário', () => {
    const sender = createBaseSheet('Kirion', 's-1');
    const receiver = createBaseSheet('Lilith', 'r-1');
    receiver.equipment = [];
    receiver.items = [];
    receiver.attacks = [];

    const weaponItem = sender.equipment!.find((it) => it.name === 'Espada Longa')!;

    const result = executeItemTransfer(sender, receiver, [
      { item: weaponItem, quantityToSend: 1 },
    ]);

    // Remetente não deve mais ter o item nem o ataque
    expect(result.updatedSenderSheet.equipment?.find((it) => it.name === 'Espada Longa')).toBeUndefined();
    expect(result.updatedSenderSheet.attacks.find((atk) => atk.name === 'Espada Longa')).toBeUndefined();

    // Destinatário deve ter recebido no inventário e na lista de ataques
    const receiverWeapon = result.updatedReceiverSheet.equipment?.find((it) => it.name === 'Espada Longa');
    expect(receiverWeapon).toBeDefined();
    expect(receiverWeapon?.weaponProps?.damage).toBe('1d8+3');

    const receiverAttack = result.updatedReceiverSheet.attacks.find((atk) => atk.name === 'Espada Longa');
    expect(receiverAttack).toBeDefined();
    expect(receiverAttack?.damage).toBe('1d8+3');
  });

  it('deve extrair armas declaradas apenas em attacks como itens transferíveis', () => {
    const sheet = createBaseSheet('Kirion', 's-1');
    sheet.attacks.push({
      id: 'atk-bow',
      name: 'Arco Curto',
      atkBonus: '+4',
      damage: '1d6+2',
      type: 'Perfurante',
    });

    const items = extractTransferableItems(sheet);
    const bowItem = items.find((it) => it.name === 'Arco Curto');
    expect(bowItem).toBeDefined();
    expect(bowItem?.weaponProps?.damage).toBe('1d6+2');
    expect(bowItem?.weaponProps?.damageType).toBe('Perfurante');
  });

  it('deve transferir múltiplos itens de tipos diferentes simultaneamente em um único pacote', () => {
    const sender = createBaseSheet('Kirion', 's-1');
    const receiver = createBaseSheet('Lilith', 'r-1');
    receiver.equipment = [];
    receiver.items = [];
    receiver.attacks = [];

    const potionItem = sender.equipment!.find((it) => it.name === 'Poção de Cura')!;
    const weaponItem = sender.equipment!.find((it) => it.name === 'Espada Longa')!;
    const letterItem = sender.equipment!.find((it) => it.name === 'Carta Misteriosa do Arquimago')!;

    const result = executeItemTransfer(sender, receiver, [
      { item: potionItem, quantityToSend: 1 },
      { item: weaponItem, quantityToSend: 1 },
      { item: letterItem, quantityToSend: 1 },
    ]);

    // O destinatário deve possuir os 3 itens
    expect(result.updatedReceiverSheet.equipment?.length).toBe(3);
    expect(result.updatedReceiverSheet.equipment?.some((i) => i.name === 'Poção de Cura')).toBe(true);
    expect(result.updatedReceiverSheet.equipment?.some((i) => i.name === 'Espada Longa')).toBe(true);
    expect(result.updatedReceiverSheet.equipment?.some((i) => i.name === 'Carta Misteriosa do Arquimago')).toBe(true);
    expect(result.updatedReceiverSheet.attacks.some((a) => a.name === 'Espada Longa')).toBe(true);

    // O remetente deve ter ficado com 2 poções restantes e sem a espada nem a carta
    expect(result.updatedSenderSheet.equipment?.find((i) => i.name === 'Poção de Cura')?.quantity).toBe(2);
    expect(result.updatedSenderSheet.equipment?.find((i) => i.name === 'Espada Longa')).toBeUndefined();
    expect(result.updatedSenderSheet.equipment?.find((i) => i.name === 'Carta Misteriosa do Arquimago')).toBeUndefined();
  });
});
