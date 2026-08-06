import { Cell, TileType } from '@/components/MapMaker';
import { LightSource, WallSegment, LightAnimationType } from '@/lib/types';
import { AIDungeonOutput } from '@/lib/ai/dungeon-generator';

export interface ParsedDungeonMap {
  grid: Cell[][];
  lightSources: LightSource[];
  vectorWalls: WallSegment[];
  cols: number;
  rows: number;
  title: string;
  description: string;
}

interface RoomBounds {
  startCol: number;
  startRow: number;
  width: number;
  height: number;
}

function extractRoomBounds(room: any): RoomBounds | null {
  if (!room) return null;
  const b = room.bounds || room;

  const startCol = b.startCol ?? b.col ?? b.x ?? b.startX ?? b.left ?? room.startCol ?? room.col ?? room.x;
  const startRow = b.startRow ?? b.row ?? b.y ?? b.startY ?? b.top ?? room.startRow ?? room.row ?? room.y;
  const width = b.width ?? b.w ?? b.cols ?? b.sizeX ?? room.width ?? room.w;
  const height = b.height ?? b.h ?? b.rows ?? b.sizeY ?? room.height ?? room.h;

  if (
    typeof startCol === 'number' &&
    typeof startRow === 'number' &&
    typeof width === 'number' &&
    typeof height === 'number' &&
    !isNaN(startCol) &&
    !isNaN(startRow) &&
    !isNaN(width) &&
    !isNaN(height)
  ) {
    return {
      startCol: Math.max(0, Math.floor(startCol)),
      startRow: Math.max(0, Math.floor(startRow)),
      width: Math.max(1, Math.floor(width)),
      height: Math.max(1, Math.floor(height)),
    };
  }
  return null;
}

