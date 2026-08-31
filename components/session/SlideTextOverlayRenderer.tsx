'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SlideTextOverlay, OverlayBoxPosition } from '@/lib/types';
import { 
  OVERLAY_STYLE_PRESETS, 
  OVERLAY_WIDTH_OPTIONS, 
  OVERLAY_FONT_SIZE_OPTIONS,
  OVERLAY_FONT_FAMILIES 
} from '@/lib/constants/rpgArtStyles';

interface SlideTextOverlayRendererProps {
  overlays?: SlideTextOverlay[];
  fallbackOverlayText?: string;
  fallbackTitle?: string;
  className?: string;
  isTvMode?: boolean;
  triggerKey?: string | number;
}

export const SlideTextOverlayRenderer: React.FC<SlideTextOverlayRendererProps> = ({
  overlays,
  fallbackOverlayText,
  fallbackTitle,
  className = '',
  isTvMode = false,
  triggerKey,
}) => {
  // Normalização de Overlays com Retrocompatibilidade
  const effectiveOverlays: SlideTextOverlay[] = useMemo(() => {
    if (overlays && overlays.length > 0) {
      return overlays.filter((o) => o.text?.trim() || o.title?.trim());
    }
    if (fallbackOverlayText?.trim()) {
      return [
        {
          id: 'fallback-legacy-overlay',
          title: fallbackTitle || undefined,
          text: fallbackOverlayText.trim(),
          position: 'bottom-center',
          width: 'wide',
          stylePreset: 'cinematic',
          fontSize: 'sm',
          textAlign: 'center',
          showTitle: Boolean(fallbackTitle),
        },
      ];
    }
    return [];
  }, [overlays, fallbackOverlayText, fallbackTitle]);

  // Estados de Transição Cinemática (Fade Out -> Transição Imagem -> Fade In)
  const [displayedOverlays, setDisplayedOverlays] = useState<SlideTextOverlay[]>(effectiveOverlays);
  const [displayedFallbackTitle, setDisplayedFallbackTitle] = useState<string | undefined>(fallbackTitle);
  const [opacityClass, setOpacityClass] = useState<string>('opacity-100');
  
  const isFirstRender = useRef(true);
  const prevTriggerKey = useRef(triggerKey);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayedOverlays(effectiveOverlays);
      setDisplayedFallbackTitle(fallbackTitle);
      setOpacityClass('opacity-100 animate-fade-in');
      return;
    }

    // Se o slide ou a imagem mudou (troca de slide)
    if (triggerKey !== undefined && prevTriggerKey.current !== triggerKey) {
      prevTriggerKey.current = triggerKey;

      // 1. FADE OUT da caixa de texto anterior (300ms)
      setOpacityClass('opacity-0 pointer-events-none transition-opacity duration-300 ease-in');

      // 2. Aguarda a transição WebGL da imagem acontecer na tela limpa
      const swapTimer = setTimeout(() => {
        setDisplayedOverlays(effectiveOverlays);
        setDisplayedFallbackTitle(fallbackTitle);

        // 3. FADE IN suave da nova caixa de texto após a revelação da imagem
        const inTimer = setTimeout(() => {
          setOpacityClass('opacity-100 transition-opacity duration-700 ease-out');
        }, 750);

        return () => clearTimeout(inTimer);
      }, 300);

      return () => clearTimeout(swapTimer);
    } else {
      // Edição direta em tempo real (sem troca de slide)
      setDisplayedOverlays(effectiveOverlays);
      setDisplayedFallbackTitle(fallbackTitle);
    }
  }, [triggerKey, effectiveOverlays, fallbackTitle]);

  if (displayedOverlays.length === 0) return null;

  // Separar caixas com posicionamento livre daquelas com posicionamento por zona
  const freePositionOverlays: SlideTextOverlay[] = [];
  const groupedOverlays: Record<OverlayBoxPosition, SlideTextOverlay[]> = {
    'top-left': [],
    'top-center': [],
    'top-right': [],
    'center': [],
    'bottom-left': [],
    'bottom-center': [],
    'bottom-right': [],
  };

  displayedOverlays.forEach((ov) => {
    if (typeof ov.xPercent === 'number' && typeof ov.yPercent === 'number') {
      freePositionOverlays.push(ov);
    } else {
      const pos: OverlayBoxPosition = ov.position || 'bottom-center';
      if (groupedOverlays[pos]) {
        groupedOverlays[pos].push(ov);
      } else {
        groupedOverlays['bottom-center'].push(ov);
      }
    }
  });

  const getPositionClasses = (pos: OverlayBoxPosition) => {
    switch (pos) {
      case 'top-left':
        return 'top-4 left-4 items-start text-left';
      case 'top-center':
        return 'top-4 left-4 right-4 items-center text-center';
      case 'top-right':
        return 'top-4 right-4 items-end text-right';
      case 'center':
        return 'top-1/2 left-4 right-4 -translate-y-1/2 items-center text-center';
      case 'bottom-left':
        return 'bottom-4 left-4 items-start text-left';
      case 'bottom-right':
        return 'bottom-4 right-4 items-end text-right';
      case 'bottom-center':
      default:
        return 'bottom-4 left-4 right-4 items-center text-center';
    }
  };

  const renderOverlayBox = (overlay: SlideTextOverlay, isFreePosition: boolean = false) => {
    const preset = OVERLAY_STYLE_PRESETS.find((p) => p.id === (overlay.stylePreset || 'cinematic')) || OVERLAY_STYLE_PRESETS[0];
    const widthOpt = OVERLAY_WIDTH_OPTIONS.find((w) => w.id === (overlay.width || 'wide')) || OVERLAY_WIDTH_OPTIONS[2];
    const fontOpt = OVERLAY_FONT_SIZE_OPTIONS.find((f) => f.id === (overlay.fontSize || 'sm')) || OVERLAY_FONT_SIZE_OPTIONS[0];
    const fontFamilyOpt = OVERLAY_FONT_FAMILIES.find((f) => f.id === overlay.fontFamily);

    const textAlignClass = 
      overlay.textAlign === 'left' ? 'text-left' :
      overlay.textAlign === 'right' ? 'text-right' :
      overlay.textAlign === 'center' ? 'text-center' : '';

    const customFontClass = fontFamilyOpt ? fontFamilyOpt.fontClass : preset.textClasses;
    const customTitleFontClass = fontFamilyOpt ? fontFamilyOpt.titleClass : preset.titleClasses;

    if (isFreePosition && typeof overlay.xPercent === 'number' && typeof overlay.yPercent === 'number') {
      const widthStyle = typeof overlay.widthPercent === 'number' ? `${overlay.widthPercent}%` : '65%';
      const heightStyle = typeof overlay.heightPercent === 'number' ? `${overlay.heightPercent}%` : undefined;

      return (
        <div
          key={overlay.id}
          style={{
            left: `${overlay.xPercent}%`,
            top: `${overlay.yPercent}%`,
            width: widthStyle,
            height: heightStyle,
          }}
          className={`absolute pointer-events-auto transition-shadow duration-200 p-3 sm:p-4 ${preset.containerClasses} ${textAlignClass} shadow-2xl overflow-y-auto custom-scrollbar`}
        >
          {/* Título da Caixa de Texto */}
          {overlay.showTitle !== false && overlay.title && overlay.title.trim() !== '' && (
            <div className={`text-[10px] sm:text-xs mb-1 flex items-center gap-1.5 ${textAlignClass === 'text-center' ? 'justify-center' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-start'} ${customTitleFontClass}`}>
              <span>{overlay.title}</span>
            </div>
          )}

          {/* Texto / Fala / Narração */}
          {overlay.text && (
            <p className={`${isTvMode ? 'text-sm sm:text-base md:text-lg leading-relaxed' : fontOpt.class} ${customFontClass} leading-relaxed break-words`}>
              &ldquo;{overlay.text}&rdquo;
            </p>
          )}
        </div>
      );
    }

    return (
      <div
        key={overlay.id}
        className={`pointer-events-auto transition-all duration-300 p-3 sm:p-4 ${widthOpt.widthClass} ${preset.containerClasses} ${textAlignClass} shadow-2xl max-h-[38vh] overflow-y-auto custom-scrollbar`}
      >
        {/* Título da Caixa de Texto */}
        {overlay.showTitle !== false && overlay.title && overlay.title.trim() !== '' && (
          <div className={`text-[10px] sm:text-xs mb-1 flex items-center gap-1.5 ${textAlignClass === 'text-center' ? 'justify-center' : textAlignClass === 'text-right' ? 'justify-end' : 'justify-start'} ${customTitleFontClass}`}>
            <span>{overlay.title}</span>
          </div>
        )}

        {/* Texto / Fala / Narração */}
        {overlay.text && (
          <p className={`${isTvMode ? 'text-sm sm:text-base md:text-lg leading-relaxed' : fontOpt.class} ${customFontClass} leading-relaxed break-words`}>
            &ldquo;{overlay.text}&rdquo;
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 p-2 sm:p-3 overflow-hidden ${opacityClass} ${className}`}>
      {/* Caixas com Posicionamento Livre */}
      {freePositionOverlays.map((ov) => renderOverlayBox(ov, true))}

      {/* Caixas com Posicionamento por Zona */}
      {Object.entries(groupedOverlays).map(([posKey, items]) => {
        if (items.length === 0) return null;
        const pos = posKey as OverlayBoxPosition;
        return (
          <div
            key={pos}
            className={`absolute flex flex-col gap-2.5 max-w-full ${getPositionClasses(pos)}`}
          >
            {items.map((ov) => renderOverlayBox(ov, false))}
          </div>
        );
      })}
    </div>
  );
};
