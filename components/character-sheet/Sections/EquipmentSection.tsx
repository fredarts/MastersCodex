import React, { useState } from 'react';
import { CharacterSheet, CharacterEquipmentItem } from '@/lib/types';
import { Coins, Package, Plus, Trash2, Gem, Weight, Scale, Sparkles, ShoppingCart } from 'lucide-react';
import { ItemCompendiumModal } from '../Modals/ItemCompendiumModal';
import { toast } from 'sonner';
import { getEffectiveAttributeScore } from '@/lib/dnd5e-calculator';

interface EquipmentSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ sheet, onChange }) => {
  const [isItemCompendiumOpen, setIsItemCompendiumOpen] = useState(false);
  const items = sheet.equipment || [];

  const coins = sheet.currency || {
    po: 0,
    pp: 0,
    pc: 0,
    pe: 0,
    pl: 0,
  };

  const updateItems = (newItems: CharacterEquipmentItem[]) => {
    onChange({ ...sheet, equipment: newItems });
  };

  const updateCoins = (newCoins: typeof coins) => {
    onChange({ ...sheet, currency: newCoins });
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

  const renderItemRow = (item: CharacterEquipmentItem) => (
    <div
      key={item.id}
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
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/15 pb-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            Bolsa de Moedas
          </span>

          <div className="grid grid-cols-5 gap-1 text-center">
            {/* PC */}
            <div className="bg-[#0b0f19] border border-amber-800/40 rounded-lg p-1">
              <span className="text-[8px] font-black text-amber-700 uppercase block font-mono">PC</span>
              <input
                type="number"
                min={0}
                value={coins.pc}
                onChange={(e) => updateCoins({ ...coins, pc: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-[10px] font-bold text-amber-600 focus:outline-none p-0"
              />
            </div>
            {/* PP */}
            <div className="bg-[#0b0f19] border border-slate-700/40 rounded-lg p-1">
              <span className="text-[8px] font-black text-slate-400 uppercase block font-mono">PP</span>
              <input
                type="number"
                min={0}
                value={coins.pp}
                onChange={(e) => updateCoins({ ...coins, pp: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-[10px] font-bold text-slate-350 focus:outline-none p-0"
              />
            </div>
            {/* PE */}
            <div className="bg-[#0b0f19] border border-emerald-700/40 rounded-lg p-1">
              <span className="text-[8px] font-black text-emerald-500 uppercase block font-mono">PE</span>
              <input
                type="number"
                min={0}
                value={coins.pe}
                onChange={(e) => updateCoins({ ...coins, pe: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-[10px] font-bold text-emerald-400 focus:outline-none p-0"
              />
            </div>
            {/* PO */}
            <div className="bg-[#0b0f19] border border-amber-500/40 rounded-lg p-1">
              <span className="text-[8px] font-black text-amber-400 uppercase block font-mono">PO</span>
              <input
                type="number"
                min={0}
                value={coins.po}
                onChange={(e) => updateCoins({ ...coins, po: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-850 rounded py-0.5 text-center text-[11px] font-black text-amber-400 focus:outline-none p-0"
              />
            </div>
            {/* PL */}
            <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-lg p-1">
              <span className="text-[8px] font-black text-cyan-400 uppercase block font-mono">PL</span>
              <input
                type="number"
                min={0}
                value={coins.pl}
                onChange={(e) => updateCoins({ ...coins, pl: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-slate-900 border border-slate-800 rounded py-0.5 text-center text-[10px] font-bold text-cyan-300 focus:outline-none p-0"
              />
            </div>
          </div>
        </div>

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
    </div>
  );
};
