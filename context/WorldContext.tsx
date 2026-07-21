'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { World, WorldEntity } from '@/lib/types';

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
    try {
      const savedWorlds = localStorage.getItem('codex_worlds');
      const savedEntities = localStorage.getItem('codex_entities');
      const savedActiveWorldId = localStorage.getItem('codex_activeWorldId');

      if (savedWorlds) {
        const parsed: World[] = JSON.parse(savedWorlds);
        setUserWorlds(parsed);
        if (savedActiveWorldId) {
          const found = parsed.find((w) => w.id === savedActiveWorldId);
          if (found) setActiveWorldState(found);
        } else if (parsed.length > 0) {
          setActiveWorldState(parsed[0]);
        }
      }

      if (savedEntities) {
        setWorldEntities(JSON.parse(savedEntities));
      }
    } catch (e) {
      console.error('Error loading WorldContext from localStorage:', e);
    }
  }, []);

  const setActiveWorld = (world: World | null) => {
    setActiveWorldState(world);
    try {
      if (world) {
        localStorage.setItem('codex_activeWorldId', world.id);
      } else {
        localStorage.removeItem('codex_activeWorldId');
      }
    } catch (e) {}

    if (isSupabaseConfigured() && currentUserId) {
      const isValidUUID = (str?: string) =>
        str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const validWorldId = world?.id && isValidUUID(world.id) ? world.id : null;
      supabase
        .from('profiles')
        .update({ active_world_id: validWorldId })
        .eq('id', currentUserId)
        .then(({ error }) => {
          if (error) console.warn('Aviso ao persistir active_world_id no Supabase:', error.message);
        });
    }
  };

  const createWorld = async (title: string, genre = 'Fantasia Medieval', description = ''): Promise<World> => {
    const newWorld: World = {
      id: `world-${Date.now()}`,
      dmId: currentUserId || 'demo-dm-user-123',
      title,
      genre,
      description,
    };

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
    const newEntity: WorldEntity = {
      ...entityData,
      id: `ent-${Date.now()}`,
      worldId: entityData.worldId || activeWorld?.id || 'world-demo-1',
    };

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
