import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import { BookOpen, UserCheck, Heart, Flag, Users, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { ZoomableImageModal } from '@/components/ui/ZoomableImageModal';
import { CharacterRPAiGeneratorModal } from '../Modals/CharacterRPAiGeneratorModal';
import { useCustomDialog } from '@/context/CustomDialogContext';

interface RPSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const RPSection: React.FC<RPSectionProps> = ({ sheet, onChange }) => {
  const { showAlert } = useCustomDialog();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const { settings } = useUserSettings();

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const appearance = sheet.appearanceDesc || 'Um aventureiro heroico de fantasia.';
      const race = sheet.race || 'Humano';
      const className = sheet.className || 'Aventureiro';
      
      const prompt = `A highly detailed, full body concept art of a Dungeons and Dragons character. Race: ${race}, Class: ${className}. Appearance: ${sheet.age ? sheet.age + ' years old, ' : ''}${sheet.hair ? sheet.hair + ' hair, ' : ''}${sheet.eyes ? sheet.eyes + ' eyes, ' : ''}${sheet.skin ? sheet.skin + ' skin, ' : ''}${appearance}. White background, studio lighting, character concept art style, masterpiece, best quality, standing pose.`;

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar imagem.');

      const base64Data = data.base64;
      let finalUrl = `data:image/jpeg;base64,${base64Data}`;

      if (isSupabaseConfigured()) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'avatars');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Failed to upload image, falling back to base64', uploadErr);
        }
      }

      onChange({ ...sheet, avatarUrl: finalUrl });

    } catch (error: any) {
      showAlert({
        title: 'Erro de Geração',
        message: error.message || 'Erro ao gerar imagem.',
        variant: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in select-none">
      {/* IMAGEM E GERAÇÃO IA */}
      <div className="bg-[#141b2d] border border-amber-500/20 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            Visual do Personagem
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-slate-100 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-lg shadow-purple-500/20 active:scale-95"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Preencher com IA
            </button>
            <button
              type="button"
              onClick={generateImage}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors disabled:opacity-50 active:scale-95 shadow-md shadow-amber-500/20"
            >
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {isGenerating ? 'Gerando...' : 'Gerar Imagem IA'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-48 h-64 bg-[#0b0f19] border border-slate-700/80 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            {sheet.avatarUrl ? (
              <img 
                src={sheet.avatarUrl} 
                alt="Visual" 
                className="w-full h-full object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity" 
                onClick={() => setIsImageModalOpen(true)}
              />
            ) : (
              <span className="text-[10px] text-slate-500 text-center px-4">
                A imagem de corpo inteiro aparecerá aqui.<br/><br/>
                No painel geral, será focado no rosto.
              </span>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="text-[11px] text-slate-400">Descrição Visual para a IA (Opcional)</label>
            <textarea
              rows={4}
              value={sheet.appearanceDesc || ''}
              onChange={(e) => onChange({ ...sheet, appearanceDesc: e.target.value })}
              placeholder="Descreva roupas, cicatrizes, estilo de arma, armadura... A IA usará isso para gerar a imagem!"
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

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
              value={sheet.personalityTraits || ''}
              onChange={(e) => onChange({ ...sheet, personalityTraits: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Ideais</label>
            <textarea
              rows={2}
              value={sheet.ideals || ''}
              onChange={(e) => onChange({ ...sheet, ideals: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Ligações</label>
            <textarea
              rows={2}
              value={sheet.bonds || ''}
              onChange={(e) => onChange({ ...sheet, bonds: e.target.value })}
              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Defeitos</label>
            <textarea
              rows={2}
              value={sheet.flaws || ''}
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

      {/* MODAL DE IMAGEM */}
      <ZoomableImageModal 
        isOpen={isImageModalOpen} 
        onClose={() => setIsImageModalOpen(false)} 
        imageUrl={sheet.avatarUrl || ''} 
      />

      {/* MODAL DE GERAÇÃO DE LORE VIA IA */}
      <CharacterRPAiGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        sheet={sheet}
        onApply={(data) => {
          onChange({ ...sheet, ...data });
        }}
      />
    </div>
  );
};

