'use client';

import React, { useState } from 'react';
import { 
  Swords, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ShieldAlert, 
  Heart, 
  Sparkles, 
  ChevronRight,
  Shield,
  Coins,
  Skull,
  UserPlus
} from 'lucide-react';
import { Combatant, ConditionType } from '@/lib/types';
import { CONDITIONS, INITIAL_MONSTERS } from '@/lib/srd-data';
import { useAuth } from '@/context/AuthContext';

interface CombatTrackerProps {
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  currentTurnIndex: number;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  roundCount: number;
  setRoundCount: React.Dispatch<React.SetStateAction<number>>;
  onGenerateLoot: () => void;
  onLoadDemoEverything: () => void;
}

export const CombatTracker: React.FC<CombatTrackerProps> = ({
  combatants,
  setCombatants,
  currentTurnIndex,
  setCurrentTurnIndex,
  roundCount,
  setRoundCount,
  onGenerateLoot,
  onLoadDemoEverything,
}) => {
  const { activeCampaign, activeSession, createFeedEvent } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'player' | 'monster' | 'npc'>('monster');
  const [hp, setHp] = useState(15);
  const [ac, setAc] = useState(13);
  const [init, setInit] = useState(10);
  const [cr, setCr] = useState('1/2');

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex >= combatants.length - 1) {
      setCurrentTurnIndex(0);
      setRoundCount((prev) => prev + 1);
    } else {
      setCurrentTurnIndex((prev) => prev + 1);
    }
  };

  const handleHpChange = (id: string, delta: number) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
          return { ...c, hp: newHp };
        }
        return c;
      })
    );
  };

  const handleToggleCondition = (id: string, cond: ConditionType) => {
    setCombatants((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const exists = c.conditions.includes(cond);
          const newConds = exists
            ? c.conditions.filter((x) => x !== cond)
            : [...c.conditions, cond];
          return { ...c, conditions: newConds };
        }
        return c;
      })
    );
  };

  const handleAddCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newC: Combatant = {
      id: `c-${Date.now()}`,
      name,
      type,
      hp,
      maxHp: hp,
      ac,
      initiative: init || Math.floor(Math.random() * 20) + 1,
      conditions: [],
      cr: type === 'monster' ? cr : undefined,
    };

    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
    setName('');
    setShowAddModal(false);
  };

  const handleAddPresetMonster = (m: typeof INITIAL_MONSTERS[0]) => {
    const newC: Combatant = {
      id: `c-${Date.now()}-${Math.random()}`,
      name: m.name,
      type: 'monster',
      hp: m.hp,
      maxHp: m.hp,
      ac: m.ac,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      cr: m.cr,
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
  };

  const handleDelete = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEndCombatAndPublishFeed = async () => {
    onGenerateLoot();
    if (activeCampaign) {
      const monstersDefeated = combatants.filter((c) => c.type === 'monster').length;
      await createFeedEvent({
        campaignId: activeCampaign.id,
        sessionId: activeSession?.id,
        eventType: 'battle_summary',
        title: `⚔️ Vitória em Combate (Rodada ${roundCount})`,
        summary: `O grupo enfrentou e venceu os inimigos em ${roundCount} rodadas de combate intenso.`,
        details: {
          inimigos_derrotados: monstersDefeated || 2,
          tesouro: '24 Moedas de Prata, 12 Ouro, 1x Poção de Cura',
        },
        isPublic: true,
      });
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col h-full overflow-hidden select-none">
      {/* Header Bar */}
      <div className="bg-[#0f141d] border-b border-[#2a3449] p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shadow-inner">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Combat Tracker & Iniciativa</h2>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                RODADA {roundCount}
              </span>
            </div>
            <p className="text-xs text-slate-400">Gerenciador de turnos, pontos de vida e condições do combate.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow transition-all active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Combatente</span>
          </button>

          <button
            onClick={handleNextTurn}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 font-black rounded-lg text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95"
          >
            <span>PRÓXIMO TURNO</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleEndCombatAndPublishFeed}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-400 hover:text-amber-300 font-bold rounded-lg text-xs transition-colors"
            title="Gerar tesouro e publicar no Feed da Campanha"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Loot & Publicar Feed</span>
          </button>
        </div>
      </div>

      {/* Main Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {combatants.length === 0 ? (
          <div className="border-2 border-dashed border-[#2a3449] rounded-2xl p-8 text-center text-slate-500 bg-[#0f141d]/40 max-w-xl mx-auto my-8">
            <Swords className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300 text-sm mb-1">Nenhum combatente na iniciativa ativa.</p>
            <p className="text-xs text-slate-500 mb-4">
              Adicione combatentes manualmente, carregue monstros pré-configurados ou clique em carregar exemplo.
            </p>

            <div className="flex justify-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
              >
                + Criar Combatente
              </button>
              <button
                onClick={onLoadDemoEverything}
                className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] font-bold text-xs rounded-xl"
              >
                Carregar Exemplo de Demo
              </button>
            </div>
          </div>
        ) : (
          combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                  isTurn
                    ? 'bg-gradient-to-r from-rose-950/40 via-[#161c28] to-[#121824] border-rose-500/80 shadow-xl shadow-rose-900/20 ring-1 ring-rose-500/40'
                    : 'bg-[#121824] border-[#2a3449] opacity-90 hover:opacity-100'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-center gap-4 min-w-[220px]">
                  <div className="w-10 h-10 rounded-xl bg-[#0a0d14] border border-[#2a3449] flex flex-col items-center justify-center font-mono font-bold text-amber-400 shadow-inner">
                    <span className="text-[9px] text-slate-500 font-sans">INIT</span>
                    <span className="text-sm leading-none">{c.initiative}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-100 text-sm">{c.name}</h4>
                      {isTurn && (
                        <span className="text-[9px] font-black uppercase bg-rose-500 text-slate-950 px-2 py-0.5 rounded animate-pulse">
                          TURNO ATUAL
                        </span>
                      )}
                      {c.cr && (
                        <span className="text-[10px] font-mono text-slate-400 bg-[#0a0d14] px-1.5 py-0.5 rounded border border-[#2a3449]">
                          CR {c.cr}
                        </span>
                      )}
                    </div>

                    {/* Condition Badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.conditions.map((cond) => (
                        <span
                          key={cond}
                          onClick={() => handleToggleCondition(c.id, cond)}
                          className="text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-rose-500/40"
                        >
                          {cond} ×
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* HP & AC Controls */}
                <div className="flex items-center gap-6">
                  {/* AC Badge */}
                  <div className="flex items-center gap-1.5 bg-[#0a0d14] px-3 py-1.5 rounded-xl border border-[#2a3449]">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">CA</div>
                      <div className="text-xs font-mono font-bold text-slate-200">{c.ac}</div>
                    </div>
                  </div>

                  {/* HP Bar & Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleHpChange(c.id, -5)}
                        className="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-bold text-xs hover:bg-rose-900"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleHpChange(c.id, -1)}
                        className="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-bold text-xs hover:bg-rose-900"
                      >
                        -1
                      </button>
                    </div>

                    <div className="w-32">
                      <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
                        <span className="text-rose-400 flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> HP:
                        </span>
                        <span className="text-slate-200">
                          {c.hp} / {c.maxHp}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                        <div
                          className={`h-full transition-all duration-300 ${
                            hpPercent > 50
                              ? 'bg-emerald-500'
                              : hpPercent > 20
                              ? 'bg-amber-500'
                              : 'bg-rose-600'
                          }`}
                          style={{ width: `${hpPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleHpChange(c.id, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-xs hover:bg-emerald-900"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleHpChange(c.id, 5)}
                        className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold text-xs hover:bg-emerald-900"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Monster Toolbar */}
      <div className="p-3 bg-[#0f141d] border-t border-[#2a3449] flex items-center justify-between overflow-x-auto gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex-shrink-0">
          Injetar Inimigos Rápidos (SRD):
        </span>
        <div className="flex items-center gap-1.5">
          {INITIAL_MONSTERS.map((m) => (
            <button
              key={m.id}
              onClick={() => handleAddPresetMonster(m)}
              className="px-2.5 py-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1 flex-shrink-0"
            >
              <Skull className="w-3 h-3 text-rose-400" />
              <span>+ {m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Add Combatant */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" /> Adicionar Combatente
            </h3>

            <form onSubmit={handleAddCombatant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Goblin Arqueiro #2"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">HP Máximo:</label>
                  <input
                    type="number"
                    value={hp}
                    onChange={(e) => setHp(Number(e.target.value))}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Classe de Armadura (CA):</label>
                  <input
                    type="number"
                    value={ac}
                    onChange={(e) => setAc(Number(e.target.value))}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Iniciativa:</label>
                  <input
                    type="number"
                    value={init}
                    onChange={(e) => setInit(Number(e.target.value))}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
