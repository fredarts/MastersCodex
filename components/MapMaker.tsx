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
  X
} from 'lucide-react';
import { Combatant, CampaignMap } from '@/lib/types';
import { useSession } from '@/context/SessionContext';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { toast } from 'sonner';
import { storageService } from '@/lib/services/storageService';
import { DysonCanvas } from './map/DysonCanvas';

interface MapMakerProps {
  combatants: Combatant[];
}

export type TileType = 'floor' | 'wall' | 'grass' | 'water' | 'door' | 'trap' | 'chest' | 'stash';

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
}

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
  const { broadcastToPlayerView } = useLiveCockpit();

  const [grid, setGrid] = useState<Cell[][]>(() => createInitialGrid());
  const [selectedTool, setSelectedTool] = useState<'paint' | 'box' | 'fog-reveal' | 'fog-cover' | 'token' | 'measure' | 'calibrate' | 'pan'>('fog-reveal');
  const [boxMode, setBoxMode] = useState<'fill' | 'room' | 'hollow' | 'fog-reveal' | 'fog-cover'>('fill');
  const [selectedTileType, setSelectedTileType] = useState<TileType>('floor');
  const [selectedTokenCombatant, setSelectedTokenCombatant] = useState<Combatant | null>(null);
  
  // Custom Map Image Upload & Calibration state
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [gridScale, setGridScale] = useState<number>(40); // Cell Size in px
  const [gridOffsetX, setGridOffsetX] = useState<number>(0);
  const [gridOffsetY, setGridOffsetY] = useState<number>(0);
  const [calibrationLine, setCalibrationLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Measure Ruler State
  const [measureStart, setMeasureStart] = useState<{ r: number; c: number } | null>(null);
  const [measuredDistance, setMeasuredDistance] = useState<{ feet: number; meters: number } | null>(null);

  // Multi-map list and UI state
  const [activeMap, setActiveMap] = useState<CampaignMap | null>(null);
  const [mapTitle, setMapTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sync first active map when campaignMaps loads
  useEffect(() => {
    if (campaignMaps.length > 0) {
      if (!activeMap) {
        const firstMap = campaignMaps[0];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveMap(firstMap);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMapTitle(firstMap.title);
        if (firstMap.gridData) {
          setGrid(firstMap.gridData.grid || createInitialGrid(80, 80));
          setBgImageUrl(firstMap.gridData.bgImageUrl || null);
          setGridScale(firstMap.gridData.gridScale || 40);
          setGridOffsetX(firstMap.gridData.gridOffsetX || 0);
          setGridOffsetY(firstMap.gridData.gridOffsetY || 0);
        }
      } else {
        const updated = campaignMaps.find(m => m.id === activeMap.id);
        if (!updated) {
          const firstMap = campaignMaps[0];
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setActiveMap(firstMap);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMapTitle(firstMap.title);
          if (firstMap.gridData) {
            setGrid(firstMap.gridData.grid || createInitialGrid(80, 80));
            setBgImageUrl(firstMap.gridData.bgImageUrl || null);
            setGridScale(firstMap.gridData.gridScale || 40);
            setGridOffsetX(firstMap.gridData.gridOffsetX || 0);
            setGridOffsetY(firstMap.gridData.gridOffsetY || 0);
          }
        }
      }
    }
  }, [campaignMaps, activeMap]);

  // Auto-create a default map if campaignMaps is completely empty
  const hasAutoCreated = useRef(false);
  useEffect(() => {
    if (campaignMaps.length === 0 && !hasAutoCreated.current) {
      hasAutoCreated.current = true;
      createCampaignMap('Masmorra Inicial', {
        grid: createInitialGrid(80, 80),
        gridScale: 40,
        gridOffsetX: 0,
        gridOffsetY: 0
      }).then((newMap) => {
        if (newMap) {
          setActiveMap(newMap);
          setMapTitle(newMap.title);
        }
      });
    }
  }, [campaignMaps, createCampaignMap]);

  // Helper to switch active map
  const selectMap = (map: CampaignMap) => {
    setActiveMap(map);
    setMapTitle(map.title);
    if (map.gridData) {
      setGrid(map.gridData.grid || createInitialGrid(80, 80));
      setBgImageUrl(map.gridData.bgImageUrl || null);
      setGridScale(map.gridData.gridScale || 40);
      setGridOffsetX(map.gridData.gridOffsetX || 0);
      setGridOffsetY(map.gridData.gridOffsetY || 0);
    }
  };

  // Debounced auto-save to database (campaign_maps table)
  useEffect(() => {
    if (!activeMap) return;

    const delayDebounce = setTimeout(() => {
      const payload = {
        grid,
        bgImageUrl,
        gridScale,
        gridOffsetX,
        gridOffsetY,
      };
      updateCampaignMap(activeMap.id, mapTitle || activeMap.title, payload).then(() => {
        broadcastToPlayerView({
          mapData: {
            ...payload,
            activeMapId: activeMap.id,
            sceneId: activeScene?.id,
          }
        });
      }).catch((e) => {
        console.error('Auto-save CampaignMap failed:', e);
      });
    }, 1200);

    return () => clearTimeout(delayDebounce);
  }, [grid, bgImageUrl, gridScale, gridOffsetX, gridOffsetY, activeMap, mapTitle, updateCampaignMap, broadcastToPlayerView, activeScene?.id]);

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

  const clearGridContent = () => {
    if (window.confirm("Deseja limpar todo o mapa e resetar para um grid gigante de 80x80 células de rocha sólida?")) {
      setGrid(createInitialGrid(80, 80));
      toast.success("Grid resetado para 80x80 de rocha!");
    } else if (window.confirm("Deseja apenas limpar os terrenos desenhados no grid atual? (Mantendo o tamanho do grid atual)")) {
      setGrid((prev) => prev.map((row) => row.map((cell) => ({
        ...cell,
        type: 'wall',
        fog: true,
        tokenName: undefined,
        tokenColor: undefined,
      }))));
      toast.info("Terreno do grid atual limpo.");
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
                 onClick={() => {
                   const title = prompt('Nome do Novo Mapa:', `Masmorra ${campaignMaps.length + 1}`);
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
                         onClick={(e) => {
                           e.stopPropagation();
                           if (window.confirm(`Deseja deletar o mapa "${m.title}"?`)) {
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
          <div className="absolute top-4 left-16 z-30 px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl flex items-center gap-1.5 shadow-2xl max-w-[60vw] overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0">Tokens:</span>
            {combatants.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedTokenCombatant(c)}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex-shrink-0 transition-all ${
                  selectedTokenCombatant?.id === c.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-[#161c28] text-slate-300 border border-[#2a3449]'
                }`}
              >
                {c.name}
              </button>
            ))}
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

        {/* Main Canvas Grid Render */}
        <DysonCanvas
          key={activeMap?.id || 'empty'}
          grid={grid}
          bgImageUrl={bgImageUrl}
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
      </div>
    </div>
  );
};
