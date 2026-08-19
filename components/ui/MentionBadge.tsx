'use client';

import React from 'react';
import {
  User,
  MapPin,
  Shield,
  Sun,
  Scroll,
  Target,
  Wand2,
  Skull,
  Package,
  Activity,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { MentionEntityType } from '@/lib/services/mentionIndexService';

interface MentionBadgeProps {
  name: string;
  type: MentionEntityType | string;
  id: string;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  onMouseLeave?: () => void;
  className?: string;
}

export const getCategoryBadgeStyle = (type: string) => {
  switch (type) {
    case 'npc':
    case 'profession':
    case 'species':
    case 'ethnicity':
      return {
        bg: 'bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border-amber-500/30 hover:border-amber-400',
        icon: <User className="w-3 h-3 text-amber-400 shrink-0" />,
        dot: 'bg-amber-400',
      };
    case 'location':
    case 'plane':
    case 'trade_route':
      return {
        bg: 'bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border-cyan-500/30 hover:border-cyan-400',
        icon: <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />,
        dot: 'bg-cyan-400',
      };
    case 'monster':
    case 'beast':
    case 'disease':
      return {
        bg: 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border-rose-500/30 hover:border-rose-400',
        icon: <Skull className="w-3 h-3 text-rose-400 shrink-0" />,
        dot: 'bg-rose-400',
      };
    case 'spell':
    case 'magic_system':
      return {
        bg: 'bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border-indigo-500/30 hover:border-indigo-400',
        icon: <Wand2 className="w-3 h-3 text-indigo-400 shrink-0" />,
        dot: 'bg-indigo-400',
      };
    case 'item':
    case 'material':
    case 'technology':
    case 'currency':
      return {
        bg: 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30 hover:border-emerald-400',
        icon: <Package className="w-3 h-3 text-emerald-400 shrink-0" />,
        dot: 'bg-emerald-400',
      };
    case 'quest':
      return {
        bg: 'bg-orange-950/50 hover:bg-orange-900/60 text-orange-300 border-orange-500/30 hover:border-orange-400',
        icon: <Target className="w-3 h-3 text-orange-400 shrink-0" />,
        dot: 'bg-orange-400',
      };
    case 'faction':
    case 'religion':
    case 'military_unit':
    case 'military_conflict':
      return {
        bg: 'bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border-sky-500/30 hover:border-sky-400',
        icon: <Shield className="w-3 h-3 text-sky-400 shrink-0" />,
        dot: 'bg-sky-400',
      };
    case 'condition':
      return {
        bg: 'bg-red-950/50 hover:bg-red-900/60 text-red-300 border-red-500/30 hover:border-red-400',
        icon: <Activity className="w-3 h-3 text-red-400 shrink-0" />,
        dot: 'bg-red-400',
      };
    case 'lore_event':
    case 'tradition':
    case 'document':
    case 'language':
      return {
        bg: 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border-amber-600/30 hover:border-amber-500',
        icon: <Scroll className="w-3 h-3 text-amber-300 shrink-0" />,
        dot: 'bg-amber-300',
      };
    default:
      return {
        bg: 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600',
        icon: <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />,
        dot: 'bg-slate-400',
      };
  }
};

export const MentionBadge: React.FC<MentionBadgeProps> = ({
  name,
  type,
  id,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = '',
}) => {
  const style = getCategoryBadgeStyle(type);

  return (
    <span
      data-mention-id={id}
      data-mention-type={type}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 mx-0.5 my-0.5 rounded-md border text-xs font-semibold font-sans transition-all duration-150 cursor-pointer select-none shadow-xs group ${style.bg} ${className}`}
    >
      {style.icon}
      <span className="truncate max-w-[180px] sm:max-w-[240px] tracking-tight group-hover:underline underline-offset-2">
        {name}
      </span>
    </span>
  );
};
