'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { patchWebGLContext } from '@/lib/webgl-utils';

export type DieType = 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4';

interface Dice3DCanvasProps {
  dieType: DieType;
  isRolling: boolean;
  isHit?: boolean;
  isFail?: boolean;
  isCrit?: boolean;
  number: number;
  modifier?: number;
  showNumber?: boolean;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Store latest dynamic props in a mutable ref to avoid destroying & recreating WebGLRenderer on every state flicker
  const propsRef = useRef({ isRolling, isHit, isFail, isCrit, number });
  useEffect(() => {
    propsRef.current = { isRolling, isHit, isFail, isCrit, number };
  }, [isRolling, isHit, isFail, isCrit, number]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    // Scene, Camera, Renderer (Initialized ONCE per container/dieType)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.2);

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

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 3.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const initialHit = propsRef.current.isHit || propsRef.current.isCrit;
    const initialFail = propsRef.current.isFail;
    const dirLight2 = new THREE.DirectionalLight(
      initialHit ? 0xfbbf24 : initialFail ? 0xf43f5e : 0x38bdf8,
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
    const initialCrit = propsRef.current.isCrit;
    const colorHex = initialCrit
      ? 0xf59e0b
      : initialFail
      ? 0xe11d48
      : initialHit
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
      color: initialCrit || initialHit ? 0xffedd5 : initialFail ? 0xfecdd3 : 0x38bdf8,
      linewidth: 2,
    });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    mesh.add(wireframe);

    // Track dynamic disposable Three.js resources
    const disposables: { dispose: () => void }[] = [];

    // Helper: Create 2D texture for face numbers
    const createNumberTexture = (text: string, isGold: boolean): THREE.CanvasTexture => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.font = '900 64px "Cinzel", "Times New Roman", serif, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 9;
        ctx.strokeText(text, 64, 64);

        ctx.fillStyle = isGold ? '#fbbf24' : '#f8fafc';
        ctx.fillText(text, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // Extract faces and attach 3D number planes to each centroid
    try {
      const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
      disposables.push(nonIndexed);

      const posAttr = nonIndexed.attributes.position;
      const count = posAttr.count;

      interface FaceGroup {
        normal: THREE.Vector3;
        center: THREE.Vector3;
        count: number;
      }
      const groups: FaceGroup[] = [];

      const v0 = new THREE.Vector3();
      const v1 = new THREE.Vector3();
      const v2 = new THREE.Vector3();
      const triCenter = new THREE.Vector3();
      const triNormal = new THREE.Vector3();

      for (let i = 0; i < count; i += 3) {
        v0.fromBufferAttribute(posAttr, i);
        v1.fromBufferAttribute(posAttr, i + 1);
        v2.fromBufferAttribute(posAttr, i + 2);

        triCenter.copy(v0).add(v1).add(v2).divideScalar(3);
        triNormal.copy(triCenter).normalize();

        let matched = false;
        for (const g of groups) {
          if (g.normal.dot(triNormal) > 0.92) {
            g.center.add(triCenter);
            g.count++;
            matched = true;
            break;
          }
        }

        if (!matched) {
          groups.push({
            normal: triNormal.clone(),
            center: triCenter.clone(),
            count: 1,
          });
        }
      }

      groups.forEach((g) => g.center.divideScalar(g.count));
      groups.sort((a, b) => b.normal.z - a.normal.z);

      const maxSides =
        dieType === 'd20'
          ? 20
          : dieType === 'd12'
          ? 12
          : dieType === 'd10'
          ? 10
          : dieType === 'd8'
          ? 8
          : dieType === 'd6'
          ? 6
          : 4;

      const planeGeo = new THREE.PlaneGeometry(0.55, 0.55);
      disposables.push(planeGeo);

      const targetNum = propsRef.current.number;

      groups.forEach((group, idx) => {
        let val: number;
        if (idx === 0 && targetNum > 0) {
          val = targetNum;
        } else {
          let candidate = (idx % maxSides) + 1;
          if (candidate === targetNum) candidate = (candidate % maxSides) + 1;
          val = candidate;
        }

        const texture = createNumberTexture(String(val), initialCrit || val === 20);
        disposables.push(texture);

        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthTest: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        disposables.push(mat);

        const plane = new THREE.Mesh(planeGeo, mat);
        const offsetPos = group.center.clone().add(group.normal.clone().multiplyScalar(0.015));
        plane.position.copy(offsetPos);

        const up = new THREE.Vector3(0, 0, 1);
        plane.quaternion.setFromUnitVectors(up, group.normal);

        mesh.add(plane);
      });
    } catch (err) {
      console.warn('Could not attach face numbers to 3D die:', err);
    }

    // Physics Simulation Variables (Speed, Angular Velocity, Bounce Damping)
    let animationFrameId: number;
    let angularVelX = (Math.random() - 0.5) * 0.4 + 0.25;
    let angularVelY = (Math.random() - 0.5) * 0.4 + 0.25;
    const angularVelZ = (Math.random() - 0.5) * 0.2 + 0.1;
    let posX = (Math.random() - 0.5) * 0.4;
    let posY = (Math.random() - 0.5) * 0.4;
    let velX = (Math.random() - 0.5) * 0.04;
    let velY = (Math.random() - 0.5) * 0.04;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const currentProps = propsRef.current;

      if (currentProps.isRolling) {
        // Physics motion simulation
        mesh.rotation.x += angularVelX;
        mesh.rotation.y += angularVelY;
        mesh.rotation.z += angularVelZ;

        posX += velX;
        posY += velY;

        // Table Boundary collisions
        if (Math.abs(posX) > 0.3) {
          velX *= -0.8;
          angularVelX *= 0.9;
        }
        if (Math.abs(posY) > 0.3) {
          velY *= -0.8;
          angularVelY *= 0.9;
        }

        mesh.position.x = posX;
        mesh.position.y = posY;
      } else {
        // Smooth alignment and landing rest
        mesh.rotation.x += (0 - mesh.rotation.x) * 0.18;
        mesh.rotation.y += (0 - mesh.rotation.y) * 0.18;
        mesh.rotation.z += (0 - mesh.rotation.z) * 0.18;
        mesh.position.x += (0 - mesh.position.x) * 0.18;
        mesh.position.y += (0 - mesh.position.y) * 0.18;
      }

      renderer.render(scene, camera);
    };

    const gl = renderer.getContext();
    const extension = gl ? gl.getExtension('WEBGL_lose_context') : null;

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      disposables.forEach((d) => d.dispose());
      geometry.dispose();
      material.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      renderer.dispose();
      if (extension) {
        extension.loseContext();
      }
    };
  }, [dieType]); // Depend ONLY on dieType to prevent WebGL context destruction leaks!

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div ref={containerRef} className="w-28 h-28 cursor-pointer" />
      {!isRolling && showNumber && number > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <div className="text-2xl font-black text-slate-100 font-mono drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
            {number}
          </div>
          {modifier !== undefined && modifier !== 0 && (
            <div className="text-[10px] font-bold text-amber-300 font-mono">
              ({number + modifier})
            </div>
          )}
        </div>
      )}
    </div>
  );
};
