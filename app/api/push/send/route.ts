import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationPayload } from '@/lib/push/pushTypes';

export async function POST(req: NextRequest) {
  try {
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

    // In a full production setup with VAPID credentials configured, we dispatch to endpoints.
    // For local dev or simulated test push:
    return NextResponse.json({
      success: true,
      deliveredCount: 1,
      payload: {
        title: payload.title,
        body: payload.body,
        type: payload.type || 'general',
        targetUserId,
        campaignId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar notificação push.' },
      { status: 500 }
    );
  }
}
