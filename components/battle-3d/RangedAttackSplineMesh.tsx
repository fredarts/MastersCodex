'use client';

import * as THREE from 'three';
import { RangeStatus, formatDistanceDisplay } from '@/lib/utils/dndRangeUtils';

export interface SplineParams {
  attackerPos: { x: number; y: number; z: number };
  targetPos: { x: number; y: number; z: number };
  status: RangeStatus;
  distanceFt: number;
  animationPhase: 'aiming' | 'firing' | 'fading' | 'idle';
  onAnimationComplete?: () => void;
}

export class RangedAttackSplineSystem {
  private group: THREE.Group;
  private tubeMesh: THREE.Mesh | null = null;
  private reticleMesh: THREE.Mesh | null = null;
  private projectileMesh: THREE.Mesh | null = null;
  private tubeMaterial: THREE.MeshStandardMaterial | null = null;
  private reticleMaterial: THREE.MeshBasicMaterial | null = null;
  private curve: THREE.CatmullRomCurve3 | null = null;
  private currentParams: SplineParams | null = null;
  private fireProgress: number = 0;
  private fadeOpacity: number = 1.0;
  private isDestroyed: boolean = false;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'rangedAttackSplineGroup';
    scene.add(this.group);
  }

  public update(params: SplineParams | null) {
    if (!params || params.animationPhase === 'idle') {
      this.clear();
      return;
    }

    const isPosChanged =
      !this.currentParams ||
      this.currentParams.attackerPos.x !== params.attackerPos.x ||
      this.currentParams.attackerPos.z !== params.attackerPos.z ||
      this.currentParams.targetPos.x !== params.targetPos.x ||
      this.currentParams.targetPos.z !== params.targetPos.z ||
      this.currentParams.status !== params.status;

    this.currentParams = params;

    if (isPosChanged) {
      this.rebuildMesh(params);
    } else {
      this.updateColors(params.status);
    }
  }

  private rebuildMesh(params: SplineParams) {
    // Limpar objetos anteriores
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    const { attackerPos, targetPos, status, distanceFt } = params;

    // Pontos do arco parabólico
    const start = new THREE.Vector3(attackerPos.x, attackerPos.y + 0.8, attackerPos.z);
    const end = new THREE.Vector3(targetPos.x, targetPos.y + 0.8, targetPos.z);

    const distUnits = start.distanceTo(end);
    // Altura do arco proporcional à distância (max 4.0 unidades de altura)
    const arcHeight = Math.min(4.0, Math.max(0.8, distUnits * 0.22));

    const mid = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    mid.y = Math.max(start.y, end.y) + arcHeight;

    // Criar curva CatmullRom com spline suave
    this.curve = new THREE.CatmullRomCurve3([start, mid, end]);

    // Material da Spline baseado no Status
    const colorHex = this.getColorHex(status);
    this.tubeMaterial = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: this.fadeOpacity,
      side: THREE.DoubleSide,
    });

    // Geometria em Tubo Fluorescente
    const tubeGeometry = new THREE.TubeGeometry(this.curve, 40, 0.07, 8, false);
    this.tubeMesh = new THREE.Mesh(tubeGeometry, this.tubeMaterial);
    this.group.add(this.tubeMesh);

    // Retículo / Anel de Mira no Alvo
    const reticleGeo = new THREE.RingGeometry(0.4, 0.55, 32);
    this.reticleMaterial = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8 * this.fadeOpacity,
    });
    this.reticleMesh = new THREE.Mesh(reticleGeo, this.reticleMaterial);
    this.reticleMesh.rotation.x = -Math.PI / 2;
    this.reticleMesh.position.set(targetPos.x, targetPos.y + 0.05, targetPos.z);
    this.group.add(this.reticleMesh);

    // Esfera / Projétil luminoso voador
    const projGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const projMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    this.projectileMesh = new THREE.Mesh(projGeo, projMat);
    this.projectileMesh.visible = params.animationPhase === 'firing';
    this.group.add(this.projectileMesh);
  }

  private getColorHex(status: RangeStatus): number {
    switch (status) {
      case 'NORMAL':
        return 0x00f3ff; // Ciano fluorescente (BG3 style)
      case 'LONG_RANGE':
        return 0xf59e0b; // Âmbar / Laranja (Desvantagem)
      case 'OUT_OF_RANGE':
        return 0xef4444; // Vermelho (Fora de Alcance)
      default:
        return 0x00f3ff;
    }
  }

  private updateColors(status: RangeStatus) {
    if (this.tubeMaterial && this.reticleMaterial) {
      const colorHex = this.getColorHex(status);
      this.tubeMaterial.color.setHex(colorHex);
      this.tubeMaterial.emissive.setHex(colorHex);
      this.reticleMaterial.color.setHex(colorHex);
    }
  }

  /**
   * Chamado no loop de animação da cena 3D (requestAnimationFrame).
   */
  public animate(delta: number) {
    if (!this.currentParams || this.isDestroyed) return;

    const { animationPhase, onAnimationComplete } = this.currentParams;

    if (animationPhase === 'firing' && this.curve && this.projectileMesh) {
      this.projectileMesh.visible = true;
      this.fireProgress += delta * 2.2; // ~450ms de vôo

      if (this.fireProgress >= 1.0) {
        this.fireProgress = 1.0;
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }

      const point = this.curve.getPointAt(Math.min(1.0, this.fireProgress));
      this.projectileMesh.position.copy(point);
    } else if (animationPhase === 'fading') {
      if (this.projectileMesh) this.projectileMesh.visible = false;
      this.fadeOpacity -= delta * 2.5; // ~400ms fade-out

      if (this.fadeOpacity <= 0) {
        this.fadeOpacity = 0;
        this.clear();
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      } else {
        if (this.tubeMaterial) this.tubeMaterial.opacity = this.fadeOpacity;
        if (this.reticleMaterial) this.reticleMaterial.opacity = 0.8 * this.fadeOpacity;
      }
    } else if (animationPhase === 'aiming') {
      this.fadeOpacity = 1.0;
      this.fireProgress = 0;
      if (this.projectileMesh) this.projectileMesh.visible = false;
      if (this.tubeMaterial) this.tubeMaterial.opacity = 1.0;
      if (this.reticleMaterial) this.reticleMaterial.opacity = 0.8;
    }
  }

  /**
   * Converte a posição do topo do arco para coordenadas de tela (pixels)
   * para posicionamento da badge HTML de distância.
   */
  public getMidpointScreenPos(
    camera: THREE.Camera,
    containerWidth: number,
    containerHeight: number
  ): { x: number; y: number } | null {
    if (!this.curve || !this.currentParams) return null;

    // Pegar o ponto do topo da curva (t = 0.5)
    const midPoint = this.curve.getPointAt(0.5);
    const vector = midPoint.clone();

    // Projetar no espaço NDC da câmera
    vector.project(camera);

    // Se estiver atrás da câmera
    if (vector.z > 1) return null;

    const x = ((vector.x + 1) * containerWidth) / 2;
    const y = ((-vector.y + 1) * containerHeight) / 2;

    return { x, y };
  }

  public clear() {
    this.currentParams = null;
    this.curve = null;
    this.fireProgress = 0;
    this.fadeOpacity = 1.0;
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
  }

  public destroy(scene: THREE.Scene) {
    this.isDestroyed = true;
    this.clear();
    scene.remove(this.group);
  }
}

