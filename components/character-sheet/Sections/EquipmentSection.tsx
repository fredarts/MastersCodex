import React, { useState } from 'react';
import { CharacterSheet, CharacterEquipmentItem } from '@/lib/types';
import { Coins, Package, Plus, Trash2, Gem, Weight, Scale, Sparkles } from 'lucide-react';
import { ItemCompendiumModal } from '../Modals/ItemCompendiumModal';

interface EquipmentSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const EquipmentSection: React.FC<EquipmentSectionProps> = ({ sheet, onChange }) => {
  const [isItemCompendiumOpen, setIsItemCompendiumOpen] = useState(false);
  const [items, setItems] = useState<CharacterEquipmentItem[]>(() => {
    return [
      { id: '1', name: 'Mochila de Aventureiro', quantity: 1, weight: '5 lb', notes: 'Contém corda e rações' },
      { id: '2', name: 'Tochas', quantity: 5, weight: '1 lb', notes: 'Dura 1 hora cada' },
      { id: '3', name: 'Odre de Água', quantity: 1, weight: '5 lb', notes: 'Cheio' },
    ];
  });

  const [coins, setCoins] = useState({
    po: 15,
    pp: 20,
    pc: 50,
    pe: 0,
    pl: 0,
  });

  // CÁLCULO DA CAPACIDADE DE CARGA (D&D 5e: FORÇA * 15 lb)
  const strScore = sheet.attributes.str.score || 10;
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
    setItems([...items, newItem]);
  };

  const handleRemoveEquipment = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateEquipment = (id: string, updated: Partial<CharacterEquipmentItem>) => {
    setItems(items.map((i) => (i.id === id ? { ...i, ...updated } : i)));
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* ITEM COMPENDIUM MODAL */}
      <ItemCompendiumModal
        sheet={sheet}
        isOpen={isItemCompendiumOpen}
        onClose={() => setIsItemCompendiumOpen(false)}
        onAddItem={(newItem) => {
          setItems((prev) => [...prev, newItem]);
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
              onChange={(e) => setCoins({ ...coins, pc: parseInt(e.target.value, 10) || 0 })}
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
              onChange={(e) => setCoins({ ...coins, pp: parseInt(e.target.value, 10) || 0 })}
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
              onChange={(e) => setCoins({ ...coins, pe: parseInt(e.target.value, 10) || 0 })}
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
              onChange={(e) => setCoins({ ...coins, po: parseInt(e.target.value, 10) || 0 })}
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
              onChange={(e) => setCoins({ ...coins, pl: parseInt(e.target.value, 10) || 0 })}
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
