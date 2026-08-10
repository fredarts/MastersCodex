export type ConditionType = 
  | 'Cego' 
  | 'Encantado' 
  | 'Surdo' 
  | 'Atemorizado' 
  | 'Agarrado' 
  | 'Incapacitado' 
  | 'Invisível' 
  | 'Paralisado' 
  | 'Petrificado' 
  | 'Envenenado' 
  | 'Caído' 
  | 'Restrito' 
  | 'Inconsciente' 
  | 'Concentração';

export type ConnectionType = 'neutral' | 'allied' | 'hostile' | 'family' | 'member' | 'location';

export interface EntityConnection {
  targetId: string;
  type: ConnectionType;
}

export type UserRoleMode = 'dm' | 'player';

export type WorldEntityCategory = 
  | 'npc' 
  | 'location' 
  | 'faction' 
  | 'religion' 
  | 'lore_event'
  | 'species'
  | 'ethnicity'
  | 'tradition'
  | 'profession'
  | 'natural_law'
  | 'spell'
  | 'disease'
  | 'item'
  | 'material'
  | 'technology'
  | 'document'
  | 'language'
  | 'military_conflict'
  | 'military_unit'
  | 'currency'
  | 'trade_route'
  | 'beast'
  | 'flora'
  | 'magic_system'
  | 'plane'
  | 'cosmology'
  | 'monster';

export interface WorldMapPin {
  id: string;
  worldId: string;
  entityId?: string;
  title: string;
  category: WorldEntityCategory | 'custom';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  description?: string;
  iconName?: string;
}

export interface TimelineEvent {
  id: string;
  worldId: string;
  entityId?: string;
  title: string;
  era: string; // Ex: "Segunda Era", "Ano 420"
  yearOrder: number; // For sorting
  description: string;
  category: WorldEntityCategory;
}

export type SceneType = 'combat' | 'dialogue' | 'social' | 'exploration';

export type CampaignFeedEventType = 'battle_summary' | 'npc_encounter' | 'session_recap' | 'milestone' | 'house_rule' | 'chat_message' | 'world_lore';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  user_metadata?: Record<string, any>;
}

export interface World {
  id: string;
  dmId: string;
  title: string;
  description?: string;
  genre: string;
  createdAt?: string;
}

