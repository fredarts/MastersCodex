'use client';

import React from 'react';
import { Heart, Shield, Eye, Sparkles, Navigation } from 'lucide-react';
import { Cell } from '../../MapMaker';
import { Combatant, MapLevel } from '@/lib/types';
import { getTokenVisionRadius, getCombatantVisionType } from '../visionCore';

interface CellHoverTooltipProps {
  hoveredCell: { x: number; y: number; cell: Cell } | null;
  combatants: Combatant[];
  activeLevels?: MapLevel[];
}

export const CellHoverTooltip: React.FC<CellHoverTooltipProps> = ({
  hoveredCell,
  combatants,
  activeLevels,
}) => {
  if (!hoveredCell) return null;

  const { cell, x, y } = hoveredCell;

  return (
    <div 
      className="fixed pointer-events-none z-40 bg-[#0d1117]/95 border border-[#30363d] rounded-xl shadow-2xl p-3 w-[270px] text-xs font-sans text-slate-200 backdrop-blur-md animate-fade-in"
      style={{ 
        left: `${x + 15}px`, 
        top: `${y + 15}px` 
      }}
    >
      {cell.tokenName && (() => {
        const tokenName = cell.tokenName;
        const tokenComb = combatants?.find(
          (c) => c.name.trim().toLowerCase() === tokenName.trim().toLowerCase()
        );
        const isPlayer = tokenComb?.type === 'player' || cell.tokenColor?.includes('cyan') || cell.tokenColor?.includes('emerald');
        const hp = tokenComb?.hp ?? 10;
        const maxHp = tokenComb?.maxHp ?? 10;
        const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
        const ac = tokenComb?.ac ?? 10;
        const visRadius = getTokenVisionRadius(tokenName, combatants);
        const visType = getCombatantVisionType(tokenName, combatants);
        const speedVal = typeof tokenComb?.speed === 'number' 
          ? tokenComb.speed 
          : parseInt(String(tokenComb?.speed || '30').replace(/\D/g, ''), 10) || 30;

        const visTypeLabel =
          visType === 'darkvision' ? '🌙 Visão no Escuro' :
          visType === 'truesight' ? '✨ Visão Verdadeira' :
          visType === 'blindsight' ? '🦇 Percepção às Cegas' :
          visType === 'tremorsense' ? '🌐 Sentido Sísmico' : '☀️ Visão Padrão (Luz)';

        return (
          <div className="space-y-2.5">
            {/* Header with Name and Badge */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                  isPlayer ? 'bg-cyan-500 border-cyan-300 shadow-sm shadow-cyan-500/50' : 'bg-rose-600 border-rose-400 shadow-sm shadow-rose-600/50'
                }`} />
                <span className="font-black text-slate-100 uppercase tracking-wide text-xs truncate">
                  {tokenName}
                </span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                isPlayer 
                  ? 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300' 
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}>
                {tokenComb?.type === 'player' ? 'Jogador' : (tokenComb?.type === 'npc' ? 'NPC' : 'Monstro / Ameaça')}
              </span>
            </div>

            {/* HP & AC Bar */}
            <div className="bg-[#070a10] border border-slate-800/80 rounded-lg p-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                <div className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-500/30" />
                  <span>HP:</span>
                  <span className="text-slate-100">{hp} / {maxHp}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span className="text-[10px] text-slate-400">CA</span>
                  <span className="text-cyan-200">{ac}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-600'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Dungeon Vision & Movement Stats */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-[#070a10] border border-slate-800/80 rounded-md p-1.5 flex flex-col">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <Eye className="w-3 h-3 text-cyan-400" /> Alcance Visão
                </span>
                <span className="text-cyan-300 font-mono font-bold mt-0.5">
                  {visRadius * 5}ft <span className="text-slate-500 font-normal">({(visRadius * 1.5).toFixed(1)}m)</span>
                </span>
              </div>

              <div className="bg-[#070a10] border border-slate-800/80 rounded-md p-1.5 flex flex-col">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Modo Visão
                </span>
                <span className="text-amber-300 font-bold mt-0.5 truncate" title={visTypeLabel}>
                  {visTypeLabel}
                </span>
              </div>

              <div className="bg-[#070a10] border border-slate-800/80 rounded-md p-1.5 flex flex-col">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <Navigation className="w-3 h-3 text-emerald-400" /> Deslocamento
                </span>
                <span className="text-emerald-300 font-mono font-bold mt-0.5">
                  {speedVal}ft <span className="text-slate-500 font-normal">({Math.round(speedVal * 0.3)}m)</span>
                </span>
              </div>

              <div className="bg-[#070a10] border border-slate-800/80 rounded-md p-1.5 flex flex-col">
                <span className="text-slate-400 flex items-center gap-1 font-bold">
                  <Shield className="w-3 h-3 text-indigo-400" /> Percepção Passiva
                </span>
                <span className="text-indigo-300 font-mono font-bold mt-0.5">
                  {tokenComb?.wis !== undefined ? 10 + Math.floor((tokenComb.wis - 10) / 2) : 12}
                </span>
              </div>
            </div>

            {/* Conditions (if active) */}
            {Boolean(tokenComb?.conditions && tokenComb.conditions.length > 0) && (
              <div className="pt-1 border-t border-slate-800 flex flex-wrap gap-1">
                {tokenComb!.conditions.map((cond: string) => (
                  <span key={cond} className="px-1.5 py-0.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[9px] font-bold rounded capitalize">
                    ⚠️ {cond}
                  </span>
                ))}
              </div>
            )}

            {/* Quick action hint */}
            <div className="text-[9px] text-slate-500 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
              <span>🖱️ Arraste para mover</span>
              <span className="text-rose-400 font-semibold">Botão Dir.: remover</span>
            </div>
          </div>
        );
      })()}

      {!cell.tokenName && cell.type === 'transition' && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
            <span>🪜 {cell.transitionConfig?.name || 'Passagem de Nível'}</span>
          </div>
          <div className="pt-1 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Tipo:</span>
              <span className="font-bold text-slate-200 capitalize">
                {cell.transitionConfig?.type?.replace('_', ' ') || 'Escada'}
              </span>
            </div>
            {cell.transitionConfig?.targetLevelId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Destino:</span>
                <span className="font-bold text-cyan-400">
                  {activeLevels?.find(l => l.id === cell.transitionConfig?.targetLevelId)?.name || 'Outro Andar'}
                </span>
              </div>
            )}
            <div className="text-[10px] text-amber-300/80 pt-1">
              💡 Clique para configurar ou teletransportar heróis
            </div>
          </div>
        </div>
      )}

      {cell.type === 'door' && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
            <span>🚪 Porta de {
              cell.doorConfig?.doorType === 'wooden' ? 'Madeira' :
              cell.doorConfig?.doorType === 'iron' ? 'Ferro' :
              cell.doorConfig?.doorType === 'stone' ? 'Pedra' : 'Segredo (Secreta)'
            }</span>
          </div>
          <div className="pt-1 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Estado:</span>
              <span className={`font-bold ${cell.doorConfig?.status === 'open' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {cell.doorConfig?.status === 'open' ? 'Aberta' : 'Fechada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CD Arrombar:</span>
              <span className="font-mono font-bold text-slate-300">{cell.doorConfig?.breakDC ?? 15}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CD Lockpick:</span>
              <span className="font-mono font-bold text-slate-300">{cell.doorConfig?.lockpickDC ?? 15}</span>
            </div>
            {cell.doorConfig?.doorType === 'secret' && (
              <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-0.5">
                <span className="text-slate-400">Visível aos Jogadores:</span>
                <span className={`font-bold ${cell.doorConfig?.secretRevealed ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cell.doorConfig?.secretRevealed ? 'Sim' : 'Não'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {cell.type === 'trap' && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
            <span className="text-rose-400">⚠️ {cell.trapConfig?.trapType || 'Armadilha'}</span>
          </div>
          <div className="pt-1 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">CD Percepção:</span>
              <span className="font-mono font-bold text-slate-300">{cell.trapConfig?.detectDC ?? 15}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CD Desarmar:</span>
              <span className="font-mono font-bold text-slate-300">{cell.trapConfig?.disarmDC ?? 15}</span>
            </div>
            <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-0.5">
              <span className="text-slate-400">Revelada aos Jogadores:</span>
              <span className={`font-bold ${cell.trapConfig?.revealedToPlayers ? 'text-emerald-400' : 'text-rose-400'}`}>
                {cell.trapConfig?.revealedToPlayers ? 'Sim' : 'Não'}
              </span>
            </div>
            {cell.trapConfig?.description && (
              <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/50 mt-1 leading-relaxed">
                {cell.trapConfig.description}
              </p>
            )}
          </div>
        </div>
      )}

      {(cell.type === 'chest' || cell.type === 'stash') && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-800">
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] truncate">
              {cell.type === 'chest' ? '🧰' : '💎'} {cell.chestConfig?.name || 'Recipiente'}
            </span>
            {cell.chestConfig?.containerType === 'mimic' && (
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold">
                🦷 MÍMICO
              </span>
            )}
          </div>
          <div className="pt-0.5 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Estado:</span>
              <span className={`font-bold capitalize ${
                cell.chestConfig?.status === 'open' ? 'text-indigo-400' :
                cell.chestConfig?.status === 'looted' ? 'text-emerald-400' :
                cell.chestConfig?.status === 'unlocked' ? 'text-sky-400' : 'text-amber-400'
              }`}>
                {cell.chestConfig?.status === 'open' ? '📦 Aberto' :
                 cell.chestConfig?.status === 'looted' ? '✨ Saqueado' :
                 cell.chestConfig?.status === 'unlocked' ? '🔓 Destrancado' : '🔒 Trancado'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CDs (Lock / Força):</span>
              <span className="font-mono font-bold text-slate-300">
                DC {cell.chestConfig?.lockpickDC ?? 15} / {cell.chestConfig?.breakDC ?? 16}
              </span>
            </div>
            {cell.chestConfig?.detectDC && (
              <div className="flex justify-between">
                <span className="text-slate-400">CD Percepção/Invest.:</span>
                <span className="font-mono font-bold text-slate-300">
                  DC {cell.chestConfig.detectDC}
                </span>
              </div>
            )}
            {cell.chestConfig?.isTrapped && (
              <div className="flex justify-between text-rose-400 border-t border-slate-800/40 pt-1">
                <span>⚠️ Armadilha no Fecho:</span>
                <span className="font-mono font-bold">DC {cell.chestConfig.trapDisarmDC ?? 15}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-0.5">
              <span className="text-slate-400">Visível aos Jogadores:</span>
              <span className={`font-bold ${cell.chestConfig?.revealedToPlayers ? 'text-emerald-400' : 'text-rose-400'}`}>
                {cell.chestConfig?.revealedToPlayers ? 'Sim' : 'Não'}
              </span>
            </div>
            {/* Loot preview */}
            {cell.chestConfig?.loot && (
              <div className="bg-slate-950/60 rounded p-1.5 border border-slate-800/60 mt-1 space-y-0.5">
                <div className="flex flex-wrap gap-1 text-[10px] text-amber-300 font-mono">
                  {cell.chestConfig.loot.gp ? <span>🪙 {cell.chestConfig.loot.gp} PO</span> : null}
                  {cell.chestConfig.loot.sp ? <span>⚪ {cell.chestConfig.loot.sp} PP</span> : null}
                  {cell.chestConfig.loot.cp ? <span>🟤 {cell.chestConfig.loot.cp} PC</span> : null}
                  {cell.chestConfig.loot.pp ? <span>💎 {cell.chestConfig.loot.pp} PL</span> : null}
                </div>
                {cell.chestConfig.loot.items && cell.chestConfig.loot.items.length > 0 && (
                  <div className="text-[10px] text-slate-300 truncate">
                    📦 {cell.chestConfig.loot.items.map((i: { name?: string } | string) => typeof i === 'string' ? i : i.name || 'Item').join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
