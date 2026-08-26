/**
 * Masters Codex - 3D Medieval Fire Particle & Ember Simulation Engine
 * Sistema GPU-friendly de partículas de fogo volumétrico, brasas incandescentes,
 * fagulhas ascendentes e modulação orgânica de iluminação para tochas e fogueiras.
 */
import * as THREE from 'three';
import { BuildingBlock3D, BuildingBlockType } from '@/lib/3d-building-blocks';

// Gera textura procedural de brilho esférico e chama radial via Canvas 2D
function createFireParticleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 220, 100, 0.95)');
    gradient.addColorStop(0.5, 'rgba(255, 120, 20, 0.6)');
    gradient.addColorStop(0.8, 'rgba(220, 40, 0, 0.2)');
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.premultiplyAlpha = true;
  return texture;
}

export interface FireEmitterConfig {
  x: number;
  y: number;
  z: number;
  type: BuildingBlockType | 'token_torch';
  scale: number;
  isMystic?: boolean;
}

interface ParticleData {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  baseSize: number;
  emitterIdx: number;
  isEmber: boolean;
}

export interface FireParticleSystemInstance {
  update: (delta: number) => void;
  updateEmitters: (blocks: BuildingBlock3D[], tokenTorches?: { x: number; y: number; z: number }[]) => void;
  dispose: () => void;
}

