import { create } from 'zustand';
import { Combatant, CombatLogEntry, CharacterSpell, Bg3RollModifierCard, AdvantageMode } from '@/lib/types';
import { BattleSetupMode } from '@/components/live-cockpit/BattleSetupModal';

// ── Types ──

export interface DiceResultState {
  title: string;
  roll: number;
  total: number;
  isCrit: boolean;
  isFail: boolean;
}

export interface Bg3DiceOverlayState {
  title: string;
  subtitle?: string;
  actorName?: string;
  targetName?: string;
  d20Roll?: number;
  secondD20Roll?: number;
  selectedD20Roll?: number;
  modifier: number;
  totalRoll?: number;
  targetAc?: number;
  difficultyClass?: number;
  advantageMode?: AdvantageMode;
  modifierCards?: Bg3RollModifierCard[];
  contextNarrative?: string;
  isHit?: boolean;
  isCrit?: boolean;
  isFail?: boolean;
  damageDiceFormula?: string;
  damageType?: string;
  damageAmount?: number;
  targetCombatant?: Combatant;
  isRolling: boolean;
  phase: 'd20' | 'damage';
  onRollComplete?: (finalTotal: number, isHit: boolean, d20Value: number) => void;
  onApplyDamage?: (targetId: string, amount: number, explanation?: string) => void;
}

import { RangeInfo, RangeStatus } from '../utils/dndRangeUtils';

export interface PendingAttackState {
  title: string;
  mod: number;
  actorCombatant?: Combatant;
  actionDesc?: string;
  rangeText?: string;
  rangeInfo?: RangeInfo;
}

export interface SplineState {
  attackerId?: string;
  targetId?: string;
  attackerPos?: { x: number; y: number; z: number };
  targetPos?: { x: number; y: number; z: number };
  distanceFt?: number;
  status?: RangeStatus;
  animationPhase: 'aiming' | 'firing' | 'fading' | 'idle';
}

export interface MagicMissileModalState {
  isOpen: boolean;
  caster: Combatant;
  spell: CharacterSpell;
  availableDarts: number;
  dartAllocations: Record<string, number>;
}

export type RightPanelTab = 'init' | 'log' | 'teleprompter' | 'chat';
export type AddCombatantTab = 'monsters' | 'players' | 'custom' | 'npcs';

// ── Store Interface ──

interface LiveCockpitStudioState {
  // UI Panel states
  isTimelineCollapsed: boolean;
  isRightPanelCollapsed: boolean;
  rightPanelTab: RightPanelTab;
  teleprompterFontSize: number;
  expandedId: string | null;
  statusMenuOpen: string | null;

  // Modal visibility states
  showCreateSceneModal: boolean;
  showAddCombatantModal: boolean;
  showBattleSetupModal: boolean;
  confirmDeleteCombatant: Combatant | null;
  pendingAttack: PendingAttackState | null;
  splineState: SplineState | null;
  magicMissileModalState: MagicMissileModalState | null;

  // Dice & BG3 Overlay
  diceResult: DiceResultState | null;
  bg3DiceOverlay: Bg3DiceOverlayState | null;
  animatedRollNumber: number;

  // Combat UI states
  selectedTargetId: string | undefined;
  combatLogs: CombatLogEntry[];
  isCombatActive: boolean;
  openSpellDropdownId: string | null;
  draggedCardIndex: number | null;
  dragOverCardIndex: number | null;
  activeAddTab: AddCombatantTab;
  combatantSearchQuery: string;
  autoInit: boolean;
  isBattleStarted: boolean;

  // Battle Setup & Placement
  isPlacementPhase: boolean;
  battleSetupMode: BattleSetupMode;

  // Live Environment Overrides (DM controls)
  selectedTimeOfDay: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
  liveTimeOfDayHour: number;
  liveHasFog: boolean;
  liveHasRain: boolean;
  liveFloorTextureUrl: string | undefined;
  liveEnvironmentSettings: Record<string, any> | null;

  // Audio
  playingNpcVoice: boolean;
  activeBgmCategory: string;
  customAudios: unknown[];

  // Scene inline editing
  editingSceneId: string | null;
  editedSceneTitle: string;

  // ── Actions ──

