import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

export interface SkyDomeInstance {
  skyObj: THREE.Object3D;
  sunLight: THREE.PointLight;
  moonMesh: THREE.Object3D;
  sunPosition: THREE.Vector3;
  moonPosition: THREE.Vector3;
  update: (
    timeOfDayHour?: number,
    timeOfDayPreset?: string,
    hasFog?: boolean,
    hasRain?: boolean,
    moonSize?: number,
    moonLuminosity?: number,
    moonOffsetAngle?: number,
    moonAltitude?: number,
    sunSize?: number,
    skyTurbidity?: number,
    skyRayleigh?: number,
    mieCoefficient?: number,
    mieDirectionalG?: number
  ) => void;
  dispose: () => void;
}

// Procedural Flare Texture Generators (2D Canvas)
function createFlareTexture(size = 128, type: 'sun' | 'circle' | 'ring' = 'sun'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;

  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    if (type === 'sun') {
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(254, 240, 138, 0.9)'); // yellow-200
      grad.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)'); // orange-500
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    } else if (type === 'circle') {
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.6, 'rgba(186, 230, 253, 0.3)'); // sky-200
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, center, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'ring') {
      const grad = ctx.createRadialGradient(center, center, center * 0.3, center, center, center);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.6, 'rgba(253, 224, 71, 0.5)'); // yellow-300
      grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, center, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Procedural Moon Texture Generator (Slate cratered moon)
