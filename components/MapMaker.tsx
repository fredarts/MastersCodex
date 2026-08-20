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
  | 'illusion_wall';

export type ContainerType = 'wooden_chest' | 'iron_chest' | 'ornate_chest' | 'hidden_stash' | 'mimic';
export type ContainerStatus = 'locked' | 'unlocked' | 'open' | 'looted';

export interface ChestLoot {
  gp?: number; // Peças de Ouro
  sp?: number; // Peças de Prata
  cp?: number; // Peças de Cobre
  pp?: number; // Peças de Platina
  items?: string[]; // Itens e poções
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


  // Measure Ruler State
  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);

  // Multi-map list and UI state
  const [activeMap, setActiveMap] = useState<CampaignMap | null>(null);
  const [mapTitle, setMapTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Multi-level / Floors state
  const [levels, setLevels] = useState<MapLevel[]>([]);
  const [activeLevelId, setActiveLevelId] = useState<string>('');

  // AI Dungeon Generator State
  const [isAIDungeonModalOpen, setIsAIDungeonModalOpen] = useState(false);

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
  };

  const handleManualSave = async () => {
    if (!activeMap) {
      toast.error('Nenhum mapa selecionado para salvar.');
      return;
    }
    const payload = { 
      grid, 
      bgImageUrl, 
      gridScale, 
      gridOffsetX, 
      gridOffsetY 
    };
    try {
      await updateCampaignMap(activeMap.id, mapTitle || activeMap.title, payload);
      broadcastToPlayerView({
        mapData: {
          ...payload,
          activeMapId: activeMap.id,
          sceneId: activeScene?.id,
        }
      });
      toast.success('Mapa salvo com sucesso!');
    } catch (e) {
      toast.error(`Falha ao salvar o mapa: ${(e as Error).message}`);
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-row overflow-hidden select-none relative w-full h-full">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Sidebar Drawer */}
      <div 
        className={`bg-[#0f141d] border-r border-[#2a3449] flex flex-col h-full transition-all duration-300 z-20 shadow-2xl relative shrink-0 ${
          isSidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="p-4 border-b border-[#2a3449] flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Grid className="w-4 h-4 text-cyan-400" />
            Dungeon Forge
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 select-none scrollbar-thin scrollbar-thumb-slate-800">
           {/* Section 1: Map Files list */}
           <div className="space-y-2">
             <div className="flex items-center justify-between">
               <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Meus Mapas</span>
               <button
                 onClick={async () => {
                   const title = await showPrompt({
                     title: 'Novo Mapa',
                     message: 'Digite o nome para o novo mapa:',
                     defaultValue: `Masmorra ${campaignMaps.length + 1}`,
                     placeholder: 'Ex: Catacumbas Escuras',
                     confirmText: 'Criar Mapa',
                   });
                   if (title && title.trim()) {
                     createCampaignMap(title.trim(), {
                       grid: createInitialGrid(80, 80),
                       gridScale: 40,
                       gridOffsetX: 0,
                       gridOffsetY: 0
                     }).then((newMap) => {
                       if (newMap) selectMap(newMap);
                     });
                   }
                 }}
                 className="p-1 bg-[#1a2234] hover:bg-cyan-500/20 text-cyan-400 text-[10px] rounded border border-cyan-500/20 flex items-center gap-1 transition-all"
               >
                 <Plus className="w-3 h-3" /> Novo
               </button>
             </div>

             <div className="space-y-1 max-h-[140px] overflow-y-auto border border-[#2a3449]/50 rounded-lg p-1.5 bg-[#0a0d14]/50">
               {campaignMaps.length === 0 ? (
                 <div className="text-[11px] text-slate-500 text-center py-4">Nenhum mapa salvo.</div>
               ) : (
                 campaignMaps.map((m) => (
                   <div 
                     key={m.id}
                     onClick={() => selectMap(m)}
                     className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-all group text-xs ${
                       activeMap?.id === m.id 
                         ? 'bg-cyan-500/10 text-cyan-300 font-bold border border-cyan-500/30' 
                         : 'text-slate-400 hover:bg-[#1a2234] hover:text-slate-200'
                     }`}
                   >
                     <span className="truncate pr-2">{m.title}</span>
                     {campaignMaps.length > 1 && (
                       <button
                         onClick={async (e) => {
                           e.stopPropagation();
                           const confirmed = await showConfirm({
                             title: 'Deletar Mapa',
                             message: `Deseja deletar o mapa "${m.title}"? Esta ação é irreversível.`,
                             confirmText: 'Deletar',
                             cancelText: 'Cancelar',
                             variant: 'danger',
                           });
                           if (confirmed) {
                             deleteCampaignMap(m.id);
                           }
                         }}
                         className="opacity-0 group-hover:opacity-100 p-0.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-all"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {activeMap && (
              <>
                {/* Section 2: Active map title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Título do Mapa Ativo</label>
                  <input 
                    type="text"
                    value={mapTitle}
                    onChange={(e) => setMapTitle(e.target.value)}
                    placeholder="Ex: Masmorra do Dragão"
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-semibold"
                  />
                </div>

                {/* Section 2.5: Andares / Níveis de Cena */}
                <div className="space-y-2 p-2.5 bg-[#0a0d14]/70 border border-[#2a3449]/60 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      Andares ({levels.length})
                    </span>
                    <button
                      onClick={handleAddLevel}
                      className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] rounded border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
                      title="Adicionar novo piso/andar"
                    >
                      <Plus className="w-3 h-3" /> Andar
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[160px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-slate-800">
                    {levels.map((lvl, idx) => {
                      const isActive = lvl.id === activeLevelId;
                      return (
                        <div
                          key={lvl.id}
                          onClick={() => handleSwitchLevel(lvl.id)}
                          className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all text-xs group border ${
                            isActive
                              ? 'bg-amber-500/20 text-amber-300 font-bold border-amber-500/40'
                              : 'bg-[#121824]/60 text-slate-400 border-transparent hover:bg-[#1a2234] hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                              P{idx}
                            </span>
                            <span className="truncate">{lvl.name}</span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameLevel(lvl.id);
                              }}
                              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-cyan-950/40"
                              title="Renomear andar"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            {levels.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLevel(lvl.id);
                                }}
                                className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40"
                                title="Excluir andar"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Tools Selectors */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ferramentas de Edição</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedTool('paint')}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'paint'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" />
                      Pintar
                    </button>
                    <button
                      onClick={() => setSelectedTool('box')}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'box'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                      }`}
                    >
                      <Square className="w-3.5 h-3.5" />
                      Retângulo
                    </button>
                    <button
                      onClick={() => setSelectedTool('fog-reveal')}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'fog-reveal'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Revelar Fog
                    </button>
                    <button
                      onClick={() => setSelectedTool('fog-cover')}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'fog-cover'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Ocultar Fog
                    </button>
                    <button
                      onClick={() => setSelectedTool('token')}
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'token'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
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
                      className={`flex items-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'measure'
                          ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      Régua
                    </button>
                    <button
                      onClick={() => setSelectedTool('light')}
                      className={`col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'light'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-amber-400 hover:bg-[#161c28] border-amber-500/30'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      💡 Pintar Fontes de Luz
                    </button>
                    <button
                      onClick={() => setSelectedTool('pan')}
                      className={`col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                        selectedTool === 'pan'
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                          : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                      }`}
                    >
                      <Hand className="w-3.5 h-3.5" />
                      Mover
                    </button>


                   {bgImageUrl && (
                     <button
                       onClick={() => setSelectedTool('calibrate')}
                       className={`col-span-2 flex items-center justify-center gap-1.5 p-2 rounded-lg text-[11px] font-semibold transition-all border ${
                         selectedTool === 'calibrate'
                           ? 'bg-rose-500 text-slate-950 font-bold border-rose-400 shadow'
                           : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                       }`}
                     >
                       <Grid className="w-3.5 h-3.5" />
                       Calibrar Grid Fundo
                     </button>
                   )}
                 </div>
               </div>

               {/* Section 3.B: Light Preset Selector */}
               {selectedTool === 'light' && (
                 <div className="space-y-2 border-t border-amber-500/30 pt-3 bg-amber-950/20 p-2.5 rounded-lg">
                   <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                     <Sun className="w-3 h-3 text-amber-400" />
                     Selecione o Tipo de Luz:
                   </span>
                   <div className="grid grid-cols-2 gap-1.5">
                     {[
                       { id: 'torch', label: 'Tocha (20/40ft)', color: '#ffaa33', icon: Flame },
                       { id: 'candle', label: 'Vela (10/20ft)', color: '#ffcc66', icon: FlameKindling },
                       { id: 'lantern', label: 'Lampião (30/60ft)', color: '#ffee88', icon: Lamp },
                       { id: 'spell', label: 'Magia Az. (20/40ft)', color: '#38bdf8', icon: Zap },
                       { id: 'dragon', label: 'Brazeiro (30/60ft)', color: '#ef4444', icon: Flame },
                     ].map((preset) => {
                       const IconComponent = preset.icon;
                       const isSelected = selectedLightPreset === preset.id;
                       return (
                         <button
                           key={preset.id}
                           onClick={() => setSelectedLightPreset(preset.id as any)}
                           className={`flex items-center gap-1.5 p-2 rounded-lg text-[10px] font-semibold transition-all border ${
                             isSelected
                               ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow'
                               : 'bg-[#0a0d14] text-slate-300 hover:bg-[#161c28] border-[#2a3449]'
                           }`}
                         >
                           <IconComponent className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-slate-950' : ''}`} style={{ color: isSelected ? undefined : preset.color }} />
                           <span className="truncate">{preset.label}</span>
                         </button>
                       );
                     })}
                   </div>
                   <p className="text-[9px] text-slate-400 italic">
                     Clique em qualquer ponto do mapa para posicionar a luz. Clique em uma luz existente para removê-la.
                   </p>
                 </div>
               )}


               {/* Section 4: Global Actions */}
               <div className="space-y-2 border-t border-[#2a3449]/40 pt-4">
                 <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ações Globais</span>
                 <div className="flex flex-col gap-2">
                   <button
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isUploadingImage}
                     className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#1a2234] hover:bg-[#25314a] text-purple-300 border border-purple-500/20 px-3 py-2 rounded-lg font-semibold transition-all"
                   >
                     <Upload className="w-3.5 h-3.5" />
                     {isUploadingImage ? 'Enviando...' : 'Carregar Imagem (Fundo)'}
                   </button>
                   
                   <button
                     onClick={() => uvttFileInputRef.current?.click()}
                     disabled={isUploadingImage}
                     className="w-full flex items-center justify-center gap-1.5 text-xs bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-lg font-bold transition-all shadow-md"
                   >
                     <Upload className="w-3.5 h-3.5" />
                     Importar UVTT (.df2vtt / .uvtt)
                   </button>

                   <button
                     onClick={() => setIsAIDungeonModalOpen(true)}
                     className="w-full flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                   >
                     <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                     Gerar Masmorra com IA
                   </button>

                   {bgImageUrl && (
                     <button
                       onClick={clearMapBg}
                       className="w-full flex items-center justify-center gap-1.5 text-xs bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border border-rose-500/20 px-3 py-2 rounded-lg font-semibold transition-all"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                       Remover Fundo
                     </button>
                   )}

                   <button
                     onClick={handleManualSave}
                     className="w-full flex items-center justify-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-lg transition-all"
                   >
                     <Download className="w-3.5 h-3.5" /> Salvar Alterações
                   </button>

                   <div className="grid grid-cols-2 gap-1.5">
                     <button
                       onClick={revealAllFog}
                       className="text-[10px] bg-[#0a0d14] hover:bg-[#161c28] text-slate-300 border border-[#2a3449] py-1.5 rounded-md transition-all font-semibold"
                     >
                       Revelar Tudo
                     </button>
                     <button
                       onClick={coverAllFog}
                       className="text-[10px] bg-[#0a0d14] hover:bg-[#161c28] text-slate-300 border border-[#2a3449] py-1.5 rounded-md transition-all font-semibold"
                     >
                       Ocultar Tudo
                     </button>
                   </div>

                   <button
                     onClick={clearGridContent}
                     className="w-full text-xs bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 py-2 rounded-lg transition-all font-semibold"
                   >
                     Limpar/Resetar Grid
                   </button>
                 </div>
               </div>
             </>
           )}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full w-full">
        {/* Floating Toggle Icon if Sidebar is Closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-30 p-2.5 bg-slate-900/90 text-slate-200 hover:text-white rounded-xl border border-slate-800 shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center justify-center"
            title="Abrir Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Floating Quick Floor Switcher */}
        {levels.length > 1 && (
          <div className="absolute top-4 right-4 z-30 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl flex items-center gap-1.5 shadow-2xl animate-in fade-in duration-200">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Andar:
            </span>
            <div className="flex items-center gap-1">
              {levels.map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => handleSwitchLevel(lvl.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeLevelId === lvl.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                  title={`Alternar para ${lvl.name}`}
                >
                  {lvl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sub-bar options */}
        {selectedTool === 'paint' && activeMap && (
          <div className="absolute top-4 left-16 z-30 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl flex items-center gap-1.5 shadow-2xl overflow-x-auto max-w-[calc(100vw-100px)]">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Terrenos:</span>
            {([
              { id: 'floor', label: 'Piso' },
              { id: 'wall', label: 'Parede' },
              { id: 'grass', label: 'Grama' },
              { id: 'water', label: 'Água' },
              { id: 'door', label: '🚪 Porta' },
              { id: 'trap', label: '⚠️ Armadilha' },
              { id: 'chest', label: '🧰 Baú' },
              { id: 'stash', label: '💎 Stash Oculto' },
              { id: 'trigger', label: '🕹️ Mecanismo' },
              { id: 'portcullis', label: '⛓️ Grade' },
              { id: 'illusion_wall', label: '🌫️ Parede Falsa' },
            ] as { id: TileType; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTileType(t.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all shrink-0 ${
                  selectedTileType === t.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-[#161c28] text-slate-300 border border-[#2a3449] hover:bg-[#20293d]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {selectedTool === 'box' && activeMap && (
          <div className="absolute top-4 left-16 z-30 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 shadow-2xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-400">Modo Forma:</span>
              {[
                { id: 'fill', label: 'Preencher Tudo' },
                { id: 'room', label: 'Criar Sala (Paredes+Piso)' },
                { id: 'hollow', label: 'Apenas Contorno' },
                { id: 'fog-reveal', label: 'Revelar Fog' },
                { id: 'fog-cover', label: 'Ocultar Fog' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setBoxMode(m.id as any)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    boxMode === m.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-[#161c28] text-slate-300 hover:bg-[#20293a] border border-[#2a3449]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {(boxMode === 'fill' || boxMode === 'hollow') && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400">Terreno:</span>
                {(['floor', 'wall', 'grass', 'water'] as TileType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTileType(t)}
                    className={`px-2 py-0.5 rounded text-xs capitalize font-semibold transition-all ${
                      selectedTileType === t
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-[#161c28] text-slate-300 border border-[#2a3449]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTool === 'token' && activeMap && (
          <div className="absolute top-4 left-16 z-30 px-4 py-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl flex flex-col gap-3.5 shadow-2xl max-w-[80vw] w-[450px] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0">Tokens:</span>
              <div className="flex bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
                {(['party', 'monsters', 'npcs'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setTokenCategoryTab(tab);
                      setTokenSearchQuery('');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold transition-all cursor-pointer ${
                      tokenCategoryTab === tab
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'party' ? 'Party/Jogadores' : tab === 'monsters' ? 'Monstros' : 'NPCs'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={tokenSearchQuery}
                onChange={(e) => setTokenSearchQuery(e.target.value)}
                placeholder="Buscar token por nome..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Grid of Tokens */}
            <div className="grid grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {getFilteredTokens().length === 0 ? (
                <div className="col-span-3 text-[10px] text-slate-500 text-center py-4">Nenhum token encontrado.</div>
              ) : (
                getFilteredTokens().map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTokenCombatant(c)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate transition-all cursor-pointer border flex flex-col gap-1 items-center justify-center ${
                      selectedTokenCombatant?.id === c.id
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20 scale-105'
                        : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#20293d] hover:text-slate-100'
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
        )}


        {selectedTool === 'calibrate' && bgImageUrl && activeMap && (
          <div className="absolute top-4 left-16 z-30 px-4 py-2.5 bg-rose-950/95 backdrop-blur-md border border-rose-500/30 rounded-xl flex flex-wrap items-center gap-3 text-xs text-rose-200 font-mono shadow-2xl max-w-[70vw]">
            <div className="flex items-center gap-1">
              <span className="font-bold text-rose-300">📏 Calibração:</span>
              <span>Arraste uma linha de 1 quadrado.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Célula: {gridScale}px</span>
                <input 
                  id="gridScaleSlider"
                  type="range" 
                  min="15" 
                  max="100" 
                  value={gridScale} 
                  onChange={(e) => setGridScale(parseInt(e.target.value))} 
                  className="w-20 accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>X: {gridOffsetX}px</span>
                <input 
                  id="gridOffsetXSlider"
                  type="range" 
                  min="-100" 
                  max="100" 
                  value={gridOffsetX} 
                  onChange={(e) => setGridOffsetX(parseInt(e.target.value))} 
                  className="w-20 accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>Y: {gridOffsetY}px</span>
                <input 
                  id="gridOffsetYSlider"
                  type="range" 
                  min="-100" 
                  max="100" 
                  value={gridOffsetY} 
                  onChange={(e) => setGridOffsetY(parseInt(e.target.value))} 
                  className="w-20 accent-rose-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button 
                onClick={() => { setGridOffsetX(0); setGridOffsetY(0); setGridScale(40); }}
                className="px-2 py-0.5 bg-rose-900 hover:bg-rose-800 border border-rose-700 text-rose-200 rounded text-[10px] font-bold"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Hidden UVTT / Universal VTT file input */}
        <input
          ref={uvttFileInputRef}
          type="file"
          accept=".df2vtt,.uvtt,.json"
          onChange={handleUVTTUpload}
          className="hidden"
        />

        {/* Main Canvas Grid Render */}
        <DysonCanvas
          key={activeMap?.id || 'empty'}
          grid={grid}
          bgImageUrl={bgImageUrl}
          vectorWalls={vectorWalls}
          lightSources={lightSources}
          onAddLightSource={handleAddLightSource}
          onRemoveLightSource={handleRemoveLightSource}
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
        />

        {/* Modal do Gerador de Masmorras por IA */}
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

