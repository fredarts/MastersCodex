'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  Paintbrush, 
  Square,
  MapPin, 
  Upload,
  Ruler,
  Download,
  Trash2,
  Grid,
  Hand,
  Menu,
  Plus,
  X,
  Sparkles,
  Sun,
  Flame,
  FlameKindling,
  Lamp,
  Zap,
  Layers,
  Copy,
  Edit3,
  ChevronUp,
  ChevronDown
} from 'lucide-react';


import { Combatant, CampaignMap, MapLevel, MultiLevelGridData } from '@/lib/types';
import { normalizeToMultiLevel, createEmptyLevel, duplicateLevel } from '@/lib/map/mapLevelsCore';
import { useSession } from '@/context/SessionContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useCampaign } from '@/context/CampaignContext';
import { INITIAL_MONSTERS } from '@/lib/srd-data';
import { toast } from 'sonner';
import { storageService } from '@/lib/services/storageService';
import { DysonCanvas } from './map/DysonCanvas';
import { DungeonGeneratorModal } from './map/DungeonGeneratorModal';
import { MapMakerTopBar } from './map/MapMakerTopBar';
import { MapMakerToolbar, MapTool } from './map/MapMakerToolbar';
import { ToolSubBar } from './map/ToolSubBar';
import { MapManagerModal } from './map/MapManagerModal';
import { ParsedDungeonMap } from '@/lib/parsers/dungeonParser';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface MapMakerProps {
  combatants: Combatant[];
}

export type TileType = 
  | 'floor' 
  | 'wall' 
  | 'grass' 
  | 'water' 
  | 'door' 
  | 'trap' 
  | 'chest' 
  | 'stash'
  | 'trigger'
  | 'portcullis'
  | 'illusion_wall'
  | 'transition';

export type TransitionType = 'stairs_down' | 'stairs_up' | 'ladder' | 'portal' | 'doorway';

export interface DungeonTransitionConfig {
  id: string;
  name: string;
  type: TransitionType;
  targetLevelId: string;
  targetSpawnR?: number;
  targetSpawnC?: number;
  linkedTransitionId?: string;
  status?: 'open' | 'locked' | 'blocked';
  lockpickDC?: number;
  description?: string;
}

export type ContainerType = 'wooden_chest' | 'iron_chest' | 'ornate_chest' | 'hidden_stash' | 'mimic';
export type ContainerStatus = 'locked' | 'unlocked' | 'open' | 'looted';

import { CharacterEquipmentItem } from '@/lib/types';

export interface ChestLoot {
  gp?: number; // Peças de Ouro
  sp?: number; // Peças de Prata
  cp?: number; // Peças de Cobre
  pp?: number; // Peças de Platina
  items?: (string | CharacterEquipmentItem)[]; // Itens e poções (estruturados do Compêndio ou strings)
  notes?: string; // Cartas, pistas ou segredos
}

export interface ChestConfig {
  name: string;
  containerType: ContainerType;
  status: ContainerStatus;
  lockpickDC: number;
  breakDC: number;
  detectDC?: number; // CD Percepção/Investigação para esconderijos ou mímicos
  isTrapped?: boolean;
  trapDisarmDC?: number;
  trapDescription?: string;
  revealedToPlayers: boolean;
  loot?: ChestLoot;
}

export interface DoorConfig {
  id?: string;
  status: 'open' | 'closed';
  doorType: 'wooden' | 'iron' | 'stone' | 'secret';
  breakDC: number;
  lockpickDC: number;
  secretRevealed?: boolean;
}

export interface TrapConfig {
  trapType: string;
  detectDC: number;
  disarmDC: number;
  revealedToPlayers: boolean;
  description?: string;
}

export type TriggerType = 'lever' | 'pressure_plate' | 'chain' | 'button';
export type TriggerState = 'inactive' | 'active';

export interface TriggerConfig {
  id: string;                    // ID do gatilho (ex: "alavanca-sala-1")
  targetId: string;              // ID do elemento acionado (ex: "grade-sala-2")
  triggerType: TriggerType;
  state: TriggerState;
  name: string;
  isSecret?: boolean;
  detectDC?: number;
  revealedToPlayers?: boolean;
  description?: string;
}

export interface PortcullisConfig {
  id: string;                    // ID para conexão com gatilhos
  status: 'closed' | 'open';     // 'closed' = baixada (permite ver, bloqueia andar)
  liftDC?: number;               // CD Força / Atletismo para erguer manualmente
  material?: 'iron' | 'reinforced' | 'wood_bars';
  name?: string;
}

export interface IllusionWallConfig {
  id?: string;
  detectDC: number;              // CD Investigação para perceber a ilusão
  revealedToPlayers: boolean;    // Revelada aos jogadores
  blocksLight: boolean;          // Se a ilusão bloqueia luz até ser revelada
  description?: string;
}

export interface Cell {
  x: number;
  y: number;
  type: TileType;
  fog: boolean;
  tokenName?: string;
  tokenColor?: string;
  doorConfig?: DoorConfig;
  trapConfig?: TrapConfig;
  chestConfig?: ChestConfig;
  triggerConfig?: TriggerConfig;
  portcullisConfig?: PortcullisConfig;
  illusionWallConfig?: IllusionWallConfig;
  transitionConfig?: DungeonTransitionConfig;
}

