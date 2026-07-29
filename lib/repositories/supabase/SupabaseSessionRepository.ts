import { supabase, isValidUuid } from '@/lib/supabase';
import { GameSession, GameScene } from '@/lib/types';
import { SessionRow, SceneRow } from '@/lib/database.types';
import { mapSessionRowToDomain, mapSceneRowToDomain } from '@/lib/mappers';
import { ISessionRepository } from '../contracts/ISessionRepository';

export class SupabaseSessionRepository implements ISessionRepository {
  async fetchSessions(campaignId: string): Promise<GameSession[]> {
    if (!isValidUuid(campaignId)) return [];

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('session_number', { ascending: true });

    if (error) throw error;
    return (data as SessionRow[]).map(mapSessionRowToDomain);
  }

  async createSession(title: string, campaignId = 'camp-demo-1', sessionNumber = 1, notes = ''): Promise<GameSession> {
    if (!isValidUuid(campaignId)) {
      throw new Error('Campaign ID inválido para persistência no Supabase.');
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        campaign_id: campaignId,
        session_number: sessionNumber,
        title,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSessionRowToDomain(data as SessionRow);
  }

  async updateSession(session: GameSession): Promise<void> {
    if (!isValidUuid(session.id)) return;

    const { error } = await supabase
      .from('sessions')
      .update({
        title: session.title,
        notes: session.notes,
      })
      .eq('id', session.id);

    if (error) throw error;
  }

  async fetchScenes(sessionId: string): Promise<GameScene[]> {
    if (!isValidUuid(sessionId)) return [];

    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data as SceneRow[]).map(mapSceneRowToDomain);
  }

  async createScene(sceneData: Omit<GameScene, 'id'>): Promise<GameScene> {
    if (!isValidUuid(sceneData.sessionId)) {
      throw new Error('Session ID inválido para persistência no Supabase.');
    }

    const { data, error } = await supabase
      .from('scenes')
      .insert({
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
        floor_texture_url: sceneData.floorTextureUrl,
        scene_images: sceneData.sceneImages || [],
        active_image_index: sceneData.activeImageIndex || 0,
        environment_settings: sceneData.environmentSettings || {},
      })
      .select()
      .single();

    if (error) throw error;
    return mapSceneRowToDomain(data as SceneRow);
  }

  async updateScene(scene: GameScene): Promise<void> {
    if (!isValidUuid(scene.id)) return;

    const { error } = await supabase
      .from('scenes')
      .update({
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
        floor_texture_url: scene.floorTextureUrl,
        scene_images: scene.sceneImages || [],
        active_image_index: scene.activeImageIndex || 0,
        environment_settings: scene.environmentSettings || {},
      })
      .eq('id', scene.id);

    if (error) throw error;
  }

  async deleteScene(id: string): Promise<void> {
    if (!isValidUuid(id)) return;

    const { error } = await supabase
      .from('scenes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async fetchSceneMap(sceneId: string): Promise<any | null> {
    if (!isValidUuid(sceneId)) return null;

    const { data, error } = await supabase
      .from('scene_maps')
      .select('grid_data')
      .eq('scene_id', sceneId)
      .maybeSingle();

    if (error) throw error;
    return data ? data.grid_data : null;
  }

  async saveSceneMap(sceneId: string, gridData: any): Promise<void> {
    if (!isValidUuid(sceneId)) return;

    const { error } = await supabase
      .from('scene_maps')
      .upsert({
        scene_id: sceneId,
        grid_data: gridData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'scene_id' });

    if (error) throw error;
  }
}
