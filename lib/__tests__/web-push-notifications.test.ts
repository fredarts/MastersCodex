import { describe, it, expect } from 'vitest';
import {
  urlBase64ToUint8Array,
  formatGamePushMessage,
} from '@/lib/push/vapidUtils';
import { DEFAULT_PUSH_PREFERENCES, PushSubscriptionData } from '@/lib/push/pushTypes';

describe('Web Push Notifications & VAPID Suite', () => {
  describe('VAPID Key Base64 Conversion', () => {
    it('should convert standard base64 string to Uint8Array correctly', () => {
      // "VGVzdA==" is "Test" in base64
      const result = urlBase64ToUint8Array('VGVzdA==');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(4);
      expect(result[0]).toBe(84); // 'T'
      expect(result[1]).toBe(101); // 'e'
      expect(result[2]).toBe(115); // 's'
      expect(result[3]).toBe(116); // 't'
    });

    it('should handle URL-safe base64 characters (- and _)', () => {
      // URL-safe string
      const urlSafeStr = 'AB-_';
      const result = urlBase64ToUint8Array(urlSafeStr);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw error for empty or invalid base64 input', () => {
      expect(() => urlBase64ToUint8Array('')).toThrowError(/Chave VAPID pública inválida/);
      expect(() => urlBase64ToUint8Array(null as any)).toThrowError(/Chave VAPID pública inválida/);
    });
  });

  describe('Game Push Message Formatting', () => {
    it('should format combat turn push notifications with character name', () => {
      const msg = formatGamePushMessage('combat_turn', { characterName: 'Eldrin Sombraval' });
      expect(msg.title).toBe('⚔️ Seu Turno no Combate!');
      expect(msg.body).toContain('Eldrin Sombraval');
    });

    it('should provide fallback body for combat turn without character name', () => {
      const msg = formatGamePushMessage('combat_turn', {});
      expect(msg.title).toBe('⚔️ Seu Turno no Combate!');
      expect(msg.body).toBe('É a sua vez de agir na iniciativa!');
    });

    it('should format session reminder notifications with campaign title', () => {
      const msg = formatGamePushMessage('session_reminder', { campaignTitle: 'A Maldição de Strahd' });
      expect(msg.title).toBe('🏰 A Sessão vai Começar!');
      expect(msg.body).toContain('A Maldição de Strahd');
    });

    it('should format whisper notifications with sender name', () => {
      const msg = formatGamePushMessage('whisper', { senderName: 'Mestre da Masmorra' });
      expect(msg.title).toBe('🔒 Sussurro Recebido');
      expect(msg.body).toContain('Mestre da Masmorra');
    });

    it('should format safety alert (X-Card) notifications with high priority message', () => {
      const msg = formatGamePushMessage('safety_alert', {});
      expect(msg.title).toContain('X-Card');
      expect(msg.body).toContain('Pause a cena');
    });
  });

  describe('Push Preferences and Subscriptions Defaults', () => {
    it('should have all critical RPG notification types enabled by default', () => {
      expect(DEFAULT_PUSH_PREFERENCES.combatTurn).toBe(true);
      expect(DEFAULT_PUSH_PREFERENCES.sessionReminder).toBe(true);
      expect(DEFAULT_PUSH_PREFERENCES.whispers).toBe(true);
      expect(DEFAULT_PUSH_PREFERENCES.safetyAlerts).toBe(true);
    });

    it('should build a valid subscription data structure', () => {
      const sub: PushSubscriptionData = {
        userId: 'player-123',
        campaignId: 'camp-456',
        endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/abc123xyz',
        p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9t0A4If_ZCYXUe609wPP2jxG8eVU15Knf-5rPqc-ACiBp0=',
        auth: 'tBHItJI5svbpez7KI4CCXg==',
        preferences: DEFAULT_PUSH_PREFERENCES,
      };

      expect(sub.userId).toBe('player-123');
      expect(sub.endpoint).toContain('mozilla.com');
      expect(sub.preferences?.combatTurn).toBe(true);
    });
  });
});
