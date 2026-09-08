import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Combatant } from '@/lib/types';
import { getModelUrlByNameOrPath, resolvePlayerModelUrl } from '@/lib/3d-models';
import { getCreatureGridSize } from '@/lib/utils/creatureSize';

export interface TokenMeshOptions {
  combatant: Combatant;
  isCurrentTurn: boolean;
  isSelectedTarget: boolean;
  isSelectedForRotation: boolean;
  isControlledByUser: boolean;
  positionX: number;
  positionZ: number;
  rotationAngleDeg: number;
  isSpellTargeted?: boolean;
  isNight?: boolean;
  isIlluminated?: boolean;
}

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const loadedModelCache = new Map<string, THREE.Group>();
const loadedTextureCache = new Map<string, THREE.Texture>();
const loadedDeadTextureCache = new Map<string, THREE.Texture>();

/**
 * Processa a textura via Canvas offscreen, tornando pixels brancos/quase-brancos transparentes.
 * Funciona como um chroma-key em tempo real para remover fundos brancos de tokens billboard.
 */
function removeWhiteBackground(texture: THREE.Texture, threshold = 235): THREE.Texture {
  const img = texture.image as HTMLImageElement;
  if (!img || !img.width || !img.height) return texture;

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return texture;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0; // alpha = 0
    } else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
      const avgDistance = ((threshold - r) + (threshold - g) + (threshold - b)) / 3;
      const alphaFactor = Math.min(1, avgDistance / 20);
      data[i + 3] = Math.round(data[i + 3] * alphaFactor);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const newTexture = new THREE.CanvasTexture(canvas);
  newTexture.colorSpace = THREE.SRGBColorSpace;
  newTexture.needsUpdate = true;
  return newTexture;
}

/**
 * Cria a textura do disco/moeda Dyson para monstros mortos:
 * - Grayscale (preto e branco de alto contraste)
 * - Vinheta escura circular nas bordas
 * - Marca d'água sutil de caveira estilizada
 * - Borda esculpida estilo caneta Dyson / pedra
 */
function createDeadMonsterTokenTexture(baseTexture: THREE.Texture): THREE.Texture {
  const img = baseTexture.image as HTMLImageElement;
  if (!img || !img.width || !img.height) return baseTexture;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return baseTexture;

  const center = size / 2;
  const radius = size / 2 - 8;

  // 1. Recorte circular estilo moeda de mesa VTT / Dyson
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Fundo base escuro (ardósia profunda)
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, size, size);

  // 3. Desenhar a foto da criatura em Grayscale + Contraste
  ctx.filter = 'grayscale(100%) contrast(125%) brightness(75%)';
  ctx.drawImage(img, 8, 8, size - 16, size - 16);
  ctx.filter = 'none';

  // 4. Vinheta Radial Escura dramática
  const vignette = ctx.createRadialGradient(center, center, radius * 0.35, center, center, radius);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0.05)');
  vignette.addColorStop(0.65, 'rgba(15, 23, 42, 0.55)');
  vignette.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, size, size);

  // 5. Ícone/Símbolo de Caveira Estilizado sutil centralizado
  ctx.save();
  ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
  ctx.strokeStyle = 'rgba(2, 6, 23, 0.9)';
  ctx.lineWidth = 3;

  // Crânio
  ctx.beginPath();
  ctx.arc(center, center - size * 0.04, size * 0.14, Math.PI, 0, false);
  ctx.lineTo(center + size * 0.08, center + size * 0.12);
  ctx.lineTo(center - size * 0.08, center + size * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Olhos
  ctx.fillStyle = '#090d16';
  ctx.beginPath();
  ctx.arc(center - size * 0.05, center - size * 0.03, size * 0.035, 0, Math.PI * 2);
  ctx.arc(center + size * 0.05, center - size * 0.03, size * 0.035, 0, Math.PI * 2);
  ctx.fill();

  // Dentes / fendas do maxilar
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(center - size * 0.035, center + size * 0.06);
  ctx.lineTo(center - size * 0.035, center + size * 0.12);
  ctx.moveTo(center, center + size * 0.06);
  ctx.lineTo(center, center + size * 0.12);
  ctx.moveTo(center + size * 0.035, center + size * 0.06);
  ctx.lineTo(center + size * 0.035, center + size * 0.12);
  ctx.stroke();
  ctx.restore();

  ctx.restore(); // Fim do clip circular

  // 6. Borda exterior estilo Dyson / pedra entalhada
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(center, center, radius - 4, 0, Math.PI * 2);
  ctx.stroke();

  const newTexture = new THREE.CanvasTexture(canvas);
  newTexture.colorSpace = THREE.SRGBColorSpace;
  newTexture.needsUpdate = true;
  return newTexture;
}

