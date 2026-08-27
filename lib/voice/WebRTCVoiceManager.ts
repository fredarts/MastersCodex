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
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');

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
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track?.kind === 'video');
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

      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  }

  /**
   * Conecta um stream remoto (áudio e vídeo) recebido do peer
   */
  attachRemoteStream(peerId: string, stream: MediaStream) {
    if (typeof window === 'undefined') return;

    this.remoteStreams.set(peerId, stream);

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

    audioEl.srcObject = stream;
    audioEl.muted = this.isDeafened;

    // Configurar GainNode e AnalyserNode no AudioContext apenas se houver áudio
    if (stream.getAudioTracks().length > 0) {
      try {
        const ctx = this.getOrCreateAudioContext();
        if (ctx) {
          const source = ctx.createMediaStreamSource(stream);
          const gainNode = ctx.createGain();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;

          const initialVol = this.peerVolumes.get(peerId) ?? 1.0;
          gainNode.gain.value = this.isDeafened ? 0 : initialVol;

          source.connect(gainNode);
          gainNode.connect(analyser);
          this.remoteGainNodes.set(peerId, gainNode);
          this.remoteAnalysers.set(peerId, analyser);
        }
      } catch (err) {
        console.warn(`Não foi possível criar GainNode para o peer ${peerId}:`, err);
      }

      audioEl.play().catch((err) => {
        console.warn(`Autoplay bloqueado para o peer ${peerId}, aguardando interação:`, err);
      });
    }

    if (this.onRemoteStreamChange) {
      this.onRemoteStreamChange(peerId, stream);
    }
  }

  detachRemoteStream(peerId: string) {
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      this.remoteAudioElements.delete(peerId);
    }
    this.remoteGainNodes.delete(peerId);
    this.remoteAnalysers.delete(peerId);
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
    this.remoteGainNodes.clear();
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
