'use client';

import React from 'react';
import { Trash2, Sparkles, X } from 'lucide-react';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useSession } from '@/lib/hooks/useSession';
import { CreateSceneModal } from '@/components/CreateSceneModal';
import { AddCombatantModal } from '@/components/live-cockpit/AddCombatantModal';
import { BattleSetupModal } from '@/components/live-cockpit/BattleSetupModal';
import { Combatant } from '@/lib/types';
import { toast } from 'sonner';

interface LiveCockpitModalManagerProps {
  campaignMembers: any[];
  handleConfirmBattleSetup: (options: any) => void;
  handleConfirmMagicMissiles: () => void;
}

export const LiveCockpitModalManager: React.FC<LiveCockpitModalManagerProps> = ({
  campaignMembers,
  handleConfirmBattleSetup,
  handleConfirmMagicMissiles,
}) => {
  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    broadcastToPlayerView,
    setCurrentTurnIndex,
  } = useLiveCockpit();

  const { activeScene, updateScene } = useSession();

  const {
    showCreateSceneModal,
    setShowCreateSceneModal,
    showAddCombatantModal,
    setShowAddCombatantModal,
    showBattleSetupModal,
    setShowBattleSetupModal,
    confirmDeleteCombatant,
    setConfirmDeleteCombatant,
    pendingAttack,
    setPendingAttack,
    magicMissileModalState,
    setMagicMissileModalState,
    selectedTargetId,
    setSelectedTargetId,
  } = useLiveCockpitStudioStore();

  return (
    <>
      {/* Create Scene Modal */}
      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />

      {/* Add Combatant Modal */}
      <AddCombatantModal
        isOpen={showAddCombatantModal}
        onClose={() => setShowAddCombatantModal(false)}
        campaignMembers={campaignMembers || []}
        onAddCombatant={(newCombatant) => {
          setCombatants((prev) => {
            const currentActiveId = prev[currentTurnIndex]?.id;
            const next = [...prev, newCombatant].sort(
              (a, b) => (b.initiative || 0) - (a.initiative || 0)
            );
            if (currentActiveId) {
              const newActiveIdx = next.findIndex((x) => x.id === currentActiveId);
              if (newActiveIdx !== -1) {
                setCurrentTurnIndex(newActiveIdx);
              }
            }
            if (activeScene) {
              updateScene({ ...activeScene, combatants: next });
            }
            broadcastToPlayerView({ combatants: next });
            return next;
          });
          toast.success(`${newCombatant.name} adicionado ao combate!`);
          setShowAddCombatantModal(false);
        }}
      />

      {/* Battle Setup Modal */}
      <BattleSetupModal
        isOpen={showBattleSetupModal}
        onClose={() => setShowBattleSetupModal(false)}
        onConfirmSetup={handleConfirmBattleSetup}
      />

      {/* Confirm Delete Combatant Modal */}
      {confirmDeleteCombatant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Remover Combatente?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tem certeza de que deseja remover{' '}
                <strong className="text-slate-200">{confirmDeleteCombatant.name}</strong> da batalha?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteCombatant(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const targetId = confirmDeleteCombatant.id;
                  const updatedList = combatants.filter((x) => x.id !== targetId);
                  setCombatants(updatedList);
                  if (activeScene) {
                    updateScene({ ...activeScene, combatants: updatedList });
                  }
                  broadcastToPlayerView({ combatants: updatedList });
                  if (selectedTargetId === targetId) {
                    setSelectedTargetId(undefined);
                  }
                  toast.success(`${confirmDeleteCombatant.name} removido da batalha.`);
                  setConfirmDeleteCombatant(null);
                }}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-slate-100 text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Required Warning Modal */}
      {pendingAttack && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f141d] border-2 border-rose-500/50 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center font-black text-lg">
                🎯
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Selecione um Alvo no Grid</h4>
                <p className="text-xs text-slate-400">
                  Para realizar {pendingAttack.title}, você precisa definir o alvo primeiro.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl text-xs text-slate-300 leading-relaxed">
              💡 <strong>Como selecionar:</strong> Clique sobre qualquer criatura no{' '}
              <strong>Grid 3D</strong> ou na lista de combate. Um círculo de mira vermelho aparecerá
              sobre o alvo!
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => setPendingAttack(null)}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs rounded-xl transition-all shadow"
              >
                🎯 Entendi, vou selecionar no Grid!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Magic Missile Allocation Modal */}
      {magicMissileModalState && magicMissileModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-100 text-base">Alocar Mísseis Mágicos</h3>
              </div>
              <button
                onClick={() => setMagicMissileModalState(null)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>
                Dardos Disponíveis:{' '}
                <span className="font-bold text-indigo-400">
                  {magicMissileModalState.availableDarts -
                    Object.values(magicMissileModalState.dartAllocations).reduce((a, b) => a + b, 0)}
                </span>{' '}
                de {magicMissileModalState.availableDarts}
              </p>
              <p className="text-[11px] text-slate-400">
                Cada dardo causa <span className="text-amber-300 font-mono">1d4+1</span> de dano de
                energia automático.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {combatants
                .filter((c) => c.id !== magicMissileModalState.caster.id)
                .map((c) => {
                  const allocated = magicMissileModalState.dartAllocations[c.id] || 0;
                  const totalAllocated = Object.values(magicMissileModalState.dartAllocations).reduce(
                    (a, b) => a + b,
                    0
                  );
                  const remaining = magicMissileModalState.availableDarts - totalAllocated;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{c.name}</div>
                          <div className="text-[10px] text-slate-400">
                            HP: {c.hp}/{c.maxHp} | CA: {c.ac}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={allocated <= 0}
                          onClick={() => {
                            setMagicMissileModalState((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    dartAllocations: {
                                      ...prev.dartAllocations,
                                      [c.id]: Math.max(0, (prev.dartAllocations[c.id] || 0) - 1),
                                    },
                                  }
                                : null
                            );
                          }}
                          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg flex items-center justify-center text-slate-200 font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold font-mono text-indigo-400 text-sm">
                          {allocated}
                        </span>
                        <button
                          disabled={remaining <= 0}
                          onClick={() => {
                            setMagicMissileModalState((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    dartAllocations: {
                                      ...prev.dartAllocations,
                                      [c.id]: (prev.dartAllocations[c.id] || 0) + 1,
                                    },
                                  }
                                : null
                            );
                          }}
                          className="w-7 h-7 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-lg flex items-center justify-center text-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setMagicMissileModalState(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMagicMissiles}
                disabled={
                  Object.values(magicMissileModalState.dartAllocations).reduce((a, b) => a + b, 0) === 0
                }
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg disabled:opacity-50"
              >
                Disparar Mísseis
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
