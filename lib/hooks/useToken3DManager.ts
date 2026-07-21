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

      // Load new model
      const modelUrl = c.modelUrl || getModelUrlByNameOrPath(c.name);
      if (!modelUrl) return;

      loader.load(
        modelUrl,
        (gltf) => {
          const modelGroup = gltf.scene;
          modelGroup.scale.set(0.8, 0.8, 0.8);
          const pos = tokenPositions[key] || { x: 0, z: 0 };
          modelGroup.position.set(pos.x, 0, pos.z);
          if (tokenRotations[key] !== undefined) {
            modelGroup.rotation.y = THREE.MathUtils.degToRad(tokenRotations[key]);
          }

          modelGroup.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          scene.add(modelGroup);
          loadedModelsRef.current.set(key, modelGroup);
        },
        undefined,
        (error) => {
          console.warn(`Erro ao carregar modelo 3D para ${c.name}:`, error);
        }
      );
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
    loadedModels: loadedModelsRef.current,
  };
}
