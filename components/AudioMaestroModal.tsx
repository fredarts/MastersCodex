'use client';

import React from 'react';
import { X } from 'lucide-react';
import { AudioMaestroPanel } from './AudioMaestroPanel';

interface AudioMaestroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioMaestroModal: React.FC<AudioMaestroModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 md:p-8">
      <div className="bg-[#0a0d14] border border-[#2a3449] rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-[#161c28] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-all z-10"
          title="Fechar Painel de Áudio"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 overflow-hidden flex flex-col relative [&>div]:h-full">
          <AudioMaestroPanel />
        </div>
      </div>
    </div>
  );
};
