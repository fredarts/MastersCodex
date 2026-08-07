import { Cell } from '../MapMaker';
import { Combatant, WallSegment, LightSource, VisionType } from '@/lib/types';

/**
 * Checks if a cell blocks light and vision (walls, closed doors, locked doors, or out of bounds)
 */
export function isCellBlockingVision(cell: Cell | undefined): boolean {
  if (!cell) return true;
  if (cell.type === 'wall') return true;
  if (cell.type === 'illusion_wall') {
    const config = cell.illusionWallConfig;
    if (config?.blocksLight && !config?.revealedToPlayers) return true;
  }
  if (cell.type === 'door' && cell.doorConfig?.status === 'closed') return true;
  return false;
}

/**
 * Checks if a WallSegment blocks vision (taking into account doorState)
 */
export function isWallSegmentBlockingVision(wall: WallSegment): boolean {
  if (!wall.blocksVision) return false;
  if (wall.type === 'door' || wall.type === 'secret_door') {
    return wall.doorState !== 'open';
  }
  return true;
}

/**
 * Checks ray-segment intersection. Returns distance t along ray, or null if no intersection.
 */
export function raySegmentIntersection(
  px: number,
  py: number,
  dx: number,
  dy: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number | null {
  const sx = x2 - x1;
  const sy = y2 - y1;

  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-6) return null; // Parallel

  const t = ((x1 - px) * sy - (y1 - py) * sx) / denom;
  const u = ((x1 - px) * dy - (y1 - py) * dx) / denom;

  if (t >= 0 && u >= 0 && u <= 1) {
    return t;
  }
  return null;
}

/**
 * Checks if there is an unobstructed line of sight between two grid cells (c1, r1) and (c2, r2).
 */
export function hasLineOfSight(
  c1: number,
  r1: number,
  c2: number,
  r2: number,
  grid: Cell[][],
  vectorWalls: WallSegment[] = [],
  cellSize = 60
): boolean {
  if (c1 === c2 && r1 === r2) return true;

  // 1. Check vector wall intersections
  if (vectorWalls.length > 0) {
    const px = (c1 + 0.5) * cellSize;
    const py = (r1 + 0.5) * cellSize;
    const targetX = (c2 + 0.5) * cellSize;
    const targetY = (r2 + 0.5) * cellSize;

    const dx = targetX - px;
    const dy = targetY - py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.001) {
      const ndx = dx / dist;
      const ndy = dy / dist;

      for (const wall of vectorWalls) {
        if (!isWallSegmentBlockingVision(wall)) continue;
        const wx1 = wall.x1 * cellSize;
        const wy1 = wall.y1 * cellSize;
        const wx2 = wall.x2 * cellSize;
        const wy2 = wall.y2 * cellSize;

        const t = raySegmentIntersection(px, py, ndx, ndy, wx1, wy1, wx2, wy2);
        if (t !== null && t < dist - 0.1) {
          return false;
        }
      }
    }
  }

  // 2. Check grid cell intersections
  const dx = c2 - c1;
  const dy = r2 - r1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(10, Math.ceil(dist * 12));

  let prevC = c1;
  let prevR = r1;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const curX = c1 + 0.5 + dx * t;
    const curY = r1 + 0.5 + dy * t;
    const curC = Math.floor(curX);
    const curR = Math.floor(curY);

    if (curC === c2 && curR === r2) break;
    if (curC === c1 && curR === r1) continue;

    if (curC !== prevC && curR !== prevR) {
      const cornerCell1 = grid[prevR]?.[curC];
      const cornerCell2 = grid[curR]?.[prevC];
      if (isCellBlockingVision(cornerCell1) && isCellBlockingVision(cornerCell2)) {
        return false;
      }
    }

    const intermediateCell = grid[curR]?.[curC];
    if (isCellBlockingVision(intermediateCell)) {
      return false;
    }

    prevC = curC;
    prevR = curR;
  }

  return true;
}

/**
 * Reveals fog around a token ONLY for cells that are within radius AND have direct line of sight.
 */
