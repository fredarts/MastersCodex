'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { GameSession, GameScene } from '@/lib/types';

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

const isValidUUID = (str?: string) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSessionState] = useState<GameSession | null>(null);
  const [scenes, setScenes] = useState<GameScene[]>([]);
  const [activeScene, setActiveSceneState] = useState<GameScene | null>(null);

  // Load state from localStorage and Supabase
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('codex_sessions');
      const savedScenes = localStorage.getItem('codex_scenes');
      const savedActiveSessionId = localStorage.getItem('codex_activeSessionId');
      const savedActiveSceneId = localStorage.getItem('codex_activeSceneId');

      if (savedSessions) {
        const parsed: GameSession[] = JSON.parse(savedSessions);
        setSessions(parsed);
        if (savedActiveSessionId) {
          const found = parsed.find((s) => s.id === savedActiveSessionId);
          if (found) setActiveSessionState(found);
        } else if (parsed.length > 0) {
          setActiveSessionState(parsed[0]);
        }
      }

      if (savedScenes) {
        const parsed: GameScene[] = JSON.parse(savedScenes);
        setScenes(parsed);
        if (savedActiveSceneId) {
          const found = parsed.find((sc) => sc.id === savedActiveSceneId);
          if (found) setActiveSceneState(found);
        } else if (parsed.length > 0) {
          setActiveSceneState(parsed[0]);
        }
      }
    } catch (e) {
      console.error('Error loading SessionContext from localStorage:', e);
    }

    if (isSupabaseConfigured()) {
      supabase.from('sessions').select('*').order('session_number', { ascending: true }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: GameSession[] = data.map((s: any) => ({
            id: s.id,
            campaignId: s.campaign_id,
            sessionNumber: s.session_number,
            title: s.title,
            notes: s.notes,
          }));
          setSessions(mapped);
          if (!activeSession) setActiveSessionState(mapped[0]);
        }
      });

      supabase.from('scenes').select('*').order('order_index', { ascending: true }).then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped: GameScene[] = data.map((sc: any) => ({
            id: sc.id,
            sessionId: sc.session_id,
            orderIndex: sc.order_index,
            title: sc.title,
            sceneType: sc.scene_type,
            npcName: sc.npc_name,
            sensoryText: sc.sensory_text,
            secretNotes: sc.secret_notes,
            bgmCategory: sc.bgm_category,
            imageUrl: sc.image_url,
            npcAudioUrl: sc.npc_audio_url,
            sfxShortcuts: sc.sfx_shortcuts,
            combatants: sc.combatants,
          }));
          setScenes(mapped);
          if (!activeScene) setActiveSceneState(mapped[0]);
        }
      });
    }
  }, []);

  const setActiveSession = (session: GameSession | null) => {
    setActiveSessionState(session);
    try {
      if (session) {
        localStorage.setItem('codex_activeSessionId', session.id);
      } else {
        localStorage.removeItem('codex_activeSessionId');
      }
    } catch (e) {}
  };

  const setActiveScene = (scene: GameScene | null) => {
    setActiveSceneState(scene);
    try {
      if (scene) {
        localStorage.setItem('codex_activeSceneId', scene.id);
      } else {
        localStorage.removeItem('codex_activeSceneId');
      }
    } catch (e) {}
  };

  const createSession = async (title: string, notes = ''): Promise<GameSession> => {
    const newSession: GameSession = {
      id: `sess-${Date.now()}`,
      campaignId: 'camp-demo-1',
      sessionNumber: sessions.length + 1,
      title,
      notes,
    };

    setSessions((prev) => {
      const updated = [...prev, newSession];
      try {
        localStorage.setItem('codex_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (isSupabaseConfigured() && isValidUUID(newSession.campaignId)) {
      supabase.from('sessions').insert({
        campaign_id: newSession.campaignId,
        session_number: newSession.sessionNumber,
        title: newSession.title,
        notes: newSession.notes,
      }).then(({ data, error }) => {
        if (error) console.warn('Aviso ao inserir sessão no Supabase:', error.message);
      });
    }

    setActiveSession(newSession);
    return newSession;
  };

  const updateSession = async (updatedSession: GameSession) => {
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

    if (isSupabaseConfigured() && isValidUUID(updatedSession.id)) {
      supabase.from('sessions').update({
        title: updatedSession.title,
        notes: updatedSession.notes,
      }).eq('id', updatedSession.id).then(({ error }) => {
        if (error) console.warn('Aviso ao atualizar sessão no Supabase:', error.message);
      });
    }
  };

  const createScene = async (sceneData: Omit<GameScene, 'id'>): Promise<GameScene> => {
    const newScene: GameScene = {
      ...sceneData,
      id: `sc-${Date.now()}`,
      sessionId: sceneData.sessionId || activeSession?.id || 'sess-demo-1',
      orderIndex: scenes.length + 1,
    };

    setScenes((prev) => {
      const updated = [...prev, newScene];
      try {
        localStorage.setItem('codex_scenes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (isSupabaseConfigured() && isValidUUID(newScene.sessionId)) {
      supabase.from('scenes').insert({
        session_id: newScene.sessionId,
        order_index: newScene.orderIndex,
        title: newScene.title,
        scene_type: newScene.sceneType,
        npc_name: newScene.npcName,
        sensory_text: newScene.sensoryText,
        secret_notes: newScene.secretNotes,
        bgm_category: newScene.bgmCategory,
        image_url: newScene.imageUrl,
        npc_audio_url: newScene.npcAudioUrl,
        sfx_shortcuts: newScene.sfxShortcuts,
        combatants: newScene.combatants,
      }).then(({ error }) => {
        if (error) console.warn('Aviso ao inserir cena no Supabase:', error.message);
      });
    }

    setActiveScene(newScene);
    return newScene;
  };

  const updateScene = async (updatedScene: GameScene) => {
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

    if (isSupabaseConfigured() && isValidUUID(updatedScene.id)) {
      supabase.from('scenes').update({
        title: updatedScene.title,
        scene_type: updatedScene.sceneType,
        npc_name: updatedScene.npcName,
        sensory_text: updatedScene.sensoryText,
        secret_notes: updatedScene.secretNotes,
        bgm_category: updatedScene.bgmCategory,
        image_url: updatedScene.imageUrl,
        npc_audio_url: updatedScene.npcAudioUrl,
        sfx_shortcuts: updatedScene.sfxShortcuts,
        combatants: updatedScene.combatants,
      }).eq('id', updatedScene.id).then(({ error }) => {
        if (error) console.warn('Aviso ao atualizar cena no Supabase:', error.message);
      });
    }
  };

  const deleteScene = async (id: string) => {
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

    if (isSupabaseConfigured() && isValidUUID(id)) {
      supabase.from('scenes').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('Aviso ao deletar cena no Supabase:', error.message);
      });
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