export interface EntityStatSheet {
  id: string;
  entityId: string;
  ac: number;
  hp: number;
  maxHp: number;
  speed?: string;
  cr?: string;
  xp?: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  abilities?: { name: string; desc: string }[];
  actions?: { name: string; desc: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorldEntity {
  id: string;
  worldId: string;
  category: WorldEntityCategory;
  name: string;
  subType?: string; // Ex: 'Reino', 'Cidade', 'Deus', 'Guilda'
  status: 'active' | 'destroyed' | 'dead' | 'allied' | 'hostile';
  shortDesc: string;
  fullContent?: string;
  images?: string[]; // Galeria de imagens (upload ou IA Nano Banana)
  attributes?: Record<string, any>;
  connections?: EntityConnection[]; // IDs de outras entidades conectadas e tipo da relação
  tags?: string[]; // Custom tags/etiquetas de organização e busca livre
  statSheet?: EntityStatSheet;
  createdAt?: string;
}

export interface SceneImage {
  id: string;
  imageUrl: string;
  overlayText?: string;
  secretNotes?: string;
  mediaType?: 'image' | 'video';
}

export interface GameScene {
  id: string;
  sessionId: string;
  orderIndex: number;
  title: string;
  sceneType: SceneType;
  npcName?: string;
  sensoryText?: string;
  secretNotes?: string;
  bgmCategory?: 'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao';
  bgmTracks?: string[]; // Múltiplas trilhas associadas à cena
  imageUrl?: string;
  npcAudioUrl?: string;
  sfxShortcuts?: string[]; // IDs dos botões SFX
  combatants?: Combatant[];
  timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
  timeOfDayHour?: number; // 0.0 - 24.0 horas
  hasFog?: boolean; // Neblina independente
  hasRain?: boolean; // Chuva e relâmpagos independentes
  floorTextureUrl?: string; // Textura do chão 3D
  battleSetupMode?: 'normal' | 'player_ambush' | 'player_surprised';
  placementZoneRadius?: number;
  sceneImages?: SceneImage[];
  activeImageIndex?: number;
  environmentSettings?: Record<string, any>;
  isBattleStarted?: boolean;
  battleStartSnapshot?: Combatant[];
  associatedMapId?: string; // ID do mapa da campanha vinculado a esta cena
  associatedMapIds?: string[]; // IDs de múltiplos mapas de masmorras vinculados a esta cena
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignMap {
  id: string;
  campaignId: string;
  title: string;
  gridData: any; // Armazena a grade e metadados de calibração do mapa
  createdAt?: string;
  updatedAt?: string;
}

export interface GameSession {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  notes?: string;
  scenes?: GameScene[];
  createdAt?: string;
}

export interface CampaignFeedEvent {
  id: string;
  campaignId: string;
  sessionId?: string;
  eventType: CampaignFeedEventType;
  title: string;
  summary: string;
  details?: Record<string, any>;
  isPublic: boolean;
  createdAt?: string;
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  role: 'dm' | 'player';
  characterName?: string;
  displayName?: string;
  avatarUrl?: string;
  modelUrl?: string;
  joinedAt?: string;
}

export interface CampaignPartyMember {
  id: string; // The character sheet ID or NPC entity ID
  name: string;
  type: 'player' | 'npc';
  userId?: string; // Optional, for players. In the future NPCs might also have character sheets.
  avatarUrl?: string;
}

export interface UserCampaign {
  id: string;
  dmId: string;
  worldId?: string; // ID do Mundo base
  title: string;
  description?: string;
  inviteCode: string;
  role: UserRoleMode;
  characterName?: string;
  partyMembers?: CampaignPartyMember[];
}

export interface StatusDuration {
  name: string;
  remainingRounds: number;
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'npc';
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
  conditions: ConditionType[];
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  actions?: { name: string; desc: string }[];
  abilities?: { name: string; desc: string }[];
  cr?: string;
  speed?: string;
  size?: string;
  avatarUrl?: string;
  modelUrl?: string;
  tokenImageUrl?: string;
  tokenType?: 'billboard' | '3d';
  notes?: string;
  isCurrentTurn?: boolean;
  x?: number;
  z?: number;
  rotation?: number; // em graus (0-360)
  actionUsed?: boolean;
  bonusActionUsed?: boolean;
  reactionUsed?: boolean;
  movementUsed?: number;
  turnStartX?: number;
  turnStartZ?: number;
  hasDashed?: boolean;
  visionRange?: number; // em pés (default: 30)
  visionType?: VisionType;
  darkvisionRange?: number;
  hasTorch?: boolean;
  statusDurations?: StatusDuration[];
}

export type WallType = 'wall' | 'door' | 'secret_door' | 'window' | 'terrain' | 'illusion';
export type WallSense = 'both' | 'left' | 'right';

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: WallType;
  doorState?: 'closed' | 'open' | 'locked';
  blocksLight: boolean;
  blocksVision: boolean;
  blocksMovement: boolean;
  sense?: WallSense;
  height?: number;
}

export type LightAnimationType = 'none' | 'torch' | 'pulse' | 'chroma' | 'candle';

export interface LightSource {
  id: string;
  x: number;
  y: number;
  brightRadius: number; // em pés (ex: 20ft)
  dimRadius: number;    // em pés (ex: 40ft)
  color: string;        // Hex ou HSL
  intensity: number;    // 0.0 a 1.0
  animation?: LightAnimationType;
  attachedToTokenId?: string;
}

export type VisionType = 'normal' | 'darkvision' | 'blindsight' | 'tremorsense' | 'truesight';

export interface CombatantVisionConfig {
  visionRange: number;
  visionType: VisionType;
  darkvisionRange?: number;
  hasTorch?: boolean;
  torchLightId?: string;
}

export type FogState = 0 | 1 | 2; // 0: Unexplored, 1: Explored/Shrouded, 2: Active LoS


export interface CombatLogEntry {
  id: string;
  timestamp: string;
  round: number;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  eventType: 'attack' | 'damage' | 'heal' | 'save' | 'status' | 'turn' | 'death' | 'system';
  actionName?: string;
  d20Roll?: number;
  totalRoll?: number;
  targetAc?: number;
  isHit?: boolean;
  isCrit?: boolean;
  isFail?: boolean;
  amount?: number;
  damageType?: string;
  description: string;
}

export interface PlayerRollEvent {
  id: string;
  characterName: string;
  rollType: 'skill' | 'save' | 'attack' | 'spell' | 'custom';
  label: string;
  d20Roll: number;
  modifier: number;
  total: number;
  isCrit?: boolean;
  isFail?: boolean;
  advantageMode?: AdvantageMode;
  timestamp: string;
}

export interface SRDMonster {
  id: string;
  name: string;
  type: string;
  size: string;
  alignment: string;
  ac: number;
  hp: number;
  speed: string;
  cr: string;
  xp: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  abilities: { name: string; desc: string }[];
  actions: { name: string; desc: string }[];
  tokenImageUrl?: string;
  modelUrl?: string;
  tokenType?: 'billboard' | '3d';
}

export interface CustomMonsterAction {
  name: string;
  attackBonus?: number;
  damage?: string;
  desc: string;
}

export interface CustomMonsterSpell {
  name: string;
  level: number;
  school?: string;
  desc?: string;
}

export interface CustomMonster {
  id: string;
  userId?: string;
  campaignId?: string;
  name: string;
  type: string;
  size: 'Miúdo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Imenso' | string;
  alignment: string;
  ac: number;
  hp: number;
  maxHp?: number;
  speed: string;
  cr: string;
  xp: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  tokenImageUrl?: string;
  modelUrl?: string;
  tokenType: 'billboard' | '3d';
  description?: string;
  lore?: string;
  abilities?: { name: string; desc: string }[];
  actions?: CustomMonsterAction[];
  spells?: CustomMonsterSpell[];
  createdAt?: string;
}

export interface SRDSpell {
  id: string;
  name: string;
  level: number; // 0 for cantrip
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  classes: string[];
}

export interface SRDItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  description: string;
  value?: string;
}

export interface Encounter {
  id: string;
  name: string;
  description: string;
  combatants: Omit<Combatant, 'id' | 'initiative'>[];
}

export interface LoreNode {
  id: string;
  name: string;
  type: 'npc' | 'location' | 'faction' | 'event';
  status: 'alive' | 'dead' | 'active' | 'destroyed' | 'allied' | 'hostile';
  description: string;
  connectedTo: EntityConnection[]; // Array of connection objects
}

export interface BGMTrack {
  id: string;
  name: string;
  category: string; // Permitir categorias customizadas além das padrão
  url: string;
  isLoop: boolean;
}

export interface SFXButton {
  id: string;
  name: string;
  iconName: string;
  url: string;
  category: string;
}

export interface CampaignAudio {
  id: string;
  campaignId: string;
  name: string;
  url: string;
  type: 'bgm' | 'sfx';
  category: string;
  isLoop: boolean;
  iconName?: string;
  createdAt?: string;
}

export interface CampaignAudioFavorite {
  id: string;
  campaignId: string;
  audioId: string;
  isCustom: boolean;
  createdAt?: string;
}

// ==========================================
// D&D 5E CHARACTER SHEET INTERFACES
// ==========================================

export interface ClassFeature {
  id: string;
  name: string;
  level: number;
  description: string;
  activation: 'action' | 'bonus_action' | 'reaction' | 'none' | 'special';
  resourceCost?: {
    type: 'spell_slot' | 'class_resource' | 'hp';
    name?: string;
    amount: number;
  };
  requiresSubclass?: string;
  choices?: string[];
  isSubclassChoice?: boolean;
}

export interface CharacterResource {
  name: string;
  label: string;
  current: number;
  max: number;
}

export interface ActiveClassBuff {
  id: string;
  name: string;
  type: 'rage' | 'smite' | 'custom';
  description: string;
  damageBonus?: string; // e.g. "+2" or "2d8"
  attackBonus?: number;
  acBonus?: number;
  spellSlotLevelUsed?: number; // Only for smite or similar slot-based buffs
}


export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';
export type RollVisibility = 'public' | 'gm' | 'blind' | 'self';
export type SecretRollNotificationMode = 'subtle_notice' | 'stealth_silent';
export type MacroBarDisplayMode = 'bottom_bar' | 'chat_tab' | 'both';

export interface Bg3RollModifierCard {
  id: string;
  label: string;
  value: number | string;
  numericValue?: number;
  iconType: 'attribute' | 'proficiency' | 'spell' | 'item' | 'advantage' | 'condition';
  sourceName?: string;
  isOptional?: boolean;
  isEnabled?: boolean;
  reason?: string;
}

export interface DiceRollEvent {
  id: string;
  characterId?: string;
  characterName: string;
  avatarUrl?: string;
  rollType: 'attribute' | 'saving_throw' | 'skill' | 'attack' | 'damage' | 'hit_dice' | 'custom';
  label: string;
  d20Roll1?: number;
  d20Roll2?: number;
  selectedD20?: number;
  modifier: number;
  total: number;
  isCrit?: boolean;
  isFail?: boolean;
  advantageMode?: AdvantageMode;
  visibility?: RollVisibility;
  isSecret?: boolean;
  damageDice?: string;
  damageType?: string;
  diceBreakdown?: {
    numDice: number;
    faces: number;
    keptRolls: number[];
    droppedRolls?: number[];
  }[];
  timestamp: string;
}

export interface MacroItem {
  id: string;
  name: string;
  command: string; // Ex: "/r 1d20+@str (Espada)" ou "/gmroll 2d6+3"
  color?: string; // Hex ou Tailwind color
  icon?: string;
  isGlobal?: boolean; // Criada pelo DM para a campanha toda
}

export interface DiceRollLogEntry extends DiceRollEvent {
  campaignId: string;
  userId: string;
  createdAt: string;
}

export type AttributeKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';


export type SkillProficiencyLevel = 'none' | 'proficient' | 'expertise';

export interface AttributeScore {
  score: number;
  baseScore?: number;
  overrideMod?: number;
}

export interface CharacterAttributes {
  str: AttributeScore;
  dex: AttributeScore;
  con: AttributeScore;
  int: AttributeScore;
  wis: AttributeScore;
  cha: AttributeScore;
}

export interface SavingThrows {
  str: boolean;
  dex: boolean;
  con: boolean;
  int: boolean;
  wis: boolean;
  cha: boolean;
}

export type DndSkillKey =
  | 'acrobacia'
  | 'arcanismo'
  | 'atletismo'
  | 'atuacao'
  | 'blefar'
  | 'furtividade'
  | 'historia'
  | 'intimidacao'
  | 'intuicao'
  | 'investigacao'
  | 'lidarComAnimais'
  | 'medicina'
  | 'natureza'
  | 'percepcao'
  | 'persuasao'
  | 'prestidigitacao'
  | 'religiao'
  | 'sobrevivencia';

export interface CharacterSkill {
  name: string;
  attr: AttributeKey;
  level: SkillProficiencyLevel;
}

export interface CharacterWeaponAttack {
  id: string;
  name: string;
  atkBonus: string;
  damage: string;
  type: string;
}

export interface CharacterCurrency {
  pc: number; // Peças de Cobre
  pp: number; // Peças de Prata
  pe: number; // Peças de Electrum
  po: number; // Peças de Ouro
  pl: number; // Peças de Platina
}

export type ItemType = 'equipment' | 'weapon' | 'armor' | 'potion' | 'scroll';

export interface CharacterEquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: string;
  notes?: string;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário' | 'Artefato';
  itemType?: ItemType;
  potionProps?: {
    healingDice?: string;
    effectDesc?: string;
  };
  weaponProps?: {
    damage: string;
    damageType: string;
    atkBonus?: number;
  };
  armorProps?: {
    acBonus: number;
    armorType: 'light' | 'medium' | 'heavy' | 'shield';
  };
  scrollProps?: {
    spellName: string;
    spellLevel: number;
  };
}

