'use client';

import React from 'react';
import { 
  Paintbrush, 
  Square, 
  Eye, 
  EyeOff, 
  MapPin, 
  Sparkles, 
  Ruler, 
  Hand, 
  Grid
} from 'lucide-react';

export type MapTool = 
  | 'paint' 
  | 'box' 
  | 'fog-reveal' 
  | 'fog-cover' 
  | 'token' 
  | 'measure' 
  | 'calibrate' 
  | 'pan' 
  | 'light' 
  | 'draw-pencil' 
  | 'draw-circle' 
  | 'draw-rect' 
  | 'draw-eraser' 
  | 'draw-text';

interface MapMakerToolbarProps {
  selectedTool: MapTool;
  onSelectTool: (tool: MapTool) => void;
  hasBackgroundImage: boolean;
}

interface ToolDef {
  id: MapTool;
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  description: string;
  condition?: boolean;
}

export const MapMakerToolbar: React.FC<MapMakerToolbarProps> = ({
  selectedTool,
  onSelectTool,
  hasBackgroundImage,
}) => {
  const tools: ToolDef[] = [
    {
      id: 'paint',
      label: 'Pincel de Terreno',
      shortcut: 'P',
      icon: Paintbrush,
      colorClass: 'text-amber-400',
      description: 'Desenhe paredes, pisos, portas, baús e armadilhas célula por célula.',
    },
    {
      id: 'box',
      label: 'Retângulo / Salas',
      shortcut: 'R',
      icon: Square,
      colorClass: 'text-amber-400',
      description: 'Crie salas completas, preencha áreas ou selecione regiões retangulares.',
    },
    {
      id: 'fog-reveal',
      label: 'Revelar Fog',
      shortcut: 'F',
      icon: Eye,
      colorClass: 'text-cyan-400',
      description: 'Revele a névoa de guerra para os jogadores nesta área.',
    },
    {
      id: 'fog-cover',
      label: 'Ocultar Fog',
      shortcut: 'H',
      icon: EyeOff,
      colorClass: 'text-slate-400',
      description: 'Cubra novamente a área com névoa de guerra oculta aos jogadores.',
    },
    {
      id: 'token',
      label: 'Posicionar Token',
      shortcut: 'T',
      icon: MapPin,
      colorClass: 'text-cyan-400',
      description: 'Insira tokens de jogadores, monstros ou NPCs no tabuleiro.',
    },
    {
      id: 'light',
      label: 'Fontes de Luz',
      shortcut: 'L',
      icon: Sparkles,
      colorClass: 'text-amber-400',
      description: 'Posicione tochas, velas, lampiões e magias com iluminação dinâmica.',
    },
    {
      id: 'measure',
      label: 'Régua de Distância',
      shortcut: 'M',
      icon: Ruler,
      colorClass: 'text-cyan-400',
      description: 'Meça distâncias em pés (ft) e metros entre células do mapa.',
    },
    {
      id: 'pan',
      label: 'Mover / Pan',
      shortcut: 'Espaço',
      icon: Hand,
      colorClass: 'text-slate-300',
      description: 'Arraste para navegar livremente pelo canvas sem desenhar.',
    },
    {
      id: 'calibrate',
      label: 'Calibrar Grid',
      shortcut: 'C',
      icon: Grid,
      colorClass: 'text-rose-400',
      description: 'Ajuste a escala e alinhamento do grid sobre a imagem de fundo.',
      condition: hasBackgroundImage,
    },
  ];

  return (
    <aside className="absolute left-3 top-20 z-30 flex flex-col items-center bg-[#0d121a]/95 backdrop-blur-md border border-[#222c3d] rounded-2xl p-1.5 shadow-2xl shadow-black/50 select-none space-y-1">
      {tools.filter(t => t.condition !== false).map((tool) => {
        const IconComponent = tool.icon;
        const isSelected = selectedTool === tool.id;

        return (
          <div key={tool.id} className="relative group">
            <button
              onClick={() => onSelectTool(tool.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 scale-105 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#182030]'
              }`}
              aria-label={tool.label}
            >
              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-slate-950 stroke-[2.5]' : ''}`} />
            </button>

            {/* Photoshop style Tooltip on hover */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none animate-in fade-in slide-in-from-left-2 duration-150">
              <div className="bg-[#0f141d] border border-[#2a3449] text-slate-200 text-xs px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{tool.label}</span>
                  <span className="font-mono text-[10px] bg-slate-900 text-amber-400 border border-slate-700 px-1.5 py-0.5 rounded">
                    {tool.shortcut}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 max-w-[200px] whitespace-normal leading-tight">
                  {tool.description}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
};
