'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Combatant, CombatLogEntry, ChatMessage, PlayerRollEvent, DmCursorPayload, PingLocationPayload, VoiceSignalPayload, PresencePayload } from '@/lib/types';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { useCampaign } from '@/context/CampaignContext';
import { useAuth } from '@/context/AuthContext';
import { useSession } from '@/context/SessionContext';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { setGlobalBroadcaster } from '@/lib/dnd5e-dice';
import { CRDTSolver } from '@/lib/sync/CRDTSolver';

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
  broadcastCombatUpdate: (payload: any) => void;
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
  chatMessages: ChatMessage[];
  broadcastChatMessage: (message: ChatMessage) => void;
  onlineUsers: { userId: string; displayName: string; avatarUrl?: string; status: string }[];
  dmCursor: DmCursorPayload | null;
  broadcastDmCursor: (payload: DmCursorPayload) => void;
  pings: PingLocationPayload[];
  broadcastPingLocation: (payload: PingLocationPayload) => void;
  removePing: (id: string) => void;
  voiceSignal: VoiceSignalPayload | null;
  broadcastVoiceSignal: (payload: VoiceSignalPayload) => void;
  broadcastPresenceUpdate: (payload: PresencePayload) => void;
  broadcastStateRequest: (payload?: { requesterId?: string }) => void;
  drawings: any[];
  broadcastDrawingAction: (payload: any) => void;
  updateCombatantState: (id: string, update: Partial<Combatant>) => void;
  selectedTargetId: string | null;
  setSelectedTargetId: React.Dispatch<React.SetStateAction<string | null>>;
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
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [activeSheets, setActiveSheets] = useState<ActiveSheetState[]>([]);
  const [combatLogs, setCombatLogs] = useState<CombatLogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ userId: string; displayName: string; avatarUrl?: string; status: string }[]>([]);
  const [dmCursor, setDmCursor] = useState<DmCursorPayload | null>(null);
  const [pings, setPings] = useState<PingLocationPayload[]>([]);
  const [voiceSignal, setVoiceSignal] = useState<VoiceSignalPayload | null>(null);
  const [drawings, setDrawings] = useState<any[]>([]);

  // Ref to track the last synchronized combat state to avoid feedback loops
  const lastSyncStateRef = useRef<{
    combatants: Combatant[];
    currentTurnIndex: number;
    roundCount: number;
  } | null>(null);

  const lastTokenMoveTimesRef = useRef<Record<string, number>>({});
  const lastTokenRotateTimesRef = useRef<Record<string, number>>({});
  const broadcastCombatUpdateRef = useRef<((payload: any) => void) | null>(null);

  // Active campaign ID for Supabase WebSocket channels
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const { activeScene, updateScene } = useSession();
  const campaignId = activeCampaign?.id || ((!user || user.id === 'user-demo') ? 'camp-demo-1' : null);

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
    if (payload.targetId !== undefined) setSelectedTargetId(payload.targetId);
    
    if (payload.mapData !== undefined) {
      const data = payload.mapData;
      if (data && data.grid && Array.isArray(data.grid) && data.grid.length > 0) {
        setMapData(data);
      } else if (data && data.fogMatrix) {
        setMapData((prev: any) => {
          if (!prev || prev.activeMapId !== data.activeMapId || !prev.grid) return data;
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
            grid: gridCopy,
            bgImageUrl: data.bgImageUrl !== undefined ? data.bgImageUrl : prev.bgImageUrl,
            gridScale: data.gridScale !== undefined ? data.gridScale : prev.gridScale,
            gridOffsetX: data.gridOffsetX !== undefined ? data.gridOffsetX : prev.gridOffsetX,
            gridOffsetY: data.gridOffsetY !== undefined ? data.gridOffsetY : prev.gridOffsetY,
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
      sceneData.floorTextureUrl !== undefined ||
      sceneData.environmentSettings !== undefined
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
          environmentSettings: sceneData.environmentSettings !== undefined ? sceneData.environmentSettings : base.environmentSettings,
          associatedMapId: sceneData.associatedMapId !== undefined ? sceneData.associatedMapId : base.associatedMapId,
          associatedMapIds: sceneData.associatedMapIds !== undefined ? sceneData.associatedMapIds : base.associatedMapIds,
        };
      });
    }

    if (payload.combatants !== undefined) {
      setCombatants(payload.combatants);
      storeInitializeFromCombatants(payload.combatants);
    }
    if (payload.currentTurnIndex !== undefined) {
      setCurrentTurnIndex(payload.currentTurnIndex);
    }
    if (payload.roundCount !== undefined) {
      setRoundCount(payload.roundCount);
    }

    if (payload.type === 'CHARACTER_MODEL_UPDATED' && payload.characterModelUpdated !== undefined) {
      const sheet = payload.characterModelUpdated;
      if (sheet && sheet.characterName) {
        const updatedModelUrl =
          sheet.modelUrl || getModelUrlByNameOrPath(sheet.className || sheet.characterName);
        const updatedTokenType: 'billboard' | '3d' = sheet.tokenType || '3d';
        const updatedAvatarUrl: string | undefined = sheet.avatarUrl;

        setCombatants((prev) => {
          let hasChanges = false;
          const next = prev.map((c) => {
            const cClean = c.name.split('(')[0].trim().toLowerCase();
            const sheetClean = (sheet.characterName || '').split('(')[0].trim().toLowerCase();
            const isMatch =
              cClean === sheetClean ||
              c.name.toLowerCase().includes(sheetClean) ||
              sheet.characterName?.toLowerCase().includes(cClean) ||
              (sheet.id && c.id.includes(sheet.id));

            if (isMatch) {
              if (c.modelUrl !== updatedModelUrl || c.tokenType !== updatedTokenType || c.avatarUrl !== updatedAvatarUrl) {
                hasChanges = true;
                return {
                  ...c,
                  modelUrl: updatedModelUrl,
                  tokenType: updatedTokenType,
                  tokenImageUrl: updatedTokenType === 'billboard' ? updatedAvatarUrl : undefined,
                  avatarUrl: updatedAvatarUrl,
                };
              }
            }
            return c;
          });

          if (hasChanges) {
            const isDm = activeCampaign?.role === 'dm';
            if (isDm && activeScene && updateScene) {
              updateScene({
                ...activeScene,
                combatants: next,
              });
              if (broadcastCombatUpdateRef.current) {
                broadcastCombatUpdateRef.current({
                  combatants: next,
                  currentTurnIndex,
                  roundCount,
                });
              }
            }
            return next;
          }
          return prev;
        });
      }
    }
  }, [storeInitializeFromCombatants, activeCampaign, activeScene, updateScene, currentTurnIndex, roundCount]);

  // Realtime Sync Hook
  const {
    sendBroadcast,
    broadcastTokenMove,
    broadcastTokenRotate,
    broadcastLiveProjection,
    broadcastDiceRoll,
    broadcastCombatUpdate,
    broadcastCombatLogEntry: syncBroadcastCombatLogEntry,
    broadcastPlayerRoll: syncBroadcastPlayerRoll,
    broadcastChatMessage: syncBroadcastChatMessage,
    broadcastDmCursor: syncBroadcastDmCursor,
    broadcastPingLocation: syncBroadcastPingLocation,
    broadcastVoiceSignal: syncBroadcastVoiceSignal,
    broadcastPresenceUpdate: syncBroadcastPresenceUpdate,
    broadcastStateRequest,
    broadcastStateSnapshot,
    broadcastDrawingAction: syncBroadcastDrawingAction,
  } = useRealtimeSync({
    campaignId,
    onTokenMove: (payload) => {
      const targetKey = payload.combatantId || payload.characterName;
      if (targetKey) {
        const remoteTime = payload.timestamp || Date.now();
        const localLastModified = lastTokenMoveTimesRef.current[targetKey] || 0;
        if (CRDTSolver.shouldApplyRemoteEvent(localLastModified, remoteTime)) {
          lastTokenMoveTimesRef.current[targetKey] = remoteTime;
          storeSetTokenPositions3D((prev) => ({
            ...prev,
            [targetKey]: { x: payload.newX, z: payload.newZ },
          }));
        }
      }
    },
    onTokenRotate: (payload) => {
      const targetKey = payload.combatantId || payload.characterName;
      if (targetKey && payload.angle !== undefined) {
        const remoteTime = payload.timestamp || Date.now();
        const localLastModified = lastTokenRotateTimesRef.current[targetKey] || 0;
        if (CRDTSolver.shouldApplyRemoteEvent(localLastModified, remoteTime)) {
          lastTokenRotateTimesRef.current[targetKey] = remoteTime;
          storeSetTokenRotations3D((prev) => ({
            ...prev,
            [targetKey]: payload.angle,
          }));
        }
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

      if (payload.combatants) {
        setCombatants(payload.combatants);
        storeInitializeFromCombatants(payload.combatants);
      }
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
    onDrawingAction: (payload) => {
      if (payload.action === 'add' && payload.stroke) {
        setDrawings(prev => [...prev, payload.stroke]);
      } else if (payload.action === 'clear') {
        setDrawings([]);
      } else if (payload.action === 'undo') {
        setDrawings(prev => prev.slice(0, -1));
      } else if (payload.action === 'remove' && payload.strokeId) {
        setDrawings(prev => prev.filter(s => s.id !== payload.strokeId));
      }
    },
    onPlayerRoll: (payload) => {
      if (payload.roll) {
        const r = payload.roll as any;
        const d20Val = r.d20Roll1 ?? r.d20Roll ?? r.roll;
        const entry: CombatLogEntry = {
          id: r.id || `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: r.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          round: roundCount,
          actorId: r.characterName,
          actorName: r.characterName,
          eventType: r.rollType === 'attack' ? 'attack' : 'system',
          d20Roll: d20Val,
          totalRoll: r.total,
          isCrit: r.isCrit,
          isFail: r.isFail,
          description: `[JOGADOR] ${r.characterName} rolou ${r.label}${d20Val !== undefined ? `: d20(${d20Val}) ${r.modifier >= 0 ? '+' : ''}${r.modifier} = Total ${r.total}` : ''}${r.damageDice ? ` [Dano: ${r.damageDice}]` : ''}`,
        };
        setCombatLogs((prev) => {
          if (prev.some((l) => l.id === entry.id)) return prev;
          return [...prev, entry];
        });
      }
    },
    onChatMessage: (payload) => {
      if (payload.message) {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
      }
    },
    onPresenceUpdate: (payload) => {
      setOnlineUsers((prev) => {
        if (payload.status === 'offline') {
          return prev.filter((u) => u.userId !== payload.userId);
        }
        
        const idx = prev.findIndex((u) => u.userId === payload.userId);
        if (payload.status === 'online' || payload.status === 'speaking') {
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = payload;
            return next;
          }
          return [...prev, payload];
        }
        
        return prev;
      });
    },
    onDmCursor: (payload) => {
      setDmCursor(payload);
    },
    onPingLocation: (payload: any) => {
      if (payload.action === 'remove' && payload.id) {
        setPings((prev) => prev.filter((p: any) => p.id !== payload.id));
        return;
      }
      setPings((prev) => [...prev, payload]);
      // Play ping sound effect
      try {
        const audio = new Audio('/sounds/ping.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
    },
    onVoiceSignal: (payload) => {
      setVoiceSignal(payload);
    },
    onStateRequest: () => {
      // Quando um jogador pede snapshot, se eu for Mestre (ou tiver estado), envio o snapshot atual
      if (activeCampaign?.role === 'dm') {
        broadcastStateSnapshot({
          mode: liveDisplayMode,
          projectedScene,
          combatants,
          currentTurnIndex,
          roundCount,
          mapData,
          selectedTargetId,
        });
      }
    },
    onStateSnapshot: (snapshot) => {
      // Quando recebo o snapshot do Mestre, atualizo o estado local
      if (snapshot) {
        if (snapshot.mode) setLiveDisplayModeState(snapshot.mode);
        if (snapshot.projectedScene !== undefined) setProjectedScene(snapshot.projectedScene);
        if (snapshot.combatants) {
          setCombatants(snapshot.combatants);
          storeInitializeFromCombatants(snapshot.combatants);
        }
        if (snapshot.currentTurnIndex !== undefined) setCurrentTurnIndex(snapshot.currentTurnIndex);
        if (snapshot.roundCount !== undefined) setRoundCount(snapshot.roundCount);
        if (snapshot.mapData !== undefined) setMapData(snapshot.mapData);
        if (snapshot.selectedTargetId !== undefined) setSelectedTargetId(snapshot.selectedTargetId);
      }
    },
  });

  // Sync the ref immediately after initialization
  useEffect(() => {
    broadcastCombatUpdateRef.current = broadcastCombatUpdate;
  }, [broadcastCombatUpdate]);

  // Carrega estado persistido localmente ao inicializar
  useEffect(() => {
    if (typeof window !== 'undefined' && campaignId) {
      const savedMode = localStorage.getItem(`masters_codex_display_mode_${campaignId}`);
      if (savedMode === 'artwork' || savedMode === 'map' || savedMode === 'combat') {
        setLiveDisplayModeState(savedMode);
      }
      const savedProj = localStorage.getItem(`masters_codex_live_projection_${campaignId}`);
      if (savedProj) {
        try {
          setProjectedScene(JSON.parse(savedProj));
        } catch (e) {}
      }
    }
  }, [campaignId]);

  // Persiste modo de exibição e projeção de cena
  useEffect(() => {
    if (typeof window !== 'undefined' && campaignId) {
      localStorage.setItem(`masters_codex_display_mode_${campaignId}`, liveDisplayMode);
    }
  }, [liveDisplayMode, campaignId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && campaignId && projectedScene) {
      try {
        localStorage.setItem(`masters_codex_live_projection_${campaignId}`, JSON.stringify(projectedScene));
      } catch (e) {}
    }
  }, [projectedScene, campaignId]);

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

  // Sincroniza target selecionado
  useEffect(() => {
    if (activeCampaign?.role === 'dm') {
      broadcastLiveProjection({ targetId: selectedTargetId });
    }
  }, [selectedTargetId, activeCampaign?.role, broadcastLiveProjection]);

  // Presence Heartbeat
  useEffect(() => {
    if (!campaignId) return;
    
    // Identificação básica do usuário
    const myId = user?.id || `guest-${Math.random().toString(36).substring(2, 9)}`;
    let myName = user?.displayName || user?.user_metadata?.full_name || user?.email || (activeCampaign?.role === 'dm' ? 'Mestre' : 'Jogador');
    let avatarUrl = user?.avatarUrl || user?.user_metadata?.avatar_url;
    let avatarSettings: { zoom: number; offsetX: number; offsetY: number } | undefined;

    // Se for jogador, tenta pegar o nome e o avatar da ficha ativa salva localmente
    if (activeCampaign?.role === 'player') {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          const expectedCharName = activeCampaign.characterName || 'Aventureiro';
          
          const found = parsed.find((s: any) => 
            (activeCampaign.id && s.campaignId === activeCampaign.id) ||
            (s.characterName && s.characterName.toLowerCase() === expectedCharName.toLowerCase())
          );
          
          if (found) {
            if (found.characterName && found.characterName !== 'Novo Aventureiro') {
              myName = found.characterName;
            }
            if (found.avatarUrl) {
              avatarUrl = found.avatarUrl;
            }
            if (found.avatarSettings) {
              avatarSettings = found.avatarSettings;
            }
          }
        }
      } catch (e) {}
    }

    const pingPresence = () => {
      syncBroadcastPresenceUpdate({
        userId: myId,
        displayName: myName,
        avatarUrl,
        avatarSettings,
        status: 'online',
        timestamp: Date.now(),
      });
    };

    // Primeiro ping com um pequeno delay para garantir que o websocket está conectado
    const timer = setTimeout(pingPresence, 1500);
    // Repetir a cada 10 segundos
    const interval = setInterval(pingPresence, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      syncBroadcastPresenceUpdate({
        userId: myId,
        displayName: myName,
        status: 'offline',
        timestamp: Date.now(),
      });
    };
  }, [campaignId, user, syncBroadcastPresenceUpdate, activeCampaign?.role]);

  // Register global broadcaster so pure TS modules (dnd5e-dice.ts) can reach Supabase
  useEffect(() => {
    setGlobalBroadcaster(sendBroadcast);
    return () => setGlobalBroadcaster(() => {});
  }, [sendBroadcast]);

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

  const removePing = useCallback((id: string) => {
    setPings((prev) => prev.filter((p: any) => p.id !== id));
    syncBroadcastPingLocation({ action: 'remove', id } as any);
  }, [syncBroadcastPingLocation]);

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
      const now = Date.now();
      lastTokenMoveTimesRef.current[id] = now;
      broadcastTokenMove({
        combatantId: id,
        characterName: id,
        newX: x,
        newZ: z,
        timestamp: now,
      });
    });
  };

  const updateTokenRotation3D = (idOrName: string, angleInDegrees: number) => {
    storeUpdateTokenRotation3D(idOrName, angleInDegrees, (id, angle) => {
      const now = Date.now();
      lastTokenRotateTimesRef.current[id] = now;
      broadcastTokenRotate({
        combatantId: id,
        characterName: id,
        angle,
        timestamp: now,
      });
    });
  };

  const broadcastCombatLogEntry = useCallback((entry: CombatLogEntry) => {
    syncBroadcastCombatLogEntry({ entry });
  }, [syncBroadcastCombatLogEntry]);

  const broadcastPlayerRoll = useCallback((roll: PlayerRollEvent) => {
    const r = roll as any;
    const d20Val = r.d20Roll1 ?? r.d20Roll ?? r.roll;
    const entry: CombatLogEntry = {
      id: r.id || `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: r.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      round: roundCount,
      actorId: r.characterName,
      actorName: r.characterName,
      eventType: r.rollType === 'attack' ? 'attack' : 'system',
      d20Roll: d20Val,
      totalRoll: r.total,
      isCrit: r.isCrit,
      isFail: r.isFail,
      description: `[JOGADOR] ${r.characterName} rolou ${r.label}${d20Val !== undefined ? `: d20(${d20Val}) ${r.modifier >= 0 ? '+' : ''}${r.modifier} = Total ${r.total}` : ''}${r.damageDice ? ` [Dano: ${r.damageDice}]` : ''}`,
    };
    setCombatLogs((prev) => {
      if (prev.some((l) => l.id === entry.id)) return prev;
      return [...prev, entry];
    });
    syncBroadcastPlayerRoll({ roll });
  }, [roundCount, syncBroadcastPlayerRoll]);

  const broadcastChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
    syncBroadcastChatMessage({ message });
  }, [syncBroadcastChatMessage]);

  const broadcastDmCursor = useCallback((payload: DmCursorPayload) => {
    syncBroadcastDmCursor(payload);
  }, [syncBroadcastDmCursor]);

  const broadcastPingLocation = useCallback((payload: PingLocationPayload) => {
    setPings((prev) => [...prev, payload]);
    syncBroadcastPingLocation(payload);
  }, [syncBroadcastPingLocation]);

  const broadcastVoiceSignal = useCallback((payload: VoiceSignalPayload) => {
    syncBroadcastVoiceSignal(payload);
  }, [syncBroadcastVoiceSignal]);

  const broadcastPresenceUpdate = useCallback((payload: PresencePayload) => {
    syncBroadcastPresenceUpdate(payload);
  }, [syncBroadcastPresenceUpdate]);

  const handleDrawingAction = useCallback((payload: any) => {
    if (payload.action === 'add' && payload.stroke) {
      setDrawings(prev => [...prev, payload.stroke]);
    } else if (payload.action === 'clear') {
      setDrawings([]);
    } else if (payload.action === 'undo') {
      setDrawings(prev => prev.slice(0, -1));
    } else if (payload.action === 'remove' && payload.strokeId) {
      setDrawings(prev => prev.filter(s => s.id !== payload.strokeId));
    }
    syncBroadcastDrawingAction(payload);
  }, [syncBroadcastDrawingAction]);

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
        broadcastCombatUpdate,
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
        chatMessages,
        broadcastChatMessage,
        onlineUsers,
        dmCursor,
        broadcastDmCursor,
        pings,
        broadcastPingLocation,
        removePing,
        voiceSignal,
        broadcastVoiceSignal,
        broadcastPresenceUpdate,
        broadcastStateRequest,
        drawings,
        broadcastDrawingAction: handleDrawingAction,
        updateCombatantState: (id: string, update: Partial<Combatant>) => {
          setCombatants((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...update } : c))
          );
        },
        selectedTargetId,
        setSelectedTargetId,
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
