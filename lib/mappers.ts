import { 
  WorldRow, 
  WorldEntityRow, 
  CampaignRow, 
  CampaignMemberRow, 
  SessionRow, 
  SceneRow, 
  CampaignFeedEventRow 
} from './database.types';
import { 
  World, 
  WorldEntity, 
  UserCampaign, 
  CampaignMember, 
  GameSession, 
  GameScene, 
  CampaignFeedEvent 
} from './types';

export function mapWorldRowToDomain(row: WorldRow): World {
  return {
    id: row.id,
    dmId: row.dm_id,
    title: row.title,
    genre: row.genre || 'Fantasia Medieval',
    description: row.description || undefined,
    createdAt: row.created_at,
  };
}

export function mapWorldEntityRowToDomain(row: WorldEntityRow): WorldEntity {
  return {
    id: row.id,
    worldId: row.world_id,
    category: row.category,
    name: row.name,
    subType: row.sub_type || undefined,
    status: row.status || 'active',
    shortDesc: row.short_desc || '',
    fullContent: row.full_desc || row.full_content || undefined,
    attributes: row.attributes || {},
    connections: row.connections || [],
    createdAt: row.created_at,
  };
}

export function mapCampaignRowToDomain(row: CampaignRow, role: 'dm' | 'player' = 'dm'): UserCampaign {
  return {
    id: row.id,
    dmId: row.dm_id,
    worldId: row.world_id || undefined,
    title: row.title,
    description: row.description || undefined,
    inviteCode: row.invite_code,
    role,
  };
}

export function mapCampaignMemberRowToDomain(row: CampaignMemberRow): CampaignMember {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    userId: row.user_id,
    role: row.role,
    characterName: row.character_name || undefined,
    displayName: row.displayName || undefined,
    avatarUrl: row.avatar_url || undefined,
    modelUrl: row.model_url || undefined,
    joinedAt: row.joined_at,
  };
}

export function mapSessionRowToDomain(row: SessionRow): GameSession {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    sessionNumber: row.session_number,
    title: row.title,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

export function mapSceneRowToDomain(row: SceneRow): GameScene {
  return {
    id: row.id,
    sessionId: row.session_id,
    orderIndex: row.order_index,
    title: row.title,
    sceneType: row.scene_type,
    npcName: row.npc_name || undefined,
    sensoryText: row.sensory_text || undefined,
    secretNotes: row.secret_notes || undefined,
    bgmCategory: row.bgm_category || undefined,
    bgmTracks: row.bgm_tracks || [],
    imageUrl: row.image_url || undefined,
    npcAudioUrl: row.npc_audio_url || undefined,
    sfxShortcuts: row.sfx_shortcuts || [],
    combatants: row.combatants || [],
    timeOfDay: row.time_of_day || undefined,
    timeOfDayHour: row.time_of_day_hour ?? undefined,
    hasFog: row.has_fog ?? false,
    hasRain: row.has_rain ?? false,
    floorTextureUrl: row.floor_texture_url || undefined,
    sceneImages: row.scene_images || [],
    activeImageIndex: row.active_image_index || 0,
    createdAt: row.created_at,
  };
}

export function mapFeedEventRowToDomain(row: CampaignFeedEventRow): CampaignFeedEvent {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    sessionId: row.session_id || undefined,
    eventType: row.event_type,
    title: row.title,
    summary: row.summary,
    details: row.details || undefined,
    isPublic: row.is_public ?? true,
    createdAt: row.created_at,
  };
}
