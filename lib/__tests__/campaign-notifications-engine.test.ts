import { describe, it, expect, beforeEach } from 'vitest';
import { CampaignFeedEvent, CampaignNPCDisclosure } from '@/lib/types';

describe('Campaign Chromatic Notifications Engine', () => {
  const campaignId = 'camp-test-notifications';

  const mockDisclosures: Record<string, CampaignNPCDisclosure> = {
    'npc-1': {
      entityId: 'npc-1',
      isShared: true,
      alias: 'Indivíduo Misterioso',
      sharedAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(), // Atualizado agora
      revealedFields: {
        image: false,
        name: false,
        raceClass: false,
        shortDesc: true,
        fullContent: false,
        secrets: false,
        connections: false,
        statSheet: false,
        tags: false,
      },
    },
    'npc-2': {
      entityId: 'npc-2',
      isShared: true,
      sharedAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(), // Antigo
      revealedFields: {
        image: true,
        name: true,
        raceClass: true,
        shortDesc: true,
        fullContent: false,
        secrets: false,
        connections: false,
        statSheet: false,
        tags: false,
      },
    },
  };

  const mockFeedEvents: CampaignFeedEvent[] = [
    {
      id: 'ev-battle-1',
      campaignId,
      eventType: 'battle_summary',
      title: 'Vitória contra os Goblins da Colina',
      summary: 'O grupo derrotou 5 goblins e resgatou o mercador.',
      timestamp: Date.now(),
      isPublic: true,
    },
    {
      id: 'ev-recap-1',
      campaignId,
      eventType: 'session_recap',
      title: 'Sessão 4: A Chegada à Capital',
      summary: 'Entrada triunfal pelas muralhas do sul.',
      timestamp: Date.now() - 10000,
      isPublic: true,
    },
    {
      id: 'ev-lore-1',
      campaignId,
      eventType: 'world_lore',
      title: 'Tratado de Paz de 402',
      summary: 'O acordo que encerrou as Guerras Dracônicas.',
      timestamp: Date.now() - 20000,
      isPublic: true,
    },
    {
      id: 'ev-private-1',
      campaignId,
      eventType: 'session_recap',
      title: 'Notas Secretas do Mestre',
      summary: 'O artefato está amaldiçoado.',
      timestamp: Date.now(),
      isPublic: false, // Privado
    },
  ];

  it('deve identificar corretamente os eventos públicos e ignorar eventos privados do Mestre', () => {
    const publicEvents = mockFeedEvents.filter((e) => e.isPublic);
    expect(publicEvents.length).toBe(3);
    expect(publicEvents.some((e) => e.id === 'ev-private-1')).toBe(false);
  });

  it('deve atribuir as assinaturas cromáticas corretas para cada tipo de evento narrativo', () => {
    const getCategoryColor = (type: string) => {
      switch (type) {
        case 'npc':
        case 'npc_encounter':
          return 'cyan';
        case 'battle':
        case 'battle_summary':
          return 'rose';
        case 'recap':
        case 'session_recap':
          return 'amber';
        case 'lore':
        case 'world_lore':
          return 'purple';
        default:
          return 'amber';
      }
    };

    expect(getCategoryColor('npc_encounter')).toBe('cyan');
    expect(getCategoryColor('battle_summary')).toBe('rose');
    expect(getCategoryColor('session_recap')).toBe('amber');
    expect(getCategoryColor('world_lore')).toBe('purple');
  });

  it('deve detectar atualizações em revelações de NPCs baseado no timestamp de visualização do jogador', () => {
    const playerSeenTimestamp = new Date(Date.now() - 60000).toISOString(); // Visto há 1 minuto

    const isNpc1Unread = new Date(mockDisclosures['npc-1'].updatedAt!).getTime() > new Date(playerSeenTimestamp).getTime();
    const isNpc2Unread = new Date(mockDisclosures['npc-2'].updatedAt!).getTime() > new Date(playerSeenTimestamp).getTime();

    expect(isNpc1Unread).toBe(true); // npc-1 foi atualizado agora
    expect(isNpc2Unread).toBe(false); // npc-2 é antigo
  });

  it('deve calcular a agregação de novidades por categoria', () => {
    const seenEvents = new Set<string>();

    let battles = 0;
    let recaps = 0;
    let lore = 0;

    mockFeedEvents.filter((e) => e.isPublic).forEach((ev) => {
      if (seenEvents.has(ev.id)) return;
      if (ev.eventType === 'battle_summary') battles++;
      if (ev.eventType === 'session_recap') recaps++;
      if (ev.eventType === 'world_lore') lore++;
    });

    expect(battles).toBe(1);
    expect(recaps).toBe(1);
    expect(lore).toBe(1);
    expect(battles + recaps + lore).toBe(3);
  });
});
