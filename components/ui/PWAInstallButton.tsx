'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Check, X, Share } from 'lucide-react';
import { toast } from 'sonner';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'compact' | 'card' | 'menu-item';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if running as standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(!!isStandaloneMode);
    };
    checkStandalone();

    // Check iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      toast.success('O Masters Codex já está instalado e rodando como app!');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        toast.success('🎉 Masters Codex instalado com sucesso!');
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      toast.info('Para instalar no navegador, use o ícone de instalação na barra de endereços (URL).');
    }
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`p-1.5 rounded-lg text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all text-xs font-bold flex items-center gap-1.5 active:scale-95 ${className}`}
          title="Instalar App Nativo (PWA)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar App</span>
        </button>
      ) : variant === 'card' ? (
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-[#161c28] to-[#0f141d] border border-amber-500/30 shadow-xl space-y-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">Instalar Masters Codex</h4>
              <p className="text-xs text-slate-400">Experiência nativa em tela cheia, mais rápida e offline.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Instalar no Dispositivo</span>
          </button>
        </div>
      ) : variant === 'menu-item' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`w-full px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:text-amber-300 hover:bg-[#1f2738] rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${className}`}
        >
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-200">Instalar App</span>
            <span className="text-[10px] text-slate-400 font-normal">Modo nativo em tela cheia</span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar App</span>
        </button>
      )}

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-[#0d121f] border border-[#2a3449] rounded-2xl p-5 shadow-2xl space-y-4 text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1f293d] pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Instalar no iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>Para instalar o <strong>Masters Codex</strong> como app nativo no iOS Safari:</p>
              <ol className="list-decimal list-inside space-y-2 bg-[#070a12] p-3 rounded-xl border border-[#1e2738]">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">1.</span>
                  <span>Toque no botão <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> <strong>Compartilhar</strong> no Safari.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">2.</span>
                  <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-amber-400">3.</span>
                  <span>Toque em <strong>Adicionar</strong> no canto superior direito.</span>
                </li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
