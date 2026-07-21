'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Combatant } from '@/lib/types';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';

interface UseToken3DManagerOptions {
  scene: THREE.Scene | null;
  combatants: Combatant[];
  tokenPositions: Record<string, { x: number; z: number }>;
  tokenRotations: Record<string, number>;
}

// Global cache for loaded GLTF templates to prevent duplicate downloads
const modelCache = new Map<string, THREE.Group>();

export function useToken3DManager({
  scene,
  combatants,
  tokenPositions,
  tokenRotations,
}: UseToken3DManagerOptions) {
  const loadedModelsRef = useRef<Map<string, THREE.Group>>(new Map());

  useEffect(() => {
    if (!scene) return;

    const loader = new GLTFLoader();

    combatants.forEach((c) => {
      const key = c.id || c.name;

      if (loadedModelsRef.current.has(key)) {
        // Update existing mesh position/rotation
        const mesh = loadedModelsRef.current.get(key)!;
        const pos = tokenPositions[key] || { x: 0, z: 0 };
        mesh.position.x = pos.x;
        mesh.position.z = pos.z;
        if (tokenRotations[key] !== undefined) {
          mesh.rotation.y = THREE.MathUtils.degToRad(tokenRotations[key]);
        }
        return;
      }

      // Load or clone from cache
      const modelUrl = c.modelUrl || getModelUrlByNameOrPath(c.name);
      if (!modelUrl) return;

      const placeModel = (cachedGroup: THREE.Group) => {
        const clonedGroup = cachedGroup.clone(true);
        clonedGroup.scale.set(0.8, 0.8, 0.8);
        const pos = tokenPositions[key] || { x: 0, z: 0 };
        clonedGroup.position.set(pos.x, 0, pos.z);
        if (tokenRotations[key] !== undefined) {
          clonedGroup.rotation.y = THREE.MathUtils.degToRad(tokenRotations[key]);
        }

        clonedGroup.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(clonedGroup);
        loadedModelsRef.current.set(key, clonedGroup);
      };

      if (modelCache.has(modelUrl)) {
        placeModel(modelCache.get(modelUrl)!);
      } else {
        loader.load(
          modelUrl,
          (gltf) => {
            modelCache.set(modelUrl, gltf.scene);
            placeModel(gltf.scene);
          },
          undefined,
          (error) => {
            console.warn(`Erro ao carregar modelo 3D para ${c.name}:`, error);
          }
        );
      }
    });

    // Cleanup models of removed combatants
    loadedModelsRef.current.forEach((modelGroup, key) => {
      const exists = combatants.some((c) => (c.id || c.name) === key);
      if (!exists) {
        scene.remove(modelGroup);
        loadedModelsRef.current.delete(key);
      }
    });
  }, [scene, combatants, tokenPositions, tokenRotations]);

  return {
    getLoadedModels: () => loadedModelsRef.current,
  };
}