  // UI Toggles
  toggleTimeline: () => void;
  setIsTimelineCollapsed: (v: boolean) => void;
  toggleRightPanel: () => void;
  setIsRightPanelCollapsed: (v: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setTeleprompterFontSize: (updater: number | ((prev: number) => number)) => void;
  setExpandedId: (id: string | null) => void;
  setStatusMenuOpen: (id: string | null) => void;

  // Modal Setters
  setShowCreateSceneModal: (v: boolean) => void;
  setShowAddCombatantModal: (v: boolean) => void;
  setShowBattleSetupModal: (v: boolean) => void;
  setConfirmDeleteCombatant: (c: Combatant | null) => void;
  setPendingAttack: (a: PendingAttackState | null) => void;
  setSplineState: (s: SplineState | null | ((prev: SplineState | null) => SplineState | null)) => void;
  setMagicMissileModalState: (s: MagicMissileModalState | null | ((prev: MagicMissileModalState | null) => MagicMissileModalState | null)) => void;

  // Dice & Overlay
  setDiceResult: (r: DiceResultState | null) => void;
  setBg3DiceOverlay: (o: Bg3DiceOverlayState | null | ((prev: Bg3DiceOverlayState | null) => Bg3DiceOverlayState | null)) => void;
  setAnimatedRollNumber: (n: number) => void;

  // Combat UI
  setSelectedTargetId: (id: string | undefined) => void;
  setCombatLogs: (logs: CombatLogEntry[] | ((prev: CombatLogEntry[]) => CombatLogEntry[])) => void;
  setIsCombatActive: (v: boolean) => void;
  setOpenSpellDropdownId: (id: string | null) => void;
  setDraggedCardIndex: (idx: number | null) => void;
  setDragOverCardIndex: (idx: number | null) => void;
  setActiveAddTab: (tab: AddCombatantTab) => void;
  setCombatantSearchQuery: (q: string) => void;
  setAutoInit: (v: boolean) => void;
  setIsBattleStarted: (v: boolean) => void;

  // Battle Setup & Placement
  setIsPlacementPhase: (v: boolean) => void;
  setBattleSetupMode: (m: BattleSetupMode) => void;

  // Live Environment Overrides
  setSelectedTimeOfDay: (t: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors') => void;
  setLiveTimeOfDayHour: (h: number) => void;
  setLiveHasFog: (v: boolean) => void;
  setLiveHasRain: (v: boolean) => void;
  setLiveFloorTextureUrl: (url: string | undefined) => void;
  setLiveEnvironmentSettings: (settings: Record<string, any> | null) => void;

  // Audio
  setPlayingNpcVoice: (v: boolean) => void;
  setActiveBgmCategory: (c: string) => void;
  setCustomAudios: (a: unknown[]) => void;

  // Scene inline editing
  setEditingSceneId: (id: string | null) => void;
  setEditedSceneTitle: (t: string) => void;
}

// ── Store Creation ──

export const useLiveCockpitStudioStore = create<LiveCockpitStudioState>((set) => ({
  // Initial UI Panel states
  isTimelineCollapsed: false,
  isRightPanelCollapsed: false,
  rightPanelTab: 'init',
  teleprompterFontSize: 18,
  expandedId: null,
  statusMenuOpen: null,

  // Initial Modal states
  showCreateSceneModal: false,
  showAddCombatantModal: false,
  showBattleSetupModal: false,
  confirmDeleteCombatant: null,
  pendingAttack: null,
  splineState: null,
  magicMissileModalState: null,

  // Dice & BG3 Overlay
  diceResult: null,
  bg3DiceOverlay: null,
  animatedRollNumber: 1,

  // Combat UI
  selectedTargetId: undefined,
  combatLogs: [],
  isCombatActive: false,
  openSpellDropdownId: null,
  draggedCardIndex: null,
  dragOverCardIndex: null,
  activeAddTab: 'monsters',
  combatantSearchQuery: '',
  autoInit: false,
  isBattleStarted: false,

  // Battle Setup
  isPlacementPhase: false,
  battleSetupMode: 'normal',

  // Live Environment
  selectedTimeOfDay: 'day',
  liveTimeOfDayHour: 12,
  liveHasFog: false,
  liveHasRain: false,
  liveFloorTextureUrl: undefined,
  liveEnvironmentSettings: null,

  // Audio
  playingNpcVoice: false,
  activeBgmCategory: 'taverna',
  customAudios: [],

  // Scene editing
  editingSceneId: null,
  editedSceneTitle: '',

  // ── Action Implementations ──

  toggleTimeline: () =>
    set((state) => {
      const next = !state.isTimelineCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masters_codex_timeline_collapsed', String(next));
      }
      return { isTimelineCollapsed: next };
    }),
  setIsTimelineCollapsed: (v) => set({ isTimelineCollapsed: v }),
  toggleRightPanel: () =>
    set((state) => {
      const next = !state.isRightPanelCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masters_codex_right_panel_collapsed', String(next));
      }
      return { isRightPanelCollapsed: next };
    }),
  setIsRightPanelCollapsed: (v) => set({ isRightPanelCollapsed: v }),
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  setTeleprompterFontSize: (updater) =>
    set((state) => ({
      teleprompterFontSize: typeof updater === 'function' ? updater(state.teleprompterFontSize) : updater,
    })),
  setExpandedId: (id) => set({ expandedId: id }),
  setStatusMenuOpen: (id) => set({ statusMenuOpen: id }),

  setShowCreateSceneModal: (v) => set({ showCreateSceneModal: v }),
  setShowAddCombatantModal: (v) => set({ showAddCombatantModal: v }),
  setShowBattleSetupModal: (v) => set({ showBattleSetupModal: v }),
  setConfirmDeleteCombatant: (c) => set({ confirmDeleteCombatant: c }),
  setPendingAttack: (a) => set({ pendingAttack: a }),
  setSplineState: (s) =>
    set((state) => ({
      splineState: typeof s === 'function' ? s(state.splineState) : s,
    })),
  setMagicMissileModalState: (s) =>
    set((state) => ({
      magicMissileModalState: typeof s === 'function' ? s(state.magicMissileModalState) : s,
    })),

  setDiceResult: (r) => set({ diceResult: r }),
  setBg3DiceOverlay: (o) =>
    set((state) => ({
      bg3DiceOverlay: typeof o === 'function' ? o(state.bg3DiceOverlay) : o,
    })),
  setAnimatedRollNumber: (n) => set({ animatedRollNumber: n }),

  setSelectedTargetId: (id) => set({ selectedTargetId: id }),
  setCombatLogs: (logs) =>
    set((state) => ({
      combatLogs: typeof logs === 'function' ? logs(state.combatLogs) : logs,
    })),
  setIsCombatActive: (v) => set({ isCombatActive: v }),
  setOpenSpellDropdownId: (id) => set({ openSpellDropdownId: id }),
  setDraggedCardIndex: (idx) => set({ draggedCardIndex: idx }),
  setDragOverCardIndex: (idx) => set({ dragOverCardIndex: idx }),
  setActiveAddTab: (tab) => set({ activeAddTab: tab }),
  setCombatantSearchQuery: (q) => set({ combatantSearchQuery: q }),
  setAutoInit: (v) => set({ autoInit: v }),
  setIsBattleStarted: (v) => set({ isBattleStarted: v }),

  setIsPlacementPhase: (v) => set({ isPlacementPhase: v }),
  setBattleSetupMode: (m) => set({ battleSetupMode: m }),

  setSelectedTimeOfDay: (t) => set({ selectedTimeOfDay: t }),
  setLiveTimeOfDayHour: (h) => set({ liveTimeOfDayHour: h }),
  setLiveHasFog: (v) => set({ liveHasFog: v }),
  setLiveHasRain: (v) => set({ liveHasRain: v }),
  setLiveFloorTextureUrl: (url) => set({ liveFloorTextureUrl: url }),
  setLiveEnvironmentSettings: (s) => set({ liveEnvironmentSettings: s }),

  setPlayingNpcVoice: (v) => set({ playingNpcVoice: v }),
  setActiveBgmCategory: (c) => set({ activeBgmCategory: c }),
  setCustomAudios: (a) => set({ customAudios: a }),

  setEditingSceneId: (id) => set({ editingSceneId: id }),
  setEditedSceneTitle: (t) => set({ editedSceneTitle: t }),
}));
