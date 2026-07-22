import { World, WorldEntity } from '@/lib/types';

export interface IWorldRepository {
  fetchWorlds(userId?: string): Promise<World[]>;
  createWorld(title: string, genre?: string, description?: string, userId?: string): Promise<World>;
  updateWorld(world: World): Promise<void>;
  fetchWorldEntities(worldId: string): Promise<WorldEntity[]>;
  createWorldEntity(entity: Omit<WorldEntity, 'id'>): Promise<WorldEntity>;
  deleteWorldEntity(id: string): Promise<void>;
}
