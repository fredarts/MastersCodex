import * as THREE from 'three';

/**
 * Função de descarte de memória GPU (VRAM) para Three.js.
 * Percorre a árvore de objetos Three.js e descarta geometrias, materiais e texturas.
 */
export function disposeHierarchy(object3D: THREE.Object3D): void {
  if (!object3D) return;

  object3D.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;

      // 1. Descartar Geometria
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }

      // 2. Descartar Material e Texturas associadas
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });

  // Remover do pai
  if (object3D.parent) {
    object3D.parent.remove(object3D);
  }
}

function disposeMaterial(material: THREE.Material): void {
  material.dispose();

  // Descartar mapas de textura
  const matAny = material as any;
  const textureKeys = ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'alphaMap', 'aoMap', 'displacementMap', 'emissiveMap'];

  textureKeys.forEach((key) => {
    if (matAny[key] && matAny[key].dispose) {
      matAny[key].dispose();
    }
  });
}
