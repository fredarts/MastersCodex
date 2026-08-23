import { CharacterEquipmentItem, ItemType } from '@/lib/types';
import { SRD_EQUIPMENT, SRDItem } from '@/lib/srd-compendium';
import { WEAPON_TABLE } from '@/lib/dnd5e-calculator';
import { isItemReadable, getOrCreateReadableContent } from './readableLoreUtils';

/**
 * Converte qualquer string ou item de baú em um CharacterEquipmentItem completo e consistente com o Compêndio
 */
export function normalizeChestItem(
  item: string | CharacterEquipmentItem | any,
  containerNotes?: string
): CharacterEquipmentItem {
  if (typeof item === 'object' && item !== null && 'name' in item) {
    const readable = isItemReadable({ name: item.name, readableContent: item.readableContent });
    return {
      ...item,
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quantity: Number(item.quantity) || 1,
      itemType: item.itemType || (readable ? 'readable' : 'equipment'),
      readableContent: readable
        ? item.readableContent || getOrCreateReadableContent({ name: item.name, notes: item.notes || containerNotes })
        : undefined,
    };
  }

  const raw = String(item || '').trim();
  if (!raw) {
    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Item Desconhecido',
      quantity: 1,
      itemType: 'equipment',
    };
  }

  // Detect quantity prefix, e.g. "3x Flechas", "3 Flechas", "5 Poções"
  let quantity = 1;
  let cleanName = raw;
  const matchQty = raw.match(/^(\d+)\s*x?\s+(.+)$/i);
  if (matchQty) {
    quantity = parseInt(matchQty[1], 10) || 1;
    cleanName = matchQty[2].trim();
  }

  // 1. Procurar no Compêndio SRD
  const cleanLower = cleanName.toLowerCase();
  const srdMatch = SRD_EQUIPMENT.find(
    (s) =>
      s.name.toLowerCase() === cleanLower ||
      s.name.toLowerCase().includes(cleanLower) ||
      cleanLower.includes(s.name.toLowerCase())
  );

  let itemType: ItemType = 'equipment';
  let weight = '0.5 kg';
  let cost: string | undefined = undefined;
  let notes = containerNotes || '';
  let potionProps: CharacterEquipmentItem['potionProps'] = undefined;
  let weaponProps: CharacterEquipmentItem['weaponProps'] = undefined;
  let armorProps: CharacterEquipmentItem['armorProps'] = undefined;

  if (srdMatch) {
    cleanName = srdMatch.name;
    weight = `${srdMatch.weight} kg`;
    cost = srdMatch.cost;
    notes = srdMatch.description;

    if (srdMatch.category === 'Arma' || cleanLower.includes('flecha')) {
      itemType = 'weapon';
      const wtKey = cleanLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const weaponEntry = WEAPON_TABLE[srdMatch.name] || WEAPON_TABLE[cleanName] || WEAPON_TABLE[wtKey];
      if (weaponEntry) {
        weaponProps = {
          damage: weaponEntry.damage,
          damageType: weaponEntry.damageType,
        };
      }
    } else if (srdMatch.category === 'Armadura') {
      itemType = 'armor';
      armorProps = {
        armorType: cleanLower.includes('escudo') || cleanLower.includes('shield') ? 'shield' : 'light',
        acBonus: cleanLower.includes('escudo') || cleanLower.includes('shield') ? 2 : cleanLower.includes('placas') ? 8 : cleanLower.includes('cota') ? 6 : 2,
      };
    } else if (srdMatch.category === 'Poção') {
      itemType = 'potion';
      let healingDice = '2d4+2';
      if (cleanLower.includes('maior')) healingDice = '4d4+4';
      else if (cleanLower.includes('superior')) healingDice = '8d4+8';
      else if (cleanLower.includes('suprema')) healingDice = '10d4+20';
      potionProps = {
        healingDice,
        effectDesc: srdMatch.description,
      };
    } else if (srdMatch.category === 'Ferramenta') {
      itemType = 'equipment';
    }
  } else {
    // 2. Heurísticas baseadas em palavras-chave
    if (
      cleanLower.includes('espada') ||
      cleanLower.includes('machado') ||
      cleanLower.includes('arco') ||
      cleanLower.includes('adaga') ||
      cleanLower.includes('martelo') ||
      cleanLower.includes('lança') ||
      cleanLower.includes('flecha') ||
      cleanLower.includes('bordão') ||
      cleanLower.includes('cajado') ||
      cleanLower.includes('rapieira')
    ) {
      itemType = 'weapon';
    } else if (
      cleanLower.includes('armadura') ||
      cleanLower.includes('cota') ||
      cleanLower.includes('couro') ||
      cleanLower.includes('escudo') ||
      cleanLower.includes('placas')
    ) {
      itemType = 'armor';
    } else if (
      cleanLower.includes('poção') ||
      cleanLower.includes('pocao') ||
      cleanLower.includes('elixir') ||
      cleanLower.includes('antídoto') ||
      cleanLower.includes('antidoto')
    ) {
      itemType = 'potion';
      potionProps = {
        healingDice: '2d4+2',
        effectDesc: 'Restaura pontos de vida.',
      };
    } else if (isItemReadable({ name: cleanName })) {
      itemType = 'readable';
    }
    if (cost && !notes.includes(cost)) {
      notes = `${notes ? notes + ' ' : ''}(Custo: ${cost})`;
    }
  }

  const readable = isItemReadable({ name: cleanName });
  if (readable) {
    itemType = 'readable';
  }

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    quantity,
    weight,
    notes,
    itemType,
    weaponProps,
    armorProps,
    potionProps,
    readableContent: readable
      ? getOrCreateReadableContent({ name: cleanName, notes: containerNotes })
      : undefined,
  };
}

/**
 * Formata um rótulo de tipo/categoria do item para badges visuais
 */
export function getItemTypeBadgeInfo(item: CharacterEquipmentItem): {
  icon: string;
  label: string;
  badgeClass: string;
} {
  switch (item.itemType) {
    case 'weapon':
      return { icon: '⚔️', label: 'Arma', badgeClass: 'border-red-500/40 text-red-300 bg-red-950/40' };
    case 'armor':
      return { icon: '🛡️', label: 'Armadura', badgeClass: 'border-blue-500/40 text-blue-300 bg-blue-950/40' };
    case 'potion':
      return { icon: '🧪', label: 'Poção', badgeClass: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' };
    case 'scroll':
      return { icon: '📜', label: 'Pergaminho', badgeClass: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40' };
    case 'readable':
      return { icon: '📖', label: 'Lore/Livro', badgeClass: 'border-amber-500/40 text-amber-300 bg-amber-950/40' };
    default:
      return { icon: '🎒', label: 'Item', badgeClass: 'border-slate-600 text-slate-300 bg-slate-800/40' };
  }
}
