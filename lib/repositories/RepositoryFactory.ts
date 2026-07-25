import { isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { IWorldRepository } from './contracts/IWorldRepository';
import { ISessionRepository } from './contracts/ISessionRepository';
import { ICampaignRepository } from './contracts/ICampaignRepository';

import { SupabaseWorldRepository } from './supabase/SupabaseWorldRepository';
import { LocalStorageWorldRepository } from './offline/LocalStorageWorldRepository';
import { SupabaseCampaignRepository } from './supabase/SupabaseCampaignRepository';
import { LocalStorageCampaignRepository } from './offline/LocalStorageCampaignRepository';
import { SupabaseSessionRepository } from './supabase/SupabaseSessionRepository';
import { LocalStorageSessionRepository } from './offline/LocalStorageSessionRepository';

export class RepositoryFactory {
  private static worldSupabase = new SupabaseWorldRepository();
  private static worldOffline = new LocalStorageWorldRepository();

  private static campaignSupabase = new SupabaseCampaignRepository();
  private static campaignOffline = new LocalStorageCampaignRepository();

  private static sessionSupabase = new SupabaseSessionRepository();
  private static sessionOffline = new LocalStorageSessionRepository();

  /**
   * Retorna o repositório de mundos adequado (Supabase se conectado e id válido, senão LocalStorage).
   */
  static getWorldRepository(userId?: string): IWorldRepository {
    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      return this.worldSupabase;
    }
    return this.worldOffline;
  }

  /**
   * Retorna o repositório de campanhas adequado (Supabase se conectado e id válido, senão LocalStorage).
   */
  static getCampaignRepository(userId?: string): ICampaignRepository {
    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      return this.campaignSupabase;
    }
    return this.campaignOffline;
  }

  /**
   * Retorna o repositório de sessões adequado (Supabase se conectado e id válido, senão LocalStorage).
   */
  static getSessionRepository(campaignIdOrUserId?: string): ISessionRepository {
    // If supabase is configured and we have a valid uuid, use supabase
    if (isSupabaseConfigured() && campaignIdOrUserId && isValidUuid(campaignIdOrUserId)) {
      return this.sessionSupabase;
    }
    return this.sessionOffline;
  }
}
