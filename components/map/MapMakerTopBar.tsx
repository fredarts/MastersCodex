'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  Upload, 
  Sparkles, 
  Download, 
  Map as MapIcon, 
  Grid, 
  Eye, 
  EyeOff, 
  FolderOpen, 
  Image as ImageIcon, 
  HelpCircle, 
  Maximize2,
  Sun,
  Zap,
  Check,
  Compass,
  BookOpen,
  Activity
} from 'lucide-react';
import { MapLevel } from '@/lib/types';

interface MapMakerTopBarProps {
  mapTitle: string;
  onMapTitleChange: (title: string) => void;
  levels: MapLevel[];
  activeLevelId: string;
  onSwitchLevel: (levelId: string) => void;
  onAddLevel: () => void;
  onRenameLevel: (levelId: string) => void;
  onDeleteLevel: (levelId: string) => void;
  onOpenMapManager: () => void;
  onOpenAIDungeonModal: () => void;
  onOpenDossierModal: () => void;
  onUploadImage: () => void;
  onUploadUVTT: () => void;
  onRemoveBackground: () => void;
  onCalibrateGrid: () => void;
  onRevealAllFog: () => void;
  onCoverAllFog: () => void;
  onClearGrid: () => void;
  onManualSave: () => void;
  hasBackgroundImage: boolean;
  totalMapsCount: number;
  renderLighting: boolean;
  onToggleLighting: () => void;
  renderVision: boolean;
  onToggleVision: () => void;
  renderFog: boolean;
  onToggleFog: () => void;
}

