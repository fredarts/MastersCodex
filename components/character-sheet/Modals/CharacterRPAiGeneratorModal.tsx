'use client';

import React, { useState } from 'react';
import { X, Sparkles, Wand2, AlertCircle } from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { CharacterSheet } from '@/lib/types';

interface CharacterRPAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: Partial<CharacterSheet>) => void;
  sheet: CharacterSheet;
}

export const CharacterRPAiGeneratorModal: React.FC<CharacterRPAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  sheet,
}) => {
  const { settings } = useUserSettings();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-character-rp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          race: sheet.race,
          className: sheet.className,
          userSettings: settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar dados de RP.');
      }

      onApply({
        age: data.age || '',
        height: data.height || '',
        weight: data.weight || '',
        eyes: data.eyes || '',
        skin: data.skin || '',
        hair: data.hair || '',
        personalityTraits: data.personalityTraits || '',
        ideals: data.ideals || '',
        bonds: data.bonds || '',
        flaws: data.flaws || '',
        backstory: data.backstory || '',
        alliesAndOrganizations: data.alliesAndOrganizations || '',
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-fade-in select-none">
      <div className="bg-[#0f0e0d] border border-amber-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c140d] to-[#121722] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wand2 className="w-5 h-5 text-amber-450" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5 font-serif">Criador de Lore com IA</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                {sheet.characterName || 'Aventureiro Sem Nome'}
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

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed font-serif">
            Adicione uma breve descrição para a aparência física e a história do seu personagem, ou deixe em branco para a IA criar algo totalmente original baseado na raça <strong>({sheet.race || 'Nenhuma'})</strong> e classe <strong>({sheet.className || 'Nenhuma'})</strong>.
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
            placeholder="Ex: Quero um elfo ranger renegado que perdeu o olho esquerdo. Ele é muito cínico e tem medo de aranhas..."
            className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-4 text-sm text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed disabled:opacity-50 font-serif"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2a3449] bg-[#0f141d]">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-350 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer font-serif"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer font-serif"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Gerando Textos Mágicos...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Preencher Todos os Textos com IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
