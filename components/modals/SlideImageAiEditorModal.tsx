'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  Loader2, 
  Check, 
  RotateCcw, 
  Palette, 
  Image as ImageIcon, 
  AlertCircle,
  Maximize2,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';
import { RPG_IMAGE_STYLES, SLIDE_ASPECT_RATIO_OPTIONS } from '@/lib/constants/rpgArtStyles';
import { SlideAspectRatio } from '@/lib/types';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { normalizeImageUrl, isYouTubeUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface SlideImageAiEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImageUrl: string;
  slideTitle?: string;
  slideIndex?: number;
  initialAspectRatio?: SlideAspectRatio;
  onSaveModifiedImage: (newUrl: string, mode: 'replace' | 'add_new', newAspect?: SlideAspectRatio) => void;
}

const QUICK_PROMPT_PRESETS = [
  { label: '⛈️ Tempestade & Chuva', prompt: 'Mudar o clima para uma tempestade torrencial de chuva com relâmpagos cortando o céu escuro e reflexos molhados' },
  { label: '🌙 Noite com Tochas', prompt: 'Transformar a iluminação em noite profunda e enluarada, com tochas e fogueiras acesas emitindo luz quente e sombras dramáticas' },
  { label: '🌫️ Névoa Mística', prompt: 'Adicionar uma névoa espessa e etérea cobrindo o chão, com partículas mágicas brilhantes flutuando no ar' },
  { label: '🔥 Chamas & Batalha', prompt: 'Adicionar sinais de batalha recente, fumaça escura, brasas incandescentes e chamas ao redor' },
  { label: '❄️ Inverno & Neve', prompt: 'Cobrir o ambiente com neve densa, nevasca de gelo, estalactites congeladas e tons frios de azul e branco' },
  { label: '🌿 Ruínas & Musgo', prompt: 'Transformar a arquitetura em ruínas antigas e esquecidas cobertas por trepadeiras, raízes e musgo verdejante' },
  { label: '🔮 Portal Arcano', prompt: 'Abrir um vórtice ou portal de magia pura com runas arcanas brilhantes e energia cósmica no centro da cena' },
];