export function parseAIDungeonToMapData(aiOutput: AIDungeonOutput): ParsedDungeonMap {
  const cols = Math.max(20, aiOutput.gridSize?.cols || 80);
  const rows = Math.max(20, aiOutput.gridSize?.rows || 80);

  // 1. Initialize grid with solid walls covered in fog
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
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

  // Helper to carve a rectangular room/corridor area with optional inner pillars
  const carveArea = (b: RoomBounds, tileType: TileType, hasPillars: boolean = false) => {
    const endC = Math.min(cols - 1, b.startCol + b.width);
    const endR = Math.min(rows - 1, b.startRow + b.height);

    for (let r = Math.max(0, b.startRow); r < endR; r++) {
      for (let c = Math.max(0, b.startCol); c < endC; c++) {
        if (hasPillars && b.width >= 7 && b.height >= 5) {
          const relR = r - b.startRow;
          const relC = c - b.startCol;
          const isInnerPillar =
            relR >= 2 &&
            relR <= b.height - 3 &&
            relC >= 2 &&
            relC <= b.width - 3 &&
            relR % 3 === 0 &&
            relC % 3 === 0;

          if (isInnerPillar) {
            grid[r][c].type = 'wall';
            continue;
          }
        }

        grid[r][c].type = tileType;
      }
    }
  };

  // 2. Carve out rooms
  if (aiOutput.rooms && Array.isArray(aiOutput.rooms)) {
    for (const room of aiOutput.rooms) {
      const bounds = extractRoomBounds(room);
      if (bounds) {
        const tileType: TileType = (room.floorTileType as TileType) || 'floor';
        carveArea(bounds, tileType, Boolean(room.hasPillars));
      }
    }
  }

  // 2b. Carve out corridors if defined separately
  if (aiOutput.corridors && Array.isArray(aiOutput.corridors)) {
    for (const corr of aiOutput.corridors) {
      const bounds = extractRoomBounds(corr);
      if (bounds) {
        const tileType: TileType = (corr.floorTileType as TileType) || 'floor';
        carveArea(bounds, tileType);
      }
    }
  }

  // 3. Place elements (doors, chests, traps, portcullis, levers, illusion walls, stairs)
  if (aiOutput.elements && Array.isArray(aiOutput.elements)) {
    for (const el of aiOutput.elements) {
      const c = el.col;
      const r = el.row;

      if (typeof c !== 'number' || typeof r !== 'number' || isNaN(c) || isNaN(r)) continue;
      if (r < 0 || r >= rows || c < 0 || c >= cols) continue;

      const cell = grid[r][c];
      const cfg = el.config || {};

      // If cell was an uncarved wall, turn it into a floor so element icons don't sit on wall shading
      if (cell.type === 'wall') {
        cell.type = 'floor';
      }

      switch (el.type) {
        case 'door':
          cell.type = 'door';
          cell.doorConfig = {
            status: cfg.status === 'open' ? 'open' : 'closed',
            doorType: 'wooden',
            breakDC: 15,
            lockpickDC: cfg.dc || 12,
          };
          break;

        case 'portcullis':
          cell.type = 'portcullis';
          cell.portcullisConfig = {
            id: cfg.triggerId || `portcullis_${r}_${c}`,
            status: cfg.status === 'open' ? 'open' : 'closed',
            liftDC: cfg.dc || 18,
            name: 'Grade de Ferro',
            material: 'iron',
          };
          break;

        case 'trigger':
          cell.type = 'trigger';
          cell.triggerConfig = {
            id: cfg.triggerId || `trigger_${r}_${c}`,
            targetId: cfg.targetId || cfg.triggerId || `portcullis_${r}_${c}`,
            triggerType: 'lever',
            state: 'inactive',
            name: 'Alavanca de Ferro',
            description: cfg.description || cfg.notesForDM || 'Alavanca presa à parede',
            revealedToPlayers: true,
          };
          break;

        case 'chest':
          cell.type = 'chest';
          cell.chestConfig = {
            name: 'Baú de Tesouro',
            containerType: 'wooden_chest',
            status: cfg.status === 'locked' ? 'locked' : 'unlocked',
            lockpickDC: cfg.dc || 15,
            breakDC: 14,
            revealedToPlayers: false,
            isTrapped: Boolean(cfg.dc && cfg.dc > 14),
            trapDisarmDC: 14,
            trapDescription: 'Armadilha de agulha envenenada',
            loot: {
              gp: 50,
              items: cfg.lootItems || ['Poção de Cura Minor'],
              notes: cfg.description,
            },
          };
          break;

        case 'stash':
          cell.type = 'stash';
          cell.chestConfig = {
            name: 'Esconderijo Secreto',
            containerType: 'hidden_stash',
            status: 'unlocked',
            lockpickDC: 10,
            breakDC: 10,
            detectDC: cfg.dc || 14,
            revealedToPlayers: false,
            loot: {
              gp: 25,
              items: cfg.lootItems || ['Gema de Jaspe', 'Pergaminho Mágico'],
            },
          };
          break;

        case 'trap':
          cell.type = 'trap';
          cell.trapConfig = {
            trapType: 'Armadilha de Estacas',
            detectDC: cfg.dc || 13,
            disarmDC: cfg.dc || 13,
            revealedToPlayers: false,
            description: cfg.description || 'Estacas de ferro ocultas no piso',
          };
          break;

        case 'illusion_wall':
          cell.type = 'illusion_wall';
          cell.illusionWallConfig = {
            detectDC: cfg.dc || 15,
            revealedToPlayers: false,
            blocksLight: true,
            description: cfg.description || 'Parede ilusória que esconde uma passagem secreta',
          };
          break;
      }
    }
  }

  // 4. Generate Light Sources
  const lightSources: LightSource[] = [];
  if (aiOutput.lightSources && Array.isArray(aiOutput.lightSources)) {
    for (let i = 0; i < aiOutput.lightSources.length; i++) {
      const ls = aiOutput.lightSources[i];
      if (typeof ls.col !== 'number' || typeof ls.row !== 'number' || isNaN(ls.col) || isNaN(ls.row)) continue;
      if (ls.row < 0 || ls.row >= rows || ls.col < 0 || ls.col >= cols) continue;

      const x = (ls.col + 0.5) * 40; // 40px cell scale
      const y = (ls.row + 0.5) * 40;

      let color = ls.color;
      let animation: LightAnimationType = 'torch';
      let brightRadius = ls.radius ? ls.radius * 5 : 20;
      let dimRadius = ls.radius ? ls.radius * 10 : 40;

      switch (ls.preset) {
        case 'candle':
          color = color || '#ffaa33';
          animation = 'candle';
          brightRadius = brightRadius || 10;
          dimRadius = dimRadius || 20;
          break;
        case 'lantern':
          color = color || '#ffee77';
          animation = 'none';
          brightRadius = brightRadius || 30;
          dimRadius = dimRadius || 60;
          break;
        case 'brazier':
          color = color || '#ff4400';
          animation = 'pulse';
          brightRadius = brightRadius || 25;
          dimRadius = dimRadius || 50;
          break;
        case 'spell':
          color = color || '#00ccff';
          animation = 'chroma';
          brightRadius = brightRadius || 20;
          dimRadius = dimRadius || 40;
          break;
        case 'torch':
        default:
          color = color || '#ff9900';
          animation = 'torch';
          brightRadius = brightRadius || 20;
          dimRadius = dimRadius || 40;
          break;
      }

      lightSources.push({
        id: `light-ai-${i}-${Math.random().toString(36).substring(2, 7)}`,
        x,
        y,
        brightRadius,
        dimRadius,
        color,
        intensity: 0.9,
        animation,
      });
    }
  }

  // 5. Generate Vector Walls for DysonCanvas rendering and Line of Sight
  const vectorWalls: WallSegment[] = [];
  const CELL_SIZE = 40;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'wall') continue;

      // Check North border
      if (r === 0 || grid[r - 1][c].type === 'wall') {
        vectorWalls.push({
          id: `w_n_${r}_${c}`,
          x1: c * CELL_SIZE,
          y1: r * CELL_SIZE,
          x2: (c + 1) * CELL_SIZE,
          y2: r * CELL_SIZE,
          type: 'wall',
          blocksLight: true,
          blocksVision: true,
          blocksMovement: true,
        });
      }
      // Check South border
      if (r === rows - 1 || grid[r + 1][c].type === 'wall') {
        vectorWalls.push({
          id: `w_s_${r}_${c}`,
          x1: c * CELL_SIZE,
          y1: (r + 1) * CELL_SIZE,
          x2: (c + 1) * CELL_SIZE,
          y2: (r + 1) * CELL_SIZE,
          type: 'wall',
          blocksLight: true,
          blocksVision: true,
          blocksMovement: true,
        });
      }
      // Check West border
      if (c === 0 || grid[r][c - 1].type === 'wall') {
        vectorWalls.push({
          id: `w_w_${r}_${c}`,
          x1: c * CELL_SIZE,
          y1: r * CELL_SIZE,
          x2: c * CELL_SIZE,
          y2: (r + 1) * CELL_SIZE,
          type: 'wall',
          blocksLight: true,
          blocksVision: true,
          blocksMovement: true,
        });
      }
      // Check East border
      if (c === cols - 1 || grid[r][c + 1].type === 'wall') {
        vectorWalls.push({
          id: `w_e_${r}_${c}`,
          x1: (c + 1) * CELL_SIZE,
          y1: r * CELL_SIZE,
          x2: (c + 1) * CELL_SIZE,
          y2: (r + 1) * CELL_SIZE,
          type: 'wall',
          blocksLight: true,
          blocksVision: true,
          blocksMovement: true,
        });
      }
    }
  }

  return {
    grid,
    lightSources,
    vectorWalls,
    cols,
    rows,
    title: aiOutput.metadata?.title || 'Masmorra Gerada por IA',
    description: aiOutput.metadata?.description || 'Uma misteriosa masmorra criada procedimentalmente por IA.',
  };
}
