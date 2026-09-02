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
  CheckCircle2
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
      <div className="bg-gradient-to-r from-[#111722] via-[#161f2e] to-[#101520] p-2.5 flex flex-col gap-2 border-b border-[#232d40]">
        <div className="flex items-center justify-between gap-2">
          {/* Character Identity with Avatar */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div 
              onClick={onOpenFullSheet}
              className="w-9 h-9 rounded-xl overflow-hidden border-2 border-amber-500/60 bg-[#06080e] flex items-center justify-center text-amber-400 font-bold shrink-0 relative cursor-pointer hover:border-amber-400 transition-all shadow-md group"
              title="Clique para abrir a ficha completa do personagem"
            >
              {heroAvatar ? (
                <img 
                  src={heroAvatar} 
                  alt={activeSheet.characterName} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                />
              ) : (
                <Swords className="w-4 h-4 text-amber-400" />
              )}
              {activeSheet.level && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-slate-950 text-[7.5px] font-black px-1 rounded-sm font-mono leading-tight shadow">
                  {activeSheet.level}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 
                  onClick={onOpenFullSheet}
                  className="text-xs font-bold text-slate-100 truncate font-mono cursor-pointer hover:text-amber-300 transition-colors"
                >
                  {activeSheet.characterName || 'Personagem'}
                </h4>
                {isCombatActive && (
                  <span className={`text-[8px] font-mono font-black px-1.5 py-0.2 rounded uppercase shrink-0 ${
                    isMyTurn 
                      ? 'bg-amber-500 text-slate-950 shadow-sm animate-pulse' 
                      : 'bg-slate-800 text-slate-400 border border-[#2a3449]'
                  }`}>
                    {isMyTurn ? 'SEU TURNO' : 'ESPERA'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono truncate">
                <span className="text-amber-400 font-semibold shrink-0">CA {activeSheet.armorClass || 10}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold shrink-0">PV {currentHpVal}/{maxHpVal}</span>
                {activeSheet.className && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400 truncate text-[9px] font-serif">{activeSheet.className}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {isCombatActive && isMyTurn && onEndTurn && (
              <button
                onClick={onEndTurn}
                className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-[10px] rounded-lg shadow-sm flex items-center gap-1 transition-all active:scale-95 animate-pulse cursor-pointer border border-emerald-400/50"
                title="Encerrar seu turno"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Passar</span>
              </button>
            )}

            <button
              onClick={onOpenFullSheet}
              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 text-[10px] font-bold rounded-lg transition-all"
              title="Abrir Ficha Completa do Personagem"
            >
              Ficha
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#232d40] rounded-md transition-colors"
              title={isExpanded ? 'Recolher Painel de Ações' : 'Expandir Painel de Ações'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* HP Bar */}
        <div className="w-full bg-[#080b10] h-1.5 rounded-full overflow-hidden border border-[#232d40]">
          <div 
            className={`h-full transition-all duration-300 ${
              hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Combat Resource Budget Badges */}
        {isCombatActive && (
          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#232d40]/60">
            <button
              onClick={() => onUpdateCombatantActionState?.({ actionUsed: !actionUsed })}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition-all ${
                actionUsed
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 line-through opacity-70'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
              }`}
              title="Ação Padrão"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${actionUsed ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
              <span>Ação</span>
            </button>

            <button
              onClick={() => onUpdateCombatantActionState?.({ bonusActionUsed: !bonusActionUsed })}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition-all ${
                bonusActionUsed
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 line-through opacity-70'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}
              title="Ação Bônus"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${bonusActionUsed ? 'bg-rose-500' : 'bg-amber-400'}`} />
              <span>Bônus</span>
            </button>

            <button
              onClick={() => onUpdateCombatantActionState?.({ reactionUsed: !reactionUsed })}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 border transition-all ${
                reactionUsed
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 line-through opacity-70'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              }`}
              title="Reação"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${reactionUsed ? 'bg-rose-500' : 'bg-cyan-400'}`} />
              <span>Reação</span>
            </button>

            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#0a0d14] text-slate-300 border border-[#2a3449] flex items-center gap-1">
              <Footprints className="w-2.5 h-2.5 text-emerald-400" />
              <span>{movementRemaining}/{speedFeet}ft</span>
            </span>
          </div>
        )}
      </div>

      {/* Action Content Panel */}
      {isExpanded && (
        <div className="p-2 space-y-2 flex flex-col">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#090d14] rounded-lg border border-[#232d40]">
            <button
              onClick={() => setActiveTab('attacks')}
              className={`py-1 text-[10px] font-bold font-mono rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'attacks'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ataques & Armas"
            >
              <Swords className="w-3 h-3" />
              <span className="truncate">Armas ({attacksList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('spells')}
              className={`py-1 text-[10px] font-bold font-mono rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'spells'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Magias e Truques"
            >
              <Wand2 className="w-3 h-3" />
              <span className="truncate">Magias ({spellsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`py-1 text-[10px] font-bold font-mono rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'features'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ações Bônus e Habilidades"
            >
              <Zap className="w-3 h-3" />
              <span className="truncate">Habil.</span>
            </button>

            <button
              onClick={() => setActiveTab('saves')}
              className={`py-1 text-[10px] font-bold font-mono rounded transition-all flex flex-col items-center justify-center gap-0.5 ${
                activeTab === 'saves'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Salvaguardas de Atributo"
            >
              <ShieldAlert className="w-3 h-3" />
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
