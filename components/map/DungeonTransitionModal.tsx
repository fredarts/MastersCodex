import React, { useState, useMemo } from 'react';
import { DungeonTransitionConfig, TransitionType, MapLevel, Combatant } from '@/lib/types';
import { X, ArrowDownCircle, ArrowUpCircle, Compass, DoorOpen, Sparkles, Navigation, Link2, CheckCircle2, MapPin, Layers, UserCheck, CheckCircle, Clock } from 'lucide-react';

interface DungeonTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  r: number;
  c: number;
  currentLevelId?: string | null;
  activeLevels: MapLevel[];
  transitionConfig?: DungeonTransitionConfig;
  combatants?: Combatant[];
  onSave: (config: DungeonTransitionConfig, autoCreateLinked: boolean, linkedTargetInfo?: { targetLevelId: string; targetR: number; targetC: number; linkedTransitionId?: string }) => void;
  onTeleportParty?: (targetLevelId: string, spawnR?: number, spawnC?: number) => void;
  onTeleportSingleToken?: (tokenName: string, targetLevelId: string, spawnR?: number, spawnC?: number) => void;
  isCockpitMode?: boolean;
}

export const DungeonTransitionModal: React.FC<DungeonTransitionModalProps> = ({
  isOpen,
  onClose,
  r,
  c,
  currentLevelId,
  activeLevels,
  transitionConfig,
  combatants = [],
  onSave,
  onTeleportParty,
  onTeleportSingleToken,
  isCockpitMode = false,
}) => {
  const otherLevels = activeLevels.filter((lvl) => lvl.id !== currentLevelId);
  const defaultTarget = transitionConfig?.targetLevelId || otherLevels[0]?.id || activeLevels[0]?.id || '';

  const [name, setName] = useState(transitionConfig?.name || 'Escada para o Próximo Nível');
  const [type, setType] = useState<TransitionType>(transitionConfig?.type || 'stairs_down');
  const [targetLevelId, setTargetLevelId] = useState(defaultTarget);
  const [selectedLinkedTransId, setSelectedLinkedTransId] = useState<string>(transitionConfig?.linkedTransitionId || '');
  const [targetSpawnR, setTargetSpawnR] = useState<number | undefined>(transitionConfig?.targetSpawnR);
  const [targetSpawnC, setTargetSpawnC] = useState<number | undefined>(transitionConfig?.targetSpawnC);
  const [connectionMode, setConnectionMode] = useState<'existing_stairs' | 'auto_create' | 'custom_coords'>(() => {
    if (transitionConfig?.linkedTransitionId) return 'existing_stairs';
    if (transitionConfig?.targetSpawnR !== undefined && transitionConfig?.targetSpawnC !== undefined) return 'custom_coords';
    return 'auto_create';
  });

  const targetLevelObj = activeLevels.find((lvl) => lvl.id === targetLevelId);
  const currentLevelObj = activeLevels.find((lvl) => lvl.id === currentLevelId);

  // Collect all transitions existing on the target level
  const availableTargetTransitions = useMemo(() => {
    if (!targetLevelObj?.grid) return [];
    const list: { r: number; c: number; config: DungeonTransitionConfig }[] = [];
    for (let rIdx = 0; rIdx < targetLevelObj.grid.length; rIdx++) {
      for (let cIdx = 0; cIdx < targetLevelObj.grid[rIdx].length; cIdx++) {
        const cell = targetLevelObj.grid[rIdx][cIdx];
        if (cell.type === 'transition' && cell.transitionConfig) {
          // Avoid linking to self if target is same level
          if (targetLevelId === currentLevelId && rIdx === r && cIdx === c) continue;
          list.push({ r: rIdx, c: cIdx, config: cell.transitionConfig });
        }
      }
    }
    return list;
  }, [targetLevelObj, targetLevelId, currentLevelId, r, c]);

  // Categorize tokens across origin floor and destination floor
  const { pendingTokens, arrivedTokens } = useMemo(() => {
    const pending: { name: string; type: string }[] = [];
    const arrived: { name: string; type: string }[] = [];
    const seen = new Set<string>();

    // 1. Check who is on the current level
    if (currentLevelObj?.grid) {
      for (const row of currentLevelObj.grid) {
        for (const cell of row) {
          if (cell.tokenName && !seen.has(cell.tokenName.trim().toUpperCase())) {
            const key = cell.tokenName.trim().toUpperCase();
            seen.add(key);
            const comb = combatants.find((c) => c.name.trim().toUpperCase() === key);
            pending.push({
              name: cell.tokenName,
              type: comb?.type || 'player',
            });
          }
        }
      }
    }

    // 2. Check who is on the destination level
    if (targetLevelObj?.grid) {
      for (const row of targetLevelObj.grid) {
        for (const cell of row) {
          if (cell.tokenName && !seen.has(cell.tokenName.trim().toUpperCase())) {
            const key = cell.tokenName.trim().toUpperCase();
            seen.add(key);
            const comb = combatants.find((c) => c.name.trim().toUpperCase() === key);
            arrived.push({
              name: cell.tokenName,
              type: comb?.type || 'player',
            });
          }
        }
      }
    }

    // 3. Any players not yet placed on either grid default to pending
    combatants
      .filter((c) => c.type === 'player')
      .forEach((c) => {
        const key = c.name.trim().toUpperCase();
        if (!seen.has(key)) {
          seen.add(key);
          pending.push({
            name: c.name,
            type: 'player',
          });
        }
      });

    return { pendingTokens: pending, arrivedTokens: arrived };
  }, [currentLevelObj, targetLevelObj, combatants]);

  // If there are available transitions on target level and mode is existing, select first if none selected
  const activeLinkedTrans = availableTargetTransitions.find((t) => t.config.id === selectedLinkedTransId) || availableTargetTransitions[0];

  if (!isOpen) return null;

  const handleSave = () => {
    let finalSpawnR: number | undefined = undefined;
    let finalSpawnC: number | undefined = undefined;
    let finalLinkedId: string | undefined = undefined;
    let autoCreate = false;

    if (connectionMode === 'existing_stairs' && activeLinkedTrans) {
      finalSpawnR = activeLinkedTrans.r;
      finalSpawnC = activeLinkedTrans.c;
      finalLinkedId = activeLinkedTrans.config.id;
    } else if (connectionMode === 'custom_coords') {
      finalSpawnR = targetSpawnR ?? r;
      finalSpawnC = targetSpawnC ?? c;
    } else if (connectionMode === 'auto_create') {
      finalSpawnR = targetSpawnR ?? r;
      finalSpawnC = targetSpawnC ?? c;
      autoCreate = true;
    }

    const config: DungeonTransitionConfig = {
      id: transitionConfig?.id || `trans-${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim() || 'Passagem da Masmorra',
      type,
      targetLevelId,
      targetSpawnR: finalSpawnR,
      targetSpawnC: finalSpawnC,
      linkedTransitionId: finalLinkedId,
      status: transitionConfig?.status || 'open',
    };

    onSave(config, autoCreate, {
      targetLevelId,
      targetR: finalSpawnR ?? r,
      targetC: finalSpawnC ?? c,
      linkedTransitionId: finalLinkedId,
    });
    onClose();
  };

  const effectiveSpawnR = connectionMode === 'existing_stairs' && activeLinkedTrans ? activeLinkedTrans.r : (targetSpawnR ?? r);
  const effectiveSpawnC = connectionMode === 'existing_stairs' && activeLinkedTrans ? activeLinkedTrans.c : (targetSpawnC ?? c);

  const TYPE_OPTIONS: { id: TransitionType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'stairs_down',
      label: 'Escada Descendo',
      icon: <ArrowDownCircle className="w-4 h-4 text-rose-400" />,
      desc: 'Leva a um nível inferior/subterrâneo'
    },
    {
      id: 'stairs_up',
      label: 'Escada Subindo',
      icon: <ArrowUpCircle className="w-4 h-4 text-cyan-400" />,
      desc: 'Leva a um piso superior/torre'
    },
    {
      id: 'ladder',
      label: 'Alçapão / Escada de Mão',
      icon: <Navigation className="w-4 h-4 text-amber-400" />,
      desc: 'Acesso vertical estreito'
    },
    {
      id: 'portal',
      label: 'Portal Arcano',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      desc: 'Teletransporte mágico instantâneo'
    },
    {
      id: 'doorway',
      label: 'Porta de Transição',
      icon: <DoorOpen className="w-4 h-4 text-emerald-400" />,
      desc: 'Portão entre setores'
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-[#0f1420] border border-[#2a3449] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3449]/60 bg-[#161d2d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Conectar Escada / Passagem de Nível
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a0e17] text-slate-400 border border-[#2a3449]">
                  Posição: ({r}, {c})
                </span>
              </h3>
              <p className="text-xs text-slate-400">Mover jogadores e definir local de surgimento na masmorra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {/* Quick Cockpit Teleport Actions */}
          {isCockpitMode && targetLevelId && (
            <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Ações de Teletransporte entre Andares
                </span>
                <span className="text-[10px] text-cyan-400/90 font-mono">
                  Destino: ({effectiveSpawnR}, {effectiveSpawnC}) em "{targetLevelObj?.name || 'Destino'}"
                </span>
              </div>

              {/* Mover Grupo Inteiro */}
              <button
                type="button"
                onClick={() => {
                  onTeleportParty?.(targetLevelId, effectiveSpawnR, effectiveSpawnC);
                  onClose();
                }}
                className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                🚀 Mover Todo o Grupo de Heróis para "{targetLevelObj?.name}"
              </button>

              {/* Seção 1: Faltam Descer (Neste Andar) */}
              <div className="space-y-2 pt-1 border-t border-cyan-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Faltam Mover / Neste Andar ({pendingTokens.length}):
                  </span>
                  <span className="text-[10px] text-slate-400">Clique para enviar</span>
                </div>

                {pendingTokens.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {pendingTokens.map((tok) => (
                      <button
                        key={tok.name}
                        type="button"
                        onClick={() => {
                          onTeleportSingleToken?.(tok.name, targetLevelId, effectiveSpawnR, effectiveSpawnC);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-[#121826] hover:bg-cyan-900/70 border border-amber-500/40 hover:border-cyan-400 text-slate-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                        title={`Mover ${tok.name} para ${targetLevelObj?.name}`}
                      >
                        <span className="text-amber-300">👤 {tok.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">➔</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400/90 italic bg-emerald-950/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Nenhum personagem pendente neste andar. Todos já desceram!</span>
                  </div>
                )}
              </div>

              {/* Seção 2: Já no Andar de Destino (Já Desceram) */}
              {arrivedTokens.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-cyan-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Já no Andar de Destino ({arrivedTokens.length}):
                    </span>
                    <span className="text-[9px] text-emerald-400/70 font-mono">Em "{targetLevelObj?.name}"</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {arrivedTokens.map((tok) => (
                      <div
                        key={tok.name}
                        className="px-2 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 opacity-85 select-none"
                      >
                        <span>✓ {tok.name}</span>
                        <span className="text-[9px] text-emerald-400/60 font-mono">(Chegou)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nome da Passagem */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome / Rótulo da Passagem</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Escadaria para as Criptas"
              className="w-full bg-[#0a0e17] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Tipo de Passagem */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo Visual da Escada</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setType(opt.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    type === opt.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-sm'
                      : 'bg-[#121826] border-[#2a3449] text-slate-400 hover:bg-[#182032] hover:text-slate-200'
                  }`}
                >
                  <div className="mt-0.5">{opt.icon}</div>
                  <div>
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-70 leading-tight">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Andar de Destino */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Andar / Nível de Destino
            </label>
            {activeLevels.length <= 1 ? (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                A masmorra possui apenas 1 andar atualmente. Crie outros andares no seletor de níveis para conectá-los.
              </div>
            ) : (
              <select
                value={targetLevelId}
                onChange={(e) => {
                  setTargetLevelId(e.target.value);
                  setSelectedLinkedTransId('');
                }}
                className="w-full bg-[#0a0e17] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {activeLevels.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} {lvl.id === currentLevelId ? '(Andar Atual)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Conexão com Escada de Destino e Ponto de Surgimento */}
          {targetLevelId && (
            <div className="p-3.5 bg-[#121826] border border-[#2a3449] rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-amber-400" /> Ponto de Surgimento dos Jogadores no Destino
              </span>

              <div className="space-y-2">
                {/* Opção 1: Conectar a uma escada existente no andar de destino */}
                {availableTargetTransitions.length > 0 && (
                  <label className={`p-2.5 rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all ${
                    connectionMode === 'existing_stairs'
                      ? 'bg-amber-500/10 border-amber-500/80 text-amber-200'
                      : 'bg-[#0a0e17] border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="connectionMode"
                        checked={connectionMode === 'existing_stairs'}
                        onChange={() => setConnectionMode('existing_stairs')}
                        className="accent-amber-500"
                      />
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Conectar com escada existente em "{targetLevelObj?.name}"
                      </span>
                    </div>

                    {connectionMode === 'existing_stairs' && (
                      <div className="mt-1 pl-5 space-y-1.5 animate-in fade-in duration-150">
                        <select
                          value={activeLinkedTrans?.config.id || ''}
                          onChange={(e) => {
                            setSelectedLinkedTransId(e.target.value);
                            const found = availableTargetTransitions.find((t) => t.config.id === e.target.value);
                            if (found) {
                              setTargetSpawnR(found.r);
                              setTargetSpawnC(found.c);
                            }
                          }}
                          className="w-full bg-[#161d2d] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                        >
                          {availableTargetTransitions.map((t) => (
                            <option key={t.config.id} value={t.config.id}>
                              🪜 {t.config.name} — Posição: Linha {t.r}, Coluna {t.c}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-emerald-400/90">
                          ✨ Ao usar esta escada, os jogadores surgirão diretamente na escada "{activeLinkedTrans?.config.name}" em ({activeLinkedTrans?.r}, {activeLinkedTrans?.c}).
                        </p>
                      </div>
                    )}
                  </label>
                )}

                {/* Opção 2: Criar nova escada de retorno correspondente */}
                <label className={`p-2.5 rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all ${
                  connectionMode === 'auto_create'
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-200'
                    : 'bg-[#0a0e17] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="connectionMode"
                      checked={connectionMode === 'auto_create'}
                      onChange={() => setConnectionMode('auto_create')}
                      className="accent-amber-500"
                    />
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-amber-400" />
                      Criar automaticamente escada de retorno no andar de destino
                    </span>
                  </div>
                  {connectionMode === 'auto_create' && (
                    <p className="text-[10px] text-slate-400 pl-5">
                      Irá posicionar uma escada correspondente no andar "{targetLevelObj?.name}" na mesma posição ({r}, {c}) e interligar as duas.
                    </p>
                  )}
                </label>

                {/* Opção 3: Coordenadas personalizadas */}
                <label className={`p-2.5 rounded-xl border flex flex-col gap-1.5 cursor-pointer transition-all ${
                  connectionMode === 'custom_coords'
                    ? 'bg-amber-500/10 border-amber-500/80 text-amber-200'
                    : 'bg-[#0a0e17] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="connectionMode"
                      checked={connectionMode === 'custom_coords'}
                      onChange={() => setConnectionMode('custom_coords')}
                      className="accent-amber-500"
                    />
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      Definir coordenadas manuais de spawn
                    </span>
                  </div>

                  {connectionMode === 'custom_coords' && (
                    <div className="grid grid-cols-2 gap-3 p-2.5 bg-[#0a0e17] border border-[#2a3449] rounded-lg mt-1 pl-3 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Linha (Row)</label>
                        <input
                          type="number"
                          min={0}
                          value={targetSpawnR ?? r}
                          onChange={(e) => setTargetSpawnR(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#161d2d] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Coluna (Col)</label>
                        <input
                          type="number"
                          min={0}
                          value={targetSpawnC ?? c}
                          onChange={(e) => setTargetSpawnC(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#161d2d] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[#2a3449]/60 bg-[#161d2d]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            Salvar e Conectar Escadas
          </button>
        </div>
      </div>
    </div>
  );
};
