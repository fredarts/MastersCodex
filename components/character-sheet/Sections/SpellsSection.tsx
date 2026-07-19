import React, { useState } from 'react';
import { AttributeKey, CharacterSheet, CharacterSpell } from '@/lib/types';
import { calculateSpellAttackBonus, calculateSpellDC, formatModifier, getAttributeModifier } from '@/lib/dnd5e-calculator';
import { Sparkles, BookOpen, Shield, Flame, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface SpellsSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const SpellsSection: React.FC<SpellsSectionProps> = ({ sheet, onChange }) => {
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0); // 0 = Cantrip

  const spellDC = calculateSpellDC(sheet);
  const spellAtkBonus = calculateSpellAttackBonus(sheet);

  const handleAddSpell = (level: number) => {
    const newSpell: CharacterSpell = {
      id: Date.now().toString(),
      name: level === 0 ? 'Novo Truque' : `Nova Magia Nível ${level}`,
      level,
      prepared: true,
      school: 'Evocação',
      castingTime: '1 Ação',
      range: '18m',
      description: '',
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

  const activeLevelSpells = sheet.spells.filter((s) => s.level === selectedSpellLevel);

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* CABEÇALHO DE MAGIA (CLASSE CONJURADORA, CD DO TR E BÔNUS DE ATAQUE) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Conjuração & Poder Mágico
        </h3>

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

      {/* SELETOR DE NÍVEIS DE MAGIA (TRUQUES ATÉ NIVEL 9) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Grimório & Magias Preparadas
          </h3>

          <button
            type="button"
            onClick={() => handleAddSpell(selectedSpellLevel)}
            className="flex items-center gap-1 text-[11px] font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-1 rounded-xl border border-purple-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {selectedSpellLevel === 0 ? 'Truque' : `Nível ${selectedSpellLevel}`}
          </button>
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
        {selectedSpellLevel > 0 && (
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

        {/* LISTA DE MAGIAS DO NÍVEL SELECIONADO */}
        <div className="space-y-2">
          {activeLevelSpells.length === 0 ? (
            <div className="p-6 text-center bg-[#0b0f19] border border-dashed border-slate-800 rounded-xl">
              <Flame className="w-8 h-8 text-purple-400/40 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Nenhuma magia adicionada neste nível.</p>
              <button
                type="button"
                onClick={() => handleAddSpell(selectedSpellLevel)}
                className="mt-2 text-xs font-bold text-purple-400 hover:underline"
              >
                + Adicionar {selectedSpellLevel === 0 ? 'Truque' : `Magia Nível ${selectedSpellLevel}`}
              </button>
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
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={spell.castingTime || '1 Ação'}
                    onChange={(e) =>
                      onChange({
                        ...sheet,
                        spells: sheet.spells.map((s) =>
                          s.id === spell.id ? { ...s, castingTime: e.target.value } : s
                        ),
                      })
                    }
                    placeholder="1 Ação"
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-400 text-center"
                  />
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
