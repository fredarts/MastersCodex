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
  let ambientIntensity = 9.6;
  let sunIntensity = 16.0;
  let sunColor = '#ffffff';

  if (isNight) {
    bgColor = '#020617'; // slate-950
    ambientIntensity = 3.2;
    sunIntensity = 4.8;
    sunColor = '#38bdf8'; // moon blue
  } else if (isSunset) {
    bgColor = '#451a03';
    ambientIntensity = 8.0;
    sunIntensity = 12.8;
    sunColor = '#f97316'; // orange sunset
  }

  // Fog preset only changes bgColor (used as fog tint), NOT lighting
  if (hasFog || timeOfDayPreset === 'fog') {
    bgColor = '#1e293b';
  }
  // Rain/storm: NO ambient or sky darkening — the skydome handles sky appearance,
  // rain is purely a particle overlay effect

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
  // scene.background = null para dar lugar à Skysphere procedural 3D
  scene.background = null;

  if (hasFog || timeOfDayPreset === 'fog') {
    // Densidade baixa (0.003) para manter o skydome visível atrás do nevoeiro
    scene.fog = new THREE.FogExp2(0x1e293b, 0.003);
  } else {
    // Sem fog: limpar completamente para nunca cobrir o skydome
    scene.fog = null;
  }

  return env;
};
