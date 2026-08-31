import React, { useState } from 'react';
import { AttributeKey, CharacterSheet, CharacterSpell } from '@/lib/types';
import { calculateSpellAttackBonus, calculateSpellDC, formatModifier, calculateSpellLimits, hasClass } from '@/lib/dnd5e-calculator';
import { Sparkles, BookOpen, Flame, Plus, Trash2, CheckCircle2, Wand2, Dices, Lock, Unlock } from 'lucide-react';
import { SpellCompendiumModal } from '../Modals/SpellCompendiumModal';
import { executeCheckRoll } from '@/lib/dnd5e-dice';

interface SpellsSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const SpellsSection: React.FC<SpellsSectionProps> = ({ sheet, onChange }) => {
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0); // 0 = Cantrip
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isUnlockedByDM, setIsUnlockedByDM] = useState(false);

  const spellDC = calculateSpellDC(sheet);
  const spellAtkBonus = calculateSpellAttackBonus(sheet);
  const { maxCantrips, maxSpells } = calculateSpellLimits(sheet);

  const currentCantrips = sheet.spells.filter((s) => s.level === 0 && !s.isBonus).length;
  const currentSpells = sheet.spells.filter((s) => s.level > 0 && !s.isBonus).length;

  const isAtCantripLimit = maxCantrips > 0 && currentCantrips >= maxCantrips;
  const isAtSpellLimit = maxSpells > 0 && currentSpells >= maxSpells;
  const isAtLimit = selectedSpellLevel === 0 ? isAtCantripLimit : isAtSpellLimit;
  const isAddLocked = isAtLimit && !isUnlockedByDM;

  const pactSlots = sheet.classResources?.['pact_slots'];
  const pactSlotLevel = sheet.classResources?.['pact_slot_level']?.current || 1;

  const handleAddSpell = (level: number, isBonus: boolean = false) => {
    const newSpell: CharacterSpell = {
      id: Date.now().toString(),
      name: level === 0 ? 'Novo Truque' : `Nova Magia Nível ${level}`,
      level,
      prepared: true,
      school: 'Evocação',
      castingTime: '1 Ação',
      range: '18m',
      description: '',
      isBonus,
    };
    onChange({ ...sheet, spells: [...sheet.spells, newSpell] });
  };

  const handleRemoveSpell = (id: string) => {
    onChange({ ...sheet, spells: sheet.spells.filter((s) => s.id !== id) });
  };

  const handleTogglePrepared = (id: string) => {
    onChange({
      ...sheet,
      spells: sheet.spells.map((s) => (s.id === id ? { ...s, prepared: !s.prepared } : s)),
    });
  };

  const handleUpdateSpellSlot = (level: number, usedDelta: number) => {
    const currentSlot = sheet.spellSlots[level] || { total: 0, used: 0 };
    const newUsed = Math.max(0, Math.min(currentSlot.total, currentSlot.used + usedDelta));
    onChange({
      ...sheet,
      spellSlots: {
        ...sheet.spellSlots,
        [level]: { ...currentSlot, used: newUsed },
      },
    });
  };

  const handleUpdatePactSlot = (delta: number) => {
    if (!pactSlots) return;
    const newCurrent = Math.max(0, Math.min(pactSlots.max, pactSlots.current + delta));
    onChange({
      ...sheet,
      classResources: {
        ...sheet.classResources,
        pact_slots: {
          ...pactSlots,
          current: newCurrent
        }
      }
    });
  };

  const handleCastSpell = (spell: CharacterSpell) => {
    // Gastar 1 slot de magia se não for truque (nível 0)
    if (spell.level > 0) {
      if (hasClass(sheet, 'Bruxo') && pactSlots && pactSlots.current > 0 && (sheet.spellSlots[spell.level]?.total || 0) === 0) {
        // Gasta slot do pacto
        const newCurrent = Math.max(0, pactSlots.current - 1);
        onChange({
          ...sheet,
          classResources: {
            ...sheet.classResources,
            pact_slots: {
              ...pactSlots,
              current: newCurrent
            }
          }
        });
      } else {
        // Gasta slot normal
        handleUpdateSpellSlot(spell.level, 1);
      }
    }

    executeCheckRoll({
      sheet,
      label: `${spell.name} (Magia Nív. ${spell.level})`,
      modifier: spellAtkBonus,
      rollType: 'attack',
    });
  };

  const activeLevelSpells = sheet.spells.filter((s) => s.level === selectedSpellLevel);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 flex-1 min-h-0 h-full overflow-hidden animate-fade-in select-none">
      {/* COMPÊNDIO MODAL */}
      <SpellCompendiumModal
        sheet={sheet}
        isOpen={isCompendiumOpen}
        onClose={() => setIsCompendiumOpen(false)}
        onAddSpell={(newSpell) => {
          onChange({ ...sheet, spells: [...sheet.spells, newSpell] });
        }}
        isAtCantripLimit={isAtCantripLimit}
        isAtSpellLimit={isAtSpellLimit}
      />

      {/* COLUNA ESQUERDA: PODER MÁGICO E ÍNDICE DE NÍVEIS */}
      <div className="flex flex-col gap-2 h-full overflow-hidden justify-between">
        
        {/* CABEÇALHO DE CONJURAÇÃO */}
        <div className="bg3-panel rounded-xl p-2.5 space-y-1.5 shrink-0">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Conjuração & Poder Mágico
          </h3>

          <div className="grid grid-cols-3 gap-1.5">
            {/* CLASSE & HABILIDADE CHAVE */}
            <div className="bg-[#090c14] border border-slate-800 rounded-lg p-1.5 space-y-0.5">
              <span className="text-[8px] font-bold text-slate-400 uppercase font-serif">Atributo Chave</span>
              <select
                value={sheet.spellcastingAbility || 'int'}
                onChange={(e) => onChange({ ...sheet, spellcastingAbility: e.target.value as AttributeKey })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[10px] font-bold text-amber-300 focus:outline-none"
              >
                <option value="int">INT (Mago)</option>
                <option value="wis">SAB (Clérigo/Druida)</option>
                <option value="cha">CAR (Bardo/Bruxo/Feit)</option>
              </select>
            </div>

            {/* CD DO TESTE DE RESISTÊNCIA DA MAGIA */}
            <div className="bg-[#090c14] border border-amber-500/20 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase font-serif">CD da Magia</span>
              <span className="text-base font-black text-amber-300 font-mono leading-none my-0.5">{spellDC}</span>
              <span className="text-[7.5px] text-slate-500 font-mono">8 + Prof + Mod</span>
            </div>

            {/* BÔNUS DE ATAQUE DE MAGIA */}
            <div className="bg-[#090c14] border border-amber-500/20 rounded-lg p-1.5 flex flex-col items-center justify-center text-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase font-serif">Ataque Mágico</span>
              <span className="text-base font-black text-amber-300 font-mono leading-none my-0.5">{formatModifier(spellAtkBonus)}</span>
              <span className="text-[7.5px] text-slate-500 font-mono">Prof + Mod</span>
            </div>
          </div>
        </div>

        {/* MAGIA DO PACTO (BRUXO) */}
        {hasClass(sheet, 'Bruxo') && pactSlots && (
          <div className="bg3-panel rounded-xl p-2 space-y-1 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-bold uppercase text-cyan-300 font-serif">Magia do Pacto</span>
              </div>
              <span className="text-[7.5px] font-bold bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-500/30 uppercase">
                Descanso Curto
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#090c14] border border-cyan-500/20 rounded-lg p-1.5">
              <span className="text-[9px] font-bold text-slate-300 font-serif">Espaços do Pacto ({pactSlotLevel}º Círculo)</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdatePactSlot(-1)}
                  className="w-5 h-5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold border border-rose-500/30 flex items-center justify-center text-[9px] cursor-pointer"
                >
                  -1
                </button>
                <span className="text-xs font-black text-cyan-400 font-mono px-1">
                  {pactSlots.current} / {pactSlots.max}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpdatePactSlot(1)}
                  className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold border border-emerald-500/30 flex items-center justify-center text-[9px] cursor-pointer"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLE DE ESPAÇOS DE MAGIA (SLOTS DO NÍVEL ATUAL) */}
        {selectedSpellLevel > 0 && (sheet.spellSlots[selectedSpellLevel]?.total || 0) > 0 && (
          <div className="bg3-panel rounded-xl p-2 flex items-center justify-between shrink-0">
            <div className="space-y-0.2">
              <span className="text-[9.5px] font-bold text-cyan-300 font-serif">
                Espaços de Magia ({selectedSpellLevel}º Círculo)
              </span>
              <p className="text-[8.5px] text-slate-400 font-mono">
                Usados: <span className="text-rose-400 font-bold">{sheet.spellSlots[selectedSpellLevel]?.used || 0}</span> / Totais: <span className="text-emerald-400 font-bold">{sheet.spellSlots[selectedSpellLevel]?.total || 0}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdateSpellSlot(selectedSpellLevel, -1)}
                className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/35 border border-emerald-500/30 flex items-center justify-center text-[9px] font-bold cursor-pointer"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleUpdateSpellSlot(selectedSpellLevel, 1)}
                className="w-5 h-5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/35 border border-rose-500/30 flex items-center justify-center text-[9px] font-bold cursor-pointer"
              >
                +1
              </button>
            </div>
          </div>
        )}

        {/* NAVEGAÇÃO DE CÍRCULOS (0 A 9) */}
        <div className="bg3-panel rounded-xl p-2 space-y-1 flex-1 flex flex-col justify-between min-h-0">
          <span className="text-[9px] font-bold uppercase text-slate-400 font-serif tracking-wider block border-b border-amber-500/10 pb-0.5 shrink-0">
            Círculos de Magia
          </span>
          <div className="grid grid-cols-5 gap-1 flex-1 min-h-0">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedSpellLevel(lvl)}
                className={`py-1 rounded-lg text-[9px] font-extrabold transition-all border cursor-pointer flex flex-col items-center justify-center ${
                  selectedSpellLevel === lvl
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-serif font-black shadow'
                    : 'bg-[#090c14] text-slate-400 border-slate-800 hover:border-slate-700 font-serif'
                }`}
              >
                <span>{lvl === 0 ? 'Truques' : `${lvl}º Círc.`}</span>
                {lvl > 0 && sheet.spellSlots[lvl]?.total ? (
                  <span className="text-[7.5px] opacity-75 font-mono">
                    {sheet.spellSlots[lvl].total - sheet.spellSlots[lvl].used}/{sheet.spellSlots[lvl].total}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* COLUNA DIREITA: GRID LIST DE MAGIAS */}
      <div className="bg3-panel rounded-xl p-2.5 flex flex-col h-full overflow-hidden justify-between">
        
        {/* HEADER COM LIMITES E BOTÃO ADICIONAR */}
        <div className="flex flex-col gap-1 border-b border-amber-500/10 pb-1.5 mb-1.5 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              {selectedSpellLevel === 0 ? 'Truques' : `Grimório • ${selectedSpellLevel}º Círculo`} ({activeLevelSpells.length})
            </h3>

            <div className="flex items-center gap-1.5">
              {isAtLimit && (
                <button
                  type="button"
                  onClick={() => setIsUnlockedByDM(!isUnlockedByDM)}
                  className={`p-1 rounded border transition-colors cursor-pointer ${
                    isUnlockedByDM
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-[#090c14] text-slate-500 border-slate-700'
                  }`}
                  title="Desbloquear Exceção (Mestre)"
                >
                  {isUnlockedByDM ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCompendiumOpen(true)}
                disabled={isAddLocked}
                className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  isAddLocked
                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-serif uppercase'
                }`}
              >
                <Wand2 className="w-3 h-3" />
                Compêndio
              </button>
            </div>
          </div>

          {/* LIMITS DISPLAY */}
          <div className="flex items-center gap-2 bg-[#090c14] px-2 py-0.2 rounded border border-slate-850 w-fit">
            <span className="text-[8px] text-slate-400 font-bold flex items-center gap-1 font-serif">
              Truques: <span className={isAtCantripLimit ? 'text-emerald-400' : 'text-slate-200'}>{currentCantrips}</span>/{maxCantrips || '-'}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-[8px] text-slate-400 font-bold flex items-center gap-1 font-serif">
              Magias: <span className={isAtSpellLimit ? 'text-emerald-400' : 'text-slate-200'}>{currentSpells}</span>/{maxSpells || '-'}
            </span>
          </div>
        </div>

        {/* LISTA DE MAGIAS DO NÍVEL SELECIONADO */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 bg3-scrollbar min-h-0">
          {activeLevelSpells.length === 0 ? (
            <div className="p-8 text-center bg-[#0b0f19]/60 border border-dashed border-slate-850 rounded-xl my-4">
              <Flame className="w-6 h-6 text-amber-550/30 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-serif">Nenhuma magia adicionada neste nível.</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsCompendiumOpen(true)}
                  disabled={isAddLocked}
                  className={`text-xs font-bold flex items-center gap-1 font-serif ${
                    isAddLocked
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-amber-400 hover:underline cursor-pointer'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Abrir Loja de Magias
                </button>
              </div>
            </div>
          ) : (
            activeLevelSpells.map((spell) => (
              <div
                key={spell.id}
                className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  {selectedSpellLevel > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTogglePrepared(spell.id)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        spell.prepared ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-600 bg-slate-900'
                      }`}
                      title={spell.prepared ? 'Magia Preparada' : 'Magia Não Preparada'}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    type="text"
                    value={spell.name}
                    onChange={(e) =>
                      onChange({
                        ...sheet,
                        spells: sheet.spells.map((s) => (s.id === spell.id ? { ...s, name: e.target.value } : s)),
                      })
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-white font-serif focus:outline-none"
                  />
                  {spell.isBonus && (
                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                      Bônus
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-850 pt-1.5">
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 font-serif">
                    <span>{spell.school}</span>
                    <span>•</span>
                    <span>{spell.range}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onChange({
                        ...sheet,
                        spells: sheet.spells.map((s) => (s.id === spell.id ? { ...s, isBonus: !s.isBonus } : s)),
                      })}
                      className={`p-1 rounded text-[10px] transition-colors shrink-0 cursor-pointer ${spell.isBonus ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-550 hover:text-amber-450'}`}
                      title="Marcar como Bônus"
                    >
                      ★
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCastSpell(spell)}
                      className="flex items-center gap-1 bg-amber-550/10 hover:bg-amber-550/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] font-black font-mono transition-all active:scale-95 cursor-pointer font-serif"
                      title="Conjurar Magia no Chat"
                    >
                      <Dices className="w-3 h-3 text-amber-400" />
                      Conjurar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpell(spell.id)}
                      className="p-1 text-slate-550 hover:text-rose-450 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
      </div>
    </div>
  );
};
