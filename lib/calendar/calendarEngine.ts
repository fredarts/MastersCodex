import {
  CampaignCalendarConfig,
  CampaignCalendarState,
  InGameDateTime,
  MoonPhase,
  MoonPhaseInfo,
  SeasonName,
  TideState,
  CalendarHoliday,
} from '@/lib/types/calendar';

const MOON_PHASE_LABELS: Record<MoonPhase, string> = {
  new_moon: 'Lua Nova',
  waxing_crescent: 'Crescente Côncava',
  first_quarter: 'Quarto Crescente',
  waxing_gibbous: 'Gibosa Crescente',
  full_moon: 'Lua Cheia',
  waning_gibbous: 'Gibosa Minguante',
  last_quarter: 'Quarto Minguante',
  waning_crescent: 'Minguante Côncava',
};

const SEASON_LABELS: Record<SeasonName, string> = {
  spring: 'Primavera',
  summer: 'Verão',
  autumn: 'Outono',
  winter: 'Inverno',
};

export function getTotalDaysInYear(config: CampaignCalendarConfig): number {
  if (!config.months || config.months.length === 0) return 365;
  return config.months.reduce((acc, m) => acc + (m.days || 30), 0);
}

export function getDaysInMonth(config: CampaignCalendarConfig, monthIndex: number): number {
  if (!config.months || config.months.length === 0) return 30;
  const safeIdx = ((monthIndex % config.months.length) + config.months.length) % config.months.length;
  return config.months[safeIdx]?.days || 30;
}

export function dateToAbsoluteDays(
  config: CampaignCalendarConfig,
  year: number,
  monthIndex: number,
  day: number
): number {
  const daysPerYear = getTotalDaysInYear(config);
  let daysInCurrentYear = 0;

  const totalMonths = config.months.length || 1;
  const safeMonthIdx = Math.min(Math.max(0, monthIndex), totalMonths - 1);

  for (let i = 0; i < safeMonthIdx; i++) {
    daysInCurrentYear += config.months[i].days;
  }

  daysInCurrentYear += Math.max(1, day) - 1;

  return year * daysPerYear + daysInCurrentYear;
}

export function absoluteDaysToDate(
  config: CampaignCalendarConfig,
  absoluteDays: number
): { year: number; monthIndex: number; day: number; dayOfYear: number } {
  const daysPerYear = getTotalDaysInYear(config);
  const year = Math.floor(absoluteDays / daysPerYear);
  let dayOfYear = ((absoluteDays % daysPerYear) + daysPerYear) % daysPerYear;

  let monthIndex = 0;
  let remainingDays = dayOfYear;

  for (let i = 0; i < config.months.length; i++) {
    const mDays = config.months[i].days;
    if (remainingDays < mDays) {
      monthIndex = i;
      break;
    }
    remainingDays -= mDays;
  }

  const day = remainingDays + 1;

  return { year, monthIndex, day, dayOfYear };
}

export function calculateMoonPhases(
  config: CampaignCalendarConfig,
  totalDaysElapsed: number
): MoonPhaseInfo[] {
  if (!config.moons || config.moons.length === 0) return [];

  return config.moons.map((moon) => {
    const cycle = moon.cycleInDays > 0 ? moon.cycleInDays : 29.5;
    const offset = moon.phaseShiftDays || 0;
    
    // Normalizado de 0.0 até 1.0
    const rawPos = ((totalDaysElapsed + offset) % cycle + cycle) % cycle;
    const normalized = rawPos / cycle;

    let phase: MoonPhase = 'new_moon';
    if (normalized >= 0.9375 || normalized < 0.0625) {
      phase = 'new_moon';
    } else if (normalized >= 0.0625 && normalized < 0.1875) {
      phase = 'waxing_crescent';
    } else if (normalized >= 0.1875 && normalized < 0.3125) {
      phase = 'first_quarter';
    } else if (normalized >= 0.3125 && normalized < 0.4375) {
      phase = 'waxing_gibbous';
    } else if (normalized >= 0.4375 && normalized < 0.5625) {
      phase = 'full_moon';
    } else if (normalized >= 0.5625 && normalized < 0.6875) {
      phase = 'waning_gibbous';
    } else if (normalized >= 0.6875 && normalized < 0.8125) {
      phase = 'last_quarter';
    } else {
      phase = 'waning_crescent';
    }

    // Iluminação de 0% (Nova) até 100% (Cheia)
    const illuminationPercentage = Math.round(
      ((1 - Math.cos(normalized * 2 * Math.PI)) / 2) * 100
    );

    return {
      moonId: moon.id,
      moonName: moon.name,
      phase,
      phaseLabel: MOON_PHASE_LABELS[phase],
      color: moon.color || '#f8fafc',
      illuminationPercentage,
    };
  });
}

