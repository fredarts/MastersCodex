'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface ZoomableImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ZoomableImageModal: React.FC<ZoomableImageModalProps> = ({ isOpen, onClose, imageUrl }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPanX: 0, initialPanY: 0 });

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageUrl]);

  if (!isOpen || !imageUrl) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY * -0.002;
    setZoomLevel((prev) => Math.min(Math.max(Number((prev + delta).toFixed(2)), 0.5), 6));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPanX: panPosition.x,
      initialPanY: panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    setPanPosition({
      x: dragStartRef.current.initialPanX + deltaX,
      y: dragStartRef.current.initialPanY + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTransform = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomLevel > 1.2) {
      resetTransform();
    } else {
      setZoomLevel(2.5);
    }
  };

  const closeImageModal = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-4 backdrop-blur-md select-none animate-fade-in overflow-hidden"
      onClick={closeImageModal}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controles Flutuantes Topo */}
      <div
        className="absolute top-4 inset-x-0 mx-auto w-fit flex items-center gap-2 bg-[#0c1018]/90 border border-amber-500/40 px-3.5 py-1.5 rounded-full shadow-2xl z-[160] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] font-mono font-bold text-amber-300 mr-1 flex items-center gap-1">
          <Move className="w-3.5 h-3.5 text-amber-400" />
          {Math.round(zoomLevel * 100)}%
        </span>

        <button
          onClick={() => setZoomLevel((prev) => Math.min(Number((prev + 0.3).toFixed(2)), 6))}
          className="p-1.5 bg-[#172030] hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all cursor-pointer"
          title="Aumentar Zoom (ou use a roda do mouse)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoomLevel((prev) => Math.max(Number((prev - 0.3).toFixed(2)), 0.5))}
          className="p-1.5 bg-[#172030] hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all cursor-pointer"
          title="Diminuir Zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={resetTransform}
          className="p-1.5 bg-[#172030] hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all cursor-pointer"
          title="Resetar Zoom e Posição (100%)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" />

        <button
          onClick={closeImageModal}
          className="p-1.5 bg-rose-950/80 hover:bg-rose-600 text-rose-200 hover:text-white rounded-full transition-all cursor-pointer border border-rose-500/40"
          title="Fechar Visualização"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dica de Uso */}
      <div className="absolute bottom-4 inset-x-0 mx-auto w-fit text-[10px] font-mono text-slate-400 bg-black/60 px-3 py-1 rounded-full border border-slate-800 pointer-events-none">
        💡 Use o scroll do mouse para Zoom • Clique e arraste para Mover (Pan) • Duplo clique para 2x/Reset
      </div>

      {/* Imagem com Transform Pan & Zoom */}
      <div
        className="relative max-w-full max-h-full flex items-center justify-center transition-transform"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        <img
          src={imageUrl}
          alt="Visual Ampliado"
          className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl shadow-2xl border border-amber-500/30 pointer-events-none select-none bg-black/40"
          draggable={false}
        />
      </div>
    </div>
  );
};
