/**
 * Masters Codex - 3D Building Blocks & Tactical Combat Engine
 * Modelos de dados e lógica geométrica para Blocos de Construção 3D,
 * Procedural Wall Array, Iluminação Medieval Rica e Inspetor de Transformação.
 */

export type GridShape = 'square' | 'circle';

export interface GridConfig3D {
  widthCells: number;      // Largura em células de 5ft (ex: 20 -> 40 unidades 3D)
  heightCells: number;     // Comprimento em células de 5ft (ex: 20 -> 40 unidades 3D)
  cellSizeFeet: number;    // Padrão D&D 5e: 5 pés
  shape: GridShape;        // 'square' | 'circle'
  lineColor: string;       // Ex: '#0284c7'
  lineOpacity: number;     // 0.0 a 1.0
  gridType: 'lines' | 'dots' | 'borderless';
  terrainOpacity?: number; // 0.1 a 1.0 (opacidade das superfícies pintadas)
  textureFitMode?: 'repeat' | 'aspect_fit' | 'stretch'; // Modo de enquadramento da textura
  aspectRatio?: '16:9' | '4:3' | '1:1' | '21:9' | 'custom'; // Proporção do mapa de batalha
}

export const DEFAULT_GRID_CONFIG_3D: GridConfig3D = {
  widthCells: 20,
  heightCells: 20,
  cellSizeFeet: 5,
  shape: 'square',
  lineColor: '#0284c7',
  lineOpacity: 0.35,
  gridType: 'lines',
  terrainOpacity: 0.65,
  textureFitMode: 'repeat',
  aspectRatio: '1:1',
};

export type BuildingBlockCategory = 'structures' | 'lights' | 'props';

export type BuildingBlockType = 
  // Estruturas & Portais Medievais
  | 'wall_stone' 
  | 'wall_wood' 
  | 'pillar_round' 
  | 'pillar_square' 
  | 'pillar_broken'
  | 'half_wall' 
  | 'fence_wood'
  | 'well_stone'
  | 'door_wood' 
  | 'door_double_wood'
  | 'door_stone'
  | 'door_arch'
  | 'archway_stone'
  | 'portcullis_iron'
  | 'jail_bars'
  | 'stairs' 
  // Luzes & Tochas & Cristais Arcanos
  | 'candle'
  | 'torch_wall'
  | 'torch_standing'
  | 'candelabra'
  | 'chandelier_candles'
  | 'oil_lamp'
  | 'lantern_medieval'
  | 'brazier'
  | 'campfire'
  | 'crystal_pylon'
  // Props, Masmorras, Mobiliário & Cenário Medieval
  | 'chest' 
  | 'barrel'
  | 'barrel_stack'
  | 'crate_stack'
  | 'table_wood'
  | 'chair_wood'
  | 'bed_medieval'
  | 'tavern_bar'
  | 'throne_stone'
  | 'altar_stone'
  | 'sarcophagus'
  | 'statue_knight'
  | 'bookshelf'
  | 'cauldron'
  | 'weapon_rack'
  | 'torture_rack'
  | 'iron_maiden'
  | 'gibbet_cage'
  | 'guillotine'
  | 'fountain_stone'
  | 'alchemy_workbench'
  | 'magic_portal'
  | 'treasure_pile'
  | 'tree_pine'
  | 'rock_boulder'
  | 'tent_camp';

export interface BuildingBlockDefinition {
  type: BuildingBlockType;
  label: string;
  category: BuildingBlockCategory;
  icon: string;
  blocksVision: boolean;
  blocksMovement: boolean;
  providesCover: 'none' | 'half' | 'three_quarters' | 'full';
  heightUnits: number;
  widthUnits: number;
  isLightSource?: boolean;
  defaultLightColor?: string;
  defaultLightIntensity?: number;
  defaultLightRadiusFt?: number;
  supportsProceduralLength?: boolean; // Permite esticar proceduralmente sem distorcer
}

