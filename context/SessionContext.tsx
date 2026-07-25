'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameSession, GameScene } from '@/lib/types';
import { sessionService } from '@/lib/services/sessionService';
import { useCampaign } from '@/context/CampaignContext';
import { toast } from 'sonner';

interface SessionContextType {
  sessions: GameSession[];
  setSessions: React.Dispatch<React.SetStateAction<GameSession[]>>;
  activeSession: GameSession | null;
  setActiveSession: (session: GameSession | null) => void;
  createSession: (title: string, notes?: string) => Promise<GameSession | null>;
  updateSession: (updatedSession: GameSession) => Promise<void>;
  scenes: GameScene[];
  setScenes: React.Dispatch<React.SetStateAction<GameScene[]>>;
  activeScene: GameScene | null;
  setActiveScene: (scene: GameScene | null) => void;
  createScene: (sceneData: Omit<GameScene, 'id'>) => Promise<GameScene | null>;
  updateScene: (updatedScene: GameScene) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  fetchSceneMap: (sceneId: string) => Promise<any | null>;
  saveSceneMap: (sceneId: string, gridData: any) => Promise<void>;
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
    sessionService.fetchSessions(campaignId).then((res) => {
      if (res.ok) {
        const fetchedSessions = res.value;
        if (fetchedSessions.length > 0) {
          setSessions(fetchedSessions);
          const savedSessionId = typeof window !== 'undefined' ? localStorage.getItem(`codex_activeSessionId_${campaignId}`) : null;
          const found = savedSessionId ? fetchedSessions.find((s) => s.id === savedSessionId) : null;
          const target = found || fetchedSessions[0];
          setActiveSessionState(target);

          sessionService.fetchScenes(target.id, campaignId).then((scenesRes) => {
            if (scenesRes.ok) {
              const fetchedScenes = scenesRes.value;
              if (fetchedScenes.length > 0) {
                setScenes(fetchedScenes);
                const savedSceneId = typeof window !== 'undefined' ? localStorage.getItem(`codex_activeSceneId_${target.id}`) : null;
                const foundScene = savedSceneId ? fetchedScenes.find((sc) => sc.id === savedSceneId) : null;
                setActiveSceneState(foundScene || fetchedScenes[0]);
              } else {
                setScenes([]);
                setActiveSceneState(null);
              }
            } else {
              toast.error(scenesRes.error.message);
            }
          });
        } else {
          setSessions([]);
          setActiveSessionState(null);
          setScenes([]);
          setActiveSceneState(null);
        }
      } else {
        toast.error(res.error.message);
      }
    });
  }, [campaignId]);

  const setActiveSession = (session: GameSession | null) => {
    setActiveSessionState(session);
    try {
      if (session) {
        localStorage.setItem(`codex_activeSessionId_${campaignId}`, session.id);
        sessionService.fetchScenes(session.id, campaignId).then((scenesRes) => {
          if (scenesRes.ok) {
            setScenes(scenesRes.value);
            if (scenesRes.value.length > 0) setActiveSceneState(scenesRes.value[0]);
          } else {
            toast.error(scenesRes.error.message);
          }
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
        if (activeSession) {
          localStorage.removeItem(`codex_activeSceneId_${activeSession.id}`);
        }
      }
    } catch (e) {}
  };

  const createSession = async (title: string, notes = ''): Promise<GameSession | null> => {
    const res = await sessionService.createSession(title, activeCampaign?.id || 'camp-demo-1', sessions.length + 1, notes);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    const newSession = res.value;
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
    const res = await sessionService.updateSession(updatedSession, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
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

  const createScene = async (sceneData: Omit<GameScene, 'id'>): Promise<GameScene | null> => {
    const payload = {
      ...sceneData,
      sessionId: sceneData.sessionId || activeSession?.id || 'sess-demo-1',
      orderIndex: scenes.length + 1,
    };
    const res = await sessionService.createScene(payload, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    const newScene = res.value;
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
    const res = await sessionService.updateScene(updatedScene, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
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
    const res = await sessionService.deleteScene(id, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
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

  const fetchSceneMap = async (sceneId: string): Promise<any | null> => {
    const res = await sessionService.fetchSceneMap(sceneId, campaignId);
    if (res.ok) {
      return res.value;
    } else {
      toast.error(res.error.message);
      return null;
    }
  };

  const saveSceneMap = async (sceneId: string, gridData: any): Promise<void> => {
    const res = await sessionService.saveSceneMap(sceneId, gridData, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
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
        fetchSceneMap,
        saveSceneMap,
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