function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base surface color
    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.fillRect(0, 0, 256, 256);

    // Draw crater details
    const craters = [
      { x: 80, y: 70, r: 28 },
      { x: 145, y: 125, r: 42 },
      { x: 190, y: 160, r: 22 },
      { x: 65, y: 175, r: 32 },
      { x: 120, y: 200, r: 18 },
      { x: 170, y: 75, r: 30 },
      { x: 100, y: 110, r: 16 },
    ];

    craters.forEach((c) => {
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      grad.addColorStop(0, 'rgba(100, 116, 139, 0.7)'); // slate-500
      grad.addColorStop(0.7, 'rgba(148, 163, 184, 0.4)'); // slate-400
      grad.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createBattleSkyDome(scene: THREE.Scene): SkyDomeInstance {
  // 1. Official Three.js Atmospheric Sky
  const sky = new Sky();
  sky.scale.setScalar(450000);
  sky.name = 'battleSky Dome';
  sky.renderOrder = -1000;
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 10;
  skyUniforms['rayleigh'].value = 3;
  skyUniforms['mieCoefficient'].value = 0.005;
  skyUniforms['mieDirectionalG'].value = 0.7;

  // Injetar variável de escala do sol no Shader
  skyUniforms['sunDiskScale'] = { value: 1.0 };
  
  // Hack no fragmentShader do Sky.js para expor tamanho do disco solar (AngularDiameterCos)
  // Substitui a constante original por um cálculo que aceita o sunDiskScale.
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    'void main() {',
    `uniform float sunDiskScale;
    void main() {
      float sunAngularDiameterCos = 1.0 - (1.0 - 0.9999566769) * (sunDiskScale * sunDiskScale);`
  );
  sky.material.needsUpdate = true;


  // 2. Sun Position & Light with Lens Flare
  // Note: Three.js Sky shader already draws the sun disc in atmospheric sky!
  // We keep sunMesh hidden to avoid rendering a redundant second sun sphere.
  const sunPosition = new THREE.Vector3();
  const sunGeometry = new THREE.SphereGeometry(12, 16, 16);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false });
  const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
  sunMesh.name = 'sunMesh';
  sunMesh.visible = false; // HIDE visual sphere so Sky shader's sun disc is the only sun!
  scene.add(sunMesh);

  // Sun Light (for Lensflare anchoring)
  const sunLight = new THREE.PointLight(0xfffbeb, 1.5, 0, 0);
  sunLight.castShadow = false;
  sunMesh.add(sunLight);

  // Setup Lens Flare textures
  const textureFlareSun = createFlareTexture(256, 'sun');
  const textureFlareCircle = createFlareTexture(128, 'circle');
  const textureFlareRing = createFlareTexture(128, 'ring');

  const lensflare = new Lensflare();
  lensflare.addElement(new LensflareElement(textureFlareSun, 400, 0, new THREE.Color(0xffffff)));
  lensflare.addElement(new LensflareElement(textureFlareRing, 120, 0.2, new THREE.Color(0xfde047)));
  lensflare.addElement(new LensflareElement(textureFlareCircle, 80, 0.5, new THREE.Color(0x38bdf8)));
  lensflare.addElement(new LensflareElement(textureFlareCircle, 140, 0.8, new THREE.Color(0xf97316)));
  sunLight.add(lensflare);

  // 3. Moon Sprite (Billboard that faces camera)
  const moonPosition = new THREE.Vector3();
  const textureLoader = new THREE.TextureLoader();
  const moonTexture = textureLoader.load('/textures/moon.png');
  moonTexture.colorSpace = THREE.SRGBColorSpace;
  const moonMaterial = new THREE.SpriteMaterial({
    map: moonTexture,
    color: new THREE.Color(0xffffff),
    fog: false,
    transparent: true,
    depthWrite: false, // Allow blending with clouds without clipping box
  });
  const moonMesh = new THREE.Sprite(moonMaterial);
  moonMesh.name = 'moonMesh';
  scene.add(moonMesh);

  // 4. Starfield for Night
  const starCount = 600;
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 850; // inside sky dome radius

    // Only position in upper hemisphere (above horizon)
    const y = Math.abs(r * Math.cos(phi)) + 10;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const z = r * Math.sin(phi) * Math.sin(theta);

    starPositions[i * 3] = x;
    starPositions[i * 3 + 1] = y;
    starPositions[i * 3 + 2] = z;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xf8fafc,
    size: 1.8,
    transparent: true,
    opacity: 0.0, // toggled in update
    fog: false,
  });
  const starField = new THREE.Points(starGeometry, starMaterial);
  starField.name = 'starField';
  scene.add(starField);

  // Orbit radius for Sun & Moon
  const orbitRadius = 800;

  const update = (
    timeOfDayHour = 12,
    timeOfDayPreset = 'day',
    hasFog = false,
    hasRain = false,
    moonSize = 1.5,
    moonLuminosity = 1.0,
    moonOffsetAngle = 180,
    moonAltitude = -1,
    sunSize = 1.0,
    skyTurbidity?: number,
    skyRayleigh?: number,
    mieCoefficient?: number,
    mieDirectionalG?: number
  ) => {
    const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
    const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);

    // Calculate Sun orbital position based on hour (Peak at 12pm, Sunset at 18h)
    const sunAngle = ((timeOfDayHour - 6) / 24) * Math.PI * 2;
    sunPosition.x = orbitRadius * Math.cos(sunAngle);
    sunPosition.y = orbitRadius * Math.sin(sunAngle);
    sunPosition.z = 60; // tilted orbit

    sunMesh.position.copy(sunPosition);
    skyUniforms['sunPosition'].value.copy(sunPosition);

    // Calculate Moon orbital position & cinematic scale
    if (moonAltitude !== undefined && moonAltitude >= 0) {
      // Orthogonal cylindrical positioning: decoupled horizontal angle and vertical height
      const azRad = (moonOffsetAngle * Math.PI) / 180;
      moonPosition.x = orbitRadius * Math.cos(azRad);
      moonPosition.z = orbitRadius * Math.sin(azRad);
      // Map altitude (0 to 90 deg) to Y height (0 to orbitRadius)
      moonPosition.y = (moonAltitude / 90) * orbitRadius;
    } else {
      // Auto position: Moon offset angle relative to sun
      const offsetRad = ((moonOffsetAngle ?? 180) * Math.PI) / 180;
      const moonAngle = sunAngle + offsetRad;
      moonPosition.x = orbitRadius * Math.cos(moonAngle);
      moonPosition.y = orbitRadius * Math.sin(moonAngle);
      moonPosition.z = -60;
    }

    moonMesh.position.copy(moonPosition);
    
    // Scale Sprite
    const finalSize = 60 * (moonSize ?? 1.5);
    moonMesh.scale.set(finalSize, finalSize, 1);
    
    // Apply Luminosity to the material
    (moonMesh.material as THREE.SpriteMaterial).color.setScalar(moonLuminosity ?? 1.0);

    // Apply scale to Lensflare and actual Sun Disc in the Sky Shader
    lensflare.scale.setScalar(sunSize ?? 1.0);
    if (skyUniforms['sunDiskScale']) {
      skyUniforms['sunDiskScale'].value = sunSize ?? 1.0;
    }

    // Define target parameters based on climate presets
    let targetTurbidity = 6;
    let targetRayleigh = 2;
    let targetMieCoefficient = 0.005;
    let targetMieDirectionalG = 0.7;

    if (timeOfDayPreset === 'fog') {
      targetTurbidity = 20;
      targetRayleigh = 0.5;
      sunMaterial.color.setHex(0x94a3b8);
      lensflare.visible = false;
      starMaterial.opacity = 0.0;
    } else if (timeOfDayPreset === 'storm') {
      targetTurbidity = 30;
      targetRayleigh = 0.1;
      sunMaterial.color.setHex(0x475569);
      lensflare.visible = false;
      starMaterial.opacity = 0.0;
    } else if (isNight) {
      targetTurbidity = 5;
      targetRayleigh = 0.1;
      sunMaterial.color.setHex(0x1e293b);
      lensflare.visible = false;
      starMaterial.opacity = 0.95; // Stars visible at night
    } else if (isSunset) {
      targetTurbidity = 8;
      targetRayleigh = 4;
      sunMaterial.color.setHex(0xf97316); // Fiery orange
      lensflare.visible = sunPosition.y > 0;
      starMaterial.opacity = 0.3;
    } else {
      // Normal Day
      targetTurbidity = 6;
      targetRayleigh = 2;
      sunMaterial.color.setHex(0xfffbeb); // Bright white-gold
      lensflare.visible = sunPosition.y > 0;
      starMaterial.opacity = 0.0;
    }

    // Apply uniforms with override fallback
    skyUniforms['turbidity'].value = skyTurbidity !== undefined ? skyTurbidity : targetTurbidity;
    skyUniforms['rayleigh'].value = skyRayleigh !== undefined ? skyRayleigh : targetRayleigh;
    skyUniforms['mieCoefficient'].value = mieCoefficient !== undefined ? mieCoefficient : targetMieCoefficient;
    skyUniforms['mieDirectionalG'].value = mieDirectionalG !== undefined ? mieDirectionalG : targetMieDirectionalG;

    // Toggle Moon visibility: always visible if manual altitude is set, or if sun is low/night
    moonMesh.visible = (moonAltitude >= 0) || (sunPosition.y < 40 || isNight);
  };

  const dispose = () => {
    scene.remove(sky);
    scene.remove(sunMesh);
    scene.remove(moonMesh);
    scene.remove(starField);

    sky.geometry.dispose();
    sunGeometry.dispose();
    sunMaterial.dispose();
    textureFlareSun.dispose();
    textureFlareCircle.dispose();
    textureFlareRing.dispose();
    moonMaterial.dispose();
    moonTexture.dispose();
    starGeometry.dispose();
    starMaterial.dispose();
  };

  return {
    skyObj: sky,
    sunLight,
    moonMesh,
    sunPosition,
    moonPosition,
    update,
    dispose,
  };
}
