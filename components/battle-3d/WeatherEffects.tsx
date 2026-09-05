import * as THREE from 'three';

// --- MODERN REALISTIC RAIN & GROUND SPLASH SYSTEM ---
export interface GridBounds {
  widthUnits: number;   // total width in 3D scene units (e.g. widthCells * 2.0)
  heightUnits: number;  // total height in 3D scene units (e.g. heightCells * 2.0)
  shape?: 'square' | 'circle';
}

export interface RainParams {
  intensity?: number;        // 0 to 8000 (draw range count)
  speed?: number;            // falling speed multiplier (0.2 to 5.0)
  dropSize?: number;         // visual size scale (0.5 to 4.0)
  windAngle?: number;        // direction angle in degrees (0 to 360)
  windStrength?: number;     // speed on horizontal axes (0.0 to 2.5)
  opacity?: number;          // drop opacity (0.1 to 1.0)
  theme?: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom';
  customColor?: string;      // hex color like '#38bdf8'
  hasSplashes?: boolean;     // enable ground splashes & ripples
  splashSize?: number;       // scale of ground ripple rings (0.5 to 3.0)
  splashIntensity?: number;  // frequency of splashes (0.0 to 1.0)
  hasCrownDrops?: boolean;   // bouncing droplets upon ground collision
  hasLightning?: boolean;    // thunderstorm lightning flash
  lightningFrequency?: number; // 0.1 (rare) to 2.0 (frequent storm)
  gridBounds?: GridBounds;   // restricts ground splashes strictly to the combat grid floor plane
}

export interface RainInstance {
  group: THREE.Group;
  particles: THREE.Points;
  splashRings: THREE.Points;
  crownDrops: THREE.Points;
  update: (delta: number) => { lightningIntensity: number };
  updateParams: (params: RainParams) => void;
  dispose: () => void;
}

const THEME_COLORS: Record<string, number> = {
  water: 0x88ccff,
  acid: 0x22c55e,
  blood: 0xe11d48,
  snow: 0xf1f5f9,
  gold: 0xfbbf24,
};

