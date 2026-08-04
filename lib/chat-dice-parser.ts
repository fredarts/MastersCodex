import { ChatDiceResult } from './types';

const ROLL_PATTERN = /^\/r(?:oll)?\s+(.+)$/i;
const DICE_EXPR = /(\d+)d(\d+)/gi;
const MODIFIER_PATTERN = /([+-]\s*\d+)(?!d)/g;

/**
 * Parses a chat message for dice commands like `/roll 2d6+3` or `/r 1d20-1`.
 * Returns null if the message is not a dice command.
 * Supports multiple dice groups: `/roll 2d6+1d4+3`
 */
export function parseDiceCommand(text: string): ChatDiceResult | null {
  const match = text.trim().match(ROLL_PATTERN);
  if (!match) return null;

  const expression = match[1].trim();
  const rolls: number[] = [];
  let total = 0;
  let hasDice = false;
  let isCrit = false;
  let isFail = false;

  // Roll all dice groups (e.g. 2d6, 1d4, 1d20)
  let remainingExpr = expression;
  let diceMatch: RegExpExecArray | null;
  DICE_EXPR.lastIndex = 0;
  while ((diceMatch = DICE_EXPR.exec(expression)) !== null) {
    hasDice = true;
    const numDice = parseInt(diceMatch[1], 10) || 1;
    const faces = parseInt(diceMatch[2], 10) || 6;

    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * faces) + 1;
      rolls.push(roll);
      total += roll;

      // Check for crit/fail on d20
      if (faces === 20 && numDice === 1) {
        if (roll === 20) isCrit = true;
        if (roll === 1) isFail = true;
      }
    }
  }

  if (!hasDice) return null;

  // Parse static modifiers (+3, -1, + 2)
  const cleanedExpr = expression.replace(DICE_EXPR, '');
  const modMatches = cleanedExpr.match(MODIFIER_PATTERN);
  if (modMatches) {
    for (const mod of modMatches) {
      total += parseInt(mod.replace(/\s+/g, ''), 10);
    }
  }

  return {
    formula: expression,
    rolls,
    total: Math.max(0, total),
    isCrit: isCrit || undefined,
    isFail: isFail || undefined,
  };
}

/**
 * Checks if a string starts with a dice command prefix
 */
export function isDiceCommand(text: string): boolean {
  return ROLL_PATTERN.test(text.trim());
}
