'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  Lock, 
  Monitor, 
  Tv, 
  Square, 
  Smartphone, 
  Layers, 
  CloudMoon, 
  BookOpen, 
  Eye, 
  Wind, 
  Play, 
  RotateCw,
  FolderPlus,
  Edit2,
  Check,
  Film,
  UploadCloud,
  Link2,
  Image as ImageIcon,
  X,
  Palette
} from 'lucide-react';
import { SceneImage, SlidePack, SlideTransitionType, SlideAspectRatio } from '@/lib/types';
import { SLIDE_TRANSITION_OPTIONS, SLIDE_ASPECT_RATIO_OPTIONS } from '@/lib/constants/rpgArtStyles';
import { MagicShaderSlideshow } from '@/components/MagicShaderSlideshow';
import { SlideTextOverlayRenderer } from '@/components/session/SlideTextOverlayRenderer';
import { SlideOverlayEditorModal } from '@/components/session/SlideOverlayEditorModal';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from '@/lib/imageUtils';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

interface SceneSlideshowStudioProps {
  sceneImages: SceneImage[];
  setSceneImages: React.Dispatch<React.SetStateAction<SceneImage[]>>;
  slidePacks: SlidePack[];
  setSlidePacks: React.Dispatch<React.SetStateAction<SlidePack[]>>;
  activeSlidePackId: string;
  setActiveSlidePackId: (id: string) => void;
  defaultTransition: SlideTransitionType;
  setDefaultTransition: (t: SlideTransitionType) => void;
  defaultAspectRatio: SlideAspectRatio;
  setDefaultAspectRatio: (a: SlideAspectRatio) => void;
  sceneTitle: string;
  sensoryText: string;
  onOpenAiModal: () => void;
  primaryImageUrl: string;
  setPrimaryImageUrl: (url: string) => void;
}

