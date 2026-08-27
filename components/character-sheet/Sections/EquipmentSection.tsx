import React, { useState, useEffect } from 'react';
import { CharacterSheet, CharacterEquipmentItem, TransactionEntry, ReadableContent } from '@/lib/types';
import { Coins, Package, Plus, Trash2, Gem, Weight, Scale, Sparkles, ShoppingCart, Lock, Unlock, History, Dices, ArrowDownRight, Receipt, Check, Minus } from 'lucide-react';
import { ItemCompendiumModal } from '../Modals/ItemCompendiumModal';
import { toast } from 'sonner';
import { getEffectiveAttributeScore, recalculateSheetDerivedStats, WEAPON_TABLE } from '@/lib/dnd5e-calculator';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/context/CampaignContext';
import { isItemReadable, getOrCreateReadableContent } from '@/lib/utils/readableLoreUtils';
import { BG3ReadableModal } from '@/components/loot/BG3ReadableModal';

const QUICK_EXPENSES = [
  { label: '🛏️ Estalagem (5 PP)', name: 'Estalagem (Pernoite)', amount: 5, coinType: 'pp' as const },
  { label: '🏨 Estalagem Confortável (8 PP)', name: 'Estalagem Confortável', amount: 8, coinType: 'pp' as const },
  { label: '🍺 Cerveja / Hidromel (4 PC)', name: 'Caneca de Cerveja / Hidromel', amount: 4, coinType: 'pc' as const },
  { label: '🍲 Refeição (3 PC)', name: 'Refeição na Taverna', amount: 3, coinType: 'pc' as const },
  { label: '🥩 Ração de Viagem (5 PP)', name: 'Ração de Viagem (1 dia)', amount: 5, coinType: 'pp' as const },
  { label: '🐎 Montaria / Carroça (5 PP)', name: 'Aluguel de Montaria / Charrete', amount: 5, coinType: 'pp' as const },
  { label: '💰 Gorjeta / Suborno (1 PO)', name: 'Gorjeta / Suborno', amount: 1, coinType: 'po' as const },
  { label: '👑 Banquete Nobre (10 PO)', name: 'Banquete Nobre', amount: 10, coinType: 'po' as const },
];

interface EquipmentSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

const STARTING_WEALTH_FORMULAS: Record<string, { formula: string; count: number; sides: number; multiplier: number }> = {
  'artifice': { formula: '5d4 × 10 PO', count: 5, sides: 4, multiplier: 10 },
  'barbaro': { formula: '2d4 × 10 PO', count: 2, sides: 4, multiplier: 10 },
  'bardo': { formula: '5d4 × 10 PO', count: 5, sides: 4, multiplier: 10 },
  'bruxo': { formula: '4d4 × 10 PO', count: 4, sides: 4, multiplier: 10 },
  'clerigo': { formula: '5d4 × 10 PO', count: 5, sides: 4, multiplier: 10 },
  'druida': { formula: '2d4 × 10 PO', count: 2, sides: 4, multiplier: 10 },
  'feiticeiro': { formula: '3d4 × 10 PO', count: 3, sides: 4, multiplier: 10 },
  'guerreiro': { formula: '5d4 × 10 PO', count: 5, sides: 4, multiplier: 10 },
  'ladino': { formula: '4d4 × 10 PO', count: 4, sides: 4, multiplier: 10 },
  'mago': { formula: '4d4 × 10 PO', count: 4, sides: 4, multiplier: 10 },
  'monge': { formula: '5d4 PO', count: 5, sides: 4, multiplier: 1 },
  'paladino': { formula: '5d4 × 10 PO', count: 5, sides: 4, multiplier: 10 },
  'patrulheiro': { formula: '5d4 × 10 PO', count: 5, sides: 4, multiplier: 10 },
};

