import * as THREE from 'three';

const CACHE_NAME = 'codex-3d-assets-v1';

/**
 * Gerenciador de cache persistente para assets 3D (.glb, .gltf e texturas) via Browser Cache API.
 */
export class AssetCacheManager {
  /**
   * Busca um arquivo de asset do cache ou faz download via HTTP e armazena em cache.
   */
  static async fetchCachedAsset(url: string): Promise<Response> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return fetch(url);
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        return cachedResponse;
      }

      const networkResponse = await fetch(url);
      if (networkResponse.ok) {
        cache.put(url, networkResponse.clone()).catch(() => {});
      }
      return networkResponse;
    } catch (e) {
      console.warn('Falha no AssetCacheManager, recorrendo a fetch normal:', e);
      return fetch(url);
    }
  }

  /**
   * Limpa todo o cache de modelos 3D armazenados.
   */
  static async clearCache(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      return caches.delete(CACHE_NAME);
    }
    return false;
  }
}

/**
 * Retorna o caminho do descompressor Draco WASM para Three.js.
 */
export function getDracoDecoderPath(): string {
  return 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
}

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
