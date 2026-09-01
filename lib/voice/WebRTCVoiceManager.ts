export interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isVideoEnabled?: boolean;
  volume: number; // 0 to 2 (1 = 100%)
  stream?: MediaStream;
}

export class WebRTCVoiceManager {
  private localAudioStream: MediaStream | null = null;
  private localVideoStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteSourceNodes: Map<string, MediaStreamAudioSourceNode> = new Map();
  private remoteGainNodes: Map<string, GainNode> = new Map();
  private remoteAnalysers: Map<string, AnalyserNode> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private peerVolumes: Map<string, number> = new Map();

  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private isVideoEnabled: boolean = false;
  private inputMode: 'vad' | 'ptt' = 'vad';
  private vadThreshold: number = 25; // Sensibilidade de fala (0 - 100)
  private currentInputDeviceId: string | null = null;
  private currentVideoDeviceId: string | null = null;

  private audioContext: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private onSpeakingChange?: (isSpeaking: boolean, level: number) => void;
  private onPeerSpeakingChange?: (peerId: string, isSpeaking: boolean, level: number) => void;
  private onLocalVideoStreamChange?: (stream: MediaStream | null) => void;
  private onRemoteStreamChange?: (peerId: string, stream: MediaStream) => void;
  private onRenegotiationNeeded?: (peerId: string) => void;
  private isCheckingVolume: boolean = false;

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  async initializeLocalStream(deviceId?: string): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return null;

    try {
      if (this.localAudioStream) {
        this.localAudioStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.localAudioStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (deviceId) this.currentInputDeviceId = deviceId;

      // Se estiver em modo PTT ou mutado, começa com áudio desabilitado
      this.applyMuteState();

      // Se houver conexões ativas com peers, atualizar o track de áudio nos senders
      const newAudioTrack = this.localAudioStream.getAudioTracks()[0];
      if (newAudioTrack) {
        this.peerConnections.forEach((pc, peerId) => {
          const senders = pc.getSenders();
          const audioSender = senders.find((s) => s.track?.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(newAudioTrack).catch((err) => {
              console.warn(`Erro ao substituir track de áudio para peer ${peerId}:`, err);
            });
          }
        });
      }

      this.setupAudioAnalysis();
      return this.localAudioStream;
    } catch (e) {
      console.warn('Não foi possível obter acesso ao microfone:', e);
      return null;
    }
  }

  /**
   * Ativa a transmissão de vídeo (webcam)
   */
  async startVideo(deviceId?: string): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return null;

    try {
      if (this.localVideoStream) {
        this.localVideoStream.getTracks().forEach((t) => t.stop());
      }

      const videoConstraints: MediaTrackConstraints = {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
        frameRate: { ideal: 24, max: 30 },
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });

      this.localVideoStream = stream;
      this.isVideoEnabled = true;
      if (deviceId) this.currentVideoDeviceId = deviceId;

      const videoTrack = stream.getVideoTracks()[0];

