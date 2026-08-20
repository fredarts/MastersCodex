'use client';

import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Plus, 
  Trash2, 
  Sparkles, 
  Save, 
  Moon, 
  Calendar as CalendarIcon, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { useCampaignCalendar } from '@/lib/hooks/useCampaignCalendar';
import { CampaignCalendarConfig, CalendarMonth, CalendarMoon, CalendarHoliday } from '@/lib/types/calendar';
import { CALENDAR_PRESETS } from '@/lib/calendar/calendarPresets';

export const CalendarSettingsModal: React.FC = () => {
  const {
    calendarConfig,
    isCalendarSettingsOpen,
    setIsCalendarSettingsOpen,
    updateCalendarConfig,
    applyPreset,
  } = useCampaignCalendar();

  const [activeTab, setActiveTab] = useState<'general' | 'months' | 'moons' | 'holidays'>('general');
  const [configDraft, setConfigDraft] = useState<CampaignCalendarConfig>({ ...calendarConfig });
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft when opened
  React.useEffect(() => {
    if (isCalendarSettingsOpen) {
      setConfigDraft(JSON.parse(JSON.stringify(calendarConfig)));
    }
  }, [isCalendarSettingsOpen, calendarConfig]);

  if (!isCalendarSettingsOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCalendarConfig(configDraft);
      setIsCalendarSettingsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMonth = () => {
    const newMonth: CalendarMonth = {
      id: `m_${Date.now()}`,
      name: `Novo Mês ${configDraft.months.length + 1}`,
      days: 30,
      season: 'summer',
    };
    setConfigDraft((prev) => ({
      ...prev,
      months: [...prev.months, newMonth],
    }));
  };

  const handleRemoveMonth = (index: number) => {
    setConfigDraft((prev) => ({
      ...prev,
      months: prev.months.filter((_, idx) => idx !== index),
    }));
  };

  const handleMonthChange = (index: number, field: keyof CalendarMonth, value: any) => {
    setConfigDraft((prev) => {
      const nextMonths = [...prev.months];
      nextMonths[index] = { ...nextMonths[index], [field]: value };
      return { ...prev, months: nextMonths };
    });
  };

  const handleAddMoon = () => {
    const newMoon: CalendarMoon = {
      id: `moon_${Date.now()}`,
      name: `Lua ${configDraft.moons.length + 1}`,
      cycleInDays: 28,
      phaseShiftDays: 0,
      color: '#fef08a',
      tidalStrength: 'moderate',
    };
    setConfigDraft((prev) => ({
      ...prev,
      moons: [...prev.moons, newMoon],
    }));
  };

  const handleRemoveMoon = (index: number) => {
    setConfigDraft((prev) => ({
      ...prev,
      moons: prev.moons.filter((_, idx) => idx !== index),
    }));
  };

  const handleMoonChange = (index: number, field: keyof CalendarMoon, value: any) => {
    setConfigDraft((prev) => {
      const nextMoons = [...prev.moons];
      nextMoons[index] = { ...nextMoons[index], [field]: value };
      return { ...prev, moons: nextMoons };
    });
  };

  const handleAddHoliday = () => {
    const newHol: CalendarHoliday = {
      id: `hol_${Date.now()}`,
      name: 'Novo Festival',
      monthIndex: 0,
      day: 1,
      description: 'Celebração festiva.',
      isRecurring: true,
    };
    setConfigDraft((prev) => ({
      ...prev,
      holidays: [...prev.holidays, newHol],
    }));
  };

  const handleRemoveHoliday = (index: number) => {
    setConfigDraft((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((_, idx) => idx !== index),
    }));
  };

  const handleHolidayChange = (index: number, field: keyof CalendarHoliday, value: any) => {
    setConfigDraft((prev) => {
      const nextHols = [...prev.holidays];
      nextHols[index] = { ...nextHols[index], [field]: value };
      return { ...prev, holidays: nextHols };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f141d] border border-[#2a3449] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a3449] bg-[#121824]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Configuração do Calendário de Campanha
              </h2>
              <p className="text-xs text-slate-400">
                Personalize meses, semanas, luas, marés e festivais do seu universo.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCalendarSettingsOpen(false)}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2a3449] bg-[#0c1017] px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'general' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Geral & Presets
          </button>
          <button
            onClick={() => setActiveTab('months')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'months' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Meses ({configDraft.months.length})
          </button>
          <button
            onClick={() => setActiveTab('moons')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'moons' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Luas & Satélites ({configDraft.moons.length})
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'holidays' ? 'border-rose-400 text-rose-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Festivais & Feriados ({configDraft.holidays.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Presets Rápidos */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Carregar Preset de Cenário
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setConfigDraft(JSON.parse(JSON.stringify(CALENDAR_PRESETS.harptos)));
                    }}
                    className="p-3 bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 rounded-xl text-left transition-all"
                  >
                    <div className="text-xs font-bold text-amber-300">Harptos (Faerûn / 5e)</div>
                    <div className="text-[11px] text-slate-400 mt-1">12 meses de 30d + 5 festivais intercalares</div>
                  </button>

                  <button
                    onClick={() => {
                      setConfigDraft(JSON.parse(JSON.stringify(CALENDAR_PRESETS.greyhawk)));
                    }}
                    className="p-3 bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 rounded-xl text-left transition-all"
                  >
                    <div className="text-xs font-bold text-indigo-300">Greyhawk (Flanaess)</div>
                    <div className="text-[11px] text-slate-400 mt-1">12 meses de 28d + 4 semanas de festival + 2 luas</div>
                  </button>

                  <button
                    onClick={() => {
                      setConfigDraft(JSON.parse(JSON.stringify(CALENDAR_PRESETS.gregorian)));
                    }}
                    className="p-3 bg-[#121824] hover:bg-[#1a2334] border border-[#2a3449] hover:border-amber-500/40 rounded-xl text-left transition-all"
                  >
                    <div className="text-xs font-bold text-emerald-300">Padrão Solar (12 Meses)</div>
                    <div className="text-[11px] text-slate-400 mt-1">Calendário terrestre convencional de 365 dias</div>
                  </button>
                </div>
              </div>

              {/* General Fields */}
              <div className="grid grid-cols-2 gap-4 bg-[#121824] border border-[#2a3449] p-4 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nome do Calendário</label>
                  <input
                    type="text"
                    value={configDraft.name}
                    onChange={(e) => setConfigDraft({ ...configDraft, name: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Sufixo do Ano / Era</label>
                  <input
                    type="text"
                    value={configDraft.yearSuffix}
                    onChange={(e) => setConfigDraft({ ...configDraft, yearSuffix: e.target.value })}
                    placeholder="Ex: DR, T.E., CY, D.F."
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'months' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Defina os meses e festivais intercalares (dias especiais fora de meses regulares).
                </p>
                <button
                  onClick={handleAddMonth}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-lg border border-amber-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Mês
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {configDraft.months.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl grid grid-cols-12 gap-2 items-center"
                  >
                    <span className="col-span-1 text-xs font-bold text-slate-500 text-center font-mono">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleMonthChange(idx, 'name', e.target.value)}
                      placeholder="Nome do Mês"
                      className="col-span-4 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <div className="col-span-2 flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={m.days}
                        onChange={(e) => handleMonthChange(idx, 'days', parseInt(e.target.value) || 1)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-100 text-center font-mono"
                      />
                      <span className="text-[10px] text-slate-400">dias</span>
                    </div>
                    <select
                      value={m.season || 'summer'}
                      onChange={(e) => handleMonthChange(idx, 'season', e.target.value)}
                      className="col-span-2 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300"
                    >
                      <option value="spring">Primavera</option>
                      <option value="summer">Verão</option>
                      <option value="autumn">Outono</option>
                      <option value="winter">Inverno</option>
                    </select>
                    <label className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.isIntercalary || false}
                        onChange={(e) => handleMonthChange(idx, 'isIntercalary', e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-amber-500"
                      />
                      <span>Intercalar</span>
                    </label>
                    <button
                      onClick={() => handleRemoveMonth(idx)}
                      className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                      title="Excluir Mês"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'moons' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Configure os satélites celestes do mundo, seus ciclos orbitais e influência nas marés.
                </p>
                <button
                  onClick={handleAddMoon}
                  className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-lg border border-cyan-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Lua
                </button>
              </div>

              <div className="space-y-2">
                {configDraft.moons.map((moon, idx) => (
                  <div
                    key={moon.id || idx}
                    className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl grid grid-cols-12 gap-3 items-center"
                  >
                    <input
                      type="text"
                      value={moon.name}
                      onChange={(e) => handleMoonChange(idx, 'name', e.target.value)}
                      placeholder="Nome da Lua (ex: Selûne)"
                      className="col-span-4 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                    <div className="col-span-3 flex items-center gap-1">
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={moon.cycleInDays}
                        onChange={(e) => handleMoonChange(idx, 'cycleInDays', parseFloat(e.target.value) || 28)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-100 text-center font-mono"
                      />
                      <span className="text-[10px] text-slate-400">dias/órbita</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <input
                        type="color"
                        value={moon.color}
                        onChange={(e) => handleMoonChange(idx, 'color', e.target.value)}
                        className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400">Cor</span>
                    </div>
                    <select
                      value={moon.tidalStrength || 'moderate'}
                      onChange={(e) => handleMoonChange(idx, 'tidalStrength', e.target.value)}
                      className="col-span-2 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300"
                    >
                      <option value="none">Sem Maré</option>
                      <option value="moderate">Maré Média</option>
                      <option value="strong">Maré Forte</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMoon(idx)}
                      className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'holidays' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Cadastre festividades, rituais cósmicos e feriados anuais do calendário.
                </p>
                <button
                  onClick={handleAddHoliday}
                  className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Festival
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {configDraft.holidays.map((h, idx) => (
                  <div
                    key={h.id || idx}
                    className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl grid grid-cols-12 gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={h.name}
                      onChange={(e) => handleHolidayChange(idx, 'name', e.target.value)}
                      placeholder="Nome do Festival"
                      className="col-span-4 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1 text-xs text-slate-100"
                    />
                    <select
                      value={h.monthIndex}
                      onChange={(e) => handleHolidayChange(idx, 'monthIndex', parseInt(e.target.value) || 0)}
                      className="col-span-3 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300"
                    >
                      {configDraft.months.map((m, mIdx) => (
                        <option key={m.id || mIdx} value={mIdx}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <div className="col-span-2 flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={h.day}
                        onChange={(e) => handleHolidayChange(idx, 'day', parseInt(e.target.value) || 1)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-100 text-center font-mono"
                      />
                      <span className="text-[10px] text-slate-400">Dia</span>
                    </div>
                    <input
                      type="text"
                      value={h.description}
                      onChange={(e) => handleHolidayChange(idx, 'description', e.target.value)}
                      placeholder="Descrição / Tradição"
                      className="col-span-2 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300"
                    />
                    <button
                      onClick={() => handleRemoveHoliday(idx)}
                      className="col-span-1 text-slate-500 hover:text-rose-400 flex justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a3449] bg-[#121824]">
          <button
            onClick={() => setIsCalendarSettingsOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