function getSpriteHeightBySize(sizeStr?: string): number {
  const info = getCreatureGridSize(sizeStr);
  if (info.gridSquares === 1) {
    if (info.sizeLabel === 'Miúdo') return 1.4;
    if (info.sizeLabel === 'Pequeno') return 1.8;
    return 2.3;
  }
  return 2.3 * info.scaleFactor;
}

function normalizeAndPrepareModel(modelScene: THREE.Group, sizeStr?: string, isDownedPlayer?: boolean): THREE.Group {
  const box = new THREE.Box3().setFromObject(modelScene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const info = getCreatureGridSize(sizeStr);
  const targetHeight = 2.295 * info.scaleFactor;
  const naturalHeight = size.y || Math.max(size.x, size.z);

  if (naturalHeight > 0) {
    const scale = targetHeight / naturalHeight;
    modelScene.scale.set(scale, scale, scale);
    const boxMinY = box.min.y;
    modelScene.position.y = -boxMinY * scale;
  } else {
    const defaultScale = 1.445 * info.scaleFactor;
    modelScene.scale.set(defaultScale, defaultScale, defaultScale);
    modelScene.position.y = 0;
  }

  if (isDownedPlayer) {
    // Jogador caído a 0 HP: deitado no chão sem clipar
    modelScene.rotation.x = -Math.PI / 2;
    modelScene.position.y = 0.08;
  }

  modelScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.renderOrder = 50;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive && !mat.emissiveMap) {
        mat.emissive.setHex(isDownedPlayer ? 0x330000 : 0x000000);
        mat.emissiveIntensity = isDownedPlayer ? 0.3 : 0;
      }
    }
  });

  return modelScene;
}

