'use client';

import React, { useState, useMemo } from 'react';
import { useCampaign } from '@/context/CampaignContext';
import { usePartyLoot } from '@/context/PartyLootContext';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { CampaignDocumentItem, ReadableItemType, ReadableContent } from '@/lib/types';
import { documentToEquipmentItem, createDefaultCampaignDocument } from '@/lib/utils/campaignDocumentUtils';
import { DocumentTypeIcon } from '@/components/icons/DocumentIcons';
import { BG3ReadableModal } from '@/components/loot/BG3ReadableModal';
import {
  Search,
  Plus,
  Sparkles,
  BookOpen,
  Send,
  Trash2,
  Edit3,
  Eye,
  Filter,
  Check,
  X,
  Clock,
  Loader2,
  FileText,
  HelpCircle,
  Copy,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const CampaignDocumentsStudio: React.FC = () => {
  const { activeCampaign, updateCampaign } = useCampaign();
  const { createLootSession } = usePartyLoot();
  const { settings } = useUserSettings();

  const documents = useMemo(() => {
    return activeCampaign?.documents || [];
  }, [activeCampaign?.documents]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [readingDoc, setReadingDoc] = useState<CampaignDocumentItem | null>(null);
  const [editingDoc, setEditingDoc] = useState<CampaignDocumentItem | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<CampaignDocumentItem | null>(null);

  // Form State para Edição / Criação Manual
  const [formData, setFormData] = useState<Partial<CampaignDocumentItem>>({});

  // AI Generator Modal Form
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDocType, setAiDocType] = useState<ReadableItemType>('letter');
  const [aiThemePreset, setAiThemePreset] = useState('Pista de Investigação');
  const [aiTone, setAiTone] = useState('Misterioso & Sombrio');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const documentTypes: { type: ReadableItemType; label: string; desc: string }[] = [
    { type: 'letter', label: 'Carta', desc: 'Pergaminho antigo com selo de cera' },
    { type: 'note', label: 'Bilhete', desc: 'Pedaço de papel rasgado ou recado clandestino' },
    { type: 'diary', label: 'Diário', desc: 'Caderno encadernado em couro com páginas' },
    { type: 'book', label: 'Livro', desc: 'Crônica histórica ou conto lendário' },
    { type: 'tome', label: 'Tomo Arcano', desc: 'Grimório místico com encantamentos e runas' },
    { type: 'scroll', label: 'Pergaminho', desc: 'Édito formal, decreto sagrado ou profecia' },
  ];

  const aiPresets = [
    {
      label: '🔍 Pista de Crime / Assassinato',
      prompt: 'Uma pista encontrada sobre o mandante de um assassinato na corte nobre.',
      type: 'letter' as const,
    },
    {
      label: '🧪 Diário de Alquimista Louco',
      prompt: 'Páginas de diário detalhando experimentos proibidos com uma substância misteriosa.',
      type: 'diary' as const,
    },
    {
      label: '✉️ Bilhete de Ameaça / Chantagem',
      prompt: 'Um recado apressado exigindo que os aventureiros parem de investigar as catacumbas.',
      type: 'note' as const,
    },
    {
      label: '🔮 Tomo com Ritual Esquecido',
      prompt: 'Um tratado arcano detalhando as etapas para abrir um portal para os Planos Sombrios.',
      type: 'tome' as const,
    },
    {
      label: '👑 Édito Real / Ordem Secreta',
      prompt: 'Uma proclamação selada do Conselho Real ordenando a prisão de dissidentes.',
      type: 'scroll' as const,
    },
    {
      label: '📖 Lenda de uma Arma Ancestral',
      prompt: 'Um conto histórico descrevendo a forja e o local de repouso de uma espada mágica.',
      type: 'book' as const,
    },
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchType = selectedTypeFilter === 'all' || doc.documentType === selectedTypeFilter;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        doc.name.toLowerCase().includes(search) ||
        (doc.author && doc.author.toLowerCase().includes(search)) ||
        (doc.notes && doc.notes.toLowerCase().includes(search)) ||
        (doc.readableContent?.content && doc.readableContent.content.toLowerCase().includes(search));

      return matchType && matchSearch;
    });
  }, [documents, selectedTypeFilter, searchTerm]);

  // Salvar ou Atualizar Documento na Campanha
  const handleSaveDocument = async (docToSave: CampaignDocumentItem) => {
    if (!activeCampaign) return;

    const existingIndex = documents.findIndex((d) => d.id === docToSave.id);
    let updatedDocs: CampaignDocumentItem[];

    if (existingIndex >= 0) {
      updatedDocs = documents.map((d) => (d.id === docToSave.id ? docToSave : d));
    } else {
      updatedDocs = [docToSave, ...documents];
    }

    const updatedCampaign = {
      ...activeCampaign,
      documents: updatedDocs,
    };

    await updateCampaign(updatedCampaign);
    setEditingDoc(null);
    toast.success(`Documento "${docToSave.name}" salvo com sucesso!`);
  };

  // Excluir Documento da Campanha
  const handleDeleteDocument = async (docId: string) => {
    if (!activeCampaign) return;

    const updatedDocs = documents.filter((d) => d.id !== docId);
    const updatedCampaign = {
      ...activeCampaign,
      documents: updatedDocs,
    };

    await updateCampaign(updatedCampaign);
    setDocToDelete(null);
    toast.success('Documento removido da campanha.');
  };

  // Enviar Documento diretamente para o Baú da Party
  const handleSendToPartyChest = async (doc: CampaignDocumentItem) => {
    const item = documentToEquipmentItem(doc);

    await createLootSession({
      title: `Recompensa de Lore: ${doc.name}`,
      description: `Documento da campanha disponibilizado para o grupo.`,
      distributionMode: 'free_for_all',
      currency: { po: 0, pp: 0, pe: 0, pc: 0, pl: 0 },
      items: [item as any],
    });

    toast.success(`"${doc.name}" enviado com sucesso para o Baú da Party!`);
  };

  // Disparar Geração por IA
  const handleGenerateAiLore = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Por favor, informe uma ideia ou selecione um preset para a IA gerar o texto.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/generate-lore-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          documentType: aiDocType,
          theme: aiThemePreset,
          tone: aiTone,
          campaignContext: activeCampaign?.description || activeCampaign?.title,
          userSettings: settings,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar texto com a IA');
      }

      const data = await res.json();
      const generatedContent = (
        data.content ||
        (Array.isArray(data.pages) ? data.pages.join('\n\n') : '') ||
        data.notes ||
        'Texto do manuscrito gerado pela IA.'
      ).trim();

      const generatedPages = Array.isArray(data.pages) && data.pages.length > 0
        ? data.pages
        : [generatedContent];

      const newDoc: CampaignDocumentItem = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        campaignId: activeCampaign?.id || 'default_campaign',
        name: data.name || 'Novo Documento de Lore',
        documentType: data.documentType || aiDocType,
        author: data.author || 'Anônimo',
        dateOrHeader: data.dateOrHeader || '',
        language: data.language || 'Comum',
        notes: data.notes || '',
        readableContent: {
          isReadable: true,
          readableType: data.documentType || aiDocType,
          title: data.name,
          author: data.author,
          dateOrHeader: data.dateOrHeader,
          language: data.language,
          pages: generatedPages,
          content: generatedContent,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await handleSaveDocument(newDoc);
      setIsAiModalOpen(false);
      setAiPrompt('');
      toast.success(`✨ Documento "${newDoc.name}" criado com auxílio da IA!`);
    } catch (err: any) {
      console.error('Erro na IA:', err);
      toast.error(err?.message || 'Erro ao gerar documento com IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const openNewDocModal = (type: ReadableItemType = 'letter') => {
    const base = createDefaultCampaignDocument(activeCampaign?.id || 'default_campaign', type);
    setFormData(base);
    setEditingDoc(base);
  };

  return (
    <div className="space-y-6">
      {/* Top Header com Resumo e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Biblioteca de Documentos & Lore da Campanha
              <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                {documents.length} {documents.length === 1 ? 'manuscrito' : 'manuscritos'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crie cartas, diários, livros e segredos com suporte de IA e coloque-os em baús ou entregue à party.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/20 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
            <span>Gerar com IA</span>
          </button>

          <button
            type="button"
            onClick={() => openNewDocModal('letter')}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Documento</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Barra de Pesquisa */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por título, autor, pista ou conteúdo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500/60 transition"
          />
        </div>

        {/* Pílulas de Filtro por Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
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
              onClick={() => setSelectedTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedTypeFilter === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade de Inventário de Manuscritos */}
      {filteredDocs.length === 0 ? (
        <div className="py-16 px-4 text-center space-y-3 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <BookOpen className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Nenhum manuscrito encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {searchTerm || selectedTypeFilter !== 'all'
              ? 'Tente ajustar os termos de pesquisa ou filtros.'
              : 'Esta campanha ainda não possui documentos de lore criados. Comece criando um bilhete, carta ou gerando com IA!'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Gerar Lore com IA</span>
            </button>
            <button
              type="button"
              onClick={() => openNewDocModal('letter')}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Manualmente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const pageCount = doc.readableContent?.pages?.length || 1;

            return (
              <div
                key={doc.id}
                className="group relative bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-md hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
              >
                {/* Header do Card com Ícone SVG */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <DocumentTypeIcon type={doc.documentType} size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {doc.author && <span>Por: <strong className="text-slate-300">{doc.author}</strong></span>}
                          {doc.language && <span>• {doc.language}</span>}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400/90 whitespace-nowrap">
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

                  {/* Cabeçalho de data ou remetente */}
                  {doc.dateOrHeader && (
                    <p className="text-[11px] font-mono text-amber-400/80 italic line-clamp-1 mb-1.5">
                      &quot;{doc.dateOrHeader}&quot;
                    </p>
                  )}

                  {/* Prévia do Conteúdo */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-serif">
                    {doc.readableContent?.content || 'Nenhum texto informado.'}
                  </p>

                  {pageCount > 1 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                      <Layers className="w-3 h-3" />
                      <span>{pageCount} páginas de leitura</span>
                    </div>
                  )}
                </div>

                {/* Ações do Card */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setReadingDoc(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-700/50 rounded-xl font-bold transition cursor-pointer"
                    title="Ler este documento no visual imersivo BG3"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>📖 Ler</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSendToPartyChest(doc)}
                      className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg transition cursor-pointer"
                      title="Enviar cópia deste documento para o Baú da Party"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData(doc);
                        setEditingDoc(doc);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition cursor-pointer"
                      title="Editar documento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Excluir documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal do Leitor BG3 */}
      {readingDoc && (
        <BG3ReadableModal
          isOpen={Boolean(readingDoc)}
          onClose={() => setReadingDoc(null)}
          title={readingDoc.name}
          readableContent={readingDoc.readableContent}
        />
      )}

      {/* Modal de Criação e Edição Manual */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                  <DocumentTypeIcon type={formData.documentType || 'letter'} size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-200">
                    {formData.id ? 'Editar Manuscrito de Lore' : 'Novo Manuscrito de Lore'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure os metadados, suporte visual e o texto lido pelos aventureiros.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tipo de Documento */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tipo do Suporte / Manuscrito:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {documentTypes.map((dt) => {
                  const isSelected = (formData.documentType || 'letter') === dt.type;
                  return (
                    <button
                      key={dt.type}
                      type="button"
                      onClick={() => setFormData({ ...formData, documentType: dt.type })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-center transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <DocumentTypeIcon type={dt.type} size={20} />
                      <span className="text-[10px] font-bold">{dt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos de Título e Autor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Título do Documento:</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carta Secreta do Lorde"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Autor / Remetente:</label>
                <input
                  type="text"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Ex: Arquimago Varis ou Anônimo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Cabeçalho de Data e Idioma */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Cabeçalho / Data / Local:</label>
                <input
                  type="text"
                  value={formData.dateOrHeader || ''}
                  onChange={(e) => setFormData({ ...formData, dateOrHeader: e.target.value })}
                  placeholder="Ex: Ao vigésimo dia da Lua Cheia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Idioma:</label>
                <input
                  type="text"
                  value={formData.language || 'Comum'}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  placeholder="Ex: Comum, Élfico, Dracônico..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Conteúdo do Texto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-400">
                  Conteúdo do Documento (Texto Completo):
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Para diários ou livros com várias páginas, separe com 3 traços (---)
                </span>
              </div>
              <textarea
                rows={7}
                value={formData.readableContent?.content || formData.notes || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const rawPages = val.split('\n---\n').map((p) => p.trim()).filter((p) => p.length > 0);
                  const pages = rawPages.length > 0 ? rawPages : [val];

                  setFormData({
                    ...formData,
                    notes: val.slice(0, 80) + '...',
                    readableContent: {
                      isReadable: true,
                      readableType: formData.documentType || 'letter',
                      title: formData.name || 'Documento',
                      author: formData.author,
                      dateOrHeader: formData.dateOrHeader,
                      language: formData.language,
                      content: val,
                      pages,
                    },
                  });
                }}
                placeholder="Digite o texto da carta ou livro aqui..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-serif leading-relaxed outline-none focus:border-amber-500"
              />
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!formData.name?.trim()) {
                    toast.error('Informe ao menos o título do documento.');
                    return;
                  }
                  const textContent = (
                    formData.readableContent?.content ||
                    (Array.isArray(formData.readableContent?.pages) ? formData.readableContent.pages.join('\n\n') : '') ||
                    formData.notes ||
                    'Texto do manuscrito registrado.'
                  ).trim();

                  const finalPages = Array.isArray(formData.readableContent?.pages) && formData.readableContent.pages.length > 0
                    ? formData.readableContent.pages
                    : [textContent];

                  const finalDoc: CampaignDocumentItem = {
                    id: formData.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    campaignId: activeCampaign?.id || 'default_campaign',
                    name: formData.name.trim(),
                    documentType: formData.documentType || 'letter',
                    author: formData.author?.trim() || '',
                    dateOrHeader: formData.dateOrHeader?.trim() || '',
                    language: formData.language?.trim() || 'Comum',
                    notes: formData.notes || textContent.slice(0, 80) + '...',
                    readableContent: {
                      isReadable: true,
                      readableType: formData.documentType || 'letter',
                      title: formData.name.trim(),
                      author: formData.author?.trim(),
                      dateOrHeader: formData.dateOrHeader?.trim(),
                      language: formData.language?.trim(),
                      content: textContent,
                      pages: finalPages,
                    },
                    createdAt: formData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  handleSaveDocument(finalDoc);
                }}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
              >
                Salvar Manuscrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Assistente de IA */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-purple-200">
                    Assistente de IA: Redator de Lore & Manuscritos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Crie cartas, enigmas, diários e livros com narrativa envolvente de fantasia.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Rápidos */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-purple-300 mb-1.5">
                Ideias Prontas & Ganchos de Aventura:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiPrompt(preset.prompt);
                      setAiDocType(preset.type);
                      setAiThemePreset(preset.label);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 text-left transition cursor-pointer flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-slate-200">{preset.label}</span>
                    <span className="text-[10px] font-mono text-purple-400">Usar</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Formato do Documento:</label>
                <select
                  value={aiDocType}
                  onChange={(e) => setAiDocType(e.target.value as ReadableItemType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                >
                  <option value="letter">✉️ Carta Antiga com Selo</option>
                  <option value="note">📝 Bilhete Rápido ou Pista</option>
                  <option value="diary">📔 Páginas de Diário Pessoal</option>
                  <option value="book">📖 Capítulo de Livro ou Lenda</option>
                  <option value="tome">🔮 Tomo Arcano / Grimório</option>
                  <option value="scroll">📜 Pergaminho com Decreto / Profecia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tom Narrativo:</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                >
                  <option value="Misterioso & Sombrio">Misterioso & Sombrio (Dark Fantasy)</option>
                  <option value="Erudito & Histórico">Erudito & Histórico (Crônicas)</option>
                  <option value="Urgente & Ameaçador">Urgente & Ameaçador (Pistas)</option>
                  <option value="Poético & Profético">Poético & Profético (Versos)</option>
                  <option value="Confidencial & Político">Confidencial & Político (Intrigas)</option>
                </select>
              </div>
            </div>

            {/* Prompt Livre do Mestre */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Instruções ou Detalhes para a IA:
              </label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Uma carta escrita pelo Duque alertando sobre monstros nas minas..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Footer com Botão de Geração */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                disabled={isGeneratingAi}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGenerateAiLore}
                disabled={isGeneratingAi}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                    <span>Redigindo Manuscrito...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Gerar Texto com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {docToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-100 text-sm">Excluir Manuscrito da Campanha?</h4>
                <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              Tem certeza de que deseja excluir permanentemente o documento{' '}
              <strong className="text-rose-300">&quot;{docToDelete.name}&quot;</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDocument(docToDelete.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
