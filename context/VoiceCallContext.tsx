'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/context/CampaignContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { VoiceSignalingManager } from '@/lib/voice/VoiceSignalingManager';
import { CameraErrorModal, CameraErrorInfo } from '@/components/voice/CameraErrorModal';
import { toast } from 'sonner';

export interface VoiceParticipantState {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role?: 'dm' | 'player';
  isSpeaking: boolean;
  speakingLevel: number; // 0 a 100
  volume: number; // 0.0 a 2.0 (1.0 = 100%)
  isMuted?: boolean;
  isConnected: boolean;
  isVideoEnabled?: boolean;
  stream?: MediaStream | null;
}

interface VoiceCallContextType {
  isInCall: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  localSpeakingLevel: number;
  inputMode: 'vad' | 'ptt';
  pttKey: string;
  isPttPressed: boolean;
  vadSensitivity: number;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string | null;
  isVideoEnabled: boolean;
  localVideoStream: MediaStream | null;
  videoDevices: MediaDeviceInfo[];
  selectedVideoDeviceId: string | null;
  videoLayout: 'compact' | 'grid';
  setVideoLayout: (layout: 'compact' | 'grid') => void;
  cameraError: CameraErrorInfo | null;
  setCameraError: (err: CameraErrorInfo | null) => void;
  clearCameraError: () => void;
  participants: VoiceParticipantState[];
  connectedPeersCount: number;
  activeCallPeersCount: number;
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  joinCall: () => Promise<boolean>;
  leaveCall: () => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  toggleDeafen: () => void;
  toggleVideo: () => Promise<boolean>;
  setVideoEnabled: (enabled: boolean) => Promise<boolean>;
  setParticipantVolume: (userId: string, volume: number) => void;
  setInputMode: (mode: 'vad' | 'ptt') => void;
  setPttKey: (key: string) => void;
  setVadSensitivity: (val: number) => void;
  setSelectedAudioDeviceId: (deviceId: string) => Promise<void>;
  setSelectedVideoDeviceId: (deviceId: string) => Promise<void>;
  refreshAudioDevices: () => Promise<void>;
  refreshVideoDevices: () => Promise<void>;
}

const VoiceCallContext = createContext<VoiceCallContextType | undefined>(undefined);

const STORAGE_KEY = 'masters_codex_voice_preferences_v1';

export const parseCameraError = (err: any): CameraErrorInfo => {
  const errName = err?.name || '';
  const errMsg = err?.message || String(err || '');

  if (errName === 'NotReadableError' || errMsg.includes('Could not start video source') || errMsg.includes('not readable')) {
    return {
      title: 'Câmera em Uso por Outro Aplicativo',
      message: 'Não foi possível iniciar a webcam (NotReadableError). O dispositivo pode estar em uso exclusivo por outro programa (como Discord, OBS Studio, Zoom, Teams ou outra aba do navegador) ou com driver travado.',
      type: 'NotReadableError',
    };
  }

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errMsg.includes('Permission denied')) {
    return {
      title: 'Permissão de Câmera Negada',
      message: 'O navegador não tem permissão para acessar sua webcam. Verifique as configurações de permissão do site na barra de endereços.',
      type: 'NotAllowedError',
    };
  }

  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return {
      title: 'Webcam Não Encontrada',
      message: 'Nenhum dispositivo de câmera foi detectado no seu computador. Verifique se a webcam está conectada corretamente.',
      type: 'NotFoundError',
    };
  }

  if (errName === 'OverconstrainedError') {
    return {
      title: 'Resolução Não Suportada',
      message: 'As configurações de resolução ou taxa de quadros solicitadas não são suportadas por esta webcam.',
      type: 'OverconstrainedError',
    };
  }

  return {
    title: 'Falha ao Iniciar Câmera',
    message: errMsg || 'Ocorreu um erro desconhecido ao tentar acessar a câmera de vídeo.',
    type: 'Unknown',
  };
};

