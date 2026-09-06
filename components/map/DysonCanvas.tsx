'use client';

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  Ruler, 
  Check, 
  CheckCircle2, 
  X, 
  Undo2, 
  Maximize2,
  SlidersHorizontal,
  Grid
} from 'lucide-react';
import { 
  drawLightSourceIcon, 
  drawStashIcon, 
  drawTransitionIcon, 
  drawPOIIcon 
} from './dysonCore';
import { DungeonTransitionModal } from './DungeonTransitionModal';
import { MapLevel, DungeonTransitionConfig, Combatant, VisionType, WallSegment, LightSource } from '@/lib/types';
import { Cell, TileType, ContainerType, ContainerStatus } from '../MapMaker';
import { getCreatureGridSize } from '@/lib/utils/creatureSize';
import { evaluateTokenStep } from '@/lib/reactive/reactiveSceneEngine';
import { ReactiveTrapEffect } from '@/lib/reactive/reactiveTypes';
import { ContainerLootModal } from '@/components/loot/ContainerLootModal';
import { ItemCompendiumModal } from '@/components/character-sheet/Modals/ItemCompendiumModal';
import { CampaignDocumentSelectModal } from '@/components/loot/CampaignDocumentSelectModal';
import { documentToEquipmentItem } from '@/lib/utils/campaignDocumentUtils';
import { 
  hasLineOfSight, 
  isCellBlockingVision, 
  revealVisionWithLOS, 
  getTokenVisionRadius, 
  getCombatantVisionType, 
  findDoorNearPoint, 
  toggleDoorState, 
  getDoorSoundPreset 
} from './visionCore';

// Hooks de Performance
import { useLightingEngine } from './hooks/useLightingEngine';
import { useStaticMapBake } from './hooks/useStaticMapBake';

// Modais Modulares
import { CellConfigModal, EditingCellState } from './modals/CellConfigModal';
import { RulerHUD } from './modals/RulerHUD';
import { CellHoverTooltip } from './modals/CellHoverTooltip';
import { resolveTokenAvatar } from '@/lib/utils/tokenAvatarResolver';

const token2DImageCache = new Map<string, HTMLImageElement>();

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

export interface DrawingStroke {
  id: string;
  tool: string;
  color: string;
  lineWidth: number;
  points: { x: number; y: number }[];
  text?: string;
  fontSize?: number;
}

interface DraggingItem {
  kind: 'token' | 'poi' | 'light';
  tokenName?: string;
  tokenColor?: string;
  poiType?: TileType;
  poiCell?: Cell;
  lightId?: string;
  light?: LightSource;
  startR: number;
  startC: number;
  currentR: number;
  currentC: number;
  startX?: number;
  startY?: number;
  currentX?: number;
  currentY?: number;
}

