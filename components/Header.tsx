'use client';

import React, { useState } from 'react';
import { Shield, Search, Tv, Dices, User, LogIn, Crown, Swords, Database, Key } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import logoImg from '@/app/logo.png';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenPlayerView: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenPlayerView,
  onOpenAuthModal,
}) => {
  const { user, roleMode, setRoleMode } = useAuth();
  const { activeCampaign } = useCampaign();
  const { activeWorld } = useWorld();
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [lastDiceType, setLastDiceType] = useState<string>('');

  const rollDice = (sides: number) => {
    const res = Math.floor(Math.random() * sides) + 1;
    setDiceResult(res);
    setLastDiceType(`d${sides}`);
  };

  return (
    <header className="h-16 bg-[#0f141d] border-b border-[#2a3449] px-4 flex items-center justify-between shadow-lg relative z-20 select-none">
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 flex items-center justify-center">
            <img src={logoImg.src || '/logo.png'} alt="Master's Codex Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                Master's <span className="text-amber-500">Codex</span>
              </h1>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                D&D 5e
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Mesa: <span className="text-amber-300 font-semibold">{activeCampaign ? activeCampaign.title : 'Nenhuma'}</span>
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
          className="flex items-center gap-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 hover:text-amber-400 border border-[#2a3449] hover:border-amber-500/50 px-3 py-1.5 rounded-lg text-xs font-medium transition-all group"
        >
          <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Compêndio</span>
          <kbd className="hidden lg:inline-block bg-[#0f141d] border border-[#2a3449] text-[10px] text-slate-400 px-1.5 py-0.5 rounded font-mono">
            Ctrl + Espaço
          </kbd>
        </button>

        {/* Player View Button */}
        <button
          onClick={onOpenPlayerView}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-cyan-900/30 active:scale-95"
        >
          <Tv className="w-4 h-4" />
          <span className="hidden sm:inline">Tela do Jogador</span>
        </button>

        {/* User Account / Auth Button */}
        {user ? (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 bg-[#161c28] hover:bg-[#1f2738] border border-amber-500/40 p-1.5 pr-3 rounded-xl transition-all"
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
    </header>
  );
};
