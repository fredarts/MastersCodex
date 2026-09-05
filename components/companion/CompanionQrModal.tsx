'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, X, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CompanionQrModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanionQrModal: React.FC<CompanionQrModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [url, setUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUrl(`${window.location.origin}/companion`);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link do Pocket Companion copiado!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Gerador de QR Code via API segura de renderização de imagem SVG/PNG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    url || 'http://localhost:3000/companion'
  )}&bgcolor=0b0f19&color=fbbf24&margin=2`;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col items-center text-center relative select-none">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-sm">
          <Smartphone className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-100 mb-1">
          Pocket Companion Mobile
        </h3>
        <p className="text-xs text-slate-400 max-w-xs mb-4">
          Aponte a câmera do seu celular para escanear o QR Code e abrir sua ficha tátil instantânea.
        </p>

        {/* QR Code Container */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner mb-4 flex items-center justify-center">
          <img
            src={qrCodeUrl}
            alt="QR Code Pocket Companion"
            className="w-48 h-48 rounded-xl object-contain"
            loading="lazy"
          />
        </div>

        {/* URL Box & Copy */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2 mb-4">
          <span className="text-[11px] font-mono text-slate-300 truncate pl-1">
            {url}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-transform"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <button
            onClick={() => {
              window.open('/companion', '_blank');
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir no Navegador
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold active:scale-95 transition-transform shadow-md"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
