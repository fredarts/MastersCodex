'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  OverlayState,
  initialOverlayState,
  overlayStateReducer,
} from '@/lib/overlay/overlayStateReducer';

export interface UseStreamerOverlaySyncOptions {
  campaignId: string;
  diceDurationMs?: number;
}

export function useStreamerOverlaySync({
  campaignId,
  diceDurationMs = 7000,
}: UseStreamerOverlaySyncOptions) {
  const [state, dispatch] = useReducer(overlayStateReducer, initialOverlayState);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Auto-dismiss roll after diceDurationMs
  const registerRollTimeout = useCallback((rollId: string) => {
    if (timeoutsRef.current.has(rollId)) {
      clearTimeout(timeoutsRef.current.get(rollId)!);
    }
    const timeout = setTimeout(() => {
      dispatch({ type: 'REMOVE_ROLL', id: rollId });
      timeoutsRef.current.delete(rollId);
    }, diceDurationMs);
    timeoutsRef.current.set(rollId, timeout);
  }, [diceDurationMs]);

  useEffect(() => {
    if (!campaignId) return;

    let channel: RealtimeChannel | null = null;

    if (isSupabaseConfigured()) {
      const channelName = `campaign_sync_${campaignId}`;
      channel = supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });

      channel
        .on('broadcast', { event: 'DICE_ROLL' }, ({ payload }) => {
          if (!payload) return;
          const rollId = `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          dispatch({
            type: 'ADD_ROLL',
            payload: {
              roll: {
                id: rollId,
                rollerName: payload.rollerName,
                rollType: payload.rollType,
                diceFormula: payload.diceFormula,
                result: payload.result,
                isCrit: payload.isCrit,
                isFail: payload.isFail,
                title: payload.details?.title || payload.rollType,
              },
              isSecret: payload.isSecret,
              visibility: payload.visibility || (payload.secretMode === 'blind' ? 'blind' : undefined),
            },
          });
          registerRollTimeout(rollId);
        })
        .on('broadcast', { event: 'DICE_3D_BURST' }, ({ payload }) => {
          if (!payload) return;
          const rollId = `burst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          dispatch({
            type: 'ADD_ROLL',
            payload: {
              roll: {
                id: rollId,
                rollerName: payload.rollerName,
                rollType: payload.dieType,
                diceFormula: `1${payload.dieType}`,
                result: payload.result,
                isCrit: payload.isCrit,
                isFail: payload.isFail,
                isHit: payload.isHit,
                title: payload.title,
              },
              isSecret: payload.isSecret,
            },
          });
          registerRollTimeout(rollId);
        })
        .on('broadcast', { event: 'COMBAT_UPDATE' }, ({ payload }) => {
          if (!payload) return;
          dispatch({
            type: 'UPDATE_COMBAT',
            payload: {
              combatants: payload.combatants,
              currentTurnIndex: payload.currentTurnIndex,
              roundCount: payload.roundCount,
            },
          });
        })
        .on('broadcast', { event: 'LIVE_PROJECTION_UPDATE' }, ({ payload }) => {
          if (!payload) return;
          dispatch({
            type: 'UPDATE_SCENE',
            payload: {
              title: payload.title,
              sensoryText: payload.sensoryText,
              timeOfDay: payload.timeOfDay,
              timeOfDayHour: payload.timeOfDayHour,
              hasFog: payload.hasFog,
              hasRain: payload.hasRain,
              imageUrl: payload.imageUrl,
            },
          });
        })
        .on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
          if (!payload?.message) return;
          dispatch({
            type: 'ADD_CHAT',
            payload: {
              id: payload.message.id,
              senderName: payload.message.senderName || 'Jogador',
              senderRole: payload.message.senderRole,
              content: payload.message.content,
              channel: payload.message.channel,
              timestamp: payload.message.timestamp || Date.now(),
            },
          });
        });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            try {
              channel?.send({
                type: 'broadcast',
                event: 'STATE_REQUEST',
                payload: { requesterId: 'obs_overlay' },
              });
            } catch (err) {}
          }, 300);
        }
      });
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, [campaignId, registerRollTimeout]);

  // Expose manual test trigger functions for preview mode
  const triggerTestRoll = useCallback(
    (isCrit = false, isFail = false) => {
      const rollId = `test-roll-${Date.now()}`;
      dispatch({
        type: 'ADD_ROLL',
        payload: {
          roll: {
            id: rollId,
            rollerName: isCrit ? 'Paladino (Crítico!)' : isFail ? 'Ladino (Falha!)' : 'Mago Arcanista',
            rollType: 'd20',
            diceFormula: isCrit ? '1d20+8 (Vantagem)' : isFail ? '1d20+3' : '1d20+5',
            result: isCrit ? 20 : isFail ? 1 : 16,
            isCrit,
            isFail,
            title: isCrit ? 'Golpe Divino Exterminador' : isFail ? 'Furtividade Desastrada' : 'Disparo de Raio de Gelo',
          },
        },
      });
      registerRollTimeout(rollId);
    },
    [registerRollTimeout]
  );

  return {
    state,
    triggerTestRoll,
    clearRolls: () => dispatch({ type: 'CLEAR_ROLLS' }),
  };
}
