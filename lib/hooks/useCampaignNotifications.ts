import { useState, useEffect, useCallback, useMemo } from 'react';
import { CampaignFeedEvent, CampaignNPCDisclosure, CampaignFeedEventType } from '@/lib/types';

export type NotificationCategoryType = 'npc' | 'battle' | 'recap' | 'lore';

export interface UnreadCounts {
  npcs: number;
  battles: number;
  recaps: number;
  lore: number;
  total: number;
}

export interface UseCampaignNotificationsReturn {
  unreadCounts: UnreadCounts;
  latestUnreadType: NotificationCategoryType | null;
  hasUnread: boolean;
  isNPCUnread: (entityId: string) => boolean;
  isEventUnread: (event: CampaignFeedEvent) => boolean;
  markNPCAsRead: (entityId: string) => void;
  markEventAsRead: (eventId: string) => void;
  markAllAsRead: () => void;
}

export function useCampaignNotifications(
  campaignId?: string,
  npcDisclosures?: Record<string, CampaignNPCDisclosure>,
  feedEvents: CampaignFeedEvent[] = []
): UseCampaignNotificationsReturn {
  const [seenNPCMap, setSeenNPCMap] = useState<Record<string, string>>({});
  const [seenEventsSet, setSeenEventsSet] = useState<Set<string>>(new Set());
  const [lastGeneralSeenTs, setLastGeneralSeenTs] = useState<number>(0);

  // Carrega timestamps de visualização do localStorage
  useEffect(() => {
    if (!campaignId || typeof window === 'undefined') return;

    try {
      const savedNPCs = localStorage.getItem(`codex_seen_npcs_${campaignId}`);
      if (savedNPCs) {
        setSeenNPCMap(JSON.parse(savedNPCs));
      } else {
        setSeenNPCMap({});
      }

      const savedEvents = localStorage.getItem(`codex_seen_events_${campaignId}`);
      if (savedEvents) {
        setSeenEventsSet(new Set(JSON.parse(savedEvents)));
      } else {
        setSeenEventsSet(new Set());
      }

      const savedGeneral = localStorage.getItem(`codex_last_seen_chronicle_${campaignId}`);
      if (savedGeneral) {
        setLastGeneralSeenTs(Number(savedGeneral) || 0);
      } else {
        setLastGeneralSeenTs(0);
      }
    } catch (_e) {
      // Fallback gracioso para navegadores com restrição de storage
    }
  }, [campaignId]);

  const [syncVersion, setSyncVersion] = useState<number>(0);

  // Escuta atualizações de Supabase Realtime + BroadcastChannel para invalidar e reavaliar visualizações
  useEffect(() => {
    if (!campaignId || typeof window === 'undefined') return;

    const onSyncTrigger = () => {
      setSyncVersion((v) => v + 1);
    };

    window.addEventListener('codex_campaign_npc_disclosure_sync', onSyncTrigger);
    window.addEventListener('codex_campaign_feed_sync', onSyncTrigger);

    let bc: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel(`campaign-sync-${campaignId}`);
      bc.onmessage = (e) => {
        if (e.data?.type === 'NPC_DISCLOSURE_UPDATED' || e.data?.type === 'CAMPAIGN_FEED_EVENT_CREATED') {
          setSyncVersion((v) => v + 1);
        }
      };
    }

    return () => {
      window.removeEventListener('codex_campaign_npc_disclosure_sync', onSyncTrigger);
      window.removeEventListener('codex_campaign_feed_sync', onSyncTrigger);
      if (bc) bc.close();
    };
  }, [campaignId]);

  // Checa se um NPC específico possui revelações não vistas
  const isNPCUnread = useCallback(
    (entityId: string): boolean => {
      if (!npcDisclosures || !npcDisclosures[entityId]) return false;
      const disc = npcDisclosures[entityId];
      if (!disc.isShared) return false;

      const lastSeen = seenNPCMap[entityId];
      if (!lastSeen) {
        // Se nunca foi visto e possui data de atualização ou foi compartilhado
        return Boolean(disc.updatedAt || disc.sharedAt);
      }

      const discUpdated = disc.updatedAt || disc.sharedAt || '';
      return new Date(discUpdated).getTime() > new Date(lastSeen).getTime();
    },
    [npcDisclosures, seenNPCMap, syncVersion]
  );

  // Checa se um evento do feed é não lido
  const isEventUnread = useCallback(
    (event: CampaignFeedEvent): boolean => {
      if (!event.isPublic) return false;
      if (seenEventsSet.has(event.id)) return false;

      // Se for evento de NPC, respeita também o status de leitura do NPC correspondente
      if (event.eventType === 'npc_encounter' && event.details?.entityId) {
        return isNPCUnread(event.details.entityId);
      }

      // Se temos timestamp geral e o evento não foi explicitamente marcado, pode ser novo
      return true;
    },
    [seenEventsSet, isNPCUnread]
  );

  // Marca um NPC como lido
  const markNPCAsRead = useCallback(
    (entityId: string) => {
      if (!campaignId || typeof window === 'undefined') return;

      const nowIso = new Date().toISOString();
      setSeenNPCMap((prev) => {
        const next = { ...prev, [entityId]: nowIso };
        try {
          localStorage.setItem(`codex_seen_npcs_${campaignId}`, JSON.stringify(next));
        } catch (_e) {}
        return next;
      });
    },
    [campaignId]
  );

  // Marca um evento do feed como lido
  const markEventAsRead = useCallback(
    (eventId: string) => {
      if (!campaignId || typeof window === 'undefined') return;

      setSeenEventsSet((prev) => {
        const next = new Set(prev);
        next.add(eventId);
        try {
          localStorage.setItem(`codex_seen_events_${campaignId}`, JSON.stringify(Array.from(next)));
        } catch (_e) {}
        return next;
      });
    },
    [campaignId]
  );

  // Marca tudo como lido
  const markAllAsRead = useCallback(() => {
    if (!campaignId || typeof window === 'undefined') return;

    const nowIso = new Date().toISOString();
    const nowTs = Date.now();

    // Marca todos os NPCs compartilhados como lidos
    const nextNPCMap: Record<string, string> = { ...seenNPCMap };
    if (npcDisclosures) {
      Object.keys(npcDisclosures).forEach((id) => {
        nextNPCMap[id] = nowIso;
      });
    }
    setSeenNPCMap(nextNPCMap);

    // Marca todos os eventos públicos como lidos
    const allEventIds = feedEvents.filter((e) => e.isPublic).map((e) => e.id);
    const nextEventsSet = new Set([...Array.from(seenEventsSet), ...allEventIds]);
    setSeenEventsSet(nextEventsSet);
    setLastGeneralSeenTs(nowTs);

    try {
      localStorage.setItem(`codex_seen_npcs_${campaignId}`, JSON.stringify(nextNPCMap));
      localStorage.setItem(`codex_seen_events_${campaignId}`, JSON.stringify(Array.from(nextEventsSet)));
      localStorage.setItem(`codex_last_seen_chronicle_${campaignId}`, String(nowTs));
    } catch (_e) {}
  }, [campaignId, npcDisclosures, feedEvents, seenNPCMap, seenEventsSet]);

  // Contagens agregadas de itens não lidos por categoria
  const unreadCounts = useMemo<UnreadCounts>(() => {
    let npcsCount = 0;
    let battlesCount = 0;
    let recapsCount = 0;
    let loreCount = 0;

    // 1. Contagem de NPCs
    if (npcDisclosures) {
      Object.entries(npcDisclosures).forEach(([id, disc]) => {
        if (disc.isShared && isNPCUnread(id)) {
          npcsCount++;
        }
      });
    }

    // 2. Contagem de eventos do feed
    (feedEvents || []).forEach((ev) => {
      if (!ev.isPublic) return;
      if (seenEventsSet.has(ev.id)) return;

      switch (ev.eventType) {
        case 'battle_summary':
          battlesCount++;
          break;
        case 'session_recap':
          recapsCount++;
          break;
        case 'world_lore':
          loreCount++;
          break;
        case 'npc_encounter':
          // Se não foi contado nos NPCs diretamente, conta aqui
          if (!ev.details?.entityId || !npcDisclosures?.[ev.details.entityId]) {
            npcsCount++;
          }
          break;
        default:
          break;
      }
    });

    return {
      npcs: npcsCount,
      battles: battlesCount,
      recaps: recapsCount,
      lore: loreCount,
      total: npcsCount + battlesCount + recapsCount + loreCount,
    };
  }, [npcDisclosures, isNPCUnread, feedEvents, seenEventsSet, syncVersion]);

  // Determina a categoria mais recente para cor do ping
  const latestUnreadType = useMemo<NotificationCategoryType | null>(() => {
    if (unreadCounts.total === 0) return null;

    // Se houver NPCs não lidos, dá alta prioridade para o ciano
    if (unreadCounts.npcs > 0) return 'npc';
    if (unreadCounts.battles > 0) return 'battle';
    if (unreadCounts.recaps > 0) return 'recap';
    if (unreadCounts.lore > 0) return 'lore';

    return 'npc';
  }, [unreadCounts]);

  return {
    unreadCounts,
    latestUnreadType,
    hasUnread: unreadCounts.total > 0,
    isNPCUnread,
    isEventUnread,
    markNPCAsRead,
    markEventAsRead,
    markAllAsRead,
  };
}
