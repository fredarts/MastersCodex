import React from 'react';
import { CharacterSheet } from '@/lib/types';
import { BookOpen, UserCheck, Heart, Flag, Users } from 'lucide-react';

interface RPSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const RPSection: React.FC<RPSectionProps> = ({ sheet, onChange }) => {
  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* CARACTERÍSTICAS FÍSICAS */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-amber-400" />
          Aparência Física & Detalhes
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Idade</label>
            <input
              type="text"
              value={sheet.age || ''}
              onChange={(e) => onChange({ ...sheet, age: e.target.value })}
              placeholder="Ex: 24 anos"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Altura</label>
            <input
              type="text"
              value={sheet.height || ''}
              onChange={(e) => onChange({ ...sheet, height: e.target.value })}
              placeholder="Ex: 1.80m"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Peso</label>
            <input
              type="text"
              value={sheet.weight || ''}
              onChange={(e) => onChange({ ...sheet, weight: e.target.value })}
              placeholder="Ex: 80kg"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Olhos</label>
            <input
              type="text"
              value={sheet.eyes || ''}
              onChange={(e) => onChange({ ...sheet, eyes: e.target.value })}
              placeholder="Ex: Castanhos"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Pele</label>
            <input
              type="text"
              value={sheet.skin || ''}
              onChange={(e) => onChange({ ...sheet, skin: e.target.value })}
              placeholder="Ex: Moreno"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Cabelos</label>
            <input
              type="text"
              value={sheet.hair || ''}
              onChange={(e) => onChange({ ...sheet, hair: e.target.value })}
              placeholder="Ex: Pretos"
              className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* PERSONALIDADE, IDEAIS, LIGAÇÕES E DEFEITOS */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Heart className="w-4 h-4 text-amber-400" />
          Psiquismo & Roleplay
        </h3>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Traços de Personalidade</label>
            <textarea
              rows={2}
              value={sheet.personalityTraits}
              onChange={(e) => onChange({ ...sheet, personalityTraits: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Ideais</label>
            <textarea
              rows={2}
              value={sheet.ideals}
              onChange={(e) => onChange({ ...sheet, ideals: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Ligações</label>
            <textarea
              rows={2}
              value={sheet.bonds}
              onChange={(e) => onChange({ ...sheet, bonds: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Defeitos</label>
            <textarea
              rows={2}
              value={sheet.flaws}
              onChange={(e) => onChange({ ...sheet, flaws: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* HISTÓRIA DO PERSONAGEM (BACKSTORY) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          História do Personagem (Lore)
        </h3>
        <textarea
          rows={6}
          value={sheet.backstory || ''}
          onChange={(e) => onChange({ ...sheet, backstory: e.target.value })}
          placeholder="Escreva a origem e os eventos marcantes da vida do seu aventureiro..."
          className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
        />
      </div>

      {/* ALIADOS E ORGANIZAÇÕES */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          Aliados & Organizações
        </h3>
        <textarea
          rows={3}
          value={sheet.alliesAndOrganizations || ''}
          onChange={(e) => onChange({ ...sheet, alliesAndOrganizations: e.target.value })}
          placeholder="Contactos da guilda, ordens cavalheirescas, mentores..."
          className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
        />
      </div>
    </div>
  );
};
