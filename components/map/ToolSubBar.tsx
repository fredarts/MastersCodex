'use client';

import React from 'react';
import { 
  Flame, 
  FlameKindling, 
  Lamp, 
  Zap, 
  Sparkles, 
  X, 
  Search,
  Check
} from 'lucide-react';
import { TileType } from '../MapMaker';
import { Combatant } from '@/lib/types';

interface ToolSubBarProps {
  selectedTool: string;
  // Paint tool
  selectedTileType: TileType;
  onSelectTileType: (type: TileType) => void;
  // Box tool
  boxMode: 'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover';
  onSelectBoxMode: (mode: 'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover') => void;
  // Light tool
  selectedLightPreset: 'torch' | 'candle' | 'lantern' | 'spell' | 'dragon';
  onSelectLightPreset: (preset: 'torch' | 'candle' | 'lantern' | 'spell' | 'dragon') => void;
  // Token tool
  tokenCategoryTab: 'party' | 'monsters' | 'npcs';
  onSelectTokenCategoryTab: (tab: 'party' | 'monsters' | 'npcs') => void;
  tokenSearchQuery: string;
  onTokenSearchQueryChange: (query: string) => void;
  filteredTokens: Combatant[];
  selectedTokenCombatant: Combatant | null;
  onSelectTokenCombatant: (combatant: Combatant) => void;
  // Calibrate tool
  gridScale: number;
  onGridScaleChange: (val: number) => void;
  gridOffsetX: number;
  onGridOffsetXChange: (val: number) => void;
  gridOffsetY: number;
  onGridOffsetYChange: (val: number) => void;
  onResetCalibration: () => void;
}

