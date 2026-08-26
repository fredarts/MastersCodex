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
  | 'monster'
  | 'quest';

export type QuestStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'deadly';
export type QuestType = 'main' | 'side' | 'faction' | 'personal';

export interface QuestObjective {
  id: string;
  description: string;
  isCompleted: boolean;
  optional?: boolean;
}

export interface QuestReward {
  xp?: number;
  gold?: number; // PO (Peças de Ouro)
  items?: string;
  reputation?: string;
}

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
  characterSheet?: CharacterSheet;
  statSheetMode?: 'statblock' | 'full';
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
  timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
  timeOfDayHour?: number; // 0.0 - 24.0 horas
  isIndoor?: boolean; // Se true, escuridão total de caverna/dungeon sem céu
  hasFog?: boolean; // Neblina independente
  hasRain?: boolean; // Chuva e relâmpagos independentes
  floorTextureUrl?: string; // Textura do chão 3D
  battleSetupMode?: 'normal' | 'player_ambush' | 'player_surprised';
  placementZoneRadius?: number;
  sceneImages?: SceneImage[];
  activeImageIndex?: number;
  environmentSettings?: Record<string, any>;
  buildingBlocks?: import('./3d-building-blocks').BuildingBlock3D[];
  gridConfig3D?: import('./3d-building-blocks').GridConfig3D;
  tokenElevations?: Record<string, number>;
  isBattleStarted?: boolean;
  battleStartSnapshot?: Combatant[];
  associatedMapId?: string; // ID do mapa da campanha vinculado a esta cena
  associatedMapIds?: string[]; // IDs de múltiplos mapas de masmorras vinculados a esta cena
  createdAt?: string;
  updatedAt?: string;
}

export interface MapLevel {
  id: string;
  name: string;
  order: number;
  grid: any[][];
  bgImageUrl?: string | null;
  gridScale?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  vectorWalls?: WallSegment[];
  lightSources?: LightSource[];
}

export interface MultiLevelGridData {
  version?: number;
  activeLevelId?: string;
  levels: MapLevel[];
  // Legacy / fallback fields for single level maps
  grid?: any[][];
  bgImageUrl?: string | null;
  gridScale?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  vectorWalls?: WallSegment[];
  lightSources?: LightSource[];
}

export interface CampaignMap {
  id: string;
  campaignId: string;
  title: string;
  gridData: MultiLevelGridData | any; // Armazena a grade, andares/níveis e metadados de calibração do mapa
  createdAt?: string;
  updatedAt?: string;
}

export * from './types/safety';
export * from './types/calendar';

export interface GameSession {
  id: string;
  campaignId: string;
  sessionNumber: number;
  title: string;
  notes?: string;
  scenes?: GameScene[];
  inGameDate?: string;
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
  inGameDate?: string;
  inGameTimestamp?: {
    year: number;
    monthIndex: number;
    day: number;
    hour: number;
    minute: number;
    formatted: string;
  };
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
  tokenType?: 'billboard' | '3d';
  joinedAt?: string;
}

export interface CampaignPartyMember {
  id: string; // The character sheet ID or NPC entity ID
  name: string;
  type: 'player' | 'npc';
  userId?: string; // Optional, for players. In the future NPCs might also have character sheets.
  avatarUrl?: string;
}

