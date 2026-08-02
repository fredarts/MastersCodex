'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Ruler, 
  Check, 
  CheckCircle2, 
  X, 
  Undo2, 
  ArrowRight, 
  Footprints, 
  Maximize2 
} from 'lucide-react';
import { 
  drawDysonCrosshatch, 
  drawWobblyLine, 
  drawWaterHachure, 
  drawGrassHachure, 
  drawTrapHachure 
} from './dysonCore';
import { 
  hasLineOfSight, 
  isCellBlockingVision,
  revealVisionWithLOS, 
  computeVisibilityPolygon, 
  getTokenVisionRadius 
} from './visionCore';
import { Combatant } from '@/lib/types';
import { Cell, TileType } from '../MapMaker';

export interface RulerPoint {
  r: number;
  c: number;
}

export interface RulerSegment {
  from: RulerPoint;
  to: RulerPoint;
  steps: number;
  feet: number;
  meters: number;
}

interface DysonCanvasProps {
  grid: Cell[][];
  bgImageUrl: string | null;
  gridScale: number; // For custom map sizing (CELL_SIZE)
  gridOffsetX: number;
  gridOffsetY: number;
  combatants: Combatant[];
  selectedTool: 'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan';
  setSelectedTool?: (tool: 'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan') => void;
  boxMode?: 'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover';
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
  setSelectedTool,
  boxMode = 'fill',
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
  combatants,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawButton, setDrawButton] = useState(-1);
  const [selectionBox, setSelectionBox] = useState<{ startR: number; startC: number; currentR: number; currentC: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number; cell: Cell } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; cell: Cell } | null>(null);
  const [draggingToken, setDraggingToken] = useState<{ name: string, color: string, startR: number, startC: number, currentR: number, currentC: number } | null>(null);

  // Advanced Multi-Point Ruler State
  const [rulerPoints, setRulerPoints] = useState<RulerPoint[]>([]);
  const [rulerCursor, setRulerCursor] = useState<RulerPoint | null>(null);
  const [rulerStatus, setRulerStatus] = useState<'idle' | 'measuring' | 'completed'>('idle');
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const rulerDragStartCell = useRef<RulerPoint | null>(null);

  const gridDims = useRef({ rows: grid.length, cols: grid[0]?.length || 0 });
  const panOffsetRef = useRef(panOffset);
  const selectedToolRef = useRef(selectedTool);
  const rulerPointsRef = useRef(rulerPoints);
  const rulerCursorRef = useRef(rulerCursor);
  const rulerStatusRef = useRef(rulerStatus);

  useEffect(() => {
    gridDims.current = { rows: grid.length, cols: grid[0]?.length || 0 };
  }, [grid]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    selectedToolRef.current = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    rulerPointsRef.current = rulerPoints;
  }, [rulerPoints]);

  useEffect(() => {
    rulerCursorRef.current = rulerCursor;
  }, [rulerCursor]);

  useEffect(() => {
    rulerStatusRef.current = rulerStatus;
  }, [rulerStatus]);

  // Orthogonal Path & Distance helpers (Strict non-diagonal movement for D&D 5e)
  const calculateSegmentDistance = (from: RulerPoint, to: RulerPoint) => {
    const deltaR = Math.abs(to.r - from.r);
    const deltaC = Math.abs(to.c - from.c);
    // Strict Manhattan/Orthogonal distance (horizontal + vertical steps only, no diagonal cuts)
    const steps = deltaR + deltaC;
    const feet = steps * 5;
    const meters = parseFloat((feet * 0.3).toFixed(1));
    return { steps, feet, meters, deltaR, deltaC };
  };

  const getOrthogonalPath = (from: RulerPoint, to: RulerPoint): RulerPoint[] => {
    if (from.r === to.r || from.c === to.c) {
      return [to];
    }
    // Decompose diagonal movement into an orthogonal L-shaped corner
    const deltaR = Math.abs(to.r - from.r);
    const deltaC = Math.abs(to.c - from.c);
    // If horizontal delta is larger or equal, move horizontal first, then vertical
    const corner: RulerPoint = deltaC >= deltaR
      ? { r: from.r, c: to.c }
      : { r: to.r, c: from.c };
    return [corner, to];
  };

  const getRulerSummary = (points: RulerPoint[], liveCursor: RulerPoint | null, isMeasuring: boolean) => {
    let activePoints = [...points];
    if (isMeasuring && liveCursor && activePoints.length > 0) {
      const lastPt = activePoints[activePoints.length - 1];
      if (liveCursor.r !== lastPt.r || liveCursor.c !== lastPt.c) {
        const added = getOrthogonalPath(lastPt, liveCursor);
        activePoints = [...activePoints, ...added];
      }
    }

    const segments: RulerSegment[] = [];
    let totalSteps = 0;
    let totalFeet = 0;
    let totalMeters = 0;

    for (let i = 0; i < activePoints.length - 1; i++) {
      const seg = calculateSegmentDistance(activePoints[i], activePoints[i + 1]);
      segments.push({
        from: activePoints[i],
        to: activePoints[i + 1],
        steps: seg.steps,
        feet: seg.feet,
        meters: seg.meters,
      });
      totalSteps += seg.steps;
      totalFeet += seg.feet;
      totalMeters += seg.meters;
    }

    return {
      activePoints,
      segments,
      totalSteps,
      totalFeet,
      totalMeters: parseFloat(totalMeters.toFixed(1)),
    };
  };

  const handleFinishRuler = () => {
    const currentPoints = rulerPointsRef.current;
    
    if (currentPoints.length === 0) return;

    let finalPoints = [...currentPoints];
    
    // Only if there is only 1 point defined and user hasn't clicked/dragged a 2nd point yet
    if (finalPoints.length === 1) {
      const currentCursor = rulerCursorRef.current;
      if (
        currentCursor &&
        (currentCursor.r !== finalPoints[0].r || currentCursor.c !== finalPoints[0].c)
      ) {
        const added = getOrthogonalPath(finalPoints[0], currentCursor);
        finalPoints = [...finalPoints, ...added];
      }
    }

    if (finalPoints.length < 2) {
      toast.info('Selecione ao menos 2 pontos para medir a rota.');
      return;
    }

    setRulerPoints(finalPoints);
    setRulerStatus('completed');
    setIsRulerDragging(false);

    const summary = getRulerSummary(finalPoints, null, false);
    setMeasuredDistance?.({ feet: summary.totalFeet, meters: summary.totalMeters });
    toast.success(`Medição finalizada: ${summary.totalFeet}ft (${summary.totalMeters}m) • ${summary.totalSteps} casas`);
  };

  const handleUndoRulerPoint = () => {
    if (rulerPointsRef.current.length > 1) {
      const updated = rulerPointsRef.current.slice(0, -1);
      setRulerPoints(updated);
      if (rulerStatusRef.current === 'completed') {
        setRulerStatus('measuring');
      }
      const summary = getRulerSummary(updated, null, false);
      setMeasuredDistance?.({ feet: summary.totalFeet, meters: summary.totalMeters });
    } else {
      handleResetRuler();
    }
  };

  const handleResetRuler = () => {
    setRulerPoints([]);
    setRulerCursor(null);
    setRulerStatus('idle');
    setIsRulerDragging(false);
    rulerDragStartCell.current = null;
    setMeasureStart?.(null);
    setMeasuredDistance?.(null);
  };

  const handleExitRuler = () => {
    handleResetRuler();
    if (setSelectedTool) {
      setSelectedTool('token');
    }
  };

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
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' && !e.repeat) {
        if (selectedToolRef.current !== 'measure') {
          e.preventDefault();
          setIsSpacePressed(true);
        }
      }

      if (selectedToolRef.current === 'measure') {
        if (rulerStatusRef.current === 'measuring') {
          if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            handleFinishRuler();
          } else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            handleUndoRulerPoint();
          }
        } else if (rulerStatusRef.current === 'completed') {
          if (e.key === 'Escape' || e.key === 'Enter' || e.code === 'Space') {
            e.preventDefault();
            handleExitRuler();
          }
        } else if (rulerStatusRef.current === 'idle') {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleExitRuler();
          }
        }
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

      // Use destination-out to carve visibility out of the dark fog
      maskCtx.globalCompositeOperation = 'destination-out';

      // Soft smoky blur filter for organic misty fog edges
      maskCtx.filter = 'blur(6px)';

      // 2. Cut out explored areas (soft rounded blending so it feels smoky, not grid-locked)
      maskCtx.fillStyle = 'rgba(0, 0, 0, 1)';
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          if (grid[r]?.[c] && !grid[r][c].fog) {
            const cx = bgImage ? gridOffsetX + c * CELL_SIZE + CELL_SIZE / 2 : c * CELL_SIZE + CELL_SIZE / 2;
            const cy = bgImage ? gridOffsetY + r * CELL_SIZE + CELL_SIZE / 2 : r * CELL_SIZE + CELL_SIZE / 2;
            maskCtx.beginPath();
            maskCtx.arc(cx, cy, CELL_SIZE * 0.72, 0, Math.PI * 2);
            maskCtx.fill();
          }
        }
      }

      // 3. Current token active vision (Godot-like Light2D spotlight with soft smoky falloff and wall LOS)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r]?.[c]?.tokenName) {
            const isPlayerToken = grid[r][c].tokenColor?.includes('cyan') || 
                                  combatants?.find((comb: Combatant) => comb.name.slice(0, 3).toUpperCase() === grid[r][c].tokenName?.toUpperCase())?.type === 'player';
            
            // In player view, only player tokens project active line-of-sight vision.
            if (isPlayerView && !isPlayerToken) {
              continue;
            }

            const tx = bgImage ? gridOffsetX + c * CELL_SIZE + CELL_SIZE / 2 : c * CELL_SIZE + CELL_SIZE / 2;
            const ty = bgImage ? gridOffsetY + r * CELL_SIZE + CELL_SIZE / 2 : r * CELL_SIZE + CELL_SIZE / 2;
            
            const visionRadius = getTokenVisionRadius(grid[r][c].tokenName, combatants) * CELL_SIZE;

            const polyPoints = computeVisibilityPolygon(
              tx, 
              ty, 
              visionRadius, 
              grid, 
              CELL_SIZE, 
              gridOffsetX, 
              gridOffsetY, 
              Boolean(bgImage)
            );

            if (polyPoints.length > 0) {
              maskCtx.save();
              maskCtx.beginPath();
              maskCtx.moveTo(polyPoints[0].x, polyPoints[0].y);
              for (let p = 1; p < polyPoints.length; p++) {
                maskCtx.lineTo(polyPoints[p].x, polyPoints[p].y);
              }
              maskCtx.closePath();

              // Smooth radial light gradient with soft outer falloff
              const grad = maskCtx.createRadialGradient(tx, ty, CELL_SIZE * 0.5, tx, ty, visionRadius);
              grad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)'); // full reveal near token
              grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)'); // soft falloff
              grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)'); // smoky outer transition

              maskCtx.fillStyle = grad;
              maskCtx.fill();
              maskCtx.restore();
            }
          }
        }
      }

      // Reset filter
      maskCtx.filter = 'none';

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
          const isPlayerToken = cell.tokenColor?.includes('cyan') || 
                                combatants?.find((comb: Combatant) => comb.name.slice(0, 3).toUpperCase() === cell.tokenName?.toUpperCase())?.type === 'player';

          // Hide tokens from players if not within active line of sight / explored areas
          if (isPlayerView) {
            if (isPlayerToken) {
              if (cell.fog) continue;
            } else {
              if (!isCellVisibleToPlayers(c, r)) continue;
            }
          }

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
    if (selectedTool === 'measure' && rulerPoints.length > 0) {
      const isMeasuring = rulerStatus === 'measuring';
      const hasLiveCursor = isMeasuring && rulerCursor && (
        rulerCursor.r !== rulerPoints[rulerPoints.length - 1].r || 
        rulerCursor.c !== rulerPoints[rulerPoints.length - 1].c
      );

      const getPointCoords = (pt: { r: number; c: number }) => {
        const x = (bgImage ? gridOffsetX + pt.c * CELL_SIZE : pt.c * CELL_SIZE) + CELL_SIZE / 2;
        const y = (bgImage ? gridOffsetY + pt.r * CELL_SIZE : pt.r * CELL_SIZE) + CELL_SIZE / 2;
        return { x, y };
      };

      // 5.A. Draw all confirmed segments
      for (let i = 0; i < rulerPoints.length - 1; i++) {
        const p1 = getPointCoords(rulerPoints[i]);
        const p2 = getPointCoords(rulerPoints[i + 1]);
        const segDist = calculateSegmentDistance(rulerPoints[i], rulerPoints[i + 1]);

        // Outer glow
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12 / zoom;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = Math.max(5, 7 / zoom);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();

        // Core solid neon line
        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = Math.max(2.5, 3.5 / zoom);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();

        // Segment distance badge at midpoint
        if (segDist.steps > 0) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const badgeText = `${segDist.feet}ft`;
          ctx.save();
          ctx.font = `bold ${Math.max(10, 11 / zoom)}px Inter, sans-serif`;
          const textWidth = ctx.measureText(badgeText).width;
          const padX = 5 / zoom;
          const padY = 2.5 / zoom;
          const boxW = textWidth + padX * 2;
          const boxH = (14 / zoom) + padY;

          ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
          ctx.strokeStyle = '#0891b2';
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.roundRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH, 3 / zoom);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#67e8f9';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, midX, midY);
          ctx.restore();
        }
      }

      // 5.B. Draw live preview segment to cursor (Orthogonal / L-shaped)
      if (hasLiveCursor && rulerCursor) {
        const lastPt = rulerPoints[rulerPoints.length - 1];
        const previewNodes = getOrthogonalPath(lastPt, rulerCursor);
        const previewPoints = [lastPt, ...previewNodes];
        const liveDist = calculateSegmentDistance(lastPt, rulerCursor);

        // Dashed preview lines following orthogonal grid lines
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2, 3 / zoom);
        ctx.setLineDash([8 / zoom, 5 / zoom]);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const startCoord = getPointCoords(previewPoints[0]);
        ctx.moveTo(startCoord.x, startCoord.y);
        for (let i = 1; i < previewPoints.length; i++) {
          const ptCoord = getPointCoords(previewPoints[i]);
          ctx.lineTo(ptCoord.x, ptCoord.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // If orthogonal preview creates an intermediate corner, draw corner hint
        if (previewPoints.length > 2) {
          const cornerCoord = getPointCoords(previewPoints[1]);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cornerCoord.x, cornerCoord.y, Math.max(3, 4.5 / zoom), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1 / zoom;
          ctx.stroke();
          ctx.restore();
        }

        // Live segment badge
        if (liveDist.steps > 0) {
          const curP = getPointCoords(rulerCursor);
          const midX = (startCoord.x + curP.x) / 2;
          const midY = (startCoord.y + curP.y) / 2;
          const badgeText = `+${liveDist.feet}ft`;
          ctx.save();
          ctx.font = `bold ${Math.max(10, 11 / zoom)}px Inter, sans-serif`;
          const textWidth = ctx.measureText(badgeText).width;
          const padX = 5 / zoom;
          const padY = 2.5 / zoom;
          const boxW = textWidth + padX * 2;
          const boxH = (14 / zoom) + padY;

          ctx.fillStyle = 'rgba(12, 74, 96, 0.92)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.roundRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH, 3 / zoom);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#bae6fd';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, midX, midY);
          ctx.restore();
        }
      }

      // 5.C. Draw Waypoint Nodes
      rulerPoints.forEach((pt, idx) => {
        const coord = getPointCoords(pt);
        const isStart = idx === 0;
        const isEnd = idx === rulerPoints.length - 1 && !hasLiveCursor;

        ctx.save();
        if (isStart) {
          // Start node: emerald ring
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, Math.max(6, 8 / zoom), 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#022c22';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();

          // Inner dot
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, Math.max(2.5, 3.5 / zoom), 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Label
          ctx.font = `bold ${Math.max(9, 10 / zoom)}px Inter, sans-serif`;
          ctx.fillStyle = '#a7f3d0';
          ctx.textAlign = 'center';
          ctx.fillText('Início', coord.x, coord.y - (12 / zoom));
        } else if (isEnd) {
          // Final node
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, Math.max(7, 9 / zoom), 0, Math.PI * 2);
          ctx.fillStyle = '#06b6d4';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();

          // Target bullseye
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, Math.max(3, 4 / zoom), 0, Math.PI * 2);
          ctx.fillStyle = '#083344';
          ctx.fill();

          ctx.font = `bold ${Math.max(9, 10 / zoom)}px Inter, sans-serif`;
          ctx.fillStyle = '#67e8f9';
          ctx.textAlign = 'center';
          ctx.fillText('Fim', coord.x, coord.y - (12 / zoom));
        } else {
          // Intermediate curve node
          ctx.beginPath();
          ctx.arc(coord.x, coord.y, Math.max(4, 5.5 / zoom), 0, Math.PI * 2);
          ctx.fillStyle = '#0891b2';
          ctx.fill();
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();

          // Mini index
          ctx.font = `bold ${Math.max(8, 9 / zoom)}px Inter, sans-serif`;
          ctx.fillStyle = '#e0f2fe';
          ctx.textAlign = 'center';
          ctx.fillText(`${idx}`, coord.x, coord.y - (9 / zoom));
        }
        ctx.restore();
      });

      // 5.D. Draw live cursor node
      if (hasLiveCursor && rulerCursor) {
        const curP = getPointCoords(rulerCursor);
        ctx.save();
        ctx.beginPath();
        ctx.arc(curP.x, curP.y, Math.max(6, 8 / zoom), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        // Reticle crosshair
        const crossSize = 10 / zoom;
        ctx.beginPath();
        ctx.moveTo(curP.x - crossSize, curP.y);
        ctx.lineTo(curP.x + crossSize, curP.y);
        ctx.moveTo(curP.x, curP.y - crossSize);
        ctx.lineTo(curP.x, curP.y + crossSize);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
        ctx.restore();
      }
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

    // 7. Draw Rectangle Selection Box Overlay
    if (selectedTool === 'box' && selectionBox) {
      const minR = Math.min(selectionBox.startR, selectionBox.currentR);
      const maxR = Math.max(selectionBox.startR, selectionBox.currentR);
      const minC = Math.min(selectionBox.startC, selectionBox.currentC);
      const maxC = Math.max(selectionBox.startC, selectionBox.currentC);

      const bx = bgImage ? gridOffsetX + minC * CELL_SIZE : minC * CELL_SIZE;
      const by = bgImage ? gridOffsetY + minR * CELL_SIZE : minR * CELL_SIZE;
      const bw = (maxC - minC + 1) * CELL_SIZE;
      const bh = (maxR - minR + 1) * CELL_SIZE;

      // Fill translucent preview
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(bx, by, bw, bh);

      // Dashed border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1.5, 2 / zoom);
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      // Corner handles
      ctx.fillStyle = '#f59e0b';
      const handleSize = Math.max(4, 6 / zoom);
      ctx.fillRect(bx - handleSize / 2, by - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(bx + bw - handleSize / 2, by - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(bx - handleSize / 2, by + bh - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(bx + bw - handleSize / 2, by + bh - handleSize / 2, handleSize, handleSize);

      // Dimensions badge
      const countW = maxC - minC + 1;
      const countH = maxR - minR + 1;
      const feetW = countW * 5;
      const feetH = countH * 5;
      const badgeText = `${countW}x${countH} (${feetW}ft x ${feetH}ft)`;

      ctx.font = `bold ${Math.max(11, 13 / zoom)}px Inter, sans-serif`;
      const textWidth = ctx.measureText(badgeText).width;
      const badgePadX = 6 / zoom;
      const badgePadY = 3 / zoom;
      const badgeX = bx + bw / 2 - textWidth / 2 - badgePadX;
      const badgeY = by - (18 / zoom);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, textWidth + badgePadX * 2, (16 / zoom) + badgePadY, 4 / zoom);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(badgeText, badgeX + badgePadX, badgeY + badgePadY);
    }

    ctx.restore();
  }, [grid, bgImage, CELL_SIZE, COLS, ROWS, gridOffsetX, gridOffsetY, selectedTool, selectionBox, measureStart, calibrationLine, rulerPoints, rulerCursor, rulerStatus, zoom, panOffset, canvasSize, isPlayerView]);

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

  const isCellVisibleToPlayers = (col: number, row: number): boolean => {
    if (!isPlayerView) return true;
    
    const playerTokens: { r: number; c: number; visionRadius: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell.tokenName) {
          const isPlayer = cell.tokenColor?.includes('cyan') || 
                           combatants?.find((comb: Combatant) => comb.name.slice(0, 3).toUpperCase() === cell.tokenName?.toUpperCase())?.type === 'player';
          if (isPlayer) {
            playerTokens.push({
              r,
              c,
              visionRadius: getTokenVisionRadius(cell.tokenName, combatants)
            });
          }
        }
      }
    }
    
    if (playerTokens.length === 0) {
      return grid[row]?.[col] ? !grid[row][col].fog : false;
    }
    
    for (const pt of playerTokens) {
      const dist = Math.sqrt(Math.pow(row - pt.r, 2) + Math.pow(col - pt.c, 2));
      if (dist > pt.visionRadius) continue;
      if (hasLineOfSight(pt.c, pt.r, col, row, grid)) {
        return true;
      }
    }
    return false;
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
         revealVisionWithLOS(copy, r, c, getTokenVisionRadius(tokenName, combatants));
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

    if (selectedTool === 'box') {
      setIsDrawing(true);
      setDrawButton(e.button);
      setSelectionBox({
        startR: pos.r,
        startC: pos.c,
        currentR: pos.r,
        currentC: pos.c
      });
      return;
    }

    const clickedCell = grid[pos.r]?.[pos.c];

    if (selectedTool === 'measure') {
      if (e.button === 0) {
        if (rulerStatus === 'completed') {
          // Fresh measurement starting from this click
          setRulerPoints([pos]);
          setRulerStatus('measuring');
          setIsRulerDragging(true);
          rulerDragStartCell.current = pos;
          setMeasureStart?.(pos);
          setMeasuredDistance?.(null);
          return;
        }

        if (rulerStatus === 'idle' || rulerPoints.length === 0) {
          setRulerPoints([pos]);
          setRulerStatus('measuring');
          setIsRulerDragging(true);
          rulerDragStartCell.current = pos;
          setMeasureStart?.(pos);
          setMeasuredDistance?.(null);
          return;
        }

        if (rulerStatus === 'measuring') {
          const lastPoint = rulerPoints[rulerPoints.length - 1];
          if (pos.r === lastPoint.r && pos.c === lastPoint.c) {
            // Clicked directly on the end point to finalize
            if (rulerPoints.length >= 2) {
              handleFinishRuler();
            }
          } else {
            // Add orthogonal waypoint(s) (L-shaped if diagonal)
            const added = getOrthogonalPath(lastPoint, pos);
            const newPoints = [...rulerPoints, ...added];
            setRulerPoints(newPoints);
            setIsRulerDragging(true);
            rulerDragStartCell.current = pos;
            const summary = getRulerSummary(newPoints, null, false);
            setMeasuredDistance?.({ feet: summary.totalFeet, meters: summary.totalMeters });
          }
          return;
        }
      }
      return;
    }

    // Token drag takes priority over door/trap editing
    if (clickedCell && clickedCell.tokenName && e.button === 0 && !isSpacePressed) {
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

    if (clickedCell && !isPlayerView && (clickedCell.type === 'door' || clickedCell.type === 'trap') && e.button === 0 && !isSpacePressed) {
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

    if (selectedTool === 'measure') {
      setRulerCursor(pos);
      if (rulerStatus === 'measuring' && rulerPoints.length > 0) {
        const liveSummary = getRulerSummary(rulerPoints, pos, true);
        setMeasuredDistance?.({ feet: liveSummary.totalFeet, meters: liveSummary.totalMeters });
      }
    }

    if (selectedTool === 'box' && isDrawing && selectionBox) {
      setSelectionBox(prev => prev ? { ...prev, currentR: pos.r, currentC: pos.c } : null);
      return;
    }

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
        // Block movement into walls or closed doors
        const targetCell = grid[pos.r]?.[pos.c];
        if (isCellBlockingVision(targetCell)) {
          return;
        }
        // Block movement through walls diagonally (no jumping over corners)
        if (!hasLineOfSight(draggingToken.currentC, draggingToken.currentR, pos.c, pos.r, grid)) {
          return;
        }
        moveToken(draggingToken.name, draggingToken.color, pos.r, pos.c);
        setDraggingToken(prev => prev ? { ...prev, currentR: pos.r, currentC: pos.c } : null);
      }
      return;
    }

    if (!isDrawing) return;
    handleCellAction(pos.r, pos.c, drawButton, false);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (draggingToken) {
      setDraggingToken(null);
      setHoveredCell(null);
      return;
    }

    const { x, y } = getCanvasCoords(e);
    const pos = getGridPos(x, y);

    if (selectedTool === 'measure') {
      if (isRulerDragging) {
        setIsRulerDragging(false);
        if (rulerDragStartCell.current) {
          const dragStart = rulerDragStartCell.current;
          const wasDraggedToNewCell = (pos.r !== dragStart.r || pos.c !== dragStart.c);
          if (wasDraggedToNewCell) {
            if (rulerPoints.length === 1 && rulerPoints[0].r === dragStart.r && rulerPoints[0].c === dragStart.c) {
              const added = getOrthogonalPath(dragStart, pos);
              const newPoints = [dragStart, ...added];
              setRulerPoints(newPoints);
              const summary = getRulerSummary(newPoints, null, false);
              setMeasuredDistance?.({ feet: summary.totalFeet, meters: summary.totalMeters });
            } else if (rulerPoints.length > 1) {
              const lastPt = rulerPoints[rulerPoints.length - 1];
              if (pos.r !== lastPt.r || pos.c !== lastPt.c) {
                const added = getOrthogonalPath(lastPt, pos);
                const newPoints = [...rulerPoints, ...added];
                setRulerPoints(newPoints);
                const summary = getRulerSummary(newPoints, null, false);
                setMeasuredDistance?.({ feet: summary.totalFeet, meters: summary.totalMeters });
              }
            }
          }
          rulerDragStartCell.current = null;
        }
      }
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

    if (selectedTool === 'box' && selectionBox) {
      handleBoxAction(selectionBox, drawButton);
      setSelectionBox(null);
    }

    setIsDrawing(false);
    setDrawButton(-1);
  };

  const handleCellAction = (targetR: number, targetC: number, button: number, isInitialClick: boolean) => {
    if (selectedTool === 'measure') {
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
           revealVisionWithLOS(copy, r, c, getTokenVisionRadius(selectedTokenCombatant.name, combatants));
         }
      }
      return copy;
    });
  };

  const handleBoxAction = (box: { startR: number; startC: number; currentR: number; currentC: number }, button: number) => {
    const minR = Math.min(box.startR, box.currentR);
    const maxR = Math.max(box.startR, box.currentR);
    const minC = Math.min(box.startC, box.currentC);
    const maxC = Math.max(box.startC, box.currentC);

    const { rows: currentRows, cols: currentCols } = gridDims.current;
    
    let expandN = 0, expandS = 0, expandW = 0, expandE = 0;
    const margin = 3;
    if (minR < 0) expandN = Math.abs(minR) + margin;
    if (maxR >= currentRows) expandS = (maxR - currentRows) + margin + 1;
    
    if (minC < 0) expandW = Math.abs(minC) + margin;
    if (maxC >= currentCols) expandE = (maxC - currentCols) + margin + 1;
    
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

      const startR = minR + expandN;
      const endR = maxR + expandN;
      const startC = minC + expandW;
      const endC = maxC + expandW;

      const paintValue = (button === 2) ? 'wall' as const : selectedTileType as TileType;

      for (let r = Math.max(0, startR); r <= Math.min(copy.length - 1, endR); r++) {
        for (let c = Math.max(0, startC); c <= Math.min((copy[0]?.length || 1) - 1, endC); c++) {
          const isBorder = (r === startR || r === endR || c === startC || c === endC);
          const cell = copy[r][c];

          if (boxMode === 'room') {
            if (isBorder) {
              cell.type = 'wall';
            } else {
              cell.type = 'floor';
              cell.fog = false;
            }
          } else if (boxMode === 'hollow') {
            if (isBorder) {
              cell.type = paintValue;
              if (paintValue === 'floor' || paintValue === 'grass' || paintValue === 'water') {
                cell.fog = false;
              }
            }
          } else if (boxMode === 'fog-reveal') {
            cell.fog = false;
          } else if (boxMode === 'fog-cover') {
            cell.fog = true;
          } else {
            // 'fill'
            cell.type = paintValue;
            if (paintValue === 'floor' || paintValue === 'grass' || paintValue === 'water') {
              cell.fog = false;
            }
          }
        }
      }

      // Re-apply LOS for any active tokens
      for (let r = 0; r < copy.length; r++) {
        for (let c = 0; c < copy[r].length; c++) {
          if (copy[r][c].tokenName) {
            revealVisionWithLOS(copy, r, c, getTokenVisionRadius(copy[r][c].tokenName, combatants));
          }
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

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (selectedTool === 'measure') {
      e.preventDefault();
      handleFinishRuler();
    }
  };

  const getCursorClass = () => {
    if (selectedTool === 'pan' || isSpacePressed) {
      return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    }
    if (draggingToken) return 'cursor-grabbing';
    if (selectedTool === 'measure') return 'cursor-crosshair';
    if (selectedTool === 'paint' || selectedTool === 'box') return 'cursor-crosshair';
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
      onDoubleClick={handleDoubleClick}
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

      {/* Advanced Ruler Floating HUD & Completion Card */}
      {selectedTool === 'measure' && (
        <div 
          onMouseDown={(e) => e.stopPropagation()} 
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className="select-none pointer-events-auto"
        >
          {rulerStatus === 'idle' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl flex items-center gap-3 text-xs text-cyan-200 shadow-2xl animate-fade-in pointer-events-auto max-w-[90vw]">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                <Ruler className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col pr-1">
                <span className="font-semibold text-slate-100">Régua Tática Ortogonal (D&D 5e)</span>
                <span className="text-[11px] text-cyan-300/80">
                  Medição estritamente ortogonal (sem diagonal). Arraste ou clique para traçar o caminho.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExitRuler}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors ml-1"
                title="Fechar Régua e voltar às ferramentas (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {rulerStatus === 'measuring' && (() => {
            const summary = getRulerSummary(rulerPoints, rulerCursor, true);
            return (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl flex flex-wrap items-center gap-4 text-xs text-cyan-200 shadow-2xl animate-fade-in pointer-events-auto max-w-[92vw]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md shadow-cyan-500/30">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-white font-mono">
                        {summary.totalFeet}ft
                      </span>
                      <span className="text-[11px] text-cyan-300 font-mono">
                        ({summary.totalMeters}m)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{summary.totalSteps} casas</span>
                      <span>•</span>
                      <span>{summary.activePoints.length} pontos {summary.segments.length > 1 ? `(${summary.segments.length} curvas)` : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFinishRuler}
                    className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
                    title="Confirmar fim da medição (ESC / Enter / Espaço / Duplo-clique)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir (ESC)</span>
                  </button>
                  
                  {rulerPoints.length > 1 && (
                    <button
                      type="button"
                      onClick={handleUndoRulerPoint}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Desfazer último ponto (Backspace)"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Desfazer</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetRuler}
                    className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Limpar medição"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {rulerStatus === 'completed' && (() => {
            const summary = getRulerSummary(rulerPoints, null, false);
            return (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[360px] max-w-[92vw] bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-3.5 text-xs text-slate-200 shadow-2xl animate-fade-in pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-100 text-xs">Medição da Rota Concluída</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExitRuler}
                    className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Fechar Régua e voltar (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-2 gap-2 my-2.5">
                  <div className="bg-[#0e1422] border border-cyan-500/20 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Distância Total</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-cyan-400 font-mono">{summary.totalFeet}ft</span>
                      <span className="text-[11px] text-cyan-300/70 font-mono">({summary.totalMeters}m)</span>
                    </div>
                  </div>
                  <div className="bg-[#0e1422] border border-cyan-500/20 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Quadrados / Passos</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-amber-400 font-mono">{summary.totalSteps}</span>
                      <span className="text-[11px] text-slate-400 font-mono">casas</span>
                    </div>
                  </div>
                </div>

                {/* Segments Breakdown */}
                {summary.segments.length > 1 && (
                  <div className="mb-2.5 max-h-28 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Detalhamento dos Segmentos:
                    </span>
                    {summary.segments.map((seg, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-[11px] bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/60 font-mono">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 text-[9px] flex items-center justify-center font-bold">
                            {sIdx + 1}
                          </span>
                          Segmento {sIdx + 1}
                        </span>
                        <span className="font-bold text-cyan-300">
                          +{seg.feet}ft ({seg.steps} casas)
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={handleExitRuler}
                    className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 active:scale-95"
                    title="Fechar medição e voltar às ferramentas (ESC / Enter / OK)"
                  >
                    <Check className="w-4 h-4" />
                    <span>OK / Fechar (ESC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRuler}
                    className="py-2 px-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Iniciar nova medição"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Nova Medição</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