export const SlideImageAiEditorModal: React.FC<SlideImageAiEditorModalProps> = ({
  isOpen,
  onClose,
  sourceImageUrl,
  slideTitle = 'Slide',
  slideIndex = 0,
  initialAspectRatio = '16:9',
  onSaveModifiedImage,
}) => {
  const { settings } = useUserSettings();

  const [prompt, setPrompt] = useState('');
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('none');
  const [aspectRatio, setAspectRatio] = useState<SlideAspectRatio>(initialAspectRatio);
  const [saveMode, setSaveMode] = useState<'replace' | 'add_new'>('replace');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setSelectedArtStyle('none');
      setAspectRatio(initialAspectRatio || '16:9');
      setSaveMode('replace');
      setPreviewUrl(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialAspectRatio, sourceImageUrl]);

  if (!isOpen) return null;

  const getAspectStyle = (aspect: SlideAspectRatio): React.CSSProperties => {
    switch (aspect) {
      case '4:3':
        return { aspectRatio: '4 / 3' };
      case '1:1':
        return { aspectRatio: '1 / 1' };
      case '9:16':
        return { aspectRatio: '9 / 16' };
      case '16:9':
      default:
        return { aspectRatio: '16 / 9' };
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Por favor, informe quais alterações você deseja aplicar na imagem.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const activeImageModel = settings.imageModel || 'gemini-3.1-flash-lite-image';
      const chosenStyle = RPG_IMAGE_STYLES.find((s) => s.id === selectedArtStyle);
      const stylePromptPart = chosenStyle?.prompt ? `Art style & aesthetic: ${chosenStyle.prompt}.` : '';
      const noTextRule = 'No text, no typography, no letters, no words, no watermark, no signatures, no UI borders.';

      const fullPrompt = `Modify and transform this scene image. Required alterations and visual changes: ${prompt.trim()}. ${stylePromptPart} Maintain atmospheric fantasy RPG concept art aesthetic, cinematic lighting, 8k resolution, masterpiece. ${noTextRule}`;

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          sourceImage: sourceImageUrl,
          aspectRatio,
          userSettings: {
            ...settings,
            imageModel: activeImageModel,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Falha ao processar edição da imagem com IA.');
      }

      let finalUrl = '';
      if (data.base64) {
        finalUrl = data.base64.startsWith('data:') 
          ? data.base64 
          : `data:image/jpeg;base64,${data.base64}`;
      } else if (data.url) {
        finalUrl = data.url;
      } else {
        throw new Error('Nenhuma imagem retornada pelos servidores de IA.');
      }

      // Se o Supabase estiver configurado e a imagem for base64, salva no bucket 'scenes'
      if (isSupabaseConfigured() && finalUrl.startsWith('data:')) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], `scene-edit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'scenes');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Falha no upload para storage Supabase, mantendo base64:', uploadErr);
        }
      }

      setPreviewUrl(finalUrl);
      toast.success('Alteração visual gerada com sucesso pela IA!');
    } catch (err: any) {
      console.error('[SlideImageAiEditorModal Error]:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao gerar a imagem com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!previewUrl) return;
    onSaveModifiedImage(previewUrl, saveMode, aspectRatio);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in select-none">
      <div className="bg-[#0f141d] border-2 border-amber-500/50 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3449] bg-gradient-to-r from-[#1c182c] to-[#101522]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Editar Imagem do Slide com IA</span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  #{slideIndex + 1}
                </span>
              </h3>
              <p className="text-[11px] text-amber-400/90 font-mono">
                {slideTitle} • Transformação Image-to-Image por IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Mensagem de Erro se houver */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Comparativo de Imagens (Original vs Gerada) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0a0d14] p-3 rounded-2xl border border-[#2a3449]">
            {/* Arte Original */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-slate-500" />
                  Imagem Original
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  Referência Visual
                </span>
              </div>
              <div className="w-full h-48 sm:h-56 bg-black/90 rounded-xl border border-[#2a3449] overflow-hidden flex items-center justify-center p-1">
                <div style={getAspectStyle(aspectRatio)} className="h-full max-w-full w-auto relative flex items-center justify-center overflow-hidden rounded-lg bg-black">
                  {sourceImageUrl ? (
                    <img
                      src={normalizeImageUrl(sourceImageUrl)}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-600">Sem imagem</span>
                  )}
                </div>
              </div>
            </div>

            {/* Resultado Gerado */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Resultado com Alterações
                </span>
                {previewUrl && (
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    Gerado com Sucesso
                  </span>
                )}
              </div>
              <div className="w-full h-48 sm:h-56 bg-black/90 rounded-xl border border-amber-500/30 overflow-hidden flex items-center justify-center p-1 relative">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-2 text-amber-400 p-4 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <span className="text-xs font-bold font-mono">Processando transformação com IA...</span>
                    <span className="text-[10px] text-slate-500">Mantendo fidelidade e aplicando modificações</span>
                  </div>
                ) : previewUrl ? (
                  <div style={getAspectStyle(aspectRatio)} className="h-full max-w-full w-auto relative flex items-center justify-center overflow-hidden rounded-lg bg-black shadow-lg">
                    <img
                      src={normalizeImageUrl(previewUrl)}
                      alt="Resultado IA"
                      className="w-full h-full object-cover animate-fade-in"
                    />
                  </div>
                ) : (
                  <div className="text-center p-4 text-slate-500 flex flex-col items-center gap-1.5">
                    <Wand2 className="w-8 h-8 opacity-30 text-amber-400" />
                    <p className="text-xs font-semibold text-slate-400">Pronto para transformar</p>
                    <p className="text-[10px] text-slate-600">Descreva o que deseja mudar abaixo e clique em Gerar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Campo de Descrição das Alterações */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Quais alterações você deseja aplicar? *
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Mudar o clima para tempestade de raios, adicionar tochas acesas na entrada da caverna, transformar em ruínas antigas à noite..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors shadow-inner"
            />
          </div>

          {/* Sugestões Rápidas de Alteração */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Sugestões Rápidas de Clima & Ambiente:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt((prev) => prev ? `${prev}. ${preset.prompt}` : preset.prompt)}
                  className="px-2 py-1 rounded-lg bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/40 text-[10px] font-bold text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controles de Estilo Artístico & Proporção */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Seletor de Estilo Artístico */}
            <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#2a3449] space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Estilo Artístico RPG:
                </span>
              </div>
              <select
                value={selectedArtStyle}
                onChange={(e) => setSelectedArtStyle(e.target.value)}
                className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-none cursor-pointer shadow-inner"
              >
                {RPG_IMAGE_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-[#121824] text-slate-200">
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Proporção de Tela */}
            <div className="bg-[#0a0d14] p-3 rounded-xl border border-[#2a3449] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Proporção de Exibição (Aspect):
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {SLIDE_ASPECT_RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAspectRatio(opt.id)}
                    className={`py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      aspectRatio === opt.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow font-black'
                        : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modo de Salvamento */}
          <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#2a3449] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase font-mono tracking-wider">
              Ao aplicar a alteração:
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-amber-300 transition-colors">
                <input
                  type="radio"
                  name="slideSaveMode"
                  value="replace"
                  checked={saveMode === 'replace'}
                  onChange={() => setSaveMode('replace')}
                  className="accent-amber-500 cursor-pointer"
                />
                <span>Substituir imagem deste slide</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-amber-300 transition-colors">
                <input
                  type="radio"
                  name="slideSaveMode"
                  value="add_new"
                  checked={saveMode === 'add_new'}
                  onChange={() => setSaveMode('add_new')}
                  className="accent-amber-500 cursor-pointer"
                />
                <span>Adicionar como novo slide</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a3449] bg-[#0a0d14]">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-[#161c28] transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {previewUrl && (
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#2a3449] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tentar gerar novamente com outro resultado"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gerar Novamente</span>
              </button>
            )}

            {!previewUrl ? (
              <button
                type="button"
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Processando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Gerar Alteração com IA</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{saveMode === 'replace' ? 'Substituir Imagem do Slide' : 'Adicionar como Novo Slide'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
