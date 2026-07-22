import React from 'react';
import * as THREE from 'three';
import { Combatant } from '@/lib/types';

interface InstancedTokenGroupProps {
  combatants: Combatant[];
  colorHex?: number;
}

export function createInstancedTokenMesh(combatants: Combatant[], colorHex = 0xe11d48): THREE.InstancedMesh {
  const count = combatants.length;
  const geometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 32);
  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.3,
    metalness: 0.2,
  });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  instancedMesh.castShadow = true;
  instancedMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();

  combatants.forEach((c, i) => {
    const x = (i % 5) * 2 - 4;
    const z = Math.floor(i / 5) * 2 - 4;
    dummy.position.set(x, 0.1, z);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  });

  instancedMesh.instanceMatrix.needsUpdate = true;
  return instancedMesh;
}
