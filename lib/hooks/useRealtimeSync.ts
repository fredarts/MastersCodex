'use client';

import { useEffect, useRef, useCallback } from 'react';
import { offlineQueue } from '@/lib/sync/OfflineQueueManager';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeSyncPayloads {
  TOKEN_MOVE_3D: { combatantId: string; characterName?: string; newX: number; newZ: number };
  TOKEN_ROTATE_3D: { combatantId: string; characterName?: string; angle: number };
  LIVE_PROJECTION_UPDATE: { 
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
    activeSpellTargeting?: { name: string; range: number; shape: 'circle' | 'cone' | 'line' | 'fan' | 'target' | 'multi-target'; size: number } | null;
    casterTokenKey?: string | null;
    spellTargetPosition?: { x: number; z: number } | null;
  };
  DICE_ROLL: { rollerName: string; rollType: string; diceFormula: string; result: number; isCrit?: boolean; isFail?: boolean };
  COMBAT_UPDATE: { combatants: any[]; currentTurnIndex: number; roundCount: number };
}

export interface UseRealtimeSyncOptions {
  campaignId?: string | null;
  onTokenMove?: (payload: RealtimeSyncPayloads['TOKEN_MOVE_3D']) => void;
  onTokenRotate?: (payload: RealtimeSyncPayloads['TOKEN_ROTATE_3D']) => void;
  onLiveProjectionChange?: (payload: RealtimeSyncPayloads['LIVE_PROJECTION_UPDATE']) => void;
  onDiceRoll?: (payload: RealtimeSyncPayloads['DICE_ROLL']) => void;
  onCombatUpdate?: (payload: RealtimeSyncPayloads['COMBAT_UPDATE']) => void;
}

export function useRealtimeSync({
  campaignId,
  onTokenMove,
  onTokenRotate,
  onLiveProjectionChange,
  onDiceRoll,
  onCombatUpdate,
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
  });

  useEffect(() => {
    callbacksRef.current = {
      onTokenMove,
      onTokenRotate,
      onLiveProjectionChange,
      onDiceRoll,
      onCombatUpdate,
    };
  }, [onTokenMove, onTokenRotate, onLiveProjectionChange, onDiceRoll, onCombatUpdate]);

  // Cross-tab BroadcastChannel fallback
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel('masters_codex_sync');
      bcRef.current.onmessage = (event) => {
        const { type, ...data } = event.data || {};
        const cb = callbacksRef.current;
        if (type === 'TOKEN_MOVE_3D' && cb.onTokenMove) cb.onTokenMove(data);
        if (type === 'TOKEN_ROTATE_3D' && cb.onTokenRotate) cb.onTokenRotate(data);
        if (type === 'LIVE_PROJECTION_UPDATE' && cb.onLiveProjectionChange) cb.onLiveProjectionChange(data);
        if (type === 'DICE_ROLL' && cb.onDiceRoll) cb.onDiceRoll(data);
        if (type === 'COMBAT_UPDATE' && cb.onCombatUpdate) cb.onCombatUpdate(data);
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

  return {
    broadcastTokenMove,
    broadcastTokenRotate,
    broadcastLiveProjection,
    broadcastDiceRoll,
    broadcastCombatUpdate,
  };
}
