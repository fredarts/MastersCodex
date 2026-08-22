export interface PushNotificationPreferences {
  combatTurn: boolean;
  sessionReminder: boolean;
  whispers: boolean;
  safetyAlerts: boolean;
}

export interface PushSubscriptionData {
  id?: string;
  userId: string;
  campaignId?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  preferences?: PushNotificationPreferences;
  createdAt?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  type?: 'combat_turn' | 'session_reminder' | 'whisper' | 'safety_alert' | 'general';
  data?: Record<string, any>;
}

export const DEFAULT_PUSH_PREFERENCES: PushNotificationPreferences = {
  combatTurn: true,
  sessionReminder: true,
  whispers: true,
  safetyAlerts: true,
};
