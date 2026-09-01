'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Loader2 } from 'lucide-react';
import { patchWebGLContext } from '@/lib/webgl-utils';

interface Model3DViewerProps {
  modelUrl: string;
  height?: number;
  autoRotate?: boolean;
}

const gltfLoader = new GLTFLoader();

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelUrl,
  height,
  autoRotate = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Interatividade por drag de ponteiro
  const isDraggingRef = useRef(false);
  const previousPointerXRef = useRef(0);
  const rotationVelocityRef = useRef(0);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const effectiveHeight = height || container.clientHeight || 340;

    setIsLoading(true);
    setHasError(false);

    // Cena, Câmera e Renderizador
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / effectiveHeight, 0.1, 100);
    camera.position.set(0, 0.78, 2.75);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    patchWebGLContext(renderer);
    renderer.setSize(width, effectiveHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const gl = renderer.getContext();
    const extension = gl ? gl.getExtension('WEBGL_lose_context') : null;

    // Limpar elementos prévios do container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Iluminação Profissional para Miniatura
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 3.0);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.8);
    rimLight.position.set(0, -2, -3);
    scene.add(rimLight);

    // Pedestal para o Boneco (Base Circular RPG)
    const baseGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.55, 0.62, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.01;
    baseGroup.add(ringMesh);

    const discGeo = new THREE.CircleGeometry(0.55, 36);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.rotation.x = Math.PI / 2;
    baseGroup.add(discMesh);
    scene.add(baseGroup);

    // Grupo Root do Modelo
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    modelGroupRef.current = rootGroup;

    let animFrameId: number;
    let isDisposed = false;

    // Carregar arquivo GLB
    gltfLoader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;

        const modelScene = gltf.scene;

        // Normalização de Escala e Posição via Box3
        const box = new THREE.Box3().setFromObject(modelScene);
        const size = new THREE.Vector3();
        box.getSize(size);

        const targetHeight = 1.38;
        const naturalHeight = size.y || Math.max(size.x, size.z);

        if (naturalHeight > 0) {
          const scale = targetHeight / naturalHeight;
          modelScene.scale.set(scale, scale, scale);
          modelScene.position.y = -box.min.y * scale;
          modelScene.position.x = -((box.max.x + box.min.x) / 2) * scale;
          modelScene.position.z = -((box.max.z + box.min.z) / 2) * scale;
        }

        modelScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        rootGroup.add(modelScene);
        setIsLoading(false);

        // Apontar câmera para o tronco da miniatura
        camera.lookAt(0, 0.68, 0);
      },
      undefined,
      (err) => {
        if (isDisposed) return;
        console.warn(`[Model3DViewer] Erro ao carregar modelo ${modelUrl}:`, err);
        setIsLoading(false);
        setHasError(true);
      }
    );

    // Loop de Animação
    const animate = () => {
      if (isDisposed) return;
      animFrameId = requestAnimationFrame(animate);

      if (rootGroup) {
        if (isDraggingRef.current) {
          rootGroup.rotation.y += rotationVelocityRef.current;
        } else if (autoRotate) {
          // Desaceleração de arrasto manual + rotação automática contínua
          rotationVelocityRef.current *= 0.92;
          rootGroup.rotation.y += 0.007 + rotationVelocityRef.current;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Redimensionamento
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = height || containerRef.current.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);

      // Desalocação de Memória Three.js
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      renderer.dispose();
      if (extension) {
        extension.loseContext();
      }
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [modelUrl, height, autoRotate]);

  // Handler de Arrasto (Mouse / Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousPointerXRef.current = e.clientX;
    rotationVelocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousPointerXRef.current;
    previousPointerXRef.current = e.clientX;
    rotationVelocityRef.current = deltaX * 0.015;
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.y += rotationVelocityRef.current;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className="relative w-full h-full min-h-[300px] flex-1 overflow-hidden rounded-xl bg-transparent select-none cursor-grab active:cursor-grabbing flex items-center justify-center group"
      style={height ? { height: `${height}px` } : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-h-[300px] flex items-center justify-center" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f19]/80 backdrop-blur-xs text-amber-400 text-xs font-semibold gap-2 transition-opacity z-10">
          <Loader2 className="w-7 h-7 animate-spin text-amber-400" />
          <span className="font-serif">Carregando miniatura 3D...</span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f19] text-slate-400 text-xs gap-1 p-4 text-center z-10">
          <span className="text-2xl">🎲</span>
          <span className="text-rose-400 font-semibold font-serif">Modelo 3D indisponível</span>
          <span className="text-[10px] text-slate-500">Usando miniatura genérica no jogo</span>
        </div>
      )}

      {/* Helper Tag */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-2.5 left-2.5 text-[9px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-700/80 pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity z-10 shadow-md">
          🖱️ Arraste para girar em 360°
        </div>
      )}
    </div>
  );
};
