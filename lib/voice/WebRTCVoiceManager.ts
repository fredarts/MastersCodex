export interface VoiceParticipant {
  userId: string;
  isMuted: boolean;
  isSpeaking: boolean;
  volume: number; // 0 to 2 (1 = 100%)
  stream?: MediaStream;
}

export class WebRTCVoiceManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteGainNodes: Map<string, GainNode> = new Map();
  private remoteAnalysers: Map<string, AnalyserNode> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private peerVolumes: Map<string, number> = new Map();

  private isMuted: boolean = false;
  private isDeafened: boolean = false;
  private inputMode: 'vad' | 'ptt' = 'vad';
  private vadThreshold: number = 25; // Sensibilidade de fala (0 - 100)
  private currentInputDeviceId: string | null = null;

  private audioContext: AudioContext | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private onSpeakingChange?: (isSpeaking: boolean, level: number) => void;
  private onPeerSpeakingChange?: (peerId: string, isSpeaking: boolean, level: number) => void;
  private isCheckingVolume: boolean = false;

  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  async initializeLocalStream(deviceId?: string): Promise<MediaStream | null> {
    if (typeof window === 'undefined' || !navigator.mediaDevices) return null;

    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (deviceId) this.currentInputDeviceId = deviceId;

      // Se estiver em modo PTT ou mutado, começa com áudio desabilitado
      this.applyMuteState();

      this.setupAudioAnalysis();
      return this.localStream;
    } catch (e) {
      console.warn('Não foi possível obter acesso ao microfone:', e);
      return null;
    }
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
    if (!this.localStream) return;

    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaStreamSource(this.localStream);
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
      if (!this.localStream) {
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
   * Conecta um stream de áudio remoto recebido do peer a um elemento de reprodução e GainNode
   */
  attachRemoteStream(peerId: string, stream: MediaStream) {
    if (typeof window === 'undefined') return;

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

    // Configurar GainNode e AnalyserNode no AudioContext
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
        // O áudio é reproduzido pelo elemento audioEl; o analyser serve para VU meter
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

  detachRemoteStream(peerId: string) {
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      this.remoteAudioElements.delete(peerId);
    }
    this.remoteGainNodes.delete(peerId);
    this.remoteAnalysers.delete(peerId);
  }

  setPeerVolume(peerId: string, volume: number) {
    // volume varia de 0 (0%) a 2 (200%)
    this.peerVolumes.set(peerId, volume);
    const audioEl = this.remoteAudioElements.get(peerId);
    if (audioEl) {
      // Elementos de áudio suportam volume de 0 a 1
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
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
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
      // Em PTT o microfone fica fechado até a tecla ser pressionada
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

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
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

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.isCheckingVolume = false;
  }
}
