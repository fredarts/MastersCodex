import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebRTCVoiceManager } from '../voice/WebRTCVoiceManager';

class MockMediaStream {
  tracks: MediaStreamTrack[] = [];
  constructor(tracks: MediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }
  getTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === 'audio');
  }
  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === 'video');
  }
  addTrack(track: MediaStreamTrack) {
    this.tracks.push(track);
  }
  removeTrack(track: MediaStreamTrack) {
    this.tracks = this.tracks.filter((t) => t.id !== track.id);
  }
}

describe('WebRTCVoiceManager', () => {
  let voiceManager: WebRTCVoiceManager;

  beforeEach(() => {
    vi.clearAllMocks();

    (global as any).window = {
      AudioContext: class {
        createMediaStreamSource() {
          return { connect: vi.fn() };
        }
        createGain() {
          return { gain: { value: 1 }, connect: vi.fn() };
        }
        createAnalyser() {
          return { fftSize: 256, getByteFrequencyData: vi.fn() };
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      },
    };

    (global as any).MediaStream = MockMediaStream;

    (global as any).document = {
      getElementById: () => null,
      createElement: () => ({
        play: () => Promise.resolve(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
      }),
      body: {
        appendChild: vi.fn(),
      },
    };

    voiceManager = new WebRTCVoiceManager();
  });

  it('deve inicializar com valores padrão corretos', () => {
    expect(voiceManager.getIsMuted()).toBe(false);
    expect(voiceManager.getIsDeafened()).toBe(false);
    expect(voiceManager.getInputMode()).toBe('vad');
    expect(voiceManager.getVadThreshold()).toBe(25);
  });

  it('deve alternar e definir estado de Mute/Unmute', () => {
    expect(voiceManager.getIsMuted()).toBe(false);
    voiceManager.setMuted(true);
    expect(voiceManager.getIsMuted()).toBe(true);
    voiceManager.setMuted(false);
    expect(voiceManager.getIsMuted()).toBe(false);
  });

  it('deve gerenciar estado de Ensurdecer (Deafen)', () => {
    expect(voiceManager.getIsDeafened()).toBe(false);
    voiceManager.setDeafened(true);
    expect(voiceManager.getIsDeafened()).toBe(true);
    voiceManager.setDeafened(false);
    expect(voiceManager.getIsDeafened()).toBe(false);
  });

  it('deve controlar volume individual por peer', () => {
    expect(voiceManager.getPeerVolume('peer-123')).toBe(1.0); // Padrão 100%
    voiceManager.setPeerVolume('peer-123', 1.5); // 150%
    expect(voiceManager.getPeerVolume('peer-123')).toBe(1.5);

    voiceManager.setPeerVolume('peer-456', 0.2); // 20%
    expect(voiceManager.getPeerVolume('peer-456')).toBe(0.2);
  });

  it('deve alternar entre Ativação por Voz (VAD) e Push-to-Talk (PTT)', () => {
    voiceManager.setInputMode('ptt');
    expect(voiceManager.getInputMode()).toBe('ptt');
    expect(voiceManager.getIsMuted()).toBe(true); // PTT inicia com microfone fechado

    // Ativar Push-to-Talk enquanto a tecla está pressionada
    voiceManager.setPushToTalkActive(true);
    expect(voiceManager.getIsMuted()).toBe(false);

    // Soltar tecla
    voiceManager.setPushToTalkActive(false);
    expect(voiceManager.getIsMuted()).toBe(true);

    // Voltar para VAD
    voiceManager.setInputMode('vad');
    expect(voiceManager.getInputMode()).toBe('vad');
  });

  it('deve ajustar threshold de sensibilidade VAD dentro dos limites seguros', () => {
    voiceManager.setVadThreshold(45);
    expect(voiceManager.getVadThreshold()).toBe(45);

    voiceManager.setVadThreshold(2); // Abaixo do mínimo de 5
    expect(voiceManager.getVadThreshold()).toBe(5);

    voiceManager.setVadThreshold(150); // Acima do máximo de 100
    expect(voiceManager.getVadThreshold()).toBe(100);
  });

  it('deve registrar callbacks de detecção de fala local e remota', () => {
    const localCb = vi.fn();
    const peerCb = vi.fn();
    voiceManager.setOnSpeakingChange(localCb);
    voiceManager.setOnPeerSpeakingChange(peerCb);

    expect(localCb).not.toHaveBeenCalled();
    expect(peerCb).not.toHaveBeenCalled();
  });

  it('deve gerenciar estado inicial e parada de transmissão de vídeo', () => {
    expect(voiceManager.getIsVideoEnabled()).toBe(false);
    expect(voiceManager.getLocalVideoStream()).toBeNull();
    expect(voiceManager.getRemoteStreams().size).toBe(0);

    voiceManager.stopVideo();
    expect(voiceManager.getIsVideoEnabled()).toBe(false);
  });

  it('deve registrar callbacks de alteração de vídeo local e remoto', () => {
    const localVideoCb = vi.fn();
    const remoteStreamCb = vi.fn();
    const renegotiateCb = vi.fn();

    voiceManager.setOnLocalVideoStreamChange(localVideoCb);
    voiceManager.setOnRemoteStreamChange(remoteStreamCb);
    voiceManager.setOnRenegotiationNeeded(renegotiateCb);

    voiceManager.stopVideo();
    expect(localVideoCb).toHaveBeenCalledWith(null);
  });

  it('deve gerenciar faixas remotas mantendo stream composto com áudio e vídeo juntos', () => {
    // Mock simples de MediaStreamTrack
    const audioTrack = {
      id: 'audio-track-1',
      kind: 'audio',
      enabled: true,
      readyState: 'live',
      onended: null,
      onmute: null,
      onunmute: null,
    } as unknown as MediaStreamTrack;

    const videoTrack = {
      id: 'video-track-1',
      kind: 'video',
      enabled: true,
      readyState: 'live',
      onended: null,
      onmute: null,
      onunmute: null,
    } as unknown as MediaStreamTrack;

    const onRemoteStreamChange = vi.fn();
    voiceManager.setOnRemoteStreamChange(onRemoteStreamChange);

    // 1. Adicionar áudio
    voiceManager.attachRemoteTrack('peer-abc', audioTrack);
    const stream = voiceManager.getRemoteStreams().get('peer-abc');
    expect(stream).toBeDefined();
    expect(stream?.getAudioTracks().length).toBe(1);
    expect(stream?.getVideoTracks().length).toBe(0);

    // 2. Adicionar vídeo em seguida (ao ligar a webcam)
    voiceManager.attachRemoteTrack('peer-abc', videoTrack);
    expect(stream?.getAudioTracks().length).toBe(1);
    expect(stream?.getVideoTracks().length).toBe(1);
    expect(onRemoteStreamChange).toHaveBeenCalledTimes(2);

    // 3. Simular encerramento da trilha de vídeo
    if (typeof videoTrack.onended === 'function') {
      (videoTrack.onended as any)();
    }
    expect(stream?.getVideoTracks().length).toBe(0);
    expect(stream?.getAudioTracks().length).toBe(1); // Áudio continua ativo!

    // 4. Desconectar peer
    voiceManager.detachRemoteStream('peer-abc');
    expect(voiceManager.getRemoteStreams().has('peer-abc')).toBe(false);
  });

  it('deve fechar todas as conexões e limpar recursos ao chamar closeAllConnections', () => {
    voiceManager.closeAllConnections();
    expect(voiceManager.getPeerConnections().size).toBe(0);
    expect(voiceManager.getIsVideoEnabled()).toBe(false);
    expect(voiceManager.getLocalVideoStream()).toBeNull();
    expect(voiceManager.getRemoteStreams().size).toBe(0);
  });
});

