'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Combatant } from '@/lib/types';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { useCampaign } from '@/context/CampaignContext';

export interface ActiveSheetState {
  id: string;
  type: 'pc' | 'monster' | 'npc';
  state: 'open' | 'minimized';
  characterName: string;
  data?: any;
}

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
  projectedScene: any;
  setProjectedScene: React.Dispatch<React.SetStateAction<any>>;
  /** Inicializa tokenPositions3D e tokenRotations3D a partir dos campos x/z/rotation dos combatants salvos no banco */
  initializeFromCombatants: (combatants: Combatant[]) => void;
  activeSpellTargeting: any;
  setActiveSpellTargeting: (targeting: any) => void;
  casterTokenKey: string | null;
  setCasterTokenKey: (key: string | null) => void;
  spellTargetPosition: { x: number; z: number } | null;
  setSpellTargetPosition: (pos: { x: number; z: number } | null) => void;
  activeSheets: ActiveSheetState[];
  openSheet: (id: string, type: 'pc' | 'player' | 'monster' | 'npc', name: string, data?: any) => void;
  minimizeSheet: (id: string) => void;
  maximizeSheet: (id: string) => void;
  closeSheet: (id: string) => void;
}

const LiveCockpitContext = createContext<LiveCockpitContextType | undefined>(undefined);

