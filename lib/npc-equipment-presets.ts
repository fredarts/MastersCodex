import { CharacterSheet, CharacterEquipmentItem, CharacterWeaponAttack } from './types';
import { generateUuid } from './dnd5e-data';
import { recalculateSheetDerivedStats } from './dnd5e-calculator';

export interface NpcEquipmentPreset {
  id: string;
  name: string;
  category: 'Combate Marcial' | 'Conjuradores & Arcanos' | 'Furtividade & Submundo' | 'Tropas & Guardas' | 'Especiais';
  description: string;
  icon: string;
  items: Array<{
    name: string;
    itemType: 'weapon' | 'armor' | 'potion' | 'scroll' | 'equipment';
    equipped?: boolean;
    quantity: number;
    weight: string;
    rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário';
    notes?: string;
    weaponProps?: {
      damage: string;
      damageType: string;
      atkBonus?: number;
    };
    armorProps?: {
      acBonus: number;
      armorType: 'light' | 'medium' | 'heavy' | 'shield';
    };
    potionProps?: {
      healingDice?: string;
      effectDesc?: string;
    };
  }>;
}

export const NPC_EQUIPMENT_PRESETS: NpcEquipmentPreset[] = [
  {
    id: 'guard_soldier',
    name: 'Guarda da Cidade / Soldado',
    category: 'Tropas & Guardas',
    description: 'Equipamento padrão de patrulheiros e guardas urbanos com proteção pesada e armas de contenção.',
    icon: '🛡️',
    items: [
      {
        name: 'Cota de Malha (Chain Mail)',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '25 kg',
        armorProps: { acBonus: 16, armorType: 'heavy' },
        notes: 'CA 16 fixa, desvantagem em Furtividade.',
      },
      {
        name: 'Escudo de Aço',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '3 kg',
        armorProps: { acBonus: 2, armorType: 'shield' },
        notes: '+2 na Classe de Armadura.',
      },
      {
        name: 'Espada Longa',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '1.5 kg',
        weaponProps: { damage: '1d8', damageType: 'Cortante', atkBonus: 0 },
        notes: 'Versátil (1d10 a duas mãos).',
      },
      {
        name: 'Besta Leve',
        itemType: 'weapon',
        equipped: false,
        quantity: 1,
        weight: '2.5 kg',
        weaponProps: { damage: '1d8', damageType: 'Perfurante', atkBonus: 0 },
        notes: 'Distância 24/96m, recarga.',
      },
      {
        name: 'Virotes de Besta (20x)',
        itemType: 'equipment',
        equipped: false,
        quantity: 20,
        weight: '0.7 kg',
      },
      {
        name: 'Poção de Cura',
        itemType: 'potion',
        equipped: false,
        quantity: 1,
        weight: '0.2 kg',
        potionProps: { healingDice: '2d4+2', effectDesc: 'Restaura 2d4+2 pontos de vida.' },
      },
    ],
  },
  {
    id: 'veteran_knight',
    name: 'Cavaleiro Nobre / Capitão Veterano',
    category: 'Combate Marcial',
    description: 'Armadura completa de placas reluzentes, espada bastarda e liderança em campo de batalha.',
    icon: '⚔️',
    items: [
      {
        name: 'Armadura de Placas Completa (Plate)',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '30 kg',
        armorProps: { acBonus: 18, armorType: 'heavy' },
        notes: 'CA 18 máxima. Exige FOR 15.',
      },
      {
        name: 'Escudo Forjado com Brasão',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '3 kg',
        armorProps: { acBonus: 2, armorType: 'shield' },
        notes: '+2 na CA.',
      },
      {
        name: 'Espada Longa +1',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '1.5 kg',
        rarity: 'Incomum',
        weaponProps: { damage: '1d8+1', damageType: 'Cortante', atkBonus: 1 },
        notes: '+1 nas jogadas de ataque e dano mágico.',
      },
      {
        name: 'Lança de Cavalaria (Lance)',
        itemType: 'weapon',
        equipped: false,
        quantity: 1,
        weight: '3 kg',
        weaponProps: { damage: '1d12', damageType: 'Perfurante', atkBonus: 0 },
        notes: 'Alcance 3m. Especial em montaria.',
      },
      {
        name: 'Poção de Cura Maior',
        itemType: 'potion',
        equipped: false,
        quantity: 2,
        weight: '0.4 kg',
        rarity: 'Incomum',
        potionProps: { healingDice: '4d4+4', effectDesc: 'Restaura 4d4+4 pontos de vida.' },
      },
    ],
  },
  {
    id: 'scholar_mage',
    name: 'Mago Erudito / Conjurador Arcano',
    category: 'Conjuradores & Arcanos',
    description: 'Túnica de tecelão, bordão encantado, grimório repleto de magias e foco arcano refinado.',
    icon: '🔮',
    items: [
      {
        name: 'Robe de Tecelão Arcano',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '1.5 kg',
        armorProps: { acBonus: 10, armorType: 'light' },
        notes: 'Permite somar Modificador de Destreza integral à CA.',
      },
      {
        name: 'Bordão de Carvalho Arcano (+1)',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '2 kg',
        rarity: 'Incomum',
        weaponProps: { damage: '1d6+1', damageType: 'Contundente', atkBonus: 1 },
        notes: 'Funciona como foco arcano e arma mágica.',
      },
      {
        name: 'Adaga Cerimonial de Prata',
        itemType: 'weapon',
        equipped: false,
        quantity: 1,
        weight: '0.5 kg',
        weaponProps: { damage: '1d4', damageType: 'Perfurante', atkBonus: 0 },
        notes: 'Acuidade, leve, arremesso (6/18m), forjada em prata pura.',
      },
      {
        name: 'Grimório de Couro Encadernado',
        itemType: 'equipment',
        equipped: false,
        quantity: 1,
        weight: '1.5 kg',
        notes: 'Contém todas as fórmulas e magias estudadas.',
      },
      {
        name: 'Poção de Restauração de Mana / Cura',
        itemType: 'potion',
        equipped: false,
        quantity: 2,
        weight: '0.4 kg',
        potionProps: { healingDice: '2d4+2', effectDesc: 'Recupera PV ou foco de conjuração.' },
      },
    ],
  },
  {
    id: 'stealth_rogue',
    name: 'Ladino Sorrateiro / Assassino das Sombras',
    category: 'Furtividade & Submundo',
    description: 'Armadura de couro batido, adagas duplas balanceadas para ataque furtivo e arco curto silencioso.',
    icon: '🗡️',
    items: [
      {
        name: 'Armadura de Couro Batido (Studded Leather)',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '6 kg',
        armorProps: { acBonus: 12, armorType: 'light' },
        notes: 'CA 12 + Modificador de DES completo. Sem penalidade em furtividade.',
      },
      {
        name: 'Adaga Venenosa de Aço Negro',
        itemType: 'weapon',
        equipped: true,
        quantity: 2,
        weight: '1 kg',
        weaponProps: { damage: '1d4', damageType: 'Perfurante', atkBonus: 0 },
        notes: 'Acuidade, leve. Lâmina tratada com veneno paralisante.',
      },
      {
        name: 'Arco Curto Silencioso',
        itemType: 'weapon',
        equipped: false,
        quantity: 1,
        weight: '1 kg',
        weaponProps: { damage: '1d6', damageType: 'Perfurante', atkBonus: 0 },
        notes: 'Distância 24/96m, duas mãos.',
      },
      {
        name: 'Flechas (20x)',
        itemType: 'equipment',
        equipped: false,
        quantity: 20,
        weight: '0.5 kg',
      },
      {
        name: 'Ferramentas de Ladrão (Thieves Tools)',
        itemType: 'equipment',
        equipped: false,
        quantity: 1,
        weight: '0.5 kg',
        notes: 'Garante proficiência em desarmar armadilhas e abrir fechaduras.',
      },
      {
        name: 'Poção de Invisibilidade',
        itemType: 'potion',
        equipped: false,
        quantity: 1,
        weight: '0.2 kg',
        rarity: 'Muito Raro',
        potionProps: { effectDesc: 'Torna o usuário invisível por 1 hora.' },
      },
    ],
  },
  {
    id: 'ranger_hunter',
    name: 'Arqueiro Rastreador / Patrulheiro Selvagem',
    category: 'Combate Marcial',
    description: 'Armadura de couro maleável, arco longo de alta precisão e cimitarras para combate corpo a corpo.',
    icon: '🏹',
    items: [
      {
        name: 'Gibão de Peles / Couro (Leather)',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '5 kg',
        armorProps: { acBonus: 11, armorType: 'light' },
        notes: 'CA 11 + DES. Perfeito para mobilidade na floresta.',
      },
      {
        name: 'Arco Longo Élfico',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '1 kg',
        weaponProps: { damage: '1d8', damageType: 'Perfurante', atkBonus: 0 },
        notes: 'Distância 45/180m, pesado, duas mãos.',
      },
      {
        name: 'Flechas Élficas (30x)',
        itemType: 'equipment',
        equipped: false,
        quantity: 30,
        weight: '1 kg',
      },
      {
        name: 'Cimitarra de Aço',
        itemType: 'weapon',
        equipped: false,
        quantity: 2,
        weight: '3 kg',
        weaponProps: { damage: '1d6', damageType: 'Cortante', atkBonus: 0 },
        notes: 'Acuidade, leve.',
      },
      {
        name: 'Armadilha de Caça',
        itemType: 'equipment',
        equipped: false,
        quantity: 2,
        weight: '12 kg',
        notes: 'Prende criaturas que pisarem (Teste DES CD 13).',
      },
      {
        name: 'Poção de Cura',
        itemType: 'potion',
        equipped: false,
        quantity: 1,
        weight: '0.2 kg',
        potionProps: { healingDice: '2d4+2', effectDesc: 'Restaura 2d4+2 PV.' },
      },
    ],
  },
  {
    id: 'berserker_barbarian',
    name: 'Bárbaro Berserker / Chefe Guerreiro Tribal',
    category: 'Combate Marcial',
    description: 'Peles de fera, machado grande demolidor, machadinhas de arremesso e força bruta indomável.',
    icon: '🪓',
    items: [
      {
        name: 'Manto de Peles de Lobo Cinzento',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '4 kg',
        armorProps: { acBonus: 10, armorType: 'light' },
        notes: 'Defesa sem armadura ativa (10 + DES + CON).',
      },
      {
        name: 'Machado Grande de Batalha (Greataxe)',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '3.5 kg',
        weaponProps: { damage: '1d12', damageType: 'Cortante', atkBonus: 0 },
        notes: 'Pesado, duas mãos.',
      },
      {
        name: 'Machadinha de Arremesso',
        itemType: 'weapon',
        equipped: false,
        quantity: 2,
        weight: '2 kg',
        weaponProps: { damage: '1d6', damageType: 'Cortante', atkBonus: 0 },
        notes: 'Leve, arremesso (6/18m).',
      },
      {
        name: 'Poção de Fúria / Força de Gigante',
        itemType: 'potion',
        equipped: false,
        quantity: 1,
        weight: '0.2 kg',
        rarity: 'Raro',
        potionProps: { effectDesc: 'Concede Força 21 por 1 hora.' },
      },
    ],
  },
  {
    id: 'cleric_priest',
    name: 'Clérigo Templário / Sacerdote de Guerra',
    category: 'Conjuradores & Arcanos',
    description: 'Brúnea de anéis entrelaçados, maça pesada, escudo sagrado e bolsa medicinal para bênçãos divinas.',
    icon: '✨',
    items: [
      {
        name: 'Brúnea de Aço (Scale Mail)',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '20 kg',
        armorProps: { acBonus: 14, armorType: 'medium' },
        notes: 'CA 14 + DES (máx +2). Desvantagem em Furtividade.',
      },
      {
        name: 'Escudo Sagrado com Relíquia',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '3 kg',
        armorProps: { acBonus: 2, armorType: 'shield' },
        notes: '+2 na CA. Funciona como símbolo sagrado de conjuração.',
      },
      {
        name: 'Maça de Guerra Abençoada',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '2 kg',
        weaponProps: { damage: '1d6', damageType: 'Contundente', atkBonus: 0 },
        notes: 'Simples, uma mão.',
      },
      {
        name: 'Símbolo Sagrado de Prata',
        itemType: 'equipment',
        equipped: false,
        quantity: 1,
        weight: '0.5 kg',
      },
      {
        name: 'Kit de Primeiros Socorros (10 usos)',
        itemType: 'equipment',
        equipped: false,
        quantity: 1,
        weight: '1.5 kg',
        notes: 'Estabiliza criaturas à beira da morte sem teste de Sabedoria.',
      },
      {
        name: 'Poção de Cura',
        itemType: 'potion',
        equipped: false,
        quantity: 2,
        weight: '0.4 kg',
        potionProps: { healingDice: '2d4+2', effectDesc: 'Restaura 2d4+2 PV.' },
      },
    ],
  },
  {
    id: 'bandit_thug',
    name: 'Bandido / Salteador das Estradas',
    category: 'Furtividade & Submundo',
    description: 'Armadura rústica de couro, cimitarra afiada, besta de mão e corda de seda para emboscadas.',
    icon: '💰',
    items: [
      {
        name: 'Armadura de Couro Rústica (Leather)',
        itemType: 'armor',
        equipped: true,
        quantity: 1,
        weight: '5 kg',
        armorProps: { acBonus: 11, armorType: 'light' },
      },
      {
        name: 'Cimitarra de Aço Fosco',
        itemType: 'weapon',
        equipped: true,
        quantity: 1,
        weight: '1.5 kg',
        weaponProps: { damage: '1d6', damageType: 'Cortante', atkBonus: 0 },
        notes: 'Acuidade, leve.',
      },
      {
        name: 'Besta Leve',
        itemType: 'weapon',
        equipped: false,
        quantity: 1,
        weight: '2.5 kg',
        weaponProps: { damage: '1d8', damageType: 'Perfurante', atkBonus: 0 },
      },
      {
        name: 'Virotes (10x)',
        itemType: 'equipment',
        equipped: false,
        quantity: 10,
        weight: '0.4 kg',
      },
      {
        name: 'Corda de Cânhamo (15m)',
        itemType: 'equipment',
        equipped: false,
        quantity: 1,
        weight: '5 kg',
      },
      {
        name: 'Algemas de Ferro',
        itemType: 'equipment',
        equipped: false,
        quantity: 1,
        weight: '1 kg',
      },
    ],
  },
];

