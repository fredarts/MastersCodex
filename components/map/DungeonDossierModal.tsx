'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Map as MapIcon, 
  Link2, 
  BookOpen, 
  Save, 
  Compass, 
  ShieldAlert, 
  Layers, 
  Flame, 
  Maximize2,
  Wand2,
  Loader2,
  Send,
  HelpCircle
} from 'lucide-react';
import { CampaignMap, MapLevel } from '@/lib/types';
import { SceneImageAiModal } from '@/components/modals/SceneImageAiModal';
import { toast } from 'sonner';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { useUserSettings } from '@/lib/hooks/useUserSettings';

export interface DungeonDossierData {
  title: string;
  description: string;
  difficultyTier: 'easy' | 'medium' | 'hard' | 'deadly';
  challengeRating: string;
  coverImageUrl: string;
}

interface DungeonDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  map: CampaignMap | null;
  levels?: MapLevel[];
  activeLevelBgUrl?: string | null;
  onSaveDossier: (dossierData: DungeonDossierData) => Promise<void> | void;
}

const DIFFICULTY_PRESETS = [
  { id: 'easy' as const, label: 'Iniciante', range: 'Nível 1 - 3', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  { id: 'medium' as const, label: 'Intermediário', range: 'Nível 4 - 6', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40' },
  { id: 'hard' as const, label: 'Perigoso', range: 'Nível 7 - 10', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  { id: 'deadly' as const, label: 'Mortal & Épico', range: 'Nível 11+', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' },
];

export const DungeonDossierModal: React.FC<DungeonDossierModalProps> = ({
  isOpen,
  onClose,
  map,
  levels = [],
  activeLevelBgUrl,
  onSaveDossier,
}) => {
  const { settings } = useUserSettings();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyTier, setDifficultyTier] = useState<'easy' | 'medium' | 'hard' | 'deadly'>('medium');
  const [challengeRating, setChallengeRating] = useState('Nível 4 - 6');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // AI & URL helpers
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const [directUrlValue, setDirectUrlValue] = useState('');

  // AI Lore Generation state
  const [isGeneratingLore, setIsGeneratingLore] = useState(false);
  const [showLorePromptModal, setShowLorePromptModal] = useState(false);
  const [loreUserIdea, setLoreUserIdea] = useState('');
  const [generatedCoverPrompt, setGeneratedCoverPrompt] = useState('');

  const prevOpenRef = useRef(false);
  const prevMapIdRef = useRef<string | null>(null);

  useEffect(() => {
    const isOpening = isOpen && !prevOpenRef.current;
    const isMapChanged = map?.id ? map.id !== prevMapIdRef.current : false;

    if (map && (isOpening || isMapChanged)) {
      const gridData = map.gridData || {};
      setTitle(map.title || '');
      setDescription(gridData.description || '');
      setDifficultyTier(gridData.difficultyTier || 'medium');
      setChallengeRating(gridData.challengeRating || 'Nível 4 - 6');
      setCoverImageUrl(gridData.coverImageUrl || gridData.levels?.[0]?.bgImageUrl || gridData.bgImageUrl || '');
    }

    prevOpenRef.current = isOpen;
    prevMapIdRef.current = map?.id || null;
  }, [isOpen, map?.id]);

  if (!isOpen || !map) return null;

  const mapLevelsCount = levels.length || map.gridData?.levels?.length || 1;
  const currentLevel = levels[0] || map.gridData?.levels?.[0];
  const mapGridScale = currentLevel?.gridScale || map.gridData?.gridScale || 40;
  const mapWallsCount = currentLevel?.vectorWalls?.length || map.gridData?.vectorWalls?.length || 0;
  const mapLightsCount = currentLevel?.lightSources?.length || map.gridData?.lightSources?.length || 0;

  const handleUseMapBackgroundAsCover = () => {
    const bg = activeLevelBgUrl || currentLevel?.bgImageUrl || map.gridData?.bgImageUrl;
    if (bg) {
      setCoverImageUrl(bg);
      toast.success('Imagem de fundo do mapa aplicada como capa!');
    } else {
      toast.error('Este mapa não possui imagem de fundo cadastrada.');
    }
  };

  const handleApplyAiCover = (imgUrl: string) => {
    setCoverImageUrl(imgUrl);
    toast.success('Capa gerada por IA aplicada ao dossier!');
  };

  const handleGenerateLoreWithAI = async (customIdea?: string) => {
    setIsGeneratingLore(true);
    try {
      const res = await fetch('/api/ai/generate-dungeon-lore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dungeonTitle: title.trim() || map?.title || 'Masmorra Antiga',
          challengeRating,
          difficultyTier,
          tacticalMetrics: {
            levelsCount: mapLevelsCount,
            wallsCount: mapWallsCount,
            lightsCount: mapLightsCount,
          },
          userIdeas: customIdea !== undefined ? customIdea : loreUserIdea,
          currentDescription: description.trim(),
          userSettings: settings,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar lore com IA');
      }

      const data = await res.json();
      const textToSet = data.description || data.lore || data.sensoryText || '';
      if (textToSet) {
        setDescription(textToSet);
      }
      if (data.title && (!title || title.toLowerCase().includes('sem título') || title.toLowerCase().includes('masmorra inicial'))) {
        setTitle(data.title);
      }
      if (data.slideCoverPrompt) {
        setGeneratedCoverPrompt(data.slideCoverPrompt);
      }
      toast.success('Lore e descrição da masmorra geradas com sucesso!');
      setShowLorePromptModal(false);
      setLoreUserIdea('');
    } catch (err: any) {
      console.error('Erro ao gerar lore:', err);
      toast.error('Não foi possível gerar a lore com IA no momento.');
    } finally {
      setIsGeneratingLore(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDossier({
        title: title.trim() || map.title,
        description: description.trim(),
        difficultyTier,
        challengeRating,
        coverImageUrl: coverImageUrl.trim(),
      });
      toast.success('Dossier da masmorra salvo com sucesso!');
      onClose();
    } catch (err) {
      console.error('Erro ao salvar dossier:', err);
      toast.error('Falha ao salvar dossier da masmorra.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#0f141d] border border-[#2a3449] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2a3449] flex items-center justify-between bg-[#131a26]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Dossier & Capa da Masmorra
              </h3>
              <p className="text-xs text-amber-400 font-mono">
                {title || map.title || 'Masmorra'} • Configuração narrativa e visual de exploração
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* COLUNA ESQUERDA: CAPA & MÉTRICAS */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <label className="text-[11px] font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-amber-400" />
              Capa Cinemática da Masmorra
            </label>

            {/* Container da Capa com Aspect Ratio */}
            <div className="relative w-full aspect-[16/10] bg-black/90 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl flex items-center justify-center group">
              {coverImageUrl ? (
                <img
                  src={normalizeImageUrl(coverImageUrl)}
                  alt="Capa da Masmorra"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="p-6 text-center text-slate-500 flex flex-col items-center gap-2">
                  <MapIcon className="w-10 h-10 opacity-30 text-amber-400" />
                  <p className="text-xs font-semibold">Nenhuma capa cadastrada</p>
                  <p className="text-[10px] text-slate-600">Gere com IA ou use o fundo do mapa abaixo</p>
                </div>
              )}

              {/* Vinheta escura no rodapé */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono font-bold text-amber-300">
                <span className="truncate">{title || 'Sem Título'}</span>
                <span className="bg-black/70 px-1.5 py-0.5 rounded border border-amber-500/30 text-[10px]">{challengeRating}</span>
              </div>
            </div>

            {/* Botões de Ação de Capa */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Gerar Capa com IA (Nano Banana 2)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUseMapBackgroundAsCover}
                  className="py-2 px-2 bg-[#161f30] hover:bg-[#202c44] border border-[#2a3449] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Usar Fundo do Mapa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDirectUrlInput(!showDirectUrlInput)}
                  className="py-2 px-2 bg-[#161f30] hover:bg-[#202c44] border border-[#2a3449] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Link de Imagem</span>
                </button>
              </div>

              {/* Input direto de link de imagem */}
              {showDirectUrlInput && (
                <div className="p-3 bg-[#0a0d14] border border-[#2a3449] rounded-xl space-y-2 animate-fade-in">
                  <input
                    type="text"
                    value={directUrlValue}
                    onChange={(e) => setDirectUrlValue(e.target.value)}
                    placeholder="https://exemplo.com/imagem_dungeon.jpg"
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDirectUrlInput(false)}
                      className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (directUrlValue.trim()) {
                          setCoverImageUrl(directUrlValue.trim());
                          setShowDirectUrlInput(false);
                          setDirectUrlValue('');
                          toast.success('Link de imagem aplicado!');
                        }
                      }}
                      className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Métricas Táticas */}
            <div className="p-3.5 bg-[#0a0d14] rounded-xl border border-[#2a3449] space-y-2 text-xs font-mono">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Métricas da Grade Tática:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Andares: <strong className="text-amber-300">{mapLevelsCount}</strong></div>
                <div>Grid Scale: <strong className="text-amber-300">{mapGridScale}px</strong></div>
                <div>Paredes Oclusão: <strong className="text-emerald-400">{mapWallsCount}</strong></div>
                <div>Fontes de Luz: <strong className="text-cyan-400">{mapLightsCount}</strong></div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIO DE LORE E IDENTIFICAÇÃO */}
          <div className="md:col-span-7 flex flex-col gap-4">
            
            {/* Título da Masmorra */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase font-mono">
                Título Oficial da Masmorra:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tumba do Guardião Quebrado, Cripta dos Lamentos..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold shadow-inner"
              />
            </div>

            {/* Nível de Desafio D&D 5e */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center justify-between">
                <span>Nível de Desafio & Faixa Recomendada:</span>
                <span className="text-amber-400 font-bold">{challengeRating}</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIFFICULTY_PRESETS.map((preset) => {
                  const isSelected = difficultyTier === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setDifficultyTier(preset.id);
                        setChallengeRating(preset.range);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? `${preset.color} ring-2 ring-amber-500/40 font-black shadow-md`
                          : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">{preset.label}</span>
                      <span className="text-[10px] font-mono opacity-80">{preset.range}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lore Narrativa / Rumores */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Lore, Rumores & Descrição Narrativa (Leitura do Mestre):
                </label>

                <button
                  type="button"
                  onClick={() => setShowLorePromptModal((prev) => !prev)}
                  disabled={isGeneratingLore}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-[11px] rounded-lg shadow flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
                  title="Gerar ou expandir a lore e descrição da masmorra com Inteligência Artificial"
                >
                  {isGeneratingLore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Escrevendo com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>{description ? 'Aprimorar Lore com IA' : 'Gerar Lore com IA'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Caixa de Ideia / Prompt Rápido para IA */}
              {showLorePromptModal && (
                <div className="p-3 bg-[#0a0d14] border border-amber-500/40 rounded-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Assistente de Escrita de Lore (IA)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLorePromptModal(false)}
                      className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    A IA criará parágrafos descritivos para leitura em voz alta e rumores de taverna para <strong>{title || map.title}</strong> ({challengeRating}).
                  </p>
                  <input
                    type="text"
                    value={loreUserIdea}
                    onChange={(e) => setLoreUserIdea(e.target.value)}
                    placeholder="Instrução adicional (opcional): ex: templo em ruínas inundado com armadilhas de lâminas..."
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isGeneratingLore) {
                        e.preventDefault();
                        handleGenerateLoreWithAI();
                      }
                    }}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowLorePromptModal(false)}
                      className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateLoreWithAI()}
                      disabled={isGeneratingLore}
                      className="px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                    >
                      {isGeneratingLore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Escrevendo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Gerar Texto com IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <textarea
                rows={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Escavada sob as raízes de uma árvore ancestral, esta catacumba guarda os ossos dos antigos sacerdotes. O ar é pesado com cheiro de mofo e cinzas frias. Os aventureiros escutam um leve som de correntes arrastando..."
                className="w-full flex-1 min-h-[160px] bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-2xl p-3.5 text-xs text-slate-200 leading-relaxed resize-none shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#2a3449] flex items-center justify-end gap-3 bg-[#131a26]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Dossier'}</span>
          </button>
        </div>
      </div>

      {/* MODAL DE GERAÇÃO DE CAPA COM IA */}
      <SceneImageAiModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyImage={(imgUrl) => handleApplyAiCover(imgUrl)}
        sceneTitle={`Entrada imponente da masmorra: ${title || map.title}`}
        sensoryText={generatedCoverPrompt || description || 'Entrada sombria de masmorra medieval de fantasia, arquitetura de pedra antiga, tochas acesas, névoa densa e atmosfera épica de exploração.'}
        defaultAspectRatio="16:9"
      />
    </div>
  );
};
