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
  Crown,
  Flame,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { 
  calculateMoonPhases, 
  calculateTide, 
  dateToAbsoluteDays, 
  getHolidayForDate,
  getCelestialEventForDate
} from '@/lib/calendar/calendarEngine';
import { CelestialOrreryView } from './CelestialOrreryView';
import { CelestialConjunctionsView } from './CelestialConjunctionsView';

interface CampaignCalendarStudioProps {
  isPlayerView?: boolean;
  onClose?: () => void;
}

export const CampaignCalendarStudio: React.FC<CampaignCalendarStudioProps> = ({
  isPlayerView = false,
  onClose,
}) => {
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
    updateCalendarConfig,
  } = useCampaignCalendar();

  const { activeWorld, worldEntities } = useWorld();
  const { userCampaigns, activeCampaign, setActiveCampaign, feedEvents } = useCampaign();

  const isActuallyDm = !isPlayerView && (activeCampaign?.role === 'dm' || !activeCampaign);

  const dmCampaigns = userCampaigns.filter((c) => {
    if (c.role !== 'dm') return false;
    if (!activeWorld) return true;
    return c.worldId === activeWorld.id;
  });

  // Navigation State
  const [viewYear, setViewYear] = useState<number>(calendarState.currentYear);
  const [viewMonthIndex, setViewMonthIndex] = useState<number>(calendarState.currentMonthIndex);
  const [activeTab, setActiveTab] = useState<'grid' | 'chronicle' | 'orrery' | 'eclipses'>('grid');
  const [chronicleFilter, setChronicleFilter] = useState<string>('all');
  const [chronicleSearch, setChronicleSearch] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

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

  // Resgatar eventos de linha do tempo da Cronologia do Mundo
  const worldTimelineEvents = worldEntities.filter(
    (e) =>
      e.category === 'lore_event' ||
      e.category === 'military_conflict' ||
      e.category === 'tradition' ||
      (e.attributes && (e.attributes.era || e.attributes.yearNumeric !== undefined))
  );

  // Filtered chronicle items strictly for active campaign + world timeline
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
    ...worldTimelineEvents.map((e) => {
      const year = typeof e.attributes?.yearNumeric === 'number' ? e.attributes.yearNumeric : 0;
      const monthIdx = typeof e.attributes?.monthIndex === 'number' ? e.attributes.monthIndex : 0;
      const day = typeof e.attributes?.day === 'number' ? e.attributes.day : 1;
      const dateLabel = e.attributes?.formattedDate || e.attributes?.era || e.subType || 'Lore do Mundo';

      return {
        id: e.id,
        title: e.name,
        content: e.shortDesc,
        category: e.category as string,
        inGameDate: dateLabel,
        year,
        monthIndex: monthIdx,
        day,
        type: 'lore' as const,
      };
    }),
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
      <div className="flex-1 bg-[#0a0d14] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-xl">
          <CalendarIcon className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-200 text-base">
          {activeWorld ? `Nenhuma Campanha no Mundo: ${activeWorld.title}` : 'Nenhuma Campanha Selecionada'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Inicie ou selecione uma campanha de RPG neste mundo para visualizar o calendário astronômico, fases lunares, clima e os anais da crônica.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-h-screen bg-[#080c14] overflow-hidden select-none">
      {/* Top Studio Header (Compact Tablet-Friendly) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-[#1f293d] bg-[#0c111c] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-md">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                SISTEMA CRONOLÓGICO
              </span>
              {dmCampaigns.length > 0 && (
                <div className="flex items-center gap-1 bg-[#070a10] border border-amber-500/40 rounded-md px-1.5 py-0.5 shadow-sm">
                  <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                  <select
                    value={activeCampaign?.id || ''}
                    onChange={(e) => {
                      const selected = dmCampaigns.find((c) => c.id === e.target.value);
                      if (selected) setActiveCampaign(selected);
                    }}
                    className="bg-transparent text-[11px] text-amber-300 font-bold focus:outline-none max-w-[140px] truncate cursor-pointer"
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
            <p className="text-[10px] text-slate-400 mt-0.5">
              Mundo: <span className="text-slate-200 font-medium">{activeWorld?.title || 'Sem mundo'}</span> • Calendário: <span className="text-amber-300 font-medium">{calendarConfig.name}</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Main Navigation Tabs */}
          <div className="flex bg-[#111724] border border-[#232f48] p-0.5 rounded-xl">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'grid' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> 
              <span>Grade</span>
            </button>
            <button
              onClick={() => setActiveTab('orrery')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'orrery' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Observatório Astral & Movimento Dia-a-Dia"
            >
              <Compass className="w-3.5 h-3.5 text-current" />
              <span>Astros</span>
            </button>
            <button
              onClick={() => setActiveTab('eclipses')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'eclipses' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Simulador de Eclipses, Conjunções e Jogo de Pistas"
            >
              <Flame className="w-3.5 h-3.5 text-current" />
              <span>Eclipses</span>
            </button>
            <button
              onClick={() => setActiveTab('chronicle')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'chronicle' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" /> 
              <span className="hidden sm:inline">Crônica</span> ({allChronicleItems.length})
            </button>
          </div>

          {isActuallyDm && (
            <>
              <button
                onClick={() => setIsRestModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
                title="Realizar Descanso da Party"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Descanso</span>
              </button>

              <button
                onClick={() => setIsTimeAdvanceModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[11px] font-bold rounded-lg border border-indigo-500/30 transition-colors cursor-pointer"
                title="Avançar Tempo ou Realizar Viagem"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Viagem</span>
              </button>

              <button
                onClick={() => setIsCalendarSettingsOpen(true)}
                className="p-1.5 bg-[#111724] hover:bg-[#192236] text-slate-400 hover:text-slate-200 border border-[#232f48] rounded-lg transition-colors cursor-pointer"
                title="Configurar Meses, Luas e Festivais"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Toggle Sidebar Button for Tablet screen space */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isSidebarOpen ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#111724] text-slate-400 border-[#232f48]'
            }`}
            title={isSidebarOpen ? 'Ocultar Painel Lateral' : 'Exibir Painel Lateral'}
          >
            {isSidebarOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>

          {/* Optional Close Button if rendered inside a modal */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-bold transition-colors cursor-pointer ml-1"
              title="Fechar Calendário"
            >
              ✕
            </button>
          )}
        </div>
      </div>


      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side / Main Center Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* 1. ABA GRADE MENSAL (Otimizada para Tablet Zero Scroll) */}
          {activeTab === 'grid' && (
            <div className="flex-1 flex flex-col p-2 sm:p-3 min-h-0 overflow-hidden">
              {/* Month Navigation & Year Selector Bar (Compact) */}
              <div className="flex items-center justify-between bg-[#111724] border border-[#232f48] px-3 py-1.5 rounded-xl shadow-md shrink-0 mb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Mês Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                      {currentMonth.name}
                      {currentMonth.isIntercalary && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                          FESTIVAL
                        </span>
                      )}
                    </h2>
                    <span className="text-[10px] text-slate-400">
                      ({viewMonthIndex + 1}/{totalMonths})
                    </span>
                  </div>

                  <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Próximo Mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Jump to Today Button */}
                  <button
                    onClick={() => {
                      setViewYear(calendarState.currentYear);
                      setViewMonthIndex(calendarState.currentMonthIndex);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                  >
                    Hoje In-Game
                  </button>

                  {/* Year Switcher */}
                  <div className="flex items-center gap-1 bg-[#070a10] border border-[#232f48] px-2 py-0.5 rounded-lg">
                    <button
                      onClick={() => setViewYear((y) => y - 1)}
                      className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-[11px] text-amber-300">
                      Ano {viewYear} {calendarConfig.yearSuffix}
                    </span>
                    <button
                      onClick={() => setViewYear((y) => y + 1)}
                      className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Calendar Grid Container (Auto-Fitting Viewport) */}
              <div className="flex-1 bg-[#0f1422] border border-[#232f48] rounded-xl p-2 shadow-xl flex flex-col min-h-0 overflow-hidden">
                {/* Weekdays Header */}
                <div
                  className="grid gap-1 mb-1 shrink-0"
                  style={{ gridTemplateColumns: `repeat(${daysOfWeek.length}, minmax(0, 1fr))` }}
                >
                  {daysOfWeek.map((dayName, idx) => (
                    <div
                      key={idx}
                      className="text-center py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#070a10]/70 border border-[#232f48]/50 rounded-lg truncate px-1"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Days Matrix (Auto-stretching grid with zero scroll) */}
                <div
                  className="flex-1 grid gap-1 min-h-0"
                  style={{ 
                    gridTemplateColumns: `repeat(${daysOfWeek.length}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${Math.ceil((firstDayWeekOffset + daysInMonth) / daysOfWeek.length)}, minmax(0, 1fr))`
                  }}
                >
                  {/* Empty offset days */}
                  {Array.from({ length: firstDayWeekOffset }).map((_, idx) => (
                    <div
                      key={`empty-${idx}`}
                      className="h-full rounded-lg bg-[#070a10]/30 border border-dashed border-[#232f48]/30 opacity-20"
                    />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const totalDays = dateToAbsoluteDays(calendarConfig, viewYear, viewMonthIndex, dayNum);
                    const moons = calculateMoonPhases(calendarConfig, totalDays);
                    const holiday = getHolidayForDate(calendarConfig, viewMonthIndex, dayNum);
                    const celestialEvent = getCelestialEventForDate(calendarConfig, viewYear, viewMonthIndex, dayNum);

                    const isToday =
                      calendarState.currentYear === viewYear &&
                      calendarState.currentMonthIndex === viewMonthIndex &&
                      calendarState.currentDay === dayNum;

                    const dayNotes = calendarNotes.filter(
                      (n) => n.year === viewYear && n.monthIndex === viewMonthIndex && n.day === dayNum
                    );

                    const dayHistoricalEvents = worldTimelineEvents.filter(
                      (e) => e.attributes?.monthIndex === viewMonthIndex && e.attributes?.day === dayNum
                    );

                    return (
                      <div
                        key={dayNum}
                        onClick={() => handleSelectDay(dayNum)}
                        className={`h-full min-h-0 p-1 sm:p-1.5 rounded-lg border flex flex-col justify-between transition-all cursor-pointer group overflow-hidden ${
                          isToday
                            ? 'bg-amber-500/10 border-amber-500/70 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                            : celestialEvent
                            ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30'
                            : 'bg-[#0b101c] border-[#1f2b40] hover:border-amber-500/40 hover:bg-[#141c2c]'
                        }`}
                      >
                        {/* Day Top Bar */}
                        <div className="flex items-center justify-between shrink-0">
                          <span
                            className={`font-mono font-bold text-[11px] leading-none ${
                              isToday ? 'text-amber-300 font-black' : 'text-slate-300 group-hover:text-amber-200'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {/* Moons / Eclipse Icon */}
                          <div className="flex items-center gap-0.5">
                            {celestialEvent && (
                              <span 
                                className="text-[10px] animate-pulse" 
                                title={`Fenômeno: ${celestialEvent.name}`}
                              >
                                {celestialEvent.type === 'solar_eclipse' ? '☀️🌑' : celestialEvent.type === 'blood_moon' ? '🩸' : '✨'}
                              </span>
                            )}
                            {moons.map((m) => (
                              <span
                                key={m.moonId}
                                className="text-[10px] leading-none"
                                title={`${m.moonName}: ${m.phaseLabel} (${m.illuminationPercentage}%)`}
                              >
                                {m.phase === 'full_moon' ? '🌕' : m.phase === 'new_moon' ? '🌑' : m.phase.includes('waxing') ? '🌓' : '🌗'}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Middle: Holiday / Events preview (compact) */}
                        <div className="space-y-0.5 my-0.5 overflow-hidden flex-1 min-h-0">
                          {celestialEvent && (
                            <div className="bg-rose-500/25 text-rose-200 border border-rose-500/40 px-1 py-0.2 rounded text-[8px] font-bold truncate">
                              🔥 {celestialEvent.name}
                            </div>
                          )}

                          {holiday && (
                            <div className="bg-amber-500/20 text-amber-200 border border-amber-500/40 px-1 py-0.2 rounded text-[8px] font-bold truncate">
                              🎉 {holiday.name}
                            </div>
                          )}

                          {dayHistoricalEvents.slice(0, 1).map((evt) => (
                            <div
                              key={evt.id}
                              className="bg-[#141d2d] text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded text-[8px] font-medium truncate"
                              title={`Histórico: ${evt.name}`}
                            >
                              📜 {evt.name}
                            </div>
                          ))}

                          {dayNotes.slice(0, 1).map((note) => (
                            <div
                              key={note.id}
                              className={`px-1 py-0.2 rounded text-[8px] font-medium truncate ${
                                note.category === 'rest'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : note.category === 'travel'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {note.title}
                            </div>
                          ))}
                        </div>

                        {/* Bottom Tag */}
                        <div className="flex items-center justify-between text-[8px] text-slate-500 shrink-0">
                          {isToday && (
                            <span className="text-emerald-400 font-black uppercase tracking-wider">
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

          {/* 2. ABA OBSERVATÓRIO ASTRAL (ORRERY) */}
          {activeTab === 'orrery' && (
            <CelestialOrreryView
              calendarConfig={calendarConfig}
              calendarState={calendarState}
              currentDateTime={currentDateTime}
              onSetInGameDate={setInGameDate}
              isPlayerView={isPlayerView}
            />
          )}

          {/* 3. ABA ECLIPSES & CONJUNÇÕES CELESTIAIS */}
          {activeTab === 'eclipses' && (
            <CelestialConjunctionsView
              calendarConfig={calendarConfig}
              calendarState={calendarState}
              currentDateTime={currentDateTime}
              onUpdateCalendarConfig={updateCalendarConfig}
              onSetInGameDate={setInGameDate}
              isDm={isActuallyDm}
            />
          )}

          {/* 4. ABA CRÔNICA & LINHA DO TEMPO */}
          {activeTab === 'chronicle' && (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 max-w-4xl mx-auto w-full">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111724] border border-[#232f48] p-2.5 rounded-xl shrink-0">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={chronicleSearch}
                      onChange={(e) => setChronicleSearch(e.target.value)}
                      placeholder="Buscar nos anais, cronologia e diário..."
                      className="bg-[#070a10] border border-[#232f48] rounded-lg pl-8 pr-3 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 w-56"
                    />
                  </div>

                  <select
                    value={chronicleFilter}
                    onChange={(e) => setChronicleFilter(e.target.value)}
                    className="bg-[#070a10] border border-[#232f48] rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Todas as Categorias</option>
                    <option value="lore_event">📜 Eventos de Lore do Mundo</option>
                    <option value="military_conflict">⚔️ Guerras & Conflitos</option>
                    <option value="tradition">🔮 Ritos & Tradições</option>
                    <option value="rest">🌙 Descansos da Party</option>
                    <option value="travel">🧭 Viagens & Marchas</option>
                    <option value="session_log">📜 Resumos de Sessão</option>
                    <option value="quest_deadline">🚩 Prazos & Metas</option>
                    <option value="note">📝 Anotações Gerais</option>
                  </select>
                </div>
              </div>

              {/* Chronicle Items Stream */}
              <div className="space-y-2 flex-1">
                {filteredChronicle.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-[#232f48] rounded-2xl bg-[#0b101c]/40 text-slate-500">
                    <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">Nenhum registro cronológico encontrado.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Conclua descansos, registre viagens ou adicione notas no calendário para preencher a crônica.
                    </p>
                  </div>
                ) : (
                  filteredChronicle.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#111724] border border-[#232f48] hover:border-slate-600 rounded-xl transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-300 font-mono">
                            📅 {item.inGameDate}
                          </span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-100">{item.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Astronomy & Campaign Clock HUD (Collapsible) */}
        {isSidebarOpen && (
          <div className="w-64 sm:w-72 border-l border-[#1f293d] bg-[#0c111c] p-3 space-y-3 overflow-y-auto shrink-0 hidden md:block animate-in slide-in-from-right-5 duration-150">
            {/* Current Clock Card */}
            <div className="bg-[#111724] border border-amber-500/30 p-3 rounded-xl shadow-md space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Data & Hora Atual
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100">{currentDateTime.formattedDate}</h3>
                <p className="text-xl font-black text-amber-300 font-mono mt-0.5">
                  {currentDateTime.formattedTime}
                </p>
              </div>

              <div className="pt-1.5 border-t border-[#232f48] flex items-center justify-between text-[11px] text-slate-400">
                <span>{currentDateTime.dayOfWeekName}</span>
                <span className="text-emerald-400 font-semibold">{currentDateTime.seasonLabel}</span>
              </div>
            </div>

            {/* Moons Card */}
            <div className="bg-[#111724] border border-[#232f48] p-3 rounded-xl space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" /> Luas & Fases Celestes
              </span>
              <div className="space-y-1.5">
                {currentDateTime.moons.map((moon) => (
                  <div key={moon.moonId} className="p-2 bg-[#070a10] border border-[#1f293d] rounded-lg space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{moon.moonName}</span>
                      <span className="text-xs text-cyan-300 font-semibold font-mono">{moon.illuminationPercentage}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{moon.phaseLabel}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tides Card */}
            {currentDateTime.tide && (
              <div className="bg-[#111724] border border-[#232f48] p-3 rounded-xl space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5" /> Estado das Marés
                </span>
                <p className="text-xs font-bold text-blue-300">{currentDateTime.tide.label}</p>
                <p className="text-[10px] text-slate-400">
                  Afeta navegação litorânea, docas e travessias em estuários.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