export interface CampaignDocumentItem {
  id: string;
  campaignId: string;
  name: string;
  documentType: ReadableItemType;
  author?: string;
  dateOrHeader?: string;
  language?: string;
  notes?: string;
  readableContent: ReadableContent;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
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
  coverImageUrl?: string; // Capa panorâmica / Banner 16:9
  themeTone?: string; // Tom narrativo (Heroico, Dark Fantasy, etc.)
  safetySettings?: import('./types/safety').CampaignSafetySettings;
  calendarConfig?: import('./types/calendar').CampaignCalendarConfig;
  calendarState?: import('./types/calendar').CampaignCalendarState;
  documents?: CampaignDocumentItem[];
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
  isLegendary?: boolean;
  legendaryActions?: number; // Saldo atual de ações lendárias (ex: 0, 1, 2, 3)
  maxLegendaryActions?: number; // Máximo por rodada (padrão: 3)
  hasLairActions?: boolean;
  lairActions?: { name: string; desc: string }[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  characterSheet?: CharacterSheet;
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
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
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
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  createdAt?: string;
}

export type SpellSchool =
  | 'Abjuração'
  | 'Adivinhação'
  | 'Conjuração'
  | 'Encantamento'
  | 'Evocação'
  | 'Ilusão'
  | 'Necromancia'
  | 'Transmutação';

export type SpellAreaShape =
  | 'cone'             // Cone / Leque (ex: Mãos Flamejantes, Cone de Frio)
  | 'cube'             // Cubo (ex: Névoa Assassina, Escuridão)
  | 'cylinder'         // Cilindro (ex: Coluna de Chamas)
  | 'line'             // Linha (ex: Relâmpago)
  | 'sphere'           // Esfera / Baforada (ex: Bola de Fogo)
  | 'square'           // Quadrado
  | 'wall'             // Parede (ex: Muralha de Fogo)
  | 'single_target'    // Alvo Único (ex: Míssil Mágico, Imobilizar Pessoa)
  | 'multiple_targets' // Múltiplos Alvos (ex: Raio de Ruína)
  | 'self'             // Pessoal / Em Si Mesmo (ex: Escudo Mágico, Passo Nebuloso)
  | 'touch'            // Toque (ex: Curar Ferimentos, Voo)
  | 'special';         // Especial

export interface SpellComponents {
  verbal: boolean;               // V (Verbal)
  somatic: boolean;              // S (Somático / Gestual)
  material: boolean;             // M (Material / Ingredientes)
  materialsDescription?: string; // Descrição dos materiais (ex: "uma bolinha de guano de morcego e enxofre")
  costly?: boolean;              // O ingrediente possui custo em PO? (ex: diamante de 300 PO)
  consumed?: boolean;            // O ingrediente é consumido ao conjurar?
  raw?: string;                  // Texto formatado (ex: "V, S, M (guano de morcego e enxofre)")
}

export interface SpellTargetArea {
  type: 'target' | 'area' | 'self' | 'touch' | 'special';
  shape?: SpellAreaShape;
  sizeValue?: number;            // ex: 6 (metros)
  sizeUnit?: 'm' | 'ft';          // 'm' ou 'ft'
  formatted?: string;            // ex: "Esfera de 6m (20ft) de raio", "Leque/Cone de 4.5m", "Linha de 30m"
}

export interface SpellDamageSave {
  damageDice?: string;           // ex: "8d6", "1d8 + mod", "1d10"
  damageType?: string;           // ex: "Fogo", "Força", "Radiante", "Necrótico", "Cura", "Gelo", "Elétrico"
  saveStat?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'; // Teste de Resistência
  saveEffect?: 'none' | 'half' | 'negate' | 'special';      // Sucesso reduz pela metade, anula, etc.
  attackType?: 'melee_spell' | 'ranged_spell' | 'save' | 'utility' | 'none';
}

export interface SRDSpell {
  id?: string;
  name: string;                  // Nome em PT (ex: "Bola de Fogo (Fireball)")
  englishName?: string;           // Nome original em EN (ex: "Fireball")
  level: number;                 // 0 (Truque) até 9 (9º Nível)
  school: SpellSchool | string;
  castingTime: string;           // ex: "1 ação", "1 ação bônus", "1 reação", "10 minutos"
  range: string;                 // ex: "45 metros (150 pés)", "Toque", "Pessoal"
  duration: string;              // ex: "Instantânea", "Concentração, até 1 hora"
  concentration?: boolean;       // Requer Concentração? (true/false)
  ritual?: boolean;              // Pode ser conjurada como Ritual? (true/false)
  components: string | SpellComponents; // String legada ("V, S, M") ou objeto estruturado
  targetArea?: SpellTargetArea;  // Forma da magia (alvo, leque, cone, esfera, linha, etc.)
  damageSave?: SpellDamageSave;  // Dados de dano, salvaguarda e tipo de ataque
  description: string;           // Descrição completa dos efeitos da magia
  higherLevels?: string;         // Efeito quando conjurada em níveis superiores ("Em Níveis Superiores")
  classes: string[];             // Classes que têm acesso ("Bardo", "Clérigo", "Druida", "Feiticeiro", "Bruxo", "Mago", "Paladino", "Patrulheiro")
  damage?: string;               // Propriedade legado opcional
  save?: string;                 // Propriedade legado opcional
}

export interface SRDItem {
  id: string;
  name: string;
  englishName?: string;
  type: string;
  category?: string;
  rarity: string;
  attunement?: string | boolean;
  description: string;
  value?: string;
  weight?: number;
  properties?: Record<string, any>;
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

export interface TransactionEntry {
  id: string;
  type: 'spend' | 'loot' | 'roll' | 'dm_adjust';
  amount: number;
  coinType: 'pc' | 'pp' | 'pe' | 'po' | 'pl';
  reason: string;
  date: string;
}


export type ItemType = 'equipment' | 'weapon' | 'armor' | 'potion' | 'scroll' | 'readable';

export type ReadableItemType = 'book' | 'scroll' | 'letter' | 'diary' | 'note' | 'tome' | 'parchment';

export interface ReadableContent {
  isReadable: boolean;
  readableType?: ReadableItemType;
  title?: string;
  author?: string;
  dateOrHeader?: string;
  language?: string;
  pages?: string[];
  content: string;
  isSealed?: boolean;
  sealColor?: string;
}

export interface CharacterEquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: string;
  notes?: string;
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário' | 'Artefato';
  itemType?: ItemType;
  equipped?: boolean;
  readableContent?: ReadableContent;
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
  tokenType?: 'billboard' | '3d';

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
  startingWealthRolled?: boolean;
  transactionHistory?: TransactionEntry[];