      // Adicionar ou substituir track de vídeo em todas as conexões peer ativas
      this.peerConnections.forEach((pc, peerId) => {
        let videoSender: RTCRtpSender | null = null;

        if (typeof pc.getTransceivers === 'function') {
          const transceivers = pc.getTransceivers();
          const vt = transceivers.find(
            (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
          );
          if (vt && vt.sender) {
            videoSender = vt.sender;
          }
        }

        if (!videoSender) {
          const senders = pc.getSenders();
          videoSender = senders.find((s) => s.track?.kind === 'video') || null;
        }

        if (videoSender) {
          videoSender.replaceTrack(videoTrack).catch((err) => {
            console.warn(`Erro ao substituir track de vídeo para ${peerId}:`, err);
          });
        } else {
          try {
            pc.addTrack(videoTrack, stream);
            if (this.onRenegotiationNeeded) {
              this.onRenegotiationNeeded(peerId);
            }
          } catch (e) {
            console.warn(`Erro ao adicionar track de vídeo ao peer ${peerId}:`, e);
          }
        }
      });

      if (this.onLocalVideoStreamChange) {
        this.onLocalVideoStreamChange(this.localVideoStream);
      }

      return this.localVideoStream;
    } catch (err: any) {
      console.error('Erro ao iniciar câmera de vídeo:', err);
      this.isVideoEnabled = false;
      throw err;
    }
  }

  /**
   * Desativa a transmissão de vídeo e desliga as tracks de hardware da webcam
   */
  stopVideo(): void {
    this.isVideoEnabled = false;

    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localVideoStream = null;
    }

    // Limpar/substituir para null nos senders WebRTC
    this.peerConnections.forEach((pc, peerId) => {
      let videoSender: RTCRtpSender | null = null;

      if (typeof pc.getTransceivers === 'function') {
        const transceivers = pc.getTransceivers();
        const vt = transceivers.find(
          (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
        );
        if (vt && vt.sender) {
          videoSender = vt.sender;
        }
      }

      if (!videoSender) {
        const senders = pc.getSenders();
        videoSender = senders.find((s) => s.track?.kind === 'video') || null;
      }

      if (videoSender) {
        videoSender.replaceTrack(null).catch((err) => {
          console.warn(`Erro ao zerar track de vídeo para ${peerId}:`, err);
        });
      }
    });

    if (this.onLocalVideoStreamChange) {
      this.onLocalVideoStreamChange(null);
    }
  }

  async toggleVideo(deviceId?: string): Promise<boolean> {
    if (this.isVideoEnabled) {
      this.stopVideo();
      return false;
    } else {
      const stream = await this.startVideo(deviceId || this.currentVideoDeviceId || undefined);
      return !!stream;
    }
  }

  getLocalVideoStream(): MediaStream | null {
    return this.localVideoStream;
  }

  getIsVideoEnabled(): boolean {
    return this.isVideoEnabled;
  }

  getRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  setOnLocalVideoStreamChange(cb: (stream: MediaStream | null) => void) {
    this.onLocalVideoStreamChange = cb;
  }

  setOnRemoteStreamChange(cb: (peerId: string, stream: MediaStream) => void) {
    this.onRemoteStreamChange = cb;
  }

  setOnRenegotiationNeeded(cb: (peerId: string) => void) {
    this.onRenegotiationNeeded = cb;
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  private setupAudioAnalysis() {
    if (!this.localAudioStream) return;

    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaStreamSource(this.localAudioStream);
      this.localAnalyser = ctx.createAnalyser();
      this.localAnalyser.fftSize = 256;
      source.connect(this.localAnalyser);

      if (!this.isCheckingVolume) {
        this.isCheckingVolume = true;
        this.loopVolumeCheck();
      }
    } catch (e) {
      console.warn('Falha ao configurar análise de VU meter de áudio WebRTC:', e);
    }
  }

  private loopVolumeCheck() {
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const check = () => {
      if (!this.localAudioStream) {
        this.isCheckingVolume = false;
        return;
      }

      // 1. Checa microfone local
      if (this.localAnalyser && !this.isMuted) {
        this.localAnalyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isSpeaking = average > this.vadThreshold;
        const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));

        if (this.onSpeakingChange) {
          this.onSpeakingChange(isSpeaking, normalizedLevel);
        }
      } else if (this.isMuted && this.onSpeakingChange) {
        this.onSpeakingChange(false, 0);
      }

      // 2. Checa áudio dos peers remotos
      this.remoteAnalysers.forEach((analyser, peerId) => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isSpeaking = average > 15;
        const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));

        if (this.onPeerSpeakingChange) {
          this.onPeerSpeakingChange(peerId, isSpeaking, normalizedLevel);
        }
      });

      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(check);
      } else if (typeof setTimeout === 'function') {
        setTimeout(check, 50);
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(check);
    } else if (typeof setTimeout === 'function') {
      setTimeout(check, 50);
    }
  }

  /**
   * Conecta uma faixa remota individual (áudio ou vídeo) recebida do peer ao stream composto.
   */
  attachRemoteTrack(peerId: string, track: MediaStreamTrack) {
    if (typeof window === 'undefined') return;

    let compositeStream = this.remoteStreams.get(peerId);
    if (!compositeStream) {
      compositeStream = new MediaStream();
      this.remoteStreams.set(peerId, compositeStream);
    }

    // Se já tiver uma faixa do mesmo tipo com ID diferente, substitui
    const existingTracks = track.kind === 'audio' ? compositeStream.getAudioTracks() : compositeStream.getVideoTracks();
    const isAlreadyPresent = existingTracks.some((t) => t.id === track.id);
    if (!isAlreadyPresent) {
      existingTracks.forEach((t) => compositeStream!.removeTrack(t));
      compositeStream.addTrack(track);
    }

    // Ouvintes para manter sincronia quando o peer parar ou pausar a trilha
    track.onended = () => {
      compositeStream?.removeTrack(track);
      if (this.onRemoteStreamChange && compositeStream) {
        this.onRemoteStreamChange(peerId, compositeStream);
      }
    };
    track.onmute = () => {
      if (this.onRemoteStreamChange && compositeStream) {
        this.onRemoteStreamChange(peerId, compositeStream);
      }
    };
    track.onunmute = () => {
      if (this.onRemoteStreamChange && compositeStream) {
        this.onRemoteStreamChange(peerId, compositeStream);
      }
    };

    // Configurar áudio exclusivamente quando a faixa for do tipo 'audio'
    if (track.kind === 'audio') {
      let audioEl = this.remoteAudioElements.get(peerId);
      if (!audioEl) {
        audioEl = document.getElementById(`audio-peer-${peerId}`) as HTMLAudioElement;
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.id = `audio-peer-${peerId}`;
          audioEl.autoplay = true;
          audioEl.setAttribute('playsinline', 'true');
          document.body.appendChild(audioEl);
        }
        this.remoteAudioElements.set(peerId, audioEl);
      }

      const audioStream = new MediaStream([track]);
      audioEl.srcObject = audioStream;

      // Configurar GainNode, AnalyserNode e conectar à saída de áudio (ctx.destination)
      try {
        const ctx = this.getOrCreateAudioContext();
        if (ctx) {
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }

          // Desconectar nós anteriores se existirem
          const prevSource = this.remoteSourceNodes.get(peerId);
          if (prevSource) {
            try {
              prevSource.disconnect();
            } catch (e) {}
          }
          const prevGain = this.remoteGainNodes.get(peerId);
          if (prevGain) {
            try {
              prevGain.disconnect();
            } catch (e) {}
          }
          const prevAnalyser = this.remoteAnalysers.get(peerId);
          if (prevAnalyser) {
            try {
              prevAnalyser.disconnect();
            } catch (e) {}
          }

          const source = ctx.createMediaStreamSource(audioStream);
          const gainNode = ctx.createGain();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;

          const initialVol = this.peerVolumes.get(peerId) ?? 1.0;
          gainNode.gain.value = this.isDeafened ? 0 : initialVol;

          // Pipeline Web Audio: source -> gainNode -> analyser -> ctx.destination
          source.connect(gainNode);
          gainNode.connect(analyser);
          gainNode.connect(ctx.destination);

          this.remoteSourceNodes.set(peerId, source);
          this.remoteGainNodes.set(peerId, gainNode);
          this.remoteAnalysers.set(peerId, analyser);

          // Quando a Web Audio API reproduz via ctx.destination, o elemento de áudio
          // pode ser mutado para evitar eco ou mantido ativo conforme política do navegador
          audioEl.muted = true;
        } else {
          audioEl.muted = this.isDeafened;
          audioEl.volume = Math.min(1.0, Math.max(0, this.peerVolumes.get(peerId) ?? 1.0));
        }
      } catch (err) {
        console.warn(`Não foi possível criar GainNode para o peer ${peerId}, usando fallback de áudio:`, err);
        audioEl.muted = this.isDeafened;
        audioEl.volume = Math.min(1.0, Math.max(0, this.peerVolumes.get(peerId) ?? 1.0));
      }

      audioEl.play().catch((err) => {
        console.warn(`Autoplay bloqueado para o peer ${peerId}, aguardando interação:`, err);
      });
    }

    if (this.onRemoteStreamChange) {
      this.onRemoteStreamChange(peerId, compositeStream);
    }
  }

  /**
   * Conecta um stream remoto (áudio e vídeo) recebido do peer
   */
  attachRemoteStream(peerId: string, stream: MediaStream) {
    if (typeof window === 'undefined') return;
    stream.getTracks().forEach((track) => {
      this.attachRemoteTrack(peerId, track);
    });
  }

  detachRemoteStream(peerId: string) {
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      this.remoteAudioElements.delete(peerId);
    }

    const source = this.remoteSourceNodes.get(peerId);
    if (source) {
      try {
        source.disconnect();
      } catch (e) {}
      this.remoteSourceNodes.delete(peerId);
    }

    const gain = this.remoteGainNodes.get(peerId);
    if (gain) {
      try {
        gain.disconnect();
      } catch (e) {}
      this.remoteGainNodes.delete(peerId);
    }

    const analyser = this.remoteAnalysers.get(peerId);
    if (analyser) {
      try {
        analyser.disconnect();
      } catch (e) {}
      this.remoteAnalysers.delete(peerId);
    }

    this.remoteStreams.delete(peerId);
  }

  setPeerVolume(peerId: string, volume: number) {
    this.peerVolumes.set(peerId, volume);
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      audioEl.volume = Math.min(1.0, Math.max(0, volume));
    }
    const gainNode = this.remoteGainNodes.get(peerId);
    if (gainNode) {
      gainNode.gain.value = this.isDeafened ? 0 : volume;
    }
  }

  getPeerVolume(peerId: string): number {
    return this.peerVolumes.get(peerId) ?? 1.0;
  }

  setDeafened(deafened: boolean): boolean {
    this.isDeafened = deafened;
    this.remoteAudioElements.forEach((el) => {
      el.muted = deafened;
    });
    this.remoteGainNodes.forEach((gain, peerId) => {
      gain.gain.value = deafened ? 0 : (this.peerVolumes.get(peerId) ?? 1.0);
    });
    return this.isDeafened;
  }

  getIsDeafened(): boolean {
    return this.isDeafened;
  }

  setMuted(muted: boolean): boolean {
    this.isMuted = muted;
    this.applyMuteState();
    return this.isMuted;
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.applyMuteState();
    return this.isMuted;
  }

  private applyMuteState() {
    if (this.localAudioStream) {
      const audioTracks = this.localAudioStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  setInputMode(mode: 'vad' | 'ptt') {
    this.inputMode = mode;
    if (mode === 'ptt') {
      this.setMuted(true);
    }
  }

  getInputMode(): 'vad' | 'ptt' {
    return this.inputMode;
  }

  setPushToTalkActive(active: boolean) {
    if (this.inputMode === 'ptt') {
      this.setMuted(!active);
    }
  }

  setVadThreshold(threshold: number) {
    this.vadThreshold = Math.max(5, Math.min(100, threshold));
  }

  getVadThreshold(): number {
    return this.vadThreshold;
  }

  setOnSpeakingChange(cb: (isSpeaking: boolean, level: number) => void) {
    this.onSpeakingChange = cb;
  }

  setOnPeerSpeakingChange(cb: (peerId: string, isSpeaking: boolean, level: number) => void) {
    this.onPeerSpeakingChange = cb;
  }

  createPeerConnection(peerId: string, onIceCandidate?: (candidate: RTCIceCandidate) => void): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    // Adicionar faixa de áudio local
    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localAudioStream!);
      });
    }

    // Adicionar faixa de vídeo local se estiver ativo
    if (this.localVideoStream && this.isVideoEnabled) {
      this.localVideoStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localVideoStream!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  getPeerConnections(): Map<string, RTCPeerConnection> {
    return this.peerConnections;
  }

  closeAllConnections() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    this.remoteAudioElements.forEach((el) => {
      el.srcObject = null;
      el.remove();
    });
    this.remoteAudioElements.clear();

    this.remoteSourceNodes.forEach((source) => {
      try {
        source.disconnect();
      } catch (e) {}
    });
    this.remoteSourceNodes.clear();

    this.remoteGainNodes.forEach((gain) => {
      try {
        gain.disconnect();
      } catch (e) {}
    });
    this.remoteGainNodes.clear();

    this.remoteAnalysers.forEach((analyser) => {
      try {
        analyser.disconnect();
      } catch (e) {}
    });
    this.remoteAnalysers.clear();
    this.remoteStreams.clear();

    if (this.localAudioStream) {
      this.localAudioStream.getTracks().forEach((track) => track.stop());
      this.localAudioStream = null;
    }

    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((track) => track.stop());
      this.localVideoStream = null;
    }
    this.isVideoEnabled = false;

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.isCheckingVolume = false;
  }
}
