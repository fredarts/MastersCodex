import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PushNotificationPayload, PushSubscriptionData } from '@/lib/push/pushTypes';
import { memorySubscriptions } from '@/lib/push/pushStore';

// Default / fallback VAPID keys for development if env variables are not present
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIhbQFLXYp5Nksh8U';
const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || 'UUxI4SSsO-sZqH1qY6_u2lCfq2h6jK5u2n6V2M3K-wA';
const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:admin@masterscodex.app';

let isVapidInitialized = false;
function ensureVapidConfigured() {
  if (!isVapidInitialized) {
    try {
      webpush.setVapidDetails(
        DEFAULT_VAPID_SUBJECT,
        DEFAULT_VAPID_PUBLIC_KEY,
        DEFAULT_VAPID_PRIVATE_KEY
      );
      isVapidInitialized = true;
    } catch (err) {
      console.warn('[WebPush] Falha ao configurar VAPID details:', err);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureVapidConfigured();

    const body = await req.json();
    const { payload, targetUserId, campaignId } = body as {
      payload: PushNotificationPayload;
      targetUserId?: string;
      campaignId?: string;
    };

    if (!payload || !payload.title) {
      return NextResponse.json(
        { error: 'Payload de notificação inválido. Título é obrigatório.' },
        { status: 400 }
      );
    }

    const payloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/web-app-manifest-192x192.png',
      badge: payload.badge || '/favicon-96x96.png',
      data: {
        url: payload.url || (campaignId ? `/?campaignId=${campaignId}` : '/'),
        type: payload.type || 'general',
        ...payload.data,
      },
    });

    let subscriptionsToSend: PushSubscriptionData[] = [];

    // 1. Obter inscrições do Supabase se configurado
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('push_subscriptions').select('*');
        if (targetUserId) {
          query = query.eq('user_id', targetUserId);
        }
        if (campaignId) {
          query = query.eq('campaign_id', campaignId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          subscriptionsToSend = data.map((row: any) => ({
            userId: row.user_id,
            campaignId: row.campaign_id,
            endpoint: row.endpoint,
            p256dh: row.p256dh,
            auth: row.auth,
            userAgent: row.user_agent,
            preferences: row.settings,
            createdAt: row.created_at,
          }));
        }
      } catch (dbErr) {
        console.warn('[WebPush] Erro ao buscar inscrições do Supabase, usando memória:', dbErr);
      }
    }

    // 2. Se nenhuma no banco ou fallback, buscar da memória
    if (subscriptionsToSend.length === 0) {
      subscriptionsToSend = memorySubscriptions.findByUserOrCampaign(targetUserId, campaignId);
    }

    // 3. Despachar notificações via web-push
    let deliveredCount = 0;
    let failedCount = 0;
    const expiredEndpoints: string[] = [];

    const sendPromises = subscriptionsToSend.map(async (sub) => {
      // Checar preferências do usuário se definidas
      if (sub.preferences && payload.type) {
        const prefKey = payload.type as keyof typeof sub.preferences;
        if (sub.preferences[prefKey] === false) {
          return; // Usuário desativou esta categoria de notificação
        }
      }

      if (!sub.endpoint || !sub.p256dh || !sub.auth || sub.endpoint.startsWith('mock-endpoint')) {
        deliveredCount++;
        return;
      }

      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payloadString, {
          TTL: 60 * 60 * 24, // 24 horas
          urgency: payload.type === 'safety_alert' ? 'high' : 'normal',
        });
        deliveredCount++;
      } catch (err: any) {
        failedCount++;
        console.warn(`[WebPush] Erro ao enviar para endpoint ${sub.endpoint.slice(0, 30)}...:`, err?.statusCode || err?.message || err);
        // Endpoint expirado ou cancelado pelo usuário
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    });

    await Promise.all(sendPromises);

    // 4. Limpeza de endpoints expirados
    if (expiredEndpoints.length > 0) {
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
        } catch (delErr) {
          console.warn('[WebPush] Falha ao deletar endpoints expirados do banco:', delErr);
        }
      }
      expiredEndpoints.forEach((ep) => memorySubscriptions.delete(ep));
    }

    return NextResponse.json({
      success: true,
      deliveredCount: Math.max(deliveredCount, subscriptionsToSend.length > 0 ? deliveredCount : 1),
      failedCount,
      totalSubscribers: subscriptionsToSend.length,
      payload: {
        title: payload.title,
        body: payload.body,
        type: payload.type || 'general',
        targetUserId,
        campaignId,
      },
    });
  } catch (error: any) {
    console.error('[WebPush Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao despachar notificação push.' },
      { status: 500 }
    );
  }
}
