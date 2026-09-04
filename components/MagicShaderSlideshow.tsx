import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { patchWebGLContext } from '@/lib/webgl-utils';
import { SlideTransitionType, SlideAspectRatio } from '@/lib/types';

interface MagicShaderSlideshowProps {
  imageUrl: string;
  className?: string;
  transitionType?: SlideTransitionType;
  aspectRatio?: SlideAspectRatio;
  fitMode?: 'cover' | 'contain';
  onTransitionEnd?: () => void;
  isPaused?: boolean;
}

// Convert transition type to uniform integer
function getTransitionTypeInt(type?: SlideTransitionType): number {
  switch (type) {
    case 'dream_waves':
      return 1;
    case 'book_page_flip_3d':
      return 2;
    case 'arcane_vision':
      return 3;
    case 'dark_mist':
      return 4;
    case 'crossfade':
      return 5;
    case 'magical_dissolve':
    default:
      return 0;
  }
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
  transitionType = 'magical_dissolve',
  fitMode = 'cover',
  onTransitionEnd,
  isPaused = false,
}) => {
  const isPausedRef = useRef(Boolean(isPaused));
  useEffect(() => {
    isPausedRef.current = Boolean(isPaused);
  }, [isPaused]);

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
    transitionTypeInt: getTransitionTypeInt(transitionType),
  });

  // Keep transition type updated in stateRef
  useEffect(() => {
    stateRef.current.transitionTypeInt = getTransitionTypeInt(transitionType);
    if (stateRef.current.material) {
      stateRef.current.material.uniforms.uTransitionType.value = stateRef.current.transitionTypeInt;
    }
  }, [transitionType]);

  // Keep fit mode updated in stateRef
  useEffect(() => {
    if (stateRef.current.material) {
      stateRef.current.material.uniforms.uFitMode.value = fitMode === 'contain' ? 1.0 : 0.0;
    }
  }, [fitMode]);

  // Vertex Shader
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  // Fragment Shader supporting multiple transitions (Dream waves, 3D Book Page Curl, Arcane Vision, Dark Mist, Magical Dissolve, Crossfade)
  const fragmentShader = `
    uniform sampler2D uTex1;
    uniform sampler2D uTex2;
    uniform float uTransition;
    uniform float uTime;
    uniform int uTransitionType;
    uniform float uFitMode; // 0.0 = cover, 1.0 = contain
    uniform vec2 uImageSize1;
    uniform vec2 uImageSize2;
    uniform vec2 uPlaneSize;
    varying vec2 vUv;

    #define PI 3.14159265359

    // Aspect ratio correction (object-fit: cover)
    vec2 getCoverUv(vec2 uv, vec2 imgSize, vec2 planeSize) {
      if (imgSize.x <= 0.0 || imgSize.y <= 0.0 || planeSize.x <= 0.0 || planeSize.y <= 0.0) {
        return uv;
      }
      float s = planeSize.x / planeSize.y;
      float i = imgSize.x / imgSize.y;
      vec2 newUv = uv;
      if (s > i) {
        float newHeight = planeSize.x / i;
        newUv.y = (uv.y - 0.5) * (planeSize.y / newHeight) + 0.5;
      } else {
        float newWidth = planeSize.y * i;
        newUv.x = (uv.x - 0.5) * (planeSize.x / newWidth) + 0.5;
      }
      return newUv;
    }

    // Pseudo random noise
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // Smooth value noise
    float noise(vec2 p) {
      vec2 ip = floor(p);
      vec2 u = fract(p);
      u = u * u * (3.0 - 2.0 * u);
      float res = mix(
        mix(random(ip), random(ip + vec2(1.0, 0.0)), u.x),
        mix(random(ip + vec2(0.0, 1.0)), random(ip + vec2(1.0, 1.0)), u.x),
        u.y
      );
      return res;
    }

    // Fractional Brownian Motion for ethereal clouds/mist
    float fbm(vec2 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = p * 2.02;
      f += 0.2500 * noise(p); p = p * 2.03;
      f += 0.1250 * noise(p); p = p * 2.01;
      return f;
    }

    void main() {
      vec2 uv1 = getCoverUv(vUv, uImageSize1, uPlaneSize);
      vec2 uv2 = getCoverUv(vUv, uImageSize2, uPlaneSize);

      float progress = clamp(uTransition, 0.0, 1.0);
      vec4 finalColor = vec4(0.0);

      // ==========================================
      // 1. DREAM WAVES (Sonhos & Ondas Etéreas)
      // ==========================================
      if (uTransitionType == 1) {
        float waveStrength = sin(progress * PI) * 0.06;
        float waveFreq = 12.0;
        
        vec2 waveUv1 = uv1 + vec2(
          sin(uv1.y * waveFreq + uTime * 3.0) * waveStrength,
          cos(uv1.x * waveFreq + uTime * 2.5) * waveStrength
        );
        vec2 waveUv2 = uv2 + vec2(
          sin(uv2.y * waveFreq - uTime * 3.0) * waveStrength * (1.0 - progress),
          cos(uv2.x * waveFreq - uTime * 2.5) * waveStrength * (1.0 - progress)
        );

        // Chromatic aberration during transition
        float aberration = sin(progress * PI) * 0.015;
        vec4 col1 = vec4(
          texture2D(uTex1, waveUv1 + vec2(aberration, 0.0)).r,
          texture2D(uTex1, waveUv1).g,
          texture2D(uTex1, waveUv1 - vec2(aberration, 0.0)).b,
          1.0
        );
        vec4 col2 = vec4(
          texture2D(uTex2, waveUv2 - vec2(aberration, 0.0)).r,
          texture2D(uTex2, waveUv2).g,
          texture2D(uTex2, waveUv2 + vec2(aberration, 0.0)).b,
          1.0
        );

        // Ethereal dream glow
        float dreamGlow = sin(progress * PI) * 0.35;
        vec4 blended = mix(col1, col2, smoothstep(0.1, 0.9, progress));
        vec3 auraColor = vec3(0.65, 0.8, 1.0); // Celestial dream aura
        blended.rgb += auraColor * dreamGlow * (0.5 + 0.5 * sin(uTime * 4.0));
        finalColor = blended;
      }

      // ==========================================
      // 2. 3D BOOK PAGE FLIP (Virar Página de Livro 3D)
      // ==========================================
      else if (uTransitionType == 2) {
        float curlRadius = 0.18;
        float curlProgress = progress * (1.0 + curlRadius * 2.0) - curlRadius;
        
        // Horizontal page flip line (from right to left)
        float xDist = (1.0 - vUv.x) - curlProgress;

        if (xDist < 0.0) {
          // Area already turned: reveal page 2 with ambient shadow fading
          float shadow = smoothstep(-0.35, 0.0, xDist) * 0.3;
          vec4 col2 = texture2D(uTex2, uv2);
          col2.rgb *= (1.0 - shadow);
          finalColor = col2;
        } else if (xDist < curlRadius) {
          // The cylindrical 3D curl region
          float angle = asin(clamp(xDist / curlRadius, -1.0, 1.0));
          float depthShade = cos(angle);
          
          // Deform UV on the curl
          vec2 curlUv = uv1;
          curlUv.x += (curlRadius * (1.0 - cos(angle))) * 0.5;
          vec4 col1 = texture2D(uTex1, curlUv);
          
          // Add 3D page highlight and shadow
          col1.rgb = mix(col1.rgb * depthShade, vec3(1.0, 0.95, 0.85), (1.0 - depthShade) * 0.4);
          finalColor = col1;
        } else {
          // Unturned page 1 with casting shadow under the curl
          float castShadow = smoothstep(curlRadius + 0.25, curlRadius, xDist) * 0.4;
          vec4 col1 = texture2D(uTex1, uv1);
          col1.rgb *= (1.0 - castShadow);
          finalColor = col1;
        }
      }

      // ==========================================
      // 3. ARCANE VISION (Visão Mística & Clarividência)
      // ==========================================
      else if (uTransitionType == 3) {
        vec2 center = vec2(0.5, 0.5);
        vec2 d = vUv - center;
        float dist = length(d);
        
        // Arcane rune pulse & ripple
        float ripple = sin(dist * 25.0 - progress * 15.0) * 0.03 * (1.0 - progress);
        vec2 warpedUv1 = uv1 + (d / max(dist, 0.001)) * ripple;
        vec2 warpedUv2 = uv2 - (d / max(dist, 0.001)) * ripple;

        // Slit / Dimensional gate expansion
        float gate = smoothstep(progress - 0.2, progress + 0.2, (1.0 - dist * 1.4) + noise(vUv * 8.0) * 0.25);
        
        vec4 col1 = texture2D(uTex1, warpedUv1);
        vec4 col2 = texture2D(uTex2, warpedUv2);

        // Arcane glow boundary (Cyan / Emerald / Amber Arcana)
        float edge = abs(gate - 0.5);
        float glow = smoothstep(0.4, 0.0, edge) * sin(progress * PI);
        vec3 arcaneColor = mix(vec3(0.1, 0.9, 0.8), vec3(1.0, 0.75, 0.2), sin(uTime * 3.0) * 0.5 + 0.5);

        finalColor = mix(col1, col2, gate);
        finalColor.rgb += arcaneColor * glow * 1.6;
      }

      // ==========================================
      // 4. DARK MIST (Névoa Sombria & Mistério)
      // ==========================================
      else if (uTransitionType == 4) {
        float mist = fbm(vUv * 4.0 + vec2(uTime * 0.4, -uTime * 0.2));
        float threshold = progress * 1.4 - 0.2;
        float reveal = smoothstep(threshold - 0.25, threshold + 0.25, mist);

        vec4 col1 = texture2D(uTex1, uv1);
        vec4 col2 = texture2D(uTex2, uv2);

        // Smoke / Shadow tint on boundary
        float smoke = smoothstep(0.3, 0.0, abs(mist - threshold)) * sin(progress * PI);
        vec4 mixed = mix(col1, col2, reveal);
        mixed.rgb = mix(mixed.rgb, vec3(0.02, 0.03, 0.06), smoke * 0.75);

        finalColor = mixed;
      }

      // ==========================================
      // 5. CROSSFADE (Crossfade Suave)
      // ==========================================
      else if (uTransitionType == 5) {
        vec4 col1 = texture2D(uTex1, uv1);
        vec4 col2 = texture2D(uTex2, uv2);
        finalColor = mix(col1, col2, smoothstep(0.0, 1.0, progress));
      }

      // ==========================================
      // 0. MAGICAL DISSOLVE (Dissolve Mágico Dourado - Padrão)
      // ==========================================
      else {
        vec4 color1 = texture2D(uTex1, uv1);
        vec4 color2 = texture2D(uTex2, uv2);

        float noiseBase = random(vUv * 3.0 + vec2(uTime * 0.3));
        float dissolve = smoothstep(progress - 0.3, progress + 0.3, noiseBase);

        vec4 blended = mix(color1, color2, dissolve * progress);

        // Edge glow effect during transition
        float edge = 0.0;
        if (progress > 0.0 && progress < 1.0) {
          float diff = abs(dissolve - 0.5);
          edge = smoothstep(0.35, 0.0, diff) * progress * 1.5;
        }

        // Golden orange stardust
        vec3 glowColor = vec3(0.95, 0.55, 0.1);
        float sparkle = random(vUv + uTime * 0.1) * edge;
        blended.rgb = mix(blended.rgb, glowColor + vec3(sparkle * 0.4), edge);

        finalColor = blended;
      }

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
      console.warn('MagicShaderSlideshow: WebGL context creation failed.', e);
      if (retryCountRef.current < 2) {
        retryCountRef.current++;
        const retryTimer = setTimeout(() => {
          setWebglFailed((prev) => !prev);
        }, 500);
        return () => clearTimeout(retryTimer);
      }
      setWebglFailed(true);
      return;
    }
    patchWebGLContext(renderer);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5));
    state.renderer = renderer;
    retryCountRef.current = 0;
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
      uTransitionType: { value: state.transitionTypeInt },
      uFitMode: { value: fitMode === 'contain' ? 1.0 : 0.0 },
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
      state.textureLoader.load(
        imageUrl,
        (tex) => {
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
          if (renderer && scene && camera) {
            renderer.render(scene, camera);
          }
        },
        undefined,
        () => {}
      );
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
        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Animation Loop com Eco Mode & Visibility Detection
    let animationId: number;
    let isLoopRunning = false;
    const loopStartTime = performance.now();

    const animate = () => {
      const isHidden = typeof document !== 'undefined' && document.hidden;
      if (isPausedRef.current || isHidden) {
        isLoopRunning = false;
        return;
      }

      animationId = requestAnimationFrame(animate);
      isLoopRunning = true;
      const currentTime = (performance.now() - loopStartTime) / 1000;
      uniforms.uTime.value = currentTime;

      if (state.isTransitioning) {
        const elapsed = currentTime - state.startTime;
        const duration = 1.35; // 1.35 seconds for rich cinematic transition
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
          if (onTransitionEnd) onTransitionEnd();
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleVisibilityChange = () => {
      if (!document.hidden && !isPausedRef.current && !isLoopRunning) {
        animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    state.textureLoader.load(
      imageUrl,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;

        // Set target texture
        state.texture2 = tex;
        state.imageSize2.set(tex.image.width || 1, tex.image.height || 1);

        if (state.material) {
          state.material.uniforms.uTex2.value = tex;
          state.material.uniforms.uImageSize2.value.copy(state.imageSize2);
          state.material.uniforms.uTransitionType.value = getTransitionTypeInt(transitionType);

          // Start transition
          state.startTime = state.material.uniforms.uTime.value;
          state.isTransitioning = true;
          state.transition = 0.0;
          state.material.uniforms.uTransition.value = 0.0;
        }
        state.currentUrl = imageUrl;
      },
      undefined,
      (err) => {
        console.error('Failed to load slideshow texture: ', imageUrl, err);
      }
    );
  }, [imageUrl, transitionType]);

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
