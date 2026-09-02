'use client';

import React, { useState } from 'react';
import { X, Wand2, Sparkles, Palette, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { RPG_IMAGE_STYLES } from '@/lib/constants/rpgArtStyles';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface CharacterImageAiEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImageUrl: string;
  characterName: string;
  onSaveModifiedImage: (newUrl: string, mode: 'replace' | 'add_new') => void;
}

export const CharacterImageAiEditorModal: React.FC<CharacterImageAiEditorModalProps> = ({
  isOpen,
  onClose,
  sourceImageUrl,
  characterName,
  onSaveModifiedImage,
}) => {
  const { settings } = useUserSettings();
  const { showAlert } = useCustomDialog();

  const [prompt, setPrompt] = useState('');
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('classic_dnd');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '3:4' | '4:3' | '16:9'>('1:1');
  const [saveMode, setSaveMode] = useState<'replace' | 'add_new'>('add_new');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showAlert({
        title: 'Descreva a alteração',
        message: 'Por favor, informe quais detalhes ou mudanças visuais você deseja aplicar na imagem.',
        variant: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const chosenStyle = RPG_IMAGE_STYLES.find((s) => s.id === selectedArtStyle);
      const stylePrompt = chosenStyle?.prompt || 'masterpiece, best quality concept art';
      const fullPrompt = `Modify character artwork for "${characterName}". Visual changes to apply: ${prompt.trim()}. Style requirements: ${stylePrompt}. Maintain visual consistency with reference character. White clean background or atmospheric lighting.`;

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          sourceImage: sourceImageUrl,
          aspectRatio,
          style: selectedArtStyle,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao processar edição da imagem.');

      let finalUrl = `data:image/jpeg;base64,${data.base64}`;

      if (isSupabaseConfigured()) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], `char-edit-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'avatars');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Falha no upload para storage, usando base64:', uploadErr);
        }
      }

      setPreviewUrl(finalUrl);
    } catch (err: any) {
      showAlert({
        title: 'Erro na Edição por IA',
        message: err.message || 'Não foi possível gerar a modificação da imagem.',
        variant: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!previewUrl) return;
    onSaveModifiedImage(previewUrl, saveMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="bg-[#0b0f19] border-2 border-amber-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-amber-500/20 bg-[#101624]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-200 font-serif">
                Editar Imagem do Personagem com IA
              </h3>
              <p className="text-[11px] text-slate-400">
                Gere novas variações mantendo a identidade visual de {characterName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Images Comparison Area */}
          <div className="grid grid-cols-2 gap-3 bg-[#070a11] p-3 rounded-xl border border-slate-800">
            {/* Original Reference */}
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Imagem Original
              </span>
              <div className="aspect-square w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
                <img
                  src={sourceImageUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Generated Variation Preview */}
            <div className="space-y-1 text-center">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Resultado Gerado
              </span>
              <div className="aspect-square w-full rounded-lg overflow-hidden border border-amber-500/40 bg-slate-950 flex items-center justify-center relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Resultado"
                    className="w-full h-full object-contain animate-fade-in"
                  />
                ) : isGenerating ? (
                  <div className="flex flex-col items-center gap-2 text-amber-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-[10px] font-mono animate-pulse">Sintetizando...</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-serif px-2">
                    A variação gerada aparecerá aqui
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modification Prompt Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-serif">
              Quais alterações você deseja aplicar? *
            </label>
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: adicionar elmo com asas douradas, olhos brilhando em chamas arcanas, capa rasgada, pose de combate..."
              className="w-full bg-[#101624] border border-amber-500/30 focus:border-amber-400 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all resize-none shadow-inner font-sans"
            />
          </div>

          {/* Style and Aspect Ratio Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Style Selector */}
            <div className="bg-[#101624] p-2.5 rounded-xl border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-slate-300 font-serif uppercase tracking-wider">
                  Estilo RPG:
                </span>
              </div>
              <select
                value={selectedArtStyle}
                onChange={(e) => setSelectedArtStyle(e.target.value)}
                className="w-full bg-[#070a11] border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none cursor-pointer"
              >
                {RPG_IMAGE_STYLES.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="bg-[#101624] p-2.5 rounded-xl border border-amber-500/20 space-y-1">
              <span className="text-[11px] font-bold text-slate-300 font-serif uppercase tracking-wider block">
                Proporção:
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                {(
                  [
                    { id: '1:1', label: '1:1' },
                    { id: '9:16', label: '9:16' },
                    { id: '3:4', label: '3:4' },
                    { id: '4:3', label: '4:3' },
                    { id: '16:9', label: '16:9' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setAspectRatio(r.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      aspectRatio === r.id
                        ? 'bg-amber-500 text-slate-950 shadow font-black'
                        : 'bg-[#070a11] text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save Mode Choice */}
          {previewUrl && (
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-fade-in">
              <span className="text-xs font-bold text-amber-200 font-serif">
                Como deseja salvar o resultado?
              </span>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-medium">
                  <input
                    type="radio"
                    name="saveMode"
                    checked={saveMode === 'add_new'}
                    onChange={() => setSaveMode('add_new')}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span>Salvar ao Lado na Galeria</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 font-medium">
                  <input
                    type="radio"
                    name="saveMode"
                    checked={saveMode === 'replace'}
                    onChange={() => setSaveMode('replace')}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span>Substituir Original</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-amber-500/20 bg-[#101624]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1d273a] hover:bg-[#25324c] text-amber-300 border border-amber-500/30 disabled:opacity-50 transition-all font-serif uppercase tracking-wider"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gerar Alteração</span>
                </>
              )}
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all font-serif uppercase tracking-wider active:scale-95 cursor-pointer"
              >
                <span>Aplicar & Salvar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
