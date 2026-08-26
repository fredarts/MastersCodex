import { PushSubscriptionData } from './pushTypes';

// In-memory fallback map for subscriptions in local dev/demo mode
const globalSubscriptions = new Map<string, PushSubscriptionData>();

export const memorySubscriptions = {
  get(endpoint: string): PushSubscriptionData | undefined {
    return globalSubscriptions.get(endpoint);
  },
  set(endpoint: string, data: PushSubscriptionData) {
    globalSubscriptions.set(endpoint, data);
  },
  delete(endpoint: string) {
    globalSubscriptions.delete(endpoint);
  },
  getAll(): PushSubscriptionData[] {
    return Array.from(globalSubscriptions.values());
  },
  findByUserOrCampaign(targetUserId?: string, campaignId?: string): PushSubscriptionData[] {
    const all = Array.from(globalSubscriptions.values());
    if (targetUserId && campaignId) {
      return all.filter((s) => s.userId === targetUserId || s.campaignId === campaignId);
    }
    if (targetUserId) {
      return all.filter((s) => s.userId === targetUserId);
    }
    if (campaignId) {
      return all.filter((s) => s.campaignId === campaignId);
    }
    return all;
  },
};