export const BUILDING_BLOCK_CATALOG: Record<BuildingBlockType, BuildingBlockDefinition> = {
  // --- ESTRUTURAS ---
  wall_stone: {
    type: 'wall_stone',
    label: 'Parede de Pedra',
    category: 'structures',
    icon: '🧱',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.8,
    widthUnits: 2.0,
    supportsProceduralLength: true,
  },
  wall_wood: {
    type: 'wall_wood',
    label: 'Parede de Madeira',
    category: 'structures',
    icon: '🪵',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.8,
    widthUnits: 2.0,
    supportsProceduralLength: true,
  },
  pillar_round: {
    type: 'pillar_round',
    label: 'Pilar Romano',
    category: 'structures',
    icon: '🏛️',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 3.2,
    widthUnits: 1.2,
  },
  pillar_square: {
    type: 'pillar_square',
    label: 'Coluna de Alvenaria',
    category: 'structures',
    icon: '🏛️',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 3.0,
    widthUnits: 1.6,
  },
  half_wall: {
    type: 'half_wall',
    label: 'Mureta / Barricada',
    category: 'structures',
    icon: '🛡️',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'half',
    heightUnits: 1.2,
    widthUnits: 2.0,
    supportsProceduralLength: true,
  },
  fence_wood: {
    type: 'fence_wood',
    label: 'Cerca de Madeira',
    category: 'structures',
    icon: '🪵',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'half',
    heightUnits: 1.1,
    widthUnits: 2.0,
    supportsProceduralLength: true,
  },
  well_stone: {
    type: 'well_stone',
    label: 'Poço de Água',
    category: 'structures',
    icon: '🪣',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 2.4,
    widthUnits: 1.8,
  },
  door_wood: {
    type: 'door_wood',
    label: 'Porta de Madeira',
    category: 'structures',
    icon: '🚪',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.8,
    widthUnits: 2.0,
  },
  door_double_wood: {
    type: 'door_double_wood',
    label: 'Portão Duplo de Carvalho',
    category: 'structures',
    icon: '🚪',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 3.2,
    widthUnits: 4.0,
  },
  door_stone: {
    type: 'door_stone',
    label: 'Porta Rúnica de Pedra',
    category: 'structures',
    icon: '🗿',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.8,
    widthUnits: 2.0,
  },
  door_arch: {
    type: 'door_arch',
    label: 'Porta em Arco Gótico',
    category: 'structures',
    icon: '🏰',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 3.2,
    widthUnits: 2.0,
  },
  archway_stone: {
    type: 'archway_stone',
    label: 'Arco / Passagem de Pedra',
    category: 'structures',
    icon: '⛩️',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'half',
    heightUnits: 3.2,
    widthUnits: 2.0,
  },
  portcullis_iron: {
    type: 'portcullis_iron',
    label: 'Rastrilho / Grade Levadiça',
    category: 'structures',
    icon: '⛓️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 3.0,
    widthUnits: 2.0,
  },
  jail_bars: {
    type: 'jail_bars',
    label: 'Grade de Cela / Prisão',
    category: 'structures',
    icon: '🪟',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 2.8,
    widthUnits: 2.0,
    supportsProceduralLength: true,
  },
  pillar_broken: {
    type: 'pillar_broken',
    label: 'Pilar em Ruínas',
    category: 'structures',
    icon: '🏛️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.8,
    widthUnits: 1.4,
  },
  stairs: {
    type: 'stairs',
    label: 'Escadaria (5ft)',
    category: 'structures',
    icon: '🪜',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 1.5,
    widthUnits: 2.0,
  },

  // --- LUZES & TOCHAS MEDIEVAIS ---
  candle: {
    type: 'candle',
    label: 'Vela Solitária',
    category: 'lights',
    icon: '🕯️',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 0.3,
    widthUnits: 0.4,
    isLightSource: true,
    defaultLightColor: '#ffaa44',
    defaultLightIntensity: 1.2,
    defaultLightRadiusFt: 10,
  },
  torch_standing: {
    type: 'torch_standing',
    label: 'Tocha de Chão',
    category: 'lights',
    icon: '🔥',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 1.8,
    widthUnits: 0.5,
    isLightSource: true,
    defaultLightColor: '#ff9933',
    defaultLightIntensity: 3.5,
    defaultLightRadiusFt: 40,
  },
  torch_wall: {
    type: 'torch_wall',
    label: 'Tocha de Parede',
    category: 'lights',
    icon: '🏮',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 1.5,
    widthUnits: 0.5,
    isLightSource: true,
    defaultLightColor: '#ff9933',
    defaultLightIntensity: 3.5,
    defaultLightRadiusFt: 40,
  },
  candelabra: {
    type: 'candelabra',
    label: 'Castiçal de Prata (3 Velas)',
    category: 'lights',
    icon: '✨',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 1.1,
    widthUnits: 0.8,
    isLightSource: true,
    defaultLightColor: '#fed7aa',
    defaultLightIntensity: 2.2,
    defaultLightRadiusFt: 20,
  },
  chandelier_candles: {
    type: 'chandelier_candles',
    label: 'Lustre de Velas Medieval',
    category: 'lights',
    icon: '🕯️',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 2.0,
    widthUnits: 1.8,
    isLightSource: true,
    defaultLightColor: '#ffaa33',
    defaultLightIntensity: 4.5,
    defaultLightRadiusFt: 45,
  },
  oil_lamp: {
    type: 'oil_lamp',
    label: 'Candeeiro de Óleo',
    category: 'lights',
    icon: '🪔',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 0.8,
    widthUnits: 0.6,
    isLightSource: true,
    defaultLightColor: '#fde047',
    defaultLightIntensity: 2.8,
    defaultLightRadiusFt: 30,
  },
  lantern_medieval: {
    type: 'lantern_medieval',
    label: 'Lanterna Medieval Fechada',
    category: 'lights',
    icon: '🏮',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 1.0,
    widthUnits: 0.7,
    isLightSource: true,
    defaultLightColor: '#fde047',
    defaultLightIntensity: 3.8,
    defaultLightRadiusFt: 60,
  },
  brazier: {
    type: 'brazier',
    label: 'Braseiro Imperial de Ferro',
    category: 'lights',
    icon: '🔥',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.4,
    widthUnits: 1.3,
    isLightSource: true,
    defaultLightColor: '#ea580c',
    defaultLightIntensity: 4.2,
    defaultLightRadiusFt: 50,
  },
  campfire: {
    type: 'campfire',
    label: 'Fogueira Ardente',
    category: 'lights',
    icon: '🪵',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 0.6,
    widthUnits: 1.0,
    isLightSource: true,
    defaultLightColor: '#ff7700',
    defaultLightIntensity: 3.8,
    defaultLightRadiusFt: 40,
  },
  crystal_pylon: {
    type: 'crystal_pylon',
    label: 'Cristal Arcano Flutuante',
    category: 'lights',
    icon: '💎',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 2.5,
    widthUnits: 1.2,
    isLightSource: true,
    defaultLightColor: '#38bdf8',
    defaultLightIntensity: 3.5,
    defaultLightRadiusFt: 45,
  },

  // --- PROPS & MOBILIÁRIO MEDIEVAL ---
  chest: {
    type: 'chest',
    label: 'Baú de Madeira',
    category: 'props',
    icon: '📦',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'half',
    heightUnits: 0.8,
    widthUnits: 1.2,
  },
  barrel: {
    type: 'barrel',
    label: 'Barril de Carvalho',
    category: 'props',
    icon: '🛢️',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'half',
    heightUnits: 1.2,
    widthUnits: 0.9,
  },
  barrel_stack: {
    type: 'barrel_stack',
    label: 'Pilha de Barris',
    category: 'props',
    icon: '🛢️',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 1.7,
    widthUnits: 1.8,
  },
  crate_stack: {
    type: 'crate_stack',
    label: 'Pilha de Caixotes',
    category: 'props',
    icon: '📦',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 1.8,
    widthUnits: 1.6,
  },
  table_wood: {
    type: 'table_wood',
    label: 'Mesa de Taverna',
    category: 'props',
    icon: '🪵',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.0,
    widthUnits: 2.4,
  },
  chair_wood: {
    type: 'chair_wood',
    label: 'Cadeira / Banco',
    category: 'props',
    icon: '🪑',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 0.9,
    widthUnits: 0.7,
  },
  bed_medieval: {
    type: 'bed_medieval',
    label: 'Cama Medieval',
    category: 'props',
    icon: '🛏️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.2,
    widthUnits: 2.0,
  },
  tavern_bar: {
    type: 'tavern_bar',
    label: 'Balcão de Taverna',
    category: 'props',
    icon: '🍺',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.2,
    widthUnits: 2.6,
  },
  throne_stone: {
    type: 'throne_stone',
    label: 'Trono do Rei',
    category: 'props',
    icon: '👑',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 2.4,
    widthUnits: 1.6,
  },
  altar_stone: {
    type: 'altar_stone',
    label: 'Altar Ritualístico',
    category: 'props',
    icon: '🕯️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.1,
    widthUnits: 2.2,
  },
  sarcophagus: {
    type: 'sarcophagus',
    label: 'Sarcófago de Cripta',
    category: 'props',
    icon: '⚰️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.0,
    widthUnits: 1.3,
  },
  statue_knight: {
    type: 'statue_knight',
    label: 'Estátua do Guardião',
    category: 'props',
    icon: '🗿',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 3.2,
    widthUnits: 1.4,
  },
  bookshelf: {
    type: 'bookshelf',
    label: 'Estante de Grimórios',
    category: 'props',
    icon: '📚',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.6,
    widthUnits: 2.0,
  },
  cauldron: {
    type: 'cauldron',
    label: 'Caldeirão Mágico',
    category: 'props',
    icon: '🧪',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.2,
    widthUnits: 1.4,
    isLightSource: true,
    defaultLightColor: '#10b981',
    defaultLightIntensity: 3.0,
    defaultLightRadiusFt: 25,
  },
  weapon_rack: {
    type: 'weapon_rack',
    label: 'Suporte de Armas',
    category: 'props',
    icon: '⚔️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.8,
    widthUnits: 2.0,
  },
  torture_rack: {
    type: 'torture_rack',
    label: 'Mesa de Tortura',
    category: 'props',
    icon: '⛓️',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 0.9,
    widthUnits: 2.2,
  },
  iron_maiden: {
    type: 'iron_maiden',
    label: 'Dama de Ferro',
    category: 'props',
    icon: '🚪',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.4,
    widthUnits: 1.2,
  },
  gibbet_cage: {
    type: 'gibbet_cage',
    label: 'Gaiola de Masmorra',
    category: 'props',
    icon: '💀',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 2.8,
    widthUnits: 1.2,
  },
  guillotine: {
    type: 'guillotine',
    label: 'Guilhotina de Execução',
    category: 'props',
    icon: '🪓',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 2.8,
    widthUnits: 1.6,
  },
  fountain_stone: {
    type: 'fountain_stone',
    label: 'Fonte de Pedra',
    category: 'props',
    icon: '⛲',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.5,
    widthUnits: 2.2,
  },
  alchemy_workbench: {
    type: 'alchemy_workbench',
    label: 'Bancada Alquímica',
    category: 'props',
    icon: '🔮',
    blocksVision: false,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.4,
    widthUnits: 2.2,
  },
  magic_portal: {
    type: 'magic_portal',
    label: 'Portal Arcano',
    category: 'props',
    icon: '🌀',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 3.2,
    widthUnits: 2.4,
    isLightSource: true,
    defaultLightColor: '#8b5cf6',
    defaultLightIntensity: 3.8,
    defaultLightRadiusFt: 40,
  },
  treasure_pile: {
    type: 'treasure_pile',
    label: 'Pilha de Tesouro & Ouro',
    category: 'props',
    icon: '💰',
    blocksVision: false,
    blocksMovement: false,
    providesCover: 'none',
    heightUnits: 0.6,
    widthUnits: 1.6,
  },
  tree_pine: {
    type: 'tree_pine',
    label: 'Pinheiro de Floresta',
    category: 'props',
    icon: '🌲',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'three_quarters',
    heightUnits: 4.5,
    widthUnits: 2.4,
  },
  rock_boulder: {
    type: 'rock_boulder',
    label: 'Pedregulho de Caverna',
    category: 'props',
    icon: '🪨',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'half',
    heightUnits: 1.4,
    widthUnits: 1.8,
  },
  tent_camp: {
    type: 'tent_camp',
    label: 'Tenda de Acampamento',
    category: 'props',
    icon: '⛺',
    blocksVision: true,
    blocksMovement: true,
    providesCover: 'full',
    heightUnits: 2.2,
    widthUnits: 2.6,
  },
};