const normalizeClassName = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ sheet, onChange }) => {
  const { roleMode } = useAuth();
  const { createFeedEvent, activeCampaign } = useCampaign();

  const [isItemCompendiumOpen, setIsItemCompendiumOpen] = useState(false);
  const [readingItem, setReadingItem] = useState<{ title: string; readableContent: ReadableContent } | null>(null);
  
  // Starting Wealth State
  const [selectedClassRoll, setSelectedClassRoll] = useState<string>('');
  const [rollResult, setRollResult] = useState<{
    rolls: number[];
    sum: number;
    total: number;
    className: string;
  } | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Spend State
  const [spendAmount, setSpendAmount] = useState<number>(0);
  const [spendCoinType, setSpendCoinType] = useState<'po' | 'pp' | 'pc' | 'pe' | 'pl'>('po');
  const [spendReason, setSpendReason] = useState<string>('');
  const [isSpendingFormOpen, setIsSpendingFormOpen] = useState(false);

  const isLocked = roleMode !== 'dm' && sheet.startingWealthRolled;

  // Auto-select starting wealth based on sheet class name
  useEffect(() => {
    if (sheet.className) {
      const normalized = normalizeClassName(sheet.className);
      if (STARTING_WEALTH_FORMULAS[normalized]) {
        setSelectedClassRoll(normalized);
      } else {
        setSelectedClassRoll('custom');
      }
    }
  }, [sheet.className]);

  const items = sheet.equipment || [];

  const coins = sheet.currency || {
    po: 0,
    pp: 0,
    pc: 0,
    pe: 0,
    pl: 0,
  };

  const updateItems = (newItems: CharacterEquipmentItem[]) => {
    onChange(recalculateSheetDerivedStats({ ...sheet, equipment: newItems }));
  };

  const updateCoins = (newCoins: typeof coins) => {
    onChange({ ...sheet, currency: newCoins });
  };

  const handleRollStartingWealth = (classKey: string) => {
    setIsRolling(true);
    setTimeout(() => {
      const normalizedKey = classKey.toLowerCase();
      const config = STARTING_WEALTH_FORMULAS[normalizedKey] || { formula: '4d4 × 10 PO', count: 4, sides: 4, multiplier: 10 };
      
      const rolls: number[] = [];
      let sum = 0;
      for (let i = 0; i < config.count; i++) {
        const val = Math.floor(Math.random() * config.sides) + 1;
        rolls.push(val);
        sum += val;
      }
      const total = sum * config.multiplier;

      const currentCoins = sheet.currency || { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 };
      const newCoins = {
        ...currentCoins,
        po: currentCoins.po + total,
      };

      const displayName = Object.keys(STARTING_WEALTH_FORMULAS).find(k => k === normalizedKey)
        ? classKey.charAt(0).toUpperCase() + classKey.slice(1)
        : 'Outro';

      const initialTransaction: TransactionEntry = {
        id: Date.now().toString(),
        type: 'roll',
        amount: total,
        coinType: 'po',
        reason: `Riqueza Inicial Rolada (${config.formula})`,
        date: new Date().toLocaleString('pt-BR'),
      };

      onChange({
        ...sheet,
        currency: newCoins,
        startingWealthRolled: true,
        transactionHistory: [initialTransaction, ...(sheet.transactionHistory || [])],
      });

      setRollResult({
        rolls,
        sum,
        total,
        className: displayName,
      });
      setIsRolling(false);
      toast.success(`🎲 Você rolou Riqueza Inicial: ${total} PO!`);

      // Broadcast chat message to campaign feed if campaign exists
      if (sheet.campaignId || activeCampaign?.id) {
        try {
          if (createFeedEvent) {
            createFeedEvent({
              campaignId: sheet.campaignId || activeCampaign?.id || '',
              eventType: 'chat_message',
              title: 'Riqueza Inicial Rolada',
              summary: `🎲 ${sheet.characterName} rolou a riqueza inicial de ${displayName}: [${rolls.join(' + ')}] = ${sum}${config.multiplier > 1 ? ` × ${config.multiplier}` : ''} = ${total} PO!`,
              isPublic: true,
            });
          }
        } catch (e) {
          console.error('Erro ao enviar evento de feed para riqueza inicial:', e);
        }
      }
    }, 1000);
  };

  const handleSpendCoins = (e: React.FormEvent) => {
    e.preventDefault();
    if (spendAmount <= 0) {
      toast.error('Informe um valor válido para gastar.');
      return;
    }

    const trimmedReason = spendReason.trim() || 'Despesa / Pagamento';
    const currentCoins = sheet.currency || { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 };
    const available = currentCoins[spendCoinType] || 0;

    if (available < spendAmount) {
      toast.error(`Saldo insuficiente! Você possui ${available} ${spendCoinType.toUpperCase()} e a despesa é de ${spendAmount} ${spendCoinType.toUpperCase()}.`);
      return;
    }

    const newCoins = {
      ...currentCoins,
      [spendCoinType]: available - spendAmount,
    };

    const newTransaction: TransactionEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'spend',
      amount: spendAmount,
      coinType: spendCoinType,
      reason: trimmedReason,
      date: new Date().toLocaleString('pt-BR'),
    };

    onChange({
      ...sheet,
      currency: newCoins,
      transactionHistory: [newTransaction, ...(sheet.transactionHistory || [])],
    });

    toast.success(`💸 Pagamento realizado com sucesso: -${spendAmount} ${spendCoinType.toUpperCase()} ("${trimmedReason}")!`);
    
    if (sheet.campaignId || activeCampaign?.id) {
      try {
        if (createFeedEvent) {
          createFeedEvent({
            campaignId: sheet.campaignId || activeCampaign?.id || '',
            eventType: 'chat_message',
            title: 'Pagamento de Despesa',
            summary: `💸 ${sheet.characterName} pagou ${spendAmount} ${spendCoinType.toUpperCase()} com: "${trimmedReason}".`,
            isPublic: true,
          });
        }
      } catch (e) {
        console.error('Erro ao enviar evento de feed para gasto de moedas:', e);
      }
    }

    setSpendAmount(0);
    setSpendReason('');
    setIsSpendingFormOpen(false);
  };

  const handleUsePotion = (item: CharacterEquipmentItem) => {
    if (item.quantity <= 0) return;

    // Determine healing dice
    let healingDice = item.potionProps?.healingDice || '2d4+2';
    const nameLower = item.name.toLowerCase();
    
    // Fallback parsing if potionProps is empty
    if (!item.potionProps?.healingDice) {
      if (nameLower.includes('maior')) {
        healingDice = '4d4+4';
      } else if (nameLower.includes('superior')) {
        healingDice = '8d4+8';
      } else if (nameLower.includes('suprema')) {
        healingDice = '10d4+20';
      }
    }

    // Roll dice
    const match = healingDice.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    let total = 0;
    const rolls: number[] = [];
    let modifier = 0;
    if (match) {
      const count = parseInt(match[1]);
      const sides = parseInt(match[2]);
      modifier = parseInt(match[3] || '0');
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
      total = rolls.reduce((a, b) => a + b, 0) + modifier;
    } else {
      total = 6; // average fallback
    }

    const currentHp = sheet.currentHp || 0;
    const maxHp = sheet.maxHp || 10;
    const newHp = Math.min(maxHp, currentHp + total);
    const healedAmount = newHp - currentHp;

    // Update inventory
    let updatedEquipment = items;
    if (item.quantity <= 1) {
      updatedEquipment = items.filter((i) => i.id !== item.id);
    } else {
      updatedEquipment = items.map((i) =>
        i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
      );
    }

    onChange({
      ...sheet,
      currentHp: newHp,
      equipment: updatedEquipment,
    });

    toast.success(
      `🧪 Você bebeu "${item.name}"! Recuperou ${healedAmount} PV. Rolagem: ${rolls.join('+')}${modifier ? `+${modifier}` : ''} = ${total} PV.`,
      { duration: 5000 }
    );
  };

  // CÁLCULO DA CAPACIDADE DE CARGA (D&D 5e convertido para kg: FORÇA * 7.5 kg)
  const strScore = getEffectiveAttributeScore(sheet, 'str');
  const maxCarryingCapacity = strScore * 7.5;

  const totalWeight = items.reduce((sum, item) => {
    const raw = (item.weight || '0').replace(/[^0-9.]/g, '');
    const num = parseFloat(raw) || 0;
    return sum + num * (item.quantity || 1);
  }, 0);

  const isEncumbered = totalWeight > maxCarryingCapacity;

  const handleAddEquipment = () => {
    const newItem: CharacterEquipmentItem = {
      id: Date.now().toString(),
      name: 'Novo Item',
      quantity: 1,
      weight: '0.5 kg',
      notes: '',
    };
    updateItems([...items, newItem]);
  };

  const handleRemoveEquipment = (id: string) => {
    updateItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateEquipment = (id: string, updated: Partial<CharacterEquipmentItem>) => {
    updateItems(items.map((i) => (i.id === id ? { ...i, ...updated } : i)));
  };

  const handleToggleEquip = (item: CharacterEquipmentItem) => {
    const isEquipped = !item.equipped;
    let updatedItems = [...items];

    if (isEquipped) {
      const isWeapon = weapons.some(w => w.id === item.id);
      const isShield = item.name.toLowerCase().includes('escudo') || item.name.toLowerCase().includes('shield') || item.armorProps?.armorType === 'shield';
      const isArmor = !isShield && (armors.some(a => a.id === item.id) || item.itemType === 'armor');

      if (isArmor) {
        // Desequipa qualquer outra armadura (exceto escudo)
        updatedItems = updatedItems.map(i => {
          const isOtherArmor = i.id !== item.id && (i.itemType === 'armor' || armors.some(a => a.id === i.id)) && !i.name.toLowerCase().includes('escudo') && !i.name.toLowerCase().includes('shield') && i.armorProps?.armorType !== 'shield';
          if (isOtherArmor) {
            return { ...i, equipped: false };
          }
          return i;
        });
      } else if (isShield) {
        // Desequipa qualquer outro escudo
        updatedItems = updatedItems.map(i => {
          const isOtherShield = i.id !== item.id && (i.name.toLowerCase().includes('escudo') || i.name.toLowerCase().includes('shield') || i.armorProps?.armorType === 'shield');
          if (isOtherShield) {
            return { ...i, equipped: false };
          }
          return i;
        });
        // Desequipa armas de duas mãos
        updatedItems = updatedItems.map(i => {
          const isTwoHandedWeapon = i.itemType === 'weapon' && (WEAPON_TABLE[i.name]?.properties?.some(p => p.toLowerCase().includes('duas mãos') || p.toLowerCase().includes('two-handed')));
          if (isTwoHandedWeapon) {
            return { ...i, equipped: false };
          }
          return i;
        });
      } else if (isWeapon) {
        const isTwoHanded = WEAPON_TABLE[item.name]?.properties?.some(p => p.toLowerCase().includes('duas mãos') || p.toLowerCase().includes('two-handed'));
        
        if (isTwoHanded) {
          // Desequipa todas as outras armas e escudos
          updatedItems = updatedItems.map(i => {
            const isOtherWeaponOrShield = i.id !== item.id && (
              i.itemType === 'weapon' || 
              weapons.some(w => w.id === i.id) ||
              i.name.toLowerCase().includes('escudo') || 
              i.name.toLowerCase().includes('shield') || 
              i.armorProps?.armorType === 'shield'
            );
            if (isOtherWeaponOrShield) {
              return { ...i, equipped: false };
            }
            return i;
          });
        } else {
          // Arma de uma mão: desequipa armas de duas mãos
          updatedItems = updatedItems.map(i => {
            const isTwoHandedWeapon = WEAPON_TABLE[i.name]?.properties?.some(p => p.toLowerCase().includes('duas mãos') || p.toLowerCase().includes('two-handed'));
            if (isTwoHandedWeapon) {
              return { ...i, equipped: false };
            }
            return i;
          });

          const currentlyEquippedWeapons = updatedItems.filter(i => i.id !== item.id && i.equipped && (i.itemType === 'weapon' || weapons.some(w => w.id === i.id)));
          const isShieldEquipped = updatedItems.some(i => i.equipped && (i.name.toLowerCase().includes('escudo') || i.name.toLowerCase().includes('shield') || i.armorProps?.armorType === 'shield'));

          if (isShieldEquipped) {
            // Com escudo, só pode 1 arma de uma mão
            updatedItems = updatedItems.map(i => {
              if (i.id !== item.id && i.equipped && (i.itemType === 'weapon' || weapons.some(w => w.id === i.id))) {
                return { ...i, equipped: false };
              }
              return i;
            });
          } else {
            // Sem escudo, máximo de 2 armas
            if (currentlyEquippedWeapons.length >= 2) {
              const oldestEquippedWeapon = currentlyEquippedWeapons[0];
              updatedItems = updatedItems.map(i => {
                if (i.id === oldestEquippedWeapon.id) {
                  return { ...i, equipped: false };
                }
                return i;
              });
            }
          }
        }
      }
    }

    // Toggle o item alvo
    updatedItems = updatedItems.map(i => 
      i.id === item.id ? { ...i, equipped: isEquipped } : i
    );

    onChange(recalculateSheetDerivedStats({
      ...sheet,
      equipment: updatedItems
    }));
  };

  const nameMatch = (item: CharacterEquipmentItem, keywords: string[]) => {
    const nameLower = item.name.toLowerCase();
    const typeLower = (item.itemType || '').toLowerCase();
    return keywords.some(kw => nameLower.includes(kw) || typeLower.includes(kw));
  };

  const weapons = items.filter(item => 
    item.itemType === 'weapon' || 
    nameMatch(item, ['espada', 'arco', 'besta', 'adaga', 'machado', 'lança', 'lanca', 'martelo', 'dardo', 'clava', 'porrete', 'alabarda', 'cimitarra', 'rapieira', 'rapiêra', 'tridente', 'folha', 'weapon'])
  );

  const armors = items.filter(item => 
    !weapons.includes(item) && (
      item.itemType === 'armor' || 
      nameMatch(item, ['armadura', 'cota', 'gibão', 'gibao', 'escudo', 'shield', 'elmo', 'manto', 'placas', 'couro', 'malha', 'armor'])
    )
  );

  const consumables = items.filter(item => 
    !weapons.includes(item) && 
    !armors.includes(item) && (
      item.itemType === 'potion' || 
      item.itemType === 'scroll' || 
      nameMatch(item, ['poção', 'pocao', 'potion', 'pergaminho', 'scroll', 'ração', 'racao', 'ration', 'tocha', 'torch', 'bálsamo', 'balsamo', 'elixir', 'antídoto', 'antidoto', 'frasco', 'vial'])
    )
  );

  const others = items.filter(item => 
    !weapons.includes(item) && 
    !armors.includes(item) && 
    !consumables.includes(item)
  );

  const renderItemRow = (item: CharacterEquipmentItem, index: number = 0) => (
    <div
      key={`${item.id || 'item'}-${index}`}
      className="bg-[#0b0f19]/60 border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between gap-1.5">
        <input
          type="text"
          value={item.name}
          onChange={(e) => handleUpdateEquipment(item.id, { name: e.target.value })}
          placeholder="Nome do Item"
          className="flex-1 bg-transparent border-none text-xs text-white font-bold font-serif focus:outline-none focus:ring-0 truncate p-0"
        />
        <button
          type="button"
          onClick={() => handleRemoveEquipment(item.id)}
          className="text-slate-500 hover:text-rose-450 p-0.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/50 rounded px-1.5 py-0.5 flex-1">
          <span className="text-[8px] text-slate-500 uppercase">Qtd</span>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) =>
              handleUpdateEquipment(item.id, { quantity: parseInt(e.target.value, 10) || 1 })
            }
            className="w-full bg-transparent border-none text-[10px] text-amber-400 font-mono text-center font-bold focus:outline-none focus:ring-0 p-0"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/50 rounded px-1.5 py-0.5 flex-1">
          <span className="text-[8px] text-slate-500 uppercase font-serif">Kg</span>
          <input
            type="text"
            value={item.weight || ''}
            onChange={(e) => handleUpdateEquipment(item.id, { weight: e.target.value })}
            placeholder="0.5 kg"
            className="w-full bg-transparent border-none text-[10px] text-slate-400 text-center focus:outline-none focus:ring-0 p-0"
          />
        </div>
        {(weapons.some(w => w.id === item.id) || armors.some(a => a.id === item.id) || item.itemType === 'weapon' || item.itemType === 'armor') && (
          <button
            type="button"
            onClick={() => handleToggleEquip(item)}
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider h-[20px] shrink-0 border transition-all cursor-pointer ${
              item.equipped
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-450 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/50'
            }`}
            title={item.equipped ? 'Desequipar item' : 'Equipar item'}
          >
            {item.equipped ? 'Equipado' : 'Equipar'}
          </button>
        )}
        {isItemReadable(item) && (
          <button
            type="button"
            onClick={() => {
              const lore = getOrCreateReadableContent({
                name: item.name,
                notes: item.notes,
                readableContent: item.readableContent,
              });
              setReadingItem({ title: item.name, readableContent: lore });
            }}
            className="px-2 py-0.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/50 rounded text-[8px] font-black uppercase tracking-wider h-[20px] shrink-0 cursor-pointer flex items-center gap-1 transition-all"
            title={`Ler ${item.name}`}
          >
            📖 Ler
          </button>
        )}
        {(item.itemType === 'potion' || item.name.toLowerCase().includes('poção') || item.name.toLowerCase().includes('potion')) && (
          <button
            type="button"
            onClick={() => handleUsePotion(item)}
            className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 hover:text-emerald-300 rounded border border-emerald-500/30 transition-colors text-[8px] font-black uppercase tracking-wider h-[20px] shrink-0 cursor-pointer"
            title={`Beber ${item.name}`}
          >
            Beber
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-in select-none lg:grid lg:grid-cols-4 lg:gap-3 lg:h-full lg:overflow-hidden lg:min-h-0">
      {/* ITEM COMPENDIUM MODAL */}
      <ItemCompendiumModal
        sheet={sheet}
        isOpen={isItemCompendiumOpen}
        onClose={() => setIsItemCompendiumOpen(false)}
        onChange={onChange}
      />

      {/* BARRA DE AÇÕES DO INVENTÁRIO (Top toolbar spanning 4 columns on desktop) */}
      <div className="bg3-panel rounded-2xl p-3 flex items-center justify-between gap-3 lg:col-span-4 shrink-0 lg:flex-row flex-col">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">Gerenciamento de Mochila</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsItemCompendiumOpen(true)}
            className="flex items-center gap-1.5 text-[10px] font-black bg-amber-500 text-slate-950 px-3 py-1.5 rounded-xl shadow-md hover:bg-amber-400 active:scale-95 transition-all cursor-pointer uppercase tracking-wider font-serif"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Loja do Compêndio
          </button>
          <button
            type="button"
            onClick={handleAddEquipment}
            className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 transition-all active:scale-95 cursor-pointer uppercase tracking-wider font-serif"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Item Manual
          </button>
        </div>
      </div>

      {/* COLUNA 1: ARMAS */}
      <div className="bg3-panel rounded-2xl p-3 flex flex-col lg:h-full lg:min-h-0 h-[300px]">
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/15 pb-1.5 mb-2 block font-serif">
          ⚔️ Armas & Lâminas ({weapons.length})
        </span>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg3-scrollbar">
          {weapons.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-8 font-serif">Nenhuma arma equipada.</p>
          ) : (
            weapons.map(renderItemRow)
          )}
        </div>
      </div>

      {/* COLUNA 2: ARMADURAS & PROTEÇÃO */}
      <div className="bg3-panel rounded-2xl p-3 flex flex-col lg:h-full lg:min-h-0 h-[300px]">
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/15 pb-1.5 mb-2 block font-serif">
          🛡️ Armaduras & Proteção ({armors.length})
        </span>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg3-scrollbar">
          {armors.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-8 font-serif">Nenhuma armadura na mochila.</p>
          ) : (
            armors.map(renderItemRow)
          )}
        </div>
      </div>

      {/* COLUNA 3: CONSUMÍVEIS & POÇÕES */}
      <div className="bg3-panel rounded-2xl p-3 flex flex-col lg:h-full lg:min-h-0 h-[300px]">
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/15 pb-1.5 mb-2 block font-serif">
          🧪 Consumíveis & Elixires ({consumables.length})
        </span>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg3-scrollbar">
          {consumables.length === 0 ? (
            <p className="text-[10px] text-slate-500 text-center py-8 font-serif">Nenhum consumível.</p>
          ) : (
            consumables.map(renderItemRow)
          )}
        </div>
      </div>

      {/* COLUNA 4: OUTROS ITENS, MOEDAS E GEMAS */}
      <div className="space-y-3 lg:overflow-y-auto lg:h-full lg:pr-2 bg3-scrollbar lg:pb-6">
        
        {/* CARTEIRA / MOEDAS */}
        <div className="bg3-panel rounded-2xl p-3 space-y-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between font-serif border-b border-amber-500/15 pb-1">
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Bolsa de Moedas
            </span>
            {sheet.startingWealthRolled ? (
              <span className="flex items-center gap-1 text-[8px] text-slate-500 normal-case font-mono font-normal">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                Protegida
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[8px] text-amber-600/80 normal-case font-mono font-normal">
                <Unlock className="w-2.5 h-2.5 text-amber-600/80" />
                Ajustável
              </span>
            )}
          </span>

          <div className="grid grid-cols-5 gap-1 text-center">
            {/* PC */}
            <div className={`bg-[#0b0f19] border rounded-lg p-1 transition-colors ${isLocked ? 'border-slate-800/40 opacity-70' : 'border-amber-800/40'}`}>
              <span className="text-[8px] font-black text-amber-700 uppercase block font-mono">PC</span>
              <input
                type="number"
                min={0}
                value={coins.pc}
                disabled={isLocked}
                onChange={(e) => updateCoins({ ...coins, pc: parseInt(e.target.value, 10) || 0 })}
                className={`w-full bg-slate-900 border rounded py-0.5 text-center text-[10px] font-bold focus:outline-none p-0 ${
                  isLocked 
                    ? 'border-transparent text-slate-400 cursor-not-allowed' 
                    : 'border-slate-800 text-amber-600'
                }`}
              />
            </div>
            {/* PP */}
            <div className={`bg-[#0b0f19] border rounded-lg p-1 transition-colors ${isLocked ? 'border-slate-800/40 opacity-70' : 'border-slate-700/40'}`}>
              <span className="text-[8px] font-black text-slate-400 uppercase block font-mono">PP</span>
              <input
                type="number"
                min={0}
                value={coins.pp}
                disabled={isLocked}
                onChange={(e) => updateCoins({ ...coins, pp: parseInt(e.target.value, 10) || 0 })}
                className={`w-full bg-slate-900 border rounded py-0.5 text-center text-[10px] font-bold focus:outline-none p-0 ${
                  isLocked 
                    ? 'border-transparent text-slate-400 cursor-not-allowed' 
                    : 'border-slate-800 text-slate-350'
                }`}
              />
            </div>
            {/* PE */}
            <div className={`bg-[#0b0f19] border rounded-lg p-1 transition-colors ${isLocked ? 'border-slate-800/40 opacity-70' : 'border-emerald-700/40'}`}>
              <span className="text-[8px] font-black text-emerald-500 uppercase block font-mono">PE</span>
              <input
                type="number"
                min={0}
                value={coins.pe}
                disabled={isLocked}
                onChange={(e) => updateCoins({ ...coins, pe: parseInt(e.target.value, 10) || 0 })}
                className={`w-full bg-slate-900 border rounded py-0.5 text-center text-[10px] font-bold focus:outline-none p-0 ${
                  isLocked 
                    ? 'border-transparent text-slate-400 cursor-not-allowed' 
                    : 'border-slate-800 text-emerald-400'
                }`}
              />
            </div>
            {/* PO */}
            <div className={`bg-[#0b0f19] border rounded-lg p-1 transition-colors ${isLocked ? 'border-slate-800/40 opacity-70' : 'border-amber-500/40'}`}>
              <span className="text-[8px] font-black text-amber-400 uppercase block font-mono">PO</span>
              <input
                type="number"
                min={0}
                value={coins.po}
                disabled={isLocked}
                onChange={(e) => updateCoins({ ...coins, po: parseInt(e.target.value, 10) || 0 })}
                className={`w-full bg-slate-900 border rounded py-0.5 text-center text-[11px] font-black focus:outline-none p-0 ${
                  isLocked 
                    ? 'border-transparent text-slate-450 cursor-not-allowed' 
                    : 'border-slate-850 text-amber-400'
                }`}
              />
            </div>
            {/* PL */}
            <div className={`bg-[#0b0f19] border rounded-lg p-1 transition-colors ${isLocked ? 'border-slate-800/40 opacity-70' : 'border-cyan-500/40'}`}>
              <span className="text-[8px] font-black text-cyan-400 uppercase block font-mono">PL</span>
              <input
                type="number"
                min={0}
                value={coins.pl}
                disabled={isLocked}
                onChange={(e) => updateCoins({ ...coins, pl: parseInt(e.target.value, 10) || 0 })}
                className={`w-full bg-slate-900 border rounded py-0.5 text-center text-[10px] font-bold focus:outline-none p-0 ${
                  isLocked 
                    ? 'border-transparent text-slate-400 cursor-not-allowed' 
                    : 'border-slate-800 text-cyan-300'
                }`}
              />
            </div>
          </div>

          {/* Riqueza Inicial do Livro do Jogador */}
          {!sheet.startingWealthRolled && (
            <div className="bg-[#05070a]/90 border border-amber-500/20 rounded-xl p-2.5 mt-2.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Dices className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                <span className="font-serif font-bold text-[10px] tracking-wide uppercase">Riqueza Inicial</span>
              </div>
              <p className="text-slate-400 text-[8.5px] leading-normal font-serif">
                Selecione sua classe para rolar sua riqueza inicial como no Livro do Jogador e travar sua bolsa.
              </p>
              <div className="grid grid-cols-3 gap-1">
                <select
                  value={selectedClassRoll}
                  onChange={(e) => setSelectedClassRoll(e.target.value)}
                  className="col-span-2 bg-[#0b0f19] border border-amber-900/30 rounded px-1.5 py-1 text-[9px] text-amber-200 focus:outline-none leading-none"
                >
                  <option value="">-- Escolher Classe --</option>
                  {Object.entries(STARTING_WEALTH_FORMULAS).map(([key, value]) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)} ({value.formula})
                    </option>
                  ))}
                  <option value="custom">Outra (4d4 × 10 PO)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRollStartingWealth(selectedClassRoll || normalizeClassName(sheet.className))}
                  disabled={isRolling}
                  className="bg-amber-600 hover:bg-amber-505 disabled:bg-slate-850 disabled:text-slate-500 text-slate-950 font-bold font-serif py-1 rounded text-[9px] transition-all flex items-center justify-center gap-1 border border-amber-400/20 active:scale-95 cursor-pointer uppercase"
                >
                  {isRolling ? 'Rolando' : 'Rolar'}
                </button>
              </div>
              {rollResult && (
                <div className="bg-[#05070a]/90 border border-emerald-500/20 rounded-lg p-1.5 text-center text-[9px] animate-fadeIn">
                  <span className="text-slate-350 block font-mono text-[8px]">
                    Resultado: [{rollResult.rolls.join(' + ')}] = {rollResult.sum}
                  </span>
                  <span className="font-black text-emerald-400 font-serif block text-[10px]">
                    + {rollResult.total} PO ({rollResult.className})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Opção de Registrar Pagamento / Despesa */}
          <div className="border-t border-amber-500/15 pt-2.5 mt-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-slate-400 font-mono">
                {roleMode === 'dm' ? '🔓 Acesso de Mestre' : '💰 Gestão Financeira'}
              </span>
              <button
                type="button"
                onClick={() => setIsSpendingFormOpen(!isSpendingFormOpen)}
                className="text-[9.5px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all uppercase font-serif active:scale-95 shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                {isSpendingFormOpen ? 'Fechar Pagamento' : '💸 Efetuar Pagamento'}
              </button>
            </div>

            {isSpendingFormOpen && (
              <form onSubmit={handleSpendCoins} className="bg-[#05070a] border border-amber-500/30 rounded-xl p-3 space-y-3 animate-slideDown shadow-xl">
                {/* Sugestões Rápidas de Despesas D&D 5e */}
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    Sugestões Rápidas (D&D 5e):
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_EXPENSES.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSpendReason(q.name);
                          setSpendAmount(q.amount);
                          setSpendCoinType(q.coinType);
                        }}
                        className="text-[8px] font-medium bg-[#0b0f19] hover:bg-amber-950/50 text-slate-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 px-2 py-0.5 rounded transition-all cursor-pointer"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nome da Despesa */}
                <div>
                  <label className="text-[8px] font-bold text-slate-400 block mb-0.5 font-mono">
                    Nome da Despesa / Estalagem / Serviço:
                  </label>
                  <input
                    type="text"
                    required
                    value={spendReason}
                    onChange={(e) => setSpendReason(e.target.value)}
                    placeholder="Ex: Pernoite na Estalagem do Dragão Verde, 3 Canecas de Cerveja..."
                    className="w-full bg-[#0b0f19] border border-slate-700/80 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-[9.5px] text-slate-100 placeholder:text-slate-600 focus:outline-none font-serif transition-colors"
                  />
                </div>

                {/* Valor e Moeda */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-[8px] font-bold text-slate-400 font-mono">Valor:</label>
                      <div className="flex items-center gap-1">
                        {[1, 5, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSpendAmount((prev) => (prev || 0) + num)}
                            className="text-[7.5px] font-bold bg-[#121826] hover:bg-amber-950/60 text-amber-300 border border-amber-500/20 px-1 py-0.2 rounded"
                          >
                            +{num}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      required
                      value={spendAmount || ''}
                      onChange={(e) => setSpendAmount(parseInt(e.target.value, 10) || 0)}
                      placeholder="Qtd"
                      className="w-full bg-[#0b0f19] border border-slate-700/80 focus:border-amber-500 rounded-lg px-2 py-1 text-center text-[11px] font-bold text-amber-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-slate-400 block mb-0.5 font-mono">
                      Moeda (Saldo: {coins[spendCoinType]}):
                    </label>
                    <select
                      value={spendCoinType}
                      onChange={(e) => setSpendCoinType(e.target.value as any)}
                      className="w-full bg-[#0b0f19] border border-slate-700/80 focus:border-amber-500 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-100 focus:outline-none"
                    >
                      <option value="po">PO - Ouro (Saldo: {coins.po})</option>
                      <option value="pp">PP - Prata (Saldo: {coins.pp})</option>
                      <option value="pc">PC - Cobre (Saldo: {coins.pc})</option>
                      <option value="pe">PE - Electrum (Saldo: {coins.pe})</option>
                      <option value="pl">PL - Platina (Saldo: {coins.pl})</option>
                    </select>
                  </div>
                </div>

                {/* Aviso se saldo for insuficiente */}
                {spendAmount > 0 && coins[spendCoinType] < spendAmount && (
                  <p className="text-[8.5px] font-bold text-rose-400 bg-rose-950/30 border border-rose-800/30 p-1.5 rounded-lg flex items-center gap-1">
                    ⚠️ Saldo insuficiente em {spendCoinType.toUpperCase()} (Você possui {coins[spendCoinType]}, faltam {spendAmount - coins[spendCoinType]}).
                  </p>
                )}

                {/* Botão de Confirmação */}
                <button
                  type="submit"
                  disabled={spendAmount <= 0 || coins[spendCoinType] < spendAmount || !spendReason.trim()}
                  className="w-full bg-gradient-to-r from-rose-900 to-rose-950 hover:from-rose-800 hover:to-rose-900 disabled:opacity-50 disabled:cursor-not-allowed text-rose-200 border border-rose-700/50 font-bold font-serif py-1.5 rounded-lg text-[9.5px] transition-all cursor-pointer uppercase active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  Efetuar Pagamento de {spendAmount || 0} {spendCoinType.toUpperCase()}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* LOG DE TRANSAÇÕES (SEMPRE ACESSÍVEL QUANDO HOUVER TRANSAÇÕES) */}
        {sheet.transactionHistory && sheet.transactionHistory.length > 0 && (
          <div className="bg3-panel rounded-2xl p-3 space-y-1.5 shadow-lg border border-amber-500/20">
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
                <History className="w-3.5 h-3.5 text-amber-400" />
                Histórico de Moedas ({sheet.transactionHistory.length})
              </span>
            </div>
            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 bg3-scrollbar text-[9px] font-mono leading-tight">
              {sheet.transactionHistory.map((t) => (
                <div key={t.id} className="flex justify-between items-start border-b border-slate-850/60 pb-1.5 last:border-0 hover:bg-slate-900/40 p-1 rounded transition-colors">
                  <div className="space-y-0.5 max-w-[75%]">
                    <span className="text-slate-200 block font-serif leading-none truncate" title={t.reason}>
                      {t.reason}
                    </span>
                    <span className="text-slate-500 text-[8px] block">{t.date}</span>
                  </div>
                  <span className={`font-black whitespace-nowrap text-[10px] ${
                    t.type === 'spend' ? 'text-rose-400' : t.type === 'loot' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {t.type === 'spend' ? '-' : '+'}{t.amount} {t.coinType.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAINEL DE CARGA TOTAL */}
        <div className="bg3-panel rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold uppercase text-amber-400 font-serif">Carga Total</span>
            </div>
            <span className={`text-[11px] font-black font-mono ${isEncumbered ? 'text-rose-450 text-gold-glow' : 'text-emerald-400'}`}>
              {totalWeight.toFixed(1)} / {maxCarryingCapacity} kg
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                isEncumbered ? 'bg-rose-500 shadow-rose-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
              }`}
              style={{ width: `${Math.min(100, (totalWeight / maxCarryingCapacity) * 100)}%` }}
            />
          </div>
          {isEncumbered && (
            <p className="text-[8px] font-bold text-rose-400">
              ⚠️ Sobrecarrregado! Penalidades aplicadas.
            </p>
          )}
        </div>

        {/* TESOUROS E BENS VALIOSOS */}
        <div className="bg3-panel rounded-2xl p-3 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/15 pb-1">
            <Gem className="w-3.5 h-3.5 text-amber-400" />
            Tesouros & Relíquias
          </span>
          <textarea
            rows={2}
            value={sheet.treasure || ''}
            onChange={(e) => onChange({ ...sheet, treasure: e.target.value })}
            placeholder="Joias de rubi, estátua de jade, pergaminho antigo..."
            className="w-full bg-[#0b0f19]/80 border border-slate-700/60 rounded-xl p-2.5 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-serif"
          />
        </div>

        {/* OUTROS EQUIPAMENTOS */}
        <div className="bg3-panel rounded-2xl p-3 flex flex-col h-[220px]">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/15 pb-1 mb-2 block font-serif">
            🎒 Outros Itens ({others.length})
          </span>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg3-scrollbar">
            {others.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-8 font-serif">Nenhum outro item.</p>
            ) : (
              others.map(renderItemRow)
            )}
          </div>
        </div>

      </div>

      {/* BG3 Readable Item Modal */}
      {readingItem && (
        <BG3ReadableModal
          isOpen={Boolean(readingItem)}
          onClose={() => setReadingItem(null)}
          title={readingItem.title}
          readableContent={readingItem.readableContent}
        />
      )}
    </div>
  );
};
