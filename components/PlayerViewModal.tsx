'use client';

import React from 'react';
import { X, Tv, Swords, Shield, Heart, Sparkles, Map } from 'lucide-react';
import { Combatant } from '@/lib/types';
import { useSession } from '@/context/SessionContext';
import { useCampaign } from '@/context/CampaignContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { normalizeImageUrl } from '@/lib/imageUtils';

import { BattleGrid3D } from '@/components/BattleGrid3D';

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
  const { activeScene } = useSession();
  const { activeCampaign } = useCampaign();
  const { liveDisplayMode } = useLiveCockpit();
  if (!isOpen) return null;

  const isCombatMode = liveDisplayMode === 'combat' || activeScene?.sceneType === 'combat' || combatants.length > 0;

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
        {/* Left Side: 3D Battle Grid OR Scene Artwork */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
          {isCombatMode ? (
            <BattleGrid3D
              combatants={combatants}
              currentTurnIndex={currentTurnIndex}
              interactive={false}
            />
          ) : activeScene?.imageUrl ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <img
                src={normalizeImageUrl(activeScene.imageUrl)}
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
                const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
                return (
                  <div
                    key={`${c.id}-${idx}`}
                    className={`p-3 rounded-xl border transition-all ${
                      isTurn
                        ? 'bg-rose-950/50 border-rose-500 text-rose-300 font-bold shadow-lg ring-1 ring-rose-500/40'
                        : 'bg-[#161c28] border-[#2a3449] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-[#0a0d14] px-1.5 py-0.5 rounded border border-[#2a3449]">
                          #{c.initiative}
                        </span>
                        <span className="text-xs font-bold truncate max-w-[130px]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" /> {c.ac}
                        </span>
                        {isTurn && (
                          <span className="text-[9px] bg-rose-500 text-slate-950 font-black px-1.5 py-0.5 rounded animate-pulse">
                            TURNO
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Live Health Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> HP:
                        </span>
                        <span className="font-bold text-slate-200">{c.hp} / {c.maxHp}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Conditions */}
                    {c.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.conditions.map((cond) => (
                          <span key={cond} className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full font-mono">
                            {cond}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#2a3449] text-center">
            <span className="text-[10px] text-slate-500 font-mono">MASTER'S CODEX • PLAYER DISPLAY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
