'use client';

import React, { useState, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  Paintbrush, 
  MapPin, 
  Upload,
  Ruler,
  Download,
  Trash2,
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
  fog: boolean;
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
    grid[0][Math.floor(GRID_SIZE / 2)].type = 'door';
    return grid;
  };

  const [grid, setGrid] = useState<Cell[][]>(createInitialGrid);
  const [selectedTool, setSelectedTool] = useState<'paint' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure'>('fog-reveal');
  const [selectedTileType, setSelectedTileType] = useState<TileType>('floor');
  const [selectedTokenCombatant, setSelectedTokenCombatant] = useState<Combatant | null>(null);
  
  // Custom Map Image Upload state
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Measure Ruler State
  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBgImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (selectedTool === 'measure') {
      if (!measureStart) {
        setMeasureStart({ r, c });
        setMeasuredDistance(null);
      } else {
        const deltaR = Math.abs(r - measureStart.r);
        const deltaC = Math.abs(c - measureStart.c);
        // Diagonal / Chebyshev grid distance (D&D 5e rule: max delta or 5ft per grid)
        const gridSteps = Math.max(deltaR, deltaC);
        const feet = gridSteps * 5;
        const meters = parseFloat((feet * 0.3).toFixed(1));
        setMeasuredDistance({ feet, meters });
        setMeasureStart(null);
      }
      return;
    }

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

  const clearMapBg = () => {
    setBgImageUrl(null);
  };

  const exportMapAsImage = () => {
    // Basic screenshot export notification
    alert('🎨 Mapa pronto para exportação! Utilize a tecla PrintScreen ou a captura nativa do navegador para salvar o grid em alta resolução.');
  };

  const getTileBg = (type: TileType) => {
    if (bgImageUrl) return 'bg-transparent border-[#ffffff15]';
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
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Map Maker Toolbar */}
      <div className="p-3.5 bg-[#0f141d] border-b border-[#2a3449] flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Tool Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold mr-1">Ferramentas:</span>
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
            Pintar Terreno
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
            Token
          </button>
          <button
            onClick={() => {
              setSelectedTool('measure');
              setMeasureStart(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTool === 'measure'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'bg-[#161c28] text-slate-300 hover:bg-[#1f2738] border border-[#2a3449]'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Medir Régua
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-lg font-bold transition-all"
            title="Upload de Imagem Customizada de Mapa"
          >
            <Upload className="w-3.5 h-3.5" />
            Carregar Mapa (JPG/PNG)
          </button>
          {bgImageUrl && (
            <button
              onClick={clearMapBg}
              className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg border border-rose-900/40"
              title="Remover Imagem de Fundo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              try {
                localStorage.setItem('codex_custom_map', JSON.stringify(grid));
                alert('Mapa tático salvo com sucesso!');
              } catch (e) {
                console.error(e);
              }
            }}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Salvar Mapa
          </button>
          <button
            onClick={revealAllFog}
            className="text-xs bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] px-2.5 py-1.5 rounded-lg font-medium"
          >
            Revelar Névoa
          </button>
          <button
            onClick={coverAllFog}
            className="text-xs bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] px-2.5 py-1.5 rounded-lg font-medium"
          >
            Cobrir Névoa
          </button>
        </div>
      </div>

      {/* Sub-bar options */}
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

      {selectedTool === 'measure' && (
        <div className="px-4 py-2 bg-cyan-950/80 border-b border-cyan-500/40 flex items-center justify-between text-xs text-cyan-200 font-mono">
          <span>
            {measureStart
              ? `🎯 Ponto Inicial Selecionado (${measureStart.r}, ${measureStart.c}). Clique no segundo quadrado para medir.`
              : '📏 Clique em dois quadrados para medir a distância em pés/metros.'}
          </span>
          {measuredDistance && (
            <span className="font-bold bg-cyan-500 text-slate-950 px-2 py-0.5 rounded shadow">
              Distância: {measuredDistance.feet}ft ({measuredDistance.meters}m)
            </span>
          )}
        </div>
      )}

      {/* Main Canvas Grid Render */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-tactical-grid relative">
        <div
          className="grid gap-1 p-4 bg-[#0f141d] border-2 border-[#2a3449] rounded-2xl shadow-2xl relative"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {grid.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isStartMeasure = measureStart?.r === rIdx && measureStart?.c === cIdx;
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-lg border relative cursor-pointer flex items-center justify-center transition-all hover:scale-105 ${getTileBg(
                    cell.type
                  )} ${isStartMeasure ? 'ring-2 ring-cyan-400 animate-pulse' : ''}`}
                >
                  {/* Tile indicator icons */}
                  {!bgImageUrl && cell.type === 'door' && <span className="text-xs font-bold text-amber-400">🚪</span>}
                  {!bgImageUrl && cell.type === 'trap' && <span className="text-xs font-bold text-rose-400">⚠️</span>}

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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
