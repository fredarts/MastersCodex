'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Type, 
  Move, 
  Maximize2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Eye,
  Film,
  MousePointer,
  RotateCcw
} from 'lucide-react';
import { 
  SlideTextOverlay, 
  OverlayBoxStylePreset, 
  OverlayBoxPosition, 
  OverlayBoxWidth, 
  SlideAspectRatio,
  OverlayFontFamily 
} from '@/lib/types';
import { 
  OVERLAY_STYLE_PRESETS, 
  OVERLAY_POSITION_OPTIONS, 
  OVERLAY_WIDTH_OPTIONS, 
  OVERLAY_FONT_SIZE_OPTIONS,
  OVERLAY_FONT_FAMILIES 
} from '@/lib/constants/rpgArtStyles';
import { normalizeImageUrl, isYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface SlideOverlayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string;
  slideTitle?: string;
  slideImageUrl?: string;
  slideAspectRatio?: SlideAspectRatio;
  initialOverlays?: SlideTextOverlay[];
  legacyOverlayText?: string;
  onSaveOverlays: (overlays: SlideTextOverlay[]) => void;
}

export const SlideOverlayEditorModal: React.FC<SlideOverlayEditorModalProps> = ({
  isOpen,
  onClose,
  slideId,
  slideTitle,
  slideImageUrl = '',
  slideAspectRatio = '16:9',
  initialOverlays = [],
  legacyOverlayText = '',
  onSaveOverlays,
}) => {
  // Inicialização com fallback
  const [overlays, setOverlays] = useState<SlideTextOverlay[]>(() => {
    if (initialOverlays && initialOverlays.length > 0) {
      return JSON.parse(JSON.stringify(initialOverlays));
    }
    if (legacyOverlayText?.trim()) {
      return [
        {
          id: `box-${Date.now()}-1`,
          title: slideTitle || 'Legenda da Cena',
          text: legacyOverlayText.trim(),
          position: 'bottom-center',
          width: 'wide',
          xPercent: 10,
          yPercent: 70,
          widthPercent: 80,
          stylePreset: 'cinematic',
          fontSize: 'sm',
          fontFamily: 'cinzel',
          textAlign: 'center',
          showTitle: Boolean(slideTitle),
        },
      ];
    }
    return [
      {
        id: `box-${Date.now()}-1`,
        title: slideTitle || 'Cena Principal',
        text: '',
        position: 'bottom-center',
        width: 'wide',
        xPercent: 10,
        yPercent: 70,
        widthPercent: 80,
        stylePreset: 'cinematic',
        fontSize: 'sm',
        fontFamily: 'cinzel',
        textAlign: 'center',
        showTitle: true,
      },
    ];
  });

  const [activeBoxIndex, setActiveBoxIndex] = useState<number>(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Estados de Interação com Mouse (Drag & Resize)
  const [isDragging, setIsDragging] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH?: number;
  }>({ startX: 0, startY: 0, origX: 0, origY: 0, origW: 0 });

  if (!isOpen) return null;

  const currentBox = overlays[activeBoxIndex] || overlays[0];

  const updateCurrentBox = (updates: Partial<SlideTextOverlay>) => {
    setOverlays((prev) =>
      prev.map((box, idx) => (idx === activeBoxIndex ? { ...box, ...updates } : box))
    );
  };

  const handleAddBox = () => {
    const newBox: SlideTextOverlay = {
      id: `box-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'Novo Título / Fala',
      text: '',
      position: 'top-center',
      xPercent: 15,
      yPercent: overlays.length === 1 ? 15 : 40,
      widthPercent: 70,
      stylePreset: currentBox?.stylePreset || 'cinematic',
      fontSize: 'sm',
      fontFamily: currentBox?.fontFamily || 'cinzel',
      textAlign: 'center',
      showTitle: true,
    };
    setOverlays((prev) => [...prev, newBox]);
    setActiveBoxIndex(overlays.length);
    toast.success('Nova caixa de texto adicionada!');
  };

  const handleDeleteBox = (idx: number) => {
    if (overlays.length <= 1) {
      toast.error('O slide deve manter pelo menos uma caixa.');
      return;
    }
    const next = overlays.filter((_, i) => i !== idx);
    setOverlays(next);
    setActiveBoxIndex(Math.max(0, idx - 1));
    toast.info('Caixa removida.');
  };

  const handleResetPosition = () => {
    updateCurrentBox({
      xPercent: 10,
      yPercent: 70,
      widthPercent: 80,
      heightPercent: undefined,
    });
    toast.info('Posição redefinida para o padrão.');
  };

  const handleSave = () => {
    onSaveOverlays(overlays);
    toast.success('Estilos e caixas de texto salvas com sucesso!');
    onClose();
  };

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

  // =========================================================================
  // LOGICA DE DRAG & RESIZE COM MOUSE NO PREVIEW INTERATIVO
  // =========================================================================
  const handleStartDrag = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveBoxIndex(idx);
    setIsDragging(true);

    const targetBox = overlays[idx];
    const initialX = typeof targetBox.xPercent === 'number' ? targetBox.xPercent : 10;
    const initialY = typeof targetBox.yPercent === 'number' ? targetBox.yPercent : 70;
    const initialW = typeof targetBox.widthPercent === 'number' ? targetBox.widthPercent : 80;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: initialX,
      origY: initialY,
      origW: initialW,
      origH: targetBox.heightPercent,
    };
  };

  const handleStartResize = (e: React.MouseEvent, handle: string, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveBoxIndex(idx);
    setResizeHandle(handle);

    const targetBox = overlays[idx];
    const initialX = typeof targetBox.xPercent === 'number' ? targetBox.xPercent : 10;
    const initialY = typeof targetBox.yPercent === 'number' ? targetBox.yPercent : 70;
    const initialW = typeof targetBox.widthPercent === 'number' ? targetBox.widthPercent : 80;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: initialX,
      origY: initialY,
      origW: initialW,
      origH: targetBox.heightPercent || 20,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !resizeHandle) return;
      if (!previewContainerRef.current) return;

      const rect = previewContainerRef.current.getBoundingClientRect();
      const deltaXPixels = e.clientX - dragStartRef.current.startX;
      const deltaYPixels = e.clientY - dragStartRef.current.startY;

      const deltaXPercent = (deltaXPixels / rect.width) * 100;
      const deltaYPercent = (deltaYPixels / rect.height) * 100;

      if (isDragging) {
        // Arrastar caixa livremente
        const newX = Math.max(0, Math.min(100 - (dragStartRef.current.origW || 20), dragStartRef.current.origX + deltaXPercent));
        const newY = Math.max(0, Math.min(90, dragStartRef.current.origY + deltaYPercent));

        setOverlays((prev) =>
          prev.map((box, i) =>
            i === activeBoxIndex ? { ...box, xPercent: Math.round(newX), yPercent: Math.round(newY) } : box
          )
        );
      } else if (resizeHandle) {
        // Redimensionar por handles
        if (resizeHandle.includes('e')) {
          // Lado direito -> altera largura
          const newW = Math.max(20, Math.min(100 - dragStartRef.current.origX, dragStartRef.current.origW + deltaXPercent));
          setOverlays((prev) =>
            prev.map((box, i) =>
              i === activeBoxIndex ? { ...box, widthPercent: Math.round(newW) } : box
            )
          );
        } else if (resizeHandle.includes('w')) {
          // Lado esquerdo -> altera x e largura
          const potentialNewX = dragStartRef.current.origX + deltaXPercent;
          const newW = Math.max(20, dragStartRef.current.origW - deltaXPercent);
          if (potentialNewX >= 0) {
            setOverlays((prev) =>
              prev.map((box, i) =>
                i === activeBoxIndex ? { ...box, xPercent: Math.round(potentialNewX), widthPercent: Math.round(newW) } : box
              )
            );
          }
        }

        if (resizeHandle.includes('s')) {
          // Base inferior -> altera altura
          const newH = Math.max(10, Math.min(80, (dragStartRef.current.origH || 20) + deltaYPercent));
          setOverlays((prev) =>
            prev.map((box, i) =>
              i === activeBoxIndex ? { ...box, heightPercent: Math.round(newH) } : box
            )
          );
        }
      }
    },
    [isDragging, resizeHandle, activeBoxIndex]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || resizeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, resizeHandle, handleMouseMove, handleMouseUp]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-[120] animate-fade-in select-none">
      <div className="bg-[#0f141d] border-2 border-amber-500/50 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c182c] to-[#101522] px-6 py-3.5 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Designer Interativo de Legendas & Caixas de Texto
              </h3>
              <p className="text-[11px] text-amber-400 font-mono">
                {slideTitle || 'Slide Atual'} • Arraste e redimensione direto na tela!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body em 2 Colunas: Canvas Interativo à Esquerda e Editor à Direita */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: CANVAS INTERATIVO DRAG & RESIZE                          */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5">
                  <MousePointer className="w-3.5 h-3.5 text-amber-400" /> Canvas Interativo (Clique e Arraste)
                </label>
              </div>
              <button
                type="button"
                onClick={handleResetPosition}
                className="text-[10px] bg-[#161c28] hover:bg-[#1f2738] text-amber-400 border border-[#2a3449] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Restaurar posição padrão da caixa ativa"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Resetar Posição</span>
              </button>
            </div>

            {/* Canvas do Preview Interativo */}
            <div 
              ref={previewContainerRef}
              className="relative w-full bg-black/95 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-2xl flex items-center justify-center min-h-[300px] max-h-[500px] p-2"
            >
              <div 
                style={getAspectStyle(slideAspectRatio)}
                className={`h-full max-w-full w-auto ${getAspectClass(slideAspectRatio)} relative flex items-center justify-center overflow-hidden rounded-lg`}
              >
                {slideImageUrl ? (
                  isYouTubeUrl(slideImageUrl) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(slideImageUrl) || ''}
                      className="w-full h-full border-0 bg-black pointer-events-none"
                    />
                  ) : /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(slideImageUrl) ? (
                    <video
                      src={normalizeImageUrl(slideImageUrl)}
                      className="w-full h-full object-cover bg-black pointer-events-none"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={normalizeImageUrl(slideImageUrl)}
                      alt="Arte do Slide"
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )
                ) : (
                  <div className="text-center p-6 text-slate-500 flex flex-col items-center gap-2">
                    <Film className="w-10 h-10 opacity-30 text-amber-400" />
                    <p className="text-xs font-semibold">Nenhuma imagem carregada.</p>
                  </div>
                )}

                {/* Camada de Caixas de Texto com DRAG & RESIZE HANDLES */}
                <div className="absolute inset-0 p-2 overflow-hidden pointer-events-none">
                  {overlays.map((box, idx) => {
                    const isSelected = activeBoxIndex === idx;
                    const preset = OVERLAY_STYLE_PRESETS.find((p) => p.id === (box.stylePreset || 'cinematic')) || OVERLAY_STYLE_PRESETS[0];
                    const fontOpt = OVERLAY_FONT_SIZE_OPTIONS.find((f) => f.id === (box.fontSize || 'sm')) || OVERLAY_FONT_SIZE_OPTIONS[0];
                    const fontFamilyOpt = OVERLAY_FONT_FAMILIES.find((f) => f.id === box.fontFamily);

                    const customFontClass = fontFamilyOpt ? fontFamilyOpt.fontClass : preset.textClasses;
                    const customTitleFontClass = fontFamilyOpt ? fontFamilyOpt.titleClass : preset.titleClasses;

                    const textAlignClass = 
                      box.textAlign === 'left' ? 'text-left' :
                      box.textAlign === 'right' ? 'text-right' : 'text-center';

                    const leftPercent = typeof box.xPercent === 'number' ? box.xPercent : 10;
                    const topPercent = typeof box.yPercent === 'number' ? box.yPercent : 70;
                    const widthPercent = typeof box.widthPercent === 'number' ? box.widthPercent : 80;
                    const heightPercent = typeof box.heightPercent === 'number' ? `${box.heightPercent}%` : 'auto';

                    return (
                      <div
                        key={box.id}
                        onMouseDown={(e) => handleStartDrag(e, idx)}
                        style={{
                          left: `${leftPercent}%`,
                          top: `${topPercent}%`,
                          width: `${widthPercent}%`,
                          height: heightPercent,
                        }}
                        className={`absolute pointer-events-auto cursor-move transition-shadow duration-150 p-3 sm:p-4 rounded-xl ${preset.containerClasses} ${textAlignClass} shadow-2xl select-none ${
                          isSelected
                            ? 'ring-2 ring-amber-400 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)]'
                            : 'hover:ring-1 hover:ring-amber-500/40 opacity-90'
                        }`}
                      >
                        {/* Título da Caixa */}
                        {box.showTitle !== false && box.title && box.title.trim() !== '' && (
                          <div className={`text-[10px] sm:text-xs mb-1 flex items-center gap-1.5 ${textAlignClass === 'text-center' ? 'justify-center' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-start'} ${customTitleFontClass}`}>
                            <span>{box.title}</span>
                          </div>
                        )}

                        {/* Texto Principal */}
                        {box.text ? (
                          <p className={`${fontOpt.class} ${customFontClass} leading-relaxed break-words`}>
                            &ldquo;{box.text}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">Digite um texto ao lado...</p>
                        )}

                        {/* RESIZE HANDLES QUANDO SELECIONADA */}
                        {isSelected && (
                          <>
                            {/* Handle Leste / Direita (Largura) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, 'e', idx)}
                              className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-7 bg-amber-400 hover:bg-amber-300 border border-black rounded cursor-ew-resize shadow-md"
                              title="Ajustar largura"
                            />
                            {/* Handle Oeste / Esquerda (Largura) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, 'w', idx)}
                              className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-7 bg-amber-400 hover:bg-amber-300 border border-black rounded cursor-ew-resize shadow-md"
                              title="Ajustar largura"
                            />
                            {/* Handle Sul / Base (Altura) */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, 's', idx)}
                              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-3 bg-amber-400 hover:bg-amber-300 border border-black rounded cursor-ns-resize shadow-md"
                              title="Ajustar altura"
                            />
                            {/* Canto Sudeste */}
                            <div
                              onMouseDown={(e) => handleStartResize(e, 'se', idx)}
                              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 hover:bg-amber-300 border border-black rounded-full cursor-nwse-resize shadow-md"
                              title="Redimensionar livremente"
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-[#121824] rounded-xl border border-[#2a3449] text-[11px] text-slate-400 flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Controle Livre:</strong> Clique e arraste qualquer caixa para reposicioná-la. Puxe as alças amarelas para alargar ou esticar!
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: FORMULÁRIO DE CUSTOMIZAÇÃO & FONTES RPG                   */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
            
            {/* Abas de Caixas de Texto */}
            <div className="flex items-center justify-between border-b border-[#2a3449] pb-3 shrink-0">
              <div className="flex flex-wrap gap-2">
                {overlays.map((box, idx) => {
                  const isActive = activeBoxIndex === idx;
                  return (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => setActiveBoxIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:bg-[#1f2738]'
                      }`}
                    >
                      <span>Caixa #{idx + 1}: {box.title || 'Sem título'}</span>
                      {overlays.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBox(idx);
                          }}
                          className="hover:text-rose-600 p-0.5 rounded transition-colors"
                          title="Remover Caixa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAddBox}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Adicionar Caixa</span>
              </button>
            </div>

            {/* Editor da Caixa Ativa */}
            {currentBox && (
              <div className="space-y-4">
                
                {/* Bloco 1: Textos & Título */}
                <div className="grid grid-cols-1 gap-3 bg-[#121824] p-3.5 rounded-2xl border border-[#2a3449]">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                        Título da Caixa de Texto:
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-amber-400 font-mono cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentBox.showTitle !== false}
                          onChange={(e) => updateCurrentBox({ showTitle: e.target.checked })}
                          className="rounded border-[#2a3449] text-amber-500 focus:ring-0"
                        />
                        <span>Exibir Título</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={currentBox.title || ''}
                      onChange={(e) => updateCurrentBox({ title: e.target.value })}
                      placeholder="Ex: Capítulo 1, Oráculo de Delfos, Sussurro Misterioso..."
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                      Texto / Narração / Fala:
                    </label>
                    <textarea
                      rows={2}
                      value={currentBox.text || ''}
                      onChange={(e) => updateCurrentBox({ text: e.target.value })}
                      placeholder="Ex: As chamas crepitam na lareira enquanto o taverneiro olha fixamente..."
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-2.5 text-xs text-slate-100 font-serif italic resize-none"
                    />
                  </div>
                </div>

                {/* Bloco 2: Seletor de Famílias de Fontes de Fantasia & Medieval */}
                <div className="space-y-1.5 bg-[#121824] p-3.5 rounded-2xl border border-[#2a3449]">
                  <label className="text-[10px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-400" /> Fonte Tipográfica (Fantasia & Medieval):
                  </label>
                  <select
                    value={currentBox.fontFamily || 'cinzel'}
                    onChange={(e) => updateCurrentBox({ fontFamily: e.target.value as OverlayFontFamily })}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 text-amber-300 font-bold text-xs rounded-xl px-3 py-2 cursor-pointer shadow-inner"
                  >
                    {OVERLAY_FONT_FAMILIES.map((font) => (
                      <option key={font.id} value={font.id} className="bg-[#121824] text-slate-200">
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bloco 3: Seletor de Presets Visuais Temáticos de RPG */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Preset de Estilo Visual RPG
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {OVERLAY_STYLE_PRESETS.map((preset) => {
                      const isSelected = (currentBox.stylePreset || 'cinematic') === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => updateCurrentBox({ stylePreset: preset.id })}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-500/30 shadow-lg'
                              : 'bg-[#121824] border-[#2a3449] hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-100">{preset.badge}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                          </div>
                          <p className="text-[9px] text-slate-400 leading-snug">{preset.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bloco 4: Tamanho & Alinhamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#121824] p-3 rounded-2xl border border-[#2a3449] space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1">
                      <Type className="w-3 h-3 text-amber-400" /> Tamanho da Fonte:
                    </label>
                    <select
                      value={currentBox.fontSize || 'sm'}
                      onChange={(e) => updateCurrentBox({ fontSize: e.target.value as any })}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 cursor-pointer"
                    >
                      {OVERLAY_FONT_SIZE_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#121824] text-slate-200">
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#121824] p-3 rounded-2xl border border-[#2a3449] space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1">
                      <AlignLeft className="w-3 h-3 text-amber-400" /> Alinhamento do Texto:
                    </label>
                    <div className="flex gap-1 bg-[#0a0d14] p-1 rounded-xl border border-[#2a3449]">
                      <button
                        type="button"
                        onClick={() => updateCurrentBox({ textAlign: 'left' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                          currentBox.textAlign === 'left' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Alinhar à Esquerda"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Esq</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurrentBox({ textAlign: 'center' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                          (!currentBox.textAlign || currentBox.textAlign === 'center') ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Centralizar"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Centro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurrentBox({ textAlign: 'right' })}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 ${
                          currentBox.textAlign === 'right' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Alinhar à Direita"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Dir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#101522] px-6 py-3.5 border-t border-[#2a3449] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Estilos & Caixas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