export function calculateTide(
  moons: MoonPhaseInfo[]
): { state: TideState; label: string } {
  if (!moons || moons.length === 0) {
    return { state: 'high_tide', label: 'Maré Regular' };
  }

  const primaryMoon = moons[0];
  if (primaryMoon.phase === 'full_moon' || primaryMoon.phase === 'new_moon') {
    return {
      state: 'spring_tide',
      label: 'Maré Viva / Sizígia (Águas Máximas)',
    };
  }

  if (primaryMoon.phase === 'first_quarter' || primaryMoon.phase === 'last_quarter') {
    return {
      state: 'neap_tide',
      label: 'Maré Morta / Quadratura (Águas Mínimas)',
    };
  }

  if (
    primaryMoon.phase === 'waxing_gibbous' ||
    primaryMoon.phase === 'waning_gibbous'
  ) {
    return { state: 'high_tide', label: 'Maré Alta' };
  }

  return { state: 'low_tide', label: 'Maré Baixa' };
}

export function getHolidayForDate(
  config: CampaignCalendarConfig,
  monthIndex: number,
  day: number
): CalendarHoliday | undefined {
  if (!config.holidays) return undefined;
  return config.holidays.find(
    (h) => h.monthIndex === monthIndex && h.day === day
  );
}

export function getTimeOfDayCategory(hour: number): 'dawn' | 'day' | 'sunset' | 'night' {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 18) return 'day';
  if (hour >= 18 && hour < 20) return 'sunset';
  return 'night';
}

export function calculateInGameDateTime(
  config: CampaignCalendarConfig,
  state: CampaignCalendarState
): InGameDateTime {
  const currentMonth = config.months[state.currentMonthIndex] || config.months[0] || { id: 'm1', name: 'Mês 1', days: 30 };
  
  const totalDaysElapsed =
    state.totalDaysElapsed !== undefined
      ? state.totalDaysElapsed
      : dateToAbsoluteDays(
          config,
          state.currentYear,
          state.currentMonthIndex,
          state.currentDay
        );

  const daysOfWeek = config.daysOfWeek || ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Dia 6', 'Dia 7'];
  const dayOfWeekIndex = ((totalDaysElapsed % daysOfWeek.length) + daysOfWeek.length) % daysOfWeek.length;
  const dayOfWeekName = daysOfWeek[dayOfWeekIndex];

  let dayOfYear = 0;
  for (let i = 0; i < state.currentMonthIndex; i++) {
    dayOfYear += config.months[i]?.days || 30;
  }
  dayOfYear += state.currentDay;

  const season: SeasonName = currentMonth.season || 'summer';
  const seasonLabel = SEASON_LABELS[season] || 'Estação Padrão';

  const hour = Math.max(0, Math.min(23, state.currentHour || 0));
  const minute = Math.max(0, Math.min(59, state.currentMinute || 0));
  const isNight = hour < 6 || hour >= 19;
  const timeOfDayCategory = getTimeOfDayCategory(hour);

  const formattedDate = currentMonth.isIntercalary
    ? `${currentMonth.name}, ${state.currentYear} ${config.yearSuffix || ''}`.trim()
    : `${state.currentDay} de ${currentMonth.name}, ${state.currentYear} ${config.yearSuffix || ''}`.trim();

  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const formattedFull = `${formattedDate} — ${formattedTime}`;

  const moons = calculateMoonPhases(config, totalDaysElapsed);
  const tide = calculateTide(moons);
  const holiday = getHolidayForDate(config, state.currentMonthIndex, state.currentDay);

  return {
    year: state.currentYear,
    monthIndex: state.currentMonthIndex,
    monthName: currentMonth.name,
    day: state.currentDay,
    dayOfWeekName,
    dayOfYear,
    totalDaysElapsed,
    hour,
    minute,
    formattedDate,
    formattedTime,
    formattedFull,
    season,
    seasonLabel,
    isNight,
    timeOfDayCategory,
    moons,
    tide,
    holiday,
  };
}

export function advanceInGameTime(
  config: CampaignCalendarConfig,
  state: CampaignCalendarState,
  minutesToAdd: number
): CampaignCalendarState {
  const hoursInDay = config.hoursInDay || 24;
  const minutesInHour = config.minutesInHour || 60;

  let totalMinutes = (state.currentHour || 0) * minutesInHour + (state.currentMinute || 0) + minutesToAdd;
  
  let daysDelta = Math.floor(totalMinutes / (hoursInDay * minutesInHour));
  let remainingMinutes = ((totalMinutes % (hoursInDay * minutesInHour)) + (hoursInDay * minutesInHour)) % (hoursInDay * minutesInHour);

  const nextHour = Math.floor(remainingMinutes / minutesInHour);
  const nextMinute = remainingMinutes % minutesInHour;

  const currentAbsDays =
    state.totalDaysElapsed !== undefined
      ? state.totalDaysElapsed
      : dateToAbsoluteDays(
          config,
          state.currentYear,
          state.currentMonthIndex,
          state.currentDay
        );

  const nextAbsDays = currentAbsDays + daysDelta;
  const nextDate = absoluteDaysToDate(config, nextAbsDays);

  return {
    currentYear: nextDate.year,
    currentMonthIndex: nextDate.monthIndex,
    currentDay: nextDate.day,
    currentHour: nextHour,
    currentMinute: nextMinute,
    totalDaysElapsed: nextAbsDays,
    currentWeather: state.currentWeather,
  };
}
