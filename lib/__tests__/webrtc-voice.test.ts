import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebRTCVoiceManager } from '../voice/WebRTCVoiceManager';

describe('WebRTCVoiceManager', () => {
  let voiceManager: WebRTCVoiceManager;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it('deve fechar todas as conexões e limpar recursos ao chamar closeAllConnections', () => {
    voiceManager.closeAllConnections();
    expect(voiceManager.getPeerConnections().size).toBe(0);
    expect(voiceManager.getIsVideoEnabled()).toBe(false);
    expect(voiceManager.getLocalVideoStream()).toBeNull();
    expect(voiceManager.getRemoteStreams().size).toBe(0);
  });
});
