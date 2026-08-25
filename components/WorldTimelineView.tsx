'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Filter, 
  Calendar as CalendarIcon, 
  Sparkles, 
  BookOpen, 
  Flame, 
  Trash2, 
  ArrowUpDown,
  Globe,
  History,
  Tag
} from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { WorldEntity } from '@/lib/types';

export const WorldTimelineView: React.FC = () => {
  const { activeWorld, worldEntities, createWorldEntity, deleteWorldEntity } = useWorld();
  const { calendarConfig } = useCampaignCalendar();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = antigo -> recente

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'lore_event' | 'military_conflict' | 'tradition'>('lore_event');
  const [eraName, setEraName] = useState('Primeira Era');
  const [isNegativeYear, setIsNegativeYear] = useState(false);
  const [yearNumber, setYearNumber] = useState<number | string>(100);
  const [yearSuffix, setYearSuffix] = useState(calendarConfig?.yearSuffix || 'DF');
  const [monthIndex, setMonthIndex] = useState<number | ''>('');
  const [dayNumber, setDayNumber] = useState<number | ''>('');
  const [desc, setDesc] = useState('');

  // Atualizar sufixo padrão quando calendarConfig mudar
  useEffect(() => {
    if (calendarConfig?.yearSuffix && !yearSuffix) {
      setYearSuffix(calendarConfig.yearSuffix);
    }
  }, [calendarConfig?.yearSuffix]);

  if (!activeWorld) return null;

  // Filter events (lore_event, military_conflict, tradition, or any entity with era/yearNumeric attribute)
  const timelineEntities = worldEntities.filter(
    (e) =>
      e.category === 'lore_event' ||
      e.category === 'military_conflict' ||
      e.category === 'tradition' ||
      (e.attributes && (e.attributes.era || e.attributes.yearNumeric !== undefined))
  );

  const filteredEntities = timelineEntities.filter((e) => {
    if (selectedCategory === 'all') return true;
    return e.category === selectedCategory;
  });

  // Data extraction helpers
  const getNumericYear = (e: WorldEntity): number => {
    if (typeof e.attributes?.yearNumeric === 'number') {
      return e.attributes.yearNumeric;
    }
    const text = e.attributes?.ano || e.attributes?.era || e.subType || '';
    const match = text.match(/-?\d+/);
    if (match) {
      let val = parseInt(match[0], 10);
      if (
        text.toLowerCase().includes('a.c') ||
        text.toLowerCase().includes('a.df') ||
        text.toLowerCase().includes('a.e') ||
        text.toLowerCase().includes('antes')
      ) {
        val = -Math.abs(val);
      }
      return val;
    }
    return 0;
  };

  const getMonthIndex = (e: WorldEntity): number => {
    if (typeof e.attributes?.monthIndex === 'number' && e.attributes.monthIndex >= 0) {
      return e.attributes.monthIndex;
    }
    return -1;
  };

  const getDayNumber = (e: WorldEntity): number => {
    if (typeof e.attributes?.day === 'number' && e.attributes.day > 0) {
      return e.attributes.day;
    }
    return 0;
  };

  // Sort chronologically
  const sortedEntities = [...filteredEntities].sort((a, b) => {
    const yA = getNumericYear(a);
    const yB = getNumericYear(b);
    if (yA !== yB) return sortOrder === 'asc' ? yA - yB : yB - yA;

    const mA = getMonthIndex(a);
    const mB = getMonthIndex(b);
    if (mA !== mB) return sortOrder === 'asc' ? mA - mB : mB - mA;

    const dA = getDayNumber(a);
    const dB = getDayNumber(b);
    return sortOrder === 'asc' ? dA - dB : dB - dA;
  });

  const handleAddTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedYear = Number(yearNumber) || 0;
    const numYear = isNegativeYear ? -Math.abs(parsedYear) : Math.abs(parsedYear);
    const formattedYear = isNegativeYear 
      ? `${Math.abs(numYear)} a.${yearSuffix || 'DF'}` 
      : `${numYear} ${yearSuffix || 'DF'}`;

    const selectedMonth =
      monthIndex !== '' &&
      typeof Number(monthIndex) === 'number' &&
      calendarConfig?.months?.[Number(monthIndex)];

    let dateStr = formattedYear;
    if (selectedMonth) {
      if (dayNumber) {
        dateStr = `${dayNumber} de ${selectedMonth.name}, ${formattedYear}`;
      } else {
        dateStr = `${selectedMonth.name}, ${formattedYear}`;
      }
    }

    const fullEraLabel = eraName ? `${eraName} • ${dateStr}` : dateStr;

    await createWorldEntity({
      worldId: activeWorld.id,
      category,
      name: title.trim(),
      subType: eraName || 'Era Histórica',
      status: 'active',
      shortDesc: desc || 'Evento registrado na cronologia do mundo.',
      attributes: {
        era: fullEraLabel,
        ano: formattedYear,
        yearNumeric: numYear,
        isNegativeYear,
        yearSuffix: yearSuffix || 'DF',
        monthIndex: monthIndex !== '' ? Number(monthIndex) : null,
        day: dayNumber ? Number(dayNumber) : null,
        eraName,
        formattedDate: dateStr,
      },
    });

    setTitle('');
    setDesc('');
    setShowAddModal(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'military_conflict':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <Flame className="w-3 h-3" /> Conflito Militar
          </span>
        );
      case 'tradition':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" /> Rito / Tradição
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Evento de Lore
          </span>
        );
    }
  };

  // Resgatar quantidade de dias do mês selecionado para o select de dias
  const currentMonthDays =
    monthIndex !== '' && calendarConfig?.months?.[Number(monthIndex)]
      ? calendarConfig.months[Number(monthIndex)].days
      : 30;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] overflow-hidden select-none p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2a3449]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
              SISTEMA INTEGRADO DE ANANIS & CRONOLOGIA
            </span>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" /> Cronologia & Linha do Tempo do Mundo
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Organize eras antigas (anos a.C./a.DF), guerras e cataclismos integrados ao calendário de {activeWorld.title}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Ordenação Button */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] rounded-xl text-xs font-bold text-slate-300 transition-colors"
            title="Alternar Ordenação Cronológica"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === 'asc' ? 'Cronológica (Mais Antigo → Recente)' : 'Inversa (Recente → Mais Antigo)'}</span>
          </button>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-[#121824] border border-[#2a3449] p-1 rounded-xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'all' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({timelineEntities.length})
            </button>
            <button
              onClick={() => setSelectedCategory('lore_event')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'lore_event' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Eventos
            </button>
            <button
              onClick={() => setSelectedCategory('military_conflict')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'military_conflict' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Guerras
            </button>
            <button
              onClick={() => setSelectedCategory('tradition')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === 'tradition' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tradições
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Evento</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto pt-6 pr-2">
        {sortedEntities.length === 0 ? (
          <div className="border-2 border-dashed border-[#2a3449] rounded-2xl p-10 text-center text-slate-500 bg-[#0f141d]/40 max-w-xl mx-auto mt-8">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-semibold text-slate-300 text-sm">Nenhum evento registrado nesta cronologia.</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crie eras históricas, grandes batalhas ou rituais ancestrais vinculados ao calendário do seu mundo.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
            >
              + Registrar Primeiro Evento Histórico
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-amber-500/30 space-y-6 ml-4">
            {sortedEntities.map((item, idx) => {
              const eraLabel = item.attributes?.era || item.subType || `Era ${idx + 1}`;
              const yearNum = getNumericYear(item);
              const isNegative = yearNum < 0 || item.attributes?.isNegativeYear;

              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-[#0a0d14] border-2 border-amber-500 flex items-center justify-center shadow-md group-hover:scale-125 group-hover:border-amber-300 transition-all">
                    <div className={`w-2 h-2 rounded-full ${isNegative ? 'bg-purple-400' : 'bg-amber-400'}`} />
                  </div>

                  {/* Card Content */}
                  <div className="p-5 rounded-2xl bg-[#161c28] border border-[#2a3449] hover:border-amber-500/50 shadow-lg transition-all flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getCategoryBadge(item.category)}
                        <span className="text-xs font-mono font-bold text-amber-400 bg-[#0a0d14] border border-[#2a3449] px-2.5 py-0.5 rounded flex items-center gap-1">
                          <History className="w-3 h-3 text-amber-400" />
                          {eraLabel}
                        </span>
                        {isNegative && (
                          <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/40 border border-purple-500/30 px-1.5 py-0.5 rounded">
                            ERA ANTERIOR / ANOS NEGATIVOS
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-100">{item.name}</h4>
                      <p className="text-xs text-slate-300 font-serif leading-relaxed">{item.shortDesc}</p>

                      {item.fullContent && (
                        <p className="text-xs text-slate-400 bg-[#0a0d14] p-3 rounded-xl border border-[#2a3449]/60 font-serif italic mt-2">
                          "{item.fullContent}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteWorldEntity(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded opacity-70 group-hover:opacity-100 transition-opacity self-start"
                      title="Remover Evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add Event */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-[#121722] border-2 border-amber-500/50 rounded-2xl p-6 w-full max-w-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Registrar Evento na Cronologia do Calendário
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Vincule guerras, fundação de impérios ou milagres ao calendário oficial de {activeWorld.title}.
            </p>

            <form onSubmit={handleAddTimelineEvent} className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Tipo de Evento:</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory('lore_event')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      category === 'lore_event' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-[#0a0d14] text-slate-400 border-[#2a3449] hover:text-slate-200'
                    }`}
                  >
                    Evento de Lore
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('military_conflict')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      category === 'military_conflict' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-[#0a0d14] text-slate-400 border-[#2a3449] hover:text-slate-200'
                    }`}
                  >
                    Guerra / Conflito
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('tradition')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                      category === 'tradition' ? 'bg-amber-500 text-slate-950 border-amber-400 shadow' : 'bg-[#0a0d14] text-slate-400 border-[#2a3449] hover:text-slate-200'
                    }`}
                  >
                    Rito / Tradição
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Título do Evento:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Batalha dos Cinco Exércitos / O Eclipse Negro dos Picos"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 font-bold focus:outline-none transition-all shadow-inner"
                />
              </div>

              {/* Era & Positive/Negative Year Settings */}
              <div className="bg-[#0a0d14] border border-[#2a3449] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" /> Vínculo Cronológico com o Calendário
                  </span>

                  {/* Toggle Eras Antigas / Negative Year */}
                  <label className="flex items-center gap-2 cursor-pointer bg-[#121824] px-3 py-1 rounded-lg border border-[#2a3449] hover:border-amber-500/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={isNegativeYear}
                      onChange={(e) => setIsNegativeYear(e.target.checked)}
                      className="rounded accent-amber-500 w-3.5 h-3.5"
                    />
                    <span className="text-xs font-bold text-slate-200">
                      Era Antiga / Anos Negativos (a.C. / a.{yearSuffix})
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Nome da Era Histórica:</label>
                    <input
                      type="text"
                      value={eraName}
                      onChange={(e) => setEraName(e.target.value)}
                      placeholder="Ex: Segunda Era, Era da Escuridão"
                      className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      {isNegativeYear ? 'Ano (Antes da Época):' : 'Ano (Numérico):'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {isNegativeYear && <span className="text-xs font-mono font-bold text-rose-400">-</span>}
                      <input
                        type="number"
                        required
                        value={yearNumber}
                        onChange={(e) => setYearNumber(e.target.value)}
                        placeholder="Ex: 100, 5000"
                        className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg p-2 text-xs text-slate-100 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Sufixo de Anos:</label>
                    <input
                      type="text"
                      value={yearSuffix}
                      onChange={(e) => setYearSuffix(e.target.value)}
                      placeholder="Ex: DF, DR, A.E."
                      className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Optional Month and Day Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#2a3449]/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Mês (Do Calendário Ativo):</label>
                    <select
                      value={monthIndex}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMonthIndex(val === '' ? '' : Number(val));
                      }}
                      className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none font-mono"
                    >
                      <option value="">Sem Mês Exato (Ano Inteiro)</option>
                      {calendarConfig?.months?.map((m, idx) => (
                        <option key={m.id || idx} value={idx}>
                          Mês {idx + 1}: {m.name} ({m.days} dias)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Dia do Mês (Opcional):</label>
                    <select
                      value={dayNumber}
                      disabled={monthIndex === ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDayNumber(val === '' ? '' : Number(val));
                      }}
                      className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg p-2 text-xs text-slate-200 focus:outline-none font-mono disabled:opacity-40"
                    >
                      <option value="">Dia Desconhecido / Mês Todo</option>
                      {Array.from({ length: currentMonthDays }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          Dia {idx + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Descrição do Ocorrido:</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Resumo do impacto histórico deste acontecimento no mundo..."
                  className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none font-serif leading-relaxed shadow-inner"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#2a3449]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                >
                  Salvar Evento na Cronologia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
