'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, MapPin, Ruler, Hand, Map, Cloud, RefreshCw, Layers, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { DysonCanvas } from '@/components/map/DysonCanvas';
import { revealVisionWithLOS, getTokenVisionRadius } from '@/components/map/visionCore';
import { normalizeToMultiLevel } from '@/lib/map/mapLevelsCore';
import { MapLevel } from '@/lib/types';
import { Cell } from '../MapMaker';
import { toast } from 'sonner';

interface LevelRuntimeState {
  grid: Cell[][];
  bgImageUrl: string | null;
  gridScale: number;
  gridOffsetX: number;
  gridOffsetY: number;
  vectorWalls?: import('@/lib/types').WallSegment[];
  lightSources?: import('@/lib/types').LightSource[];
  name?: string;
  order?: number;
  lastSyncedTemplateUpdate?: string;
}

interface MultiMapState {
  maps: Record<string, {
    activeLevelId?: string;
    levels?: Record<string, LevelRuntimeState>;
    // Legacy fallback fields for backward compatibility
    grid?: Cell[][];
    bgImageUrl?: string | null;
    gridScale?: number;
    gridOffsetX?: number;
    gridOffsetY?: number;
    vectorWalls?: import('@/lib/types').WallSegment[];
    lightSources?: import('@/lib/types').LightSource[];
    lastSyncedTemplateUpdate?: string;
  }>;
  activeMapId?: string | null;
}

