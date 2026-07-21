'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Combatant } from '@/lib/types';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { useCampaign } from '@/context/CampaignContext';

interface LiveCockpitContextType {
  liveDisplayMode: 'artwork' | 'map' | 'combat';
  setLiveDisplayMode: (mode: 'artwork' | 'map' | 'combat') => void;
  broadcastToPlayerView: (payload: any) => void;
  tokenPositions3D: Record<string, { x: number; z: number }>;
  updateTokenPosition3D: (idOrName: string, deltaX?: number, deltaZ?: number, newX?: number, newZ?: number) => void;
  tokenRotations3D: Record<string, number>;
  updateTokenRotation3D: (idOrName: string, angleInDegrees: number) => void;
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  currentTurnIndex: number;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  roundCount: number;
  setRoundCount: React.Dispatch<React.SetStateAction<number>>;
  broadcastDiceRoll: (roll: { rollerName: string; rollType: string; diceFormula: string; result: number; isCrit?: boolean; isFail?: boolean }) => void;
}

const LiveCockpitContext = createContext<LiveCockpitContextType | undefined>(undefined);

export const LiveCockpitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveDisplayMode, setLiveDisplayModeState] = useState<'artwork' | 'map' | 'combat'>('artwork');
  const [tokenPositions3D, setTokenPositions3D] = useState<Record<string, { x: number; z: number }>>({});
  const [tokenRotations3D, setTokenRotations3D] = useState<Record<string, number>>({});
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundCount, setRoundCount] = useState(1);

  // Active campaign ID for Supabase WebSocket channels
  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id || 'camp-demo-1';

  // Realtime Sync Hook
  const {
    broadcastTokenMove,
    broadcastTokenRotate,
    broadcastLiveProjection,
    broadcastDiceRoll,
    broadcastCombatUpdate,
  } = useRealtimeSync({
    campaignId,
    onTokenMove: (payload) => {
      const targetKey = payload.combatantId || payload.characterName;
      if (targetKey) {
        setTokenPositions3D((prev) => ({
          ...prev,
          [targetKey]: { x: payload.newX, z: payload.newZ },
        }));
      }
    },
    onTokenRotate: (payload) => {
      const targetKey = payload.combatantId || payload.characterName;
      if (targetKey && payload.angle !== undefined) {
        setTokenRotations3D((prev) => ({
          ...prev,
          [targetKey]: payload.angle,
        }));
      }
    },
    onLiveProjectionChange: (payload) => {
      if (payload.mode) setLiveDisplayModeState(payload.mode);
    },
    onCombatUpdate: (payload) => {
      if (payload.combatants) setCombatants(payload.combatants);
      if (payload.currentTurnIndex !== undefined) setCurrentTurnIndex(payload.currentTurnIndex);
      if (payload.roundCount !== undefined) setRoundCount(payload.roundCount);
    },
  });

  const setLiveDisplayMode = (mode: 'artwork' | 'map' | 'combat') => {
    setLiveDisplayModeState(mode);
    broadcastLiveProjection({ mode });
  };

  const broadcastToPlayerView = (payload: any) => {
    broadcastLiveProjection(payload);
  };

  const updateTokenPosition3D = (
    idOrName: string,
    deltaX?: number,
    deltaZ?: number,
    newX?: number,
    newZ?: number
  ) => {
    setTokenPositions3D((prev) => {
      const current = prev[idOrName] || { x: 0, z: 0 };
      const nextX = newX !== undefined ? newX : Math.max(-5, Math.min(5, current.x + (deltaX || 0)));
      const nextZ = newZ !== undefined ? newZ : Math.max(-5, Math.min(5, current.z + (deltaZ || 0)));
      const updated = { ...prev, [idOrName]: { x: nextX, z: nextZ } };

      broadcastTokenMove({
        combatantId: idOrName,
        characterName: idOrName,
        newX: nextX,
        newZ: nextZ,
      });

      return updated;
    });
  };

  const updateTokenRotation3D = (idOrName: string, angleInDegrees: number) => {
    const normalizedAngle = ((angleInDegrees % 360) + 360) % 360;
    setTokenRotations3D((prev) => {
      const updated = { ...prev, [idOrName]: normalizedAngle };

      broadcastTokenRotate({
        combatantId: idOrName,
        characterName: idOrName,
        angle: normalizedAngle,
      });

      return updated;
    });
  };

  return (
    <LiveCockpitContext.Provider
      value={{
        liveDisplayMode,
        setLiveDisplayMode,
        broadcastToPlayerView,
        tokenPositions3D,
        updateTokenPosition3D,
        tokenRotations3D,
        updateTokenRotation3D,
        combatants,
        setCombatants,
        currentTurnIndex,
        setCurrentTurnIndex,
        roundCount,
        setRoundCount,
        broadcastDiceRoll,
      }}
    >
      {children}
    </LiveCockpitContext.Provider>
  );
};

export const useLiveCockpit = () => {
  const context = useContext(LiveCockpitContext);
  if (!context) {
    throw new Error('useLiveCockpit must be used within a LiveCockpitProvider');
  }
  return context;
};
