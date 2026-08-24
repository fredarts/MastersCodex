/**
 * Three.js Procedural Meshes para Building Blocks 3D, Procedural Arrays e Iluminação Medieval
 */
import * as THREE from 'three';
import { BuildingBlock3D, SpellTemplate3D } from '@/lib/3d-building-blocks';

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

/**
 * Cria a malha Three.js para um bloco de construção com sombras, PBR e suporte a repetição procedural (sem distorção)
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

    case 'door_wood': {
      const postGeo = new THREE.BoxGeometry(0.2, 2.8 * hScale, 0.4);
      const leftPost = new THREE.Mesh(postGeo, stoneTrimMaterial);
      leftPost.position.set(-0.9, 1.4 * hScale, 0);
      leftPost.castShadow = true;
      group.add(leftPost);

      const rightPost = new THREE.Mesh(postGeo, stoneTrimMaterial);
      rightPost.position.set(0.9, 1.4 * hScale, 0);
      rightPost.castShadow = true;
      group.add(rightPost);

      const headerGeo = new THREE.BoxGeometry(2.0, 0.2 * hScale, 0.4);
      const headerMesh = new THREE.Mesh(headerGeo, stoneTrimMaterial);
      headerMesh.position.set(0, 2.7 * hScale, 0);
      headerMesh.castShadow = true;
      group.add(headerMesh);

      const doorPivot = new THREE.Group();
      doorPivot.name = 'doorPivot';
      doorPivot.position.set(-0.8, 0, 0);

      const doorLeafGeo = new THREE.BoxGeometry(1.6, 2.5 * hScale, 0.15);
      const doorLeaf = new THREE.Mesh(doorLeafGeo, woodMaterial);
      doorLeaf.position.set(0.8, 1.3 * hScale, 0);
      doorLeaf.castShadow = true;
      doorLeaf.receiveShadow = true;
      doorPivot.add(doorLeaf);

      const knobGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const knob = new THREE.Mesh(knobGeo, goldTrimMaterial);
      knob.position.set(1.45, 1.25 * hScale, 0.1);
      doorPivot.add(knob);

      if (block.state === 'open') {
        doorPivot.rotation.y = -Math.PI / 2;
      }
      group.add(doorPivot);
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
      // Arandela de parede de ferro fundido
      const bracketGeo = new THREE.BoxGeometry(0.1, 0.4, 0.3);
      const bracket = new THREE.Mesh(bracketGeo, ironMaterial);
      bracket.position.set(0, 1.5, 0.15);
      group.add(bracket);

      const sconceGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
      const sconce = new THREE.Mesh(sconceGeo, woodMaterial);
      sconce.rotation.x = Math.PI / 8;
      sconce.position.set(0, 1.6, 0.25);
      group.add(sconce);

      const flameGeo = new THREE.ConeGeometry(0.16, 0.4, 8);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(0, 1.95, 0.35);
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
    light.position.y = Math.max(0.6, (block.type === 'brazier' ? 1.5 : block.type === 'torch_standing' ? 1.8 : 0.8) * hScale);
    light.castShadow = true;
    light.shadow.bias = -0.002;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
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
