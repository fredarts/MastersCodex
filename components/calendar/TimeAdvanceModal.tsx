'use client';

import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Compass, 
  Calendar as CalendarIcon, 
  ArrowRight, 
  Check, 
  Zap, 
  MapPin, 
  ShieldAlert, 
  Utensils 
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { calculateTravel } from '@/lib/calendar/travelCalculator';
import { 
  TravelMode, 
  TravelPace, 
  TravelTerrain, 
  TravelCalculationParams 
} from '@/lib/types/calendar';

export const TimeAdvanceModal: React.FC = () => {
  const { 
    isTimeAdvanceModalOpen, 
    setIsTimeAdvanceModalOpen, 
    currentDateTime, 
    advanceTime, 
    performTravel 
  } = useCampaignCalendar();
  const { activeCampaign } = useCampaign();

  const [activeTab, setActiveTab] = useState<'quick' | 'travel'>('quick');

  // Quick Skip Form
  const [skipDays, setSkipDays] = useState<number>(0);
  const [skipHours, setSkipHours] = useState<number>(1);
  const [skipMinutes, setSkipMinutes] = useState<number>(0);
  const [skipReason, setSkipReason] = useState<string>('Exploração & Investigação');

  // Travel Form
  const [distanceMiles, setDistanceMiles] = useState<number>(24);
  const [unit, setUnit] = useState<'miles' | 'km'>('miles');
  const [terrain, setTerrain] = useState<TravelTerrain>('road');
  const [pace, setPace] = useState<TravelPace>('normal');
  const [mode, setMode] = useState<TravelMode>('foot');
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [travelDestination, setTravelDestination] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isTimeAdvanceModalOpen) return null;

  const partyCount = activeCampaign?.partyMembers?.length || 4;

  const effectiveMiles = unit === 'km' ? distanceMiles / 1.609 : distanceMiles;

  const travelParams: TravelCalculationParams = {
    distanceMiles: effectiveMiles,
    pace,
    terrain,
    mode,
    hoursPerDay,
    partyMembersCount: partyCount,
  };

  const travelPreview = calculateTravel(travelParams);

  const handleApplyQuickSkip = async (days: number, hours: number, mins: number, reason: string) => {
    setIsProcessing(true);
    try {
      const totalMinutes = (days * 24 * 60) + (hours * 60) + mins;
      if (totalMinutes > 0) {
        await advanceTime(totalMinutes, reason, true);
        setIsTimeAdvanceModalOpen(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteTravel = async () => {
    setIsProcessing(true);
    try {
      const label = travelDestination.trim()
        ? `Viagem rumo a ${travelDestination.trim()}`
        : `Marcha da Party (${travelPreview.daysRequired} dias)`;
      await performTravel(travelParams, label);
      setIsTimeAdvanceModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f141d] border border-[#2a3449] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3449] bg-[#121824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Passagem de Tempo & Viagens
              </h2>
              <p className="text-xs text-slate-400">
                Data Atual: <span className="text-amber-300 font-medium">{currentDateTime.formattedFull}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTimeAdvanceModalOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2a3449] bg-[#0c1017] px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'quick'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" /> Avanço de Relógio & Dias
          </button>
          <button
            onClick={() => setActiveTab('travel')}
            className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'travel'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" /> Calculador de Viagem (D&D 5e)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Presets Rápidos */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Atalhos Rápidos
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => handleApplyQuickSkip(0, 0, 10, 'Avanço Rápido (+10m)')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +10 Minutos
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(0, 1, 0, 'Exploração de 1 Hora')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +1 Hora
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(0, 4, 0, 'Turno de 4 Horas')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +4 Horas
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(1, 0, 0, 'Passagem de 1 Dia')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +1 Dia
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(7, 0, 0, '1 Semana de Downtime')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +7 Dias
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(10, 0, 0, '1 Decêndio Completo')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +10 Dias (Decêndio)
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(30, 0, 0, '1 Mês Inteiro')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] text-xs font-bold text-slate-200 transition-colors text-center"
                  >
                    +30 Dias (Mês)
                  </button>
                  <button
                    onClick={() => handleApplyQuickSkip(365, 0, 0, 'Salto Temporal de 1 Ano')}
                    className="p-2 rounded-xl bg-[#121824] hover:bg-[#1a2334] border border-amber-500/30 text-xs font-bold text-amber-300 transition-colors text-center"
                  >
                    +1 Ano
                  </button>
                </div>
              </div>

              {/* Custom Time Skip Inputs */}
              <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Avanço Customizado
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Dias</span>
                    <input
                      type="number"
                      min="0"
                      value={skipDays}
                      onChange={(e) => setSkipDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 font-mono text-sm text-slate-100 text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Horas</span>
                    <input
                      type="number"
                      min="0"
                      value={skipHours}
                      onChange={(e) => setSkipHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 font-mono text-sm text-slate-100 text-center"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Minutos</span>
                    <input
                      type="number"
                      min="0"
                      value={skipMinutes}
                      onChange={(e) => setSkipMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 font-mono text-sm text-slate-100 text-center"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Motivo / Descrição do Log
                  </span>
                  <input
                    type="text"
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    placeholder="Ex: Treinamento de Downtime, Estudo arcano..."
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'travel' && (
            <div className="space-y-4">
              {/* Destination & Distance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Destino da Marcha / Viagem
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={travelDestination}
                      onChange={(e) => setTravelDestination(e.target.value)}
                      placeholder="Ex: Neverwinter, Castelo Cragmaw..."
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Distância
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={distanceMiles}
                      onChange={(e) => setDistanceMiles(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-xl px-3 py-2 font-mono text-xs text-slate-100 text-center"
                    />
                    <div className="flex bg-[#0a0d14] border border-[#2a3449] rounded-xl p-1">
                      <button
                        onClick={() => setUnit('miles')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                          unit === 'miles' ? 'bg-indigo-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        Milhas
                      </button>
                      <button
                        onClick={() => setUnit('km')}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                          unit === 'km' ? 'bg-indigo-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        Km
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Horas de Marcha por Dia
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Math.max(1, parseInt(e.target.value) || 8))}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-xl px-3 py-2 font-mono text-xs text-slate-100 text-center"
                  />
                </div>
              </div>

              {/* Mode & Terrain */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Meio de Transporte
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as TravelMode)}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="foot">A Pé (24 milhas/dia)</option>
                    <option value="horseback">A Cavalo (32 milhas/dia)</option>
                    <option value="cart">Carroça / Animais de Carga (24 milhas/dia)</option>
                    <option value="carriage">Carruagem Rápida (28 milhas/dia)</option>
                    <option value="sailing_ship">Navio Veleiro (48 milhas/dia)</option>
                    <option value="flying">Voo / Montaria Alada (64 milhas/dia)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Terreno Predominante
                  </label>
                  <select
                    value={terrain}
                    onChange={(e) => setTerrain(e.target.value as TravelTerrain)}
                    className="w-full bg-[#121824] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="road">Estrada Pavimentada (1.0x)</option>
                    <option value="plains">Planície / Prado Aberto (1.0x)</option>
                    <option value="forest">Floresta / Bosque Fechado (1.5x)</option>
                    <option value="hills">Colinas Acidentadas (1.5x)</option>
                    <option value="mountains">Montanhas Escarpadas (2.0x)</option>
                    <option value="swamp">Pântano / Terreno Enlameado (2.0x)</option>
                    <option value="desert">Deserto Escaldante (2.0x)</option>
                    <option value="underdark">Subterrâneo / Underdark (2.5x)</option>
                  </select>
                </div>
              </div>

              {/* Pace Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Ritmo de Deslocamento (Pace)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPace('slow')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pace === 'slow'
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-slate-100'
                        : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-emerald-400">Lento (18 mi/d)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Permite Furtividade</div>
                  </button>
                  <button
                    onClick={() => setPace('normal')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pace === 'normal'
                        ? 'bg-indigo-500/20 border-indigo-500/60 text-slate-100'
                        : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-indigo-400">Normal (24 mi/d)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Sem modificadores</div>
                  </button>
                  <button
                    onClick={() => setPace('fast')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      pace === 'fast'
                        ? 'bg-amber-500/20 border-amber-500/60 text-slate-100'
                        : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-400">Rápido (30 mi/d)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">-5 Percepção Passiva</div>
                  </button>
                </div>
              </div>

              {/* Travel Summary Box */}
              <div className="bg-[#121824] border border-indigo-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tempo de Viagem Estimado:</span>
                  <span className="text-indigo-300 font-bold font-mono">
                    {travelPreview.daysRequired} {travelPreview.daysRequired === 1 ? 'Dia' : 'Dias'} ({travelPreview.totalHours}h de marcha)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Suprimentos Consumidos:
                  </span>
                  <span className="text-emerald-300 font-medium">
                    {travelPreview.rationsConsumed} rações / {travelPreview.waterGallonsConsumed} galões de água
                  </span>
                </div>

                {travelPreview.forcedMarchHours > 0 && (
                  <div className="pt-2 border-t border-[#2a3449] flex items-center gap-2 text-rose-400 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Marcha Forçada (+{travelPreview.forcedMarchHours}h/dia):</strong> Exige salvaguarda de CON CD {travelPreview.forcedMarchConSaveDC} contra Exaustão!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a3449] bg-[#121824]">
          <button
            onClick={() => setIsTimeAdvanceModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          {activeTab === 'quick' ? (
            <button
              onClick={() => handleApplyQuickSkip(skipDays, skipHours, skipMinutes, skipReason)}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isProcessing ? 'Avançando...' : 'Avançar Tempo'}</span>
            </button>
          ) : (
            <button
              onClick={handleExecuteTravel}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Compass className="w-4 h-4" />
              <span>{isProcessing ? 'Viajando...' : `Iniciar Viagem (+${travelPreview.daysRequired}d)`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
