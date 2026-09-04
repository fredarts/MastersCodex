import React from 'react';
import {
  Dice5,
  EyeOff,
  Shield,
  Activity,
  Play,
  Pause,
  VolumeX,
  Sparkles,
  Flame,
  Skull,
  Backpack,
  BookOpen,
  Compass,
  Film,
  Globe,
  Settings,
  Calendar,
  Tv,
  Video,
  FastForward,
  Clock,
  Moon,
  AlertTriangle,
} from 'lucide-react';
import { OmnibarActionItem } from '@/lib/omnibar-engine';

interface OmnibarItemProps {
  item: OmnibarActionItem;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Dice5: <Dice5 className="w-4 h-4 text-amber-400" />,
  EyeOff: <EyeOff className="w-4 h-4 text-purple-400" />,
  Shield: <Shield className="w-4 h-4 text-emerald-400" />,
  Activity: <Activity className="w-4 h-4 text-red-400" />,
  Play: <Play className="w-4 h-4 text-cyan-400" />,
  Pause: <Pause className="w-4 h-4 text-amber-400" />,
  VolumeX: <VolumeX className="w-4 h-4 text-rose-400" />,
  Sparkles: <Sparkles className="w-4 h-4 text-yellow-300" />,
  Flame: <Flame className="w-4 h-4 text-orange-400" />,
  Skull: <Skull className="w-4 h-4 text-red-500" />,
  Backpack: <Backpack className="w-4 h-4 text-teal-400" />,
  BookOpen: <BookOpen className="w-4 h-4 text-blue-400" />,
  Compass: <Compass className="w-4 h-4 text-indigo-400" />,
  Film: <Film className="w-4 h-4 text-sky-400" />,
  Globe: <Globe className="w-4 h-4 text-emerald-400" />,
  Settings: <Settings className="w-4 h-4 text-slate-400" />,
  Calendar: <Calendar className="w-4 h-4 text-purple-400" />,
  Tv: <Tv className="w-4 h-4 text-pink-400" />,
  Video: <Video className="w-4 h-4 text-red-400" />,
  FastForward: <FastForward className="w-4 h-4 text-amber-400" />,
  Clock: <Clock className="w-4 h-4 text-blue-400" />,
  Moon: <Moon className="w-4 h-4 text-indigo-300" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4 text-red-500" />,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  dice: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  combatant: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  condition: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  audio: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  spell: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  monster: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
  item: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  rule: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  navigation: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  session: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
};

export const OmnibarItem: React.FC<OmnibarItemProps> = ({
  item,
  isSelected,
  onSelect,
  onClick,
}) => {
  const catStyle = CATEGORY_COLORS[item.category] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  return (
    <div
      onMouseEnter={onSelect}
      onClick={onClick}
      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
        isSelected
          ? 'bg-amber-500/15 border-amber-500/40 text-slate-100 shadow-[0_0_15px_rgba(245,158,11,0.12)]'
          : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-800/60 hover:text-slate-200'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Ícone com Box Temático */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-md border shrink-0 transition-transform ${
            isSelected ? 'scale-105 border-amber-500/40 bg-amber-500/20' : `${catStyle.bg} ${catStyle.border}`
          }`}
        >
          {ICON_MAP[item.iconType || 'BookOpen'] || <BookOpen className="w-4 h-4 text-slate-400" />}
        </div>

        {/* Títulos e Subtítulos */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold truncate text-slate-100 group-hover:text-amber-200">
              {item.title}
            </span>
            {item.badge && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
              >
                {item.badge}
              </span>
            )}
          </div>
          {item.subtitle && (
            <span className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
              {item.subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Atalho / Dica de Tecla */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {item.shortcut && (
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700/70 text-slate-400 shadow-inner">
            {item.shortcut}
          </kbd>
        )}
        <span
          className={`text-xs font-bold transition-opacity ${
            isSelected ? 'opacity-100 text-amber-400' : 'opacity-0 text-slate-500'
          }`}
        >
          ↵
        </span>
      </div>
    </div>
  );
};
