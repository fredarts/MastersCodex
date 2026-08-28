'use client';

import React, { useState, useEffect } from 'react';
import { ProgressClock, ClockSegmentCount, ClockCategory } from '@/lib/types';
import { ProgressClockWidget } from './ProgressClockWidget';
import { 
  Plus, 
  Clock, 
  Crown, 
  ShieldAlert, 
  Footprints, 
  Sparkles, 
  Flame, 
  Filter, 
  Trash2,
  X,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

interface FactionClocksManagerProps {
  campaignId: string;
  isDm?: boolean;
  onClocksChange?: (clocks: ProgressClock[]) => void;
}

const STORAGE_KEY_PREFIX = 'masters_codex_clocks_';

export const FactionClocksManager: React.FC<FactionClocksManagerProps> = ({
  campaignId,
  isDm = true,
  onClocksChange,
}) => {
  const [clocks, setClocks] = useState<ProgressClock[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalSegments, setTotalSegments] = useState<ClockSegmentCount>(6);
  const [category, setCategory] = useState<ClockCategory>('danger');
  const [isPublic, setIsPublic] = useState(true);
  const [colorHex, setColorHex] = useState('#f59e0b');
  const [completedMessage, setCompletedMessage] = useState('');

  // Load from localStorage
  useEffect(() => {
    if (!campaignId) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${campaignId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setClocks(parsed);
      } else {
        // Relógios de demonstração padrão se vazio
        const defaultClocks: ProgressClock[] = [
          {
            id: 'clock-1',
            campaignId,
            title: 'Alarme da Guarda da Cidadela',
            description: 'Guardas investigam barulhos suspeitos nas masmorras.',
            totalSegments: 6,
            filledSegments: 2,
            category: 'stealth',
            colorHex: '#a855f7',
            isPublic: true,
            completedMessage: '🚨 A Guarda foi alertada em peso!',
          },
          {
            id: 'clock-2',
            campaignId,
            title: 'Ritual de Sangue do Culto',
            description: 'O Culto do Olho Sangrento conclui a invocação abissal.',
            totalSegments: 8,
            filledSegments: 5,
            category: 'ritual',
            colorHex: '#f43f5e',
            isPublic: false,
            completedMessage: '🔥 O Avatar Demoníaco foi invocado!',
          },
          {
            id: 'clock-3',
            campaignId,
            title: 'Influência da Guilda dos Ladrões',
            description: 'Subornos e infiltração na câmara dos nobres.',
            totalSegments: 4,
            filledSegments: 1,
            category: 'faction',
            colorHex: '#f59e0b',
            isPublic: true,
            completedMessage: '👑 A Guilda controla as decisões da corte.',
          },
        ];
        setClocks(defaultClocks);
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${campaignId}`, JSON.stringify(defaultClocks));
      }
    } catch (e) {
      console.error('Erro ao carregar relógios:', e);
    }
  }, [campaignId]);

  const saveClocks = (newClocks: ProgressClock[]) => {
    setClocks(newClocks);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${campaignId}`, JSON.stringify(newClocks));
      onClocksChange?.(newClocks);
    } catch (e) {
      console.error('Erro ao salvar relógios:', e);
    }
  };

  const handleUpdateClock = (updated: ProgressClock) => {
    const updatedList = clocks.map((c) => (c.id === updated.id ? updated : c));
    saveClocks(updatedList);
    toast.success(`Relógio "${updated.title}" atualizado (${updated.filledSegments}/${updated.totalSegments})`);
  };

  const handleDeleteClock = (id: string) => {
    const updatedList = clocks.filter((c) => c.id !== id);
    saveClocks(updatedList);
    toast.info('Relógio excluído com sucesso.');
  };

  const handleCreateClock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Informe um título para o relógio.');
      return;
    }

    const newClock: ProgressClock = {
      id: `clock-${Date.now()}`,
      campaignId,
      title: title.trim(),
      description: description.trim() || undefined,
      totalSegments,
      filledSegments: 0,
      category,
      colorHex,
      isPublic,
      completedMessage: completedMessage.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveClocks([...clocks, newClock]);
    toast.success(`Relógio de ${totalSegments} fatias criado com sucesso!`);
    setIsCreateModalOpen(false);

    // Reset form
    setTitle('');
    setDescription('');
    setCompletedMessage('');
  };

  const filteredClocks = clocks.filter((c) => {
    if (!isDm && !c.isPublic) return false;
    if (activeCategoryFilter === 'all') return true;
    return c.category === activeCategoryFilter;
  });

  return (
    <div className="w-full h-full flex flex-col p-4 bg-[#0a0d14] text-slate-100 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-black text-amber-400 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Relógios de Progresso & Facções (Progress Clocks)
          </h2>
          <p className="text-xs text-slate-400">
            Rastreie ameaças, rituais, furtividade, planos de vilões e influência de facções em tempo real.
          </p>
        </div>

        {isDm && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Relógio
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 py-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'Todos', icon: <Layers className="w-3.5 h-3.5" /> },
          { id: 'danger', label: 'Perigo / Ameaça', icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> },
          { id: 'stealth', label: 'Furtividade / Alarme', icon: <Footprints className="w-3.5 h-3.5 text-purple-400" /> },
          { id: 'ritual', label: 'Rituais', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
          { id: 'faction', label: 'Facções', icon: <Crown className="w-3.5 h-3.5 text-amber-400" /> },
          { id: 'quest', label: 'Missões', icon: <Flame className="w-3.5 h-3.5 text-emerald-400" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategoryFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
              activeCategoryFilter === tab.id
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Grid de Relógios */}
      {filteredClocks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl my-4">
          <Clock className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-400">Nenhum relógio encontrado nesta categoria</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Clique em "Novo Relógio" para adicionar um círculo de 4, 6, 8 ou 12 fatias e criar tensão na mesa.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
          {filteredClocks.map((clock) => (
            <ProgressClockWidget
              key={clock.id}
              clock={clock}
              isInteractive={isDm}
              onUpdate={handleUpdateClock}
              onDelete={handleDeleteClock}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação de Relógio */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f1420] border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Criar Novo Relógio de Progresso
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Título do Relógio</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforços Goblinoides, Ritual Cósmico, Alarme"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição / Consequência</label>
                <textarea
                  rows={2}
                  placeholder="O que acontece a cada segmento ou ao completar o relógio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Número de Fatias</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([4, 6, 8, 12] as ClockSegmentCount[]).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTotalSegments(count)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          totalSegments === count
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ClockCategory)}
                    className="w-full bg-[#080c14] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="danger">Perigo / Ameaça</option>
                    <option value="stealth">Furtividade / Alarme</option>
                    <option value="ritual">Ritual / Magia</option>
                    <option value="faction">Facção / Poder</option>
                    <option value="quest">Missão / Jornada</option>
                    <option value="general">Geral</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Visibilidade</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        isPublic
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Público
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPublic(false)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        !isPublic
                          ? 'bg-purple-600 text-white border-purple-500 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Secreto (DM)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cor do Preenchimento</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-10 h-8 rounded-lg bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{colorHex}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Mensagem de Conclusão (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: O teto da caverna desaba sobre os aventureiros!"
                  value={completedMessage}
                  onChange={(e) => setCompletedMessage(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Criar Relógio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
