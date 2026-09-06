'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Combatant, ConditionType } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useBattleGridState } from '@/lib/hooks/useBattleGridState';

import { applySceneEnvironment, calculateEnvironmentSettings } from './battle-3d/BattleEnvironment';
import { setupCameraAndOrbit, DEFAULT_CAMERA_PRESETS, focusCameraOnTarget } from './battle-3d/BattleCameraControls';
import { createTokenMesh, updateTokenMeshState, TokenMeshOptions } from './battle-3d/Token3DMesh';
import { getModelUrlByNameOrPath, resolvePlayerModelUrl } from '@/lib/3d-models';
import { createBattleSkyDome, SkyDomeInstance } from './battle-3d/BattleSkyDome';
import { createCloudSystem, CloudSystemInstance } from './battle-3d/BattleClouds';
import { createRainParticleSystem } from './battle-3d/WeatherEffects';
import { createVolumetricGroundFogSystem, VolumetricFogInstance } from './battle-3d/BattleVolumetricFog';
import { createFireParticleSystem, FireParticleSystemInstance } from './battle-3d/FireParticleSystem';
import { BattleControlsToolbar } from './battle-3d/BattleControlsToolbar';
import { InstancedTokenManager } from './battle-3d/InstancedTokenManager';
import { disposeHierarchy } from '@/lib/3d-asset-manager';
import { HelpCircle, X, RotateCw, Settings, Trash2 } from 'lucide-react';
import { patchWebGLContext } from '@/lib/webgl-utils';
import { toast } from 'sonner';
import { RangedAttackSplineSystem, RangedDistanceBadge } from './battle-3d/RangedAttackSplineMesh';
import { AuraSystem3D } from './battle-3d/AuraMesh3D';
import { calculateGridDistanceFeet, evaluateRangeStatus, parseRangeString, RangeStatus } from '@/lib/utils/dndRangeUtils';
import {
  GridConfig3D,
  DEFAULT_GRID_CONFIG_3D,
  BuildingBlock3D,
  BuildingBlockType,
  SpellTemplate3D,
  worldPosToGridCell,
  createDefaultBuildingBlock,
  BUILDING_BLOCK_CATALOG,
} from '@/lib/3d-building-blocks';
import {
  TerrainSurfaceType,
  TerrainCellData,
  TERRAIN_SURFACE_CATALOG,
  evaluateSurfaceReaction,
  calculateTrailTerrainCost,
} from '@/lib/3d-terrains';
import {
  createTerrainMeshManager,
  TerrainMeshManagerInstance,
} from './battle-3d/TerrainSurfaceMesh';
import { createBuildingBlockMesh, createSpellTemplateMesh, createSelectionGizmoMesh } from './battle-3d/BuildingBlockMeshes';
import { createInteractiveTransformGizmo } from './battle-3d/BuildingBlockGizmo';
import { BattleForgeToolbar } from './battle-3d/BattleForgeToolbar';
import { AssetInspectorTransform } from './battle-3d/AssetInspectorTransform';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { useAudio } from '@/context/AudioContext';
import { 
  isAnyVideoMapUrl, 
  isYouTubeUrl, 
  isVideoFileUrl, 
  extractYouTubeVideoId, 
  getYouTubeEmbedUrl 
} from '@/lib/living-battlemaps-catalog';
import { VideoGridAlignmentConfig } from '@/lib/types';

const getCombatantDisplayName = (combatant: Combatant, allCombatants: Combatant[]): string => {
  if (combatant.type !== 'monster') return combatant.name;
  
  const sameNameMonsters = allCombatants.filter(
    (c) => c.type === 'monster' && c.name === combatant.name
  );
  
  if (sameNameMonsters.length <= 1) return combatant.name;
  
  const sorted = [...sameNameMonsters].sort((a, b) => a.id.localeCompare(b.id));
  const idx = sorted.findIndex((c) => c.id === combatant.id);
  return `${combatant.name} ${idx + 1}`;
};

/**
 * Gera caminho passo-a-passo direto entre a célula inicial e a célula de destino no grid tático 3D.
 * Cada passo avança 1 casa (2 unidades 3D / 5 pés) em X e/ou Z.
 */
export function generateDirectGridPath(
  start: { x: number; z: number },
  target: { x: number; z: number }
): { x: number; z: number }[] {
  const path: { x: number; z: number }[] = [{ x: start.x, z: start.z }];
  let curX = start.x;
  let curZ = start.z;

  let iter = 0;
  while ((Math.abs(curX - target.x) > 0.1 || Math.abs(curZ - target.z) > 0.1) && iter < 200) {
    iter++;
    const dx = target.x - curX;
    const dz = target.z - curZ;

    const stepX = Math.abs(dx) >= 1.0 ? (dx > 0 ? 2 : -2) : 0;
    const stepZ = Math.abs(dz) >= 1.0 ? (dz > 0 ? 2 : -2) : 0;

    curX += stepX;
    curZ += stepZ;
    path.push({ x: curX, z: curZ });
  }
  return path;
}

