import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerHaptic, haptic, HAPTIC_PATTERNS } from '../haptics/hapticFeedback';

describe('Haptic Feedback Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deve possuir padrões definidos para todos os eventos de combate e rolagem', () => {
    expect(HAPTIC_PATTERNS.rollNormal).toBe(15);
    expect(HAPTIC_PATTERNS.rollCritSuccess).toEqual([30, 50, 60]);
    expect(HAPTIC_PATTERNS.rollCritFail).toBe(150);
    expect(HAPTIC_PATTERNS.damageTaken).toEqual([40, 30, 40]);
    expect(HAPTIC_PATTERNS.zeroHpDanger).toEqual([80, 40, 80, 40, 120]);
  });

  it('não deve lançar exceção se navigator.vibrate não estiver disponível', () => {
    expect(() => triggerHaptic('rollNormal')).not.toThrow();
    const result = triggerHaptic('rollNormal');
    expect(typeof result).toBe('boolean');
  });

  it('deve disparar navigator.vibrate com o padrão correto quando disponível', () => {
    const vibrateMock = vi.fn().mockReturnValue(true);
    // @ts-expect-error Mocking vibrate on navigator
    navigator.vibrate = vibrateMock;

    const res = haptic.critSuccess();
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 60]);
    expect(res).toBe(true);

    haptic.critFail();
    expect(vibrateMock).toHaveBeenCalledWith(150);

    haptic.damage();
    expect(vibrateMock).toHaveBeenCalledWith([40, 30, 40]);
  });
});
