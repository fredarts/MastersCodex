import { describe, it, expect } from 'vitest';
import {
  mapWorldRowToDomain,
  mapWorldEntityRowToDomain,
  mapCampaignRowToDomain,
  mapCampaignMemberRowToDomain,
  mapSessionRowToDomain,
  mapSceneRowToDomain,
  mapFeedEventRowToDomain,
} from '../mappers';
import {
  WorldRow,
  WorldEntityRow,
  CampaignRow,
  CampaignMemberRow,
  SessionRow,
  SceneRow,
  CampaignFeedEventRow,
} from '../database.types';

describe('Mappers Unit Tests', () => {
  describe('mapWorldRowToDomain', () => {
    it('deve mapear linha do banco para domínio corretamento com dados completos', () => {
      const row: WorldRow = {
        id: 'w-1',
        dm_id: 'dm-1',
        title: 'Mundo de Teste',
        genre: 'Dark Fantasy',
        description: 'Um mundo sombrio.',
        created_at: '2026-07-24',
      };
      const domain = mapWorldRowToDomain(row);
      expect(domain.id).toBe('w-1');
      expect(domain.dmId).toBe('dm-1');
      expect(domain.title).toBe('Mundo de Teste');
      expect(domain.genre).toBe('Dark Fantasy');
      expect(domain.description).toBe('Um mundo sombrio.');
      expect(domain.createdAt).toBe('2026-07-24');
    });

    it('deve usar gênero padrão "Fantasia Medieval" e tratar description null', () => {
      const row: WorldRow = {
        id: 'w-2',
        dm_id: 'dm-2',
        title: 'Sem Gênero',
        genre: '',
        description: null,
      };
      const domain = mapWorldRowToDomain(row);
      expect(domain.genre).toBe('Fantasia Medieval');
      expect(domain.description).toBeUndefined();
    });
  });

  describe('mapWorldEntityRowToDomain', () => {
    it('deve mapear WorldEntityRow para WorldEntity', () => {
      const row: WorldEntityRow = {
        id: 'we-1',
        world_id: 'w-1',
        category: 'npc',
        name: 'Elminster',
        sub_type: 'Mago',
        status: 'active',
        short_desc: 'Mago lendário',
        full_content: 'Detalhamento longo de Elminster.',
        attributes: { level: 20 },
        connections: ['we-2'],
        created_at: '2026-07-24',
      };

      const domain = mapWorldEntityRowToDomain(row);
      expect(domain.category).toBe('npc');
      expect(domain.subType).toBe('Mago');
      expect(domain.fullContent).toBe('Detalhamento longo de Elminster.');
      expect(domain.attributes).toEqual({ level: 20 });
      expect(domain.connections).toEqual([{ targetId: 'we-2', type: 'neutral' }]);
    });

    it('deve tolerar valores nulos usando padrões corretos', () => {
      const row: WorldEntityRow = {
        id: 'we-2',
        world_id: 'w-1',
        category: 'location',
        name: 'Waterdeep',
        status: 'active',
        short_desc: null,
        full_content: null,
      };

      const domain = mapWorldEntityRowToDomain(row);
      expect(domain.shortDesc).toBe('');
      expect(domain.fullContent).toBeUndefined();
      expect(domain.attributes).toEqual({});
      expect(domain.connections).toEqual([]);
    });
  });

  describe('mapCampaignRowToDomain', () => {
    it('deve mapear CampaignRow para UserCampaign', () => {
      const row: CampaignRow = {
        id: 'c-1',
        dm_id: 'dm-1',
        world_id: 'w-1',
        title: 'Campanha 1',
        description: 'Uma descrição simples',
        invite_code: 'INV-123',
      };

      const domain = mapCampaignRowToDomain(row, 'player');
      expect(domain.id).toBe('c-1');
      expect(domain.worldId).toBe('w-1');
      expect(domain.inviteCode).toBe('INV-123');
      expect(domain.role).toBe('player');
    });
  });

  describe('mapCampaignMemberRowToDomain', () => {
    it('deve mapear CampaignMemberRow para CampaignMember', () => {
      const row: CampaignMemberRow = {
        id: 'cm-1',
        campaign_id: 'c-1',
        user_id: 'u-1',
        role: 'player',
        character_name: 'Drizzt',
        displayName: 'Fred',
        avatar_url: 'https://avatar',
        model_url: 'https://model',
        joined_at: '2026',
      };

      const domain = mapCampaignMemberRowToDomain(row);
      expect(domain.characterName).toBe('Drizzt');
      expect(domain.displayName).toBe('Fred');
      expect(domain.avatarUrl).toBe('https://avatar');
      expect(domain.modelUrl).toBe('https://model');
    });
    it('deve tolerar valores nulos e fallbacks adequados', () => {
      const row: any = {
        id: 'cm-2',
        campaign_id: 'c-1',
        user_id: 'u-2',
        role: 'player',
        character_name: null,
        displayName: 'John',
        avatar_url: null,
        model_url: null,
        joined_at: null,
      };

      const domain = mapCampaignMemberRowToDomain(row as CampaignMemberRow);
      expect(domain.characterName).toBeUndefined();
      expect(domain.avatarUrl).toBeUndefined();
      expect(domain.modelUrl).toBeUndefined();
      expect(domain.joinedAt).toBeNull();
    });
  });

  describe('mapSessionRowToDomain', () => {
    it('deve mapear SessionRow para GameSession', () => {
      const row: SessionRow = {
        id: 's-1',
        campaign_id: 'c-1',
        session_number: 5,
        title: 'Fuga de Underdark',
        notes: 'Os personagens fugiram.',
      };

      const domain = mapSessionRowToDomain(row);
      expect(domain.sessionNumber).toBe(5);
      expect(domain.notes).toBe('Os personagens fugiram.');
    });
  });

  describe('mapSceneRowToDomain', () => {
    it('deve mapear SceneRow completo para GameScene', () => {
      const row: SceneRow = {
        id: 'sc-1',
        session_id: 's-1',
        order_index: 2,
        title: 'Emboscada',
        scene_type: 'combat',
        npc_name: 'Orc Warlord',
        sensory_text: 'O cheiro de enxofre...',
        secret_notes: 'Os orcs estão escondidos.',
        bgm_category: 'combate',
        bgm_tracks: ['track-1', 'track-2'],
        image_url: 'https://image',
        npc_audio_url: 'https://audio',
        sfx_shortcuts: ['sfx-1'],
        combatants: [{ name: 'Orc 1', hp: 15 }],
        time_of_day: 'night',
        time_of_day_hour: 22.5,
        has_fog: true,
        has_rain: true,
        floor_texture_url: 'https://floor',
        scene_images: [{ imageUrl: 'https://scene' }],
        active_image_index: 1,
        created_at: '2026',
      };

      const domain = mapSceneRowToDomain(row);
      expect(domain.npcName).toBe('Orc Warlord');
      expect(domain.sensoryText).toBe('O cheiro de enxofre...');
      expect(domain.bgmCategory).toBe('combate');
      expect(domain.bgmTracks).toEqual(['track-1', 'track-2']);
      expect(domain.combatants).toEqual([{ name: 'Orc 1', hp: 15 }]);
      expect(domain.timeOfDayHour).toBe(22.5);
      expect(domain.hasFog).toBe(true);
      expect(domain.floorTextureUrl).toBe('https://floor');
      expect(domain.activeImageIndex).toBe(1);
    });
  });

  describe('mapFeedEventRowToDomain', () => {
    it('deve mapear CampaignFeedEventRow para CampaignFeedEvent', () => {
      const row: CampaignFeedEventRow = {
        id: 'fe-1',
        campaign_id: 'c-1',
        session_id: 's-1',
        event_type: 'battle_summary',
        title: 'Fim do Orc Warlord',
        summary: 'Os aventureiros derrotaram o orc.',
        details: { xpEarned: 500 },
        is_public: false,
      };

      const domain = mapFeedEventRowToDomain(row);
      expect(domain.id).toBe('fe-1');
      expect(domain.sessionId).toBe('s-1');
      expect(domain.eventType).toBe('battle_summary');
      expect(domain.details).toEqual({ xpEarned: 500 });
      expect(domain.isPublic).toBe(false);
    });
  });
});
