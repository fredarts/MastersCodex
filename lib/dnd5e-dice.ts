import { AdvantageMode, CharacterSheet, DiceRollEvent } from './types';

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
 * Transmite um evento de rolagem para o chat/realtime
 */
export function broadcastDiceRoll(event: DiceRollEvent) {
  if (typeof window === 'undefined') return;

  // Broadcast local via BroadcastChannel
  try {
    const bc = new BroadcastChannel('masters_codex_sync');
    bc.postMessage({
      type: 'DICE_ROLL',
      rollerName: event.characterName,
      rollType: event.label,
      diceFormula: event.advantageMode && event.advantageMode !== 'normal'
        ? `2d20kh1 (${event.advantageMode === 'advantage' ? 'Vantagem' : 'Desvantagem'}) ${event.modifier >= 0 ? '+' : ''}${event.modifier}`
        : `1d20 ${event.modifier >= 0 ? '+' : ''}${event.modifier}`,
      result: event.total,
      isCrit: event.isCrit,
      isFail: event.isFail,
      details: event,
    });
    bc.close();
  } catch (e) {}
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
}: {
  sheet: CharacterSheet;
  label: string;
  modifier: number;
  rollType: DiceRollEvent['rollType'];
  advantageMode?: AdvantageMode;
}): DiceRollEvent {
  const { d20Roll1, d20Roll2, selectedD20 } = rollD20(advantageMode);
  const total = selectedD20 + modifier;
  const isCrit = selectedD20 === 20;
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
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  broadcastDiceRoll(rollEvent);
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
}: {
  sheet: CharacterSheet;
  weaponName: string;
  atkBonusStr: string;
  damageStr: string;
  damageType?: string;
  advantageMode?: AdvantageMode;
}): { attackRoll: DiceRollEvent; damageRoll: DiceRollEvent } {
  const atkModifier = parseInt(atkBonusStr.replace('+', ''), 10) || 0;
  const attackRoll = executeCheckRoll({
    sheet,
    label: `Ataque: ${weaponName}`,
    modifier: atkModifier,
    rollType: 'attack',
    advantageMode,
  });

  // Rolagem de Dano
  let damageTotal = 0;
  try {
    // Ex: "1d8 + 2" ou "2d6+3"
    const match = damageStr.match(/(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i);
    if (match) {
      const numDice = parseInt(match[1], 10) || 1;
      const diceFaces = parseInt(match[2], 10) || 6;
      const sign = match[3] === '-' ? -1 : 1;
      const bonus = parseInt(match[4] || '0', 10);

      let diceSum = 0;
      for (let i = 0; i < numDice; i++) {
        diceSum += Math.floor(Math.random() * diceFaces) + 1;
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
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  broadcastDiceRoll(damageRoll);
  return { attackRoll, damageRoll };
}