const NPC_TEMPLATES: Combatant[] = [
  { id: 'npc-guard', name: 'Guarda', type: 'npc', hp: 11, maxHp: 11, ac: 16, initiative: 0, conditions: [] },
  { id: 'npc-mage', name: 'Mago', type: 'npc', hp: 40, maxHp: 40, ac: 12, initiative: 0, conditions: [] },
  { id: 'npc-bandit', name: 'Bandido', type: 'npc', hp: 11, maxHp: 11, ac: 12, initiative: 0, conditions: [] },
  { id: 'npc-commoner', name: 'Plebeu', type: 'npc', hp: 4, maxHp: 4, ac: 10, initiative: 0, conditions: [] },
  { id: 'npc-priest', name: 'Sacerdote', type: 'npc', hp: 27, maxHp: 27, ac: 13, initiative: 0, conditions: [] },
  { id: 'npc-knight', name: 'Cavaleiro', type: 'npc', hp: 52, maxHp: 52, ac: 18, initiative: 0, conditions: [] },
];

export const MapMaker: React.FC<MapMakerProps> = ({ combatants }) => {

  const createInitialGrid = (cols = 80, rows = 80): Cell[][] => {
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
    return grid;
  };

  const { 
    campaignMaps, 
    createCampaignMap, 
    updateCampaignMap, 
    deleteCampaignMap,
    activeScene
  } = useSession();
  const { activeCampaign, campaignMembers } = useCampaign();
  const { broadcastToPlayerView } = useLiveCockpit();
  const { showConfirm, showPrompt } = useCustomDialog();

  const [grid, setGrid] = useState<Cell[][]>(() => createInitialGrid());
  const [selectedTool, setSelectedTool] = useState<'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan' | 'light' | 'draw-pencil' | 'draw-circle' | 'draw-rect' | 'draw-eraser' | 'draw-text'>('fog-reveal');
  const [boxMode, setBoxMode] = useState<'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover'>('fill');
  const [selectedTileType, setSelectedTileType] = useState<TileType>('floor');
  const [selectedTokenCombatant, setSelectedTokenCombatant] = useState<Combatant | null>(null);
  const [selectedLightPreset, setSelectedLightPreset] = useState<'torch' | 'candle' | 'lantern' | 'spell' | 'dragon'>('torch');

  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokenCategoryTab, setTokenCategoryTab] = useState<'party' | 'monsters' | 'npcs'>('party');

  // Performance and layer rendering toggles for smooth drawing at 60 FPS
  const [renderLighting, setRenderLighting] = useState<boolean>(true);
  const [renderVision, setRenderVision] = useState<boolean>(true);
  const [renderFog, setRenderFog] = useState<boolean>(true);

  const getPartyTokens = (): Combatant[] => {
    const list: Combatant[] = [];
    const namesSeen = new Set<string>();

    // 1. Add active online combatants of type 'player'
    if (combatants) {
      combatants.forEach((c) => {
        if (c.type === 'player') {
          list.push(c);
          namesSeen.add(c.name.trim().toLowerCase());
        }
      });
    }

    // 2. Add campaign members of role 'player' if not already added
    if (campaignMembers) {
      campaignMembers.forEach((m) => {
        if (m.role === 'player' && m.characterName) {
          const nameClean = m.characterName.trim().toLowerCase();
          if (!namesSeen.has(nameClean)) {
            list.push({
              id: `pc-member-${m.id}`,
              name: m.characterName,
              type: 'player',
              hp: 20,
              maxHp: 20,
              ac: 10,
              initiative: 0,
              conditions: [],
              modelUrl: m.modelUrl || '',
            });
            namesSeen.add(nameClean);
          }
        }
      });
    }

    // 3. Fallback generic players if list is empty
    if (list.length === 0) {
      list.push(
        { id: 'gen-p1', name: 'P1', type: 'player', hp: 10, maxHp: 10, ac: 10, initiative: 0, conditions: [] },
        { id: 'gen-p2', name: 'P2', type: 'player', hp: 10, maxHp: 10, ac: 10, initiative: 0, conditions: [] }
      );
    }

    return list;
  };

  const getMonsterTokens = (): Combatant[] => {
    const list: Combatant[] = INITIAL_MONSTERS.map((m) => ({
      id: `mon-template-${m.id}`,
      name: m.name,
      type: 'monster' as const,
      hp: m.hp,
      maxHp: m.hp,
      ac: m.ac,
      initiative: 0,
      conditions: [],
      tokenImageUrl: m.tokenImageUrl,
      modelUrl: m.modelUrl,
      tokenType: m.tokenType,
    }));

    // Add active online combatants of type 'monster' if they aren't templates
    if (combatants) {
      combatants.forEach((c) => {
        if (c.type === 'monster') {
          const exists = list.some((l) => l.name.toLowerCase() === c.name.toLowerCase());
          if (!exists) {
            list.unshift(c);
          }
        }
      });
    }

    return list;
  };

  const getNPCTokens = (): Combatant[] => {
    const list: Combatant[] = [...NPC_TEMPLATES];

    // Add active online NPCs
    if (combatants) {
      combatants.forEach((c) => {
        if (c.type === 'npc') {
          const exists = list.some((l) => l.name.toLowerCase() === c.name.toLowerCase());
          if (!exists) {
            list.unshift(c);
          }
        }
      });
    }

    return list;
  };

  const getFilteredTokens = (): Combatant[] => {
    let tokens: Combatant[] = [];
    if (tokenCategoryTab === 'party') {
      tokens = getPartyTokens();
    } else if (tokenCategoryTab === 'monsters') {
      tokens = getMonsterTokens();
    } else {
      tokens = getNPCTokens();
    }

    if (tokenSearchQuery.trim()) {
      const q = tokenSearchQuery.toLowerCase();
      tokens = tokens.filter((t) => t.name.toLowerCase().includes(q));
    }

    return tokens;
  };
  
  // Custom Map Image Upload, Vector Walls, Lighting & Calibration state
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [vectorWalls, setVectorWalls] = useState<import('@/lib/types').WallSegment[]>([]);
  const [lightSources, setLightSources] = useState<import('@/lib/types').LightSource[]>([]);
  const [gridScale, setGridScale] = useState<number>(40); // Cell Size in px
  const [gridOffsetX, setGridOffsetX] = useState<number>(0);
  const [gridOffsetY, setGridOffsetY] = useState<number>(0);
  const [calibrationLine, setCalibrationLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uvttFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select first token when switching to the token tool
  useEffect(() => {
    if (selectedTool === 'token') {
      const displayTokens = getFilteredTokens();
      const currentExists = displayTokens.some((t) => t.id === selectedTokenCombatant?.id);
      if (!currentExists && displayTokens.length > 0) {
        setSelectedTokenCombatant(displayTokens[0]);
      }
    }
  }, [selectedTool, tokenCategoryTab, tokenSearchQuery]);

  const handleAddLightSource = (light: import('@/lib/types').LightSource) => {
    setLightSources((prev) => [...prev, light]);
    toast.success('Fonte de luz adicionada ao mapa!');
  };

  const handleRemoveLightSource = (id: string) => {
    setLightSources((prev) => prev.filter((l) => l.id !== id));
    toast.info('Fonte de luz removida.');
  };

  const handleUpdateLightSource = (updatedLight: import('@/lib/types').LightSource) => {
    setLightSources((prev) => prev.map((l) => (l.id === updatedLight.id ? updatedLight : l)));
  };


  // Measure Ruler State
  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);

  // Multi-map list and UI state
  const [activeMap, setActiveMap] = useState<CampaignMap | null>(null);
  const [mapTitle, setMapTitle] = useState('');
  const [isMapManagerModalOpen, setIsMapManagerModalOpen] = useState(false);

  // Multi-level / Floors state
  const [levels, setLevels] = useState<MapLevel[]>([]);
  const [activeLevelId, setActiveLevelId] = useState<string>('');

  // AI Dungeon Generator State
  const [isAIDungeonModalOpen, setIsAIDungeonModalOpen] = useState(false);

  // Handle creating a new map from MapManagerModal
  const handleCreateNewMap = async (title: string) => {
    const initialLevel = createEmptyLevel('Térreo (Piso 0)', 0);
    const multiPayload: MultiLevelGridData = {
      version: 2,
      activeLevelId: initialLevel.id,
      levels: [initialLevel],
      grid: initialLevel.grid,
      gridScale: 40,
      gridOffsetX: 0,
      gridOffsetY: 0,
    };
    const newMap = await createCampaignMap(title, multiPayload);
    if (newMap) {
      selectMap(newMap);
      toast.success(`Mapa "${title}" criado!`);
    }
  };

  const handleAIDungeonGenerated = async (
    generatedFloors: ParsedDungeonMap[],
    targetMode: 'current_floor' | 'append_floors' | 'new_map' = 'current_floor'
  ) => {
    if (generatedFloors.length === 0) return;

    if (targetMode === 'current_floor' && activeMap) {
      // 1. Apply primary generated floor directly to current active floor
      const floor1 = generatedFloors[0];
      setGrid(floor1.grid);
      setVectorWalls(floor1.vectorWalls || []);
      setLightSources(floor1.lightSources || []);
      setGridScale(40);
      setGridOffsetX(0);
      setGridOffsetY(0);

      let updatedLevels = levels.map((lvl) => {
        if (lvl.id === activeLevelId) {
          return {
            ...lvl,
            name: floor1.title || lvl.name,
            grid: floor1.grid,
            vectorWalls: floor1.vectorWalls || [],
            lightSources: floor1.lightSources || [],
            gridScale: 40,
            gridOffsetX: 0,
            gridOffsetY: 0,
          };
        }
        return lvl;
      });

      // If multiple floors were generated, append floors 2..N as extra floors in this same map
      for (let i = 1; i < generatedFloors.length; i++) {
        const floor = generatedFloors[i];
        const newLvl: MapLevel = {
          id: 'lvl-gen-' + i + '-' + Date.now().toString(36),
          name: floor.title || `Andar ${updatedLevels.length + 1}`,
          order: updatedLevels.length,
          grid: floor.grid,
          bgImageUrl: null,
          gridScale: 40,
          gridOffsetX: 0,
          gridOffsetY: 0,
          vectorWalls: floor.vectorWalls || [],
          lightSources: floor.lightSources || [],
        };
        updatedLevels.push(newLvl);
      }

      setLevels(updatedLevels);
      const currentLevelName = levels.find((l) => l.id === activeLevelId)?.name || 'atual';
      toast.success(
        generatedFloors.length === 1
          ? `Andar "${currentLevelName}" atualizado com a masmorra gerada pela IA!`
          : `Andar "${currentLevelName}" atualizado e mais ${generatedFloors.length - 1} andar(es) adicionado(s) à masmorra!`
      );
    } else if (targetMode === 'append_floors' && activeMap) {
      // 2. Append all generated floors as brand new levels to the active map
      const currentLevelSnapshot = levels.map((lvl) => {
        if (lvl.id === activeLevelId) {
          return {
            ...lvl,
            grid,
            bgImageUrl,
            vectorWalls,
            lightSources,
            gridScale,
            gridOffsetX,
            gridOffsetY,
          };
        }
        return lvl;
      });

      const newLevels: MapLevel[] = generatedFloors.map((floor, idx) => ({
        id: 'lvl-gen-' + idx + '-' + Date.now().toString(36),
        name: floor.title || `Andar ${currentLevelSnapshot.length + idx + 1}`,
        order: currentLevelSnapshot.length + idx,
        grid: floor.grid,
        bgImageUrl: null,
        gridScale: 40,
        gridOffsetX: 0,
        gridOffsetY: 0,
        vectorWalls: floor.vectorWalls || [],
        lightSources: floor.lightSources || [],
      }));

      const allLevels = [...currentLevelSnapshot, ...newLevels];
      setLevels(allLevels);
      const firstNew = newLevels[0];
      setActiveLevelId(firstNew.id);

      setGrid(firstNew.grid);
      setBgImageUrl(null);
      setVectorWalls(firstNew.vectorWalls || []);
      setLightSources(firstNew.lightSources || []);
      setGridScale(40);
      setGridOffsetX(0);
      setGridOffsetY(0);

      toast.success(`${generatedFloors.length} novo(s) andar(es) adicionado(s) à masmorra "${activeMap.title}"!`);
    } else {
      // 3. Create a whole new CampaignMap with the generated floors
      const mapTitleName = generatedFloors[0].title || `Masmorra IA ${campaignMaps.length + 1}`;
      const newLevels: MapLevel[] = generatedFloors.map((floor, idx) => ({
        id: 'lvl-gen-' + idx + '-' + Date.now().toString(36),
        name: floor.title || `Andar ${idx + 1}`,
        order: idx,
        grid: floor.grid,
        bgImageUrl: null,
        gridScale: 40,
        gridOffsetX: 0,
        gridOffsetY: 0,
        vectorWalls: floor.vectorWalls || [],
        lightSources: floor.lightSources || [],
      }));

      const multiPayload: MultiLevelGridData = {
        version: 2,
        activeLevelId: newLevels[0].id,
        levels: newLevels,
        grid: newLevels[0].grid,
        gridScale: 40,
        gridOffsetX: 0,
        gridOffsetY: 0,
        vectorWalls: newLevels[0].vectorWalls || [],
        lightSources: newLevels[0].lightSources || [],
      };

      const newMap = await createCampaignMap(mapTitleName, multiPayload);
      if (newMap) {
        selectMap(newMap);
        toast.success(`Nova masmorra "${mapTitleName}" criada com ${generatedFloors.length} andar(es)!`);
      }
    }
  };

  // Handle UVTT / Universal VTT file import (.df2vtt, .uvtt, .json)
  const handleUVTTUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const text = await file.text();
      const { parseUVTTData } = await import('@/lib/parsers/uvttParser');
      const parsed = parseUVTTData(text);

      if (parsed.imageSrc) {
        setBgImageUrl(parsed.imageSrc);
      }
      if (parsed.walls) {
        setVectorWalls(parsed.walls);
      }
      if (parsed.lights) {
        setLightSources(parsed.lights);
      }
      if (parsed.resolution?.pixelsPerGrid) {
        setGridScale(parsed.resolution.pixelsPerGrid);
      }

      toast.success(`Mapa UVTT importado! ${parsed.walls.length} paredes e ${parsed.lights.length} tochas detectadas.`);
    } catch (err) {
      console.error('Erro ao importar arquivo UVTT:', err);
      toast.error('Falha ao processar arquivo UVTT/Universal VTT.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveTransitionWithTargetLevel = (
    config: DungeonTransitionConfig,
    sourceR: number,
    sourceC: number,
    autoCreateLinked: boolean,
    linkedTargetInfo?: { targetLevelId: string; targetR: number; targetC: number; linkedTransitionId?: string }
  ) => {
    // 1. Update current grid
    setGrid((prev) => {
      const copy = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (copy[sourceR]?.[sourceC]) {
        copy[sourceR][sourceC].type = 'transition';
        copy[sourceR][sourceC].transitionConfig = config;
      }
      return copy;
    });

    if (!linkedTargetInfo?.targetLevelId || linkedTargetInfo.targetLevelId === activeLevelId) {
      return;
    }

    const targetLevelId = linkedTargetInfo.targetLevelId;
    const targetR = linkedTargetInfo.targetR;
    const targetC = linkedTargetInfo.targetC;

    // 2. Update destination level in state
    setLevels((prevLevels) => {
      return prevLevels.map((lvl) => {
        if (lvl.id === targetLevelId && lvl.grid) {
          const tGrid = lvl.grid.map((row) => row.map((cell) => ({ ...cell })));

          if (autoCreateLinked) {
            const reverseType: TransitionType =
              config.type === 'stairs_down' ? 'stairs_up' :
              (config.type === 'stairs_up' ? 'stairs_down' : config.type);

            const returnConfig: DungeonTransitionConfig = {
              id: `trans-${Math.random().toString(36).substring(2, 8)}`,
              name: `Retorno para ${levels.find((l) => l.id === activeLevelId)?.name || 'Andar Anterior'}`,
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

          return { ...lvl, grid: tGrid };
        }
        return lvl;
      });
    });
  };

  // Switch between floors/levels in memory (0ms latency, zero database fetch)
  const handleSwitchLevel = (targetLevelId: string) => {
    if (targetLevelId === activeLevelId) return;

    // Snapshot current active level into levels list
    const updatedLevels = levels.map((lvl) => {
      if (lvl.id === activeLevelId) {
        return {
          ...lvl,
          grid,
          bgImageUrl,
          vectorWalls,
          lightSources,
          gridScale,
          gridOffsetX,
          gridOffsetY,
        };
      }
      return lvl;
    });

    const target = updatedLevels.find((l) => l.id === targetLevelId);
    if (!target) return;

    setLevels(updatedLevels);
    setActiveLevelId(targetLevelId);

    // Load target floor into editor canvas state
    setGrid(target.grid || createInitialGrid(80, 80));
    setBgImageUrl(target.bgImageUrl || null);
    setVectorWalls(target.vectorWalls || []);
    setLightSources(target.lightSources || []);
    setGridScale(target.gridScale || 40);
    setGridOffsetX(target.gridOffsetX || 0);
    setGridOffsetY(target.gridOffsetY || 0);
  };

  // Add a new floor/level
  const handleAddLevel = async () => {
    const levelName = await showPrompt({
      title: 'Novo Andar / Nível',
      message: 'Digite o nome do andar (ex: Subsolo, Térreo, 1º Andar, Telhado):',
      defaultValue: `Andar ${levels.length + 1}`,
      confirmText: 'Criar Andar',
    });
    if (!levelName || !levelName.trim()) return;

    const duplicateCurrent = levels.length > 0 && await showConfirm({
      title: 'Copiar Estrutura do Andar Atual?',
      message: 'Deseja duplicar as paredes e o tamanho do grid do andar atual para este novo piso?',
      confirmText: 'Sim, duplicar paredes',
      cancelText: 'Não, criar em branco',
      variant: 'info',
    });

    const currentLevel = levels.find(l => l.id === activeLevelId);
    let newLevel: MapLevel;

    if (duplicateCurrent && currentLevel) {
      const activeSnapshot: MapLevel = {
        ...currentLevel,
        grid,
        bgImageUrl,
        vectorWalls,
        lightSources,
        gridScale,
        gridOffsetX,
        gridOffsetY,
      };
      newLevel = duplicateLevel(activeSnapshot, levelName.trim(), levels.length);
    } else {
      newLevel = createEmptyLevel(levelName.trim(), levels.length);
    }

    const updatedLevels = levels.map((lvl) => {
      if (lvl.id === activeLevelId) {
        return {
          ...lvl,
          grid,
          bgImageUrl,
          vectorWalls,
          lightSources,
          gridScale,
          gridOffsetX,
          gridOffsetY,
        };
      }
      return lvl;
    });

    updatedLevels.push(newLevel);
    setLevels(updatedLevels);
    setActiveLevelId(newLevel.id);

    setGrid(newLevel.grid);
    setBgImageUrl(newLevel.bgImageUrl || null);
    setVectorWalls(newLevel.vectorWalls || []);
    setLightSources(newLevel.lightSources || []);
    setGridScale(newLevel.gridScale || 40);
    setGridOffsetX(newLevel.gridOffsetX || 0);
    setGridOffsetY(newLevel.gridOffsetY || 0);

    toast.success(`Andar "${newLevel.name}" criado!`);
  };

  // Delete a level
  const handleDeleteLevel = async (levelId: string) => {
    if (levels.length <= 1) {
      toast.error('O mapa precisa conter pelo menos um andar.');
      return;
    }
    const toDelete = levels.find(l => l.id === levelId);
    if (!toDelete) return;

    const confirmed = await showConfirm({
      title: 'Excluir Andar',
      message: `Tem certeza que deseja excluir o andar "${toDelete.name}"? As paredes e salas deste nível serão removidas.`,
      confirmText: 'Excluir Andar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    const updated = levels.filter(l => l.id !== levelId);
    setLevels(updated);

    if (activeLevelId === levelId) {
      const nextActive = updated[0];
      setActiveLevelId(nextActive.id);
      setGrid(nextActive.grid || createInitialGrid(80, 80));
      setBgImageUrl(nextActive.bgImageUrl || null);
      setVectorWalls(nextActive.vectorWalls || []);
      setLightSources(nextActive.lightSources || []);
      setGridScale(nextActive.gridScale || 40);
      setGridOffsetX(nextActive.gridOffsetX || 0);
      setGridOffsetY(nextActive.gridOffsetY || 0);
    }
    toast.info(`Andar "${toDelete.name}" excluído.`);
  };

  // Rename a level
  const handleRenameLevel = async (levelId: string) => {
    const target = levels.find(l => l.id === levelId);
    if (!target) return;

    const newName = await showPrompt({
      title: 'Renomear Andar',
      message: 'Digite o novo nome para este andar:',
      defaultValue: target.name,
      confirmText: 'Renomear',
    });
    if (newName && newName.trim()) {
      setLevels(prev => prev.map(l => l.id === levelId ? { ...l, name: newName.trim() } : l));
      toast.success(`Andar renomeado para "${newName.trim()}".`);
    }
  };

  // Helper to switch active map
  const selectMap = (map: CampaignMap) => {
    setActiveMap(map);
    setMapTitle(map.title);
    const normalized = normalizeToMultiLevel(map.gridData, map.title);
    const normLevels = normalized.levels || [];
    setLevels(normLevels);
    const selectedLvlId = normalized.activeLevelId || normLevels[0]?.id || '';
    setActiveLevelId(selectedLvlId);

    const currLevel = normLevels.find(l => l.id === selectedLvlId) || normLevels[0];
    if (currLevel) {
      setGrid(currLevel.grid || createInitialGrid(80, 80));
      setBgImageUrl(currLevel.bgImageUrl || null);
      setVectorWalls(currLevel.vectorWalls || []);
      setLightSources(currLevel.lightSources || []);
      setGridScale(currLevel.gridScale || 40);
      setGridOffsetX(currLevel.gridOffsetX || 0);
      setGridOffsetY(currLevel.gridOffsetY || 0);
    }
  };

  // Sync first active map when campaignMaps loads
  useEffect(() => {
    if (campaignMaps.length > 0) {
      if (!activeMap) {
        const firstMap = campaignMaps[0];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        selectMap(firstMap);
      } else {
        const updated = campaignMaps.find(m => m.id === activeMap.id);
        if (!updated) {
          const firstMap = campaignMaps[0];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          selectMap(firstMap);
        }
      }
    }
  }, [campaignMaps, activeMap]);

  // Auto-create a default map if campaignMaps is completely empty
  const hasAutoCreated = useRef(false);
  useEffect(() => {
    if (campaignMaps.length === 0 && !hasAutoCreated.current) {
      hasAutoCreated.current = true;
      const initialLevel = createEmptyLevel('Térreo (Piso 0)', 0);
      const multiPayload: MultiLevelGridData = {
        version: 2,
        activeLevelId: initialLevel.id,
        levels: [initialLevel],
        grid: initialLevel.grid,
        gridScale: 40,
        gridOffsetX: 0,
        gridOffsetY: 0,
      };
      createCampaignMap('Masmorra Inicial', multiPayload).then((newMap) => {
        if (newMap) {
          selectMap(newMap);
        }
      });
    }
  }, [campaignMaps, createCampaignMap]);

  // Debounced auto-save to database (campaign_maps table)
  useEffect(() => {
    if (!activeMap) return;

    const delayDebounce = setTimeout(() => {
      const currentLevelSnapshot: MapLevel = {
        id: activeLevelId || 'lvl-default-0',
        name: levels.find(l => l.id === activeLevelId)?.name || 'Piso Principal',
        order: levels.find(l => l.id === activeLevelId)?.order ?? 0,
        grid,
        bgImageUrl,
        vectorWalls,
        lightSources,
        gridScale,
        gridOffsetX,
        gridOffsetY,
      };

      const updatedLevels = levels.length > 0
        ? levels.map(l => l.id === activeLevelId ? currentLevelSnapshot : l)
        : [currentLevelSnapshot];

      const multiLevelPayload: MultiLevelGridData = {
        version: 2,
        activeLevelId: activeLevelId || currentLevelSnapshot.id,
        levels: updatedLevels,
        // Legacy fallbacks for compatibility
        grid,
        bgImageUrl,
        vectorWalls,
        lightSources,
        gridScale,
        gridOffsetX,
        gridOffsetY,
      };

      updateCampaignMap(activeMap.id, mapTitle || activeMap.title, multiLevelPayload).then(() => {
        broadcastToPlayerView({
          mapData: {
            ...multiLevelPayload,
            activeMapId: activeMap.id,
            sceneId: activeScene?.id,
            currentLevelName: currentLevelSnapshot.name,
          }
        });
      }).catch((e) => {
        console.error('Auto-save CampaignMap failed:', e);
      });
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [grid, bgImageUrl, vectorWalls, lightSources, gridScale, gridOffsetX, gridOffsetY, activeMap, mapTitle, activeLevelId, levels, updateCampaignMap, broadcastToPlayerView, activeScene?.id]);


  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploadingImage(true);
        const publicUrl = await storageService.uploadAsset(file, 'scenes');
        
        // Load image to determine aspect ratio and calculate grid size
        const img = new window.Image();
        img.src = publicUrl;
        img.onload = () => {
          const MAX_SQUARES = 24;
          let cols = 12;
          let rows = 12;

          if (img.width && img.height) {
            if (img.width >= img.height) {
              cols = MAX_SQUARES;
              rows = Math.max(5, Math.round(MAX_SQUARES * (img.height / img.width)));
            } else {
              rows = MAX_SQUARES;
              cols = Math.max(5, Math.round(MAX_SQUARES * (img.width / img.height)));
            }
          }
          
          setGrid(createInitialGrid(cols, rows));
          setBgImageUrl(publicUrl);
          toast.info(`Grid ajustado para as dimensões do mapa (${cols}x${rows})`);
        };
      } catch (err) {
        console.error('Failed to upload map image:', err);
        toast.error('Falha ao enviar a imagem do mapa.');
      } finally {
        setIsUploadingImage(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const revealAllFog = () => {
    setGrid((prev) => prev.map((row) => row.map((cell) => ({ ...cell, fog: false }))));
  };

  const coverAllFog = () => {
    setGrid((prev) => prev.map((row) => row.map((cell) => ({ ...cell, fog: true }))));
  };

  const clearGridContent = async () => {
    const fullReset = await showConfirm({
      title: 'Resetar Grid Completo',
      message: 'Deseja limpar todo o mapa e resetar para um grid gigante de 80x80 células de rocha sólida?',
      confirmText: 'Resetar Tudo (80x80)',
      cancelText: 'Limpar apenas terreno',
      variant: 'warning',
    });

    if (fullReset) {
      setGrid(createInitialGrid(80, 80));
      toast.success("Grid resetado para 80x80 de rocha!");
    } else {
      const partialClear = await showConfirm({
        title: 'Limpar Terreno Atual',
        message: 'Deseja apenas limpar os terrenos desenhados no grid atual? (Mantendo o tamanho do grid atual)',
        confirmText: 'Limpar Terreno',
        cancelText: 'Cancelar',
        variant: 'info',
      });
      if (partialClear) {
        setGrid((prev) => prev.map((row) => row.map((cell) => ({
          ...cell,
          type: 'wall',
          fog: true,
          tokenName: undefined,
          tokenColor: undefined,
        }))));
        toast.info("Terreno do grid atual limpo.");
      }
    }
  };


  const clearMapBg = () => {
    setBgImageUrl(null);
    toast.info('Imagem de fundo removida.');
  };

  const handleManualSave = async () => {
    if (!activeMap) {
      toast.error('Nenhum mapa selecionado para salvar.');
      return;
    }
    const currentLevelSnapshot: MapLevel = {
      id: activeLevelId || 'lvl-default-0',
      name: levels.find(l => l.id === activeLevelId)?.name || 'Piso Principal',
      order: levels.find(l => l.id === activeLevelId)?.order ?? 0,
      grid,
      bgImageUrl,
      vectorWalls,
      lightSources,
      gridScale,
      gridOffsetX,
      gridOffsetY,
    };

    const updatedLevels = levels.length > 0
      ? levels.map(l => l.id === activeLevelId ? currentLevelSnapshot : l)
      : [currentLevelSnapshot];

    const multiLevelPayload: MultiLevelGridData = {
      version: 2,
      activeLevelId: activeLevelId || currentLevelSnapshot.id,
      levels: updatedLevels,
      grid,
      bgImageUrl,
      vectorWalls,
      lightSources,
      gridScale,
      gridOffsetX,
      gridOffsetY,
    };

    try {
      await updateCampaignMap(activeMap.id, mapTitle || activeMap.title, multiLevelPayload);
      broadcastToPlayerView({
        mapData: {
          ...multiLevelPayload,
          activeMapId: activeMap.id,
          sceneId: activeScene?.id,
          currentLevelName: currentLevelSnapshot.name,
        }
      });
      toast.success('Mapa e andares salvos com sucesso!');
    } catch (e) {
      toast.error(`Falha ao salvar o mapa: ${(e as Error).message}`);
    }
  };

  // Global keyboard shortcuts for tool switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'p' || key === 'b') {
        setSelectedTool('paint');
      } else if (key === 'r') {
        setSelectedTool('box');
      } else if (key === 'f') {
        setSelectedTool('fog-reveal');
      } else if (key === 'h') {
        setSelectedTool('fog-cover');
      } else if (key === 't') {
        setSelectedTool('token');
      } else if (key === 'l') {
        setSelectedTool('light');
      } else if (key === 'm') {
        setSelectedTool('measure');
        setMeasureStart(null);
      } else if (key === ' ' || key === 'v') {
        setSelectedTool('pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMap, mapTitle, activeLevelId, levels, grid, bgImageUrl, vectorWalls, lightSources, gridScale, gridOffsetX, gridOffsetY]);

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none relative w-full h-full">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        ref={uvttFileInputRef}
        type="file"
        accept=".df2vtt,.uvtt,.json"
        onChange={handleUVTTUpload}
        className="hidden"
      />

      {/* TOP BAR */}
      <MapMakerTopBar
        mapTitle={mapTitle}
        onMapTitleChange={setMapTitle}
        levels={levels}
        activeLevelId={activeLevelId}
        onSwitchLevel={handleSwitchLevel}
        onAddLevel={handleAddLevel}
        onRenameLevel={handleRenameLevel}
        onDeleteLevel={handleDeleteLevel}
        onOpenMapManager={() => setIsMapManagerModalOpen(true)}
        onOpenAIDungeonModal={() => setIsAIDungeonModalOpen(true)}
        onUploadImage={() => fileInputRef.current?.click()}
        onUploadUVTT={() => uvttFileInputRef.current?.click()}
        onRemoveBackground={clearMapBg}
        onCalibrateGrid={() => setSelectedTool('calibrate')}
        onRevealAllFog={revealAllFog}
        onCoverAllFog={coverAllFog}
        onClearGrid={clearGridContent}
        onManualSave={handleManualSave}
        hasBackgroundImage={Boolean(bgImageUrl)}
        totalMapsCount={campaignMaps.length}
        renderLighting={renderLighting}
        onToggleLighting={() => setRenderLighting((p) => !p)}
        renderVision={renderVision}
        onToggleVision={() => setRenderVision((p) => !p)}
        renderFog={renderFog}
        onToggleFog={() => setRenderFog((p) => !p)}
      />

      {/* CANVAS & WORKSPACE AREA */}
      <div className="flex-1 min-w-0 relative h-full w-full overflow-hidden">
        {/* Vertical Toolbar (Photoshop style) */}
        <MapMakerToolbar
          selectedTool={selectedTool}
          onSelectTool={(tool) => {
            setSelectedTool(tool);
            if (tool === 'measure') setMeasureStart(null);
          }}
          hasBackgroundImage={Boolean(bgImageUrl)}
        />

        {/* Contextual Sub-bar for selected tool */}
        <ToolSubBar
          selectedTool={selectedTool}
          selectedTileType={selectedTileType}
          onSelectTileType={setSelectedTileType}
          boxMode={boxMode}
          onSelectBoxMode={setBoxMode}
          selectedLightPreset={selectedLightPreset}
          onSelectLightPreset={setSelectedLightPreset}
          tokenCategoryTab={tokenCategoryTab}
          onSelectTokenCategoryTab={setTokenCategoryTab}
          tokenSearchQuery={tokenSearchQuery}
          onTokenSearchQueryChange={setTokenSearchQuery}
          filteredTokens={getFilteredTokens()}
          selectedTokenCombatant={selectedTokenCombatant}
          onSelectTokenCombatant={setSelectedTokenCombatant}
          gridScale={gridScale}
          onGridScaleChange={setGridScale}
          gridOffsetX={gridOffsetX}
          onGridOffsetXChange={setGridOffsetX}
          gridOffsetY={gridOffsetY}
          onGridOffsetYChange={setGridOffsetY}
          onResetCalibration={() => { setGridOffsetX(0); setGridOffsetY(0); setGridScale(40); }}
        />

        {/* Main Dyson Canvas Render */}
        <DysonCanvas
          key={activeMap?.id || 'empty'}
          grid={grid}
          bgImageUrl={bgImageUrl}
          vectorWalls={vectorWalls}
          lightSources={lightSources}
          onAddLightSource={handleAddLightSource}
          onRemoveLightSource={handleRemoveLightSource}
          onUpdateLightSource={handleUpdateLightSource}
          selectedLightPreset={selectedLightPreset}
          gridScale={gridScale}
          gridOffsetX={gridOffsetX}
          gridOffsetY={gridOffsetY}
          combatants={combatants}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          boxMode={boxMode}
          selectedTileType={selectedTileType}
          selectedTokenCombatant={selectedTokenCombatant}
          measureStart={measureStart}
          setMeasureStart={setMeasureStart}
          setMeasuredDistance={setMeasuredDistance}
          onGridChange={setGrid}
          calibrationLine={calibrationLine}
          setCalibrationLine={setCalibrationLine}
          onCalibrateGridSize={(size) => {
            setGridScale(size);
            toast.success(`Grid recalibrado para ${size}px por célula!`);
          }}
          activeLevels={levels}
          currentLevelId={activeLevelId}
          onSaveTransitionWithTargetLevel={handleSaveTransitionWithTargetLevel}
          renderLighting={renderLighting}
          renderVision={renderVision}
          renderFog={renderFog}
        />

        {/* Modals */}
        <MapManagerModal
          isOpen={isMapManagerModalOpen}
          onClose={() => setIsMapManagerModalOpen(false)}
          campaignMaps={campaignMaps}
          activeMapId={activeMap?.id || null}
          onSelectMap={selectMap}
          onCreateMap={handleCreateNewMap}
          onDeleteMap={deleteCampaignMap}
        />

        <DungeonGeneratorModal
          isOpen={isAIDungeonModalOpen}
          onClose={() => setIsAIDungeonModalOpen(false)}
          onDungeonGenerated={handleAIDungeonGenerated}
          currentLevelName={levels.find((l) => l.id === activeLevelId)?.name}
          hasActiveMap={Boolean(activeMap)}
        />
      </div>
    </div>
  );
};


