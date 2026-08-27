/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdvantageMode, CharacterSheet, DiceRollEvent, RollVisibility, SecretRollNotificationMode, Bg3RollModifierCard } from './types';
import { getClassLevel, WEAPON_TABLE, isHeavilyEncumbered } from './dnd5e-calculator';
import { useLiveCockpitStudioStore } from './stores/useLiveCockpitStudioStore';

// Global broadcaster registry — allows pure TS modules to send events through Supabase Realtime
let _globalBroadcaster: ((event: string, payload: any) => void) | null = null;

export function setGlobalBroadcaster(fn: (event: string, payload: any) => void) {
  _globalBroadcaster = fn;
}

export function getGlobalBroadcaster() {
  return _globalBroadcaster;
}

/**
 * Rola um dado d20 considerando o modo de Vantagem / Desvantagem
 */
export function rollD20(advantageMode: AdvantageMode = 'normal'): {
  d20Roll1: number;
  d20Roll2?: number;
  selectedD20: number;
} {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  if (advantageMode === 'normal') {
    return { d20Roll1: roll1, selectedD20: roll1 };
  }

  const roll2 = Math.floor(Math.random() * 20) + 1;
  const selected = advantageMode === 'advantage' ? Math.max(roll1, roll2) : Math.min(roll1, roll2);

  return {
    d20Roll1: roll1,
    d20Roll2: roll2,
    selectedD20: selected,
  };
}

/**
 * Transmite um evento de rolagem para o chat/realtime.
 * Sanitiza e aplica as regras de segredo/visibilidade configuradas pelo DM.
 */
export function broadcastDiceRoll(
  event: DiceRollEvent,
  secretMode: SecretRollNotificationMode = 'subtle_notice'
) {
  if (typeof window === 'undefined') return;

  const isSecret = event.isSecret || event.visibility === 'gm' || event.visibility === 'blind';

  const payload = {
    rollerName: event.characterName,
    rollType: event.label,
    diceFormula:
      event.advantageMode && event.advantageMode !== 'normal'
        ? `2d20kh1 (${event.advantageMode === 'advantage' ? 'Vantagem' : 'Desvantagem'}) ${event.modifier >= 0 ? '+' : ''}${event.modifier}`
        : `1d20 ${event.modifier >= 0 ? '+' : ''}${event.modifier}`,
    result: event.total,
    isCrit: event.isCrit,
    isFail: event.isFail,
    visibility: event.visibility || 'public',
    isSecret,
    secretMode,
    details: event,
  };

  // 1. Try global broadcaster (Supabase Realtime)
  if (_globalBroadcaster) {
    _globalBroadcaster('DICE_ROLL', payload);
    return;
  }

  // 2. Fallback: BroadcastChannel only
  try {
    const bc = new BroadcastChannel('masters_codex_sync');
    bc.postMessage({ type: 'DICE_ROLL', ...payload });
    bc.close();
  } catch (e) {
    // Ignore iframe errors
  }
}

/**
 * Constrói o conjunto de cartas de modificadores no estilo Baldur's Gate 3
 */
export function buildBg3ModifierCards(
  sheet: CharacterSheet,
  label: string,
  baseModifier: number,
  rollType: DiceRollEvent['rollType']
): Bg3RollModifierCard[] {
  const cards: Bg3RollModifierCard[] = [];

  // Card 1: Modificador de Atributo/Perícia Base
  cards.push({
    id: 'mod-base',
    label: label || 'Modificador Base',
    value: baseModifier >= 0 ? `+${baseModifier}` : `${baseModifier}`,
    numericValue: baseModifier,
    iconType: 'attribute',
    isEnabled: true,
  });

  // Card 2: Bônus de Magias/Habilidades ativas da Ficha (ex: Guidance, Inspiração, Fúria)
  if (sheet.activeClassBuffs) {
    sheet.activeClassBuffs.forEach((buff) => {
      cards.push({
        id: `buff-${buff.id}`,
        label: buff.name,
        value: buff.damageBonus || (buff.attackBonus ? `+${buff.attackBonus}` : '+1d4'),
        numericValue: buff.attackBonus || 2,
        iconType: 'spell',
        sourceName: buff.description || 'Efeito Ativo',
        isOptional: true,
        isEnabled: true,
      });
    });
  }

  return cards;
}

