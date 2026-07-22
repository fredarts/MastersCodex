export interface WorldRow {
  id: string;
  dm_id: string;
  title: string;
  genre: string;
  description?: string | null;
  created_at?: string;
}

export interface WorldEntityRow {
  id: string;
  world_id: string;
  category: 'npc' | 'location' | 'faction' | 'religion' | 'lore_event';
  name: string;
  sub_type?: string | null;
  status: 'active' | 'destroyed' | 'dead' | 'allied' | 'hostile';
  short_desc?: string | null;
  full_desc?: string | null;
  full_content?: string | null;
  attributes?: Record<string, any> | null;
  connections?: string[] | null;
  created_at?: string;
}

export interface CampaignRow {
  id: string;
  dm_id: string;
  world_id?: string | null;
  title: string;
  description?: string | null;
  invite_code: string;
  created_at?: string;
}

export interface CampaignMemberRow {
  id: string;
  campaign_id: string;
  user_id: string;
  role: 'dm' | 'player';
  character_name?: string | null;
  displayName?: string | null;
  avatar_url?: string | null;
  model_url?: string | null;
  joined_at?: string;
}

export interface SessionRow {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string;
  notes?: string | null;
  created_at?: string;
}

export interface SceneRow {
  id: string;
  session_id: string;
  order_index: number;
  title: string;
  scene_type: 'combat' | 'dialogue' | 'social' | 'exploration';
  npc_name?: string | null;
  sensory_text?: string | null;
  secret_notes?: string | null;
  bgm_category?: 'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao' | null;
  bgm_tracks?: string[] | null;
  image_url?: string | null;
  npc_audio_url?: string | null;
  sfx_shortcuts?: string[] | null;
  combatants?: any[] | null;
  time_of_day?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | null;
  time_of_day_hour?: number | null;
  has_fog?: boolean | null;
  has_rain?: boolean | null;
  scene_images?: any[] | null;
  active_image_index?: number | null;
  created_at?: string;
}

export interface CampaignFeedEventRow {
  id: string;
  campaign_id: string;
  session_id?: string | null;
  event_type: 'battle_summary' | 'npc_encounter' | 'session_recap' | 'milestone' | 'house_rule';
  title: string;
  summary: string;
  details?: Record<string, any> | null;
  is_public: boolean;
  created_at?: string;
}

export interface AudioAssetRow {
  id: string;
  campaign_id: string;
  name: string;
  type: 'bgm' | 'sfx';
  url: string;
  category?: string | null;
  created_at?: string;
}

export interface AudioFavoriteRow {
  id: string;
  campaign_id: string;
  audio_id: string;
  created_at?: string;
}
