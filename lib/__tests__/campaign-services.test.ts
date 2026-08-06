import { describe, it, expect, beforeEach, vi } from 'vitest';
import { campaignService } from '../services/campaignService';
import * as supabaseModule from '../supabase';

// Mock Sonner Toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Supabase Module
vi.mock('../supabase', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
  };

  return {
    supabase: mockSupabase,
    isSupabaseConfigured: vi.fn(),
    isValidUuid: vi.fn(),
  };
});

describe('Campaign Service & Repository Persistence Tests', () => {
  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockCampaignId = '22222222-2222-2222-2222-222222222222';

  // Setup Mock LocalStorage
  const store: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('Offline (localStorage) Mode', () => {
    beforeEach(() => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(false);
    });

    it('deve retornar lista vazia de campanhas se localstorage estiver limpo', async () => {
      const camps = await campaignService.fetchUserCampaigns(mockUserId);
      expect(camps.ok).toBe(true);
      if (camps.ok) {
        expect(camps.value).toEqual([]);
      }
    });

    it('deve buscar campanhas salvas localmente', async () => {
      const localData = [
        { id: 'camp-1', title: 'Campanha Local', inviteCode: 'LOC-123', role: 'dm' }
      ];
      mockLocalStorage.setItem('codex_campaigns', JSON.stringify(localData));

      const camps = await campaignService.fetchUserCampaigns(mockUserId);
      expect(camps.ok).toBe(true);
      if (camps.ok) {
        expect(camps.value).toEqual(localData);
      }
    });

    it('deve criar uma campanha local offline', async () => {
      const camp = await campaignService.createCampaign('Nova Campanha Offline', undefined, 'Uma campanha local', mockUserId);
      expect(camp.ok).toBe(true);
      if (camp.ok) {
        expect(camp.value.title).toBe('Nova Campanha Offline');
        expect(camp.value.id).toContain('camp-');
        expect(camp.value.role).toBe('dm');
        expect(camp.value.inviteCode).toBeDefined();
      }
    });

    it('deve buscar membros salvos localmente', async () => {
      const mockMembers = [{ id: 'mem-1', campaignId: mockCampaignId, userId: 'u-1', role: 'player', characterName: 'Conan' }];
      mockLocalStorage.setItem('codex_members', JSON.stringify(mockMembers));

      const members = await campaignService.fetchCampaignMembers(mockCampaignId);
      expect(members.ok).toBe(true);
      if (members.ok) {
        expect(members.value).toEqual(mockMembers);
      }
    });
  });

  describe('Online (Supabase) Mode', () => {
    beforeEach(() => {
      vi.mocked(supabaseModule.isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(supabaseModule.isValidUuid).mockReturnValue(true);
    });

    it('deve buscar campanhas do Supabase unificando DM e Participante', async () => {
      const mockDmCampaigns = [
        { id: 'c-dm-1', dm_id: mockUserId, title: 'Campanha Mestre', invite_code: 'MST-123', created_at: '2026' }
      ];
      const mockMemberCampaigns = [
        {
          campaign_id: 'c-mem-2',
          role: 'player',
          campaigns: { id: 'c-mem-2', dm_id: 'other-dm', title: 'Campanha Jogador', invite_code: 'JOG-999', created_at: '2026' }
        }
      ];

      const fromSpy = vi.spyOn(supabaseModule.supabase, 'from');

      // Mock chain para dm campaigns select
      const mockEq1 = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: mockDmCampaigns, error: null }) };
      // Mock chain para member campaigns select
      const mockEq2 = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: mockMemberCampaigns, error: null }) };

      fromSpy.mockImplementation((table: string) => {
        if (table === 'campaigns') return mockEq1 as any;
        if (table === 'campaign_members') return mockEq2 as any;
        return {} as any;
      });

      const result = await campaignService.fetchUserCampaigns(mockUserId);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].id).toBe('c-dm-1');
        expect(result.value[0].role).toBe('dm');
        expect(result.value[1].id).toBe('c-mem-2');
        expect(result.value[1].role).toBe('player');
      }
    });

    it('deve cadastrar uma nova campanha no Supabase', async () => {
      const mockCampaignDbRow = {
        id: 'new-camp-uuid',
        dm_id: mockUserId,
        title: 'Campanha Supabase',
        description: 'Nova aventura',
        invite_code: 'NEW-456',
        created_at: '2026',
      };

      const fromSpy = vi.spyOn(supabaseModule.supabase, 'from');
      const mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCampaignDbRow, error: null }),
      };
      fromSpy.mockReturnValue(mockChain as any);

      const result = await campaignService.createCampaign('Campanha Supabase', undefined, 'Nova aventura', mockUserId);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('new-camp-uuid');
        expect(result.value.title).toBe('Campanha Supabase');
        expect(result.value.role).toBe('dm');
      }
    });

    it('deve aderir a uma campanha pelo código de convite', async () => {
      const mockCampRow = {
        id: 'camp-invite-123',
        dm_id: 'dm-some',
        title: 'Campanha por Convite',
        invite_code: 'INV-789',
      };
      const mockMemberRow = {
        id: 'mem-created-id',
        campaign_id: 'camp-invite-123',
        user_id: mockUserId,
        role: 'player',
        character_name: 'Drizzt',
      };

      const fromSpy = vi.spyOn(supabaseModule.supabase, 'from');
      const rpcSpy = vi.spyOn(supabaseModule.supabase, 'rpc');

      rpcSpy.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockCampRow, error: null })
      } as any);

      // Mock de busca de campanha e inserção de membro
      const mockChainCamp = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: mockCampRow, error: null }) };
      const mockChainMembers = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockImplementation((col, val) => {
          return {
            eq: vi.fn().mockImplementation(() => Promise.resolve({ data: [], error: null })),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          };
        }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMemberRow, error: null })
      };

      fromSpy.mockImplementation((table: string) => {
        if (table === 'campaigns') return mockChainCamp as any;
        if (table === 'campaign_members') return mockChainMembers as any;
        return {} as any;
      });

      const result = await campaignService.joinCampaignByCode('INV-789', mockUserId, 'Drizzt');
      if (!result.ok) console.log('JOIN ERROR:', result.error);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).not.toBeNull();
        expect(result.value?.campaign.id).toBe('camp-invite-123');
        expect(result.value?.member?.characterName).toBe('Drizzt');
      }
    });
  });
});
