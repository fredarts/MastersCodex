import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';

export interface ICampaignRepository {
  fetchUserCampaigns(userId?: string): Promise<UserCampaign[]>;
  createCampaign(title: string, worldId?: string, description?: string, userId?: string, coverImageUrl?: string, themeTone?: string): Promise<UserCampaign>;
  updateCampaign(campaign: UserCampaign): Promise<UserCampaign>;
  fetchCampaignMembers(campaignId: string): Promise<CampaignMember[]>;
  addCampaignMember(campaignId: string, characterName: string, role?: 'dm' | 'player', userId?: string): Promise<CampaignMember>;
  updateCampaignMemberModelUrl(campaignId: string, characterName: string, modelUrl: string, userId?: string): Promise<boolean>;
  removeCampaignMember(memberId: string): Promise<boolean>;
  leaveCampaign(campaignId: string, userId: string): Promise<boolean>;
  joinCampaignByCode(code: string, userId: string, characterName?: string): Promise<{ campaign: UserCampaign; member?: CampaignMember } | null>;
  fetchFeedEvents(campaignId: string): Promise<CampaignFeedEvent[]>;
  createFeedEvent(event: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent>;
  toggleFeedEventVisibility(id: string): Promise<boolean>;
  deleteFeedEvent(id: string): Promise<boolean>;
}

