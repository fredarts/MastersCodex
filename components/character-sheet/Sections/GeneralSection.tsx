import React from 'react';
import { CharacterSheet } from '@/lib/types';
import { DND_ALIGNMENTS, DND_BACKGROUNDS, DND_CLASSES, DND_RACES } from '@/lib/dnd5e-data';
import { applyClassPreset, applyLevelChange, applyRacePreset } from '@/lib/dnd5e-calculator';
import { User, Shield, Sparkles, Award, Image as ImageIcon, Box, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { CHARACTER_MODELS_3D, getModelUrlByNameOrPath } from '@/lib/3d-models';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Model3DViewer } from '../Model3DViewer';

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

        <div className="space-y-2">
          <label className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            Avatar / Foto do Personagem
          </label>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={sheet.avatarUrl || ''}
              onChange={(e) => onChange({ ...sheet, avatarUrl: e.target.value })}
              placeholder="Cole a URL da imagem..."
              className="flex-1 bg-[#0b0f19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            />
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                disabled={!isSupabaseConfigured()}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const publicUrl = await storageService.uploadAsset(file, 'avatars');
                    onChange({ ...sheet, avatarUrl: publicUrl });
                  } catch (err: any) {
                    alert(err.message || 'Erro ao carregar avatar.');
                  }
                }}
                className="hidden"
                id="avatar-upload-input"
              />
              <label
                htmlFor="avatar-upload-input"
                className={`px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 h-full ${
                  !isSupabaseConfigured() ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-950'
                }`}
              >
                <span>Fazer Upload</span>
              </label>
            </div>
          </div>
          {!isSupabaseConfigured() && (
            <p className="text-[9px] text-rose-400 font-semibold mt-1">
              ⚠️ Supabase não configurado. Upload de avatar desabilitado.
            </p>
          )}
        </div>
      </div>

      {/* CARD: SELEÇÃO DE BONECO 3D (GRID DE BATALHA) */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Box className="w-4 h-4 text-sky-400" />
            Boneco 3D para o Grid de Batalha
          </h3>
          <span className="text-[10px] text-sky-400 font-mono bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 font-semibold uppercase">
            Hero Token
          </span>
        </div>

        {/* CONTROLES DE SELEÇÃO E PRÉ-VISUALIZAÇÃO 3D */}
        {(() => {
          const currentUrl = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className);
          const currentIndex = CHARACTER_MODELS_3D.findIndex((m) => m.modelUrl === currentUrl);
          const activeIndex = currentIndex >= 0 ? currentIndex : 0;
          const activeModel = CHARACTER_MODELS_3D[activeIndex] || CHARACTER_MODELS_3D[0];

          const handlePrev = () => {
            const newIndex = (activeIndex - 1 + CHARACTER_MODELS_3D.length) % CHARACTER_MODELS_3D.length;
            onChange({ ...sheet, modelUrl: CHARACTER_MODELS_3D[newIndex].modelUrl });
          };

          const handleNext = () => {
            const newIndex = (activeIndex + 1) % CHARACTER_MODELS_3D.length;
            onChange({ ...sheet, modelUrl: CHARACTER_MODELS_3D[newIndex].modelUrl });
          };

          return (
            <div className="space-y-3">
              {/* Dropdown com os nomes e setas de navegação */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  title="Modelo anterior"
                  className="p-2 bg-[#0b0f19] hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="relative flex-1">
                  <select
                    value={activeModel.modelUrl}
                    onChange={(e) => onChange({ ...sheet, modelUrl: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-amber-500/30 rounded-xl px-3 py-2 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none pr-8"
                  >
                    {CHARACTER_MODELS_3D.map((m) => (
                      <option key={m.id} value={m.modelUrl} className="bg-[#0b0f19] text-amber-200">
                        {m.icon ? `${m.icon} ` : ''}{m.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 text-xs">
                    ▼
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  title="Próximo modelo"
                  className="p-2 bg-[#0b0f19] hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 rounded-xl text-slate-300 hover:text-amber-400 transition-all shrink-0 active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Descrição curta do modelo ativo */}
              {activeModel.description && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="truncate">{activeModel.description}</span>
                  <span className="font-mono text-slate-500 shrink-0 ml-2">
                    {activeIndex + 1} de {CHARACTER_MODELS_3D.length}
                  </span>
                </div>
              )}

              {/* Pré-visualização 3D em tempo real */}
              <Model3DViewer modelUrl={activeModel.modelUrl} height={210} />
            </div>
          );
        })()}
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
