'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  CampaignCalendarConfig,
  CampaignCalendarState,
  InGameDateTime,
  CalendarEventNote,
  TravelCalculationParams,
} from '@/lib/types/calendar';
import { DEFAULT_CALENDAR_CONFIG, CALENDAR_PRESETS } from '@/lib/calendar/calendarPresets';
import {
  calculateInGameDateTime,
  advanceInGameTime,
  dateToAbsoluteDays,
} from '@/lib/calendar/calendarEngine';
import { calculateTravel } from '@/lib/calendar/travelCalculator';
import { calendarService } from '@/lib/services/calendarService';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { toast } from 'sonner';

interface CalendarContextType {
  calendarConfig: CampaignCalendarConfig;
  calendarState: CampaignCalendarState;
  currentDateTime: InGameDateTime;
  calendarNotes: CalendarEventNote[];
  isLoading: boolean;
  
  // Ações de tempo e descanso
  advanceTime: (minutes: number, reason?: string, shouldCreateFeedLog?: boolean) => Promise<void>;
  performRest: (
    type: 'short' | 'long',
    customHours?: number,
    consumeRations?: boolean
  ) => Promise<{ summary: string; rationsConsumed: number; advanceHours: number }>;
  performTravel: (
    params: TravelCalculationParams,
    travelReason?: string
  ) => Promise<{ summary: string; daysElapsed: number }>;
  setInGameDate: (year: number, monthIndex: number, day: number, hour?: number, minute?: number) => Promise<void>;
  
  // Configuração & Presets
  updateCalendarConfig: (config: CampaignCalendarConfig) => Promise<void>;
  applyPreset: (presetKey: 'harptos' | 'greyhawk' | 'gregorian') => Promise<void>;
  
  // Notas e Crônica
  createCalendarNote: (note: Omit<CalendarEventNote, 'id' | 'createdAt' | 'campaignId'>) => Promise<CalendarEventNote | null>;
  deleteCalendarNote: (id: string) => Promise<void>;

