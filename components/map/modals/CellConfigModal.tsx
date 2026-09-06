'use client';

import React from 'react';
import { 
  DoorClosed, 
  ShieldAlert, 
  Package, 
  Gem, 
  SlidersHorizontal, 
  Grid, 
  EyeOff, 
  Hammer, 
  Key, 
  Sparkles, 
  Plus, 
  Trash2,
  X
} from 'lucide-react';
import { Cell, ContainerType, ContainerStatus } from '../../MapMaker';
import { normalizeChestItem, getItemTypeBadgeInfo } from '@/lib/utils/lootItemUtils';
import { toast } from 'sonner';

export interface EditingCellState {
  r: number;
  c: number;
  cell: Cell;
}

interface CellConfigModalProps {
  editingCell: EditingCellState | null;
  setEditingCell: React.Dispatch<React.SetStateAction<EditingCellState | null>>;
  onClose: () => void;
  onGridChange: (updater: (prev: Cell[][]) => Cell[][]) => void;
  onOpenLoot: (target: EditingCellState) => void;
  onOpenCompendium: () => void;
  onOpenCampaignDocs: () => void;
}

export const CellConfigModal: React.FC<CellConfigModalProps> = ({
  editingCell,
  setEditingCell,
  onClose,
  onGridChange,
  onOpenLoot,
  onOpenCompendium,
  onOpenCampaignDocs,
}) => {
  if (!editingCell || editingCell.cell.type === 'transition') return null;

  const { cell, r, c } = editingCell;

  const handleSave = () => {
    onGridChange((prev) => {
      const copy = prev.map(row => row.map(item => ({ ...item })));
      const targetCell = copy[r][c];

      if (cell.type === 'door') {
        targetCell.doorConfig = cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 };
      } else if (cell.type === 'trap') {
        targetCell.trapConfig = cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false };
      } else if (cell.type === 'chest' || cell.type === 'stash') {
        targetCell.chestConfig = cell.chestConfig || {
          name: cell.type === 'chest' ? 'Baú' : 'Esconderijo',
          containerType: cell.type === 'stash' ? 'hidden_stash' : 'wooden_chest',
          status: 'locked',
          lockpickDC: 15,
          breakDC: 16,
          revealedToPlayers: cell.type === 'chest',
          loot: { gp: 25, items: [] }
        };
      } else if (cell.type === 'trigger') {
        const newConfig = cell.triggerConfig || {
          id: `trigger-${Math.random().toString(36).substring(2, 8)}`,
          targetId: '',
          triggerType: 'lever',
          state: 'inactive',
          name: '',
          isSecret: false,
          revealedToPlayers: true
        };
        const oldState = targetCell.triggerConfig?.state;
        targetCell.triggerConfig = newConfig;

        if (oldState && oldState !== newConfig.state && newConfig.targetId) {
          let targetFound = false;
          for (let i = 0; i < copy.length; i++) {
            for (let j = 0; j < copy[0].length; j++) {
              const tc = copy[i][j];
              if (tc.type === 'portcullis' && tc.portcullisConfig?.id === newConfig.targetId) {
                tc.portcullisConfig = {
                  ...tc.portcullisConfig,
                  status: newConfig.state === 'active' ? 'open' : 'closed'
                };
                targetFound = true;
              }
            }
          }
          if (targetFound) {
            setTimeout(() => toast.success('A engrenagem girou! A grade conectada foi acionada.'), 300);
          }
        }
      } else if (cell.type === 'portcullis') {
        targetCell.portcullisConfig = cell.portcullisConfig || {
          id: `grade-${Math.random().toString(36).substring(2, 8)}`,
          status: 'closed',
          material: 'iron',
          name: ''
        };
      } else if (cell.type === 'illusion_wall') {
        targetCell.illusionWallConfig = cell.illusionWallConfig || {
          detectDC: 15,
          revealedToPlayers: false,
          blocksLight: true
        };
      }
      return copy;
    });

    onClose();
    toast.success('Alterações salvas no grid.');
  };

  const handleRemove = () => {
    onGridChange((prev) => {
      const copy = prev.map(row => row.map(item => ({ ...item })));
      copy[r][c].type = 'floor';
      copy[r][c].doorConfig = undefined;
      copy[r][c].trapConfig = undefined;
      copy[r][c].chestConfig = undefined;
      copy[r][c].triggerConfig = undefined;
      copy[r][c].portcullisConfig = undefined;
      copy[r][c].illusionWallConfig = undefined;
      return copy;
    });
    onClose();
    toast.success('Elemento removido.');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-[#121824] border border-[#2a3449] w-full max-w-[420px] rounded-2xl shadow-2xl p-5 select-none animate-fade-in font-sans max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2a3449]/60 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            {cell.type === 'door' && <><DoorClosed className="w-4 h-4 text-amber-400" /> Configurar Porta</>}
            {cell.type === 'trap' && <><ShieldAlert className="w-4 h-4 text-rose-400" /> Configurar Armadilha</>}
            {cell.type === 'chest' && <><Package className="w-4 h-4 text-amber-300" /> Configurar Baú & Tesouro</>}
            {cell.type === 'stash' && <><Gem className="w-4 h-4 text-emerald-300" /> Configurar Esconderijo Oculto</>}
            {cell.type === 'trigger' && <><SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Configurar Mecanismo</>}
            {cell.type === 'portcullis' && <><Grid className="w-4 h-4 text-slate-300" /> Configurar Grade de Ferro</>}
            {cell.type === 'illusion_wall' && <><EyeOff className="w-4 h-4 text-indigo-400" /> Configurar Parede Falsa</>}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-base p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. PORTA */}
        {cell.type === 'door' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status da Porta</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      doorConfig: {
                        ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                        status: 'open'
                      }
                    }
                  } : null)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    cell.doorConfig?.status === 'open'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                      : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:bg-[#161c28]'
                  }`}
                >
                  Aberta (Dashed)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      doorConfig: {
                        ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                        status: 'closed'
                      }
                    }
                  } : null)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    cell.doorConfig?.status === 'closed' || !cell.doorConfig?.status
                      ? 'bg-amber-600 border-amber-500 text-white shadow'
                      : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:bg-[#161c28]'
                  }`}
                >
                  Fechada (Solid)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Porta (D&D)</label>
              <select
                value={cell.doorConfig?.doorType || 'wooden'}
                onChange={(e) => {
                  const t = e.target.value as 'wooden' | 'iron' | 'stone' | 'secret';
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      doorConfig: {
                        ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                        doorType: t
                      }
                    }
                  } : null);
                }}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="wooden">Madeira Seca (CD 13)</option>
                <option value="iron">Ferro Reforçado (CD 18)</option>
                <option value="stone">Pedra Pesada (CD 20)</option>
                <option value="secret">Secreta (Oculta)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Hammer className="w-3 h-3 text-amber-400" /> CD Arrombar
                </label>
                <input
                  type="number"
                  value={cell.doorConfig?.breakDC ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        doorConfig: {
                          ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                          breakDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" /> CD Lockpick
                </label>
                <input
                  type="number"
                  value={cell.doorConfig?.lockpickDC ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        doorConfig: {
                          ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                          lockpickDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {cell.doorConfig?.doorType === 'secret' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="secretRevealedCheck"
                  checked={cell.doorConfig?.secretRevealed || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        doorConfig: {
                          ...(prev.cell.doorConfig || { status: 'closed', doorType: 'wooden', breakDC: 15, lockpickDC: 15 }),
                          secretRevealed: checked
                        }
                      }
                    } : null);
                  }}
                  className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                />
                <label htmlFor="secretRevealedCheck" className="text-xs text-slate-300 cursor-pointer">Revelada aos Jogadores</label>
              </div>
            )}
          </div>
        )}

        {/* 2. ARMADILHA */}
        {cell.type === 'trap' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome/Tipo da Armadilha</label>
              <input
                type="text"
                value={cell.trapConfig?.trapType || 'Armadilha'}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      trapConfig: {
                        ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                        trapType: val
                      }
                    }
                  } : null);
                }}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">👁️ CD Percepção</label>
                <input
                  type="number"
                  value={cell.trapConfig?.detectDC ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        trapConfig: {
                          ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                          detectDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔧 CD Desarmar</label>
                <input
                  type="number"
                  value={cell.trapConfig?.disarmDC ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        trapConfig: {
                          ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                          disarmDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Descrição / Efeitos</label>
              <textarea
                rows={2}
                value={cell.trapConfig?.description || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      trapConfig: {
                        ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                        description: val
                      }
                    }
                  } : null);
                }}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="trapRevealedCheck"
                checked={cell.trapConfig?.revealedToPlayers || false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      trapConfig: {
                        ...(prev.cell.trapConfig || { trapType: 'Armadilha', detectDC: 15, disarmDC: 15, revealedToPlayers: false }),
                        revealedToPlayers: checked
                      }
                    }
                  } : null);
                }}
                className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
              />
              <label htmlFor="trapRevealedCheck" className="text-xs text-slate-300 cursor-pointer">Revelada aos Jogadores</label>
            </div>
          </div>
        )}

        {/* 3. BAÚ / ESCONDERIJO */}
        {(cell.type === 'chest' || cell.type === 'stash') && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={cell.chestConfig?.name || (cell.type === 'chest' ? 'Baú de Madeira' : 'Esconderijo Secreto')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        chestConfig: {
                          ...(prev.cell.chestConfig || { name: val, containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                          name: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Recipiente</label>
                <select
                  value={cell.chestConfig?.containerType || (cell.type === 'stash' ? 'hidden_stash' : 'wooden_chest')}
                  onChange={(e) => {
                    const ct = e.target.value as ContainerType;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        chestConfig: {
                          ...(prev.cell.chestConfig || { name: 'Baú', containerType: ct, status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                          containerType: ct
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="wooden_chest">Baú de Madeira</option>
                  <option value="iron_chest">Baú de Ferro Reforçado</option>
                  <option value="ornate_chest">Baú Nobre / Rúnico</option>
                  <option value="hidden_stash">Esconderijo (Fundo Falso)</option>
                  <option value="mimic">Mímico Camuflado (Ameaça)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'locked', label: 'Trancado', activeClass: 'bg-amber-600 border-amber-500 text-white' },
                  { id: 'unlocked', label: 'Destrancado', activeClass: 'bg-sky-600 border-sky-500 text-white' },
                  { id: 'open', label: 'Aberto', activeClass: 'bg-indigo-600 border-indigo-500 text-white' },
                  { id: 'looted', label: 'Saqueado', activeClass: 'bg-emerald-600 border-emerald-500 text-white' },
                ].map((s) => {
                  const isCurrent = (cell.chestConfig?.status || 'locked') === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setEditingCell(prev => prev ? {
                          ...prev,
                          cell: {
                            ...prev.cell,
                            chestConfig: {
                              ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: s.id as ContainerStatus, lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                              status: s.id as ContainerStatus
                            }
                          }
                        } : null);
                      }}
                      className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all border text-center ${
                        isCurrent
                          ? `${s.activeClass} shadow`
                          : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:bg-[#161c28]'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔑 Lockpick</label>
                <input
                  type="number"
                  value={cell.chestConfig?.lockpickDC ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        chestConfig: {
                          ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                          lockpickDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">🔨 Arrombar</label>
                <input
                  type="number"
                  value={cell.chestConfig?.breakDC ?? 16}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        chestConfig: {
                          ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                          breakDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">👁️ Investigar</label>
                <input
                  type="number"
                  value={cell.chestConfig?.detectDC ?? 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: {
                        ...prev.cell,
                        chestConfig: {
                          ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                          detectDC: val
                        }
                      }
                    } : null);
                  }}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Moedas */}
            <div className="bg-[#0a0d14] border border-[#2a3449]/60 rounded-xl p-3 space-y-2">
              <span className="block text-[10px] uppercase font-bold text-amber-400">Tesouro em Moedas</span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-amber-300 font-bold block mb-0.5">🪙 PO</label>
                  <input
                    type="number"
                    value={cell.chestConfig?.loot?.gp ?? 0}
                    onChange={(e) => {
                      const gp = parseInt(e.target.value) || 0;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          chestConfig: {
                            ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                            loot: { ...(prev.cell.chestConfig?.loot || {}), gp }
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-0.5">⚪ PP</label>
                  <input
                    type="number"
                    value={cell.chestConfig?.loot?.sp ?? 0}
                    onChange={(e) => {
                      const sp = parseInt(e.target.value) || 0;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          chestConfig: {
                            ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                            loot: { ...(prev.cell.chestConfig?.loot || {}), sp }
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-amber-700 font-bold block mb-0.5">🟤 PC</label>
                  <input
                    type="number"
                    value={cell.chestConfig?.loot?.cp ?? 0}
                    onChange={(e) => {
                      const cp = parseInt(e.target.value) || 0;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          chestConfig: {
                            ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                            loot: { ...(prev.cell.chestConfig?.loot || {}), cp }
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-cyan-300 font-bold block mb-0.5">💎 PL</label>
                  <input
                    type="number"
                    value={cell.chestConfig?.loot?.pp ?? 0}
                    onChange={(e) => {
                      const pp = parseInt(e.target.value) || 0;
                      setEditingCell(prev => prev ? {
                        ...prev,
                        cell: {
                          ...prev.cell,
                          chestConfig: {
                            ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                            loot: { ...(prev.cell.chestConfig?.loot || {}), pp }
                          }
                        }
                      } : null);
                    }}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded px-1.5 py-1 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Itens e Compêndio */}
            <div className="bg-[#0a0d14] border border-[#2a3449]/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="block text-[9px] uppercase font-bold text-amber-400">
                  Itens e Equipamentos ({cell.chestConfig?.loot?.items?.length || 0})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onOpenCampaignDocs}
                    className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Inserir cartas, bilhetes, livros e diários criados na Campanha"
                  >
                    <Plus className="w-3 h-3" />
                    <span>📜 Lore / Carta</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCompendium}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                    title="Buscar e adicionar armas, armaduras, poções e itens diretamente do Compêndio D&D 5e"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Compêndio</span>
                  </button>
                </div>
              </div>

              {/* Lista visual de itens */}
              <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                {(!cell.chestConfig?.loot?.items || cell.chestConfig.loot.items.length === 0) ? (
                  <p className="text-[10px] text-slate-500 italic py-2 text-center bg-[#121824]/60 rounded border border-dashed border-[#2a3449]">
                    Nenhum item adicionado. Clique em &quot;Compêndio&quot; acima.
                  </p>
                ) : (
                  cell.chestConfig.loot.items.map((rawItem, idx) => {
                    const item = normalizeChestItem(rawItem, cell.chestConfig?.loot?.notes);
                    const badge = getItemTypeBadgeInfo(item);

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 rounded bg-[#121824] border border-[#2a3449] text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-[8px] font-bold px-1 py-0.2 rounded border flex items-center gap-0.5 ${badge.badgeClass}`}>
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                          </span>
                          <span className="font-bold text-slate-100 truncate text-[11px]">
                            {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const currentItems = [...(cell.chestConfig?.loot?.items || [])];
                            currentItems.splice(idx, 1);
                            setEditingCell((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    cell: {
                                      ...prev.cell,
                                      chestConfig: {
                                        ...(prev.cell.chestConfig || {
                                          name: 'Baú',
                                          containerType: 'wooden_chest',
                                          status: 'locked',
                                          lockpickDC: 15,
                                          breakDC: 16,
                                          revealedToPlayers: true,
                                        }),
                                        loot: { ...(prev.cell.chestConfig?.loot || {}), items: currentItems },
                                      },
                                    },
                                  }
                                : null
                            );
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition cursor-pointer"
                          title="Remover item do baú"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {cell.chestConfig?.loot && (
                <button
                  type="button"
                  onClick={() => onOpenLoot(editingCell)}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer mt-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Abrir Modal de Saque & Distribuir Loot</span>
                </button>
              )}
            </div>

            {/* Visibilidade para Jogadores */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="chestRevealedCheck"
                checked={cell.chestConfig?.revealedToPlayers ?? true}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: {
                      ...prev.cell,
                      chestConfig: {
                        ...(prev.cell.chestConfig || { name: 'Baú', containerType: 'wooden_chest', status: 'locked', lockpickDC: 15, breakDC: 16, revealedToPlayers: true }),
                        revealedToPlayers: checked
                      }
                    }
                  } : null);
                }}
                className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
              />
              <label htmlFor="chestRevealedCheck" className="text-xs text-slate-300 cursor-pointer">
                Visível aos Jogadores no Mapa
              </label>
            </div>
          </div>
        )}

        {/* 4. GATILHO */}
        {cell.type === 'trigger' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tipo de Gatilho</label>
              <select
                value={cell.triggerConfig?.triggerType || 'lever'}
                onChange={(e) => {
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), triggerType: e.target.value as 'lever' | 'pressure_plate' | 'button' } }
                  } : null);
                }}
                className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="lever">Alavanca</option>
                <option value="pressure_plate">Placa de Pressão</option>
                <option value="button">Botão / Runas</option>
                <option value="chain">Corrente de Puxar</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estado</label>
              <select
                value={cell.triggerConfig?.state || 'inactive'}
                onChange={(e) => {
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), state: e.target.value as 'inactive' | 'active' } }
                  } : null);
                }}
                className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="inactive">Inativo (Desligado)</option>
                <option value="active">Ativo (Ligado)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ID do Alvo (Target ID)</label>
              <input
                type="text"
                value={cell.triggerConfig?.targetId || ''}
                onChange={(e) => {
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), targetId: e.target.value } }
                  } : null);
                }}
                placeholder="Ex: grade-123456"
                className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[9px] text-slate-500 mt-1 block">Quando ativado, envia sinal para alterar o estado do alvo.</span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="triggerSecretCheck"
                checked={cell.triggerConfig?.isSecret ?? false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, triggerConfig: { ...(prev.cell.triggerConfig || { id: `trigger-${Math.random().toString(36).substring(2, 8)}`, targetId: '', state: 'inactive', name: '', isSecret: false, revealedToPlayers: true, triggerType: 'lever' }), isSecret: checked } }
                  } : null);
                }}
                className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
              />
              <label htmlFor="triggerSecretCheck" className="text-xs text-slate-300 cursor-pointer">
                É um gatilho secreto/escondido?
              </label>
            </div>
            {cell.triggerConfig?.isSecret && (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="triggerRevealedCheck"
                  checked={cell.triggerConfig?.revealedToPlayers ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditingCell(prev => prev ? {
                      ...prev,
                      cell: { ...prev.cell, triggerConfig: { ...prev.cell.triggerConfig!, revealedToPlayers: checked } }
                    } : null);
                  }}
                  className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
                />
                <label htmlFor="triggerRevealedCheck" className="text-xs text-slate-300 cursor-pointer">
                  Revelado aos jogadores
                </label>
              </div>
            )}
          </div>
        )}

        {/* 5. GRADE LEVADIÇA */}
        {cell.type === 'portcullis' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status da Grade</label>
              <select
                value={cell.portcullisConfig?.status || 'closed'}
                onChange={(e) => {
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, portcullisConfig: { ...(prev.cell.portcullisConfig || { id: `grade-${Math.random().toString(36).substring(2, 8)}`, status: 'closed', material: 'iron', name: '' }), status: e.target.value as 'open' | 'closed' } }
                  } : null);
                }}
                className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="closed">Abaixada (Bloqueia Passagem)</option>
                <option value="open">Erguida (Livre Passagem)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ID da Grade</label>
              <input
                type="text"
                readOnly
                value={cell.portcullisConfig?.id || ''}
                className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none cursor-copy"
                onClick={(e) => {
                  navigator.clipboard.writeText((e.target as HTMLInputElement).value);
                  toast.success('ID copiado!');
                }}
              />
              <span className="text-[9px] text-slate-500 mt-1 block">Clique para copiar. Use no ID do Alvo de Gatilhos.</span>
            </div>
          </div>
        )}

        {/* 6. PAREDE ILUSÓRIA */}
        {cell.type === 'illusion_wall' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Bloqueia Visão?</label>
              <select
                value={cell.illusionWallConfig?.blocksLight ? 'true' : 'false'}
                onChange={(e) => {
                  const blocksLight = e.target.value === 'true';
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, illusionWallConfig: { ...(prev.cell.illusionWallConfig || { detectDC: 15, revealedToPlayers: false, blocksLight: true }), blocksLight } }
                  } : null);
                }}
                className="w-full bg-[#121824] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="true">Sim (Parece parede real até descoberta)</option>
                <option value="false">Não (Luz/visão passam direto)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="illusionRevealedCheck"
                checked={cell.illusionWallConfig?.revealedToPlayers ?? false}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setEditingCell(prev => prev ? {
                    ...prev,
                    cell: { ...prev.cell, illusionWallConfig: { ...(prev.cell.illusionWallConfig || { detectDC: 15, revealedToPlayers: false, blocksLight: true }), revealedToPlayers: checked } }
                  } : null);
                }}
                className="rounded accent-amber-500 bg-[#0a0d14] border-[#2a3449]"
              />
              <label htmlFor="illusionRevealedCheck" className="text-xs text-slate-300 cursor-pointer">
                Descoberta pelos Jogadores
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center gap-2 mt-5 border-t border-[#2a3449]/40 pt-3.5">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all text-center shadow-md cursor-pointer"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-300 font-semibold rounded-lg text-xs transition-all text-center cursor-pointer font-sans"
          >
            Remover
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-slate-300 font-semibold rounded-lg text-xs transition-all text-center cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
