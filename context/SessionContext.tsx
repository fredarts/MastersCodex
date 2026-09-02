'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { GameSession, GameScene, CampaignMap } from '@/lib/types';
import { sessionService } from '@/lib/services/sessionService';
import { useCampaign } from '@/context/CampaignContext';
import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
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
  campaignMaps: CampaignMap[];
  fetchCampaignMaps: () => Promise<CampaignMap[]>;
  createCampaignMap: (title: string, gridData: any) => Promise<CampaignMap | null>;
  updateCampaignMap: (mapId: string, title: string, gridData: any) => Promise<void>;
  deleteCampaignMap: (mapId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSessionState] = useState<GameSession | null>(null);
  const [scenes, setScenes] = useState<GameScene[]>([]);
  const [activeScene, setActiveSceneState] = useState<GameScene | null>(null);
  const [campaignMaps, setCampaignMaps] = useState<CampaignMap[]>([]);
  const activeSceneIdRef = useRef<string | null>(null);

  // Keep ref in sync for stable callback closures
  useEffect(() => {
    activeSceneIdRef.current = activeScene?.id ?? null;
  }, [activeScene?.id]);

  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id;

  useEffect(() => {
    if (!campaignId) {
      setSessions([]);
      setActiveSessionState(null);
      setScenes([]);
      setActiveSceneState(null);
      return;
    }

    let isMounted = true;

    const loadCampaignAndScenes = async () => {
      // 1. Fetch fresh active_scene_id directly from campaigns table in Supabase
      let activeSceneIdFromDb: string | undefined = activeCampaign?.activeSceneId;
      if (isSupabaseConfigured() && isValidUuid(campaignId)) {
        try {
          const { data: campRow } = await supabase
            .from('campaigns')
            .select('active_scene_id')
            .eq('id', campaignId)
            .maybeSingle();
          if (campRow?.active_scene_id) {
            activeSceneIdFromDb = campRow.active_scene_id;
          }
        } catch (e) {
          console.warn('[SessionContext] Error querying active_scene_id from db:', e);
        }
      }

      const dmActiveSceneId = activeSceneIdFromDb;
      const isPlayer = activeCampaign?.role === 'player';

      const res = await sessionService.fetchSessions(campaignId);
      if (!isMounted) return;

      if (res.ok) {
        const fetchedSessions = res.value;
        if (fetchedSessions.length > 0) {
          setSessions(fetchedSessions);
          const savedSessionId = typeof window !== 'undefined' ? localStorage.getItem(`codex_activeSessionId_${campaignId}`) : null;
          const found = savedSessionId ? fetchedSessions.find((s) => s.id === savedSessionId) : null;
          const target = found || fetchedSessions[0];
          setActiveSessionState(target);

          // Fetch scenes across all sessions if active scene is specified
          if (dmActiveSceneId) {
            const allScenesPromises = fetchedSessions.map((s) => sessionService.fetchScenes(s.id, campaignId));
            const allResults = await Promise.all(allScenesPromises);
            if (!isMounted) return;

            let matchedScene: GameScene | null = null;
            let matchedSession: GameSession | null = null;
            let targetSessionScenes: GameScene[] = [];

            allResults.forEach((sRes, idx) => {
              if (sRes.ok) {
                const sList = sRes.value;
                if (fetchedSessions[idx].id === target.id) {
                  targetSessionScenes = sList;
                }
                const match = sList.find((sc) => sc.id === dmActiveSceneId);
                if (match) {
                  matchedScene = match;
                  matchedSession = fetchedSessions[idx];
                }
              }
            });

            if (matchedScene) {
              if (matchedSession) {
                setActiveSessionState(matchedSession);
                const matchRes = allResults.find((_, idx) => fetchedSessions[idx].id === matchedSession?.id);
                if (matchRes && matchRes.ok) {
                  setScenes(matchRes.value);
                } else {
                  setScenes([matchedScene]);
                }
              }
              setActiveSceneState(matchedScene);
              return;
            }
          }

          // Fallback to target session scenes
          const scenesRes = await sessionService.fetchScenes(target.id, campaignId);
          if (!isMounted) return;

          if (scenesRes.ok) {
            const fetchedScenes = scenesRes.value;
            setScenes(fetchedScenes);
            if (fetchedScenes.length > 0) {
              const savedSceneId = typeof window !== 'undefined' ? localStorage.getItem(`codex_activeSceneId_${target.id}`) : null;
              const foundScene = savedSceneId ? fetchedScenes.find((sc) => sc.id === savedSceneId) : null;
              setActiveSceneState(foundScene || fetchedScenes[0]);
            } else {
              setActiveSceneState(null);
            }
          } else {
            toast.error(scenesRes.error.message);
          }
        } else {
          setSessions([]);
          setActiveSessionState(null);
          setScenes([]);
          setActiveSceneState(null);
        }
      } else {
        setSessions([]);
        setActiveSessionState(null);
        setScenes([]);
        setActiveSceneState(null);
        toast.error(res.error.message);
      }
    };

    loadCampaignAndScenes();

    // Subscribe to active_scene_id changes in Supabase Realtime Postgres Changes
    let postgresChannel: any = null;
    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      postgresChannel = supabase
        .channel(`campaign_active_scene_sync_${campaignId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` },
          async (payload) => {
            const newActiveSceneId = payload.new?.active_scene_id;
            if (!newActiveSceneId || !isMounted) return;

            // Fetch sessions and scenes to find the scene across all sessions
            const sRes = await sessionService.fetchSessions(campaignId);
            if (!isMounted || !sRes.ok) return;

            setSessions(sRes.value);
            for (const sess of sRes.value) {
              const scRes = await sessionService.fetchScenes(sess.id, campaignId);
              if (scRes.ok) {
                const match = scRes.value.find((s) => s.id === newActiveSceneId);
                if (match) {
                  setActiveSessionState(sess);
                  setScenes(scRes.value);
                  setActiveSceneState(match);
                  break;
                }
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (postgresChannel) {
        supabase.removeChannel(postgresChannel);
      }
    };
  }, [campaignId, activeCampaign?.activeSceneId, activeCampaign?.role]);

  useEffect(() => {
    if (!campaignId) {
      setCampaignMaps([]);
      return;
    }

    sessionService.fetchCampaignMaps(campaignId).then((res) => {
      if (res.ok) {
        setCampaignMaps(res.value);
      } else {
        setCampaignMaps([]);
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

  const updateScene = useCallback(async (updatedScene: GameScene) => {
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

    if (activeSceneIdRef.current === updatedScene.id) {
      setActiveSceneState(updatedScene);
    }
  }, [campaignId]);

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

  const fetchSceneMap = useCallback(async (sceneId: string): Promise<any | null> => {
    const res = await sessionService.fetchSceneMap(sceneId, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
      return null;
    }
    return res.value;
  }, [campaignId]);

  const saveSceneMap = async (sceneId: string, gridData: any): Promise<void> => {
    const res = await sessionService.saveSceneMap(sceneId, gridData, campaignId);
    if (!res.ok) {
      toast.error(res.error.message);
    }
  };

  const fetchCampaignMaps = useCallback(async (): Promise<CampaignMap[]> => {
    const res = await sessionService.fetchCampaignMaps(campaignId);
    if (res.ok) {
      setCampaignMaps(res.value);
      return res.value;
    } else {
      toast.error(res.error.message);
      return [];
    }
  }, [campaignId]);

  const createCampaignMap = async (title: string, gridData: any): Promise<CampaignMap | null> => {
    const res = await sessionService.createCampaignMap(campaignId || 'camp-demo-1', title, gridData);
    if (res.ok) {
      const newMap = res.value;
      setCampaignMaps(prev => [...prev, newMap]);
      toast.success('Mapa criado com sucesso!');
      return newMap;
    } else {
      toast.error(res.error.message);
      return null;
    }
  };

  const updateCampaignMap = async (mapId: string, title: string, gridData: any): Promise<void> => {
    const res = await sessionService.updateCampaignMap(mapId, title, gridData, campaignId);
    if (res.ok) {
      setCampaignMaps(prev => prev.map(m => m.id === mapId ? { ...m, title, gridData } : m));
    } else {
      toast.error(res.error.message);
    }
  };

  const deleteCampaignMap = async (mapId: string): Promise<void> => {
    const res = await sessionService.deleteCampaignMap(mapId, campaignId);
    if (res.ok) {
      setCampaignMaps(prev => prev.filter(m => m.id !== mapId));
      toast.success('Mapa removido.');
    } else {
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
        campaignMaps,
        fetchCampaignMaps,
        createCampaignMap,
        updateCampaignMap,
        deleteCampaignMap,
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
