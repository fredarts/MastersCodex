import React, { useState } from 'react';
import { CharacterSheet, CharacterEquipmentItem } from '@/lib/types';
import { Coins, Package, Plus, Trash2, Gem, Weight, Scale, Sparkles } from 'lucide-react';
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
    let rolls: number[] = [];
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

  // CÁLCULO DA CAPACIDADE DE CARGA (D&D 5e: FORÇA * 15 lb)
  const strScore = getEffectiveAttributeScore(sheet, 'str');
  const maxCarryingCapacity = strScore * 15;

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
      weight: '1 lb',
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

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* ITEM COMPENDIUM MODAL */}
      <ItemCompendiumModal
        sheet={sheet}
        isOpen={isItemCompendiumOpen}
        onClose={() => setIsItemCompendiumOpen(false)}
        onAddItem={(newItem) => {
          updateItems([...items, newItem]);
        }}
      />

      {/* CARTEIRA / MOEDAS */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          Bolsa de Moedas
        </h3>

        <div className="grid grid-cols-5 gap-2 text-center">
          {/* PC */}
          <div className="bg-[#0b0f19] border border-amber-800/40 rounded-xl p-2 space-y-1">
            <span className="text-[10px] font-black text-amber-700 uppercase block">PC</span>
            <input
              type="number"
              min={0}
              value={coins.pc}
              onChange={(e) => updateCoins({ ...coins, pc: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 text-center text-xs font-bold text-amber-600 focus:outline-none"
            />
          </div>

          {/* PP */}
          <div className="bg-[#0b0f19] border border-slate-600/40 rounded-xl p-2 space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase block">PP</span>
            <input
              type="number"
              min={0}
              value={coins.pp}
              onChange={(e) => updateCoins({ ...coins, pp: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 text-center text-xs font-bold text-slate-300 focus:outline-none"
            />
          </div>

          {/* PE */}
          <div className="bg-[#0b0f19] border border-emerald-700/40 rounded-xl p-2 space-y-1">
            <span className="text-[10px] font-black text-emerald-500 uppercase block">PE</span>
            <input
              type="number"
              min={0}
              value={coins.pe}
              onChange={(e) => updateCoins({ ...coins, pe: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 text-center text-xs font-bold text-emerald-400 focus:outline-none"
            />
          </div>

          {/* PO */}
          <div className="bg-[#0b0f19] border border-amber-500/50 rounded-xl p-2 space-y-1">
            <span className="text-[10px] font-black text-amber-400 uppercase block">PO</span>
            <input
              type="number"
              min={0}
              value={coins.po}
              onChange={(e) => updateCoins({ ...coins, po: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-amber-500/40 rounded-lg py-1 text-center text-sm font-black text-amber-400 focus:outline-none"
            />
          </div>

          {/* PL */}
          <div className="bg-[#0b0f19] border border-cyan-500/40 rounded-xl p-2 space-y-1">
            <span className="text-[10px] font-black text-cyan-400 uppercase block">PL</span>
            <input
              type="number"
              min={0}
              value={coins.pl}
              onChange={(e) => updateCoins({ ...coins, pl: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 text-center text-xs font-bold text-cyan-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* PAINEL DE CARGA TOTAL */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase text-amber-400">Capacidade de Carga</span>
          </div>
          <span className={`text-xs font-black font-mono ${isEncumbered ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalWeight.toFixed(1)} / {maxCarryingCapacity} lb
          </span>
        </div>

        {/* BARRA DE PROGRESSO DE CARGA */}
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              isEncumbered ? 'bg-rose-500 shadow-rose-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
            }`}
            style={{ width: `${Math.min(100, (totalWeight / maxCarryingCapacity) * 100)}%` }}
          />
        </div>
        {isEncumbered && (
          <p className="text-[10px] font-bold text-rose-400">
            ⚠️ Sobrecarrregado! O peso total ultrapassa a capacidade suportada pela sua Força ({strScore}).
          </p>
        )}
      </div>

      {/* EQUIPAMENTOS E INVENTÁRIO */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Equipamentos & Itens
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsItemCompendiumOpen(true)}
              className="flex items-center gap-1 text-[11px] font-black bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 px-3 py-1 rounded-xl shadow-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Compêndio
            </button>
            <button
              type="button"
              onClick={handleAddEquipment}
              className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Manual
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleUpdateEquipment(item.id, { name: e.target.value })}
                placeholder="Nome do Item"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    handleUpdateEquipment(item.id, { quantity: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono text-center font-bold"
                />
                <input
                  type="text"
                  value={item.weight || ''}
                  onChange={(e) => handleUpdateEquipment(item.id, { weight: e.target.value })}
                  placeholder="Peso (1 lb)"
                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-400 text-center"
                />
                {(item.itemType === 'potion' || item.name.toLowerCase().includes('poção') || item.name.toLowerCase().includes('potion')) && (
                  <button
                    type="button"
                    onClick={() => handleUsePotion(item)}
                    className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 hover:text-emerald-300 rounded border border-emerald-500/30 transition-colors text-[10px] font-bold uppercase tracking-wider px-2 shrink-0"
                    title={`Beber ${item.name}`}
                  >
                    Beber
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(item.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TESOUROS E BENS VALIOSOS */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Gem className="w-4 h-4 text-amber-400" />
          Tesouros & Relíquias Especial
        </h3>
        <textarea
          rows={3}
          value={sheet.treasure || ''}
          onChange={(e) => onChange({ ...sheet, treasure: e.target.value })}
          placeholder="Ex: Joias de rubi, estátua de jade, pergaminho antigo de invocação..."
          className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
        />
      </div>
    </div>
  );
};
