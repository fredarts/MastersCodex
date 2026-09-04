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
    <div className="w-full px-2 sm:px-3 pt-2 select-none z-20">
      <div className="bg-[#0a0e17]/90 backdrop-blur-xl border border-[#2a3449]/80 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Side: Combat Status & Round Badge */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shadow-inner shrink-0">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-mono font-black text-rose-400 uppercase tracking-widest bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.5 rounded shadow-sm">
                  COMBATE
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.5 rounded shadow-sm">
                  R#{roundCount}
                </span>
              </div>
              {currentCombatant && (
                <p className="text-[11px] sm:text-xs font-bold text-slate-200 mt-0.5 flex items-center gap-1 truncate max-w-[110px] sm:max-w-[150px]">
                  <span className="text-slate-400 font-normal">Vez:</span>
                  <strong className={`font-mono truncate ${isMyTurn ? 'text-amber-300 font-black animate-pulse' : 'text-cyan-300'}`}>
                    {currentCombatant.name}
                  </strong>
                </p>
              )}
            </div>
          </div>

          {/* Center: Baldur's Gate 3 Style Scrollable Initiative Bar */}
          <div className="flex-1 overflow-x-auto flex items-center gap-2 py-1 px-1 custom-scrollbar">
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
                  className={`relative shrink-0 w-14 sm:w-16 h-18 sm:h-20 rounded-xl border flex flex-col justify-between overflow-hidden transition-all duration-200 cursor-pointer ${
                    isDead
                      ? 'bg-slate-950/80 border-rose-950/60 opacity-50 grayscale'
                      : isTurn
                      ? 'bg-amber-950/90 border-2 border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.6)] scale-105 z-10 ring-2 ring-amber-500/40'
                      : isMe
                      ? 'bg-cyan-950/50 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                      : 'bg-[#121826]/90 border-[#2a3449] hover:border-slate-400'
                  }`}
                  title={`${c.name} (Iniciativa: ${c.initiative} • HP: ${c.hp}/${c.maxHp})`}
                >
                  {/* Initiative Badge (Top Left) */}
                  <div className="absolute top-0 left-0 bg-black/85 text-amber-400 font-mono text-[9px] font-extrabold px-1.5 py-0.2 rounded-br-lg z-10 border-r border-b border-amber-500/30 backdrop-blur-sm">
                    #{c.initiative}
                  </div>

                  {/* 'VOCÊ' or 'SUA VEZ' Badge (Top Right) */}
                  {isMe && (
                    <div className={`absolute top-0 right-0 font-mono text-[7.5px] font-black px-1 py-0.2 rounded-bl-lg z-10 ${
                      isTurn ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-cyan-500 text-slate-950'
                    }`}>
                      {isTurn ? 'SUA VEZ' : 'VOCÊ'}
                    </div>
                  )}

                  {/* Portrait Content */}
                  <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-[#080b10]">
                    {isDead ? (
                      <div className="flex flex-col items-center justify-center text-rose-500">
                        <Skull className="w-5 h-5 animate-pulse" />
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
                          <Skull className="w-4 h-4 opacity-80" />
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
                  <div className="bg-[#080b10]/95 px-1 py-0.5 border-t border-[#2a3449]/60 shrink-0">
                    <div className="text-[8.5px] sm:text-[9px] font-bold text-slate-200 truncate text-center leading-tight">
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

          {/* Right Side: Turn Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isMyTurn ? (
              <button
                onClick={onEndTurn}
                className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 animate-pulse cursor-pointer border border-emerald-400/50 shrink-0"
                title="Encerrar seu turno e passar a vez para o próximo combatente"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span className="hidden sm:inline">Passar Turno</span>
                <span className="sm:hidden">Passar</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0d121c] border border-[#2a3449] text-slate-400 text-xs font-mono shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                <span className="hidden sm:inline">Aguardando Turno...</span>
                <span className="sm:hidden">Aguardando</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
