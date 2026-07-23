import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Combatant } from '@/lib/types';
import { getModelUrlByNameOrPath, resolvePlayerModelUrl } from '@/lib/3d-models';

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
const loadedModelCache = new Map<string, THREE.Group>();

function normalizeAndPrepareModel(modelScene: THREE.Group): THREE.Group {
  const box = new THREE.Box3().setFromObject(modelScene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const targetHeight = 1.35; // Altura padrão proporcional em unidades do mundo 3D
  const naturalHeight = size.y || Math.max(size.x, size.z);

  if (naturalHeight > 0) {
    const scale = targetHeight / naturalHeight;
    modelScene.scale.set(scale, scale, scale);
    const boxMinY = box.min.y;
    modelScene.position.y = -boxMinY * scale;
  } else {
    modelScene.scale.set(0.85, 0.85, 0.85);
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
  const colorHex = isPlayer ? 0x38bdf8 : 0xe11d48; // sky-400 or rose-600

  // Removed Base Cylinder Platform

  // 2. Selection Ring
  const isSelected = options.isCurrentTurn || options.isSelectedForRotation || options.isSelectedTarget || options.isSpellTargeted;
  if (isSelected) {
    const ringGeo = new THREE.RingGeometry(0.75, 0.9, 32);
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

  // 3. Direction Arrow Cone
  const arrowGeo = new THREE.ConeGeometry(0.18, 0.35, 3);
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
  arrowMesh.name = 'arrowMesh';
  arrowMesh.rotation.x = Math.PI / 2;
  arrowMesh.position.set(0, 0.05, -0.6);
  group.add(arrowMesh);

  // 4. Determine Model GLB URL
  let modelUrl = options.combatant.modelUrl;
  if (!modelUrl) {
    if (isPlayer) {
      modelUrl = resolvePlayerModelUrl(options.combatant.name);
    } else {
      modelUrl = getModelUrlByNameOrPath(options.combatant.name);
    }
  }

  if (modelUrl) {
    if (loadedModelCache.has(modelUrl)) {
      const cloned = loadedModelCache.get(modelUrl)!.clone(true);
      group.add(cloned);
      if (onLoaded) onLoaded();
    } else {
      gltfLoader.load(
        modelUrl,
        (gltf) => {
          const preparedModel = normalizeAndPrepareModel(gltf.scene);
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

    if (!ringMesh) {
      const ringGeo = new THREE.RingGeometry(0.75, 0.9, 32);
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

