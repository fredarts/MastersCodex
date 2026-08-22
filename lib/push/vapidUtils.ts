/**
 * Converts a base64 string to a Uint8Array required by pushManager.subscribe applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('Chave VAPID pública inválida ou não fornecida.');
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Validates whether the browser environment supports Web Push Notifications
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Formats a game push notification message based on event type
 */
export function formatGamePushMessage(
  type: 'combat_turn' | 'session_reminder' | 'whisper' | 'safety_alert',
  params: { characterName?: string; senderName?: string; campaignTitle?: string }
): { title: string; body: string } {
  switch (type) {
    case 'combat_turn':
      return {
        title: '⚔️ Seu Turno no Combate!',
        body: params.characterName
          ? `É a vez de ${params.characterName} agir na mesa!`
          : 'É a sua vez de agir na iniciativa!',
      };
    case 'session_reminder':
      return {
        title: '🏰 A Sessão vai Começar!',
        body: params.campaignTitle
          ? `A sessão da campanha "${params.campaignTitle}" começa em breve.`
          : 'Sua sessão de RPG começa em breve. Prepare seus dados!',
      };
    case 'whisper':
      return {
        title: '🔒 Sussurro Recebido',
        body: params.senderName
          ? `${params.senderName} enviou uma mensagem secreta para você.`
          : 'Você recebeu um novo sussurro secreto na sessão.',
      };
    case 'safety_alert':
      return {
        title: '🛑 Alerta de Segurança (X-Card)',
        body: 'Um participante acionou o X-Card na mesa. Pause a cena imediatamente.',
      };
    default:
      return {
        title: 'Masters Codex',
        body: 'Você tem uma nova notificação na campanha.',
      };
  }
}
