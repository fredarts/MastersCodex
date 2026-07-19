'use client';

import React from 'react';
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
  Film
} from 'lucide-react';
import { Encounter } from '@/lib/types';
import { INITIAL_ENCOUNTERS } from '@/lib/srd-data';
import { useAuth } from '@/context/AuthContext';

export type ActiveTab = 'worldbuilder' | 'session_studio' | 'campaign_settings' | 'combat' | 'map' | 'ai' | 'lore' | 'compendium' | 'audio';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onLoadEncounter: (encounter: Encounter) => void;
  onOpenCreateCampaign: () => void;
  onLoadDemoEverything: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onLoadEncounter,
  onOpenCreateCampaign,
  onLoadDemoEverything,
}) => {
  const { userCampaigns, activeCampaign, setActiveCampaign, activeWorld } = useAuth();
  const dmCampaigns = userCampaigns.filter((c) => c.role === 'dm');

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
        { id: 'session_studio', label: 'Estúdio de Sessões', icon: Film, color: 'text-indigo-400' },
        { id: 'campaign_settings', label: 'Painel da Campanha', icon: Settings, color: 'text-purple-400' },
      ],
    },
    {
      title: '⚔️ Sessão Ao Vivo (Cockpit)',
      items: [
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
    <aside className="w-64 bg-[#0f141d] border-r border-[#2a3449] flex flex-col justify-between select-none">
      <div className="p-3 space-y-3 overflow-y-auto">
        {/* World indicator */}
        {activeWorld && (
          <div className="p-2.5 bg-gradient-to-r from-amber-950/40 to-[#161c28] border border-amber-500/30 rounded-xl">
            <div className="text-[10px] font-bold uppercase text-amber-400 font-mono">MUNDO ATIVO:</div>
            <div className="text-xs font-bold text-slate-100 truncate">{activeWorld.title}</div>
          </div>
        )}

        {/* Active Campaigns List & Create Button */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <span>Mesas / Campanhas</span>
            <button
              onClick={onOpenCreateCampaign}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-0.5 text-[10px]"
              title="Criar nova campanha"
            >
              <Plus className="w-3 h-3" /> Nova
            </button>
          </div>

          {dmCampaigns.length === 0 ? (
            <div className="p-3 bg-[#161c28] border border-dashed border-[#2a3449] rounded-xl text-center space-y-2">
              <p className="text-xs text-slate-400 font-semibold">Nenhuma campanha criada.</p>
              <button
                onClick={onOpenCreateCampaign}
                className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg shadow"
              >
                + Iniciar Campanha
              </button>
              <button
                onClick={onLoadDemoEverything}
                className="w-full py-1 bg-[#0f141d] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 text-[10px] rounded border border-[#2a3449]"
              >
                Carregar Exemplo de Demo
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {dmCampaigns.map((camp) => {
                const isActive = activeCampaign?.id === camp.id;
                return (
                  <button
                    key={camp.id}
                    onClick={() => setActiveCampaign(camp)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738]'
                    }`}
                  >
                    <span className="truncate">{camp.title}</span>
                    <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 ml-1" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hub Navigation Groups */}
        <div className="space-y-3 pt-1">
          {navigationHubs.map((hub) => (
            <div key={hub.title} className="space-y-1">
              <div className="px-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase font-mono">
                {hub.title}
              </div>
              <div className="space-y-0.5">
                {hub.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as ActiveTab)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#1a2234] to-[#161c28] text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

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
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#2a3449] bg-[#07090e]/60">
        <div className="bg-[#161c28] border border-[#2a3449] rounded-lg p-2.5">
          <div className="text-[11px] font-semibold text-slate-300">D&D 5e SRD v5.1</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Licença OGL / Creative Commons.
          </div>
        </div>
      </div>
    </aside>
  );
};
