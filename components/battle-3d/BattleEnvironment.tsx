import * as THREE from 'three';

export interface BattleEnvironmentProps {
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
  timeOfDayHour?: number;
  isIndoor?: boolean;
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
  rainOpacity?: number;
  rainTheme?: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom';
  rainCustomColor?: string;
  hasSplashes?: boolean;
  splashSize?: number;
  splashIntensity?: number;
  hasCrownDrops?: boolean;
  hasLightning?: boolean;
  lightningFrequency?: number;

  // Custom fog parameters
  groundFogDensity?: number;
  groundFogHeight?: number;
  groundFogSpeed?: number;
  globalFogDensity?: number;
  fogNoiseScale?: number;
  fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
  fogCustomColor?: string;
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
  globalFogDensity?: number,
  isIndoorProp = false,
  fogColorPreset = 'natural',
  fogCustomColor = '#cbd5e1'
) => {
  const isIndoor = isIndoorProp || timeOfDayPreset === 'indoors';
  const isNight = timeOfDayPreset === 'night' || timeOfDayHour < 6 || timeOfDayHour > 19;
  const isSunset = timeOfDayPreset === 'sunset' || (timeOfDayHour >= 17 && timeOfDayHour <= 19);
  const isStorm = timeOfDayPreset === 'storm';

  let bgColor = '#0f172a'; // slate-900
  let ambientIntensity = 0.65;
  let sunIntensity = 1.0;
  let sunColor = '#ffffff';

  if (isIndoor) {
    bgColor = '#000000'; // Escuridão absoluta de caverna/masmorra
    ambientIntensity = 0.0; // Sem luz ambiente externa
    sunIntensity = 0.0;     // Sem luz solar/direcional externa
    sunColor = '#000000';
  } else if (isNight) {
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
  if (!isIndoor && (hasFog || timeOfDayPreset === 'fog')) {
    if (fogColorPreset === 'graveyard') {
      bgColor = '#0f2942';
    } else if (fogColorPreset === 'swamp') {
      bgColor = '#063725';
    } else if (fogColorPreset === 'crimson') {
      bgColor = '#3f0713';
    } else if (fogColorPreset === 'frost') {
      bgColor = '#1e3a5f';
    } else if (fogColorPreset === 'custom' && fogCustomColor) {
      bgColor = fogCustomColor;
    } else {
      bgColor = '#1e293b';
    }

    if (!isNight) {
      ambientIntensity = 0.4;
      sunIntensity = 0.5;
    }
  }

  // Override intensities if manually specified (unless indoors forces 0 unless specified)
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
    isIndoor,
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
  moonLuminosity = 1.0,
  moonOffsetAngle = 180,
  moonAltitude = -1,
  sunSize = 1.0,
  sunLightIntensity?: number,
  ambientLightIntensity?: number,
  globalFogDensity?: number,
  isIndoorProp = false,
  fogColorPreset = 'natural',
  fogCustomColor = '#cbd5e1'
) => {
  const env = calculateEnvironmentSettings(
    timeOfDayHour,
    timeOfDayPreset,
    hasFog,
    hasRain,
    cloudDensity,
    moonSize,
    moonLuminosity,
    moonOffsetAngle,
    moonAltitude,
    sunSize,
    sunLightIntensity,
    ambientLightIntensity,
    globalFogDensity,
    isIndoorProp,
    fogColorPreset,
    fogCustomColor
  );

  if (env.isIndoor) {
    scene.background = new THREE.Color(0x000000);
  } else {
    scene.background = null;
  }

  if (hasFog || timeOfDayPreset === 'fog') {
    const fogDensityVal = globalFogDensity !== undefined ? globalFogDensity : 0.003;
    let fogColor = env.isIndoor ? 0x000000 : 0x1e293b;
    if (fogColorPreset === 'graveyard') fogColor = 0x0f2942;
    else if (fogColorPreset === 'swamp') fogColor = 0x063725;
    else if (fogColorPreset === 'crimson') fogColor = 0x3f0713;
    else if (fogColorPreset === 'frost') fogColor = 0x1e3a5f;
    else if (fogColorPreset === 'custom' && fogCustomColor) {
      fogColor = parseInt(fogCustomColor.replace('#', ''), 16) || 0x1e293b;
    }

    scene.fog = new THREE.FogExp2(fogColor, fogDensityVal);
  } else {
    scene.fog = null;
  }

  return env;
};
