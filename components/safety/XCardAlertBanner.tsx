'use client';

import React from 'react';
import { AlertTriangle, Pause, CheckCircle2, X, Moon, Volume2, ShieldAlert } from 'lucide-react';
import { XCardAlertPayload } from '@/lib/types/safety';

interface XCardAlertBannerProps {
  alert: XCardAlertPayload | null;
  onDismiss: () => void;
  onPauseSession?: () => void;
  onFadeToBlack?: () => void;
}

export const XCardAlertBanner: React.FC<XCardAlertBannerProps> = ({
  alert,
  onDismiss,
  onPauseSession,
  onFadeToBlack,
}) => {
  if (!alert) return null;

  const isXCard = alert.type === 'x_card';
  const isPause = alert.type === 'pause';
  const isOCard = alert.type === 'o_card';

  const theme = isXCard
    ? {
        border: 'border-rose-500/80',
        bg: 'bg-gradient-to-r from-rose-950/95 via-red-950/95 to-[#1a080c]/95',
        title: '🛑 ALERTA DE SEGURANÇA: X-CARD ACIONADO!',
        titleColor: 'text-rose-300',
        icon: <AlertTriangle className="w-6 h-6 text-rose-400 animate-bounce shrink-0" />,
        shadow: 'shadow-2xl shadow-rose-950/80',
      }
    : isPause
    ? {
        border: 'border-amber-500/80',
        bg: 'bg-gradient-to-r from-amber-950/95 via-orange-950/95 to-[#1c1208]/95',
        title: '⏸️ PEDIDO DE PAUSA NA SESSÃO',
        titleColor: 'text-amber-300',
        icon: <Pause className="w-6 h-6 text-amber-400 shrink-0" />,
        shadow: 'shadow-2xl shadow-amber-950/80',
      }
    : {
        border: 'border-emerald-500/80',
        bg: 'bg-gradient-to-r from-emerald-950/95 via-teal-950/95 to-[#081c15]/95',
        title: '🟢 SINAL O-CARD: CENA APROVADA',
        titleColor: 'text-emerald-300',
        icon: <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />,
        shadow: 'shadow-2xl shadow-emerald-950/80',
      };

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-xl p-4 rounded-2xl border-2 ${theme.border} ${theme.bg} ${theme.shadow} backdrop-blur-md text-slate-100 animate-in slide-in-from-top duration-200`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {theme.icon}
          <div className="min-w-0">
            <h4 className={`font-bold text-sm sm:text-base tracking-wide ${theme.titleColor}`}>
              {theme.title}
            </h4>
            <div className="text-xs text-slate-300 mt-1 space-y-1">
              <p>
                Origem:{' '}
                <strong className="text-slate-100">
                  {alert.isAnonymous ? '👤 Jogador Anônimo' : `👤 ${alert.senderName || 'Jogador'}`}
                </strong>
                <span className="text-[10px] text-slate-400 font-mono ml-2">
                  ({new Date(alert.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              </p>
              {alert.note && (
                <p className="bg-black/40 p-2 rounded-lg border border-white/10 italic text-slate-200">
                  "{alert.note}"
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Dispensar Alerta"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons for DM */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
        {onPauseSession && (
          <button
            type="button"
            onClick={onPauseSession}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pausar Mesa (2 min)</span>
          </button>
        )}

        {onFadeToBlack && isXCard && (
          <button
            type="button"
            onClick={onFadeToBlack}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Fade to Black (Esmaecer Cena)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs transition-colors ml-auto cursor-pointer"
        >
          Entendido / Fechar
        </button>
      </div>
    </div>
  );
};
