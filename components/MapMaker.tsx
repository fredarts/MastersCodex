'use client';

import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Paintbrush, 
  Maximize2, 
  RotateCcw, 
  MapPin, 
  Layers, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Combatant } from '@/lib/types';

interface MapMakerProps {
  combatants: Combatant[];
}

type TileType = 'floor' | 'wall' | 'grass' | 'water' | 'door' | 'trap';

interface Cell {
  x: number;
  y: number;
  type: TileType;
  fog: boolean; // true = obscured by fog of war
  tokenName?: string;
  tokenColor?: string;
}

const GRID_SIZE = 12;

export const MapMaker: React.FC<MapMakerProps> = ({ combatants }) => {
  const createInitialGrid = (): Cell[][] => {
    const grid: Cell[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        // Outer walls by default
        const isBoundary = r === 0 || r === GRID_SIZE - 1 || c === 0 || c === GRID_SIZE - 1;
        row.push({
          x: c,
          y: r,
          type: isBoundary ? 'wall' : 'floor',
          fog: true,
        });
      }
      grid.push(row);
    }
    // Default door
    grid[0][Math.floor(GRID_SIZE / 2)].type = 'door';
    return grid;
  };

  const [grid, setGrid] = useState<Cell[][]>(createInitialGrid);
  const [selectedTool, setSelectedTool] = useState<'paint' | 'fog-reveal' | 'fog-cover' | 'token'>('fog-reveal');
  const [selectedTileType, setSelectedTileType] = useState<TileType>('floor');
  const [selectedTokenCombatant, setSelectedTokenCombatant] = useState<Combatant | null>(null);

  const handleCellClick = (r: number, c: number) => {
    setGrid((prev) => {
      const copy = prev.map((row) => row.map((cell) => ({ ...cell })));
      const cell = copy[r][c];

      if (selectedTool === 'fog-reveal') {
        cell.fog = false;
      } else if (selectedTool === 'fog-cover') {
        cell.fog = true;
      } else if (selectedTool === 'paint') {
        cell.type = selectedTileType;
      } else if (selectedTool === 'token' && selectedTokenCombatant) {
        cell.tokenName = selectedTokenCombatant.name.slice(0, 3).toUpperCase();
        cell.tokenColor = selectedTokenCombatant.type === 'player' ? 'bg-cyan-500' : 'bg-rose-600';
      }
      return copy;
    });
  };

  const revealAllFog = () => {
    setGrid((prev) => prev.map((row) => row.map((cell) => ({ ...cell, fog: false }))));
  };

  const coverAllFog = () => {
    setGrid((prev) => prev.map((row) => row.map((cell) => ({ ...cell, fog: true }))));
  };

  const getTileBg = (type: TileType) => {
    switch (type) {
      case 'wall':
        return 'bg-slate-900 border-slate-950';
      case 'grass':
        return 'bg-emerald-950/80 border-emerald-900/50';
      case 'water':
        return 'bg-cyan-950/80 border-cyan-900/50';
      case 'door':
        return 'bg-amber-950/90 border-amber-800';
      case 'trap':
        return 'bg-rose-950/80 border-rose-900';
      default:
        return 'bg-[#182030] border-[#253248]';
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden">
      {/* Map Maker Toolbar */}
      <div className="p-4 bg-[#0f141d] border-b border-[#2a3449] flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Tool Selectors */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1">Ferramenta:</span>
          <button
            onClick={() => setSelectedTool('fog-reveal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'fog-reveal'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#161c28] text-slate-300 hover:bg-[#1f2738] border border-[#2a3449]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Revelar Névoa
          </button>
          <button
            onClick={() => setSelectedTool('fog-cover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'fog-cover'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#161c28] text-slate-300 hover:bg-[#1f2738] border border-[#2a3449]'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            Cobrir Névoa
          </button>
          <button
            onClick={() => setSelectedTool('paint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'paint'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#161c28] text-slate-300 hover:bg-[#1f2738] border border-[#2a3449]'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            Pintar Tile
          </button>
          <button
            onClick={() => setSelectedTool('token')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'token'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#161c28] text-slate-300 hover:bg-[#1f2738] border border-[#2a3449]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Posicionar Token
          </button>
        </div>

        {/* Global Fog Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={revealAllFog}
            className="text-xs bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] px-3 py-1.5 rounded-lg font-medium"
          >
            Revelar Tudo
          </button>
          <button
            onClick={coverAllFog}
            className="text-xs bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] px-3 py-1.5 rounded-lg font-medium"
          >
            Cobrir Tudo
          </button>
        </div>
      </div>

      {/* Sub-bar options for Paint or Token placement */}
      {selectedTool === 'paint' && (
        <div className="px-4 py-2 bg-[#121824] border-b border-[#2a3449] flex items-center gap-2">
          <span className="text-xs text-slate-400">Tipo de Terreno:</span>
          {(['floor', 'wall', 'grass', 'water', 'door', 'trap'] as TileType[]).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTileType(t)}
              className={`px-2.5 py-1 rounded text-xs capitalize font-semibold transition-all ${
                selectedTileType === t
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#161c28] text-slate-300 border border-[#2a3449]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {selectedTool === 'token' && (
        <div className="px-4 py-2 bg-[#121824] border-b border-[#2a3449] flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 flex-shrink-0">Selecione o Token:</span>
          {combatants.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedTokenCombatant(c)}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex-shrink-0 transition-all ${
                selectedTokenCombatant?.id === c.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-[#161c28] text-slate-300 border border-[#2a3449]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Canvas Grid Render */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-tactical-grid">
        <div
          className="grid gap-1 p-4 bg-[#0f141d] border-2 border-[#2a3449] rounded-2xl shadow-2xl"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                onClick={() => handleCellClick(rIdx, cIdx)}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-lg border relative cursor-pointer flex items-center justify-center transition-all hover:scale-105 ${getTileBg(
                  cell.type
                )}`}
              >
                {/* Tile indicator icons */}
                {cell.type === 'door' && <span className="text-xs font-bold text-amber-400">🚪</span>}
                {cell.type === 'trap' && <span className="text-xs font-bold text-rose-400">⚠️</span>}

                {/* Token Badge */}
                {cell.tokenName && (
                  <div
                    className={`w-8 h-8 rounded-full ${
                      cell.tokenColor || 'bg-amber-500'
                    } text-slate-950 font-extrabold text-[10px] font-mono flex items-center justify-center shadow-lg border-2 border-slate-950 animate-pulse`}
                  >
                    {cell.tokenName}
                  </div>
                )}

                {/* Fog of War Mask */}
                {cell.fog && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px] rounded-lg flex items-center justify-center border border-slate-900">
                    <EyeOff className="w-4 h-4 text-slate-700 opacity-60" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
