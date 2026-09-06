import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SlideTransitionType, SlideAspectRatio } from '@/lib/types';

interface MagicShaderSlideshowProps {
  imageUrl: string;
  className?: string;
  transitionType?: SlideTransitionType;
  aspectRatio?: SlideAspectRatio;
  fitMode?: 'cover' | 'contain';
  onTransitionEnd?: () => void;
  isPaused?: boolean;
  triggerKey?: string | number;
}

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

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  varying vec2 vUv;
  void main() {
    vUv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;

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

  #define PI 3.14159265358979323846

  vec2 getUv(vec2 uv, vec2 imgSize, vec2 planeSize, float mode, out bool isOutOfBound) {
    isOutOfBound = false;
    if (imgSize.x <= 0.0 || imgSize.y <= 0.0 || planeSize.x <= 0.0 || planeSize.y <= 0.0) {
      return uv;
    }
    float screenAspect = planeSize.x / planeSize.y;
    float imageAspect = imgSize.x / imgSize.y;
    vec2 newUv = uv;

    if (mode < 0.5) {
      // COVER
      if (screenAspect > imageAspect) {
        float newHeight = planeSize.x / imageAspect;
        newUv.y = (uv.y - 0.5) * (planeSize.y / newHeight) + 0.5;
      } else {
        float newWidth = planeSize.y * imageAspect;
        newUv.x = (uv.x - 0.5) * (planeSize.x / newWidth) + 0.5;
      }
    } else {
      // CONTAIN
      if (screenAspect > imageAspect) {
        float newWidth = planeSize.y * imageAspect;
        newUv.x = (uv.x - 0.5) * (planeSize.x / newWidth) + 0.5;
      } else {
        float newHeight = planeSize.x / imageAspect;
        newUv.y = (uv.y - 0.5) * (planeSize.y / newHeight) + 0.5;
      }
      if (newUv.x < 0.0 || newUv.x > 1.0 || newUv.y < 0.0 || newUv.y > 1.0) {
        isOutOfBound = true;
      }
    }
    return clamp(newUv, 0.0, 1.0);
  }

  float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

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

  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = p * 2.02;
    f += 0.2500 * noise(p); p = p * 2.03;
    f += 0.1250 * noise(p); p = p * 2.01;
    return f;
  }

  vec4 sampleTexture(sampler2D tex, vec2 uv, vec2 imgSize, vec2 planeSize, float mode) {
    bool outOfBound = false;
    vec2 finalUv = getUv(uv, imgSize, planeSize, mode, outOfBound);
    if (outOfBound) {
      return vec4(0.04, 0.05, 0.08, 1.0);
    }
    return texture2D(tex, finalUv);
  }

  void main() {
    float progress = clamp(uTransition, 0.0, 1.0);
    vec4 finalColor = vec4(0.0);

    // 1. DREAM WAVES
    if (uTransitionType == 1) {
      float waveStrength = sin(progress * PI) * 0.05;
      float waveFreq = 14.0;

      vec2 waveUv1 = vUv + vec2(
        sin(vUv.y * waveFreq + uTime * 2.5) * waveStrength,
        cos(vUv.x * waveFreq + uTime * 2.0) * waveStrength
      );
      vec2 waveUv2 = vUv + vec2(
        sin(vUv.y * waveFreq - uTime * 2.5) * waveStrength * (1.0 - progress),
        cos(vUv.x * waveFreq - uTime * 2.0) * waveStrength * (1.0 - progress)
      );

      float aberration = sin(progress * PI) * 0.012;
      vec4 col1 = vec4(
        sampleTexture(uTex1, waveUv1 + vec2(aberration, 0.0), uImageSize1, uPlaneSize, uFitMode).r,
        sampleTexture(uTex1, waveUv1, uImageSize1, uPlaneSize, uFitMode).g,
        sampleTexture(uTex1, waveUv1 - vec2(aberration, 0.0), uImageSize1, uPlaneSize, uFitMode).b,
        1.0
      );
      vec4 col2 = vec4(
        sampleTexture(uTex2, waveUv2 - vec2(aberration, 0.0), uImageSize2, uPlaneSize, uFitMode).r,
        sampleTexture(uTex2, waveUv2, uImageSize2, uPlaneSize, uFitMode).g,
        sampleTexture(uTex2, waveUv2 + vec2(aberration, 0.0), uImageSize2, uPlaneSize, uFitMode).b,
        1.0
      );

      float blendFactor = smoothstep(0.0, 1.0, progress);
      vec4 blended = mix(col1, col2, blendFactor);

      float dreamGlow = sin(progress * PI) * 0.35;
      vec3 auraColor = vec3(0.5, 0.85, 1.0);
      blended.rgb += auraColor * dreamGlow * (0.6 + 0.4 * sin(uTime * 4.0));
      finalColor = blended;
    }
    // 2. 3D BOOK PAGE FLIP
    else if (uTransitionType == 2) {
      float curlRadius = 0.22;
      float curlCenter = (1.0 - progress) * (1.0 + curlRadius * 2.5) - curlRadius * 1.25;
      float xDist = vUv.x - curlCenter;

      vec4 col1 = sampleTexture(uTex1, vUv, uImageSize1, uPlaneSize, uFitMode);
      vec4 col2 = sampleTexture(uTex2, vUv, uImageSize2, uPlaneSize, uFitMode);

      if (xDist > curlRadius) {
        float shadow = smoothstep(curlRadius + 0.2, curlRadius, xDist) * 0.35 * sin(progress * PI);
        col1.rgb *= (1.0 - shadow);
        finalColor = col1;
      } else if (xDist > 0.0) {
        float angle = asin(clamp(xDist / curlRadius, 0.0, 1.0));
        float depthShade = cos(angle);
        vec2 deformedUv = vUv;
        deformedUv.x -= (curlRadius * (1.0 - cos(angle))) * 0.4;
        vec4 curCol = sampleTexture(uTex1, deformedUv, uImageSize1, uPlaneSize, uFitMode);

        float highlight = pow(1.0 - depthShade, 2.0) * 0.3;
        curCol.rgb = curCol.rgb * (depthShade * 0.7 + 0.3) + vec3(highlight);
        finalColor = curCol;
      } else {
        float shadow = smoothstep(-0.35, 0.0, xDist) * 0.3 * (1.0 - progress);
        col2.rgb *= (1.0 - shadow);
        finalColor = col2;
      }
    }
    // 3. ARCANE VISION
    else if (uTransitionType == 3) {
      vec2 center = vec2(0.5, 0.5);
      vec2 d = vUv - center;
      float dist = length(d);
      float angle = atan(d.y, d.x);

      float maxRadius = 1.55;
      float currentRadius = progress * maxRadius;
      float edgeWidth = 0.14;

      float runeDistort = sin(angle * 8.0 + uTime * 3.5) * 0.035 * sin(progress * PI)
                        + noise(vUv * 8.0 + uTime * 2.0) * 0.03 * sin(progress * PI);
      float effectiveDist = dist + runeDistort;

      float gate = smoothstep(currentRadius - edgeWidth, currentRadius + edgeWidth, effectiveDist);

      vec4 col1 = sampleTexture(uTex1, vUv, uImageSize1, uPlaneSize, uFitMode);
      vec4 col2 = sampleTexture(uTex2, vUv, uImageSize2, uPlaneSize, uFitMode);

      vec4 blended = mix(col2, col1, gate);

      float boundaryDist = abs(effectiveDist - currentRadius);
      float glow = (1.0 - smoothstep(0.0, edgeWidth * 1.8, boundaryDist)) * sin(progress * PI);
      vec3 arcaneColor = mix(vec3(0.05, 0.9, 0.8), vec3(1.0, 0.75, 0.2), sin(angle * 3.0 + uTime * 3.0) * 0.5 + 0.5);
      blended.rgb += arcaneColor * glow * 1.8;

      finalColor = blended;
    }
    // 4. DARK MIST
    else if (uTransitionType == 4) {
      vec2 mistUv = vUv * 4.5 + vec2(uTime * 0.25, -uTime * 0.15);
      float mistNoise = fbm(mistUv);

      float edgeWidth = 0.18;
      float threshold = progress * (1.0 + edgeWidth * 2.0) - edgeWidth;
      float reveal = 1.0 - smoothstep(threshold - edgeWidth, threshold + edgeWidth, mistNoise);

      vec4 col1 = sampleTexture(uTex1, vUv, uImageSize1, uPlaneSize, uFitMode);
      vec4 col2 = sampleTexture(uTex2, vUv, uImageSize2, uPlaneSize, uFitMode);

      vec4 mixed = mix(col1, col2, reveal);

      float smoke = smoothstep(0.0, edgeWidth * 1.5, abs(mistNoise - threshold));
      float shadowEdge = (1.0 - smoke) * sin(progress * PI);
      mixed.rgb = mix(mixed.rgb, vec3(0.02, 0.03, 0.06), shadowEdge * 0.7);

      finalColor = mixed;
    }
    // 5. CROSSFADE
    else if (uTransitionType == 5) {
      vec4 col1 = sampleTexture(uTex1, vUv, uImageSize1, uPlaneSize, uFitMode);
      vec4 col2 = sampleTexture(uTex2, vUv, uImageSize2, uPlaneSize, uFitMode);
      finalColor = mix(col1, col2, smoothstep(0.0, 1.0, progress));
    }
    // 0. MAGICAL DISSOLVE
    else {
      vec2 dissolveUv = vUv * 5.0 + vec2(uTime * 0.1, uTime * 0.08);
      float noiseVal = fbm(dissolveUv);

      float edgeWidth = 0.16;
      float threshold = progress * (1.0 + edgeWidth * 2.0) - edgeWidth;
      float factor = 1.0 - smoothstep(threshold - edgeWidth, threshold + edgeWidth, noiseVal);

      vec4 col1 = sampleTexture(uTex1, vUv, uImageSize1, uPlaneSize, uFitMode);
      vec4 col2 = sampleTexture(uTex2, vUv, uImageSize2, uPlaneSize, uFitMode);

      vec4 blended = mix(col1, col2, factor);

      float boundaryDist = abs(noiseVal - threshold);
      float ember = (1.0 - smoothstep(0.0, edgeWidth * 1.5, boundaryDist)) * sin(progress * PI);
      vec3 emberColor = mix(vec3(1.0, 0.5, 0.05), vec3(1.0, 0.88, 0.35), random(vUv + uTime * 0.1));
      blended.rgb += emberColor * ember * 1.8;

      finalColor = blended;
    }

    gl_FragColor = finalColor;
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createSolidTexture(gl: WebGLRenderingContext, r = 10, g = 13, b = 20): WebGLTexture | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([r, g, b, 255])
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

interface LoadedTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
}