/**
 * Componente React HUD para exibir o Badge de Distância (Módulos de Metros / Pés e Status)
 * posicionado sobre a spline em tempo real.
 */
interface RangedDistanceBadgeProps {
  distanceFt: number;
  status: RangeStatus;
  normalRangeM: number;
  maxRangeM: number;
  isWeaponWithLongRange: boolean;
  screenPos: { x: number; y: number } | null;
}

export const RangedDistanceBadge: React.FC<RangedDistanceBadgeProps> = ({
  distanceFt,
  status,
  normalRangeM,
  maxRangeM,
  isWeaponWithLongRange,
  screenPos,
}) => {
  if (!screenPos) return null;

  const formatted = formatDistanceDisplay(distanceFt);

  let statusBadge = (
    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
      <span>🎯</span> Alcance Normal ({normalRangeM}m)
    </span>
  );

  if (status === 'LONG_RANGE') {
    statusBadge = (
      <span className="bg-amber-500/25 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 animate-pulse">
        <span>⚠️</span> Alcance Longo (Desvantagem! max {maxRangeM}m)
      </span>
    );
  } else if (status === 'OUT_OF_RANGE') {
    statusBadge = (
      <span className="bg-rose-500/25 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
        <span>⛔</span> Fora de Alcance (max {maxRangeM}m)
      </span>
    );
  }

  return (
    <div
      className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out"
      style={{
        left: `${screenPos.x}px`,
        top: `${screenPos.y - 20}px`,
      }}
    >
      <div className="bg-slate-950/90 border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-xl p-2 flex flex-col items-center gap-1 min-w-[140px]">
        <div className="flex items-center gap-1.5 font-mono text-sm font-black text-slate-100">
          <span className="text-cyan-400 font-sans">🏹</span>
          <span>{formatted.meters}</span>
          <span className="text-slate-400 text-xs font-normal">({formatted.feet})</span>
        </div>
        <div>{statusBadge}</div>
      </div>
    </div>
  );
};
