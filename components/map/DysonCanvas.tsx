'use client';

import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { 
  drawDysonCrosshatch, 
  drawWobblyLine, 
  drawWaterHachure, 
  drawGrassHachure, 
  drawTrapHachure 
} from './dysonCore';
import { Combatant } from '@/lib/types';
import { Cell, TileType } from '../MapMaker';

interface DysonCanvasProps {
  grid: Cell[][];
  bgImageUrl: string | null;
  gridScale: number; // For custom map sizing (CELL_SIZE)
  gridOffsetX: number;
  gridOffsetY: number;
  combatants: Combatant[];
  selectedTool: 'paint' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan';
  selectedTileType: string;
  selectedTokenCombatant: Combatant | null;
  measureStart?: { r: number; c: number } | null;
  setMeasureStart?: React.Dispatch<React.SetStateAction<{ r: number; c: number } | null>>;
  setMeasuredDistance?: React.Dispatch<React.SetStateAction<{ feet: number; meters: number } | null>>;
  onGridChange: (updater: (prev: Cell[][]) => Cell[][]) => void;
  calibrationLine?: { x1: number; y1: number; x2: number; y2: number } | null;
  setCalibrationLine?: (line: { x1: number; y1: number; x2: number; y2: number } | null) => void;
  onCalibrateGridSize?: (size: number) => void;
  isPlayerView?: boolean;
}

