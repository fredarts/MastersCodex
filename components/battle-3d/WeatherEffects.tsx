import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface WeatherEffectsProps {
  scene: THREE.Scene;
  hasRain?: boolean;
  hasStorm?: boolean;
}

export function createRainParticleSystem(scene: THREE.Scene, particleCount = 1000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 40;
    positions[i + 1] = Math.random() * 20;
    positions[i + 2] = (Math.random() - 0.5) * 40;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.15,
    transparent: true,
    opacity: 0.6,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  return {
    particles,
    update: () => {
      const posArr = geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        posArr[i] -= 0.4;
        if (posArr[i] < 0) {
          posArr[i] = 20;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose: () => {
      scene.remove(particles);
      geometry.dispose();
      material.dispose();
    },
  };
}
