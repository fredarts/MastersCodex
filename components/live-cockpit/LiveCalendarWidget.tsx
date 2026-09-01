'use client';

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Moon, 
  Sun, 
  Compass, 
  Coffee, 
  Waves
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';

interface LiveCalendarWidgetProps {
  onOpenFullCalendar?: () => void;
  className?: string;
  defaultCollapsed?: boolean;
}

export const LiveCalendarWidget: React.FC<LiveCalendarWidgetProps> = ({
  onOpenFullCalendar,
  className = '',
  defaultCollapsed = true,
}) => {
  const {
    currentDateTime,
    advanceTime,
    setIsRestModalOpen,
    setIsTimeAdvanceModalOpen,
    setIsDayModalOpen,
    setSelectedDayForModal,
  } = useCampaignCalendar();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('masters_calendar_widget_collapsed');
      if (stored !== null) return stored === 'true';
    }
    return defaultCollapsed;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masters_calendar_widget_collapsed', String(next));
      }
      return next;
    });
  };

  const handleOpenTodayModal = () => {
    setSelectedDayForModal({
      monthIndex: currentDateTime.monthIndex,
      day: currentDateTime.day,
    });
    setIsDayModalOpen(true);
  };

  const primaryMoon = currentDateTime.moons[0];

  // Collapsed Mode: Only Moon/Sun toggle + Day number & Time
  if (isCollapsed) {
    return (
      <div className={`flex items-center gap-1.5 bg-[#121824]/90 border border-amber-500/20 px-2 py-1 rounded-xl shadow-lg backdrop-blur-md transition-all ${className}`}>
        {/* Moon/Sun Expand Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-7 h-7 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 flex items-center justify-center text-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer group/btn"
          title="Expandir ferramentas de tempo & descanso"
        >
          {currentDateTime.isNight ? (
            <Moon className="w-3.5 h-3.5 text-cyan-300 group-hover/btn:rotate-12 transition-transform" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-400 group-hover/btn:rotate-45 transition-transform" />
          )}
        </button>

        {/* Compact Day & Time (Click toggles collapse / expands full view) */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="text-left hover:opacity-90 transition-opacity flex items-center gap-1.5 px-1 cursor-pointer"
          title="Clique para expandir o calendário completo e clima"
        >
          <span className="text-xs font-bold text-slate-100 hover:text-amber-300 transition-colors">
            Dia {currentDateTime.day}
          </span>
          <span className="text-slate-600 text-xs">•</span>
          <span className="flex items-center gap-1 text-amber-400/90 font-mono font-bold text-xs">
            <Clock className="w-3 h-3" /> {currentDateTime.formattedTime}
          </span>
        </button>
      </div>
    );
  }

  // Expanded Mode: Full calendar details + quick action buttons
  return (
    <div className={`flex flex-wrap items-center gap-2 bg-[#121824]/90 border border-amber-500/20 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all ${className}`}>
      {/* Date & Time info with Moon/Sun collapse toggle button */}
      <div className="flex items-center gap-2 pr-2 border-r border-slate-700/60">
        {/* Moon/Sun Collapse Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/60 flex items-center justify-center text-amber-400 hover:scale-105 active:scale-95 transition-all cursor-pointer group/btn"
          title="Recolher / Colapsar widget de tempo"
        >
          {currentDateTime.isNight ? (
            <Moon className="w-4 h-4 text-cyan-300 group-hover/btn:rotate-12 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400 group-hover/btn:rotate-45 transition-transform" />
          )}
        </button>

        {/* Date text click opens day modal */}
        <button
          type="button"
          onClick={handleOpenTodayModal}
          className="text-left hover:opacity-90 transition-opacity"
          title="Clique para ver detalhes do dia, clima e notas in-game"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
              {currentDateTime.formattedDate}
            </span>
            {currentDateTime.holiday && (
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded">
                🎉 {currentDateTime.holiday.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-amber-400/90 font-mono font-bold">
              <Clock className="w-3 h-3" /> {currentDateTime.formattedTime}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">{currentDateTime.seasonLabel}</span>
            {primaryMoon && (
              <>
                <span>•</span>
                <span className="text-cyan-300 flex items-center gap-0.5">
                  <Moon className="w-2.5 h-2.5" /> {primaryMoon.phaseLabel} ({primaryMoon.illuminationPercentage}%)
                </span>
              </>
            )}
            {currentDateTime.tide && (
              <>
                <span>•</span>
                <span className="text-blue-300 flex items-center gap-0.5" title={currentDateTime.tide.label}>
                  <Waves className="w-2.5 h-2.5" /> {currentDateTime.tide.state === 'spring_tide' ? 'Maré Viva' : 'Maré Normal'}
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => advanceTime(10, 'Avanço Rápido (+10m)')}
          className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[11px] font-mono font-bold rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
          title="Avançar 10 minutos in-game"
        >
          +10m
        </button>

        <button
          onClick={() => advanceTime(60, 'Avanço de Hora (+1h)')}
          className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[11px] font-mono font-bold rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
          title="Avançar 1 hora in-game"
        >
          +1h
        </button>

        {/* Short Rest Quick Button */}
        <button
          onClick={() => setIsRestModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors cursor-pointer"
          title="Descanso Curto ou Longo"
        >
          <Coffee className="w-3.5 h-3.5 text-amber-400" />
          <span>Descanso</span>
        </button>

        {/* Travel & Custom Advance Modal Button */}
        <button
          onClick={() => setIsTimeAdvanceModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/30 transition-colors cursor-pointer"
          title="Calcular Viagem ou Avançar Múltiplos Dias"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Viagem / Tempo</span>
        </button>

        {/* Open Full Calendar */}
        {onOpenFullCalendar && (
          <button
            onClick={onOpenFullCalendar}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Abrir Visão Completa do Calendário"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
