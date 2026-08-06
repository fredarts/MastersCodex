import { describe, it, expect } from 'vitest';
import { CRDTSolver } from '../sync/CRDTSolver';

describe('CRDTSolver (Last-Writer-Wins Concurrency)', () => {
  it('should accept remote events with newer timestamps', () => {
    const localTime = 1000;
    const remoteTime = 1500;
    expect(CRDTSolver.shouldApplyRemoteEvent(localTime, remoteTime)).toBe(true);
  });

  it('should accept remote events with equal timestamps', () => {
    const localTime = 1000;
    const remoteTime = 1000;
    expect(CRDTSolver.shouldApplyRemoteEvent(localTime, remoteTime)).toBe(true);
  });

  it('should discard remote events with older timestamps (out-of-order latency)', () => {
    const localTime = 2000;
    const remoteTime = 1500;
    expect(CRDTSolver.shouldApplyRemoteEvent(localTime, remoteTime)).toBe(false);
  });

  it('should create valid CRDT event structure with timestamp and UUID', () => {
    const event = CRDTSolver.createEvent('token-1', 'MOVE', { x: 10, z: 12 });
    expect(event.entityId).toBe('token-1');
    expect(event.actionType).toBe('MOVE');
    expect(event.payload).toEqual({ x: 10, z: 12 });
    expect(typeof event.timestamp).toBe('number');
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event.id).toBeDefined();
  });
});
