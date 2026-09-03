import { CharacterSheet, CharacterEquipmentItem, CharacterWeaponAttack } from '@/lib/types';

export interface TransferItemPayload {
  item: CharacterEquipmentItem;
  quantityToSend: number;
}

export interface ItemTransferResult {
  updatedSenderSheet: CharacterSheet;
  updatedReceiverSheet: CharacterSheet;
  transferredItemsSummary: string[];
}

/**
 * Normaliza um ataque para um item de equipamento caso o jogador tenha armas apenas na lista de ataques
 */
export function convertAttackToEquipmentItem(attack: CharacterWeaponAttack): CharacterEquipmentItem {
  return {
    id: `item-weap-${attack.id || Date.now()}`,
    name: attack.name,
    quantity: 1,
    weight: '2 lb',
    rarity: 'Comum',
    itemType: 'weapon',
    notes: `Bônus de Ataque: ${attack.atkBonus}`,
    weaponProps: {
      damage: attack.damage,
      damageType: attack.type,
      atkBonus: parseInt(attack.atkBonus?.replace(/[^0-9-]/g, '') || '0') || 0,
    },
  };
}

/**
 * Coleta todos os itens transferíveis da ficha (equipamentos, poções, armaduras, armas, livros, cartas, bilhetes e ataques)
 */
