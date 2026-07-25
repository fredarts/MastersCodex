'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface TokenPosition {
  x: number;
  y: number;
  z: number;
}

export interface RealtimeBattlePayload {
  type: 'TOKEN_MOVE' | 'HP_CHANGE' | 'TURN_CHANGE';
  tokenKey?: string;
  position?: TokenPosition;
  rotation?: number;
  combatantId?: string;
  hp?: number;
  turnIndex?: number;
  roundCount?: number;
}

export interface UseRealtimeBattleSyncProps {
  campaignId?: string;
  onTokenMove?: (tokenKey: string, position: TokenPosition, rotation?: number) => void;
  onHpChange?: (combatantId: string, hp: number) => void;
  onTurnChange?: (turnIndex: number, roundCount?: number) => void;
}

export function useRealtimeBattleSync({
  campaignId,
  onTokenMove,
  onHpChange,
  onTurnChange,
}: UseRealtimeBattleSyncProps) {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !campaignId) return;

    const channel = supabase.channel(`battle_${campaignId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'battle_event' }, ({ payload }: { payload: RealtimeBattlePayload }) => {
        if (!payload) return;

        switch (payload.type) {
          case 'TOKEN_MOVE':
            if (payload.tokenKey && payload.position && onTokenMove) {
              onTokenMove(payload.tokenKey, payload.position, payload.rotation);
            }
            break;
          case 'HP_CHANGE':
            if (payload.combatantId && payload.hp !== undefined && onHpChange) {
              onHpChange(payload.combatantId, payload.hp);
            }
            break;
          case 'TURN_CHANGE':
            if (payload.turnIndex !== undefined && onTurnChange) {
              onTurnChange(payload.turnIndex, payload.roundCount);
            }
            break;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [campaignId, onTokenMove, onHpChange, onTurnChange]);

  const broadcastTokenMove = useCallback(
    (tokenKey: string, position: TokenPosition, rotation?: number) => {
      if (!channelRef.current) return;
      channelRef.current.send({
        type: 'broadcast',
        event: 'battle_event',
        payload: {
          type: 'TOKEN_MOVE',
          tokenKey,
          position,
          rotation,
        },
      });
    },
    []
  );

  const broadcastHpChange = useCallback((combatantId: string, hp: number) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'battle_event',
      payload: {
        type: 'HP_CHANGE',
        combatantId,
        hp,
      },
    });
  }, []);

  const broadcastTurnChange = useCallback((turnIndex: number, roundCount?: number) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'battle_event',
      payload: {
        type: 'TURN_CHANGE',
        turnIndex,
        roundCount,
      },
    });
  }, []);

  return {
    broadcastTokenMove,
    broadcastHpChange,
    broadcastTurnChange,
  };
}
