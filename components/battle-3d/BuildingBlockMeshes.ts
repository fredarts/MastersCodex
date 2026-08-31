import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BuildingBlock3D, SpellTemplate3D, BUILDING_BLOCK_CATALOG } from '@/lib/3d-building-blocks';

// Gerenciador de Carregamento e Cache de Modelos 3D Customizados
const gltfLoader = new GLTFLoader();
const forgeModelCache = new Map<string, THREE.Group>();
const failedForgeModelCache = new Set<string>();

function normalizeAndPrepareForgeModel(
  modelScene: THREE.Group,
  targetWidth: number,
  targetHeight: number
): THREE.Group {
  const box = new THREE.Box3().setFromObject(modelScene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const naturalH = size.y || 1.0;
  const scale = targetHeight / naturalH;

  modelScene.scale.set(scale, scale, scale);

  const center = new THREE.Vector3();
  box.getCenter(center);
  modelScene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  modelScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  const wrapper = new THREE.Group();
  wrapper.add(modelScene);
  return wrapper;
}

// Cache de materiais compartilhados para alta performance
const stoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x64748b, // slate-500
  roughness: 0.85,
  metalness: 0.1,
});

const stoneTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0x475569, // slate-600
  roughness: 0.8,
  metalness: 0.15,
});

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x78350f, // amber-900
  roughness: 0.75,
  metalness: 0.05,
});

const ironMaterial = new THREE.MeshStandardMaterial({
  color: 0x1e293b, // slate-800
  roughness: 0.5,
  metalness: 0.85,
});

const brassMaterial = new THREE.MeshStandardMaterial({
  color: 0xd97706, // amber-600
  roughness: 0.35,
  metalness: 0.75,
});

const silverMaterial = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0, // slate-200
  roughness: 0.3,
  metalness: 0.85,
});

const waxMaterial = new THREE.MeshStandardMaterial({
  color: 0xfef3c7, // amber-100
  roughness: 0.9,
  metalness: 0.0,
});

const goldTrimMaterial = new THREE.MeshStandardMaterial({
  color: 0xf59e0b, // amber-500
  roughness: 0.4,
  metalness: 0.7,
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.4,
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.8,
});

const darkWoodMaterial = new THREE.MeshStandardMaterial({
  color: 0x451a03, // amber-950
  roughness: 0.8,
  metalness: 0.05,
});

const mossStoneMaterial = new THREE.MeshStandardMaterial({
  color: 0x475560,
  roughness: 0.9,
  metalness: 0.05,
});

const arcaneGlowMaterial = new THREE.MeshStandardMaterial({
  color: 0x38bdf8, // sky-400
  emissive: 0x0284c7,
  emissiveIntensity: 1.8,
  roughness: 0.2,
  metalness: 0.5,
});

const emeraldGlowMaterial = new THREE.MeshStandardMaterial({
  color: 0x34d399, // emerald-400
  emissive: 0x059669,
  emissiveIntensity: 2.0,
  roughness: 0.2,
  metalness: 0.3,
});

const clothRedMaterial = new THREE.MeshStandardMaterial({
  color: 0x991b1b, // red-800
  roughness: 0.9,
  metalness: 0.0,
});

const parchmentMaterial = new THREE.MeshStandardMaterial({
  color: 0xfef3c7, // amber-100
  roughness: 0.95,
  metalness: 0.0,
});

const steelBladeMaterial = new THREE.MeshStandardMaterial({
  color: 0x94a3b8, // slate-400
  roughness: 0.25,
  metalness: 0.95,
});

const bookCoverColors = [0x991b1b, 0x1e3a8a, 0x065f46, 0x78350f, 0x581c87, 0xd97706];
const bookMaterials = bookCoverColors.map(color => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.7,
  metalness: 0.1,
}));

const pineFoliageMaterial = new THREE.MeshStandardMaterial({
  color: 0x14532d, // green-900
  roughness: 0.85,
  metalness: 0.05,
});

const waterMaterial = new THREE.MeshStandardMaterial({
  color: 0x0284c7, // sky-600
  transparent: true,
  opacity: 0.75,
  roughness: 0.1,
  metalness: 0.1,
});

const goldCoinsMaterial = new THREE.MeshStandardMaterial({
  color: 0xf59e0b, // amber-500
  roughness: 0.25,
  metalness: 0.95,
});

const leatherTentMaterial = new THREE.MeshStandardMaterial({
  color: 0x92400e, // amber-800
  roughness: 0.85,
  metalness: 0.05,
});

const boneSkeletonMaterial = new THREE.MeshStandardMaterial({
  color: 0xfef3c7, // amber-100
  roughness: 0.8,
  metalness: 0.05,
});

const amethystPortalMaterial = new THREE.MeshStandardMaterial({
  color: 0xa855f7, // purple-500
  emissive: 0x7e22ce,
  emissiveIntensity: 2.2,
  transparent: true,
  opacity: 0.75,
  roughness: 0.2,
  metalness: 0.3,
});

const crystalCyanMaterial = new THREE.MeshStandardMaterial({
  color: 0x38bdf8, // sky-400
  emissive: 0x0284c7,
  emissiveIntensity: 1.8,
  transparent: true,
  opacity: 0.85,
  roughness: 0.15,
  metalness: 0.4,
});

/**
 * Cria a malha procedural padrão de fallback caso nenhum modelo GLB customizado esteja disponível
 */
