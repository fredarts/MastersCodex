import React from 'react';
import * as THREE from 'three';

interface BattleEnvironmentProps {
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
  timeOfDayHour?: number;
  hasFog?: boolean;
  hasRain?: boolean;
}

export const calculateEnvironmentSettings = (
  timeOfDayHour = 12,
  timeOfDayPreset = 'day',
  hasFog = false,
  hasRain = false
) => {
  const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
  const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);

  let bgColor = '#0f172a'; // slate-900
  let ambientIntensity = 0.6;
  let sunIntensity = 1.0;
  let sunColor = '#ffffff';

  if (isNight) {
    bgColor = '#020617'; // slate-950
    ambientIntensity = 0.2;
    sunIntensity = 0.3;
    sunColor = '#38bdf8'; // moon blue
  } else if (isSunset) {
    bgColor = '#451a03';
    ambientIntensity = 0.5;
    sunIntensity = 0.8;
    sunColor = '#f97316'; // orange sunset
  }

  if (hasFog || timeOfDayPreset === 'fog') {
    bgColor = '#1e293b';
  } else if (hasRain || timeOfDayPreset === 'storm') {
    bgColor = '#0f172a';
    ambientIntensity = 0.3;
  }

  return {
    bgColor,
    ambientIntensity,
    sunIntensity,
    sunColor,
    isNight,
    isSunset,
  };
};

export const applySceneEnvironment = (
  scene: THREE.Scene,
  timeOfDayHour = 12,
  timeOfDayPreset = 'day',
  hasFog = false,
  hasRain = false
) => {
  const env = calculateEnvironmentSettings(timeOfDayHour, timeOfDayPreset, hasFog, hasRain);
  // Opcional: scene.background pode ser nulo para dar lugar à Skysphere procedural 3D
  scene.background = null;

  if (hasFog || timeOfDayPreset === 'fog') {
    scene.fog = new THREE.FogExp2(0x1e293b, 0.008);
  } else {
    scene.fog = new THREE.FogExp2(0x0f172a, 0.004);
  }

  return env;
};
