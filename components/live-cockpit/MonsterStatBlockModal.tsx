'use client';

import React, { useState } from 'react';
import { 
  X, 
  Minus, 
  Swords, 
  Shield, 
  Heart, 
  Dices, 
  Eye, 
  EyeOff, 
  Skull, 
  Plus, 
  ShieldAlert, 
  HeartCrack, 
  Flame, 
  BookOpen,
  Wand2,
  Sparkles,
  Edit3
} from 'lucide-react';
import { Combatant } from '@/lib/types';
import { INITIAL_MONSTERS } from '@/lib/srd-data';
import { DND5E_DAMAGE_TYPES } from '@/lib/dnd5e-damage-resolver';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { CreateMonsterModal } from '@/components/modals/CreateMonsterModal';

interface MonsterStatBlockModalProps {
  combatant: Combatant;
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onRoll: (title: string, bonus: number, isPrivate: boolean, desc?: string) => void;
  onUpdateCombatant: (updated: Combatant) => void;
}

export const MonsterStatBlockModal: React.FC<MonsterStatBlockModalProps> = ({
  combatant,
  isOpen,
  onClose,
  onMinimize,
  onRoll,
  onUpdateCombatant,
}) => {
  const { openSheet } = useLiveCockpit();
  const [isPrivate, setIsPrivate] = useState(true);
  const [hpInput, setHpInput] = useState('');
  const [showDefenseMenu, setShowDefenseMenu] = useState<'res' | 'imm' | 'vuln' | null>(null);
  const [showTuneModal, setShowTuneModal] = useState(false);

  if (!isOpen) return null;

  // Busca dados de fallback na SRD por nome limpo
  const cleanName = combatant.name.split('(')[0].trim().toLowerCase();
  const srd = INITIAL_MONSTERS.find((m) => m.name.toLowerCase() === cleanName);

  // Atributos consolidados (combatante ou fallback da SRD)
  const stats = {
    ac: combatant.ac ?? srd?.ac ?? 10,
    hp: combatant.hp,
    maxHp: combatant.maxHp,
    speed: combatant.speed || srd?.speed || '9m (30ft)',
    cr: combatant.cr ?? srd?.cr ?? '1/2',
    xp: srd?.xp ?? 100,
    type: srd?.type ?? 'Monstro',
    size: combatant.size || srd?.size || 'Médio',
    alignment: srd?.alignment ?? 'Neutro',
    str: combatant.str ?? srd?.str ?? 10,
    dex: combatant.dex ?? srd?.dex ?? 10,
    con: combatant.con ?? srd?.con ?? 10,
    int: combatant.int ?? srd?.int ?? 10,
    wis: combatant.wis ?? srd?.wis ?? 10,
    cha: combatant.cha ?? srd?.cha ?? 10,
    damageResistances: combatant.damageResistances || srd?.damageResistances || [],
    damageImmunities: combatant.damageImmunities || srd?.damageImmunities || [],
    damageVulnerabilities: combatant.damageVulnerabilities || srd?.damageVulnerabilities || [],
  };

  const getMod = (val: number) => Math.floor((val - 10) / 2);
  const formatMod = (val: number) => {
    const mod = getMod(val);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Toggle Resistências
  const handleToggleDefense = (type: 'damageResistances' | 'damageImmunities' | 'damageVulnerabilities', dmgName: string) => {
    const currentList = combatant[type] || [];
    const exists = currentList.some((x) => x.toLowerCase() === dmgName.toLowerCase());
    const nextList = exists
      ? currentList.filter((x) => x.toLowerCase() !== dmgName.toLowerCase())
      : [...currentList, dmgName];

    onUpdateCombatant({ ...combatant, [type]: nextList });
  };

  // Rolagem rápida de Atributos/Testes
  const handleAttrRoll = (name: string, value: number) => {
    const mod = getMod(value);
    onRoll(`Teste de ${name} (${combatant.name})`, mod, isPrivate);
  };

  // Gasto/Cura de PV
  const handleHpDelta = (amount: number) => {
    const nextHp = Math.max(0, Math.min(stats.maxHp, stats.hp + amount));
    onUpdateCombatant({ ...combatant, hp: nextHp });
  };

  const handleCustomHp = (isDamage: boolean) => {
    const amount = parseInt(hpInput, 10);
    if (isNaN(amount) || amount <= 0) return;
    handleHpDelta(isDamage ? -amount : amount);
    setHpInput('');
  };

  // Rolagem de Ações/Ataques
  const handleActionRoll = (actionName: string, desc: string) => {
    // Tenta encontrar o bônus de acerto na descrição (+X)
    const match = desc.match(/\+([0-9]+)/);
    const bonus = match ? parseInt(match[1], 10) : getMod(stats.dex);
    onRoll(`Ação: ${actionName} (${combatant.name})`, bonus, isPrivate, desc);
  };

  const abilities = combatant.abilities || srd?.abilities || [];
  const actions = combatant.actions || srd?.actions || [];

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#0f141d] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-[#161c28]/70 flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base text-slate-100 truncate">{combatant.name}</h3>
                <span className="px-1.5 py-0.2 rounded text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase">
                  {stats.size}
                </span>
                {combatant.baseMonsterName && (
                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                    Variante de {combatant.baseMonsterName}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 italic mt-0.5">
                {stats.type} • {stats.alignment}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Tunar Criatura / Salvar como Variante */}
              <button
                type="button"
                onClick={() => setShowTuneModal(true)}
                className="px-2.5 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 transition-all flex items-center gap-1.5 text-[10px] font-bold shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                title="Tunar atributos, ataques, PV e salvar como Variante permanente"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Tunar / Variante</span>
              </button>

              {/* Abrir Ficha Completa D&D 5e */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openSheet(combatant.id || combatant.name, 'pc', combatant.name, combatant.characterSheet || combatant);
                }}
                className="px-2 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all flex items-center gap-1.5 text-[10px] font-bold shadow-sm cursor-pointer"
                title="Abrir Ficha Completa D&D 5e"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Ficha</span>
              </button>

              {/* Toggle Rolagem Secreta */}
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                  isPrivate 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title={isPrivate ? 'Rolagem Invisível para os Jogadores' : 'Rolagem Pública no Chat'}
              >
                {isPrivate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={onMinimize}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Minimizar Ficha"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Fechar Ficha"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
            
            {/* Defesas e Vida */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#06b6d4]/5 border border-[#06b6d4]/20 p-2.5 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-[#06b6d4]">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase">Classe de Armadura</div>
                <div className="text-sm font-mono font-black text-slate-200">{stats.ac}</div>
              </div>

              <div className="bg-rose-500/5 border border-rose-500/20 p-2.5 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-rose-400">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase">Pontos de Vida</div>
                <div className="text-sm font-mono font-black text-slate-200">{stats.hp} / {stats.maxHp}</div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-xl text-center">
                <div className="flex justify-center mb-1 text-amber-400">
                  <Swords className="w-4 h-4" />
                </div>
                <div className="text-[8px] font-bold text-slate-500 uppercase">Deslocamento</div>
                <div className="text-[11px] font-black text-slate-200 truncate mt-0.5">{stats.speed}</div>
              </div>
            </div>

            {/* PV Control Panel */}
            <div className="bg-[#0a0d14]/40 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleHpDelta(-5)} 
                  className="px-2 py-1 bg-rose-950/30 hover:bg-rose-900 border border-rose-900/40 text-rose-400 font-bold text-xs rounded-lg cursor-pointer"
                >
                  -5
                </button>
                <button 
                  onClick={() => handleHpDelta(5)} 
                  className="px-2 py-1 bg-emerald-950/30 hover:bg-emerald-900 border border-emerald-900/40 text-emerald-400 font-bold text-xs rounded-lg cursor-pointer"
                >
                  +5
                </button>
              </div>

              <div className="flex items-center bg-[#0a0d14] rounded-lg border border-slate-800 overflow-hidden focus-within:border-amber-500/40">
                <input 
                  type="number"
                  value={hpInput}
                  onChange={(e) => setHpInput(e.target.value)}
                  placeholder="Valor"
                  className="w-16 bg-transparent text-xs font-mono font-bold text-center text-slate-200 outline-none p-1"
                />
                <button 
                  onClick={() => handleCustomHp(true)} 
                  className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-400 border-l border-slate-800 text-xs font-black transition-colors cursor-pointer"
                  title="Causar Dano"
                >
                  Dano
                </button>
                <button 
                  onClick={() => handleCustomHp(false)} 
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 border-l border-slate-800 text-xs font-black transition-colors cursor-pointer"
                  title="Cura"
                >
                  Cura
                </button>
              </div>
            </div>

            {/* Defesas & Imunidades Elementais */}
            <div className="bg-[#121824]/60 border border-slate-800/80 p-2.5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  Defesas Elementais (5e)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowDefenseMenu(showDefenseMenu === 'res' ? null : 'res')}
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 transition-colors cursor-pointer"
                  >
                    + Resistência
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDefenseMenu(showDefenseMenu === 'imm' ? null : 'imm')}
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-300 transition-colors cursor-pointer"
                  >
                    + Imunidade
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDefenseMenu(showDefenseMenu === 'vuln' ? null : 'vuln')}
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 transition-colors cursor-pointer"
                  >
                    + Vulnerabilidade
                  </button>
                </div>
              </div>

              {/* Menu seletor rápido de tipos de dano */}
              {showDefenseMenu && (
                <div className="p-2 bg-[#0d121c] border border-amber-500/30 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                  <div className="text-[9px] font-mono text-amber-300 font-bold uppercase">
                    Selecionar tipo de dano para {showDefenseMenu === 'res' ? 'Resistência' : showDefenseMenu === 'imm' ? 'Imunidade' : 'Vulnerabilidade'}:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DND5E_DAMAGE_TYPES.map((dt) => {
                      const currentTypeKey = showDefenseMenu === 'res'
                        ? 'damageResistances'
                        : showDefenseMenu === 'imm'
                        ? 'damageImmunities'
                        : 'damageVulnerabilities';
                      const isSelected = (combatant[currentTypeKey] || []).some(x => x.toLowerCase() === dt.labelPt.toLowerCase());

                      return (
                        <button
                          key={dt.id}
                          type="button"
                          onClick={() => handleToggleDefense(currentTypeKey, dt.labelPt)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {dt.labelPt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Badges de Defesas Ativas */}
              <div className="space-y-1">
                {stats.damageResistances.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">Resistências (50%):</span>
                    {stats.damageResistances.map((res: string) => (
                      <span
                        key={res}
                        onClick={() => handleToggleDefense('damageResistances', res)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 cursor-pointer hover:bg-rose-950 hover:border-rose-700 hover:text-rose-300 transition-colors"
                        title="Clique para remover"
                      >
                        {res} ×
                      </span>
                    ))}
                  </div>
                )}

                {stats.damageImmunities.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">Imunidades (0%):</span>
                    {stats.damageImmunities.map((imm: string) => (
                      <span
                        key={imm}
                        onClick={() => handleToggleDefense('damageImmunities', imm)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 cursor-pointer hover:bg-rose-950 hover:border-rose-700 hover:text-rose-300 transition-colors"
                        title="Clique para remover"
                      >
                        {imm} ×
                      </span>
                    ))}
                  </div>
                )}

                {stats.damageVulnerabilities.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-rose-400 uppercase">Vulnerabilidades (200%):</span>
                    {stats.damageVulnerabilities.map((vuln: string) => (
                      <span
                        key={vuln}
                        onClick={() => handleToggleDefense('damageVulnerabilities', vuln)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950/80 border border-rose-800/80 text-rose-300 cursor-pointer hover:bg-slate-900 hover:border-slate-700 hover:text-slate-300 transition-colors"
                        title="Clique para remover"
                      >
                        {vuln} ×
                      </span>
                    ))}
                  </div>
                )}

                {stats.damageResistances.length === 0 && stats.damageImmunities.length === 0 && stats.damageVulnerabilities.length === 0 && (
                  <div className="text-[10px] text-slate-500 italic">Nenhuma resistência ou imunidade cadastrada.</div>
                )}
              </div>
            </div>

            {/* Atributos Básicos Clicáveis */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Atributos (Clique para rolar)</h4>
              <div className="grid grid-cols-6 gap-1.5">
                {[
                  { label: 'FOR', val: stats.str },
                  { label: 'DES', val: stats.dex },
                  { label: 'CON', val: stats.con },
                  { label: 'INT', val: stats.int },
                  { label: 'SAB', val: stats.wis },
                  { label: 'CAR', val: stats.cha },
                ].map((attr) => (
                  <button
                    key={attr.label}
                    onClick={() => handleAttrRoll(attr.label, attr.val)}
                    className="bg-[#121824] border border-slate-800 hover:border-amber-500/50 p-1.5 rounded-xl text-center transition-all hover:scale-105 active:scale-95 flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-[9px] font-bold text-slate-400 leading-none">{attr.label}</span>
                    <span className="text-xs font-mono font-black text-slate-200 mt-1 leading-none">{attr.val}</span>
                    <span className="text-[9px] font-bold text-amber-400 font-mono mt-0.5 leading-none">
                      {formatMod(attr.val)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Habilidades Passivas / Características */}
            {abilities.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Características</h4>
                <div className="space-y-2">
                  {abilities.map((ab) => (
                    <div key={ab.name} className="p-2.5 bg-[#121824]/50 border border-slate-800/80 rounded-xl">
                      <div className="text-[11px] font-bold text-amber-300">{ab.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">{ab.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações e Ataques */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ações e Ataques (Clique para rolar)</h4>
              <div className="space-y-2">
                {actions.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic">Sem ações cadastradas.</div>
                ) : (
                  actions.map((act: any) => (
                    <button
                      key={act.name}
                      onClick={() => handleActionRoll(act.name, act.desc)}
                      className="w-full text-left p-2.5 bg-[#161c28]/40 border border-slate-800 hover:border-rose-500/30 rounded-xl flex items-start gap-2.5 transition-colors cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-950 transition-colors">
                        <Swords className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-slate-100 flex items-center justify-between gap-1.5">
                          <span>{act.name}</span>
                          <span className="text-[9px] font-mono text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Rolar Ataque ➔</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{act.desc}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-800 bg-[#0a0d14]/60 text-center flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>XP: {stats.xp}</span>
            <span>Nível de Desafio: {stats.cr}</span>
          </div>

        </div>
      </div>

      {/* Modal de Tunagem / Criação de Variante */}
      {showTuneModal && (
        <CreateMonsterModal
          isOpen={showTuneModal}
          onClose={() => setShowTuneModal(false)}
          activeCombatant={combatant}
          initialMonster={combatant}
          onMonsterCreated={() => {}}
          onUpdateCombatant={onUpdateCombatant}
        />
      )}
    </>
  );
};
