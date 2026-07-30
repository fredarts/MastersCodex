import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomableImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
}

export const ZoomableImageModal: React.FC<ZoomableImageModalProps> = ({ isOpen, onClose, imageUrl }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!isOpen || !imageUrl) return null;

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.005;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 0.5), 5);
    setZoomLevel(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const closeImageModal = () => {
    onClose();
    setTimeout(() => {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }, 200);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={closeImageModal}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Controles */}
      <div 
         className="absolute top-4 right-4 flex items-center gap-2 z-[110]"
         onClick={(e) => e.stopPropagation()}
      >
         <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
            title="Aumentar Zoom"
         >
            <ZoomIn className="w-5 h-5" />
         </button>
         <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-colors cursor-pointer"
            title="Diminuir Zoom"
         >
            <ZoomOut className="w-5 h-5" />
         </button>
         <button 
            onClick={closeImageModal}
            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors ml-2 cursor-pointer"
            title="Fechar"
         >
            <X className="w-5 h-5" />
         </button>
      </div>

      {/* Imagem */}
      <div 
         className={`relative max-w-full max-h-full flex items-center justify-center transition-transform ${isDragging ? 'duration-0' : 'duration-200'}`}
         onClick={(e) => e.stopPropagation()}
         onMouseDown={handleMouseDown}
         style={{ 
           transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
           cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
         }}
      >
        <img 
          src={imageUrl} 
          alt="Visual Ampliado" 
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none" 
        />
      </div>
    </div>
  );
};
