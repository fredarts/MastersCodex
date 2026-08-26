'use client';

import React from 'react';
import { Mic, MicOff, Radio, PhoneCall } from 'lucide-react';
import { useVoiceCall } from '@/context/VoiceCallContext';

interface VoiceChatControlsProps {
  campaignId?: string;
}

export const VoiceChatControls: React.FC<VoiceChatControlsProps> = () => {
  const { isInCall, isConnecting, isMuted, isSpeaking, joinCall, toggleMute, setIsWidgetOpen, participants } = useVoiceCall();

  if (!isInCall) {
    return (
      <button
        onClick={() => joinCall()}
        disabled={isConnecting}
        className="flex items-center gap-2 bg-[#121824] hover:bg-[#1a2234] border border-[#2a3449] hover:border-emerald-500/50 px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold text-slate-300 hover:text-emerald-400 transition-all cursor-pointer"
        title="Conectar à Chamada de Voz"
      >
        <PhoneCall className={`w-3.5 h-3.5 text-emerald-400 ${isConnecting ? 'animate-spin' : ''}`} />
        <span>{isConnecting ? 'Conectando...' : 'Conectar à Voz'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-[#121824] border border-[#2a3449] px-3 py-1.5 rounded-xl shadow-sm">
      <button
        onClick={toggleMute}
        className={`p-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
          isMuted
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : isSpeaking
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
            : 'bg-[#1a2234] text-slate-300 hover:text-white border border-[#2a3449]'
        }`}
        title={isMuted ? 'Ativar Microfone' : 'Desativar Microfone'}
      >
        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        <span>{isMuted ? 'Mutado' : isSpeaking ? 'Falando...' : 'Voz Conectada'}</span>
      </button>

      <button
        onClick={() => setIsWidgetOpen((prev: boolean) => !prev)}
        className="flex items-center gap-1 text-[10px] font-mono text-slate-400 border-l border-[#2a3449] pl-2 hover:text-emerald-400 transition-colors"
        title="Abrir Painel de Participantes"
      >
        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        <span>Voz ({participants.length})</span>
      </button>
    </div>
  );
};
