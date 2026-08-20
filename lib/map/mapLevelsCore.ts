import { MapLevel, MultiLevelGridData, WallSegment, LightSource } from '@/lib/types';

export function createInitialLevelGrid(cols = 80, rows = 80): any[][] {
  const grid: any[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: any[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        x: c,
        y: r,
        type: 'wall',
        fog: true,
      });
    }
    grid.push(row);
  }
  return grid;
}

export function createEmptyLevel(
  name: string,
  order: number,
  cols = 80,
  rows = 80
): MapLevel {
  const levelId = 'lvl-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  return {
    id: levelId,
    name: name || `Andar ${order >= 0 ? `+${order}` : order}`,
    order,
    grid: createInitialLevelGrid(cols, rows),
    bgImageUrl: null,
    gridScale: 40,
    gridOffsetX: 0,
    gridOffsetY: 0,
    vectorWalls: [],
    lightSources: [],
  };
}

export function duplicateLevel(
  sourceLevel: MapLevel,
  newName: string,
  newOrder: number,
  keepTokens = false
): MapLevel {
  const levelId = 'lvl-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  
  // Deep clone grid
  const clonedGrid = (sourceLevel.grid || []).map((row) =>
    row.map((cell) => ({
      ...cell,
      fog: true, // New floor starts covered in fog by default
      tokenName: keepTokens ? cell.tokenName : undefined,
      tokenColor: keepTokens ? cell.tokenColor : undefined,
    }))
  );

  // Deep clone vector walls
  const clonedWalls: WallSegment[] = (sourceLevel.vectorWalls || []).map((w) => ({
    ...w,
    id: 'wall-' + Math.random().toString(36).substring(2, 9),
  }));

  // Deep clone light sources
  const clonedLights: LightSource[] = (sourceLevel.lightSources || []).map((l) => ({
    ...l,
    id: 'light-' + Math.random().toString(36).substring(2, 9),
  }));

  return {
    id: levelId,
    name: newName,
    order: newOrder,
    grid: clonedGrid,
    bgImageUrl: sourceLevel.bgImageUrl || null,
    gridScale: sourceLevel.gridScale ?? 40,
    gridOffsetX: sourceLevel.gridOffsetX ?? 0,
    gridOffsetY: sourceLevel.gridOffsetY ?? 0,
    vectorWalls: clonedWalls,
    lightSources: clonedLights,
  };
}

export function normalizeToMultiLevel(
  rawGridData: any,
  defaultMapTitle?: string
): MultiLevelGridData {
  if (!rawGridData) {
    const defaultLvl = createEmptyLevel(defaultMapTitle || 'Térreo (Piso 0)', 0);
    return {
      version: 2,
      activeLevelId: defaultLvl.id,
      levels: [defaultLvl],
    };
  }

  // Already a valid multi-level structure
  if (Array.isArray(rawGridData.levels) && rawGridData.levels.length > 0) {
    const activeLevelId =
      rawGridData.activeLevelId &&
      rawGridData.levels.some((l: MapLevel) => l.id === rawGridData.activeLevelId)
        ? rawGridData.activeLevelId
        : rawGridData.levels[0].id;

    return {
      version: 2,
      activeLevelId,
      levels: [...rawGridData.levels].sort((a: MapLevel, b: MapLevel) => (a.order ?? 0) - (b.order ?? 0)),
    };
  }

  // Legacy single-grid map -> Convert to MultiLevel format
  const singleLevelId = 'lvl-default-0';
  const legacyGrid = rawGridData.grid || createInitialLevelGrid();
  const legacyLevel: MapLevel = {
    id: singleLevelId,
    name: defaultMapTitle || 'Piso Principal',
    order: 0,
    grid: legacyGrid,
    bgImageUrl: rawGridData.bgImageUrl || null,
    gridScale: rawGridData.gridScale ?? 40,
    gridOffsetX: rawGridData.gridOffsetX ?? 0,
    gridOffsetY: rawGridData.gridOffsetY ?? 0,
    vectorWalls: rawGridData.vectorWalls || [],
    lightSources: rawGridData.lightSources || [],
  };

  return {
    version: 2,
    activeLevelId: singleLevelId,
    levels: [legacyLevel],
  };
}