function buildProceduralMesh(block: BuildingBlock3D, segments: number, hScale: number): THREE.Group {
  const group = new THREE.Group();

  switch (block.type) {
    // --- PAREDE DE PEDRA PROCEDURAL (ESTICA SEM DISTORCER) ---
    case 'wall_stone': {
      const segmentWidth = 2.0;
      const totalWidth = segments * segmentWidth;
      const startX = -totalWidth / 2 + segmentWidth / 2;

      for (let s = 0; s < segments; s++) {
        const segX = startX + s * segmentWidth;
        const segGroup = new THREE.Group();
        segGroup.position.x = segX;

        // Corpo da parede do segmento
        const wallGeo = new THREE.BoxGeometry(1.92, 2.8 * hScale, 0.5);
        const wallMesh = new THREE.Mesh(wallGeo, stoneMaterial);
        wallMesh.position.y = (1.4 * hScale);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        segGroup.add(wallMesh);

        // Topo esculpido
        const capGeo = new THREE.BoxGeometry(2.0, 0.15 * hScale, 0.6);
        const capMesh = new THREE.Mesh(capGeo, stoneTrimMaterial);
        capMesh.position.y = (2.85 * hScale);
        capMesh.castShadow = true;
        capMesh.receiveShadow = true;
        segGroup.add(capMesh);

        // Pilar de junção entre segmentos para design perfeito estilo Unreal/Blender
        if (s > 0) {
          const jointGeo = new THREE.BoxGeometry(0.2, 2.9 * hScale, 0.56);
          const jointMesh = new THREE.Mesh(jointGeo, stoneTrimMaterial);
          jointMesh.position.set(-segmentWidth / 2, (1.45 * hScale), 0);
          jointMesh.castShadow = true;
          segGroup.add(jointMesh);
        }

        group.add(segGroup);
      }
      break;
    }

    // --- PAREDE DE MADEIRA PROCEDURAL ---
    case 'wall_wood': {
      const segmentWidth = 2.0;
      const totalWidth = segments * segmentWidth;
      const startX = -totalWidth / 2 + segmentWidth / 2;

      for (let s = 0; s < segments; s++) {
        const segX = startX + s * segmentWidth;
        const segGroup = new THREE.Group();
        segGroup.position.x = segX;

        const woodGeo = new THREE.BoxGeometry(1.92, 2.8 * hScale, 0.35);
        const woodMesh = new THREE.Mesh(woodGeo, woodMaterial);
        woodMesh.position.y = 1.4 * hScale;
        woodMesh.castShadow = true;
        woodMesh.receiveShadow = true;
        segGroup.add(woodMesh);

        // Travessas de ferro de reforço
        for (const y of [0.6 * hScale, 2.2 * hScale]) {
          const bandGeo = new THREE.BoxGeometry(1.98, 0.1 * hScale, 0.38);
          const bandMesh = new THREE.Mesh(bandGeo, ironMaterial);
          bandMesh.position.y = y;
          segGroup.add(bandMesh);
        }

        group.add(segGroup);
      }
      break;
    }

    // --- MURETA / BARRICADA PROCEDURAL ---
    case 'half_wall': {
      const segmentWidth = 2.0;
      const totalWidth = segments * segmentWidth;
      const startX = -totalWidth / 2 + segmentWidth / 2;

      for (let s = 0; s < segments; s++) {
        const segX = startX + s * segmentWidth;
        const segGroup = new THREE.Group();
        segGroup.position.x = segX;

        const halfGeo = new THREE.BoxGeometry(1.92, 1.2 * hScale, 0.45);
        const halfMesh = new THREE.Mesh(halfGeo, stoneMaterial);
        halfMesh.position.y = 0.6 * hScale;
        halfMesh.castShadow = true;
        halfMesh.receiveShadow = true;
        segGroup.add(halfMesh);

        group.add(segGroup);
      }
      break;
    }

    case 'pillar_round': {
      const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.2 * hScale, 16);
      const pillarMesh = new THREE.Mesh(pillarGeo, stoneMaterial);
      pillarMesh.position.y = 1.6 * hScale;
      pillarMesh.castShadow = true;
      pillarMesh.receiveShadow = true;
      group.add(pillarMesh);

      const baseGeo = new THREE.BoxGeometry(1.2, 0.25 * hScale, 1.2);
      const baseMesh = new THREE.Mesh(baseGeo, stoneTrimMaterial);
      baseMesh.position.y = 0.125 * hScale;
      baseMesh.castShadow = true;
      group.add(baseMesh);

      const capMesh = new THREE.Mesh(baseGeo, stoneTrimMaterial);
      capMesh.position.y = 3.1 * hScale;
      capMesh.castShadow = true;
      group.add(capMesh);
      break;
    }

    case 'pillar_square': {
      const colGeo = new THREE.BoxGeometry(1.2, 3.0 * hScale, 1.2);
      const colMesh = new THREE.Mesh(colGeo, stoneMaterial);
      colMesh.position.y = 1.5 * hScale;
      colMesh.castShadow = true;
      colMesh.receiveShadow = true;
      group.add(colMesh);
      break;
    }

    case 'pillar_broken': {
      // Base da coluna quebrada
      const baseGeo = new THREE.BoxGeometry(1.3, 0.25 * hScale, 1.3);
      const baseMesh = new THREE.Mesh(baseGeo, stoneTrimMaterial);
      baseMesh.position.y = 0.125 * hScale;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // Fuste quebrado chanfrado
      const brokenGeo = new THREE.CylinderGeometry(0.48, 0.5, 1.5 * hScale, 14);
      const brokenMesh = new THREE.Mesh(brokenGeo, mossStoneMaterial);
      brokenMesh.position.y = 0.88 * hScale;
      brokenMesh.rotation.z = 0.05;
      brokenMesh.castShadow = true;
      brokenMesh.receiveShadow = true;
      group.add(brokenMesh);

      // Blocos e escombros caídos no chão
      const rubblePositions = [
        { x: 0.5, y: 0.15, z: 0.4, r: 0.25, rot: 0.4 },
        { x: -0.45, y: 0.12, z: 0.35, r: 0.2, rot: -0.6 },
        { x: 0.2, y: 0.18, z: -0.5, r: 0.28, rot: 0.9 },
      ];
      rubblePositions.forEach(rb => {
        const rbGeo = new THREE.DodecahedronGeometry(rb.r);
        const rbMesh = new THREE.Mesh(rbGeo, stoneMaterial);
        rbMesh.position.set(rb.x, rb.y * hScale, rb.z);
        rbMesh.rotation.set(rb.rot, rb.rot * 1.5, 0);
        rbMesh.castShadow = true;
        group.add(rbMesh);
      });
      break;
    }

    case 'door_wood': {
      const postGeo = new THREE.BoxGeometry(0.25, 2.8 * hScale, 1.0);
      const leftPost = new THREE.Mesh(postGeo, stoneTrimMaterial);
      leftPost.position.set(-0.9, 1.4 * hScale, 0);
      leftPost.castShadow = true;
      group.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, stoneTrimMaterial);
      rightPost.position.set(0.9, 1.4 * hScale, 0);
      rightPost.castShadow = true;
      group.add(rightPost);

      const headerGeo = new THREE.BoxGeometry(2.0, 0.25 * hScale, 1.0);
      const headerMesh = new THREE.Mesh(headerGeo, stoneTrimMaterial);
      headerMesh.position.set(0, 2.7 * hScale, 0);
      headerMesh.castShadow = true;
      group.add(headerMesh);

      const doorPivot = new THREE.Group();
      doorPivot.name = 'doorPivot';
      doorPivot.position.set(-0.8, 0, 0);

      const doorLeafGeo = new THREE.BoxGeometry(1.6, 2.5 * hScale, 0.75);
      const doorLeaf = new THREE.Mesh(doorLeafGeo, woodMaterial);
      doorLeaf.position.set(0.8, 1.3 * hScale, 0);
      doorLeaf.castShadow = true;
      doorLeaf.receiveShadow = true;
      doorPivot.add(doorLeaf);

      const knobGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const knob = new THREE.Mesh(knobGeo, goldTrimMaterial);
      knob.position.set(1.45, 1.25 * hScale, 0.42);
      doorPivot.add(knob);

      if (block.state === 'open') {
        doorPivot.rotation.y = -Math.PI / 2;
      }
      group.add(doorPivot);
      break;
    }

    case 'door_double_wood': {
      // Portão Duplo de Carvalho com batentes maciços (Largura 4.0, 2 Células)
      const postGeo = new THREE.BoxGeometry(0.35, 3.2 * hScale, 1.0);
      const leftPost = new THREE.Mesh(postGeo, stoneTrimMaterial);
      leftPost.position.set(-1.85, 1.6 * hScale, 0);
      leftPost.castShadow = true;
      group.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, stoneTrimMaterial);
      rightPost.position.set(1.85, 1.6 * hScale, 0);
      rightPost.castShadow = true;
      group.add(rightPost);

      const headerGeo = new THREE.BoxGeometry(4.0, 0.35 * hScale, 1.0);
      const headerMesh = new THREE.Mesh(headerGeo, stoneTrimMaterial);
      headerMesh.position.set(0, 3.025 * hScale, 0);
      headerMesh.castShadow = true;
      group.add(headerMesh);

      // Folha Esquerda (Abre girando no pivot esquerdo)
      const leftPivot = new THREE.Group();
      leftPivot.name = 'doorPivotLeft';
      leftPivot.position.set(-1.7, 0, 0);

      const leafGeo = new THREE.BoxGeometry(1.68, 2.8 * hScale, 0.75);
      const leftLeaf = new THREE.Mesh(leafGeo, darkWoodMaterial);
      leftLeaf.position.set(0.84, 1.45 * hScale, 0);
      leftLeaf.castShadow = true;
      leftLeaf.receiveShadow = true;
      leftPivot.add(leftLeaf);

      // Faixas de ferro forjado
      for (const y of [0.6 * hScale, 2.2 * hScale]) {
        const ironBandGeo = new THREE.BoxGeometry(1.7, 0.14 * hScale, 0.8);
        const ironBand = new THREE.Mesh(ironBandGeo, ironMaterial);
        ironBand.position.set(0.84, y, 0);
        leftPivot.add(ironBand);
      }

      // Aldrava de ferro esquerda
      const ringGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 16);
      const leftRing = new THREE.Mesh(ringGeo, ironMaterial);
      leftRing.position.set(1.4, 1.4 * hScale, 0.44);
      leftPivot.add(leftRing);

      if (block.state === 'open') {
        leftPivot.rotation.y = Math.PI / 2;
      }
      group.add(leftPivot);

      // Folha Direita (Abre girando no pivot direito)
      const rightPivot = new THREE.Group();
      rightPivot.name = 'doorPivotRight';
      rightPivot.position.set(1.7, 0, 0);

      const rightLeaf = new THREE.Mesh(leafGeo, darkWoodMaterial);
      rightLeaf.position.set(-0.84, 1.45 * hScale, 0);
      rightLeaf.castShadow = true;
      rightLeaf.receiveShadow = true;
      rightPivot.add(rightLeaf);

      for (const y of [0.6 * hScale, 2.2 * hScale]) {
        const ironBandGeo = new THREE.BoxGeometry(1.7, 0.14 * hScale, 0.8);
        const ironBand = new THREE.Mesh(ironBandGeo, ironMaterial);
        ironBand.position.set(-0.84, y, 0);
        rightPivot.add(ironBand);
      }

      const rightRing = new THREE.Mesh(ringGeo, ironMaterial);
      rightRing.position.set(-1.4, 1.4 * hScale, 0.44);
      rightPivot.add(rightRing);

      if (block.state === 'open') {
        rightPivot.rotation.y = -Math.PI / 2;
      }
      group.add(rightPivot);
      break;
    }

    case 'door_stone': {
      // Porta de Pedra Maciça com Runas Arcanas
      const frameGeo = new THREE.BoxGeometry(0.28, 2.8 * hScale, 1.0);
      const leftFrame = new THREE.Mesh(frameGeo, stoneTrimMaterial);
      leftFrame.position.set(-0.88, 1.4 * hScale, 0);
      leftFrame.castShadow = true;
      group.add(leftFrame);

      const rightFrame = new THREE.Mesh(frameGeo, stoneTrimMaterial);
      rightFrame.position.set(0.88, 1.4 * hScale, 0);
      rightFrame.castShadow = true;
      group.add(rightFrame);

      const topFrameGeo = new THREE.BoxGeometry(2.0, 0.35 * hScale, 1.0);
      const topFrame = new THREE.Mesh(topFrameGeo, stoneTrimMaterial);
      topFrame.position.set(0, 2.65 * hScale, 0);
      topFrame.castShadow = true;
      group.add(topFrame);

      // Pivot da laje de pedra
      const stonePivot = new THREE.Group();
      stonePivot.name = 'doorPivot';
      stonePivot.position.set(-0.75, 0, 0);

      const slabGeo = new THREE.BoxGeometry(1.5, 2.45 * hScale, 0.78);
      const stoneSlab = new THREE.Mesh(slabGeo, mossStoneMaterial);
      stoneSlab.position.set(0.75, 1.25 * hScale, 0);
      stoneSlab.castShadow = true;
      stoneSlab.receiveShadow = true;
      stonePivot.add(stoneSlab);

      // Glifo rúnico luminoso central
      const runePlateGeo = new THREE.BoxGeometry(0.45, 0.45 * hScale, 0.82);
      const runePlate = new THREE.Mesh(runePlateGeo, arcaneGlowMaterial);
      runePlate.position.set(0.75, 1.4 * hScale, 0);
      stonePivot.add(runePlate);

      // Argola de puxar de ferro forjado
      const ringGeo = new THREE.TorusGeometry(0.14, 0.04, 8, 16);
      const pullRing = new THREE.Mesh(ringGeo, ironMaterial);
      pullRing.position.set(1.2, 1.2 * hScale, 0.44);
      stonePivot.add(pullRing);

      if (block.state === 'open') {
        stonePivot.rotation.y = -Math.PI / 2;
      }
      group.add(stonePivot);
      break;
    }

    case 'door_arch': {
      // Porta com Moldura em Arco Gótico / Ogival
      const colGeo = new THREE.BoxGeometry(0.28, 2.2 * hScale, 1.0);
      const leftCol = new THREE.Mesh(colGeo, stoneTrimMaterial);
      leftCol.position.set(-0.88, 1.1 * hScale, 0);
      leftCol.castShadow = true;
      group.add(leftCol);

      const rightCol = new THREE.Mesh(colGeo, stoneTrimMaterial);
      rightCol.position.set(0.88, 1.1 * hScale, 0);
      rightCol.castShadow = true;
      group.add(rightCol);

      // Arco superior de pedra
      const archCrownGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.0, 16, 1, false, 0, Math.PI);
      const archCrown = new THREE.Mesh(archCrownGeo, stoneTrimMaterial);
      archCrown.rotation.z = Math.PI / 2;
      archCrown.rotation.y = Math.PI / 2;
      archCrown.position.set(0, 2.2 * hScale, 0);
      archCrown.castShadow = true;
      group.add(archCrown);

      // Clave de abóbada (Keystone no topo do arco)
      const keystoneGeo = new THREE.BoxGeometry(0.4, 0.45 * hScale, 1.08);
      const keystone = new THREE.Mesh(keystoneGeo, goldTrimMaterial);
      keystone.position.set(0, 3.1 * hScale, 0);
      keystone.castShadow = true;
      group.add(keystone);

      // Pivot da folha de madeira em arco
      const archDoorPivot = new THREE.Group();
      archDoorPivot.name = 'doorPivot';
      archDoorPivot.position.set(-0.75, 0, 0);

      const doorBodyGeo = new THREE.BoxGeometry(1.5, 2.2 * hScale, 0.75);
      const doorBody = new THREE.Mesh(doorBodyGeo, woodMaterial);
      doorBody.position.set(0.75, 1.1 * hScale, 0);
      doorBody.castShadow = true;
      doorBody.receiveShadow = true;
      archDoorPivot.add(doorBody);

      // Topo curvo da folha
      const doorTopGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.75, 16, 1, false, 0, Math.PI);
      const doorTop = new THREE.Mesh(doorTopGeo, woodMaterial);
      doorTop.rotation.z = Math.PI / 2;
      doorTop.rotation.y = Math.PI / 2;
      doorTop.position.set(0.75, 2.2 * hScale, 0);
      doorTop.castShadow = true;
      doorTop.receiveShadow = true;
      archDoorPivot.add(doorTop);

      // Cravos de ferro
      const studGeo = new THREE.SphereGeometry(0.04, 6, 6);
      for (let sy = 0.4; sy <= 2.0; sy += 0.5) {
        for (let sx = 0.3; sx <= 1.2; sx += 0.4) {
          const stud = new THREE.Mesh(studGeo, ironMaterial);
          stud.position.set(sx, sy * hScale, 0.4);
          archDoorPivot.add(stud);
        }
      }

      // Maçaneta de latão
      const knobGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const knob = new THREE.Mesh(knobGeo, goldTrimMaterial);
      knob.position.set(1.3, 1.2 * hScale, 0.42);
      archDoorPivot.add(knob);

      if (block.state === 'open') {
        archDoorPivot.rotation.y = -Math.PI / 2;
      }
      group.add(archDoorPivot);
      break;
    }

    case 'archway_stone': {
      // Portal / Arco de Pedra Aberto (Passagem livre entre salas)
      const colGeo = new THREE.BoxGeometry(0.35, 2.3 * hScale, 1.0);
      const leftCol = new THREE.Mesh(colGeo, stoneTrimMaterial);
      leftCol.position.set(-0.85, 1.15 * hScale, 0);
      leftCol.castShadow = true;
      group.add(leftCol);

      const rightCol = new THREE.Mesh(colGeo, stoneTrimMaterial);
      rightCol.position.set(0.85, 1.15 * hScale, 0);
      rightCol.castShadow = true;
      group.add(rightCol);

      // Capitéis dos pilares
      const capGeo = new THREE.BoxGeometry(0.45, 0.18 * hScale, 1.08);
      const leftCap = new THREE.Mesh(capGeo, stoneMaterial);
      leftCap.position.set(-0.85, 2.3 * hScale, 0);
      group.add(leftCap);

      const rightCap = new THREE.Mesh(capGeo, stoneMaterial);
      rightCap.position.set(0.85, 2.3 * hScale, 0);
      group.add(rightCap);

      // Arco de abóbada
      const archGeo = new THREE.CylinderGeometry(1.0, 1.0, 1.0, 16, 1, false, 0, Math.PI);
      const arch = new THREE.Mesh(archGeo, stoneTrimMaterial);
      arch.rotation.z = Math.PI / 2;
      arch.rotation.y = Math.PI / 2;
      arch.position.set(0, 2.3 * hScale, 0);
      arch.castShadow = true;
      group.add(arch);

      // Clave de topo saliente
      const keystoneGeo = new THREE.BoxGeometry(0.4, 0.48 * hScale, 1.12);
      const keystone = new THREE.Mesh(keystoneGeo, stoneMaterial);
      keystone.position.set(0, 3.25 * hScale, 0);
      keystone.castShadow = true;
      group.add(keystone);
      break;
    }

    case 'portcullis_iron': {
      // Grade / Rastrilho Levadiço de Ferro de Masmorra
      const frameGeo = new THREE.BoxGeometry(0.3, 3.0 * hScale, 0.9);
      const leftFrame = new THREE.Mesh(frameGeo, stoneTrimMaterial);
      leftFrame.position.set(-0.88, 1.5 * hScale, 0);
      leftFrame.castShadow = true;
      group.add(leftFrame);

      const rightFrame = new THREE.Mesh(frameGeo, stoneTrimMaterial);
      rightFrame.position.set(0.88, 1.5 * hScale, 0);
      rightFrame.castShadow = true;
      group.add(rightFrame);

      const topFrameGeo = new THREE.BoxGeometry(2.0, 0.35 * hScale, 0.9);
      const topFrame = new THREE.Mesh(topFrameGeo, stoneTrimMaterial);
      topFrame.position.set(0, 2.85 * hScale, 0);
      topFrame.castShadow = true;
      group.add(topFrame);

      // Grade levadiça (Grupo que sobe quando aberta)
      const gateGroup = new THREE.Group();
      gateGroup.name = 'doorPivot';

      // Barras Verticais com pontas inferiores
      const barCount = 5;
      const barSpacing = 1.5 / (barCount - 1);
      for (let i = 0; i < barCount; i++) {
        const bx = -0.75 + i * barSpacing;
        const barGeo = new THREE.CylinderGeometry(0.055, 0.055, 2.4 * hScale, 8);
        const bar = new THREE.Mesh(barGeo, ironMaterial);
        bar.position.set(bx, 1.35 * hScale, 0);
        bar.castShadow = true;
        gateGroup.add(bar);

        // Ponta em cone na base da barra
        const spikeGeo = new THREE.ConeGeometry(0.09, 0.3 * hScale, 8);
        const spike = new THREE.Mesh(spikeGeo, ironMaterial);
        spike.rotation.x = Math.PI;
        spike.position.set(bx, 0.1 * hScale, 0);
        gateGroup.add(spike);
      }

      // Travessas Horizontais
      for (const hy of [0.7 * hScale, 1.5 * hScale, 2.3 * hScale]) {
        const hBarGeo = new THREE.BoxGeometry(1.55, 0.1 * hScale, 0.22);
        const hBar = new THREE.Mesh(hBarGeo, ironMaterial);
        hBar.position.set(0, hy, 0);
        gateGroup.add(hBar);
      }

      // Se aberta, a grade sobe verticalmente
      if (block.state === 'open') {
        gateGroup.position.y = 2.0 * hScale;
      }
      group.add(gateGroup);
      break;
    }

    case 'jail_bars': {
      // Grade de Cela Procedural (Estica sem distorcer)
      const segmentWidth = 2.0;
      const totalWidth = segments * segmentWidth;
      const startX = -totalWidth / 2 + segmentWidth / 2;

      for (let s = 0; s < segments; s++) {
        const segX = startX + s * segmentWidth;
        const segGroup = new THREE.Group();
        segGroup.position.x = segX;

        // Viga de base e viga de topo
        const beamGeo = new THREE.BoxGeometry(1.95, 0.15 * hScale, 0.4);
        const baseBeam = new THREE.Mesh(beamGeo, ironMaterial);
        baseBeam.position.y = 0.08 * hScale;
        baseBeam.castShadow = true;
        segGroup.add(baseBeam);

        const topBeam = new THREE.Mesh(beamGeo, ironMaterial);
        topBeam.position.y = 2.72 * hScale;
        topBeam.castShadow = true;
        segGroup.add(topBeam);

        // Barras verticais da cela
        const barCount = 7;
        const barSpacing = 1.8 / (barCount - 1);
        for (let i = 0; i < barCount; i++) {
          const bx = -0.9 + i * barSpacing;
          const barGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.5 * hScale, 8);
          const bar = new THREE.Mesh(barGeo, ironMaterial);
          bar.position.set(bx, 1.4 * hScale, 0);
          bar.castShadow = true;
          segGroup.add(bar);
        }

        // Travessa horizontal intermediária com rebites
        const midBeamGeo = new THREE.BoxGeometry(1.95, 0.08 * hScale, 0.15);
        const midBeam = new THREE.Mesh(midBeamGeo, ironMaterial);
        midBeam.position.y = 1.4 * hScale;
        segGroup.add(midBeam);

        group.add(segGroup);
      }
      break;
    }

    case 'stairs': {
      const steps = 5;
      const stepWidth = 1.95;
      const stepDepth = 2.0 / steps;
      const stepHeight = (1.5 * hScale) / steps;

      for (let i = 0; i < steps; i++) {
        const h = stepHeight * (i + 1);
        const stepGeo = new THREE.BoxGeometry(stepWidth, h, stepDepth);
        const stepMesh = new THREE.Mesh(stepGeo, stoneMaterial);
        stepMesh.position.set(0, h / 2, -1.0 + (i * stepDepth) + stepDepth / 2);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        group.add(stepMesh);
      }
      break;
    }

    // --- FONTES DE LUZ MEDIEVAIS ---

    case 'candle': {
      // Pequena vela de cera com chama
      const candleGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8);
      const candleMesh = new THREE.Mesh(candleGeo, waxMaterial);
      candleMesh.position.y = 0.175;
      candleMesh.castShadow = true;
      group.add(candleMesh);

      // Pavio
      const wickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6);
      const wick = new THREE.Mesh(wickGeo, ironMaterial);
      wick.position.y = 0.38;
      group.add(wick);

      // Chama
      const flameGeo = new THREE.ConeGeometry(0.06, 0.16, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.44;
      group.add(flame);
      break;
    }

    case 'torch_standing': {
      // Suporte de chão de ferro com tocha cravada
      const standGeo = new THREE.CylinderGeometry(0.2, 0.35, 0.1, 8);
      const stand = new THREE.Mesh(standGeo, ironMaterial);
      stand.position.y = 0.05;
      stand.castShadow = true;
      group.add(stand);

      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8);
      const pole = new THREE.Mesh(poleGeo, woodMaterial);
      pole.position.y = 0.75;
      pole.castShadow = true;
      group.add(pole);

      const cupGeo = new THREE.CylinderGeometry(0.14, 0.08, 0.25, 8);
      const cup = new THREE.Mesh(cupGeo, ironMaterial);
      cup.position.y = 1.45;
      group.add(cup);

      const flameGeo = new THREE.ConeGeometry(0.18, 0.45, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 1.7;
      group.add(flame);
      break;
    }

    case 'torch_wall': {
      // Arandela de parede medieval de ferro forjado (Encosta perfeitamente na face da parede em z = 0.25)
      const mountPlateGeo = new THREE.BoxGeometry(0.2, 0.55 * hScale, 0.06);
      const mountPlate = new THREE.Mesh(mountPlateGeo, ironMaterial);
      mountPlate.position.set(0, 1.5 * hScale, 0.28);
      mountPlate.castShadow = true;
      group.add(mountPlate);

      // Haste horizontal curvada para frente
      const armGeo = new THREE.BoxGeometry(0.08, 0.08 * hScale, 0.36);
      const arm = new THREE.Mesh(armGeo, ironMaterial);
      arm.position.set(0, 1.35 * hScale, 0.46);
      arm.castShadow = true;
      group.add(arm);

      // Aro / Anel de sustentação da tocha
      const ringSconceGeo = new THREE.CylinderGeometry(0.14, 0.08, 0.22, 8);
      const ringSconce = new THREE.Mesh(ringSconceGeo, ironMaterial);
      ringSconce.position.set(0, 1.45 * hScale, 0.64);
      ringSconce.castShadow = true;
      group.add(ringSconce);

      // Cabo de madeira da tocha
      const sconceGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8);
      const sconce = new THREE.Mesh(sconceGeo, woodMaterial);
      sconce.rotation.x = Math.PI / 12;
      sconce.position.set(0, 1.7 * hScale, 0.66);
      sconce.castShadow = true;
      group.add(sconce);

      // Chama ardente da tocha de parede
      const flameGeo = new THREE.ConeGeometry(0.18, 0.45, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 2.05 * hScale, 0.7);
      group.add(flame);
      break;
    }

    case 'candelabra': {
      // Castiçal de Prata ornamentado com 3 braços
      const baseGeo = new THREE.CylinderGeometry(0.05, 0.25, 0.15, 12);
      const base = new THREE.Mesh(baseGeo, silverMaterial);
      base.position.y = 0.075;
      base.castShadow = true;
      group.add(base);

      const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
      const stem = new THREE.Mesh(stemGeo, silverMaterial);
      stem.position.y = 0.5;
      stem.castShadow = true;
      group.add(stem);

      // Braço transversal
      const armGeo = new THREE.BoxGeometry(0.7, 0.04, 0.04);
      const arm = new THREE.Mesh(armGeo, silverMaterial);
      arm.position.y = 0.75;
      group.add(arm);

      // 3 Velas e chamas
      for (const x of [-0.3, 0, 0.3]) {
        const candleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
        const candleMesh = new THREE.Mesh(candleGeo, waxMaterial);
        candleMesh.position.set(x, 0.9, 0);
        group.add(candleMesh);

        const flameGeo = new THREE.ConeGeometry(0.05, 0.14, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(x, 1.08, 0);
        group.add(flame);
      }
      break;
    }

    case 'chandelier_candles': {
      // Lustre Medieval Circular de Ferro Forjado Suspenso com 6 Velas
      // 1. Argola / Gancho de suspensão superior no topo
      const hookGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
      const hook = new THREE.Mesh(hookGeo, ironMaterial);
      hook.position.y = 1.2 * hScale;
      hook.rotation.x = Math.PI / 2;
      group.add(hook);

      // Hub / Eixo central superior
      const hubGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
      const hub = new THREE.Mesh(hubGeo, brassMaterial);
      hub.position.y = 1.05 * hScale;
      group.add(hub);

      // 2. Correntes de ferro sustentando o anel principal
      const chainCount = 4;
      for (let i = 0; i < chainCount; i++) {
        const ang = (i / chainCount) * Math.PI * 2;
        const targetX = Math.cos(ang) * 0.7;
        const targetZ = Math.sin(ang) * 0.7;
        
        const chainGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.15 * hScale, 6);
        const chain = new THREE.Mesh(chainGeo, ironMaterial);
        
        // Posição intermediária e orientação inclinada do hub até o anel
        chain.position.set(targetX * 0.5, 0.55 * hScale, targetZ * 0.5);
        chain.lookAt(new THREE.Vector3(targetX, 0, targetZ));
        chain.rotateX(Math.PI / 2);
        group.add(chain);
      }

      // 3. Aro / Roda circular principal de ferro forjado
      const ringGeo = new THREE.TorusGeometry(0.7, 0.045, 12, 32);
      const ring = new THREE.Mesh(ringGeo, ironMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.0;
      ring.castShadow = true;
      group.add(ring);

      // Aro decorativo interno de madeira escura / latão
      const innerRingGeo = new THREE.TorusGeometry(0.66, 0.02, 8, 24);
      const innerRing = new THREE.Mesh(innerRingGeo, goldTrimMaterial);
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.y = 0.0;
      group.add(innerRing);

      // Braços transversais de reforço em cruz (Spokes radiais)
      for (let i = 0; i < 2; i++) {
        const spokeGeo = new THREE.BoxGeometry(1.4, 0.035 * hScale, 0.045);
        const spoke = new THREE.Mesh(spokeGeo, ironMaterial);
        spoke.rotation.y = (i * Math.PI) / 2;
        spoke.position.y = 0.0;
        group.add(spoke);
      }

      // Pingente inferior central decorativo (Finial)
      const finialGeo = new THREE.ConeGeometry(0.1, 0.35 * hScale, 8);
      const finial = new THREE.Mesh(finialGeo, brassMaterial);
      finial.rotation.x = Math.PI;
      finial.position.y = -0.2 * hScale;
      group.add(finial);

      // 4. 6 Pratos de gotejamento de cera (Bobeches), Velas de cera e Chamas cintilantes
      const candleCount = 6;
      for (let i = 0; i < candleCount; i++) {
        const ang = (i / candleCount) * Math.PI * 2;
        const cx = Math.cos(ang) * 0.7;
        const cz = Math.sin(ang) * 0.7;

        // Prato / Suporte de metal da vela
        const plateGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.05 * hScale, 10);
        const plate = new THREE.Mesh(plateGeo, brassMaterial);
        plate.position.set(cx, 0.03 * hScale, cz);
        plate.castShadow = true;
        group.add(plate);

        // Vela cilíndrica de cera de abelha
        const candleGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.35 * hScale, 8);
        const candleMesh = new THREE.Mesh(candleGeo, waxMaterial);
        candleMesh.position.set(cx, 0.22 * hScale, cz);
        candleMesh.castShadow = true;
        group.add(candleMesh);

        // Pavio da vela
        const wickGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.06 * hScale, 4);
        const wick = new THREE.Mesh(wickGeo, ironMaterial);
        wick.position.set(cx, 0.41 * hScale, cz);
        group.add(wick);

        // Chama cônica incandescente da vela
        const flameGeo = new THREE.ConeGeometry(0.065, 0.18 * hScale, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(cx, 0.5 * hScale, cz);
        group.add(flame);
      }
      break;
    }

    case 'oil_lamp': {
      // Lampião de Latão com redoma de vidro
      const lampBaseGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.2, 12);
      const lampBase = new THREE.Mesh(lampBaseGeo, brassMaterial);
      lampBase.position.y = 0.1;
      lampBase.castShadow = true;
      group.add(lampBase);

      const glassGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 12);
      const glassMesh = new THREE.Mesh(glassGeo, glassMaterial);
      glassMesh.position.y = 0.4;
      group.add(glassMesh);

      const capGeo = new THREE.ConeGeometry(0.22, 0.18, 12);
      const capMesh = new THREE.Mesh(capGeo, brassMaterial);
      capMesh.position.y = 0.68;
      group.add(capMesh);

      const flameGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffdd44 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.38;
      group.add(flame);
      break;
    }

    case 'lantern_medieval': {
      // Lanterna medieval de ferro com grade
      const cageGeo = new THREE.BoxGeometry(0.4, 0.55, 0.4);
      const cageMesh = new THREE.Mesh(cageGeo, ironMaterial);
      cageMesh.position.y = 0.35;
      cageMesh.castShadow = true;
      group.add(cageMesh);

      const topGeo = new THREE.ConeGeometry(0.28, 0.25, 4);
      const topMesh = new THREE.Mesh(topGeo, ironMaterial);
      topMesh.rotation.y = Math.PI / 4;
      topMesh.position.y = 0.72;
      group.add(topMesh);

      const flameGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffbb22 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.35;
      group.add(flame);
      break;
    }

    case 'brazier': {
      // Grande Braseiro Imperial de Ferro Fundido
      const tripod = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8);
        const leg = new THREE.Mesh(legGeo, ironMaterial);
        leg.rotation.z = Math.PI / 8;
        leg.rotation.y = ang;
        leg.position.set(Math.cos(ang) * 0.4, 0.45, Math.sin(ang) * 0.4);
        leg.castShadow = true;
        tripod.add(leg);
      }
      group.add(tripod);

      const basinGeo = new THREE.CylinderGeometry(0.65, 0.35, 0.35, 14);
      const basin = new THREE.Mesh(basinGeo, ironMaterial);
      basin.position.y = 0.95;
      basin.castShadow = true;
      group.add(basin);

      // Carvão em brasa
      const coalGeo = new THREE.DodecahedronGeometry(0.45);
      const coalMat = new THREE.MeshStandardMaterial({
        color: 0x262626,
        emissive: 0xff3300,
        emissiveIntensity: 1.5,
      });
      const coal = new THREE.Mesh(coalGeo, coalMat);
      coal.position.y = 1.05;
      group.add(coal);

      const flameGeo = new THREE.ConeGeometry(0.35, 0.7, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 1.35;
      group.add(flame);
      break;
    }

    case 'campfire': {
      const ringCount = 8;
      for (let i = 0; i < ringCount; i++) {
        const ang = (i / ringCount) * Math.PI * 2;
        const rockGeo = new THREE.DodecahedronGeometry(0.12);
        const rock = new THREE.Mesh(rockGeo, stoneMaterial);
        rock.position.set(Math.cos(ang) * 0.5, 0.08, Math.sin(ang) * 0.5);
        rock.castShadow = true;
        group.add(rock);
      }

      const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6);
      const log1 = new THREE.Mesh(logGeo, woodMaterial);
      log1.rotation.z = Math.PI / 4;
      log1.position.y = 0.15;
      group.add(log1);

      const log2 = new THREE.Mesh(logGeo, woodMaterial);
      log2.rotation.x = Math.PI / 4;
      log2.position.y = 0.15;
      group.add(log2);

      const flameGeo = new THREE.ConeGeometry(0.25, 0.6, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.35;
      group.add(flame);
      break;
    }

    case 'chest': {
      const chestBaseGeo = new THREE.BoxGeometry(1.1, 0.5, 0.7);
      const chestBase = new THREE.Mesh(chestBaseGeo, woodMaterial);
      chestBase.position.y = 0.25;
      chestBase.castShadow = true;
      chestBase.receiveShadow = true;
      group.add(chestBase);

      const lidGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 12, 1, false, 0, Math.PI);
      const lid = new THREE.Mesh(lidGeo, woodMaterial);
      lid.rotation.z = Math.PI / 2;
      lid.position.set(0, 0.5, 0);
      lid.castShadow = true;
      group.add(lid);

      const lockGeo = new THREE.BoxGeometry(0.12, 0.15, 0.08);
      const lock = new THREE.Mesh(lockGeo, goldTrimMaterial);
      lock.position.set(0, 0.45, 0.36);
      group.add(lock);
      break;
    }

    case 'barrel': {
      const barrelGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.1, 14);
      const barrel = new THREE.Mesh(barrelGeo, woodMaterial);
      barrel.position.y = 0.55;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      group.add(barrel);

      for (const y of [0.2, 0.55, 0.9]) {
        const ringGeo = new THREE.CylinderGeometry(0.44, 0.44, 0.06, 14);
        const ring = new THREE.Mesh(ringGeo, ironMaterial);
        ring.position.y = y;
        group.add(ring);
      }
      break;
    }

    case 'table_wood': {
      // Mesa Rústica de Taverna / Alquimia com pernas em X
      const topGeo = new THREE.BoxGeometry(2.4, 0.12 * hScale, 1.2);
      const topMesh = new THREE.Mesh(topGeo, woodMaterial);
      topMesh.position.y = 0.95 * hScale;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // Pernas em cavalete cruzado
      for (const legX of [-0.85, 0.85]) {
        const legGeo = new THREE.BoxGeometry(0.12, 1.0 * hScale, 0.12);
        
        const leg1 = new THREE.Mesh(legGeo, darkWoodMaterial);
        leg1.position.set(legX, 0.45 * hScale, 0);
        leg1.rotation.x = Math.PI / 8;
        leg1.castShadow = true;
        group.add(leg1);

        const leg2 = new THREE.Mesh(legGeo, darkWoodMaterial);
        leg2.position.set(legX, 0.45 * hScale, 0);
        leg2.rotation.x = -Math.PI / 8;
        leg2.castShadow = true;
        group.add(leg2);
      }

      // Travessa longitudinal inferior de reforço
      const beamGeo = new THREE.BoxGeometry(1.8, 0.1 * hScale, 0.1);
      const beam = new THREE.Mesh(beamGeo, darkWoodMaterial);
      beam.position.y = 0.3 * hScale;
      group.add(beam);
      break;
    }

    case 'throne_stone': {
      // Trono Real de Pedra com almofada de veludo carmesim
      const baseGeo = new THREE.BoxGeometry(1.6, 0.3 * hScale, 1.3);
      const baseMesh = new THREE.Mesh(baseGeo, stoneTrimMaterial);
      baseMesh.position.y = 0.15 * hScale;
      baseMesh.castShadow = true;
      group.add(baseMesh);

      // Assento
      const seatGeo = new THREE.BoxGeometry(1.2, 0.4 * hScale, 1.0);
      const seatMesh = new THREE.Mesh(seatGeo, stoneMaterial);
      seatMesh.position.set(0, 0.5 * hScale, -0.05);
      seatMesh.castShadow = true;
      group.add(seatMesh);

      // Almofada de veludo carmesim
      const cushionGeo = new THREE.BoxGeometry(0.95, 0.1 * hScale, 0.85);
      const cushion = new THREE.Mesh(cushionGeo, clothRedMaterial);
      cushion.position.set(0, 0.72 * hScale, -0.05);
      group.add(cushion);

      // Braços do trono
      for (const side of [-0.55, 0.55]) {
        const armGeo = new THREE.BoxGeometry(0.2, 0.45 * hScale, 0.9);
        const arm = new THREE.Mesh(armGeo, stoneTrimMaterial);
        arm.position.set(side, 0.9 * hScale, -0.05);
        arm.castShadow = true;
        group.add(arm);
      }

      // Encosto alto ogival com brasão esculpido
      const backGeo = new THREE.BoxGeometry(1.2, 1.6 * hScale, 0.25);
      const backMesh = new THREE.Mesh(backGeo, stoneMaterial);
      backMesh.position.set(0, 1.5 * hScale, -0.45);
      backMesh.castShadow = true;
      group.add(backMesh);

      // Brasão / ornamento dourado no topo do encosto
      const crestGeo = new THREE.ConeGeometry(0.3, 0.5 * hScale, 4);
      const crest = new THREE.Mesh(crestGeo, goldTrimMaterial);
      crest.rotation.y = Math.PI / 4;
      crest.position.set(0, 2.45 * hScale, -0.45);
      group.add(crest);
      break;
    }

    case 'altar_stone': {
      // Altar Ritualístico / Sagrado de Cantaria
      const step1Geo = new THREE.BoxGeometry(2.2, 0.2 * hScale, 1.3);
      const step1 = new THREE.Mesh(step1Geo, stoneTrimMaterial);
      step1.position.y = 0.1 * hScale;
      step1.castShadow = true;
      step1.receiveShadow = true;
      group.add(step1);

      const pillarPedGeo = new THREE.BoxGeometry(1.8, 0.65 * hScale, 0.9);
      const pillarPed = new THREE.Mesh(pillarPedGeo, stoneMaterial);
      pillarPed.position.y = 0.525 * hScale;
      pillarPed.castShadow = true;
      group.add(pillarPed);

      const slabGeo = new THREE.BoxGeometry(2.0, 0.2 * hScale, 1.1);
      const slab = new THREE.Mesh(slabGeo, stoneTrimMaterial);
      slab.position.y = 0.95 * hScale;
      slab.castShadow = true;
      group.add(slab);

      // Toalha ceremonial de veludo vermelho sobreposta
      const clothGeo = new THREE.BoxGeometry(1.0, 0.04 * hScale, 1.12);
      const cloth = new THREE.Mesh(clothGeo, clothRedMaterial);
      cloth.position.set(0, 1.06 * hScale, 0);
      group.add(cloth);

      // Cálice cerimonial de ouro sobre o altar
      const chaliceBaseGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.04, 8);
      const chaliceBase = new THREE.Mesh(chaliceBaseGeo, goldTrimMaterial);
      chaliceBase.position.set(0, 1.08 * hScale, 0);
      group.add(chaliceBase);

      const chaliceCupGeo = new THREE.CylinderGeometry(0.12, 0.04, 0.18, 8);
      const chaliceCup = new THREE.Mesh(chaliceCupGeo, goldTrimMaterial);
      chaliceCup.position.set(0, 1.2 * hScale, 0);
      group.add(chaliceCup);
      break;
    }

    case 'sarcophagus': {
      // Sarcófago de Cripta / Catacumbas
      const boxGeo = new THREE.BoxGeometry(1.2, 0.65 * hScale, 2.3);
      const boxMesh = new THREE.Mesh(boxGeo, stoneMaterial);
      boxMesh.position.y = 0.325 * hScale;
      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;
      group.add(boxMesh);

      // Tampa chanfrada esculpida
      const lidGeo = new THREE.BoxGeometry(1.3, 0.2 * hScale, 2.4);
      const lidMesh = new THREE.Mesh(lidGeo, stoneTrimMaterial);
      lidMesh.position.y = 0.75 * hScale;
      lidMesh.castShadow = true;
      group.add(lidMesh);

      // Relevo da efígie / cruz na tampa
      const crossVGeo = new THREE.BoxGeometry(0.18, 0.08 * hScale, 1.6);
      const crossV = new THREE.Mesh(crossVGeo, goldTrimMaterial);
      crossV.position.set(0, 0.86 * hScale, 0);
      group.add(crossV);

      const crossHGeo = new THREE.BoxGeometry(0.7, 0.08 * hScale, 0.18);
      const crossH = new THREE.Mesh(crossHGeo, goldTrimMaterial);
      crossH.position.set(0, 0.86 * hScale, 0.3);
      group.add(crossH);
      break;
    }

    case 'statue_knight': {
      // Estátua do Guardião / Cavaleiro em Pedra
      const pedGeo = new THREE.BoxGeometry(1.3, 0.6 * hScale, 1.3);
      const pedestal = new THREE.Mesh(pedGeo, stoneTrimMaterial);
      pedestal.position.y = 0.3 * hScale;
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      group.add(pedestal);

      // Pernas do cavaleiro
      const legGeo = new THREE.BoxGeometry(0.26, 0.9 * hScale, 0.28);
      const leftLeg = new THREE.Mesh(legGeo, stoneMaterial);
      leftLeg.position.set(-0.25, 1.05 * hScale, 0);
      leftLeg.castShadow = true;
      group.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, stoneMaterial);
      rightLeg.position.set(0.25, 1.05 * hScale, 0);
      rightLeg.castShadow = true;
      group.add(rightLeg);

      // Torso / Armadura peitoral
      const torsoGeo = new THREE.BoxGeometry(0.8, 0.85 * hScale, 0.45);
      const torso = new THREE.Mesh(torsoGeo, stoneMaterial);
      torso.position.set(0, 1.9 * hScale, 0);
      torso.castShadow = true;
      group.add(torso);

      // Cabeça / Elmo com visor
      const helmGeo = new THREE.BoxGeometry(0.4, 0.45 * hScale, 0.4);
      const helm = new THREE.Mesh(helmGeo, stoneTrimMaterial);
      helm.position.set(0, 2.55 * hScale, 0);
      helm.castShadow = true;
      group.add(helm);

      // Escudo heráldico no braço esquerdo
      const shieldGeo = new THREE.BoxGeometry(0.1, 1.1 * hScale, 0.6);
      const shield = new THREE.Mesh(shieldGeo, stoneTrimMaterial);
      shield.position.set(-0.55, 1.7 * hScale, 0.15);
      shield.castShadow = true;
      group.add(shield);

      // Espada grande fincada no chão entre as mãos
      const bladeGeo = new THREE.BoxGeometry(0.08, 1.8 * hScale, 0.12);
      const blade = new THREE.Mesh(bladeGeo, stoneMaterial);
      blade.position.set(0.35, 1.5 * hScale, 0.2);
      blade.castShadow = true;
      group.add(blade);
      break;
    }

    case 'bookshelf': {
      // Estante de Grimórios Arcanos (Madeira com prateleiras cheias de tomos coloridos)
      const frameGeo = new THREE.BoxGeometry(2.0, 2.6 * hScale, 0.6);
      const backMesh = new THREE.Mesh(frameGeo, darkWoodMaterial);
      backMesh.position.set(0, 1.3 * hScale, 0);
      backMesh.castShadow = true;
      backMesh.receiveShadow = true;
      group.add(backMesh);

      // 4 Prateleiras com livros
      const shelfYPositions = [0.4, 1.0, 1.6, 2.2];
      shelfYPositions.forEach((sy, sIdx) => {
        const shelfGeo = new THREE.BoxGeometry(1.85, 0.08 * hScale, 0.55);
        const shelf = new THREE.Mesh(shelfGeo, woodMaterial);
        shelf.position.set(0, sy * hScale, 0.05);
        group.add(shelf);

        // Fileira de livros proceduralmente variados
        const numBooks = 8;
        for (let b = 0; b < numBooks; b++) {
          const bx = -0.75 + b * 0.22;
          const bh = (0.35 + (b % 3) * 0.08) * hScale;
          const bd = 0.35 + (b % 2) * 0.06;
          const bookMat = bookMaterials[(sIdx + b) % bookMaterials.length];
          const bookGeo = new THREE.BoxGeometry(0.16, bh, bd);
          const bookMesh = new THREE.Mesh(bookGeo, bookMat);
          bookMesh.position.set(bx, (sy + bh / 2 + 0.04) * hScale, 0.1);
          bookMesh.castShadow = true;
          group.add(bookMesh);
        }
      });
      break;
    }

    case 'cauldron': {
      // Caldeirão Mágico Borbulhante com líquido esmeralda arcano
      const potGeo = new THREE.SphereGeometry(0.55, 14, 12);
      const pot = new THREE.Mesh(potGeo, ironMaterial);
      pot.position.y = 0.7 * hScale;
      pot.castShadow = true;
      group.add(pot);

      // Borda superior
      const rimGeo = new THREE.TorusGeometry(0.45, 0.08, 8, 16);
      const rim = new THREE.Mesh(rimGeo, ironMaterial);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 1.05 * hScale;
      group.add(rim);

      // Poção líquida brilhante
      const liquidGeo = new THREE.CircleGeometry(0.42, 16);
      const liquid = new THREE.Mesh(liquidGeo, emeraldGlowMaterial);
      liquid.rotation.x = -Math.PI / 2;
      liquid.position.y = 0.98 * hScale;
      group.add(liquid);

      // 3 Pernas de sustentação de ferro
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6 * hScale, 6);
        const leg = new THREE.Mesh(legGeo, ironMaterial);
        leg.rotation.z = Math.PI / 7;
        leg.rotation.y = ang;
        leg.position.set(Math.cos(ang) * 0.35, 0.28 * hScale, Math.sin(ang) * 0.35);
        leg.castShadow = true;
        group.add(leg);
      }
      break;
    }

    case 'weapon_rack': {
      // Suporte de Armas Medieval de Carvalho com espadas e lanças
      const rackBaseGeo = new THREE.BoxGeometry(2.0, 0.15 * hScale, 0.6);
      const rackBase = new THREE.Mesh(rackBaseGeo, darkWoodMaterial);
      rackBase.position.y = 0.08 * hScale;
      rackBase.castShadow = true;
      group.add(rackBase);

      // Montantes verticais laterais
      for (const x of [-0.9, 0.9]) {
        const postGeo = new THREE.BoxGeometry(0.12, 1.7 * hScale, 0.12);
        const post = new THREE.Mesh(postGeo, darkWoodMaterial);
        post.position.set(x, 0.85 * hScale, 0);
        post.castShadow = true;
        group.add(post);
      }

      // Barra superior com entalhes para armas
      const topBarGeo = new THREE.BoxGeometry(2.0, 0.12 * hScale, 0.2);
      const topBar = new THREE.Mesh(topBarGeo, woodMaterial);
      topBar.position.set(0, 1.6 * hScale, 0);
      group.add(topBar);

      // 3 Espadas de aço repousando no suporte
      for (let i = 0; i < 3; i++) {
        const sx = -0.5 + i * 0.5;
        // Lâmina de aço
        const bladeGeo = new THREE.BoxGeometry(0.06, 1.2 * hScale, 0.02);
        const blade = new THREE.Mesh(bladeGeo, steelBladeMaterial);
        blade.position.set(sx, 0.9 * hScale, 0.05);
        blade.castShadow = true;
        group.add(blade);

        // Guarda-mão
        const guardGeo = new THREE.BoxGeometry(0.25, 0.04 * hScale, 0.04);
        const guard = new THREE.Mesh(guardGeo, brassMaterial);
        guard.position.set(sx, 1.45 * hScale, 0.05);
        group.add(guard);
      }
      break;
    }

    // --- CERCA DE MADEIRA PROCEDURAL ---
    case 'fence_wood': {
      const segWidth = 2.0;
      const totalW = segments * segWidth;
      const startX = -totalW / 2 + segWidth / 2;

      for (let s = 0; s < segments; s++) {
        const segX = startX + s * segWidth;
        // Mourões verticais
        for (const px of [-segWidth / 2 + 0.08, segWidth / 2 - 0.08]) {
          const postGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.1 * hScale, 6);
          const post = new THREE.Mesh(postGeo, darkWoodMaterial);
          post.position.set(segX + px, 0.55 * hScale, 0);
          post.castShadow = true;
          group.add(post);
        }
        // Travessas horizontais de madeira
        for (const py of [0.35, 0.75]) {
          const plankGeo = new THREE.BoxGeometry(segWidth - 0.04, 0.08 * hScale, 0.04);
          const plank = new THREE.Mesh(plankGeo, woodMaterial);
          plank.position.set(segX, py * hScale, 0);
          plank.castShadow = true;
          group.add(plank);
        }
        // Estaca diagonal
        const diagGeo = new THREE.BoxGeometry(segWidth * 0.95, 0.06 * hScale, 0.03);
        const diag = new THREE.Mesh(diagGeo, woodMaterial);
        diag.position.set(segX, 0.55 * hScale, 0.01);
        diag.rotation.z = Math.PI / 8;
        group.add(diag);
      }
      break;
    }

    // --- POÇO DE ÁGUA MEDIEVAL ---
    case 'well_stone': {
      // Base redonda de pedra
      const basinGeo = new THREE.CylinderGeometry(0.85, 0.9, 0.9 * hScale, 16, 1, true);
      const basin = new THREE.Mesh(basinGeo, stoneMaterial);
      basin.position.y = 0.45 * hScale;
      basin.castShadow = true;
      group.add(basin);

      // Fundo e Água
      const waterGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.05, 16);
      const water = new THREE.Mesh(waterGeo, waterMaterial);
      water.position.y = 0.65 * hScale;
      group.add(water);

      // Pilares de sustentação do telhado
      for (const sx of [-0.75, 0.75]) {
        const pillarGeo = new THREE.CylinderGeometry(0.06, 0.07, 1.8 * hScale, 6);
        const pillar = new THREE.Mesh(pillarGeo, darkWoodMaterial);
        pillar.position.set(sx, 1.1 * hScale, 0);
        pillar.castShadow = true;
        group.add(pillar);
      }

      // Eixo de corda com manivela
      const axleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
      const axle = new THREE.Mesh(axleGeo, woodMaterial);
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 1.4 * hScale, 0);
      group.add(axle);

      // Telhadinho de duas águas
      const roofGeo = new THREE.ConeGeometry(1.2, 0.6 * hScale, 4);
      const roof = new THREE.Mesh(roofGeo, darkWoodMaterial);
      roof.position.y = 2.1 * hScale;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
      break;
    }

    // --- CRISTAL ARCANO FLUTUANTE ---
    case 'crystal_pylon': {
      // Pedestal de pedra rúnica
      const baseGeo = new THREE.CylinderGeometry(0.5, 0.65, 0.8 * hScale, 8);
      const base = new THREE.Mesh(baseGeo, stoneMaterial);
      base.position.y = 0.4 * hScale;
      base.castShadow = true;
      group.add(base);

      // Anéis de contenção de latão
      const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 16);
      const ring = new THREE.Mesh(ringGeo, brassMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.8 * hScale;
      group.add(ring);

      // Cristal Arcano Flutuante
      const crystalGeo = new THREE.OctahedronGeometry(0.45 * hScale, 0);
      const crystal = new THREE.Mesh(crystalGeo, crystalCyanMaterial);
      crystal.position.y = 1.7 * hScale;
      crystal.scale.set(0.8, 1.6, 0.8);
      crystal.castShadow = true;
      group.add(crystal);
      break;
    }

    // --- CADEIRA / BANCO DE TAVERNA ---
    case 'chair_wood': {
      // 4 Pés
      for (const [x, z] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
        const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5 * hScale, 6);
        const leg = new THREE.Mesh(legGeo, darkWoodMaterial);
        leg.position.set(x, 0.25 * hScale, z);
        leg.castShadow = true;
        group.add(leg);
      }
      // Assento
      const seatGeo = new THREE.BoxGeometry(0.55, 0.06 * hScale, 0.55);
      const seat = new THREE.Mesh(seatGeo, woodMaterial);
      seat.position.y = 0.52 * hScale;
      seat.castShadow = true;
      group.add(seat);

      // Encosto
      for (const x of [-0.2, 0.2]) {
        const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45 * hScale, 6);
        const post = new THREE.Mesh(postGeo, darkWoodMaterial);
        post.position.set(x, 0.77 * hScale, -0.23);
        group.add(post);
      }
      const slatGeo = new THREE.BoxGeometry(0.48, 0.12 * hScale, 0.03);
      const slat = new THREE.Mesh(slatGeo, woodMaterial);
      slat.position.set(0, 0.9 * hScale, -0.23);
      group.add(slat);
      break;
    }

    // --- CAMA MEDIEVAL ---
    case 'bed_medieval': {
      // Estrutura de madeira
      const frameGeo = new THREE.BoxGeometry(1.4, 0.35 * hScale, 2.1);
      const frame = new THREE.Mesh(frameGeo, darkWoodMaterial);
      frame.position.y = 0.2 * hScale;
      frame.castShadow = true;
      group.add(frame);

      // Colchão com lençol
      const matGeo = new THREE.BoxGeometry(1.25, 0.2 * hScale, 1.95);
      const mattress = new THREE.Mesh(matGeo, parchmentMaterial);
      mattress.position.y = 0.42 * hScale;
      group.add(mattress);

      // Cobertor vermelho bordô
      const blanketGeo = new THREE.BoxGeometry(1.28, 0.22 * hScale, 1.3);
      const blanket = new THREE.Mesh(blanketGeo, clothRedMaterial);
      blanket.position.set(0, 0.43 * hScale, 0.3);
      blanket.castShadow = true;
      group.add(blanket);

      // Travesseiro
      const pillowGeo = new THREE.BoxGeometry(0.9, 0.12 * hScale, 0.35);
      const pillow = new THREE.Mesh(pillowGeo, parchmentMaterial);
      pillow.position.set(0, 0.52 * hScale, -0.7);
      group.add(pillow);

      // Cabeceira
      const headGeo = new THREE.BoxGeometry(1.45, 0.9 * hScale, 0.1);
      const head = new THREE.Mesh(headGeo, woodMaterial);
      head.position.set(0, 0.55 * hScale, -1.02);
      head.castShadow = true;
      group.add(head);
      break;
    }

    // --- BALCÃO DE TAVERNA ---
    case 'tavern_bar': {
      // Corpo principal
      const bodyGeo = new THREE.BoxGeometry(2.5, 1.05 * hScale, 0.7);
      const body = new THREE.Mesh(bodyGeo, darkWoodMaterial);
      body.position.y = 0.55 * hScale;
      body.castShadow = true;
      group.add(body);

      // Tampo espesso e polido
      const topGeo = new THREE.BoxGeometry(2.65, 0.12 * hScale, 0.85);
      const top = new THREE.Mesh(topGeo, woodMaterial);
      top.position.y = 1.12 * hScale;
      top.castShadow = true;
      group.add(top);

      // Barra de latão para os pés
      const railGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8);
      const rail = new THREE.Mesh(railGeo, brassMaterial);
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0, 0.15 * hScale, 0.4);
      group.add(rail);

      // 3 Canecos de cerveja sobre o balcão
      for (const bx of [-0.8, 0, 0.7]) {
        const mugGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.18 * hScale, 8);
        const mug = new THREE.Mesh(mugGeo, woodMaterial);
        mug.position.set(bx, 1.25 * hScale, 0.05);
        group.add(mug);
      }
      break;
    }

    // --- PILHA DE CAIXOTES ---
    case 'crate_stack': {
      const positions: [number, number, number, number, number][] = [
        [-0.4, 0.4 * hScale, -0.3, 0.8, 0],
        [0.4, 0.45 * hScale, 0.2, 0.85, 0.2],
        [-0.1, 1.05 * hScale, 0.0, 0.7, -0.15],
      ];
      positions.forEach(([cx, cy, cz, sz, rot]) => {
        const boxGeo = new THREE.BoxGeometry(sz, sz * hScale, sz);
        const box = new THREE.Mesh(boxGeo, woodMaterial);
        box.position.set(cx, cy, cz);
        box.rotation.y = rot;
        box.castShadow = true;
        group.add(box);

        // Moldura de ferro
        const edgeGeo = new THREE.EdgesGeometry(boxGeo);
        const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0x1e293b }));
        edges.position.copy(box.position);
        edges.rotation.copy(box.rotation);
        group.add(edges);
      });
      break;
    }

    // --- PILHA DE BARRIS ---
    case 'barrel_stack': {
      const bPositions: [number, number, number, number][] = [
        [-0.5, 0.5 * hScale, 0, 0],
        [0.5, 0.5 * hScale, 0, 0],
        [0, 1.35 * hScale, 0, 0],
      ];
      bPositions.forEach(([bx, by, bz]) => {
        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.44, 0.9 * hScale, 12);
        const barrel = new THREE.Mesh(barrelGeo, darkWoodMaterial);
        barrel.position.set(bx, by, bz);
        barrel.castShadow = true;
        group.add(barrel);

        for (const ringY of [-0.3, 0.3]) {
          const rGeo = new THREE.TorusGeometry(0.43, 0.02, 6, 12);
          const rMesh = new THREE.Mesh(rGeo, ironMaterial);
          rMesh.rotation.x = Math.PI / 2;
          rMesh.position.set(bx, by + ringY * hScale, bz);
          group.add(rMesh);
        }
      });
      break;
    }

    // --- MESA DE TORTURA MEDIEVAL ---
    case 'torture_rack': {
      // Estrutura de madeira reforçada
      const bedGeo = new THREE.BoxGeometry(1.0, 0.45 * hScale, 2.2);
      const bed = new THREE.Mesh(bedGeo, darkWoodMaterial);
      bed.position.y = 0.4 * hScale;
      bed.castShadow = true;
      group.add(bed);

      // Cilindros / Rolos de ferro de estiramento
      for (const rz of [-0.9, 0.9]) {
        const rollerGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.95, 10);
        const roller = new THREE.Mesh(rollerGeo, ironMaterial);
        roller.rotation.z = Math.PI / 2;
        roller.position.set(0, 0.65 * hScale, rz);
        roller.castShadow = true;
        group.add(roller);
      }

      // Manivela de roda dentada de madeira lateral
      const wheelGeo = new THREE.TorusGeometry(0.25, 0.04, 6, 12);
      const wheel = new THREE.Mesh(wheelGeo, woodMaterial);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(0.55, 0.65 * hScale, 0.9);
      group.add(wheel);
      break;
    }

    // --- DAMA DE FERRO (IRON MAIDEN) ---
    case 'iron_maiden': {
      // Corpo oval/cilíndrico de ferro
      const bodyGeo = new THREE.CylinderGeometry(0.48, 0.55, 2.2 * hScale, 12);
      const body = new THREE.Mesh(bodyGeo, ironMaterial);
      body.position.y = 1.1 * hScale;
      body.castShadow = true;
      group.add(body);

      // Rosto estilizado em relevo de bronze
      const faceGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const face = new THREE.Mesh(faceGeo, brassMaterial);
      face.position.set(0, 1.85 * hScale, 0.42);
      face.scale.set(0.9, 1.2, 0.5);
      group.add(face);

      // Dobradiças e trincos de ferro
      for (const hy of [0.7, 1.4]) {
        const hingeGeo = new THREE.BoxGeometry(0.15, 0.08 * hScale, 0.08);
        const hinge = new THREE.Mesh(hingeGeo, brassMaterial);
        hinge.position.set(0.45, hy * hScale, 0.2);
        group.add(hinge);
      }
      break;
    }

    // --- GAIOLA DE MASMORRA (GIBBET CAGE) ---
    case 'gibbet_cage': {
      // Base e teto circulares de ferro
      for (const cy of [0.3, 2.2]) {
        const capGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.08 * hScale, 12);
        const cap = new THREE.Mesh(capGeo, ironMaterial);
        cap.position.y = cy * hScale;
        cap.castShadow = true;
        group.add(cap);
      }

      // Barras verticais
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const bx = Math.cos(ang) * 0.48;
        const bz = Math.sin(ang) * 0.48;
        const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.9 * hScale, 6);
        const bar = new THREE.Mesh(barGeo, ironMaterial);
        bar.position.set(bx, 1.25 * hScale, bz);
        group.add(bar);
      }

      // Esqueleto/Crânio dentro da gaiola
      const skullGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const skull = new THREE.Mesh(skullGeo, boneSkeletonMaterial);
      skull.position.set(0, 1.35 * hScale, 0);
      group.add(skull);
      break;
    }

    // --- GUILHOTINA DE EXECUÇÃO ---
    case 'guillotine': {
      // Base de madeira
      const baseGeo = new THREE.BoxGeometry(1.4, 0.4 * hScale, 2.2);
      const base = new THREE.Mesh(baseGeo, darkWoodMaterial);
      base.position.y = 0.2 * hScale;
      base.castShadow = true;
      group.add(base);

      // Pilares verticais da lâmina
      for (const px of [-0.4, 0.4]) {
        const poleGeo = new THREE.BoxGeometry(0.1, 2.4 * hScale, 0.12);
        const pole = new THREE.Mesh(poleGeo, darkWoodMaterial);
        pole.position.set(px, 1.4 * hScale, 0);
        pole.castShadow = true;
        group.add(pole);
      }

      // Topo de madeira
      const topGeo = new THREE.BoxGeometry(1.0, 0.12 * hScale, 0.15);
      const top = new THREE.Mesh(topGeo, woodMaterial);
      top.position.set(0, 2.55 * hScale, 0);
      group.add(top);

      // Lâmina de aço diagonal
      const bladeGeo = new THREE.BoxGeometry(0.7, 0.4 * hScale, 0.03);
      const blade = new THREE.Mesh(bladeGeo, steelBladeMaterial);
      blade.position.set(0, 2.0 * hScale, 0);
      blade.rotation.z = Math.PI / 12;
      blade.castShadow = true;
      group.add(blade);

      // Cepo / Luneta do pescoço
      const pilloryGeo = new THREE.BoxGeometry(0.7, 0.35 * hScale, 0.08);
      const pillory = new THREE.Mesh(pilloryGeo, woodMaterial);
      pillory.position.set(0, 0.65 * hScale, 0);
      group.add(pillory);
      break;
    }

    // --- FONTE / CHAFARIZ SAGRADO DE PEDRA ---
    case 'fountain_stone': {
      // Bacia octogonal
      const basinGeo = new THREE.CylinderGeometry(1.1, 1.2, 0.6 * hScale, 8);
      const basin = new THREE.Mesh(basinGeo, stoneMaterial);
      basin.position.y = 0.3 * hScale;
      basin.castShadow = true;
      group.add(basin);

      // Água cristalina na bacia
      const waterGeo = new THREE.CylinderGeometry(0.98, 0.98, 0.05, 8);
      const water = new THREE.Mesh(waterGeo, waterMaterial);
      water.position.y = 0.5 * hScale;
      group.add(water);

      // Coluna central e taça superior
      const colGeo = new THREE.CylinderGeometry(0.2, 0.28, 1.1 * hScale, 8);
      const col = new THREE.Mesh(colGeo, mossStoneMaterial);
      col.position.y = 0.85 * hScale;
      group.add(col);

      const upperBowlGeo = new THREE.CylinderGeometry(0.5, 0.25, 0.35 * hScale, 8);
      const upperBowl = new THREE.Mesh(upperBowlGeo, stoneMaterial);
      upperBowl.position.y = 1.35 * hScale;
      upperBowl.castShadow = true;
      group.add(upperBowl);
      break;
    }

    // --- BANCADA DE ALQUIMIA ---
    case 'alchemy_workbench': {
      // Mesa de madeira sólida
      const tableGeo = new THREE.BoxGeometry(2.0, 0.85 * hScale, 0.9);
      const table = new THREE.Mesh(tableGeo, darkWoodMaterial);
      table.position.y = 0.42 * hScale;
      table.castShadow = true;
      group.add(table);

      // Prateleira superior
      const shelfGeo = new THREE.BoxGeometry(1.9, 0.08 * hScale, 0.3);
      const shelf = new THREE.Mesh(shelfGeo, woodMaterial);
      shelf.position.set(0, 1.2 * hScale, -0.25);
      group.add(shelf);

      // Frascos de poções coloridos
      const potionColors = [0xef4444, 0x10b981, 0x3b82f6, 0xa855f7];
      potionColors.forEach((color, idx) => {
        const vialGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.16 * hScale, 8);
        const vialMat = new THREE.MeshStandardMaterial({ color, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 });
        const vial = new THREE.Mesh(vialGeo, vialMat);
        vial.position.set(-0.6 + idx * 0.35, 1.32 * hScale, -0.25);
        group.add(vial);
      });

      // Retorta de vidro para destilação sobre a mesa
      const flaskGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const flask = new THREE.Mesh(flaskGeo, waterMaterial);
      flask.position.set(0.6, 0.98 * hScale, 0.15);
      group.add(flask);
      break;
    }

    // --- PORTAL ARCANO DIMENSIONAL ---
    case 'magic_portal': {
      // Obeliscos laterais de pedra com runas
      for (const px of [-1.0, 1.0]) {
        const pillarGeo = new THREE.BoxGeometry(0.35, 3.0 * hScale, 0.4);
        const pillar = new THREE.Mesh(pillarGeo, mossStoneMaterial);
        pillar.position.set(px, 1.5 * hScale, 0);
        pillar.castShadow = true;
        group.add(pillar);
      }

      // Lintrel superior em arco
      const archGeo = new THREE.BoxGeometry(2.35, 0.35 * hScale, 0.45);
      const arch = new THREE.Mesh(archGeo, stoneMaterial);
      arch.position.set(0, 3.0 * hScale, 0);
      group.add(arch);

      // Vórtice Dimensional Translúcido Amethyst/Violeta
      const vortexGeo = new THREE.CircleGeometry(0.95 * hScale, 24);
      const vortex = new THREE.Mesh(vortexGeo, amethystPortalMaterial);
      vortex.position.set(0, 1.5 * hScale, 0);
      group.add(vortex);
      break;
    }

    // --- PILHA DE TESOURO & OURO ---
    case 'treasure_pile': {
      // Monte de moedas de ouro
      const pileGeo = new THREE.ConeGeometry(0.85, 0.45 * hScale, 12);
      const pile = new THREE.Mesh(pileGeo, goldCoinsMaterial);
      pile.position.y = 0.22 * hScale;
      pile.castShadow = true;
      group.add(pile);

      // Cálice dourado e gemas
      const cupGeo = new THREE.CylinderGeometry(0.09, 0.05, 0.25 * hScale, 8);
      const cup = new THREE.Mesh(cupGeo, brassMaterial);
      cup.position.set(0.2, 0.45 * hScale, 0.1);
      group.add(cup);

      // Gemas brilhantes
      const gemGeo = new THREE.OctahedronGeometry(0.08, 0);
      const gem1 = new THREE.Mesh(gemGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1 }));
      gem1.position.set(-0.3, 0.25 * hScale, 0.3);
      group.add(gem1);

      const gem2 = new THREE.Mesh(gemGeo, crystalCyanMaterial);
      gem2.position.set(0.3, 0.28 * hScale, -0.2);
      group.add(gem2);
      break;
    }

    // --- PINHEIRO DE FLORESTA ---
    case 'tree_pine': {
      // Tronco
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.4 * hScale, 8);
      const trunk = new THREE.Mesh(trunkGeo, darkWoodMaterial);
      trunk.position.y = 0.7 * hScale;
      trunk.castShadow = true;
      group.add(trunk);

      // 3 Camadas cônicas de folhagem verde escura
      const layers: [number, number, number][] = [
        [1.1, 1.6 * hScale, 1.6 * hScale],
        [0.85, 1.4 * hScale, 2.6 * hScale],
        [0.55, 1.2 * hScale, 3.5 * hScale],
      ];
      layers.forEach(([radius, height, yPos]) => {
        const foliageGeo = new THREE.ConeGeometry(radius, height, 8);
        const foliage = new THREE.Mesh(foliageGeo, pineFoliageMaterial);
        foliage.position.y = yPos;
        foliage.castShadow = true;
        group.add(foliage);
      });
      break;
    }

    // --- PEDREGULHO DE CAVERNA ---
    case 'rock_boulder': {
      const rockGeo = new THREE.DodecahedronGeometry(0.85 * hScale, 1);
      const rock = new THREE.Mesh(rockGeo, mossStoneMaterial);
      rock.position.y = 0.65 * hScale;
      rock.scale.set(1.1, 0.85, 1.2);
      rock.castShadow = true;
      group.add(rock);
      break;
    }

    // --- TENDA DE ACAMPAMENTO ---
    case 'tent_camp': {
      // Tenda em forma de prisma triangular (cone de 4 lados esticado)
      const tentGeo = new THREE.ConeGeometry(1.6, 2.0 * hScale, 4);
      const tent = new THREE.Mesh(tentGeo, leatherTentMaterial);
      tent.position.y = 1.0 * hScale;
      tent.rotation.y = Math.PI / 4;
      tent.scale.set(0.9, 1.0, 1.4);
      tent.castShadow = true;
      group.add(tent);

      // Mastros de madeira frontais
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.1 * hScale, 6);
      const pole = new THREE.Mesh(poleGeo, darkWoodMaterial);
      pole.position.set(0, 1.05 * hScale, 1.1);
      group.add(pole);
      break;
    }
  }

  return group;
}