export function createRainParticleSystem(scene: THREE.Scene, maxParticles = 8000, maxSplashes = 2000): RainInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'rain-weather-system';

  // --- 1. FALLING RAIN PARTICLES ---
  const rainGeo = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(maxParticles * 3);
  const rainVelocities = new Float32Array(maxParticles * 3);
  const baseVelY = new Float32Array(maxParticles);
  const rainSizes = new Float32Array(maxParticles);
  const rainSeeds = new Float32Array(maxParticles);

  // Default parameters
  let currentIntensity = 3500;
  let speedMultiplier = 1.2;
  let sizeMultiplier = 1.0;
  let windAngleDeg = 180;
  let windStrengthVal = 0.25;
  let rainOpacityVal = 0.55;
  let currentTheme: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom' = 'water';
  let customColorHex = '#88ccff';
  let hasSplashesEnabled = true;
  let splashSizeScale = 1.0;
  let splashIntensityFactor = 1.0;
  let hasCrownDropsEnabled = true;
  let hasLightningEnabled = false;
  let lightningFreqFactor = 1.0;

  // Grid texture boundaries for ground splashes
  let gridWidthUnits = 40.0;
  let gridHeightUnits = 40.0;
  let gridShape: 'square' | 'circle' = 'square';

  const isInsideGrid = (x: number, z: number): boolean => {
    if (gridShape === 'circle') {
      const r = Math.max(gridWidthUnits, gridHeightUnits) / 2.0;
      return (x * x + z * z) <= (r * r);
    }
    const halfW = gridWidthUnits / 2.0;
    const halfH = gridHeightUnits / 2.0;
    return Math.abs(x) <= halfW && Math.abs(z) <= halfH;
  };

  // Initialize rain drop buffers
  for (let i = 0; i < maxParticles; i++) {
    const i3 = i * 3;
    rainPositions[i3] = (Math.random() - 0.5) * 90;
    rainPositions[i3 + 1] = Math.random() * 38; // height 0 to 38
    rainPositions[i3 + 2] = (Math.random() - 0.5) * 90;

    baseVelY[i] = -(Math.random() * 0.45 + 0.35); // -0.35 to -0.8
    rainSizes[i] = Math.random() * 2.2 + 1.0;
    rainSeeds[i] = Math.random() * 100.0;
  }

  const updateVelocities = () => {
    const isSnow = currentTheme === 'snow';
    const rad = (windAngleDeg * Math.PI) / 180;
    const vx = Math.sin(rad) * windStrengthVal * (isSnow ? 0.6 : 1.0);
    const vz = Math.cos(rad) * windStrengthVal * (isSnow ? 0.6 : 1.0);
    const effSpeed = isSnow ? speedMultiplier * 0.35 : speedMultiplier;

    for (let i = 0; i < maxParticles; i++) {
      const i3 = i * 3;
      rainVelocities[i3] = vx + (Math.random() - 0.5) * (isSnow ? 0.15 : 0.04);
      rainVelocities[i3 + 1] = baseVelY[i] * effSpeed;
      rainVelocities[i3 + 2] = vz + (Math.random() - 0.5) * (isSnow ? 0.15 : 0.04);
    }
  };

  updateVelocities();

  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rainGeo.setAttribute('velocity', new THREE.BufferAttribute(rainVelocities, 3));
  rainGeo.setAttribute('size', new THREE.BufferAttribute(rainSizes, 1));
  rainGeo.setAttribute('seed', new THREE.BufferAttribute(rainSeeds, 1));
  rainGeo.setDrawRange(0, currentIntensity);

  const getActiveColor = () => {
    if (currentTheme === 'custom' && customColorHex) {
      return new THREE.Color(customColorHex);
    }
    return new THREE.Color(THEME_COLORS[currentTheme] || 0x88ccff);
  };

  const rainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: getActiveColor() },
      sizeMultiplier: { value: 1.0 },
      streakTilt: { value: 0.0 },
      opacity: { value: 0.55 },
      time: { value: 0.0 },
      isSnow: { value: 0.0 },
    },
    vertexShader: `
      attribute float size;
      attribute float seed;
      uniform float sizeMultiplier;
      uniform float time;
      uniform float isSnow;
      varying float vDist;
      varying float vSeed;

      void main() {
        vec3 pos = position;
        if (isSnow > 0.5) {
          pos.x += sin(time * 2.0 + seed) * 0.4;
          pos.z += cos(time * 1.8 + seed * 1.3) * 0.4;
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        float pDist = max(0.1, -mvPosition.z);
        vDist = pDist;
        vSeed = seed;

        float baseSize = size * sizeMultiplier * (240.0 / pDist);
        gl_PointSize = clamp(baseSize, 1.0, isSnow > 0.5 ? 48.0 : 72.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float streakTilt;
      uniform float opacity;
      uniform float isSnow;
      varying float vDist;
      varying float vSeed;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);

        if (isSnow > 0.5) {
          // Soft fluffy snowflake
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.05, d) * opacity * 0.85;
          gl_FragColor = vec4(color, alpha);
          return;
        }

        // Tilted elongated raindrop streak
        float s = sin(streakTilt);
        float c = cos(streakTilt);
        mat2 rot = mat2(c, -s, s, c);
        uv = rot * uv;

        uv.x *= 8.5;  // Thin sideways
        uv.y *= 1.15; // Elongated along fall vector

        float d = length(uv);
        if (d > 0.5) discard;

        // Soft tapered tail
        float alpha = smoothstep(0.5, 0.08, d) * opacity;
        // Fade very close to camera to avoid blocking view
        float nearFade = smoothstep(1.5, 4.0, vDist);
        gl_FragColor = vec4(color, alpha * nearFade);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const rainPoints = new THREE.Points(rainGeo, rainMaterial);
  rainPoints.frustumCulled = false;
  rootGroup.add(rainPoints);

  // --- 2. GROUND SPLASH RIPPLES (Expanding Water Rings at Y = 0.02) ---
  const splashGeo = new THREE.BufferGeometry();
  const splashPositions = new Float32Array(maxSplashes * 3);
  const splashProgress = new Float32Array(maxSplashes); // 0.0 (born) to 1.0 (dead)
  const splashLifetimes = new Float32Array(maxSplashes); // in seconds (e.g. 0.35s - 0.65s)
  const splashMaxSizes = new Float32Array(maxSplashes);  // max radius

  for (let i = 0; i < maxSplashes; i++) {
    const i3 = i * 3;
    splashPositions[i3] = 0;
    splashPositions[i3 + 1] = 0.02; // Just above ground plane
    splashPositions[i3 + 2] = 0;

    splashProgress[i] = 1.0; // start inactive until drops hit grid!
    splashLifetimes[i] = Math.random() * 0.3 + 0.3; // 0.3s - 0.6s
    splashMaxSizes[i] = Math.random() * 18.0 + 22.0;
  }

  splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPositions, 3));
  splashGeo.setAttribute('aProgress', new THREE.BufferAttribute(splashProgress, 1));
  splashGeo.setAttribute('aMaxSize', new THREE.BufferAttribute(splashMaxSizes, 1));
  splashGeo.setDrawRange(0, maxSplashes);

  const splashMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: getActiveColor() },
      splashScale: { value: 1.0 },
      opacity: { value: 0.6 },
    },
    vertexShader: `
      attribute float aProgress;
      attribute float aMaxSize;
      uniform float splashScale;
      varying float vProgress;
      varying float vDist;

      void main() {
        vProgress = aProgress;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vDist = max(0.1, -mvPosition.z);

        // Size grows as progress increases from 0.0 to 1.0
        float currentSize = aMaxSize * splashScale * (0.2 + 0.8 * vProgress) * (200.0 / vDist);
        gl_PointSize = clamp(currentSize, 1.0, 96.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying float vProgress;
      varying float vDist;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;

        // Expanding concentric ring wave
        // Outer ring boundary
        float ring = smoothstep(0.48, 0.42, d) * smoothstep(0.32, 0.38, d);
        // Inner secondary ripple
        float innerRing = smoothstep(0.25, 0.20, d) * smoothstep(0.12, 0.17, d) * 0.5;
        float totalRing = ring + innerRing;

        // Fade out as ripple reaches end of life
        float fade = pow(1.0 - vProgress, 1.4);
        float alpha = totalRing * fade * opacity;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const splashPoints = new THREE.Points(splashGeo, splashMaterial);
  splashPoints.frustumCulled = false;
  rootGroup.add(splashPoints);

  // --- 3. MICRO-CROWN BOUNCING DROPLETS (Vertical Splash Burst) ---
  const maxCrown = 600;
  const crownGeo = new THREE.BufferGeometry();
  const crownPositions = new Float32Array(maxCrown * 3);
  const crownVelocities = new Float32Array(maxCrown * 3);
  const crownLife = new Float32Array(maxCrown); // 0.0 to 1.0

  for (let i = 0; i < maxCrown; i++) {
    const i3 = i * 3;
    crownPositions[i3] = 0;
    crownPositions[i3 + 1] = 0;
    crownPositions[i3 + 2] = 0;

    crownVelocities[i3] = 0;
    crownVelocities[i3 + 1] = 0;
    crownVelocities[i3 + 2] = 0;

    crownLife[i] = 1.0; // start inactive until drops hit grid!
  }

  crownGeo.setAttribute('position', new THREE.BufferAttribute(crownPositions, 3));
  crownGeo.setAttribute('aLife', new THREE.BufferAttribute(crownLife, 1));
  crownGeo.setDrawRange(0, maxCrown);

  const crownMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: getActiveColor() },
      opacity: { value: 0.65 },
    },
    vertexShader: `
      attribute float aLife;
      varying float vLife;
      void main() {
        vLife = aLife;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float pDist = max(0.1, -mvPosition.z);
        gl_PointSize = clamp(6.0 * (1.0 - aLife) * (180.0 / pDist), 1.0, 16.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying float vLife;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * (1.0 - vLife) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const crownPoints = new THREE.Points(crownGeo, crownMaterial);
  crownPoints.frustumCulled = false;
  rootGroup.add(crownPoints);

  scene.add(rootGroup);

  // --- 4. LIGHTNING FLASH SIMULATOR ---
  let nextLightningTime = Math.random() * 8.0 + 4.0; // 4 - 12s initial
  let lightningState: 'idle' | 'flash1' | 'pause' | 'flash2' = 'idle';
  let lightningTimer = 0;
  let currentLightningIntensity = 0.0;
  let totalTime = 0;
  let nextSplashIndex = 0;
  let nextCrownIndex = 0;

  return {
    group: rootGroup,
    particles: rainPoints,
    splashRings: splashPoints,
    crownDrops: crownPoints,
    update: (delta = 0.016) => {
      totalTime += delta;
      rainMaterial.uniforms.time.value = totalTime;

      const posArr = rainGeo.attributes.position.array as Float32Array;
      const velArr = rainGeo.attributes.velocity.array as Float32Array;

      const splashPosArr = splashGeo.attributes.position.array as Float32Array;
      const splashProgArr = splashGeo.attributes.aProgress.array as Float32Array;

      const crownPosArr = crownGeo.attributes.position.array as Float32Array;
      const crownLifeArr = crownGeo.attributes.aLife.array as Float32Array;

      // 1. Update falling rain positions
      for (let i = 0; i < currentIntensity; i++) {
        const i3 = i * 3;
        posArr[i3] += velArr[i3];
        posArr[i3 + 1] += velArr[i3 + 1];
        posArr[i3 + 2] += velArr[i3 + 2];

        // Impact with ground plane (Y <= 0)
        if (posArr[i3 + 1] <= 0) {
          const hitX = posArr[i3];
          const hitZ = posArr[i3 + 2];

          // Trigger ground splash ripple ONLY if landing inside the combat grid floor texture!
          if (hasSplashesEnabled && currentTheme !== 'snow' && splashIntensityFactor > 0.0 && isInsideGrid(hitX, hitZ)) {
            const shouldSplash = splashIntensityFactor >= 0.99 || Math.random() <= splashIntensityFactor;
            if (shouldSplash) {
              const sIdx = nextSplashIndex % maxSplashes;
              const s3 = sIdx * 3;
              splashPosArr[s3] = hitX;
              splashPosArr[s3 + 1] = 0.02;
              splashPosArr[s3 + 2] = hitZ;
              splashProgArr[sIdx] = 0.0; // Reset progress to start new ripple
              nextSplashIndex++;

              // Trigger micro crown bounce droplets
              if (hasCrownDropsEnabled) {
                const cIdx = nextCrownIndex % maxCrown;
                const c3 = cIdx * 3;
                crownPosArr[c3] = hitX;
                crownPosArr[c3 + 1] = 0.05;
                crownPosArr[c3 + 2] = hitZ;
                crownVelocities[c3] = (Math.random() - 0.5) * 0.12 + velArr[i3] * 0.2;
                crownVelocities[c3 + 1] = Math.random() * 0.22 + 0.08;
                crownVelocities[c3 + 2] = (Math.random() - 0.5) * 0.12 + velArr[i3 + 2] * 0.2;
                crownLifeArr[cIdx] = 0.0;
                nextCrownIndex++;
              }
            }
          }

          // Respawn drop at top sky
          posArr[i3] = (Math.random() - 0.5) * 90;
          posArr[i3 + 1] = 34 + Math.random() * 6;
          posArr[i3 + 2] = (Math.random() - 0.5) * 90;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;

      // 2. Update Ground Splashes
      if (hasSplashesEnabled && currentTheme !== 'snow' && splashIntensityFactor > 0.0) {
        splashPoints.visible = true;
        for (let s = 0; s < maxSplashes; s++) {
          if (splashProgArr[s] < 1.0) {
            const lifetime = splashLifetimes[s];
            splashProgArr[s] += delta / lifetime;
            if (splashProgArr[s] > 1.0) splashProgArr[s] = 1.0;
          }
        }
        splashGeo.attributes.position.needsUpdate = true;
        splashGeo.attributes.aProgress.needsUpdate = true;
        splashGeo.setDrawRange(0, maxSplashes);
      } else {
        splashPoints.visible = false;
      }

      // 3. Update Crown Bounce Droplets
      if (hasCrownDropsEnabled && hasSplashesEnabled && currentTheme !== 'snow' && splashIntensityFactor > 0.0) {
        crownPoints.visible = true;
        for (let c = 0; c < maxCrown; c++) {
          if (crownLifeArr[c] < 1.0) {
            const c3 = c * 3;
            crownPosArr[c3] += crownVelocities[c3];
            crownPosArr[c3 + 1] += crownVelocities[c3 + 1];
            crownPosArr[c3 + 2] += crownVelocities[c3 + 2];
            crownVelocities[c3 + 1] -= delta * 0.9; // gravity
            crownLifeArr[c] += delta * 2.8; // lifetime ~0.35s
            if (crownLifeArr[c] > 1.0) crownLifeArr[c] = 1.0;
          }
        }
        crownGeo.attributes.position.needsUpdate = true;
        crownGeo.attributes.aLife.needsUpdate = true;
      } else {
        crownPoints.visible = false;
      }

      // 4. Update Lightning Flash Machine
      currentLightningIntensity = 0.0;
      if (hasLightningEnabled) {
        lightningTimer += delta * lightningFreqFactor;
        if (lightningState === 'idle') {
          if (lightningTimer >= nextLightningTime) {
            lightningState = 'flash1';
            lightningTimer = 0;
          }
        } else if (lightningState === 'flash1') {
          currentLightningIntensity = Math.min(1.0, (0.09 - lightningTimer) / 0.09);
          if (lightningTimer >= 0.09) {
            lightningState = 'pause';
            lightningTimer = 0;
          }
        } else if (lightningState === 'pause') {
          currentLightningIntensity = 0.0;
          if (lightningTimer >= 0.05) {
            lightningState = 'flash2';
            lightningTimer = 0;
          }
        } else if (lightningState === 'flash2') {
          currentLightningIntensity = Math.min(1.0, (0.16 - lightningTimer) / 0.16) * 0.85;
          if (lightningTimer >= 0.16) {
            lightningState = 'idle';
            lightningTimer = 0;
            nextLightningTime = Math.random() * 9.0 + 3.0; // Next flash in 3-12s
          }
        }
      }

      return {
        lightningIntensity: currentLightningIntensity,
      };
    },
    updateParams: (params: RainParams) => {
      if (params.intensity !== undefined) {
        currentIntensity = Math.min(params.intensity, maxParticles);
        rainGeo.setDrawRange(0, currentIntensity);
      }
      if (params.speed !== undefined) {
        speedMultiplier = params.speed;
      }
      if (params.dropSize !== undefined) {
        sizeMultiplier = params.dropSize;
        rainMaterial.uniforms.sizeMultiplier.value = sizeMultiplier;
      }
      if (params.windAngle !== undefined) {
        windAngleDeg = params.windAngle;
      }
      if (params.windStrength !== undefined) {
        windStrengthVal = params.windStrength;
      }
      if (params.opacity !== undefined) {
        rainOpacityVal = params.opacity;
        rainMaterial.uniforms.opacity.value = rainOpacityVal;
        splashMaterial.uniforms.opacity.value = rainOpacityVal * 0.85;
        crownMaterial.uniforms.opacity.value = rainOpacityVal;
      }
      if (params.theme !== undefined) {
        currentTheme = params.theme;
        const color = getActiveColor();
        rainMaterial.uniforms.color.value = color;
        splashMaterial.uniforms.color.value = color;
        crownMaterial.uniforms.color.value = color;
        rainMaterial.uniforms.isSnow.value = currentTheme === 'snow' ? 1.0 : 0.0;
      }
      if (params.customColor !== undefined) {
        customColorHex = params.customColor;
        if (currentTheme === 'custom') {
          const col = new THREE.Color(customColorHex);
          rainMaterial.uniforms.color.value = col;
          splashMaterial.uniforms.color.value = col;
          crownMaterial.uniforms.color.value = col;
        }
      }
      if (params.hasSplashes !== undefined) {
        hasSplashesEnabled = params.hasSplashes;
      }
      if (params.splashSize !== undefined) {
        splashSizeScale = params.splashSize;
        splashMaterial.uniforms.splashScale.value = splashSizeScale;
      }
      if (params.splashIntensity !== undefined) {
        splashIntensityFactor = params.splashIntensity;
      }
      if (params.hasCrownDrops !== undefined) {
        hasCrownDropsEnabled = params.hasCrownDrops;
      }
      if (params.hasLightning !== undefined) {
        hasLightningEnabled = params.hasLightning;
      }
      if (params.lightningFrequency !== undefined) {
        lightningFreqFactor = params.lightningFrequency;
      }
      if (params.gridBounds !== undefined) {
        if (params.gridBounds.widthUnits !== undefined) gridWidthUnits = params.gridBounds.widthUnits;
        if (params.gridBounds.heightUnits !== undefined) gridHeightUnits = params.gridBounds.heightUnits;
        if (params.gridBounds.shape !== undefined) gridShape = params.gridBounds.shape;
      }

      // Update actual particle physics velocities & wind heading
      updateVelocities();

      // Update visual tilt in streak shader
      const verticalSpeed = 0.5 * speedMultiplier;
      const horizontalSpeed = windStrengthVal;
      const tiltAngle = Math.atan2(horizontalSpeed, verticalSpeed);
      const rad = (windAngleDeg * Math.PI) / 180;
      const windProjectX = Math.sin(rad);
      rainMaterial.uniforms.streakTilt.value = tiltAngle * windProjectX;
    },
    dispose: () => {
      scene.remove(rootGroup);
      rainGeo.dispose();
      rainMaterial.dispose();
      splashGeo.dispose();
      splashMaterial.dispose();
      crownGeo.dispose();
      crownMaterial.dispose();
    },
  };
}

// --- MODERN GROUND FOG SYSTEM (Rolling Fog) ---
export interface GroundFogInstance {
  particles: THREE.Points;
  update: (delta: number) => void;
  updateParams: (params: {
    intensity?: number; // 0 to 300 puffs
    height?: number;    // vertical span factor (0.5 to 5.0)
    speed?: number;     // drift speed multiplier (0.0 to 3.0)
  }) => void;
  dispose: () => void;
}

export function createGroundFogSystem(scene: THREE.Scene, maxParticles = 300): GroundFogInstance {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const sizes = new Float32Array(maxParticles);
  const phases = new Float32Array(maxParticles);
  const baseHeights = new Float32Array(maxParticles); // Store baseline Y heights

  let currentIntensity = 150;
  let heightMultiplier = 1.0;
  let speedMultiplier = 1.0;

  for (let i = 0; i < maxParticles; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 80;
    
    // Base height
    baseHeights[i] = Math.random() * 1.5; 
    positions[i3 + 1] = baseHeights[i] * heightMultiplier;

    positions[i3 + 2] = (Math.random() - 0.5) * 80;

    // Partículas muito maiores para criar um cobertor de névoa denso
    sizes[i] = Math.random() * 60.0 + 40.0;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geometry.setDrawRange(0, currentIntensity);

  const fogMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0x94a3b8) },
      time: { value: 0.0 }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      uniform float time;
      varying float vAlpha;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // Pulsação suave
        float pulse = sin(time * 0.3 + phase) * 0.2 + 1.0; 
        // Escala significativamente maior para partículas volumosas
        gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
        
        gl_Position = projectionMatrix * mvPosition;
        // Fade out próximo à câmera e muito longe
        vAlpha = smoothstep(1.0, 15.0, -mvPosition.z) * smoothstep(90.0, 50.0, -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        
        // Decaimento suave curvo para criar um aspecto de nuvem densa e macia no centro
        float falloff = pow(1.0 - 2.0 * d, 1.8);
        float alpha = falloff * 0.25; 
        gl_FragColor = vec4(color, alpha * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  const particles = new THREE.Points(geometry, fogMaterial);
  particles.position.y = 0.1;
  scene.add(particles);

  let timeAcc = 0;

  return {
    particles,
    update: (delta = 0.016) => {
      timeAcc += delta;
      fogMaterial.uniforms.time.value = timeAcc;

      const posArr = geometry.attributes.position.array as Float32Array;
      const driftSpeed = delta * 0.2 * speedMultiplier;

      // Only drift active particles
      for (let i = 0; i < currentIntensity; i++) {
        const i3 = i * 3;
        posArr[i3] += driftSpeed;         // Drift X
        posArr[i3 + 2] += driftSpeed * 0.5; // Drift Z

        // Wrap around
        if (posArr[i3] > 40) posArr[i3] = -40;
        if (posArr[i3 + 2] > 40) posArr[i3 + 2] = -40;
      }
      geometry.attributes.position.needsUpdate = true;
    },
    updateParams: (params) => {
      if (params.intensity !== undefined) {
        currentIntensity = Math.min(Math.max(params.intensity, 0), maxParticles);
        geometry.setDrawRange(0, currentIntensity);
      }
      if (params.height !== undefined) {
        heightMultiplier = params.height;
        const posArr = geometry.attributes.position.array as Float32Array;
        // Re-scale heights
        for (let i = 0; i < maxParticles; i++) {
          posArr[i * 3 + 1] = baseHeights[i] * heightMultiplier;
        }
        geometry.attributes.position.needsUpdate = true;
      }
      if (params.speed !== undefined) {
        speedMultiplier = params.speed;
      }
    },
    dispose: () => {
      scene.remove(particles);
      geometry.dispose();
      fogMaterial.dispose();
    },
  };
}
