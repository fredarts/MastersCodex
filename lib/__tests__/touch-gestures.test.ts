import { describe, it, expect } from 'vitest';
import {
  getTouchDistance,
  getTouchMidpoint,
  calculatePinchZoomAndPan,
  isDragThresholdExceeded,
} from '../utils/touchGestures';

describe('Touch Gestures Engine', () => {
  it('calculates euclidean distance between two touch points correctly', () => {
    const p1 = { clientX: 0, clientY: 0 };
    const p2 = { clientX: 30, clientY: 40 };
    const dist = getTouchDistance(p1, p2);
    expect(dist).toBe(50);
  });

  it('calculates touch midpoint with container offset', () => {
    const p1 = { clientX: 100, clientY: 100 };
    const p2 = { clientX: 200, clientY: 200 };
    const containerRect = { left: 50, top: 50 };
    const mid = getTouchMidpoint(p1, p2, containerRect);
    expect(mid.x).toBe(100);
    expect(mid.y).toBe(100);
  });

  it('calculates pinch zoom with focal point stability', () => {
    const prevDistance = 100;
    const newDistance = 200; // Dobrou a distância (2x zoom)
    const prevMidpoint = { x: 500, y: 500 };
    const newMidpoint = { x: 500, y: 500 };
    const currentZoom = 1.0;
    const currentPan = { x: 0, y: 0 };

    const result = calculatePinchZoomAndPan({
      currentZoom,
      currentPan,
      prevDistance,
      newDistance,
      prevMidpoint,
      newMidpoint,
      minZoom: 0.05,
      maxZoom: 5.0,
    });

    expect(result.nextZoom).toBe(2.0);
    // (500 - 0) / 1 = 500. newPan = 500 - 500 * 2 = -500
    expect(result.nextPan.x).toBe(-500);
    expect(result.nextPan.y).toBe(-500);
  });

  it('clamps zoom within min and max boundaries', () => {
    const result = calculatePinchZoomAndPan({
      currentZoom: 4.0,
      currentPan: { x: 0, y: 0 },
      prevDistance: 100,
      newDistance: 300, // Factor 3 -> 12.0
      prevMidpoint: { x: 100, y: 100 },
      newMidpoint: { x: 100, y: 100 },
      minZoom: 0.1,
      maxZoom: 5.0,
    });

    expect(result.nextZoom).toBe(5.0);
  });

  it('detects when drag threshold is exceeded', () => {
    expect(isDragThresholdExceeded({ x: 10, y: 10 }, { x: 12, y: 12 }, 6)).toBe(false);
    expect(isDragThresholdExceeded({ x: 10, y: 10 }, { x: 20, y: 20 }, 6)).toBe(true);
  });
});