export interface CharacterSpell {
  id: string;
  name: string;
  level: number; // 0 for cantrip
  prepared?: boolean;
  school?: string;
  castingTime?: string;
  range?: string;
  components?: string;
  description?: string;
  isBonus?: boolean;
}

export interface SpellSlotsPerLevel {
  total: number;
  used: number;
}

export interface CharacterClassProgress {
  name: string;
  level: number;
  subclass?: string;
  isPrimary: boolean;
}

export interface CharacterSheet {
  id: string;
  userId: string;
  campaignId?: string;
  isPublic?: boolean;

  // Página 1: Identidade & Cabeçalho
  characterName: string;
  className: string;
  level: number;
  classes?: CharacterClassProgress[];
  subclass?: string;
  race: string;
  subrace?: string;
  background: string;
  alignment: string;
  playerName: string;
  xp: number;
  avatarUrl?: string;
  avatarSettings?: { zoom: number; offsetX: number; offsetY: number };
  modelUrl?: string;

  // Atributos & Inspiração
  inspiration: boolean;
  attributes: CharacterAttributes;
  attributePointsAvailable?: number;
  attributesLocked?: boolean;
  skillsLocked?: boolean;
  savingThrows: SavingThrows;

  // Combate
  armorClass: number;
  equippedArmor?: string;
  hasShield?: boolean;
  initiativeBonus: number; // Override manual de iniciativa se houver
  speed: string;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDiceTotal: string;
  hitDiceUsed: string;
  deathSaves: {
    successes: number; // 0 a 3
    failures: number;  // 0 a 3
  };

