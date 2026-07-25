import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';
import { ICampaignRepository } from '../contracts/ICampaignRepository';

export class LocalStorageCampaignRepository implements ICampaignRepository {
  async fetchUserCampaigns(userId?: string): Promise<UserCampaign[]> {
    try {
      const saved = localStorage.getItem('codex_campaigns');
      return saved ? JSON.parse(saved) : [];
    } catch (_e) {
      return [];
    }
  }

  async createCampaign(title: string, worldId?: string, description = '', userId = 'demo-dm-user-123'): Promise<UserCampaign> {
    const code = `${title.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newCamp: UserCampaign = {
      id: `camp-${Date.now()}`,
      dmId: userId,
      worldId,
      title,
      description,
      inviteCode: code,
      role: 'dm',
    };

    try {
      const saved = localStorage.getItem('codex_campaigns');
      const all: UserCampaign[] = saved ? JSON.parse(saved) : [];
      all.push(newCamp);
      localStorage.setItem('codex_campaigns', JSON.stringify(all));
    } catch (_e) {}

    return newCamp;
  }

  async fetchCampaignMembers(campaignId: string): Promise<CampaignMember[]> {
    try {
      const saved = localStorage.getItem('codex_members');
      const all: CampaignMember[] = saved ? JSON.parse(saved) : [];
      return all.filter((m) => m.campaignId === campaignId);
    } catch (_e) {
      return [];
    }
  }

  async fetchFeedEvents(campaignId: string): Promise<CampaignFeedEvent[]> {
    try {
      const saved = localStorage.getItem('codex_feed');
      const all: CampaignFeedEvent[] = saved ? JSON.parse(saved) : [];
      return all.filter((e) => e.campaignId === campaignId);
    } catch (_e) {
      return [];
    }
  }

  async createFeedEvent(eventData: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent> {
    const newEvent: CampaignFeedEvent = {
      ...eventData,
      id: `ev-${Date.now()}`,
    };

    try {
      const saved = localStorage.getItem('codex_feed');
      const all: CampaignFeedEvent[] = saved ? JSON.parse(saved) : [];
      all.unshift(newEvent);
      localStorage.setItem('codex_feed', JSON.stringify(all));
    } catch (_e) {}

    return newEvent;
  }

  async removeCampaignMember(memberId: string): Promise<boolean> {
    try {
      const saved = localStorage.getItem('codex_members');
      const all: CampaignMember[] = saved ? JSON.parse(saved) : [];
      const filtered = all.filter((m) => m.id !== memberId);
      localStorage.setItem('codex_members', JSON.stringify(filtered));
      return true;
    } catch (_e) {
      return false;
    }
  }

  async joinCampaignByCode(code: string, userId: string, characterName?: string): Promise<{ campaign: UserCampaign; member?: CampaignMember } | null> {
    try {
      const savedCamps = localStorage.getItem('codex_campaigns');
      const campaigns: UserCampaign[] = savedCamps ? JSON.parse(savedCamps) : [];
      const campaign = campaigns.find((c) => c.inviteCode === code.trim().toUpperCase());
      
      if (!campaign) return null;

      let member: CampaignMember | undefined;
      if (characterName) {
        member = {
          id: `mem-${Date.now()}`,
          userId,
          campaignId: campaign.id,
          characterName,
          role: 'player',
        };
        const savedMembers = localStorage.getItem('codex_members');
        const members: CampaignMember[] = savedMembers ? JSON.parse(savedMembers) : [];
        members.push(member);
        localStorage.setItem('codex_members', JSON.stringify(members));
      }

      return { campaign, member };
    } catch (_e) {
      return null;
    }
  }

  async updateCampaign(campaign: UserCampaign): Promise<UserCampaign> {
    try {
      const saved = localStorage.getItem('codex_campaigns');
      const all: UserCampaign[] = saved ? JSON.parse(saved) : [];
      const updated = all.map((c) => (c.id === campaign.id ? campaign : c));
      localStorage.setItem('codex_campaigns', JSON.stringify(updated));
    } catch (_e) {}
    return campaign;
  }

  async addCampaignMember(
    campaignId: string,
    characterName: string,
    role: 'dm' | 'player' = 'player',
    userId?: string
  ): Promise<CampaignMember> {
    const newMember: CampaignMember = {
      id: `mem-${Date.now()}`,
      campaignId,
      userId: userId || (role === 'player' ? `manual-player-${Date.now()}` : 'demo-dm-user-123'),
      characterName,
      role,
    };

    try {
      const saved = localStorage.getItem('codex_members');
      const all: CampaignMember[] = saved ? JSON.parse(saved) : [];
      const filtered = all.filter((m) => !(m.campaignId === campaignId && m.characterName === characterName));
      filtered.push(newMember);
      localStorage.setItem('codex_members', JSON.stringify(filtered));
    } catch (_e) {}

    return newMember;
  }

  async updateCampaignMemberModelUrl(
    campaignId: string,
    characterName: string,
    modelUrl: string,
    _userId?: string
  ): Promise<boolean> {
    try {
      const saved = localStorage.getItem('codex_members');
      const all: CampaignMember[] = saved ? JSON.parse(saved) : [];
      const updated = all.map((m) =>
        m.campaignId === campaignId && m.characterName?.toLowerCase() === characterName.toLowerCase()
          ? { ...m, modelUrl }
          : m
      );
      localStorage.setItem('codex_members', JSON.stringify(updated));
      return true;
    } catch (_e) {
      return false;
    }
  }

  async leaveCampaign(campaignId: string, _userId: string): Promise<boolean> {
    try {
      const savedCamps = localStorage.getItem('codex_campaigns');
      const camps: UserCampaign[] = savedCamps ? JSON.parse(savedCamps) : [];
      const updatedCamps = camps.filter((c) => c.id !== campaignId);
      localStorage.setItem('codex_campaigns', JSON.stringify(updatedCamps));
      return true;
    } catch (_e) {
      return false;
    }
  }

  async toggleFeedEventVisibility(id: string): Promise<boolean> {
    try {
      const saved = localStorage.getItem('codex_feed');
      const all: CampaignFeedEvent[] = saved ? JSON.parse(saved) : [];
      const updated = all.map((e) => (e.id === id ? { ...e, isPublic: !e.isPublic } : e));
      localStorage.setItem('codex_feed', JSON.stringify(updated));
      return true;
    } catch (_e) {
      return false;
    }
  }

  async deleteFeedEvent(id: string): Promise<boolean> {
    try {
      const saved = localStorage.getItem('codex_feed');
      const all: CampaignFeedEvent[] = saved ? JSON.parse(saved) : [];
      const filtered = all.filter((e) => e.id !== id);
      localStorage.setItem('codex_feed', JSON.stringify(filtered));
      return true;
    } catch (_e) {
      return false;
    }
  }
}

