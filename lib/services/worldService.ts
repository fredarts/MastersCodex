import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { World, WorldEntity } from '@/lib/types';
import { WorldRow, WorldEntityRow } from '@/lib/database.types';
import { mapWorldRowToDomain, mapWorldEntityRowToDomain } from '@/lib/mappers';
import { toast } from 'sonner';

export const worldService = {
  async fetchWorlds(userId?: string): Promise<World[]> {
    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      const { data, error } = await supabase.from('worlds').select('*').eq('dm_id', userId);
      if (error) {
        toast.error(`Erro ao carregar mundos: ${error.message}`);
      } else if (data) {
        return (data as WorldRow[]).map(mapWorldRowToDomain);
      }
    }
    try {
      const saved = localStorage.getItem('codex_worlds');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao ler mundos salvos localmente.');
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

    if (isSupabaseConfigured() && userId && isValidUuid(userId)) {
      const { data, error } = await supabase.from('worlds').insert({
        dm_id: userId,
        title,
        genre,
        description,
      }).select().single();

      if (error) {
        toast.error(`Erro ao criar mundo no banco de dados: ${error.message}`);
      } else if (data) {
        return mapWorldRowToDomain(data as WorldRow);
      }
    }

    return newWorld;
  },

  async updateWorld(updatedWorld: World): Promise<void> {
    if (isSupabaseConfigured() && isValidUuid(updatedWorld.id)) {
      const { error } = await supabase.from('worlds').update({
        title: updatedWorld.title,
        genre: updatedWorld.genre,
        description: updatedWorld.description,
      }).eq('id', updatedWorld.id);

      if (error) {
        toast.error(`Erro ao atualizar mundo: ${error.message}`);
      }
    }
  },

  async fetchWorldEntities(worldId: string): Promise<WorldEntity[]> {
    if (isSupabaseConfigured() && isValidUuid(worldId)) {
      const { data, error } = await supabase.from('world_entities').select('*').eq('world_id', worldId);
      if (error) {
        toast.error(`Erro ao carregar entidades do mundo: ${error.message}`);
      } else if (data) {
        return (data as WorldEntityRow[]).map(mapWorldEntityRowToDomain);
      }
    }
    try {
      const saved = localStorage.getItem('codex_entities');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao ler entidades locais.');
      return [];
    }
  },

  async createWorldEntity(entityData: Omit<WorldEntity, 'id'>): Promise<WorldEntity> {
    const newEntity: WorldEntity = {
      ...entityData,
      id: `ent-${Date.now()}`,
    };

    if (isSupabaseConfigured() && isValidUuid(entityData.worldId)) {
      const { data, error } = await supabase.from('world_entities').insert({
        world_id: entityData.worldId,
        category: entityData.category,
        name: entityData.name,
        sub_type: entityData.subType,
        status: entityData.status,
        short_desc: entityData.shortDesc,
        full_desc: entityData.fullContent,
        attributes: entityData.attributes,
      }).select().single();

      if (error) {
        toast.error(`Erro ao criar entidade: ${error.message}`);
      } else if (data) {
        return mapWorldEntityRowToDomain(data as WorldEntityRow);
      }
    }

    return newEntity;
  },

  async deleteWorldEntity(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUuid(id)) {
      const { error } = await supabase.from('world_entities').delete().eq('id', id);
      if (error) {
        toast.error(`Erro ao remover entidade: ${error.message}`);
      }
    }
  },
};
