'use client';

import React from 'react';
import { 
  Crown, 
  Skull, 
  Shield, 
  Heart, 
  Swords, 
  EyeOff, 
  Edit, 
  UserPlus, 
  ExternalLink,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { FamilyMemberNode, SuccessionStatus, WorldEntity } from '@/lib/types';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';

interface FamilyMemberCardProps {
  member: FamilyMemberNode;
  linkedNpc?: WorldEntity | null;
  isSelected?: boolean;
  isDmView?: boolean;
  onSelect?: (member: FamilyMemberNode) => void;
  onEdit?: (member: FamilyMemberNode) => void;
  onAddRelation?: (member: FamilyMemberNode) => void;
  onOpenNpcSheet?: (worldEntityId: string) => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  linkedNpc,
  isSelected,
  isDmView = true,
  onSelect,
  onEdit,
  onAddRelation,
  onOpenNpcSheet,
}) => {
  const displayAvatar = (linkedNpc ? getEntityPortraitUrl(linkedNpc) : undefined) || member.avatarUrl;
  const displayName = member.name || linkedNpc?.name || 'Sem Nome';
  const displayTitle = member.title || linkedNpc?.subType;
  const getSuccessionBadge = (status?: SuccessionStatus) => {
    switch (status) {
      case 'ruling':
        return (
          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
            <Crown className="w-3 h-3 text-amber-400" /> Monarca / Líder
          </span>
        );
      case 'heir_apparent':
        return (
          <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            <Shield className="w-3 h-3 text-emerald-400" /> 1º Herdeiro
          </span>
        );
      case 'heir_presumptive':
        return (
          <span className="flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            <Shield className="w-3 h-3 text-cyan-400" /> Linha de Sucessão
          </span>
        );
      case 'claimant':
        return (
          <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            <Swords className="w-3 h-3 text-rose-400" /> Reivindicante
          </span>
        );
      case 'disinherited':
        return (
          <span className="flex items-center gap-1 bg-slate-700/60 text-slate-400 border border-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">
            Deserdado(a)
          </span>
        );
      case 'exiled':
        return (
          <span className="flex items-center gap-1 bg-purple-900/30 text-purple-300 border border-purple-700 text-[10px] px-1.5 py-0.5 rounded-full">
            No Exílio
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => onSelect?.(member)}
      className={`relative group w-[220px] rounded-xl border p-3 cursor-pointer transition-all duration-200 select-none ${
        isSelected
          ? 'bg-[#182030] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/40'
          : member.isAlive
          ? 'bg-[#111622]/95 border-slate-700/80 hover:border-amber-500/60 hover:bg-[#151c2c] shadow-lg'
          : 'bg-[#0f1219]/90 border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
      }`}
    >
      {/* Top Header: Badge / Life Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          {!member.isAlive ? (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 rounded-md">
              <Skull className="w-2.5 h-2.5 text-slate-400" /> Falecido
            </span>
          ) : (
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          )}

          {member.customBadge && (
            <span className="text-[9px] bg-slate-800 text-amber-300 border border-amber-500/30 px-1 py-0.5 rounded font-mono truncate max-w-[90px]">
              {member.customBadge}
            </span>
          )}
        </div>

        {/* Quick action buttons on hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          {onAddRelation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddRelation(member);
              }}
              title="Adicionar Parente / Cônjuge / Filho"
              className="p-1 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(member);
              }}
              title="Editar Membro"
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Center Body: Avatar + Details */}
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-11 h-11 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-800 ${
              member.successionStatus === 'ruling'
                ? 'border-amber-400 ring-2 ring-amber-400/30'
                : member.isAlive
                ? 'border-slate-600'
                : 'border-slate-700 grayscale'
            }`}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-slate-300 font-serif">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {member.successionStatus === 'ruling' && (
            <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1.5 -right-1 drop-shadow" />
          )}
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-xs font-bold truncate leading-tight ${
              member.isAlive ? 'text-slate-100' : 'text-slate-400 line-through decoration-slate-600'
            }`}
            title={displayName}
          >
            {displayName}
          </h4>

          {displayTitle && (
            <p className="text-[11px] text-amber-400/90 font-medium truncate leading-tight mt-0.5">
              {displayTitle}
            </p>
          )}

          {(member.birthEra || member.deathEra) && (
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              {member.birthEra || '??'} - {member.deathEra || (member.isAlive ? 'Presente' : '??')}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Succession Badge + NPC Link */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
        <div>{getSuccessionBadge(member.successionStatus)}</div>

        {member.worldEntityId && onOpenNpcSheet && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenNpcSheet(member.worldEntityId!);
            }}
            title="Abrir Ficha de NPC no Worldbuilder"
            className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium hover:underline"
          >
            <span>NPC</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        )}
      </div>

      {/* Secret Note Marker (DM Mode) */}
      {isDmView && member.secrets && (
        <div 
          className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-400/90 bg-rose-950/40 border border-rose-900/50 px-1.5 py-0.5 rounded"
          title={`Segredo: ${member.secrets}`}
        >
          <EyeOff className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" />
          <span className="truncate">{member.secrets}</span>
        </div>
      )}
    </div>
  );
};