export function createCustomGridLines(
  widthCells = 20,
  heightCells = 20,
  shape: 'square' | 'circle' = 'square',
  primaryColor: string | number = '#0284c7',
  secondaryColor: string | number = '#334155',
  opacity = 0.4
): THREE.LineSegments {
  const widthUnits = widthCells * 2.0;
  const heightUnits = heightCells * 2.0;
  const halfW = widthUnits / 2;
  const halfH = heightUnits / 2;

  const positions: number[] = [];
  const colors: number[] = [];

  const cPrimary = new THREE.Color(primaryColor);
  const cSecondary = new THREE.Color(secondaryColor);

  if (shape === 'circle') {
    const radius = Math.max(halfW, halfH);
    const maxRings = Math.max(1, Math.floor(radius / 2.0));

    // Anéis táticos concêntricos a cada 2 unidades (5 ft)
    const segments = 64;
    for (let rIdx = 1; rIdx <= maxRings; rIdx++) {
      const r = rIdx * 2.0;
      const isOuter = rIdx === maxRings;
      const col = isOuter ? cPrimary : cSecondary;

      for (let i = 0; i < segments; i++) {
        const theta1 = (i / segments) * Math.PI * 2;
        const theta2 = ((i + 1) / segments) * Math.PI * 2;

        positions.push(Math.cos(theta1) * r, 0, Math.sin(theta1) * r);
        positions.push(Math.cos(theta2) * r, 0, Math.sin(theta2) * r);

        colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
      }
    }

    // Raios a cada 45 graus (8 direções da bússola)
    const spokes = 8;
    for (let s = 0; s < spokes; s++) {
      const angle = (s / spokes) * Math.PI * 2;
      positions.push(0, 0, 0);
      positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      colors.push(cPrimary.r, cPrimary.g, cPrimary.b, cPrimary.r, cPrimary.g, cPrimary.b);
    }
  } else {
    // 1. Linhas verticais (ao longo de Z) para cada célula de X (-halfW até +halfW)
    for (let i = 0; i <= widthCells; i++) {
      const x = -halfW + i * 2.0;
      const isEdge = i === 0 || i === widthCells || (widthCells % 2 === 0 && i === widthCells / 2);
      const col = isEdge ? cPrimary : cSecondary;

      positions.push(x, 0, -halfH);
      positions.push(x, 0, halfH);
      colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
    }

    // 2. Linhas horizontais (ao longo de X) para cada célula de Z (-halfH até +halfH)
    for (let j = 0; j <= heightCells; j++) {
      const z = -halfH + j * 2.0;
      const isEdge = j === 0 || j === heightCells || (heightCells % 2 === 0 && j === heightCells / 2);
      const col = isEdge ? cPrimary : cSecondary;

      positions.push(-halfW, 0, z);
      positions.push(halfW, 0, z);
      colors.push(col.r, col.g, col.b, col.r, col.g, col.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: Math.max(0.05, Math.min(1.0, opacity)),
    depthWrite: false,
  });

  const lineSegments = new THREE.LineSegments(geometry, material);
  lineSegments.position.y = 0.01;
  return lineSegments;
}

export interface BattleGrid3DProps {
  combatants: Combatant[];
  currentTurnIndex?: number;
  selectedTargetId?: string;
  onSelectTarget?: (c: Combatant | undefined) => void;
  onSelectCombatant?: (c: Combatant) => void;
  onUpdateCombatants?: (updated: Combatant[]) => void;
  interactive?: boolean;
  isPlacementPhase?: boolean;
  setupMode?: 'normal' | 'player_ambush' | 'player_surprised';
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
  timeOfDayHour?: number;
  isIndoor?: boolean;
  hasFog?: boolean;
  hasRain?: boolean;
  cloudDensity?: number;
  moonSize?: number;
  moonLuminosity?: number;
  moonOffsetAngle?: number;
  moonAltitude?: number;
  sunSize?: number;
  sunLightIntensity?: number;
  ambientLightIntensity?: number;
  skyTurbidity?: number;
  skyRayleigh?: number;
  mieCoefficient?: number;
  mieDirectionalG?: number;
  rainIntensity?: number;
  rainSpeed?: number;
  rainDropSize?: number;
  windAngle?: number;
  windStrength?: number;
  groundFogDensity?: number;
  groundFogHeight?: number;
  groundFogSpeed?: number;
  globalFogDensity?: number;
  fogNoiseScale?: number;
  fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
  fogCustomColor?: string;
  onTimeOfDayChange?: (time: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors') => void;
  onEnvironmentChange?: (env: {
    timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
    isIndoor?: boolean;
    timeOfDayHour: number;
    hasFog: boolean;
    hasRain: boolean;
    cloudDensity?: number;
    moonSize?: number;
    moonLuminosity?: number;
    moonOffsetAngle?: number;
    moonAltitude?: number;
    sunSize?: number;
    sunLightIntensity?: number;
    ambientLightIntensity?: number;
    skyTurbidity?: number;
    skyRayleigh?: number;
    mieCoefficient?: number;
    mieDirectionalG?: number;
    rainIntensity?: number;
    rainSpeed?: number;
    rainDropSize?: number;
    windAngle?: number;
    windStrength?: number;
    rainOpacity?: number;
    rainTheme?: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom';
    rainCustomColor?: string;
    hasSplashes?: boolean;
    splashSize?: number;
    splashIntensity?: number;
    hasCrownDrops?: boolean;
    hasLightning?: boolean;
    lightningFrequency?: number;
    groundFogDensity?: number;
    groundFogHeight?: number;
    groundFogSpeed?: number;
    globalFogDensity?: number;
    fogNoiseScale?: number;
    fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
    fogCustomColor?: string;
  }) => void;
  onConfirmPlacement?: () => void;
  userRole?: 'dm' | 'player';
  floorTextureUrl?: string;
  onFloorTextureChange?: (url: string) => void;
  videoGridConfig?: VideoGridAlignmentConfig;
  onVideoGridConfigChange?: (config: VideoGridAlignmentConfig) => void;
  onAttackTarget?: (target: Combatant) => void;
  isBattleStarted?: boolean;
  initialBuildingBlocks?: import('../lib/3d-building-blocks').BuildingBlock3D[];
  onBuildingBlocksChange?: (blocks: import('../lib/3d-building-blocks').BuildingBlock3D[]) => void;
  initialTerrainSurfaces?: import('../lib/3d-terrains').TerrainCellData[];
  onTerrainSurfacesChange?: (surfaces: import('../lib/3d-terrains').TerrainCellData[]) => void;
  initialGridConfig?: import('../lib/3d-building-blocks').GridConfig3D;
  onGridConfigChange?: (config: import('../lib/3d-building-blocks').GridConfig3D) => void;
  initialTokenElevations?: Record<string, number>;
  onTokenElevationsChange?: (elevations: Record<string, number>) => void;
  isPaused?: boolean;
  ecoMode?: boolean;
}

const getDirectionLabel = (angleDeg: number): string => {
  const norm = ((angleDeg % 360) + 360) % 360;
  if (norm >= 337.5 || norm < 22.5) return 'Norte ▲';
  if (norm >= 22.5 && norm < 67.5) return 'Nordeste ↗';
  if (norm >= 67.5 && norm < 112.5) return 'Leste ▶';
  if (norm >= 112.5 && norm < 157.5) return 'Sudeste ↘';
  if (norm >= 157.5 && norm < 202.5) return 'Sul ▼';
  if (norm >= 202.5 && norm < 247.5) return 'Sudoeste ↙';
  if (norm >= 247.5 && norm < 292.5) return 'Oeste ◀';
  return 'Noroeste ↖';
};

const getSpeedInMeters = (speedStr?: string): number => {
  if (!speedStr) return 9; // 30 ft = 9m
  const cleaned = speedStr.toLowerCase().replace(/[^0-9\.]/g, '');
  const val = parseFloat(cleaned);
  if (isNaN(val)) return 9;
  if (speedStr.toLowerCase().includes('ft') || speedStr.toLowerCase().includes('pe')) {
    return val * 0.3; // converter pés para metros
  }
  return val;
};

export const BattleGrid3D: React.FC<BattleGrid3DProps> = ({
  combatants,
  currentTurnIndex = 0,
  selectedTargetId: propSelectedTargetId,
  onSelectTarget,
  onSelectCombatant,
  onUpdateCombatants,
  interactive = true,
  isPlacementPhase = false,
  isBattleStarted = false,
  isPaused = false,
  ecoMode = false,
  setupMode = 'normal',
  timeOfDayPreset: propTimeOfDayPreset = 'day',
  timeOfDayHour: propTimeOfDayHour = 12,
  isIndoor: propIsIndoor = false,
  hasFog: propHasFog = false,
  hasRain: propHasRain = false,
  cloudDensity: propCloudDensity = 30,
  moonSize: propMoonSize = 1.5,
  moonLuminosity: propMoonLuminosity = 1.0,
  moonOffsetAngle: propMoonOffsetAngle = 180,
  moonAltitude: propMoonAltitude = -1,
  sunSize: propSunSize = 1.0,
  sunLightIntensity: propSunLightIntensity,
  ambientLightIntensity: propAmbientLightIntensity,
  skyTurbidity: propSkyTurbidity,
  skyRayleigh: propSkyRayleigh,
  mieCoefficient: propMieCoefficient,
  mieDirectionalG: propMieDirectionalG,
  rainIntensity: propRainIntensity = 2000,
  rainSpeed: propRainSpeed = 1.0,
  rainDropSize: propRainDropSize = 1.0,
  windAngle: propWindAngle = 180,
  windStrength: propWindStrength = 0.2,
  groundFogDensity: propGroundFogDensity = 150,
  groundFogHeight: propGroundFogHeight = 1.0,
  groundFogSpeed: propGroundFogSpeed = 1.0,
  globalFogDensity: propGlobalFogDensity = 0.003,
  fogNoiseScale: propFogNoiseScale = 1.0,
  fogColorPreset: propFogColorPreset = 'natural',
  fogCustomColor: propFogCustomColor = '#cbd5e1',
  onTimeOfDayChange,
  onEnvironmentChange: propOnEnvironmentChange,
  onConfirmPlacement,
  userRole,
  floorTextureUrl,
  onFloorTextureChange,
  videoGridConfig,
  onVideoGridConfigChange,
  onAttackTarget: propOnAttackTarget,
  initialBuildingBlocks,
  onBuildingBlocksChange,
  initialGridConfig,
  onGridConfigChange,
  initialTokenElevations,
  onTokenElevationsChange,
  initialTerrainSurfaces,
  onTerrainSurfacesChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { roleMode, user } = useAuth();
  const { activeCampaign, campaignMembers } = useCampaign();
  const {
    tokenPositions3D,
    updateTokenPosition3D,
    tokenRotations3D,
    updateTokenRotation3D,
    activeSpellTargeting,
    setActiveSpellTargeting,
    casterTokenKey,
    setCasterTokenKey,
    spellTargetPosition,
    setSpellTargetPosition,
    aoeRotation,
    setDetectedAoETargets,
    pings,
    broadcastPingLocation,
    removePing,
  } = useLiveCockpit();

  const pendingAttack = useLiveCockpitStudioStore((state) => state.pendingAttack);
  const setPendingAttack = useLiveCockpitStudioStore((state) => state.setPendingAttack);

  const splineSystemRef = useRef<RangedAttackSplineSystem | null>(null);
  const [badgeScreenPos, setBadgeScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [splineBadgeInfo, setSplineBadgeInfo] = useState<{
    distanceFt: number;
    status: RangeStatus;
    normalRangeM: number;
    maxRangeM: number;
    isWeaponWithLongRange: boolean;
    isRanged?: boolean;
  } | null>(null);

  const activeSpellTargetingRef = useRef(activeSpellTargeting);
  const casterTokenKeyRef = useRef(casterTokenKey);
  const spellTargetPositionRef = useRef(spellTargetPosition);

  // Performance & Eco Mode Refs
  const isPausedRef = useRef(Boolean(isPaused));
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lastInteractionTimeRef = useRef<number>(performance.now());
  const requestSingleRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    isPausedRef.current = Boolean(isPaused);
    if (isPaused) {
      requestSingleRenderRef.current?.();
    }
  }, [isPaused]);

  useEffect(() => { activeSpellTargetingRef.current = activeSpellTargeting; }, [activeSpellTargeting]);
  useEffect(() => { casterTokenKeyRef.current = casterTokenKey; }, [casterTokenKey]);
  useEffect(() => { spellTargetPositionRef.current = spellTargetPosition; }, [spellTargetPosition]);

  const isDm = roleMode === 'dm' || userRole === 'dm';
  const userMember = campaignMembers.find((m) => m.userId === user?.id);
  const userCharacterName = userMember?.characterName;

  const {
    selectedCombatantId,
    setSelectedCombatantId,
    localPositions,
    setLocalPositions,
    localRotations,
    setLocalRotations,
    canUserControlCombatant,
    handleRotateSelected,
  } = useBattleGridState(
    combatants,
    tokenPositions3D,
    tokenRotations3D,
    updateTokenPosition3D,
    updateTokenRotation3D,
    isDm,
    isPlacementPhase,
    setupMode,
    userCharacterName
  );

  const [targetIdState, setTargetIdState] = useState<string | undefined>(propSelectedTargetId);
  const localPositionsRef = useRef(localPositions);
  useEffect(() => { localPositionsRef.current = localPositions; }, [localPositions]);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | undefined>(undefined);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [hoveredCombatantId, setHoveredCombatantId] = useState<string | undefined>(undefined);
  const [isPlayerVisionMode, setIsPlayerVisionMode] = useState<boolean>(!isDm);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const dragGhostRef = useRef<THREE.Group | null>(null);

  // 3D BattleForge (Building Blocks & Grid Config & Terrains) State
  const [gridConfig, setGridConfigState] = useState<GridConfig3D>(initialGridConfig || DEFAULT_GRID_CONFIG_3D);
  const [buildingBlocks, setBuildingBlocksState] = useState<BuildingBlock3D[]>(initialBuildingBlocks || []);
  const [terrainSurfaces, setTerrainSurfacesState] = useState<TerrainCellData[]>(initialTerrainSurfaces || []);
  const [activeTerrainType, setActiveTerrainType] = useState<TerrainSurfaceType>('shallow_water');
  const [terrainBrushSize, setTerrainBrushSize] = useState<1 | 2 | 3>(1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState<boolean>(false);
  const [activeBlockType, setActiveBlockType] = useState<BuildingBlockType | null>(null);
  const [buildMode, setBuildMode] = useState<'idle' | 'place' | 'delete' | 'spell' | 'terrain'>('idle');
  const [blockRotation, setBlockRotation] = useState<number>(0);
  const [isForgeMenuOpen, setIsForgeMenuOpen] = useState<boolean>(false);
  const [activeSpellTemplate, setActiveSpellTemplate] = useState<SpellTemplate3D | null>(null);
  const [tokenElevations, setTokenElevationsState] = useState<Record<string, number>>(initialTokenElevations || {});
  const [isAssetsLocked, setIsAssetsLocked] = useState<boolean>(true);

  const handleToggleAssetsLocked = useCallback(() => {
    setIsAssetsLocked((prev) => {
      const next = !prev;
      if (next) {
        setSelectedBlockId(null);
        setIsInspectorModalOpen(false);
        toast.info('🔒 Edição de assets travada.');
      } else {
        toast.success('🔓 Edição de assets liberada! Agora você pode mover, girar e configurar objetos.');
      }
      return next;
    });
  }, []);

  // Wrappers to persist updates upward asynchronously without violating React reducer purity
  const setBuildingBlocks = useCallback((updater: BuildingBlock3D[] | ((prev: BuildingBlock3D[]) => BuildingBlock3D[])) => {
    setBuildingBlocksState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onBuildingBlocksChange) {
        queueMicrotask(() => {
          onBuildingBlocksChange(next);
        });
      }
      return next;
    });
  }, [onBuildingBlocksChange]);

  const setTerrainSurfaces = useCallback((updater: TerrainCellData[] | ((prev: TerrainCellData[]) => TerrainCellData[])) => {
    setTerrainSurfacesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onTerrainSurfacesChange) {
        queueMicrotask(() => {
          onTerrainSurfacesChange(next);
        });
      }
      return next;
    });
  }, [onTerrainSurfacesChange]);

  const setGridConfig = useCallback((updater: GridConfig3D | ((prev: GridConfig3D) => GridConfig3D)) => {
    setGridConfigState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onGridConfigChange) {
        queueMicrotask(() => {
          onGridConfigChange(next);
        });
      }
      return next;
    });
  }, [onGridConfigChange]);

  const setTokenElevations = useCallback((updater: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => {
    setTokenElevationsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onTokenElevationsChange) {
        queueMicrotask(() => {
          onTokenElevationsChange(next);
        });
      }
      return next;
    });
  }, [onTokenElevationsChange]);

  // Sync when parent changes active scene props
  useEffect(() => {
    const next = Array.isArray(initialBuildingBlocks) ? initialBuildingBlocks : [];
    setBuildingBlocksState((prev) => {
      if (prev.length === next.length && JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }
      return next;
    });
  }, [initialBuildingBlocks]);

  useEffect(() => {
    const next = Array.isArray(initialTerrainSurfaces) ? initialTerrainSurfaces : [];
    setTerrainSurfacesState((prev) => {
      if (prev.length === next.length && JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }
      return next;
    });
  }, [initialTerrainSurfaces]);

  useEffect(() => {
    const next = initialGridConfig ? { ...DEFAULT_GRID_CONFIG_3D, ...initialGridConfig } : DEFAULT_GRID_CONFIG_3D;
    setGridConfigState((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }
      return next;
    });
  }, [initialGridConfig]);

  useEffect(() => {
    const next = initialTokenElevations && typeof initialTokenElevations === 'object' ? initialTokenElevations : {};
    setTokenElevationsState((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(next)) {
        return prev;
      }
      return next;
    });
  }, [initialTokenElevations]);

  const activeBlockDragRef = useRef<{
    blockId: string;
    mode: 'move' | 'rotate' | 'stretch';
    startPoint: THREE.Vector3;
    startRotation: number;
    startSegments: number;
    startPos: { x: number; z: number };
  } | null>(null);

  const terrainMeshManagerRef = useRef<TerrainMeshManagerInstance | null>(null);
  const isPaintingTerrainRef = useRef<boolean>(false);
  const surfacesMapRef = useRef<Map<string, TerrainSurfaceType>>(new Map());

  // Manter mapa rápido de coordenadas (snappedX_snappedZ -> TerrainSurfaceType)
  useEffect(() => {
    const map = new Map<string, TerrainSurfaceType>();
    terrainSurfaces.forEach((cell) => {
      map.set(`${Math.round(cell.x)}_${Math.round(cell.z)}`, cell.type);
    });
    surfacesMapRef.current = map;
    terrainMeshManagerRef.current?.updateSurfaces(terrainSurfaces, gridConfig.terrainOpacity ?? 0.65);
  }, [terrainSurfaces, gridConfig.terrainOpacity]);

  // Atualizar opacidade dos materiais Three.js dinamicamente quando o usuário mexer no slider
  useEffect(() => {
    terrainMeshManagerRef.current?.setOpacity(gridConfig.terrainOpacity ?? 0.65);
  }, [gridConfig.terrainOpacity]);

  const forgeRef = useRef({
    isAssetsLocked,
    buildMode,
    activeBlockType,
    blockRotation,
    gridConfig,
    activeSpellTemplate,
    buildingBlocks,
    selectedBlockId,
    activeTerrainType,
    terrainBrushSize,
    terrainSurfaces,
  });
  forgeRef.current = {
    isAssetsLocked,
    buildMode,
    activeBlockType,
    blockRotation,
    gridConfig,
    activeSpellTemplate,
    buildingBlocks,
    selectedBlockId,
    activeTerrainType,
    terrainBrushSize,
    terrainSurfaces,
  };

  // Three.js hover ring for attack targeting mode
  const hoverRingRef = useRef<THREE.Mesh | null>(null);
  const blocksGroupRef = useRef<THREE.Group | null>(null);
  const spellTemplateGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const floorMeshRef = useRef<THREE.Mesh | null>(null);

  const paintTerrainAtPoint = useCallback((pt: THREE.Vector3, isErasing: boolean = false) => {
    const wCells = forgeRef.current.gridConfig.widthCells || 20;
    const hCells = forgeRef.current.gridConfig.heightCells || 20;
    const snap = worldPosToGridCell(pt.x, pt.z, wCells, hCells);
    const type = isErasing ? 'normal' : forgeRef.current.activeTerrainType;
    const brush = isErasing ? 1 : (forgeRef.current.terrainBrushSize || 1);

    const halfBrush = Math.floor(brush / 2);
    const newCells: TerrainCellData[] = [];
    const keysToUpdate = new Set<string>();

    for (let dx = -halfBrush; dx <= halfBrush; dx++) {
      for (let dz = -halfBrush; dz <= halfBrush; dz++) {
        const col = Math.max(0, Math.min(wCells - 1, snap.col + dx));
        const row = Math.max(0, Math.min(hCells - 1, snap.row + dz));
        const pos = worldPosToGridCell(
          pt.x + dx * 2.0,
          pt.z + dz * 2.0,
          wCells,
          hCells
        );
        const cellId = `${col}_${row}`;
        keysToUpdate.add(cellId);
        if (type !== 'normal') {
          newCells.push({
            id: cellId,
            col,
            row,
            x: pos.snappedX,
            z: pos.snappedZ,
            type,
          });
        }
      }
    }

    setTerrainSurfaces((prev) => {
      const filtered = prev.filter((c) => !keysToUpdate.has(c.id));
      return [...filtered, ...newCells];
    });
  }, [setTerrainSurfaces]);

  const handleToggleTorch = useCallback((c: Combatant) => {
    if (!onUpdateCombatants) return;
    const nextTorch = !c.hasTorch;
    onUpdateCombatants(combatants.map((item) => (item.id === c.id ? { ...item, hasTorch: nextTorch } : item)));
    if (nextTorch) {
      toast.success(`🔥 ${c.name} acendeu uma tocha (Luz Dinâmica 3D ativa)!`);
    } else {
      toast.info(`🌑 ${c.name} apagou a tocha.`);
    }
  }, [combatants, onUpdateCombatants]);

  useEffect(() => {
    setTargetIdState((prev) => (prev === propSelectedTargetId ? prev : propSelectedTargetId));
    if (!propSelectedTargetId) {
      setSelectedCombatantId((prev) => (prev === null ? prev : null));
    }
  }, [propSelectedTargetId, setSelectedCombatantId]);

  // Listener para limpar imediatamente seleção de alvos e tokens quando o ataque finaliza
  useEffect(() => {
    const handleClear = () => {
      setTargetIdState(undefined);
      setSelectedCombatantId(null);
      if (onSelectTarget) onSelectTarget(undefined);
    };

    window.addEventListener('masters_codex_clear_target_selection', handleClear);
    return () => window.removeEventListener('masters_codex_clear_target_selection', handleClear);
  }, [onSelectTarget, setSelectedCombatantId]);

  const { videoMapVolume, isVideoMapMuted } = useAudio();

  // Three.js persistent references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const tokenGroupRef = useRef<THREE.Group | null>(null);
  const highlightGroupRef = useRef<THREE.Group | null>(null);
  const trailGroupRef = useRef<THREE.Group | null>(null);
  const dragTrailRef = useRef<{ x: number; z: number }[]>([]);
  const tokenMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const rainSysRef = useRef<ReturnType<typeof createRainParticleSystem> | null>(null);
  const groundFogSysRef = useRef<VolumetricFogInstance | null>(null);
  const fireSysRef = useRef<FireParticleSystemInstance | null>(null);
  const skyDomeRef = useRef<SkyDomeInstance | null>(null);
  const cloudSystemRef = useRef<CloudSystemInstance | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const floorTextureUrlRef = useRef<string | undefined>(floorTextureUrl);
  const pingGroupRef = useRef<THREE.Group | null>(null);
  const auraSysRef = useRef<AuraSystem3D | null>(null);

  // 3D Living Battlemap (YouTube CSS3D & Direct HTML5 VideoTexture) References
  const css3dRendererRef = useRef<CSS3DRenderer | null>(null);
  const css3dSceneRef = useRef<THREE.Scene | null>(null);
  const css3dFloorObjectRef = useRef<CSS3DObject | null>(null);
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);

  useEffect(() => {
    floorTextureUrlRef.current = floorTextureUrl;
  }, [floorTextureUrl]);

  // Local environment state for immediate UI slider responsiveness
  const [internalEnv, setInternalEnv] = useState<{
    timeOfDayHour: number;
    timeOfDayPreset: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
    isIndoor: boolean;
    hasFog: boolean;
    hasRain: boolean;
    cloudDensity: number;
    moonSize: number;
    moonLuminosity: number;
    moonOffsetAngle: number;
    moonAltitude: number;
    sunSize: number;
    sunLightIntensity?: number;
    ambientLightIntensity?: number;
    skyTurbidity?: number;
    skyRayleigh?: number;
    mieCoefficient?: number;
    mieDirectionalG?: number;
    rainIntensity?: number;
    rainSpeed?: number;
    rainDropSize?: number;
    windAngle?: number;
    windStrength?: number;
    rainOpacity?: number;
    rainTheme?: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom';
    rainCustomColor?: string;
    hasSplashes?: boolean;
    splashSize?: number;
    splashIntensity?: number;
    hasCrownDrops?: boolean;
    hasLightning?: boolean;
    lightningFrequency?: number;
    groundFogDensity?: number;
    groundFogHeight?: number;
    groundFogSpeed?: number;
    globalFogDensity?: number;
    fogNoiseScale?: number;
    fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
    fogCustomColor?: string;
  }>({
    timeOfDayHour: propTimeOfDayHour,
    timeOfDayPreset: propTimeOfDayPreset,
    isIndoor: propIsIndoor,
    hasFog: propHasFog,
    hasRain: propHasRain,
    cloudDensity: propCloudDensity,
    moonSize: propMoonSize,
    moonLuminosity: propMoonLuminosity,
    moonOffsetAngle: propMoonOffsetAngle,
    moonAltitude: propMoonAltitude,
    sunSize: propSunSize,
    sunLightIntensity: propSunLightIntensity,
    ambientLightIntensity: propAmbientLightIntensity,
    skyTurbidity: propSkyTurbidity,
    skyRayleigh: propSkyRayleigh,
    mieCoefficient: propMieCoefficient,
    mieDirectionalG: propMieDirectionalG,
    rainIntensity: propRainIntensity,
    rainSpeed: propRainSpeed,
    rainDropSize: propRainDropSize,
    windAngle: propWindAngle,
    windStrength: propWindStrength,
    rainOpacity: 0.6,
    rainTheme: 'water',
    rainCustomColor: '#88ccff',
    hasSplashes: true,
    splashSize: 1.0,
    splashIntensity: 1.0,
    hasCrownDrops: true,
    hasLightning: false,
    lightningFrequency: 1.0,
    groundFogDensity: propGroundFogDensity,
    groundFogHeight: propGroundFogHeight,
    groundFogSpeed: propGroundFogSpeed,
    globalFogDensity: propGlobalFogDensity,
    fogNoiseScale: propFogNoiseScale,
    fogColorPreset: propFogColorPreset,
    fogCustomColor: propFogCustomColor,
  });

  useEffect(() => {
    setInternalEnv((prev) => {
      const isSame =
        prev.timeOfDayHour === propTimeOfDayHour &&
        prev.timeOfDayPreset === propTimeOfDayPreset &&
        prev.isIndoor === propIsIndoor &&
        prev.hasFog === propHasFog &&
        prev.hasRain === propHasRain &&
        prev.cloudDensity === propCloudDensity &&
        prev.moonSize === propMoonSize &&
        prev.moonLuminosity === propMoonLuminosity &&
        prev.moonOffsetAngle === propMoonOffsetAngle &&
        prev.moonAltitude === propMoonAltitude &&
        prev.sunSize === propSunSize &&
        prev.sunLightIntensity === propSunLightIntensity &&
        prev.ambientLightIntensity === propAmbientLightIntensity &&
        prev.skyTurbidity === propSkyTurbidity &&
        prev.skyRayleigh === propSkyRayleigh &&
        prev.mieCoefficient === propMieCoefficient &&
        prev.mieDirectionalG === propMieDirectionalG &&
        prev.rainIntensity === propRainIntensity &&
        prev.rainSpeed === propRainSpeed &&
        prev.rainDropSize === propRainDropSize &&
        prev.windAngle === propWindAngle &&
        prev.windStrength === propWindStrength &&
        prev.groundFogDensity === propGroundFogDensity &&
        prev.groundFogHeight === propGroundFogHeight &&
        prev.groundFogSpeed === propGroundFogSpeed &&
        prev.globalFogDensity === propGlobalFogDensity &&
        prev.fogNoiseScale === propFogNoiseScale &&
        prev.fogColorPreset === propFogColorPreset &&
        prev.fogCustomColor === propFogCustomColor;

      if (isSame) {
        return prev;
      }

      return {
        ...prev,
        timeOfDayHour: propTimeOfDayHour,
        timeOfDayPreset: propTimeOfDayPreset,
        isIndoor: propIsIndoor,
        hasFog: propHasFog,
        hasRain: propHasRain,
        cloudDensity: propCloudDensity,
        moonSize: propMoonSize,
        moonLuminosity: propMoonLuminosity,
        moonOffsetAngle: propMoonOffsetAngle,
        moonAltitude: propMoonAltitude,
        sunSize: propSunSize,
        sunLightIntensity: propSunLightIntensity,
        ambientLightIntensity: propAmbientLightIntensity,
        skyTurbidity: propSkyTurbidity,
        skyRayleigh: propSkyRayleigh,
        mieCoefficient: propMieCoefficient,
        mieDirectionalG: propMieDirectionalG,
        rainIntensity: propRainIntensity,
        rainSpeed: propRainSpeed,
        rainDropSize: propRainDropSize,
        windAngle: propWindAngle,
        windStrength: propWindStrength,
        groundFogDensity: propGroundFogDensity,
        groundFogHeight: propGroundFogHeight,
        groundFogSpeed: propGroundFogSpeed,
        globalFogDensity: propGlobalFogDensity,
        fogNoiseScale: propFogNoiseScale,
        fogColorPreset: propFogColorPreset,
        fogCustomColor: propFogCustomColor,
      };
    });
  }, [
    propTimeOfDayHour,
    propTimeOfDayPreset,
    propIsIndoor,
    propHasFog,
    propHasRain,
    propCloudDensity,
    propMoonSize,
    propMoonLuminosity,
    propMoonOffsetAngle,
    propMoonAltitude,
    propSunSize,
    propSunLightIntensity,
    propAmbientLightIntensity,
    propSkyTurbidity,
    propSkyRayleigh,
    propMieCoefficient,
    propMieDirectionalG,
    propRainIntensity,
    propRainSpeed,
    propRainDropSize,
    propWindAngle,
    propWindStrength,
    propGroundFogDensity,
    propGroundFogHeight,
    propGroundFogSpeed,
    propGlobalFogDensity,
    propFogNoiseScale,
    propFogColorPreset,
    propFogCustomColor,
  ]);

  const handleEnvironmentChange = useCallback(
    (env: {
      timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
      isIndoor?: boolean;
      timeOfDayHour: number;
      hasFog: boolean;
      hasRain: boolean;
      cloudDensity?: number;
      moonSize?: number;
      moonLuminosity?: number;
      moonOffsetAngle?: number;
      moonAltitude?: number;
      sunSize?: number;
      sunLightIntensity?: number;
      ambientLightIntensity?: number;
      skyTurbidity?: number;
      skyRayleigh?: number;
      mieCoefficient?: number;
      mieDirectionalG?: number;
      rainIntensity?: number;
      rainSpeed?: number;
      rainDropSize?: number;
      windAngle?: number;
      windStrength?: number;
      rainOpacity?: number;
      rainTheme?: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom';
      rainCustomColor?: string;
      hasSplashes?: boolean;
      splashSize?: number;
      splashIntensity?: number;
      hasCrownDrops?: boolean;
      hasLightning?: boolean;
      lightningFrequency?: number;
      groundFogDensity?: number;
      groundFogHeight?: number;
      groundFogSpeed?: number;
      globalFogDensity?: number;
      fogNoiseScale?: number;
      fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
      fogCustomColor?: string;
    }) => {
      const prev = envRef.current;
      const nextPreset = env.timeOfDayPreset ?? prev.timeOfDayPreset;
      const nextIndoor = env.isIndoor ?? (nextPreset === 'indoors');
      const next = {
        ...prev,
        ...env,
        timeOfDayPreset: nextPreset,
        isIndoor: nextIndoor,
        cloudDensity: env.cloudDensity ?? prev.cloudDensity,
        moonSize: env.moonSize ?? prev.moonSize,
        moonLuminosity: env.moonLuminosity ?? prev.moonLuminosity,
        moonOffsetAngle: env.moonOffsetAngle ?? prev.moonOffsetAngle,
        moonAltitude: env.moonAltitude ?? prev.moonAltitude,
        sunSize: env.sunSize ?? prev.sunSize,
        sunLightIntensity: env.sunLightIntensity ?? prev.sunLightIntensity,
        ambientLightIntensity: env.ambientLightIntensity ?? prev.ambientLightIntensity,
        skyTurbidity: env.skyTurbidity ?? prev.skyTurbidity,
        skyRayleigh: env.skyRayleigh ?? prev.skyRayleigh,
        mieCoefficient: env.mieCoefficient ?? prev.mieCoefficient,
        mieDirectionalG: env.mieDirectionalG ?? prev.mieDirectionalG,
        rainIntensity: env.rainIntensity ?? prev.rainIntensity,
        rainSpeed: env.rainSpeed ?? prev.rainSpeed,
        rainDropSize: env.rainDropSize ?? prev.rainDropSize,
        windAngle: env.windAngle ?? prev.windAngle,
        windStrength: env.windStrength ?? prev.windStrength,
        rainOpacity: env.rainOpacity ?? prev.rainOpacity,
        rainTheme: env.rainTheme ?? prev.rainTheme,
        rainCustomColor: env.rainCustomColor ?? prev.rainCustomColor,
        hasSplashes: env.hasSplashes ?? prev.hasSplashes,
        splashSize: env.splashSize ?? prev.splashSize,
        splashIntensity: env.splashIntensity ?? prev.splashIntensity,
        hasCrownDrops: env.hasCrownDrops ?? prev.hasCrownDrops,
        hasLightning: env.hasLightning ?? prev.hasLightning,
        lightningFrequency: env.lightningFrequency ?? prev.lightningFrequency,
        groundFogDensity: env.groundFogDensity ?? prev.groundFogDensity,
        groundFogHeight: env.groundFogHeight ?? prev.groundFogHeight,
        groundFogSpeed: env.groundFogSpeed ?? prev.groundFogSpeed,
        globalFogDensity: env.globalFogDensity ?? prev.globalFogDensity,
        fogNoiseScale: env.fogNoiseScale ?? prev.fogNoiseScale,
        fogColorPreset: env.fogColorPreset ?? prev.fogColorPreset,
        fogCustomColor: env.fogCustomColor ?? prev.fogCustomColor,
      };
      
      setInternalEnv(next);
      if (propOnEnvironmentChange) {
        propOnEnvironmentChange(next);
      }
    },
    [propOnEnvironmentChange]
  );

  // Environment ref to avoid stale closures in the animate loop
  const envRef = useRef(internalEnv);

  useEffect(() => {
    envRef.current = internalEnv;
  }, [internalEnv]);

  // Dragging state references
  const isDraggingRef = useRef(false);
  const draggedTokenKeyRef = useRef<string | null>(null);
  const dragStartPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const lastDragSnapRef = useRef<{ x: number; z: number } | null>(null);
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const planeIntersectPoint = useRef(new THREE.Vector3());

