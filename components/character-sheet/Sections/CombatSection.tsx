/* eslint-disable react-hooks/purity */
import React, { useState } from 'react';
import { AdvantageMode, AttributeKey, CharacterSheet, CharacterWeaponAttack, DiceRollEvent } from '@/lib/types';
import { formatModifier, getAttributeModifier, getEffectiveAttributeScore, recalculateSheetDerivedStats, ARMOR_TABLE, calculateArmorClass, hasClass, getJackOfAllTradesBonus, getClassLevel, WEAPON_TABLE } from '@/lib/dnd5e-calculator';
import { executeCheckRoll, executeWeaponAttackRoll, broadcastDiceRoll, executeSneakAttackRoll, getSneakAttackDice } from '@/lib/dnd5e-dice';
import { Shield, Heart, Zap, Crosshair, Plus, Minus, Trash2, Skull, Dices, Lock, Unlock, RotateCcw, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { WeaponCompendiumModal } from '../Modals/WeaponCompendiumModal';

interface CombatSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
  advantageMode?: AdvantageMode;
  onRoll?: (event: DiceRollEvent) => void;
}

const ATTRIBUTE_LABELS: Record<AttributeKey, { title: string; desc: string }> = {
  str: { title: 'Força', desc: 'Atletas, Corpo a Corpo' },
  dex: { title: 'Destreza', desc: 'Agilidade, Esquiva, Furtividade' },
  con: { title: 'Constituição', desc: 'Vitalidade, Vigor, Concentração' },
  int: { title: 'Inteligência', desc: 'Conhecimento, Magia Arcana' },
  wis: { title: 'Sabedoria', desc: 'Percepção, Intuição, Magia Divina' },
  cha: { title: 'Carisma', desc: 'Liderança, Persuasão, Presença' },
};

export interface Roll4d6Result {
  attrKey: AttributeKey;
  title: string;
  dice: number[];
  droppedIndex: number;
  total: number;
}

