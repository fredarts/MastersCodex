import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface CameraPreset {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export const DEFAULT_CAMERA_PRESETS: Record<string, CameraPreset> = {
  tactical: { position: [0, 14, 14], lookAt: [0, 0, 0] },
  cinematic: { position: [0, 5, 10], lookAt: [0, 1, 0] },
  topDown: { position: [0, 18, 0.1], lookAt: [0, 0, 0] },
};

export function setupCameraAndOrbit(
  container: HTMLDivElement,
  width: number,
  height: number
): { camera: THREE.PerspectiveCamera; controls: OrbitControls } {
  const aspect = width / height;
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 14, 14);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // Impede a câmera de atravessar o chão
  controls.minDistance = 3;
  controls.maxDistance = 40;

  return { camera, controls };
}
