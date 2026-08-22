'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Layers, 
  Search, 
  Map as MapIcon, 
  Check, 
  Calendar,
  X,
  Copy,
  Edit2
} from 'lucide-react';
import { CampaignMap } from '@/lib/types';
import { normalizeToMultiLevel } from '@/lib/map/mapLevelsCore';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface MapManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignMaps: CampaignMap[];
  activeMapId: string | null;
  onSelectMap: (map: CampaignMap) => void;
  onCreateMap: (title: string) => Promise<void>;
  onDeleteMap: (mapId: string) => Promise<void>;
  onDuplicateMap?: (map: CampaignMap) => Promise<void>;
}

export const MapManagerModal: React.FC<MapManagerModalProps> = ({
  isOpen,
  onClose,
  campaignMaps,
  activeMapId,
  onSelectMap,
  onCreateMap,
  onDeleteMap,
  onDuplicateMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const { showConfirm, showPrompt } = useCustomDialog();

  if (!isOpen) return null;

  const filteredMaps = campaignMaps.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    await onCreateMap(newMapName.trim());
    setNewMapName('');
    setIsCreating(false);
  };

  const getMapFloorCount = (map: CampaignMap) => {
    try {
      const normalized = normalizeToMultiLevel(map.gridData, map.title);
      return normalized.levels?.length || 1;
    } catch {
      return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0f141d] border border-[#2a3449] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2a3449] flex items-center justify-between bg-[#131a26]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Gerenciador de Mapas & Masmorras
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-normal">
                  {campaignMaps.length}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Selecione um mapa para editar, crie novas masmorras ou gerencie os níveis da sua campanha.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar in modal */}
        <div className="p-4 border-b border-[#2a3449]/60 bg-[#0c1017] flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar mapa pelo nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#121824] border border-[#2a3449] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Mapa
          </button>
        </div>

        {/* Quick New Map Inline Form */}
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="p-4 bg-amber-950/20 border-b border-amber-500/30 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              placeholder="Nome do novo mapa (ex: Tumba de Anúbis)..."
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              className="flex-1 bg-[#0a0d14] border border-amber-500/40 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newMapName.trim()}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewMapName(''); }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Grid List of Maps */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredMaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <MapIcon className="w-12 h-12 stroke-[1.2] mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">Nenhum mapa encontrado</p>
              <p className="text-xs mt-1">Crie um novo mapa para começar a desenhar sua masmorra.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredMaps.map((map) => {
                const isActive = map.id === activeMapId;
                const floorCount = getMapFloorCount(map);

                return (
                  <div
                    key={map.id}
                    onClick={() => {
                      onSelectMap(map);
                      onClose();
                    }}
                    className={`relative group rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                        : 'bg-[#121824]/60 border-[#2a3449] hover:bg-[#182030] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isActive 
                            ? 'bg-cyan-500/20 text-cyan-300' 
                            : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                        }`}>
                          <MapIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${
                            isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                          }`}>
                            {map.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              <Layers className="w-2.5 h-2.5" />
                              {floorCount} {floorCount === 1 ? 'andar' : 'andares'}
                            </span>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                                <Check className="w-2.5 h-2.5" /> Ativo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {campaignMaps.length > 1 && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmed = await showConfirm({
                                title: 'Excluir Mapa',
                                message: `Tem certeza que deseja deletar "${map.title}"? Todos os andares deste mapa serão perdidos.`,
                                confirmText: 'Excluir Mapa',
                                cancelText: 'Cancelar',
                                variant: 'danger',
                              });
                              if (confirmed) {
                                await onDeleteMap(map.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition-all"
                            title="Excluir este mapa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#2a3449]/40 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Clique para carregar no editor</span>
                      <span className="font-mono text-slate-400 group-hover:text-cyan-400 transition-colors">
                        {isActive ? 'Em edição →' : 'Abrir →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#2a3449] bg-[#0d121a] flex items-center justify-between text-xs text-slate-400">
          <span>Seus mapas são sincronizados automaticamente com o Live Cockpit do Mestre.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