export interface BuildingBlockLightConfig {
  color: string;
  intensity: number;
  distanceFt: number;
  enabled: boolean;
}

export interface BuildingBlock3D {
  id: string;
  type: BuildingBlockType;
  x: number;               // Posição X centralizada em unidades 3D
  z: number;               // Posição Z centralizada em unidades 3D
  yElevation?: number;     // Altura Y (0 no chão)
  rotationDeg?: number;    // 0 a 360 graus
  state?: 'closed' | 'open'; // Para portas
  segmentsCount?: number;  // Comprimento procedural (1 = 1 célula, 2 = 2 células contínuas sem distorção)
  heightScale?: number;    // Multiplicador de altura (1.0 = padrão)
  lightConfig?: BuildingBlockLightConfig;
}

export type SpellTemplateShape = 'sphere' | 'cone' | 'cube' | 'line';

export interface SpellTemplate3D {
  id: string;
  name: string;
  shape: SpellTemplateShape;
  radiusFeet: number;      // Raio da esfera / Comprimento do cone/linha
  widthFeet?: number;      // Largura da linha / tamanho do cubo
  color: string;           // Ex: '#ef4444' (Fogo), '#38bdf8' (Gelo/Arcano)
  x: number;               // Posição central X em unidades 3D
  z: number;               // Posição central Z em unidades 3D
  rotationDeg?: number;    // Ângulo para cones e linhas
}

