'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Eye, 
  EyeOff, 
  MapPin, 
  Ruler, 
  Hand, 
  Cloud, 
  RefreshCw, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Trash2,
  Users,
  Search,
  Shield,
  Skull,
  Sparkles,
  ArrowRightLeft,
  X,
  Pencil,
  BookOpen,
  Compass,
  Swords,
  Play,
  Image as ImageIcon
} from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { DysonCanvas } from '@/components/map/DysonCanvas';
import { revealVisionWithLOS, getTokenVisionRadius } from '@/components/map/visionCore';
import { normalizeToMultiLevel } from '@/lib/map/mapLevelsCore';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { MapLevel, Combatant, DungeonTransitionConfig, TransitionType, LightSource } from '@/lib/types';
import { INITIAL_MONSTERS, NPC_TEMPLATES } from '@/lib/srd-data';
import { resolveTokenAvatar } from '@/lib/utils/tokenAvatarResolver';
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
  const { activeScene, updateScene, fetchSceneMap, saveSceneMap, campaignMaps } = useSession();
  const { combatants, broadcastToPlayerView, drawings, broadcastDrawingAction, setMapData } = useLiveCockpit();
  const { activeCampaign } = useCampaign();

  // Stable refs to prevent re-triggering effects on frequent parent/realtime re-renders
  const combatantsRef = useRef(combatants);
  combatantsRef.current = combatants;

  const broadcastToPlayerViewRef = useRef(broadcastToPlayerView);
  broadcastToPlayerViewRef.current = broadcastToPlayerView;

  const setMapDataRef = useRef(setMapData);
  setMapDataRef.current = setMapData;

  const fetchSceneMapRef = useRef(fetchSceneMap);
  fetchSceneMapRef.current = fetchSceneMap;

  const saveSceneMapRef = useRef(saveSceneMap);
  saveSceneMapRef.current = saveSceneMap;

  const campaignMapsRef = useRef(campaignMaps);
  campaignMapsRef.current = campaignMaps;

  const lastLoadedSceneIdRef = useRef<string | null>(null);
  const lastTemplateSyncTimeRef = useRef<number>(0);
  const lastSavedPayloadRef = useRef<string>('');

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [gridScale, setGridScale] = useState<number>(40);
  const [gridOffsetX, setGridOffsetX] = useState<number>(0);
  const [gridOffsetY, setGridOffsetY] = useState<number>(0);
  const [vectorWalls, setVectorWalls] = useState<import('@/lib/types').WallSegment[]>([]);
  const [lightSources, setLightSources] = useState<import('@/lib/types').LightSource[]>([]);

  const [selectedTool, setSelectedTool] = useState<'pan' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text'>('token');
  const [selectedTokenCombatant, setSelectedTokenCombatant] = useState<Combatant | null>(null);
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokenCategory, setTokenCategory] = useState<'all' | 'players' | 'monsters' | 'npcs'>('all');
  const [isTokenTrayOpen, setIsTokenTrayOpen] = useState(false);

  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Drawing customization
  const [drawColor, setDrawColor] = useState<string>('#f59e0b');
  const [drawLineWidth, setDrawLineWidth] = useState<number>(4);

  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [activeLevels, setActiveLevels] = useState<MapLevel[]>([]);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const multiMapStateRef = useRef<MultiMapState>({ maps: {}, activeMapId: null });

  // Estado de Exploração Cinemática da Masmorra
  const [isExplorationStarted, setIsExplorationStarted] = useState<boolean>(false);
  const [showCoverModal, setShowCoverModal] = useState<boolean>(false);

  // Dados da masmorra ativa
  const activeCampaignMap = useMemo(() => {
    return campaignMaps.find((m) => m.id === currentMapId) || null;
  }, [campaignMaps, currentMapId]);

  const activeDungeonCover = useMemo(() => {
    if (!activeCampaignMap) return null;
    const gd = activeCampaignMap.gridData || {};
    return gd.coverImageUrl || gd.levels?.[0]?.bgImageUrl || gd.bgImageUrl || null;
  }, [activeCampaignMap]);

  const activeDungeonLore = useMemo(() => {
    return activeCampaignMap?.gridData?.description || '';
  }, [activeCampaignMap]);

  const activeDungeonCR = useMemo(() => {
    return activeCampaignMap?.gridData?.challengeRating || 'Nível Recomendado';
  }, [activeCampaignMap]);

  const handleStartExploration = () => {
    setIsExplorationStarted(true);

    if (activeScene && updateScene) {
      updateScene({ ...activeScene, isDungeonExplorationStarted: true });
    }
    if (currentMapId && activeScene) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`masters_codex_dungeon_started_${activeScene.id}_${currentMapId}`, 'true');
      }
      if (multiMapStateRef.current?.maps[currentMapId]) {
        (multiMapStateRef.current.maps[currentMapId] as any).isExplorationStarted = true;
      }
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

    const activeLevelName = activeLevels.find((l) => l.id === activeLevelId)?.name;
    const associatedMap = campaignMapsRef.current.find((m) => m.id === currentMapId);
    const coverImg = associatedMap?.gridData?.coverImageUrl || associatedMap?.gridData?.levels?.[0]?.bgImageUrl || associatedMap?.gridData?.bgImageUrl || bgImageUrl || null;
    const mapPayload = {
      bgImageUrl,
      gridScale,
      gridOffsetX,
      gridOffsetY,
      vectorWalls,
      lightSources,
      activeMapId: currentMapId,
      activeLevelId,
      currentLevelName: activeLevelName,
      sceneId: activeScene?.id,
      fogMatrix,
      tokens,
      dungeonExplorationStarted: true,
      mapTitle: associatedMap?.title || activeScene?.title,
      coverImageUrl: coverImg,
      description: associatedMap?.gridData?.description || '',
      challengeRating: associatedMap?.gridData?.challengeRating || 'Nível Recomendado',
    };
    lastBroadcast.current = JSON.stringify(mapPayload);
    broadcastToPlayerView({
      dungeonExplorationStarted: true,
      activeMapId: currentMapId,
      mapData: mapPayload,
    });

    if (activeScene) {
      saveSceneMap(activeScene.id, multiMapStateRef.current).catch(console.error);
    }
    toast.success('Exploração da masmorra iniciada! O mapa tático foi revelado aos jogadores.');
  };

  const handleRestartExploration = () => {
    if (!window.confirm('Deseja reiniciar a exploração da masmorra? Isso cobrirá a área com névoa e retornará a capa cinemática para os jogadores.')) return;
    
    setIsExplorationStarted(false);

    if (activeScene && updateScene) {
      updateScene({ ...activeScene, isDungeonExplorationStarted: false });
    }
    if (currentMapId && activeScene) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`masters_codex_dungeon_started_${activeScene.id}_${currentMapId}`);
      }
      if (multiMapStateRef.current?.maps[currentMapId]) {
        (multiMapStateRef.current.maps[currentMapId] as any).isExplorationStarted = false;
      }
    }

    // Re-cover fog with initial line of sight for active tokens
    const coveredGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        fog: true,
      }))
    );
    for (let r = 0; r < coveredGrid.length; r++) {
      for (let c = 0; c < coveredGrid[r].length; c++) {
        if (coveredGrid[r][c].tokenName) {
          const radius = getTokenVisionRadius(coveredGrid[r][c].tokenName, combatants);
          revealVisionWithLOS(coveredGrid, r, c, radius);
        }
      }
    }
    setGrid(coveredGrid);

    let fogMatrix = '';
    const tokens: { name: string; color: string; r: number; c: number }[] = [];
    for (let r = 0; r < coveredGrid.length; r++) {
      for (let c = 0; c < coveredGrid[r].length; c++) {
        fogMatrix += coveredGrid[r][c].fog ? '1' : '0';
        if (coveredGrid[r][c].tokenName) {
          tokens.push({
            name: coveredGrid[r][c].tokenName!,
            color: coveredGrid[r][c].tokenColor || 'bg-cyan-500',
            r,
            c
          });
        }
      }
    }

    const activeLevelName = activeLevels.find((l) => l.id === activeLevelId)?.name;
    const associatedMap = campaignMapsRef.current.find((m) => m.id === currentMapId);
    const coverImg = associatedMap?.gridData?.coverImageUrl || associatedMap?.gridData?.levels?.[0]?.bgImageUrl || associatedMap?.gridData?.bgImageUrl || bgImageUrl || null;
    const mapPayload = {
      bgImageUrl,
      gridScale,
      gridOffsetX,
      gridOffsetY,
      vectorWalls,
      lightSources,
      activeMapId: currentMapId,
      activeLevelId,
      currentLevelName: activeLevelName,
      sceneId: activeScene?.id,
      fogMatrix,
      tokens,
      dungeonExplorationStarted: false,
      mapTitle: associatedMap?.title || activeScene?.title,
      coverImageUrl: coverImg,
      description: associatedMap?.gridData?.description || '',
      challengeRating: associatedMap?.gridData?.challengeRating || 'Nível Recomendado',
    };
    lastBroadcast.current = JSON.stringify(mapPayload);

    broadcastToPlayerView({
      dungeonExplorationStarted: false,
      activeMapId: currentMapId,
      mapData: mapPayload,
    });

    if (activeScene) {
      saveSceneMap(activeScene.id, multiMapStateRef.current).catch(console.error);
    }
    toast.success('Exploração reiniciada! A capa e lore da masmorra foram restauradas.');
  };

  const handleEndExploration = () => {
    if (!window.confirm('Deseja finalizar a exploração desta masmorra?')) return;
    
    setIsExplorationStarted(false);

    if (activeScene && updateScene) {
      updateScene({ ...activeScene, isDungeonExplorationStarted: false });
    }
    if (currentMapId && activeScene) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`masters_codex_dungeon_started_${activeScene.id}_${currentMapId}`);
      }
      if (multiMapStateRef.current?.maps[currentMapId]) {
        (multiMapStateRef.current.maps[currentMapId] as any).isExplorationStarted = false;
      }
    }

    const activeLevelName = activeLevels.find((l) => l.id === activeLevelId)?.name;
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
      sceneId: activeScene?.id,
      dungeonExplorationStarted: false,
    };
    lastBroadcast.current = JSON.stringify(mapPayload);

    broadcastToPlayerView({
      dungeonExplorationStarted: false,
      activeMapId: currentMapId,
      mapData: mapPayload,
    });

    if (activeScene) {
      saveSceneMap(activeScene.id, multiMapStateRef.current).catch(console.error);
    }
    toast.success('Exploração da masmorra finalizada com sucesso!');
  };

  // Collapsible HUD states - All collapsed by default
  const [isMapSelectorCollapsed, setIsMapSelectorCollapsed] = useState(true);
  const [isToolsBarCollapsed, setIsToolsBarCollapsed] = useState(true);
  const [isDrawingToolsCollapsed, setIsDrawingToolsCollapsed] = useState(true);

  // Consolidated list of all placeable combatants / tokens
  const allAvailableTokens: Combatant[] = useMemo(() => {
    const list: Combatant[] = combatants.map((c) => ({
      ...c,
      avatarUrl: resolveTokenAvatar(c.name, c) || c.avatarUrl,
    }));
    const namesSeen = new Set(list.map((c) => c.name.trim().toLowerCase()));

    // 1. Registered campaign party members
    const registeredParty = activeCampaign?.partyMembers || [];
    for (const pm of registeredParty) {
      const pmName = pm.name || (pm as any).characterName || '';
      const nameClean = pmName.trim().toLowerCase();
      if (nameClean && !namesSeen.has(nameClean)) {
        const resolvedAvatar = resolveTokenAvatar(pmName, { avatarUrl: pm.avatarUrl } as any) || pm.avatarUrl;
        list.push({
          id: `party-${pm.id}`,
          name: pmName,
          type: 'player',
          hp: 20,
          maxHp: 20,
          ac: 10,
          initiative: 0,
          conditions: [],
          avatarUrl: resolvedAvatar,
        });
        namesSeen.add(nameClean);
      }
    }

    // 2. Character sheets from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedSheetsRaw = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
        if (savedSheetsRaw) {
          const sheets: any[] = JSON.parse(savedSheetsRaw);
          if (Array.isArray(sheets)) {
            sheets.forEach((sheet) => {
              const charName = sheet.characterName || sheet.name;
              if (charName) {
                const nameClean = charName.trim().toLowerCase();
                if (!namesSeen.has(nameClean)) {
                  const resolvedAvatar = resolveTokenAvatar(charName, {
                    avatarUrl: sheet.faceImageUrl || sheet.avatarUrl || (Array.isArray(sheet.images) && sheet.images[0])
                  } as any);
                  list.push({
                    id: `sheet-${sheet.id || nameClean}`,
                    name: charName,
                    type: 'player',
                    hp: sheet.hp?.max || sheet.maxHp || 20,
                    maxHp: sheet.hp?.max || sheet.maxHp || 20,
                    ac: sheet.armorClass || sheet.ac || 10,
                    initiative: 0,
                    conditions: [],
                    avatarUrl: resolvedAvatar || undefined,
                  });
                  namesSeen.add(nameClean);
                }
              }
            });
          }
        }
      } catch (_e) {}
    }

    // 3. Add NPC Templates
    for (const npc of NPC_TEMPLATES) {
      const nameClean = npc.name.trim().toLowerCase();
      if (!namesSeen.has(nameClean)) {
        list.push(npc);
        namesSeen.add(nameClean);
      }
    }

    // 4. Add SRD Monsters for quick tactical placement
    for (const mon of INITIAL_MONSTERS) {
      const nameClean = mon.name.trim().toLowerCase();
      if (!namesSeen.has(nameClean)) {
        const dexMod = Math.floor((mon.dex - 10) / 2);
        list.push({
          id: `mon-${mon.id}`,
          name: mon.name,
          type: 'monster',
          hp: mon.hp,
          maxHp: mon.hp,
          ac: mon.ac,
          initiative: 0,
          initiativeBonus: dexMod,
          dex: mon.dex,
          str: mon.str,
          con: mon.con,
          int: mon.int,
          wis: mon.wis,
          cha: mon.cha,
          cr: mon.cr,
          conditions: [],
          tokenImageUrl: mon.tokenImageUrl,
        });
        namesSeen.add(nameClean);
      }
    }

    return list;
  }, [combatants, activeCampaign?.partyMembers]);

  // Helper to determine which floor/level a token is currently located on
  const getTokenLocation = useCallback((tokenName: string): { levelId: string; levelName: string; isOnActive: boolean } | null => {
    const key = tokenName.trim().toUpperCase();

    // Check active grid
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c].tokenName?.trim().toUpperCase() === key) {
          const currentLevelObj = activeLevels.find(l => l.id === activeLevelId);
          return {
            levelId: activeLevelId || 'current',
            levelName: currentLevelObj?.name || 'Andar Atual',
            isOnActive: true
          };
        }
      }
    }

    // Check all other levels in multiMapStateRef
    if (currentMapId && multiMapStateRef.current.maps[currentMapId]?.levels) {
      const levelsRecord = multiMapStateRef.current.maps[currentMapId].levels;
      for (const [lvlId, lvlState] of Object.entries(levelsRecord)) {
        if (lvlId === activeLevelId) continue;
        const lGrid = lvlState.grid;
        if (!lGrid) continue;
        for (let r = 0; r < lGrid.length; r++) {
          for (let c = 0; c < lGrid[r].length; c++) {
            if (lGrid[r][c].tokenName?.trim().toUpperCase() === key) {
              const lvlObj = activeLevels.find(l => l.id === lvlId);
              return {
                levelId: lvlId,
                levelName: lvlObj?.name || lvlState.name || 'Outro Andar',
                isOnActive: false
              };
            }
          }
        }
      }
    }

    return null;
  }, [grid, activeLevelId, activeLevels, currentMapId]);

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
              tokenName: sCell?.tokenName,
              tokenColor: sCell?.tokenColor,
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
              const radius = getTokenVisionRadius(tGrid[r][c].tokenName, combatantsRef.current);
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
  }, [campaignMaps]);

  const loadMapFromMultiStateRef = useRef(loadMapFromMultiState);
  loadMapFromMultiStateRef.current = loadMapFromMultiState;

  // Ref for deduplicating broadcasts
  const lastBroadcast = useRef<string>('');

  // Load or initialize scene map
  useEffect(() => {
    const sceneId = activeScene?.id;
    if (!sceneId) return;

    // Prevent re-fetching and reloading if this scene is already loaded
    if (lastLoadedSceneIdRef.current === sceneId) return;
    lastLoadedSceneIdRef.current = sceneId;

    setIsLoading(true);

    fetchSceneMapRef.current(sceneId).then((savedData: any) => {
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
      const currentCampaignMaps = campaignMapsRef.current;
      const associatedIds: string[] = (activeScene.associatedMapIds || (activeScene.associatedMapId ? [activeScene.associatedMapId] : []))
        .filter((id: string) => currentCampaignMaps.some(m => m.id === id));
      let activeId: string | null = multiState.activeMapId || null;
      if (!activeId || !associatedIds.includes(activeId)) {
        activeId = associatedIds[0] || null;
        multiState.activeMapId = activeId;
      }

      const persistedStarted = 
        activeScene.isDungeonExplorationStarted === true ||
        (multiState as any)?.isExplorationStarted === true ||
        (activeId && (multiState.maps[activeId] as any)?.isExplorationStarted === true) ||
        (typeof window !== 'undefined' && localStorage.getItem(`masters_codex_dungeon_started_${sceneId}_${activeId}`) === 'true');

      setIsExplorationStarted(Boolean(persistedStarted));

      setCurrentMapId(activeId);
      loadMapFromMultiStateRef.current(multiState, activeId);
      setIsLoading(false);

      // Broadcast immediately so the player view receives the map on first load
      if (activeId && multiState.maps[activeId]) {
        const m = multiState.maps[activeId];
        const lvlId = m.activeLevelId;
        const currentLvlState: LevelRuntimeState | undefined = (lvlId && m.levels ? m.levels[lvlId] : undefined) || (m.levels ? Object.values(m.levels)[0] : undefined);
        const mapTemplate = currentCampaignMaps.find(cmap => cmap.id === activeId);
        const coverImg = mapTemplate?.gridData?.coverImageUrl || mapTemplate?.gridData?.levels?.[0]?.bgImageUrl || mapTemplate?.gridData?.bgImageUrl || currentLvlState?.bgImageUrl || m.bgImageUrl || null;

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
          sceneId: sceneId,
          dungeonExplorationStarted: Boolean(persistedStarted),
          mapTitle: mapTemplate?.title || activeScene.title,
          coverImageUrl: coverImg,
          description: mapTemplate?.gridData?.description || '',
          challengeRating: mapTemplate?.gridData?.challengeRating || 'Nível Recomendado',
        };
        lastBroadcast.current = JSON.stringify(payload);
        broadcastToPlayerViewRef.current({
          dungeonExplorationStarted: Boolean(persistedStarted),
          activeMapId: activeId,
          mapData: payload
        });
      }
    }).catch(err => {
      console.error('[CockpitDungeonMap] Error loading scene map:', err);
      setIsLoading(false);
    });
  }, [activeScene?.id]);

  // Synchronize with updated campaignMaps (e.g. when edited and saved in MapMaker)
  useEffect(() => {
    if (!currentMapId || !activeScene || isLoading || !multiMapStateRef.current) return;
    const associatedMap = campaignMaps.find(m => m.id === currentMapId);
    if (!associatedMap || !associatedMap.gridData) return;

    // Check updatedAt timestamp to avoid needless re-syncs
    const mapUpdatedTime = associatedMap.updatedAt ? new Date(associatedMap.updatedAt).getTime() : 0;
    if (mapUpdatedTime > 0 && mapUpdatedTime <= lastTemplateSyncTimeRef.current) {
      return;
    }
    if (mapUpdatedTime > 0) {
      lastTemplateSyncTimeRef.current = mapUpdatedTime;
    }

    loadMapFromMultiStateRef.current(multiMapStateRef.current, currentMapId, activeLevelId);
  }, [campaignMaps, currentMapId, activeLevelId, activeScene?.id, isLoading]);

  // Debounced auto-save & Realtime Broadcast to Players
  useEffect(() => {
    const sceneId = activeScene?.id;
    if (!sceneId || isLoading) return;

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
      const associatedMap = campaignMapsRef.current.find(m => m.id === currentMapId);
      const coverImg = associatedMap?.gridData?.coverImageUrl || associatedMap?.gridData?.levels?.[0]?.bgImageUrl || associatedMap?.gridData?.bgImageUrl || bgImageUrl || null;

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
        sceneId: sceneId,
        fogMatrix,
        tokens,
        dungeonExplorationStarted: isExplorationStarted,
        mapTitle: associatedMap?.title || activeScene?.title,
        coverImageUrl: coverImg,
        description: associatedMap?.gridData?.description || '',
        challengeRating: associatedMap?.gridData?.challengeRating || 'Nível Recomendado',
      };

      // Deduplicate saves to Supabase
      const payloadStr = JSON.stringify(multiMapStateRef.current);
      if (lastSavedPayloadRef.current !== payloadStr) {
        lastSavedPayloadRef.current = payloadStr;
        saveSceneMapRef.current(sceneId, multiMapStateRef.current).catch((e: any) => {
          console.warn('[CockpitDungeonMap] Auto-save scene map warning (persisted offline):', e);
        });
      }

      const stringified = JSON.stringify(mapPayload);
      if (lastBroadcast.current !== stringified) {
        lastBroadcast.current = stringified;
        broadcastToPlayerViewRef.current({
          dungeonExplorationStarted: isExplorationStarted,
          activeMapId: currentMapId,
          mapData: mapPayload
        });
      }
    }, 800);

    return () => clearTimeout(delayDebounce);
  }, [grid, bgImageUrl, vectorWalls, lightSources, gridScale, gridOffsetX, gridOffsetY, activeScene?.id, isLoading, currentMapId, activeLevelId, activeLevels, isExplorationStarted]);

  // Instant Realtime Broadcast to All Player Screens (<16ms)
  const broadcastMapNow = useCallback((targetGrid?: Cell[][], overrideExploration?: boolean) => {
    const gridToBroadcast = targetGrid || grid;
    if (!gridToBroadcast || gridToBroadcast.length === 0 || !currentMapId) return;

    let fogMatrix = '';
    const tokens: { name: string; color: string; r: number; c: number }[] = [];
    for (let r = 0; r < gridToBroadcast.length; r++) {
      for (let c = 0; c < gridToBroadcast[r].length; c++) {
        fogMatrix += gridToBroadcast[r][c].fog ? '1' : '0';
        if (gridToBroadcast[r][c].tokenName) {
          tokens.push({
            name: gridToBroadcast[r][c].tokenName!,
            color: gridToBroadcast[r][c].tokenColor || 'bg-cyan-500',
            r,
            c,
          });
        }
      }
    }

    const activeLevelName = activeLevels.find((l) => l.id === activeLevelId)?.name;
    const associatedMap = campaignMapsRef.current.find((m) => m.id === currentMapId);
    const coverImg = associatedMap?.gridData?.coverImageUrl || associatedMap?.gridData?.levels?.[0]?.bgImageUrl || associatedMap?.gridData?.bgImageUrl || bgImageUrl || null;
    const isExpl = overrideExploration !== undefined ? overrideExploration : isExplorationStarted;

    const mapPayload = {
      bgImageUrl,
      gridScale,
      gridOffsetX,
      gridOffsetY,
      vectorWalls,
      lightSources,
      activeMapId: currentMapId,
      activeLevelId,
      currentLevelName: activeLevelName,
      sceneId: activeScene?.id,
      fogMatrix,
      tokens,
      rows: gridToBroadcast.length,
      cols: gridToBroadcast[0]?.length || 0,
      dungeonExplorationStarted: isExpl,
      mapTitle: associatedMap?.title || activeScene?.title,
      coverImageUrl: coverImg,
      description: associatedMap?.gridData?.description || '',
      challengeRating: associatedMap?.gridData?.challengeRating || 'Nível Recomendado',
    };

    // Sincroniza localmente no LiveCockpitContext para responder a STATE_REQUEST de novos peers
    if (setMapDataRef.current) {
      setMapDataRef.current({
        ...mapPayload,
        grid: gridToBroadcast,
      });
    }

    lastBroadcast.current = JSON.stringify(mapPayload);
    broadcastToPlayerViewRef.current({
      dungeonExplorationStarted: isExpl,
      activeMapId: currentMapId,
      mapData: mapPayload,
    });
  }, [grid, currentMapId, activeLevelId, activeLevels, bgImageUrl, gridScale, gridOffsetX, gridOffsetY, vectorWalls, lightSources, activeScene?.id, activeScene?.title, isExplorationStarted]);

  // Master Grid Change Handler - Propagates token moves, LOS, and map edits instantly
  const handleGridChange = useCallback((updater: (prev: Cell[][]) => Cell[][]) => {
    setGrid((prevGrid) => {
      const nextGrid = updater(prevGrid);

      // 1. Update multiMapStateRef in-memory
      if (multiMapStateRef.current && currentMapId) {
        if (activeLevelId && multiMapStateRef.current.maps[currentMapId]?.levels?.[activeLevelId]) {
          multiMapStateRef.current.maps[currentMapId].levels[activeLevelId].grid = nextGrid;
        } else if (multiMapStateRef.current.maps[currentMapId]) {
          multiMapStateRef.current.maps[currentMapId].grid = nextGrid;
        }
      }

      // 2. Broadcast immediately in real time (<16ms) outside React reducer phase
      queueMicrotask(() => {
        broadcastMapNow(nextGrid);
      });

      return nextGrid;
    });
  }, [currentMapId, activeLevelId, broadcastMapNow]);

  const handleAddLightSource = useCallback((light: LightSource) => {
    setLightSources((prev) => {
      const next = [...prev, light];
      queueMicrotask(() => {
        broadcastToPlayerViewRef.current({ lightSources: next });
      });
      return next;
    });
  }, []);

  const handleRemoveLightSource = useCallback((lightId: string) => {
    setLightSources((prev) => {
      const next = prev.filter((l) => l.id !== lightId);
      queueMicrotask(() => {
        broadcastToPlayerViewRef.current({ lightSources: next });
      });
      return next;
    });
  }, []);

  const handleUpdateLightSource = useCallback((light: LightSource) => {
    setLightSources((prev) => {
      const next = prev.map((l) => (l.id === light.id ? light : l));
      queueMicrotask(() => {
        broadcastToPlayerViewRef.current({ lightSources: next });
      });
      return next;
    });
  }, []);

  // Instant In-Memory Floor / Level Switcher
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
      broadcastMapNow(targetState.grid);
    }
  };

  // Remove a token from current active floor and all memory levels
  const handleRemoveToken = (tokenName: string) => {
    const key = tokenName.trim().toUpperCase();

    // 1. Remove from active React state and broadcast immediately
    setGrid((prev) => {
      const copy = prev.map((row) => row.map((cell) => ({ ...cell })));
      for (let r = 0; r < copy.length; r++) {
        for (let c = 0; c < copy[r].length; c++) {
          if (copy[r][c].tokenName?.trim().toUpperCase() === key) {
            copy[r][c].tokenName = undefined;
            copy[r][c].tokenColor = undefined;
          }
        }
      }
      queueMicrotask(() => {
        broadcastMapNow(copy);
      });
      return copy;
    });

    // 2. Remove from all memory levels in multiMapStateRef
    if (currentMapId && multiMapStateRef.current.maps[currentMapId]?.levels) {
      const levelsRecord = multiMapStateRef.current.maps[currentMapId].levels;
      for (const lvlState of Object.values(levelsRecord)) {
        if (lvlState.grid) {
          for (let r = 0; r < lvlState.grid.length; r++) {
            for (let c = 0; c < lvlState.grid[r].length; c++) {
              if (lvlState.grid[r][c].tokenName?.trim().toUpperCase() === key) {
                lvlState.grid[r][c].tokenName = undefined;
                lvlState.grid[r][c].tokenColor = undefined;
              }
            }
          }
        }
      }
    }

    if (selectedTokenCombatant?.name.trim().toUpperCase() === key) {
      setSelectedTokenCombatant(null);
    }

    toast.success(`Token de "${tokenName}" removido do mapa.`);
  };

  // Transport ALL player tokens to target floor/level in one single action
  const handleMovePartyToLevel = (targetLevelId: string, spawnR?: number, spawnC?: number) => {
    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;
    const targetLevelObj = activeLevels.find((l) => l.id === targetLevelId);
    if (!targetLevelObj) return;

    // 1. Collect all player tokens
    const playerTokens = allAvailableTokens.filter((t) => t.type === 'player');
    if (playerTokens.length === 0) {
      toast.error('Nenhum jogador cadastrado para mover.');
      return;
    }

    const playerKeys = new Set(playerTokens.map((p) => p.name.trim().toUpperCase()));

    // 2. Snapshot current active grid into memory with player tokens removed
    const levelsRecord = multiMapStateRef.current.maps[currentMapId]?.levels || {};
    if (activeLevelId && levelsRecord[activeLevelId]) {
      const cleanedCurrentGrid = grid.map((row) =>
        row.map((cell) => {
          if (cell.tokenName && playerKeys.has(cell.tokenName.trim().toUpperCase())) {
            return { ...cell, tokenName: undefined, tokenColor: undefined };
          }
          return { ...cell };
        })
      );
      levelsRecord[activeLevelId] = {
        ...levelsRecord[activeLevelId],
        grid: cleanedCurrentGrid,
        bgImageUrl,
        gridScale,
        gridOffsetX,
        gridOffsetY,
        vectorWalls,
        lightSources,
        name: activeLevels.find((l) => l.id === activeLevelId)?.name,
      };
    }

    // Clean player tokens from all levels in memory
    for (const [lvlId, lvlState] of Object.entries(levelsRecord)) {
      if (lvlState.grid) {
        lvlState.grid = lvlState.grid.map((row) =>
          row.map((cell) => {
            if (cell.tokenName && playerKeys.has(cell.tokenName.trim().toUpperCase())) {
              return { ...cell, tokenName: undefined, tokenColor: undefined };
            }
            return { ...cell };
          })
        );
      }
    }

    // 3. Prepare target level grid
    let targetState = levelsRecord[targetLevelId];
    let targetGrid: Cell[][];
    if (targetState?.grid) {
      targetGrid = targetState.grid.map((row) => row.map((cell) => ({ ...cell })));
    } else {
      const tGrid = targetLevelObj.grid || createInitialGrid();
      targetGrid = tGrid.map((row) => row.map((cell) => ({ ...cell, fog: true, tokenName: undefined, tokenColor: undefined })));
    }

    // 4. Find walkable cells in targetGrid to place players (closest to target spawn position or center)
    const freeCells: { r: number; c: number }[] = [];
    for (let r = 0; r < targetGrid.length; r++) {
      for (let c = 0; c < targetGrid[r].length; c++) {
        if (targetGrid[r][c].type !== 'wall' && !targetGrid[r][c].tokenName) {
          freeCells.push({ r, c });
        }
      }
    }

    // Sort free cells starting closest to spawn point (or center)
    const centerR = spawnR !== undefined ? spawnR : Math.floor(targetGrid.length / 2);
    const centerC = spawnC !== undefined ? spawnC : Math.floor((targetGrid[0]?.length || 0) / 2);
    freeCells.sort((a, b) => {
      const distA = Math.hypot(a.r - centerR, a.c - centerC);
      const distB = Math.hypot(b.r - centerR, b.c - centerC);
      return distA - distB;
    });

    // Place each player
    playerTokens.forEach((player, idx) => {
      const cellPos = freeCells[idx] || freeCells[0];
      if (cellPos) {
        targetGrid[cellPos.r][cellPos.c].tokenName = player.name;
        targetGrid[cellPos.r][cellPos.c].tokenColor = '#38bdf8';
        const radius = getTokenVisionRadius(player.name, combatants);
        revealVisionWithLOS(targetGrid, cellPos.r, cellPos.c, radius);
      }
    });

    // 5. Save target state & switch active level
    const updatedTargetState: LevelRuntimeState = {
      grid: targetGrid,
      bgImageUrl: targetLevelObj.bgImageUrl || targetState?.bgImageUrl || null,
      gridScale: targetLevelObj.gridScale || targetState?.gridScale || 40,
      gridOffsetX: targetLevelObj.gridOffsetX || targetState?.gridOffsetX || 0,
      gridOffsetY: targetLevelObj.gridOffsetY || targetState?.gridOffsetY || 0,
      vectorWalls: targetLevelObj.vectorWalls || targetState?.vectorWalls || [],
      lightSources: targetLevelObj.lightSources || targetState?.lightSources || [],
      name: targetLevelObj.name,
      order: targetLevelObj.order,
    };

    if (!multiMapStateRef.current.maps[currentMapId]) {
      multiMapStateRef.current.maps[currentMapId] = { levels: {} };
    }
    if (!multiMapStateRef.current.maps[currentMapId].levels) {
      multiMapStateRef.current.maps[currentMapId].levels = {};
    }
    multiMapStateRef.current.maps[currentMapId].levels[targetLevelId] = updatedTargetState;
    multiMapStateRef.current.maps[currentMapId].activeLevelId = targetLevelId;

    // Immediately persist in storage
    saveSceneMap(activeScene.id, multiMapStateRef.current).catch((e: any) => {
      console.error('Failed to save scene map on party transition:', e);
    });

    setActiveLevelId(targetLevelId);
    setGrid(targetGrid);
    setBgImageUrl(updatedTargetState.bgImageUrl);
    setGridScale(updatedTargetState.gridScale);
    setGridOffsetX(updatedTargetState.gridOffsetX);
    setGridOffsetY(updatedTargetState.gridOffsetY);
    setVectorWalls(updatedTargetState.vectorWalls || []);
    setLightSources(updatedTargetState.lightSources || []);

    // 6. Broadcast instantly to Player View
    broadcastMapNow(targetGrid);

    toast.success(`🚀 Grupo de heróis transportado para "${targetLevelObj.name}"!`);
  };

  // Move single token to target floor
  const handleMoveSingleTokenToLevel = (combOrName: Combatant | string, targetLevelId: string, spawnR?: number, spawnC?: number) => {
    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;
    const targetLevelObj = activeLevels.find((l) => l.id === targetLevelId);
    if (!targetLevelObj) return;

    const tokenName = typeof combOrName === 'string' ? combOrName : combOrName.name;
    const key = tokenName.trim().toUpperCase();
    const combObj = typeof combOrName === 'string'
      ? allAvailableTokens.find((t) => t.name.trim().toUpperCase() === key) || {
          id: `comb-${key}`,
          name: tokenName,
          type: 'player' as const,
          hp: 10,
          maxHp: 10,
          ac: 10,
          initiative: 0,
          conditions: [],
        }
      : combOrName;

    // 1. Remove from all levels in memory & current state
    setGrid((prev) => {
      const copy = prev.map((row) => row.map((cell) => ({ ...cell })));
      for (let r = 0; r < copy.length; r++) {
        for (let c = 0; c < copy[r].length; c++) {
          if (copy[r][c].tokenName?.trim().toUpperCase() === key) {
            copy[r][c].tokenName = undefined;
            copy[r][c].tokenColor = undefined;
          }
        }
      }
      return copy;
    });

    const levelsRecord = multiMapStateRef.current.maps[currentMapId]?.levels || {};
    if (activeLevelId && levelsRecord[activeLevelId]) {
      const cleanedCurrentGrid = grid.map((row) =>
        row.map((cell) => {
          if (cell.tokenName?.trim().toUpperCase() === key) {
            return { ...cell, tokenName: undefined, tokenColor: undefined };
          }
          return { ...cell };
        })
      );
      levelsRecord[activeLevelId].grid = cleanedCurrentGrid;
    }

    for (const [lvlId, lvlState] of Object.entries(levelsRecord)) {
      if (lvlId !== targetLevelId && lvlState.grid) {
        lvlState.grid = lvlState.grid.map((row) =>
          row.map((cell) => {
            if (cell.tokenName?.trim().toUpperCase() === key) {
              return { ...cell, tokenName: undefined, tokenColor: undefined };
            }
            return { ...cell };
          })
        );
      }
    }

    // 2. Add to targetLevel
    let targetState = levelsRecord[targetLevelId];
    let targetGrid: Cell[][];
    if (targetLevelId === activeLevelId) {
      targetGrid = grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          tokenName: cell.tokenName?.trim().toUpperCase() === key ? undefined : cell.tokenName,
          tokenColor: cell.tokenName?.trim().toUpperCase() === key ? undefined : cell.tokenColor,
        }))
      );
    } else if (targetState?.grid) {
      targetGrid = targetState.grid.map((row) => row.map((cell) => ({ ...cell })));
    } else {
      const tGrid = targetLevelObj.grid || createInitialGrid();
      targetGrid = tGrid.map((row) => row.map((cell) => ({ ...cell, fog: true, tokenName: undefined, tokenColor: undefined })));
    }

    // Find free cell closest to spawn position
    const centerR = spawnR !== undefined ? spawnR : Math.floor(targetGrid.length / 2);
    const centerC = spawnC !== undefined ? spawnC : Math.floor((targetGrid[0]?.length || 0) / 2);

    const freeCells: { r: number; c: number }[] = [];
    for (let r = 0; r < targetGrid.length; r++) {
      for (let c = 0; c < targetGrid[r].length; c++) {
        if (targetGrid[r][c].type !== 'wall' && !targetGrid[r][c].tokenName) {
          freeCells.push({ r, c });
        }
      }
    }
    freeCells.sort((a, b) => Math.hypot(a.r - centerR, a.c - centerC) - Math.hypot(b.r - centerR, b.c - centerC));
    const targetPos = freeCells[0];
    if (targetPos) {
      targetGrid[targetPos.r][targetPos.c].tokenName = combObj.name;
      targetGrid[targetPos.r][targetPos.c].tokenColor = combObj.type === 'player' ? '#38bdf8' : '#e11d48';
      const radius = getTokenVisionRadius(combObj.name, combatants);
      revealVisionWithLOS(targetGrid, targetPos.r, targetPos.c, radius);
    }

    if (targetLevelId === activeLevelId) {
      setGrid(targetGrid);
      queueMicrotask(() => {
        broadcastMapNow(targetGrid);
      });
    }
    if (!targetState) {
      targetState = {
        grid: targetGrid,
        bgImageUrl: targetLevelObj.bgImageUrl || null,
        gridScale: targetLevelObj.gridScale || 40,
        gridOffsetX: targetLevelObj.gridOffsetX || 0,
        gridOffsetY: targetLevelObj.gridOffsetY || 0,
        vectorWalls: targetLevelObj.vectorWalls || [],
        lightSources: targetLevelObj.lightSources || [],
        name: targetLevelObj.name,
        order: targetLevelObj.order,
      };
      levelsRecord[targetLevelId] = targetState;
    } else {
      targetState.grid = targetGrid;
    }

    // Immediately persist in storage
    saveSceneMap(activeScene.id, multiMapStateRef.current).catch((e: any) => {
      console.error('Failed to save scene map on single token transition:', e);
    });

    toast.success(`Token de "${tokenName}" movido para "${targetLevelObj.name}"!`);
  };

  const handleSaveTransitionWithTargetLevel = (
    config: DungeonTransitionConfig,
    sourceR: number,
    sourceC: number,
    autoCreateLinked: boolean,
    linkedTargetInfo?: { targetLevelId: string; targetR: number; targetC: number; linkedTransitionId?: string }
  ) => {
    // 1. Update current grid in state
    setGrid((prev) => {
      const copy = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (copy[sourceR]?.[sourceC]) {
        copy[sourceR][sourceC].type = 'transition';
        copy[sourceR][sourceC].transitionConfig = config;
      }
      return copy;
    });

    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;

    // 2. Snapshot current active level in multiMapStateRef
    const levelsRecord = multiMapStateRef.current.maps[currentMapId]?.levels || {};
    if (activeLevelId && levelsRecord[activeLevelId]) {
      const updatedCurrentGrid = grid.map((row, rIdx) =>
        row.map((cell, cIdx) => {
          if (rIdx === sourceR && cIdx === sourceC) {
            return { ...cell, type: 'transition' as const, transitionConfig: config };
          }
          return { ...cell };
        })
      );
      levelsRecord[activeLevelId].grid = updatedCurrentGrid;
    }

    // 3. Update target level grid
    if (linkedTargetInfo?.targetLevelId && linkedTargetInfo.targetLevelId !== activeLevelId) {
      const targetLevelId = linkedTargetInfo.targetLevelId;
      const targetR = linkedTargetInfo.targetR;
      const targetC = linkedTargetInfo.targetC;

      let targetState = levelsRecord[targetLevelId];
      if (!targetState) {
        const targetLevelObj = activeLevels.find((l) => l.id === targetLevelId);
        if (targetLevelObj) {
          targetState = {
            grid: targetLevelObj.grid || createInitialGrid(),
            bgImageUrl: targetLevelObj.bgImageUrl || null,
            gridScale: targetLevelObj.gridScale || 40,
            gridOffsetX: targetLevelObj.gridOffsetX || 0,
            gridOffsetY: targetLevelObj.gridOffsetY || 0,
            vectorWalls: targetLevelObj.vectorWalls || [],
            lightSources: targetLevelObj.lightSources || [],
            name: targetLevelObj.name,
            order: targetLevelObj.order,
          };
          levelsRecord[targetLevelId] = targetState;
        }
      }

      if (targetState?.grid) {
        const tGrid = targetState.grid.map((row) => row.map((cell) => ({ ...cell })));

        if (autoCreateLinked) {
          const reverseType: TransitionType =
            config.type === 'stairs_down' ? 'stairs_up' :
            (config.type === 'stairs_up' ? 'stairs_down' : config.type);

          const returnConfig: DungeonTransitionConfig = {
            id: `trans-${Math.random().toString(36).substring(2, 8)}`,
            name: `Retorno para ${activeLevels.find((l) => l.id === activeLevelId)?.name || 'Andar Anterior'}`,
            type: reverseType,
            targetLevelId: activeLevelId || '',
            targetSpawnR: sourceR,
            targetSpawnC: sourceC,
            linkedTransitionId: config.id,
            status: 'open',
          };

          config.linkedTransitionId = returnConfig.id;

          if (tGrid[targetR]?.[targetC]) {
            tGrid[targetR][targetC].type = 'transition';
            tGrid[targetR][targetC].transitionConfig = returnConfig;
            tGrid[targetR][targetC].fog = false;
          }
        } else if (linkedTargetInfo.linkedTransitionId) {
          if (tGrid[targetR]?.[targetC]) {
            const existingTarget = tGrid[targetR][targetC].transitionConfig;
            if (existingTarget) {
              tGrid[targetR][targetC].transitionConfig = {
                ...existingTarget,
                targetLevelId: activeLevelId || '',
                targetSpawnR: sourceR,
                targetSpawnC: sourceC,
                linkedTransitionId: config.id,
              };
            } else {
              tGrid[targetR][targetC].transitionConfig = {
                id: linkedTargetInfo.linkedTransitionId,
                name: 'Escada de Retorno',
                type: config.type === 'stairs_down' ? 'stairs_up' : (config.type === 'stairs_up' ? 'stairs_down' : config.type),
                targetLevelId: activeLevelId || '',
                targetSpawnR: sourceR,
                targetSpawnC: sourceC,
                linkedTransitionId: config.id,
                status: 'open',
              };
            }
          }
        }

        targetState.grid = tGrid;
      }
    }

    // Persist immediately in storage
    saveSceneMap(activeScene.id, multiMapStateRef.current).catch((e: any) => {
      console.error('Failed to save scene map on transition link:', e);
    });
  };

  const handleTransitionAction = (
    action: 'teleport_party' | 'teleport_token',
    targetLevelId: string,
    spawnR?: number,
    spawnC?: number,
    tokenName?: string
  ) => {
    if (action === 'teleport_party') {
      handleMovePartyToLevel(targetLevelId, spawnR, spawnC);
    } else if (action === 'teleport_token') {
      if (tokenName) {
        handleMoveSingleTokenToLevel(tokenName, targetLevelId, spawnR, spawnC);
      } else if (selectedTokenCombatant) {
        handleMoveSingleTokenToLevel(selectedTokenCombatant, targetLevelId, spawnR, spawnC);
      } else {
        const firstPlayer = allAvailableTokens.find((t) => t.type === 'player');
        if (firstPlayer) {
          handleMoveSingleTokenToLevel(firstPlayer, targetLevelId, spawnR, spawnC);
        } else {
          toast.info('Selecione um token na bandeja para movê-lo.');
        }
      }
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
      queueMicrotask(() => {
        broadcastMapNow(coveredGrid);
      });
      return coveredGrid;
    });
  };

  const handleReloadFromTemplate = () => {
    if (!currentMapId || !multiMapStateRef.current || !activeScene) return;
    const associatedMap = campaignMaps.find((m) => m.id === currentMapId);
    if (!associatedMap || !associatedMap.gridData) {
      toast.error('Modelo de mapa não encontrado.');
      return;
    }

    // Force delete saved state to trigger full reload
    delete multiMapStateRef.current.maps[currentMapId];
    loadMapFromMultiState(multiMapStateRef.current, currentMapId);
    toast.success('Mapa tático recarregado com sucesso a partir do modelo original!');
  };

  // Filtered tokens for the Tray HUD
  const filteredTokens = useMemo(() => {
    return allAvailableTokens.filter((token) => {
      if (tokenCategory === 'players' && token.type !== 'player') return false;
      if (tokenCategory === 'monsters' && token.type !== 'monster') return false;
      if (tokenCategory === 'npcs' && token.type !== 'npc') return false;
      if (tokenSearchQuery.trim()) {
        return token.name.toLowerCase().includes(tokenSearchQuery.toLowerCase());
      }
      return true;
    });
  }, [allAvailableTokens, tokenCategory, tokenSearchQuery]);

  const playerTokensCount = allAvailableTokens.filter((t) => t.type === 'player').length;
  const monsterTokensCount = allAvailableTokens.filter((t) => t.type === 'monster').length;
  const npcTokensCount = allAvailableTokens.filter((t) => t.type === 'npc').length;

  if (!activeScene || (isLoading && (!grid || grid.length === 0))) {
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
      {/* Top HUD Container - Responsive flex layout */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-start justify-between gap-3 pointer-events-none select-none">
        {/* Left Side: Floor Navigation Card & Quick Party Transport */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap max-w-[60%]">
          {activeLevels.length > 0 && (
            <div className="px-2.5 py-1.5 bg-slate-950/90 backdrop-blur-md border border-amber-500/40 rounded-2xl flex items-center gap-2 shadow-2xl animate-in fade-in shrink-0">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />

              {!isMapSelectorCollapsed ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider hidden sm:inline">Andar:</span>
                  <select
                    value={activeLevelId || ''}
                    onChange={(e) => handleSwitchLevel(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500/40 focus:border-amber-400 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[180px] truncate"
                    title="Selecione o andar da masmorra"
                  >
                    {activeLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} (Piso {lvl.order ?? 0})
                      </option>
                    ))}
                  </select>

                  {/* Multi-floor party mover action */}
                  {activeLevels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => activeLevelId && handleMovePartyToLevel(activeLevelId)}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer ml-1"
                      title="Transportar todos os heróis da party para este andar"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span className="hidden md:inline">Mover Grupo P/ Cá</span>
                    </button>
                  )}

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

        {/* Center / Status: Dungeon Exploration Controls (Always visible when in exploration) */}
        {isExplorationStarted && (
          <div className="pointer-events-auto bg-[#0d121c]/95 border-2 border-amber-500/50 rounded-2xl px-3 py-1.5 shadow-2xl shadow-black flex items-center gap-2 text-xs backdrop-blur-xl animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline uppercase tracking-wider">Explorando</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={handleRestartExploration}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              title="Reiniciar a Masmorra (Cobre o mapa com névoa e restaura a tela de capa com imagem, texto e botão de iniciar)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reiniciar Masmorra</span>
            </button>

            <button
              type="button"
              onClick={handleEndExploration}
              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              title="Finalizar e Encerrar a Exploração da Masmorra"
            >
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              <span>Finalizar Masmorra</span>
            </button>
          </div>
        )}

        {/* Right Side: Tactical Action Bar (Collapsible) */}
        <div className="flex items-center gap-1 pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1 shadow-2xl shrink-0">
          {!isToolsBarCollapsed ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSelectedTool('token');
                  setIsTokenTrayOpen(true);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'token' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Gerenciar, Adicionar e Mover Tokens"
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
                onClick={() => setSelectedTool('measure')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'measure' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Medir Distância (D&D 5e)"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Régua</span>
              </button>
              <button
                onClick={() => setSelectedTool('pan')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedTool === 'pan' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-300 hover:bg-slate-800'
                }`}
                title="Navegar / Pan (Espaço ou Arrastar)"
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Navegar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsToolsBarCollapsed(true)}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Recolher Barra de Ferramentas"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsToolsBarCollapsed(false)}
              className="p-1.5 text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs font-semibold cursor-pointer"
              title="Expandir Ferramentas Táticas"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Active Placement Banner */}
      {selectedTokenCombatant && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-slate-950/95 border-2 border-amber-400 text-slate-100 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className={`w-3.5 h-3.5 rounded-full ${selectedTokenCombatant.type === 'player' ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
          <span className="text-xs font-bold">
            Posicionar: <span className="text-amber-400 uppercase tracking-wide">{selectedTokenCombatant.name}</span>
          </span>
          <span className="text-[10px] text-slate-400 hidden md:inline border-l border-slate-700 pl-2">
            Clique no mapa para colocar • Botão direito para remover
          </span>
          <button
            type="button"
            onClick={() => setSelectedTokenCombatant(null)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-full transition-colors cursor-pointer ml-1"
            title="Cancelar posicionamento"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Token Placement Tray HUD (Slide-over Card) */}
      {isTokenTrayOpen && (
        <div className="absolute top-16 right-3 z-30 w-80 bg-[#0d121a]/95 backdrop-blur-md border border-[#2a3449] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="p-3 bg-[#0a0d14]/80 border-b border-[#2a3449] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Bandeja de Tokens</h4>
            </div>
            <button
              type="button"
              onClick={() => setIsTokenTrayOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search & Tabs */}
          <div className="p-2.5 space-y-2 border-b border-[#2a3449]/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={tokenSearchQuery}
                onChange={(e) => setTokenSearchQuery(e.target.value)}
                placeholder="Buscar token por nome..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 bg-[#0a0d14] p-1 rounded-xl border border-[#2a3449]/60 text-[10px] font-semibold text-center">
              <button
                type="button"
                onClick={() => setTokenCategory('all')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  tokenCategory === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({allAvailableTokens.length})
              </button>
              <button
                type="button"
                onClick={() => setTokenCategory('players')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  tokenCategory === 'players' ? 'bg-cyan-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Heróis ({playerTokensCount})
              </button>
              <button
                type="button"
                onClick={() => setTokenCategory('monsters')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  tokenCategory === 'monsters' ? 'bg-rose-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monstros ({monsterTokensCount})
              </button>
              <button
                type="button"
                onClick={() => setTokenCategory('npcs')}
                className={`py-1 rounded-lg transition-all cursor-pointer ${
                  tokenCategory === 'npcs' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NPCs ({npcTokensCount})
              </button>
            </div>
          </div>

          {/* Tokens List */}
          <div className="max-h-72 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Nenhum combatente ou criatura encontrada.
              </div>
            ) : (
              filteredTokens.map((comb) => {
                const isSelected = selectedTokenCombatant?.id === comb.id;
                const loc = getTokenLocation(comb.name);
                const isPlayer = comb.type === 'player';

                return (
                  <div
                    key={comb.id}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/80 shadow-md shadow-amber-500/10'
                        : 'bg-[#121824]/70 border-[#2a3449]/70 hover:border-slate-600 hover:bg-[#161f30]'
                    }`}
                  >
                    {/* Left: Token info & select action */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTokenCombatant(null);
                        } else {
                          setSelectedTokenCombatant(comb);
                          setSelectedTool('token');
                          toast.info(`Token "${comb.name}" selecionado. Clique no mapa para posicionar.`);
                        }
                      }}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                      title={isSelected ? 'Clique para desmarcar' : 'Clique para selecionar e posicionar no mapa'}
                    >
                      {/* Avatar / Initial Circle */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isPlayer ? 'bg-cyan-950 text-cyan-300 border-cyan-400/60' : comb.type === 'npc' ? 'bg-indigo-950 text-indigo-300 border-indigo-400/60' : 'bg-rose-950 text-rose-300 border-rose-500/60'
                        }`}
                      >
                        {isPlayer ? <Shield className="w-3.5 h-3.5 text-cyan-400" /> : comb.type === 'npc' ? <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> : <Skull className="w-3.5 h-3.5 text-rose-400" />}
                      </div>

                      {/* Name & Status */}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                          <span>{comb.name}</span>
                          {isSelected && (
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                              Ativo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          {loc ? (
                            <span className={loc.isOnActive ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                              📍 {loc.levelName}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Fora do Mapa</span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move to another floor dropdown if multi-floor */}
                      {activeLevels.length > 1 && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleMoveSingleTokenToLevel(comb, e.target.value);
                            }
                          }}
                          className="bg-[#0a0d14] border border-[#2a3449] text-[10px] text-slate-300 rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer"
                          title="Mover token para outro andar"
                        >
                          <option value="" disabled>
                            Mover...
                          </option>
                          {activeLevels.map((lvl) => (
                            <option key={lvl.id} value={lvl.id}>
                              {lvl.name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Remove Token Button (If on map) */}
                      {loc && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveToken(comb.name);
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 border border-transparent hover:border-rose-500/40 rounded-lg transition-all cursor-pointer"
                          title={`Remover ${comb.name} do mapa`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Helper */}
          <div className="p-2 bg-[#0a0d14]/90 border-t border-[#2a3449]/50 text-[10px] text-slate-400 flex items-center justify-between">
            <span>💡 Clique no mapa para posicionar</span>
            <span className="text-rose-400/80">Botão dir.: remove</span>
          </div>
        </div>
      )}

      {/* Floating Drawing Tools (Left side - Collapsible) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-3 z-30">
        {!isDrawingToolsCollapsed ? (
          <div className="p-2 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl flex flex-col gap-1.5 shadow-2xl w-14 items-center animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center justify-between w-full pb-1 border-b border-slate-800/80 px-0.5">
              <span className="text-[8px] uppercase font-bold text-amber-400 tracking-wider">Anotar</span>
              <button
                type="button"
                onClick={() => setIsDrawingToolsCollapsed(true)}
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
                title="Recolher Anotações"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>

            {/* Drawing Tools */}
            <button
              onClick={() => setSelectedTool('draw-pencil')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-pencil' ? 'bg-amber-500 text-slate-950 shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Lápis Livre"
            >
              ✏️
            </button>
            <button
              onClick={() => setSelectedTool('draw-circle')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-circle' ? 'bg-amber-500 text-slate-950 shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Desenhar Círculo / Área"
            >
              ⭕
            </button>
            <button
              onClick={() => setSelectedTool('draw-rect')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-rect' ? 'bg-amber-500 text-slate-950 shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Desenhar Retângulo / Sala"
            >
              🔲
            </button>
            <button
              onClick={() => setSelectedTool('draw-text')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-text' ? 'bg-amber-500 text-slate-950 shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Anotação de Texto no Mapa"
            >
              📝
            </button>

            {/* Color Palette Pill */}
            <div className="w-full py-1 border-y border-slate-800/80 flex flex-wrap justify-center gap-1">
              {[
                { hex: '#f59e0b', title: 'Ouro / Dourado' },
                { hex: '#ef4444', title: 'Vermelho / Sangue' },
                { hex: '#06b6d4', title: 'Ciano / Mágico' },
                { hex: '#10b981', title: 'Esmeralda / Veneno' },
                { hex: '#a855f7', title: 'Roxo / Arcano' },
                { hex: '#ffffff', title: 'Branco / Giz' },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setDrawColor(c.hex)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                    drawColor === c.hex ? 'scale-125 border-white ring-1 ring-amber-400' : 'border-slate-700 hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.title}
                />
              ))}
            </div>

            <button
              onClick={() => setSelectedTool('draw-eraser')}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all cursor-pointer ${
                selectedTool === 'draw-eraser' ? 'bg-rose-500 text-white shadow-md scale-105' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Borracha (Clique ou arraste sobre os traços)"
            >
              🧹
            </button>
            <button
              onClick={() => broadcastDrawingAction?.({ action: 'undo' })}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-base hover:bg-slate-800 transition-all text-slate-300 hover:text-slate-100 cursor-pointer"
              title="Desfazer Último Traço"
            >
              ↩️
            </button>
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja apagar todos os desenhos do mapa?')) {
                  broadcastDrawingAction?.({ action: 'clear' });
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-base hover:bg-rose-900/50 transition-all text-rose-500 hover:text-rose-400 cursor-pointer"
              title="Limpar Todos os Desenhos"
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
            <Pencil className="w-4 h-4 text-amber-400" />
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
        combatants={allAvailableTokens}
        vectorWalls={vectorWalls}
        lightSources={lightSources}
        selectedTool={selectedTool}
        setSelectedTool={(t) => setSelectedTool(t as any)}
        selectedTileType="floor"
        selectedTokenCombatant={selectedTokenCombatant}
        measureStart={measureStart}
        setMeasureStart={setMeasureStart}
        setMeasuredDistance={setMeasuredDistance}
        onGridChange={handleGridChange}
        onAddLightSource={handleAddLightSource}
        onRemoveLightSource={handleRemoveLightSource}
        onUpdateLightSource={handleUpdateLightSource}
        drawings={drawings}
        onDrawingAction={broadcastDrawingAction}
        drawColor={drawColor}
        drawLineWidth={drawLineWidth}
        activeLevels={activeLevels}
        currentLevelId={activeLevelId}
        onTransitionAction={handleTransitionAction}
        onSaveTransitionWithTargetLevel={handleSaveTransitionWithTargetLevel}
        onUpdateVectorWalls={(newWalls) => {
          setVectorWalls(newWalls);
          broadcastToPlayerView({ vectorWalls: newWalls });
        }}
      />

      {/* ========================================================================= */}
      {/* TELA DE ABERTURA CINEMÁTICA DA MASMORRA (ANTES DE INICIAR A EXPLORAÇÃO)     */}
      {/* ========================================================================= */}
      {!isExplorationStarted && (activeDungeonCover || activeDungeonLore) && (
        <div className="absolute inset-0 z-40 bg-[#06080e]/95 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-3.5 animate-fade-in select-none overflow-hidden">
          {/* Fundo com Arte da Masmorra Desfocada */}
          {activeDungeonCover && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 filter blur-sm pointer-events-none"
              style={{ backgroundImage: `url(${normalizeImageUrl(activeDungeonCover)})` }}
            />
          )}

          {/* Card Central de Apresentação da Masmorra */}
          <div className="relative z-10 max-w-md sm:max-w-lg w-full max-h-full bg-[#0d121c]/95 border-2 border-amber-500/50 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl shadow-black flex flex-col gap-1.5 sm:gap-2 text-center items-center overflow-hidden">
            
            {/* Badge de Desafio D&D 5e */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/40 rounded-full text-amber-300 text-[9.5px] font-mono font-bold tracking-wider uppercase shrink-0">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>{activeDungeonCR}</span>
            </div>

            {/* Imagem de Capa em Destaque */}
            {activeDungeonCover && (
              <div className="w-full max-h-28 sm:max-h-36 aspect-[16/9] rounded-xl overflow-hidden border border-amber-500/30 shadow-md bg-black shrink-0">
                <img
                  src={normalizeImageUrl(activeDungeonCover)}
                  alt="Capa da Masmorra"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Título da Masmorra */}
            <div className="space-y-0.5 shrink-0">
              <h2 className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-wide font-serif drop-shadow-md">
                {activeCampaignMap?.title || 'Exploração de Masmorra'}
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-0.5" />
            </div>

            {/* Lore / Descrição Narrativa para o Mestre Ler */}
            {activeDungeonLore ? (
              <div className="w-full max-h-20 sm:max-h-24 overflow-y-auto custom-scrollbar p-2 bg-[#080b12] rounded-xl border border-amber-500/20 text-left flex-1 min-h-0">
                <p className="text-[10.5px] sm:text-xs text-amber-100 font-serif leading-relaxed italic">
                  "{activeDungeonLore}"
                </p>
              </div>
            ) : null}

            {/* Botão Central Épico: Iniciar Exploração */}
            <button
              type="button"
              onClick={handleStartExploration}
              className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-102 active:scale-95 cursor-pointer ring-1 ring-amber-300 shrink-0"
            >
              <Swords className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>⚔️ Iniciar Exploração da Masmorra</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL FLUTUANTE DE CAPA & LORE DA MASMORRA (CONSULTA A QUALQUER MOMENTO)   */}
      {/* ========================================================================= */}
      {showCoverModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="relative max-w-xl w-full bg-[#0d121c] border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#2a3449] pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-200">Dossier & Lore da Masmorra</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeDungeonCover && (
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden border border-amber-500/30 bg-black">
                <img
                  src={normalizeImageUrl(activeDungeonCover)}
                  alt="Capa da Masmorra"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">{activeDungeonCR}</span>
              <h4 className="text-base font-bold text-slate-100">{activeCampaignMap?.title || 'Masmorra'}</h4>
            </div>

            {activeDungeonLore && (
              <div className="p-3.5 bg-[#080b12] rounded-2xl border border-amber-500/20 max-h-48 overflow-y-auto custom-scrollbar">
                <p className="text-xs text-amber-100 font-serif leading-relaxed italic">
                  "{activeDungeonLore}"
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCoverModal(false)}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

