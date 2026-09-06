'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  GripVertical, 
  Dices, 
  X, 
  Swords, 
  Sparkles, 
  Check, 
  Zap, 
  Flame, 
  Eye, 
  Shield, 
  Heart, 
  FileText, 
  Footprints,
  User
} from 'lucide-react';
import { Combatant, ConditionType, CharacterSheet, CharacterSpell } from '@/lib/types';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { getAttributeModifier, getJackOfAllTradesBonus } from '@/lib/dnd5e-calculator';
import { CONDITIONS } from '@/lib/srd-data';
import { TokenAuraManagerModal } from '@/components/combat/TokenAuraManagerModal';
import { toast } from 'sonner';

interface CombatantCardProps {
  c: Combatant;
  idx: number;
  characterSheets: CharacterSheet[];
  getSpeedInMeters: (speedStr?: string) => number;
  rollDice: (title: string, mod: number, actorCombatant?: Combatant, actionDesc?: string, forceNoTarget?: boolean) => boolean;
  deductAction: (combatantId: string, actionType: 'action' | 'bonus' | 'reaction') => void;
  handleHpChange: (id: string, delta: number) => void;
  handleToggleCondition: (id: string, condition: ConditionType) => void;
  handleCastSpellFromCard: (c: Combatant, sheet: CharacterSheet, spell: CharacterSpell) => void;
  onUpdateCombatants: (updater: Combatant[] | ((prev: Combatant[]) => Combatant[])) => void;
  onUpdateScene: (scene: any) => Promise<void>;
  activeScene: any;
}