  // Ataques e Magias Rápidas (Página 1)
  attacks: CharacterWeaponAttack[];

  // Perícias (18 Perícias Oficiais)
  skills: Record<DndSkillKey, SkillProficiencyLevel>;
  otherProficienciesAndLanguages: string;

  // Personalidade & Traços (Página 1/2)
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  featuresAndTraits: string;

  // Página 2: Lore, Aparência & Organizações
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  appearanceDesc?: string;
  backstory?: string;
  alliesAndOrganizations?: string;
  factionSymbolName?: string;
  factionSymbolUrl?: string;
  otherFeatures?: string;
  treasure?: string;
  equipment?: CharacterEquipmentItem[];
  currency?: CharacterCurrency;

  // Página 3: Magias
  spellcastingClass?: string;
  spellcastingAbility?: AttributeKey;
  spellSaveDcOverride?: number;
  spellAttackBonusOverride?: number;
  spellSlots: Record<number, SpellSlotsPerLevel>; // Níveis 1 a 9
  spells: CharacterSpell[];

  classResources?: Record<string, CharacterResource>;
  activeClassBuffs?: ActiveClassBuff[];
  classFeatures?: ClassFeature[];
  feats?: CharacterFeat[];
  conditions?: ConditionType[];

  updatedAt?: string;
}