export const VoiceCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { activeCampaign } = useCampaign();
  const { voiceSignal, broadcastVoiceSignal, onlineUsers } = useLiveCockpit();

  const [isInCall, setIsInCall] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [isDeafened, setIsDeafenedState] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [localSpeakingLevel, setLocalSpeakingLevel] = useState<number>(0);
  const [inputMode, setInputModeState] = useState<'vad' | 'ptt'>('vad');
  const [pttKey, setPttKeyState] = useState<string>('Space');
  const [isPttPressed, setIsPttPressed] = useState<boolean>(false);
  const [vadSensitivity, setVadSensitivityState] = useState<number>(25);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceIdState] = useState<string | null>(null);

  // Video States
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(false);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceIdState] = useState<string | null>(null);
  const [videoLayout, setVideoLayoutState] = useState<'compact' | 'grid'>('compact');

  // Error States
  const [cameraError, setCameraError] = useState<CameraErrorInfo | null>(null);

  // UI States
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Volumes por participante: Map<userId, volume>
  const [peerVolumes, setPeerVolumes] = useState<Record<string, number>>({});
  // Estados de fala por peer: Record<peerId, { isSpeaking: boolean; level: number }>
  const [peerSpeakingStates, setPeerSpeakingStates] = useState<Record<string, { isSpeaking: boolean; level: number }>>({});
  // Peers que anunciaram estar na chamada de voz/vídeo
  const [inCallPeerIds, setInCallPeerIds] = useState<Set<string>>(new Set());
  // Peers conectados via WebRTC ativo
  const [connectedPeerIds, setConnectedPeerIds] = useState<Set<string>>(new Set());
  // Streams remotos completos (áudio + vídeo) por peer
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

  const signalingManagerRef = useRef<VoiceSignalingManager | null>(null);
  const currentUserId = user?.id || (activeCampaign?.role === 'dm' ? 'dm-host' : 'player-local');

  const clearCameraError = useCallback(() => {
    setCameraError(null);
  }, []);

  // 1. Carregar preferências salvas no localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.inputMode) setInputModeState(parsed.inputMode);
        if (parsed.pttKey) setPttKeyState(parsed.pttKey);
        if (parsed.vadSensitivity) setVadSensitivityState(parsed.vadSensitivity);
        if (parsed.selectedAudioDeviceId) setSelectedAudioDeviceIdState(parsed.selectedAudioDeviceId);
        if (parsed.selectedVideoDeviceId) setSelectedVideoDeviceIdState(parsed.selectedVideoDeviceId);
        if (parsed.videoLayout) setVideoLayoutState(parsed.videoLayout);
        if (parsed.peerVolumes) setPeerVolumes(parsed.peerVolumes);
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de voz e vídeo:', e);
    }
  }, []);

  const savePreferences = useCallback((updates: Record<string, any>) => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : {};
      const next = { ...current, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Erro ao salvar preferências de voz e vídeo:', e);
    }
  }, []);

  // 2. Enumerar microfones e câmeras disponíveis
  const refreshAudioDevices = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setAudioDevices(audioInputs);
    } catch (err) {
      console.warn('Erro ao listar dispositivos de áudio:', err);
    }
  }, []);

  const refreshVideoDevices = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch (err) {
      console.warn('Erro ao listar dispositivos de vídeo:', err);
    }
  }, []);

  useEffect(() => {
    refreshAudioDevices();
    refreshVideoDevices();
  }, [refreshAudioDevices, refreshVideoDevices]);

  // 3. Inicializar e entrar na chamada
  const joinCall = useCallback(async (): Promise<boolean> => {
    if (isInCall) return true;
    setIsConnecting(true);

    try {
      const manager = new VoiceSignalingManager({
        localUserId: currentUserId,
        sendSignal: (payload) => broadcastVoiceSignal(payload),
        onRemoteStream: (peerId, stream) => {
          setConnectedPeerIds((prev) => new Set([...prev, peerId]));
          setInCallPeerIds((prev) => new Set([...prev, peerId]));
          setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
        },
        onPeerDisconnect: (peerId) => {
          setConnectedPeerIds((prev) => {
            const next = new Set(prev);
            next.delete(peerId);
            return next;
          });
          setInCallPeerIds((prev) => {
            const next = new Set(prev);
            next.delete(peerId);
            return next;
          });
          setPeerSpeakingStates((prev) => {
            const next = { ...prev };
            delete next[peerId];
            return next;
          });
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[peerId];
            return next;
          });
        },
        onPeerJoinAnnouncement: (peerId) => {
          setInCallPeerIds((prev) => new Set([...prev, peerId]));
        },
        onPeerLeaveAnnouncement: (peerId) => {
          setInCallPeerIds((prev) => {
            const next = new Set(prev);
            next.delete(peerId);
            return next;
          });
          setConnectedPeerIds((prev) => {
            const next = new Set(prev);
            next.delete(peerId);
            return next;
          });
        },
      });

      const voiceManager = manager.getVoiceManager();
      voiceManager.setInputMode(inputMode);
      voiceManager.setVadThreshold(vadSensitivity);

      // Aplicar volumes salvos previamente
      Object.entries(peerVolumes).forEach(([peerId, vol]) => {
        voiceManager.setPeerVolume(peerId, vol);
      });

      // Callbacks de fala e vídeo local/remoto
      voiceManager.setOnSpeakingChange((speaking, level) => {
        setIsSpeaking(speaking);
        setLocalSpeakingLevel(level);
      });

      voiceManager.setOnPeerSpeakingChange((peerId, speaking, level) => {
        setPeerSpeakingStates((prev) => ({
          ...prev,
          [peerId]: { isSpeaking: speaking, level },
        }));
      });

      voiceManager.setOnLocalVideoStreamChange((stream) => {
        setLocalVideoStream(stream);
        setIsVideoEnabled(!!stream);
      });

      voiceManager.setOnRemoteStreamChange((peerId, stream) => {
        setRemoteStreams((prev) => ({ ...prev, [peerId]: stream }));
      });

      const stream = await manager.initialize(selectedAudioDeviceId || undefined);
      if (!stream) {
        toast.error('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
        setIsConnecting(false);
        return false;
      }

      signalingManagerRef.current = manager;
      setIsInCall(true);
      setIsConnecting(false);
      setIsWidgetOpen(true);
      refreshAudioDevices();
      refreshVideoDevices();

      toast.success('Conectado à chamada da campanha!');
      return true;
    } catch (err) {
      console.error('Erro ao conectar na chamada de voz:', err);
      toast.error('Erro ao inicializar chamada de voz.');
      setIsConnecting(false);
      return false;
    }
  }, [isInCall, currentUserId, broadcastVoiceSignal, inputMode, vadSensitivity, peerVolumes, selectedAudioDeviceId, refreshAudioDevices, refreshVideoDevices]);

  // 4. Sair da chamada
  const leaveCall = useCallback(() => {
    if (signalingManagerRef.current) {
      signalingManagerRef.current.destroy();
      signalingManagerRef.current = null;
    }
    setIsInCall(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setLocalSpeakingLevel(0);
    setIsVideoEnabled(false);
    setLocalVideoStream(null);
    setConnectedPeerIds(new Set());
    setInCallPeerIds(new Set());
    setPeerSpeakingStates({});
    setRemoteStreams({});
    setCameraError(null);
    toast.info('Você saiu da chamada.');
  }, []);

  // 5. Encerrar chamada quando a campanha ativa for desfeita ou o usuário fizer logout
  useEffect(() => {
    return () => {
      if (signalingManagerRef.current) {
        signalingManagerRef.current.destroy();
        signalingManagerRef.current = null;
      }
    };
  }, [activeCampaign?.id]);

  // 6. Processar sinais WebRTC recebidos pelo Supabase Broadcast
  useEffect(() => {
    if (!voiceSignal || voiceSignal.fromUserId === currentUserId) return;

    // Se recebermos anúncio de entrada/saída, rastreamos quem está na call mesmo antes de entrar
    if (voiceSignal.type === 'join-announcement') {
      setInCallPeerIds((prev) => new Set([...prev, voiceSignal.fromUserId]));
    } else if (voiceSignal.type === 'leave-announcement') {
      setInCallPeerIds((prev) => {
        const next = new Set(prev);
        next.delete(voiceSignal.fromUserId);
        return next;
      });
      setConnectedPeerIds((prev) => {
        const next = new Set(prev);
        next.delete(voiceSignal.fromUserId);
        return next;
      });
    }

    if (!isInCall || !signalingManagerRef.current) return;
    if (voiceSignal.toUserId === currentUserId || voiceSignal.toUserId === 'all') {
      signalingManagerRef.current.handleSignal(voiceSignal).catch((err) => {
        console.warn('Erro ao processar sinal de voz:', err);
      });
    }
  }, [isInCall, voiceSignal, currentUserId]);

  // 7. Controles de Mute / Deafen
  const toggleMute = useCallback(() => {
    if (signalingManagerRef.current) {
      const muted = signalingManagerRef.current.toggleMute();
      setIsMutedState(muted);
    } else {
      setIsMutedState((prev) => !prev);
    }
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    if (signalingManagerRef.current) {
      signalingManagerRef.current.setMuted(muted);
    }
    setIsMutedState(muted);
  }, []);

  const toggleDeafen = useCallback(() => {
    if (signalingManagerRef.current) {
      const deafened = signalingManagerRef.current.setDeafened(!isDeafened);
      setIsDeafenedState(deafened);
      if (deafened) {
        signalingManagerRef.current.setMuted(true);
        setIsMutedState(true);
      }
    } else {
      setIsDeafenedState((prev) => !prev);
    }
  }, [isDeafened]);

  // 8. Controles de Vídeo / Webcam com Tratamento de Erro Robusto
  const toggleVideo = useCallback(async (): Promise<boolean> => {
    if (!signalingManagerRef.current) {
      toast.info('Conecte-se à chamada antes de ativar a câmera.');
      return false;
    }

    try {
      const active = await signalingManagerRef.current.toggleVideo(selectedVideoDeviceId || undefined);
      setIsVideoEnabled(active);
      const currentLocalStream = signalingManagerRef.current.getLocalVideoStream();
      setLocalVideoStream(currentLocalStream);
      setCameraError(null);

      if (active) {
        setVideoLayoutState('grid');
        toast.success('Webcam ativada!');
      } else {
        toast.info('Webcam desativada.');
      }
      return active;
    } catch (e: any) {
      console.error('Erro ao alternar webcam:', e);
      const errorDetails = parseCameraError(e);
      setCameraError(errorDetails);
      toast.error(errorDetails.title);
      return false;
    }
  }, [selectedVideoDeviceId]);

  const setVideoEnabled = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (!signalingManagerRef.current) return false;

    if (enabled) {
      try {
        const stream = await signalingManagerRef.current.startVideo(selectedVideoDeviceId || undefined);
        const active = !!stream;
        setIsVideoEnabled(active);
        setLocalVideoStream(stream);
        setCameraError(null);
        if (active) {
          setVideoLayoutState('grid');
          toast.success('Webcam ativada!');
        }
        return active;
      } catch (e: any) {
        console.error('Erro ao iniciar webcam:', e);
        const errorDetails = parseCameraError(e);
        setCameraError(errorDetails);
        toast.error(errorDetails.title);
        return false;
      }
    } else {
      signalingManagerRef.current.stopVideo();
      setIsVideoEnabled(false);
      setLocalVideoStream(null);
      setCameraError(null);
      toast.info('Webcam desativada.');
      return false;
    }
  }, [selectedVideoDeviceId]);

  const setSelectedVideoDeviceId = useCallback(async (deviceId: string) => {
    setSelectedVideoDeviceIdState(deviceId);
    savePreferences({ selectedVideoDeviceId: deviceId });
    if (isInCall && isVideoEnabled && signalingManagerRef.current) {
      try {
        await signalingManagerRef.current.startVideo(deviceId);
        setCameraError(null);
      } catch (e: any) {
        console.error('Erro ao trocar dispositivo de vídeo:', e);
        const errorDetails = parseCameraError(e);
        setCameraError(errorDetails);
        toast.error(errorDetails.title);
      }
    }
  }, [isInCall, isVideoEnabled, savePreferences]);

  const setVideoLayout = useCallback((layout: 'compact' | 'grid') => {
    setVideoLayoutState(layout);
    savePreferences({ videoLayout: layout });
  }, [savePreferences]);

  // 9. Volume por participante
  const setParticipantVolume = useCallback((userId: string, volume: number) => {
    const clamped = Math.max(0, Math.min(2.0, volume));
    setPeerVolumes((prev) => {
      const next = { ...prev, [userId]: clamped };
      savePreferences({ peerVolumes: next });
      return next;
    });

    if (signalingManagerRef.current) {
      signalingManagerRef.current.getVoiceManager().setPeerVolume(userId, clamped);
    }
  }, [savePreferences]);

  // 10. Modo de Entrada (VAD vs PTT)
  const setInputMode = useCallback((mode: 'vad' | 'ptt') => {
    setInputModeState(mode);
    savePreferences({ inputMode: mode });
    if (signalingManagerRef.current) {
      signalingManagerRef.current.getVoiceManager().setInputMode(mode);
    }
  }, [savePreferences]);

  const setPttKey = useCallback((key: string) => {
    setPttKeyState(key);
    savePreferences({ pttKey: key });
  }, [savePreferences]);

  const setVadSensitivity = useCallback((val: number) => {
    setVadSensitivityState(val);
    savePreferences({ vadSensitivity: val });
    if (signalingManagerRef.current) {
      signalingManagerRef.current.getVoiceManager().setVadThreshold(val);
    }
  }, [savePreferences]);

  const setSelectedAudioDeviceId = useCallback(async (deviceId: string) => {
    setSelectedAudioDeviceIdState(deviceId);
    savePreferences({ selectedAudioDeviceId: deviceId });
    if (isInCall && signalingManagerRef.current) {
      await signalingManagerRef.current.initialize(deviceId);
    }
  }, [isInCall, savePreferences]);

  // 11. Push-to-Talk Global Keyboard Listeners
  useEffect(() => {
    if (!isInCall || inputMode !== 'ptt') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.code === pttKey || e.key === pttKey) {
        if (!isPttPressed) {
          setIsPttPressed(true);
          signalingManagerRef.current?.getVoiceManager().setPushToTalkActive(true);
          setIsMutedState(false);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === pttKey || e.key === pttKey) {
        setIsPttPressed(false);
        signalingManagerRef.current?.getVoiceManager().setPushToTalkActive(false);
        setIsMutedState(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInCall, inputMode, pttKey, isPttPressed]);

  // 12. Lista consolidada de participantes da chamada (apenas quem realmente está na call)
  const participants = useMemo<VoiceParticipantState[]>(() => {
    const list: VoiceParticipantState[] = [];

    // Participante local
    list.push({
      userId: currentUserId,
      displayName: user?.displayName || user?.user_metadata?.full_name || (activeCampaign?.role === 'dm' ? 'Mestre (Você)' : 'Jogador (Você)'),
      avatarUrl: user?.avatarUrl || user?.user_metadata?.avatar_url,
      role: activeCampaign?.role || 'dm',
      isSpeaking,
      speakingLevel: localSpeakingLevel,
      volume: 1.0,
      isMuted,
      isConnected: isInCall,
      isVideoEnabled,
      stream: localVideoStream,
    });

    // Participantes remotos (apenas aqueles que entraram na chamada de voz/vídeo)
    onlineUsers.forEach((peer) => {
      if (peer.userId !== currentUserId && (inCallPeerIds.has(peer.userId) || connectedPeerIds.has(peer.userId))) {
        const speakingState = peerSpeakingStates[peer.userId];
        const isPeerConnected = connectedPeerIds.has(peer.userId);
        const volume = peerVolumes[peer.userId] ?? 1.0;
        const remoteStream = remoteStreams[peer.userId] || null;
        const hasVideoTrack = !!remoteStream && remoteStream.getVideoTracks().some((t) => t.enabled && t.readyState === 'live');

        list.push({
          userId: peer.userId,
          displayName: peer.displayName || 'Jogador',
          avatarUrl: peer.avatarUrl,
          role: peer.userId.includes('dm') ? 'dm' : 'player',
          isSpeaking: speakingState?.isSpeaking || false,
          speakingLevel: speakingState?.level || 0,
          volume,
          isMuted: false,
          isConnected: isPeerConnected,
          isVideoEnabled: hasVideoTrack,
          stream: remoteStream,
        });
      }
    });

    return list;
  }, [
    currentUserId,
    user,
    activeCampaign,
    isSpeaking,
    localSpeakingLevel,
    isMuted,
    isInCall,
    isVideoEnabled,
    localVideoStream,
    onlineUsers,
    inCallPeerIds,
    peerSpeakingStates,
    connectedPeerIds,
    peerVolumes,
    remoteStreams,
  ]);

  const value = {
    isInCall,
    isConnecting,
    isMuted,
    isDeafened,
    isSpeaking,
    localSpeakingLevel,
    inputMode,
    pttKey,
    isPttPressed,
    vadSensitivity,
    audioDevices,
    selectedAudioDeviceId,
    isVideoEnabled,
    localVideoStream,
    videoDevices,
    selectedVideoDeviceId,
    videoLayout,
    setVideoLayout,
    cameraError,
    setCameraError,
    clearCameraError,
    participants,
    connectedPeersCount: connectedPeerIds.size,
    activeCallPeersCount: inCallPeerIds.size,
    isWidgetOpen,
    setIsWidgetOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    joinCall,
    leaveCall,
    toggleMute,
    setMuted,
    toggleDeafen,
    toggleVideo,
    setVideoEnabled,
    setParticipantVolume,
    setInputMode,
    setPttKey,
    setVadSensitivity,
    setSelectedAudioDeviceId,
    setSelectedVideoDeviceId,
    refreshAudioDevices,
    refreshVideoDevices,
  };

  return (
    <VoiceCallContext.Provider value={value}>
      {children}
      {/* Modal Popup Global de Erro de Câmera */}
      <CameraErrorModal
        error={cameraError}
        onClose={clearCameraError}
        onRetry={isInCall ? () => toggleVideo() : undefined}
      />
    </VoiceCallContext.Provider>
  );
};

export const useVoiceCall = () => {
  const context = useContext(VoiceCallContext);
  if (!context) {
    throw new Error('useVoiceCall deve ser usado dentro de um VoiceCallProvider');
  }
  return context;
};
