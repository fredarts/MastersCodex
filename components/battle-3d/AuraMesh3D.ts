/**
 * components/battle-3d/AuraMesh3D.ts
 * Sistema visual Three.js para renderização de Auras Vivas e Dinâmicas no BattleGrid3D.
 */

import * as THREE from 'three';
import { Combatant } from '@/lib/types';
import { feetToUnits } from '@/lib/auras/auraEngine';

interface ActiveAuraMeshEntry {
  auraId: string;
  combatantId: string;
  group: THREE.Group;
  fillMesh: THREE.Mesh;
  ringMesh: THREE.Mesh;
  fillMaterial: THREE.MeshBasicMaterial;
  ringMaterial: THREE.MeshBasicMaterial;
}

export class AuraSystem3D {
  private scene: THREE.Scene;
  private rootGroup: THREE.Group;
  private auraEntries: Map<string, ActiveAuraMeshEntry> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'tokenAurasSystemGroup';
    this.scene.add(this.rootGroup);
  }

  /**
   * Atualiza as auras de todos os combatentes no loop de renderização do Three.js
   */
  public update(
    combatants: Combatant[],
    tokenPositions: Record<string, { x: number; z: number }>
  ) {
    const currentActiveAuraIds = new Set<string>();

    combatants.forEach((combatant) => {
      if (!combatant.auras || combatant.auras.length === 0) return;

      const pos = tokenPositions[combatant.id] || {
        x: combatant.x ?? 0,
        z: combatant.z ?? 0,
      };

      combatant.auras.forEach((aura) => {
        if (!aura.enabled) return;

        const key = `${combatant.id}-${aura.id}`;
        currentActiveAuraIds.add(key);

        let entry = this.auraEntries.get(key);

        if (!entry) {
          entry = this.createAuraMesh(combatant.id, aura);
          this.auraEntries.set(key, entry);
          this.rootGroup.add(entry.group);
        }

        // Atualizar posição para acompanhar o token
        entry.group.position.set(pos.x, 0.05, pos.z);

        // Animação de pulsação e rotação
        const time = Date.now() * 0.002;
        if (aura.visual.pulsing) {
          entry.fillMaterial.opacity =
            aura.visual.opacity + Math.sin(time * 2) * 0.06;
          entry.ringMaterial.opacity = 0.8 + Math.sin(time * 3) * 0.15;
        }

        // Rotação suave do anel externo rúnico
        entry.ringMesh.rotation.z += 0.005;
      });
    });

    // Limpar auras desativadas ou removidas
    for (const [key, entry] of this.auraEntries.entries()) {
      if (!currentActiveAuraIds.has(key)) {
        this.disposeEntry(entry);
        this.auraEntries.delete(key);
      }
    }
  }

  private createAuraMesh(combatantId: string, aura: any): ActiveAuraMeshEntry {
    const group = new THREE.Group();
    const radius = feetToUnits(aura.radiusFt);
    const color = new THREE.Color(aura.visual.colorHex || '#facc15');

    // 1. Disco Central Preenchido
    const fillGeometry = new THREE.CircleGeometry(radius, 48);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: aura.visual.opacity || 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.rotation.x = -Math.PI / 2;
    group.add(fillMesh);

    // 2. Anel de Borda Exterior
    const ringGeometry = new THREE.RingGeometry(radius - 0.1, radius, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = -Math.PI / 2;
    group.add(ringMesh);

    return {
      auraId: aura.id,
      combatantId,
      group,
      fillMesh,
      ringMesh,
      fillMaterial,
      ringMaterial,
    };
  }

  private disposeEntry(entry: ActiveAuraMeshEntry) {
    this.rootGroup.remove(entry.group);
    entry.fillMesh.geometry.dispose();
    entry.fillMaterial.dispose();
    entry.ringMesh.geometry.dispose();
    entry.ringMaterial.dispose();
  }

  public dispose() {
    for (const entry of this.auraEntries.values()) {
      this.disposeEntry(entry);
    }
    this.auraEntries.clear();
    this.scene.remove(this.rootGroup);
  }
}
