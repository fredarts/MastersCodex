import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebRTCVoiceManager } from '../voice/WebRTCVoiceManager';
import { VoiceSignalingManager } from '../voice/VoiceSignalingManager';

class MockMediaStreamTrack {
  id: string;
  kind: 'audio' | 'video';
  enabled: boolean = true;
  readyState: 'live' | 'ended' = 'live';
  onended: (() => void) | null = null;
  onmute: (() => void) | null = null;
  onunmute: (() => void) | null = null;

  constructor(id: string, kind: 'audio' | 'video') {
    this.id = id;
    this.kind = kind;
  }

  stop() {
    this.readyState = 'ended';
    if (this.onended) this.onended();
  }
}

class MockMediaStream {
  tracks: MockMediaStreamTrack[] = [];
  constructor(tracks: MockMediaStreamTrack[] = []) {
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
  addTrack(track: MockMediaStreamTrack) {
    this.tracks.push(track);
  }
  removeTrack(track: MockMediaStreamTrack) {
    this.tracks = this.tracks.filter((t) => t.id !== track.id);
  }
}

describe('WebRTCVoiceManager & Web Audio Pipeline', () => {
  let voiceManager: WebRTCVoiceManager;
  let mockDestination: any;
  let mockSourceConnect: any;
  let mockSourceDisconnect: any;
  let mockGainConnect: any;
  let mockGainDisconnect: any;
  let mockGainObj: any;
  let mockAnalyserConnect: any;
  let mockAnalyserDisconnect: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDestination = { id: 'destination-node' };
    mockSourceConnect = vi.fn();
    mockSourceDisconnect = vi.fn();
    mockGainConnect = vi.fn();
    mockGainDisconnect = vi.fn();
    mockGainObj = { value: 1.0 };
    mockAnalyserConnect = vi.fn();
    mockAnalyserDisconnect = vi.fn();

    const mockMediaDevices = {
      getUserMedia: vi.fn().mockImplementation(async (constraints) => {
        if (constraints?.video) {
          return new MockMediaStream([new MockMediaStreamTrack('vid-loc-1', 'video')]);
        }
        return new MockMediaStream([new MockMediaStreamTrack('aud-loc-1', 'audio')]);
      }),
    };

    try {
      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: mockMediaDevices,
        },
        writable: true,
        configurable: true,
      });
    } catch (e) {
      (global as any).navigator.mediaDevices = mockMediaDevices;
    }

    (global as any).window = {
      AudioContext: class {
        destination = mockDestination;
        state = 'running';
        createMediaStreamSource() {
          return {
            connect: mockSourceConnect,
            disconnect: mockSourceDisconnect,
          };
        }
        createGain() {
          return {
            gain: mockGainObj,
            connect: mockGainConnect,
            disconnect: mockGainDisconnect,
          };
        }
        createAnalyser() {
          return {
            fftSize: 256,
            getByteFrequencyData: vi.fn(),
            connect: mockAnalyserConnect,
            disconnect: mockAnalyserDisconnect,
          };
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      },
      navigator: (global as any).navigator,
    };

    (global as any).MediaStream = MockMediaStream;

    (global as any).document = {
      getElementById: () => null,
      createElement: () => ({
        play: () => Promise.resolve(),
        setAttribute: vi.fn(),
        remove: vi.fn(),
        muted: false,
        volume: 1,
        srcObject: null,
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
    expect(voiceManager.getPeerVolume('peer-123')).toBe(1.0);
    voiceManager.setPeerVolume('peer-123', 1.5);
    expect(voiceManager.getPeerVolume('peer-123')).toBe(1.5);

    voiceManager.setPeerVolume('peer-456', 0.2);
    expect(voiceManager.getPeerVolume('peer-456')).toBe(0.2);
  });

  it('deve alternar entre Ativação por Voz (VAD) e Push-to-Talk (PTT)', () => {
    voiceManager.setInputMode('ptt');
    expect(voiceManager.getInputMode()).toBe('ptt');
    expect(voiceManager.getIsMuted()).toBe(true);

    voiceManager.setPushToTalkActive(true);
    expect(voiceManager.getIsMuted()).toBe(false);

    voiceManager.setPushToTalkActive(false);
    expect(voiceManager.getIsMuted()).toBe(true);

    voiceManager.setInputMode('vad');
    expect(voiceManager.getInputMode()).toBe('vad');
  });

  it('deve conectar o pipeline Web Audio a ctx.destination na recepção de áudio remoto', () => {
    const audioTrack = new MockMediaStreamTrack('remote-aud-1', 'audio') as unknown as MediaStreamTrack;

    voiceManager.attachRemoteTrack('peer-audio-test', audioTrack);

    // 1. Verifica conexão source -> gainNode
    expect(mockSourceConnect).toHaveBeenCalled();

    // 2. Verifica conexão gainNode -> analyser E gainNode -> ctx.destination
    expect(mockGainConnect).toHaveBeenCalledWith(mockDestination);

    // 3. Verifica que o volume inicial foi aplicado no GainNode
    expect(mockGainObj.value).toBe(1.0);

    // 4. Alterar volume deve refletir no GainNode
    voiceManager.setPeerVolume('peer-audio-test', 1.8);
    expect(mockGainObj.value).toBe(1.8);

    // 5. Ensurdecer deve zerar o GainNode
    voiceManager.setDeafened(true);
    expect(mockGainObj.value).toBe(0);

    // 6. Des-ensurdecer deve restaurar o volume
    voiceManager.setDeafened(false);
    expect(mockGainObj.value).toBe(1.8);
  });

  it('deve preservar a faixa de áudio e não reiniciar o som quando a faixa de vídeo for adicionada', () => {
    const audioTrack = new MockMediaStreamTrack('audio-t1', 'audio') as unknown as MediaStreamTrack;
    const videoTrack = new MockMediaStreamTrack('video-t1', 'video') as unknown as MediaStreamTrack;

    const onRemoteStreamChange = vi.fn();
    voiceManager.setOnRemoteStreamChange(onRemoteStreamChange);

    // 1. Conectar áudio primeiro
    voiceManager.attachRemoteTrack('peer-combo', audioTrack);
    const stream = voiceManager.getRemoteStreams().get('peer-combo');
    expect(stream).toBeDefined();
    expect(stream?.getAudioTracks().length).toBe(1);
    expect(stream?.getVideoTracks().length).toBe(0);

    const initialSourceConnectCalls = mockSourceConnect.mock.calls.length;

    // 2. Ligar vídeo em seguida (recebendo faixa de vídeo)
    voiceManager.attachRemoteTrack('peer-combo', videoTrack);
    expect(stream?.getAudioTracks().length).toBe(1);
    expect(stream?.getVideoTracks().length).toBe(1);

    // O pipeline de áudio não deve ser destruído/reiniciado pela adição do vídeo
    expect(mockSourceConnect.mock.calls.length).toBe(initialSourceConnectCalls);
    expect(onRemoteStreamChange).toHaveBeenCalledTimes(2);

    // 3. Desligar vídeo (onended)
    if (typeof videoTrack.onended === 'function') {
      (videoTrack.onended as any)();
    }
    expect(stream?.getVideoTracks().length).toBe(0);
    expect(stream?.getAudioTracks().length).toBe(1); // Áudio intacto
  });

  it('deve suportar ciclo de vida da câmera (iniciar -> parar -> reiniciar) reutilizando transceivers', async () => {
    const mockVideoSender = {
      track: null as any,
      replaceTrack: vi.fn().mockResolvedValue(undefined),
    };

    const mockTransceiver = {
      receiver: { track: { kind: 'video' } },
      sender: mockVideoSender,
    };

    const mockPc = {
      addTrack: vi.fn(),
      getSenders: vi.fn().mockReturnValue([mockVideoSender]),
      getTransceivers: vi.fn().mockReturnValue([mockTransceiver]),
      close: vi.fn(),
    } as unknown as RTCPeerConnection;

    voiceManager.getPeerConnections().set('peer-x', mockPc);

    // 1. Iniciar vídeo
    await voiceManager.startVideo();
    expect(voiceManager.getIsVideoEnabled()).toBe(true);
    expect(mockVideoSender.replaceTrack).toHaveBeenCalled();

    // 2. Parar vídeo
    voiceManager.stopVideo();
    expect(voiceManager.getIsVideoEnabled()).toBe(false);
    expect(mockVideoSender.replaceTrack).toHaveBeenCalledWith(null);

    // 3. Reiniciar vídeo - deve usar replaceTrack no transceiver existente sem disparar addTrack duplicado
    mockVideoSender.replaceTrack.mockClear();
    (mockPc.addTrack as any).mockClear();

    await voiceManager.startVideo();
    expect(voiceManager.getIsVideoEnabled()).toBe(true);
    expect(mockVideoSender.replaceTrack).toHaveBeenCalled();
    expect(mockPc.addTrack).not.toHaveBeenCalled();
  });

  it('deve atualizar o track de áudio nos senders de conexões ativas ao trocar de microfone', async () => {
    const mockAudioSender = {
      track: { kind: 'audio' },
      replaceTrack: vi.fn().mockResolvedValue(undefined),
    };

    const mockPc = {
      getSenders: vi.fn().mockReturnValue([mockAudioSender]),
      close: vi.fn(),
    } as unknown as RTCPeerConnection;

    voiceManager.getPeerConnections().set('peer-mic-test', mockPc);

    // Inicializar microfone
    await voiceManager.initializeLocalStream('new-mic-device-id');
    expect(mockAudioSender.replaceTrack).toHaveBeenCalled();
  });

  it('deve limpar e desconectar nós de áudio e conexões no closeAllConnections', () => {
    const audioTrack = new MockMediaStreamTrack('remote-aud-clean', 'audio') as unknown as MediaStreamTrack;
    voiceManager.attachRemoteTrack('peer-clean', audioTrack);

    voiceManager.closeAllConnections();

    expect(mockSourceDisconnect).toHaveBeenCalled();
    expect(mockGainDisconnect).toHaveBeenCalled();
    expect(mockAnalyserDisconnect).toHaveBeenCalled();
    expect(voiceManager.getRemoteStreams().size).toBe(0);
    expect(voiceManager.getPeerConnections().size).toBe(0);
  });
});

