import { WebRTCVoiceManager } from './WebRTCVoiceManager';
import { VoiceSignalPayload } from '@/lib/types';

/**
 * Orchestrates WebRTC signaling over Supabase Broadcast for P2P voice chat.
 * Uses a mesh topology (every peer connects to every other peer directly).
 * Suitable for small groups (2-6 participants typical in TTRPG sessions).
 */
export class VoiceSignalingManager {
  private voiceManager: WebRTCVoiceManager;
  private localUserId: string;
  private sendSignal: (payload: VoiceSignalPayload) => void;
  private onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  private onPeerDisconnect?: (peerId: string) => void;

  constructor(config: {
    localUserId: string;
    sendSignal: (payload: VoiceSignalPayload) => void;
    onRemoteStream?: (peerId: string, stream: MediaStream) => void;
    onPeerDisconnect?: (peerId: string) => void;
  }) {
    this.voiceManager = new WebRTCVoiceManager();
    this.localUserId = config.localUserId;
    this.sendSignal = config.sendSignal;
    this.onRemoteStream = config.onRemoteStream;
    this.onPeerDisconnect = config.onPeerDisconnect;
  }

  async initialize(deviceId?: string): Promise<MediaStream | null> {
    return this.voiceManager.initializeLocalStream(deviceId);
  }

  getVoiceManager(): WebRTCVoiceManager {
    return this.voiceManager;
  }

  /**
   * Initiate connection to a remote peer (caller side)
   */
  async connectToPeer(remotePeerId: string): Promise<void> {
    const existingPcs = this.voiceManager.getPeerConnections();
    if (existingPcs.has(remotePeerId)) {
      const pc = existingPcs.get(remotePeerId)!;
      if (pc.connectionState === 'connected' || pc.connectionState === 'connecting') {
        return;
      }
    }

    const pc = this.voiceManager.createPeerConnection(remotePeerId, (candidate) => {
      this.sendSignal({
        type: 'ice-candidate',
        fromUserId: this.localUserId,
        toUserId: remotePeerId,
        data: candidate.toJSON(),
      });
    });

    this.setupTrackHandler(pc, remotePeerId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.sendSignal({
        type: 'offer',
        fromUserId: this.localUserId,
        toUserId: remotePeerId,
        data: offer,
      });
    } catch (err) {
      console.warn(`Erro ao criar oferta WebRTC para peer ${remotePeerId}:`, err);
    }
  }

  /**
   * Handle incoming signaling messages from remote peers
   */
  async handleSignal(signal: VoiceSignalPayload): Promise<void> {
    // Only process signals directed at us
    if (signal.toUserId !== this.localUserId) return;

    const peerId = signal.fromUserId;

    switch (signal.type) {
      case 'offer': {
        const pc = this.voiceManager.createPeerConnection(peerId, (candidate) => {
          this.sendSignal({
            type: 'ice-candidate',
            fromUserId: this.localUserId,
            toUserId: peerId,
            data: candidate.toJSON(),
          });
        });

        this.setupTrackHandler(pc, peerId);

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          this.sendSignal({
            type: 'answer',
            fromUserId: this.localUserId,
            toUserId: peerId,
            data: answer,
          });
        } catch (err) {
          console.warn(`Erro ao processar oferta WebRTC do peer ${peerId}:`, err);
        }
        break;
      }

      case 'answer': {
        const existingPc = this.getPeerConnection(peerId);
        if (existingPc && existingPc.signalingState !== 'stable') {
          try {
            await existingPc.setRemoteDescription(new RTCSessionDescription(signal.data));
          } catch (err) {
            console.warn(`Erro ao processar resposta WebRTC do peer ${peerId}:`, err);
          }
        }
        break;
      }

      case 'ice-candidate': {
        const pc = this.getPeerConnection(peerId);
        if (pc && signal.data) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
          } catch (err) {
            console.warn('Failed to add ICE candidate:', err);
          }
        }
        break;
      }
    }
  }

  private setupTrackHandler(pc: RTCPeerConnection, peerId: string) {
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        const stream = event.streams[0];
        this.voiceManager.attachRemoteStream(peerId, stream);
        if (this.onRemoteStream) {
          this.onRemoteStream(peerId, stream);
        }
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.voiceManager.detachRemoteStream(peerId);
        if (this.onPeerDisconnect) {
          this.onPeerDisconnect(peerId);
        }
      }
    };
  }

  private getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    return this.voiceManager.getPeerConnections().get(peerId);
  }

  toggleMute(): boolean {
    return this.voiceManager.toggleMute();
  }

  setMuted(muted: boolean): boolean {
    return this.voiceManager.setMuted(muted);
  }

  getIsMuted(): boolean {
    return this.voiceManager.getIsMuted();
  }

  setDeafened(deafened: boolean): boolean {
    return this.voiceManager.setDeafened(deafened);
  }

  getIsDeafened(): boolean {
    return this.voiceManager.getIsDeafened();
  }

  destroy() {
    this.voiceManager.closeAllConnections();
  }
}
