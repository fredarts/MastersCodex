'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
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
  handleStartBattle?: () => void;
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
  handleStartBattle,
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
    isRightPanelCollapsed,
    toggleRightPanel,
    setIsRightPanelCollapsed,
    isCombatActive,
    autoInit,
    setAutoInit,
    selectedTargetId,
    setSelectedTargetId,
    setShowAddCombatantModal,
    isBattleStarted,
  } = useLiveCockpitStudioStore();

  const [lairActionAlert, setLairActionAlert] = useState<{ round: number; initiative: number } | null>(null);

  useEffect(() => {
    const handleLairAlert = (e: any) => {
      setLairActionAlert(e.detail || { round: roundCount, initiative: 20 });
    };
    window.addEventListener('masters_codex_lair_action_alert', handleLairAlert);
    return () => {
      window.removeEventListener('masters_codex_lair_action_alert', handleLairAlert);
    };
  }, [roundCount]);

  // Collapsed Mode: Sleek vertical dock with mini tabs and expand button
  if (isRightPanelCollapsed) {
    return (
      <div className="w-14 bg-[#0c0f17] border-l border-[#2a3449] flex flex-col items-center justify-between py-3 overflow-hidden transition-all duration-300 flex-shrink-0 relative z-10 select-none">
        {/* Top: Expand trigger */}
        <div className="flex flex-col items-center gap-3 w-full px-1.5">
          <button
            onClick={toggleRightPanel}
            className="w-10 h-10 rounded-xl bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md cursor-pointer transition-all active:scale-95 group"
            title="Expandir Painel Lateral (Iniciativa, Teleprompter, Logs, Chat)"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="w-8 border-b border-[#2a3449]/70" />

          {/* Quick tab trigger icons */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Iniciativa tab */}
            <button
              onClick={() => {
                setRightPanelTab('init');
                setIsRightPanelCollapsed(false);
              }}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                rightPanelTab === 'init'
                  ? 'bg-rose-600/20 border border-rose-500/60 text-rose-400 shadow-lg'
                  : 'bg-[#121824] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 border border-[#2a3449]'
              }`}
              title={`Iniciativa (${combatants.length} combatentes)`}
            >
              <Swords className="w-4 h-4" />
              {combatants.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-rose-400 shadow">
                  {combatants.length}
                </span>
              )}
            </button>

            {/* Teleprompter tab */}
            <button
              onClick={() => {
                setRightPanelTab('teleprompter');
                setIsRightPanelCollapsed(false);
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                rightPanelTab === 'teleprompter'
                  ? 'bg-purple-600/20 border border-purple-500/60 text-purple-400 shadow-lg'
                  : 'bg-[#121824] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 border border-[#2a3449]'
              }`}
              title="Teleprompter do Mestre"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Logs tab */}
            <button
              onClick={() => {
                setRightPanelTab('log');
                setIsRightPanelCollapsed(false);
              }}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                rightPanelTab === 'log'
                  ? 'bg-amber-500/20 border border-amber-500/60 text-amber-400 shadow-lg'
                  : 'bg-[#121824] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 border border-[#2a3449]'
              }`}
              title={`Logs de Combate (${combatLogs.length})`}
            >
              <ScrollText className="w-4 h-4" />
              {combatLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-amber-400 shadow">
                  {combatLogs.length > 99 ? '99+' : combatLogs.length}
                </span>
              )}
            </button>

            {/* Chat tab */}
            <button
              onClick={() => {
                setRightPanelTab('chat');
                setIsRightPanelCollapsed(false);
              }}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                rightPanelTab === 'chat'
                  ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-400 shadow-lg'
                  : 'bg-[#121824] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 border border-[#2a3449]'
              }`}
              title={`Chat da Mesa (${chatMessages.length})`}
            >
              <MessageSquare className="w-4 h-4" />
              {chatMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-slate-950 font-mono text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-cyan-400 shadow">
                  {chatMessages.length > 99 ? '99+' : chatMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Round info badge */}
        {isBattleStarted && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-slate-400 font-bold">R{roundCount}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-[380px] bg-[#0c0f17] flex flex-col justify-between overflow-hidden border-l border-[#2a3449] relative transition-all duration-300 flex-shrink-0">
      {/* Header with Sub-tabs & Collapse Button */}
      <div className="p-2 border-b border-[#2a3449] bg-[#121824]/50 flex items-center justify-between gap-1.5">
        <div className="flex bg-[#0a0d14] border border-[#2a3449] rounded-xl p-0.5 flex-1 gap-0.5">
          <button
            onClick={() => setRightPanelTab('init')}
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
            className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              rightPanelTab === 'chat'
                ? 'bg-cyan-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat ({chatMessages.length})</span>
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleRightPanel}
          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-[#1f2738] rounded-xl transition-all cursor-pointer shrink-0 border border-transparent hover:border-[#2a3449]"
          title="Recolher Painel Lateral"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
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
          {/* Lair Action (Ação de Covil) Alert Banner na Iniciativa 20 */}
          {lairActionAlert && (
            <div className="p-2.5 mx-2 mt-2 bg-gradient-to-r from-purple-950/90 via-amber-950/80 to-purple-950/90 border border-amber-500/60 rounded-xl shadow-lg flex items-center justify-between gap-2 select-none animate-pulse">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider font-serif flex items-center gap-1.5">
                    <span>🏰 AÇÃO DE COVIL</span>
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-950 px-1 py-0.2 rounded border border-amber-500/40">
                      Inic 20
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-300 truncate font-sans">
                    O covil reage aos invasores na contagem 20!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('masters_codex_log_entry', {
                        detail: {
                          message: `🏰 Ação de Covil ativada na Iniciativa 20!`,
                          description: `O Mestre executou o efeito ambiental de covil da rodada.`,
                          type: 'lair_action',
                        }
                      }));
                    }
                    toast.success('Ação de Covil registrada no Log de Combate!');
                    setLairActionAlert(null);
                  }}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] rounded-lg shadow transition-all cursor-pointer"
                >
                  Ativar
                </button>
                <button
                  type="button"
                  onClick={() => setLairActionAlert(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
                  title="Dispensar alerta de covil"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Turn & Add Combatants Toolbar */}
          <div className="p-2 border-b border-[#2a3449] bg-[#161c28]/40 flex flex-col gap-2">
            <div className="flex gap-2">
              {isBattleStarted && (
                <button
                  onClick={handlePrevTurn}
                  disabled={combatants.length === 0 || (currentTurnIndex === 0 && roundCount === 1)}
                  className="py-1.5 px-3 bg-[#121824] hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2a3449] text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Voltar Turno Anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <span>Voltar</span>
                </button>
              )}

              {!isBattleStarted ? (
                <button
                  onClick={() => {
                    if (handleStartBattle) {
                      handleStartBattle();
                    } else {
                      handleStartImpromptuCombat();
                    }
                  }}
                  disabled={combatants.length === 0}
                  className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-[0.98]"
                >
                  <Swords className="w-4 h-4" />
                  <span>INICIAR BATALHA</span>
                </button>
              ) : (
                <button
                  onClick={handleNextTurn}
                  disabled={combatants.length === 0}
                  className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-[#1f2738] disabled:text-slate-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <span>
                    {`PASSAR TURNO (${combatants.length > 0 ? currentTurnIndex + 1 : 0}/${combatants.length})`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 mt-1 pl-1">
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

              <button
                type="button"
                onClick={() => setLairActionAlert({ round: roundCount, initiative: 20 })}
                className="text-[9px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                title="Disparar manualmente alerta de Ação de Covil"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Covil (Inic 20)</span>
              </button>
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
