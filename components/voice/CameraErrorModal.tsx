'use client';

import React from 'react';
import { AlertTriangle, CameraOff, X, RefreshCw, CheckCircle2, ExternalLink } from 'lucide-react';

export interface CameraErrorInfo {
  title: string;
  message: string;
  type?: 'NotReadableError' | 'NotAllowedError' | 'NotFoundError' | 'OverconstrainedError' | 'Unknown';
}

interface CameraErrorModalProps {
  error: CameraErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const CameraErrorModal: React.FC<CameraErrorModalProps> = ({
  error,
  onClose,
  onRetry,
}) => {
  if (!error) return null;

  const isNotReadable = error.type === 'NotReadableError' || error.message.toLowerCase().includes('not readable') || error.message.toLowerCase().includes('could not start video source');
  const isNotAllowed = error.type === 'NotAllowedError' || error.message.toLowerCase().includes('permission') || error.message.toLowerCase().includes('permissão');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-[#0f141d] border border-rose-500/40 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200 shadow-rose-950/40">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3449] bg-gradient-to-r from-rose-950/40 to-[#141a26]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <CameraOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>{error.title || 'Falha ao Iniciar Câmera'}</span>
              </h3>
              <p className="text-[11px] text-rose-300/90 font-mono">
                {error.type || 'NotReadableError: Could not start video source'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Mensagem Principal */}
          <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-3 text-rose-200 leading-relaxed">
            {error.message}
          </div>

          {/* Dicas de Resolução de Problemas */}
          <div className="space-y-2.5 bg-[#141a26] border border-[#2a3449] p-3.5 rounded-xl">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Como resolver este problema:
            </span>

            <ul className="space-y-2 text-slate-300 text-[11px]">
              {isNotReadable && (
                <>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-slate-100">Feche outros aplicativos:</strong> Programas como{' '}
                      <code className="text-amber-300 bg-[#1e2738] px-1 rounded">Discord</code>,{' '}
                      <code className="text-amber-300 bg-[#1e2738] px-1 rounded">OBS Studio</code>,{' '}
                      <code className="text-amber-300 bg-[#1e2738] px-1 rounded">Zoom</code>,{' '}
                      <code className="text-amber-300 bg-[#1e2738] px-1 rounded">Teams</code> ou WhatsApp podem estar usando a webcam de forma exclusiva.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <span>
                      <strong className="text-slate-100">Verifique outras abas:</strong> Se você possui outra aba ou janela do navegador transmitindo vídeo, feche-a ou desative o vídeo nela.
                    </span>
                  </li>
                </>
              )}

              {isNotAllowed && (
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-100">Permissões do Navegador:</strong> Clique no ícone de cadeado/configurações na barra de endereços do navegador e garanta que a permissão de <strong className="text-amber-300">Câmera</strong> esteja como "Permitir".
                  </span>
                </li>
              )}

              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                <span>
                  <strong className="text-slate-100">Configurações do Windows:</strong> Vá em <em>Iniciar &gt; Configurações &gt; Privacidade e Segurança &gt; Câmera</em> e certifique-se de que a permissão de acesso à câmera esteja ativada para o navegador.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2a3449] bg-[#141a26] flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 font-mono">D&amp;D 5e • Voice &amp; Video</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#1e2738] hover:bg-[#28344c] text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all border border-[#2a3449] cursor-pointer"
            >
              Fechar
            </button>
            {onRetry && (
              <button
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
