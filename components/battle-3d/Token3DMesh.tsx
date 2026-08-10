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
    group.add(ringMesh);
  }

  // 2. Direction Arrow Cone
  const arrowGeo = new THREE.ConeGeometry(0.25 * sizeScale, 0.5 * sizeScale, 3);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  arrowMesh.name = 'arrowMesh';
  arrowMesh.rotation.x = Math.PI / 2;
  arrowMesh.position.set(0, 0.05, -1.0 * sizeScale);
  group.add(arrowMesh);

  // 3. Determine Token Mode & URLs
  const tokenType = options.combatant.tokenType || (options.combatant.tokenImageUrl ? 'billboard' : '3d');
  const imageUrl = options.combatant.tokenImageUrl || options.combatant.avatarUrl;

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
    group.add(shadowMesh);

    const applyTextureToSprite = (texture: THREE.Texture) => {
      const img = texture.image as HTMLImageElement | undefined;
      const aspect = (img && img.width && img.height)
        ? img.width / img.height
        : 1.0;
      
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(spriteMat);
      sprite.name = 'billboardSprite';
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

  return group;
}

export function updateTokenMeshState(
  group: THREE.Group,
  options: TokenMeshOptions
): void {
  group.position.set(options.positionX, 0, options.positionZ);
  group.rotation.y = (options.rotationAngleDeg * Math.PI) / 180;

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
}