  // Modais de UI
  isRestModalOpen: boolean;
  setIsRestModalOpen: (open: boolean) => void;
  isTimeAdvanceModalOpen: boolean;
  setIsTimeAdvanceModalOpen: (open: boolean) => void;
  isCalendarSettingsOpen: boolean;
  setIsCalendarSettingsOpen: (open: boolean) => void;
  isDayModalOpen: boolean;
  setIsDayModalOpen: (open: boolean) => void;
  selectedDayForModal: { monthIndex: number; day: number } | null;
  setSelectedDayForModal: (dayInfo: { monthIndex: number; day: number } | null) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeCampaign, createFeedEvent } = useCampaign();
  const campaignId = activeCampaign?.id || '';

  const [calendarConfig, setCalendarConfig] = useState<CampaignCalendarConfig>(DEFAULT_CALENDAR_CONFIG);
  const [calendarState, setCalendarState] = useState<CampaignCalendarState>({
    currentYear: DEFAULT_CALENDAR_CONFIG.startingYear,
    currentMonthIndex: DEFAULT_CALENDAR_CONFIG.startingMonthIndex,
    currentDay: DEFAULT_CALENDAR_CONFIG.startingDay,
    currentHour: DEFAULT_CALENDAR_CONFIG.startingHour,
    currentMinute: DEFAULT_CALENDAR_CONFIG.startingMinute,
    totalDaysElapsed: dateToAbsoluteDays(
      DEFAULT_CALENDAR_CONFIG,
      DEFAULT_CALENDAR_CONFIG.startingYear,
      DEFAULT_CALENDAR_CONFIG.startingMonthIndex,
      DEFAULT_CALENDAR_CONFIG.startingDay
    ),
  });
  const [calendarNotes, setCalendarNotes] = useState<CalendarEventNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modais State
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isTimeAdvanceModalOpen, setIsTimeAdvanceModalOpen] = useState(false);
  const [isCalendarSettingsOpen, setIsCalendarSettingsOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<{ monthIndex: number; day: number } | null>(null);

  // Carregar dados estritamente isolados da campanha ativa
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function load() {
      if (!campaignId) {
        if (isMounted) {
          setCalendarConfig(DEFAULT_CALENDAR_CONFIG);
          setCalendarState({
            currentYear: DEFAULT_CALENDAR_CONFIG.startingYear,
            currentMonthIndex: DEFAULT_CALENDAR_CONFIG.startingMonthIndex,
            currentDay: DEFAULT_CALENDAR_CONFIG.startingDay,
            currentHour: DEFAULT_CALENDAR_CONFIG.startingHour,
            currentMinute: DEFAULT_CALENDAR_CONFIG.startingMinute,
            totalDaysElapsed: dateToAbsoluteDays(
              DEFAULT_CALENDAR_CONFIG,
              DEFAULT_CALENDAR_CONFIG.startingYear,
              DEFAULT_CALENDAR_CONFIG.startingMonthIndex,
              DEFAULT_CALENDAR_CONFIG.startingDay
            ),
          });
          setCalendarNotes([]);
          setIsLoading(false);
        }
        return;
      }

      // Limpar notas anteriores antes do carregamento da nova campanha
      setCalendarNotes([]);

      const [configRes, stateRes, notesRes] = await Promise.all([
        calendarService.fetchCalendarConfig(campaignId),
        calendarService.fetchCalendarState(campaignId, DEFAULT_CALENDAR_CONFIG),
        calendarService.fetchCalendarNotes(campaignId),
      ]);

      if (!isMounted) return;

      const loadedConfig = configRes.ok && configRes.value ? configRes.value : DEFAULT_CALENDAR_CONFIG;
      setCalendarConfig(loadedConfig);

      if (stateRes.ok && stateRes.value) {
        setCalendarState(stateRes.value);
      } else {
        setCalendarState({
          currentYear: loadedConfig.startingYear,
          currentMonthIndex: loadedConfig.startingMonthIndex,
          currentDay: loadedConfig.startingDay,
          currentHour: loadedConfig.startingHour,
          currentMinute: loadedConfig.startingMinute,
          totalDaysElapsed: dateToAbsoluteDays(
            loadedConfig,
            loadedConfig.startingYear,
            loadedConfig.startingMonthIndex,
            loadedConfig.startingDay
          ),
        });
      }

      if (notesRes.ok && Array.isArray(notesRes.value)) {
        setCalendarNotes(notesRes.value);
      } else {
        setCalendarNotes([]);
      }

      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  // Tempo derivado atualizado em tempo real
  const currentDateTime = useMemo(() => {
    return calculateInGameDateTime(calendarConfig, calendarState);
  }, [calendarConfig, calendarState]);

  // Avançar Tempo com registro in-game opcional
  const advanceTime = useCallback(
    async (minutes: number, reason = 'Passagem de Tempo', shouldCreateFeedLog = true) => {
      const nextState = advanceInGameTime(calendarConfig, calendarState, minutes);
      setCalendarState(nextState);

      const nextDt = calculateInGameDateTime(calendarConfig, nextState);

      // Salvar estado
      calendarService.saveCalendarState(campaignId, nextState);

      if (shouldCreateFeedLog && createFeedEvent && activeCampaign?.id) {
        const hoursPassed = (minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1);
        await createFeedEvent({
          campaignId: activeCampaign.id,
          eventType: 'session_recap',
          title: `⏳ ${reason} (+${hoursPassed}h)`,
          summary: `O tempo avançou para **${nextDt.formattedFull}** (${nextDt.seasonLabel}, ${nextDt.moons.map((m) => `${m.moonName}: ${m.phaseLabel}`).join(', ')}).`,
          details: {
            minutesAdded: minutes,
            inGameDate: nextDt.formattedDate,
            inGameTime: nextDt.formattedTime,
            season: nextDt.seasonLabel,
          },
          inGameDate: nextDt.formattedFull,
          isPublic: true,
        });
      }
    },
    [calendarConfig, calendarState, campaignId, createFeedEvent, activeCampaign]
  );

  // Executar Descanso Curto ou Longo
  const performRest = useCallback(
    async (type: 'short' | 'long', customHours?: number, consumeRations = true) => {
      const hours = customHours || (type === 'short' ? 1 : 8);
      const minutes = hours * (calendarConfig.minutesInHour || 60);
      const nextState = advanceInGameTime(calendarConfig, calendarState, minutes);
      setCalendarState(nextState);

      const nextDt = calculateInGameDateTime(calendarConfig, nextState);
      await calendarService.saveCalendarState(campaignId, nextState);

      const partyCount = activeCampaign?.partyMembers?.length || 4;
      const rationsConsumed = type === 'long' && consumeRations ? partyCount : 0;

      const restLabel = type === 'short' ? 'Descanso Curto (1h)' : 'Descanso Longo (8h)';
      const summary = `A party concluiu um **${restLabel}**. Nova data no mundo: **${nextDt.formattedFull}**.${
        rationsConsumed > 0 ? ` Consumidas ${rationsConsumed} rações do grupo.` : ''
      }`;

      // Gravar Nota do Calendário
      await calendarService.createCalendarNote({
        campaignId,
        year: nextDt.year,
        monthIndex: nextDt.monthIndex,
        day: nextDt.day,
        hour: nextDt.hour,
        minute: nextDt.minute,
        title: `🌙 ${restLabel}`,
        content: summary,
        category: 'rest',
        authorRole: 'dm',
      });

      // Atualizar lista de notas
      calendarService.fetchCalendarNotes(campaignId).then((res) => {
        if (res.ok) setCalendarNotes(res.value);
      });

      // Gravar no Feed da Campanha
      if (createFeedEvent && activeCampaign?.id) {
        await createFeedEvent({
          campaignId: activeCampaign.id,
          eventType: 'milestone',
          title: `🌙 ${restLabel} Efetuado`,
          summary,
          details: {
            restType: type,
            hours,
            rationsConsumed,
            inGameDate: nextDt.formattedFull,
          },
          inGameDate: nextDt.formattedFull,
          isPublic: true,
        });
      }

      toast.success(`${restLabel} concluído com sucesso!`);

      return { summary, rationsConsumed, advanceHours: hours };
    },
    [calendarConfig, calendarState, campaignId, activeCampaign, createFeedEvent]
  );

  // Executar Viagem
  const performTravel = useCallback(
    async (params: TravelCalculationParams, travelReason = 'Viagem da Party') => {
      const travelRes = calculateTravel(params);
      const minutes = travelRes.daysRequired * (calendarConfig.hoursInDay || 24) * (calendarConfig.minutesInHour || 60);

      const nextState = advanceInGameTime(calendarConfig, calendarState, minutes);
      setCalendarState(nextState);

      const nextDt = calculateInGameDateTime(calendarConfig, nextState);
      await calendarService.saveCalendarState(campaignId, nextState);

      // Gravar Nota do Calendário
      await calendarService.createCalendarNote({
        campaignId,
        year: nextDt.year,
        monthIndex: nextDt.monthIndex,
        day: nextDt.day,
        hour: nextDt.hour,
        minute: nextDt.minute,
        title: `🧭 ${travelReason} (${travelRes.daysRequired}d)`,
        content: `${travelRes.summaryText} — Rumo concluído em **${nextDt.formattedFull}**.`,
        category: 'travel',
        authorRole: 'dm',
      });

      // Atualizar notas locais
      calendarService.fetchCalendarNotes(campaignId).then((res) => {
        if (res.ok) setCalendarNotes(res.value);
      });

      // Gravar no Feed
      if (createFeedEvent && activeCampaign?.id) {
        await createFeedEvent({
          campaignId: activeCampaign.id,
          eventType: 'session_recap',
          title: `🧭 Viagem: ${travelReason}`,
          summary: `${travelRes.summaryText} Chegada registrada em **${nextDt.formattedFull}**. Consumo estimado: ${travelRes.rationsConsumed} rações e ${travelRes.waterGallonsConsumed} galões de água.`,
          details: {
            ...params,
            ...travelRes,
            inGameDate: nextDt.formattedFull,
          },
          inGameDate: nextDt.formattedFull,
          isPublic: true,
        });
      }

      toast.success(`Viagem concluída (+${travelRes.daysRequired} dias)!`);
      return { summary: travelRes.summaryText, daysElapsed: travelRes.daysRequired };
    },
    [calendarConfig, calendarState, campaignId, activeCampaign, createFeedEvent]
  );

  // Definir data manualmente
  const setInGameDate = useCallback(
    async (year: number, monthIndex: number, day: number, hour = 8, minute = 0) => {
      const nextAbsDays = dateToAbsoluteDays(calendarConfig, year, monthIndex, day);
      const nextState: CampaignCalendarState = {
        currentYear: year,
        currentMonthIndex: monthIndex,
        currentDay: day,
        currentHour: hour,
        currentMinute: minute,
        totalDaysElapsed: nextAbsDays,
      };

      setCalendarState(nextState);
      await calendarService.saveCalendarState(campaignId, nextState);
      toast.success('Data in-game atualizada!');
    },
    [calendarConfig, campaignId]
  );

  // Atualizar Configuração
  const updateCalendarConfig = useCallback(
    async (newConfig: CampaignCalendarConfig) => {
      setCalendarConfig(newConfig);
      await calendarService.saveCalendarConfig(campaignId, newConfig);

      // Recalcula o total de dias para manter a consistência
      const nextAbsDays = dateToAbsoluteDays(
        newConfig,
        calendarState.currentYear,
        calendarState.currentMonthIndex,
        calendarState.currentDay
      );
      const nextState: CampaignCalendarState = {
        ...calendarState,
        totalDaysElapsed: nextAbsDays,
      };
      setCalendarState(nextState);
      await calendarService.saveCalendarState(campaignId, nextState);

      toast.success('Configurações do calendário salvas com sucesso!');
    },
    [calendarState, campaignId]
  );

  // Aplicar Preset
  const applyPreset = useCallback(
    async (presetKey: 'harptos' | 'greyhawk' | 'gregorian') => {
      const preset = CALENDAR_PRESETS[presetKey];
      if (preset) {
        await updateCalendarConfig(preset);
        await setInGameDate(
          preset.startingYear,
          preset.startingMonthIndex,
          preset.startingDay,
          preset.startingHour,
          preset.startingMinute
        );
        toast.success(`Preset "${preset.name}" aplicado!`);
      }
    },
    [updateCalendarConfig, setInGameDate]
  );

  // Criar Nota
  const createCalendarNote = useCallback(
    async (noteData: Omit<CalendarEventNote, 'id' | 'createdAt' | 'campaignId'>) => {
      const res = await calendarService.createCalendarNote({
        ...noteData,
        campaignId,
      });
      if (res.ok) {
        setCalendarNotes((prev) => [...prev, res.value]);
        toast.success('Nota registrada no calendário!');
        return res.value;
      } else {
        toast.error(res.error.message);
        return null;
      }
    },
    [campaignId]
  );

  // Excluir Nota
  const deleteCalendarNote = useCallback(
    async (id: string) => {
      const res = await calendarService.deleteCalendarNote(id, campaignId);
      if (res.ok) {
        setCalendarNotes((prev) => prev.filter((n) => n.id !== id));
        toast.success('Registro removido do calendário.');
      } else {
        toast.error(res.error.message);
      }
    },
    [campaignId]
  );

  return (
    <CalendarContext.Provider
      value={{
        calendarConfig,
        calendarState,
        currentDateTime,
        calendarNotes,
        isLoading,
        advanceTime,
        performRest,
        performTravel,
        setInGameDate,
        updateCalendarConfig,
        applyPreset,
        createCalendarNote,
        deleteCalendarNote,
        isRestModalOpen,
        setIsRestModalOpen,
        isTimeAdvanceModalOpen,
        setIsTimeAdvanceModalOpen,
        isCalendarSettingsOpen,
        setIsCalendarSettingsOpen,
        isDayModalOpen,
        setIsDayModalOpen,
        selectedDayForModal,
        setSelectedDayForModal,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCampaignCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCampaignCalendar must be used within a CalendarProvider');
  }
  return context;
};

export const useCalendar = useCampaignCalendar;
