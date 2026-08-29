'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  PinBoardItem, 
  BoardStringConnection, 
  InvestigationBoard, 
  BoardScope, 
  StringColor,
  PinItemType 
} from '@/lib/investigation/investigationTypes';
import { investigationService } from '@/lib/investigation/investigationService';
import { useCampaign } from '@/context/CampaignContext';
import { useWorld } from '@/context/WorldContext';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeSync } from '@/lib/hooks/useRealtimeSync';
import { 
  Network, 
  Plus, 
  Trash2, 
  X, 
  Sparkles, 
  Search, 
  Link as LinkIcon, 
  Share2, 
  Eye, 
  EyeOff, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Lock, 
  Unlock, 
  MapPin, 
  User, 
  FileText, 
  ShieldAlert, 
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface DetectivePinboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: BoardScope;
  onSelectLoreNode?: (nodeId: string) => void;
}

const COLOR_MAP: Record<StringColor, { bg: string; text: string; stroke: string; name: string }> = {
  red: { bg: 'bg-red-500', text: 'text-red-400', stroke: '#ef4444', name: 'Vermelho (Suspeita)' },
  yellow: { bg: 'bg-amber-400', text: 'text-amber-300', stroke: '#f59e0b', name: 'Dourado (Evidência)' },
  blue: { bg: 'bg-sky-400', text: 'text-sky-300', stroke: '#0ea5e9', name: 'Ciano (Local)' },
  green: { bg: 'bg-emerald-500', text: 'text-emerald-400', stroke: '#10b981', name: 'Verde (Aliado)' },
  white: { bg: 'bg-slate-200', text: 'text-slate-100', stroke: '#e2e8f0', name: 'Branco (Fato)' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-400', stroke: '#a855f7', name: 'Roxo (Mistério)' },
};

const ITEM_TYPE_ICONS: Record<PinItemType, React.ReactNode> = {
  suspect: <User className="w-3.5 h-3.5 text-rose-400" />,
  clue: <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />,
  location: <MapPin className="w-3.5 h-3.5 text-emerald-400" />,
  document: <FileText className="w-3.5 h-3.5 text-sky-400" />,
  quest: <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />,
  custom_note: <FileText className="w-3.5 h-3.5 text-amber-200" />,
  lore_node: <Network className="w-3.5 h-3.5 text-purple-400" />,
};

export const DetectivePinboardModal: React.FC<DetectivePinboardModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'party',
  onSelectLoreNode,
}) => {
  const { activeCampaign } = useCampaign();
  const { worldEntities } = useWorld();
  const { user, roleMode } = useAuth();
  const isDM = roleMode === 'dm';

  const campaignId = activeCampaign?.id || 'default-campaign';
  const userId = user?.id || 'player-anon';

  const [scope, setScope] = useState<BoardScope>(initialScope);
  const [board, setBoard] = useState<InvestigationBoard | null>(null);
  const [mounted, setMounted] = useState(false);

  // Canvas Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // String Drawing Mode
  const [isConnectingMode, setIsConnectingMode] = useState<boolean>(false);
  const [connectionSourcePinId, setConnectionSourcePinId] = useState<string | null>(null);
  const [selectedStringColor, setSelectedStringColor] = useState<StringColor>('red');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Pin Dragging
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Modals & Panels
  const [isCreatingPin, setIsCreatingPin] = useState<boolean>(false);
  const [isImportingLore, setIsImportingLore] = useState<boolean>(false);
  const [selectedPinDetail, setSelectedPinDetail] = useState<PinBoardItem | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<BoardStringConnection | null>(null);
  const [connectionLabelInput, setConnectionLabelInput] = useState('');
  const [connectionColorInput, setConnectionColorInput] = useState<StringColor>('red');

  // New Pin Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<PinItemType>('clue');
  const [newColorTag, setNewColorTag] = useState<StringColor>('red');
  const [newIsWaxSealed, setNewIsWaxSealed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { broadcastInvestigationBoard } = useRealtimeSync({
    campaignId: activeCampaign?.id,
    onInvestigationBoardUpdate: ({ board: remoteBoard }) => {
      if (
        remoteBoard &&
        remoteBoard.campaignId === campaignId &&
        remoteBoard.scope === scope
      ) {
        setBoard(remoteBoard);
      }
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCurrentBoard = async () => {
    const loaded = await investigationService.getBoard(campaignId, scope, userId);
    setBoard(loaded);
  };

  useEffect(() => {
    if (!isOpen || !activeCampaign?.id) return;
    loadCurrentBoard();

    // Escutar eventos locais de sincronização (mesma janela/abas)
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ board: InvestigationBoard }>;
      if (
        customEvent.detail?.board &&
        customEvent.detail.board.campaignId === campaignId &&
        customEvent.detail.board.scope === scope
      ) {
        setBoard(customEvent.detail.board);
      }
    };

    window.addEventListener('codex_investigation_board_sync', handleSyncEvent);
    return () => {
      window.removeEventListener('codex_investigation_board_sync', handleSyncEvent);
    };
  }, [isOpen, campaignId, scope, userId, activeCampaign?.id]);

  // Função auxiliar para salvar e propagar em tempo real
  const persistAndBroadcastBoard = async (updatedBoard: InvestigationBoard) => {
    setBoard(updatedBoard);
    await investigationService.saveBoard(updatedBoard);
    if (updatedBoard.scope === 'party') {
      broadcastInvestigationBoard({ board: updatedBoard });
    }
  };

  if (!isOpen || !mounted || !activeCampaign?.id) return null;

  // Helpers para Ponto de Âncora do Alfinete
  const getPinAnchorPos = (pin: PinBoardItem) => {
    // Alfinete esférico fica centralizado no topo do card (largura 208px -> centro 104px, topo 0px)
    return {
      x: pin.position.x + 104,
      y: pin.position.y,
    };
  };

  // Dragging de Pinos
  const handlePinMouseDown = (e: React.MouseEvent, pin: PinBoardItem) => {
    e.stopPropagation();
    if (isConnectingMode) {
      handlePinClickInConnectMode(pin.id);
      return;
    }
    setDraggingPinId(pin.id);
    const rect = containerRef.current?.getBoundingClientRect();
    const mouseX = (e.clientX - (rect?.left || 0) - pan.x) / zoom;
    const mouseY = (e.clientY - (rect?.top || 0) - pan.y) / zoom;
    setDragOffset({
      x: mouseX - pin.position.x,
      y: mouseY - pin.position.y,
    });
  };

  // Canvas Mouse Move (Pan, Pin Drag e Linha Elástica)
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const currentX = (e.clientX - (rect?.left || 0) - pan.x) / zoom;
    const currentY = (e.clientY - (rect?.top || 0) - pan.y) / zoom;
    setMousePos({ x: currentX, y: currentY });

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (draggingPinId && board) {
      const newX = currentX - dragOffset.x;
      const newY = currentY - dragOffset.y;
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((p) =>
            p.id === draggingPinId
              ? { ...p, position: { x: Math.round(newX), y: Math.round(newY) } }
              : p
          ),
        };
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingPinId && board) {
      persistAndBroadcastBoard(board);
      setDraggingPinId(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // Pan pelo Background
  const handleBackgroundMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      if (isConnectingMode) {
        setIsConnectingMode(false);
        setConnectionSourcePinId(null);
        return;
      }
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  // Zoom pelo Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  // Clique Direto na Bolinha do Alfinete para Puxar ou Conectar Fio
  const handlePushPinClick = async (e: React.MouseEvent, pin: PinBoardItem) => {
    e.stopPropagation();
    e.preventDefault();

    if (!connectionSourcePinId) {
      setConnectionSourcePinId(pin.id);
      setIsConnectingMode(true);
      toast.info(`🧵 Puxando fio de '${pin.title}'. Clique na bolinha de outro card para ligar.`);
      return;
    }

    if (connectionSourcePinId === pin.id) {
      setConnectionSourcePinId(null);
      setIsConnectingMode(false);
      toast.info('Puxada de fio cancelada.');
      return;
    }

    // Conectar ao segundo pino
    await handlePinClickInConnectMode(pin.id);
  };

  // Conexão de Fios
  const handlePinClickInConnectMode = async (targetPinId: string) => {
    if (!board) return;
    if (!connectionSourcePinId) {
      setConnectionSourcePinId(targetPinId);
      setIsConnectingMode(true);
      toast.info('Clique na bolinha de outro card para ligar o fio.');
      return;
    }

    if (connectionSourcePinId === targetPinId) {
      toast.warning('Não é possível ligar um card a ele mesmo.');
      setConnectionSourcePinId(null);
      setIsConnectingMode(false);
      return;
    }

    const res = await investigationService.connectPins(
      board,
      connectionSourcePinId,
      targetPinId,
      selectedStringColor,
      undefined,
      isDM ? 'Dungeon Master' : user?.displayName || 'Jogador'
    );

    if (res.error) {
      toast.error(res.error);
    } else {
      await persistAndBroadcastBoard(res.board);
      if (res.connection) {
        setSelectedConnection(res.connection);
        setConnectionLabelInput('');
        setConnectionColorInput(res.connection.stringColor);
      }
      toast.success('🧵 Fio afixado! Você pode rotulá-lo agora.');
    }

    setConnectionSourcePinId(null);
    setIsConnectingMode(false);
  };

  // Salvar Rótulo e Cor do Fio
  const handleSaveConnection = async () => {
    if (!board || !selectedConnection) return;
    const updated = await investigationService.updateConnection(board, selectedConnection.id, {
      label: connectionLabelInput.trim() || undefined,
      stringColor: connectionColorInput,
      isCollapsed: false, // Garante que a nota fique aberta ao salvar
    });
    await persistAndBroadcastBoard(updated);
    setSelectedConnection(null);
    toast.success('🧵 Anotação manuscrita salva!');
  };

  // Alternar Colapso / Expansão da Nota de Papel do Fio
  const handleToggleCollapseConnection = async (connId: string) => {
    if (!board) return;
    const updated = await investigationService.toggleCollapseConnection(board, connId);
    await persistAndBroadcastBoard(updated);
  };

  // Excluir Fio Selecionado
  const handleDeleteSelectedConnection = async () => {
    if (!board || !selectedConnection) return;
    const updated = await investigationService.disconnectPins(board, selectedConnection.id);
    await persistAndBroadcastBoard(updated);
    setSelectedConnection(null);
    toast.info('Fio removido.');
  };

  // Adicionar Novo Pino Manual
  const handleCreatePin = async () => {
    if (!board || !newTitle.trim()) {
      toast.error('Informe um título para a pista/suspeito.');
      return;
    }

    const { board: updated } = await investigationService.addPin(board, {
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      position: { x: 300 + Math.random() * 80, y: 220 + Math.random() * 80 },
      rotationDeg: Number((Math.random() * 6 - 3).toFixed(1)),
      colorTag: newColorTag,
      isWaxSealed: newIsWaxSealed,
      pinnedBy: isDM ? 'Dungeon Master' : user?.displayName || 'Investigador',
    });

    await persistAndBroadcastBoard(updated);
    setIsCreatingPin(false);
    setNewTitle('');
    setNewDesc('');
    setNewIsWaxSealed(false);
    toast.success('📌 Pista afixada no mural!');
  };

  // Importar Entidade do LoreGraph
  const handleImportLoreNode = async (entity: typeof worldEntities[0]) => {
    if (!board) return;

    const { board: updated } = await investigationService.addPin(board, {
      type: entity.category === 'npc' ? 'suspect' : entity.category === 'location' ? 'location' : 'lore_node',
      title: entity.name,
      description: entity.shortDesc || entity.subType || 'Entidade do mundo',
      loreNodeId: entity.id,
      imageUrl: entity.images?.[0],
      position: { x: 260 + Math.random() * 100, y: 180 + Math.random() * 100 },
      rotationDeg: Number((Math.random() * 6 - 3).toFixed(1)),
      colorTag: 'yellow',
      pinnedBy: isDM ? 'Dungeon Master' : user?.displayName || 'Investigador',
    });

    await persistAndBroadcastBoard(updated);
    setIsImportingLore(false);
    toast.success(`📌 '${entity.name}' importado do LoreGraph para o mural!`);
  };

  // Excluir Pino com Cascata
  const handleDeletePin = async (pinId: string) => {
    if (!board) return;
    const updated = await investigationService.deletePin(board, pinId);
    await persistAndBroadcastBoard(updated);
    if (selectedPinDetail?.id === pinId) setSelectedPinDetail(null);
    toast.info('Pino e conexões associadas removidos.');
  };

  // Compartilhar com a Party
  const handleShareToParty = async (pin: PinBoardItem) => {
    const { partyBoard } = await investigationService.sharePinToParty(
      pin, 
      campaignId, 
      user?.displayName || 'Investigador'
    );
    broadcastInvestigationBoard({ board: partyBoard });
    toast.success(`📢 '${pin.title}' foi compartilhado no Mural da Mesa!`);
  };

  // Quebrar / Colocar Selo de Cera
  const handleToggleWaxSeal = async (pinId: string) => {
    if (!board) return;
    const updated = await investigationService.toggleWaxSeal(board, pinId);
    await persistAndBroadcastBoard(updated);
    const item = updated.items.find(i => i.id === pinId);
    if (item?.isWaxSealed) {
      toast.info('Selo de cera aplicado.');
    } else {
      toast.success('🔓 Selo quebrado! Pista revelada.');
    }
  };

  // Deletar Conexão de Fio
  const handleDeleteConnection = async (connId: string) => {
    if (!board) return;
    const updated = await investigationService.disconnectPins(board, connId);
    await persistAndBroadcastBoard(updated);
    toast.info('Fio removido.');
  };

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-[#140e0b] border border-amber-900/60 rounded-3xl w-full max-w-[95vw] shadow-2xl overflow-hidden flex flex-col h-[94vh] animate-in zoom-in-95 duration-200">
        
        {/* Header Superior Vintage Noir */}
        <div className="px-6 py-3 bg-gradient-to-r from-stone-950 via-[#1c140f] to-stone-950 border-b border-amber-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center text-amber-400 font-extrabold shadow-inner">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-amber-100 tracking-wide font-serif">
                  Mural de Investigação — <span className="text-amber-400">{activeCampaign.title}</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-300 font-mono">
                  {scope === 'party' ? '🌐 Mural da Mesa' : '🕵️ Meu Diário Secreto'}
                </span>
              </div>
              <p className="text-xs text-amber-200/50 font-mono">
                Conecte pistas, suspeitos e locais com fios de investigação em tempo real
              </p>
            </div>
          </div>

          {/* Alternador de Escopo & Ferramentas Rápidas */}
          <div className="flex items-center gap-2.5">
            <div className="flex bg-stone-900/90 p-0.5 rounded-xl border border-stone-800 text-xs font-bold">
              <button
                onClick={() => setScope('party')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  scope === 'party' ? 'bg-amber-700 text-amber-100 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Mural da Mesa
              </button>
              <button
                onClick={() => setScope('personal')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  scope === 'personal' ? 'bg-amber-700 text-amber-100 shadow' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Diário Pessoal
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-amber-200 hover:bg-stone-800 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Ferramentas de Detetive */}
        <div className="px-6 py-2 bg-[#1b120c] border-b border-amber-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingPin(true)}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-amber-100 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Afixar Pista</span>
            </button>

            <button
              onClick={() => setIsImportingLore(true)}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-amber-950/80"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Importar do LoreGraph</span>
            </button>

            {/* Seletor de Cor do Fio */}
            <div className="flex items-center gap-1.5 bg-stone-900/80 px-2.5 py-1 rounded-xl border border-stone-800">
              <span className="text-[11px] text-stone-300 font-medium mr-1 flex items-center gap-1">
                <span>🧵</span> Cor do Fio:
              </span>
              {(['red', 'yellow', 'blue', 'green', 'white', 'purple'] as StringColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedStringColor(c)}
                  className={`w-4 h-4 rounded-full transition-all cursor-pointer ${COLOR_MAP[c].bg} ${
                    selectedStringColor === c ? 'scale-125 ring-2 ring-amber-300 shadow-md' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={`Traçar fio ${COLOR_MAP[c].name}`}
                />
              ))}
            </div>

            {isConnectingMode && connectionSourcePinId && (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-700/80 text-rose-200 px-3 py-1 rounded-xl font-bold text-xs animate-pulse">
                <span>🧵 Puxando fio... Clique na bolinha de outro card</span>
                <button
                  onClick={() => {
                    setIsConnectingMode(false);
                    setConnectionSourcePinId(null);
                  }}
                  className="px-2 py-0.5 bg-rose-900 hover:bg-rose-800 rounded-lg text-[10px] text-white cursor-pointer ml-1"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Controles de Canvas Pan & Zoom */}
          <div className="flex items-center gap-1 bg-stone-900/90 px-2 py-1 rounded-xl border border-stone-800 text-stone-300">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
              className="p-1 hover:text-amber-200 cursor-pointer"
              title="Aproximar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] px-1 text-stone-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
              className="p-1 hover:text-amber-200 cursor-pointer"
              title="Afastar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1 hover:text-amber-200 cursor-pointer ml-1"
              title="Resetar Visualização"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas de Cortiça Imersivo */}
        <div
          ref={containerRef}
          onMouseDown={handleBackgroundMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className="flex-1 relative overflow-hidden bg-[#24170f] cursor-grab active:cursor-grabbing"
          style={{
            backgroundImage: `
              radial-gradient(circle at center, rgba(30, 20, 14, 0.4) 0%, rgba(10, 6, 4, 0.85) 100%),
              radial-gradient(#3a2517 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 28px 28px',
          }}
        >
          {/* Camada Transformável com Pan e Zoom */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: '4000px',
              height: '4000px',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            {/* SVG Layer: Fios Vermelhos & Elásticos */}
            <svg
              width="4000"
              height="4000"
              viewBox="0 0 4000 4000"
              className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none z-10 overflow-visible"
            >
              <defs>
                <filter id="string-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.7" />
                </filter>
              </defs>

              {/* Fios Existentes */}
              {board?.connections.map((conn, idx) => {
                const fromPin = board.items.find((p) => p.id === conn.fromPinId);
                const toPin = board.items.find((p) => p.id === conn.toPinId);
                if (!fromPin || !toPin) return null;

                const start = getPinAnchorPos(fromPin);
                const end = getPinAnchorPos(toPin);

                // Curva Bézier realista com curvatura natural
                const dx = end.x - start.x;
                const dy = end.y - start.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const sag = Math.min(dist * 0.12, 40); // Caimento por gravidade do fio
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2 + sag;

                const pathData = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
                const strokeColor = COLOR_MAP[conn.stringColor]?.stroke || '#ef4444';

                return (
                  <g key={`conn-${conn.id || idx}-${idx}`} className="pointer-events-auto group">
                    {/* Linha de fundo para clique facilitado */}
                    <path
                      d={pathData}
                      stroke="transparent"
                      strokeWidth="20"
                      fill="none"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnection(conn);
                        setConnectionLabelInput(conn.label || '');
                        setConnectionColorInput(conn.stringColor);
                      }}
                    />
                    {/* Fio Visual com Sombra */}
                    <path
                      d={pathData}
                      stroke={strokeColor}
                      strokeWidth="3.2"
                      fill="none"
                      strokeLinecap="round"
                      filter="url(#string-shadow)"
                      className="transition-all group-hover:stroke-amber-300 group-hover:stroke-[4.5] cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedConnection(conn);
                        setConnectionLabelInput(conn.label || '');
                        setConnectionColorInput(conn.stringColor);
                      }}
                    />
                  </g>
                );
              })}

              {/* Guia Elástica em Tempo Real no Modo de Conexão */}
              {isConnectingMode && connectionSourcePinId && (
                (() => {
                  const sourcePin = board?.items.find((p) => p.id === connectionSourcePinId);
                  if (!sourcePin) return null;
                  const start = getPinAnchorPos(sourcePin);
                  const end = mousePos;
                  const midX = (start.x + end.x) / 2;
                  const midY = (start.y + end.y) / 2 + 15;
                  const pathData = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;

                  return (
                    <path
                      d={pathData}
                      stroke={COLOR_MAP[selectedStringColor]?.stroke || '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray="6 4"
                      fill="none"
                      className="animate-pulse"
                    />
                  );
                })()
              )}
            </svg>

            {/* Anotações Manuscritas em Papel de Evidência sobre os Fios */}
            {board?.connections.map((conn, idx) => {
              const fromPin = board.items.find((p) => p.id === conn.fromPinId);
              const toPin = board.items.find((p) => p.id === conn.toPinId);
              if (!fromPin || !toPin) return null;

              const start = getPinAnchorPos(fromPin);
              const end = getPinAnchorPos(toPin);
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const sag = Math.min(dist * 0.12, 40);
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2 + sag;
              const isCollapsed = conn.isCollapsed;

              // Leve inclinação natural orgânica para aspecto de papel feito à mão
              const rot = ((conn.id.charCodeAt(conn.id.length - 1) % 5) - 2) * 1.2;

              if (isCollapsed) {
                return (
                  <div
                    key={`note-collapsed-${conn.id || idx}-${idx}`}
                    style={{
                      position: 'absolute',
                      left: `${midX}px`,
                      top: `${midY}px`,
                      transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                      zIndex: 35,
                    }}
                    className="group/tag cursor-pointer animate-in zoom-in-75 duration-150 select-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCollapseConnection(conn.id);
                    }}
                    title="Anotação colapsada. Clique para expandir."
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#faf3dc] hover:bg-[#fff9e6] text-stone-800 border border-amber-900/40 rounded-md shadow-lg hover:shadow-xl transition-all hover:scale-105">
                      <span className="text-xs">🏷️</span>
                      <span className="text-[11px] font-serif font-bold italic truncate max-w-[120px] text-stone-900">
                        {conn.label || 'Anotação'}
                      </span>
                      <span className="text-[10px] text-amber-800 font-mono font-bold ml-0.5 group-hover/tag:scale-110">
                        [+]
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`note-paper-${conn.id || idx}-${idx}`}
                  style={{
                    position: 'absolute',
                    left: `${midX}px`,
                    top: `${midY}px`,
                    transform: `translate(-50%, -50%) rotate(${rot}deg)`,
                    zIndex: 35,
                  }}
                  className="group/paper cursor-pointer select-none animate-in zoom-in-95 duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConnection(conn);
                    setConnectionLabelInput(conn.label || '');
                    setConnectionColorInput(conn.stringColor);
                  }}
                >
                  {/* Pedaço de Fita Adesiva / Washi Tape no topo do papel */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-200/70 backdrop-blur-[1px] border border-amber-300/60 rounded-sm shadow-sm rotate-[-1deg] pointer-events-none z-10" />

                  {/* Cartão de Papel Manuscrito com Margens e Textura de Evidência */}
                  <div className="relative bg-gradient-to-b from-[#fdf9ea] via-[#f9f1d4] to-[#f4e6be] text-stone-900 border border-amber-900/40 rounded-lg p-2.5 pr-3 shadow-xl shadow-black/70 hover:shadow-2xl hover:scale-[1.03] transition-all max-w-[280px] min-w-[140px]">
                    {/* Cabeçalho da Nota com Categoria e Ações */}
                    <div className="flex items-start justify-between gap-2 border-b border-amber-900/20 pb-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: COLOR_MAP[conn.stringColor]?.stroke || '#ef4444' }}
                        />
                        <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                          Hipótese / Fio
                        </span>
                      </div>

                      {/* Botões de Ação Rápida no Papel (Colapsar e Editar) */}
                      <div className="flex items-center gap-1 opacity-60 group-hover/paper:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCollapseConnection(conn.id);
                          }}
                          className="p-0.5 hover:bg-amber-900/10 text-stone-600 hover:text-stone-950 rounded transition-colors"
                          title="Colapsar / Recolher nota"
                        >
                          <EyeOff className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConnection(conn);
                            setConnectionLabelInput(conn.label || '');
                            setConnectionColorInput(conn.stringColor);
                          }}
                          className="p-0.5 hover:bg-amber-900/10 text-stone-600 hover:text-amber-900 rounded transition-colors"
                          title="Editar anotação manuscrita"
                        >
                          <FileText className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Texto Manuscrito / Anotação da Evidência */}
                    <div className="font-serif italic text-xs font-semibold text-stone-900 leading-snug tracking-tight px-0.5 py-0.5 break-words">
                      {conn.label ? (
                        `“${conn.label}”`
                      ) : (
                        <span className="text-stone-400 not-italic text-[11px] font-sans">[Clique para escrever...]</span>
                      )}
                    </div>

                    {/* Autor da Anotação */}
                    {conn.createdBy && (
                      <div className="text-[9px] font-sans text-stone-600/70 text-right mt-1 italic border-t border-amber-900/10 pt-0.5">
                        — {conn.createdBy}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pinos e Cartões Afixados no Mural */}
            {board?.items.map((pin, idx) => {
              const isSource = connectionSourcePinId === pin.id;

              return (
                <div
                  key={`pin-item-${pin.id || idx}-${idx}`}
                  onMouseDown={(e) => handlePinMouseDown(e, pin)}
                  style={{
                    transform: `translate(${pin.position.x}px, ${pin.position.y}px) rotate(${pin.rotationDeg}deg)`,
                    transformOrigin: '104px 0px',
                    position: 'absolute',
                    zIndex: isSource ? 40 : 20,
                  }}
                  className={`w-52 p-3 rounded-xl shadow-2xl transition-shadow cursor-grab active:cursor-grabbing border ${
                    pin.isWaxSealed
                      ? 'bg-stone-900 border-red-900/80 shadow-red-950/40'
                      : 'bg-[#f4ebd9] text-stone-900 border-amber-900/40 shadow-black/60'
                  } ${isSource ? 'ring-4 ring-rose-500 ring-offset-2 scale-105' : 'hover:shadow-2xl hover:scale-[1.02]'}`}
                >
                  {/* Alfinete Metálico com Cabeça Esférica Colorida - Clique direto para puxar/ligar fio */}
                  <div 
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center group/pin cursor-pointer"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => handlePushPinClick(e, pin)}
                    title={isSource ? "Clique para cancelar puxada de fio" : "Clique na bolinha para puxar ou ligar um fio"}
                  >
                    <div 
                      className={`w-6 h-6 rounded-full shadow-lg border-2 transition-all flex items-center justify-center ${
                        isSource
                          ? 'ring-4 ring-amber-400 scale-125 border-white animate-pulse'
                          : 'border-stone-900/80 group-hover/pin:scale-125 group-hover/pin:ring-2 group-hover/pin:ring-amber-300'
                      } ${COLOR_MAP[pin.colorTag]?.bg || 'bg-red-600'}`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-inner" />
                    </div>
                  </div>

                  {/* Estado Selado com Cera (DM Mystery) */}
                  {pin.isWaxSealed ? (
                    <div className="py-6 text-center space-y-2 select-none">
                      <div className="w-12 h-12 mx-auto rounded-full bg-red-950 border-2 border-red-700 flex items-center justify-center text-red-400 font-serif text-lg font-black shadow-inner">
                        🔏
                      </div>
                      <div className="text-xs font-serif font-black text-amber-200">
                        {pin.title}
                      </div>
                      <div className="text-[10px] text-stone-400 italic">
                        Documento Lacrado com Selo de Cera
                      </div>

                      {isDM && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleWaxSeal(pin.id); }}
                          className="mt-2 px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          🔓 Quebrar Selo
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Conteúdo Aberto / Revelado */
                    <div className="space-y-2 font-serif">
                      {/* Topo do Card com Tipo e Ações Rápidas */}
                      <div className="flex items-center justify-between border-b border-stone-400/40 pb-1 text-[11px]">
                        <div className="flex items-center gap-1 font-bold text-stone-700">
                          {ITEM_TYPE_ICONS[pin.type]}
                          <span className="capitalize">{pin.type}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {scope === 'personal' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleShareToParty(pin); }}
                              className="text-stone-600 hover:text-amber-800 cursor-pointer p-0.5"
                              title="Compartilhar com o Mural da Party"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isDM && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleWaxSeal(pin.id); }}
                              className="text-stone-600 hover:text-red-800 cursor-pointer p-0.5"
                              title="Lacrar com Selo de Cera"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePin(pin.id); }}
                            className="text-stone-500 hover:text-rose-700 cursor-pointer p-0.5"
                            title="Remover Pista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Imagem se houver (Polaroid Style) */}
                      {pin.imageUrl && (
                        <div className="w-full h-24 rounded bg-stone-300 overflow-hidden border border-stone-400">
                          <img src={pin.imageUrl} alt={pin.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Título & Descrição */}
                      <div>
                        <h4 className="text-xs font-black text-stone-900 leading-tight">
                          {pin.title}
                        </h4>
                        <p className="text-[11px] text-stone-700 mt-1 leading-snug line-clamp-3">
                          {pin.description}
                        </p>
                      </div>

                      {/* Link para LoreGraph ou Documento */}
                      {pin.loreNodeId && onSelectLoreNode && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSelectLoreNode(pin.loreNodeId!); }}
                          className="w-full py-1 bg-stone-800/10 hover:bg-stone-800/20 text-stone-800 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer font-sans"
                        >
                          <Network className="w-3 h-3 text-purple-700" />
                          <span>Ver no LoreGraph</span>
                        </button>
                      )}

                      <div className="text-[9px] text-stone-500 font-mono flex justify-between items-center pt-1 border-t border-stone-300">
                        <span>{pin.pinnedBy}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal / Dialog: Nova Pista */}
        {isCreatingPin && (
          <div className="fixed inset-0 z-[1000000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1c140f] border border-amber-800/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 font-serif">
              <div className="flex justify-between items-center border-b border-amber-950 pb-2">
                <h3 className="text-sm font-black text-amber-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Afixar Nova Pista / Suspeito</span>
                </h3>
                <button onClick={() => setIsCreatingPin(false)} className="text-stone-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">Título da Pista / Suspeito</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Frasco de Veneno, Lorde Malakor, Mansão do Lago..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Tipo de Evidência</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PinItemType)}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="clue">Pista / Evidência</option>
                    <option value="suspect">Suspeito / NPC</option>
                    <option value="location">Local da Cena</option>
                    <option value="document">Documento / Carta</option>
                    <option value="custom_note">Anotação Livre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1">Detalhes e Anotações</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Descreva o que foi encontrado ou o que testemunhas disseram..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {isDM && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="wax-sealed"
                      checked={newIsWaxSealed}
                      onChange={(e) => setNewIsWaxSealed(e.target.checked)}
                      className="rounded border-stone-700 text-amber-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="wax-sealed" className="text-amber-300 text-xs font-bold cursor-pointer">
                      🔏 Afixar como Documento Lacrado (Selo de Cera)
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-amber-950 font-sans">
                <button
                  onClick={() => setIsCreatingPin(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePin}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-xl text-xs font-bold cursor-pointer shadow"
                >
                  Afixar no Mural
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Importar do LoreGraph */}
        {isImportingLore && (
          <div className="fixed inset-0 z-[1000000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1c140f] border border-amber-800/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 font-serif">
              <div className="flex justify-between items-center border-b border-amber-950 pb-2">
                <h3 className="text-sm font-black text-amber-100 flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  <span>Importar Entidade do LoreGraph</span>
                </h3>
                <button onClick={() => setIsImportingLore(false)} className="text-stone-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-stone-800 font-sans">
                {worldEntities.length === 0 ? (
                  <div className="text-center py-8 text-stone-500 text-xs font-mono">
                    Nenhuma entidade criada no Worldbuilder / LoreGraph ainda.
                  </div>
                ) : (
                  worldEntities.map((e, idx) => (
                    <div
                      key={`lore-import-${e.id || idx}-${idx}`}
                      onClick={() => handleImportLoreNode(e)}
                      className="p-3 bg-stone-900/80 hover:bg-stone-800 border border-stone-800 hover:border-amber-700/60 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-stone-200">{e.name}</div>
                        <div className="text-[11px] text-stone-400 mt-0.5">{e.category} • {e.subType || 'Entidade'}</div>
                      </div>
                      <button className="px-3 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded-lg text-xs font-bold">
                        Afixar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Editar Rótulo / Cor do Fio de Investigação */}
        {selectedConnection && (
          <div className="fixed inset-0 z-[1000000] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#1c140f] border border-amber-800/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 font-serif">
              <div className="flex justify-between items-center border-b border-amber-950 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧵</span>
                  <h3 className="text-sm font-black text-amber-100">
                    Anotação do Fio de Investigação
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedConnection(null)}
                  className="text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conexão entre Pinos */}
              {(() => {
                const fromP = board?.items.find((p) => p.id === selectedConnection.fromPinId);
                const toP = board?.items.find((p) => p.id === selectedConnection.toPinId);
                return (
                  <div className="bg-stone-950/70 border border-stone-800/80 rounded-xl p-3 flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>{fromP?.title || 'Pista 1'}</span>
                    </div>
                    <span className="text-stone-500 font-mono">⟷</span>
                    <div className="flex items-center gap-1.5 font-bold text-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>{toP?.title || 'Pista 2'}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block text-stone-300 font-bold mb-1">
                    Texto / Hipótese da Conexão
                  </label>
                  <input
                    type="text"
                    value={connectionLabelInput}
                    onChange={(e) => setConnectionLabelInput(e.target.value)}
                    placeholder="Ex: Visto conversando na taverna, Arma encontrada no local..."
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveConnection();
                    }}
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Esse texto será afixado diretamente sobre o fio no mural para todos os jogadores.
                  </p>
                </div>

                <div>
                  <label className="block text-stone-300 font-bold mb-1.5">
                    Cor do Fio
                  </label>
                  <div className="flex items-center gap-2">
                    {(Object.keys(COLOR_MAP) as StringColor[]).map((cKey) => (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setConnectionColorInput(cKey)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          connectionColorInput === cKey
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: COLOR_MAP[cKey].stroke }}
                        title={COLOR_MAP[cKey].name}
                      />
                    ))}
                  </div>
                </div>

                {selectedConnection.createdBy && (
                  <div className="text-[10px] text-stone-500 font-mono pt-1">
                    Traçado por: <span className="text-stone-300">{selectedConnection.createdBy}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center gap-2 pt-3 border-t border-amber-950 font-sans">
                <button
                  type="button"
                  onClick={handleDeleteSelectedConnection}
                  className="px-3 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Fio</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedConnection(null)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConnection}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-100 rounded-xl text-xs font-bold cursor-pointer shadow"
                  >
                    Salvar Anotação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
};
