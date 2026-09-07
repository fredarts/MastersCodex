export interface ProfileRow {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  active_world_id?: string | null;
  active_campaign_id?: string | null;
  created_at?: string;
}

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
  category: any;
  name: string;
  sub_type?: string | null;
  status: string;
  short_desc?: string | null;
  full_content?: string | null;
  attributes?: Record<string, any> | null;
  connections?: any[] | null;
  images?: string[] | null;
  created_at?: string;
}

export interface WorldLoreNodeRow {
  id: string;
  world_id: string;
  name: string;
  type: string;
  status?: string | null;
  description?: string | null;
  connected_to?: any[] | null;
  created_at?: string;
}

export interface CampaignRow {
  id: string;
  dm_id: string;
  world_id?: string | null;
  title: string;
  description?: string | null;
  invite_code: string;
  cover_image_url?: string | null;
  theme_tone?: string | null;
  active_scene_id?: string | null;
  live_state?: any | null;
  created_at?: string;
  party_members?: any[];
  documents?: any[] | null;
  calendar_config?: any | null;
  calendar_state?: any | null;
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
  token_type?: 'billboard' | '3d' | null;
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
  floor_texture_url?: string | null;
  scene_images?: any[] | null;
  active_image_index?: number | null;
  environment_settings?: Record<string, any> | null;
  associated_map_id?: string | null;
  associated_map_ids?: string[] | null;
  created_at?: string;
}

export interface CampaignMapRow {
  id: string;
  campaign_id: string;
  title: string;
  grid_data: any;
  created_at?: string;
  updated_at?: string;
}

export interface SceneMapRow {
  scene_id: string;
  grid_data: any;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignFeedEventRow {
  id: string;
  campaign_id: string;
  session_id?: string | null;
  event_type: 'battle_summary' | 'npc_encounter' | 'session_recap' | 'milestone' | 'house_rule' | 'chat_message' | 'world_lore';
  title: string;
  summary: string;
  details?: Record<string, any> | null;
  is_public: boolean;
  created_at?: string;
}

export interface CharacterSheetRow {
  id: string;
  user_id: string;
  campaign_id?: string | null;
  character_name: string;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface DiceRollLogRow {
  id: string;
  campaign_id: string;
  session_id?: string | null;
  user_id: string;
  character_name: string;
  avatar_url?: string | null;
  roll_type: string;
  label: string;
  formula: string;
  total: number;
  is_crit?: boolean | null;
  is_fail?: boolean | null;
  is_secret?: boolean | null;
  visibility?: 'public' | 'gm' | 'blind' | 'self';
  details?: Record<string, any> | null;
  created_at?: string;
}

export interface PartyLootSessionRow {
  id: string;
  campaign_id: string;
  title: string;
  description?: string | null;
  distribution_mode: 'leader_assigned' | 'free_for_all';
  leader_id?: string | null;
  leader_character_name?: string | null;
  currency?: Record<string, number> | null;
  items?: any[] | null;
  status?: 'active' | 'completed' | null;
  created_by_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvestigationBoardRow {
  id: string;
  campaign_id: string;
  scope: 'party' | 'personal';
  owner_user_id?: string | null;
  title: string;
  items?: any[] | null;
  connections?: any[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignShopRow {
  id: string;
  campaign_id: string;
  name: string;
  merchant_name: string;
  merchant_type: string;
  merchant_avatar_url?: string | null;
  npc_entity_id?: string | null;
  location_entity_id?: string | null;
  location_name?: string | null;
  dialogue_greeting?: string | null;
  wealth_tier?: string | null;
  gold_reserve?: number | null;
  attitude?: number | null;
  persuasion_dc?: number | null;
  stock?: any[] | null;
  is_open_to_players?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignCalendarNoteRow {
  id: string;
  campaign_id: string;
  year: number;
  month_index: number;
  day: number;
  hour?: number | null;
  minute?: number | null;
  title: string;
  content?: string | null;
  category?: string | null;
  author_role?: string | null;
  session_id?: string | null;
  scene_id?: string | null;
  is_completed?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export interface AudioAssetRow {
  id: string;
  campaign_id: string;
  name: string;
  type: 'bgm' | 'sfx' | 'narration';
  url: string;
  category?: string | null;
  is_loop?: boolean | null;
  icon_name?: string | null;
  created_at?: string;
}

export interface AudioFavoriteRow {
  id: string;
  campaign_id: string;
  audio_id: string;
  is_custom?: boolean | null;
  created_at?: string;
}

export interface EntityStatSheetRow {
  id: string;
  entity_id: string;
  ac: number;
  hp: number;
  max_hp: number;
  speed?: string | null;
  cr?: string | null;
  xp?: number | null;
  str?: number | null;
  dex?: number | null;
  con?: number | null;
  int?: number | null;
  wis?: number | null;
  cha?: number | null;
  abilities?: any[] | null;
  actions?: any[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomMonsterRow {
  id: string;
  user_id?: string | null;
  campaign_id?: string | null;
  name: string;
  type: string;
  size: string;
  alignment?: string | null;
  ac: number;
  hp: number;
  speed?: string | null;
  cr?: string | null;
  xp?: number | null;
  str?: number | null;
  dex?: number | null;
  con?: number | null;
  int?: number | null;
  wis?: number | null;
  cha?: number | null;
  token_image_url?: string | null;
  model_url?: string | null;
  token_type: 'billboard' | '3d';
  description?: string | null;
  lore?: string | null;
  abilities?: any[] | null;
  actions?: any[] | null;
  spells?: any[] | null;
  damage_resistances?: string[] | null;
  damage_immunities?: string[] | null;
  damage_vulnerabilities?: string[] | null;
  condition_immunities?: string[] | null;
  base_monster_id?: string | null;
  base_monster_name?: string | null;
  is_custom_variant?: boolean | null;
  variant_tag?: string | null;
  created_at?: string;
}

export interface LoreEmbeddingRow {
  id: string;
  world_id?: string | null;
  campaign_id?: string | null;
  entity_id?: string | null;
  content: string;
  embedding?: number[] | null;
  metadata?: Record<string, any> | null;
  created_at?: string;
}

export interface SrdMonsterRow {
  id: string;
  name: string;
  type: string;
  size: string;
  alignment?: string | null;
  ac: number;
  hp: number;
  speed?: string | null;
  cr: string;
  xp?: number | null;
  str?: number | null;
  dex?: number | null;
  con?: number | null;
  int?: number | null;
  wis?: number | null;
  cha?: number | null;
  abilities?: any[] | null;
  actions?: any[] | null;
  created_at?: string;
  token_image_url?: string | null;
  model_url?: string | null;
  token_type?: string | null;
}

export interface SrdSpellRow {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes?: string[] | null;
  created_at?: string;
  english_name?: string | null;
  concentration?: boolean | null;
  ritual?: boolean | null;
  components_detail?: Record<string, any> | null;
  target_area?: Record<string, any> | null;
  damage_save?: Record<string, any> | null;
  higher_levels?: string | null;
}

export interface SrdItemRow {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  value?: string | null;
  created_at?: string;
}
