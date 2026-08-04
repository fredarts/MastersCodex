'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { VoiceSignalingManager } from '@/lib/voice/VoiceSignalingManager';

interface VoiceChatControlsProps {
  campaignId?: string;
}

export const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({ campaignId }) => {
  const { user } = useAuth();
  const { voiceSignal, broadcastVoiceSignal, onlineUsers } = useLiveCockpit();

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const signalingManagerRef = useRef<VoiceSignalingManager | null>(null);

  const currentUserId = user?.id || 'anonymous';

  // Initialize signaling manager and local stream
  useEffect(() => {
    const manager = new VoiceSignalingManager({
      localUserId: currentUserId,
      sendSignal: (payload) => broadcastVoiceSignal(payload),
      onRemoteStream: (peerId, stream) => {
        console.log(`🔊 Recebido áudio do peer: ${peerId}`);
        let audioEl = document.getElementById(`audio-peer-${peerId}`) as HTMLAudioElement;
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = `audio-peer-${peerId}`;
          audioEl.autoplay = true;
          document.body.appendChild(audioEl);
        }
        audioEl.srcObject = stream;
      },
      onPeerDisconnect: (peerId) => {
        console.log(`❌ Peer desconectado da voz: ${peerId}`);
        const audioEl = document.getElementById(`audio-peer-${peerId}`);
        if (audioEl) {
          audioEl.remove();
        }
      }
    });

    signalingManagerRef.current = manager;

    manager.setOnSpeakingChange((speaking) => {
      setIsSpeaking(speaking);
    });

    manager.initialize().then((stream) => {
      if (stream) {
        setIsConnected(true);
      }
    });

    return () => {
      manager.destroy();
      // Clean up peer audio elements
      document.querySelectorAll('[id^="audio-peer-"]').forEach(el => el.remove());
    };
  }, [currentUserId, broadcastVoiceSignal]);

  // Handle incoming signals
  useEffect(() => {
    if (voiceSignal && voiceSignal.toUserId === currentUserId && signalingManagerRef.current) {
      signalingManagerRef.current.handleSignal(voiceSignal).catch(err => {
        console.error('Failed to handle voice signal:', err);
      });
    }
  }, [voiceSignal, currentUserId]);

  // Automatically connect to online users (lexicographically smaller ID calls larger ID)
  useEffect(() => {
    if (!isConnected || !signalingManagerRef.current) return;

    for (const peer of onlineUsers) {
      if (peer.userId !== currentUserId && currentUserId < peer.userId) {
        console.log(`📞 Ligando para o peer online: ${peer.userId}`);
        signalingManagerRef.current.connectToPeer(peer.userId).catch(err => {
          console.error(`Failed calling peer ${peer.userId}:`, err);
        });
      }
    }
  }, [onlineUsers, isConnected, currentUserId]);

  const handleToggleMute = () => {
    if (signalingManagerRef.current) {
      const muted = signalingManagerRef.current.toggleMute();
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
        <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
        <span>{isConnected ? 'P2P WebRTC' : 'Off'}</span>
      </div>
    </div>
  );
};
