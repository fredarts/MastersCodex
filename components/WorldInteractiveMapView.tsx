'use client';

import React, { useState } from 'react';
import { Map, MapPin, Plus, Navigation, Compass, Shield, Flame, Castle, Eye, Trash2, Sparkles, X } from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntity, WorldMapPin } from '@/lib/types';

export const WorldInteractiveMapView: React.FC = () => {
  const { activeWorld, worldEntities } = useWorld();
  const [pins, setPins] = useState<WorldMapPin[]>([
    {
      id: 'pin-1',
      worldId: activeWorld?.id || '',
      title: 'Capital Imperial de Valíria',
      category: 'location',
      x: 45,
      y: 35,
      description: 'Centro político e cultural abrigando a Cidadela Arcana.',
    },
    {
      id: 'pin-2',
      worldId: activeWorld?.id || '',
      title: 'Fronteira dos Conflitos do Norte',
      category: 'military_conflict',
      x: 68,
      y: 22,
      description: 'Região devastada pelas últimas investidas das forças rebeldes.',
    },
  ]);

  const [selectedPin, setSelectedPin] = useState<WorldMapPin | null>(null);
  const [isAddingPinMode, setIsAddingPinMode] = useState(false);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);

  // New Pin modal state
  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinCategory, setNewPinCategory] = useState<'location' | 'faction' | 'military_conflict' | 'natural_law'>('location');
  const [newPinDesc, setNewPinDesc] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  if (!activeWorld) return null;

  const locationEntities = worldEntities.filter((e) => e.category === 'location' || e.category === 'faction');

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingPinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setClickPos({ x, y });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinTitle.trim() || !clickPos) return;

    const newPin: WorldMapPin = {
      id: `pin-${Date.now()}`,
      worldId: activeWorld.id,
      entityId: selectedEntityId || undefined,
      title: newPinTitle.trim(),
      category: newPinCategory,
      x: clickPos.x,
      y: clickPos.y,
      description: newPinDesc || 'Marcação registrada no mapa de worldbuilding.',
    };

    setPins([...pins, newPin]);
    setClickPos(null);
    setNewPinTitle('');
    setNewPinDesc('');
    setIsAddingPinMode(false);
  };

  const handleDeletePin = (pinId: string) => {
    setPins(pins.filter((p) => p.id !== pinId));
    if (selectedPin?.id === pinId) setSelectedPin(null);
  };

  const getPinIcon = (cat: string) => {
    switch (cat) {
      case 'military_conflict':
        return <Flame className="w-4 h-4 text-rose-400 fill-rose-500/20" />;
      case 'faction':
        return <Shield className="w-4 h-4 text-purple-400 fill-purple-500/20" />;
      case 'natural_law':
        return <Sparkles className="w-4 h-4 text-amber-400 fill-amber-500/20" />;
      default:
        return <MapPin className="w-4 h-4 text-cyan-400 fill-cyan-500/20" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] overflow-hidden select-none p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2a3449]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono">
              FERRAMENTA DE ESTRUTURAÇÃO
            </span>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Map className="w-5 h-5 text-cyan-400" /> Mapa Interativo do Mundo
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Espalhe marcações geográficas, reinos, rotas arcanas e pontos de interesse em {activeWorld.title}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddingPinMode(!isAddingPinMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isAddingPinMode
                ? 'bg-rose-500 text-slate-950 shadow-rose-900/40 animate-pulse'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-900/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingPinMode ? 'Clique no Mapa para Marcar...' : '+ Adicionar Pino no Mapa'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas Workspace */}
      <div className="flex-1 mt-4 relative rounded-2xl overflow-hidden border border-[#2a3449] bg-[#0c1017] flex items-center justify-center">
        {/* Background Grid / Cartography Aesthetic */}
        <div
          onClick={handleMapClick}
          className={`relative w-full h-full min-h-[400px] cursor-crosshair bg-cover bg-center transition-all ${
            isAddingPinMode ? 'ring-2 ring-cyan-400/80 ring-inset' : ''
          }`}
          style={{
            backgroundImage: `radial-gradient(circle, rgba(42, 52, 73, 0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Subtle Compass Rose Overlay */}
          <div className="absolute top-4 right-4 pointer-events-none opacity-20 text-cyan-400">
            <Compass className="w-24 h-24 stroke-[1]" />
          </div>

          {/* Prompt instruction banner */}
          {isAddingPinMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs px-4 py-1.5 rounded-full font-semibold shadow-xl backdrop-blur-md animate-bounce flex items-center gap-2">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Clique em qualquer ponto da cartografia para fincar um novo pino</span>
            </div>
          )}

          {/* Render Pins */}
          {pins.map((pin) => (
            <div
              key={pin.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPin(pin);
              }}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
            >
              <div className="w-8 h-8 rounded-full bg-[#0a0d14]/90 border-2 border-cyan-400 flex items-center justify-center shadow-xl group-hover:scale-125 group-hover:border-amber-400 transition-all">
                {getPinIcon(pin.category)}
              </div>

              {/* Tooltip Label */}
              <div className="absolute left-1/2 -translate-x-1/2 top-9 bg-[#121824]/95 border border-[#2a3449] group-hover:border-cyan-400 text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded shadow-xl whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                {pin.title}
              </div>
            </div>
          ))}
        </div>

        {/* Selected Pin Drawer / Popover */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-[#161c28]/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-fade-in z-20">
            <div className="flex items-center justify-between pb-2 border-b border-[#2a3449] mb-2">
              <div className="flex items-center gap-2">
                {getPinIcon(selectedPin.category)}
                <h4 className="text-sm font-bold text-slate-100 truncate">{selectedPin.title}</h4>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-serif leading-relaxed">{selectedPin.description}</p>
            <div className="mt-2 text-[10px] font-mono text-cyan-400">
              Coordenadas: ({selectedPin.x}%, {selectedPin.y}%)
            </div>

            <div className="mt-3 pt-2 border-t border-[#2a3449] flex justify-end">
              <button
                onClick={() => handleDeletePin(selectedPin.id)}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Pino</span>
              </button>
            </div>
          </div>
        )}

        {/* New Pin Modal */}
        {clickPos && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
            <div className="bg-[#121722] border-2 border-cyan-500/50 rounded-2xl p-6 w-full max-w-4xl lg:max-w-5xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" /> Fincar Novo Pino Geográfico
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">
                Posição selecionada no mapa: X: {clickPos.x}%, Y: {clickPos.y}%
              </p>

              <form onSubmit={handleSavePin} className="space-y-5 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Nome do Ponto no Mapa:</label>
                  <textarea
                    rows={2}
                    required
                    value={newPinTitle}
                    onChange={(e) => setNewPinTitle(e.target.value)}
                    placeholder="Ex: Fortaleza do SolNascente / Passo das Sombras Impossíveis"
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 font-bold focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Categoria da Marcação:</label>
                  <select
                    value={newPinCategory}
                    onChange={(e) => setNewPinCategory(e.target.value as any)}
                    className="w-full bg-[#0a0d14] border-2 border-[#2a3449] focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-bold focus:outline-none transition-all cursor-pointer shadow-inner"
                  >
                    <option value="location">Geografia / Cidade / Reino / Masmorra</option>
                    <option value="faction">Sede de Facção / Guilda / Ordem</option>
                    <option value="military_conflict">Zona de Conflito / Batalha Militar</option>
                    <option value="natural_law">Portal Arcano / Lei Natural / Plano Físico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Descrição & Notas Cartográficas:</label>
                  <textarea
                    rows={4}
                    value={newPinDesc}
                    onChange={(e) => setNewPinDesc(e.target.value)}
                    placeholder="Detalhes geográficos, segredos arcanos ou notas táticas sobre esta marcação..."
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none font-serif leading-relaxed shadow-inner"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#2a3449]">
                  <button
                    type="button"
                    onClick={() => setClickPos(null)}
                    className="px-5 py-2.5 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                  >
                    Salvar Pino no Mapa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
