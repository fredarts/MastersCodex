import { ReactiveTrapEffect, TrapTriggerResult, DisarmAttemptResult } from './reactiveTypes';

/**
 * Checks if a character's passive perception spots the hidden trap before stepping onto it.
 */
export function checkPassivePerceptionDetection(
  passivePerception: number,
  trap: ReactiveTrapEffect
): boolean {
  if (trap.revealedToPlayers) return true;
  return passivePerception >= trap.detectDC;
}

/**
 * Calculates deterministic or simulated damage for a trap dice notation (e.g. '2d10', '5d8').
 */
export function calculateTrapDamage(damageDice?: string, fixedRoll?: number): number {
  if (!damageDice || damageDice === '0') return 0;
  if (fixedRoll !== undefined) return fixedRoll;

  try {
    const diceParts = damageDice.split('+').map((s) => s.trim());
    let total = 0;

    diceParts.forEach((part) => {
      if (part.includes('d')) {
        const [countStr, sidesStr] = part.split('d');
        const count = parseInt(countStr, 10) || 1;
        const sides = parseInt(sidesStr, 10) || 6;
        for (let i = 0; i < count; i++) {
          total += Math.floor(Math.random() * sides) + 1;
        }
      } else {
        total += parseInt(part, 10) || 0;
      }
    });

    return Math.max(0, total);
  } catch (e) {
    return 5;
  }
}

/**
 * Evaluates the step of a token onto a cell containing a reactive trap or trigger.
 */
export function evaluateTokenStep(params: {
  tokenName: string;
  passivePerception: number;
  trap: ReactiveTrapEffect;
  forceStepEvenIfDetected?: boolean;
  saveRollOverride?: number; // Useful for deterministic testing
  damageRollOverride?: number;
}): TrapTriggerResult {
  const { tokenName, passivePerception, trap, forceStepEvenIfDetected = false, saveRollOverride, damageRollOverride } = params;

  const updatedTrap: ReactiveTrapEffect = { ...trap };

  // 1. If trap is already disarmed or inactive
  if (!updatedTrap.isArmed) {
    return {
      triggered: false,
      detectedEarly: false,
      message: `${tokenName} pisou com segurança. O mecanismo está inativo ou desarmado.`,
      damageDealt: 0,
      updatedTrap,
    };
  }

  // 2. Check early detection if not forced
  const detectedEarly = checkPassivePerceptionDetection(passivePerception, updatedTrap);

  if (detectedEarly && !updatedTrap.revealedToPlayers && !forceStepEvenIfDetected) {
    updatedTrap.revealedToPlayers = true;
    return {
      triggered: false,
      detectedEarly: true,
      message: `⚠️ Percepção Passiva (${passivePerception}): ${tokenName} notou "${updatedTrap.name}" a tempo antes de pisar!`,
      damageDealt: 0,
      updatedTrap,
    };
  }

  // 3. Trap Triggers!
  updatedTrap.revealedToPlayers = true;
  if (updatedTrap.oneShot) {
    updatedTrap.isArmed = false;
  }

  // 4. Resolve Save & Damage if applicable
  let damageDealt = 0;
  let saveSuccess = false;
  const saveStat = updatedTrap.saveStat;
  const saveDC = updatedTrap.saveDC;

  const baseDamage = calculateTrapDamage(updatedTrap.damageDice, damageRollOverride);

  if (saveStat && saveDC) {
    const rawSaveRoll = saveRollOverride !== undefined ? saveRollOverride : Math.floor(Math.random() * 20) + 1;
    saveSuccess = rawSaveRoll >= saveDC;

    // Successful save halves damage or negates condition
    damageDealt = saveSuccess ? Math.floor(baseDamage / 2) : baseDamage;

    const condition = !saveSuccess ? updatedTrap.conditionApplied : undefined;

    let message = '';
    if (saveSuccess) {
      message = `💥 ${tokenName} acionou "${updatedTrap.name}", mas PASSOU na salvaguarda de ${saveStat.toUpperCase()} (CD ${saveDC}), sofrendo apenas ${damageDealt} de dano!`;
    } else {
      message = `💥 ${tokenName} acionou "${updatedTrap.name}" e FALHOU na salvaguarda de ${saveStat.toUpperCase()} (CD ${saveDC})! Sofreu ${damageDealt} de dano ${updatedTrap.damageType || ''}${condition ? ` e ficou ${condition}` : ''}!`;
    }

    return {
      triggered: true,
      detectedEarly: false,
      message,
      damageDealt,
      damageDice: updatedTrap.damageDice,
      damageType: updatedTrap.damageType,
      saveStat,
      saveDC,
      saveRoll: rawSaveRoll,
      saveSuccess,
      conditionApplied: condition,
      soundEffect: updatedTrap.soundEffect,
      linkedTriggerExecuted: updatedTrap.type === 'pressure_plate',
      linkedTargetId: updatedTrap.targetId,
      updatedTrap,
    };
  }

  // Pure pressure plate / utility trigger
  if (updatedTrap.type === 'pressure_plate') {
    return {
      triggered: true,
      detectedEarly: false,
      message: `⚙️ ${tokenName} pisou na placa de pressão! Um mecanismo pesado ressoou nas paredes.`,
      damageDealt: 0,
      soundEffect: updatedTrap.soundEffect || 'gate_close',
      linkedTriggerExecuted: true,
      linkedTargetId: updatedTrap.targetId,
      updatedTrap,
    };
  }

  // Pure hazard without save
  damageDealt = baseDamage;
  return {
    triggered: true,
    detectedEarly: false,
    message: `💥 ${tokenName} pisou em "${updatedTrap.name}" e sofreu ${damageDealt} de dano!`,
    damageDealt,
    damageDice: updatedTrap.damageDice,
    damageType: updatedTrap.damageType,
    conditionApplied: updatedTrap.conditionApplied,
    soundEffect: updatedTrap.soundEffect,
    updatedTrap,
  };
}

