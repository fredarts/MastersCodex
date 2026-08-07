'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Wand2, AlertCircle, Search } from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { WorldEntity } from '@/lib/types';

interface WorldEntityAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    name: string;
    subType: string;
    shortDesc: string;
    fullContent: string;
    extraAttr1: string;
    extraAttr2: string;
  }) => void;
  categoryContext: {
    categoryTitle: string;
    namePlaceholder: string;
    attr1Label: string;
    attr2Label: string;
  };
  worldEntities: WorldEntity[];
  currentEntityId?: string;
}

const translateCategory = (cat: string): string => {
  const map: Record<string, string> = {
    npc: 'NPC / Personagem',
    location: 'Localização / Geografia',
    faction: 'Facção ou Guilda',
    religion: 'Religião ou Deus',
    lore_event: 'Evento Histórico',
    species: 'Espécie / Raça',
    ethnicity: 'Etnia / Cultura',
    tradition: 'Tradição / Ritual',
    profession: 'Profissão / Título',
    natural_law: 'Lei Natural / Fenômeno',
    spell: 'Feitiço / Magia',
    disease: 'Doença / Condição',
    item: 'Item / Artefato',
    material: 'Recurso / Material',
    technology: 'Tecnologia / Veículo',
    document: 'Documento / Registro',
    language: 'Idioma / Dialeto',
    military_conflict: 'Conflito Militar',
    military_unit: 'Unidade Militar',
    currency: 'Moeda / Monetário',
    trade_route: 'Rota Comercial',
    beast: 'Monstro / Criatura',
    flora: 'Flora / Planta',
  };
  return map[cat] || cat;
};

export const WorldEntityAiGeneratorModal: React.FC<WorldEntityAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApply,
  categoryContext,
  worldEntities = [],
  currentEntityId,
}) => {
  const { settings } = useUserSettings();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for context selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<WorldEntity[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Clear state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedEntities([]);
      setIsDropdownOpen(false);
    }
  }, [isOpen]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filter out current and already selected entities
  const availableEntities = worldEntities.filter(
    (ent) => ent.id !== currentEntityId && !selectedEntities.some((sel) => sel.id === ent.id)
  );

  // Filter based on search query
  const filteredEntities = availableEntities.filter((ent) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      ent.name.toLowerCase().includes(query) ||
      (ent.subType || '').toLowerCase().includes(query) ||
      translateCategory(ent.category).toLowerCase().includes(query)
    );
  });

  const handleSelectEntity = (ent: WorldEntity) => {
    setSelectedEntities((prev) => [...prev, ent]);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleRemoveEntity = (id: string) => {
    setSelectedEntities((prev) => prev.filter((ent) => ent.id !== id));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, insira uma descrição da entidade.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    // Format entity context to markdown format for systemPrompt context injection
    const contextText = selectedEntities.length > 0
      ? selectedEntities.map(ent => {
          let detail = `- **${ent.name}** [${translateCategory(ent.category)}${ent.subType ? ` - ${ent.subType}` : ''}]: ${ent.shortDesc}`;
          if (ent.fullContent) {
            const truncated = ent.fullContent.length > 400
              ? ent.fullContent.slice(0, 400) + '...'
              : ent.fullContent;
            detail += `\n  Lore/Detalhes: ${truncated}`;
          }
          return detail;
        }).join('\n\n')
      : undefined;

    try {
      const response = await fetch('/api/ai/generate-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          categoryTitle: categoryContext.categoryTitle,
          namePlaceholder: categoryContext.namePlaceholder,
          attr1Label: categoryContext.attr1Label,
          attr2Label: categoryContext.attr2Label,
          userSettings: settings,
          contextText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar entidade.');
      }

      onApply({
        name: data.name || '',
        subType: data.subType || '',
        shortDesc: data.shortDesc || '',
        fullContent: data.fullContent || '',
        extraAttr1: data.extraAttr1 || '',
        extraAttr2: data.extraAttr2 || '',
      });
      
      setPrompt('');
      setSelectedEntities([]);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in select-none">
      <div className="bg-[#121722] border-2 border-purple-500/50 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1b1933] to-[#121722] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Criador de Entidade com IA</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-purple-400 font-mono">
                {categoryContext.categoryTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin">
          <p className="text-sm text-slate-300 leading-relaxed font-serif">
            Descreva de forma livre como você imagina esta entidade. A IA vai preencher todo o formulário (nome, resumo, lore detalhada e atributos) baseando-se nas suas ideias.
          </p>

          {error && (
            <div className="bg-rose-950/90 border border-rose-500/60 p-3 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs font-semibold shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Contexto do Mundo */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Anexar Contexto do Mundo (Opcional)
            </label>
            
            {/* Lista de chips das entidades anexadas */}
            {selectedEntities.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-[#0a0d14] border border-[#2a3449]/50 rounded-xl animate-fade-in">
                {selectedEntities.map((ent) => (
                  <div
                    key={ent.id}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-full transition-all"
                  >
                    <span className="text-[9px] uppercase font-bold text-purple-400 font-mono">
                      {translateCategory(ent.category)}
                    </span>
                    <span className="font-semibold text-slate-100 text-xs">{ent.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEntity(ent.id)}
                      className="p-0.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-full transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input e Dropdown de seleção */}
            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar entidade por nome ou categoria (ex: Reino, Rei)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  disabled={isGenerating}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500/70 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 focus:outline-none transition-all placeholder:text-slate-500 disabled:opacity-50"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#0d111b] border border-[#2a3449] rounded-xl shadow-2xl z-50 divide-y divide-[#2a3449]/40 scrollbar-thin">
                  {filteredEntities.length > 0 ? (
                    filteredEntities.map((ent) => (
                      <button
                        key={ent.id}
                        type="button"
                        onClick={() => handleSelectEntity(ent)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#161f30] transition-colors flex items-center justify-between group"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                            {ent.name}
                          </span>
                          {ent.subType && (
                            <span className="text-[10px] text-slate-400 truncate">
                              {ent.subType}
                            </span>
                          )}
                        </div>
                        <span className="flex-shrink-0 text-[9px] uppercase font-mono tracking-wider font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {translateCategory(ent.category)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-500 text-center font-serif">
                      Nenhuma outra entidade encontrada para anexar
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            disabled={isGenerating}
            placeholder="Ex: Quero um dragão ancião que não cospe fogo, mas sim um veneno cristalizado. Ele vive nas montanhas antigas e tem um culto de elfos corrompidos que o veneram..."
            className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-xl p-4 text-sm text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed disabled:opacity-50"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2a3449] bg-[#0f141d]">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-slate-100 font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Gerando (Pode levar uns segundos)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Preencher Formulário Mágicamente</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