export const SceneSlideshowStudio: React.FC<SceneSlideshowStudioProps> = ({
  sceneImages,
  setSceneImages,
  slidePacks,
  setSlidePacks,
  activeSlidePackId,
  setActiveSlidePackId,
  defaultTransition,
  setDefaultTransition,
  defaultAspectRatio,
  setDefaultAspectRatio,
  sceneTitle,
  sensoryText,
  onOpenAiModal,
  primaryImageUrl,
  setPrimaryImageUrl,
}) => {
  const [selectedSlideIndex, setSelectedSlideIndex] = useState<number>(0);
  const [testTransitionUrl, setTestTransitionUrl] = useState<string | null>(null);
  const [isCreatingPack, setIsCreatingPack] = useState(false);
  const [newPackTitle, setNewPackTitle] = useState('');
  const [newPackCategory, setNewPackCategory] = useState<'sonho' | 'lore' | 'flashback' | 'custom'>('sonho');
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [addMediaTab, setAddMediaTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingOverlaySlideIndex, setEditingOverlaySlideIndex] = useState<number | null>(null);

  // Pack atualmente ativo
  const currentPack = slidePacks.find((p) => p.id === activeSlidePackId) || slidePacks[0] || {
    id: 'pack-main',
    title: '🌟 Cena Principal',
    category: 'principal' as const,
    transitionType: defaultTransition,
    aspectRatio: defaultAspectRatio,
    images: sceneImages.length > 0 ? sceneImages : (primaryImageUrl ? [{
      id: 'img-init-fallback',
      imageUrl: primaryImageUrl,
      overlayText: sensoryText || '',
      secretNotes: '',
      mediaType: 'image' as const,
      aspectRatio: defaultAspectRatio || '16:9'
    }] : []),
    activeImageIndex: 0,
  };

  const currentPackImages = currentPack.images || [];

  // Garantir que selectedSlideIndex é válido
  useEffect(() => {
    if (selectedSlideIndex >= currentPackImages.length) {
      setSelectedSlideIndex(Math.max(0, currentPackImages.length - 1));
    }
  }, [currentPackImages.length, selectedSlideIndex]);

  // Helper para atualizar os slides do pack ativo
  const updateCurrentPackImages = (newImages: SceneImage[]) => {
    setSlidePacks((prevPacks) => {
      const activeId = activeSlidePackId || (prevPacks[0]?.id ?? 'pack-main');
      const exists = prevPacks.some((p) => p.id === activeId);

      if (!exists) {
        const newPack: SlidePack = {
          id: activeId,
          title: '🌟 Cena Principal',
          category: 'principal',
          transitionType: defaultTransition || 'magical_dissolve',
          aspectRatio: defaultAspectRatio || '16:9',
          images: newImages,
          activeImageIndex: 0,
        };
        return [...prevPacks, newPack];
      }

      return prevPacks.map((pack) => {
        if (pack.id === activeId) {
          return { ...pack, images: newImages };
        }
        return pack;
      });
    });

    if (currentPack.id === 'pack-main' || slidePacks.length <= 1) {
      setSceneImages(newImages);
    }
  };

  // Helper para atualizar configurações do pack ativo (transição / aspect ratio)
  const updateCurrentPackSettings = (updates: Partial<SlidePack>) => {
    setSlidePacks((prevPacks) => {
      const activeId = activeSlidePackId || (prevPacks[0]?.id ?? 'pack-main');
      const exists = prevPacks.some((p) => p.id === activeId);

      if (!exists) {
        const newPack: SlidePack = {
          id: activeId,
          title: '🌟 Cena Principal',
          category: 'principal',
          transitionType: defaultTransition || 'magical_dissolve',
          aspectRatio: defaultAspectRatio || '16:9',
          images: currentPackImages,
          activeImageIndex: 0,
          ...updates,
        };
        return [...prevPacks, newPack];
      }

      return prevPacks.map((pack) => {
        if (pack.id === activeId) {
          return { ...pack, ...updates };
        }
        return pack;
      });
    });

    if (updates.transitionType) {
      setDefaultTransition(updates.transitionType);
    }
    if (updates.aspectRatio) {
      setDefaultAspectRatio(updates.aspectRatio);
    }
  };

  // Criar novo Pack
  const handleCreatePack = () => {
    if (!newPackTitle.trim()) return;
    const categoryIcons: Record<string, string> = {
      sonho: '💭',
      lore: '📜',
      flashback: '⏳',
      custom: '🎬',
    };
    const prefix = categoryIcons[newPackCategory] || '📁';
    const newPackId = `pack-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newPack: SlidePack = {
      id: newPackId,
      title: `${prefix} ${newPackTitle.trim()}`,
      category: newPackCategory,
      transitionType: newPackCategory === 'sonho' ? 'dream_waves' : newPackCategory === 'lore' ? 'book_page_flip_3d' : defaultTransition,
      aspectRatio: defaultAspectRatio,
      images: [],
      activeImageIndex: 0,
    };

    setSlidePacks((prev) => [...prev, newPack]);
    setActiveSlidePackId(newPackId);
    setSelectedSlideIndex(0);
    setNewPackTitle('');
    setIsCreatingPack(false);
    toast.success(`Pack "${newPack.title}" criado com sucesso!`);
  };

  // Remover Pack
  const handleDeletePack = (packId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlidePacks((prev) => {
      if (prev.length <= 1) {
        toast.error('Você não pode remover o único pack da cena.');
        return prev;
      }
      const remaining = prev.filter((p) => p.id !== packId);
      if (activeSlidePackId === packId) {
        setActiveSlidePackId(remaining[0].id);
        setSelectedSlideIndex(0);
      }
      toast.success('Pack removido.');
      return remaining;
    });
  };

  // Adicionar Slide ao Pack atual
  const handleAddSlide = (imageUrl: string, mediaType: 'image' | 'video' = 'image') => {
    const newImg: SceneImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      imageUrl,
      overlayText: '',
      secretNotes: '',
      mediaType,
      aspectRatio: currentPack.aspectRatio || defaultAspectRatio,
    };
    const nextImages = [...currentPackImages, newImg];
    updateCurrentPackImages(nextImages);
    if (!primaryImageUrl) setPrimaryImageUrl(imageUrl);
    setSelectedSlideIndex(nextImages.length - 1);
    setShowAddMediaModal(false);
    setUrlInput('');
  };

  // Disparar teste de transição com efeito visual
  const handleTestTransition = () => {
    if (currentPackImages.length === 0) {
      const demoImages = [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
      ];
      const nextDemo = testTransitionUrl === demoImages[0] ? demoImages[1] : demoImages[0];
      setTestTransitionUrl(nextDemo);
      return;
    }

    if (currentPackImages.length > 1) {
      const nextIdx = (selectedSlideIndex + 1) % currentPackImages.length;
      setSelectedSlideIndex(nextIdx);
    } else {
      const currentUrl = currentPackImages[0].imageUrl;
      setTestTransitionUrl(currentUrl);
    }
    toast.info(`Efeito "${SLIDE_TRANSITION_OPTIONS.find(t => t.id === currentPack.transitionType)?.label || 'Transição'}" executado!`);
  };

  const activeSlide = currentPackImages[selectedSlideIndex];
  const activeDisplayUrl = testTransitionUrl || activeSlide?.imageUrl || primaryImageUrl || '';
  const currentAspect = currentPack.aspectRatio || defaultAspectRatio || '16:9';

  const getAspectClass = (aspect: SlideAspectRatio) => {
    switch (aspect) {
      case '4:3':
        return 'aspect-[4/3]';
      case '1:1':
        return 'aspect-square';
      case '9:16':
        return 'aspect-[9/16]';
      case '16:9':
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-[1600px] mx-auto min-h-[680px]">
      {/* ========================================================================= */}
      {/* PAINEL ESQUERDO: LIVE PREVIEW DO SLIDE & CONTROLES DE TRANSIÇÃO           */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[48%] flex flex-col gap-4">
        {/* Card do Preview Canvas */}
        <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-4 shadow-xl flex flex-col gap-3">
          {/* Header do Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Pré-visualizador ao Vivo
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {currentPack.title}
              </span>
            </div>

            {/* Badges de Formato & Transição */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="bg-[#161c28] text-slate-300 border border-[#2a3449] px-2 py-0.5 rounded-md">
                {currentAspect}
              </span>
            </div>
          </div>

          {/* Área de Visualização com Shader WebGL */}
          <div className="relative w-full bg-black/90 rounded-xl overflow-hidden border border-[#2a3449] flex items-center justify-center min-h-[280px]">
            <div className={`w-full max-h-[380px] ${getAspectClass(currentAspect)} relative flex items-center justify-center overflow-hidden`}>
              {activeDisplayUrl ? (
                isYouTubeUrl(activeDisplayUrl) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeDisplayUrl) || ''}
                    className="w-full h-full border-0 bg-black"
                    allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : activeSlide?.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(activeDisplayUrl) ? (
                  <video
                    src={normalizeImageUrl(activeDisplayUrl)}
                    className="w-full h-full object-cover bg-black"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <MagicShaderSlideshow
                    imageUrl={normalizeImageUrl(activeDisplayUrl)}
                    transitionType={currentPack.transitionType || defaultTransition}
                    aspectRatio={currentAspect}
                    className="w-full h-full"
                  />
                )
              ) : (
                <div className="text-center p-8 text-slate-500 flex flex-col items-center gap-2">
                  <Film className="w-10 h-10 opacity-40 text-amber-400" />
                  <p className="text-xs font-semibold">Nenhum slide selecionado.</p>
                  <p className="text-[10px] text-slate-600">Adicione uma imagem ou gere com IA ao lado para pré-visualizar.</p>
                </div>
              )}

              {/* Overlays de Caixas de Texto & Legendas em Tempo Real no Preview */}
              <SlideTextOverlayRenderer
                overlays={activeSlide?.textOverlays}
                fallbackOverlayText={activeSlide?.overlayText || (!activeSlide && sensoryText ? sensoryText : undefined)}
                fallbackTitle={currentPack.title}
                triggerKey={`${activeDisplayUrl}-${selectedSlideIndex}`}
              />
            </div>
          </div>

          {/* Barra de Ações Rápidas do Preview */}
          <div className="flex items-center justify-between pt-1 gap-2">
            {/* Navegação entre Slides do Pack */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={selectedSlideIndex <= 0}
                className="p-1.5 bg-[#161c28] hover:bg-[#1f2738] disabled:opacity-30 border border-[#2a3449] rounded-lg text-slate-300 transition-all cursor-pointer"
                title="Slide Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-300 px-2">
                {currentPackImages.length > 0 ? `${selectedSlideIndex + 1} / ${currentPackImages.length}` : '0 / 0'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlideIndex((prev) => Math.min(currentPackImages.length - 1, prev + 1))}
                disabled={selectedSlideIndex >= currentPackImages.length - 1}
                className="p-1.5 bg-[#161c28] hover:bg-[#1f2738] disabled:opacity-30 border border-[#2a3449] rounded-lg text-slate-300 transition-all cursor-pointer"
                title="Próximo Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Botão Testar Transição WebGL */}
            <button
              type="button"
              onClick={handleTestTransition}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Testar Transição</span>
            </button>
          </div>
        </div>

        {/* Configuração de Transição & Formato do Pack */}
        <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-4 shadow-xl space-y-4">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Configurações de Transição & Formato do Pack
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Seletor de Efeito de Transição */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Efeito de Transição (WebGL)
              </label>
              <select
                value={currentPack.transitionType || defaultTransition}
                onChange={(e) => updateCurrentPackSettings({ transitionType: e.target.value as SlideTransitionType })}
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none transition-all cursor-pointer shadow-inner"
              >
                {SLIDE_TRANSITION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#121824] text-slate-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Proporção de Tela (Aspect Ratio) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">
                Proporção de Exibição (Aspect)
              </label>
              <div className="grid grid-cols-4 gap-1">
                {SLIDE_ASPECT_RATIO_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateCurrentPackSettings({ aspectRatio: opt.id })}
                    className={`py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                      currentAspect === opt.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                        : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Teleprompter Preview se preenchido */}
          {activeSlide?.secretNotes && (
            <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1">
              <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3" /> Teleprompter do Narrador (Slide Atual):
              </div>
              <p className="text-xs text-amber-200 font-serif italic">
                {activeSlide.secretNotes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAINEL DIREITO: GESTÃO DE PACKS, UPLOAD, IA E LISTA DE SLIDES            */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[52%] flex flex-col gap-4">
        {/* Seletor de Packs de Slides (Tabs / Decks) */}
        <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Packs de Slides da Cena ({slidePacks.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingPack((prev) => !prev)}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Pack</span>
            </button>
          </div>

          {/* Abas dos Packs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {slidePacks.map((pack) => {
              const isActive = pack.id === activeSlidePackId;
              return (
                <div
                  key={pack.id}
                  onClick={() => {
                    setActiveSlidePackId(pack.id);
                    setSelectedSlideIndex(0);
                  }}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-black'
                      : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
                  }`}
                >
                  <span>{pack.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-[#161c28] text-slate-500'
                  }`}>
                    {pack.images?.length || 0}
                  </span>

                  {/* Deletar pack se não for o único */}
                  {slidePacks.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeletePack(pack.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 transition-opacity p-0.5"
                      title="Excluir Pack"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Formulário de Criação de Novo Pack */}
          {isCreatingPack && (
            <div className="p-3 bg-[#0a0d14] border border-amber-500/40 rounded-xl space-y-3 animate-fade-in">
              <div className="text-[11px] font-bold text-amber-400 uppercase font-mono">
                Criar Novo Pack de Slides para esta Cena:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Nome do Pack (ex: Sonho do Elfo, Lore Antiga)
                  </label>
                  <input
                    type="text"
                    value={newPackTitle}
                    onChange={(e) => setNewPackTitle(e.target.value)}
                    placeholder="Ex: Revelação do Oráculo..."
                    className="w-full bg-[#161c28] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Categoria Narrativa
                  </label>
                  <select
                    value={newPackCategory}
                    onChange={(e) => setNewPackCategory(e.target.value as any)}
                    className="w-full bg-[#161c28] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
                  >
                    <option value="sonho">💭 Sonho / Visão Etérea</option>
                    <option value="lore">📜 Lore & História Ancestral (Grimório)</option>
                    <option value="flashback">⏳ Flashback / Memória</option>
                    <option value="custom">🎬 Cena Especial / Custom</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingPack(false)}
                  className="px-3 py-1 bg-[#161c28] text-slate-400 text-xs font-bold rounded-lg hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreatePack}
                  disabled={!newPackTitle.trim()}
                  className="px-4 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg shadow"
                >
                  Criar Pack
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Barra Unificada de Ações de Mídia (Botão Único de Mídia + Botão IA) */}
        <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Mídias do Pack: <strong className="text-amber-400">{currentPack.title}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Botão Único Unificado: Enviar Arquivo ou Link */}
            <button
              type="button"
              onClick={() => setShowAddMediaModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#161f30] hover:bg-[#1e2a42] border border-amber-500/40 hover:border-amber-500 text-amber-300 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Adicionar Mídia (Upload / Link)</span>
            </button>

            {/* Botão Gerar com IA */}
            <button
              type="button"
              onClick={onOpenAiModal}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Gerar com IA</span>
            </button>
          </div>
        </div>

        {/* Lista Reordenável de Slides do Pack Ativo */}
        <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-4 shadow-xl space-y-3 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Slides do Pack ({currentPackImages.length})</span>
            {currentPackImages.length > 0 && (
              <span className="text-[10px] text-slate-500">Clique em um slide para pré-visualizar à esquerda</span>
            )}
          </div>

          {currentPackImages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-[#0a0d14] border border-dashed border-[#2a3449] rounded-2xl text-xs space-y-2">
              <p className="font-semibold text-slate-400">Nenhum slide adicionado a este pack ainda.</p>
              <p className="text-[11px] text-slate-600">Clique em <strong>"Adicionar Mídia"</strong> ou <strong>"Gerar com IA"</strong> acima para começar.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {currentPackImages.map((imgObj, idx) => {
                const isSelected = selectedSlideIndex === idx;
                return (
                  <div
                    key={imgObj.id}
                    onClick={() => setSelectedSlideIndex(idx)}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#161f30] border-amber-500/60 shadow-lg'
                        : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                    }`}
                  >
                    {/* Thumbnail & Reordenação */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Setas de Reordenar */}
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idx > 0) {
                              const next = [...currentPackImages];
                              const temp = next[idx - 1];
                              next[idx - 1] = next[idx];
                              next[idx] = temp;
                              updateCurrentPackImages(next);
                              setSelectedSlideIndex(idx - 1);
                            }
                          }}
                          className="p-1 bg-[#121824] hover:bg-[#1f2738] disabled:opacity-20 border border-[#2a3449] rounded text-slate-400 hover:text-amber-300 transition-colors"
                          title="Mover para cima"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentPackImages.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (idx < currentPackImages.length - 1) {
                              const next = [...currentPackImages];
                              const temp = next[idx + 1];
                              next[idx + 1] = next[idx];
                              next[idx] = temp;
                              updateCurrentPackImages(next);
                              setSelectedSlideIndex(idx + 1);
                            }
                          }}
                          className="p-1 bg-[#121824] hover:bg-[#1f2738] disabled:opacity-20 border border-[#2a3449] rounded text-slate-400 hover:text-amber-300 transition-colors"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Miniatura do Slide */}
                      <div className="relative w-28 h-20 bg-black rounded-lg overflow-hidden border border-[#2a3449]">
                        {isYouTubeUrl(imgObj.imageUrl) ? (
                          <img src={getYouTubeThumbnailUrl(imgObj.imageUrl) || ''} className="w-full h-full object-cover" alt="YT" />
                        ) : imgObj.mediaType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(imgObj.imageUrl) ? (
                          <video src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover bg-black" muted playsInline />
                        ) : (
                          <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                        )}
                        <span className="absolute top-1 left-1 bg-black/80 text-[8px] font-bold text-amber-400 px-1 rounded font-mono">
                          #{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Inputs de Legenda & Teleprompter */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[8px] font-bold text-slate-400 uppercase">
                            Texto de Legenda (Visível aos Jogadores):
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOverlaySlideIndex(idx);
                            }}
                            className="px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-[9px] font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Abrir Designer de Legendas & Presets RPG"
                          >
                            <Palette className="w-2.5 h-2.5 text-amber-400" />
                            <span>🎨 Estilizar Caixas & Presets ({imgObj.textOverlays?.length || (imgObj.overlayText ? 1 : 0)})</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={imgObj.overlayText || ''}
                          placeholder="Ex: O dragão ancestral emerge das cinzas do vulcão..."
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = [...currentPackImages];
                            const nextOverlays = next[idx].textOverlays && next[idx].textOverlays!.length > 0
                              ? next[idx].textOverlays!.map((o, oIdx) => oIdx === 0 ? { ...o, text: e.target.value } : o)
                              : undefined;

                            next[idx] = { 
                              ...next[idx], 
                              overlayText: e.target.value,
                              textOverlays: nextOverlays
                            };
                            updateCurrentPackImages(next);
                          }}
                          className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold text-amber-400/80 uppercase mb-0.5 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Teleprompter do Narrador:
                        </label>
                        <textarea
                          rows={2}
                          value={imgObj.secretNotes || ''}
                          placeholder="Ex: Ler com voz sussurrada. Os aventureiros devem rolar percepção..."
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const next = [...currentPackImages];
                            next[idx] = { ...next[idx], secretNotes: e.target.value };
                            updateCurrentPackImages(next);
                          }}
                          className="w-full bg-[#121824] border border-amber-500/20 focus:border-amber-500 rounded-lg p-1.5 text-xs text-amber-200 font-serif resize-none"
                        />
                      </div>
                    </div>

                    {/* Botão de Exclusão */}
                    <div className="flex items-center justify-end md:justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = currentPackImages.filter((_, i) => i !== idx);
                          updateCurrentPackImages(next);
                          if (primaryImageUrl === imgObj.imageUrl) {
                            setPrimaryImageUrl(next[0]?.imageUrl || '');
                          }
                        }}
                        className="p-1.5 bg-[#121824] hover:bg-rose-950/30 border border-[#2a3449] hover:border-rose-500/40 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                        title="Excluir Slide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE ADIÇÃO DE MÍDIA (UPLOAD OU LINK DIRETO)                         */}
      {/* ========================================================================= */}
      {showAddMediaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-fade-in select-none">
          <div className="bg-[#101522] border-2 border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1c182c] to-[#101522] px-5 py-3.5 border-b border-[#2a3449] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Adicionar Mídia ao Pack</h3>
                  <p className="text-[10px] text-amber-400 font-mono">{currentPack.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMediaModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abas de Escolha: Upload vs Link */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-[#0a0d14] p-1 rounded-xl border border-[#2a3449]">
                <button
                  type="button"
                  onClick={() => setAddMediaTab('upload')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    addMediaTab === 'upload'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload de Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddMediaTab('url')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    addMediaTab === 'url'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Colar Link / URL</span>
                </button>
              </div>

              {/* Conteúdo da Aba Upload */}
              {addMediaTab === 'upload' && (
                <div className="space-y-3">
                  <label className="block text-center p-6 border-2 border-dashed border-[#2a3449] hover:border-amber-500/50 rounded-2xl bg-[#0a0d14] cursor-pointer transition-all group">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      disabled={!isSupabaseConfigured() || isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const isVideo = file.type.startsWith('video/');
                        setIsUploading(true);
                        try {
                          const publicUrl = await storageService.uploadAsset(file, 'scenes');
                          handleAddSlide(publicUrl, isVideo ? 'video' : 'image');
                          toast.success('Mídia enviada com sucesso!');
                        } catch (err: any) {
                          toast.error(err.message || 'Erro ao enviar arquivo.');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-200">
                        {isUploading ? 'Enviando arquivo...' : 'Clique para escolher uma Imagem ou Vídeo'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Suporta PNG, JPG, WEBP, GIF, MP4, WEBM
                      </p>
                    </div>
                  </label>
                  {!isSupabaseConfigured() && (
                    <p className="text-[10px] text-rose-400 font-bold text-center">
                      ⚠️ Supabase não configurado. Upload de arquivo local indisponível.
                    </p>
                  )}
                </div>
              )}

              {/* Conteúdo da Aba URL */}
              {addMediaTab === 'url' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      URL Direta da Imagem, Vídeo ou Link do YouTube:
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://exemplo.com/imagem.png ou https://youtube.com/watch?v=..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && urlInput.trim()) {
                          const isYT = isYouTubeUrl(urlInput.trim());
                          const isVid = isYT || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(urlInput.trim());
                          handleAddSlide(urlInput.trim(), isVid ? 'video' : 'image');
                        }
                      }}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddMediaModal(false)}
                      className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!urlInput.trim()) {
                          toast.error('Por favor, insira uma URL válida.');
                          return;
                        }
                        const isYT = isYouTubeUrl(urlInput.trim());
                        const isVid = isYT || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(urlInput.trim());
                        handleAddSlide(urlInput.trim(), isVid ? 'video' : 'image');
                        toast.success('Mídia adicionada com sucesso!');
                      }}
                      disabled={!urlInput.trim()}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Adicionar ao Pack</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DE CAIXAS DE TEXTO / LEGENDAS RPG (WYSIWYG)              */}
      {/* ========================================================================= */}
      {editingOverlaySlideIndex !== null && currentPackImages[editingOverlaySlideIndex] && (
        <SlideOverlayEditorModal
          isOpen={true}
          onClose={() => setEditingOverlaySlideIndex(null)}
          slideId={currentPackImages[editingOverlaySlideIndex].id}
          slideTitle={currentPack.title}
          slideImageUrl={currentPackImages[editingOverlaySlideIndex].imageUrl}
          slideAspectRatio={currentPackImages[editingOverlaySlideIndex].aspectRatio || currentPack.aspectRatio || defaultAspectRatio}
          initialOverlays={currentPackImages[editingOverlaySlideIndex].textOverlays}
          legacyOverlayText={currentPackImages[editingOverlaySlideIndex].overlayText}
          onSaveOverlays={(updatedOverlays) => {
            const next = [...currentPackImages];
            const mainText = updatedOverlays.find((o) => o.text?.trim())?.text || '';
            next[editingOverlaySlideIndex] = {
              ...next[editingOverlaySlideIndex],
              textOverlays: updatedOverlays,
              overlayText: mainText,
            };
            updateCurrentPackImages(next);
          }}
        />
      )}
    </div>
  );
};
