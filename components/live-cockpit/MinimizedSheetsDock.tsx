'use client';

import React from 'react';
import { X, Sparkles, Swords, User } from 'lucide-react';
import { ActiveSheetState } from '@/context/LiveCockpitContext';

interface MinimizedSheetsDockProps {
  activeSheets: ActiveSheetState[];
  onMaximizeSheet: (id: string) => void;
  onCloseSheet: (id: string) => void;
}

export const MinimizedSheetsDock: React.FC<MinimizedSheetsDockProps> = ({
  activeSheets,
  onMaximizeSheet,
  onCloseSheet,
}) => {
  const minimized = activeSheets.filter((s) => s.state === 'minimized');

  if (minimized.length === 0) return null;

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-row items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
      {minimized.map((sheet, idx) => {
        const initials = getInitials(sheet.characterName);
        const isMonster = sheet.type === 'monster' || sheet.type === 'npc';
        
        return (
          <div 
            key={sheet.id} 
            className="relative group transition-all hover:-translate-y-1"
          >
            {/* Tooltip com Nome */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-950/90 text-[10px] font-bold text-slate-100 rounded-lg shadow-xl border border-slate-800 whitespace-nowrap opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all pointer-events-none z-50">
              {sheet.characterName} ({sheet.type === 'pc' ? 'Jogador' : 'Monstro/NPC'})
            </div>

            {/* Círculo do Minimizado */}
            <button
              onClick={() => onMaximizeSheet(sheet.id)}
              className={`w-12 h-12 rounded-full border shadow-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 relative overflow-hidden backdrop-blur-md ${
                isMonster
                  ? 'bg-rose-950/70 border-rose-500/40 hover:border-rose-400 text-rose-300'
                  : 'bg-sky-950/70 border-sky-500/40 hover:border-sky-400 text-sky-300'
              }`}
            >
              <div className="text-[11px] font-black tracking-wider leading-none">
                {initials}
              </div>
              <div className="mt-0.5 leading-none">
                {isMonster ? (
                  <Swords className="w-2.5 h-2.5 opacity-60" />
                ) : (
                  <User className="w-2.5 h-2.5 opacity-60" />
                )}
              </div>

              {/* Barra de progresso circular decorativa no fundo */}
              <div className="absolute inset-0 border border-slate-700/20 rounded-full pointer-events-none" />
            </button>

            {/* Botão de Fechar Rápido */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseSheet(sheet.id);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
              title="Fechar Definitivamente"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