export function createTokenMesh(
  options: TokenMeshOptions,
  onLoaded?: () => void
): THREE.Group {
  const group = new THREE.Group();
  const targetKey = options.combatant.id || options.combatant.name;
  group.name = `token-${targetKey}`;
  group.position.set(options.positionX, 0, options.positionZ);
  group.rotation.y = (options.rotationAngleDeg * Math.PI) / 180;

  const isPlayer = options.combatant.type === 'player';
  const isMonster = options.combatant.type === 'monster';
  const isDead = isMonster && (options.combatant.hp <= 0 || options.combatant.conditions?.includes('Morto'));
  const isDowned = isPlayer && options.combatant.hp <= 0;

  const sizeInfo = getCreatureGridSize(options.combatant.size);
  const sizeScale = Math.max(1, sizeInfo.gridSquares * 0.85);

  // 1. Selection Ring
  const isSelected = options.isCurrentTurn || options.isSelectedForRotation || options.isSelectedTarget || options.isSpellTargeted;
  if (isSelected) {
    const ringGeo = new THREE.RingGeometry(1.275 * sizeScale, 1.53 * sizeScale, 32);
    const ringColor = options.isSpellTargeted
      ? 0xf97316
      : options.isCurrentTurn
      ? 0x22c55e
      : options.isSelectedTarget
      ? 0xef4444
      : 0x3b82f6;

    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.name = 'selectionRing';
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.02;
    ringMesh.renderOrder = 51;
    group.add(ringMesh);
  }

  // 2. Direction Arrow Cone (apenas para criaturas vivas e em pé)
  if (!isDead) {
    const arrowGeo = new THREE.ConeGeometry(0.25 * sizeScale, 0.5 * sizeScale, 3);
    const arrowMat = new THREE.MeshBasicMaterial({ color: isDowned ? 0xef4444 : 0xfacc15 });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.name = 'arrowMesh';
    arrowMesh.rotation.x = Math.PI / 2;
    arrowMesh.position.set(0, 0.05, -1.0 * sizeScale);
    arrowMesh.renderOrder = 51;
    group.add(arrowMesh);
  }

  // 2.1. Dynamic Torch Light (3D PointLight - apenas para vivos)
  const hasTorch = !isDead && !!options.combatant.hasTorch;
  const isDarkvision = !isDead && options.combatant.visionType === 'darkvision';
  const lightColor = hasTorch ? 0xff9933 : (isDarkvision ? 0x7dd3fc : 0xffaa44);
  const lightIntensity = hasTorch ? 3.5 : (isDarkvision ? 1.2 : 0);
  const lightDistance = hasTorch ? 16 : (isDarkvision ? ((options.combatant.darkvisionRange || 60) / 5) * 2 : 12);
  const torchLight = new THREE.PointLight(lightColor, lightIntensity, lightDistance, 1.2);
  torchLight.name = 'tokenTorchLight';
  torchLight.position.set(0, 1.5 * sizeScale, 0);
  torchLight.castShadow = false;
  torchLight.userData = {
    baseIntensity: lightIntensity,
    isFlickeringLight: hasTorch,
    flickerOffset: Math.random() * 100,
  };
  torchLight.visible = hasTorch || isDarkvision;
  group.add(torchLight);

  // Flame particle sphere indicator
  const flameGeo = new THREE.SphereGeometry(0.12 * sizeScale, 8, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.name = 'torchFlameMesh';
  flameMesh.position.set(0.3 * sizeScale, 1.6 * sizeScale, -0.3 * sizeScale);
  flameMesh.visible = hasTorch;
  group.add(flameMesh);

  // 3. Determine Token Mode & URLs
  const is2DModel = options.combatant.modelUrl && !options.combatant.modelUrl.endsWith('.glb');
  const tokenType = options.combatant.tokenType || ((options.combatant.tokenImageUrl || options.combatant.combatImageUrl || is2DModel) ? 'billboard' : '3d');
  
  const imageUrl = options.combatant.combatImageUrl ||
    options.combatant.tokenImageUrl ||
    (is2DModel ? options.combatant.modelUrl : undefined) ||
    options.combatant.avatarUrl;

  let modelUrl = options.combatant.modelUrl;
  if (!modelUrl && tokenType === '3d') {
    if (isPlayer) {
      modelUrl = resolvePlayerModelUrl(options.combatant.name);
    } else {
      modelUrl = getModelUrlByNameOrPath(options.combatant.name);
    }
  }

  // =========================================================================
  // CASO 1: MONSTRO MORTO -> TOKEN REDONDO ESTILO MOEDA/DISCO DYSON NO PISO
  // =========================================================================
  if (isDead && imageUrl) {
    const applyDeadDisc = (deadTexture: THREE.Texture) => {
      const discRadius = 0.95 * sizeScale;
      const discHeight = 0.05;

      // Geometria de cilindro chanfrado no chão
      const discGeo = new THREE.CylinderGeometry(discRadius, discRadius, discHeight, 32);

      // Multi-material: [lateral, topo, base]
      const sideMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.85,
        metalness: 0.2,
      });

      const topMat = new THREE.MeshStandardMaterial({
        map: deadTexture,
        roughness: 0.7,
        metalness: 0.1,
      });

      const bottomMat = new THREE.MeshBasicMaterial({
        color: 0x090d16,
      });

      const discMesh = new THREE.Mesh(discGeo, [sideMat, topMat, bottomMat]);
      discMesh.name = 'deadMonsterTokenDisc';
      discMesh.position.y = 0.05; // Elevado para não clipar com o solo
      discMesh.castShadow = true;
      discMesh.receiveShadow = true;
      discMesh.renderOrder = 49;
      group.add(discMesh);

      // Sombra projetada da moeda
      const shadowGeo = new THREE.CircleGeometry(discRadius * 1.06, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.015;
      shadowMesh.name = 'tokenShadow';
      shadowMesh.renderOrder = 48;
      group.add(shadowMesh);

      if (onLoaded) onLoaded();
    };

    if (loadedDeadTextureCache.has(imageUrl)) {
      applyDeadDisc(loadedDeadTextureCache.get(imageUrl)!);
    } else {
      textureLoader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const deadTex = createDeadMonsterTokenTexture(tex);
          loadedDeadTextureCache.set(imageUrl, deadTex);
          applyDeadDisc(deadTex);
        },
        undefined,
        (err) => {
          console.warn(`Erro ao carregar textura de disco morto para ${options.combatant.name}:`, err);
        }
      );
    }
  }

  // =========================================================================
  // CASO 2: BILLBOARD 2D (EM PÉ OU JOGADOR CAÍDO NO CHÃO)
  // =========================================================================
  else if (tokenType === 'billboard' && imageUrl) {
    const spriteHeight = getSpriteHeightBySize(options.combatant.size);

    // Dark Ground Shadow Ring under Billboard
    const shadowGeo = new THREE.CircleGeometry(0.9 * sizeScale, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    shadowMesh.name = 'tokenShadow';
    shadowMesh.renderOrder = 48;
    group.add(shadowMesh);

    const applyTextureToSprite = (texture: THREE.Texture) => {
      const img = texture.image as HTMLImageElement | undefined;
      const aspect = (img && img.width && img.height)
        ? img.width / img.height
        : 1.0;
      
      const spriteColor = new THREE.Color(0xffffff);
      if (options.isNight) {
        if (options.combatant.hasTorch || options.isIlluminated) {
          spriteColor.setRGB(1.0, 0.95, 0.85);
        } else if (options.combatant.visionType === 'darkvision') {
          spriteColor.setRGB(0.5, 0.65, 0.85);
        } else {
          spriteColor.setRGB(0.05, 0.05, 0.08);
        }
      }

      const width = spriteHeight * aspect;

      if (isDowned) {
        // JOGADOR CAÍDO: Malha horizontal deitada rente ao chão
        const planeGeo = new THREE.PlaneGeometry(width, spriteHeight);
        const planeMat = new THREE.MeshStandardMaterial({
          map: texture,
          color: isNightTimeColor(spriteColor),
          transparent: true,
          alphaTest: 0.05,
          side: THREE.DoubleSide,
          roughness: 0.8,
        });

        const downedMesh = new THREE.Mesh(planeGeo, planeMat);
        downedMesh.name = 'downedPlayerPlane';
        downedMesh.rotation.x = -Math.PI / 2;
        downedMesh.position.set(0, 0.08, 0); // Elevado para não clipar com o solo
        downedMesh.renderOrder = 50;
        group.add(downedMesh);
      } else {
        // VIVO: Sprite Billboard vertical voltado para a câmera
        const spriteMat = new THREE.SpriteMaterial({
          map: texture,
          color: spriteColor,
          transparent: true,
          alphaTest: 0.05,
          depthWrite: false,
        });

        const sprite = new THREE.Sprite(spriteMat);
        sprite.name = 'billboardSprite';
        sprite.renderOrder = 50;
        sprite.scale.set(width, spriteHeight, 1.0);
        sprite.position.set(0, spriteHeight / 2, 0);
        group.add(sprite);
      }

      if (onLoaded) onLoaded();
    };

    if (loadedTextureCache.has(imageUrl)) {
      applyTextureToSprite(loadedTextureCache.get(imageUrl)!);
    } else {
      textureLoader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          const processedTex = removeWhiteBackground(tex);
          loadedTextureCache.set(imageUrl, processedTex);
          applyTextureToSprite(processedTex);
        },
        undefined,
        (err) => {
          console.warn(`Erro ao carregar textura do pino billboard para ${options.combatant.name}:`, err);
        }
      );
    }
  }

  // =========================================================================
  // CASO 3: MODELO 3D GLB (EM PÉ OU JOGADOR CAÍDO)
  // =========================================================================
  else if (modelUrl) {
    if (loadedModelCache.has(modelUrl)) {
      const cloned = loadedModelCache.get(modelUrl)!.clone(true);
      if (isDowned) {
        cloned.rotation.x = -Math.PI / 2;
        cloned.position.y = 0.08;
      }
      group.add(cloned);
      if (onLoaded) onLoaded();
    } else {
      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const preparedModel = normalizeAndPrepareModel(gltf.scene, options.combatant.size, isDowned);
          loadedModelCache.set(modelUrl!, preparedModel.clone(true));
          group.add(preparedModel);
          if (onLoaded) onLoaded();
        },
        undefined,
        (err) => {
          console.warn(`Erro ao carregar modelo 3D GLB para ${options.combatant.name}:`, err);
        }
      );
    }
  }

  group.userData = {
    tokenType,
    modelUrl,
    imageUrl,
    isDead,
    isDowned,
  };

  return group;
}

