/**
 * touchGestures.ts
 * Utilitários puros para cálculos de gestos multi-touch (Pinch-to-zoom, 2-finger pan, focal zoom, long-press).
 */

export interface TouchPointerPoint {
  clientX: number;
  clientY: number;
}

export interface TouchGestureState {
  distance: number;
  midpoint: { x: number; y: number };
}

/**
 * Calcula a distância euclidiana entre dois pontos de toque.
 */
export function getTouchDistance(p1: TouchPointerPoint, p2: TouchPointerPoint): number {
  const dx = p1.clientX - p2.clientX;
  const dy = p1.clientY - p2.clientY;
  return Math.hypot(dx, dy);
}

/**
 * Calcula o ponto médio (baricentro) entre dois pontos de toque em relação ao container.
 */
export function getTouchMidpoint(
  p1: TouchPointerPoint,
  p2: TouchPointerPoint,
  containerRect?: { left: number; top: number }
): { x: number; y: number } {
  const offsetX = containerRect ? containerRect.left : 0;
  const offsetY = containerRect ? containerRect.top : 0;
  return {
    x: (p1.clientX + p2.clientX) / 2 - offsetX,
    y: (p1.clientY + p2.clientY) / 2 - offsetY,
  };
}

/**
 * Calcula a nova escala e offset de pan a partir de um gesto de pinch-to-zoom com ponto focal.
 */
export function calculatePinchZoomAndPan(params: {
  currentZoom: number;
  currentPan: { x: number; y: number };
  prevDistance: number;
  newDistance: number;
  prevMidpoint: { x: number; y: number };
  newMidpoint: { x: number; y: number };
  minZoom?: number;
  maxZoom?: number;
}): { nextZoom: number; nextPan: { x: number; y: number } } {
  const {
    currentZoom,
    currentPan,
    prevDistance,
    newDistance,
    prevMidpoint,
    newMidpoint,
    minZoom = 0.05,
    maxZoom = 5.0,
  } = params;

  if (prevDistance <= 0 || newDistance <= 0) {
    return { nextZoom: currentZoom, nextPan: currentPan };
  }

  const zoomFactor = newDistance / prevDistance;
  const targetZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * zoomFactor));

  // Ponto no espaço local do canvas antes do zoom
  const localFocusX = (prevMidpoint.x - currentPan.x) / currentZoom;
  const localFocusY = (prevMidpoint.y - currentPan.y) / currentZoom;

  // Pan delta decorrente do movimento dos dedos
  const panDeltaX = newMidpoint.x - prevMidpoint.x;
  const panDeltaY = newMidpoint.y - prevMidpoint.y;

  // Novo offset mantendo o ponto focal estável sob os dedos + delta de translação
  const nextPan = {
    x: newMidpoint.x - localFocusX * targetZoom,
    y: newMidpoint.y - localFocusY * targetZoom,
  };

  return { nextZoom: targetZoom, nextPan };
}

/**
 * Verifica se o deslocamento de um ponteiro excedeu o limiar de toque (ex: 6px para arrasto).
 */
export function isDragThresholdExceeded(
  start: { x: number; y: number },
  current: { x: number; y: number },
  threshold: number = 6
): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold;
}
