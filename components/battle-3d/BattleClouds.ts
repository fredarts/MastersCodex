import * as THREE from 'three';

export interface CloudSystemInstance {
  group: THREE.Group;
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  update: (
    delta: number,
    timeOfDayPreset?: string,
    cloudDensity?: number,
    timeOfDayHour?: number,
    windAngle?: number,
    windStrength?: number
  ) => void;
  dispose: () => void;
}

const cloudVertexShader = `
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

const cloudFragmentShader = `
  uniform float uTime;
  uniform float uDensity; // 0.0 (clear sky) to 1.0 (100% full overcast cover)
  uniform vec3 uSunPosition;
  uniform vec3 uCloudColor;
  uniform vec3 uShadowColor;
  uniform vec3 uSunHighlightColor;
  uniform vec2 uWindDirection;
  uniform float uWindSpeed;

  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vNormal;

  // 2D Simplex Noise for WebGL
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,  // (3.0-sqrt(3.0))/6.0
      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
     -0.577350269189626,  // -1.0 + 2.0 * C.x
      0.024390243902439   // 1.0 / 41.0
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

  // Multi-octave Fractal Brownian Motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
      value += amplitude * (snoise(p * frequency) * 0.5 + 0.5);
      p += vec2(1.7, 9.2);
      frequency *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    if (uDensity <= 0.001) {
      discard;
    }

    vec3 dir = normalize(vWorldPosition + vec3(0.0001, 0.0001, 0.0001));
    if (dir.y <= 0.005) {
      discard;
    }

    // High-altitude planar sky coordinates for natural perspective distortion near horizons
    vec2 skyUv = vec2(dir.x / (dir.y + 0.22), dir.z / (dir.y + 0.22)) * 1.35;
    vec2 drift = uWindDirection * (uTime * uWindSpeed * 0.035);
    vec2 coord = skyUv + drift;

    // Dual-Layer Fractal Structure for rich cloud depth
    float n1 = fbm(coord * 0.85);
    vec2 coord2 = skyUv * 1.9 + drift * 1.35 + vec2(n1 * 0.25, n1 * 0.18);
    float n2 = fbm(coord2);
    float cloudNoise = mix(n1, n2, 0.35);

    // Dynamic Thresholding calibrated from 0 to 100:
    // 0 = 0% clear sky (no clouds)
    // 30 = beautiful fluffy cumulus puffs
    // 60 = partly cloudy with deep billowing shapes
    // 100 = 100% thick full-sky overcast canopy
    float thresholdLow = mix(0.74, 0.02, uDensity);
    float thresholdHigh = mix(0.96, 0.38, uDensity);

    float alpha = smoothstep(thresholdLow, thresholdHigh, cloudNoise);
    if (alpha <= 0.005) {
      discard;
    }

    // Internal Self-Shadowing (gives volumetric 3D weight to cloud masses)
    float shadow = smoothstep(thresholdLow - 0.08, thresholdHigh + 0.22, cloudNoise);
    vec3 baseColor = mix(uShadowColor, uCloudColor, shadow);

    // Sun Silver-Lining & Forward Mie Scattering Rim
    vec3 normSun = normalize(uSunPosition + vec3(0.0001, 0.0001, 0.0001));
    float sunDot = max(0.0, dot(dir, normSun));
    float silverLining = pow(sunDot, 5.0) * (1.0 - shadow * 0.65) * 1.3;
    vec3 finalColor = baseColor + uSunHighlightColor * silverLining;

    // Horizon blend fade so clouds don't clip harshly against ground/grid edge
    float horizonFade = smoothstep(0.02, 0.32, dir.y);

    // Alpha intensity scaling
    float maxAlpha = mix(0.85, 0.98, uDensity);
    float finalAlpha = clamp(alpha * horizonFade * maxAlpha * 1.25, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

export function createCloudSystem(scene: THREE.Scene): CloudSystemInstance {
  const group = new THREE.Group();
  group.name = 'battleCloudsGroup';

  // Inverted Dome mesh positioned right beneath the SkyDome (radius 740 vs Sky 800)
  const cloudGeometry = new THREE.SphereGeometry(740, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.48);

  const uniforms = {
    uTime: { value: 0.0 },
    uDensity: { value: 0.3 }, // 0.0 to 1.0
    uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
    uCloudColor: { value: new THREE.Color(0xffffff) },
    uShadowColor: { value: new THREE.Color(0x94a3b8) },
    uSunHighlightColor: { value: new THREE.Color(0xfffbeb) },
    uWindDirection: { value: new THREE.Vector2(0.8, 0.6).normalize() },
    uWindSpeed: { value: 1.0 },
  };

  const cloudMaterial = new THREE.ShaderMaterial({
    vertexShader: cloudVertexShader,
    fragmentShader: cloudFragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    fog: false,
  });

  const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudMesh.name = 'cloudAtmosphereDome';
  cloudMesh.renderOrder = -500; // In front of sky (-1000), behind scene objects (0)
  cloudMesh.frustumCulled = false;
  group.add(cloudMesh);

  scene.add(group);

  // Target colors for smooth lerping
  const targetCloudColor = new THREE.Color(0xffffff);
  const targetShadowColor = new THREE.Color(0x94a3b8);
  const targetSunHighlight = new THREE.Color(0xfffbeb);
  const calculatedSunPos = new THREE.Vector3();

  let totalElapsedTime = 0;

  const update = (
    delta: number,
    timeOfDayPreset = 'day',
    cloudDensity = 30,
    timeOfDayHour = 12,
    windAngle = 45,
    windStrength = 1.0
  ) => {
    if (timeOfDayPreset === 'indoors') {
      group.visible = false;
      return;
    }
    group.visible = true;

    const dt = Math.min(delta, 0.1);
    totalElapsedTime += dt;
    uniforms.uTime.value = totalElapsedTime;

    // Density mapping (0 to 100 -> 0.0 to 1.0)
    const normalizedDensity = Math.max(0, Math.min(100, cloudDensity)) / 100.0;
    uniforms.uDensity.value = THREE.MathUtils.lerp(uniforms.uDensity.value, normalizedDensity, 0.15);

    // Wind direction & speed
    const windRad = (windAngle * Math.PI) / 180;
    uniforms.uWindDirection.value.set(Math.cos(windRad), Math.sin(windRad));
    uniforms.uWindSpeed.value = windStrength;

    // Sun position calculation from hour (same formula as BattleSkyDome)
    const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
    const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);

    const sunAngle = ((timeOfDayHour - 6) / 24) * Math.PI * 2;
    calculatedSunPos.set(
      Math.cos(sunAngle) * 800,
      Math.sin(sunAngle) * 800,
      60
    );
    uniforms.uSunPosition.value.copy(calculatedSunPos);

    // Color palette based on environment presets
    if (timeOfDayPreset === 'storm') {
      targetCloudColor.setHex(0x334155);       // Storm slate
      targetShadowColor.setHex(0x0f172a);      // Dark underbelly
      targetSunHighlight.setHex(0x475569);     // Muted highlight
    } else if (timeOfDayPreset === 'fog') {
      targetCloudColor.setHex(0xcfd8dc);       // Misty gray-white
      targetShadowColor.setHex(0x90a4ae);       // Dense fog tone
      targetSunHighlight.setHex(0xe2e8f0);     // Diffused white
    } else if (isNight) {
      targetCloudColor.setHex(0x334155);       // Night slate
      targetShadowColor.setHex(0x090d16);      // Deep midnight black/navy
      targetSunHighlight.setHex(0x60a5fa);     // Cool moonlight edge
    } else if (isSunset) {
      targetCloudColor.setHex(0xfdba74);       // Golden peach
      targetShadowColor.setHex(0x64748b);      // Twilight dusk slate
      targetSunHighlight.setHex(0xf97316);     // Radiant sunset gold
    } else {
      // Day
      targetCloudColor.setHex(0xffffff);       // Crisp white
      targetShadowColor.setHex(0x94a3b8);      // Soft cloud shadow
      targetSunHighlight.setHex(0xfffbeb);     // Warm daylight rim
    }

    // Smooth color transitions
    uniforms.uCloudColor.value.lerp(targetCloudColor, 0.1);
    uniforms.uShadowColor.value.lerp(targetShadowColor, 0.1);
    uniforms.uSunHighlightColor.value.lerp(targetSunHighlight, 0.1);
  };

  const dispose = () => {
    scene.remove(group);
    cloudGeometry.dispose();
    cloudMaterial.dispose();
  };

  return { group, mesh: cloudMesh, material: cloudMaterial, update, dispose };
}
