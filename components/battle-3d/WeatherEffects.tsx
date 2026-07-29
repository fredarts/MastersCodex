import * as THREE from 'three';

// --- MODERN RAIN SYSTEM ---
export interface RainInstance {
  particles: THREE.Points;
  update: (delta: number) => void;
  updateParams: (params: {
    intensity?: number;    // 0 to 5000 (drawRange count)
    speed?: number;        // falling speed multiplier (0.1 to 3.0)
    dropSize?: number;     // visual size scale (0.5 to 5.0)
    windAngle?: number;    // direction angle in degrees (0 to 360)
    windStrength?: number; // speed on horizontal axes (0.0 to 1.5)
  }) => void;
  dispose: () => void;
}

export function createRainParticleSystem(scene: THREE.Scene, maxParticles = 5000): RainInstance {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const velocities = new Float32Array(maxParticles * 3);
  const baseVelY = new Float32Array(maxParticles); // Store individual gravity base
  const sizes = new Float32Array(maxParticles);

  // Default values
  let currentIntensity = 2000;
  let speedMultiplier = 1.0;
  let sizeMultiplier = 1.0;
  let windAngleDeg = 180; // Wind heading
  let windStrengthVal = 0.2;

  // Initialize all particles in the buffers
  for (let i = 0; i < maxParticles; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 80;
    positions[i3 + 1] = Math.random() * 35; // height 0 to 35
    positions[i3 + 2] = (Math.random() - 0.5) * 80;

    // Base Y speed (negative since falling down)
    baseVelY[i] = - (Math.random() * 0.4 + 0.3); // -0.3 to -0.7

    // Randomize initial drop size
    sizes[i] = Math.random() * 2.0 + 1.0;
  }

  // Calculate current horizontal velocities
  const updateVelocities = () => {
    const rad = (windAngleDeg * Math.PI) / 180;
    const vx = Math.sin(rad) * windStrengthVal;
    const vz = Math.cos(rad) * windStrengthVal;

    for (let i = 0; i < maxParticles; i++) {
      const i3 = i * 3;
      velocities[i3] = vx + (Math.random() - 0.5) * 0.05; // add tiny variance
      velocities[i3 + 1] = baseVelY[i] * speedMultiplier;
      velocities[i3 + 2] = vz + (Math.random() - 0.5) * 0.05;
    }
  };

  updateVelocities();

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setDrawRange(0, currentIntensity);

  // Shader to render rain drops as tilted, elongated streaks
  const rainMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0x88ccff) },
      sizeMultiplier: { value: 1.0 },
      streakTilt: { value: 0.0 } // visual tilt in shader space
    },
    vertexShader: `
      attribute float size;
      uniform float sizeMultiplier;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * sizeMultiplier * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float streakTilt;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        
        // Tilt the streak according to the wind tilt angle
        float s = sin(streakTilt);
        float c = cos(streakTilt);
        mat2 rot = mat2(c, -s, s, c);
        uv = rot * uv;
        
        // Elongate along Y axis, thin along X axis
        uv.x *= 8.0; 
        uv.y *= 1.2;

        float d = length(uv);
        if (d > 0.5) discard;
        
        float alpha = smoothstep(0.5, 0.1, d) * 0.45;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, rainMaterial);
  scene.add(particles);

  return {
    particles,
    update: (delta?: number) => {
      const posArr = geometry.attributes.position.array as Float32Array;
      const velArr = geometry.attributes.velocity.array as Float32Array;

      // Update positions for all active particles
      for (let i = 0; i < currentIntensity; i++) {
        const i3 = i * 3;
        
        posArr[i3] += velArr[i3];
        posArr[i3 + 1] += velArr[i3 + 1];
        posArr[i3 + 2] += velArr[i3 + 2];

        // Reset if hitting ground
        if (posArr[i3 + 1] < 0) {
          posArr[i3] = (Math.random() - 0.5) * 80;
          posArr[i3 + 1] = 30 + Math.random() * 5;
          posArr[i3 + 2] = (Math.random() - 0.5) * 80;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    },
    updateParams: (params) => {
      if (params.intensity !== undefined) {
        currentIntensity = Math.min(Math.max(params.intensity, 0), maxParticles);
        geometry.setDrawRange(0, currentIntensity);
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

      // Update actual particle physics velocities
      updateVelocities();

      // Update visual tilt in shader (approximate angle based on horizontal wind strength vs vertical speed)
      // High wind strength tilts more. If wind is 0, tilt is 0.
      const verticalSpeed = 0.5 * speedMultiplier;
      const horizontalSpeed = windStrengthVal;
      let tiltAngle = Math.atan2(horizontalSpeed, verticalSpeed);
      // Give directionality to the tilt
      const rad = (windAngleDeg * Math.PI) / 180;
      // Project wind tilt to 2D screen camera tilt (simple approximation: tilt left/right)
      const windProjectX = Math.sin(rad);
      rainMaterial.uniforms.streakTilt.value = tiltAngle * windProjectX;
    },
    dispose: () => {
      scene.remove(particles);
      geometry.dispose();
      rainMaterial.dispose();
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
