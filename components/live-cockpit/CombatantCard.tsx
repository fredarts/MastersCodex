'use client';

import React from 'react';
import { GripVertical, Dices, X, Swords, Sparkles, Check } from 'lucide-react';
import { Combatant, ConditionType, CharacterSheet, CharacterSpell } from '@/lib/types';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { CombatantHpManager } from '@/components/live-cockpit/CombatantHpManager';
import { getAttributeModifier, getJackOfAllTradesBonus } from '@/lib/dnd5e-calculator';
import { CONDITIONS } from '@/lib/srd-data';
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
  } = useLiveCockpit();

  const {
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

  const isTurn = idx === useLiveCockpit().currentTurnIndex;
  const isTarget = c.id === selectedTargetId;
  const isExpanded = expandedId === c.id;
  const isStatusOpen = statusMenuOpen === c.id;

  // Find matching Character Sheet
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
    : c.dex !== undefined
    ? Math.floor((c.dex - 10) / 2)
    : 0;
  const initModStr = initMod >= 0 ? `+${initMod}` : `${initMod}`;

  const maxSpeed = getSpeedInMeters(matchingSheet?.speed || c.notes) * (c.hasDashed ? 2 : 1);
  const remainingMovement = Math.max(0, maxSpeed - (c.movementUsed || 0));

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

  return (
    <div
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
      className={`p-3 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer relative ${
        draggedCardIndex === idx
          ? 'opacity-30 scale-[0.98] border-dashed border-amber-500/80 bg-amber-500/10'
          : dragOverCardIndex === idx
          ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/10'
          : isTarget
          ? 'ring-2 ring-rose-500 border-rose-500 shadow-rose-900/30'
          : isTurn
          ? 'bg-gradient-to-r from-rose-950/40 via-[#161c28] to-[#121824] border-rose-500/80 shadow-xl'
          : 'bg-[#121824] border-[#2a3449] opacity-90 hover:opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left Info */}
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Drag Handle Icon */}
          <div
            className="py-2.5 px-0.5 text-slate-600 hover:text-amber-400 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
            title="Clique e arraste para reordenar a iniciativa"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              const d20 = Math.floor(Math.random() * 20) + 1;
              const total = d20 + initMod;
              onUpdateCombatants((prev) => {
                const next = prev
                  .map((x) => (x.id === c.id ? { ...x, initiative: total } : x))
                  .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
                if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                return next;
              });
              toast.success(`Nova iniciativa de ${c.name}: d20(${d20}) ${initModStr} = ${total}`);
            }}
            className="px-2 py-1 min-w-[54px] h-10 rounded-xl bg-[#0a0d14] border border-[#2a3449] hover:border-amber-500/50 flex flex-col items-center justify-center font-mono shadow-inner flex-shrink-0 cursor-pointer transition-colors group"
            title={`Clique para rolar nova iniciativa! Bônus Base: ${initModStr} | Total Rolado: ${c.initiative}`}
          >
            <span className="text-[7px] font-bold text-slate-500 font-sans tracking-wider uppercase group-hover:text-amber-400/80 transition-colors">
              INIC
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-extrabold text-amber-400 leading-none">{c.initiative}</span>
              <span className="text-[9px] font-bold text-slate-400 leading-none">({initModStr})</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                onClick={(e) => {
                  e.stopPropagation();
                  const { openSheet } = useLiveCockpit();
                  openSheet(c.id || c.name, c.type === 'player' ? 'pc' : c.type, c.name, c);
                }}
                className="font-bold text-slate-100 text-xs flex items-center gap-1 cursor-pointer hover:text-amber-400 hover:underline transition-colors truncate"
              >
                {c.name}
                {isTarget && <span className="text-[9px] text-rose-400 font-mono font-bold flex-shrink-0">(ALVO)</span>}
              </h4>
              {isTurn && (
                <span className="text-[8px] font-black uppercase bg-rose-500 text-slate-950 px-1.5 py-0.5 rounded animate-pulse flex-shrink-0">
                  ATUAL
                </span>
              )}
            </div>
            {/* Condition Badges */}
            <div className="flex flex-wrap gap-1 mt-1 relative">
              {c.conditions?.map((cond) => {
                const duration = c.statusDurations?.find(d => d.name === cond)?.remainingRounds;
                return (
                  <span
                    key={cond}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCondition(c.id, cond);
                    }}
                    className="text-[8px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-rose-500/40"
                  >
                    {cond}{duration !== undefined && duration > 0 ? ` (${duration}r)` : ''} ×
                  </span>
                );
              })}

              {/* Custom Status Durations Badges (e.g. Fúria) */}
              {c.statusDurations?.filter(d => !c.conditions?.includes(d.name as any)).map((effect) => (
                <span
                  key={effect.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateCombatants(prev => prev.map(x => x.id === c.id ? {
                      ...x,
                      statusDurations: x.statusDurations?.filter(d => d.name !== effect.name)
                    } : x));
                  }}
                  className="text-[8px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-cyan-500/40"
                  title="Clique para remover"
                >
                  {effect.name} ({effect.remainingRounds === 99 ? '∞' : `${effect.remainingRounds}r`}) ×
                </span>
              ))}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStatusMenuOpen(isStatusOpen ? null : c.id);
                }}
                className="text-[8px] font-bold text-slate-400 bg-[#0f141d] hover:bg-[#1e293b] border border-[#2a3449] px-1.5 py-0.5 rounded-full transition-colors flex items-center gap-1"
              >
                + Status
              </button>
 
              {/* Status Popover */}
              {isStatusOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f141d] border border-slate-700 rounded-xl shadow-2xl p-2 z-20 grid grid-cols-2 gap-1" onClick={(e) => e.stopPropagation()}>
                  {CONDITIONS.map((cond) => {
                    const active = c.conditions?.includes(cond);
                    return (
                      <button
                        key={cond}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCondition(c.id, cond);
                        }}
                        className={`text-[9px] text-left px-2 py-1 rounded ${
                          active ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:bg-[#1e293b]'
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
                      onClick={(e) => {
                        e.stopPropagation();
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

            {/* Action Economy Tracker */}
            <div className="flex flex-wrap items-center gap-1 mt-2.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateCombatants((prev) => {
                    const next = prev.map((x) => (x.id === c.id ? { ...x, actionUsed: !x.actionUsed } : x));
                    if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                    return next;
                  });
                }}
                className={`px-2 py-0.5 text-[9px] font-extrabold rounded border transition-colors ${
                  c.actionUsed
                    ? 'bg-slate-800 text-slate-500 border-slate-700/60'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
                title="Ação do Turno (Atacar, Conjurar Magia, etc.)"
              >
                Ação
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateCombatants((prev) => {
                    const next = prev.map((x) => (x.id === c.id ? { ...x, bonusActionUsed: !x.bonusActionUsed } : x));
                    if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                    return next;
                  });
                }}
                className={`px-2 py-0.5 text-[9px] font-extrabold rounded border transition-colors ${
                  c.bonusActionUsed
                    ? 'bg-slate-800 text-slate-500 border-slate-700/60'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30'
                }`}
                title="Ação Bônus"
              >
                Bônus
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdateCombatants((prev) => {
                    const next = prev.map((x) => (x.id === c.id ? { ...x, reactionUsed: !x.reactionUsed } : x));
                    if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                    return next;
                  });
                }}
                className={`px-2 py-0.5 text-[9px] font-extrabold rounded border transition-colors ${
                  c.reactionUsed
                    ? 'bg-slate-800 text-slate-500 border-slate-700/60'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                }`}
                title="Reação (Ataques de Oportunidade)"
              >
                Reação
              </button>

              {isTurn && (
                <button
                  type="button"
                  disabled={c.actionUsed}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpdateCombatants((prev) => {
                      const next = prev.map((x) => {
                        if (x.id === c.id) {
                          return {
                            ...x,
                            actionUsed: true,
                            hasDashed: true,
                          };
                        }
                        return x;
                      });
                      if (activeScene) onUpdateScene({ ...activeScene, combatants: next });
                      return next;
                    });
                    toast.success(`${c.name} usou Disparada (Dash)! Deslocamento duplicado.`);
                  }}
                  className={`px-2 py-0.5 text-[9px] font-extrabold rounded border transition-colors ${
                    c.hasDashed
                      ? 'bg-orange-600/30 text-orange-400 border-orange-500/40 font-black'
                      : c.actionUsed
                      ? 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                      : 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30'
                  }`}
                  title="Usar Ação para Disparada (Dash)"
                >
                  Disparada
                </button>
              )}

              <span className="text-[9px] text-slate-400 font-mono ml-1.5 font-bold">
                Mov: {remainingMovement.toFixed(1)}m / {maxSpeed.toFixed(1)}m
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setExpandedId(isExpanded ? null : c.id)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isExpanded
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-[#0f141d] border-[#2a3449] text-slate-400 hover:text-slate-200'
            }`}
            title="Ações e Rolagens"
          >
            <Dices className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmDeleteCombatant(c)}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Remover combatente da batalha"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Precise HP System (Modular Component) */}
      <CombatantHpManager combatant={c} onHpChange={handleHpChange} />

      {/* Prominent Quick Attack Actions */}
      <div
        className="mt-2 pt-2 border-t border-[#2a3449]/60 flex flex-wrap items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[9px] font-bold text-rose-400/80 uppercase font-mono tracking-wider mr-1">Ataques:</span>
        {c.type === 'player' && matchingSheet && matchingSheet.attacks && matchingSheet.attacks.length > 0 ? (
          matchingSheet.attacks.map((atk) => {
            const bonus = parseInt(atk.atkBonus.replace('+', '').trim()) || 0;
            return (
              <button
                key={atk.id}
                disabled={c.actionUsed}
                onClick={() => {
                  if (rollDice(`Ataque: ${atk.name}`, bonus, c, atk.damage)) {
                    deductAction(c.id, 'action');
                  }
                }}
                className={`px-2.5 py-1 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border ${
                  c.actionUsed
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 border-rose-400/40 cursor-pointer animate-fade-in'
                }`}
                title={`Rolar ${atk.name} (${atk.damage} de dano)`}
              >
                <Swords className="w-3 h-3 text-slate-950" />
                <span>
                  {atk.name} (+{bonus})
                </span>
              </button>
            );
          })
        ) : c.actions && c.actions.length > 0 ? (
          c.actions.map((act) => {
            const match = act.desc.match(/\+([0-9]+)/);
            const bonus = match ? parseInt(match[1]) : getMod(c.str);
            return (
              <button
                key={act.name}
                disabled={c.actionUsed}
                onClick={() => {
                  if (rollDice(`Ataque: ${act.name}`, bonus, c, act.desc)) {
                    deductAction(c.id, 'action');
                  }
                }}
                className={`px-2.5 py-1 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border ${
                  c.actionUsed
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 border-rose-400/40 cursor-pointer'
                }`}
                title={act.desc}
              >
                <Swords className="w-3 h-3 text-slate-950" />
                <span>
                  {act.name} (+{bonus})
                </span>
              </button>
            );
          })
        ) : (
          <button
            disabled={c.actionUsed}
            onClick={() => {
              if (rollDice(`Ataque: Corpo a Corpo`, getMod(c.str), c, '1d8')) {
                deductAction(c.id, 'action');
              }
            }}
            className={`px-2.5 py-1 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border ${
              c.actionUsed
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 border-rose-400/40 cursor-pointer'
            }`}
          >
            <Swords className="w-3 h-3 text-slate-950" />
            <span>
              Atacar (+{getMod(c.str) >= 0 ? '+' : ''}
              {getMod(c.str)})
            </span>
          </button>
        )}

        {/* Spell Dropdown menu */}
        {matchingSheet && matchingSheet.spells && matchingSheet.spells.length > 0 && (
          <div className="relative inline-block">
            <button
              onClick={() => setOpenSpellDropdownId(openSpellDropdownId === c.id ? null : c.id)}
              className="px-2.5 py-1 bg-gradient-to-r from-sky-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-slate-950 font-black text-[10px] rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border border-sky-400/40"
            >
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>Magias</span>
            </button>

            {openSpellDropdownId === c.id && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-[#0f141d]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-2.5 z-40 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150" onClick={(e) => e.stopPropagation()}>
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
                        <div key={level} className="mb-3 last:mb-0">
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
                                  className={`w-full text-left px-2 py-1.5 rounded-lg border text-[10px] transition-all flex justify-between items-center ${
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

      {/* Expanded Action Panel */}
      {isExpanded && (
        <div
          className="mt-1 pt-2 border-t border-[#2a3449] animate-in slide-in-from-top-2 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Saves & Skills */}
          <div className="mb-2">
            <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Rolagens (Salva-Guardas & Skills)
            </h5>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => rollDice(`${c.name} - Percepção`, getMod(c.wis), c)}
                className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300"
              >
                Percepção ({getMod(c.wis) >= 0 ? '+' : ''}
                {getMod(c.wis)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva STR`, getMod(c.str), c)}
                className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300"
              >
                STR ({getMod(c.str) >= 0 ? '+' : ''}
                {getMod(c.str)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva DEX`, getMod(c.dex), c)}
                className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300"
              >
                DEX ({getMod(c.dex) >= 0 ? '+' : ''}
                {getMod(c.dex)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva CON`, getMod(c.con), c)}
                className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300"
              >
                CON ({getMod(c.con) >= 0 ? '+' : ''}
                {getMod(c.con)})
              </button>
              <button
                onClick={() => rollDice(`${c.name} - Salva WIS`, getMod(c.wis), c)}
                className="px-2 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[9px] font-semibold text-slate-300"
              >
                WIS ({getMod(c.wis) >= 0 ? '+' : ''}
                {getMod(c.wis)})
              </button>
            </div>
          </div>

          {/* Alcance de Visão Config */}
          <div className="mb-2.5 mt-2 flex flex-col gap-2">
            <div>
              <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Alcance de Visão (Fog of War)
              </h5>
              <div className="flex items-center gap-1.5">
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
                  className="w-16 px-1.5 py-0.5 bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 outline-none rounded text-[10px] text-slate-300 font-mono"
                />
                <span className="text-[9px] text-slate-400">pés (padrão: 30 pés / 6 cel)</span>
              </div>
            </div>
            
            <div>
              <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tipo de Visão
              </h5>
              <select
                value={c.visionType || 'normal'}
                onChange={(e) => {
                  const val = e.target.value as any;
                  onUpdateCombatants((prev) =>
                    prev.map((x) => (x.id === c.id ? { ...x, visionType: val } : x))
                  );
                }}
                className="w-full bg-[#0a0d14] text-[10px] font-semibold text-slate-300 border border-[#2a3449] rounded px-1.5 py-1 outline-none focus:border-cyan-500"
              >
                <option value="normal">Visão Normal</option>
                <option value="darkvision">Darkvision (Escala de Cinza)</option>
                <option value="blindsight">Blindsight</option>
                <option value="tremorsense">Tremorsense (Sonar)</option>
                <option value="truesight">Truesight</option>
              </select>
            </div>
          </div>

          {/* Attacks */}
          <div>
            <h5 className="text-[9px] font-bold text-rose-500/70 uppercase tracking-wider mb-1.5">Ações Ofensivas</h5>
            {c.actions && c.actions.length > 0 ? (
              <div className="space-y-1">
                {c.actions.map((act) => (
                  <div key={act.name} className="p-1.5 bg-[#0a0d14] border border-[#2a3449] rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-[10px] text-amber-300">{act.name}</strong>
                      {(() => {
                        const match = act.desc.match(/\+([0-9]+)/);
                        if (match) {
                          const bonus = parseInt(match[1]);
                          return (
                            <button
                              onClick={() => rollDice(`Ataque: ${act.name}`, bonus, c, act.desc)}
                              className="text-[8px] px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold"
                            >
                              Atq +{bonus}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <p className="text-[9px] text-slate-400 leading-snug">{act.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-500 italic">Nenhuma ação listada.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
