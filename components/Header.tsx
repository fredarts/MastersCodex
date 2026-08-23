'use client';

import React, { useState } from 'react';
import { Shield, Search, Tv, Dices, User, LogIn, Crown, Swords, Database, Key, PanelLeft, Sparkles, Menu, Settings, LogOut, Gift } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { useAudio } from '@/context/AudioContext';
import { usePartyLoot } from '@/context/PartyLootContext';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';

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
  const { setIsDmLootModalOpen, setIsPartyLootModalOpen, activeLootSession } = usePartyLoot();
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [lastDiceType, setLastDiceType] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const rollDice = (sides: number) => {
    const res = Math.floor(Math.random() * sides) + 1;
    playDiceSound(1);
    setDiceResult(res);
    setLastDiceType(`d${sides}`);
  };

  return (
    <header className="h-16 bg-[#0f141d] border-b border-[#2a3449] px-4 flex items-center justify-between shadow-lg relative z-20 select-none">
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

        {/* Role Mode Switcher Button (Mestre vs Jogador) */}
        <div className="bg-[#161c28] border border-[#2a3449] p-1 rounded-xl flex items-center gap-1 shadow-inner">
          <button
            onClick={() => setRoleMode('dm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-3">
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

        {/* PWA Install Button */}
        <PWAInstallButton variant="compact" />

        {/* Baú da Party Button */}
        <button
          onClick={() => {
            setIsPartyLootModalOpen(true);
          }}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
            activeLootSession && activeLootSession.status === 'active'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40 animate-pulse'
              : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:text-amber-400 hover:border-amber-500/50'
          }`}
          title="Ver Baú da Party (Itens e Moedas Compartilhadas)"
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">
            Baú da Party
          </span>
          {activeLootSession && activeLootSession.status === 'active' && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
          )}
        </button>



        {/* User Account / Auth Button */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#161c28] hover:bg-[#1f2738] border border-amber-500/40 p-1.5 pr-3 rounded-xl transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-xs text-amber-400 font-mono overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                ) : (
                  user.displayName.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden sm:inline">{user.displayName}</span>
            </button>

            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#161c28] border border-[#2a3449] rounded-xl shadow-2xl z-20 py-1.5 overflow-hidden animate-fade-in">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onOpenSettings) onOpenSettings();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-[#1f2738] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-amber-500" />
                    <span>Configurações</span>
                  </button>
                  <div className="border-t border-[#2a3449] my-1" />
                  <button
                    onClick={async () => {
                      setIsDropdownOpen(false);
                      await signOut();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
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

        {/* Right AI Panel Toggle Button */}
        {onToggleAIPanel && (
          <button
            onClick={onToggleAIPanel}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              !isAIPanelCollapsed
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-md shadow-purple-950/40'
                : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-purple-300 hover:border-purple-500/40'
            }`}
            title={isAIPanelCollapsed ? "Expandir Widget IA Co-Mestre" : "Retrair Widget IA Co-Mestre"}
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="hidden lg:inline">IA Co-Mestre</span>
          </button>
        )}
      </div>
    </header>
  );
};

