import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { CustomMonster } from '@/lib/types';
import { toast } from 'sonner';

const LOCAL_STORAGE_KEY = 'masters_codex_custom_monsters_v1';

function getLocalMonsters(): CustomMonster[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Erro ao ler monstros customizados do localStorage:', e);
    return [];
  }
}

function saveLocalMonsters(monsters: CustomMonster[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(monsters));
  } catch (e) {
    console.error('Erro ao salvar monstros customizados no localStorage:', e);
  }
}

export const customMonsterService = {
  /**
   * Busca a lista de monstros customizados.
   */
  async fetchCustomMonsters(campaignId?: string): Promise<CustomMonster[]> {
    if (!isSupabaseConfigured()) {
      return getLocalMonsters();
    }

    try {
      let query = supabase.from('custom_monsters').select('*').order('created_at', { ascending: false });

      if (campaignId) {
        query = query.or(`campaign_id.eq.${campaignId},campaign_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Falha ao buscar custom_monsters do Supabase, usando localStorage:', error.message);
        return getLocalMonsters();
      }

      if (data && data.length > 0) {
        const mapped: CustomMonster[] = data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          campaignId: item.campaign_id,
          name: item.name,
          type: item.type || 'Monstro',
          size: item.size || 'Médio',
          alignment: item.alignment || 'Neutro',
          ac: item.ac || 10,
          hp: item.hp || 10,
          maxHp: item.hp || 10,
          speed: item.speed || '9m',
          cr: item.cr || '1',
          xp: item.xp || 200,
          str: item.str || 10,
          dex: item.dex || 10,
          con: item.con || 10,
          int: item.int || 10,
          wis: item.wis || 10,
          cha: item.cha || 10,
          tokenImageUrl: item.token_image_url,
          modelUrl: item.model_url,
          tokenType: item.token_type || (item.token_image_url ? 'billboard' : '3d'),
          description: item.description,
          lore: item.lore,
          abilities: item.abilities || [],
          actions: item.actions || [],
          spells: item.spells || [],
          createdAt: item.created_at,
        }));
        // Sincronizar cache local
        saveLocalMonsters(mapped);
        return mapped;
      }

      return getLocalMonsters();
    } catch (e: any) {
      console.warn('Erro ao carregar monstros customizados:', e);
      return getLocalMonsters();
    }
  },

  /**
   * Salva um monstro customizado no Supabase (e no localStorage).
   */
  async saveCustomMonster(monsterData: Omit<CustomMonster, 'id'> & { id?: string }): Promise<CustomMonster> {
    const newId = monsterData.id || `custom-mon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const fullMonster: CustomMonster = {
      ...monsterData,
      id: newId,
      maxHp: monsterData.maxHp || monsterData.hp,
      tokenType: monsterData.tokenType || (monsterData.tokenImageUrl ? 'billboard' : '3d'),
      createdAt: monsterData.createdAt || now,
    };

    // Sempre atualizar no localStorage primeiro para resposta instantânea na UI
    const locals = getLocalMonsters();
    const existingIndex = locals.findIndex((m) => m.id === newId);
    if (existingIndex >= 0) {
      locals[existingIndex] = fullMonster;
    } else {
      locals.unshift(fullMonster);
    }
    saveLocalMonsters(locals);

    if (isSupabaseConfigured()) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id || null;

        const payload = {
          id: fullMonster.id.includes('-') && !fullMonster.id.startsWith('custom-mon-') ? fullMonster.id : undefined,
          user_id: userId,
          campaign_id: fullMonster.campaignId || null,
          name: fullMonster.name,
          type: fullMonster.type,
          size: fullMonster.size,
          alignment: fullMonster.alignment,
          ac: fullMonster.ac,
          hp: fullMonster.hp,
          speed: fullMonster.speed,
          cr: fullMonster.cr,
          xp: fullMonster.xp,
          str: fullMonster.str,
          dex: fullMonster.dex,
          con: fullMonster.con,
          int: fullMonster.int,
          wis: fullMonster.wis,
          cha: fullMonster.cha,
          token_image_url: fullMonster.tokenImageUrl || null,
          model_url: fullMonster.modelUrl || null,
          token_type: fullMonster.tokenType,
          description: fullMonster.description || null,
          lore: fullMonster.lore || null,
          abilities: fullMonster.abilities || [],
          actions: fullMonster.actions || [],
          spells: fullMonster.spells || [],
        };

        const { data, error } = await supabase
          .from('custom_monsters')
          .upsert(payload)
          .select()
          .single();

        if (error) {
          console.warn('Aviso Supabase ao salvar monstro (salvo localmente):', error.message);
        } else if (data) {
          fullMonster.id = data.id;
          fullMonster.userId = data.user_id;
        }
      } catch (e) {
        console.warn('Erro ao enviar monstro customizado para o Supabase (mantido no localStorage):', e);
      }
    }

    toast.success(`Monstro "${fullMonster.name}" salvo com sucesso!`);
    return fullMonster;
  },

  /**
   * Deleta um monstro customizado pelo ID.
   */
  async deleteCustomMonster(id: string): Promise<void> {
    const locals = getLocalMonsters().filter((m) => m.id !== id);
    saveLocalMonsters(locals);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('custom_monsters').delete().eq('id', id);
        if (error) console.warn('Erro ao deletar do Supabase:', error.message);
      } catch (e) {
        console.warn('Erro ao deletar do Supabase:', e);
      }
    }

    toast.success('Monstro deletado com sucesso.');
  },
};
