'use client';

import React, { useEffect } from 'react';
import { CompendiumView } from './CompendiumView';

interface CompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompendiumModal: React.FC<CompendiumModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <CompendiumView isModal onClose={onClose} />
      </div>
    </div>
  );
};