export interface CharacterFeat {
  id: string;
  name: string;
  namePt: string;
  description: string;
  prerequisite?: string;
  category: 'combat' | 'magic' | 'utility' | 'general';
  chosenAttribute?: AttributeKey;
  benefits: {
    attributeBonus?: Partial<Record<AttributeKey, number>>;
    initiativeBonus?: number;
    speedBonus?: number;
    hpPerLevelBonus?: number;
    savingThrowProficiency?: AttributeKey;
  };
}

export type Result<T, E = Error> = 
  | { ok: true; value: T } 
  | { ok: false; error: E };

export type LootDistributionMode = 'leader_assigned' | 'free_for_all';

export interface PartyLootItem {
  id: string;
  name: string;
  quantity: number;
  weight?: string;
  notes?: string;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário' | 'Artefato';
  claimedBy?: {
    userId?: string;
    characterName: string;
    claimedAt: string;
  } | null;
  itemType?: ItemType;
  potionProps?: any;
  weaponProps?: any;
  armorProps?: any;
  scrollProps?: any;
}

export interface PartyLootSession {
  id: string;
  campaignId: string;
  title: string;
  description?: string;
  distributionMode: LootDistributionMode;
  leaderId?: string;
  leaderCharacterName?: string;
  currency: CharacterCurrency;
  items: PartyLootItem[];
  status: 'active' | 'completed';
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DirectTransferPayload {
  id: string;
  campaignId: string;
  fromUserId?: string;
  fromCharacterName: string;
  toUserId?: string;
  toCharacterName: string;
  item?: CharacterEquipmentItem;
  currency?: Partial<CharacterCurrency>;
  sentAt: string;
}

// ==========================================
// REAL-TIME SYNC PAYLOADS (Phase 3)
// ==========================================

export type ChatChannel = 'general' | 'whisper' | 'ic';

export interface ChatDiceResult {
  formula: string;
  rolls: number[];
  total: number;
  isCrit?: boolean;
  isFail?: boolean;
  visibility?: RollVisibility;
  isSecret?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  channel: ChatChannel;
  whisperTo?: string;
  whisperToName?: string;
  content: string;
  rollResult?: ChatDiceResult;
  isSecret?: boolean;
  isSubtleNotice?: boolean; // Se true, renderiza "O Mestre rolou os dados em segredo..." para os jogadores
  timestamp: string;
}

export interface DmCursorPayload {
  x: number;
  y: number;
  context: 'map' | 'battle3d';
}

export interface PingLocationPayload {
  id?: string;
  x: number;
  y: number;
  worldX?: number;
  worldZ?: number;
  context: 'map' | 'battle3d';
  senderName: string;
  color: string;
}

export interface VoiceSignalPayload {
  type: 'offer' | 'answer' | 'ice-candidate';
  fromUserId: string;
  toUserId: string;
  data: any;
}

export interface PresencePayload {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarSettings?: { zoom: number; offsetX: number; offsetY: number };
  status: 'online' | 'away' | 'speaking' | 'offline';
  timestamp?: number;
}