export const MapMakerTopBar: React.FC<MapMakerTopBarProps> = ({
  mapTitle,
  onMapTitleChange,
  levels,
  activeLevelId,
  onSwitchLevel,
  onAddLevel,
  onRenameLevel,
  onDeleteLevel,
  onOpenMapManager,
  onOpenAIDungeonModal,
  onOpenDossierModal,
  onUploadImage,
  onUploadUVTT,
  onRemoveBackground,
  onCalibrateGrid,
  onRevealAllFog,
  onCoverAllFog,
  onClearGrid,
  onManualSave,
  hasBackgroundImage,
  totalMapsCount,
  renderLighting,
  onToggleLighting,
  renderVision,
  onToggleVision,
  renderFog,
  onToggleFog,
}) => {
  const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isFogMenuOpen, setIsFogMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const floorMenuRef = useRef<HTMLDivElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const fogMenuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (floorMenuRef.current && !floorMenuRef.current.contains(event.target as Node)) {
        setIsFloorMenuOpen(false);
      }
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false);
      }
      if (fogMenuRef.current && !fogMenuRef.current.contains(event.target as Node)) {
        setIsFogMenuOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLevel = levels.find((l) => l.id === activeLevelId) || levels[0];

  return (
    <header className="h-14 bg-[#0d121a] border-b border-[#222c3d] flex items-center justify-between px-4 z-40 select-none shrink-0 shadow-lg relative">
      {/* LEFT SECTION: Logo, Map Selector, Map Title & Floor Dropdown */}
      <div className="flex items-center gap-3">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 pr-3 border-r border-[#222c3d]">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-sm">
            <Grid className="w-4 h-4 font-bold" />
          </div>
          <span className="font-extrabold text-xs tracking-wider text-slate-100 uppercase hidden sm:inline-block">
            Dungeon Forge
          </span>
        </div>

        {/* Map Browser Modal Trigger */}
        <button
          onClick={onOpenMapManager}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141b27] hover:bg-[#1c2638] text-cyan-300 hover:text-cyan-200 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
          title="Abrir Gerenciador de Mapas"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate max-w-[100px] sm:max-w-[140px]">Mapas ({totalMapsCount})</span>
        </button>

        {/* Map Title Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={mapTitle}
            onChange={(e) => onMapTitleChange(e.target.value)}
            placeholder="Nome do Mapa..."
            className="w-36 md:w-52 bg-[#080b10] hover:bg-[#101622] focus:bg-[#101622] border border-[#222c3d] focus:border-cyan-500 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-semibold focus:outline-none transition-colors truncate"
            title="Clique para editar o título deste mapa"
          />
        </div>

        {/* FLOORS / ANDARES DROPDOWN */}
        <div className="relative" ref={floorMenuRef}>
          <button
            onClick={() => setIsFloorMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="Selecionar ou gerenciar andares da masmorra"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate max-w-[110px] md:max-w-[140px]">
              {currentLevel?.name || 'Andar'}
            </span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 font-mono">
              {levels.length}
            </span>
            <ChevronDown className={`w-3 h-3 text-amber-400 transition-transform ${isFloorMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFloorMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-64 bg-[#0f141d] border border-[#2a3449] rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center justify-between border-b border-[#2a3449] pb-1.5 mb-1.5">
                <span>Andares da Masmorra</span>
                <span>{levels.length} pisos</span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {levels.map((lvl, idx) => {
                  const isActive = lvl.id === activeLevelId;
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => {
                        onSwitchLevel(lvl.id);
                        setIsFloorMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-all group ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                          : 'text-slate-300 hover:bg-[#182030] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono">
                          P{idx}
                        </span>
                        <span className="truncate">{lvl.name}</span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenameLevel(lvl.id);
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded transition-colors"
                          title="Renomear andar"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {levels.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteLevel(lvl.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
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

              <div className="mt-2 pt-2 border-t border-[#2a3449]">
                <button
                  onClick={() => {
                    setIsFloorMenuOpen(false);
                    onAddLevel();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Novo Andar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER SECTION: Menu Dropdowns (Arquivo, Fog) & AI Generator */}
      <div className="flex items-center gap-2">
        {/* Menu "Arquivo / Imagem" */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setIsFileMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#141b27] rounded-lg transition-colors border border-transparent hover:border-[#2a3449]"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Arquivo</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isFileMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-56 bg-[#0f141d] border border-[#2a3449] rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setIsFileMenuOpen(false);
                  onUploadImage();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#1a2234] rounded-lg transition-colors text-left"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Carregar Imagem de Fundo</span>
              </button>

              <button
                onClick={() => {
                  setIsFileMenuOpen(false);
                  onUploadUVTT();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-950/30 rounded-lg transition-colors text-left font-semibold"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Importar UVTT (.df2vtt / .uvtt)</span>
              </button>

              {hasBackgroundImage && (
                <>
                  <div className="my-1 border-t border-[#2a3449]/60" />
                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onCalibrateGrid();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/30 rounded-lg transition-colors text-left"
                  >
                    <Grid className="w-3.5 h-3.5 text-rose-400" />
                    <span>Calibrar Grid Fundo</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsFileMenuOpen(false);
                      onRemoveBackground();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Remover Imagem de Fundo</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Menu "Visão & Fog / Desempenho" */}
        <div className="relative" ref={fogMenuRef}>
          <button
            onClick={() => setIsFogMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors border ${
              (!renderLighting || !renderVision || !renderFog)
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#141b27] border-transparent hover:border-[#2a3449]'
            }`}
            title="Ajustar visualização, iluminação, fog e opções de desempenho"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Visão & Fog</span>
            {(!renderLighting || !renderVision || !renderFog) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Otimização ativa" />
            )}
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isFogMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-[#0f141d] border border-[#2a3449] rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between border-b border-[#2a3449]/60 pb-1.5 mb-1">
                <span>Camadas & Desempenho</span>
                <span className="text-[9px] text-cyan-400 font-normal font-mono">60 FPS</span>
              </div>

              {/* Toggle Iluminação Dinâmica */}
              <button
                type="button"
                onClick={onToggleLighting}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-200 hover:bg-[#1a2234] rounded-lg transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sun className={`w-3.5 h-3.5 ${renderLighting ? 'text-amber-400' : 'text-slate-600'}`} />
                  <span className={renderLighting ? 'font-semibold' : 'text-slate-500 line-through'}>Iluminação Dinâmica</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  renderLighting ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  {renderLighting ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Toggle Visão / Line of Sight */}
              <button
                type="button"
                onClick={onToggleVision}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-200 hover:bg-[#1a2234] rounded-lg transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Eye className={`w-3.5 h-3.5 ${renderVision ? 'text-cyan-400' : 'text-slate-600'}`} />
                  <span className={renderVision ? 'font-semibold' : 'text-slate-500 line-through'}>Visão / LOS Tokens</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  renderVision ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  {renderVision ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Toggle Névoa de Guerra (Fog) */}
              <button
                type="button"
                onClick={onToggleFog}
                className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-slate-200 hover:bg-[#1a2234] rounded-lg transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <EyeOff className={`w-3.5 h-3.5 ${renderFog ? 'text-purple-400' : 'text-slate-600'}`} />
                  <span className={renderFog ? 'font-semibold' : 'text-slate-500 line-through'}>Névoa de Guerra (Fog)</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  renderFog ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-500'
                }`}>
                  {renderFog ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="my-1.5 border-t border-[#2a3449]/60" />

              <div className="px-2 py-0.5 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                Ações no Mapa
              </div>

              <button
                onClick={() => {
                  setIsFogMenuOpen(false);
                  onRevealAllFog();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2234] rounded-lg transition-colors text-left cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Revelar Todo o Fog</span>
              </button>

              <button
                onClick={() => {
                  setIsFogMenuOpen(false);
                  onCoverAllFog();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2234] rounded-lg transition-colors text-left cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Ocultar Todo o Fog</span>
              </button>

              <button
                onClick={() => {
                  setIsFogMenuOpen(false);
                  onClearGrid();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpar / Resetar Grid</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Dungeon Generator Button */}
        <button
          onClick={onOpenAIDungeonModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold rounded-lg text-xs transition-all shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer shrink-0"
          title="Gerar masmorra procedural ou com inteligência artificial"
        >
          <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
          <span className="hidden md:inline">Gerar Masmorra com IA</span>
          <span className="md:hidden">Masmorra IA</span>
        </button>

        {/* Dossier & Capa Button */}
        <button
          type="button"
          onClick={onOpenDossierModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b27] hover:bg-[#1a2333] border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold rounded-lg text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          title="Configurar Capa, Nível, Lore e Dossier da Masmorra"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Dossier & Capa</span>
          <span className="md:hidden">Dossier</span>
        </button>
      </div>

      {/* RIGHT SECTION: Save & Info */}
      <div className="flex items-center gap-2">
        {/* Help / Shortcuts Button */}
        <div className="relative" ref={helpRef}>
          <button
            onClick={() => setIsHelpOpen((prev) => !prev)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#141b27] rounded-lg transition-colors"
            title="Atalhos e Ajuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {isHelpOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-[#0f141d] border border-[#2a3449] rounded-xl shadow-2xl z-50 p-3 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100">
              <h4 className="font-bold text-slate-100 mb-2 border-b border-[#2a3449] pb-1 flex items-center justify-between">
                <span>Atalhos Rápidos</span>
                <span className="text-[10px] text-amber-400">VTT Studio</span>
              </h4>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pincel</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">P</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Retângulo</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">R</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Revelar Fog</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ocultar Fog</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">H</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tokens</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">T</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fontes de Luz</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">L</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mover / Pan</span>
                  <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Espaço</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={onManualSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          title="Salvar alterações no mapa e andares"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Salvar</span>
        </button>
      </div>
    </header>
  );
};
