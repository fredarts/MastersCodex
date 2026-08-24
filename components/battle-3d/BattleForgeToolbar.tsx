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
  Download
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
  buildMode: 'idle' | 'place' | 'delete' | 'spell';
  onSetBuildMode: (mode: 'idle' | 'place' | 'delete' | 'spell') => void;
  blockRotation: number;
  onRotateBlock: () => void;
  onClearAllBlocks: () => void;
  activeSpellTemplate: SpellTemplate3D | null;
  onSpawnSpellTemplate: (template: Omit<SpellTemplate3D, 'id' | 'x' | 'z'>) => void;
  onClearSpellTemplate: () => void;
  selectedTokenElevation?: number;
  onSetTokenElevation?: (elevationFt: number) => void;
  blocksCount: number;
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
}) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'grid' | 'spells' | 'elevation'>('blocks');
  const [blockCategory, setBlockCategory] = useState<'all' | 'structures' | 'lights' | 'props'>('all');

  if (!isDm || !isOpen) return null;

  const filteredBlockTypes = (Object.keys(BUILDING_BLOCK_CATALOG) as BuildingBlockType[]).filter((type) => {
    if (blockCategory === 'all') return true;
    return BUILDING_BLOCK_CATALOG[type].category === blockCategory;
  });

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

  return (
    <div className="absolute top-14 left-4 z-40 w-84 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150">
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
            </h3>
            <p className="text-[10px] text-slate-400">Paredes procedurais, luzes e props</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Status Bar */}
      <div className="px-3 py-1.5 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-[10px]">
        <span className="text-slate-400">
          Modo: <strong className="text-amber-300 uppercase">
            {buildMode === 'place' ? '🏗️ Construindo' : buildMode === 'delete' ? '🧹 Deletando' : buildMode === 'spell' ? '✨ Magia 3D' : '👀 Seleção (Clique no Bloco)'}
          </strong>
        </span>
        <div className="flex items-center gap-1">
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
            title="Modo Borracha / Deletar Bloco"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/30 p-1 gap-1">
        {([
          { id: 'blocks', label: 'Blocos', icon: <Box className="w-3 h-3" /> },
          { id: 'grid', label: 'Grade & Arena', icon: <Sliders className="w-3 h-3" /> },
          { id: 'spells', label: 'Magias 3D', icon: <Sparkles className="w-3 h-3 text-amber-400" /> },
          { id: 'elevation', label: 'Voo/Altura', icon: <ArrowUp className="w-3 h-3 text-sky-400" /> },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
      <div className="p-3 max-h-84 overflow-y-auto custom-scrollbar">
        {/* TAB 1: BLOCKS */}
        {activeTab === 'blocks' && (
          <div className="space-y-2.5">
            {/* Category Filter Pills */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px] font-bold">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'structures', label: '🧱 Paredes' },
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

        {/* TAB 2: GRID & ARENA */}
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
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> Quadrado
                </button>
                <button
                  onClick={() => onGridConfigChange({ ...gridConfig, shape: 'circle' })}
                  className={`py-2 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                    gridConfig.shape === 'circle'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" /> Arena Circular
                </button>
              </div>
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Largura (X):</span>
                <span className="font-mono font-bold text-amber-300">{gridConfig.widthCells} células ({gridConfig.widthCells * 5} ft)</span>
              </div>
              <input
                type="range"
                min="8"
                max="50"
                step="2"
                value={gridConfig.widthCells}
                onChange={(e) => onGridConfigChange({ ...gridConfig, widthCells: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Comprimento (Z):</span>
                <span className="font-mono font-bold text-amber-300">{gridConfig.heightCells} células ({gridConfig.heightCells * 5} ft)</span>
              </div>
              <input
                type="range"
                min="8"
                max="50"
                step="2"
                value={gridConfig.heightCells}
                onChange={(e) => onGridConfigChange({ ...gridConfig, heightCells: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Grid Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Opacidade das Linhas:</span>
                <span className="font-mono font-bold text-slate-300">{Math.round(gridConfig.lineOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={gridConfig.lineOpacity}
                onChange={(e) => onGridConfigChange({ ...gridConfig, lineOpacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          </div>
        )}

        {/* TAB 3: 3D SPELL TEMPLATES */}
        {activeTab === 'spells' && (
          <div className="space-y-2.5">
            <p className="text-[10px] text-slate-400">Selecione uma magia para medir a área de efeito 3D:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleQuickSpell('Bola de Fogo', 'sphere', 20, '#ef4444')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-red-400">🔥 Bola de Fogo</span>
                <span className="text-[9px] text-slate-500">Esfera 20ft (40ft diâmetro)</span>
              </button>

              <button
                onClick={() => handleQuickSpell('Mãos Flamejantes', 'cone', 15, '#f97316')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-orange-400">📐 Cone de Chamas</span>
                <span className="text-[9px] text-slate-500">Cone 15ft</span>
              </button>

              <button
                onClick={() => handleQuickSpell('Sopro de Dragão', 'cone', 30, '#38bdf8')}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 rounded-xl text-left flex flex-col gap-0.5"
              >
                <span className="font-bold text-sky-400">❄️ Sopro Gélido</span>
                <span className="text-[9px] text-slate-500">Cone 30ft</span>
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

        {/* TAB 4: ELEVATION & FLY */}
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
