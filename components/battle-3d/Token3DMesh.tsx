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

/**
 * Processa a textura via Canvas offscreen, tornando pixels brancos/quase-brancos transparentes.
 * Funciona como um chroma-key em tempo real para remover fundos brancos de tokens billboard.
 * @param texture - Textura Three.js carregada
 * @param threshold - Limiar de "brancura" (0-255). Pixels com R, G e B acima deste valor serão transparentes. Default: 235.
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

    // Se o pixel é branco/quase-branco, tornar totalmente transparente
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0; // alpha = 0
    }
    // Suavizar bordas semi-brancas para evitar halo (anti-aliasing)
    else if (r >= threshold - 20 && g >= threshold - 20 && b >= threshold - 20) {
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

function getSpriteHeightBySize(sizeStr?: string): number {
  const info = getCreatureGridSize(sizeStr);
  if (info.gridSquares === 1) {
    if (info.sizeLabel === 'Miúdo') return 1.4;
    if (info.sizeLabel === 'Pequeno') return 1.8;
    return 2.3;
  }
  return 2.3 * info.scaleFactor;
}

function normalizeAndPrepareModel(modelScene: THREE.Group, sizeStr?: string): THREE.Group {
  const box = new THREE.Box3().setFromObject(modelScene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const info = getCreatureGridSize(sizeStr);
  const targetHeight = 2.295 * info.scaleFactor; // Altura proporcional ao tamanho do grid
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

  modelScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.renderOrder = 50;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat && mat.emissive && !mat.emissiveMap) {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
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

  // 2. Direction Arrow Cone
  const arrowGeo = new THREE.ConeGeometry(0.25 * sizeScale, 0.5 * sizeScale, 3);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  arrowMesh.name = 'arrowMesh';
  arrowMesh.rotation.x = Math.PI / 2;
  arrowMesh.position.set(0, 0.05, -1.0 * sizeScale);
  arrowMesh.renderOrder = 51;
  group.add(arrowMesh);

  // 2.1. Dynamic Torch Light (3D PointLight)
  const hasTorch = !!options.combatant.hasTorch;
  const isDarkvision = options.combatant.visionType === 'darkvision';
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
  
  // Prioridade rigorosa para o PINO DE COMBATE (corpo inteiro):
  // 1. combatImageUrl (definido pelo usuário na galeria)
  // 2. tokenImageUrl (imagem de token da criatura/monstro/ficha)
  // 3. modelUrl (caso seja uma imagem 2D em vez de arquivo .glb)
  // 4. avatarUrl (último recurso se nenhuma outra imagem existir)
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

  // Render Mode A: Billboard 2D Sprite (Always Facing Player Camera)
  if (tokenType === 'billboard' && imageUrl) {
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
          spriteColor.setRGB(0.05, 0.05, 0.08); // pitch dark
        }
      }

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
      const width = spriteHeight * aspect;
      sprite.scale.set(width, spriteHeight, 1.0);
      sprite.position.set(0, spriteHeight / 2, 0);
      group.add(sprite);

      if (onLoaded) onLoaded();
    };

    if (loadedTextureCache.has(imageUrl)) {
      applyTextureToSprite(loadedTextureCache.get(imageUrl)!);
    } else {
      textureLoader.load(
        imageUrl,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          // Processa a textura para remover fundo branco antes de salvar no cache
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
  // Render Mode B: 3D Model GLB
  else if (modelUrl) {
    if (loadedModelCache.has(modelUrl)) {
      const cloned = loadedModelCache.get(modelUrl)!.clone(true);
      group.add(cloned);
      if (onLoaded) onLoaded();
    } else {
      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const preparedModel = normalizeAndPrepareModel(gltf.scene, options.combatant.size);
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
  };

  return group;
}

export function updateTokenMeshState(
  group: THREE.Group,
  options: TokenMeshOptions
): void {
  group.position.set(options.positionX, 0, options.positionZ);
  group.rotation.y = (options.rotationAngleDeg * Math.PI) / 180;

  // Atualizar tonalidade do Sprite Billboard com a iluminação do ambiente/tocha
  const sprite = group.getObjectByName('billboardSprite') as THREE.Sprite | undefined;
  if (sprite && sprite.material) {
    if (options.isNight) {
      if (options.combatant.hasTorch || options.isIlluminated) {
        sprite.material.color.setRGB(1.0, 0.95, 0.85);
      } else if (options.combatant.visionType === 'darkvision') {
        sprite.material.color.setRGB(0.5, 0.65, 0.85);
      } else {
        sprite.material.color.setRGB(0.05, 0.05, 0.08); // Escuridão profunda
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
  const hasTorch = !!options.combatant.hasTorch;
  const isDarkvision = options.combatant.visionType === 'darkvision';

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

