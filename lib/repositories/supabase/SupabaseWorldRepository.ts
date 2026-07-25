import { supabase } from '@/lib/supabase';
import { World, WorldEntity } from '@/lib/types';
import { WorldRow, WorldEntityRow } from '@/lib/database.types';
import { mapWorldRowToDomain, mapWorldEntityRowToDomain } from '@/lib/mappers';
import { IWorldRepository } from '../contracts/IWorldRepository';

export class SupabaseWorldRepository implements IWorldRepository {
  async fetchWorlds(userId?: string): Promise<World[]> {
    if (!userId) return [];
    const { data, error } = await supabase.from('worlds').select('*').eq('dm_id', userId);
    if (error) {
      throw error;
    }
    return (data as WorldRow[]).map(mapWorldRowToDomain);
  }

  async createWorld(title: string, genre = 'Fantasia Medieval', description = '', userId?: string): Promise<World> {
    const { data, error } = await supabase
      .from('worlds')
      .insert({ dm_id: userId, title, genre, description })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return mapWorldRowToDomain(data as WorldRow);
  }

  async updateWorld(world: World): Promise<void> {
    const { error } = await supabase
      .from('worlds')
      .update({ title: world.title, genre: world.genre, description: world.description })
      .eq('id', world.id);

    if (error) throw error;
  }

  async fetchWorldEntities(worldId: string): Promise<WorldEntity[]> {
    const { data, error } = await supabase.from('world_entities').select('*').eq('world_id', worldId);
    if (error) {
      throw error;
    }
    return (data as WorldEntityRow[]).map(mapWorldEntityRowToDomain);
  }

  async createWorldEntity(entityData: Omit<WorldEntity, 'id'>): Promise<WorldEntity> {
    const { data, error } = await supabase
      .from('world_entities')
      .insert({
        world_id: entityData.worldId,
        category: entityData.category,
        name: entityData.name,
        sub_type: entityData.subType,
        status: entityData.status,
        short_desc: entityData.shortDesc,
        full_desc: entityData.fullContent,
        attributes: entityData.attributes,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return mapWorldEntityRowToDomain(data as WorldEntityRow);
  }

  async deleteWorldEntity(id: string): Promise<void> {
    const { error } = await supabase.from('world_entities').delete().eq('id', id);
    if (error) throw error;
  }
}