export const MagicShaderSlideshow: React.FC<MagicShaderSlideshowProps> = ({
  imageUrl,
  className = '',
  transitionType = 'magical_dissolve',
  fitMode = 'cover',
  onTransitionEnd,
  isPaused = false,
  triggerKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const isPausedRef = useRef(Boolean(isPaused));
  useEffect(() => {
    isPausedRef.current = Boolean(isPaused);
  }, [isPaused]);

  const onTransitionEndRef = useRef(onTransitionEnd);
  useEffect(() => {
    onTransitionEndRef.current = onTransitionEnd;
  }, [onTransitionEnd]);

  const fitModeRef = useRef(fitMode);
  useEffect(() => {
    fitModeRef.current = fitMode;
  }, [fitMode]);

  const transitionTypeRef = useRef(transitionType);
  useEffect(() => {
    transitionTypeRef.current = transitionType;
  }, [transitionType]);

  const textureCacheRef = useRef<Map<string, LoadedTexture>>(new Map());

  const stateRef = useRef<{
    gl: WebGLRenderingContext | null;
    program: WebGLProgram | null;
    locations: {
      position: number;
      uTex1: WebGLUniformLocation | null;
      uTex2: WebGLUniformLocation | null;
      uTransition: WebGLUniformLocation | null;
      uTime: WebGLUniformLocation | null;
      uTransitionType: WebGLUniformLocation | null;
      uFitMode: WebGLUniformLocation | null;
      uImageSize1: WebGLUniformLocation | null;
      uImageSize2: WebGLUniformLocation | null;
      uPlaneSize: WebGLUniformLocation | null;
    } | null;
    currentTexture: LoadedTexture | null;
    targetTexture: LoadedTexture | null;
    placeholderTexture: WebGLTexture | null;
    isTransitioning: boolean;
    transitionStartTime: number;
    currentUrl: string;
    rafId: number;
    isRunning: boolean;
    startLoop: () => void;
    renderFrame: () => void;
  }>({
    gl: null,
    program: null,
    locations: null,
    currentTexture: null,
    targetTexture: null,
    placeholderTexture: null,
    isTransitioning: false,
    transitionStartTime: 0,
    currentUrl: '',
    rafId: 0,
    isRunning: false,
    startLoop: () => {},
    renderFrame: () => {},
  });

  const loadTextureAsync = useCallback((url: string): Promise<LoadedTexture> => {
    const gl = stateRef.current.gl;
    if (!gl) return Promise.reject(new Error('WebGL not initialized'));

    const cached = textureCacheRef.current.get(url);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!stateRef.current.gl) {
          reject(new Error('WebGL unmounted'));
          return;
        }
        const currentGl = stateRef.current.gl;
        const texture = currentGl.createTexture();
        if (!texture) {
          reject(new Error('Failed to create WebGL texture'));
          return;
        }
        currentGl.bindTexture(currentGl.TEXTURE_2D, texture);
        currentGl.pixelStorei(currentGl.UNPACK_FLIP_Y_WEBGL, 1);
        currentGl.texImage2D(currentGl.TEXTURE_2D, 0, currentGl.RGBA, currentGl.RGBA, currentGl.UNSIGNED_BYTE, img);
        currentGl.texParameteri(currentGl.TEXTURE_2D, currentGl.TEXTURE_WRAP_S, currentGl.CLAMP_TO_EDGE);
        currentGl.texParameteri(currentGl.TEXTURE_2D, currentGl.TEXTURE_WRAP_T, currentGl.CLAMP_TO_EDGE);
        currentGl.texParameteri(currentGl.TEXTURE_2D, currentGl.TEXTURE_MIN_FILTER, currentGl.LINEAR);
        currentGl.texParameteri(currentGl.TEXTURE_2D, currentGl.TEXTURE_MAG_FILTER, currentGl.LINEAR);

        const loaded: LoadedTexture = {
          texture,
          width: img.naturalWidth || img.width || 800,
          height: img.naturalHeight || img.height || 600,
        };
        textureCacheRef.current.set(url, loaded);
        resolve(loaded);
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }, []);

  const startTransition = useCallback((nextTexture: LoadedTexture) => {
    const state = stateRef.current;
    if (!state.gl) return;

    if (!state.currentTexture) {
      state.currentTexture = nextTexture;
      state.targetTexture = nextTexture;
      state.isTransitioning = false;
      state.renderFrame();
      return;
    }

    state.targetTexture = nextTexture;
    state.transitionStartTime = performance.now();
    state.isTransitioning = true;
    state.startLoop();
  }, []);

  // WebGL Context Setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      console.warn('MagicShaderSlideshow: WebGL context not supported.');
      setWebglFailed(true);
      return;
    }

    const program = createProgram(gl, VERTEX_SHADER_SRC, FRAGMENT_SHADER_SRC);
    if (!program) {
      setWebglFailed(true);
      return;
    }

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const locations = {
      position: positionLoc,
      uTex1: gl.getUniformLocation(program, 'uTex1'),
      uTex2: gl.getUniformLocation(program, 'uTex2'),
      uTransition: gl.getUniformLocation(program, 'uTransition'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uTransitionType: gl.getUniformLocation(program, 'uTransitionType'),
      uFitMode: gl.getUniformLocation(program, 'uFitMode'),
      uImageSize1: gl.getUniformLocation(program, 'uImageSize1'),
      uImageSize2: gl.getUniformLocation(program, 'uImageSize2'),
      uPlaneSize: gl.getUniformLocation(program, 'uPlaneSize'),
    };

    const placeholder = createSolidTexture(gl);

    const state = stateRef.current;
    state.gl = gl;
    state.program = program;
    state.locations = locations;
    state.placeholderTexture = placeholder;

    const render = (progress = 0.0, time = 0.0) => {
      if (!gl || !program || !locations) return;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

      const tex1 = state.currentTexture?.texture || state.placeholderTexture;
      const tex2 = state.targetTexture?.texture || tex1;
      const size1 = state.currentTexture || { width: 1, height: 1 };
      const size2 = state.targetTexture || size1;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex1);
      gl.uniform1i(locations.uTex1, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, tex2);
      gl.uniform1i(locations.uTex2, 1);

      gl.uniform1f(locations.uTransition, progress);
      gl.uniform1f(locations.uTime, time);
      gl.uniform1i(locations.uTransitionType, getTransitionTypeInt(transitionTypeRef.current));
      gl.uniform1f(locations.uFitMode, fitModeRef.current === 'contain' ? 1.0 : 0.0);
      gl.uniform2f(locations.uImageSize1, size1.width, size1.height);
      gl.uniform2f(locations.uImageSize2, size2.width, size2.height);
      gl.uniform2f(locations.uPlaneSize, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    state.renderFrame = () => {
      const now = performance.now() / 1000;
      render(0.0, now);
    };

    const DURATION = 1.25; // 1.25s cinematic transition

    const loop = () => {
      const isHidden = typeof document !== 'undefined' && document.hidden;
      if (isPausedRef.current || isHidden) {
        state.isRunning = false;
        return;
      }

      state.isRunning = true;
      state.rafId = requestAnimationFrame(loop);

      const now = performance.now();
      const timeInSec = now / 1000;

      if (state.isTransitioning) {
        const elapsed = (now - state.transitionStartTime) / 1000;
        const progress = Math.min(elapsed / DURATION, 1.0);

        render(progress, timeInSec);

        if (progress >= 1.0) {
          state.isTransitioning = false;
          state.currentTexture = state.targetTexture;
          render(0.0, timeInSec);

          if (onTransitionEndRef.current) {
            onTransitionEndRef.current();
          }
        }
      } else {
        render(0.0, timeInSec);
      }
    };

    state.startLoop = () => {
      if (!state.isRunning && !isPausedRef.current) {
        loop();
      }
    };

    // Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 1.5);
      const w = Math.floor(entry.contentRect.width * dpr);
      const h = Math.floor(entry.contentRect.height * dpr);
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
        state.renderFrame();
      }
    });
    resizeObserver.observe(container);

    const handleVisibility = () => {
      if (!document.hidden && !isPausedRef.current) {
        state.startLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial load if imageUrl already present
    if (imageUrl) {
      loadTextureAsync(imageUrl)
        .then((tex) => {
          state.currentUrl = imageUrl;
          state.currentTexture = tex;
          state.targetTexture = tex;
          state.renderFrame();
        })
        .catch((err) => {
          console.warn('Initial texture load failed:', err);
        });
    }

    state.startLoop();

    return () => {
      cancelAnimationFrame(state.rafId);
      state.isRunning = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      resizeObserver.disconnect();
      if (gl) {
        if (posBuffer) gl.deleteBuffer(posBuffer);
        if (program) gl.deleteProgram(program);
        if (placeholder) gl.deleteTexture(placeholder);
        textureCacheRef.current.forEach((item) => {
          gl.deleteTexture(item.texture);
        });
        textureCacheRef.current.clear();
      }
      state.gl = null;
      state.program = null;
      state.locations = null;
    };
  }, [loadTextureAsync]);

  // Handle URL change or forced trigger
  useEffect(() => {
    if (!imageUrl) return;
    const state = stateRef.current;

    const isUrlChange = state.currentUrl !== imageUrl;
    state.currentUrl = imageUrl;

    loadTextureAsync(imageUrl)
      .then((tex) => {
        if (!state.currentTexture) {
          state.currentTexture = tex;
          state.targetTexture = tex;
          state.renderFrame();
        } else if (isUrlChange || triggerKey !== undefined) {
          startTransition(tex);
        }
      })
      .catch((err) => {
        console.warn('Failed to load transition texture:', imageUrl, err);
      });
  }, [imageUrl, triggerKey, loadTextureAsync, startTransition]);

  // Pause / Resume listener
  useEffect(() => {
    if (!isPaused) {
      stateRef.current.startLoop();
    }
  }, [isPaused]);

  if (webglFailed) {
    return (
      <div className={`relative w-full h-full min-h-0 overflow-hidden ${className}`}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Ilustração da cena"
            className={`absolute inset-0 w-full h-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14]/80 via-transparent to-[#0a0d14]/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14]/30 via-transparent to-[#0a0d14]/30 pointer-events-none" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full min-h-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

