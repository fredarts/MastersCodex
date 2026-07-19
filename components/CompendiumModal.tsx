'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Shield, Sparkles, Package, Flame, Heart } from 'lucide-react';
import { SRDMonster, SRDSpell, SRDItem } from '@/lib/types';
import { INITIAL_MONSTERS, INITIAL_SPELLS, INITIAL_ITEMS } from '@/lib/srd-data';

interface CompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompendiumModal: React.FC<CompendiumModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'monsters' | 'spells' | 'items'>('monsters');
  const [selectedMonster, setSelectedMonster] = useState<SRDMonster | null>(INITIAL_MONSTERS[0]);
  const [selectedSpell, setSelectedSpell] = useState<SRDSpell | null>(INITIAL_SPELLS[0]);
  const [selectedItem, setSelectedItem] = useState<SRDItem | null>(INITIAL_ITEMS[0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredMonsters = INITIAL_MONSTERS.filter(
    (m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.type.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSpells = INITIAL_SPELLS.filter(
    (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.school.toLowerCase().includes(query.toLowerCase())
  );

  const filteredItems = INITIAL_ITEMS.filter(
    (i) => i.name.toLowerCase().includes(query.toLowerCase()) || i.rarity.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Search Bar */}
        <div className="p-4 border-b border-[#2a3449] bg-[#0f141d] flex items-center justify-between gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 text-amber-400 absolute left-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar no Compêndio D&D 5e SRD (Ex: Bola de Fogo, Goblin, Mochila de Carga)..."
              className="w-full bg-[#161c28] border border-[#2a3449] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#2a3449] bg-[#0a0d14]">
          <button
            onClick={() => setActiveTab('monsters')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'monsters' ? 'border-amber-400 text-amber-300 bg-[#161c28]' : 'border-transparent text-slate-400'
            }`}
          >
            Monstros ({filteredMonsters.length})
          </button>
          <button
            onClick={() => setActiveTab('spells')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'spells' ? 'border-amber-400 text-amber-300 bg-[#161c28]' : 'border-transparent text-slate-400'
            }`}
          >
            Magias ({filteredSpells.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'items' ? 'border-amber-400 text-amber-300 bg-[#161c28]' : 'border-transparent text-slate-400'
            }`}
          >
            Itens Mágicos ({filteredItems.length})
          </button>
        </div>

        {/* Main Content Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* List Sidebar */}
          <div className="border-r border-[#2a3449] overflow-y-auto p-2 space-y-1 bg-[#0f141d]/50">
            {activeTab === 'monsters' &&
              filteredMonsters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMonster(m)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedMonster?.id === m.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">ND {m.cr}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{m.type}</div>
                </button>
              ))}

            {activeTab === 'spells' &&
              filteredSpells.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpell(s)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedSpell?.id === s.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{s.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {s.level === 0 ? 'Truque' : `${s.level}º Nível`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.school}</div>
                </button>
              ))}

            {activeTab === 'items' &&
              filteredItems.map((i) => (
                <button
                  key={i.id}
                  onClick={() => setSelectedItem(i)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedItem?.id === i.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{i.name}</span>
                    <span className="text-[10px] font-mono text-amber-400">{i.rarity}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{i.type}</div>
                </button>
              ))}
          </div>

          {/* Details Pane */}
          <div className="md:col-span-2 p-6 overflow-y-auto bg-[#161c28]">
            {activeTab === 'monsters' && selectedMonster && (
              <div className="space-y-4">
                <div className="border-b border-[#2a3449] pb-3">
                  <h2 className="text-xl font-bold text-slate-100">{selectedMonster.name}</h2>
                  <p className="text-xs text-slate-400 italic mt-0.5">
                    {selectedMonster.size} {selectedMonster.type}, {selectedMonster.alignment}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-[#0a0d14] rounded-lg border border-[#2a3449]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Classe de Armadura</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">{selectedMonster.ac}</span>
                  </div>
                  <div className="p-2.5 bg-[#0a0d14] rounded-lg border border-[#2a3449]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Pontos de Vida</span>
                    <span className="text-sm font-bold text-rose-400 font-mono">{selectedMonster.hp}</span>
                  </div>
                  <div className="p-2.5 bg-[#0a0d14] rounded-lg border border-[#2a3449]">
                    <span className="text-[10px] text-slate-400 block font-semibold">Desafio (XP)</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      ND {selectedMonster.cr} ({selectedMonster.xp} XP)
                    </span>
                  </div>
                </div>

                {/* Abilities */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Habilidades Especiais:</h4>
                  {selectedMonster.abilities.map((ab, idx) => (
                    <div key={idx} className="bg-[#0a0d14] p-3 rounded-lg border border-[#2a3449]">
                      <span className="font-bold text-xs text-slate-200">{ab.name}: </span>
                      <span className="text-xs text-slate-300">{ab.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Ações de Combate:</h4>
                  {selectedMonster.actions.map((act, idx) => (
                    <div key={idx} className="bg-[#0a0d14] p-3 rounded-lg border border-[#2a3449]">
                      <span className="font-bold text-xs text-slate-200">{act.name}: </span>
                      <span className="text-xs text-slate-300">{act.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'spells' && selectedSpell && (
              <div className="space-y-4">
                <div className="border-b border-[#2a3449] pb-3">
                  <h2 className="text-xl font-bold text-slate-100">{selectedSpell.name}</h2>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    {selectedSpell.level === 0 ? 'Truque' : `${selectedSpell.level}º Nível`} de {selectedSpell.school}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-[#2a3449]">
                    <span className="text-slate-400 block text-[10px]">Tempo de Conjuração:</span>
                    <span className="font-bold text-slate-200">{selectedSpell.castingTime}</span>
                  </div>
                  <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-[#2a3449]">
                    <span className="text-slate-400 block text-[10px]">Alcance:</span>
                    <span className="font-bold text-slate-200">{selectedSpell.range}</span>
                  </div>
                </div>

                <div className="bg-[#0a0d14] p-4 rounded-xl border border-[#2a3449]">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Efeito da Magia:</h4>
                  <p className="text-xs text-slate-200 leading-relaxed font-serif">{selectedSpell.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'items' && selectedItem && (
              <div className="space-y-4">
                <div className="border-b border-[#2a3449] pb-3">
                  <h2 className="text-xl font-bold text-slate-100">{selectedItem.name}</h2>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    {selectedItem.type} • Raridade: {selectedItem.rarity}
                  </p>
                </div>

                <div className="bg-[#0a0d14] p-4 rounded-xl border border-[#2a3449]">
                  <p className="text-xs text-slate-200 leading-relaxed">{selectedItem.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
