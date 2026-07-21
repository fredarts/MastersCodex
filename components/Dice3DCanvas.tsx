'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type DieType = 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4';

interface Dice3DCanvasProps {
  dieType: DieType;
  isRolling: boolean;
  isHit?: boolean;
  isFail?: boolean;
  isCrit?: boolean;
  number: number;
  modifier?: number;
}

export const Dice3DCanvas: React.FC<Dice3DCanvasProps> = ({
  dieType,
  isRolling,
  isHit,
  isFail,
  isCrit,
  number,
  modifier,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(
      isHit || isCrit ? 0xfbbf24 : isFail ? 0xf43f5e : 0x38bdf8,
      3.0
    );
    dirLight2.position.set(-5, -5, 2);
    scene.add(dirLight2);

    // Geometry based on Die Type (3D Polyhedra)
    let geometry: THREE.BufferGeometry;
    switch (dieType) {
      case 'd20':
        geometry = new THREE.IcosahedronGeometry(1.25, 0);
        break;
      case 'd12':
        geometry = new THREE.DodecahedronGeometry(1.15, 0);
        break;
      case 'd10':
      case 'd8':
        geometry = new THREE.OctahedronGeometry(1.25, 0);
        break;
      case 'd6':
        geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
        break;
      case 'd4':
        geometry = new THREE.TetrahedronGeometry(1.4, 0);
        break;
      default:
        geometry = new THREE.IcosahedronGeometry(1.25, 0);
    }

    // Material
    const colorHex = isCrit
      ? 0xf59e0b
      : isFail
      ? 0xe11d48
      : isHit
      ? 0xd97706
      : 0x1e293b;

    const material = new THREE.MeshStandardMaterial({
      color: colorHex,
      metalness: 0.6,
      roughness: 0.2,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Wireframe Overlay Accent
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({
      color: isCrit || isHit ? 0xffedd5 : isFail ? 0xfecdd3 : 0x38bdf8,
      linewidth: 2,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    // Animation Loop
    let animationFrameId: number;
    let rotX = Math.random() * Math.PI;
    let rotY = Math.random() * Math.PI;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isRolling) {
        rotX += 0.18;
        rotY += 0.22;
        mesh.rotation.x = rotX;
        mesh.rotation.y = rotY;
        mesh.rotation.z += 0.08;
      } else {
        // Smooth alignment to front face
        mesh.rotation.x += (0 - mesh.rotation.x) * 0.15;
        mesh.rotation.y += (0 - mesh.rotation.y) * 0.15;
        mesh.rotation.z += (0 - mesh.rotation.z) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [dieType, isRolling, isHit, isFail, isCrit]);

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Die Number Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-100 font-mono font-black select-none pointer-events-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
        <span className="text-4xl font-extrabold tracking-tighter leading-none">
          {number}
        </span>
        {modifier !== undefined && (
          <span className="text-[10px] font-bold text-amber-300 bg-slate-950/80 px-1.5 py-0.5 rounded-full border border-amber-500/40 mt-1 shadow">
            {dieType.toUpperCase()} {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        )}
      </div>
    </div>
  );
};
