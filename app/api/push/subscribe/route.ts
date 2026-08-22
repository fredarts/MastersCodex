import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { PushSubscriptionData, DEFAULT_PUSH_PREFERENCES } from '@/lib/push/pushTypes';

// In-memory fallback for local development without active Supabase database table
const memorySubscriptions = new Map<string, PushSubscriptionData>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId, campaignId, preferences } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Objeto de inscrição inválido. chaves p256dh e auth são obrigatórias.' },
        { status: 400 }
      );
    }

    const subData: PushSubscriptionData = {
      userId: userId || 'anonymous',
      campaignId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: req.headers.get('user-agent') || undefined,
      preferences: preferences || DEFAULT_PUSH_PREFERENCES,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert(
            {
              user_id: subData.userId,
              campaign_id: subData.campaignId,
              endpoint: subData.endpoint,
              p256dh: subData.p256dh,
              auth: subData.auth,
              user_agent: subData.userAgent,
              settings: subData.preferences,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );

        if (error) {
          console.warn('[Push Subscribe] Supabase error, fallback to memory:', error.message);
          memorySubscriptions.set(subData.endpoint, subData);
        }
      } catch (dbErr) {
        memorySubscriptions.set(subData.endpoint, subData);
      }
    } else {
      memorySubscriptions.set(subData.endpoint, subData);
    }

    return NextResponse.json({
      success: true,
      message: 'Inscrição de notificações push registrada com sucesso.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao processar inscrição de push.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint não fornecido.' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    }
    memorySubscriptions.delete(endpoint);

    return NextResponse.json({ success: true, message: 'Inscrição removida.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
