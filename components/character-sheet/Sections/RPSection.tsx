'use client';

import React, { useState } from 'react';
import { CharacterSheet } from '@/lib/types';
import {
  BookOpen,
  UserCheck,
  Heart,
  Wand2,
  Loader2,
  Image as ImageIcon,
  Palette,
  Target,
  Camera,
  Upload,
  Sparkles,
  Trash2,
  Check,
  Star,
  Plus,
  ZoomIn,
} from 'lucide-react';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { ZoomableImageModal } from '@/components/ui/ZoomableImageModal';
import { CharacterRPAiGeneratorModal } from '../Modals/CharacterRPAiGeneratorModal';
import { CharacterImageAiEditorModal } from '../Modals/CharacterImageAiEditorModal';
import { useCustomDialog } from '@/context/CustomDialogContext';
import { RPG_IMAGE_STYLES } from '@/lib/constants/rpgArtStyles';

interface RPSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const RPSection: React.FC<RPSectionProps> = ({ sheet, onChange }) => {
  const { showAlert } = useCustomDialog();
  const { settings } = useUserSettings();

  const [activeRPSubTab, setActiveRPSubTab] = useState<'visual' | 'lore'>('visual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isAiLoreModalOpen, setIsAiLoreModalOpen] = useState(false);

  // AI Generator options
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('classic_dnd');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '3:4' | '4:3' | '16:9'>('1:1');
  const [isCombatPinMode, setIsCombatPinMode] = useState(false);
  const [isPortraitMode, setIsPortraitMode] = useState(false);

  // Edit with AI modal
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  // Manual URL input
  const [manualUrl, setManualUrl] = useState('');

  // Extract or initialize images list
  const galleryImages: string[] = Array.isArray(sheet.images) && sheet.images.length > 0
    ? sheet.images
    : [sheet.avatarUrl, sheet.modelUrl].filter(Boolean) as string[];

  // Priorizar explicitamente faceImageUrl e combatImageUrl
  const activeAvatar = sheet.faceImageUrl || sheet.avatarUrl || (galleryImages.length > 0 ? galleryImages[0] : '');
  const activeCombatPin = sheet.combatImageUrl || sheet.modelUrl || (galleryImages.length > 1 ? galleryImages[1] : galleryImages[0] || '');

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const appearance = sheet.appearanceDesc || 'Um aventureiro heroico de fantasia.';
      const race = sheet.race || 'Humano';
      const className = sheet.className || 'Aventureiro';
      const chosenStyle = RPG_IMAGE_STYLES.find((s) => s.id === selectedArtStyle);
      const styleSuffix = chosenStyle?.prompt || 'masterpiece, best quality, character concept art';

      let promptModifiers = '';
      if (isCombatPinMode) {
        promptModifiers = 'Full body action combat stance, front view, standing on pure white clean background, full body shot from head to toe, suitable for tabletop RPG combat miniature token billboard.';
      } else if (isPortraitMode) {
        promptModifiers = 'Close-up face portrait, focused on face expression, eyes and facial features, tavern or atmospheric dark fantasy background lighting, RPG avatar portrait.';
      } else {
        promptModifiers = 'Full body character concept art, dynamic pose, high quality lighting.';
      }

      const prompt = `A highly detailed concept art of a Dungeons and Dragons character. Name: ${sheet.characterName}. Race: ${race}, Class: ${className}. Appearance: ${sheet.age ? sheet.age + ' years old, ' : ''}${sheet.hair ? sheet.hair + ' hair, ' : ''}${sheet.eyes ? sheet.eyes + ' eyes, ' : ''}${sheet.skin ? sheet.skin + ' skin, ' : ''}${appearance}. ${promptModifiers} ${styleSuffix}`;

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: isCombatPinMode || isPortraitMode ? '1:1' : aspectRatio,
          style: selectedArtStyle,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar imagem.');

      let finalUrl = `data:image/jpeg;base64,${data.base64}`;

      if (isSupabaseConfigured()) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], `char-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'avatars');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Falha no upload para storage, usando base64:', uploadErr);
        }
      }

      const nextImages = [...galleryImages.filter((img) => img !== finalUrl), finalUrl];
      const updatedSheet: CharacterSheet = {
        ...sheet,
        images: nextImages,
      };

      if (isCombatPinMode) {
        updatedSheet.modelUrl = finalUrl;
        updatedSheet.combatImageUrl = finalUrl;
      } else if (isPortraitMode) {
        updatedSheet.avatarUrl = finalUrl;
        updatedSheet.faceImageUrl = finalUrl;
        updatedSheet.portraitUrl = finalUrl;
      } else {
        if (!sheet.avatarUrl) {
          updatedSheet.avatarUrl = finalUrl;
          updatedSheet.faceImageUrl = finalUrl;
          updatedSheet.portraitUrl = finalUrl;
        }
        if (!sheet.modelUrl) {
          updatedSheet.modelUrl = finalUrl;
          updatedSheet.combatImageUrl = finalUrl;
        }
      }

      onChange(updatedSheet);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let finalUrl = '';
      if (isSupabaseConfigured()) {
        finalUrl = await storageService.uploadAsset(file, 'avatars');
      } else {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const nextImages = [...galleryImages.filter((img) => img !== finalUrl), finalUrl];
      const updatedSheet: CharacterSheet = {
        ...sheet,
        images: nextImages,
      };

      if (!sheet.avatarUrl) {
        updatedSheet.avatarUrl = finalUrl;
        updatedSheet.faceImageUrl = finalUrl;
      }
      if (!sheet.modelUrl) {
        updatedSheet.modelUrl = finalUrl;
        updatedSheet.combatImageUrl = finalUrl;
      }

      onChange(updatedSheet);
    } catch (err: any) {
      showAlert({
        title: 'Erro no Upload',
        message: err.message || 'Falha ao enviar arquivo de imagem.',
        variant: 'danger',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    const url = manualUrl.trim();
    const nextImages = [...galleryImages.filter((img) => img !== url), url];
    const updatedSheet: CharacterSheet = {
      ...sheet,
      images: nextImages,
    };
    if (!sheet.avatarUrl) {
      updatedSheet.avatarUrl = url;
      updatedSheet.faceImageUrl = url;
    }
    if (!sheet.modelUrl) {
      updatedSheet.modelUrl = url;
      updatedSheet.combatImageUrl = url;
    }

    onChange(updatedSheet);
    setManualUrl('');
  };

  const handleSetAsFace = (imgUrl: string) => {
    const updated: CharacterSheet = {
      ...sheet,
      avatarUrl: imgUrl,
      faceImageUrl: imgUrl,
      portraitUrl: imgUrl,
      images: galleryImages.includes(imgUrl) ? galleryImages : [imgUrl, ...galleryImages],
    };
    // Se esta imagem estava como combate e temos outra imagem na galeria, passa o combate para a outra
    if (sheet.combatImageUrl === imgUrl || sheet.modelUrl === imgUrl) {
      const otherImg = galleryImages.find((img) => img !== imgUrl);
      if (otherImg) {
        updated.modelUrl = otherImg;
        updated.combatImageUrl = otherImg;
      }
    }
    onChange(updated);
  };

  const handleSetAsCombat = (imgUrl: string) => {
    const updated: CharacterSheet = {
      ...sheet,
      modelUrl: imgUrl,
      combatImageUrl: imgUrl,
      images: galleryImages.includes(imgUrl) ? galleryImages : [imgUrl, ...galleryImages],
    };
    // Se esta imagem estava como retrato e temos outra imagem na galeria, passa o retrato para a outra
    if (sheet.faceImageUrl === imgUrl || sheet.avatarUrl === imgUrl || sheet.portraitUrl === imgUrl) {
      const otherImg = galleryImages.find((img) => img !== imgUrl);
      if (otherImg) {
        updated.avatarUrl = otherImg;
        updated.faceImageUrl = otherImg;
        updated.portraitUrl = otherImg;
      }
    }
    onChange(updated);
  };

  const handleDeleteImage = (imgUrl: string) => {
    const nextImages = galleryImages.filter((img) => img !== imgUrl);
    const updatedSheet: CharacterSheet = {
      ...sheet,
      images: nextImages,
    };
    if (sheet.avatarUrl === imgUrl || sheet.faceImageUrl === imgUrl || sheet.portraitUrl === imgUrl) {
      updatedSheet.avatarUrl = nextImages[0] || undefined;
      updatedSheet.faceImageUrl = nextImages[0] || undefined;
      updatedSheet.portraitUrl = nextImages[0] || undefined;
    }
    if (sheet.modelUrl === imgUrl || sheet.combatImageUrl === imgUrl) {
      updatedSheet.modelUrl = nextImages[1] || nextImages[0] || undefined;
      updatedSheet.combatImageUrl = nextImages[1] || nextImages[0] || undefined;
    }
    onChange(updatedSheet);
  };

  const handleSaveModifiedImage = (newUrl: string, mode: 'replace' | 'add_new') => {
    let nextImages: string[] = [];
    if (mode === 'replace' && editingImageUrl) {
      nextImages = galleryImages.map((img) => (img === editingImageUrl ? newUrl : img));
    } else {
      nextImages = [...galleryImages, newUrl];
    }

    const updatedSheet: CharacterSheet = {
      ...sheet,
      images: nextImages,
    };

    if (editingImageUrl === sheet.avatarUrl || (!sheet.avatarUrl && mode === 'add_new')) {
      updatedSheet.avatarUrl = newUrl;
      updatedSheet.faceImageUrl = newUrl;
      updatedSheet.portraitUrl = newUrl;
    }
    if (editingImageUrl === sheet.modelUrl) {
      updatedSheet.modelUrl = newUrl;
      updatedSheet.combatImageUrl = newUrl;
    }

    onChange(updatedSheet);
  };

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
              Retrato & Galeria
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
            onClick={() => setIsAiLoreModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1 rounded-lg font-black text-[10px] transition-colors shadow active:scale-95 cursor-pointer font-serif uppercase tracking-wider"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Preencher com IA
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-ABA 1: VISUAL, GALERIA & DETALHES FÍSICOS
          ======================================================== */}
      {activeRPSubTab === 'visual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
          {/* COLUNA ESQUERDA (7 COLS): GERADOR DE IA + GALERIA DE IMAGENS */}
          <div className="lg:col-span-7 bg3-panel rounded-xl p-3 flex flex-col h-full overflow-hidden space-y-2.5">
            {/* Header com botões de Upload e URL */}
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-serif">
                  Galeria Visual do Personagem ({galleryImages.length})
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <label className="flex items-center gap-1 px-2.5 py-1 bg-[#101624] hover:bg-[#162033] border border-amber-500/30 rounded-lg text-[9px] font-bold text-amber-300 cursor-pointer transition-colors font-serif uppercase">
                  <Upload className={`w-3 h-3 ${isUploading ? 'animate-bounce' : ''}`} />
                  <span>{isUploading ? 'Enviando...' : 'Upload'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
            </div>

            {/* Painel de Geração com IA Compacto */}
            <div className="bg-[#090d16] border border-amber-500/20 rounded-xl p-2.5 space-y-2 shrink-0">
              {/* Controles de Estilo, Proporção e Presets Rápidos */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {/* Estilo Dropdown */}
                <div className="flex items-center gap-1 bg-[#101624] px-2 py-0.5 rounded-lg border border-slate-800">
                  <Palette className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Estilo:</span>
                  <select
                    value={selectedArtStyle}
                    onChange={(e) => setSelectedArtStyle(e.target.value)}
                    className="bg-transparent text-[9.5px] text-amber-200 font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    {RPG_IMAGE_STYLES.map((style) => (
                      <option key={style.id} value={style.id} className="bg-[#0b0f19] text-slate-200">
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratios */}
                <div className="flex items-center gap-1 bg-[#101624] px-1.5 py-0.5 rounded-lg border border-slate-800">
                  {(['1:1', '9:16', '3:4', '16:9'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setAspectRatio(r);
                        setIsCombatPinMode(false);
                        setIsPortraitMode(false);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                        aspectRatio === r && !isCombatPinMode && !isPortraitMode
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Presets Rápidos: Pino de Combate & Rosto */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCombatPinMode(!isCombatPinMode);
                      setIsPortraitMode(false);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-serif font-bold transition-all flex items-center gap-1 border ${
                      isCombatPinMode
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow ring-1 ring-emerald-400'
                        : 'bg-[#101624] text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/40'
                    }`}
                    title="Gera o personagem em pose de combate com fundo branco para uso como pino 3D"
                  >
                    <Target className="w-2.5 h-2.5" />
                    Pino de Combate
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPortraitMode(!isPortraitMode);
                      setIsCombatPinMode(false);
                    }}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-serif font-bold transition-all flex items-center gap-1 border ${
                      isPortraitMode
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow ring-1 ring-cyan-400'
                        : 'bg-[#101624] text-cyan-300 border-cyan-500/30 hover:bg-cyan-950/40'
                    }`}
                    title="Gera close-up focado no retrato do personagem para avatar, ficha e HUD"
                  >
                    <Camera className="w-2.5 h-2.5" />
                    Retrato
                  </button>
                </div>
              </div>

              {/* Caixa de Texto Reduzida (2 linhas) + Botão de Geração */}
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={sheet.appearanceDesc || ''}
                  onChange={(e) => onChange({ ...sheet, appearanceDesc: e.target.value })}
                  placeholder="Descreva traços, armadura, vestes, armas e atmosfera visual..."
                  className="flex-1 bg-[#06080e] border border-amber-500/30 focus:border-amber-400 rounded-lg p-1.5 text-[10px] text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-serif leading-relaxed"
                />

                <button
                  type="button"
                  onClick={generateImage}
                  disabled={isGenerating}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-[10px] rounded-lg transition-all shadow active:scale-95 flex flex-col items-center justify-center gap-1 font-serif uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Gerar com IA</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Input Manual de URL */}
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Adicionar imagem via URL (https://...)"
                className="flex-1 bg-[#06080e] border border-slate-800 focus:border-amber-500/50 rounded-lg px-2.5 py-1 text-[10px] text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddManualUrl}
                disabled={!manualUrl.trim()}
                className="px-2.5 py-1 bg-[#101624] hover:bg-[#162033] border border-amber-500/30 text-amber-300 font-bold text-[9px] rounded-lg disabled:opacity-40 font-serif uppercase"
              >
                + URL
              </button>
            </div>

            {/* GALERIA DE MINIATURAS (GRID) */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-amber-500/10 rounded-xl p-2 bg-[#06080e]/60 space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Miniaturas ({galleryImages.length})
                </span>
                <span className="text-[8.5px] font-mono text-amber-400/80">
                  ⭐ Principal • 🎯 Combate • 👤 Rosto • ✨ Editar com IA
                </span>
              </div>

              {galleryImages.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-500 text-center p-3 border border-dashed border-slate-800 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-slate-600 mb-1" />
                  <span className="text-[10px] font-serif">Nenhuma imagem na galeria deste personagem.</span>
                  <span className="text-[8.5px] text-slate-600">Gere com IA acima ou faça upload de um arquivo.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {galleryImages.map((imgUrl, idx) => {
                    const isFace = activeAvatar === imgUrl;
                    const isCombat = activeCombatPin === imgUrl;
                    const isPrimary = idx === 0;

                    return (
                      <div
                        key={`img-${idx}-${imgUrl.slice(-10)}`}
                        className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-[#090c14] shadow ${
                          isFace && isCombat
                            ? 'border-amber-400 ring-1 ring-amber-400'
                            : isFace
                            ? 'border-cyan-400 ring-1 ring-cyan-400'
                            : isCombat
                            ? 'border-emerald-400 ring-1 ring-emerald-400'
                            : 'border-slate-800 hover:border-amber-500/60'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Galeria ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => {
                            setModalImageUrl(imgUrl);
                            setIsImageModalOpen(true);
                          }}
                        />

                        {/* Badges de Finalidade */}
                        <div className="absolute top-1 left-1 flex flex-col gap-0.5 pointer-events-none z-10">
                          {isFace && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-cyan-500/90 text-slate-950 font-black text-[7.5px] rounded font-mono uppercase shadow">
                              👤 Rosto
                            </span>
                          )}
                          {isCombat && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/90 text-slate-950 font-black text-[7.5px] rounded font-mono uppercase shadow">
                              🎯 Combate
                            </span>
                          )}
                          {!isFace && !isCombat && isPrimary && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/90 text-slate-950 font-black text-[7.5px] rounded font-mono uppercase shadow">
                              ⭐ Capa
                            </span>
                          )}
                        </div>

                        {/* Hover Overlay com Ações */}
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-[1px] z-20">
                          <div className="flex items-center gap-1">
                            {/* Definir como Retrato */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsFace(imgUrl);
                              }}
                              className={`px-1.5 py-1 rounded text-[8px] font-bold font-serif transition-colors flex items-center gap-0.5 cursor-pointer ${
                                isFace
                                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                                  : 'bg-cyan-950/90 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40'
                              }`}
                              title="Definir como Retrato do Personagem (Avatar/HUD/Party)"
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>Retrato</span>
                            </button>

                            {/* Definir como Combate */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsCombat(imgUrl);
                              }}
                              className={`px-1.5 py-1 rounded text-[8px] font-bold font-serif transition-colors flex items-center gap-0.5 cursor-pointer ${
                                isCombat
                                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                                  : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40'
                              }`}
                              title="Definir como Pino/Token no Grid de Combate 3D"
                            >
                              <Target className="w-2.5 h-2.5" />
                              <span>Combate</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1 mt-0.5">
                            {/* Zoom & Pan */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalImageUrl(imgUrl);
                                setIsImageModalOpen(true);
                              }}
                              className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 rounded text-[8px] font-bold font-serif flex items-center gap-0.5 transition-colors cursor-pointer"
                              title="Ampliar com Zoom e Pan"
                            >
                              <ZoomIn className="w-2.5 h-2.5" />
                              <span>Zoom</span>
                            </button>

                            {/* Editar com IA */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingImageUrl(imgUrl);
                              }}
                              className="px-1.5 py-0.5 bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/40 rounded text-[8px] font-bold font-serif flex items-center gap-0.5 transition-colors cursor-pointer"
                              title="Modificar esta imagem com IA (Image-to-Image)"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-purple-300" />
                              <span>Editar</span>
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(imgUrl);
                              }}
                              className="p-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded text-[8px] transition-colors cursor-pointer"
                              title="Remover imagem da galeria"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA (5 COLS): CARACTERÍSTICAS FÍSICAS & PREVIEW ATIVO */}
          <div className="lg:col-span-5 bg3-panel rounded-xl p-3 flex flex-col h-full overflow-hidden justify-between space-y-2">
            {/* Header com Preview do Rosto e Pino de Combate */}
            <div className="flex items-center justify-between border-b border-amber-500/15 pb-1.5 shrink-0">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-serif">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Destaques Ativos & Físico
              </h3>
            </div>

            {/* Destaque Ativo de Rosto & Combate (Imagens Ampliadas - Dobro do Tamanho) */}
            <div className="grid grid-cols-2 gap-2.5 bg-[#090d16] p-2.5 rounded-xl border border-amber-500/20 shrink-0">
              {/* Rosto Ativo */}
              <div 
                onClick={() => {
                  if (activeAvatar) {
                    setModalImageUrl(activeAvatar);
                    setIsImageModalOpen(true);
                  }
                }}
                className="flex flex-col items-center text-center gap-1.5 p-1.5 rounded-lg bg-[#06080e] border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer group"
                title="Clique para ampliar com Zoom e Pan"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-cyan-500/70 bg-black shrink-0 relative shadow-lg group-hover:scale-105 transition-transform">
                  {activeAvatar ? (
                    <img src={activeAvatar} alt="Retrato" className="w-full h-full object-cover object-[center_18%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] font-serif">
                      Sem Retrato
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-cyan-950/95 text-cyan-300 text-[7.5px] font-mono font-black text-center py-0.5 border-t border-cyan-500/40">
                    👤 RETRATO / HUD
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-cyan-200 block truncate font-serif">
                    Retrato Oficial
                  </span>
                  <span className="text-[8.5px] text-slate-400 block truncate">
                    HUD, Ficha & Party
                  </span>
                </div>
              </div>

              {/* Combate Ativo */}
              <div 
                onClick={() => {
                  if (activeCombatPin) {
                    setModalImageUrl(activeCombatPin);
                    setIsImageModalOpen(true);
                  }
                }}
                className="flex flex-col items-center text-center gap-1.5 p-1.5 rounded-lg bg-[#06080e] border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer group"
                title="Clique para ampliar com Zoom e Pan"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-emerald-500/70 bg-black shrink-0 relative shadow-lg group-hover:scale-105 transition-transform">
                  {activeCombatPin ? (
                    <img src={activeCombatPin} alt="Combate" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px] font-serif">
                      Sem Pino
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-emerald-950/95 text-emerald-300 text-[7.5px] font-mono font-black text-center py-0.5 border-t border-emerald-500/40">
                    🎯 PINO DE COMBATE
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-emerald-200 block truncate font-serif">
                    Pino de Batalha
                  </span>
                  <span className="text-[8.5px] text-slate-400 block truncate">
                    Token no Grid 3D
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs de Medidas & Características Físicas (Cabelos, Olhos e Pele em 2 linhas cada) */}
            <div className="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
              {/* Linha 1: Idade, Altura e Peso (3 colunas compactas) */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <label className="text-[8.5px] text-slate-400 font-serif uppercase tracking-wider font-bold">Idade</label>
                  <input
                    type="text"
                    value={sheet.age || ''}
                    onChange={(e) => onChange({ ...sheet, age: e.target.value })}
                    placeholder="Ex: 27 anos"
                    className="w-full bg-[#06080e] border border-slate-800 focus:border-amber-500/70 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[8.5px] text-slate-400 font-serif uppercase tracking-wider font-bold">Altura</label>
                  <input
                    type="text"
                    value={sheet.height || ''}
                    onChange={(e) => onChange({ ...sheet, height: e.target.value })}
                    placeholder="Ex: 1.85m"
                    className="w-full bg-[#06080e] border border-slate-800 focus:border-amber-500/70 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-sans"
                  />
                </div>

                <div className="space-y-0.5">
                  <label className="text-[8.5px] text-slate-400 font-serif uppercase tracking-wider font-bold">Peso</label>
                  <input
                    type="text"
                    value={sheet.weight || ''}
                    onChange={(e) => onChange({ ...sheet, weight: e.target.value })}
                    placeholder="Ex: 95kg"
                    className="w-full bg-[#06080e] border border-slate-800 focus:border-amber-500/70 rounded-lg px-2 py-1 text-xs text-white focus:outline-none font-sans"
                  />
                </div>
              </div>

              {/* Linha 2: Olhos (2 Linhas de Texto) */}
              <div className="space-y-0.5">
                <label className="text-[8.5px] text-amber-300/90 font-serif uppercase tracking-wider font-bold">Olhos</label>
                <textarea
                  rows={2}
                  value={sheet.eyes || ''}
                  onChange={(e) => onChange({ ...sheet, eyes: e.target.value })}
                  placeholder="Ex: Castanhos escuros e profundos, com um olhar observador..."
                  className="w-full bg-[#06080e] border border-slate-800 focus:border-amber-500/70 rounded-lg p-2 text-xs text-white focus:outline-none font-sans resize-none leading-relaxed"
                />
              </div>

              {/* Linha 3: Pele (2 Linhas de Texto) */}
              <div className="space-y-0.5">
                <label className="text-[8.5px] text-amber-300/90 font-serif uppercase tracking-wider font-bold">Pele</label>
                <textarea
                  rows={2}
                  value={sheet.skin || ''}
                  onChange={(e) => onChange({ ...sheet, skin: e.target.value })}
                  placeholder="Ex: Pele negra e vibrante, com um tom quente de ébano..."
                  className="w-full bg-[#06080e] border border-slate-800 focus:border-amber-500/70 rounded-lg p-2 text-xs text-white focus:outline-none font-sans resize-none leading-relaxed"
                />
              </div>

              {/* Linha 4: Cabelos (2 Linhas de Texto) */}
              <div className="space-y-0.5">
                <label className="text-[8.5px] text-amber-300/90 font-serif uppercase tracking-wider font-bold">Cabelos</label>
                <textarea
                  rows={2}
                  value={sheet.hair || ''}
                  onChange={(e) => onChange({ ...sheet, hair: e.target.value })}
                  placeholder="Ex: Cabelo preto denso e crespo, mantido curto e aparado..."
                  className="w-full bg-[#06080e] border border-slate-800 focus:border-amber-500/70 rounded-lg p-2 text-xs text-white focus:outline-none font-sans resize-none leading-relaxed"
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
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
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

      {/* MODAL DE ZOOM DE IMAGEM */}
      <ZoomableImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={modalImageUrl || activeAvatar}
      />

      {/* MODAL DE EDIÇÃO DE IMAGEM POR IA */}
      {editingImageUrl && (
        <CharacterImageAiEditorModal
          isOpen={Boolean(editingImageUrl)}
          onClose={() => setEditingImageUrl(null)}
          sourceImageUrl={editingImageUrl}
          characterName={sheet.characterName}
          onSaveModifiedImage={handleSaveModifiedImage}
        />
      )}

      {/* MODAL DE GERAÇÃO DE LORE VIA IA */}
      <CharacterRPAiGeneratorModal
        isOpen={isAiLoreModalOpen}
        onClose={() => setIsAiLoreModalOpen(false)}
        sheet={sheet}
        onApply={(data) => {
          onChange({ ...sheet, ...data });
        }}
      />
    </div>
  );
};
