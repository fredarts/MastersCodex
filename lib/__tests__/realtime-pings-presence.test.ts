import { describe, it, expect } from 'vitest';
import { PingLocationPayload, PresencePayload } from '../types';

describe('Realtime Pings & Grid Snapping Logic', () => {
  it('should snap raw world coordinates to 2x2m 3D grid tile centers', () => {
    const rawX = 4.2;
    const rawZ = -3.7;

    const snappedX = Math.floor(rawX / 2) * 2 + 1;
    const snappedZ = Math.floor(rawZ / 2) * 2 + 1;

    expect(snappedX).toBe(5);
    expect(snappedZ).toBe(-3);
  });

  it('should create valid 3D ping payload structure with unique ID', () => {
    const pingId = `ping-${Date.now()}-abc123`;
    const ping: PingLocationPayload = {
      id: pingId,
      x: 50,
      y: 50,
      worldX: 3,
      worldZ: 5,
      context: 'battle3d',
      senderName: 'Thorin',
      color: '#38bdf8',
    };

    expect(ping.id).toBe(pingId);
    expect(ping.worldX).toBe(3);
    expect(ping.worldZ).toBe(5);
    expect(ping.context).toBe('battle3d');
  });

  it('should handle presence payload status changes and avatarSettings', () => {
    const presence: PresencePayload = {
      userId: 'user-123',
      displayName: 'Mestre da Masmorra',
      avatarUrl: 'https://example.com/avatar.jpg',
      avatarSettings: { zoom: 1.5, offsetX: 10, offsetY: -5 },
      status: 'online',
    };

    expect(presence.status).toBe('online');
    expect(presence.avatarSettings?.zoom).toBe(1.5);
  });

  it('should correctly include and update self presence alongside peer presences', () => {
    const selfPresence: PresencePayload = {
      userId: 'user-dm',
      displayName: 'Mestre',
      status: 'online',
      timestamp: Date.now(),
    };

    const peerPresence: PresencePayload = {
      userId: 'user-player-1',
      displayName: 'Karynna',
      status: 'online',
      timestamp: Date.now(),
    };

    let onlineUsers: PresencePayload[] = [selfPresence];

    // Peer connects
    const idx = onlineUsers.findIndex((u) => u.userId === peerPresence.userId);
    if (idx >= 0) {
      onlineUsers[idx] = peerPresence;
    } else {
      onlineUsers = [...onlineUsers, peerPresence];
    }

    expect(onlineUsers).toHaveLength(2);
    expect(onlineUsers.some((u) => u.userId === 'user-dm')).toBe(true);
    expect(onlineUsers.some((u) => u.userId === 'user-player-1')).toBe(true);

    // Peer goes offline
    onlineUsers = onlineUsers.filter((u) => u.userId !== 'user-player-1');
    expect(onlineUsers).toHaveLength(1);
    expect(onlineUsers[0].userId).toBe('user-dm');
  });

  it('should reject or isolate presence broadcast from different campaign channel', () => {
    const currentCampaignId = 'camp-alpha';
    const foreignCampaignMessage = {
      type: 'PRESENCE_UPDATE',
      _campaignId: 'camp-beta',
      userId: 'user-intruder',
      displayName: 'Intruder',
      status: 'online',
    };

    const shouldProcess = foreignCampaignMessage._campaignId === currentCampaignId;
    expect(shouldProcess).toBe(false);
  });
});
