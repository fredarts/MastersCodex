'use client';

import React, { useEffect, useState } from 'react';
import { PingLocationPayload } from '@/lib/types';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';

interface PingEffectProps {
  pings: PingLocationPayload[];
}

interface ActivePing extends PingLocationPayload {
  createdAt: number;
}

export const PingEffect: React.FC<PingEffectProps> = ({ pings }) => {
  const [activePings, setActivePings] = useState<ActivePing[]>([]);
  const { removePing } = useLiveCockpit();

  useEffect(() => {
    if (pings.length === 0) return;
    const latest = pings[pings.length - 1];
    const newPing: ActivePing = { ...latest, createdAt: Date.now() };

    setActivePings((prev) => [...prev, newPing]);
  }, [pings.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const visiblePings = activePings.filter(
    (p) => p.context === 'map' || (p.context !== 'battle3d' && p.worldX === undefined)
  );

  if (visiblePings.length === 0) return null;

  return (
    <>
      {visiblePings.map((ping, i) => (
        <div
          key={`${ping.createdAt}-${i}`}
          className="absolute pointer-events-none z-40"
          style={{
            left: `${ping.x}%`,
            top: `${ping.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer ring pulse */}
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              width: 48,
              height: 48,
              marginLeft: -24,
              marginTop: -24,
              backgroundColor: `${ping.color}33`,
              border: `2px solid ${ping.color}88`,
            }}
          />
          {/* Inner ring */}
          <div
            className="absolute rounded-full animate-pulse"
            style={{
              width: 24,
              height: 24,
              marginLeft: -12,
              marginTop: -12,
              backgroundColor: `${ping.color}66`,
              border: `2px solid ${ping.color}`,
              boxShadow: `0 0 20px ${ping.color}88`,
            }}
          />
          {/* Center dot */}
          <div
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              marginLeft: -4,
              marginTop: -4,
              backgroundColor: ping.color,
              boxShadow: `0 0 12px ${ping.color}`,
            }}
          />
          {/* Sender name badge with Close Button */}
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold px-2 py-0.5 rounded-md shadow-lg pointer-events-auto flex items-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: `${ping.color}cc`,
              color: '#0a0e17',
            }}
          >
            <span>📍 {ping.senderName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (ping.id) removePing(ping.id);
                setActivePings((prev) => prev.filter((p) => p.createdAt !== ping.createdAt));
              }}
              className="bg-black/40 hover:bg-rose-600 text-white rounded px-1 text-[9px] font-bold leading-none transition-colors cursor-pointer"
              title="Remover Sinalizador"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </>
  );
};
