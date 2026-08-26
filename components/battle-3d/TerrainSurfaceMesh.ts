/**
 * Masters Codex - 3D Tactical Surface Renderer (Three.js)
 * Renderização otimizada de superfícies e terrenos sobre a grade 3D.
 */
import * as THREE from 'three';
import { TerrainCellData, TERRAIN_SURFACE_CATALOG, TerrainSurfaceType } from '@/lib/3d-terrains';
import { disposeHierarchy } from '@/lib/3d-asset-manager';

export interface TerrainMeshManagerInstance {
  group: THREE.Group;
  updateSurfaces: (surfaces: TerrainCellData[], opacityScale?: number) => void;
  setOpacity: (opacityScale: number) => void;
  dispose: () => void;
}

export function createTerrainMeshManager(scene: THREE.Scene): TerrainMeshManagerInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'terrainSurfaceRootGroup';
  scene.add(rootGroup);

  const tileGeo = new THREE.PlaneGeometry(1.94, 1.94);
  const borderGeo = new THREE.EdgesGeometry(tileGeo);

  let currentOpacityScale = 0.65;

  // Cache de materiais para reaproveitamento
  const materialCache = new Map<TerrainSurfaceType, THREE.MeshBasicMaterial>();
  const borderMaterialCache = new Map<TerrainSurfaceType, THREE.LineBasicMaterial>();

  const getMaterialsForType = (type: TerrainSurfaceType) => {
    if (!materialCache.has(type)) {
      const def = TERRAIN_SURFACE_CATALOG[type] || TERRAIN_SURFACE_CATALOG.normal;
      const initialOpacity = Math.min(1.0, Math.max(0.05, def.opacity * (currentOpacityScale / 0.65)));
      
      const meshMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(def.color),
        transparent: true,
        opacity: initialOpacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      materialCache.set(type, meshMat);

      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(def.borderColor),
        transparent: true,
        opacity: Math.min(1.0, Math.max(0.08, (def.opacity + 0.35) * (currentOpacityScale / 0.65))),
      });
      borderMaterialCache.set(type, lineMat);
    }

    return {
      meshMat: materialCache.get(type)!,
      lineMat: borderMaterialCache.get(type)!,
    };
  };

  const setOpacity = (scale: number) => {
    currentOpacityScale = Math.max(0.05, Math.min(1.0, scale));
    materialCache.forEach((mat, type) => {
      const def = TERRAIN_SURFACE_CATALOG[type] || TERRAIN_SURFACE_CATALOG.normal;
      mat.opacity = Math.min(1.0, Math.max(0.05, def.opacity * (currentOpacityScale / 0.65)));
      mat.needsUpdate = true;
    });
    borderMaterialCache.forEach((mat, type) => {
      const def = TERRAIN_SURFACE_CATALOG[type] || TERRAIN_SURFACE_CATALOG.normal;
      mat.opacity = Math.min(1.0, Math.max(0.08, (def.opacity + 0.35) * (currentOpacityScale / 0.65)));
      mat.needsUpdate = true;
    });
  };

  const updateSurfaces = (surfaces: TerrainCellData[], opacityScale?: number) => {
    if (opacityScale !== undefined && opacityScale !== currentOpacityScale) {
      setOpacity(opacityScale);
    }
    // Limpa filhos anteriores
    while (rootGroup.children.length > 0) {
      const child = rootGroup.children[0];
      rootGroup.remove(child);
      disposeHierarchy(child);
    }

    if (!surfaces || surfaces.length === 0) return;

    // Agrupa células por tipo para renderização limpa
    const groupedByType = new Map<TerrainSurfaceType, TerrainCellData[]>();
    for (const cell of surfaces) {
      if (cell.type === 'normal') continue; // Piso normal não precisa de overlay
      const list = groupedByType.get(cell.type) || [];
      list.push(cell);
      groupedByType.set(cell.type, list);
    }

    groupedByType.forEach((cells, type) => {
      const { meshMat, lineMat } = getMaterialsForType(type);
      const subGroup = new THREE.Group();
      subGroup.name = `terrain-layer-${type}`;

      for (const cell of cells) {
        const mesh = new THREE.Mesh(tileGeo, meshMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(cell.x, 0.012, cell.z);
        mesh.userData = { isTerrainTile: true, cellId: cell.id, type: cell.type };
        subGroup.add(mesh);

        const border = new THREE.LineSegments(borderGeo, lineMat);
        border.rotation.x = -Math.PI / 2;
        border.position.set(cell.x, 0.013, cell.z);
        subGroup.add(border);

        // Adiciona detalhes visuais específicos para alguns terrenos
        if (type === 'burning_fire') {
          // Pequena luz no centro da célula em chamas
          const fireLight = new THREE.PointLight(0xff6600, 1.2, 8);
          fireLight.position.set(cell.x, 0.4, cell.z);
          subGroup.add(fireLight);
        } else if (type === 'acid_pool') {
          // Luz verde fraca para o ácido
          const acidLight = new THREE.PointLight(0x22c55e, 0.8, 6);
          acidLight.position.set(cell.x, 0.3, cell.z);
          subGroup.add(acidLight);
        } else if (type === 'ice_sheet') {
          // Linhas diagonais de rachadura no gelo
          const crackPoints = [
            new THREE.Vector3(-0.6, 0.015, -0.6),
            new THREE.Vector3(0.1, 0.015, 0.0),
            new THREE.Vector3(0.7, 0.015, 0.6),
          ];
          const crackGeo = new THREE.BufferGeometry().setFromPoints(crackPoints);
          const crackLine = new THREE.Line(crackGeo, lineMat);
          crackLine.position.set(cell.x, 0, cell.z);
          subGroup.add(crackLine);
        } else if (type === 'web_entangle') {
          // Cruz de teia de aranha
          const webPoints = [
            new THREE.Vector3(-0.8, 0.015, -0.8),
            new THREE.Vector3(0.8, 0.015, 0.8),
            new THREE.Vector3(-0.8, 0.015, 0.8),
            new THREE.Vector3(0.8, 0.015, -0.8),
          ];
          const webGeo = new THREE.BufferGeometry().setFromPoints(webPoints);
          const webLine = new THREE.LineSegments(webGeo, lineMat);
          webLine.position.set(cell.x, 0, cell.z);
          subGroup.add(webLine);
        }
      }

      rootGroup.add(subGroup);
    });
  };

  const dispose = () => {
    scene.remove(rootGroup);
    disposeHierarchy(rootGroup);
    materialCache.forEach((mat) => mat.dispose());
    borderMaterialCache.forEach((mat) => mat.dispose());
    materialCache.clear;
    borderMaterialCache.clear();
    tileGeo.dispose();
    borderGeo.dispose();
  };

  return {
    group: rootGroup,
    updateSurfaces,
    setOpacity,
    dispose,
  };
}