export const CockpitDungeonMap: React.FC = () => {
  const { activeScene, fetchSceneMap, saveSceneMap, campaignMaps } = useSession();
  const { combatants, broadcastToPlayerView, drawings, broadcastDrawingAction } = useLiveCockpit();

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [gridScale, setGridScale] = useState<number>(40);
  const [gridOffsetX, setGridOffsetX] = useState<number>(0);
  const [gridOffsetY, setGridOffsetY] = useState<number>(0);
  const [vectorWalls, setVectorWalls] = useState<import('@/lib/types').WallSegment[]>([]);
  const [lightSources, setLightSources] = useState<import('@/lib/types').LightSource[]>([]);

  const [selectedTool, setSelectedTool] = useState<'pan' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text'>('token');
  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [activeLevels, setActiveLevels] = useState<MapLevel[]>([]);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const multiMapStateRef = useRef<MultiMapState>({ maps: {}, activeMapId: null });

  // Collapsible HUD states
  const [isMapSelectorCollapsed, setIsMapSelectorCollapsed] = useState(false);
  const [isToolsBarCollapsed, setIsToolsBarCollapsed] = useState(false);
  const [isDrawingToolsCollapsed, setIsDrawingToolsCollapsed] = useState(false);

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

  const loadMapFromMultiState = useCallback((multiState: MultiMapState, mapId: string | null, targetLevelId?: string | null) => {
    if (!mapId) {
      const bGrid = createInitialGrid();
      setGrid(bGrid);
      setBgImageUrl(null);
      setGridScale(40);
      setGridOffsetX(0);
      setGridOffsetY(0);
      setVectorWalls([]);
      setLightSources([]);
      setActiveLevels([]);
      setActiveLevelId(null);
      return;
    }

    const associatedMap = campaignMaps.find(m => m.id === mapId);
    if (!associatedMap) return;

    // Normalize template map into multi-level structure
    const normalizedTemplate = normalizeToMultiLevel(associatedMap.gridData, associatedMap.title);
    const templateLevels: MapLevel[] = normalizedTemplate.levels || [];
    setActiveLevels(templateLevels);

    // Initialize savedMap container if missing
    if (!multiState.maps[mapId]) {
      multiState.maps[mapId] = {
        activeLevelId: normalizedTemplate.activeLevelId,
        levels: {}
      };
    }
    const savedMap = multiState.maps[mapId];
    if (!savedMap.levels) {
      savedMap.levels = {};
      if (savedMap.grid) {
        // Migrate legacy single level map
        const firstLvlId = templateLevels[0]?.id || 'lvl-0';
        savedMap.levels[firstLvlId] = {
          grid: savedMap.grid,
          bgImageUrl: savedMap.bgImageUrl || null,
          gridScale: savedMap.gridScale || 40,
          gridOffsetX: savedMap.gridOffsetX || 0,
          gridOffsetY: savedMap.gridOffsetY || 0,
          vectorWalls: savedMap.vectorWalls || [],
          lightSources: savedMap.lightSources || [],
        };
      }
    }

    // Determine target level ID
    const selectedLevelId = targetLevelId || savedMap.activeLevelId || normalizedTemplate.activeLevelId || templateLevels[0]?.id;
    savedMap.activeLevelId = selectedLevelId;
    setActiveLevelId(selectedLevelId);

    // For each template level, ensure runtime state exists and is properly merged
    for (const tLevel of templateLevels) {
      const existingRuntime = savedMap.levels[tLevel.id];
      const isOutdated = existingRuntime && associatedMap.updatedAt && existingRuntime.lastSyncedTemplateUpdate && existingRuntime.lastSyncedTemplateUpdate !== associatedMap.updatedAt;
      const isSizeMismatch = existingRuntime && tLevel.grid && (tLevel.grid.length !== existingRuntime.grid?.length || (tLevel.grid[0] && existingRuntime.grid?.[0] && tLevel.grid[0].length !== existingRuntime.grid[0].length));

      if (existingRuntime && !isOutdated && !isSizeMismatch) {
        // Merge: Update terrain/layout from the campaignMap template while preserving runtime fog and active tokens
        const tGrid = tLevel.grid || createInitialGrid();
        const sGrid = existingRuntime.grid || [];

        const mergedGrid: Cell[][] = tGrid.map((row: Cell[], r: number) =>
          row.map((cell: Cell, c: number) => {
            const sCell = sGrid[r]?.[c];
            return {
              ...cell,
              fog: sCell !== undefined ? sCell.fog : true,
              tokenName: (sCell && sCell.tokenName) ? sCell.tokenName : cell.tokenName,
              tokenColor: (sCell && sCell.tokenName) ? sCell.tokenColor : cell.tokenColor,
            };
          })
        );

        // Deduplicate tokens by name
        const seenTokens = new Set<string>();
        for (let r = 0; r < mergedGrid.length; r++) {
          for (let c = 0; c < mergedGrid[r].length; c++) {
            const tName = mergedGrid[r][c].tokenName;
            if (tName) {
              const key = tName.trim().toUpperCase();
              if (seenTokens.has(key)) {
                mergedGrid[r][c].tokenName = undefined;
                mergedGrid[r][c].tokenColor = undefined;
              } else {
                seenTokens.add(key);
              }
            }
          }
        }

        // Ensure active player combatants have tokens on the primary ground floor if not placed anywhere
        if (combatants && combatants.length > 0 && (tLevel.order === 0 || templateLevels.indexOf(tLevel) === 0)) {
          const playerCombatants = combatants.filter((comb) => comb.type === 'player');
          for (const player of playerCombatants) {
            const playerKey = player.name.trim().toUpperCase();
            if (!seenTokens.has(playerKey)) {
              let placed = false;
              for (let r = 0; r < mergedGrid.length; r++) {
                for (let c = 0; c < mergedGrid[r].length; c++) {
                  if (mergedGrid[r][c].type !== 'wall' && !mergedGrid[r][c].tokenName) {
                    mergedGrid[r][c].tokenName = player.name;
                    mergedGrid[r][c].tokenColor = '#38bdf8';
                    seenTokens.add(playerKey);
                    placed = true;
                    break;
                  }
                }
                if (placed) break;
              }
            }
          }
        }

        // Re-apply LOS for active tokens to ensure no walls are breached
        for (let r = 0; r < mergedGrid.length; r++) {
          for (let c = 0; c < mergedGrid[r].length; c++) {
            if (mergedGrid[r][c].tokenName) {
              const radius = getTokenVisionRadius(mergedGrid[r][c].tokenName, combatants);
              revealVisionWithLOS(mergedGrid, r, c, radius);
            }
          }
        }

        savedMap.levels[tLevel.id] = {
          grid: mergedGrid,
          bgImageUrl: tLevel.bgImageUrl ?? existingRuntime.bgImageUrl ?? null,
          gridScale: tLevel.gridScale ?? existingRuntime.gridScale ?? 40,
          gridOffsetX: tLevel.gridOffsetX ?? existingRuntime.gridOffsetX ?? 0,
          gridOffsetY: tLevel.gridOffsetY ?? existingRuntime.gridOffsetY ?? 0,
          vectorWalls: tLevel.vectorWalls ?? existingRuntime.vectorWalls ?? [],
          lightSources: tLevel.lightSources ?? existingRuntime.lightSources ?? [],
          name: tLevel.name,
          order: tLevel.order,
          lastSyncedTemplateUpdate: associatedMap.updatedAt || existingRuntime.lastSyncedTemplateUpdate,
        };
      } else {
        // Clone from campaignMaps template level
        const tGrid = tLevel.grid || createInitialGrid();
        const coveredGrid = tGrid.map((row: Cell[]) =>
          row.map((cell: Cell) => ({
            ...cell,
            fog: true
          }))
        );

        for (let r = 0; r < coveredGrid.length; r++) {
          for (let c = 0; c < coveredGrid[r].length; c++) {
            if (tGrid[r]?.[c]?.tokenName) {
              coveredGrid[r][c].tokenName = tGrid[r][c].tokenName;
              coveredGrid[r][c].tokenColor = tGrid[r][c].tokenColor;
              const radius = getTokenVisionRadius(tGrid[r][c].tokenName, combatants);
              revealVisionWithLOS(coveredGrid, r, c, radius);
            }
          }
        }

        savedMap.levels[tLevel.id] = {
          grid: coveredGrid,
          bgImageUrl: tLevel.bgImageUrl || null,
          gridScale: tLevel.gridScale || 40,
          gridOffsetX: tLevel.gridOffsetX || 0,
          gridOffsetY: tLevel.gridOffsetY || 0,
          vectorWalls: tLevel.vectorWalls || [],
          lightSources: tLevel.lightSources || [],
          name: tLevel.name,
          order: tLevel.order,
          lastSyncedTemplateUpdate: associatedMap.updatedAt,
        };
      }
    }

    // Load active level into React state
    const activeLevelState = savedMap.levels[selectedLevelId] || Object.values(savedMap.levels)[0];
    if (activeLevelState) {
      setGrid(activeLevelState.grid);
      setBgImageUrl(activeLevelState.bgImageUrl || null);
      setGridScale(activeLevelState.gridScale || 40);
      setGridOffsetX(activeLevelState.gridOffsetX || 0);
      setGridOffsetY(activeLevelState.gridOffsetY || 0);
      setVectorWalls(activeLevelState.vectorWalls || []);
      setLightSources(activeLevelState.lightSources || []);
    }
  }, [campaignMaps, combatants]);

  // Ref for deduplicating broadcasts
  const lastBroadcast = useRef<string>('');

  // Load or initialize scene map
  useEffect(() => {
    if (!activeScene) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    fetchSceneMap(activeScene.id).then((savedData: any) => {
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

      // Determine active map ID from scene's associated maps (only existing campaignMaps)
      const associatedIds: string[] = (activeScene.associatedMapIds || (activeScene.associatedMapId ? [activeScene.associatedMapId] : []))
        .filter((id: string) => campaignMaps.some(m => m.id === id));
      let activeId: string | null = multiState.activeMapId || null;
      if (!activeId || !associatedIds.includes(activeId)) {
        activeId = associatedIds[0] || null;
        multiState.activeMapId = activeId;
      }

      setCurrentMapId(activeId);
      loadMapFromMultiState(multiState, activeId);
      setIsLoading(false);

      // Broadcast immediately so the player view receives the map on first load
      if (activeId && multiState.maps[activeId]) {
        const m = multiState.maps[activeId];
        const lvlId = m.activeLevelId;
        const currentLvlState: LevelRuntimeState | undefined = (lvlId && m.levels ? m.levels[lvlId] : undefined) || (m.levels ? Object.values(m.levels)[0] : undefined);
        const payload = {
          grid: currentLvlState?.grid || m.grid || [],
          bgImageUrl: currentLvlState?.bgImageUrl ?? m.bgImageUrl ?? null,
          gridScale: currentLvlState?.gridScale ?? m.gridScale ?? 40,
          gridOffsetX: currentLvlState?.gridOffsetX ?? m.gridOffsetX ?? 0,
          gridOffsetY: currentLvlState?.gridOffsetY ?? m.gridOffsetY ?? 0,
          vectorWalls: currentLvlState?.vectorWalls || m.vectorWalls || [],
          lightSources: currentLvlState?.lightSources || m.lightSources || [],
          activeMapId: activeId,
          activeLevelId: lvlId,
          currentLevelName: currentLvlState?.name || 'Andar',
          sceneId: activeScene.id,
        };
        lastBroadcast.current = JSON.stringify(payload);
        broadcastToPlayerView({ mapData: payload });
      }
    });
  }, [activeScene, fetchSceneMap, loadMapFromMultiState, broadcastToPlayerView]);

  // Synchronize with updated campaignMaps (e.g. when edited and saved in MapMaker)
  useEffect(() => {
    if (!currentMapId || !activeScene || isLoading || !multiMapStateRef.current) return;
    const associatedMap = campaignMaps.find(m => m.id === currentMapId);
    if (!associatedMap || !associatedMap.gridData) return;

    loadMapFromMultiState(multiMapStateRef.current, currentMapId, activeLevelId);
  }, [campaignMaps, currentMapId, activeLevelId, activeScene, isLoading, loadMapFromMultiState]);

  // Debounced auto-save & Realtime Broadcast to Players
  useEffect(() => {
    if (!activeScene || isLoading) return;

    const delayDebounce = setTimeout(() => {
      if (!currentMapId) return;

      if (multiMapStateRef.current) {
        if (!multiMapStateRef.current.maps[currentMapId]) {
          multiMapStateRef.current.maps[currentMapId] = { levels: {} };
        }
        if (!multiMapStateRef.current.maps[currentMapId].levels) {
          multiMapStateRef.current.maps[currentMapId].levels = {};
        }

        if (activeLevelId) {
          multiMapStateRef.current.maps[currentMapId].levels[activeLevelId] = {
            grid,
            bgImageUrl,
            gridScale,
            gridOffsetX,
            gridOffsetY,
            vectorWalls,
            lightSources,
            name: activeLevels.find(l => l.id === activeLevelId)?.name,
          };
          multiMapStateRef.current.maps[currentMapId].activeLevelId = activeLevelId;
        }

        // Fallback for legacy format
        multiMapStateRef.current.maps[currentMapId].grid = grid;
        multiMapStateRef.current.maps[currentMapId].bgImageUrl = bgImageUrl;
        multiMapStateRef.current.maps[currentMapId].gridScale = gridScale;
        multiMapStateRef.current.maps[currentMapId].gridOffsetX = gridOffsetX;
        multiMapStateRef.current.maps[currentMapId].gridOffsetY = gridOffsetY;
        multiMapStateRef.current.maps[currentMapId].vectorWalls = vectorWalls;
        multiMapStateRef.current.maps[currentMapId].lightSources = lightSources;
        multiMapStateRef.current.activeMapId = currentMapId;
      }

      let fogMatrix = '';
      const tokens: { name: string; color: string; r: number; c: number }[] = [];
      
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          fogMatrix += grid[r][c].fog ? '1' : '0';
          if (grid[r][c].tokenName) {
            tokens.push({
              name: grid[r][c].tokenName!,
              color: grid[r][c].tokenColor || 'bg-cyan-500',
              r,
              c
            });
          }
        }
      }

      const activeLevelName = activeLevels.find(l => l.id === activeLevelId)?.name;
      const mapPayload = {
        grid,
        bgImageUrl,
        gridScale,
        gridOffsetX,
        gridOffsetY,
        vectorWalls,
        lightSources,
        activeMapId: currentMapId,
        activeLevelId,
        currentLevelName: activeLevelName,
        sceneId: activeScene.id,
        fogMatrix,
        tokens,
      };

      saveSceneMap(activeScene.id, multiMapStateRef.current).catch((e: any) => {
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
  }, [grid, bgImageUrl, vectorWalls, lightSources, gridScale, gridOffsetX, gridOffsetY, activeScene, isLoading, currentMapId, activeLevelId, activeLevels, saveSceneMap, broadcastToPlayerView]);

  // Instant In-Memory Floor / Level Switcher (0ms Latency, zero database fetch)
  const handleSwitchLevel = (targetLevelId: string) => {
    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;
    if (targetLevelId === activeLevelId) return;

    // 1. Snapshot current active floor state into memory
    if (activeLevelId && multiMapStateRef.current.maps[currentMapId]?.levels) {
      multiMapStateRef.current.maps[currentMapId].levels[activeLevelId] = {
        grid,
        bgImageUrl,
        gridScale,
        gridOffsetX,
        gridOffsetY,
        vectorWalls,
        lightSources,
        name: activeLevels.find((l) => l.id === activeLevelId)?.name,
      };
      multiMapStateRef.current.maps[currentMapId].activeLevelId = targetLevelId;
    }

    // 2. Set active level ID
    setActiveLevelId(targetLevelId);

    // 3. Load target floor state from memory (or fallback to template level if missing)
    let targetState = multiMapStateRef.current.maps[currentMapId]?.levels?.[targetLevelId];
    if (!targetState) {
      const tLevel = activeLevels.find((l) => l.id === targetLevelId);
      if (tLevel) {
        const tGrid = tLevel.grid || createInitialGrid();
        const coveredGrid = tGrid.map((row: Cell[]) =>
          row.map((cell: Cell) => ({
            ...cell,
            fog: true,
          }))
        );
        targetState = {
          grid: coveredGrid,
          bgImageUrl: tLevel.bgImageUrl || null,
          gridScale: tLevel.gridScale || 40,
          gridOffsetX: tLevel.gridOffsetX || 0,
          gridOffsetY: tLevel.gridOffsetY || 0,
          vectorWalls: tLevel.vectorWalls || [],
          lightSources: tLevel.lightSources || [],
          name: tLevel.name,
          order: tLevel.order,
        };
        if (!multiMapStateRef.current.maps[currentMapId]) {
          multiMapStateRef.current.maps[currentMapId] = { levels: {} };
        }
        if (!multiMapStateRef.current.maps[currentMapId].levels) {
          multiMapStateRef.current.maps[currentMapId].levels = {};
        }
        multiMapStateRef.current.maps[currentMapId].levels[targetLevelId] = targetState;
      }
    }

    if (targetState) {
      setGrid(targetState.grid);
      setBgImageUrl(targetState.bgImageUrl || null);
      setGridScale(targetState.gridScale || 40);
      setGridOffsetX(targetState.gridOffsetX || 0);
      setGridOffsetY(targetState.gridOffsetY || 0);
      setVectorWalls(targetState.vectorWalls || []);
      setLightSources(targetState.lightSources || []);

      // 4. Instant broadcast to Player View
      const targetLevelObj = activeLevels.find((l) => l.id === targetLevelId);
      const payload = {
        grid: targetState.grid,
        bgImageUrl: targetState.bgImageUrl,
        gridScale: targetState.gridScale,
        gridOffsetX: targetState.gridOffsetX,
        gridOffsetY: targetState.gridOffsetY,
        vectorWalls: targetState.vectorWalls || [],
        lightSources: targetState.lightSources || [],
        activeMapId: currentMapId,
        activeLevelId: targetLevelId,
        currentLevelName: targetLevelObj?.name || 'Andar',
        sceneId: activeScene.id,
      };
      lastBroadcast.current = JSON.stringify(payload);
      broadcastToPlayerView({ mapData: payload });
    }
  };

  const handleSwitchMap = (newMapId: string) => {
    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;

    // 1. Save current memory state to currentMapId index
    if (activeLevelId && multiMapStateRef.current.maps[currentMapId]?.levels) {
      multiMapStateRef.current.maps[currentMapId].levels[activeLevelId] = {
        grid,
        bgImageUrl,
        gridScale,
        gridOffsetX,
        gridOffsetY,
        vectorWalls,
        lightSources,
        name: activeLevels.find(l => l.id === activeLevelId)?.name,
      };
    }
    multiMapStateRef.current.activeMapId = newMapId;

    // 2. Change current map ID
    setCurrentMapId(newMapId);

    // 3. Load the new map properties
    loadMapFromMultiState(multiMapStateRef.current, newMapId);

    // 4. Broadcast immediately so player view updates
    const switchedMap = multiMapStateRef.current.maps[newMapId];
    if (switchedMap) {
      const lvlId = switchedMap.activeLevelId;
      const currentLvlState: LevelRuntimeState | undefined = (lvlId && switchedMap.levels ? switchedMap.levels[lvlId] : undefined) || (switchedMap.levels ? Object.values(switchedMap.levels)[0] : undefined);
      const payload = {
        grid: currentLvlState?.grid || switchedMap.grid || [],
        bgImageUrl: currentLvlState?.bgImageUrl ?? switchedMap.bgImageUrl ?? null,
        gridScale: currentLvlState?.gridScale ?? switchedMap.gridScale ?? 40,
        gridOffsetX: currentLvlState?.gridOffsetX ?? switchedMap.gridOffsetX ?? 0,
        gridOffsetY: currentLvlState?.gridOffsetY ?? switchedMap.gridOffsetY ?? 0,
        vectorWalls: currentLvlState?.vectorWalls || switchedMap.vectorWalls || [],
        lightSources: currentLvlState?.lightSources || switchedMap.lightSources || [],
        activeMapId: newMapId,
        activeLevelId: lvlId,
        currentLevelName: currentLvlState?.name || 'Andar',
        sceneId: activeScene.id,
      };
      lastBroadcast.current = JSON.stringify(payload);
      broadcastToPlayerView({ mapData: payload });
    }
  };

  const handleCoverAllFog = () => {
    setGrid((prev) => {
      // 1. Cover all cells in fog
      const coveredGrid = prev.map((row) =>
        row.map((cell) => ({
          ...cell,
          fog: true,
        }))
      );

      // 2. Scan and reveal vision around cells that have tokens respecting LOS
      for (let r = 0; r < coveredGrid.length; r++) {
        for (let c = 0; c < coveredGrid[r].length; c++) {
          if (prev[r]?.[c]?.tokenName) {
            coveredGrid[r][c].tokenName = prev[r][c].tokenName;
            coveredGrid[r][c].tokenColor = prev[r][c].tokenColor;
            const radius = getTokenVisionRadius(prev[r][c].tokenName, combatants);
            revealVisionWithLOS(coveredGrid, r, c, radius);
          }
        }
      }

      toast.success('Todo o mapa foi coberto por névoa (visão dos pinos preservada com Line of Sight).');
      return coveredGrid;
    });
  };

  const handleReloadFromTemplate = () => {
    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;
    const associatedMap = campaignMaps.find(m => m.id === currentMapId);
    if (!associatedMap || !associatedMap.gridData) {
      toast.error('Modelo de mapa não encontrado.');
      return;
    }

    // Force delete saved state to trigger full reload
    delete multiMapStateRef.current.maps[currentMapId];
    loadMapFromMultiState(multiMapStateRef.current, currentMapId);
    toast.success('Mapa tático recarregado com sucesso a partir do modelo original!');
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
      {/* Top HUD Container - Responsive flex layout preventing any overlaps */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-start justify-between gap-3 pointer-events-none select-none">
        {/* Left Side: Single Floor Navigation Card */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap max-w-[60%]">
          {/* Floor / Level Selector - Single Unified Dropdown */}
          {activeLevels.length > 0 && (
            <div className="px-2.5 py-1.5 bg-slate-950/90 backdrop-blur-md border border-amber-500/40 rounded-2xl flex items-center gap-2 shadow-2xl animate-in fade-in shrink-0">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              
              {!isMapSelectorCollapsed ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline">Andar:</span>
                  <select
                    value={activeLevelId || ''}
                    onChange={(e) => handleSwitchLevel(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500/40 focus:border-amber-400 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[200px] truncate"
                    title="Selecione o andar da masmorra"
                  >
                    {activeLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} (Piso {lvl.order ?? 0})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsMapSelectorCollapsed(true)}
                    className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 rounded-lg transition-colors ml-0.5 cursor-pointer"
                    title="Recolher Seletor de Andares"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMapSelectorCollapsed(false)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer px-1"
                  title="Expandir Seletor de Andares"
                >
                  <span className="truncate max-w-[150px]">
                    {activeLevels.find((l) => l.id === activeLevelId)?.name || 'Andar'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Tactical Action Bar (Collapsible) */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1 shadow-2xl shrink-0">
          {!isToolsBarCollapsed ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedTool('token')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'token' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Mover Tokens e Personagens"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Token</span>
              </button>
              <button
                onClick={() => setSelectedTool('fog-reveal')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'fog-reveal' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Revelar Névoa"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Revelar</span>
              </button>
              <button
                onClick={() => setSelectedTool('fog-cover')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'fog-cover' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Cobrir Névoa"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cobrir</span>
              </button>
              <button
                onClick={handleCoverAllFog}
                className="px-2 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 text-rose-400 hover:bg-rose-950/40 border border-rose-500/20 cursor-pointer"
                title="Cobrir Todo o Mapa (Preserva os pinos dos jogadores)"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Cobrir Tudo</span>
              </button>
              <button
                onClick={handleReloadFromTemplate}
                className="px-2 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 text-amber-400 hover:bg-amber-950/40 border border-amber-500/20 cursor-pointer"
                title="Recarregar do Modelo (Reinicia o mapa com o layout original do editor)"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Recarregar</span>
              </button>
              <button
                onClick={() => {
                  setSelectedTool('measure');
                  setMeasureStart(null);
                  setMeasuredDistance(null);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'measure' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Medir Régua"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Régua</span>
              </button>
              <button
                onClick={() => setSelectedTool('pan')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'pan' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Arrastar Mapa"
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mover</span>
              </button>

              <button
                type="button"
                onClick={() => setIsToolsBarCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors ml-0.5 cursor-pointer"
                title="Recolher Barra de Ferramentas"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsToolsBarCollapsed(false)}
              className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              title="Expandir Barra de Ferramentas"
            >
              <span className="capitalize">{selectedTool.replace('draw-', '').replace('fog-', '')}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Drawing Tools (Left side - Collapsible) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 z-30">
        {!isDrawingToolsCollapsed ? (
          <div className="p-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-2xl w-13 items-center animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center justify-between w-full pb-1 border-b border-slate-800/80">
              <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">Anotar</span>
              <button
                type="button"
                onClick={() => setIsDrawingToolsCollapsed(true)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
                title="Recolher Anotações"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => setSelectedTool('draw-pencil')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-pencil' ? 'bg-amber-500 shadow-md scale-105' : 'hover:bg-slate-800 grayscale hover:grayscale-0'
              }`}
              title="Lápis Livre"
            >
              ✏️
            </button>
            <button
              onClick={() => setSelectedTool('draw-circle')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-circle' ? 'bg-amber-500 shadow-md scale-105' : 'hover:bg-slate-800 grayscale hover:grayscale-0'
              }`}
              title="Desenhar Círculo"
            >
              ⭕
            </button>
            <button
              onClick={() => setSelectedTool('draw-rect')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-rect' ? 'bg-amber-500 shadow-md scale-105' : 'hover:bg-slate-800 grayscale hover:grayscale-0'
              }`}
              title="Desenhar Retângulo"
            >
              🔲
            </button>
            <button
              onClick={() => setSelectedTool('draw-text')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-text' ? 'bg-amber-500 shadow-md scale-105' : 'hover:bg-slate-800 grayscale hover:grayscale-0'
              }`}
              title="Anotação de Texto"
            >
              📝
            </button>
            <div className="w-7 h-[1px] bg-slate-800 my-0.5"></div>
            <button
              onClick={() => setSelectedTool('draw-eraser')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-eraser' ? 'bg-rose-500 shadow-md scale-105' : 'hover:bg-slate-800 grayscale hover:grayscale-0'
              }`}
              title="Borracha"
            >
              🧹
            </button>
            <button
              onClick={() => broadcastDrawingAction?.({ action: 'undo' })}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-base hover:bg-slate-800 transition-all text-slate-300 hover:text-slate-100 cursor-pointer"
              title="Desfazer (Ctrl+Z)"
            >
              ↩️
            </button>
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja apagar todos os desenhos?')) {
                  broadcastDrawingAction?.({ action: 'clear' });
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-base hover:bg-rose-900/50 transition-all text-rose-500 hover:text-rose-400 cursor-pointer"
              title="Limpar Tudo"
            >
              🗑️
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsDrawingToolsCollapsed(false)}
            className="p-2.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-800 text-amber-400 rounded-xl shadow-xl backdrop-blur-md flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Expandir Ferramentas de Desenho / Anotação"
          >
            <span className="text-base">✏️</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      {/* Main DysonCanvas inside Aspect Box */}
      <DysonCanvas
        key={`${activeScene.id}_${currentMapId}_${activeLevelId || 'lvl0'}`}
        grid={grid}
        bgImageUrl={bgImageUrl}
        gridScale={gridScale}
        gridOffsetX={gridOffsetX}
        gridOffsetY={gridOffsetY}
        combatants={combatants}
        vectorWalls={vectorWalls}
        lightSources={lightSources}
        selectedTool={selectedTool}
        setSelectedTool={(t) => setSelectedTool(t as any)}
        selectedTileType="floor" // Not painting terrains in cockpit
        selectedTokenCombatant={null}
        measureStart={measureStart}
        setMeasureStart={setMeasureStart}
        setMeasuredDistance={setMeasuredDistance}
        onGridChange={setGrid}
        drawings={drawings}
        onDrawingAction={broadcastDrawingAction}
      />
    </div>
  );
};
