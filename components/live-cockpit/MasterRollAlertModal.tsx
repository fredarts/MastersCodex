'use client';

import React, { useEffect } from 'react';
import { PlayerRollEvent } from '@/lib/types';
import { Dices, User, CheckCircle2, XCircle, Sparkles, Flame, Skull, ShieldAlert, Target } from 'lucide-react';

interface MasterRollAlertModalProps {
  isOpen: boolean;
  alerts: PlayerRollEvent[];
  onDismiss: () => void;
}

export const MasterRollAlertModal: React.FC<MasterRollAlertModalProps> = ({
  isOpen,
  alerts,
  onDismiss,
}) => {
  const currentAlert = alerts[0];

  useEffect(() => {
    if (!isOpen || !currentAlert) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentAlert, onDismiss]);

  if (!isOpen || !currentAlert) return null;

  const {
    characterName,
    playerName,
    avatarUrl,
    rollType,
    label,
    d20Roll,
    d20Roll1,
    d20Roll2,
    modifier,
    total,
    dc,
    isSuccess,
    isCrit,
    isFail,
    advantageMode,
    timestamp,
  } = currentAlert;

  const isSavingThrow = rollType === 'save';
  const isAttack = rollType === 'attack';
  const isSkill = rollType === 'skill';
  const isAttribute = rollType === 'attribute' || (!isSavingThrow && !isAttack && !isSkill);

  const getRollBadgeColor = () => {
    if (isCrit) return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    if (isFail) return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    if (isSavingThrow) return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
    if (isSkill) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
    if (isAttack) return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
  };

  const getRollTypeName = () => {
    if (isSavingThrow) return '🛡️ Salvaguarda (Resistência)';
    if (isSkill) return '🎯 Teste de Perícia';
    if (isAttack) return '⚔️ Jogada de Ataque';
    if (rollType === 'spell') return '✨ Teste de Magia';
    return '🎲 Teste de Atributo / Habilidade';
  };

  // Determina se passou ou falhou
  const passed = isSuccess !== undefined ? isSuccess : dc !== undefined ? total >= dc : undefined;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="w-full max-w-md bg-[#0d121c] border-2 border-amber-500/60 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO COM TEMA DE DADO & FILA */}
        <div className="bg-gradient-to-r from-amber-950/80 via-[#182236] to-amber-950/80 p-3.5 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-inner">
              <Dices className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-300 font-serif uppercase tracking-wider leading-tight">
                Notificação de Rolagem
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {timestamp || 'Agora'}
              </span>
            </div>
          </div>

          {alerts.length > 1 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono shadow animate-bounce">
              1 de {alerts.length} pendentes
            </span>
          )}
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-5 space-y-4">
          {/* IDENTIFICAÇÃO: PERSONAGEM + JOGADOR */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#060911] border border-amber-500/20 shadow-inner">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-500/50 bg-[#0c101a] shrink-0 relative shadow">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={characterName}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-400/80">
                  <User className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold text-amber-400/80 uppercase font-serif tracking-wider block truncate">
                {playerName ? `Jogador: ${playerName}` : 'Jogador'}
              </span>
              <h4 className="text-base font-extrabold text-slate-100 font-serif truncate leading-tight">
                {characterName || 'Personagem'}
              </h4>
            </div>
          </div>

          {/* CARD DO TESTE EXECUTADO */}
          <div className="text-center space-y-1.5 p-3 rounded-xl bg-[#080c16] border border-slate-800">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono border ${getRollBadgeColor()}`}>
              {getRollTypeName()}
            </span>

            <h5 className="text-sm font-black text-slate-200 font-serif leading-tight">
              {label || 'Teste'}
            </h5>

            {advantageMode && advantageMode !== 'normal' && (
              <span className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded font-mono ${
                advantageMode === 'advantage' 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
              }`}>
                {advantageMode === 'advantage' ? '✨ Vantagem' : '⚠️ Desvantagem'}
                {d20Roll1 !== undefined && d20Roll2 !== undefined && ` (d20: ${d20Roll1} / ${d20Roll2})`}
              </span>
            )}
          </div>

          {/* PLACAR NUMÉRICO PRINCIPAL */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#0e1626] to-[#080d16] border-2 border-amber-500/40 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
            {isCrit && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase font-mono shadow animate-pulse">
                <Flame className="w-3 h-3" />
                Crítico!
              </div>
            )}
            {isFail && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase font-mono shadow animate-pulse">
                <Skull className="w-3 h-3" />
                Falha Crítica
              </div>
            )}

            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-serif mb-1">
              Resultado Total
            </span>

            <span className={`text-4xl font-black font-mono tracking-tight ${
              isCrit ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]' :
              isFail ? 'text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]' :
              'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
            }`}>
              {total}
            </span>

            <span className="text-xs font-mono font-bold text-slate-400 mt-1">
              d20 ({d20Roll}) {modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`} = {total}
            </span>

            {/* DIFICULDADE & SUCESSO/FALHA (SE HOUVER CD) */}
            {dc !== undefined && (
              <div className="mt-3 pt-2.5 border-t border-slate-800 w-full flex items-center justify-center gap-3">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  Dificuldade: <strong className="text-amber-300">CD {dc}</strong>
                </span>

                {passed !== undefined && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-black font-serif px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                    passed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  }`}>
                    {passed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Passou
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        Falhou
                      </>
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ COM BOTÃO ÚNICO [ OK ] */}
        <div className="p-3.5 bg-[#090d16] border-t border-amber-500/25 flex items-center justify-center">
          <button
            type="button"
            onClick={onDismiss}
            autoFocus
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm py-2.5 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] font-serif uppercase tracking-wider cursor-pointer"
          >
            OK {alerts.length > 1 ? `(Próximo: ${alerts.length - 1})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
