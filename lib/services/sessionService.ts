import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { GameSession, GameScene } from '@/lib/types';

export const sessionService = {
  async fetchSessions(campaignId: string): Promise<GameSession[]> {
    if (isSupabaseConfigured() && !campaignId.startsWith('camp-')) {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: true });

      if (!error && data) {
        return data.map((s: any) => ({
          id: s.id,
          campaignId: s.campaign_id,
          sessionNumber: s.session_number,
          title: s.title,
          notes: s.notes,
        }));
      }
    }
    try {
      const saved = localStorage.getItem('codex_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
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

    if (isSupabaseConfigured() && !campaignId.startsWith('camp-')) {
      const { data } = await supabase.from('sessions').insert({
        campaign_id: campaignId,
        session_number: sessionNumber,
        title,
        notes,
      }).select().single();

      if (data) newSession.id = data.id;
    }

    return newSession;
  },

  async updateSession(session: GameSession): Promise<void> {
    if (isSupabaseConfigured() && !session.id.startsWith('sess-')) {
      await supabase.from('sessions').update({
        title: session.title,
        notes: session.notes,
      }).eq('id', session.id);
    }
  },

  async fetchScenes(sessionId: string): Promise<GameScene[]> {
    if (isSupabaseConfigured() && !sessionId.startsWith('sess-')) {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (!error && data) {
        return data.map((sc: any) => ({
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
          timeOfDay: sc.time_of_day,
          timeOfDayHour: sc.time_of_day_hour,
          hasFog: sc.has_fog,
          hasRain: sc.has_rain,
        }));
      }
    }
    try {
      const saved = localStorage.getItem('codex_scenes');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  },

  async createScene(sceneData: Omit<GameScene, 'id'>): Promise<GameScene> {
    const newScene: GameScene = {
      ...sceneData,
      id: `sc-${Date.now()}`,
    };

    if (isSupabaseConfigured() && sceneData.sessionId && !sceneData.sessionId.startsWith('sess-')) {
      const { data } = await supabase.from('scenes').insert({
        session_id: sceneData.sessionId,
        order_index: sceneData.orderIndex,
        title: sceneData.title,
        scene_type: sceneData.sceneType,
        npc_name: sceneData.npcName,
        sensory_text: sceneData.sensoryText,
        secret_notes: sceneData.secretNotes,
        bgm_category: sceneData.bgmCategory,
        image_url: sceneData.imageUrl,
        npc_audio_url: sceneData.npcAudioUrl,
        sfx_shortcuts: sceneData.sfxShortcuts,
        combatants: sceneData.combatants,
        time_of_day: sceneData.timeOfDay,
        time_of_day_hour: sceneData.timeOfDayHour,
        has_fog: sceneData.hasFog,
        has_rain: sceneData.hasRain,
      }).select().single();

      if (data) newScene.id = data.id;
    }

    return newScene;
  },

  async updateScene(scene: GameScene): Promise<void> {
    if (isSupabaseConfigured() && !scene.id.startsWith('sc-')) {
      await supabase.from('scenes').update({
        title: scene.title,
        scene_type: scene.sceneType,
        npc_name: scene.npcName,
        sensory_text: scene.sensoryText,
        secret_notes: scene.secretNotes,
        bgm_category: scene.bgmCategory,
        image_url: scene.imageUrl,
        npc_audio_url: scene.npcAudioUrl,
        sfx_shortcuts: scene.sfxShortcuts,
        combatants: scene.combatants,
        time_of_day: scene.timeOfDay,
        time_of_day_hour: scene.timeOfDayHour,
        has_fog: scene.hasFog,
        has_rain: scene.hasRain,
      }).eq('id', scene.id);
    }
  },

  async deleteScene(id: string): Promise<void> {
    if (isSupabaseConfigured() && !id.startsWith('sc-')) {
      await supabase.from('scenes').delete().eq('id', id);
    }
  },
};
