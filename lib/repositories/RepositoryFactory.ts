import { isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { IWorldRepository } from './contracts/IWorldRepository';
import { ISessionRepository } from './contracts/ISessionRepository';
import { ICampaignRepository } from './contracts/ICampaignRepository';

import { SupabaseWorldRepository } from './supabase/SupabaseWorldRepository';
import { LocalStorageWorldRepository } from './offline/LocalStorageWorldRepository';

export class RepositoryFactory {
  private static worldSupabase = new SupabaseWorldRepository();
  private static worldOffline = new LocalStorageWorldRepository();

  /**
   * Retorna o repositório de mundos adequado (Supabase se conectado e id válido, senão LocalStorage).
   */
  static getWorldRepository(userId?: string): IWorldRepository {
    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      return this.worldSupabase;
    }
    return this.worldOffline;
  }
}
