'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HelpCircle, Sun, Moon, Sunrise, Sunset, CloudRain, CloudFog, Zap, Settings, X, RotateCcw, RotateCw } from 'lucide-react';
import { Combatant, CampaignMember } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';

interface BattleGrid3DProps {
  combatants: Combatant[];
  currentTurnIndex?: number;
  selectedTargetId?: string;
  onSelectTarget?: (c: Combatant) => void;
  onSelectCombatant?: (c: Combatant) => void;
  interactive?: boolean;
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

const getMonsterModelUrl = (name: string): string | null => {
  const norm = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Goblin Arqueiro / Goblin Archer / Arqueiro
  if (norm.includes('arqueiro') || norm.includes('archer')) {
    return '/assets/3d/monsters/Goblin Arqueiro/Goblin Arqueiro.glb';
  }

  // Líder Goblin / Líder Hobgoblin / Goblin Boss / Lider / Chefe
  if (
    norm.includes('lider') ||
    norm.includes('boss') ||
    norm.includes('hobgoblin') ||
    norm.includes('chefe')
  ) {
    return '/assets/3d/monsters/Líder Hobgoblin/Líder Hobgoblin.glb';
  }

  // Goblin padrão
  if (norm.includes('goblin')) {
    return '/assets/3d/monsters/Goblin/Goblin.glb';
  }

  // Esqueleto / Skeleton
  if (norm.includes('esqueleto') || norm.includes('skeleton')) {
    return '/assets/3d/monsters/Esqueleto/Esqueleto.glb';
  }

  return null;
};

export const BattleGrid3D: React.FC<BattleGrid3DProps> = ({
  combatants,
  currentTurnIndex = 0,
  selectedTargetId,
  onSelectTarget,
  onSelectCombatant,
  interactive = true,
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

  // Selected combatant for rotation anchors
  const [selectedCombatantId, setSelectedCombatantId] = useState<string | null>(null);

  // Local state for integer grid cell coordinates { x: gridX, z: gridZ }
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; z: number }>>({});

  // Local state for token rotations in degrees
  const [localRotations, setLocalRotations] = useState<Record<string, number>>({});
  const rotationsRef = useRef<Record<string, number>>(localRotations);
  const selectedIdRef = useRef<string | null>(selectedCombatantId);
  const tokenRotations3DRef = useRef<Record<string, number>>(tokenRotations3D);
  const updateTokenRotation3DRef = useRef(updateTokenRotation3D);
  const canUserControlCombatantRef = useRef<(c: Combatant | undefined) => boolean>(() => false);

  // Sync rotation refs with latest state
  useEffect(() => {
    rotationsRef.current = localRotations;
  }, [localRotations]);

  useEffect(() => {
    selectedIdRef.current = selectedCombatantId;
  }, [selectedCombatantId]);

  useEffect(() => {
    tokenRotations3DRef.current = tokenRotations3D;
  }, [tokenRotations3D]);

  useEffect(() => {
    updateTokenRotation3DRef.current = updateTokenRotation3D;
  }, [updateTokenRotation3D]);

  // Permission Check: Mestre pode girar todos, Player apenas o seu próprio personagem
  const canUserControlCombatant = (c: Combatant | undefined): boolean => {
    if (!c) return false;
    if (roleMode === 'dm') return true;
    if (c.type !== 'player') return false;

    const userDispName = (user?.displayName || '').toLowerCase().trim();
    const combatantName = (c.name || '').toLowerCase().trim();

    if (userDispName && (combatantName.includes(userDispName) || userDispName.includes(combatantName))) return true;

    if (user?.id && campaignMembers && campaignMembers.length > 0) {
      const myMember = campaignMembers.find((m: CampaignMember) => m.userId === user.id);
      if (myMember) {
        if (myMember.role === 'dm') return true;
        if (
          myMember.displayName &&
          (combatantName.includes(myMember.displayName.toLowerCase()) ||
            myMember.displayName.toLowerCase().includes(combatantName))
        ) {
          return true;
        }
      }
    }

    try {
      const saved =
        localStorage.getItem('masters_codex_character_sheets_v1') ||
        localStorage.getItem('codex_character_sheets_v1');
      if (saved) {
        const sheets = JSON.parse(saved);
        if (Array.isArray(sheets) && sheets.length > 0) {
          const matches = sheets.some((s: any) => {
            const sName = (s.characterName || '').toLowerCase().trim();
            return sName && (combatantName.includes(sName) || sName.includes(combatantName));
          });
          if (matches) return true;
        }
      }
    } catch (e) {}

    return true;
  };

  canUserControlCombatantRef.current = canUserControlCombatant;

  const handleRotatePawn = (combatantId: string, deltaDeg: number) => {
    const currentDeg = rotationsRef.current[combatantId] ?? tokenRotations3DRef.current[combatantId] ?? 0;
    const nextDeg = ((currentDeg + deltaDeg) % 360 + 360) % 360;

    setLocalRotations((prev) => ({ ...prev, [combatantId]: nextDeg }));
    rotationsRef.current[combatantId] = nextDeg;
    if (updateTokenRotation3DRef.current) {
      updateTokenRotation3DRef.current(combatantId, nextDeg);
    }
  };

  const handleSetPawnAngle = (combatantId: string, targetDeg: number) => {
    const nextDeg = ((targetDeg % 360) + 360) % 360;
    setLocalRotations((prev) => ({ ...prev, [combatantId]: nextDeg }));
    rotationsRef.current[combatantId] = nextDeg;
    if (updateTokenRotation3DRef.current) {
      updateTokenRotation3DRef.current(combatantId, nextDeg);
    }
  };

  // Environmental Control State (0 to 24 hours)
  const [timeOfDay, setTimeOfDay] = useState<number>(12); // Default noon
  const [isEnvMenuOpen, setIsEnvMenuOpen] = useState<boolean>(false); // Collapsed by default
  const timeOfDayRef = useRef<number>(timeOfDay);

  useEffect(() => {
    timeOfDayRef.current = timeOfDay;
  }, [timeOfDay]);

  // Refs for WebGL animation loop without re-creating WebGL Context
  const combatantsRef = useRef<Combatant[]>(combatants);
  const positionsRef = useRef<Record<string, { x: number; z: number }>>(localPositions);
  const turnIdxRef = useRef<number>(currentTurnIndex);
  const targetIdRef = useRef<string | undefined>(selectedTargetId);
  const onSelectTargetRef = useRef(onSelectTarget);
  const onSelectCombatantRef = useRef(onSelectCombatant);

  // Sync refs with latest props
  useEffect(() => {
    combatantsRef.current = combatants;
  }, [combatants]);

  useEffect(() => {
    turnIdxRef.current = currentTurnIndex;
  }, [currentTurnIndex]);

  useEffect(() => {
    targetIdRef.current = selectedTargetId;
  }, [selectedTargetId]);

  useEffect(() => {
    onSelectTargetRef.current = onSelectTarget;
    onSelectCombatantRef.current = onSelectCombatant;
  }, [onSelectTarget, onSelectCombatant]);

  // Initialize integer grid cell coordinates for each combatant id
  useEffect(() => {
    const nextPositions: Record<string, { x: number; z: number }> = {};

    combatants.forEach((c, idx) => {
      const globalPos = tokenPositions3D[c.id];
      if (globalPos) {
        nextPositions[c.id] = globalPos;
      } else {
        const initPos =
          c.type === 'player'
            ? { x: (idx % 5) - 2, z: 2 }
            : { x: (idx % 4) - 2, z: -2 - Math.floor(idx / 4) };
        nextPositions[c.id] = initPos;
        updateTokenPosition3D(c.id, undefined, undefined, initPos.x, initPos.z);
      }
    });

    setLocalPositions(nextPositions);
    positionsRef.current = nextPositions;
  }, [combatants, tokenPositions3D]);

  // Listen to movement and rotation events via BroadcastChannel & window events
  useEffect(() => {
    const applyTokenMove = (data: any) => {
      if (!data || data.type !== 'TOKEN_MOVE_3D') return;

      const { combatantId, characterName, deltaX, deltaZ, newX, newZ } = data;
      const curCombatants = combatantsRef.current;

      let targetId = combatantId;
      if (curCombatants.length > 0 && !curCombatants.some((c) => c.id === targetId)) {
        const found = curCombatants.find(
          (c) =>
            (characterName && c.name.toLowerCase() === characterName.toLowerCase()) ||
            (combatantId && c.name.toLowerCase() === combatantId.toLowerCase())
        );
        if (found) {
          targetId = found.id;
        }
      }

      if (!targetId) return;

      setLocalPositions((prev) => {
        const current = prev[targetId] || { x: 0, z: 0 };
        const nextX = newX !== undefined ? newX : Math.max(-5, Math.min(5, current.x + (deltaX || 0)));
        const nextZ = newZ !== undefined ? newZ : Math.max(-5, Math.min(5, current.z + (deltaZ || 0)));
        const updated = { ...prev, [targetId]: { x: nextX, z: nextZ } };
        positionsRef.current = updated;
        return updated;
      });
    };

    const applyTokenRotate = (data: any) => {
      if (!data || data.type !== 'TOKEN_ROTATE_3D') return;

      const { combatantId, characterName, angle } = data;
      const curCombatants = combatantsRef.current;

      let targetId = combatantId;
      if (curCombatants.length > 0 && !curCombatants.some((c) => c.id === targetId)) {
        const found = curCombatants.find(
          (c) =>
            (characterName && c.name.toLowerCase() === characterName.toLowerCase()) ||
            (combatantId && c.name.toLowerCase() === combatantId.toLowerCase())
        );
        if (found) {
          targetId = found.id;
        }
      }

      if (!targetId || angle === undefined) return;

      setLocalRotations((prev) => {
        const updated = { ...prev, [targetId]: angle };
        rotationsRef.current = updated;
        return updated;
      });
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('masters_codex_sync');
      bc.onmessage = (event) => {
        applyTokenMove(event.data);
        applyTokenRotate(event.data);
      };
    } catch (e) { }

    const handleLocalMoveEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      applyTokenMove(customEvt.detail);
    };

    const handleLocalRotateEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      applyTokenRotate(customEvt.detail);
    };

    window.addEventListener('masters_codex_token_move_3d', handleLocalMoveEvent);
    window.addEventListener('masters_codex_token_rotate_3d', handleLocalRotateEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('masters_codex_token_move_3d', handleLocalMoveEvent);
      window.removeEventListener('masters_codex_token_rotate_3d', handleLocalRotateEvent);
    };
  }, []);

  // Three.js Render Loop & WebGL Setup (Created ONCE per mount to prevent WebGL Context exhaustion!)
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = null; // Allows Sky Sphere 3D to show through seamlessly
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.005);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 11, 13);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 3D Game Sky Dome (Dynamic Canvas Texture with Horizon Clouds)
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 512;
    skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext('2d')!;

    const skyTexture = new THREE.CanvasTexture(skyCanvas);
    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false, // Ensures Three.js fog NEVER washes out or recolors the sky texture!
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 4.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444477, 3.0);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 5.0);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 15);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    let lastRenderedTime = -1;

    const getSkyGradientColors = (t: number) => {
      // t is 0..24
      if (t >= 4 && t < 7) {
        // Alvorada / Early Morning (04:00 - 07:00)
        // Transição: Azul noturno no topo -> Azul royal no meio -> Dourado quente no horizonte
        const p = (t - 4) / 3;
        return {
          zenith: '#090d16',
          midSky: '#1e3a8a',
          horizon: p > 0.5 ? '#ea580c' : '#d97706',
          horizonLine: '#fef08a',
        };
      } else if (t >= 7 && t < 10) {
        // Manhã (07:00 - 10:00)
        // Transição: Azul celestial -> Azul ciano radiante -> Névoa azul clara
        return {
          zenith: '#1e40af',
          midSky: '#0284c7',
          horizon: '#38bdf8',
          horizonLine: '#bae6fd',
        };
      } else if (t >= 10 && t < 16.5) {
        // Dia Pleno (10:00 - 16:30)
        // Céu azul radiante cristalino de jogo RPG 3D
        return {
          zenith: '#1d4ed8',
          midSky: '#2563eb',
          horizon: '#38bdf8',
          horizonLine: '#e0f2fe',
        };
      } else if (t >= 16.5 && t < 19.5) {
        // Pôr do Sol (16:30 - 19:30)
        // Azul noite no topo -> Carmesim/Âmbar no meio -> Dourado radiante no horizonte
        return {
          zenith: '#0f172a',
          midSky: '#1e3a8a',
          horizon: '#c2410c',
          horizonLine: '#f97316',
        };
      } else {
        // Noite (19:30 - 04:00) - CÉU AZUL ESCURO NOTURNO (Zero Roxo!)
        return {
          zenith: '#020617',
          midSky: '#090d16',
          horizon: '#0f172a',
          horizonLine: '#1e3a8a',
        };
      }
    };

    const updateEnvironment = (time: number) => {
      const sunAngle = ((time - 6) / 24) * Math.PI * 2;
      const sunX = Math.cos(sunAngle) * 80;
      const sunY = Math.sin(sunAngle) * 80;
      const sunZ = 30;

      // Redraw sky canvas texture if time changed (> 0.05h or initial render)
      if (Math.abs(time - lastRenderedTime) > 0.05) {
        lastRenderedTime = time;

        skyCtx.clearRect(0, 0, 512, 512);
        const grad = skyCtx.createLinearGradient(0, 0, 0, 512);
        const colors = getSkyGradientColors(time);

        // Top half (Zenith to Horizon): Rich Sky Gradient
        grad.addColorStop(0.0, colors.zenith);      // Topo (Zênite)
        grad.addColorStop(0.22, colors.midSky);     // Meio do céu
        grad.addColorStop(0.44, colors.horizon);    // Próximo ao horizonte
        grad.addColorStop(0.49, colors.horizonLine); // Linha do horizonte

        // Bottom half (Below Horizon): Transition to Black
        grad.addColorStop(0.52, '#090d16'); // Logo abaixo do horizonte
        grad.addColorStop(1.0, '#000000');  // Preto absoluto na base da esfera

        skyCtx.fillStyle = grad;
        skyCtx.fillRect(0, 0, 512, 512);

        // Nuvens no horizonte para o Dia, Alvorada e Pôr do Sol
        if (time >= 4.5 && time < 19.5) {
          const isDay = time >= 7 && time < 16.5;
          const isSunrise = time >= 4.5 && time < 7;
          const cloudColor = isDay
            ? 'rgba(255, 255, 255, '
            : isSunrise
            ? 'rgba(254, 215, 170, '
            : 'rgba(251, 146, 60, ';

          const cloudY = 245; // Exatamente na linha do horizonte (centro do canvas)

          skyCtx.fillStyle = cloudColor + '0.45)';
          const clouds = [
            { x: 30, y: cloudY - 12, rx: 75, ry: 20 },
            { x: 95, y: cloudY - 16, rx: 95, ry: 26 },
            { x: 175, y: cloudY - 8, rx: 65, ry: 16 },
            { x: 255, y: cloudY - 18, rx: 115, ry: 30 },
            { x: 355, y: cloudY - 12, rx: 90, ry: 22 },
            { x: 450, y: cloudY - 14, rx: 100, ry: 26 },
            { x: 85, y: cloudY - 35, rx: 55, ry: 15 },
            { x: 235, y: cloudY - 40, rx: 80, ry: 20 },
            { x: 395, y: cloudY - 36, rx: 70, ry: 16 },
          ];

          clouds.forEach((c) => {
            skyCtx.beginPath();
            skyCtx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
            skyCtx.fill();
          });

          skyCtx.fillStyle = cloudColor + '0.7)';
          clouds.slice(0, 5).forEach((c) => {
            skyCtx.beginPath();
            skyCtx.ellipse(c.x + 8, c.y - 6, c.rx * 0.65, c.ry * 0.55, 0, 0, Math.PI * 2);
            skyCtx.fill();
          });
        } else {
          // Estrelas brilhantes na Noite no topo da esfera
          skyCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          const stars = [
            [50, 40], [120, 80], [200, 30], [280, 90], [350, 45], [420, 110], [480, 25],
            [90, 150], [160, 120], [240, 170], [310, 130], [390, 160], [460, 140],
            [30, 200], [110, 210], [190, 180], [270, 220], [360, 190], [440, 205],
          ];
          stars.forEach(([sx, sy]) => {
            skyCtx.beginPath();
            skyCtx.arc(sx, sy, 1.2, 0, Math.PI * 2);
            skyCtx.fill();
          });
        }

        skyTexture.needsUpdate = true;
      }

      // Lighting and Fog parameters
      const lightColor = new THREE.Color();
      const ambientColor = new THREE.Color();
      const fogColor = new THREE.Color();
      let lightIntensity = 5.5;
      let ambientIntensity = 4.0;
      let fogDensity = 0.003;

      if (time >= 4 && time < 7) {
        lightColor.set(0xffa726);
        ambientColor.set(0xffcc80);
        fogColor.set(0x1e3a8a);
        lightIntensity = 3.5;
        ambientIntensity = 2.5;
      } else if (time >= 7 && time < 16.5) {
        // Dia: Iluminação limpa e neblina sutil azul
        lightColor.set(0xffffff);
        ambientColor.set(0xe2e8f0);
        fogColor.set(0xbae6fd);
        lightIntensity = 5.5;
        ambientIntensity = 4.0;
        fogDensity = 0.003;
      } else if (time >= 16.5 && time < 19.5) {
        lightColor.set(0xe11d48);
        ambientColor.set(0x9a3412);
        fogColor.set(0x1e1b4b);
        lightIntensity = 3.0;
        ambientIntensity = 2.0;
      } else {
        // Noite: Luz e neblina azul noturno escuro (Zero Roxo!)
        lightColor.set(0x3b82f6);
        ambientColor.set(0x1e293b);
        fogColor.set(0x090d16);
        lightIntensity = 1.2;
        ambientIntensity = 1.2;
        fogDensity = 0.008;
      }

      scene.background = null;
      if (scene.fog && scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(fogColor);
        scene.fog.density = fogDensity;
      }

      dirLight.position.set(sunX, Math.max(-20, sunY), sunZ);
      dirLight.color.copy(lightColor);
      dirLight.intensity = lightIntensity;

      ambientLight.color.copy(ambientColor);
      ambientLight.intensity = ambientIntensity;
    };

    // Grid Floor (1.5m per cell)
    const gridSize = 12;
    const cellSize = 1.5;
    const gridTotalSize = gridSize * cellSize;

    const floorGeo = new THREE.PlaneGeometry(gridTotalSize, gridTotalSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x121824,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const gridHelper = new THREE.GridHelper(gridTotalSize, gridSize, 0xf59e0b, 0x2a3449);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Pins Container Group
    const pinsGroup = new THREE.Group();
    scene.add(pinsGroup);

    const meshesMap: { [id: string]: THREE.Group } = {};

    // Orbit & Pan Camera Controls (Blender / Unreal style)
    let isDragging = false;
    let dragMode: 'orbit' | 'pan' = 'orbit';
    let previousMousePosition = { x: 0, y: 0 };
    let cameraAngleX = 0;
    let cameraAngleY = Math.PI / 4;
    let cameraDistance = 15;
    let targetPos = { x: 0, y: 0, z: 0 };

    const updateCameraPosition = () => {
      camera.position.x = targetPos.x + cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
      camera.position.z = targetPos.z + cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
      camera.position.y = targetPos.y + cameraDistance * Math.sin(cameraAngleY);
      camera.lookAt(targetPos.x, targetPos.y + 0.5, targetPos.z);
    };
    updateCameraPosition();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };

      // Button 1 (Middle Mouse / Scroll wheel click) or Shift + Left Click -> Pan scenario
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        dragMode = 'pan';
        e.preventDefault();
      } else {
        dragMode = 'orbit';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (dragMode === 'pan') {
        const rightX = Math.cos(cameraAngleX);
        const rightZ = -Math.sin(cameraAngleX);
        const forwardX = -Math.sin(cameraAngleX);
        const forwardZ = -Math.cos(cameraAngleX);

        const panSpeed = cameraDistance * 0.002;

        targetPos.x -= (rightX * deltaX - forwardX * deltaY) * panSpeed;
        targetPos.z -= (rightZ * deltaX - forwardZ * deltaY) * panSpeed;

        targetPos.x = Math.max(-25, Math.min(25, targetPos.x));
        targetPos.z = Math.max(-25, Math.min(25, targetPos.z));
      } else {
        cameraAngleX -= deltaX * 0.008;
        cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2.2, cameraAngleY + deltaY * 0.008));
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistance = Math.max(2, Math.min(50, cameraDistance + e.deltaY * 0.01));
      updateCameraPosition();
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onDblClick = () => {
      targetPos.x = 0;
      targetPos.y = 0;
      targetPos.z = 0;
      updateCameraPosition();
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClickCanvas = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = domElem.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinsGroup.children, true);

      if (intersects.length > 0) {
        // 1. Direct hit on 3D rotation anchor handle
        let hitAnchor: THREE.Object3D | null = null;
        for (const hit of intersects) {
          if (hit.object.userData && hit.object.userData.isRotationAnchor) {
            hitAnchor = hit.object;
            break;
          }
        }

        if (hitAnchor) {
          const { action, combatantId } = hitAnchor.userData;
          const currentDeg = rotationsRef.current[combatantId] ?? tokenRotations3DRef.current[combatantId] ?? 0;
          const delta = action === 'rotate_left' ? -45 : 45;
          const nextDeg = ((currentDeg + delta) % 360 + 360) % 360;

          setLocalRotations((prev) => ({ ...prev, [combatantId]: nextDeg }));
          rotationsRef.current[combatantId] = nextDeg;
          if (updateTokenRotation3DRef.current) {
            updateTokenRotation3DRef.current(combatantId, nextDeg);
          }
          return;
        }

        // 2. Click on combatant pawn
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData.combatantId && obj.parent && obj.parent !== pinsGroup) {
          obj = obj.parent;
        }
        if (obj && obj.userData.combatantId) {
          const found = combatantsRef.current.find((c) => c.id === obj!.userData.combatantId);
          if (found) {
            setSelectedCombatantId(found.id);
            if (onSelectTargetRef.current) onSelectTargetRef.current(found);
            if (onSelectCombatantRef.current) onSelectCombatantRef.current(found);
          }
        }
      } else {
        // Deselect rotation anchors when clicking empty background
        setSelectedCombatantId(null);
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', onContextMenu);
    domElem.addEventListener('dblclick', onDblClick);
    domElem.addEventListener('click', onClickCanvas);

    const resolveCombatantModelUrl = (c: Combatant): string | null => {
      // Para monstros: usar modelUrl direta ou detectar por nome
      if (c.type !== 'player') {
        if (c.modelUrl) return c.modelUrl;
        return getMonsterModelUrl(c.name);
      }

      // 1. Se o combatente de jogador já possui modelUrl definido (ex: vindo de member.modelUrl do Supabase/membro)
      if (c.modelUrl && (c.modelUrl.startsWith('/') || c.modelUrl.endsWith('.glb'))) {
        return c.modelUrl;
      }

      // 2. Para jogadores sem modelUrl no combatente: consultar a ficha salva localmente
      try {
        const saved =
          localStorage.getItem('masters_codex_character_sheets_v1') ||
          localStorage.getItem('codex_character_sheets_v1');
        if (saved) {
          const sheets: any[] = JSON.parse(saved);
          const cClean = c.name.split('(')[0].trim().toLowerCase();
          const found = sheets.find((s: any) => {
            if (!s.characterName) return false;
            const sClean = s.characterName.split('(')[0].trim().toLowerCase();
            return (
              sClean === cClean ||
              c.name.toLowerCase().includes(sClean) ||
              s.characterName.toLowerCase().includes(cClean)
            );
          });
          if (found?.modelUrl) return found.modelUrl;
          if (found?.className) return getModelUrlByNameOrPath(found.className);
        }
      } catch (e) {}

      // 3. Fallback: resolver por nome do personagem/classe
      return getModelUrlByNameOrPath(c.name);
    };

    // Dynamic Pin Mesh Generator
    const createPawnMesh = (c: Combatant) => {
      const pinGroup = new THREE.Group();
      pinGroup.userData.combatantId = c.id;
      const isPlayer = c.type === 'player';
      const baseColor = isPlayer ? 0x0284c7 : 0xe11d48;
      const ringColor = isPlayer ? 0x38bdf8 : 0xf43f5e;

      const modelUrl = resolveCombatantModelUrl(c);
      if (modelUrl) {
        // Ring indicator
        const ringGeo = new THREE.TorusGeometry(0.58, 0.04, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: ringColor });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.02;
        pinGroup.add(ringMesh);

        // Adjust scales
        const isLeader = modelUrl.includes('Líder');
        const isArcher = modelUrl.includes('Arqueiro');
        let targetSize = 2.4; // default size
        if (isLeader) targetSize = 2.1;
        else if (isArcher) targetSize = 1.8;

        // Load 3D model
        const loader = new GLTFLoader();
        const safeUrl = encodeURI(modelUrl);
        loader.load(
          safeUrl,
          (gltf) => {
            const model = gltf.scene;

            // Auto-scale based on bounding box
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            const scale = maxDim > 0 ? (targetSize / maxDim) : 1;
            model.scale.setScalar(scale);

            // Center the model horizontally, and sit it on the floor
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x * scale;
            model.position.z = -center.z * scale;
            model.position.y = -box.min.y * scale;

            // Standardize shadow and clone material for isolated damage flash
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  child.material = child.material.clone();
                  if (child.material.color) child.userData.originalColor = child.material.color.clone();
                  if (child.material.emissive) child.userData.originalEmissive = child.material.emissive.clone();
                }
              }
            });
            pinGroup.add(model);
          },
          undefined,
          (error) => console.error('Error loading model:', safeUrl, error)
        );

        return pinGroup;
      }

      const baseGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.15, 32);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.3, roughness: 0.8 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = 0.075;
      baseMesh.castShadow = true;
      pinGroup.add(baseMesh);

      const ringGeo = new THREE.TorusGeometry(0.58, 0.04, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: ringColor });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.15;
      pinGroup.add(ringMesh);

      const bodyGeo = new THREE.ConeGeometry(0.35, 0.9, 32);
      const bodyMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7, metalness: 0.2 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = 0.6;
      bodyMesh.castShadow = true;
      pinGroup.add(bodyMesh);

      const headGeo = new THREE.SphereGeometry(0.25, 32, 32);
      const headMesh = new THREE.Mesh(headGeo, bodyMat);
      headMesh.position.y = 1.15;
      headMesh.castShadow = true;
      pinGroup.add(headMesh);

      return pinGroup;
    };

    // HTML Overlay Container for Combat Text
    const overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'absolute';
    overlayDiv.style.top = '0';
    overlayDiv.style.left = '0';
    overlayDiv.style.width = '100%';
    overlayDiv.style.height = '100%';
    overlayDiv.style.pointerEvents = 'none';
    overlayDiv.style.overflow = 'hidden';
    container.appendChild(overlayDiv);

    const combatEvents: { id: string, pinGroup: THREE.Group, type: 'damage'|'heal', amount: number, age: number, el: HTMLDivElement }[] = [];

    const handleCombatText = (e: Event) => {
      const customEvt = e as CustomEvent;
      const { combatantId, type, amount } = customEvt.detail;
      const pinGroup = meshesMap[combatantId];
      if (!pinGroup) return;

      if (type === 'damage') {
         pinGroup.userData.damageTimer = 1.0;
      } else {
         pinGroup.userData.healTimer = 1.0;
      }

      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.fontWeight = '900';
      el.style.fontFamily = 'monospace';
      el.style.fontSize = '24px';
      el.style.textShadow = '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,1)';
      el.style.color = type === 'damage' ? '#f43f5e' : '#10b981';
      el.textContent = (type === 'damage' ? '-' : '+') + amount;
      overlayDiv.appendChild(el);

      combatEvents.push({ id: Math.random().toString(), pinGroup, type, amount, age: 0, el });
    };
    window.addEventListener('masters_codex_combat_text', handleCombatText);

    // Animation Loop (60 FPS)
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentList = combatantsRef.current;
      const currentPosMap = positionsRef.current;
      const turnIdx = turnIdxRef.current;

      // Update Sky Sphere & Environmental Lighting based on timeOfDay
      updateEnvironment(timeOfDayRef.current);

      // Sync 3D Pin Meshes with current combatants
      currentList.forEach((c, idx) => {
        let pinGroup = meshesMap[c.id];

        const targetModelUrl = resolveCombatantModelUrl(c);

        // Se o peão 3D já existia mas o modelo foi alterado pelo jogador, remove o peão antigo e recarrega o novo
        let previousPosition: THREE.Vector3 | null = null;
        if (pinGroup && pinGroup.userData.loadedModelUrl !== targetModelUrl) {
          previousPosition = pinGroup.position.clone();
          pinsGroup.remove(pinGroup);
          delete meshesMap[c.id];
          pinGroup = undefined as any;
        }

        if (!pinGroup) {
          pinGroup = createPawnMesh(c);
          pinGroup.userData.loadedModelUrl = targetModelUrl;
          if (previousPosition) {
            pinGroup.position.copy(previousPosition);
          } else {
            const gridPos = currentPosMap[c.id] || (c.type === 'player' ? { x: (idx % 5) - 2, z: 2 } : { x: (idx % 4) - 2, z: -2 - Math.floor(idx / 4) });
            // Center inside cell: (gridX + 0.5) * cellSize
            pinGroup.position.set((gridPos.x + 0.5) * cellSize, 0, (gridPos.z + 0.5) * cellSize);
          }
          pinsGroup.add(pinGroup);
          meshesMap[c.id] = pinGroup;
        }

        // Dynamically update Turn Halo Ring indicator on active turn combatant
        const isCurrentTurn = idx === turnIdx;
        let haloChild = pinGroup.getObjectByName('turnHalo');

        if (isCurrentTurn && !haloChild) {
          const haloGeo = new THREE.RingGeometry(0.65, 0.75, 32);
          const haloMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
          haloChild = new THREE.Mesh(haloGeo, haloMat);
          haloChild.name = 'turnHalo';
          haloChild.rotation.x = Math.PI / 2;
          haloChild.position.y = 0.02;
          pinGroup.add(haloChild);
        } else if (!isCurrentTurn && haloChild) {
          pinGroup.remove(haloChild);
        }

        // Dynamically update Target Reticle ring indicator on targeted combatant
        const isTargeted = c.id === targetIdRef.current;
        let targetReticle = pinGroup.getObjectByName('targetReticle') as THREE.Mesh;

        if (isTargeted && !targetReticle) {
          const reticleGeo = new THREE.RingGeometry(0.72, 0.85, 32);
          const reticleMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide });
          targetReticle = new THREE.Mesh(reticleGeo, reticleMat);
          targetReticle.name = 'targetReticle';
          targetReticle.rotation.x = Math.PI / 2;
          targetReticle.position.y = 0.03;
          pinGroup.add(targetReticle);
        } else if (!isTargeted && targetReticle) {
          pinGroup.remove(targetReticle);
        }

        if (targetReticle) {
          targetReticle.rotation.z += 0.02;
        }

        // Dynamically update 3D Rotation Anchors if selected and user has permission
        const isSelected = selectedIdRef.current === c.id;
        const canControl = canUserControlCombatantRef.current(c);
        let rotationAnchors = pinGroup.getObjectByName('rotationAnchorsGroup');

        if (isSelected && canControl && !rotationAnchors) {
          rotationAnchors = new THREE.Group();
          rotationAnchors.name = 'rotationAnchorsGroup';

          // Base glowing rotation ring
          const ringGeo = new THREE.TorusGeometry(0.85, 0.04, 16, 64);
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 2;
          ringMesh.position.y = 0.04;
          rotationAnchors.add(ringMesh);

          // Left Anchor Handle (CCW ↺ -45°)
          const anchorGeo = new THREE.ConeGeometry(0.14, 0.32, 16);
          const anchorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const leftAnchor = new THREE.Mesh(anchorGeo, anchorMat);
          leftAnchor.position.set(-0.85, 0.08, 0);
          leftAnchor.rotation.z = Math.PI / 2;
          leftAnchor.userData = { isRotationAnchor: true, action: 'rotate_left', combatantId: c.id };
          rotationAnchors.add(leftAnchor);

          // Right Anchor Handle (CW ↻ +45°)
          const rightAnchor = new THREE.Mesh(anchorGeo, anchorMat);
          rightAnchor.position.set(0.85, 0.08, 0);
          rightAnchor.rotation.z = -Math.PI / 2;
          rightAnchor.userData = { isRotationAnchor: true, action: 'rotate_right', combatantId: c.id };
          rotationAnchors.add(rightAnchor);

          // Front Direction Pointer (Arrow pointing forward in pawn heading)
          const pointerGeo = new THREE.ConeGeometry(0.12, 0.28, 16);
          const pointerMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          const pointerMesh = new THREE.Mesh(pointerGeo, pointerMat);
          pointerMesh.name = 'frontPointer';
          pointerMesh.position.set(0, 0.08, 0.9);
          pointerMesh.rotation.x = Math.PI / 2;
          rotationAnchors.add(pointerMesh);

          pinGroup.add(rotationAnchors);
        } else if ((!isSelected || !canControl) && rotationAnchors) {
          pinGroup.remove(rotationAnchors);
        }

        if (rotationAnchors) {
          const pointer = rotationAnchors.getObjectByName('frontPointer');
          if (pointer) {
            pointer.scale.setScalar(1 + Math.sin(Date.now() * 0.007) * 0.15);
          }
        }

        // Smoothly lerp pawn rotation.y towards target angle
        const targetDeg = rotationsRef.current[c.id] ?? tokenRotations3DRef.current[c.id] ?? 0;
        const targetRad = THREE.MathUtils.degToRad(targetDeg);

        let radDiff = targetRad - pinGroup.rotation.y;
        radDiff = Math.atan2(Math.sin(radDiff), Math.cos(radDiff));
        pinGroup.rotation.y += radDiff * 0.25;

        // Smooth Lerp to cell center (gridX + 0.5) * cellSize
        const gridPos = currentPosMap[c.id] || (c.type === 'player' ? { x: (idx % 5) - 2, z: 2 } : { x: (idx % 4) - 2, z: -2 - Math.floor(idx / 4) });
        const targetX = (gridPos.x + 0.5) * cellSize;
        const targetZ = (gridPos.z + 0.5) * cellSize;

        pinGroup.position.x += (targetX - pinGroup.position.x) * 0.25;
        pinGroup.position.z += (targetZ - pinGroup.position.z) * 0.25;

        // Visual Effects: Damage Shake & Red Flash Tint for ALL models (Procedural & GLTF/GLB)
        if (pinGroup.userData.damageTimer > 0) {
           pinGroup.userData.damageTimer -= 0.05;
           const shake = Math.sin(pinGroup.userData.damageTimer * 20) * 0.15;
           pinGroup.position.x += shake;

           const flashFactor = Math.sin(pinGroup.userData.damageTimer * Math.PI);
           const targetRed = new THREE.Color(0xff0000);

           pinGroup.traverse((child: any) => {
             if (child.isMesh && child.material) {
               // Clone material on the fly if not cloned yet
               if (!child.userData.isMaterialCloned) {
                 child.material = child.material.clone();
                 child.userData.isMaterialCloned = true;
               }

               if (!child.userData.originalColor && child.material.color) {
                 child.userData.originalColor = child.material.color.clone();
               }
               if (!child.userData.originalEmissive && child.material.emissive) {
                 child.userData.originalEmissive = child.material.emissive.clone();
               }

               // 1. Emissive glow for PBR/Standard materials (GLTF GLB)
               if (child.material.emissive) {
                 child.material.emissive.setRGB(0.9 * flashFactor, 0, 0);
               }

               // 2. Color lerp tint for Basic/Standard materials
               if (child.material.color && child.userData.originalColor) {
                 child.material.color.copy(child.userData.originalColor).lerp(targetRed, flashFactor * 0.75);
               }
             }
           });
        } else if (pinGroup.userData.damageTimer <= 0 && pinGroup.userData.damageTimer !== -999) {
           pinGroup.userData.damageTimer = -999;
           pinGroup.traverse((child: any) => {
             if (child.isMesh && child.material) {
               if (child.material.emissive && child.userData.originalEmissive) {
                 child.material.emissive.copy(child.userData.originalEmissive);
               }
               if (child.material.color && child.userData.originalColor) {
                 child.material.color.copy(child.userData.originalColor);
               }
             }
           });
        }

        // Visual Effects: Heal Aura
        if (pinGroup.userData.healTimer > 0) {
           pinGroup.userData.healTimer -= 0.025;
           let aura = pinGroup.getObjectByName('healAura') as THREE.Mesh;
           if (!aura) {
             const auraGeo = new THREE.CylinderGeometry(0.8, 0.8, 3, 32, 1, true);
             const auraMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
             aura = new THREE.Mesh(auraGeo, auraMat);
             aura.name = 'healAura';
             aura.position.y = 1.5;
             pinGroup.add(aura);
           }
           const aMat = aura.material as THREE.MeshBasicMaterial;
           aMat.opacity = pinGroup.userData.healTimer * 0.8;
           aura.scale.setScalar(1 + (1 - pinGroup.userData.healTimer) * 0.5);
        } else if (pinGroup.userData.healTimer <= 0) {
           const aura = pinGroup.getObjectByName('healAura');
           if (aura) {
             pinGroup.remove(aura);
           }
        }
      });

      // Handle Floating Texts
      const tempV = new THREE.Vector3();
      for (let i = combatEvents.length - 1; i >= 0; i--) {
        const ev = combatEvents[i];
        ev.age += 0.016; 
        if (ev.age > 1.5) {
          ev.el.remove();
          combatEvents.splice(i, 1);
          continue;
        }

        tempV.copy(ev.pinGroup.position);
        tempV.y += 2.5 + ev.age * 2.5; 
        tempV.project(camera);

        const x = (tempV.x * .5 + .5) * container.clientWidth;
        const y = (tempV.y * -.5 + .5) * container.clientHeight;

        ev.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${1 + Math.sin(ev.age * Math.PI)*0.3})`;
        ev.el.style.opacity = (1.5 - ev.age).toString();
      }

      // Remove obsolete meshes
      Object.keys(meshesMap).forEach((id) => {
        if (!currentList.some((c) => c.id === id)) {
          pinsGroup.remove(meshesMap[id]);
          delete meshesMap[id];
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      domElem.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElem.removeEventListener('wheel', onWheel);
      domElem.removeEventListener('contextmenu', onContextMenu);
      domElem.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.forceContextLoss();
      renderer.dispose();
    };
  }, []);

  const activeCombatant = combatants[currentTurnIndex];
  const selectedCombatant = combatants.find((c) => c.id === selectedCombatantId);

  const handleManualMove = (combatantId: string, dx: number, dz: number) => {
    const curPos = positionsRef.current[combatantId] || { x: 0, z: 0 };
    const nextX = Math.max(-5, Math.min(5, curPos.x + dx));
    const nextZ = Math.max(-5, Math.min(5, curPos.z + dz));

    updateTokenPosition3D(combatantId, undefined, undefined, nextX, nextZ);
  };

  return (
    <div className="w-full h-full relative bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Top Left Grid Metric Badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-auto bg-[#0f172a]/90 backdrop-blur-md border border-[#2a3449] px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-400 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>GRID 3D (1,5m / 5ft)</span>
      </div>

      {/* Rotation Anchors HUD Overlay for Selected Combatant */}
      {interactive && selectedCombatant && canUserControlCombatant(selectedCombatant) && (
        <div className="absolute top-14 left-3 z-30 pointer-events-auto bg-[#0f141d]/95 backdrop-blur-md border border-amber-500/40 p-3 rounded-2xl flex flex-col gap-2.5 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200 min-w-[270px]">
          <div className="flex items-center justify-between gap-3 border-b border-[#2a3449] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">
                Girar: <span className="text-white font-black">{selectedCombatant.name}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCombatantId(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-all cursor-pointer"
              title="Fechar Controle de Rotação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs font-mono bg-[#161d2f]/90 px-2.5 py-1.5 rounded-xl border border-[#2a3449]">
            <span className="text-slate-400 font-semibold">Orientação Atual:</span>
            <span className="font-bold text-cyan-300">
              {Math.round(localRotations[selectedCombatant.id] ?? tokenRotations3D[selectedCombatant.id] ?? 0)}° (
              {getDirectionLabel(localRotations[selectedCombatant.id] ?? tokenRotations3D[selectedCombatant.id] ?? 0)})
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleRotatePawn(selectedCombatant.id, -45)}
              className="p-2 rounded-xl bg-[#161c28] hover:bg-amber-500 hover:text-slate-950 border border-[#2a3449] hover:border-amber-400 text-amber-300 text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Girar 45° para Esquerda (Anti-Horário)"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[10px]">-45°</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotatePawn(selectedCombatant.id, 45)}
              className="p-2 rounded-xl bg-[#161c28] hover:bg-amber-500 hover:text-slate-950 border border-[#2a3449] hover:border-amber-400 text-amber-300 text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Girar 45° para Direita (Horário)"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[10px]">+45°</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetPawnAngle(selectedCombatant.id, 180)}
              className="p-2 rounded-xl bg-[#161c28] hover:bg-cyan-500 hover:text-slate-950 border border-[#2a3449] hover:border-cyan-400 text-cyan-300 text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Inverter direção (180°)"
            >
              <span className="text-xs">🔄</span>
              <span className="text-[10px]">180°</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetPawnAngle(selectedCombatant.id, 0)}
              className="p-2 rounded-xl bg-[#161c28] hover:bg-emerald-500 hover:text-slate-950 border border-[#2a3449] hover:border-emerald-400 text-emerald-300 text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Resetar para Frente / Norte (0°)"
            >
              <span className="text-xs">▲</span>
              <span className="text-[10px]">0° (N)</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Right Environmental Control Menu (Gear Button + Collapsible Panel) */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto flex flex-col items-end">
        {/* Gear Toggle Button (Catraca) */}
        <button
          type="button"
          onClick={() => setIsEnvMenuOpen(!isEnvMenuOpen)}
          className={`p-2 px-3 rounded-xl border backdrop-blur-md shadow-xl flex items-center gap-2 transition-all cursor-pointer ${
            isEnvMenuOpen
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
              : 'bg-[#0f172a]/90 hover:bg-[#1e293b] text-amber-400 border-[#2a3449] hover:border-amber-400/60'
          }`}
          title="Configurações de Ambiente (Clima & Hora do Dia)"
        >
          <Settings className={`w-4 h-4 transition-transform duration-300 ${isEnvMenuOpen ? 'rotate-90 text-slate-950' : ''}`} />
          <span className="text-xs font-mono font-bold">Clima & Hora</span>
        </button>

        {/* Collapsible Environmental Settings Card */}
        {isEnvMenuOpen && (
          <div className="mt-2 p-3.5 bg-[#0f172a]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[290px] sm:min-w-[330px] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Controle de Ambiente
              </span>
              <button
                type="button"
                onClick={() => setIsEnvMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1e293b] transition-all cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Time of Day Section */}
            <div className="flex flex-col gap-2.5 bg-[#161d2f]/90 p-2.5 rounded-xl border border-[#2a3449]">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  Hora do Dia:
                </span>
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  {timeOfDay >= 6 && timeOfDay < 18 ? (
                    <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-cyan-300" />
                  )}
                  {Math.floor(timeOfDay).toString().padStart(2, '0')}:
                  {Math.floor((timeOfDay % 1) * 60).toString().padStart(2, '0')}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="24"
                step="0.25"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                title="Ajustar Hora do Dia"
              />

              {/* Time Presets */}
              <div className="grid grid-cols-4 gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => setTimeOfDay(6)}
                  className={`p-1.5 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                    timeOfDay === 6
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#20293d] border border-transparent'
                  }`}
                  title="Alvorada (06:00)"
                >
                  <Sunrise className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px]">Alvorada</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTimeOfDay(12)}
                  className={`p-1.5 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                    timeOfDay === 12
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#20293d] border border-transparent'
                  }`}
                  title="Meio-Dia (12:00)"
                >
                  <Sun className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[10px]">Dia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTimeOfDay(18)}
                  className={`p-1.5 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                    timeOfDay === 18
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#20293d] border border-transparent'
                  }`}
                  title="Pôr do Sol (18:00)"
                >
                  <Sunset className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px]">Ocaso</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTimeOfDay(24)}
                  className={`p-1.5 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                    timeOfDay === 24 || timeOfDay === 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#20293d] border border-transparent'
                  }`}
                  title="Noite (24:00)"
                >
                  <Moon className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-[10px]">Noite</span>
                </button>
              </div>
            </div>

            {/* Weather & FX Placeholders Section */}
            <div className="grid grid-cols-3 gap-1.5 border-t border-[#2a3449] pt-2">
              <button
                type="button"
                disabled
                className="p-1.5 rounded-xl bg-[#161d2f]/50 border border-[#2a3449]/60 text-slate-500 flex flex-col items-center justify-center gap-1 cursor-not-allowed opacity-70"
                title="Mecânica de Chuva em Breve"
              >
                <CloudRain className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-mono">Chuva</span>
                <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase font-sans">
                  Em breve
                </span>
              </button>

              <button
                type="button"
                disabled
                className="p-1.5 rounded-xl bg-[#161d2f]/50 border border-[#2a3449]/60 text-slate-500 flex flex-col items-center justify-center gap-1 cursor-not-allowed opacity-70"
                title="Mecânica de Neblina em Breve"
              >
                <CloudFog className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-mono">Neblina</span>
                <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase font-sans">
                  Em breve
                </span>
              </button>

              <button
                type="button"
                disabled
                className="p-1.5 rounded-xl bg-[#161d2f]/50 border border-[#2a3449]/60 text-slate-500 flex flex-col items-center justify-center gap-1 cursor-not-allowed opacity-70"
                title="Efeitos Especiais (Tempestade, Raios) em Breve"
              >
                <Zap className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-mono">Efeitos</span>
                <span className="text-[8px] bg-slate-800 text-slate-400 px-1 rounded uppercase font-sans">
                  Em breve
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom DM Manual Nudge & Selection Overlay */}
      {interactive && activeCombatant && (
        <div className="absolute bottom-3 left-3 z-10 bg-[#0f141d]/90 backdrop-blur-md border border-[#2a3449] p-2 rounded-2xl flex items-center gap-3 shadow-2xl">
          <div className="text-[11px] font-bold text-slate-300 font-mono pl-1">
            Mover <span className="text-amber-400 font-black">{activeCombatant.name}</span> (1,5m):
          </div>

          <div className="grid grid-cols-3 gap-1 w-24">
            <div />
            <button
              onClick={() => handleManualMove(activeCombatant.id, 0, -1)}
              className="p-1 bg-[#161c28] hover:bg-amber-500 hover:text-slate-950 border border-[#2a3449] rounded text-slate-200 text-xs font-bold transition-all text-center"
              title="Mover 1,5m Norte (Frente)"
            >
              ▲
            </button>
            <div />
            <button
              onClick={() => handleManualMove(activeCombatant.id, -1, 0)}
              className="p-1 bg-[#161c28] hover:bg-amber-500 hover:text-slate-950 border border-[#2a3449] rounded text-slate-200 text-xs font-bold transition-all text-center"
              title="Mover 1,5m Oeste (Esquerda)"
            >
              ◀
            </button>
            <button
              onClick={() => handleManualMove(activeCombatant.id, 0, 1)}
              className="p-1 bg-[#161c28] hover:bg-amber-500 hover:text-slate-950 border border-[#2a3449] rounded text-slate-200 text-xs font-bold transition-all text-center"
              title="Mover 1,5m Sul (Trás)"
            >
              ▼
            </button>
            <button
              onClick={() => handleManualMove(activeCombatant.id, 1, 0)}
              className="p-1 bg-[#161c28] hover:bg-amber-500 hover:text-slate-950 border border-[#2a3449] rounded text-slate-200 text-xs font-bold transition-all text-center"
              title="Mover 1,5m Leste (Direita)"
            >
              ▶
            </button>
          </div>
        </div>
      )}

      {/* Bottom Right Help / Controls Tooltip */}
      <div className="absolute bottom-3 right-3 z-20 group flex flex-col items-end">
        {/* Hover Controls Card */}
        <div className="hidden group-hover:flex flex-col gap-2 p-3.5 mb-2 bg-[#0f141d]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl text-xs w-64 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <div className="text-[11px] font-bold text-amber-400 uppercase font-mono tracking-wider border-b border-[#2a3449] pb-1.5 flex items-center justify-between">
            <span>🎮 Controles da Câmera 3D</span>
          </div>

          <ul className="space-y-2 text-slate-200 text-[11px] font-sans">
            <li className="flex items-start gap-2">
              <span className="bg-[#1e293b] border border-[#334155] text-amber-300 font-mono px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                Botão Scroll / Shift+LMB
              </span>
              <span>Arrastar para <strong>mover o cenário</strong> (Pan)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#1e293b] border border-[#334155] text-cyan-300 font-mono px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                Clique Esquerdo
              </span>
              <span>Arrastar para <strong>rotacionar visão</strong> (Orbit)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#1e293b] border border-[#334155] text-emerald-300 font-mono px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                Rolar Scroll
              </span>
              <span>Aproximar / Afastar (Zoom)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-[#1e293b] border border-[#334155] text-purple-300 font-mono px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap">
                Clique Duplo
              </span>
              <span><strong>Recentralizar</strong> mapa ao meio</span>
            </li>
          </ul>
        </div>

        {/* Question Mark Icon Button */}
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-[#0f141d]/90 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-[#2a3449] hover:border-amber-400 backdrop-blur-md shadow-xl flex items-center justify-center transition-all cursor-help"
          title="Controles da Câmera 3D"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
