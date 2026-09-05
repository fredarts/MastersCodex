/**
 * Motor de Feedback Tátil (Web Vibration API) para Mobile Companion
 * Suporta padrões personalizados para rolagens, críticos, dano e emergências.
 */

export const HAPTIC_PATTERNS = {
  // Toque sutil para botões e seleções rápidas
  tap: 10,
  
  // Rolagem de dados padrão
  rollNormal: 15,
  
  // Sucesso Decisivo / Crítico 20: Vibração dupla triunfal
  rollCritSuccess: [30, 50, 60],
  
  // Falha Crítica 1: Vibração longa de alerta
  rollCritFail: 150,
  
  // Perda de vida / Dano recebido
  damageTaken: [40, 30, 40],
  
  // Cura recebida ou ganho de HP Temp
  healReceived: [20, 40, 20],
  
  // Alerta de 0 HP / Queda inconsciente
  zeroHpDanger: [80, 40, 80, 40, 120],
  
  // Gasto ou restauração de slot de magia
  slotToggle: 25,
  
  // Confirmação de ação ou descanso
  restFinished: [50, 50, 50],
};

export type HapticType = keyof typeof HAPTIC_PATTERNS;

/**
 * Dispara vibração tátil de forma segura em navegadores com suporte à Vibration API.
 */
export function triggerHaptic(type: HapticType | number | number[]): boolean {
  if (typeof window === 'undefined' && typeof navigator === 'undefined') return false;
  
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : (typeof window !== 'undefined' ? window.navigator : null);
    if (nav && 'vibrate' in nav && typeof nav.vibrate === 'function') {
      const pattern = typeof type === 'string' ? HAPTIC_PATTERNS[type] : type;
      if (pattern !== undefined) {
        return nav.vibrate(pattern);
      }
    }
  } catch {
    // Ignora silenciosamente em navegadores que bloqueiam ou não suportam
  }
  return false;
}

export const haptic = {
  tap: () => triggerHaptic('tap'),
  roll: () => triggerHaptic('rollNormal'),
  critSuccess: () => triggerHaptic('rollCritSuccess'),
  critFail: () => triggerHaptic('rollCritFail'),
  damage: () => triggerHaptic('damageTaken'),
  heal: () => triggerHaptic('healReceived'),
  zeroHp: () => triggerHaptic('zeroHpDanger'),
  slot: () => triggerHaptic('slotToggle'),
  rest: () => triggerHaptic('restFinished'),
};
