'use client';

import React, { useState, useEffect } from 'react';
import { Combatant } from '@/lib/types';
import { 
  Brain, 
  Sparkles, 
  Swords, 
  Footprints, 
  ShieldAlert, 
  MessageSquare, 
  Copy, 
  Check, 
  X, 
  RefreshCw,
  Crown,
  Volume2
} from 'lucide-react';
import { toast } from 'sonner';

interface MonsterTacticsModalProps {
  monster: Combatant;
  opponents: Combatant[];
  roundCount?: number;
  environment?: string;
  onClose: () => void;
}

interface TacticsResult {
  primaryAction: string;
  targetName: string;
  movementAdvice: string;
  bonusOrReaction: string;
  roleplayQuote: string;
  tacticalReasoning: string;
}

export const MonsterTacticsModal: React.FC<MonsterTacticsModalProps> = ({
  monster,
  opponents,
  roundCount = 1,
  environment = 'Arena de Combate',
  onClose,
}) => {
  const [tactics, setTactics] = useState<TacticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchTactics = async () => {
    setIsLoading(true);
    try {
      const payload = {
        monster: {
          name: monster.name,
          type: monster.type,
          hp: monster.hp,
          maxHp: monster.maxHp || monster.hp,
          ac: monster.ac,
          actions: monster.actions,
          spells: (monster as any).spells || monster.characterSheet?.spells || [],
          str: monster.str,
          dex: monster.dex,
          con: monster.con,
          int: monster.int,
          wis: monster.wis,
          cha: monster.cha,
        },
        opponents: opponents.map((op) => ({
          name: op.name,
          hp: op.hp,
          maxHp: op.maxHp || op.hp,
          ac: op.ac,
          conditions: op.conditions,
          isConcentrating: Boolean(op.conditions?.includes('Concentrando' as any)),
          classOrRole: op.type === 'player' ? 'Jogador' : 'Inimigo',
        })),
        roundCount,
        environment,
      };

      const res = await fetch('/api/ai/monster-tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.tactics) {
        setTactics(data.tactics);
      } else {
        toast.error(data.error || 'Não foi possível gerar a análise tática.');
      }
    } catch (err: any) {
      console.error('Erro ao buscar táticas:', err);
      toast.error('Erro de conexão ao consultar a IA Tática.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTactics();
  }, [monster.id]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f1420] border border-amber-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  IA Tática: O que <span className="text-amber-400">{monster.name}</span> faria agora?
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Análise de campo, atributos de INT/SAB e heurísticas D&D 5e • Rodada {roundCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTactics}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
              title="Recalcular Análise Tática"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-200">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Brain className="w-12 h-12 text-amber-400 animate-bounce mb-3" />
              <h4 className="text-sm font-bold text-slate-200">Analisando o campo de batalha e a mente da criatura...</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Avaliando pontos fracos dos oponentes, concentração e opções do monstro.
              </p>
            </div>
          ) : tactics ? (
            <>
              {/* Card 1: Ação Principal Recomendada */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Swords className="w-4 h-4" /> Ação Principal Recomendada
                  </span>
                  <button
                    onClick={() => copyToClipboard(tactics.primaryAction, 'primary')}
                    className="text-slate-400 hover:text-amber-300 text-xs flex items-center gap-1"
                  >
                    {copiedField === 'primary' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-100 leading-relaxed">
                  {tactics.primaryAction}
                </p>
                {tactics.targetName && (
                  <div className="mt-2 text-xs font-semibold text-amber-300/90 flex items-center gap-1">
                    <span>🎯 Alvo Prioritário:</span>
                    <strong className="text-amber-400 underline">{tactics.targetName}</strong>
                  </div>
                )}
              </div>

              {/* Grid: Movimentação & Reação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Movimentação */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-1">
                    <Footprints className="w-3.5 h-3.5" /> Posicionamento & Movimento
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tactics.movementAdvice}
                  </p>
                </div>

                {/* Ação Bônus / Reação */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Ação Bônus / Reação
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tactics.bonusOrReaction}
                  </p>
                </div>
              </div>

              {/* Card: Fala de Interpretação / Provocação */}
              {tactics.roleplayQuote && (
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Fala de Interpretação / Roleplay
                  </span>
                  <p className="text-xs italic text-purple-200 font-serif leading-relaxed">
                    {tactics.roleplayQuote}
                  </p>
                </div>
              )}

              {/* Raciocínio Tático */}
              {tactics.tacticalReasoning && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Justificativa D&D:</strong> {tactics.tacticalReasoning}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950 text-xs text-slate-400">
          <span>Inspirado no compêndio tático D&D 5e</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
