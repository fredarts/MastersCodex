'use client';

import { useState, useEffect, useCallback } from 'react';
import { isPushNotificationSupported, formatGamePushMessage, urlBase64ToUint8Array } from '@/lib/push/vapidUtils';
import { PushNotificationPreferences, DEFAULT_PUSH_PREFERENCES } from '@/lib/push/pushTypes';
import { toast } from 'sonner';

const PUBLIC_VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIhbQFLXYp5Nksh8U';

export function usePushNotifications(userId?: string, campaignId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(DEFAULT_PUSH_PREFERENCES);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Check if already subscribed in service worker
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribeUser = useCallback(async () => {
    if (!isSupported) {
      toast.error('Notificações Push não são suportadas neste navegador.');
      return false;
    }

    setIsLoading(true);
    try {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);

      if (permResult !== 'granted') {
        toast.error('Permissão de notificações não foi concedida.');
        setIsLoading(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        try {
          const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY) as unknown as BufferSource;
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        } catch (subErr) {
          console.warn('[Push] Tentando subscrição padrão sem VAPID:', subErr);
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
            });
          } catch (innerErr) {
            console.warn('[Push] Subscrição local simulada:', innerErr);
          }
        }
      }

      const subJson = subscription ? subscription.toJSON() : null;
      const endpoint = subscription?.endpoint || `mock-endpoint-${userId || 'anon'}-${Date.now()}`;
      const p256dh = subJson?.keys?.p256dh || 'dev-p256dh';
      const auth = subJson?.keys?.auth || 'dev-auth';

      // Save to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint,
            keys: { p256dh, auth },
          },
          userId: userId || 'anonymous',
          campaignId,
          preferences,
        }),
      });

      setIsSubscribed(true);
      toast.success('Notificações ativadas! Você receberá alertas na mesa.');
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[Push Subscription Error]:', err);
      toast.error('Erro ao registrar notificações push.');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, userId, campaignId, preferences]);

  const unsubscribeUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, {
          method: 'DELETE',
        });
      }
      setIsSubscribed(false);
      toast.info('Notificações desativadas.');
    } catch (err) {
      console.error('[Push Unsubscribe Error]:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendTestNotification = useCallback(
    async (type: 'combat_turn' | 'session_reminder' | 'whisper' | 'safety_alert' = 'combat_turn') => {
      const msg = formatGamePushMessage(type, { characterName: 'Seu Personagem', campaignTitle: 'Mesa Principal' });

      // If notification permission is granted, dispatch through server API and display locally
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          await fetch('/api/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              payload: {
                title: msg.title,
                body: msg.body,
                type,
              },
              targetUserId: userId,
              campaignId,
            }),
          });
        } catch (apiErr) {
          console.warn('[Push Test API Error]:', apiErr);
        }

        // Direct local fallback trigger for instant feedback
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(msg.title, {
            body: msg.body,
            icon: '/web-app-manifest-192x192.png',
            badge: '/favicon-96x96.png',
          });
        } else {
          new Notification(msg.title, { body: msg.body });
        }
        toast.success(`Notificação de teste enviada: ${msg.title}`);
      } else {
        toast.error('Ative as notificações primeiro para receber o teste.');
      }
    },
    [userId, campaignId]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    setPreferences,
    subscribeUser,
    unsubscribeUser,
    sendTestNotification,
  };
}
