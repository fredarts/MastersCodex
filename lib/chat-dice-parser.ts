import { ChatDiceResult, RollVisibility, CharacterSheet } from './types';

// Command patterns
const PUBLIC_ROLL_PATTERN = /^\/(?:r|roll)\s+(.+)$/i;
const GM_ROLL_PATTERN = /^\/(?:gmr|gmroll|secretroll|sroll)\s+(.+)$/i;
const BLIND_ROLL_PATTERN = /^\/(?:broll|blindroll)\s+(.+)$/i;

// Advanced Dice Expression regex: matches e.g. 2d20kh1, 4d6dl1, 1d20, 2d6
const ADVANCED_DICE_EXPR = /(\d+)d(\d+)(?:(kh|kl|dl|dh)(\d+))?/gi;
const MODIFIER_PATTERN = /([+-]\s*\d+)(?![dD])/g;

export interface ExtendedChatDiceResult extends ChatDiceResult {
  visibility: RollVisibility;
  isSecret: boolean;
  rawExpression: string;
  diceBreakdown?: {
    numDice: number;
    faces: number;
    keptRolls: number[];
    droppedRolls?: number[];
  }[];
}

/**
 * Replaces attribute variables in macro strings (e.g., `@str`, `@dex`, `@pb`) with values from CharacterSheet
 */
export function interpolateMacroVariables(text: string, sheet?: CharacterSheet | null): string {
  if (!sheet) return text;

  const getMod = (score?: number) => Math.floor(((score || 10) - 10) / 2);
  const pb = Math.ceil(1 + (sheet.level || 1) / 4);

  const vars: Record<string, number> = {
    '@str': getMod(sheet.attributes?.str?.score),
    '@dex': getMod(sheet.attributes?.dex?.score),
    '@con': getMod(sheet.attributes?.con?.score),
    '@int': getMod(sheet.attributes?.int?.score),
    '@wis': getMod(sheet.attributes?.wis?.score),
    '@cha': getMod(sheet.attributes?.cha?.score),
    '@pb': pb,
    '@lvl': sheet.level || 1,
    '@hp': sheet.hp?.current || 0,
    '@ac': sheet.ac || 10,
  };

  let interpolated = text;
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(key, 'gi');
    interpolated = interpolated.replace(regex, val >= 0 ? `+${val}` : `${val}`);
  }

  // Clean up double plus signs (e.g. 1d20++4 -> 1d20+4)
  return interpolated.replace(/\+\+/g, '+');
}

/**
 * Parses chat text for dice commands (`/roll`, `/gmroll`, `/blindroll`).
 * Supports advanced RPG syntax: `2d20kh1`, `4d6dl1`, `1d20+5 adv`.
 */