/**
 * Cria a malha Three.js para um bloco de construção.
 * Tenta carregar automaticamente o modelo customizado de /assets/3d/forge/{type}.glb.
 * Se não existir ou estiver carregando, exibe a malha procedural como fallback instantâneo.
 */
export function createBuildingBlockMesh(block: BuildingBlock3D): THREE.Group {
  const group = new THREE.Group();
  group.name = `block-${block.id}`;
  group.position.set(block.x, block.yElevation || 0, block.z);
  group.rotation.y = ((block.rotationDeg || 0) * Math.PI) / 180;
  group.userData = { blockId: block.id, type: block.type, isBuildingBlock: true };

  const segments = Math.max(1, Math.min(12, block.segmentsCount || 1));
  const hScale = Math.max(0.5, Math.min(3.0, block.heightScale || 1.0));
  const lightCfg = block.lightConfig;

  const def = BUILDING_BLOCK_CATALOG[block.type];
  const targetW = (def?.widthUnits || 2.0) * segments;
  const targetH = (def?.heightUnits || 2.8) * hScale;

  const visualContainer = new THREE.Group();
  visualContainer.name = 'visualContainer';
  group.add(visualContainer);

  // 1. Se já está em cache em memória, usa a réplica do modelo customizado GLB
  const cached = forgeModelCache.get(block.type);
  if (cached) {
    const customInstance = normalizeAndPrepareForgeModel(cached.clone(), targetW, targetH);
    customInstance.name = 'customGlbMesh';
    visualContainer.add(customInstance);
  } else {
    // 2. Cria a malha procedural como fallback imediato
    const procMesh = buildProceduralMesh(block, segments, hScale);
    procMesh.name = 'proceduralMesh';
    visualContainer.add(procMesh);

    // 3. Tenta carregar o modelo GLB de /assets/3d/forge/{type}.glb se ainda não tiver falhado
    if (!failedForgeModelCache.has(block.type)) {
      const url = `/assets/3d/forge/${block.type}.glb`;
      gltfLoader.load(
        url,
        (gltf) => {
          forgeModelCache.set(block.type, gltf.scene);
          // Substitui a malha procedural pelo modelo 3D customizado se o nó ainda estiver na cena
          const oldProc = visualContainer.getObjectByName('proceduralMesh');
          if (oldProc) {
            visualContainer.remove(oldProc);
          }
          const customInstance = normalizeAndPrepareForgeModel(gltf.scene.clone(), targetW, targetH);
          customInstance.name = 'customGlbMesh';
          visualContainer.add(customInstance);
        },
        undefined,
        () => {
          // Arquivo não existe no disco (404) -> memoriza para não re-tentar e mantém a malha procedural
          failedForgeModelCache.add(block.type);
        }
      );
    }
  }

  // --- Dynamic PointLight Attachment if block has lightConfig ---
  if (lightCfg && lightCfg.enabled) {
    const lightDistUnits = (lightCfg.distanceFt / 5.0) * 2.0;
    const light = new THREE.PointLight(
      new THREE.Color(lightCfg.color),
      lightCfg.intensity,
      lightDistUnits,
      1.2
    );
    light.name = 'blockDynamicLight';
    let lightY = 0.8 * hScale;
    let lightZ = 0;
    if (block.type === 'torch_wall') {
      lightY = 2.05 * hScale;
      lightZ = 0.7;
      light.position.set(0, lightY, lightZ);
    } else if (block.type === 'chandelier_candles') {
      lightY = 0.1 * hScale;
      light.position.y = lightY;
    } else {
      lightY = Math.max(0.6, (block.type === 'brazier' ? 1.5 : block.type === 'torch_standing' ? 1.8 : block.type === 'cauldron' ? 1.1 : 0.8) * hScale);
      light.position.y = lightY;
    }
    light.userData = {
      baseIntensity: lightCfg.intensity,
      isFlickeringLight: true,
      flickerOffset: Math.random() * 100,
      baseY: lightY,
      baseZ: lightZ,
    };
    light.castShadow = false; // PointLights locais usam iluminação direta; sombras vêm da luz direcional primária
    group.add(light);
  }

  return group;
}

