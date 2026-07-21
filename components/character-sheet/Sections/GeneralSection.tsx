import React from 'react';
import { CharacterSheet } from '@/lib/types';
import { DND_ALIGNMENTS, DND_BACKGROUNDS, DND_CLASSES, DND_RACES } from '@/lib/dnd5e-data';
import { applyClassPreset, applyLevelChange, applyRacePreset } from '@/lib/dnd5e-calculator';
import { User, Shield, Sparkles, Award, Image as ImageIcon, Box, Check } from 'lucide-react';
import { ALL_3D_MODELS, getModelUrlByNameOrPath } from '@/lib/3d-models';

interface GeneralSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({ sheet, onChange }) => {
  const handleRaceChange = (newRace: string) => {
    const updated = applyRacePreset(sheet, newRace);
    onChange(updated);
  };

  const handleClassChange = (newClass: string) => {
    const updated = applyClassPreset(sheet, newClass);
    onChange({
      ...updated,
      modelUrl: getModelUrlByNameOrPath(newClass),
    });
  };

  const handleLevelChange = (newLevel: number) => {
    const updated = applyLevelChange(sheet, newLevel);
    onChange(updated);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* CARD: FOTO E NOME DO PERSONAGEM */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative group w-20 h-20 rounded-2xl bg-[#0b0f19] border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {sheet.avatarUrl ? (
              <img src={sheet.avatarUrl} alt={sheet.characterName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-amber-500/50" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-[11px] font-semibold tracking-wider text-amber-400/80 uppercase">
              Nome do Personagem
            </label>
            <input
              type="text"
              value={sheet.characterName}
              onChange={(e) => onChange({ ...sheet, characterName: e.target.value })}
              placeholder="Ex: Thorin Escudo-de-Carvalho"
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            URL do Avatar / Foto (Opcional)
          </label>
          <input
            type="url"
            value={sheet.avatarUrl || ''}
            onChange={(e) => onChange({ ...sheet, avatarUrl: e.target.value })}
            placeholder="https://exemplo.com/minha-foto.png"
            className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* CARD: SELEÇÃO DE BONECO 3D (GRID DE BATALHA) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            Boneco 3D para o Grid de Batalha
          </h3>
          <span className="text-[10px] text-slate-400 font-mono bg-[#0b0f19] px-2 py-0.5 rounded border border-slate-800">
            Miniatura no Mapa
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Escolha o boneco 3D que representará seu personagem quando ele for colocado na arena de batalha:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_3D_MODELS.map((model) => {
            const currentSelected = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className);
            const isSelected = currentSelected === model.modelUrl;
            return (
              <button
                key={model.id}
                type="button"
                onClick={() => onChange({ ...sheet, modelUrl: model.modelUrl })}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-[#0b0f19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl shrink-0 ${
                  isSelected ? 'bg-amber-500/20 border-amber-500/50' : 'bg-slate-800/80 border-slate-700'
                }`}>
                  {model.icon || '🎲'}
                </div>
                <div className="flex-1 min-w-0 pr-5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{model.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase ${
                        model.category === 'character'
                          ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                      }`}
                    >
                      {model.category === 'character' ? 'Hero' : 'Monstro'}
                    </span>
                  </div>
                  {model.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{model.description}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 text-amber-400 bg-amber-500/20 p-0.5 rounded-full border border-amber-500/40">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CARD: RAÇA, CLASSE E NÍVEL (AUTO-COMPLETE) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Classe, Raça & Autocompletar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* RAÇA */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Raça</label>
            <select
              value={sheet.race}
              onChange={(e) => handleRaceChange(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-300 focus:outline-none focus:border-amber-500"
            >
              {Object.keys(DND_RACES).map((raceName) => (
                <option key={raceName} value={raceName}>
                  {raceName}
                </option>
              ))}
            </select>
          </div>

          {/* CLASSE */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Classe</label>
            <select
              value={sheet.className}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-amber-300 focus:outline-none focus:border-amber-500"
            >
              {Object.keys(DND_CLASSES).map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NÍVEL SLIDER / INPUT */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Nível do Personagem</span>
            <span className="text-sm font-black px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Nível {sheet.level}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={sheet.level}
            onChange={(e) => handleLevelChange(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Lvl 1 (+2 Prof)</span>
            <span>Lvl 5 (+3 Prof)</span>
            <span>Lvl 11 (+4 Prof)</span>
            <span>Lvl 20 (+6 Prof)</span>
          </div>
        </div>

        {/* SUBCLASSE & SUBRAÇA */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Subraça (Opcional)</label>
            <input
              type="text"
              value={sheet.subrace || ''}
              onChange={(e) => onChange({ ...sheet, subrace: e.target.value })}
              placeholder="Ex: Elfo da Floresta"
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Subclasse (Opcional)</label>
            <input
              type="text"
              value={sheet.subclass || ''}
              onChange={(e) => onChange({ ...sheet, subclass: e.target.value })}
              placeholder="Ex: Camargo / Campeão"
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* CARD: ANTECEDENTE, TENDÊNCIA E XP */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          Origem & Tendência
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Antecedente</label>
            <select
              value={sheet.background}
              onChange={(e) => onChange({ ...sheet, background: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {DND_BACKGROUNDS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Tendência</label>
            <select
              value={sheet.alignment}
              onChange={(e) => onChange({ ...sheet, alignment: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {DND_ALIGNMENTS.map((align) => (
                <option key={align} value={align}>
                  {align}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Pontos de Experiência (XP)</label>
            <input
              type="number"
              value={sheet.xp}
              onChange={(e) => onChange({ ...sheet, xp: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Nome do Jogador</label>
            <input
              type="text"
              value={sheet.playerName}
              onChange={(e) => onChange({ ...sheet, playerName: e.target.value })}
              placeholder="Seu nome"
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* INSPIRAÇÃO TOGGLE */}
        <div className="flex items-center justify-between bg-[#0b0f19] border border-slate-800 rounded-xl p-3 mt-2">
          <div className="flex items-center gap-2">
            <Award className={`w-5 h-5 ${sheet.inspiration ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <div>
              <p className="text-xs font-bold text-slate-200">Inspiração de Dungeon Master</p>
              <p className="text-[10px] text-slate-400">Concede Vantagem em uma rolagem à sua escolha</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...sheet, inspiration: !sheet.inspiration })}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-1 ${
              sheet.inspiration ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                sheet.inspiration ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
