'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, 
  Plus, 
  Sparkles, 
  RefreshCw, 
  Move, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Hand,
  GitFork
} from 'lucide-react';
import { LoreNode, WorldEntity, ConnectionType } from '@/lib/types';
import { useWorld } from '@/context/WorldContext';

interface NodePosition {
  x: number;
  y: number;
}

export const LoreGraph: React.FC = () => {
  const { activeWorld, worldEntities, updateWorldEntity } = useWorld();
  const [nodes, setNodes] = useState<LoreNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<LoreNode | null>(null);
  const [simulatedConsequence, setSimulatedConsequence] = useState<string | null>(null);

  // Canvas Pan & Zoom States
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Drag and drop positions map
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('codex_lore_positions') : null;
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Persistir posições ao alterar
  const updateAndSavePosition = (id: string, pos: NodePosition) => {
    setNodePositions((prev) => {
      const updated = { ...prev, [id]: pos };
      try {
        localStorage.setItem('codex_lore_positions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Merge dynamic world entities from WorldContext into graph nodes
  useEffect(() => {
    const mappedEntities: LoreNode[] = worldEntities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.category === 'npc' ? 'npc' : e.category === 'location' ? 'location' : 'faction',
      status: e.status === 'active' || e.status === 'allied' ? 'alive' : 'dead',
      description: e.shortDesc,
      connectedTo: e.connections || [],
    }));

    setNodes(mappedEntities);
    
    setSelectedNode((prevSelected) => {
      if (prevSelected && mappedEntities.find((n) => n.id === prevSelected.id)) {
        return mappedEntities.find((n) => n.id === prevSelected.id) || prevSelected;
      }
      return mappedEntities.length > 0 ? mappedEntities[0] : null;
    });

    if (mappedEntities.length > 0) {
      setNodePositions((prevPos) => {
        const newPos = { ...prevPos };
        worldEntities.forEach((e, idx) => {
          if (!newPos[e.id]) {
            newPos[e.id] = {
              x: 60 + (idx % 3) * 220,
              y: 60 + Math.floor(idx / 3) * 160,
            };
          }
        });
        return newPos;
      });
    }
  }, [worldEntities]);

  const getStatusColor = (status: LoreNode['status']) => {
    switch (status) {
      case 'alive':
      case 'active':
        return 'border-emerald-500 bg-emerald-950/40 text-emerald-300';
      case 'dead':
      case 'destroyed':
        return 'border-rose-600 bg-rose-950/40 text-rose-300';
      case 'hostile':
        return 'border-amber-500 bg-amber-950/40 text-amber-300';
      case 'allied':
        return 'border-cyan-500 bg-cyan-950/40 text-cyan-300';
    }
  };

  const getConnectionColor = (type: ConnectionType | string) => {
    switch (type) {
      case 'allied': return '#10b981'; // emerald-500
      case 'hostile': return '#f43f5e'; // rose-500
      case 'family':
      case 'member': return '#a855f7'; // purple-500
      case 'location': return '#f59e0b'; // amber-500
      case 'neutral':
      default: return '#64748b'; // slate-500
    }
  };

  const simulateImpact = (node: LoreNode) => {
    if (node.id === 'kraag-npc') {
      setSimulatedConsequence(
        `⚡ Efeito Dominó (Morte de Kraag): A Guilda das Sombras perde seu braço mercenário. O Rei Aris descobre a traição da guilda nos subterrâneos de Valíria e envia guardas reais, iniciando uma guerra urbana civil!`
      );
    } else if (node.id === 'rei-aris') {
      setSimulatedConsequence(
        `⚡ Efeito Dominó (Queda do Rei Aris): Valíria entra em caos sucessório. A Guilda das Sombras tenta tomar os portões do palácio, enquanto hordas hobgoblins marcham sobre a cidade!`
      );
    } else {
      setSimulatedConsequence(
        `⚡ Reação do Mundo: As facções conectadas ajustam suas posturas diplomáticas baseadas no destino de ${node.name}.`
      );
    }
  };

  const toggleStatus = (id: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const newStatus = n.status === 'alive' ? 'dead' : n.status === 'dead' ? 'hostile' : 'alive';
          const updated = { ...n, status: newStatus as any };
          if (selectedNode?.id === id) setSelectedNode(updated);
          return updated;
        }
        return n;
      })
    );
  };

  // Window-level listeners para garantir arraste (pan) e drag de cards 100% fluido
  useEffect(() => {
    if (!isPanning && !draggingNodeId) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      } else if (draggingNodeId && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const mouseCanvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
        const mouseCanvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

        updateAndSavePosition(draggingNodeId, {
          x: Math.round(mouseCanvasX - dragOffset.x),
          y: Math.round(mouseCanvasY - dragOffset.y),
        });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, draggingNodeId, panStart, pan, zoom, dragOffset]);

  // Zoom Controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.3), 2.5));
  };

  // Pan Canvas Mouse Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Se o clique não foi em um card (que faz e.stopPropagation()), inicia panning no canvas
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleNodeMouseDown = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDraggingNodeId(id);
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pos = nodePositions[id] || { x: 0, y: 0 };
    
    // Converte posição do mouse para coordenadas internas do canvas transformado
    const mouseCanvasX = (e.clientX - canvasRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - canvasRect.top - pan.y) / zoom;

    setDragOffset({
      x: mouseCanvasX - pos.x,
      y: mouseCanvasY - pos.y,
    });
  };

  return (
    <div className="flex-1 h-full w-full bg-[#0a0d14] flex flex-col overflow-hidden min-h-0 select-none">
      {/* Top Header */}
      <div className="p-4 bg-[#0f141d] border-b border-[#2a3449] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Grafo Interativo de Lore & Relações
            </h2>
            <p className="text-[10px] text-slate-400">
              {activeWorld?.title ? `Mundo: ${activeWorld.title}` : 'Teia de Entidades e Efeito Dominó'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Nós Conectados: <span className="text-emerald-400 font-bold">{nodes.length}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 h-full min-h-0 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Visual Interactive Graph View */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          className={`md:col-span-2 p-6 overflow-hidden bg-tactical-grid relative flex flex-col justify-between cursor-grab active:cursor-grabbing ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {/* Transparent Canvas Receiver for Pan Drag */}
          <div id="lore-canvas-bg" className="absolute inset-0 z-0" />

          {/* Floating Pan & Zoom Controls Toolbar */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-[#0f141d]/90 border border-[#2a3449] backdrop-blur-md p-1.5 rounded-xl shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-amber-400 px-1 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors"
              title="Reduzir Zoom (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-[#2a3449] mx-1" />
            <button
              onClick={handleResetView}
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="Resetar Visão (100% & Centralizar)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Canvas Navigation Hint */}
          <div className="absolute bottom-4 left-4 z-30 pointer-events-none hidden sm:flex items-center gap-2 bg-[#0f141d]/80 border border-[#2a3449]/70 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 backdrop-blur-sm font-mono">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Arraste o fundo para mover • Scroll do mouse para Zoom</span>
          </div>

          {/* Transformed Canvas World Layer */}
          <div
            className="absolute inset-0 origin-top-left transition-transform duration-75 ease-out pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Canvas SVG for Connection Lines */}
            <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0">
              {nodes.map((node) => {
                const startPos = nodePositions[node.id];
                if (!startPos) return null;
                return node.connectedTo.map((conn) => {
                  const targetPos = nodePositions[conn.targetId];
                  if (!targetPos) return null;
                  return (
                    <line
                      key={`${node.id}-${conn.targetId}`}
                      x1={startPos.x + 90}
                      y1={startPos.y + 45}
                      x2={targetPos.x + 90}
                      y2={targetPos.y + 45}
                      stroke={getConnectionColor(conn.type)}
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                  );
                });
              })}
            </svg>

            {/* Draggable Node Cards Container (pointer-events-none para não bloquear pan no espaço vazio) */}
            <div className="relative w-[5000px] h-[5000px] z-10 pointer-events-none">
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const pos = nodePositions[node.id] || { x: 50, y: 50 };
                return (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                    style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                    className={`absolute w-44 p-3 rounded-xl border-2 transition-shadow cursor-grab active:cursor-grabbing shadow-xl backdrop-blur-md pointer-events-auto ${
                      isSelected
                        ? 'border-amber-400 bg-[#1a2234] shadow-amber-500/20 z-20 scale-105'
                        : 'border-[#2a3449] bg-[#161c28]/90 hover:border-slate-500 z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">{node.type}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${getStatusColor(node.status)}`}>
                        {node.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs text-slate-100 truncate">{node.name}</h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{node.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consequence Banner */}
          {simulatedConsequence && (
            <div className="mt-4 p-3.5 bg-[#161c28] border border-amber-500/40 rounded-xl max-w-xl w-full shadow-2xl z-30 animate-fade-in relative pointer-events-auto">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
                <Sparkles className="w-4 h-4" /> Simulação de Impacto Narrativo
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-serif">{simulatedConsequence}</p>
            </div>
          )}
        </div>

        {/* Selected Node Details Panel */}
        {selectedNode && (
          <div className="bg-[#0f141d] border-l border-[#2a3449] p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">{selectedNode.type}</span>
                <button
                  onClick={() => toggleStatus(selectedNode.id)}
                  className={`text-xs px-2.5 py-1 rounded font-bold border ${getStatusColor(selectedNode.status)} hover:opacity-80 transition-opacity cursor-pointer`}
                >
                  Alterar Status
                </button>
              </div>

              <h2 className="text-lg font-bold text-slate-100">{selectedNode.name}</h2>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#0a0d14] p-3 rounded-lg border border-[#2a3449]">
                {selectedNode.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conexões na Lore:</h4>
                <div className="space-y-1.5">
                  {selectedNode.connectedTo.map((conn) => {
                    const targetNode = nodes.find((n) => n.id === conn.targetId);
                    if (!targetNode) return null;
                    return (
                      <div
                        key={conn.targetId}
                        onClick={() => setSelectedNode(targetNode)}
                        className="p-2 bg-[#0a0d14] hover:bg-[#161c28] border border-[#2a3449] rounded-lg flex items-center justify-between cursor-pointer transition-all border-l-4"
                        style={{ borderLeftColor: getConnectionColor(conn.type) }}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-200 font-semibold">{targetNode.name}</span>
                          <span className="text-[9px] text-slate-500 uppercase">{conn.type}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{targetNode.type}</span>
                      </div>
                    );
                  })}
                  
                  {selectedNode.connectedTo.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Nenhuma conexão estabelecida.</p>
                  )}
                  
                  <div className="pt-2 space-y-1.5">
                    <button
                      onClick={() => {
                        const event = new CustomEvent('openWorldEntityModal', { detail: { entityId: selectedNode.id } });
                        window.dispatchEvent(event);
                      }}
                      className="w-full py-2 bg-[#161c28] hover:bg-[#1f2738] border border-amber-500/30 text-amber-400 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Gerenciar Conexões
                    </button>

                    <button
                      onClick={() => {
                        const event = new CustomEvent('switchWorldEditorTab', { detail: { tab: 'family_tree' } });
                        window.dispatchEvent(event);
                      }}
                      className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <GitFork className="w-3.5 h-3.5 text-amber-400" />
                      Ver Árvore Genealógica
                    </button>
                    <p className="text-[9px] text-slate-500 mt-1 text-center">
                      (Para adicionar ou remover, edite a entidade)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => simulateImpact(selectedNode)}
              className="w-full py-2.5 mt-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simular Reação do Mundo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

