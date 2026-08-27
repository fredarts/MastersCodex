'use client';

import * as THREE from 'three';
import { SpellAoEDefinition } from '@/lib/dnd5e-spells-shapes';

export interface AoETemplateParams3D {
  spellDef: SpellAoEDefinition;
  origin: { x: number; y?: number; z: number }; // Conjurador
  target: { x: number; y?: number; z: number }; // Cursor do mouse no chão
  rotationDeg?: number;
}

export class AoETemplateSystem3D {
  private group: THREE.Group;
  private currentParams: AoETemplateParams3D | null = null;
  private fillMesh: THREE.Mesh | null = null;
  private ringMesh: THREE.Mesh | null = null;
  private volumeMesh: THREE.Mesh | null = null;
  private fillMaterial: THREE.MeshBasicMaterial | null = null;
  private ringMaterial: THREE.MeshBasicMaterial | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'aoeTemplateSystemGroup';
    scene.add(this.group);
  }

  public update(params: AoETemplateParams3D | null, deltaTime: number = 0.016) {
    if (!params) {
      this.clear();
      return;
    }

    const isChanged =
      !this.currentParams ||
      this.currentParams.spellDef.name !== params.spellDef.name ||
      this.currentParams.spellDef.shape !== params.spellDef.shape ||
      this.currentParams.spellDef.size !== params.spellDef.size ||
      this.currentParams.origin.x !== params.origin.x ||
      this.currentParams.origin.z !== params.origin.z ||
      this.currentParams.target.x !== params.target.x ||
      this.currentParams.target.z !== params.target.z ||
      this.currentParams.rotationDeg !== params.rotationDeg;

    if (isChanged) {
      this.currentParams = params;
      this.rebuild(params);
    }

    // Animação de pulsação suave
    const time = Date.now() * 0.003;
    if (this.fillMaterial) {
      this.fillMaterial.opacity = 0.35 + Math.sin(time * 2) * 0.08;
    }
    if (this.ringMaterial) {
      this.ringMaterial.opacity = 0.75 + Math.sin(time * 3) * 0.15;
    }
  }

  private rebuild(params: AoETemplateParams3D) {
    this.clear();

    const { spellDef, origin, target, rotationDeg = 0 } = params;
    const { shape, size, width = 1.5, colorHex = '#ef4444' } = spellDef;
    const baseColor = new THREE.Color(colorHex);

    this.fillMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    let computedAngle = 0;
    if (rotationDeg !== undefined && rotationDeg !== 0) {
      computedAngle = (rotationDeg * Math.PI) / 180;
    } else {
      const dx = target.x - origin.x;
      const dz = target.z - origin.z;
      computedAngle = Math.atan2(dx, dz);
    }

    // 1. CÍRCULO / ESFERA / CILINDRO
    if (shape === 'circle' || shape === 'cylinder') {
      const centerPos = new THREE.Vector3(target.x, (target.y || 0) + 0.05, target.z);

      const circleGeo = new THREE.CircleGeometry(size, 48);
      this.fillMesh = new THREE.Mesh(circleGeo, this.fillMaterial);
      this.fillMesh.rotation.x = -Math.PI / 2;
      this.fillMesh.position.copy(centerPos);
      this.group.add(this.fillMesh);

      const ringGeo = new THREE.RingGeometry(Math.max(0.1, size - 0.15), size + 0.05, 48);
      this.ringMesh = new THREE.Mesh(ringGeo, this.ringMaterial);
      this.ringMesh.rotation.x = -Math.PI / 2;
      this.ringMesh.position.copy(centerPos);
      this.group.add(this.ringMesh);

      // Volume holográfico vertical
      const cylGeo = new THREE.CylinderGeometry(size, size, 3, 32, 1, true);
      const cylMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.volumeMesh = new THREE.Mesh(cylGeo, cylMat);
      this.volumeMesh.position.set(centerPos.x, centerPos.y + 1.5, centerPos.z);
      this.group.add(this.volumeMesh);
      return;
    }

    // 2. CONE / LEQUE (53.13°)
    if (shape === 'cone' || shape === 'fan') {
      const originPos = new THREE.Vector3(origin.x, (origin.y || 0) + 0.05, origin.z);
      const coneAngleRad = (53.13 * Math.PI) / 180;

      const subGroup = new THREE.Group();
      subGroup.position.copy(originPos);
      subGroup.rotation.y = computedAngle;

      const coneGeo = new THREE.CircleGeometry(size, 32, -coneAngleRad / 2 + Math.PI / 2, coneAngleRad);
      this.fillMesh = new THREE.Mesh(coneGeo, this.fillMaterial);
      this.fillMesh.rotation.x = -Math.PI / 2;
      subGroup.add(this.fillMesh);

      const ringGeo = new THREE.RingGeometry(Math.max(0.1, size - 0.12), size + 0.05, 32, 1, -coneAngleRad / 2 + Math.PI / 2, coneAngleRad);
      this.ringMesh = new THREE.Mesh(ringGeo, this.ringMaterial);
      this.ringMesh.rotation.x = -Math.PI / 2;
      subGroup.add(this.ringMesh);

      this.group.add(subGroup);
      return;
    }

    // 3. LINHA
    if (shape === 'line') {
      const originPos = new THREE.Vector3(origin.x, (origin.y || 0) + 0.05, origin.z);
      const subGroup = new THREE.Group();
      subGroup.position.copy(originPos);
      subGroup.rotation.y = computedAngle;

      const planeGeo = new THREE.PlaneGeometry(width, size);
      this.fillMesh = new THREE.Mesh(planeGeo, this.fillMaterial);
      this.fillMesh.position.set(0, 0, size / 2);
      this.fillMesh.rotation.x = -Math.PI / 2;
      subGroup.add(this.fillMesh);

      const edgesGeo = new THREE.EdgesGeometry(planeGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: baseColor, linewidth: 2, transparent: true, opacity: 0.9 });
      const lineSeg = new THREE.LineSegments(edgesGeo, lineMat);
      lineSeg.position.set(0, 0, size / 2);
      lineSeg.rotation.x = -Math.PI / 2;
      subGroup.add(lineSeg);

      this.group.add(subGroup);
      return;
    }

    // 4. CAIXA / CUBO
    if (shape === 'box') {
      const centerPos = new THREE.Vector3(target.x, (target.y || 0) + 0.05, target.z);
      const boxGeo = new THREE.PlaneGeometry(size, size);
      this.fillMesh = new THREE.Mesh(boxGeo, this.fillMaterial);
      this.fillMesh.rotation.x = -Math.PI / 2;
      this.fillMesh.position.copy(centerPos);
      this.group.add(this.fillMesh);

      const edgesGeo = new THREE.EdgesGeometry(boxGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: baseColor, linewidth: 2, transparent: true, opacity: 0.9 });
      const lineSeg = new THREE.LineSegments(edgesGeo, lineMat);
      lineSeg.rotation.x = -Math.PI / 2;
      lineSeg.position.copy(centerPos);
      this.group.add(lineSeg);
      return;
    }

    // PADRÃO: RETÍCULO NO CHÃO
    const defCenter = new THREE.Vector3(target.x, (target.y || 0) + 0.05, target.z);
    const reticleGeo = new THREE.RingGeometry(0.5, 0.7, 32);
    this.ringMesh = new THREE.Mesh(reticleGeo, this.ringMaterial);
    this.ringMesh.rotation.x = -Math.PI / 2;
    this.ringMesh.position.copy(defCenter);
    this.group.add(this.ringMesh);
  }

  public clear() {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }
    this.fillMesh = null;
    this.ringMesh = null;
    this.volumeMesh = null;
    this.currentParams = null;
  }

  public destroy() {
    this.clear();
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