/**
 * Cria a caixa delimitadora visual (Gizmo Bracket) do asset selecionado em 3D estilo Unreal / Blender
 */
export function createSelectionGizmoMesh(widthUnits: number, heightUnits: number, depthUnits: number): THREE.Group {
  const group = new THREE.Group();
  group.name = 'selectionGizmo';

  const boxGeo = new THREE.BoxGeometry(widthUnits + 0.1, heightUnits + 0.1, depthUnits + 0.1);
  const edgesGeo = new THREE.EdgesGeometry(boxGeo);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8, // sky-400
    linewidth: 2,
  });

  const lines = new THREE.LineSegments(edgesGeo, lineMat);
  lines.position.y = (heightUnits + 0.1) / 2;
  group.add(lines);

  return group;
}

/**
 * Cria malha visual translúcida para Templates de Magia 3D
 */
export function createSpellTemplateMesh(template: SpellTemplate3D): THREE.Group {
  const group = new THREE.Group();
  group.name = `spell-template-${template.id}`;
  group.position.set(template.x, 0.04, template.z);
  if (template.rotationDeg) {
    group.rotation.y = (template.rotationDeg * Math.PI) / 180;
  }

  const color = new THREE.Color(template.color || '#ef4444');
  const radiusUnits = (template.radiusFeet / 5.0) * 2.0;

  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  if (template.shape === 'sphere') {
    const diskGeo = new THREE.CircleGeometry(radiusUnits, 48);
    const disk = new THREE.Mesh(diskGeo, mat);
    disk.rotation.x = -Math.PI / 2;
    group.add(disk);

    const domeGeo = new THREE.SphereGeometry(radiusUnits, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, mat.clone());
    (dome.material as THREE.MeshBasicMaterial).opacity = 0.15;
    group.add(dome);

    const ringGeo = new THREE.RingGeometry(radiusUnits - 0.05, radiusUnits, 48);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);
  } else if (template.shape === 'cone') {
    const shape = new THREE.Shape();
    const halfAngle = 0.5236; // 30 graus
    shape.moveTo(0, 0);
    shape.lineTo(-Math.sin(halfAngle) * radiusUnits, -Math.cos(halfAngle) * radiusUnits);
    shape.absarc(0, 0, radiusUnits, -Math.PI / 2 - halfAngle, -Math.PI / 2 + halfAngle, false);
    shape.lineTo(0, 0);

    const geo = new THREE.ShapeGeometry(shape);
    const coneMesh = new THREE.Mesh(geo, mat);
    coneMesh.rotation.x = -Math.PI / 2;
    group.add(coneMesh);
  } else if (template.shape === 'cube') {
    const cubeGeo = new THREE.BoxGeometry(radiusUnits * 2, radiusUnits * 2, radiusUnits * 2);
    const cube = new THREE.Mesh(cubeGeo, mat);
    cube.position.y = radiusUnits;
    group.add(cube);
  } else if (template.shape === 'line') {
    const widthUnits = ((template.widthFeet || 5) / 5.0) * 2.0;
    const planeGeo = new THREE.PlaneGeometry(widthUnits, radiusUnits);
    const plane = new THREE.Mesh(planeGeo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(0, 0, -radiusUnits / 2);
    group.add(plane);
  }

  return group;
}
