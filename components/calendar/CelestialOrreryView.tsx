'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Eye, 
  Compass, 
  Clock, 
  Flame,
  Calendar
} from 'lucide-react';
import { CampaignCalendarConfig, CampaignCalendarState, InGameDateTime } from '@/lib/types/calendar';
import { calculateOrrerySystem, OrrerySystemState } from '@/lib/calendar/calendarEngine';

interface CelestialOrreryViewProps {
  calendarConfig: CampaignCalendarConfig;
  calendarState: CampaignCalendarState;
  currentDateTime: InGameDateTime;
  onSetInGameDate?: (year: number, monthIndex: number, day: number) => void;
  isPlayerView?: boolean;
}

export const CelestialOrreryView: React.FC<CelestialOrreryViewProps> = ({
  calendarConfig,
  calendarState,
  currentDateTime,
  onSetInGameDate,
  isPlayerView = false,
}) => {
  // Observatório Time State (local scrubber)
  const [obsYear, setObsYear] = useState<number>(calendarState.currentYear);
  const [obsMonthIndex, setObsMonthIndex] = useState<number>(calendarState.currentMonthIndex);
  const [obsDay, setObsDay] = useState<number>(calendarState.currentDay);
  const [obsHour, setObsHour] = useState<number>(calendarState.currentHour || 12);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedBody, setSelectedBody] = useState<string>('sun');

  // Modo Visão da Terra para o Céu (Simulador Cinemático do Eclipse visto do chão)
  const [isSkywardModalOpen, setIsSkywardModalOpen] = useState<boolean>(false);
  const [skywardAnimProgress, setSkywardAnimProgress] = useState<number>(50);
  const [isAutoAnimatingSkyward, setIsAutoAnimatingSkyward] = useState<boolean>(true);

  // Sincronizar quando a data in-game mudar inicialmente
  useEffect(() => {
    setObsYear(calendarState.currentYear);
    setObsMonthIndex(calendarState.currentMonthIndex);
    setObsDay(calendarState.currentDay);
    setObsHour(calendarState.currentHour || 12);
  }, [calendarState.currentYear, calendarState.currentMonthIndex, calendarState.currentDay]);

  // Animação de Reprodução Orbital (Play/Pause)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setObsDay((prevDay) => {
        const currentMonth = calendarConfig.months[obsMonthIndex] || { days: 30 };
        if (prevDay >= (currentMonth.days || 30)) {
          // Próximo mês
          setObsMonthIndex((prevMonth) => {
            const totalMonths = calendarConfig.months.length || 12;
            if (prevMonth >= totalMonths - 1) {
              setObsYear((prevY) => prevY + 1);
              return 0;
            }
            return prevMonth + 1;
          });
          return 1;
        }
        return prevDay + 1;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isPlaying, obsMonthIndex, calendarConfig]);

  // Animação Contínua para o Modal da Visão da Terra para o Céu
  useEffect(() => {
    if (!isSkywardModalOpen || !isAutoAnimatingSkyward) return;
    const interval = setInterval(() => {
      setSkywardAnimProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 50);
    return () => clearInterval(interval);
  }, [isSkywardModalOpen, isAutoAnimatingSkyward]);

  const orreryState: OrrerySystemState = calculateOrrerySystem(
    calendarConfig,
    obsYear,
    obsMonthIndex,
    obsDay,
    obsHour,
    0
  );

  const currentMonth = calendarConfig.months[obsMonthIndex] || { name: 'Mês', days: 30 };
  const totalMonths = calendarConfig.months.length || 12;
  const daysInCurrentMonth = currentMonth.days || 30;

  const handlePrevDay = () => {
    if (obsDay <= 1) {
      const prevMonthIdx = (obsMonthIndex - 1 + totalMonths) % totalMonths;
      const prevYear = obsMonthIndex === 0 ? obsYear - 1 : obsYear;
      const prevMonthDays = calendarConfig.months[prevMonthIdx]?.days || 30;
      setObsYear(prevYear);
      setObsMonthIndex(prevMonthIdx);
      setObsDay(prevMonthDays);
    } else {
      setObsDay((d) => d - 1);
    }
  };

  const handleNextDay = () => {
    if (obsDay >= daysInCurrentMonth) {
      const nextMonthIdx = (obsMonthIndex + 1) % totalMonths;
      const nextYear = obsMonthIndex === totalMonths - 1 ? obsYear + 1 : obsYear;
      setObsYear(nextYear);
      setObsMonthIndex(nextMonthIdx);
      setObsDay(1);
    } else {
      setObsDay((d) => d + 1);
    }
  };

  const handleResetToToday = () => {
    setObsYear(calendarState.currentYear);
    setObsMonthIndex(calendarState.currentMonthIndex);
    setObsDay(calendarState.currentDay);
    setObsHour(calendarState.currentHour || 12);
    setIsPlaying(false);
  };

  const constellationNames = [
    'O Dragão Dourado', 'A Espada de Torm', 'O Cálice Sagrado', 'A Coroa de Prata',
    'O Lobo Noturno', 'A Serpente Astral', 'A Árvore Cósmica', 'A Fênix Flamejante',
    'O Escudo de Mystra', 'O Tridente Abissal', 'A Rosa dos Ventos', 'O Corvo de Selûne'
  ];

  const activeEvent = orreryState.activeCelestialEvent;
  const eventType = activeEvent?.type || 'solar_eclipse';
  const alignmentFactor = 1 - Math.abs(skywardAnimProgress - 50) / 50;
  const moonOffsetX = (skywardAnimProgress - 50) * 3.2;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] overflow-hidden text-slate-100 p-2 sm:p-4 select-none relative">
      {/* Top Scrubber & Astrolabe Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 bg-[#0e1422]/90 border border-amber-500/30 p-2.5 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md">
        {/* Date Display */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-md shadow-amber-500/5">
            <Compass className="w-5 h-5 animate-[spin_60s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">
                {isPlayerView ? 'EXPLORADOR ASTRAL (JOGADOR)' : 'OBSERVATÓRIO ASTRAL'}
              </span>
              {orreryState.activeCelestialEvent && (
                <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold animate-pulse flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> {orreryState.activeCelestialEvent.name}
                </span>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-100 tracking-wide">
              Dia {obsDay} de {currentMonth.name}, {obsYear} {calendarConfig.yearSuffix}
            </h3>
          </div>
        </div>

        {/* Time Scrubber Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 sm:p-2 bg-[#141b2d] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#2a3752] rounded-xl transition-all cursor-pointer"
            title="Dia Anterior (-1d)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pausar Órbitas</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ver Movimento Astral</span>
              </>
            )}
          </button>

          <button
            onClick={handleNextDay}
            className="p-1.5 sm:p-2 bg-[#141b2d] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-[#2a3752] rounded-xl transition-all cursor-pointer"
            title="Próximo Dia (+1d)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetToToday}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 bg-[#141b2d] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#2a3752] rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Resetar para o Dia Atual In-Game"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hoje</span>
          </button>

          {/* Botão de Visão da Terra para o Céu */}
          <button
            onClick={() => setIsSkywardModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-gradient-to-r from-amber-500/30 to-rose-500/30 hover:from-amber-500/40 hover:to-rose-500/40 text-amber-200 border border-amber-500/50 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer"
            title="Abrir Visão da Terra para o Céu (Simulação do Fenômeno em Primeira Pessoa)"
          >
            <Eye className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">Olhar para o Céu</span>
          </button>

          {!isPlayerView && onSetInGameDate && (
            <button
              onClick={() => onSetInGameDate(obsYear, obsMonthIndex, obsDay)}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Definir esta data como o momento atual da campanha"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Definir In-Game</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Astrolabe Stage & Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3 min-h-0 overflow-hidden">
        {/* Central Planetarium / Astrolabe (Canvas / Interactive SVG) */}
        <div className="lg:col-span-8 bg-[#0a0f1c] border border-[#232f48] rounded-2xl relative flex items-center justify-center overflow-hidden p-2 shadow-2xl">
          {/* Background Starfield & Nebula Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#131f38] via-[#080d1a] to-[#04060b] opacity-90" />
          
          {/* Subtle Celestial Coordinates Grid */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
            <defs>
              <pattern id="astral-grid-main" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.75" fill="#38bdf8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#astral-grid-main)" />
          </svg>

          {/* Interactive Astrolabe SVG Planetarium */}
          <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
            <svg viewBox="0 0 500 500" className="w-full h-full">
              {/* Outer Zodiac Constellation Ring */}
              <circle cx="250" cy="250" r="230" fill="none" stroke="#253553" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="250" cy="250" r="215" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />

              {/* Constellation Markers along 360 deg */}
              {constellationNames.map((name, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x = 250 + 222 * Math.cos(angle);
                const y = 250 + 222 * Math.sin(angle);
                const isCurrentSign = i === orreryState.zodiacConstellationIndex % 12;

                return (
                  <g key={name} className="cursor-pointer">
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isCurrentSign ? 4 : 2} 
                      fill={isCurrentSign ? '#fbbf24' : '#64748b'} 
                      className={isCurrentSign ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              })}

              {/* Solar Orbit Trail */}
              <circle cx="250" cy="250" r="175" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />

              {/* Moon Orbit Trails */}
              {orreryState.moons.map((moon, i) => {
                const radius = 100 + i * 35;
                return (
                  <circle
                    key={moon.id}
                    cx="250"
                    cy="250"
                    r={radius}
                    fill="none"
                    stroke={moon.color}
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    opacity="0.4"
                  />
                );
              })}

              {/* Light Rays from Sun to Central World */}
              {(() => {
                const sunAngleRad = ((orreryState.sun.angleDegrees - 90) * Math.PI) / 180;
                const sunX = 250 + 175 * Math.cos(sunAngleRad);
                const sunY = 250 + 175 * Math.sin(sunAngleRad);

                return (
                  <line
                    x1="250"
                    y1="250"
                    x2={sunX}
                    y2={sunY}
                    stroke="#fbbf24"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.25"
                  />
                );
              })()}

              {/* CENTRAL PLANET / WORLD (Toril / Valíria) */}
              <g className="cursor-pointer" onClick={() => setSelectedBody('world')}>
                {/* World Atmosphere Glow */}
                <circle cx="250" cy="250" r="34" fill="#0284c7" opacity="0.2" className="animate-pulse" />
                {/* World Body */}
                <circle cx="250" cy="250" r="26" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                {/* Continent Shading & Day/Night Terminus */}
                <path
                  d="M 250 224 A 26 26 0 0 1 250 276 A 26 26 0 0 0 250 224"
                  fill="#082f49"
                  opacity="0.75"
                />
                <circle cx="245" cy="245" r="7" fill="#10b981" opacity="0.8" />
                <circle cx="258" cy="254" r="5" fill="#059669" opacity="0.8" />
                <text x="250" y="295" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  Mundo Material
                </text>
              </g>

              {/* SUN (Orbital Body) */}
              {(() => {
                const sunAngleRad = ((orreryState.sun.angleDegrees - 90) * Math.PI) / 180;
                const sunX = 250 + 175 * Math.cos(sunAngleRad);
                const sunY = 250 + 175 * Math.sin(sunAngleRad);
                const isSelected = selectedBody === 'sun';

                return (
                  <g 
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedBody('sun')}
                  >
                    {/* Corona Glow */}
                    <circle cx={sunX} cy={sunY} r="22" fill="#f59e0b" opacity="0.25" className="animate-ping" />
                    <circle cx={sunX} cy={sunY} r="16" fill="#fbbf24" opacity="0.4" />
                    <circle cx={sunX} cy={sunY} r="11" fill="#fef08a" stroke="#d97706" strokeWidth="2" />
                    {isSelected && (
                      <circle cx={sunX} cy={sunY} r="20" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                    )}
                    <text x={sunX} y={sunY + 22} textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="bold">
                      ☀️ Sol
                    </text>
                  </g>
                );
              })()}

              {/* MOONS (Orbital Bodies) */}
              {orreryState.moons.map((moon, i) => {
                const radius = 100 + i * 35;
                const moonAngleRad = ((moon.angleDegrees - 90) * Math.PI) / 180;
                const moonX = 250 + radius * Math.cos(moonAngleRad);
                const moonY = 250 + radius * Math.sin(moonAngleRad);
                const isSelected = selectedBody === moon.id;

                return (
                  <g 
                    key={moon.id} 
                    className="cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setSelectedBody(moon.id)}
                  >
                    <circle cx={moonX} cy={moonY} r="12" fill={moon.color} opacity="0.2" />
                    <circle cx={moonX} cy={moonY} r="7" fill={moon.color} stroke="#38bdf8" strokeWidth="1.5" />
                    {isSelected && (
                      <circle cx={moonX} cy={moonY} r="14" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="2 2" />
                    )}
                    <text x={moonX} y={moonY + 18} textAnchor="middle" fill="#e0f2fe" fontSize="8" fontWeight="bold">
                      🌙 {moon.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick HUD Overlay */}
          <div className="absolute bottom-3 left-3 bg-[#080d18]/80 border border-[#2a3752] px-3 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Constelação Regente: <strong className="text-amber-300">{constellationNames[orreryState.zodiacConstellationIndex % 12]}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Detail Card / Grimoire of the Heavens */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto">
          {/* Celestial Body Dossier */}
          <div className="bg-[#0e1422] border border-[#253553] p-4 rounded-2xl shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#202c44]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Livro dos Astros
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedBody.toUpperCase()}
              </span>
            </div>

            {selectedBody === 'sun' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">O Sol (Aman / Hélio)</h4>
                    <p className="text-[11px] text-amber-300">Fonte Primordial de Luz & Calor</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Percorre o ciclo anual completo através das 12 constelações. No presente dia, projeta <strong>{Math.round(orreryState.skyLightLevel * 100)}%</strong> de iluminação máxima no zênite.
                </p>
                <div className="p-2.5 bg-[#080d18] border border-[#1e293b] rounded-xl text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Ângulo na Eclíptica:</span>
                    <strong className="text-amber-300 font-mono">{Math.round(orreryState.sun.angleDegrees)}°</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Estação Atual:</span>
                    <strong className="text-emerald-300">{currentMonth.season?.toUpperCase() || 'EQUILÍBRIO'}</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedBody !== 'sun' && selectedBody !== 'world' && (
              <div className="space-y-2">
                {(() => {
                  const moonInfo = orreryState.moons.find((m) => m.id === selectedBody) || orreryState.moons[0];
                  if (!moonInfo) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                          <Moon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100">{moonInfo.name}</h4>
                          <p className="text-[11px] text-cyan-300">{moonInfo.phaseLabel || 'Fase Celeste'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Iluminação do disco lunar: <strong className="text-cyan-300">{moonInfo.illuminationPercentage}%</strong>. Influencia o fluxo das marés e a intensidade de rituais noturnos.
                      </p>
                      <div className="p-2.5 bg-[#080d18] border border-[#1e293b] rounded-xl text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Posição Orbital:</span>
                          <strong className="text-cyan-300 font-mono">{Math.round(moonInfo.angleDegrees)}°</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Força das Marés:</span>
                          <strong className="text-blue-300">Intensa</strong>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {selectedBody === 'world' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">O Mundo Material</h4>
                    <p className="text-[11px] text-emerald-300">Eixo Central da Criação</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O plano material onde decorre a campanha. Todas as órbitas e fenômenos celestiais exercem presságios e influências mágicas sobre seus habitantes.
                </p>
              </div>
            )}
          </div>

          {/* Active Celestial Event Banner (if date matches an eclipse/alignment) */}
          {orreryState.activeCelestialEvent ? (
            <div className="bg-rose-950/40 border border-rose-500/50 p-4 rounded-2xl shadow-lg space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>FENÔMENO CELESTIAL DETECTADO!</span>
                </div>
              </div>
              <h4 className="text-sm font-black text-rose-100">{orreryState.activeCelestialEvent.name}</h4>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {orreryState.activeCelestialEvent.description}
              </p>
              {orreryState.activeCelestialEvent.omenEffect && (
                <div className="p-2 bg-rose-950/70 border border-rose-500/30 rounded-xl text-[11px] text-amber-300 font-medium">
                  ⚡ <strong>Efeito no RPG:</strong> {orreryState.activeCelestialEvent.omenEffect}
                </div>
              )}

              {/* Botão para ver a simulação da Terra para o Céu */}
              <button
                onClick={() => setIsSkywardModalOpen(true)}
                className="w-full mt-2 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Visão da Terra para o Céu (Simulação)</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#0e1422] border border-[#253553] p-4 rounded-2xl text-center space-y-2 text-slate-400">
              <Eye className="w-6 h-6 mx-auto text-slate-500 mb-1" />
              <p className="text-xs font-semibold text-slate-300">Céu Sereno</p>
              <p className="text-[11px] text-slate-500">
                Nenhum eclipse ou alinhamento anômalo no céu deste dia.
              </p>
              <button
                onClick={() => setIsSkywardModalOpen(true)}
                className="px-3 py-1.5 bg-[#141b2d] hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-[#253553] rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Céu Noturno/Diurno</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DA VISÃO DA TERRA PARA O CÉU (GROUND-TO-SKY CINEMATIC VIEW) --- */}
      {isSkywardModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#0b101c] border border-amber-500/40 rounded-3xl w-full max-w-4xl h-[90vh] max-h-[720px] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#0e1424] border-b border-[#202c44] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                      PERSPECTIVA DO AVENTUREIRO NO SOLO
                    </span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-bold">
                      {activeEvent ? activeEvent.name : 'Visão do Horizonte'}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                    O que os olhos dos heróis contemplam ao olhar para cima ({obsDay} de {currentMonth.name})
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsSkywardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                title="Fechar Visão do Céu"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Interactive Sky Stage */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden p-6">
              {/* Dynamic Atmospheric Sky Gradient */}
              <div
                className="absolute inset-0 transition-colors duration-300"
                style={{
                  background:
                    eventType === 'solar_eclipse'
                      ? `radial-gradient(circle at center, rgba(${Math.round(245 - 230 * alignmentFactor)}, ${Math.round(158 - 145 * alignmentFactor)}, ${Math.round(11 - 5 * alignmentFactor)}, ${0.4 - 0.2 * alignmentFactor}) 0%, #050811 75%)`
                      : eventType === 'blood_moon'
                      ? `radial-gradient(circle at center, rgba(${Math.round(220 * alignmentFactor)}, 20, 40, ${0.4 * alignmentFactor}) 0%, #050811 75%)`
                      : `radial-gradient(circle at center, rgba(30, 60, 110, 0.4) 0%, #050811 75%)`,
                }}
              />

              {/* Starfield Particles */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{ opacity: 0.3 + alignmentFactor * 0.7 }}
              >
                <div className="w-full h-full bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px]" />
              </div>

              {/* Celestial Actors on the Horizon */}
              <div className="relative w-80 h-80 flex items-center justify-center select-none">
                {/* 1. Solar Eclipse */}
                {eventType === 'solar_eclipse' && (
                  <>
                    <div
                      className="absolute rounded-full transition-transform duration-150"
                      style={{
                        width: '200px',
                        height: '200px',
                        background: 'radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, rgba(217, 119, 6, 0.4) 50%, transparent 70%)',
                        transform: `scale(${1 + alignmentFactor * 0.45})`,
                        filter: `blur(${4 + alignmentFactor * 8}px)`,
                      }}
                    />
                    {alignmentFactor > 0.6 && (
                      <div className="absolute inset-0 flex items-center justify-center animate-[spin_40s_linear_infinite] pointer-events-none">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-1.5 h-64 bg-amber-400/40 rounded-full blur-[1px]"
                            style={{ transform: `rotate(${i * 45}deg)` }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-100 shadow-[0_0_60px_rgba(251,191,36,0.85)] flex items-center justify-center relative z-0" />
                    <div
                      className="w-36 h-36 rounded-full bg-[#050811] border border-[#1e293b] shadow-2xl absolute z-10 transition-transform duration-75 flex items-center justify-center"
                      style={{ transform: `translateX(${moonOffsetX}px)` }}
                    >
                      {alignmentFactor > 0.85 && (
                        <div className="absolute inset-0 rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-black animate-pulse" />
                      )}
                    </div>
                  </>
                )}

                {/* 2. Blood Moon */}
                {eventType === 'blood_moon' && (
                  <>
                    <div
                      className="absolute rounded-full transition-all duration-300"
                      style={{
                        width: '180px',
                        height: '180px',
                        background: `radial-gradient(circle, rgba(239, 68, 68, ${0.3 + alignmentFactor * 0.6}) 0%, rgba(153, 27, 27, 0.2) 60%, transparent 80%)`,
                        filter: 'blur(10px)',
                      }}
                    />
                    <div
                      className="w-40 h-40 rounded-full border border-rose-500/40 shadow-2xl flex items-center justify-center relative transition-colors duration-500"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${
                          alignmentFactor > 0.5 ? '#ef4444' : '#94a3b8'
                        }, ${alignmentFactor > 0.5 ? '#7f1d1d' : '#334155'} 70%, #0f172a 100%)`,
                        boxShadow: alignmentFactor > 0.6 ? '0 0 40px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(148, 163, 184, 0.3)',
                      }}
                    >
                      <div className="text-xs font-bold font-mono text-rose-200 tracking-wider">
                        {alignmentFactor > 0.8 ? '🩸 LUA DE SANGUE' : 'Fase Lunar'}
                      </div>
                    </div>
                  </>
                )}

                {/* 3. Conjunction of Moons */}
                {(eventType === 'lunar_conjunction' || eventType === 'grand_alignment') && (
                  <>
                    {alignmentFactor > 0.7 && (
                      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping" />
                    )}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-400 shadow-[0_0_30px_rgba(224,242,254,0.6)] flex items-center justify-center relative z-0">
                      <span className="text-[10px] font-bold text-slate-800 font-mono">Selûne</span>
                    </div>
                    <div
                      className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(56,189,248,0.8)] absolute z-10 flex items-center justify-center opacity-90 transition-transform duration-75"
                      style={{ transform: `translateX(${moonOffsetX}px)` }}
                    >
                      <span className="text-[9px] font-bold text-slate-950 font-mono">Celene</span>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Scrubber Slider */}
              <div className="absolute bottom-5 inset-x-8 bg-[#080d18]/90 border border-[#2a3752] p-3 rounded-2xl backdrop-blur-md flex items-center gap-4">
                <button
                  onClick={() => setIsAutoAnimatingSkyward(!isAutoAnimatingSkyward)}
                  className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold cursor-pointer"
                  title={isAutoAnimatingSkyward ? 'Pausar Simulação' : 'Animar Simulação'}
                >
                  {isAutoAnimatingSkyward ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <span className="text-xs font-mono text-slate-400">Alinhamento:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={skywardAnimProgress}
                  onChange={(e) => {
                    setIsAutoAnimatingSkyward(false);
                    setSkywardAnimProgress(Number(e.target.value));
                  }}
                  className="flex-1 accent-amber-400 cursor-pointer h-2 bg-[#1a2336] rounded-lg"
                />
                <span className="text-xs font-black text-amber-300 font-mono w-12 text-right">
                  {skywardAnimProgress}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
