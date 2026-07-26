'use client';

import React, { useState } from 'react';
import { Clock, Plus, Filter, Calendar, Sparkles, BookOpen, Shield, Flame, Trash2, ArrowRight } from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntity } from '@/lib/types';

export const WorldTimelineView: React.FC = () => {
  const { activeWorld, worldEntities, createWorldEntity, deleteWorldEntity } = useWorld();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New event form state
  const [title, setTitle] = useState('');
  const [era, setEra] = useState('Primeira Era');
  const [year, setYear] = useState('100 DF');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<'lore_event' | 'military_conflict' | 'tradition'>('lore_event');

  if (!activeWorld) return null;

  // Filter events (lore_event, military_conflict, tradition, or any entity with era attribute)
  const timelineEntities = worldEntities.filter(
    (e) =>
      e.category === 'lore_event' ||
      e.category === 'military_conflict' ||
      e.category === 'tradition' ||
      (e.attributes && e.attributes.era)
  );

  const filteredEntities = timelineEntities.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.category === selectedCategory;
  });

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createWorldEntity({
      worldId: activeWorld.id,
      category,
      name: title.trim(),
      subType: era,
      status: 'active',
      shortDesc: desc || 'Evento registrado na cronologia do mundo.',
      attributes: { era: `${era} - ${year}`, ano: year },
    });

    setTitle('');
    setDesc('');
    setShowAddModal(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'military_conflict':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Flame className="w-3 h-3" /> Conflito Militar</span>;
      case 'tradition':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Calendar className="w-3 h-3" /> Rito / Tradição</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><BookOpen className="w-3 h-3" /> Evento de Lore</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] overflow-hidden select-none p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2a3449]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
              FERRAMENTA DE ESTRUTURAÇÃO
            </span>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" /> Cronologia & Linha do Tempo
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organize eras, guerras, festivais e grandes cataclismos em uma visão cronológica contínua.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-[#121824] border border-[#2a3449] p-1 rounded-xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({timelineEntities.length})
            </button>
            <button
              onClick={() => setSelectedCategory('lore_event')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'lore_event' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Eventos
            </button>
            <button
              onClick={() => setSelectedCategory('military_conflict')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'military_conflict' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Guerras
            </button>
            <button
              onClick={() => setSelectedCategory('tradition')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'tradition' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tradições
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Evento</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto pt-6 pr-2">
        {filteredEntities.length === 0 ? (
          <div className="border-2 border-dashed border-[#2a3449] rounded-2xl p-10 text-center text-slate-500 bg-[#0f141d]/40 max-w-xl mx-auto mt-8">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-300 text-sm">Nenhum evento registrado nesta cronologia.</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crie eras históricas, grandes batalhas ou rituais ancestrais para guiar a narrativa do seu RPG.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
            >
              + Registrar Primeiro Evento Histórico
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-500/30 space-y-6 ml-4">
            {filteredEntities.map((item, idx) => {
              const eraLabel = item.attributes?.era || item.subType || `Era ${idx + 1}`;
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#0a0d14] border-2 border-amber-500 flex items-center justify-center shadow-md group-hover:scale-125 group-hover:border-amber-300 transition-all">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>

                  {/* Card Content */}
                  <div className="p-5 rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500/50 shadow-lg transition-all flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(item.category)}
                        <span className="text-xs font-mono font-bold text-amber-400 bg-[#0a0d14] border border-[#2a3449] px-2 py-0.5 rounded">
                          {eraLabel}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-100">{item.name}</h4>
                      <p className="text-xs text-slate-300 font-serif leading-relaxed">{item.shortDesc}</p>

                      {item.fullContent && (
                        <p className="text-xs text-slate-400 bg-[#0a0d14] p-3 rounded-xl border border-[#2a3449]/60 font-serif italic mt-2">
                          "{item.fullContent}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteWorldEntity(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded opacity-70 group-hover:opacity-100 transition-opacity self-start"
                      title="Remover Evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add Event */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-[#121722] border-2 border-amber-500/50 rounded-2xl p-6 w-full max-w-4xl lg:max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Registrar Novo Evento na Cronologia
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Adicione guerras, fundação de reinos ou cataclismos na linha do tempo de {activeWorld.title}.
            </p>

            <form onSubmit={handleAddTimelineEvent} className="space-y-5 overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Tipo de Evento:</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory('lore_event')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      category === 'lore_event' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-[#0a0d14] text-slate-400 border-[#2a3449] hover:text-slate-200'
                    }`}
                  >
                    Evento Lore
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('military_conflict')}
                    className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                      category === 'military_conflict' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-[#0a0d14] text-slate-400 border-[#2a3449] hover:text-slate-200'
                    }`}
                  >
                    Guerra / Conflito
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('tradition')}
                    className={`py-2.5 text-xs font-bold rounded-lg border transition-all ${
                      category === 'tradition' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-[#0a0d14] text-slate-400 border-[#2a3449] hover:text-slate-200'
                    }`}
                  >
                    Tradição / Rito
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Título do Evento:</label>
                <textarea
                  rows={2}
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Batalha dos Cinco Exércitos / O Eclipse Negro dos Picos"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 font-bold focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Era Histórica:</label>
                  <textarea
                    rows={2}
                    value={era}
                    onChange={(e) => setEra(e.target.value)}
                    placeholder="Ex: Segunda Era dos Reis Sol"
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Ano / Data:</label>
                  <textarea
                    rows={2}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ex: Ano 420 do Calendário de Prata"
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Descrição do Ocorrido:</label>
                <textarea
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Resumo do impacto histórico deste acontecimento no mundo..."
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none font-serif leading-relaxed shadow-inner"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#2a3449]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
