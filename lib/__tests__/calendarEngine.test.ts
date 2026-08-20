import { describe, it, expect } from 'vitest';
import {
  getTotalDaysInYear,
  getDaysInMonth,
  dateToAbsoluteDays,
  absoluteDaysToDate,
  calculateMoonPhases,
  calculateTide,
  calculateInGameDateTime,
  advanceInGameTime,
  getHolidayForDate,
} from '@/lib/calendar/calendarEngine';
import { HARPTOS_CALENDAR, GREYHAWK_CALENDAR, GREGORIAN_CALENDAR } from '@/lib/calendar/calendarPresets';
import { calculateTravel } from '@/lib/calendar/travelCalculator';
import { CampaignCalendarState } from '@/lib/types/calendar';

describe('Calendar Engine - Astronomical & Temporal Calculations', () => {
  it('deve calcular o total de dias no ano para o Calendário de Harptos (365 dias)', () => {
    // 12 meses de 30 dias (360) + 5 festivais intercalares de 1 dia = 365 dias
    const totalDays = getTotalDaysInYear(HARPTOS_CALENDAR);
    expect(totalDays).toBe(365);
  });

  it('deve converter data para dias absolutos e voltar com precisão bidirecional', () => {
    const year = 1492;
    const monthIndex = 8; // Flamerule
    const day = 15;

    const absDays = dateToAbsoluteDays(HARPTOS_CALENDAR, year, monthIndex, day);
    const converted = absoluteDaysToDate(HARPTOS_CALENDAR, absDays);

    expect(converted.year).toBe(year);
    expect(converted.monthIndex).toBe(monthIndex);
    expect(converted.day).toBe(day);
  });

  it('deve avançar o relógio in-game corretamente atravessando a meia-noite', () => {
    const initialState: CampaignCalendarState = {
      currentYear: 1492,
      currentMonthIndex: 0,
      currentDay: 10,
      currentHour: 22,
      currentMinute: 30,
      totalDaysElapsed: dateToAbsoluteDays(HARPTOS_CALENDAR, 1492, 0, 10),
    };

    // Avança 8 horas (Descanso Longo: 22:30 -> 06:30 do dia seguinte)
    const nextState = advanceInGameTime(HARPTOS_CALENDAR, initialState, 8 * 60);

    expect(nextState.currentDay).toBe(11);
    expect(nextState.currentHour).toBe(6);
    expect(nextState.currentMinute).toBe(30);
  });

  it('deve calcular fases lunares para Selûne com base no ciclo orbital', () => {
    const moonsDay0 = calculateMoonPhases(HARPTOS_CALENDAR, 0);
    expect(moonsDay0[0].phase).toBe('new_moon');
    expect(moonsDay0[0].illuminationPercentage).toBe(0);

    // Na metade do ciclo de 30.43 dias (~15.2 dias), Selûne deve ser Lua Cheia (100%)
    const moonsMidCycle = calculateMoonPhases(HARPTOS_CALENDAR, 15.2);
    expect(moonsMidCycle[0].phase).toBe('full_moon');
    expect(moonsMidCycle[0].illuminationPercentage).toBeGreaterThanOrEqual(98);
  });

  it('deve calcular maré viva (spring tide) durante Lua Cheia ou Lua Nova', () => {
    const fullMoonPhases = calculateMoonPhases(HARPTOS_CALENDAR, 15.2);
    const tide = calculateTide(fullMoonPhases);
    expect(tide.state).toBe('spring_tide');
  });

  it('deve identificar feriados registrados na data correta', () => {
    // Greengrass (Relvaverde) no mês 5 (índice 5), dia 1
    const holiday = getHolidayForDate(HARPTOS_CALENDAR, 5, 1);
    expect(holiday).toBeDefined();
    expect(holiday?.name).toContain('Relvaverde');
  });

  it('deve formatar data in-game completa', () => {
    const state: CampaignCalendarState = {
      currentYear: 1492,
      currentMonthIndex: 12, // Eleint
      currentDay: 14,
      currentHour: 16,
      currentMinute: 30,
      totalDaysElapsed: dateToAbsoluteDays(HARPTOS_CALENDAR, 1492, 12, 14),
    };

    const dt = calculateInGameDateTime(HARPTOS_CALENDAR, state);
    expect(dt.formattedDate).toContain('14 de Eleint (O Desvanecer), 1492');
    expect(dt.formattedTime).toBe('16:30');
    expect(dt.isNight).toBe(false);
  });
});

describe('Travel Calculator (D&D 5e Travel Pace & Terrain)', () => {
  it('deve calcular 1 dia de marcha normal em estrada para 24 milhas', () => {
    const res = calculateTravel({
      distanceMiles: 24,
      pace: 'normal',
      terrain: 'road',
      mode: 'foot',
      hoursPerDay: 8,
      partyMembersCount: 4,
    });

    expect(res.daysRequired).toBe(1);
    expect(res.totalHours).toBe(8);
    expect(res.rationsConsumed).toBe(4);
    expect(res.forcedMarchHours).toBe(0);
  });

  it('deve dobrar o tempo de viagem em montanhas ou pântanos (terreno difícil 2.0x)', () => {
    const res = calculateTravel({
      distanceMiles: 24,
      pace: 'normal',
      terrain: 'mountains',
      mode: 'foot',
      hoursPerDay: 8,
      partyMembersCount: 4,
    });

    // Em montanhas (2.0x), 24 milhas levam 16h de marcha (2 dias)
    expect(res.daysRequired).toBe(2);
    expect(res.totalHours).toBe(16);
    expect(res.rationsConsumed).toBe(8);
  });

  it('deve acusar marcha forçada se marchar mais de 8 horas por dia', () => {
    const res = calculateTravel({
      distanceMiles: 30,
      pace: 'fast',
      terrain: 'road',
      mode: 'foot',
      hoursPerDay: 10,
      partyMembersCount: 4,
    });

    expect(res.forcedMarchHours).toBe(2);
    expect(res.forcedMarchConSaveDC).toBe(12); // 10 + 2h
  });
});
