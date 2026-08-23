import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import {
  PartyLootSession,
  PartyLootItem,
  CharacterCurrency,
  LootDistributionMode,
  Result,
} from '@/lib/types';

const LOCAL_STORAGE_KEY_PREFIX = 'codex_party_loot_';

export const partyLootService = {
  /**
   * Busca a sessão de loot ativa para a campanha dada.
   */
  async fetchActiveLootSession(campaignId: string): Promise<Result<PartyLootSession | null>> {
    try {
      if (isSupabaseConfigured() && isValidUuid(campaignId)) {
        const { data, error } = await supabase
          .from('party_loot_sessions')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Erro ao buscar party loot no Supabase, caindo no fallback local:', error.message);
        } else if (data) {
          const session: PartyLootSession = {
            id: data.id,
            campaignId: data.campaign_id,
            title: data.title,
            description: data.description,
            distributionMode: data.distribution_mode as LootDistributionMode,
            leaderId: data.leader_id,
            leaderCharacterName: data.leader_character_name,
            currency: data.currency || { po: 0, pl: 0, pp: 0, pc: 0, pe: 0 },
            items: data.items || [],
            status: data.status,
            createdByName: data.created_by_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          return { ok: true, value: session };
        }
      }

      // Fallback para LocalStorage
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${campaignId}`);
        if (raw) {
          const parsed: PartyLootSession = JSON.parse(raw);
          if (parsed.status === 'active') {
            return { ok: true, value: parsed };
          }
        }
      }

      return { ok: true, value: null };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar loot ativo.'),
      };
    }
  },

  /**
   * Cria uma nova sessão de loot enviada pelo Mestre (ou enviada pela Party).
   */
  async createLootSession(params: {
    campaignId: string;
    title: string;
    description?: string;
    distributionMode: LootDistributionMode;
    leaderId?: string;
    leaderCharacterName?: string;
    currency: CharacterCurrency;
    items: Omit<PartyLootItem, 'claimedBy'>[];
    createdByName?: string;
  }): Promise<Result<PartyLootSession>> {
    try {
      // 1. Se já houver uma sessão ativa na campanha, acumular moedas e anexar itens sem descartar
      const existingRes = await this.fetchActiveLootSession(params.campaignId);
      if (existingRes.ok && existingRes.value && existingRes.value.status === 'active') {
        const existing = existingRes.value;
        const mergedCurrency: CharacterCurrency = {
          po: (existing.currency.po || 0) + (params.currency.po || 0),
          pp: (existing.currency.pp || 0) + (params.currency.pp || 0),
          pe: (existing.currency.pe || 0) + (params.currency.pe || 0),
          pc: (existing.currency.pc || 0) + (params.currency.pc || 0),
          pl: (existing.currency.pl || 0) + (params.currency.pl || 0),
        };

        const newItems: PartyLootItem[] = params.items.map((item) => ({
          ...item,
          id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
          claimedBy: null,
        }));

        const updatedSession: PartyLootSession = {
          ...existing,
          title: existing.title || params.title,
          description: existing.description || params.description || '',
          currency: mergedCurrency,
          items: [...existing.items, ...newItems],
          updatedAt: new Date().toISOString(),
        };

        return await this.updateLootSession(updatedSession);
      }

      const newSession: PartyLootSession = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `loot_${Date.now()}`,
        campaignId: params.campaignId,
        title: params.title,
        description: params.description || '',
        distributionMode: params.distributionMode,
        leaderId: params.leaderId || '',
        leaderCharacterName: params.leaderCharacterName || '',
        currency: params.currency || { po: 0, pl: 0, pp: 0, pc: 0, pe: 0 },
        items: params.items.map((item) => ({
          ...item,
          id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
          claimedBy: null,
        })),
        status: 'active',
        createdByName: params.createdByName || 'Mestre',
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured() && isValidUuid(newSession.campaignId)) {
        const { data, error } = await supabase
          .from('party_loot_sessions')
          .insert({
            id: newSession.id,
            campaign_id: newSession.campaignId,
            title: newSession.title,
            description: newSession.description,
            distribution_mode: newSession.distributionMode,
            leader_id: newSession.leaderId,
            leader_character_name: newSession.leaderCharacterName,
            currency: newSession.currency,
            items: newSession.items,
            status: newSession.status,
            created_by_name: newSession.createdByName,
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao salvar loot no Supabase:', error.message);
          return {
            ok: false,
            error: new Error(`Falha no banco de dados: ${error.message}`),
          };
        }
      }

      // Salvar fallback local
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${params.campaignId}`, JSON.stringify(newSession));
      }

      return { ok: true, value: newSession };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar sessão de loot.'),
      };
    }
  },

  /**
   * Salva alterações em uma sessão de loot existente.
   */
  async updateLootSession(session: PartyLootSession): Promise<Result<PartyLootSession>> {
    try {
      // Checar se deve autodestruir/encerrar a sessão
      const allItemsClaimed = session.items.length === 0 || session.items.every((i) => i.claimedBy !== null);
      const isCurrencyZero =
        (session.currency.po || 0) <= 0 &&
        (session.currency.pl || 0) <= 0 &&
        (session.currency.pp || 0) <= 0 &&
        (session.currency.pc || 0) <= 0 &&
        (session.currency.pe || 0) <= 0;

      if (allItemsClaimed && isCurrencyZero) {
        session.status = 'completed';
      }

      session.updatedAt = new Date().toISOString();

      if (isSupabaseConfigured() && isValidUuid(session.id)) {
        const { error } = await supabase
          .from('party_loot_sessions')
          .update({
            currency: session.currency,
            items: session.items,
            status: session.status,
            updated_at: session.updatedAt,
          })
          .eq('id', session.id);

        if (error) {
          console.error('Erro ao atualizar sessão de loot no Supabase:', error.message);
          return {
            ok: false,
            error: new Error(`Falha no banco de dados: ${error.message}`),
          };
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${session.campaignId}`, JSON.stringify(session));
      }

      return { ok: true, value: session };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao atualizar sessão de loot.'),
      };
    }
  },

  /**
   * Trata a divisão igualitária de moedas entre uma lista de nomes de personagens ativos.
   */
  splitCurrencyEqually(
    totalCurrency: CharacterCurrency,
    playerCount: number
  ): { share: CharacterCurrency; remainder: CharacterCurrency } {
    if (playerCount <= 0) {
      return {
        share: { po: 0, pl: 0, pp: 0, pc: 0, pe: 0 },
        remainder: { ...totalCurrency },
      };
    }

    const share: CharacterCurrency = {
      po: Math.floor((totalCurrency.po || 0) / playerCount),
      pl: Math.floor((totalCurrency.pl || 0) / playerCount),
      pp: Math.floor((totalCurrency.pp || 0) / playerCount),
      pc: Math.floor((totalCurrency.pc || 0) / playerCount),
      pe: Math.floor((totalCurrency.pe || 0) / playerCount),
    };

    const remainder: CharacterCurrency = {
      po: (totalCurrency.po || 0) % playerCount,
      pl: (totalCurrency.pl || 0) % playerCount,
      pp: (totalCurrency.pp || 0) % playerCount,
      pc: (totalCurrency.pc || 0) % playerCount,
      pe: (totalCurrency.pe || 0) % playerCount,
    };

    return { share, remainder };
  },
};