export const ToolSubBar: React.FC<ToolSubBarProps> = ({
  selectedTool,
  selectedTileType,
  onSelectTileType,
  boxMode,
  onSelectBoxMode,
  selectedLightPreset,
  onSelectLightPreset,
  tokenCategoryTab,
  onSelectTokenCategoryTab,
  tokenSearchQuery,
  onTokenSearchQueryChange,
  filteredTokens,
  selectedTokenCombatant,
  onSelectTokenCombatant,
  gridScale,
  onGridScaleChange,
  gridOffsetX,
  onGridOffsetXChange,
  gridOffsetY,
  onGridOffsetYChange,
  onResetCalibration,
}) => {
  // 1. Paint tool sub-bar
  if (selectedTool === 'paint') {
    const terrains: { id: TileType; label: string; iconEmoji?: string }[] = [
      { id: 'floor', label: 'Piso' },
      { id: 'wall', label: 'Parede' },
      { id: 'grass', label: 'Grama' },
      { id: 'water', label: 'Água' },
      { id: 'door', label: '🚪 Porta' },
      { id: 'trap', label: '⚠️ Armadilha' },
      { id: 'chest', label: '🧰 Baú' },
      { id: 'stash', label: '💎 Stash' },
      { id: 'trigger', label: '🕹️ Mecanismo' },
      { id: 'portcullis', label: '⛓️ Grade' },
      { id: 'illusion_wall', label: '🌫️ Parede Falsa' },
      { id: 'transition', label: '🪜 Escadas' },
    ];

    return (
      <div className="absolute top-2.5 left-16 z-30 px-3 py-1.5 bg-[#0d121a]/95 backdrop-blur-md border border-[#222c3d] rounded-xl flex items-center gap-1.5 shadow-2xl overflow-x-auto max-w-[calc(100vw-180px)] animate-in fade-in slide-in-from-top-1 duration-150 scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0 mr-1 flex items-center gap-1">
          Terreno:
        </span>
        {terrains.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectTileType(t.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedTileType === t.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-[#141a26] text-slate-300 border border-[#222c3d] hover:bg-[#1c2638] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  // 2. Box / Shapes tool sub-bar
  if (selectedTool === 'box') {
    const modes: { id: 'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover'; label: string }[] = [
      { id: 'fill', label: 'Preencher Tudo' },
      { id: 'room', label: 'Criar Sala (Paredes+Piso)' },
      { id: 'hollow', label: 'Contorno' },
      { id: 'fog-reveal', label: 'Revelar Fog' },
      { id: 'fog-cover', label: 'Ocultar Fog' },
    ];

    return (
      <div className="absolute top-2.5 left-16 z-30 px-3 py-1.5 bg-[#0d121a]/95 backdrop-blur-md border border-[#222c3d] rounded-xl flex flex-wrap items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
        <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0">Modo Forma:</span>
        <div className="flex items-center gap-1">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelectBoxMode(m.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                boxMode === m.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-[#141a26] text-slate-300 border border-[#222c3d] hover:bg-[#1c2638]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {(boxMode === 'fill' || boxMode === 'hollow') && (
          <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tipo:</span>
            {(['floor', 'wall', 'grass', 'water'] as TileType[]).map((t) => (
              <button
                key={t}
                onClick={() => onSelectTileType(t)}
                className={`px-2 py-0.5 rounded text-xs capitalize font-semibold transition-all cursor-pointer ${
                  selectedTileType === t
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#141a26] text-slate-300 border border-[#222c3d] hover:bg-[#1c2638]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Light Presets sub-bar
  if (selectedTool === 'light') {
    const presets = [
      { id: 'torch' as const, label: 'Tocha (20/40ft)', color: '#ffaa33', icon: Flame },
      { id: 'candle' as const, label: 'Vela (10/20ft)', color: '#ffcc66', icon: FlameKindling },
      { id: 'lantern' as const, label: 'Lampião (30/60ft)', color: '#ffee88', icon: Lamp },
      { id: 'spell' as const, label: 'Magia Az. (20/40ft)', color: '#38bdf8', icon: Zap },
      { id: 'dragon' as const, label: 'Brazeiro (30/60ft)', color: '#ef4444', icon: Flame },
    ];

    return (
      <div className="absolute top-2.5 left-16 z-30 px-3.5 py-2 bg-[#0d121a]/95 backdrop-blur-md border border-amber-500/30 rounded-xl flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
        <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Tipo de Luz:
        </span>
        <div className="flex items-center gap-1.5">
          {presets.map((preset) => {
            const IconComponent = preset.icon;
            const isSelected = selectedLightPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectLightPreset(preset.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-500/20'
                    : 'bg-[#141a26] text-slate-300 hover:bg-[#1c2638] border-[#222c3d]'
                }`}
              >
                <IconComponent 
                  className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : ''}`} 
                  style={{ color: isSelected ? undefined : preset.color }} 
                />
                <span className="truncate">{preset.label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2 hidden lg:inline italic">
          Clique no mapa para posicionar ou remover.
        </span>
      </div>
    );
  }

  // 4. Token Drawer / Sub-bar
  if (selectedTool === 'token') {
    return (
      <div className="absolute top-2.5 left-16 z-30 px-4 py-3 bg-[#0d121a]/95 backdrop-blur-md border border-[#222c3d] rounded-2xl flex flex-col gap-2.5 shadow-2xl w-[440px] max-w-[85vw] animate-in fade-in slide-in-from-top-1 duration-150">
        <div className="flex items-center justify-between gap-2 border-b border-[#222c3d] pb-2">
          <span className="text-[10px] uppercase font-bold text-cyan-400">Tokens da Sessão:</span>
          <div className="flex bg-[#070a0f] p-0.5 rounded-lg border border-[#222c3d]">
            {(['party', 'monsters', 'npcs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  onSelectTokenCategoryTab(tab);
                  onTokenSearchQueryChange('');
                }}
                className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold transition-all cursor-pointer ${
                  tokenCategoryTab === tab
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'party' ? 'Jogadores' : tab === 'monsters' ? 'Monstros' : 'NPCs'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={tokenSearchQuery}
            onChange={(e) => onTokenSearchQueryChange(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full bg-[#080b10] border border-[#222c3d] rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredTokens.length === 0 ? (
            <div className="col-span-3 text-[10px] text-slate-500 text-center py-3">Nenhum token encontrado.</div>
          ) : (
            filteredTokens.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectTokenCombatant(c)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold truncate transition-all cursor-pointer border flex flex-col items-center justify-center text-center ${
                  selectedTokenCombatant?.id === c.id
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-[#141a26] text-slate-300 border-[#222c3d] hover:bg-[#1c2638]'
                }`}
              >
                <span className="truncate max-w-full text-[11px] font-bold">{c.name}</span>
                <span className="text-[8px] uppercase tracking-wider opacity-60">
                  {c.type === 'player' ? 'Player' : c.type === 'monster' ? 'Monster' : 'NPC'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // 5. Calibrate tool sub-bar
  if (selectedTool === 'calibrate') {
    return (
      <div className="absolute top-2.5 left-16 z-30 px-4 py-2 bg-rose-950/90 backdrop-blur-md border border-rose-500/40 rounded-xl flex flex-wrap items-center gap-3 text-xs text-rose-200 font-mono shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
        <span className="font-bold text-rose-300">📏 Calibração de Fundo:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span>Célula: {gridScale}px</span>
            <input 
              type="range" 
              min="15" 
              max="100" 
              value={gridScale} 
              onChange={(e) => onGridScaleChange(parseInt(e.target.value))} 
              className="w-20 accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>X: {gridOffsetX}px</span>
            <input 
              type="range" 
              min="-100" 
              max="100" 
              value={gridOffsetX} 
              onChange={(e) => onGridOffsetXChange(parseInt(e.target.value))} 
              className="w-16 accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>Y: {gridOffsetY}px</span>
            <input 
              type="range" 
              min="-100" 
              max="100" 
              value={gridOffsetY} 
              onChange={(e) => onGridOffsetYChange(parseInt(e.target.value))} 
              className="w-16 accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <button 
            onClick={onResetCalibration}
            className="px-2 py-0.5 bg-rose-900 hover:bg-rose-800 border border-rose-700 text-rose-200 rounded text-[10px] font-bold cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  return null;
};