/**
 * Converte coordenadas de célula do grid (0..N) para unidades 3D (Three.js) centralizadas na origem.
 * 1 célula (5 pés) = 2 unidades 3D.
 */
export function gridCellToWorldPos(
  col: number, 
  row: number, 
  widthCells: number, 
  heightCells: number
): { x: number; z: number } {
  const cellSizeUnits = 2.0;
  const originX = -(widthCells * cellSizeUnits) / 2;
  const originZ = -(heightCells * cellSizeUnits) / 2;

  return {
    x: originX + col * cellSizeUnits + cellSizeUnits / 2,
    z: originZ + row * cellSizeUnits + cellSizeUnits / 2,
  };
}

/**
 * Converte posição 3D do mouse (Three.js raycast) para coordenadas de célula do grid.
 */
export function worldPosToGridCell(
  worldX: number, 
  worldZ: number, 
  widthCells: number, 
  heightCells: number
): { col: number; row: number; snappedX: number; snappedZ: number } {
  const cellSizeUnits = 2.0;
  const originX = -(widthCells * cellSizeUnits) / 2;
  const originZ = -(heightCells * cellSizeUnits) / 2;

  const col = Math.floor((worldX - originX) / cellSizeUnits);
  const row = Math.floor((worldZ - originZ) / cellSizeUnits);

  const clampedCol = Math.max(0, Math.min(widthCells - 1, col));
  const clampedRow = Math.max(0, Math.min(heightCells - 1, row));

  const snapped = gridCellToWorldPos(clampedCol, clampedRow, widthCells, heightCells);

  return {
    col: clampedCol,
    row: clampedRow,
    snappedX: snapped.x,
    snappedZ: snapped.z,
  };
}

