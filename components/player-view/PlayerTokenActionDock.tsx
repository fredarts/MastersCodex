'use client';

import React, { useState } from 'react';
import { 
  Swords, 
  Sparkles, 
  Shield, 
  Footprints, 
  Zap, 
  Dices, 
  Activity, 
  Heart, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  Flame, 
  Wand2, 
  ShieldAlert,
  Crosshair,
  RotateCcw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { CharacterSheet, Combatant, DiceRollEvent } from '@/lib/types';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { toast } from 'sonner';
const calculateModifier = (score: number) => Math.floor(((score || 10) - 10) / 2);

interface PlayerTokenActionDockProps {
  activeSheet: CharacterSheet;
  playerCombatant?: Combatant;
  isMyTurn: boolean;
  isCombatActive: boolean;
  onExecuteRoll: (rollEvent: Partial<DiceRollEvent>) => void;
  onUpdateCombatantActionState?: (update: {
    actionUsed?: boolean;
    bonusActionUsed?: boolean;
    reactionUsed?: boolean;
    movementUsed?: number;
  }) => void;
  onOpenFullSheet: () => void;
  onStartAttackTargeting?: (attack: any) => void;
  onEndTurn?: () => void;
  layout?: 'sidebar' | 'dock';
}

export const PlayerTokenActionDock: React.FC<PlayerTokenActionDockProps> = ({
  activeSheet,
  playerCombatant,
  isMyTurn,
  isCombatActive,
  onExecuteRoll,
  onUpdateCombatantActionState,
  onOpenFullSheet,
  onStartAttackTargeting,
  onEndTurn,
  layout = 'sidebar',
}) => {
  const [activeTab, setActiveTab] = useState<'attacks' | 'spells' | 'features' | 'saves'>('attacks');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Auto-colapsa quando encerra o turno e auto-expande quando inicia a vez do jogador no combate
  React.useEffect(() => {
    if (isCombatActive) {
      setIsExpanded(isMyTurn);
    }
  }, [isMyTurn, isCombatActive]);

  // Status de recursos da rodada
  const actionUsed = playerCombatant?.actionUsed ?? false;
  const bonusActionUsed = playerCombatant?.bonusActionUsed ?? false;
  const reactionUsed = playerCombatant?.reactionUsed ?? false;

  const speedFeet = parseInt(activeSheet.speed || '30') || 30;
  const movementUsed = playerCombatant?.movementUsed ?? 0;
  const movementRemaining = Math.max(0, speedFeet - movementUsed);

  // Disparar rolagem de ataque com arma
  const handleWeaponAttackRoll = (attack: { name: string; atkBonus: string; damage: string; type: string; rangeText?: string }) => {
    if (isCombatActive && !isMyTurn) {
      toast.warning('Aguarde a sua vez no combate para realizar ataques!');
      return;
    }

    if (onStartAttackTargeting) {
      onStartAttackTargeting(attack);
      return;
    }

    const cleanBonus = parseInt(attack.atkBonus.replace(/[^0-9-]/g, '')) || 0;
    const d20 = Math.floor(Math.random() * 20) + 1;
    const totalAtk = d20 + cleanBonus;

    onExecuteRoll({
      characterName: activeSheet.characterName,
      avatarUrl: activeSheet.avatarUrl,
      rollType: 'attack',
      label: `Ataque: ${attack.name}`,
      d20Roll1: d20,
      modifier: cleanBonus,
      total: totalAtk,
      isCrit: d20 === 20,
      isFail: d20 === 1,
      damageDice: attack.damage,
      damageType: attack.type,
    });

    if (isCombatActive && isMyTurn && onUpdateCombatantActionState && !actionUsed) {
      onUpdateCombatantActionState({ actionUsed: true });
    }
  };

  // Disparar conjuração de magia
  const handleCastSpell = (spell: { name: string; level: number; description?: string; range?: string; damage?: string }) => {
    if (isCombatActive && !isMyTurn) {
      toast.warning('Aguarde a sua vez no combate para conjurar magias!');
      return;
    }

    if (onStartAttackTargeting && (spell.damage || /raio|fogo|gelo|flecha|ataque|bolt|ray/i.test(spell.name))) {
      onStartAttackTargeting({
        name: spell.name,
        atkBonus: '+5',
        damage: spell.damage || '1d10',
        type: 'Mágico',
        rangeText: spell.range || '120 ft',
      });
      return;
    }

    const isCantrip = spell.level === 0;
    
    onExecuteRoll({
      characterName: activeSheet.characterName,
      avatarUrl: activeSheet.avatarUrl,
      rollType: 'custom',
      label: isCantrip ? `Truque: ${spell.name}` : `Conjurou Magia (Nv. ${spell.level}): ${spell.name}`,
      modifier: 0,
      total: 0,
    });

    if (isCombatActive && isMyTurn && onUpdateCombatantActionState) {
      if (spell.level > 0 && !actionUsed) {
        onUpdateCombatantActionState({ actionUsed: true });
      }
    }
  };

  // Disparar salvaguarda de atributo com Modal de Dados 3D
  const handleSaveRoll = (attrKey: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', attrLabel: string) => {
    const attrScore = activeSheet.attributes?.[attrKey]?.score || 10;
    const mod = calculateModifier(attrScore);
    const isProficient = activeSheet.savingThrows?.[attrKey] || false;
    const profBonus = Math.floor(((activeSheet.level || 1) - 1) / 4) + 2;
    const totalMod = mod + (isProficient ? profBonus : 0);

    const setBg3DiceOverlay = useLiveCockpitStudioStore.getState().setBg3DiceOverlay;
    const setDiceResult = useLiveCockpitStudioStore.getState().setDiceResult;

    setBg3DiceOverlay({
      title: `Salvaguarda: ${attrLabel}`,
      subtitle: `TESTE DE RESISTÊNCIA DE ${attrLabel.toUpperCase()}`,
      actorName: activeSheet.characterName || 'Jogador',
      modifier: totalMod,
      difficultyClass: 12,
      modifierCards: [
        {
          id: `mod-attr-${attrKey}`,
          label: `Modificador de ${attrLabel}`,
          value: mod >= 0 ? `+${mod}` : `${mod}`,
          numericValue: mod,
          iconType: 'attribute',
          isEnabled: true,
        },
        ...(isProficient
          ? [
              {
                id: `mod-prof-${attrKey}`,
                label: 'Bônus de Proficiência',
                value: `+${profBonus}`,
                numericValue: profBonus,
                iconType: 'proficiency' as const,
                isEnabled: true,
              },
            ]
          : []),
      ],
      isRolling: false,
      phase: 'd20',
      onRollComplete: (finalTotal: number, isHit: boolean, roll: number) => {
        const isCrit = roll === 20;
        const isFail = roll === 1;

        setDiceResult({
          title: `Salvaguarda de ${attrLabel}`,
          roll,
          total: finalTotal,
          isCrit,
          isFail,
        });

        onExecuteRoll({
          characterName: activeSheet.characterName,
          avatarUrl: activeSheet.avatarUrl,
          rollType: 'saving_throw',
          label: `Salvaguarda de ${attrLabel}`,
          d20Roll1: roll,
          modifier: totalMod,
          total: finalTotal,
          isCrit,
          isFail,
        });
      },
    });
  };

  // Extrair armas e ataques rápidos
  const attacksList = activeSheet.attacks && activeSheet.attacks.length > 0 
    ? activeSheet.attacks 
    : [
        { id: 'unarmed', name: 'Ataque Desarmado', atkBonus: '+2', damage: '1d4', type: 'Concussão' }
      ];

  // Extrair magias
  const spellsList = activeSheet.spells || [];

  const currentHpVal = playerCombatant ? playerCombatant.hp : activeSheet.currentHp;
  const maxHpVal = playerCombatant ? playerCombatant.maxHp : activeSheet.maxHp;
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHpVal / (maxHpVal || 1)) * 100)));

  const heroAvatar = activeSheet.avatarUrl || activeSheet.faceImageUrl || activeSheet.modelUrl;

  return (
    <div className={`w-full bg-[#0c1017] text-slate-100 flex flex-col transition-all duration-200 ${
      layout === 'sidebar' 
        ? 'border-b border-[#2a3449]' 
        : 'max-w-4xl mx-auto backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden'
    }`}>
      {/* Top Header */}
      <div className="bg-gradient-to-b from-[#161f30] via-[#101724] to-[#0a0e17] p-3 flex flex-col gap-2.5 border-b border-[#232d40] shadow-md">
        <div className="flex items-center justify-between gap-3">
          {/* Character Identity with Enlarged Avatar */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 64x64 Avatar (~2x) with glowing RPG border */}
            <div 
              onClick={onOpenFullSheet}
              className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-500/70 bg-[#06080e] flex items-center justify-center text-amber-400 font-bold shrink-0 relative cursor-pointer hover:border-amber-400 hover:shadow-[0_0_16px_rgba(245,158,11,0.35)] transition-all shadow-lg group ring-1 ring-amber-500/30"
              title="Clique para abrir a ficha completa do personagem"
            >
              {heroAvatar ? (
                <img 
                  src={heroAvatar} 
                  alt={activeSheet.characterName} 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <Swords className="w-7 h-7 text-amber-400/80" />
              )}
              {/* Level Crest Badge */}
              <span className="absolute bottom-0 right-0 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 text-[9.5px] font-black px-1.5 py-0.5 rounded-tl-lg font-mono leading-tight shadow-md border-t border-l border-amber-300/50 flex items-center gap-0.5">
                <span className="text-[7.5px] opacity-75">NV</span>{activeSheet.level || 1}
              </span>
            </div>

            {/* Character Info Details */}
            <div className="min-w-0 flex-1 flex flex-col justify-center gap-0.5">
              {/* Line 1: Character Name & Turn status badge */}
              <div className="flex items-center gap-2 min-w-0">
                <h4 
                  onClick={onOpenFullSheet}
                  className="text-sm sm:text-base font-black text-slate-100 truncate font-serif tracking-wide cursor-pointer hover:text-amber-300 transition-colors drop-shadow-sm"
                  title={activeSheet.characterName || 'Personagem'}
                >
                  {activeSheet.characterName || 'Personagem'}
                </h4>
                {isCombatActive && (
                  <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded uppercase shrink-0 shadow-sm ${
                    isMyTurn 
                      ? 'bg-amber-500 text-slate-950 animate-pulse ring-1 ring-amber-400' 
                      : 'bg-slate-800 text-slate-400 border border-[#2a3449]'
                  }`}>
                    {isMyTurn ? 'SEU TURNO' : 'ESPERA'}
                  </span>
                )}
              </div>

              {/* Line 2: Class Name and Subclass / Race below Character Name */}
              <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium truncate">
                <span className="truncate font-semibold tracking-wide">
                  {activeSheet.className || 'Aventureiro'}
                  {activeSheet.subclass ? ` (${activeSheet.subclass})` : ''}
                </span>
                {activeSheet.race && (
                  <>
                    <span className="text-slate-600 text-[10px]">•</span>
                    <span className="text-slate-400 text-[11px] truncate font-sans">{activeSheet.race}</span>
                  </>
                )}
              </div>

              {/* Line 3: Prominent Combat Stat Chips (CA, PV) */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {/* CA Chip */}
                <div 
                  className="flex items-center gap-1 bg-[#0d131f] border border-amber-500/40 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-amber-300 shadow-sm"
                  title="Classe de Armadura (CA)"
                >
                  <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>CA {activeSheet.armorClass || 10}</span>
                </div>

                {/* PV Chip */}
                <div 
                  className="flex items-center gap-1 bg-[#0d131f] border border-emerald-500/40 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-emerald-300 shadow-sm"
                  title="Pontos de Vida (PV)"
                >
                  <Heart className="w-3 h-3 text-emerald-400 fill-emerald-400/20 shrink-0" />
                  <span>PV {currentHpVal}/{maxHpVal}</span>
                  {activeSheet.tempHp ? (
                    <span className="text-cyan-300 text-[10px] font-normal" title="PV Temporário">+{activeSheet.tempHp}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (Right Column) */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
            {isCombatActive && isMyTurn && onEndTurn && (
              <button
                onClick={onEndTurn}
                className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 animate-pulse cursor-pointer border border-emerald-400/50"
                title="Encerrar seu turno"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passar</span>
              </button>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={onOpenFullSheet}
                className="px-2.5 py-1.5 bg-gradient-to-b from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 hover:border-amber-400 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.25)] active:scale-95 cursor-pointer"
                title="Abrir Ficha Completa do Personagem"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Ficha</span>
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#232d40] rounded-xl transition-colors border border-transparent hover:border-[#2a3449]"
                title={isExpanded ? 'Recolher Painel de Ações' : 'Expandir Painel de Ações'}
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced HP Bar */}
        <div className="w-full bg-[#080b10] h-2.5 rounded-full overflow-hidden border border-[#232d40] shadow-inner relative">
          <div 
            className={`h-full transition-all duration-300 shadow-sm ${
              hpPercent > 50 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : hpPercent > 20 
                ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                : 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Combat Resource Budget Badges - Tablet Friendly Touch Targets */}
        {isCombatActive && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#232d40]/60 select-none">
            <button
              onClick={() => onUpdateCombatantActionState?.({ actionUsed: !actionUsed })}
              className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                actionUsed
                  ? 'bg-rose-950/40 text-rose-400 border-rose-500/30 line-through opacity-60'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm hover:bg-emerald-900/50'
              }`}
              title="Alternar status da Ação Padrão"
            >
              <span className={`w-2 h-2 rounded-full ${actionUsed ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
              <span>Ação</span>
            </button>

            <button
              onClick={() => onUpdateCombatantActionState?.({ bonusActionUsed: !bonusActionUsed })}
              className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                bonusActionUsed
                  ? 'bg-rose-950/40 text-rose-400 border-rose-500/30 line-through opacity-60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm hover:bg-amber-900/50'
              }`}
              title="Alternar status da Ação Bônus"
            >
              <span className={`w-2 h-2 rounded-full ${bonusActionUsed ? 'bg-rose-500' : 'bg-amber-400'}`} />
              <span>Bônus</span>
            </button>

            <button
              onClick={() => onUpdateCombatantActionState?.({ reactionUsed: !reactionUsed })}
              className={`h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                reactionUsed
                  ? 'bg-rose-950/40 text-rose-400 border-rose-500/30 line-through opacity-60'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-sm hover:bg-cyan-900/50'
              }`}
              title="Alternar status da Reação"
            >
              <span className={`w-2 h-2 rounded-full ${reactionUsed ? 'bg-rose-500' : 'bg-cyan-400'}`} />
              <span>Reação</span>
            </button>

            <span className="h-7 sm:h-8 px-2.5 rounded-lg text-[11px] font-mono font-bold bg-[#0a0d14] text-slate-300 border border-[#2a3449] flex items-center gap-1.5 ml-auto">
              <Footprints className="w-3 h-3 text-emerald-400" />
              <span>{movementRemaining}/{speedFeet}ft</span>
            </span>
          </div>
        )}
      </div>

      {/* Action Content Panel */}
      {isExpanded && (
        <div className="p-2 space-y-2 flex flex-col">
          {/* Navigation Tabs (Ergonomic Touch 38px) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#090d14] rounded-xl border border-[#232d40]">
            <button
              onClick={() => setActiveTab('attacks')}
              className={`py-1.5 text-[11px] font-bold font-mono rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'attacks'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b29]'
              }`}
              title="Ataques & Armas"
            >
              <Swords className="w-3.5 h-3.5" />
              <span className="truncate">Armas ({attacksList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('spells')}
              className={`py-1.5 text-[11px] font-bold font-mono rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'spells'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b29]'
              }`}
              title="Magias e Truques"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span className="truncate">Magias ({spellsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`py-1.5 text-[11px] font-bold font-mono rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'features'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b29]'
              }`}
              title="Ações Bônus e Habilidades"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="truncate">Habil.</span>
            </button>

            <button
              onClick={() => setActiveTab('saves')}
              className={`py-1.5 text-[11px] font-bold font-mono rounded-lg transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                activeTab === 'saves'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141b29]'
              }`}
              title="Salvaguardas de Atributo"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="truncate">Saves</span>
            </button>
          </div>

          {/* TAB CONTENT (Scrollable list) */}
          <div className="max-h-56 overflow-y-auto pr-0.5 space-y-1.5 custom-scrollbar">
            {/* TAB 1: ATAQUES COM ARMAS */}
            {activeTab === 'attacks' && (
              <div className="space-y-1.5">
                {attacksList.map((atk, idx) => (
                  <div
                    key={atk.id || idx}
                    className="p-2 bg-[#121824] border border-[#232d40] hover:border-amber-500/40 rounded-xl transition-all flex items-center justify-between gap-2 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-[11px] font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                          {atk.name}
                        </h5>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1 rounded shrink-0">
                          {atk.atkBonus}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono block truncate">
                        {atk.damage} ({atk.type || 'Físico'})
                      </span>
                    </div>

                    <button
                      onClick={() => handleWeaponAttackRoll(atk)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[10px] rounded-lg shadow transition-all active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <Dices className="w-3 h-3" />
                      <span>Atacar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: MAGIAS & TRUQUES */}
            {activeTab === 'spells' && (
              <div className="space-y-1.5">
                {spellsList.length === 0 ? (
                  <div className="text-center py-3 text-slate-500 bg-[#121824] rounded-xl border border-dashed border-[#232d40]">
                    <p className="text-[10px]">Nenhuma magia adicionada à ficha.</p>
                  </div>
                ) : (
                  spellsList.map((spell, idx) => (
                    <div
                      key={spell.id || idx}
                      className="p-2 bg-[#121824] border border-[#232d40] hover:border-cyan-500/40 rounded-xl transition-all flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[11px] font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                          {spell.name}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-mono">
                          <span>{spell.level === 0 ? 'Truque' : `Nv. ${spell.level}`}</span>
                          {spell.isBonus && (
                            <span className="text-amber-300 bg-amber-950/60 px-1 rounded border border-amber-500/30">
                              Bônus
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCastSpell(spell)}
                        className="px-2.5 py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-bold text-[10px] rounded-lg shadow transition-all active:scale-95 flex items-center gap-1 shrink-0"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Conjurar</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: AÇÕES BÔNUS & HABILIDADES */}
            {activeTab === 'features' && (
              <div className="space-y-1.5">
                <div className="p-2 bg-[#121824] border border-[#232d40] rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h5 className="text-[11px] font-bold text-amber-300 truncate">Retomar Fôlego</h5>
                      <span className="text-[8px] font-mono bg-amber-950/60 text-amber-400 px-1 rounded">1x</span>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">1d10 + Nv PV</p>
                  </div>
                  <button
                    onClick={() => {
                      const heal = Math.floor(Math.random() * 10) + 1 + activeSheet.level;
                      onExecuteRoll({
                        characterName: activeSheet.characterName,
                        rollType: 'custom',
                        label: `Retomar Fôlego (Recuperou +${heal} HP)`,
                        total: heal
                      });
                      if (onUpdateCombatantActionState) onUpdateCombatantActionState({ bonusActionUsed: true });
                    }}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded-lg transition-all shrink-0"
                  >
                    Usar
                  </button>
                </div>

                <div className="p-2 bg-[#121824] border border-[#232d40] rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h5 className="text-[11px] font-bold text-rose-300 truncate">Entrar em Fúria</h5>
                      <span className="text-[8px] font-mono bg-rose-950/60 text-rose-400 px-1 rounded">Bônus</span>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">+2 Dano & Resistência</p>
                  </div>
                  <button
                    onClick={() => {
                      onExecuteRoll({
                        characterName: activeSheet.characterName,
                        rollType: 'custom',
                        label: '🔥 Ativou FÚRIA do Bárbaro!',
                        total: 0
                      });
                      if (onUpdateCombatantActionState) onUpdateCombatantActionState({ bonusActionUsed: true });
                    }}
                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold rounded-lg transition-all shrink-0"
                  >
                    Ativar
                  </button>
                </div>

                <div className="p-2 bg-[#121824] border border-[#232d40] rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h5 className="text-[11px] font-bold text-emerald-300 truncate">Disparada (Dash)</h5>
                      <span className="text-[8px] font-mono bg-emerald-950/60 text-emerald-400 px-1 rounded">Ação</span>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">+{speedFeet}ft movimento</p>
                  </div>
                  <button
                    onClick={() => {
                      onExecuteRoll({
                        characterName: activeSheet.characterName,
                        rollType: 'custom',
                        label: `🏃 Usou DISPARADA (Movimento total: ${speedFeet * 2}ft)`,
                        total: speedFeet * 2
                      });
                      if (onUpdateCombatantActionState) onUpdateCombatantActionState({ actionUsed: true });
                    }}
                    className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-lg transition-all shrink-0"
                  >
                    Disparar
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: SALVAGUARDAS */}
            {activeTab === 'saves' && (
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'str', label: 'FOR' },
                  { key: 'dex', label: 'DES' },
                  { key: 'con', label: 'CON' },
                  { key: 'int', label: 'INT' },
                  { key: 'wis', label: 'SAB' },
                  { key: 'cha', label: 'CAR' },
                ].map((save) => (
                  <button
                    key={save.key}
                    onClick={() => handleSaveRoll(save.key as any, save.label)}
                    className="p-1.5 bg-[#121824] hover:bg-[#1a2334] border border-[#232d40] hover:border-amber-500/50 rounded-lg transition-all text-center group"
                  >
                    <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">{save.label}</span>
                    <span className="text-[10px] font-bold text-amber-300 group-hover:text-amber-200 block">
                      D20
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