export function revealVisionWithLOS(
  gridCopy: Cell[][],
  tokenRow: number,
  tokenCol: number,
  radius: number,
  vectorWalls: WallSegment[] = [],
  cellSize = 60
): void {
  const rows = gridCopy.length;
  const cols = gridCopy[0]?.length || 0;
  const intRadius = Math.ceil(radius);

  const minR = Math.max(0, tokenRow - intRadius);
  const maxR = Math.min(rows - 1, tokenRow + intRadius);
  const minC = Math.max(0, tokenCol - intRadius);
  const maxC = Math.min(cols - 1, tokenCol + intRadius);

  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const dist = Math.sqrt(Math.pow(r - tokenRow, 2) + Math.pow(c - tokenCol, 2));
      if (dist <= radius) {
        if (hasLineOfSight(tokenCol, tokenRow, c, r, gridCopy, vectorWalls, cellSize)) {
          if (gridCopy[r]?.[c]) {
            gridCopy[r][c].fog = false;
          }
        }
      }
    }
  }
}

/**
 * Computes 2D visibility polygon taking into account both cell grid walls and vector WallSegments.
 */
export function computeVisibilityPolygon(
  tx: number,
  ty: number,
  visionRadius: number,
  grid: Cell[][],
  cellSize: number,
  gridOffsetX = 0,
  gridOffsetY = 0,
  hasBgImage = false,
  vectorWalls: WallSegment[] = []
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const anglesSet = new Set<number>();
  const numRays = 360;

  // Base 360-degree rays
  for (let i = 0; i < numRays; i++) {
    anglesSet.add((i * 2 * Math.PI) / numRays);
  }

  // Add vertex-sweeping angles for vector walls to produce pixel-perfect sharp shadows
  if (vectorWalls && vectorWalls.length > 0) {
    const eps = 0.0001;
    vectorWalls.forEach(wall => {
      if (!isWallSegmentBlockingVision(wall)) return;
      const wx1 = wall.x1 * cellSize + (hasBgImage ? gridOffsetX : 0);
      const wy1 = wall.y1 * cellSize + (hasBgImage ? gridOffsetY : 0);
      const wx2 = wall.x2 * cellSize + (hasBgImage ? gridOffsetX : 0);
      const wy2 = wall.y2 * cellSize + (hasBgImage ? gridOffsetY : 0);

      const a1 = Math.atan2(wy1 - ty, wx1 - tx);
      const a2 = Math.atan2(wy2 - ty, wx2 - tx);

      anglesSet.add(a1 - eps);
      anglesSet.add(a1);
      anglesSet.add(a1 + eps);

      anglesSet.add(a2 - eps);
      anglesSet.add(a2);
      anglesSet.add(a2 + eps);
    });
  }

  const sortedAngles = Array.from(anglesSet).sort((a, b) => a - b);
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const startC = Math.floor((hasBgImage ? tx - gridOffsetX : tx) / cellSize);
  const startR = Math.floor((hasBgImage ? ty - gridOffsetY : ty) / cellSize);

  const isPointBlockingGrid = (px: number, py: number) => {
    const adjX = hasBgImage ? px - gridOffsetX : px;
    const adjY = hasBgImage ? py - gridOffsetY : py;
    const c = Math.floor(adjX / cellSize);
    const r = Math.floor(adjY / cellSize);

    if (c < 0 || c >= cols || r < 0 || r >= rows) return true;
    if (c === startC && r === startR) return false; // Origin cell never blocks its own rays
    const cell = grid[r]?.[c];
    return isCellBlockingVision(cell);
  };

  const step = Math.max(1.5, Math.min(cellSize * 0.05, 3.0));

  for (const angle of sortedAngles) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let closestDist = visionRadius;

    // Check vector walls ray intersection
    if (vectorWalls && vectorWalls.length > 0) {
      for (const wall of vectorWalls) {
        if (!isWallSegmentBlockingVision(wall)) continue;
        const wx1 = wall.x1 * cellSize + (hasBgImage ? gridOffsetX : 0);
        const wy1 = wall.y1 * cellSize + (hasBgImage ? gridOffsetY : 0);
        const wx2 = wall.x2 * cellSize + (hasBgImage ? gridOffsetX : 0);
        const wy2 = wall.y2 * cellSize + (hasBgImage ? gridOffsetY : 0);

        const t = raySegmentIntersection(tx, ty, cosA, sinA, wx1, wy1, wx2, wy2);
        if (t !== null && t > 2.0 && t < closestDist) {
          closestDist = t;
        }
      }
    }


    // Step along ray for grid cell walls
    let currentDist = 0;
    let rx = tx;
    let ry = ty;

    while (currentDist < closestDist) {
      rx += cosA * step;
      ry += sinA * step;
      currentDist += step;

      if (isPointBlockingGrid(rx, ry)) {
        closestDist = currentDist;
        break;
      }
    }

    points.push({
      x: tx + cosA * closestDist,
      y: ty + sinA * closestDist
    });
  }

  return points;
}

