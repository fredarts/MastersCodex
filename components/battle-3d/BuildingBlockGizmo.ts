/**
 * Masters Codex - 3D Interactive Transform Gizmo (Unreal / Blender Style)
 * Widgets 3D interativos renderizados diretamente sobre o asset selecionado:
 * 1. Anel de Rotação 3D (Arraste para girar)
 * 2. Handle de Esticamento Procedural (Arraste para adicionar/remover módulos sem distorcer)
 * 3. Base de Seleção e Movimento (Arraste para mover no grid)
 */
import * as THREE from 'three';
import { BuildingBlock3D, BUILDING_BLOCK_CATALOG } from '@/lib/3d-building-blocks';

export type GizmoHandleType = 'move' | 'rotate' | 'stretch';

/**
 * Cria o conjunto de widgets 3D (Gizmo) anexado ao asset selecionado
 */
export function createInteractiveTransformGizmo(block: BuildingBlock3D): THREE.Group {
  const gizmoGroup = new THREE.Group();
  gizmoGroup.name = 'blockInteractiveGizmo';

  const def = BUILDING_BLOCK_CATALOG[block.type];
  const segs = block.segmentsCount || 1;
  const hScale = block.heightScale || 1.0;
  const totalW = (def?.widthUnits || 2.0) * segs;
  const totalH = (def?.heightUnits || 2.8) * hScale;
  const depth = def?.category === 'structures' ? 1.1 : 1.3;

  // 1. CAIXA DE SELEÇÃO WIREFRAME (Apenas visual - raycast desativado para não bloquear cliques)
  const boxGeo = new THREE.BoxGeometry(totalW + 0.15, totalH + 0.15, depth + 0.15);
  const edgesGeo = new THREE.EdgesGeometry(boxGeo);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8, // sky-400
    linewidth: 2,
    transparent: true,
    opacity: 0.85,
  });
  const lines = new THREE.LineSegments(edgesGeo, lineMat);
  lines.position.y = (totalH + 0.15) / 2;
  lines.raycast = () => {}; // Não intercepta raycasts
  gizmoGroup.add(lines);

  // 2. WIDGET DE ROTAÇÃO 3D (Anel Superior Dourado com Grip e Colisor Espesso)
  const ringRadius = Math.max(1.3, totalW / 2 + 0.4);
  const ringGroup = new THREE.Group();
  ringGroup.name = 'gizmo-handle-rotate';
  ringGroup.position.y = totalH + 0.35;

  // Tubo visual do anel
  const ringGeo = new THREE.TorusGeometry(ringRadius, 0.08, 12, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b, // amber-500
    transparent: true,
    opacity: 0.9,
  });
  const rotateRing = new THREE.Mesh(ringGeo, ringMat);
  rotateRing.name = 'gizmo-handle-rotate';
  rotateRing.rotation.x = Math.PI / 2;
  rotateRing.userData = { isGizmoHandle: true, handleType: 'rotate', blockId: block.id };
  ringGroup.add(rotateRing);

  // Colisor invisível mais espesso para facilitar agarrar com o mouse
  const colliderGeo = new THREE.TorusGeometry(ringRadius, 0.25, 8, 36);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const colliderMesh = new THREE.Mesh(colliderGeo, colliderMat);
  colliderMesh.name = 'gizmo-handle-rotate';
  colliderMesh.rotation.x = Math.PI / 2;
  colliderMesh.userData = { isGizmoHandle: true, handleType: 'rotate', blockId: block.id };
  ringGroup.add(colliderMesh);

  // 4 Setas indicativas direcionais no anel
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2;
    const arrowGeo = new THREE.ConeGeometry(0.14, 0.28, 8);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.name = 'gizmo-handle-rotate';
    arrow.position.set(Math.cos(ang) * ringRadius, 0, Math.sin(ang) * ringRadius);
    arrow.rotation.y = -ang;
    arrow.rotation.x = Math.PI / 2;
    arrow.userData = { isGizmoHandle: true, handleType: 'rotate', blockId: block.id };
    ringGroup.add(arrow);
  }

  gizmoGroup.add(ringGroup);

  // 3. WIDGET DE ESTICAMENTO PROCEDURAL (Alça Verde na ponta da parede)
  if (def?.supportsProceduralLength) {
    const stretchGroup = new THREE.Group();
    stretchGroup.name = 'gizmo-handle-stretch';
    stretchGroup.position.set(totalW / 2 + 0.35, totalH / 2, 0);

    // Haste de conexão
    const stalkGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);
    const stalkMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const stalk = new THREE.Mesh(stalkGeo, stalkMat);
    stalk.rotation.z = Math.PI / 2;
    stalk.userData = { isGizmoHandle: true, handleType: 'stretch', blockId: block.id };
    stretchGroup.add(stalk);

    // Manípulo / Cubo Verde
    const handleGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });
    const handleBox = new THREE.Mesh(handleGeo, handleMat);
    handleBox.position.x = 0.2;
    handleBox.name = 'gizmo-handle-stretch';
    handleBox.userData = { isGizmoHandle: true, handleType: 'stretch', blockId: block.id };
    stretchGroup.add(handleBox);

    // Seta dupla indicando esticamento horizontal
    const coneGeo = new THREE.ConeGeometry(0.16, 0.28, 8);
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0x34d399 }));
    cone.name = 'gizmo-handle-stretch';
    cone.rotation.z = -Math.PI / 2;
    cone.position.x = 0.45;
    cone.userData = { isGizmoHandle: true, handleType: 'stretch', blockId: block.id };
    stretchGroup.add(cone);

    gizmoGroup.add(stretchGroup);
  }

  return gizmoGroup;
}
