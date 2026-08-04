'use client';

import { useEffect, useRef, useCallback } from 'react';
import { offlineQueue } from '@/lib/sync/OfflineQueueManager';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ChatMessage, CombatLogEntry, PlayerRollEvent, PartyLootSession, DirectTransferPayload, DmCursorPayload, PingLocationPayload, VoiceSignalPayload, PresencePayload } from '@/lib/types';

export interface RealtimeSyncPayloads {
  TOKEN_MOVE_3D: { combatantId: string; characterName?: string; newX: number; newZ: number; timestamp?: number };
  TOKEN_ROTATE_3D: { combatantId: string; characterName?: string; angle: number; timestamp?: number };
  LIVE_PROJECTION_UPDATE: { 
    type?: string;
    payload?: any;
    mode?: 'artwork' | 'map' | 'combat'; 
    sceneId?: string;
    title?: string;
    imageUrl?: string;
    sensoryText?: string;
    sceneImages?: any[];
    activeImageIndex?: number;
    combatants?: any[];
    timeOfDay?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
    timeOfDayHour?: number;
    hasFog?: boolean;
    hasRain?: boolean;
    floorTextureUrl?: string;
    associatedMapId?: string;
    associatedMapIds?: string[];
    activeSpellTargeting?: { name: string; range: number; shape: 'circle' | 'cone' | 'line' | 'fan' | 'target' | 'multi-target'; size: number } | null;
    casterTokenKey?: string | null;
    spellTargetPosition?: { x: number; z: number } | null;
    mapData?: any;
  };
  DICE_ROLL: { rollerName: string; rollType: string; diceFormula: string; result: number; isCrit?: boolean; isFail?: boolean; details?: any };
  COMBAT_UPDATE: { combatants: any[]; currentTurnIndex: number; roundCount: number };
  COMBAT_LOG_ENTRY: { entry: CombatLogEntry };
  PLAYER_ROLL: { roll: PlayerRollEvent };
  PARTY_LOOT_UPDATE: { session: PartyLootSession };
  PARTY_LOOT_CLOSE: { sessionId: string };
  DIRECT_TRANSFER: { transfer: DirectTransferPayload };
  CHAT_MESSAGE: { message: ChatMessage };
  DM_CURSOR: DmCursorPayload;
  PING_LOCATION: PingLocationPayload;
  VOICE_SIGNAL: VoiceSignalPayload;
  PRESENCE_UPDATE: PresencePayload;
  STATE_REQUEST: { requesterId?: string };
  STATE_SNAPSHOT: {
    mode?: 'artwork' | 'map' | 'combat';
    projectedScene?: any;
    combatants?: any[];
    currentTurnIndex?: number;
    roundCount?: number;
    mapData?: any;
  };
}

export interface UseRealtimeSyncOptions {
  campaignId?: string | null;
  onTokenMove?: (payload: RealtimeSyncPayloads['TOKEN_MOVE_3D']) => void;
  onTokenRotate?: (payload: RealtimeSyncPayloads['TOKEN_ROTATE_3D']) => void;
  onLiveProjectionChange?: (payload: RealtimeSyncPayloads['LIVE_PROJECTION_UPDATE']) => void;
  onDiceRoll?: (payload: RealtimeSyncPayloads['DICE_ROLL']) => void;
  onCombatUpdate?: (payload: RealtimeSyncPayloads['COMBAT_UPDATE']) => void;
  onCombatLogEntry?: (payload: RealtimeSyncPayloads['COMBAT_LOG_ENTRY']) => void;
  onPlayerRoll?: (payload: RealtimeSyncPayloads['PLAYER_ROLL']) => void;
  onPartyLootUpdate?: (payload: RealtimeSyncPayloads['PARTY_LOOT_UPDATE']) => void;
  onPartyLootClose?: (payload: RealtimeSyncPayloads['PARTY_LOOT_CLOSE']) => void;
  onDirectTransfer?: (payload: RealtimeSyncPayloads['DIRECT_TRANSFER']) => void;
  onChatMessage?: (payload: RealtimeSyncPayloads['CHAT_MESSAGE']) => void;
  onDmCursor?: (payload: RealtimeSyncPayloads['DM_CURSOR']) => void;
  onPingLocation?: (payload: RealtimeSyncPayloads['PING_LOCATION']) => void;
  onVoiceSignal?: (payload: RealtimeSyncPayloads['VOICE_SIGNAL']) => void;
  onPresenceUpdate?: (payload: RealtimeSyncPayloads['PRESENCE_UPDATE']) => void;
  onStateRequest?: (payload: RealtimeSyncPayloads['STATE_REQUEST']) => void;
  onStateSnapshot?: (payload: RealtimeSyncPayloads['STATE_SNAPSHOT']) => void;
}

