'use client';

import React, { useState } from 'react';
import { Shield, Search, Tv, Dices, User, LogIn, Crown, Swords, Database, Key, PanelLeft, Sparkles, Menu, Settings, LogOut, Gift, Mic, MicOff, Video, VideoOff, PhoneCall, Radio, Headphones, Store, ChevronDown, Layers, Play, BookOpen, Smartphone, Scroll } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { useAudio } from '@/context/AudioContext';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useVoiceCall } from '@/context/VoiceCallContext';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';
import { MerchantForgeModal } from '@/components/merchant/MerchantForgeModal';
import { BG3MerchantModal } from '@/components/merchant/BG3MerchantModal';
import { MerchantShop } from '@/lib/merchant/merchantTypes';
import { CharacterSheet } from '@/lib/types';
import { DetectivePinboardModal } from '@/components/investigation/DetectivePinboardModal';
import { DMNotebookDrawer } from '@/components/live-cockpit/DMNotebookDrawer';
import { StreamerOverlayModal } from '@/components/overlay/config/StreamerOverlayModal';
import { CompanionQrModal } from '@/components/companion/CompanionQrModal';
import { HouseRulesModal } from '@/components/modals/HouseRulesModal';
import { normalizeHouseRules } from '@/lib/types/houseRules';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenPlayerView: () => void;
  onOpenAuthModal: () => void;
  onOpenSettings?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isAIPanelCollapsed?: boolean;
  onToggleAIPanel?: () => void;
  onGoToLandingPage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenPlayerView,
  onOpenAuthModal,
  onOpenSettings,
  isSidebarCollapsed,
  onToggleSidebar,
  isAIPanelCollapsed,
  onToggleAIPanel,
  onGoToLandingPage,
}) => {
  const { user, roleMode, setRoleMode, signOut } = useAuth();
  const { activeCampaign } = useCampaign();
  const { activeWorld } = useWorld();
  const { playDiceSound } = useAudio();
  const { setIsPartyLootModalOpen, activeLootSession, isOnPlayerCampaignView } = usePartyLoot();
  const { isInCall, isConnecting, isMuted, isSpeaking, isVideoEnabled, toggleVideo, joinCall, toggleMute, setIsWidgetOpen, participants, activeCallPeersCount } = useVoiceCall();
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [lastDiceType, setLastDiceType] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMerchantForgeOpen, setIsMerchantForgeOpen] = useState(false);
  const [isPinboardOpen, setIsPinboardOpen] = useState(false);
  const [activeTradeShop, setActiveTradeShop] = useState<MerchantShop | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isStreamerOverlayOpen, setIsStreamerOverlayOpen] = useState(false);
  const [isCompanionQrOpen, setIsCompanionQrOpen] = useState(false);
  const [isHouseRulesOpen, setIsHouseRulesOpen] = useState(false);

  const previewSheet: CharacterSheet = {
    id: 'dm-preview-character',
    characterName: 'Mestre da Mesa',
    className: 'Aventureiro',
    level: 1,
    currency: { po: 500, pl: 0, pe: 0, pp: 0, pc: 0 },
    equipment: [],
  } as any;

  // O jogador só está dentro de uma campanha quando selecionou uma mesa específica
  const isInsideCampaign = roleMode === 'dm' ? !!activeCampaign : (!!activeCampaign && isOnPlayerCampaignView);

  const rollDice = (sides: number) => {
    const res = Math.floor(Math.random() * sides) + 1;
    playDiceSound(1);
    setDiceResult(res);
    setLastDiceType(`d${sides}`);
  };

  return (
    <header className="h-16 bg-[#0f141d] border-b border-[#2a3449] px-4 flex items-center justify-between shadow-lg relative z-50 select-none">
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Left Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-amber-400 border border-[#2a3449] hover:border-amber-500/50 rounded-xl transition-all cursor-pointer"
            title={isSidebarCollapsed ? "Expandir Menu Lateral (Sidebar)" : "Retrair Menu Lateral (Sidebar)"}
          >
            <PanelLeft className={`w-5 h-5 transition-transform duration-200 ${isSidebarCollapsed ? '' : 'text-amber-400'}`} />
          </button>
        )}

        <div 
          onClick={onGoToLandingPage} 
          className={`flex items-center gap-2.5 ${onGoToLandingPage ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
          title={onGoToLandingPage ? "Voltar para a Página Inicial / Landing Page" : undefined}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
            <img src="/logo.png" alt="Master's Codex Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm md:text-base tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                Master's <span className="text-amber-500">Codex</span>
              </h1>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                D&D 5e
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${activeCampaign && (!activeWorld || activeCampaign.worldId === activeWorld.id) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></span>
                Mesa: <span className="text-amber-300 font-semibold">{activeCampaign && (!activeWorld || activeCampaign.worldId === activeWorld.id) ? activeCampaign.title : 'Nenhuma'}</span>
              </span>
              {activeWorld && (
                <span className="hidden md:inline-block text-[11px] text-slate-400 border-l border-[#2a3449] pl-2 font-mono">
                  Mundo: <span className="text-amber-400/90 font-medium">{activeWorld.title}</span>
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Dice Roller */}
        <div className="hidden xl:flex items-center gap-1 bg-[#161c28] border border-[#2a3449] rounded-lg p-1">
          <span className="text-xs text-slate-400 px-2 flex items-center gap-1 font-mono">
            <Dices className="w-3.5 h-3.5 text-amber-400" /> Dado:
          </span>
          {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
            <button
              key={sides}
              onClick={() => rollDice(sides)}
              className="text-xs font-mono font-semibold px-2 py-1 bg-[#1f2738] hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 rounded transition-all active:scale-95"
            >
              d{sides}
            </button>
          ))}
          {diceResult !== null && (
            <div className="ml-2 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold font-mono text-sm rounded shadow-sm flex items-center gap-1 animate-bounce">
              <span>{lastDiceType}:</span>
              <span className="text-base">{diceResult}</span>
            </div>
          )}
        </div>

        {/* DM Omnibar & Command Palette (Alt+K) */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', altKey: true, bubbles: true }));
            }
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-amber-600/20 hover:from-amber-500/25 hover:to-amber-600/35 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all group cursor-pointer shadow-sm"
          title="Abrir Command Palette & Omnibar do Mestre (Alt+K ou /)"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Comandos</span>
          <kbd className="hidden lg:inline-block bg-[#0f141d]/90 border border-amber-500/30 text-[10px] text-amber-300/90 px-1.5 py-0.5 rounded font-mono">
            Alt + K
          </kbd>
        </button>

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-amber-400 border border-[#2a3449] hover:border-amber-500/50 px-3 py-1.5 rounded-lg text-xs font-medium transition-all group cursor-pointer"
        >
          <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Compêndio</span>
          <kbd className="hidden lg:inline-block bg-[#0f141d] border border-[#2a3449] text-[10px] text-slate-400 px-1.5 py-0.5 rounded font-mono">
            Ctrl + Espaço
          </kbd>
        </button>

        {/* Live Call Widget Bar (Shown only when in active call) */}
        {isInCall && (
          <div className="flex items-center gap-1 bg-[#121824] border border-emerald-500/40 rounded-xl p-1 shadow-sm animate-fade-in">
            <button
              onClick={() => setIsWidgetOpen((prev: boolean) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 transition-all cursor-pointer"
              title="Abrir Painel da Chamada de Voz e Vídeo"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">Em Chamada</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                {participants.length}
              </span>
            </button>
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                  : isSpeaking
                  ? 'bg-emerald-500/20 text-emerald-300 animate-pulse'
                  : 'text-slate-300 hover:text-white hover:bg-[#1f2738]'
              }`}
              title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={() => toggleVideo()}
              className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                isVideoEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#1f2738]'
              }`}
              title={isVideoEnabled ? 'Desligar Câmera / Webcam' : 'Ligar Câmera / Webcam'}
            >
              {isVideoEnabled ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {/* Grouped Tools & Actions Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setIsToolsMenuOpen(!isToolsMenuOpen);
              if (isDropdownOpen) setIsDropdownOpen(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isToolsMenuOpen || (activeLootSession && activeLootSession.status === 'active')
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-950/40'
                : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:text-amber-400 hover:border-amber-500/50'
            }`}
            title="Abrir Menu de Ferramentas e Recursos da Mesa"
          >
            <div className="relative flex items-center justify-center">
              <Layers className="w-4 h-4 text-amber-400" />
              {activeLootSession && activeLootSession.status === 'active' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-1 -right-1" />
              )}
            </div>
            <span className="hidden sm:inline">Recursos</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </button>

          {isToolsMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-[100]" 
                onClick={() => setIsToolsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-[#121824] border border-[#2a3449] rounded-2xl shadow-2xl z-[110] p-2 space-y-1 animate-fade-in backdrop-blur-md">
                <div className="px-3 py-1.5 border-b border-[#2a3449]/80 mb-1 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
                    Recursos da Mesa
                  </span>
                  {activeCampaign && (
                    <span className="text-[10px] text-amber-400 font-semibold truncate max-w-[120px]">
                      {activeCampaign.title}
                    </span>
                  )}
                </div>

                {/* Tela dos Jogadores */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    onOpenPlayerView();
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-amber-300">Tela dos Jogadores</span>
                      <span className="text-[10px] text-slate-400 font-normal">Janela de projeção secundária</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    PROJEÇÃO
                  </span>
                </button>

                {/* Pocket Companion Mobile */}
                <button
                  onClick={() => {
                    setIsToolsMenuOpen(false);
                    setIsCompanionQrOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-emerald-300">Pocket Companion</span>
                      <span className="text-[10px] text-slate-400 font-normal">Modo celular tátil sem 3D</span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    MOBILE
                  </span>
                </button>

                {/* Caderno DM */}
                {roleMode === 'dm' && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsNotebookOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-amber-300">Caderno DM</span>
                      <span className="text-[10px] text-slate-400 font-normal">Anotações rápidas & lore da mesa</span>
                    </div>
                  </button>
                )}

                {/* Overlay OBS */}
                {roleMode === 'dm' && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsStreamerOverlayOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-indigo-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                      <Video className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-indigo-300">Overlay OBS</span>
                      <span className="text-[10px] text-slate-400 font-normal">Transmissão ao vivo & stream HUD</span>
                    </div>
                  </button>
                )}

                <div className="border-t border-[#2a3449]/60 my-1" />

                {/* Baú da Party */}
                {isInsideCampaign && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsPartyLootModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20">
                        <Gift className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 group-hover:text-amber-300">Baú da Party</span>
                        <span className="text-[10px] text-slate-400 font-normal">Itens e moedas compartilhadas</span>
                      </div>
                    </div>
                    {activeLootSession && activeLootSession.status === 'active' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-slate-950 animate-pulse font-mono">
                        ATIVO
                      </span>
                    )}
                  </button>
                )}

                {/* Merchant Forge (Lojas & Economia) */}
                {isInsideCampaign && roleMode === 'dm' && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsMerchantForgeOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-amber-300">Lojas & Barter</span>
                      <span className="text-[10px] text-slate-400 font-normal">Criar e gerenciar economia</span>
                    </div>
                  </button>
                )}

                {/* Regras da Casa & Diretrizes */}
                {isInsideCampaign && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsHouseRulesOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                        <Scroll className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 group-hover:text-amber-300">Regras da Casa</span>
                        <span className="text-[10px] text-slate-400 font-normal">Mecânicas & acordos da mesa</span>
                      </div>
                    </div>
                    {activeCampaign?.houseRules && normalizeHouseRules(activeCampaign.houseRules).filter(r => r.isActive).length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                        {normalizeHouseRules(activeCampaign.houseRules).filter(r => r.isActive).length} REGRAS
                      </span>
                    )}
                  </button>
                )}

                {/* Mural de Investigação & Pistas */}
                {isInsideCampaign && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      setIsPinboardOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-900/20 border border-amber-800/40 text-amber-300 group-hover:bg-amber-900/40">
                      <span className="text-xs">🕵️</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-200 group-hover:text-amber-300">Mural de Pistas</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pistas, suspeitos & conexões</span>
                    </div>
                  </button>
                )}

                {/* Chamada de Voz e Vídeo (quando não estiver em chamada ativa) */}
                {!isInCall && (
                  <button
                    onClick={() => {
                      setIsToolsMenuOpen(false);
                      joinCall();
                    }}
                    disabled={isConnecting}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-emerald-300 hover:bg-emerald-950/20 rounded-xl transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200 group-hover:text-emerald-300">
                          {isConnecting ? 'Conectando...' : 'Chamada de Voz/Vídeo'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {activeCallPeersCount > 0 ? `${activeCallPeersCount} participantes ativos` : 'Conectar com a mesa'}
                        </span>
                      </div>
                    </div>
                    {activeCallPeersCount > 0 && (
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                        {activeCallPeersCount} online
                      </span>
                    )}
                  </button>
                )}

                <div className="border-t border-[#2a3449]/60 my-1" />

                {/* PWA Install Button as menu item */}
                <PWAInstallButton variant="menu-item" />
              </div>
            </>
          )}
        </div>

        {/* User Account / Auth Button */}
        {user ? (
          <div className="relative">
            {/* Circular Avatar Trigger Button */}
            <button
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                if (isToolsMenuOpen) setIsToolsMenuOpen(false);
              }}
              className="w-9 h-9 rounded-full bg-[#161c28] hover:bg-[#1f2738] border-2 border-amber-500/40 hover:border-amber-400 flex items-center justify-center transition-all cursor-pointer shadow-md overflow-hidden hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              title={`Conta de ${user.displayName}`}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xs text-amber-400 font-mono">
                  {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[100]" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-2xl z-[110] p-2 overflow-hidden animate-fade-in backdrop-blur-md">
                  {/* User Profile Card Header */}
                  <div className="p-2.5 bg-[#0f141d] border border-[#2a3449]/80 rounded-xl mb-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-sm text-amber-400 font-mono overflow-hidden shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'US'
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-100 truncate">{user.displayName}</span>
                      {user.email && (
                        <span className="text-[10px] text-slate-400 truncate font-mono">{user.email}</span>
                      )}
                      <span className="text-[9px] font-semibold text-amber-400/90 mt-0.5 flex items-center gap-1">
                        {roleMode === 'dm' ? '👑 Modo Mestre' : '⚔️ Modo Jogador'}
                      </span>
                    </div>
                  </div>

                  {/* Role Mode Switcher (Mestre vs Jogador) */}
                  <div className="p-1 bg-[#0f141d] border border-[#2a3449] rounded-xl mb-2 flex items-center gap-1 shadow-inner">
                    <button
                      onClick={() => setRoleMode('dm')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        roleMode === 'dm'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Modo Mestre (DM Studio): Criar mundos e combates"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Mestre</span>
                    </button>
                    <button
                      onClick={() => setRoleMode('player')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        roleMode === 'player'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Modo Jogador: Ver suas mesas e participar como player"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Jogador</span>
                    </button>
                  </div>

                  {/* Configurações Option */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-400 hover:bg-[#1f2738] rounded-xl transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Configurações</span>
                  </button>

                  <div className="border-t border-[#2a3449]/60 my-1" />

                  {/* Sair Option */}
                  <button
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      await signOut();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar / Cadastrar</span>
          </button>
        )}
      </div>

      {/* Merchant Forge Modal */}
      <MerchantForgeModal
        isOpen={isMerchantForgeOpen}
        onClose={() => setIsMerchantForgeOpen(false)}
        onOpenShopToTrade={(shop) => {
          setActiveTradeShop(shop);
          setIsTradeModalOpen(true);
        }}
      />

      {/* BG3 Trade Preview Modal for DM */}
      <BG3MerchantModal
        shop={activeTradeShop}
        characterSheet={previewSheet}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onUpdateCharacterSheet={() => {}}
        onUpdateShop={setActiveTradeShop}
      />

      {/* Detective Pinboard Modal */}
      <DetectivePinboardModal
        isOpen={isPinboardOpen}
        onClose={() => setIsPinboardOpen(false)}
      />

      {/* DM Notebook Persistent Drawer */}
      <DMNotebookDrawer
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        campaignId={activeCampaign?.id}
      />

      {/* Streamer Mode / OBS Overlay Settings Modal */}
      <StreamerOverlayModal
        isOpen={isStreamerOverlayOpen}
        onClose={() => setIsStreamerOverlayOpen(false)}
        campaignId={activeCampaign?.id || ''}
      />

      {/* Pocket Companion QR Modal */}
      <CompanionQrModal
        isOpen={isCompanionQrOpen}
        onClose={() => setIsCompanionQrOpen(false)}
      />

      {/* House Rules Modal for Players & DM */}
      <HouseRulesModal
        isOpen={isHouseRulesOpen}
        onClose={() => setIsHouseRulesOpen(false)}
        houseRules={normalizeHouseRules(activeCampaign?.houseRules || [
          {
            id: 'rule-legacy-1',
            title: 'Poção de Cura como Ação Bônus',
            description: 'Beber Poção de Cura custa Ação Bônus (Dar a outro jogador custa Ação).',
            category: 'potions',
            impact: 'comfort',
            isActive: true,
          },
          {
            id: 'rule-legacy-2',
            title: 'Acerto Crítico Brutal',
            description: 'Acerto Crítico causa Dano Máximo do 1º dado + rolagem do 2º dado.',
            category: 'dice',
            impact: 'buff',
            isActive: true,
          },
          {
            id: 'rule-legacy-3',
            title: 'Descanso Realista em Local Seguro',
            description: 'Descanso Curto dura 8 horas; Descanso Longo dura 24 horas em local seguro.',
            category: 'rest',
            impact: 'gritty',
            isActive: true,
          },
        ])}
        campaignTitle={activeCampaign?.title}
      />
    </header>
  );
};


