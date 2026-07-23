'use client';

import React, { useState, useEffect } from 'react';
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
  UserPlus,
  Dices,
  Settings2,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { Combatant, ConditionType } from '@/lib/types';
import { CONDITIONS, INITIAL_MONSTERS } from '@/lib/srd-data';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useSession } from '@/lib/hooks/useSession';
import { useLiveCockpit } from '@/context/LiveCockpitContext';

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
  const { activeCampaign, createFeedEvent } = useCampaign();
  const { activeSession } = useSession();
  const { openSheet } = useLiveCockpit();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'player' | 'monster' | 'npc'>('monster');
  const [hp, setHp] = useState(15);
  const [ac, setAc] = useState(13);
  const [init, setInit] = useState(10);
  const [cr, setCr] = useState('1/2');

  const [autoInit, setAutoInit] = useState(false);
  const [hpInput, setHpInput] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);
  const [diceResult, setDiceResult] = useState<{title: string; roll: number; total: number; isCrit: boolean; isFail: boolean} | null>(null);

  useEffect(() => {
    if (diceResult) {
      const t = setTimeout(() => setDiceResult(null), 5000);
      return () => clearTimeout(t);
    }
  }, [diceResult]);

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    if (currentTurnIndex >= combatants.length - 1) {
      setCurrentTurnIndex(0);
      setRoundCount((prev) => prev + 1);
      
      if (autoInit) {
        setCombatants(prev => {
          const rolled = prev.map(c => {
             const dexMod = c.dex ? Math.floor((c.dex - 10) / 2) : 0;
             return { ...c, initiative: Math.floor(Math.random() * 20) + 1 + dexMod };
          });
          return rolled.sort((a,b) => b.initiative - a.initiative);
        });
      }
    } else {
      setCurrentTurnIndex((prev) => prev + 1);
    }
  };

  const applyHpChange = (id: string, delta: number) => {
    const c = combatants.find(x => x.id === id);
    if (!c) return;

    if (delta !== 0) {
      window.dispatchEvent(new CustomEvent('masters_codex_combat_text', {
        detail: { combatantId: id, type: delta < 0 ? 'damage' : 'heal', amount: Math.abs(delta) }
      }));
    }

    setCombatants((prev) =>
      prev.map((x) => {
        if (x.id === id) {
          const newHp = Math.max(0, Math.min(x.maxHp, x.hp + delta));
          return { ...x, hp: newHp };
        }
        return x;
      })
    );
  };

  const handlePreciseHp = (id: string, isDamage: boolean) => {
    const val = parseInt(hpInput[id] || '0', 10);
    if (isNaN(val) || val <= 0) return;
    applyHpChange(id, isDamage ? -val : val);
    setHpInput(prev => ({...prev, [id]: ''}));
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
    const dexMod = Math.floor((m.dex - 10) / 2);
    const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
    
    const newC: Combatant = {
      id: `c-${Date.now()}-${Math.random()}`,
      name: m.name,
      type: 'monster',
      hp: m.hp,
      maxHp: m.hp,
      ac: m.ac,
      initiative: initRoll,
      conditions: [],
      cr: m.cr,
      str: m.str,
      dex: m.dex,
      con: m.con,
      int: m.int,
      wis: m.wis,
      cha: m.cha,
      actions: m.actions
    };
    setCombatants((prev) => [...prev, newC].sort((a, b) => b.initiative - a.initiative));
  };

  const handleDelete = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
  };

  const rollDice = (title: string, mod: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    setDiceResult({
      title,
      roll,
      total: roll + mod,
      isCrit: roll === 20,
      isFail: roll === 1
    });
  };

  const getMod = (stat?: number) => stat ? Math.floor((stat - 10) / 2) : 0;

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col h-full overflow-hidden select-none relative">
      {/* Header Bar */}
      <div className="bg-[#0f141d] border-b border-[#2a3449] p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold shadow-inner">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">Combat Tracker</h2>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                RODADA {roundCount}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${autoInit ? 'bg-amber-500 border-amber-500' : 'bg-[#0a0d14] border-[#2a3449] group-hover:border-amber-500/50'}`}>
                  {autoInit && <Activity className="w-3 h-3 text-slate-900" />}
                </div>
                <input type="checkbox" className="hidden" checked={autoInit} onChange={(e) => setAutoInit(e.target.checked)} />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider group-hover:text-slate-300">
                  Rolar Iniciativa todo turno
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs shadow transition-all active:scale-95">
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Combatente</span>
          </button>
          <button onClick={handleNextTurn} className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 font-black rounded-lg text-xs shadow-lg shadow-rose-900/30 transition-all active:scale-95">
            <span>PRÓXIMO TURNO</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Queue List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        
        {/* Floating Dice Result */}
        {diceResult && (
          <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-8 fade-in duration-300">
            <div className={`bg-[#0f141d]/95 backdrop-blur-xl border-2 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[250px]
              ${diceResult.isCrit ? 'border-amber-500 shadow-amber-500/20' : diceResult.isFail ? 'border-rose-600 shadow-rose-900/20' : 'border-slate-600'}
            `}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-inner
                ${diceResult.isCrit ? 'bg-amber-500 text-slate-950' : diceResult.isFail ? 'bg-rose-600 text-slate-950' : 'bg-[#1e293b] text-slate-100'}
              `}>
                {diceResult.roll}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{diceResult.title}</div>
                <div className="text-2xl font-black text-slate-100">Total: {diceResult.total}</div>
              </div>
              <button onClick={() => setDiceResult(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full text-slate-400 hover:text-white border border-slate-600 flex items-center justify-center text-xs">×</button>
            </div>
          </div>
        )}

        {combatants.length === 0 ? (
          <div className="border-2 border-dashed border-[#2a3449] rounded-2xl p-8 text-center text-slate-500 bg-[#0f141d]/40 max-w-xl mx-auto my-8">
            <Swords className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300 text-sm mb-1">Nenhum combatente na iniciativa ativa.</p>
            <button onClick={onLoadDemoEverything} className="mt-4 px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] font-bold text-xs rounded-xl">Carregar Exemplo de Demo</button>
          </div>
        ) : (
          combatants.map((c, idx) => {
            const isTurn = idx === currentTurnIndex;
            const hpPercent = Math.max(0, Math.min(100, (c.hp / c.maxHp) * 100));
            const isExpanded = expandedId === c.id;
            const isStatusOpen = statusMenuOpen === c.id;

            return (
              <div
                key={`${c.id}-${idx}`}
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                  isTurn
                    ? 'bg-gradient-to-r from-rose-950/40 via-[#161c28] to-[#121824] border-rose-500/80 shadow-xl shadow-rose-900/20 ring-1 ring-rose-500/40'
                    : 'bg-[#121824] border-[#2a3449] opacity-90 hover:opacity-100'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="flex items-center gap-4 min-w-[220px]">
                    <div className="w-10 h-10 rounded-xl bg-[#0a0d14] border border-[#2a3449] flex flex-col items-center justify-center font-mono font-bold text-amber-400 shadow-inner">
                      <span className="text-[9px] text-slate-500 font-sans">INIT</span>
                      <span className="text-sm leading-none">{c.initiative}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 
                          className="font-bold text-slate-100 text-sm cursor-pointer hover:text-amber-400 hover:underline transition-colors"
                          onClick={() => openSheet(c.id || c.name, c.type === 'player' ? 'pc' : c.type, c.name, c)}
                        >
                          {c.name}
                        </h4>
                        {isTurn && (
                          <span className="text-[9px] font-black uppercase bg-rose-500 text-slate-950 px-2 py-0.5 rounded animate-pulse">TURNO ATUAL</span>
                        )}
                        {c.cr && (
                          <span className="text-[10px] font-mono text-slate-400 bg-[#0a0d14] px-1.5 py-0.5 rounded border border-[#2a3449]">CR {c.cr}</span>
                        )}
                      </div>

                      {/* Condition Badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5 relative">
                        {c.conditions.map((cond) => (
                          <span key={cond} onClick={() => handleToggleCondition(c.id, cond)} className="text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full cursor-pointer hover:bg-rose-500/40">
                            {cond} ×
                          </span>
                        ))}
                        <button 
                          onClick={() => setStatusMenuOpen(isStatusOpen ? null : c.id)}
                          className="text-[9px] font-bold text-slate-400 bg-[#0f141d] hover:bg-[#1e293b] border border-[#2a3449] px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                        >
                          + Status
                        </button>
                        
                        {/* Status Popover */}
                        {isStatusOpen && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-[#0f141d] border border-slate-700 rounded-xl shadow-2xl p-2 z-20 grid grid-cols-2 gap-1">
                            {CONDITIONS.map(cond => {
                              const active = c.conditions.includes(cond);
                              return (
                                <button
                                  key={cond}
                                  onClick={() => handleToggleCondition(c.id, cond)}
                                  className={`text-[9px] text-left px-2 py-1 rounded ${active ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:bg-[#1e293b]'}`}
                                >
                                  {active ? '✓ ' : ''}{cond}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Info: AC & Precise HP */}
                  <div className="flex items-center gap-6">
                    {/* AC Badge */}
                    <div className="flex items-center gap-2 bg-[#0a0d14] px-3 py-1.5 rounded-xl border border-cyan-900/50 shadow-inner">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <div>
                        <div className="text-[9px] font-bold text-cyan-500/70 uppercase leading-none">CA</div>
                        <div className="text-sm font-mono font-black text-cyan-300 leading-none">{c.ac}</div>
                      </div>
                    </div>

                    {/* Precise HP System */}
                    <div className="flex items-center gap-3">
                      <div className="w-36">
                        <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
                          <span className="text-rose-400 flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> HP:</span>
                          <span className="text-slate-200">{c.hp} / {c.maxHp}</span>
                        </div>
                        <div className="w-full h-2 bg-[#0a0d14] rounded-full overflow-hidden border border-[#2a3449]">
                          <div className={`h-full transition-all duration-300 ${hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 20 ? 'bg-amber-500' : 'bg-rose-600'}`} style={{ width: `${hpPercent}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center bg-[#0a0d14] rounded-lg border border-[#2a3449] overflow-hidden focus-within:border-amber-500/50">
                        <input 
                          type="number" 
                          value={hpInput[c.id] || ''} 
                          onChange={(e) => setHpInput(prev => ({...prev, [c.id]: e.target.value}))}
                          placeholder="Qtd" 
                          className="w-12 bg-transparent text-xs font-mono font-bold text-center text-slate-200 outline-none p-1.5 appearance-none"
                        />
                        <button onClick={() => handlePreciseHp(c.id, true)} className="px-2 py-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border-l border-[#2a3449] transition-colors" title="Causar Dano">
                          <Swords className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handlePreciseHp(c.id, false)} className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900 text-emerald-400 border-l border-[#2a3449] transition-colors" title="Curar Vida">
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className={`p-1.5 rounded-lg border transition-colors ${isExpanded ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#0f141d] border-[#2a3449] text-slate-400 hover:text-slate-200'}`} title="Ações e Rolagens">
                        <Dices className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Action Panel */}
                {isExpanded && (
                  <div className="mt-2 pt-3 border-t border-[#2a3449] grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    
                    {/* Saves & Skills */}
                    <div>
                      <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Rolagens (Salva-Guardas & Skills)</h5>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={() => rollDice(`${c.name} - Percepção`, getMod(c.wis))} className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[10px] font-semibold text-slate-300">
                          Percepção ({getMod(c.wis) >= 0 ? '+' : ''}{getMod(c.wis)})
                        </button>
                        <button onClick={() => rollDice(`${c.name} - Salva STR`, getMod(c.str))} className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[10px] font-semibold text-slate-300">
                          STR ({getMod(c.str) >= 0 ? '+' : ''}{getMod(c.str)})
                        </button>
                        <button onClick={() => rollDice(`${c.name} - Salva DEX`, getMod(c.dex))} className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[10px] font-semibold text-slate-300">
                          DEX ({getMod(c.dex) >= 0 ? '+' : ''}{getMod(c.dex)})
                        </button>
                        <button onClick={() => rollDice(`${c.name} - Salva CON`, getMod(c.con))} className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[10px] font-semibold text-slate-300">
                          CON ({getMod(c.con) >= 0 ? '+' : ''}{getMod(c.con)})
                        </button>
                        <button onClick={() => rollDice(`${c.name} - Salva WIS`, getMod(c.wis))} className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 rounded text-[10px] font-semibold text-slate-300">
                          WIS ({getMod(c.wis) >= 0 ? '+' : ''}{getMod(c.wis)})
                        </button>
                      </div>
                    </div>

                    {/* Attacks */}
                    <div>
                       <h5 className="text-[10px] font-bold text-rose-500/70 uppercase tracking-wider mb-2">Ações Ofensivas</h5>
                       {c.actions && c.actions.length > 0 ? (
                         <div className="space-y-1.5">
                           {c.actions.map(act => (
                             <div key={act.name} className="p-2 bg-[#0a0d14] border border-[#2a3449] rounded-lg">
                               <div className="flex justify-between items-start mb-1">
                                 <strong className="text-xs text-amber-300">{act.name}</strong>
                                 {/* Simple regex to find attack bonus for roll button */}
                                 {(() => {
                                    const match = act.desc.match(/\+([0-9]+)/);
                                    if (match) {
                                      const bonus = parseInt(match[1]);
                                      return (
                                        <button onClick={() => rollDice(`Ataque: ${act.name}`, bonus)} className="text-[9px] px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold">
                                          Rolar Atq +{bonus}
                                        </button>
                                      );
                                    }
                                    return null;
                                 })()}
                               </div>
                               <p className="text-[10px] text-slate-400 leading-snug">{act.desc}</p>
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-xs text-slate-500 italic">Nenhuma ação listada.</div>
                       )}
                    </div>
                  </div>
                )}
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
            <button key={m.id} onClick={() => handleAddPresetMonster(m)} className="px-2.5 py-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-300 transition-all flex items-center gap-1 flex-shrink-0">
              <Skull className="w-3 h-3 text-rose-400" />
              <span>+ {m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Add Combatant */}
      {showAddModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
             <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2"><Swords className="w-5 h-5 text-amber-400" /> Adicionar Combatente</h3>
             <form onSubmit={handleAddCombatant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome:</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">HP Máx:</label>
                  <input type="number" value={hp} onChange={(e) => setHp(Number(e.target.value))} className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">CA:</label>
                  <input type="number" value={ac} onChange={(e) => setAc(Number(e.target.value))} className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Init:</label>
                  <input type="number" value={init} onChange={(e) => setInit(Number(e.target.value))} className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
