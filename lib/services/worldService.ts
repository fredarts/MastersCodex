import { RepositoryFactory } from '@/lib/repositories/RepositoryFactory';
import { World, WorldEntity, EntityStatSheet, Result } from '@/lib/types';

export const worldService = {
  async fetchWorlds(userId?: string): Promise<Result<World[]>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      const data = await repo.fetchWorlds(userId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar mundos.'),
      };
    }
  },

  async createWorld(title: string, genre = 'Fantasia Medieval', description = '', userId?: string): Promise<Result<World>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      const data = await repo.createWorld(title, genre, description, userId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar mundo.'),
      };
    }
  },

  async updateWorld(updatedWorld: World): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(updatedWorld.dmId);
      await repo.updateWorld(updatedWorld);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao atualizar mundo.'),
      };
    }
  },

  async fetchWorldEntities(worldId: string, userId?: string): Promise<Result<WorldEntity[]>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      const data = await repo.fetchWorldEntities(worldId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao carregar entidades do mundo.'),
      };
    }
  },

  async createWorldEntity(entityData: Omit<WorldEntity, 'id'>, userId?: string): Promise<Result<WorldEntity>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      const data = await repo.createWorldEntity(entityData);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao criar entidade.'),
      };
    }
  },

  async updateWorldEntity(entity: WorldEntity, userId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      await repo.updateWorldEntity(entity);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao atualizar entidade.'),
      };
    }
  },

  async deleteWorldEntity(id: string, userId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      await repo.deleteWorldEntity(id);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao remover entidade.'),
      };
    }
  },

  async fetchEntityStatSheet(entityId: string, userId?: string): Promise<Result<EntityStatSheet | null>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      const data = await repo.fetchEntityStatSheet(entityId);
      return { ok: true, value: data };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao buscar ficha de combate.'),
      };
    }
  },

  async saveEntityStatSheet(sheet: EntityStatSheet, userId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      await repo.saveEntityStatSheet(sheet);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao salvar ficha de combate.'),
      };
    }
  },

  async deleteEntityStatSheet(entityId: string, userId?: string): Promise<Result<void>> {
    try {
      const repo = RepositoryFactory.getWorldRepository(userId);
      await repo.deleteEntityStatSheet(entityId);
      return { ok: true, value: undefined };
    } catch (e: any) {
      return {
        ok: false,
        error: e instanceof Error ? e : new Error(e?.message || 'Erro ao remover ficha de combate.'),
      };
    }
  },
};
