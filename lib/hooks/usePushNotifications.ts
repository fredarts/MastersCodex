'use client';

import { useState, useEffect, useCallback } from 'react';
import { isPushNotificationSupported, formatGamePushMessage } from '@/lib/push/vapidUtils';
import { PushNotificationPreferences, DEFAULT_PUSH_PREFERENCES } from '@/lib/push/pushTypes';
import { toast } from 'sonner';

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
        // Subscribe with mock/dev or real applicationServerKey
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          });
        } catch (subErr) {
          console.warn('[Push] Browser requires applicationServerKey for push subscription, simulated locally:', subErr);
        }
      }

      // Save to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription
            ? {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: 'mock-p256dh',
                  auth: 'mock-auth',
                },
              }
            : {
                endpoint: `mock-endpoint-${Date.now()}`,
                keys: { p256dh: 'dev', auth: 'dev' },
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
      const msg = formatGamePushMessage(type, { characterName: 'Seu Personagem' });

      // If notification permission is granted, display immediately
      if ('Notification' in window && Notification.permission === 'granted') {
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
    []
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
