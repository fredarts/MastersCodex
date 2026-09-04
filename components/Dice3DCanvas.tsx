'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { patchWebGLContext } from '@/lib/webgl-utils';
import { DieType, createDieNumberTexture } from '@/lib/dice-physics/dice-topologies';
import { createDicePhysicsSimulator, DicePhysicsResult, ThrowOptions } from '@/lib/dice-physics/dice-physics-engine';

export type { DieType, DicePhysicsResult };

interface Dice3DCanvasProps {
  dieType: DieType;
  isRolling: boolean;
  isHit?: boolean;
  isFail?: boolean;
  isCrit?: boolean;
  number?: number;
  modifier?: number;
  showNumber?: boolean;
  physicsSeed?: number;
  onSettled?: (result: DicePhysicsResult) => void;
}

export const Dice3DCanvas: React.FC<Dice3DCanvasProps> = ({
  dieType,
  isRolling,
  isHit,
  isFail,
  isCrit,
  number,
  modifier,
  showNumber = true,
  physicsSeed,
  onSettled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentResult, setCurrentResult] = useState<number | null>(number ?? null);
  const [isPhysicsSettled, setIsPhysicsSettled] = useState(!isRolling);

  // References for animation loop
  const propsRef = useRef({
    isRolling,
    isHit,
    isFail,
    isCrit,
    number,
    physicsSeed,
    onSettled,
  });

  useEffect(() => {
    propsRef.current = {
      isRolling,
      isHit,
      isFail,
      isCrit,
      number,
      physicsSeed,
      onSettled,
    };
  }, [isRolling, isHit, isFail, isCrit, number, physicsSeed, onSettled]);

  // Flag to guarantee onSettled is ONLY dispatched after an active launch
  const isActivelyRollingRef = useRef(false);

  // Ref to trigger physical throw imperatively
  const launchRef = useRef<((options?: ThrowOptions) => void) | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 130;
    const height = container.clientHeight || 130;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
    patchWebGLContext(renderer);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3.2);
    dirLight1.position.set(5, 6, 5);
    scene.add(dirLight1);

    const initialHit = propsRef.current.isHit || propsRef.current.isCrit;
    const initialFail = propsRef.current.isFail;
    const accentLight = new THREE.DirectionalLight(
      initialHit ? 0xfbbf24 : initialFail ? 0xf43f5e : 0x38bdf8,
      2.8
    );
    accentLight.position.set(-5, -4, 3);
    scene.add(accentLight);

    // 3. Physics Simulator Setup
    const { body, topology, bounds } = createDicePhysicsSimulator(dieType);

    // If a default number is provided in non-rolling state, align that face to front
    if (propsRef.current.number && propsRef.current.number > 0) {
      const matchFace = topology.faces.find((f) => f.value === propsRef.current.number);
      if (matchFace) {
        body.alignFaceToScreen(matchFace);
      }
    }

    // 4. Base Mesh and Materials
    const initialCrit = propsRef.current.isCrit;
    const colorHex = initialCrit
      ? 0xf59e0b
      : initialFail
      ? 0x991b1b
      : initialHit
      ? 0xd97706
      : 0x1e293b;

    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.65,
      roughness: 0.25,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(topology.geometry, material);
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
    scene.add(mesh);

    // Wireframe Accent
    const wireGeo = new THREE.WireframeGeometry(topology.geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: initialCrit || initialHit ? 0xffedd5 : initialFail ? 0xfecdd3 : 0x38bdf8,
      linewidth: 2,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    // Track dynamic disposable Three.js resources
    const disposables: { dispose: () => void }[] = [material, wireGeo, wireMat];

    // 5. Attach Face Numbers Permanently to Centroids
    const planeGeo = new THREE.PlaneGeometry(0.52, 0.52);
    disposables.push(planeGeo);

    topology.faces.forEach((face) => {
      const isGoldFace = (dieType === 'd20' && face.value === 20);
      const isCrimsonFace = (dieType === 'd20' && face.value === 1);
      const texture = createDieNumberTexture(String(face.value), isGoldFace, isCrimsonFace);
      disposables.push(texture);

      const faceMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      disposables.push(faceMat);

      const numPlane = new THREE.Mesh(planeGeo, faceMat);
      const offsetPos = face.center.clone().add(face.normal.clone().multiplyScalar(0.018));
      numPlane.position.copy(offsetPos);

      const up = new THREE.Vector3(0, 0, 1);
      numPlane.quaternion.setFromUnitVectors(up, face.normal);

      mesh.add(numPlane);
    });

    // Expose launcher callback
    launchRef.current = (opts?: ThrowOptions) => {
      isActivelyRollingRef.current = true;
      body.launch(opts);
      setIsPhysicsSettled(false);
    };

    // If initially rolling upon mount, launch immediately
    if (propsRef.current.isRolling) {
      isActivelyRollingRef.current = true;
      body.launch({ seed: propsRef.current.physicsSeed });
      setIsPhysicsSettled(false);
    } else {
      // Resting initial state
      const initialRes = body.getTopFaceResult('camera');
      setCurrentResult(propsRef.current.number || initialRes.value);
    }

    let animationFrameId: number;
    let hasNotifiedSettled = false;
    let isLoopRunning = false;

    // 6. Animation and Physics Step Loop com Sleep State
    const animate = () => {
      const dt = 1 / 60;
      body.update(dt, bounds);

      // Sync 3D Mesh with Physics Body
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);

      // Check if settled
      if (body.isSettled) {
        if (!hasNotifiedSettled && isActivelyRollingRef.current) {
          hasNotifiedSettled = true;
          isActivelyRollingRef.current = false;
          setIsPhysicsSettled(true);

          const result = body.getTopFaceResult('camera');
          setCurrentResult(result.value);

          // Disparar resultado físico para o componente pai
          if (propsRef.current.onSettled) {
            propsRef.current.onSettled(result);
          }
        }
        renderer.render(scene, camera);
        // Sleep state: encerra o loop contínuo até o próximo lançamento
        isLoopRunning = false;
        return;
      } else {
        hasNotifiedSettled = false;
        if (isActivelyRollingRef.current) {
          const liveResult = body.getTopFaceResult('camera');
          setCurrentResult(liveResult.value);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
      isLoopRunning = true;
    };

    // Função de ativação de lançamento
    launchRef.current = (opts) => {
      body.launch(opts);
      hasNotifiedSettled = false;
      isActivelyRollingRef.current = true;
      if (!isLoopRunning) {
        animate();
      }
    };

    // Render inicial estático
    renderer.render(scene, camera);

    const gl = renderer.getContext();
    const extension = gl ? gl.getExtension('WEBGL_lose_context') : null;

    return () => {
      cancelAnimationFrame(animationFrameId);
      disposables.forEach((d) => d.dispose());
      topology.geometry.dispose();
      renderer.dispose();
      if (extension) {
        extension.loseContext();
      }
    };
  }, [dieType]);

  // Trigger launch when isRolling prop transitions to true
  useEffect(() => {
    if (isRolling && launchRef.current && !isActivelyRollingRef.current) {
      launchRef.current({ seed: physicsSeed });
      setIsPhysicsSettled(false);
    }
  }, [isRolling, physicsSeed]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-none">
      <div
        ref={containerRef}
        className="w-28 h-28 pointer-events-none cursor-default"
      />

      {/* Floating Readout when Settled */}
      {isPhysicsSettled && showNumber && currentResult !== null && currentResult > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-75 duration-200">
          <div
            className={`text-2xl font-black font-mono drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] ${
              currentResult === 20 && dieType === 'd20'
                ? 'text-amber-400'
                : currentResult === 1 && dieType === 'd20'
                ? 'text-rose-500'
                : 'text-slate-100'
            }`}
          >
            {currentResult}
          </div>
          {modifier !== undefined && modifier !== 0 && (
            <div className="text-[10px] font-bold text-amber-300 font-mono">
              ({currentResult + modifier})
            </div>
          )}
        </div>
      )}
    </div>
  );
};
