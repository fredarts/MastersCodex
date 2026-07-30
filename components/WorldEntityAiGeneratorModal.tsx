'use client';

import React, { useState } from 'react';
import { X, Sparkles, Wand2, AlertCircle } from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';

interface WorldEntityAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    name: string;
    subType: string;
    shortDesc: string;
    fullContent: string;
    extraAttr1: string;
    extraAttr2: string;
  }) => void;
  categoryContext: {
    categoryTitle: string;
    namePlaceholder: string;
    attr1Label: string;
    attr2Label: string;
  };
}

export const WorldEntityAiGeneratorModal: React.FC<WorldEntityAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  categoryContext,
}) => {
  const { settings } = useUserSettings();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, insira uma descrição da entidade.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          categoryTitle: categoryContext.categoryTitle,
          namePlaceholder: categoryContext.namePlaceholder,
          attr1Label: categoryContext.attr1Label,
          attr2Label: categoryContext.attr2Label,
          userSettings: settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar entidade.');
      }

      onApply({
        name: data.name || '',
        subType: data.subType || '',
        shortDesc: data.shortDesc || '',
        fullContent: data.fullContent || '',
        extraAttr1: data.extraAttr1 || '',
        extraAttr2: data.extraAttr2 || '',
      });
      
      setPrompt('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in select-none">
      <div className="bg-[#121722] border-2 border-purple-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1b1933] to-[#121722] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Criador de Entidade com IA</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-purple-400 font-mono">
                {categoryContext.categoryTitle}
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
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed font-serif">
            Descreva de forma livre como você imagina esta entidade. A IA vai preencher todo o formulário (nome, resumo, lore detalhada e atributos) baseando-se nas suas ideias.
          </p>

          {error && (
            <div className="bg-rose-950/90 border border-rose-500/60 p-3 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs font-semibold shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <textarea
            rows={6}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            disabled={isGenerating}
            placeholder="Ex: Quero um dragão ancião que não cospe fogo, mas sim um veneno cristalizado. Ele vive nas montanhas antigas e tem um culto de elfos corrompidos que o veneram..."
            className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-xl p-4 text-sm text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed disabled:opacity-50"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2a3449] bg-[#0f141d]">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Gerando (Pode levar uns segundos)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Preencher Formulário Mágicamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
