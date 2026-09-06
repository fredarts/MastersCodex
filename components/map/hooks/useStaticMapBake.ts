'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Cell } from '../../MapMaker';
import {
  drawDysonCrosshatch,
  drawWaterHachure,
  drawGrassHachure,
  drawTrapHachure,
  drawChestHachure,
  drawStashHachure,
  drawPortcullisHachure,
  drawTriggerHachure,
  drawIllusionWallHachure,
  drawWobblyLine
} from '../dysonCore';

interface UseStaticMapBakeProps {
  grid: Cell[][];
  bgImage: HTMLImageElement | null;
  cellSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
  isPlayerView: boolean;
}

export function useStaticMapBake({
  grid,
  bgImage,
  cellSize,
  gridOffsetX,
  gridOffsetY,
  isPlayerView,
}: UseStaticMapBakeProps) {
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isBakeDirtyRef = useRef<boolean>(true);
  const [bakeVersion, setBakeVersion] = useState<number>(0);

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Generate a signature of static geometry to determine when rebake is necessary
  const staticTopologySignature = useMemo(() => {
    if (!grid || grid.length === 0) return '';
    let sig = `s_${rows}_${cols}_${cellSize}_${isPlayerView ? '1' : '0'}_${bgImage ? bgImage.src : 'dyson'}_`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;
        sig += `${cell.type}`;
        if (cell.type === 'door') sig += `:${cell.doorConfig?.doorType || 'w'}:${cell.doorConfig?.status || 'c'}`;
        else if (cell.type === 'trap') sig += `:${cell.trapConfig?.revealedToPlayers ? '1' : '0'}`;
        else if (cell.type === 'chest' || cell.type === 'stash') sig += `:${cell.chestConfig?.containerType || 'c'}:${cell.chestConfig?.status || 'l'}`;
        else if (cell.type === 'portcullis') sig += `:${cell.portcullisConfig?.status || 'c'}`;
        else if (cell.type === 'trigger') sig += `:${cell.triggerConfig?.triggerType || 'l'}:${cell.triggerConfig?.state || 'i'}`;
        else if (cell.type === 'illusion_wall') sig += `:${cell.illusionWallConfig?.revealedToPlayers ? '1' : '0'}`;
      }
      sig += '|';
    }
    return sig;
  }, [grid, rows, cols, cellSize, isPlayerView, bgImage]);

  // Compute distance map for Dyson wall crosshatch
  const distMap = useMemo(() => {
    if (!grid || grid.length === 0 || bgImage) return [];
    const map: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(99));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]?.[c] && grid[r][c].type !== 'wall') {
          map[r][c] = 0;
        } else {
          let minDist = 99;
          for (let i = -3; i <= 3; i++) {
            for (let j = -3; j <= 3; j++) {
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                if (grid[nr]?.[nc] && grid[nr][nc].type !== 'wall') {
                  const d = Math.hypot(i, j);
                  if (d < minDist) minDist = d;
                }
              }
            }
          }
          map[r][c] = minDist;
        }
      }
    }
    return map;
  }, [grid, rows, cols, bgImage]);

  // Mark bake as dirty when static signature changes
  useEffect(() => {
    isBakeDirtyRef.current = true;
  }, [staticTopologySignature]);

  // Execute full baking onto offscreen canvas
  const bakeStaticMap = useCallback(() => {
    if (!grid || rows === 0 || cols === 0) return null;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }

    const canvas = offscreenCanvasRef.current;
    const targetWidth = bgImage ? bgImage.width : cols * cellSize;
    const targetHeight = bgImage ? bgImage.height : rows * cellSize;

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, targetWidth, targetHeight);

    if (bgImage) {
      // 1. Draw uploaded image
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height);

      // 2. Custom grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.0;
      for (let c = 0; c <= cols; c++) {
        const x = gridOffsetX + c * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, targetHeight);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        const y = gridOffsetY + r * cellSize;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(targetWidth, y);
        ctx.stroke();
      }
    } else {
      // Procedural Dyson Parchment Paper
      ctx.fillStyle = '#fbf9f3';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 1. Draw Dyson Wall Hachures
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r]?.[c]?.type === 'wall' && distMap[r]?.[c] > 0) {
            drawDysonCrosshatch(ctx, c, r, cellSize, distMap[r][c]);
          }
        }
      }

      // 2. Draw specialized procedural terrains
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          let type = cell.type;

          // Camouflage secret elements for players
          if (type === 'door' && cell.doorConfig?.doorType === 'secret' && isPlayerView && !cell.doorConfig?.secretRevealed) {
            type = 'wall';
          }
          if (type === 'trap' && isPlayerView && !cell.trapConfig?.revealedToPlayers) {
            type = 'floor';
          }
          if (type === 'stash' && isPlayerView && !cell.chestConfig?.revealedToPlayers) {
            type = 'floor';
          }
          if (type === 'trigger' && isPlayerView && cell.triggerConfig?.isSecret && !cell.triggerConfig?.revealedToPlayers) {
            type = 'floor';
          }
          if (type === 'illusion_wall' && isPlayerView && !cell.illusionWallConfig?.revealedToPlayers) {
            type = 'wall';
          }

          if (type && type !== 'wall') {
            const x = c * cellSize;
            const y = r * cellSize;

            // Clear parchment base under non-wall terrain
            ctx.fillStyle = '#fbf9f3';
            ctx.fillRect(x, y, cellSize, cellSize);

            if (type === 'water') {
              drawWaterHachure(ctx, c, r, cellSize);
            } else if (type === 'grass') {
              drawGrassHachure(ctx, c, r, cellSize);
            } else if (type === 'trap') {
              drawTrapHachure(ctx, c, r, cellSize);
            } else if (type === 'chest') {
              const containerType = (isPlayerView && cell.chestConfig?.containerType === 'mimic' && !cell.chestConfig?.revealedToPlayers)
                ? 'wooden_chest'
                : (cell.chestConfig?.containerType || 'wooden_chest');
              const status = cell.chestConfig?.status || 'locked';
              drawChestHachure(ctx, c, r, cellSize, containerType, status);
            } else if (type === 'stash') {
              drawStashHachure(ctx, c, r, cellSize);
            } else if (type === 'portcullis') {
              const status = cell.portcullisConfig?.status || 'closed';
              drawPortcullisHachure(ctx, c, r, cellSize, status);
            } else if (type === 'trigger') {
              const triggerType = cell.triggerConfig?.triggerType || 'lever';
              const state = cell.triggerConfig?.state || 'inactive';
              drawTriggerHachure(ctx, c, r, cellSize, triggerType, state);
            } else if (type === 'illusion_wall') {
              const revealed = cell.illusionWallConfig?.revealedToPlayers || false;
              drawIllusionWallHachure(ctx, c, r, cellSize, isPlayerView, revealed);
            } else {
              // Terreno normal: grid lines
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
              drawWobblyLine(ctx, x, y, x + cellSize, y, 0.8, r * 1000 + c);
              drawWobblyLine(ctx, x, y, x, y + cellSize, 0.8, r * 2000 + c);
            }
          }
        }
      }

      // 3. Draw wall borders (wobbly ink pen lines)
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const WALL_THICKNESS = 3.2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          let type = cell.type;
          if (type === 'door' && cell.doorConfig?.doorType === 'secret' && isPlayerView && !cell.doorConfig?.secretRevealed) {
            type = 'wall';
          }
          if (type === 'trap' && isPlayerView && !cell.trapConfig?.revealedToPlayers) {
            type = 'floor';
          }
          if (type === 'stash' && isPlayerView && !cell.chestConfig?.revealedToPlayers) {
            type = 'floor';
          }

          if (type && type !== 'wall') {
            const x = c * cellSize;
            const y = r * cellSize;

            if (r === 0 || grid[r - 1]?.[c]?.type === 'wall' || (grid[r - 1]?.[c]?.type === 'door' && grid[r - 1]?.[c]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r - 1]?.[c]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x, y, x + cellSize, y, WALL_THICKNESS, (r * c) + 1);
            }
            if (r === rows - 1 || grid[r + 1]?.[c]?.type === 'wall' || (grid[r + 1]?.[c]?.type === 'door' && grid[r + 1]?.[c]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r + 1]?.[c]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x, y + cellSize, x + cellSize, y + cellSize, WALL_THICKNESS, (r * c) + 2);
            }
            if (c === 0 || grid[r]?.[c - 1]?.type === 'wall' || (grid[r]?.[c - 1]?.type === 'door' && grid[r]?.[c - 1]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r]?.[c - 1]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x, y, x, y + cellSize, WALL_THICKNESS, (r * c) + 3);
            }
            if (c === cols - 1 || grid[r]?.[c + 1]?.type === 'wall' || (grid[r]?.[c + 1]?.type === 'door' && grid[r]?.[c + 1]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r]?.[c + 1]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x + cellSize, y, x + cellSize, y + cellSize, WALL_THICKNESS, (r * c) + 4);
            }
          }
        }
      }
    }

    isBakeDirtyRef.current = false;
    setBakeVersion(v => v + 1);
    return canvas;
  }, [grid, rows, cols, cellSize, distMap, isPlayerView, bgImage, gridOffsetX, gridOffsetY]);

  // Get baked canvas; rebakes if dirty
  const getBakedCanvas = useCallback((): HTMLCanvasElement | null => {
    if (isBakeDirtyRef.current || !offscreenCanvasRef.current) {
      return bakeStaticMap();
    }
    return offscreenCanvasRef.current;
  }, [bakeStaticMap]);

  const markDirty = useCallback(() => {
    isBakeDirtyRef.current = true;
  }, []);

  return {
    getBakedCanvas,
    markDirty,
    bakeVersion,
  };
}
