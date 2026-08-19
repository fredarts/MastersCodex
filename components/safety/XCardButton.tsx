'use client';

import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, Pause, CheckCircle2, Eye, Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CampaignSafetySettings, XCardAlertPayload, DEFAULT_SAFETY_SETTINGS } from '@/lib/types/safety';

interface XCardButtonProps {
  campaignId?: string | null;
  playerName?: string;
  safetySettings?: CampaignSafetySettings;
  onSendAlert?: (alert: XCardAlertPayload) => void;
  className?: string;
}

export const XCardButton: React.FC<XCardButtonProps> = ({
  campaignId,
  playerName = 'Jogador',
  safetySettings = DEFAULT_SAFETY_SETTINGS,
  onSendAlert,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState<'x_card' | 'limits'>('x_card');

  const handleSendXCard = (type: 'x_card' | 'pause' | 'o_card') => {
    const payload: XCardAlertPayload = {
      id: `xcard-${Date.now()}`,
      campaignId: campaignId || 'global',
      type,
      senderName: isAnonymous ? undefined : playerName,
      isAnonymous,
      note: note.trim() || undefined,
      timestamp: Date.now(),
    };

    if (onSendAlert) {
      onSendAlert(payload);
    } else {
      // Local fallback event
      window.dispatchEvent(new CustomEvent('safety_x_card_triggered', { detail: payload }));
    }

    if (type === 'x_card') {
      toast.error('🛑 X-Card acionado! O Mestre foi notificado para pausar ou esmaecer a cena.', {
        duration: 5000,
      });
    } else if (type === 'pause') {
      toast.warning('⏸️ Pedido de pausa de 2 minutos enviado ao Mestre.', {
        duration: 4000,
      });
    } else {
      toast.success('🟢 O-Card enviado: Sinalizado que você está confortável com a cena.', {
        duration: 4000,
      });
    }

    setNote('');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating or Embedded Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 hover:border-rose-400 text-xs font-semibold shadow-sm transition-all duration-150 active:scale-95 ${className}`}
        title="Ferramentas de Segurança da Mesa (X-Card / Limites)"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
        <span>Safety Tools</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-[#0d121f] border border-[#2a3449] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1f293d] bg-[#090d17]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Ferramentas de Segurança na Mesa</h3>
                  <p className="text-[11px] text-slate-400">Ambiente respeitoso, seguro e sem julgamentos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#161f30] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="flex border-b border-[#1f293d] bg-[#070a12] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('x_card')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'x_card'
                    ? 'bg-[#161f30] text-rose-300 border border-rose-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛑 X-Card & Pausas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('limits')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'limits'
                    ? 'bg-[#161f30] text-amber-300 border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📜 Limites da Campanha
              </button>
            </div>

            {/* Tab 1: X-Card Actions */}
            {activeTab === 'x_card' && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0a0e1a] p-3 rounded-xl border border-[#1e293b]">
                  O <strong>X-Card</strong> permite a qualquer participante sinalizar silenciosamente quando um tema, cena ou descrição ultrapassa o limite de conforto. Sem necessidade de justificar.
                </p>

                {/* Primary X-Card Action */}
                <button
                  type="button"
                  onClick={() => handleSendXCard('x_card')}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 hover:from-rose-600 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-rose-950/60 border border-rose-400/40 flex items-center justify-center gap-2.5 transition-all active:scale-95 group"
                >
                  <AlertTriangle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span>ACIONAR X-CARD (Parar / Esmaecer Cena)</span>
                </button>

                {/* Secondary Fast Actions */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSendXCard('pause')}
                    className="p-3 rounded-xl bg-[#141b2b] hover:bg-[#1c263d] text-amber-300 border border-amber-500/30 hover:border-amber-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Pause className="w-4 h-4 text-amber-400" />
                    <span>Pausa (2 Minutos)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendXCard('o_card')}
                    className="p-3 rounded-xl bg-[#10241e] hover:bg-[#17332b] text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>O-Card (Tudo Bem)</span>
                  </button>
                </div>

                {/* Anonymous Toggle & Optional Note */}
                <div className="space-y-2 pt-2 border-t border-[#1f293d]">
                  <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Enviar como alerta anônimo</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 accent-amber-500 cursor-pointer"
                    />
                  </label>

                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nota opcional ao DM (ex: 'aracnofobia', 'violência excessiva')..."
                    className="w-full bg-[#070a12] border border-[#1e293b] focus:border-rose-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Campaign Limits (Lines & Veils) */}
            {activeTab === 'limits' && (
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto custom-scrollbar text-xs">
                <div>
                  <h4 className="font-bold text-rose-400 flex items-center gap-1.5 mb-1.5 uppercase text-[11px] font-mono">
                    <span>🚫 Linhas (Lines - Proibido na Mesa)</span>
                  </h4>
                  {safetySettings.lines.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Nenhuma linha restritiva configurada.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {safetySettings.lines.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1f293d]">
                  <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1.5 uppercase text-[11px] font-mono">
                    <span>🌫️ Véus (Veils - Ocorre Fora de Cena)</span>
                  </h4>
                  {safetySettings.veils.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Nenhum véu configurado.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {safetySettings.veils.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1f293d]">
                  <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5 uppercase text-[11px] font-mono">
                    <span>❓ Perguntar Antes (Ask First)</span>
                  </h4>
                  {safetySettings.askFirst.length === 0 ? (
                    <p className="text-slate-500 italic text-[11px]">Nenhum tópico com confirmação prévia.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {safetySettings.askFirst.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px]"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-[#1f293d] bg-[#070a12] flex items-center justify-between text-[10px] text-slate-500">
              <span>Masters Codex Safety Tools</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
