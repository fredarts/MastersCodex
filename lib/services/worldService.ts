import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { World, WorldEntity } from '@/lib/types';

export const worldService = {
  async fetchWorlds(userId?: string): Promise<World[]> {
    if (isSupabaseConfigured() && userId) {
      const { data, error } = await supabase.from('worlds').select('*').eq('dm_id', userId);
      if (!error && data) {
        return data.map((w: Record<string, unknown>) => ({
          id: w.id as string,
          dmId: w.dm_id as string,
          title: w.title as string,
          genre: w.genre as string,
          description: w.description as string,
        }));
      }
    }
    try {
      const saved = localStorage.getItem('codex_worlds');
      return saved ? JSON.parse(saved) : [];
    } catch (_e) {
      return [];
    }
  },

  async createWorld(title: string, genre = 'Fantasia Medieval', description = '', userId?: string): Promise<World> {
    const newWorld: World = {
      id: `world-${Date.now()}`,
      dmId: userId || 'demo-dm-user-123',
      title,
      genre,
      description,
    };

    if (isSupabaseConfigured() && userId) {
      const { data } = await supabase.from('worlds').insert({
        dm_id: userId,
        title,
        genre,
        description,
      }).select().single();

      if (data) {
        newWorld.id = data.id;
      }
    }

    return newWorld;
  },

  async updateWorld(updatedWorld: World): Promise<void> {
    if (isSupabaseConfigured() && updatedWorld.id && !updatedWorld.id.startsWith('world-')) {
      await supabase.from('worlds').update({
        title: updatedWorld.title,
        genre: updatedWorld.genre,
        description: updatedWorld.description,
      }).eq('id', updatedWorld.id);
    }
  },

  async fetchWorldEntities(worldId: string): Promise<WorldEntity[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('world_entities').select('*').eq('world_id', worldId);
      if (!error && data) {
        return data.map((e: any) => ({
          id: e.id,
          worldId: e.world_id,
          category: e.category,
          name: e.name,
          subType: e.sub_type,
          status: e.status,
          shortDesc: e.short_desc,
          fullContent: e.full_desc || e.full_content,
          attributes: e.attributes,
        }));
      }
    }
    try {
      const saved = localStorage.getItem('codex_entities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async createWorldEntity(entityData: Omit<WorldEntity, 'id'>): Promise<WorldEntity> {
    const newEntity: WorldEntity = {
      ...entityData,
      id: `ent-${Date.now()}`,
    };

    if (isSupabaseConfigured() && entityData.worldId && !entityData.worldId.startsWith('world-')) {
      const { data } = await supabase.from('world_entities').insert({
        world_id: entityData.worldId,
        category: entityData.category,
        name: entityData.name,
        sub_type: entityData.subType,
        status: entityData.status,
        short_desc: entityData.shortDesc,
        full_desc: entityData.fullContent,
        attributes: entityData.attributes,
      }).select().single();

      if (data) newEntity.id = data.id;
    }

    return newEntity;
  },

  async deleteWorldEntity(id: string): Promise<void> {
    if (isSupabaseConfigured() && !id.startsWith('ent-')) {
      await supabase.from('world_entities').delete().eq('id', id);
    }
  },
};
