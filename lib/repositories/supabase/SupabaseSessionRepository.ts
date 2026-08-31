import { supabase, isValidUuid } from '@/lib/supabase';
import { GameSession, GameScene, CampaignMap } from '@/lib/types';
import { SessionRow, SceneRow, CampaignMapRow } from '@/lib/database.types';
import { mapSessionRowToDomain, mapSceneRowToDomain, mapCampaignMapRowToDomain } from '@/lib/mappers';
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
        scene_images: (sceneData.slidePacks && sceneData.slidePacks.length > 0 && sceneData.slidePacks[0].images)
          ? sceneData.slidePacks[0].images
          : (sceneData.sceneImages || []),
        active_image_index: sceneData.activeImageIndex || 0,
        environment_settings: {
          ...(sceneData.environmentSettings || {}),
          slide_packs: sceneData.slidePacks ?? sceneData.environmentSettings?.slide_packs ?? [],
          active_slide_pack_id: sceneData.activeSlidePackId ?? sceneData.environmentSettings?.active_slide_pack_id ?? 'pack-main',
          default_transition: sceneData.defaultTransition ?? sceneData.environmentSettings?.default_transition ?? 'magical_dissolve',
          default_aspect_ratio: sceneData.defaultAspectRatio ?? sceneData.environmentSettings?.default_aspect_ratio ?? '16:9',
          building_blocks_3d: sceneData.buildingBlocks ?? sceneData.environmentSettings?.building_blocks_3d ?? [],
          grid_config_3d: sceneData.gridConfig3D ?? sceneData.environmentSettings?.grid_config_3d ?? null,
          token_elevations: sceneData.tokenElevations ?? sceneData.environmentSettings?.token_elevations ?? {},
        },
        associated_map_id: sceneData.associatedMapId,
        associated_map_ids: sceneData.associatedMapIds || [],
      })
      .select()
      .single();

    if (error) throw error;
    return mapSceneRowToDomain(data as SceneRow);
  }

  async updateScene(scene: GameScene): Promise<void> {
    if (!isValidUuid(scene.id)) return;

    // Obter imagens do pack ativo ou do primeiro pack para fallback em scene_images
    const activePack = (scene.slidePacks || []).find((p) => p.id === scene.activeSlidePackId) || (scene.slidePacks || [])[0];
    const fallbackImages = (activePack && activePack.images && activePack.images.length > 0)
      ? activePack.images
      : (scene.sceneImages || []);

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
        image_url: scene.imageUrl || (fallbackImages[0]?.imageUrl) || null,
        npc_audio_url: scene.npcAudioUrl,
        sfx_shortcuts: scene.sfxShortcuts,
        combatants: scene.combatants,
        time_of_day: scene.timeOfDay,
        time_of_day_hour: scene.timeOfDayHour,
        has_fog: scene.hasFog,
        has_rain: scene.hasRain,
        floor_texture_url: scene.floorTextureUrl,
        scene_images: fallbackImages,
        active_image_index: scene.activeImageIndex || 0,
        environment_settings: {
          ...(scene.environmentSettings || {}),
          slide_packs: scene.slidePacks ?? scene.environmentSettings?.slide_packs ?? [],
          active_slide_pack_id: scene.activeSlidePackId ?? scene.environmentSettings?.active_slide_pack_id ?? 'pack-main',
          default_transition: scene.defaultTransition ?? scene.environmentSettings?.default_transition ?? 'magical_dissolve',
          default_aspect_ratio: scene.defaultAspectRatio ?? scene.environmentSettings?.default_aspect_ratio ?? '16:9',
          building_blocks_3d: scene.buildingBlocks ?? scene.environmentSettings?.building_blocks_3d ?? [],
          grid_config_3d: scene.gridConfig3D ?? scene.environmentSettings?.grid_config_3d ?? null,
          token_elevations: scene.tokenElevations ?? scene.environmentSettings?.token_elevations ?? {},
        },
        associated_map_id: scene.associatedMapId,
        associated_map_ids: scene.associatedMapIds || [],
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

  async fetchCampaignMaps(campaignId: string): Promise<CampaignMap[]> {
    if (!isValidUuid(campaignId)) {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('codex_campaign_maps') : null;
        const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
        return all.filter(m => m.campaignId === campaignId);
      } catch {
        return [];
      }
    }

    try {
      const { data, error } = await supabase
        .from('campaign_maps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[SupabaseSessionRepository] Erro ao buscar mapas, usando fallback local:', error.message);
        const saved = typeof window !== 'undefined' ? localStorage.getItem('codex_campaign_maps') : null;
        const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
        return all.filter(m => m.campaignId === campaignId);
      }
      return (data as CampaignMapRow[]).map(mapCampaignMapRowToDomain);
    } catch (_e) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('codex_campaign_maps') : null;
      const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
      return all.filter(m => m.campaignId === campaignId);
    }
  }

  async createCampaignMap(campaignId: string, title: string, gridData: any): Promise<CampaignMap> {
    const fallbackMap: CampaignMap = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `map-${Date.now()}`,
      campaignId,
      title,
      gridData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!isValidUuid(campaignId)) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('codex_campaign_maps');
        const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
        all.push(fallbackMap);
        localStorage.setItem('codex_campaign_maps', JSON.stringify(all));
      }
      return fallbackMap;
    }

    try {
      const { data, error } = await supabase
        .from('campaign_maps')
        .insert({
          campaign_id: campaignId,
          title,
          grid_data: gridData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.warn('[SupabaseSessionRepository] Erro ao salvar mapa no Supabase, salvando local:', error.message);
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('codex_campaign_maps');
          const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
          all.push(fallbackMap);
          localStorage.setItem('codex_campaign_maps', JSON.stringify(all));
        }
        return fallbackMap;
      }
      return mapCampaignMapRowToDomain(data as CampaignMapRow);
    } catch (_e) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('codex_campaign_maps');
        const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
        all.push(fallbackMap);
        localStorage.setItem('codex_campaign_maps', JSON.stringify(all));
      }
      return fallbackMap;
    }
  }

  async updateCampaignMap(mapId: string, title: string, gridData: any): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('codex_campaign_maps');
        const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
        const idx = all.findIndex(m => m.id === mapId);
        if (idx !== -1) {
          all[idx] = { ...all[idx], title, gridData, updatedAt: new Date().toISOString() };
          localStorage.setItem('codex_campaign_maps', JSON.stringify(all));
        }
      } catch {}
    }

    if (!isValidUuid(mapId)) return;

    try {
      await supabase
        .from('campaign_maps')
        .update({
          title,
          grid_data: gridData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mapId);
    } catch (_e) {}
  }

  async deleteCampaignMap(mapId: string): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('codex_campaign_maps');
        const all: CampaignMap[] = saved ? JSON.parse(saved) : [];
        const filtered = all.filter(m => m.id !== mapId);
        localStorage.setItem('codex_campaign_maps', JSON.stringify(filtered));
      } catch {}
    }

    if (!isValidUuid(mapId)) return;

    try {
      await supabase
        .from('campaign_maps')
        .delete()
        .eq('id', mapId);
    } catch (_e) {}
  }
}
