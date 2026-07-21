'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Users, 
  MapPin, 
  Shield, 
  Zap, 
  BookOpen, 
  Network, 
  Sparkles, 
  Trash2, 
  Rocket, 
  Crown,
  Search,
  Wand2,
  Edit3,
  Check
} from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntityCategory, WorldEntity } from '@/lib/types';
import { WorldEntityModal } from '@/components/WorldEntityModal';
import { LoreGraph } from '@/components/LoreGraph';

interface WorldEditorProps {
  onOpenCreateCampaignWithWorld: () => void;
}

export const WorldEditor: React.FC<WorldEditorProps> = ({
  onOpenCreateCampaignWithWorld,
}) => {
  const { activeWorld, updateWorld, worldEntities, deleteWorldEntity, createWorldEntity } = useWorld();
  const [activeSubTab, setActiveSubTab] = useState<WorldEntityCategory | 'graph' | 'ai'>('npc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalCategory, setModalCategory] = useState<WorldEntityCategory>('npc');
  const [filterQuery, setFilterQuery] = useState('');

  // World title inline edit state
  const [isEditingWorldTitle, setIsEditingWorldTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  if (!activeWorld) {
    return (
      <div className="flex-1 bg-[#0a0d14] flex flex-col items-center justify-center p-8 text-center">
        <Globe className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-300 text-base">Nenhum mundo ativo selecionado.</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Selecione ou crie um mundo na barra lateral esquerda para acessar o Estúdio de Worldbuilding.
        </p>
      </div>
    );
  }

  const handleSaveWorldTitle = async () => {
    if (activeWorld && editedTitle.trim()) {
      await updateWorld({ ...activeWorld, title: editedTitle.trim() });
    }
    setIsEditingWorldTitle(false);
  };

  const openModalForCategory = (cat: WorldEntityCategory) => {
    setModalCategory(cat);
    setShowAddModal(true);
  };

  const currentCategoryEntities = worldEntities.filter(
    (e) =>
      (activeSubTab === 'graph' || activeSubTab === 'ai' || e.category === activeSubTab) &&
      (e.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        e.shortDesc.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const countByCategory = (cat: WorldEntityCategory) =>
    worldEntities.filter((e) => e.category === cat).length;

  const handleGenerateAiNpc = async () => {
    await createWorldEntity({
      worldId: activeWorld.id,
      category: 'npc',
      name: 'Mestre Eldrin, o Sábio',
      subType: 'Arquimago',
      status: 'active',
      shortDesc: 'Guardião dos tomos sagrados da biblioteca arcana do reino.',
      attributes: { alinhamento: 'Neutro e Bom', raca: 'Elfo' },
    });
  };

  const handleGenerateAiCity = async () => {
    await createWorldEntity({
      worldId: activeWorld.id,
      category: 'location',
      name: 'Porto dos Ventos Místicos',
      subType: 'Cidade Portuária',
      status: 'active',
      shortDesc: 'Cidade costeira fortificada famosa pelo comércio de artefatos raros.',
      attributes: { populacao: '28.000 hab', clima: 'Marítimo' },
    });
  };

  // Dynamic Button & Empty State Label Helpers
  const getAddButtonText = (cat: WorldEntityCategory | 'graph' | 'ai') => {
    switch (cat) {
      case 'npc': return '+ Adicionar NPC ao Mundo';
      case 'location': return '+ Adicionar Local ao Mundo';
      case 'faction': return '+ Adicionar Facção ao Mundo';
      case 'religion': return '+ Adicionar Religião ao Mundo';
      case 'lore_event': return '+ Adicionar Evento de Lore';
      default: return '+ Adicionar ao Mundo';
    }
  };

  const getEmptyStateText = (cat: WorldEntityCategory | 'graph' | 'ai') => {
    switch (cat) {
      case 'npc': return `Nenhum NPC cadastrado em ${activeWorld.title}.`;
      case 'location': return `Nenhuma Cidade, Reino ou Geografia cadastrada em ${activeWorld.title}.`;
      case 'faction': return `Nenhuma Facção ou Guilda cadastrada em ${activeWorld.title}.`;
      case 'religion': return `Nenhuma Religião ou Deus cadastrado em ${activeWorld.title}.`;
      case 'lore_event': return `Nenhum Evento Histórico ou Lore cadastrado em ${activeWorld.title}.`;
      default: return `Nenhum item cadastrado nesta categoria.`;
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Top Banner of Active World */}
      <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border-b border-[#2a3449] p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
            <Globe className="w-6 h-6 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                ESTÚDIO DE WORLDBUILDING
              </span>
              <span className="text-xs text-slate-400 font-semibold">• {activeWorld.genre}</span>
            </div>
            {isEditingWorldTitle ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  autoFocus
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-0.5 text-lg text-amber-300 font-bold focus:outline-none w-64"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveWorldTitle();
                    if (e.key === 'Escape') setIsEditingWorldTitle(false);
                  }}
                />
                <button
                  onClick={handleSaveWorldTitle}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group mt-0.5">
                <h2 className="text-xl font-bold text-slate-100">{activeWorld.title}</h2>
                <button
                  onClick={() => {
                    setIsEditingWorldTitle(true);
                    setEditedTitle(activeWorld.title);
                  }}
                  className="p-0.5 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                  title="Editar Nome do Mundo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 max-w-xl truncate">{activeWorld.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateCampaignWithWorld}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
          >
            <Rocket className="w-4 h-4" />
            <span>Criar Campanha a partir Deste Mundo</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2a3449] bg-[#0f141d] px-4 gap-2">
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveSubTab('npc')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'npc'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>NPCs ({countByCategory('npc')})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('location')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'location'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Geografia ({countByCategory('location')})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('faction')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'faction'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Facções ({countByCategory('faction')})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('religion')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'religion'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Religiões ({countByCategory('religion')})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('lore_event')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'lore_event'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Lore ({countByCategory('lore_event')})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('graph')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'graph'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lore Graph</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all border-b-2 ${
              activeSubTab === 'ai'
                ? 'border-amber-400 text-amber-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Geradores IA</span>
          </button>
        </div>

        {activeSubTab !== 'graph' && activeSubTab !== 'ai' && (
          <div className="py-2 flex items-center gap-2">
            <button
              onClick={() => openModalForCategory(activeSubTab as WorldEntityCategory)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{getAddButtonText(activeSubTab)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSubTab === 'graph' ? (
          <LoreGraph />
        ) : activeSubTab === 'ai' ? (
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Geradores de Worldbuilding com IA
            </h3>
            <p className="text-xs text-slate-400">
              Gere elementos de história ajustados para o estilo de <strong>{activeWorld.title}</strong>:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGenerateAiNpc}
                className="p-4 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/40 rounded-2xl text-left transition-all group"
              >
                <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-200">Gerar NPC Aleatório com Segredo</div>
                <div className="text-[10px] text-slate-500 mt-1">Cria ficha com raça, papel e motivação</div>
              </button>

              <button
                onClick={handleGenerateAiCity}
                className="p-4 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/40 rounded-2xl text-left transition-all group"
              >
                <MapPin className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-slate-200">Gerar Cidade Portuária ou Fortaleza</div>
                <div className="text-[10px] text-slate-500 mt-1">Cria localização com clima e população</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {currentCategoryEntities.length === 0 ? (
              <div className="border-2 border-dashed border-[#2a3449] rounded-2xl p-8 text-center text-slate-500 bg-[#0f141d]/40 max-w-xl mx-auto">
                <p className="font-semibold text-slate-300 text-sm mb-1">
                  {getEmptyStateText(activeSubTab)}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Comece expandindo este elemento para enriquecer a lore e a profundidade do seu universo.
                </p>
                <button
                  onClick={() => openModalForCategory(activeSubTab as WorldEntityCategory)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  {getAddButtonText(activeSubTab)}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCategoryEntities.map((ent) => (
                  <div
                    key={ent.id}
                    className="p-4 rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase bg-[#0a0d14] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                          {ent.subType || ent.category}
                        </span>
                        <button
                          onClick={() => deleteWorldEntity(ent.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-base text-slate-100">{ent.name}</h4>
                      <p className="text-xs text-slate-300 mt-1 font-serif leading-relaxed">{ent.shortDesc}</p>

                      {ent.attributes && Object.keys(ent.attributes).length > 0 && (
                        <div className="mt-3 p-2 bg-[#0a0d14] rounded-lg border border-[#2a3449] space-y-1 text-[11px]">
                          {Object.entries(ent.attributes).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-slate-400 font-mono">
                              <span className="capitalize">{k.replace('_', ' ')}:</span>
                              <span className="text-slate-200 font-semibold">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* World Entity Creator Modal */}
      <WorldEntityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultCategory={modalCategory}
      />
    </div>
  );
};
