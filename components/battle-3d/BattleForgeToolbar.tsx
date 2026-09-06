/**
 * Masters Codex - DM 3D Forge Toolbar (Construtor de Cenário & Ferramentas Táticas)
 */
import React, { useState } from 'react';
import { 
  BuildingBlockType, 
  BUILDING_BLOCK_CATALOG, 
  GridConfig3D, 
  SpellTemplateShape,
  SpellTemplate3D 
} from '@/lib/3d-building-blocks';
import { 
  TerrainSurfaceType,
  TERRAIN_SURFACE_CATALOG,
  TerrainSurfaceDefinition
} from '@/lib/3d-terrains';
import { 
  Box, 
  Layers, 
  Trash2, 
  RotateCw, 
  Sparkles, 
  Flame, 
  Circle, 
  Square, 
  Sliders, 
  ChevronDown, 
  X,
  Plus,
  ArrowUp,
  Save,
  Download,
  Paintbrush,
  Eraser,
  Droplet,
  Info,
  Lock,
  Unlock
} from 'lucide-react';
import { toast } from 'sonner';

export interface BattleForgeToolbarProps {
  isDm: boolean;
  isOpen: boolean;
  onClose: () => void;
  gridConfig: GridConfig3D;
  onGridConfigChange: (config: GridConfig3D) => void;
  activeBlockType: BuildingBlockType | null;
  onSelectBlockType: (type: BuildingBlockType | null) => void;
  buildMode: 'idle' | 'place' | 'delete' | 'spell' | 'terrain';
  onSetBuildMode: (mode: 'idle' | 'place' | 'delete' | 'spell' | 'terrain') => void;
  blockRotation: number;
  onRotateBlock: () => void;
  onClearAllBlocks: () => void;
  activeSpellTemplate: SpellTemplate3D | null;
  onSpawnSpellTemplate: (template: Omit<SpellTemplate3D, 'id' | 'x' | 'z'>) => void;
  onClearSpellTemplate: () => void;
  selectedTokenElevation?: number;
  onSetTokenElevation?: (elevationFt: number) => void;
  blocksCount: number;
  // Novos controles de Terreno & Superfície (BG3)
  activeTerrainType?: TerrainSurfaceType;
  onSelectTerrainType?: (type: TerrainSurfaceType) => void;
  terrainBrushSize?: 1 | 2 | 3;
  onSetTerrainBrushSize?: (size: 1 | 2 | 3) => void;
  terrainOpacity?: number;
  onSetTerrainOpacity?: (opacity: number) => void;
  terrainsCount?: number;
  onClearAllTerrains?: () => void;
  isAssetsLocked?: boolean;
  onToggleAssetsLocked?: () => void;
  floorTextureUrl?: string;
  videoGridConfig?: import('@/lib/types').VideoGridAlignmentConfig;
  onVideoGridConfigChange?: (config: import('@/lib/types').VideoGridAlignmentConfig) => void;
}