describe('VoiceSignalingManager & P2P Signaling Flow', () => {
  let signalingManagerA: VoiceSignalingManager;
  let signalingManagerB: VoiceSignalingManager;
  let signalsFromA: any[] = [];
  let signalsFromB: any[] = [];

  beforeEach(() => {
    signalsFromA = [];
    signalsFromB = [];

    const mockMediaDevices = {
      getUserMedia: vi.fn().mockImplementation(async () => {
        return new MockMediaStream([new MockMediaStreamTrack('aud-loc-signaling', 'audio')]);
      }),
    };

    try {
      Object.defineProperty(global, 'navigator', {
        value: { mediaDevices: mockMediaDevices },
        writable: true,
        configurable: true,
      });
    } catch (e) {
      (global as any).navigator.mediaDevices = mockMediaDevices;
    }

    (global as any).window = {
      AudioContext: class {
        destination = {};
        state = 'running';
        createMediaStreamSource() {
          return { connect: vi.fn(), disconnect: vi.fn() };
        }
        createGain() {
          return { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
        }
        createAnalyser() {
          return { fftSize: 256, getByteFrequencyData: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      },
      navigator: (global as any).navigator,
    };

    (global as any).RTCSessionDescription = class {
      type: string;
      sdp: string;
      constructor(init: any) {
        this.type = init.type;
        this.sdp = init.sdp || 'v=0...';
      }
    };

    (global as any).RTCIceCandidate = class {
      candidate: string;
      constructor(init: any) {
        this.candidate = init.candidate || 'candidate:...';
      }
      toJSON() {
        return { candidate: this.candidate };
      }
    };

    (global as any).RTCPeerConnection = class {
      iceServers: any;
      signalingState: string = 'stable';
      connectionState: string = 'connected';
      remoteDescription: any = null;
      localDescription: any = null;
      ontrack: ((e: any) => void) | null = null;
      onicecandidate: ((e: any) => void) | null = null;
      onconnectionstatechange: (() => void) | null = null;

      constructor(config: any) {
        this.iceServers = config?.iceServers;
      }
      addTrack = vi.fn();
      getSenders = vi.fn().mockReturnValue([]);
      getTransceivers = vi.fn().mockReturnValue([]);
      createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'offer-sdp' });
      createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'answer-sdp' });
      setLocalDescription = vi.fn().mockImplementation((desc) => {
        this.localDescription = desc;
        return Promise.resolve();
      });
      setRemoteDescription = vi.fn().mockImplementation((desc) => {
        this.remoteDescription = desc;
        return Promise.resolve();
      });
      addIceCandidate = vi.fn().mockResolvedValue(undefined);
      close = vi.fn();
    };

    signalingManagerA = new VoiceSignalingManager({
      localUserId: 'user-a',
      sendSignal: (payload) => {
        signalsFromA.push(payload);
      },
    });

    signalingManagerB = new VoiceSignalingManager({
      localUserId: 'user-b',
      sendSignal: (payload) => {
        signalsFromB.push(payload);
      },
    });
  });

  it('deve realizar fluxo completo de sinalização e conexão P2P entre 2 usuários', async () => {
    // 1. Inicializar User A
    await signalingManagerA.initialize();
    expect(signalsFromA).toHaveLength(1);
    expect(signalsFromA[0]).toEqual({
      type: 'join-announcement',
      fromUserId: 'user-a',
      toUserId: 'all',
    });

    // 2. User B recebe o anúncio de User A
    await signalingManagerB.handleSignal(signalsFromA[0]);
    // Como 'user-a' < 'user-b', User A inicia a conexão e User B responde o join
    expect(signalsFromB).toContainEqual(
      expect.objectContaining({
        type: 'join-announcement',
        fromUserId: 'user-b',
        toUserId: 'user-a',
      })
    );

    // 3. User A conecta com User B e emite Offer
    await signalingManagerA.connectToPeer('user-b');
    const offerFromA = signalsFromA.find((s) => s.type === 'offer');
    expect(offerFromA).toBeDefined();
    expect(offerFromA.toUserId).toBe('user-b');

    // 4. User B processa Offer de User A e responde com Answer
    await signalingManagerB.handleSignal(offerFromA);
    const answerFromB = signalsFromB.find((s) => s.type === 'answer');
    expect(answerFromB).toBeDefined();
    expect(answerFromB.toUserId).toBe('user-a');

    // 5. User A processa Answer de User B
    await signalingManagerA.handleSignal(answerFromB);

    // 6. Testar troca de ICE Candidates
    const candidatePayload = {
      type: 'ice-candidate' as const,
      fromUserId: 'user-a',
      toUserId: 'user-b',
      data: { candidate: 'candidate:1 1 UDP ...' },
    };
    await signalingManagerB.handleSignal(candidatePayload);

    // 7. Testar Saída da Chamada (Leave)
    signalingManagerB.destroy();
    const leaveSignal = signalsFromB.find((s) => s.type === 'leave-announcement');
    expect(leaveSignal).toBeDefined();

    await signalingManagerA.handleSignal(leaveSignal);
    expect(signalingManagerA.getVoiceManager().getRemoteStreams().has('user-b')).toBe(false);
  });
});
