'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, X, Save, Trash2, Copy, Check, Eye, Edit3 } from 'lucide-react';
import { MentionTextarea } from '@/components/ui/MentionTextarea';
import { WikiTextRenderer } from '@/components/ui/WikiTextRenderer';
import { useWorld } from '@/lib/hooks/useWorld';

interface DMNotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string | null;
}

export const DMNotebookDrawer: React.FC<DMNotebookDrawerProps> = ({
  isOpen,
  onClose,
  campaignId,
}) => {
  const storageKey = `masters_codex_dm_notebook_${campaignId || 'global'}`;
  const [notes, setNotes] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const { worldEntities } = useWorld();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setNotes(saved);
      }
    } catch (_e) {}
  }, [storageKey]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    try {
      localStorage.setItem(storageKey, val);
      setLastSaved(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    } catch (_e) {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Deseja limpar todas as anotações do bloco de notas?')) {
      setNotes('');
      try {
        localStorage.removeItem(storageKey);
      } catch (_e) {}
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-[#0a0e17] border-l border-[#1e293b] shadow-2xl z-50 flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-[#0d1220]">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Caderno de Anotações do DM
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsReadingMode(!isReadingMode)}
            className={`p-1.5 rounded transition-colors text-xs font-bold flex items-center gap-1 ${
              isReadingMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={isReadingMode ? 'Voltar para Edição' : 'Modo Leitura com Links Wiki'}
          >
            {isReadingMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Copiar Anotações"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
            title="Limpar Anotações"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor or Wiki Reading Area */}
      <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
        {isReadingMode ? (
          <div className="w-full h-full bg-[#05080f] border border-[#1e293b] rounded-lg p-3 text-xs text-slate-200 overflow-y-auto font-serif leading-relaxed custom-scrollbar">
            {notes.trim() ? (
              <WikiTextRenderer text={notes} worldEntities={worldEntities} />
            ) : (
              <p className="text-slate-600 italic">Caderno vazio. Alterne para o modo de edição para escrever.</p>
            )}
          </div>
        ) : (
          <MentionTextarea
            value={notes}
            onChangeValue={handleNotesChange}
            worldEntities={worldEntities}
            placeholder="Escreva aqui suas ideias rápidas, reviravoltas, estatísticas secretas... Digite @ para vincular monstros, magias, itens e NPCs."
            className="h-full resize-none font-mono leading-relaxed"
            containerClassName="h-full flex-1"
            rows={15}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-[#1e293b] bg-[#0d1220] flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Save className="w-3 h-3 text-emerald-500" /> Auto-salvo
        </span>
        {lastSaved && <span>Salvo às {lastSaved}</span>}
      </div>
    </div>
  );
};
