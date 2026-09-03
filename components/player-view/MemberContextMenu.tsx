'use client';

import React, { useEffect, useRef } from 'react';
import { Package, FileText, MessageSquare, Shield, Sparkles } from 'lucide-react';

export interface ContextMenuMember {
  id: string;
  userId: string;
  characterName?: string;
  avatarUrl?: string;
  role: string;
}

interface MemberContextMenuProps {
  x: number;
  y: number;
  member: ContextMenuMember;
  onClose: () => void;
  onSendItem: (member: ContextMenuMember) => void;
  onViewSheet?: (member: ContextMenuMember) => void;
  onWhisper?: (member: ContextMenuMember) => void;
}

export const MemberContextMenu: React.FC<MemberContextMenuProps> = ({
  x,
  y,
  member,
  onClose,
  onSendItem,
  onViewSheet,
  onWhisper,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora ou ao rolar/redimensionar a janela
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', onClose, true);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose]);

  // Ajuste de posição para não sair da tela (viewport boundary check)
  const adjustedX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - 220) : x;
  const adjustedY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - 200) : y;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 min-w-[200px] bg-[#0d131f]/95 backdrop-blur-xl border border-amber-500/40 rounded-xl shadow-2xl p-1 text-slate-200 animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#232d40]"
    >
      {/* Cabeçalho do Membro */}
      <div className="px-2.5 py-1.5 flex items-center gap-2">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.characterName} className="w-5 h-5 rounded-md object-cover border border-amber-500/40" />
        ) : (
          <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-[9px] font-bold">
            {(member.characterName || '?').slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-100 truncate font-serif">
            {member.characterName || 'Membro do Grupo'}
          </p>
          <span className="text-[9px] font-mono text-amber-400/80 block uppercase">
            {member.role === 'dm' ? 'Dungeon Master' : 'Integrante do Grupo'}
          </span>
        </div>
      </div>

      {/* Lista de Ações */}
      <div className="py-1 space-y-0.5">
        {/* Ação Principal: Enviar Item */}
        <button
          onClick={() => {
            onSendItem(member);
            onClose();
          }}
          className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-bold text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 flex items-center gap-2 transition-all cursor-pointer group"
        >
          <Package className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>Enviar Item...</span>
        </button>

        {/* Ver Ficha */}
        {onViewSheet && (
          <button
            onClick={() => {
              onViewSheet(member);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-slate-300 hover:bg-[#1c2436] hover:text-slate-100 flex items-center gap-2 transition-all cursor-pointer group"
          >
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            <span>Ver Ficha</span>
          </button>
        )}

        {/* Sussurrar no Chat */}
        {onWhisper && (
          <button
            onClick={() => {
              onWhisper(member);
              onClose();
            }}
            className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-slate-300 hover:bg-[#1c2436] hover:text-slate-100 flex items-center gap-2 transition-all cursor-pointer group"
          >
            <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-amber-300 transition-colors" />
            <span>Sussurrar no Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};