/**
 * Attempts to disarm a revealed trap with Thieves' Tools / Sleight of Hand.
 */
export function attemptDisarmTrap(params: {
  characterName: string;
  trap: ReactiveTrapEffect;
  roll: number;
  modifier?: number;
}): { result: DisarmAttemptResult; updatedTrap: ReactiveTrapEffect } {
  const { characterName, trap, roll, modifier = 0 } = params;
  const total = roll + modifier;
  const updatedTrap = { ...trap };

  // Critical failure (natural 1 or failed by 5+)
  const critFail = roll === 1 || (total < trap.disarmDC - 5);

  if (total >= trap.disarmDC) {
    updatedTrap.isArmed = false;
    return {
      result: {
        success: true,
        roll: total,
        targetDC: trap.disarmDC,
        critFail: false,
        accidentallyTriggered: false,
        message: `🛠️ Sucesso! ${characterName} desarmou o mecanismo de "${trap.name}" com maestria (Total: ${total} vs CD ${trap.disarmDC}).`,
      },
      updatedTrap,
    };
  }

  if (critFail && trap.isArmed) {
    return {
      result: {
        success: false,
        roll: total,
        targetDC: trap.disarmDC,
        critFail: true,
        accidentallyTriggered: true,
        message: `💥 FALHA CRÍTICA! Ao tentar desarmar, ${characterName} acionou acidentalmente "${trap.name}"!`,
      },
      updatedTrap,
    };
  }

  return {
    result: {
      success: false,
      roll: total,
      targetDC: trap.disarmDC,
      critFail: false,
      accidentallyTriggered: false,
      message: `❌ ${characterName} não conseguiu desarmar "${trap.name}" (Total: ${total} vs CD ${trap.disarmDC}), mas o mecanismo não disparou.`,
    },
    updatedTrap,
  };
}
