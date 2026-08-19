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
  ExternalLink,
  Heart,
  ShieldAlert,
  Zap,
  Award,
  Coins,
  Clock,
  Sparkles,
} from 'lucide-react';
import { MentionPreviewData } from '@/lib/services/mentionIndexService';
import { getCategoryBadgeStyle } from './MentionBadge';

interface MentionHoverCardProps {
  data: MentionPreviewData | null;
  position: { x: number; y: number };
  isVisible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onInspect?: (data: MentionPreviewData) => void;
}

export const MentionHoverCard: React.FC<MentionHoverCardProps> = ({
  data,
  position,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  onInspect,
}) => {
  if (!isVisible || !data) return null;

  // Smart positioning calculation to keep inside viewport
  const cardWidth = 320;
  const cardHeight = 240;
  const padding = 16;

  let left = position.x;
  let top = position.y + 24;

  if (typeof window !== 'undefined') {
    if (left + cardWidth > window.innerWidth - padding) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (top + cardHeight > window.innerHeight - padding) {
      top = position.y - cardHeight - 8;
    }
  }

  const badgeStyle = getCategoryBadgeStyle(data.type);

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInspect) {
      onInspect(data);
    } else {
      // Default global dispatch
      if (data.type === 'monster') {
        window.dispatchEvent(new CustomEvent('openCompendiumModal', { detail: { tab: 'monsters', search: data.name } }));
      } else if (data.type === 'spell') {
        window.dispatchEvent(new CustomEvent('openCompendiumModal', { detail: { tab: 'spells', search: data.name } }));
      } else if (data.type === 'item') {
        window.dispatchEvent(new CustomEvent('openCompendiumModal', { detail: { tab: 'items', search: data.name } }));
      } else {
        window.dispatchEvent(new CustomEvent('openWorldEntityModal', { detail: { entityId: data.id, entityName: data.name } }));
      }
    }
  };

  return (
    <div
      style={{ top: `${top}px`, left: `${left}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[9999] w-80 bg-[#0d121f]/95 backdrop-blur-md border border-[#2a3449] rounded-xl shadow-2xl p-3.5 text-slate-200 pointer-events-auto transition-all animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#1f293d]">
        <div className="flex items-center gap-2 min-w-0">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.name}
              className="w-9 h-9 rounded-lg object-cover border border-[#2a3449] shrink-0"
            />
          ) : (
            <div className={`p-2 rounded-lg border shrink-0 ${badgeStyle.bg}`}>
              {badgeStyle.icon}
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-slate-100 truncate leading-tight">
              {data.name}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {data.subType || data.categoryLabel}
            </p>
          </div>
        </div>

        <button
          onClick={handleInspect}
          className="shrink-0 p-1.5 rounded-lg bg-[#161f30] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-[#2a3449] hover:border-amber-500/40 transition-colors"
          title="Inspecionar Detalhes"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Dynamic Content Details */}
      <div className="py-2 space-y-2 text-xs">
        {/* Monster Stats Grid */}
        {data.monsterStats && (
          <div className="bg-[#070a12] p-2 rounded-lg border border-[#1e2738] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-amber-400 font-bold">ND {data.monsterStats.cr || '0'}</span>
              <span className="flex items-center gap-1 text-rose-400">
                <Heart className="w-3 h-3" /> {data.monsterStats.hp} PV
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <ShieldAlert className="w-3 h-3" /> CA {data.monsterStats.ac}
              </span>
            </div>
            {data.monsterStats.str !== undefined && (
              <div className="grid grid-cols-6 gap-1 text-center font-mono text-[9px] pt-1 border-t border-[#1e2738]">
                <div className="bg-[#121826] p-0.5 rounded">FOR {data.monsterStats.str}</div>
                <div className="bg-[#121826] p-0.5 rounded">DES {data.monsterStats.dex}</div>
                <div className="bg-[#121826] p-0.5 rounded">CON {data.monsterStats.con}</div>
                <div className="bg-[#121826] p-0.5 rounded">INT {data.monsterStats.int}</div>
                <div className="bg-[#121826] p-0.5 rounded">SAB {data.monsterStats.wis}</div>
                <div className="bg-[#121826] p-0.5 rounded">CAR {data.monsterStats.cha}</div>
              </div>
            )}
          </div>
        )}

        {/* Spell Stats Grid */}
        {data.spellStats && (
          <div className="bg-[#070a12] p-2 rounded-lg border border-[#1e2738] text-[11px] space-y-1">
            <div className="flex items-center justify-between text-indigo-300 font-medium">
              <span>{data.spellStats.school} • Nível {data.spellStats.level}</span>
              <span>{data.spellStats.castingTime}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span>Alcance: {data.spellStats.range}</span>
              <span>Duração: {data.spellStats.duration}</span>
            </div>
          </div>
        )}

        {/* Item Stats */}
        {data.itemStats && (
          <div className="bg-[#070a12] p-2 rounded-lg border border-[#1e2738] text-[11px] flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">{data.itemStats.rarity || 'Comum'}</span>
            {data.itemStats.cost && <span className="text-amber-300 font-mono">{data.itemStats.cost}</span>}
            {data.itemStats.weight && <span className="text-slate-400">{data.itemStats.weight} lb</span>}
          </div>
        )}

        {/* Quest Info */}
        {data.questStats && (
          <div className="bg-[#070a12] p-2 rounded-lg border border-[#1e2738] space-y-1 text-[11px]">
            <div className="flex items-center justify-between font-medium">
              <span className="text-orange-400">Dificuldade: {data.questStats.difficulty}</span>
              {(data.questStats.xpReward || data.questStats.goldReward) && (
                <span className="text-amber-300 font-mono text-[10px]">
                  {data.questStats.goldReward ? `${data.questStats.goldReward} PO` : ''} {data.questStats.xpReward ? `(${data.questStats.xpReward} XP)` : ''}
                </span>
              )}
            </div>
            {data.questStats.giverNpcName && (
              <p className="text-[10px] text-slate-400">NPC: <strong className="text-slate-300">{data.questStats.giverNpcName}</strong></p>
            )}
          </div>
        )}

        {/* Short Lore / Description */}
        {data.shortDesc && (
          <p className="text-xs text-slate-300 line-clamp-3 font-serif leading-relaxed italic">
            "{data.shortDesc}"
          </p>
        )}
      </div>

      {/* Footer / Quick Action */}
      <div className="pt-2 border-t border-[#1f293d] flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
          {data.categoryLabel}
        </span>
        <button
          onClick={handleInspect}
          className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
        >
          Inspecionar <ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