export function createFireParticleSystem(scene: THREE.Scene): FireParticleSystemInstance {
  const MAX_EMITTERS = 80;
  const PARTICLES_PER_EMITTER = 26;
  const MAX_PARTICLES = MAX_EMITTERS * PARTICLES_PER_EMITTER;

  let emitters: FireEmitterConfig[] = [];
  const particles: ParticleData[] = [];

  // Buffer Geometries para Points
  const fireGeo = new THREE.BufferGeometry();
  const firePositions = new Float32Array(MAX_PARTICLES * 3);
  const fireColors = new Float32Array(MAX_PARTICLES * 3);
  const fireSizes = new Float32Array(MAX_PARTICLES);

  fireGeo.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
  fireGeo.setAttribute('color', new THREE.BufferAttribute(fireColors, 3));
  fireGeo.setAttribute('size', new THREE.BufferAttribute(fireSizes, 1));

  const fireTex = createFireParticleTexture();

  const fireMat = new THREE.PointsMaterial({
    size: 0.55,
    map: fireTex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
    sizeAttenuation: true,
  });

  const firePoints = new THREE.Points(fireGeo, fireMat);
  firePoints.name = 'fireParticleSystem';
  firePoints.frustumCulled = false;
  scene.add(firePoints);

  // Inicializa a piscina de partículas
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push({
      x: 0,
      y: -999,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 1.0,
      size: 0.2,
      baseSize: 0.2,
      emitterIdx: -1,
      isEmber: false,
    });
  }

  const resetParticle = (p: ParticleData, e: FireEmitterConfig, eIdx: number) => {
    p.emitterIdx = eIdx;
    p.isEmber = Math.random() < 0.35; // 35% de chance de ser uma fagulha ascendente

    const radSpread = (e.type === 'campfire' ? 0.35 : e.type === 'brazier' ? 0.3 : e.type === 'cauldron' ? 0.32 : 0.1) * e.scale;
    const ang = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radSpread;

    p.x = e.x + Math.cos(ang) * r;
    p.y = e.y + (Math.random() - 0.5) * 0.08 * e.scale;
    p.z = e.z + Math.sin(ang) * r;

    const baseVy = (p.isEmber ? (Math.random() * 1.6 + 1.2) : (Math.random() * 1.0 + 0.6)) * e.scale;
    p.vx = (Math.random() - 0.5) * 0.3 * e.scale;
    p.vy = baseVy;
    p.vz = (Math.random() - 0.5) * 0.3 * e.scale;

    p.maxLife = (p.isEmber ? (Math.random() * 0.8 + 0.5) : (Math.random() * 0.5 + 0.3)) * (e.scale > 1.2 ? 1.3 : 1.0);
    p.life = p.maxLife;

    p.baseSize = (p.isEmber ? (Math.random() * 0.16 + 0.08) : (Math.random() * 0.42 + 0.25)) * e.scale;
    p.size = p.baseSize;
  };

  const getEmitterOffset = (block: BuildingBlock3D): { offsetY: number; offsetZ: number; scale: number; isMystic: boolean } | null => {
    const h = block.heightScale || 1.0;
    switch (block.type) {
      case 'campfire':
        return { offsetY: 0.35 * h, offsetZ: 0, scale: 1.4, isMystic: false };
      case 'brazier':
        return { offsetY: 1.35 * h, offsetZ: 0, scale: 1.3, isMystic: false };
      case 'torch_standing':
        return { offsetY: 1.7 * h, offsetZ: 0, scale: 0.9, isMystic: false };
      case 'torch_wall':
        return { offsetY: 2.05 * h, offsetZ: 0.7, scale: 0.85, isMystic: false };
      case 'candelabra':
        return { offsetY: 1.08 * h, offsetZ: 0, scale: 0.65, isMystic: false };
      case 'oil_lamp':
        return { offsetY: 0.42 * h, offsetZ: 0, scale: 0.55, isMystic: false };
      case 'lantern_medieval':
        return { offsetY: 0.42 * h, offsetZ: 0, scale: 0.6, isMystic: false };
      case 'candle':
        return { offsetY: 0.44 * h, offsetZ: 0, scale: 0.45, isMystic: false };
      case 'cauldron':
        return { offsetY: 1.05 * h, offsetZ: 0, scale: 1.1, isMystic: true };
      default:
        return null;
    }
  };

  const updateEmitters = (blocks: BuildingBlock3D[], tokenTorches: { x: number; y: number; z: number }[] = []) => {
    const newEmitters: FireEmitterConfig[] = [];

    blocks.forEach((block) => {
      const info = getEmitterOffset(block);
      if (info) {
        const rotRad = ((block.rotationDeg || 0) * Math.PI) / 180;
        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);

        const worldX = block.x + (-sin * info.offsetZ);
        const worldZ = block.z + (cos * info.offsetZ);
        const worldY = (block.yElevation || 0) + info.offsetY;

        newEmitters.push({
          x: worldX,
          y: worldY,
          z: worldZ,
          type: block.type,
          scale: info.scale,
          isMystic: info.isMystic,
        });

        // No candelabro adicionamos as chamas das pontas laterais
        if (block.type === 'candelabra') {
          for (const sideX of [-0.3, 0.3]) {
            const sideWorldX = worldX + cos * sideX;
            const sideWorldZ = worldZ + sin * sideX;
            newEmitters.push({
              x: sideWorldX,
              y: worldY,
              z: sideWorldZ,
              type: 'candle',
              scale: 0.45,
              isMystic: false,
            });
          }
        }
      }
    });

    tokenTorches.forEach((tt) => {
      newEmitters.push({
        x: tt.x,
        y: tt.y + 1.2,
        z: tt.z,
        type: 'token_torch',
        scale: 0.8,
        isMystic: false,
      });
    });

    emitters = newEmitters.slice(0, MAX_EMITTERS);

    // Limpa partículas órfãs
    particles.forEach((p) => {
      if (p.emitterIdx >= emitters.length) {
        p.y = -999;
        p.life = 0;
        p.emitterIdx = -1;
      }
    });
  };

  let globalTime = 0;

  const update = (delta: number) => {
    if (emitters.length === 0) {
      fireGeo.setDrawRange(0, 0);
      return;
    }

    const dt = Math.min(delta, 0.1);
    globalTime += dt;

    const activeCount = emitters.length * PARTICLES_PER_EMITTER;
    const posArr = firePositions;
    const colArr = fireColors;
    const sizeArr = fireSizes;

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];
      const eIdx = Math.floor(i / PARTICLES_PER_EMITTER);
      const emitter = emitters[eIdx];

      if (!emitter) continue;

      p.life -= dt;
      if (p.life <= 0 || p.emitterIdx !== eIdx) {
        resetParticle(p, emitter, eIdx);
      }

      const progress = 1.0 - Math.max(0, p.life / p.maxLife);
      const swirlAng = globalTime * 3.5 + i * 0.35;
      const swirlX = Math.sin(swirlAng) * (0.15 + progress * 0.35);
      const swirlZ = Math.cos(swirlAng * 0.8) * (0.15 + progress * 0.35);

      p.x += (p.vx + swirlX * 0.35) * dt;
      p.y += (p.vy + progress * 0.25) * dt;
      p.z += (p.vz + swirlZ * 0.35) * dt;

      let r = 1.0;
      let g = 0.8;
      let b = 0.2;
      let curSize = p.baseSize;

      if (emitter.isMystic) {
        if (progress < 0.3) {
          r = 0.7; g = 1.0; b = 0.85;
        } else if (progress < 0.7) {
          r = 0.15; g = 0.85; b = 0.5;
        } else {
          r = 0.05; g = 0.4; b = 0.25;
        }
        curSize = p.baseSize * (0.9 + progress * 0.7);
      } else if (p.isEmber) {
        if (progress < 0.2) {
          r = 1.0; g = 0.95; b = 0.65;
        } else if (progress < 0.6) {
          r = 1.0; g = 0.55; b = 0.1;
        } else {
          r = 0.85; g = 0.15; b = 0.04;
        }
        curSize = p.baseSize * (1.0 - progress * 0.55);
      } else {
        if (progress < 0.25) {
          r = 1.0; g = 0.95; b = 0.6;
          curSize = p.baseSize * (0.8 + progress * 1.4);
        } else if (progress < 0.65) {
          r = 1.0; g = 0.5; b = 0.08;
          curSize = p.baseSize * (1.2 - (progress - 0.25) * 0.75);
        } else {
          r = 0.7; g = 0.12; b = 0.02;
          curSize = p.baseSize * (0.8 * (1.0 - progress));
        }
      }

      const alphaFade = Math.sin(progress * Math.PI);
      r *= alphaFade;
      g *= alphaFade;
      b *= alphaFade;

      const idx3 = i * 3;
      posArr[idx3] = p.x;
      posArr[idx3 + 1] = p.y;
      posArr[idx3 + 2] = p.z;

      colArr[idx3] = r;
      colArr[idx3 + 1] = g;
      colArr[idx3 + 2] = b;

      sizeArr[i] = Math.max(0.01, curSize);
    }

    fireGeo.attributes.position.needsUpdate = true;
    fireGeo.attributes.color.needsUpdate = true;
    fireGeo.attributes.size.needsUpdate = true;
    fireGeo.setDrawRange(0, activeCount);

    // 2. Modulação Orgânica de Iluminação (Oscilação de Luz de Fogo & Sombras Dançantes)
    scene.traverse((obj) => {
      if (obj instanceof THREE.PointLight) {
        const u = obj.userData;
        if (u && (u.isFlickeringLight || obj.name === 'blockDynamicLight' || obj.name === 'tokenTorchLight')) {
          if (u.baseIntensity === undefined) {
            u.baseIntensity = obj.intensity;
            u.flickerOffset = Math.random() * 100;
            u.baseY = obj.position.y;
            u.baseZ = obj.position.z;
          }

          const offset = u.flickerOffset || 0;
          const t = globalTime * 7.5 + offset;

          // Ruído multi-frequência (harmônicos de chama)
          const n1 = Math.sin(t * 1.0) * 0.45;
          const n2 = Math.sin(t * 2.37 + 1.2) * 0.25;
          const n3 = Math.sin(t * 5.81 + 2.4) * 0.15;
          const n4 = Math.sin(t * 12.3 + 4.1) * 0.05;

          // Estalos e labaredas esporádicas de brasa
          const flare = Math.sin(globalTime * 1.5 + offset) > 0.88 ? (Math.random() * 0.18) : 0;

          // Variação de intensidade de ~20% a 25% (calibrada para realismo cinematográfico)
          const flickerFactor = 1.0 + (n1 + n2 + n3 + n4) * 0.22 + flare;
          obj.intensity = u.baseIntensity * Math.max(0.45, Math.min(1.55, flickerFactor));

          // Leve micro-movimentação da posição da luz (sombras dançam na parede e no chão)
          if (u.baseY !== undefined) {
            obj.position.y = u.baseY + Math.sin(t * 1.8) * 0.035;
          }
          if (u.baseZ !== undefined) {
            obj.position.z = u.baseZ + Math.cos(t * 1.4) * 0.03;
          }
        }
      }
    });
  };

  const dispose = () => {
    scene.remove(firePoints);
    fireGeo.dispose();
    fireMat.dispose();
    fireTex.dispose();
  };

  return {
    update,
    updateEmitters,
    dispose,
  };
}
