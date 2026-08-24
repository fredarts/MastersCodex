import * as THREE from 'three';

export interface BattleEnvironmentProps {
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
  timeOfDayHour?: number;
  hasFog?: boolean;
  hasRain?: boolean;
  cloudDensity?: number;
  moonSize?: number;
  moonLuminosity?: number;
  moonOffsetAngle?: number;
  moonAltitude?: number;
  
  // Custom solar / lighting parameters
  sunSize?: number;
  sunLightIntensity?: number;
  ambientLightIntensity?: number;
  
  // Sky shader parameters
  skyTurbidity?: number;
  skyRayleigh?: number;
  mieCoefficient?: number;
  mieDirectionalG?: number;

  // Custom rain parameters
  rainIntensity?: number;
  rainSpeed?: number;
  rainDropSize?: number;
  windAngle?: number;
  windStrength?: number;

  // Custom fog parameters
  groundFogDensity?: number;
  groundFogHeight?: number;
  groundFogSpeed?: number;
  globalFogDensity?: number;
}

export const calculateEnvironmentSettings = (
  timeOfDayHour = 12,
  timeOfDayPreset = 'day',
  hasFog = false,
  hasRain = false,
  cloudDensity = 30,
  moonSize = 1.5,
  moonLuminosity = 1.0,
  moonOffsetAngle = 180,
  moonAltitude = -1,
  sunSize = 1.0,
  sunLightIntensity?: number,
  ambientLightIntensity?: number,
  globalFogDensity?: number
) => {
  const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
  const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);
  const isStorm = timeOfDayPreset === 'storm';

  let bgColor = '#0f172a'; // slate-900
  let ambientIntensity = 0.65;
  let sunIntensity = 1.0;
  let sunColor = '#ffffff';

  if (isNight) {
    bgColor = '#020617'; // slate-950
    ambientIntensity = 0.03; // Escuridão profunda para tochas e visão noturna brilharem
    sunIntensity = 0.08;     // Luar suave
    sunColor = '#38bdf8';    // moon blue
  } else if (isSunset) {
    bgColor = '#451a03';
    ambientIntensity = 0.35;
    sunIntensity = 0.7;
    sunColor = '#f97316'; // orange sunset
  } else if (isStorm) {
    bgColor = '#090d16';
    ambientIntensity = 0.22;
    sunIntensity = 0.35;
    sunColor = '#64748b'; // tempestade acinzentada
  }

  // Fog preset changes bgColor (used as fog tint)
  if (hasFog || timeOfDayPreset === 'fog') {
    bgColor = '#1e293b';
    if (!isNight) {
      ambientIntensity = 0.4;
      sunIntensity = 0.5;
    }
  }

  // Override intensities if manually specified
  if (ambientLightIntensity !== undefined) {
    ambientIntensity = ambientLightIntensity;
  }
  if (sunLightIntensity !== undefined) {
    sunIntensity = sunLightIntensity;
  }

  return {
    bgColor,
    ambientIntensity,
    sunIntensity,
    sunColor,
    isNight,
    isSunset,
    cloudDensity,
    moonSize,
    moonLuminosity,
    moonOffsetAngle,
    moonAltitude,
    sunSize,
  };
};

export const applySceneEnvironment = (
  scene: THREE.Scene,
  timeOfDayHour = 12,
  timeOfDayPreset = 'day',
  hasFog = false,
  hasRain = false,
  cloudDensity = 30,
  moonSize = 1.5,
  moonOffsetAngle = 180,
  moonAltitude = -1,
  sunSize = 1.0,
  sunLightIntensity?: number,
  ambientLightIntensity?: number,
  globalFogDensity?: number
) => {
  const env = calculateEnvironmentSettings(
    timeOfDayHour,
    timeOfDayPreset,
    hasFog,
    hasRain,
    cloudDensity,
    moonSize,
    moonOffsetAngle,
    moonAltitude,
    sunSize,
    sunLightIntensity,
    ambientLightIntensity,
    globalFogDensity
  );
  scene.background = null;

  if (hasFog || timeOfDayPreset === 'fog') {
    const fogDensityVal = globalFogDensity !== undefined ? globalFogDensity : 0.003;
    scene.fog = new THREE.FogExp2(0x1e293b, fogDensityVal);
  } else {
    scene.fog = null;
  }

  return env;
};
