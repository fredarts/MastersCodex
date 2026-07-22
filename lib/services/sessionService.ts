import { supabase, isSupabaseConfigured, isValidUuid } from '@/lib/supabase';
import { GameSession, GameScene } from '@/lib/types';
import { SessionRow, SceneRow } from '@/lib/database.types';
import { mapSessionRowToDomain, mapSceneRowToDomain } from '@/lib/mappers';
import { toast } from 'sonner';

export const sessionService = {
  async fetchSessions(campaignId: string): Promise<GameSession[]> {
    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: true });

      if (error) {
        toast.error(`Erro ao carregar sessões: ${error.message}`);
      } else if (data) {
        return (data as SessionRow[]).map(mapSessionRowToDomain);
      }
    }
    try {
      const saved = localStorage.getItem('codex_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao carregar sessões salvas localmente.');
      return [];
    }
  },

  async createSession(title: string, campaignId = 'camp-demo-1', sessionNumber = 1, notes = ''): Promise<GameSession> {
    const newSession: GameSession = {
      id: `sess-${Date.now()}`,
      campaignId,
      sessionNumber,
      title,
      notes,
    };

    if (isSupabaseConfigured() && isValidUuid(campaignId)) {
      const { data, error } = await supabase.from('sessions').insert({
        campaign_id: campaignId,
        session_number: sessionNumber,
        title,
        notes,
      }).select().single();

      if (error) {
        toast.error(`Erro ao criar sessão no banco: ${error.message}`);
      } else if (data) {
        return mapSessionRowToDomain(data as SessionRow);
      }
    }

    return newSession;
  },

  async updateSession(session: GameSession): Promise<void> {
    if (isSupabaseConfigured() && isValidUuid(session.id)) {
      const { error } = await supabase.from('sessions').update({
        title: session.title,
        notes: session.notes,
      }).eq('id', session.id);

      if (error) {
        toast.error(`Erro ao atualizar sessão: ${error.message}`);
      }
    }
  },

  async fetchScenes(sessionId: string): Promise<GameScene[]> {
    if (isSupabaseConfigured() && isValidUuid(sessionId)) {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (error) {
        toast.error(`Erro ao carregar cenas: ${error.message}`);
      } else if (data) {
        return (data as SceneRow[]).map(mapSceneRowToDomain);
      }
    }
    try {
      const saved = localStorage.getItem('codex_scenes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      toast.error('Erro ao carregar cenas salvas localmente.');
      return [];
    }
  },

  async createScene(sceneData: Omit<GameScene, 'id'>): Promise<GameScene> {
    const newScene: GameScene = {
      ...sceneData,
      id: `sc-${Date.now()}`,
    };

    if (isSupabaseConfigured() && isValidUuid(sceneData.sessionId)) {
      const { data, error } = await supabase.from('scenes').insert({
        session_id: sceneData.sessionId,
        order_index: sceneData.orderIndex,
        title: sceneData.title,
        scene_type: sceneData.sceneType,
        npc_name: sceneData.npcName,
        sensory_text: sceneData.sensoryText,
        secret_notes: sceneData.secretNotes,
        bgm_category: sceneData.bgmCategory,
        bgm_tracks: sceneData.bgmTracks || [],
        image_url: sceneData.imageUrl,
        npc_audio_url: sceneData.npcAudioUrl,
        sfx_shortcuts: sceneData.sfxShortcuts,
        combatants: sceneData.combatants,
        time_of_day: sceneData.timeOfDay,
        time_of_day_hour: sceneData.timeOfDayHour,
        has_fog: sceneData.hasFog,
        has_rain: sceneData.hasRain,
        scene_images: sceneData.sceneImages || [],
        active_image_index: sceneData.activeImageIndex || 0,
      }).select().single();

      if (error) {
        toast.error(`Erro ao criar cena: ${error.message}`);
      } else if (data) {
        return mapSceneRowToDomain(data as SceneRow);
      }
    }

    return newScene;
  },

  async updateScene(scene: GameScene): Promise<void> {
    if (isSupabaseConfigured() && isValidUuid(scene.id)) {
      const { error } = await supabase.from('scenes').update({
        title: scene.title,
        scene_type: scene.sceneType,
        npc_name: scene.npcName,
        sensory_text: scene.sensoryText,
        secret_notes: scene.secretNotes,
        bgm_category: scene.bgmCategory,
        bgm_tracks: scene.bgmTracks || [],
        image_url: scene.imageUrl,
        npc_audio_url: scene.npcAudioUrl,
        sfx_shortcuts: scene.sfxShortcuts,
        combatants: scene.combatants,
        time_of_day: scene.timeOfDay,
        time_of_day_hour: scene.timeOfDayHour,
        has_fog: scene.hasFog,
        has_rain: scene.hasRain,
        scene_images: scene.sceneImages || [],
        active_image_index: scene.activeImageIndex || 0,
      }).eq('id', scene.id);

      if (error) {
        toast.error(`Erro ao atualizar cena: ${error.message}`);
      }
    }
  },

  async deleteScene(id: string): Promise<void> {
    if (isSupabaseConfigured() && isValidUuid(id)) {
      const { error } = await supabase.from('scenes').delete().eq('id', id);
      if (error) {
        toast.error(`Erro ao remover cena: ${error.message}`);
      }
    }
  },
};
