'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Ruler, 
  Check, 
  CheckCircle2, 
  X, 
  Undo2, 
  ArrowRight, 
  Footprints, 
  Maximize2,
  Package,
  Coins,
  Sparkles,
  Lock,
  Unlock,
  Dice5,
  Eye,
  Gem,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { 
  drawDysonCrosshatch, 
  drawWobblyLine, 
  drawWaterHachure, 
  drawGrassHachure, 
  drawTrapHachure,
  drawChestHachure,
  drawStashHachure,
  drawPortcullisHachure,
  drawTriggerHachure,
  drawIllusionWallHachure,
  drawLightSourceIcon
} from './dysonCore';

import { 
  hasLineOfSight, 
  isCellBlockingVision,
  revealVisionWithLOS, 
  computeVisibilityPolygon, 
  getTokenVisionRadius,
  getCombatantVisionType,
  isLightVisibleToPlayer
} from './visionCore';
import { Combatant, VisionType } from '@/lib/types';
import { Cell, TileType, ChestConfig, ContainerType, ContainerStatus, ChestLoot } from '../MapMaker';

function hexToRgba(hex: string, alpha: number): string {
  let c = (hex || '#ff9900').replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(255, 153, 0, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  selectedTool: 'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan' | 'light' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text';
  setSelectedTool?: (tool: 'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan' | 'light' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text') => void;
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
  vectorWalls?: import('@/lib/types').WallSegment[];
  lightSources?: import('@/lib/types').LightSource[];
  onAddLightSource?: (light: import('@/lib/types').LightSource) => void;
  onRemoveLightSource?: (lightId: string) => void;
  selectedLightPreset?: 'torch' | 'candle' | 'lantern' | 'spell' | 'dragon';
  drawings?: any[];
  onDrawingAction?: (payload: any) => void;
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
  vectorWalls = [],
  lightSources = [],
  onAddLightSource,
  onRemoveLightSource,
  selectedLightPreset = 'torch',
  drawings = [],
  onDrawingAction,
}) => {


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenMaskRef = useRef<HTMLCanvasElement | null>(null);
  const lastPaintedCellRef = useRef<{ r: number; c: number; tool: string } | null>(null);

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
  const [currentStroke, setCurrentStroke] = useState<any | null>(null);
  const activeStrokeRef = useRef<any | null>(null);

  const CELL_SIZE = bgImageUrl ? gridScale : 40;
  const COLS = grid[0]?.length || 12;
  const ROWS = grid.length || 12;

  // Advanced Multi-Point Ruler State
  const [rulerPoints, setRulerPoints] = useState<RulerPoint[]>([]);
  const [rulerCursor, setRulerCursor] = useState<RulerPoint | null>(null);
  const [rulerStatus, setRulerStatus] = useState<'idle' | 'measuring' | 'completed'>('idle');
  const [isRulerDragging, setIsRulerDragging] = useState(false);
  const rulerDragStartCell = useRef<RulerPoint | null>(null);

  const gridDims = useRef({ rows: grid.length, cols: grid[0]?.length || 0 });
  const panOffsetRef = useRef(panOffset);
  const zoomRef = useRef(zoom);
  const selectedToolRef = useRef(selectedTool);
  const rulerPointsRef = useRef(rulerPoints);
  const rulerCursorRef = useRef(rulerCursor);
  const rulerStatusRef = useRef(rulerStatus);

  // Memoized Dyson Wall Distance Transform (recalculated ONLY when grid changes, not on frame/mousemove)
  const distMap = useMemo(() => {
    if (!grid || grid.length === 0) return [];
    const rows = grid.length;
    const cols = grid[0]?.length || 0;
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
  }, [grid]);

  // Memoized player tokens list
  const playerTokens = useMemo(() => {
    const tokens: { r: number; c: number; radius: number; visionType: VisionType; tokenName: string }[] = [];
    if (!grid || grid.length === 0) return tokens;
    const rows = grid.length;
    const cols = grid[0]?.length || 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]?.[c]?.tokenName) {
          const tokenNameClean = grid[r][c].tokenName!.trim().toLowerCase();
          const isPlayerToken = grid[r][c].tokenColor?.includes('cyan') || 
                                grid[r][c].tokenColor?.includes('emerald') || 
                                grid[r][c].tokenColor?.includes('green') || 
                                grid[r][c].tokenColor?.includes('blue') ||
                                combatants?.some((comb: Combatant) => {
                                  if (comb.type !== 'player') return false;
                                  const cName = comb.name.trim().toLowerCase();
                                  return cName === tokenNameClean || cName.startsWith(tokenNameClean) || tokenNameClean.startsWith(cName.slice(0, 3));
                                });
          if (isPlayerToken) {
            tokens.push({
              r,
              c,
              radius: getTokenVisionRadius(grid[r][c].tokenName, combatants),
              visionType: getCombatantVisionType(grid[r][c].tokenName, combatants),
              tokenName: grid[r][c].tokenName!
            });
          }
        }
      }
    }
    return tokens;
  }, [grid, combatants]);

  // Memoized token active vision polygons (world-space, recomputed ONLY when tokens/geometry change)
  const tokenVisionPolygons = useMemo(() => {
    if (!grid || grid.length === 0) return [];
    return playerTokens.map((pt) => {
      const tx = bgImageUrl ? gridOffsetX + pt.c * CELL_SIZE + CELL_SIZE / 2 : pt.c * CELL_SIZE + CELL_SIZE / 2;
      const ty = bgImageUrl ? gridOffsetY + pt.r * CELL_SIZE + CELL_SIZE / 2 : pt.r * CELL_SIZE + CELL_SIZE / 2;
      const visionRadius = pt.radius * CELL_SIZE;

      const polyPoints = computeVisibilityPolygon(
        tx, ty, visionRadius, grid, CELL_SIZE, gridOffsetX, gridOffsetY, Boolean(bgImageUrl), vectorWalls, pt.visionType
      );

      return { tx, ty, visionRadius, polyPoints, visionType: pt.visionType };
    });
  }, [playerTokens, grid, vectorWalls, CELL_SIZE, gridOffsetX, gridOffsetY, bgImageUrl]);

  // Memoized light source visibility polygons (world-space, recomputed ONLY when lights/geometry change)
  const lightPolygons = useMemo(() => {
    if (!lightSources || lightSources.length === 0 || !grid || grid.length === 0) return [];

    return lightSources.map((light) => {
      const isVisible = !isPlayerView || isLightVisibleToPlayer(light, playerTokens, grid, vectorWalls, CELL_SIZE, gridOffsetX, gridOffsetY, Boolean(bgImageUrl));
      
      const lx = light.x < 150 ? (bgImageUrl ? gridOffsetX + light.x * CELL_SIZE : light.x * CELL_SIZE) : light.x;
      const ly = light.y < 150 ? (bgImageUrl ? gridOffsetY + light.y * CELL_SIZE : light.y * CELL_SIZE) : light.y;
      const lRadius = (light.dimRadius / 5) * CELL_SIZE;

      const polyPoints = isVisible ? computeVisibilityPolygon(
        lx, ly, lRadius, grid, CELL_SIZE, gridOffsetX, gridOffsetY, Boolean(bgImageUrl), vectorWalls
      ) : [];

      return { light, lx, ly, lRadius, polyPoints, isVisible };
    });
  }, [lightSources, isPlayerView, playerTokens, grid, vectorWalls, CELL_SIZE, gridOffsetX, gridOffsetY, bgImageUrl]);

  useEffect(() => {
    gridDims.current = { rows: grid.length, cols: grid[0]?.length || 0 };
  }, [grid]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

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

  // Track centering flag to only center once per load/scene reset
  const centeredRef = useRef(false);

  const fitAndCenterView = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width <= 0 || containerRect.height <= 0) return;

    if (bgImage) {
      const canvasWidth = bgImage.width;
      const canvasHeight = bgImage.height;
      const zoomX = containerRect.width / canvasWidth;
      const zoomY = containerRect.height / canvasHeight;
      const fitZoom = Math.min(1.2, Math.max(0.2, Math.min(zoomX, zoomY) * 0.9));

      setZoom(fitZoom);
      setPanOffset({
        x: (containerRect.width - canvasWidth * fitZoom) / 2,
        y: (containerRect.height - canvasHeight * fitZoom) / 2,
      });
      return;
    }

    // Find bounding box of carved cells (type !== 'wall')
    let minC = COLS;
    let maxC = -1;
    let minR = ROWS;
    let maxR = -1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r]?.[c] && grid[r][c].type !== 'wall') {
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
        }
      }
    }

    let dungWidth = COLS * CELL_SIZE;
    let dungHeight = ROWS * CELL_SIZE;
    let dungCenterX = dungWidth / 2;
    let dungCenterY = dungHeight / 2;

    if (maxC >= minC && maxR >= minR) {
      const padMinC = Math.max(0, minC - 2);
      const padMaxC = Math.min(COLS - 1, maxC + 2);
      const padMinR = Math.max(0, minR - 2);
      const padMaxR = Math.min(ROWS - 1, maxR + 2);

      dungWidth = (padMaxC - padMinC + 1) * CELL_SIZE;
      dungHeight = (padMaxR - padMinR + 1) * CELL_SIZE;
      dungCenterX = ((padMinC + padMaxC + 1) / 2) * CELL_SIZE;
      dungCenterY = ((padMinR + padMaxR + 1) / 2) * CELL_SIZE;
    }

    const zoomX = containerRect.width / dungWidth;
    const zoomY = containerRect.height / dungHeight;
    const idealZoom = Math.min(1.2, Math.max(0.3, Math.min(zoomX, zoomY)));

    const panX = (containerRect.width / 2) - (dungCenterX * idealZoom);
    const panY = (containerRect.height / 2) - (dungCenterY * idealZoom);

    setZoom(idealZoom);
    setPanOffset({ x: panX, y: panY });
  }, [grid, bgImage, COLS, ROWS, CELL_SIZE]);

  useEffect(() => {
    if (centeredRef.current) return;
    if (bgImageUrl && !bgImage) return;

    if (containerRef.current) {
      fitAndCenterView();
      centeredRef.current = true;
    }
  }, [bgImage, bgImageUrl, COLS, ROWS, CELL_SIZE, fitAndCenterView]);

  // Reset centering flag ONLY when background URL or grid dimensions change (NOT on cell edits)
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

      // Use memoized distance transform for Dyson wall crosshatch rendering

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
          // Camuflagem de esconderijos secretos (stash) para jogadores
          if (type === 'stash' && isPlayerView && !cell.chestConfig?.revealedToPlayers) {
            type = 'floor';
          }
          // Camuflagem de gatilhos secretos para jogadores
          if (type === 'trigger' && isPlayerView && cell.triggerConfig?.isSecret && !cell.triggerConfig?.revealedToPlayers) {
            type = 'floor';
          }
          // Camuflagem de parede ilusória para jogadores (falsa parede)
          if (type === 'illusion_wall' && isPlayerView && !cell.illusionWallConfig?.revealedToPlayers) {
            type = 'wall';
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
            } else if (type === 'chest') {
              const containerType = (isPlayerView && cell.chestConfig?.containerType === 'mimic' && !cell.chestConfig?.revealedToPlayers)
                ? 'wooden_chest'
                : (cell.chestConfig?.containerType || 'wooden_chest');
              const status = cell.chestConfig?.status || 'locked';
              drawChestHachure(ctx, c, r, CELL_SIZE, containerType, status);
            } else if (type === 'stash') {
              drawStashHachure(ctx, c, r, CELL_SIZE);
            } else if (type === 'portcullis') {
              const status = cell.portcullisConfig?.status || 'closed';
              drawPortcullisHachure(ctx, c, r, CELL_SIZE, status);
            } else if (type === 'trigger') {
              const triggerType = cell.triggerConfig?.triggerType || 'lever';
              const state = cell.triggerConfig?.state || 'inactive';
              drawTriggerHachure(ctx, c, r, CELL_SIZE, triggerType, state);
            } else if (type === 'illusion_wall') {
              const revealed = cell.illusionWallConfig?.revealedToPlayers || false;
              drawIllusionWallHachure(ctx, c, r, CELL_SIZE, isPlayerView, revealed);
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
          if (type === 'stash' && isPlayerView && !cell.chestConfig?.revealedToPlayers) {
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

      // Draw doors, traps, chests and stashes (Culled)
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
          } else if (cell.type === 'chest') {
            const config = cell.chestConfig;
            const isMimic = config?.containerType === 'mimic';
            const status = config?.status || 'locked';

            const x = c * CELL_SIZE + CELL_SIZE / 2;
            const y = r * CELL_SIZE + CELL_SIZE / 2;

            ctx.font = `bold ${Math.floor(CELL_SIZE * 0.58)}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let label = '🧰';
            if (isPlayerView) {
              if (status === 'open') label = '📦';
              else if (status === 'looted') label = '✨';
              else if (status === 'unlocked') label = '🔓';
              else label = '🔒';
            } else {
              if (isMimic) label = '🦷';
              else if (status === 'open') label = '📦';
              else if (status === 'looted') label = '✨';
              else if (status === 'unlocked') label = '🔓';
              else label = '🔒';
            }

            ctx.lineWidth = 4;
            ctx.strokeStyle = (!isPlayerView && isMimic) ? '#ef4444' : (status === 'looted' ? '#10b981' : '#ffffff');
            ctx.strokeText(label, x, y);
            
            ctx.fillStyle = (!isPlayerView && isMimic) ? '#b91c1c' : '#1a1a1a';
            ctx.fillText(label, x, y);
          } else if (cell.type === 'stash') {
            const config = cell.chestConfig;
            const isHidden = !config?.revealedToPlayers;

            if (isPlayerView && isHidden) {
              continue;
            }

            const x = c * CELL_SIZE + CELL_SIZE / 2;
            const y = r * CELL_SIZE + CELL_SIZE / 2;

            ctx.font = `${Math.floor(CELL_SIZE * 0.65)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const label = config?.status === 'looted' ? '✨' : '💎';
            ctx.fillText(label, x, y);
          }
        }
      }
    }

    // 1.5 Render Light Sources (Glow Halos & Hand-Drawn Icons)
    if (lightSources && lightSources.length > 0) {
      const now = Date.now();
      for (const light of lightSources) {
        if (light.x === undefined || light.y === undefined) continue;

        // Normalize coordinates: if x/y were passed in grid cell units (e.g. 10.5), convert to pixels
        const lx = light.x < 150 ? light.x * CELL_SIZE : light.x;
        const ly = light.y < 150 ? light.y * CELL_SIZE : light.y;
        const colorHex = light.color || '#ff9900';

        // Calculate dynamic light radius in pixels (5ft = CELL_SIZE)
        const dimFt = light.dimRadius || 40;
        let dimRadiusPx = Math.max(20, (dimFt / 5) * CELL_SIZE);

        // Dynamic Flicker / Pulse animation effect
        let alphaMultiplier = 1.0;
        if (light.animation === 'torch' || light.animation === 'candle') {
          const flicker = (Math.sin(now / 150 + lx * 0.05) + Math.cos(now / 200 + ly * 0.05)) * 0.08;
          dimRadiusPx *= (1 + flicker);
          alphaMultiplier += flicker;
        } else if (light.animation === 'pulse') {
          const pulse = Math.sin(now / 400) * 0.12;
          dimRadiusPx *= (1 + pulse);
        }

        // 1. Radial Glowing Light Halo
        ctx.save();
        const radGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, dimRadiusPx);
        radGrad.addColorStop(0, hexToRgba(colorHex, 0.55 * alphaMultiplier));
        radGrad.addColorStop(0.35, hexToRgba(colorHex, 0.22 * alphaMultiplier));
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, dimRadiusPx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Determine Preset Type for hand-drawn icon
        let preset: 'torch' | 'candle' | 'lantern' | 'spell' | 'dragon' = 'torch';
        if (light.animation === 'candle' || colorHex.toLowerCase() === '#ffaa33') preset = 'candle';
        else if (light.animation === 'none' || colorHex.toLowerCase() === '#ffee77') preset = 'lantern';
        else if (light.animation === 'pulse' || colorHex.toLowerCase() === '#ff4400') preset = 'dragon';
        else if (light.animation === 'chroma' || colorHex.toLowerCase() === '#00ccff') preset = 'spell';

        // 3. Hand-Drawn Icon on Canvas
        drawLightSourceIcon(ctx, lx, ly, preset, zoom);
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

    // 2.5 Collect Active Player Tokens for LOS and Lighting Checks
    const playerTokens: { r: number; c: number; radius: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r]?.[c]?.tokenName) {
          const tokenNameClean = grid[r][c].tokenName!.trim().toLowerCase();
          const isPlayerToken = grid[r][c].tokenColor?.includes('cyan') || 
                                grid[r][c].tokenColor?.includes('emerald') || 
                                grid[r][c].tokenColor?.includes('green') || 
                                grid[r][c].tokenColor?.includes('blue') ||
                                combatants?.some((comb: Combatant) => {
                                  if (comb.type !== 'player') return false;
                                  const cName = comb.name.trim().toLowerCase();
                                  return cName === tokenNameClean || cName.startsWith(tokenNameClean) || tokenNameClean.startsWith(cName.slice(0, 3));
                                });
          if (isPlayerToken) {
            playerTokens.push({
              r,
              c,
              radius: getTokenVisionRadius(grid[r][c].tokenName, combatants)
            });
          }
        }
      }
    }

    // 3. Draw Fog of War & Vision Circles (Destination Out - Culled)
    if (!offscreenMaskRef.current) {
      offscreenMaskRef.current = document.createElement('canvas');
    }
    const maskCanvas = offscreenMaskRef.current;
    if (maskCanvas.width !== width || maskCanvas.height !== height) {
      maskCanvas.width = width;
      maskCanvas.height = height;
    }
    const maskCtx = maskCanvas.getContext('2d');

    if (maskCtx) {
      // Reset transform before clearing to avoid cumulative scaling/translating issues on reuse
      maskCtx.setTransform(1, 0, 0, 1, 0, 0);
      
      // Reset composite operation to default drawing mode (essential since destination-out persists)
      maskCtx.globalCompositeOperation = 'source-over';
      
      // Clear mask canvas (starts fully transparent)
      maskCtx.clearRect(0, 0, width, height);

      // 1. Fill entire viewport with dark fog (Opaque for players, semi-transparent for DM) in screen space
      maskCtx.fillStyle = isPlayerView ? 'rgba(8, 8, 12, 0.98)' : 'rgba(8, 8, 12, 0.45)';
      maskCtx.fillRect(0, 0, width, height);

      // Now translate and scale to world coordinates for carving visibility
      maskCtx.translate(panOffset.x, panOffset.y);
      maskCtx.scale(zoom, zoom);

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

      // 3. Current token active vision (uses memoized tokenVisionPolygons)
      tokenVisionPolygons.forEach(({ tx, ty, visionRadius, polyPoints, visionType }) => {
        if (polyPoints.length > 0) {
          maskCtx.save();
          maskCtx.beginPath();
          maskCtx.moveTo(polyPoints[0].x, polyPoints[0].y);
          for (let p = 1; p < polyPoints.length; p++) {
            maskCtx.lineTo(polyPoints[p].x, polyPoints[p].y);
          }
          maskCtx.closePath();

          const grad = maskCtx.createRadialGradient(tx, ty, CELL_SIZE * 0.5, tx, ty, visionRadius);
          if (visionType === 'darkvision') {
            // Greyscale / Desaturated spotlight for Darkvision
            grad.addColorStop(0.0, 'rgba(0, 0, 0, 0.95)');
            grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.75)');
            grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
          } else {
            grad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
            grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
            grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
          }

          maskCtx.fillStyle = grad;
          maskCtx.fill();
          maskCtx.restore();
        }
      });

      // Render standalone LightSources on fog mask (uses memoized lightPolygons)
      lightPolygons.forEach(({ lx, ly, lRadius, polyPoints, isVisible }) => {
        if (!isVisible || polyPoints.length === 0) return;

        maskCtx.save();
        maskCtx.beginPath();
        maskCtx.moveTo(polyPoints[0].x, polyPoints[0].y);
        for (let p = 1; p < polyPoints.length; p++) {
          maskCtx.lineTo(polyPoints[p].x, polyPoints[p].y);
        }
        maskCtx.closePath();

        const fogGrad = maskCtx.createRadialGradient(lx, ly, 5, lx, ly, lRadius);
        fogGrad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
        fogGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
        fogGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

        maskCtx.fillStyle = fogGrad;
        maskCtx.fill();
        maskCtx.restore();
      });

      // Reset filter
      maskCtx.filter = 'none';

      // Draw the computed fog mask back onto the main canvas
      ctx.drawImage(maskCanvas, 0, 0);
    }

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 3.B. Render Colored Ambient Light Glow on Main Canvas (uses memoized lightPolygons)
    lightPolygons.forEach(({ light, lx, ly, lRadius, polyPoints, isVisible }) => {
      if (!isVisible || polyPoints.length === 0) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
      for (let p = 1; p < polyPoints.length; p++) {
        ctx.lineTo(polyPoints[p].x, polyPoints[p].y);
      }
      ctx.closePath();

      const lightColor = light.color || '#ffaa33';
      const grad = ctx.createRadialGradient(lx, ly, 5, lx, ly, lRadius);
      grad.addColorStop(0.0, lightColor);
      grad.addColorStop(0.5, lightColor.startsWith('#') ? `${lightColor}66` : 'rgba(255, 170, 51, 0.4)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = 'screen';
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Tokens (Characters)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r]?.[c];
        if (cell && cell.tokenName) {
          const tokenNameClean = cell.tokenName.trim().toLowerCase();
          const isPlayerToken = cell.tokenColor?.includes('cyan') || 
                                cell.tokenColor?.includes('emerald') || 
                                cell.tokenColor?.includes('green') || 
                                cell.tokenColor?.includes('blue') ||
                                combatants?.some((comb: Combatant) => {
                                  if (comb.type !== 'player') return false;
                                  const cName = comb.name.trim().toLowerCase();
                                  return cName === tokenNameClean || cName.startsWith(tokenNameClean) || tokenNameClean.startsWith(cName.slice(0, 3));
                                });

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

          const tokenCombatant = combatants?.find(c => {
            const cName = c.name.trim().toLowerCase();
            return cName === tokenNameClean || cName.startsWith(tokenNameClean) || tokenNameClean.startsWith(cName.slice(0, 3));
          });

          // Tremorsense sonar rings
          if (tokenCombatant?.visionType === 'tremorsense') {
            const ringCount = 3;
            const time = Date.now() * 0.001;
            ctx.save();
            ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
            for (let i = 0; i < ringCount; i++) {
              const phase = (time + i / ringCount) % 1;
              const radius = CELL_SIZE * 0.5 + (CELL_SIZE * 3 * phase);
              const alpha = (1 - phase) * 0.5;
              ctx.beginPath();
              ctx.arc(tx, ty, radius, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
              ctx.lineWidth = 2 * (1 - phase);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Active indicator pulse
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(tx, ty, CELL_SIZE * 0.45, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // 4.B. Render Vector Walls and Doors
    if (vectorWalls && vectorWalls.length > 0) {
      vectorWalls.forEach((wall) => {
        const x1 = (bgImage ? gridOffsetX : 0) + wall.x1 * CELL_SIZE;
        const y1 = (bgImage ? gridOffsetY : 0) + wall.y1 * CELL_SIZE;
        const x2 = (bgImage ? gridOffsetX : 0) + wall.x2 * CELL_SIZE;
        const y2 = (bgImage ? gridOffsetY : 0) + wall.y2 * CELL_SIZE;

        if (wall.type === 'secret_door' && isPlayerView && wall.doorState === 'closed') {
          return; // Secret doors closed are invisible to players
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (wall.type === 'door' || wall.type === 'secret_door') {
          const isOpen = wall.doorState === 'open';
          ctx.strokeStyle = isOpen ? '#22c55e' : '#f59e0b';
          ctx.lineWidth = 4;
          ctx.setLineDash([6, 4]);

          // Draw door icon / handle in center
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          ctx.fillStyle = isOpen ? '#22c55e' : '#f59e0b';
          ctx.fillRect(mx - 4, my - 4, 8, 8);
        } else if (wall.type === 'window') {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.setLineDash([3, 3]);
        } else {
          // Wall
          ctx.strokeStyle = isPlayerView ? 'transparent' : '#ef4444'; // Red in DM view, invisible overlay in player view
          ctx.lineWidth = 3;
        }

        ctx.stroke();
        ctx.restore();
      });
    }

    // 4.C. Render Flat Black Light Source Map Decoration Icons (Dyson Style)
    if (lightSources && lightSources.length > 0) {
      lightSources.forEach((light) => {
        const lx = bgImage ? gridOffsetX + light.x * CELL_SIZE : light.x * CELL_SIZE;
        const ly = bgImage ? gridOffsetY + light.y * CELL_SIZE : light.y * CELL_SIZE;

        let preset = 'torch';
        if (light.color === '#ffcc66' || light.brightRadius === 10) preset = 'candle';
        else if (light.color === '#ffee88' || light.brightRadius === 30) preset = 'lantern';
        else if (light.color === '#38bdf8') preset = 'spell';
        else if (light.color === '#ef4444') preset = 'dragon';

        drawLightSourceIcon(ctx, lx, ly, preset, zoom);
      });
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

      // --- Draw Freehand / Shapes Layer ---
      const renderStroke = (stroke: any) => {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = stroke.color || '#f59e0b';
        ctx.lineWidth = (stroke.lineWidth || 4) / zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = stroke.color || '#f59e0b';

        const pts = stroke.points;

        if (stroke.tool === 'pencil') {
          if (pts.length === 1) {
            ctx.arc(pts[0].x, pts[0].y, Math.max(2, (stroke.lineWidth || 4) / 2 / zoom), 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
              ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.stroke();
          }
        } else if (stroke.tool === 'circle') {
          const endPt = pts[1] || pts[0];
          const dx = endPt.x - pts[0].x;
          const dy = endPt.y - pts[0].y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.arc(pts[0].x, pts[0].y, radius > 0 ? radius : (stroke.lineWidth || 4) / zoom, 0, Math.PI * 2);
          ctx.stroke();
        } else if (stroke.tool === 'rect') {
          const endPt = pts[1] || pts[0];
          const w = endPt.x - pts[0].x;
          const h = endPt.y - pts[0].y;
          ctx.strokeRect(pts[0].x, pts[0].y, w, h);
        } else if (stroke.tool === 'text') {
          ctx.font = `bold ${Math.max(12, 16 / zoom)}px Inter, sans-serif`;
          ctx.fillText(stroke.text || '', pts[0].x, pts[0].y);
        }
        ctx.restore();
      };

      if (drawings && drawings.length > 0) {
        drawings.forEach(renderStroke);
      }
      if (currentStroke) {
        renderStroke(currentStroke);
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
  }, [grid, bgImage, CELL_SIZE, COLS, ROWS, gridOffsetX, gridOffsetY, selectedTool, selectionBox, measureStart, calibrationLine, rulerPoints, rulerCursor, rulerStatus, zoom, panOffset, canvasSize, isPlayerView, lightSources, combatants, vectorWalls, drawings, currentStroke]);

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

  const isCellVisibleToPlayers = useCallback((col: number, row: number): boolean => {
    if (!isPlayerView) return true;
    
    if (playerTokens.length === 0) {
      return grid[row]?.[col] ? !grid[row][col].fog : false;
    }
    
    for (const pt of playerTokens) {
      const dist = Math.hypot(row - pt.r, col - pt.c);
      if (dist > pt.radius) continue;
      if (hasLineOfSight(pt.c, pt.r, col, row, grid, vectorWalls, CELL_SIZE)) {
        return true;
      }
    }
    return false;
  }, [isPlayerView, playerTokens, grid, vectorWalls, CELL_SIZE]);

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

  const isPOIType = (t: string | undefined) => 
    t === 'door' || t === 'trap' || t === 'chest' || t === 'stash' || t === 'trigger' || t === 'portcullis' || t === 'illusion_wall';

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

    if (selectedTool.startsWith('draw-')) {
      const toolType = selectedTool.replace('draw-', '');
      if (toolType === 'eraser') {
        if (drawings && drawings.length > 0) {
          let closestId = null;
          let minDist = Infinity;
          drawings.forEach((d: any) => {
            if (!d.points || d.points.length === 0) return;
            const p = d.points[0];
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist < minDist) {
              minDist = dist;
              closestId = d.id;
            }
          });
          if (closestId && minDist < 100 / zoom) {
            onDrawingAction?.({ action: 'remove', strokeId: closestId });
          }
        }
      } else if (toolType === 'text') {
        const text = window.prompt('Digite o texto:');
        if (text) {
          const newStroke = {
            id: Math.random().toString(36).substring(7),
            tool: 'text',
            color: '#f59e0b', // amber-500
            lineWidth: 2,
            points: [{ x, y }],
            text
          };
          onDrawingAction?.({ action: 'add', stroke: newStroke });
        }
      } else {
        setIsDrawing(true);
        const strokeData = {
          id: Math.random().toString(36).substring(7),
          tool: toolType,
          color: '#f59e0b', // amber-500
          lineWidth: 4,
          points: [{ x, y }]
        };
        activeStrokeRef.current = strokeData;
        setCurrentStroke(strokeData);
      }
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

    if (selectedTool === 'light') {
      const gridPos = getGridPos(x, y);

      const existing = lightSources?.find((l) => {
        const lx = l.x < 150 ? (bgImage ? gridOffsetX + l.x * CELL_SIZE : l.x * CELL_SIZE) : l.x;
        const ly = l.y < 150 ? (bgImage ? gridOffsetY + l.y * CELL_SIZE : l.y * CELL_SIZE) : l.y;
        const dist = Math.hypot(x - lx, y - ly);
        return dist <= CELL_SIZE * 0.8;
      });

      if (existing || e.button === 2) {
        if (existing) {
          onRemoveLightSource?.(existing.id);
          toast.info('Fonte de luz removida.');
        }
        return;
      }

      let brightRadius = 20;
      let dimRadius = 40;
      let color = '#ff9900';
      let animation: any = 'torch';

      if (selectedLightPreset === 'candle') {
        brightRadius = 10;
        dimRadius = 20;
        color = '#ffaa33';
        animation = 'candle';
      } else if (selectedLightPreset === 'lantern') {
        brightRadius = 30;
        dimRadius = 60;
        color = '#ffee77';
        animation = 'none';
      } else if (selectedLightPreset === 'spell') {
        brightRadius = 20;
        dimRadius = 40;
        color = '#00ccff';
        animation = 'chroma';
      } else if (selectedLightPreset === 'dragon') {
        brightRadius = 25;
        dimRadius = 50;
        color = '#ff4400';
        animation = 'pulse';
      }

      const pixelX = (gridPos.c + 0.5) * CELL_SIZE;
      const pixelY = (gridPos.r + 0.5) * CELL_SIZE;

      const newLight: import('@/lib/types').LightSource = {
        id: `light-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        x: pixelX,
        y: pixelY,
        brightRadius,
        dimRadius,
        color,
        intensity: 0.9,
        animation
      };

      onGridChange((prev) => {
        const copy = prev.map((row) => row.map((c) => ({ ...c })));
        if (copy[gridPos.r]?.[gridPos.c]) {
          copy[gridPos.r][gridPos.c].fog = false;
          if (copy[gridPos.r][gridPos.c].type === 'wall' && !bgImageUrl) {
            copy[gridPos.r][gridPos.c].type = 'floor';
          }
        }
        revealVisionWithLOS(copy, gridPos.r, gridPos.c, dimRadius / 5, vectorWalls, CELL_SIZE);
        return copy;
      });

      onAddLightSource?.(newLight);
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
    // Interacting with or clicking on existing POI (door, trap, chest, stash) in DM view
    if (clickedCell && !isPlayerView && isPOIType(clickedCell.type) && e.button === 0 && !isSpacePressed) {
      setIsDrawing(false);
      setDrawButton(-1);
      setEditingCell({
        r: pos.r,
        c: pos.c,
        cell: clickedCell
      });
      return;
    }

    // Placing a new POI (door, trap, chest, stash) - single placement only
    if (selectedTool === 'paint' && isPOIType(selectedTileType) && e.button === 0 && !isSpacePressed) {
      setIsDrawing(false);
      setDrawButton(-1);
      handleCellAction(pos.r, pos.c, e.button, true);
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

    if (activeStrokeRef.current && selectedTool.startsWith('draw-')) {
      const toolType = selectedTool.replace('draw-', '');
      if (toolType === 'pencil') {
        activeStrokeRef.current.points.push({ x, y });
      } else if (toolType === 'circle' || toolType === 'rect') {
        activeStrokeRef.current.points[1] = { x, y };
      }
      setCurrentStroke({ ...activeStrokeRef.current });
      return;
    }

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
      if (cell && isPOIType(cell.type)) {
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
        const isPortcullisClosed = targetCell?.type === 'portcullis' && targetCell.portcullisConfig?.status === 'closed';
        if (isCellBlockingVision(targetCell) || isPortcullisClosed) {
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
    // Single POIs (door, trap, chest, stash, mechanisms) are never drag-painted
    if (selectedTool === 'paint' && isPOIType(selectedTileType)) {
      return;
    }

    // Spatial Throttling: If mouse is still in the same cell, skip redundant paint updates
    if (lastPaintedCellRef.current?.r === pos.r && 
        lastPaintedCellRef.current?.c === pos.c && 
        lastPaintedCellRef.current?.tool === selectedTool) {
      return;
    }
    lastPaintedCellRef.current = { r: pos.r, c: pos.c, tool: selectedTool };

    handleCellAction(pos.r, pos.c, drawButton, false);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    lastPaintedCellRef.current = null;

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

    if (activeStrokeRef.current && selectedTool.startsWith('draw-')) {
      onDrawingAction?.({ action: 'add', stroke: activeStrokeRef.current });
      activeStrokeRef.current = null;
      setCurrentStroke(null);
      setIsDrawing(false);
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
           if (paintValue === 'chest' && !cell.chestConfig) {
             cell.chestConfig = {
               name: 'Baú de Madeira',
               containerType: 'wooden_chest',
               status: 'locked',
               lockpickDC: 15,
               breakDC: 16,
               revealedToPlayers: true,
               loot: {
                 gp: 25,
                 sp: 50,
                 items: ['Poção de Cura (2d4+2)'],
               }
             };
           }
           if (paintValue === 'stash' && !cell.chestConfig) {
             cell.chestConfig = {
               name: 'Esconderijo Oculto',
               containerType: 'hidden_stash',
               status: 'unlocked',
               lockpickDC: 12,
               breakDC: 14,
               detectDC: 15,
               revealedToPlayers: false,
               loot: {
                 gp: 60,
                 items: ['Gema de Quartzo (50 PO)', 'Pergaminho de Mísseis Mágicos'],
               }
             };
           }
           if (paintValue === 'trigger' && !cell.triggerConfig) {
             cell.triggerConfig = {
               id: `trigger-${Math.random().toString(36).substring(2, 8)}`,
               targetId: '',
               triggerType: 'lever',
               state: 'inactive',
               name: 'Alavanca Antiga',
               isSecret: false,
               revealedToPlayers: true
             };
           }
           if (paintValue === 'portcullis' && !cell.portcullisConfig) {
             cell.portcullisConfig = {
               id: `grade-${Math.random().toString(36).substring(2, 8)}`,
               status: 'closed',
               material: 'iron',
               name: 'Grade de Ferro'
             };
           }
           if (paintValue === 'illusion_wall' && !cell.illusionWallConfig) {
             cell.illusionWallConfig = {
               detectDC: 15,
               revealedToPlayers: false,
               blocksLight: true
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

  // Zoom handling using non-passive native wheel event (centered on mouse cursor)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Smooth multiplicative zoom centered on mouse
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;

      const currentZoom = zoomRef.current;
      const currentPan = panOffsetRef.current;

      const nextZoom = Math.max(0.3, Math.min(currentZoom * zoomFactor, 3.0));

      const localMouseX = (mouseX - currentPan.x) / currentZoom;
      const localMouseY = (mouseY - currentPan.y) / currentZoom;

      const nextPan = {
        x: mouseX - localMouseX * nextZoom,
        y: mouseY - localMouseY * nextZoom,
      };

      zoomRef.current = nextZoom;
      panOffsetRef.current = nextPan;

      setZoom(nextZoom);
      setPanOffset(nextPan);
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

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
    if (selectedTool === 'paint' || selectedTool === 'box' || selectedTool.startsWith('draw-')) return 'cursor-crosshair';
    return 'cursor-default';
  };

  const hasDarkvision = useMemo(() => {
    if (selectedTokenCombatant) return selectedTokenCombatant.visionType === 'darkvision';
    if (isPlayerView) return combatants.some(c => c.type === 'player' && c.visionType === 'darkvision');
    return false;
  }, [selectedTokenCombatant, isPlayerView, combatants]);

  const hasTremorsense = useMemo(() => {
    if (selectedTokenCombatant) return selectedTokenCombatant.visionType === 'tremorsense';
    if (isPlayerView) return combatants.some(c => c.type === 'player' && c.visionType === 'tremorsense');
    return false;
  }, [selectedTokenCombatant, isPlayerView, combatants]);

  // Touch Pinch-to-Zoom & Pan Handlers for Tablet Support
  const touchDistRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDistRef.current !== null) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = newDist - touchDistRef.current;
      if (Math.abs(delta) > 5) {
        setZoom((prev) => Math.max(0.3, Math.min(3.0, prev + (delta > 0 ? 0.03 : -0.03))));
        touchDistRef.current = newDist;
      }
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full overflow-hidden relative ${getCursorClass()} bg-slate-950`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      onMouseLeave={() => setHoveredCell(null)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        style={{ filter: hasDarkvision ? 'grayscale(100%) brightness(0.8)' : 'none', transition: 'filter 0.5s ease' }}
      />
      {hasTremorsense && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-emerald-500/30 rounded-full animate-ping" />
        </div>
      )}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-[11px] font-mono text-slate-400 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow flex gap-3 z-20"
      >
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span>Grid: {CELL_SIZE}px/célula</span>
        <span className="text-slate-500">Mão para mover | Desenhe fora das bordas para expandir</span>
      </div>

      {editingCell && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onMouseDown={(e) => { e.stopPropagation(); setIsDrawing(false); }}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => { e.stopPropagation(); setIsDrawing(false); }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="bg-[#121824] border border-[#2a3449] w-full max-w-[420px] rounded-2xl shadow-2xl p-5 select-none animate-fade-in font-sans max-h-[90vh] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#2a3449]/60 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
                {editingCell.cell.type === 'door' && '🚪 Configurar Porta'}
                {editingCell.cell.type === 'trap' && '⚠️ Configurar Armadilha'}
                {editingCell.cell.type === 'chest' && '🧰 Configurar Baú & Tesouro'}
                {editingCell.cell.type === 'stash' && '💎 Configurar Esconderijo Oculto'}
                {editingCell.cell.type === 'trigger' && '🕹️ Configurar Mecanismo'}
                {editingCell.cell.type === 'portcullis' && '⛓️ Configurar Grade de Ferro'}
                {editingCell.cell.type === 'illusion_wall' && '🌫️ Configurar Parede Falsa'}
              </h3>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDrawing(false);
                  setDrawButton(-1);
                  setEditingCell(null);
                }}
                className="text-slate-400 hover:text-slate-200 text-base p-1"
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

            {(editingCell.cell.type === 'chest' || editingCell.cell.type === 'stash') && (
              <div className="space-y-3.5">
                {/* 1. Nome e Tipo */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editingCell.cell.chestConfig?.name || (editingCell.cell.type === 'chest' ? 'Baú de Madeira' : 'Esconderijo Secreto')}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: val, containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              name: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Recipiente</label>
                    <select
                      value={editingCell.cell.chestConfig?.containerType || (editingCell.cell.type === 'stash' ? 'hidden_stash' : 'wooden_chest')}
                      onChange={(e) => {
                        const ct = e.target.value as ContainerType;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: ct, status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              containerType: ct
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="wooden_chest">📦 Baú de Madeira</option>
                      <option value="iron_chest">🛡️ Baú de Ferro</option>
                      <option value="ornate_chest">✨ Baú Nobre / Rúnico</option>
                      <option value="hidden_stash">💎 Esconderijo (Fundo Falso)</option>
                      <option value="mimic">🦷 Mímico Camuflado!</option>
                    </select>
                  </div>
                </div>

                {/* 2. Status do Recipiente */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'locked', label: '🔒 Trancado', activeClass: 'bg-amber-600 border-amber-500 text-white' },
                      { id: 'unlocked', label: '🔓 Destrancado', activeClass: 'bg-sky-600 border-sky-500 text-white' },
                      { id: 'open', label: '📦 Aberto', activeClass: 'bg-indigo-600 border-indigo-500 text-white' },
                      { id: 'looted', label: '✨ Saqueado', activeClass: 'bg-emerald-600 border-emerald-500 text-white' },
                    ].map((s) => {
                      const isCurrent = (editingCell.cell.chestConfig?.status || 'locked') === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setEditingCell(prev => prev ? {
                              ...prev,
                              cell: {
                                ...prev.cell,
                                chestConfig: {
                                  ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: s.id as ContainerStatus, lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                  status: s.id as ContainerStatus
                                }
                              }
                            } : null);
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all border text-center ${
                            isCurrent
                              ? `${s.activeClass} shadow`
                              : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:bg-[#161c28]'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CDs D&D */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔑 Lockpick</label>
                    <input
                      type="number"
                      value={editingCell.cell.chestConfig?.lockpickDC ?? 15}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              lockpickDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔨 Arrombar</label>
                    <input
                      type="number"
                      value={editingCell.cell.chestConfig?.breakDC ?? 16}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              breakDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">👁️ Investigar</label>
                    <input
                      type="number"
                      value={editingCell.cell.chestConfig?.detectDC ?? 15}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              detectDC: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* 4. Armadilha no Fecho */}
                <div className="bg-[#0a0d14] border border-[#2a3449] rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-rose-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingCell.cell.chestConfig?.isTrapped || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                isTrapped: checked,
                                trapDisarmDC: prev.cell.chestConfig?.trapDisarmDC ?? 15,
                                trapDescription: prev.cell.chestConfig?.trapDescription || 'Agulha envenenada: 2d6 de dano de veneno (CD 13 CON)'
                              }
                            }
                          } : null);
                        }}
                        className="rounded accent-rose-500 bg-[#121824] border-[#2a3449]"
                      />
                      <span>⚠️ Armadilha no Fecho</span>
                    </label>
                    {editingCell.cell.chestConfig?.isTrapped && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                        <span>CD Desarmar:</span>
                        <input
                          type="number"
                          value={editingCell.cell.chestConfig?.trapDisarmDC ?? 15}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setEditingCell(prev => prev ? {
                              ...prev,
                              cell: {
                                ...prev.cell,
                                chestConfig: {
                                  ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                  trapDisarmDC: val
                                }
                              }
                            } : null);
                          }}
                          className="w-12 bg-[#121824] border border-[#2a3449] rounded px-1.5 py-0.5 text-center text-rose-300 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                  {editingCell.cell.chestConfig?.isTrapped && (
                    <input
                      type="text"
                      placeholder="Descrição / Efeito da armadilha..."
                      value={editingCell.cell.chestConfig?.trapDescription || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              trapDescription: val
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                    />
                  )}
                </div>

                {/* 5. Gerenciador de Tesouro & Gerador de Loot */}
                <div className="bg-[#0a0d14] border border-[#2a3449] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-amber-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" /> Tesouro & Itens
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Gerar tesouro Tier 1 (Nv 1-4)"
                        onClick={() => {
                          const gp = 15 + Math.floor(Math.random() * 45);
                          const sp = 20 + Math.floor(Math.random() * 80);
                          const items = ['Poção de Cura (2d4+2)'];
                          if (Math.random() > 0.4) items.push('Pergaminho de Mísseis Mágicos');
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { gp, sp, cp: 50, pp: 0, items }
                              }
                            }
                          } : null);
                          toast.success('Loot Tier 1 gerado!');
                        }}
                        className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold transition-all"
                      >
                        🎲 Nv 1-4
                      </button>
                      <button
                        type="button"
                        title="Gerar tesouro Tier 2 (Nv 5-10)"
                        onClick={() => {
                          const gp = 180 + Math.floor(Math.random() * 320);
                          const sp = 150 + Math.floor(Math.random() * 250);
                          const pp = 8 + Math.floor(Math.random() * 15);
                          const items = ['Poção de Cura Maior (4d4+4)', 'Gema de Rubi (100 PO)', 'Pergaminho de Bola de Fogo'];
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { gp, sp, pp, cp: 0, items }
                              }
                            }
                          } : null);
                          toast.success('Loot Tier 2 gerado!');
                        }}
                        className="px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded text-[10px] font-bold transition-all"
                      >
                        🎲 Nv 5-10
                      </button>
                      <button
                        type="button"
                        title="Gerar tesouro Tier 3+ (Nv 11+)"
                        onClick={() => {
                          const gp = 1500 + Math.floor(Math.random() * 2500);
                          const pp = 120 + Math.floor(Math.random() * 200);
                          const items = ['Poção de Cura Suprema (10d4+20)', 'Diamante Puro (500 PO)', 'Anel de Proteção Mágica (+1)'];
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { gp, pp, sp: 0, cp: 0, items }
                              }
                            }
                          } : null);
                          toast.success('Loot Tier 3+ gerado!');
                        }}
                        className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold transition-all"
                      >
                        🎲 Nv 11+
                      </button>
                    </div>
                  </div>

                  {/* Moedas */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-amber-400">PO (Ouro)</span>
                      <input
                        type="number"
                        value={editingCell.cell.chestConfig?.loot?.gp ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { ...(prev.cell.chestConfig?.loot || {}), gp: val }
                              }
                            }
                          } : null);
                        }}
                        className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-amber-200 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-300">PP (Prata)</span>
                      <input
                        type="number"
                        value={editingCell.cell.chestConfig?.loot?.sp ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { ...(prev.cell.chestConfig?.loot || {}), sp: val }
                              }
                            }
                          } : null);
                        }}
                        className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-slate-300 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-orange-400">PC (Cobre)</span>
                      <input
                        type="number"
                        value={editingCell.cell.chestConfig?.loot?.cp ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { ...(prev.cell.chestConfig?.loot || {}), cp: val }
                              }
                            }
                          } : null);
                        }}
                        className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-orange-200 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-cyan-300">PL (Platina)</span>
                      <input
                        type="number"
                        value={editingCell.cell.chestConfig?.loot?.pp ?? 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setEditingCell(prev => prev ? {
                            ...prev,
                            cell: {
                              ...prev.cell,
                              chestConfig: {
                                ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                                loot: { ...(prev.cell.chestConfig?.loot || {}), pp: val }
                              }
                            }
                          } : null);
                        }}
                        className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-cyan-200 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Itens */}
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400 mb-0.5">Itens / Poções (1 por linha)</span>
                    <textarea
                      rows={2}
                      placeholder="Ex: Poção de Cura&#10;Pergaminho de Invisibilidade"
                      value={(editingCell.cell.chestConfig?.loot?.items || []).join('\n')}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const items = raw.split('\n').filter(line => line.trim().length > 0);
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              loot: { ...(prev.cell.chestConfig?.loot || {}), items }
                            }
                          }
                        } : null);
                      }}
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono"
                    />
                  </div>
                </div>

                {/* 6. Visibilidade para Jogadores */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="chestRevealedCheck"
                    checked={editingCell.cell.chestConfig?.revealedToPlayers ?? true}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          chestConfig: {
                            ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                            revealedToPlayers: checked
                          }
                        }
                      } : null);
                    }}
                    className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                  />
                  <label htmlFor="chestRevealedCheck" className="text-xs text-slate-300 cursor-pointer">
                    Visível aos Jogadores no Mapa
                  </label>
                </div>
              </div>
            )}

            {editingCell.cell.type === 'trigger' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Gatilho</label>
                  <select
                    value={editingCell.cell.triggerConfig?.triggerType || 'lever'}
                    onChange={(e) => {
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), triggerType: e.target.value as any } }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="lever">Alavanca</option>
                    <option value="pressure_plate">Placa de Pressão</option>
                    <option value="button">Botão / Runas</option>
                    <option value="chain">Corrente de Puxar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado</label>
                  <select
                    value={editingCell.cell.triggerConfig?.state || 'inactive'}
                    onChange={(e) => {
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), state: e.target.value as 'inactive' | 'active' } }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="inactive">Inativo (Desligado)</option>
                    <option value="active">Ativo (Ligado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ID do Alvo (Target ID)</label>
                  <input
                    type="text"
                    value={editingCell.cell.triggerConfig?.targetId || ''}
                    onChange={(e) => {
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), targetId: e.target.value } }
                      } : null);
                    }}
                    placeholder="Ex: grade-123456"
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">Quando ativado, envia sinal para alterar o estado do alvo.</span>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="triggerSecretCheck"
                    checked={editingCell.cell.triggerConfig?.isSecret ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), isSecret: checked } }
                      } : null);
                    }}
                    className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                  />
                  <label htmlFor="triggerSecretCheck" className="text-xs text-slate-300 cursor-pointer">
                    É um gatilho secreto/escondido?
                  </label>
                </div>
                {(editingCell.cell.triggerConfig?.isSecret) && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="triggerRevealedCheck"
                      checked={editingCell.cell.triggerConfig?.revealedToPlayers ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: { ...prev.cell, triggerConfig: { ...prev.cell.triggerConfig!, revealedToPlayers: checked } }
                        } : null);
                      }}
                      className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                    />
                    <label htmlFor="triggerRevealedCheck" className="text-xs text-slate-300 cursor-pointer">
                      Revelado aos jogadores
                    </label>
                  </div>
                )}
              </div>
            )}

            {editingCell.cell.type === 'portcullis' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status da Grade</label>
                  <select
                    value={editingCell.cell.portcullisConfig?.status || 'closed'}
                    onChange={(e) => {
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, portcullisConfig: { ...(prev.cell.portcullisConfig || { id: `grade-${Math.random().toString(36).substring(2, 8)}`, status: 'closed', material: 'iron', name: '' }), status: e.target.value as 'open' | 'closed' } }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="closed">Abaixada (Bloqueia Passagem)</option>
                    <option value="open">Erguida (Livre Passagem)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ID da Grade</label>
                  <input
                    type="text"
                    readOnly
                    value={editingCell.cell.portcullisConfig?.id || ''}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none cursor-copy"
                    onClick={(e) => {
                      navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                      toast.success('ID copiado!');
                    }}
                  />
                  <span className="text-[9px] text-slate-500 mt-1 block">Clique para copiar. Use no ID do Alvo de Gatilhos.</span>
                </div>
              </div>
            )}

            {editingCell.cell.type === 'illusion_wall' && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Bloqueia Visão?</label>
                  <select
                    value={editingCell.cell.illusionWallConfig?.blocksLight ? 'true' : 'false'}
                    onChange={(e) => {
                      const blocksLight = e.target.value === 'true';
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, illusionWallConfig: { ...(prev.cell.illusionWallConfig || { detectDC: 15, revealedToPlayers: false, blocksLight: true }), blocksLight } }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="true">Sim (Parece parede real até descoberta)</option>
                    <option value="false">Não (Luz/visão passam direto)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="illusionRevealedCheck"
                    checked={editingCell.cell.illusionWallConfig?.revealedToPlayers ?? false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: { ...prev.cell, illusionWallConfig: { ...(prev.cell.illusionWallConfig || { detectDC: 15, revealedToPlayers: false, blocksLight: true }), revealedToPlayers: checked } }
                      } : null);
                    }}
                    className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                  />
                  <label htmlFor="illusionRevealedCheck" className="text-xs text-slate-300 cursor-pointer">
                    Descoberta pelos Jogadores
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-5 border-t border-[#2a3449]/40 pt-3.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDrawing(false);
                  setDrawButton(-1);
                  onGridChange((prev) => {
                    const copy = prev.map(row => row.map(cell => ({ ...cell })));
                    const cell = copy[editingCell.r][editingCell.c];
                    if (editingCell.cell.type === 'door') {
                      cell.doorConfig = editingCell.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 };
                    } else if (editingCell.cell.type === 'trap') {
                      cell.trapConfig = editingCell.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false };
                    } else if (editingCell.cell.type === 'chest' || editingCell.cell.type === 'stash') {
                      cell.chestConfig = editingCell.cell.chestConfig || {
                        name: editingCell.cell.type === 'chest' ? 'Baú' : 'Esconderijo',
                        containerType: editingCell.cell.type === 'stash' ? 'hidden_stash' : 'wooden_chest',
                        status: 'locked',
                        lockpickDC: 15,
                        breakDC: 16,
                        revealedToPlayers: editingCell.cell.type === 'chest',
                        loot: { gp: 25, items: [] }
                      };
                    } else if (editingCell.cell.type === 'trigger') {
                      const newConfig = editingCell.cell.triggerConfig || {
                        id: `trigger-${Math.random().toString(36).substring(2, 8)}`,
                        targetId: '',
                        triggerType: 'lever',
                        state: 'inactive',
                        name: '',
                        isSecret: false,
                        revealedToPlayers: true
                      };
                      const oldState = cell.triggerConfig?.state;
                      cell.triggerConfig = newConfig;

                      if (oldState && oldState !== newConfig.state && newConfig.targetId) {
                        let targetFound = false;
                        for (let i = 0; i < copy.length; i++) {
                          for (let j = 0; j < copy[0].length; j++) {
                            const tc = copy[i][j];
                            if (tc.type === 'portcullis' && tc.portcullisConfig?.id === newConfig.targetId) {
                              tc.portcullisConfig = {
                                ...tc.portcullisConfig,
                                status: newConfig.state === 'active' ? 'open' : 'closed'
                              };
                              targetFound = true;
                            }
                          }
                        }
                        if (targetFound) {
                          setTimeout(() => toast.success('A engrenagem girou! A grade conectada foi acionada.'), 300);
                        }
                      }
                    } else if (editingCell.cell.type === 'portcullis') {
                      cell.portcullisConfig = editingCell.cell.portcullisConfig || {
                        id: `grade-${Math.random().toString(36).substring(2, 8)}`,
                        status: 'closed',
                        material: 'iron',
                        name: ''
                      };
                    } else if (editingCell.cell.type === 'illusion_wall') {
                      cell.illusionWallConfig = editingCell.cell.illusionWallConfig || {
                        detectDC: 15,
                        revealedToPlayers: false,
                        blocksLight: true
                      };
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDrawing(false);
                  setDrawButton(-1);
                  onGridChange((prev) => {
                    const copy = prev.map(row => row.map(cell => ({ ...cell })));
                    copy[editingCell.r][editingCell.c].type = 'floor';
                    copy[editingCell.r][editingCell.c].doorConfig = undefined;
                    copy[editingCell.r][editingCell.c].trapConfig = undefined;
                    copy[editingCell.r][editingCell.c].chestConfig = undefined;
                    copy[editingCell.r][editingCell.c].triggerConfig = undefined;
                    copy[editingCell.r][editingCell.c].portcullisConfig = undefined;
                    copy[editingCell.r][editingCell.c].illusionWallConfig = undefined;
                    return copy;
                  });
                  setEditingCell(null);
                  toast.success('Elemento removido.');
                }}
                className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-300 font-semibold rounded-lg text-xs transition-all text-center cursor-pointer font-sans"
              >
                Remover
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDrawing(false);
                  setDrawButton(-1);
                  setEditingCell(null);
                }}
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
          className="fixed pointer-events-none z-40 bg-[#0d1117]/95 border border-[#30363d] rounded-xl shadow-2xl p-3 w-[260px] text-xs font-sans text-slate-200 backdrop-blur-md animate-fade-in"
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

          {(hoveredCell.cell.type === 'chest' || hoveredCell.cell.type === 'stash') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-800">
                <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] truncate">
                  {hoveredCell.cell.type === 'chest' ? '🧰' : '💎'} {hoveredCell.cell.chestConfig?.name || 'Recipiente'}
                </span>
                {hoveredCell.cell.chestConfig?.containerType === 'mimic' && (
                  <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[9px] font-bold">
                    🦷 MÍMICO
                  </span>
                )}
              </div>
              <div className="pt-0.5 flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado:</span>
                  <span className={`font-bold capitalize ${
                    hoveredCell.cell.chestConfig?.status === 'open' ? 'text-indigo-400' :
                    hoveredCell.cell.chestConfig?.status === 'looted' ? 'text-emerald-400' :
                    hoveredCell.cell.chestConfig?.status === 'unlocked' ? 'text-sky-400' : 'text-amber-400'
                  }`}>
                    {hoveredCell.cell.chestConfig?.status === 'open' ? '📦 Aberto' :
                     hoveredCell.cell.chestConfig?.status === 'looted' ? '✨ Saqueado' :
                     hoveredCell.cell.chestConfig?.status === 'unlocked' ? '🔓 Destrancado' : '🔒 Trancado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CDs (Lock / Força):</span>
                  <span className="font-mono font-bold text-slate-300">
                    DC {hoveredCell.cell.chestConfig?.lockpickDC ?? 15} / {hoveredCell.cell.chestConfig?.breakDC ?? 16}
                  </span>
                </div>
                {hoveredCell.cell.chestConfig?.detectDC && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">CD Percepção/Invest.:</span>
                    <span className="font-mono font-bold text-slate-300">
                      DC {hoveredCell.cell.chestConfig.detectDC}
                    </span>
                  </div>
                )}
                {hoveredCell.cell.chestConfig?.isTrapped && (
                  <div className="flex justify-between text-rose-400 border-t border-slate-800/40 pt-1">
                    <span>⚠️ Armadilha no Fecho:</span>
                    <span className="font-mono font-bold">DC {hoveredCell.cell.chestConfig.trapDisarmDC ?? 15}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-800/50 pt-1 mt-0.5">
                  <span className="text-slate-400">Visível aos Jogadores:</span>
                  <span className={`font-bold ${hoveredCell.cell.chestConfig?.revealedToPlayers ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {hoveredCell.cell.chestConfig?.revealedToPlayers ? 'Sim' : 'Não'}
                  </span>
                </div>
                {/* Loot preview */}
                {hoveredCell.cell.chestConfig?.loot && (
                  <div className="bg-slate-950/60 rounded p-1.5 border border-slate-800/60 mt-1 space-y-0.5">
                    <div className="flex flex-wrap gap-1 text-[10px] text-amber-300 font-mono">
                      {hoveredCell.cell.chestConfig.loot.gp ? <span>🪙 {hoveredCell.cell.chestConfig.loot.gp} PO</span> : null}
                      {hoveredCell.cell.chestConfig.loot.sp ? <span>⚪ {hoveredCell.cell.chestConfig.loot.sp} PP</span> : null}
                      {hoveredCell.cell.chestConfig.loot.cp ? <span>🟤 {hoveredCell.cell.chestConfig.loot.cp} PC</span> : null}
                      {hoveredCell.cell.chestConfig.loot.pp ? <span>💎 {hoveredCell.cell.chestConfig.loot.pp} PL</span> : null}
                    </div>
                    {hoveredCell.cell.chestConfig.loot.items && hoveredCell.cell.chestConfig.loot.items.length > 0 && (
                      <div className="text-[10px] text-slate-300 truncate">
                        📦 {hoveredCell.cell.chestConfig.loot.items.join(', ')}
                      </div>
                    )}
                  </div>
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
      {/* Floating Center / Fit View Button */}
      <button
        type="button"
        onClick={fitAndCenterView}
        className="absolute bottom-4 right-4 z-30 p-2.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 text-amber-400 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer pointer-events-auto"
        title="Centralizar e Enquadrar Masmorra na Tela"
      >
        <Maximize2 className="w-4 h-4" />
        <span className="hidden sm:inline">Centralizar Mapa</span>
      </button>
    </div>
  );
};
