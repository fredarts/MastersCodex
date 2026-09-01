'use client';

import React, { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Sparkles,
  Flame,
  Search,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Compass,
  Play,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Clock,
  ShieldAlert,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { 
  CampaignCalendarConfig, 
  CampaignCalendarState, 
  InGameDateTime, 
  CelestialEvent, 
  CelestialEventType 
} from '@/lib/types/calendar';
import { toast } from 'sonner';

interface CelestialConjunctionsViewProps {
  calendarConfig: CampaignCalendarConfig;
  calendarState: CampaignCalendarState;
  currentDateTime: InGameDateTime;
  onUpdateCalendarConfig?: (config: CampaignCalendarConfig) => Promise<void>;
  onSetInGameDate?: (year: number, monthIndex: number, day: number) => void;
  isDm?: boolean;
}

export const CelestialConjunctionsView: React.FC<CelestialConjunctionsViewProps> = ({
  calendarConfig,
  calendarState,
  currentDateTime,
  onUpdateCalendarConfig,
  onSetInGameDate,
  isDm = true,
}) => {
  // Lista de eventos celestiais configurados
  const celestialEvents = calendarConfig.celestialEvents || [];

  // Estado de seleção e simulação
  const [selectedEventId, setSelectedEventId] = useState<string>(
    celestialEvents[0]?.id || 'simulation_solar'
  );
  const [simulationType, setSimulationType] = useState<CelestialEventType>('solar_eclipse');
  const [animProgress, setAnimProgress] = useState<number>(50); // 0% a 100% de sobreposição
  const [isAutoAnimating, setIsAutoAnimating] = useState<boolean>(true);

  // Modo Investigação da Party
  const [investigationMonthIdx, setInvestigationMonthIdx] = useState<number>(calendarState.currentMonthIndex);
  const [investigationDay, setInvestigationDay] = useState<number>(calendarState.currentDay);
  const [discoveredEvents, setDiscoveredEvents] = useState<string[]>([]);

  // Modal / Formulário de Criação do Mestre
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<CelestialEventType>('solar_eclipse');
  const [newMonthIdx, setNewMonthIdx] = useState<number>(calendarState.currentMonthIndex);
  const [newDay, setNewDay] = useState<number>(15);
  const [newDesc, setNewDesc] = useState<string>('');
  const [newOmen, setNewOmen] = useState<string>('');
  const [newClue, setNewClue] = useState<string>('');

  // Animação Contínua da Simulação Visual
  useEffect(() => {
    if (!isAutoAnimating) return;

    const interval = setInterval(() => {
      setAnimProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoAnimating]);

  // Encontrar evento selecionado se existir
  const currentSelectedEvent = celestialEvents.find((e) => e.id === selectedEventId);

  useEffect(() => {
    if (currentSelectedEvent) {
      setSimulationType(currentSelectedEvent.type);
    }
  }, [currentSelectedEvent]);

  // Verificar se a data de investigação coincide com um eclipse
  const inspectedEclipse = celestialEvents.find(
    (e) => e.monthIndex === investigationMonthIdx && e.day === investigationDay
  );

  const handleCreateEvent = async () => {
    if (!newTitle.trim()) {
      toast.error('Informe um título para o evento celestial.');
      return;
    }

    const createdEvent: CelestialEvent = {
      id: `cel_${Date.now()}`,
      name: newTitle.trim(),
      type: newType,
      monthIndex: newMonthIdx,
      day: newDay,
      durationHours: 3,
      description: newDesc.trim() || 'Um impressionante espetáculo celestial que altera a iluminação dos céus.',
      omenEffect: newOmen.trim() || 'Alterações nas marés e ressonância com energias arcanas.',
      clues: newClue.trim() ? [newClue.trim()] : ['Rumores entre estudiosos e navegadores falam de um sinal nos céus.'],
      isDiscoveredByPlayers: false,
    };

    const updatedEvents = [...celestialEvents, createdEvent];
    const updatedConfig = {
      ...calendarConfig,
      celestialEvents: updatedEvents,
    };

    if (onUpdateCalendarConfig) {
      await onUpdateCalendarConfig(updatedConfig);
      toast.success(`Evento "${createdEvent.name}" agendado no calendário com sucesso!`);
    }

    setIsCreateModalOpen(false);
    setSelectedEventId(createdEvent.id);
    setNewTitle('');
    setNewDesc('');
    setNewOmen('');
    setNewClue('');
  };

  const handleDeleteEvent = async (id: string) => {
    const updatedEvents = celestialEvents.filter((e) => e.id !== id);
    const updatedConfig = {
      ...calendarConfig,
      celestialEvents: updatedEvents,
    };
    if (onUpdateCalendarConfig) {
      await onUpdateCalendarConfig(updatedConfig);
      toast.success('Evento celestial removido.');
    }
  };

  const handleRevealToParty = async (event: CelestialEvent) => {
    const updatedEvents = celestialEvents.map((e) =>
      e.id === event.id ? { ...e, isDiscoveredByPlayers: true } : e
    );
    const updatedConfig = {
      ...calendarConfig,
      celestialEvents: updatedEvents,
    };
    if (onUpdateCalendarConfig) {
      await onUpdateCalendarConfig(updatedConfig);
      toast.success(`O eclipse "${event.name}" foi revelado para os aventureiros!`);
    }
  };

  // Calcular interpolação de posições para a animação
  // 0% = Longe à esquerda, 50% = Alinhamento Total / Eclipse Pleno, 100% = Afastamento à direita
  const alignmentFactor = 1 - Math.abs(animProgress - 50) / 50; // 0.0 nas bordas, 1.0 no centro perfeito
  const moonOffsetX = (animProgress - 50) * 3.2; // -160px a +160px

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] overflow-hidden text-slate-100 p-2 sm:p-4 select-none">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0e1422]/90 border border-amber-500/30 p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-md shadow-amber-500/5">
            <Flame className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">
                SISTEMA DE ECLIPSES & CONJUNÇÕES
              </span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                JOGO DE PISTAS & INVESTIGAÇÃO
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-100 tracking-wide">
              Simulador Cinemático e Radar de Fenômenos Cósmicos
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isDm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Novo Eclipse</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Visual Animation Stage + Events & Investigation Panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3 min-h-0 overflow-hidden">
        {/* Left / Center: Game-like Cinematic Simulation Stage (Col 7) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0a0f1c] border border-[#232f48] rounded-2xl overflow-hidden shadow-2xl relative">
          {/* Top Simulation Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#0d1424]/90 border-b border-[#202c44] z-10">
            {/* Fenômeno Selector */}
            <div className="flex items-center gap-1 bg-[#080d18] border border-[#253553] p-1 rounded-xl">
              <button
                onClick={() => setSimulationType('solar_eclipse')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  simulationType === 'solar_eclipse'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ☀️ Solar
              </button>
              <button
                onClick={() => setSimulationType('blood_moon')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  simulationType === 'blood_moon'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🩸 Lua de Sangue
              </button>
              <button
                onClick={() => setSimulationType('lunar_conjunction')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  simulationType === 'lunar_conjunction'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌙🌙 Beijo das Luas
              </button>
              <button
                onClick={() => setSimulationType('grand_alignment')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  simulationType === 'grand_alignment'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🪐 Grande Alinhamento
              </button>
            </div>

            {/* Animation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoAnimating(!isAutoAnimating)}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                  isAutoAnimating
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title={isAutoAnimating ? 'Pausar Animação' : 'Reproduzir Animação'}
              >
                {isAutoAnimating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Interactive Celestial Canvas Stage */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
            {/* Dynamic Sky Atmosphere based on alignmentFactor */}
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{
                background:
                  simulationType === 'solar_eclipse'
                    ? `radial-gradient(circle at center, rgba(${Math.round(245 - 230 * alignmentFactor)}, ${Math.round(158 - 145 * alignmentFactor)}, ${Math.round(11 - 5 * alignmentFactor)}, ${0.4 - 0.2 * alignmentFactor}) 0%, #060913 75%)`
                    : simulationType === 'blood_moon'
                    ? `radial-gradient(circle at center, rgba(${Math.round(220 * alignmentFactor)}, 20, 40, ${0.4 * alignmentFactor}) 0%, #060913 75%)`
                    : `radial-gradient(circle at center, rgba(30, 60, 110, 0.4) 0%, #060913 75%)`,
              }}
            />

            {/* Starfield Particles (sparkling when sky darkens) */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{ opacity: 0.3 + alignmentFactor * 0.7 }}
            >
              <div className="w-full h-full bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px]" />
            </div>

            {/* VISUAL SCENE: Eclipse / Conjunction Actors */}
            <div className="relative w-72 h-72 flex items-center justify-center select-none">
              {/* --- 1. SOLAR ECLIPSE MODE --- */}
              {simulationType === 'solar_eclipse' && (
                <>
                  {/* Solar Corona Glow (Expands when moon covers the center) */}
                  <div
                    className="absolute rounded-full transition-transform duration-150"
                    style={{
                      width: '180px',
                      height: '180px',
                      background: 'radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, rgba(217, 119, 6, 0.4) 50%, transparent 70%)',
                      transform: `scale(${1 + alignmentFactor * 0.45})`,
                      filter: `blur(${4 + alignmentFactor * 8}px)`,
                    }}
                  />

                  {/* Corona Solar Flares Rays */}
                  {alignmentFactor > 0.6 && (
                    <div className="absolute inset-0 flex items-center justify-center animate-[spin_40s_linear_infinite] pointer-events-none">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-56 bg-amber-400/40 rounded-full blur-[1px]"
                          style={{ transform: `rotate(${i * 45}deg)` }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Sun Body (Golden Disc) */}
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-100 shadow-[0_0_50px_rgba(251,191,36,0.8)] flex items-center justify-center relative z-0" />

                  {/* Moon Body (Silhouette gliding over Sun) */}
                  <div
                    className="w-32 h-32 rounded-full bg-[#070b14] border border-[#1e293b] shadow-2xl absolute z-10 transition-transform duration-75 flex items-center justify-center"
                    style={{
                      transform: `translateX(${moonOffsetX}px)`,
                    }}
                  >
                    {/* Ring of Fire edge when nearly centered */}
                    {alignmentFactor > 0.85 && (
                      <div className="absolute inset-0 rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse" />
                    )}
                  </div>
                </>
              )}

              {/* --- 2. BLOOD MOON MODE --- */}
              {simulationType === 'blood_moon' && (
                <>
                  <div
                    className="absolute rounded-full transition-all duration-300"
                    style={{
                      width: '160px',
                      height: '160px',
                      background: `radial-gradient(circle, rgba(239, 68, 68, ${0.3 + alignmentFactor * 0.6}) 0%, rgba(153, 27, 27, 0.2) 60%, transparent 80%)`,
                      filter: 'blur(10px)',
                    }}
                  />
                  <div
                    className="w-36 h-36 rounded-full border border-rose-500/40 shadow-2xl flex items-center justify-center relative transition-colors duration-500"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, ${
                        alignmentFactor > 0.5 ? '#ef4444' : '#94a3b8'
                      }, ${alignmentFactor > 0.5 ? '#7f1d1d' : '#334155'} 70%, #0f172a 100%)`,
                      boxShadow: alignmentFactor > 0.6 ? '0 0 40px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(148, 163, 184, 0.3)',
                    }}
                  >
                    <div className="text-[10px] font-bold font-mono text-rose-200 tracking-wider">
                      {alignmentFactor > 0.8 ? '🩸 LUA DE SANGUE' : 'Fase Lunar'}
                    </div>
                  </div>
                </>
              )}

              {/* --- 3. LUNAR-LUNAR CONJUNCTION --- */}
              {simulationType === 'lunar_conjunction' && (
                <>
                  {/* Resonance Waves */}
                  {alignmentFactor > 0.7 && (
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping" />
                  )}
                  {/* Moon 1 (Selûne) */}
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-100 to-slate-400 shadow-[0_0_25px_rgba(224,242,254,0.6)] flex items-center justify-center relative z-0">
                    <span className="text-[9px] font-bold text-slate-800 font-mono">Selûne</span>
                  </div>
                  {/* Moon 2 (Lágrima / Segunda Lua) */}
                  <div
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_25px_rgba(56,189,248,0.8)] absolute z-10 flex items-center justify-center opacity-90 transition-transform duration-75"
                    style={{
                      transform: `translateX(${moonOffsetX}px)`,
                    }}
                  >
                    <span className="text-[8px] font-bold text-slate-950 font-mono">Celene</span>
                  </div>
                </>
              )}

              {/* --- 4. GRAND ALIGNMENT (SYZYGY) --- */}
              {simulationType === 'grand_alignment' && (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Alignment Beam Line */}
                  <div
                    className="absolute w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent transition-opacity"
                    style={{ opacity: alignmentFactor }}
                  />
                  {/* Sun */}
                  <div className="w-20 h-20 rounded-full bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.8)] z-0" />
                  {/* Planet 1 */}
                  <div
                    className="w-10 h-10 rounded-full bg-emerald-400 absolute shadow-[0_0_15px_rgba(52,211,153,0.7)]"
                    style={{ transform: `translateX(${-80 + moonOffsetX * 0.4}px)` }}
                  />
                  {/* Moon */}
                  <div
                    className="w-8 h-8 rounded-full bg-cyan-300 absolute shadow-[0_0_15px_rgba(103,232,249,0.7)]"
                    style={{ transform: `translateX(${70 + moonOffsetX * 0.6}px)` }}
                  />
                </div>
              )}
            </div>

            {/* Bottom Scrubber Slider */}
            <div className="absolute bottom-3 inset-x-6 bg-[#080d18]/85 border border-[#2a3752] p-2 rounded-xl backdrop-blur-md flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400">Progresso:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={animProgress}
                onChange={(e) => {
                  setIsAutoAnimating(false);
                  setAnimProgress(Number(e.target.value));
                }}
                className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-[#1a2336] rounded-lg"
              />
              <span className="text-xs font-bold text-amber-300 font-mono w-10 text-right">
                {animProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Scheduled Eclipses & Party Investigation Hub (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto">
          {/* Party Astrological Investigation Box */}
          <div className="bg-[#0e1422] border border-cyan-500/30 p-3.5 rounded-2xl shadow-lg space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#202c44]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Investigação Cósmica da Party
              </span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold">
                Buscar Pistas
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Use as pistas obtidas na aventura para investigar o céu dia a dia e desvendar quando o próximo fenômeno ocorrerá:
            </p>

            {/* Day Inspection Selector */}
            <div className="flex items-center gap-2 bg-[#080d18] border border-[#253553] p-2 rounded-xl">
              <select
                value={investigationMonthIdx}
                onChange={(e) => setInvestigationMonthIdx(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-200 font-bold focus:outline-none flex-1 cursor-pointer"
              >
                {calendarConfig.months.map((m, idx) => (
                  <option key={m.id || idx} value={idx} className="bg-[#141b2d] text-slate-100">
                    {m.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 text-xs">
                <button
                  onClick={() => setInvestigationDay((d) => Math.max(1, d - 1))}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-bold text-amber-300 px-1">
                  Dia {investigationDay}
                </span>
                <button
                  onClick={() => {
                    const maxDays = calendarConfig.months[investigationMonthIdx]?.days || 30;
                    setInvestigationDay((d) => Math.min(maxDays, d + 1));
                  }}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inspection Result Box */}
            {inspectedEclipse ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl space-y-1.5 animate-pulse">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>ALINHAMENTO ENCONTRADO!</span>
                </div>
                <h4 className="text-xs font-black text-emerald-100">{inspectedEclipse.name}</h4>
                <p className="text-[11px] text-emerald-200/90 leading-tight">
                  {inspectedEclipse.revealedTelescopeClue || 'Os cálculos e sinais nos céus confirmam: este é o dia do grande evento!'}
                </p>
                {onSetInGameDate && (
                  <button
                    onClick={() => onSetInGameDate(calendarState.currentYear, inspectedEclipse.monthIndex, inspectedEclipse.day)}
                    className="mt-1 w-full py-1 bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 text-[10px] font-bold rounded-lg border border-emerald-500/50 transition-colors"
                  >
                    Avançar Calendário In-Game para este Dia
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-[#080d18] border border-[#1e293b] rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Nenhum eclipse neste dia específico. Continue investigando os manuscritos e observando o céu.</span>
              </div>
            )}
          </div>

          {/* DM's Scheduled Eclipses List */}
          <div className="bg-[#0e1422] border border-[#253553] p-3.5 rounded-2xl shadow-lg space-y-3 flex-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#202c44]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Eclipses Agendados ({celestialEvents.length})
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {celestialEvents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Nenhum eclipse agendado ainda. Clique em "Agendar Novo Eclipse" para criar um mistério astrológico!
                </p>
              ) : (
                celestialEvents.map((evt) => {
                  const monthName = calendarConfig.months[evt.monthIndex]?.name || 'Mês';
                  const isSelected = selectedEventId === evt.id;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setSimulationType(evt.type);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-[#080d18] border-[#202c44] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">
                            {evt.type === 'solar_eclipse' ? '☀️' : evt.type === 'blood_moon' ? '🩸' : '🌙'}
                          </span>
                          <h4 className="text-xs font-bold text-slate-100 truncate max-w-[180px]">
                            {evt.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          {evt.day} de {monthName}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-1 leading-tight">
                        {evt.description}
                      </p>

                      {/* Clues Preview */}
                      {evt.clues && evt.clues.length > 0 && (
                        <div className="text-[10px] text-cyan-300/80 bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20">
                          📜 <em>Pista:</em> {evt.clues[0]}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1a2336] text-[10px]">
                        {isDm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(evt.id);
                            }}
                            className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        )}

                        {onSetInGameDate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetInGameDate(calendarState.currentYear, evt.monthIndex, evt.day);
                              toast.success(`Data in-game avançada para ${evt.day} de ${monthName}!`);
                            }}
                            className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 ml-auto"
                          >
                            <Calendar className="w-3 h-3" /> Ir para esta data
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DM Create Eclipse Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-amber-500/40 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#253553]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Agendar Fenômeno Celestial ou Eclipse</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Título do Evento Celestial:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: O Olho Negro de Cyric, Eclipse da Lua de Sangue..."
                  className="w-full bg-[#080d18] border border-[#253553] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Tipo de Fenômeno:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CelestialEventType)}
                    className="w-full bg-[#080d18] border border-[#253553] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="solar_eclipse">☀️ Eclipse Solar</option>
                    <option value="blood_moon">🩸 Lua de Sangue (Eclipse Lunar)</option>
                    <option value="lunar_conjunction">🌙🌙 Conjunção de Luas</option>
                    <option value="grand_alignment">🪐 Grande Alinhamento Cósmico</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Mês:</label>
                    <select
                      value={newMonthIdx}
                      onChange={(e) => setNewMonthIdx(Number(e.target.value))}
                      className="w-full bg-[#080d18] border border-[#253553] rounded-xl px-2 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                    >
                      {calendarConfig.months.map((m, idx) => (
                        <option key={m.id || idx} value={idx}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Dia:</label>
                    <input
                      type="number"
                      min={1}
                      max={calendarConfig.months[newMonthIdx]?.days || 30}
                      value={newDay}
                      onChange={(e) => setNewDay(Number(e.target.value))}
                      className="w-full bg-[#080d18] border border-[#253553] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Descrição Visual & Lore:</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Descreva a aparência do céu, o escurecimento do dia e o impacto no mundo..."
                  className="w-full bg-[#080d18] border border-[#253553] rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400 h-16 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Efeitos Mágicos / Regras de RPG (Presságio):</label>
                <input
                  type="text"
                  value={newOmen}
                  onChange={(e) => setNewOmen(e.target.value)}
                  placeholder="Ex: +2 CD em magias de Ilusão, monstros da escuridão ganham vantagem..."
                  className="w-full bg-[#080d18] border border-[#253553] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Pista para a Investigação dos Jogadores:</label>
                <input
                  type="text"
                  value={newClue}
                  onChange={(e) => setNewClue(e.target.value)}
                  placeholder="Ex: Textos antigos dizem que quando as duas luas se cruzarem no 20º dia..."
                  className="w-full bg-[#080d18] border border-[#253553] rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#253553]">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEvent}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-colors"
              >
                Salvar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
