import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudFog,
  RotateCcw,
  RotateCw,
  Swords,
  CheckCircle2,
  HelpCircle,
  Sliders,
  X,
  Target,
  Eye,
  Flame,
  Box,
  Home,
  Lock,
  Unlock,
  Film,
  Maximize2,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Grid,
  Trash2,
  Play
} from 'lucide-react';
import { Combatant, VideoGridAlignmentConfig } from '@/lib/types';
import { useAudio } from '@/context/AudioContext';
import { 
  LIVING_BATTLEMAPS_PRESETS, 
  isAnyVideoMapUrl, 
  isYouTubeUrl, 
  extractYouTubeVideoId 
} from '@/lib/living-battlemaps-catalog';

const getCompassLabel = (angle: number): string => {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Norte ▲';
  if (normalized >= 22.5 && normalized < 67.5) return 'Nordeste ↗';
  if (normalized >= 67.5 && normalized < 112.5) return 'Leste ▶';
  if (normalized >= 112.5 && normalized < 157.5) return 'Sudeste ↘';
  if (normalized >= 157.5 && normalized < 202.5) return 'Sul ▼';
  if (normalized >= 202.5 && normalized < 247.5) return 'Sudoeste ↙';
  if (normalized >= 247.5 && normalized < 292.5) return 'Oeste ◀';
  return 'Noroeste ↖';
};

const CARDINAL_POINTS = [
  { label: 'N', angle: 0 },
  { label: 'NE', angle: 45 },
  { label: 'L', angle: 90 },
  { label: 'SE', angle: 135 },
  { label: 'S', angle: 180 },
  { label: 'SO', angle: 225 },
  { label: 'O', angle: 270 },
  { label: 'NO', angle: 315 },
];

