import { create } from 'zustand';
import { Combatant } from '@/lib/types';

export interface BattleGridStoreState {
  tokenPositions3D: Record<string, { x: number; z: number }>;
  tokenRotations3D: Record<string, number>;
  
  updateTokenPosition3D: (
    idOrName: string,
    deltaX?: number,
    deltaZ?: number,
    newX?: number,
    newZ?: number,
    onBroadcast?: (idOrName: string, x: number, z: number) => void
  ) => void;
  
  updateTokenRotation3D: (
    idOrName: string,
    angleInDegrees: number,
    onBroadcast?: (idOrName: string, angle: number) => void
  ) => void;

  setTokenPositions3D: (positions: Record<string, { x: number; z: number }> | ((prev: Record<string, { x: number; z: number }>) => Record<string, { x: number; z: number }>)) => void;
  setTokenRotations3D: (rotations: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;

  initializeFromCombatants: (combatants: Combatant[]) => void;
}

export const useBattleGridStore = create<BattleGridStoreState>((set, get) => ({
  tokenPositions3D: {},
  tokenRotations3D: {},

  updateTokenPosition3D: (idOrName, deltaX, deltaZ, newX, newZ, onBroadcast) => {
    const current = get().tokenPositions3D[idOrName] || { x: 0, z: 0 };
    const nextX = newX !== undefined ? newX : Math.max(-5, Math.min(5, current.x + (deltaX || 0)));
    const nextZ = newZ !== undefined ? newZ : Math.max(-5, Math.min(5, current.z + (deltaZ || 0)));

    set((state) => ({
      tokenPositions3D: {
        ...state.tokenPositions3D,
        [idOrName]: { x: nextX, z: nextZ },
      },
    }));

    if (onBroadcast) {
      onBroadcast(idOrName, nextX, nextZ);
    }
  },

  updateTokenRotation3D: (idOrName, angleInDegrees, onBroadcast) => {
    const normalizedAngle = ((angleInDegrees % 360) + 360) % 360;

    set((state) => ({
      tokenRotations3D: {
        ...state.tokenRotations3D,
        [idOrName]: normalizedAngle,
      },
    }));

    if (onBroadcast) {
      onBroadcast(idOrName, normalizedAngle);
    }
  },

  setTokenPositions3D: (positions) => {
    set((state) => ({
      tokenPositions3D: typeof positions === 'function' ? positions(state.tokenPositions3D) : positions,
    }));
  },

  setTokenRotations3D: (rotations) => {
    set((state) => ({
      tokenRotations3D: typeof rotations === 'function' ? rotations(state.tokenRotations3D) : rotations,
    }));
  },

  initializeFromCombatants: (combatants) => {
    if (!combatants || combatants.length === 0) return;

    const posMap: Record<string, { x: number; z: number }> = {};
    const rotMap: Record<string, number> = {};

    combatants.forEach((c) => {
      const key = c.id || c.name;
      if (c.x !== undefined && c.z !== undefined) {
        posMap[key] = { x: c.x, z: c.z };
      }
      if (c.rotation !== undefined) {
        rotMap[key] = c.rotation;
      }
    });

    if (Object.keys(posMap).length > 0) {
      set((state) => ({ tokenPositions3D: { ...state.tokenPositions3D, ...posMap } }));
    }
    if (Object.keys(rotMap).length > 0) {
      set((state) => ({ tokenRotations3D: { ...state.tokenRotations3D, ...rotMap } }));
    }
  },
}));