/**
 * Aplica um preset de equipamento a uma ficha de personagem (CharacterSheet).
 * Atualiza o inventário, ativa os itens equipados e recalcula todas as estatísticas derivadas (CA, Ataques, etc).
 */
export function applyNpcEquipmentPreset(
  sheet: CharacterSheet,
  presetId: string,
  replaceExisting: boolean = false
): CharacterSheet {
  const preset = NPC_EQUIPMENT_PRESETS.find((p) => p.id === presetId);
  if (!preset) return sheet;

  const currentEquipment: CharacterEquipmentItem[] = replaceExisting ? [] : [...(sheet.equipment || [])];

  // Gera novos itens com IDs únicos
  const newItems: CharacterEquipmentItem[] = preset.items.map((item) => ({
    id: generateUuid(),
    name: item.name,
    quantity: item.quantity,
    weight: item.weight,
    notes: item.notes,
    rarity: item.rarity,
    itemType: item.itemType,
    equipped: item.equipped ?? false,
    weaponProps: item.weaponProps ? { ...item.weaponProps } : undefined,
    armorProps: item.armorProps ? { ...item.armorProps } : undefined,
    potionProps: item.potionProps ? { ...item.potionProps } : undefined,
  }));

  // Se substituir, desmarca qualquer item antigo equipado
  if (!replaceExisting) {
    const hasNewArmor = newItems.some((i) => i.equipped && i.itemType === 'armor' && i.armorProps?.armorType !== 'shield');
    const hasNewShield = newItems.some((i) => i.equipped && i.armorProps?.armorType === 'shield');

    if (hasNewArmor) {
      currentEquipment.forEach((i) => {
        if (i.itemType === 'armor' && i.armorProps?.armorType !== 'shield') i.equipped = false;
      });
    }
    if (hasNewShield) {
      currentEquipment.forEach((i) => {
        if (i.armorProps?.armorType === 'shield') i.equipped = false;
      });
    }
  }

  const combinedEquipment = [...currentEquipment, ...newItems];

  // Gera os ataques a partir das armas equipadas
  const updatedAttacks: CharacterWeaponAttack[] = [...(sheet.attacks || [])];
  newItems.filter((i) => i.itemType === 'weapon').forEach((w) => {
    const existingAtk = updatedAttacks.find((a) => a.name.toLowerCase() === w.name.toLowerCase());
    if (!existingAtk) {
      updatedAttacks.push({
        id: generateUuid(),
        name: w.name,
        atkBonus: `+${(w.weaponProps?.atkBonus || 0) + 2}`, // Base + proficiência inicial
        damage: w.weaponProps?.damage || '1d6',
        type: w.weaponProps?.damageType || 'Cortante',
      });
    }
  });

  const updatedSheet: CharacterSheet = {
    ...sheet,
    equipment: combinedEquipment,
    attacks: updatedAttacks,
  };

  return recalculateSheetDerivedStats(updatedSheet);
}