/**
 * Gets the token's vision radius in cells (defaults to 30ft / 6 cells if not specified)
 */
export function getTokenVisionRadius(
  tokenName: string | undefined,
  combatants: Combatant[] = []
): number {
  if (!tokenName) return 3.0;
  const cleanTokenName = tokenName.trim().toUpperCase();
  const combatant = combatants?.find((c: Combatant) => 
    c.name.slice(0, 3).toUpperCase() === cleanTokenName || 
    c.name.toUpperCase().startsWith(cleanTokenName)
  );
  if (combatant && typeof combatant.visionRange === 'number') {
    return Math.max(1, combatant.visionRange / 5);
  }
  return 6.0; // default 30 feet -> 6 cells
}

/**
 * Gets vision type of combatant (defaulting to 'normal')
 */
export function getCombatantVisionType(
  tokenName: string | undefined,
  combatants: Combatant[] = []
): VisionType {
  if (!tokenName) return 'normal';
  const cleanTokenName = tokenName.trim().toUpperCase();
  const combatant = combatants?.find((c: Combatant) => 
    c.name.slice(0, 3).toUpperCase() === cleanTokenName || 
    c.name.toUpperCase().startsWith(cleanTokenName)
  );
  return combatant?.visionType || 'normal';
}

/**
 * Utility: Checks if point (px, py) is inside a polygon
 */
export function isPointInPolygon(px: number, py: number, polygon: { x: number; y: number }[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a LightSource is connected to active player Line of Sight or an explored room.
 */
export function isLightVisibleToPlayer(
  light: LightSource,
  playerTokens: { r: number; c: number; radius: number }[],
  grid: Cell[][],
  vectorWalls: WallSegment[] = [],
  cellSize = 40,
  gridOffsetX = 0,
  gridOffsetY = 0,
  hasBgImage = false
): boolean {
  if (!grid || grid.length === 0) return true;

  // Determine pixel coordinates of light
  const lx = light.x < 150 ? (hasBgImage ? gridOffsetX + light.x * cellSize : light.x * cellSize) : light.x;
  const ly = light.y < 150 ? (hasBgImage ? gridOffsetY + light.y * cellSize : light.y * cellSize) : light.y;

  // Find grid cell of the light
  const actualLx = hasBgImage ? lx - gridOffsetX : lx;
  const actualLy = hasBgImage ? ly - gridOffsetY : ly;
  const c = Math.floor(actualLx / cellSize);
  const r = Math.floor(actualLy / cellSize);

  const targetCell = grid[r]?.[c];
  
  // Rule 1: If room cell containing the light is unexplored by fog of war (fog === true), hide light from players
  if (targetCell && targetCell.fog) {
    return false;
  }

  // If no player tokens exist on map, allow explored light sources
  if (!playerTokens || playerTokens.length === 0) return true;

  // Rule 2: Check if any player token has Line of Sight to the light source
  for (const pt of playerTokens) {
    if (hasLineOfSight(pt.c, pt.r, c, r, grid, vectorWalls, cellSize)) {
      return true;
    }
  }

  return false;
}
