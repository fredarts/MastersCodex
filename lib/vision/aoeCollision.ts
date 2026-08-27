/**
 * lib/vision/aoeCollision.ts
 * Motor matemático de detecção de colisão e interseção espacial 3D/2D
 * entre Templates de Magia (Círculo, Cone, Linha, Caixa/Cubo) e Tokens em grade tática.
 * 
 * Convenção de Coordenadas:
 * - X: Horizontal (Leste/Oeste)
 * - Z: Profundidade (Norte/Sul)
 * - Y: Elevação/Altura (Cima/Baixo)
 * - 1 quadrado padrão de 5 pés = 1.5 metros
 */

export interface Point3D {
  x: number;
  y?: number;
  z: number;
}

export interface TargetableToken {
  id: string;
  name: string;
  position: Point3D;
  sizeUnits?: number; // Diâmetro do token em metros (Médio: 1.5m, Grande: 3m, Enorme: 4.5m, Imenso: 6m)
  elevation?: number; // Altura do chão em metros (voo/flutuação)
}

export interface AoEGeometryParams {
  shape: 'circle' | 'cone' | 'line' | 'fan' | 'box' | 'cylinder' | 'target' | 'multi-target';
  origin: Point3D;     // Posição inicial (Conjurador para cone/linha, ou centro para esfera)
  target?: Point3D;    // Ponto onde o mouse está mirando no chão
  size: number;        // Raio da esfera ou comprimento do cone/linha em metros
  width?: number;      // Largura da linha ou caixa em metros (padrão 1.5m)
  coneAngleDeg?: number; // Ângulo de abertura do cone em graus (padrão 53.13° para D&D 5e)
  rotationDeg?: number;  // Rotação manual explícita (opcional)
}

/**
 * Distância Euclidiana 2D no plano XZ
 */