export const BattleForgeToolbar: React.FC<BattleForgeToolbarProps> = ({
  isDm,
  isOpen,
  onClose,
  gridConfig,
  onGridConfigChange,
  activeBlockType,
  onSelectBlockType,
  buildMode,
  onSetBuildMode,
  blockRotation,
  onRotateBlock,
  onClearAllBlocks,
  activeSpellTemplate,
  onSpawnSpellTemplate,
  onClearSpellTemplate,
  selectedTokenElevation = 0,
  onSetTokenElevation,
  blocksCount,
  activeTerrainType = 'shallow_water',
  onSelectTerrainType,
  terrainBrushSize = 1,
  onSetTerrainBrushSize,
  terrainOpacity = 0.65,
  onSetTerrainOpacity,
  terrainsCount = 0,
  onClearAllTerrains,
  isAssetsLocked = true,
  onToggleAssetsLocked,
  floorTextureUrl,
  videoGridConfig,
  onVideoGridConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'terrains' | 'grid' | 'spells' | 'elevation'>('blocks');
  const [blockCategory, setBlockCategory] = useState<'all' | 'structures' | 'lights' | 'props'>('all');
  const [isAspectLocked, setIsAspectLocked] = useState(false);

  if (!isDm || !isOpen) return null;

  const filteredBlockTypes = (Object.keys(BUILDING_BLOCK_CATALOG) as BuildingBlockType[]).filter((type) => {
    if (blockCategory === 'all') return true;
    return BUILDING_BLOCK_CATALOG[type].category === blockCategory;
  });

  const availableTerrains = (Object.keys(TERRAIN_SURFACE_CATALOG) as TerrainSurfaceType[]).filter(
    (t) => t !== 'normal'
  );

  const handleQuickSpell = (name: string, shape: SpellTemplateShape, radiusFeet: number, color: string, widthFeet?: number) => {
    onSpawnSpellTemplate({
      name,
      shape,
      radiusFeet,
      widthFeet,
      color,
      rotationDeg: 0,
    });
    onSetBuildMode('spell');
    toast.success(`✨ Modelo de ${name} (${radiusFeet}ft) pronto! Clique no mapa para posicionar.`);
  };

  const onVideoGridChangeHelper = (offsetX: number, offsetY: number) => {
    if (onVideoGridConfigChange) {
      onVideoGridConfigChange({
        scale: videoGridConfig?.scale ?? 1.0,
        offsetX,
        offsetY,
        gridOpacity: gridConfig.lineOpacity,
        gridColor: gridConfig.lineColor,
        aspectRatio: gridConfig.aspectRatio || '16:9',
      });
    }
  };

  return (
    <div className="absolute top-14 left-4 z-40 w-92 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
      {/* Top Header */}
      <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-[12px]">
              Forja de Cenários 3D
              <span className="bg-sky-500/20 text-sky-400 text-[9px] px-1.5 py-0.2 rounded font-mono">
                {blocksCount} blocos
              </span>
              {terrainsCount > 0 && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded font-mono">
                  {terrainsCount} terrenos
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">Paredes, superfícies BG3, luzes e props</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (buildMode === 'terrain' || buildMode === 'place') {
              onSetBuildMode('idle');
            }
            onClose();
          }}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Fechar BattleForge (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Status Bar */}
      <div className="px-3 py-1.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className="text-slate-400">
          Modo:{' '}
          <strong className="text-amber-300 uppercase">
            {buildMode === 'place'
              ? '🏗️ Construindo'
              : buildMode === 'terrain'
              ? '🖌️ Pintando Terreno'
              : buildMode === 'delete'
              ? '🧹 Deletando'
              : buildMode === 'spell'
              ? '✨ Magia 3D'
              : '👀 Seleção (Clique no Bloco/Porta)'}
          </strong>
        </span>
        <div className="flex items-center gap-1">
          {buildMode !== 'idle' && (
            <button
              onClick={() => onSetBuildMode('idle')}
              className="px-2 py-0.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 rounded flex items-center gap-1 text-[10px] font-bold active:scale-95 transition-all"
              title="Voltar ao modo normal / Desmarcar ferramenta (ESC)"
            >
              <X className="w-3 h-3" />
              <span>Desmarcar (ESC)</span>
            </button>
          )}
          {buildMode === 'place' && (
            <button
              onClick={onRotateBlock}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 flex items-center gap-1 active:scale-95"
              title="Girar bloco 90° (Tecla R)"
            >
              <RotateCw className="w-3 h-3" />
              <span>{blockRotation}°</span>
            </button>
          )}
          <button
            onClick={() => onSetBuildMode(buildMode === 'delete' ? 'idle' : 'delete')}
            className={`px-2 py-0.5 rounded border transition-all ${
              buildMode === 'delete'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Modo Borracha / Deletar Bloco ou Terreno"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          {onToggleAssetsLocked && (
            <button
              onClick={onToggleAssetsLocked}
              className={`px-2 py-0.5 rounded border flex items-center gap-1 text-[10px] font-bold transition-all active:scale-95 ${
                isAssetsLocked
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
              }`}
              title={isAssetsLocked ? 'Assets travados contra arrasto. Clique para liberar edição livre.' : 'Edição livre ativa. Clique para travar movimentação de assets.'}
            >
              {isAssetsLocked ? <Lock className="w-3 h-3 text-slate-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              <span>{isAssetsLocked ? 'Travado' : 'Edição'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/30 p-1 gap-1">
        {([
          { id: 'blocks', label: 'Blocos', icon: <Box className="w-3 h-3" /> },
          { id: 'terrains', label: 'Terrenos', icon: <Paintbrush className="w-3 h-3 text-emerald-400" /> },
          { id: 'grid', label: 'Grade', icon: <Sliders className="w-3 h-3" /> },
          { id: 'spells', label: 'Magias 3D', icon: <Sparkles className="w-3 h-3 text-amber-400" /> },
          { id: 'elevation', label: 'Voo', icon: <ArrowUp className="w-3 h-3 text-sky-400" /> },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              if (tab.id === 'terrains') {
                onSetBuildMode('terrain');
              } else {
                if (buildMode === 'terrain' || (tab.id !== 'blocks' && buildMode === 'place')) {
                  onSetBuildMode('idle');
                }
              }
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 text-[10px] font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-800 text-amber-300 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="p-3 max-h-96 overflow-y-auto custom-scrollbar">
        {/* TAB 1: BLOCKS */}
        {activeTab === 'blocks' && (
          <div className="space-y-2.5">
            {/* Category Filter Pills */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-bold">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'structures', label: '🧱 Estruturas' },
                { id: 'lights', label: '🔥 Luzes' },
                { id: 'props', label: '📦 Objetos' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setBlockCategory(cat.id as any)}
                  className={`flex-1 py-1 rounded transition-all ${
                    blockCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Drag & Drop Hint */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9.5px] text-amber-300">
              <span className="text-xs">🖐️</span>
              <span><strong>Arraste o asset</strong> para o grid 3D ou clique para selecionar</span>
            </div>

            {/* Block Items Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              {filteredBlockTypes.map((type) => {
                const def = BUILDING_BLOCK_CATALOG[type];
                const isSelected = activeBlockType === type && buildMode === 'place';

                return (
                  <div
                    key={type}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({
                        type: '3d_building_block',
                        blockType: type,
                      }));
                      e.dataTransfer.setData('text/plain', type);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => {
                      if (isSelected) {
                        onSelectBlockType(null);
                        onSetBuildMode('idle');
                      } else {
                        onSelectBlockType(type);
                        onSetBuildMode('place');
                        toast.info(`Bloco selecionado: ${def.label}. Arraste para o grid ou clique no mapa para colocar.`);
                      }
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing select-none hover:scale-[1.02] active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                    title="Clique para selecionar ou arraste diretamente para a arena 3D"
                  >
                    <span className="text-base shrink-0">{def.icon}</span>
                    <div className="flex flex-col min-w-0 pointer-events-none">
                      <span className="font-bold text-[11px] truncate">{def.label}</span>
                      <span className="text-[9px] text-slate-500">
                        {def.isLightSource
                          ? `Luz ${def.defaultLightRadiusFt}ft`
                          : def.supportsProceduralLength
                          ? 'Esticável'
                          : def.blocksVision
                          ? 'Bloqueia Visão'
                          : 'Decorativo'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {blocksCount > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja limpar todos os blocos do mapa 3D?')) {
                    onClearAllBlocks();
                    toast.success('Todos os blocos foram removidos.');
                  }
                }}
                className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98 mt-1"
              >
                <Trash2 className="w-3 h-3" /> Limpar Todos os Blocos
              </button>
            )}
          </div>
        )}

        {/* TAB 2: TERRAINS & SURFACES (BG3 STYLE) */}
        {activeTab === 'terrains' && (
          <div className="space-y-3">
            {/* Brush Controls & Sizes */}
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Paintbrush className="w-3 h-3 text-emerald-400" /> Tamanho do Pincel:
                </span>
                <div className="flex items-center gap-1">
                  {([1, 2, 3] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => onSetTerrainBrushSize && onSetTerrainBrushSize(sz)}
                      className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border transition-all ${
                        terrainBrushSize === sz
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz}x{sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo de ação: Pincel vs Borracha de Chão */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => onSetBuildMode(buildMode === 'terrain' ? 'idle' : 'terrain')}
                  className={`flex-1 py-1 rounded-lg border flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all ${
                    buildMode === 'terrain'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={buildMode === 'terrain' ? 'Pintura ativa. Clique para pausar/desmarcar' : 'Ativar modo de pintura de terreno'}
                >
                  <Paintbrush className="w-3 h-3" /> {buildMode === 'terrain' ? 'Pintando (Clique p/ Parar)' : 'Pintar Terreno'}
                </button>
                <button
                  onClick={() => onSetBuildMode(buildMode === 'delete' ? 'terrain' : 'delete')}
                  className={`flex-1 py-1 rounded-lg border flex items-center justify-center gap-1.5 text-[10px] font-bold transition-all ${
                    buildMode === 'delete'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eraser className="w-3 h-3" /> Borracha de Terreno
                </button>
              </div>
            </div>

            {/* Controle de Opacidade da Cor do Terreno */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-emerald-400" /> Opacidade do Terreno:
                </span>
                <span className="font-mono font-bold text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {Math.round((terrainOpacity ?? 0.65) * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[9px] text-slate-500 font-mono">10%</span>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={terrainOpacity ?? 0.65}
                  onChange={(e) => onSetTerrainOpacity && onSetTerrainOpacity(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer hover:accent-emerald-400 transition-all"
                />
                <span className="text-[9px] text-slate-500 font-mono">100%</span>
              </div>
            </div>

            {/* Terrain Catalog Palette */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Superfícies & Efeitos BG3:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {availableTerrains.map((type) => {
                  const def = TERRAIN_SURFACE_CATALOG[type];
                  const isSelected = activeTerrainType === type && buildMode === 'terrain';

                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (isSelected) {
                          onSetBuildMode('idle');
                          toast.info('Pintura de terreno desmarcada.');
                        } else {
                          if (onSelectTerrainType) onSelectTerrainType(type);
                          onSetBuildMode('terrain');
                          toast.info(`Superfície selecionada: ${def.label}. Clique e arraste na arena 3D para pintar.`);
                        }
                      }}
                      className={`p-2 rounded-xl border text-left flex items-start gap-2 transition-all select-none hover:scale-[1.02] active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                      title={isSelected ? 'Clique para desmarcar' : 'Clique para selecionar e pintar'}
                    >
                      <span className="text-base shrink-0">{def.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[11px] truncate">{def.label}</span>
                        <span className="text-[9px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                          {def.description}
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          {def.isDifficultTerrain && (
                            <span className="bg-amber-500/20 text-amber-300 text-[8.5px] px-1 py-0.2 rounded font-mono font-bold">
                              2x Mov
                            </span>
                          )}
                          {def.isHazard && (
                            <span className="bg-rose-500/20 text-rose-300 text-[8.5px] px-1 py-0.2 rounded font-mono font-bold">
                              Perigo
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Terrain Info Card */}
            {activeTerrainType && TERRAIN_SURFACE_CATALOG[activeTerrainType] && (
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <span className="text-base">{TERRAIN_SURFACE_CATALOG[activeTerrainType].icon}</span>
                  <span>{TERRAIN_SURFACE_CATALOG[activeTerrainType].label}</span>
                </div>
                <p className="text-slate-400">{TERRAIN_SURFACE_CATALOG[activeTerrainType].description}</p>
                <div className="text-[9px] text-emerald-400/90 pt-1 border-t border-slate-800/80 flex items-center gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Tokens que pisarem sofrem o custo de movimento e reações elementais automáticas!</span>
                </div>
              </div>
            )}

            {terrainsCount > 0 && onClearAllTerrains && (
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja limpar todas as superfícies de terreno do mapa 3D?')) {
                    onClearAllTerrains();
                    toast.success('Todas as superfícies foram removidas.');
                  }
                }}
                className="w-full py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98 mt-1"
              >
                <Trash2 className="w-3 h-3" /> Limpar Todas as Superfícies
              </button>
            )}
          </div>
        )}

        {/* TAB 3: GRID & ARENA */}
        {activeTab === 'grid' && (
          <div className="space-y-3">
            {/* Shape Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Formato do Tabuleiro:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onGridConfigChange({ ...gridConfig, shape: 'square' })}
                  className={`py-2 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    gridConfig.shape === 'square'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> Quadrado / Retangular
                </button>
                <button
                  onClick={() => onGridConfigChange({ ...gridConfig, shape: 'circle' })}
                  className={`py-2 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    gridConfig.shape === 'circle'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" /> Arena Circular
                </button>
              </div>
            </div>

            {/* Quick Size Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Presets de Tamanho Rápido:
                </label>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: '⚔️ Padrão', w: 20, h: 20, desc: '100x100 ft' },
                  { label: '🏰 Salão', w: 24, h: 36, desc: '120x180 ft' },
                  { label: '🌲 Amplo', w: 36, h: 36, desc: '180x180 ft' },
                  { label: '🐉 Boss', w: 50, h: 50, desc: '250x250 ft' },
                  { label: '🚪 Corredor', w: 12, h: 36, desc: '60x180 ft' },
                  { label: '⚡ Duelo', w: 14, h: 14, desc: '70x70 ft' },
                ].map((preset) => {
                  const isActive = gridConfig.widthCells === preset.w && gridConfig.heightCells === preset.h;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        onGridConfigChange({
                          ...gridConfig,
                          widthCells: preset.w,
                          heightCells: preset.h,
                        });
                        toast.success(`Tamanho ajustado: ${preset.w}x${preset.h} células (${preset.desc})`);
                      }}
                      className={`p-1.5 rounded-lg border text-left flex flex-col transition-all ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-bold text-[10px] truncate">{preset.label}</span>
                      <span className="text-[8.5px] text-slate-500 font-mono">{preset.w}x{preset.h} ({preset.desc})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Matcher (Casar Proporção do Mapa / Evitar Distorção) */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  📐 Casar Proporção do Mapa:
                </span>
                <span className="text-[9px] text-sky-400 font-mono">Zero Distorção</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[
                  {
                    label: '🎬 16:9',
                    name: 'Living Map / YouTube',
                    apply: (w: number) => Math.max(6, Math.round((w * 9) / 16 / 2) * 2),
                    ratio: '16:9' as const,
                  },
                  {
                    label: '📺 4:3',
                    name: 'Clássico VTT',
                    apply: (w: number) => Math.max(6, Math.round((w * 3) / 4 / 2) * 2),
                    ratio: '4:3' as const,
                  },
                  {
                    label: '🔲 1:1',
                    name: 'Quadrado',
                    apply: (w: number) => w,
                    ratio: '1:1' as const,
                  },
                  {
                    label: '🎞️ 21:9',
                    name: 'Ultrawide',
                    apply: (w: number) => Math.max(6, Math.round((w * 9) / 21 / 2) * 2),
                    ratio: '21:9' as const,
                  },
                ].map((item) => {
                  const targetH = item.apply(gridConfig.widthCells);
                  const isCurrent = gridConfig.heightCells === targetH;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        onGridConfigChange({
                          ...gridConfig,
                          heightCells: targetH,
                          aspectRatio: item.ratio,
                        });
                        toast.success(`Proporção ajustada para ${item.label} (${gridConfig.widthCells}x${targetH} células)!`);
                      }}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        isCurrent
                          ? 'bg-sky-500/20 border-sky-500 text-sky-200 font-bold shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                      }`}
                      title={`${item.name} -> ${gridConfig.widthCells}x${targetH} células`}
                    >
                      <span className="text-[10px] font-bold block">{item.label}</span>
                      <span className="text-[8px] text-slate-400 font-mono block">{gridConfig.widthCells}x{targetH}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modo de Enquadramento da Textura */}
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[9.5px] text-slate-400">Enquadramento:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onGridConfigChange({ ...gridConfig, textureFitMode: 'repeat' });
                      toast.info('Modo: Piso Contínuo (Textura repete a cada 5ft sem esticar).');
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                      (gridConfig.textureFitMode || 'repeat') === 'repeat'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="A textura se repete a cada célula de 5ft. Expandir o grid adiciona mais piso sem distorção."
                  >
                    🔄 Piso Contínuo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onGridConfigChange({ ...gridConfig, textureFitMode: 'aspect_fit' });
                      toast.info('Modo: Mapa Único (Enquadra o mapa inteiro no grid).');
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                      gridConfig.textureFitMode === 'aspect_fit'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Enquadra o mapa completo como uma imagem única."
                  >
                    🖼️ Mapa Único
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Dimensions (Width X & Length Z) with Aspect Lock */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400">Dimensões Personalizadas:</span>
                <button
                  type="button"
                  onClick={() => setIsAspectLocked(!isAspectLocked)}
                  className={`px-2 py-0.5 rounded-md border text-[9.5px] font-bold flex items-center gap-1 transition-all ${
                    isAspectLocked
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isAspectLocked ? 'Proporção 1:1 travada (quadrado)' : 'Livre (X e Z independentes)'}
                >
                  {isAspectLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                  {isAspectLocked ? '1:1 Travado' : 'Proporção Livre'}
                </button>
              </div>

              {/* Largura (X) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-300 font-medium">Largura (Eixo X):</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {gridConfig.widthCells} células ({gridConfig.widthCells * 5} ft)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newW = Math.max(6, gridConfig.widthCells - 2);
                      onGridConfigChange({
                        ...gridConfig,
                        widthCells: newW,
                        heightCells: isAspectLocked ? newW : gridConfig.heightCells,
                      });
                    }}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="6"
                    max="60"
                    step="2"
                    value={gridConfig.widthCells}
                    onChange={(e) => {
                      const newW = parseInt(e.target.value, 10);
                      onGridConfigChange({
                        ...gridConfig,
                        widthCells: newW,
                        heightCells: isAspectLocked ? newW : gridConfig.heightCells,
                      });
                    }}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newW = Math.min(60, gridConfig.widthCells + 2);
                      onGridConfigChange({
                        ...gridConfig,
                        widthCells: newW,
                        heightCells: isAspectLocked ? newW : gridConfig.heightCells,
                      });
                    }}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Comprimento (Z) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-300 font-medium">Comprimento / Altura (Eixo Z):</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {gridConfig.heightCells} células ({gridConfig.heightCells * 5} ft)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newH = Math.max(6, gridConfig.heightCells - 2);
                      onGridConfigChange({
                        ...gridConfig,
                        heightCells: newH,
                        widthCells: isAspectLocked ? newH : gridConfig.widthCells,
                      });
                    }}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="6"
                    max="60"
                    step="2"
                    value={gridConfig.heightCells}
                    onChange={(e) => {
                      const newH = parseInt(e.target.value, 10);
                      onGridConfigChange({
                        ...gridConfig,
                        heightCells: newH,
                        widthCells: isAspectLocked ? newH : gridConfig.widthCells,
                      });
                    }}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newH = Math.min(60, gridConfig.heightCells + 2);
                      onGridConfigChange({
                        ...gridConfig,
                        heightCells: newH,
                        widthCells: isAspectLocked ? newH : gridConfig.widthCells,
                      });
                    }}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Living Map & Video Alignment Calibration (se disponível) */}
            {onVideoGridConfigChange && (
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    🎯 Calibração Fina do Mapa / Vídeo:
                  </span>
                  <span className="text-[9px] text-amber-400 font-mono">Projeção Independente</span>
                </div>

                {/* Zoom / Escala */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9.5px]">
                    <span className="text-slate-300 font-medium">Zoom / Escala da Projeção:</span>
                    <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {Math.round((videoGridConfig?.scale ?? 1.0) * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newScale = Math.max(0.2, Number(((videoGridConfig?.scale ?? 1.0) - 0.05).toFixed(2)));
                        onVideoGridConfigChange({
                          scale: newScale,
                          offsetX: videoGridConfig?.offsetX ?? 0,
                          offsetY: videoGridConfig?.offsetY ?? 0,
                          gridOpacity: gridConfig.lineOpacity,
                          gridColor: gridConfig.lineColor,
                          aspectRatio: gridConfig.aspectRatio || '16:9',
                        });
                      }}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0.2"
                      max="5.0"
                      step="0.02"
                      value={videoGridConfig?.scale ?? 1.0}
                      onChange={(e) =>
                        onVideoGridConfigChange({
                          scale: parseFloat(e.target.value),
                          offsetX: videoGridConfig?.offsetX ?? 0,
                          offsetY: videoGridConfig?.offsetY ?? 0,
                          gridOpacity: gridConfig.lineOpacity,
                          gridColor: gridConfig.lineColor,
                          aspectRatio: gridConfig.aspectRatio || '16:9',
                        })
                      }
                      className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newScale = Math.min(5.0, Number(((videoGridConfig?.scale ?? 1.0) + 0.05).toFixed(2)));
                        onVideoGridConfigChange({
                          scale: newScale,
                          offsetX: videoGridConfig?.offsetX ?? 0,
                          offsetY: videoGridConfig?.offsetY ?? 0,
                          gridOpacity: gridConfig.lineOpacity,
                          gridColor: gridConfig.lineColor,
                          aspectRatio: gridConfig.aspectRatio || '16:9',
                        });
                      }}
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Deslocamento X e Z */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-400">Offset X:</span>
                      <span className="font-mono text-slate-300">{videoGridConfig?.offsetX ?? 0}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={videoGridConfig?.offsetX ?? 0}
                      onChange={(e) =>
                        onVideoGridChangeHelper(parseInt(e.target.value, 10), videoGridConfig?.offsetY ?? 0)
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-400">Offset Z:</span>
                      <span className="font-mono text-slate-300">{videoGridConfig?.offsetY ?? 0}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="1"
                      value={videoGridConfig?.offsetY ?? 0}
                      onChange={(e) =>
                        onVideoGridChangeHelper(videoGridConfig?.offsetX ?? 0, parseInt(e.target.value, 10))
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* High-Contrast Grid Line Colors */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Cor das Linhas da Grade:</label>
              <div className="flex items-center gap-1.5">
                {[
                  { color: '#0284c7', label: 'Azul Arcana' },
                  { color: '#eab308', label: 'Dourado Celestial' },
                  { color: '#10b981', label: 'Esmeralda' },
                  { color: '#ef4444', label: 'Carmesim' },
                  { color: '#f8fafc', label: 'Branco Puro' },
                  { color: '#0f172a', label: 'Sombra' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => onGridConfigChange({ ...gridConfig, lineColor: c.color })}
                    title={c.label}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      gridConfig.lineColor === c.color ? 'ring-2 ring-white scale-110' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
                <label className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center cursor-pointer bg-slate-800 hover:border-slate-500 text-[10px]" title="Cor personalizada">
                  🎨
                  <input
                    type="color"
                    value={gridConfig.lineColor || '#0284c7'}
                    onChange={(e) => onGridConfigChange({ ...gridConfig, lineColor: e.target.value })}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Grid Opacity Slider */}
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-300 font-medium">Opacidade das Linhas:</span>
                <span className="font-mono font-bold text-sky-300 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/30">
                  {Math.round(gridConfig.lineOpacity * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 font-mono">0%</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={gridConfig.lineOpacity}
                  onChange={(e) => onGridConfigChange({ ...gridConfig, lineOpacity: parseFloat(e.target.value) })}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <span className="text-[9px] text-slate-500 font-mono">100%</span>
              </div>
            </div>

            {/* Reset Grid Button */}
            <button
              type="button"
              onClick={() => {
                onGridConfigChange({
                  ...gridConfig,
                  widthCells: 20,
                  heightCells: 20,
                  shape: 'square',
                  lineColor: '#0284c7',
                  lineOpacity: 0.35,
                  textureFitMode: 'repeat',
                  aspectRatio: '1:1',
                });
                toast.success('Grade restaurada para o padrão (20x20 células / 100ft).');
              }}
              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-98"
            >
              <RotateCw className="w-3 h-3 text-slate-400" /> Resetar Grade para Padrão (20x20)
            </button>
          </div>
        )}

        {/* TAB 4: 3D SPELL TEMPLATES */}
        {activeTab === 'spells' && (
          <div className="space-y-2.5">
            <p className="text-[10px] text-slate-400">Selecione uma magia para medir a área de efeito 3D:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleQuickSpell('Bola de Fogo', 'sphere', 20, '#ef4444')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-red-400">🔥 Bola de Fogo</span>
                <span className="text-[9px] text-slate-500">Esfera 20ft (Fogo)</span>
              </button>

              <button
                onClick={() => handleQuickSpell('Mãos Flamejantes', 'cone', 15, '#f97316')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-orange-400">📐 Cone de Chamas</span>
                <span className="text-[9px] text-slate-500">Cone 15ft (Fogo)</span>
              </button>

              <button
                onClick={() => handleQuickSpell('Sopro de Dragão', 'cone', 30, '#38bdf8')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-sky-400">❄️ Sopro Gélido</span>
                <span className="text-[9px] text-slate-500">Cone 30ft (Gelo)</span>
              </button>

              <button
                onClick={() => handleQuickSpell('Relâmpago', 'line', 100, '#a855f7', 5)}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-purple-400">⚡ Relâmpago</span>
                <span className="text-[9px] text-slate-500">Linha 100ft x 5ft</span>
              </button>
            </div>

            {activeSpellTemplate && (
              <button
                onClick={onClearSpellTemplate}
                className="w-full py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 mt-2"
              >
                <X className="w-3 h-3" /> Remover Modelo de Magia do Grid
              </button>
            )}
          </div>
        )}

        {/* TAB 5: ELEVATION & FLY */}
        {activeTab === 'elevation' && (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400">Defina a altitude de voo / andar do token selecionado:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 10, 20, 30, 40, 50, 60, 90].map((ft) => (
                <button
                  key={ft}
                  onClick={() => onSetTokenElevation && onSetTokenElevation(ft)}
                  className={`py-2 rounded-lg border font-mono font-bold text-[11px] transition-all ${
                    selectedTokenElevation === ft
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {ft === 0 ? 'Chão (0ft)' : `+${ft}ft`}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-500">Tokens no ar recebem um indicador de altitude e têm seu alcance de tiro calculado em 3D.</p>
          </div>
        )}
      </div>
    </div>
  );
};
