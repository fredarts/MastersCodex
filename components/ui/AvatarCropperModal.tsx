import React, { useState, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, Move } from 'lucide-react';

export interface AvatarSettings {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

interface AvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialSettings?: AvatarSettings;
  onSaveSettings: (settings: AvatarSettings) => void;
}

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  initialSettings,
  onSaveSettings
}) => {
  const [zoomLevel, setZoomLevel] = useState(initialSettings?.zoom || 1);
  const [panPosition, setPanPosition] = useState({ 
    x: initialSettings?.offsetX || 0, 
    y: initialSettings?.offsetY || 0 
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setZoomLevel(initialSettings?.zoom || 1);
      setPanPosition({ 
        x: initialSettings?.offsetX || 0, 
        y: initialSettings?.offsetY || 0 
      });
    }
  }, [isOpen, initialSettings]);

  if (!isOpen || !imageUrl) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    const newZoom = Math.min(Math.max(zoomLevel + delta, 0.5), 5);
    setZoomLevel(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleSave = () => {
    onSaveSettings({
      zoom: zoomLevel,
      offsetX: panPosition.x,
      offsetY: panPosition.y
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-[#141b2d] border border-amber-500/30 rounded-3xl p-6 shadow-2xl max-w-md w-full flex flex-col items-center space-y-6">
        
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-black uppercase text-amber-400 flex items-center gap-2">
            <Move className="w-4 h-4" />
            Ajustar Enquadramento
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center px-4">
          Arraste a imagem para reposicionar e use o scroll do mouse (ou os botões abaixo) para aplicar zoom. O formato abaixo é como o avatar aparecerá na ficha.
        </p>

        {/* CONTAINER DO CROP (Máscara) */}
        <div 
          className="w-64 h-64 rounded-3xl bg-[#0b0f19] border-2 border-amber-500/50 overflow-hidden relative shadow-inner cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img 
            src={imageUrl} 
            alt="Crop Area" 
            onLoad={(e) => setAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
            className="absolute max-w-none pointer-events-none select-none transition-transform duration-75"
            style={{ 
              width: aspect >= 1 ? 'auto' : '100%',
              height: aspect >= 1 ? '100%' : 'auto',
              minWidth: aspect >= 1 ? '100%' : 'auto',
              minHeight: aspect >= 1 ? 'auto' : '100%',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${panPosition.x}px), calc(-50% + ${panPosition.y}px)) scale(${zoomLevel})` 
            }}
          />
          
          {/* Overlay grid (opcional para ajudar no alinhamento) */}
          <div className="absolute inset-0 pointer-events-none border border-white/10 flex items-center justify-center">
            <div className="w-[33%] h-full border-x border-white/5 absolute left-1/3" />
            <div className="h-[33%] w-full border-y border-white/5 absolute top-1/3" />
          </div>
        </div>

        {/* CONTROLES DE ZOOM MANUAIS */}
        <div className="flex items-center gap-3 bg-[#0b0f19] p-2 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500" 
              style={{ width: `${Math.min(((zoomLevel - 0.5) / 4.5) * 100, 100)}%` }} 
            />
          </div>

          <button 
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 5))}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-transform active:scale-95"
        >
          <Check className="w-5 h-5" />
          Salvar Enquadramento
        </button>

      </div>
    </div>
  );
};
