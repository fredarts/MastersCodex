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
  Search, 
  Edit3, 
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Map,
  Dna,
  HeartHandshake,
  Scroll,
  Briefcase,
  Atom,
  Wand2,
  Biohazard,
  Package,
  Boxes,
  Cpu,
  FileText,
  Languages,
  Flame,
  Swords,
  Layers,
  Coins,
  Compass,
  PawPrint,
  Trees
} from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntityCategory, WorldEntity } from '@/lib/types';
import { WorldEntityModal } from '@/components/WorldEntityModal';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { LoreGraph } from '@/components/LoreGraph';
import { WorldTimelineView } from '@/components/WorldTimelineView';
import { WorldInteractiveMapView } from '@/components/WorldInteractiveMapView';

interface WorldEditorProps {
  onOpenCreateCampaignWithWorld: () => void;
}

type ActiveViewTab = WorldEntityCategory | 'graph' | 'timeline' | 'map' | 'ai';

interface CategoryMenuItem {
  id: WorldEntityCategory;
  label: string;
  icon: React.ReactNode;
}

interface CategoryGroup {
  title: string;
  items: CategoryMenuItem[];
}

export const WorldEditor: React.FC<WorldEditorProps> = ({
  onOpenCreateCampaignWithWorld,
}) => {
  const { activeWorld, updateWorld, worldEntities, deleteWorldEntity, createWorldEntity } = useWorld();
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('npc');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<WorldEntity | null>(null);
  const [modalCategory, setModalCategory] = useState<WorldEntityCategory>('npc');
  const [searchQuery, setSearchQuery] = useState('');

  // Lightbox State for Cards
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Accordion collapsed state for groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    economia: true,
    bestiario: true,
    sobrenatural: true,
    pessoas: true,
    geografia: true,
    materiais: true,
    historia: true,
    ferramentas: true,
  });

  // World title inline edit state
  const [isEditingWorldTitle, setIsEditingWorldTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Event Listener para abrir o modal a partir do LoreGraph
  React.useEffect(() => {
    const handleOpenModal = (e: CustomEvent<{ entityId: string }>) => {
      const entity = worldEntities.find((ent) => ent.id === e.detail.entityId);
      if (entity) {
        setEditingEntity(entity);
        setModalCategory(entity.category);
        setShowAddModal(true);
      }
    };

    window.addEventListener('openWorldEntityModal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('openWorldEntityModal', handleOpenModal as EventListener);
    };
  }, [worldEntities]);

  if (!activeWorld) {
    return (
      <div className="flex-1 bg-[#0a0d14] flex flex-col items-center justify-center p-8 text-center">
        <Globe className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-300 text-base">Nenhum mundo ativo selecionado.</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Selecione ou crie um mundo na biblioteca para acessar o Estúdio de Worldbuilding.
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

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const countByCategory = (cat: WorldEntityCategory) =>
    worldEntities.filter((e) => e.category === cat).length;

  // Category Groups Mapping
  const categoryGroups: { key: string; title: string; items: CategoryMenuItem[] }[] = [
    {
      key: 'economia',
      title: 'Economia & Comércio',
      items: [
        { id: 'currency', label: 'Sistemas Monetários & Moedas', icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'trade_route', label: 'Rotas & Mercados', icon: <Compass className="w-3.5 h-3.5 text-emerald-400" /> },
        { id: 'material', label: 'Recursos & Produtos', icon: <Boxes className="w-3.5 h-3.5 text-yellow-400" /> },
      ],
    },
    {
      key: 'bestiario',
      title: 'Bestiário & Natureza',
      items: [
        { id: 'beast', label: 'Monstros & Feras', icon: <PawPrint className="w-3.5 h-3.5 text-rose-400" /> },
        { id: 'flora', label: 'Flora Extraordinária', icon: <Trees className="w-3.5 h-3.5 text-emerald-300" /> },
        { id: 'species', label: 'Espécies & Raças', icon: <Dna className="w-3.5 h-3.5 text-teal-400" /> },
      ],
    },
    {
      key: 'sobrenatural',
      title: 'Magia & Cosmologia',
      items: [
        { id: 'magic_system', label: 'Sistemas de Magia & Leis', icon: <Wand2 className="w-3.5 h-3.5 text-violet-400" /> },
        { id: 'spell', label: 'Feitiços & Magias', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
        { id: 'plane', label: 'Planos & Dimensões', icon: <Layers className="w-3.5 h-3.5 text-indigo-400" /> },
        { id: 'cosmology', label: 'Cosmologia & Mitos', icon: <Atom className="w-3.5 h-3.5 text-cyan-400" /> },
        { id: 'natural_law', label: 'Leis Naturais & Fenômenos', icon: <Globe className="w-3.5 h-3.5 text-teal-300" /> },
        { id: 'disease', label: 'Doenças & Condições', icon: <Biohazard className="w-3.5 h-3.5 text-lime-400" /> },
      ],
    },
    {
      key: 'pessoas',
      title: 'Pessoas & Sociedades',
      items: [
        { id: 'npc', label: 'NPCs & Personagens', icon: <Users className="w-3.5 h-3.5 text-amber-400" /> },
        { id: 'faction', label: 'Facções & Guildas', icon: <Shield className="w-3.5 h-3.5 text-rose-400" /> },
        { id: 'religion', label: 'Religiões & Cultos', icon: <Zap className="w-3.5 h-3.5 text-purple-400" /> },
        { id: 'ethnicity', label: 'Etnias & Culturas', icon: <HeartHandshake className="w-3.5 h-3.5 text-pink-400" /> },
        { id: 'tradition', label: 'Tradições & Rituais', icon: <Scroll className="w-3.5 h-3.5 text-amber-300" /> },
        { id: 'profession', label: 'Profissões & Títulos', icon: <Briefcase className="w-3.5 h-3.5 text-cyan-300" /> },
      ],
    },
    {
      key: 'geografia',
      title: 'Geografia & Marcos',
      items: [
        { id: 'location', label: 'Geografia, Masmorras & Ruínas', icon: <MapPin className="w-3.5 h-3.5 text-cyan-400" /> },
      ],
    },
    {
      key: 'materiais',
      title: 'Itens & Tecnologia',
      items: [
        { id: 'item', label: 'Itens & Artefatos', icon: <Package className="w-3.5 h-3.5 text-orange-400" /> },
        { id: 'technology', label: 'Tecnologia & Veículos', icon: <Cpu className="w-3.5 h-3.5 text-blue-400" /> },
      ],
    },
    {
      key: 'historia',
      title: 'História & Sociedade',
      items: [
        { id: 'lore_event', label: 'Lore & Eventos Marcantes', icon: <BookOpen className="w-3.5 h-3.5 text-blue-400" /> },
        { id: 'document', label: 'Documentos & Registros', icon: <FileText className="w-3.5 h-3.5 text-slate-300" /> },
        { id: 'language', label: 'Idiomas & Dialetos', icon: <Languages className="w-3.5 h-3.5 text-indigo-400" /> },
        { id: 'military_conflict', label: 'Conflitos Militares', icon: <Flame className="w-3.5 h-3.5 text-rose-500" /> },
        { id: 'military_unit', label: 'Unidades Militares', icon: <Swords className="w-3.5 h-3.5 text-amber-500" /> },
      ],
    },
  ];

  // Filter current entities for entity view
  const currentCategoryEntities = worldEntities.filter(
    (e) =>
      e.category === activeTab &&
      (e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryLabel = (cat: string) => {
    for (const group of categoryGroups) {
      const found = group.items.find((i) => i.id === cat);
      if (found) return found.label;
    }
    if (cat === 'graph') return 'Lore Graph (Conexões)';
    if (cat === 'timeline') return 'Cronologia (Linha do Tempo)';
    if (cat === 'map') return 'Mapa Interativo';
    if (cat === 'ai') return 'Geradores IA';
    return cat;
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex overflow-hidden select-none">
      {/* Collapsible Left Sidebar */}
      <aside
        className={`bg-[#0f141d] border-r border-[#2a3449] flex flex-col transition-all duration-300 z-20 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Sidebar Header & Toggle */}
        <div className="p-3 border-b border-[#2a3449] flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Categorias World
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg bg-[#161c28] text-slate-400 hover:text-amber-400 hover:bg-[#1f2738] transition-colors mx-auto"
            title={isSidebarCollapsed ? 'Expandir Barra Lateral' : 'Recolher Barra Lateral'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Sidebar Search Bar */}
        {!isSidebarCollapsed && (
          <div className="p-2 border-b border-[#2a3449]/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar no worldbuilding..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg pl-8 pr-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* Categories Menu List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* Interactive Tools Section */}
          <div>
            {!isSidebarCollapsed && (
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 px-2 py-1 font-mono">
                Ferramentas Interativas
              </div>
            )}
            <div className="space-y-0.5 mt-0.5">
              <button
                onClick={() => setActiveTab('graph')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'graph'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Lore Graph"
              >
                <Network className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Grafo de Lore</span>}
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'timeline'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Cronologia Interativa"
              >
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Cronologia</span>}
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'map'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Mapa Interativo"
              >
                <Map className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Mapa Interativo</span>}
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ai'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                }`}
                title="Geradores IA"
              >
                <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="truncate">Geradores IA</span>}
              </button>
            </div>
          </div>

          <div className="border-t border-[#2a3449]/60 my-2" />

          {/* Category Groups Accordion */}
          {categoryGroups.map((group) => (
            <div key={group.key}>
              {!isSidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${openGroups[group.key] ? '' : '-rotate-90'}`}
                  />
                </button>
              )}

              {(isSidebarCollapsed || openGroups[group.key]) && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const count = countByCategory(item.id);
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c28]'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {item.icon}
                          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isSidebarCollapsed && count > 0 && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                              isActive
                                ? 'bg-slate-950 text-amber-300'
                                : 'bg-[#161c28] text-slate-400 border border-[#2a3449]'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Active World Header Bar */}
        <header className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border-b border-[#2a3449] p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md">
              <Globe className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  {getCategoryLabel(activeTab)}
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
                    className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-0.5 text-base text-amber-300 font-bold focus:outline-none w-56"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveWorldTitle();
                      if (e.key === 'Escape') setIsEditingWorldTitle(false);
                    }}
                  />
                  <button onClick={handleSaveWorldTitle} className="p-1 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group mt-0.5">
                  <h2 className="text-lg font-bold text-slate-100">{activeWorld.title}</h2>
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
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'graph' && activeTab !== 'timeline' && activeTab !== 'map' && activeTab !== 'ai' && (
              <button
                onClick={() => openModalForCategory(activeTab as WorldEntityCategory)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs shadow transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar {getCategoryLabel(activeTab)}</span>
              </button>
            )}

            <button
              onClick={onOpenCreateCampaignWithWorld}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>Criar Campanha</span>
            </button>
          </div>
        </header>

        {/* Main Content Render */}
        <div className={`flex-1 ${activeTab === 'graph' || activeTab === 'timeline' || activeTab === 'map' ? 'flex flex-col h-full w-full overflow-hidden min-h-0' : 'overflow-y-auto p-6'}`}>
          {activeTab === 'graph' ? (
            <LoreGraph />
          ) : activeTab === 'timeline' ? (
            <WorldTimelineView />
          ) : activeTab === 'map' ? (
            <WorldInteractiveMapView />
          ) : activeTab === 'ai' ? (
            <div className="max-w-2xl mx-auto space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Geradores de Worldbuilding com IA
              </h3>
              <p className="text-xs text-slate-400">
                Gere elementos de história ajustados para o estilo de <strong>{activeWorld.title}</strong>:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    await createWorldEntity({
                      worldId: activeWorld.id,
                      category: 'npc',
                      name: 'Mestre Eldrin, o Sábio',
                      subType: 'Arquimago',
                      status: 'active',
                      shortDesc: 'Guardião dos tomos sagrados da biblioteca arcana do reino.',
                      attributes: { alinhamento: 'Neutro e Bom', raca: 'Elfo' },
                    });
                  }}
                  className="p-4 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/40 rounded-2xl text-left transition-all group"
                >
                  <Users className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-200">Gerar NPC Aleatório com Segredo</div>
                  <div className="text-[10px] text-slate-500 mt-1">Cria ficha com raça, papel e motivação</div>
                </button>

                <button
                  onClick={async () => {
                    await createWorldEntity({
                      worldId: activeWorld.id,
                      category: 'location',
                      name: 'Porto dos Ventos Místicos',
                      subType: 'Cidade Portuária',
                      status: 'active',
                      shortDesc: 'Cidade costeira fortificada famosa pelo comércio de artefatos raros.',
                      attributes: { populacao: '28.000 hab', clima: 'Marítimo' },
                    });
                  }}
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
                    Nenhum item cadastrado na categoria <strong>{getCategoryLabel(activeTab)}</strong> em {activeWorld.title}.
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    Comece expandindo este elemento para enriquecer a lore e a profundidade do seu universo.
                  </p>
                  <button
                    onClick={() => openModalForCategory(activeTab as WorldEntityCategory)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                  >
                    + Adicionar {getCategoryLabel(activeTab)}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 tablet-portrait-grid">
                  {currentCategoryEntities.map((ent) => (
                    <div
                      key={ent.id}
                      className="p-4 rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500/50 transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      <div>
                        {ent.images && ent.images.length > 0 && (
                          <div
                            onClick={() => {
                              setLightboxImages(ent.images || []);
                              setIsLightboxOpen(true);
                            }}
                            className="relative h-36 -mx-4 -mt-4 mb-3 overflow-hidden bg-[#0a0d14] cursor-pointer group/img"
                            title="Clique para dar zoom na imagem"
                          >
                            <img src={ent.images[0]} alt={ent.name} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                            <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                              🔍 {ent.images.length} {ent.images.length === 1 ? 'mídia' : 'mídias'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase bg-[#0a0d14] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                            {ent.subType || getCategoryLabel(ent.category)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingEntity(ent);
                                setModalCategory(ent.category);
                                setShowAddModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                              title="Editar Entidade"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteWorldEntity(ent.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4
                          onClick={() => {
                            setEditingEntity(ent);
                            setModalCategory(ent.category);
                            setShowAddModal(true);
                          }}
                          className="font-bold text-base text-slate-100 hover:text-amber-300 cursor-pointer transition-colors"
                        >
                          {ent.name}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 font-serif leading-relaxed line-clamp-3">{ent.shortDesc}</p>

                        {ent.attributes && Object.keys(ent.attributes).length > 0 && (
                          <div className="mt-3 p-2 bg-[#0a0d14] rounded-lg border border-[#2a3449] space-y-1 text-[11px]">
                            {Object.entries(ent.attributes).map(([k, v]) => (
                              <div key={k} className="flex justify-between text-slate-400 font-mono">
                                <span className="capitalize">{k.replace('_', ' ')}:</span>
                                <span className="text-slate-200 font-semibold truncate max-w-[140px]">{String(v)}</span>
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
      </main>

      {/* World Entity Creator / Editor Modal */}
      <WorldEntityModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingEntity(null);
        }}
        defaultCategory={modalCategory}
        editingEntity={editingEntity}
      />

      {/* Image Lightbox / Zoom Carousel Modal for Cards */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={lightboxImages}
      />
    </div>
  );
};