/**
 * Cria uma nova instância de BuildingBlock3D com valores padrões do catálogo
 */
export function createDefaultBuildingBlock(
  type: BuildingBlockType,
  x: number,
  z: number,
  rotationDeg = 0
): BuildingBlock3D {
  const def = BUILDING_BLOCK_CATALOG[type];
  const block: BuildingBlock3D = {
    id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    x,
    z,
    yElevation: type === 'chandelier_candles' ? 3.5 : 0,
    rotationDeg,
    segmentsCount: 1,
    heightScale: 1.0,
    state: (type === 'door_wood' || type === 'door_double_wood' || type === 'door_stone' || type === 'door_arch' || type === 'portcullis_iron') ? 'closed' : undefined,
  };

  if (def && def.isLightSource) {
    block.lightConfig = {
      color: def.defaultLightColor || '#ff9933',
      intensity: def.defaultLightIntensity || 3.0,
      distanceFt: def.defaultLightRadiusFt || 40,
      enabled: true,
    };
  }

  return block;
}

/**
 * Calcula distância euclidiana 3D real entre dois combatentes considerando a elevação vertical (voo).
 * 2 unidades 3D = 5 pés.
 */
export function computeDistance3DFeet(
  posA: { x: number; z: number; yElevation?: number },
  posB: { x: number; z: number; yElevation?: number }
): number {
  const dx = posB.x - posA.x;
  const dz = posB.z - posA.z;
  const dy = (posB.yElevation || 0) - (posA.yElevation || 0);

  const distUnits = Math.sqrt(dx * dx + dz * dz + dy * dy);
  return (distUnits / 2.0) * 5.0; // Converte para pés D&D
}

