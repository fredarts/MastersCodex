'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Combatant, CombatLogEntry, PlayerRollEvent } from '@/lib/types';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { useCampaign } from '@/context/CampaignContext';

import { useBattleGridStore } from '@/lib/stores/useBattleGridStore';

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
  mapData: unknown;
  setMapData: React.Dispatch<React.SetStateAction<unknown>>;
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
  combatLogs: CombatLogEntry[];
  setCombatLogs: React.Dispatch<React.SetStateAction<CombatLogEntry[]>>;
  broadcastCombatLogEntry: (entry: CombatLogEntry) => void;
  broadcastPlayerRoll: (roll: PlayerRollEvent) => void;
}

const LiveCockpitContext = createContext<LiveCockpitContextType | undefined>(undefined);

export const LiveCockpitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveDisplayMode, setLiveDisplayModeState] = useState<'artwork' | 'map' | 'combat'>('artwork');
  
  const tokenPositions3D = useBattleGridStore((state) => state.tokenPositions3D);
  const tokenRotations3D = useBattleGridStore((state) => state.tokenRotations3D);
  const storeUpdateTokenPosition3D = useBattleGridStore((state) => state.updateTokenPosition3D);
  const storeUpdateTokenRotation3D = useBattleGridStore((state) => state.updateTokenRotation3D);
  const storeSetTokenPositions3D = useBattleGridStore((state) => state.setTokenPositions3D);
  const storeSetTokenRotations3D = useBattleGridStore((state) => state.setTokenRotations3D);
  const storeInitializeFromCombatants = useBattleGridStore((state) => state.initializeFromCombatants);
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [projectedScene, setProjectedScene] = useState<any>(null);
  const [mapData, setMapData] = useState<unknown>(null);
  const [activeSpellTargeting, setActiveSpellTargetingState] = useState<any>(null);
  const [casterTokenKey, setCasterTokenKeyState] = useState<string | null>(null);
  const [spellTargetPosition, setSpellTargetPositionState] = useState<{ x: number; z: number } | null>(null);
  const [activeSheets, setActiveSheets] = useState<ActiveSheetState[]>([]);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);

  // Ref to track the last synchronized combat state to avoid feedback loops
  const lastSyncStateRef = useRef<{
    combatants: Combatant[];
    currentTurnIndex: number;
    roundCount: number;
  } | null>(null);

  // Active campaign ID for Supabase WebSocket channels
  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id || 'camp-demo-1';

  // Helper to compare combat states
  const isCombatStateEqual = useCallback((
    a: typeof lastSyncStateRef.current,
    b: { combatants: Combatant[]; currentTurnIndex: number; roundCount: number }
  ) => {
    if (!a) return false;
    if (a.currentTurnIndex !== b.currentTurnIndex) return false;
    if (a.roundCount !== b.roundCount) return false;
    if (a.combatants.length !== b.combatants.length) return false;
    
    for (let i = 0; i < a.combatants.length; i++) {
      const cA = a.combatants[i];
      const cB = b.combatants[i];
      if (cA.id !== cB.id) return false;
      if (cA.name !== cB.name) return false;
      if (cA.hp !== cB.hp) return false;
      if (cA.maxHp !== cB.maxHp) return false;
      if (cA.initiative !== cB.initiative) return false;
      if (cA.actionUsed !== cB.actionUsed) return false;
      if (cA.bonusActionUsed !== cB.bonusActionUsed) return false;
      if (cA.reactionUsed !== cB.reactionUsed) return false;
      if (cA.movementUsed !== cB.movementUsed) return false;
      if (cA.hasDashed !== cB.hasDashed) return false;
      if (cA.x !== cB.x || cA.z !== cB.z) return false;
      if ((cA.conditions || []).join(',') !== (cB.conditions || []).join(',')) return false;
    }
    return true;
  }, []);

  const handleLiveProjectionChange = useCallback((payload: any) => {
    if (payload.mode) setLiveDisplayModeState(payload.mode);
    if (payload.activeSpellTargeting !== undefined) setActiveSpellTargetingState(payload.activeSpellTargeting);
    if (payload.casterTokenKey !== undefined) setCasterTokenKeyState(payload.casterTokenKey);
    if (payload.spellTargetPosition !== undefined) setSpellTargetPositionState(payload.spellTargetPosition);
    if (payload.mapData !== undefined) {
      const data = payload.mapData;
      if (data && data.fogMatrix) {
        setMapData((prev: any) => {
          if (!prev || prev.activeMapId !== data.activeMapId || !prev.grid) return prev;
          const gridCopy = prev.grid.map((row: any[]) => row.map(cell => ({ ...cell })));
          
          // 1. Clear old tokens from gridCopy
          for (let r = 0; r < gridCopy.length; r++) {
            for (let c = 0; c < gridCopy[r].length; c++) {
              gridCopy[r][c].tokenName = undefined;
              gridCopy[r][c].tokenColor = undefined;
            }
          }
          
          // 2. Put tokens in their new cells
          if (data.tokens) {
            for (const tk of data.tokens) {
              if (gridCopy[tk.r]?.[tk.c]) {
                gridCopy[tk.r][tk.c].tokenName = tk.name;
                gridCopy[tk.r][tk.c].tokenColor = tk.color;
              }
            }
          }

          // 3. Unpack fogMatrix string back into the grid cells
          let idx = 0;
          for (let r = 0; r < gridCopy.length; r++) {
            for (let c = 0; c < gridCopy[r].length; c++) {
              const char = data.fogMatrix[idx++];
              if (char === '0') gridCopy[r][c].fog = false;
              else if (char === '1') gridCopy[r][c].fog = true;
            }
          }
          return {
            ...prev,
            grid: gridCopy
          };
        });
      } else {
        setMapData(data);
      }
    }

    const sceneData = payload.payload || payload;
    const sceneId = sceneData.sceneId !== undefined ? sceneData.sceneId : sceneData.id;

    if (
      sceneId !== undefined ||
      sceneData.imageUrl !== undefined ||
      sceneData.title !== undefined ||
      sceneData.timeOfDayHour !== undefined ||
      sceneData.timeOfDay !== undefined ||
      sceneData.hasFog !== undefined ||
      sceneData.hasRain !== undefined ||
      sceneData.floorTextureUrl !== undefined
    ) {
      setProjectedScene((prev: any) => {
        if (sceneId === null) return null;
        const base = (prev && prev.id === sceneId) ? prev : {};
        return {
          ...base,
          id: sceneId !== undefined ? sceneId : base.id,
          title: sceneData.title !== undefined ? sceneData.title : base.title,
          imageUrl: sceneData.imageUrl !== undefined ? sceneData.imageUrl : base.imageUrl,
          sensoryText: sceneData.sensoryText !== undefined ? sceneData.sensoryText : base.sensoryText,
          sceneImages: sceneData.sceneImages !== undefined ? sceneData.sceneImages : base.sceneImages || [],
          activeImageIndex: sceneData.activeImageIndex !== undefined ? sceneData.activeImageIndex : base.activeImageIndex ?? 0,
          timeOfDay: sceneData.timeOfDay !== undefined ? sceneData.timeOfDay : base.timeOfDay,
          timeOfDayHour: sceneData.timeOfDayHour !== undefined ? sceneData.timeOfDayHour : base.timeOfDayHour,
          hasFog: sceneData.hasFog !== undefined ? sceneData.hasFog : base.hasFog,
          hasRain: sceneData.hasRain !== undefined ? sceneData.hasRain : base.hasRain,
          floorTextureUrl: sceneData.floorTextureUrl !== undefined ? sceneData.floorTextureUrl : base.floorTextureUrl,
          associatedMapId: sceneData.associatedMapId !== undefined ? sceneData.associatedMapId : base.associatedMapId,
          associatedMapIds: sceneData.associatedMapIds !== undefined ? sceneData.associatedMapIds : base.associatedMapIds,
        };
      });
    }
  }, []);

  // Realtime Sync Hook
  const {
    broadcastTokenMove,
    broadcastTokenRotate,
    broadcastLiveProjection,
    broadcastDiceRoll,
    broadcastCombatUpdate,
    broadcastCombatLogEntry: syncBroadcastCombatLogEntry,
    broadcastPlayerRoll: syncBroadcastPlayerRoll,
  } = useRealtimeSync({
    campaignId,
    onTokenMove: (payload) => {
      const targetKey = payload.combatantId || payload.characterName;
      if (targetKey) {
        storeSetTokenPositions3D((prev) => ({
          ...prev,
          [targetKey]: { x: payload.newX, z: payload.newZ },
        }));
      }
    },
    onTokenRotate: (payload) => {
      const targetKey = payload.combatantId || payload.characterName;
      if (targetKey && payload.angle !== undefined) {
        storeSetTokenRotations3D((prev) => ({
          ...prev,
          [targetKey]: payload.angle,
        }));
      }
    },
    onLiveProjectionChange: handleLiveProjectionChange,
    onCombatUpdate: (payload) => {
      const newState = {
        combatants: payload.combatants,
        currentTurnIndex: payload.currentTurnIndex,
        roundCount: payload.roundCount,
      };

      // Set the ref immediately so that when the state update schedules a render, the sync useEffect can check it
      lastSyncStateRef.current = newState;

      if (payload.combatants) setCombatants(payload.combatants);
      if (payload.currentTurnIndex !== undefined) setCurrentTurnIndex(payload.currentTurnIndex);
      if (payload.roundCount !== undefined) setRoundCount(payload.roundCount);
    },
    onCombatLogEntry: (payload) => {
      if (payload.entry) {
        setCombatLogs((prev) => {
          if (prev.some((l) => l.id === payload.entry.id)) return prev;
          return [...prev, payload.entry];
        });
      }
    },
    onPlayerRoll: (payload) => {
      if (payload.roll) {
        const r = payload.roll;
        const entry: CombatLogEntry = {
          id: r.id || `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: r.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          round: roundCount,
          actorId: r.characterName,
          actorName: r.characterName,
          eventType: r.rollType === 'attack' ? 'attack' : 'system',
          d20Roll: r.d20Roll,
          totalRoll: r.total,
          isCrit: r.isCrit,
          isFail: r.isFail,
          description: `[JOGADOR] ${r.characterName} rolou ${r.label}: d20(${r.d20Roll}) ${r.modifier >= 0 ? '+' : ''}${r.modifier} = Total ${r.total}`,
        };
        setCombatLogs((prev) => [...prev, entry]);
      }
    },
  });

  // Sincroniza estado de combate em tempo real do Mestre para os Jogadores
  useEffect(() => {
    if (activeCampaign?.role === 'dm') {
      const currentState = { combatants, currentTurnIndex, roundCount };
      
      // If the current state matches the last synced state, do not broadcast (prevents feedback loop)
      if (isCombatStateEqual(lastSyncStateRef.current, currentState)) {
        return;
      }

      // Update the ref to prevent echo
      lastSyncStateRef.current = currentState;

      broadcastCombatUpdate(currentState);
    }
  }, [combatants, currentTurnIndex, roundCount, activeCampaign?.role, broadcastCombatUpdate, isCombatStateEqual]);

  const setLiveDisplayMode = useCallback((mode: 'artwork' | 'map' | 'combat') => {
    setLiveDisplayModeState(mode);
    broadcastLiveProjection({ mode });
  }, [broadcastLiveProjection]);

  const broadcastToPlayerView = useCallback((payload: any) => {
    // Apply locally for same-tab PlayerViewModal (broadcasts don't reach same tab)
    handleLiveProjectionChange(payload);
    broadcastLiveProjection(payload);
  }, [broadcastLiveProjection, handleLiveProjectionChange]);

  const setActiveSpellTargeting = useCallback((targeting: any) => {
    setActiveSpellTargetingState(targeting);
    broadcastToPlayerView({ activeSpellTargeting: targeting });
  }, [broadcastToPlayerView]);

  const setCasterTokenKey = useCallback((key: string | null) => {
    setCasterTokenKeyState(key);
    broadcastToPlayerView({ casterTokenKey: key });
  }, [broadcastToPlayerView]);

  const setSpellTargetPosition = useCallback((pos: { x: number; z: number } | null) => {
    setSpellTargetPositionState(pos);
    broadcastToPlayerView({ spellTargetPosition: pos });
  }, [broadcastToPlayerView]);

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
    storeInitializeFromCombatants(combatants);
  }, [storeInitializeFromCombatants]);

  const updateTokenPosition3D = (
    idOrName: string,
    deltaX?: number,
    deltaZ?: number,
    newX?: number,
    newZ?: number
  ) => {
    storeUpdateTokenPosition3D(idOrName, deltaX, deltaZ, newX, newZ, (id, x, z) => {
      broadcastTokenMove({
        combatantId: id,
        characterName: id,
        newX: x,
        newZ: z,
      });
    });
  };

  const updateTokenRotation3D = (idOrName: string, angleInDegrees: number) => {
    storeUpdateTokenRotation3D(idOrName, angleInDegrees, (id, angle) => {
      broadcastTokenRotate({
        combatantId: id,
        characterName: id,
        angle,
      });
    });
  };

  const broadcastCombatLogEntry = useCallback((entry: CombatLogEntry) => {
    syncBroadcastCombatLogEntry({ entry });
  }, [syncBroadcastCombatLogEntry]);

  const broadcastPlayerRoll = useCallback((roll: PlayerRollEvent) => {
    syncBroadcastPlayerRoll({ roll });
  }, [syncBroadcastPlayerRoll]);

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
        mapData,
        setMapData,
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
        combatLogs,
        setCombatLogs,
        broadcastCombatLogEntry,
        broadcastPlayerRoll,
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