  // Página 3: Magias
  spellcastingClass?: string;
  spellcastingAbility?: AttributeKey;
  spellSaveDcOverride?: number;
  spellAttackBonusOverride?: number;
  spellSlots: Record<number, SpellSlotsPerLevel>; // Níveis 1 a 9
  spells: CharacterSpell[];

  classResources?: Record<string, CharacterResource>;
  activeClassBuffs?: ActiveClassBuff[];
  activeWildShape?: ActiveWildShapeState;
  classFeatures?: ClassFeature[];
  feats?: CharacterFeat[];
  conditions?: ConditionType[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  // Diário & Missões Pessoais
  journalEntries?: PlayerJournalEntry[];
  personalQuests?: PersonalQuest[];

  updatedAt?: string;
}

export interface PlayerJournalEntry {
  id: string;
  title: string;
  content: string;
  sessionNumber?: number;
  inGameDate?: string;
  realDate: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface PersonalQuestObjective {
  id: string;
  text: string;
  completed: boolean;
}

export interface PersonalQuest {
  id: string;
  title: string;
  description: string;
  status: 'in_progress' | 'completed' | 'failed';
  objectives: PersonalQuestObjective[];
  rewardsNotes?: string;
  clues?: string[];
  category?: 'personal' | 'faction' | 'mystery';
  createdAt?: string;
  completedAt?: string;
}

export interface ActiveWildShapeState {
  beastId: string;
  beastName: string;
  beastType: 'beast' | 'elemental';
  currentBeastHp: number;
  maxBeastHp: number;
  beastAc: number;
  beastSpeed: string;
  str: number;
  dex: number;
  con: number;
  originalAttributes: CharacterAttributes;
  originalSpeed: string;
  originalAc: number;
  originalMaxHp: number;
  originalCurrentHp: number;
  originalAttacks: CharacterWeaponAttack[];
  originalAvatarUrl?: string;
  originalModelUrl?: string;
  originalTokenType?: 'billboard' | '3d';
  actions: CharacterWeaponAttack[];
  abilities: { name: string; desc: string }[];
  tokenImageUrl?: string;
  modelUrl?: string;
  transformedAt: string;
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
  readableContent?: ReadableContent;
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

// ==========================================
// ÁRVORES GENEALÓGICAS & LINHAGENS (FAMILY TREES)
// ==========================================

export type FamilyRelationType = 
  | 'parent'        // Pai/Mãe
  | 'child'         // Filho(a) legítimo(a)
  | 'spouse'        // Cônjuge / Casamento
  | 'ex_spouse'     // Ex-cônjuge / Divórcio / Anulação
  | 'betrothed'     // Prometido(a) em noivado
  | 'bastard'       // Filho(a) bastardo(a) / Ilegítimo(a)
  | 'adopted'       // Adotado(a)
  | 'sibling'       // Irmão / Irmã
  | 'half_sibling'  // Meio-irmão / Meia-irmã
  | 'ancestor'      // Antepassado fundador
  | 'heir'          // Herdeiro direto designado
  | 'claimant'      // Reivindicante ao trono/liderança
  | 'usurper';      // Usurpador / Regente ilegítimo

export type SuccessionStatus = 
  | 'ruling'           // Atual monarca / líder
  | 'heir_apparent'    // 1º na linha de sucessão
  | 'heir_presumptive' // Próximo na linha
  | 'claimant'         // Reclamante ao trono / Pretendente
  | 'disinherited'     // Deserdado(a)
  | 'abdicated'        // Abdicou
  | 'deceased'         // Falecido(a)
  | 'exiled'           // No exílio
  | 'missing';         // Desaparecido(a)

export interface FamilyMemberNode {
  id: string;
  worldEntityId?: string; // Vínculo com NPC existente no Worldbuilder
  name: string;
  title?: string; // Ex: 'Lorde de Winterfell', 'Arquimago', 'Príncipe Herdeiro'
  race?: string; // Ex: 'Humano', 'Alto Elfo', 'Anão'
  houseOrDynasty?: string; // Ex: 'Casa Valerius', 'Clã Martelo de Prata'
  generation: number; // 0 = Raiz/Fundador, 1 = Filhos, 2 = Netos, etc.
  gender?: 'male' | 'female' | 'other';
  birthEra?: string; // Ex: 'Ano 120 da 3ª Era'
  deathEra?: string; // Ex: 'Ano 178 da 3ª Era' ou null se vivo
  isAlive: boolean;
  avatarUrl?: string;
  coatOfArmsUrl?: string; // Brasão / Escudo Heráldico
  successionStatus?: SuccessionStatus;
  notes?: string;
  secrets?: string; // Notas secretas do DM (ex: "Na verdade é filho do conselheiro")
  customBadge?: string; // Ex: '💀 Assassinado', '👑 Rei Atual'
}

export interface FamilyRelationshipEdge {
  id: string;
  fromId: string;
  toId: string;
  type: FamilyRelationType;
  details?: string; // Ex: 'Casamento político em 142', 'Legitimado por decreto'
  isSecret?: boolean; // Apenas visível para o DM
}

export interface FamilyTree {
  id: string;
  worldId: string;
  factionId?: string; // Vinculado a uma facção/reino específico
  name: string; // Ex: 'Árvore Genealógica da Dinastia Valerius'
  houseMotto?: string; // Ex: 'Na Sombra Forjamos a Luz'
  crestUrl?: string; // Imagem do Brasão
  description?: string;
  members: FamilyMemberNode[];
  relationships: FamilyRelationshipEdge[];
  rootMemberId?: string;
  layoutDirection?: 'top_bottom' | 'bottom_top' | 'left_right';
  customStyles?: {
    theme?: 'parchment' | 'royal_gold' | 'dark_fantasy' | 'cyber_neon' | 'arcane_blue';
    connectorStyle?: 'smooth' | 'step' | 'straight';
  };
  createdAt?: string;
  updatedAt?: string;
}

export type TransitionType = 'stairs_down' | 'stairs_up' | 'ladder' | 'portal' | 'doorway';

export interface DungeonTransitionConfig {
  id: string;
  name: string;
  type: TransitionType;
  targetLevelId: string;
  targetSpawnR?: number;
  targetSpawnC?: number;
  linkedTransitionId?: string;
  status?: 'open' | 'locked' | 'blocked';
  lockpickDC?: number;
  description?: string;
}

