import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MagicShaderSlideshowProps {
  imageUrl: string;
  className?: string;
}

export const MagicShaderSlideshow: React.FC<MagicShaderSlideshowProps> = ({
  imageUrl,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    // Pseudo-random noise
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // 2D Noise
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      // Corrected UVs for both textures
      vec2 uv1 = getCoverUv(vUv, uImageSize1, uPlaneSize);
      vec2 uv2 = getCoverUv(vUv, uImageSize2, uPlaneSize);

      // Noise pattern based on coordinates and time
      float n = noise(vUv * 15.0 + uTime * 0.15);

      // Transition progress threshold (from 0 to 2.5 to span the diagonal and noise)
      float progress = uTransition * 2.5;
      
      // Rule: diagonal gradient + noise distortion
      float rule = vUv.x + vUv.y + n * 0.5;

      // Glow edge calculation
      float edgeWidth = 0.18;
      float edge = smoothstep(progress - edgeWidth, progress, rule) * (1.0 - smoothstep(progress, progress + edgeWidth, rule));

      vec4 color1 = texture2D(uTex1, uv1);
      vec4 color2 = texture2D(uTex2, uv2);

      vec4 finalColor;
      if (rule < progress) {
        finalColor = color2;
      } else {
        finalColor = color1;
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

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer = renderer;

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
    };
  }, []);

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

  // Create a tiny canvas base64 image as default placeholder texture
  function createPlaceholderTexture() {
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

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-[250px] overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