export const DysonCanvas: React.FC<DysonCanvasProps> = ({
  grid,
  bgImageUrl,
  gridScale,
  gridOffsetX,
  gridOffsetY,
  selectedTool,
  selectedTileType,
  selectedTokenCombatant,
  measureStart,
  setMeasureStart,
  setMeasuredDistance,
  onGridChange,
  calibrationLine,
  setCalibrationLine,
  onCalibrateGridSize,
  isPlayerView = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawButton, setDrawButton] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number; cell: Cell } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; cell: Cell } | null>(null);
  const [draggingToken, setDraggingToken] = useState<{ name: string, color: string, startR: number, startC: number, currentR: number, currentC: number } | null>(null);

  const gridDims = useRef({ rows: grid.length, cols: grid[0]?.length || 0 });
  const panOffsetRef = useRef(panOffset);

  useEffect(() => {
    gridDims.current = { rows: grid.length, cols: grid[0]?.length || 0 };
  }, [grid]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ width, height });
        }
      }
    });
    resizeObserver.observe(container);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpacePressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Track background image loading
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const CELL_SIZE = bgImageUrl ? gridScale : 40; // larger cell size for procedural Dyson lines
  const COLS = grid[0]?.length || 12;
  const ROWS = grid.length || 12;

  // Track centering flag to only center once per load/scene reset
  const centeredRef = useRef(false);

  useEffect(() => {
    if (centeredRef.current) return;
    if (bgImageUrl && !bgImage) return;

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const canvasWidth = bgImage ? bgImage.width : COLS * CELL_SIZE;
      const canvasHeight = bgImage ? bgImage.height : ROWS * CELL_SIZE;
      
      setPanOffset({
        x: (containerRect.width - canvasWidth) / 2,
        y: (containerRect.height - canvasHeight) / 2,
      });
      centeredRef.current = true;
    }
  }, [bgImage, bgImageUrl, COLS, ROWS, CELL_SIZE]);

  // Reset centering flag when scene coordinates/background URL changes
  useEffect(() => {
    centeredRef.current = false;
  }, [bgImageUrl, COLS, ROWS]);

  useEffect(() => {
    if (bgImageUrl) {
      const img = new Image();
      img.src = bgImageUrl;
      img.onload = () => {
        setBgImage(img);
      };
    } else {
      const timer = setTimeout(() => {
        setBgImage(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [bgImageUrl]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const container = containerRef.current;
    if (!container) return;
    
    const width = canvasSize.width || container.clientWidth;
    const height = canvasSize.height || container.clientHeight;

    // Guard: skip rendering if container has no dimensions yet (e.g. modal not fully mounted)
    if (width <= 0 || height <= 0) return;
    
    // Support dynamic resizing of canvas
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // Viewport Bounding Box Calculation for Culling
    const localLeft = -panOffset.x / zoom;
    const localRight = (-panOffset.x + width) / zoom;
    const localTop = -panOffset.y / zoom;
    const localBottom = (-panOffset.y + height) / zoom;

    const startCol = Math.max(0, Math.floor((localLeft - (bgImage ? gridOffsetX : 0)) / CELL_SIZE) - 1);
    const endCol = Math.min(COLS - 1, Math.ceil((localRight - (bgImage ? gridOffsetX : 0)) / CELL_SIZE) + 1);
    const startRow = Math.max(0, Math.floor((localTop - (bgImage ? gridOffsetY : 0)) / CELL_SIZE) - 1);
    const endRow = Math.min(ROWS - 1, Math.ceil((localBottom - (bgImage ? gridOffsetY : 0)) / CELL_SIZE) + 1);

    ctx.save();
    
    // 1. Draw Map Background (Procedural Dyson or Custom Image)
    if (bgImage) {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      // Draw uploaded background image
      ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height);
    } else {
      // Render Dyson parchment paper color (Infinite)
      ctx.fillStyle = '#fbf9f3';
      ctx.fillRect(0, 0, width, height);
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);

      // Distance transform for walls (optimized for viewport area)
      const distMap: number[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(99));
      const calcStartRow = Math.max(0, startRow - 5);
      const calcEndRow = Math.min(ROWS - 1, endRow + 5);
      const calcStartCol = Math.max(0, startCol - 5);
      const calcEndCol = Math.min(COLS - 1, endCol + 5);

      for (let r = calcStartRow; r <= calcEndRow; r++) {
        for (let c = calcStartCol; c <= calcEndCol; c++) {
          if (grid[r]?.[c] && grid[r][c].type !== 'wall') {
            distMap[r][c] = 0;
          } else {
            let minDist = 99;
            for (let i = -5; i <= 5; i++) {
              for (let j = -5; j <= 5; j++) {
                const nr = r + i;
                const nc = c + j;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                  if (grid[nr]?.[nc] && grid[nr][nc].type !== 'wall') {
                    const d = Math.sqrt(i * i + j * j);
                    if (d < minDist) minDist = d;
                  }
                }
              }
            }
            distMap[r][c] = minDist;
          }
        }
      }

      // Draw Dyson Wall Hachures (Culled)
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (grid[r]?.[c]?.type === 'wall' && distMap[r][c] > 0) {
            drawDysonCrosshatch(ctx, c, r, CELL_SIZE, distMap[r][c]);
          }
        }
      }
      // Draw specialized procedural terrains (Culled)
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          let type = cell.type;
          
          // Camuflagem de portas secretas para jogadores
          if (type === 'door' && cell.doorConfig?.doorType === 'secret' && isPlayerView && !cell.doorConfig?.secretRevealed) {
            type = 'wall';
          }
          // Camuflagem de armadilhas para jogadores
          if (type === 'trap' && isPlayerView && !cell.trapConfig?.revealedToPlayers) {
            type = 'floor';
          }

          if (type && type !== 'wall') {
            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;

            // Limpa o fundo de rocha
            ctx.fillStyle = '#fbf9f3';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

            if (type === 'water') {
              drawWaterHachure(ctx, c, r, CELL_SIZE);
            } else if (type === 'grass') {
              drawGrassHachure(ctx, c, r, CELL_SIZE);
            } else if (type === 'trap') {
              drawTrapHachure(ctx, c, r, CELL_SIZE);
            } else {
              // Terreno normal: grid lines
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
              drawWobblyLine(ctx, x, y, x + CELL_SIZE, y, 0.8, r * 1000 + c);
              drawWobblyLine(ctx, x, y, x, y + CELL_SIZE, 0.8, r * 2000 + c);
            }
          }
        }
      }

      // Draw wall borders (wobbly ink pen lines - Culled)
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          let type = cell.type;
          if (type === 'door' && cell.doorConfig?.doorType === 'secret' && isPlayerView && !cell.doorConfig?.secretRevealed) {
            type = 'wall';
          }
          if (type === 'trap' && isPlayerView && !cell.trapConfig?.revealedToPlayers) {
            type = 'floor';
          }

          if (type && type !== 'wall') {
            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;
            const WALL_THICKNESS = 3.2;

            if (r === 0 || grid[r - 1]?.[c]?.type === 'wall' || (grid[r - 1]?.[c]?.type === 'door' && grid[r - 1]?.[c]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r - 1]?.[c]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x, y, x + CELL_SIZE, y, WALL_THICKNESS, (r * c) + 1);
            }
            if (r === ROWS - 1 || grid[r + 1]?.[c]?.type === 'wall' || (grid[r + 1]?.[c]?.type === 'door' && grid[r + 1]?.[c]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r + 1]?.[c]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x, y + CELL_SIZE, x + CELL_SIZE, y + CELL_SIZE, WALL_THICKNESS, (r * c) + 2);
            }
            if (c === 0 || grid[r]?.[c - 1]?.type === 'wall' || (grid[r]?.[c - 1]?.type === 'door' && grid[r]?.[c - 1]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r]?.[c - 1]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x, y, x, y + CELL_SIZE, WALL_THICKNESS, (r * c) + 3);
            }
            if (c === COLS - 1 || grid[r]?.[c + 1]?.type === 'wall' || (grid[r]?.[c + 1]?.type === 'door' && grid[r]?.[c + 1]?.doorConfig?.doorType === 'secret' && isPlayerView && !grid[r]?.[c + 1]?.doorConfig?.secretRevealed)) {
              drawWobblyLine(ctx, x + CELL_SIZE, y, x + CELL_SIZE, y + CELL_SIZE, WALL_THICKNESS, (r * c) + 4);
            }
          }
        }
      }

      // Draw doors and traps (Culled)
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = grid[r]?.[c];
          if (!cell) continue;

          if (cell.type === 'door') {
            const config = cell.doorConfig;
            const isSecret = config?.doorType === 'secret';
            
            if (isPlayerView && isSecret && !config?.secretRevealed) {
              continue;
            }

            const x = c * CELL_SIZE + CELL_SIZE / 2;
            const y = r * CELL_SIZE + CELL_SIZE / 2;

            ctx.font = `bold ${Math.floor(CELL_SIZE * 0.65)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let label = '🚪';
            if (config?.status === 'open') {
              label = '🔓';
            }
            if (isSecret && !isPlayerView) {
              label = '🚪(S)';
            }

            ctx.lineWidth = 4;
            ctx.strokeStyle = isSecret ? '#ffb74d' : '#ffffff';
            ctx.strokeText(label, x, y);
            
            ctx.fillStyle = isSecret ? '#e65100' : '#1a1a1a';
            ctx.fillText(label, x, y);
          } else if (cell.type === 'trap') {
            const config = cell.trapConfig;
            const isHidden = !config?.revealedToPlayers;
            
            if (isPlayerView && isHidden) {
              continue;
            }

            const x = c * CELL_SIZE + CELL_SIZE / 2;
            const y = r * CELL_SIZE + CELL_SIZE / 2;

            ctx.font = `bold ${Math.floor(CELL_SIZE * 0.65)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let label = '💥';
            if (!isPlayerView && isHidden) {
              label = '⚠️';
            }

            ctx.lineWidth = 4;
            ctx.strokeStyle = isHidden ? '#ef5350' : '#ffffff';
            ctx.strokeText(label, x, y);
            
            ctx.fillStyle = isHidden ? '#c62828' : '#1a1a1a';
            ctx.fillText(label, x, y);
          }
        }
      }
    }

    // 2. Draw Custom Grid Lines (Overlay - Culled)
    if (bgImage) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.0;
      // Verticals
      for (let c = startCol; c <= endCol + 1; c++) {
        const x = gridOffsetX + c * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, Math.max(0, gridOffsetY + startRow * CELL_SIZE));
        ctx.lineTo(x, Math.min(height, gridOffsetY + (endRow + 1) * CELL_SIZE));
        ctx.stroke();
      }
      // Horizontals
      for (let r = startRow; r <= endRow + 1; r++) {
        const y = gridOffsetY + r * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(Math.max(0, gridOffsetX + startCol * CELL_SIZE), y);
        ctx.lineTo(Math.min(width, gridOffsetX + (endCol + 1) * CELL_SIZE), y);
        ctx.stroke();
      }
    }

    ctx.restore(); // Restore to screen space for mask

    // 3. Draw Fog of War & Vision Circles (Destination Out - Culled)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');

    if (maskCtx) {
      // Clear mask canvas (starts fully transparent)
      maskCtx.clearRect(0, 0, width, height);
      maskCtx.translate(panOffset.x, panOffset.y);
      maskCtx.scale(zoom, zoom);

      // 1. Fill entire viewport with dark fog (Opaque for players, semi-transparent for DM)
      maskCtx.fillStyle = isPlayerView ? 'rgba(8, 8, 12, 0.98)' : 'rgba(8, 8, 12, 0.45)';
      const fogMargin = CELL_SIZE * 2;
      maskCtx.fillRect(
        localLeft - fogMargin, 
        localTop - fogMargin, 
        (localRight - localLeft) + fogMargin * 2, 
        (localBottom - localTop) + fogMargin * 2
      );

      maskCtx.globalCompositeOperation = 'destination-out';

      // Pre-create soft brush for performance
      const brushCanvas = document.createElement('canvas');
      const brushSize = CELL_SIZE * 2.8; // diameter for explored cells
      brushCanvas.width = brushSize;
      brushCanvas.height = brushSize;
      const bCtx = brushCanvas.getContext('2d');
      if (bCtx) {
        const grad = bCtx.createRadialGradient(brushSize/2, brushSize/2, 0, brushSize/2, brushSize/2, brushSize/2);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.8)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bCtx.fillStyle = grad;
        bCtx.fillRect(0, 0, brushSize, brushSize);
      }

      // 2. Cut out explored areas using soft brush
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (grid[r]?.[c] && !grid[r][c].fog) {
            const cx = bgImage ? gridOffsetX + c * CELL_SIZE + CELL_SIZE / 2 : c * CELL_SIZE + CELL_SIZE / 2;
            const cy = bgImage ? gridOffsetY + r * CELL_SIZE + CELL_SIZE / 2 : r * CELL_SIZE + CELL_SIZE / 2;
            maskCtx.drawImage(brushCanvas, cx - brushSize/2, cy - brushSize/2);
          }
        }
      }

      // 3. Current token vision (larger dynamic spotlight)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r]?.[c]?.tokenName) {
            const tx = bgImage ? gridOffsetX + c * CELL_SIZE + CELL_SIZE / 2 : c * CELL_SIZE + CELL_SIZE / 2;
            const ty = bgImage ? gridOffsetY + r * CELL_SIZE + CELL_SIZE / 2 : r * CELL_SIZE + CELL_SIZE / 2;
            
            // Draw radial vision gradient (e.g. 4.5-cell radius for spotlight)
            const visionRadius = CELL_SIZE * 4.5;
            const grad = maskCtx.createRadialGradient(tx, ty, CELL_SIZE * 1.5, tx, ty, visionRadius);
            grad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)'); // full reveal
            grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)'); // soft falloff
            grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)'); // transition to fog

            maskCtx.fillStyle = grad;
            maskCtx.beginPath();
            maskCtx.arc(tx, ty, visionRadius, 0, Math.PI * 2);
            maskCtx.fill();
          }
        }
      }

      // Draw the computed fog mask back onto the main canvas
      ctx.drawImage(maskCanvas, 0, 0);
    }

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 4. Draw Tokens (Characters)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell.tokenName) {
          const tx = bgImage ? gridOffsetX + c * CELL_SIZE + CELL_SIZE / 2 : c * CELL_SIZE + CELL_SIZE / 2;
          const ty = bgImage ? gridOffsetY + r * CELL_SIZE + CELL_SIZE / 2 : r * CELL_SIZE + CELL_SIZE / 2;

          // Token border
          ctx.beginPath();
          ctx.arc(tx, ty, CELL_SIZE * 0.4, 0, Math.PI * 2);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#020617';
          ctx.fillStyle = cell.tokenColor?.includes('cyan') ? '#06b6d4' : '#e11d48';
          ctx.fill();
          ctx.stroke();

          // Token text
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.floor(CELL_SIZE * 0.28)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.tokenName, tx, ty);

          // Active indicator pulse
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(tx, ty, CELL_SIZE * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 5. Draw Ruler Measurement
    if (selectedTool === 'measure' && measureStart) {
      const sx = bgImage ? gridOffsetX + measureStart.c * CELL_SIZE + CELL_SIZE / 2 : measureStart.c * CELL_SIZE + CELL_SIZE / 2;
      const sy = bgImage ? gridOffsetY + measureStart.r * CELL_SIZE + CELL_SIZE / 2 : measureStart.r * CELL_SIZE + CELL_SIZE / 2;

      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
    }

    // 6. Draw Grid Calibration Line (Red Line)
    if (selectedTool === 'calibrate' && calibrationLine) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(calibrationLine.x1, calibrationLine.y1);
      ctx.lineTo(calibrationLine.x2, calibrationLine.y2);
      ctx.stroke();

      // anchor points
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(calibrationLine.x1, calibrationLine.y1, 6, 0, Math.PI * 2);
      ctx.arc(calibrationLine.x2, calibrationLine.y2, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [grid, bgImage, CELL_SIZE, COLS, ROWS, gridOffsetX, gridOffsetY, selectedTool, measureStart, calibrationLine, zoom, panOffset, canvasSize, isPlayerView]);

  // Utility to convert client mouse events to Canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffsetRef.current.x) / zoom;
    const y = (e.clientY - rect.top - panOffsetRef.current.y) / zoom;
    return { x, y };
  };

  // Convert Canvas coordinates to grid row and column
  const getGridPos = (x: number, y: number) => {
    const actualX = bgImageUrl ? x - gridOffsetX : x;
    const actualY = bgImageUrl ? y - gridOffsetY : y;

    return {
      c: Math.floor(actualX / CELL_SIZE),
      r: Math.floor(actualY / CELL_SIZE)
    };
  };

  // Dynamic vision reveal function (Euclidean distance for circular shape)
  const revealVisionAround = (gridCopy: Cell[][], row: number, col: number, radius = 2.5) => {
    for (let r = 0; r < gridCopy.length; r++) {
      for (let c = 0; c < (gridCopy[0]?.length || 0); c++) {
        // Euclidean distance for smooth circular exploration state
        const dist = Math.sqrt(Math.pow(r - row, 2) + Math.pow(c - col, 2));
        if (dist <= radius) {
          if (gridCopy[r]?.[c]) {
            gridCopy[r][c].fog = false;
          }
        }
      }
    }
  };

  const moveToken = (tokenName: string, tokenColor: string, targetR: number, targetC: number) => {
    const { rows: currentRows, cols: currentCols } = gridDims.current;
    
    let expandN = 0, expandS = 0, expandW = 0, expandE = 0;
    const margin = 3;
    if (targetR < 0) expandN = Math.abs(targetR) + margin;
    else if (targetR >= currentRows) expandS = (targetR - currentRows) + margin + 1;
    
    if (targetC < 0) expandW = Math.abs(targetC) + margin;
    else if (targetC >= currentCols) expandE = (targetC - currentCols) + margin + 1;
    
    if (expandN > 0 || expandS > 0 || expandW > 0 || expandE > 0) {
      gridDims.current = { 
        rows: currentRows + expandN + expandS, 
        cols: currentCols + expandW + expandE 
      };
      
      if (expandN > 0 || expandW > 0) {
        const dx = expandW * CELL_SIZE * zoom;
        const dy = expandN * CELL_SIZE * zoom;
        panOffsetRef.current = {
          x: panOffsetRef.current.x - dx,
          y: panOffsetRef.current.y - dy
        };
        setPanOffset(panOffsetRef.current);
      }
    }

    onGridChange((prev) => {
      let copy = prev;
      let r = targetR;
      let c = targetC;
      
      if (expandN > 0 || expandS > 0 || expandW > 0 || expandE > 0) {
        const prevRows = copy.length;
        const prevCols = copy[0]?.length || 0;
        const newCols = prevCols + expandW + expandE;
        const newGrid: Cell[][] = [];
        
        for(let i=0; i<expandN; i++) {
           newGrid.push(Array(newCols).fill(null).map((_, idx) => ({ x: idx, y: i, type: 'wall' as const, fog: true })));
        }
        
        for(let i=0; i<prevRows; i++) {
           const row = [];
           for(let j=0; j<expandW; j++) row.push({ x: j, y: i + expandN, type: 'wall' as const, fog: true });
           for(let j=0; j<prevCols; j++) {
              row.push({ ...copy[i][j], x: j + expandW, y: i + expandN });
           }
           for(let j=0; j<expandE; j++) row.push({ x: prevCols + expandW + j, y: i + expandN, type: 'wall' as const, fog: true });
           newGrid.push(row);
        }
        
        for(let i=0; i<expandS; i++) {
           newGrid.push(Array(newCols).fill(null).map((_, idx) => ({ x: idx, y: prevRows + expandN + i, type: 'wall' as const, fog: true })));
        }
        
        copy = newGrid;
      } else {
        copy = copy.map(row => row.map(cell => ({...cell})));
      }
      
      r = targetR + expandN;
      c = targetC + expandW;
      
      for (let rowIdx = 0; rowIdx < copy.length; rowIdx++) {
        for (let colIdx = 0; colIdx < copy[0].length; colIdx++) {
          if (copy[rowIdx][colIdx].tokenName === tokenName) {
            copy[rowIdx][colIdx].tokenName = undefined;
            copy[rowIdx][colIdx].tokenColor = undefined;
          }
        }
      }
      
      if (r >= 0 && r < copy.length && c >= 0 && c < copy[0].length) {
         copy[r][c].tokenName = tokenName;
         copy[r][c].tokenColor = tokenColor;
         revealVisionAround(copy, r, c, 3);
      }
      return copy;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey || selectedTool === 'pan' || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const pos = getGridPos(x, y);

    if (selectedTool === 'calibrate') {
      setIsDrawing(true);
      setCalibrationLine?.({ x1: x, y1: y, x2: x, y2: y });
      return;
    }

    const clickedCell = grid[pos.r]?.[pos.c];
    if (clickedCell && !isPlayerView && (clickedCell.type === 'door' || clickedCell.type === 'trap') && e.button === 0 && !isSpacePressed && selectedTool !== 'measure') {
      const isOverwriting = selectedTool === 'paint' && selectedTileType !== clickedCell.type;
      if (!isOverwriting) {
        setEditingCell({
          r: pos.r,
          c: pos.c,
          cell: clickedCell
        });
        return;
      }
    }

    if (clickedCell && clickedCell.tokenName && e.button === 0 && !isSpacePressed && selectedTool !== 'measure') {
      setDraggingToken({
         name: clickedCell.tokenName,
         color: clickedCell.tokenColor || '',
         startR: pos.r,
         startC: pos.c,
         currentR: pos.r,
         currentC: pos.c
      });
      return;
    }

    setIsDrawing(true);
    setDrawButton(e.button);
    handleCellAction(pos.r, pos.c, e.button, e.type === 'mousedown');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const { x, y } = getCanvasCoords(e);

    if (selectedTool === 'calibrate' && isDrawing && calibrationLine) {
      setCalibrationLine?.({ ...calibrationLine, x2: x, y2: y });
      return;
    }

    const pos = getGridPos(x, y);

    if (!isPlayerView && !isPanning && !draggingToken) {
      const cell = grid[pos.r]?.[pos.c];
      if (cell && (cell.type === 'door' || cell.type === 'trap')) {
        setHoveredCell({
          x: e.clientX,
          y: e.clientY,
          cell
        });
      } else {
        setHoveredCell(null);
      }
    } else {
      setHoveredCell(null);
    }

    if (draggingToken) {
      if (pos.r !== draggingToken.currentR || pos.c !== draggingToken.currentC) {
        moveToken(draggingToken.name, draggingToken.color, pos.r, pos.c);
        setDraggingToken(prev => prev ? { ...prev, currentR: pos.r, currentC: pos.c } : null);
      }
      return;
    }

    if (!isDrawing) return;
    handleCellAction(pos.r, pos.c, drawButton, false);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (draggingToken) {
      setDraggingToken(null);
      setHoveredCell(null);
      return;
    }

    if (selectedTool === 'calibrate' && calibrationLine) {
      const dx = calibrationLine.x2 - calibrationLine.x1;
      const dy = calibrationLine.y2 - calibrationLine.y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 10) {
        onCalibrateGridSize?.(Math.round(length));
      }
      setCalibrationLine?.(null);
    }

    setIsDrawing(false);
    setDrawButton(-1);
  };

  const handleCellAction = (targetR: number, targetC: number, button: number, isInitialClick: boolean) => {
    if (selectedTool === 'measure') {
      if (isInitialClick) {
        if (!measureStart) {
          setMeasureStart?.({ r: targetR, c: targetC });
          setMeasuredDistance?.(null);
        } else {
          const deltaR = Math.abs(targetR - measureStart.r);
          const deltaC = Math.abs(targetC - measureStart.c);
          const gridSteps = Math.max(deltaR, deltaC);
          const feet = gridSteps * 5;
          const meters = parseFloat((feet * 0.3).toFixed(1));
          setMeasuredDistance?.({ feet, meters });
          setMeasureStart?.(null);
        }
      }
      return;
    }

    const { rows: currentRows, cols: currentCols } = gridDims.current;
    
    let expandN = 0, expandS = 0, expandW = 0, expandE = 0;
    const margin = 3;
    if (targetR < 0) expandN = Math.abs(targetR) + margin;
    else if (targetR >= currentRows) expandS = (targetR - currentRows) + margin + 1;
    
    if (targetC < 0) expandW = Math.abs(targetC) + margin;
    else if (targetC >= currentCols) expandE = (targetC - currentCols) + margin + 1;
    
    if (expandN > 0 || expandS > 0 || expandW > 0 || expandE > 0) {
      gridDims.current = { 
        rows: currentRows + expandN + expandS, 
        cols: currentCols + expandW + expandE 
      };
      
      if (expandN > 0 || expandW > 0) {
        const dx = expandW * CELL_SIZE * zoom;
        const dy = expandN * CELL_SIZE * zoom;
        panOffsetRef.current = {
          x: panOffsetRef.current.x - dx,
          y: panOffsetRef.current.y - dy
        };
        setPanOffset(panOffsetRef.current);
      }
    }

    onGridChange((prev) => {
      let copy = prev;
      let r = targetR;
      let c = targetC;
      
      if (expandN > 0 || expandS > 0 || expandW > 0 || expandE > 0) {
        const prevRows = copy.length;
        const prevCols = copy[0]?.length || 0;
        const newCols = prevCols + expandW + expandE;
        const newGrid: Cell[][] = [];
        
        for(let i=0; i<expandN; i++) {
           newGrid.push(Array(newCols).fill(null).map((_, idx) => ({ x: idx, y: i, type: 'wall' as const, fog: true })));
        }
        
        for(let i=0; i<prevRows; i++) {
           const row = [];
           for(let j=0; j<expandW; j++) row.push({ x: j, y: i + expandN, type: 'wall' as const, fog: true });
           for(let j=0; j<prevCols; j++) {
              row.push({ ...copy[i][j], x: j + expandW, y: i + expandN });
           }
           for(let j=0; j<expandE; j++) row.push({ x: prevCols + expandW + j, y: i + expandN, type: 'wall' as const, fog: true });
           newGrid.push(row);
        }
        
        for(let i=0; i<expandS; i++) {
           newGrid.push(Array(newCols).fill(null).map((_, idx) => ({ x: idx, y: prevRows + expandN + i, type: 'wall' as const, fog: true })));
        }
        
        copy = newGrid;
      } else {
        copy = copy.map(row => row.map(cell => ({...cell})));
      }
      
      r = targetR + expandN;
      c = targetC + expandW;
      
      if (r >= 0 && r < copy.length && c >= 0 && c < copy[0].length) {
         const cell = copy[r][c];
         const paintValue = (button === 2) ? 'wall' as const : selectedTileType as TileType;

         if (selectedTool === 'fog-reveal') cell.fog = false;
         else if (selectedTool === 'fog-cover') cell.fog = true;
         else if (selectedTool === 'paint') {
           cell.type = paintValue;
           if (paintValue !== 'wall') cell.fog = false;
           
           if (paintValue === 'door' && !cell.doorConfig) {
             cell.doorConfig = {
               status: 'closed',
               doorType: 'wooden',
               breakDC: 15,
               lockpickDC: 15,
               secretRevealed: false
             };
           }
           if (paintValue === 'trap' && !cell.trapConfig) {
             cell.trapConfig = {
               trapType: 'Armadilha de Agulha',
               detectDC: 15,
               disarmDC: 15,
               revealedToPlayers: false,
               description: 'Causa 1d10 de dano físico e envenenamento se falhar num teste de resistência.'
             };
           }
         } else if (selectedTool === 'token' && selectedTokenCombatant) {
           const nameToClear = selectedTokenCombatant.name.slice(0, 3).toUpperCase();
           for (let rowIdx = 0; rowIdx < copy.length; rowIdx++) {
             for (let colIdx = 0; colIdx < copy[0].length; colIdx++) {
               if (copy[rowIdx][colIdx].tokenName === nameToClear) {
                 copy[rowIdx][colIdx].tokenName = undefined;
                 copy[rowIdx][colIdx].tokenColor = undefined;
               }
             }
           }
           cell.tokenName = nameToClear;
           cell.tokenColor = selectedTokenCombatant.type === 'player' ? 'bg-cyan-500' : 'bg-rose-600';
           revealVisionAround(copy, r, c, 3);
         }
      }
      return copy;
    });
  };

  // Zoom handling using wheel event (centered on mouse cursor)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.08;
    const delta = e.deltaY < 0 ? 1 : -1;

    const prevZoom = zoom;
    const nextZoom = Math.max(0.3, Math.min(prevZoom + delta * zoomIntensity, 3.0));

    // Calculate mouse position relative to the unzoomed canvas space before the zoom change
    const localMouseX = (mouseX - panOffset.x) / prevZoom;
    const localMouseY = (mouseY - panOffset.y) / prevZoom;

    // Adjust panOffset so that the point under the mouse pointer stays in place
    const nextPanOffsetX = mouseX - localMouseX * nextZoom;
    const nextPanOffsetY = mouseY - localMouseY * nextZoom;

    setPanOffset({ x: nextPanOffsetX, y: nextPanOffsetY });
    setZoom(nextZoom);
  };

  const getCursorClass = () => {
    if (selectedTool === 'pan' || isSpacePressed) {
      return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    }
    if (draggingToken) return 'cursor-grabbing';
    if (selectedTool === 'paint') return 'cursor-crosshair';
    return 'cursor-default';
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative ${getCursorClass()} bg-slate-950`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setHoveredCell(null)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-[11px] font-mono text-slate-400 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow flex gap-3 z-20"
      >
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Grid: {CELL_SIZE}px/célula</span>
        <span className="text-slate-500">Mão para mover | Desenhe fora das bordas para expandir</span>
      </div>

      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121824] border border-[#2a3449] w-[340px] rounded-2xl shadow-2xl p-5 select-none animate-fade-in font-sans">
            <div className="flex items-center justify-between border-b border-[#2a3449]/60 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                {editingCell.cell.type === 'door' ? '🚪 Configurar Porta' : '⚠️ Configurar Armadilha'}
              </h3>
              <button 
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {editingCell.cell.type === 'door' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status da Porta</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          doorConfig: {
                            ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                            status: 'open'
                          }
                        }
                      } : null)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        editingCell.cell.doorConfig?.status === 'open'
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                          : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:bg-[#161c28]'
                      }`}
                    >
                      Aberta (Dashed)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          doorConfig: {
                            ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                            status: 'closed'
                          }
                        }
                      } : null)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        editingCell.cell.doorConfig?.status === 'closed' || !editingCell.cell.doorConfig?.status
                          ? 'bg-amber-600 border-amber-500 text-white shadow'
                          : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:bg-[#161c28]'
                      }`}
                    >
                      Fechada (Solid)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Porta (D&D)</label>
                  <select
                    value={editingCell.cell.doorConfig?.doorType || 'wooden'}
                    onChange={(e) => {
                      const t = e.target.value as 'wooden' | 'iron' | 'stone' | 'secret';
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          doorConfig: {
                            ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                            doorType: t
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="wooden">Madeira Seca (CD 13)</option>
                    <option value="iron">Ferro Reforçado (CD 18)</option>
                    <option value="stone">Pedra Pesada (CD 20)</option>
                    <option value="secret">Secreta (Oculta)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔨 CD Arrombar</label>
                    <input
                      type="number"
                      value={editingCell.cell.doorConfig?.breakDC ?? 15}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            doorConfig: {
                              ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                              breakDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔑 CD Lockpick</label>
                    <input
                      type="number"
                      value={editingCell.cell.doorConfig?.lockpickDC ?? 15}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            doorConfig: {
                              ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                              lockpickDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {editingCell.cell.doorConfig?.doorType === 'secret' && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="secretRevealedCheck"
                      checked={editingCell.cell.doorConfig?.secretRevealed || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            doorConfig: {
                              ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                              secretRevealed: checked
                            }
                          }
                        } : null);
                      }}
                      className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                    />
                    <label htmlFor="secretRevealedCheck" className="text-xs text-slate-300 cursor-pointer">Revelada aos Jogadores</label>
                  </div>
                )}
              </div>
            )}

            {editingCell.cell.type === 'trap' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome/Tipo da Armadilha</label>
                  <input
                    type="text"
                    value={editingCell.cell.trapConfig?.trapType || 'Armadilha'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          trapConfig: {
                            ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                            trapType: val
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">👁️ CD Percepção</label>
                    <input
                      type="number"
                      value={editingCell.cell.trapConfig?.detectDC ?? 15}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            trapConfig: {
                              ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                              detectDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔧 CD Desarmar</label>
                    <input
                      type="number"
                      value={editingCell.cell.trapConfig?.disarmDC ?? 15}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            trapConfig: {
                              ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                              disarmDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Descrição / Efeitos</label>
                  <textarea
                    rows={2}
                    value={editingCell.cell.trapConfig?.description || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          trapConfig: {
                            ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                            description: val
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="trapRevealedCheck"
                    checked={editingCell.cell.trapConfig?.revealedToPlayers || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          trapConfig: {
                            ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                            revealedToPlayers: checked
                          }
                        }
                      } : null);
                    }}
                    className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                  />
                  <label htmlFor="trapRevealedCheck" className="text-xs text-slate-300 cursor-pointer">Revelada aos Jogadores</label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-5 border-t border-[#2a3449]/40 pt-3.5">
              <button
                type="button"
                onClick={() => {
                  onGridChange((prev) => {
                    const copy = prev.map(row => row.map(cell => ({ ...cell })));
                    const cell = copy[editingCell.r][editingCell.c];
                    if (editingCell.cell.type === 'door') {
                      cell.doorConfig = editingCell.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 };
                    } else if (editingCell.cell.type === 'trap') {
                      cell.trapConfig = editingCell.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false };
                    }
                    return copy;
                  });
                  setEditingCell(null);
                  toast.success('Alterações salvas no grid.');
                }}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all text-center shadow-md cursor-pointer"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  onGridChange((prev) => {
                    const copy = prev.map(row => row.map(cell => ({ ...cell })));
                    copy[editingCell.r][editingCell.c].type = 'floor';
                    copy[editingCell.r][editingCell.c].doorConfig = undefined;
                    copy[editingCell.r][editingCell.c].trapConfig = undefined;
                    return copy;
                  });
                  setEditingCell(null);
                  toast.success('Terreno removido.');
                }}
                className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-300 font-semibold rounded-lg text-xs transition-all text-center cursor-pointer font-sans"
              >
                Remover
              </button>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="py-2 px-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-slate-300 font-semibold rounded-lg text-xs transition-all text-center cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {hoveredCell && !editingCell && (
        <div 
          className="fixed pointer-events-none z-40 bg-[#0d1117]/95 border border-[#30363d] rounded-xl shadow-2xl p-3 w-[240px] text-xs font-sans text-slate-200 backdrop-blur-md animate-fade-in"
          style={{ 
            left: `${hoveredCell.x + 15}px`, 
            top: `${hoveredCell.y + 15}px` 
          }}
        >
          {hoveredCell.cell.type === 'door' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <span>🚪 Porta de {
                  hoveredCell.cell.doorConfig?.doorType === 'wooden' ? 'Madeira' :
                  hoveredCell.cell.doorConfig?.doorType === 'iron' ? 'Ferro' :
                  hoveredCell.cell.doorConfig?.doorType === 'stone' ? 'Pedra' : 'Segredo (Secreta)'
                }</span>
              </div>
              <div className="pt-1 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado:</span>
                  <span className={`font-bold ${hoveredCell.cell.doorConfig?.status === 'open' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hoveredCell.cell.doorConfig?.status === 'open' ? 'Aberta' : 'Fechada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CD Arrombar:</span>
                  <span className="font-mono font-bold text-slate-300">{hoveredCell.cell.doorConfig?.breakDC ?? 15}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CD Lockpick:</span>
                  <span className="font-mono font-bold text-slate-300">{hoveredCell.cell.doorConfig?.lockpickDC ?? 15}</span>
                </div>
                {hoveredCell.cell.doorConfig?.doorType === 'secret' && (
                  <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-0.5">
                    <span className="text-slate-400">Visível aos Jogadores:</span>
                    <span className={`font-bold ${hoveredCell.cell.doorConfig?.secretRevealed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {hoveredCell.cell.doorConfig?.secretRevealed ? 'Sim' : 'Não'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {hoveredCell.cell.type === 'trap' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-800">
                <span className="text-rose-400">⚠️ {hoveredCell.cell.trapConfig?.trapType || 'Armadilha'}</span>
              </div>
              <div className="pt-1 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">CD Percepção:</span>
                  <span className="font-mono font-bold text-slate-300">{hoveredCell.cell.trapConfig?.detectDC ?? 15}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CD Desarmar:</span>
                  <span className="font-mono font-bold text-slate-300">{hoveredCell.cell.trapConfig?.disarmDC ?? 15}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-0.5">
                  <span className="text-slate-400">Revelada aos Jogadores:</span>
                  <span className={`font-bold ${hoveredCell.cell.trapConfig?.revealedToPlayers ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredCell.cell.trapConfig?.revealedToPlayers ? 'Sim' : 'Não'}
                  </span>
                </div>
                {hoveredCell.cell.trapConfig?.description && (
                  <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/50 mt-1 leading-relaxed">
                    {hoveredCell.cell.trapConfig.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
