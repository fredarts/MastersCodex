'use client';

import React, { useState } from 'react';
import { usePwaInstall } from '@/lib/hooks/usePwaInstall';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export const PwaInstallPrompt: React.FC = () => {
  const { showPrompt, isIOS, isInstallable, installApp, dismissPrompt } = usePwaInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (!showPrompt) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5">
      <div className="relative p-4 rounded-2xl bg-slate-950/95 backdrop-blur-xl border border-amber-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.9)] ring-1 ring-amber-500/20">
        {/* Dismiss Button */}
        <button
          onClick={() => dismissPrompt(7)}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
          title="Fechar por 7 dias"
          aria-label="Fechar banner de instalação"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          {/* Logo / App Icon */}
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
              <Image
                src="/web-app-manifest-192x192.png"
                alt="Masters Codex Logo"
                width={44}
                height={44}
                className="rounded-lg object-cover"
              />
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                Instalar Masters Codex
              </h3>
              <span className="text-[9px] uppercase font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              Jogue em tela cheia no celular com desempenho nativo, sem barra de navegação.
            </p>

            {/* iOS Guide popup inline */}
            {isIOS && showIosGuide && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-200 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Smartphone className="w-3.5 h-3.5" /> No Safari iOS:
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-center text-[10px] font-bold">1</span>
                  <span>Toque no botão <Share className="w-3 h-3 inline text-amber-400 mx-0.5" /> <strong>Compartilhar</strong>.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-center text-[10px] font-bold">2</span>
                  <span>Role para baixo e selecione <PlusSquare className="w-3 h-3 inline text-amber-400 mx-0.5" /> <strong>Adicionar à Tela de Início</strong>.</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Como Instalar no iPhone' : isInstalling ? 'Instalando...' : 'Instalar App'}</span>
              </button>

              <button
                onClick={() => dismissPrompt(7)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-800 transition-colors"
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
