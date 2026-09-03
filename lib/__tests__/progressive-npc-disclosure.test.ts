import { describe, it, expect } from 'vitest';
import { WorldEntity, UserCampaign, CampaignNPCDisclosure } from '@/lib/types';

describe('Progressive NPC Disclosure Engine', () => {
  const mockNpc: WorldEntity = {
    id: 'npc-valerius-1',
    worldId: 'world-valiria-1',
    category: 'npc',
    name: 'Rei Theron Valerius III',
    subType: 'Nobre / Feiticeiro',
    status: 'active',
    shortDesc: 'O monarca idoso da cidadela do sul, cercado por rumores e traição.',
    fullContent: 'Theron nasceu no ano 402 da Era das Cinzas. Ele secretamente fez um pacto com o Dragão Rubro...',
    images: ['https://example.com/theron-portrait.png'],
    attributes: {
      npcRace: 'Humano',
      npcClass: 'Feiticeiro Nível 14',
      npcAlignment: 'Leal e Mau',
      npcSecrets: 'Ele é na verdade o mentor do Culto da Chama Negra.',
    },
    statSheet: {
      id: 'stat-1',
      entityId: 'npc-valerius-1',
      ac: 16,
      hp: 120,
      maxHp: 120,
      str: 10,
      dex: 14,
      con: 14,
      int: 16,
      wis: 12,
      cha: 18,
    },
  };

  it('deve permitir que o Mestre oculte a imagem e o nome real usando um pseudônimo em uma campanha', () => {
    const disclosureCampaignA: CampaignNPCDisclosure = {
      entityId: mockNpc.id,
      isShared: true,
      alias: 'O Monarca Mascarado',
      revealedFields: {
        image: false,
        name: false,
        raceClass: false,
        shortDesc: true,
        fullContent: false,
        secrets: false,
        connections: false,
        statSheet: false,
        tags: true,
      },
    };

    // Resolução de visualização para o Jogador na Campanha A:
    const resolvedName = disclosureCampaignA.revealedFields.name 
      ? mockNpc.name 
      : (disclosureCampaignA.alias || 'Identidade Desconhecida');
    
    expect(resolvedName).toBe('O Monarca Mascarado');
    expect(disclosureCampaignA.revealedFields.image).toBe(false);
    expect(disclosureCampaignA.revealedFields.secrets).toBe(false);
  });

  it('deve manter permissões de visibilidade totalmente independentes entre campanhas distintas', () => {
    // Campanha A: Jogadores acabaram de ouvir rumores (Nome secreto, imagem secreta)
    const campaignA: UserCampaign = {
      id: 'camp-group-a',
      dmId: 'dm-1',
      worldId: 'world-valiria-1',
      title: 'Mesa das Segundas',
      inviteCode: 'MESA-A',
      role: 'dm',
      npcDisclosures: {
        [mockNpc.id]: {
          entityId: mockNpc.id,
          isShared: true,
          alias: 'O Estranho da Coroa Quebrada',
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
      },
    };

    // Campanha B: Jogadores já desmascararam o Rei e sabem a verdade completa
    const campaignB: UserCampaign = {
      id: 'camp-group-b',
      dmId: 'dm-1',
      worldId: 'world-valiria-1',
      title: 'Mesa dos Sábados',
      inviteCode: 'MESA-B',
      role: 'dm',
      npcDisclosures: {
        [mockNpc.id]: {
          entityId: mockNpc.id,
          isShared: true,
          alias: '',
          revealedFields: {
            image: true,
            name: true,
            raceClass: true,
            shortDesc: true,
            fullContent: true,
            secrets: true,
            connections: true,
            statSheet: true,
            tags: true,
          },
        },
      },
    };

    const disclosureA = campaignA.npcDisclosures![mockNpc.id];
    const disclosureB = campaignB.npcDisclosures![mockNpc.id];

    expect(disclosureA.revealedFields.name).toBe(false);
    expect(disclosureA.alias).toBe('O Estranho da Coroa Quebrada');
    expect(disclosureA.revealedFields.secrets).toBe(false);

    expect(disclosureB.revealedFields.name).toBe(true);
    expect(disclosureB.revealedFields.image).toBe(true);
    expect(disclosureB.revealedFields.secrets).toBe(true);
  });

  it('deve ocultar o resumo e aplicar texto de mistério se o Mestre desmarcar a revelação da descrição', () => {
    const disclosureRetracted: CampaignNPCDisclosure = {
      entityId: mockNpc.id,
      isShared: true,
      alias: 'Indivíduo Encapuzado',
      revealedFields: {
        image: false,
        name: false,
        raceClass: false,
        shortDesc: false, // Descrição ocultada pelo Mestre
        fullContent: false,
        secrets: false,
        connections: false,
        statSheet: false,
        tags: false,
      },
    };

    const resolvedSummary = disclosureRetracted.revealedFields.shortDesc
      ? mockNpc.shortDesc
      : 'Identidade e histórico velados pelo mistério.';

    expect(resolvedSummary).not.toBe(mockNpc.shortDesc);
    expect(resolvedSummary).toContain('mistério');
  });
});
