import React, { useState } from 'react';
import { CharacterSheet, CharacterSpell } from '@/lib/types';
import { SRD_SPELLS, SRDSpell } from '@/lib/srd-compendium';
import { Search, Sparkles, Plus, Check, X, Flame, Shield, Wand2 } from 'lucide-react';

interface SpellCompendiumModalProps {
  sheet: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onAddSpell: (spell: CharacterSpell) => void;
}

export const SpellCompendiumModal: React.FC<SpellCompendiumModalProps> = ({
  sheet,
  isOpen,
  onClose,
  onAddSpell,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');
  const [addedSpellNames, setAddedSpellNames] = useState<Set<string>>(
    new Set(sheet.spells.map((s) => s.name)),
  );

  if (!isOpen) return null;

  const filteredSpells = SRD_SPELLS.filter((spell) => {
    const matchesSearch =
      spell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spell.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spell.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevelFilter === 'all' || spell.level === selectedLevelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleImportSpell = (srdSpell: SRDSpell) => {
    const newSpell: CharacterSpell = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: srdSpell.name,
      level: srdSpell.level,
      prepared: srdSpell.level === 0, // Truques são sempre preparados
      school: srdSpell.school,
      castingTime: srdSpell.castingTime,
      range: srdSpell.range,
      description: `${srdSpell.description}\n\nComponentes: ${srdSpell.components} | Duração: ${srdSpell.duration}`,
    };

    onAddSpell(newSpell);
    setAddedSpellNames((prev) => new Set(prev).add(srdSpell.name));
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-purple-500/40 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="bg-[#141b2d] border-b border-purple-500/20 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-wider">Compêndio de Magias SRD D&D 5e</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CAMPO DE BUSCA E FILTROS */}
        <div className="p-4 bg-[#111827] border-b border-slate-800 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, escola ou efeito (ex: Bola de Fogo, Cura, Míssil)..."
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          {/* FILTRO DE NÍVEL DE MAGIA */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedLevelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-colors border ${
                selectedLevelFilter === 'all'
                  ? 'bg-purple-600 text-white border-purple-400'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Todos os Níveis
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevelFilter(lvl)}
                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-colors border ${
                  selectedLevelFilter === lvl
                    ? 'bg-purple-600 text-white border-purple-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {lvl === 0 ? 'Truques' : `Niv ${lvl}`}
              </button>
            ))}
          </div>
        </div>

        {/* LISTA DE MAGIAS DO COMPÊNDIO */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 scrollbar-thin">
          {filteredSpells.length === 0 ? (
            <div className="p-10 text-center text-slate-500 space-y-2">
              <Wand2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs">Nenhuma magia encontrada para a busca atual.</p>
            </div>
          ) : (
            filteredSpells.map((spell) => {
              const isAdded = addedSpellNames.has(spell.name);
              return (
                <div
                  key={spell.name}
                  className="bg-[#141b2d] border border-slate-800 hover:border-purple-500/40 rounded-xl p-4 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{spell.name}</span>
                        <span className="text-[10px] font-extrabold font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                          {spell.level === 0 ? 'Truque' : `Nível ${spell.level}`}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">
                          {spell.school}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                        <span>Tempo: {spell.castingTime}</span>
                        <span>•</span>
                        <span>Alcance: {spell.range}</span>
                        <span>•</span>
                        <span>Classes: {spell.classes.join(', ')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportSpell(spell)}
                      disabled={isAdded}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        isAdded
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Adicionada
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] p-2.5 rounded-lg border border-slate-900">
                    {spell.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
