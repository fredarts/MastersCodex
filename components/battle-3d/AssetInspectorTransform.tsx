/**
 * Masters Codex - Unreal/Blender Style 3D Asset Inspector & Transform Panel
 * Controle em tempo real de Translação, Rotação, Esticamento Procedural (Array sem distorção)
 * e Calibração de Luz Dinâmica para qualquer bloco colocado no Combat Grid 3D.
 */
import React from 'react';
import { 
  BuildingBlock3D, 
  BUILDING_BLOCK_CATALOG, 
} from '@/lib/3d-building-blocks';
import { 
  Sliders, 
  RotateCw, 
  Move, 
  Maximize2, 
  Copy, 
  Trash2, 
  X, 
  SunMedium, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

export interface AssetInspectorTransformProps {
  block: BuildingBlock3D | null;
  onUpdateBlock: (updated: BuildingBlock3D) => void;
  onDuplicateBlock: (block: BuildingBlock3D) => void;
  onDeleteBlock: (blockId: string) => void;
  onClose: () => void;
}

const LIGHT_COLOR_PRESETS = [
  { label: 'Fogo Quente', color: '#ff9933', class: 'bg-amber-500' },
  { label: 'Dourado Quente', color: '#fde047', class: 'bg-yellow-400' },
  { label: 'Chama Arcana', color: '#38bdf8', class: 'bg-sky-400' },
  { label: 'Fogo Esmeralda', color: '#10b981', class: 'bg-emerald-500' },
  { label: 'Fogo Místico', color: '#c084fc', class: 'bg-purple-400' },
  { label: 'Luar Prateado', color: '#e2e8f0', class: 'bg-slate-200' },
];

export const AssetInspectorTransform: React.FC<AssetInspectorTransformProps> = ({
  block,
  onUpdateBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onClose,
}) => {
  if (!block) return null;

  const def = BUILDING_BLOCK_CATALOG[block.type];
  const supportsArray = def?.supportsProceduralLength ?? false;
  const isLight = !!def?.isLightSource || !!block.lightConfig;

  const segments = block.segmentsCount || 1;
  const hScale = block.heightScale || 1.0;
  const rotation = block.rotationDeg || 0;

  return (
    <div className="absolute bottom-20 right-4 z-40 w-80 bg-slate-950/95 backdrop-blur-xl border border-sky-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{def?.icon || '🧱'}</span>
          <div>
            <h3 className="font-bold text-sky-300 text-[12px] flex items-center gap-1.5">
              {def?.label || 'Asset 3D'}
              <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                ID #{block.id.slice(-4)}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Inspetor de Transformação & Luz</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-3.5 max-h-96 overflow-y-auto custom-scrollbar">
        {/* 1. POSITION / MOVE */}
        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Move className="w-3 h-3 text-sky-400" /> Posição no Grid (X, Z)
            </span>
            <span className="font-mono text-amber-300">
              X: {block.x.toFixed(1)} | Z: {block.z.toFixed(1)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-1">
            <button
              onClick={() => onUpdateBlock({ ...block, x: block.x - 2 })}
              className="py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-bold text-[10px]"
              title="Mover Oeste (-5ft)"
            >
              ← -5ft
            </button>
            <button
              onClick={() => onUpdateBlock({ ...block, x: block.x + 2 })}
              className="py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-bold text-[10px]"
              title="Mover Leste (+5ft)"
            >
              → +5ft
            </button>
            <button
              onClick={() => onUpdateBlock({ ...block, z: block.z - 2 })}
              className="py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-bold text-[10px]"
              title="Mover Norte (-5ft)"
            >
              ↑ -5ft
            </button>
            <button
              onClick={() => onUpdateBlock({ ...block, z: block.z + 2 })}
              className="py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-bold text-[10px]"
              title="Mover Sul (+5ft)"
            >
              ↓ +5ft
            </button>
          </div>
        </div>

        {/* 2. ELEVATION / ALTITUDE (VOO / SUSPENSO NO AR) */}
        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3 h-3 text-sky-400" /> Altura / Elevação (Y):
            </span>
            <span className="font-mono text-sky-300 font-bold">
              {((block.yElevation || 0) / 2 * 5).toFixed(0)} ft ({((block.yElevation || 0) / 2 * 1.5).toFixed(1)}m)
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={block.yElevation || 0}
            onChange={(e) => onUpdateBlock({ ...block, yElevation: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />

          <div className="grid grid-cols-4 gap-1 pt-1">
            {[
              { label: 'Chão', val: 0 },
              { label: '+5ft', val: 2 },
              { label: '+9ft', val: 3.5 },
              { label: '+15ft', val: 6 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => onUpdateBlock({ ...block, yElevation: preset.val })}
                className={`py-1 rounded border font-mono font-bold text-[10px] ${
                  Math.abs((block.yElevation || 0) - preset.val) < 0.2
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. ROTATION */}
        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <RotateCw className="w-3 h-3 text-amber-400" /> Rotação:
            </span>
            <span className="font-mono text-amber-300 font-bold">{rotation}°</span>
          </div>

          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={rotation}
            onChange={(e) => onUpdateBlock({ ...block, rotationDeg: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <div className="grid grid-cols-4 gap-1 pt-1">
            {[-90, -45, 45, 90].map((step) => (
              <button
                key={step}
                onClick={() => onUpdateBlock({ ...block, rotationDeg: ((rotation + step) % 360 + 360) % 360 })}
                className="py-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-mono font-bold text-[10px]"
              >
                {step > 0 ? `+${step}°` : `${step}°`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. PROCEDURAL STRETCH / ARRAY (UNREAL / BLENDER STYLE) */}
        {supportsArray && (
          <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3 h-3 text-emerald-400" /> Esticar Parede (Procedural)
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {segments}x ({segments * 5} ft)
              </span>
            </div>
            <p className="text-[9px] text-slate-400">
              Adiciona módulos adjacentes repetidos sem esticar nem distorcer a textura da parede.
            </p>

            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={segments}
              onChange={(e) => onUpdateBlock({ ...block, segmentsCount: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between gap-1 pt-1">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdateBlock({ ...block, segmentsCount: s })}
                  className={`flex-1 py-1 rounded border font-mono font-bold text-[10px] ${
                    segments === s
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4. HEIGHT MULTIPLIER */}
        <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-purple-400" /> Escala de Altura
            </span>
            <span className="font-mono text-purple-400 font-bold">{hScale.toFixed(1)}x</span>
          </div>

          <div className="flex justify-between gap-1">
            {[0.5, 1.0, 1.5, 2.0].map((h) => (
              <button
                key={h}
                onClick={() => onUpdateBlock({ ...block, heightScale: h })}
                className={`flex-1 py-1 rounded border font-mono font-bold text-[10px] ${
                  Math.abs(hScale - h) < 0.05
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {h}x
              </button>
            ))}
          </div>
        </div>

        {/* 5. DYNAMIC LIGHTING CONFIG (IF LIGHT SOURCE) */}
        {isLight && (
          <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/30">
            <div className="flex justify-between items-center text-[10px] font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" /> Luz Dinâmica 3D
              </span>
              <button
                onClick={() => {
                  const currentLight = block.lightConfig || {
                    color: '#ff9933',
                    intensity: 3.0,
                    distanceFt: 40,
                    enabled: true,
                  };
                  onUpdateBlock({
                    ...block,
                    lightConfig: { ...currentLight, enabled: !currentLight.enabled },
                  });
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                  block.lightConfig?.enabled !== false
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {block.lightConfig?.enabled !== false ? 'Ligada' : 'Apagada'}
              </button>
            </div>

            {block.lightConfig?.enabled !== false && (
              <div className="space-y-2 pt-1">
                {/* Color Presets */}
                <div>
                  <label className="text-[9px] text-slate-400 font-bold block mb-1">Cor da Chama / Luz:</label>
                  <div className="grid grid-cols-6 gap-1">
                    {LIGHT_COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => {
                          const currentLight = block.lightConfig || {
                            color: '#ff9933',
                            intensity: 3.0,
                            distanceFt: 40,
                            enabled: true,
                          };
                          onUpdateBlock({
                            ...block,
                            lightConfig: { ...currentLight, color: preset.color },
                          });
                        }}
                        className={`h-5 rounded-md border flex items-center justify-center transition-all ${preset.class} ${
                          block.lightConfig?.color === preset.color
                            ? 'ring-2 ring-white scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Intensity */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-400">Intensidade:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {(block.lightConfig?.intensity || 3.0).toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="6.0"
                    step="0.5"
                    value={block.lightConfig?.intensity || 3.0}
                    onChange={(e) => {
                      const currentLight = block.lightConfig || {
                        color: '#ff9933',
                        intensity: 3.0,
                        distanceFt: 40,
                        enabled: true,
                      };
                      onUpdateBlock({
                        ...block,
                        lightConfig: { ...currentLight, intensity: parseFloat(e.target.value) },
                      });
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Radius */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-400">Alcance de Iluminação:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {block.lightConfig?.distanceFt || 40} ft
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={block.lightConfig?.distanceFt || 40}
                    onChange={(e) => {
                      const currentLight = block.lightConfig || {
                        color: '#ff9933',
                        intensity: 3.0,
                        distanceFt: 40,
                        enabled: true,
                      };
                      onUpdateBlock({
                        ...block,
                        lightConfig: { ...currentLight, distanceFt: parseInt(e.target.value) },
                      });
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. DUPLICATE & DELETE ACTIONS */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={() => {
              onDuplicateBlock(block);
              toast.success('Asset duplicado no grid!');
            }}
            className="flex-1 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98 text-[10px]"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicar Asset
          </button>
          <button
            onClick={() => {
              onDeleteBlock(block.id);
              toast.info('Asset excluído.');
            }}
            className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors active:scale-98 text-[10px]"
            title="Deletar este asset (Tecla DEL)"
          >
            <Trash2 className="w-3.5 h-3.5" /> Deletar
          </button>
        </div>
      </div>
    </div>
  );
};
