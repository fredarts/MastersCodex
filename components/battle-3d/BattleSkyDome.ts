import * as THREE from 'three';

const vertexShader = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  uniform float uOffset;
  uniform float uExponent;
  uniform float uStarIntensity;
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    float h = normalize(vWorldPosition + vec3(0.0, uOffset, 0.0)).y;
    float factor = max(pow(max(h, 0.0), uExponent), 0.0);
    vec3 skyColor = mix(uBottomColor, uTopColor, factor);
    
    // Starfield rendering for night mode
    if (uStarIntensity > 0.0 && h > 0.02) {
      vec2 starUv = vWorldPosition.xz * 0.05 + vWorldPosition.xy * 0.02;
      float star = step(0.991, random(floor(starUv * 90.0)));
      float twinkle = sin(uTime * 3.0 + random(starUv) * 6.28) * 0.5 + 0.5;
      vec3 starColor = vec3(0.95, 0.98, 1.0) * (star * (0.6 + 0.4 * twinkle) * uStarIntensity);
      skyColor += starColor;
    }

    // Celestial Horizon Glow
    float horizonGlow = smoothstep(-0.1, 0.2, h) * (1.0 - smoothstep(0.2, 0.6, h));
    skyColor += uBottomColor * horizonGlow * 0.25;

    gl_FragColor = vec4(skyColor, 1.0);
  }
`;

export interface SkyDomeInstance {
  mesh: THREE.Mesh;
  update: (timeOfDayHour?: number, timeOfDayPreset?: string, hasFog?: boolean, hasRain?: boolean) => void;
  dispose: () => void;
}

export function createBattleSkyDome(scene: THREE.Scene): SkyDomeInstance {
  const geometry = new THREE.SphereGeometry(300, 32, 24);

  const uniforms = {
    uTopColor: { value: new THREE.Color(0x0369a1) },
    uBottomColor: { value: new THREE.Color(0xbae6fd) },
    uOffset: { value: 30.0 },
    uExponent: { value: 0.5 },
    uStarIntensity: { value: 0.0 },
    uTime: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false, // EXTREMAMENTE IMPORTANTE: Impede o Three.js FogExp2 de apagar a Skysphere!
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'battleSkyDome';
  mesh.renderOrder = -1000; // Garante que a Skysphere renderize no fundo absoluto da cena
  scene.add(mesh);

  const update = (
    timeOfDayHour = 12,
    timeOfDayPreset = 'day',
    hasFog = false,
    hasRain = false
  ) => {
    uniforms.uTime.value = performance.now() / 1000;

    const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
    const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);

    if (hasFog || timeOfDayPreset === 'fog') {
      uniforms.uTopColor.value.setHex(0x1e293b); // slate-800
      uniforms.uBottomColor.value.setHex(0x64748b); // slate-500
      uniforms.uStarIntensity.value = 0.0;
    } else if (hasRain || timeOfDayPreset === 'storm') {
      uniforms.uTopColor.value.setHex(0x0b1329); // storm dark navy
      uniforms.uBottomColor.value.setHex(0x334155); // slate-700
      uniforms.uStarIntensity.value = 0.0;
    } else if (isNight) {
      uniforms.uTopColor.value.setHex(0x020617); // midnight slate-950
      uniforms.uBottomColor.value.setHex(0x1e1b4b); // indigo twilight
      uniforms.uStarIntensity.value = 1.0;
    } else if (isSunset) {
      uniforms.uTopColor.value.setHex(0x4c1d95); // deep purple dusk
      uniforms.uBottomColor.value.setHex(0xf97316); // fiery orange horizon
      uniforms.uStarIntensity.value = 0.4;
    } else {
      // Day time
      uniforms.uTopColor.value.setHex(0x0284c7); // sky-600
      uniforms.uBottomColor.value.setHex(0xbae6fd); // sky-200 horizon
      uniforms.uStarIntensity.value = 0.0;
    }
  };

  const dispose = () => {
    scene.remove(mesh);
    geometry.dispose();
    material.dispose();
  };

  return { mesh, update, dispose };
}
