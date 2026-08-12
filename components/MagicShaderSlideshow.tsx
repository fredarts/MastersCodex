import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { patchWebGLContext } from '@/lib/webgl-utils';

interface MagicShaderSlideshowProps {
  imageUrl: string;
  className?: string;
}

// Create a tiny canvas base64 image as default placeholder texture
function createPlaceholderTexture() {
  if (typeof window === 'undefined') return new THREE.Texture();
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export const MagicShaderSlideshow: React.FC<MagicShaderSlideshowProps> = ({
  imageUrl,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const retryCountRef = useRef(0);
  const stateRef = useRef({
    renderer: null as THREE.WebGLRenderer | null,
    scene: null as THREE.Scene | null,
    camera: null as THREE.OrthographicCamera | null,
    material: null as THREE.ShaderMaterial | null,
    textureLoader: new THREE.TextureLoader(),
    currentUrl: imageUrl,
    texture1: null as THREE.Texture | null,
    texture2: null as THREE.Texture | null,
    transition: 0.0,
    isTransitioning: false,
    startTime: 0,
    imageSize1: new THREE.Vector2(1, 1),
    imageSize2: new THREE.Vector2(1, 1),
  });

  // Vertex Shader
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Fragment Shader
  const fragmentShader = `
    uniform sampler2D uTex1;
    uniform sampler2D uTex2;
    uniform float uTransition;
    uniform float uTime;
    uniform vec2 uImageSize1;
    uniform vec2 uImageSize2;
    uniform vec2 uPlaneSize;
    varying vec2 vUv;

    // Aspect ratio correction (object-fit: cover)
    vec2 getCoverUv(vec2 uv, vec2 imgSize, vec2 planeSize) {
      if (imgSize.x <= 0.0 || imgSize.y <= 0.0 || planeSize.x <= 0.0 || planeSize.y <= 0.0) {
        return uv;
      }
      float s = planeSize.x / planeSize.y; // Aspect ratio of canvas
      float i = imgSize.x / imgSize.y;     // Aspect ratio of image
      vec2 newUv = uv;
      if (s > i) {
        // Plane is wider than image
        float newHeight = planeSize.x / i;
        newUv.y = (uv.y - 0.5) * (planeSize.y / newHeight) + 0.5;
      } else {
        // Plane is taller than image
        float newWidth = planeSize.y * i;
        newUv.x = (uv.x - 0.5) * (planeSize.x / newWidth) + 0.5;
      }
      return newUv;
    }

    // Pseudo random noise
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv1 = getCoverUv(vUv, uImageSize1, uPlaneSize);
      vec2 uv2 = getCoverUv(vUv, uImageSize2, uPlaneSize);

      vec4 color1 = texture2D(uTex1, uv1);
      vec4 color2 = texture2D(uTex2, uv2);

      // Magical dissolve pattern (organic noise)
      float noiseBase = random(vUv * 3.0 + vec2(uTime * 0.3));
      float dissolve = smoothstep(uTransition - 0.3, uTransition + 0.3, noiseBase);

      // Blend old -> new based on dissolve
      vec4 finalColor = mix(color1, color2, dissolve * uTransition);

      // Edge glow effect during transition
      float edge = 0.0;
      if (uTransition > 0.0 && uTransition < 1.0) {
        float diff = abs(dissolve - 0.5);
        edge = smoothstep(0.35, 0.0, diff) * uTransition * 1.5;
      }

      // Magical glowing particles (amber/orange spark particles for cosmic fire effect)
      vec3 glowColor = vec3(0.95, 0.55, 0.1); // Golden orange stardust
      float sparkle = random(vUv + uTime * 0.1) * edge;
      
      finalColor.rgb = mix(finalColor.rgb, glowColor + vec3(sparkle * 0.4), edge);

      gl_FragColor = finalColor;
    }
  `;

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const state = stateRef.current;

    // 1. Initialize WebGL Renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn("MagicShaderSlideshow: WebGL context creation failed.", e);
      // Retry once after a short delay (handles React StrictMode double-invoke)
      if (retryCountRef.current < 2) {
        retryCountRef.current++;
        const retryTimer = setTimeout(() => {
          setWebglFailed((prev) => !prev); // Force re-render to retry
        }, 500);
        return () => clearTimeout(retryTimer);
      }
      setWebglFailed(true);
      return;
    }
    patchWebGLContext(renderer);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer = renderer;
    retryCountRef.current = 0; // Reset retry counter on success
    setWebglFailed(false);

    // 2. Initialize Scene & Camera
    const scene = new THREE.Scene();
    state.scene = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    state.camera = camera;

    // 3. Create Uniforms & Shader Material
    const placeholderTex = createPlaceholderTexture() as THREE.Texture;
    state.texture1 = placeholderTex;
    state.texture2 = placeholderTex;

    const uniforms = {
      uTex1: { value: placeholderTex },
      uTex2: { value: placeholderTex },
      uTransition: { value: 0.0 },
      uTime: { value: 0.0 },
      uImageSize1: { value: new THREE.Vector2(100, 100) },
      uImageSize2: { value: new THREE.Vector2(100, 100) },
      uPlaneSize: { value: new THREE.Vector2(width, height) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    state.material = material;

    // 4. Create Plane Mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 5. Load Initial Image
    if (imageUrl) {
      state.textureLoader.load(imageUrl, (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        state.texture1 = tex;
        state.texture2 = tex;
        state.imageSize1.set(tex.image.width || 1, tex.image.height || 1);
        state.imageSize2.set(tex.image.width || 1, tex.image.height || 1);
        
        uniforms.uTex1.value = tex;
        uniforms.uTex2.value = tex;
        uniforms.uImageSize1.value.copy(state.imageSize1);
        uniforms.uImageSize2.value.copy(state.imageSize2);
      }, undefined, () => {
        // Fallback placeholder on load failure
      });
      state.currentUrl = imageUrl;
    }

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height;
      if (w > 0 && h > 0) {
        renderer.setSize(w, h);
        uniforms.uPlaneSize.value.set(w, h);
      }
    });
    resizeObserver.observe(container);

    // 7. Animation Loop
    let animationId: number;
    const loopStartTime = performance.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const currentTime = (performance.now() - loopStartTime) / 1000;
      uniforms.uTime.value = currentTime;

      if (state.isTransitioning) {
        const elapsed = currentTime - state.startTime;
        const duration = 1.2; // 1.2 seconds for magic transition
        const progress = Math.min(elapsed / duration, 1.0);
        state.transition = progress;
        uniforms.uTransition.value = progress;

        if (progress >= 1.0) {
          // Transition complete: Swap texture 1 and texture 2
          state.isTransitioning = false;
          state.texture1 = state.texture2;
          state.imageSize1.copy(state.imageSize2);
          uniforms.uTex1.value = state.texture2!;
          uniforms.uImageSize1.value.copy(state.imageSize2);
          state.transition = 0.0;
          uniforms.uTransition.value = 0.0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      placeholderTex.dispose();
      if (state.texture1 && state.texture1 !== placeholderTex) state.texture1.dispose();
      if (state.texture2 && state.texture2 !== placeholderTex && state.texture2 !== state.texture1) {
        state.texture2.dispose();
      }
      renderer.dispose();
      state.renderer = null;
      state.material = null;
    };
  }, [webglFailed]);

  // Effect to load new texture and trigger transition
  useEffect(() => {
    const state = stateRef.current;
    if (!imageUrl || state.currentUrl === imageUrl) return;

    state.textureLoader.load(imageUrl, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;

      // Set target texture
      state.texture2 = tex;
      state.imageSize2.set(tex.image.width || 1, tex.image.height || 1);

      if (state.material) {
        state.material.uniforms.uTex2.value = tex;
        state.material.uniforms.uImageSize2.value.copy(state.imageSize2);
        
        // Start transition
        state.startTime = state.material.uniforms.uTime.value;
        state.isTransitioning = true;
        state.transition = 0.0;
        state.material.uniforms.uTransition.value = 0.0;
      }
      state.currentUrl = imageUrl;
    }, undefined, (err) => {
      console.error("Failed to load slideshow texture: ", imageUrl, err);
    });
  }, [imageUrl]);

  // CSS Fallback: when WebGL is unavailable, render the image with CSS effects
  if (webglFailed) {
    return (
      <div className={`relative w-full h-full min-h-[250px] overflow-hidden ${className}`}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Ilustração da cena"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Overlay gradient to simulate the shader ambient look */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14]/80 via-transparent to-[#0a0d14]/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/30 via-transparent to-[#0a0d14]/30 pointer-events-none" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[250px] overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
