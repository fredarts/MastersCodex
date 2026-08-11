'use client';

import React from 'react';
import { 
  Swords, 
  Sparkles, 
  Clock, 
  UserCheck, 
  Skull, 
  User, 
  Shield,
  CheckCircle2
} from 'lucide-react';
import { Combatant, CharacterSheet } from '@/lib/types';

interface PlayerCombatTrackerHUDProps {
  combatants: Combatant[];
  currentTurnIndex: number;
  roundCount: number;
  playerCharName: string;
  isCombatActive: boolean;
  characterSheets?: CharacterSheet[];
  activeSheet?: CharacterSheet;
  campaignMembers?: { id: string; userId: string; characterName?: string; avatarUrl?: string; role: string }[];
  onEndTurn?: () => void;
}

export const PlayerCombatTrackerHUD: React.FC<PlayerCombatTrackerHUDProps> = ({
  combatants,
  currentTurnIndex,
  roundCount,
  playerCharName,
  isCombatActive,
  characterSheets,
  activeSheet,
  campaignMembers,
  onEndTurn,
}) => {
  if (!isCombatActive || combatants.length === 0) return null;

  const currentCombatant = combatants[currentTurnIndex];
  const isMyTurn = currentCombatant && (
    currentCombatant.name.toLowerCase().includes(playerCharName.toLowerCase()) ||
    playerCharName.toLowerCase().includes(currentCombatant.name.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0a0d14]/95 backdrop-blur-xl border-b border-[#2a3449] px-4 py-2 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left Side: Combat Status & Round Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shadow-inner">
            <Swords className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest bg-rose-950/80 border border-rose-500/40 px-2 py-0.5 rounded shadow-sm">
                COMBATE ATIVO
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded shadow-sm">
                RODADA #{roundCount}
              </span>
            </div>
            {currentCombatant && (
              <p className="text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <span className="text-slate-400 font-normal">Vez de:</span>
                <strong className={`font-mono ${isMyTurn ? 'text-amber-300 animate-pulse font-extrabold' : 'text-cyan-300'}`}>
                  {currentCombatant.name}
                </strong>
              </p>
            )}
          </div>
        </div>

        {/* Center: Baldur's Gate 3 Style Vertical Portrait Initiative Bar */}
        <div className="flex-1 max-w-3xl overflow-x-auto flex items-center gap-2 py-1 px-2 no-scrollbar">
          {combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const isMe = c.name.toLowerCase().includes(playerCharName.toLowerCase()) || playerCharName.toLowerCase().includes(c.name.toLowerCase());
            const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
            const isDead = c.hp <= 0;

            // Robust name matcher for combatant portraits
            const isMatch = (nameA?: string, nameB?: string) => {
              if (!nameA || !nameB) return false;
              const a = nameA.split('(')[0].trim().toLowerCase();
              const b = nameB.split('(')[0].trim().toLowerCase();
              if (!a || !b) return false;
              return a === b || a.includes(b) || b.includes(a);
            };

            // Resolve portrait image with multi-source fallback
            let portraitUrl = c.avatarUrl || c.tokenImageUrl;

            if (!portraitUrl && activeSheet?.avatarUrl && isMatch(c.name, activeSheet.characterName)) {
              portraitUrl = activeSheet.avatarUrl;
            }

            if (!portraitUrl && characterSheets && characterSheets.length > 0) {
              const sheetMatch = characterSheets.find((s) => isMatch(c.name, s.characterName) && s.avatarUrl);
              if (sheetMatch?.avatarUrl) {
                portraitUrl = sheetMatch.avatarUrl;
              }
            }

            if (!portraitUrl && campaignMembers && campaignMembers.length > 0) {
              const memberMatch = campaignMembers.find((m) => isMatch(c.name, m.characterName) && m.avatarUrl);
              if (memberMatch?.avatarUrl) {
                portraitUrl = memberMatch.avatarUrl;
              }
            }

            return (
              <div
                key={`${c.id}-${idx}`}
                className={`relative shrink-0 w-16 h-20 rounded-xl border flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  isDead
                    ? 'bg-slate-950/80 border-rose-950/60 opacity-50 grayscale'
                    : isTurn
                    ? 'bg-amber-950/90 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110 z-10 ring-2 ring-amber-500/40'
                    : isMe
                    ? 'bg-cyan-950/50 border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'bg-[#121826]/90 border-[#2a3449] hover:border-slate-500'
                }`}
                title={`${c.name} (Iniciativa: ${c.initiative} • HP: ${c.hp}/${c.maxHp})`}
              >
                {/* Initiative Badge (Top Left) */}
                <div className="absolute top-0 left-0 bg-black/80 text-amber-400 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded-br-lg z-10 border-r border-b border-amber-500/30 backdrop-blur-sm">
                  #{c.initiative}
                </div>

                {/* 'VOCÊ' or 'SUA VEZ' Badge (Top Right) */}
                {isMe && (
                  <div className={`absolute top-0 right-0 font-mono text-[8px] font-extrabold px-1 py-0.5 rounded-bl-lg z-10 ${
                    isTurn ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-cyan-500 text-slate-950'
                  }`}>
                    {isTurn ? 'SUA VEZ' : 'VOCÊ'}
                  </div>
                )}

                {/* Portrait Content */}
                <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-[#0a0d14]">
                  {isDead ? (
                    <div className="flex flex-col items-center justify-center text-rose-500">
                      <Skull className="w-6 h-6 animate-pulse" />
                    </div>
                  ) : portraitUrl ? (
                    <img
                      src={portraitUrl}
                      alt={c.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-xs font-bold font-mono ${
                      c.type === 'monster' ? 'text-rose-400 bg-rose-950/30' : c.type === 'npc' ? 'text-amber-400 bg-amber-950/30' : 'text-cyan-400 bg-cyan-950/30'
                    }`}>
                      {c.type === 'monster' ? (
                        <Skull className="w-5 h-5 opacity-80" />
                      ) : (
                        c.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  )}

                  {/* Active turn golden aura overlay */}
                  {isTurn && !isDead && (
                    <div className="absolute inset-0 border border-amber-400/50 pointer-events-none animate-pulse" />
                  )}
                </div>

                {/* Name & HP Progress Footer */}
                <div className="bg-[#0a0d14]/95 p-1 border-t border-[#2a3449]/60 shrink-0">
                  <div className="text-[9px] font-bold text-slate-200 truncate text-center leading-tight">
                    {c.name}
                  </div>
                  {/* Mini HP Bar */}
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Refined Turn Indicator & End Turn Button */}
        <div className="flex items-center gap-2 shrink-0">
          {isMyTurn ? (
            <button
              onClick={onEndTurn}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 animate-pulse cursor-pointer border border-emerald-400/50"
              title="Encerrar seu turno e passar a vez para o próximo combatente"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Encerrar Turno</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[#121826] border border-[#2a3449] text-slate-400 text-xs font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Aguardando Turno...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
