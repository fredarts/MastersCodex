'use client';

import React, { useState } from 'react';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';
import { Bell, BellOff, BellRing, Swords, Shield, Sparkles, Check, Settings2 } from 'lucide-react';

interface PushNotificationToggleProps {
  userId?: string;
  campaignId?: string;
  className?: string;
}

export const PushNotificationToggle: React.FC<PushNotificationToggleProps> = ({
  userId,
  campaignId,
  className = '',
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    preferences,
    setPreferences,
    subscribeUser,
    unsubscribeUser,
    sendTestNotification,
  } = usePushNotifications(userId, campaignId);

  const [showConfig, setShowConfig] = useState(false);

  if (!isSupported) return null;

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  };

  return (
    <div className={`p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              isSubscribed
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {isSubscribed ? (
              <BellRing className="w-4 h-4 animate-bounce" style={{ animationDuration: '3s' }} />
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">Notificações Push da Mesa</span>
              {isSubscribed && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ativo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Receba alertas no celular quando for seu turno ou a sessão começar.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isSubscribed ? 'bg-amber-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
              isSubscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Expanded controls if subscribed */}
      {isSubscribed && (
        <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[11px] text-slate-400">Testar notificações:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => sendTestNotification('combat_turn')}
                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px] transition-colors"
              >
                ⚔️ Testar Turno
              </button>
              <button
                type="button"
                onClick={() => sendTestNotification('session_reminder')}
                className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] transition-colors"
              >
                🏰 Testar Sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