export const CombatantCard: React.FC<CombatantCardProps> = ({
  c,
  idx,
  characterSheets,
  getSpeedInMeters,
  rollDice,
  deductAction,
  handleHpChange,
  handleToggleCondition,
  handleCastSpellFromCard,
  onUpdateCombatants,
  onUpdateScene,
  activeScene,
}) => {
  const {
    broadcastToPlayerView,
    openSheet,
    currentTurnIndex,
    triggerDamageWithConcentrationCheck,
  } = useLiveCockpit();

  const {
    isBattleStarted,
    expandedId,
    statusMenuOpen,
    openSpellDropdownId,
    draggedCardIndex,
    dragOverCardIndex,
    selectedTargetId,
    setSelectedTargetId,
    setExpandedId,
    setStatusMenuOpen,
    setOpenSpellDropdownId,
    setDraggedCardIndex,
    setDragOverCardIndex,
    setConfirmDeleteCombatant,
  } = useLiveCockpitStudioStore();

  const cardRef = useRef<HTMLDivElement>(null);
  const isTurn = idx === currentTurnIndex;
  const isTarget = c.id === selectedTargetId;
  const isExpanded = expandedId === c.id;
  const isStatusOpen = statusMenuOpen === c.id;
  const isAttackDisabled = !isBattleStarted || c.actionUsed;
  const [isAuraModalOpen, setIsAuraModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hpInput, setHpInput] = useState<string>('');

  // Auto-scroll para manter o card ativo em evidência quando passar o turno
  useEffect(() => {
    if (isTurn && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isTurn]);

  // Encontra ficha correspondente
  const matchingSheet = characterSheets.find((s) => {
    const cClean = c.name.split('(')[0].trim().toLowerCase();
    return (
      s.characterName.toLowerCase() === cClean ||
      s.characterName.toLowerCase().includes(cClean) ||
      cClean.includes(s.characterName.toLowerCase())
    );
  });

  const getMod = (stat?: number) => (stat ? Math.floor((stat - 10) / 2) : 0);

  const initMod = matchingSheet
    ? (matchingSheet.initiativeBonus ?? getAttributeModifier(matchingSheet, 'dex')) + getJackOfAllTradesBonus(matchingSheet)
    : c.initiativeBonus !== undefined
    ? c.initiativeBonus
    : c.dex !== undefined
    ? Math.floor((c.dex - 10) / 2)
    : 0;
  const initModStr = initMod >= 0 ? `+${initMod}` : `${initMod}`;
  const rawRoll = c.initiativeRoll !== undefined ? c.initiativeRoll : Math.max(1, Math.min(20, c.initiative - initMod));

  const maxSpeed = getSpeedInMeters(matchingSheet?.speed || c.notes) * (c.hasDashed ? 2 : 1);
  const remainingMovement = Math.max(0, maxSpeed - (c.movementUsed || 0));
  const hpPercent = Math.max(0, Math.min(100, (c.hp / (c.maxHp || 1)) * 100));

  // Imagem / Foto do combatente com fallbacks inteligentes
  const resolvedAvatar =
    c.avatarUrl ||
    c.tokenImageUrl ||
    c.portraitUrl ||
    c.combatImageUrl ||
    c.faceImageUrl ||
    matchingSheet?.avatarUrl ||
    matchingSheet?.faceImageUrl ||
    (c.type === 'monster' ? `/assets/2d/Monstros/${c.name}.png` : undefined);

  const groupedSpells = matchingSheet
    ? (() => {
        const groups: Record<number, CharacterSpell[]> = {};
        matchingSheet.spells?.forEach((spell) => {
          const lvl = spell.level ?? 0;
          if (!groups[lvl]) groups[lvl] = [];
          groups[lvl].push(spell);
        });
        return groups;
      })()
    : {};

  // Lógica de Ações Lendárias
  const isMonsterOrLegendary = c.type === 'monster' || c.type === 'npc' || c.isLegendary || c.legendaryActions !== undefined;
  const maxLegendary = c.maxLegendaryActions ?? 3;
  const isLegendaryActive = c.isLegendary === true || (c.isLegendary !== false && c.legendaryActions !== undefined);
  const currentLegendary = c.legendaryActions !== undefined ? c.legendaryActions : maxLegendary;

  const handleSpendLegendary = (cost: number = 1) => {
    const nextVal = Math.max(0, (c.legendaryActions !== undefined ? c.legendaryActions : maxLegendary) - cost);
    onUpdateCombatants((prev) => {
      const next = prev.map((x) => (x.id === c.id ? { ...x, isLegendary: true, legendaryActions: nextVal } : x));
      if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
      return next;
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('masters_codex_log_entry', {
        detail: {
          message: `⚡ ${c.name} usou ${cost} Ação Lendária (restam ${nextVal}/${maxLegendary})!`,
          description: `Ação lendária executada fora do seu turno.`,
          type: 'legendary_action',
          actorId: c.id,
        }
      }));
      window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
        detail: { combatantId: c.id, type: 'damage', amount: `-${cost} Ação Lendária` }
      }));
    }
  };

  const handleToggleLegendarySlot = (slotIdx: number) => {
    const cur = c.legendaryActions !== undefined ? c.legendaryActions : maxLegendary;
    const nextVal = slotIdx < cur ? slotIdx : slotIdx + 1;
    onUpdateCombatants((prev) => {
      const next = prev.map((x) => (x.id === c.id ? { ...x, isLegendary: true, legendaryActions: nextVal } : x));
      if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
      return next;
    });

    if (slotIdx < cur && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('masters_codex_log_entry', {
        detail: {
          message: `⚡ ${c.name} gastou 1 Ação Lendária (restam ${nextVal}/${maxLegendary})!`,
          description: `Slot #${slotIdx + 1} consumido.`,
          type: 'legendary_action',
          actorId: c.id,
        }
      }));
      window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
        detail: { combatantId: c.id, type: 'damage', amount: '-1 Ação Lendária' }
      }));
    }
  };

  const handleResetLegendary = () => {
    onUpdateCombatants((prev) => {
      const next = prev.map((x) => (x.id === c.id ? { ...x, legendaryActions: maxLegendary } : x));
      if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
      return next;
    });
    toast.success(`${c.name} recuperou todas as ${maxLegendary} Ações Lendárias!`);
  };

  const handleToggleLegendaryFeature = () => {
    const nextState = !isLegendaryActive;
    onUpdateCombatants((prev) => {
      const next = prev.map((x) => (x.id === c.id ? {
        ...x,
        isLegendary: nextState ? true : false,
        legendaryActions: nextState ? (x.maxLegendaryActions ?? 3) : undefined,
        maxLegendaryActions: nextState ? (x.maxLegendaryActions ?? 3) : undefined,
      } : x));
      if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
      return next;
    });
    if (nextState) {
      toast.success(`⚡ Ações Lendárias ativadas para ${c.name}!`);
    } else {
      toast.info(`Ações Lendárias desativadas para ${c.name}.`);
    }
  };

  const handleCardDrop = (targetIdx: number) => {
    if (draggedCardIndex === null || draggedCardIndex === targetIdx) return;
    onUpdateCombatants((prev) => {
      const next = [...prev];
      const [dragged] = next.splice(draggedCardIndex, 1);
      next.splice(targetIdx, 0, dragged);
      if (activeScene) {
        onUpdateScene({ ...activeScene, combatants: next });
      }
      return next;
    });
  };

  const handleApplyHp = (isDamage: boolean) => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val) || val <= 0) return;
    if (isDamage && triggerDamageWithConcentrationCheck) {
      triggerDamageWithConcentrationCheck(c.id, val);
    } else {
      handleHpChange(c.id, isDamage ? -val : val);
    }
    setHpInput('');
  };

  // Subtítulo descritivo do combatente
  const subtitle = c.type === 'player'
    ? `${matchingSheet?.className || 'Aventureiro'}${matchingSheet?.subclass ? ` (${matchingSheet.subclass})` : ''}${matchingSheet?.race ? ` • ${matchingSheet.race}` : ''}`
    : `${c.size ? `${c.size} ` : ''}${c.type === 'monster' ? 'Monstro' : 'NPC'}${c.cr ? ` • ND ${c.cr}` : ''}`;

  return (
    <div
      ref={cardRef}
      draggable={true}
      onDragStart={(e) => {
        setDraggedCardIndex(idx);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (dragOverCardIndex !== idx) setDragOverCardIndex(idx);
      }}
      onDragLeave={() => {
        if (dragOverCardIndex === idx) setDragOverCardIndex(null);
      }}
      onDrop={() => handleCardDrop(idx)}
      onDragEnd={() => {
        setDraggedCardIndex(null);
        setDragOverCardIndex(null);
      }}
      onClick={() => {
        setSelectedTargetId(c.id);
        broadcastToPlayerView({ targetId: c.id });
      }}
      className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer relative select-none ${
        draggedCardIndex === idx
          ? 'opacity-30 scale-[0.98] border-dashed border-amber-500/80 bg-amber-500/10'
          : dragOverCardIndex === idx
          ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10'
          : isTurn
          ? 'bg-gradient-to-r from-amber-950/40 via-[#131926] to-[#0e131d] border-amber-500/90 shadow-[0_0_18px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/60'
          : isTarget
          ? 'ring-2 ring-rose-500 border-rose-500 shadow-rose-950/30 bg-[#121824]'
          : 'bg-[#0c1017]/95 border-[#232d40] hover:border-slate-700 hover:bg-[#101622]'
      }`}
    >
      {/* 1. Header Row (Avatar + Nome/Stats + Ações Rápidas) */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Drag Handle + Avatar + Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag Grip */}
          <div
            className="py-1 text-slate-600 hover:text-amber-400 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
            title="Arraste para reordenar a iniciativa"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* Avatar Thumbnail with Level/Initiative Badge */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-[#090d14] border border-[#2a3449] shrink-0 shadow-md group/avatar">
            {resolvedAvatar && !imgError ? (
              <img
                src={resolvedAvatar}
                alt={c.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover object-top transition-transform group-hover/avatar:scale-105"
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                c.type === 'player' ? 'bg-sky-950/60 text-sky-400' : c.type === 'monster' ? 'bg-rose-950/60 text-rose-400' : 'bg-amber-950/60 text-amber-400'
              }`}>
                {c.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Initiative Pill on the Avatar Corner */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const d20 = Math.floor(Math.random() * 20) + 1;
                const total = d20 + initMod;
                onUpdateCombatants((prev) => {
                  const next = prev
                    .map((x) => (x.id === c.id ? { ...x, initiative: total, initiativeRoll: d20, initiativeBonus: initMod } : x))
                    .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
                  if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                  return next;
                });
                toast.success(`Nova iniciativa de ${c.name}: d20(${d20}) ${initModStr} = ${total}`);
              }}
              className="absolute bottom-0 right-0 bg-[#0a0d14]/90 hover:bg-amber-500 hover:text-slate-950 text-amber-400 font-mono text-[8px] font-extrabold px-1 py-0.2 rounded-tl-md border-t border-l border-amber-500/40 backdrop-blur-xs transition-colors cursor-pointer"
              title={`Iniciativa Total: ${c.initiative} [Dado: ${rawRoll} | Base: ${initModStr}]. Clique para rolar novamente.`}
            >
              #{c.initiative}
            </button>
          </div>

          {/* Name, Subtitle and Stat Chips */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            {/* Row 1: Name & Badges */}
            <div className="flex items-center gap-1.5 min-w-0">
              <h4
                onClick={(e) => {
                  e.stopPropagation();
                  openSheet(c.id || c.name, c.type === 'player' ? 'pc' : c.type, c.name, c);
                }}
                className="font-bold text-slate-100 text-xs hover:text-amber-400 hover:underline transition-colors truncate cursor-pointer leading-tight"
                title={`Abrir ficha de ${c.name}`}
              >
                {c.name}
              </h4>
              {isTarget && (
                <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-950/60 px-1 rounded border border-rose-500/40 shrink-0">
                  ALVO
                </span>
              )}
              {isTurn && (
                <span className="text-[8px] font-black uppercase bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded animate-pulse shrink-0 shadow-sm">
                  SUA VEZ
                </span>
              )}
            </div>

            {/* Row 2: Subtitle (Classe, Raça ou Tipo de Monstro) */}
            <div className="text-[10px] text-amber-400/80 truncate font-medium leading-tight">
              {subtitle}
            </div>

            {/* Row 3: Compact Stat Chips (Iniciativa, CA, PV, Mov) */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {/* Initiative Chip */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  const d20 = Math.floor(Math.random() * 20) + 1;
                  const total = d20 + initMod;
                  onUpdateCombatants((prev) => {
                    const next = prev
                      .map((x) => (x.id === c.id ? { ...x, initiative: total, initiativeRoll: d20, initiativeBonus: initMod } : x))
                      .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
                    if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                    return next;
                  });
                  toast.success(`Nova iniciativa de ${c.name}: d20(${d20}) ${initModStr} = ${total}`);
                }}
                className="flex items-center gap-1 bg-[#090d14] hover:bg-amber-500/20 border border-amber-500/50 hover:border-amber-400 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-amber-300 shadow-inner shrink-0 cursor-pointer transition-colors group/init"
                title={`Iniciativa: Total ${c.initiative} (Rolagem d20: ${rawRoll} + Base: ${initModStr}). Clique para rolar novamente.`}
              >
                <Dices className="w-2.5 h-2.5 text-amber-400 group-hover/init:rotate-180 transition-transform shrink-0" />
                <span>Inic {c.initiative}</span>
                <span className="text-[9px] text-amber-400/80 font-normal">
                  (d20:{rawRoll} | {initModStr})
                </span>
              </div>

              {/* CA Badge */}
              <div 
                className="flex items-center gap-1 bg-[#090d14] border border-cyan-500/40 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-cyan-300 shadow-inner shrink-0"
                title="Classe de Armadura (CA)"
              >
                <Shield className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <span>CA {c.ac}</span>
              </div>

              {/* PV Badge */}
              <div 
                className="flex items-center gap-1 bg-[#090d14] border border-emerald-500/40 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-emerald-300 shadow-inner shrink-0"
                title="Pontos de Vida (PV)"
              >
                <Heart className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400/20 shrink-0" />
                <span>PV {c.hp}/{c.maxHp}</span>
              </div>

              {/* Movement Badge */}
              <div 
                className="flex items-center gap-1 bg-[#090d14] border border-[#2a3449] px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-slate-300 shrink-0"
                title="Deslocamento restante"
              >
                <Footprints className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>{remainingMovement.toFixed(1)}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions (Ficha, Dices, Delete) */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openSheet(c.id || c.name, c.type === 'player' ? 'pc' : c.type, c.name, c)}
            className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Abrir Ficha Completa"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Ficha</span>
          </button>

          <button
            onClick={() => setExpandedId(isExpanded ? null : c.id)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isExpanded
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-[#0f141d] border-[#2a3449] text-slate-400 hover:text-slate-200'
            }`}
            title="Ações e Rolagens Detalhadas"
          >
            <Dices className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setConfirmDeleteCombatant(c)}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Remover combatente da batalha"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Slim Health Progress Bar */}
      <div className="w-full bg-[#080b10] h-1.5 rounded-full overflow-hidden border border-[#232d40]/80 shadow-inner">
        <div 
          className={`h-full transition-all duration-300 ${
            hpPercent > 50 
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
              : hpPercent > 20 
              ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
              : 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* 3. Action Economy & Quick Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-[#232d40]/60 select-none" onClick={(e) => e.stopPropagation()}>
        {/* Left: Action Chips */}
        <div className="flex flex-wrap items-center gap-1 relative">
          {/* Ação */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUpdateCombatants((prev) => {
                const next = prev.map((x) => (x.id === c.id ? { ...x, actionUsed: !x.actionUsed } : x));
                if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                return next;
              });
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-colors cursor-pointer ${
              c.actionUsed
                ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/50'
            }`}
            title="Ação do Turno"
          >
            Ação
          </button>

          {/* Bônus */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUpdateCombatants((prev) => {
                const next = prev.map((x) => (x.id === c.id ? { ...x, bonusActionUsed: !x.bonusActionUsed } : x));
                if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                return next;
              });
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-colors cursor-pointer ${
              c.bonusActionUsed
                ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60'
                : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/50'
            }`}
            title="Ação Bônus"
          >
            Bônus
          </button>

          {/* Reação */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUpdateCombatants((prev) => {
                const next = prev.map((x) => (x.id === c.id ? { ...x, reactionUsed: !x.reactionUsed } : x));
                if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                return next;
              });
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-colors cursor-pointer ${
              c.reactionUsed
                ? 'bg-slate-900/60 text-slate-500 border-slate-800 line-through opacity-60'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/50 hover:bg-amber-900/50'
            }`}
            title="Reação"
          >
            Reação
          </button>

          {/* Concentração */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onUpdateCombatants((prev) => {
                const next = prev.map((x) => (x.id === c.id ? { ...x, isConcentrating: !x.isConcentrating, concentrationSpell: !x.isConcentrating ? (x.concentrationSpell || 'Magia') : undefined } : x));
                if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                return next;
              });
              if (!c.isConcentrating) {
                toast.info(`✨ ${c.name} agora está concentrando em uma magia!`);
              } else {
                toast.info(`🌑 ${c.name} encerrou a concentração.`);
              }
            }}
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-all flex items-center gap-1 cursor-pointer ${
              c.isConcentrating
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/70 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-[#0a0d14] text-slate-500 border-[#2a3449] hover:text-slate-300'
            }`}
            title={c.isConcentrating ? `Concentrando em ${c.concentrationSpell || 'Magia'}` : 'Alternar Concentração'}
          >
            <span>Conc</span>
            {c.isConcentrating && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
          </button>

          {/* Disparada (no turno) */}
          {isTurn && (
            <button
              type="button"
              disabled={c.actionUsed}
              onClick={(e) => {
                e.preventDefault();
                onUpdateCombatants((prev) => {
                  const next = prev.map((x) => (x.id === c.id ? { ...x, actionUsed: true, hasDashed: true } : x));
                  if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                  return next;
                });
                toast.success(`${c.name} usou Disparada (Dash)! Deslocamento duplicado.`);
              }}
              className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border transition-colors ${
                c.hasDashed
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                  : c.actionUsed
                  ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 cursor-pointer'
              }`}
              title="Usar Ação para Disparada"
            >
              Dash
            </button>
          )}

          {/* Botão + Status */}
          <button
            onClick={() => setStatusMenuOpen(isStatusOpen ? null : c.id)}
            className="text-[8px] font-bold text-slate-300 bg-[#0f141d] hover:bg-[#1e293b] border border-[#2a3449] px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
          >
            + Status
          </button>

          {/* Botão + Aura */}
          <button
            onClick={() => setIsAuraModalOpen(true)}
            className="text-[8px] font-bold text-amber-300 bg-[#0f141d] hover:bg-amber-950/30 border border-amber-500/30 hover:border-amber-500/60 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
            title="Gerenciar Auras"
          >
            <Sparkles className="w-2.5 h-2.5" />
            <span>+ Aura</span>
          </button>

          {/* Botão + Lendário */}
          {isMonsterOrLegendary && (
            <button
              type="button"
              onClick={handleToggleLegendaryFeature}
              className={`px-1.5 py-0.5 text-[8px] font-bold rounded transition-all flex items-center gap-1 cursor-pointer ${
                isLegendaryActive
                  ? 'text-amber-300 bg-amber-500/20 border border-amber-500/50 hover:bg-rose-500/20 hover:text-rose-300'
                  : 'text-amber-400/80 bg-[#0f141d] border border-amber-500/30 hover:border-amber-500/60'
              }`}
              title={isLegendaryActive ? 'Ações Lendárias ativas' : 'Habilitar Ações Lendárias'}
            >
              <Zap className="w-2.5 h-2.5 text-amber-400" />
              <span>{isLegendaryActive ? 'Lendário ✓' : '+ Lend.'}</span>
            </button>
          )}

          {/* Status Popover */}
          {isStatusOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#0f141d] border border-slate-700 rounded-xl shadow-2xl p-2 z-40 grid grid-cols-2 gap-1 animate-in fade-in zoom-in-95 duration-100" onClick={(e) => e.stopPropagation()}>
              {CONDITIONS.map((cond) => {
                const active = c.conditions?.includes(cond);
                return (
                  <button
                    key={cond}
                    onClick={() => handleToggleCondition(c.id, cond)}
                    className={`text-[9px] text-left px-2 py-1 rounded transition-colors ${
                      active ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30' : 'text-slate-400 hover:bg-[#1e293b]'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {cond}
                  </button>
                );
              })}
              
              {/* Custom Effect Row */}
              <div className="col-span-2 border-t border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    const name = window.prompt('Nome do Efeito / Status Customizado:');
                    if (!name) return;
                    const rawDuration = window.prompt(`Duração de '${name}' em rodadas (vazio ou 0 para infinito):`, '0');
                    const duration = parseInt(rawDuration || '0', 10);
                    
                    onUpdateCombatants(prev => prev.map(x => x.id === c.id ? {
                      ...x,
                      statusDurations: [...(x.statusDurations || []), { name, remainingRounds: duration > 0 ? duration : 99 }]
                    } : x));
                  }}
                  className="w-full text-center text-[9px] font-bold text-amber-400 bg-amber-950/20 hover:bg-amber-900/30 py-1 rounded"
                >
                  + Efeito Customizado
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Inline Compact Damage / Heal Input */}
        <div className="flex items-center bg-[#090d14] rounded-lg border border-[#2a3449] overflow-hidden focus-within:border-amber-500/50 shadow-inner">
          <input 
            type="number" 
            value={hpInput} 
            onChange={(e) => setHpInput(e.target.value)}
            placeholder="Val" 
            className="w-8 bg-transparent text-[10px] font-mono font-bold text-center text-slate-200 outline-none p-0.5 appearance-none"
          />
          <button 
            onClick={() => handleApplyHp(true)} 
            className="px-1.5 py-0.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border-l border-[#2a3449] transition-colors cursor-pointer" 
            title="Causar Dano"
          >
            <Swords className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={() => handleApplyHp(false)} 
            className="px-1.5 py-0.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border-l border-[#2a3449] transition-colors cursor-pointer" 
            title="Curar Vida"
          >
            <Heart className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* 4. Active Conditions & Status Durations Badges (se houver) */}
      {((c.conditions && c.conditions.length > 0) || (c.statusDurations && c.statusDurations.length > 0) || (c.auras && c.auras.length > 0)) && (
        <div className="flex flex-wrap gap-1 items-center" onClick={(e) => e.stopPropagation()}>
          {c.conditions?.map((cond) => {
            const duration = c.statusDurations?.find(d => d.name === cond)?.remainingRounds;
            return (
              <span
                key={cond}
                onClick={() => handleToggleCondition(c.id, cond)}
                className="text-[8px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded-full cursor-pointer hover:bg-rose-500/40"
              >
                {cond}{duration !== undefined && duration > 0 ? ` (${duration}r)` : ''} ×
              </span>
            );
          })}

          {c.statusDurations?.filter(d => !c.conditions?.includes(d.name as any)).map((effect) => (
            <span
              key={effect.name}
              onClick={() => {
                onUpdateCombatants(prev => prev.map(x => x.id === c.id ? {
                  ...x,
                  statusDurations: x.statusDurations?.filter(d => d.name !== effect.name)
                } : x));
              }}
              className="text-[8px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-full cursor-pointer hover:bg-cyan-500/40"
              title="Clique para remover"
            >
              {effect.name} ({effect.remainingRounds === 99 ? '∞' : `${effect.remainingRounds}r`}) ×
            </span>
          ))}

          {c.auras && c.auras.length > 0 && (
            <span
              onClick={() => setIsAuraModalOpen(true)}
              className="text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full cursor-pointer hover:bg-amber-500/40 flex items-center gap-1"
              title="Gerenciar Auras do Token"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>{c.auras.filter((a) => a.enabled).length} Auras</span>
            </span>
          )}
        </div>
      )}

      {/* 5. Quick Attack Actions & Spell Dropdown */}
      <div
        className="pt-1.5 border-t border-[#2a3449]/40 flex flex-wrap items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[8px] font-bold text-rose-400/80 uppercase font-mono tracking-wider mr-0.5">Ataques:</span>
        {c.type === 'player' && matchingSheet && matchingSheet.attacks && matchingSheet.attacks.length > 0 ? (
          matchingSheet.attacks.map((atk) => {
            const bonus = parseInt(atk.atkBonus.replace('+', '').trim()) || 0;
            return (
              <button
                key={atk.id}
                disabled={isAttackDisabled}
                onClick={() => {
                  if (rollDice(`Ataque: ${atk.name}`, bonus, c, atk.damage)) {
                    deductAction(c.id, 'action');
                  }
                }}
                className={`px-2 py-0.5 font-bold text-[9px] rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 border ${
                  isAttackDisabled
                    ? 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-500/40 cursor-pointer'
                }`}
                title={!isBattleStarted ? 'Inicie a batalha no topo para realizar ataques' : `Rolar ${atk.name} (${atk.damage} de dano)`}
              >
                <Swords className="w-2.5 h-2.5 text-rose-400" />
                <span>{atk.name} (+{bonus})</span>
              </button>
            );
          })
        ) : c.actions && c.actions.length > 0 ? (
          c.actions.slice(0, 3).map((act) => {
            const match = act.desc.match(/\+([0-9]+)/);
            const bonus = match ? parseInt(match[1]) : getMod(c.str);
            return (
              <button
                key={act.name}
                disabled={isAttackDisabled}
                onClick={() => {
                  if (rollDice(`Ataque: ${act.name}`, bonus, c, act.desc)) {
                    deductAction(c.id, 'action');
                  }
                }}
                className={`px-2 py-0.5 font-bold text-[9px] rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 border ${
                  isAttackDisabled
                    ? 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                    : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-500/40 cursor-pointer'
                }`}
                title={!isBattleStarted ? 'Inicie a batalha no topo para realizar ataques' : act.desc}
              >
                <Swords className="w-2.5 h-2.5 text-rose-400" />
                <span>{act.name} (+{bonus})</span>
              </button>
            );
          })
        ) : (
          <button
            disabled={isAttackDisabled}
            onClick={() => {
              if (rollDice(`Ataque: Corpo a Corpo`, getMod(c.str), c, '1d8')) {
                deductAction(c.id, 'action');
              }
            }}
            className={`px-2 py-0.5 font-bold text-[9px] rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 border ${
              isAttackDisabled
                ? 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-500/40 cursor-pointer'
            }`}
            title={!isBattleStarted ? 'Inicie a batalha no topo para realizar ataques' : 'Ataque corpo a corpo padrão'}
          >
            <Swords className="w-2.5 h-2.5 text-rose-400" />
            <span>Atacar (+{getMod(c.str) >= 0 ? '+' : ''}{getMod(c.str)})</span>
          </button>
        )}

        {/* Spell Dropdown menu */}
        {matchingSheet && matchingSheet.spells && matchingSheet.spells.length > 0 && (
          <div className="relative inline-block">
            <button
              disabled={!isBattleStarted}
              onClick={() => setOpenSpellDropdownId(openSpellDropdownId === c.id ? null : c.id)}
              className={`px-2 py-0.5 font-bold text-[9px] rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 border ${
                !isBattleStarted
                  ? 'bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-sky-950/60 hover:bg-sky-900/70 text-sky-300 border-sky-500/40 cursor-pointer'
              }`}
              title={!isBattleStarted ? 'Inicie a batalha no topo para conjurar magias' : 'Grimório de Magias'}
            >
              <Sparkles className="w-2.5 h-2.5 text-sky-400" />
              <span>Magias</span>
            </button>

            {openSpellDropdownId === c.id && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-[#0f141d]/98 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2.5 z-50 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-1.5 mb-2 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-amber-400 font-mono">
                    Grimório de {matchingSheet.characterName}
                  </span>
                  <button onClick={() => setOpenSpellDropdownId(null)} className="text-slate-500 hover:text-slate-200">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {Object.keys(groupedSpells).length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic p-2 text-center">
                    Nenhuma magia adicionada na ficha.
                  </div>
                ) : (
                  Object.keys(groupedSpells)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map((level) => {
                      const levelSpells = groupedSpells[level] || [];
                      const slots = matchingSheet.spellSlots?.[level] || { total: 0, used: 0 };
                      const hasSlots = level === 0 || slots.used < slots.total;

                      return (
                        <div key={level} className="mb-2 last:mb-0">
                          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-800/40 pb-0.5">
                            <span>{level === 0 ? 'Truques' : `${level}º Círculo`}</span>
                            {level > 0 && (
                              <span className={hasSlots ? 'text-emerald-400' : 'text-rose-500'}>
                                Slots: {slots.total - slots.used} / {slots.total}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {levelSpells.map((spell) => {
                              const cleanTime = (spell.castingTime || '').toLowerCase();
                              const isBonus = cleanTime.includes('bônus') || cleanTime.includes('bonus');
                              const isReact = cleanTime.includes('reação') || cleanTime.includes('reaction');
                              const isAct = !isBonus && !isReact;
                              const actionBlocked =
                                (isAct && c.actionUsed) || (isBonus && c.bonusActionUsed) || (isReact && c.reactionUsed);
                              const canCast = hasSlots && !actionBlocked;

                              return (
                                <button
                                  key={spell.id}
                                  disabled={!canCast}
                                  onClick={() => {
                                    handleCastSpellFromCard(c, matchingSheet, spell);
                                    setOpenSpellDropdownId(null);
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded border text-[9px] transition-all flex justify-between items-center ${
                                    canCast
                                      ? 'bg-[#161c28] border-[#2a3449] hover:bg-[#1e293b] hover:border-slate-500 text-slate-200 cursor-pointer active:scale-95'
                                      : 'bg-[#121620]/40 border-[#2a3449]/40 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  <span className="font-semibold truncate max-w-[130px]">{spell.name}</span>
                                  <span className="text-[8px] font-mono text-slate-400 uppercase">
                                    {spell.school || 'Magia'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Legendary Actions Dedicated Tracker (se ativo) */}
      {isMonsterOrLegendary && isLegendaryActive && (
        <div
          className="w-full px-2 py-1 bg-[#0a0d14]/95 border border-amber-500/40 rounded-lg flex items-center justify-between gap-1.5 shadow-sm select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400 animate-pulse" />
            <span className="text-[9px] font-bold font-serif text-amber-300 tracking-wide shrink-0">
              Ações Lendárias:
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/70 px-1 py-0.2 rounded border border-amber-600/40 shrink-0">
              {currentLegendary}/{maxLegendary}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-0.5 shrink-0">
              {Array.from({ length: maxLegendary }).map((_, slotIdx) => {
                const isActive = slotIdx < currentLegendary;
                return (
                  <button
                    key={slotIdx}
                    type="button"
                    onClick={() => handleToggleLegendarySlot(slotIdx)}
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.35)] hover:bg-amber-500/40 hover:scale-105'
                        : 'bg-slate-900/80 text-slate-600 border border-slate-800 hover:border-amber-500/40'
                    }`}
                    title={isActive ? `Gastar ação lendária #${slotIdx + 1}` : `Recuperar ação lendária #${slotIdx + 1}`}
                  >
                    <Zap className={`w-2 h-2 shrink-0 ${isActive ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-0.5 ml-1 border-l border-amber-500/20 pl-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSpendLegendary(1)}
                disabled={currentLegendary <= 0}
                className="px-1 py-0.2 text-[8px] font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-600/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                title="Gastar 1 ação lendária"
              >
                -1
              </button>
              <button
                type="button"
                onClick={handleResetLegendary}
                className="px-1 py-0.2 text-[8px] font-bold text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 rounded transition-colors cursor-pointer font-mono shrink-0"
                title="Restaurar todas as ações lendárias"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Expanded Action Panel (Salva-guardas, Visão, Perícias) */}
      {isExpanded && (
        <div
          className="mt-1 pt-2 border-t border-[#2a3449] animate-in slide-in-from-top-2 fade-in duration-200 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Saves & Skills */}
          <div>
            <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Rolagens Rápidas
            </h5>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => rollDice(`${c.name} - Percepção`, getMod(c.wis), c)}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[8px] font-semibold text-slate-300"
              >
                Percepção ({getMod(c.wis) >= 0 ? '+' : ''}{getMod(c.wis)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva STR`, getMod(c.str), c)}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[8px] font-semibold text-slate-300"
              >
                STR ({getMod(c.str) >= 0 ? '+' : ''}{getMod(c.str)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva DEX`, getMod(c.dex), c)}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[8px] font-semibold text-slate-300"
              >
                DEX ({getMod(c.dex) >= 0 ? '+' : ''}{getMod(c.dex)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva CON`, getMod(c.con), c)}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[8px] font-semibold text-slate-300"
              >
                CON ({getMod(c.con) >= 0 ? '+' : ''}{getMod(c.con)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva WIS`, getMod(c.wis), c)}
                className="px-1.5 py-0.5 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[8px] font-semibold text-slate-300"
              >
                WIS ({getMod(c.wis) >= 0 ? '+' : ''}{getMod(c.wis)})
              </button>
            </div>
          </div>

          {/* Visão & Iluminação Dinâmica */}
          <div className="flex flex-col gap-1.5 p-2 bg-[#080b11] border border-[#2a3449]/70 rounded-lg">
            <div className="flex items-center justify-between">
              <h5 className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3" /> Visão & Iluminação
              </h5>
              
              <button
                type="button"
                onClick={() => {
                  const nextTorch = !c.hasTorch;
                  onUpdateCombatants((prev) =>
                    prev.map((x) => (x.id === c.id ? { ...x, hasTorch: nextTorch } : x))
                  );
                  if (nextTorch) {
                    toast.success(`🔥 ${c.name} acendeu uma tocha (20ft plena / 20ft penumbra)!`);
                  } else {
                    toast.info(`🌑 ${c.name} apagou a tocha.`);
                  }
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold transition-all border ${
                  c.hasTorch
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <Flame className={`w-2.5 h-2.5 ${c.hasTorch ? 'text-amber-400 animate-pulse' : ''}`} />
                {c.hasTorch ? 'Tocha Acesa' : 'Acender Tocha'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Raio Visão (pés)
                </label>
                <input
                  type="number"
                  value={c.visionRange ?? 30}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const updatedVal = isNaN(val) ? undefined : val;
                    onUpdateCombatants((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, visionRange: updatedVal } : x))
                    );
                  }}
                  className="w-full px-1.5 py-0.5 bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 outline-none rounded text-[9px] text-slate-300 font-mono"
                  placeholder="30"
                />
              </div>

              {c.visionType === 'darkvision' && (
                <div>
                  <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Darkvision (pés)
                  </label>
                  <input
                    type="number"
                    value={c.darkvisionRange ?? 60}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const updatedVal = isNaN(val) ? undefined : val;
                      onUpdateCombatants((prev) =>
                        prev.map((x) => (x.id === c.id ? { ...x, darkvisionRange: updatedVal } : x))
                      );
                    }}
                    className="w-full px-1.5 py-0.5 bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 outline-none rounded text-[9px] text-slate-300 font-mono"
                    placeholder="60"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Tipo de Sentido / Visão
              </label>
              <select
                value={c.visionType || 'normal'}
                onChange={(e) => {
                  const val = e.target.value as any;
                  onUpdateCombatants((prev) =>
                    prev.map((x) => (x.id === c.id ? { ...x, visionType: val } : x))
                  );
                }}
                className="w-full bg-[#0a0d14] text-[9px] font-semibold text-slate-300 border border-[#2a3449] rounded px-1.5 py-0.5 outline-none focus:border-cyan-500"
              >
                <option value="normal">Visão Normal (Humano)</option>
                <option value="darkvision">Visão no Escuro / Darkvision</option>
                <option value="blindsight">Visão Cega / Blindsight</option>
                <option value="tremorsense">Sentido Sísmico / Tremorsense</option>
                <option value="truesight">Visão Verdadeira / Truesight</option>
              </select>
            </div>
          </div>

          {/* Todas as ações ofensivas do Monstro */}
          {c.actions && c.actions.length > 0 && (
            <div>
              <h5 className="text-[9px] font-bold text-rose-500/70 uppercase tracking-wider mb-1">Todas as Ações</h5>
              <div className="space-y-1">
                {c.actions.map((act) => (
                  <div key={act.name} className="p-1.5 bg-[#0a0d14] border border-[#2a3449] rounded-lg">
                    <div className="flex justify-between items-start mb-0.5">
                      <strong className="text-[9px] text-amber-300">{act.name}</strong>
                      {(() => {
                        const match = act.desc.match(/\+([0-9]+)/);
                        if (match) {
                          const bonus = parseInt(match[1]);
                          return (
                            <button
                              disabled={isAttackDisabled}
                              onClick={() => rollDice(`Ataque: ${act.name}`, bonus, c, act.desc)}
                              className={`text-[8px] px-1.5 py-0.2 rounded font-bold transition-colors ${
                                isAttackDisabled
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                                  : 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer'
                              }`}
                              title={!isBattleStarted ? 'Inicie a batalha no topo para realizar ataques' : `Rolar Atq +${bonus}`}
                            >
                              Atq +{bonus}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-[8px] text-slate-400 leading-snug">{act.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Gerenciamento de Auras */}
      <TokenAuraManagerModal
        combatant={c}
        isOpen={isAuraModalOpen}
        onClose={() => setIsAuraModalOpen(false)}
      />
    </div>
  );
};
