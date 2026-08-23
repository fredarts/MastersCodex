'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Scroll,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Stamp,
  Feather,
  Bookmark,
} from 'lucide-react';
import { ReadableContent } from '@/lib/types';
import { useAudio } from '@/context/AudioContext';

interface BG3ReadableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  readableContent: ReadableContent;
}

export const BG3ReadableModal: React.FC<BG3ReadableModalProps> = ({
  isOpen,
  onClose,
  title,
  readableContent,
}) => {
  const { playDiceSound } = useAudio();
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  if (!isOpen) return null;

  const type = readableContent.readableType || 'book';
  const isParchmentOrLetter = type === 'letter' || type === 'note' || type === 'scroll';
  const isTomeOrDiary = type === 'tome' || type === 'diary' || type === 'book';

  // Normalize pages or fallback to single page
  const pages =
    readableContent.pages && readableContent.pages.length > 0
      ? readableContent.pages
      : [readableContent.content || 'Nenhum texto registrado.'];

  const totalPages = pages.length;
  const activePageText = pages[currentPageIndex] || '';

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      try {
        playDiceSound();
      } catch {}
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      try {
        playDiceSound();
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Container with Theme Styling */}
      {isParchmentOrLetter ? (
        /* 📜 TEMA 1: PERGAMINHO / CARTA COM SELO DE CERA */
        <div className="relative w-full max-w-2xl bg-[#fef7ee] text-[#2c1810] rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.95)] border-4 border-[#8c6239]/60 p-8 md:p-10 flex flex-col max-h-[88vh] overflow-hidden">
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 text-[#8c6239]/40 text-xl select-none font-serif">❧</div>
          <div className="absolute top-2 right-2 text-[#8c6239]/40 text-xl select-none font-serif">☙</div>
          <div className="absolute bottom-2 left-2 text-[#8c6239]/40 text-xl select-none font-serif">❧</div>
          <div className="absolute bottom-2 right-2 text-[#8c6239]/40 text-xl select-none font-serif">☙</div>

          {/* Wax Seal Header */}
          <div className="flex items-start justify-between border-b-2 border-[#8c6239]/30 pb-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-700 to-red-950 border-2 border-amber-600/60 flex items-center justify-center shadow-lg shadow-red-950/50 text-amber-200 font-bold">
                <Stamp className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-black tracking-wide text-[#3b2314]">
                  {readableContent.title || title}
                </h2>
                <div className="flex items-center gap-2 text-xs font-serif text-[#7c532e] mt-0.5">
                  {readableContent.author && <span>Por: {readableContent.author}</span>}
                  {readableContent.dateOrHeader && <span>• {readableContent.dateOrHeader}</span>}
                  {readableContent.language && (
                    <span className="bg-[#ebd5b3] px-2 py-0.5 rounded text-[10px] font-bold text-[#573516]">
                      {readableContent.language}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7c532e] hover:text-[#2c1810] hover:bg-[#ebd5b3]/60 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Letter Body Text */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 font-serif text-sm md:text-base leading-relaxed text-[#3b2314]/90 whitespace-pre-line selection:bg-[#ebd5b3]">
            {activePageText}
          </div>

          {/* Footer & Pagination */}
          <div className="flex items-center justify-between border-t-2 border-[#8c6239]/30 pt-4 mt-4 text-xs font-serif text-[#7c532e]">
            {totalPages > 1 ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="px-3 py-1 bg-[#ebd5b3] hover:bg-[#dfc49c] disabled:opacity-30 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <span className="font-bold">
                  Página {currentPageIndex + 1} de {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPageIndex === totalPages - 1}
                  className="px-3 py-1 bg-[#ebd5b3] hover:bg-[#dfc49c] disabled:opacity-30 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  Próxima <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="italic flex items-center gap-1.5 text-[11px]">
                <Feather className="w-3.5 h-3.5" /> Texto preservado na íntegra.
              </span>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#4a2e1b] hover:bg-[#382011] text-[#fef7ee] font-serif font-bold rounded-lg transition-all shadow-md cursor-pointer"
            >
              Guardar Carta
            </button>
          </div>
        </div>
      ) : (
        /* 📖 TEMA 2: TOMO ANTIGO DE COURO COM FECHO DE BRONZE (BG3 GRIMOIRE) */
        <div className="relative w-full max-w-3xl bg-[#1e1510] text-[#eedcc5] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.98)] border-4 border-[#b48a52]/80 p-1 flex flex-col max-h-[90vh] overflow-hidden">
          {/* Gilded Inner Frame */}
          <div className="relative w-full h-full bg-[#120d0a] border-2 border-[#825e30]/60 rounded-xl p-6 md:p-8 flex flex-col overflow-hidden">
            {/* Bronze Corner Brackets */}
            <div className="absolute top-2 left-2 text-[#b48a52] font-mono text-sm select-none">❖</div>
            <div className="absolute top-2 right-2 text-[#b48a52] font-mono text-sm select-none">❖</div>
            <div className="absolute bottom-2 left-2 text-[#b48a52] font-mono text-sm select-none">❖</div>
            <div className="absolute bottom-2 right-2 text-[#b48a52] font-mono text-sm select-none">❖</div>

            {/* Book Header */}
            <div className="flex items-start justify-between border-b border-[#825e30]/40 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#825e30]/30 to-[#b48a52]/10 border border-[#b48a52]/50 flex items-center justify-center text-[#e9c792] shadow-inner font-serif">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-serif font-black tracking-wide text-[#e9c792] flex items-center gap-2">
                    {readableContent.title || title}
                    <span className="text-[10px] font-sans font-bold bg-[#b48a52]/20 text-[#e9c792] px-2 py-0.5 rounded-full border border-[#b48a52]/30">
                      {type === 'diary' ? 'Diário' : 'Tomo Antigo'}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 text-xs font-serif text-[#a88a64] mt-0.5">
                    {readableContent.author && <span>Autor: {readableContent.author}</span>}
                    {readableContent.dateOrHeader && <span>• {readableContent.dateOrHeader}</span>}
                    {readableContent.language && <span>• Idioma: {readableContent.language}</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#a88a64] hover:text-[#eedcc5] hover:bg-[#825e30]/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Book Content (Aged Page Simulation) */}
            <div className="flex-1 overflow-y-auto pr-3 space-y-4 font-serif text-sm md:text-base leading-relaxed text-[#eedcc5]/90 whitespace-pre-line selection:bg-[#825e30]/60 p-4 bg-[#1a130e]/80 rounded-xl border border-[#825e30]/30">
              {activePageText}
            </div>

            {/* Book Footer & Controls */}
            <div className="flex items-center justify-between border-t border-[#825e30]/40 pt-4 mt-4 text-xs font-serif text-[#a88a64]">
              {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPageIndex === 0}
                    className="px-3 py-1.5 bg-[#2a1d15] hover:bg-[#3d2b1f] disabled:opacity-30 text-[#e9c792] border border-[#825e30]/40 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <span className="font-bold px-2 text-[#e9c792]">
                    Página {currentPageIndex + 1} de {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex === totalPages - 1}
                    className="px-3 py-1.5 bg-[#2a1d15] hover:bg-[#3d2b1f] disabled:opacity-30 text-[#e9c792] border border-[#825e30]/40 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    Próxima <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="italic flex items-center gap-1.5 text-[11px]">
                  <Bookmark className="w-3.5 h-3.5 text-[#b48a52]" /> Tomo encadernado em couro nobre.
                </span>
              )}

              <button
                onClick={onClose}
                className="px-5 py-2 bg-gradient-to-r from-[#b48a52] to-[#825e30] hover:from-[#c89c5f] hover:to-[#966d38] text-slate-950 font-serif font-black rounded-xl transition-all shadow-lg shadow-amber-900/30 cursor-pointer"
              >
                Fechar Tomo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
