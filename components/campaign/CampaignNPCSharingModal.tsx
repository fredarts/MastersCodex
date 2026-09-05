'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  X, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles, 
  Shield, 
  Scroll, 
  Swords, 
  Lock, 
  Image as ImageIcon,
  BookOpen, 
  Share2, 
  Crown,
  MapPin,
  Flag,
  Flame,
  Gem,
  AlertCircle
} from 'lucide-react';
import { WorldEntity, UserCampaign, CampaignNPCDisclosure, WorldEntityCategory } from '@/lib/types';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';

export interface CampaignNPCSharingModalProps {
  campaign: UserCampaign;
  worldEntities: WorldEntity[];
  initialEntityId?: string;
  initialCategory?: string;
  onClose: () => void;
}

const DEFAULT_DISCLOSURE: Omit<CampaignNPCDisclosure, 'entityId'> = {
  isShared: false,
  alias: '',
  revealedFields: {
    image: false,
    name: false,
    raceClass: false,
    shortDesc: true,
    fullContent: false,
    secrets: false,
    connections: false,
    statSheet: false,
    tags: true,
  },
};

type CategoryFilter = 'all' | 'npc' | 'location' | 'faction' | 'item' | 'spell' | 'lore';

export const CampaignNPCSharingModal: React.FC<CampaignNPCSharingModalProps> = ({
  campaign,
  worldEntities = [],
  initialEntityId,
  initialCategory,
  onClose,
}) => {
  const { updateNPCDisclosure, createFeedEvent, feedEvents } = useCampaign();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(() => {
    if (initialCategory && ['npc', 'location', 'faction', 'item', 'spell', 'lore'].includes(initialCategory)) {
      return initialCategory as CategoryFilter;
    }
    if (initialEntityId) {
      const ent = worldEntities.find(e => e.id === initialEntityId);
      if (ent) {
        if (ent.category === 'npc' || (ent.category as string) === 'person') return 'npc';
        if (ent.category === 'location') return 'location';
        if (ent.category === 'faction') return 'faction';
        if (ent.category === 'item') return 'item';
        if (ent.category === 'spell') return 'spell';
        return 'lore';
      }
    }
    return 'all';
  });

  // Filtragem inicial por categoria e busca
  const categorizedEntities = useMemo(() => {
    if (selectedCategory === 'all') return worldEntities;
    if (selectedCategory === 'npc') {
      return worldEntities.filter((e) => e.category === 'npc' || (e.category as string) === 'person');
    }
    if (selectedCategory === 'location') {
      return worldEntities.filter((e) => e.category === 'location');
    }
    if (selectedCategory === 'faction') {
      return worldEntities.filter((e) => e.category === 'faction' || e.category === 'religion');
    }
    if (selectedCategory === 'item') {
      return worldEntities.filter((e) => e.category === 'item' || e.category === 'material' || e.category === 'technology');
    }
    if (selectedCategory === 'spell') {
      return worldEntities.filter((e) => e.category === 'spell' || e.category === 'magic_system');
    }
    // lore
    return worldEntities.filter(
      (e) => !['npc', 'person', 'location', 'faction', 'religion', 'item', 'material', 'technology', 'spell', 'magic_system'].includes(e.category)
    );
  }, [worldEntities, selectedCategory]);

  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    if (initialEntityId && worldEntities.some((e) => e.id === initialEntityId)) {
      return initialEntityId;
    }
    return worldEntities[0]?.id || '';
  });

  // Disclosures locais sincronizadas com a campanha
  const [localDisclosures, setLocalDisclosures] = useState<Record<string, CampaignNPCDisclosure>>(() => {
    return campaign.npcDisclosures || {};
  });

  // Mantém sincronizado sempre que a campanha recarregar ou for atualizada
  useEffect(() => {
    if (campaign.npcDisclosures && Object.keys(campaign.npcDisclosures).length > 0) {
      setLocalDisclosures((prev) => ({
        ...prev,
        ...campaign.npcDisclosures,
      }));
    }
  }, [campaign.npcDisclosures]);

  const selectedEntity = useMemo(() => {
    return worldEntities.find((e) => e.id === selectedEntityId) || categorizedEntities[0] || worldEntities[0] || null;
  }, [worldEntities, selectedEntityId, categorizedEntities]);

  const currentDisclosure: CampaignNPCDisclosure = useMemo(() => {
    if (!selectedEntity) {
      return { entityId: '', ...DEFAULT_DISCLOSURE };
    }
    const existing = localDisclosures[selectedEntity.id];
    if (existing) return existing;
    return {
      entityId: selectedEntity.id,
      ...DEFAULT_DISCLOSURE,
    };
  }, [selectedEntity, localDisclosures]);

  const filteredEntityList = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categorizedEntities;
    return categorizedEntities.filter(
      (ent) =>
        ent.name.toLowerCase().includes(q) ||
        (ent.subType || '').toLowerCase().includes(q) ||
        (ent.shortDesc || '').toLowerCase().includes(q) ||
        (ent.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }, [categorizedEntities, searchQuery]);

  const handleToggleField = (fieldName: keyof CampaignNPCDisclosure['revealedFields']) => {
    if (!selectedEntity) return;
    const current = currentDisclosure;
    const updated: CampaignNPCDisclosure = {
      ...current,
      revealedFields: {
        ...current.revealedFields,
        [fieldName]: !current.revealedFields[fieldName],
      },
    };
    setLocalDisclosures((prev) => ({
      ...prev,
      [selectedEntity.id]: updated,
    }));
  };

  const handleToggleShared = (isShared: boolean) => {
    if (!selectedEntity) return;
    const updated: CampaignNPCDisclosure = {
      ...currentDisclosure,
      isShared,
    };
    setLocalDisclosures((prev) => ({
      ...prev,
      [selectedEntity.id]: updated,
    }));
  };

  const handleAliasChange = (alias: string) => {
    if (!selectedEntity) return;
    const updated: CampaignNPCDisclosure = {
      ...currentDisclosure,
      alias,
    };
    setLocalDisclosures((prev) => ({
      ...prev,
      [selectedEntity.id]: updated,
    }));
  };

  const applyPreset = (preset: 'all' | 'rumor' | 'basic' | 'none') => {
    if (!selectedEntity) return;
    let revealedFields = { ...DEFAULT_DISCLOSURE.revealedFields };
    let isShared = true;

    if (preset === 'all') {
      revealedFields = {
        image: true,
        name: true,
        raceClass: true,
        shortDesc: true,
        fullContent: true,
        secrets: true,
        connections: true,
        statSheet: true,
        tags: true,
      };
    } else if (preset === 'rumor') {
      revealedFields = {
        image: false,
        name: false,
        raceClass: false,
        shortDesc: true,
        fullContent: false,
        secrets: false,
        connections: false,
        statSheet: false,
        tags: false,
      };
    } else if (preset === 'basic') {
      revealedFields = {
        image: true,
        name: true,
        raceClass: true,
        shortDesc: true,
        fullContent: true,
        secrets: false,
        connections: true,
        statSheet: false,
        tags: true,
      };
    } else if (preset === 'none') {
      isShared = false;
    }

    const updated: CampaignNPCDisclosure = {
      ...currentDisclosure,
      isShared,
      revealedFields,
    };

    setLocalDisclosures((prev) => ({
      ...prev,
      [selectedEntity.id]: updated,
    }));
  };

  const handleSaveCurrentEntity = async () => {
    if (!selectedEntity) return;

    const fullDisclosure: CampaignNPCDisclosure = {
      ...currentDisclosure,
      entitySnapshot: selectedEntity,
    };

    await updateNPCDisclosure(
      campaign.id,
      selectedEntity.id,
      fullDisclosure,
      selectedEntity.name
    );

    // Se estiver transmitindo a entidade, cria também um registro público no Feed da Campanha se ainda não houver
    if (currentDisclosure.isShared && createFeedEvent) {
      const publicName = currentDisclosure.revealedFields.name 
        ? selectedEntity.name 
        : (currentDisclosure.alias?.trim() || `${getCategoryLabel(selectedEntity.category)} Enigmático`);
      
      const isNpc = selectedEntity.category === 'npc' || (selectedEntity.category as string) === 'person';
      const eventType = isNpc ? 'npc_encounter' : 'world_lore';

      const alreadyHasEvent = (feedEvents || []).some(
        (ev) => ev.eventType === eventType && (ev.title?.includes(publicName) || ev.details?.entityId === selectedEntity.id)
      );

      if (!alreadyHasEvent) {
        const title = isNpc 
          ? `Encontro / Contato: ${publicName}`
          : `${getCategoryIconEmoji(selectedEntity.category)} ${getCategoryLabel(selectedEntity.category)} Revelado: ${publicName}`;

        await createFeedEvent({
          campaignId: campaign.id,
          eventType,
          title,
          summary: currentDisclosure.revealedFields.shortDesc && selectedEntity.shortDesc
            ? selectedEntity.shortDesc
            : `Um novo conhecimento sobre ${publicName} foi registrado no diário da jornada do grupo.`,
          isPublic: true,
          details: {
            entityId: selectedEntity.id,
            category: selectedEntity.category,
            origem: currentDisclosure.revealedFields.raceClass ? (selectedEntity.subType || getCategoryLabel(selectedEntity.category)) : 'Origem Oculta',
            status: 'Conhecido',
          },
        });
      }
    }
  };

  // Helper para ícones por categoria
  function getCategoryIcon(cat: WorldEntityCategory | string) {
    if (cat === 'npc' || cat === 'person') return <Users className="w-3.5 h-3.5 text-amber-400" />;
    if (cat === 'location') return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
    if (cat === 'faction' || cat === 'religion') return <Flag className="w-3.5 h-3.5 text-cyan-400" />;
    if (cat === 'item' || cat === 'material' || cat === 'technology') return <Gem className="w-3.5 h-3.5 text-yellow-400" />;
    if (cat === 'spell' || cat === 'magic_system') return <Flame className="w-3.5 h-3.5 text-purple-400" />;
    return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
  }

  function getCategoryIconEmoji(cat: WorldEntityCategory | string) {
    if (cat === 'npc' || cat === 'person') return '👤';
    if (cat === 'location') return '🏰';
    if (cat === 'faction' || cat === 'religion') return '🛡️';
    if (cat === 'item' || cat === 'material' || cat === 'technology') return '✨';
    if (cat === 'spell' || cat === 'magic_system') return '🔮';
    return '📜';
  }

  function getCategoryLabel(cat: WorldEntityCategory | string) {
    if (cat === 'npc' || cat === 'person') return 'NPC';
    if (cat === 'location') return 'Local';
    if (cat === 'faction') return 'Facção';
    if (cat === 'religion') return 'Religião';
    if (cat === 'item') return 'Item Mágico';
    if (cat === 'spell') return 'Feitiço';
    if (cat === 'lore_event') return 'Evento Histórico';
    if (cat === 'document') return 'Documento';
    return 'Lore do Mundo';
  }

  // Labels dinâmicos conforme categoria
  const isNpc = selectedEntity?.category === 'npc' || (selectedEntity?.category as string) === 'person';
  const isLocation = selectedEntity?.category === 'location';
  const isFaction = selectedEntity?.category === 'faction' || selectedEntity?.category === 'religion';
  const isSpellItem = selectedEntity?.category === 'item' || selectedEntity?.category === 'spell';

  const typeLabel = isNpc 
    ? 'Raça, Classe & Alinhamento' 
    : isLocation 
    ? 'Região, Assentamento & Clima' 
    : isFaction 
    ? 'Tipo de Organização & Dogmas' 
    : isSpellItem 
    ? 'Raridade, Escola & Propriedades' 
    : 'Categoria & Classificação';

  const fullContentLabel = isNpc 
    ? 'Biografia & História Completa' 
    : isLocation 
    ? 'Geografia, História & Pontos de Interesse' 
    : isFaction 
    ? 'História, Influência & Territórios' 
    : isSpellItem 
    ? 'Histórico, Efeitos & Encantamentos' 
    : 'Conteúdo & Texto Detalhado';

  const secretsLabel = isNpc 
    ? 'Segredos & Fraquezas Ocultas' 
    : isLocation 
    ? 'Perigos, Armadilhas & Segredos Ocultos' 
    : isFaction 
    ? 'Conspirações & Planos Secretos' 
    : isSpellItem 
    ? 'Maldições & Propriedades Ocultas' 
    : 'Segredos Confidenciais do Mestre';

  const statsLabel = isNpc 
    ? 'Ficha Técnica D&D 5e (Stat Block)' 
    : isLocation 
    ? 'Estatísticas de Exploração / CD do Local' 
    : isFaction 
    ? 'Recursos, Tropas & Poder Militar' 
    : isSpellItem 
    ? 'Ficha de Efeitos & Dano/Cura' 
    : 'Atributos & Dados Técnicos';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-3 md:p-4 animate-fade-in">
      <div className="bg-[#0c1018] border border-amber-500/40 rounded-2xl w-full h-full max-w-[1440px] max-h-[96vh] md:max-h-[94vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#252f44] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-2 font-serif">
                <span>Transmissão de Worldbuilding & Revelação Progressiva</span>
              </h3>
              <p className="text-xs text-slate-400">
                Campanha: <strong className="text-amber-400">{campaign.title}</strong> • Escolha quais segredos, NPCs, locais e lore os jogadores já descobriram
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#161c28] hover:bg-[#1f2738] border border-[#252f44] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Selector Tabs */}
        <div className="px-5 sm:px-6 py-2 bg-[#0a0d14] border-b border-[#252f44] flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-shrink-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Todos ({worldEntities.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('npc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'npc'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>NPCs ({worldEntities.filter(e => e.category === 'npc' || (e.category as string) === 'person').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('location')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'location'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Locais & Cidades ({worldEntities.filter(e => e.category === 'location').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('faction')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'faction'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Facções ({worldEntities.filter(e => e.category === 'faction' || e.category === 'religion').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('item')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'item'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>Itens Mágicos ({worldEntities.filter(e => e.category === 'item' || e.category === 'material').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('spell')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'spell'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Feitiços ({worldEntities.filter(e => e.category === 'spell' || e.category === 'magic_system').length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('lore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'lore'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-[#121824] hover:bg-[#1a2334] border border-[#252f44]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lore & Outros ({worldEntities.filter(e => !['npc', 'person', 'location', 'faction', 'religion', 'item', 'material', 'technology', 'spell', 'magic_system'].includes(e.category)).length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Entity Selector List */}
          <div className="w-full md:w-80 border-r border-[#252f44] bg-[#090d14] flex flex-col flex-shrink-0">
            {/* Search */}
            <div className="p-3 border-b border-[#252f44] bg-[#0c1018]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar no World Building..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#06080d] border border-[#252f44] focus:border-amber-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
              {filteredEntityList.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Nenhuma entrada encontrada para esta categoria ou busca.
                </div>
              ) : (
                filteredEntityList.map((ent) => {
                  const portrait = getEntityPortraitUrl(ent);
                  const isSelected = selectedEntity?.id === ent.id;
                  const disc = localDisclosures[ent.id];
                  const isShared = Boolean(disc?.isShared);

                  return (
                    <button
                      key={ent.id}
                      onClick={() => setSelectedEntityId(ent.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1a2334] border-amber-500 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-[#0f1420] border-[#252f44]/80 hover:border-slate-500 hover:bg-[#141a27]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/60 border border-slate-700 flex-shrink-0 flex items-center justify-center">
                          {portrait ? (
                            <img src={portrait} alt={ent.name} className="w-full h-full object-cover" />
                          ) : (
                            getCategoryIcon(ent.category)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {ent.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ent.subType || getCategoryLabel(ent.category)}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0 ${
                        isShared
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}>
                        {isShared ? '👁️ Ativo' : '🔒 Oculto'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Disclosure Editor & Live Preview */}
          {selectedEntity ? (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5 bg-[#0a0d14]">
              {/* Entity Header & Sharing Master Switch */}
              <div className="p-4 rounded-2xl bg-[#0f1522] border border-[#252f44] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-amber-500/40 flex-shrink-0 flex items-center justify-center">
                    {getEntityPortraitUrl(selectedEntity) ? (
                      <img
                        src={getEntityPortraitUrl(selectedEntity)}
                        alt={selectedEntity.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getCategoryIcon(selectedEntity.category)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-serif">
                        <span>{selectedEntity.name}</span>
                      </h2>
                      <span className="text-[10px] font-bold uppercase bg-[#0a0d14] text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
                        {getCategoryLabel(selectedEntity.category)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-0.5">
                      {selectedEntity.subType || getCategoryLabel(selectedEntity.category)} • {selectedEntity.shortDesc || 'Sem descrição resumida'}
                    </p>
                  </div>
                </div>

                {/* Master Switch Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleShared(!currentDisclosure.isShared)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                      currentDisclosure.isShared
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                        : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {currentDisclosure.isShared ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{currentDisclosure.isShared ? 'Transmitindo para Jogadores' : 'Oculto da Campanha'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#111724] border border-[#252f44] rounded-xl">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Predefinições Rápidas:</span>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => applyPreset('all')}
                    className="px-2.5 py-1 bg-[#1a2334] hover:bg-[#25324a] text-amber-300 rounded-lg text-xs font-bold transition-all border border-amber-500/30 cursor-pointer"
                  >
                    👑 Revelar Tudo
                  </button>
                  <button
                    onClick={() => applyPreset('basic')}
                    className="px-2.5 py-1 bg-[#1a2334] hover:bg-[#25324a] text-cyan-300 rounded-lg text-xs font-bold transition-all border border-cyan-500/30 cursor-pointer"
                  >
                    📜 Básico (Nome + Descrição)
                  </button>
                  <button
                    onClick={() => applyPreset('rumor')}
                    className="px-2.5 py-1 bg-[#1a2334] hover:bg-[#25324a] text-purple-300 rounded-lg text-xs font-bold transition-all border border-purple-500/30 cursor-pointer"
                  >
                    🕵️ Apenas Rumor
                  </button>
                  <button
                    onClick={() => applyPreset('none')}
                    className="px-2.5 py-1 bg-[#1a2334] hover:bg-rose-950/60 text-rose-300 rounded-lg text-xs font-bold transition-all border border-rose-500/30 cursor-pointer"
                  >
                    🔒 Ocultar
                  </button>
                </div>
              </div>

              {/* Field-by-Field Granular Switches */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Controle Campo a Campo (O que os jogadores podem ver):</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Imagem / Retrato / Mapa */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isNpc ? 'Retrato & Galeria de Fotos' : 'Ilustração Visual & Galeria'}</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.image
                          ? 'A arte/foto está visível aos jogadores.'
                          : 'Oculta: Exibe silhueta sombria misteriosa.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('image')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.image
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                      title={currentDisclosure.revealedFields.image ? 'Ocultar Imagem' : 'Revelar Imagem'}
                    >
                      {currentDisclosure.revealedFields.image ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 2. Nome Real / Pseudônimo */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Nome Verdadeiro ({selectedEntity.name})</span>
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {currentDisclosure.revealedFields.name
                            ? 'Nome real revelado.'
                            : 'Nome secreto (usando pseudônimo).'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleField('name')}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          currentDisclosure.revealedFields.name
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                        title={currentDisclosure.revealedFields.name ? 'Ocultar Nome Real' : 'Revelar Nome Real'}
                      >
                        {currentDisclosure.revealedFields.name ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>

                    {!currentDisclosure.revealedFields.name && (
                      <div className="mt-1">
                        <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                          Pseudônimo / Codinome conhecido pelos jogadores:
                        </label>
                        <input
                          type="text"
                          placeholder={isNpc ? "Ex: A Figura Encapuzada..." : isLocation ? "Ex: As Ruínas Antigas..." : "Ex: O Artefato Desconhecido..."}
                          value={currentDisclosure.alias || ''}
                          onChange={(e) => handleAliasChange(e.target.value)}
                          className="w-full px-2.5 py-1 bg-[#06080d] border border-amber-500/40 focus:border-amber-400 rounded-lg text-xs text-amber-300 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Tipo / Subtipo */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{typeLabel}</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.raceClass ? 'Visível na ficha pública.' : 'Oculto: Exibe "???" aos jogadores.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('raceClass')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.raceClass
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentDisclosure.revealedFields.raceClass ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 4. Resumo & Primeira Impressão */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Scroll className="w-3.5 h-3.5 text-amber-400" />
                        <span>Resumo / Primeira Impressão</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.shortDesc ? 'Sinopse curta visível.' : 'Oculto.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('shortDesc')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.shortDesc
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentDisclosure.revealedFields.shortDesc ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 5. Biografia & Lore Completo */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                        <span>{fullContentLabel}</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.fullContent ? 'Histórico narrativo liberado.' : 'Oculto: Permanece confidencial do Mestre.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('fullContent')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.fullContent
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentDisclosure.revealedFields.fullContent ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 6. Segredos & Motivações */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        <span>{secretsLabel}</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.secrets ? '🚨 Segredos revelados ao grupo!' : '🔒 Protegido (apenas o DM vê).'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('secrets')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.secrets
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentDisclosure.revealedFields.secrets ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 7. Conexões & Relacionamentos */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Conexões & Vínculos com o Mundo</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.connections ? 'Vínculos e relações reveladas.' : 'Vínculos ocultos.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('connections')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.connections
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentDisclosure.revealedFields.connections ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 8. Ficha Técnica / Atributos */}
                  <div className="p-3 bg-[#0e131d] border border-[#252f44] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        <span>{statsLabel}</span>
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {currentDisclosure.revealedFields.statSheet ? 'Estatísticas de regras visíveis.' : 'Dados de regras ocultos.'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleField('statSheet')}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        currentDisclosure.revealedFields.statSheet
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {currentDisclosure.revealedFields.statSheet ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Save Bar */}
              <div className="mt-auto pt-4 border-t border-[#252f44] flex items-center justify-between gap-4">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>As alterações são transmitidas em tempo real para os jogadores conectados.</span>
                </p>

                <button
                  onClick={handleSaveCurrentEntity}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Permissões de {selectedEntity.name}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-500">
              Selecione uma entrada de Worldbuilding para configurar suas permissões de visualização.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CampaignWorldSharingModal = CampaignNPCSharingModal;
