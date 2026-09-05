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
  controls.minPolarAngle = 0.08; // Impede gimbal lock / NaN na matriz da câmera no topo (90° vertical)
  controls.maxPolarAngle = Math.PI / 2 - 0.22; // Mantém a câmera a uma altitude segura (~12.5° acima do solo), impedindo o recorte do plano 3D/vídeo
  controls.minDistance = 4.5;
  controls.maxDistance = 40;

  // Botões do mouse:
  // Esquerdo: Rotação orbital
  // Scroll do Mouse / Botão do Meio (clicar e segurar): PAN da câmera (translada o grid)
  // Direito: PAN da câmera
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.screenSpacePanning = true;

  return { camera, controls };
}

/**
 * Foca e aproxima a câmera 3D em torno de um alvo selecionado (Estilo Numpad '.' / ',' do Blender & 'F' da Unreal)
 */
export function focusCameraOnTarget(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  targetPos: { x: number; y?: number; z: number },
  distance = 7.0
): void {
  const targetY = targetPos.y ?? 1.0;

  const currentOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
  if (currentOffset.length() === 0) {
    currentOffset.set(0, 5, 5);
  }
  currentOffset.normalize().multiplyScalar(distance);
  currentOffset.y = Math.max(3.5, currentOffset.y);

  controls.target.set(targetPos.x, targetY, targetPos.z);
  camera.position.set(
    targetPos.x + currentOffset.x,
    targetY + currentOffset.y,
    targetPos.z + currentOffset.z
  );
  controls.update();
}
