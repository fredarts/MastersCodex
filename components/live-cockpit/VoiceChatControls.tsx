'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Radio } from 'lucide-react';
import { WebRTCVoiceManager } from '@/lib/voice/WebRTCVoiceManager';

interface VoiceChatControlsProps {
  campaignId?: string;
}

export const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({ campaignId }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const voiceManagerRef = useRef<WebRTCVoiceManager | null>(null);

  useEffect(() => {
    const manager = new WebRTCVoiceManager();
    voiceManagerRef.current = manager;

    manager.setOnSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });

    manager.initializeLocalStream().then((stream) => {
      if (stream) {
        setIsConnected(true);
      }
    });

    return () => {
      manager.closeAllConnections();
    };
  }, [campaignId]);

  const handleToggleMute = () => {
    if (voiceManagerRef.current) {
      const muted = voiceManagerRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-[#121824] border border-[#2a3449] px-3 py-1.5 rounded-xl shadow-sm">
      <button
        onClick={handleToggleMute}
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

      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 border-l border-[#2a3449] pl-2">
        <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
        <span>{isConnected ? 'P2P WebRTC' : 'Off'}</span>
      </div>
    </div>
  );
};
