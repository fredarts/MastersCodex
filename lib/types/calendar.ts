export type MoonPhase =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export type TideState = 'low_tide' | 'high_tide' | 'spring_tide' | 'neap_tide';

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface CalendarMonth {
  id: string;
  name: string;
  days: number;
  season?: SeasonName;
  isIntercalary?: boolean; // Dias ou períodos de festival que caem entre meses (ex: Midwinter em Harptos)
  description?: string;
}

export interface CalendarMoon {
  id: string;
  name: string;
  cycleInDays: number;       // Ex: 30.43 dias para Selûne
  phaseShiftDays: number;     // Offset para alinhar a fase no Dia Zero
  color: string;             // Cor visual (#fef08a, #93c5fd, #f87171, etc.)
  tidalStrength?: 'none' | 'moderate' | 'strong';
}

export interface CalendarHoliday {
  id: string;
  name: string;
  monthIndex: number;        // Índice do mês no array de meses
  day: number;               // Dia do mês (1-indexed)
  description: string;
  icon?: string;
  isRecurring: boolean;
}

export interface CampaignCalendarConfig {
  id: string;
  presetKey?: 'harptos' | 'greyhawk' | 'gregorian' | 'custom';
  name: string;
  yearSuffix: string;        // Ex: "DR", "T.E.", "D.F.", "Ano dos Dragões"
  daysOfWeek: string[];      // Ex: ["Primeiro-Dia", "Segundo-Dia", ...] ou Decêndios de Harptos
  hoursInDay: number;        // Padrão 24
  minutesInHour: number;     // Padrão 60
  months: CalendarMonth[];
  moons: CalendarMoon[];
  holidays: CalendarHoliday[];
  startingYear: number;
  startingMonthIndex: number;
  startingDay: number;
  startingHour: number;
  startingMinute: number;
}

export interface MoonPhaseInfo {
  moonId: string;
  moonName: string;
  phase: MoonPhase;
  phaseLabel: string;
  color: string;
  illuminationPercentage: number;
}

export interface InGameDateTime {
  year: number;
  monthIndex: number;
  monthName: string;
  day: number;               // 1-indexed dentro do mês
  dayOfWeekName: string;
  dayOfYear: number;         // Dia total dentro do ano
  totalDaysElapsed: number;  // Dias absolutos desde a época
  hour: number;              // 0-23
  minute: number;            // 0-59
  formattedDate: string;     // Ex: "14 de Eleint, 1492 DR"
  formattedTime: string;     // Ex: "16:30"
  formattedFull: string;     // Ex: "14 de Eleint, 1492 DR — 16:30"
  season?: SeasonName;
  seasonLabel: string;
  isNight: boolean;
  timeOfDayCategory: 'dawn' | 'day' | 'sunset' | 'night';
  moons: MoonPhaseInfo[];
  tide?: { state: TideState; label: string };
  holiday?: CalendarHoliday;
}

export interface CampaignCalendarState {
  currentYear: number;
  currentMonthIndex: number;
  currentDay: number;
  currentHour: number;
  currentMinute: number;
  totalDaysElapsed: number;
  currentWeather?: string;
}

export interface CalendarEventNote {
  id: string;
  campaignId: string;
  year: number;
  monthIndex: number;
  day: number;
  hour?: number;
  minute?: number;
  title: string;
  content: string;
  category: 'session_log' | 'rest' | 'travel' | 'quest_deadline' | 'world_event' | 'holiday' | 'note';
  authorRole: 'dm' | 'player';
  sessionId?: string;
  sceneId?: string;
  isCompleted?: boolean;
  createdAt?: string;
}

export type TravelPace = 'slow' | 'normal' | 'fast';
export type TravelTerrain = 'road' | 'plains' | 'forest' | 'hills' | 'mountains' | 'swamp' | 'desert' | 'underdark' | 'sea';
export type TravelMode = 'foot' | 'horseback' | 'cart' | 'carriage' | 'sailing_ship' | 'flying';

export interface TravelCalculationParams {
  distanceMiles: number;
  pace: TravelPace;
  terrain: TravelTerrain;
  mode: TravelMode;
  hoursPerDay?: number;      // Padrão 8 horas de marcha
  partyMembersCount?: number;
}

export interface TravelCalculationResult {
  daysRequired: number;
  totalHours: number;
  rationsConsumed: number;
  waterGallonsConsumed: number;
  forcedMarchHours: number;
  forcedMarchConSaveDC?: number;
  summaryText: string;
}
