'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameSession, GameScene } from '@/lib/types';
import { sessionService } from '@/lib/services/sessionService';
import { useCampaign } from '@/context/CampaignContext';

interface SessionContextType {
  sessions: GameSession[];
  setSessions: React.Dispatch<React.SetStateAction<GameSession[]>>;
  activeSession: GameSession | null;
  setActiveSession: (session: GameSession | null) => void;
  createSession: (title: string, notes?: string) => Promise<GameSession>;
  updateSession: (updatedSession: GameSession) => Promise<void>;
  scenes: GameScene[];
  setScenes: React.Dispatch<React.SetStateAction<GameScene[]>>;
  activeScene: GameScene | null;
  setActiveScene: (scene: GameScene | null) => void;
  createScene: (sceneData: Omit<GameScene, 'id'>) => Promise<GameScene>;
  updateScene: (updatedScene: GameScene) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSessionState] = useState<GameSession | null>(null);
  const [scenes, setScenes] = useState<GameScene[]>([]);
  const [activeScene, setActiveSceneState] = useState<GameScene | null>(null);

  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id || 'camp-demo-1';

  useEffect(() => {
    sessionService.fetchSessions(campaignId).then((fetchedSessions) => {
      if (fetchedSessions.length > 0) {
        setSessions(fetchedSessions);
        const savedSessionId = typeof window !== 'undefined' ? localStorage.getItem(`codex_activeSessionId_${campaignId}`) : null;
        const found = savedSessionId ? fetchedSessions.find((s) => s.id === savedSessionId) : null;
        const target = found || fetchedSessions[0];
        setActiveSessionState(target);

        sessionService.fetchScenes(target.id).then((fetchedScenes) => {
          if (fetchedScenes.length > 0) {
            setScenes(fetchedScenes);
            const savedSceneId = typeof window !== 'undefined' ? localStorage.getItem(`codex_activeSceneId_${target.id}`) : null;
            const foundScene = savedSceneId ? fetchedScenes.find((sc) => sc.id === savedSceneId) : null;
            setActiveSceneState(foundScene || fetchedScenes[0]);
          } else {
            setScenes([]);
            setActiveSceneState(null);
          }
        });
      } else {
        setSessions([]);
        setActiveSessionState(null);
        setScenes([]);
        setActiveSceneState(null);
      }
    });
  }, [campaignId]);

  const setActiveSession = (session: GameSession | null) => {
    setActiveSessionState(session);
    try {
      if (session) {
        localStorage.setItem(`codex_activeSessionId_${campaignId}`, session.id);
        sessionService.fetchScenes(session.id).then((fetchedScenes) => {
          setScenes(fetchedScenes);
          if (fetchedScenes.length > 0) setActiveSceneState(fetchedScenes[0]);
        });
      } else {
        localStorage.removeItem(`codex_activeSessionId_${campaignId}`);
      }
    } catch (e) {}
  };

  const setActiveScene = (scene: GameScene | null) => {
    setActiveSceneState(scene);
    try {
      if (scene) {
        localStorage.setItem(`codex_activeSceneId_${scene.sessionId}`, scene.id);
      } else {
        // Se deletado ou nulo, limpa do localStorage
        if (activeSession) {
          localStorage.removeItem(`codex_activeSceneId_${activeSession.id}`);
        }
      }
    } catch (e) {}
  };

  const createSession = async (title: string, notes = ''): Promise<GameSession> => {
    const newSession = await sessionService.createSession(title, activeSession?.campaignId || 'camp-demo-1', sessions.length + 1, notes);

    setSessions((prev) => {
      const updated = [...prev, newSession];
      try {
        localStorage.setItem('codex_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveSession(newSession);
    return newSession;
  };

  const updateSession = async (updatedSession: GameSession) => {
    await sessionService.updateSession(updatedSession);
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === updatedSession.id ? updatedSession : s));
      try {
        localStorage.setItem('codex_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (activeSession?.id === updatedSession.id) {
      setActiveSessionState(updatedSession);
    }
  };

  const createScene = async (sceneData: Omit<GameScene, 'id'>): Promise<GameScene> => {
    const payload = {
      ...sceneData,
      sessionId: sceneData.sessionId || activeSession?.id || 'sess-demo-1',
      orderIndex: scenes.length + 1,
    };
    const newScene = await sessionService.createScene(payload);

    setScenes((prev) => {
      const updated = [...prev, newScene];
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setActiveScene(newScene);
    return newScene;
  };

  const updateScene = async (updatedScene: GameScene) => {
    await sessionService.updateScene(updatedScene);
    setScenes((prev) => {
      const updated = prev.map((sc) => (sc.id === updatedScene.id ? updatedScene : sc));
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (activeScene?.id === updatedScene.id) {
      setActiveSceneState(updatedScene);
    }
  };

  const deleteScene = async (id: string) => {
    await sessionService.deleteScene(id);
    setScenes((prev) => {
      const updated = prev.filter((sc) => sc.id !== id);
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (activeScene?.id === id) {
      setActiveScene(null);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        setSessions,
        activeSession,
        setActiveSession,
        createSession,
        updateSession,
        scenes,
        setScenes,
        activeScene,
        setActiveScene,
        createScene,
        updateScene,
        deleteScene,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
