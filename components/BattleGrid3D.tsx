'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HelpCircle } from 'lucide-react';
import { Combatant } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface BattleGrid3DProps {
  combatants: Combatant[];
  currentTurnIndex?: number;
  onSelectCombatant?: (c: Combatant) => void;
  interactive?: boolean;
}

export const BattleGrid3D: React.FC<BattleGrid3DProps> = ({
  combatants,
  currentTurnIndex = 0,
  onSelectCombatant,
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { tokenPositions3D, updateTokenPosition3D } = useAuth();

  // Local state for integer grid cell coordinates { x: gridX, z: gridZ }
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; z: number }>>({});

  // Refs for WebGL animation loop without re-creating WebGL Context
  const combatantsRef = useRef<Combatant[]>(combatants);
  const positionsRef = useRef<Record<string, { x: number; z: number }>>(localPositions);
  const turnIdxRef = useRef<number>(currentTurnIndex);

  // Sync refs with latest props
  useEffect(() => {
    combatantsRef.current = combatants;
  }, [combatants]);

  useEffect(() => {
    turnIdxRef.current = currentTurnIndex;
  }, [currentTurnIndex]);

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

  // Listen to movement events via both BroadcastChannel and local window events
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

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('masters_codex_sync');
      bc.onmessage = (event) => {
        applyTokenMove(event.data);
      };
    } catch (e) { }

    const handleLocalEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      applyTokenMove(customEvt.detail);
    };

    window.addEventListener('masters_codex_token_move_3d', handleLocalEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('masters_codex_token_move_3d', handleLocalEvent);
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
    scene.background = new THREE.Color(0x0a0d14);
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.035);

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

    // Lights
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
      cameraDistance = Math.max(6, Math.min(25, cameraDistance + e.deltaY * 0.01));
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

    const domElem = renderer.domElement;
    domElem.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', onContextMenu);
    domElem.addEventListener('dblclick', onDblClick);

    // Dynamic Pin Mesh Generator
    const createPawnMesh = (c: Combatant) => {
      const pinGroup = new THREE.Group();
      const isPlayer = c.type === 'player';
      const baseColor = isPlayer ? 0x0284c7 : 0xe11d48;
      const ringColor = isPlayer ? 0x38bdf8 : 0xf43f5e;

      const monsterName = c.name.toLowerCase();
      if (monsterName === 'goblin' || monsterName === 'esqueleto') {
        const url = monsterName === 'goblin'
          ? '/assets/3d/monsters/Goblin/Goblin.glb'
          : '/assets/3d/monsters/Esqueleto/Esqueleto.glb';

        // Ring indicator
        const ringGeo = new THREE.TorusGeometry(0.58, 0.04, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: ringColor });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = 0.02;
        pinGroup.add(ringMesh);

        // Load 3D model
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            const model = gltf.scene;

            // Auto-scale based on bounding box
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            // Target height/size around 2.4 units (doubled from previous 1.2)
            const targetSize = 2.4;
            const scale = maxDim > 0 ? (targetSize / maxDim) : 1;
            model.scale.setScalar(scale);

            // Center the model horizontally, and sit it on the floor
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x * scale;
            model.position.z = -center.z * scale;
            model.position.y = -box.min.y * scale;

            // Standardize shadow
            model.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            pinGroup.add(model);
          },
          undefined,
          (error) => console.error('Error loading model:', url, error)
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

    // Animation Loop (60 FPS)
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentList = combatantsRef.current;
      const currentPosMap = positionsRef.current;
      const turnIdx = turnIdxRef.current;

      // Sync 3D Pin Meshes with current combatants
      currentList.forEach((c, idx) => {
        let pinGroup = meshesMap[c.id];
        if (!pinGroup) {
          pinGroup = createPawnMesh(c);
          const gridPos = currentPosMap[c.id] || (c.type === 'player' ? { x: (idx % 5) - 2, z: 2 } : { x: (idx % 4) - 2, z: -2 - Math.floor(idx / 4) });
          // Center inside cell: (gridX + 0.5) * cellSize
          pinGroup.position.set((gridPos.x + 0.5) * cellSize, 0, (gridPos.z + 0.5) * cellSize);
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

        // Smooth Lerp to cell center (gridX + 0.5) * cellSize
        const gridPos = currentPosMap[c.id] || (c.type === 'player' ? { x: (idx % 5) - 2, z: 2 } : { x: (idx % 4) - 2, z: -2 - Math.floor(idx / 4) });
        const targetX = (gridPos.x + 0.5) * cellSize;
        const targetZ = (gridPos.z + 0.5) * cellSize;

        pinGroup.position.x += (targetX - pinGroup.position.x) * 0.25;
        pinGroup.position.z += (targetZ - pinGroup.position.z) * 0.25;
      });

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

  const handleManualMove = (combatantId: string, dx: number, dz: number) => {
    const curPos = positionsRef.current[combatantId] || { x: 0, z: 0 };
    const nextX = Math.max(-5, Math.min(5, curPos.x + dx));
    const nextZ = Math.max(-5, Math.min(5, curPos.z + dz));

    updateTokenPosition3D(combatantId, undefined, undefined, nextX, nextZ);
  };

  return (
    <div className="w-full h-full relative bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Top 3D Grid Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-[#0f141d]/90 backdrop-blur-md border border-[#2a3449] px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-400 flex items-center gap-2 shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GRID 3D • METRAGEM D&D: 1 CELULA = 1,5m (5ft)</span>
        </div>

        {activeCombatant && (
          <div className="bg-[#121824]/90 backdrop-blur-md border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-100 flex items-center gap-2 shadow-lg pointer-events-auto">
            <span className="text-[10px] uppercase font-mono bg-rose-500 text-slate-950 px-1.5 py-0.5 rounded font-black">
              TURNO 3D
            </span>
            <span className="text-amber-300">{activeCombatant.name}</span>
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
