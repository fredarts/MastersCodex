'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, MapPin, Ruler, Hand, Map } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { DysonCanvas } from '@/components/map/DysonCanvas';
import { Cell } from '../MapMaker';

interface MultiMapState {
  maps: Record<string, {
    grid: Cell[][];
    bgImageUrl: string | null;
    gridScale: number;
    gridOffsetX: number;
    gridOffsetY: number;
  }>;
  activeMapId: string | null;
}

export const CockpitDungeonMap: React.FC = () => {
  const { activeScene, fetchSceneMap, saveSceneMap, campaignMaps } = useSession();
  const { combatants, broadcastToPlayerView } = useLiveCockpit();

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [gridScale, setGridScale] = useState<number>(40);
  const [gridOffsetX, setGridOffsetX] = useState<number>(0);
  const [gridOffsetY, setGridOffsetY] = useState<number>(0);

  const [selectedTool, setSelectedTool] = useState<'pan' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure'>('token');
  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const multiMapStateRef = useRef<MultiMapState>({ maps: {}, activeMapId: null });

  // Helper to create empty grid if no template
  const createInitialGrid = (cols = 80, rows = 80): Cell[][] => {
    const arr: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ x: c, y: r, type: 'wall', fog: true });
      }
      arr.push(row);
    }
    return arr;
  };

  const loadMapFromMultiState = useCallback((multiState: MultiMapState, mapId: string | null) => {
    if (!mapId) {
      const bGrid = createInitialGrid();
      setGrid(bGrid);
      setBgImageUrl(null);
      setGridScale(40);
      setGridOffsetX(0);
      setGridOffsetY(0);
      return;
    }

    const savedMap = multiState.maps[mapId];
    if (savedMap) {
      setGrid(savedMap.grid || []);
      setBgImageUrl(savedMap.bgImageUrl || null);
      setGridScale(savedMap.gridScale || 40);
      setGridOffsetX(savedMap.gridOffsetX || 0);
      setGridOffsetY(savedMap.gridOffsetY || 0);
    } else {
      // Clone from campaignMaps template
      const associatedMap = campaignMaps.find(m => m.id === mapId);
      if (associatedMap && associatedMap.gridData) {
        const tGrid = associatedMap.gridData.grid || createInitialGrid();
        setGrid(tGrid);
        setBgImageUrl(associatedMap.gridData.bgImageUrl || null);
        setGridScale(associatedMap.gridData.gridScale || 40);
        setGridOffsetX(associatedMap.gridData.gridOffsetX || 0);
        setGridOffsetY(associatedMap.gridData.gridOffsetY || 0);

        multiState.maps[mapId] = {
          grid: tGrid,
          bgImageUrl: associatedMap.gridData.bgImageUrl || null,
          gridScale: associatedMap.gridData.gridScale || 40,
          gridOffsetX: associatedMap.gridData.gridOffsetX || 0,
          gridOffsetY: associatedMap.gridData.gridOffsetY || 0,
        };
      } else {
        const bGrid = createInitialGrid();
        setGrid(bGrid);
        setBgImageUrl(null);
        setGridScale(40);
        setGridOffsetX(0);
        setGridOffsetY(0);

        multiState.maps[mapId] = {
          grid: bGrid,
          bgImageUrl: null,
          gridScale: 40,
          gridOffsetX: 0,
          gridOffsetY: 0,
        };
      }
    }
  }, [campaignMaps]);

  // Ref for deduplicating broadcasts
  const lastBroadcast = useRef<string>('');

  // Load or initialize scene map
  useEffect(() => {
    if (!activeScene) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    fetchSceneMap(activeScene.id).then((savedData) => {
      let multiState: MultiMapState | null = null;
      if (savedData) {
        if (savedData.maps) {
          multiState = savedData;
        } else if (savedData.grid) {
          // Upgrade legacy single map format
          const legacyId = activeScene.associatedMapId || 'legacy';
          multiState = {
            maps: {
              [legacyId]: savedData
            },
            activeMapId: legacyId
          };
        }
      }

      if (!multiState) {
        multiState = {
          maps: {},
          activeMapId: null
        };
      }

      multiMapStateRef.current = multiState;

      // Determine active map ID from scene's associated maps
      const associatedIds = activeScene.associatedMapIds || (activeScene.associatedMapId ? [activeScene.associatedMapId] : []);
      let activeId = multiState.activeMapId;
      if (!activeId || !associatedIds.includes(activeId)) {
        activeId = associatedIds[0] || null;
      }

      setCurrentMapId(activeId);
      loadMapFromMultiState(multiState, activeId);
      setIsLoading(false);

      // Broadcast immediately so the player view receives the map on first load
      if (activeId && multiState.maps[activeId]) {
        const m = multiState.maps[activeId];
        const payload = {
          grid: m.grid,
          bgImageUrl: m.bgImageUrl,
          gridScale: m.gridScale,
          gridOffsetX: m.gridOffsetX,
          gridOffsetY: m.gridOffsetY,
          activeMapId: activeId,
        };
        lastBroadcast.current = JSON.stringify(payload);
        broadcastToPlayerView({ mapData: payload });
      }
    });
  }, [activeScene, fetchSceneMap, loadMapFromMultiState, broadcastToPlayerView]);

  // Debounced auto-save & Realtime Broadcast to Players
  useEffect(() => {
    if (!activeScene || isLoading) return;

    const delayDebounce = setTimeout(() => {
      if (!currentMapId) return;

      if (multiMapStateRef.current) {
        multiMapStateRef.current.maps[currentMapId] = {
          grid,
          bgImageUrl,
          gridScale,
          gridOffsetX,
          gridOffsetY,
        };
        multiMapStateRef.current.activeMapId = currentMapId;
      }

      const mapPayload = {
        grid,
        bgImageUrl,
        gridScale,
        gridOffsetX,
        gridOffsetY,
        activeMapId: currentMapId,
      };

      saveSceneMap(activeScene.id, multiMapStateRef.current).catch((e) => {
        console.error('Failed to auto-save scene map:', e);
      });

      const stringified = JSON.stringify(mapPayload);
      if (lastBroadcast.current !== stringified) {
        lastBroadcast.current = stringified;
        broadcastToPlayerView({
          mapData: mapPayload
        });
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [grid, bgImageUrl, gridScale, gridOffsetX, gridOffsetY, activeScene, isLoading, currentMapId, saveSceneMap, broadcastToPlayerView]);

  const handleSwitchMap = (newMapId: string) => {
    if (!currentMapId || !multiMapStateRef.current) return;

    // 1. Save current memory state to currentMapId index
    multiMapStateRef.current.maps[currentMapId] = {
      grid,
      bgImageUrl,
      gridScale,
      gridOffsetX,
      gridOffsetY
    };
    multiMapStateRef.current.activeMapId = newMapId;

    // 2. Change current map ID
    setCurrentMapId(newMapId);

    // 3. Load the new map properties
    loadMapFromMultiState(multiMapStateRef.current, newMapId);

    // 4. Broadcast immediately so player view updates
    const switchedMap = multiMapStateRef.current.maps[newMapId];
    if (switchedMap) {
      const payload = {
        grid: switchedMap.grid,
        bgImageUrl: switchedMap.bgImageUrl,
        gridScale: switchedMap.gridScale,
        gridOffsetX: switchedMap.gridOffsetX,
        gridOffsetY: switchedMap.gridOffsetY,
        activeMapId: newMapId,
      };
      lastBroadcast.current = JSON.stringify(payload);
      broadcastToPlayerView({ mapData: payload });
    }
  };

  const associatedMapIds = activeScene?.associatedMapIds || (activeScene?.associatedMapId ? [activeScene.associatedMapId] : []);
  const associatedMaps = campaignMaps.filter(m => associatedMapIds.includes(m.id));

  if (isLoading || !activeScene) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0d14]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Carregando mapa tático...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col bg-[#0a0d14]">
      {/* Map Selector Dropdown */}
      {associatedMaps.length > 0 && (
        <div className="absolute top-4 left-4 z-30 px-3.5 py-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-2 shadow-2xl">
          <Map className="w-4 h-4 text-emerald-400" />
          <select
            value={currentMapId || ''}
            onChange={(e) => handleSwitchMap(e.target.value)}
            className="bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-2 py-1 text-xs text-slate-200 focus:outline-none"
          >
            {associatedMaps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title || 'Sem título'}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center gap-1 shadow-2xl">
        <button
          onClick={() => setSelectedTool('token')}
          className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedTool === 'token' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Mover Tokens e Personagens"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Token</span>
        </button>
        <button
          onClick={() => setSelectedTool('fog-reveal')}
          className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedTool === 'fog-reveal' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Revelar Névoa"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Revelar</span>
        </button>
        <button
          onClick={() => setSelectedTool('fog-cover')}
          className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedTool === 'fog-cover' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Cobrir Névoa"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cobrir</span>
        </button>
        <button
          onClick={() => {
            setSelectedTool('measure');
            setMeasureStart(null);
            setMeasuredDistance(null);
          }}
          className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedTool === 'measure' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Medir Régua"
        >
          <Ruler className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Régua</span>
        </button>
        <button
          onClick={() => setSelectedTool('pan')}
          className={`p-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            selectedTool === 'pan' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Arrastar Mapa"
        >
          <Hand className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mover</span>
        </button>
      </div>

      {/* Renders measure details if selected */}
      {selectedTool === 'measure' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-cyan-950/90 backdrop-blur-md border border-cyan-500/30 rounded-xl text-[11px] text-cyan-200 font-mono shadow-md flex items-center gap-2">
          <span>
            {measureStart
              ? `Origem (${measureStart.r}, ${measureStart.c}). Clique no destino.`
              : 'Selecione dois quadrados.'}
          </span>
          {measuredDistance && (
            <span className="font-bold bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded">
              {measuredDistance.feet}ft ({measuredDistance.meters}m)
            </span>
          )}
        </div>
      )}

      {/* Main DysonCanvas inside Aspect Box */}
      <DysonCanvas
        key={`${activeScene.id}_${currentMapId}`}
        grid={grid}
        bgImageUrl={bgImageUrl}
        gridScale={gridScale}
        gridOffsetX={gridOffsetX}
        gridOffsetY={gridOffsetY}
        combatants={combatants}
        selectedTool={selectedTool}
        selectedTileType="floor" // Not painting terrains in cockpit
        selectedTokenCombatant={null}
        measureStart={measureStart}
        setMeasureStart={setMeasureStart}
        setMeasuredDistance={setMeasuredDistance}
        onGridChange={setGrid}
      />
    </div>
  );
};
