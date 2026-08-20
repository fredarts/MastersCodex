import { supabase } from '@/lib/supabase';
import { World, WorldEntity, EntityStatSheet } from '@/lib/types';
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
        full_content: entityData.fullContent,
        attributes: {
          ...entityData.attributes,
          tags: JSON.stringify(entityData.tags || []),
        },
        connections: entityData.connections || [],
        images: entityData.images || [],
        tags: entityData.tags || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return mapWorldEntityRowToDomain(data as WorldEntityRow);
  }

  async updateWorldEntity(entity: WorldEntity): Promise<void> {
    const { error } = await supabase
      .from('world_entities')
      .update({
        category: entity.category,
        name: entity.name,
        sub_type: entity.subType,
        status: entity.status,
        short_desc: entity.shortDesc,
        full_content: entity.fullContent,
        attributes: {
          ...entity.attributes,
          tags: JSON.stringify(entity.tags || []),
        },
        connections: entity.connections || [],
        images: entity.images || [],
        tags: entity.tags || [],
      })
      .eq('id', entity.id);

    if (error) throw error;
  }

  async deleteWorldEntity(id: string): Promise<void> {
    const { error } = await supabase.from('world_entities').delete().eq('id', id);
    if (error) throw error;
    // Database cascade constraint handles deleting stat sheet automatically, 
    // but doing it explicitly here or letting the DB cascade handles it.
  }

  async fetchEntityStatSheet(entityId: string): Promise<EntityStatSheet | null> {
    const { data, error } = await supabase
      .from('entity_stat_sheets')
      .select('*')
      .eq('entity_id', entityId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      entityId: data.entity_id,
      ac: data.ac,
      hp: data.hp,
      maxHp: data.max_hp,
      speed: data.speed,
      cr: data.cr,
      xp: data.xp,
      str: data.str,
      dex: data.dex,
      con: data.con,
      int: data.int,
      wis: data.wis,
      cha: data.cha,
      abilities: data.abilities || [],
      actions: data.actions || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async saveEntityStatSheet(sheet: EntityStatSheet): Promise<void> {
    const { error } = await supabase
      .from('entity_stat_sheets')
      .upsert({
        entity_id: sheet.entityId,
        ac: sheet.ac,
        hp: sheet.hp,
        max_hp: sheet.maxHp,
        speed: sheet.speed,
        cr: sheet.cr,
        xp: sheet.xp,
        str: sheet.str,
        dex: sheet.dex,
        con: sheet.con,
        int: sheet.int,
        wis: sheet.wis,
        cha: sheet.cha,
        abilities: sheet.abilities || [],
        actions: sheet.actions || [],
      }, { onConflict: 'entity_id' });

    if (error) throw error;
  }

  async deleteEntityStatSheet(entityId: string): Promise<void> {
    const { error } = await supabase
      .from('entity_stat_sheets')
      .delete()
      .eq('entity_id', entityId);

    if (error) throw error;
  }
}

