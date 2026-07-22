import { World, WorldEntity } from '@/lib/types';
import { IWorldRepository } from '../contracts/IWorldRepository';

export class LocalStorageWorldRepository implements IWorldRepository {
  async fetchWorlds(): Promise<World[]> {
    try {
      const saved = localStorage.getItem('codex_worlds');
      return saved ? JSON.parse(saved) : [];
    } catch (_e) {
      return [];
    }
  }

  async createWorld(title: string, genre = 'Fantasia Medieval', description = '', userId = 'demo-dm-user-123'): Promise<World> {
    const newWorld: World = {
      id: `world-${Date.now()}`,
      dmId: userId,
      title,
      genre,
      description,
    };
    const worlds = await this.fetchWorlds();
    worlds.push(newWorld);
    localStorage.setItem('codex_worlds', JSON.stringify(worlds));
    return newWorld;
  }

  async updateWorld(world: World): Promise<void> {
    const worlds = await this.fetchWorlds();
    const idx = worlds.findIndex((w) => w.id === world.id);
    if (idx !== -1) {
      worlds[idx] = world;
      localStorage.setItem('codex_worlds', JSON.stringify(worlds));
    }
  }

  async fetchWorldEntities(worldId: string): Promise<WorldEntity[]> {
    try {
      const saved = localStorage.getItem('codex_entities');
      const all: WorldEntity[] = saved ? JSON.parse(saved) : [];
      return all.filter((e) => e.worldId === worldId);
    } catch (_e) {
      return [];
    }
  }

  async createWorldEntity(entityData: Omit<WorldEntity, 'id'>): Promise<WorldEntity> {
    const newEntity: WorldEntity = {
      ...entityData,
      id: `ent-${Date.now()}`,
    };
    try {
      const saved = localStorage.getItem('codex_entities');
      const all: WorldEntity[] = saved ? JSON.parse(saved) : [];
      all.push(newEntity);
      localStorage.setItem('codex_entities', JSON.stringify(all));
    } catch (_e) {}
    return newEntity;
  }

  async deleteWorldEntity(id: string): Promise<void> {
    try {
      const saved = localStorage.getItem('codex_entities');
      const all: WorldEntity[] = saved ? JSON.parse(saved) : [];
      const filtered = all.filter((e) => e.id !== id);
      localStorage.setItem('codex_entities', JSON.stringify(filtered));
    } catch (_e) {}
  }
}
