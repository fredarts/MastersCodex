import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
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
  onRotateSelected?: (angle: number) => void;
  onSelectCameraPreset?: (preset: 'tactical' | 'cinematic' | 'topDown') => void;
  onEnvironmentChange?: (env: { timeOfDayHour: number; hasFog: boolean; hasRain: boolean }) => void;
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
    if (onEnvironmentChange) onEnvironmentChange({ timeOfDayHour: hour, hasFog: fog, hasRain: rain });
  };

  return (
    <>
      {/* Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Left Side: Status & Environment Menu Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-semibold text-slate-200 shadow-lg">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>Grid 3D Tático</span>
            {isPlacementPhase && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-bold uppercase animate-pulse">
                Fase de Posicionamento
              </span>
            )}
          </div>

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
                <div className="absolute left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-3.5 shadow-2xl space-y-3 z-30 text-xs text-slate-200">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" /> Iluminação & Clima 3D
                    </span>
                    <button onClick={() => setShowEnvMenu(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Presets Grid */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Presets Rápido:</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        onClick={() => handlePresetSelect('day')}
                        className={`p-1.5 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          timeOfDayPreset === 'day' ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Sun className="w-3 h-3 text-amber-400" /> Dia
                      </button>
                      <button
                        onClick={() => handlePresetSelect('sunset')}
                        className={`p-1.5 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          timeOfDayPreset === 'sunset' ? 'bg-orange-500/20 border-orange-500 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Sun className="w-3 h-3 text-orange-400" /> Entardecer
                      </button>
                      <button
                        onClick={() => handlePresetSelect('night')}
                        className={`p-1.5 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          timeOfDayPreset === 'night' ? 'bg-sky-500/20 border-sky-500 text-sky-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Moon className="w-3 h-3 text-sky-400" /> Noite
                      </button>
                      <button
                        onClick={() => handlePresetSelect('fog')}
                        className={`p-1.5 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          timeOfDayPreset === 'fog' ? 'bg-slate-700 border-slate-500 text-slate-200' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <CloudFog className="w-3 h-3 text-slate-400" /> Nevoeiro
                      </button>
                      <button
                        onClick={() => handlePresetSelect('storm')}
                        className={`p-1.5 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                          timeOfDayPreset === 'storm' ? 'bg-indigo-900/40 border-indigo-500 text-indigo-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <CloudRain className="w-3 h-3 text-indigo-400" /> Tempestade
                      </button>
                    </div>
                  </div>

                  {/* Hour Slider */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Hora do Dia:</span>
                      <span className="font-bold text-amber-400">{timeOfDayHour}h</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={timeOfDayHour}
                      onChange={(e) => {
                        const h = parseInt(e.target.value);
                        if (onEnvironmentChange) onEnvironmentChange({ timeOfDayHour: h, hasFog, hasRain });
                      }}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  {/* Floor Texture Selector */}
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Textura do Chão:</label>
                    <select
                      value={floorTextureUrl || ''}
                      onChange={(e) => onFloorTextureChange && onFloorTextureChange(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded p-1 text-xs outline-none focus:border-amber-500"
                    >
                      <option value="">Nenhuma (Cor sólida)</option>
                      {availableTextures.map(tex => (
                        <option key={tex.url} value={tex.url}>{tex.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={hasFog}
                        onChange={(e) => {
                          if (onEnvironmentChange) onEnvironmentChange({ timeOfDayHour, hasFog: e.target.checked, hasRain });
                        }}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-800"
                      />
                      <span>Nevoeiro denso</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={hasRain}
                        onChange={(e) => {
                          if (onEnvironmentChange) onEnvironmentChange({ timeOfDayHour, hasFog, hasRain: e.target.checked });
                        }}
                        className="rounded border-slate-700 text-indigo-500 focus:ring-0 bg-slate-800"
                      />
                      <span>Chuva de partículas</span>
                    </label>
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
