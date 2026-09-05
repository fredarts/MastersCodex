import * as THREE from 'three';

export interface VolumetricFogInstance {
  group: THREE.Group;
  update: (
    delta: number,
    timeOfDayPreset?: string,
    timeOfDayHour?: number,
    windAngle?: number,
    windStrength?: number
  ) => void;
  updateParams: (params: {
    intensity?: number;      // 0 to 300 (maps to density 0.0 to 1.0)
    height?: number;         // vertical span in meters (0.2m to 4.0m)
    speed?: number;          // drift speed multiplier (0.0 to 3.0)
    noiseScale?: number;     // scale of mist tendrils (0.5 to 3.0)
    colorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
    customColor?: string;
  }) => void;
  dispose: () => void;
}

const fogVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fogFragmentShader = `
  uniform float uTime;
  uniform float uDensity;       // 0.0 to 1.0
  uniform float uLayerIndex;    // 0.0, 1.0, 2.0 (for parallax height variation)
  uniform float uNoiseScale;    // 0.5 to 3.0
  uniform vec2 uWindDirection;
  uniform float uWindSpeed;
  uniform vec3 uFogColor;
  uniform vec3 uSunColor;
  uniform vec3 uSunPosition;

  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;

  // 2D Simplex Noise for WebGL
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
     -0.577350269189626,
      0.024390243902439
    );
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Multi-octave FBM for rolling mist tendrils
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.55;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amplitude * (snoise(p * frequency) * 0.5 + 0.5);
      p += vec2(2.3, 7.1);
      frequency *= 2.08;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    if (uDensity <= 0.001) {
      discard;
    }

    // World-space UV mapping for seamless grid spanning
    vec2 worldUv = vWorldPosition.xz * 0.035 * uNoiseScale;
    
    // Wind drift vector (scaled for rich, dynamic drift from calm breezes to roaring gales)
    vec2 drift = uWindDirection * (uTime * uWindSpeed * 0.16) * (1.0 + uLayerIndex * 0.22);
    vec2 coord = worldUv - drift + vec2(uLayerIndex * 31.7, uLayerIndex * 19.3);

    // Layer 1: Base rolling tendril structure
    float n1 = fbm(coord * 1.0);
    
    // Layer 2: Swirling turbulent vortices
    vec2 swirlCoord = (worldUv - drift * 1.3) * 1.8 + vec2(n1 * 0.4, -n1 * 0.3);
    float n2 = fbm(swirlCoord);
    
    float fogNoise = mix(n1, n2, 0.4);

    // Dynamic thresholding for smooth density control
    float minThresh = mix(0.70, 0.12, uDensity);
    float maxThresh = mix(0.95, 0.45, uDensity);
    float alpha = smoothstep(minThresh, maxThresh, fogNoise);

    if (alpha <= 0.005) {
      discard;
    }

    // Soft radial boundary fade (dissolves cleanly towards outer boundary)
    float distFromCenter = length(vWorldPosition.xz);
    float boundaryFade = smoothstep(150.0, 95.0, distFromCenter);

    // Exponential height decay per layer
    float layerHeightAttenuation = 1.0 / (1.0 + uLayerIndex * 0.45);

    // Sun / Moon Directional Inscattering (glowing rim facing the light source)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition + vec3(0.0001, 0.0001, 0.0001));
    vec3 normSun = normalize(uSunPosition + vec3(0.0001, 0.0001, 0.0001));
    float inscattering = pow(clamp(dot(viewDir, normSun), 0.0, 1.0), 4.0) * 0.75;
    vec3 finalColor = uFogColor + uSunColor * inscattering;

    // Final alpha blending with volumetric depth
    float finalAlpha = clamp(alpha * boundaryFade * layerHeightAttenuation * uDensity * 0.92, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export function createVolumetricGroundFogSystem(scene: THREE.Scene): VolumetricFogInstance {
  const group = new THREE.Group();
  group.name = 'battleVolumetricGroundFogGroup';

  const layersCount = 4;
  const layerMeshes: THREE.Mesh[] = [];
  const layerMaterials: THREE.ShaderMaterial[] = [];

  const geometry = new THREE.PlaneGeometry(300, 300, 64, 64);
  geometry.rotateX(-Math.PI / 2);

  // Common Uniforms State
  let currentDensity = 0.5; // 0 to 1
  let currentBaseHeight = 0.9;
  let currentSpeed = 1.0;
  let currentNoiseScale = 1.0;
  let currentPreset: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom' = 'natural';
  let customColorHex = '#cbd5e1';

  const targetFogColor = new THREE.Color(0xcbd5e1);
  const targetSunColor = new THREE.Color(0xfffbeb);
  const calculatedSunPos = new THREE.Vector3();

  for (let i = 0; i < layersCount; i++) {
    const uniforms = {
      uTime: { value: 0.0 },
      uDensity: { value: currentDensity },
      uLayerIndex: { value: i },
      uNoiseScale: { value: currentNoiseScale },
      uWindDirection: { value: new THREE.Vector2(0.0, -1.0) },
      uWindSpeed: { value: currentSpeed },
      uFogColor: { value: new THREE.Color(0xcbd5e1) },
      uSunColor: { value: new THREE.Color(0xfffbeb) },
      uSunPosition: { value: new THREE.Vector3(0, 50, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: fogVertexShader,
      fragmentShader: fogFragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
      fog: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.18 + i * (currentBaseHeight / layersCount);
    mesh.renderOrder = 2 + i; // render above ground/floor (0), below tokens and pins (50)
    mesh.frustumCulled = false;

    group.add(mesh);
    layerMeshes.push(mesh);
    layerMaterials.push(material);
  }

  scene.add(group);

  let totalElapsedTime = 0;

  const update = (
    delta: number,
    timeOfDayPreset = 'day',
    timeOfDayHour = 12,
    windAngle = 0,
    windStrength = 1.0
  ) => {
    if (currentDensity <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const dt = Math.min(delta, 0.1);
    totalElapsedTime += dt;

    // Compass angle mapping: 0° = North (-Z), 90° = East (+X), 180° = South (+Z), 270° = West (-X)
    const windRad = (windAngle * Math.PI) / 180;
    const windDirX = Math.sin(windRad);
    const windDirZ = -Math.cos(windRad);

    // Sun position calculation from hour
    const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
    const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);

    const sunAngle = ((timeOfDayHour - 6) / 24) * Math.PI * 2;
    calculatedSunPos.set(
      Math.cos(sunAngle) * 800,
      Math.sin(sunAngle) * 800,
      60
    );

    // Determine Fog Palette based on active style preset or environment
    if (currentPreset === 'graveyard') {
      targetFogColor.setHex(0x38bdf8); // Spectral Cyan/Blue
      targetSunColor.setHex(0x60a5fa);
    } else if (currentPreset === 'swamp') {
      targetFogColor.setHex(0x10b981); // Toxic Emerald Miasma
      targetSunColor.setHex(0x34d399);
    } else if (currentPreset === 'crimson') {
      targetFogColor.setHex(0xf43f5e); // Blood Crimson
      targetSunColor.setHex(0xfb7185);
    } else if (currentPreset === 'frost') {
      targetFogColor.setHex(0xe0f2fe); // Crystalline Frost White/Ice
      targetSunColor.setHex(0xffffff);
    } else if (currentPreset === 'custom') {
      targetFogColor.set(customColorHex);
      targetSunColor.setHex(0xffffff);
    } else {
      // Natural Preset - adapts automatically to daylight cycle
      if (timeOfDayPreset === 'storm') {
        targetFogColor.setHex(0x475569);
        targetSunColor.setHex(0x64748b);
      } else if (isNight) {
        targetFogColor.setHex(0x1e293b);
        targetSunColor.setHex(0x3b82f6);
      } else if (isSunset) {
        targetFogColor.setHex(0xfdba74);
        targetSunColor.setHex(0xf97316);
      } else {
        targetFogColor.setHex(0xcbd5e1);
        targetSunColor.setHex(0xfffbeb);
      }
    }

    layerMaterials.forEach((mat) => {
      mat.uniforms.uTime.value = totalElapsedTime;
      mat.uniforms.uWindDirection.value.set(windDirX, windDirZ);
      mat.uniforms.uWindSpeed.value = currentSpeed;
      mat.uniforms.uSunPosition.value.copy(calculatedSunPos);

      mat.uniforms.uFogColor.value.lerp(targetFogColor, 0.1);
      mat.uniforms.uSunColor.value.lerp(targetSunColor, 0.1);
    });
  };

  const updateParams = (params: {
    intensity?: number;
    height?: number;
    speed?: number;
    noiseScale?: number;
    colorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
    customColor?: string;
  }) => {
    if (params.intensity !== undefined) {
      // Scale from 0..300 slider to 0.0..1.0 density
      currentDensity = Math.max(0, Math.min(300, params.intensity)) / 300.0;
      layerMaterials.forEach((mat) => {
        mat.uniforms.uDensity.value = currentDensity;
      });
    }

    if (params.height !== undefined) {
      currentBaseHeight = Math.max(0.2, Math.min(4.0, params.height));
      layerMeshes.forEach((mesh, i) => {
        mesh.position.y = 0.18 + i * (currentBaseHeight / layersCount);
      });
    }

    if (params.speed !== undefined) {
      currentSpeed = params.speed;
    }

    if (params.noiseScale !== undefined) {
      currentNoiseScale = params.noiseScale;
      layerMaterials.forEach((mat) => {
        mat.uniforms.uNoiseScale.value = currentNoiseScale;
      });
    }

    if (params.colorPreset !== undefined) {
      currentPreset = params.colorPreset;
    }

    if (params.customColor !== undefined) {
      customColorHex = params.customColor;
    }
  };

  const dispose = () => {
    scene.remove(group);
    geometry.dispose();
    layerMaterials.forEach((mat) => mat.dispose());
  };

  return {
    group,
    update,
    updateParams,
    dispose,
  };
}