export function distance2D(p1: Point3D, p2: Point3D): number {
  const dx = p1.x - p2.x;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Normaliza um vetor 2D no plano XZ
 */
export function normalize2D(vec: { x: number; z: number }): { x: number; z: number } {
  const len = Math.sqrt(vec.x * vec.x + vec.z * vec.z);
  if (len < 0.0001) return { x: 0, z: 1 };
  return { x: vec.x / len, z: vec.z / len };
}

/**
 * Produto Escalar (Dot Product) 2D
 */
export function dotProduct2D(v1: { x: number; z: number }, v2: { x: number; z: number }): number {
  return v1.x * v2.x + v1.z * v2.z;
}

/**
 * Verifica se um token está dentro de um Círculo / Esfera
 */
export function isInsideCircle(
  tokenPos: Point3D,
  tokenRadius: number,
  center: Point3D,
  radius: number
): boolean {
  const dist = distance2D(tokenPos, center);
  return dist <= radius + tokenRadius;
}

/**
 * Verifica se um token está dentro de um Cone projetado a partir de uma origem em uma direção
 */
export function isInsideCone(
  tokenPos: Point3D,
  tokenRadius: number,
  origin: Point3D,
  coneDir: { x: number; z: number },
  coneLength: number,
  coneAngleDeg: number = 53.13
): boolean {
  // Vetor do ponto de origem até o centro do token
  const toToken = { x: tokenPos.x - origin.x, z: tokenPos.z - origin.z };
  const dist = Math.sqrt(toToken.x * toToken.x + toToken.z * toToken.z);

  // Se o token está muito próximo da origem (dentro do próprio alcance do corpo do conjurador)
  if (dist <= tokenRadius) return true;

  // Se exceder o comprimento máximo do cone (considerando raio do token)
  if (dist > coneLength + tokenRadius) return false;

  const normToToken = { x: toToken.x / dist, z: toToken.z / dist };
  const normConeDir = normalize2D(coneDir);

  const dot = dotProduct2D(normToToken, normConeDir);
  const halfAngleRad = (coneAngleDeg / 2) * (Math.PI / 180);
  const minCos = Math.cos(halfAngleRad);

  // Tolerância angular para cobrir as bordas do token circular
  const angularTolerance = Math.asin(Math.min(1, tokenRadius / Math.max(0.5, dist)));
  const effectiveMinCos = Math.cos(halfAngleRad + angularTolerance);

  return dot >= effectiveMinCos;
}

/**
 * Verifica se um token está dentro de uma Linha projetada de uma origem até um comprimento
 */
export function isInsideLine(
  tokenPos: Point3D,
  tokenRadius: number,
  origin: Point3D,
  lineDir: { x: number; z: number },
  lineLength: number,
  lineWidth: number = 1.5
): boolean {
  const normDir = normalize2D(lineDir);
  
  // Ponto inicial e final do segmento da linha
  const start = origin;
  const end = {
    x: origin.x + normDir.x * lineLength,
    z: origin.z + normDir.z * lineLength,
  };

  // Projeção do ponto do token no segmento da linha
  const segVec = { x: end.x - start.x, z: end.z - start.z };
  const segLenSq = segVec.x * segVec.x + segVec.z * segVec.z;

  if (segLenSq === 0) return distance2D(tokenPos, start) <= tokenRadius;

  const toToken = { x: tokenPos.x - start.x, z: tokenPos.z - start.z };
  const t = Math.max(0, Math.min(1, (toToken.x * segVec.x + toToken.z * segVec.z) / segLenSq));

  // Ponto mais próximo no segmento
  const closestPoint = {
    x: start.x + t * segVec.x,
    z: start.z + t * segVec.z,
  };

  const distToLine = distance2D(tokenPos, closestPoint);
  const effectiveRadius = lineWidth / 2 + tokenRadius;

  return distToLine <= effectiveRadius;
}

/**
 * Verifica se um token está dentro de uma Caixa / Cubo
 */
export function isInsideBox(
  tokenPos: Point3D,
  tokenRadius: number,
  center: Point3D,
  boxSize: number
): boolean {
  const halfSize = boxSize / 2;
  const minX = center.x - halfSize - tokenRadius;
  const maxX = center.x + halfSize + tokenRadius;
  const minZ = center.z - halfSize - tokenRadius;
  const maxZ = center.z + halfSize + tokenRadius;

  return tokenPos.x >= minX && tokenPos.x <= maxX && tokenPos.z >= minZ && tokenPos.z <= maxZ;
}

/**
 * Avalia todos os tokens fornecidos e retorna a lista dos que estão intersectando o Template de Magia
 */
export function findTokensInAoE(
  params: AoEGeometryParams,
  tokens: TargetableToken[]
): TargetableToken[] {
  if (!tokens || tokens.length === 0) return [];
  const { shape, origin, target, size, width = 1.5, coneAngleDeg = 53.13 } = params;

  return tokens.filter((token) => {
    const tokenRadius = (token.sizeUnits || 1.5) / 2;
    const tokenPos = token.position;

    switch (shape) {
      case 'circle':
      case 'cylinder': {
        // Se a magia for esférica/circular, a posição de 'target' é o centro se fornecida, senão 'origin'
        const center = target || origin;
        return isInsideCircle(tokenPos, tokenRadius, center, size);
      }

      case 'cone':
      case 'fan': {
        // O cone nasce em 'origin' e mira em 'target'
        const dir = target
          ? { x: target.x - origin.x, z: target.z - origin.z }
          : { x: 0, z: 1 };
        return isInsideCone(tokenPos, tokenRadius, origin, dir, size, coneAngleDeg);
      }

      case 'line': {
        const dir = target
          ? { x: target.x - origin.x, z: target.z - origin.z }
          : { x: 0, z: 1 };
        return isInsideLine(tokenPos, tokenRadius, origin, dir, size, width);
      }

      case 'box': {
        const center = target || origin;
        return isInsideBox(tokenPos, tokenRadius, center, size);
      }

      case 'target':
      case 'multi-target': {
        // Para alvo único, seleciona o token mais próximo do ponto de clique se dentro do raio de tolerância
        if (!target) return false;
        return distance2D(tokenPos, target) <= tokenRadius + 0.75;
      }

      default:
        return false;
    }
  });
}
