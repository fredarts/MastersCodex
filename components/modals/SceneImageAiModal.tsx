'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  AlertCircle, 
  Image as ImageIcon, 
  Check, 
  RefreshCw, 
  Monitor, 
  Square, 
  Smartphone, 
  Sliders 
} from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';

interface SceneImageAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage: (imageUrl: string) => void;
  sceneTitle?: string;
  sensoryText?: string;
}

type AspectRatioOption = '16:9' | '1:1' | '9:16';

export const SceneImageAiModal: React.FC<SceneImageAiModalProps> = ({
  isOpen,
  onClose,
  onApplyImage,
  sceneTitle = '',
  sensoryText = '',
}) => {
  const { settings } = useUserSettings();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);

  // Auto-suggest prompt when opening modal
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setGeneratedImageBase64(null);

      // Pre-fill prompt with a curated description if empty
      if (!prompt) {
        if (sceneTitle && sensoryText) {
          const cleanSensory = sensoryText.slice(0, 180).replace(/\n/g, ' ');
          setPrompt(`${sceneTitle}, ${cleanSensory}. Pintura conceitual de fantasia épica para D&D 5e, iluminação dramática, alta resolução, arte de cenário de RPG.`);
        } else if (sceneTitle) {
          setPrompt(`Cenário de fantasia para RPG: ${sceneTitle}. Ilustração épica de alta qualidade, iluminação cinematográfica, atmosfera imersiva.`);
        } else {
          setPrompt('Taverna acolhedora e movimentada em uma cidade medieval de fantasia, lareira crepitante, aventureiros reunidos, canecas de hidromel, iluminação quente e acolhedora.');
        }
      }
    }
  }, [isOpen, sceneTitle, sensoryText]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, digite uma descrição para a imagem.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Priorizar Nano Banana 2 (gemini-3.1-flash-lite-image) se configurado ou padrão
      const activeImageModel = settings.imageModel || 'gemini-3.1-flash-lite-image';

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          userSettings: {
            ...settings,
            imageModel: activeImageModel,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar imagem com IA.');
      }

      if (data.base64) {
        const fullDataUrl = data.base64.startsWith('data:') 
          ? data.base64 
          : `data:image/jpeg;base64,${data.base64}`;
        setGeneratedImageBase64(fullDataUrl);
      } else if (data.url) {
        setGeneratedImageBase64(data.url);
      } else {
        throw new Error('Nenhuma imagem retornada pelos servidores de IA.');
      }
    } catch (err: any) {
      console.error('[SceneImageAiModal Error]:', err);
      setError(err.message || 'Ocorreu um erro ao gerar a imagem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedImageBase64) return;
    onApplyImage(generatedImageBase64);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in select-none">
      <div className="bg-[#101522] border-2 border-amber-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c182c] to-[#101522] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Gerador de Arte da Cena com IA</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                Nano Banana 2 • gemini-3.1-flash-lite-image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin flex-1">
          {error && (
            <div className="bg-rose-950/90 border border-rose-500/60 p-3.5 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs font-semibold shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Aspect Ratio Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Proporção da Imagem (Aspect Ratio)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9 (TV / Slides)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>1:1 (Quadrado)</span>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 (Vertical)</span>
              </button>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Descrição Visual da Cena (Prompt)
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError(null);
              }}
              disabled={isGenerating}
              placeholder="Ex: Taverna misteriosa iluminada por velas, com aventureiros encapuzados e um bardo tocando alaúde..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed disabled:opacity-50"
            />
          </div>

          {/* Quick Style Chips */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">
              Estilos Rápidos de Fantasia:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Arte Conceitual Sombria',
                'Iluminação Cinematográfica',
                'Masmorra Úmida e Gótica',
                'Floresta Élfica Encantada',
                'Fortaleza Sob Nevasca',
                'Templo Celestial Radiante',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setPrompt((prev) => `${prev.trim()}, ${chip}`)}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-400 hover:text-amber-300 transition-colors"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview if generated */}
          {generatedImageBase64 && (
            <div className="space-y-2 pt-2 border-t border-[#2a3449]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Arte Gerada com Sucesso:
              </span>
              <div className="relative w-full max-h-64 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-black flex items-center justify-center shadow-lg">
                <img
                  src={generatedImageBase64}
                  alt="Arte Gerada por IA"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#2a3449] bg-[#0c101a]">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Gerando com Nano Banana 2...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>{generatedImageBase64 ? 'Gerar Novamente' : 'Gerar Imagem'}</span>
                </>
              )}
            </button>

            {generatedImageBase64 && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Adicionar à Cena</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
