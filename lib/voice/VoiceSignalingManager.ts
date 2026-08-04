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

  async initialize(): Promise<MediaStream | null> {
    return this.voiceManager.initializeLocalStream();
  }

  getVoiceManager() {
    return this.voiceManager;
  }

  /**
   * Initiate connection to a remote peer (caller side)
   */
  async connectToPeer(remotePeerId: string): Promise<void> {
    const pc = this.voiceManager.createPeerConnection(remotePeerId, (candidate) => {
      this.sendSignal({
        type: 'ice-candidate',
        fromUserId: this.localUserId,
        toUserId: remotePeerId,
        data: candidate.toJSON(),
      });
    });

    this.setupTrackHandler(pc, remotePeerId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.sendSignal({
      type: 'offer',
      fromUserId: this.localUserId,
      toUserId: remotePeerId,
      data: offer,
    });
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

        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSignal({
          type: 'answer',
          fromUserId: this.localUserId,
          toUserId: peerId,
          data: answer,
        });
        break;
      }

      case 'answer': {
        const existingPc = this.getPeerConnection(peerId);
        if (existingPc) {
          await existingPc.setRemoteDescription(new RTCSessionDescription(signal.data));
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
      if (event.streams[0] && this.onRemoteStream) {
        this.onRemoteStream(peerId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        if (this.onPeerDisconnect) this.onPeerDisconnect(peerId);
      }
    };
  }

  private getPeerConnection(peerId: string): RTCPeerConnection | undefined {
    // Access the internal peer connections map via the voice manager
    return (this.voiceManager as any).peerConnections?.get(peerId);
  }

  toggleMute(): boolean {
    return this.voiceManager.toggleMute();
  }

  getIsMuted(): boolean {
    return this.voiceManager.getIsMuted();
  }

  setOnSpeakingChange(cb: (isSpeaking: boolean) => void) {
    this.voiceManager.setOnSpeakingChange(cb);
  }

  destroy() {
    this.voiceManager.closeAllConnections();
  }
}
