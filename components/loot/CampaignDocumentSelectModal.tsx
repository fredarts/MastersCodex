'use client';

import React, { useState, useMemo } from 'react';
import { useCampaign } from '@/context/CampaignContext';
import { CampaignDocumentItem, ReadableItemType } from '@/lib/types';
import { DocumentTypeIcon } from '@/components/icons/DocumentIcons';
import { Search, X, BookOpen, Plus, Check, Layers } from 'lucide-react';

interface CampaignDocumentSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (document: CampaignDocumentItem) => void;
  title?: string;
}

export const CampaignDocumentSelectModal: React.FC<CampaignDocumentSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectDocument,
  title = 'Inserir Documento / Lore da Campanha',
}) => {
  const { activeCampaign } = useCampaign();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const documents = useMemo(() => {
    return activeCampaign?.documents || [];
  }, [activeCampaign?.documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchType = selectedType === 'all' || doc.documentType === selectedType;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        doc.name.toLowerCase().includes(search) ||
        (doc.author && doc.author.toLowerCase().includes(search)) ||
        (doc.readableContent?.content && doc.readableContent.content.toLowerCase().includes(search));

      return matchType && matchSearch;
    });
  }, [documents, selectedType, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-5 text-slate-100 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">{title}</h3>
              <p className="text-[11px] text-slate-400">
                Selecione uma carta, livro, diário ou bilhete da campanha ativa ({activeCampaign?.title || 'Campanha'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar documento por título, autor ou texto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'letter', label: '✉️ Cartas' },
              { id: 'note', label: '📝 Bilhetes' },
              { id: 'diary', label: '📔 Diários' },
              { id: 'book', label: '📖 Livros' },
              { id: 'tome', label: '🔮 Tomos' },
              { id: 'scroll', label: '📜 Pergaminhos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista / Grade de Documentos */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[220px] max-h-[400px]">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-300 font-bold">Nenhum documento encontrado na campanha</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Você pode criar e gerar manuscritos com IA no Painel da Campanha (aba Documentos & Lore).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredDocs.map((doc) => {
                const pageCount = doc.readableContent?.pages?.length || 1;

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      onSelectDocument(doc);
                      onClose();
                    }}
                    className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/60 rounded-xl cursor-pointer transition flex flex-col justify-between gap-2 group hover:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:scale-105 transition-transform">
                            <DocumentTypeIcon type={doc.documentType} size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1">
                              {doc.name}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {doc.author ? `Por: ${doc.author}` : 'Autor Anônimo'}
                            </p>
                          </div>
                        </div>

                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400/90 shrink-0">
                          {doc.documentType === 'letter'
                            ? 'Carta'
                            : doc.documentType === 'note'
                            ? 'Bilhete'
                            : doc.documentType === 'diary'
                            ? 'Diário'
                            : doc.documentType === 'book'
                            ? 'Livro'
                            : doc.documentType === 'tome'
                            ? 'Tomo'
                            : 'Pergaminho'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 italic font-serif leading-relaxed bg-slate-900/60 p-1.5 rounded border border-slate-800/60">
                        {doc.readableContent?.content || 'Sem texto.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                      {pageCount > 1 ? <span>{pageCount} páginas</span> : <span>Página única</span>}
                      <span className="text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <Plus className="w-3 h-3" /> Inserir no Baú
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'documento disponível' : 'documentos disponíveis'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
