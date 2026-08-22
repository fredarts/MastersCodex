export interface OverlayRollItem {
  id: string;
  rollerName: string;
  rollType: string;
  diceFormula: string;
  result: number;
  isCrit?: boolean;
  isFail?: boolean;
  isHit?: boolean;
  title?: string;
  timestamp: number;
}

export interface OverlayCombatant {
  id: string;
  name: string;
  initiative: number;
  hp?: number;
  maxHp?: number;
  ac?: number;
  type?: string;
  avatarUrl?: string;
  conditions?: string[];
  revealedToPlayers?: boolean;
  hidden?: boolean;
}

export interface OverlayCombatState {
  isActive: boolean;
  combatants: OverlayCombatant[];
  currentTurnIndex: number;
  roundCount: number;
}

export interface OverlaySceneState {
  title?: string;
  sensoryText?: string;
  timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
  timeOfDayHour?: number;
  hasFog?: boolean;
  hasRain?: boolean;
  imageUrl?: string;
}

export interface OverlayChatMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  content: string;
  channel: string;
  timestamp: number;
}

export interface OverlayState {
  rolls: OverlayRollItem[];
  combat: OverlayCombatState;
  scene: OverlaySceneState;
  chatMessages: OverlayChatMessage[];
}

export const initialOverlayState: OverlayState = {
  rolls: [],
  combat: {
    isActive: false,
    combatants: [],
    currentTurnIndex: 0,
    roundCount: 1,
  },
  scene: {},
  chatMessages: [],
};

export type OverlayAction =
  | { type: 'ADD_ROLL'; payload: { roll: Omit<OverlayRollItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number }; isSecret?: boolean; visibility?: string } }
  | { type: 'REMOVE_ROLL'; id: string }
  | { type: 'UPDATE_COMBAT'; payload: { combatants?: any[]; currentTurnIndex?: number; roundCount?: number } }
  | { type: 'UPDATE_SCENE'; payload: OverlaySceneState }
  | { type: 'ADD_CHAT'; payload: OverlayChatMessage }
  | { type: 'CLEAR_ROLLS' };

/**
 * Filter secret or GM-only dice rolls to prevent spoilers on live streams.
 */
export function isRollSecret(isSecret?: boolean, visibility?: string): boolean {
  if (isSecret) return true;
  if (visibility === 'gm_only' || visibility === 'secret' || visibility === 'blind') return true;
  return false;
}

/**
 * Filter invisible or hidden combatants from public overlay stream view.
 */
export function filterPublicCombatants(combatants: any[] = []): OverlayCombatant[] {
  return combatants
    .filter((c) => {
      if (c.revealedToPlayers === false) return false;
      if (c.hidden === true) return false;
      return true;
    })
    .map((c) => ({
      id: c.id || `c-${Math.random()}`,
      name: c.name || 'Desconhecido',
      initiative: typeof c.initiative === 'number' ? c.initiative : 0,
      hp: c.hp,
      maxHp: c.maxHp,
      ac: c.ac,
      type: c.type || 'monster',
      avatarUrl: c.avatarUrl || c.avatar,
      conditions: c.conditions || [],
      revealedToPlayers: c.revealedToPlayers,
      hidden: c.hidden,
    }));
}

/**
 * Core pure reducer for Streamer Overlay state.
 */
export function overlayStateReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'ADD_ROLL': {
      if (isRollSecret(action.payload.isSecret, action.payload.visibility)) {
        return state;
      }
      const newRoll: OverlayRollItem = {
        id: action.payload.roll.id || `roll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        rollerName: action.payload.roll.rollerName || 'Jogador',
        rollType: action.payload.roll.rollType || 'd20',
        diceFormula: action.payload.roll.diceFormula || '1d20',
        result: action.payload.roll.result,
        isCrit: action.payload.roll.isCrit ?? (action.payload.roll.result === 20 && action.payload.roll.rollType === 'd20'),
        isFail: action.payload.roll.isFail ?? (action.payload.roll.result === 1 && action.payload.roll.rollType === 'd20'),
        isHit: action.payload.roll.isHit,
        title: action.payload.roll.title,
        timestamp: action.payload.roll.timestamp || Date.now(),
      };
      // Keep up to 5 recent rolls
      const updatedRolls = [newRoll, ...state.rolls].slice(0, 5);
      return {
        ...state,
        rolls: updatedRolls,
      };
    }

    case 'REMOVE_ROLL': {
      return {
        ...state,
        rolls: state.rolls.filter((r) => r.id !== action.id),
      };
    }

    case 'CLEAR_ROLLS': {
      return {
        ...state,
        rolls: [],
      };
    }

    case 'UPDATE_COMBAT': {
      const publicCombatants = filterPublicCombatants(action.payload.combatants);
      return {
        ...state,
        combat: {
          isActive: publicCombatants.length > 0,
          combatants: publicCombatants,
          currentTurnIndex: action.payload.currentTurnIndex ?? state.combat.currentTurnIndex,
          roundCount: action.payload.roundCount ?? state.combat.roundCount,
        },
      };
    }

    case 'UPDATE_SCENE': {
      return {
        ...state,
        scene: {
          ...state.scene,
          ...action.payload,
        },
      };
    }

    case 'ADD_CHAT': {
      // Only show In-Character (IC) or General broadcast chat on overlay
      if (action.payload.channel === 'whisper') return state;
      const updatedChat = [...state.chatMessages, action.payload].slice(-4);
      return {
        ...state,
        chatMessages: updatedChat,
      };
    }

    default:
      return state;
  }
}