export function parseDiceCommand(text: string, sheet?: CharacterSheet | null): ExtendedChatDiceResult | null {
  const trimmed = text.trim();
  let visibility: RollVisibility = 'public';
  let isSecret = false;
  let expression = '';

  let match = trimmed.match(PUBLIC_ROLL_PATTERN);
  if (match) {
    expression = match[1].trim();
  } else {
    match = trimmed.match(GM_ROLL_PATTERN);
    if (match) {
      visibility = 'gm';
      isSecret = true;
      expression = match[1].trim();
    } else {
      match = trimmed.match(BLIND_ROLL_PATTERN);
      if (match) {
        visibility = 'blind';
        isSecret = true;
        expression = match[1].trim();
      }
    }
  }

  if (!expression) return null;

  // Substitute macro variables
  expression = interpolateMacroVariables(expression, sheet);

  // Check for Advantage / Disadvantage keywords in formula
  let forceAdvantage: 'adv' | 'dis' | null = null;
  if (/\b(?:adv|vantagem)\b/i.test(expression)) {
    forceAdvantage = 'adv';
    expression = expression.replace(/\b(?:adv|vantagem)\b/gi, '').trim();
  } else if (/\b(?:dis|desv|desvantagem)\b/i.test(expression)) {
    forceAdvantage = 'dis';
    expression = expression.replace(/\b(?:dis|desv|desvantagem)\b/gi, '').trim();
  }

  // Handle implicit advantage: converting `1d20` to `2d20kh1` or `2d20kl1`
  if (forceAdvantage === 'adv' && /^1d20(?!\d)/i.test(expression)) {
    expression = expression.replace(/^1d20/i, '2d20kh1');
  } else if (forceAdvantage === 'dis' && /^1d20(?!\d)/i.test(expression)) {
    expression = expression.replace(/^1d20/i, '2d20kl1');
  }

  const allKeptRolls: number[] = [];
  const breakdownList: ExtendedChatDiceResult['diceBreakdown'] = [];
  let diceTotal = 0;
  let hasDice = false;
  let isCrit = false;
  let isFail = false;

  ADVANCED_DICE_EXPR.lastIndex = 0;
  let diceMatch: RegExpExecArray | null;

  while ((diceMatch = ADVANCED_DICE_EXPR.exec(expression)) !== null) {
    hasDice = true;
    const numDice = parseInt(diceMatch[1], 10) || 1;
    const faces = parseInt(diceMatch[2], 10) || 6;
    const modifierType = diceMatch[3]?.toLowerCase(); // kh, kl, dl, dh
    const modifierCount = parseInt(diceMatch[4], 10) || 1;

    // Roll all dice
    const rawRolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rawRolls.push(Math.floor(Math.random() * faces) + 1);
    }

    let kept: number[] = [];
    let dropped: number[] = [];

    if (modifierType === 'kh') {
      // Keep Highest N
      const sorted = [...rawRolls].sort((a, b) => b - a);
      kept = sorted.slice(0, modifierCount);
      dropped = sorted.slice(modifierCount);
    } else if (modifierType === 'kl') {
      // Keep Lowest N
      const sorted = [...rawRolls].sort((a, b) => a - b);
      kept = sorted.slice(0, modifierCount);
      dropped = sorted.slice(modifierCount);
    } else if (modifierType === 'dl') {
      // Drop Lowest N
      const sorted = [...rawRolls].sort((a, b) => a - b);
      dropped = sorted.slice(0, modifierCount);
      kept = sorted.slice(modifierCount);
    } else if (modifierType === 'dh') {
      // Drop Highest N
      const sorted = [...rawRolls].sort((a, b) => b - a);
      dropped = sorted.slice(0, modifierCount);
      kept = sorted.slice(modifierCount);
    } else {
      kept = [...rawRolls];
    }

    const groupSum = kept.reduce((a, b) => a + b, 0);
    diceTotal += groupSum;
    allKeptRolls.push(...kept);

    breakdownList.push({
      numDice,
      faces,
      keptRolls: kept,
      droppedRolls: dropped.length > 0 ? dropped : undefined,
    });

    // Check for Critical Hits / Fails on d20
    if (faces === 20) {
      if (kept.includes(20)) isCrit = true;
      if (kept.includes(1)) isFail = true;
    }
  }

  if (!hasDice) return null;

  // Add static modifiers (+3, -1, etc.)
  let staticModSum = 0;
  const cleanedExpr = expression.replace(ADVANCED_DICE_EXPR, '');
  const modMatches = cleanedExpr.match(MODIFIER_PATTERN);
  if (modMatches) {
    for (const mod of modMatches) {
      staticModSum += parseInt(mod.replace(/\s+/g, ''), 10);
    }
  }

  const grandTotal = Math.max(0, diceTotal + staticModSum);

  return {
    formula: expression,
    rawExpression: text,
    rolls: allKeptRolls,
    total: grandTotal,
    isCrit: isCrit || undefined,
    isFail: isFail || undefined,
    visibility,
    isSecret,
    diceBreakdown: breakdownList,
  };
}

/**
 * Checks if a string starts with a dice command prefix
 */
export function isDiceCommand(text: string): boolean {
  const trimmed = text.trim();
  return PUBLIC_ROLL_PATTERN.test(trimmed) || GM_ROLL_PATTERN.test(trimmed) || BLIND_ROLL_PATTERN.test(trimmed);
}
