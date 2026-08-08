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
    <div className="space-y-6 pb-20 animate-fade-in select-none">
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

      {/* CABEÇALHO DE MAGIA (CLASSE CONJURADORA, CD DO TR E BÔNUS DE ATAQUE) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Conjuração & Poder Mágico
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CLASSE & HABILIDADE CHAVE */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Habilidade Chave</span>
            <select
              value={sheet.spellcastingAbility || 'int'}
              onChange={(e) => onChange({ ...sheet, spellcastingAbility: e.target.value as AttributeKey })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-amber-300 focus:outline-none"
            >
              <option value="int">Inteligência (INT)</option>
              <option value="wis">Sabedoria (SAB)</option>
              <option value="cha">Carisma (CAR)</option>
            </select>
          </div>

          {/* CD DO TESTE DE RESISTÊNCIA DA MAGIA */}
          <div className="bg-[#0b0f19] border border-purple-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">CD de TR da Magia</span>
            <span className="text-xl font-black text-purple-300 font-mono mt-0.5">{spellDC}</span>
            <span className="text-[9px] text-slate-500">(8 + Prof + Mod)</span>
          </div>

          {/* BÔNUS DE ATAQUE DE MAGIA */}
          <div className="bg-[#0b0f19] border border-purple-500/30 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Bônus Ataque Mágico</span>
            <span className="text-xl font-black text-purple-300 font-mono mt-0.5">{formatModifier(spellAtkBonus)}</span>
            <span className="text-[9px] text-slate-500">(Prof + Mod)</span>
          </div>
        </div>
      </div>

      {/* MAGIA DO PACTO (BRUXO) */}
      {hasClass(sheet, 'Bruxo') && pactSlots && (
        <div className="bg-[#141b2d] border border-purple-500/40 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/85 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Magia do Pacto (Warlock)</span>
            </div>
            <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
              Recupera em Descanso Curto 🩹
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#0b0f19] border border-purple-500/20 rounded-xl p-3">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-300 block">Slots do Pacto (Círculo Atual: {pactSlotLevel}º)</span>
              <p className="text-[10px] text-slate-400">
                Seus espaços de magia do pacto são todos de {pactSlotLevel}º círculo e recarregam com descanso curto.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleUpdatePactSlot(-1)}
                className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40 flex items-center justify-center text-sm cursor-pointer"
                title="Gastar slot do pacto"
              >
                -1
              </button>
              <span className="text-base font-black text-purple-400 font-mono w-12 text-center">
                {pactSlots.current} / {pactSlots.max}
              </span>
              <button
                type="button"
                onClick={() => handleUpdatePactSlot(1)}
                className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 flex items-center justify-center text-sm cursor-pointer"
                title="Recuperar slot do pacto"
              >
                +1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELETOR DE NÍVEIS DE MAGIA (TRUQUES ATÉ NIVEL 9) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Grimório & Magias
            </h3>
            
            {/* LIMITS DISPLAY */}
            <div className="flex items-center gap-2 bg-[#0b0f19] px-2.5 py-1 rounded-md border border-slate-700/80 shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                Truques: <span className={isAtCantripLimit ? 'text-emerald-400' : 'text-slate-200'}>{currentCantrips}</span>/{maxCantrips || '-'}
                {isAtCantripLimit && maxCantrips > 0 && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                Magias: <span className={isAtSpellLimit ? 'text-emerald-400' : 'text-slate-200'}>{currentSpells}</span>/{maxSpells || '-'}
                {isAtSpellLimit && maxSpells > 0 && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAtLimit && (
              <button
                type="button"
                onClick={() => setIsUnlockedByDM(!isUnlockedByDM)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isUnlockedByDM
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-[#0b0f19] text-slate-500 border-slate-700 hover:text-amber-400'
                }`}
                title="Desbloquear Exceção (Permissão do Mestre)"
              >
                {isUnlockedByDM ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCompendiumOpen(true)}
              disabled={isAddLocked}
              className={`flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all ${
                isAddLocked
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/40 shadow-lg shadow-purple-900/30 active:scale-95 cursor-pointer'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-200" />
              Adicionar Magias ao Grimório
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS DE NÍVEIS (0 A 9) */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedSpellLevel(lvl)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex flex-col items-center shrink-0 border ${
                selectedSpellLevel === lvl
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40'
                  : 'bg-[#0b0f19] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{lvl === 0 ? 'Truques' : `Nível ${lvl}`}</span>
            </button>
          ))}
        </div>

        {/* CONTROLE DE ESPAÇOS DE MAGIA (SLOTS USADOS / TOTAIS DO NÍVEL ATUAL) */}
        {selectedSpellLevel > 0 && (sheet.spellSlots[selectedSpellLevel]?.total || 0) > 0 && (
          <div className="bg-[#0b0f19] border border-purple-500/30 rounded-xl p-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-purple-300">
                Espaços de Magia (Nível {selectedSpellLevel})
              </span>
              <p className="text-[10px] text-slate-400">
                Usados:{' '}
                <span className="text-rose-400 font-bold font-mono">
                  {sheet.spellSlots[selectedSpellLevel]?.used || 0}
                </span>{' '}
                / Totais:{' '}
                <span className="text-emerald-400 font-bold font-mono">
                  {sheet.spellSlots[selectedSpellLevel]?.total || 0}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateSpellSlot(selectedSpellLevel, -1)}
                className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 flex items-center justify-center text-sm"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => handleUpdateSpellSlot(selectedSpellLevel, 1)}
                className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40 flex items-center justify-center text-sm"
              >
                +1
              </button>
            </div>
          </div>
        )}

        {/* MENSAGEM DO PACT SLOTS (BRUXO) */}
        {selectedSpellLevel > 0 && (sheet.spellSlots[selectedSpellLevel]?.total || 0) === 0 && hasClass(sheet, 'Bruxo') && (
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400 italic">
            {selectedSpellLevel <= 5 
              ? `Esta magia será conjurada usando um Espaço do Pacto (de ${pactSlotLevel}º círculo).`
              : `Esta magia será conjurada usando a característica Arcanum Místico (Nível ${selectedSpellLevel}).`}
          </div>
        )}

        {/* LISTA DE MAGIAS DO NÍVEL SELECIONADO */}
        <div className="space-y-2">
          {activeLevelSpells.length === 0 ? (
            <div className="p-6 text-center bg-[#0b0f19] border border-dashed border-slate-800 rounded-xl">
              <Flame className="w-8 h-8 text-purple-400/40 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Nenhuma magia adicionada neste nível.</p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsCompendiumOpen(true)}
                  disabled={isAddLocked}
                  className={`text-xs font-bold flex items-center gap-1 ${
                    isAddLocked
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-purple-400 hover:underline cursor-pointer'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Adicionar Magias ao Grimório
                </button>
              </div>
            </div>
          ) : (
            activeLevelSpells.map((spell) => (
              <div
                key={spell.id}
                className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 flex-1">
                  {selectedSpellLevel > 0 && (
                    <button
                      type="button"
                      onClick={() => handleTogglePrepared(spell.id)}
                      className={`p-1 rounded-lg transition-colors ${
                        spell.prepared ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-600 bg-slate-900'
                      }`}
                      title={spell.prepared ? 'Magia Preparada' : 'Magia Não Preparada'}
                    >
                      <CheckCircle2 className="w-5 h-5" />
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-purple-200"
                  />
                  {spell.isBonus && (
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                      Bônus
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({
                      ...sheet,
                      spells: sheet.spells.map((s) => (s.id === spell.id ? { ...s, isBonus: !s.isBonus } : s)),
                    })}
                    className={`p-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors shrink-0 ${spell.isBonus ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500 hover:text-amber-400'}`}
                    title="Marcar/Desmarcar como Magia Bônus (não conta no limite)"
                  >
                    ★
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCastSpell(spell)}
                    className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-xl text-xs font-black font-mono transition-all active:scale-95 cursor-pointer"
                    title="Lançar Magia no Chat"
                  >
                    <Dices className="w-3.5 h-3.5 text-purple-400" />
                    Lançar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveSpell(spell.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
