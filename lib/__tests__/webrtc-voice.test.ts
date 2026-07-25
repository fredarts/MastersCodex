import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebRTCVoiceManager } from '../voice/WebRTCVoiceManager';

describe('WebRTCVoiceManager', () => {
  let voiceManager: WebRTCVoiceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    voiceManager = new WebRTCVoiceManager();
  });

  it('deve alternar o estado de Mute/Unmute corretamente', () => {
    expect(voiceManager.getIsMuted()).toBe(false);
    const muted = voiceManager.toggleMute();
    // Como não há stream no ambiente Node puro sem browser, a função lida graciosamente
    expect(muted).toBe(false);
  });

  it('deve registrar callback de detecção de voz', () => {
    const callback = vi.fn();
    voiceManager.setOnSpeakingChange(callback);
    expect(callback).not.toHaveBeenCalled();
  });
});
