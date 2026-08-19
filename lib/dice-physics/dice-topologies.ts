import * as THREE from 'three';

export type DieType = 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4';

export interface DieFaceInfo {
  value: number;
  normal: THREE.Vector3;
  center: THREE.Vector3;
}

export interface DieTopology {
  dieType: DieType;
  radius: number;
  geometry: THREE.BufferGeometry;
  faces: DieFaceInfo[];
  vertices: THREE.Vector3[];
}

/**
 * Cria textura em canvas de alta resolução para o número da face
 */
export function createDieNumberTexture(
  text: string,
  isGold = false,
  isCrimson = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);

    // Font setup
    ctx.font = '900 128px "Cinzel", "Times New Roman", serif, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Sublinha para diferenciar 6 e 9
    const needsUnderline = text === '6' || text === '9';

    // Stroke escuro grosso para legibilidade nítida
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.lineWidth = 18;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 128, 128);

    // Cor do preenchimento
    ctx.fillStyle = isGold ? '#fbbf24' : isCrimson ? '#ef4444' : '#f8fafc';
    ctx.fillText(text, 128, 128);

    if (needsUnderline) {
      ctx.fillStyle = isGold ? '#fbbf24' : isCrimson ? '#ef4444' : '#f8fafc';
      ctx.fillRect(80, 200, 96, 12);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Constrói geometria e topologia com distribuição canônica de faces para cada tipo de dado
 */
export function buildDieTopology(dieType: DieType): DieTopology {
  let geometry: THREE.BufferGeometry;
  let radius = 1.25;

  switch (dieType) {
    case 'd20':
      radius = 1.25;
      geometry = new THREE.IcosahedronGeometry(radius, 0);
      break;
    case 'd12':
      radius = 1.15;
      geometry = new THREE.DodecahedronGeometry(radius, 0);
      break;
    case 'd10':
      radius = 1.25;
      geometry = new THREE.OctahedronGeometry(radius, 0); // Octaedro estilizado como d10
      break;
    case 'd8':
      radius = 1.25;
      geometry = new THREE.OctahedronGeometry(radius, 0);
      break;
    case 'd6':
      radius = 1.0;
      geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      break;
    case 'd4':
      radius = 1.35;
      geometry = new THREE.TetrahedronGeometry(radius, 0);
      break;
    default:
      radius = 1.25;
      geometry = new THREE.IcosahedronGeometry(radius, 0);
  }

  // Extrair vértices únicos para detecção precisa de colisões
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const posAttr = nonIndexed.attributes.position;
  const count = posAttr.count;

  const rawVertices: THREE.Vector3[] = [];
  const vertexSet = new Set<string>();

  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    if (!vertexSet.has(key)) {
      vertexSet.add(key);
      rawVertices.push(v);
    }
  }

  // Agrupar faces por normal compartilhada
  interface RawFaceGroup {
    normal: THREE.Vector3;
    center: THREE.Vector3;
    count: number;
  }
  const rawGroups: RawFaceGroup[] = [];

  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const triCenter = new THREE.Vector3();
  const triNormal = new THREE.Vector3();

  for (let i = 0; i < count; i += 3) {
    v0.fromBufferAttribute(posAttr, i);
    v1.fromBufferAttribute(posAttr, i + 1);
    v2.fromBufferAttribute(posAttr, i + 2);

    triCenter.copy(v0).add(v1).add(v2).divideScalar(3);
    triNormal.copy(triCenter).normalize();

    let matched = false;
    for (const g of rawGroups) {
      if (g.normal.dot(triNormal) > 0.92) {
        g.center.add(triCenter);
        g.count++;
        matched = true;
        break;
      }
    }

    if (!matched) {
      rawGroups.push({
        normal: triNormal.clone(),
        center: triCenter.clone(),
        count: 1,
      });
    }
  }

  rawGroups.forEach((g) => g.center.divideScalar(g.count));

  // Ordenação determinística de faces por coordenadas espaciais
  rawGroups.sort((a, b) => {
    if (Math.abs(a.normal.y - b.normal.y) > 0.001) return b.normal.y - a.normal.y;
    if (Math.abs(a.normal.z - b.normal.z) > 0.001) return b.normal.z - a.normal.z;
    return b.normal.x - a.normal.x;
  });

  // Mapeamento canônico de valores de faces
  const maxSides =
    dieType === 'd20'
      ? 20
      : dieType === 'd12'
      ? 12
      : dieType === 'd10'
      ? 10
      : dieType === 'd8'
      ? 8
      : dieType === 'd6'
      ? 6
      : 4;

  const faces: DieFaceInfo[] = [];

  // Distribuição padrão de RPG com opostos balanceados
  const canonicalValues = getCanonicalFaceValues(dieType, rawGroups.length);

  rawGroups.forEach((group, index) => {
    const value = canonicalValues[index] || (index % maxSides) + 1;
    faces.push({
      value,
      normal: group.normal.clone(),
      center: group.center.clone(),
    });
  });

  nonIndexed.dispose();

  return {
    dieType,
    radius,
    geometry,
    faces,
    vertices: rawVertices,
  };
}

/**
 * Retorna arranjo canônico de valores para as faces do dado
 */
function getCanonicalFaceValues(dieType: DieType, faceCount: number): number[] {
  switch (dieType) {
    case 'd20': {
      // D20 Padrão Oficial: Opostos somam 21 (20 oposto a 1, 14 oposto a 7, etc.)
      const d20Pairs = [
        [20, 1],
        [14, 7],
        [19, 2],
        [15, 6],
        [18, 3],
        [13, 8],
        [17, 4],
        [12, 9],
        [16, 5],
        [11, 10],
      ];
      const res: number[] = [];
      d20Pairs.forEach(([a, b]) => {
        res.push(a);
        res.push(b);
      });
      return res.slice(0, faceCount);
    }
    case 'd12': {
      // D12 Oficial: Opostos somam 13
      const d12Pairs = [
        [12, 1],
        [11, 2],
        [10, 3],
        [9, 4],
        [8, 5],
        [7, 6],
      ];
      const res: number[] = [];
      d12Pairs.forEach(([a, b]) => {
        res.push(a);
        res.push(b);
      });
      return res.slice(0, faceCount);
    }
    case 'd10': {
      // D10: Opostos somam 11
      const d10Pairs = [
        [10, 1],
        [9, 2],
        [8, 3],
        [7, 4],
        [6, 5],
      ];
      const res: number[] = [];
      d10Pairs.forEach(([a, b]) => {
        res.push(a);
        res.push(b);
      });
      return res.slice(0, faceCount);
    }
    case 'd8': {
      // D8 Oficial: Opostos somam 9
      const d8Pairs = [
        [8, 1],
        [7, 2],
        [6, 3],
        [5, 4],
      ];
      const res: number[] = [];
      d8Pairs.forEach(([a, b]) => {
        res.push(a);
        res.push(b);
      });
      return res.slice(0, faceCount);
    }
    case 'd6': {
      // D6 Padrão de Cassino: Opostos somam 7 (1 oposto 6, 2 oposto 5, 3 oposto 4)
      return [6, 1, 5, 2, 4, 3];
    }
    case 'd4': {
      return [4, 3, 2, 1];
    }
    default:
      return Array.from({ length: faceCount }, (_, i) => i + 1);
  }
}
