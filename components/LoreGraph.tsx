'use client';

import React, { useState, useEffect } from 'react';
import { Network, Plus, Sparkles, RefreshCw, Move, Layers } from 'lucide-react';
import { LoreNode, WorldEntity } from '@/lib/types';
import { INITIAL_LORE_NODES } from '@/lib/srd-data';
import { useWorld } from '@/context/WorldContext';

interface NodePosition {
  x: number;
  y: number;
}

export const LoreGraph: React.FC = () => {
  const { activeWorld, worldEntities } = useWorld();
  const [nodes, setNodes] = useState<LoreNode[]>(INITIAL_LORE_NODES);
  const [selectedNode, setSelectedNode] = useState<LoreNode | null>(INITIAL_LORE_NODES[0]);
  const [simulatedConsequence, setSimulatedConsequence] = useState<string | null>(null);

  // Drag and drop positions map
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>({
    'rei-aris': { x: 50, y: 40 },
    'kraag-npc': { x: 300, y: 40 },
    'valiria-city': { x: 175, y: 180 },
    'guilda-sombras': { x: 175, y: 320 },
  });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Merge dynamic world entities from WorldContext into graph nodes
  useEffect(() => {
    if (worldEntities.length > 0) {
      const mappedEntities: LoreNode[] = worldEntities.map((e, idx) => ({
        id: e.id,
        name: e.name,
        type: e.category === 'npc' ? 'npc' : e.category === 'location' ? 'location' : 'faction',
        status: e.status === 'active' || e.status === 'allied' ? 'alive' : 'dead',
        description: e.shortDesc,
        connectedTo: e.connections || [],
      }));

      setNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newOnly = mappedEntities.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newOnly];
      });

      setNodePositions((prevPos) => {
        const newPos = { ...prevPos };
        worldEntities.forEach((e, idx) => {
          if (!newPos[e.id]) {
            newPos[e.id] = {
              x: 60 + (idx % 3) * 180,
              y: 60 + Math.floor(idx / 3) * 140,
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

  const handleMouseDown = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    setDraggingNodeId(id);
    const pos = nodePositions[id] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNodeId) return;
    const canvasRect = e.currentTarget.getBoundingClientRect();
    const newX = Math.max(10, Math.min(canvasRect.width - 200, e.clientX - dragOffset.x));
    const newY = Math.max(10, Math.min(canvasRect.height - 120, e.clientY - dragOffset.y));

    setNodePositions((prev) => ({
      ...prev,
      [draggingNodeId]: { x: newX, y: newY },
    }));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
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

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Visual Interactive Graph View */}
        <div
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="md:col-span-2 p-6 overflow-hidden bg-tactical-grid relative flex flex-col justify-between"
        >
          {/* Canvas SVG for Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {nodes.map((node) => {
              const startPos = nodePositions[node.id];
              if (!startPos) return null;
              return node.connectedTo.map((targetId) => {
                const targetPos = nodePositions[targetId];
                if (!targetPos) return null;
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={startPos.x + 90}
                    y1={startPos.y + 45}
                    x2={targetPos.x + 90}
                    y2={targetPos.y + 45}
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                );
              });
            })}
          </svg>

          {/* Draggable Node Cards */}
          <div className="relative w-full h-full z-10">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const pos = nodePositions[node.id] || { x: 50, y: 50 };
              return (
                <div
                  key={node.id}
                  onMouseDown={(e) => handleMouseDown(node.id, e)}
                  onClick={() => setSelectedNode(node)}
                  style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                  className={`absolute w-44 p-3 rounded-xl border-2 transition-shadow cursor-grab active:cursor-grabbing shadow-xl backdrop-blur-md ${
                    isSelected
                      ? 'border-amber-400 bg-[#1a2234] shadow-amber-500/20 z-20'
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

          {/* Consequence Banner */}
          {simulatedConsequence && (
            <div className="mt-4 p-3.5 bg-[#161c28] border border-amber-500/40 rounded-xl max-w-xl w-full shadow-2xl z-30 animate-fade-in">
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
                  {selectedNode.connectedTo.map((targetId) => {
                    const conn = nodes.find((n) => n.id === targetId);
                    if (!conn) return null;
                    return (
                      <div
                        key={targetId}
                        onClick={() => setSelectedNode(conn)}
                        className="p-2 bg-[#0a0d14] hover:bg-[#161c28] border border-[#2a3449] rounded-lg flex items-center justify-between cursor-pointer transition-all"
                      >
                        <span className="text-xs text-slate-200 font-semibold">{conn.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{conn.type}</span>
                      </div>
                    );
                  })}
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