interface DysonCanvasProps {
  grid: Cell[][];
  bgImageUrl: string | null;
  gridScale: number;
  gridOffsetX: number;
  gridOffsetY: number;
  combatants: Combatant[];
  selectedTool: 'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan' | 'light' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text';
  setSelectedTool?: (tool: 'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan' | 'light' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text') => void;
  boxMode?: 'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover';
  selectedTileType: string;
  selectedTokenCombatant: Combatant | null;
  measureStart?: { r: number; c: number } | null;
  setMeasureStart?: (pos: { r: number; c: number } | null) => void;
  setMeasuredDistance?: (dist: { feet: number; meters: number } | null) => void;
  onGridChange: (updater: (prev: Cell[][]) => Cell[][]) => void;
  calibrationLine?: { x1: number; y1: number; x2: number; y2: number } | null;
  setCalibrationLine?: (line: { x1: number; y1: number; x2: number; y2: number } | null) => void;
  onCalibrateGridSize?: (size: number) => void;
  isPlayerView?: boolean;
  lightSources?: LightSource[];
  onAddLightSource?: (light: LightSource) => void;
  onRemoveLightSource?: (id: string) => void;
  onUpdateLightSource?: (light: LightSource) => void;
  selectedLightPreset?: 'torch' | 'candle' | 'lantern' | 'spell' | 'dragon';
  vectorWalls?: WallSegment[];
  activeLevels?: MapLevel[];
  currentLevelId?: string | null;
  onTransitionAction?: (action: 'teleport_party' | 'teleport_token', targetLevelId: string, spR?: number, spC?: number, tokenName?: string) => void;
  drawings?: DrawingStroke[];
  onDrawingAction?: (data: { action: 'add' | 'remove' | 'clear'; stroke?: DrawingStroke; strokeId?: string }) => void;
  drawColor?: string;
  drawLineWidth?: number;
  onSaveTransitionWithTargetLevel?: (
    config: DungeonTransitionConfig,
    r: number,
    c: number,
    autoCreateLinked: boolean,
    linkedTargetInfo?: { targetLevelId: string; targetR: number; targetC: number; linkedTransitionId?: string; name?: string }
  ) => void;
  renderLighting?: boolean;
  renderVision?: boolean;
  renderFog?: boolean;
  onUpdateVectorWalls?: (walls: WallSegment[]) => void;
}

export const DysonCanvas: React.FC<DysonCanvasProps> = ({
  grid,
  bgImageUrl,
  gridScale,
  gridOffsetX,
  gridOffsetY,
  combatants,
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
  lightSources = [],
  onAddLightSource,
  onRemoveLightSource,
  onUpdateLightSource,
  selectedLightPreset = 'torch',
  vectorWalls = [],
  activeLevels,
  currentLevelId,
  onTransitionAction,
  drawings = [],
  onDrawingAction,
  drawColor = '#f59e0b',
  drawLineWidth = 4,
  onSaveTransitionWithTargetLevel,
  renderLighting = true,
  renderVision = true,
  renderFog = true,
  onUpdateVectorWalls,
}) => {
  // 5 Dedicated Canvas Layers
  const staticCanvasRef = useRef<HTMLCanvasElement>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenMaskRef = useRef<HTMLCanvasElement | null>(null);
  const lastPaintedCellRef = useRef<{ r: number; c: number; tool: string } | null>(null);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawButton, setDrawButton] = useState(-1);
  const [selectionBox, setSelectionBox] = useState<{ startR: number; startC: number; currentR: number; currentC: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageCacheVersion, setImageCacheVersion] = useState(0);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);
  const [activeLootContainer, setActiveLootContainer] = useState<EditingCellState | null>(null);
  const [isChestCompendiumOpen, setIsChestCompendiumOpen] = useState(false);
  const [isChestCampaignDocsOpen, setIsChestCampaignDocsOpen] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; cell: Cell } | null>(null);
  const [draggingItem, setDraggingItem] = useState<DraggingItem | null>(null);
  const dragCandidateRef = useRef<{
    kind: 'token' | 'poi' | 'light';
    startR: number;
    startC: number;
    startX: number;
    startY: number;
    initialClientX: number;
    initialClientY: number;
    tokenName?: string;
    tokenColor?: string;
    cell?: Cell;
    light?: LightSource;
  } | null>(null);
  const activeStrokeRef = useRef<DrawingStroke | null>(null);
  const strokeCounterRef = useRef<number>(0);

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

  useEffect(() => {
    panOffsetRef.current = panOffset;
    zoomRef.current = zoom;
    selectedToolRef.current = selectedTool;
    rulerPointsRef.current = rulerPoints;
    rulerCursorRef.current = rulerCursor;
    rulerStatusRef.current = rulerStatus;
    gridDims.current = { rows: grid.length, cols: grid[0]?.length || 0 };
  }, [panOffset, zoom, selectedTool, rulerPoints, rulerCursor, rulerStatus, grid]);

  // Hook 1: Baked Static Map Engine (Hachuras + Paredes + Fundo)
  const { getBakedCanvas, markDirty: markStaticMapDirty, bakeVersion } = useStaticMapBake({
    grid,
    bgImage,
    cellSize: CELL_SIZE,
    gridOffsetX,
    gridOffsetY,
    isPlayerView
  });

  // Hook 2: Demand-Driven Lighting & Shadow Engine
  const {
    playerTokens,
    tokenVisionPolygons,
    lightPolygons,
    getLightFlickerParams,
  } = useLightingEngine({
    grid,
    lightSources,
    combatants,
    vectorWalls,
    cellSize: CELL_SIZE,
    gridOffsetX,
    gridOffsetY,
    bgImageUrl,
    isPlayerView,
    renderLighting,
    renderVision,
  });

  // Viewport culling boundaries
  const getViewportBounds = useCallback(() => {
    const container = containerRef.current;
    const width = canvasSize.width || container?.clientWidth || 800;
    const height = canvasSize.height || container?.clientHeight || 600;

    const localLeft = -panOffset.x / zoom;
    const localRight = (-panOffset.x + width) / zoom;
    const localTop = -panOffset.y / zoom;
    const localBottom = (-panOffset.y + height) / zoom;

    const startCol = Math.max(0, Math.floor((localLeft - (bgImage ? gridOffsetX : 0)) / CELL_SIZE) - 1);
    const endCol = Math.min(COLS - 1, Math.ceil((localRight - (bgImage ? gridOffsetX : 0)) / CELL_SIZE) + 1);
    const startRow = Math.max(0, Math.floor((localTop - (bgImage ? gridOffsetY : 0)) / CELL_SIZE) - 1);
    const endRow = Math.min(ROWS - 1, Math.ceil((localBottom - (bgImage ? gridOffsetY : 0)) / CELL_SIZE) + 1);

    return { width, height, startCol, endCol, startRow, endRow };
  }, [canvasSize, panOffset, zoom, bgImage, gridOffsetX, gridOffsetY, CELL_SIZE, COLS, ROWS]);

  // Handle Container Dimensions & Window Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setCanvasSize({ width: clientWidth, height: clientHeight });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Background Image Loader
  useEffect(() => {
    let cancelled = false;
    if (bgImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = bgImageUrl;
      img.onload = () => {
        if (!cancelled) setBgImage(img);
      };
    } else {
      Promise.resolve().then(() => {
        if (!cancelled) setBgImage(null);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [bgImageUrl]);

  // Helper de sincronização de dimensões
  const syncCanvasDimensions = (canvas: HTMLCanvasElement, width: number, height: number) => {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  // =========================================================================
  // CAMADA 1: RENDERIZAÇÃO DO MAPA ESTÁTICO (BAKED BUFFER BLIT)
  // Zero recálculo de hachuras, zero curvas de bézier em runtime!
  // =========================================================================
  const renderStaticLayer = useCallback(() => {
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = getViewportBounds();
    if (width <= 0 || height <= 0) return;

    syncCanvasDimensions(canvas, width, height);
    ctx.clearRect(0, 0, width, height);

    const baked = getBakedCanvas();
    if (!baked) return;

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(baked, 0, 0);
    ctx.restore();
  }, [getViewportBounds, getBakedCanvas, panOffset, zoom, bakeVersion]);

  useEffect(() => {
    renderStaticLayer();
  }, [renderStaticLayer]);

  // =========================================================================
  // CAMADA 2: LUZ, SOMBRAS & NÉVOA DE GUERRA (SOB DEMANDA)
  // Animação de tochas roda isolada sem recalcular física de sombras!
  // =========================================================================
  const renderLightingLayer = useCallback((now = Date.now()) => {
    const canvas = lightingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height, startCol, endCol, startRow, endRow } = getViewportBounds();
    if (width <= 0 || height <= 0) return;

    syncCanvasDimensions(canvas, width, height);
    ctx.clearRect(0, 0, width, height);

    // 1. Fog of War Mask
    if (renderFog) {
      if (!offscreenMaskRef.current) {
        offscreenMaskRef.current = document.createElement('canvas');
      }
      const maskCanvas = offscreenMaskRef.current;
      syncCanvasDimensions(maskCanvas, width, height);
      const maskCtx = maskCanvas.getContext('2d');

      if (maskCtx) {
        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.globalCompositeOperation = 'source-over';
        maskCtx.clearRect(0, 0, width, height);

        // Preenche névoa escura em screen space
        maskCtx.fillStyle = isPlayerView ? 'rgba(8, 8, 12, 0.98)' : 'rgba(8, 8, 12, 0.45)';
        maskCtx.fillRect(0, 0, width, height);

        maskCtx.translate(panOffset.x, panOffset.y);
        maskCtx.scale(zoom, zoom);
        maskCtx.globalCompositeOperation = 'destination-out';
        maskCtx.filter = 'blur(6px)';

        // Recorta áreas exploradas
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

        // Visão dos tokens de jogadores (polígonos do useLightingEngine)
        if (renderVision) {
          tokenVisionPolygons.forEach(({ tx, ty, visionRadiusPx, polyPoints }) => {
            if (polyPoints.length > 0) {
              maskCtx.save();
              maskCtx.beginPath();
              maskCtx.moveTo(polyPoints[0].x, polyPoints[0].y);
              for (let p = 1; p < polyPoints.length; p++) {
                maskCtx.lineTo(polyPoints[p].x, polyPoints[p].y);
              }
              maskCtx.closePath();

              const grad = maskCtx.createRadialGradient(tx, ty, CELL_SIZE * 0.5, tx, ty, visionRadiusPx);
              grad.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
              grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
              grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

              maskCtx.fillStyle = grad;
              maskCtx.fill();
              maskCtx.restore();
            }
          });
        }

        // Fontes de luz (polígonos do useLightingEngine)
        if (renderLighting) {
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
        }

        maskCtx.filter = 'none';
        ctx.drawImage(maskCanvas, 0, 0);
      }
    }

    // 2. Brilho Ambiente Colorido (Composite 'screen' com flicker isolado)
    if (renderLighting) {
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      ctx.scale(zoom, zoom);
      ctx.globalCompositeOperation = 'screen';

      lightPolygons.forEach(({ light, lx, ly, lRadius, polyPoints, isVisible }) => {
        if (!isVisible || polyPoints.length === 0) return;

        const { alphaMultiplier, radiusMultiplier } = getLightFlickerParams(light, now);
        const effectiveRadius = lRadius * radiusMultiplier;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
        for (let p = 1; p < polyPoints.length; p++) {
          ctx.lineTo(polyPoints[p].x, polyPoints[p].y);
        }
        ctx.closePath();

        const lightColor = light.color || '#ffaa33';
        const grad = ctx.createRadialGradient(lx, ly, 5, lx, ly, effectiveRadius);
        grad.addColorStop(0.0, hexToRgba(lightColor, 0.75 * alphaMultiplier));
        grad.addColorStop(0.45, hexToRgba(lightColor, 0.3 * alphaMultiplier));
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    }
  }, [
    getViewportBounds, 
    renderFog, 
    renderVision, 
    renderLighting, 
    isPlayerView, 
    panOffset, 
    zoom, 
    grid, 
    bgImage, 
    gridOffsetX, 
    gridOffsetY, 
    CELL_SIZE, 
    tokenVisionPolygons, 
    lightPolygons, 
    getLightFlickerParams
  ]);

  // Loop de animação de flicker das tochas
  useEffect(() => {
    const hasAnimatedLights = renderLighting && lightSources.some(
      l => l.animation === 'torch' || l.animation === 'candle' || l.animation === 'pulse'
    );

    if (!hasAnimatedLights) {
      renderLightingLayer();
      return;
    }

    let rafId: number;
    let lastTime = 0;
    const loop = (time: number) => {
      // Throttle de ~30 FPS para flicker orgânico sem custo excessivo
      if (time - lastTime > 32) {
        lastTime = time;
        renderLightingLayer(time);
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [renderLighting, lightSources, renderLightingLayer]);

  // =========================================================================
  // CAMADA 3: ENTIDADES (TOKENS, POIs, ÍCONES DE LUZ, VECTOR WALLS)
  // =========================================================================
  const renderEntitiesLayer = useCallback(() => {
    const canvas = entitiesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height, startCol, endCol, startRow, endRow } = getViewportBounds();
    if (width <= 0 || height <= 0) return;

    syncCanvasDimensions(canvas, width, height);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 1. Ícones de POI do mapa
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = grid[r]?.[c];
        if (!cell) continue;

        const x = c * CELL_SIZE + CELL_SIZE / 2;
        const y = r * CELL_SIZE + CELL_SIZE / 2;

        if (cell.type === 'door') {
          const config = cell.doorConfig;
          if (isPlayerView && config?.doorType === 'secret' && !config?.secretRevealed) continue;
          drawPOIIcon(ctx, x, y, 'door', zoom);
        } else if (cell.type === 'trap') {
          if (isPlayerView && !cell.trapConfig?.revealedToPlayers) continue;
          drawPOIIcon(ctx, x, y, 'trap', zoom);
        } else if (cell.type === 'chest') {
          drawPOIIcon(ctx, x, y, 'chest', zoom);
        } else if (cell.type === 'stash') {
          if (isPlayerView && !cell.chestConfig?.revealedToPlayers) continue;
          drawStashIcon(ctx, x, y, cell.chestConfig?.status === 'looted', zoom);
        } else if (cell.type === 'transition') {
          const tType = cell.transitionConfig?.type || 'stairs_down';
          drawTransitionIcon(ctx, x, y, tType, cell.transitionConfig?.name, zoom);
        }
      }
    }

    // 2. Paredes Vetoriais e Portas
    if (vectorWalls && vectorWalls.length > 0) {
      vectorWalls.forEach((wall) => {
        const x1 = (bgImage ? gridOffsetX : 0) + wall.x1 * CELL_SIZE;
        const y1 = (bgImage ? gridOffsetY : 0) + wall.y1 * CELL_SIZE;
        const x2 = (bgImage ? gridOffsetX : 0) + wall.x2 * CELL_SIZE;
        const y2 = (bgImage ? gridOffsetY : 0) + wall.y2 * CELL_SIZE;

        if (wall.type === 'secret_door' && isPlayerView && wall.doorState === 'closed') {
          return;
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        if (wall.type === 'door' || wall.type === 'secret_door') {
          const isOpen = wall.doorState === 'open';
          const isLocked = wall.doorState === 'locked';
          const isBroken = wall.doorState === 'broken';

          ctx.strokeStyle = isBroken ? '#94a3b8' : isLocked ? '#ef4444' : isOpen ? '#22c55e' : '#f59e0b';
          ctx.lineWidth = 4;
          ctx.setLineDash(isOpen ? [4, 6] : [6, 3]);

          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          ctx.fillStyle = isBroken ? '#94a3b8' : isLocked ? '#ef4444' : isOpen ? '#22c55e' : '#f59e0b';
          ctx.fillRect(mx - 5, my - 5, 10, 10);

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(mx - 5, my - 5, 10, 10);
        } else if (wall.type === 'window') {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3.5;
          ctx.setLineDash([4, 4]);
        } else if (wall.type === 'illusion') {
          ctx.strokeStyle = isPlayerView ? 'transparent' : '#06b6d4';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([2, 4]);
        } else {
          ctx.strokeStyle = isPlayerView ? 'transparent' : '#ef4444';
          ctx.lineWidth = 3;
        }

        ctx.stroke();
        ctx.restore();
      });
    }

    // 3. Ícones de Decoração de Luz (Estilo Dyson)
    if (lightSources && lightSources.length > 0) {
      lightSources.forEach((light) => {
        const lx = bgImage ? gridOffsetX + light.x * CELL_SIZE : light.x * CELL_SIZE;
        const ly = bgImage ? gridOffsetY + light.y * CELL_SIZE : light.y * CELL_SIZE;

        let preset: 'torch' | 'candle' | 'lantern' | 'spell' | 'dragon' = 'torch';
        if (light.color === '#ffcc66' || light.brightRadius === 10) preset = 'candle';
        else if (light.color === '#ffee88' || light.brightRadius === 30) preset = 'lantern';
        else if (light.color === '#38bdf8') preset = 'spell';
        else if (light.color === '#ef4444') preset = 'dragon';

        drawLightSourceIcon(ctx, lx, ly, preset, zoom);
      });
    }

    // 4. Tokens de Personagens e Criaturas
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = grid[r]?.[c];
        if (cell?.tokenName) {
          const tokenNameClean = cell.tokenName.trim().toLowerCase();
          const isPlayerToken = cell.tokenColor?.includes('cyan') || 
                                cell.tokenColor?.includes('emerald') || 
                                cell.tokenColor?.includes('green') || 
                                cell.tokenColor?.includes('blue');

          if (isPlayerView && !isPlayerToken && cell.fog) continue;

          const tokenCombatant = combatants?.find(comb => {
            const cName = comb.name.trim().toLowerCase();
            return cName === tokenNameClean || cName.startsWith(tokenNameClean) || tokenNameClean.startsWith(cName.slice(0, 3));
          });

          const sizeInfo = getCreatureGridSize(tokenCombatant?.size);
          const gridSquares = sizeInfo.gridSquares;
          const tokenDiameter = gridSquares * CELL_SIZE;
          const tokenRadius = (tokenDiameter / 2) * 0.88;

          const tx = (bgImage ? gridOffsetX : 0) + c * CELL_SIZE + tokenDiameter / 2;
          const ty = (bgImage ? gridOffsetY : 0) + r * CELL_SIZE + tokenDiameter / 2;

          const isBeingDragged = Boolean(draggingItem?.kind === 'token' && draggingItem.tokenName === cell.tokenName && r === draggingItem.startR && c === draggingItem.startC);

          // Auras
          if (tokenCombatant?.auras && tokenCombatant.auras.length > 0) {
            tokenCombatant.auras.forEach((aura) => {
              if (!aura.enabled) return;
              const auraGridRadius = (aura.radiusFt / 5) * CELL_SIZE;
              const auraColor = aura.visual.colorHex || '#facc15';

              ctx.save();
              ctx.beginPath();
              ctx.arc(tx, ty, auraGridRadius, 0, Math.PI * 2);
              ctx.fillStyle = hexToRgba(auraColor, aura.visual.opacity || 0.2);
              ctx.fill();

              ctx.strokeStyle = auraColor;
              ctx.lineWidth = aura.visual.borderStyle === 'dashed' ? 2 : 1.5;
              if (aura.visual.borderStyle === 'dashed') ctx.setLineDash([6, 4]);
              ctx.stroke();

              ctx.font = 'bold 9px Inter, sans-serif';
              ctx.fillStyle = auraColor;
              ctx.textAlign = 'center';
              ctx.fillText(`${aura.name}`, tx, ty - auraGridRadius - 3);
              ctx.restore();
            });
          }

          // Token Base
          ctx.save();
          if (isBeingDragged) ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(tx, ty, tokenRadius, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(3, 3 + (gridSquares - 1) * 1.5);
          ctx.strokeStyle = '#020617';
          ctx.fillStyle = cell.tokenColor?.includes('cyan') ? '#06b6d4' : '#e11d48';
          ctx.fill();
          ctx.stroke();

          // Imagem do Avatar (resolução aprofundada com fallback para fichas de personagem, NPCs e campanhas)
          const tokenUrl = resolveTokenAvatar(cell.tokenName, tokenCombatant);
          let imageDrawn = false;
          if (tokenUrl) {
            let img = token2DImageCache.get(tokenUrl);
            if (!img) {
              img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                setImageCacheVersion((v) => v + 1);
              };
              img.onerror = () => {
                // Keep fallback on load error
              };
              img.src = tokenUrl;
              token2DImageCache.set(tokenUrl, img);
            } else if (!img.complete && !img.onload) {
              img.onload = () => {
                setImageCacheVersion((v) => v + 1);
              };
            }

            if (img.complete && img.naturalWidth > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(tx, ty, tokenRadius - 2, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(img, tx - tokenRadius + 2, ty - tokenRadius + 2, (tokenRadius - 2) * 2, (tokenRadius - 2) * 2);
              ctx.restore();
              imageDrawn = true;
            }
          }

          // Texto caso não tenha imagem
          if (!imageDrawn) {
            ctx.fillStyle = '#ffffff';
            const fontSize = Math.floor(CELL_SIZE * (0.28 + (gridSquares - 1) * 0.1));
            ctx.font = `bold ${fontSize}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cell.tokenName, tx, ty);
          }

          // Badge de tamanho para criaturas grandes
          if (gridSquares > 1) {
            ctx.save();
            const badgeText = `${sizeInfo.sizeLabel} (${gridSquares}x${gridSquares})`;
            const badgeFontSize = Math.max(10, Math.floor(CELL_SIZE * 0.22));
            ctx.font = `bold ${badgeFontSize}px Inter, sans-serif`;
            const badgeW = ctx.measureText(badgeText).width + 8;
            const badgeH = badgeFontSize + 4;
            const badgeX = tx - badgeW / 2;
            const badgeY = ty + tokenRadius - badgeH / 2;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = cell.tokenColor?.includes('cyan') ? '#06b6d4' : '#e11d48';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, tx, badgeY + badgeH / 2);
            ctx.restore();
          }

          ctx.restore();
        }
      }
    }

    // 5. Preview de Arrasto Ativo
    if (draggingItem) {
      const targetCell = grid[draggingItem.currentR]?.[draggingItem.currentC];
      const isBlocked = draggingItem.kind === 'token' && isCellBlockingVision(targetCell);

      const targetX = (bgImage ? gridOffsetX : 0) + draggingItem.currentC * CELL_SIZE + CELL_SIZE / 2;
      const targetY = (bgImage ? gridOffsetY : 0) + draggingItem.currentR * CELL_SIZE + CELL_SIZE / 2;
      const startX = (bgImage ? gridOffsetX : 0) + draggingItem.startC * CELL_SIZE + CELL_SIZE / 2;
      const startY = (bgImage ? gridOffsetY : 0) + draggingItem.startR * CELL_SIZE + CELL_SIZE / 2;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = isBlocked ? 'rgba(239, 68, 68, 0.8)' : (draggingItem.kind === 'poi' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.8)');
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      const cellLeft = (bgImage ? gridOffsetX : 0) + draggingItem.currentC * CELL_SIZE;
      const cellTop = (bgImage ? gridOffsetY : 0) + draggingItem.currentR * CELL_SIZE;
      ctx.fillStyle = isBlocked ? 'rgba(239, 68, 68, 0.25)' : (draggingItem.kind === 'poi' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)');
      ctx.fillRect(cellLeft, cellTop, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = isBlocked ? '#ef4444' : (draggingItem.kind === 'poi' ? '#f59e0b' : '#38bdf8');
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(cellLeft, cellTop, CELL_SIZE, CELL_SIZE);
      ctx.restore();

      if (draggingItem.kind === 'token' && draggingItem.tokenName) {
        ctx.save();
        ctx.shadowColor = isBlocked ? '#ef4444' : '#38bdf8';
        ctx.shadowBlur = 14 / zoom;
        ctx.beginPath();
        ctx.arc(targetX, targetY, (CELL_SIZE / 2) * 0.95, 0, Math.PI * 2);
        ctx.fillStyle = draggingItem.tokenColor?.includes('cyan') ? '#06b6d4' : '#e11d48';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3 / zoom;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (draggingItem.kind === 'poi' && draggingItem.poiCell) {
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 12 / zoom;
        drawPOIIcon(ctx, targetX, targetY, draggingItem.poiCell.type, zoom);
        ctx.restore();
      } else if (draggingItem.kind === 'light' && draggingItem.light) {
        ctx.save();
        ctx.shadowColor = draggingItem.light.color || '#ff9900';
        ctx.shadowBlur = 16 / zoom;
        drawLightSourceIcon(ctx, targetX, targetY, selectedLightPreset, zoom);
        ctx.restore();
      }
    }

    ctx.restore();
  }, [
    getViewportBounds, 
    panOffset, 
    zoom, 
    grid, 
    CELL_SIZE, 
    ROWS, 
    COLS, 
    isPlayerView, 
    vectorWalls, 
    bgImage, 
    gridOffsetX, 
    gridOffsetY, 
    lightSources, 
    combatants, 
    draggingItem, 
    selectedLightPreset,
    imageCacheVersion
  ]);

  useEffect(() => {
    renderEntitiesLayer();
  }, [renderEntitiesLayer]);

  // =========================================================================
  // CAMADA 4: DESENHOS LIVRES (CANVAS ISOLADO)
  // =========================================================================
  const renderDrawings = useCallback((liveStroke?: DrawingStroke | null) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = getViewportBounds();
    if (width <= 0 || height <= 0) return;

    syncCanvasDimensions(canvas, width, height);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    const drawSingleStroke = (stroke: DrawingStroke) => {
      if (!stroke || !stroke.points || stroke.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke.color || '#f59e0b';
      ctx.lineWidth = Math.max(1.5, (stroke.lineWidth || 4) / zoom);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = stroke.color || '#f59e0b';

      const pts = stroke.points;
      if (stroke.tool === 'pencil') {
        ctx.beginPath();
        if (pts.length === 1) {
          ctx.arc(pts[0].x, pts[0].y, Math.max(2, (stroke.lineWidth || 4) / 2 / zoom), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.stroke();
        }
      } else if (stroke.tool === 'circle') {
        ctx.beginPath();
        const endPt = pts[1] || pts[0];
        const dx = endPt.x - pts[0].x;
        const dy = endPt.y - pts[0].y;
        ctx.arc(pts[0].x, pts[0].y, Math.hypot(dx, dy) || 10 / zoom, 0, Math.PI * 2);
        ctx.stroke();
      } else if (stroke.tool === 'rect') {
        ctx.beginPath();
        const endPt = pts[1] || pts[0];
        const rx = Math.min(pts[0].x, endPt.x);
        const ry = Math.min(pts[0].y, endPt.y);
        ctx.strokeRect(rx, ry, Math.abs(endPt.x - pts[0].x) || 2 / zoom, Math.abs(endPt.y - pts[0].y) || 2 / zoom);
      } else if (stroke.tool === 'text') {
        const fontSize = Math.max(12, 16 / zoom);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const text = stroke.text || '';
        const metrics = ctx.measureText(text);
        const pad = 4 / zoom;
        ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
        ctx.beginPath();
        ctx.roundRect(pts[0].x - pad, pts[0].y - fontSize * 1.2 + pad, metrics.width + pad * 2, fontSize * 1.2 + pad, 4 / zoom);
        ctx.fill();
        ctx.fillStyle = stroke.color || '#f59e0b';
        ctx.fillText(text, pts[0].x, pts[0].y);
      }
      ctx.restore();
    };

    if (drawings && drawings.length > 0) drawings.forEach(drawSingleStroke);
    if (liveStroke) drawSingleStroke(liveStroke);

    ctx.restore();
  }, [getViewportBounds, panOffset, zoom, drawings]);

  useEffect(() => {
    renderDrawings(activeStrokeRef.current);
  }, [renderDrawings]);

  // =========================================================================
  // CAMADA 5: INTERAÇÃO & HUD (RÉGUA ORTOGONAL, SELEÇÃO BOX, CALIBRAÇÃO)
  // Roda a 60-120 FPS sem tocar nas hachuras nem nas luzes!
  // =========================================================================
  const calculateSegmentDistance = (from: RulerPoint, to: RulerPoint) => {
    const deltaR = Math.abs(to.r - from.r);
    const deltaC = Math.abs(to.c - from.c);
    const steps = deltaR + deltaC;
    const feet = steps * 5;
    const meters = parseFloat((feet * 0.3).toFixed(1));
    return { steps, feet, meters, deltaR, deltaC };
  };

  const getOrthogonalPath = (from: RulerPoint, to: RulerPoint): RulerPoint[] => {
    if (from.r === to.r || from.c === to.c) return [to];
    const deltaR = Math.abs(to.r - from.r);
    const deltaC = Math.abs(to.c - from.c);
    const corner: RulerPoint = deltaC >= deltaR ? { r: from.r, c: to.c } : { r: to.r, c: from.c };
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

    return { totalSteps, totalFeet, totalMeters: parseFloat(totalMeters.toFixed(1)), activePoints, segments };
  };

  const renderInteractionLayer = useCallback(() => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = getViewportBounds();
    if (width <= 0 || height <= 0) return;

    syncCanvasDimensions(canvas, width, height);
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // 1. Calibração (Linha Vermelha)
    if (selectedTool === 'calibrate' && calibrationLine) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(calibrationLine.x1, calibrationLine.y1);
      ctx.lineTo(calibrationLine.x2, calibrationLine.y2);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(calibrationLine.x1, calibrationLine.y1, 6, 0, Math.PI * 2);
      ctx.arc(calibrationLine.x2, calibrationLine.y2, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Caixa de Seleção
    if (selectedTool === 'box' && selectionBox) {
      const minR = Math.min(selectionBox.startR, selectionBox.currentR);
      const maxR = Math.max(selectionBox.startR, selectionBox.currentR);
      const minC = Math.min(selectionBox.startC, selectionBox.currentC);
      const maxC = Math.max(selectionBox.startC, selectionBox.currentC);

      const bx = bgImage ? gridOffsetX + minC * CELL_SIZE : minC * CELL_SIZE;
      const by = bgImage ? gridOffsetY + minR * CELL_SIZE : minR * CELL_SIZE;
      const bw = (maxC - minC + 1) * CELL_SIZE;
      const bh = (maxR - minR + 1) * CELL_SIZE;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1.5, 2 / zoom);
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.setLineDash([]);

      const handleSize = Math.max(4, 6 / zoom);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(bx - handleSize / 2, by - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(bx + bw - handleSize / 2, by - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(bx - handleSize / 2, by + bh - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(bx + bw - handleSize / 2, by + bh - handleSize / 2, handleSize, handleSize);
    }

    // 3. Régua Tática Ortogonal
    if (selectedTool === 'measure' && rulerPoints.length > 0) {
      const isMeasuring = rulerStatus === 'measuring';
      const hasLiveCursor = isMeasuring && rulerCursor && (
        rulerCursor.r !== rulerPoints[rulerPoints.length - 1].r || 
        rulerCursor.c !== rulerPoints[rulerPoints.length - 1].c
      );

      const getPointCoords = (pt: { r: number; c: number }) => ({
        x: (bgImage ? gridOffsetX + pt.c * CELL_SIZE : pt.c * CELL_SIZE) + CELL_SIZE / 2,
        y: (bgImage ? gridOffsetY + pt.r * CELL_SIZE : pt.r * CELL_SIZE) + CELL_SIZE / 2
      });

      // Segmentos confirmados
      for (let i = 0; i < rulerPoints.length - 1; i++) {
        const p1 = getPointCoords(rulerPoints[i]);
        const p2 = getPointCoords(rulerPoints[i + 1]);
        const segDist = calculateSegmentDistance(rulerPoints[i], rulerPoints[i + 1]);

        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12 / zoom;
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = Math.max(5, 7 / zoom);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = Math.max(2.5, 3.5 / zoom);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();

        if (segDist.steps > 0) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const badgeText = `${segDist.feet}ft`;
          ctx.save();
          ctx.font = `bold ${Math.max(10, 11 / zoom)}px Inter, sans-serif`;
          const textWidth = ctx.measureText(badgeText).width;
          const padX = 5 / zoom;
          const padY = 2.5 / zoom;
          ctx.fillStyle = 'rgba(10, 15, 29, 0.92)';
          ctx.strokeStyle = '#0891b2';
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.roundRect(midX - (textWidth + padX * 2) / 2, midY - (14 / zoom + padY) / 2, textWidth + padX * 2, 14 / zoom + padY, 3 / zoom);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#67e8f9';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, midX, midY);
          ctx.restore();
        }
      }

      // Preview dinâmico para o cursor
      if (hasLiveCursor && rulerCursor) {
        const lastPt = rulerPoints[rulerPoints.length - 1];
        const previewNodes = getOrthogonalPath(lastPt, rulerCursor);
        const previewPoints = [lastPt, ...previewNodes];

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = Math.max(2, 3 / zoom);
        ctx.setLineDash([8 / zoom, 5 / zoom]);
        ctx.beginPath();
        const startCoord = getPointCoords(previewPoints[0]);
        ctx.moveTo(startCoord.x, startCoord.y);
        for (let i = 1; i < previewPoints.length; i++) {
          const ptCoord = getPointCoords(previewPoints[i]);
          ctx.lineTo(ptCoord.x, ptCoord.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Nós waypoints
      rulerPoints.forEach((pt, idx) => {
        const coord = getPointCoords(pt);
        ctx.save();
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, Math.max(5, 7 / zoom), 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? '#10b981' : idx === rulerPoints.length - 1 ? '#06b6d4' : '#0891b2';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5 / zoom;
        ctx.stroke();
        ctx.restore();
      });
    }

    ctx.restore();
  }, [
    getViewportBounds, 
    panOffset, 
    zoom, 
    selectedTool, 
    calibrationLine, 
    selectionBox, 
    bgImage, 
    gridOffsetX, 
    gridOffsetY, 
    CELL_SIZE, 
    rulerPoints, 
    rulerStatus, 
    rulerCursor
  ]);

  useEffect(() => {
    renderInteractionLayer();
  }, [renderInteractionLayer]);

  // =========================================================================
  // COORDENADAS E MANIPULAÇÃO DE MOUSE / GESTOS
  // =========================================================================
  const getCanvasCoords = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - panOffsetRef.current.x) / zoom,
      y: (e.clientY - rect.top - panOffsetRef.current.y) / zoom,
    };
  };

  const getGridPos = (x: number, y: number) => ({
    c: Math.floor((bgImageUrl ? x - gridOffsetX : x) / CELL_SIZE),
    r: Math.floor((bgImageUrl ? y - gridOffsetY : y) / CELL_SIZE),
  });

  const moveToken = (tokenName: string, tokenColor: string, targetR: number, targetC: number) => {
    onGridChange((prev) => {
      const copy = prev.map(row => row.map(cell => ({ ...cell })));
      for (let r = 0; r < copy.length; r++) {
        for (let c = 0; c < copy[0].length; c++) {
          if (copy[r][c].tokenName === tokenName) {
            copy[r][c].tokenName = undefined;
            copy[r][c].tokenColor = undefined;
          }
        }
      }
      if (targetR >= 0 && targetR < copy.length && targetC >= 0 && targetC < copy[0].length) {
        copy[targetR][targetC].tokenName = tokenName;
        copy[targetR][targetC].tokenColor = tokenColor;
        revealVisionWithLOS(copy, targetR, targetC, getTokenVisionRadius(tokenName, combatants));

        const destCell = copy[targetR][targetC];
        if (destCell.type === 'trap' || destCell.trapConfig) {
          const trapCfg = destCell.trapConfig || { trapType: 'Armadilha', detectDC: 13, disarmDC: 13 };
          const trapEffect: ReactiveTrapEffect = {
            id: `trap_${targetR}_${targetC}`,
            type: 'trap_damage',
            name: trapCfg.trapType || 'Armadilha',
            description: ('description' in trapCfg && trapCfg.description) ? trapCfg.description : 'Armadilha mecânica oculta no piso.',
            detectDC: trapCfg.detectDC || 13,
            disarmDC: trapCfg.disarmDC || 13,
            revealedToPlayers: false,
            isArmed: true,
            oneShot: true,
            soundEffect: 'trap_spike'
          };
          evaluateTokenStep({
            tokenName,
            passivePerception: 14,
            trap: trapEffect,
            forceStepEvenIfDetected: true
          });
        }
      }
      return copy;
    });
  };

  const isPOIType = (t: string | undefined) => 
    t === 'door' || t === 'trap' || t === 'chest' || t === 'stash' || t === 'trigger' || t === 'portcullis' || t === 'illusion_wall' || t === 'transition';

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editingCell) return;

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
        setIsDrawing(true);
        if (drawings && drawings.length > 0) {
          let closestId: string | null = null;
          let minDist = Infinity;
          drawings.forEach((d) => {
            d.points?.forEach((p) => {
              const dist = Math.hypot(p.x - x, p.y - y);
              if (dist < minDist) { minDist = dist; closestId = d.id; }
            });
          });
          if (closestId && minDist < 60 / zoom) onDrawingAction?.({ action: 'remove', strokeId: closestId });
        }
      } else {
        setIsDrawing(true);
        const strokeData: DrawingStroke = {
          id: `stroke_${++strokeCounterRef.current}_${Math.floor(x)}_${Math.floor(y)}`,
          tool: toolType,
          color: drawColor,
          lineWidth: drawLineWidth,
          points: [{ x, y }]
        };
        activeStrokeRef.current = strokeData;
        renderDrawings(strokeData);
      }
      return;
    }

    if (selectedTool === 'box') {
      setIsDrawing(true);
      setDrawButton(e.button);
      setSelectionBox({ startR: pos.r, startC: pos.c, currentR: pos.r, currentC: pos.c });
      return;
    }

    const clickedCell = grid[pos.r]?.[pos.c];

    // 1. Right Click on Token -> Remove token immediately
    if (e.button === 2 && clickedCell?.tokenName) {
      const removedTokenName = clickedCell.tokenName;
      onGridChange((prev) => {
        const copy = prev.map((row) => row.map((c) => ({ ...c })));
        if (copy[pos.r]?.[pos.c]) {
          copy[pos.r][pos.c].tokenName = undefined;
          copy[pos.r][pos.c].tokenColor = undefined;
        }
        return copy;
      });
      toast.info(`Token "${removedTokenName}" removido do mapa.`);
      return;
    }

    // 2. Right Click on Light -> Remove light source immediately
    if (e.button === 2 && lightSources && lightSources.length > 0) {
      const clickedLight = lightSources.find(l => {
        const lx = bgImage ? gridOffsetX + l.x * CELL_SIZE : l.x * CELL_SIZE;
        const ly = bgImage ? gridOffsetY + l.y * CELL_SIZE : l.y * CELL_SIZE;
        return Math.hypot(x - lx, y - ly) <= CELL_SIZE * 0.7;
      });
      if (clickedLight) {
        onRemoveLightSource?.(clickedLight.id);
        toast.info('Fonte de luz removida.');
        return;
      }
    }

    // 3. Left Click with Token Tool or Selected Token Combatant -> Place Token
    if (e.button === 0 && (selectedTool === 'token' || selectedTokenCombatant)) {
      if (selectedTokenCombatant) {
        const tok = selectedTokenCombatant;
        const isPlayer = tok.type === 'player';
        onGridChange((prev) => {
          const copy = prev.map((row) => row.map((c) => ({ ...c })));
          if (pos.r >= 0 && pos.r < copy.length && pos.c >= 0 && pos.c < copy[0].length) {
            copy[pos.r][pos.c].tokenName = tok.name;
            copy[pos.r][pos.c].tokenColor = isPlayer ? 'bg-cyan-500' : 'bg-rose-500';
            revealVisionWithLOS(copy, pos.r, pos.c, getTokenVisionRadius(tok.name, combatants));
          }
          return copy;
        });
        toast.success(`Token de "${tok.name}" posicionado no mapa!`);
        return;
      }
    }

    // 4. Left Click with Light Tool -> Place Light Source
    if (e.button === 0 && selectedTool === 'light') {
      const lx = (pos.c + 0.5) * CELL_SIZE;
      const ly = (pos.r + 0.5) * CELL_SIZE;
      const newLight: LightSource = {
        id: `light-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        x: lx,
        y: ly,
        brightRadius: selectedLightPreset === 'candle' ? 10 : selectedLightPreset === 'lantern' || selectedLightPreset === 'dragon' ? 30 : 20,
        dimRadius: selectedLightPreset === 'candle' ? 20 : selectedLightPreset === 'lantern' || selectedLightPreset === 'dragon' ? 60 : 40,
        color: selectedLightPreset === 'candle' ? '#ffcc66' : selectedLightPreset === 'spell' ? '#38bdf8' : selectedLightPreset === 'dragon' ? '#ef4444' : '#ffaa33',
        intensity: 0.85,
        animation: selectedLightPreset === 'candle' ? 'candle' : 'torch',
      };
      onAddLightSource?.(newLight);
      toast.success('Fonte de luz adicionada ao mapa!');
      return;
    }

    // Check Token Hit for Dragging (Left Click)
    if (e.button === 0 && clickedCell?.tokenName) {
      dragCandidateRef.current = {
        kind: 'token',
        startR: pos.r,
        startC: pos.c,
        startX: x,
        startY: y,
        initialClientX: e.clientX,
        initialClientY: e.clientY,
        tokenName: clickedCell.tokenName,
        tokenColor: clickedCell.tokenColor
      };
      return;
    }

    // Check Light Hit
    if (lightSources && lightSources.length > 0) {
      const clickedLight = lightSources.find(l => {
        const lx = bgImage ? gridOffsetX + l.x * CELL_SIZE : l.x * CELL_SIZE;
        const ly = bgImage ? gridOffsetY + l.y * CELL_SIZE : l.y * CELL_SIZE;
        return Math.hypot(x - lx, y - ly) <= CELL_SIZE * 0.7;
      });
      if (clickedLight) {
        dragCandidateRef.current = {
          kind: 'light',
          startR: pos.r,
          startC: pos.c,
          startX: x,
          startY: y,
          initialClientX: e.clientX,
          initialClientY: e.clientY,
          light: clickedLight
        };
        return;
      }
    }

    // Check POI Hit
    if (clickedCell && isPOIType(clickedCell.type)) {
      dragCandidateRef.current = {
        kind: 'poi',
        startR: pos.r,
        startC: pos.c,
        startX: x,
        startY: y,
        initialClientX: e.clientX,
        initialClientY: e.clientY,
        cell: clickedCell
      };
      return;
    }

    if (selectedTool === 'measure' && e.button === 0) {
      if (rulerStatus === 'completed' || rulerStatus === 'idle' || rulerPoints.length === 0) {
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
          if (rulerPoints.length >= 2) handleFinishRuler();
        } else {
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
      return;
    }

    setIsDrawing(true);
    setDrawButton(e.button);
    handleCellAction(pos.r, pos.c, e.button);
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
      renderDrawings(activeStrokeRef.current);
      return;
    }

    if (selectedTool === 'calibrate' && isDrawing && calibrationLine) {
      setCalibrationLine?.({ ...calibrationLine, x2: x, y2: y });
      return;
    }

    const pos = getGridPos(x, y);

    // Promover drag candidate se arrastou >= 4px
    if (dragCandidateRef.current && !isPanning) {
      const dist = Math.hypot(e.clientX - dragCandidateRef.current.initialClientX, e.clientY - dragCandidateRef.current.initialClientY);
      if (dist >= 4) {
        const cand = dragCandidateRef.current;
        if (cand.kind === 'token') {
          setDraggingItem({ kind: 'token', tokenName: cand.tokenName, tokenColor: cand.tokenColor, startR: cand.startR, startC: cand.startC, currentR: pos.r, currentC: pos.c });
        } else if (cand.kind === 'poi' && cand.cell) {
          setDraggingItem({ kind: 'poi', poiType: cand.cell.type, poiCell: cand.cell, startR: cand.startR, startC: cand.startC, currentR: pos.r, currentC: pos.c });
        } else if (cand.kind === 'light' && cand.light) {
          setDraggingItem({ kind: 'light', lightId: cand.light.id, light: cand.light, startR: cand.startR, startC: cand.startC, currentR: pos.r, currentC: pos.c });
        }
        dragCandidateRef.current = null;
      }
    }

    if (draggingItem) {
      if (pos.r !== draggingItem.currentR || pos.c !== draggingItem.currentC) {
        setDraggingItem(prev => prev ? { ...prev, currentR: pos.r, currentC: pos.c } : null);
      }
      return;
    }

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

    // Hover tooltip para POIs e Tokens
    if (!isPlayerView && !isPanning && !draggingItem) {
      const cell = grid[pos.r]?.[pos.c];
      if (cell && (isPOIType(cell.type) || Boolean(cell.tokenName))) {
        setHoveredCell({ x: e.clientX, y: e.clientY, cell });
      } else {
        setHoveredCell(null);
      }
    } else {
      setHoveredCell(null);
    }

    if (!isDrawing || selectedTool !== 'paint') return;

    if (lastPaintedCellRef.current?.r === pos.r && lastPaintedCellRef.current?.c === pos.c) return;
    lastPaintedCellRef.current = { r: pos.r, c: pos.c, tool: selectedTool };
    handleCellAction(pos.r, pos.c, drawButton);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    lastPaintedCellRef.current = null;
    if (isPanning) { setIsPanning(false); return; }

    // Click sem arrastar abre configuração do POI
    if (dragCandidateRef.current) {
      const cand = dragCandidateRef.current;
      dragCandidateRef.current = null;
      if (cand.kind === 'poi' && cand.cell && !isPlayerView) {
        setEditingCell({ r: cand.startR, c: cand.startC, cell: cand.cell });
        return;
      }
    }

    // Soltar arrasto
    if (draggingItem) {
      if (draggingItem.kind === 'token' && draggingItem.tokenName) {
        moveToken(draggingItem.tokenName, draggingItem.tokenColor || '', draggingItem.currentR, draggingItem.currentC);
      } else if (draggingItem.kind === 'poi' && draggingItem.poiCell) {
        onGridChange((prev) => {
          const copy = prev.map(row => row.map(cell => ({ ...cell })));
          const src = copy[draggingItem.startR]?.[draggingItem.startC];
          const dest = copy[draggingItem.currentR]?.[draggingItem.currentC];
          if (src && dest) {
            dest.type = src.type;
            dest.doorConfig = src.doorConfig ? { ...src.doorConfig } : undefined;
            dest.trapConfig = src.trapConfig ? { ...src.trapConfig } : undefined;
            dest.chestConfig = src.chestConfig ? { ...src.chestConfig } : undefined;
            dest.triggerConfig = src.triggerConfig ? { ...src.triggerConfig } : undefined;
            dest.portcullisConfig = src.portcullisConfig ? { ...src.portcullisConfig } : undefined;
            dest.illusionWallConfig = src.illusionWallConfig ? { ...src.illusionWallConfig } : undefined;
            dest.transitionConfig = src.transitionConfig ? { ...src.transitionConfig } : undefined;
            src.type = 'floor';
          }
          return copy;
        });
      } else if (draggingItem.kind === 'light' && draggingItem.light) {
        const updatedLight: LightSource = {
          ...draggingItem.light,
          x: (draggingItem.currentC + 0.5) * CELL_SIZE,
          y: (draggingItem.currentR + 0.5) * CELL_SIZE
        };
        onUpdateLightSource?.(updatedLight);
      }
      setDraggingItem(null);
      return;
    }

    if (activeStrokeRef.current && selectedTool.startsWith('draw-')) {
      onDrawingAction?.({ action: 'add', stroke: { ...activeStrokeRef.current } });
      activeStrokeRef.current = null;
      renderDrawings();
    }

    if (selectedTool === 'box' && selectionBox) {
      handleBoxAction(selectionBox, drawButton);
      setSelectionBox(null);
    }

    setIsDrawing(false);
    setDrawButton(-1);
  };

  const handleCellAction = (targetR: number, targetC: number, button: number) => {
    onGridChange((prev) => {
      const copy = prev.map(row => row.map(cell => ({ ...cell })));
      if (targetR >= 0 && targetR < copy.length && targetC >= 0 && targetC < copy[0].length) {
        const cell = copy[targetR][targetC];
        const paintValue = (button === 2) ? 'wall' as const : selectedTileType as TileType;

        if (selectedTool === 'fog-reveal') cell.fog = false;
        else if (selectedTool === 'fog-cover') cell.fog = true;
        else if (selectedTool === 'token') {
          if (button === 2) {
            cell.tokenName = undefined;
            cell.tokenColor = undefined;
          } else if (selectedTokenCombatant) {
            const isPlayer = selectedTokenCombatant.type === 'player';
            cell.tokenName = selectedTokenCombatant.name;
            cell.tokenColor = isPlayer ? 'bg-cyan-500' : 'bg-rose-500';
            revealVisionWithLOS(copy, targetR, targetC, getTokenVisionRadius(selectedTokenCombatant.name, combatants));
          }
        }
        else if (selectedTool === 'paint') {
          cell.type = paintValue;
          if (paintValue === 'door' && !cell.doorConfig) {
            cell.doorConfig = { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15, secretRevealed: false };
          }
          if (paintValue === 'trap' && !cell.trapConfig) {
            cell.trapConfig = { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false };
          }
          if (paintValue === 'chest' && !cell.chestConfig) {
            cell.chestConfig = { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true, loot: { gp: 25, items: [] } };
          }
          if (paintValue === 'stash' && !cell.chestConfig) {
            cell.chestConfig = { name: 'Esconderijo', containerType: 'hidden_stash', status: 'unlocked', lockpickDC: 12, breakDC: 14, detectDC: 15, revealedToPlayers: false, loot: { gp: 50, items: [] } };
          }
          if (paintValue === 'trigger' && !cell.triggerConfig) {
            cell.triggerConfig = { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', triggerType: 'lever', state: 'inactive', name: 'Alavanca', isSecret: false, revealedToPlayers: true };
          }
          if (paintValue === 'portcullis' && !cell.portcullisConfig) {
            cell.portcullisConfig = { id: `grade-${Math.random().toString(36).substring(2, 8)}`, status: 'closed', material: 'iron', name: 'Grade de Ferro' };
          }
          if (paintValue === 'illusion_wall' && !cell.illusionWallConfig) {
            cell.illusionWallConfig = { detectDC: 15, revealedToPlayers: false, blocksLight: true };
          }
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
    const paintValue = (button === 2) ? 'wall' as const : selectedTileType as TileType;

    onGridChange((prev) => {
      const copy = prev.map(row => row.map(cell => ({ ...cell })));
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (r >= 0 && r < copy.length && c >= 0 && c < copy[0].length) {
            const isBorder = (r === minR || r === maxR || c === minC || c === maxC);
            const cell = copy[r][c];

            if (boxMode === 'room') {
              cell.type = isBorder ? 'wall' : 'floor';
              if (!isBorder) cell.fog = false;
            } else if (boxMode === 'hollow') {
              if (isBorder) cell.type = paintValue;
            } else if (boxMode === 'fog-reveal') {
              cell.fog = false;
            } else if (boxMode === 'fog-cover') {
              cell.fog = true;
            } else {
              cell.type = paintValue;
              if (paintValue === 'floor' || paintValue === 'grass' || paintValue === 'water') cell.fog = false;
            }
          }
        }
      }
      return copy;
    });
  };

  // Zoom nativo suave centrado no cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const nextZoom = Math.max(0.05, Math.min(zoomRef.current * zoomFactor, 5.0));

      const localMouseX = (mouseX - panOffsetRef.current.x) / zoomRef.current;
      const localMouseY = (mouseY - panOffsetRef.current.y) / zoomRef.current;

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
    return () => container.removeEventListener('wheel', handleNativeWheel);
  }, []);

  const handleZoomStep = (delta: number) => {
    const container = containerRef.current;
    if (!container) return;
    const nextZoom = Math.max(0.05, Math.min(5.0, zoomRef.current + delta));
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    const localCenterX = (centerX - panOffsetRef.current.x) / zoomRef.current;
    const localCenterY = (centerY - panOffsetRef.current.y) / zoomRef.current;
    const nextPan = {
      x: centerX - localCenterX * nextZoom,
      y: centerY - localCenterY * nextZoom,
    };
    zoomRef.current = nextZoom;
    panOffsetRef.current = nextPan;
    setZoom(nextZoom);
    setPanOffset(nextPan);
  };

  const fitAndCenterView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const totalW = COLS * CELL_SIZE;
    const totalH = ROWS * CELL_SIZE;
    const fitZoom = Math.max(0.05, Math.min((container.clientWidth - 100) / totalW, (container.clientHeight - 100) / totalH, 1.5));
    const nextPan = {
      x: (container.clientWidth - totalW * fitZoom) / 2,
      y: (container.clientHeight - totalH * fitZoom) / 2,
    };
    zoomRef.current = fitZoom;
    panOffsetRef.current = nextPan;
    setZoom(fitZoom);
    setPanOffset(nextPan);
  }, [COLS, ROWS, CELL_SIZE]);

  // Handlers da Régua
  const handleExitRuler = () => {
    setRulerStatus('idle');
    setRulerPoints([]);
    setRulerCursor(null);
    setMeasureStart?.(null);
    setMeasuredDistance?.(null);
    setSelectedTool?.('fog-reveal');
  };

  const handleFinishRuler = () => {
    if (rulerPoints.length >= 1) setRulerStatus('completed');
  };

  const handleUndoRulerPoint = () => {
    if (rulerPoints.length > 1) {
      const next = rulerPoints.slice(0, -1);
      setRulerPoints(next);
      const summary = getRulerSummary(next, null, false);
      setMeasuredDistance?.({ feet: summary.totalFeet, meters: summary.totalMeters });
    }
  };

  const handleResetRuler = () => {
    setRulerStatus('idle');
    setRulerPoints([]);
    setRulerCursor(null);
    setMeasureStart?.(null);
    setMeasuredDistance?.(null);
  };

  const hasDarkvision = useMemo(() => {
    if (selectedTokenCombatant) return selectedTokenCombatant.visionType === 'darkvision';
    if (isPlayerView) return combatants.some(c => c.type === 'player' && c.visionType === 'darkvision');
    return false;
  }, [selectedTokenCombatant, isPlayerView, combatants]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative cursor-default bg-slate-950 select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setHoveredCell(null)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ userSelect: 'none', touchAction: 'none' }}
    >
      {/* 1. Camada Estática Bakada (Hachuras Dyson + Paredes + Fundo) */}
      <canvas
        ref={staticCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ filter: hasDarkvision ? 'grayscale(100%) brightness(0.8)' : 'none', transition: 'filter 0.5s ease' }}
      />

      {/* 2. Camada de Iluminação, Sombras e Névoa de Guerra */}
      <canvas
        ref={lightingCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* 3. Camada de Entidades (Tokens, POIs, Luzes, Paredes Vetoriais) */}
      <canvas
        ref={entitiesCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* 4. Camada de Desenhos Livres */}
      <canvas
        ref={drawingCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* 5. Camada Superior de Interação (Régua Tática, Seleção, Calibração) */}
      <canvas
        ref={interactionCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      {/* HUD Flutuante de Zoom e Ajuste */}
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 bg-[#0d121a]/95 backdrop-blur-md text-xs font-mono text-slate-300 px-3 py-1.5 rounded-xl border border-[#222c3d] shadow-2xl flex items-center gap-2.5 z-20"
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleZoomStep(-0.15)}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#141a26] hover:bg-[#1c2638] text-slate-300 hover:text-white border border-[#222c3d] font-bold text-sm cursor-pointer transition-colors"
            title="Diminuir Zoom (-)"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => {
              zoomRef.current = 1.0;
              setZoom(1.0);
            }}
            className="min-w-[48px] text-center font-bold text-amber-400 hover:text-amber-300 cursor-pointer text-xs"
            title="Resetar Zoom para 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={() => handleZoomStep(0.15)}
            className="w-6 h-6 flex items-center justify-center rounded-lg bg-[#141a26] hover:bg-[#1c2638] text-slate-300 hover:text-white border border-[#222c3d] font-bold text-sm cursor-pointer transition-colors"
            title="Aumentar Zoom (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={fitAndCenterView}
            className="px-2.5 py-1 flex items-center gap-1.5 rounded-lg bg-[#141a26] hover:bg-cyan-500/20 text-xs text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 font-sans font-bold cursor-pointer ml-1 transition-all"
            title="Enquadrar e centralizar o mapa"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Centralizar</span>
          </button>
        </div>
        <div className="h-3 w-px bg-slate-700 hidden sm:block" />
        <span className="text-[10px] text-slate-400 hidden sm:inline">Grid: {CELL_SIZE}px</span>
      </div>

      {/* Modal Modular de Configuração de Célula */}
      <CellConfigModal
        editingCell={editingCell}
        setEditingCell={setEditingCell}
        onClose={() => setEditingCell(null)}
        onGridChange={onGridChange}
        onOpenLoot={(target) => {
          setEditingCell(null);
          setActiveLootContainer(target);
        }}
        onOpenCompendium={() => setIsChestCompendiumOpen(true)}
        onOpenCampaignDocs={() => setIsChestCampaignDocsOpen(true)}
      />

      {/* Modal Dedicado de Transição de Nível */}
      {editingCell && editingCell.cell.type === 'transition' && (
        <DungeonTransitionModal
          isOpen={true}
          onClose={() => setEditingCell(null)}
          r={editingCell.r}
          c={editingCell.c}
          currentLevelId={currentLevelId}
          activeLevels={activeLevels || []}
          transitionConfig={editingCell.cell.transitionConfig}
          combatants={combatants}
          isCockpitMode={Boolean(onTransitionAction)}
          onTeleportParty={(targetLvlId, spR, spC) => {
            onTransitionAction?.('teleport_party', targetLvlId, spR, spC);
          }}
          onTeleportSingleToken={(tokenName, targetLvlId, spR, spC) => {
            onTransitionAction?.('teleport_token', targetLvlId, spR, spC, tokenName);
          }}
          onSave={(newConfig, autoCreateLinked, linkedTargetInfo) => {
            if (onSaveTransitionWithTargetLevel) {
              onSaveTransitionWithTargetLevel(newConfig, editingCell.r, editingCell.c, autoCreateLinked, linkedTargetInfo);
            } else {
              onGridChange((prev) => {
                const copy = prev.map(row => row.map(cell => ({ ...cell })));
                copy[editingCell.r][editingCell.c].type = 'transition';
                copy[editingCell.r][editingCell.c].transitionConfig = newConfig;
                return copy;
              });
            }
            setEditingCell(null);
            toast.success('Passagem salva e conectada com sucesso!');
          }}
        />
      )}

      {/* Tooltip Flutuante no Hover */}
      <CellHoverTooltip
        hoveredCell={hoveredCell}
        combatants={combatants}
        activeLevels={activeLevels}
      />

      {/* HUD da Régua Tática */}
      <RulerHUD
        selectedTool={selectedTool}
        rulerStatus={rulerStatus}
        rulerPoints={rulerPoints}
        rulerCursor={rulerCursor}
        getRulerSummary={getRulerSummary}
        onExitRuler={handleExitRuler}
        onFinishRuler={handleFinishRuler}
        onUndoRulerPoint={handleUndoRulerPoint}
        onResetRuler={handleResetRuler}
      />

      {/* Modal de Saque Interativo */}
      {activeLootContainer && activeLootContainer.cell.chestConfig?.loot && (
        <ContainerLootModal
          isOpen={Boolean(activeLootContainer)}
          onClose={() => setActiveLootContainer(null)}
          containerName={activeLootContainer.cell.chestConfig.name || 'Baú de Tesouro'}
          containerType={activeLootContainer.cell.chestConfig.containerType || activeLootContainer.cell.type}
          loot={activeLootContainer.cell.chestConfig.loot}
          combatants={combatants}
          onUpdateLoot={(updatedLoot, isFullyLooted) => {
            onGridChange((currGrid) => {
              const updated = currGrid.map(row => row.map(c => ({ ...c })));
              const target = updated[activeLootContainer.r]?.[activeLootContainer.c];
              if (target && target.chestConfig) {
                target.chestConfig.loot = updatedLoot;
                if (isFullyLooted) target.chestConfig.status = 'looted';
              }
              return updated;
            });
          }}
        />
      )}

      {/* Modal de Compêndio de Itens */}
      {isChestCompendiumOpen && (
        <ItemCompendiumModal
          isOpen={isChestCompendiumOpen}
          onClose={() => setIsChestCompendiumOpen(false)}
          onAddItem={(newItem) => {
            if (!editingCell) return;
            const currentItems = [...(editingCell.cell.chestConfig?.loot?.items || [])];
            currentItems.push(newItem);
            setEditingCell((prev) => prev ? {
              ...prev,
              cell: {
                ...prev.cell,
                chestConfig: {
                  ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                  loot: { ...(prev.cell.chestConfig?.loot || {}), items: currentItems }
                }
              }
            } : null);
            toast.success(`"${newItem.name}" adicionado ao baú!`);
          }}
        />
      )}

      {/* Modal de Seleção de Documentos de Campanha */}
      {isChestCampaignDocsOpen && (
        <CampaignDocumentSelectModal
          isOpen={isChestCampaignDocsOpen}
          onClose={() => setIsChestCampaignDocsOpen(false)}
          onSelectDocument={(doc) => {
            if (!editingCell) return;
            const equipItem = documentToEquipmentItem(doc);
            const currentItems = [...(editingCell.cell.chestConfig?.loot?.items || [])];
            currentItems.push(equipItem);
            setEditingCell((prev) => prev ? {
              ...prev,
              cell: {
                ...prev.cell,
                chestConfig: {
                  ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                  loot: { ...(prev.cell.chestConfig?.loot || {}), items: currentItems }
                }
              }
            } : null);
            toast.success(`Documento "${doc.name}" colocado no baú!`);
          }}
        />
      )}
    </div>
  );
};
