'use client';

import React, { useState } from 'react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { ShieldAlert, Dices, Check, X, Sparkles, Heart } from 'lucide-react';
import { toast } from 'sonner';

export const ConcentrationCheckModal: React.FC = () => {
  const {
    activeConcentrationPrompt,
    setActiveConcentrationPrompt,
    updateCombatantState,
    broadcastCombatLogEntry,
    roundCount,
  } = useLiveCockpit();

  const [d20Roll, setD20Roll] = useState<number | null>(null);
  const [totalSave, setTotalSave] = useState<number | null>(null);

  if (!activeConcentrationPrompt) return null;

  const { combatant, damageTaken, dc } = activeConcentrationPrompt;

  // Obter bônus de CON
  let conBonus = 0;
  if (combatant.savingThrowBonuses?.CON !== undefined) {
    conBonus = combatant.savingThrowBonuses.CON;
  } else if (combatant.con !== undefined) {
    conBonus = Math.floor((combatant.con - 10) / 2);
  }

  const handleRollConSave = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + conBonus;
    setD20Roll(roll);
    setTotalSave(total);

    if (total >= dc) {
      toast.success(`🛡️ ${combatant.name} manteve a concentração! (Total ${total} vs CD ${dc})`);
      broadcastCombatLogEntry({
        id: `conc-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        round: roundCount,
        actorId: combatant.id,
        actorName: combatant.name,
        eventType: 'system',
        description: `🛡️ ${combatant.name} manteve a concentração em ${combatant.concentrationSpell || 'Magia'}! (CON Save: d20(${roll}) + ${conBonus} = ${total} vs CD ${dc})`,
      });
      setTimeout(() => {
        setActiveConcentrationPrompt(null);
        setD20Roll(null);
        setTotalSave(null);
      }, 1200);
    } else {
      toast.error(`❌ ${combatant.name} perdeu a concentração! (Total ${total} vs CD ${dc})`);
      handleFailConcentration(roll, total);
    }
  };

  const handleFailConcentration = (roll?: number, total?: number) => {
    updateCombatantState(combatant.id, {
      isConcentrating: false,
      concentrationSpell: undefined,
    });

    broadcastCombatLogEntry({
      id: `conc-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      round: roundCount,
      actorId: combatant.id,
      actorName: combatant.name,
      eventType: 'system',
      description: `💥 ${combatant.name} perdeu a concentração em ${combatant.concentrationSpell || 'Magia'} após sofrer ${damageTaken} de dano! ${total !== undefined ? `(CON Save: d20(${roll}) + ${conBonus} = ${total} vs CD ${dc})` : ''}`,
    });

    setActiveConcentrationPrompt(null);
    setD20Roll(null);
    setTotalSave(null);
  };

  const handlePassConcentration = () => {
    toast.success(`🛡️ Concentração mantida manualmente para ${combatant.name}!`);
    setActiveConcentrationPrompt(null);
    setD20Roll(null);
    setTotalSave(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121620] border-2 border-purple-500/50 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-b from-purple-950/60 to-slate-900 border-b border-purple-900/40 text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center text-purple-300 mx-auto shadow-inner mb-3">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-base font-extrabold text-slate-100 uppercase tracking-wider">
            Teste de Concentração
          </h3>
          <p className="text-xs text-purple-300/80 font-mono mt-1">
            Dano sofrido: <strong className="text-rose-400">{damageTaken} PV</strong>
          </p>
        </div>

        {/* Informações do Combatente & Magia */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                {combatant.avatarUrl ? (
                  <img src={combatant.avatarUrl} alt={combatant.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-slate-300">{combatant.name.substring(0, 2)}</span>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100">{combatant.name}</div>
                <div className="text-xs text-purple-400 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3" />
                  <span>{combatant.concentrationSpell || 'Magia Ativa'}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">CD Necessária</div>
              <div className="text-xl font-black text-amber-400 font-mono">CD {dc}</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-slate-400 font-mono mb-3">
              Bônus de Salvaguarda de Constituição: <strong className="text-slate-200">{conBonus >= 0 ? `+${conBonus}` : conBonus}</strong>
            </div>

            {totalSave !== null ? (
              <div className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 ${
                totalSave >= dc
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                <span>Resultado: d20({d20Roll}) + {conBonus} = <strong>{totalSave}</strong></span>
                <span>({totalSave >= dc ? 'SUCESSO' : 'FALHA'})</span>
              </div>
            ) : (
              <button
                onClick={handleRollConSave}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-purple-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Dices className="w-5 h-5" />
                <span>Rolar Salvaguarda de CON (CD {dc})</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer com Overrides Manuais */}
        <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={() => handleFailConcentration()}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Quebrar Concentração</span>
          </button>

          <button
            onClick={handlePassConcentration}
            className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Manter Sucesso</span>
          </button>
        </div>

      </div>
    </div>
  );
};
