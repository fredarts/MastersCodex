'use client';

import React, { useState } from 'react';
import { 
  Globe,
  Swords, 
  Map, 
  Sparkles, 
  Network, 
  BookOpen, 
  Music, 
  BookmarkCheck,
  FolderOpen,
  Plus,
  Crown,
  Settings,
  Film,
  Tv,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar
} from 'lucide-react';
import { Encounter } from '@/lib/types';
import { INITIAL_ENCOUNTERS } from '@/lib/srd-data';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';

export type ActiveTab = 'worldbuilder' | 'session_studio' | 'campaign_settings' | 'calendar' | 'live_cockpit' | 'combat' | 'map' | 'ai' | 'lore' | 'compendium' | 'audio';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLoadEncounter: (encounter: Encounter) => void;
  onOpenCreateCampaign: () => void;
  onLoadDemoEverything: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLoadEncounter,
  onOpenCreateCampaign,
  onLoadDemoEverything,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { userCampaigns, activeCampaign, setActiveCampaign, updateCampaign } = useCampaign();
  const { userWorlds, activeWorld, setActiveWorld, updateWorld } = useWorld();
  const [isEditingWorld, setIsEditingWorld] = useState(false);
  const [editedWorldTitle, setEditedWorldTitle] = useState('');
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [editedCampaignTitle, setEditedCampaignTitle] = useState('');
  const [showOtherWorldsCampaigns, setShowOtherWorldsCampaigns] = useState(false);

  // All DM campaigns
  const allDmCampaigns = userCampaigns.filter((c) => c.role === 'dm');

  // Campaigns belonging to the active world (or unassigned one-shots)
  const dmCampaigns = userCampaigns.filter((c) => {
    if (c.role !== 'dm') return false;
    if (!activeWorld) return true;
    return !c.worldId || c.worldId === activeWorld.id;
  });

  // Other campaigns from different worlds
  const otherCampaigns = userCampaigns.filter((c) => {
    if (c.role !== 'dm') return false;
    return activeWorld && c.worldId && c.worldId !== activeWorld.id;
  });

  const handleSaveWorldTitle = async () => {
    if (activeWorld && editedWorldTitle.trim()) {
      await updateWorld({ ...activeWorld, title: editedWorldTitle.trim() });
    }
    setIsEditingWorld(false);
  };

  const handleSaveCampaignTitle = async () => {
    if (activeCampaign && editedCampaignTitle.trim()) {
      await updateCampaign({ ...activeCampaign, title: editedCampaignTitle.trim() });
    }
    setIsEditingCampaign(false);
  };

  const handleSelectOtherCampaign = (camp: typeof userCampaigns[0]) => {
    if (camp.worldId) {
      const matchingWorld = userWorlds.find((w) => w.id === camp.worldId);
      if (matchingWorld) setActiveWorld(matchingWorld);
    }
    setActiveCampaign(camp);
  };

  const navigationHubs = [
    {
      title: '🌍 Estúdio de Mundos',
      items: [
        { id: 'worldbuilder', label: 'Mundos & Lore Graph', icon: Globe, color: 'text-amber-400' },
      ],
    },
    {
      title: '📜 Gestão da Campanha',
      items: [
        { id: 'calendar', label: 'Calendário & Crônica', icon: Calendar, color: 'text-amber-400 font-bold' },
        { id: 'session_studio', label: 'Estúdio de Sessões', icon: Film, color: 'text-indigo-400' },
        { id: 'campaign_settings', label: 'Painel da Campanha', icon: Settings, color: 'text-purple-400' },
      ],
    },
    {
      title: '⚔️ Sessão Ao Vivo (Cockpit)',
      items: [
        { id: 'live_cockpit', label: 'Estúdio Sessão ao Vivo', icon: Tv, color: 'text-rose-400 font-bold' },
        { id: 'combat', label: 'Combat Tracker', icon: Swords, color: 'text-rose-400' },
        { id: 'map', label: 'Map Maker & Grid', icon: Map, color: 'text-cyan-400' },
        { id: 'ai', label: 'IA Co-Mestre', icon: Sparkles, color: 'text-amber-300' },
        { id: 'audio', label: 'Audio Maestro', icon: Music, color: 'text-pink-400' },
      ],
    },
    {
      title: '📚 Referência Universal',
      items: [
        { id: 'compendium', label: 'Compêndio SRD 5e', icon: BookOpen, color: 'text-blue-400' },
      ],
    },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-[#0f141d] border-r border-[#2a3449] flex flex-col justify-between select-none transition-all duration-300 flex-shrink-0 z-10 relative`}>
      <div className={`p-2 ${isCollapsed ? 'px-1.5' : 'p-3'} space-y-3 overflow-y-auto overflow-x-hidden`}>
        {/* Toggle Collapse Bar Button */}
        {onToggleCollapse && (
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} pb-1 border-b border-[#2a3449]/50`}>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-400 hover:text-amber-400 border border-[#2a3449] rounded-lg transition-all cursor-pointer"
              title={isCollapsed ? "Expandir Sidebar (Menu Completo)" : "Retrair Sidebar (Modo Ícones)"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* World indicator & Switcher */}
        {activeWorld && (
          isCollapsed ? (
            <div className="flex justify-center" title={`Mundo Ativo: ${activeWorld.title}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-amber-950/60 to-[#161c28] border border-amber-500/40 rounded-xl flex items-center justify-center text-amber-400 shadow">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-gradient-to-r from-amber-950/40 to-[#161c28] border border-amber-500/30 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-amber-400 font-mono flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-amber-400" />
                  <span>MUNDO ATIVO:</span>
                </div>
                {!isEditingWorld && (
                  <button
                    onClick={() => {
                      setIsEditingWorld(true);
                      setEditedWorldTitle(activeWorld.title);
                    }}
                    className="text-slate-400 hover:text-amber-300 transition-colors p-0.5"
                    title="Editar Nome do Mundo"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditingWorld ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={editedWorldTitle}
                    onChange={(e) => setEditedWorldTitle(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveWorldTitle();
                      if (e.key === 'Escape') setIsEditingWorld(false);
                    }}
                  />
                  <button onClick={handleSaveWorldTitle} className="p-1 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : userWorlds.length > 1 ? (
                <select
                  value={activeWorld.id}
                  onChange={(e) => {
                    const selected = userWorlds.find((w) => w.id === e.target.value);
                    if (selected) setActiveWorld(selected);
                  }}
                  className="w-full bg-transparent text-xs font-bold text-slate-100 truncate mt-0.5 focus:outline-none cursor-pointer"
                  title="Trocar Mundo Ativo"
                >
                  {userWorlds.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#161c28] text-slate-200">
                      {w.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs font-bold text-slate-100 truncate mt-0.5">{activeWorld.title}</div>
              )}
            </div>
          )
        )}

        {/* Active Campaign Selector & Switcher */}
        {!isCollapsed && (
          allDmCampaigns.length === 0 ? (
            <div className="p-3 bg-[#161c28] border border-dashed border-[#2a3449] rounded-xl text-center space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Nenhuma campanha cadastrada.</p>
              <button
                onClick={onOpenCreateCampaign}
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg shadow cursor-pointer"
              >
                + Iniciar Campanha
              </button>
              <button
                onClick={onLoadDemoEverything}
                className="w-full py-1 bg-[#0f141d] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 text-[10px] rounded border border-[#2a3449] cursor-pointer"
              >
                Carregar Exemplo de Demo
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-gradient-to-r from-[#161c28] to-[#121722] border border-[#2a3449] hover:border-amber-500/30 rounded-xl transition-all">
              <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>MESA / CAMPANHA:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeCampaign && !isEditingCampaign && (
                    <button
                      onClick={() => {
                        setIsEditingCampaign(true);
                        setEditedCampaignTitle(activeCampaign.title);
                      }}
                      className="text-slate-400 hover:text-amber-300 transition-colors p-0.5"
                      title="Editar Nome da Campanha"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={onOpenCreateCampaign}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 text-[10px] font-bold font-sans hover:underline cursor-pointer"
                    title="Criar nova campanha"
                  >
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                </div>
              </div>

              {isEditingCampaign && activeCampaign ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={editedCampaignTitle}
                    onChange={(e) => setEditedCampaignTitle(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCampaignTitle();
                      if (e.key === 'Escape') setIsEditingCampaign(false);
                    }}
                  />
                  <button onClick={handleSaveCampaignTitle} className="p-1 text-emerald-400 hover:text-emerald-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : allDmCampaigns.length > 1 ? (
                <select
                  value={activeCampaign?.id || ''}
                  onChange={(e) => {
                    const selected = userCampaigns.find((c) => c.id === e.target.value);
                    if (selected) {
                      if (selected.worldId && selected.worldId !== activeWorld?.id) {
                        const matchingWorld = userWorlds.find((w) => w.id === selected.worldId);
                        if (matchingWorld) setActiveWorld(matchingWorld);
                      }
                      setActiveCampaign(selected);
                    }
                  }}
                  className="w-full bg-transparent text-xs font-bold text-slate-100 truncate mt-0.5 focus:outline-none cursor-pointer"
                  title="Trocar Campanha Ativa"
                >
                  {!activeCampaign && (
                    <option value="" disabled className="bg-[#161c28] text-slate-400">
                      Selecione uma campanha
                    </option>
                  )}
                  {otherCampaigns.length > 0 ? (
                    <>
                      {dmCampaigns.length > 0 && (
                        <optgroup label="Mundo Atual" className="bg-[#161c28] text-amber-400/80 font-mono text-[10px]">
                          {dmCampaigns.map((camp) => (
                            <option key={camp.id} value={camp.id} className="bg-[#161c28] text-slate-200 text-xs font-sans">
                              {camp.title}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Outros Mundos" className="bg-[#161c28] text-slate-400 font-mono text-[10px]">
                        {otherCampaigns.map((camp) => {
                          const campWorld = userWorlds.find((w) => w.id === camp.worldId);
                          return (
                            <option key={camp.id} value={camp.id} className="bg-[#161c28] text-slate-200 text-xs font-sans">
                              {camp.title} {campWorld ? `(${campWorld.title})` : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    </>
                  ) : (
                    dmCampaigns.map((camp) => (
                      <option key={camp.id} value={camp.id} className="bg-[#161c28] text-slate-200">
                        {camp.title}
                      </option>
                    ))
                  )}
                </select>
              ) : activeCampaign ? (
                <div className="text-xs font-bold text-slate-100 truncate mt-0.5">{activeCampaign.title}</div>
              ) : (
                <div className="text-xs font-bold text-slate-400 truncate mt-0.5">Nenhuma campanha</div>
              )}
            </div>
          )
        )}

        {/* In Collapsed mode, render a simple crown icon for active campaign */}
        {isCollapsed && (
          <div className="flex justify-center" title={`Mesa Ativa: ${activeCampaign ? activeCampaign.title : 'Nenhuma'}`}>
            <button
              onClick={onOpenCreateCampaign}
              className="w-10 h-10 bg-[#161c28] border border-amber-500/30 hover:border-amber-400 rounded-xl flex items-center justify-center text-amber-400 transition-all cursor-pointer"
            >
              <Crown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Hub Navigation Groups */}
        <div className="space-y-3 pt-1">
          {navigationHubs.map((hub) => (
            <div key={hub.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase font-mono">
                  {hub.title}
                </div>
              )}
              <div className="space-y-1">
                {hub.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      title={item.label}
                      className={`flex items-center rounded-xl font-semibold transition-all ${
                        isCollapsed
                          ? 'w-10 h-10 mx-auto justify-center'
                          : 'w-full gap-2.5 px-3 py-2 text-xs'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-[#1a2234] to-[#161c28] text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                      {!isCollapsed && <span>{item.label}</span>}
                      {!isCollapsed && isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cenas Modelo */}
        {!isCollapsed ? (
          <>
            <div className="pt-3 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
              <FolderOpen className="w-3 h-3 text-slate-400" /> Cenas Modelo
            </div>
            <div className="space-y-1">
              {INITIAL_ENCOUNTERS.map((enc) => (
                <button
                  key={enc.id}
                  onClick={() => onLoadEncounter(enc)}
                  className="w-full text-left px-3 py-2 rounded-md bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-xs text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate pr-2 font-medium">{enc.name}</span>
                  <BookmarkCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="pt-2 flex justify-center" title="Cenas Modelo (Carregar Exemplo)">
            <button
              onClick={() => onLoadEncounter(INITIAL_ENCOUNTERS[0])}
              className="w-10 h-10 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-300 transition-all"
            >
              <FolderOpen className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className={`p-2 border-t border-[#2a3449] bg-[#07090e]/60 ${isCollapsed ? 'text-center' : 'p-3'}`}>
        {isCollapsed ? (
          <span className="text-[10px] font-mono font-bold text-amber-500" title="D&D 5e SRD v5.1">5e</span>
        ) : (
          <div className="bg-[#161c28] border border-[#2a3449] rounded-lg p-2.5">
            <div className="text-[11px] font-semibold text-slate-300">D&D 5e SRD v5.1</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Licença OGL / Creative Commons.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
