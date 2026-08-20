'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Crown, 
  Plus, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Download, 
  Eye, 
  EyeOff, 
  Filter, 
  GitFork, 
  Heart, 
  Trash2, 
  Edit3, 
  Save, 
  Share2, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { 
  FamilyTree, 
  FamilyMemberNode, 
  FamilyRelationshipEdge, 
  WorldEntity 
} from '@/lib/types';
import { useWorld } from '@/context/WorldContext';
import { familyTreeService } from '@/lib/services/familyTreeService';
import { calculateFamilyTreeLayout, TreeLayoutResult } from '@/lib/utils/familyTreeLayout';
import { FamilyMemberCard } from './FamilyMemberCard';
import { FamilyMemberModal } from './FamilyMemberModal';
import { AiDynastyGeneratorModal } from './AiDynastyGeneratorModal';

interface FamilyTreeViewerProps {
  onOpenNpcModal?: (entityId: string) => void;
}

export const FamilyTreeViewer: React.FC<FamilyTreeViewerProps> = ({
  onOpenNpcModal,
}) => {
  const { activeWorld, worldEntities } = useWorld();
  const [trees, setTrees] = useState<FamilyTree[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
  const [activeTree, setActiveTree] = useState<FamilyTree | null>(null);

  // View & Filter States
  const [isDmMode, setIsDmMode] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'alive_only' | 'succession_only'>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Pan & Zoom States
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMemberNode | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEditingHouseInfo, setIsEditingHouseInfo] = useState(false);
  const [houseNameInput, setHouseNameInput] = useState('');
  const [houseMottoInput, setHouseMottoInput] = useState('');

  // 1. Carregar árvores ao inicializar
  useEffect(() => {
    if (!activeWorld?.id) return;

    familyTreeService.fetchFamilyTrees(activeWorld.id).then((res) => {
      if (res.ok && res.value) {
        setTrees(res.value);
        if (res.value.length > 0) {
          setActiveTreeId(res.value[0].id);
          setActiveTree(res.value[0]);
        } else {
          // Criar árvore inicial padrão se nenhuma existir
          const initialTree: FamilyTree = {
            id: `tree_${Date.now()}`,
            worldId: activeWorld.id,
            name: `Dinastia de ${activeWorld.title}`,
            houseMotto: 'Pelo Reino e pela Glória',
            members: [
              {
                id: 'founder_1',
                name: 'Lorde Fundador',
                title: 'Patriarca Ancestral',
                generation: 0,
                isAlive: false,
                successionStatus: 'deceased',
                customBadge: '👑 Fundador',
                notes: 'O nobre que ergueu a linhagem nos primórdios da era.',
              },
            ],
            relationships: [],
            layoutDirection: 'top_bottom',
            customStyles: { theme: 'royal_gold', connectorStyle: 'smooth' },
          };

          familyTreeService.saveFamilyTree(initialTree).then((savedRes) => {
            if (savedRes.ok && savedRes.value) {
              setTrees([savedRes.value]);
              setActiveTreeId(savedRes.value.id);
              setActiveTree(savedRes.value);
            }
          });
        }
      }
    });
  }, [activeWorld?.id]);

  // Atualizar árvore ativa quando activeTreeId muda
  useEffect(() => {
    if (!activeTreeId) return;
    const found = trees.find((t) => t.id === activeTreeId);
    if (found) {
      setActiveTree(found);
      setHouseNameInput(found.name);
      setHouseMottoInput(found.houseMotto || '');
    }
  }, [activeTreeId, trees]);

  // 2. Filtragem de Membros
  const filteredMembers = useMemo(() => {
    if (!activeTree) return [];
    let list = activeTree.members;

    if (filterMode === 'alive_only') {
      list = list.filter((m) => m.isAlive);
    } else if (filterMode === 'succession_only') {
      list = list.filter(
        (m) =>
          m.successionStatus === 'ruling' ||
          m.successionStatus === 'heir_apparent' ||
          m.successionStatus === 'heir_presumptive' ||
          m.successionStatus === 'claimant'
      );
    }

    return list;
  }, [activeTree, filterMode]);

  // 3. Cálculo de Layout
  const layout: TreeLayoutResult = useMemo(() => {
    if (!activeTree) {
      return {
        nodes: [],
        edges: [],
        marriageJunctions: [],
        bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 },
      };
    }

    return calculateFamilyTreeLayout(
      filteredMembers,
      activeTree.relationships,
      activeTree.layoutDirection || 'top_bottom'
    );
  }, [filteredMembers, activeTree]);

  // 4. Manipulação de Zoom Ancorado no Cursor & Pan
  const handleZoom = (factor: number, clientX?: number, clientY?: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Ponto focal do zoom na tela (onde o mouse está posicionado ou centro do canvas)
    const focalX = clientX !== undefined ? clientX - rect.left : rect.width / 2;
    const focalY = clientY !== undefined ? clientY - rect.top : rect.height / 2;

    const newZoom = Math.min(Math.max(0.2, zoom * factor), 3.0);
    if (Math.abs(newZoom - zoom) < 0.001) return;

    // Converte ponto da tela para coordenadas no mundo virtual antes do zoom
    const worldX = (focalX - pan.x) / zoom;
    const worldY = (focalY - pan.y) / zoom;

    // Calcula novo deslocamento pan para manter exatamente o ponto sob o cursor
    const newPanX = focalX - worldX * newZoom;
    const newPanY = focalY - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    handleZoom(zoomFactor, e.clientX, e.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Inicia pan caso o usuário não esteja interagindo com botões/inputs específicos
    if (e.button === 0 && !(e.target as HTMLElement).closest('button, input, select, textarea, a')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetView = () => {
    if (!canvasRef.current || !layout.nodes || layout.nodes.length === 0) {
      setZoom(1);
      setPan({ x: 60, y: 60 });
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    // Centraliza o conteúdo da árvore horizontalmente no canvas
    const contentWidth = layout.bounds.maxX - layout.bounds.minX;
    const initialZoom = Math.min(1, Math.max(0.6, (rect.width - 120) / contentWidth));
    const targetX = rect.width / 2 - ((layout.bounds.minX + contentWidth / 2) * initialZoom);
    const targetY = 60;
    
    setZoom(initialZoom);
    setPan({ x: targetX, y: targetY });
  };

  // 5. Salvar Árvore
  const handleSaveActiveTree = async (updated: FamilyTree) => {
    setActiveTree(updated);
    setTrees((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await familyTreeService.saveFamilyTree(updated);
  };

  // 6. Adicionar / Editar Membro
  const handleSaveMember = (
    memberData: FamilyMemberNode,
    allUpdatedRelations?: FamilyRelationshipEdge[]
  ) => {
    if (!activeTree) return;

    const existingIndex = activeTree.members.findIndex((m) => m.id === memberData.id);
    let updatedMembers = [...activeTree.members];

    if (existingIndex >= 0) {
      updatedMembers[existingIndex] = memberData;
    } else {
      updatedMembers.push(memberData);
    }

    const updatedRelations = allUpdatedRelations !== undefined
      ? allUpdatedRelations
      : activeTree.relationships;

    const updatedTree: FamilyTree = {
      ...activeTree,
      members: updatedMembers,
      relationships: updatedRelations,
    };

    handleSaveActiveTree(updatedTree);
  };

  // 7. Excluir Membro
  const handleDeleteMember = (memberId: string) => {
    if (!activeTree) return;

    const updatedMembers = activeTree.members.filter((m) => m.id !== memberId);
    const updatedRelations = activeTree.relationships.filter(
      (r) => r.fromId !== memberId && r.toId !== memberId
    );

    const updatedTree: FamilyTree = {
      ...activeTree,
      members: updatedMembers,
      relationships: updatedRelations,
    };

    handleSaveActiveTree(updatedTree);
    if (selectedMemberId === memberId) setSelectedMemberId(null);
  };

  // 8. Criar Nova Casa / Árvore
  const handleCreateNewTree = () => {
    if (!activeWorld) return;
    const newName = prompt('Nome da Nova Casa / Família:', 'Casa Nova');
    if (!newName) return;

    const newTree: FamilyTree = {
      id: `tree_${Date.now()}`,
      worldId: activeWorld.id,
      name: newName.trim(),
      houseMotto: 'Honra e Poder',
      members: [
        {
          id: `mem_${Date.now()}`,
          name: 'Patriarca Fundador',
          generation: 0,
          isAlive: true,
          successionStatus: 'ruling',
          customBadge: '👑 Líder',
        },
      ],
      relationships: [],
      layoutDirection: 'top_bottom',
      customStyles: { theme: 'royal_gold', connectorStyle: 'smooth' },
    };

    familyTreeService.saveFamilyTree(newTree).then((res) => {
      if (res.ok && res.value) {
        setTrees((prev) => [res.value!, ...prev]);
        setActiveTreeId(res.value!.id);
        setActiveTree(res.value!);
      }
    });
  };

  // 9. Deletar Casa / Árvore
  const handleDeleteTree = async () => {
    if (!activeTree || !activeWorld) return;
    if (!confirm(`Excluir toda a árvore genealógica de "${activeTree.name}"?`)) return;

    await familyTreeService.deleteFamilyTree(activeTree.id, activeWorld.id);
    const remaining = trees.filter((t) => t.id !== activeTree.id);
    setTrees(remaining);
    if (remaining.length > 0) {
      setActiveTreeId(remaining[0].id);
      setActiveTree(remaining[0]);
    } else {
      setActiveTreeId(null);
      setActiveTree(null);
    }
  };

  // 10. Aplicar Dinastia da IA
  const handleApplyAiDynasty = (aiData: Partial<FamilyTree>) => {
    if (!activeWorld) return;

    const newTree: FamilyTree = {
      id: `tree_ai_${Date.now()}`,
      worldId: activeWorld.id,
      name: aiData.name || 'Nova Dinastia',
      houseMotto: aiData.houseMotto || undefined,
      description: aiData.description || undefined,
      members: aiData.members || [],
      relationships: aiData.relationships || [],
      layoutDirection: 'top_bottom',
      customStyles: { theme: 'royal_gold', connectorStyle: 'smooth' },
    };

    familyTreeService.saveFamilyTree(newTree).then((res) => {
      if (res.ok && res.value) {
        setTrees((prev) => [res.value!, ...prev]);
        setActiveTreeId(res.value!.id);
        setActiveTree(res.value!);
      }
    });
  };

  // 11. Salvar Edição do Nome/Lema da Casa
  const handleSaveHouseInfo = () => {
    if (!activeTree) return;
    const updated: FamilyTree = {
      ...activeTree,
      name: houseNameInput.trim() || activeTree.name,
      houseMotto: houseMottoInput.trim() || undefined,
    };
    handleSaveActiveTree(updated);
    setIsEditingHouseInfo(false);
  };

  // 12. Exportar Handout / SVG
  const handleExportTree = () => {
    if (!activeTree) return;
    alert(`Exportando diagrama da "${activeTree.name}" para handout de jogadores!`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0d14] text-slate-100 overflow-hidden select-none relative">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#101522] border-b border-slate-800 z-10 shadow-md">
        {/* Left: Dynasty Selector & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <GitFork className="w-5 h-5" />
          </div>

          <div className="relative">
            {trees.length > 0 ? (
              <select
                value={activeTreeId || ''}
                onChange={(e) => setActiveTreeId(e.target.value)}
                className="bg-[#171f30] border border-slate-700 text-slate-100 font-bold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {trees.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.members.length} membros)
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-bold text-slate-300">Nenhuma Árvore</span>
            )}
          </div>

          {activeTree && !isEditingHouseInfo && (
            <div className="hidden lg:flex items-center gap-2">
              {activeTree.houseMotto && (
                <span className="text-xs italic text-slate-400 font-serif border-l border-slate-700 pl-3">
                  "{activeTree.houseMotto}"
                </span>
              )}
              <button
                onClick={() => {
                  setHouseNameInput(activeTree.name);
                  setHouseMottoInput(activeTree.houseMotto || '');
                  setIsEditingHouseInfo(true);
                }}
                className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                title="Editar Lema e Nome da Casa"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isEditingHouseInfo && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={houseNameInput}
                onChange={(e) => setHouseNameInput(e.target.value)}
                placeholder="Nome da Casa"
                className="bg-[#161c2b] border border-slate-700 text-xs px-2 py-1 rounded text-slate-100"
              />
              <input
                type="text"
                value={houseMottoInput}
                onChange={(e) => setHouseMottoInput(e.target.value)}
                placeholder="Lema"
                className="bg-[#161c2b] border border-slate-700 text-xs px-2 py-1 rounded text-slate-100"
              />
              <button
                onClick={handleSaveHouseInfo}
                className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Salvar
              </button>
            </div>
          )}
        </div>

        {/* Center: Filters & View Controls */}
        <div className="hidden md:flex items-center gap-2 bg-[#161c2b] p-1 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({activeTree?.members.length || 0})
          </button>
          <button
            onClick={() => setFilterMode('alive_only')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'alive_only'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apenas Vivos
          </button>
          <button
            onClick={() => setFilterMode('succession_only')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'succession_only'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Linha de Sucessão
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* DM Mode Toggle */}
          <button
            onClick={() => setIsDmMode(!isDmMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isDmMode
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/80'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={isDmMode ? 'Modo Mestre (Segredos Visíveis)' : 'Modo Jogador (Segredos Ocultos)'}
          >
            {isDmMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{isDmMode ? 'Visão do Mestre' : 'Visão do Jogador'}</span>
          </button>

          {/* AI Generator Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500/20 to-pink-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all font-mono"
            title="Gerar Dinastia Completa com IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span className="hidden sm:inline">Gerar Dinastia</span>
          </button>

          {/* Add Member Button */}
          <button
            onClick={() => {
              setEditingMember(null);
              setIsMemberModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">+ Membro</span>
          </button>

          {/* New Tree Button */}
          <button
            onClick={handleCreateNewTree}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Criar Nova Casa / Família"
          >
            <Crown className="w-4 h-4 text-amber-400" />
          </button>

          {/* Delete Tree Button */}
          {activeTree && trees.length > 1 && (
            <button
              onClick={handleDeleteTree}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 transition-colors"
              title="Excluir Esta Casa Nobre"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="tree-canvas-bg flex-1 relative overflow-hidden bg-[#090d14] cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(51, 65, 85, 0.25) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      >
        {/* Transformable Canvas Layer */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${layout.bounds.width}px`,
            height: `${layout.bounds.height}px`,
          }}
          className="transition-transform duration-75 pointer-events-auto"
        >
          {/* SVG Connections Layer */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: `${layout.bounds.width}px`, height: `${layout.bounds.height}px` }}
          >
            <defs>
              <linearGradient id="goldSuccessionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>

            {/* Render Edges */}
            {layout.edges.map((edge) => {
              if (edge.isSecret && !isDmMode) return null;

              return (
                <g key={edge.id}>
                  <path
                    d={edge.path}
                    fill="none"
                    stroke={edge.color || '#f59e0b'}
                    strokeWidth={edge.type === 'spouse' ? 2.5 : 2}
                    strokeDasharray={edge.dashed ? '6,4' : undefined}
                    strokeOpacity={0.75}
                    className="transition-all hover:stroke-opacity-100"
                  />
                  {/* Marriage Marker Icon at midpoint */}
                  {edge.type === 'spouse' && edge.midpoint && (
                    <g transform={`translate(${edge.midpoint.x - 7}, ${edge.midpoint.y - 7})`}>
                      <circle cx="7" cy="7" r="9" fill="#141a29" stroke="#f59e0b" strokeWidth="1.5" />
                      <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render Nodes Layer */}
          {layout.nodes.map((node) => (
            <div
              key={node.member.id}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
              }}
            >
              <FamilyMemberCard
                member={node.member}
                linkedNpc={node.member.worldEntityId ? worldEntities.find((e) => e.id === node.member.worldEntityId) : null}
                isSelected={selectedMemberId === node.member.id}
                isDmView={isDmMode}
                onSelect={(m) => setSelectedMemberId(m.id)}
                onEdit={(m) => {
                  setEditingMember(m);
                  setIsMemberModalOpen(true);
                }}
                onAddRelation={(m) => {
                  setEditingMember(null);
                  setIsMemberModalOpen(true);
                }}
                onOpenNpcSheet={(worldEntityId) => {
                  if (onOpenNpcModal) onOpenNpcModal(worldEntityId);
                }}
              />
            </div>
          ))}
        </div>

        {/* Floating Zoom & Pan Controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-1.5 bg-[#121724]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-2xl z-20">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700 transition-colors"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1" />
          <button
            onClick={resetView}
            className="p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
            title="Resetar Posição e Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Floating Legend / Stats */}
        <div className="absolute bottom-6 left-6 hidden sm:flex items-center gap-3 bg-[#121724]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 text-[11px] text-slate-300 shadow-xl z-20">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Casamento
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Descendência
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Bastardo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Adotado
          </span>
        </div>
      </div>

      {/* Member Edit / Create Modal */}
      {isMemberModalOpen && (
        <FamilyMemberModal
          isOpen={isMemberModalOpen}
          member={editingMember}
          allMembers={activeTree?.members || []}
          relationships={activeTree?.relationships || []}
          onClose={() => setIsMemberModalOpen(false)}
          onSave={handleSaveMember}
          onDelete={handleDeleteMember}
        />
      )}

      {/* AI Dynasty Generator Modal */}
      {isAiModalOpen && (
        <AiDynastyGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApplyDynasty={handleApplyAiDynasty}
        />
      )}
    </div>
  );
};
