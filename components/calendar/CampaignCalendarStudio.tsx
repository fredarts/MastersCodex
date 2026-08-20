'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Moon, 
  Sun, 
  Compass, 
  Coffee, 
  Settings, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Filter, 
  Search, 
  Flag, 
  Waves,
  CalendarDays,
  ListOrdered,
  Crown
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { 
  calculateMoonPhases, 
  calculateTide, 
  dateToAbsoluteDays, 
  getHolidayForDate 
} from '@/lib/calendar/calendarEngine';

export const CampaignCalendarStudio: React.FC = () => {
  const {
    calendarConfig,
    calendarState,
    currentDateTime,
    calendarNotes,
    setIsRestModalOpen,
    setIsTimeAdvanceModalOpen,
    setIsCalendarSettingsOpen,
    setIsDayModalOpen,
    setSelectedDayForModal,
    setInGameDate,
  } = useCampaignCalendar();

  const { activeWorld } = useWorld();
  const { userCampaigns, activeCampaign, setActiveCampaign, feedEvents } = useCampaign();

  const dmCampaigns = userCampaigns.filter((c) => {
    if (c.role !== 'dm') return false;
    if (!activeWorld) return true;
    return c.worldId === activeWorld.id;
  });

  // Navigation State
  const [viewYear, setViewYear] = useState<number>(calendarState.currentYear);
  const [viewMonthIndex, setViewMonthIndex] = useState<number>(calendarState.currentMonthIndex);
  const [activeTab, setActiveTab] = useState<'grid' | 'chronicle'>('grid');
  const [chronicleFilter, setChronicleFilter] = useState<string>('all');
  const [chronicleSearch, setChronicleSearch] = useState<string>('');

  // Keep view in sync if year/month changes or activeCampaign changes
  React.useEffect(() => {
    setViewYear(calendarState.currentYear);
    setViewMonthIndex(calendarState.currentMonthIndex);
  }, [calendarState.currentYear, calendarState.currentMonthIndex, activeCampaign?.id]);

  const currentMonth = calendarConfig.months[viewMonthIndex] || calendarConfig.months[0] || { name: 'Mês', days: 30 };
  const totalMonths = calendarConfig.months.length || 1;

  const handlePrevMonth = () => {
    if (viewMonthIndex === 0) {
      setViewMonthIndex(totalMonths - 1);
      setViewYear((y) => y - 1);
    } else {
      setViewMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonthIndex === totalMonths - 1) {
      setViewMonthIndex(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonthIndex((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    setSelectedDayForModal({
      monthIndex: viewMonthIndex,
      day,
    });
    setIsDayModalOpen(true);
  };

  const daysOfWeek = calendarConfig.daysOfWeek || ['1º Dia', '2º Dia', '3º Dia', '4º Dia', '5º Dia', '6º Dia', '7º Dia'];
  const daysInMonth = currentMonth.days || 30;

  // Offset of first day of month
  const firstDayAbs = dateToAbsoluteDays(calendarConfig, viewYear, viewMonthIndex, 1);
  const firstDayWeekOffset = ((firstDayAbs % daysOfWeek.length) + daysOfWeek.length) % daysOfWeek.length;

  // Filtered chronicle items strictly for active campaign
  const allChronicleItems = [
    ...calendarNotes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      category: n.category,
      inGameDate: `${n.day} de ${calendarConfig.months[n.monthIndex]?.name || 'Mês'}, ${n.year} ${calendarConfig.yearSuffix}`,
      year: n.year,
      monthIndex: n.monthIndex,
      day: n.day,
      type: 'note' as const,
    })),
    ...feedEvents
      .filter((f) => f.inGameDate || f.inGameTimestamp)
      .map((f) => ({
        id: f.id,
        title: f.title,
        content: f.summary,
        category: f.eventType === 'milestone' ? 'rest' : 'session_log',
        inGameDate: f.inGameDate || f.inGameTimestamp?.formatted || '',
        year: f.inGameTimestamp?.year || calendarState.currentYear,
        monthIndex: f.inGameTimestamp?.monthIndex || 0,
        day: f.inGameTimestamp?.day || 1,
        type: 'feed' as const,
      })),
  ].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.monthIndex !== b.monthIndex) return b.monthIndex - a.monthIndex;
    return b.day - a.day;
  });

  const filteredChronicle = allChronicleItems.filter((item) => {
    if (chronicleFilter !== 'all' && item.category !== chronicleFilter) return false;
    if (chronicleSearch.trim()) {
      const q = chronicleSearch.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
    }
    return true;
  });

  if (!activeCampaign || (activeWorld && activeCampaign.worldId !== activeWorld.id)) {
    return (
      <div className="flex-1 bg-[#0a0d14] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-200 text-lg">
          {activeWorld ? `Nenhuma Campanha no Mundo: ${activeWorld.title}` : 'Nenhuma Campanha Selecionada'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Inicie ou selecione uma campanha de RPG neste mundo para visualizar o calendário astronômico, fases lunares, clima e os anais da crônica.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] overflow-hidden select-none">
      {/* Top Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-[#2a3449] bg-[#0d121c]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-lg shadow-amber-500/5">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                SISTEMA CRONOLÓGICO
              </span>
              {dmCampaigns.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#0a0d14] border border-amber-500/40 rounded-lg px-2 py-0.5 shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <select
                    value={activeCampaign?.id || ''}
                    onChange={(e) => {
                      const selected = dmCampaigns.find((c) => c.id === e.target.value);
                      if (selected) setActiveCampaign(selected);
                    }}
                    className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none max-w-[180px] truncate cursor-pointer"
                    title="Alternar Campanha Ativa"
                  >
                    {dmCampaigns.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#161c28] text-slate-200">
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mundo: <span className="text-slate-200 font-medium">{activeWorld?.title || 'Sem mundo'}</span> • Calendário da Mesa: <span className="text-amber-300 font-medium">{calendarConfig.name}</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex bg-[#121824] border border-[#2a3449] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'grid' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Grade Mensal
            </button>
            <button
              onClick={() => setActiveTab('chronicle')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'chronicle' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" /> Crônica & Linha do Tempo ({allChronicleItems.length})
            </button>
          </div>

          <button
            onClick={() => setIsRestModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30 transition-colors"
            title="Realizar Descanso da Party"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>Descanso</span>
          </button>

          <button
            onClick={() => setIsTimeAdvanceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-colors"
            title="Avançar Tempo ou Realizar Viagem"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Viagem / Tempo</span>
          </button>

          <button
            onClick={() => setIsCalendarSettingsOpen(true)}
            className="p-2 bg-[#121824] hover:bg-[#1a2334] text-slate-400 hover:text-slate-200 border border-[#2a3449] rounded-xl transition-colors"
            title="Configurar Meses, Luas e Festivais"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side / Main Center Area */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6">
          {activeTab === 'grid' && (
            <div className="space-y-4 max-w-6xl mx-auto w-full">
              {/* Month Navigation & Year Selector Bar */}
              <div className="flex items-center justify-between bg-[#121824] border border-[#2a3449] px-4 py-3 rounded-2xl shadow-md">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Mês Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      {currentMonth.name}
                      {currentMonth.isIntercalary && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                          FESTIVAL INTERCALAR
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-slate-400">
                      (Mês {viewMonthIndex + 1} de {totalMonths})
                    </span>
                  </div>

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                    title="Próximo Mês"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Jump to Today Button */}
                  <button
                    onClick={() => {
                      setViewYear(calendarState.currentYear);
                      setViewMonthIndex(calendarState.currentMonthIndex);
                    }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                  >
                    Hoje In-Game
                  </button>

                  {/* Year Switcher */}
                  <div className="flex items-center gap-1.5 bg-[#0a0d14] border border-[#2a3449] px-3 py-1 rounded-xl">
                    <button
                      onClick={() => setViewYear((y) => y - 1)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      Ano {viewYear} {calendarConfig.yearSuffix}
                    </span>
                    <button
                      onClick={() => setViewYear((y) => y + 1)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Calendar Grid */}
              <div className="bg-[#121824] border border-[#2a3449] rounded-2xl p-4 shadow-xl">
                {/* Weekdays Header */}
                <div
                  className="grid gap-2 mb-2"
                  style={{ gridTemplateColumns: `repeat(${daysOfWeek.length}, minmax(0, 1fr))` }}
                >
                  {daysOfWeek.map((dayName, idx) => (
                    <div
                      key={idx}
                      className="text-center py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-[#0a0d14]/60 border border-[#2a3449]/50 rounded-xl"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Days Matrix */}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${daysOfWeek.length}, minmax(0, 1fr))` }}
                >
                  {/* Empty offset days */}
                  {Array.from({ length: firstDayWeekOffset }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[90px] rounded-xl bg-[#0a0d14]/20 border border-dashed border-[#2a3449]/30 opacity-30"
                    />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const totalDays = dateToAbsoluteDays(calendarConfig, viewYear, viewMonthIndex, dayNum);
                    const moons = calculateMoonPhases(calendarConfig, totalDays);
                    const holiday = getHolidayForDate(calendarConfig, viewMonthIndex, dayNum);

                    const isToday =
                      calendarState.currentYear === viewYear &&
                      calendarState.currentMonthIndex === viewMonthIndex &&
                      calendarState.currentDay === dayNum;

                    const dayNotes = calendarNotes.filter(
                      (n) => n.year === viewYear && n.monthIndex === viewMonthIndex && n.day === dayNum
                    );

                    return (
                      <div
                        key={dayNum}
                        onClick={() => handleSelectDay(dayNum)}
                        className={`min-h-[100px] p-2.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer group ${
                          isToday
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                            : 'bg-[#0f141d] border-[#2a3449] hover:border-amber-500/40 hover:bg-[#161e2c]'
                        }`}
                      >
                        {/* Day Top Bar */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isToday ? 'text-amber-300 font-extrabold' : 'text-slate-300 group-hover:text-amber-200'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {/* Moons Icons */}
                          <div className="flex items-center gap-1">
                            {moons.map((m) => (
                              <span
                                key={m.moonId}
                                className="text-[11px]"
                                title={`${m.moonName}: ${m.phaseLabel} (${m.illuminationPercentage}%)`}
                              >
                                {m.phase === 'full_moon' ? '🌕' : m.phase === 'new_moon' ? '🌑' : m.phase.includes('waxing') ? '🌓' : '🌗'}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Middle: Holiday / Events preview */}
                        <div className="space-y-1 my-1">
                          {holiday && (
                            <div className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded text-[9px] font-bold truncate">
                              🎉 {holiday.name}
                            </div>
                          )}

                          {dayNotes.slice(0, 2).map((note) => (
                            <div
                              key={note.id}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-medium truncate ${
                                note.category === 'rest'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : note.category === 'travel'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : note.category === 'quest_deadline'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {note.title}
                            </div>
                          ))}

                          {dayNotes.length > 2 && (
                            <span className="text-[9px] text-slate-500 font-mono">
                              +{dayNotes.length - 2} mais...
                            </span>
                          )}
                        </div>

                        {/* Bottom Bar */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          {isToday && (
                            <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">
                              ● Atual
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chronicle' && (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121824] border border-[#2a3449] p-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={chronicleSearch}
                      onChange={(e) => setChronicleSearch(e.target.value)}
                      placeholder="Buscar nos anais e diário..."
                      className="bg-[#0a0d14] border border-[#2a3449] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 w-64"
                    />
                  </div>

                  <select
                    value={chronicleFilter}
                    onChange={(e) => setChronicleFilter(e.target.value)}
                    className="bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="rest">🌙 Descansos da Party</option>
                    <option value="travel">🧭 Viagens & Marchas</option>
                    <option value="session_log">📜 Resumos de Sessão</option>
                    <option value="quest_deadline">🚩 Prazos & Metas</option>
                    <option value="note">📝 Anotações Gerais</option>
                  </select>
                </div>
              </div>

              {/* Chronicle Items Stream */}
              <div className="space-y-3">
                {filteredChronicle.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[#2a3449] rounded-2xl bg-[#0f141d]/40 text-slate-500">
                    <BookOpen className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">Nenhum registro cronológico encontrado.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Conclua descansos, registre viagens ou adicione notas no calendário para preencher a crônica.
                    </p>
                  </div>
                ) : (
                  filteredChronicle.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-[#121824] border border-[#2a3449] hover:border-slate-600 rounded-2xl transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            📅 {item.inGameDate}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Astronomy & Campaign Clock HUD */}
        <div className="w-80 border-l border-[#2a3449] bg-[#0d121c] p-5 space-y-5 overflow-y-auto hidden lg:block">
          {/* Current Clock Card */}
          <div className="bg-[#121824] border border-amber-500/30 p-4 rounded-2xl shadow-lg space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Data & Hora Atual
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">{currentDateTime.formattedDate}</h3>
              <p className="text-2xl font-black text-amber-300 font-mono mt-1">
                {currentDateTime.formattedTime}
              </p>
            </div>

            <div className="pt-2 border-t border-[#2a3449] flex items-center justify-between text-xs text-slate-400">
              <span>{currentDateTime.dayOfWeekName}</span>
              <span className="text-emerald-400 font-semibold">{currentDateTime.seasonLabel}</span>
            </div>
          </div>

          {/* Moons Card */}
          <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" /> Luas & Fases Celestes
            </span>
            <div className="space-y-2">
              {currentDateTime.moons.map((moon) => (
                <div key={moon.moonId} className="p-2.5 bg-[#0a0d14] border border-[#2a3449] rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{moon.moonName}</span>
                    <span className="text-xs text-cyan-300 font-semibold">{moon.illuminationPercentage}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{moon.phaseLabel}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tides Card */}
          {currentDateTime.tide && (
            <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" /> Estado das Marés
              </span>
              <p className="text-xs font-bold text-blue-300">{currentDateTime.tide.label}</p>
              <p className="text-[11px] text-slate-400">
                Afeta navegação litorânea, docas e travessias em estuários.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
