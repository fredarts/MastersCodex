'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { World, WorldEntity } from '@/lib/types';
import { worldService } from '@/lib/services/worldService';

interface WorldContextType {
  userWorlds: World[];
  setUserWorlds: React.Dispatch<React.SetStateAction<World[]>>;
  activeWorld: World | null;
  setActiveWorld: (world: World | null) => void;
  createWorld: (title: string, genre?: string, description?: string) => Promise<World>;
  updateWorld: (updatedWorld: World) => Promise<void>;
  worldEntities: WorldEntity[];
  setWorldEntities: React.Dispatch<React.SetStateAction<WorldEntity[]>>;
  createWorldEntity: (entity: Omit<WorldEntity, 'id'>) => Promise<WorldEntity>;
  deleteWorldEntity: (id: string) => Promise<void>;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

export const WorldProvider: React.FC<{ children: React.ReactNode; currentUserId?: string }> = ({
  children,
  currentUserId,
}) => {
  const [userWorlds, setUserWorlds] = useState<World[]>([]);
  const [activeWorld, setActiveWorldState] = useState<World | null>(null);
  const [worldEntities, setWorldEntities] = useState<WorldEntity[]>([]);

  useEffect(() => {
    worldService.fetchWorlds(currentUserId).then((worlds) => {
      if (worlds.length > 0) {
        setUserWorlds(worlds);
        const savedActiveWorldId = typeof window !== 'undefined' ? localStorage.getItem('codex_activeWorldId') : null;
        const found = savedActiveWorldId ? worlds.find((w) => w.id === savedActiveWorldId) : null;
        setActiveWorldState(found || worlds[0]);

        worldService.fetchWorldEntities((found || worlds[0]).id).then(setWorldEntities);
      }
    });
  }, [currentUserId]);

  const setActiveWorld = (world: World | null) => {
    setActiveWorldState(world);
    try {
      if (world) {
        localStorage.setItem('codex_activeWorldId', world.id);
        worldService.fetchWorldEntities(world.id).then(setWorldEntities);
      } else {
        localStorage.removeItem('codex_activeWorldId');
      }
    } catch (e) {}
  };

  const createWorld = async (title: string, genre = 'Fantasia Medieval', description = ''): Promise<World> => {
    const newWorld = await worldService.createWorld(title, genre, description, currentUserId);
    setUserWorlds((prev) => {
      const updated = [...prev, newWorld];
      try {
        localStorage.setItem('codex_worlds', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveWorld(newWorld);
    return newWorld;
  };

  const updateWorld = async (updatedWorld: World) => {
    await worldService.updateWorld(updatedWorld);
    setUserWorlds((prev) => {
      const updated = prev.map((w) => (w.id === updatedWorld.id ? updatedWorld : w));
      try {
        localStorage.setItem('codex_worlds', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (activeWorld?.id === updatedWorld.id) {
      setActiveWorldState(updatedWorld);
    }
  };

  const createWorldEntity = async (entityData: Omit<WorldEntity, 'id'>): Promise<WorldEntity> => {
    const payload = {
      ...entityData,
      worldId: entityData.worldId || activeWorld?.id || 'world-demo-1',
    };
    const newEntity = await worldService.createWorldEntity(payload);
    setWorldEntities((prev) => {
      const updated = [...prev, newEntity];
      try {
        localStorage.setItem('codex_entities', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    return newEntity;
  };

  const deleteWorldEntity = async (id: string) => {
    await worldService.deleteWorldEntity(id);
    setWorldEntities((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem('codex_entities', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <WorldContext.Provider
      value={{
        userWorlds,
        setUserWorlds,
        activeWorld,
        setActiveWorld,
        createWorld,
        updateWorld,
        worldEntities,
        setWorldEntities,
        createWorldEntity,
        deleteWorldEntity,
      }}
    >
      {children}
    </WorldContext.Provider>
  );
};

export const useWorld = () => {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};
