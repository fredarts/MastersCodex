import { World, WorldEntity, EntityStatSheet } from '@/lib/types';

export interface IWorldRepository {
  fetchWorlds(userId?: string): Promise<World[]>;
  createWorld(title: string, genre?: string, description?: string, userId?: string): Promise<World>;
  updateWorld(world: World): Promise<void>;
  fetchWorldEntities(worldId: string): Promise<WorldEntity[]>;
  createWorldEntity(entity: Omit<WorldEntity, 'id'>): Promise<WorldEntity>;
  updateWorldEntity(entity: WorldEntity): Promise<void>;
  deleteWorldEntity(id: string): Promise<void>;
  fetchEntityStatSheet(entityId: string): Promise<EntityStatSheet | null>;
  saveEntityStatSheet(sheet: EntityStatSheet): Promise<void>;
  deleteEntityStatSheet(entityId: string): Promise<void>;
}
