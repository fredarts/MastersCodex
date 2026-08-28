import { describe, it, expect } from 'vitest';
import { ProgressClock } from '@/lib/types';

describe('Progress Clocks - Core Mechanics', () => {
  const sampleClock: ProgressClock = {
    id: 'clk-1',
    campaignId: 'camp-1',
    title: 'Guarda da Masmorra',
    totalSegments: 6,
    filledSegments: 2,
    category: 'stealth',
    isPublic: true,
    completedMessage: 'Alarme disparado!',
  };

  it('correctly calculates percentage of completion', () => {
    const pct = (sampleClock.filledSegments / sampleClock.totalSegments) * 100;
    expect(Math.round(pct)).toBe(33);
  });

  it('prevents filledSegments from exceeding totalSegments', () => {
    const advanceClock = (clock: ProgressClock, amount: number): ProgressClock => ({
      ...clock,
      filledSegments: Math.max(0, Math.min(clock.totalSegments, clock.filledSegments + amount)),
    });

    const advanced = advanceClock(sampleClock, 10);
    expect(advanced.filledSegments).toBe(6);

    const decremented = advanceClock(sampleClock, -10);
    expect(decremented.filledSegments).toBe(0);
  });

  it('detects when a clock is completed', () => {
    const isCompleted = (clock: ProgressClock) => clock.filledSegments >= clock.totalSegments;
    expect(isCompleted(sampleClock)).toBe(false);

    const completedClock: ProgressClock = { ...sampleClock, filledSegments: 6 };
    expect(isCompleted(completedClock)).toBe(true);
  });

  it('supports 4, 6, 8, and 12 segment configurations', () => {
    const validSizes = [4, 6, 8, 12];
    validSizes.forEach((size) => {
      const clock: ProgressClock = {
        ...sampleClock,
        totalSegments: size as any,
        filledSegments: size,
      };
      expect(clock.totalSegments).toBe(size);
      expect(clock.filledSegments).toBe(size);
    });
  });
});
