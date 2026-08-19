'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Combatant } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useBattleGridState } from '@/lib/hooks/useBattleGridState';

import { applySceneEnvironment } from './battle-3d/BattleEnvironment';
import { setupCameraAndOrbit, DEFAULT_CAMERA_PRESETS } from './battle-3d/BattleCameraControls';
import { createTokenMesh, updateTokenMeshState, TokenMeshOptions } from './battle-3d/Token3DMesh';
import { getModelUrlByNameOrPath, resolvePlayerModelUrl } from '@/lib/3d-models';
import { createBattleSkyDome, SkyDomeInstance } from './battle-3d/BattleSkyDome';
import { createCloudSystem, CloudSystemInstance } from './battle-3d/BattleClouds';
import { createRainParticleSystem, createGroundFogSystem } from './battle-3d/WeatherEffects';
import { BattleControlsToolbar } from './battle-3d/BattleControlsToolbar';
import { InstancedTokenManager } from './battle-3d/InstancedTokenManager';
import { disposeHierarchy } from '@/lib/3d-asset-manager';
import { HelpCircle, X } from 'lucide-react';
import { patchWebGLContext } from '@/lib/webgl-utils';
import { toast } from 'sonner';
import { RangedAttackSplineSystem, RangedDistanceBadge } from './battle-3d/RangedAttackSplineMesh';
import { calculateGridDistanceFeet, evaluateRangeStatus, parseRangeString, RangeStatus } from '@/lib/utils/dndRangeUtils';

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
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
  timeOfDayHour?: number;
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
  onTimeOfDayChange?: (time: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => void;
  onEnvironmentChange?: (env: {
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
    groundFogDensity?: number;
    groundFogHeight?: number;
    groundFogSpeed?: number;
    globalFogDensity?: number;
  }) => void;
  onConfirmPlacement?: () => void;
  userRole?: 'dm' | 'player';
  floorTextureUrl?: string;
  onFloorTextureChange?: (url: string) => void;
  onAttackTarget?: (target: Combatant) => void;
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
  setupMode = 'normal',
  timeOfDayPreset: propTimeOfDayPreset = 'day',
  timeOfDayHour: propTimeOfDayHour = 12,
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
  onTimeOfDayChange,
  onEnvironmentChange: propOnEnvironmentChange,
  onConfirmPlacement,
  userRole,
  floorTextureUrl,
  onFloorTextureChange,
  onAttackTarget: propOnAttackTarget,
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
  } | null>(null);



  const activeSpellTargetingRef = useRef(activeSpellTargeting);
  const casterTokenKeyRef = useRef(casterTokenKey);
  const spellTargetPositionRef = useRef(spellTargetPosition);

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
  const [hoveredTargetId, setHoveredTargetId] = useState<string | undefined>(undefined);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [hoveredCombatantId, setHoveredCombatantId] = useState<string | undefined>(undefined);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Three.js hover ring for attack targeting mode
  const hoverRingRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    setTargetIdState(propSelectedTargetId);
    if (!propSelectedTargetId) {
      setSelectedCombatantId(null);
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
  const groundFogSysRef = useRef<ReturnType<typeof createGroundFogSystem> | null>(null);
  const skyDomeRef = useRef<SkyDomeInstance | null>(null);
  const cloudSystemRef = useRef<CloudSystemInstance | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const floorTextureUrlRef = useRef<string | undefined>(floorTextureUrl);
  const pingGroupRef = useRef<THREE.Group | null>(null);

  const { pings, broadcastPingLocation, removePing } = useLiveCockpit();
  useEffect(() => {
    floorTextureUrlRef.current = floorTextureUrl;
  }, [floorTextureUrl]);

  // Local environment state for immediate UI slider responsiveness
  const [internalEnv, setInternalEnv] = useState({
    timeOfDayHour: propTimeOfDayHour,
    timeOfDayPreset: propTimeOfDayPreset,
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
  });

  useEffect(() => {
    setInternalEnv(prev => ({
      ...prev,
      // Only sync props that parent components actually manage
      timeOfDayHour: propTimeOfDayHour,
      timeOfDayPreset: propTimeOfDayPreset,
      hasFog: propHasFog,
      hasRain: propHasRain,
      cloudDensity: propCloudDensity,
    }));
  }, [
    propTimeOfDayHour,
    propTimeOfDayPreset,
    propHasFog,
    propHasRain,
    propCloudDensity,
  ]);

  const handleEnvironmentChange = useCallback(
    (env: {
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
      groundFogDensity?: number;
      groundFogHeight?: number;
      groundFogSpeed?: number;
      globalFogDensity?: number;
    }) => {
      const prev = envRef.current;
      const next = {
        ...prev,
        ...env,
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
        groundFogDensity: env.groundFogDensity ?? prev.groundFogDensity,
        groundFogHeight: env.groundFogHeight ?? prev.groundFogHeight,
        groundFogSpeed: env.groundFogSpeed ?? prev.groundFogSpeed,
        globalFogDensity: env.globalFogDensity ?? prev.globalFogDensity,
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

    if (isPlacementPhase || remainingMeters <= 0) return;

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
  }, [isPlacementPhase]);

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

    // 1. Highlight tiles in trail (amber translucent)
    const tileGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const tileMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, // Amber-500
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    const edges = new THREE.EdgesGeometry(tileGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.8 });

    for (let i = 1; i < trail.length; i++) {
      const pt = trail[i];
      const mesh = new THREE.Mesh(tileGeo, tileMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(pt.x, 0.025, pt.z);
      trailGroup.add(mesh);

      const border = new THREE.LineSegments(edges, lineMat);
      border.rotation.x = -Math.PI / 2;
      border.position.set(pt.x, 0.025, pt.z);
      trailGroup.add(border);
    }

    // 2. Bright connecting line along trail center points
    const points: THREE.Vector3[] = trail.map((pt) => new THREE.Vector3(pt.x, 0.04, pt.z));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8, // Sky-400 glowing path
      linewidth: 3
    });
    const pathLine = new THREE.Line(lineGeo, pathLineMat);
    trailGroup.add(pathLine);

    // 3. Floating distance badge (in meters) above token's head
    const distanceMeters = (trail.length - 1) * 1.5;
    const currentHead = trail[trail.length - 1];

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Rounded pill background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'; // Dark slate transparent
      ctx.strokeStyle = '#38bdf8'; // Glowing sky-400 border
      ctx.lineWidth = 6;

      const x = 12, y = 12, w = 232, h = 104, r = 28;
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

      // Footsteps icon + distance text
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`👣 ${distanceMeters.toFixed(1)}m`, 128, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    const distanceSprite = new THREE.Sprite(spriteMat);
    distanceSprite.scale.set(2.4, 1.2, 1);
    distanceSprite.position.set(currentHead.x, 2.5, currentHead.z);
    trailGroup.add(distanceSprite);
  }, []);

  const callbacksRef = useRef({
    combatants,
    currentTurnIndex,
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

  useEffect(() => {
    callbacksRef.current = {
      combatants,
      currentTurnIndex,
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
  });

  const isCombatantInSpellArea = useCallback((c: Combatant, cPos: { x: number; z: number }): boolean => {
    if (!activeSpellTargeting || !casterTokenKey || !spellTargetPosition) return false;
    if (c.id === casterTokenKey || c.name === casterTokenKey) return false; // Conjurador não se atinge

    const unitsPerMeter = 2 / 1.5;
    const sizeUnits = activeSpellTargeting.size * unitsPerMeter;
    const caster = getCombatantPos(casterTokenKey);
    const target = spellTargetPosition;

    const dx = cPos.x - target.x;
    const dz = cPos.z - target.z;
    const distToTarget = Math.sqrt(dx * dx + dz * dz);

    if (activeSpellTargeting.shape === 'circle') {
      return distToTarget <= sizeUnits;
    }

    const dirX = target.x - caster.x;
    const dirZ = target.z - caster.z;
    const distCasterToTarget = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (distCasterToTarget === 0) return false;

    const ndx = dirX / distCasterToTarget;
    const ndz = dirZ / distCasterToTarget;

    const tcx = cPos.x - caster.x;
    const tcz = cPos.z - caster.z;
    const distCasterToCombatant = Math.sqrt(tcx * tcx + tcz * tcz);

    if (distCasterToCombatant > sizeUnits) return false;
    if (distCasterToCombatant === 0) return true;

    const dot = (tcx * ndx + tcz * ndz) / distCasterToCombatant;
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));

    if (activeSpellTargeting.shape === 'cone') {
      return angleRad <= Math.PI / 6; // Cone de 60 graus
    }
    if (activeSpellTargeting.shape === 'fan') {
      return angleRad <= Math.PI / 4; // Leque de 90 graus
    }
    if (activeSpellTargeting.shape === 'line') {
      const projection = tcx * ndx + tcz * ndz;
      if (projection < 0 || projection > sizeUnits) return false;
      const perpDist = Math.sqrt(distCasterToCombatant * distCasterToCombatant - projection * projection);
      return perpDist <= (1.5 * unitsPerMeter) / 2; // Largura padrão de 1.5m
    }

    return false;
  }, [activeSpellTargeting, casterTokenKey, spellTargetPosition, getCombatantPos]);

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

    const genericCombatants: Combatant[] = [];
    const genericOptionsMap = new Map<string, any>();

    // Sync active combatants
    combatants.forEach((c, idx) => {
      // Use unique key: id preferred, fall back to name+idx to prevent same-named tokens colliding
      const key = c.id ? c.id : `${c.name}__${idx}`;
      const pos = localPositions[key] || localPositions[c.id || c.name] || (c.x !== undefined && c.z !== undefined ? { x: c.x, z: c.z } : getStableDefaultPos(key));
      const rot = localRotations[key] || localRotations[c.id || c.name] || 0;

      const targeted = activeSpellTargeting && casterTokenKey && isCombatantInSpellArea(c, pos);

      const options: TokenMeshOptions = {
        combatant: c,
        isCurrentTurn: idx === currentTurnIndex,
        isSelectedTarget: targetIdState === c.id,
        isSelectedForRotation: selectedCombatantId === key,
        isControlledByUser: canUserControlCombatant(c),
        positionX: pos.x,
        positionZ: pos.z,
        rotationAngleDeg: rot,
        isSpellTargeted: !!targeted,
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

        genericCombatants.push(c);
        genericOptionsMap.set(key, options);
      } else {
        const existingGroup = tokenMeshMapRef.current.get(key);
        let shouldCreate = !existingGroup;

        if (existingGroup) {
          const ud = existingGroup.userData || {};
          const currentType = c.tokenType || (c.tokenImageUrl ? 'billboard' : '3d');
          const currentImg = c.tokenImageUrl || c.avatarUrl;
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
            if (!torchLight) {
              const lightColor = c.hasTorch ? 0xffaa33 : 0x38bdf8;
              torchLight = new THREE.PointLight(lightColor, c.hasTorch ? 3.0 : 1.5, c.hasTorch ? 15 : 10);
              torchLight.name = 'tokenTorchLight';
              torchLight.position.set(0, 1.8, 0);
              torchLight.castShadow = true;
              torchLight.shadow.mapSize.width = 512;
              torchLight.shadow.mapSize.height = 512;
              torchLight.shadow.bias = -0.002;
              existingGroup.add(torchLight);
            } else {
              if (c.hasTorch) {
                // Flame flicker effect
                torchLight.intensity = 2.8 + Math.sin(Date.now() * 0.01) * 0.4 + (Math.random() - 0.5) * 0.3;
              }
            }
          } else if (torchLight) {
            existingGroup.remove(torchLight);
          }
        } else {
          const tokenMesh = createTokenMesh(options);
          
          if (c.hasTorch || c.visionType === 'darkvision') {
            const lightColor = c.hasTorch ? 0xffaa33 : 0x38bdf8;
            const torchLight = new THREE.PointLight(lightColor, c.hasTorch ? 3.0 : 1.5, c.hasTorch ? 15 : 10);
            torchLight.name = 'tokenTorchLight';
            torchLight.position.set(0, 1.8, 0);
            torchLight.castShadow = true;
            torchLight.shadow.mapSize.width = 512;
            torchLight.shadow.mapSize.height = 512;
            torchLight.shadow.bias = -0.002;
            tokenMesh.add(torchLight);
          }

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

    const { camera, controls } = setupCameraAndOrbit(container, width, height);
    cameraRef.current = camera;
    controlsRef.current = controls;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    patchWebGLContext(renderer);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    // Grid Floor Helper (40 total size, 20 divisions -> each square is 2x2 units)
    const gridHelper = new THREE.GridHelper(40, 20, 0x38bdf8, 0x334155);
    // Raise grid slightly above the floor
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Floor Platform (same size as grid: 40x40)
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0x1e293b, 
      roughness: 1.0, 
      metalness: 0.0,
      side: THREE.DoubleSide 
    });
    floorMatRef.current = floorMat;
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Apply floor texture immediately if a URL is already available on mount
    if (floorTextureUrlRef.current) {
      const loader = new THREE.TextureLoader();
      loader.load(floorTextureUrlRef.current, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (floorMatRef.current) {
          floorMatRef.current.map = texture;
          floorMatRef.current.emissive = new THREE.Color(0xffffff);
          floorMatRef.current.emissiveMap = texture;
          floorMatRef.current.emissiveIntensity = 0.6;
          floorMatRef.current.needsUpdate = true;
        }
      });
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Token Group Container
    const tokenGroup = new THREE.Group();
    scene.add(tokenGroup);
    tokenGroupRef.current = tokenGroup;

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

    // Skysphere Dome
    const skyDome = createBattleSkyDome(scene);
    skyDomeRef.current = skyDome;

    const {
      timeOfDayHour: h,
      timeOfDayPreset: p,
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

    skyDome.update(h, p, f, r, ms, ml, ma, malt, ss, st, sr, mc, mg);

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
              
              // Inicializa o rastro (trail) na casa snapped inicial do token
              const cPos = getPos(targetKey);
              const startSnapX = Math.floor(cPos.x / 2) * 2 + 1;
              const startSnapZ = Math.floor(cPos.z / 2) * 2 + 1;
              dragTrailRef.current = [{ x: startSnapX, z: startSnapZ }];
              lastDragSnapRef.current = { x: startSnapX, z: startSnapZ };

              const currentActor = activeCombatants[turnIdx];
              if (currentActor && clicked.id !== currentActor.id) {
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
                  const rInfo = currentPending.rangeInfo || parseRangeString(currentPending.rangeText || currentPending.actionDesc || currentPending.title);
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
              const { pendingAttack: currentPending, targetIdState: currentTargetId, propOnAttackTarget: attackCb } = callbacksRef.current;
              if (currentTargetId === clicked.id) {
                isDraggingRef.current = false;
                draggedTokenKeyRef.current = null;
                controls.enabled = true;
                setTargetIdState(undefined);
                if (onSelT) onSelT(undefined);
              } else if (currentPending) {
                const currentActor = activeCombatants[turnIdx];
                if (currentActor) {
                  const attackerPos2D = getPos(currentActor.id || currentActor.name);
                  const targetPos2D = getPos(clicked.id || clicked.name);
                  const distFt = calculateGridDistanceFeet(attackerPos2D, targetPos2D);
                  const rInfo = currentPending.rangeInfo || parseRangeString(currentPending.rangeText || currentPending.actionDesc || currentPending.title);
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

      setHoveredCombatantId(hoveredTokenId);

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
            callbacksRef.current.setHoveredTargetId(hCombatant.id);

            // Trajetória Spline Curva (BG3 Style)
            const attackerPos2D = callbacksRef.current.getCombatantPos(activeId || activeCombatant.name);
            const targetPos2D = pos;
            const distFt = calculateGridDistanceFeet(attackerPos2D, targetPos2D);
            const pendingAtk = callbacksRef.current.pendingAttack;
            const rInfo = pendingAtk.rangeInfo || parseRangeString(pendingAtk.rangeText || pendingAtk.actionDesc || pendingAtk.title);
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

            callbacksRef.current.setSplineBadgeInfo({
              distanceFt: distFt,
              status: rStatus,
              normalRangeM: rInfo.normalRangeM,
              maxRangeM: rInfo.maxRangeM,
              isWeaponWithLongRange: rInfo.isWeaponWithLongRange,
            });
          } else {
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.0;
            callbacksRef.current.setHoveredTargetId(undefined);
            if (splineSystemRef.current) splineSystemRef.current.clear();
            callbacksRef.current.setSplineBadgeInfo(null);
          }
        } else {
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.0;
          callbacksRef.current.setHoveredTargetId(undefined);
          if (splineSystemRef.current) splineSystemRef.current.clear();
          callbacksRef.current.setSplineBadgeInfo(null);
        }
      } else if (hoverRingRef.current) {
        // Not in attack mode: ensure ring is hidden
        (hoverRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.0;
        if (splineSystemRef.current) splineSystemRef.current.clear();
        callbacksRef.current.setSplineBadgeInfo(null);
      }

      if (!isDraggingRef.current || !draggedTokenKeyRef.current) return;

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
        const key = draggedTokenKeyRef.current;
        // Snap ao centro do grid 3D (quadrados de 2x2 unidades)
        const snappedX = Math.floor(planeIntersectPoint.current.x / 2) * 2 + 1;
        const snappedZ = Math.floor(planeIntersectPoint.current.z / 2) * 2 + 1;

        // Skip if snapped position hasn't changed — prevents infinite re-render loop
        if (lastDragSnapRef.current?.x === snappedX && lastDragSnapRef.current?.z === snappedZ) return;

        const { combatants: activeCombatants, currentTurnIndex: turnIdx } = callbacksRef.current;
        const activeC = activeCombatants[turnIdx];
        const targetC = activeCombatants.find((c) => c.id === key || c.name === key || (c.id || c.name) === key) || activeC;

        if (targetC && !isPlacementPhase) {
          const speedVal = getSpeedInMeters(targetC.speed || targetC.notes) * (targetC.hasDashed ? 2 : 1);
          const remainingMovementTotal = Math.max(0, speedVal - (targetC.movementUsed || 0));

          let trail = [...dragTrailRef.current];
          if (trail.length === 0) {
            const cPos = callbacksRef.current.getCombatantPos(key);
            trail = [{ x: Math.floor(cPos.x / 2) * 2 + 1, z: Math.floor(cPos.z / 2) * 2 + 1 }];
          }

          // Check if snapped tile is already in trail (Backtracking)
          const existingIdx = trail.findIndex((pt) => pt.x === snappedX && pt.z === snappedZ);
          if (existingIdx !== -1) {
            // Rewind trail up to existingIdx
            trail = trail.slice(0, existingIdx + 1);
          } else {
            // Forward move: interpolate step-by-step from last point in trail to snapped tile
            const lastPt = trail[trail.length - 1];
            const steps: { x: number; z: number }[] = [];
            let curX = lastPt.x;
            let curZ = lastPt.z;

            while (curX !== snappedX || curZ !== snappedZ) {
              if (curX < snappedX) curX += 2;
              else if (curX > snappedX) curX -= 2;

              if (curZ < snappedZ) curZ += 2;
              else if (curZ > snappedZ) curZ -= 2;

              steps.push({ x: curX, z: curZ });
            }

            // Check movement budget
            const totalTrailSquares = (trail.length - 1) + steps.length;
            const totalTrailCost = totalTrailSquares * 1.5;

            if (totalTrailCost <= remainingMovementTotal) {
              trail = [...trail, ...steps];
            } else {
              // Exceeds total remaining movement budget!
              // Cap steps to allowable distance
              const maxSquares = Math.floor(remainingMovementTotal / 1.5);
              const allowedStepsCount = maxSquares - (trail.length - 1);
              if (allowedStepsCount > 0) {
                trail = [...trail, ...steps.slice(0, allowedStepsCount)];
              }
            }
          }

          dragTrailRef.current = trail;
          const currentHead = trail[trail.length - 1];
          lastDragSnapRef.current = { x: currentHead.x, z: currentHead.z };

          const group = tokenMeshMapRef.current.get(key);
          if (group) {
            group.position.x = currentHead.x;
            group.position.z = currentHead.z;
          }

          callbacksRef.current.setLocalPositions((prev) => ({
            ...prev,
            [key]: { x: currentHead.x, z: currentHead.z },
          }));

          callbacksRef.current.updateTokenPosition3D(key, undefined, undefined, currentHead.x, currentHead.z);

          // Update trail visual rendering
          callbacksRef.current.renderDragTrail(trail);

          // Dynamic Highlight Reduction: calculate remaining movement after current trail cost
          const trailCostMeters = (trail.length - 1) * 1.5;
          const remainingMeters = Math.max(0, remainingMovementTotal - trailCostMeters);
          const startPt = trail[0] || { x: currentHead.x, z: currentHead.z };
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

        // Non-active combatant drag or placement phase
        lastDragSnapRef.current = { x: snappedX, z: snappedZ };

        const group = tokenMeshMapRef.current.get(key);
        if (group) {
          group.position.x = snappedX;
          group.position.z = snappedZ;
        }

        callbacksRef.current.setLocalPositions((prev) => ({
          ...prev,
          [key]: { x: snappedX, z: snappedZ },
        }));

        callbacksRef.current.updateTokenPosition3D(key, undefined, undefined, snappedX, snappedZ);
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        const key = draggedTokenKeyRef.current;
        if (key) {
          const group = tokenMeshMapRef.current.get(key);
          if (group) {
            const snappedX = group.position.x;
            const snappedZ = group.position.z;

            const { combatants: activeCombatants } = callbacksRef.current;
            const targetC = activeCombatants.find((c) => c.id === key || c.name === key || (c.id || c.name) === key);
            if (targetC) {
              if (isPlacementPhase) {
                // Placement phase: only update position without tracking movement cost
                // Use strict ID match only — prevents same-named monsters from all moving together
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
                // Combat phase: track movement cost via trail
                // Use strict ID match only — prevents same-named monsters from all moving together
                const trailSquares = Math.max(0, dragTrailRef.current.length - 1);
                const trailCostMeters = trailSquares * 1.5;

                const nextCombatants = activeCombatants.map((c) => {
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

                if (callbacksRef.current.onUpdateCombatants) {
                  callbacksRef.current.onUpdateCombatants(nextCombatants);
                }
              }
            }
          }
        }

        // Clear visual trail mesh
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
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    // Inicializar o RangedAttackSplineSystem na cena 3D
    const splineSys = new RangedAttackSplineSystem(scene);
    splineSystemRef.current = splineSys;

    // Animation loop
    let animId: number;
    let lastTime = performance.now();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();
      if (skyDomeRef.current) {
        const {
          timeOfDayHour: h,
          timeOfDayPreset: p,
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
        skyDomeRef.current.update(h, p, f, r, ms, ml, ma, malt, ss, st, sr, mc, mg);

        // Align directional light with sun position for accurate shadows & specular highlights
        if (dirLightRef.current && skyDomeRef.current.sunPosition) {
          dirLightRef.current.position.copy(skyDomeRef.current.sunPosition);
        }
      }
      if (cloudSystemRef.current) {
        const { timeOfDayPreset: p, cloudDensity: cd, timeOfDayHour: h } = envRef.current;
        cloudSystemRef.current.update(delta, p, cd, h);
      }
      if (rainSysRef.current) rainSysRef.current.update(delta);
      if (groundFogSysRef.current) groundFogSysRef.current.update(delta);

      // Animar e projetar o Badge de Distância da Trajetória Spline Curva
      if (splineSystemRef.current) {
        splineSystemRef.current.animate(delta);
        const screenPos = splineSystemRef.current.getMidpointScreenPos(camera, container.clientWidth, container.clientHeight);
        setBadgeScreenPos(screenPos);
      }

      renderer.render(scene, camera);
    };
    animate();

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
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      domElem.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
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
    } = internalEnv;

    const env = applySceneEnvironment(
      sceneRef.current,
      timeOfDayHour,
      timeOfDayPreset,
      hasFog,
      hasRain,
      cloudDensity,
      moonSize,
      moonOffsetAngle,
      moonAltitude,
      sunSize,
      sunLightIntensity,
      ambientLightIntensity,
      globalFogDensity
    );

    // Dynamically adjust ambient light intensity and color
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = env.ambientIntensity;
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
        mieDirectionalG
      );
    }

    if (cloudSystemRef.current) {
      cloudSystemRef.current.update(0.016, timeOfDayPreset, cloudDensity, timeOfDayHour);
    }

    if (hasRain || timeOfDayPreset === 'storm') {
      if (!rainSysRef.current) {
        rainSysRef.current = createRainParticleSystem(sceneRef.current);
      }
      rainSysRef.current.updateParams({
        intensity: rainIntensity,
        speed: rainSpeed,
        dropSize: rainDropSize,
        windAngle: windAngle,
        windStrength: windStrength
      });
    } else if (rainSysRef.current) {
      rainSysRef.current.dispose();
      rainSysRef.current = null;
    }

    if (hasFog || timeOfDayPreset === 'fog' || timeOfDayPreset === 'storm') {
      if (!groundFogSysRef.current) {
        groundFogSysRef.current = createGroundFogSystem(sceneRef.current);
      }
      groundFogSysRef.current.updateParams({
        intensity: groundFogDensity,
        height: groundFogHeight,
        speed: groundFogSpeed
      });
    } else if (groundFogSysRef.current) {
      groundFogSysRef.current.dispose();
      groundFogSysRef.current = null;
    }
  }, [internalEnv]);

  // Handle floor texture updates dynamically
  useEffect(() => {
    if (!floorMatRef.current) return;

    if (floorTextureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(floorTextureUrl, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        if (floorMatRef.current) {
          floorMatRef.current.map = texture;
          floorMatRef.current.emissive = new THREE.Color(0xffffff);
          floorMatRef.current.emissiveMap = texture;
          floorMatRef.current.emissiveIntensity = 0.6;
          floorMatRef.current.needsUpdate = true;
        }
      });
    } else {
      // Clear texture — revert to solid color floor
      if (floorMatRef.current.map) {
        floorMatRef.current.map.dispose();
        floorMatRef.current.map = null;
      }
      if (floorMatRef.current.emissiveMap) {
        floorMatRef.current.emissiveMap.dispose();
        floorMatRef.current.emissiveMap = null;
      }
      floorMatRef.current.emissive = new THREE.Color(0x000000);
      floorMatRef.current.emissiveIntensity = 0;
      floorMatRef.current.needsUpdate = true;
    }
  }, [floorTextureUrl]);

  // 3. Sync token meshes on state updates
  useEffect(() => {
    syncTokens();
  }, [syncTokens]);

  // Reachable movement range highlighting meshes dynamically
  useEffect(() => {
    if (isPlacementPhase || isDraggingRef.current) return;

    const activeC = combatants[currentTurnIndex];
    if (!activeC) return;

    const cPos = getCombatantPos(activeC.id || activeC.name);
    const currentX = cPos.x;
    const currentZ = cPos.z;
    const speedVal = getSpeedInMeters(activeC.speed || activeC.notes) * (activeC.hasDashed ? 2 : 1);
    const remainingMovement = Math.max(0, speedVal - (activeC.movementUsed || 0));

    renderMovementHighlights(currentX, currentZ, remainingMovement);
  }, [combatants, currentTurnIndex, isPlacementPhase, getCombatantPos, renderMovementHighlights]);

  // 3.5 Smoothly auto-center 3D camera on active turn combatant on turn change
  const prevTurnIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlacementPhase) return;
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
        className="w-full h-full absolute inset-0"
        style={{
          cursor: pendingAttack ? swordCursorUrl : 'grab',
        }}
        onMouseDown={(e) => { if (!pendingAttack) e.currentTarget.style.cursor = 'grabbing'; }}
        onMouseUp={(e) => { if (!pendingAttack) e.currentTarget.style.cursor = 'grab'; }}
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
        groundFogDensity={internalEnv.groundFogDensity}
        groundFogHeight={internalEnv.groundFogHeight}
        groundFogSpeed={internalEnv.groundFogSpeed}
        globalFogDensity={internalEnv.globalFogDensity}
        onRotateSelected={handleRotateSelected}
        onSelectCameraPreset={handleSelectCameraPreset}
        onEnvironmentChange={handleEnvironmentChange}
        onTimeOfDayChange={onTimeOfDayChange}
        floorTextureUrl={floorTextureUrl}
        onFloorTextureChange={onFloorTextureChange}
        onConfirmPlacement={onConfirmPlacement}
        onAttackTarget={pendingAttack ? undefined : (target) => {
          if (propOnAttackTarget) {
            propOnAttackTarget(target);
          } else if (onSelectTarget) {
            onSelectTarget(target);
          }
        }}
        onToggleHelp={() => setShowHelpModal(true)}
      />

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
              <li>• <strong className="text-white">Arrastar Personagem:</strong> Clique no token do seu personagem e arraste para posicionar no grid 3D.</li>
              <li>• <strong className="text-white">Girar Direção:</strong> Selecione o personagem e use os botões 45° no painel inferior para definir a direção de frente.</li>
              <li>• <strong className="text-white">Selecionar Alvo de Ataque:</strong> Clique na miniatura de um inimigo para marcá-lo como alvo e ativar ações de combate.</li>
              <li>• <strong className="text-white">Mover Câmera:</strong> Arraste o mouse no espaço vazio do grid para girar a câmera.</li>
              <li>• <strong className="text-white">Zoom:</strong> Use a roda do mouse (scroll) para aproximar ou afastar.</li>
              <li>• <strong className="text-white">Presets de Câmera & Clima:</strong> Alterne entre visão Tática, Cinemática ou Top-Down e mude a iluminação/chuva pelo menu superior.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};



