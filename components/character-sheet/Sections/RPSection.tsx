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

  const [activeRPSubTab, setActiveRPSubTab] = useState<'visual' | 'lore'>('visual');

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden animate-fade-in select-none space-y-2">
      
      {/* SELETOR DE SUB-ABAS BG3 */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-400 font-serif">
            Interpretação, Aparência & Lore
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#090c14] border border-amber-500/30 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveRPSubTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold uppercase rounded-md transition-all cursor-pointer font-serif ${
                activeRPSubTab === 'visual'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Retrato & Físico
            </button>
            <button
              type="button"
              onClick={() => setActiveRPSubTab('lore')}
              className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold uppercase rounded-md transition-all cursor-pointer font-serif ${
                activeRPSubTab === 'lore'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              Psiquismo & História
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg font-black text-[10px] transition-colors shadow active:scale-95 cursor-pointer font-serif uppercase tracking-wider"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Preencher com IA
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-ABA 1: VISUAL & RETRATO + DETALHES FÍSICOS
          ======================================================== */}
      {activeRPSubTab === 'visual' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-hidden">
          {/* RETRATO DO PERSONAGEM */}
          <div className="bg3-panel rounded-xl p-3 flex flex-col h-full overflow-hidden justify-between space-y-2">
            <div className="flex items-center justify-between border-b border-amber-500/10 pb-1.5 shrink-0">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                Retrato de Corpo Inteiro
              </h3>
              <button
                type="button"
                onClick={generateImage}
                disabled={isGenerating}
                className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold text-[9px] transition-colors disabled:opacity-50 active:scale-95 cursor-pointer font-serif uppercase tracking-wider"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                {isGenerating ? 'Gerando...' : 'Gerar com IA'}
              </button>
            </div>

            <div className="flex gap-3 flex-1 min-h-0">
              <div className="relative w-44 bg-[#090c14] border border-slate-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {sheet.avatarUrl ? (
                  <img 
                    src={sheet.avatarUrl} 
                    alt="Visual" 
                    className="w-full h-full object-contain bg-slate-950 cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => setIsImageModalOpen(true)}
                  />
                ) : (
                  <span className="text-[9px] text-slate-500 text-center px-2 font-serif">
                    O retrato aparecerá aqui.<br/>Clique em "Gerar com IA".
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between space-y-1">
                <label className="text-[9px] font-bold text-slate-400 font-serif">Descrição para Gerador IA:</label>
                <textarea
                  value={sheet.appearanceDesc || ''}
                  onChange={(e) => onChange({ ...sheet, appearanceDesc: e.target.value })}
                  placeholder="Descreva roupas, cicatrizes, estilo de arma, armadura... A IA usará este texto como guia!"
                  className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 font-serif leading-relaxed resize-none"
                />
              </div>
            </div>
          </div>

          {/* CARACTERÍSTICAS FÍSICAS */}
          <div className="bg3-panel rounded-xl p-3 flex flex-col h-full overflow-hidden justify-between space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1.5 shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              Características Físicas & Medidas
            </h3>

            <div className="grid grid-cols-2 gap-2 flex-1 content-center">
              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 font-serif uppercase">Idade</label>
                <input
                  type="text"
                  value={sheet.age || ''}
                  onChange={(e) => onChange({ ...sheet, age: e.target.value })}
                  placeholder="Ex: 24 anos"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 font-serif uppercase">Altura</label>
                <input
                  type="text"
                  value={sheet.height || ''}
                  onChange={(e) => onChange({ ...sheet, height: e.target.value })}
                  placeholder="Ex: 1.80m"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 font-serif uppercase">Peso</label>
                <input
                  type="text"
                  value={sheet.weight || ''}
                  onChange={(e) => onChange({ ...sheet, weight: e.target.value })}
                  placeholder="Ex: 80kg"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 font-serif uppercase">Olhos</label>
                <input
                  type="text"
                  value={sheet.eyes || ''}
                  onChange={(e) => onChange({ ...sheet, eyes: e.target.value })}
                  placeholder="Ex: Castanhos"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 font-serif uppercase">Pele</label>
                <input
                  type="text"
                  value={sheet.skin || ''}
                  onChange={(e) => onChange({ ...sheet, skin: e.target.value })}
                  placeholder="Ex: Clara / Bronzeada"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[8px] text-slate-400 font-serif uppercase">Cabelos</label>
                <input
                  type="text"
                  value={sheet.hair || ''}
                  onChange={(e) => onChange({ ...sheet, hair: e.target.value })}
                  placeholder="Ex: Castanhos longos"
                  className="w-full bg-[#090c14] border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-ABA 2: PSIQUISMO & BIOGRAFIA COMPLETA
          ======================================================== */}
      {activeRPSubTab === 'lore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 flex-1 min-h-0 overflow-hidden">
          {/* COLUNA 1: PERSONALIDADE, IDEAIS, LIGAÇÕES E DEFEITOS */}
          <div className="bg3-panel rounded-xl p-2.5 flex flex-col h-full overflow-hidden justify-between space-y-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1 shrink-0">
              <Heart className="w-3.5 h-3.5 text-amber-400" />
              Psiquismo & Alinhamento
            </h3>

            <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
              <div className="flex flex-col space-y-0.5">
                <label className="text-[8.5px] font-bold text-amber-400/90 font-serif">Traços de Personalidade</label>
                <textarea
                  value={sheet.personalityTraits || ''}
                  onChange={(e) => onChange({ ...sheet, personalityTraits: e.target.value })}
                  className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 font-serif resize-none"
                />
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[8.5px] font-bold text-amber-400/90 font-serif">Ideais</label>
                <textarea
                  value={sheet.ideals || ''}
                  onChange={(e) => onChange({ ...sheet, ideals: e.target.value })}
                  className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 font-serif resize-none"
                />
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[8.5px] font-bold text-amber-400/90 font-serif">Ligações</label>
                <textarea
                  value={sheet.bonds || ''}
                  onChange={(e) => onChange({ ...sheet, bonds: e.target.value })}
                  className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 font-serif resize-none"
                />
              </div>

              <div className="flex flex-col space-y-0.5">
                <label className="text-[8.5px] font-bold text-amber-400/90 font-serif">Defeitos</label>
                <textarea
                  value={sheet.flaws || ''}
                  onChange={(e) => onChange({ ...sheet, flaws: e.target.value })}
                  className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded p-1.5 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 font-serif resize-none"
                />
              </div>
            </div>
          </div>

          {/* COLUNA 2: HISTÓRIA (BACKSTORY) & ALIADOS */}
          <div className="flex flex-col gap-2 h-full overflow-hidden justify-between">
            {/* HISTÓRIA */}
            <div className="bg3-panel rounded-xl p-2.5 space-y-1 flex-1 flex flex-col min-h-0 justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1 shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                História do Personagem (Biografia)
              </h3>
              <textarea
                value={sheet.backstory || ''}
                onChange={(e) => onChange({ ...sheet, backstory: e.target.value })}
                placeholder="Escreva a origem e os eventos marcantes da vida do seu aventureiro..."
                className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-serif resize-none"
              />
            </div>

            {/* ALIADOS & ORGANIZAÇÕES */}
            <div className="bg3-panel rounded-xl p-2.5 space-y-1 flex-1 flex flex-col min-h-0 justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-serif border-b border-amber-500/10 pb-1 shrink-0">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                Aliados & Organizações
              </h3>
              <textarea
                value={sheet.alliesAndOrganizations || ''}
                onChange={(e) => onChange({ ...sheet, alliesAndOrganizations: e.target.value })}
                placeholder="Guildas, ordens cavalheirescas, mentores, contatos..."
                className="w-full flex-1 bg-[#090c14] border border-slate-700/80 rounded-lg p-2 text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-serif resize-none"
              />
            </div>
          </div>
        </div>
      )}

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


