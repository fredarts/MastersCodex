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

export type UserRoleMode = 'dm' | 'player';

export type WorldEntityCategory = 'npc' | 'location' | 'faction' | 'religion' | 'lore_event';

export type SceneType = 'combat' | 'dialogue' | 'social' | 'exploration';

export type CampaignFeedEventType = 'battle_summary' | 'npc_encounter' | 'session_recap' | 'milestone' | 'house_rule';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface World {
  id: string;
  dmId: string;
  title: string;
  description?: string;
  genre: string;
  createdAt?: string;
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
  attributes?: Record<string, any>;
  connections?: string[]; // IDs de outras entidades conectadas
  createdAt?: string;
}

export interface SceneImage {
  id: string;
  imageUrl: string;
  overlayText?: string;
  secretNotes?: string;
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
  battleSetupMode?: 'normal' | 'player_ambush' | 'player_surprised';
  placementZoneRadius?: number;
  sceneImages?: SceneImage[];
  activeImageIndex?: number;
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

export interface UserCampaign {
  id: string;
  dmId: string;
  worldId?: string; // ID do Mundo base
  title: string;
  description?: string;
  inviteCode: string;
  role: UserRoleMode;
  characterName?: string;
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
  cr?: string;
  avatarUrl?: string;
  modelUrl?: string;
  notes?: string;
  isCurrentTurn?: boolean;
  x?: number;
  z?: number;
  rotation?: number; // em graus (0-360)
}

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
  connectedTo: string[]; // Node IDs
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

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage';

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
  damageDice?: string;
  damageType?: string;
  timestamp: string;
}

export type AttributeKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';


export type SkillProficiencyLevel = 'none' | 'proficient' | 'expertise';

export interface AttributeScore {
  score: number;
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

export interface CharacterEquipmentItem {
  id: string;
  name: string;
  quantity: number;
  weight?: string;
  notes?: string;
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
}

export interface SpellSlotsPerLevel {
  total: number;
  used: number;
}

export interface CharacterSheet {
  id: string;
  userId: string;
  campaignId?: string;

  // Página 1: Identidade & Cabeçalho
  characterName: string;
  className: string;
  level: number;
  subclass?: string;
  race: string;
  subrace?: string;
  background: string;
  alignment: string;
  playerName: string;
  xp: number;
  avatarUrl?: string;
  modelUrl?: string;

  // Atributos & Inspiração
  inspiration: boolean;
  attributes: CharacterAttributes;
  attributePointsAvailable?: number;
  attributesLocked?: boolean;
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

  // Página 3: Magias
  spellcastingClass?: string;
  spellcastingAbility?: AttributeKey;
  spellSaveDcOverride?: number;
  spellAttackBonusOverride?: number;
  spellSlots: Record<number, SpellSlotsPerLevel>; // Níveis 1 a 9
  spells: CharacterSpell[];

  updatedAt?: string;
}