const getStableDefaultPos = (idOrName: string): { x: number; z: number } => {
  let hash = 0;
  for (let i = 0; i < idOrName.length; i++) {
    hash = (hash << 5) - hash + idOrName.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const col = absHash % 5;
  const row = Math.floor(absHash / 5) % 5;
  return { x: col * 2 - 4, z: row * 2 - 4 };
};

  const getCombatantPos = useCallback((idOrName: string | null | undefined): { x: number; z: number } => {
    if (!idOrName) return { x: 0, z: 0 };

    if (localPositions[idOrName]) return localPositions[idOrName];

    // 1. Strict ID match
    const byId = combatants.find((c) => c.id === idOrName);
    if (byId) {
      if (localPositions[byId.id]) return localPositions[byId.id];
      if (byId.name && localPositions[byId.name]) return localPositions[byId.name];
      if (byId.x !== undefined && byId.z !== undefined) return { x: byId.x, z: byId.z };
      return getStableDefaultPos(byId.id);
    }

    // 2. Name match fallback
    const byName = combatants.find((c) => c.name === idOrName);
    if (byName) {
      const key = byName.id || byName.name;
      if (localPositions[key]) return localPositions[key];
      if (byName.x !== undefined && byName.z !== undefined) return { x: byName.x, z: byName.z };
      return getStableDefaultPos(key);
    }

    return getStableDefaultPos(idOrName);
  }, [combatants, localPositions]);

  // Helper to render reachable movement highlights around a given center position
  const renderMovementHighlights = useCallback((
    centerX: number,
    centerZ: number,
    remainingMeters: number,
    startX?: number,
    startZ?: number,
    totalBudgetMeters?: number
  ) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (highlightGroupRef.current) {
      scene.remove(highlightGroupRef.current);
      disposeHierarchy(highlightGroupRef.current);
      highlightGroupRef.current = null;
    }

    if (isPlacementPhase || !isBattleStarted || remainingMeters <= 0) return;

    const maxSquares = Math.floor(remainingMeters / 1.5);
    if (maxSquares < 0) return;

    const highlightGroup = new THREE.Group();
    highlightGroup.name = 'movementHighlightGroup';
    highlightGroupRef.current = highlightGroup;
    scene.add(highlightGroup);

    const geo = new THREE.PlaneGeometry(1.8, 1.8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9, // Tailwind sky-500
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide
    });

    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.4 });

    const originX = startX !== undefined ? startX : centerX;
    const originZ = startZ !== undefined ? startZ : centerZ;
    const maxBudget = totalBudgetMeters ?? remainingMeters;

    for (let dx = -maxSquares; dx <= maxSquares; dx++) {
      for (let dz = -maxSquares; dz <= maxSquares; dz++) {
        const gridX = centerX + dx * 2;
        const gridZ = centerZ + dz * 2;

        const stepsFromHead = Math.abs(dx) + Math.abs(dz);
        const distFromHeadMeters = stepsFromHead * 1.5;

        const stepsFromStart = (Math.abs(gridX - originX) + Math.abs(gridZ - originZ)) / 2;
        const distFromStartMeters = stepsFromStart * 1.5;

        if (distFromHeadMeters <= remainingMeters && distFromStartMeters <= maxBudget) {
          const mesh = new THREE.Mesh(geo, mat);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(gridX, 0.02, gridZ);
          highlightGroup.add(mesh);

          const line = new THREE.LineSegments(edges, lineMat);
          line.rotation.x = -Math.PI / 2;
          line.position.set(gridX, 0.02, gridZ);
          highlightGroup.add(line);
        }
      }
    }
  }, [isPlacementPhase, isBattleStarted]);

  // Helper to render active movement drag trail
  const renderDragTrail = useCallback((trail: { x: number; z: number }[]) => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (trailGroupRef.current) {
      scene.remove(trailGroupRef.current);
      disposeHierarchy(trailGroupRef.current);
      trailGroupRef.current = null;
    }

    if (trail.length <= 1) return;

    const trailGroup = new THREE.Group();
    trailGroup.name = 'dragTrailGroup';
    trailGroupRef.current = trailGroup;
    scene.add(trailGroup);

    // Calcular custo real de terreno
    const costInfo = calculateTrailTerrainCost(trail, surfacesMapRef.current);

    // 1. Highlight tiles in trail (amber para normal, laranja/vermelho para difícil)
    const tileGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const edges = new THREE.EdgesGeometry(tileGeo);

    for (let i = 1; i < trail.length; i++) {
      const pt = trail[i];
      const snapKey = `${Math.round(pt.x)}_${Math.round(pt.z)}`;
      const sType = surfacesMapRef.current.get(snapKey) || 'normal';
      const isDiff = TERRAIN_SURFACE_CATALOG[sType]?.isDifficultTerrain;

      const tileMat = new THREE.MeshBasicMaterial({
        color: isDiff ? 0xf97316 : 0xf59e0b,
        transparent: true,
        opacity: isDiff ? 0.42 : 0.28,
        side: THREE.DoubleSide
      });
      const lineMat = new THREE.LineBasicMaterial({
        color: isDiff ? 0xfb923c : 0xfbbf24,
        transparent: true,
        opacity: 0.85
      });

      const mesh = new THREE.Mesh(tileGeo, tileMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pt.x, 0.025, pt.z);
      trailGroup.add(mesh);

      const border = new THREE.LineSegments(edges, lineMat);
      border.rotation.x = -Math.PI / 2;
      border.position.set(pt.x, 0.025, pt.z);
      trailGroup.add(border);
    }

    // 2. Linha conectora ao longo dos pontos
    const points: THREE.Vector3[] = trail.map((pt) => new THREE.Vector3(pt.x, 0.04, pt.z));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathLineMat = new THREE.LineBasicMaterial({
      color: costInfo.difficultSquares > 0 ? 0xf97316 : 0x38bdf8,
      linewidth: 3
    });
    const pathLine = new THREE.Line(lineGeo, pathLineMat);
    trailGroup.add(pathLine);

    // 3. Badge flutuante de distância e terreno
    const distanceMeters = costInfo.totalCostMeters;
    const currentHead = trail[trail.length - 1];

    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
      ctx.strokeStyle = costInfo.difficultSquares > 0 ? '#f97316' : '#38bdf8';
      ctx.lineWidth = 6;

      const x = 10, y = 10, w = 260, h = 120, r = 24;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 34px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`👣 ${distanceMeters.toFixed(1)}m`, 140, 50);

      if (costInfo.difficultSquares > 0) {
        ctx.fillStyle = '#fb923c';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.fillText(`⚠️ Terreno Difícil (+${(costInfo.difficultSquares * 1.5).toFixed(1)}m)`, 140, 92);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.fillText(`${(trail.length - 1)} passos (${(distanceMeters / 0.3).toFixed(0)}ft)`, 140, 92);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    depthTest: false
    });
    const distanceSprite = new THREE.Sprite(spriteMat);
    distanceSprite.scale.set(2.6, 1.3, 1);
    distanceSprite.position.set(currentHead.x, 2.6, currentHead.z);
    trailGroup.add(distanceSprite);
  }, []);

  const callbacksRef = useRef({
    combatants,
    currentTurnIndex,
    isBattleStarted,
    setSelectedCombatantId,
    onSelectCombatant,
    onSelectTarget,
    canUserControlCombatant,
    updateTokenPosition3D,
    onUpdateCombatants,
    setLocalPositions,
    renderMovementHighlights,
    renderDragTrail,
    getCombatantPos,
    pendingAttack,
    setPendingAttack,
    targetIdState,
    propOnAttackTarget,
    setHoveredTargetId,
    setSplineBadgeInfo,
  });

  callbacksRef.current = {
    combatants,
    currentTurnIndex,
    isBattleStarted,
    setSelectedCombatantId,
    onSelectCombatant,
    onSelectTarget,
    canUserControlCombatant,
    updateTokenPosition3D,
    onUpdateCombatants,
    setLocalPositions,
    renderMovementHighlights,
    renderDragTrail,
    getCombatantPos,
    pendingAttack,
    setPendingAttack,
    targetIdState,
    propOnAttackTarget,
    setHoveredTargetId,
    setSplineBadgeInfo,
  };

  // 1. Raycast helper to detect combatant in 3D spell shape area
  const isCombatantInSpellArea = useCallback((c: Combatant, tokenPos: { x: number; z: number }) => {
    if (!activeSpellTargeting || !casterTokenKey || !spellTargetPosition) return false;
    const casterPos = getCombatantPos(casterTokenKey);
    const unitsPerMeter = 2 / 1.5;
    const sizeUnits = activeSpellTargeting.sizeMeters * unitsPerMeter;

    const dx = tokenPos.x - spellTargetPosition.x;
    const dz = tokenPos.z - spellTargetPosition.z;
    const distTargetToCombatant = Math.sqrt(dx * dx + dz * dz);

    if (activeSpellTargeting.shape === 'circle') {
      return distTargetToCombatant <= sizeUnits;
    }

    if (activeSpellTargeting.shape === 'cube') {
      const half = sizeUnits / 2;
      return Math.abs(dx) <= half && Math.abs(dz) <= half;
    }

    const tcx = tokenPos.x - casterPos.x;
    const tcz = tokenPos.z - casterPos.z;
    const distCasterToCombatant = Math.sqrt(tcx * tcx + tcz * tcz);
    if (distCasterToCombatant === 0) return false;

    const rad = (aoeRotation * Math.PI) / 180;
    const ndx = Math.sin(rad);
    const ndz = Math.cos(rad);

    if (activeSpellTargeting.shape === 'cone') {
      if (distCasterToCombatant > sizeUnits) return false;
      const dot = (tcx * ndx + tcz * ndz) / distCasterToCombatant;
      return dot >= Math.cos(Math.PI / 6); // 60 graus
    }
    if (activeSpellTargeting.shape === 'line') {
      const projection = tcx * ndx + tcz * ndz;
      if (projection < 0 || projection > sizeUnits) return false;
      const perpDist = Math.sqrt(distCasterToCombatant * distCasterToCombatant - projection * projection);
      return perpDist <= (1.5 * unitsPerMeter) / 2; // Largura padrão de 1.5m
    }

    return false;
  }, [activeSpellTargeting, casterTokenKey, spellTargetPosition, aoeRotation, getCombatantPos]);

  // Sincronizar alvos detectados de AoE com o LiveCockpitContext
  useEffect(() => {
    if (!activeSpellTargeting || !casterTokenKey || !spellTargetPosition) {
      setDetectedAoETargets((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const targets: string[] = [];
    combatants.forEach((c, idx) => {
      const key = c.id ? c.id : `${c.name}__${idx}`;
      const pos = localPositions[key] || localPositions[c.id || c.name] || (c.x !== undefined && c.z !== undefined ? { x: c.x, z: c.z } : getStableDefaultPos(key));
      if (isCombatantInSpellArea(c, pos)) {
        targets.push(c.id);
      }
    });

    setDetectedAoETargets((prev) => {
      if (prev.length === targets.length && prev.every((t, i) => t === targets[i])) {
        return prev;
      }
      return targets;
    });
  }, [activeSpellTargeting, casterTokenKey, spellTargetPosition, aoeRotation, combatants, localPositions, isCombatantInSpellArea, setDetectedAoETargets, getStableDefaultPos]);

  // Instanced Token Manager Ref
  const instancedTokenManagerRef = useRef<any>(null);
  
  // Sync token meshes to current combatant state
  const syncTokens = useCallback(() => {
    const tokenGroup = tokenGroupRef.current;
    if (!tokenGroup || !sceneRef.current) return;

    if (!instancedTokenManagerRef.current) {
      instancedTokenManagerRef.current = new InstancedTokenManager(sceneRef.current, 1000);
    }

    // Build unique keys: prefer id, fall back to name+idx to avoid collisions between same-named combatants
    const activeKeys = new Set(combatants.map((c, idx) => c.id ? c.id : `${c.name}__${idx}`));

    // Remove deleted tokens (Unique ones)
    for (const [key, group] of tokenMeshMapRef.current.entries()) {
      if (!activeKeys.has(key)) {
        tokenGroup.remove(group);
        disposeHierarchy(group);
        tokenMeshMapRef.current.delete(key);
      }
    }

    const isNightTime = internalEnv.timeOfDayPreset === 'indoors' || internalEnv.isIndoor || internalEnv.timeOfDayPreset === 'night' || internalEnv.timeOfDayHour < 6 || internalEnv.timeOfDayHour > 19;
    const isPlayerViewEffective = !isDm || isPlayerVisionMode;
    const genericCombatants: Combatant[] = [];
    const genericOptionsMap = new Map<string, any>();

    // 1. Mapear fontes de visão de todos os jogadores
    const playerVisionSources = combatants
      .filter((c) => c.type === 'player')
      .map((p, pIdx) => {
        const pKey = p.id ? p.id : `${p.name}__${pIdx}`;
        const pPos = localPositions[pKey] || localPositions[p.id || p.name] || (p.x !== undefined && p.z !== undefined ? { x: p.x, z: p.z } : getStableDefaultPos(pKey));
        
        let visionRadiusUnits = 12; // 30 pés normal (6 células x 2 unidades)
        if (p.hasTorch) {
          visionRadiusUnits = Math.max(visionRadiusUnits, 16); // 40 pés tocha (20ft plena + 20ft penumbra)
        }
        if (p.visionType === 'darkvision') {
          const dvRange = p.darkvisionRange || 60;
          visionRadiusUnits = Math.max(visionRadiusUnits, (dvRange / 5) * 2);
        } else if (p.visionType === 'blindsight' || p.visionType === 'tremorsense') {
          const senseRange = p.visionRange || 30;
          visionRadiusUnits = Math.max(visionRadiusUnits, (senseRange / 5) * 2);
        } else if (p.visionType === 'truesight') {
          const trueRange = p.visionRange || 120;
          visionRadiusUnits = Math.max(visionRadiusUnits, (trueRange / 5) * 2);
        }
        
        return {
          combatant: p,
          pos: pPos,
          radiusUnits: visionRadiusUnits,
          hasTorch: !!p.hasTorch,
        };
      });

    // Sync active combatants
    combatants.forEach((c, idx) => {
      // Use unique key: id preferred, fall back to name+idx to prevent same-named tokens colliding
      const key = c.id ? c.id : `${c.name}__${idx}`;
      const pos = localPositions[key] || localPositions[c.id || c.name] || (c.x !== undefined && c.z !== undefined ? { x: c.x, z: c.z } : getStableDefaultPos(key));
      const rot = localRotations[key] || localRotations[c.id || c.name] || 0;

      const targeted = activeSpellTargeting && casterTokenKey && isCombatantInSpellArea(c, pos);

      // Checar se o combatente é visível aos jogadores na escuridão
      let isSeenByPlayers = true;
      if (isNightTime && c.type === 'monster') {
        if (c.hasTorch) {
          isSeenByPlayers = true;
        } else if (playerVisionSources.length === 0) {
          isSeenByPlayers = true;
        } else {
          isSeenByPlayers = playerVisionSources.some((pSource) => {
            const dx = pos.x - pSource.pos.x;
            const dz = pos.z - pSource.pos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            return dist <= pSource.radiusUnits;
          });
        }
      }

      const isVisibleIn3D = isPlayerViewEffective ? (c.type === 'player' || isSeenByPlayers) : true;

      const options: TokenMeshOptions = {
        combatant: c,
        isCurrentTurn: isBattleStarted ? (idx === currentTurnIndex) : false,
        isSelectedTarget: targetIdState === c.id,
        isSelectedForRotation: selectedCombatantId === key,
        isControlledByUser: canUserControlCombatant(c),
        positionX: pos.x,
        positionZ: pos.z,
        rotationAngleDeg: rot,
        isSpellTargeted: !!targeted,
        isNight: isNightTime,
        isIlluminated: isSeenByPlayers || !!c.hasTorch,
      };

      // Separar Genéricos de Únicos (Usamos instanciamento em massa apenas se houver >= 15 combatentes em tela)
      const isBillboard = c.tokenType === 'billboard' || !!c.tokenImageUrl;
      const isGeneric = combatants.length >= 15 && c.type === 'monster' && !c.modelUrl && !isBillboard;

      if (isGeneric) {
        // Remover possível representação única antiga se existir
        const existingGroup = tokenMeshMapRef.current.get(key);
        if (existingGroup) {
          tokenGroup.remove(existingGroup);
          disposeHierarchy(existingGroup);
          tokenMeshMapRef.current.delete(key);
        }

        if (isVisibleIn3D) {
          genericCombatants.push(c);
          genericOptionsMap.set(key, options);
        }
      } else {
        const existingGroup = tokenMeshMapRef.current.get(key);
        let shouldCreate = !existingGroup;

        if (existingGroup) {
          const ud = existingGroup.userData || {};
          const is2D = c.modelUrl && !c.modelUrl.endsWith('.glb');
          const currentType = c.tokenType || ((c.tokenImageUrl || c.combatImageUrl || is2D) ? 'billboard' : '3d');
          const currentImg = c.combatImageUrl || c.tokenImageUrl || (is2D ? c.modelUrl : undefined) || c.avatarUrl;
          let currentModel = c.modelUrl;
          if (!currentModel && currentType === '3d') {
            currentModel = c.type === 'player'
              ? resolvePlayerModelUrl(c.name)
              : getModelUrlByNameOrPath(c.name);
          }

          if (ud.tokenType !== currentType || ud.modelUrl !== currentModel || ud.imageUrl !== currentImg) {
            // Re-create the token mesh because the representation changed!
            tokenGroup.remove(existingGroup);
            disposeHierarchy(existingGroup);
            tokenMeshMapRef.current.delete(key);
            shouldCreate = true;
          }
        }

        if (!shouldCreate && existingGroup) {
          updateTokenMeshState(existingGroup, options);

          // Dynamic PointLight for Torches / Token Lighting
          let torchLight = existingGroup.getObjectByName('tokenTorchLight') as THREE.PointLight;
          if (c.hasTorch || c.visionType === 'darkvision') {
            const lightColor = c.hasTorch ? 0xff9933 : 0x7dd3fc;
            const lightIntensity = c.hasTorch ? 3.5 : 1.2;
            const lightDistance = c.hasTorch ? 16 : Math.max(12, ((c.darkvisionRange || 60) / 5) * 2);
            if (!torchLight) {
              torchLight = new THREE.PointLight(lightColor, lightIntensity, lightDistance, c.hasTorch ? 1.2 : 1.5);
              torchLight.name = 'tokenTorchLight';
              torchLight.position.set(0, 1.8, 0);
              torchLight.castShadow = true;
              torchLight.shadow.mapSize.width = 512;
              torchLight.shadow.mapSize.height = 512;
              torchLight.shadow.bias = -0.002;
              existingGroup.add(torchLight);
            } else {
              torchLight.color.setHex(lightColor);
              torchLight.distance = lightDistance;
              if (c.hasTorch) {
                // Flame flicker effect
                torchLight.intensity = 3.2 + Math.sin(Date.now() * 0.01) * 0.4 + (Math.random() - 0.5) * 0.2;
              } else {
                torchLight.intensity = lightIntensity;
              }
            }
          } else if (torchLight) {
            existingGroup.remove(torchLight);
          }

          // Visibilidade da malha no 3D
          existingGroup.visible = isVisibleIn3D;

          // No modo DM, se o monstro estiver oculto dos jogadores no escuro, aplica opacidade translúcida
          if (!isPlayerViewEffective && c.type === 'monster' && !isSeenByPlayers && isNightTime) {
            existingGroup.traverse((child) => {
              if ((child as any).material) {
                const mat = (child as any).material;
                if (mat.opacity !== undefined) {
                  mat.transparent = true;
                  mat.opacity = 0.45;
                }
              }
            });
          }
        } else {
          const tokenMesh = createTokenMesh(options);
          
          if (c.hasTorch || c.visionType === 'darkvision') {
            const lightColor = c.hasTorch ? 0xff9933 : 0x7dd3fc;
            const lightIntensity = c.hasTorch ? 3.5 : 1.2;
            const lightDistance = c.hasTorch ? 16 : Math.max(12, ((c.darkvisionRange || 60) / 5) * 2);
            const torchLight = new THREE.PointLight(lightColor, lightIntensity, lightDistance, c.hasTorch ? 1.2 : 1.5);
            torchLight.name = 'tokenTorchLight';
            torchLight.position.set(0, 1.8, 0);
            torchLight.castShadow = true;
            torchLight.shadow.mapSize.width = 512;
            torchLight.shadow.mapSize.height = 512;
            torchLight.shadow.bias = -0.002;
            tokenMesh.add(torchLight);
          }

          tokenMesh.visible = isVisibleIn3D;

          tokenGroup.add(tokenMesh);
          tokenMeshMapRef.current.set(key, tokenMesh);
        }
      }
    });

    // Update InstancedMesh manager
    instancedTokenManagerRef.current.update(genericCombatants, genericOptionsMap);

  }, [
    combatants,
    currentTurnIndex,
    targetIdState,
    selectedCombatantId,
    localPositions,
    localRotations,
    canUserControlCombatant,
    activeSpellTargeting,
    casterTokenKey,
    isCombatantInSpellArea,
    isPlayerVisionMode,
    internalEnv.timeOfDayPreset,
    internalEnv.timeOfDayHour,
    isDm,
  ]);

  // Render / Sync 3D Pings on the floor plane
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (pingGroupRef.current) {
      scene.remove(pingGroupRef.current);
      disposeHierarchy(pingGroupRef.current);
      pingGroupRef.current = null;
    }

    if (!pings || pings.length === 0) return;

    const pingGroup = new THREE.Group();
    pingGroup.name = 'ping3DGroup';
    pingGroupRef.current = pingGroup;
    scene.add(pingGroup);

    pings.forEach((ping, idx) => {
      if (ping.context !== 'battle3d' && ping.worldX === undefined) return;

      const pId = ping.id || `ping-${idx}`;
      const pingContainer = new THREE.Group();
      pingContainer.name = `ping-${pId}`;
      pingGroup.add(pingContainer);

      const rawWx = ping.worldX !== undefined ? ping.worldX : ((ping.x / 100) * 20 - 10);
      const rawWz = ping.worldZ !== undefined ? ping.worldZ : ((ping.y / 100) * 20 - 10);

      // Snap to 2x2 grid tile center
      const wx = Math.floor(rawWx / 2) * 2 + 1;
      const wz = Math.floor(rawWz / 2) * 2 + 1;

      const colorHex = parseInt((ping.color || '#f59e0b').replace('#', '0x'), 16);

      // 1. Solid Center Floor Ring
      const ringGeo = new THREE.RingGeometry(0.2, 0.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(wx, 0.05, wz);
      pingContainer.add(ringMesh);

      // 2. Outer Pulsing Floor Ring
      const pulseGeo = new THREE.RingGeometry(0.8, 1.4, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.rotation.x = -Math.PI / 2;
      pulseMesh.position.set(wx, 0.05, wz);
      pingContainer.add(pulseMesh);

      // 3. Sender Badge Sprite floating above ping position with Close [✖] Button
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = ping.color || '#f59e0b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(4, 4, 248, 56, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`📍 ${ping.senderName}`, 16, 32);

        // Close button [✖] box
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(200, 12, 40, 40, 10);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✖', 220, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(wx, 1.8, wz);
        sprite.scale.set(3, 0.75, 1);
        pingContainer.add(sprite);
      }
    });
  }, [pings]);

  // 1. Setup Three.js Scene ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const css3dScene = new THREE.Scene();
    css3dSceneRef.current = css3dScene;

    const { camera, controls } = setupCameraAndOrbit(container, width, height);
    cameraRef.current = camera;
    controlsRef.current = controls;

    const css3dRenderer = new CSS3DRenderer();
    css3dRenderer.setSize(width, height);
    css3dRenderer.domElement.style.position = 'absolute';
    css3dRenderer.domElement.style.top = '0';
    css3dRenderer.domElement.style.left = '0';
    css3dRenderer.domElement.style.width = '100%';
    css3dRenderer.domElement.style.height = '100%';
    css3dRenderer.domElement.style.pointerEvents = 'none';
    css3dRenderer.domElement.style.zIndex = '0';
    css3dRenderer.domElement.style.transformStyle = 'preserve-3d';
    css3dRenderer.domElement.style.backfaceVisibility = 'visible';
    (css3dRenderer.domElement.style as any).webkitBackfaceVisibility = 'visible';
    css3dRendererRef.current = css3dRenderer;
    container.appendChild(css3dRenderer.domElement);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    patchWebGLContext(renderer);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    rendererRef.current = renderer;

    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '1';
    container.appendChild(renderer.domElement);

    // Grid Floor Helper (Linhas do Grid 3D Retangular / Circular)
    const initConfig = forgeRef.current.gridConfig || DEFAULT_GRID_CONFIG_3D;
    const initWCells = initConfig.widthCells || 20;
    const initHCells = initConfig.heightCells || 20;
    const initShape = initConfig.shape || 'square';
    const initColor = initConfig.lineColor || '#0284c7';
    const initOpacity = typeof initConfig.lineOpacity === 'number' ? initConfig.lineOpacity : 0.35;

    const gridLines = createCustomGridLines(
      initWCells,
      initHCells,
      initShape,
      initColor,
      '#334155',
      initOpacity
    );
    (gridLines as any).frustumCulled = false;
    scene.add(gridLines);
    gridHelperRef.current = gridLines as any;

    // Floor Platform (compatível com largura e comprimento independentes)
    const initWUnits = initWCells * 2.0;
    const initHUnits = initHCells * 2.0;
    const floorGeo = initShape === 'circle'
      ? new THREE.CircleGeometry(Math.max(initWUnits, initHUnits) / 2, 64)
      : new THREE.PlaneGeometry(initWUnits, initHUnits);

    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x0b1120, 
      roughness: 0.95, 
      metalness: 0.05,
      side: THREE.DoubleSide 
    });
    floorMatRef.current = floorMat;
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    floorMesh.frustumCulled = false;
    scene.add(floorMesh);
    floorMeshRef.current = floorMesh;

    // 3D Building Blocks Container
    const blocksGroup = new THREE.Group();
    blocksGroup.name = 'buildingBlocksGroup';
    scene.add(blocksGroup);
    blocksGroupRef.current = blocksGroup;

    // 3D Tactical Terrain Surfaces Mesh Manager (BG3 Surfaces)
    const terrainManager = createTerrainMeshManager(scene);
    terrainMeshManagerRef.current = terrainManager;
    terrainManager.updateSurfaces(forgeRef.current.terrainSurfaces);

    // 3D Spell Templates Container
    const spellTemplateGroup = new THREE.Group();
    spellTemplateGroup.name = 'spellTemplateGroup';
    scene.add(spellTemplateGroup);
    spellTemplateGroupRef.current = spellTemplateGroup;

    // Apply floor texture immediately if a static image URL is already available on mount
    if (floorTextureUrlRef.current && !isAnyVideoMapUrl(floorTextureUrlRef.current)) {
      const loader = new THREE.TextureLoader();
      loader.load(floorTextureUrlRef.current, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        if (floorMatRef.current) {
          floorMatRef.current.map = texture;
          floorMatRef.current.color.setHex(0xffffff); // Permite que o mapa de textura apareça com 100% de nitidez
          floorMatRef.current.roughness = 0.85;
          floorMatRef.current.metalness = 0.05;
          floorMatRef.current.emissive.setHex(0x000000);
          floorMatRef.current.emissiveMap = null;
          floorMatRef.current.emissiveIntensity = 0;
          floorMatRef.current.needsUpdate = true;
        }
      });
    }

    // Dynamic Initial Lighting based on Time of Day & Weather presets
    const initialEnv = calculateEnvironmentSettings(
      envRef.current.timeOfDayHour,
      envRef.current.timeOfDayPreset,
      envRef.current.hasFog,
      envRef.current.hasRain,
      envRef.current.cloudDensity,
      envRef.current.moonSize,
      envRef.current.moonLuminosity,
      envRef.current.moonOffsetAngle,
      envRef.current.moonAltitude,
      envRef.current.sunSize,
      envRef.current.sunLightIntensity,
      envRef.current.ambientLightIntensity,
      envRef.current.globalFogDensity
    );

    const ambientLight = new THREE.AmbientLight(0xffffff, initialEnv.ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(new THREE.Color(initialEnv.sunColor), initialEnv.sunIntensity);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Token Group Container
    const tokenGroup = new THREE.Group();
    scene.add(tokenGroup);
    tokenGroupRef.current = tokenGroup;

    // Token Auras 3D System
    auraSysRef.current = new AuraSystem3D(scene);

    // Attack Targeting Hover Ring (hidden by default)
    const hoverRingGeo = new THREE.RingGeometry(1.1, 1.4, 48);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, // amber-400
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const hoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    hoverRing.rotation.x = -Math.PI / 2;
    hoverRing.position.y = 0.05;
    hoverRing.name = 'attackHoverRing';
    scene.add(hoverRing);
    hoverRingRef.current = hoverRing;

    // 3D Drag & Drop Hologram Ghost Indicator
    const dragGhostGroup = new THREE.Group();
    dragGhostGroup.name = 'dragGhostGroup';
    dragGhostGroup.visible = false;

    // Glowing footprint plane
    const ghostPlaneGeo = new THREE.PlaneGeometry(2.0, 2.0);
    const ghostPlaneMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ghostPlane = new THREE.Mesh(ghostPlaneGeo, ghostPlaneMat);
    ghostPlane.rotation.x = -Math.PI / 2;
    ghostPlane.position.y = 0.05;
    dragGhostGroup.add(ghostPlane);

    // Glowing wireframe box
    const ghostBoxGeo = new THREE.BoxGeometry(2.0, 1.2, 2.0);
    const ghostWireMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const ghostBox = new THREE.Mesh(ghostBoxGeo, ghostWireMat);
    ghostBox.position.y = 0.6;
    dragGhostGroup.add(ghostBox);

    scene.add(dragGhostGroup);
    dragGhostRef.current = dragGhostGroup;

    // Skysphere Dome
    const skyDome = createBattleSkyDome(scene);
    skyDomeRef.current = skyDome;

    const {
      timeOfDayHour: h,
      timeOfDayPreset: p,
      isIndoor: ind,
      hasFog: f,
      hasRain: r,
      cloudDensity: cd,
      moonSize: ms,
      moonLuminosity: ml,
      moonOffsetAngle: ma,
      moonAltitude: malt,
      sunSize: ss,
      skyTurbidity: st,
      skyRayleigh: sr,
      mieCoefficient: mc,
      mieDirectionalG: mg,
    } = envRef.current;

    skyDome.update(h, p, f, r, ms, ml, ma, malt, ss, st, sr, mc, mg, ind);

    // Stylized Cloud System
    const cloudSystem = createCloudSystem(scene);
    cloudSystemRef.current = cloudSystem;
    cloudSystem.update(0.016, p, cd, h);

    // Immediately sync tokens upon scene creation
    syncTokens();

    // Raycasting & 3D Drag-and-Drop Handlers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current || !tokenGroupRef.current || !interactive) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Clique com o botão do meio (scroll do mouse - button === 1): reservado exclusivamente para PAN do grid
      if (event.button === 1) {
        event.preventDefault();
        return;
      }

      // Clique com o botão direito (button === 2) cancela a mira do ataque
      if (event.button === 2 && callbacksRef.current.pendingAttack) {
        callbacksRef.current.setPendingAttack(null);
        callbacksRef.current.setSplineBadgeInfo(null);
        if (splineSystemRef.current) splineSystemRef.current.clear();
        toast.info('Mira de ataque cancelada.');
        return;
      }

      // Verificação de clique em Sinalizador 3D existente para remoção
      if (pingGroupRef.current) {
        const pingIntersects = raycaster.intersectObjects(pingGroupRef.current.children, true);
        if (pingIntersects.length > 0) {
          let obj: THREE.Object3D | null = pingIntersects[0].object;
          while (obj && !obj.name.startsWith('ping-')) {
            obj = obj.parent;
          }
          if (obj) {
            const pId = obj.name.replace('ping-', '');
            event.preventDefault();
            event.stopPropagation();
            removePing(pId);
            return;
          }
        }
      }

      // Sinalizador 3D (Ctrl + Clique) fixo e alinhado à grade
      if (event.ctrlKey) {
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          event.preventDefault();
          event.stopPropagation();

          const rawWx = planeIntersectPoint.current.x;
          const rawWz = planeIntersectPoint.current.z;

          // Alinha perfeitamente ao centro do quadrado da grade (Snap to Grid)
          const snappedX = Math.floor(rawWx / 2) * 2 + 1;
          const snappedZ = Math.floor(rawWz / 2) * 2 + 1;

          const senderName = userRole === 'dm' ? 'Mestre' : (activeCampaign?.characterName || 'Jogador');
          const color = userRole === 'dm' ? '#f59e0b' : '#38bdf8';
          const pingId = `ping-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

          broadcastPingLocation({
            id: pingId,
            x: ((event.clientX - rect.left) / rect.width) * 100,
            y: ((event.clientY - rect.top) / rect.height) * 100,
            worldX: snappedX,
            worldZ: snappedZ,
            context: 'battle3d',
            senderName,
            color,
          });
        }
        return;
      }

      // 0. Clique no modo Terreno: Pintar Superfície 3D (BG3)
      if (event.button === 0 && forgeRef.current.buildMode === 'terrain') {
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          event.preventDefault();
          event.stopPropagation();
          isPaintingTerrainRef.current = true;
          controls.enabled = false;
          paintTerrainAtPoint(planeIntersectPoint.current, false);
          return;
        }
      }

      // 1. Clique no modo de Construção: Posicionar Bloco
      if (event.button === 0 && forgeRef.current.buildMode === 'place' && forgeRef.current.activeBlockType) {
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          event.preventDefault();
          event.stopPropagation();
          const pt = planeIntersectPoint.current;
          const snap = worldPosToGridCell(pt.x, pt.z, forgeRef.current.gridConfig.widthCells, forgeRef.current.gridConfig.heightCells);
          const newBlock = createDefaultBuildingBlock(
            forgeRef.current.activeBlockType,
            snap.snappedX,
            snap.snappedZ,
            forgeRef.current.blockRotation
          );
          setBuildingBlocks((prev) => [...prev.filter((b) => !(Math.abs(b.x - snap.snappedX) < 0.1 && Math.abs(b.z - snap.snappedZ) < 0.1)), newBlock]);
          setSelectedBlockId(newBlock.id);
          toast.success('Bloco adicionado ao cenário!');
          return;
        }
      }

      // 2. Clique no modo Borracha: Deletar Bloco ou Apagar Terreno
      if (event.button === 0 && forgeRef.current.buildMode === 'delete') {
        let deletedBlock = false;
        if (blocksGroupRef.current) {
          const hits = raycaster.intersectObjects(blocksGroupRef.current.children, true);
          if (hits.length > 0) {
            let obj: THREE.Object3D | null = hits[0].object;
            while (obj && !obj.name.startsWith('block-')) {
              obj = obj.parent;
            }
            if (obj && obj.userData.blockId) {
              event.preventDefault();
              event.stopPropagation();
              const bId = obj.userData.blockId;
              setBuildingBlocks((prev) => prev.filter((b) => b.id !== bId));
              if (selectedBlockId === bId) setSelectedBlockId(null);
              toast.info('Bloco removido.');
              deletedBlock = true;
              return;
            }
          }
        }
        if (!deletedBlock && raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          event.preventDefault();
          event.stopPropagation();
          isPaintingTerrainRef.current = true;
          controls.enabled = false;
          paintTerrainAtPoint(planeIntersectPoint.current, true);
          return;
        }
      }

      // 3. Clique no modo Magia: Posicionar Template de Magia 3D + Reações Elementais BG3
      if (event.button === 0 && forgeRef.current.buildMode === 'spell' && forgeRef.current.activeSpellTemplate) {
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          event.preventDefault();
          event.stopPropagation();
          const pt = planeIntersectPoint.current;
          const tpl = forgeRef.current.activeSpellTemplate;
          setActiveSpellTemplate((prev) => prev ? { ...prev, x: pt.x, z: pt.z } : null);
          toast.success('Área de magia posicionada!');

          // Detectar elemento e disparar reações em cadeia BG3
          const spellName = (tpl.name || '').toLowerCase();
          const isFire = spellName.includes('fogo') || spellName.includes('flame') || spellName.includes('fire') || tpl.color === '#ef4444' || tpl.color === '#f97316';
          const isCold = spellName.includes('gelo') || spellName.includes('frio') || spellName.includes('frost') || spellName.includes('ice') || tpl.color === '#38bdf8';
          const element = isFire ? 'fire' : isCold ? 'cold' : null;

          if (element) {
            const radiusUnits = (tpl.radiusFeet / 5) * 2.0;
            setTerrainSurfaces((prev) => {
              let reactionMsg = '';
              const updated = prev.map((cell) => {
                const dist = Math.sqrt((cell.x - pt.x) ** 2 + (cell.z - pt.z) ** 2);
                if (dist <= radiusUnits) {
                  const reaction = evaluateSurfaceReaction(cell.type, element);
                  if (reaction) {
                    reactionMsg = reaction.triggeredEventText || '';
                    return { ...cell, type: reaction.nextType };
                  }
                }
                return cell;
              });
              if (reactionMsg) {
                toast.warning(reactionMsg);
              }
              return updated;
            });
          }

          setBuildMode('idle');
          return;
        }
      }

      // 4. Clique em Gizmo ou Bloco no modo normal para Arrastar/Girar/Esticar/Configurar
      if (event.button === 0 && blocksGroupRef.current) {
        const hits = raycaster.intersectObjects(blocksGroupRef.current.children, true);
        if (hits.length > 0) {
          if (!forgeRef.current.isAssetsLocked) {
            // 4.1 Checar se QUALQUER objeto atingido pelo raio é um handle do Gizmo
            const gizmoHit = hits.find((h) => {
              let o: THREE.Object3D | null = h.object;
              while (o && !o.userData?.isGizmoHandle && o.parent) o = o.parent;
              return o?.userData?.isGizmoHandle;
            });

            if (gizmoHit) {
              let gizmoObj: THREE.Object3D | null = gizmoHit.object;
              while (gizmoObj && !gizmoObj.userData?.isGizmoHandle && gizmoObj.parent) gizmoObj = gizmoObj.parent;
              if (gizmoObj?.userData?.isGizmoHandle) {
                event.preventDefault();
                event.stopPropagation();
                const hType = gizmoObj.userData.handleType as 'rotate' | 'stretch';
                const bId = gizmoObj.userData.blockId;
                const targetBlock = forgeRef.current.buildingBlocks.find((b) => b.id === bId);
                if (targetBlock) {
                  controls.enabled = false;
                  activeBlockDragRef.current = {
                    blockId: bId,
                    mode: hType,
                    startPoint: gizmoHit.point.clone(),
                    startRotation: targetBlock.rotationDeg || 0,
                    startSegments: targetBlock.segmentsCount || 1,
                    startPos: { x: targetBlock.x, z: targetBlock.z },
                  };
                  return;
                }
              }
            }

            // 4.2 Checar se QUALQUER objeto atingido é o corpo de um bloco de construção
            const blockHit = hits.find((h) => {
              let o: THREE.Object3D | null = h.object;
              while (o && !o.name.startsWith('block-') && o.parent) o = o.parent;
              return o?.userData?.blockId;
            });

            if (blockHit) {
              let obj: THREE.Object3D | null = blockHit.object;
              while (obj && !obj.name.startsWith('block-') && obj.parent) obj = obj.parent;
              if (obj?.userData?.blockId) {
                event.preventDefault();
                event.stopPropagation();
                const bId = obj.userData.blockId;
                const targetBlock = forgeRef.current.buildingBlocks.find((b) => b.id === bId);
                setSelectedBlockId(bId);

                // Interação Direta com Portas e Portais Medievais
                if (targetBlock && (targetBlock.type.startsWith('door_') || targetBlock.type === 'portcullis_iron')) {
                  const nextState = targetBlock.state === 'open' ? 'closed' : 'open';
                  setBuildingBlocks((prev) =>
                    prev.map((b) => (b.id === bId ? { ...b, state: nextState } : b))
                  );
                  toast.info(`🚪 ${targetBlock.type === 'portcullis_iron' ? 'Grade Levadiça' : 'Porta'} ${nextState === 'open' ? 'aberta' : 'fechada'}!`);
                  return;
                }

                // 2 Cliques rápidos no asset abrem o modal de configurações
                if (event.detail >= 2) {
                  setIsInspectorModalOpen(true);
                  toast.info(`⚙️ Configurações de ${targetBlock?.type || 'Asset'}`);
                  return;
                }

                // 1 Clique: Inicia arrasto direto para mover no grid (Snap)
                if (targetBlock) {
                  controls.enabled = false;
                  activeBlockDragRef.current = {
                    blockId: bId,
                    mode: 'move',
                    startPoint: blockHit.point.clone(),
                    startRotation: targetBlock.rotationDeg || 0,
                    startSegments: targetBlock.segmentsCount || 1,
                    startPos: { x: targetBlock.x, z: targetBlock.z },
                  };
                }
                return;
              }
            }
          } else {
            // Se estiver TRAVADO, ainda permite abrir/fechar portas interativas com clique sem mover o asset
            const blockHit = hits.find((h) => {
              let o: THREE.Object3D | null = h.object;
              while (o && !o.name.startsWith('block-') && o.parent) o = o.parent;
              return o?.userData?.blockId;
            });

            if (blockHit) {
              let obj: THREE.Object3D | null = blockHit.object;
              while (obj && !obj.name.startsWith('block-') && obj.parent) obj = obj.parent;
              if (obj?.userData?.blockId) {
                const bId = obj.userData.blockId;
                const targetBlock = forgeRef.current.buildingBlocks.find((b) => b.id === bId);
                if (targetBlock && (targetBlock.type.startsWith('door_') || targetBlock.type === 'portcullis_iron')) {
                  event.preventDefault();
                  event.stopPropagation();
                  const nextState = targetBlock.state === 'open' ? 'closed' : 'open';
                  setBuildingBlocks((prev) =>
                    prev.map((b) => (b.id === bId ? { ...b, state: nextState } : b))
                  );
                  toast.info(`🚪 ${targetBlock.type === 'portcullis_iron' ? 'Grade Levadiça' : 'Porta'} ${nextState === 'open' ? 'aberta' : 'fechada'}!`);
                  return;
                }
              }
            }
          }
        } else if (!event.ctrlKey) {
          // Clicou no chão vazio -> deseleciona o bloco
          if (forgeRef.current.selectedBlockId) {
            setSelectedBlockId(null);
            setIsInspectorModalOpen(false);
          }
        }
      }

      // Se a mira de magia estiver ativa, confirma a conjuração
      if (activeSpellTargetingRef.current && casterTokenKeyRef.current) {
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          event.preventDefault();
          event.stopPropagation();

          // Raycast para verificar se um token específico foi clicado
          let clickedCombatantId: string | null = null;
          if (tokenGroupRef.current) {
            const tokenIntersects = raycaster.intersectObjects(tokenGroupRef.current.children, true);
            if (tokenIntersects.length > 0) {
              let obj: THREE.Object3D | null = tokenIntersects[0].object;
              while (obj && !obj.name.startsWith('token-')) {
                obj = obj.parent;
              }
              if (obj) {
                const key = obj.name.replace('token-', '');
                const found = callbacksRef.current.combatants.find(
                  (c) => (c.id || c.name) === key || c.id === key || c.name === key
                );
                if (found) clickedCombatantId = found.id;
              }
            }
          }

          // Para magias AoE, calcula todos os combatentes dentro da área
          const aoeShape = activeSpellTargetingRef.current.shape;
          let targetedCombatantIds: string[] = [];
          if (['circle', 'cone', 'line', 'fan'].includes(aoeShape)) {
            targetedCombatantIds = callbacksRef.current.combatants
              .filter((c) => isCombatantInSpellArea(c, getCombatantPos(c.id || c.name)))
              .map((c) => c.id);
          } else if (clickedCombatantId) {
            targetedCombatantIds = [clickedCombatantId];
          }

          const customEvt = new CustomEvent('masters_codex_confirm_spell_cast', {
            detail: {
              casterTokenKey: casterTokenKeyRef.current,
              spell: activeSpellTargetingRef.current,
              targetPosition: { x: planeIntersectPoint.current.x, z: planeIntersectPoint.current.z },
              targetCombatantId: clickedCombatantId,
              targetedCombatantIds,
            },
          });
          window.dispatchEvent(customEvt);
        }
        return;
      }

      const intersects = raycaster.intersectObjects(tokenGroupRef.current.children, true);

      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.name.startsWith('token-')) {
          obj = obj.parent;
        }
        if (obj) {
          const targetKey = obj.name.replace('token-', '');
          const {
            combatants: activeCombatants,
            currentTurnIndex: turnIdx,
            setSelectedCombatantId: setSel,
            onSelectCombatant: onSelC,
            onSelectTarget: onSelT,
            canUserControlCombatant: canControl,
            getCombatantPos: getPos
          } = callbacksRef.current;

          const clicked = activeCombatants.find((c) => (c.id || c.name) === targetKey);
          if (clicked) {
            setSel(targetKey);
            if (onSelC) onSelC(clicked);

            if (canControl(clicked)) {
              isDraggingRef.current = true;
              draggedTokenKeyRef.current = targetKey;
              controls.enabled = false; // Desativa a rotação da câmera durante o arrasto do token
              
              // Inicializa o rastro (trail) e posição base com snap preciso na grade
              const cPos = getPos(targetKey);
              const cfg = forgeRef.current.gridConfig || DEFAULT_GRID_CONFIG_3D;
              const snap = worldPosToGridCell(cPos.x, cPos.z, cfg.widthCells || 20, cfg.heightCells || 20);
              const startSnapX = snap.snappedX;
              const startSnapZ = snap.snappedZ;

              dragStartPosRef.current = { x: startSnapX, z: startSnapZ };
              dragTrailRef.current = [{ x: startSnapX, z: startSnapZ }];
              lastDragSnapRef.current = { x: startSnapX, z: startSnapZ };

              const currentActor = activeCombatants[turnIdx];
              if (callbacksRef.current.isBattleStarted && currentActor && clicked.id !== currentActor.id) {
                const { pendingAttack: currentPending, targetIdState: currentTargetId, propOnAttackTarget: attackCb } = callbacksRef.current;
                if (currentTargetId === clicked.id) {
                  isDraggingRef.current = false;
                  draggedTokenKeyRef.current = null;
                  controls.enabled = true;
                  setTargetIdState(undefined);
                  if (onSelT) onSelT(undefined);
                } else if (currentPending) {
                  const attackerPos2D = getPos(currentActor.id || currentActor.name);
                  const targetPos2D = getPos(clicked.id || clicked.name);
                  const distFt = calculateGridDistanceFeet(attackerPos2D, targetPos2D);
                  const rInfo = currentPending.rangeInfo || parseRangeString(currentPending.rangeText || currentPending.actionDesc || currentPending.title, currentPending.title);
                  const rStatus = evaluateRangeStatus(distFt, rInfo);

                  if (rStatus === 'OUT_OF_RANGE') {
                    toast.warning(`Alvo fora do alcance máximo! (${(distFt * 0.3).toFixed(1)}m / ${rInfo.maxRangeM}m)`);
                    isDraggingRef.current = false;
                    draggedTokenKeyRef.current = null;
                    controls.enabled = true;
                    return;
                  }

                  if (rStatus === 'LONG_RANGE') {
                    toast.info(`Disparo em Alcance Longo (${(distFt * 0.3).toFixed(1)}m) — Ataque com Desvantagem!`);
                  }

                  if (splineSystemRef.current) {
                    splineSystemRef.current.update({
                      attackerPos: { x: attackerPos2D.x, y: 0.5, z: attackerPos2D.z },
                      targetPos: { x: targetPos2D.x, y: 0.5, z: targetPos2D.z },
                      status: rStatus,
                      distanceFt: distFt,
                      animationPhase: 'firing',
                      onAnimationComplete: () => {
                        if (splineSystemRef.current) {
                          splineSystemRef.current.update({
                            attackerPos: { x: attackerPos2D.x, y: 0.5, z: attackerPos2D.z },
                            targetPos: { x: targetPos2D.x, y: 0.5, z: targetPos2D.z },
                            status: rStatus,
                            distanceFt: distFt,
                            animationPhase: 'fading',
                            onAnimationComplete: () => {
                              callbacksRef.current.setSplineBadgeInfo(null);
                            }
                          });
                        }
                      }
                    });
                  }

                  isDraggingRef.current = false;
                  draggedTokenKeyRef.current = null;
                  controls.enabled = true;
                  setTargetIdState(clicked.id);
                  if (onSelT) onSelT(clicked);
                  if (attackCb) attackCb(clicked);
                }
              }
            } else {
              const { pendingAttack: currentPending, targetIdState: currentTargetId, propOnAttackTarget: attackCb, isBattleStarted: battleStarted } = callbacksRef.current;
              if (currentTargetId === clicked.id) {
                isDraggingRef.current = false;
                draggedTokenKeyRef.current = null;
                controls.enabled = true;
                setTargetIdState(undefined);
                if (onSelT) onSelT(undefined);
              } else if (battleStarted && currentPending) {
                const currentActor = activeCombatants[turnIdx];
                if (currentActor) {
                  const attackerPos2D = getPos(currentActor.id || currentActor.name);
                  const targetPos2D = getPos(clicked.id || clicked.name);
                  const distFt = calculateGridDistanceFeet(attackerPos2D, targetPos2D);
                  const rInfo = currentPending.rangeInfo || parseRangeString(currentPending.rangeText || currentPending.actionDesc || currentPending.title, currentPending.title);
                  const rStatus = evaluateRangeStatus(distFt, rInfo);

                  if (rStatus === 'OUT_OF_RANGE') {
                    toast.warning(`Alvo fora do alcance máximo! (${(distFt * 0.3).toFixed(1)}m / ${rInfo.maxRangeM}m)`);
                    isDraggingRef.current = false;
                    draggedTokenKeyRef.current = null;
                    controls.enabled = true;
                    return;
                  }

                  if (rStatus === 'LONG_RANGE') {
                    toast.info(`Disparo em Alcance Longo (${(distFt * 0.3).toFixed(1)}m) — Ataque com Desvantagem!`);
                  }

                  if (splineSystemRef.current) {
                    splineSystemRef.current.update({
                      attackerPos: { x: attackerPos2D.x, y: 0.5, z: attackerPos2D.z },
                      targetPos: { x: targetPos2D.x, y: 0.5, z: targetPos2D.z },
                      status: rStatus,
                      distanceFt: distFt,
                      animationPhase: 'firing',
                      onAnimationComplete: () => {
                        if (splineSystemRef.current) {
                          splineSystemRef.current.update({
                            attackerPos: { x: attackerPos2D.x, y: 0.5, z: attackerPos2D.z },
                            targetPos: { x: targetPos2D.x, y: 0.5, z: targetPos2D.z },
                            status: rStatus,
                            distanceFt: distFt,
                            animationPhase: 'fading',
                            onAnimationComplete: () => {
                              callbacksRef.current.setSplineBadgeInfo(null);
                            }
                          });
                        }
                      }
                    });
                  }
                }

                isDraggingRef.current = false;
                draggedTokenKeyRef.current = null;
                controls.enabled = true;
                setTargetIdState(clicked.id);
                if (onSelT) onSelT(clicked);
                if (attackCb) attackCb(clicked);
              }
            }
          }
        }
      } else {
        // Clique no chão vazio desmarca o alvo e a seleção atual
        const { setSelectedCombatantId: setSel, onSelectTarget: onSelT } = callbacksRef.current;
        setSel(null);
        setTargetIdState(undefined);
        if (onSelT) onSelT(undefined);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Update HTML Tooltip position via direct DOM styles for 60fps performance
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${mouseX + 15}px`;
        tooltipRef.current.style.top = `${mouseY + 15}px`;
      }

      // 0. Dragging Building Block with Interactive 3D Gizmo (Move, Rotate or Stretch)
      if (activeBlockDragRef.current) {
        const drag = activeBlockDragRef.current;
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          const pt = planeIntersectPoint.current;
          const currentBlock = forgeRef.current.buildingBlocks.find((b) => b.id === drag.blockId);
          if (currentBlock) {
            if (drag.mode === 'move') {
              const snap = worldPosToGridCell(pt.x, pt.z, forgeRef.current.gridConfig.widthCells, forgeRef.current.gridConfig.heightCells);
              if (currentBlock.x !== snap.snappedX || currentBlock.z !== snap.snappedZ) {
                setBuildingBlocks((prev) =>
                  prev.map((b) => (b.id === drag.blockId ? { ...b, x: snap.snappedX, z: snap.snappedZ } : b))
                );
              }
            } else if (drag.mode === 'rotate') {
              const angleRad = Math.atan2(pt.x - currentBlock.x, pt.z - currentBlock.z);
              const angleDeg = Math.round(((angleRad * 180) / Math.PI + 360) % 360);
              const snapAngle = Math.round(angleDeg / 15) * 15;
              if (currentBlock.rotationDeg !== snapAngle) {
                setBuildingBlocks((prev) =>
                  prev.map((b) => (b.id === drag.blockId ? { ...b, rotationDeg: snapAngle } : b))
                );
              }
            } else if (drag.mode === 'stretch') {
              const dx = pt.x - currentBlock.x;
              const dz = pt.z - currentBlock.z;
              const rad = ((currentBlock.rotationDeg || 0) * Math.PI) / 180;
              const localDist = dx * Math.cos(rad) - dz * Math.sin(rad);
              const newSegs = Math.max(1, Math.min(8, Math.round((Math.abs(localDist) * 2) / 2.0)));
              if (currentBlock.segmentsCount !== newSegs) {
                setBuildingBlocks((prev) =>
                  prev.map((b) => (b.id === drag.blockId ? { ...b, segmentsCount: newSegs } : b))
                );
              }
            }
          }
        }
        return;
      }

      // 1. Raycast to find if we are hovering over any token (for the general tooltip)
      let hoveredTokenId: string | undefined = undefined;

      if (tokenGroupRef.current && !isDraggingRef.current) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(tokenGroupRef.current.children, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.name.startsWith('token-')) obj = obj.parent;
          if (obj) {
            const hKey = obj.name.replace('token-', '');
            const hCombatant = callbacksRef.current.combatants.find(
              (c) => (c.id || c.name) === hKey || c.id === hKey
            );
            if (hCombatant) {
              hoveredTokenId = hCombatant.id;
            }
          }
        }
      }

      setHoveredCombatantId((prev) => (prev === hoveredTokenId ? prev : hoveredTokenId));

      // Mira de Magia: atualiza posição da mira com o cursor
      if (activeSpellTargetingRef.current && casterTokenKeyRef.current) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          let nextX = planeIntersectPoint.current.x;
          let nextZ = planeIntersectPoint.current.z;

          if (activeSpellTargetingRef.current.shape === 'circle') {
            nextX = Math.floor(planeIntersectPoint.current.x / 2) * 2 + 1;
            nextZ = Math.floor(planeIntersectPoint.current.z / 2) * 2 + 1;
          }

          const currentPos = spellTargetPositionRef.current || { x: 9999, z: 9999 };
          const dist = Math.sqrt((nextX - currentPos.x) ** 2 + (nextZ - currentPos.z) ** 2);
          if (dist > 0.3) {
            const nextPos = { x: nextX, z: nextZ };
            spellTargetPositionRef.current = nextPos;
            setSpellTargetPosition(nextPos);
          }
        }
        return;
      }

      // Attack targeting mode: show hover ring over hovered token + Ranged Spline Arc
      if (callbacksRef.current.pendingAttack && tokenGroupRef.current && hoverRingRef.current) {
        const ring = hoverRingRef.current;
        if (hoveredTokenId) {
          const hCombatant = callbacksRef.current.combatants.find((c) => c.id === hoveredTokenId);
          // Only highlight enemies (not the active combatant)
          const activeCombatant = callbacksRef.current.combatants[callbacksRef.current.currentTurnIndex];
          const activeId = activeCombatant?.id;

          if (hCombatant && activeCombatant && hCombatant.id !== activeId) {
            const pos = callbacksRef.current.getCombatantPos(hCombatant.id || hCombatant.name);
            ring.position.x = pos.x;
            ring.position.z = pos.z;
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.75;
            callbacksRef.current.setHoveredTargetId((prev: any) => (prev === hCombatant.id ? prev : hCombatant.id));

            // Trajetória Spline Curva (BG3 Style)
            const attackerPos2D = callbacksRef.current.getCombatantPos(activeId || activeCombatant.name);
            const targetPos2D = pos;
            const distFt = calculateGridDistanceFeet(attackerPos2D, targetPos2D);
            const pendingAtk = callbacksRef.current.pendingAttack;
            const rInfo = pendingAtk.rangeInfo || parseRangeString(pendingAtk.rangeText || pendingAtk.actionDesc || pendingAtk.title, pendingAtk.title);
            const rStatus = evaluateRangeStatus(distFt, rInfo);

            if (splineSystemRef.current) {
              splineSystemRef.current.update({
                attackerPos: { x: attackerPos2D.x, y: 0.5, z: attackerPos2D.z },
                targetPos: { x: targetPos2D.x, y: 0.5, z: targetPos2D.z },
                status: rStatus,
                distanceFt: distFt,
                animationPhase: 'aiming',
              });
            }

            callbacksRef.current.setSplineBadgeInfo((prev: any) => {
              if (prev && prev.distanceFt === distFt && prev.status === rStatus) return prev;
              return {
                distanceFt: distFt,
                status: rStatus,
                normalRangeM: rInfo.normalRangeM,
                maxRangeM: rInfo.maxRangeM,
                isWeaponWithLongRange: rInfo.isWeaponWithLongRange,
                isRanged: rInfo.isRanged,
              };
            });
          } else {
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.0;
            callbacksRef.current.setHoveredTargetId((prev: any) => (prev === undefined ? prev : undefined));
            if (splineSystemRef.current) splineSystemRef.current.clear();
            callbacksRef.current.setSplineBadgeInfo((prev: any) => (prev === null ? prev : null));
          }
        } else {
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.0;
          callbacksRef.current.setHoveredTargetId((prev: any) => (prev === undefined ? prev : undefined));
          if (splineSystemRef.current) splineSystemRef.current.clear();
          callbacksRef.current.setSplineBadgeInfo((prev: any) => (prev === null ? prev : null));
        }
      } else if (hoverRingRef.current) {
        // Not in attack mode: ensure ring is hidden
        (hoverRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.0;
        if (splineSystemRef.current) splineSystemRef.current.clear();
        callbacksRef.current.setSplineBadgeInfo((prev: any) => (prev === null ? prev : null));
      }

      // Pintura arrastada contínua de terreno
      if (isPaintingTerrainRef.current && (forgeRef.current.buildMode === 'terrain' || forgeRef.current.buildMode === 'delete')) {
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
          paintTerrainAtPoint(planeIntersectPoint.current, forgeRef.current.buildMode === 'delete');
        }
        return;
      }

      if (!isDraggingRef.current || !draggedTokenKeyRef.current) return;

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
        const key = draggedTokenKeyRef.current;
        const cfg = forgeRef.current.gridConfig || DEFAULT_GRID_CONFIG_3D;
        const snap = worldPosToGridCell(
          planeIntersectPoint.current.x,
          planeIntersectPoint.current.z,
          cfg.widthCells || 20,
          cfg.heightCells || 20
        );
        const snappedX = snap.snappedX;
        const snappedZ = snap.snappedZ;

        // Ignora se a célula snapped sob o cursor não mudou (evita recálculos redundantes)
        if (lastDragSnapRef.current?.x === snappedX && lastDragSnapRef.current?.z === snappedZ) return;
        lastDragSnapRef.current = { x: snappedX, z: snappedZ };

        const { combatants: activeCombatants, currentTurnIndex: turnIdx } = callbacksRef.current;
        const activeC = activeCombatants[turnIdx];
        const targetC = activeCombatants.find((c) => c.id === key || c.name === key || (c.id || c.name) === key) || activeC;

        const startPt = dragStartPosRef.current;
        const fullPath = generateDirectGridPath(startPt, { x: snappedX, z: snappedZ });

        if (targetC && !isPlacementPhase && callbacksRef.current.isBattleStarted) {
          const speedVal = getSpeedInMeters(targetC.speed || targetC.notes) * (targetC.hasDashed ? 2 : 1);
          const remainingMovementTotal = Math.max(0, speedVal - (targetC.movementUsed || 0));

          // Limita o trajeto passo-a-passo até o alcance máximo permitido pelo orçamento de movimento restante
          let validPath = [fullPath[0]];
          for (let i = 1; i < fullPath.length; i++) {
            const candidate = fullPath.slice(0, i + 1);
            const cost = calculateTrailTerrainCost(candidate, surfacesMapRef.current);
            if (cost.totalCostMeters <= remainingMovementTotal + 0.05) {
              validPath = candidate;
            } else {
              break;
            }
          }

          dragTrailRef.current = validPath;
          const currentHead = validPath[validPath.length - 1];

          // Move a malha Three.js diretamente no palco sem disparar re-render de estado por pixel
          const group = tokenMeshMapRef.current.get(key);
          if (group) {
            group.position.x = currentHead.x;
            group.position.z = currentHead.z;
          }

          // Atualiza a visualização do rastro tático e régua de passos
          callbacksRef.current.renderDragTrail(validPath);

          // Redução dinâmica do highlight de alcance restante
          const costInfo = calculateTrailTerrainCost(validPath, surfacesMapRef.current);
          const remainingMeters = Math.max(0, remainingMovementTotal - costInfo.totalCostMeters);
          callbacksRef.current.renderMovementHighlights(
            currentHead.x,
            currentHead.z,
            remainingMeters,
            startPt.x,
            startPt.z,
            remainingMovementTotal
          );
          return;
        }

        // Modo não combate / Fase de posicionamento / Mestre: movimento livre sem restrição de orçamento
        dragTrailRef.current = fullPath;
        const currentHead = fullPath[fullPath.length - 1];

        const group = tokenMeshMapRef.current.get(key);
        if (group) {
          group.position.x = currentHead.x;
          group.position.z = currentHead.z;
        }
      }
    };

    const handlePointerUp = () => {
      if (isPaintingTerrainRef.current) {
        isPaintingTerrainRef.current = false;
        controls.enabled = true;
      }

      if (isDraggingRef.current) {
        const key = draggedTokenKeyRef.current;
        if (key) {
          const group = tokenMeshMapRef.current.get(key);
          const startPt = dragStartPosRef.current;
          const currentHead = dragTrailRef.current.length > 0
            ? dragTrailRef.current[dragTrailRef.current.length - 1]
            : (group ? { x: group.position.x, z: group.position.z } : startPt);

          const snappedX = currentHead.x;
          const snappedZ = currentHead.z;

          if (group) {
            group.position.x = snappedX;
            group.position.z = snappedZ;
          }

          // Consolida a posição final no estado local e context
          callbacksRef.current.setLocalPositions((prev) => ({
            ...prev,
            [key]: { x: snappedX, z: snappedZ },
          }));
          callbacksRef.current.updateTokenPosition3D(key, undefined, undefined, snappedX, snappedZ);

          const { combatants: activeCombatants, isBattleStarted: battleStarted } = callbacksRef.current;
          const targetC = activeCombatants.find((c) => c.id === key || c.name === key || (c.id || c.name) === key);
          if (targetC) {
            if (isPlacementPhase || !battleStarted) {
              // Posicionamento / Fora de combate: atualiza posição sem debitar deslocamento
              const nextCombatants = activeCombatants.map((c) => {
                if (c.id === targetC.id) {
                  return { ...c, x: snappedX, z: snappedZ };
                }
                return c;
              });

              if (callbacksRef.current.onUpdateCombatants) {
                callbacksRef.current.onUpdateCombatants(nextCombatants);
              }
            } else {
              // Fase de combate: calcula o custo exato do deslocamento realizado
              const costInfo = calculateTrailTerrainCost(dragTrailRef.current, surfacesMapRef.current);
              const trailCostMeters = costInfo.totalCostMeters;

              let nextCombatants = activeCombatants.map((c) => {
                if (c.id === targetC.id) {
                  return {
                    ...c,
                    x: snappedX,
                    z: snappedZ,
                    movementUsed: (c.movementUsed || 0) + trailCostMeters,
                  };
                }
                return c;
              });

              // Resolução automática de perigos de terreno (Gelo, Óleo, Fogo, Ácido, Teias)
              const endSnapKey = `${Math.round(snappedX)}_${Math.round(snappedZ)}`;
              const surfaceType = surfacesMapRef.current.get(endSnapKey);
              if (surfaceType && surfaceType !== 'normal') {
                const def = TERRAIN_SURFACE_CATALOG[surfaceType];
                if (def.isHazard) {
                  if (def.requiresSave && def.saveAbility === 'dex') {
                    const d20 = Math.floor(Math.random() * 20) + 1;
                    const dexMod = targetC.dex ? Math.floor((targetC.dex - 10) / 2) : 0;
                    const totalSave = d20 + dexMod;
                    const dc = def.saveDC || 10;
                    if (totalSave < dc) {
                      const existingConditions = targetC.conditions || [];
                      const hasProne = existingConditions.some((c) => String(c).toLowerCase().includes('caído') || String(c).toLowerCase().includes('prone'));
                      if (!hasProne) {
                        const newConditions = [...existingConditions, 'Caído' as ConditionType];
                        nextCombatants = nextCombatants.map((c) => (c.id === targetC.id ? { ...c, conditions: newConditions } : c));
                      }
                      toast.error(`❄️ ${targetC.name} escorregou em ${def.label} e caiu Caído (Prone)! (Teste de DES: ${totalSave} vs CD ${dc})`);
                    } else {
                      toast.success(`🛡️ ${targetC.name} manteve o equilíbrio em ${def.label}! (Teste de DES: ${totalSave} vs CD ${dc})`);
                    }
                  } else if (def.requiresSave && def.saveAbility === 'str') {
                    const d20 = Math.floor(Math.random() * 20) + 1;
                    const strMod = targetC.str ? Math.floor((targetC.str - 10) / 2) : 0;
                    const totalSave = d20 + strMod;
                    const dc = def.saveDC || 12;
                    if (totalSave < dc) {
                      const existingConditions = targetC.conditions || [];
                      const hasRestrained = existingConditions.some((c) => String(c).toLowerCase().includes('restrito') || String(c).toLowerCase().includes('contido') || String(c).toLowerCase().includes('restrained'));
                      if (!hasRestrained) {
                        const newConditions = [...existingConditions, 'Restrito' as ConditionType];
                        nextCombatants = nextCombatants.map((c) => (c.id === targetC.id ? { ...c, conditions: newConditions } : c));
                      }
                      toast.error(`🕸️ ${targetC.name} ficou Restrito em ${def.label}! (Teste de FOR: ${totalSave} vs CD ${dc})`);
                    } else {
                      toast.success(`💪 ${targetC.name} escapou de ${def.label}! (Teste de FOR: ${totalSave} vs CD ${dc})`);
                    }
                  } else if (def.hazardDamageDice) {
                    const dmg = def.hazardDamageDice === '2d4' 
                      ? (Math.floor(Math.random() * 4) + 1 + Math.floor(Math.random() * 4) + 1)
                      : (Math.floor(Math.random() * 4) + 1);
                    toast.warning(`⚠️ ${targetC.name} pisou em ${def.label} e sofreu ${dmg} de dano de ${def.hazardDamageType || 'superfície'}!`);
                  }
                }
              }

              if (callbacksRef.current.onUpdateCombatants) {
                callbacksRef.current.onUpdateCombatants(nextCombatants);
              }
            }
          }
        }

        // Limpa malha visual do rastro
        if (trailGroupRef.current && sceneRef.current) {
          sceneRef.current.remove(trailGroupRef.current);
          disposeHierarchy(trailGroupRef.current);
          trailGroupRef.current = null;
        }

        dragTrailRef.current = [];
        isDraggingRef.current = false;
        draggedTokenKeyRef.current = null;
        lastDragSnapRef.current = null;
        controls.enabled = true; // Reativa a câmera OrbitControls
      }

      if (activeBlockDragRef.current) {
        activeBlockDragRef.current = null;
        controls.enabled = true;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (forgeRef.current.selectedBlockId) {
          setBuildingBlocks((prev) =>
            prev.map((b) =>
              b.id === forgeRef.current.selectedBlockId
                ? { ...b, rotationDeg: ((b.rotationDeg || 0) + 45) % 360 }
                : b
            )
          );
        } else if (forgeRef.current.buildMode === 'place') {
          setBlockRotation((r) => (r + 90) % 360);
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && forgeRef.current.selectedBlockId) {
        const selId = forgeRef.current.selectedBlockId;
        setBuildingBlocks((prev) => prev.filter((b) => b.id !== selId));
        setSelectedBlockId(null);
        toast.info('Asset excluído.');
      }
      if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey) && forgeRef.current.selectedBlockId) {
        e.preventDefault();
        const target = forgeRef.current.buildingBlocks.find((b) => b.id === forgeRef.current.selectedBlockId);
        if (target) {
          const dup: BuildingBlock3D = {
            ...target,
            id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            x: target.x + 2,
          };
          setBuildingBlocks((prev) => [...prev, dup]);
          setSelectedBlockId(dup.id);
          toast.success('Asset duplicado!');
        }
      }
      // Foco de câmera no asset ou token selecionado (Estilo Numpad ',' / '.' do Blender & 'F' da Unreal)
      const isFocusKey =
        e.code === 'NumpadDecimal' ||
        e.code === 'NumpadComma' ||
        e.key === ',' ||
        e.key === '.' ||
        ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey);

      if (isFocusKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (forgeRef.current.selectedBlockId) {
          const b = forgeRef.current.buildingBlocks.find((bl) => bl.id === forgeRef.current.selectedBlockId);
          if (b) {
            e.preventDefault();
            focusCameraOnTarget(camera, controls, { x: b.x, y: (b.heightScale || 1.0) * 1.4, z: b.z }, 6.5);
            toast.info('🔭 Câmera focada no asset selecionado!');
          }
        } else if (selectedCombatantId) {
          const cPos = localPositions[selectedCombatantId];
          if (cPos) {
            e.preventDefault();
            focusCameraOnTarget(camera, controls, { x: cPos.x, y: 1.2, z: cPos.z }, 6.0);
            toast.info('🔭 Câmera focada no personagem selecionado!');
          }
        }
      }
      if (e.key === 'Escape') {
        if (forgeRef.current.selectedBlockId) {
          setSelectedBlockId(null);
        }
        if (forgeRef.current.buildMode !== 'idle') {
          setBuildMode('idle');
          setIsForgeMenuOpen(false);
          isPaintingTerrainRef.current = false;
          controls.enabled = true;
          toast.info('Modo de edição/pintura cancelado (ESC).');
        }
        if (callbacksRef.current.pendingAttack) {
          callbacksRef.current.setPendingAttack(null);
          callbacksRef.current.setSplineBadgeInfo(null);
          if (splineSystemRef.current) splineSystemRef.current.clear();
          toast.info('Mira de ataque cancelada. Mova seu personagem ou escolha outra ação.');
        }
        if (activeSpellTargetingRef.current) {
          setActiveSpellTargeting(null);
          setCasterTokenKey(null);
          setSpellTargetPosition(null);
        }
      }
    };

    const handleDblClick = (event: MouseEvent) => {
      if (forgeRef.current.isAssetsLocked) return;
      if (!containerRef.current || !blocksGroupRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const hits = raycaster.intersectObjects(blocksGroupRef.current.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.name.startsWith('block-') && obj.parent) {
          obj = obj.parent;
        }
        if (obj?.userData?.blockId) {
          event.preventDefault();
          event.stopPropagation();
          const bId = obj.userData.blockId;
          const targetBlock = forgeRef.current.buildingBlocks.find((b) => b.id === bId);
          setSelectedBlockId(bId);
          setIsInspectorModalOpen(true);
          toast.info(`⚙️ Configurações de ${targetBlock?.type || 'Asset'}`);
        }
      }
    };

    // Notificação de interação para ativar 60 FPS e atualizar sombras sob demanda
    const markInteraction = () => {
      lastInteractionTimeRef.current = performance.now();
      if (renderer.shadowMap.enabled) {
        renderer.shadowMap.needsUpdate = true;
      }
    };

    const handleReleaseInteractions = () => {
      if (isPaintingTerrainRef.current) {
        isPaintingTerrainRef.current = false;
        controls.enabled = true;
      }
      handlePointerUp();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', (e) => { markInteraction(); handlePointerDown(e); });
    domElem.addEventListener('dblclick', (e) => { markInteraction(); handleDblClick(e); });
    window.addEventListener('pointermove', (e) => { markInteraction(); handlePointerMove(e); });
    window.addEventListener('pointerup', () => { markInteraction(); handleReleaseInteractions(); });
    window.addEventListener('pointercancel', handleReleaseInteractions);
    window.addEventListener('blur', handleReleaseInteractions);
    window.addEventListener('keydown', (e) => { markInteraction(); handleKeyDown(e); });
    controls.addEventListener('change', markInteraction);

    // Inicializar o RangedAttackSplineSystem na cena 3D
    const splineSys = new RangedAttackSplineSystem(scene);
    splineSystemRef.current = splineSys;

    // Inicializar o FireParticleSystem para iluminação de fogo e tochas
    const fireSys = createFireParticleSystem(scene);
    fireSysRef.current = fireSys;

    // Helper de Renderização Estática Sob Demanda (Dirty Flagging)
    const requestSingleRender = () => {
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    requestSingleRenderRef.current = requestSingleRender;

    // Animation loop com Adaptive Idle Throttling & Eco Pause
    let animId: number;
    let lastTime = performance.now();
    let lastRenderTime = performance.now();
    let isLoopRunning = false;

    const animate = () => {
      const isHidden = typeof document !== 'undefined' && document.hidden;
      if (isPausedRef.current || isHidden) {
        isLoopRunning = false;
        return;
      }

      animId = requestAnimationFrame(animate);
      isLoopRunning = true;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Adaptive Idle Throttling: Quando ocioso por mais de 3s sem ataque ativo, limita a ~20 FPS (50ms intervalo)
      const isIdle = (now - lastInteractionTimeRef.current) > 3000 && !callbacksRef.current.pendingAttack && !isDraggingRef.current;
      if (isIdle && (now - lastRenderTime) < 48) {
        return;
      }
      lastRenderTime = now;

      controls.update();
      const isVideoFloor = isAnyVideoMapUrl(floorTextureUrlRef.current);

      if (skyDomeRef.current) {
        skyDomeRef.current.skyObj.visible = !envRef.current.isIndoor;
        skyDomeRef.current.moonMesh.visible = !envRef.current.isIndoor;
        const {
          timeOfDayHour: h,
          timeOfDayPreset: p,
          isIndoor: ind,
          hasFog: f,
          hasRain: r,
          moonSize: ms,
          moonLuminosity: ml,
          moonOffsetAngle: ma,
          moonAltitude: malt,
          sunSize: ss,
          skyTurbidity: st,
          skyRayleigh: sr,
          mieCoefficient: mc,
          mieDirectionalG: mg,
        } = envRef.current;
        skyDomeRef.current.update(h, p, f, r, ms, ml, ma, malt, ss, st, sr, mc, mg, ind);

        // Align directional light with sun position for accurate shadows & specular highlights
        if (dirLightRef.current && skyDomeRef.current.sunPosition) {
          dirLightRef.current.position.copy(skyDomeRef.current.sunPosition);
        }
      }

      if (cloudSystemRef.current) {
        cloudSystemRef.current.group.visible = !envRef.current.isIndoor;
        const { timeOfDayPreset: p, cloudDensity: cd, timeOfDayHour: h, windAngle: wa, windStrength: ws } = envRef.current;
        cloudSystemRef.current.update(delta, p, cd, h, wa, ws);
      }

      if (rainSysRef.current) {
        const { lightningIntensity } = rainSysRef.current.update(delta);
        if (lightningIntensity > 0.005) {
          if (ambientLightRef.current) {
            const baseAmb = envRef.current.ambientLightIntensity ?? 0.65;
            ambientLightRef.current.intensity = baseAmb + lightningIntensity * 2.8;
          }
          if (dirLightRef.current) {
            const baseSun = envRef.current.sunLightIntensity ?? 1.0;
            dirLightRef.current.intensity = baseSun + lightningIntensity * 4.0;
          }
        }
      }
      if (groundFogSysRef.current) {
        const { timeOfDayPreset: p, timeOfDayHour: h, windAngle: wa, windStrength: ws } = envRef.current;
        groundFogSysRef.current.update(delta, p, h, wa, ws);
      }
      if (fireSysRef.current) fireSysRef.current.update(delta);

      // Animar e projetar o Badge de Distância da Trajetória Spline Curva
      if (splineSystemRef.current && callbacksRef.current.pendingAttack) {
        splineSystemRef.current.animate(delta);
        const screenPos = splineSystemRef.current.getMidpointScreenPos(camera, container.clientWidth, container.clientHeight);
        if (screenPos) {
          setBadgeScreenPos((prev) => {
            if (!prev) return screenPos;
            const dx = Math.abs(prev.x - screenPos.x);
            const dy = Math.abs(prev.y - screenPos.y);
            return dx > 4 || dy > 4 ? screenPos : prev;
          });
        } else {
          setBadgeScreenPos((prev) => (prev !== null ? null : prev));
        }
      } else if (splineSystemRef.current) {
        splineSystemRef.current.clear();
      }

      if (auraSysRef.current) {
        auraSysRef.current.update(callbacksRef.current.combatants, localPositionsRef.current || {});
      }

      // Renderiza a cena 3D CSS (vídeos do YouTube posicionados no plano 3D do chão)
      if (css3dRendererRef.current && css3dSceneRef.current) {
        css3dRendererRef.current.render(css3dSceneRef.current, camera);
      }

      // Atualiza textura de vídeo direta HTML5
      if (videoTextureRef.current && videoElementRef.current && videoElementRef.current.readyState >= 2) {
        videoTextureRef.current.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Listener para troca de aba (visibilitychange)
    const handleVisibilityChange = () => {
      if (!document.hidden && !isPausedRef.current && !isLoopRunning) {
        lastTime = performance.now();
        lastInteractionTimeRef.current = performance.now();
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize Observer para responsividade em modais e abas
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        if (css3dRendererRef.current) {
          css3dRendererRef.current.setSize(w, h);
        }
        if (isPausedRef.current) {
          requestSingleRender();
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      controls.removeEventListener('change', markInteraction);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', handlePointerDown);
      domElem.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handleReleaseInteractions);
      window.removeEventListener('pointercancel', handleReleaseInteractions);
      window.removeEventListener('blur', handleReleaseInteractions);
      window.removeEventListener('keydown', handleKeyDown);
      controls.dispose();
      if (skyDomeRef.current) {
        skyDomeRef.current.dispose();
        skyDomeRef.current = null;
      }
      if (cloudSystemRef.current) {
        cloudSystemRef.current.dispose();
        cloudSystemRef.current = null;
      }
      if (rainSysRef.current) {
        rainSysRef.current.dispose();
        rainSysRef.current = null;
      }
      if (groundFogSysRef.current) {
        groundFogSysRef.current.dispose();
        groundFogSysRef.current = null;
      }
      if (fireSysRef.current) {
        fireSysRef.current.dispose();
        fireSysRef.current = null;
      }
      if (hoverRingRef.current) {
        scene.remove(hoverRingRef.current);
        hoverRingRef.current.geometry.dispose();
        (hoverRingRef.current.material as THREE.MeshBasicMaterial).dispose();
        hoverRingRef.current = null;
      }
      if (splineSystemRef.current) {
        splineSystemRef.current.destroy(scene);
        splineSystemRef.current = null;
      }
      if (auraSysRef.current) {
        auraSysRef.current.dispose();
        auraSysRef.current = null;
      }
      if (css3dRendererRef.current && css3dRendererRef.current.domElement.parentElement) {
        css3dRendererRef.current.domElement.parentElement.removeChild(css3dRendererRef.current.domElement);
        css3dRendererRef.current = null;
      }
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.src = '';
        videoElementRef.current = null;
      }
      if (videoTextureRef.current) {
        videoTextureRef.current.dispose();
        videoTextureRef.current = null;
      }
      renderer.dispose();
      disposeHierarchy(scene);
      tokenMeshMapRef.current.clear();
      tokenGroupRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      if (container && domElem && container.contains(domElem)) {
        container.removeChild(domElem);
      }
    };
  }, []);

  // 2. Update Scene Environment (Lighting / Fog / Rain / SkyDome / Clouds) dynamically
  useEffect(() => {
    if (!sceneRef.current) return;

    const {
      timeOfDayHour,
      timeOfDayPreset,
      isIndoor,
      hasFog,
      hasRain,
      cloudDensity,
      moonSize,
      moonLuminosity,
      moonOffsetAngle,
      moonAltitude,
      sunSize,
      sunLightIntensity,
      ambientLightIntensity,
      skyTurbidity,
      skyRayleigh,
      mieCoefficient,
      mieDirectionalG,
      rainIntensity,
      rainSpeed,
      rainDropSize,
      windAngle,
      windStrength,
      groundFogDensity,
      groundFogHeight,
      groundFogSpeed,
      globalFogDensity,
      fogNoiseScale,
      fogColorPreset,
      fogCustomColor,
    } = internalEnv;

    const env = applySceneEnvironment(
      sceneRef.current,
      timeOfDayHour,
      timeOfDayPreset,
      hasFog,
      hasRain,
      cloudDensity,
      moonSize,
      moonLuminosity,
      moonOffsetAngle,
      moonAltitude,
      sunSize,
      sunLightIntensity,
      ambientLightIntensity,
      globalFogDensity,
      isIndoor,
      fogColorPreset,
      fogCustomColor
    );

    // Dynamically adjust ambient light intensity and color
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = env.ambientIntensity;
      ambientLightRef.current.color.set(env.isIndoor ? 0x000000 : (env.isNight ? 0x0f172a : 0xffffff));
    }

    // Dynamically adjust directional light intensity, color, and sun angle
    if (dirLightRef.current) {
      dirLightRef.current.intensity = env.sunIntensity;
      dirLightRef.current.color.set(env.sunColor);

      if (skyDomeRef.current && skyDomeRef.current.sunPosition) {
        dirLightRef.current.position.copy(skyDomeRef.current.sunPosition);
      }
    }

    if (skyDomeRef.current) {
      skyDomeRef.current.update(
        timeOfDayHour,
        timeOfDayPreset,
        hasFog,
        hasRain,
        moonSize,
        moonLuminosity,
        moonOffsetAngle,
        moonAltitude,
        sunSize,
        skyTurbidity,
        skyRayleigh,
        mieCoefficient,
        mieDirectionalG,
        isIndoor
      );
    }

    if (cloudSystemRef.current) {
      cloudSystemRef.current.update(0.016, timeOfDayPreset, cloudDensity, timeOfDayHour, windAngle, windStrength);
    }

    if (hasRain || timeOfDayPreset === 'storm') {
      if (!rainSysRef.current) {
        rainSysRef.current = createRainParticleSystem(sceneRef.current);
      }
      const wUnits = (gridConfig.widthCells || 20) * 2.0;
      const hUnits = (gridConfig.heightCells || 20) * 2.0;
      rainSysRef.current.updateParams({
        intensity: rainIntensity,
        speed: rainSpeed,
        dropSize: rainDropSize,
        windAngle: windAngle,
        windStrength: windStrength,
        opacity: internalEnv.rainOpacity,
        theme: internalEnv.rainTheme,
        customColor: internalEnv.rainCustomColor,
        hasSplashes: internalEnv.hasSplashes,
        splashSize: internalEnv.splashSize,
        splashIntensity: internalEnv.splashIntensity,
        hasCrownDrops: internalEnv.hasCrownDrops,
        hasLightning: internalEnv.hasLightning || timeOfDayPreset === 'storm',
        lightningFrequency: internalEnv.lightningFrequency,
        gridBounds: {
          widthUnits: wUnits,
          heightUnits: hUnits,
          shape: gridConfig.shape || 'square',
        },
      });
    } else if (rainSysRef.current) {
      rainSysRef.current.dispose();
      rainSysRef.current = null;
    }

    if (hasFog || timeOfDayPreset === 'fog' || timeOfDayPreset === 'storm') {
      if (!groundFogSysRef.current) {
        groundFogSysRef.current = createVolumetricGroundFogSystem(sceneRef.current);
      }
      groundFogSysRef.current.updateParams({
        intensity: groundFogDensity,
        height: groundFogHeight,
        speed: groundFogSpeed,
        noiseScale: fogNoiseScale,
        colorPreset: fogColorPreset,
        customColor: fogCustomColor,
      });
    } else if (groundFogSysRef.current) {
      groundFogSysRef.current.dispose();
      groundFogSysRef.current = null;
    }
  }, [internalEnv, gridConfig.widthCells, gridConfig.heightCells, gridConfig.shape]);

  // Sincroniza a textura do chão (YouTube em 3D, Vídeo direto HTML5 ou Imagem estática)
  useEffect(() => {
    if (!floorMatRef.current || !floorMeshRef.current) return;

    // 1. Limpa qualquer objeto 3D de chão CSS3D anterior
    if (css3dSceneRef.current && css3dFloorObjectRef.current) {
      css3dSceneRef.current.remove(css3dFloorObjectRef.current);
      css3dFloorObjectRef.current = null;
      youtubeIframeRef.current = null;
    }

    // 2. Limpa qualquer vídeo HTML5 / VideoTexture anterior
    if (videoElementRef.current) {
      videoElementRef.current.pause();
      videoElementRef.current.src = '';
      videoElementRef.current = null;
    }
    if (videoTextureRef.current) {
      videoTextureRef.current.dispose();
      videoTextureRef.current = null;
    }

    if (!floorTextureUrl) {
      // Sem textura — chão sólido padrão
      floorMeshRef.current.visible = true;
      if (skyDomeRef.current) {
        skyDomeRef.current.skyObj.visible = !envRef.current.isIndoor;
        skyDomeRef.current.moonMesh.visible = !envRef.current.isIndoor;
      }
      if (cloudSystemRef.current) {
        cloudSystemRef.current.group.visible = !envRef.current.isIndoor;
      }
      if (floorMatRef.current.map) {
        floorMatRef.current.map.dispose();
        floorMatRef.current.map = null;
      }
      if (floorMatRef.current.emissiveMap) {
        floorMatRef.current.emissiveMap.dispose();
        floorMatRef.current.emissiveMap = null;
      }
      floorMatRef.current.color.setHex(0x1e293b);
      floorMatRef.current.roughness = 0.95;
      floorMatRef.current.metalness = 0.05;
      floorMatRef.current.emissive = new THREE.Color(0x000000);
      floorMatRef.current.emissiveIntensity = 0;
      floorMatRef.current.needsUpdate = true;
      return;
    }

    if (isYouTubeUrl(floorTextureUrl)) {
      // 🌟 Modo YouTube Living Battlemap no Plano 3D:
      // O vídeo é posicionado como um objeto 3D com CSS3DObject deitado no chão (rotation.x = -Math.PI/2)
      // O SkyDome e nuvens 3D continuam ativos no horizonte ao redor da arena!
      // Usamos um material punch-through no floorMesh para abrir uma janela transparente sobre o vídeo sem tampar o céu.
      const punchThroughMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.ZeroFactor,
        blendDst: THREE.ZeroFactor,
        blendSrcAlpha: THREE.ZeroFactor,
        blendDstAlpha: THREE.ZeroFactor,
        depthWrite: true,
      });
      floorMeshRef.current.material = punchThroughMat;
      floorMeshRef.current.visible = true;

      if (skyDomeRef.current) {
        skyDomeRef.current.skyObj.visible = !envRef.current.isIndoor;
        skyDomeRef.current.moonMesh.visible = !envRef.current.isIndoor;
      }
      if (cloudSystemRef.current) {
        cloudSystemRef.current.group.visible = !envRef.current.isIndoor;
      }
      if (floorMatRef.current.map) {
        floorMatRef.current.map.dispose();
        floorMatRef.current.map = null;
      }

      const videoId = extractYouTubeVideoId(floorTextureUrl);
      if (videoId && css3dSceneRef.current) {
        const embedUrl = getYouTubeEmbedUrl(videoId, {
          autoplay: true,
          mute: isVideoMapMuted,
          loop: true,
          controls: false,
          enablejsapi: true,
        });

        const floorDiv = document.createElement('div');
        floorDiv.style.width = '1600px';
        floorDiv.style.height = '900px'; // 16:9 proporção nativa de vídeo widescreen
        floorDiv.style.background = '#000000';
        floorDiv.style.overflow = 'hidden';
        floorDiv.style.display = 'flex';
        floorDiv.style.alignItems = 'center';
        floorDiv.style.justifyContent = 'center';
        floorDiv.style.pointerEvents = 'none';
        floorDiv.style.transformStyle = 'preserve-3d';
        floorDiv.style.backfaceVisibility = 'visible';
        (floorDiv.style as any).webkitBackfaceVisibility = 'visible';

        if (embedUrl) {
          const iframe = document.createElement('iframe');
          iframe.src = embedUrl;
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.style.pointerEvents = 'none';
          iframe.style.transform = 'scale(1.02)';
          iframe.style.transformStyle = 'preserve-3d';
          iframe.style.backfaceVisibility = 'visible';
          (iframe.style as any).webkitBackfaceVisibility = 'visible';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          youtubeIframeRef.current = iframe;
          floorDiv.appendChild(iframe);
        }

        const css3dObj = new CSS3DObject(floorDiv);
        css3dObj.rotation.x = -Math.PI / 2;
        const baseScale = 40 / 1600; // Constante fixa (0.025) - a largura do grid não altera o tamanho da projeção
        const userScale = videoGridConfig?.scale ?? 1.0;
        const finalScale = baseScale * userScale;
        css3dObj.scale.set(finalScale, finalScale, finalScale);
        css3dObj.position.set(
          (videoGridConfig?.offsetX ?? 0) * 0.4,
          -0.01,
          (videoGridConfig?.offsetY ?? 0) * 0.4
        );

        css3dSceneRef.current.add(css3dObj);
        css3dFloorObjectRef.current = css3dObj;
      }
    } else if (isVideoFileUrl(floorTextureUrl)) {
      // 🌟 Modo Arquivo de Vídeo Direto (.mp4 / .webm):
      // Renderiza diretamente como THREE.VideoTexture no plano 3D (floorMesh) com SkyDome ao redor
      floorMeshRef.current.material = floorMatRef.current;
      floorMeshRef.current.visible = true;
      if (skyDomeRef.current) {
        skyDomeRef.current.skyObj.visible = !envRef.current.isIndoor;
        skyDomeRef.current.moonMesh.visible = !envRef.current.isIndoor;
      }
      if (cloudSystemRef.current) {
        cloudSystemRef.current.group.visible = !envRef.current.isIndoor;
      }

      const video = document.createElement('video');
      video.src = floorTextureUrl;
      video.crossOrigin = 'anonymous';
      video.loop = true;
      video.autoplay = true;
      video.muted = isVideoMapMuted;
      video.playsInline = true;
      video.volume = Math.max(0, Math.min(1, videoMapVolume));
      video.play().catch(() => {});
      videoElementRef.current = video;

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.wrapS = THREE.RepeatWrapping;
      videoTexture.wrapT = THREE.RepeatWrapping;
      videoTextureRef.current = videoTexture;

      if (floorMatRef.current) {
        floorMatRef.current.map = videoTexture;
        floorMatRef.current.color.setHex(0xffffff);
        floorMatRef.current.roughness = 0.85;
        floorMatRef.current.metalness = 0.05;
        floorMatRef.current.emissive = new THREE.Color(0x000000);
        floorMatRef.current.needsUpdate = true;
      }
    } else {
      // Modo Imagem Estática (Floresta, Mangue, Deserto, Pedra, etc.):
      floorMeshRef.current.material = floorMatRef.current;
      floorMeshRef.current.visible = true;
      if (skyDomeRef.current) {
        skyDomeRef.current.skyObj.visible = !envRef.current.isIndoor;
        skyDomeRef.current.moonMesh.visible = !envRef.current.isIndoor;
      }
      if (cloudSystemRef.current) {
        cloudSystemRef.current.group.visible = !envRef.current.isIndoor;
      }
      const loader = new THREE.TextureLoader();
      loader.load(floorTextureUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        if (floorMatRef.current) {
          floorMatRef.current.map = texture;
          floorMatRef.current.color.setHex(0xffffff);
          floorMatRef.current.roughness = 0.85;
          floorMatRef.current.metalness = 0.05;
          floorMatRef.current.emissive = new THREE.Color(0x000000);
          floorMatRef.current.emissiveMap = null;
          floorMatRef.current.emissiveIntensity = 0;
          floorMatRef.current.needsUpdate = true;
        }
      });
    }
  }, [floorTextureUrl]);

  // Calibração em Tempo Real (Escala e Deslocamento X/Y no Plano 3D)
  useEffect(() => {
    if (css3dFloorObjectRef.current) {
      const baseScale = 40 / 1600;
      const userScale = videoGridConfig?.scale ?? 1.0;
      const finalScale = baseScale * userScale;
      css3dFloorObjectRef.current.scale.set(finalScale, finalScale, finalScale);
      css3dFloorObjectRef.current.position.set(
        (videoGridConfig?.offsetX ?? 0) * 0.4,
        -0.01,
        (videoGridConfig?.offsetY ?? 0) * 0.4
      );
    }
  }, [videoGridConfig?.scale, videoGridConfig?.offsetX, videoGridConfig?.offsetY]);

  // Sincronização de Áudio (Volume & Mute em Tempo Real para YouTube e Vídeo HTML5)
  useEffect(() => {
    if (youtubeIframeRef.current && youtubeIframeRef.current.contentWindow) {
      try {
        if (isVideoMapMuted) {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'mute' }),
            '*'
          );
        } else {
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute' }),
            '*'
          );
          youtubeIframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(videoMapVolume * 100)] }),
            '*'
          );
        }
      } catch {}
    }
    if (videoElementRef.current) {
      videoElementRef.current.volume = Math.max(0, Math.min(1, videoMapVolume));
      videoElementRef.current.muted = isVideoMapMuted;
    }
  }, [videoMapVolume, isVideoMapMuted]);

  // Dynamic Grid Lines Color & Opacity for High Contrast / Living Map Calibration
  useEffect(() => {
    if (!gridHelperRef.current) return;
    const mat = gridHelperRef.current.material as THREE.LineBasicMaterial;
    if (mat) {
      if (videoGridConfig?.gridOpacity !== undefined) {
        mat.opacity = Math.max(0.05, Math.min(1.0, videoGridConfig.gridOpacity));
      } else {
        mat.opacity = 0.35;
      }
      if (videoGridConfig?.gridColor) {
        mat.color = new THREE.Color(videoGridConfig.gridColor);
      } else {
        mat.color = new THREE.Color(0x0284c7);
      }
      mat.needsUpdate = true;
    }
  }, [videoGridConfig?.gridOpacity, videoGridConfig?.gridColor]);

  // Dynamic Grid Dimensions & Shape (Square / Rectangle / Circle Arena)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentConfig = gridConfig || DEFAULT_GRID_CONFIG_3D;
    const widthCells = currentConfig.widthCells || 20;
    const heightCells = currentConfig.heightCells || 20;
    const shape = currentConfig.shape || 'square';
    const lineOpacity = typeof currentConfig.lineOpacity === 'number' ? currentConfig.lineOpacity : 0.4;
    const lineColor = currentConfig.lineColor || videoGridConfig?.gridColor || '#0284c7';

    const widthUnits = widthCells * 2.0;
    const heightUnits = heightCells * 2.0;

    // 1. Update Floor Mesh Geometry
    if (floorMeshRef.current && floorMatRef.current) {
      floorMeshRef.current.geometry.dispose();
      if (shape === 'circle') {
        const radius = Math.max(widthUnits, heightUnits) / 2;
        floorMeshRef.current.geometry = new THREE.CircleGeometry(radius, 64);
      } else {
        floorMeshRef.current.geometry = new THREE.PlaneGeometry(widthUnits, heightUnits);
      }
    }

    // 2. Update CSS3D 3D Video Floor Object if active (Fixed base scale so grid size X/Z NEVER alters video projection size!)
    if (css3dFloorObjectRef.current) {
      const baseScale = 40 / 1600; // Constante fixa (0.025) - o tamanho da projeção do vídeo é controlado exclusivamente pelo Zoom/Escala
      const userScale = videoGridConfig?.scale ?? 1.0;
      const finalScale = baseScale * userScale;
      css3dFloorObjectRef.current.scale.set(
        finalScale,
        finalScale,
        finalScale
      );
      css3dFloorObjectRef.current.position.set(
        (videoGridConfig?.offsetX ?? 0) * 0.4,
        -0.01,
        (videoGridConfig?.offsetY ?? 0) * 0.4
      );
    }

    // 2.1 Update static image texture repeat if repeating tile texture (never stretch when expanding grid)
    if (floorMatRef.current && floorMatRef.current.map) {
      if (currentConfig.textureFitMode === 'repeat' || !currentConfig.textureFitMode) {
        floorMatRef.current.map.wrapS = THREE.RepeatWrapping;
        floorMatRef.current.map.wrapT = THREE.RepeatWrapping;
        floorMatRef.current.map.repeat.set(widthCells / 2, heightCells / 2);
      } else {
        floorMatRef.current.map.wrapS = THREE.ClampToEdgeWrapping;
        floorMatRef.current.map.wrapT = THREE.ClampToEdgeWrapping;
        floorMatRef.current.map.repeat.set(1, 1);
      }
      floorMatRef.current.map.needsUpdate = true;
    }

    // 3. Update Grid Helper with true rectangular / circular line generator
    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current.geometry.dispose();
      if (Array.isArray(gridHelperRef.current.material)) {
        gridHelperRef.current.material.forEach((m: THREE.Material) => m.dispose());
      } else if (gridHelperRef.current.material) {
        (gridHelperRef.current.material as THREE.Material).dispose();
      }
      gridHelperRef.current = null;
    }

    const gridLinesMesh = createCustomGridLines(
      widthCells,
      heightCells,
      shape,
      lineColor,
      '#334155',
      lineOpacity
    );
    scene.add(gridLinesMesh);
    gridHelperRef.current = gridLinesMesh as any;
  }, [gridConfig, videoGridConfig?.scale, videoGridConfig?.gridColor]);

  // Sync 3D Building Blocks (Walls, Pillars, Doors, Campfires, etc.)
  useEffect(() => {
    const group = blocksGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      disposeHierarchy(child);
    }

    buildingBlocks.forEach((block) => {
      const blockMesh = createBuildingBlockMesh(block);
      if (!isAssetsLocked && block.id === selectedBlockId) {
        const gizmo = createInteractiveTransformGizmo(block);
        blockMesh.add(gizmo);
      }
      group.add(blockMesh);
    });
  }, [buildingBlocks, selectedBlockId, isAssetsLocked]);

  // Sync Fire Particle Emitters (Tochas, Fogueiras, Braseiros, Caldeirões, Velas e Tochas de Tokens)
  useEffect(() => {
    if (!fireSysRef.current) return;
    const activeTorches = (combatants || [])
      .filter((c) => c.hasTorch)
      .map((c) => {
        const pos = getCombatantPos(c.id || c.name);
        return { x: pos.x, y: (tokenElevations[c.id || c.name] || 0) * (2 / 5), z: pos.z };
      });
    fireSysRef.current.updateEmitters(buildingBlocks, activeTorches);
  }, [buildingBlocks, combatants, tokenElevations, getCombatantPos]);

  // Sync 3D Spell Templates (Spheres, Cones, Cubes, Lines)
  useEffect(() => {
    const group = spellTemplateGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      disposeHierarchy(child);
    }

    if (activeSpellTemplate) {
      const templateMesh = createSpellTemplateMesh(activeSpellTemplate);
      group.add(templateMesh);
    }
  }, [activeSpellTemplate]);

  // 3. Sync token meshes on state updates
  useEffect(() => {
    syncTokens();
  }, [syncTokens, tokenElevations]);

  // Reachable movement range highlighting meshes dynamically
  useEffect(() => {
    if (isPlacementPhase || isDraggingRef.current || !isBattleStarted) {
      const scene = sceneRef.current;
      if (scene && highlightGroupRef.current) {
        scene.remove(highlightGroupRef.current);
        disposeHierarchy(highlightGroupRef.current);
        highlightGroupRef.current = null;
      }
      return;
    }

    const activeC = combatants[currentTurnIndex];
    if (!activeC) return;

    const cPos = getCombatantPos(activeC.id || activeC.name);
    const currentX = cPos.x;
    const currentZ = cPos.z;
    const speedVal = getSpeedInMeters(activeC.speed || activeC.notes) * (activeC.hasDashed ? 2 : 1);
    const remainingMovement = Math.max(0, speedVal - (activeC.movementUsed || 0));

    renderMovementHighlights(currentX, currentZ, remainingMovement);
  }, [combatants, currentTurnIndex, isPlacementPhase, isBattleStarted, getCombatantPos, renderMovementHighlights]);

  // 3.5 Smoothly auto-center 3D camera on active turn combatant on turn change
  const prevTurnIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlacementPhase || !isBattleStarted) return;
    if (currentTurnIndex === undefined || !combatants || combatants.length === 0) return;

    if (prevTurnIndexRef.current === currentTurnIndex) return;
    prevTurnIndexRef.current = currentTurnIndex;

    const activeC = combatants[currentTurnIndex];
    if (!activeC) return;

    const cPos = getCombatantPos(activeC.id || activeC.name);
    const targetX = cPos.x;
    const targetZ = cPos.z;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (camera && controls) {
      const currentTarget = controls.target;
      const offsetX = camera.position.x - currentTarget.x;
      const offsetY = camera.position.y - currentTarget.y;
      const offsetZ = camera.position.z - currentTarget.z;

      const startTargetX = currentTarget.x;
      const startTargetZ = currentTarget.z;
      const deltaX = targetX - startTargetX;
      const deltaZ = targetZ - startTargetZ;

      const distance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      if (distance > 0.1) {
        let startTime: number | null = null;
        const duration = 350; // 350ms smooth ease-out gliding transition

        const animateCameraPan = (now: number) => {
          if (!startTime) startTime = now;
          const elapsed = now - startTime;
          const progress = Math.min(1, elapsed / duration);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          const curTargetX = startTargetX + deltaX * easeProgress;
          const curTargetZ = startTargetZ + deltaZ * easeProgress;

          controls.target.set(curTargetX, 0, curTargetZ);
          camera.position.set(curTargetX + offsetX, currentTarget.y + offsetY, curTargetZ + offsetZ);
          controls.update();

          if (progress < 1) {
            requestAnimationFrame(animateCameraPan);
          }
        };

        requestAnimationFrame(animateCameraPan);
      } else {
        controls.target.set(targetX, 0, targetZ);
        camera.position.set(targetX + offsetX, camera.position.y, targetZ + offsetZ);
        controls.update();
      }
    }
  }, [currentTurnIndex, combatants, isPlacementPhase, getCombatantPos]);

  // 4. Render Spell Range and AoE Target shape helper meshes dynamically
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove any existing spell shape helper meshes
    const oldSpell = scene.getObjectByName('spellHelperMesh');
    if (oldSpell) {
      scene.remove(oldSpell);
      disposeHierarchy(oldSpell);
    }
    const oldRange = scene.getObjectByName('rangeHelperMesh');
    if (oldRange) {
      scene.remove(oldRange);
      disposeHierarchy(oldRange);
    }

    if (!activeSpellTargeting || !casterTokenKey) return;

    const unitsPerMeter = 2 / 1.5;
    const caster = getCombatantPos(casterTokenKey);
    const target = spellTargetPosition || caster;

    // 1. Draw Range limit (Cyan outline circle centered at Caster)
    if (activeSpellTargeting.range > 0) {
      const rangeRadius = activeSpellTargeting.range * unitsPerMeter;
      const rangeGeo = new THREE.RingGeometry(rangeRadius - 0.1, rangeRadius + 0.1, 64);
      const rangeMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4, // Cyan
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
      });
      const rangeMesh = new THREE.Mesh(rangeGeo, rangeMat);
      rangeMesh.name = 'rangeHelperMesh';
      rangeMesh.rotation.x = Math.PI / 2;
      rangeMesh.position.set(caster.x, 0.015, caster.z);
      scene.add(rangeMesh);
    }

    // 2. Draw Spell shape geometry
    const sizeUnits = activeSpellTargeting.size * unitsPerMeter;
    let spellGeo: THREE.BufferGeometry;
    const spellMat = new THREE.MeshBasicMaterial({
      color: 0xf97316, // Orange
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35
    });

    if (activeSpellTargeting.shape === 'circle') {
      spellGeo = new THREE.CircleGeometry(sizeUnits, 32);
      const spellMesh = new THREE.Mesh(spellGeo, spellMat);
      spellMesh.name = 'spellHelperMesh';
      spellMesh.rotation.x = Math.PI / 2;
      spellMesh.position.set(target.x, 0.02, target.z);
      scene.add(spellMesh);
    } else if (['cone', 'line', 'fan'].includes(activeSpellTargeting.shape)) {
      const dx = target.x - caster.x;
      const dz = target.z - caster.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      const angle = Math.atan2(dx, dz);

      if (activeSpellTargeting.shape === 'line') {
        const lineGeo = new THREE.PlaneGeometry(2, sizeUnits);
        const spellMesh = new THREE.Mesh(lineGeo, spellMat);
        spellMesh.name = 'spellHelperMesh';
        spellMesh.rotation.x = Math.PI / 2;
        // Positioned at middle point of the line
        spellMesh.position.set(
          caster.x + (dx / dist) * (sizeUnits / 2),
          0.02,
          caster.z + (dz / dist) * (sizeUnits / 2)
        );
        spellMesh.rotation.z = -angle;
        scene.add(spellMesh);
      } else {
        // Cone or Fan (Ring sector)
        const thetaLength = activeSpellTargeting.shape === 'fan' ? Math.PI / 2 : Math.PI / 3;
        const thetaStart = -thetaLength / 2;

        const coneGeo = new THREE.RingGeometry(0, sizeUnits, 32, 1, thetaStart, thetaLength);
        const spellMesh = new THREE.Mesh(coneGeo, spellMat);
        spellMesh.name = 'spellHelperMesh';
        spellMesh.rotation.x = Math.PI / 2;
        spellMesh.position.set(caster.x, 0.02, caster.z);
        spellMesh.rotation.z = Math.PI / 2 - angle;
        scene.add(spellMesh);
      }
    }
  }, [activeSpellTargeting, casterTokenKey, spellTargetPosition, localPositions, combatants, getCombatantPos]);

  // Camera preset switcher
  const handleSelectCameraPreset = (presetKey: 'tactical' | 'cinematic' | 'topDown') => {
    const preset = DEFAULT_CAMERA_PRESETS[presetKey];
    if (preset && cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(...preset.position);
      controlsRef.current.target.set(...preset.lookAt);
      controlsRef.current.update();
    }
  };

  // Drag and Drop (Arrastar da Forja diretamente para a arena 3D)
  const handleContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersectPt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane.current, intersectPt)) {
      const cfg = gridConfig || DEFAULT_GRID_CONFIG_3D;
      const snap = worldPosToGridCell(intersectPt.x, intersectPt.z, cfg.widthCells || 20, cfg.heightCells || 20);

      if (dragGhostRef.current) {
        dragGhostRef.current.position.set(snap.snappedX, 0, snap.snappedZ);
        dragGhostRef.current.visible = true;
      }
    }
  };

  const handleContainerDragLeave = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.visible = false;
    }
  };

  const handleContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragGhostRef.current) {
      dragGhostRef.current.visible = false;
    }

    if (!containerRef.current || !cameraRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersectPt = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane.current, intersectPt)) {
      const cfg = gridConfig || DEFAULT_GRID_CONFIG_3D;
      const snap = worldPosToGridCell(intersectPt.x, intersectPt.z, cfg.widthCells || 20, cfg.heightCells || 20);

      let blockType: BuildingBlockType | null = null;
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.type === '3d_building_block' && parsed.blockType) {
            blockType = parsed.blockType as BuildingBlockType;
          }
        }
      } catch (_err) {}

      if (!blockType) {
        const text = e.dataTransfer.getData('text/plain') as BuildingBlockType;
        if (text && BUILDING_BLOCK_CATALOG[text]) {
          blockType = text;
        }
      }

      if (blockType && BUILDING_BLOCK_CATALOG[blockType]) {
        const def = BUILDING_BLOCK_CATALOG[blockType];
        const newBlock = createDefaultBuildingBlock(
          blockType,
          snap.snappedX,
          snap.snappedZ,
          blockRotation
        );

        setBuildingBlocks((prev) => [
          ...prev.filter((b) => !(Math.abs(b.x - snap.snappedX) < 0.1 && Math.abs(b.z - snap.snappedZ) < 0.1)),
          newBlock,
        ]);
        setSelectedBlockId(newBlock.id);
        toast.success(`🧱 ${def.label} adicionado ao grid!`);
      }
    }
  };

  const selectedCombatant = combatants.find((c) => c.id === selectedCombatantId) ||
    combatants.find((c) => c.name === selectedCombatantId);
  const selectedTarget = combatants.find(
    (c) => c.id === targetIdState
  );
  const selectedRotation = selectedCombatantId
    ? localRotations[selectedCombatantId] || 0
    : 0;

  // Sword cursor SVG data URI for attack targeting mode
  const swordCursorSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><g transform='rotate(-45 16 16)'><rect x='14.5' y='2' width='3' height='20' rx='1.5' fill='%23f8fafc'/><rect x='11' y='8' width='10' height='2.5' rx='1.25' fill='%23fbbf24'/><polygon points='14.5,22 17.5,22 16,30' fill='%23f8fafc'/></g></svg>`;
  const swordCursorUrl = `url("data:image/svg+xml,${swordCursorSvg}") 16 16, crosshair`;

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none">
      <div
        ref={containerRef}
        className="w-full h-full absolute inset-0 z-10"
        style={{
          cursor: pendingAttack ? swordCursorUrl : 'grab',
        }}
        onMouseDown={(e) => { if (!pendingAttack) e.currentTarget.style.cursor = 'grabbing'; }}
        onMouseUp={(e) => { if (!pendingAttack) e.currentTarget.style.cursor = 'grab'; }}
        onDragOver={handleContainerDragOver}
        onDragLeave={handleContainerDragLeave}
        onDrop={handleContainerDrop}
      />

      {/* Attack mode: hover token name tooltip */}
      {pendingAttack && hoveredTargetId && (() => {
        const hov = combatants.find((c) => c.id === hoveredTargetId);
        if (!hov) return null;
        return (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in duration-150">
            <div className="bg-amber-500/90 backdrop-blur-sm text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <span>🎯</span>
              <span>{getCombatantDisplayName(hov, combatants)}</span>
              <span className="text-amber-800 text-[10px]">CA {hov.ac}</span>
            </div>
          </div>
        );
      })()}

      {/* Top HUD Banner: Mirando Ataque com Botão Cancelar (ESC) */}
      {pendingAttack && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-slate-950/95 border border-amber-500/60 shadow-2xl backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 text-slate-100">
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
              <span className="animate-pulse">🎯</span>
              <span>Mirando: <strong className="text-white">{pendingAttack.title}</strong></span>
            </span>
            <button
              onClick={() => {
                setPendingAttack(null);
                setSplineBadgeInfo(null);
                if (splineSystemRef.current) splineSystemRef.current.clear();
                toast.info('Mira de ataque cancelada. Você pode se mover ou escolher outra ação.');
              }}
              className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar Ataque (ESC)</span>
            </button>
          </div>
        </div>
      )}

      {/* Ranged Attack Distance Badge HUD */}
      {pendingAttack && splineBadgeInfo && (
        <RangedDistanceBadge
          distanceFt={splineBadgeInfo.distanceFt}
          status={splineBadgeInfo.status}
          normalRangeM={splineBadgeInfo.normalRangeM}
          maxRangeM={splineBadgeInfo.maxRangeM}
          isWeaponWithLongRange={splineBadgeInfo.isWeaponWithLongRange}
          isRanged={splineBadgeInfo.isRanged}
          screenPos={badgeScreenPos}
        />
      )}

      {/* Hover Combatant Tooltip Card */}
      {hoveredCombatantId && (() => {
        const hov = combatants.find((c) => c.id === hoveredCombatantId);
        if (!hov) return null;

        const displayName = getCombatantDisplayName(hov, combatants);
        const hpPercent = Math.max(0, Math.min(100, (hov.hp / hov.maxHp) * 100));

        return (
          <div
            ref={tooltipRef}
            className="absolute z-[40] pointer-events-none animate-in fade-in zoom-in-95 duration-100 bg-[#0d111d]/95 border border-slate-700/80 rounded-xl p-2.5 shadow-xl backdrop-blur-xs flex flex-col gap-1 w-44 transition-all"
            style={{
              left: '0px',
              top: '0px',
            }}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-serif font-black text-[11px] text-slate-100 truncate flex-1">
                {displayName}
              </span>
              <span className="text-[8px] font-bold text-slate-400 bg-slate-950/40 border border-slate-800 px-1 rounded uppercase">
                {hov.type === 'player' ? 'Player' : hov.type === 'npc' ? 'NPC' : 'Monster'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[10px] font-bold mt-0.5">
              <span className="text-emerald-400 font-mono">HP {hov.hp} / {hov.maxHp}</span>
              <span className="text-slate-400 text-[9px] font-mono">{hpPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Modular Battle Controls Toolbar (Top & Bottom HUD Overlay) */}
      <BattleControlsToolbar
        isDm={isDm}
        isPlacementPhase={isPlacementPhase}
        selectedCombatant={selectedCombatant}
        selectedTarget={selectedTarget}
        selectedRotation={selectedRotation}
        directionLabel={getDirectionLabel(selectedRotation)}
        canControlSelected={selectedCombatant ? canUserControlCombatant(selectedCombatant) : false}
        timeOfDayHour={internalEnv.timeOfDayHour}
        timeOfDayPreset={internalEnv.timeOfDayPreset}
        hasFog={internalEnv.hasFog}
        hasRain={internalEnv.hasRain}
        cloudDensity={internalEnv.cloudDensity}
        moonSize={internalEnv.moonSize}
        moonLuminosity={internalEnv.moonLuminosity}
        moonOffsetAngle={internalEnv.moonOffsetAngle}
        moonAltitude={internalEnv.moonAltitude}
        sunSize={internalEnv.sunSize}
        sunLightIntensity={internalEnv.sunLightIntensity}
        ambientLightIntensity={internalEnv.ambientLightIntensity}
        skyTurbidity={internalEnv.skyTurbidity}
        skyRayleigh={internalEnv.skyRayleigh}
        mieCoefficient={internalEnv.mieCoefficient}
        mieDirectionalG={internalEnv.mieDirectionalG}
        rainIntensity={internalEnv.rainIntensity}
        rainSpeed={internalEnv.rainSpeed}
        rainDropSize={internalEnv.rainDropSize}
        windAngle={internalEnv.windAngle}
        windStrength={internalEnv.windStrength}
        rainOpacity={internalEnv.rainOpacity}
        rainTheme={internalEnv.rainTheme}
        rainCustomColor={internalEnv.rainCustomColor}
        hasSplashes={internalEnv.hasSplashes}
        splashSize={internalEnv.splashSize}
        splashIntensity={internalEnv.splashIntensity}
        hasCrownDrops={internalEnv.hasCrownDrops}
        hasLightning={internalEnv.hasLightning}
        lightningFrequency={internalEnv.lightningFrequency}
        groundFogDensity={internalEnv.groundFogDensity}
        groundFogHeight={internalEnv.groundFogHeight}
        groundFogSpeed={internalEnv.groundFogSpeed}
        globalFogDensity={internalEnv.globalFogDensity}
        fogNoiseScale={internalEnv.fogNoiseScale}
        fogColorPreset={internalEnv.fogColorPreset}
        fogCustomColor={internalEnv.fogCustomColor}
        onRotateSelected={handleRotateSelected}
        onSelectCameraPreset={handleSelectCameraPreset}
        onEnvironmentChange={handleEnvironmentChange}
        onTimeOfDayChange={onTimeOfDayChange}
        floorTextureUrl={floorTextureUrl}
        onFloorTextureChange={onFloorTextureChange}
        videoGridConfig={videoGridConfig}
        onVideoGridConfigChange={onVideoGridConfigChange}
        onConfirmPlacement={onConfirmPlacement}
        isPlayerVisionMode={isPlayerVisionMode}
        onTogglePlayerVisionMode={() => setIsPlayerVisionMode(!isPlayerVisionMode)}
        onToggleTorch={handleToggleTorch}
        isForgeMenuOpen={isForgeMenuOpen}
        onToggleForgeMenu={() => setIsForgeMenuOpen(!isForgeMenuOpen)}
        isAssetsLocked={isAssetsLocked}
        onToggleAssetsLocked={handleToggleAssetsLocked}
        onAttackTarget={pendingAttack ? undefined : (target) => {
          if (propOnAttackTarget) {
            propOnAttackTarget(target);
          } else if (onSelectTarget) {
            onSelectTarget(target);
          }
        }}
        onToggleHelp={() => setShowHelpModal(true)}
      />

      {/* Floating Active Terrain Paint HUD Indicator */}
      {buildMode === 'terrain' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 shadow-2xl px-4 py-2 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            Pintando Terreno: <span className="text-emerald-400 font-mono">{TERRAIN_SURFACE_CATALOG[activeTerrainType]?.label || activeTerrainType}</span> ({terrainBrushSize}x{terrainBrushSize})
          </span>
          <button
            onClick={() => {
              setBuildMode('idle');
              isPaintingTerrainRef.current = false;
              if (controlsRef.current) controlsRef.current.enabled = true;
              toast.info('Pintura de terreno cancelada.');
            }}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            title="Sair da pintura de terreno (ESC)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Sair da Pintura (ESC)</span>
          </button>
        </div>
      )}

      {/* 3D BattleForge (Building Blocks, Grid Size, Terrains & Spell Templates) Drawer */}
      <BattleForgeToolbar
        isDm={isDm}
        isOpen={isForgeMenuOpen}
        onClose={() => setIsForgeMenuOpen(false)}
        isAssetsLocked={isAssetsLocked}
        onToggleAssetsLocked={handleToggleAssetsLocked}
        gridConfig={gridConfig}
        onGridConfigChange={setGridConfig}
        activeBlockType={activeBlockType}
        onSelectBlockType={setActiveBlockType}
        buildMode={buildMode}
        onSetBuildMode={setBuildMode}
        blockRotation={blockRotation}
        onRotateBlock={() => setBlockRotation((r) => (r + 90) % 360)}
        onClearAllBlocks={() => setBuildingBlocks([])}
        activeSpellTemplate={activeSpellTemplate}
        onSpawnSpellTemplate={(t) => {
          setActiveSpellTemplate({
            id: `spell-${Date.now()}`,
            ...t,
            x: 0,
            z: 0,
          });
        }}
        onClearSpellTemplate={() => setActiveSpellTemplate(null)}
        selectedTokenElevation={selectedCombatantId ? (tokenElevations[selectedCombatantId] || 0) : 0}
        onSetTokenElevation={(elevFt) => {
          if (selectedCombatantId) {
            setTokenElevations((prev) => ({ ...prev, [selectedCombatantId]: elevFt }));
            toast.info(`Altitude definida: +${elevFt}ft`);
          } else {
            toast.warning('Selecione um token primeiro para alterar a altitude de voo.');
          }
        }}
        blocksCount={buildingBlocks.length}
        activeTerrainType={activeTerrainType}
        onSelectTerrainType={setActiveTerrainType}
        terrainBrushSize={terrainBrushSize}
        onSetTerrainBrushSize={setTerrainBrushSize}
        terrainOpacity={gridConfig.terrainOpacity ?? 0.65}
        onSetTerrainOpacity={(op) => setGridConfig((prev) => ({ ...prev, terrainOpacity: op }))}
        terrainsCount={terrainSurfaces.length}
        onClearAllTerrains={() => setTerrainSurfaces([])}
        floorTextureUrl={floorTextureUrl}
        videoGridConfig={videoGridConfig}
        onVideoGridConfigChange={onVideoGridConfigChange}
      />

      {/* Selected 3D Asset Transform & Light Inspector (Aberto com 2 cliques rápidos no asset) */}
      {!isAssetsLocked && isInspectorModalOpen && selectedBlockId && (() => {
        const selBlock = buildingBlocks.find((b) => b.id === selectedBlockId);
        if (!selBlock) return null;
        return (
          <AssetInspectorTransform
            block={selBlock}
            onUpdateBlock={(updated) => {
              setBuildingBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            }}
            onDuplicateBlock={(target) => {
              const dup: BuildingBlock3D = {
                ...target,
                id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                x: target.x + 2,
              };
              setBuildingBlocks((prev) => [...prev, dup]);
              setSelectedBlockId(dup.id);
            }}
            onDeleteBlock={(bId) => {
              setBuildingBlocks((prev) => prev.filter((b) => b.id !== bId));
              setSelectedBlockId(null);
              setIsInspectorModalOpen(false);
            }}
            onClose={() => setIsInspectorModalOpen(false)}
          />
        );
      })()}

      {/* Barra de Ações Rápidas do Asset Selecionado (HUD Inferior Central) */}
      {!isAssetsLocked && selectedBlockId && !isInspectorModalOpen && (() => {
        const selBlock = buildingBlocks.find((b) => b.id === selectedBlockId);
        if (!selBlock) return null;
        const def = BUILDING_BLOCK_CATALOG[selBlock.type];
        return (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-md border border-amber-500/50 px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2.5 text-xs text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px] pr-1">
              <span className="text-sm">{def?.icon || '🧱'}</span> {def?.label || 'Asset'}
            </span>
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => {
                setBuildingBlocks((prev) =>
                  prev.map((b) => (b.id === selectedBlockId ? { ...b, rotationDeg: ((b.rotationDeg || 0) + 45) % 360 } : b))
                );
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-slate-700 flex items-center gap-1 text-[10px] font-semibold active:scale-95 transition-all shadow-xs"
              title="Girar 45° (Tecla R)"
            >
              <RotateCw className="w-3 h-3" /> Girar
            </button>
            {def?.supportsProceduralLength && (
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                <span className="text-slate-400">Tam:</span>
                <button
                  onClick={() => {
                    setBuildingBlocks((prev) =>
                      prev.map((b) => (b.id === selectedBlockId ? { ...b, segmentsCount: Math.max(1, (b.segmentsCount || 1) - 1) } : b))
                    );
                  }}
                  className="px-1 hover:text-amber-300 font-bold"
                >
                  -
                </button>
                <span className="font-mono text-emerald-400 font-bold">{selBlock.segmentsCount || 1}x</span>
                <button
                  onClick={() => {
                    setBuildingBlocks((prev) =>
                      prev.map((b) => (b.id === selectedBlockId ? { ...b, segmentsCount: Math.min(8, (b.segmentsCount || 1) + 1) } : b))
                    );
                  }}
                  className="px-1 hover:text-amber-300 font-bold"
                >
                  +
                </button>
              </div>
            )}
            <button
              onClick={() => setIsInspectorModalOpen(true)}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg flex items-center gap-1 text-[10px] font-bold active:scale-95 transition-all shadow-xs"
              title="Abrir Configurações & Luz (Duplo Clique)"
            >
              <Settings className="w-3 h-3" /> Configurações
            </button>
            <button
              onClick={() => {
                setBuildingBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId));
                setSelectedBlockId(null);
                toast.info('Asset excluído.');
              }}
              className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-lg border border-transparent hover:border-rose-500/40 text-[10px] active:scale-95 transition-all"
              title="Excluir (DEL)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setSelectedBlockId(null)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Deselecionar (ESC)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full text-slate-200 space-y-3 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-sky-400 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Controles do Grid 3D Tático
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-xs space-y-2 text-slate-300">
              <li>• <strong className="text-white">Foco Rápido (Zoom no Alvo):</strong> Selecione um asset ou personagem e pressione <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[11px]">,</kbd> (Numpad) ou <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono text-[11px]">F</kbd> para enquadrar a câmera instantaneamente.</li>
              <li>• <strong className="text-white">Manipulação 3D (Unreal/Blender):</strong> Clique e arraste um bloco para mover; use o anel dourado para girar e a alça verde para esticar paredes sem distorcer.</li>
              <li>• <strong className="text-white">Configurações Avançadas:</strong> 2 cliques rápidos no bloco abrem o painel com luzes, cores e propriedades finas.</li>
              <li>• <strong className="text-white">Mover / Girar Câmera:</strong> Arraste o mouse no espaço vazio do grid para orbitar e use o scroll para zoom livre.</li>
              <li>• <strong className="text-white">Selecionar Alvo de Ataque:</strong> Clique na miniatura de um inimigo para marcá-lo como alvo e ativar ações de combate.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};



