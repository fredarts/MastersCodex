import { describe, it, expect } from 'vitest';

describe('Session Scribe - Chronicle Generator', () => {
  it('maps narrative tones correctly', () => {
    const getToneDescription = (tone: 'epic' | 'dark' | 'poetic' | 'historic') => {
      switch (tone) {
        case 'dark':
          return 'Grimdark / Dark Fantasy';
        case 'poetic':
          return 'Poético e Bardico';
        case 'historic':
          return 'Crônica Histórica';
        default:
          return 'Épico e Inspirador';
      }
    };

    expect(getToneDescription('epic')).toContain('Épico');
    expect(getToneDescription('dark')).toContain('Grimdark');
    expect(getToneDescription('poetic')).toContain('Bardico');
    expect(getToneDescription('historic')).toContain('Histórica');
  });

  it('structures fallback chronicle with multi-act markdown and MVP moments', () => {
    const party = ['Thorin', 'Elion', 'Lilith'];
    const sessionTitle = 'O Covil do Dragão';
    const sessionNumber = 4;

    const chronicle = {
      chapterTitle: `Capítulo ${sessionNumber}: O Eco de ${sessionTitle}`,
      summary: 'Os heróis triunfaram sobre o fogo e as sombras.',
      proseStory: '### Ato I: A Escalada\nCaminharam pela neve...\n\n### Ato II: A Batalha\nO fogo rugiu...',
      mvpMoments: party.map((p) => ({
        character: p,
        moment: 'Feito decisivo em combate.',
      })),
      rewardsAndConsequences: 'Tesouro lendário obtido.',
    };

    expect(chronicle.chapterTitle).toBe('Capítulo 4: O Eco de O Covil do Dragão');
    expect(chronicle.proseStory).toContain('### Ato I');
    expect(chronicle.proseStory).toContain('### Ato II');
    expect(chronicle.mvpMoments).toHaveLength(3);
    expect(chronicle.mvpMoments[0].character).toBe('Thorin');
  });
});
