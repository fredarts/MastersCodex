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
  Target
} from 'lucide-react';
import { Combatant } from '@/lib/types';

export interface BattleControlsToolbarProps {
  isDm: boolean;
  isPlacementPhase?: boolean;
  selectedCombatant?: Combatant | null;
  selectedTarget?: Combatant | null;
  selectedRotation?: number;
  directionLabel?: string;
  canControlSelected?: boolean;
  timeOfDayHour?: number;
  timeOfDayPreset?: 'day' | 'sunset' | 'night' | 'fog' | 'storm';
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
  groundFogDensity?: number;
  groundFogHeight?: number;
  groundFogSpeed?: number;
  globalFogDensity?: number;
  onRotateSelected?: (angle: number) => void;
  onSelectCameraPreset?: (preset: 'tactical' | 'cinematic' | 'topDown') => void;
  onEnvironmentChange?: (env: {
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
    groundFogDensity?: number;
    groundFogHeight?: number;
    groundFogSpeed?: number;
    globalFogDensity?: number;
  }) => void;
  onTimeOfDayChange?: (preset: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => void;
  onConfirmPlacement?: () => void;
  onAttackTarget?: (target: Combatant) => void;
  onToggleHelp?: () => void;
  floorTextureUrl?: string;
  onFloorTextureChange?: (url: string) => void;
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
  sunLightIntensity: sunLightIntensityProp = 16.0,
  ambientLightIntensity: ambientLightIntensityProp = 9.6,
  skyTurbidity: skyTurbidityProp = 6,
  skyRayleigh: skyRayleighProp = 2,
  mieCoefficient: mieCoefficientProp = 0.005,
  mieDirectionalG: mieDirectionalGProp = 0.7,
  rainIntensity: rainIntensityProp = 2000,
  rainSpeed: rainSpeedProp = 1.0,
  rainDropSize: rainDropSizeProp = 1.0,
  windAngle: windAngleProp = 180,
  windStrength: windStrengthProp = 0.2,
  groundFogDensity: groundFogDensityProp = 150,
  groundFogHeight: groundFogHeightProp = 1.0,
  groundFogSpeed: groundFogSpeedProp = 1.0,
  globalFogDensity: globalFogDensityProp = 0.003,
  onRotateSelected,
  onSelectCameraPreset,
  onEnvironmentChange,
  onTimeOfDayChange,
  onConfirmPlacement,
  onAttackTarget,
  onToggleHelp,
  floorTextureUrl,
  onFloorTextureChange,
}) => {
  const [showEnvMenu, setShowEnvMenu] = useState(false);
  const [availableTextures, setAvailableTextures] = useState<{name: string, url: string}[]>([]);

  // State variables for all new weather controls
  const [internalCloudDensity, setInternalCloudDensity] = useState(cloudDensityProp);
  const [internalMoonSize, setInternalMoonSize] = useState(moonSizeProp);
  const [internalMoonLuminosity, setInternalMoonLuminosity] = useState(moonLuminosityProp);
  const [internalMoonOffsetAngle, setInternalMoonOffsetAngle] = useState(moonOffsetAngleProp);
  const [internalMoonAltitude, setInternalMoonAltitude] = useState(moonAltitudeProp);
  const [internalSunSize, setInternalSunSize] = useState(sunSizeProp);
  const [internalSunLightIntensity, setInternalSunLightIntensity] = useState(sunLightIntensityProp);
  const [internalAmbientLightIntensity, setInternalAmbientLightIntensity] = useState(ambientLightIntensityProp);
  const [internalSkyTurbidity, setInternalSkyTurbidity] = useState(skyTurbidityProp);
  const [internalSkyRayleigh, setInternalSkyRayleigh] = useState(skyRayleighProp);
  const [internalMieCoefficient, setInternalMieCoefficient] = useState(mieCoefficientProp);
  const [internalMieDirectionalG, setInternalMieDirectionalG] = useState(mieDirectionalGProp);
  const [internalRainIntensity, setInternalRainIntensity] = useState(rainIntensityProp);
  const [internalRainSpeed, setInternalRainSpeed] = useState(rainSpeedProp);
  const [internalRainDropSize, setInternalRainDropSize] = useState(rainDropSizeProp);
  const [internalWindAngle, setInternalWindAngle] = useState(windAngleProp);
  const [internalWindStrength, setInternalWindStrength] = useState(windStrengthProp);
  const [internalGroundFogDensity, setInternalGroundFogDensity] = useState(groundFogDensityProp);
  const [internalGroundFogHeight, setInternalGroundFogHeight] = useState(groundFogHeightProp);
  const [internalGroundFogSpeed, setInternalGroundFogSpeed] = useState(groundFogSpeedProp);
  const [internalGlobalFogDensity, setInternalGlobalFogDensity] = useState(globalFogDensityProp);

  useEffect(() => { setInternalCloudDensity(cloudDensityProp); }, [cloudDensityProp]);
  useEffect(() => { 
    setInternalMoonSize(moonSizeProp);
    setInternalMoonLuminosity(moonLuminosityProp);
    setInternalMoonOffsetAngle(moonOffsetAngleProp); 
  }, [moonSizeProp, moonLuminosityProp, moonOffsetAngleProp]);
  useEffect(() => { setInternalMoonAltitude(moonAltitudeProp); }, [moonAltitudeProp]);
  useEffect(() => { setInternalSunSize(sunSizeProp); }, [sunSizeProp]);
  useEffect(() => { setInternalSunLightIntensity(sunLightIntensityProp); }, [sunLightIntensityProp]);
  useEffect(() => { setInternalAmbientLightIntensity(ambientLightIntensityProp); }, [ambientLightIntensityProp]);
  useEffect(() => { setInternalSkyTurbidity(skyTurbidityProp); }, [skyTurbidityProp]);
  useEffect(() => { setInternalSkyRayleigh(skyRayleighProp); }, [skyRayleighProp]);
  useEffect(() => { setInternalMieCoefficient(mieCoefficientProp); }, [mieCoefficientProp]);
  useEffect(() => { setInternalMieDirectionalG(mieDirectionalGProp); }, [mieDirectionalGProp]);
  useEffect(() => { setInternalRainIntensity(rainIntensityProp); }, [rainIntensityProp]);
  useEffect(() => { setInternalRainSpeed(rainSpeedProp); }, [rainSpeedProp]);
  useEffect(() => { setInternalRainDropSize(rainDropSizeProp); }, [rainDropSizeProp]);
  useEffect(() => { setInternalWindAngle(windAngleProp); }, [windAngleProp]);
  useEffect(() => { setInternalWindStrength(windStrengthProp); }, [windStrengthProp]);
  useEffect(() => { setInternalGroundFogDensity(groundFogDensityProp); }, [groundFogDensityProp]);
  useEffect(() => { setInternalGroundFogHeight(groundFogHeightProp); }, [groundFogHeightProp]);
  useEffect(() => { setInternalGroundFogSpeed(groundFogSpeedProp); }, [groundFogSpeedProp]);
  useEffect(() => { setInternalGlobalFogDensity(globalFogDensityProp); }, [globalFogDensityProp]);

  // Tab state inside popover
  const [activeTab, setActiveTab] = useState<'luz' | 'sky' | 'fog' | 'rain'>('luz');

  const triggerEnvChange = (updates: Partial<{
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
    groundFogDensity: number;
    groundFogHeight: number;
    groundFogSpeed: number;
    globalFogDensity: number;
  }>) => {
    const nextHour = updates.timeOfDayHour ?? timeOfDayHour;
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
    const nextGroundFogDensity = updates.groundFogDensity ?? internalGroundFogDensity;
    const nextGroundFogHeight = updates.groundFogHeight ?? internalGroundFogHeight;
    const nextGroundFogSpeed = updates.groundFogSpeed ?? internalGroundFogSpeed;
    const nextGlobalFogDensity = updates.globalFogDensity ?? internalGlobalFogDensity;

    if (updates.cloudDensity !== undefined) setInternalCloudDensity(updates.cloudDensity);
    if (updates.moonSize !== undefined) setInternalMoonSize(updates.moonSize);
    if (updates.moonLuminosity !== undefined) setInternalMoonLuminosity(updates.moonLuminosity);
    if (updates.moonOffsetAngle !== undefined) setInternalMoonOffsetAngle(updates.moonOffsetAngle);
    if (updates.moonAltitude !== undefined) setInternalMoonAltitude(updates.moonAltitude);
    if (updates.sunSize !== undefined) setInternalSunSize(updates.sunSize);
    if (updates.sunLightIntensity !== undefined) setInternalSunLightIntensity(updates.sunLightIntensity);
    if (updates.ambientLightIntensity !== undefined) setInternalAmbientLightIntensity(updates.ambientLightIntensity);
    if (updates.skyTurbidity !== undefined) setInternalSkyTurbidity(updates.skyTurbidity);
    if (updates.skyRayleigh !== undefined) setInternalSkyRayleigh(updates.skyRayleigh);
    if (updates.mieCoefficient !== undefined) setInternalMieCoefficient(updates.mieCoefficient);
    if (updates.mieDirectionalG !== undefined) setInternalMieDirectionalG(updates.mieDirectionalG);
    if (updates.rainIntensity !== undefined) setInternalRainIntensity(updates.rainIntensity);
    if (updates.rainSpeed !== undefined) setInternalRainSpeed(updates.rainSpeed);
    if (updates.rainDropSize !== undefined) setInternalRainDropSize(updates.rainDropSize);
    if (updates.windAngle !== undefined) setInternalWindAngle(updates.windAngle);
    if (updates.windStrength !== undefined) setInternalWindStrength(updates.windStrength);
    if (updates.groundFogDensity !== undefined) setInternalGroundFogDensity(updates.groundFogDensity);
    if (updates.groundFogHeight !== undefined) setInternalGroundFogHeight(updates.groundFogHeight);
    if (updates.groundFogSpeed !== undefined) setInternalGroundFogSpeed(updates.groundFogSpeed);
    if (updates.globalFogDensity !== undefined) setInternalGlobalFogDensity(updates.globalFogDensity);

    if (onEnvironmentChange) {
      onEnvironmentChange({
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
        groundFogDensity: nextGroundFogDensity,
        groundFogHeight: nextGroundFogHeight,
        groundFogSpeed: nextGroundFogSpeed,
        globalFogDensity: nextGlobalFogDensity,
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

  const handlePresetSelect = (preset: 'day' | 'sunset' | 'night' | 'fog' | 'storm') => {
    let hour = 12;
    let fog = false;
    let rain = false;

    if (preset === 'night') hour = 24;
    if (preset === 'sunset') hour = 18;
    if (preset === 'fog') { hour = 10; fog = true; }
    if (preset === 'storm') { hour = 14; rain = true; fog = true; }

    if (onTimeOfDayChange) onTimeOfDayChange(preset);
    triggerEnvChange({ timeOfDayHour: hour, hasFog: fog, hasRain: rain });
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

              {/* Environment Popover Menu */}
              {showEnvMenu && (
                <div className="absolute left-0 mt-2 w-72 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-2xl space-y-3.5 z-30 text-xs text-slate-200 select-none max-h-[85vh] overflow-y-auto custom-scrollbar">
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
                    <div className="grid grid-cols-5 gap-1">
                      {([
                        { id: 'day', label: 'Dia', icon: <Sun className="w-3 h-3 text-amber-400" /> },
                        { id: 'sunset', label: 'Tarde', icon: <Sun className="w-3 h-3 text-orange-400" /> },
                        { id: 'night', label: 'Noite', icon: <Moon className="w-3 h-3 text-sky-400" /> },
                        { id: 'fog', label: 'Névoa', icon: <CloudFog className="w-3 h-3 text-slate-400" /> },
                        { id: 'storm', label: 'Temp', icon: <CloudRain className="w-3 h-3 text-indigo-400" /> }
                      ] as const).map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => handlePresetSelect(preset.id)}
                          className={`p-1 rounded flex flex-col items-center justify-center gap-0.5 border text-[9px] font-semibold transition-all ${
                            timeOfDayPreset === preset.id
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
                      { id: 'rain', label: 'Chuva', icon: <CloudRain className="w-3 h-3" /> }
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
                            <span className="font-bold text-amber-400">{timeOfDayHour}h</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="24"
                            value={timeOfDayHour}
                            onChange={(e) => triggerEnvChange({ timeOfDayHour: parseInt(e.target.value) })}
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
                            min="0.1"
                            max="24.0"
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
                            <span className="text-slate-400">Densidade de Nuvens:</span>
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
                        {/* Fog Toggle & Global Density */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-400 uppercase tracking-wider text-[9px]">
                            <input
                              type="checkbox"
                              checked={hasFog}
                              onChange={(e) => triggerEnvChange({ hasFog: e.target.checked })}
                              className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-950 w-3 h-3"
                            />
                            <span>Habilitar Fog</span>
                          </label>
                        </div>

                        {/* Global Fog Density */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Fog Global (Exp2):</span>
                            <span className="font-bold text-amber-300">{(internalGlobalFogDensity * 1000).toFixed(1)}k</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="0.015"
                            step="0.0005"
                            disabled={!hasFog}
                            value={internalGlobalFogDensity}
                            onChange={(e) => triggerEnvChange({ globalFogDensity: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-30"
                          />
                        </div>

                        {/* Ground Fog Header */}
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-1 border-t border-slate-900">
                          Névoa de Chão Rasteira
                        </div>

                        {/* Ground Fog Density */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Intensidade (Puffs):</span>
                            <span className="font-bold text-slate-300">{internalGroundFogDensity}</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="300"
                            step="10"
                            disabled={!hasFog}
                            value={internalGroundFogDensity}
                            onChange={(e) => triggerEnvChange({ groundFogDensity: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>

                        {/* Ground Fog Height */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Altura de Cobertura Y:</span>
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

                        {/* Ground Fog Speed */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Velocidade de Deriva:</span>
                            <span className="font-bold text-slate-300">{internalGroundFogSpeed.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="3.0"
                            step="0.1"
                            disabled={!hasFog}
                            value={internalGroundFogSpeed}
                            onChange={(e) => triggerEnvChange({ groundFogSpeed: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>
                      </div>
                    )}

                    {/* TAB: RAIN & WIND */}
                    {activeTab === 'rain' && (
                      <div className="space-y-2.5 animate-fade-in">
                        {/* Rain Toggle */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-indigo-400 uppercase tracking-wider text-[9px]">
                            <input
                              type="checkbox"
                              checked={hasRain}
                              onChange={(e) => triggerEnvChange({ hasRain: e.target.checked })}
                              className="rounded border-slate-800 text-indigo-500 focus:ring-0 bg-slate-950 w-3 h-3"
                            />
                            <span>Habilitar Chuva</span>
                          </label>
                        </div>

                        {/* Rain Intensity */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Intensidade (Gotas):</span>
                            <span className="font-bold text-indigo-300">{internalRainIntensity}</span>
                          </div>
                          <input
                            type="range"
                            min="100"
                            max="5000"
                            step="100"
                            disabled={!hasRain}
                            value={internalRainIntensity}
                            onChange={(e) => triggerEnvChange({ rainIntensity: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                          />
                        </div>

                        {/* Rain Drop Size */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Tamanho das Gotas:</span>
                            <span className="font-bold text-indigo-300">{internalRainDropSize.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="4.0"
                            step="0.1"
                            disabled={!hasRain}
                            value={internalRainDropSize}
                            onChange={(e) => triggerEnvChange({ rainDropSize: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                          />
                        </div>

                        {/* Rain Speed */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Velocidade de Queda:</span>
                            <span className="font-bold text-indigo-300">{internalRainSpeed.toFixed(1)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            disabled={!hasRain}
                            value={internalRainSpeed}
                            onChange={(e) => triggerEnvChange({ rainSpeed: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                          />
                        </div>

                        {/* Wind Header */}
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pt-1 border-t border-slate-900">
                          Direção e Força do Vento
                        </div>

                        {/* Wind Angle (Azimuth) */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Ângulo do Vento (Azimute):</span>
                            <span className="font-bold text-slate-300">{internalWindAngle}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="10"
                            disabled={!hasRain}
                            value={internalWindAngle}
                            onChange={(e) => triggerEnvChange({ windAngle: parseInt(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>

                        {/* Wind Strength */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Força do Vento (Inclinação):</span>
                            <span className="font-bold text-slate-300">{internalWindStrength.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.0"
                            max="1.5"
                            step="0.05"
                            disabled={!hasRain}
                            value={internalWindStrength}
                            onChange={(e) => triggerEnvChange({ windStrength: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400 disabled:opacity-30"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floor Texture Selector */}
                  <div className="space-y-1 pt-2 border-t border-slate-800/80">
                    <label className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Textura do Chão:</label>
                    <select
                      value={floorTextureUrl || ''}
                      onChange={(e) => onFloorTextureChange && onFloorTextureChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 text-slate-300 rounded p-1.5 text-xs outline-none focus:border-amber-500/50"
                    >
                      <option value="">Nenhuma (Cor sólida)</option>
                      {availableTextures.map(tex => (
                        <option key={tex.url} value={tex.url}>{tex.name}</option>
                      ))}
                    </select>
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
            </div>
          </div>
        )}

        {/* Selected Target HUD Banner */}
        {selectedTarget && (
          <div className="bg-rose-950/90 backdrop-blur-xl border border-rose-500/50 px-4 py-2 rounded-xl flex items-center gap-4 text-xs shadow-2xl animate-fade-in">
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
          </div>
        )}
      </div>
    </>
  );
};
