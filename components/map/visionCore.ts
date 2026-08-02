import { Cell } from '../MapMaker';
import { Combatant } from '@/lib/types';

/**
 * Checks if a cell blocks light and vision (walls, closed doors, locked doors, or out of bounds)
 */
export function isCellBlockingVision(cell: Cell | undefined): boolean {
  if (!cell) return true;
  if (cell.type === 'wall') return true;
  if (cell.type === 'door' && cell.doorConfig?.status === 'closed') return true;
  return false;
}

/**
 * Checks if there is an unobstructed line of sight between two grid cells (c1, r1) and (c2, r2).
 * The start and end cells are permitted, but any intermediate blocking cell stops vision.
 * Also checks diagonal wall corner joints to prevent light leaking through diagonal wall corners.
 */
export function hasLineOfSight(
  c1: number,
  r1: number,
  c2: number,
  r2: number,
  grid: Cell[][]
): boolean {
  if (c1 === c2 && r1 === r2) return true;

  const dx = c2 - c1;
  const dy = r2 - r1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Ample samples along the line to guarantee no missed cells
  const steps = Math.max(10, Math.ceil(dist * 12));

  let prevC = c1;
  let prevR = r1;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const curX = c1 + 0.5 + dx * t;
    const curY = r1 + 0.5 + dy * t;
    const curC = Math.floor(curX);
    const curR = Math.floor(curY);

    // If we've reached the target cell, stop checking intermediates
    if (curC === c2 && curR === r2) {
      break;
    }

    // Skip the starting cell
    if (curC === c1 && curR === r1) {
      continue;
    }

    // If stepping to a new cell diagonally, check diagonal wall leak
    if (curC !== prevC && curR !== prevR) {
      const cornerCell1 = grid[prevR]?.[curC];
      const cornerCell2 = grid[curR]?.[prevC];
      if (isCellBlockingVision(cornerCell1) && isCellBlockingVision(cornerCell2)) {
        return false;
      }
    }

    // Check intermediate cell blocking
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
  radius: number
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
        if (hasLineOfSight(tokenCol, tokenRow, c, r, gridCopy)) {
          if (gridCopy[r]?.[c]) {
            gridCopy[r][c].fog = false;
          }
        }
      }
    }
  }
}

/**
 * Computes a 2D visibility polygon (like Godot Light2D) from pixel position (tx, ty) with visionRadius.
 * Casts fine rays in 360 degrees and stops at wall boundaries.
 */
export function computeVisibilityPolygon(
  tx: number,
  ty: number,
  visionRadius: number,
  grid: Cell[][],
  cellSize: number,
  gridOffsetX = 0,
  gridOffsetY = 0,
  hasBgImage = false
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const numRays = 360;
  const step = Math.max(1.5, Math.min(cellSize * 0.05, 3.0));
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  const isPointBlocking = (px: number, py: number) => {
    const adjX = hasBgImage ? px - gridOffsetX : px;
    const adjY = hasBgImage ? py - gridOffsetY : py;
    const c = Math.floor(adjX / cellSize);
    const r = Math.floor(adjY / cellSize);

    if (c < 0 || c >= cols || r < 0 || r >= rows) return true;
    const cell = grid[r]?.[c];
    return isCellBlockingVision(cell);
  };

  for (let i = 0; i < numRays; i++) {
    const angle = (i * 2 * Math.PI) / numRays;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let currentDist = 0;
    let rx = tx;
    let ry = ty;
    let hitWall = false;

    while (currentDist < visionRadius) {
      rx += cosA * step;
      ry += sinA * step;
      currentDist += step;

      if (isPointBlocking(rx, ry)) {
        hitWall = true;
        break;
      }
    }

    if (hitWall) {
      points.push({ x: rx, y: ry });
    } else {
      points.push({
        x: tx + cosA * visionRadius,
        y: ty + sinA * visionRadius
      });
    }
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
