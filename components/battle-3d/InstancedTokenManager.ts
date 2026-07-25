import * as THREE from 'three';
import { Combatant } from '@/lib/types';
import { TokenMeshOptions } from './Token3DMesh';

export class InstancedTokenManager {
  private scene: THREE.Scene;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private ringInstancedMesh: THREE.InstancedMesh | null = null;
  private maxTokens: number;
  private activeCount: number = 0;

  private dummy = new THREE.Object3D();
  private color = new THREE.Color();

  constructor(scene: THREE.Scene, maxTokens: number = 500) {
    this.scene = scene;
    this.maxTokens = maxTokens;
    this.initMeshes();
  }

  private initMeshes() {
    // 1. Generic Token Body (Cylinder)
    const geometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
    geometry.translate(0, 0.6, 0); // Base at y=0
    
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.7,
      metalness: 0.1
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxTokens);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    this.instancedMesh.name = 'instancedTokens';
    
    // 2. Selection Ring
    const ringGeo = new THREE.RingGeometry(0.75, 0.9, 32);
    ringGeo.rotateX(-Math.PI / 2);
    ringGeo.translate(0, 0.02, 0);
    const ringMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xffffff });
    
    this.ringInstancedMesh = new THREE.InstancedMesh(ringGeo, ringMat, this.maxTokens);
    this.ringInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.ringInstancedMesh.name = 'instancedRings';

    this.scene.add(this.instancedMesh);
    this.scene.add(this.ringInstancedMesh);
  }

  public update(combatants: Combatant[], optionsMap: Map<string, TokenMeshOptions>) {
    if (!this.instancedMesh || !this.ringInstancedMesh) return;

    this.activeCount = combatants.length;
    
    if (this.activeCount > this.maxTokens) {
      console.warn('Too many tokens for InstancedMesh limits');
      this.activeCount = this.maxTokens;
    }

    for (let i = 0; i < this.activeCount; i++) {
      const c = combatants[i];
      const key = c.id || c.name;
      const opts = optionsMap.get(key);

      if (!opts) continue;

      // Position & Rotation
      this.dummy.position.set(opts.positionX, 0, opts.positionZ);
      this.dummy.rotation.y = (opts.rotationAngleDeg * Math.PI) / 180;
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
      this.ringInstancedMesh.setMatrixAt(i, this.dummy.matrix); // Ring follows same matrix

      // Color based on type
      const isPlayer = c.type === 'player';
      const isNpc = c.type === 'npc';
      if (isPlayer) this.color.setHex(0x38bdf8); // Blue
      else if (isNpc) this.color.setHex(0xa78bfa); // Purple
      else this.color.setHex(0xe11d48); // Red for monsters

      this.instancedMesh.setColorAt(i, this.color);

      // Ring Color & Visibility
      const isSelected = opts.isCurrentTurn || opts.isSelectedForRotation || opts.isSelectedTarget || opts.isSpellTargeted;
      if (isSelected) {
        const ringColor = opts.isSpellTargeted
          ? 0xf97316
          : opts.isCurrentTurn
          ? 0x22c55e
          : opts.isSelectedTarget
          ? 0xef4444
          : 0x3b82f6;
        
        // Un-hide by setting scale to 1
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.ringInstancedMesh.setMatrixAt(i, this.dummy.matrix);
        this.color.setHex(ringColor);
        this.ringInstancedMesh.setColorAt(i, this.color);
      } else {
        // Hide ring by scaling to 0
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.ringInstancedMesh.setMatrixAt(i, this.dummy.matrix);
      }
    }

    this.instancedMesh.count = this.activeCount;
    this.ringInstancedMesh.count = this.activeCount;

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
    
    this.ringInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.ringInstancedMesh.instanceColor) this.ringInstancedMesh.instanceColor.needsUpdate = true;
  }

  public dispose() {
    if (this.instancedMesh) {
      this.scene.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
    }
    if (this.ringInstancedMesh) {
      this.scene.remove(this.ringInstancedMesh);
      this.ringInstancedMesh.geometry.dispose();
      (this.ringInstancedMesh.material as THREE.Material).dispose();
    }
  }
}