export const CombatSection: React.FC<CombatSectionProps> = ({
  sheet,
  onChange,
  advantageMode = 'normal',
  onRoll,
}) => {
  const [showWeaponCompendium, setShowWeaponCompendium] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [show4d6Modal, setShow4d6Modal] = useState(false);
  const [rolled4d6Set, setRolled4d6Set] = useState<Record<AttributeKey, Roll4d6Result> | null>(null);
  const [pendingSmiteAtk, setPendingSmiteAtk] = useState<CharacterWeaponAttack | null>(null);
  const [pendingAttackRoll, setPendingAttackRoll] = useState<DiceRollEvent | null>(null);
  const [showSmitePrompt, setShowSmitePrompt] = useState(false);
  const [sneakAttackCrit, setSneakAttackCrit] = useState(false);
  const [powerAttackActive, setPowerAttackActive] = useState(false);

  // Estado da sessão baseline para possibilitar o botão de Resetar
  const [sessionBaseline, setSessionBaseline] = useState<{
    attributes: Record<AttributeKey, number>;
    pointsAvailable: number;
  } | null>(null);

  const isLocked = sheet.attributesLocked ?? (sheet.attributePointsAvailable !== undefined ? sheet.attributePointsAvailable === 0 : true);
  const pointsAvailable = sheet.attributePointsAvailable ?? 0;

  // Garante que capturamos o snapshot inicial para resetar se arrepender
  const ensureSessionBaseline = () => {
    if (!sessionBaseline) {
      const scores: Record<AttributeKey, number> = {
        str: sheet.attributes.str.score,
        dex: sheet.attributes.dex.score,
        con: sheet.attributes.con.score,
        int: sheet.attributes.int.score,
        wis: sheet.attributes.wis.score,
        cha: sheet.attributes.cha.score,
      };
      setSessionBaseline({
        attributes: scores,
        pointsAvailable,
      });
    }
  };

  // Função para gerar rolagem de 4d6 descartando o menor
  const roll4d6AttributeSet = (): Record<AttributeKey, Roll4d6Result> => {
    const keys: AttributeKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const res: Record<string, Roll4d6Result> = {};

    keys.forEach((key) => {
      const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
      let lowestIdx = 0;
      for (let i = 1; i < 4; i++) {
        if (dice[i] < dice[lowestIdx]) {
          lowestIdx = i;
        }
      }
      const sum = dice.reduce((acc, d, idx) => (idx === lowestIdx ? acc : acc + d), 0);
      res[key] = {
        attrKey: key,
        title: ATTRIBUTE_LABELS[key].title,
        dice,
        droppedIndex: lowestIdx,
        total: sum,
      };
    });

    return res as Record<AttributeKey, Roll4d6Result>;
  };

  const handleOpen4d6Modal = () => {
    setRolled4d6Set(roll4d6AttributeSet());
    setShow4d6Modal(true);
  };

  const handleReroll4d6All = () => {
    setRolled4d6Set(roll4d6AttributeSet());
  };

  const handleApply4d6Results = () => {
    if (!rolled4d6Set) return;
    ensureSessionBaseline();

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: 0,
      attributesLocked: true,
      attributes: {
        str: { ...sheet.attributes.str, score: rolled4d6Set.str.total },
        dex: { ...sheet.attributes.dex, score: rolled4d6Set.dex.total },
        con: { ...sheet.attributes.con, score: rolled4d6Set.con.total },
        int: { ...sheet.attributes.int, score: rolled4d6Set.int.total },
        wis: { ...sheet.attributes.wis, score: rolled4d6Set.wis.total },
        cha: { ...sheet.attributes.cha, score: rolled4d6Set.cha.total },
      },
    };

    onChange(recalculateSheetDerivedStats(updatedSheet));
    setShow4d6Modal(false);
    setSessionBaseline(null);
  };

  const handleStartPointBuy27 = () => {
    ensureSessionBaseline();
    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: 27,
      attributesLocked: false,
      attributes: {
        str: { ...sheet.attributes.str, score: 8 },
        dex: { ...sheet.attributes.dex, score: 8 },
        con: { ...sheet.attributes.con, score: 8 },
        int: { ...sheet.attributes.int, score: 8 },
        wis: { ...sheet.attributes.wis, score: 8 },
        cha: { ...sheet.attributes.cha, score: 8 },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleIncrementAttribute = (attrKey: AttributeKey) => {
    if (pointsAvailable <= 0) return;
    ensureSessionBaseline();

    const currentScore = sheet.attributes[attrKey].score;
    const currentBase = sheet.attributes[attrKey].baseScore ?? currentScore;
    if (currentBase >= 15) return;

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: pointsAvailable - 1,
      attributesLocked: false,
      attributes: {
        ...sheet.attributes,
        [attrKey]: { ...sheet.attributes[attrKey], score: currentScore + 1, baseScore: (sheet.attributes[attrKey].baseScore ?? currentScore) + 1 },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleDecrementAttribute = (attrKey: AttributeKey) => {
    const currentScore = sheet.attributes[attrKey].score;
    const baselineScore = sessionBaseline?.attributes[attrKey] ?? currentScore;

    // Só permite decrementar se for maior que o baseline da sessão ou se tiver pontos
    if (currentScore <= Math.min(baselineScore, 1)) return;

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: pointsAvailable + 1,
      attributesLocked: false,
      attributes: {
        ...sheet.attributes,
        [attrKey]: { ...sheet.attributes[attrKey], score: currentScore - 1, baseScore: (sheet.attributes[attrKey].baseScore ?? currentScore) - 1 },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleScoreDirectChange = (attrKey: AttributeKey, newScore: number) => {
    ensureSessionBaseline();
    const currentScore = sheet.attributes[attrKey].score;
    const currentBase = sheet.attributes[attrKey].baseScore ?? currentScore;
    const bonus = currentScore - currentBase;
    
    // Calculates new base, capped at 15 max invested
    let newBase = newScore - bonus;
    if (newBase > 15) newBase = 15;
    if (newBase < 1) newBase = 1;
    
    const safeScore = newBase + bonus;

    const updatedSheet = {
      ...sheet,
      attributes: {
        ...sheet.attributes,
        [attrKey]: { ...sheet.attributes[attrKey], score: safeScore, baseScore: newBase },
      },
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
  };

  const handleAvailablePointsChange = (newPoints: number) => {
    ensureSessionBaseline();
    const safePoints = Math.max(0, newPoints);
    onChange({
      ...sheet,
      attributePointsAvailable: safePoints,
      attributesLocked: safePoints === 0 ? isLocked : false,
    });
  };

  const handleGrantGmPoints = (amount: number) => {
    ensureSessionBaseline();
    onChange({
      ...sheet,
      attributePointsAvailable: (pointsAvailable || 0) + amount,
      attributesLocked: false,
    });
  };

  const handleResetDistribution = () => {
    if (!sessionBaseline) return;
    const resetAttributes = { ...sheet.attributes };
    (Object.keys(sessionBaseline.attributes) as AttributeKey[]).forEach((key) => {
      resetAttributes[key] = {
        ...resetAttributes[key],
        score: sessionBaseline.attributes[key],
      };
    });

    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributePointsAvailable: sessionBaseline.pointsAvailable,
      attributesLocked: false,
      attributes: resetAttributes,
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
    setSessionBaseline(null);
  };

  const handleConfirmCompletion = () => {
    const updatedSheet: CharacterSheet = {
      ...sheet,
      attributesLocked: true,
      attributePointsAvailable: Math.max(0, pointsAvailable),
    };
    onChange(recalculateSheetDerivedStats(updatedSheet));
    setSessionBaseline(null);
    setShowConfirmModal(false);
  };

  const handleUnlockByGm = () => {
    ensureSessionBaseline();
    onChange({
      ...sheet,
      attributesLocked: false,
    });
  };

  const handleRollAttribute = (attrKey: AttributeKey) => {
    const mod = getAttributeModifier(sheet, attrKey);
    const label = `Teste de ${ATTRIBUTE_LABELS[attrKey].title}`;
    const result = executeCheckRoll({
      sheet,
      label,
      modifier: mod,
      rollType: 'attribute',
      advantageMode,
    });
    if (onRoll) onRoll(result);
  };

  const rollWeaponDamage = (atk: CharacterWeaponAttack, isCrit: boolean): DiceRollEvent => {
    let damageStr = atk.damage;
    const isMelee = !atk.name.toLowerCase().includes('arco') && 
                    !atk.name.toLowerCase().includes('besta') && 
                    !atk.name.toLowerCase().includes('dardo') &&
                    !(atk.type || '').toLowerCase().includes('distância');

    const isRageActive = sheet.activeClassBuffs?.some(b => b.type === 'rage');
    let rageBonus = 0;
    if (isRageActive && isMelee) {
      if (sheet.level >= 16) rageBonus = 4;
      else if (sheet.level >= 9) rageBonus = 3;
      else rageBonus = 2;
    }

    let damageTotal = 0;
    let numDice = 1;
    let diceFaces = 6;
    let sign = 1;
    let bonus = 0;

    try {
      const match = damageStr.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
      if (match) {
        numDice = parseInt(match[1], 10) || 1;
        diceFaces = parseInt(match[2], 10) || 6;
        sign = match[3] === '-' ? -1 : 1;
        bonus = parseInt(match[4] || '0', 10);

        // Se for crítico, dobra o número de dados + Crítico Brutal do Bárbaro
        let barbarianExtraDice = 0;
        if (isCrit && hasClass(sheet, 'Bárbaro')) {
          const barbLvl = getClassLevel(sheet, 'Bárbaro');
          if (barbLvl >= 17) barbarianExtraDice = 3;
          else if (barbLvl >= 13) barbarianExtraDice = 2;
          else if (barbLvl >= 9) barbarianExtraDice = 1;
        }

        const finalNumDice = isCrit ? numDice * 2 + barbarianExtraDice : numDice;

        // Combate com Armas Grandes (GWF)
        const hasGWF = !!(
          sheet.otherFeatures?.toLowerCase().includes('armas grandes') ||
          sheet.featuresAndTraits?.toLowerCase().includes('armas grandes') ||
          sheet.otherFeatures?.toLowerCase().includes('great weapon') ||
          sheet.featuresAndTraits?.toLowerCase().includes('great weapon')
        );
        const weapon = WEAPON_TABLE[atk.name];
        const isTwoHandedOrVersatile = weapon?.properties?.some(p => 
          p.toLowerCase().includes('duas mãos') || 
          p.toLowerCase().includes('two-handed') || 
          p.toLowerCase().includes('versátil') || 
          p.toLowerCase().includes('versatile')
        );
        const shouldApplyGWF = hasGWF && (!weapon || !weapon.isRanged) && isTwoHandedOrVersatile;

        let diceSum = 0;
        for (let i = 0; i < finalNumDice; i++) {
          let roll = Math.floor(Math.random() * diceFaces) + 1;
          if (shouldApplyGWF && (roll === 1 || roll === 2)) {
            roll = Math.floor(Math.random() * diceFaces) + 1;
          }
          diceSum += roll;
        }
        
        // Adiciona bônus de dano + bônus de Fúria
        damageTotal = diceSum + (sign * bonus) + rageBonus;
        
        // Atualiza a fórmula exibida no log
        const totalBonus = (sign * bonus) + rageBonus;
        damageStr = `${finalNumDice}d${diceFaces}${totalBonus >= 0 ? ' +' : ' '}${totalBonus}`;
      } else {
        damageTotal = (parseInt(damageStr, 10) || 1) + rageBonus;
      }
    } catch (e) {
      damageTotal = 1 + rageBonus;
    }

    const label = isRageActive && isMelee ? `Dano (${atk.name}) + Fúria` : `Dano (${atk.name})`;

    const damageRoll: DiceRollEvent = {
      id: (Date.now() + 1).toString(),
      characterId: sheet.id,
      characterName: sheet.characterName || 'Personagem',
      avatarUrl: sheet.avatarUrl,
      rollType: 'damage',
      label,
      modifier: 0,
      total: Math.max(1, damageTotal),
      damageDice: damageStr,
      damageType: atk.type || 'Físico',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    broadcastDiceRoll(damageRoll);
    return damageRoll;
  };

  const handleResolveSmite = (lvl: number | null) => {
    if (!pendingSmiteAtk || !pendingAttackRoll) return;

    if (lvl !== null) {
      // 1. Deduz o slot de magia
      const slot = sheet.spellSlots[lvl];
      const updatedSlots = { ...sheet.spellSlots };
      updatedSlots[lvl] = {
        ...slot,
        used: slot.used + 1,
      };

      // 2. Rola o dano do Smite
      let diceCount = 1 + lvl;
      if (pendingAttackRoll.isCrit) diceCount *= 2; // Dobra os dados no crítico!
      
      let smiteDmgTotal = 0;
      for (let i = 0; i < diceCount; i++) {
        smiteDmgTotal += Math.floor(Math.random() * 8) + 1;
      }

      const smiteDmgRoll: DiceRollEvent = {
        id: (Date.now() + 2).toString(),
        characterId: sheet.id,
        characterName: sheet.characterName,
        avatarUrl: sheet.avatarUrl,
        rollType: 'damage',
        label: `Destruição Divina (${lvl}º Nível)`,
        modifier: 0,
        total: smiteDmgTotal,
        damageDice: `${diceCount}d8`,
        damageType: 'Radiante',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      // 3. Rola o dano da arma normal
      const normalDmgRoll = rollWeaponDamage(pendingSmiteAtk, !!pendingAttackRoll.isCrit);

      // Broadcast e dispara
      broadcastDiceRoll(smiteDmgRoll);

      if (onRoll) {
        onRoll(normalDmgRoll);
        setTimeout(() => onRoll(smiteDmgRoll), 500);
      }

      // Atualiza a ficha
      onChange({
        ...sheet,
        spellSlots: updatedSlots,
      });
    } else {
      // Apenas rola o dano normal
      const normalDmgRoll = rollWeaponDamage(pendingSmiteAtk, !!pendingAttackRoll.isCrit);
      if (onRoll) {
        onRoll(normalDmgRoll);
      }
    }

    // Limpa estado
    setPendingSmiteAtk(null);
    setPendingAttackRoll(null);
    setShowSmitePrompt(false);
  };

  const handleRollWeapon = (atk: CharacterWeaponAttack) => {
    // Se "Power Attack" estiver ativo, aplica -5 no acerto e +10 no dano
    let atkBonus = atk.atkBonus;
    let damage = atk.damage;
    if (powerAttackActive) {
      const baseAtk = parseInt(atkBonus.replace('+', ''), 10) || 0;
      const newAtk = baseAtk - 5;
      atkBonus = newAtk >= 0 ? `+${newAtk}` : `${newAtk}`;

      // Adiciona +10 no dano
      if (damage.includes('+')) {
        const parts = damage.split('+');
        const baseDmg = parts[0].trim();
        const baseBonus = parseInt(parts[1].trim(), 10) || 0;
        damage = `${baseDmg} + ${baseBonus + 10}`;
      } else if (damage.includes('-')) {
        const parts = damage.split('-');
        const baseDmg = parts[0].trim();
        const baseBonus = parseInt(parts[1].trim(), 10) || 0;
        damage = `${baseDmg} + ${10 - baseBonus}`;
      } else {
        damage = `${damage} + 10`;
      }
    }

    const finalAtk = powerAttackActive ? { ...atk, atkBonus, damage } : atk;

    // 1. Rola o ataque normalmente
    const atkModifier = parseInt(finalAtk.atkBonus.replace('+', ''), 10) || 0;
    const attackRoll = executeCheckRoll({
      sheet,
      label: `Ataque: ${finalAtk.name}${powerAttackActive ? ' (Ataque Poderoso)' : ''}`,
      modifier: atkModifier,
      rollType: 'attack',
      advantageMode,
    });

    if (onRoll) {
      onRoll(attackRoll);
    }

    // 2. Verifica se tem Smite preparado na aba de habilidades
    const smiteBuff = sheet.activeClassBuffs?.find(b => b.type === 'smite');
    const isMelee = !finalAtk.name.toLowerCase().includes('arco') && 
                    !finalAtk.name.toLowerCase().includes('besta') && 
                    !finalAtk.name.toLowerCase().includes('dardo') &&
                    !(finalAtk.type || '').toLowerCase().includes('distância');

    if (smiteBuff && isMelee) {
      const updatedBuffs = (sheet.activeClassBuffs || []).filter(b => b.id !== smiteBuff.id);
      
      const slotLvl = smiteBuff.spellSlotLevelUsed || 1;
      let diceCount = 1 + slotLvl;
      if (attackRoll.isCrit) diceCount *= 2; // Crítico dobra os dados!
      
      let smiteDmgTotal = 0;
      for (let i = 0; i < diceCount; i++) {
        smiteDmgTotal += Math.floor(Math.random() * 8) + 1;
      }

      const normalDmgRoll = rollWeaponDamage(finalAtk, !!attackRoll.isCrit);
      
      const smiteDmgRoll: DiceRollEvent = {
        id: (Date.now() + 2).toString(),
        characterId: sheet.id,
        characterName: sheet.characterName,
        avatarUrl: sheet.avatarUrl,
        rollType: 'damage',
        label: `Destruição Divina (${slotLvl}º Nível)`,
        modifier: 0,
        total: smiteDmgTotal,
        damageDice: `${diceCount}d8`,
        damageType: 'Radiante',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      broadcastDiceRoll(smiteDmgRoll);
      
      if (onRoll) {
        setTimeout(() => onRoll(normalDmgRoll), 500);
        setTimeout(() => onRoll(smiteDmgRoll), 1000);
      }

      onChange({
        ...sheet,
        activeClassBuffs: updatedBuffs,
      });
      return;
    }

    // 3. Caso contrário, se for Paladino e tiver slots de magia e for melee, mostra o prompt interativo (Opção B)
    const hasAvailableSpellSlots = Object.values(sheet.spellSlots || {}).some(
      (slot) => slot.total > 0 && slot.used < slot.total
    );

    if (hasClass(sheet, 'Paladino') && hasAvailableSpellSlots && isMelee) {
      setPendingSmiteAtk(finalAtk);
      setPendingAttackRoll(attackRoll);
      setShowSmitePrompt(true);
    } else {
      // Rola dano normal
      const damageRoll = rollWeaponDamage(finalAtk, !!attackRoll.isCrit);
      if (onRoll) {
        setTimeout(() => onRoll(damageRoll), 500);
      }
    }
  };

  const handleHpChange = (newHp: number) => {
    const damageTaken = sheet.currentHp - newHp;
    const isConcentrating = (sheet.conditions || []).includes('Concentração');

    if (damageTaken > 0 && isConcentrating) {
      const cd = Math.max(10, Math.floor(damageTaken / 2));
      const confirmRoll = window.confirm(
        `Você sofreu ${damageTaken} de dano enquanto concentrado! Deseja realizar a Salvaguarda de Constituição CD ${cd} para manter a concentração?`
      );
      if (confirmRoll) {
        const conMod = getAttributeModifier(sheet, 'con');
        const saveRoll = executeCheckRoll({
          sheet,
          label: `Salvaguarda de Concentração (CD ${cd})`,
          modifier: conMod,
          rollType: 'saving_throw',
        });
        if (onRoll) {
          onRoll(saveRoll);
        }
        
        if (saveRoll.total < cd) {
          const updatedConds = (sheet.conditions || []).filter(c => c !== 'Concentração');
          onChange({ ...sheet, currentHp: newHp, conditions: updatedConds });
          alert("Concentração quebrada! A condição foi removida da sua ficha.");
          return;
        }
      } else {
        const updatedConds = (sheet.conditions || []).filter(c => c !== 'Concentração');
        onChange({ ...sheet, currentHp: newHp, conditions: updatedConds });
        return;
      }
    }

    onChange({ ...sheet, currentHp: newHp });
  };

  const handleAddAttack = () => {
    setShowWeaponCompendium(true);
  };

  const handleAddWeaponFromCompendium = (attack: CharacterWeaponAttack) => {
    onChange(recalculateSheetDerivedStats({ ...sheet, attacks: [...sheet.attacks, attack] }));
  };

  const handleRemoveAttack = (id: string) => {
    onChange({ ...sheet, attacks: sheet.attacks.filter((a) => a.id !== id) });
  };

  const handleUpdateAttack = (id: string, updated: Partial<CharacterWeaponAttack>) => {
    onChange({
      ...sheet,
      attacks: sheet.attacks.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    });
  };

  const dexMod = getAttributeModifier(sheet, 'dex');
  const hasChangesToReset = sessionBaseline !== null;

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-in select-none lg:grid lg:grid-cols-3 lg:gap-4 lg:h-full lg:overflow-hidden">
      
      {/* COLUNA 1: ATRIBUTOS PRINCIPAIS */}
      <div className="space-y-4 lg:overflow-y-auto lg:h-full lg:pr-2 bg3-scrollbar lg:pb-6">
        <div className="bg3-panel rounded-2xl p-4 space-y-3">
          {/* HEADER DE ATRIBUTOS COM PONTOS DISPONÍVEIS E BOTÕES DE AÇÃO */}
          <div className="flex flex-col justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-serif">Atributos Principais</h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {isLocked ? (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3 text-amber-500" />
                  Atributos Travados
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  <Unlock className="w-3 h-3 text-emerald-400" />
                  Distribuição Ativa
                </span>
              )}
            </div>

            {/* BARRA DE AÇÕES: CONTADOR DE PONTOS, 4d6, RESET E CONCLUIR */}
            <div className="flex flex-col gap-2 w-full">
              {/* BOTÃO ROLAR 4d6 (DESCARTAR MENOR) */}
              <button
                type="button"
                onClick={handleOpen4d6Modal}
                className="w-full text-[10px] font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Simular rolagem de 4d6 descartando o menor dado para os 6 atributos"
              >
                <Dices className="w-3.5 h-3.5 text-cyan-400" />
                Rolar 4d6 (Descartar Menor)
              </button>

              {/* BOTÃO INICIAR POINT BUY 27 PTS (Se estiver travado ou sem pontos) */}
              {(isLocked || pointsAvailable === 0) && (
                <button
                  type="button"
                  onClick={handleStartPointBuy27}
                  className="w-full text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer font-serif"
                  title="Iniciar distribuição com 27 pontos base D&D 5e"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  Point Buy (27 Pts)
                </button>
              )}

              {/* TEXT BOX DE PONTOS DISPONÍVEIS */}
              {!isLocked && (
                <div className="flex items-center justify-between bg-[#0b0f19] border border-amber-500/30 rounded-xl px-2.5 py-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Pontos para Investir:</span>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={pointsAvailable}
                    onChange={(e) => handleAvailablePointsChange(parseInt(e.target.value, 10) || 0)}
                    className="w-10 bg-slate-900 border border-slate-700 rounded-lg text-center font-black text-xs text-amber-400 focus:outline-none focus:border-amber-500"
                    title="Pontos livres para investir nos atributos"
                  />
                </div>
              )}

              {/* BOTÃO CONCEDER PONTOS (MESTRE / ASI) */}
              <button
                type="button"
                onClick={() => handleGrantGmPoints(2)}
                className="w-full text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Adicionar +2 Pontos de Atributo (Evolução de Nível ou Concessão do Mestre)"
              >
                <Plus className="w-3 h-3" />
                Conceder +2 Pts (Mestre)
              </button>

              <div className="grid grid-cols-2 gap-2 w-full">
                {/* BOTÃO RESETAR (Só ativo durante a distribuição e se tiver alterações) */}
                {!isLocked && (
                  <button
                    type="button"
                    onClick={handleResetDistribution}
                    disabled={!hasChangesToReset}
                    className={`text-[10px] font-bold py-1.5 rounded-xl border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      hasChangesToReset
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                        : 'bg-slate-900 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                    title="Desfaz todas as alterações feitas nesta sessão de pontos"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resetar
                  </button>
                )}

                {/* BOTÃO CONCLUIR / CONFIRMAR E TRAVAR */}
                {!isLocked ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-1.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleUnlockByGm}
                    className="col-span-2 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Desbloquear atributos para edição do Mestre"
                  >
                    <Unlock className="w-3 h-3 text-amber-400" />
                    Editar Atributos (Mestre)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GRID DOS 6 ATRIBUTOS */}
          <div className="grid grid-cols-2 gap-2.5">
            {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((attrKey) => {
              const info = ATTRIBUTE_LABELS[attrKey];
              const score = sheet.attributes[attrKey].score;
              const mod = getAttributeModifier(sheet, attrKey);
              const baseScore = sheet.attributes[attrKey].baseScore ?? score;
              const canDecrease = !isLocked && score > Math.min(sessionBaseline?.attributes[attrKey] ?? score, 1);
              const canIncrease = !isLocked && pointsAvailable > 0 && baseScore < 15;

              return (
                <div
                  key={attrKey}
                  className={`bg-[#0b0f19] border rounded-xl p-2.5 flex flex-col items-center justify-between text-center shadow-inner relative transition-all ${
                    !isLocked && pointsAvailable > 0
                      ? 'border-amber-500/50 hover:border-amber-400 shadow-amber-500/5'
                      : 'border-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-extrabold uppercase text-slate-300 font-serif">{info.title}</span>
                  <span className="text-[9px] text-slate-500 line-clamp-1">{info.desc}</span>

                  {/* MODIFICADOR EM DESTAQUE (CLICÁVEL PARA ROLAGEM D20) */}
                  <button
                    type="button"
                    onClick={() => handleRollAttribute(attrKey)}
                    className="my-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60 rounded-xl px-2.5 py-0.5 w-full flex items-center justify-center gap-1 group active:scale-95 transition-all shadow-sm cursor-pointer"
                    title="Clique para rolar o teste d20"
                  >
                    <Dices className="w-3 h-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span className="text-xl font-black text-amber-400 font-mono tracking-tight">
                      {formatModifier(mod)}
                    </span>
                  </button>

                  {/* PAINEL DE CONTROLE DE VALOR BRUTO DO ATRIBUTO */}
                  {isLocked ? (
                    /* ATRIBUTO TRAVADO */
                    <div className="flex items-center justify-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-0.5 w-full">
                      <span className="text-[9px] text-slate-400 font-semibold">Valor:</span>
                      <span className="text-[11px] font-black text-white font-mono">{getEffectiveAttributeScore(sheet, attrKey)}</span>
                    </div>
                  ) : (
                    /* CONTROLES + / - DURANTE A DISTRIBUIÇÃO */
                    <div className="flex items-center justify-between w-full bg-slate-900 border border-amber-500/30 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleDecrementAttribute(attrKey)}
                        disabled={!canDecrease}
                        className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 font-bold text-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        title="Diminuir ponto"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={score}
                        onChange={(e) => handleScoreDirectChange(attrKey, parseInt(e.target.value, 10) || 10)}
                        className="w-8 text-center bg-transparent font-black text-xs text-white focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleIncrementAttribute(attrKey)}
                        disabled={!canIncrease}
                        className="w-6 h-6 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 font-bold text-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                        title="Adicionar ponto"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* COLUNA 2: COMBATE & VITAIS */}
      <div className="space-y-4 lg:overflow-y-auto lg:h-full lg:pr-2 bg3-scrollbar lg:pb-6">
        
        {/* CARDS DE COMBATE RÁPIDOS */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* CA (CLASSE DE ARMADURA DINÂMICA) */}
          <div className="bg3-panel rounded-2xl p-3 flex flex-col items-center justify-between text-center space-y-1">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase font-serif">CA Total</span>
            </div>
            <span className="text-2xl font-black text-amber-300 font-mono my-0.5 text-gold-glow">
              {sheet.armorClass}
            </span>
            <div className="w-full space-y-1 bg-[#0b0f19]/60 border border-slate-800 rounded-xl p-1.5 flex flex-col items-center gap-1 font-serif">
              <span className="text-[9px] font-bold text-slate-300 truncate max-w-full">
                🛡️ {sheet.equippedArmor || 'Nenhuma'}
              </span>
              <span className="text-[8px] text-slate-500 font-sans">
                {sheet.hasShield ? '🛡️ Com Escudo (+2 CA)' : '❌ Sem Escudo'}
              </span>
            </div>
          </div>

          {/* INICIATIVA */}
          <div className="bg3-panel rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <Zap className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase font-serif">Iniciativa</span>
            <button
              type="button"
              onClick={() => {
                const res = executeCheckRoll({
                  sheet,
                  label: 'Rolagem de Iniciativa',
                  modifier: dexMod + sheet.initiativeBonus + getJackOfAllTradesBonus(sheet),
                  rollType: 'attribute',
                  advantageMode,
                });
                if (onRoll) onRoll(res);
              }}
              className="text-xl font-black text-amber-300 mt-1 font-mono hover:text-amber-200 cursor-pointer flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20"
            >
              <Dices className="w-3 h-3" />
              {formatModifier(dexMod + sheet.initiativeBonus + getJackOfAllTradesBonus(sheet))}
            </button>
            <span className="text-[8px] text-slate-500 mt-1">(DES {formatModifier(dexMod)}{getJackOfAllTradesBonus(sheet) > 0 ? ` + ${getJackOfAllTradesBonus(sheet)}` : ''})</span>
          </div>

          {/* DESLOCAMENTO */}
          <div className="bg3-panel rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <Crosshair className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase font-serif">Deslocamento</span>
            <input
              type="text"
              value={sheet.speed}
              onChange={(e) => onChange({ ...sheet, speed: e.target.value })}
              className="w-full text-center bg-[#0b0f19] border border-slate-700 rounded-xl py-0.5 mt-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* DADOS DE VIDA */}
          <div className="bg3-panel rounded-2xl p-3 flex flex-col items-center justify-center text-center">
            <Heart className="w-5 h-5 text-rose-400 mb-1" />
            <span className="text-[10px] font-bold text-slate-400 uppercase font-serif">Dados de Vida</span>
            <span className="text-sm font-black text-rose-300 mt-1 font-mono">{sheet.hitDiceTotal}</span>
            <span className="text-[9px] text-slate-500">Usados: {sheet.hitDiceUsed}</span>
          </div>
        </div>

        {/* PV & VITALIDADE */}
        <div className="bg3-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2 font-serif">
              <Heart className="w-4 h-4 text-rose-400" />
              Pontos de Vida (PV)
            </h3>
            <span className="text-xs font-extrabold text-slate-300">
              {sheet.currentHp} / {sheet.maxHp} HP
            </span>
          </div>

          {/* BARRA DE PROGRESSO DE HP */}
          <div className="w-full bg-[#0b0f19] h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                sheet.currentHp <= sheet.maxHp * 0.25
                  ? 'bg-rose-600 animate-pulse'
                  : sheet.currentHp <= sheet.maxHp * 0.5
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, (sheet.currentHp / (sheet.maxHp || 1)) * 100))}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase">PV Atual</label>
              <input
                type="number"
                value={sheet.currentHp}
                onChange={(e) => handleHpChange(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#0b0f19] border border-rose-500/30 rounded-xl py-1 px-2 text-center text-xs font-bold text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase">PV Máximo</label>
              <input
                type="number"
                value={sheet.maxHp}
                onChange={(e) => onChange({ ...sheet, maxHp: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-1 px-2 text-center text-xs font-bold text-slate-300 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400 uppercase">PV Temporário</label>
              <input
                type="number"
                value={sheet.tempHp}
                onChange={(e) => onChange({ ...sheet, tempHp: parseInt(e.target.value, 10) || 0 })}
                className="w-full bg-[#0b0f19] border border-amber-500/30 rounded-xl py-1 px-2 text-center text-xs font-bold text-amber-300 focus:outline-none"
              />
            </div>
          </div>

          {/* TESTES CONTRA A MORTE (DEATH SAVES) */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
            <span className="text-[10px] font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-serif text-rose-400">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                Testes Contra a Morte
              </span>
              <button
                type="button"
                onClick={() => {
                  const res = executeCheckRoll({
                    sheet,
                    label: 'Teste Contra a Morte (Death Save)',
                    modifier: 0,
                    rollType: 'saving_throw',
                    advantageMode,
                  });
                  if (onRoll) onRoll(res);

                  if ((res.selectedD20 ?? 10) >= 10) {
                    onChange({
                      ...sheet,
                      deathSaves: {
                        ...sheet.deathSaves,
                        successes: Math.min(3, sheet.deathSaves.successes + (res.isCrit ? 2 : 1)),
                      },
                    });
                  } else {
                    onChange({
                      ...sheet,
                      deathSaves: {
                        ...sheet.deathSaves,
                        failures: Math.min(3, sheet.deathSaves.failures + (res.isFail ? 2 : 1)),
                      },
                    });
                  }
                }}
                className="flex items-center gap-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-lg text-[9px] font-extrabold cursor-pointer transition-colors"
              >
                <Dices className="w-3 h-3" />
                Rolar Morte
              </button>
            </span>

            <div className="grid grid-cols-2 gap-3">
              {/* SUCESSOS */}
              <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-emerald-400 font-semibold">Sucessos:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...sheet,
                          deathSaves: {
                            ...sheet.deathSaves,
                            successes: sheet.deathSaves.successes === num ? num - 1 : num,
                          },
                        })
                      }
                      className={`w-4 h-4 rounded-full border transition-all ${
                        sheet.deathSaves.successes >= num
                          ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* FRACASSOS */}
              <div className="flex items-center justify-between bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-[9px] text-rose-400 font-semibold">Fracassos:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...sheet,
                          deathSaves: {
                            ...sheet.deathSaves,
                            failures: sheet.deathSaves.failures === num ? num - 1 : num,
                          },
                        })
                      }
                      className={`w-4 h-4 rounded-full border transition-all ${
                        sheet.deathSaves.failures >= num
                          ? 'bg-rose-600 border-rose-500 shadow-sm shadow-rose-600/50'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONDIÇÕES ATIVAS */}
        <div className="bg3-panel rounded-2xl p-4 space-y-2">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block font-serif">
            Condições Ativas na Ficha
          </span>
          <div className="flex flex-wrap gap-1">
            {(['Cego', 'Encantado', 'Surdo', 'Atemorizado', 'Agarrado', 'Incapacitado', 'Invisível', 'Paralisado', 'Petrificado', 'Envenenado', 'Caído', 'Restrito', 'Inconsciente', 'Concentração'] as const).map(cond => {
              const isActive = (sheet.conditions || []).includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => {
                    const currentConds = sheet.conditions || [];
                    const updated = currentConds.includes(cond)
                      ? currentConds.filter(c => c !== cond)
                      : [...currentConds, cond];
                    onChange({ ...sheet, conditions: updated });
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  {cond}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* COLUNA 3: ATAQUES & AÇÕES */}
      <div className="space-y-4 lg:overflow-y-auto lg:h-full lg:pr-2 bg3-scrollbar lg:pb-6">
        
        {/* LISTA DE ATAQUES */}
        <div className="bg3-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-serif">
              <Crosshair className="w-4 h-4 text-amber-400" />
              Ataques & Ações
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddAttack}
                className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Adicionar
              </button>
            </div>
          </div>

          {sheet.feats?.some(f => 
            ['Great Weapon Master', 'Sharpshooter', 'Mestre de Armas Grandes', 'Atirador de Elite'].includes(f.name) ||
            ['Great Weapon Master', 'Sharpshooter', 'Mestre de Armas Grandes', 'Atirador de Elite'].includes(f.namePt)
          ) && (
            <label className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-amber-400 cursor-pointer bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-xl w-full">
              <input
                type="checkbox"
                checked={powerAttackActive}
                onChange={(e) => setPowerAttackActive(e.target.checked)}
                className="rounded border-amber-500/40 bg-slate-900 text-amber-500 focus:ring-amber-500"
              />
              Ataque Poderoso (-5 Acerto / +10 Dano) ⚔️
            </label>
          )}

          <div className="space-y-2 lg:max-h-[380px] lg:overflow-y-auto pr-1 bg3-scrollbar">
            {sheet.attacks.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center py-4 font-serif">Nenhuma arma cadastrada.</p>
            ) : (
              sheet.attacks.map((atk) => (
                <div
                  key={atk.id}
                  className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={atk.name}
                      onChange={(e) => handleUpdateAttack(atk.id, { name: e.target.value })}
                      placeholder="Nome da Arma"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white font-bold font-serif"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttack(atk.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col flex-1">
                      <span className="text-[8px] text-slate-500 uppercase">Acerto</span>
                      <input
                        type="text"
                        value={atk.atkBonus}
                        onChange={(e) => handleUpdateAttack(atk.id, { atkBonus: e.target.value })}
                        placeholder="Bônus (+4)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-0.5 text-xs text-amber-400 font-mono text-center font-bold"
                      />
                    </div>
                    
                    <div className="flex flex-col flex-[1.5_1.5_0%]">
                      <span className="text-[8px] text-slate-500 uppercase">Dano / Tipo</span>
                      <input
                        type="text"
                        value={atk.damage}
                        onChange={(e) => handleUpdateAttack(atk.id, { damage: e.target.value })}
                        placeholder="Dano (1d8+2)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-0.5 text-xs text-rose-300 font-mono text-center"
                      />
                    </div>

                    {/* BOTÃO ROLAR ATAQUE + DANO */}
                    <button
                      type="button"
                      onClick={() => handleRollWeapon(atk)}
                      className="flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-2 rounded-lg text-xs font-black transition-transform active:scale-95 shadow-sm shrink-0 cursor-pointer h-[28px] mt-3"
                      title="Rolar Ataque e Dano no Chat"
                    >
                      <Dices className="w-3.5 h-3.5" />
                      Rolar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ATAQUE FURTIVO — Ladinos */}
        {getClassLevel(sheet, 'Ladino') >= 1 && (
          <div className="bg3-panel rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-serif">
                    Ataque Furtivo
                  </h3>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Dano extra: <span className="text-emerald-300 font-bold">{getSneakAttackDice(getClassLevel(sheet, 'Ladino'))}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[9px] font-bold text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sneakAttackCrit}
                    onChange={(e) => setSneakAttackCrit(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  Crit 🎯
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const result = executeSneakAttackRoll({ sheet, isCrit: sneakAttackCrit });
                    if (onRoll) onRoll(result);
                    setSneakAttackCrit(false);
                  }}
                  className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-xl text-[10px] font-black transition-transform active:scale-95 shadow-md cursor-pointer"
                >
                  Rolar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MODALS E PROMPTS GERAIS FORA DO LAYOUT GRID
          ========================================== */}

      {/* MODAL DE CONFIRMAÇÃO DE CONCLUSÃO DE DISTRIBUIÇÃO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#0f0e0d] border border-amber-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-amber-400 font-serif">Confirmar Distribuição</h3>
                <p className="text-[10px] text-slate-400">Travar alterações e concluir investimento</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0f19] border border-slate-800 rounded-xl p-3 font-serif">
              Tem certeza que deseja concluir a distribuição? Os atributos serão <strong className="text-amber-400">travados</strong> e o botão de Resetar deixará de ficar ativo até a próxima evolução de nível (4, 8, 12, 16, 19) ou concessão do Mestre.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                className="px-4 py-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar & Travar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIMULADOR 4d6 (DESCARTAR MENOR DADO) */}
      {show4d6Modal && rolled4d6Set && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-[#0f0e0d] border border-cyan-500/40 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black uppercase text-cyan-400 font-serif">Rolagem de Atributos 4d6</h3>
                  <p className="text-[10px] text-slate-400 font-serif">Rola 4d6 para cada atributo e descarta o menor dado</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Soma Total:</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {Object.values(rolled4d6Set).reduce((sum, item) => sum + item.total, 0)} pts
                </span>
              </div>
            </div>

            {/* GRID DE DADOS 4d6 PARA CADA ATRIBUTO */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(rolled4d6Set) as AttributeKey[]).map((attrKey) => {
                const item = rolled4d6Set[attrKey];
                const mod = Math.floor((item.total - 10) / 2);

                return (
                  <div key={attrKey} className="bg-[#141b2d] border border-slate-800 rounded-xl p-2.5 text-center space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-cyan-400 font-serif">{item.title}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400">{formatModifier(mod)}</span>
                    </div>

                    {/* DADOS INDIVIDUALMENTE ROLADOS */}
                    <div className="flex items-center justify-center gap-1 my-1">
                      {item.dice.map((val, idx) => {
                        const isDropped = idx === item.droppedIndex;
                        return (
                          <span
                            key={idx}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border ${
                              isDropped
                                ? 'bg-slate-900 text-slate-500 border-slate-800 line-through opacity-40'
                                : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80'
                            }`}
                          >
                            {val}
                          </span>
                        );
                      })}
                    </div>

                    {/* TOTAL */}
                    <div className="bg-[#0b0f19] rounded p-1 text-[10px]">
                      Total: <strong className="text-white text-xs font-mono">{item.total}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-850">
              <button
                type="button"
                onClick={handleReroll4d6All}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin-once" />
                Rolar Novamente
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShow4d6Modal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={handleApply4d6Results}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Aplicar à Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT INTERATIVO PARA DESTRUIÇÃO DIVINA (SMITE) */}
      {showSmitePrompt && pendingAttackRoll && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-[#0f0e0d] border border-amber-500/40 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 font-serif">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Destruição Divina (Divine Smite)
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-[#141b2d] border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Resultado do Ataque</span>
                <div className="text-2xl font-mono font-black text-amber-400 my-0.5 text-gold-glow">
                  {pendingAttackRoll.total}
                </div>
                <span className="text-[10px] text-slate-500">
                  d20: {pendingAttackRoll.selectedD20} {pendingAttackRoll.modifier >= 0 ? `+${pendingAttackRoll.modifier}` : pendingAttackRoll.modifier}
                  {pendingAttackRoll.isCrit ? ' (CRÍTICO! 🎯)' : ''}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 text-center leading-relaxed font-serif">
                Você acertou o ataque? Se sim, você pode gastar um espaço de magia para causar dano radiante extra.
              </p>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block font-serif">Espaços Disponíveis:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const slot = sheet.spellSlots[lvl];
                    const hasSlot = slot && slot.total > 0;
                    const available = slot ? slot.total - slot.used : 0;

                    if (!hasSlot || available <= 0) return null;

                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => handleResolveSmite(lvl)}
                        className="p-2 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500 text-amber-300 rounded-xl text-[10px] font-black text-left flex flex-col items-center justify-center cursor-pointer transition-all"
                      >
                        <span className="font-mono">{lvl}º Nível (+{lvl + 1}d8)</span>
                        <span className="text-[8px] text-amber-400/70">{available} disponíveis</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleResolveSmite(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold text-center cursor-pointer transition-colors"
              >
                Apenas Dano Normal
              </button>
            </div>
          </div>
        </div>
      )}

      <WeaponCompendiumModal
        isOpen={showWeaponCompendium}
        onClose={() => setShowWeaponCompendium(false)}
        sheet={sheet}
        onAddWeapon={handleAddWeaponFromCompendium}
      />
    </div>
  );
};
