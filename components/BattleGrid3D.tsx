'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Combatant } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useBattleGridState } from '@/lib/hooks/useBattleGridState';
import { applySceneEnvironment } from './battle-3d/BattleEnvironment';
import { setupCameraAndOrbit, DEFAULT_CAMERA_PRESETS } from './battle-3d/BattleCameraControls';
import { createTokenMesh, updateTokenMeshState, TokenMeshOptions } from './battle-3d/Token3DMesh';
import { createBattleSkyDome, SkyDomeInstance } from './battle-3d/BattleSkyDome';
import { createRainParticleSystem } from './battle-3d/WeatherEffects';
import { BattleControlsToolbar } from './battle-3d/BattleControlsToolbar';
import { disposeHierarchy } from '@/lib/3d-asset-manager';
import { HelpCircle, X } from 'lucide-react';

export interface BattleGrid3DProps {
  combatants: Combatant[];
  currentTurnIndex?: number;
  selectedTargetId?: string;
  onSelectTarget?: (c: Combatant) => void;
  onSelectCombatant?: (c: Combatant) => void;
  onUpdateCombatants?: (updated: Combatant[]) => void;
  interactive?: boolean;
  isPlacementPhase?: boolean;
  setupMode?: 'normal' | 'player_ambush' | 'player_surprised';
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
  timeOfDayHour?: number;
  hasFog?: boolean;
  hasRain?: boolean;
  onTimeOfDayChange?: (time: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => void;
  onEnvironmentChange?: (env: { timeOfDayHour: number; hasFog: boolean; hasRain: boolean }) => void;
  onConfirmPlacement?: () => void;
  userRole?: 'dm' | 'player';
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
  timeOfDayPreset = 'day',
  timeOfDayHour = 12,
  hasFog = false,
  hasRain = false,
  onTimeOfDayChange,
  onEnvironmentChange,
  onConfirmPlacement,
  userRole,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { roleMode, user } = useAuth();
  const { campaignMembers } = useCampaign();
  const {
    tokenPositions3D,
    updateTokenPosition3D,
    tokenRotations3D,
    updateTokenRotation3D,
  } = useLiveCockpit();

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
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    setTargetIdState(propSelectedTargetId);
  }, [propSelectedTargetId]);

  // Three.js persistent references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const tokenGroupRef = useRef<THREE.Group | null>(null);
  const tokenMeshMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const rainSysRef = useRef<ReturnType<typeof createRainParticleSystem> | null>(null);
  const skyDomeRef = useRef<SkyDomeInstance | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  
  // Environment ref to avoid stale closures in the animate loop
  const envRef = useRef({ timeOfDayHour, timeOfDayPreset, hasFog, hasRain });

  useEffect(() => {
    envRef.current = { timeOfDayHour, timeOfDayPreset, hasFog, hasRain };
  }, [timeOfDayHour, timeOfDayPreset, hasFog, hasRain]);

  // Dragging state references
  const isDraggingRef = useRef(false);
  const draggedTokenKeyRef = useRef<string | null>(null);
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const planeIntersectPoint = useRef(new THREE.Vector3());

  const callbacksRef = useRef({
    combatants,
    setSelectedCombatantId,
    onSelectCombatant,
    onSelectTarget,
    canUserControlCombatant,
    updateTokenPosition3D,
    onUpdateCombatants,
    setLocalPositions,
  });

  useEffect(() => {
    callbacksRef.current = {
      combatants,
      setSelectedCombatantId,
      onSelectCombatant,
      onSelectTarget,
      canUserControlCombatant,
      updateTokenPosition3D,
      onUpdateCombatants,
      setLocalPositions,
    };
  });

  // Sync token meshes to current combatant state
  const syncTokens = useCallback(() => {
    const tokenGroup = tokenGroupRef.current;
    if (!tokenGroup) return;

    const activeKeys = new Set(combatants.map((c) => c.id || c.name));

    // Remove deleted tokens
    for (const [key, group] of tokenMeshMapRef.current.entries()) {
      if (!activeKeys.has(key)) {
        tokenGroup.remove(group);
        disposeHierarchy(group);
        tokenMeshMapRef.current.delete(key);
      }
    }

    // Sync active combatants
    combatants.forEach((c, idx) => {
      const key = c.id || c.name;
      const pos = localPositions[key] || { x: (idx % 5) * 2 - 4, z: Math.floor(idx / 5) * 2 - 4 };
      const rot = localRotations[key] || 0;

      const options: TokenMeshOptions = {
        combatant: c,
        isCurrentTurn: idx === currentTurnIndex,
        isSelectedTarget: targetIdState === c.id,
        isSelectedForRotation: selectedCombatantId === key,
        isControlledByUser: canUserControlCombatant(c),
        positionX: pos.x,
        positionZ: pos.z,
        rotationAngleDeg: rot,
      };

      const existingGroup = tokenMeshMapRef.current.get(key);
      if (existingGroup) {
        updateTokenMeshState(existingGroup, options);
      } else {
        const tokenMesh = createTokenMesh(options);
        tokenGroup.add(tokenMesh);
        tokenMeshMapRef.current.set(key, tokenMesh);
      }
    });
  }, [
    combatants,
    currentTurnIndex,
    targetIdState,
    selectedCombatantId,
    localPositions,
    localRotations,
    canUserControlCombatant,
  ]);

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
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    // Grid Floor Helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x38bdf8, 0x334155);
    scene.add(gridHelper);

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

    // Skysphere Dome
    const skyDome = createBattleSkyDome(scene);
    skyDomeRef.current = skyDome;
    skyDome.update(timeOfDayHour, timeOfDayPreset, hasFog, hasRain);

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
            setSelectedCombatantId: setSel,
            onSelectCombatant: onSelC,
            onSelectTarget: onSelT,
            canUserControlCombatant: canControl
          } = callbacksRef.current;

          const clicked = activeCombatants.find((c) => (c.id || c.name) === targetKey);
          if (clicked) {
            setSel(targetKey);
            if (onSelC) onSelC(clicked);

            if (canControl(clicked)) {
              isDraggingRef.current = true;
              draggedTokenKeyRef.current = targetKey;
              controls.enabled = false; // Desativa a rotação da câmera durante o arrasto do token
            } else {
              setTargetIdState(clicked.id);
              if (onSelT) onSelT(clicked);
            }
          }
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || !draggedTokenKeyRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(groundPlane.current, planeIntersectPoint.current)) {
        const key = draggedTokenKeyRef.current;
        // Snap ao grid 3D (passo de 1 unidade)
        const snappedX = Math.round(planeIntersectPoint.current.x);
        const snappedZ = Math.round(planeIntersectPoint.current.z);

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
        isDraggingRef.current = false;
        draggedTokenKeyRef.current = null;
        controls.enabled = true; // Reativa a câmera OrbitControls
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      if (skyDomeRef.current) {
        const { timeOfDayHour: h, timeOfDayPreset: p, hasFog: f, hasRain: r } = envRef.current;
        skyDomeRef.current.update(h, p, f, r);
      }
      if (rainSysRef.current) rainSysRef.current.update();
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
      controls.dispose();
      if (skyDomeRef.current) {
        skyDomeRef.current.dispose();
        skyDomeRef.current = null;
      }
      if (rainSysRef.current) {
        rainSysRef.current.dispose();
        rainSysRef.current = null;
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

  // 2. Update Scene Environment (Lighting / Fog / Rain / SkyDome) dynamically
  useEffect(() => {
    if (!sceneRef.current) return;

    const env = applySceneEnvironment(sceneRef.current, timeOfDayHour, timeOfDayPreset, hasFog, hasRain);

    // Dynamically adjust ambient light intensity and color
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = env.ambientIntensity;
    }

    // Dynamically adjust directional light intensity, color, and sun angle
    if (dirLightRef.current) {
      dirLightRef.current.intensity = env.sunIntensity;
      dirLightRef.current.color.set(env.sunColor);

      // Procedural Sun angle position based on the timeOfDayHour prop
      const angle = ((timeOfDayHour - 6) % 24) * (Math.PI / 12); // peak at 12pm, sunrise at 6am
      const x = 18 * Math.cos(angle);
      const y = 18 * Math.sin(angle);
      dirLightRef.current.position.set(x, Math.max(3, y), 10);
    }

    if (skyDomeRef.current) {
      skyDomeRef.current.update(timeOfDayHour, timeOfDayPreset, hasFog, hasRain);
    }

    if (hasRain || timeOfDayPreset === 'storm') {
      if (!rainSysRef.current) {
        rainSysRef.current = createRainParticleSystem(sceneRef.current);
      }
    } else if (rainSysRef.current) {
      rainSysRef.current.dispose();
      rainSysRef.current = null;
    }
  }, [timeOfDayHour, timeOfDayPreset, hasFog, hasRain]);

  // 3. Sync token meshes on state updates
  useEffect(() => {
    syncTokens();
  }, [syncTokens]);

  // Camera preset switcher
  const handleSelectCameraPreset = (presetKey: 'tactical' | 'cinematic' | 'topDown') => {
    const preset = DEFAULT_CAMERA_PRESETS[presetKey];
    if (preset && cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(...preset.position);
      controlsRef.current.target.set(...preset.lookAt);
      controlsRef.current.update();
    }
  };

  const selectedCombatant = combatants.find(
    (c) => (c.id || c.name) === selectedCombatantId
  );
  const selectedTarget = combatants.find(
    (c) => c.id === targetIdState
  );
  const selectedRotation = selectedCombatantId
    ? localRotations[selectedCombatantId] || 0
    : 0;

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 select-none">
      <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Modular Battle Controls Toolbar (Top & Bottom HUD Overlay) */}
      <BattleControlsToolbar
        isDm={isDm}
        isPlacementPhase={isPlacementPhase}
        selectedCombatant={selectedCombatant}
        selectedTarget={selectedTarget}
        selectedRotation={selectedRotation}
        directionLabel={getDirectionLabel(selectedRotation)}
        canControlSelected={selectedCombatant ? canUserControlCombatant(selectedCombatant) : false}
        timeOfDayHour={timeOfDayHour}
        timeOfDayPreset={timeOfDayPreset}
        hasFog={hasFog}
        hasRain={hasRain}
        onRotateSelected={handleRotateSelected}
        onSelectCameraPreset={handleSelectCameraPreset}
        onEnvironmentChange={onEnvironmentChange}
        onTimeOfDayChange={onTimeOfDayChange}
        onConfirmPlacement={onConfirmPlacement}
        onAttackTarget={(target) => {
          if (onSelectTarget) onSelectTarget(target);
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



