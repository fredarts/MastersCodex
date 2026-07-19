'use client';

import React, { useState } from 'react';
import { Network, Plus, Shield, Skull, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { LoreNode } from '@/lib/types';
import { INITIAL_LORE_NODES } from '@/lib/srd-data';

export const LoreGraph: React.FC = () => {
  const [nodes, setNodes] = useState<LoreNode[]>(INITIAL_LORE_NODES);
  const [selectedNode, setSelectedNode] = useState<LoreNode | null>(INITIAL_LORE_NODES[0]);
  const [simulatedConsequence, setSimulatedConsequence] = useState<string | null>(null);

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

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Top Header */}
      <div className="p-4 bg-[#0f141d] border-b border-[#2a3449] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Lore Graph & Teia de Relacionamentos
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Nós Ativos: <span className="text-emerald-400 font-bold">{nodes.length}</span>
        </span>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
        {/* Visual Graph View */}
        <div className="md:col-span-2 p-6 overflow-auto bg-tactical-grid flex flex-col justify-center items-center relative">
          <div className="w-full max-w-xl grid grid-cols-2 gap-6 relative">
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative shadow-xl backdrop-blur-md ${
                    isSelected
                      ? 'border-amber-400 bg-[#1a2234] shadow-amber-500/20 scale-105'
                      : 'border-[#2a3449] bg-[#161c28]/90 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{node.type}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${getStatusColor(node.status)}`}>
                      {node.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100">{node.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{node.description}</p>
                </div>
              );
            })}
          </div>

          {/* Consequence Banner */}
          {simulatedConsequence && (
            <div className="mt-6 p-4 bg-[#161c28] border border-amber-500/40 rounded-xl max-w-xl w-full shadow-2xl animate-fade-in">
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
                  className={`text-xs px-2.5 py-1 rounded font-bold border ${getStatusColor(selectedNode.status)} hover:opacity-80 transition-opacity`}
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
                        className="flex items-center justify-between p-2 rounded-lg bg-[#161c28] border border-[#2a3449] hover:border-amber-500/40 cursor-pointer text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-200">{conn.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#2a3449]">
              <button
                onClick={() => simulateImpact(selectedNode)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simular Consequência de Evento</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
