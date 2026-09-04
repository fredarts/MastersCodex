import { useEffect, useState, useCallback } from 'react';

export interface UseOmnibarOptions {
  enableSlashShortcut?: boolean;
}

export function useOmnibarShortcuts(options: UseOmnibarOptions = {}) {
  const { enableSlashShortcut = true } = options;
  const [isOpen, setIsOpen] = useState(false);

  const openOmnibar = useCallback(() => setIsOpen(true), []);
  const closeOmnibar = useCallback(() => setIsOpen(false), []);
  const toggleOmnibar = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Atalhos Globais Seguros (Sem conflito com a barra de endereços do Chrome no Windows):
      // - Alt + K (Primário)
      // - Ctrl + Shift + P / Cmd + Shift + P (Padrão VS Code / Command Palette)
      // - Ctrl + / (Padrão de Ajuda & Ações)
      const isAltK = e.altKey && (e.key === 'k' || e.key === 'K');
      const isCtrlShiftP = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P');
      const isCtrlSlash = (e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?');

      if (isAltK || isCtrlShiftP || isCtrlSlash) {
        e.preventDefault();
        e.stopPropagation();
        toggleOmnibar();
        return;
      }

      // 2. Atalho Rápido de Barra (/): apenas se não estiver digitando em um input/textarea
      if (enableSlashShortcut && e.key === '/' && !isOpen && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const activeElement = document.activeElement;
        const isInputField =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable);

        if (!isInputField) {
          e.preventDefault();
          openOmnibar();
        }
      }

      // 3. Escape: fecha a modal se aberta
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeOmnibar();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, toggleOmnibar, openOmnibar, closeOmnibar, enableSlashShortcut]);

  return {
    isOpen,
    setIsOpen,
    openOmnibar,
    closeOmnibar,
    toggleOmnibar,
  };
}