function isNightTimeColor(baseColor: THREE.Color): THREE.Color {
  return baseColor;
}

export function updateTokenMeshState(
  group: THREE.Group,
  options: TokenMeshOptions
): void {
  group.position.set(options.positionX, 0, options.positionZ);
  group.rotation.y = (options.rotationAngleDeg * Math.PI) / 180;

  // Atualizar tonalidade com a iluminação do ambiente/tocha
  const sprite = group.getObjectByName('billboardSprite') as THREE.Sprite | undefined;
  if (sprite && sprite.material) {
    if (options.isNight) {
      if (options.combatant.hasTorch || options.isIlluminated) {
        sprite.material.color.setRGB(1.0, 0.95, 0.85);
      } else if (options.combatant.visionType === 'darkvision') {
        sprite.material.color.setRGB(0.5, 0.65, 0.85);
      } else {
        sprite.material.color.setRGB(0.05, 0.05, 0.08);
      }
    } else {
      sprite.material.color.setRGB(1.0, 1.0, 1.0);
    }
  }

  // Selection Ring
  let ringMesh = group.getObjectByName('selectionRing') as THREE.Mesh | undefined;
  const isSelected = options.isCurrentTurn || options.isSelectedForRotation || options.isSelectedTarget || options.isSpellTargeted;

  if (isSelected) {
    const ringColor = options.isSpellTargeted
      ? 0xf97316
      : options.isCurrentTurn
      ? 0x22c55e
      : options.isSelectedTarget
      ? 0xef4444
      : 0x3b82f6;

    const sizeInfo = getCreatureGridSize(options.combatant.size);
    const sizeScale = Math.max(1, sizeInfo.gridSquares * 0.85);

    if (!ringMesh) {
      const ringGeo = new THREE.RingGeometry(1.275 * sizeScale, 1.53 * sizeScale, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
      });
      ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.name = 'selectionRing';
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.02;
      group.add(ringMesh);
    } else {
      (ringMesh.material as THREE.MeshBasicMaterial).color.setHex(ringColor);
      ringMesh.visible = true;
    }
  } else if (ringMesh) {
    ringMesh.visible = false;
  }

  // Update Dynamic Torch Light
  const torchLight = group.getObjectByName('tokenTorchLight') as THREE.PointLight | undefined;
  const flameMesh = group.getObjectByName('torchFlameMesh') as THREE.Mesh | undefined;
  const isDead = options.combatant.type === 'monster' && (options.combatant.hp <= 0 || options.combatant.conditions?.includes('Morto'));
  const hasTorch = !isDead && !!options.combatant.hasTorch;
  const isDarkvision = !isDead && options.combatant.visionType === 'darkvision';

  if (torchLight) {
    torchLight.visible = hasTorch || isDarkvision;
    if (hasTorch) {
      torchLight.color.setHex(0xff9933);
      torchLight.intensity = 3.5;
      torchLight.distance = 16;
      torchLight.castShadow = false;
    } else if (isDarkvision) {
      torchLight.color.setHex(0x7dd3fc);
      torchLight.intensity = 1.2;
      torchLight.distance = Math.max(12, ((options.combatant.darkvisionRange || 60) / 5) * 2);
      torchLight.castShadow = false;
    } else {
      torchLight.intensity = 0;
      torchLight.castShadow = false;
    }
  }
  if (flameMesh) {
    flameMesh.visible = hasTorch;
  }
}
