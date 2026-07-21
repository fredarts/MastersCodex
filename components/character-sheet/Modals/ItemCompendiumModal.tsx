import React, { useState } from 'react';
import { CharacterSheet, CharacterEquipmentItem } from '@/lib/types';
import { SRD_EQUIPMENT, SRDItem } from '@/lib/srd-compendium';
import { Search, Package, Plus, Check, X, Shield, Wrench } from 'lucide-react';

interface ItemCompendiumModalProps {
  sheet: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: CharacterEquipmentItem) => void;
}

export const ItemCompendiumModal: React.FC<ItemCompendiumModalProps> = ({
  sheet,
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedItemNames, setAddedItemNames] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const categories = ['all', 'Equipamento', 'Pção', 'Ferramenta'];

  const filteredItems = SRD_EQUIPMENT.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImportItem = (srdItem: SRDItem) => {
    const newItem: CharacterEquipmentItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: srdItem.name,
      quantity: 1,
      weight: `${srdItem.weight} lb`,
      notes: `${srdItem.description} (Custo: ${srdItem.cost})`,
    };

    onAddItem(newItem);
    setAddedItemNames((prev) => new Set(prev).add(srdItem.name));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-xl h-[80vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-[#141b2d] border-b border-amber-500/20 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-amber-400">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black uppercase tracking-wider">Compêndio de Equipamentos D&D 5e</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BUSCA E CATEGORIAS */}
        <div className="p-4 bg-[#111827] border-b border-slate-800 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar item, poção ou ferramenta..."
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all uppercase ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* LISTA */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 scrollbar-thin">
          {filteredItems.map((item) => {
            const isAdded = addedItemNames.has(item.name);
            return (
              <div
                key={item.name}
                className="bg-[#141b2d] border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {item.weight} lb
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.cost})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{item.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleImportItem(item)}
                  disabled={isAdded}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isAdded
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Adicionado
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
