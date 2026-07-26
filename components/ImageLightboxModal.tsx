'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, currentIndex]);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Touch / Tablet Swipe Handler
  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      handleNext();
    } else if (isRightSwipe && images.length > 1) {
      handlePrev();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Lightbox Content Container */}
      <div
        className="relative max-w-6xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent clicking on content from closing
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Top Controls */}
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-between text-slate-300 px-2">
          <span className="text-xs font-mono font-bold bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            className="p-2 bg-slate-900/80 hover:bg-rose-600 hover:text-white text-slate-300 rounded-full transition-all border border-slate-700 active:scale-95"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Image */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-2xl bg-black flex items-center justify-center max-h-[80vh]">
          <img
            src={images[currentIndex]}
            alt={`Imagem ${currentIndex + 1}`}
            className="max-h-[80vh] max-w-full object-contain transition-all duration-300"
          />
        </div>

        {/* Carousel Navigation Buttons (Visible when > 1 image) */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all active:scale-90"
              title="Anterior (Seta Esquerda)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-slate-900/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all active:scale-90"
              title="Próxima (Seta Direita)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
