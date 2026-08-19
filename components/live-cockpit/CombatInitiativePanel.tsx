'use client';

import React from 'react';
import {
  Swords,
  BookOpen,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  CheckCircle2,
  Check,
  MessageSquare,
} from 'lucide-react';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { useLiveCockpit } from '@/lib/hooks/useLiveCockpit';
import { useSession } from '@/lib/hooks/useSession';
import { CombatantCard } from '@/components/live-cockpit/CombatantCard';
import { NarratorTeleprompterPanel } from '@/components/live-cockpit/NarratorTeleprompterPanel';
import { SharedGameLog } from '@/components/live-cockpit/SharedGameLog';
import { LiveChatPanel } from '@/components/live-cockpit/LiveChatPanel';
import { Combatant, ConditionType, CharacterSheet, CharacterSpell } from '@/lib/types';

interface CombatInitiativePanelProps {
  characterSheets: CharacterSheet[];
  getSpeedInMeters: (speedStr?: string) => number;
  rollDice: (title: string, mod: number, actorCombatant?: Combatant, actionDesc?: string, forceNoTarget?: boolean) => boolean;
  deductAction: (combatantId: string, actionType: 'action' | 'bonus' | 'reaction') => void;
  handleHpChange: (id: string, delta: number) => void;
  handleToggleCondition: (id: string, condition: ConditionType) => void;
  handleCastSpellFromCard: (c: Combatant, sheet: CharacterSheet, spell: CharacterSpell) => void;
  handleNextTurn: () => void;
  handlePrevTurn: () => void;
  handleEndCombat: () => void;
  handleStartImpromptuCombat: () => void;
  onSlideChange: (index: number) => Promise<void>;
}

export const CombatInitiativePanel: React.FC<CombatInitiativePanelProps> = ({
  characterSheets,
  getSpeedInMeters,
  rollDice,
  deductAction,
  handleHpChange,
  handleToggleCondition,
  handleCastSpellFromCard,
  handleNextTurn,
  handlePrevTurn,
  handleEndCombat,
  handleStartImpromptuCombat,
  onSlideChange,
}) => {
  const {
    combatants,
    setCombatants,
    currentTurnIndex,
    roundCount,
    broadcastToPlayerView,
    combatLogs,
    setCombatLogs,
    chatMessages,
  } = useLiveCockpit();

  const { activeScene, updateScene } = useSession();

  const {
    rightPanelTab,
    setRightPanelTab,
    isCombatActive,
    autoInit,
    setAutoInit,
    selectedTargetId,
    setSelectedTargetId,
    setShowAddCombatantModal,
    isBattleStarted,
  } = useLiveCockpitStudioStore();

  return (
    <div className="w-[380px] bg-[#0c0f17] flex flex-col justify-between overflow-hidden border-l border-[#2a3449] relative">
      {/* Header with Sub-tabs */}
      <div className="p-2 border-b border-[#2a3449] bg-[#121824]/50 flex items-center justify-between gap-1">
        <div className="flex bg-[#0a0d14] border border-[#2a3449] rounded-xl p-0.5 w-full gap-0.5">
          <button
            onClick={() => setRightPanelTab('init')}
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              rightPanelTab === 'init'
                ? 'bg-rose-600 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3 h-3" />
            <span>Iniciativa ({combatants.length})</span>
          </button>

          <button
            onClick={() => setRightPanelTab('teleprompter')}
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              rightPanelTab === 'teleprompter'
                ? 'bg-purple-600 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Teleprompter</span>
          </button>

          <button
            onClick={() => setRightPanelTab('log')}
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              rightPanelTab === 'log'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScrollText className="w-3 h-3" />
            <span>Logs ({combatLogs.length})</span>
          </button>

          <button
            onClick={() => setRightPanelTab('chat')}
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              rightPanelTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat ({chatMessages.length})</span>
          </button>
        </div>
      </div>

      {rightPanelTab === 'teleprompter' ? (
        <NarratorTeleprompterPanel onSlideChange={onSlideChange} />
      ) : rightPanelTab === 'log' ? (
        <SharedGameLog
          combatLogs={combatLogs}
          chatMessages={chatMessages}
          campaignName={activeScene?.title || 'Sessão Ativa'}
          campaignId={activeScene?.id || 'default-session'}
          isDm={true}
          onClearLogs={() => setCombatLogs([])}
        />
      ) : rightPanelTab === 'chat' ? (
        <LiveChatPanel />
      ) : !isCombatActive && combatants.length === 0 ? (
        /* Clean Empty State when no combat active */
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 my-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#121824] border border-[#2a3449] flex items-center justify-center shadow-inner">
            <Swords className="w-7 h-7 text-rose-400 opacity-60" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200">Sem Combate Ativo</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
              Esta cena está em modo narrativo / exploração. Nenhum combate ativo no momento.
            </p>
          </div>
          <button
            onClick={handleStartImpromptuCombat}
            className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4" />
            <span>INICIAR COMBATE NESTA CENA</span>
          </button>
        </div>
      ) : (
        /* Active Combat Interface */
        <>
          {/* Turn & Add Combatants Toolbar */}
          <div className="p-2 border-b border-[#2a3449] bg-[#161c28]/40 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={handlePrevTurn}
                disabled={!isBattleStarted || combatants.length === 0 || (currentTurnIndex === 0 && roundCount === 1)}
                className="py-1.5 px-3 bg-[#121824] hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2a3449] text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                title="Voltar Turno Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-slate-400" />
                <span>Voltar</span>
              </button>

              <button
                onClick={handleNextTurn}
                disabled={!isBattleStarted || combatants.length === 0}
                className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-[#1f2738] disabled:text-slate-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
              >
                <span>
                  {!isBattleStarted ? 'BATALHA NÃO INICIADA' : `AVANÇAR TURNO (${combatants.length > 0 ? currentTurnIndex + 1 : 0}/${combatants.length})`}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mt-1 pl-1">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    autoInit
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-[#0a0d14] border-[#2a3449] group-hover:border-amber-500/50'
                  }`}
                >
                  {autoInit && <Check className="w-3 h-3 text-slate-900" />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={autoInit}
                  onChange={(e) => setAutoInit(e.target.checked)}
                />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-300">
                  Rolar Iniciativa todo turno
                </span>
              </label>
            </div>

            <button
              onClick={() => setShowAddCombatantModal(true)}
              className="w-full py-1.5 mt-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Adicionar Combatentes</span>
            </button>
          </div>

          {/* Live Combatants List */}
          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {combatants.map((c, idx) => (
              <CombatantCard
                key={`${c.id}-${idx}`}
                c={c}
                idx={idx}
                characterSheets={characterSheets}
                getSpeedInMeters={getSpeedInMeters}
                rollDice={rollDice}
                deductAction={deductAction}
                handleHpChange={handleHpChange}
                handleToggleCondition={handleToggleCondition}
                handleCastSpellFromCard={handleCastSpellFromCard}
                onUpdateCombatants={setCombatants}
                onUpdateScene={updateScene}
                activeScene={activeScene}
              />
            ))}
          </div>

          {/* End Combat Footer */}
          <div className="p-3 border-t border-[#2a3449] bg-[#121824]/60">
            <button
              onClick={handleEndCombat}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Encerrar Combate & Gerar Loot</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
