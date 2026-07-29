import * as THREE from 'three';

export interface CloudSystemInstance {
  group: THREE.Group;
  update: (delta: number, timeOfDayPreset?: string, cloudDensity?: number, timeOfDayHour?: number) => void;
  dispose: () => void;
}

// Generate procedural soft cloud texture using HTML Canvas
function generateCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);

    // Draw multiple overlapping soft radial blobs
    const blobs = [
      { x: 128, y: 128, r: 70, a: 0.7 },
      { x: 90, y: 140, r: 50, a: 0.6 },
      { x: 166, y: 140, r: 50, a: 0.6 },
      { x: 110, y: 110, r: 45, a: 0.5 },
      { x: 146, y: 110, r: 45, a: 0.5 },
      { x: 70, y: 155, r: 35, a: 0.4 },
      { x: 186, y: 155, r: 35, a: 0.4 },
    ];

    blobs.forEach((blob) => {
      const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
      grad.addColorStop(0, `rgba(255, 255, 255, ${blob.a})`);
      grad.addColorStop(0.6, `rgba(255, 255, 255, ${blob.a * 0.4})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createCloudSystem(scene: THREE.Scene): CloudSystemInstance {
  const group = new THREE.Group();
  group.name = 'battleCloudsGroup';

  const cloudTexture = generateCloudTexture();
  const maxClouds = 50;
  const clouds: { sprite: THREE.Sprite; baseOpacity: number; speedX: number; speedZ: number; index: number }[] = [];

  // Create pool of cloud sprites
  for (let i = 0; i < maxClouds; i++) {
    const material = new THREE.SpriteMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0, // initially invisible, controlled by cloudDensity
      depthWrite: false,
      fog: false,
    });

    const sprite = new THREE.Sprite(material);

    // Randomize initial positions over grid (-150 to 150) at height 45..75
    const posX = (Math.random() - 0.5) * 300;
    const posY = 45 + Math.random() * 30;
    const posZ = (Math.random() - 0.5) * 300;
    sprite.position.set(posX, posY, posZ);

    // Randomize scale for varied puff shapes
    const scaleX = 35 + Math.random() * 45;
    const scaleY = 18 + Math.random() * 25;
    sprite.scale.set(scaleX, scaleY, 1);

    group.add(sprite);

    clouds.push({
      sprite,
      baseOpacity: 0.35 + Math.random() * 0.45,
      speedX: 0.4 + Math.random() * 0.6,
      speedZ: (Math.random() - 0.5) * 0.2,
      index: i,
    });
  }

  scene.add(group);

  const update = (
    delta: number,
    timeOfDayPreset = 'day',
    cloudDensity = 30,
    timeOfDayHour = 12
  ) => {
    // Determine active cloud count based on density (0 to 100)
    const activeCount = Math.floor((cloudDensity / 100) * maxClouds);

    // Color Tint based on environment
    const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
    const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);

    let cloudColor = new THREE.Color(0xffffff); // Day white

    if (timeOfDayPreset === 'storm') {
      cloudColor = new THREE.Color(0x334155); // Dark slate storm cloud
    } else if (timeOfDayPreset === 'fog') {
      cloudColor = new THREE.Color(0x94a3b8); // Muted slate gray
    } else if (isNight) {
      cloudColor = new THREE.Color(0x1e293b); // Dark slate navy night cloud
    } else if (isSunset) {
      cloudColor = new THREE.Color(0xfdba74); // Warm sunset orange/pink
    }

    const dtFactor = Math.min(delta, 0.1);

    clouds.forEach((cloudData) => {
      const { sprite, index, baseOpacity, speedX, speedZ } = cloudData;
      const material = sprite.material as THREE.SpriteMaterial;

      if (index < activeCount && cloudDensity > 0) {
        // Target opacity scales linearly with density (0 to 100)
        const targetOpacity = baseOpacity * (cloudDensity / 100);
        material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.25);
        material.color.lerp(cloudColor, 0.1);

        // Drift cloud across the sky
        sprite.position.x += speedX * dtFactor * 3.0;
        sprite.position.z += speedZ * dtFactor * 3.0;

        // Wrap around boundaries
        if (sprite.position.x > 180) sprite.position.x = -180;
        if (sprite.position.z > 180) sprite.position.z = -180;
        if (sprite.position.z < -180) sprite.position.z = 180;
      } else {
        // Fade out inactive clouds
        material.opacity = THREE.MathUtils.lerp(material.opacity, 0, 0.25);
      }
    });
  };

  const dispose = () => {
    scene.remove(group);
    clouds.forEach((c) => {
      c.sprite.material.dispose();
    });
    cloudTexture.dispose();
  };

  return { group, update, dispose };
}
