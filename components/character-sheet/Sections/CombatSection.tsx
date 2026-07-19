import React from 'react';
import { AttributeKey, CharacterSheet, CharacterWeaponAttack } from '@/lib/types';
import { calculateModifier, formatModifier, getAttributeModifier } from '@/lib/dnd5e-calculator';
import { Shield, Heart, Zap, Crosshair, Plus, Trash2, Skull } from 'lucide-react';

interface CombatSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

const ATTRIBUTE_LABELS: Record<AttributeKey, { title: string; desc: string }> = {
  str: { title: 'Força', desc: 'Atletas, Corpo a Corpo' },
  dex: { title: 'Destreza', desc: 'Agilidade, Esquiva, Furtividade' },
  con: { title: 'Constituição', desc: 'Vitalidade, Vigor, Concentração' },
  int: { title: 'Inteligência', desc: 'Conhecimento, Magia Arcana' },
  wis: { title: 'Sabedoria', desc: 'Percepção, Intuição, Magia Divina' },
  cha: { title: 'Carisma', desc: 'Liderança, Persuasão, Presença' },
};

export const CombatSection: React.FC<CombatSectionProps> = ({ sheet, onChange }) => {
  const handleScoreChange = (attrKey: AttributeKey, newScore: number) => {
    const safeScore = Math.max(1, Math.min(30, newScore));
    const updatedAttr = { ...sheet.attributes[attrKey], score: safeScore };
    onChange({
      ...sheet,
      attributes: {
        ...sheet.attributes,
        [attrKey]: updatedAttr,
      },
    });
  };

  const handleAddAttack = () => {
    const newAttack: CharacterWeaponAttack = {
      id: Date.now().toString(),
      name: 'Nova Arma',
      atkBonus: '+4',
      damage: '1d6 + 2',
      type: 'Perfurante',
    };
    onChange({ ...sheet, attacks: [...sheet.attacks, newAttack] });
  };

  const handleRemoveAttack = (id: string) => {
    onChange({ ...sheet, attacks: sheet.attacks.filter((a) => a.id !== id) });
  };

  const handleUpdateAttack = (id: string, updated: Partial<CharacterWeaponAttack>) => {
    onChange({
      ...sheet,
      attacks: sheet.attacks.map((a) => (a.id === id ? { ...a, ...updated } : a)),
    });
  };

  const dexMod = getAttributeModifier(sheet, 'dex');

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* 6 ATRIBUTOS PRINCIPAIS GRID */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Atributos Principais
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((attrKey) => {
            const info = ATTRIBUTE_LABELS[attrKey];
            const score = sheet.attributes[attrKey].score;
            const mod = getAttributeModifier(sheet, attrKey);

            return (
              <div
                key={attrKey}
                className="bg-[#0b0f19] border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 flex flex-col items-center justify-between text-center shadow-inner relative transition-all"
              >
                <span className="text-[11px] font-extrabold uppercase text-slate-300">{info.title}</span>
                <span className="text-[9px] text-slate-500 line-clamp-1">{info.desc}</span>

                {/* MODIFICADOR EM DESTAQUE */}
                <div className="my-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1 w-full flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                    {formatModifier(mod)}
                  </span>
                </div>

                {/* INPUT DE VALOR BRUTO */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Valor:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={score}
                    onChange={(e) => handleScoreChange(attrKey, parseInt(e.target.value, 10) || 10)}
                    className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg py-0.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAINEL DE COMBATE (CA, INICIATIVA, DESLOCAMENTO, DADOS DE VIDA) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* CA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Shield className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Classe Armadura (CA)</span>
          <input
            type="number"
            value={sheet.armorClass}
            onChange={(e) => onChange({ ...sheet, armorClass: parseInt(e.target.value, 10) || 10 })}
            className="w-16 text-center bg-[#0b0f19] border border-amber-500/30 rounded-xl py-1 mt-1 text-xl font-black text-amber-300 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* INICIATIVA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Zap className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Iniciativa</span>
          <span className="text-xl font-black text-amber-300 mt-1 font-mono">
            {formatModifier(dexMod + sheet.initiativeBonus)}
          </span>
          <span className="text-[9px] text-slate-500">(DES {formatModifier(dexMod)})</span>
        </div>

        {/* DESLOCAMENTO */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Crosshair className="w-5 h-5 text-amber-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Deslocamento</span>
          <input
            type="text"
            value={sheet.speed}
            onChange={(e) => onChange({ ...sheet, speed: e.target.value })}
            className="w-full text-center bg-[#0b0f19] border border-slate-700 rounded-xl py-1 mt-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* DADOS DE VIDA */}
        <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-lg">
          <Heart className="w-5 h-5 text-rose-400 mb-1" />
          <span className="text-[10px] font-bold text-slate-400 uppercase">Dados de Vida</span>
          <span className="text-sm font-black text-rose-300 mt-1 font-mono">{sheet.hitDiceTotal}</span>
          <span className="text-[9px] text-slate-500">Usados: {sheet.hitDiceUsed}</span>
        </div>
      </div>

      {/* VITALIDADE & DANO (PONTOS DE VIDA) */}
      <div className="bg-[#141b2d] border border-rose-500/30 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400" />
            Pontos de Vida (PV)
          </h3>
          <span className="text-xs font-extrabold text-slate-300">
            {sheet.currentHp} / {sheet.maxHp} HP
          </span>
        </div>

        {/* BARRA DE PROGRESSO DE HP */}
        <div className="w-full bg-[#0b0f19] h-3 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-300 ${
              sheet.currentHp <= sheet.maxHp * 0.25
                ? 'bg-rose-600 animate-pulse'
                : sheet.currentHp <= sheet.maxHp * 0.5
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, (sheet.currentHp / (sheet.maxHp || 1)) * 100))}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">PV Atual</label>
            <input
              type="number"
              value={sheet.currentHp}
              onChange={(e) => onChange({ ...sheet, currentHp: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#0b0f19] border border-rose-500/40 rounded-xl py-2 text-center text-sm font-bold text-white focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">PV Máximo</label>
            <input
              type="number"
              value={sheet.maxHp}
              onChange={(e) => onChange({ ...sheet, maxHp: parseInt(e.target.value, 10) || 1 })}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl py-2 text-center text-sm font-bold text-slate-300 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">PV Temporário</label>
            <input
              type="number"
              value={sheet.tempHp}
              onChange={(e) => onChange({ ...sheet, tempHp: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#0b0f19] border border-amber-500/40 rounded-xl py-2 text-center text-sm font-bold text-amber-300 focus:outline-none"
            />
          </div>
        </div>

        {/* TESTES CONTRA A MORTE */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            Testes Contra a Morte (Death Saves)
          </span>

          <div className="grid grid-cols-2 gap-4">
            {/* SUCESSOS */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold">Sucessos:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...sheet,
                        deathSaves: {
                          ...sheet.deathSaves,
                          successes: sheet.deathSaves.successes === num ? num - 1 : num,
                        },
                      })
                    }
                    className={`w-5 h-5 rounded-full border transition-all ${
                      sheet.deathSaves.successes >= num
                        ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* FRACASSOS */}
            <div className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <span className="text-[10px] text-rose-400 font-semibold">Fracassos:</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...sheet,
                        deathSaves: {
                          ...sheet.deathSaves,
                          failures: sheet.deathSaves.failures === num ? num - 1 : num,
                        },
                      })
                    }
                    className={`w-5 h-5 rounded-full border transition-all ${
                      sheet.deathSaves.failures >= num
                        ? 'bg-rose-600 border-rose-500 shadow-sm shadow-rose-600/50'
                        : 'border-slate-700 bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ATAQUES E MAGIAS DA FICHA (PÁGINA 1) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-amber-400" />
            Ataques & Armas Rápidas
          </h3>
          <button
            type="button"
            onClick={handleAddAttack}
            className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1 rounded-xl border border-amber-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        </div>

        <div className="space-y-2">
          {sheet.attacks.map((atk) => (
            <div
              key={atk.id}
              className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={atk.name}
                onChange={(e) => handleUpdateAttack(atk.id, { name: e.target.value })}
                placeholder="Nome da Arma"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={atk.atkBonus}
                  onChange={(e) => handleUpdateAttack(atk.id, { atkBonus: e.target.value })}
                  placeholder="Bônus (+4)"
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-400 font-mono text-center font-bold"
                />
                <input
                  type="text"
                  value={atk.damage}
                  onChange={(e) => handleUpdateAttack(atk.id, { damage: e.target.value })}
                  placeholder="Dano (1d8+2)"
                  className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-300 font-mono text-center"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAttack(atk.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
