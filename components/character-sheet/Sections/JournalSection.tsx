import React, { useState, useMemo } from 'react';
import {
  CharacterSheet,
  PlayerJournalEntry,
  PersonalQuest,
  PersonalQuestObjective,
} from '@/lib/types';
import {
  ScrollText,
  BookMarked,
  Target,
  Plus,
  Trash2,
  Pin,
  Search,
  CheckCircle2,
  Circle,
  Tag,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckSquare,
  Trophy,
  Lightbulb,
  Network,
} from 'lucide-react';
import { DetectivePinboardModal } from '@/components/investigation/DetectivePinboardModal';

interface JournalSectionProps {
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({ sheet, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'journal' | 'quests'>('journal');
  const [isPersonalPinboardOpen, setIsPersonalPinboardOpen] = useState(false);

  // Estados do Diário
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [journalSearch, setJournalSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Estados das Missões
  const [questStatusFilter, setQuestStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'failed'>('all');
  const [questSearch, setQuestSearch] = useState('');
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);
  const [newObjectiveText, setNewObjectiveText] = useState<{ [questId: string]: string }>({});
  const [newClueText, setNewClueText] = useState<{ [questId: string]: string }>({});

  const entries: PlayerJournalEntry[] = useMemo(() => sheet.journalEntries || [], [sheet.journalEntries]);
  const quests: PersonalQuest[] = useMemo(() => sheet.personalQuests || [], [sheet.personalQuests]);

  // Sincroniza a primeira entrada selecionada
  React.useEffect(() => {
    if (entries.length > 0 && !selectedEntryId) {
      setSelectedEntryId(entries[0].id);
    } else if (entries.length === 0) {
      setSelectedEntryId(null);
    }
  }, [entries, selectedEntryId]);

  // Lista de tags únicas
  const allTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [entries]);

  // Entradas filtradas
  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        const matchesSearch =
          journalSearch.trim() === '' ||
          e.title.toLowerCase().includes(journalSearch.toLowerCase()) ||
          e.content.toLowerCase().includes(journalSearch.toLowerCase()) ||
          e.tags?.some((t) => t.toLowerCase().includes(journalSearch.toLowerCase()));

        const matchesTag = !tagFilter || e.tags?.includes(tagFilter);

        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (b.sessionNumber || 0) - (a.sessionNumber || 0);
      });
  }, [entries, journalSearch, tagFilter]);

  const activeEntry = useMemo(
    () => entries.find((e) => e.id === selectedEntryId) || null,
    [entries, selectedEntryId]
  );

  // Missões filtradas
  const filteredQuests = useMemo(() => {
    return quests.filter((q) => {
      const matchesStatus = questStatusFilter === 'all' || q.status === questStatusFilter;
      const matchesSearch =
        questSearch.trim() === '' ||
        q.title.toLowerCase().includes(questSearch.toLowerCase()) ||
        q.description.toLowerCase().includes(questSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [quests, questStatusFilter, questSearch]);

  // Estatísticas Rápidas
  const activeQuestsCount = quests.filter((q) => q.status === 'in_progress').length;
  const completedQuestsCount = quests.filter((q) => q.status === 'completed').length;

  // --- OPERAÇÕES DO DIÁRIO ---
  const handleAddEntry = () => {
    const newEntry: PlayerJournalEntry = {
      id: `entry-${Date.now()}`,
      title: `Registro de Sessão #${entries.length + 1}`,
      content: '',
      sessionNumber: entries.length + 1,
      realDate: new Date().toLocaleDateString('pt-BR'),
      tags: [],
      isPinned: false,
    };
    const updated = [newEntry, ...entries];
    onChange({ ...sheet, journalEntries: updated });
    setSelectedEntryId(newEntry.id);
  };

  const handleUpdateActiveEntry = (updatedFields: Partial<PlayerJournalEntry>) => {
    if (!activeEntry) return;
    const updatedEntries = entries.map((e) =>
      e.id === activeEntry.id ? { ...e, ...updatedFields } : e
    );
    onChange({ ...sheet, journalEntries: updatedEntries });
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    onChange({ ...sheet, journalEntries: updated });
    if (selectedEntryId === id) {
      setSelectedEntryId(updated[0]?.id || null);
    }
  };

  const handleAddTag = (tag: string) => {
    if (!activeEntry || !tag.trim()) return;
    const currentTags = activeEntry.tags || [];
    if (!currentTags.includes(tag.trim())) {
      handleUpdateActiveEntry({ tags: [...currentTags, tag.trim()] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeEntry) return;
    const currentTags = activeEntry.tags || [];
    handleUpdateActiveEntry({ tags: currentTags.filter((t) => t !== tagToRemove) });
  };

  // --- OPERAÇÕES DAS MISSÕES ---
  const handleAddQuest = () => {
    const newQuest: PersonalQuest = {
      id: `quest-${Date.now()}`,
      title: 'Nova Missão Pessoal',
      description: 'Descreva seu objetivo pessoal ou mistério a resolver...',
      status: 'in_progress',
      category: 'personal',
      objectives: [
        { id: `obj-${Date.now()}-1`, text: 'Primeira etapa ou pista a investigar', completed: false },
      ],
      clues: [],
      rewardsNotes: '',
      createdAt: new Date().toLocaleDateString('pt-BR'),
    };
    const updated = [newQuest, ...quests];
    onChange({ ...sheet, personalQuests: updated });
    setExpandedQuestId(newQuest.id);
  };

  const handleUpdateQuest = (questId: string, updatedFields: Partial<PersonalQuest>) => {
    const updated = quests.map((q) => (q.id === questId ? { ...q, ...updatedFields } : q));
    onChange({ ...sheet, personalQuests: updated });
  };

  const handleDeleteQuest = (questId: string) => {
    const updated = quests.filter((q) => q.id !== questId);
    onChange({ ...sheet, personalQuests: updated });
  };

  const handleToggleObjective = (questId: string, objId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;
    const updatedObjectives = targetQuest.objectives.map((o) =>
      o.id === objId ? { ...o, completed: !o.completed } : o
    );
    handleUpdateQuest(questId, { objectives: updatedObjectives });
  };

  const handleAddObjective = (questId: string) => {
    const text = newObjectiveText[questId]?.trim();
    if (!text) return;
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;

    const newObj: PersonalQuestObjective = {
      id: `obj-${Date.now()}`,
      text,
      completed: false,
    };
    handleUpdateQuest(questId, { objectives: [...targetQuest.objectives, newObj] });
    setNewObjectiveText((prev) => ({ ...prev, [questId]: '' }));
  };

  const handleDeleteObjective = (questId: string, objId: string) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;
    handleUpdateQuest(questId, {
      objectives: targetQuest.objectives.filter((o) => o.id !== objId),
    });
  };

  const handleAddClue = (questId: string) => {
    const clue = newClueText[questId]?.trim();
    if (!clue) return;
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;

    const clues = targetQuest.clues || [];
    handleUpdateQuest(questId, { clues: [...clues, clue] });
    setNewClueText((prev) => ({ ...prev, [questId]: '' }));
  };

  const handleDeleteClue = (questId: string, clueIndex: number) => {
    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest) return;
    const clues = (targetQuest.clues || []).filter((_, idx) => idx !== clueIndex);
    handleUpdateQuest(questId, { clues });
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-in select-none lg:flex lg:flex-col lg:h-full lg:overflow-hidden lg:min-h-0">
      
      {/* CABEÇALHO & SELETOR DE SUB-ABAS */}
      <div className="bg3-panel rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider font-serif">
              Diário Pessoal & Missões do Jogador
            </h2>
            <p className="text-[10px] text-slate-400 font-serif">
              Registre notas secretas, teorias, diário de bordo e acompanhe seus objetivos individuais.
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS COM CONTADORES */}
        <div className="flex items-center gap-1.5 bg-[#0b0f19] p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('journal')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-serif transition-all ${
              activeSubTab === 'journal'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            <span>Diário de Bordo</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSubTab === 'journal' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-amber-400'
            }`}>
              {entries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('quests')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-serif transition-all ${
              activeSubTab === 'quests'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Missões Pessoais</span>
            <div className="flex items-center gap-1">
              {activeQuestsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeSubTab === 'quests' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {activeQuestsCount} ativas
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsPersonalPinboardOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-serif transition-all bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-200 cursor-pointer shadow-sm"
            title="Abrir Mural de Investigação e Fios Vermelhos"
          >
            <span>🕵️</span>
            <span>Mural de Pistas</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 lg:min-h-0 lg:overflow-hidden">
        
        {/* ======================================================== */}
        {/* SUB-ABA 1: DIÁRIO DE BORDO & NOTAS SECRETAS              */}
        {/* ======================================================== */}
        {activeSubTab === 'journal' && (
          <div className="h-full flex flex-col lg:grid lg:grid-cols-12 lg:gap-4 lg:min-h-0">
            
            {/* COLUNA ESQUERDA: LISTA DE ENTRADAS & FILTROS (4 COLUNAS) */}
            <div className="lg:col-span-4 flex flex-col space-y-3 lg:h-full lg:overflow-hidden">
              
              {/* BARRA DE AÇÕES DA LISTA */}
              <div className="bg3-panel rounded-2xl p-3 space-y-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar notas..."
                      value={journalSearch}
                      onChange={(e) => setJournalSearch(e.target.value)}
                      className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEntry}
                    className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl font-bold text-xs transition-colors shrink-0 shadow-md font-serif"
                    title="Adicionar Novo Registro"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo</span>
                  </button>
                </div>

                {/* FILTRO RÁPIDO DE TAGS */}
                {allTags.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setTagFilter(null)}
                      className={`text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold whitespace-nowrap transition-colors ${
                        tagFilter === null
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      Todas
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                        className={`text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                          tagFilter === tag
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Tag className="w-2.5 h-2.5" />
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LISTA SCROLLÁVEL DE CARDS */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 bg3-scrollbar min-h-[220px] lg:min-h-0">
                {filteredEntries.length === 0 ? (
                  <div className="bg3-panel rounded-2xl p-6 text-center text-slate-500 space-y-2">
                    <BookMarked className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                    <p className="text-xs font-serif">Nenhum registro encontrado.</p>
                    <button
                      type="button"
                      onClick={handleAddEntry}
                      className="text-xs text-amber-400 hover:underline font-bold font-serif"
                    >
                      + Criar primeira anotação
                    </button>
                  </div>
                ) : (
                  filteredEntries.map((entry) => {
                    const isSelected = selectedEntryId === entry.id;
                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedEntryId(entry.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isSelected
                            ? 'bg-[#1a233a] border-amber-500/60 shadow-lg'
                            : 'bg3-panel border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {entry.isPinned && (
                                <span className="flex items-center gap-0.5 text-[9px] text-amber-400 font-bold bg-amber-500/15 px-1.5 py-0.2 rounded-md">
                                  <Pin className="w-2.5 h-2.5 fill-amber-400" />
                                  Fixada
                                </span>
                              )}
                              {entry.sessionNumber && (
                                <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-md">
                                  Sessão #{entry.sessionNumber}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500 font-mono">
                                {entry.realDate}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-200 truncate font-serif">
                              {entry.title || 'Sem título'}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEntry(entry.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {entry.content && (
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 font-serif leading-relaxed">
                            {entry.content}
                          </p>
                        )}

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {entry.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[8px] font-mono text-slate-400 bg-[#0b0f19] px-1.5 py-0.5 rounded border border-slate-800"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUNA DIREITA: EDITOR DO REGISTRO SELECIONADO (8 COLUNAS) */}
            <div className="lg:col-span-8 bg3-panel rounded-2xl p-4 flex flex-col space-y-3 lg:h-full lg:overflow-hidden mt-3 lg:mt-0">
              {activeEntry ? (
                <>
                  {/* CABEÇALHO DO EDITOR */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/10 pb-3 shrink-0">
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={activeEntry.title}
                        onChange={(e) => handleUpdateActiveEntry({ title: e.target.value })}
                        placeholder="Título do Registro / Assunto..."
                        className="w-full bg-transparent text-sm sm:text-base font-bold text-amber-300 placeholder-slate-600 focus:outline-none font-serif"
                      />
                      <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <input
                            type="text"
                            value={activeEntry.inGameDate || ''}
                            onChange={(e) => handleUpdateActiveEntry({ inGameDate: e.target.value })}
                            placeholder="Data no Mundo (Ex: 14 de Mirtul)"
                            className="bg-[#0b0f19] border border-slate-700/60 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="font-mono text-slate-500">Sessão:</span>
                          <input
                            type="number"
                            value={activeEntry.sessionNumber || ''}
                            onChange={(e) =>
                              handleUpdateActiveEntry({
                                sessionNumber: e.target.value ? parseInt(e.target.value, 10) : undefined,
                              })
                            }
                            placeholder="#"
                            className="w-12 bg-[#0b0f19] border border-slate-700/60 rounded px-1 py-0.5 text-[10px] text-center text-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* AÇÕES DA NOTA ATIVA */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleUpdateActiveEntry({ isPinned: !activeEntry.isPinned })}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                          activeEntry.isPinned
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-[#0b0f19] text-slate-400 border-slate-800 hover:text-white'
                        }`}
                        title="Fixar no topo"
                      >
                        <Pin className={`w-3.5 h-3.5 ${activeEntry.isPinned ? 'fill-amber-400' : ''}`} />
                        <span>{activeEntry.isPinned ? 'Fixada' : 'Fixar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(activeEntry.id)}
                        className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        title="Excluir este registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* GERENCIAMENTO DE TAGS */}
                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    <Tag className="w-3.5 h-3.5 text-slate-500" />
                    {activeEntry.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-[10px] font-mono bg-[#0b0f19] text-amber-300/90 border border-slate-800 px-2 py-0.5 rounded-lg group"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-slate-500 hover:text-rose-400 font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="+ tag"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag(newTagInput);
                          }
                        }}
                        className="bg-[#0b0f19] border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 w-20 focus:w-28 focus:outline-none focus:border-amber-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* ÁREA DE TEXTO DO DIÁRIO */}
                  <div className="flex-1 flex flex-col lg:min-h-0">
                    <textarea
                      rows={12}
                      value={activeEntry.content}
                      onChange={(e) => handleUpdateActiveEntry({ content: e.target.value })}
                      placeholder="Escreva aqui os segredos descobertos na sessão, conversas com NPCs, nomes importantes, planos estratégicos ou sentimentos do seu personagem..."
                      className="w-full flex-1 bg-[#0b0f19]/80 border border-slate-700/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-serif leading-relaxed resize-none bg3-scrollbar"
                    />
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                  <BookMarked className="w-12 h-12 text-slate-600 opacity-40" />
                  <p className="text-sm font-serif">Selecione uma entrada ao lado ou crie uma nova para começar seu diário.</p>
                  <button
                    type="button"
                    onClick={handleAddEntry}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs transition-transform active:scale-95 shadow-md font-serif"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Primeira Anotação</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SUB-ABA 2: MISSÕES & OBJETIVOS PESSOAIS                   */}
        {/* ======================================================== */}
        {activeSubTab === 'quests' && (
          <div className="h-full flex flex-col space-y-4 lg:min-h-0 lg:overflow-hidden">
            
            {/* BARRA DE FILTROS & AÇÕES DAS MISSÕES */}
            <div className="bg3-panel rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar missões e pistas..."
                    value={questSearch}
                    onChange={(e) => setQuestSearch(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* FILTROS POR STATUS */}
                <div className="flex items-center bg-[#0b0f19] p-0.5 rounded-xl border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setQuestStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-serif transition-all ${
                      questStatusFilter === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({quests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestStatusFilter('in_progress')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-serif transition-all ${
                      questStatusFilter === 'in_progress'
                        ? 'bg-amber-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Em Andamento ({activeQuestsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestStatusFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-serif transition-all ${
                      questStatusFilter === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Concluídas ({completedQuestsCount})
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddQuest}
                className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 shrink-0 font-serif"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Missão Pessoal</span>
              </button>
            </div>

            {/* LISTA EM GRID DE MISSÕES */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 bg3-scrollbar lg:min-h-0 pb-6">
              {filteredQuests.length === 0 ? (
                <div className="bg3-panel rounded-2xl p-8 text-center text-slate-500 space-y-3">
                  <Target className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
                  <p className="text-sm font-serif">Nenhuma missão pessoal cadastrada nesta categoria.</p>
                  <button
                    type="button"
                    onClick={handleAddQuest}
                    className="text-xs text-amber-400 hover:underline font-bold font-serif"
                  >
                    + Criar objetivo pessoal para o personagem
                  </button>
                </div>
              ) : (
                filteredQuests.map((quest) => {
                  const isExpanded = expandedQuestId === quest.id;
                  const totalObjs = quest.objectives.length;
                  const completedObjs = quest.objectives.filter((o) => o.completed).length;
                  const progressPct = totalObjs > 0 ? Math.round((completedObjs / totalObjs) * 100) : 0;

                  return (
                    <div
                      key={quest.id}
                      className={`bg3-panel rounded-2xl border transition-all overflow-hidden ${
                        quest.status === 'completed'
                          ? 'border-emerald-500/30 bg-[#0d1c16]/30'
                          : quest.status === 'failed'
                          ? 'border-rose-500/30 bg-[#1c0d0d]/30'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* BARRA SUPERIOR DO CARD */}
                      <div
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                        onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* STATUS BADGE */}
                            <select
                              value={quest.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleUpdateQuest(quest.id, {
                                  status: e.target.value as PersonalQuest['status'],
                                  completedAt: e.target.value === 'completed' ? new Date().toLocaleDateString('pt-BR') : undefined,
                                })
                              }
                              className={`text-[10px] font-bold font-serif uppercase px-2 py-0.5 rounded-lg border focus:outline-none cursor-pointer ${
                                quest.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : quest.status === 'failed'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <option value="in_progress">⚔️ Em Andamento</option>
                              <option value="completed">🏆 Concluída</option>
                              <option value="failed">💀 Falhada</option>
                            </select>

                            {/* CATEGORIA */}
                            <select
                              value={quest.category || 'personal'}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleUpdateQuest(quest.id, {
                                  category: e.target.value as PersonalQuest['category'],
                                })
                              }
                              className="text-[9px] font-mono text-slate-400 bg-[#0b0f19] border border-slate-800 rounded px-1.5 py-0.5 focus:outline-none"
                            >
                              <option value="personal">Pessoal / Background</option>
                              <option value="faction">Facção / Guilda</option>
                              <option value="mystery">Mistério / Segredo</option>
                            </select>

                            {quest.createdAt && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                Criada em {quest.createdAt}
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            value={quest.title}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateQuest(quest.id, { title: e.target.value })}
                            placeholder="Título da Missão Pessoal..."
                            className="w-full bg-transparent text-sm sm:text-base font-bold text-amber-300 focus:outline-none font-serif placeholder-slate-600"
                          />
                        </div>

                        {/* PROGRESSO E EXPANDIR */}
                        <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-serif">Objetivos:</span>
                              <span className="text-xs font-mono font-bold text-amber-400">
                                {completedObjs}/{totalObjs} ({progressPct}%)
                              </span>
                            </div>
                            <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700/50">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  quest.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-amber-600 to-amber-400'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedQuestId(isExpanded ? null : quest.id)}
                            className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 border border-slate-700"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuest(quest.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Excluir Missão"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* CONTEÚDO EXPANDIDO */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-amber-500/10 space-y-4 animate-fade-in bg-[#0b0f19]/40">
                          
                          {/* DESCRIÇÃO DA MISSÃO */}
                          <div className="space-y-1 pt-3">
                            <label className="text-[10px] font-bold text-slate-400 font-serif uppercase tracking-wider flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-amber-400" />
                              Descrição & Motivação do Personagem
                            </label>
                            <textarea
                              rows={2}
                              value={quest.description}
                              onChange={(e) => handleUpdateQuest(quest.id, { description: e.target.value })}
                              placeholder="O que move seu personagem nesta busca? Por que isso é vital para sua história?"
                              className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-250 focus:outline-none focus:border-amber-500 font-serif"
                            />
                          </div>

                          {/* CHECKLIST DE ETAPAS / OBJETIVOS */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 font-serif uppercase tracking-wider flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                                Etapas & Objetivos da Missão
                              </label>
                            </div>

                            <div className="space-y-1.5">
                              {quest.objectives.map((obj) => (
                                <div
                                  key={obj.id}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                                    obj.completed
                                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                                      : 'bg-[#0b0f19] border-slate-800 text-slate-200'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleToggleObjective(quest.id, obj.id)}
                                    className="text-amber-400 hover:text-amber-300 transition-colors shrink-0"
                                  >
                                    {obj.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-slate-500" />
                                    )}
                                  </button>

                                  <input
                                    type="text"
                                    value={obj.text}
                                    onChange={(e) => {
                                      const updatedObjs = quest.objectives.map((o) =>
                                        o.id === obj.id ? { ...o, text: e.target.value } : o
                                      );
                                      handleUpdateQuest(quest.id, { objectives: updatedObjs });
                                    }}
                                    className={`flex-1 bg-transparent text-xs focus:outline-none font-serif ${
                                      obj.completed ? 'line-through text-slate-500' : 'text-slate-200'
                                    }`}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteObjective(quest.id, obj.id)}
                                    className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}

                              {/* ADICIONAR NOVO OBJETIVO */}
                              <div className="flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  placeholder="+ Adicionar novo objetivo ou etapa..."
                                  value={newObjectiveText[quest.id] || ''}
                                  onChange={(e) =>
                                    setNewObjectiveText((prev) => ({ ...prev, [quest.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddObjective(quest.id);
                                    }
                                  }}
                                  className="flex-1 bg-[#0b0f19] border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-serif"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddObjective(quest.id)}
                                  className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors font-serif"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionar</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* PISTAS & EVIDÊNCIAS DESCOBERTAS */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 font-serif uppercase tracking-wider flex items-center gap-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                                Pistas & Evidências Coletadas
                              </label>
                              <div className="space-y-1">
                                {(quest.clues || []).map((clue, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 bg-[#0b0f19] border border-slate-800 p-2 rounded-xl text-xs text-slate-300 font-serif"
                                  >
                                    <span>🔍 {clue}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteClue(quest.id, idx)}
                                      className="text-slate-500 hover:text-rose-400"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <input
                                    type="text"
                                    placeholder="+ Anotar pista encontrada..."
                                    value={newClueText[quest.id] || ''}
                                    onChange={(e) =>
                                      setNewClueText((prev) => ({ ...prev, [quest.id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddClue(quest.id);
                                      }
                                    }}
                                    className="flex-1 bg-[#0b0f19] border border-slate-700/60 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-serif"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddClue(quest.id)}
                                    className="p-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* RECOMPENSAS / NOTAS FINAIS */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-400 font-serif uppercase tracking-wider flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                Recompensas, Legado ou Promessas
                              </label>
                              <textarea
                                rows={3}
                                value={quest.rewardsNotes || ''}
                                onChange={(e) => handleUpdateQuest(quest.id, { rewardsNotes: e.target.value })}
                                placeholder="Itens prometidos, honra de clã, títulos conquistados ou vingança cumprida..."
                                className="w-full bg-[#0b0f19] border border-slate-700/80 rounded-xl p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-serif resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal do Mural de Investigação Pessoal */}
      <DetectivePinboardModal
        isOpen={isPersonalPinboardOpen}
        onClose={() => setIsPersonalPinboardOpen(false)}
        initialScope="personal"
      />
    </div>
  );
};
