'use client';

import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Moon, 
  Sun, 
  Waves, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  Clock, 
  BookOpen, 
  Flag,
  Coffee,
  Compass
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { 
  calculateMoonPhases, 
  calculateTide, 
  dateToAbsoluteDays, 
  getHolidayForDate 
} from '@/lib/calendar/calendarEngine';

export const CalendarDayModal: React.FC = () => {
  const {
    calendarConfig,
    calendarState,
    currentDateTime,
    calendarNotes,
    isDayModalOpen,
    setIsDayModalOpen,
    selectedDayForModal,
    setInGameDate,
    createCalendarNote,
    deleteCalendarNote,
  } = useCampaignCalendar();

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'note' | 'quest_deadline' | 'world_event' | 'holiday'>('note');
  const [isAddingNote, setIsAddingNote] = useState(false);

  if (!isDayModalOpen || !selectedDayForModal) return null;

  const { monthIndex, day } = selectedDayForModal;
  const month = calendarConfig.months[monthIndex] || calendarConfig.months[0];
  const year = calendarState.currentYear;

  const totalDays = dateToAbsoluteDays(calendarConfig, year, monthIndex, day);
  const moons = calculateMoonPhases(calendarConfig, totalDays);
  const tide = calculateTide(moons);
  const holiday = getHolidayForDate(calendarConfig, monthIndex, day);

  const daysOfWeek = calendarConfig.daysOfWeek || [];
  const dayOfWeekIndex = ((totalDays % daysOfWeek.length) + daysOfWeek.length) % daysOfWeek.length;
  const dayOfWeekName = daysOfWeek[dayOfWeekIndex] || '';

  const isToday =
    calendarState.currentYear === year &&
    calendarState.currentMonthIndex === monthIndex &&
    calendarState.currentDay === day;

  // Filtrar notas do dia
  const dayNotes = calendarNotes.filter(
    (n) => n.year === year && n.monthIndex === monthIndex && n.day === day
  );

  const handleSetAsCurrentDay = async () => {
    await setInGameDate(year, monthIndex, day, calendarState.currentHour, calendarState.currentMinute);
    setIsDayModalOpen(false);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await createCalendarNote({
      year,
      monthIndex,
      day,
      hour: calendarState.currentHour,
      minute: calendarState.currentMinute,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      authorRole: 'dm',
    });

    setNewTitle('');
    setNewContent('');
    setIsAddingNote(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rest':
        return <Coffee className="w-4 h-4 text-amber-400" />;
      case 'travel':
        return <Compass className="w-4 h-4 text-indigo-400" />;
      case 'quest_deadline':
        return <Flag className="w-4 h-4 text-rose-400" />;
      case 'world_event':
        return <Sparkles className="w-4 h-4 text-amber-300" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f141d] border border-[#2a3449] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3449] bg-[#121824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              {day}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  {day} de {month.name}, {year} {calendarConfig.yearSuffix}
                </h2>
                {isToday && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    HOJE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{dayOfWeekName} • {month.season ? `Estação: ${month.season}` : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setIsDayModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Celestial & Astronomy Info Bar */}
          <div className="grid grid-cols-2 gap-3">
            {/* Moons */}
            <div className="bg-[#121824] border border-[#2a3449] p-3 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Moon className="w-3 h-3 text-cyan-400" /> Corpos Celestes & Fases
              </span>
              {moons.map((m) => (
                <div key={m.moonId} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{m.moonName}:</span>
                  <span className="text-cyan-300 font-semibold flex items-center gap-1">
                    {m.phaseLabel} ({m.illuminationPercentage}%)
                  </span>
                </div>
              ))}
            </div>

            {/* Tides & Weather */}
            <div className="bg-[#121824] border border-[#2a3449] p-3 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Waves className="w-3 h-3 text-blue-400" /> Marés & Fenômenos
              </span>
              <div className="text-xs text-slate-300">
                <p className="font-semibold text-blue-300">{tide.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Influência gravitacional das luas ativas</p>
              </div>
            </div>
          </div>

          {/* Holiday / Festival Banner */}
          {holiday && (
            <div className="bg-gradient-to-r from-rose-950/40 to-amber-950/30 border border-rose-500/40 p-3 rounded-xl flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <div>
                <h4 className="text-xs font-bold text-rose-300">{holiday.name}</h4>
                <p className="text-[11px] text-slate-300 mt-0.5">{holiday.description}</p>
              </div>
            </div>
          )}

          {/* Day Notes & Timeline Events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Crônica & Acontecimentos do Dia ({dayNotes.length})
              </h3>
              {!isAddingNote && (
                <button
                  onClick={() => setIsAddingNote(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Nota
                </button>
              )}
            </div>

            {/* Note Creation Form */}
            {isAddingNote && (
              <form onSubmit={handleSaveNote} className="bg-[#121824] border border-amber-500/40 p-4 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Nova Anotação In-Game</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="note">Anotação Comum</option>
                    <option value="quest_deadline">Prazo de Missão / Ultimato</option>
                    <option value="world_event">Evento Histórico / Mundo</option>
                    <option value="holiday">Festival / Tradição</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Título do acontecimento..."
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  autoFocus
                />

                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Detalhes sobre o que ocorreu neste dia..."
                  rows={2}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                  >
                    Salvar Nota
                  </button>
                </div>
              </form>
            )}

            {/* List of day notes */}
            {dayNotes.length === 0 && !isAddingNote ? (
              <p className="text-xs text-slate-500 italic py-4 text-center border border-dashed border-[#2a3449] rounded-xl bg-[#0c1017]">
                Nenhum acontecimento registrado neste dia.
              </p>
            ) : (
              <div className="space-y-2">
                {dayNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#121824] border border-[#2a3449] flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5">{getCategoryIcon(note.category)}</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{note.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{note.content}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCalendarNote(note.id)}
                      className="text-slate-600 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#2a3449] bg-[#121824]">
          {!isToday ? (
            <button
              onClick={handleSetAsCurrentDay}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" /> Mover Relógio para Este Dia
            </button>
          ) : (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Este é o dia atual da campanha
            </span>
          )}

          <button
            onClick={() => setIsDayModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