export const LiveCockpitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveDisplayMode, setLiveDisplayModeState] = useState<'artwork' | 'map' | 'combat'>('artwork');
  const [tokenPositions3D, setTokenPositions3D] = useState<Record<string, { x: number; z: number }>>({});
  const [tokenRotations3D, setTokenRotations3D] = useState<Record<string, number>>({});
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [projectedScene, setProjectedScene] = useState<any>(null);
  const [activeSpellTargeting, setActiveSpellTargetingState] = useState<any>(null);
  const [casterTokenKey, setCasterTokenKeyState] = useState<string | null>(null);
  const [spellTargetPosition, setSpellTargetPositionState] = useState<{ x: number; z: number } | null>(null);
  const [activeSheets, setActiveSheets] = useState<ActiveSheetState[]>([]);

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
      if (payload.activeSpellTargeting !== undefined) setActiveSpellTargetingState(payload.activeSpellTargeting);
      if (payload.casterTokenKey !== undefined) setCasterTokenKeyState(payload.casterTokenKey);
      if (payload.spellTargetPosition !== undefined) setSpellTargetPositionState(payload.spellTargetPosition);
      if (payload.sceneId !== undefined || payload.imageUrl !== undefined || payload.title !== undefined || payload.timeOfDayHour !== undefined || payload.timeOfDay !== undefined || payload.hasFog !== undefined || payload.hasRain !== undefined || payload.floorTextureUrl !== undefined) {
        setProjectedScene((prev: any) => {
          if (payload.sceneId === null) return null;
          const base = (prev && prev.id === payload.sceneId) ? prev : {};
          return {
            ...base,
            id: payload.sceneId !== undefined ? payload.sceneId : base.id,
            title: payload.title !== undefined ? payload.title : base.title,
            imageUrl: payload.imageUrl !== undefined ? payload.imageUrl : base.imageUrl,
            sensoryText: payload.sensoryText !== undefined ? payload.sensoryText : base.sensoryText,
            sceneImages: payload.sceneImages !== undefined ? payload.sceneImages : base.sceneImages || [],
            activeImageIndex: payload.activeImageIndex !== undefined ? payload.activeImageIndex : base.activeImageIndex ?? 0,
            timeOfDay: payload.timeOfDay !== undefined ? payload.timeOfDay : base.timeOfDay,
            timeOfDayHour: payload.timeOfDayHour !== undefined ? payload.timeOfDayHour : base.timeOfDayHour,
            hasFog: payload.hasFog !== undefined ? payload.hasFog : base.hasFog,
            hasRain: payload.hasRain !== undefined ? payload.hasRain : base.hasRain,
            floorTextureUrl: payload.floorTextureUrl !== undefined ? payload.floorTextureUrl : base.floorTextureUrl,
          };
        });
      }
    },
    onCombatUpdate: (payload) => {
      if (payload.combatants) setCombatants(payload.combatants);
      if (payload.currentTurnIndex !== undefined) setCurrentTurnIndex(payload.currentTurnIndex);
      if (payload.roundCount !== undefined) setRoundCount(payload.roundCount);
    },
  });

  // Sincroniza estado de combate em tempo real do Mestre para os Jogadores
  useEffect(() => {
    if (activeCampaign?.role === 'dm') {
      broadcastCombatUpdate({
        combatants,
        currentTurnIndex,
        roundCount,
      });
    }
  }, [combatants, currentTurnIndex, roundCount, activeCampaign?.role, broadcastCombatUpdate]);

  const setLiveDisplayMode = (mode: 'artwork' | 'map' | 'combat') => {
    setLiveDisplayModeState(mode);
    broadcastLiveProjection({ mode });
  };

  const broadcastToPlayerView = (payload: any) => {
    broadcastLiveProjection(payload);
  };

  const setActiveSpellTargeting = (targeting: any) => {
    setActiveSpellTargetingState(targeting);
    broadcastToPlayerView({ activeSpellTargeting: targeting });
  };

  const setCasterTokenKey = (key: string | null) => {
    setCasterTokenKeyState(key);
    broadcastToPlayerView({ casterTokenKey: key });
  };

  const setSpellTargetPosition = (pos: { x: number; z: number } | null) => {
    setSpellTargetPositionState(pos);
    broadcastToPlayerView({ spellTargetPosition: pos });
  };

  const openSheet = useCallback((id: string, type: 'pc' | 'player' | 'monster' | 'npc', name: string, data?: any) => {
    const normalizedType: 'pc' | 'monster' | 'npc' = (type as string) === 'player' ? 'pc' : (type as 'pc' | 'monster' | 'npc');
    setActiveSheets((prev) => {
      const exists = prev.find((s) => s.id === id || s.characterName === name);
      if (exists) {
        return prev.map((s) => (s.id === exists.id ? { ...s, type: normalizedType, state: 'open' as const } : s));
      }
      return [...prev, { id, type: normalizedType, state: 'open' as const, characterName: name, data }];
    });
  }, []);

  const minimizeSheet = useCallback((id: string) => {
    setActiveSheets((prev) => {
      const minimizedCount = prev.filter((s) => s.state === 'minimized').length;
      if (minimizedCount >= 3) {
        const oldestMinimized = prev.find((s) => s.state === 'minimized');
        if (oldestMinimized) {
          return prev
            .filter((s) => s.id !== oldestMinimized.id)
            .map((s) => (s.id === id ? { ...s, state: 'minimized' as const } : s));
        }
      }
      return prev.map((s) => (s.id === id ? { ...s, state: 'minimized' as const } : s));
    });
  }, []);

  const maximizeSheet = useCallback((id: string) => {
    setActiveSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, state: 'open' as const } : s))
    );
  }, []);

  const closeSheet = useCallback((id: string) => {
    setActiveSheets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** Popula os maps de posição/rotação a partir dos dados já salvos nos combatants (campos x, z, rotation) */
  const initializeFromCombatants = useCallback((combatants: Combatant[]) => {
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
      setTokenPositions3D((prev) => ({ ...prev, ...posMap }));
    }
    if (Object.keys(rotMap).length > 0) {
      setTokenRotations3D((prev) => ({ ...prev, ...rotMap }));
    }
  }, []);

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
        projectedScene,
        setProjectedScene,
        initializeFromCombatants,
        activeSpellTargeting,
        setActiveSpellTargeting,
        casterTokenKey,
        setCasterTokenKey,
        spellTargetPosition,
        setSpellTargetPosition,
        activeSheets,
        openSheet,
        minimizeSheet,
        maximizeSheet,
        closeSheet,
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
