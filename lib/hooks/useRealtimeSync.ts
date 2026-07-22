'use client';

import { useEffect, useRef, useCallback } from 'react';
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

  // Cross-tab BroadcastChannel fallback
  const bcRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    try {
      bcRef.current = new BroadcastChannel('masters_codex_sync');
      bcRef.current.onmessage = (event) => {
        const { type, ...data } = event.data || {};
        if (type === 'TOKEN_MOVE_3D' && onTokenMove) onTokenMove(data);
        if (type === 'TOKEN_ROTATE_3D' && onTokenRotate) onTokenRotate(data);
        if (type === 'LIVE_PROJECTION_UPDATE' && onLiveProjectionChange) onLiveProjectionChange(data);
        if (type === 'DICE_ROLL' && onDiceRoll) onDiceRoll(data);
        if (type === 'COMBAT_UPDATE' && onCombatUpdate) onCombatUpdate(data);
      };
    } catch (e) {}

    return () => {
      if (bcRef.current) {
        bcRef.current.close();
        bcRef.current = null;
      }
    };
  }, [onTokenMove, onTokenRotate, onLiveProjectionChange, onDiceRoll, onCombatUpdate]);

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
        if (onTokenMove) onTokenMove(payload);
      })
      .on('broadcast', { event: 'TOKEN_ROTATE_3D' }, ({ payload }) => {
        if (onTokenRotate) onTokenRotate(payload);
      })
      .on('broadcast', { event: 'LIVE_PROJECTION_UPDATE' }, ({ payload }) => {
        if (onLiveProjectionChange) onLiveProjectionChange(payload);
      })
      .on('broadcast', { event: 'DICE_ROLL' }, ({ payload }) => {
        if (onDiceRoll) onDiceRoll(payload);
      })
      .on('broadcast', { event: 'COMBAT_UPDATE' }, ({ payload }) => {
        if (onCombatUpdate) onCombatUpdate(payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`📡 Supabase Realtime conectado ao canal: ${channelName}`);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, onTokenMove, onTokenRotate, onLiveProjectionChange, onDiceRoll, onCombatUpdate]);

  const sendBroadcast = useCallback((event: string, payload: any) => {
    // 1. Send via Supabase Realtime WebSocket if connected
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload,
      });
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
