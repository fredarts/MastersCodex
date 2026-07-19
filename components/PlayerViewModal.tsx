'use client';

import React from 'react';
import { X, Tv, Swords, Shield, Heart, Sparkles, Map } from 'lucide-react';
import { Combatant } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface PlayerViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatants: Combatant[];
  currentTurnIndex: number;
  roundCount: number;
}

export const PlayerViewModal: React.FC<PlayerViewModalProps> = ({
  isOpen,
  onClose,
  combatants,
  currentTurnIndex,
  roundCount,
}) => {
  const { activeScene, activeCampaign } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg z-50 flex flex-col overflow-hidden select-none animate-fade-in">
      {/* Top Header */}
      <div className="bg-[#0f141d]/80 border-b border-[#2a3449] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold shadow-inner">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono">
                TELA DO JOGADOR (DISCORD / TV)
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-100">{activeCampaign?.title || 'Mesa de Jogo Ao Vivo'}</h2>
          </div>
        </div>

        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100 rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Scene Image Artwork */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {activeScene?.imageUrl ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <img
                src={activeScene.imageUrl}
                alt="Arte da cena"
                className="w-full h-full object-cover animate-fade-in"
              />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-500/30">
                <div className="text-xs font-bold text-amber-400 uppercase font-mono">{activeScene.title}</div>
                {activeScene.sensoryText && (
                  <p className="text-xs text-slate-200 mt-1 font-serif leading-relaxed italic">{activeScene.sensoryText}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-600">
              <Map className="w-16 h-16 mx-auto mb-3 opacity-40" />
              <h3 className="text-slate-400 font-bold text-base">Aguardando Transmissão de Imagem pelo Mestre...</h3>
            </div>
          )}
        </div>

        {/* Right Initiative Queue for Players (DM secrets like exact HP & DM notes hidden!) */}
        <div className="w-80 bg-[#0c0f17] border-l border-[#2a3449] p-4 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2a3449]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                TURNO AO VIVO
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                RODADA {roundCount}
              </span>
            </div>

            <div className="space-y-2">
              {combatants.map((c, idx) => {
                const isTurn = idx === currentTurnIndex;
                return (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isTurn
                        ? 'bg-rose-950/40 border-rose-500 text-rose-300 font-bold shadow-lg ring-1 ring-rose-500/40'
                        : 'bg-[#161c28] border-[#2a3449] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">#{c.initiative}</span>
                        <span className="text-xs font-bold truncate max-w-[140px]">{c.name}</span>
                      </div>
                      {isTurn && (
                        <span className="text-[9px] bg-rose-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                          TURNO
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2a3449] text-center">
            <span className="text-[10px] text-slate-500 font-mono">CO-MESTRE RPG • PLAYER DISPLAY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