/**
 * Verifica se um token na posição `targetPos` está contido dentro da área de efeito de uma magia 3D.
 */
export function isTokenInSpellArea(
  targetPos: { x: number; z: number },
  template: SpellTemplate3D
): boolean {
  const dx = targetPos.x - template.x;
  const dz = targetPos.z - template.z;
  const distUnits = Math.sqrt(dx * dx + dz * dz);
  const radiusUnits = (template.radiusFeet / 5.0) * 2.0;

  if (template.shape === 'sphere') {
    return distUnits <= radiusUnits;
  }

  if (template.shape === 'cube') {
    const halfSide = radiusUnits;
    return Math.abs(dx) <= halfSide && Math.abs(dz) <= halfSide;
  }

  if (template.shape === 'cone') {
    if (distUnits > radiusUnits) return false;
    if (distUnits === 0) return true;

    const coneAngleDeg = template.rotationDeg || 0;
    const coneAngleRad = (coneAngleDeg * Math.PI) / 180;
    
    const dirX = Math.sin(coneAngleRad);
    const dirZ = -Math.cos(coneAngleRad);

    const dot = (dx * dirX + dz * dirZ) / distUnits;
    return dot >= 0.866;
  }

  if (template.shape === 'line') {
    const lengthUnits = radiusUnits;
    const widthUnits = ((template.widthFeet || 5) / 5.0) * 2.0;
    const halfWidth = widthUnits / 2;

    const angleDeg = template.rotationDeg || 0;
    const angleRad = (angleDeg * Math.PI) / 180;

    const cos = Math.cos(-angleRad);
    const sin = Math.sin(-angleRad);
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;

    return localZ <= 0 && localZ >= -lengthUnits && Math.abs(localX) <= halfWidth;
  }

  return false;
}

/**
 * Calcula a cobertura 5e (Meia-Cobertura +2 CA, Três-Quartos +5 CA, Sem Visão)
 * fazendo raycasting entre o atacante e o defensor contra blocos de construção sólidos.
 */
export function computeCoverAgainstBlocks(
  attackerPos: { x: number; z: number },
  targetPos: { x: number; z: number },
  blocks: BuildingBlock3D[]
): { cover: 'none' | 'half' | 'three_quarters' | 'full'; bonusAc: number } {
  const targetCorners = [
    { x: targetPos.x - 0.7, z: targetPos.z - 0.7 },
    { x: targetPos.x + 0.7, z: targetPos.z - 0.7 },
    { x: targetPos.x - 0.7, z: targetPos.z + 0.7 },
    { x: targetPos.x + 0.7, z: targetPos.z + 0.7 },
  ];

  let blockedRays = 0;

  for (const corner of targetCorners) {
    let rayBlocked = false;
    for (const block of blocks) {
      const def = BUILDING_BLOCK_CATALOG[block.type];
      if (!def || def.providesCover === 'none') continue;
      if (block.type === 'door_wood' && block.state === 'open') continue;

      const segs = block.segmentsCount || 1;
      const totalWidth = def.widthUnits * segs;
      const halfSize = totalWidth / 2;
      const bMinX = block.x - halfSize;
      const bMaxX = block.x + halfSize;
      const bMinZ = block.z - halfSize;
      const bMaxZ = block.z + halfSize;

      if (doesSegmentIntersectBox(attackerPos.x, attackerPos.z, corner.x, corner.z, bMinX, bMaxX, bMinZ, bMaxZ)) {
        rayBlocked = true;
        break;
      }
    }
    if (rayBlocked) blockedRays++;
  }

  if (blockedRays === 0) return { cover: 'none', bonusAc: 0 };
  if (blockedRays <= 2) return { cover: 'half', bonusAc: 2 };
  if (blockedRays === 3) return { cover: 'three_quarters', bonusAc: 5 };
  return { cover: 'full', bonusAc: 99 };
}

function doesSegmentIntersectBox(
  x1: number, z1: number, 
  x2: number, z2: number, 
  minX: number, maxX: number, 
  minZ: number, maxZ: number
): boolean {
  let t0 = 0.0;
  let t1 = 1.0;
  const dx = x2 - x1;
  const dz = z2 - z1;

  const p = [-dx, dx, -dz, dz];
  const q = [x1 - minX, maxX - x1, z1 - minZ, maxZ - z1];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}