export function extractTransferableItems(sheet: CharacterSheet): CharacterEquipmentItem[] {
  const rawList = (sheet.equipment && sheet.equipment.length > 0)
    ? sheet.equipment
    : (sheet.items && sheet.items.length > 0)
    ? sheet.items
    : [];

  const seenIds = new Set<string>();
  const existingItems: CharacterEquipmentItem[] = rawList.map((it, idx) => {
    let safeId = it.id || `item_${idx}_${Date.now()}`;
    if (seenIds.has(safeId)) {
      safeId = `${safeId}_dup_${idx}_${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(safeId);
    return { ...it, id: safeId };
  });

  const existingNames = new Set(existingItems.map((it) => (it.name || '').trim().toLowerCase()));

  // Se tiver armas cadastradas em sheet.attacks que não constam em equipment/items, adiciona como item transferível
  if (sheet.attacks && sheet.attacks.length > 0) {
    for (const atk of sheet.attacks) {
      if (atk.name && !existingNames.has(atk.name.trim().toLowerCase()) && atk.name !== 'Ataque Desarmado') {
        const converted = convertAttackToEquipmentItem(atk);
        if (seenIds.has(converted.id)) {
          converted.id = `${converted.id}_atk_${Math.random().toString(36).substring(2, 6)}`;
        }
        seenIds.add(converted.id);
        existingItems.push(converted);
      }
    }
  }

  return existingItems;
}

/**
 * Realiza a transferência de itens de uma ficha para outra preservando 100% da integridade dos objetos D&D 5e
 */
export function executeItemTransfer(
  senderSheet: CharacterSheet,
  receiverSheet: CharacterSheet,
  itemsToTransfer: TransferItemPayload[]
): ItemTransferResult {
  if (!itemsToTransfer || itemsToTransfer.length === 0) {
    return {
      updatedSenderSheet: { ...senderSheet },
      updatedReceiverSheet: { ...receiverSheet },
      transferredItemsSummary: [],
    };
  }

  const senderRaw = (senderSheet.equipment && senderSheet.equipment.length > 0)
    ? senderSheet.equipment
    : (senderSheet.items && senderSheet.items.length > 0)
    ? senderSheet.items
    : [];
  const senderItems: CharacterEquipmentItem[] = senderRaw.map((it) => ({ ...it }));
  const senderAttacks: CharacterWeaponAttack[] = [...(senderSheet.attacks || [])];

  const receiverRaw = (receiverSheet.equipment && receiverSheet.equipment.length > 0)
    ? receiverSheet.equipment
    : (receiverSheet.items && receiverSheet.items.length > 0)
    ? receiverSheet.items
    : [];
  const receiverItems: CharacterEquipmentItem[] = receiverRaw.map((it) => ({ ...it }));
  const receiverAttacks: CharacterWeaponAttack[] = [...(receiverSheet.attacks || [])];

  const transferredItemsSummary: string[] = [];

  for (const transferPayload of itemsToTransfer) {
    const { item, quantityToSend } = transferPayload;
    if (quantityToSend <= 0) continue;

    const itemName = (item.name || '').trim();
    const qty = Math.min(quantityToSend, item.quantity || 1);

    // 1. DEDUZIR DO REMETENTE
    const senderItemIndex = senderItems.findIndex(
      (it) => it.id === item.id || (it.name && it.name.trim().toLowerCase() === itemName.toLowerCase())
    );

    if (senderItemIndex >= 0) {
      const currentSenderItem = senderItems[senderItemIndex];
      const remainingQty = (currentSenderItem.quantity || 1) - qty;

      if (remainingQty <= 0) {
        senderItems.splice(senderItemIndex, 1);
      } else {
        senderItems[senderItemIndex] = {
          ...currentSenderItem,
          quantity: remainingQty,
        };
      }
    }

    // Se o item for uma arma que também estava na lista rápida de ataques do remetente e esgotou
    const attackIndex = senderAttacks.findIndex(
      (atk) => (atk.name || '').trim().toLowerCase() === itemName.toLowerCase()
    );
    if (attackIndex >= 0 && (item.quantity || 1) <= qty) {
      senderAttacks.splice(attackIndex, 1);
    }

    // 2. ADICIONAR AO DESTINATÁRIO
    // Verifica se o destinatário já possui um item idêntico empilhável (não-mágico, sem notas especiais ou texto de leitura)
    const receiverItemIndex = receiverItems.findIndex(
      (it) =>
        (it.name || '').trim().toLowerCase() === itemName.toLowerCase() &&
        !it.readableContent &&
        !it.notes &&
        !it.potionProps &&
        !it.weaponProps &&
        !it.armorProps
    );

    if (receiverItemIndex >= 0) {
      // Incrementa quantidade do item existente
      const existingReceiverItem = receiverItems[receiverItemIndex];
      receiverItems[receiverItemIndex] = {
        ...existingReceiverItem,
        quantity: (existingReceiverItem.quantity || 1) + qty,
      };
    } else {
      // Adiciona como novo item preservando TODAS as propriedades de dados (potionProps, weaponProps, armorProps, readableContent, etc.)
      const newItem: CharacterEquipmentItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        quantity: qty,
        equipped: false, // Inicia desequipado no novo dono para ele decidir equipar
      };
      receiverItems.push(newItem);
    }

    // Se for uma arma com dados de ataque e o destinatário ainda não tiver na lista de ataques rápidos
    if (item.itemType === 'weapon' || item.weaponProps) {
      const alreadyHasAttack = receiverAttacks.some(
        (atk) => (atk.name || '').trim().toLowerCase() === itemName.toLowerCase()
      );
      if (!alreadyHasAttack) {
        receiverAttacks.push({
          id: `atk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: item.name,
          atkBonus: item.weaponProps?.atkBonus ? `+${item.weaponProps.atkBonus}` : '+2',
          damage: item.weaponProps?.damage || '1d6',
          type: item.weaponProps?.damageType || 'Cortante',
        });
      }
    }

    transferredItemsSummary.push(`${qty}x ${item.name}`);
  }

  const nowIso = new Date().toISOString();

  const updatedSenderSheet: CharacterSheet = {
    ...senderSheet,
    equipment: senderItems,
    items: senderItems,
    attacks: senderAttacks,
    updatedAt: nowIso,
  };

  const updatedReceiverSheet: CharacterSheet = {
    ...receiverSheet,
    equipment: receiverItems,
    items: receiverItems,
    attacks: receiverAttacks,
    updatedAt: nowIso,
  };

  return {
    updatedSenderSheet,
    updatedReceiverSheet,
    transferredItemsSummary,
  };
}