/**
 * Rola um Teste de Atributo ou Salvaguarda ou Perícia
 */
export function executeCheckRoll({
  sheet,
  label,
  modifier,
  rollType,
  advantageMode = 'normal',
  visibility = 'public',
  isSecret = false,
  secretMode = 'subtle_notice',
  difficultyClass,
  contextNarrative,
  reliableTalent = false,
}: {
  sheet: CharacterSheet;
  label: string;
  modifier: number;
  rollType: DiceRollEvent['rollType'];
  advantageMode?: AdvantageMode;
  visibility?: RollVisibility;
  isSecret?: boolean;
  secretMode?: SecretRollNotificationMode;
  difficultyClass?: number;
  contextNarrative?: string;
  reliableTalent?: boolean;
}): DiceRollEvent {
  let finalAdvantage = advantageMode;
  let forceAdvantage = false;
  let forceDisadvantage = false;

  // 1. Bloqueio por Condições incapacitantes
  const incapacitatingCond = (sheet.conditions || []).find(c => 
    ['Incapacitado', 'Paralisado', 'Petrificado', 'Inconsciente'].includes(c)
  );
  if (incapacitatingCond) {
    throw new Error(`Impedido! O personagem está sob a condição ${incapacitatingCond} e não pode realizar jogadas.`);
  }

  // 2. Condições de Desvantagem (Envenenado, Atemorizado)
  const isDisadvantagedCond = (sheet.conditions || []).some(c => 
    ['Envenenado', 'Atemorizado'].includes(c)
  );
  if (isDisadvantagedCond && rollType !== 'saving_throw') {
    forceDisadvantage = true;
  }

  // 3. Sobrecarga Pesada (Heavy Encumbrance)
  const labelLower = label.toLowerCase();
  const isStrDexCon = labelLower.includes('força') || labelLower.includes('destreza') || labelLower.includes('constituição') ||
                      labelLower.includes('for') || labelLower.includes('des') || labelLower.includes('con') ||
                      ['atletismo', 'acrobacia', 'furtividade', 'prestidigitacao', 'prestidigitação'].some(s => labelLower.includes(s)) ||
                      rollType === 'attack';
  if (isHeavilyEncumbered(sheet) && isStrDexCon) {
    forceDisadvantage = true;
  }

  // 4. Talento War Caster (Conjurador de Combate)
  const hasWarCaster = sheet.feats?.some(f => f.name === 'War Caster' || f.namePt === 'Conjurador de Combate');
  if (hasWarCaster && rollType === 'saving_throw' && labelLower.includes('concentração')) {
    forceAdvantage = true;
  }

  if (forceAdvantage && forceDisadvantage) {
    finalAdvantage = 'normal';
  } else if (forceAdvantage) {
    finalAdvantage = 'advantage';
  } else if (forceDisadvantage) {
    finalAdvantage = 'disadvantage';
  }

  const { d20Roll1, d20Roll2, selectedD20: rawSelectedD20 } = rollD20(finalAdvantage);
  const selectedD20 = reliableTalent ? Math.max(rawSelectedD20, 10) : rawSelectedD20;
  const total = selectedD20 + modifier;

  let critThreshold = 20;
  if (rollType === 'attack' && sheet.className === 'Guerreiro' && sheet.subclass === 'Campeão') {
    const level = getClassLevel(sheet, 'Guerreiro');
    if (level >= 15) critThreshold = 18;
    else if (level >= 3) critThreshold = 19;
  }

  const isCrit = selectedD20 >= critThreshold;
  const isFail = selectedD20 === 1;

  const rollEvent: DiceRollEvent = {
    id: Date.now().toString(),
    characterId: sheet.id,
    characterName: sheet.characterName || 'Personagem',
    avatarUrl: sheet.avatarUrl,
    rollType,
    label,
    d20Roll1,
    d20Roll2,
    selectedD20,
    modifier,
    total,
    isCrit,
    isFail,
    advantageMode,
    visibility,
    isSecret: isSecret || visibility === 'gm' || visibility === 'blind',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  const modifierCards = buildBg3ModifierCards(sheet, label, modifier, rollType);

  // Trigger BG3 3D Dice Modal overlay state in store
  if (typeof window !== 'undefined') {
    useLiveCockpitStudioStore.getState().setBg3DiceOverlay({
      title: label,
      subtitle: `${sheet.characterName || 'Personagem'} • Teste de ${label}`,
      actorName: sheet.characterName,
      d20Roll: d20Roll1,
      secondD20Roll: d20Roll2,
      selectedD20Roll: selectedD20,
      modifier,
      totalRoll: total,
      difficultyClass: difficultyClass || 15,
      advantageMode,
      modifierCards,
      contextNarrative: contextNarrative || `${sheet.characterName} tenta realizar: ${label}`,
      isCrit,
      isFail,
      isHit: isCrit || (difficultyClass ? total >= difficultyClass : true),
      isRolling: true,
      phase: 'd20',
    });
  }

  broadcastDiceRoll(rollEvent, secretMode);
  return rollEvent;
}

/**
 * Rola uma jogada de Ataque com Arma (Ataque + Dano)
 */
export function executeWeaponAttackRoll({
  sheet,
  weaponName,
  atkBonusStr,
  damageStr,
  damageType,
  advantageMode = 'normal',
  visibility = 'public',
  isSecret = false,
  secretMode = 'subtle_notice',
}: {
  sheet: CharacterSheet;
  weaponName: string;
  atkBonusStr: string;
  damageStr: string;
  damageType?: string;
  advantageMode?: AdvantageMode;
  visibility?: RollVisibility;
  isSecret?: boolean;
  secretMode?: SecretRollNotificationMode;
}): { attackRoll: DiceRollEvent; damageRoll: DiceRollEvent } {
  const atkModifier = parseInt(atkBonusStr.replace('+', ''), 10) || 0;
  const attackRoll = executeCheckRoll({
    sheet,
    label: `Ataque: ${weaponName}`,
    modifier: atkModifier,
    rollType: 'attack',
    advantageMode,
    visibility,
    isSecret,
    secretMode,
  });

  // Rolagem de Dano
  let damageTotal = 0;
  try {
    const match = damageStr.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (match) {
      const numDice = parseInt(match[1], 10) || 1;
      const diceFaces = parseInt(match[2], 10) || 6;
      const sign = match[3] === '-' ? -1 : 1;
      const bonus = parseInt(match[4] || '0', 10);

      // Combate com Armas Grandes (GWF)
      const hasGWF = !!(
        sheet.otherFeatures?.toLowerCase().includes('armas grandes') ||
        sheet.featuresAndTraits?.toLowerCase().includes('armas grandes') ||
        sheet.otherFeatures?.toLowerCase().includes('great weapon') ||
        sheet.featuresAndTraits?.toLowerCase().includes('great weapon')
      );
      const weapon = WEAPON_TABLE[weaponName];
      const isTwoHandedOrVersatile = weapon?.properties?.some(p => 
        p.toLowerCase().includes('duas mãos') || 
        p.toLowerCase().includes('two-handed') || 
        p.toLowerCase().includes('versátil') || 
        p.toLowerCase().includes('versatile')
      );
      const shouldApplyGWF = hasGWF && (!weapon || !weapon.isRanged) && isTwoHandedOrVersatile;

      let diceSum = 0;
      for (let i = 0; i < numDice; i++) {
        let roll = Math.floor(Math.random() * diceFaces) + 1;
        if (shouldApplyGWF && (roll === 1 || roll === 2)) {
          roll = Math.floor(Math.random() * diceFaces) + 1;
        }
        diceSum += roll;
      }
      damageTotal = diceSum + sign * bonus;
    } else {
      damageTotal = parseInt(damageStr, 10) || 1;
    }
  } catch (e) {
    damageTotal = 1;
  }

  const damageRoll: DiceRollEvent = {
    id: (Date.now() + 1).toString(),
    characterId: sheet.id,
    characterName: sheet.characterName || 'Personagem',
    avatarUrl: sheet.avatarUrl,
    rollType: 'damage',
    label: `Dano (${weaponName})`,
    modifier: 0,
    total: Math.max(1, damageTotal),
    damageDice: damageStr,
    damageType: damageType || 'Físico',
    visibility,
    isSecret: isSecret || visibility === 'gm' || visibility === 'blind',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  broadcastDiceRoll(damageRoll, secretMode);
  return { attackRoll, damageRoll };
}

/**
 * Calcula o número de dados d6 do Ataque Furtivo (Sneak Attack) baseado no nível de Ladino.
 * Fórmula: ceil(nível / 2) dados d6
 */
export function getSneakAttackDice(rogueLevel: number): string {
  if (rogueLevel < 1) return '0d6';
  const numDice = Math.ceil(rogueLevel / 2);
  return `${numDice}d6`;
}

/**
 * Rola o dano do Ataque Furtivo (Sneak Attack) e transmite como evento de dano no chat.
 */
export function executeSneakAttackRoll({
  sheet,
  visibility = 'public',
  secretMode = 'subtle_notice',
  isCrit = false,
}: {
  sheet: CharacterSheet;
  visibility?: RollVisibility;
  secretMode?: SecretRollNotificationMode;
  isCrit?: boolean;
}): DiceRollEvent {
  const rogueLevel = getClassLevel(sheet, 'Ladino');
  const baseDice = Math.ceil(rogueLevel / 2);
  const numDice = isCrit ? baseDice * 2 : baseDice;
  const diceStr = `${numDice}d6`;

  let damageTotal = 0;
  for (let i = 0; i < numDice; i++) {
    damageTotal += Math.floor(Math.random() * 6) + 1;
  }

  const damageRoll: DiceRollEvent = {
    id: Date.now().toString(),
    characterId: sheet.id,
    characterName: sheet.characterName || 'Personagem',
    avatarUrl: sheet.avatarUrl,
    rollType: 'damage',
    label: `Ataque Furtivo (${diceStr})`,
    modifier: 0,
    total: Math.max(1, damageTotal),
    damageDice: diceStr,
    damageType: 'Físico',
    visibility,
    isSecret: visibility === 'gm' || visibility === 'blind',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  broadcastDiceRoll(damageRoll, secretMode);
  return damageRoll;
}

/**
 * Rola uma fórmula arbitrária de dados D&D (ex: "8d6", "3d8+4", "1d10-1")
 */
export function rollDiceFormula(formula: string): { total: number; rolls: number[]; formula: string } {
  if (!formula || !formula.trim()) {
    return { total: 0, rolls: [], formula: '0' };
  }
  const clean = formula.replace(/\s+/g, '');
  const diceMatch = clean.match(/^(\d+)d(\d+)([\+\-]\d+)?$/i);
  if (diceMatch) {
    const count = parseInt(diceMatch[1], 10) || 1;
    const sides = parseInt(diceMatch[2], 10) || 6;
    const modifier = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;
    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1;
      rolls.push(r);
      sum += r;
    }
    return { total: Math.max(0, sum + modifier), rolls, formula };
  }

  const num = parseInt(clean, 10);
  if (!isNaN(num)) {
    return { total: num, rolls: [num], formula };
  }

  return { total: 0, rolls: [], formula };
}

