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
}) => {
  const [activeTab, setActiveTab] = useState<'attacks' | 'spells' | 'features' | 'saves'>('attacks');
  const [isExpanded, setIsExpanded] = useState<boolean>(!isCombatActive || isMyTurn);

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

  return (
    <div className={`w-full max-w-4xl mx-auto backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
      isCombatActive && !isMyTurn 
        ? 'bg-[#0b0e14]/90 border-slate-700/50 opacity-85' 
        : 'bg-[#0f141d]/95 border-amber-500/30'
    }`}>
      {/* Dock Bar Top Header & Resource Counters */}
      <div className="bg-gradient-to-r from-[#141a26] via-[#1b2333] to-[#121723] p-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#2a3449]">
        {/* Turn Status Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shadow-inner">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                DOCK DE AÇÕES DO JOGADOR
              </h4>
              {isCombatActive && (
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  isMyTurn 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border border-[#2a3449]'
                }`}>
                  {isMyTurn ? '⚡ SEU TURNO!' : 'Aguardando Turno'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">
              Personagem: <strong className="text-cyan-300 font-semibold">{activeSheet.characterName}</strong> (CA {activeSheet.armorClass || 10} • HP {playerCombatant ? playerCombatant.hp : activeSheet.currentHp}/{playerCombatant ? playerCombatant.maxHp : activeSheet.maxHp})
            </p>
          </div>
        </div>

        {/* Action Budget Badges (Standard, Bonus, Reaction, Movement) */}
        {isCombatActive && (
          <div className="flex items-center gap-2">
            {/* Ação Padrão */}
            <button
              onClick={() => onUpdateCombatantActionState?.({ actionUsed: !actionUsed })}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                actionUsed
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 line-through opacity-70'
                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
              }`}
              title="Ação Padrão (Ataque, Magia, Correr, etc). Clique para alternar estado."
            >
              <span className={`w-2 h-2 rounded-full ${actionUsed ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
              <span>Ação Padrão</span>
            </button>

            {/* Ação Bônus */}
            <button
              onClick={() => onUpdateCombatantActionState?.({ bonusActionUsed: !bonusActionUsed })}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                bonusActionUsed
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 line-through opacity-70'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:border-amber-400'
              }`}
              title="Ação Bônus (Magias Bônus, Habilidades de Classe). Clique para alternar estado."
            >
              <span className={`w-2 h-2 rounded-full ${bonusActionUsed ? 'bg-rose-500' : 'bg-amber-400'}`} />
              <span>Ação Bônus</span>
            </button>

            {/* Reação */}
            <button
              onClick={() => onUpdateCombatantActionState?.({ reactionUsed: !reactionUsed })}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                reactionUsed
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/40 line-through opacity-70'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="Reação (Ataque de Oportunidade, Escudo Arcano). Clique para alternar estado."
            >
              <span className={`w-2 h-2 rounded-full ${reactionUsed ? 'bg-rose-500' : 'bg-cyan-400'}`} />
              <span>Reação</span>
            </button>

            {/* Deslocamento */}
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-[#0a0d14] text-slate-300 border border-[#2a3449] flex items-center gap-1.5">
              <Footprints className="w-3 h-3 text-emerald-400" />
              <span>{movementRemaining} / {speedFeet} ft</span>
            </span>
          </div>
        )}

        {/* Toggle Expand / Full Sheet / End Turn */}
        <div className="flex items-center gap-2">
          {isCombatActive && isMyTurn && onEndTurn && (
            <button
              onClick={onEndTurn}
              className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95 animate-pulse cursor-pointer border border-emerald-400/50"
              title="Encerrar seu turno e passar a vez para o próximo combatente"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Encerrar Turno</span>
            </button>
          )}

          <button
            onClick={onOpenFullSheet}
            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all"
          >
            Abrir Ficha
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Action Content Panel */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#2a3449]/60 pb-2">
            <button
              onClick={() => setActiveTab('attacks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                activeTab === 'attacks'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Ataques & Armas ({attacksList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('spells')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                activeTab === 'spells'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Magias ({spellsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                activeTab === 'features'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ações Bônus & Classe</span>
            </button>

            <button
              onClick={() => setActiveTab('saves')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                activeTab === 'saves'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Salvaguardas</span>
            </button>
          </div>

          {/* TAB 1: ATAQUES COM ARMAS */}
          {activeTab === 'attacks' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {attacksList.map((atk, idx) => (
                <div
                  key={atk.id || idx}
                  className="p-3 bg-[#141a26] border border-[#2a3449] hover:border-amber-500/50 rounded-xl transition-all flex flex-col justify-between space-y-2 group shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                        {atk.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 font-mono">Dano: {atk.damage} ({atk.type || 'Físico'})</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                      {atk.atkBonus}
                    </span>
                  </div>

                  <button
                    onClick={() => handleWeaponAttackRoll(atk)}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Atacar com {atk.name}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: MAGIAS & TRUQUES */}
          {activeTab === 'spells' && (
            <div>
              {spellsList.length === 0 ? (
                <div className="text-center py-4 text-slate-500 bg-[#141a26] rounded-xl border border-dashed border-[#2a3449]">
                  <p className="text-xs">Nenhuma magia adicionada à ficha de personagem.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {spellsList.map((spell, idx) => (
                    <div
                      key={spell.id || idx}
                      className="p-3 bg-[#141a26] border border-[#2a3449] hover:border-cyan-500/50 rounded-xl transition-all flex flex-col justify-between space-y-2 group shadow-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {spell.name}
                          </h5>
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {spell.level === 0 ? 'Truque (Nível 0)' : `Nível ${spell.level}`}
                          </span>
                        </div>
                        {spell.isBonus && (
                          <span className="text-[9px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.2 rounded">
                            Bônus
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCastSpell(spell)}
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-slate-950 font-bold text-xs rounded-lg shadow-md shadow-cyan-900/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Conjurar {spell.name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AÇÕES BÔNUS & HABILIDADES */}
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              <div className="p-3 bg-[#141a26] border border-[#2a3449] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-amber-300">Retomar Fôlego</h5>
                  <span className="text-[9px] font-mono bg-amber-950/60 text-amber-400 px-1.5 py-0.5 rounded">1x/Descanso</span>
                </div>
                <p className="text-[10px] text-slate-400">Recupere 1d10 + Nível de PV como Ação Bônus.</p>
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
                  className="w-full py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-all"
                >
                  Usar Retomar Fôlego
                </button>
              </div>

              <div className="p-3 bg-[#141a26] border border-[#2a3449] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-rose-300">Entrar em Fúria</h5>
                  <span className="text-[9px] font-mono bg-rose-950/60 text-rose-400 px-1.5 py-0.5 rounded">Bônus</span>
                </div>
                <p className="text-[10px] text-slate-400">+2 no Dano de Força & Resistência a Dano Físico.</p>
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
                  className="w-full py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-lg transition-all"
                >
                  Ativar Fúria
                </button>
              </div>

              <div className="p-3 bg-[#141a26] border border-[#2a3449] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-emerald-300">Disparar (Dash)</h5>
                  <span className="text-[9px] font-mono bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 rounded">Ação</span>
                </div>
                <p className="text-[10px] text-slate-400">Dobra seu deslocamento no turno (+{speedFeet}ft).</p>
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
                  className="w-full py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg transition-all"
                >
                  Usar Disparada
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SALVAGUARDAS */}
          {activeTab === 'saves' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {[
                { key: 'str', label: 'Força' },
                { key: 'dex', label: 'Destreza' },
                { key: 'con', label: 'Constituição' },
                { key: 'int', label: 'Inteligência' },
                { key: 'wis', label: 'Sabedoria' },
                { key: 'cha', label: 'Carisma' },
              ].map((save) => (
                <button
                  key={save.key}
                  onClick={() => handleSaveRoll(save.key as any, save.label)}
                  className="p-2.5 bg-[#141a26] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/50 rounded-xl transition-all text-center space-y-1 group"
                >
                  <span className="text-[10px] text-slate-400 block font-mono uppercase">{save.label}</span>
                  <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 block">
                    Rolar D20
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