export interface BattleControlsToolbarProps {
  isDm: boolean;
  isPlacementPhase?: boolean;
  selectedCombatant?: Combatant | null;
  selectedTarget?: Combatant | null;
  selectedRotation?: number;
  directionLabel?: string;
  canControlSelected?: boolean;
  timeOfDayHour?: number;
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
  hasFog?: boolean;
  hasRain?: boolean;
  cloudDensity?: number;
  moonSize?: number;
  moonLuminosity?: number;
  moonOffsetAngle?: number;
  moonAltitude?: number;
  sunSize?: number;
  sunLightIntensity?: number;
  ambientLightIntensity?: number;
  skyTurbidity?: number;
  skyRayleigh?: number;
  mieCoefficient?: number;
  mieDirectionalG?: number;
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
  groundFogDensity?: number;
  groundFogHeight?: number;
  groundFogSpeed?: number;
  globalFogDensity?: number;
  fogNoiseScale?: number;
  fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
  fogCustomColor?: string;
  onRotateSelected?: (angle: number) => void;
  onSelectCameraPreset?: (preset: 'tactical' | 'cinematic' | 'topDown') => void;
  onEnvironmentChange?: (env: {
    timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
    isIndoor?: boolean;
    timeOfDayHour: number;
    hasFog: boolean;
    hasRain: boolean;
    cloudDensity?: number;
    moonSize?: number;
    moonLuminosity?: number;
    moonOffsetAngle?: number;
    moonAltitude?: number;
    sunSize?: number;
    sunLightIntensity?: number;
    ambientLightIntensity?: number;
    skyTurbidity?: number;
    skyRayleigh?: number;
    mieCoefficient?: number;
    mieDirectionalG?: number;
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
    groundFogDensity?: number;
    groundFogHeight?: number;
    groundFogSpeed?: number;
    globalFogDensity?: number;
    fogNoiseScale?: number;
    fogColorPreset?: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
    fogCustomColor?: string;
  }) => void;
  onTimeOfDayChange?: (preset: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors') => void;
  onConfirmPlacement?: () => void;
  onAttackTarget?: (target: Combatant) => void;
  onToggleHelp?: () => void;
  floorTextureUrl?: string;
  onFloorTextureChange?: (url: string) => void;
  videoGridConfig?: VideoGridAlignmentConfig;
  onVideoGridConfigChange?: (config: VideoGridAlignmentConfig) => void;
  isPlayerVisionMode?: boolean;
  onTogglePlayerVisionMode?: () => void;
  onToggleTorch?: (c: Combatant) => void;
  isForgeMenuOpen?: boolean;
  onToggleForgeMenu?: () => void;
  isAssetsLocked?: boolean;
  onToggleAssetsLocked?: () => void;
}

export const BattleControlsToolbar: React.FC<BattleControlsToolbarProps> = ({
  isDm,
  isPlacementPhase = false,
  selectedCombatant,
  selectedTarget,
  selectedRotation = 0,
  directionLabel = 'Norte ▲',
  canControlSelected = false,
  timeOfDayHour = 12,
  timeOfDayPreset = 'day',
  hasFog = false,
  hasRain = false,
  cloudDensity: cloudDensityProp = 30,
  moonSize: moonSizeProp = 1.5,
  moonLuminosity: moonLuminosityProp = 1.0,
  moonOffsetAngle: moonOffsetAngleProp = 180,
  moonAltitude: moonAltitudeProp = -1,
  sunSize: sunSizeProp = 1.0,
  sunLightIntensity: sunLightIntensityProp = 1.0,
  ambientLightIntensity: ambientLightIntensityProp = 0.65,
  skyTurbidity: skyTurbidityProp = 6,
  skyRayleigh: skyRayleighProp = 2,
  mieCoefficient: mieCoefficientProp = 0.005,
  mieDirectionalG: mieDirectionalGProp = 0.7,
  rainIntensity: rainIntensityProp = 2000,
  rainSpeed: rainSpeedProp = 1.0,
  rainDropSize: rainDropSizeProp = 1.0,
  windAngle: windAngleProp = 180,
  windStrength: windStrengthProp = 0.2,
  rainOpacity: rainOpacityProp = 0.55,
  rainTheme: rainThemeProp = 'water',
  rainCustomColor: rainCustomColorProp = '#88ccff',
  hasSplashes: hasSplashesProp = true,
  splashSize: splashSizeProp = 1.0,
  splashIntensity: splashIntensityProp = 1.0,
  hasCrownDrops: hasCrownDropsProp = true,
  hasLightning: hasLightningProp = false,
  lightningFrequency: lightningFrequencyProp = 1.0,
  groundFogDensity: groundFogDensityProp = 150,
  groundFogHeight: groundFogHeightProp = 1.0,
  groundFogSpeed: groundFogSpeedProp = 1.0,
  globalFogDensity: globalFogDensityProp = 0.003,
  fogNoiseScale: fogNoiseScaleProp = 1.0,
  fogColorPreset: fogColorPresetProp = 'natural',
  fogCustomColor: fogCustomColorProp = '#cbd5e1',
  onRotateSelected,
  onSelectCameraPreset,
  onEnvironmentChange,
  onTimeOfDayChange,
  onConfirmPlacement,
  onAttackTarget,
  onToggleHelp,
  floorTextureUrl,
  onFloorTextureChange,
  videoGridConfig,
  onVideoGridConfigChange,
  isPlayerVisionMode = false,
  onTogglePlayerVisionMode,
  onToggleTorch,
  isForgeMenuOpen = false,
  onToggleForgeMenu,
  isAssetsLocked = true,
  onToggleAssetsLocked,
}) => {
  const { setActiveVideoMapTitle } = useAudio();
  const [showEnvMenu, setShowEnvMenu] = useState(false);
  const [availableTextures, setAvailableTextures] = useState<{name: string, url: string}[]>([]);

  // Weather and lighting values directly derived from props (eliminates cascading useEffect setState loops)
  const internalPreset = timeOfDayPreset ?? 'day';
  const internalHour = timeOfDayHour ?? 12;
  const internalCloudDensity = cloudDensityProp ?? 30;
  const internalMoonSize = moonSizeProp ?? 1.5;
  const internalMoonLuminosity = moonLuminosityProp ?? 1.0;
  const internalMoonOffsetAngle = moonOffsetAngleProp ?? 180;
  const internalMoonAltitude = moonAltitudeProp ?? -1;
  const internalSunSize = sunSizeProp ?? 1.0;
  const internalSunLightIntensity = sunLightIntensityProp ?? 1.0;
  const internalAmbientLightIntensity = ambientLightIntensityProp ?? 0.65;
  const internalSkyTurbidity = skyTurbidityProp ?? 6;
  const internalSkyRayleigh = skyRayleighProp ?? 2;
  const internalMieCoefficient = mieCoefficientProp ?? 0.005;
  const internalMieDirectionalG = mieDirectionalGProp ?? 0.7;
  const internalRainIntensity = rainIntensityProp ?? 2000;
  const internalRainSpeed = rainSpeedProp ?? 1.0;
  const internalRainDropSize = rainDropSizeProp ?? 1.0;
  const internalWindAngle = windAngleProp ?? 180;
  const internalWindStrength = windStrengthProp ?? 0.2;
  const internalRainOpacity = rainOpacityProp ?? 0.55;
  const internalRainTheme = rainThemeProp ?? 'water';
  const internalRainCustomColor = rainCustomColorProp ?? '#88ccff';
  const internalHasSplashes = hasSplashesProp ?? true;
  const internalSplashSize = splashSizeProp ?? 1.0;
  const internalSplashIntensity = splashIntensityProp ?? 1.0;
  const internalHasCrownDrops = hasCrownDropsProp ?? true;
  const internalHasLightning = hasLightningProp ?? false;
  const internalLightningFrequency = lightningFrequencyProp ?? 1.0;
  const internalGroundFogDensity = groundFogDensityProp ?? 150;
  const internalGroundFogHeight = groundFogHeightProp ?? 1.0;
  const internalGroundFogSpeed = groundFogSpeedProp ?? 1.0;
  const internalGlobalFogDensity = globalFogDensityProp ?? 0.003;
  const internalFogNoiseScale = fogNoiseScaleProp ?? 1.0;
  const internalFogColorPreset = fogColorPresetProp ?? 'natural';
  const internalFogCustomColor = fogCustomColorProp ?? '#cbd5e1';

  // Tab state inside popover
  const [activeTab, setActiveTab] = useState<'luz' | 'sky' | 'fog' | 'rain' | 'map'>('luz');
  const [rainSubTab, setRainSubTab] = useState<'gotas' | 'respingos' | 'vento'>('gotas');
  const [customYouTubeUrl, setCustomYouTubeUrl] = useState(floorTextureUrl || '');

  useEffect(() => {
    setCustomYouTubeUrl(floorTextureUrl || '');
  }, [floorTextureUrl]);

  // Calibration Helpers for Overlapping Video Grid with Game Grid 1:1
  const currentScale = videoGridConfig?.scale ?? 1.0;
  const currentOffsetX = videoGridConfig?.offsetX ?? 0;
  const currentOffsetY = videoGridConfig?.offsetY ?? 0;
  const currentGridOpacity = videoGridConfig?.gridOpacity ?? 0.35;
  const currentGridColor = videoGridConfig?.gridColor ?? '#0284c7';

  const updateVideoGrid = (patch: Partial<VideoGridAlignmentConfig>) => {
    if (onVideoGridConfigChange) {
      onVideoGridConfigChange({
        scale: patch.scale ?? currentScale,
        offsetX: patch.offsetX ?? currentOffsetX,
        offsetY: patch.offsetY ?? currentOffsetY,
        gridOpacity: patch.gridOpacity ?? currentGridOpacity,
        gridColor: patch.gridColor ?? currentGridColor,
        aspectRatio: patch.aspectRatio ?? videoGridConfig?.aspectRatio ?? '16:9'
      });
    }
  };

  const triggerEnvChange = (updates: Partial<{
    timeOfDayPreset: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors';
    isIndoor: boolean;
    timeOfDayHour: number;
    hasFog: boolean;
    hasRain: boolean;
    cloudDensity: number;
    moonSize: number;
    moonLuminosity: number;
    moonOffsetAngle: number;
    moonAltitude: number;
    sunSize: number;
    sunLightIntensity: number;
    ambientLightIntensity: number;
    skyTurbidity: number;
    skyRayleigh: number;
    mieCoefficient: number;
    mieDirectionalG: number;
    rainIntensity: number;
    rainSpeed: number;
    rainDropSize: number;
    windAngle: number;
    windStrength: number;
    rainOpacity: number;
    rainTheme: 'water' | 'acid' | 'blood' | 'snow' | 'gold' | 'custom';
    rainCustomColor: string;
    hasSplashes: boolean;
    splashSize: number;
    splashIntensity: number;
    hasCrownDrops: boolean;
    hasLightning: boolean;
    lightningFrequency: number;
    groundFogDensity: number;
    groundFogHeight: number;
    groundFogSpeed: number;
    globalFogDensity: number;
    fogNoiseScale: number;
    fogColorPreset: 'natural' | 'graveyard' | 'swamp' | 'crimson' | 'frost' | 'custom';
    fogCustomColor: string;
  }>) => {
    const nextPreset = updates.timeOfDayPreset ?? internalPreset;
    const nextIndoor = updates.isIndoor ?? (nextPreset === 'indoors');
    const nextHour = updates.timeOfDayHour !== undefined ? updates.timeOfDayHour : internalHour;
    const nextFog = updates.hasFog ?? hasFog;
    const nextRain = updates.hasRain ?? hasRain;
    const nextClouds = updates.cloudDensity ?? internalCloudDensity;
    const nextMoonSize = updates.moonSize ?? internalMoonSize;
    const nextMoonLuminosity = updates.moonLuminosity ?? internalMoonLuminosity;
    const nextMoonAngle = updates.moonOffsetAngle ?? internalMoonOffsetAngle;
    const nextMoonAlt = updates.moonAltitude ?? internalMoonAltitude;
    const nextSunSize = updates.sunSize ?? internalSunSize;
    const nextSunLightIntensity = updates.sunLightIntensity ?? internalSunLightIntensity;
    const nextAmbientLightIntensity = updates.ambientLightIntensity ?? internalAmbientLightIntensity;
    const nextSkyTurbidity = updates.skyTurbidity ?? internalSkyTurbidity;
    const nextSkyRayleigh = updates.skyRayleigh ?? internalSkyRayleigh;
    const nextMieCoefficient = updates.mieCoefficient ?? internalMieCoefficient;
    const nextMieDirectionalG = updates.mieDirectionalG ?? internalMieDirectionalG;
    const nextRainIntensity = updates.rainIntensity ?? internalRainIntensity;
    const nextRainSpeed = updates.rainSpeed ?? internalRainSpeed;
    const nextRainDropSize = updates.rainDropSize ?? internalRainDropSize;
    const nextWindAngle = updates.windAngle ?? internalWindAngle;
    const nextWindStrength = updates.windStrength ?? internalWindStrength;
    const nextRainOpacity = updates.rainOpacity ?? internalRainOpacity;
    const nextRainTheme = updates.rainTheme ?? internalRainTheme;
    const nextRainCustomColor = updates.rainCustomColor ?? internalRainCustomColor;
    const nextHasSplashes = updates.hasSplashes ?? internalHasSplashes;
    const nextSplashSize = updates.splashSize ?? internalSplashSize;
    const nextSplashIntensity = updates.splashIntensity ?? internalSplashIntensity;
    const nextHasCrownDrops = updates.hasCrownDrops ?? internalHasCrownDrops;
    const nextHasLightning = updates.hasLightning ?? internalHasLightning;
    const nextLightningFrequency = updates.lightningFrequency ?? internalLightningFrequency;
    const nextGroundFogDensity = updates.groundFogDensity ?? internalGroundFogDensity;
    const nextGroundFogHeight = updates.groundFogHeight ?? internalGroundFogHeight;
    const nextGroundFogSpeed = updates.groundFogSpeed ?? internalGroundFogSpeed;
    const nextGlobalFogDensity = updates.globalFogDensity ?? internalGlobalFogDensity;
    const nextFogNoiseScale = updates.fogNoiseScale ?? internalFogNoiseScale;
    const nextFogColorPreset = updates.fogColorPreset ?? internalFogColorPreset;
    const nextFogCustomColor = updates.fogCustomColor ?? internalFogCustomColor;

    if (onEnvironmentChange) {
      onEnvironmentChange({
        timeOfDayPreset: nextPreset,
        isIndoor: nextIndoor,
        timeOfDayHour: nextHour,
        hasFog: nextFog,
        hasRain: nextRain,
        cloudDensity: nextClouds,
        moonSize: nextMoonSize,
        moonLuminosity: nextMoonLuminosity,
        moonOffsetAngle: nextMoonAngle,
        moonAltitude: nextMoonAlt,
        sunSize: nextSunSize,
        sunLightIntensity: nextSunLightIntensity,
        ambientLightIntensity: nextAmbientLightIntensity,
        skyTurbidity: nextSkyTurbidity,
        skyRayleigh: nextSkyRayleigh,
        mieCoefficient: nextMieCoefficient,
        mieDirectionalG: nextMieDirectionalG,
        rainIntensity: nextRainIntensity,
        rainSpeed: nextRainSpeed,
        rainDropSize: nextRainDropSize,
        windAngle: nextWindAngle,
        windStrength: nextWindStrength,
        rainOpacity: nextRainOpacity,
        rainTheme: nextRainTheme,
        rainCustomColor: nextRainCustomColor,
        hasSplashes: nextHasSplashes,
        splashSize: nextSplashSize,
        splashIntensity: nextSplashIntensity,
        hasCrownDrops: nextHasCrownDrops,
        hasLightning: nextHasLightning,
        lightningFrequency: nextLightningFrequency,
        groundFogDensity: nextGroundFogDensity,
        groundFogHeight: nextGroundFogHeight,
        groundFogSpeed: nextGroundFogSpeed,
        globalFogDensity: nextGlobalFogDensity,
        fogNoiseScale: nextFogNoiseScale,
        fogColorPreset: nextFogColorPreset,
        fogCustomColor: nextFogCustomColor,
      });
    }
  };

  useEffect(() => {
    if (isDm) {
      fetch('/api/textures/floors')
        .then(res => res.json())
        .then(data => {
          if (data.textures) {
            setAvailableTextures(data.textures);
          }
        })
        .catch(err => console.error('Failed to fetch floor textures:', err));
    }
  }, [isDm]);

  const handlePresetSelect = (preset: 'day' | 'sunset' | 'night' | 'fog' | 'storm' | 'indoors') => {
    let hour = 12;
    let fog = false;
    let rain = false;
    let ambient = 0.65;
    let sun = 1.0;

    if (preset === 'indoors') {
      hour = 0;
      ambient = 0.0;
      sun = 0.0;
    } else if (preset === 'day') {
      hour = 12;
      ambient = 0.65;
      sun = 1.0;
    } else if (preset === 'sunset') {
      hour = 18;
      ambient = 0.35;
      sun = 0.7;
    } else if (preset === 'night') {
      hour = 0;
      ambient = 0.03;
      sun = 0.08;
    } else if (preset === 'fog') {
      hour = 10;
      fog = true;
      ambient = 0.4;
      sun = 0.5;
    } else if (preset === 'storm') {
      hour = 14;
      rain = true;
      fog = true;
      ambient = 0.22;
      sun = 0.35;
    }

    if (onTimeOfDayChange) onTimeOfDayChange(preset);
    triggerEnvChange({
      timeOfDayPreset: preset,
      isIndoor: preset === 'indoors',
      timeOfDayHour: hour,
      hasFog: fog,
      hasRain: rain,
      ambientLightIntensity: ambient,
      sunLightIntensity: sun,
    });
  };

  return (
    <>
      {/* Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Left Side: Status & Environment Menu Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isPlacementPhase && (
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-semibold text-slate-200 shadow-lg">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-bold uppercase animate-pulse">
                Fase de Posicionamento
              </span>
            </div>
          )}

          {/* DM / Player Vision Mode Toggle */}
          {isDm && onTogglePlayerVisionMode && (
            <button
              onClick={onTogglePlayerVisionMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all ${
                isPlayerVisionMode
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
              title={isPlayerVisionMode ? 'Visão dos Jogadores: Monstros fora de tochas/visão ficam ocultos no escuro' : 'Visão do Mestre: Todos os monstros visíveis'}
            >
              <Eye className={`w-3.5 h-3.5 ${isPlayerVisionMode ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{isPlayerVisionMode ? 'Visão: Jogador (FOW)' : 'Visão: Mestre'}</span>
            </button>
          )}

          {/* DM 3D Building Blocks & Forge Toggle */}
          {isDm && onToggleForgeMenu && (
            <button
              onClick={onToggleForgeMenu}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all ${
                isForgeMenuOpen
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/60 text-slate-300'
              }`}
              title="Forja de Cenários 3D (Paredes, Pilares, Grade & Magias)"
            >
              <Box className={`w-3.5 h-3.5 ${isForgeMenuOpen ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Forja 3D</span>
            </button>
          )}

          {/* DM Asset Lock / Edit Toggle */}
          {isDm && onToggleAssetsLocked && (
            <button
              onClick={onToggleAssetsLocked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all active:scale-95 ${
                isAssetsLocked
                  ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
              }`}
              title={
                isAssetsLocked
                  ? 'Assets 3D Travados (Clique para liberar a movimentação e edição de assets 3D)'
                  : 'Edição de Assets Habilitada (Clique para travar e proteger contra movimentação acidental)'
              }
            >
              {isAssetsLocked ? (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              )}
              <span>{isAssetsLocked ? 'Assets Travados' : 'Editar Assets'}</span>
            </button>
          )}

          {/* DM Environment Settings Toggle */}
          {isDm && (
            <div className="relative">
              <button
                onClick={() => setShowEnvMenu(!showEnvMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all ${
                  showEnvMenu
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                }`}
                title="Clima e Iluminação"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Clima & Luz</span>
              </button>

              {/* Environment Popover Menu - Responsive Height & Full Fit */}
              {showEnvMenu && (
                <div className="absolute left-0 mt-1.5 w-80 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-3 shadow-2xl space-y-2.5 z-30 text-xs text-slate-200 select-none max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" /> Atmosfera & Clima Pro
                    </span>
                    <button onClick={() => setShowEnvMenu(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Presets Grid */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Presets Rápido:</label>
                    <div className="grid grid-cols-6 gap-1">
                      {([
                        { id: 'day', label: 'Dia', icon: <Sun className="w-3 h-3 text-amber-400" /> },
                        { id: 'sunset', label: 'Tarde', icon: <Sun className="w-3 h-3 text-orange-400" /> },
                        { id: 'night', label: 'Noite', icon: <Moon className="w-3 h-3 text-sky-400" /> },
                        { id: 'fog', label: 'Névoa', icon: <CloudFog className="w-3 h-3 text-slate-400" /> },
                        { id: 'storm', label: 'Temp', icon: <CloudRain className="w-3 h-3 text-indigo-400" /> },
                        { id: 'indoors', label: 'Fechado', icon: <Home className="w-3 h-3 text-emerald-400" /> }
                      ] as const).map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset.id)}
                          className={`p-1 rounded flex flex-col items-center justify-center gap-0.5 border text-[9px] font-semibold transition-all ${
                            internalPreset === preset.id
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {preset.icon}
                          <span>{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-slate-800 p-0.5 bg-slate-900/60 rounded-lg">
                    {([
                      { id: 'luz', label: 'Luzes', icon: <Sun className="w-3 h-3" /> },
                      { id: 'sky', label: 'Céu/Lua', icon: <Moon className="w-3 h-3" /> },
                      { id: 'fog', label: 'Nevoeiro', icon: <CloudFog className="w-3 h-3" /> },
                      { id: 'rain', label: 'Chuva', icon: <CloudRain className="w-3 h-3" /> },
                      { id: 'map', label: 'Mapa Vivo', icon: <Film className="w-3 h-3 text-emerald-400" /> }
                    ] as const).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex flex-col items-center py-1 rounded-md text-[9px] font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-slate-800 text-white shadow-md border border-slate-700/50'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.icon}
                        <span className="mt-0.5">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* TAB PANELS */}
                  <div className="space-y-3 min-h-[140px]">
                    
                    {/* TAB: LUZ & DIA */}
                    {activeTab === 'luz' && (
                      <div className="space-y-2.5 animate-fade-in">
                        {/* Hour Slider */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Hora do Dia:</span>
                            <span className="font-bold text-amber-400">{internalHour}h</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="24"
                            value={internalHour}
                            onChange={(e) => {
                              const h = parseInt(e.target.value);
                              const isNight = h < 6 || h > 19;
                              const isSunset = h >= 17 && h <= 19;
                              const ambient = isNight ? 0.03 : (isSunset ? 0.35 : 0.65);
                              const sun = isNight ? 0.08 : (isSunset ? 0.7 : 1.0);
                              const dynamicPreset = isNight ? 'night' : (isSunset ? 'sunset' : 'day');
                              if (onTimeOfDayChange) onTimeOfDayChange(dynamicPreset);
                              triggerEnvChange({
                                timeOfDayPreset: dynamicPreset,
                                isIndoor: false,
                                timeOfDayHour: h,
                                ambientLightIntensity: ambient,
                                sunLightIntensity: sun,
                              });
                            }}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        {/* Sun Size Slider */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Tamanho do Sol:</span>
                            <span className="font-bold text-amber-400">{internalSunSize.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="4.0"
                            step="0.1"
                            value={internalSunSize}
                            onChange={(e) => triggerEnvChange({ sunSize: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        {/* Sun Intensity Slider */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Brilho do Sol:</span>
                            <span className="font-bold text-amber-400">{internalSunLightIntensity.toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="40.0"
                            step="0.5"
                            value={internalSunLightIntensity}
                            onChange={(e) => triggerEnvChange({ sunLightIntensity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        {/* Ambient Light Slider */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Luz Ambiente (Céu):</span>
                            <span className="font-bold text-slate-300">{internalAmbientLightIntensity.toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="20.0"
                            step="0.5"
                            value={internalAmbientLightIntensity}
                            onChange={(e) => triggerEnvChange({ ambientLightIntensity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB: SKY & MOON */}
                    {activeTab === 'sky' && (
                      <div className="space-y-2.5 animate-fade-in">
                        {/* Clouds */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">
                              Cobertura de Nuvens ({internalCloudDensity === 0 ? '0% Limpo' : internalCloudDensity === 100 ? '100% Encoberto' : `${internalCloudDensity}%`}):
                            </span>
                            <span className="font-bold text-sky-400">{internalCloudDensity}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={internalCloudDensity}
                            onChange={(e) => triggerEnvChange({ cloudDensity: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                        </div>

                        {/* Turbidity */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400" title="Quantidade de poeira e poluição no ar">Névoa Atmosférica (Turbidity):</span>
                            <span className="font-bold text-slate-300">{internalSkyTurbidity}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="30"
                            value={internalSkyTurbidity}
                            onChange={(e) => triggerEnvChange({ skyTurbidity: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                          />
                        </div>

                        {/* Mie Directional G */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400" title="Aura/Espalhamento de brilho do Sol">Brilho Solar (Mie G):</span>
                            <span className="font-bold text-slate-300">{internalMieDirectionalG.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.0"
                            step="0.02"
                            value={internalMieDirectionalG}
                            onChange={(e) => triggerEnvChange({ mieDirectionalG: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                          />
                        </div>

                        {/* Moon Controls Header */}
                        <div className="flex justify-between items-center text-[9px] font-bold text-indigo-400 uppercase pt-1 border-t border-slate-900">
                          <span>Lua Cinemática</span>
                          {internalMoonAltitude >= 0 && (
                            <button
                              onClick={() => triggerEnvChange({ moonAltitude: -1, moonOffsetAngle: 180 })}
                              className="text-[8px] text-slate-500 hover:text-indigo-400 underline lowercase"
                            >
                              auto
                            </button>
                          )}
                        </div>

                        {/* Moon Size */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Tamanho da Lua:</span>
                            <span className="font-bold text-indigo-300">{internalMoonSize.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="4.0"
                            step="0.1"
                            value={internalMoonSize}
                            onChange={(e) => triggerEnvChange({ moonSize: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Moon Luminosity */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Luminosidade (Brilho):</span>
                            <span className="font-bold text-indigo-300">{internalMoonLuminosity.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            value={internalMoonLuminosity}
                            onChange={(e) => triggerEnvChange({ moonLuminosity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Moon Horizon Angle */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Direção Horizontal (Azimute):</span>
                            <span className="font-bold text-indigo-300">{internalMoonOffsetAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            value={internalMoonOffsetAngle}
                            onChange={(e) => triggerEnvChange({ moonOffsetAngle: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Moon Altitude */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Altura no Céu (Altitude):</span>
                            <span className="font-bold text-indigo-300">
                              {internalMoonAltitude < 0 ? 'Auto (Segue Sol)' : `${internalMoonAltitude}°`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="90"
                            step="1"
                            value={internalMoonAltitude}
                            onChange={(e) => triggerEnvChange({ moonAltitude: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB: FOG */}
                    {activeTab === 'fog' && (
                      <div className="space-y-2.5 animate-fade-in">
                        {/* Fog Toggle */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-400 uppercase tracking-wider text-[9px]">
                            <input
                              type="checkbox"
                              checked={hasFog}
                              onChange={(e) => triggerEnvChange({ hasFog: e.target.checked })}
                              className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-950 w-3 h-3"
                            />
                            <span>Habilitar Névoa 3D</span>
                          </label>
                        </div>

                        {/* Fog Theme Presets */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Estilo Atmosférico:</label>
                          <div className="grid grid-cols-5 gap-1">
                            {([
                              { id: 'natural', label: 'Natural', color: 'bg-slate-400/20 text-slate-300 border-slate-600' },
                              { id: 'graveyard', label: 'Cemitério', color: 'bg-sky-500/20 text-sky-300 border-sky-500' },
                              { id: 'swamp', label: 'Pântano', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500' },
                              { id: 'crimson', label: 'Abissal', color: 'bg-rose-500/20 text-rose-300 border-rose-500' },
                              { id: 'frost', label: 'Gelo', color: 'bg-cyan-400/20 text-cyan-200 border-cyan-400' },
                            ] as const).map(theme => (
                              <button
                                key={theme.id}
                                disabled={!hasFog}
                                onClick={() => {
                                  setInternalFogColorPreset(theme.id);
                                  triggerEnvChange({ fogColorPreset: theme.id });
                                }}
                                className={`py-1 px-0.5 rounded flex flex-col items-center justify-center border text-[8px] font-bold transition-all disabled:opacity-30 ${
                                  internalFogColorPreset === theme.id
                                    ? `${theme.color} ring-1 ring-amber-400 shadow-md`
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                }`}
                              >
                                <span>{theme.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Ground Fog Density */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Densidade Volumétrica:</span>
                            <span className="font-bold text-amber-300">{Math.round((internalGroundFogDensity / 300) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            step="10"
                            disabled={!hasFog}
                            value={internalGroundFogDensity}
                            onChange={(e) => triggerEnvChange({ groundFogDensity: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
                          />
                        </div>

                        {/* Fog Noise Scale (Turbulence / Tendrils) */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400" title="Controla a escala das mechas e redemoinhos de ruído procedural">
                              Turbulência / Mechas (FBM):
                            </span>
                            <span className="font-bold text-amber-300">{internalFogNoiseScale.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="3.0"
                            step="0.1"
                            disabled={!hasFog}
                            value={internalFogNoiseScale}
                            onChange={(e) => triggerEnvChange({ fogNoiseScale: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
                          />
                        </div>

                        {/* Ground Fog Height */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Altura do Manto Y:</span>
                            <span className="font-bold text-slate-300">{internalGroundFogHeight.toFixed(1)}m</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="4.0"
                            step="0.1"
                            disabled={!hasFog}
                            value={internalGroundFogHeight}
                            onChange={(e) => triggerEnvChange({ groundFogHeight: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>

                        {/* Wind / Drift Direction (Compass Azimuth) */}
                        <div className="space-y-1 pt-1 border-t border-slate-900">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Direção da Névoa (Vento):</span>
                            <span className="font-bold text-amber-300">{getCompassLabel(internalWindAngle)} ({internalWindAngle}°)</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="5"
                            disabled={!hasFog}
                            value={internalWindAngle}
                            onChange={(e) => triggerEnvChange({ windAngle: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 disabled:opacity-30"
                          />
                          <div className="grid grid-cols-8 gap-0.5 pt-0.5">
                            {CARDINAL_POINTS.map((cardinal) => {
                              const isCurrent = Math.abs(((internalWindAngle % 360) + 360) % 360 - cardinal.angle) < 15;
                              return (
                                <button
                                  key={cardinal.label}
                                  type="button"
                                  disabled={!hasFog}
                                  onClick={() => triggerEnvChange({ windAngle: cardinal.angle })}
                                  className={`py-0.5 text-[8.5px] font-bold rounded border transition-all ${
                                    isCurrent
                                      ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                  } disabled:opacity-30`}
                                >
                                  {cardinal.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Ground Fog Speed (Drift) */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Velocidade do Vento:</span>
                            <span className="font-bold text-slate-300">
                              {internalGroundFogSpeed.toFixed(1)}x
                              {internalGroundFogSpeed === 0 ? ' (Estático)' : internalGroundFogSpeed > 6.0 ? ' (Vendaval)' : internalGroundFogSpeed > 3.0 ? ' (Forte)' : ' (Brisa)'}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="10.0"
                            step="0.2"
                            disabled={!hasFog}
                            value={internalGroundFogSpeed}
                            onChange={(e) => triggerEnvChange({ groundFogSpeed: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>

                        {/* Global Distance Fog */}
                        <div className="space-y-0.5 pt-1 border-t border-slate-900">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Névoa Global de Distância:</span>
                            <span className="font-bold text-slate-300">{(internalGlobalFogDensity * 1000).toFixed(1)}k</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="0.015"
                            step="0.0005"
                            disabled={!hasFog}
                            value={internalGlobalFogDensity}
                            onChange={(e) => triggerEnvChange({ globalFogDensity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB: RAIN & WEATHER PRO */}
                    {activeTab === 'rain' && (
                      <div className="space-y-2.5 animate-fade-in text-xs">
                        {/* Rain Master Toggle */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-sky-400 uppercase tracking-wider text-[10px]">
                            <input
                              type="checkbox"
                              checked={hasRain}
                              onChange={(e) => triggerEnvChange({ hasRain: e.target.checked })}
                              className="rounded border-slate-800 text-sky-500 focus:ring-0 bg-slate-950 w-3.5 h-3.5"
                            />
                            <span>Habilitar Chuva Realista</span>
                          </label>
                          {hasRain && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold border border-sky-500/30">
                              {internalRainIntensity} gotas
                            </span>
                          )}
                        </div>

                        {/* Rain Sub-Tabs Switcher */}
                        <div className="flex bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[9.5px]">
                          <button
                            type="button"
                            onClick={() => setRainSubTab('gotas')}
                            className={`flex-1 py-1 px-1 rounded font-semibold transition-all flex items-center justify-center gap-1 ${
                              rainSubTab === 'gotas'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>💧 Gotas</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRainSubTab('respingos')}
                            className={`flex-1 py-1 px-1 rounded font-semibold transition-all flex items-center justify-center gap-1 ${
                              rainSubTab === 'respingos'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>🌊 Respingos</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRainSubTab('vento')}
                            className={`flex-1 py-1 px-1 rounded font-semibold transition-all flex items-center justify-center gap-1 ${
                              rainSubTab === 'vento'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>⚡ Vento & Temp</span>
                          </button>
                        </div>

                        {/* SUB-TAB 1: GOTAS & PRECIPITAÇÃO */}
                        {rainSubTab === 'gotas' && (
                          <div className="space-y-2.5 animate-fade-in">
                            {/* Rain Thematic Presets */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Presets de Precipitação:</label>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { id: 'drizzle', label: 'Garoa', icon: '🌦️', theme: 'water' as const, int: 1200, spd: 0.8, size: 0.8, op: 0.45, wStr: 0.1, spl: true, splSz: 0.7, splInt: 0.4, cr: false, lgt: false },
                                  { id: 'steady', label: 'Chuva', icon: '🌧️', theme: 'water' as const, int: 3500, spd: 1.3, size: 1.0, op: 0.6, wStr: 0.3, spl: true, splSz: 1.0, splInt: 0.75, cr: true, lgt: false },
                                  { id: 'storm', label: 'Temporal', icon: '⛈️', theme: 'water' as const, int: 6000, spd: 2.2, size: 1.4, op: 0.8, wStr: 0.8, spl: true, splSz: 1.4, splInt: 1.0, cr: true, lgt: false },
                                  { id: 'thunder', label: 'Elétrica', icon: '⚡', theme: 'water' as const, int: 5500, spd: 2.4, size: 1.3, op: 0.75, wStr: 1.1, spl: true, splSz: 1.3, splInt: 0.9, cr: true, lgt: true },
                                  { id: 'acid', label: 'Ácida', icon: '🧪', theme: 'acid' as const, int: 3000, spd: 1.2, size: 1.1, op: 0.7, wStr: 0.2, spl: true, splSz: 1.1, splInt: 0.8, cr: true, lgt: false },
                                  { id: 'blood', label: 'Sangue', icon: '🩸', theme: 'blood' as const, int: 4000, spd: 1.4, size: 1.2, op: 0.85, wStr: 0.3, spl: true, splSz: 1.2, splInt: 0.85, cr: true, lgt: false },
                                  { id: 'snow', label: 'Nevasca', icon: '❄️', theme: 'snow' as const, int: 3200, spd: 0.5, size: 1.8, op: 0.9, wStr: 0.6, spl: false, splSz: 0.0, splInt: 0.0, cr: false, lgt: false },
                                  { id: 'gold', label: 'Sagrada', icon: '✨', theme: 'gold' as const, int: 2500, spd: 1.1, size: 1.2, op: 0.7, wStr: 0.2, spl: true, splSz: 1.0, splInt: 0.7, cr: true, lgt: false },
                                ].map((preset) => {
                                  const isCurrent = internalRainTheme === preset.theme && Math.abs(internalRainIntensity - preset.int) < 800;
                                  return (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      disabled={!hasRain}
                                      onClick={() => {
                                        triggerEnvChange({
                                          rainTheme: preset.theme,
                                          rainIntensity: preset.int,
                                          rainSpeed: preset.spd,
                                          rainDropSize: preset.size,
                                          rainOpacity: preset.op,
                                          windStrength: preset.wStr,
                                          hasSplashes: preset.spl,
                                          splashSize: preset.splSz,
                                          splashIntensity: preset.splInt,
                                          hasCrownDrops: preset.cr,
                                          hasLightning: preset.lgt,
                                        });
                                      }}
                                      className={`py-1 px-1 rounded flex flex-col items-center justify-center border text-[8.5px] font-bold transition-all disabled:opacity-30 ${
                                        isCurrent
                                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-md ring-1 ring-sky-400/50'
                                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                      }`}
                                    >
                                      <span className="text-xs">{preset.icon}</span>
                                      <span className="mt-0.5">{preset.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Rain Density / Intensity */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Intensidade de Gotas:</span>
                                <span className="font-bold text-sky-300">{internalRainIntensity}</span>
                              </div>
                              <input
                                type="range"
                                min="200"
                                max="8000"
                                step="200"
                                disabled={!hasRain}
                                value={internalRainIntensity}
                                onChange={(e) => triggerEnvChange({ rainIntensity: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-30"
                              />
                            </div>

                            {/* Drop Size & Falling Speed Grid */}
                            <div className="grid grid-cols-2 gap-2">
                              {/* Rain Drop Size */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-slate-400">Tamanho:</span>
                                  <span className="font-bold text-sky-300">{internalRainDropSize.toFixed(1)}x</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="4.0"
                                  step="0.1"
                                  disabled={!hasRain}
                                  value={internalRainDropSize}
                                  onChange={(e) => triggerEnvChange({ rainDropSize: parseFloat(e.target.value) })}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-30"
                                />
                              </div>

                              {/* Rain Speed */}
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-slate-400">Velocidade:</span>
                                  <span className="font-bold text-sky-300">{internalRainSpeed.toFixed(1)}x</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.2"
                                  max="5.0"
                                  step="0.1"
                                  disabled={!hasRain}
                                  value={internalRainSpeed}
                                  onChange={(e) => triggerEnvChange({ rainSpeed: parseFloat(e.target.value) })}
                                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-30"
                                />
                              </div>
                            </div>

                            {/* Rain Opacity */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Opacidade / Visibilidade:</span>
                                <span className="font-bold text-slate-300">{Math.round(internalRainOpacity * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.1"
                                max="1.0"
                                step="0.05"
                                disabled={!hasRain}
                                value={internalRainOpacity}
                                onChange={(e) => triggerEnvChange({ rainOpacity: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-30"
                              />
                            </div>
                          </div>
                        )}

                        {/* SUB-TAB 2: RESPINGOS & ONDULAÇÕES NO CHÃO */}
                        {rainSubTab === 'respingos' && (
                          <div className="space-y-2.5 animate-fade-in">
                            {/* Ground Splash Toggle */}
                            <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                              <label className="flex items-center gap-1.5 cursor-pointer font-bold text-cyan-400 uppercase tracking-wider text-[9.5px]">
                                <input
                                  type="checkbox"
                                  disabled={!hasRain || internalRainTheme === 'snow'}
                                  checked={internalHasSplashes && internalRainTheme !== 'snow'}
                                  onChange={(e) => triggerEnvChange({ hasSplashes: e.target.checked })}
                                  className="rounded border-slate-800 text-cyan-500 focus:ring-0 bg-slate-950 w-3 h-3 disabled:opacity-30"
                                />
                                <span>🌊 Habilitar Respingos & Ondas</span>
                              </label>
                              {internalHasSplashes && internalRainTheme !== 'snow' && (
                                <span className="text-[8px] text-cyan-300 font-mono">Shader GPU</span>
                              )}
                            </div>

                            {/* 0% to 100% Exact Splash Frequency Slider */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400" title="Porcentagem exata de gotas que criam ondulações e respingos ao tocar o chão">
                                  Frequência de Respingos:
                                </span>
                                <span className="font-bold text-cyan-300">
                                  {Math.round(internalSplashIntensity * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.0"
                                max="1.0"
                                step="0.05"
                                disabled={!hasRain || !internalHasSplashes || internalRainTheme === 'snow'}
                                value={internalSplashIntensity}
                                onChange={(e) => triggerEnvChange({ splashIntensity: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                              />
                              <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-0.5">
                                <span>0% (Sem respingos)</span>
                                <span>{internalSplashIntensity === 0 ? 'Desativado' : internalSplashIntensity >= 0.99 ? 'Todas as gotas' : `${Math.round(internalSplashIntensity * 100)}% das gotas`}</span>
                                <span>100% (Todas)</span>
                              </div>
                            </div>

                            {/* Ripple Ring Scale */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Tamanho das Ondulações:</span>
                                <span className="font-bold text-cyan-300">{internalSplashSize.toFixed(1)}x</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="3.0"
                                step="0.1"
                                disabled={!hasRain || !internalHasSplashes || internalRainTheme === 'snow'}
                                value={internalSplashSize}
                                onChange={(e) => triggerEnvChange({ splashSize: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-30"
                              />
                            </div>

                            {/* Crown Drops Toggle */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                              <label className="flex items-center gap-1.5 cursor-pointer text-[9.5px] text-slate-300 font-medium">
                                <input
                                  type="checkbox"
                                  disabled={!hasRain || !internalHasSplashes || internalRainTheme === 'snow'}
                                  checked={internalHasCrownDrops}
                                  onChange={(e) => triggerEnvChange({ hasCrownDrops: e.target.checked })}
                                  className="rounded border-slate-800 text-cyan-500 focus:ring-0 bg-slate-950 w-3 h-3 disabled:opacity-30"
                                />
                                <span>Gotículas Saltitantes de Impacto</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {/* SUB-TAB 3: VENTO & TEMPESTADE */}
                        {rainSubTab === 'vento' && (
                          <div className="space-y-2.5 animate-fade-in">
                            {/* Wind Angle / Direction */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Direção do Vento (Azimute):</span>
                                <span className="font-bold text-sky-300">{getCompassLabel(internalWindAngle)} ({internalWindAngle}°)</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                step="5"
                                disabled={!hasRain}
                                value={internalWindAngle}
                                onChange={(e) => triggerEnvChange({ windAngle: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-30"
                              />
                              <div className="grid grid-cols-8 gap-0.5 pt-0.5">
                                {CARDINAL_POINTS.map((cardinal) => {
                                  const isCurrent = Math.abs(((internalWindAngle % 360) + 360) % 360 - cardinal.angle) < 15;
                                  return (
                                    <button
                                      key={cardinal.label}
                                      type="button"
                                      disabled={!hasRain}
                                      onClick={() => triggerEnvChange({ windAngle: cardinal.angle })}
                                      className={`py-0.5 text-[8.5px] font-bold rounded border transition-all ${
                                        isCurrent
                                          ? 'bg-sky-500/30 border-sky-400 text-sky-200'
                                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                      } disabled:opacity-30`}
                                    >
                                      {cardinal.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Wind Strength / Tilt */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[10px] font-mono">
                                <span className="text-slate-400">Força / Inclinação do Vento:</span>
                                <span className="font-bold text-sky-300">
                                  {internalWindStrength.toFixed(2)}
                                  {internalWindStrength === 0 ? ' (Sem Vento)' : internalWindStrength > 1.2 ? ' (Vendaval)' : internalWindStrength > 0.6 ? ' (Forte)' : ' (Brisa)'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0.0"
                                max="2.5"
                                step="0.05"
                                disabled={!hasRain}
                                value={internalWindStrength}
                                onChange={(e) => triggerEnvChange({ windStrength: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 disabled:opacity-30"
                              />
                            </div>

                            {/* Thunderstorm & Lightning */}
                            <div className="space-y-1 pt-1.5 border-t border-slate-900">
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-400 uppercase tracking-wider text-[9.5px]">
                                  <input
                                    type="checkbox"
                                    disabled={!hasRain}
                                    checked={internalHasLightning}
                                    onChange={(e) => triggerEnvChange({ hasLightning: e.target.checked })}
                                    className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-950 w-3 h-3 disabled:opacity-30"
                                  />
                                  <span>⚡ Relâmpagos & Flashes na Cena</span>
                                </label>
                                {internalHasLightning && (
                                  <span className="text-[8px] text-amber-300 font-mono animate-pulse">Ativo</span>
                                )}
                              </div>

                              {internalHasLightning && (
                                <div className="space-y-0.5 pl-2 border-l border-amber-500/30">
                                  <div className="flex justify-between text-[10px] font-mono">
                                    <span className="text-slate-400">Frequência dos Relâmpagos:</span>
                                    <span className="font-bold text-amber-300">{internalLightningFrequency.toFixed(1)}x</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="0.3"
                                    max="3.0"
                                    step="0.1"
                                    disabled={!hasRain}
                                    value={internalLightningFrequency}
                                    onChange={(e) => triggerEnvChange({ lightningFrequency: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB: MAPA VIVO / YOUTUBE & CALIBRAÇÃO 1:1 */}
                    {activeTab === 'map' && (
                      <div className="space-y-3 animate-fade-in text-xs">
                        {/* 1. Curated Living Battlemaps Presets */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Catálogo de Mapas Vivos:</span>
                            </label>
                            <span className="text-[9px] text-slate-500 font-mono">1-Clique</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                            {LIVING_BATTLEMAPS_PRESETS.map((mapPreset) => {
                              const isSelected = floorTextureUrl === mapPreset.youtubeUrl || 
                                extractYouTubeVideoId(floorTextureUrl) === mapPreset.youtubeId;

                              return (
                                <button
                                  key={mapPreset.id}
                                  onClick={() => {
                                    if (onFloorTextureChange) {
                                      onFloorTextureChange(mapPreset.youtubeUrl);
                                      setCustomYouTubeUrl(mapPreset.youtubeUrl);
                                      setActiveVideoMapTitle(mapPreset.name);
                                      if (mapPreset.defaultScale && onVideoGridConfigChange) {
                                        updateVideoGrid({
                                          scale: mapPreset.defaultScale,
                                          offsetX: mapPreset.defaultOffsetX ?? 0,
                                          offsetY: mapPreset.defaultOffsetY ?? 0
                                        });
                                      }
                                    }
                                  }}
                                  className={`relative group flex flex-col items-start p-1 rounded-lg border text-left transition-all overflow-hidden ${
                                    isSelected
                                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 shadow-sm'
                                      : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300'
                                  }`}
                                  title={`${mapPreset.name} - ${mapPreset.ambientSoundDescription}`}
                                >
                                  <div className="w-full h-11 rounded bg-slate-950 overflow-hidden relative mb-1 flex items-center justify-center">
                                    <img 
                                      src={mapPreset.thumbnailUrl} 
                                      alt={mapPreset.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-0.5 pointer-events-none">
                                      <span className="text-[7.5px] font-bold text-emerald-300 bg-slate-950/90 px-1 rounded flex items-center gap-0.5">
                                        <Play className="w-2 h-2 fill-emerald-300" /> HD Loop
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[9.5px] font-bold truncate w-full">
                                    {mapPreset.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Custom YouTube or Video URL Input */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-800/80">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                            <span>Link Personalizado do YouTube:</span>
                            {isAnyVideoMapUrl(floorTextureUrl) && (
                              <span className="text-[8px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/40 px-1 rounded">
                                ● Vídeo Ativo
                              </span>
                            )}
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={customYouTubeUrl}
                              placeholder="https://www.youtube.com/watch?v=..."
                              onChange={(e) => setCustomYouTubeUrl(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && onFloorTextureChange) {
                                  onFloorTextureChange(customYouTubeUrl.trim());
                                  setActiveVideoMapTitle('Vídeo Personalizado');
                                }
                              }}
                              className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-emerald-500/60 font-mono text-[10px]"
                            />
                            <button
                              onClick={() => {
                                if (onFloorTextureChange) {
                                  onFloorTextureChange(customYouTubeUrl.trim());
                                  setActiveVideoMapTitle('Vídeo Personalizado');
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2 py-1 rounded text-[10px] transition-all cursor-pointer"
                              title="Aplicar Link do Vídeo"
                            >
                              Aplicar
                            </button>
                            {floorTextureUrl && (
                              <button
                                onClick={() => {
                                  if (onFloorTextureChange) {
                                    onFloorTextureChange('');
                                    setCustomYouTubeUrl('');
                                    setActiveVideoMapTitle('');
                                  }
                                }}
                                className="bg-slate-850 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700/60 p-1 rounded transition-all cursor-pointer"
                                title="Remover Vídeo e Voltar ao Chão Sólido"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 3. Grid Alignment & Overlap Calibration Tools (1:1) */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/80 bg-slate-900/40 p-2 rounded-lg border">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                              <Grid className="w-3 h-3" />
                              <span>Alinhar Grid com o Vídeo (1:1):</span>
                            </span>
                            <button
                              onClick={() => updateVideoGrid({ scale: 1.0, offsetX: 0, offsetY: 0, gridOpacity: 0.35, gridColor: '#0284c7' })}
                              className="text-[8px] font-bold text-slate-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                              title="Resetar alinhamento para padrão"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Reset</span>
                            </button>
                          </div>

                          {/* Zoom / Scale */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[9px] font-mono">
                              <span className="text-slate-400">Zoom / Escala do Vídeo:</span>
                              <span className="font-bold text-amber-300">{currentScale.toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="2.5"
                              step="0.02"
                              value={currentScale}
                              onChange={(e) => updateVideoGrid({ scale: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                          </div>

                          {/* Offset X & Y */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-slate-400">Posição X:</span>
                                <span className="font-bold text-slate-300">{currentOffsetX.toFixed(1)}%</span>
                              </div>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                step="0.5"
                                value={currentOffsetX}
                                onChange={(e) => updateVideoGrid({ offsetX: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                              />
                            </div>

                            <div className="space-y-0.5">
                              <div className="flex justify-between text-[9px] font-mono">
                                <span className="text-slate-400">Posição Y:</span>
                                <span className="font-bold text-slate-300">{currentOffsetY.toFixed(1)}%</span>
                              </div>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                step="0.5"
                                value={currentOffsetY}
                                onChange={(e) => updateVideoGrid({ offsetY: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                              />
                            </div>
                          </div>

                          {/* Grid Opacity & Contrast Color */}
                          <div className="space-y-1 pt-1 border-t border-slate-800/60">
                            <div className="flex justify-between text-[9px] font-mono">
                              <span className="text-slate-400">Opacidade do Grid:</span>
                              <span className="font-bold text-cyan-400">{Math.round(currentGridOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.05"
                              max="1.0"
                              step="0.05"
                              value={currentGridOpacity}
                              onChange={(e) => updateVideoGrid({ gridOpacity: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            />

                            {/* Color contrast palette */}
                            <div className="flex items-center gap-1 pt-1">
                              <span className="text-[8.5px] text-slate-500 font-bold uppercase">Cor do Grid:</span>
                              {[
                                { color: '#0284c7', label: 'Ciano' },
                                { color: '#ffffff', label: 'Branco' },
                                { color: '#fbbf24', label: 'Ouro' },
                                { color: '#22c55e', label: 'Verde' },
                                { color: '#e11d48', label: 'Rubi' },
                                { color: '#1e293b', label: 'Sombra' },
                              ].map((c) => (
                                <button
                                  key={c.color}
                                  onClick={() => updateVideoGrid({ gridColor: c.color })}
                                  className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                                    currentGridColor === c.color ? 'scale-125 border-white ring-1 ring-white/50' : 'border-slate-700 hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: c.color }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 4. Textura Estática Alternativa */}
                        <div className="space-y-1 pt-1 border-t border-slate-800/80">
                          <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Ou Textura Estática:</label>
                          <select
                            value={isAnyVideoMapUrl(floorTextureUrl) ? '' : (floorTextureUrl || '')}
                            onChange={(e) => {
                              if (onFloorTextureChange) {
                                onFloorTextureChange(e.target.value);
                                setCustomYouTubeUrl('');
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-850 text-slate-300 rounded p-1.5 text-xs outline-none focus:border-amber-500/50"
                          >
                            <option value="">Nenhuma (Cor sólida)</option>
                            {availableTextures.map((tex: { name: string; url: string }) => (
                              <option key={tex.url} value={tex.url}>{tex.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Camera Presets & Help Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onSelectCameraPreset && (
            <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => onSelectCameraPreset('tactical')}
                className="px-2 py-1 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                title="Câmera Tática (Diagonal)"
              >
                Tática
              </button>
              <button
                onClick={() => onSelectCameraPreset('cinematic')}
                className="px-2 py-1 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                title="Câmera Cinemática (Baixa)"
              >
                Cinemática
              </button>
              <button
                onClick={() => onSelectCameraPreset('topDown')}
                className="px-2 py-1 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
                title="Visão Superior (Top-Down)"
              >
                Top-Down
              </button>
            </div>
          )}

          {isPlacementPhase && onConfirmPlacement && isDm && (
            <button
              onClick={onConfirmPlacement}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-lg transition-all active:scale-95"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmar Posições</span>
            </button>
          )}

          {onToggleHelp && (
            <button
              onClick={onToggleHelp}
              className="p-2 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md rounded-lg border border-slate-700/60 text-slate-300 transition-colors"
              title="Ajuda e Controles"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom HUD: Selected Combatant / Rotation / Target Panel */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto z-20">
        {selectedCombatant && canControlSelected && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-4 text-xs shadow-2xl">
            <div className="flex flex-col">
              <span className="font-bold text-sky-400">{selectedCombatant.name}</span>
              <span className="text-[10px] text-slate-400">Direção: {directionLabel}</span>
            </div>
            <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
              <button
                onClick={() => onRotateSelected && onRotateSelected(-45)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors active:scale-95"
                title="Girar 45° Esquerda"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRotateSelected && onRotateSelected(45)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition-colors active:scale-95"
                title="Girar 45° Direita"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {onToggleTorch && (
                <button
                  onClick={() => onToggleTorch(selectedCombatant)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all border ml-1 active:scale-95 ${
                    selectedCombatant.hasTorch
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title={selectedCombatant.hasTorch ? 'Apagar Tocha' : 'Acender Tocha 3D (20ft plena / 20ft penumbra)'}
                >
                  <Flame className={`w-3.5 h-3.5 ${selectedCombatant.hasTorch ? 'text-amber-400 animate-pulse' : ''}`} />
                  <span>{selectedCombatant.hasTorch ? 'Tocha Acesa' : 'Acender Tocha'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selected Target HUD Banner */}
        {selectedTarget && (
          <div className="bg-rose-950/90 backdrop-blur-xl border border-rose-500/50 px-4 py-2 rounded-xl flex items-center gap-3 text-xs shadow-2xl animate-fade-in">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3" /> Alvo Selecionado
              </span>
              <span className="font-bold text-slate-100">{selectedTarget.name}</span>
            </div>

            {onAttackTarget && (
              <button
                onClick={() => onAttackTarget(selectedTarget)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 shadow-md"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Atacar</span>
              </button>
            )}

            <button
              onClick={() => {
                import('@/lib/stores/useLiveCockpitStudioStore').then(({ useLiveCockpitStudioStore }) => {
                  useLiveCockpitStudioStore.getState().setSelectedTargetId(undefined);
                  useLiveCockpitStudioStore.getState().setPendingAttack(null);
                });
              }}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors ml-1"
              title="Desmarcar Alvo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
