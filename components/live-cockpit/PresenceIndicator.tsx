'use client';

import React from 'react';
import { Users } from 'lucide-react';

interface PresenceUser {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarSettings?: { zoom: number; offsetX: number; offsetY: number };
  status: string;
}

interface PresenceIndicatorProps {
  users: PresenceUser[];
  className?: string;
}

const PresenceAvatar: React.FC<{ user: PresenceUser }> = ({ user }) => {
  const [aspect, setAspect] = React.useState(1);

  if (!user.avatarUrl) {
    return (
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] font-bold bg-[#1e293b] text-slate-300 ${
          user.status === 'speaking'
            ? 'border-emerald-400 animate-pulse'
            : 'border-[#1a2234]'
        }`}
      >
        {user.displayName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={`w-6 h-6 rounded-full border-2 overflow-hidden relative flex items-center justify-center shrink-0 ${
        user.status === 'speaking'
          ? 'border-emerald-400 animate-pulse'
          : 'border-[#1a2234]'
      }`}
    >
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        className="absolute max-w-none transition-all duration-300"
        style={{
          width: aspect >= 1 ? 'auto' : '100%',
          height: aspect >= 1 ? '100%' : 'auto',
          minWidth: aspect >= 1 ? '100%' : 'auto',
          minHeight: aspect >= 1 ? 'auto' : '100%',
          top: '50%',
          left: '50%',
          transform: user.avatarSettings
            ? `translate(calc(-50% + ${user.avatarSettings.offsetX * (24 / 256)}px), calc(-50% + ${user.avatarSettings.offsetY * (24 / 256)}px)) scale(${user.avatarSettings.zoom})`
            : `translate(-50%, calc(-50% - 15%)) scale(1.7)`,
        }}
      />
    </div>
  );
};

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ users, className = '' }) => {
  if (users.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Users className="w-3.5 h-3.5 text-slate-500" />
      <div className="flex items-center -space-x-1.5">
        {users.slice(0, 6).map((user) => (
          <div
            key={user.userId}
            className="relative group"
            title={`${user.displayName} (${user.status === 'speaking' ? 'Falando' : 'Online'})`}
          >
            <PresenceAvatar user={user} />

            {/* Online dot */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#0d1220] ${
                user.status === 'speaking'
                  ? 'bg-emerald-400'
                  : user.status === 'online'
                  ? 'bg-cyan-400'
                  : 'bg-amber-400'
              }`}
            />
            {/* Tooltip */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-[#0d1220] border border-[#2a3449] rounded px-1.5 py-0.5 text-[9px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              {user.displayName}
            </div>
          </div>
        ))}
        {users.length > 6 && (
          <div className="w-6 h-6 rounded-full border-2 border-[#1a2234] bg-[#1e293b] flex items-center justify-center text-[9px] font-bold text-slate-400">
            +{users.length - 6}
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-500 font-mono">{users.length} online</span>
    </div>
  );
};
