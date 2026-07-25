import { UserCampaign, CampaignMember, CampaignFeedEvent } from '@/lib/types';

export interface ICampaignRepository {
  fetchUserCampaigns(userId?: string): Promise<UserCampaign[]>;
  createCampaign(title: string, worldId?: string, description?: string, userId?: string): Promise<UserCampaign>;
  fetchCampaignMembers(campaignId: string): Promise<CampaignMember[]>;
  fetchFeedEvents(campaignId: string): Promise<CampaignFeedEvent[]>;
  createFeedEvent(event: Omit<CampaignFeedEvent, 'id'>): Promise<CampaignFeedEvent>;
  removeCampaignMember(memberId: string): Promise<boolean>;
  joinCampaignByCode(code: string, userId: string, characterName?: string): Promise<{ campaign: UserCampaign; member?: CampaignMember } | null>;
}