export function useRealtimeSync({
  campaignId,
  onTokenMove,
  onTokenRotate,
  onLiveProjectionChange,
  onDiceRoll,
  onCombatUpdate,
  onCombatLogEntry,
  onPlayerRoll,
  onPartyLootUpdate,
  onPartyLootClose,
  onDirectTransfer,
  onChatMessage,
  onDmCursor,
  onPingLocation,
  onVoiceSignal,
  onPresenceUpdate,
  onStateRequest,
  onStateSnapshot,
}: UseRealtimeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Store latest callbacks in refs to prevent constant re-subscriptions when references change
  const callbacksRef = useRef({
    onTokenMove,
    onTokenRotate,
    onLiveProjectionChange,
    onDiceRoll,
    onCombatUpdate,
    onCombatLogEntry,
    onPlayerRoll,
    onPartyLootUpdate,
    onPartyLootClose,
    onDirectTransfer,
    onChatMessage,
    onDmCursor,
    onPingLocation,
    onVoiceSignal,
    onPresenceUpdate,
    onStateRequest,
    onStateSnapshot,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTokenMove,
      onTokenRotate,
      onLiveProjectionChange,
      onDiceRoll,
      onCombatUpdate,
      onCombatLogEntry,
      onPlayerRoll,
      onPartyLootUpdate,
      onPartyLootClose,
      onDirectTransfer,
      onChatMessage,
      onDmCursor,
      onPingLocation,
      onVoiceSignal,
      onPresenceUpdate,
      onStateRequest,
      onStateSnapshot,
    };
  }, [
    onTokenMove,
    onTokenRotate,
    onLiveProjectionChange,
    onDiceRoll,
    onCombatUpdate,
    onCombatLogEntry,
    onPlayerRoll,
    onPartyLootUpdate,
    onPartyLootClose,
    onDirectTransfer,
    onChatMessage,
    onDmCursor,
    onPingLocation,
    onVoiceSignal,
    onPresenceUpdate,
    onStateRequest,
    onStateSnapshot,
  ]);

  // Cross-tab BroadcastChannel fallback
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel('masters_codex_sync');
      bcRef.current.onmessage = (event) => {
        const { type, ...data } = event.data || {};
        const cb = callbacksRef.current;
        if (type === 'TOKEN_MOVE_3D' && cb.onTokenMove) cb.onTokenMove(data as any);
        if (type === 'TOKEN_ROTATE_3D' && cb.onTokenRotate) cb.onTokenRotate(data as any);
        if (type === 'LIVE_PROJECTION_UPDATE' && cb.onLiveProjectionChange) cb.onLiveProjectionChange(data as any);
        if (type === 'DICE_ROLL' && cb.onDiceRoll) cb.onDiceRoll(data as any);
        if (type === 'COMBAT_UPDATE' && cb.onCombatUpdate) cb.onCombatUpdate(data as any);
        if (type === 'COMBAT_LOG_ENTRY' && cb.onCombatLogEntry) cb.onCombatLogEntry(data as any);
        if (type === 'PLAYER_ROLL' && cb.onPlayerRoll) cb.onPlayerRoll(data as any);
        if (type === 'PARTY_LOOT_UPDATE' && cb.onPartyLootUpdate) cb.onPartyLootUpdate(data as any);
        if (type === 'PARTY_LOOT_CLOSE' && cb.onPartyLootClose) cb.onPartyLootClose(data as any);
        if (type === 'DIRECT_TRANSFER' && cb.onDirectTransfer) cb.onDirectTransfer(data as any);
        if (type === 'CHAT_MESSAGE' && cb.onChatMessage) cb.onChatMessage(data as any);
        if (type === 'DM_CURSOR' && cb.onDmCursor) cb.onDmCursor(data as any);
        if (type === 'PING_LOCATION' && cb.onPingLocation) cb.onPingLocation(data as any);
        if (type === 'VOICE_SIGNAL' && cb.onVoiceSignal) cb.onVoiceSignal(data as any);
        if (type === 'PRESENCE_UPDATE' && cb.onPresenceUpdate) cb.onPresenceUpdate(data as any);
        if (type === 'STATE_REQUEST' && cb.onStateRequest) cb.onStateRequest(data as any);
        if (type === 'STATE_SNAPSHOT' && cb.onStateSnapshot) cb.onStateSnapshot(data as any);
      };
    } catch (e) {}

    return () => {
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, []);

  // Supabase Realtime Channel
  useEffect(() => {
    if (!isSupabaseConfigured() || !campaignId) return;

    const channelName = `masters_codex_campaign_${campaignId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'TOKEN_MOVE_3D' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onTokenMove) cb.onTokenMove(payload);
      })
      .on('broadcast', { event: 'TOKEN_ROTATE_3D' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onTokenRotate) cb.onTokenRotate(payload);
      })
      .on('broadcast', { event: 'LIVE_PROJECTION_UPDATE' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onLiveProjectionChange) cb.onLiveProjectionChange(payload);
      })
      .on('broadcast', { event: 'DICE_ROLL' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onDiceRoll) cb.onDiceRoll(payload);
      })
      .on('broadcast', { event: 'COMBAT_UPDATE' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onCombatUpdate) cb.onCombatUpdate(payload);
      })
      .on('broadcast', { event: 'COMBAT_LOG_ENTRY' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onCombatLogEntry) cb.onCombatLogEntry(payload);
      })
      .on('broadcast', { event: 'PLAYER_ROLL' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onPlayerRoll) cb.onPlayerRoll(payload);
      })
      .on('broadcast', { event: 'PARTY_LOOT_UPDATE' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onPartyLootUpdate) cb.onPartyLootUpdate(payload);
      })
      .on('broadcast', { event: 'PARTY_LOOT_CLOSE' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onPartyLootClose) cb.onPartyLootClose(payload);
      })
      .on('broadcast', { event: 'DIRECT_TRANSFER' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onDirectTransfer) cb.onDirectTransfer(payload);
      })
      .on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onChatMessage) cb.onChatMessage(payload);
      })
      .on('broadcast', { event: 'DM_CURSOR' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onDmCursor) cb.onDmCursor(payload);
      })
      .on('broadcast', { event: 'PING_LOCATION' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onPingLocation) cb.onPingLocation(payload);
      })
      .on('broadcast', { event: 'VOICE_SIGNAL' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onVoiceSignal) cb.onVoiceSignal(payload);
      })
      .on('broadcast', { event: 'PRESENCE_UPDATE' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onPresenceUpdate) cb.onPresenceUpdate(payload);
      })
      .on('broadcast', { event: 'STATE_REQUEST' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onStateRequest) cb.onStateRequest(payload);
      })
      .on('broadcast', { event: 'STATE_SNAPSHOT' }, ({ payload }) => {
        const cb = callbacksRef.current;
        if (cb.onStateSnapshot) cb.onStateSnapshot(payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
          console.log(`📡 Supabase Realtime conectado ao canal: ${channelName}`);

          // Reconciliação Offline (CRDT LWW)
          const queue = await offlineQueue.getQueue();
          if (queue.length > 0) {
            console.log(`📡 Sincronizando ${queue.length} eventos offline...`);
            for (const ev of queue) {
              channel.send({
                type: 'broadcast',
                event: ev.eventType,
                payload: ev.payload,
              });
              await offlineQueue.dequeueEvent(ev.id);
            }
          }

          // Ao conectar com sucesso, solicita o snapshot de estado do Mestre
          try {
            channel.send({
              type: 'broadcast',
              event: 'STATE_REQUEST',
              payload: { requesterId: 'connected_client' },
            });
          } catch (err) {}
        } else {
          isSubscribedRef.current = false;
        }
      });

    channelRef.current = channel;

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const sendBroadcast = useCallback((event: string, payload: any) => {
    // 1. Send via Supabase Realtime WebSocket if connected and subscribed
    if (channelRef.current) {
      if (isSubscribedRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload,
        });
      } else {
        // Fallback: Queue offline event for CRDT
        const entityId = payload.combatantId || payload.sceneId || 'global';
        offlineQueue.enqueueEvent(entityId, event, payload).catch(err => {
          console.error('Failed to enqueue offline event:', err);
        });
      }
    }

    // 2. Send via Local BroadcastChannel (Same-machine / cross-tab)
    if (bcRef.current) {
      try {
        bcRef.current.postMessage({ type: event, ...payload });
      } catch (err) {
        console.warn('BroadcastChannel was closed, re-creating and sending: ', err);
        try {
          bcRef.current = new BroadcastChannel('masters_codex_sync');
          bcRef.current.postMessage({ type: event, ...payload });
        } catch (retryErr) {
          console.error('Failed to send broadcast even after retry:', retryErr);
        }
      }
    }
  }, []);

  const broadcastTokenMove = useCallback((payload: RealtimeSyncPayloads['TOKEN_MOVE_3D']) => {
    sendBroadcast('TOKEN_MOVE_3D', payload);
  }, [sendBroadcast]);

  const broadcastTokenRotate = useCallback((payload: RealtimeSyncPayloads['TOKEN_ROTATE_3D']) => {
    sendBroadcast('TOKEN_ROTATE_3D', payload);
  }, [sendBroadcast]);

  const broadcastLiveProjection = useCallback((payload: RealtimeSyncPayloads['LIVE_PROJECTION_UPDATE']) => {
    sendBroadcast('LIVE_PROJECTION_UPDATE', payload);
  }, [sendBroadcast]);

  const broadcastDiceRoll = useCallback((payload: RealtimeSyncPayloads['DICE_ROLL']) => {
    sendBroadcast('DICE_ROLL', payload);
  }, [sendBroadcast]);

  const broadcastCombatUpdate = useCallback((payload: RealtimeSyncPayloads['COMBAT_UPDATE']) => {
    sendBroadcast('COMBAT_UPDATE', payload);
  }, [sendBroadcast]);

  const broadcastCombatLogEntry = useCallback((payload: RealtimeSyncPayloads['COMBAT_LOG_ENTRY']) => {
    sendBroadcast('COMBAT_LOG_ENTRY', payload);
  }, [sendBroadcast]);

  const broadcastPlayerRoll = useCallback((payload: RealtimeSyncPayloads['PLAYER_ROLL']) => {
    sendBroadcast('PLAYER_ROLL', payload);
  }, [sendBroadcast]);

  const broadcastPartyLootUpdate = useCallback((payload: RealtimeSyncPayloads['PARTY_LOOT_UPDATE']) => {
    sendBroadcast('PARTY_LOOT_UPDATE', payload);
  }, [sendBroadcast]);

  const broadcastPartyLootClose = useCallback((payload: RealtimeSyncPayloads['PARTY_LOOT_CLOSE']) => {
    sendBroadcast('PARTY_LOOT_CLOSE', payload);
  }, [sendBroadcast]);

  const broadcastDirectTransfer = useCallback((payload: RealtimeSyncPayloads['DIRECT_TRANSFER']) => {
    sendBroadcast('DIRECT_TRANSFER', payload);
  }, [sendBroadcast]);

  const broadcastChatMessage = useCallback((payload: RealtimeSyncPayloads['CHAT_MESSAGE']) => {
    sendBroadcast('CHAT_MESSAGE', payload);
  }, [sendBroadcast]);

  const broadcastDmCursor = useCallback((payload: RealtimeSyncPayloads['DM_CURSOR']) => {
    sendBroadcast('DM_CURSOR', payload);
  }, [sendBroadcast]);

  const broadcastPingLocation = useCallback((payload: RealtimeSyncPayloads['PING_LOCATION']) => {
    sendBroadcast('PING_LOCATION', payload);
  }, [sendBroadcast]);

  const broadcastVoiceSignal = useCallback((payload: RealtimeSyncPayloads['VOICE_SIGNAL']) => {
    sendBroadcast('VOICE_SIGNAL', payload);
  }, [sendBroadcast]);

  const broadcastPresenceUpdate = useCallback((payload: RealtimeSyncPayloads['PRESENCE_UPDATE']) => {
    sendBroadcast('PRESENCE_UPDATE', payload);
  }, [sendBroadcast]);

  const broadcastStateRequest = useCallback((payload: RealtimeSyncPayloads['STATE_REQUEST'] = {}) => {
    sendBroadcast('STATE_REQUEST', payload);
  }, [sendBroadcast]);

  const broadcastStateSnapshot = useCallback((payload: RealtimeSyncPayloads['STATE_SNAPSHOT']) => {
    sendBroadcast('STATE_SNAPSHOT', payload);
  }, [sendBroadcast]);

  return {
    sendBroadcast,
    broadcastTokenMove,
    broadcastTokenRotate,
    broadcastLiveProjection,
    broadcastDiceRoll,
    broadcastCombatUpdate,
    broadcastCombatLogEntry,
    broadcastPlayerRoll,
    broadcastPartyLootUpdate,
    broadcastPartyLootClose,
    broadcastDirectTransfer,
    broadcastChatMessage,
    broadcastDmCursor,
    broadcastPingLocation,
    broadcastVoiceSignal,
    broadcastPresenceUpdate,
    broadcastStateRequest,
    broadcastStateSnapshot,
  };
}
